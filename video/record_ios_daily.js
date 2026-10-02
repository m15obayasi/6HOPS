const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { parseArgs, loadDailyChallenge } = require('./youtube/common');
const args = parseArgs(process.argv.slice(2));
const root = path.resolve(__dirname, '..');
const output = path.join(__dirname, 'output');
const derived = path.join(root, 'ios/DerivedData');
function run(command, argv, options = {}) {
    const p = spawnSync(command, argv, { encoding: 'utf8', ...options });
    if (p.status !== 0 || p.error)
        throw new Error(`${command} failed: ${p.stderr || p.error}`);
    return p.stdout;
}
async function record({ locale, date, route, device }) {
    if (process.platform !== 'darwin')
        throw new Error('iPhone recording requires macOS and Xcode.');
    const challenge = loadDailyChallenge(date, locale);
    if (
        route[0] !== challenge.start ||
        route.at(-1) !== challenge.goal ||
        route.length > 7
    )
        throw new Error('Route does not match Daily.');
    fs.mkdirSync(output, { recursive: true });
    const stem = `6HOPS-Daily-Playthrough-${locale.toUpperCase()}-${date}`;
    const raw = path.join(output, `${stem}-ios-raw.mov`);
    const manifest = path.join(output, `${stem}-ios-recording.json`);
    const logPath = path.join(output, `${stem}-ios-test.log`);
    const products = path.join(derived, 'Build/Products');
    const original = fs
        .readdirSync(products)
        .find((f) => f.endsWith('.xctestrun'));
    if (!original) throw new Error('Run build-for-testing first.');
    const testRun = path.join(products, `${stem}.xctestrun`);
    const encoded = Buffer.from(JSON.stringify(route)).toString('base64');
    run('python3', [
        '-c',
        `import plistlib,sys
with open(sys.argv[1],'rb') as f:p=plistlib.load(f)
for k,v in p.items():
 if isinstance(v,dict) and 'TestBundlePath' in v:
  v.setdefault('EnvironmentVariables',{}).update({'SIXHOPS_VIDEO_LOCALE':sys.argv[3],'SIXHOPS_VIDEO_DATE':sys.argv[4],'SIXHOPS_VIDEO_ROUTE':sys.argv[5]})
with open(sys.argv[2],'wb') as f:plistlib.dump(p,f)
`,
        path.join(products, original),
        testRun,
        locale,
        date,
        encoded,
    ]);
    run('xcrun', [
        'simctl',
        'status_bar',
        device,
        'override',
        '--time',
        '9:41',
        '--dataNetwork',
        'wifi',
        '--wifiMode',
        'active',
        '--wifiBars',
        '3',
        '--batteryState',
        'charged',
        '--batteryLevel',
        '100',
    ]);
    fs.rmSync(raw, { force: true });
    let started;
    const recorder = spawn('xcrun', [
        'simctl',
        'io',
        device,
        'recordVideo',
        '--codec=h264',
        raw,
    ]);
    await new Promise((resolve, reject) => {
        const timer = setTimeout(
            () => reject(new Error('Recorder did not start')),
            30000,
        );
        recorder.stderr.on('data', (d) => {
            if (d.toString().includes('Recording started')) {
                started = Date.now() / 1000;
                clearTimeout(timer);
                resolve();
            }
        });
        recorder.on('error', reject);
        recorder.on('exit', (code) => {
            if (!started) {
                clearTimeout(timer);
                reject(new Error(`Recorder exited ${code}`));
            }
        });
    });
    const events = [];
    let pending = '';
    const log = fs.createWriteStream(logPath);
    const test = spawn('xcodebuild', [
        'test-without-building',
        '-xctestrun',
        testRun,
        '-destination',
        `platform=iOS Simulator,id=${device}`,
        '-only-testing:SixHopsUITests/SixHopsUITests/testRecordDailyVideo',
        '-parallel-testing-enabled',
        'NO',
        '-maximum-concurrent-test-simulator-destinations',
        '1',
        '-disable-concurrent-testing',
    ]);
    function read(data) {
        log.write(data);
        pending += data.toString();
        const lines = pending.split('\n');
        pending = lines.pop();
        for (const line of lines) {
            const screen = line.match(/SIXHOPS_SCREEN (\w+) (\d+) ([A-Za-z0-9+/=]+)/);
            if (screen) fs.writeFileSync(path.join(output, `${stem}-${screen[1]}-${screen[2]}.png`), Buffer.from(screen[3], 'base64'));
            const m = line.match(/SIXHOPS_EVENT (\{.*\})/);
            if (m) {
                const e = JSON.parse(m[1]);
                events.push(e);
                console.log(locale, e.stage, e.index);
            }
            if (line.includes('Synthesize event')) {
                const tap = events.at(-1);
                if (tap?.stage === 'tap') tap.realTapEpoch = Date.now() / 1000;
            }
        }
    }
    test.stdout.on('data', read);
    test.stderr.on('data', read);
    const timeout = setTimeout(() => test.kill('SIGTERM'), 8 * 60 * 1000);
    let status;
    try {
        status = await new Promise((resolve, reject) => {
            test.on('exit', resolve);
            test.on('error', reject);
        });
    } finally {
        clearTimeout(timeout);
        recorder.kill('SIGINT');
        await new Promise((resolve) => recorder.on('exit', resolve));
        run('xcrun', ['simctl', 'status_bar', device, 'clear']);
        await new Promise((resolve) => log.end(resolve));
        fs.rmSync(testRun, { force: true });
    }
    if (status !== 0 || !events.some((e) => e.stage === 'done'))
        throw new Error(`Real-app test failed. See ${logPath}`);
    // XCTest resolves a long WebKit accessibility tree before synthesizing a tap.
    // Use its actual input timestamp, not the earlier request marker.
    let tapEvent = null,
        requestedAt = null;
    for (const line of fs.readFileSync(logPath, 'utf8').split('\n')) {
        const marker = line.match(/SIXHOPS_EVENT (\{.*\})/);
        if (marker) {
            const event = JSON.parse(marker[1]);
            tapEvent =
                event.stage === 'tap'
                    ? events.find(
                          (e) => e.stage === 'tap' && e.index === event.index,
                      )
                    : null;
            requestedAt = null;
        }
        const timestamp = line.match(/t =\s*([\d.]+)s/);
        if (tapEvent && timestamp && line.includes('Tap '))
            requestedAt = Number(timestamp[1]);
        if (
            tapEvent &&
            timestamp &&
            requestedAt !== null &&
            line.includes('Synthesize event')
        ) {
            tapEvent.realTapEpoch =
                tapEvent.epoch + Number(timestamp[1]) - requestedAt;
            tapEvent = null;
        }
    }
    if (
        events
            .filter((e) => e.stage === 'tap')
            .some((e) => !Number.isFinite(e.realTapEpoch))
    )
        throw new Error('Missing actual tap timing; do not compose.');
    const completeLog = fs.readFileSync(logPath, 'utf8');
    const testStart = completeLog.match(/Start Test at ([\d-]+ [\d:.]+)/);
    if (!testStart) throw new Error('Missing test clock');
    const startEpoch = Date.parse(testStart[1].replace(' ', 'T') + 'Z') / 1000;
    const homeBlock = completeLog.split('\"stage\":\"home\"}')[1]?.split('SIXHOPS_EVENT')[0];
    const departure = homeBlock?.match(/t =\s*([\d.]+)s\s+Synthesize event/);
    if (!departure) throw new Error('Missing actual home departure');
    const homeDepartureEpoch = startEpoch + Number(departure[1]);
    for (const e of events) if (!['tap','done'].includes(e.stage)) e.screenshot = path.join(output, `${stem}-${e.stage}-${e.index}.png`);
    const result = {
        source: 'iphone-simulator',
        date,
        locale,
        route,
        device,
        started,
        homeDepartureEpoch,
        raw,
        events,
        logPath,
    };
    fs.writeFileSync(manifest, JSON.stringify(result, null, 2) + '\n');
    return manifest;
}
if (require.main === module)
    record({
        locale: args.locale,
        date: args.date,
        route: JSON.parse(args.route),
        device: args.device,
    })
        .then(console.log)
        .catch((e) => {
            console.error(e.message);
            process.exitCode = 1;
        });
module.exports = { record };
