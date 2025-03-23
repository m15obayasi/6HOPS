$(document).ready(function() {
    $('.startBlock').click(function() { // .startBlock点击时触发
        $('.progressBar').show();
        fetchRandomWikipediaTitles();
        $('.startBlock').hide();
        $('.aboutLink').hide(); // 隐藏“关于本站”链接
        setTimeout(function() {
            $('.progressBar').hide();
            showActionButtons();
        }, 500); // 0.5秒后隐藏进度条
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
        history = history.slice(0, index + 1); // 删除跳转后的文章标题
        updateHistory(); // 更新历史记录
        updateProgress(index); // 更新进度条
        updateTitle(index); // 更新标题
    });

    $('.homeLink').click(function() {
        if (confirm('返回首页吗？')) {
            location.reload(); // 重新加载页面
        }
    });

    $('.hintBlock').click(function() {
        $('.goalSummary').toggle(); // 显示或隐藏摘要
    });
});

let clickCount = 0;
let targetArticleTitleB = "";
let history = [];
let startArticleTitle = "";
let continueMode = false; // 添加继续模式标志

function fetchRandomWikipediaTitles() {
    $.ajax({
        url: 'https://zh.wikipedia.org/w/api.php',
        data: {
            action: 'query',
            generator: 'random',
            grnnamespace: 0,
            grnlimit: 10, // 增加获取的文章数量
            format: 'json',
            origin: '*' // 允许跨域请求
        },
        dataType: 'jsonp',
        success: function(data) {
            const pages = data.query.pages;
            const titles = Object.values(pages)
                .map(function(page) {
                    return page.title;
                })
                .filter(function(title) {
                    return title.length <= 20; // 仅提取20字以内的标题
                })
                .slice(0, 2); // 选择前两个

            if (titles.length < 2) {
                fetchRandomWikipediaTitles(); // 如果少于两个，重新获取
            } else {
                $('.rectangle').eq(0).text(titles[0]);
                $('.rectangle').eq(1).text(titles[1]);
                startArticleTitle = titles[0]; // 保存第一个文章标题
            }
        },
        error: function(error) {
            console.error('获取维基百科标题时出错:', error);
            alert('获取随机文章标题失败。');
        }
    });
}

function showActionButtons() {
    const buttonContainer = $('<div class="buttonContainer" style="display: none;"></div>');
    const retryButton = $('<button class="button retry">再试一次</button>');
    const confirmButton = $('<button class="button confirm">确认</button>');

    buttonContainer.append(retryButton, confirmButton);
    $('.startBlock').after(buttonContainer);

    retryButton.click(function() {
        $('.progressBar').show();
        fetchRandomWikipediaTitles();
        buttonContainer.hide();
        setTimeout(function() {
            $('.progressBar').hide();
            buttonContainer.show();
        }, 500); // 0.5秒后隐藏进度条
    });

    confirmButton.click(function() {
        const title1 = $('.rectangle').eq(0).text();
        const title2 = $('.rectangle').eq(1).text();
        targetArticleTitleB = title2; // 保存目标文章标题到全局变量
        fetchWikipediaArticle(title1);
        displayGoal(title2); // 显示目标文章标题和摘要
        $('img.logo').hide(); // 隐藏插图
        $('.rectangleContainer').remove();
        buttonContainer.remove();
        $('.wikiBlock').addClass('loaded'); // 更改背景色和边框颜色
        $('.menuIcon').show(); // 显示汉堡菜单
        $('.title').text('0 / 6HOPS'); // 重置标题
        $('.titleUnderline').hide(); // 隐藏标题下的下划线

        // 添加分享按钮的点击事件
        $('.shareLink').attr('href', `https://twitter.com/intent/tweet?text=${encodeURIComponent('挑战6HOPS，从"' + title1 + '"到"' + title2 + '"！ \n#TRY_6HOPS\nhttps://myeik.net/6HOPS/zh')}`);
    });

    buttonContainer.show();
}

