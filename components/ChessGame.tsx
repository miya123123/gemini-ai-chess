import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { getBestMove } from '../services/geminiService';
import { getBestMoveFromOllama } from '../services/ollamaService';
import { Difficulty, AIMoveResponse, AIProvider } from '../types';
import { Bot, RefreshCw, Trophy, AlertTriangle, Cpu, User, Download, Play, Square, Settings2 } from 'lucide-react';

type PlayerType = 'human' | 'ai';

interface BenchmarkResult {
  gameNumber: number;
  winner: 'white' | 'black' | 'draw';
  whitePlayer: string;
  blackPlayer: string;
  moves: number;
  fen: string;
  pgn: string;
  timestamp: string;
}

const ChessGame: React.FC = () => {
  // Game State
  const [game, setGame] = useState(new Chess());
  const [gameStatus, setGameStatus] = useState<string>("");

  // Player Configuration
  const [whitePlayerType, setWhitePlayerType] = useState<PlayerType>('human');
  const [blackPlayerType, setBlackPlayerType] = useState<PlayerType>('ai');

  const [whiteAiProvider, setWhiteAiProvider] = useState<AIProvider>('gemini-2.5-flash');
  const [blackAiProvider, setBlackAiProvider] = useState<AIProvider>('gemini-3-flash-preview');

  const [whiteAiDifficulty, setWhiteAiDifficulty] = useState<Difficulty>(Difficulty.INTERMEDIATE);
  const [blackAiDifficulty, setBlackAiDifficulty] = useState<Difficulty>(Difficulty.INTERMEDIATE);

  // AI State
  const [aiThinking, setAiThinking] = useState(false);
  const [lastAiReasoning, setLastAiReasoning] = useState<string>("");

  // Benchmark State
  const [isBenchmarkRunning, setIsBenchmarkRunning] = useState(false);
  const [benchmarkGamesTotal, setBenchmarkGamesTotal] = useState(10);
  const [benchmarkGamesCompleted, setBenchmarkGamesCompleted] = useState(0);
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[]>([]);
  const [showBenchmarkSettings, setShowBenchmarkSettings] = useState(false);

  // Play/Stop State
  const [isGameStarted, setIsGameStarted] = useState(false);

  // Click-to-Move State
  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  const [optionSquares, setOptionSquares] = useState<Record<string, React.CSSProperties>>({});

  // Refs
  const isProcessingRef = useRef(false);
  const gameRef = useRef(game);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Update logic to trigger AI moves
  const makeAiMove = useCallback(async (color: 'w' | 'b') => {
    if (game.isGameOver() || isProcessingRef.current) return;

    const playerType = color === 'w' ? whitePlayerType : blackPlayerType;
    if (playerType !== 'ai') return;

    // Reset abort controller for new move
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    isProcessingRef.current = true;
    setAiThinking(true);

    const provider = color === 'w' ? whiteAiProvider : blackAiProvider;
    const difficulty = color === 'w' ? whiteAiDifficulty : blackAiDifficulty;

    try {
      const possibleMoves = game.moves();

      if (possibleMoves.length === 0) {
        setAiThinking(false);
        isProcessingRef.current = false;
        return;
      }

      let response: AIMoveResponse;

      // Check abort before expensive call (though unlikely to be aborted this early)
      if (signal.aborted) return;

      if (provider === 'ollama') {
        response = await getBestMoveFromOllama(
          game.fen(),
          possibleMoves,
          difficulty,
          game.pgn()
        );
      } else {
        response = await getBestMove(
          game.fen(),
          possibleMoves,
          difficulty,
          game.pgn(),
          provider
        );
      }

      // Check abort after async call
      if (signal.aborted) {
        console.log("AI move aborted");
        return;
      }

      setLastAiReasoning(response.reasoning);

      setGame((prevGame) => {
        const newGame = new Chess();
        newGame.loadPgn(prevGame.pgn());
        try {
          newGame.move(response.bestMove);
        } catch (e) {
          console.error("Invalid AI move:", response.bestMove);
          const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
          newGame.move(randomMove);
          setLastAiReasoning("AIの手が不正だったため、ランダムな手を選びました。");
        }
        return newGame;
      });

    } catch (error) {
      if (signal.aborted) return;
      console.error("Error making AI move:", error);
      setLastAiReasoning("AI思考中にエラーが発生しました。");
    } finally {
      if (!signal.aborted) {
        setAiThinking(false);
        isProcessingRef.current = false;
      }
    }
  }, [game, whitePlayerType, blackPlayerType, whiteAiProvider, blackAiProvider, whiteAiDifficulty, blackAiDifficulty]);

  // Main Game Loop for AI Turns
  useEffect(() => {
    if (!isGameStarted) return; // Don't run AI if game hasn't started

    const turn = game.turn();
    const currentPlayerType = turn === 'w' ? whitePlayerType : blackPlayerType;

    if (!game.isGameOver() && currentPlayerType === 'ai' && !aiThinking && !isProcessingRef.current) {
      // Small delay for realism and UI update
      const timer = setTimeout(() => {
        makeAiMove(turn);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [game, whitePlayerType, blackPlayerType, makeAiMove, aiThinking, isGameStarted]);

  // Game Status & Benchmark Logic
  useEffect(() => {
    if (game.isCheckmate()) {
      setGameStatus(`チェックメイト！ ${game.turn() === 'w' ? '黒' : '白'} の勝ちです。`);
      handleGameEnd(game.turn() === 'w' ? 'black' : 'white');
    } else if (game.isDraw()) {
      setGameStatus("引き分けです。");
      handleGameEnd('draw');
    } else if (game.isGameOver()) {
      setGameStatus("ゲーム終了。");
      handleGameEnd('draw');
    } else {
      setGameStatus("");
    }
  }, [game]);

  const handleGameEnd = (winner: 'white' | 'black' | 'draw') => {
    if (!isBenchmarkRunning) return;

    const result: BenchmarkResult = {
      gameNumber: benchmarkGamesCompleted + 1,
      winner,
      whitePlayer: `${whiteAiProvider} (${whiteAiDifficulty})`,
      blackPlayer: `${blackAiProvider} (${blackAiDifficulty})`,
      moves: game.history().length,
      fen: game.fen(),
      pgn: game.pgn(),
      timestamp: new Date().toISOString(),
    };

    setBenchmarkResults(prev => [...prev, result]);
    setBenchmarkGamesCompleted(prev => prev + 1);

    // Schedule next game if needed
    if (benchmarkGamesCompleted + 1 < benchmarkGamesTotal) {
      setTimeout(() => {
        resetGame();
      }, 2000); // 2 second delay between games
    } else {
      setIsBenchmarkRunning(false);
    }
  };

  // Helper: Calculate move options for highlighting
  const getMoveOptions = (square: string) => {
    const moves = game.moves({
      square: square as any,
      verbose: true,
    });

    const newSquares: Record<string, React.CSSProperties> = {};
    moves.forEach((move) => {
      newSquares[move.to] = {
        background:
          game.get(move.to as any) && game.get(move.to as any).color !== game.get(square as any).color
            ? 'radial-gradient(circle, rgba(255,0,0,.4) 85%, transparent 85%)'
            : 'radial-gradient(circle, rgba(0,0,0,.2) 25%, transparent 25%)',
        borderRadius: '50%',
      };
    });
    newSquares[square] = {
      background: 'rgba(255, 255, 0, 0.5)',
    };
    setOptionSquares(newSquares);
  };

  // Handle Square Click
  const onSquareClick = ({ square }: { square: string; piece: { pieceType: string } | null }) => {
    const turn = game.turn();
    const currentPlayerType = turn === 'w' ? whitePlayerType : blackPlayerType;

    // Cannot move if it's AI's turn or game over or game not started
    if (currentPlayerType === 'ai' || game.isGameOver() || aiThinking || !isGameStarted) return;

    // Select piece logic logic (same as before but respecting turn owner)
    if (moveFrom) {
      if (moveFrom === square) {
        setMoveFrom(null);
        setOptionSquares({});
        return;
      }

      const moves = game.moves({ square: moveFrom as any, verbose: true });
      const foundMove = moves.find((m) => m.to === square);

      if (foundMove) {
        try {
          setGame((prevGame) => {
            const newGame = new Chess();
            newGame.loadPgn(prevGame.pgn());
            newGame.move({ from: moveFrom!, to: square, promotion: 'q' });
            return newGame;
          });
          setMoveFrom(null);
          setOptionSquares({});
        } catch (e) {
          console.error(e);
        }
        return;
      }

      // Select another own piece
      const piece = game.get(square as any);
      if (piece && piece.color === turn) {
        setMoveFrom(square);
        getMoveOptions(square);
        return;
      }

      setMoveFrom(null);
      setOptionSquares({});
      return;
    }

    const piece = game.get(square as any);
    if (piece && piece.color === turn) {
      setMoveFrom(square);
      getMoveOptions(square);
      return;
    }
    setOptionSquares({});
  };

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setLastAiReasoning("");
    setGameStatus("");
    setMoveFrom(null);
    setOptionSquares({});
    setIsGameStarted(false); // require Play button again
    isProcessingRef.current = false;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setAiThinking(false);
  };

  const undoMove = () => {
    if (isBenchmarkRunning) return;
    const newGame = new Chess();
    newGame.loadPgn(game.pgn());
    newGame.undo(); // Undo last move
    // If double AI, or single AI, we might want to undo 2 steps if it was user turn after AI
    // But safely, just undo 1 step allows precise control or undoing 2 if needed.
    // Usually for Human vs AI, we undo 2.
    if (whitePlayerType === 'human' && blackPlayerType === 'ai' && game.turn() === 'w') {
      newGame.undo(); // Undo AI's move as well
    }

    setGame(newGame);
    setLastAiReasoning("一手戻しました。");
    setMoveFrom(null);
    setOptionSquares({});
  };

  const startBenchmark = () => {
    setIsBenchmarkRunning(true);
    setBenchmarkGamesCompleted(0);
    setBenchmarkResults([]);
    resetGame();
  };

  const stopBenchmark = () => {
    setIsBenchmarkRunning(false);
  };

  const downloadResults = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(benchmarkResults, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `benchmark_results_${new Date().getTime()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleStartGame = () => {
    setIsGameStarted(true);
  };

  const handleStopThinking = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Force stop thinking state
    setAiThinking(false);
    isProcessingRef.current = false;

    // Play random move
    const possibleMoves = game.moves();
    if (possibleMoves.length > 0) {
      const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

      setGame((prevGame) => {
        const newGame = new Chess();
        newGame.loadPgn(prevGame.pgn());
        newGame.move(randomMove);
        return newGame;
      });

      setLastAiReasoning("思考停止ボタンが押されたため、ランダムな手を選びました。");
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4">

      {/* Benchmark Dashboard */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-white">
            <Settings2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold">Benchmark Mode</h2>
          </div>
          <button
            onClick={() => setShowBenchmarkSettings(!showBenchmarkSettings)}
            className="text-slate-400 hover:text-white text-sm underline"
          >
            {showBenchmarkSettings ? '設定を隠す' : '設定を表示'}
          </button>
        </div>

        {showBenchmarkSettings && (
          <div className="flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <span className="text-slate-300 text-sm">対戦回数:</span>
              <input
                type="number"
                min="1"
                max="100"
                value={benchmarkGamesTotal}
                onChange={(e) => setBenchmarkGamesTotal(parseInt(e.target.value) || 1)}
                className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white w-20 text-center"
                disabled={isBenchmarkRunning}
              />
            </div>

            {!isBenchmarkRunning ? (
              <button
                onClick={startBenchmark}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium"
              >
                <Play className="w-4 h-4" /> 開始
              </button>
            ) : (
              <button
                onClick={stopBenchmark}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium"
              >
                <Square className="w-4 h-4" /> 停止
              </button>
            )}

            {benchmarkResults.length > 0 && (
              <button
                onClick={downloadResults}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium ml-auto"
              >
                <Download className="w-4 h-4" /> 結果を保存 (JSON)
              </button>
            )}
          </div>
        )}

        {/* Progress Bar */}
        {isBenchmarkRunning && (
          <div className="mt-4 w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${(benchmarkGamesCompleted / benchmarkGamesTotal) * 100}%` }}
            ></div>
          </div>
        )}

        {/* Stats Summary */}
        {benchmarkResults.length > 0 && (
          <div className="mt-4 flex gap-4 text-sm text-slate-300 border-t border-slate-700 pt-3">
            <span>Games: {benchmarkGamesCompleted} / {benchmarkGamesTotal}</span>
            <span>White Wins: {benchmarkResults.filter(r => r.winner === 'white').length}</span>
            <span>Black Wins: {benchmarkResults.filter(r => r.winner === 'black').length}</span>
            <span>Draws: {benchmarkResults.filter(r => r.winner === 'draw').length}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* Left Column: Board */}
        <div className="flex-1 flex flex-col items-center justify-start space-y-4">
          <div className="w-full max-w-[600px] aspect-square shadow-2xl rounded-lg overflow-hidden border-4 border-slate-700 bg-slate-800 relative touch-none select-none">
            <Chessboard
              options={{
                position: game.fen(),
                allowDragging: false,
                onSquareClick,
                squareStyles: optionSquares,
                boardOrientation: 'white',
                darkSquareStyle: { backgroundColor: '#779556' },
                lightSquareStyle: { backgroundColor: '#ebecd0' },
                animationDurationInMs: 200,
              }}
            />
            {gameStatus && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-white text-slate-900 p-6 rounded-xl shadow-xl text-center">
                  <Trophy className="w-12 h-12 mx-auto text-yellow-500 mb-2" />
                  <h2 className="text-2xl font-bold mb-2">{gameStatus}</h2>
                  {!isBenchmarkRunning && (
                    <button
                      onClick={resetGame}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                      新しいゲーム
                    </button>
                  )}
                  {isBenchmarkRunning && (
                    <p className="text-sm text-slate-600 animate-pulse">次のゲームを開始します...</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Turn Indicator */}
          <div className="w-full max-w-[600px] flex items-center justify-between px-4 py-3 bg-slate-800 rounded-lg border border-slate-700">
            <div className={`flex items-center gap-2 ${game.turn() === 'w' ? 'text-white' : 'text-slate-500'}`}>
              <div className={`w-3 h-3 rounded-full ${game.turn() === 'w' ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
              <span className="font-medium">White: {whitePlayerType === 'human' ? 'You' : whiteAiProvider}</span>
            </div>
            <div className="h-4 w-[1px] bg-slate-600"></div>
            <div className={`flex items-center gap-2 ${game.turn() === 'b' ? 'text-white' : 'text-slate-500'}`}>
              <span className="font-medium">Black: {blackPlayerType === 'human' ? 'You' : blackAiProvider}</span>
              <div className={`w-3 h-3 rounded-full ${game.turn() === 'b' ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
            </div>
          </div>
        </div>

        {/* Right Column: Player Settings & Info */}
        <div className="flex-1 flex flex-col space-y-4 max-w-xl">

          {/* White Player Config */}
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold flex items-center gap-2"><User className="w-4 h-4" /> White Player</h3>
              <div className="flex bg-slate-700 rounded-lg p-1">
                <button
                  onClick={() => setWhitePlayerType('human')}
                  className={`px-3 py-1 rounded text-xs font-bold transition ${whitePlayerType === 'human' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                  disabled={isBenchmarkRunning}
                >Human</button>
                <button
                  onClick={() => setWhitePlayerType('ai')}
                  className={`px-3 py-1 rounded text-xs font-bold transition ${whitePlayerType === 'ai' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                  disabled={isBenchmarkRunning}
                >AI</button>
              </div>
            </div>
            {whitePlayerType === 'ai' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  value={whiteAiProvider}
                  onChange={(e) => setWhiteAiProvider(e.target.value as AIProvider)}
                  className="bg-slate-900 border border-slate-600 text-white text-sm rounded p-2"
                  disabled={isBenchmarkRunning}
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  <option value="gemini-3-flash-preview">Gemini 3 Flash (Preview)</option>
                  <option value="ollama">Ollama (Locally Hosted)</option>
                </select>

                <select
                  value={whiteAiDifficulty}
                  onChange={(e) => setWhiteAiDifficulty(e.target.value as Difficulty)}
                  className="bg-slate-900 border border-slate-600 text-white text-sm rounded p-2"
                  disabled={isBenchmarkRunning}
                >
                  <option value={Difficulty.BEGINNER}>Beginner</option>
                  <option value={Difficulty.INTERMEDIATE}>Intermediate</option>
                  <option value={Difficulty.ADVANCED}>Advanced</option>
                  <option value={Difficulty.GRANDMASTER}>Grandmaster</option>
                </select>
              </div>
            )}
          </div>

          {/* Black Player Config */}
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold flex items-center gap-2"><Cpu className="w-4 h-4" /> Black Player</h3>
              <div className="flex bg-slate-700 rounded-lg p-1">
                <button
                  onClick={() => setBlackPlayerType('human')}
                  className={`px-3 py-1 rounded text-xs font-bold transition ${blackPlayerType === 'human' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                  disabled={isBenchmarkRunning}
                >Human</button>
                <button
                  onClick={() => setBlackPlayerType('ai')}
                  className={`px-3 py-1 rounded text-xs font-bold transition ${blackPlayerType === 'ai' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                  disabled={isBenchmarkRunning}
                >AI</button>
              </div>
            </div>
            {blackPlayerType === 'ai' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  value={blackAiProvider}
                  onChange={(e) => setBlackAiProvider(e.target.value as AIProvider)}
                  className="bg-slate-900 border border-slate-600 text-white text-sm rounded p-2"
                  disabled={isBenchmarkRunning}
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  <option value="gemini-3-flash-preview">Gemini 3 Flash (Preview)</option>
                  <option value="ollama">Ollama (Locally Hosted)</option>
                </select>

                <select
                  value={blackAiDifficulty}
                  onChange={(e) => setBlackAiDifficulty(e.target.value as Difficulty)}
                  className="bg-slate-900 border border-slate-600 text-white text-sm rounded p-2"
                  disabled={isBenchmarkRunning}
                >
                  <option value={Difficulty.BEGINNER}>Beginner</option>
                  <option value={Difficulty.INTERMEDIATE}>Intermediate</option>
                  <option value={Difficulty.ADVANCED}>Advanced</option>
                  <option value={Difficulty.GRANDMASTER}>Grandmaster</option>
                </select>
              </div>
            )}
          </div>

          {/* AI Status & Reasoning */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex-grow flex flex-col min-h-[300px]">
            <div className="flex items-center gap-2 mb-4">
              <Bot className={`w-6 h-6 ${aiThinking ? 'text-blue-400 animate-pulse' : 'text-slate-400'}`} />
              <h2 className="text-lg font-semibold text-white">
                {aiThinking ? 'AI Thinking...' : 'AI Reasoning'}
              </h2>
            </div>
            <div className="bg-slate-900 rounded-lg p-4 flex-grow border border-slate-700 overflow-y-auto max-h-[400px]">
              {aiThinking ? (
                <div className="flex flex-col items-center justify-center h-full space-y-3">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-400 text-sm animate-pulse">Analyzing position...</p>
                </div>
              ) : lastAiReasoning ? (
                <div className="prose prose-invert">
                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{lastAiReasoning}</p>
                </div>
              ) : (
                <p className="text-slate-500 text-center italic mt-10">
                  Game logs will appear here.
                </p>
              )}
            </div>
          </div>

          {/* Game Controls */}
          {!isBenchmarkRunning && (
            <div className="flex flex-col gap-4">
              {/* Play / Stop Logic */}
              {!isGameStarted ? (
                <button
                  onClick={handleStartGame}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 hover:bg-green-500 text-white text-lg font-bold rounded-xl transition shadow-lg shadow-green-900/20"
                >
                  <Play className="w-6 h-6" /> Play Game
                </button>
              ) : aiThinking ? (
                <button
                  onClick={handleStopThinking}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-600 hover:bg-red-500 text-white text-lg font-bold rounded-xl transition shadow-lg shadow-red-900/20 animate-pulse"
                >
                  <Square className="w-6 h-6" /> Stop Thinking
                </button>
              ) : (
                <div className="text-center text-slate-500 py-2 border border-slate-700 rounded-lg">
                  ゲーム進行中...
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={undoMove}
                  disabled={aiThinking || game.history().length === 0 || !isGameStarted}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className="w-4 h-4" /> Undo
                </button>
                <button
                  onClick={resetGame}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition shadow-lg shadow-blue-900/20"
                >
                  <AlertTriangle className="w-4 h-4" /> Reset
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ChessGame;
