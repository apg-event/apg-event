import React from 'react';

// Data models for the Board Game

export enum PlayerStatus {
  ACTIVE = 'ACTIVE',
  STUNNED = 'STUNNED',
  POISONED = 'POISONED',
  SHIELDED = 'SHIELDED',
  ELIMINATED = 'ELIMINATED'
}

export interface PlayerEffect {
  id: string;
  name: string;
  duration: number;
  isPositive: boolean;
  description?: string; // Added description for tooltip lookup
  glossaryId?: string; // Link to glossary image
}

export interface InventoryItem {
  id: string;
  name: string;
  icon: string; // Generated on frontend (Emoji fallback)
  glossaryId?: string; // Link to glossary image
  description: string;
  count: number; // Added from Unity WebItem
  isPositive: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface MatchHistory {
  day: number;
  game: string;
  result: string;
  time: string;
  comment: string; // Added comment field
  score?: number; // Added score field (0-10)
}

export interface Player {
  id: string;
  name: string;
  avatarUrl: string; // Generated on frontend
  color: string; // Generated on frontend
  position: number; // Mapped from 'tile' (1-100)
  
  // New fields from Unity
  hp: number;
  maxHp: number;
  isDead: boolean;
  
  status: PlayerStatus;
  inventory: InventoryItem[];
  effects: PlayerEffect[]; // Added active effects list
  history: MatchHistory[]; // Raw history list
  
  // Twitch Integration
  isLive?: boolean;
  twitchUsername?: string;
  twitchCategory?: string; // New field for stream category (Game Name)

  stats: {
    gamesPlayed: number;
    wins: number;
    drops: number; // New metric for "deaths/drops"
    rerolls: number; // New metric for "rerolls"
    movesCount: number; // Calculated or 0
  };
}

export enum CellType {
  NORMAL = 'NORMAL',
  START = 'START',
  FINISH = 'FINISH',
  LADDER_START = 'LADDER_START',
  SNAKE_START = 'SNAKE_START'
}

export interface Coordinate {
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
}

export interface BoardCell {
  id: number;
  type: CellType;
  coordinates: Coordinate; // Added for Unity Map mapping
  description?: string;
  effectName?: string;
  sectorName?: string;
  sectorColor?: string;
  jumpTargetId?: number; // If this is a snake/ladder start, where does it go?
}

export interface GameState {
  isPlaying: boolean;
  turnNumber: number;
  activePlayerId: string;
  lastEventLog: string[];
}

// Glossary Types
export type GlossaryCategory = 'Rules' | 'Wheel';
export type WheelSubCategory = 'Items' | 'Events' | 'Traps';

export interface GlossaryEntry {
  id: string;
  title: string;
  category: GlossaryCategory;
  subcategory?: WheelSubCategory; // Only for Wheel category
  description: string;
}