const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const { loadDailyChallenge, parseArgs } = require('./youtube/common');
const { findRoutes } = require('./route-finder');

const args = parseArgs(process.argv.slice(2));
const date = args.date || new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date());
const privacy = args.privacy || 'public';
const locales = args.locale ? [args.locale === 'en' ? 'en' : 'ja'] : ['ja', 'en'];
const outputDir = path.join(__dirname, 'output');
const metronomeSource = 'sine=frequency=880:sample_rate=48000';
const chimeSource = 'sine=frequency=1320:sample_rate=48000';
const noiseSource = 'anoisesrc=color=brown:sample_rate=48000:amplitude=0.025:seed=6';

function run(command, commandArgs, options = {}) {
    const result = spawnSync(command, commandArgs, {
        cwd: __dirname,
        stdio: 'inherit',
        windowsHide: true,
        ...options
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
        throw new Error(`${path.basename(command)} が終了コード ${result.status} で停止しました。`);
    }
}

function pathsFor(locale) {
    const code = locale.toUpperCase();
    const stem = `6HOPS-Daily-Playthrough-${code}-${date}`;
    return {
        raw: path.join(outputDir, `${stem}-raw.webm`),
        final: path.join(__dirname, `${stem}.mp4`),
        thumbnail: path.join(__dirname, `${stem}-thumbnail.jpg`),
        cover: path.join(__dirname, `${stem}-shorts-cover.jpg`)
    };
}

function probeDuration(filePath) {
    const result = spawnSync(ffmpegPath, ['-i', filePath], {
        cwd: __dirname,
        encoding: 'utf8',
        windowsHide: true
    });
    if (result.error) throw result.error;
    const match = `${result.stderr || ''}\n${result.stdout || ''}`.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
    if (!match) throw new Error(`動画の長さを取得できませんでした: ${filePath}`);
    return (Number(match[1]) * 3600) + (Number(match[2]) * 60) + Number(match[3]);
}

function readTiming(rawPath, duration) {
    const timingPath = rawPath.replace(/-raw\.webm$/i, '-timing.json');
    if (fs.existsSync(timingPath)) {
        const timing = JSON.parse(fs.readFileSync(timingPath, 'utf8'));
        if (Number.isFinite(timing.chimeAt) && timing.chimeAt >= 0 && timing.chimeAt < duration) {
            return { chimeAt:timing.chimeAt, outroAt:Number.isFinite(timing.outroAt) ? timing.outroAt : Math.max(0,timing.chimeAt-3) };
        }
    }
    return { chimeAt:Math.max(0, duration-5.05), outroAt:Math.max(0,duration-8.05) };
}

function encodeVideo(rawPath, finalPath) {
    const tempPath = `${finalPath}.tmp.mp4`;
    try {
        const duration = probeDuration(rawPath);
        const { chimeAt, outroAt } = readTiming(rawPath, duration);
        const chimeDelay = Math.round(chimeAt * 1000);
        const audioFilter = [
            `[1:a]volume=0.45*lt(t\\,${chimeAt.toFixed(3)})*lt(mod(if(lt(t\\,${outroAt.toFixed(3)})\\,t\\,t-${outroAt.toFixed(3)})\\,1)\\,0.045):eval=frame[metro]`,
            `[2:a]atrim=duration=3.8,afade=t=out:st=0.12:d=3.68,volume=3.5,aecho=0.8:0.4:160|310:0.28|0.16,adelay=${chimeDelay}[chime]`,
            `[3:a]volume=gte(t\\,${outroAt.toFixed(3)}):eval=frame,afade=t=out:st=${Math.max(0,duration-.5).toFixed(3)}:d=0.5[noise]`,
            '[metro][chime][noise]amix=inputs=3:duration=first:normalize=0,alimiter=limit=0.8:level=0[a]'
        ].join(';');
        run(ffmpegPath, [
            '-y', '-i', rawPath,
            '-f', 'lavfi', '-i', metronomeSource,
            '-f', 'lavfi', '-i', chimeSource,
            '-f', 'lavfi', '-i', noiseSource,
            '-filter_complex', audioFilter,
            '-vf', 'scale=1080:1920:flags=lanczos',
            '-map', '0:v:0', '-map', '[a]',
            '-c:v', 'libx264', '-preset', 'medium', '-crf', '22',
            '-c:a', 'aac', '-b:a', '128k',
            '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-shortest',
            tempPath
        ]);
        run(ffmpegPath,['-v','error','-i',tempPath,'-f','null','-']);
        fs.renameSync(tempPath, finalPath);
    } finally {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }
}

async function main() {
    if (!/^20\d{2}-\d{2}-\d{2}$/.test(date)) throw new Error(`日付が不正です: ${date}`);
    if (!['private', 'unlisted', 'public'].includes(privacy)) throw new Error(`公開設定が不正です: ${privacy}`);
    const challenges = {
        ja: loadDailyChallenge(date, 'ja'),
        en: loadDailyChallenge(date, 'en')
    };
    console.log(`6HOPS Daily ${date}`);
    console.log(`日本語: ${challenges.ja.start} → ${challenges.ja.goal}`);
    console.log(`English: ${challenges.en.start} → ${challenges.en.goal}`);
    const routes = await findRoutes(challenges, { offline: Boolean(args.offline) });
    console.log(`経路 (${routes.source}):`);
    console.log(`  JA: ${routes.ja.join(' → ')}`);
    console.log(`  EN: ${routes.en.join(' → ')}`);

    if (args['dry-run']) {
        console.log('ドライラン完了: 動画生成・YouTube投稿は行っていません。');
        return;
    }

    fs.mkdirSync(outputDir, { recursive: true });
    const generated = [];
    for (const locale of locales) {
        const files = pathsFor(locale);
        if (!args.force && fs.existsSync(files.final) && fs.existsSync(files.thumbnail) && fs.existsSync(files.cover)) {
            console.log(`既存の動画を使用します: ${files.final}`);
        } else {
            console.log(`${locale.toUpperCase()}版を生成しています…`);
            run(process.execPath, [
                path.join(__dirname, 'create_daily_demo.js'),
                '--locale', locale,
                '--date', date,
                '--route', JSON.stringify(routes[locale])
            ]);
            if (!fs.existsSync(files.raw)) throw new Error(`録画ファイルが作成されませんでした: ${files.raw}`);
            encodeVideo(files.raw, files.final);
            if (!fs.existsSync(files.thumbnail)) throw new Error(`サムネイルが作成されませんでした: ${files.thumbnail}`);
        }
        generated.push(files.final);
    }

    if (args['skip-upload']) {
        console.log('動画生成完了: YouTube投稿はスキップしました。');
        return;
    }

    for (const filePath of generated) {
        run(process.execPath, [
            path.join(__dirname, 'youtube', 'upload-latest.js'),
            '--file', filePath,
            '--privacy', privacy
        ]);
    }
    console.log(`Daily自動処理が完了しました: ${date}`);
}

main().catch((error) => {
    console.error(`\nエラー: ${error.message || error}`);
    process.exitCode = 1;
});
