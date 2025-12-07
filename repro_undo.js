import { Chess } from 'chess.js';

console.log("--- Test 1: Undo on original instance ---");
const game1 = new Chess();
game1.move('e4');
console.log("After move e4, history length:", game1.history().length);
const undo1 = game1.undo();
console.log("Undo result:", undo1 ? "Success" : "Failed");
console.log("After undo, history length:", game1.history().length);

console.log("\n--- Test 2: Undo on new instance from FEN ---");
const game2 = new Chess();
game2.move('e4');
const fen = game2.fen();
console.log("FEN after e4:", fen);

const game3 = new Chess(fen);
console.log("New game created from FEN.");
console.log("History length of new game:", game3.history().length);
const undo2 = game3.undo();
console.log("Undo result on new game:", undo2 ? "Success" : "Failed");
