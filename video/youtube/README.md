# 6HOPS YouTube自動投稿

最新のDaily MP4をYouTubeへ投稿します。安全のため、既定の公開設定は「非公開」です。同じ内容の動画はSHA-256で判定し、誤って二重投稿しないようにしています。

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

## 3. 投稿前の確認

YouTubeへ送信せず、対象動画・タイトル・概要欄を確認できます。

```powershell
.\run-upload.ps1 -DryRun
```

## 4. 非公開アップロード

```powershell
.\run-upload.ps1
```

最新の `6HOPS-Daily-*.mp4` がアップロードされます。投稿済み動画は再投稿されません。

独自の文言を使う場合は `upload-config.example.json` を `upload-config.json` としてコピーし、内容を変更してください。

## 5. Windowsで毎日実行

初回認証と手動アップロードの確認後、たとえば毎日9時に実行するタスクを登録します。

```powershell
.\install-scheduled-task.ps1 -At '09:00'
```

この定期タスクは、動画フォルダーに新しいMP4がある場合だけアップロードします。動画生成自体が失敗した日や、同じ動画しかない日は投稿しません。

## 公開について

新規または未監査のYouTube APIプロジェクトでは、API投稿動画が非公開に制限される場合があります。最初は非公開で運用し、YouTube Studioで内容を確認してから公開してください。
