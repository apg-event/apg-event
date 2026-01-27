// --- CONFIGURATION ---
const CLIENT_ID = 'n4o3cf4pibix11jq1ttiezb6i6vdng';
const CLIENT_SECRET = 'ezemgj15le807f63lk6f11wmki32vc'; // WARNING: Exposed on client side. Only for closed event use.

// Internal cache for the access token
let accessToken: string | null = null;
let tokenExpiry: number = 0;

export interface TwitchStatus {
    isLive: boolean;
    category?: string;
}

/**
 * Get App Access Token (Client Credentials Flow)
 */
const getAccessToken = async (): Promise<string | null> => {
    // Return cached token if valid
    if (accessToken && Date.now() < tokenExpiry) {
        return accessToken;
    }

    try {
        const params = new URLSearchParams();
        params.append('client_id', CLIENT_ID);
        params.append('client_secret', CLIENT_SECRET);
        params.append('grant_type', 'client_credentials');

        const response = await fetch('https://id.twitch.tv/oauth2/token', {
            method: 'POST',
            body: params
        });

        if (!response.ok) {
            console.error('Twitch Auth Failed:', await response.text());
            return null;
        }

        const data = await response.json();
        accessToken = data.access_token;
        // Set expiry slightly earlier than actual (expires_in is in seconds)
        tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; 

        return accessToken;
    } catch (e) {
        console.error('Twitch Auth Error:', e);
        return null;
    }
};

/**
 * Check which of the provided Twitch usernames are currently live.
 * Returns a map: { "game_player_name": { isLive: boolean, category: string } }
 * 
 * Logic: Assumes gameName === twitch_username (case insensitive)
 */
export const checkTwitchStatus = async (gameNames: string[]): Promise<Record<string, TwitchStatus>> => {
    const token = await getAccessToken();
    if (!token) return {};

    // 1. Resolve Game Names to Twitch Usernames
    const twitchUsersToCheck: string[] = [];
    const twitchToGameNameMap: Record<string, string> = {};

    gameNames.forEach(gameName => {
        // Use nickname directly. Twitch handles case insensitivity, but API prefers lowercase or exact match.
        // We trim spaces to be safe.
        const normalized = gameName.trim().toLowerCase();
        if (normalized) {
            twitchUsersToCheck.push(normalized);
            // Map the lowercase twitch login back to the original Game Name for the result map
            twitchToGameNameMap[normalized] = gameName;
        }
    });

    if (twitchUsersToCheck.length === 0) return {};

    const liveMap: Record<string, TwitchStatus> = {};
    
    // 2. Fetch Streams from Twitch API in chunks (max 100 per request)
    const CHUNK_SIZE = 100;
    
    try {
        for (let i = 0; i < twitchUsersToCheck.length; i += CHUNK_SIZE) {
            const chunk = twitchUsersToCheck.slice(i, i + CHUNK_SIZE);
            const url = new URL('https://api.twitch.tv/helix/streams');
            chunk.forEach(user => url.searchParams.append('user_login', user));

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Client-ID': CLIENT_ID,
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                console.warn(`Twitch Streams Fetch Failed for chunk ${i}:`, response.status);
                continue;
            }

            const data = await response.json();

            // 3. Process Live Streams
            if (data.data && Array.isArray(data.data)) {
                data.data.forEach((stream: any) => {
                    if (stream.type === 'live') {
                        const login = stream.user_login.toLowerCase();
                        const originalGameName = twitchToGameNameMap[login];
                        
                        // If we found the game name corresponding to this live twitch channel
                        if (originalGameName) {
                            liveMap[originalGameName] = {
                                isLive: true,
                                category: stream.game_name // Fetch game/category name
                            };
                        }
                    }
                });
            }
        }

        return liveMap;

    } catch (e) {
        console.error('Twitch Check Error:', e);
        return {};
    }
};

/**
 * Generates a Twitch URL based on the player name.
 */
export const getTwitchUrl = (gameName: string): string | null => {
    const normalized = gameName.trim().toLowerCase();
    return normalized ? `https://twitch.tv/${normalized}` : null;
};