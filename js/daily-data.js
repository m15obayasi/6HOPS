(function(global) {
    'use strict';

    // Keep this list language-aligned. A future scheduled job only needs to
    // replace this file; the date-selection logic can stay untouched.
    const topics = [
        { ja: '地球', en: 'Earth', de: 'Erde', fr: 'Terre', zh: '地球' },
        { ja: '月', en: 'Moon', de: 'Mond', fr: 'Lune', zh: '月球' },
        { ja: '日本', en: 'Japan', de: 'Japan', fr: 'Japon', zh: '日本' },
        { ja: 'ドイツ', en: 'Germany', de: 'Deutschland', fr: 'Allemagne', zh: '德国' },
        { ja: 'フランス', en: 'France', de: 'Frankreich', fr: 'France', zh: '法国' },
        { ja: '中華人民共和国', en: 'China', de: 'Volksrepublik China', fr: 'Chine', zh: '中华人民共和国' },
        { ja: '数学', en: 'Mathematics', de: 'Mathematik', fr: 'Mathématiques', zh: '数学' },
        { ja: '物理学', en: 'Physics', de: 'Physik', fr: 'Physique', zh: '物理学' },
        { ja: '化学', en: 'Chemistry', de: 'Chemie', fr: 'Chimie', zh: '化学' },
        { ja: '生物学', en: 'Biology', de: 'Biologie', fr: 'Biologie', zh: '生物学' },
        { ja: '歴史', en: 'History', de: 'Geschichte', fr: 'Histoire', zh: '历史' },
        { ja: '音楽', en: 'Music', de: 'Musik', fr: 'Musique', zh: '音乐' },
        { ja: '芸術', en: 'Art', de: 'Kunst', fr: 'Art', zh: '艺术' },
        { ja: '文学', en: 'Literature', de: 'Literatur', fr: 'Littérature', zh: '文学' },
        { ja: 'コンピュータ', en: 'Computer', de: 'Computer', fr: 'Ordinateur', zh: '计算机' },
        { ja: 'インターネット', en: 'Internet', de: 'Internet', fr: 'Internet', zh: '互联网' },
        { ja: 'オリンピック競技', en: 'Olympic Games', de: 'Olympische Spiele', fr: 'Jeux olympiques', zh: '奥林匹克运动会' },
        { ja: 'サッカー', en: 'Association football', de: 'Fußball', fr: 'Football', zh: '足球' },
        { ja: '東京都', en: 'Tokyo', de: 'Tokio', fr: 'Tokyo', zh: '东京都' },
        { ja: 'ベルリン', en: 'Berlin', de: 'Berlin', fr: 'Berlin', zh: '柏林' },
        { ja: 'パリ', en: 'Paris', de: 'Paris', fr: 'Paris', zh: '巴黎' },
        { ja: '北京市', en: 'Beijing', de: 'Peking', fr: 'Pékin', zh: '北京市' },
        { ja: 'リンゴ', en: 'Apple', de: 'Kulturapfel', fr: 'Pomme', zh: '苹果' },
        { ja: 'ネコ', en: 'Cat', de: 'Hauskatze', fr: 'Chat', zh: '猫' },
        { ja: 'イヌ', en: 'Dog', de: 'Haushund', fr: 'Chien', zh: '狗' },
        { ja: 'コーヒー', en: 'Coffee', de: 'Kaffee', fr: 'Café', zh: '咖啡' },
        { ja: '海洋', en: 'Ocean', de: 'Ozean', fr: 'Océan', zh: '海洋' },
        { ja: '山', en: 'Mountain', de: 'Berg', fr: 'Montagne', zh: '山' },
        { ja: '宇宙', en: 'Outer space', de: 'Weltraum', fr: 'Univers', zh: '宇宙' },
        { ja: '科学', en: 'Science', de: 'Wissenschaft', fr: 'Science', zh: '科学' }
    ];

    const timeZone = 'Asia/Tokyo';

    function getDateKey(date) {
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).formatToParts(date || new Date());
        const values = {};
        parts.forEach(function(part) {
            values[part.type] = part.value;
        });
        return `${values.year}-${values.month}-${values.day}`;
    }

    function hashDate(value, salt) {
        let hash = 2166136261;
        const input = value + ':' + salt;
        for (let i = 0; i < input.length; i++) {
            hash ^= input.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0;
    }

    function getChallenge(dateKey, locale) {
        const language = topics[0][locale] ? locale : 'ja';
        const startIndex = hashDate(dateKey, 'start') % topics.length;
        const offset = 1 + (hashDate(dateKey, 'goal') % (topics.length - 1));
        const goalIndex = (startIndex + offset) % topics.length;
        return {
            date: dateKey,
            start: topics[startIndex][language],
            goal: topics[goalIndex][language],
            startIndex: startIndex,
            goalIndex: goalIndex
        };
    }

    global.SIX_HOPS_DAILY = {
        timeZone: timeZone,
        topics: topics,
        getDateKey: getDateKey,
        getChallenge: getChallenge
    };
})(window);
