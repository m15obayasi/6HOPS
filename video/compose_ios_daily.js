const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const { parseArgs } = require('./youtube/common');
function run(command, args) {
    const r = spawnSync(command, args, { encoding: 'utf8' });
    if (r.error || r.status !== 0)
        throw new Error(
            `${command}: ${(r.stderr || r.error).toString().slice(-2500)}`,
        );
    return r.stdout;
}
function compose(manifestPath) {
    const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (m.source !== 'iphone-simulator')
        throw new Error('Actual iPhone recording required');
    const stem = `6HOPS-Daily-Playthrough-${m.locale.toUpperCase()}-${m.date}`;
    const final = path.join(__dirname, stem + '.mp4');
    const dir = path.join(__dirname, 'output', stem + '-assets');
    fs.mkdirSync(dir, { recursive: true });
    const ja = m.locale === 'ja';
    const start = m.route[0],
        goal = m.route.at(-1);
    const captions = [
        {
            main: ja ? '今日のお題' : "Today's challenge",
            sub: `${start} → ${goal}`,
        },
    ];
    for (let i = 0; i < m.route.length - 1; i++)
        captions.push({
            main: ja
                ? `${i === 0 ? 'スタート' : '現在'}「${m.route[i]}」`
                : `${i === 0 ? 'Start' : 'Now'}: ${m.route[i]}`,
            sub: ja
                ? `次は「${m.route[i + 1]}」へ`
                : `Follow the link to ${m.route[i + 1]}`,
        });
    captions.push({
        main: ja
            ? `${m.route.length - 1} HOPSでゴール！`
            : `Goal in ${m.route.length - 1} HOPS!`,
        sub: ja ? '今日のDaily、クリア' : "Today's Daily cleared",
    });
    const config = path.join(dir, 'config.json');
    fs.writeFileSync(
        config,
        JSON.stringify({ directory: dir, start, goal, captions }),
    );
    run('swift', [path.join(__dirname, 'ios_video_assets.swift'), config]);
    // simctl records variable frame rate, including long still-frame gaps.
    // Normalize once so a short cut inside a still screen keeps that screen.
    const normalized = path.join(dir, 'phone-cfr.mp4');
    run(ffmpeg, [
        '-y',
        '-i',
        m.raw,
        '-vf',
        'scale=-2:1920:flags=lanczos,pad=1080:1920:(ow-iw)/2:0:black,setsar=1,fps=30:start_time=0',
        '-an',
        '-c:v',
        'libx264',
        '-preset',
        'ultrafast',
        '-crf',
        '18',
        '-pix_fmt',
        'yuv420p',
        normalized,
    ]);
    // Anchor the media timeline to an actual XCTest screenshot and native tap.
    // Simulator MOV timestamps can differ from host wall time after startup.
    const pixels = 80 * 142;
    const frames = spawnSync(ffmpeg, ['-v','error','-i',normalized,'-vf','fps=10,scale=80:142,format=gray','-f','rawvideo','-'], {maxBuffer:512*1024*1024});
    if (frames.status !== 0) throw new Error('Could not inspect recording frames');
    function mse(buffer, offset, expected) {
        let sum=0;
        for(let j=0;j<pixels;j++) sum+=(buffer[offset+j]-expected[j])**2;
        return sum/pixels;
    }
    const anchors=[];
    for(const e of m.events.filter(e=>e.screenshot)) {
        const reference=spawnSync(ffmpeg,['-v','error','-i',e.screenshot,'-vf','scale=-2:1920,pad=1080:1920:(ow-iw)/2:0:black,scale=80:142,format=gray','-frames:v','1','-f','rawvideo','-']);
        if(reference.status!==0 || reference.stdout.length!==pixels) throw new Error(`Missing ${e.stage} screenshot`);
        const scores=[];
        const previous=anchors.at(-1)?.last ?? -1;
        for(let i=0;i<frames.stdout.length/pixels;i++) scores.push(i/10>previous ? mse(frames.stdout,i*pixels,reference.stdout) : Infinity);
        const minimum=Math.min(...scores);
        if(minimum>40) throw new Error(`Actual ${e.stage}:${e.index} screen not found (${minimum})`);
        const threshold=Math.min(50,minimum+20);
        const first=scores.findIndex(v=>v<=threshold)/10;
        let last=first;
        for(let i=Math.round(first*10);i<scores.length && scores[i]<=threshold;i++) last=i/10;
        anchors.push({stage:e.stage,index:e.index,first,last,minimum});
    }
    const calibration={method:'native-stage-screenshots',anchors};
    const clips = [];
    let total = 0;
    const segments = [];
    function image(name, duration, horror = false) {
        const out = path.join(dir, `clip-${clips.length}.mp4`);
        run(ffmpeg, [
            '-y',
            '-loop',
            '1',
            '-framerate',
            '30',
            '-i',
            path.join(dir, name + '.png'),
            '-t',
            String(duration),
            '-vf',
            horror
                ? 'noise=alls=2:allf=t,vignette=PI/8,format=yuv420p'
                : 'format=yuv420p',
            '-c:v',
            'libx264',
            '-preset',
            'veryfast',
            '-crf',
            '20',
            out,
        ]);
        clips.push(out);
        total += duration;
    }
    function real(stage, index, duration, caption) {
        const e = m.events.find((e) => e.stage === stage && e.index === index);
        if (!e) throw new Error(`Missing real-app event ${stage}:${index}`);
        const anchor=anchors.find(a=>a.stage===(stage==='tap'?'article':stage) && a.index===(stage==='tap'?index-1:index));
        if(!anchor) throw new Error(`Missing visual anchor ${stage}:${index}`);
        const offset=stage==='tap' ? Math.max(0,anchor.last-0.08) : anchor.first;
        const sourceDuration=stage==='tap' ? duration : Math.min(duration,Math.max(0.1,anchor.last-anchor.first));
        const screenMse=stage==='tap' ? undefined : anchor.minimum;
        const out = path.join(dir, `clip-${clips.length}.mp4`);
        const argv = ['-y', '-ss', offset.toFixed(3), '-i', normalized];
        if (caption !== undefined)
            argv.push(
                '-loop',
                '1',
                '-i',
                path.join(dir, `caption-${caption}.png`),
            );
        const base = 'setpts=PTS-STARTPTS,setsar=1,fps=30:start_time=0';
        if (caption !== undefined)
            argv.push(
                '-filter_complex',
                `[0:v]${base}[phone];[phone][1:v]overlay=0:0:enable='lt(t,1.9)'[v]`,
                '-map',
                '[v]',
            );
        else argv.push('-vf', base);
        argv.push(
            '-an',
            '-t',
            String(duration),
            '-c:v',
            'libx264',
            '-preset',
            'veryfast',
            '-crf',
            '20',
            '-pix_fmt',
            'yuv420p',
            out,
        );
        run(ffmpeg, argv);
        segments.push({
            stage,
            index,
            rawOffset: offset,
            sourceDuration,
            screenMse,
            duration,
            finalOffset: total,
            caption,
        });
        clips.push(out);
        total += duration;
    }
    image('title', 1.2);
    real('home', 0, 1.2);
    real('ready', 0, 2, 0);
    for (let i = 0; i < m.route.length - 1; i++) {
        real('article', i, 2.8, i + 1);
        real('tap', i + 1, 0.8);
    }
    real('result', m.route.length - 1, 2.8, captions.length - 1);
    const outroAt = total;
    for (let i = 0; i < 3; i++) image('outro-' + i, 0.5, true);
    const chimeAt = total;
    image('black', 1);
    const list = path.join(dir, 'concat.txt');
    fs.writeFileSync(
        list,
        clips.map((c) => `file '${c.replaceAll("'", "'\\''")}'`).join('\n'),
    );
    const filter = [
        `[1:a]volume=0.45*lt(t\\,${chimeAt})*lt(mod(if(lt(t\\,${outroAt})\\,t\\,t-${outroAt})\\,if(lt(t\\,${outroAt})\\,1\\,0.5))\\,0.045):eval=frame[metro]`,
        `[2:a]atrim=duration=1,volume=1.2,adelay=${Math.round(chimeAt * 1000)}[chime]`,
        `[3:a]volume=gte(t\\,${outroAt})*lt(t\\,${chimeAt}):eval=frame[noise]`,
        '[metro][chime][noise]amix=inputs=3:duration=first:normalize=0,alimiter=limit=0.8:level=0[a]',
    ].join(';');
    const tmp = final + '.tmp.mp4';
    run(ffmpeg, [
        '-y',
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        list,
        '-f',
        'lavfi',
        '-i',
        'sine=frequency=880:sample_rate=48000',
        '-f',
        'lavfi',
        '-i',
        'sine=frequency=1000:sample_rate=48000',
        '-f',
        'lavfi',
        '-i',
        'anoisesrc=color=brown:sample_rate=48000:amplitude=0.025:seed=6',
        '-filter_complex',
        filter,
        '-map',
        '0:v',
        '-map',
        '[a]',
        '-c:v',
        'copy',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        '-t',
        total.toFixed(3),
        '-movflags',
        '+faststart',
        tmp,
    ]);
    run(ffmpeg, ['-v', 'error', '-i', tmp, '-f', 'null', '-']);
    fs.renameSync(tmp, final);
    for (const [source, suffix] of [
        ['title', 'shorts-cover'],
        ['thumbnail', 'thumbnail'],
    ])
        run(ffmpeg, [
            '-y',
            '-i',
            path.join(dir, source + '.png'),
            '-frames:v',
            '1',
            '-q:v',
            '2',
            path.join(__dirname, stem + '-' + suffix + '.jpg'),
        ]);
    fs.writeFileSync(
        path.join(dir, 'edit.json'),
        JSON.stringify(
            {
                source: 'iphone-simulator',
                calibration,
                manifest: manifestPath,
                final,
                total,
                outroAt,
                chimeAt,
                segments,
            },
            null,
            2,
        ),
    );
    console.log(final);
    return final;
}
if (require.main === module) {
    const args = parseArgs(process.argv.slice(2));
    try {
        compose(args.manifest);
    } catch (e) {
        console.error(e);
        process.exitCode = 1;
    }
}
module.exports = { compose };
