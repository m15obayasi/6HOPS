$(document).ready(function() {
    setupMenuHandlers(); // メニュー関連のイベントハンドラーを設定

    $('.startBlock').click(function() {
        $('.progressBar').show(); // プログレスバーを表示
        fetchRandomWikipediaTitles(); // ランダムなWikipedia記事タイトルを取得
        $('.startBlock').hide(); // スタートブロックを非表示
        $('.aboutLink').hide(); // Aboutリンクを非表示
        setTimeout(function() {
            $('.progressBar').hide(); // プログレスバーを非表示
            if (!$('body').hasClass('daily')) { // DAILYモードでない場合
                showActionButtons(); // アクションボタンを表示
            }
        }, 500);
    });

    $('.history').on('click', 'div', function () {
        // 履歴の項目をクリックしたときの処理
        const index = $(this).index(); // クリックされた履歴のインデックスを取得
        const title = history[index]; // クリックされた履歴のタイトルを取得
        loadArticleFromHistory(title, index); // 履歴から記事を読み込む
        history = history.slice(0, index + 1); // クリックされた履歴以降の履歴を削除
        updateHistory(); // 履歴を更新
        updateProgress(index); // プログレスバーを更新
        updateTitle(index); // タイトルを更新
    });

    $('.homeLink').click(function() {
        if (confirm('ホームに戻りますか？')) {
        // ホームに戻る確認ダイアログを表示
            location.reload();
        }
    });

    $('.hintBlock').click(function () {
        // ヒントブロックをトグル表示
        $('.goalSummary').toggle();
    });

    const title1 = localStorage.getItem('title1');
    const title2 = localStorage.getItem('title2');
    if (title1 && title2) {
        localStorage.removeItem('title1');
        localStorage.removeItem('title2');
        targetArticleTitleB = title2;
        fetchWikipediaArticle(title1);
        displayGoal(title2);
        $('img.logo').hide();
        $('.rectangleContainer').remove();
        $('.startBlock').hide();
        $('.aboutLink').hide();
        $('.wikiBlock').addClass('loaded');
        $('.menuIcon').show();
        $('.title').text('0 / 6HOPS');
        $('.titleUnderline').hide();

        $('.shareLink').attr('href', generateShareLink('TRY'));
    }
});

function setupMenuHandlers() {
    $('.menuIcon').click(function() {
        $('.sideMenu').toggle(); // メニューの表示/非表示を切り替え
    });

    $('.closeMenu').click(function() {
        $('.sideMenu').hide();  // メニューを閉じる
    });

    $(document).click(function(event) {
        if (!$(event.target).closest('.sideMenu, .menuIcon').length) {
        // メニュー外をクリックした場合
            $('.sideMenu').hide(); // メニューを閉じる
        }
    });
}

function generateShareLink(mode) {
    const tweetText = `「${startArticleTitle}」から「${targetArticleTitleB}」への6HOPSに挑戦中！\n#${mode}_6HOPS\nhttps://myeik.net/6HOPS/`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
}

let clickCount = 0;
let targetArticleTitleB = "";
let history = [];
let startArticleTitle = "";
let continueMode = false; // 続けるモードのフラグを追加

function fetchRandomWikipediaTitles() {
    $.ajax({
        url: 'https://ja.wikipedia.org/w/api.php',
        data: {
            action: 'query',
            generator: 'random',
            grnnamespace: 0,
            grnlimit: 10,
            format: 'json',
            origin: '*'
        },
        dataType: 'jsonp',
        success: function(data) {
            const pages = data.query.pages;
            const titles = Object.values(pages)
                .map(page => page.title)
                .filter(title => title.length <= 20)
                .slice(0, 2);

            if (titles.length < 2) {
                fetchRandomWikipediaTitles();
            } else {
                $('.rectangle').eq(0).text(titles[0]);
                $('.rectangle').eq(1).text(titles[1]);

                if (!startArticleTitle) {
                    startArticleTitle = titles[0];
                }
            }
        },
        error: function(error) {
            alert('ランダムな記事タイトルの取得に失敗しました。');
        }
    });
}

