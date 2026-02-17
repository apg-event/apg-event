import { useEffect, useState } from 'react';
import { Player, GameState, PlayerStatus, InventoryItem, MatchHistory, PlayerEffect } from '../types';
import { INITIAL_PLAYERS } from '../constants';
import { checkTwitchStatus, getTwitchUrl, TwitchStatus } from './twitchService';
import { getDescriptionByName, getGlossaryIdByName } from '../data/glossaryData';
import { PLAYER_COLORS } from '../data/playerCustomization';
import { STATIC_GAMESTATE } from '../data/staticGameState';
import { STATIC_HISTORY } from '../data/staticHistory';

// Keys for LocalStorage
const STORAGE_KEY_HISTORY = 'rgg_event_history_v1';

// Типы для внутренней логики мерджа данных
type LitePlayerData = Partial<Player> & { id: string; name: string };
type HistoryData = Record<string, MatchHistory[]>; // id -> history[]

// Хелпер для парсинга "Легких" данных (Позиция, HP, Инвентарь)
const parseLitePlayer = (id: string, data: any): LitePlayerData => {
  const name = data.name || `Operative ${id}`;
  
  // FIX: Removed -1 offset. Using raw position directly from static file.
  const rawPosition = Number(data.tile || data.position || 0);
  let position = rawPosition;

  // Clamp to board limits
  if (position > 100) position = 100;
  // Allow position 0 as "Start"
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
    avatarUrl: `/assets/avatars/${name}.png`,
    color: color,
    position: position,
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
  // Инициализация из LocalStorage (если есть) - оставлено для совместимости, но перезапишется статикой
  const [liteData, setLiteData] = useState<LitePlayerData[]>([]);

  const [historyData, setHistoryData] = useState<HistoryData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.warn("Failed to load history data from storage", e);
      return {};
    }
  });
  
  // Twitch Live Status Map
  const [liveStatusData, setLiveStatusData] = useState<Record<string, TwitchStatus>>({});

  const [gameState, setGameState] = useState<GameState>({
    isPlaying: true,
    turnNumber: 0,
    activePlayerId: '',
    lastEventLog: ['Событие завершено']
  });

  // Итоговый список игроков — результат слияния lite + history + twitch
  const [mergedPlayers, setMergedPlayers] = useState<Player[]>(INITIAL_PLAYERS);

  // 1. STATIC LOAD: Загружаем данные из файла STATIC_GAMESTATE
  useEffect(() => {
    const loadStaticData = () => {
        try {
            const rawPlayers = STATIC_GAMESTATE.gamestate.players;
            
            if (rawPlayers && Array.isArray(rawPlayers)) {
                // Используем тот же парсер, что и раньше, чтобы сохранить логику (цвета, эффекты, инвентарь)
                const parsed = rawPlayers.map((p, idx) => parseLitePlayer(String(p.id || idx), p));
                
                if (parsed.length > 0) {
                    setLiteData(parsed);
                }
            } else {
                console.error("Static data format error: players is not an array");
            }
        } catch (e) {
            console.error("Failed to load static gamestate:", e);
        }
    };

    loadStaticData();
    // Нет интервала, загружаем один раз
  }, []); 

  // 2. STATIC LOAD: Загружаем историю из файла STATIC_HISTORY
  useEffect(() => {
    const loadHistoryState = () => {
      try {
        const raw = STATIC_HISTORY;
        
        const newHistoryMap: HistoryData = {};
        
        let rawPlayers = null;
        if (raw.history && raw.history.players) {
            rawPlayers = raw.history.players;
        }

        if (rawPlayers) {
            const list = Array.isArray(rawPlayers) ? rawPlayers : Object.values(rawPlayers);
            
            list.forEach((p: any, idx: number) => {
                if (!p) return;
                
                const id = String(p.id !== undefined ? p.id : idx);
                
                let hist: MatchHistory[] = [];
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
                localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(newHistoryMap));
            }
        }
      } catch (e) {
        console.error("Failed to load static history:", e);
      }
    };

    loadHistoryState();
  }, []);

  // 3. TWITCH LOOP: Запрашиваем статус стримов каждые 60 секунд
  useEffect(() => {
      const fetchTwitch = async () => {
          if (liteData.length === 0) return;
          const names = liteData.map(p => p.name);
          const statuses = await checkTwitchStatus(names);
          setLiveStatusData(statuses);
      };

      if (liteData.length > 0) {
          fetchTwitch();
      }

      const interval = setInterval(fetchTwitch, 60000);
      return () => clearInterval(interval);
  }, [liteData.length]); 


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
            (h.result || '').toLowerCase().includes('win') ||
            (h.result || '').toLowerCase().includes('pobed') ||
            (h.result || '').toLowerCase().includes('побед') ||
            (h.result || '').toLowerCase().includes('1')
        ).length;

        // Calculate DROPS
        const drops = history.filter(h => {
             const r = (h.result || '').toLowerCase();
             return r.includes('drop') || r.includes('дроп') || r.includes('dead') || r.includes('death') || r.includes('выбыл') || r.includes('погиб') || r.includes('смерть');
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
        
        const twitchUsername = getTwitchUrl(lite.name) || undefined;

        return {
            ...lite,
            history,
            isLive,
            twitchUsername,
            twitchCategory,
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