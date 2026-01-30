/**
 * ELO Rating Calculation Service
 * 
 * Implements standard ELO rating system for chess benchmark analysis.
 * K-factor: 32 (standard for competitive games)
 * Initial rating: 1500
 */

// Interface for benchmark result (matches ChessGame.tsx BenchmarkResult)
export interface BenchmarkResult {
    gameNumber: number;
    winner: 'white' | 'black' | 'draw';
    whitePlayer: string;
    blackPlayer: string;
    moves: number;
    fen: string;
    pgn: string;
    timestamp: string;
}

// Player ELO rating with statistics
export interface EloRating {
    playerName: string;
    rating: number;
    gamesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
}

// Head-to-head matchup statistics
export interface HeadToHeadStats {
    player1: string;
    player2: string;
    player1Wins: number;
    player2Wins: number;
    draws: number;
    totalGames: number;
}

// Overall benchmark statistics
export interface BenchmarkStatistics {
    totalGames: number;
    avgMoves: number;
    playerRatings: EloRating[];
    headToHead: HeadToHeadStats[];
    mostDominantPlayer: string | null;
}

// Constants for ELO calculation
const K_FACTOR = 32;
const INITIAL_RATING = 1500;

/**
 * Calculate expected score for player A against player B
 * Formula: E_A = 1 / (1 + 10^((R_B - R_A) / 400))
 */
export function calculateExpectedScore(ratingA: number, ratingB: number): number {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculate new ELO rating after a game
 * Formula: R'_A = R_A + K * (S_A - E_A)
 * 
 * @param currentRating Current rating of the player
 * @param opponentRating Rating of the opponent
 * @param score Actual score (1 = win, 0.5 = draw, 0 = loss)
 * @returns New rating
 */
export function calculateElo(
    currentRating: number,
    opponentRating: number,
    score: number
): number {
    const expectedScore = calculateExpectedScore(currentRating, opponentRating);
    return Math.round(currentRating + K_FACTOR * (score - expectedScore));
}

/**
 * Analyze benchmark results and calculate ELO ratings for all players
 */
export function analyzeBenchmarkResults(results: BenchmarkResult[]): BenchmarkStatistics {
    if (results.length === 0) {
        return {
            totalGames: 0,
            avgMoves: 0,
            playerRatings: [],
            headToHead: [],
            mostDominantPlayer: null,
        };
    }

    // Initialize player ratings map
    const playerRatings: Map<string, EloRating> = new Map();

    // Initialize head-to-head stats map (keyed by sorted player names)
    const headToHeadMap: Map<string, HeadToHeadStats> = new Map();

    // Helper function to get or create player rating
    const getOrCreatePlayer = (name: string): EloRating => {
        if (!playerRatings.has(name)) {
            playerRatings.set(name, {
                playerName: name,
                rating: INITIAL_RATING,
                gamesPlayed: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                winRate: 0,
            });
        }
        return playerRatings.get(name)!;
    };

    // Helper function to get head-to-head key
    const getH2HKey = (p1: string, p2: string): string => {
        return [p1, p2].sort().join(':::');
    };

    // Process each game result
    let totalMoves = 0;

    for (const result of results) {
        const whitePlayer = getOrCreatePlayer(result.whitePlayer);
        const blackPlayer = getOrCreatePlayer(result.blackPlayer);

        // Determine scores
        let whiteScore: number;
        let blackScore: number;

        if (result.winner === 'white') {
            whiteScore = 1;
            blackScore = 0;
            whitePlayer.wins++;
            blackPlayer.losses++;
        } else if (result.winner === 'black') {
            whiteScore = 0;
            blackScore = 1;
            whitePlayer.losses++;
            blackPlayer.wins++;
        } else {
            whiteScore = 0.5;
            blackScore = 0.5;
            whitePlayer.draws++;
            blackPlayer.draws++;
        }

        // Calculate new ELO ratings
        const newWhiteRating = calculateElo(whitePlayer.rating, blackPlayer.rating, whiteScore);
        const newBlackRating = calculateElo(blackPlayer.rating, whitePlayer.rating, blackScore);

        // Update ratings
        whitePlayer.rating = newWhiteRating;
        blackPlayer.rating = newBlackRating;

        // Update games played
        whitePlayer.gamesPlayed++;
        blackPlayer.gamesPlayed++;

        // Update head-to-head stats
        const h2hKey = getH2HKey(result.whitePlayer, result.blackPlayer);
        if (!headToHeadMap.has(h2hKey)) {
            headToHeadMap.set(h2hKey, {
                player1: [result.whitePlayer, result.blackPlayer].sort()[0],
                player2: [result.whitePlayer, result.blackPlayer].sort()[1],
                player1Wins: 0,
                player2Wins: 0,
                draws: 0,
                totalGames: 0,
            });
        }
        const h2h = headToHeadMap.get(h2hKey)!;
        h2h.totalGames++;

        if (result.winner === 'draw') {
            h2h.draws++;
        } else {
            const winnerName = result.winner === 'white' ? result.whitePlayer : result.blackPlayer;
            if (winnerName === h2h.player1) {
                h2h.player1Wins++;
            } else {
                h2h.player2Wins++;
            }
        }

        totalMoves += result.moves;
    }

    // Calculate win rates
    for (const player of playerRatings.values()) {
        player.winRate = player.gamesPlayed > 0
            ? Math.round((player.wins / player.gamesPlayed) * 100 * 10) / 10
            : 0;
    }

    // Sort players by rating (descending)
    const sortedRatings = Array.from(playerRatings.values())
        .sort((a, b) => b.rating - a.rating);

    // Find most dominant player (highest win rate with at least 2 games)
    const dominantPlayer = sortedRatings
        .filter(p => p.gamesPlayed >= 2)
        .sort((a, b) => b.winRate - a.winRate)[0];

    return {
        totalGames: results.length,
        avgMoves: Math.round(totalMoves / results.length),
        playerRatings: sortedRatings,
        headToHead: Array.from(headToHeadMap.values()),
        mostDominantPlayer: dominantPlayer?.playerName || null,
    };
}

/**
 * Parse benchmark results from JSON string
 */
export function parseBenchmarkJson(jsonString: string): BenchmarkResult[] {
    try {
        const data = JSON.parse(jsonString);
        if (Array.isArray(data)) {
            return data as BenchmarkResult[];
        }
        throw new Error('Invalid benchmark data format');
    } catch (error) {
        console.error('Failed to parse benchmark JSON:', error);
        return [];
    }
}

/**
 * Format ELO rating change for display
 */
export function formatRatingChange(before: number, after: number): string {
    const diff = after - before;
    if (diff > 0) return `+${diff}`;
    return diff.toString();
}

/**
 * Get rating tier based on ELO rating
 */
export function getRatingTier(rating: number): string {
    if (rating >= 2400) return 'Master';
    if (rating >= 2000) return 'Expert';
    if (rating >= 1800) return 'Class A';
    if (rating >= 1600) return 'Class B';
    if (rating >= 1400) return 'Class C';
    if (rating >= 1200) return 'Class D';
    return 'Beginner';
}
