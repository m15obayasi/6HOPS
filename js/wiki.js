$(document).ready(function() {
    $('.startBlock').click(function() {
        $('.progressBar').show();
        fetchRandomWikipediaTitles();
        $('.startBlock').hide();
        $('.aboutLink').hide();
        setTimeout(function() {
            $('.progressBar').hide();
            // 条件を追加して daily.html ではボタンを表示しない
            if (!$('body').hasClass('daily')) {
                // challenge.html 用の処理
                showActionButtons(); // retryボタンとconfirmボタンを表示
            }
        }, 500);
    });

    $('.menuIcon').click(function() {
        $('.sideMenu').toggle();
    });

    $('.closeMenu').click(function() {
        $('.sideMenu').hide();
    });

    $(document).click(function(event) {
        if (!$(event.target).closest('.sideMenu, .menuIcon').length) {
            $('.sideMenu').hide();
        }
    });

    $('.history').on('click', 'div', function() {
        const index = $(this).index();
        const title = history[index];
        loadArticleFromHistory(title, index);
        history = history.slice(0, index + 1);
        updateHistory();
        updateProgress(index);
        updateTitle(index);
    });

    $('.homeLink').click(function() {
        if (confirm('ホームに戻りますか？')) {
            location.reload();
        }
    });

    $('.hintBlock').click(function() {
        $('.goalSummary').toggle();
    });

    const title1 = localStorage.getItem('title1');
    const title2 = localStorage.getItem('title2');
    if (title1 && title2) {
        localStorage.removeItem('title1');
        localStorage.removeItem('title2');
        targetArticleTitleB = title2; // 目標記事タイトルをグローバル変数に保存
        fetchWikipediaArticle(title1);
        displayGoal(title2); // 目標記事のタイトルと概要を表示
        $('img.logo').hide(); // イラストを非表示にする
        $('.rectangleContainer').remove();
        $('.startBlock').hide();
        $('.aboutLink').hide();
        $('.wikiBlock').addClass('loaded'); // 背景色と外枠色を変更
        $('.menuIcon').show(); // ハンバーガーメニューを表示
        $('.title').text('0 / 6HOPS'); // タイトルを当初のものに戻す
        $('.titleUnderline').hide(); // タイトルの下の線を非表示にする

        // シェアボタンのクリックイベントを追加
        $('.shareLink').attr('href', `https://twitter.com/intent/tweet?text=${encodeURIComponent('「' + startArticleTitle + '」から「' + targetArticleTitleB + '」への6HOPSに挑戦中！ \n#TRY_6HOPS\nhttps://myeik.net/6HOPS/')}`);
    }
});

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
                startArticleTitle = titles[0];
            }
        },
        error: function(error) {
            console.error('Error fetching Wikipedia titles:', error);
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

        $('.shareLink').attr('href', `https://twitter.com/intent/tweet?text=${encodeURIComponent('「' + startArticleTitle + '」から「' + targetArticleTitleB + '」への6HOPSに挑戦中！ \n#TRY_6HOPS\nhttps://myeik.net/6HOPS/')}`);
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

            $content.find('.reflist, .navbox, .infobox, .metadata, .external, .mw-references-wrap').remove();

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

    // daily.htmlでもタイトルと履歴を更新
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
    const resultMessage = result === '成功' ? 'おめでとう！目標の記事へ辿り着いた！' : '残念！6回以内に目標の記事へ辿り着けなかった……';
    const shareMessage = result === '成功' 
        ? `<br><br><a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(startArticleTitle + 'から' + targetArticleTitleB + 'へ' + clickCount + '手で辿り着いた！ \n#CLEAR_6HOPS\n')}" target="_blank" class="twitter-share-button" data-show-count="false">Tweet</a><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>` 
        : `<br><br><a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(startArticleTitle + 'から' + targetArticleTitleB + 'へ6手で辿り着けなかった…… \n#CLEAR_6HOPS\n')}" target="_blank" class="twitter-share-button" data-show-count="false">Tweet</a><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>`;
    
    let continueButton = '';
    if (result === '失敗') {
        continueButton = `<div class="continueButton">それでも続ける</div>`;
    }

    $('.wikiBlock').html('<h2>' + resultText + '</h2><p>' + resultMessage + '</p>' + shareMessage + continueButton);

    if (result === '失敗') {
        $('.continueButton').click(function() {
            $('.goalTitle').text('X. ' + targetArticleTitleB);
            const lastTitle = history[clickCount - 1];
            clickCount = 5; // カウントを5にリセット
            continueMode = true; // 続けるモードを有効にする
            updateTitle(clickCount); // タイトルを更新
            updateProgress(clickCount); // プログレスバーを更新
            loadArticleFromHistory(lastTitle, clickCount); // 直前の記事を読み込む
        });
    }
}

function setTitles(start, goal) {
    const title1 = start;
    const title2 = goal;
    targetArticleTitleB = title2; // 目標記事タイトルをグローバル変数に保存
    fetchWikipediaArticle(title1); // Wikipediaの記事を表示
    displayGoal(title2); // 目標記事のタイトルと概要を表示
    $('.rectangleContainer').remove();
    $('.startBlock').hide();
    $('.aboutLink').hide();
    $('.menuIcon').show(); // ハンバーガーメニューを表示
    $('.title').text('0 / 6HOPS'); // タイトルを初期化
    $('.titleUnderline').hide(); // タイトルの下の線を非表示にする

    // シェアボタンのクリックイベントを追加
    $('.shareLink').attr('href', `https://twitter.com/intent/tweet?text=${encodeURIComponent('「' + startArticleTitle + '」から「' + targetArticleTitleB + '」への6HOPSに挑戦中！ \n#TRY_6HOPS\nhttps://myeik.net/6HOPS/')}`);
}