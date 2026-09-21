const crypto = require('crypto');
const http = require('http');
const { execFile } = require('child_process');
const { exchangeToken } = require('./oauth');
const { loadOAuthClient, paths, writePrivateJson } = require('./common');

const host = '127.0.0.1';
const port = 53682;
const redirectUri = `http://${host}:${port}/oauth2callback`;
const scope = 'https://www.googleapis.com/auth/youtube.upload';

function openBrowser(url) {
    execFile('rundll32.exe', ['url.dll,FileProtocolHandler', url], (error) => {
        if (error) {
            console.log('\nブラウザを自動で開けませんでした。次のURLを開いてください:\n');
            console.log(url);
        }
    });
}

async function main() {
    const client = loadOAuthClient();
    const state = crypto.randomBytes(24).toString('hex');
    const authorizationUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authorizationUrl.search = new URLSearchParams({
        client_id: client.client_id,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope,
        access_type: 'offline',
        prompt: 'consent',
        state
    }).toString();

    const server = http.createServer(async (request, response) => {
        const url = new URL(request.url, redirectUri);
        if (url.pathname !== '/oauth2callback') {
            response.writeHead(404).end('Not found');
            return;
        }
        if (url.searchParams.get('state') !== state) {
            response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' }).end('認証状態が一致しません。');
            server.close();
            process.exitCode = 1;
            return;
        }
        const error = url.searchParams.get('error');
        if (error) {
            response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' }).end(`認証がキャンセルされました: ${error}`);
            server.close();
            process.exitCode = 1;
            return;
        }
        try {
            const token = await exchangeToken({
                code: url.searchParams.get('code'),
                client_id: client.client_id,
                client_secret: client.client_secret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            });
            writePrivateJson(paths.token, {
                ...token,
                expires_at: Date.now() + (token.expires_in * 1000)
            });
            response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
            response.end('<!doctype html><meta charset="utf-8"><title>6HOPS YouTube認証</title><style>body{font-family:sans-serif;padding:48px;line-height:1.7}</style><h1>認証が完了しました</h1><p>この画面を閉じて構いません。</p>');
            console.log(`\n認証情報を保存しました:\n${paths.token}`);
        } catch (tokenError) {
            response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' }).end(tokenError.message);
            console.error(tokenError.message);
            process.exitCode = 1;
        } finally {
            server.close();
        }
    });

    server.listen(port, host, () => {
        console.log('Google認証画面を開きます。6HOPSを投稿するYouTubeチャンネルを選択してください。');
        console.log(`自動で開かない場合:\n${authorizationUrl.toString()}\n`);
        openBrowser(authorizationUrl.toString());
    });
}

main().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
});
