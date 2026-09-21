const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const youtubeDir = __dirname;
const videoDir = path.resolve(youtubeDir, '..');
const projectRoot = path.resolve(videoDir, '..');

const paths = {
    youtubeDir,
    videoDir,
    projectRoot,
    clientSecret: path.join(youtubeDir, 'client_secret.json'),
    token: path.join(youtubeDir, 'token.json'),
    config: path.join(youtubeDir, 'upload-config.json'),
    configExample: path.join(youtubeDir, 'upload-config.example.json'),
    history: path.join(youtubeDir, 'upload-history.json'),
    dailyData: path.join(projectRoot, 'js', 'daily-data.js')
};

function readJson(filePath, fallback) {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writePrivateJson(filePath, value) {
    fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
    try {
        fs.chmodSync(filePath, 0o600);
    } catch (_) {
        // Windows permissions are managed by the current user profile.
    }
}

function loadOAuthClient() {
    if (!fs.existsSync(paths.clientSecret)) {
        throw new Error(
            `OAuthクライアント情報がありません。Google Cloudから取得したJSONを次へ保存してください:\n${paths.clientSecret}`
        );
    }
    const raw = readJson(paths.clientSecret);
    const client = raw.installed || raw.web;
    if (!client || !client.client_id || !client.client_secret) {
        throw new Error('client_secret.jsonの形式を確認してください。デスクトップアプリ用OAuthクライアントを使用します。');
    }
    return client;
}

function loadConfig() {
    const filePath = fs.existsSync(paths.config) ? paths.config : paths.configExample;
    const config = readJson(filePath);
    if (!config) throw new Error('upload-config.example.jsonが見つかりません。');
    return config;
}

function loadDailyChallenge(dateKey, locale = 'ja') {
    const source = fs.readFileSync(paths.dailyData, 'utf8');
    const sandbox = { window: {}, Intl, Date };
    vm.runInNewContext(source, sandbox, { filename: paths.dailyData });
    return sandbox.window.SIX_HOPS_DAILY.getChallenge(dateKey, locale);
}

function parseDateFromFile(filePath) {
    const match = path.basename(filePath).match(/(20\d{2}-\d{2}-\d{2})/);
    if (!match) {
        throw new Error(`動画ファイル名から日付を取得できません: ${path.basename(filePath)}`);
    }
    return match[1];
}

function parseLocaleFromFile(filePath) {
    return /-EN-/i.test(path.basename(filePath)) ? 'en' : 'ja';
}

function findLatestVideo() {
    const files = fs.readdirSync(paths.videoDir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && /^6HOPS-Daily-.*\.mp4$/i.test(entry.name))
        .map((entry) => {
            const filePath = path.join(paths.videoDir, entry.name);
            return { filePath, modified: fs.statSync(filePath).mtimeMs };
        })
        .sort((a, b) => b.modified - a.modified);
    if (!files.length) throw new Error(`${paths.videoDir} にDaily動画がありません。`);
    return files[0].filePath;
}

function renderTemplate(template, values) {
    return String(template).replace(/\{([a-zA-Z]+)\}/g, (whole, key) => (
        Object.prototype.hasOwnProperty.call(values, key) ? values[key] : whole
    ));
}

function buildMetadata(filePath, config, privacyOverride) {
    const date = parseDateFromFile(filePath);
    const locale = parseLocaleFromFile(filePath);
    const localizedConfig = { ...config, ...(config.locales?.[locale] || {}) };
    const challenge = loadDailyChallenge(date, locale);
    const values = {
        date,
        start: challenge.start,
        goal: challenge.goal,
        url: localizedConfig.siteUrl || 'https://myeik.net/6HOPS/'
    };
    const privacyStatus = privacyOverride || localizedConfig.privacyStatus || 'private';
    if (!['private', 'unlisted', 'public'].includes(privacyStatus)) {
        throw new Error(`privacyStatusが不正です: ${privacyStatus}`);
    }
    const title = renderTemplate(localizedConfig.titleTemplate, values).slice(0, 100);
    const description = renderTemplate(localizedConfig.descriptionTemplate, values).slice(0, 5000);
    return {
        date,
        locale,
        challenge,
        title,
        description,
        tags: Array.isArray(localizedConfig.tags) ? localizedConfig.tags : [],
        categoryId: String(localizedConfig.categoryId || '20'),
        privacyStatus,
        madeForKids: Boolean(localizedConfig.madeForKids)
    };
}

function sha256(filePath) {
    const hash = crypto.createHash('sha256');
    hash.update(fs.readFileSync(filePath));
    return hash.digest('hex');
}

function parseArgs(argv) {
    const result = {};
    for (let index = 0; index < argv.length; index += 1) {
        const value = argv[index];
        if (!value.startsWith('--')) continue;
        const key = value.slice(2);
        if (['dry-run', 'force'].includes(key)) {
            result[key] = true;
        } else {
            result[key] = argv[index + 1];
            index += 1;
        }
    }
    return result;
}

module.exports = {
    paths,
    readJson,
    writePrivateJson,
    loadOAuthClient,
    loadConfig,
    loadDailyChallenge,
    findLatestVideo,
    buildMetadata,
    sha256,
    parseArgs
};
