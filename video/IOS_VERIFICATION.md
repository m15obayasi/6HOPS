# iPhoneアプリ録画版のローカル検証

2026-10-02、GitHub main `db3c1f0` から作成した別コピーで検証。OneDrive側のGitはHEADのtree読み取りに失敗したため、そのファイルとユーザー変更は編集していない。

## 結果

- 実アプリ：SixHopsIOSの2.0.0 build3を複製し、iPhone 17 Pro / iOS 26.2へDebugビルド。`build-for-testing`成功。App Store提出済みの元プロジェクトには変更なし。
- 日本語：鉛筆 → ニュルンベルク → 第二次世界大戦 → チュニジア → サハラ砂漠。実リンクを4回タップして成功。XCTest 237.199秒、失敗0件。
- 英語：Pencil → Glass → Sahara。実リンクを2回タップして成功。XCTest 65.429秒、失敗0件。既存の `create_daily_videos.js --source ios --locale en --skip-upload` を通して、ビルド・録画・合成・投稿スキップまで確認。
- MP4：日本語24.1秒 / 英語16.9秒、1080×1920、30fps、H.264 / AAC。全フレームのデコード検査成功。タイトル・ネイティブホーム・各記事と実リンク遷移・成功画面・字幕・終盤を抽出画像で確認。
- 横サムネイル1280×720、縦カバー1080×1920、タイトル文字は6HOPSと開始↓ゴールのみ。
- 通常ビートは1秒間隔、終盤は0.5秒間隔で開始→ゴール→6HOPS。最後の黒画面を画素検査し、約1秒の音声で1000Hz成分を確認（880Hz成分の10倍以上）。動画タイトルは両単語を含む既存の自然な文章。
- `verify_ios_samples.js --date 2026-10-02`成功。`output/ios-verification-2026-10-02.json`に数値記録。
- JavaScript構文チェックと `git diff --check`成功。

## 検証で修正した点

シミュレーター録画は可変フレームレートで、静止画面の間隔が長い。短いシークではホームや字幕が欠落しうるため、一定30fpsへ変換してから切り出す。

長い記事のアクセシビリティ読み取りでは、タップを要求してから実入力まで約30秒空く場合があった。XCTestログの `Synthesize event` 時刻を入力の証拠として記録し、各場面の実スクリーンショットを30fpsの録画と照合して切り出し、準備とネットワークの待ち時間を除く。記事、リンク、結果は実アプリの録画から使用し、Webの擬似アプリ画面には置き換えていない。

## 配信・残っている作業

YouTubeへのアップロード・既存動画変更・App Store再提出は行っていない。稼働中の `.github/workflows/daily-youtube.yml` に差分なし。毎日18:00 JSTの既存投稿を維持。

追加した手動preview workflowは `macos-15`、投稿スキップ固定。GitHub-hosted macOSで完結する構成なのでMac常時起動は不要。GitHub APIでこのリポジトリのvisibility=publicを確認。標準runnerは公開リポジトリで実行料無料。非公開化する場合は割当超過時に標準macOSで$0.062/分（2026-10-02公式料金）となり、artifact容量にも制限がある。

ローカルでは録画だけで合計約5分。初回ビルド・シミュレーター起動・経路探索・合成の時間が加わる。2026-10-03のクラウド試験でSDK/runtime 18.5を使用し、日本語・英語のビルド、実リンク操作、成功画面、実アプリの録画まで確認。録画欠落を避けるためSimulatorの画面を開き、起動待ちとプレイの制限時間を分離した。短い録画区間は実フレームを保持し、次の記事へはみ出さないようにした。保存されたクラウド録画を修正版で編集し、両言語の完成動画の画面照合・全デコード・音声検証が成功した。最新のクラウド全工程の結果はPRとActionsを参照。

変更は公開ブランチ `codex/ios-shorts-preview` と [PR #1](https://github.com/m15obayasi/6HOPS/pull/1) に掲載済み。投稿を行わないクラウドpreviewを実行し、その結果を見て既存定時workflowをmacOS + `--source ios`へ切り替える。切替時は既存OAuthと当日アップロード履歴を引き継ぎ、二重投稿を防ぐ。

料金とrunnerの根拠：
- https://docs.github.com/en/actions/reference/runners/github-hosted-runners
- https://docs.github.com/en/billing/reference/actions-runner-pricing
- https://github.com/actions/runner-images/blob/main/images/macos/macos-15-Readme.md
