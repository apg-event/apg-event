import React from 'react';
import { BoardCell, CellType } from '../../types';

interface GameCellProps {
  cell: BoardCell;
}

export const GameCell: React.FC<GameCellProps> = ({ cell }) => {
  const isSpecial = cell.type !== CellType.NORMAL;
  
  // Custom styling for the node
  // Using hex color with opacity to make it less bright/intrusive
  const nodeStyle = {
    backgroundColor: `${cell.sectorColor}80`, // 50% opacity (approx, 80 hex is 128/255 ~ 50%)
    boxShadow: `0 0 12px ${cell.sectorColor}40`,
    borderColor: 'rgba(255,255,255,0.4)'
  };

  // Logic for Tooltip positioning to avoid overflow at the top
  const isTopRows = cell.id > 90;
  const tooltipPositionClass = isTopRows 
    ? 'top-full mt-3' // Show below the cell
    : 'bottom-full mb-3'; // Show above the cell (default)

  // Arrow pointing logic
  const tooltipArrowClass = isTopRows
    ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-full border-b-[8px] border-b-midnight-950 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent'
    : 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-t-[8px] border-t-midnight-950 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent';

  return (
    <div className="group relative">
        {/* The Node Square - Size Increased (w-12 h-12) */}
        <div 
          className={`
            w-12 h-12 rounded-xl transition-all duration-300
            flex items-center justify-center
            border-2
            group-hover:scale-110 group-hover:z-20 group-hover:border-white
            group-hover:shadow-[0_0_25px_white]
            cursor-help backdrop-blur-md shadow-lg
          `}
          style={nodeStyle}
        >
           {/* Inner effects for special cells */}
           {cell.type === CellType.LADDER_START && (
              <div className="absolute inset-0 border-2 border-ice-300 rounded-xl animate-pulse opacity-60"></div>
           )}
           {cell.type === CellType.SNAKE_START && (
              <div className="absolute inset-0 border-2 border-red-500 rounded-xl animate-pulse opacity-60"></div>
           )}

           {/* Number Label (Inside) - Increased Font Size */}
           <span className="text-sm font-extrabold font-mono text-slate-100 drop-shadow-md">
              {cell.id}
           </span>
        </div>

        {/* Frosty Tooltip */}
        <div className={`absolute left-1/2 -translate-x-1/2 w-48 bg-midnight-950/90 backdrop-blur-2xl text-white rounded-xl border border-white/20 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-[0_10px_40px_rgba(0,0,0,0.8)] p-4 ${tooltipPositionClass}`}>
            
            {/* Clean Header: Just the big number */}
            <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2">
               <span className="text-2xl font-black font-mono text-ice-300 leading-none">{cell.id}</span>
            </div>

            {/* Content */}
            <div className="text-slate-200 leading-relaxed font-light text-xs relative z-10">
               {cell.description}
            </div>
            
            {cell.jumpTargetId && (
               <div className={`mt-2 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${cell.type === CellType.LADDER_START ? 'text-ice-400' : 'text-rose-400'}`}>
                  {cell.type === CellType.LADDER_START ? `▲ Подъем до ${cell.jumpTargetId}` : `▼ Спуск до ${cell.jumpTargetId}`}
               </div>
            )}
            
            {/* Tooltip Arrow */}
            <div className={`absolute w-0 h-0 ${tooltipArrowClass}`}></div>
        </div>
    </div>
  );
};