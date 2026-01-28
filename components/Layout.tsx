import React from 'react';
import { Map, Book, Users, Menu, X, Snowflake, Trophy, Heart, Wind } from 'lucide-react';
import { Player } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  players: Player[]; // For leaderboard in sidebar
  onPlayerFocus: (playerId: string) => void; // New prop for camera focus
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, players, onPlayerFocus }) => {
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);

  const navItems = [
    // { id: 'map', label: 'Карта', icon: Map },
    // { id: 'profiles', label: 'Участники', icon: Users },
    { id: 'glossary', label: 'Правила', icon: Book },
  ];

  // Sort ALL players for leaderboard
  const sortedPlayers = [...players].sort((a, b) => b.position - a.position);

  return (
    <div className="flex h-screen bg-midnight-950 text-slate-100 font-sans overflow-hidden relative selection:bg-ice-500/30">
      
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Top Gradient (Aurora) */}
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-aurora-purple/10 blur-[120px] rounded-full mix-blend-screen opacity-60"></div>
          <div className="absolute -top-[20%] right-[10%] w-[40%] h-[50%] bg-aurora-green/10 blur-[100px] rounded-full mix-blend-screen opacity-50"></div>
          
          {/* Bottom Gradient (Ice) */}
          <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[40%] bg-ice-600/10 blur-[120px] rounded-full opacity-40"></div>
          
          {/* 
            REPLACED NOISE WITH DOT GRID 
            Clean, technical look using CSS radial gradients 
          */}
          <div className="absolute inset-0 opacity-[0.15]" 
               style={{ 
                   backgroundImage: `radial-gradient(rgba(56, 189, 248, 0.3) 1px, transparent 1px)`, 
                   backgroundSize: '32px 32px' 
               }}>
          </div>
      </div>

      {/* Mobile Header (Fixed Height: h-16 / 64px) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 z-50 bg-midnight-900/90 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-4 shadow-lg">
        <div className="flex items-center gap-2 font-bold text-lg text-ice-300">
           <Snowflake className="text-ice-400 animate-spin-slow w-6 h-6" /> 
           <span className="tracking-wider">APG <span className="text-white">EVENT</span></span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed md:relative z-40 w-full md:w-72 flex flex-col transition-all duration-300 flex-shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        bg-midnight-900/95 md:bg-midnight-900/40 backdrop-blur-xl border-r border-white/5 shadow-2xl
        
        /* Mobile specific positioning: Top-16 to sit below header, Height calc to fill rest */
        top-16 md:top-0 h-[calc(100vh-4rem)] md:h-full
      `}>
        {/* Logo (Desktop only) */}
        <div className="p-6 hidden md:flex items-center gap-3 font-bold text-2xl tracking-wider flex-shrink-0 text-white">
           <div className="relative w-10 h-10 flex items-center justify-center">
             <div className="absolute inset-0 bg-ice-500 blur-lg opacity-40 rounded-full animate-pulse-slow"></div>
             <Snowflake className="relative text-ice-300 w-8 h-8" />
           </div>
           <span className="text-transparent bg-clip-text bg-gradient-to-r from-ice-300 to-white">APG EVENT</span>
        </div>

        {/* Nav (Fixed at top under logo) */}
        <nav className="px-4 pb-4 pt-4 md:pt-0 space-y-2 flex-shrink-0">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden
                ${activeTab === item.id 
                  ? 'text-white shadow-[0_0_20px_rgba(56,189,248,0.15)] border border-ice-400/20' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                }
              `}
            >
              {activeTab === item.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-ice-500/20 to-transparent opacity-100"></div>
              )}
              <item.icon className={`w-5 h-5 relative z-10 ${activeTab === item.id ? 'text-ice-400' : 'group-hover:text-ice-300 transition-colors'}`} />
              <span className="font-medium relative z-10 tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Leaderboard (Fills remaining space and scrolls) */}
        { false && (
        <div className="flex-1 flex flex-col min-h-0 border-t border-white/5 bg-midnight-950/30">
          <div className="p-5 pb-3 flex justify-between items-center">
            {/* GOLDEN HEADER */}
            <h3 className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 uppercase tracking-[0.15em] flex items-center gap-2 drop-shadow-sm">
              <Trophy className="w-4 h-4 text-yellow-400" /> Топ Лидеров
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 custom-scrollbar">
            {sortedPlayers.length === 0 && (
                <div className="flex flex-col items-center justify-center h-20 text-xs text-slate-600 italic">
                    <Wind className="w-4 h-4 mb-1 opacity-50" />
                    Ожидание...
                </div>
            )}
            {sortedPlayers.map((p, idx) => (
              <div 
                key={p.id} 
                onClick={() => {
                    onPlayerFocus(p.id);
                    setSidebarOpen(false); // Auto-close on mobile selection
                }}
                className="relative bg-white/5 hover:bg-white/10 border border-white/5 p-3 rounded-xl flex items-center gap-4 group transition-colors cursor-pointer hover:border-ice-500/30"
              >
                 
                 {/* Rank & Avatar */}
                 <div className="relative w-10 h-10 flex-shrink-0">
                    <img src={p.avatarUrl} className="w-full h-full rounded-full border border-white/10 object-cover shadow-lg" alt={p.name} />
                    <div className={`
                        absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border border-white/10 shadow-md
                        ${idx === 0 
                            ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]' 
                            : 'bg-midnight-800 text-slate-400 border-white/20'}
                    `}>
                      {idx + 1}
                    </div>
                 </div>

                 {/* Info */}
                 <div className="flex-1 overflow-hidden min-w-0">
                    <div className="flex flex-col mb-1.5 ml-1">
                        <div className="flex items-center gap-2">
                             {/* LIVE Indicator - REAL DATA */}
                             {p.isLive && (
                                <div className="relative flex h-2 w-2 flex-shrink-0" title="В эфире">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                                </div>
                            )}
                            <div className="text-sm font-bold truncate text-slate-100 group-hover:text-ice-200 transition-colors">{p.name}</div>
                        </div>
                        {/* Twitch Category */}
                        {p.twitchCategory && (
                             <div className="text-[10px] text-slate-400 italic truncate pr-2">
                                 {p.twitchCategory}
                             </div>
                        )}
                    </div>
                    
                    {/* HP Bar */}
                    <div className="flex items-center gap-2">
                        <Heart className="w-3 h-3 text-rose-500 fill-rose-500/20" />
                        <div className="flex-1 h-1.5 bg-midnight-950 rounded-full overflow-hidden border border-white/5">
                            <div 
                                className="h-full bg-gradient-to-r from-red-500 to-rose-400 rounded-full" 
                                style={{ width: `${Math.min(100, (p.hp / p.maxHp) * 100)}%` }}
                            ></div>
                        </div>
                    </div>
                 </div>

                 {/* Position Badge */}
                 <div className="text-xs font-mono font-bold text-ice-300 bg-ice-500/10 px-2 py-1 rounded border border-ice-500/10 whitespace-nowrap">
                    {p.position}
                 </div>
              </div>
            ))}
          </div>
        </div> )}
      </aside>

      {/* Main Content Wrapper */}
      {/* Added pt-16 on mobile to account for fixed header */}
      <main className="flex-1 relative overflow-hidden flex flex-col md:flex-row z-10 pt-16 md:pt-0">
         {children}
      </main>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden top-16" onClick={() => setSidebarOpen(false)}></div>
      )}
    </div>
  );
};