function fetchWikipediaArticle(title) {
    $('.wikiBlock').html('<div class="loadingBar"></div>'); // 在标题区域显示加载条
    $('.title').append('<div class="loadingBar"></div>'); // 在标题区域显示加载条
    $.ajax({
        url: 'https://zh.wikipedia.org/w/api.php',
        data: {
            action: 'parse',
            page: title,
            format: 'json',
            prop: 'text',
            origin: '*' // 允许跨域请求
        },
        dataType: 'json',
        success: function(data) {
            const content = data.parse.text['*'];
            const $content = $('<div>').html(content);

            // 删除不需要的部分
            $content.find('.reflist, .navbox, .infobox, .metadata, .external, .mw-references-wrap').remove();

            $('.wikiBlock').html('<h2>' + title + '</h2>' + $content.html());
            setupLinkClickHandlers();
            if (!history.includes(title)) {
                history.push(title); // 添加到历史记录
            }
            updateHistory(); // 更新历史记录
            if (title === targetArticleTitleB) {
                displayResult('成功');
                return;
            }
            if (continueMode && clickCount >= 5) {
                addContinuedArticle(title, clickCount === 5 ? 6 : clickCount + 1); // 在继续模式下，添加文章标题
            }
            $('.loadingBar').remove(); // 移除加载条
        },
        error: function(error) {
            console.error('获取维基百科文章时出错:', error);
            alert('获取文章失败。');
            $('.loadingBar').remove(); // 移除加载条
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
        url: 'https://zh.wikipedia.org/w/api.php',
        data: {
            action: 'query',
            prop: 'extracts',
            exintro: true,
            explaintext: true,
            titles: title,
            format: 'json',
            origin: '*' // 允许跨域请求
        },
        dataType: 'jsonp',
        success: function(data) {
            const page = Object.values(data.query.pages)[0];
            const summary = page.extract;
            $('.goalSummary').text(summary.length > 200 ? summary.substring(0, 200) + '…' : summary);
        },
        error: function(error) {
            console.error('获取维基百科摘要时出错:', error);
            alert('获取目标文章摘要失败。');
        }
    });
}

function loadArticle(linkTitle) {
    clickCount++;
    updateProgress(clickCount); // 更新进度条
    updateTitle(clickCount); // 更新标题
    window.scrollTo(0, 0); // 滚动到页面顶部
    if (clickCount > 5 && linkTitle !== targetArticleTitleB && !continueMode) {
        displayResult('失败');
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
            // 检查链接是否指向不存在或非中文的文章
            if ($(this).hasClass('new') || !$(this).attr('href').includes('/wiki/')) {
                $(this).css('color', 'inherit'); // 将链接颜色更改为正常文本颜色
                $(this).css('text-decoration', 'none'); // 移除下划线
                return; // 不导航
            }
            $('.wikiBlock').html('<div class="loadingBar"></div>'); // 在标题区域显示加载条
            $('.title').append('<div class="loadingBar"></div>'); // 在标题区域显示加载条
            setTimeout(function() {
                loadArticle(linkTitle);
            }, 500); // 延迟显示加载条
        } else {
            console.log('外部链接:', $(this).attr('href'));
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
            historyItem.addClass('active'); // 为当前显示的文章添加active类
        }
        if (i > clickCount) {
            historyItem.addClass('disabled'); // 为超过点击次数的项添加disabled类
        }
        historyContainer.append(historyItem);
    }
}

function loadArticleFromHistory(title, index) {
    clickCount = index;
    updateProgress(clickCount); // 更新进度条
    updateTitle(clickCount); // 更新标题
    fetchWikipediaArticle(title);
}

function updateTitle(clickCount) {
    $('.title').text(clickCount + ' / 6HOPS');
}

function displayResult(result) {
    const resultText = result === '成功' ? '成功' : '失败';
    const resultMessage = result === '成功' ? '恭喜！你达到了目标文章！' : '遗憾！你未能在6次点击内达到目标文章……';
    const shareMessage = result === '成功' 
        ? `<br><br><a href="https://twitter.com/intent/tweet?text=${encodeURIComponent('从' + startArticleTitle + '到' + targetArticleTitleB + '，我在' + clickCount + '次点击内达到了！ \n#CLEAR_6HOPS\n')}" target="_blank" class="twitter-share-button" data-show-count="false">Tweet</a><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>` 
        : `<br><br><a href="https://twitter.com/intent/tweet?text=${encodeURIComponent('未能在6次点击内从' + startArticleTitle + '到达' + targetArticleTitleB + '…… \n#CLEAR_6HOPS\n')}" target="_blank" class="twitter-share-button" data-show-count="false">Tweet</a><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>`;
    
    let continueButton = '';
    if (result === '失败') {
        continueButton = `<div class="continueButton">继续</div>`;
    }

    $('.wikiBlock').html('<h2>' + resultText + '</h2><p>' + resultMessage + '</p>' + shareMessage + continueButton);

    if (result === '失败') {
        $('.continueButton').click(function() {
            $('.goalTitle').text('X. ' + targetArticleTitleB);
            const lastTitle = history[clickCount - 1];
            clickCount = 5; // 将计数重置为5
            continueMode = true; // 启用继续模式
            updateTitle(clickCount); // 更新标题
            updateProgress(clickCount); // 更新进度条
            loadArticleFromHistory(lastTitle, clickCount); // 加载上一个文章
        });
    }
}