function showActionButtons() {
    const buttonContainer = $('<div class="buttonContainer" style="display: none;"></div>');
    const retryButton = $('<button class="button retry">もう1回</button>');
    const confirmButton = $('<button class="button confirm">確定</button>');

    buttonContainer.append(retryButton, confirmButton);
    $('.startBlock').after(buttonContainer);

    retryButton.click(function() {
        $('.progressBar').show();
        fetchRandomWikipediaTitles();
        buttonContainer.hide();
        setTimeout(function() {
            $('.progressBar').hide();
            buttonContainer.show();
        }, 500);
    });

    confirmButton.click(function() {
        const title1 = $('.rectangle').eq(0).text();
        const title2 = $('.rectangle').eq(1).text();
        $('.modeBar').hide(); // modeBarを非表示にする
        targetArticleTitleB = title2;
        fetchWikipediaArticle(title1);
        displayGoal(title2);
        $('img.logo').hide();
        $('.rectangleContainer').remove();
        buttonContainer.remove();
        $('.wikiBlock').addClass('loaded');
        $('.menuIcon').show();
        $('.title').text('0 / 6HOPS');
        $('.titleUnderline').hide();

        $('.shareLink').attr('href', generateShareLink('TRY'));
    });

    buttonContainer.show();
}

function fetchWikipediaArticle(title) {
    $('.progressBar').show(); // プログレスバーを表示
    $('.wikiBlock').html('<div class="loadingBar"></div>');
    $('.title').append('<div class="loadingBar"></div>');
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
            const content = data.parse.text['*'];
            const $content = $('<div>').html(content);

            // 不要な要素を削除
            $content.find('.reflist, .navbox, .infobox, .metadata, .external, .mw-references-wrap').remove();
            $content.find('span.mw-editsection, a[title$="（英語版）"]').remove();
            $content.find('sup.reference').remove(); // 脚注を非表示
            $content.find('img').css('pointer-events', 'none'); // 画像のクリックを無効化

            // 存在しない記事へのリンクを通常の黒字テキストに置き換え
            $content.find('a.new').replaceWith(function() {
                return $('<span>').text($(this).text()).css('color', '#333');
            });

            // 日本語以外のWikipedia記事リンク（ja.wikipedia.org以外のURL）を通常の黒字テキストに置き換え
            $content.find('a[href*=".wikipedia.org"]').not('a[href*="ja.wikipedia.org"]').replaceWith(function() {
                return $('<span>').text($(this).text()).css('color', '#333');
            });

            $('.wikiBlock').html('<h2>' + title + '</h2>' + $content.html());
            setupLinkClickHandlers();
            if (!history.includes(title)) {
                history.push(title);
            }
            updateHistory();
            if (title === targetArticleTitleB) {
                displayResult('成功');
                return;
            }
            if (continueMode && clickCount >= 5) {
                addContinuedArticle(title, clickCount === 5 ? 6 : clickCount + 1); // 続けるモードの場合、記事タイトルを追加
            }
            $('.loadingBar').remove();
            $('.progressBar').hide(); // プログレスバーを非表示
        },
        error: function(error) {
            console.error('Error fetching Wikipedia article:', error);
            alert('記事の取得に失敗しました。');
            $('.loadingBar').remove();
            $('.progressBar').hide(); // プログレスバーを非表示
        }
    });
}

function displayGoal(title) {
    $('.goalTitle').text('6. ' + title);
    fetchGoalSummary(title);
}

function fetchGoalSummary(title) {
    $.ajax({
        url: 'https://ja.wikipedia.org/w/api.php',
        data: {
            action: 'query',
            prop: 'extracts',
            exintro: true,
            explaintext: true,
            titles: title,
            format: 'json',
            origin: '*'
        },
        dataType: 'jsonp',
        success: function(data) {
            const page = Object.values(data.query.pages)[0];
            const summary = page.extract;
            $('.goalSummary').text(summary.length > 200 ? summary.substring(0, 200) + '…' : summary);
        },
        error: function(error) {
            console.error('Error fetching Wikipedia summary:', error);
            alert('目標記事の概要の取得に失敗しました。');
        }
    });
}

