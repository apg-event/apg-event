import { GlossaryEntry } from '../types';

export const GLOSSARY_DATA: GlossaryEntry[] = [
    // --- RULES (Single Block Content) ---
    {
        id: 'rule-1',
        category: 'Rules',
        title: 'Передвижение и Ходы',
        description: 'Игроки по очереди бросают кубик d6. Выпавшая цифра соответствует количеству клеток, на которое продвигается персонаж. Если выпадает 6 — игрок делает дополнительный ход. Порядок ходов определяется списком лидеров в начале дня.'
    },
    {
        id: 'rule-2',
        category: 'Rules',
        title: 'Дуэли (PVP)',
        description: 'Если игрок заканчивает ход на клетке, где уже стоит другой участник, начинается дуэль. Проигравший дуэль отбрасывается на 3 клетки назад или получает эффект оглушения (зависит от текущей фазы игры). Победитель остается на клетке.'
    },
    {
        id: 'rule-3',
        category: 'Rules',
        title: 'Условия Победы',
        description: 'Побеждает тот, кто первым доберется до 100-й клетки. Для финиша необходимо выбросить точное значение на кубике. Если выпадает больше — игрок отскакивает назад на лишнее количество очков.'
    },
    {
        id: 'rule-4',
        category: 'Rules',
        title: 'Механика Смерти',
        description: 'Если здоровье игрока падает до 0, он считается "Погибшим". Он теряет все предметы и возвращается на ближайший чекпоинт (Клетки 1, 25, 50, 75). Возрождение занимает 1 ход.'
    },

    // --- WHEEL: ITEMS ---
    {
        id: 'shield',
        category: 'Wheel',
        subcategory: 'Items',
        title: 'Щит',
        description: 'Отражает направленный урон и ловушки в случайного участника. Работает только на предметы, которые использовали против тебя. Одноразовый.'
    },
    {
        id: 'item-2',
        category: 'Wheel',
        subcategory: 'Items',
        title: 'Ледоруб',
        description: 'Позволяет один раз проигнорировать механику "Спуск" (Змея/Трещина) и остаться на верхней клетке при попадании на неё.'
    },
    {
        id: 'item-3',
        category: 'Wheel',
        subcategory: 'Items',
        title: 'Зелье Скорости',
        description: 'Добавляет +2 к следующему броску кубика. Применяется автоматически перед следующим ходом игрока.'
    },
    {
        id: 'item-4',
        category: 'Wheel',
        subcategory: 'Items',
        title: 'Ржавый Ключ',
        description: 'Может открыть один сундук обычного или редкого качества, встречающийся на карте в специальных секторах.'
    },
    {
        id: 'item-5',
        category: 'Wheel',
        subcategory: 'Items',
        title: 'Золотая Монета',
        description: 'Универсальная валюта. Можно обменять у Торговца на случайный предмет или откупиться от некоторых негативных событий.'
    },

    // --- WHEEL: EVENTS ---
    {
        id: 'evt-1',
        category: 'Wheel',
        subcategory: 'Events',
        title: 'Северное Сияние',
        description: 'Положительное событие. Все игроки восстанавливают 20 здоровья и получают эффект "Вдохновение" (следующий бросок не может быть 1).'
    },
    {
        id: 'evt-2',
        category: 'Wheel',
        subcategory: 'Events',
        title: 'Swap (Обмен)',
        description: 'Игрок меняется позициями с ближайшим соперником. Если соперников рядом нет, обмен происходит со случайным игроком из топ-3.'
    },
    {
        id: 'evt-3',
        category: 'Wheel',
        subcategory: 'Events',
        title: 'Двойной бросок',
        description: 'В следующий ход все значения на кубике для этого игрока удваиваются (1->2, 6->12).'
    },
    {
        id: 'evt-4',
        category: 'Wheel',
        subcategory: 'Events',
        title: 'Ускорение',
        description: 'Дальность перемещения увеличена на 1 клетку в течение 3-х ходов.'
    },

    // --- WHEEL: TRAPS ---
    {
        id: 'trap-1',
        category: 'Wheel',
        subcategory: 'Traps',
        title: 'Буран (Событие)',
        description: 'Глобальная ловушка. Все игроки на открытых участках карты получают 10 урона холодом и замедляются на 1 ход.'
    },
    {
        id: 'trap-2',
        category: 'Wheel',
        subcategory: 'Traps',
        title: 'Сход Лавины',
        description: 'Сектор карты перекрывается. Игроки в зоне лавины отбрасываются на ближайшую безопасную точку ниже по карте и теряют 15 HP.'
    },
    {
        id: 'trap-3',
        category: 'Wheel',
        subcategory: 'Traps',
        title: 'Гига-Реролл',
        description: 'Жестокая ловушка. Игрок обязан перепройти игру, которую он сейчас стримит (Reroll текущего задания). Прогресс по клеткам сохраняется.'
    },
    {
        id: 'trap-4',
        category: 'Wheel',
        subcategory: 'Traps',
        title: 'Тюрьма',
        description: 'Игрок попадает в ледяную тюрьму. Пропуск 2-х ходов или необходимость выбросить 6 на кубике для досрочного выхода.'
    },
    {
        id: 'trap-5',
        category: 'Wheel',
        subcategory: 'Traps',
        title: 'Кража',
        description: 'Случайный предмет из инвентаря уничтожается или передается отстающему игроку.'
    },
    {
        id: 'trap-6',
        category: 'Wheel',
        subcategory: 'Traps',
        title: 'Обморожение (Stun)',
        description: 'Персонаж замерз. Он пропускает свой следующий ход. Эффект снимается после пропуска.'
    },
    {
        id: 'trap-7',
        category: 'Wheel',
        subcategory: 'Traps',
        title: 'Яд (Poison)',
        description: 'Игрок теряет 5% здоровья каждый ход. Эффект действует 3 хода или пока не будет исцелен.'
    }
];

/**
 * Helper to find description by name (case-insensitive partial match).
 * Used to populate Player Profile cards when backend doesn't provide a description.
 */
export const getDescriptionByName = (name: string): string => {
    if (!name) return '';
    
    const search = name.toLowerCase().trim();
    
    // 1. Exact match attempt
    const exact = GLOSSARY_DATA.find(e => e.title.toLowerCase() === search);
    if (exact) return exact.description;

    // 2. Partial match attempt
    const partial = GLOSSARY_DATA.find(e => search.includes(e.title.toLowerCase()) || e.title.toLowerCase().includes(search));
    
    return partial ? partial.description : '';
};

/**
 * Helper to find Glossary ID by name (case-insensitive partial match).
 * Used to map backend item names to local image assets.
 */
export const getGlossaryIdByName = (name: string): string | undefined => {
    if (!name) return undefined;
    const search = name.toLowerCase().trim();
    
    // 1. Exact match attempt
    const exact = GLOSSARY_DATA.find(e => e.title.toLowerCase() === search);
    if (exact) return exact.id;

    // 2. Partial match attempt
    const partial = GLOSSARY_DATA.find(e => search.includes(e.title.toLowerCase()) || e.title.toLowerCase().includes(search));
    
    return partial ? partial.id : undefined;
};
