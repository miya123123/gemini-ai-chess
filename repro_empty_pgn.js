import { Chess } from 'chess.js';

console.log("--- Test 4: Empty PGN ---");
const game1 = new Chess();
const pgn = game1.pgn();
console.log("Initial PGN:", pgn);

try {
    const game2 = new Chess();
    game2.loadPgn(pgn);
    console.log("Loaded initial PGN successfully.");
} catch (e) {
    console.error("Failed to load initial PGN:", e.message);
}
