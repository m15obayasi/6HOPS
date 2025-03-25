const dailyArticles = [
    { date: "2025-03-23", start: "不思議の国のアリス", goal: "Suica" },
    { date: "2025-03-24", start: "Suica", goal: "チャットモンチー" },
    { date: "2025-03-25", start: "チャットモンチー", goal: "Aマッソ" },
    { date: "2025-03-26", start: "Aマッソ", goal: "赤い公園" },
    { date: "2025-03-27", start: "赤い公園", goal: "斉藤由貴" },
    { date: "2025-03-28", start: "斉藤由貴", goal: "プラスチック" },
    { date: "2025-03-29", start: "プラスチック", goal: "三四郎 (お笑いコンビ)" },
    { date: "2025-03-30", start: "三四郎 (お笑いコンビ)", goal: "ユーゴスラビア" },
    { date: "2025-03-31", start: "ユーゴスラビア", goal: "ゴーレム" },
    { date: "2025-04-01", start: "ゴーレム", goal: "オイルショック" },
    { date: "2025-04-02", start: "オイルショック", goal: "サンデーサイレンス" },
    { date: "2025-04-03", start: "サンデーサイレンス", goal: "ふかわりょう" },
    { date: "2025-04-04", start: "ふかわりょう", goal: "ベネズエラ" },
    { date: "2025-04-05", start: "ベネズエラ", goal: "高橋名人" },
    { date: "2025-04-06", start: "高橋名人", goal: "リニアモーターカー" },
    { date: "2025-04-07", start: "リニアモーターカー", goal: "ヒクソン・グレイシー" },
    { date: "2025-04-08", start: "ヒクソン・グレイシー", goal: "コレサワ" },
    { date: "2025-04-09", start: "コレサワ", goal: "踊る大捜査線" },
    { date: "2025-04-10", start: "踊る大捜査線", goal: "田中角栄" },
    { date: "2025-04-11", start: "田中角栄", goal: "コレサワ" },
    { date: "2025-04-12", start: "コレサワ", goal: "火縄銃" },
    { date: "2025-04-13", start: "火縄銃", goal: "テイルズ オブ レジェンディア" },
    { date: "2025-04-14", start: "テイルズ オブ レジェンディア", goal: "木村多江" },
    { date: "2025-04-15", start: "木村多江", goal: "フリーランス" },
    { date: "2025-04-16", start: "フリーランス", goal: "トリビアの泉 〜素晴らしきムダ知識〜" },
    { date: "2025-04-17", start: "トリビアの泉 〜素晴らしきムダ知識〜", goal: "明智光秀" },
    { date: "2025-04-18", start: "明智光秀", goal: "橋本環奈" },
    { date: "2025-04-19", start: "橋本環奈", goal: "キウイフルーツ" },
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
];

$(document).ready(function() {
    const formattedDate = getJapanDate();
    const article = dailyArticles.find(item => item.date === formattedDate);

    if (article) {
        $('.rectangleLabel.first').text("最初の記事");
        $('.rectangleLabel.second').text("目標の記事");
        $('.rectangle').eq(0).text(article.start);
        $('.rectangle').eq(1).text(article.goal);

        $('.startBlock').click(function() {
            console.log("Start button clicked. Fetching article:", article.start);
            setTitles(article.start, article.goal); // wiki.js の setTitles を呼び出し
        });
    } else {
        console.error("本日の日付に対応する記事が見つかりません。");
        $('.startBlock').off('click').click(function() {
            alert("本日の日付に対応する記事が見つかりません。");
        });
    }
});

function fetchWikipediaArticle(title) {
    console.log("Fetching Wikipedia article:", title);
    $('.wikiBlock').html('<div class="loadingBar"></div>'); // ローディングバーを表示
    $.ajax({
        url: 'https://ja.wikipedia.org/w/api.php',
        data: {
            action: 'parse',
            page: title,
            format: 'json',
            prop: 'text',
            origin: '*'
        },
        dataType: 'json',
        success: function(data) {
            console.log("Article fetched successfully:", data);
            const content = data.parse.text['*'];
            const $content = $('<div>').html(content);

            // 不要な部分を削除
            $content.find('.reflist, .navbox, .infobox, .metadata, .external, .mw-references-wrap').remove();

            $('.wikiBlock').html('<h2>' + title + '</h2>' + $content.html());
            $('.wikiBlock').show(); // wikiBlockを表示
        },
        error: function(error) {
            console.error('Error fetching Wikipedia article:', error);
            alert('記事の取得に失敗しました。');
        }
    });
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