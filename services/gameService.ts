import { useEffect, useState } from 'react';
import { Player, GameState, PlayerStatus, InventoryItem, MatchHistory, PlayerEffect } from '../types';
import { INITIAL_PLAYERS } from '../constants';
import { checkTwitchStatus, getTwitchUrl, TwitchStatus } from './twitchService';
import { getDescriptionByName, getGlossaryIdByName } from '../data/glossaryData';
import { PLAYER_COLORS } from '../data/playerCustomization';

const FIREBASE_BASE_URL = import.meta.env.VITE_FIREBASE_BASE_URL || "";
const FIREBASE_HISTORY_URL = import.meta.env.VITE_FIREBASE_HISTORY_URL || "";

// Keys for LocalStorage
const STORAGE_KEY_LITE = 'rgg_event_lite_v1';
const STORAGE_KEY_HISTORY = 'rgg_event_history_v1';

// Типы для внутренней логики мерджа данных
// FIX: Added name: string to ensure TS knows name exists
type LitePlayerData = Partial<Player> & { id: string; name: string };
type HistoryData = Record<string, MatchHistory[]>; // id -> history[]

// Хелпер для парсинга "Легких" данных (Позиция, HP, Инвентарь)
const parseLitePlayer = (id: string, data: any): LitePlayerData => {
  const name = data.name || `Operative ${id}`;
  const rawPosition = Number(data.tile || data.position || 0);
  let position = rawPosition - 1;

  // Clamp to board limits
  if (position > 100) position = 100;
  // CHANGED: Allow position 0 as "Start"
  if (position < 0) position = 0;
  const hp = Number(data.hp ?? 100);
  const maxHp = Number(data.maxHp ?? 100);
  const isDead = Boolean(data.isDead);
  const idString = String(data.id || id);

  // Status & Effects mapping
  let status = PlayerStatus.ACTIVE;
  let effects: PlayerEffect[] = [];

  if (isDead) {
    status = PlayerStatus.ELIMINATED;
  }
  
  if (data.effects && Array.isArray(data.effects)) {
    // 1. Parse full effects list for UI
    effects = data.effects.map((e: any, idx: number) => ({
        id: `eff-${id}-${idx}`,
        name: e.name || 'Unknown',
        duration: Number(e.duration || 0),
        isPositive: e.isPositive !== false,
        // Try to find description in Glossary if missing
        description: e.description || getDescriptionByName(e.name || ''),
        // Link to glossary image if available
        glossaryId: getGlossaryIdByName(e.name || '')
    }));

    // 2. Derive status from effects (Legacy logic kept for compatibility)
    const effectNames = effects.map(e => e.name.toUpperCase());
    if (!isDead) {
        if (effectNames.some((n: string) => n.includes('STUN'))) status = PlayerStatus.STUNNED;
        else if (effectNames.some((n: string) => n.includes('POISON'))) status = PlayerStatus.POISONED;
        else if (effectNames.some((n: string) => n.includes('SHIELD'))) status = PlayerStatus.SHIELDED;
    }
  }

  // Inventory mapping
  let inventory: InventoryItem[] = [];
  if (Array.isArray(data.inventory)) {
    inventory = data.inventory.map((item: any, idx: number) => ({
      id: `inv-${id}-${idx}`,
      name: item.name || 'Unknown Item',
      icon: getIconByName(item.name),
      glossaryId: getGlossaryIdByName(item.name), // Link to glossary image
      // Use Glossary description if backend sends empty string
      description: item.description || getDescriptionByName(item.name) || 'Описание отсутствует',
      count: Number(item.count || 1),
      isPositive: item.isPositive !== false,
      rarity: 'common'
    }));
  }

  // COLOR LOGIC: Check Custom Config -> fallback to Auto Generator
  const color = PLAYER_COLORS[idString] || PLAYER_COLORS[name] || stringToColor(name);

  return {
    id: idString,
    name,
    avatarUrl: `./assets/avatars/${name}.png`,
    color: color,
    position: position > 100 ? 100 : position < 1 ? 1 : position,
    hp,
    maxHp,
    isDead,
    status,
    effects, // New field
    inventory,
    // Note: History is NOT parsed here to save bandwidth logic
  };
};

const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

const getIconByName = (name: string): string => {
  const n = name?.toLowerCase() || '';
  if (n.includes('shield') || n.includes('щит')) return '🛡️';
  if (n.includes('key') || n.includes('ключ')) return '🔑';
  if (n.includes('sword') || n.includes('blade') || n.includes('меч')) return '⚔️';
  if (n.includes('potion') || n.includes('heal') || n.includes('зелье')) return '🧪';
  if (n.includes('gold') || n.includes('coin') || n.includes('монет')) return '💰';
  if (n.includes('ice') || n.includes('axe') || n.includes('ледоруб')) return '⛏️';
  return '📦';
};

