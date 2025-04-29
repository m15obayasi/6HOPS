const dailyArticles = [
    { date: "2025-04-20", start: "キウイフルーツ", goal: "美少女戦士セーラームーン" },
    { date: "2025-04-21", start: "美少女戦士セーラームーン", goal: "我が家" },
    { date: "2025-04-22", start: "我が家", goal: "電気抵抗" },
    { date: "2025-04-23", start: "電気抵抗", goal: "梅田芸術劇場" },
    { date: "2025-04-24", start: "梅田芸術劇場", goal: "消化試合" },
    { date: "2025-04-25", start: "消化試合", goal: "星新一" },
    { date: "2025-04-26", start: "星新一", goal: "天童よしみ" },
    { date: "2025-04-27", start: "天童よしみ", goal: "あなたの番です" },
    { date: "2025-04-28", start: "あなたの番です", goal: "夏の終わり (森山直太朗の曲)" },
    { date: "2025-04-29", start: "夏の終わり (森山直太朗の曲)", goal: "志の輔ラジオ 落語DEデート" },
    { date: "2025-04-30", start: "志の輔ラジオ 落語DEデート", goal: "経済産業省" },
    { date: "2025-05-01", start: "経済産業省", goal: "ドミニオン (カードゲーム)" },
    { date: "2025-05-02", start: "ドミニオン (カードゲーム)", goal: "杉崎花" },
    { date: "2025-05-03", start: "杉崎花", goal: "エジプトガン" },
    { date: "2025-05-04", start: "エジプトガン", goal: "沖縄そば" },
    { date: "2025-05-05", start: "沖縄そば", goal: "タイムマシーン3号" },
    { date: "2025-05-06", start: "タイムマシーン3号", goal: "船場吉兆" },
    { date: "2025-05-07", start: "船場吉兆", goal: "ぐるぐるナインティナイン" },
    { date: "2025-05-08", start: "ぐるぐるナインティナイン", goal: "江戸川乱歩" },
    { date: "2025-05-09", start: "江戸川乱歩", goal: "わたしの一番かわいいところ" },
    { date: "2025-05-10", start: "わたしの一番かわいいところ", goal: "薩摩揚げ" },
    { date: "2025-05-11", start: "薩摩揚げ", goal: "あいみょんのオールナイトニッポンGOLD" },
    { date: "2025-05-12", start: "あいみょんのオールナイトニッポンGOLD", goal: "からかい上手の高木さん" },
    { date: "2025-05-13", start: "からかい上手の高木さん", goal: "だいたひかる" },
    { date: "2025-05-14", start: "だいたひかる", goal: "くるり" },
    { date: "2025-05-15", start: "くるり", goal: "なすなかにし" },
    { date: "2025-05-16", start: "なすなかにし", goal: "ハプスブルク家" },
    { date: "2025-05-17", start: "ハプスブルク家", goal: "ソニー" },
    { date: "2025-05-18", start: "ソニー", goal: "白い巨塔" },
    { date: "2025-05-19", start: "白い巨塔", goal: "ダウ90000" },
    { date: "2025-05-20", start: "ダウ90000", goal: "オダギリジョー" },
    { date: "2025-05-21", start: "オダギリジョー", goal: "トマト" },
    { date: "2025-05-22", start: "トマト", goal: "ちびまる子ちゃん" },
    { date: "2025-05-23", start: "ちびまる子ちゃん", goal: "ザ・ドリフターズ" },
    { date: "2025-05-24", start: "ザ・ドリフターズ", goal: "あらしのよるに" },
    { date: "2025-05-25", start: "あらしのよるに", goal: "ナタリー・ポートマン" },
    { date: "2025-05-26", start: "ナタリー・ポートマン", goal: "上野動物園クロヒョウ脱走事件" },
    { date: "2025-05-27", start: "上野動物園クロヒョウ脱走事件", goal: "味の素" },
    { date: "2025-05-28", start: "味の素", goal: "霜降り明星" },
    { date: "2025-05-29", start: "霜降り明星", goal: "吾輩は猫である" },
    { date: "2025-05-30", start: "吾輩は猫である", goal: "みうらじゅんのサントラくん" },
    { date: "2025-05-31", start: "みうらじゅんのサントラくん", goal: "ジャッキー・チェン" },
    { date: "2025-06-01", start: "ジャッキー・チェン", goal: "ウマ娘 プリティーダービー" },
    { date: "2025-06-02", start: "ウマ娘 プリティーダービー", goal: "野原ひろし" },
    { date: "2025-06-03", start: "野原ひろし", goal: "ダレン・シャン (小説)" },
    { date: "2025-06-04", start: "ダレン・シャン (小説)", goal: "中野ブロードウェイ" },
    { date: "2025-06-05", start: "中野ブロードウェイ", goal: "ジュビロ磐田" },
    { date: "2025-06-06", start: "ジュビロ磐田", goal: "サニーデイ・サービス" },
    { date: "2025-06-07", start: "サニーデイ・サービス", goal: "パネルクイズ アタック25" },
    { date: "2025-06-08", start: "パネルクイズ アタック25", goal: "日刊スポーツ" },
    { date: "2025-06-09", start: "日刊スポーツ", goal: "弓木英梨乃" },
    { date: "2025-06-10", start: "弓木英梨乃", goal: "決闘用ピストル" },
    { date: "2025-06-11", start: "決闘用ピストル", goal: "Kiroro" },
    { date: "2025-06-12", start: "Kiroro", goal: "アルコ&ピース" },
    { date: "2025-06-13", start: "アルコ&ピース", goal: "蟹工船" },
    { date: "2025-06-14", start: "蟹工船", goal: "SHISHAMO" },

];

$(document).ready(function() {
    setupDailyMode();
    $('.wikiBlock').on('click', 'a', function(event) {
        event.preventDefault();
        const linkTitle = $(this).attr('title');
        if (linkTitle) {
            fetchWikipediaArticle(linkTitle);
        }
    });
});

function setupDailyMode() {
    const formattedDate = getJapanDate();
    const article = dailyArticles.find(item => item.date === formattedDate);

    if (article) {
        $('.rectangleLabel.first').text("最初の記事");
        $('.rectangleLabel.second').text("6つ目の記事");
        $('.rectangle').eq(0).text(article.start);
        $('.rectangle').eq(1).text(article.goal);

        $('.startBlock').click(function() {
            startArticleTitle = article.start;
            $('.modeBar').hide();
            setTitles(article.start, article.goal);
        });
    } else {
        $('.startBlock').off('click').click(function() {
            alert("本日の日付に対応する記事が見つかりません。");
        });
    }
}

function getJapanDate() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
    const parts = formatter.formatToParts(now);
    const year = parts.find(part => part.type === "year").value;
    const month = parts.find(part => part.type === "month").value;
    const day = parts.find(part => part.type === "day").value;
    return `${year}-${month}-${day}`;
}