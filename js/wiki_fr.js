$(document).ready(function() {
    $('.startBlock').click(function() { // .startBlockのクリック時に発火
        $('.progressBar').show();
        fetchRandomWikipediaTitles();
        $('.startBlock').hide();
        $('.aboutLink').hide(); // 「このサイトについて」リンクを非表示にする
        setTimeout(function() {
            $('.progressBar').hide();
            showActionButtons();
        }, 500); // 0.5秒後にプログレスバーを非表示にする
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
        history = history.slice(0, index + 1); // 遷移した記事より下の記事タイトルを削除
        updateHistory(); // 履歴を更新
        updateProgress(index); // プログレスバーを更新
        updateTitle(index); // タイトルを更新
    });

    $('.homeLink').click(function() {
        if (confirm('Retour à l\'accueil?')) {
            location.reload(); // ページをリロード
        }
    });

    $('.hintBlock').click(function() {
        $('.goalSummary').toggle(); // 概要欄を表示・非表示にする
    });
});

let clickCount = 0;
let targetArticleTitleB = "";
let history = [];
let startArticleTitle = "";
let continueMode = false; // 続けるモードのフラグを追加

function fetchRandomWikipediaTitles() {
    $.ajax({
        url: 'https://fr.wikipedia.org/w/api.php',
        data: {
            action: 'query',
            generator: 'random',
            grnnamespace: 0,
            grnlimit: 10, // 取得する記事数を増やす
            format: 'json',
            origin: '*' // 追加: クロスオリジンリクエストを許可
        },
        dataType: 'jsonp',
        success: function(data) {
            const pages = data.query.pages;
            const titles = Object.values(pages)
                .map(function(page) {
                    return page.title;
                })
                .filter(function(title) {
                    return title.length <= 20; // 20字以内のタイトルのみ抽出
                })
                .slice(0, 2); // 最初の2つを選択

            if (titles.length < 2) {
                fetchRandomWikipediaTitles(); // 2つ未満の場合、再度取得
            } else {
                $('.rectangle').eq(0).text(titles[0]);
                $('.rectangle').eq(1).text(titles[1]);
                startArticleTitle = titles[0]; // 最初の記事タイトルを保存
            }
        },
        error: function(error) {
            console.error('Error fetching Wikipedia titles:', error);
            alert('Erreur lors de la récupération des titres d\'articles aléatoires.');
        }
    });
}

function showActionButtons() {
    const buttonContainer = $('<div class="buttonContainer" style="display: none;"></div>');
    const retryButton = $('<button class="button retry">Réessayer</button>');
    const confirmButton = $('<button class="button confirm">Confirmer</button>');

    buttonContainer.append(retryButton, confirmButton);
    $('.startBlock').after(buttonContainer);

    retryButton.click(function() {
        $('.progressBar').show();
        fetchRandomWikipediaTitles();
        buttonContainer.hide();
        setTimeout(function() {
            $('.progressBar').hide();
            buttonContainer.show();
        }, 500); // 0.5秒後にプログレスバーを非表示にする
    });

    confirmButton.click(function() {
        const title1 = $('.rectangle').eq(0).text();
        const title2 = $('.rectangle').eq(1).text();
        targetArticleTitleB = title2; // 目標記事タイトルをグローバル変数に保存
        fetchWikipediaArticle(title1);
        displayGoal(title2); // 目標記事のタイトルと概要を表示
        $('img.logo').hide(); // イラストを非表示にする
        $('.rectangleContainer').remove();
        buttonContainer.remove();
        $('.wikiBlock').addClass('loaded'); // 背景色と外枠色を変更
        $('.menuIcon').show(); // ハンバーガーメニューを表示
        $('.title').text('0 / 6HOPS'); // タイトルを当初のものに戻す
        $('.titleUnderline').hide(); // タイトルの下の線を非表示にする

        // シェアボタンのクリックイベントを追加
        $('.shareLink').attr('href', `https://twitter.com/intent/tweet?text=${encodeURIComponent('Challenging 6HOPS from "' + title1 + '" to "' + title2 + '"! \n#TRY_6HOPS\nhttps://myeik.net/6HOPS/fr')}`);
    });

    buttonContainer.show();
}

function fetchWikipediaArticle(title) {
    $('.wikiBlock').html('<div class="loadingBar"></div>'); // Show loading bar in title area
    $('.title').append('<div class="loadingBar"></div>'); // Show loading bar in title area
    $.ajax({
        url: 'https://fr.wikipedia.org/w/api.php',
        data: {
            action: 'parse',
            page: title,
            format: 'json',
            prop: 'text',
            origin: '*' // 追加: クロスオリジンリクエストを許可
        },
        dataType: 'json',
        success: function(data) {
            const content = data.parse.text['*'];
            const $content = $('<div>').html(content);

            // 不要な部分を削除
            $content.find('.reflist, .navbox, .infobox, .metadata, .external, .mw-references-wrap').remove();

            $('.wikiBlock').html('<h2>' + title + '</h2>' + $content.html());
            setupLinkClickHandlers();
            if (!history.includes(title)) {
                history.push(title); // 履歴に追加
            }
            updateHistory(); // 履歴を更新
            if (title === targetArticleTitleB) {
                displayResult('Succès');
                return;
            }
            if (continueMode && clickCount >= 5) {
                addContinuedArticle(title, clickCount === 5 ? 6 : clickCount + 1); // 続けるモードの場合、記事タイトルを追加
            }
            $('.loadingBar').remove(); // Remove loading bar
        },
        error: function(error) {
            console.error('Error fetching Wikipedia article:', error);
            alert('Erreur lors de la récupération de l\'article.');
            $('.loadingBar').remove(); // Remove loading bar
        }
    });
}

