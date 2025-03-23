$(document).ready(function() {
    $('.startBlock').click(function() { // .startBlockのクリック時に発火
        $('.progressBar').show();
        fetchRandomWikipediaTitles();
        $('.startBlock').hide();
        $('.aboutLink').hide(); // 「このサイトについて」リンクを非表示にする
        setTimeout(function() {
            $('.progressBar').hide();
            showActionButtons();
        }, 500); // Hide progress bar after 0.5 seconds
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
        history = history.slice(0, index + 1); // Remove titles below the navigated article
        updateHistory(); // Update history
        updateProgress(index); // Update progress bar
        updateTitle(index); // Update title
    });

    $('.homeLink').click(function() {
        if (confirm('Return to home?')) {
            location.reload(); // Reload the page
        }
    });

    $('.hintBlock').click(function() {
        $('.goalSummary').toggle(); // Toggle summary display
    });
});

let clickCount = 0;
let targetArticleTitleB = "";
let history = [];
let startArticleTitle = "";
let continueMode = false; // Add continue mode flag

function fetchRandomWikipediaTitles() {
    $.ajax({
        url: 'https://en.wikipedia.org/w/api.php',
        data: {
            action: 'query',
            generator: 'random',
            grnnamespace: 0,
            grnlimit: 10, // Increase the number of articles to fetch
            format: 'json',
            origin: '*' // Add: Allow cross-origin requests
        },
        dataType: 'jsonp',
        success: function(data) {
            const pages = data.query.pages;
            const titles = Object.values(pages)
                .map(function(page) {
                    return page.title;
                })
                .filter(function(title) {
                    return title.length <= 20; // Extract titles within 20 characters
                })
                .slice(0, 2); // Select the first 2

            if (titles.length < 2) {
                fetchRandomWikipediaTitles(); // Fetch again if less than 2
            } else {
                $('.rectangle').eq(0).text(titles[0]);
                $('.rectangle').eq(1).text(titles[1]);
                startArticleTitle = titles[0]; // Save the first article title
            }
        },
        error: function(error) {
            console.error('Error fetching Wikipedia titles:', error);
            alert('Failed to fetch random article titles.');
        }
    });
}

function showActionButtons() {
    const buttonContainer = $('<div class="buttonContainer" style="display: none;"></div>');
    const retryButton = $('<button class="button retry">Retry</button>');
    const confirmButton = $('<button class="button confirm">Confirm</button>');

    buttonContainer.append(retryButton, confirmButton);
    $('.startBlock').after(buttonContainer);

    retryButton.click(function() {
        $('.progressBar').show();
        fetchRandomWikipediaTitles();
        buttonContainer.hide();
        setTimeout(function() {
            $('.progressBar').hide();
            buttonContainer.show();
        }, 500); // Hide progress bar after 0.5 seconds
    });

    confirmButton.click(function() {
        const title1 = $('.rectangle').eq(0).text();
        const title2 = $('.rectangle').eq(1).text();
        targetArticleTitleB = title2; // Save target article title to global variable
        fetchWikipediaArticle(title1);
        displayGoal(title2); // Display target article title and summary
        $('img.logo').hide(); // Hide the illustration
        $('.rectangleContainer').remove();
        buttonContainer.remove();
        $('.wikiBlock').addClass('loaded'); // Change background and border color
        $('.menuIcon').show(); // Show hamburger menu
        $('.title').text('0 / 6HOPS'); // Reset title
        $('.titleUnderline').hide(); // タイトルの下の線を非表示にする

        // Add click event for share button
        $('.shareLink').attr('href', `https://twitter.com/intent/tweet?text=${encodeURIComponent('Challenging 6HOPS from "' + title1 + '" to "' + title2 + '"! \n#TRY_6HOPS\nhttps://myeik.net/6HOPS/en')}`);
    });

    buttonContainer.show();
}

