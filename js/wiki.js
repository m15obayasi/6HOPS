// --- スマホ用省略版トラッカー ---
function updateMobileTracker(current) {
    var n = (typeof current === 'number') ? current : clickCount;
    if (window.matchMedia('(max-width: 1023px)').matches && gameStarted) {
        $('.mobileTracker').show();
        $('.mobileTrackerStep').text(`${n} / 6 HOPS`);
    } else {
        $('.mobileTracker').hide();
    }
}
const LOCALE_CONFIG = {
    ja: {
        wikiApi: 'https://ja.wikipedia.org/w/api.php',
        wikiDomain: 'ja.wikipedia.org',
        shareUrl: 'https://myeik.net/6HOPS/',
        shareText: (start, goal, mode) => `「${start}」から「${goal}」への6HOPSに挑戦中！\n#${mode}_6HOPS\nhttps://myeik.net/6HOPS/`,
        homeConfirm: 'ホームに戻りますか？',
        hint: { show: 'ヒント', hide: 'ヒントを隠す' },
        trackerAria: 'HOP履歴',
        goalSummaryLoading: '概要を取得中…',
        alertArticleFailed: '記事の取得に失敗しました。',
        alertGoalSummaryFailed: '目標記事の概要の取得に失敗しました。',
        alertRouletteFailed: 'ルーレット用の記事タイトルの取得に失敗しました。',
        buttons: { retry: 'もう1回', stop: '止める', confirm: '確定', share: 'でシェアする' },
        landing: { topicSuffix: 'のお題', dailyStart: 'START', randomStart: 'ランダムを始める', randomLink: 'ランダムで遊ぶ' },
        mode: { daily: 'DAILY', random: 'ランダム' },
        result: {
            successLabel: '成功',
            failureLabel: '失敗',
            successMessage: 'おめでとう！目標の記事へ辿り着いた！',
            failureMessage: '残念！6回以内に目標の記事へ辿り着けなかった……',
            successTweet: (start, goal, hops) => `「${start}」から「${goal}」へ${hops}手で辿り着いた！\n#TRY_6HOPS\n`,
            failureTweet: (start, goal) => `「${start}」から「${goal}」へ6手で辿り着けなかった……\n#TRY_6HOPS\n`
        }
    },
    en: {
        wikiApi: 'https://en.wikipedia.org/w/api.php',
        wikiDomain: 'en.wikipedia.org',
        shareUrl: 'https://myeik.net/6HOPS/en',
        shareText: (start, goal, mode) => `Challenging 6HOPS from "${start}" to "${goal}"!\n#${mode}_6HOPS\nhttps://myeik.net/6HOPS/en`,
        homeConfirm: 'Return to home?',
        hint: { show: 'Hint', hide: 'Hide hint' },
        trackerAria: 'HOP history',
        goalSummaryLoading: 'Loading summary…',
        alertArticleFailed: 'Failed to fetch article.',
        alertGoalSummaryFailed: 'Failed to fetch target summary.',
        alertRouletteFailed: 'Failed to fetch roulette article titles.',
        buttons: { retry: 'Retry', stop: 'Stop', confirm: 'Confirm', share: 'Share' },
        landing: { topicSuffix: ' — Today\'s challenge', dailyStart: 'START', randomStart: 'START RANDOM', randomLink: 'Play a random game' },
        mode: { daily: 'DAILY', random: 'RANDOM' },
        result: {
            successLabel: 'Success',
            failureLabel: 'Failure',
            successMessage: 'Congratulations! You reached the target article!',
            failureMessage: 'Too bad! You could not reach the target article in 6 hops.',
            successTweet: (start, goal, hops) => `Reached from "${start}" to "${goal}" in ${hops} hops!\n#TRY_6HOPS\n`,
            failureTweet: (start, goal) => `Could not reach from "${start}" to "${goal}" in 6 hops...\n#TRY_6HOPS\n`
        }
    },
    de: {
        wikiApi: 'https://de.wikipedia.org/w/api.php',
        wikiDomain: 'de.wikipedia.org',
        shareUrl: 'https://myeik.net/6HOPS/de',
        shareText: (start, goal, mode) => `6HOPS-Herausforderung von "${start}" zu "${goal}"!\n#${mode}_6HOPS\nhttps://myeik.net/6HOPS/de`,
        homeConfirm: 'Zurück zur Startseite?',
        hint: { show: 'Hinweis', hide: 'Hinweis ausblenden' },
        trackerAria: 'HOP-Verlauf',
        goalSummaryLoading: 'Zusammenfassung wird geladen…',
        alertArticleFailed: 'Fehler beim Abrufen des Artikels.',
        alertGoalSummaryFailed: 'Fehler beim Abrufen der Zielzusammenfassung.',
        alertRouletteFailed: 'Fehler beim Abrufen der Roulette-Artikel.',
        buttons: { retry: 'Noch einmal', stop: 'Stoppen', confirm: 'Bestätigen', share: 'Teilen' },
        landing: { topicSuffix: ' – Tagesaufgabe', dailyStart: 'START', randomStart: 'ZUFALL STARTEN', randomLink: 'Zufällig spielen' },
        mode: { daily: 'DAILY', random: 'ZUFALL' },
        result: {
            successLabel: 'Erfolg',
            failureLabel: 'Fehler',
            successMessage: 'Glückwunsch! Du hast den Zielartikel erreicht!',
            failureMessage: 'Schade! Du hast den Zielartikel nicht in 6 Schritten erreicht.',
            successTweet: (start, goal, hops) => `Von "${start}" zu "${goal}" in ${hops} Schritten erreicht!\n#TRY_6HOPS\n`,
            failureTweet: (start, goal) => `Von "${start}" zu "${goal}" nicht in 6 Schritten erreicht...\n#TRY_6HOPS\n`
        }
    },
    fr: {
        wikiApi: 'https://fr.wikipedia.org/w/api.php',
        wikiDomain: 'fr.wikipedia.org',
        shareUrl: 'https://myeik.net/6HOPS/fr',
        shareText: (start, goal, mode) => `Défi 6HOPS de "${start}" à "${goal}" !\n#${mode}_6HOPS\nhttps://myeik.net/6HOPS/fr`,
        homeConfirm: 'Retour à l\'accueil?',
        hint: { show: 'Indice', hide: 'Masquer l\'indice' },
        trackerAria: 'Historique HOP',
        goalSummaryLoading: 'Chargement du résumé…',
        alertArticleFailed: 'Échec de récupération de l\'article.',
        alertGoalSummaryFailed: 'Échec de récupération du résumé cible.',
        alertRouletteFailed: 'Échec de récupération des titres de roulette.',
        buttons: { retry: 'Réessayer', stop: 'Arrêter', confirm: 'Confirmer', share: 'Partager' },
        landing: { topicSuffix: ' – Défi du jour', dailyStart: 'DÉMARRER', randomStart: 'LANCER AU HASARD', randomLink: 'Jouer au hasard' },
        mode: { daily: 'DAILY', random: 'ALÉATOIRE' },
        result: {
            successLabel: 'Succès',
            failureLabel: 'Échec',
            successMessage: 'Bravo ! Vous avez atteint l\'article cible !',
            failureMessage: 'Dommage ! Vous n\'avez pas atteint l\'article cible en 6 clics.',
            successTweet: (start, goal, hops) => `Atteint de "${start}" à "${goal}" en ${hops} sauts !\n#TRY_6HOPS\n`,
            failureTweet: (start, goal) => `Impossible d\'atteindre "${goal}" depuis "${start}" en 6 sauts...\n#TRY_6HOPS\n`
        }
    },
    zh: {
        wikiApi: 'https://zh.wikipedia.org/w/api.php',
        wikiDomain: 'zh.wikipedia.org',
        shareUrl: 'https://myeik.net/6HOPS/zh',
        shareText: (start, goal, mode) => `挑战6HOPS：从「${start}」到「${goal}」！\n#${mode}_6HOPS\nhttps://myeik.net/6HOPS/zh`,
        homeConfirm: '返回首页吗？',
        hint: { show: '提示', hide: '隐藏提示' },
        trackerAria: 'HOP 历史',
        goalSummaryLoading: '正在加载摘要…',
        alertArticleFailed: '获取文章失败。',
        alertGoalSummaryFailed: '获取目标摘要失败。',
        alertRouletteFailed: '获取轮盘文章标题失败。',
        buttons: { retry: '再试一次', stop: '停止', confirm: '确定', share: '分享' },
        landing: { topicSuffix: ' 今日题目', dailyStart: '开始', randomStart: '开始随机挑战', randomLink: '玩随机模式' },
        mode: { daily: '每日', random: '随机' },
        result: {
            successLabel: '成功',
            failureLabel: '失败',
            successMessage: '恭喜！你到达了目标词条！',
            failureMessage: '很遗憾！你未能在6步内到达目标词条。',
            successTweet: (start, goal, hops) => `从「${start}」到「${goal}」，共${hops}步到达！\n#TRY_6HOPS\n`,
            failureTweet: (start, goal) => `从「${start}」到「${goal}」未能在6步内到达……\n#TRY_6HOPS\n`
        }
    }
};

