const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const root = path.resolve(__dirname, '..');
function run(command, args, options = {}) {
    const r = spawnSync(command, args, { encoding: 'utf8', ...options });
    if (r.status !== 0 || r.error)
        throw new Error(`${command} failed; ${r.stderr || r.error}`);
    return r.stdout;
}
function prepare(requested) {
    if (process.platform !== 'darwin')
        throw new Error('--source ios requires macOS with Xcode.');
    const devices = JSON.parse(
        run('xcrun', ['simctl', 'list', 'devices', 'available', '--json']),
    ).devices;
    const phones = Object.entries(devices)
        .filter(([runtime]) => runtime.includes('.iOS-'))
        .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
        .flatMap(([, list]) => list.filter((d) => d.name.startsWith('iPhone')));
    const device = requested
        ? phones.find((d) => d.udid === requested)
        : phones.at(-1);
    if (!device)
        throw new Error(
            'No available iPhone simulator; install an iOS runtime in Xcode.',
        );
    if (device.state !== 'Booted')
        run('xcrun', ['simctl', 'boot', device.udid]);
    run('xcrun', ['simctl', 'bootstatus', device.udid, '-b']);
    const dir = path.join(__dirname, 'output');
    fs.mkdirSync(dir, { recursive: true });
    const log = path.join(dir, 'ios-build.log');
    const fd = fs.openSync(log, 'w');
    try {
        run(
            'xcodebuild',
            [
                '-project',
                path.join(root, 'ios/SixHopsIOS/SixHops.xcodeproj'),
                '-scheme',
                'SixHops',
                '-configuration',
                'Debug',
                '-destination',
                `platform=iOS Simulator,id=${device.udid}`,
                '-derivedDataPath',
                path.join(root, 'ios/DerivedData'),
                'CODE_SIGNING_ALLOWED=NO',
                'build-for-testing',
            ],
            { stdio: ['ignore', fd, fd] },
        );
    } catch (e) {
        throw new Error(`iPhone app build failed; see ${log}`);
    } finally {
        fs.closeSync(fd);
    }
    console.log(`iPhone simulator ready: ${device.name} (${device.udid})`);
    return device.udid;
}
module.exports = { prepare };
