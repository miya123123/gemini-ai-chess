import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { getBestMove } from '../services/geminiService';
import { getBestMoveFromOllama } from '../services/ollamaService';
import { Difficulty, AIMoveResponse, AIProvider } from '../types';
import { Bot, RefreshCw, Trophy, AlertTriangle, Cpu, User } from 'lucide-react';

const ChessGame: React.FC = () => {
  // Game State
  const [game, setGame] = useState(new Chess());
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.INTERMEDIATE);
  const [aiProvider, setAiProvider] = useState<AIProvider>('gemini');
  const [aiThinking, setAiThinking] = useState(false);
  const [lastAiReasoning, setLastAiReasoning] = useState<string>("");
  const [gameStatus, setGameStatus] = useState<string>("");

  // Click-to-Move State
  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  const [optionSquares, setOptionSquares] = useState<Record<string, React.CSSProperties>>({});

  // To prevent double firing in StrictMode or rapid updates
  const isProcessingRef = useRef(false);

  // Check Game Status
  useEffect(() => {
    if (game.isCheckmate()) {
      setGameStatus(`チェックメイト！ ${game.turn() === 'w' ? '黒' : '白'} の勝ちです。`);
    } else if (game.isDraw()) {
      setGameStatus("引き分けです。");
    } else if (game.isGameOver()) {
      setGameStatus("ゲーム終了。");
    } else {
      setGameStatus("");
    }
  }, [game]);

  // AI Turn Handler
  const makeAiMove = useCallback(async () => {
    if (game.isGameOver() || game.turn() === 'w' || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setAiThinking(true);

    try {
      const possibleMoves = game.moves();

      // If no moves (mate or draw), stop
      if (possibleMoves.length === 0) {
        setAiThinking(false);
        isProcessingRef.current = false;
        return;
      }

      let response: AIMoveResponse;

      if (aiProvider === 'gemini') {
        response = await getBestMove(
          game.fen(),
          possibleMoves,
          difficulty,
          game.pgn()
        );
      } else {
        response = await getBestMoveFromOllama(
          game.fen(),
          possibleMoves,
          difficulty,
          game.pgn()
        );
      }

      setLastAiReasoning(response.reasoning);

      setGame((prevGame) => {
        const newGame = new Chess();
        newGame.loadPgn(prevGame.pgn());
        try {
          newGame.move(response.bestMove);
        } catch (e) {
          // Fallback if AI sends invalid notation
          console.error("Invalid AI move:", response.bestMove);
          const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
          newGame.move(randomMove);
          setLastAiReasoning("AIの手が無効だったため、ランダムな手を指しました。");
        }
        return newGame;
      });

    } catch (error) {
      console.error("Error making AI move:", error);
      setLastAiReasoning("エラーが発生しました。");
    } finally {
      setAiThinking(false);
      isProcessingRef.current = false;
    }
  }, [game, difficulty]);

  // Trigger AI move when it is black's turn
  useEffect(() => {
    if (game.turn() === 'b' && !game.isGameOver()) {
      makeAiMove();
    }
  }, [game, makeAiMove]);

  // Helper: Calculate move options for highlighting
  const getMoveOptions = (square: string) => {
    const moves = game.moves({
      square: square as any,
      verbose: true,
    });

    // Even if no moves, we highlight the selected piece
    const newSquares: Record<string, React.CSSProperties> = {};

    moves.forEach((move) => {
      newSquares[move.to] = {
        background:
          game.get(move.to as any) && game.get(move.to as any).color !== game.get(square as any).color
            ? 'radial-gradient(circle, rgba(255,0,0,.4) 85%, transparent 85%)' // Capture target
            : 'radial-gradient(circle, rgba(0,0,0,.2) 25%, transparent 25%)', // Normal move target
        borderRadius: '50%',
      };
    });

    newSquares[square] = {
      background: 'rgba(255, 255, 0, 0.5)', // Selected piece highlight
    };

    setOptionSquares(newSquares);
  };

  // Handle Square Click (Strict Click-to-Move Logic)
  const onSquareClick = ({ square }: { square: string; piece: { pieceType: string } | null }) => {
    // Cannot move if it's AI's turn or game over
    if (game.turn() === 'b' || game.isGameOver() || aiThinking) return;

    // Case 1: A piece is currently selected
    if (moveFrom) {
      // 1-a. Clicked the same square -> Deselect
      if (moveFrom === square) {
        setMoveFrom(null);
        setOptionSquares({});
        return;
      }

      // 1-b. Check if the clicked square is a valid move for the selected piece
      const moves = game.moves({ square: moveFrom as any, verbose: true });
      const foundMove = moves.find((m) => m.to === square);

      if (foundMove) {
        // Execute move
        try {
          setGame((prevGame) => {
            const newGame = new Chess();
            newGame.loadPgn(prevGame.pgn());
            newGame.move({
              from: moveFrom!,
              to: square,
              promotion: 'q', // always promote to queen for simplicity
            });
            return newGame;
          });
          setMoveFrom(null);
          setOptionSquares({});
        } catch (e: any) {
          console.error("Move error:", e);
        }
        return;
      }

      // 1-c. If not a valid move, check if clicked another OWN piece -> Switch selection
      const piece = game.get(square as any);
      if (piece && piece.color === 'w') {
        setMoveFrom(square);
        getMoveOptions(square);
        return;
      }

      // 1-d. Clicked invalid square (empty or enemy not capturable) -> Deselect
      setMoveFrom(null);
      setOptionSquares({});
      return;
    }

    // Case 2: No piece selected yet
    const piece = game.get(square as any);
    // Only allow selecting own pieces (White)
    if (piece && piece.color === 'w') {
      setMoveFrom(square);
      getMoveOptions(square);
      return;
    }

    // Clicked empty square with no selection -> do nothing (or ensure cleared)
    setOptionSquares({});
  };

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setLastAiReasoning("");
    setGameStatus("");
    setMoveFrom(null);
    setOptionSquares({});
    isProcessingRef.current = false;
  };

  const undoMove = () => {
    const newGame = new Chess();
    newGame.loadPgn(game.pgn());
    // Undo AI move
    newGame.undo();
    // Undo User move
    newGame.undo();
    setGame(newGame);
    setLastAiReasoning("一手戻しました。");
    setMoveFrom(null);
    setOptionSquares({});
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl mx-auto p-4">

      {/* Left Column: Board */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-4">
        {/* touch-none prevents scrolling on mobile when tapping board */}
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
                <button
                  onClick={resetGame}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  新しいゲーム
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Controls (visible on small screens) */}
        <div className="flex lg:hidden w-full justify-between gap-2">
          <button onClick={undoMove} disabled={aiThinking || game.history().length === 0} className="flex-1 py-3 bg-slate-700 rounded-lg disabled:opacity-50 text-white font-medium">待った</button>
          <button onClick={resetGame} className="flex-1 py-3 bg-blue-600 rounded-lg text-white font-medium">リセット</button>
        </div>
      </div>

      {/* Right Column: Controls & AI Info */}
      <div className="flex-1 flex flex-col space-y-6">

        {/* Header */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Gemini Chess Master
          </h1>
          <p className="text-slate-400 text-sm">
            {aiProvider === 'gemini' ? 'Google Gemini 2.5 Flash' : 'Ollama (gpt-oss-safeguard:20b)'} と対戦。難易度を選択して挑戦してください。
          </p>
        </div>

        {/* AI Provider Selector */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <label className="block text-sm font-medium text-slate-300 mb-3">AI モデル選択</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setAiProvider('gemini')}
              className={`p-2 rounded-md text-sm font-medium transition-all ${aiProvider === 'gemini'
                ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
            >
              Gemini
            </button>
            <button
              onClick={() => setAiProvider('ollama')}
              className={`p-2 rounded-md text-sm font-medium transition-all ${aiProvider === 'ollama'
                ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
            >
              Ollama
            </button>
          </div>
        </div>

        {/* Difficulty Selector */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <label className="block text-sm font-medium text-slate-300 mb-3">AI 難易度</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.values(Difficulty) as Difficulty[]).map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`p-2 rounded-md text-sm font-medium transition-all ${difficulty === level
                  ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
              >
                {level.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* AI Status & Reasoning */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex-grow flex flex-col min-h-[200px]">
          <div className="flex items-center gap-2 mb-4">
            <Bot className={`w-6 h-6 ${aiThinking ? 'text-blue-400 animate-pulse' : 'text-slate-400'}`} />
            <h2 className="text-lg font-semibold text-white">
              {aiThinking ? 'AI 思考中...' : 'AI の解説'}
            </h2>
          </div>

          <div className="bg-slate-900 rounded-lg p-4 flex-grow border border-slate-700 overflow-y-auto">
            {aiThinking ? (
              <div className="flex flex-col items-center justify-center h-full space-y-3">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 text-sm animate-pulse">盤面を分析しています...</p>
              </div>
            ) : lastAiReasoning ? (
              <div className="prose prose-invert">
                <p className="text-slate-200 leading-relaxed">{lastAiReasoning}</p>
              </div>
            ) : (
              <p className="text-slate-500 text-center italic mt-10">
                ゲームを開始して、AIの手をお待ちください。
              </p>
            )}
          </div>
        </div>

        {/* Desktop Controls */}
        <div className="hidden lg:flex gap-4">
          <button
            onClick={undoMove}
            disabled={aiThinking || game.history().length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className="w-4 h-4" />
            待った (Undo)
          </button>
          <button
            onClick={resetGame}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition shadow-lg shadow-blue-900/20"
          >
            <AlertTriangle className="w-4 h-4" />
            リセット
          </button>
        </div>

        {/* Turn Indicator */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800 rounded-lg border border-slate-700">
          <div className={`flex items-center gap-2 ${game.turn() === 'w' ? 'text-white' : 'text-slate-500'}`}>
            <User className="w-5 h-5" />
            <span className="font-medium">あなた (白)</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-600"></div>
          <div className={`flex items-center gap-2 ${game.turn() === 'b' ? 'text-blue-400' : 'text-slate-500'}`}>
            <Cpu className="w-5 h-5" />
            <span className="font-medium">AI (黒)</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ChessGame;