function resolveLocale() {
    const lang = (document.documentElement.lang || 'ja').toLowerCase();
    if (lang.startsWith('en')) return 'en';
    if (lang.startsWith('de')) return 'de';
    if (lang.startsWith('fr')) return 'fr';
    if (lang.startsWith('zh')) return 'zh';
    return 'ja';
}

function resolveAssetPrefix() {
    const locale = resolveLocale();
    return locale === 'ja' ? './' : '../';
}

const locale = resolveLocale();
const localeConfig = LOCALE_CONFIG[locale] || LOCALE_CONFIG.ja;
const assetPrefix = resolveAssetPrefix();
const DEBUG = false;

$(document).ready(function() {
    setupMenuHandlers(); // メニュー関連のイベントハンドラーを設定
    setupInteractiveControls();
    setupInitialTitleReload();
    setupDesktopTracker();
    syncChallengeIntroFrameHeight();
    setupLandingMode();

    $(window).on('resize', function() {
        syncChallengeIntroFrameHeight();
    });

    $('.startBlock').click(function() {
        if (gameMode === 'daily') {
            startDailyGame();
            return;
        }

        $('.progressBar').show(); // プログレスバーを表示
        rouletteIntroOffset = $('.challengeIntro:visible').outerHeight(true) || 0;
        $('.challengeIntro').hide();
        $('.rectangleContainer').removeClass('prestart');
        $('.startBlock').hide(); // スタートブロックを非表示
        $('.aboutLink').hide(); // Aboutリンクを非表示
        startRouletteSelection(function() {
            $('.progressBar').hide(); // プログレスバーを非表示
            showActionButtons(); // アクションボタンを表示
        });
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
        if (confirm(localeConfig.homeConfirm)) {
            location.reload();
        }
    });

    $('.hintBlock').click(function () {
        const isVisible = $('.goalSummary').toggle().is(':visible');
        $('.hintBlock').text(isVisible ? localeConfig.hint.hide : localeConfig.hint.show);
    });

    const title1 = localStorage.getItem('title1');
    const title2 = localStorage.getItem('title2');
    if (title1 && title2) {
        localStorage.removeItem('title1');
        localStorage.removeItem('title2');
        gameMode = 'random';
        gameStarted = true;
        $('body').removeClass('dailyInitial');
        $('.dailyTopic, .randomModeButton').hide();
        targetArticleTitleB = title2;
        targetArticlePageId = null;
        targetCanonicalTitle = title2;
        fetchWikipediaArticle(title1);
        displayGoal(title2);
        $('img.logo').hide();
        $('.rectangleContainer').remove();
        $('.startBlock').hide();
        $('.aboutLink').hide();
        $('.wikiBlock').addClass('loaded');
        $('.menuIcon').show();
        $('.title').text('0 / 6HOPS');
        renderDesktopTracker();

        $('.shareLink').attr('href', generateShareLink('TRY'));
    }
});