export const useGameData = () => {
  // Инициализация из LocalStorage (если есть)
  const [liteData, setLiteData] = useState<LitePlayerData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LITE);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn("Failed to load lite data from storage", e);
      return [];
    }
  });

  const [historyData, setHistoryData] = useState<HistoryData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.warn("Failed to load history data from storage", e);
      return {};
    }
  });
  
  // Twitch Live Status Map: { "PlayerName": { isLive: true, category: 'Game' } }
  const [liveStatusData, setLiveStatusData] = useState<Record<string, TwitchStatus>>({});

  const [gameState, setGameState] = useState<GameState>({
    isPlaying: true,
    turnNumber: 0,
    activePlayerId: '',
    lastEventLog: ['Инициализация соединения...']
  });

  // Итоговый список игроков — результат слияния lite + history + twitch
  const [mergedPlayers, setMergedPlayers] = useState<Player[]>(INITIAL_PLAYERS);

  // 1. IMPORTANT LOOP: Запрашиваем основное состояние (координаты, хп) каждые 5 минут
  useEffect(() => {
    const fetchLiteState = async () => {
      try {
        const response = await fetch(`${FIREBASE_BASE_URL}/gamestate.json`);
        
        // FAIL-SAFE: Network Error
        if (!response.ok) {
            throw new Error(`Network error: ${response.status}`);
        }
        
        const raw = await response.json();

        // FAIL-SAFE: Empty Data or Null
        if (!raw) {
            throw new Error("Received empty or null data from Firebase");
        }

        let dataRoot = raw;
        // Handle various root structures based on Unity behavior
        if (raw.gamestate) dataRoot = raw.gamestate;
        else if (raw.players) dataRoot = raw;

        // Log parsing
        if (dataRoot.globalLog && Array.isArray(dataRoot.globalLog)) {
           setGameState(prev => ({
             ...prev,
             lastEventLog: dataRoot.globalLog.slice(-5).reverse()
           }));
        }

        // Players parsing
        const rawPlayers = dataRoot.players;
        if (rawPlayers) {
          let parsed: LitePlayerData[] = [];
          if (Array.isArray(rawPlayers)) {
             parsed = rawPlayers.filter(p => p !== null).map((p, idx) => parseLitePlayer(String(p.id || idx), p));
          } else if (typeof rawPlayers === 'object') {
             parsed = Object.entries(rawPlayers).map(([k, v]) => parseLitePlayer(k, v));
          }
          
          if (parsed.length > 0) {
              setLiteData(parsed);
              // SUCCESS: Save valid data to backup
              localStorage.setItem(STORAGE_KEY_LITE, JSON.stringify(parsed));
          } else {
              throw new Error("Parsed players list is empty");
          }
        } else {
             throw new Error("No players found in dataRoot");
        }
      } catch (e) {
        console.warn("Lite fetch failed or data empty. Attempting backup restore...", e);
        // FALLBACK: Load from LocalStorage
        try {
            const backup = localStorage.getItem(STORAGE_KEY_LITE);
            if (backup) {
                const parsedBackup = JSON.parse(backup);
                if (parsedBackup && parsedBackup.length > 0) {
                    setLiteData(parsedBackup);
                    console.log("Restored lite data from backup.");
                }
            }
        } catch (backupError) {
            console.error("Backup restore failed:", backupError);
        }
      }
    };

    // Если данных ВООБЩЕ нет (первый заход), грузим сразу. Иначе ждем интервала.
    if (liteData.length === 0) {
      fetchLiteState();
    }

    const interval = setInterval(fetchLiteState, 1 * 60 * 1000); // 5 Minutes
    return () => clearInterval(interval);
  }, []); 

  // 2. BACKGROUND LOOP: Запрашиваем Историю каждые 10 минут
  useEffect(() => {
    const fetchHistoryState = async () => {
      try {
        const response = await fetch(`${FIREBASE_HISTORY_URL}/.json`); 
        
        // FAIL-SAFE: Network Error
        if (!response.ok) {
            throw new Error(`History Network error: ${response.status}`);
        }

        const raw = await response.json();
        
        // FAIL-SAFE: Empty Data
        if (!raw) {
            throw new Error("History data is null or empty");
        }
        
        const newHistoryMap: HistoryData = {};
        
        // --- UNITY DATA STRUCTURE PARSING ---
        let rawPlayers = null;
        
        if (raw.players && Array.isArray(raw.players)) {
            rawPlayers = raw.players;
        } else if (raw.history && raw.history.players) {
            rawPlayers = raw.history.players;
        } else if (raw.gamestate && raw.gamestate.players) {
            rawPlayers = raw.gamestate.players;
        }

        if (rawPlayers) {
            const list = Array.isArray(rawPlayers) ? rawPlayers : Object.values(rawPlayers);
            
            list.forEach((p: any, idx: number) => {
                if (!p) return;
                
                // Ensure ID matches the lite data (String)
                const id = String(p.id !== undefined ? p.id : idx);
                
                let hist: MatchHistory[] = [];
                // Unity Class: WebPlayerHistory -> public List<WebHistory> history;
                if (p.history && Array.isArray(p.history)) {
                     hist = p.history.map((h: any) => ({
                        day: Number(h.day || 0),
                        game: h.game || 'Неизвестно',
                        result: h.result || '-',
                        time: h.time || '-',
                        comment: h.comment || '',
                        score: h.score !== undefined ? Number(h.score) : undefined 
                    }));
                }

                newHistoryMap[id] = hist;
            });
            
            if (Object.keys(newHistoryMap).length > 0) {
                setHistoryData(newHistoryMap);
                // SUCCESS: Save valid history to backup
                localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(newHistoryMap));
            } else {
                 throw new Error("Parsed history is empty");
            }

        } else {
             throw new Error("Could not find 'players' list in history response");
        }
      } catch (e) {
        console.warn("History fetch failed. Attempting backup restore...", e);
        // FALLBACK: Load from LocalStorage
        try {
            const backup = localStorage.getItem(STORAGE_KEY_HISTORY);
            if (backup) {
                const parsedBackup = JSON.parse(backup);
                if (parsedBackup && Object.keys(parsedBackup).length > 0) {
                    setHistoryData(parsedBackup);
                    console.log("Restored history data from backup.");
                }
            }
        } catch (backupError) {
            console.error("History backup restore failed:", backupError);
        }
      }
    };

    // Если истории нет в кэше, грузим сразу
    if (Object.keys(historyData).length === 0) {
      fetchHistoryState();
    }

    const interval = setInterval(fetchHistoryState, 10 * 60 * 1000); // 10 Minutes
    return () => clearInterval(interval);
  }, []);

  // 3. TWITCH LOOP: Запрашиваем статус стримов каждые 60 секунд
  useEffect(() => {
      const fetchTwitch = async () => {
          if (liteData.length === 0) return;
          const names = liteData.map(p => p.name);
          const statuses = await checkTwitchStatus(names);
          setLiveStatusData(statuses);
      };

      // Run initially if we have player data
      if (liteData.length > 0) {
          fetchTwitch();
      }

      const interval = setInterval(fetchTwitch, 60000); // 60 seconds
      return () => clearInterval(interval);
  }, [liteData.length]); // Re-run if player list size changes (initially populated)


  // 4. MERGE: Объединяем быстрые данные, медленную историю и Twitch
  useEffect(() => {
    if (liteData.length === 0) return;

    const merged = liteData
      .filter(p => p.name && p.name.toLowerCase() !== 'admin') // --- EXCLUDE ADMIN ---
      .map(lite => {
        // Find history by ID
        const history = historyData[lite.id] || [];
        
        const gamesPlayed = history.length;
        const wins = history.filter(h => 
            (h.result || '').toLowerCase().includes('пройдено') ||
            (h.result || '').toLowerCase().includes('win')
        ).length;

        // Calculate DROPS
        // Added Cyrillic 'дроп' check
        const drops = history.filter(h => {
             const r = (h.result || '').toLowerCase();
             return r.includes('drop') || r.includes('дроп');
        }).length;

        // Calculate REROLLS
        const rerolls = history.filter(h => {
             const r = (h.result || '').toLowerCase();
             return r.includes('reroll') || r.includes('реролл');
        }).length;

        // Resolve Twitch Info
        const twitchStatus = liveStatusData[lite.name];
        const isLive = twitchStatus?.isLive || false;
        const twitchCategory = twitchStatus?.category;
        
        // Construct full URL using logic from twitchService
        const twitchUsername = getTwitchUrl(lite.name) || undefined;

        return {
            ...lite,
            history,
            isLive,
            twitchUsername,
            twitchCategory, // Add extracted category
            stats: {
                gamesPlayed,
                wins,
                drops,
                rerolls,
                movesCount: 0
            }
        } as Player;
    });

    setMergedPlayers(merged);
  }, [liteData, historyData, liveStatusData]);

  return { players: mergedPlayers, gameState };
};