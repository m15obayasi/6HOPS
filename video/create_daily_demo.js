const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const { loadDailyChallenge, parseArgs } = require('./youtube/common');

const args = parseArgs(process.argv.slice(2));
const requestedLocale = args.locale || 'ja';
const locale = requestedLocale === 'en' ? 'en' : 'ja';
const date = args.date || new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date());
const challenge = loadDailyChallenge(date, locale);
const route = args.route ? JSON.parse(args.route) : [challenge.start, challenge.goal];
if (!Array.isArray(route) || route.length < 2 || route.length > 7) {
    throw new Error('経路はスタートとゴールを含む2〜7記事で指定してください。');
}
if (route[0] !== challenge.start || route[route.length - 1] !== challenge.goal) {
    throw new Error(`経路がお題と一致しません: ${challenge.start} → ${challenge.goal}`);
}
const demo = {
    ja: {
        todayChallenge: '今日のお題',
        startCaption: (start) => `スタート：「${start}」`,
        startSubcaption: (goal) => `リンクだけを辿って「${goal}」を目指します`,
        firstMove: (title) => `まずは「${title}」へ`,
        nextMove: (title) => `次は「${title}」へ`,
        linkInstruction: '記事内のリンクをクリック',
        remaining: (count) => `あと${count}回`,
        goalFound: (goal) => `ゴールの「${goal}」を発見！`,
        successText: '成功',
        goalCaption: (hops) => `${hops} HOPSでゴール！`,
        goalSubcaption: '今日のDaily、クリア'
    },
    en: {
        todayChallenge: "Today's challenge",
        startCaption: (start) => `Start: “${start}”`,
        startSubcaption: (goal) => `Follow links only and reach “${goal}”`,
        firstMove: (title) => `First, go to “${title}”`,
        nextMove: (title) => `Next: “${title}”`,
        linkInstruction: 'Click a link inside the article',
        remaining: (count) => `${count} hops remaining`,
        goalFound: (goal) => `Found the goal: “${goal}”!`,
        successText: 'Success',
        goalCaption: (hops) => `Goal in ${hops} HOPS!`,
        goalSubcaption: "Today's Daily cleared"
    }
}[locale];
Object.assign(demo, { date, start: challenge.start, goal: challenge.goal, route });

const projectRoot = path.resolve(__dirname, '..');
const outputDir = path.join(__dirname, 'output');
const localeCode = locale.toUpperCase();
const rawVideoPath = path.join(outputDir, `6HOPS-Daily-Playthrough-${localeCode}-${date}-raw.webm`);
const timingPath = path.join(outputDir, `6HOPS-Daily-Playthrough-${localeCode}-${date}-timing.json`);
const thumbnailPath = path.join(__dirname, `6HOPS-Daily-Playthrough-${localeCode}-${date}-thumbnail.jpg`);
const coverPath = path.join(__dirname, `6HOPS-Daily-Playthrough-${localeCode}-${date}-shorts-cover.jpg`);
const baseUrl = process.env.SIX_HOPS_URL || 'https://myeik.net/6HOPS/';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browserPath = process.env.PLAYWRIGHT_EXECUTABLE_PATH
    || (process.platform === 'win32' ? edgePath : chromium.executablePath());
const viewport = { width: 720, height: 1280 };
const videoSize = viewport;

fs.mkdirSync(outputDir, { recursive: true });

const timingScale = process.env.SIX_HOPS_FAST === '1' ? 0.05 : 1;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, Math.max(20, Math.round(ms * timingScale))));
const escapeHtml = (value) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