function addContinuedArticle(title, count) {
    const continuedArticle = $('<div class="continuedArticle">' + (count === 6 ? '+0 ' : '+' + (count - 6)) + ' ' + title + '</div>');
    $('.goalTitle').before(continuedArticle);
}

function displayGoal(title) {
    $('.goalTitle').text('6. ' + title);
    fetchGoalSummary(title);
}

function fetchGoalSummary(title) {
    $.ajax({
        url: 'https://fr.wikipedia.org/w/api.php',
        data: {
            action: 'query',
            prop: 'extracts',
            exintro: true,
            explaintext: true,
            titles: title,
            format: 'json',
            origin: '*' // 追加: クロスオリジンリクエストを許可
        },
        dataType: 'jsonp',
        success: function(data) {
            const page = Object.values(data.query.pages)[0];
            const summary = page.extract;
            $('.goalSummary').text(summary.length > 200 ? summary.substring(0, 200) + '…' : summary);
        },
        error: function(error) {
            console.error('Error fetching Wikipedia summary:', error);
            alert('Erreur lors de la récupération du résumé de l\'article cible.');
        }
    });
}

function loadArticle(linkTitle) {
    clickCount++;
    updateProgress(clickCount); // プログレスバーを更新
    updateTitle(clickCount); // タイトルを更新
    window.scrollTo(0, 0); // 画面を最上部にスクロール
    if (clickCount > 5 && linkTitle !== targetArticleTitleB && !continueMode) {
        displayResult('Échec');
        return;
    }
    fetchWikipediaArticle(linkTitle);
}

function setupLinkClickHandlers() {
    $('.wikiBlock').off('click', 'a');
    $('.wikiBlock').on('click', 'a', function(event) {
        event.preventDefault();
        const linkTitle = $(this).attr('title');
        if (linkTitle) {
            // Check if the link is to a non-existent or non-French article
            if ($(this).hasClass('new') || !$(this).attr('href').includes('/wiki/')) {
                $(this).css('color', 'inherit'); // Change link color to match normal text
                $(this).css('text-decoration', 'none'); // Remove underline
                return; // Do not navigate
            }
            $('.wikiBlock').html('<div class="loadingBar"></div>'); // Show loading bar in title area
            $('.title').append('<div class="loadingBar"></div>'); // Show loading bar in title area
            setTimeout(function() {
                loadArticle(linkTitle);
            }, 500); // Delay to show loading bar
        } else {
            console.log('Lien externe:', $(this).attr('href'));
        }
    });
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
            historyItem.addClass('active'); // 現在表示されている記事にactiveクラスを追加
        }
        if (i > clickCount) {
            historyItem.addClass('disabled'); // 踏んだリンク数以上の項番にdisabledクラスを追加
        }
        historyContainer.append(historyItem);
    }
}

function loadArticleFromHistory(title, index) {
    clickCount = index;
    updateProgress(clickCount); // プログレスバーを更新
    updateTitle(clickCount); // タイトルを更新
    fetchWikipediaArticle(title);
}

function updateTitle(clickCount) {
    $('.title').text(clickCount + ' / 6HOPS');
}

function displayResult(result) {
    const resultText = result === 'Succès' ? 'Succès' : 'Échec';
    const resultMessage = result === 'Succès' ? 'Félicitations! Vous avez atteint l\'article cible!' : 'Malheureusement, vous n\'avez pas atteint l\'article cible en 6 clics...';
    const shareMessage = result === 'Succès' 
        ? `<br><br><a href="https://twitter.com/intent/tweet?text=${encodeURIComponent('Reached from ' + startArticleTitle + ' to ' + targetArticleTitleB + ' in ' + clickCount + ' hops! \n#CLEAR_6HOPS\n')}" target="_blank" class="twitter-share-button" data-show-count="false">Tweet</a><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>` 
        : `<br><br><a href="https://twitter.com/intent/tweet?text=${encodeURIComponent('Could not reach from ' + startArticleTitle + ' to ' + targetArticleTitleB + ' in 6 hops... \n#CLEAR_6HOPS\n')}" target="_blank" class="twitter-share-button" data-show-count="false">Tweet</a><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>`;
    
    let continueButton = '';
    if (result === 'Échec') {
        continueButton = `<div class="continueButton">Continuer quand même</div>`;
    }

    $('.wikiBlock').html('<h2>' + resultText + '</h2><p>' + resultMessage + '</p>' + shareMessage + continueButton);

    if (result === 'Échec') {
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