function setupInitialTitleReload() {
    // Make only the visible title itself clickable so the overlaid titleContainer
    // does not block pointer events for elements (like the tracker) beneath it.
    $('.title').css({
        cursor: 'pointer',
        pointerEvents: 'auto'
    });

    // Ensure titleContainer does not intercept clicks so tracker remains tappable
    $('.titleContainer').css({
        pointerEvents: 'none'
    });

    $('.title').on('click', function() {
        if ($('.startBlock:visible').length) {
            location.reload();
        }
    });
}

function syncChallengeIntroFrameHeight() {
    if (!$('body').hasClass('challenge')) {
        return;
    }

    const intro = $('.challengeIntro:visible');
    const targetRect = $('.rectangleContainer.prestart .rectangle').last();

    if (!intro.length || !targetRect.length) {
        return;
    }

    const introElement = intro.get(0);
    let baseMarginBottom = Number(intro.data('baseMarginBottom'));
    if (Number.isNaN(baseMarginBottom)) {
        baseMarginBottom = parseFloat(window.getComputedStyle(introElement).marginBottom) || 0;
        intro.data('baseMarginBottom', baseMarginBottom);
    }

    intro.css('margin-bottom', `${baseMarginBottom}px`);
    intro.css('height', 'auto');
    const naturalOuterHeight = intro.outerHeight(true) || 0;

    const introTop = intro.offset().top;
    const targetBottom = targetRect.offset().top + targetRect.outerHeight();
    const alignedHeight = Math.max(0, Math.round(targetBottom - introTop));
    intro.css('height', `${alignedHeight}px`);

    const alignedOuterHeight = intro.outerHeight(true) || naturalOuterHeight;
    const consumedDelta = alignedOuterHeight - naturalOuterHeight;
    intro.css('margin-bottom', `${baseMarginBottom - consumedDelta}px`);
}

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
    const tweetText = localeConfig.shareText(startArticleTitle, targetArticleTitleB, mode);
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
}

let clickCount = 0;
let targetArticleTitleB = "";
let targetArticlePageId = null;
let targetCanonicalTitle = "";
let history = [];
let startArticleTitle = "";
let continueMode = false;
let isLoadingArticle = false;
let gameStarted = false;
let rouletteTitles = [];
let rouletteTimer = null;
let rouletteIndexA = 0;
let rouletteIndexB = 1;
let rouletteStopStage = 0;
let rouletteFrozenTitleA = '';
let rouletteFrozenTitleB = '';
let rouletteIntroOffset = 0;
let rouletteTitlesCache = null;
let rouletteTitlesRequest = null;
let rouletteTitleCallbacks = [];
let gameMode = 'daily';
let dailyChallenge = null;

function setupLandingMode() {
    if (!window.SIX_HOPS_DAILY) {
        switchToRandomMode();
        return;
    }

    const dateKey = window.SIX_HOPS_DAILY.getDateKey(new Date());
    dailyChallenge = window.SIX_HOPS_DAILY.getChallenge(dateKey, locale);
    $('.dailyTopicSuffix').text(localeConfig.landing.topicSuffix);
    $('.dailyDate').text(formatDailyDate(dateKey)).attr('datetime', dateKey);
    $('.rectangle').eq(0).text(dailyChallenge.start);
    $('.rectangle').eq(1).text(dailyChallenge.goal);
    $('.rectangleContainer').removeClass('prestart');
    $('.start').text(localeConfig.landing.dailyStart);
    $('.randomModeButton')
        .empty()
        .attr('aria-label', localeConfig.landing.randomLink)
        .append($('<span class="randomLongLabel"></span>').text(localeConfig.landing.randomLink))
        .append($('<span class="randomShortLabel" aria-hidden="true"></span>').text(localeConfig.mode.random));
    $('.randomModeButton').on('click', switchToRandomMode);
}

