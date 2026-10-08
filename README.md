# SEAKOBAN（ぷかばん） 🌊📦

**FLOAT • PUSH • DOCK** | A tiny five-by-five ocean Sokoban.

> 荷物を押すと、何かにぶつかる直前まで流れる。ほかの荷物をブレーキにしよう。

- 小型船を矢印/WASD、スワイプ、方向ボタンで操作。
- 押された荷物は海域の端か別の荷物の直前まで直進。
- 係留ブイは通過する。**そのマスで停止した場合だけ固定**される。
- 係留済みの荷物も、ほかの荷物を止めるブレーキになる。
- 10問、UNDO、RETRY、ステージ選択、クリア記録、効果音ON/OFF。
- v0.1では海流・重量差・物理演算を実装しません。すべて論理的に決定します。

## Run

静的サイトなので `index.html` を静的Webサーバーで配信すれば遊べます。

```sh
npm start           # http://localhost:5173
npm test            # ルールと10問のテスト
npm run validate    # 全10問BFS
```

Node.js 22+推奨。ライブラリ/ビルド/有料素材不要。

## Publish

GitHub → Settings → Pages → Deploy from a branch → `main` / `(root)`。有効化後に `https://madowaku.github.io/seakoban/` で公開可能です。自動公開の有効化は別途必要です。

## QA

`docs/VALIDATION_v0.1.md` 参照。自動テストとソルバーは確認済みですが、Android実機操作・人間の10問通しプレイは未検証です。
