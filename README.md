# Gemini Chess

LLM（Gemini）との対話型のチェスゲームです。
プレイヤーは白番を持ち、LLMが黒番として対戦します。
AIは単に手を指すだけでなく、その手を選んだ理由を日本語で解説します。

# デモページ
[Gemini Chess | GitHub Pages](https://miya123123.github.io/gemini-ai-chess/)

# 主な機能
- **AI対戦**: Gemini 2.5 Flashとの対戦が可能です。
- **解説機能**: AIが手を指すたびに、なぜその手を選んだのかを日本語で解説します。
- **難易度調整**: BeginnerからGrandmasterまで4段階の調整が可能です。
- **クリック＆タップ操作**: クリック（タップ）で移動元・移動先を選択するシンプルな操作方法です。
- **待った/リセット**: 一手前/初期配置に戻すことができます。

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

# 今後の展望

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
- Gemini 2.5 Flash (対戦相手として使用)
- gpt-5.1-codex-max (軽微なバグ修正にサブとして使用)

## Frontend
React 19, TypeScript, Vite, Tailwind CSS

# ライセンス

MIT License

# 開発者

- [miya | X](https://x.com/miya00907380)
- [miya123123 | GitHub](https://github.com/miya123123)

