const fs = require('fs');
const { loadDailyData, parseArgs, paths } = require('./youtube/common');
const { findRoutes } = require('./route-finder');

const args = parseArgs(process.argv.slice(2));
const date = args.date || new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date());

function challengeForIndex(daily, index) {
    const challenge = daily.challenges[index];
    return {
        ja: { start: challenge.start.ja, goal: challenge.goal.ja },
        en: { start: challenge.start.en, goal: challenge.goal.en }
    };
}

function replaceOverrideBlock(overrides) {
    const source = fs.readFileSync(paths.dailyData, 'utf8');
    const startMarker = '    // BEGIN GENERATED DAILY OVERRIDES';
    const endMarker = '    // END GENERATED DAILY OVERRIDES';
    const start = source.indexOf(startMarker);
    const end = source.indexOf(endMarker);
    if (start < 0 || end < start) throw new Error('Daily override markers were not found.');
    const entries = Object.keys(overrides)
        .sort()
        .map((key) => `        ${JSON.stringify(key)}: ${overrides[key]}`)
        .join(',\n');
    const replacement = [
        startMarker,
        '    const dateOverrides = {',
        entries,
        '    };',
        endMarker
    ].filter((line, index) => line || index !== 2).join('\n');
    const updated = `${source.slice(0, start)}${replacement}${source.slice(end + endMarker.length)}`;
    if (updated === source) return false;
    fs.writeFileSync(paths.dailyData, updated, 'utf8');
    return true;
}

async function validate(index, daily) {
    const challenge = challengeForIndex(daily, index);
    console.log(`候補 ${index}: ${challenge.ja.start} → ${challenge.ja.goal}`);
    const routes = await findRoutes(challenge);
    console.log(`  JA: ${routes.ja.join(' → ')}`);
    console.log(`  EN: ${routes.en.join(' → ')}`);
    return routes;
}

async function main() {
    if (!/^20\d{2}-\d{2}-\d{2}$/.test(date)) throw new Error(`日付が不正です: ${date}`);
    const daily = loadDailyData();
    const selected = daily.getChallenge(date, 'ja');
    try {
        await validate(selected.pairIndex, daily);
        console.log(`${date}のお題は変更不要です。`);
        return;
    } catch (error) {
        console.warn(`選択中のお題を差し替えます: ${error.message}`);
    }

    for (let offset = 1; offset < daily.challenges.length; offset += 1) {
        const index = (selected.pairIndex + offset) % daily.challenges.length;
        try {
            await validate(index, daily);
            if (args['dry-run']) {
                console.log(`ドライラン: ${date}を候補${index}へ差し替えます。`);
                return;
            }
            const overrides = { ...daily.dateOverrides, [date]: index };
            const changed = replaceOverrideBlock(overrides);
            console.log(changed
                ? `${date}のお題を候補${index}へ差し替えました。`
                : `${date}のお題は既に候補${index}です。`);
            return;
        } catch (error) {
            console.warn(`  候補${index}は使用しません: ${error.message}`);
        }
    }
    throw new Error('検証済みの代替お題が見つかりませんでした。');
}

main().catch((error) => {
    console.error(`\nエラー: ${error.message || error}`);
    process.exitCode = 1;
});
