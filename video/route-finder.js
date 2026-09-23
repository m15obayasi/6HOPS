const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const OUTPUT_DIR = path.join(__dirname, 'output');
const CACHE_PATH = path.join(OUTPUT_DIR, 'route-cache.json');
const OVERRIDES_PATH = path.join(__dirname, 'route-overrides.json');
const PATH_API = 'https://api.sixdegreesofwikipedia.com/paths';
const USER_AGENT = '6HOPS-Daily-Video/1.0 (https://myeik.net/6HOPS/)';
const BRIDGE_PAGES = [
    'Europe', 'Asia', 'Africa', 'South America', 'United States', 'Earth',
    'Science', 'History', 'World War II', 'Japan', 'Germany', 'France',
    'United Nations', 'Technology', 'Culture'
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function readJson(filePath, fallback = {}) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (_) {
        return fallback;
    }
}

function writeJson(filePath, value) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function fetchJson(url, options = {}, attempts = 4) {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: { 'user-agent': USER_AGENT, ...(options.headers || {}) }
            });
            const text = await response.text();
            if (!response.ok) throw new Error(`${response.status}: ${text.slice(0, 300)}`);
            return JSON.parse(text);
        } catch (error) {
            lastError = error;
            if (attempt < attempts) await sleep(800 * attempt);
        }
    }
    throw lastError;
}

async function getEnglishCandidates(start, goal) {
    const payload = await fetchJson(PATH_API, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ source: start, target: goal })
    }, 3);
    if (!Array.isArray(payload.paths) || payload.paths.length === 0) {
        throw new Error(`英語版の経路が見つかりません: ${start} → ${goal}`);
    }
    const candidates = payload.paths
        .map((ids) => ids.map((id) => ({ id: String(id), title: payload.pages?.[id]?.title })))
        .filter((route) => route.length >= 2 && route.length <= 7 && route.every((page) => page.title));
    if (!candidates.length) throw new Error('6 HOPS以内の英語版経路が見つかりません。');
    return candidates;
}

function combineCandidates(first, second, limit = 180) {
    const combined = [];
    for (const left of first) {
        for (const right of second) {
            if (left[left.length - 1].title !== right[0].title) continue;
            const route = left.concat(right.slice(1));
            if (route.length <= 7 && new Set(route.map((page) => page.title)).size === route.length) {
                combined.push(route);
                if (combined.length >= limit) return combined;
            }
        }
    }
    return combined;
}

