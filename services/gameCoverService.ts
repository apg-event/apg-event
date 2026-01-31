
// RAWG API CONFIGURATION
const API_KEY = '683af2661f5b4c07b15a04877441a673';
const BASE_URL = 'https://api.rawg.io/api/games';

// LocalStorage Key
const CACHE_KEY = 'rgg_covers_cache_v1';

interface CacheEntry {
    url: string | null; // null means "not found" (so we don't query again)
    timestamp: number;
}

type CoverCache = Record<string, CacheEntry>;

// Helper to load cache
const loadCache = (): CoverCache => {
    try {
        const saved = localStorage.getItem(CACHE_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        return {};
    }
};

// Helper to save cache
const saveCache = (cache: CoverCache) => {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
        console.warn('LocalStorage full, cannot save covers cache');
    }
};

// Memory cache to avoid reading LS constantly in one session
let memoryCache: CoverCache = loadCache();

export const getGameCoverUrl = async (gameName: string): Promise<string | null> => {
    if (!gameName || gameName.length < 2) return null;

    const normalizedKey = gameName.trim().toLowerCase();

    // 1. Check Cache
    const cached = memoryCache[normalizedKey];
    if (cached) {
        // Cache never expires for this event (games don't change covers often)
        return cached.url;
    }

    // 2. Fetch from RAWG
    try {
        const response = await fetch(`${BASE_URL}?key=${API_KEY}&search=${encodeURIComponent(gameName)}&page_size=1`);
        
        if (!response.ok) {
            throw new Error(`RAWG API Error: ${response.status}`);
        }

        const data = await response.json();
        
        // Check if we got results
        let imageUrl: string | null = null;
        if (data.results && data.results.length > 0) {
            // We take the first result
            // Prefer background_image. Sometimes background_image_additional exists but background_image is safer.
            imageUrl = data.results[0].background_image;
        }

        // 3. Update Cache
        memoryCache[normalizedKey] = {
            url: imageUrl,
            timestamp: Date.now()
        };
        saveCache(memoryCache);

        return imageUrl;
    } catch (error) {
        console.warn(`Failed to fetch cover for ${gameName}:`, error);
        // We do NOT cache errors as null, just in case it's a network glitch.
        // Unless it's a 404, but fetch throws on network mainly.
        return null;
    }
};
