import { Chess } from 'chess.js';

console.log("--- Test 3: Undo on new instance from PGN ---");
const game1 = new Chess();
game1.move('e4');
const pgn = game1.pgn();
console.log("PGN after e4:", pgn);

const game2 = new Chess();
game2.loadPgn(pgn);
console.log("New game created from PGN.");
console.log("History length of new game:", game2.history().length);
const undo = game2.undo();
console.log("Undo result on new game:", undo ? "Success" : "Failed");
console.log("History length after undo:", game2.history().length);
