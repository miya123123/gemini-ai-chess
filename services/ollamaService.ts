import { Difficulty, AIMoveResponse } from '../types';

const OLLAMA_API_URL = '/api/ollama/generate';
const MODEL_ID = 'gpt-oss-safeguard:20b'; // Or 'f2e795d0099c'

export const getBestMoveFromOllama = async (
  fen: string,
  validMoves: string[],
  difficulty: Difficulty,
  pgn: string
): Promise<AIMoveResponse> => {

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
    - JSONの形式: { "bestMove": "move_string", "reasoning": "explanation_string" }
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
    Respond ONLY with valid JSON.
  `;

  try {
    const response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_ID,
        prompt: prompt,
        system: systemInstruction,
        stream: false,
        // format: "json", // REMOVED: potentially causes empty response with strict mode on some models
        options: {
          temperature: difficulty === Difficulty.GRANDMASTER ? 0.1 : 0.5,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    let text = data.response;

    if (!text) {
      throw new Error("No response from Ollama AI");
    }

    // Sanitize: extract JSON from markdown fences if present
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    try {
      const parsedData = JSON.parse(text) as AIMoveResponse;
      return parsedData;
    } catch (parseError) {
      console.error("Failed to parse Ollama response:", text);
      throw new Error("Invalid JSON response from Ollama");
    }

  } catch (error) {
    console.error("Ollama API Error:", error);
    // Fallback if AI fails: pick random legal move
    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      bestMove: randomMove,
      reasoning: `Ollama通信エラー、または解析失敗。ランダムに手を選びました。(Error: ${errorMessage})`,
    };
  }
};