async function getPageLinks(locale, title, linkCache) {
    const cacheKey = `${locale}:${title}`;
    if (linkCache.has(cacheKey)) return linkCache.get(cacheKey);
    const endpoint = new URL(`https://${locale}.wikipedia.org/w/api.php`);
    endpoint.search = new URLSearchParams({
        action: 'parse',
        page: title,
        prop: 'text',
        format: 'json',
        origin: '*'
    }).toString();
    const payload = await fetchJson(endpoint, {}, 4);
    if (!payload.parse) throw new Error(`${locale} Wikipediaの記事を取得できません: ${title}`);
    const $ = cheerio.load(payload.parse.text?.['*'] || '');
    $('.reflist, .navbox, .metadata, .external, .mw-references-wrap, span.mw-editsection, sup.reference').remove();
    const links = new Set();
    $('a[title]').each((_, element) => {
        const link = $(element);
        const href = link.attr('href') || '';
        const linkTitle = link.attr('title');
        if (link.hasClass('new') || !linkTitle) return;
        if (/^(?:https?:)?\/\//.test(href) && !href.includes(`${locale}.wikipedia.org`)) return;
        links.add(linkTitle);
    });
    const value = { title: payload.parse.title || title, links };
    linkCache.set(cacheKey, value);
    await sleep(120);
    return value;
}

async function validateRoute(locale, route, linkCache) {
    const validated = [route[0]];
    for (let index = 0; index < route.length - 1; index += 1) {
        const page = await getPageLinks(locale, validated[index], linkCache);
        const next = route[index + 1];
        if (!page.links.has(next)) return null;
        validated.push(next);
    }
    return validated;
}

async function findLiveEnglishRoute(candidates, linkCache) {
    for (const candidate of candidates) {
        const route = candidate.map((page) => page.title);
        const validated = await validateRoute('en', route, linkCache);
        if (validated) return { route: validated, ids: candidate.map((page) => page.id) };
    }
    return null;
}

async function getJapaneseTitles(ids) {
    const result = new Map();
    for (let offset = 0; offset < ids.length; offset += 50) {
        const batch = ids.slice(offset, offset + 50);
        const endpoint = new URL('https://en.wikipedia.org/w/api.php');
        endpoint.search = new URLSearchParams({
            action: 'query',
            pageids: batch.join('|'),
            prop: 'langlinks',
            lllang: 'ja',
            lllimit: 'max',
            format: 'json',
            origin: '*'
        }).toString();
        const payload = await fetchJson(endpoint, {}, 4);
        Object.entries(payload.query?.pages || {}).forEach(([id, page]) => {
            const title = page.langlinks?.[0]?.['*'];
            if (title) result.set(String(id), title);
        });
        await sleep(150);
    }
    return result;
}

async function findJapaneseRoute(candidates, dailyStart, dailyGoal, linkCache) {
    const uniqueIds = [...new Set(candidates.flatMap((route) => route.map((page) => page.id)))];
    const translations = await getJapaneseTitles(uniqueIds);
    for (const candidate of candidates) {
        const route = candidate.map((page) => translations.get(page.id));
        if (route.some((title) => !title)) continue;
        route[0] = dailyStart;
        route[route.length - 1] = dailyGoal;
        const validated = await validateRoute('ja', route, linkCache);
        if (validated) return validated;
    }
    return null;
}

function routeKey(locale, start, goal) {
    return `${locale}:${start}→${goal}`;
}

async function findRoutes(challenges, options = {}) {
    const cache = readJson(CACHE_PATH, {});
    const overrides = readJson(OVERRIDES_PATH, {});
    const jaKey = routeKey('ja', challenges.ja.start, challenges.ja.goal);
    const enKey = routeKey('en', challenges.en.start, challenges.en.goal);
    const cachedJa = overrides[jaKey] || cache[jaKey];
    const cachedEn = overrides[enKey] || cache[enKey];
    const linkCache = new Map();

    if (cachedJa && cachedEn) {
        const [ja, en] = await Promise.all([
            validateRoute('ja', cachedJa, linkCache),
            validateRoute('en', cachedEn, linkCache)
        ]);
        if (ja && en) return { ja, en, source: 'cache' };
    }

    if (options.offline) throw new Error('検証済み経路がキャッシュにありません。');
    let candidates = await getEnglishCandidates(challenges.en.start, challenges.en.goal);
    let enResult = await findLiveEnglishRoute(candidates, linkCache);
    let ja = await findJapaneseRoute(candidates, challenges.ja.start, challenges.ja.goal, linkCache);
    for (const bridge of BRIDGE_PAGES) {
        if (enResult && ja) break;
        if ([challenges.en.start, challenges.en.goal].includes(bridge)) continue;
        console.log(`代替経路を確認中: ${bridge}`);
        try {
            const first = await getEnglishCandidates(challenges.en.start, bridge);
            const second = await getEnglishCandidates(bridge, challenges.en.goal);
            candidates = combineCandidates(first, second);
            if (!candidates.length) continue;
            if (!enResult) enResult = await findLiveEnglishRoute(candidates, linkCache);
            if (!ja) ja = await findJapaneseRoute(candidates, challenges.ja.start, challenges.ja.goal, linkCache);
        } catch (error) {
            console.warn(`  ${bridge}: ${error.message}`);
        }
    }
    if (!enResult) throw new Error('現在の英語版Wikipedia上で辿れる6 HOPS以内の経路が見つかりません。');
    if (!ja && cachedJa) ja = await validateRoute('ja', cachedJa, linkCache);
    if (!ja) throw new Error('現在の日本語版Wikipedia上で辿れる6 HOPS以内の経路が見つかりません。');
    cache[jaKey] = ja;
    cache[enKey] = enResult.route;
    writeJson(CACHE_PATH, cache);
    return { ja, en: enResult.route, source: 'live' };
}

module.exports = {
    findRoutes,
    validateRoute,
    routeKey,
    getEnglishCandidates,
    combineCandidates,
    getJapaneseTitles
};
