import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Difficulty, AIMoveResponse, AIProvider } from '../types';

// Initialize the API client
// Note: process.env.API_KEY is injected by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    bestMove: {
      type: Type.STRING,
      description: "The best move in Standard Algebraic Notation (SAN) or UCI format (e.g., 'Nf3' or 'e2e4'). Must be one of the valid moves provided.",
    },
    reasoning: {
      type: Type.STRING,
      description: "A short explanation of why this move was chosen, in Japanese. Include strategic concepts.",
    },
  },
  required: ["bestMove", "reasoning"],
};

export const getBestMove = async (
  fen: string,
  validMoves: string[],
  difficulty: Difficulty,
  pgn: string,
  provider: AIProvider
): Promise<AIMoveResponse> => {
  const modelId = provider === 'gemini-1.5-flash' ? 'gemini-1.5-flash' : 'gemini-2.0-flash';


  let systemInstruction = `
    あなたは熟練したチェスのグランドマスターエンジンです。
    現在の盤面(FEN)と有効な手(Valid Moves)が与えられます。
    難易度は「${difficulty}」です。
    
    役割:
    1. 提供された「Valid Moves」のリストから、難易度に合わせて最適な手を選んでください。
    2. 選んだ理由を簡潔な日本語で説明してください。
    
    制約:
    - 決して不正な手(リストにない手)を選ばないでください。
    - 出力は必ずJSON形式にしてください。
  `;

  if (difficulty === Difficulty.BEGINNER) {
    systemInstruction += " 初心者相手なので、時々最適ではない単純な手を選び、過度な先読みは避けてください。";
  } else if (difficulty === Difficulty.INTERMEDIATE) {
    systemInstruction += " 中級者相手なので、堅実な手を選びますが、複雑な戦術は見逃すことがあります。";
  } else {
    systemInstruction += " 可能な限り最強の手を選んでください。";
  }

  const prompt = `
    Current Position (FEN): ${fen}
    Game History (PGN): ${pgn}
    Valid Legal Moves: ${JSON.stringify(validMoves)}
    
    Please select the best move from the valid moves list.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: difficulty === Difficulty.GRANDMASTER ? 0.1 : 0.5,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    const data = JSON.parse(text) as AIMoveResponse;

    // Fallback validation: ensure the move is actually in the list (normalization might be needed)
    // We trust the LLM mostly, but if it hallucinates, the UI will catch the invalid move exception.
    return data;

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback if AI fails: pick random legal move
    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    return {
      bestMove: randomMove,
      reasoning: "AIの通信エラーのため、ランダムに手を選びました。",
    };
  }
};
