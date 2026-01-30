import React, { useState, useRef } from 'react';
import { BarChart3, Upload, Trophy, Target, Users, TrendingUp } from 'lucide-react';
import {
    BenchmarkResult,
    BenchmarkStatistics,
    EloRating,
    HeadToHeadStats,
    analyzeBenchmarkResults,
    parseBenchmarkJson,
    getRatingTier
} from '../services/eloService';

interface EloStatisticsProps {
    benchmarkResults: BenchmarkResult[];
    isVisible: boolean;
    onClose: () => void;
}

const EloStatistics: React.FC<EloStatisticsProps> = ({ benchmarkResults, isVisible, onClose }) => {
    const [additionalResults, setAdditionalResults] = useState<BenchmarkResult[]>([]);
    const [selectedTab, setSelectedTab] = useState<'ratings' | 'matchups'>('ratings');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Combine current session results with imported results
    const allResults = [...benchmarkResults, ...additionalResults];
    const stats: BenchmarkStatistics = analyzeBenchmarkResults(allResults);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            const results = parseBenchmarkJson(content);
            setAdditionalResults(prev => [...prev, ...results]);
        };
        reader.readAsText(file);

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const clearImportedData = () => {
        setAdditionalResults([]);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <BarChart3 className="w-6 h-6 text-purple-400" />
                        <h2 className="text-xl font-bold text-white">ELO Statistics Dashboard</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-slate-700 transition"
                    >
                        ×
                    </button>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-4 p-6 border-b border-slate-700 bg-slate-800/50">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-blue-400">{stats.totalGames}</div>
                        <div className="text-xs text-slate-400 uppercase tracking-wide">Total Games</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-green-400">{stats.avgMoves}</div>
                        <div className="text-xs text-slate-400 uppercase tracking-wide">Avg Moves</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-purple-400">{stats.playerRatings.length}</div>
                        <div className="text-xs text-slate-400 uppercase tracking-wide">Players</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xl font-bold text-yellow-400 truncate" title={stats.mostDominantPlayer || '-'}>
                            {stats.mostDominantPlayer ? stats.mostDominantPlayer.split(' ')[0] : '-'}
                        </div>
                        <div className="text-xs text-slate-400 uppercase tracking-wide">Top Player</div>
                    </div>
                </div>

                {/* Import Controls */}
                <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-700">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="benchmark-file-input"
                    />
                    <label
                        htmlFor="benchmark-file-input"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg cursor-pointer transition"
                    >
                        <Upload className="w-4 h-4" /> Import JSON
                    </label>
                    {additionalResults.length > 0 && (
                        <>
                            <span className="text-sm text-slate-400">
                                {additionalResults.length} imported games
                            </span>
                            <button
                                onClick={clearImportedData}
                                className="text-sm text-red-400 hover:text-red-300 underline"
                            >
                                Clear
                            </button>
                        </>
                    )}
                    {benchmarkResults.length > 0 && (
                        <span className="text-sm text-slate-400 ml-auto">
                            {benchmarkResults.length} session games
                        </span>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-700">
                    <button
                        onClick={() => setSelectedTab('ratings')}
                        className={`flex-1 py-3 text-sm font-medium transition ${selectedTab === 'ratings'
                                ? 'text-purple-400 border-b-2 border-purple-400 bg-slate-800/50'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Trophy className="w-4 h-4 inline mr-2" />
                        Player Ratings
                    </button>
                    <button
                        onClick={() => setSelectedTab('matchups')}
                        className={`flex-1 py-3 text-sm font-medium transition ${selectedTab === 'matchups'
                                ? 'text-purple-400 border-b-2 border-purple-400 bg-slate-800/50'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Users className="w-4 h-4 inline mr-2" />
                        Head-to-Head
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {stats.totalGames === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <BarChart3 className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-lg font-medium mb-2">No game data available</p>
                            <p className="text-sm">Run a benchmark or import a JSON file to see statistics</p>
                        </div>
                    ) : selectedTab === 'ratings' ? (
                        <RatingsTable ratings={stats.playerRatings} />
                    ) : (
                        <MatchupsTable matchups={stats.headToHead} />
                    )}
                </div>
            </div>
        </div>
    );
};

// Player Ratings Table Component
const RatingsTable: React.FC<{ ratings: EloRating[] }> = ({ ratings }) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="text-left text-xs text-slate-400 uppercase tracking-wide border-b border-slate-700">
                        <th className="pb-3 pr-4">#</th>
                        <th className="pb-3 pr-4">Player</th>
                        <th className="pb-3 pr-4 text-right">ELO</th>
                        <th className="pb-3 pr-4 text-center">Tier</th>
                        <th className="pb-3 pr-4 text-center">Games</th>
                        <th className="pb-3 pr-4 text-center">W</th>
                        <th className="pb-3 pr-4 text-center">L</th>
                        <th className="pb-3 pr-4 text-center">D</th>
                        <th className="pb-3 text-right">Win %</th>
                    </tr>
                </thead>
                <tbody>
                    {ratings.map((player, index) => (
                        <tr key={player.playerName} className="border-b border-slate-800 hover:bg-slate-800/50 transition">
                            <td className="py-4 pr-4">
                                {index === 0 ? (
                                    <Trophy className="w-5 h-5 text-yellow-400" />
                                ) : index === 1 ? (
                                    <Trophy className="w-5 h-5 text-slate-300" />
                                ) : index === 2 ? (
                                    <Trophy className="w-5 h-5 text-amber-600" />
                                ) : (
                                    <span className="text-slate-500">{index + 1}</span>
                                )}
                            </td>
                            <td className="py-4 pr-4">
                                <div className="font-medium text-white truncate max-w-[200px]" title={player.playerName}>
                                    {player.playerName}
                                </div>
                            </td>
                            <td className="py-4 pr-4 text-right">
                                <span className={`text-lg font-bold ${player.rating >= 1600 ? 'text-green-400' :
                                        player.rating >= 1400 ? 'text-blue-400' :
                                            player.rating >= 1200 ? 'text-yellow-400' :
                                                'text-red-400'
                                    }`}>
                                    {player.rating}
                                </span>
                            </td>
                            <td className="py-4 pr-4 text-center">
                                <span className={`text-xs px-2 py-1 rounded-full ${player.rating >= 2000 ? 'bg-purple-600/30 text-purple-300' :
                                        player.rating >= 1600 ? 'bg-green-600/30 text-green-300' :
                                            player.rating >= 1400 ? 'bg-blue-600/30 text-blue-300' :
                                                'bg-slate-600/30 text-slate-300'
                                    }`}>
                                    {getRatingTier(player.rating)}
                                </span>
                            </td>
                            <td className="py-4 pr-4 text-center text-slate-300">{player.gamesPlayed}</td>
                            <td className="py-4 pr-4 text-center text-green-400">{player.wins}</td>
                            <td className="py-4 pr-4 text-center text-red-400">{player.losses}</td>
                            <td className="py-4 pr-4 text-center text-slate-400">{player.draws}</td>
                            <td className="py-4 text-right">
                                <span className={`font-medium ${player.winRate >= 60 ? 'text-green-400' :
                                        player.winRate >= 40 ? 'text-slate-300' :
                                            'text-red-400'
                                    }`}>
                                    {player.winRate}%
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// Head-to-Head Matchups Table Component
const MatchupsTable: React.FC<{ matchups: HeadToHeadStats[] }> = ({ matchups }) => {
    if (matchups.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <Users className="w-12 h-12 mb-4 opacity-50" />
                <p>No matchup data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {matchups.map((matchup, index) => {
                const total = matchup.player1Wins + matchup.player2Wins + matchup.draws;
                const p1WinPct = total > 0 ? (matchup.player1Wins / total) * 100 : 0;
                const p2WinPct = total > 0 ? (matchup.player2Wins / total) * 100 : 0;
                const drawPct = total > 0 ? (matchup.draws / total) * 100 : 0;

                return (
                    <div
                        key={`${matchup.player1}-${matchup.player2}-${index}`}
                        className="bg-slate-800 rounded-xl p-5 border border-slate-700"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex-1">
                                <div className="text-sm text-slate-400 mb-1">Player 1</div>
                                <div className="font-medium text-white truncate" title={matchup.player1}>
                                    {matchup.player1}
                                </div>
                            </div>
                            <div className="text-center px-4">
                                <div className="text-2xl font-bold text-white">
                                    {matchup.player1Wins} - {matchup.draws} - {matchup.player2Wins}
                                </div>
                                <div className="text-xs text-slate-400">{matchup.totalGames} games</div>
                            </div>
                            <div className="flex-1 text-right">
                                <div className="text-sm text-slate-400 mb-1">Player 2</div>
                                <div className="font-medium text-white truncate" title={matchup.player2}>
                                    {matchup.player2}
                                </div>
                            </div>
                        </div>

                        {/* Win Rate Bar */}
                        <div className="h-3 rounded-full overflow-hidden flex bg-slate-700">
                            <div
                                className="bg-green-500 transition-all"
                                style={{ width: `${p1WinPct}%` }}
                                title={`${matchup.player1}: ${matchup.player1Wins} wins (${p1WinPct.toFixed(1)}%)`}
                            />
                            <div
                                className="bg-slate-500 transition-all"
                                style={{ width: `${drawPct}%` }}
                                title={`Draws: ${matchup.draws} (${drawPct.toFixed(1)}%)`}
                            />
                            <div
                                className="bg-red-500 transition-all"
                                style={{ width: `${p2WinPct}%` }}
                                title={`${matchup.player2}: ${matchup.player2Wins} wins (${p2WinPct.toFixed(1)}%)`}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-slate-400 mt-2">
                            <span>{p1WinPct.toFixed(0)}%</span>
                            <span>{p2WinPct.toFixed(0)}%</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default EloStatistics;