function fetchWikipediaArticle(title) {
    $('.wikiBlock').html('<div class="loadingBar"></div>'); // Show loading bar in title area
    $('.title').append('<div class="loadingBar"></div>'); // Show loading bar in title area
    $.ajax({
        url: 'https://en.wikipedia.org/w/api.php',
        data: {
            action: 'parse',
            page: title,
            format: 'json',
            prop: 'text',
            origin: '*' // Add: Allow cross-origin requests
        },
        dataType: 'json',
        success: function(data) {
            const content = data.parse.text['*'];
            const $content = $('<div>').html(content);

            // Remove unnecessary parts
            $content.find('.reflist, .navbox, .infobox, .metadata, .external, .mw-references-wrap').remove();

            $('.wikiBlock').html('<h2>' + title + '</h2>' + $content.html());
            $('.loadingBar').remove(); // Remove loading bar
            setupLinkClickHandlers();
            if (!history.includes(title)) {
                history.push(title); // Add to history
            }
            updateHistory(); // Update history
            if (title === targetArticleTitleB) {
                displayResult('Success');
                return;
            }
            if (continueMode && clickCount >= 5) {
                addContinuedArticle(title, clickCount === 5 ? 6 : clickCount + 1); // Add article title if in continue mode
            }
        },
        error: function(error) {
            console.error('Error fetching Wikipedia article:', error);
            alert('Failed to fetch article.');
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
        url: 'https://en.wikipedia.org/w/api.php',
        data: {
            action: 'query',
            prop: 'extracts',
            exintro: true,
            explaintext: true,
            titles: title,
            format: 'json',
            origin: '*' // Add: Allow cross-origin requests
        },
        dataType: 'jsonp',
        success: function(data) {
            const page = Object.values(data.query.pages)[0];
            const summary = page.extract;
            $('.goalSummary').text(summary.length > 200 ? summary.substring(0, 200) + '…' : summary);
        },
        error: function(error) {
            console.error('Error fetching Wikipedia summary:', error);
            alert('Failed to fetch target article summary.');
        }
    });
}

function loadArticle(linkTitle) {
    clickCount++;
    updateProgress(clickCount); // Update progress bar
    updateTitle(clickCount); // Update title
    window.scrollTo(0, 0); // Scroll to top
    if (clickCount > 5 && linkTitle !== targetArticleTitleB && !continueMode) {
        displayResult('Failure');
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
            // Check if the link is to a non-existent or non-English article
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
            console.log('External link:', $(this).attr('href'));
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
            historyItem.addClass('active'); // Add active class to current article
        }
        if (i > clickCount) {
            historyItem.addClass('disabled'); // Add disabled class to items beyond click count
        }
        historyContainer.append(historyItem);
    }
}

function loadArticleFromHistory(title, index) {
    clickCount = index;
    updateProgress(clickCount); // Update progress bar
    updateTitle(clickCount); // Update title
    fetchWikipediaArticle(title);
}

function updateTitle(clickCount) {
    $('.title').text(clickCount + ' / 6HOPS');
}

function displayResult(result) {
    const resultText = result === 'Success' ? 'Success' : 'Failure';
    const resultMessage = result === 'Success' ? 'Congratulations! You reached the target article!' : 'Unfortunately, you did not reach the target article within 6 hops...';
    const shareMessage = result === 'Success' 
        ? `<br><br><a href="https://twitter.com/intent/tweet?text=${encodeURIComponent('Reached from ' + startArticleTitle + ' to ' + targetArticleTitleB + ' in ' + clickCount + ' hops! \n#CLEAR_6HOPS\n')}" target="_blank" class="twitter-share-button" data-show-count="false">Tweet</a><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>` 
        : `<br><br><a href="https://twitter.com/intent/tweet?text=${encodeURIComponent('Could not reach from ' + startArticleTitle + ' to ' + targetArticleTitleB + ' in 6 hops... \n#CLEAR_6HOPS\n')}" target="_blank" class="twitter-share-button" data-show-count="false">Tweet</a><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>`;
    
    let continueButton = '';
    if (result === 'Failure') {
        continueButton = `<div class="continueButton">Continue Anyway</div>`;
    }

    $('.wikiBlock').html('<h2>' + resultText + '</h2><p>' + resultMessage + '</p>' + shareMessage + continueButton);

    if (result === 'Failure') {
        $('.continueButton').click(function() {
            $('.goalTitle').text('X. ' + targetArticleTitleB);
            const lastTitle = history[clickCount - 1];
            clickCount = 5; // Reset count to 5
            continueMode = true; // Enable continue mode
            updateTitle(clickCount); // Update title
            updateProgress(clickCount); // Update progress bar
            loadArticleFromHistory(lastTitle, clickCount); // Load the previous article
        });
    }
}
