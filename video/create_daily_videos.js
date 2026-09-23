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
        thumbnail: path.join(__dirname, `${stem}-thumbnail.jpg`)
    };
}

function encodeVideo(rawPath, finalPath) {
    const tempPath = `${finalPath}.tmp.mp4`;
    try {
        run(ffmpegPath, [
            '-y', '-i', rawPath,
            '-c:v', 'libx264', '-preset', 'medium', '-crf', '22',
            '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an',
            tempPath
        ]);
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
        if (!args.force && fs.existsSync(files.final) && fs.existsSync(files.thumbnail)) {
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

