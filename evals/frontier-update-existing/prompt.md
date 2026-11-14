---
description: 今ある設計書と仕様書（JSON）を更新する。依頼の変更だけを、足す・変える・消す・名前を変えるの差分で返し、依頼に無いノードや矢印を変えない。決まっていない値は推測で埋めずに未決の問いに置く。持ち主の決め（2026-11-14）：流れを変えるときは仕様書（と必要なら設計書）を直して図を作り直し、差分と未決の問いを返す
tags: [frontier, capability]
max_turns: 15
allowed_tools: [Read, Glob, Grep, Skill]
---

/kstack:create-frontier-team 架空の家計簿アプリのチームの流れを更新して。今の設計書と仕様書は下のとおり。

変えたいこと：

- 検証の段に CI ができた。GitHub Actions で統合テストを走らせ、0 で終われば通す。
- PR のレビューに使うスキルを、pr-review から code-check に替えた（中身は同じ）。

CI の待ち時間の上限は、まだ決めていない。

## 今の設計書（docs/frontier-team/design.md）

- なぜこの流れか：エンジニアごとに頼み方が違い、作りがぶれる。PR が 1 本ずつしか進まない。
- 役割：プロダクトオーナー 1 人（決める役）、テックリード 1 人（決める役）、エンジニア 2 人。
- 範囲の外：リリースと運用の流れは扱わない。
- 成功の定義：チケットが同時に 2 本以上、実行のセッションで進んでいる。
- 未決の問い：デプロイの頻度の目標（プロダクトオーナーが決める）。

## 今の仕様書（docs/frontier-team/spec.json）

```json
{"team":"家計簿","repo":"example/kakeibo",
 "roles":[{"id":"po","name":"プロダクトオーナー","people":1,"decides":true},{"id":"tl","name":"テックリード","people":1,"decides":true},{"id":"eng","name":"エンジニア","people":2}],
 "tools":[{"id":"notion","name":"Notion"},{"id":"linear","name":"Linear"},{"id":"github","name":"GitHub"}],
 "nodes":[
  {"id":"principles","stage":"intent","role":"po","title":"方針を書く","skills":["team-principles"],"session":"plan","layer":"upstream","kind":"work","tools":["notion"],"output":"方針のページ"},
  {"id":"spec","stage":"spec","role":"po","title":"仕様書を書く","skills":["spec-writer"],"session":"plan","layer":"upstream","kind":"work","tools":["notion"],"output":"仕様書"},
  {"id":"split","stage":"tickets","role":"tl","title":"チケットに分け、依頼を書く","skills":["ticket-split"],"session":"plan","layer":"task","kind":"split","tools":["linear"],"output":"チケットと依頼"},
  {"id":"run","stage":"run","role":"eng","title":"チケット 1 つを実装する","skills":["run-ticket"],"session":"run","layer":"task","kind":"work","check":"テストが 0 で終わる","tools":["github"],"output":"PR"},
  {"id":"review","stage":"pr","role":"eng","title":"PR をレビューする","skills":["pr-review"],"session":"run","layer":"task","kind":"gate","risk":"wide","check":"指摘が 0","tools":["github"]},
  {"id":"verify","stage":"verify","role":"eng","title":"検証","skills":[],"layer":"task","kind":"gate","risk":"wide","gap":"検証のスキルも CI も無い"},
  {"id":"merge","stage":"verify","role":"tl","title":"マージを決める","skills":[],"session":"human","layer":"task","kind":"gate","risk":"irreversible","human":true,"tools":["github"]},
  {"id":"eval","stage":"eval","role":"tl","title":"評価して学びを返す","skills":[],"session":"plan","layer":"task","kind":"work","gap":"評価のスキルが無い"}],
 "edges":[
  {"from":"principles","to":"spec","kind":"data","label":"方針のページ"},
  {"from":"spec","to":"split","kind":"data","label":"仕様書"},
  {"from":"split","to":"run","kind":"data","label":"依頼"},
  {"from":"run","to":"review","kind":"data","label":"PR"},
  {"from":"review","to":"run","kind":"fix","label":"指摘"},
  {"from":"review","to":"verify","kind":"data","label":"レビュー済みの PR"},
  {"from":"verify","to":"merge","kind":"data","label":"検証済みの PR"},
  {"from":"merge","to":"eval","kind":"data","label":"マージの記録"},
  {"from":"eval","to":"split","kind":"learn","label":"分け方の直し"}]}
```

この作業場所には書き込めないので、ファイルは書かずに、差分と、直したあとの仕様書の全文を返答に出して。
