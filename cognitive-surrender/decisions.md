# cognitive-surrender の決定の記録

cognitive-surrender を、create-intent-skill の手順で作ったときの記録（2026-11-11）。理由は [policy.md](policy.md) の項目番号（P1〜P6）で書く。要旨は、そのルールが cognitive-surrender で何を決めるかを、こちらの言葉で書いたもので、原文の訳ではない。

## 0. 要求を疑った結果（create-intent-skill の手順1の2）

既存のもので済むかを先に確かめた。retro の類は、つまずきが履歴に残ったもの（人の訂正、やり直し、失敗した道具）から学ぶ。improve-intent-skill は、起きた失敗からスキルを直す。どちらも、通ってしまって履歴に残らない候補は見ない。メモリの1行や lint は、何を見るかを決めないので代わりにならない。そこで、新しいスキルを作る。

任せた度合いの数（P3）は、モデルに写させると正しさを守れないので、数は手元の記録の道具の出力だけを使う（create-intent-skill の手順1の2の下の項目）。道具の使い方は local.md に書く。

## 1. 参照先

用語と兆しの出典として、持ち主が記事を1件加えた（AO）。ほかは agent-taxonomy の [Retro](https://agent-taxonomy.kawaida-dev.com/j/retro/) と、確かめの側の JOB から選んだ。[Verification](https://agent-taxonomy.kawaida-dev.com/j/verification/) の JOB には、文脈を持たない別の役に確かめさせるエントリが無かった。そこで、それを持つ [Code review](https://agent-taxonomy.kawaida-dev.com/j/code-review/) の JOB から選んだ。agent-taxonomy のエントリは、2026-11-11 の版で読んだ。上流の原文は、2026-11-11 に既定のブランチの先頭の commit で固定して読んだ。

| ID  | 参照先 | 読んだもの（commit を固定） | 選んだ理由 |
| --- | --- | --- | --- |
| AO  | Addy Osmani「Cognitive Surrender」（2026-05-05 公開） | [記事](https://addyosmani.com/blog/cognitive-surrender/)（2026-11-11 に読んだ版。ブログのソースは commit で固定できない） | 任せると明け渡すの区別（policy.md の用語）と、明け渡しの兆し（P2 の選ぶ材料）の出典。持ち主が加えた（2026-11-11） |
| DD  | addyosmani-agent-skills / doubt-driven-development | [SKILL.md @301b02b](https://github.com/addyosmani/agent-skills/blob/301b02b12bff98e4688e6984af6556802322bbde/skills/doubt-driven-development/SKILL.md) | 文脈を持たない確かめ役に、結論を渡さず成果物と約束だけを渡す型。P2 の確かめ役への渡し方に、いちばん直接に効く |
| DS  | superpowers / diagnosing-superpowers | [SKILL.md @22f0b46](https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/diagnosing-superpowers/SKILL.md) | セッションの記録を読み、場所を示せない指摘を捨て、数を記録か実行したコマンドからだけ出す。人の言葉と hook などの出力を分ける。P2・P3・P4 の、記録から候補を選ぶ部分に効く |
| FR  | screenpipe / screenpipe-focus-review | [SKILL.md @79c05c3](https://github.com/screenpipe/screenpipe/blob/79c05c3fcef76e53d5c55be9d9dd7eb06f5ad170/crates/screenpipe-core/assets/skills/screenpipe-focus-review/SKILL.md) | 人の振る舞いを点数にせず、記録の欠けを先に確かめ、傾向と小さな工夫を1つずつだけ返す。P1 の小ささと、非目標（採点しない、任せることを責めない）に効く |
| PE  | product-engineering / retro | [SKILL.md @bdb2389](https://github.com/phuryn/product-engineering/blob/bdb2389c7636f6615c37fd66dd8518986284ec01/agent-harness/skills/retro/SKILL.md) | P5 の渡し先の1つで、受け取る形（起きた時点の付いた項目）が分かる。境界の非目標の線を引く相手 |

選ばなかったもの：

- mattpocock-skills / retro（Retro）：PE と同じく渡し先・境界の相手で、改善の候補を示すところで止まる点だけが違う。受け取る形がはっきりしている PE に寄せた。
- claude-reflect（Retro・Memory）：人の訂正をフックで拾って規約ファイルに書く。材料が履歴に残った訂正なので、非目標の1番目（retro の仕事）に当たる。
- hermes-agent / requesting-code-review（Code review）：文脈を共有しない確かめ役に差分だけを渡す点は DD と同じ主張。結論を渡さない点まで書いている DD に寄せた。
- addyosmani-agent-skills / code-review-and-quality（Code review）：証拠の無い承認をしない、指摘が無いのも正しい結果とする、の2点を持つ。前者は AO の兆しと同じ主張、後者は DD の確かめ役の指示（見つからなければそう言う）と同じ主張なので、それぞれに寄せた。
- elephant-goldfish-model / egm-review（Code review）：対象が書き上がった設計文書で、通ったものを後から抜き取る P2 とは場面が違う。
- superpowers / verification-before-completion：終わったと言う前に証拠を示す。AO の対策（終わりの条件に証拠を求める）と同じで、このスキルでは行わず渡し先に添えるもの（P5）。
