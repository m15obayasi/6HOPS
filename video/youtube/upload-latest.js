const fs = require('fs');
const path = require('path');
const {
    paths,
    readJson,
    writePrivateJson,
    loadConfig,
    findLatestVideo,
    buildMetadata,
    sha256,
    parseArgs
} = require('./common');
const { getAccessToken } = require('./oauth');

function printPlan(filePath, metadata) {
    console.log('YouTube投稿内容');
    console.log(`  動画: ${filePath}`);
    console.log(`  タイトル: ${metadata.title}`);
    console.log(`  公開設定: ${metadata.privacyStatus}`);
    console.log(`  お題: ${metadata.challenge.start} → ${metadata.challenge.goal}`);
    if (metadata.thumbnailPath) console.log(`  サムネイル: ${metadata.thumbnailPath}`);
    console.log('  概要欄:');
    console.log(metadata.description.split('\n').map((line) => `    ${line}`).join('\n'));
}

function findThumbnail(filePath) {
    const parsed = path.parse(filePath);
    const candidates = [
        path.join(parsed.dir, `${parsed.name}-thumbnail.jpg`),
        path.join(parsed.dir, `${parsed.name}-thumbnail.jpeg`),
        path.join(parsed.dir, `${parsed.name}-thumbnail.png`)
    ];
    return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

async function initiateUpload(accessToken, filePath, metadata) {
    const stat = fs.statSync(filePath);
    const endpoint = new URL('https://www.googleapis.com/upload/youtube/v3/videos');
    endpoint.search = new URLSearchParams({
        uploadType: 'resumable',
        part: 'snippet,status',
        notifySubscribers: 'false'
    }).toString();
    const body = {
        snippet: {
            title: metadata.title,
            description: metadata.description,
            tags: metadata.tags,
            categoryId: metadata.categoryId,
            defaultLanguage: metadata.locale,
            defaultAudioLanguage: metadata.locale
        },
        status: {
            privacyStatus: metadata.privacyStatus,
            selfDeclaredMadeForKids: metadata.madeForKids
        }
    };
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            authorization: `Bearer ${accessToken}`,
            'content-type': 'application/json; charset=UTF-8',
            'x-upload-content-length': String(stat.size),
            'x-upload-content-type': 'video/mp4'
        },
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        throw new Error(`アップロードの開始に失敗しました (${response.status}): ${await response.text()}`);
    }
    const uploadUrl = response.headers.get('location');
    if (!uploadUrl) throw new Error('YouTubeからアップロード先URLが返されませんでした。');
    return uploadUrl;
}

async function uploadFile(uploadUrl, filePath) {
    const video = fs.readFileSync(filePath);
    const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'content-type': 'video/mp4',
            'content-length': String(video.length)
        },
        body: video
    });
    const payloadText = await response.text();
    let payload;
    try {
        payload = JSON.parse(payloadText);
    } catch (_) {
        payload = null;
    }
    if (!response.ok || !payload?.id) {
        throw new Error(`動画の送信に失敗しました (${response.status}): ${payloadText}`);
    }
    return payload;
}

async function uploadThumbnail(accessToken, videoId, thumbnailPath) {
    const extension = path.extname(thumbnailPath).toLowerCase();
    const contentType = extension === '.png' ? 'image/png' : 'image/jpeg';
    const endpoint = new URL('https://www.googleapis.com/upload/youtube/v3/thumbnails/set');
    endpoint.search = new URLSearchParams({ videoId, uploadType: 'media' }).toString();
    const thumbnail = fs.readFileSync(thumbnailPath);
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            authorization: `Bearer ${accessToken}`,
            'content-type': contentType,
            'content-length': String(thumbnail.length)
        },
        body: thumbnail
    });
    if (!response.ok) {
        throw new Error(`サムネイルの設定に失敗しました (${response.status}): ${await response.text()}`);
    }
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const filePath = args.file ? path.resolve(args.file) : findLatestVideo();
    if (!fs.existsSync(filePath)) throw new Error(`動画が見つかりません: ${filePath}`);
    const config = loadConfig();
    const metadata = buildMetadata(filePath, config, args.privacy);
    metadata.thumbnailPath = findThumbnail(filePath);
    printPlan(filePath, metadata);

    if (args['dry-run']) {
        console.log('\nドライラン完了: YouTubeには送信していません。');
        return;
    }

    const digest = sha256(filePath);
    const history = readJson(paths.history, { uploads: [] });
    const previous = history.uploads.find((item) => item.sha256 === digest);
    if (previous && !args.force) {
        console.log(`\n新しい動画はありません。同じ動画は投稿済みです: https://youtu.be/${previous.videoId}`);
        return;
    }

    console.log('\nYouTubeへアップロードしています…');
    const accessToken = await getAccessToken();
    const uploadUrl = await initiateUpload(accessToken, filePath, metadata);
    const result = await uploadFile(uploadUrl, filePath);
    let thumbnailStatus = metadata.thumbnailPath ? 'pending' : 'not-provided';
    let thumbnailError = null;
    if (metadata.thumbnailPath) {
        console.log('サムネイルを設定しています…');
        try {
            await uploadThumbnail(accessToken, result.id, metadata.thumbnailPath);
            thumbnailStatus = 'uploaded';
        } catch (error) {
            thumbnailStatus = 'failed';
            thumbnailError = error;
        }
    }
    const record = {
        sha256: digest,
        file: path.basename(filePath),
        videoId: result.id,
        channelId: result.snippet?.channelId || null,
        uploadedAt: new Date().toISOString(),
        privacyStatus: metadata.privacyStatus,
        title: metadata.title,
        thumbnailStatus
    };
    history.uploads.push(record);
    writePrivateJson(paths.history, history);
    console.log('\nアップロードが完了しました。');
    console.log(`https://youtu.be/${result.id}`);
    if (record.channelId) console.log(`チャンネルID: ${record.channelId}`);
    console.log(`公開設定: ${metadata.privacyStatus}`);
    if (thumbnailError) {
        throw new Error(`動画はアップロードされましたが、${thumbnailError.message}`);
    }
}

main().catch((error) => {
    console.error(`\nエラー: ${error.message || error}`);
    process.exitCode = 1;
});
