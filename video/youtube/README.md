# 6HOPS Daily動画の自動生成・YouTube投稿

毎日のDailyお題から日本語版・英語版のプレイ動画とサムネイルを生成し、YouTubeへ投稿します。同じ内容の動画はSHA-256で判定し、誤って二重投稿しないようにしています。

## 1. Google側の初期設定

1. Google Cloudでプロジェクトを作成する。
2. YouTube Data API v3を有効にする。
3. OAuth同意画面を設定する。
4. 「デスクトップアプリ」のOAuthクライアントを作成し、JSONをダウンロードする。
5. ダウンロードしたファイルを `client_secret.json` に改名し、このフォルダーへ置く。

`client_secret.json`、認証トークン、投稿履歴はGitには追加されません。

## 2. 初回認証

このフォルダーで次を実行します。

```powershell
node .\authenticate.js
```

ブラウザが開いたら、動画を投稿するYouTubeチャンネルを選択して許可します。完了すると `token.json` が作成されます。

## 3. 当日のお題と経路の確認

動画生成やYouTube投稿を行わず、当日のお題と検証済み経路を確認できます。

```powershell
cd ..
npm run daily:dry-run
```

## 4. 手動で当日分を生成・投稿

```powershell
.\youtube\run-daily.ps1 -Privacy public
```

日本語版・英語版を順番に生成して投稿します。投稿済み動画は再投稿されません。YouTube APIプロジェクトが未監査の場合、`public`を指定してもYouTube側で非公開に制限されます。

独自の文言を使う場合は `upload-config.example.json` を `upload-config.json` としてコピーし、内容を変更してください。

## 5. Windowsで毎日実行

初回認証と手動投稿の確認後、日付が変わる毎日0時に生成から公開指定投稿まで行うタスクを登録します。

```powershell
.\install-scheduled-task.ps1 -At '00:00' -Privacy public
```

パソコンが0時に停止していた場合は、次回のWindowsサインイン時に実行されます。バッテリー動作中でも停止しません。同日に再度サインインした場合は重複判定により再投稿されません。経路を実際のWikipediaリンクで検証できない場合や動画生成に失敗した場合は、誤った動画を投稿せず停止します。ログは `daily-logs` に保存されます。

過去の日付を手動実行する場合:

```powershell
.\run-daily.ps1 -Date '2026-09-23' -Privacy public
```

## 6. PCを起動せずGitHub Actionsで毎日実行

リポジトリのActions Secretsに次の2項目を登録します。

- `YOUTUBE_CLIENT_SECRET_JSON`: `client_secret.json` の内容全体
- `YOUTUBE_TOKEN_JSON`: `token.json` の内容全体

`.github/workflows/daily-youtube.yml` が、日本時間の毎日18時に日本語版・英語版の9:16 Shorts動画を生成して公開します。Actions画面の「Run workflow」から日付と公開範囲を指定して手動実行することもできます。同じ日を再実行した場合に二重投稿しにくいよう、投稿履歴を同日用キャッシュへ保存します。

前日の日本時間23時には `.github/workflows/prepare-daily-challenge.yml` が翌日のお題を日英両方の実在リンクで検証します。6 HOPS以内の経路が確認できない場合は、検証済みの別候補を日付別のお題としてGitHubへ保存し、FTPSで `myeik.net` に自動公開します。接続情報は `FTP_HOST`、`FTP_USERNAME`、`FTP_PASSWORD` のActions Secretsとして保存します。

## 公開について

新規または未監査のYouTube APIプロジェクトでは、API投稿動画が非公開に制限される場合があります。最初は非公開で運用し、YouTube Studioで内容を確認してから公開してください。
