# iPhone app recording for Daily Shorts

Work starts from GitHub main `db3c1f0f0abeb76acda732c57efe2a01caa99ae1`. The OneDrive checkout has unreadable Git tree objects and is left untouched. This separate checkout preserves the latest Web recording behavior. The existing scheduled `daily-youtube.yml` remains unchanged.

## Flow and changed files

1. `create_daily_videos.js --source ios` finds and validates current Wikipedia routes, builds the app, records both languages and passes the final MP4 paths to the existing uploader. Default `--source web` preserves the running pipeline. iOS never reuses a pre-existing Web MP4.
2. `prepare_ios.js` selects an iOS runtime matching the selected Xcode SDK major, opens its Simulator display, and runs an unsigned Debug `build-for-testing`. No provisioning key, App Store upload, or physical device is needed.
3. `record_ios_daily.js` runs XCTest while `simctl io recordVideo` records the actual simulator. The app's native home, native progress/goal bar, live WKWebView articles and real success screen are present. XCTest asserts the start/goal, each native hop count, real link availability and success. Native screenshots, event timestamps, the raw recording and full test log are retained. Hosted test-runner startup has its own 20-minute limit; play has an 8-minute limit after the native home appears. Failure prevents composition/upload.
4. `compose_ios_daily.js` locates each scene by matching actual XCTest screenshots against the recording at 30fps, retains recorded link transitions, cuts network waits, overlays only the displayed article title, sliding upward from below the screen over 0.45 seconds with no background panel or next-link commentary, and adds audio/end cards. Short settled intervals retain a real video frame for the caption hold instead of leaking into the next article. The final uncaptained scenes are compared with the native screenshots before accepting either video. It also creates the vertical cover and horizontal thumbnail. `ios_video_assets.swift` draws only captions/title/outro assets; it never substitutes a Web rendering for the app.
5. `ios/SixHopsIOS` contains a copy of the rebuilt iOS source (2.0.0 build3) and UI tests. Debug simulator-only launch arguments select the Daily date and scroll/highlight a real article anchor. XCTest taps that existing anchor through accessibility. This support does not synthesize game state, article contents, results or links. The submitted App Store source in the parent folder is untouched.
6. `ios-shorts-preview.yml` runs on pull requests or manual dispatch and always uses `--skip-upload`. Pull requests use the fixed 2026-10-02 challenge to compare against local samples. It does not stop or replace the scheduled publisher, receive OAuth secrets or publish test videos.

## Local execution

```sh
cd video
npm ci
node create_daily_videos.js --source ios --date 2026-10-02 --skip-upload
```

Requires macOS, Xcode with an installed iOS runtime, Node.js and network access to the published 6HOPS site and Wikipedia. Optional `--device UDID` chooses a specific available simulator. `--locale ja` or `--locale en` limits recording, while route validation still checks both languages. Output naming is unchanged for the existing uploader and duplicate-upload history.

The live app uses `https://myeik.net/6HOPS/`, not the local Web server. If the repository's Daily definition and published site differ, XCTest fails the start/goal assertions rather than creating a misleading video. App source changes should be deliberately synchronized from the App Store project; a copied app is needed in the GitHub checkout for cloud builds.

## Cloud deployment and cost

GitHub API confirmed this repository is public on 2026-10-02. A standard GitHub-hosted macOS runner has Xcode and iOS runtimes and can build, play and record the unsigned simulator app without this Mac staying on. `macos-15` is the preview configuration; the exact runtime is selected dynamically from available iPhones. On 2026-10-03 the cloud built and played both languages on SDK/runtime 18.5, recording the actual app with an active Simulator display. Captured cloud footage passed both media, visual and audio checks after the final scene-boundary fix. The latest end-to-end cloud result is recorded in PR #1 and its Actions run.

Standard hosted runners are free for public repositories; private repositories use their account allowance and may incur macOS per-minute charges. Standard macOS overage for private repositories is $0.062/minute at the checked date. Large macOS runners and artifact storage above allowances have separate costs. Sources checked 2026-10-02:
- https://docs.github.com/en/actions/reference/runners/github-hosted-runners
- https://docs.github.com/en/billing/concepts/product-billing/github-actions
- https://docs.github.com/en/billing/reference/actions-runner-pricing
- https://github.com/actions/runner-images/blob/main/images/macos/macos-15-Readme.md

Local simulator recording plus two encodes takes longer than the former Web renderer, particularly on cold simulator/Xcode startup. Actual timings are recorded in verification notes. Cloud timings and stability require a preview run before switching production. macOS changes the generation environment, not the YouTube channel, languages, 18:00 JST schedule or upload-history contract.

The implementation is published on the review branch in PR #1. Inspect the latest no-upload preview and both artifacts before a separately approved scheduled runner/source switch. Preserve the uploader, OAuth secrets and same-day duplicate history. Do not enable two scheduled publishers for the same day. No production switch is part of local preview verification.

## Video specification

1080×1920 at 30fps; complete phone image fitted with narrow side padding. Title/cover contain only 6HOPS and start↓goal. Horizontal thumbnail is 1280×720. Captions use a 780×780 square at x54/y224 (the 720×1280 Web layout scaled 1.5×), with 69px main/42px secondary type. Regular metronome is 60BPM. Outro is start 0.5s → goal 0.5s → 6HOPS 0.5s with matching beats and restrained scanlines/noise/vignette; then black and a 1000Hz beep for 1s, ending abruptly. No extra 4-second thumbnail or bottom-right Daily badge.

Local verification is recorded in `IOS_VERIFICATION.md`. Run `node verify_ios_samples.js --date YYYY-MM-DD` to check both completed samples without publishing.
