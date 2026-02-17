import { GLOSSARY_DATA } from '../data/glossaryData';

const CACHE_KEY = 'apg_icons_cache_v1';

// In-memory cache: ID -> Base64 DataURI
const iconCache = new Map<string, string | null>();

// Initialize from LocalStorage on load
try {
    const saved = localStorage.getItem(CACHE_KEY);
    if (saved) {
        const parsed = JSON.parse(saved);
        Object.entries(parsed).forEach(([key, val]) => {
            iconCache.set(key, val as string | null);
        });
    }
} catch (e) {
    console.warn("Failed to load icon cache from LS", e);
}

const saveCache = () => {
    try {
        const obj = Object.fromEntries(iconCache.entries());
        localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
    } catch (e) {
        console.warn("LocalStorage quota exceeded for icons", e);
    }
};

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const fetchAndCache = async (id: string): Promise<string | null> => {
    try {
        const response = await fetch(`/assets/icons/${id}.png`);
        if (!response.ok) throw new Error('Not found');
        
        const blob = await response.blob();
        const base64 = await blobToBase64(blob);
        
        iconCache.set(id, base64);
        // We defer saving to bulk operations usually, but for safety saving here is fine
        // Note: For massive preloads, this might be spammy, but browsers handle it reasonably.
        // Optimization: We will save manually in preloadAll.
        return base64;
    } catch (e) {
        iconCache.set(id, null);
        return null;
    }
};

export const getIcon = async (id: string): Promise<string | null> => {
    if (!id) return null;
    if (iconCache.has(id)) return iconCache.get(id) || null;
    
    const res = await fetchAndCache(id);
    saveCache(); // Save after individual fetch
    return res;
};

// Sync getter for immediate rendering if available
export const getIconSync = (id: string): string | null | undefined => {
    if (iconCache.has(id)) return iconCache.get(id) || null;
    return undefined;
};

export const preloadIcons = async () => {
    const promises = GLOSSARY_DATA.map(item => {
        if (!iconCache.has(item.id)) {
            return fetchAndCache(item.id);
        }
        return Promise.resolve();
    });

    await Promise.allSettled(promises);
    saveCache(); // Bulk save after preload
};