function titlePageHtml(listing = false, horror = false) {
    return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><style>
        * { box-sizing: border-box; }
        html, body { width: 100%; height: 100%; margin: 0; }
        body { display:flex; align-items:center; justify-content:center; background:#f8f9fa; color:#202122;
            font-family:'Yu Gothic UI','Noto Sans JP',sans-serif; text-align:center; }
        main { width:min(620px,calc(100% - 72px)); transform:translateY(-18px); }
        h1 { margin:0; font-size:104px; line-height:1; letter-spacing:.035em; }
        .pair { margin-top:86px; color:#202122; display:flex; flex-direction:column; align-items:center;
            font-size:clamp(66px,11.5vw,92px); font-weight:900; line-height:1.12; overflow-wrap:anywhere;
            text-wrap:balance; }
        .term { max-width:100%; }
        .arrow { margin:24px 0; font-size:68px; line-height:1; font-weight:700; }
        ${listing ? 'main { width:560px; transform:none; } h1 { font-size:62px; } .pair { margin-top:24px; font-size:68px; } .arrow { margin:14px 0; font-size:46px; }' : ''}
        ${horror ? analogStyles() : ''}
    </style></head><body><main><h1>6HOPS</h1><div class="pair"><span class="term">${escapeHtml(demo.start)}</span><span class="arrow">↓</span><span class="term">${escapeHtml(demo.goal)}</span></div></main></body></html>`;
}

function analogStyles() {
    return `body { background:#101210; color:#d9ddd4; }
        .pair { color:inherit; } main { text-shadow:2px 0 #62685c,-1px 0 #889082; }
        body::after { content:''; position:fixed; inset:0; pointer-events:none;
            background:repeating-linear-gradient(0deg,transparent 0 3px,rgba(0,0,0,.24) 3px 5px);
            box-shadow:inset 0 0 180px 50px #0009; }
        main { animation:tape-drift 2.4s steps(1) infinite; }
        @keyframes tape-drift { 0%,86%,100% { opacity:1; filter:blur(.4px); }
            87%,90% { opacity:.65; filter:blur(1.2px); translate:3px 0; } }
    `;
}

async function fitTitle(page) {
    await page.evaluate(async () => {
        await document.fonts.ready;
        const main=document.querySelector('main');
        const available=innerHeight-120;
        if(main && main.scrollHeight>available) main.style.zoom=String(available/main.scrollHeight);
    });
}

function beatPageHtml(text) {
    return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><style>
        * { box-sizing: border-box; }
        html, body { width:100%; height:100%; margin:0; }
        body { display:flex; align-items:center; justify-content:center; padding:72px; background:#202122; color:#fff;
            font-family:'Yu Gothic UI','Noto Sans JP',sans-serif; text-align:center; }
        main { max-width:620px; font-size:clamp(82px,15vw,124px); font-weight:900; line-height:1.12;
            overflow-wrap:anywhere; text-wrap:balance; }
        ${analogStyles()}
    </style></head><body><main>${escapeHtml(text)}</main></body></html>`;
}

async function addDemoStyles(page) {
    await page.addStyleTag({ content: `
        #sixhops-demo-caption {
            font-family: 'Zen Maru Gothic', 'Noto Sans JP', 'Yu Gothic UI', sans-serif;
            box-sizing: border-box;
            pointer-events: none;
        }
        #sixhops-demo-caption {
            position: fixed;
            left: 36px;
            right: 92px;
            top: 50%;
            min-height: 126px;
            padding: 22px 28px 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 14px;
            background: rgba(45, 49, 54, 0.88);
            color: #fff;
            box-shadow: 0 -8px 28px rgba(32, 33, 34, 0.12);
            backdrop-filter: blur(3px);
            text-align: center;
            opacity: 0;
            transform: translateY(calc(-50% + 12px));
            transition: opacity 180ms ease, transform 180ms ease;
            z-index: 2147483646;
        }
        #sixhops-demo-caption.visible {
            opacity: 1;
            transform: translateY(-50%);
        }
        #sixhops-demo-caption .demo-main {
            display: block;
            font-size: 34px;
            font-weight: 800;
            line-height: 1.25;
            letter-spacing: 0.02em;
        }
        #sixhops-demo-caption .demo-sub {
            display: block;
            margin-top: 4px;
            color: rgba(255, 255, 255, 0.78);
            font-size: 20px;
            font-weight: 700;
        }
        #sixhops-demo-caption.accent {
            border-color: rgba(132, 168, 255, 0.85);
            background: rgba(39, 49, 67, 0.92);
            box-shadow: 0 -8px 28px rgba(51, 102, 204, 0.16);
        }
        #sixhops-demo-caption.accent .demo-main {
            color: #fff;
        }
        .sixhops-demo-link {
            position: relative !important;
            border-bottom: 3px solid #3366cc !important;
            background: #eaf3ff !important;
            color: #0b0080 !important;
            box-shadow: 0 0 0 6px rgba(51, 102, 204, 0.12) !important;
            border-radius: 2px !important;
        }
    ` });

}

async function showCaption(page, main, sub = '', accent = false) {
    await page.evaluate(({ main, sub, accent }) => {
        let caption = document.querySelector('#sixhops-demo-caption');
        if (!caption) {
            caption = document.createElement('div');
            caption.id = 'sixhops-demo-caption';
            document.body.appendChild(caption);
        }
        caption.className = accent ? 'accent' : '';
        caption.innerHTML = '';
        const mainLine = document.createElement('span');
        mainLine.className = 'demo-main';
        mainLine.textContent = main;
        caption.appendChild(mainLine);
        if (sub) {
            const subLine = document.createElement('span');
            subLine.className = 'demo-sub';
            subLine.textContent = sub;
            caption.appendChild(subLine);
        }
        requestAnimationFrame(() => caption.classList.add('visible'));
    }, { main, sub, accent });
    await sleep(240);
}

async function hideCaption(page) {
    await page.evaluate(() => {
        const caption = document.querySelector('#sixhops-demo-caption');
        if (caption) caption.classList.remove('visible');
    });
    await sleep(220);
}

async function waitForArticle(page, title) {
    await page.waitForFunction((expected) => {
        const heading = document.querySelector('.wikiBlock > h2');
        return heading && heading.textContent.trim() === expected;
    }, title, { timeout: 30000 });
}

async function highlightLink(page, title) {
    const currentHeading = await page.locator('.wikiBlock > h2').first().textContent().catch(() => '');
    console.log(`Finding link: ${currentHeading || '(result)'} -> ${title}`);
    const links = page.locator(`.wikiBlock a[title="${title}"]`);
    await page.waitForFunction((expectedTitle) => (
        [...document.querySelectorAll('.wikiBlock a')].some((element) => (
            element.getAttribute('title') === expectedTitle && element.getClientRects().length > 0
        ))
    ), title, { timeout: 30000 });
    const count = await links.count();
    let link = null;
    for (let index = 0; index < count; index += 1) {
        const candidate = links.nth(index);
        if (await candidate.isVisible()) {
            link = candidate;
            break;
        }
    }
    if (!link) throw new Error(`表示可能なリンクが見つかりません: ${title}`);
    await link.scrollIntoViewIfNeeded();
    await page.waitForTimeout(350);
    await link.evaluate((element) => element.classList.add('sixhops-demo-link'));
    return link;
}

async function main() {
    const browser = await chromium.launch({
        headless: true,
        executablePath: browserPath,
        args: [
            '--disable-gpu-sandbox',
            `--window-size=${viewport.width},${viewport.height}`,
            '--force-device-scale-factor=1',
            '--high-dpi-support=1'
        ]
    });
    const context = await browser.newContext({
        viewport,
        screen: viewport,
        locale: 'ja-JP',
        timezoneId: 'Asia/Tokyo',
        deviceScaleFactor: 1.5,
        recordVideo: {
            dir: outputDir,
            size: videoSize
        }
    });
    const page = await context.newPage();
    const video = page.video();
    const recordingStartedAt = Date.now();
    let chimeAt = null;

    const imagePage = await browser.newPage({ viewport: { width:1280, height:720 }, deviceScaleFactor:1 });
    await imagePage.setContent(titlePageHtml(true));
    await fitTitle(imagePage);
    await imagePage.screenshot({ path: thumbnailPath, type: 'jpeg', quality: 95 });
    await imagePage.close();
    await page.setContent(titlePageHtml());
    await fitTitle(page);
    await page.screenshot({ path: coverPath, type: 'jpeg', quality: 95 });
    if(args['images-only']) {
        await context.close();
        await browser.close();
        console.log(thumbnailPath);
        console.log(coverPath);
        return;
    }
    await sleep(3800);

    const localePath = locale === 'en' ? 'en/' : '';
    await page.goto(`${baseUrl}${localePath}?date=${demo.date}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('.startBlock', { state: 'visible', timeout: 30000 });
    await page.waitForFunction((expected) => {
        const boxes = [...document.querySelectorAll('.rectangle')];
        return boxes.length >= 2 && boxes[0].textContent.trim() === expected.start && boxes[1].textContent.trim() === expected.goal;
    }, { start: demo.start, goal: demo.goal }, { timeout: 30000 });
    await addDemoStyles(page);

    await showCaption(page, demo.todayChallenge, `${demo.start} → ${demo.goal}`, true);
    await sleep(3600);
    await hideCaption(page);

    await page.locator('.startBlock').click();
    await waitForArticle(page, demo.start);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await showCaption(page, demo.startCaption(demo.start), demo.startSubcaption(demo.goal));
    await sleep(2500);
    await hideCaption(page);

    for (let index = 1; index < demo.route.length; index += 1) {
        const title = demo.route[index];
        const isGoal = index === demo.route.length - 1;
        const link = await highlightLink(page, title);
        const moveCaption = isGoal
            ? demo.goalFound(demo.goal)
            : (index === 1 ? demo.firstMove(title) : demo.nextMove(title));
        await showCaption(page, moveCaption, isGoal ? '' : demo.linkInstruction);
        await sleep(isGoal ? 1500 : 1300);
        await hideCaption(page);
        await link.click();

        if (isGoal) {
            await page.waitForFunction((successText) => document.body.textContent.includes(successText), demo.successText, { timeout: 30000 });
        } else {
            await waitForArticle(page, title);
            const hopLabel = `${index} ${index === 1 ? 'HOP' : 'HOPS'}`;
            await showCaption(page, hopLabel, demo.remaining(6 - index), true);
            await sleep(index === 2 ? 3000 : 2400);
            await hideCaption(page);
        }
    }

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    const hops = demo.route.length - 1;
    await showCaption(page, demo.goalCaption(hops), demo.goalSubcaption, true);
    await sleep(4300);
    await hideCaption(page);

    const outroAt = (Date.now() - recordingStartedAt) / 1000;
    await page.setContent(beatPageHtml(demo.start));
    await sleep(1000);
    await page.setContent(beatPageHtml(demo.goal));
    await sleep(1000);
    await page.setContent(beatPageHtml('6HOPS'));
    await sleep(1000);
    await page.setContent(titlePageHtml(false, true));
    await fitTitle(page);
    chimeAt = (Date.now() - recordingStartedAt) / 1000;
    await sleep(4000);
    await page.setContent('<html style="background:#000"><body></body></html>');
    await sleep(240);
    await context.close();
    await video.saveAs(rawVideoPath);
    await browser.close();
    fs.writeFileSync(timingPath, `${JSON.stringify({ chimeAt, outroAt }, null, 2)}\n`, 'utf8');

    console.log(rawVideoPath);
    console.log(thumbnailPath);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
