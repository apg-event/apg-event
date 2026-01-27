import React from 'react';
import { Player } from '../../types';

interface PlayerTokenProps {
  player: Player;
  isStacked: boolean;
  stackIndex: number;
}

export const PlayerToken: React.FC<PlayerTokenProps> = ({ player }) => {
  return (
    <div className="relative group cursor-pointer z-50 flex flex-col items-center justify-center">
      
      {/* Name Tag (Always visible, moved up, larger font) */}
      <div 
        className="mb-2 bg-midnight-950/80 backdrop-blur-md border-2 text-white text-sm font-bold px-4 py-1.5 rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.5)] transition-transform duration-200 transform group-hover:scale-110 whitespace-nowrap z-40"
        style={{ borderColor: player.color }}
      >
        {player.name}
      </div>

      {/* Avatar Container - Increased size from w-10 (40px) to w-32 (128px) for 3x size & quality */}
      <div 
        className="w-32 h-32 rounded-full border-[6px] bg-midnight-950 flex items-center justify-center overflow-hidden transition-transform duration-300 transform group-hover:scale-110 relative z-30"
        style={{ 
            borderColor: player.color, 
            boxShadow: `0 0 30px ${player.color}60, inset 0 0 20px rgba(0,0,0,0.5)` 
        }}
      >
        <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover" />
        
        {/* Frost Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-ice-300/20 to-transparent pointer-events-none"></div>
      </div>
      
      {/* Ripple Effect for Active Player */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full animate-ping opacity-20 pointer-events-none" style={{ backgroundColor: player.color }}></div>
    </div>
  );
};