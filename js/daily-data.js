(function(global) {
    'use strict';

    // Daily challenges are curated as semantically distant pairs. A future
    // scheduled job can replace or extend this list without changing the
    // date-selection logic below.
    function topic(ja, en, de, fr, zh) {
        return { ja: ja, en: en, de: de, fr: fr, zh: zh };
    }

    const challenges = [
        { start: topic('カモノハシ', 'Platypus', 'Schnabeltier', 'Ornithorynque', '鸭嘴兽'), goal: topic('ブラックホール', 'Black hole', 'Schwarzes Loch', 'Trou noir', '黑洞') },
        { start: topic('蜂蜜', 'Honey', 'Honig', 'Miel', '蜂蜜'), goal: topic('ベルリンの壁', 'Berlin Wall', 'Berliner Mauer', 'Mur de Berlin', '柏林墙') },
        { start: topic('寿司', 'Sushi', 'Sushi', 'Sushi', '寿司'), goal: topic('量子力学', 'Quantum mechanics', 'Quantenmechanik', 'Mécanique quantique', '量子力学') },
        { start: topic('傘', 'Umbrella', 'Regenschirm', 'Parapluie', '傘'), goal: topic('恐竜', 'Dinosaur', 'Dinosaurier', 'Dinosaure', '恐龙') },
        { start: topic('鉛筆', 'Pencil', 'Bleistift', 'Crayon', '铅笔'), goal: topic('サハラ砂漠', 'Sahara', 'Sahara', 'Sahara', '撒哈拉沙漠') },
        { start: topic('カラオケ', 'Karaoke', 'Karaoke', 'Karaoké', '卡拉OK'), goal: topic('光合成', 'Photosynthesis', 'Photosynthese', 'Photosynthèse', '光合作用') },
        { start: topic('冷蔵庫', 'Refrigerator', 'Kühlschrank', 'Réfrigérateur', '冰箱'), goal: topic('古代エジプト', 'Ancient Egypt', 'Altes Ägypten', 'Égypte antique', '古埃及') },
        { start: topic('靴下', 'Sock', 'Socke', 'Chaussette', '袜子'), goal: topic('月', 'Moon', 'Mond', 'Lune', '月球') },
        { start: topic('コーヒー', 'Coffee', 'Kaffee', 'Café', '咖啡'), goal: topic('南極大陸', 'Antarctica', 'Antarktika', 'Antarctique', '南极洲') },
        { start: topic('ネコ', 'Cat', 'Hauskatze', 'Chat', '猫'), goal: topic('インターネット', 'Internet', 'Internet', 'Internet', '互联网') },
        { start: topic('バナナ', 'Banana', 'Banane', 'Banane', '香蕉'), goal: topic('エベレスト', 'Mount Everest', 'Mount Everest', 'Everest', '珠穆朗玛峰') },
        { start: topic('ピザ', 'Pizza', 'Pizza', 'Pizza', '披萨'), goal: topic('民主主義', 'Democracy', 'Demokratie', 'Démocratie', '民主') },
        { start: topic('ガラス', 'Glass', 'Glas', 'Verre', '玻璃'), goal: topic('オリンピック競技', 'Olympic Games', 'Olympische Spiele', 'Jeux olympiques', '奥林匹克运动会') },
        { start: topic('自転車', 'Bicycle', 'Fahrrad', 'Bicyclette', '自行车'), goal: topic('銀河系', 'Milky Way', 'Milchstraße', 'Voie lactée', '银河系') },
        { start: topic('チョコレート', 'Chocolate', 'Schokolade', 'Chocolat', '巧克力'), goal: topic('火山', 'Volcano', 'Vulkan', 'Volcan', '火山') },
        { start: topic('パン', 'Bread', 'Brot', 'Pain', '面包'), goal: topic('人工知能', 'Artificial intelligence', 'Künstliche Intelligenz', 'Intelligence artificielle', '人工智能') },
        { start: topic('チェス', 'Chess', 'Schach', 'Échecs', '国际象棋'), goal: topic('太平洋', 'Pacific Ocean', 'Pazifischer Ozean', 'Océan Pacifique', '太平洋') },
        { start: topic('歯ブラシ', 'Toothbrush', 'Zahnbürste', 'Brosse à dents', '牙刷'), goal: topic('フランス革命', 'French Revolution', 'Französische Revolution', 'Révolution française', '法国大革命') },
        { start: topic('ペンギン', 'Penguin', 'Pinguine', 'Manchot', '企鹅'), goal: topic('ローマ帝国', 'Roman Empire', 'Römisches Reich', 'Empire romain', '罗马帝国') },
        { start: topic('時計', 'Clock', 'Uhr', 'Horloge', '时钟'), goal: topic('デオキシリボ核酸', 'DNA', 'Desoxyribonukleinsäure', 'Acide désoxyribonucléique', '脱氧核糖核酸') },
        { start: topic('茶', 'Tea', 'Tee', 'Thé', '茶'), goal: topic('火星', 'Mars', 'Mars (Planet)', 'Mars (planète)', '火星') },
        { start: topic('ニンニク', 'Garlic', 'Knoblauch', 'Ail cultivé', '大蒜'), goal: topic('ヴォルフガング・アマデウス・モーツァルト', 'Wolfgang Amadeus Mozart', 'Wolfgang Amadeus Mozart', 'Wolfgang Amadeus Mozart', '沃尔夫冈·阿马德乌斯·莫扎特') },
        { start: topic('トイレ', 'Toilet', 'Toilette', 'Toilettes', '厕所'), goal: topic('電気', 'Electricity', 'Elektrizität', 'Électricité', '电') },
        { start: topic('折り紙', 'Origami', 'Origami', 'Origami', '折纸'), goal: topic('重力', 'Gravity', 'Gravitation', 'Gravitation', '重力') },
        { start: topic('石鹸', 'Soap', 'Seife', 'Savon', '肥皂'), goal: topic('侍', 'Samurai', 'Samurai', 'Samouraï', '武士') },
        { start: topic('カメラ', 'Camera', 'Kamera', 'Appareil photographique', '照相机'), goal: topic('ビッグバン', 'Big Bang', 'Urknall', 'Big Bang', '大爆炸') },
        { start: topic('雪だるま', 'Snowman', 'Schneemann', 'Bonhomme de neige', '雪人'), goal: topic('資本主義', 'Capitalism', 'Kapitalismus', 'Capitalisme', '资本主义') },
        { start: topic('サボテン', 'Cactus', 'Kakteengewächse', 'Cactus', '仙人掌'), goal: topic('第二次世界大戦', 'World War II', 'Zweiter Weltkrieg', 'Seconde Guerre mondiale', '第二次世界大战') },
        { start: topic('掃除機', 'Vacuum cleaner', 'Staubsauger', 'Aspirateur', '吸塵器'), goal: topic('仏教', 'Buddhism', 'Buddhismus', 'Bouddhisme', '佛教') },
        { start: topic('キノコ', 'Mushroom', 'Pilze', 'Champignon', '蘑菇'), goal: topic('国際宇宙ステーション', 'International Space Station', 'Internationale Raumstation', 'Station spatiale internationale', '国际空间站') }
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
        const language = challenges[0].start[locale] ? locale : 'ja';
        const pairIndex = hashDate(dateKey, 'pair') % challenges.length;
        const challenge = challenges[pairIndex];
        return {
            date: dateKey,
            start: challenge.start[language],
            goal: challenge.goal[language],
            pairIndex: pairIndex
        };
    }

    global.SIX_HOPS_DAILY = {
        timeZone: timeZone,
        challenges: challenges,
        getDateKey: getDateKey,
        getChallenge: getChallenge
    };
})(window);
