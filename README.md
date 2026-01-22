# Gemini Chess

LLM（Gemini）との対話型のチェスゲームです。
AIは単に手を指すだけでなく、その手を選んだ理由を日本語で解説します。

# 主な機能
- **AI対戦**: Gemini 3 Flash、Gemini 2.5 Flash、そしてgpt-oss-safeguard:20b（ローカル）との対戦が可能です。
- **LLM同士の対戦**: LLM同士を対戦させる機能を搭載。異なるモデル間の対局を観戦できます。
- **解説機能**: AIが手を指すたびに、なぜその手を選んだのかを日本語で解説します。
- **難易度調整**: BeginnerからGrandmasterまで4段階の調整が可能です。
- **クリック＆タップ操作**: クリック（タップ）で移動元・移動先を選択するシンプルな操作方法です。
- **Play/Stop操作**: Playボタンで対局を開始、思考停止（Stop Thinking）ボタンでAIの思考を中断できます。プレイヤーは黒番でのプレイも可能です。
- **待った/リセット**: 一手前/初期配置に戻すことができます。
- **ベンチマークモード**: 本ゲームをLLMのゲームベンチマークとして活用できます。AI同士の対戦を自動化し、手数や指し手などを記録したJSON形式で結果をダウンロードできます。

# セットアップ手順

このプロジェクトを実行するには、Gemini APIキーが必要です。

1. **APIキーの取得**:
   [Google AI Studio](https://aistudio.google.com/) からAPIキーを取得してください。

2. **環境変数**:
   プロジェクトのルートに `.env.local` ファイルを作成し、`GEMINI_API_KEY` を設定してください。
   
   ```bash
   GEMINI_API_KEY="あなたのAPIキー"
   ```

3. **依存関係のインストール**:
   プロジェクトのルートディレクトリに移動してから実行してください。
   ```bash
   cd gemini-ai-chess
   npm install
   ```

4. **起動**:
   ```bash
   npm run dev
   ```

5. **Ollamaのセットアップ (ローカルLLMを使用する場合)**:
   
   このプロジェクトは、ローカルLLM (Ollama) との対戦もサポートしています。
   
   - **Ollamaのインストール**:
     [Ollama公式サイト](https://ollama.com/)からインストールするか、Homebrewを使用してください。
     ```bash
     brew install ollama
     ```
   
   - **Ollamaの起動**:
     ```bash
     brew services start ollama
     # または
     ollama serve
     ```
     
     > [!TIP]
     > 本プロジェクトではViteのプロキシ機能を使用しているため、ブラウザからのCORSエラーは自動的に回避されます。
     > 基本的には通常の `ollama serve` だけで動作しますが、もし通信エラーが出る場合は `OLLAMA_ORIGINS="*"` を試してください。
>
> `OLLAMA_ORIGINS="*"` は、Ollamaサーバーが異なるオリジン（この場合は本Webゲーム）からのリクエストを受け入れるようにする設定です（CORS許可）。
     >
     > ```bash
     > # 基本の起動
     > ollama serve
     > ```
   
   - **モデルの準備**:
     本プロジェクトでは `gpt-oss-safeguard:20b` というモデルIDを使用しています。
     必要なモデルをpullまたは作成してください。
     ```bash
     # 例: 既存のモデルをコピーする場合
     ollama cp llama3 gpt-oss-safeguard:20b
     ```


# 今後の展望
- **ベンチマーク結果の分析機能**: ELOレーティングの計算などの分析機能を実装します。
- **ベンチマーク結果の測定**: LLM同士を複数回対戦させ、その結果を測定・共有します。
- **モデルの追加**: 対応LLMを追加していきます。
- **LLMによる局面評価**: 現在の局面の優劣を、数値と自然言語でLLMが評価する機能。
- **LLMによるプレイヤーへのアドバイス**: プレイヤーの次の一手の候補や、長期的な戦略をLLMが自然言語でアドバイスしてくれる機能。
- **AIペルソナの拡充**: 「攻撃的」「守備的」「定跡重視」など、AIの棋風を選択できる機能。
- **対人戦モード**: オンラインで他のプレイヤーと対戦できる機能。
- **棋譜分析機能**: LLMを使用して、対局後にその棋譜の分析を行う機能。
- **通信不安定時のAIの指し手の強化**: 現在、通信不安定時はランダムな手を指す仕様ですが、軽量なチェスエンジンを使用し、通信不安定時でもある程度強力な手を指すように改善します。

# 使用技術

## 開発ツール
- Antigravity
- Google AI Studio
- Codex

## Model
- Gemini 3 Pro (メインの開発に使用)
- Gemini 3 Flash (対戦相手として使用)
- Gemini 2.5 Flash (対戦相手として使用)
- gpt-oss-safeguard:20b（対戦相手として使用）
- gpt-5.1-codex-max (軽微なバグ修正にサブとして使用)

## Frontend
React 19, TypeScript, Vite, Tailwind CSS

# ライセンス

MIT License

# 開発者

- [miya | X](https://x.com/miya00907380)
- [miya123123 | GitHub](https://github.com/miya123123)

