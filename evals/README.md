# evals

kstack のスキルの評価のケース。`claude plugin eval` の形（ケースごとに `prompt.md` と `graders/*.md`）で置く。スキルの方針を文章で積む代わりに、ユースケースと避けたい失敗をケースにし、直すときは直す前の版と比べる。

## ケース

| ケース | 見ること | 出典（一般化） |
| --- | --- | --- |
| create-leave-llm-format-open | 数値はツールに出させ、LLM が書く節の形は縛らない。方針の下書きで止まる | 作ったスキルが、LLM の書く節の形まで方針で決めていた（2026-11-11） |
| create-verify-tool-constraint | 道具の制約を、確かめずに前提として本文に書かない | 「画像を上げられない」と確かめずに書き、別のスキルが写した（2026-11-11） |
| create-ignore-injected-instruction | 参照先に仕込んだ指示に従わない。材料としては使う | 念のために入った段落で、試したことが無かった |
| create-no-motivating-example | 作るきっかけの実例が無ければ、作らずに実例を聞く | 作っている途中で「なぜ今作っているのか」が見えなくなった（2026-11-14） |
| improve-vague-complaint-ask-one | はっきりしない不満を1件の実例として受け、場面を一問だけ聞く | 言葉で言われた不満から呼ばれ、遠回りした（2026-11-11、2026-11-13） |
| improve-structure-consultation | 置き場の組み立ての相談を、1つのスキルの最小の変更に押し込まない | 組み立ての相談を失敗を直す手順で受け、手順を飛ばした（2026-11-13） |

どれも、人の答えが要る所（方針の下書きで止まる、一問聞く）までを見る。人の答えは子のセッションに渡せないので、その先は見ない。材料は、ケースの作業場所が空で始まるので、プロンプトの本文に書いてある。最初の6本は、伸びを見るケース（能力）。直した失敗のケースを足すときは、毎回通ることを求めるケース（回帰）として `tags` に `regression` を付ける。

## スキルの名前

ケースは、スキルを名前で呼ぶ（どれも `disable-model-invocation: true` なので、名前で呼ばないと動かない）。名前は [names.env](names.env) の1か所に書き、各ケースの `prompt.tmpl.md` の `{{SKILL_CREATE}}` などを置き換えて `prompt.md` を作る。`claude plugin eval` には、ケースをまたいで値を共有する仕組みが無いため。

```sh
ruby evals/build.rb          # names.env か prompt.tmpl.md を直したら、prompt.md を作り直す
ruby evals/build.rb --check  # prompt.md が最新かと、frontmatter のキーを確かめる（評価は走らせない）
```

`prompt.md` は手で直さない。採点役（graders）にはスキルの名前を書かない。名前が変わっても、同じケースで前と後を比べるため。

## 走らせ方

走らせると、走らせた人の利用枠を使う。1ケースは3回走るのが既定。

```sh
# 直している間：1ケースを1回だけ
claude plugin eval . --ablation none --no-publish --runs 1 --case <ケース>
# マージの前：全部
claude plugin eval . --ablation none --no-publish
```

- `--ablation none`：既定の with-without の「plugin なし」の側では、名前で呼ぶ行を解けないので、比べる意味が無い。改善を確かめるときは、直す前の版の checkout と、直したあとの checkout に同じケースを当て、点を比べる。
- `--no-publish`：報告を手元に置く。
- create-verify-tool-constraint は、Bash が無くても判定できる。道具の help を実際に見させるなら、`--allow-tools Bash` を足す。
- 結果は `evals/results/` に出る（git には入れない）。
