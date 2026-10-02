// Verify generated media and evidence without touching the uploader or OAuth files.
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const { spawnSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const { buildMetadata, loadConfig, parseArgs } = require('./youtube/common');
const date = parseArgs(process.argv.slice(2)).date;
function decode(args) {
    const r = spawnSync(ffmpeg, args, { maxBuffer: 32 * 1024 * 1024 });
    assert.equal(r.status, 0, r.stderr.toString());
    return r.stdout;
}
function amplitude(samples, frequency) {
    let re = 0,
        im = 0;
    for (let i = 0; i < samples.length; i++) {
        const phase = (2 * Math.PI * frequency * i) / 48000;
        re += samples[i] * Math.cos(phase);
        im += samples[i] * Math.sin(phase);
    }
    return (2 * Math.hypot(re, im)) / samples.length;
}
const report = [];
for (const locale of ['ja', 'en']) {
    const stem = `6HOPS-Daily-Playthrough-${locale.toUpperCase()}-${date}`;
    const file = path.join(__dirname, `${stem}.mp4`);
    const manifest = JSON.parse(
        fs.readFileSync(
            path.join(__dirname, 'output', `${stem}-ios-recording.json`),
        ),
    );
    const edit = JSON.parse(
        fs.readFileSync(
            path.join(__dirname, 'output', `${stem}-assets/edit.json`),
        ),
    );
    assert.equal(manifest.source, 'iphone-simulator');
    assert.equal(edit.calibration.method, 'native-home-screenshot-and-real-tap');
    assert(edit.calibration.minimum <= 40);
    assert(edit.segments.filter(s => s.stage !== 'tap').every(s => Number.isFinite(s.screenMse) && s.screenMse <= 50));
    assert.equal(
        manifest.events.filter((e) => e.stage === 'tap').length,
        manifest.route.length - 1,
    );
    assert(
        manifest.events
            .filter((e) => e.stage === 'tap')
            .every((e) => Number.isFinite(e.realTapEpoch)),
    );
    assert(manifest.events.some((e) => e.stage === 'result'));
    assert(
        fs
            .readFileSync(manifest.logPath, 'utf8')
            .includes('** TEST EXECUTE SUCCEEDED **'),
    );
    const info = spawnSync(ffmpeg, ['-i', file], { encoding: 'utf8' }).stderr;
    assert(info.includes('1080x1920'));
    assert(info.includes('30 fps'));
    assert(info.includes('Audio: aac'));
    decode(['-v', 'error', '-i', file, '-f', 'null', '-']);
    const pcm = decode([
        '-v',
        'error',
        '-i',
        file,
        '-f',
        'f32le',
        '-ar',
        '48000',
        '-ac',
        '1',
        '-',
    ]);
    const samples = new Float32Array(
        pcm.buffer,
        pcm.byteOffset,
        pcm.length / 4,
    );
    const window = samples.slice(
        Math.round((edit.chimeAt + 0.15) * 48000),
        Math.round((edit.chimeAt + 0.85) * 48000),
    );
    const tone1000 = amplitude(window, 1000),
        tone880 = amplitude(window, 880);
    assert(tone1000 > 0.03);
    assert(tone1000 > tone880 * 10);
    const black = decode([
        '-v',
        'error',
        '-ss',
        String(edit.chimeAt + 0.4),
        '-i',
        file,
        '-frames:v',
        '1',
        '-vf',
        'scale=16:16',
        '-f',
        'rawvideo',
        '-pix_fmt',
        'rgb24',
        '-',
    ]);
    assert(black.every((v) => v <= 2));
    const beatRms = [];
    for (let t = 0; t < 3; t++) {
        const beat = samples.slice(t * 48000, t * 48000 + 3000);
        const silent = samples.slice(t * 48000 + 16000, t * 48000 + 21000);
        const rms = (a) =>
            Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length);
        assert(rms(beat) > 0.01);
        assert(rms(silent) < 0.005);
        beatRms.push(rms(beat));
    }
    for (let i = 0; i < 3; i++) {
        const at = edit.outroAt + i * 0.5;
        const beat = samples.slice(
            Math.round((at + 0.003) * 48000),
            Math.round((at + 0.04) * 48000),
        );
        const rms = Math.sqrt(
            beat.reduce((s, v) => s + v * v, 0) / beat.length,
        );
        assert(rms > 0.01);
    }
    for (const suffix of ['thumbnail', 'shorts-cover']) {
        const imagePath = path.join(__dirname, `${stem}-${suffix}.jpg`);
        const imageInfo = spawnSync(ffmpeg, ['-i', imagePath], {
            encoding: 'utf8',
        }).stderr;
        assert(
            imageInfo.includes(
                suffix === 'thumbnail' ? '1280x720' : '1080x1920',
            ),
        );
    }
    const metadata = buildMetadata(file, loadConfig(), 'private');
    assert(metadata.title.includes(manifest.route[0]));
    assert(metadata.title.includes(manifest.route.at(-1)));
    report.push({
        locale,
        file,
        route: manifest.route,
        duration: edit.total,
        outroAt: edit.outroAt,
        chimeAt: edit.chimeAt,
        tone1000,
        tone880,
        beatRms,
        title: metadata.title,
        uploaded: false,
    });
}
fs.writeFileSync(
    path.join(__dirname, 'output', `ios-verification-${date}.json`),
    JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
