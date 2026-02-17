import React, { useState, useEffect } from 'react';
import { Player } from '../../types';
import { PlayerAvatar } from './PlayerAvatar';
import { Trophy, X, Crown, Star } from 'lucide-react';
import { getTwitchUrl } from '../../services/twitchService';

interface EventEndBannerProps {
  players: Player[];
  onClose: () => void;
}

export const EventEndBanner: React.FC<EventEndBannerProps> = ({ players, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Sort players by position (descending)
  const sortedPlayers = [...players].sort((a, b) => b.position - a.position);
  const top3 = sortedPlayers.slice(0, 3);
  
  // Reorder for Podium: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  const getRankStyle = (player: Player) => {
    const rank = sortedPlayers.indexOf(player) + 1;
    if (rank === 1) return {
      border: 'border-yellow-400',
      shadow: 'shadow-[0_0_30px_rgba(250,204,21,0.4)]',
      text: 'text-yellow-400',
      bg: 'bg-gradient-to-b from-yellow-500/20 to-yellow-900/20',
      icon: <Crown className="w-8 h-8 text-yellow-400 mb-2 animate-bounce" fill="currentColor" />,
      height: 'h-64 md:h-80', 
      zIndex: 'z-20',
      rankText: 'text-5xl md:text-6xl'
    };
    if (rank === 2) return {
      border: 'border-slate-300',
      shadow: 'shadow-[0_0_20px_rgba(203,213,225,0.3)]',
      text: 'text-slate-300',
      bg: 'bg-gradient-to-b from-slate-400/10 to-slate-800/20',
      icon: <Star className="w-6 h-6 text-slate-300 mb-2" />,
      height: 'h-52 md:h-64',
      zIndex: 'z-10',
      rankText: 'text-4xl md:text-5xl'
    };
    return { // 3rd
      border: 'border-orange-700',
      shadow: 'shadow-[0_0_20px_rgba(194,65,12,0.3)]',
      text: 'text-orange-400',
      bg: 'bg-gradient-to-b from-orange-700/10 to-orange-900/20',
      icon: <Star className="w-5 h-5 text-orange-600 mb-2" />,
      height: 'h-44 md:h-52',
      zIndex: 'z-0',
      rankText: 'text-3xl md:text-4xl'
    };
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center px-4 transition-all duration-700 ${isVisible ? 'opacity-100 backdrop-blur-sm bg-black/40' : 'opacity-0 pointer-events-none'}`}>
      
      <div className={`relative max-w-4xl w-full bg-midnight-950/90 border border-ice-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center p-6 md:p-10 transition-all duration-700 transform ${isVisible ? 'translate-y-0 scale-100' : 'translate-y-20 scale-95'}`}>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-500 hover:text-white hover:bg-white/10 transition-colors z-50"
        >
          <X size={24} />
        </button>

        {/* Ambient Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[50%] bg-ice-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-aurora-purple/10 blur-[80px] rounded-full pointer-events-none"></div>

        {/* Header - Increased margin-bottom to avoid overlap with avatars */}
        <div className="text-center mb-20 md:mb-28 relative z-10">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-yellow-400 animate-pulse" />
            <span className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">Финал Сезона</span>
            <Trophy className="w-8 h-8 text-yellow-400 animate-pulse" />
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-ice-200 to-ice-400 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            Ивент Завершен
          </h2>
        </div>

        {/* Podium */}
        <div className="flex items-end justify-center gap-4 md:gap-8 w-full mb-6 relative z-10">
          {podiumOrder.map((player) => {
             const style = getRankStyle(player);
             const rank = sortedPlayers.indexOf(player) + 1;
             const twitchUrl = getTwitchUrl(player.name);
             
             return (
               <div 
                 key={player.id}
                 className={`relative flex flex-col items-center justify-end w-1/3 max-w-[200px] rounded-t-2xl border-t border-x ${style.border} ${style.bg} ${style.height} ${style.zIndex} transition-all duration-500 hover:brightness-110 shadow-xl`}
               >
                  {/* Avatar Circle floating above */}
                  <div className={`absolute -top-12 md:-top-16 w-24 h-24 md:w-32 md:h-32 rounded-full border-4 bg-midnight-900 ${style.border} ${style.shadow} overflow-hidden z-20`}>
                     <PlayerAvatar src={player.avatarUrl} name={player.name} className="w-full h-full object-cover" />
                  </div>
                  
                  {/* Rank Icon */}
                  <div className="mb-auto pt-14 md:pt-20 flex flex-col items-center">
                    {style.icon}
                    <div className={`font-black ${style.text} ${style.rankText}`}>{rank}</div>
                  </div>

                  {/* Player Info */}
                  <div className="pb-4 md:pb-6 text-center w-full px-2 flex flex-col items-center">
                     {twitchUrl ? (
                         <a 
                            href={twitchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white hover:text-ice-300 font-bold text-sm md:text-lg truncate transition-colors"
                         >
                            {player.name}
                         </a>
                     ) : (
                        <div className="text-white font-bold text-sm md:text-lg truncate">{player.name}</div>
                     )}
                     
                     <div className={`text-[10px] md:text-xs font-mono uppercase tracking-wider ${style.text} opacity-80 mt-1`}>
                        Клетка {player.position}
                     </div>
                  </div>
               </div>
             );
          })}
        </div>

        {/* Footer Text */}
        <p className="text-slate-400 text-xs md:text-sm text-center max-w-xl leading-relaxed relative z-10">
          Спасибо всем участникам и зрителям за этот невероятный путь! <br />
          Вы можете закрыть это окно и изучить итоговое положение игроков на карте.
        </p>

      </div>
    </div>
  );
};