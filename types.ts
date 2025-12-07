export enum Difficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  GRANDMASTER = 'grandmaster'
}

export interface AIMoveResponse {
  bestMove: string;
  reasoning: string;
}

export interface GameState {
  fen: string;
  isCheckmate: boolean;
  isDraw: boolean;
  turn: 'w' | 'b';
  history: string[];
}
