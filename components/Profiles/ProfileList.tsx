import React, { useState, useEffect, useRef } from 'react';
import { Player } from '../../types';
import { 
    Package, Heart, Gamepad2, Snowflake, Ghost, Sparkles, 
    Clock, RefreshCw, Trophy, Image as ImageIcon, Calendar, 
    Zap, Shield, Skull, ExternalLink, Search, User, Tv, Star
} from 'lucide-react';
import { GameIcon } from '../UI/GameIcon';

interface ProfileListProps {
  players: Player[];
}

type FilterType = 'ALL' | 'WINS' | 'DROPS' | 'REROLLS';

interface SmartTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
}

// --- SMART TOOLTIP COMPONENT ---
// Automatically calculates position to avoid clipping
const SmartTooltip: React.FC<SmartTooltipProps> = ({ children, content, className = "" }) => {
    const [pos, setPos] = useState<{ v: 'top' | 'bottom', h: 'left' | 'center' | 'right' }>({ v: 'top', h: 'center' });
    const triggerRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const winW = window.innerWidth;
        
        // Vertical Logic: If closer than 220px to top, flip to bottom
        const v = rect.top < 220 ? 'bottom' : 'top';
        
        // Horizontal Logic: Check Sidebar (approx 300px) and Right Edge
        let h: 'left' | 'center' | 'right' = 'center';
        if (rect.left < 320) h = 'left';
        else if (rect.right > winW - 240) h = 'right';

        setPos({ v, h });
    };

    // Dynamic Classes based on state
    const tooltipPositionClass = 
        pos.v === 'top' ? 'bottom-full mb-3' : 'top-full mt-3';
    
    let tooltipAlignClass = '-translate-x-1/2 left-1/2'; // Default Center
    if (pos.h === 'left') tooltipAlignClass = 'left-0';
    if (pos.h === 'right') tooltipAlignClass = 'right-0';

    let arrowAlignClass = 'left-1/2 -translate-x-1/2'; // Default Center
    if (pos.h === 'left') arrowAlignClass = 'left-6';
    if (pos.h === 'right') arrowAlignClass = 'right-6';

    const arrowDirClass = 
        pos.v === 'top' 
        ? `bottom-[-5px] border-t-midnight-900 border-l-transparent border-r-transparent border-b-transparent border-t-[6px] border-x-[6px]` // Point Down
        : `top-[-5px] border-b-midnight-900 border-l-transparent border-r-transparent border-t-transparent border-b-[6px] border-x-[6px]`; // Point Up

    return (
        <div 
            ref={triggerRef} 
            className={`relative group ${className}`} 
            onMouseEnter={handleMouseEnter}
        >
            {children}
            
            <div className={`
                absolute z-[100] w-56 p-4 rounded-xl border bg-midnight-900/95 backdrop-blur-xl shadow-2xl 
                opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 scale-95 group-hover:scale-100
                ${tooltipPositionClass} ${tooltipAlignClass}
            `}>
                {content}
                {/* Arrow */}
                <div className={`absolute w-0 h-0 ${arrowAlignClass} ${arrowDirClass}`}></div>
            </div>
        </div>
    );
};

