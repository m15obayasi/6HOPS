const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const projectRoot = path.resolve(__dirname, '..');
const outputDir = path.join(__dirname, 'output');
const rawVideoPath = path.join(outputDir, '6hops-daily-demo-ja-raw.webm');
const baseUrl = process.env.SIX_HOPS_URL || 'http://127.0.0.1:8770/';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

fs.mkdirSync(outputDir, { recursive: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function addDemoStyles(page) {
    await page.addStyleTag({ content: `
        #sixhops-demo-caption,
        #sixhops-demo-card {
            font-family: 'Zen Maru Gothic', 'Noto Sans JP', 'Yu Gothic UI', sans-serif;
            box-sizing: border-box;
            pointer-events: none;
        }
        #sixhops-demo-caption {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            min-height: 112px;
            padding: 18px 48px 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-top: 1px solid rgba(255, 255, 255, 0.28);
            background: rgba(45, 49, 54, 0.78);
            color: #fff;
            box-shadow: 0 -8px 28px rgba(32, 33, 34, 0.12);
            backdrop-filter: blur(3px);
            text-align: center;
            opacity: 0;
            transform: translateY(12px);
            transition: opacity 180ms ease, transform 180ms ease;
            z-index: 2147483646;
        }
        #sixhops-demo-caption.visible {
            opacity: 1;
            transform: translateY(0);
        }
        #sixhops-demo-caption .demo-main {
            display: block;
            font-size: 28px;
            font-weight: 800;
            line-height: 1.25;
            letter-spacing: 0.02em;
        }
        #sixhops-demo-caption .demo-sub {
            display: block;
            margin-top: 4px;
            color: rgba(255, 255, 255, 0.78);
            font-size: 16px;
            font-weight: 700;
        }
        #sixhops-demo-caption.accent {
            border-top-color: rgba(132, 168, 255, 0.8);
            background: rgba(39, 49, 67, 0.82);
            box-shadow: 0 -8px 28px rgba(51, 102, 204, 0.16);
        }
        #sixhops-demo-caption.accent .demo-main {
            color: #fff;
        }
        #sixhops-demo-card {
            position: fixed;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px;
            background: #f8f9fa;
            color: #202122;
            text-align: center;
            opacity: 0;
            transition: opacity 300ms ease;
            z-index: 2147483647;
        }
        #sixhops-demo-card.visible { opacity: 1; }
        #sixhops-demo-card .demo-kicker {
            margin-bottom: 20px;
            color: #3366cc;
            font-size: 18px;
            font-weight: 800;
            letter-spacing: 0.15em;
        }
        #sixhops-demo-card .demo-card-title {
            font-size: 64px;
            font-weight: 900;
            line-height: 1.18;
            letter-spacing: 0.02em;
        }
        #sixhops-demo-card .demo-card-subtitle {
            margin-top: 18px;
            color: #54595d;
            font-size: 28px;
            font-weight: 700;
        }
        #sixhops-demo-card .demo-rule {
            width: 96px;
            height: 3px;
            margin-top: 30px;
            background: #202122;
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

async function showCard(page, kicker, title, subtitle, duration) {
    await page.evaluate(({ kicker, title, subtitle }) => {
        let card = document.querySelector('#sixhops-demo-card');
        if (!card) {
            card = document.createElement('div');
            card.id = 'sixhops-demo-card';
            document.body.appendChild(card);
        }
        card.innerHTML = '';
        const kickerLine = document.createElement('div');
        kickerLine.className = 'demo-kicker';
        kickerLine.textContent = kicker;
        const titleLine = document.createElement('div');
        titleLine.className = 'demo-card-title';
        titleLine.textContent = title;
        const subtitleLine = document.createElement('div');
        subtitleLine.className = 'demo-card-subtitle';
        subtitleLine.textContent = subtitle;
        const rule = document.createElement('div');
        rule.className = 'demo-rule';
        card.append(kickerLine, titleLine, subtitleLine, rule);
        requestAnimationFrame(() => card.classList.add('visible'));
    }, { kicker, title, subtitle });
    await sleep(duration);
}

async function hideCard(page) {
    await page.evaluate(() => {
        const card = document.querySelector('#sixhops-demo-card');
        if (card) card.classList.remove('visible');
    });
    await sleep(380);
}

async function waitForArticle(page, title) {
    await page.waitForFunction((expected) => {
        const heading = document.querySelector('.wikiBlock > h2');
        return heading && heading.textContent.trim() === expected;
    }, title, { timeout: 30000 });
}

async function highlightLink(page, title) {
    const link = page.locator(`.wikiBlock a[title="${title}"]`).first();
    await link.waitFor({ state: 'visible', timeout: 30000 });
    await link.scrollIntoViewIfNeeded();
    await page.waitForTimeout(350);
    await link.evaluate((element) => element.classList.add('sixhops-demo-link'));
    return link;
}

async function main() {
    const browser = await chromium.launch({
        headless: true,
        executablePath: edgePath,
        args: [
            '--disable-gpu-sandbox',
            '--window-size=1280,720',
            '--force-device-scale-factor=1',
            '--high-dpi-support=1'
        ]
    });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        screen: { width: 1280, height: 720 },
        locale: 'ja-JP',
        timezoneId: 'Asia/Tokyo',
        deviceScaleFactor: 1,
        recordVideo: {
            dir: outputDir,
            size: { width: 1280, height: 720 }
        }
    });
    const page = await context.newPage();
    const video = page.video();

    await page.setContent(`<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>
        * { box-sizing: border-box; }
        html, body { width: 100%; height: 100%; margin: 0; }
        body { display:flex; align-items:center; justify-content:center; background:#f8f9fa; color:#202122;
            font-family:'Yu Gothic UI','Noto Sans JP',sans-serif; text-align:center; }
        .kicker { color:#3366cc; font-size:18px; font-weight:800; letter-spacing:.16em; margin-bottom:18px; }
        h1 { margin:0; font-size:76px; line-height:1; letter-spacing:.03em; }
        p { margin:22px 0 0; color:#54595d; font-size:30px; font-weight:700; }
        .challenge { display:inline-flex; align-items:center; gap:20px; margin-top:30px; padding:13px 24px;
            border:1px solid #a2a9b1; background:#fff; font-weight:800; }
        .date { color:#54595d; font-size:18px; letter-spacing:.04em; }
        .pair { color:#202122; font-size:28px; }
        .rule { width:96px; height:3px; margin:32px auto 0; background:#202122; }
    </style></head><body><main><div class="kicker">DAILY MODE</div><h1>6HOPS</h1><p>— Wikipediaを使ったゲーム —</p><div class="challenge"><span class="date">2026-09-22</span><span class="pair">石鹸 → 侍</span></div><div class="rule"></div></main></body></html>`);
    await sleep(3800);

    await page.goto(`${baseUrl}?date=2026-09-22`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('.startBlock', { state: 'visible', timeout: 30000 });
    await page.waitForFunction(() => {
        const boxes = [...document.querySelectorAll('.rectangle')];
        return boxes.length >= 2 && boxes[0].textContent.trim() === '石鹸' && boxes[1].textContent.trim() === '侍';
    }, null, { timeout: 30000 });
    await addDemoStyles(page);

    await showCaption(page, '今日のお題', '石鹸 → 侍', true);
    await sleep(3600);
    await hideCaption(page);

    await page.locator('.startBlock').click();
    await waitForArticle(page, '石鹸');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await showCaption(page, 'スタート：「石鹸」', 'リンクだけを辿って「侍」を目指します');
    await sleep(2500);
    await hideCaption(page);

    const japanLink = await highlightLink(page, '日本');
    await showCaption(page, 'まずは「日本」へ', '記事内のリンクをクリック');
    await sleep(1500);
    await hideCaption(page);
    await japanLink.click();
    await waitForArticle(page, '日本');
    await showCaption(page, '1 HOP', '石鹸 → 日本', true);
    await sleep(2400);
    await hideCaption(page);

    const warriorLink = await highlightLink(page, '武士');
    await showCaption(page, '次は「武士」へ');
    await sleep(1200);
    await hideCaption(page);
    await warriorLink.click();
    await waitForArticle(page, '武士');
    await showCaption(page, '2 HOPS', 'あと4回', true);
    await sleep(3000);
    await hideCaption(page);

    const samuraiLink = await highlightLink(page, '侍');
    await showCaption(page, 'ゴールの「侍」を発見！');
    await sleep(1500);
    await hideCaption(page);
    await samuraiLink.click();
    await page.waitForFunction(() => document.body.textContent.includes('成功'), null, { timeout: 30000 });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await showCaption(page, '3 HOPSでゴール！', '今日のDaily、クリア', true);
    await sleep(4300);
    await hideCaption(page);

    await showCard(page, '6HOPS DAILY', 'お題は毎日変わります。', '今日の組み合わせに挑戦しよう', 5000);
    await context.close();
    await video.saveAs(rawVideoPath);
    await browser.close();

    console.log(rawVideoPath);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
