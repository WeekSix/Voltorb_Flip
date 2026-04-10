export type TileValue = 0 | 1 | 2 | 3; // 0 is Voltorb

export interface TileState {
  value: TileValue;
  isFlipped: boolean;
  notes: Set<TileValue>;
}

export interface GameState {
  level: number;
  score: number;
  totalScore: number;
  board: TileState[][];
  isGameOver: boolean;
  isWin: boolean;
  isMemoMode: boolean;
}

export interface RowColInfo {
  sum: number;
  voltorbs: number;
}
