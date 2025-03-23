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

$(document).ready(function () {
    const today = new Date().toISOString().split('T')[0]; // 今日の日付を取得
    const dailyArticle = dailyArticles.find(article => article.date === today);

    if (dailyArticle) {
        $('.rectangle').eq(0).text(dailyArticle.start); // 最初の記事を設定
        $('.rectangle').eq(1).text(dailyArticle.goal);  // 目標の記事を設定
    } else {
        $('.rectangle').eq(0).text('本日の日替わり記事はありません');
        $('.rectangle').eq(1).text('本日の日替わり記事はありません');
        $('.startBlock').hide(); // スタートボタンを非表示
    }

    $('.startBlock').click(function () {
        if (dailyArticle) {
            const title1 = dailyArticle.start;
            const title2 = dailyArticle.goal;
            targetArticleTitleB = title2; // 目標記事タイトルをグローバル変数に保存
            fetchWikipediaArticle(title1); // 最初の記事を取得
            displayGoal(title2); // 目標記事を表示
            $('img.logo').hide(); // ロゴを非表示
            $('.rectangleContainer').remove(); // 記事選択部分を削除
            $('.startBlock').remove(); // スタートボタンを削除
            $('.wikiBlock').addClass('loaded'); // 背景色と外枠色を変更
            $('.menuIcon').show(); // ハンバーガーメニューを表示
            $('.title').text('0 / 6HOPS'); // タイトルを初期化
            $('.titleUnderline').hide(); // タイトル下線を非表示
        }
    });
});

function showProgressBar() {
    const progressBar = $('<div class="progressBar"><div class="progress"></div></div>');
    $('body').append(progressBar);

    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        $('.progress').css('width', `${progress}%`);

        if (progress >= 100) {
            clearInterval(interval);
        }
    }, 300);

    // プログレスバーを非表示にする関数を返す
    return function hideProgressBar() {
        clearInterval(interval);
        progressBar.remove();
    };
}

function fetchWikipediaArticle(title) {
    const hideProgressBar = showProgressBar(); // プログレスバーを表示
    const encodedTitle = encodeURIComponent(title); // タイトルをURLエンコード
    const apiUrl = `https://ja.wikipedia.org/w/api.php?action=parse&page=${encodedTitle}&format=json&prop=text&origin=*`;

    $.ajax({
        url: apiUrl,
        dataType: 'json',
        success: function (data) {
            const content = data.parse.text['*'];
            const $content = $('<div>').html(content);

            $content.find('.reflist, .navbox, .infobox, .metadata, .external, .mw-references-wrap').remove();

            $('.wikiBlock').html('<h2>' + title + '</h2>' + $content.html());
            setupLinkClickHandlers(); // 再度リンククリックイベントを設定
            hideProgressBar(); // 記事が表示されたらプログレスバーを消す
        },
        error: function (error) {
            console.error('Error fetching Wikipedia article:', error);
            alert('記事の取得に失敗しました。詳細: ' + error.statusText);
            hideProgressBar(); // エラー時もプログレスバーを消す
        }
    });
}

function setupLinkClickHandlers() {
    $('.wikiBlock').off('click', 'a'); // 既存のクリックイベントを解除
    $('.wikiBlock').on('click', 'a', function (event) {
        event.preventDefault(); // デフォルトのリンク遷移を防止
        const linkTitle = $(this).attr('title'); // クリックされたリンクのタイトルを取得
        if (linkTitle) {
            loadArticle(linkTitle); // 記事を読み込む
        }
    });
}

function loadArticle(linkTitle) {
    const hideProgressBar = showProgressBar(); // プログレスバーを表示
    const encodedTitle = encodeURIComponent(linkTitle); // タイトルをURLエンコード
    const apiUrl = `https://ja.wikipedia.org/w/api.php?action=parse&page=${encodedTitle}&format=json&prop=text&origin=*`;

    $.ajax({
        url: apiUrl,
        dataType: 'json',
        success: function (data) {
            const content = data.parse.text['*'];
            const $content = $('<div>').html(content);

            $content.find('.reflist, .navbox, .infobox, .metadata, .external, .mw-references-wrap').remove();

            $('.wikiBlock').html('<h2>' + linkTitle + '</h2>' + $content.html());
            setupLinkClickHandlers(); // 再度リンククリックイベントを設定
            hideProgressBar(); // 記事が表示されたらプログレスバーを消す
        },
        error: function (error) {
            console.error('Error fetching Wikipedia article:', error);
            alert('記事の取得に失敗しました。詳細: ' + error.statusText);
            hideProgressBar(); // エラー時もプログレスバーを消す
        }
    });
}