function formatDailyDate(dateKey) {
    const date = new Date(dateKey + 'T12:00:00+09:00');
    const languageTag = { ja: 'ja-JP', en: 'en-US', de: 'de-DE', fr: 'fr-FR', zh: 'zh-CN' }[locale];
    return new Intl.DateTimeFormat(languageTag, {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
}

function startDailyGame() {
    if (!dailyChallenge || gameStarted) return;
    gameMode = 'daily';
    $('body').removeClass('dailyInitial');
    $('.dailyTopic, .randomModeButton').hide();
    $('.startBlock').hide();
    beginChallengeGame(dailyChallenge.start, dailyChallenge.goal);
}

function switchToRandomMode() {
    gameMode = 'random';
    dailyChallenge = null;
    $('body').removeClass('dailyInitial');
    $('.dailyTopic, .randomModeButton').hide();
    $('.challengeIntro').show();
    $('.rectangle').empty();
    $('.rectangleContainer').addClass('prestart');
    $('.start').text(localeConfig.landing.randomStart);
    fetchRouletteTitles();
}

function isDesktopTrackerMode() {
    return window.matchMedia('(min-width: 1024px)').matches;
}

function setupDesktopTracker() {
    if (!$('.desktopTracker').length) {
        $('.fixedScreen').append(`<div class="desktopTracker" aria-label="${localeConfig.trackerAria}"></div>`);
        // created .desktopTracker
    }

    // クリックで吹き出し表示（デスクトップ）またはモバイル用タイトル領域更新
    $('.desktopTracker').off('click.trackerSlot').on('click.trackerSlot', '.trackerSlot', function(e) {
        if (!gameStarted) return;
        const $slot = $(this);
        const index = Number($slot.data('index'));

        const isMobile = window.matchMedia('(max-width: 1023px)').matches;
        // ゴール以外は履歴がなければ何もしない
        if ((index < 6 && (Number.isNaN(index) || index > clickCount || !history[index]))) return;

        if (isMobile) {
            // モバイルではポップアップを使わず下部のタイトル領域に表示する
            const titleText = (index === 6) ? (targetArticleTitleB || '') : (history[index] || '');
            const $bar = $('.mobileTrackerTitle');
            if ($bar.length) {
                $bar.attr('data-index', index);
                $bar.empty();
                const $num = $('<span>').addClass('num').addClass((index === 0 || index === 6) ? 'edge' : 'blue').text(index);
                const $titleSpan = $('<span>').addClass('titleText').text(titleText || '');
                $bar.append($num).append($titleSpan);
                if (index === 6) {
                    const summary = ($('.goalSummary').text() || '').trim();
                    if (summary) {
                        const $goal = $('<div>').addClass('mobileGoalSummary').text(summary);
                        $bar.append($goal);
                    }
                }
                $bar.toggleClass('clickable', !!titleText && index < 6);
                if (titleText) {
                    $bar.show();
                    try {
                        const headerH = $('.fixedScreen').outerHeight() || 0;
                        // make it float over the current viewport under the header
                        $bar.addClass('floating');
                        $bar.css({ position: 'fixed', top: (headerH + 8) + 'px', left: '50%', transform: 'translateX(-50%)' });
                    } catch (e) {}
                } else {
                    $bar.removeClass('floating').css({ position: 'relative', top: '', left: '', transform: '', marginBottom: '' }).hide();
                }
            }
            e.stopPropagation();
            return;
        }

        // デスクトップ: 吹き出し表示トグル
        if ($slot.hasClass('show-title-popup')) {
            $slot.removeClass('show-title-popup');
        } else {
            $('.desktopTracker .trackerSlot').removeClass('show-title-popup');
            $slot.addClass('show-title-popup');
        }

        // 吹き出し以外のクリックで閉じる
        e.stopPropagation();
    });
    // 追加: タッチデバイス向けに pointerdown も受け取り、モバイルならタイトル領域更新、デスクトップならトグル
    $('.desktopTracker').off('pointerdown.trackerSlot').on('pointerdown.trackerSlot', '.trackerSlot', function(e) {
        if (!gameStarted) return;
        const $slot = $(this);
        const index = Number($slot.data('index'));
        const isMobile = window.matchMedia('(max-width: 1023px)').matches;
        if ((index < 6 && (Number.isNaN(index) || index > clickCount || !history[index]))) return;

        // debug
        // pointerdown on tracker slot
        // debugBadge removed

        if (isMobile) {
            const titleText = (index === 6) ? (targetArticleTitleB || '') : (history[index] || '');
            const $bar = $('.mobileTrackerTitle');
            if ($bar.length) {
                $bar.attr('data-index', index);
                $bar.empty();
                const $num2 = $('<span>').addClass('num').addClass((index === 0 || index === 6) ? 'edge' : 'blue').text(index);
                const $titleSpan2 = $('<span>').addClass('titleText').text(titleText || '');
                $bar.append($num2).append($titleSpan2);
                if (index === 6) {
                    const summary2 = ($('.goalSummary').text() || '').trim();
                    if (summary2) {
                        const $goal2 = $('<div>').addClass('mobileGoalSummary').text(summary2);
                        $bar.append($goal2);
                    }
                }
                $bar.toggleClass('clickable', !!titleText && index < 6);
                if (titleText) {
                    $bar.show();
                    try {
                        const headerH = $('.fixedScreen').outerHeight() || 0;
                        $bar.addClass('floating');
                        $bar.css({ position: 'fixed', top: (headerH + 8) + 'px', left: '50%', transform: 'translateX(-50%)' });
                    } catch (e) {}
                    // debugBadge removed
                } else {
                    $bar.removeClass('floating').css({ position: 'relative', top: '', left: '', transform: '', marginBottom: '' }).hide();
                }
            }
            e.stopPropagation();
            return;
        }

        // デスクトップは既存の挙動
        if ($slot.hasClass('show-title-popup')) {
            $slot.removeClass('show-title-popup');
        } else {
            $('.desktopTracker .trackerSlot').removeClass('show-title-popup');
            $slot.addClass('show-title-popup');
        }
        e.stopPropagation();
    });

    // touchend: ensure tap -> title-bar behavior on mobile (protect against some browsers' click suppression)
    $('.desktopTracker').off('touchend.trackerSlot').on('touchend.trackerSlot', '.trackerSlot', function(e) {
        if (!gameStarted) return;
        const $slot = $(this);
        const index = Number($slot.data('index'));
        const isMobile = window.matchMedia('(max-width: 1023px)').matches;
        if (!isMobile) return;
        if ((index < 6 && (Number.isNaN(index) || index > clickCount || !history[index]))) return;

        const titleText = (index === 6) ? (targetArticleTitleB || '') : (history[index] || '');
        const $bar = $('.mobileTrackerTitle');
            if ($bar.length) {
            $bar.attr('data-index', index);
            $bar.empty();
            const $num3 = $('<span>').addClass('num').addClass((index === 0 || index === 6) ? 'edge' : 'blue').text(index);
            const $titleSpan3 = $('<span>').addClass('titleText').text(titleText || '');
            $bar.append($num3).append($titleSpan3);
            if (index === 6) {
                const summary3 = ($('.goalSummary').text() || '').trim();
                if (summary3) {
                    const $goal3 = $('<div>').addClass('mobileGoalSummary').text(summary3);
                    $bar.append($goal3);
                }
            }
            $bar.toggleClass('clickable', !!titleText && index < 6);
            if (titleText) {
                $bar.show();
                try {
                    const headerH = $('.fixedScreen').outerHeight() || 0;
                    $bar.addClass('floating');
                    $bar.css({ position: 'fixed', top: (headerH + 8) + 'px', left: '50%', transform: 'translateX(-50%)' });
                } catch (e) {}
                // debugBadge removed
            } else {
                $bar.removeClass('floating').css({ position: 'relative', top: '', left: '', transform: '', marginBottom: '' }).hide();
            }
        }
        // debugBadge removed
        e.preventDefault();
        e.stopPropagation();
    });
    // tracker以外クリックで吹き出しとモバイルタイトルを閉じる
    $(document).off('click.trackerPopup').on('click.trackerPopup', function(e) {
        if (!$(e.target).closest('.desktopTracker').length) {
            $('.desktopTracker .trackerSlot').removeClass('show-title-popup');
            $('.mobileTrackerTitle').hide();
        }
    });

    // 吹き出しをクリックしたら該当記事へ移動（ただし6は遷移させない）
    $('.desktopTracker').off('click.trackerPopupInner').on('click.trackerPopupInner', '.trackerTitlePopup', function(e) {
        e.stopPropagation();
        if (!gameStarted) return;
        const $slot = $(this).closest('.trackerSlot');
        const index = Number($slot.data('index'));
        if (index === 6) {
            // 6はヒント表示のみ。クリックで遷移させない。
            $('.desktopTracker .trackerSlot').removeClass('show-title-popup');
            return;
        }
        const title = history[index];
        if (!title) return;
        loadArticleFromHistory(title, index);
        history = history.slice(0, index + 1);
        updateHistory();
        $('.desktopTracker .trackerSlot').removeClass('show-title-popup');
    });

    // モバイル: トラッカー下部のタイトル領域をクリックしたら履歴に戻る
    $(document).off('click.mobileTitle').on('click.mobileTitle', '.mobileTrackerTitle.clickable', function(e) {
        e.stopPropagation();
        // mobile title clicked
        // debugBadge removed
        if (!gameStarted) return;
        const $bar = $(this);
        const index = Number($bar.attr('data-index'));
        if (Number.isNaN(index)) return;
        if (index === 6) {
            // goal: do not navigate
            return;
        }
        const title = history[index];
        if (!title) return;
        loadArticleFromHistory(title, index);
        history = history.slice(0, index + 1);
        updateHistory();
        $bar.hide();
    });

    // Debounced resize to avoid excessive re-renders
    let __trackerResizeTimeout = null;
    $(window).on('resize', function() {
        if (__trackerResizeTimeout) clearTimeout(__trackerResizeTimeout);
        __trackerResizeTimeout = setTimeout(function() {
            renderDesktopTracker();
            __trackerResizeTimeout = null;
        }, 140);
    });

    renderDesktopTracker();
    // renderDesktopTracker called

    // debugBadge removed
}

// show small on-screen debug badge for quick verification
// debugBadge removed

function renderDesktopTracker() {
    const tracker = $('.desktopTracker');
    // renderDesktopTracker enter
    if (!tracker.length) {
        return;
    }

    if (!gameStarted) {
        tracker.removeClass('active').empty();
        if ($('.titleContainer').length) {
            $('.titleContainer').show();
        } else {
            $('.title').show();
        }
        return;
    }

    const goalSummaryText = ($('.goalSummary').text() || '').trim();
    const slots = [];
    for (let i = 0; i <= 6; i++) {
        let slotTitle = '';
        let goalSummaryPreview = '';
        if (i === 6) {
            slotTitle = targetArticleTitleB || '';
            goalSummaryPreview = goalSummaryText || localeConfig.goalSummaryLoading;
        } else {
            slotTitle = history[i] || '';
        }

        const isEdge = i === 0 || i === 6;
        const isCurrent = i === clickCount;
        const isFilled = i <= clickCount || (i === 6 && !!targetArticleTitleB);
        const canPreview = !!history[i] && i <= clickCount;

        // 吹き出し用タイトル（空でも要素を作ることでタップ反応を安定させる）
        const popupHtml = `<span class='trackerTitlePopup'>${slotTitle || ''}</span>`;
        slots.push(`
            <button class="trackerSlot ${isFilled ? 'filled' : ''} ${canPreview ? 'can-preview' : ''} ${i === 6 ? 'goal-preview' : ''} ${i === 6 && goalSummaryText ? 'has-goal-summary' : ''}" data-index="${i}">
                <span class="trackerCircle ${isEdge ? 'edge' : ''} ${isCurrent ? 'current' : ''}">${i}</span>
                ${popupHtml}
                ${i === 6 ? `<span class=\"trackerGoalSummary\">${goalSummaryPreview}</span>` : ''}
            </button>
        `);
    }

    tracker.html(`
        <div class="trackerNodes">${slots.join('')}</div>
    `).addClass('active');
    // Ensure a single global .mobileTrackerTitle exists and is placed before the article
    try {
        let $mobileTitle = $('.mobileTrackerTitle');
        if (!$mobileTitle.length) {
            $mobileTitle = $('<div class="mobileTrackerTitle" aria-live="polite"></div>');
            $mobileTitle.insertBefore($('.wikiBlock'));
        } else if ($mobileTitle.length > 1) {
            // If duplicates exist, keep the first and remove extras
            $mobileTitle.slice(1).remove();
            $mobileTitle = $('.mobileTrackerTitle').first();
            $mobileTitle.insertBefore($('.wikiBlock'));
        } else {
            // single existing: ensure it's placed correctly
            $mobileTitle.insertBefore($('.wikiBlock'));
        }
    } catch (e) {}
    // renderDesktopTracker updated
    if ($('.titleContainer').length) {
        $('.titleContainer').hide();
    } else {
        $('.title').hide();
    }
    updateTrackerPreviewEligibility();
}

function updateTrackerPreviewEligibility() {
    const slots = $('.desktopTracker .trackerSlot.can-preview');
    slots.each(function() {
        const slot = $(this);
        const title = slot.find('.trackerTitle').get(0);
        if (!title) {
            return;
        }

        const isOverflowing = title.scrollWidth > title.clientWidth + 1;
        slot.toggleClass('overflow-preview', isOverflowing);
    });
}

function setupInteractiveControls() {
    const selectors = '.startBlock, .menuIcon, .closeMenu, .hintBlock, .homeLink, .shareButton, .continueButton, .history div, .continuedArticle';
    $(selectors).attr({ tabindex: 0, role: 'button' });

    $(document).on('keydown', selectors, function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            $(this).trigger('click');
        }
    });
}

function showActionButtons() {
    $('.buttonContainer').remove();

    const buttonContainer = $('<div class="buttonContainer roulette single-stop" style="display: none;"></div>');
    if (rouletteIntroOffset > 0) {
        buttonContainer.css('margin-top', rouletteIntroOffset + 'px');
    }
    const retryButton = $(`<button class="button retry" style="display: none;">${localeConfig.buttons.retry}</button>`);
    const stopButton = $(`<button class="button confirm">${localeConfig.buttons.stop}</button>`);
    const confirmButton = $(`<button class="button confirm" style="display: none;">${localeConfig.buttons.confirm}</button>`);

    buttonContainer.append(retryButton, stopButton, confirmButton);
    $('.startBlock').after(buttonContainer);

    retryButton.click(function() {
        $('.progressBar').show();
        stopButton.removeClass('final-stop');
        confirmButton.removeClass('primary-action');
        stopButton.show();
        retryButton.hide();
        confirmButton.hide();
        buttonContainer.addClass('single-stop');
        buttonContainer.removeClass('decision-phase');
        buttonContainer.hide();
        startRouletteSelection(function() {
            $('.progressBar').hide();
            buttonContainer.show();
        });
    });

    stopButton.click(function() {
        stopRouletteStep(stopButton, retryButton, confirmButton, buttonContainer);
    });

    confirmButton.click(function() {
        const title1 = rouletteFrozenTitleA || $('.rectangle').eq(0).text();
        const title2 = rouletteFrozenTitleB || $('.rectangle').eq(1).text();
        beginChallengeGame(title1, title2);
    });

    buttonContainer.show();
}

function fetchWikipediaArticle(title) {
    if (isLoadingArticle) {
        return;
    }
    isLoadingArticle = true;
    $('.progressBar').show(); // プログレスバーを表示
    $('.wikiBlock').html('<div class="loadingBar"></div>');
    $('.title').append('<div class="loadingBar"></div>');
    $.ajax({
        url: localeConfig.wikiApi,
        data: {
            action: 'parse',
            page: title,
            format: 'json',
            prop: 'text',
            origin: '*'
        },
        dataType: 'json',
        success: function(data) {
            const parsedPageId = data.parse.pageid || null;
            const parsedTitle = data.parse.title || title;
            const content = data.parse.text['*'];
            const $content = $('<div>').html(content);

            // 不要な要素を削除
            $content.find('.reflist, .navbox, .infobox, .metadata, .external, .mw-references-wrap').remove();
            $content.find('span.mw-editsection').remove();
            $content.find('sup.reference').remove(); // 脚注を非表示
            $content.find('img').css('pointer-events', 'none'); // 画像のクリックを無効化

            // 存在しない記事へのリンクを通常の黒字テキストに置き換え
            $content.find('a.new').replaceWith(function() {
                return $('<span>').text($(this).text()).css('color', '#333');
            });

            $content.find('a[href*=".wikipedia.org"]').not(`a[href*="${localeConfig.wikiDomain}"]`).replaceWith(function() {
                return $('<span>').text($(this).text()).css('color', '#333');
            });

            $('.wikiBlock').html('<h2>' + title + '</h2>' + $content.html());
            setupLinkClickHandlers();
            if (!history.includes(title)) {
                history.push(title);
            }
            updateHistory();
            const reachedGoal = (targetArticlePageId && parsedPageId === targetArticlePageId)
                || (!targetArticlePageId && (title === targetArticleTitleB || parsedTitle === targetCanonicalTitle));
            if (reachedGoal) {
                $('.progressBar').hide();
                isLoadingArticle = false;
                displayResult('success');
                return;
            }
            if (clickCount > 5 && !continueMode) {
                $('.progressBar').hide();
                isLoadingArticle = false;
                displayResult('failure');
                return;
            }
            if (continueMode && clickCount >= 5) {
                addContinuedArticle(title, clickCount === 5 ? 6 : clickCount + 1); // 続けるモードの場合、記事タイトルを追加
            }
            $('.loadingBar').remove();
            $('.progressBar').hide(); // プログレスバーを非表示
            isLoadingArticle = false;
        },
        error: function(error) {
            if (DEBUG) console.error('Error fetching Wikipedia article:', error);
            alert(localeConfig.alertArticleFailed);
            $('.loadingBar').remove();
            $('.progressBar').hide(); // プログレスバーを非表示
            isLoadingArticle = false;
        }
    });
}

function displayGoal(title) {
    $('.goalTitle').text('6. ' + title);
    renderDesktopTracker();
    fetchGoalSummary(title);
}

function fetchGoalSummary(title) {
    $.ajax({
        url: localeConfig.wikiApi,
        data: {
            action: 'query',
            prop: 'extracts',
            exintro: true,
            explaintext: true,
            titles: title,
            redirects: true,
            format: 'json',
            origin: '*'
        },
        dataType: 'jsonp',
        success: function(data) {
            const page = Object.values(data.query.pages)[0];
            targetArticlePageId = page.pageid || null;
            targetCanonicalTitle = page.title || title;
            const summary = page.extract || '';
            // モバイルではヒントを短く（約30文字）に制限
            const isMobile = window.matchMedia('(max-width: 1023px)').matches;
            const limit = isMobile ? 150 : 200; // ユーザー要望: モバイルは150字まで許容
            const trimmed = summary.replace(/\s+/g, ' ').trim();
            $('.goalSummary').text(trimmed.length > limit ? trimmed.substring(0, limit) + '…' : trimmed);
            renderDesktopTracker();
        },
        error: function(error) {
            if (DEBUG) console.error('Error fetching Wikipedia summary:', error);
            alert(localeConfig.alertGoalSummaryFailed);
        }
    });
}

function setupLinkClickHandlers() {
    $('.wikiBlock').off('click', 'a');
    $('.wikiBlock').on('click', 'a', function(event) {
        event.preventDefault();
        if (isLoadingArticle) {
            return;
        }
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
    fetchWikipediaArticle(linkTitle);
}

function updateProgress(clickCount) {
    $('.progressBlock').slice(0, clickCount).show();
    $('.progressBlock').slice(clickCount).hide();
    updateMobileTracker(clickCount);
}

function updateHistory() {
    const historyContainer = $('.history');
    historyContainer.empty();
    for (let i = 0; i < 6; i++) {
        const title = history[i] || '';
        const historyItem = $('<div data-index="' + i + '" tabindex="0" role="button">' + title + '</div>');
        if (i === clickCount && !continueMode) {
            historyItem.addClass('active');
        }
        if (i > clickCount) {
            historyItem.addClass('disabled');
        }
        historyContainer.append(historyItem);
    }
    renderDesktopTracker();
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
    const isSuccess = result === 'success';
    const isDaily = gameMode === 'daily';
    const resultText = isSuccess ? localeConfig.result.successLabel : localeConfig.result.failureLabel;
    const resultMessage = isSuccess ? localeConfig.result.successMessage : localeConfig.result.failureMessage;
    let baseMessage = isSuccess
        ? localeConfig.result.successTweet(startArticleTitle, targetArticleTitleB, clickCount)
        : localeConfig.result.failureTweet(startArticleTitle, targetArticleTitleB);
    if (isDaily) {
        baseMessage = baseMessage.replace('#TRY_6HOPS', '#DAILY_6HOPS');
    }

    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(baseMessage)}&url=${encodeURIComponent(localeConfig.shareUrl)}`;

    const shareButton = `
        <div class="shareButton">
            <a href="${tweetUrl}" target="_blank" rel="noopener noreferrer" class="shareLink">
                <img src="${assetPrefix}img/logo-black.png" alt="Share Logo" class="shareLogo">
                ${localeConfig.buttons.share}
            </a>
        </div>
    `;
    const modeSummary = isDaily ? `
        <div class="resultModeSummary">
            <span class="resultModeBadge">${localeConfig.mode.daily}</span>
            <span>${formatDailyDate(dailyChallenge.date)}</span>
            <strong>${clickCount} HOPS</strong>
        </div>
    ` : `
        <div class="resultModeSummary">
            <span class="resultModeBadge random">${localeConfig.mode.random}</span>
            <strong>${clickCount} HOPS</strong>
        </div>
    `;

    $('.wikiBlock').html(`
        <h2>${resultText}</h2>
        ${modeSummary}
        <p>${resultMessage}</p>
        ${shareButton}
    `);

    $('.shareLink').off('click').on('click', function(event) {
        event.preventDefault();
        const url = $(this).attr('href');
        window.open(url, '_blank');
    });
}

function fetchRouletteTitles(callback) {
    if (typeof callback === 'function') {
        rouletteTitleCallbacks.push(callback);
    }

    if (rouletteTitlesCache) {
        flushRouletteTitleCallbacks(rouletteTitlesCache);
        return;
    }

    if (rouletteTitlesRequest) {
        return;
    }

    rouletteTitlesRequest = $.ajax({
        url: localeConfig.wikiApi,
        data: {
            action: 'query',
            generator: 'random',
            grnnamespace: 0,
            grnlimit: 40,
            format: 'json',
            origin: '*'
        },
        dataType: 'jsonp',
        success: function(data) {
            const pages = data.query.pages;
            const titles = Object.values(pages)
                .map(page => page.title)
                .filter(title => title.length <= 20);

            const uniqueTitles = [...new Set(titles)];
            if (uniqueTitles.length < 10) {
                rouletteTitlesRequest = null;
                fetchRouletteTitles();
                return;
            }

            rouletteTitlesRequest = null;
            rouletteTitlesCache = uniqueTitles;
            flushRouletteTitleCallbacks(rouletteTitlesCache);
        },
        error: function() {
            const shouldAlert = rouletteTitleCallbacks.length > 0;
            rouletteTitleCallbacks = [];
            rouletteTitlesRequest = null;
            if (shouldAlert) {
                alert(localeConfig.alertRouletteFailed);
            }
        }
    });
}

function flushRouletteTitleCallbacks(titles) {
    const callbacks = rouletteTitleCallbacks.splice(0);
    callbacks.forEach(function(callback) {
        callback(titles.slice());
    });
}

function startRouletteSelection(onStarted) {
    rouletteStopStage = 0;
    rouletteFrozenTitleA = '';
    rouletteFrozenTitleB = '';
    rouletteIndexA = 0;
    rouletteIndexB = 1;

    if (rouletteTimer) {
        clearInterval(rouletteTimer);
        rouletteTimer = null;
    }

    fetchRouletteTitles(function(titles) {
        rouletteTitles = titles;
        rouletteTitlesCache = null;

        $('.rectangle').eq(0).text(rouletteTitles[0]);
        $('.rectangle').eq(1).text(rouletteTitles[1]);

        rouletteTimer = setInterval(function() {
            if (rouletteStopStage < 1) {
                rouletteIndexA = (rouletteIndexA + 1) % rouletteTitles.length;
                $('.rectangle').eq(0).text(rouletteTitles[rouletteIndexA]);
            }

            if (rouletteStopStage < 2) {
                rouletteIndexB = (rouletteIndexB + 1) % rouletteTitles.length;
                if (rouletteIndexB === rouletteIndexA) {
                    rouletteIndexB = (rouletteIndexB + 1) % rouletteTitles.length;
                }
                $('.rectangle').eq(1).text(rouletteTitles[rouletteIndexB]);
            }
        }, 120);

        if (typeof onStarted === 'function') {
            onStarted();
        }
    });
}

function stopRouletteStep(stopButton, retryButton, confirmButton, buttonContainer) {
    if (!rouletteTitles.length) {
        return;
    }

    if (rouletteStopStage === 0) {
        rouletteFrozenTitleA = $('.rectangle').eq(0).text();
        flashRouletteStop(0);
        rouletteStopStage = 1;
        stopButton.addClass('final-stop');
        buttonContainer.removeClass('single-stop');
        return;
    }

    if (rouletteStopStage === 1) {
        rouletteFrozenTitleB = $('.rectangle').eq(1).text();
        flashRouletteStop(1);
        rouletteStopStage = 2;

        if (rouletteTimer) {
            clearInterval(rouletteTimer);
            rouletteTimer = null;
        }

        stopButton.hide();
        retryButton.show();
        confirmButton.addClass('primary-action');
        confirmButton.show();
        buttonContainer.removeClass('single-stop');
        buttonContainer.addClass('decision-phase');
        return;
    }
}

function flashRouletteStop(rectangleIndex) {
    const target = $('.rectangle').eq(rectangleIndex);
    target.addClass('roulette-stop-flash');
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(45);
    }
    setTimeout(function() {
        target.removeClass('roulette-stop-flash');
    }, 280);
}

function beginChallengeGame(title1, title2) {
    gameStarted = true;
    startArticleTitle = title1;
    targetArticleTitleB = title2;
    targetArticlePageId = null;
    targetCanonicalTitle = title2;
    $('.challengeIntro').remove();
    rouletteIntroOffset = 0;
    fetchWikipediaArticle(title1);
    displayGoal(title2);
    $('img.logo').hide();
    $('.rectangleContainer').remove();
    $('.buttonContainer').remove();
    $('.wikiBlock').addClass('loaded');
    $('.menuIcon').show();
    $('.title').text('0 / 6HOPS');
    renderDesktopTracker();

    $('.shareLink').attr('href', generateShareLink(gameMode === 'daily' ? 'DAILY' : 'TRY'));
}
