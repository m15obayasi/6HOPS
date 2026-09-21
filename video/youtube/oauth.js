const fs = require('fs');
const { loadOAuthClient, paths, readJson, writePrivateJson } = require('./common');

const tokenEndpoint = 'https://oauth2.googleapis.com/token';

async function exchangeToken(parameters) {
    const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(parameters)
    });
    const payload = await response.json();
    if (!response.ok) {
        throw new Error(`OAuthトークンの取得に失敗しました: ${payload.error_description || payload.error || response.status}`);
    }
    return payload;
}

async function getAccessToken() {
    if (!fs.existsSync(paths.token)) {
        throw new Error('YouTube認証が未完了です。先に node authenticate.js を実行してください。');
    }
    const client = loadOAuthClient();
    const token = readJson(paths.token);
    const marginMs = 60 * 1000;
    if (token.access_token && token.expires_at && Date.now() < token.expires_at - marginMs) {
        return token.access_token;
    }
    if (!token.refresh_token) {
        throw new Error('更新トークンがありません。token.jsonを削除し、authenticate.jsで再認証してください。');
    }
    const refreshed = await exchangeToken({
        client_id: client.client_id,
        client_secret: client.client_secret,
        refresh_token: token.refresh_token,
        grant_type: 'refresh_token'
    });
    const updated = {
        ...token,
        ...refreshed,
        refresh_token: refreshed.refresh_token || token.refresh_token,
        expires_at: Date.now() + (refreshed.expires_in * 1000)
    };
    writePrivateJson(paths.token, updated);
    return updated.access_token;
}

module.exports = { exchangeToken, getAccessToken };
