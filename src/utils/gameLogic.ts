import { TileValue, TileState } from '../types';

// Standard Voltorb Flip board configurations (Classic rules)
const LEVEL_CONFIGS = [
  { voltorbs: 5, twos: 3, threes: 1 }, // Level 1: Very easy
  { voltorbs: 5, twos: 4, threes: 3 }, // Level 2: More multipliers, same low danger
  { voltorbs: 6, twos: 5, threes: 4 }, // Level 3: Slight danger increase
  { voltorbs: 7, twos: 5, threes: 6 }, // Level 4
  { voltorbs: 10, twos: 6, threes: 7 }, // Level 5
  { voltorbs: 10, twos: 7, threes: 10 }, // Level 6
  { voltorbs: 11, twos: 10, threes: 10 }, // Level 7
  { voltorbs: 13, twos: 10, threes: 10 }, // Level 8
];

export function generateBoard(level: number): TileState[][] {
  const config = LEVEL_CONFIGS[Math.min(level - 1, LEVEL_CONFIGS.length - 1)];
  const totalTiles = 25;
  
  let grid: TileState[][] = [];
  let attempts = 0;
  const maxAttempts = 2000;

  while (attempts < maxAttempts) {
    attempts++;
    const board: TileValue[] = Array(25).fill(1);

    // Place Voltorbs
    let placed = 0;
    while (placed < config.voltorbs) {
      const idx = Math.floor(Math.random() * 25);
      if (board[idx] === 1) {
        board[idx] = 0;
        placed++;
      }
    }

    // Place 2s
    placed = 0;
    while (placed < config.twos) {
      const idx = Math.floor(Math.random() * 25);
      if (board[idx] === 1) {
        board[idx] = 2;
        placed++;
      }
    }

    // Place 3s
    placed = 0;
    while (placed < config.threes) {
      const idx = Math.floor(Math.random() * 25);
      if (board[idx] === 1) {
        board[idx] = 3;
        placed++;
      }
    }

    // Convert to 2D array of TileState
    grid = [];
    for (let i = 0; i < 5; i++) {
      const row: TileState[] = [];
      for (let j = 0; j < 5; j++) {
        row.push({
          value: board[i * 5 + j],
          isFlipped: false,
          notes: new Set(),
        });
      }
      grid.push(row);
    }

    // Check conditions for early levels
    if (level <= 4) {
      let safeRows = 0;
      let safeCols = 0;
      let hasAllOnesLine = false;
      let hasHighValueSafeLine = false;

      // Check rows
      for (let r = 0; r < 5; r++) {
        const rowValues = grid[r].map(t => t.value);
        const voltorbCount = rowValues.filter(v => v === 0).length;
        if (voltorbCount === 0) {
          safeRows++;
          const sum = rowValues.reduce((a, b) => a + b, 0);
          if (sum > 5) hasHighValueSafeLine = true;
        }
        const nums = rowValues.filter(v => v !== 0);
        if (nums.length > 0 && nums.every(v => v === 1)) hasAllOnesLine = true;
      }

      // Check cols
      for (let c = 0; c < 5; c++) {
        const colValues = [0, 1, 2, 3, 4].map(r => grid[r][c].value);
        const voltorbCount = colValues.filter(v => v === 0).length;
        if (voltorbCount === 0) {
          safeCols++;
          const sum = colValues.reduce((a, b) => a + b, 0);
          if (sum > 5) hasHighValueSafeLine = true;
        }
        const nums = colValues.filter(v => v !== 0);
        if (nums.length > 0 && nums.every(v => v === 1)) hasAllOnesLine = true;
      }

      const totalSafeLines = safeRows + safeCols;

      if (level === 1) {
        // Level 1: At least 3 safe lines AND at least one high value safe line
        if (totalSafeLines >= 3 && hasHighValueSafeLine) break;
      } else if (level === 2) {
        // Level 2: At least 2 safe lines AND at least one safe row/col
        if (totalSafeLines >= 2 && (safeRows >= 1 || safeCols >= 1)) break;
      } else if (level >= 3 && level <= 4) {
        // Level 3-4: At least 1 safe line AND has an 'all ones' line to help narrow down
        if (totalSafeLines >= 1 && hasAllOnesLine) break;
      }
    } else {
      // Level 5+: No special constraints, just break
      break;
    }
  }

  return grid;
}

export function getRowInfo(board: TileState[][], rowIndex: number) {
  const row = board[rowIndex];
  return {
    sum: row.reduce((acc, tile) => acc + tile.value, 0),
    voltorbs: row.filter(tile => tile.value === 0).length,
  };
}

export function getColInfo(board: TileState[][], colIndex: number) {
  let sum = 0;
  let voltorbs = 0;
  if (!board || board.length === 0) return { sum, voltorbs };

  for (let i = 0; i < 5; i++) {
    if (board[i] && board[i][colIndex]) {
      sum += board[i][colIndex].value;
      if (board[i][colIndex].value === 0) voltorbs++;
    }
  }
  return { sum, voltorbs };
}
