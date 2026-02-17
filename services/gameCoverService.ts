import { STATIC_COVERS } from '../data/staticCovers';

// LocalStorage Key
const CACHE_KEY = 'apg_covers_cache_v1';

interface CacheEntry {
    url: string | null; 
    timestamp: number;
}

type CoverCache = Record<string, CacheEntry>;

// --- STATIC CACHE INIT ---
// Нормализуем ключи из файла staticCovers.ts для быстрого поиска
const MEMORY_STATIC_CACHE: Record<string, string> = {};
Object.entries(STATIC_COVERS).forEach(([key, url]) => {
    if (key && url) {
        MEMORY_STATIC_CACHE[key.trim().toLowerCase()] = url;
    }
});

// Helper to load cache from LocalStorage
const loadCache = (): CoverCache => {
    try {
        const saved = localStorage.getItem(CACHE_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        return {};
    }
};

// In-memory copy of the cache
let memoryCache: CoverCache = loadCache();

export const getGameCoverUrl = async (gameName: string): Promise<string | null> => {
    if (!gameName || gameName.length < 2) return null;

    // Нормализация ключа
    const normalizedKey = gameName.trim().toLowerCase();

    // 1. Сначала проверяем статический файл (Самый быстрый вариант)
    if (MEMORY_STATIC_CACHE[normalizedKey]) {
        return MEMORY_STATIC_CACHE[normalizedKey];
    }

    // 2. Проверяем LocalStorage (Если уже загружали ранее)
    const cached = memoryCache[normalizedKey];
    if (cached) {
        return cached.url;
    }

    // 3. API Запросы отключены. Возвращаем null, если нет в кэше.
    return null;
};