function setupLinkClickHandlers() {
    $('.wikiBlock').off('click', 'a');
    $('.wikiBlock').on('click', 'a', function(event) {
        event.preventDefault();
        const linkTitle = $(this).attr('title');
        if (linkTitle) {
            $('.wikiBlock').html('<div class="loadingBar"></div>');
            $('.title').append('<div class="loadingBar"></div>');
            setTimeout(function() {
                loadArticle(linkTitle);
            }, 500);
        }
    });
}

function loadArticle(linkTitle) {
    clickCount++;
    updateProgress(clickCount);
    updateTitle(clickCount);
    window.scrollTo(0, 0);
    if (clickCount > 5 && linkTitle !== targetArticleTitleB && !continueMode) {
        displayResult('失敗');
        return;
    }
    fetchWikipediaArticle(linkTitle);

    if ($('body').hasClass('daily')) {
        updateTitle(clickCount);
        updateHistory();
    }
}

function updateProgress(clickCount) {
    $('.progressBlock').slice(0, clickCount).show();
    $('.progressBlock').slice(clickCount).hide();
}

function updateHistory() {
    const historyContainer = $('.history');
    historyContainer.empty();
    for (let i = 0; i < 6; i++) {
        const title = history[i] || '';
        const historyItem = $('<div data-index="' + i + '">' + title + '</div>');
        if (i === clickCount && !continueMode) {
            historyItem.addClass('active');
        }
        if (i > clickCount) {
            historyItem.addClass('disabled');
        }
        historyContainer.append(historyItem);
    }
}

function loadArticleFromHistory(title, index) {
    clickCount = index;
    updateProgress(clickCount);
    updateTitle(clickCount);
    fetchWikipediaArticle(title);
}

function updateTitle(clickCount) {
    $('.title').text(clickCount + ' / 6HOPS');
}

function displayResult(result) {
    const resultText = result === '成功' ? '成功' : '失敗';
    const resultMessage = result === '成功'
        ? 'おめでとう！目標の記事へ辿り着いた！'
        : '残念！6回以内に目標の記事へ辿り着けなかった……';
    const baseMessage = result === '成功'
        ? `「${startArticleTitle}」から「${targetArticleTitleB}」へ${clickCount}手で辿り着いた！\n#TRY_6HOPS\n`
        : `「${startArticleTitle}」から「${targetArticleTitleB}」へ6手で辿り着けなかった……\n#TRY_6HOPS\n`;

    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(baseMessage)}&url=${encodeURIComponent('https://myeik.net/6HOPS/')}`;

    const shareButton = `
        <div class="shareButton">
            <a href="${tweetUrl}" target="_blank" rel="noopener noreferrer" class="shareLink">
                <img src="./img/logo-black.png" alt="Share Logo" class="shareLogo">
                でシェアする
            </a>
        </div>
    `;

    let continueButton = '';
    if (result === '失敗') {
        continueButton = `
            <div class="continueButton">
                それでも続ける
            </div>
        `;
    }

    $('.wikiBlock').html(`
        <h2>${resultText}</h2>
        <p>${resultMessage}</p>
        ${shareButton}
        ${continueButton}
    `);

    if (result === '失敗') {
        $('.continueButton').off('click').on('click', function() {
            $('.goalTitle').text('X. ' + targetArticleTitleB);
            const lastTitle = history[clickCount - 1];
            clickCount = 5;
            continueMode = true;
            updateTitle(clickCount);
            updateProgress(clickCount);
            loadArticleFromHistory(lastTitle, clickCount);
        });
    }

    $('.shareLink').off('click').on('click', function(event) {
        event.preventDefault();
        const url = $(this).attr('href');
        window.open(url, '_blank');
    });
}

function setTitles(start, goal) {
    startArticleTitle = start; // 明示的に設定
    targetArticleTitleB = goal; // 明示的に設定

    fetchWikipediaArticle(start); // Wikipediaの記事を表示
    displayGoal(goal); // 目標記事のタイトルと概要を表示
    $('.rectangleContainer').remove();
    $('.startBlock').hide();
    $('.aboutLink').hide();
    $('.menuIcon').show(); // ハンバーガーメニューを表示
    $('.title').text('0 / 6HOPS'); // タイトルを初期化
    $('.titleUnderline').hide(); // タイトルの下の線を非表示にする

    $('.shareLink').attr('href', generateShareLink('TRY'));
}