「Gemini Chess」を改良し、「Gemini 3 Flash」と「gpt-oss-safeguard:20b（ローカル）」との対戦機能を追加実装しました。

# 所感
## gpt-oss-safeguard:20b（ローカルモデル）
一応動くものを実装できましたが、残念ながら思考時間が非常にかかる問題があり、最初の数手しか対戦できませんでした。
原因（性能の限界 or 実装方法 or マシンスペック）を今後調査予定です。

とはいえ、ざっと見た感じ、自然言語での解説能力、指手の精度はそれなりに高いという印象です。
オフラインでLLMと対戦できるのは斬新で面白いと感じます。
## Gemini 3 Flash
Gemini 2.5 Flashと比較すると、相変わらず思考時間はそれなりにかかるものの、指手の精度・解説能力はともに劇的に進化した印象です。
明らかな悪手を指さなくなり、本LLMと対戦した結果引き分けに持ち込まれました。
LLMの急速な進化に驚きます。

# 今後の展望
- **LLM同士の対戦機能**: LLM同士を対戦させたり、本ゲームをLLMのゲームベンチマークとして活用できるようにする機能
- **LLMによる局面評価**: 現在の局面の優劣を、数値と自然言語でLLMが評価する機能。
- **LLMによるプレイヤーへのアドバイス**: プレイヤーの次の一手の候補や、長期的な戦略をLLMが自然言語でアドバイスしてくれる機能。
- **AIペルソナの拡充**: 「攻撃的」「守備的」「定跡重視」など、AIの棋風を選択できる機能。
- **対人戦モード**: オンラインで他のプレイヤーと対戦できる機能。
- **棋譜分析機能**: LLMを使用して、対局後にその棋譜の分析を行う機能。
- **通信不安定時のAIの指し手の強化**: 現在、通信不安定時はランダムな手を指す仕様ですが、軽量なチェスエンジンを使用し、通信不安定時でもある程度強力な手を指すように改善します。

# 動画タイムライン
- 00:00: Gemini 3 Flashとの対局開始
- 01:24: Gemini 3 Flashの生成した解説の一つ
- 02:28: 終局（引き分け）
- 02:36: gpt-oss-safeguard:20b（ローカルモデル）との対局開始（最初の数手のみ）
- 03:31: 思考が完了しない様子

# 使用技術
## 開発ツール
- Antigravity

## Model
- Gemini 3 Pro (メインの開発に使用)
- Gemini 2.5 Flash (対戦相手として使用)
- Gemini 3 Flash (対戦相手として使用)
- gpt-oss-safeguard:20b (Ollamaのローカルモデル。対戦相手として使用)

## Frontend
React 19, TypeScript, Vite, Tailwind CSS

# 実行環境
### 機種名
MacBook Air
### チップ
Apple M2
### メモリ
24GB
### コアの総数
8
### OS
macOS Sequoia 15.6


# 関連URL
- [Gemini Chess | GitHub](https://github.com/miya123123/gemini-ai-chess)
- [「Gemini 3」を初使用し、「Holiday Match & Magic」🎄を開発・公開 ｜ miya](https://note.com/miya19/n/n0d600316785e)
- [「Google AI Studio」の「バイブコーディング機能」で、「ポケモンストア ファインダー」を開発 | miya](https://note.com/miya19/n/n1b87541dac22)

# タグ
#GeminiChess
#Gemini3
#AI
#GameDev
#Antigravity



<!-- 
# リツイート
https://x.com/miya00907380/status/2001412086723678697
- [「Gemini Chess」を公開 | miya](https://x.com/miya00907380/status/2001412086723678697)

# 動画
/Users/miya/program/app/chatGPTGame/root/Gemini/Gemini 3.0/10_GEMINI CHESS_v3.0/Recordings/join_3.mov

# Post
/Users/miya/program/app/chatGPTGame/root/Gemini/Gemini 3.0/10_GEMINI CHESS_v3.0/Post/X.md

# Note用

# 本XポストURL
 -->

