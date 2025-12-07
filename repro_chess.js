import { Chess } from 'chess.js';

const game = new Chess();
console.log("Initial FEN:", game.fen());

const moves = game.moves({ square: 'e2', verbose: true });
console.log("Moves from e2:", JSON.stringify(moves, null, 2));

const found = moves.find(m => m.to === 'e4');
console.log("Found move to e4:", found);
