import { Chess } from 'chess.js';

console.log("--- Verification: Simulating ChessGame.tsx logic ---");

let game = new Chess();
console.log("Game started.");

// 1. User moves
console.log("User moves e4.");
const gameAfterUserMove = new Chess();
gameAfterUserMove.loadPgn(game.pgn());
gameAfterUserMove.move('e4');
game = gameAfterUserMove;

// 2. AI moves
console.log("AI moves e5.");
const gameAfterAiMove = new Chess();
gameAfterAiMove.loadPgn(game.pgn());
gameAfterAiMove.move('e5');
game = gameAfterAiMove;

console.log("Current PGN:", game.pgn());
console.log("Current History Length:", game.history().length);

// 3. Undo
console.log("User clicks Undo (Wait).");
const gameUndo = new Chess();
gameUndo.loadPgn(game.pgn());

const undo1 = gameUndo.undo(); // Undo AI
console.log("Undo AI move:", undo1 ? "Success" : "Failed");

const undo2 = gameUndo.undo(); // Undo User
console.log("Undo User move:", undo2 ? "Success" : "Failed");

game = gameUndo;

console.log("Final History Length:", game.history().length);
console.log("Final PGN:", game.pgn());

if (game.history().length === 0) {
    console.log("VERIFICATION PASSED: History successfully reverted to start.");
} else {
    console.error("VERIFICATION FAILED: History is not empty.");
}
