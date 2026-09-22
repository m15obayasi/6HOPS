const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const requestedLocale = process.argv.includes('--locale')
    ? process.argv[process.argv.indexOf('--locale') + 1]
    : 'ja';
const locale = requestedLocale === 'en' ? 'en' : 'ja';
const demo = {
    ja: {
        date: '2026-09-22',
        start: '石鹸',
        goal: '侍',
        route: ['石鹸', '日本', '武士', '侍'],
        todayChallenge: '今日のお題',
        startCaption: 'スタート：「石鹸」',
        startSubcaption: 'リンクだけを辿って「侍」を目指します',
        firstMove: (title) => `まずは「${title}」へ`,
        nextMove: (title) => `次は「${title}」へ`,
        linkInstruction: '記事内のリンクをクリック',
        remaining: (count) => `あと${count}回`,
        goalFound: 'ゴールの「侍」を発見！',
        successText: '成功',
        goalCaption: (hops) => `${hops} HOPSでゴール！`,
        goalSubcaption: '今日のDaily、クリア',
        endTitle: 'お題は毎日変わります。',
        endSubtitle: '今日の組み合わせに挑戦しよう'
    },
    en: {
        date: '2026-09-22',
        start: 'Soap',
        goal: 'Samurai',
        route: ['Soap', 'West Asia', 'Asia', 'Japan', 'Samurai'],
        todayChallenge: "Today's challenge",
        startCaption: 'Start: “Soap”',
        startSubcaption: 'Follow links only and reach “Samurai”',
        firstMove: (title) => `First, go to “${title}”`,
        nextMove: (title) => `Next: “${title}”`,
        linkInstruction: 'Click a link inside the article',
        remaining: (count) => `${count} hops remaining`,
        goalFound: 'Found the goal: “Samurai”!',
        successText: 'Success',
        goalCaption: (hops) => `Goal in ${hops} HOPS!`,
        goalSubcaption: "Today's Daily cleared",
        endTitle: 'A new challenge every day.',
        endSubtitle: "Take on today's pair"
    }
}[locale];

const projectRoot = path.resolve(__dirname, '..');
const outputDir = path.join(__dirname, 'output');
const rawVideoPath = path.join(outputDir, `6hops-daily-demo-${locale}-raw.webm`);
const baseUrl = process.env.SIX_HOPS_URL || 'http://127.0.0.1:8770/';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

fs.mkdirSync(outputDir, { recursive: true });

const timingScale = process.env.SIX_HOPS_FAST === '1' ? 0.05 : 1;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, Math.max(20, Math.round(ms * timingScale))));

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
        main { width:min(1160px,calc(100% - 72px)); }
        h1 { margin:0; font-size:154px; line-height:.95; letter-spacing:.035em; }
        .pair { margin-top:54px; color:#202122; font-size:clamp(52px,6.4vw,86px); font-weight:900;
            line-height:1.18; overflow-wrap:anywhere; }
    </style></head><body><main><h1>6HOPS</h1><div class="pair">${demo.start} → ${demo.goal}</div></main></body></html>`);
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
    await showCaption(page, demo.startCaption, demo.startSubcaption);
    await sleep(2500);
    await hideCaption(page);

    for (let index = 1; index < demo.route.length; index += 1) {
        const title = demo.route[index];
        const isGoal = index === demo.route.length - 1;
        const link = await highlightLink(page, title);
        const moveCaption = isGoal
            ? demo.goalFound
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

    await showCard(page, '6HOPS DAILY', demo.endTitle, demo.endSubtitle, 5000);
    await context.close();
    await video.saveAs(rawVideoPath);
    await browser.close();

    console.log(rawVideoPath);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
