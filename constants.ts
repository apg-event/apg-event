import { BoardCell, CellType, Player } from './types';

export const GRID_SIZE = 100;

// Configuration for Snakes and Ladders
const JUMPS = [
  // Ladders (Forward) - Ice Lifts / Wind Gusts
  { start: 1, end: 6, type: 'ladder' },
  { start: 7, end: 14, type: 'ladder' },
  { start: 27, end: 33, type: 'ladder' },
  { start: 39, end: 59, type: 'ladder' },
  { start: 47, end: 55, type: 'ladder' },
  { start: 76, end: 86, type: 'ladder' },
  
  // Snakes (Backward) - Ice Slides / Crevasses
  { start: 19, end: 2, type: 'snake' },
  { start: 35, end: 25, type: 'snake' },
  { start: 36, end: 26, type: 'snake' },
  { start: 57, end: 43, type: 'snake' },
  { start: 65, end: 63, type: 'snake' },
  { start: 66, end: 53, type: 'snake' },
  { start: 71, end: 51, type: 'snake' },
  { start: 83, end: 78, type: 'snake' },
  { start: 99, end: 93, type: 'snake' },
];

// Helper: Generate a winding path (snake like) for 100 tiles
const generatePathCoordinates = (total: number) => {
  const coords = [];
  const rows = 10;
  const cols = 10;
  
  for (let i = 0; i < total; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    
    // Snake pattern: even rows go right, odd rows go left
    const effectiveCol = row % 2 === 0 ? col : (cols - 1 - col);
    
    // X and Y are percentages (0-100)
    // Adjusting margins to fit the board nicely within container
    const x = (effectiveCol / (cols - 1)) * 90 + 5; 
    const y = 100 - ((row / (rows - 1)) * 90 + 5); 
    
    coords.push({ x, y });
  }
  return coords;
};

export const getSectorInfo = (id: number) => {
  if (id === 100) return { 
    text: "Игры от 10 до 30 часов (ФИНАЛ)", 
    color: "#beaa75", // Gold
  };
  if (id >= 81) return { 
    text: "Игры от 8 до 14 часов", 
    color: "#ab897f", // Reddish Brown
  };
  if (id >= 61) return { 
    text: "Игры от 5 до 9 часов", 
    color: "#b47f9d", // Pinkish
  };
  if (id >= 41) return { 
    text: "Игры от 4 до 7 часов", 
    color: "#9b85be", // Purple
  };
  if (id >= 21) return { 
    text: "Игры от 2 до 5 часов", 
    color: "#8390c5", // Indigo
  };
  // 1-20
  return { 
    text: "Игры от 1 до 3 часов", 
    color: "#639ecf", // Blue
  };
};

// Mock Board Generation with Coordinates
export const generateBoard = (): BoardCell[] => {
  const cells: BoardCell[] = [];
  const coords = generatePathCoordinates(GRID_SIZE);

  for (let i = 1; i <= GRID_SIZE; i++) {
    const sectorInfo = getSectorInfo(i);
    const jump = JUMPS.find(j => j.start === i);
    
    let type = CellType.NORMAL;
    let jumpTargetId = undefined;

    if (i === 1) type = CellType.START;
    else if (i === 100) type = CellType.FINISH;
    else if (jump) {
      type = jump.type === 'ladder' ? CellType.LADDER_START : CellType.SNAKE_START;
      jumpTargetId = jump.end;
    }

    cells.push({
      id: i,
      type,
      coordinates: coords[i-1],
      description: sectorInfo.text,
      sectorName: '', // Names removed
      sectorColor: sectorInfo.color,
      jumpTargetId: jumpTargetId
    });
  }
  return cells;
};

// Start with empty players so we only show real data from the server
export const INITIAL_PLAYERS: Player[] = [];

// Legacy helper
export const getCellColor = (type: CellType): string => {
  return '';
};