export const ProfileList: React.FC<ProfileListProps> = ({ players }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('ALL');

  // Set default selection when players load
  useEffect(() => {
    if (players.length > 0 && !selectedId) {
        setSelectedId(players[0].id);
    }
  }, [players, selectedId]);

  const activePlayer = players.find(p => p.id === selectedId) || players[0];

  // Calculate Rank based on position (Leaderboard logic)
  const rank = activePlayer 
    ? [...players].sort((a, b) => b.position - a.position).findIndex(p => p.id === activePlayer.id) + 1 
    : 0;

  if (players.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 animate-pulse border border-white/10">
                <Snowflake className="w-8 h-8 text-ice-400 animate-spin-slow" />
            </div>
            <h3 className="text-xl font-bold text-slate-300 mb-2">Ожидание подключения...</h3>
            <p className="text-slate-500 max-w-md text-sm">
                Связь с сервером устанавливается.
            </p>
        </div>
      );
  }

  if (!activePlayer) return null;

  // Filter History Logic
  const filteredHistory = activePlayer.history.filter(h => {
      if (filterType === 'ALL') return true;
      const res = (h.result || '').toLowerCase();
      if (filterType === 'WINS') return res.includes('win') || res.includes('pobed') || res.includes('побед') || res.includes('1') || res.includes('пройдено');
      if (filterType === 'DROPS') return res.includes('drop') || res.includes('дроп') || res.includes('dead') || res.includes('death') || res.includes('выбыл');
      if (filterType === 'REROLLS') return res.includes('reroll') || res.includes('реролл');
      return true;
  }).reverse(); // Newest first

  // Helper for Effect Icons
  const getEffectIcon = (name: string, size: number = 18) => {
      const n = name.toLowerCase();
      if (n.includes('stun') || n.includes('freeze')) return <Snowflake size={size} />;
      if (n.includes('poison') || n.includes('toxic')) return <Skull size={size} />;
      if (n.includes('shield') || n.includes('protect')) return <Shield size={size} />;
      if (n.includes('speed') || n.includes('dash')) return <Zap size={size} />;
      return <Sparkles size={size} />;
  };

  const getScoreColor = (score: number) => {
      if (score >= 8) return 'text-emerald-400';
      if (score >= 6) return 'text-amber-400';
      if (score >= 4) return 'text-yellow-400';
      return 'text-rose-400';
  };

  const isEffectsCrowded = (activePlayer.effects?.length || 0) > 7;
  const effectSizeClass = isEffectsCrowded ? "w-8 h-8 rounded-lg" : "w-16 h-16 rounded-xl";
  const effectIconSize = isEffectsCrowded ? 14 : 24;

  // --- BADGE RENDERER ---
  const renderStatusBadge = () => {
    // Only show LIVE or OFFLINE, ignoring "isDead" status for the badge itself as per user request.
    if (activePlayer.isLive && activePlayer.twitchUsername) {
        return (
            <a 
                href={activePlayer.twitchUsername}
                target="_blank" 
                rel="noopener noreferrer"
                className="group/badge px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-[0.2em] border shadow-lg flex items-center gap-2 bg-red-600 text-white border-red-500 hover:bg-red-500 hover:border-red-400 transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:shadow-[0_0_20px_rgba(220,38,38,0.6)] animate-pulse hover:animate-none"
            >
                <Tv size={14} className="group-hover/badge:rotate-12 transition-transform" /> LIVE
            </a>
        );
    }

    return (
        <div className="px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-[0.2em] border shadow-lg flex items-center gap-2 bg-midnight-800 text-slate-500 border-white/10 cursor-default">
             OFFLINE
        </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-midnight-950">
      
      {/* --- TOP TABS (Player Selector) --- */}
      <div className="flex-shrink-0 border-b border-white/5 overflow-x-auto custom-scrollbar bg-midnight-900/50 backdrop-blur-sm z-50 sticky top-0">
        <div className="flex px-4 pt-2 min-w-max">
            {players.map(player => (
                <button
                    key={player.id}
                    onClick={() => { setSelectedId(player.id); setFilterType('ALL'); }}
                    className={`
                        relative flex items-center gap-3 px-6 py-3 rounded-t-xl transition-all duration-300 border-t border-r border-l 
                        ${selectedId === player.id 
                            ? 'bg-midnight-950 border-white/10 text-white z-10 -mb-px' 
                            : 'bg-transparent border-transparent text-slate-500 hover:text-ice-200 hover:bg-white/5'
                        }
                    `}
                >
                    <div className={`relative w-6 h-6 rounded-full overflow-hidden border ${selectedId === player.id ? 'border-ice-400' : 'border-white/10'}`}>
                        <img src={player.avatarUrl} alt="" className="w-full h-full object-cover" />
                        {player.isLive && (
                           <span className="absolute bottom-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-black animate-pulse"></span>
                        )}
                    </div>
                    <span className="font-bold text-sm whitespace-nowrap tracking-wide">{player.name}</span>
                    {selectedId === player.id && (
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-ice-500 via-ice-300 to-ice-500"></div>
                    )}
                </button>
            ))}
        </div>
      </div>

      {/* --- SCROLLABLE CONTENT --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1600px] mx-auto p-4 lg:p-8 space-y-6">

            {/* === BLOCK 1: HERO CARD (Info, Stats, Inventory, Effects) === */}
            <div className="bg-midnight-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-4 md:p-6 lg:p-8 shadow-xl">
                
                {/* --- TOP SECTION: Avatar, Info, HP, Stats --- */}
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start mb-8">
                    
                    {/* Avatar Column */}
                    <div className="flex flex-col items-center gap-4 flex-shrink-0">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-midnight-800 shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden relative group">
                             <img src={activePlayer.avatarUrl} alt={activePlayer.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                             {activePlayer.isDead && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Skull className="text-white/50 w-12 h-12" /></div>}
                        </div>
                        
                        {/* Status Badge */}
                        {renderStatusBadge()}
                    </div>

                    {/* Info Column */}
                    <div className="flex-1 w-full space-y-6 text-center md:text-left">
                        
                        {/* Name & Badges */}
                        <div className="flex flex-col md:flex-row justify-between items-center md:items-center gap-4 border-b border-white/5 pb-6">
                            <div className="w-full md:w-auto">
                                <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight leading-none mb-1">
                                    {activePlayer.name}
                                </h1>
                                {/* Category Text */}
                                {activePlayer.twitchCategory && (
                                    <div className="text-sm font-medium text-ice-400 italic mb-3">
                                        {activePlayer.twitchCategory}
                                    </div>
                                )}
                                
                                <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-2">
                                    <div className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                        <Trophy size={12} /> {rank} МЕСТО
                                    </div>
                                    <div className="bg-ice-500/10 text-ice-300 border border-ice-500/20 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                        <User size={12} /> Клетка {activePlayer.position}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* HP & Stats Grid */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            
                            {/* HP Bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400 tracking-widest">
                                        <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" /> Здоровье
                                    </div>
                                    <div className="font-mono text-xl font-bold">
                                        <span className="text-rose-500">{activePlayer.hp}</span>
                                        <span className="text-slate-600 mx-1">/</span>
                                        <span className="text-slate-400">{activePlayer.maxHp}</span>
                                    </div>
                                </div>
                                <div className="h-6 w-full bg-black/40 rounded-lg overflow-hidden border border-white/5 relative">
                                    <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,transparent_25%,#fff_25%,#fff_50%,transparent_50%,transparent_75%,#fff_75%,#fff_100%)] bg-[length:20px_20px]"></div>
                                    <div 
                                        className="h-full bg-gradient-to-r from-rose-600 via-rose-500 to-orange-500 transition-all duration-500 ease-out shadow-[0_0_15px_rgba(225,29,72,0.4)] relative"
                                        style={{ width: `${Math.max(0, Math.min(100, (activePlayer.hp / activePlayer.maxHp) * 100))}%` }}
                                    >
                                        <div className="absolute right-0 top-0 bottom-0 w-px bg-white/50 shadow-[0_0_10px_white]"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Buttons (Filters) */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { id: 'ALL', label: 'Всего игр', val: activePlayer.stats.gamesPlayed, icon: Gamepad2, color: 'text-ice-400', bg: 'bg-ice-500/10', border: 'border-ice-500/20' },
                                    { id: 'WINS', label: 'Пройдено', val: activePlayer.stats.wins, icon: Trophy, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                                    { id: 'DROPS', label: 'Дропы', val: activePlayer.stats.drops, icon: Ghost, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
                                    { id: 'REROLLS', label: 'Рероллы', val: activePlayer.stats.rerolls, icon: RefreshCw, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' }
                                ].map((stat) => (
                                     <button 
                                        key={stat.id}
                                        onClick={() => setFilterType(stat.id as FilterType)}
                                        className={`
                                            relative p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all duration-200
                                            ${filterType === stat.id 
                                                ? `${stat.bg} ${stat.border} shadow-[0_0_15px_rgba(0,0,0,0.3)] scale-[1.02] ring-1 ring-white/20` 
                                                : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.07] hover:border-white/10'
                                            }
                                        `}
                                     >
                                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1 truncate w-full">{stat.label}</div>
                                        <div className={`text-lg font-bold ${filterType === stat.id ? 'text-white' : 'text-slate-300'}`}>{stat.val}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* --- BOTTOM SPLIT SECTION: Inventory & Effects --- */}
                <div className="flex flex-col xl:flex-row gap-8 items-start pt-8 border-t border-white/5">
                    
                    {/* Left: Inventory - Responsive Grid */}
                    <div className="w-full xl:w-[23rem] flex-shrink-0">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                            <Package className="w-4 h-4 text-amber-400" /> Инвентарь
                        </h3>
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                            {activePlayer.inventory.length > 0 ? activePlayer.inventory.map(item => (
                                <SmartTooltip 
                                    key={item.id}
                                    className="aspect-square border border-white/10 rounded-xl hover:border-ice-400 hover:shadow-[0_0_15px_rgba(56,189,248,0.3)] bg-midnight-950 transition-all"
                                    content={
                                        <div className="text-center">
                                            <div className="font-bold text-ice-300 text-sm mb-1">{item.name}</div>
                                            <div className="text-xs text-slate-400 leading-snug">{item.description}</div>
                                        </div>
                                    }
                                >
                                    <div className="w-full h-full flex items-center justify-center text-2xl md:text-3xl cursor-help relative p-1">
                                        <GameIcon 
                                            glossaryId={item.glossaryId}
                                            alt={item.name}
                                            fallback={<span>{item.icon}</span>}
                                            className="w-full h-full object-contain drop-shadow-md"
                                        />
                                        {item.count > 1 && (
                                            <div className="absolute -top-2 -right-2 bg-ice-600 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-midnight-900 shadow-md z-10">
                                                {item.count}
                                            </div>
                                        )}
                                    </div>
                                </SmartTooltip>
                            )) : (
                                <div className="col-span-full py-6 text-center text-sm text-slate-600 italic border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                                    Пусто
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Effects - Takes remaining space */}
                    <div className="w-full flex-1">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                            <Sparkles className="w-4 h-4 text-emerald-400" /> Активные Эффекты
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {activePlayer.effects && activePlayer.effects.length > 0 ? activePlayer.effects.map(effect => (
                                <SmartTooltip 
                                    key={effect.id}
                                    className={`
                                        ${effectSizeClass} border flex items-center justify-center cursor-help transition-all hover:scale-105 p-1
                                        ${effect.isPositive 
                                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/10 hover:shadow-[0_0_10px_rgba(52,211,153,0.3)]' 
                                            : 'bg-rose-500/5 border-rose-500/20 text-rose-300 hover:bg-rose-500/10 hover:shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                                        }
                                    `}
                                    content={
                                        <div className="text-center">
                                            <div className={`font-bold text-xs mb-1 ${effect.isPositive ? 'text-emerald-300' : 'text-rose-300'}`}>{effect.name}</div>
                                            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                                                <Clock size={10} /> {effect.duration} ход(ов)
                                            </div>
                                        </div>
                                    }
                                >
                                    <GameIcon
                                        glossaryId={effect.glossaryId}
                                        alt={effect.name}
                                        fallback={getEffectIcon(effect.name, effectIconSize)}
                                        className="w-full h-full object-contain"
                                    />
                                    
                                    {/* Duration Badge */}
                                    <div className="absolute -bottom-1.5 -right-1.5 bg-midnight-900 text-slate-300 text-[9px] font-bold h-4 min-w-[16px] px-1 flex items-center justify-center rounded border border-white/10 shadow-sm font-mono z-10">
                                        {effect.duration}
                                    </div>
                                </SmartTooltip>
                            )) : (
                                <div className="w-full py-6 flex flex-col items-center justify-center text-center text-xs text-slate-600 italic border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                                    Нет эффектов
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* === BLOCK 2: HISTORY (Full Width) === */}
            <div className="bg-midnight-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-4 md:p-6 min-h-[400px]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 border-b border-white/5 pb-4 gap-2">
                    <div>
                        <h3 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                            История Игр
                        </h3>
                        <div className="text-xs text-slate-500 mt-1">
                                {filterType !== 'ALL' && <span className="text-ice-400 font-bold">Фильтр: {filterType}</span>}
                        </div>
                    </div>
                    <div className="text-xs text-slate-600 font-mono">
                        Записей: {filteredHistory.length}
                    </div>
                </div>

                <div className="space-y-4">
                        {filteredHistory.length > 0 ? (
                        filteredHistory.map((h, i) => {
                            const r = h.result.toLowerCase();
                            const isWin = r.includes('win') || r.includes('pobed') || r.includes('побед') || r.includes('1') || r.includes('пройдено');
                            const isDrop = r.includes('drop') || r.includes('дроп') || r.includes('dead') || r.includes('выбыл');
                            const isReroll = r.includes('reroll') || r.includes('реролл');
                            
                            return (
                                <div key={i} className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-6 rounded-2xl bg-midnight-950/50 hover:bg-midnight-800/60 border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden">
                                    
                                    {/* Status Line */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isWin ? 'bg-emerald-500' : isDrop ? 'bg-rose-500' : isReroll ? 'bg-violet-500' : 'bg-slate-700'}`}></div>

                                    {/* Game Icon - Mobile: Hidden/Smaller? Keep it but adjust margin */}
                                    <div className="w-16 h-20 sm:w-20 sm:h-24 flex-shrink-0 bg-gradient-to-br from-midnight-800 to-midnight-950 rounded-lg border border-white/5 flex items-center justify-center text-slate-600 group-hover:text-ice-400 transition-colors relative z-10 ml-2">
                                        <ImageIcon className="w-8 h-8 opacity-40" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 flex flex-col relative z-10">
                                        
                                        {/* Header Row with Steam Button */}
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-2">
                                            <div className="text-lg sm:text-xl font-bold text-slate-100 group-hover:text-white transition-colors break-words leading-tight max-w-full">
                                                {h.game}
                                            </div>
                                            
                                            {/* Steam Button */}
                                            <a 
                                                href={`https://store.steampowered.com/search/?term=${encodeURIComponent(h.game)}`} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1b2838]/80 hover:bg-[#1b2838] hover:text-[#66c0f4] border border-white/10 hover:border-[#66c0f4]/50 transition-all text-[11px] font-bold text-slate-400 group/steam"
                                                title="Найти в Steam"
                                            >
                                                <Gamepad2 size={12} className="group-hover/steam:text-white" />
                                                <span className="hidden sm:inline">Store</span>
                                                <ExternalLink size={10} className="opacity-50" />
                                            </a>
                                        </div>
                                        
                                        {/* Meta Row */}
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3 text-sm">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${
                                                isWin ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                isDrop ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                isReroll ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' :
                                                'bg-slate-700/30 text-slate-400 border-white/5'
                                            }`}>
                                                {h.result}
                                            </span>
                                            <span className="text-slate-600 hidden sm:inline">|</span>
                                            {h.time && h.time !== '-' && (
                                                <>
                                                    <span className="text-slate-400 font-mono text-xs">{h.time}</span>
                                                    <span className="text-slate-600 hidden sm:inline">|</span>
                                                </>
                                            )}
                                            <span className="flex items-center gap-1.5 text-slate-500 font-mono">
                                                <Calendar className="w-3.5 h-3.5" /> День {h.day}
                                            </span>

                                            {/* Score Display */}
                                            {h.score !== undefined && (
                                                <>
                                                    <span className="text-slate-600 hidden sm:inline">|</span>
                                                    <span className="flex items-center gap-1.5 font-mono text-xs font-bold">
                                                        <Star size={12} className="text-slate-500" />
                                                        <span className={getScoreColor(h.score)}>{h.score}/10</span>
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        {/* Comment */}
                                        {h.comment && (
                                            <div className="text-sm sm:text-base text-slate-400 italic font-light leading-relaxed mt-1">
                                                "{h.comment}"
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                        ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500 italic">
                            <Ghost className="w-10 h-10 mb-3 opacity-20" />
                            <span>
                                {filterType === 'ALL' ? 'История пуста' : 'Нет записей'}
                            </span>
                            {filterType !== 'ALL' && (
                                <button 
                                    onClick={() => setFilterType('ALL')}
                                    className="mt-2 text-xs text-ice-400 hover:text-ice-300 underline"
                                >
                                    Сбросить
                                </button>
                            )}
                        </div>
                        )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};