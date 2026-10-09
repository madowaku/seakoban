# SEAKOBAN（ぷかばん） 🌊📦

**FLOAT • PUSH • DOCK** | A tiny five-by-five ocean Sokoban.

> 荷物を押すと、何かにぶつかる直前まで流れる。ほかの荷物をブレーキにしよう。

- 小型船を矢印/WASD、スワイプ、方向ボタンで操作。
- 押された荷物は海域の端か別の荷物の直前まで直進。
- 係留ブイは通過する。**そのマスで停止した場合だけ固定**される。
- 係留済みの荷物も、ほかの荷物を止めるブレーキになる。
- 20問（Stage 001〜020）、UNDO、RETRY、ステージ選択、クリア記録、効果音ON/OFF。
- v0.1では海流・重量差・物理演算を実装しません。すべて論理的に決定します。

## Run

静的サイトなので `index.html` を静的Webサーバーで配信すれば遊べます。

```sh
npm start           # http://localhost:5173
npm test            # ルールと20問のテスト
npm run validate    # 全20問BFS
```

Node.js 22+推奨。ライブラリ/ビルド/有料素材不要。

## Publish

GitHub → Settings → Pages → Deploy from a branch → `main` / `(root)`。有効化後に `https://madowaku.github.io/seakoban/` で公開可能です。自動公開の有効化は別途必要です。

## QA

`docs/VALIDATION_v0.1.md` 参照。自動テストとソルバーは確認済みですが、Android実機操作・人間の10問通しプレイは未検証です。

## Stage Pack 011–020 (v0.2)

Stage 006の「箱がないと止まれない」という発見を、仮止め・係留順・ブレーキ連鎖へ発展させた10問です。Stage 011〜015は3箱、016〜020は4箱。新ギミックはありません。

既存の保存データを引き継ぎ、Stage 010クリア済みならStage 011を自動解放します。リロード時は現在の最新開放ステージから開始。全20問の解答性はソルバーで検査できます。

- [Stage Pack 011–020 / 各盤面・検証結果](docs/STAGE_PACK_011-020_v0.2.md)
- Stage 020の最短手数は長め。実機での体感に応じて差し替え予定。
