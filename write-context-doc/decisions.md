# write-context-doc の決定の記録

write-context-doc を、create-intent-skill の手順で作ったときの記録（2026-11-13〜14）。理由は [policy.md](policy.md) の項目番号（P1〜P4）と、[共有の方針](https://github.com/degwinthegreat/skills/blob/main/create-intent-skill/shared-policy.md)の S1〜S3 で書く。要旨は、そのルールが write-context-doc で何を決めるかを、こちらの言葉で書いたもので、原文の訳ではない。

## 0. 要求を疑った結果（create-intent-skill の手順1の2）

既存のもので済むかを先に確かめた。

- 規約の文書を書くスキル（下の参照先の GA と PE）は、割れている論点の片側に決めている。たとえば GA は理由を書かない側、上限を 60〜100 行に決める側。チームに決めさせる形を持たない。
- 文書の書き方の参照（MW）は、規約とスキルの書き方には効くが、仕様の「変えてはいけないもの」や完了の条件を、差し戻せる形のチェックとして持たない。
- 規約と仕様をまとめて扱い、文書の種類を表で足せるものは無かった。
- メモリの1行や lint は、チームの決めごとを聞く手順を持たないので代わりにならない。ただし、長さの上限（C2）のように機械で判定できるものは、チームのリポジトリで検査にする候補として扱う（C10）。

そこで、新しいスキルを作る。スキルの SKILL.md を書くことは、create-intent-skill と improve-intent-skill の仕事なので、対象にしない（policy.md の非目標）。

## 1. 参照先

agent-taxonomy（2026-11-14 の [llms.txt](https://agent-taxonomy.kawaida-dev.com/llms.txt)）の Bottlenecks の「Team knowledge」から、[Context engineering](https://agent-taxonomy.kawaida-dev.com/j/context-engineering.md) の JOB を開き、比較の表から選んだ。上流の原文は、2026-11-14 に既定のブランチの先頭の commit で固定して読んだ。MW・PE・AI は、agent-taxonomy が分析した commit（MW は 4ae2317、PE は 061014f、AI は 161ddb8）より上流が進んでいた。読んだファイルの blob は、分析した commit と先頭とで同じだった（S2）。

| ID  | 参照先 | 読んだもの（commit を固定） | 選んだ理由 |
| --- | --- | --- | --- |
| MW  | [mattpocock-skills / writing-for-agents](https://agent-taxonomy.kawaida-dev.com/e/mattpocock-skills.writing-for-agents.md) と domain-modeling | [writing-for-agents/SKILL.md](https://github.com/mattpocock/skills/blob/5863806dd4e15c63174bee4e7515a4256792ecfa/skills/productivity/writing-for-agents/SKILL.md)・[domain-modeling/SKILL.md](https://github.com/mattpocock/skills/blob/5863806dd4e15c63174bee4e7515a4256792ecfa/skills/engineering/domain-modeling/SKILL.md) @5863806 | エージェントが読む文書の書き方の一般論（正本を1つにする、環境の写しを持たない、判定できる完了の条件、禁止より望む振る舞い）。用語を1つに決める型は、同じ作者の domain-modeling にあるので1件にした |
| GA  | [getsentry-skills / agents-md](https://agent-taxonomy.kawaida-dev.com/e/getsentry-skills.agents-md.md) | [skills/agents-md/SKILL.md @e94f222](https://github.com/getsentry/skills/blob/e94f22214528d69899d09c627b3315ddc3544816/skills/agents-md/SKILL.md) | 規約のファイルを短く保つ型（行数の目安、写さずにパスの表で指す、設定を言い直さない）。割れている論点の片側（上限の数、理由を書かない）の出典 |
| PE  | [product-engineering / agent-instructions](https://agent-taxonomy.kawaida-dev.com/e/product-engineering.agent-instructions.md) | [agent-harness/skills/agent-instructions/SKILL.md @50ee90f](https://github.com/phuryn/product-engineering/blob/50ee90fe47b538a0522b7fd35972f52b200f4515/agent-harness/skills/agent-instructions/SKILL.md) | 入口を作業の場面から引く表にする型、ファイルごとの上限を検査で守る型、規則にきっかけと見直しの日を付ける型、記憶に頼る規則を検査にする型 |
| AI  | [aidlc-workflows](https://agent-taxonomy.kawaida-dev.com/e/aidlc-workflows.md) のガイド | [08-knowledge.md](https://github.com/awslabs/aidlc-workflows/blob/50a9e926c38fc8a24b386c656f8102fd1034d403/docs/guide/08-knowledge.md)・[09-rules-and-the-learning-loop.md](https://github.com/awslabs/aidlc-workflows/blob/50a9e926c38fc8a24b386c656f8102fd1034d403/docs/guide/09-rules-and-the-learning-loop.md)・[technical-environment-guide.md](https://github.com/awslabs/aidlc-workflows/blob/50a9e926c38fc8a24b386c656f8102fd1034d403/docs/guide/writing-inputs/technical-environment-guide.md)・[vision-document-guide.md](https://github.com/awslabs/aidlc-workflows/blob/50a9e926c38fc8a24b386c656f8102fd1034d403/docs/guide/writing-inputs/vision-document-guide.md) @50a9e92 | 規則と知識を分ける物差し（破ればレビューで差し戻すか）、使ってはいけないものに理由と代わりを並べる型、手本を名指しで指す型、仕様の「変えてはいけないもの」 |
| KS  | [kiro-steering](https://agent-taxonomy.kawaida-dev.com/e/kiro-steering.md) | [kiro.dev/docs/steering](https://kiro.dev/docs/steering/)（ページの更新日 2026-10-21 の版を、2026-11-14 に読んだ。公開のソースが無いので commit では固定できない） | 規約の書き方の指針（理由を書く、例と前後の比較を載せる、生きたファイルを指す）。割れている論点の反対側の出典。製品の設定の書き方は持ち込まない（P4） |

選ばなかったもの：

- cursor / cursor-rules（Context engineering）：効かせ方の宣言と、ファイルを指す型は、KS と同じ主張。製品の設定の書き方は非目標（P4）なので、1件にまとめて KS に寄せた。原文は読んでいない。
- addyosmani-agent-skills / context-engineering（Context engineering）：規則のファイルの雛形。禁止形の境界の節は T2 の材料になりうるが、AI の命令形の規則と同じ側の主張なので AI に寄せた。原文は読んでいない。
- aidlc-workflows / aidlc-knowledge（Context engineering）：要約を読んだ版に結び付ける型。文書の鮮度の管理で、推す原則の外。
- anthropics-skills / skill-creator：理由の説明を勧める側の出典になりうるが、スキルの書き方の参照で、対象（規約と仕様）から遠い。理由の論点は KS と GA で両側がそろう。

## 2. ルールごとの採否

判定は4通り：採る、直して採る、まとめる（ほかの行と同じ主張なので、その行に寄せる）、捨てる。加えて、割れている論点の片側にあたるものは「論点」とし、SKILL.md の T1〜T5 の出典にした（P2）。

| ID   | write-context-doc で決めること | 判定 | 理由 |
| ---- | --- | --- | --- |
| MW1  | 同じ意味を1か所にだけ書くか | 採る | P1。C1 |
| MW2  | 環境を見れば分かることを書かず、見ても分からない選択・理由・落とし穴だけを書くか | 論点 → T5 | P2。AI4・AI9 と食い違う。推奨はこちらの側 |
| MW3  | 手順やタスクの終わりに、判定できる完了の条件を置くか | 直して採る | P1。C3。仕様の完了の条件に絞った |
| MW4  | 禁止より望む振る舞いを書き、禁止しか書けないときは対にするか | 論点 → T2 | P2。AI8 と食い違う。推奨はこちらの側 |
| MW5  | 道しるべの1行の言葉選びで、いつ開かれるかが決まるか | まとめる → PE1 | C4 の「作業の場面から引く」に寄せた |
| MW6  | 毎回読まれるものは、使わなくても負担になるか | まとめる → PE3 | C2 の理由 |
| MW7  | すべての場合に要るものだけを本文に置き、一部だけが要るものは外に出して指すか | まとめる → AI1 | C5 で、規則と知識の置き場を分ける形に寄せた |
| MW8  | 言われなくてもモデルがやることを書いた文を、文ごと消すか | 捨てる | P1。判定にモデルの既定を試す手間が要り、あるかないかで判定できない |
| MW9  | 概念を1語に託すか | 捨てる | P1。差し戻せる形にならない |
| MW10 | 用語を1つに決めて用語集に置き、食い違う語を指摘するか（domain-modeling） | 直して採る | P1。C9。用語集を作る手順は持たず、あればその語を使う、にした |
| GA1  | 規約のファイルを 60 行を目安に、100 行を超えないようにするか | 論点 → T1 | P2。数は割れる。PE3 は数を置かず、今の長さから始める。推奨は PE3 の形に、新しく書くときの数として GA1 の上限を添えた |
| GA2  | ほかの文書を写さず、パスの表で指すか | まとめる → MW1・PE1 | C1 と C4 |
| GA3  | 2つの入口のファイルを別々に持たず、片方をもう片方へのリンクにするか | まとめる → MW1 | C1。リンクの作り方は製品ごとなので書かない（P4） |
| GA4  | linter などの設定を言い直さないか | 論点 → T5 | P2。MW2 と同じ側 |
| GA5  | 理由は、ありそうな誤りを防ぐときだけ書くか | 論点 → T3 | P2。KS2 と食い違う。推奨に、ありそうな誤りを防ぐ理由だけは本文に一言、として残した |
| GA6  | 下の階層のファイルは、ルールが違うときだけ作り、近いファイルが勝つか | 捨てる | 解決したいことに直接役立たない。範囲の勝ち負けは推す原則の外 |
| GA7  | 書いたパスとコマンドが実在するかを確かめるか | 採る | P1。手順2の2 |
| GA8  | 挨拶や一般的な標語を書かないか | 捨てる | create-intent-skill の P2。モデルが言われなくてもやる |
| PE1  | 入口のファイルは要約せず、作業の場面・落としやすい決まり・開く所の表にするか | 採る | P1。C4 |
| PE2  | 下の層の手順を上の層に写さないか | まとめる → MW1 | C1 |
| PE3  | ファイルごとの長さの上限を1か所に持ち、検査で守るか | 直して採る | P1。C2。単位と数はチームが決める（T1）。上限の置き場と検査の書き方は書かない（P4） |
| PE4  | 毎回効かせる規則は、入れる条件と数の上限を持ち、1つ足すなら1つ外すか | まとめる → PE3・AI1 | C2 と C5 |
| PE5  | 足した規則に、きっかけの出来事か人の言葉と日付、見直しの日を付けるか | 直して採る | P1。C8。置き場は T3 に従わせた（P2。理由を本文に書かない側に決めても食い違わないように） |
| PE6  | 決める時点の記憶に頼る規則を、検査・スクリプト・必須の引数にするか | 直して採る | P1。C10。はい・いいえで判定できる規則に絞った |
| PE7  | 判断を要する原則まで検査にしないか | 採る | P1。C10 の2文目 |
| PE8  | 変えたら、新しいセッションに固有の規則を言わせて、読み込まれたかを確かめるか | 捨てる | 推す原則の外。読み込みの確かめ方は製品ごとに違う（P4）。4節の検証で使う余地を残す |
| PE9  | 規則の文を消すのは持ち主だけか | 直して採る | P2。手順3の見直しで、消す直しは提案にとどめ、人が決める |
| PE10 | 規則の本文は短くし、理由と出来事は別のファイルに置いて指すか | 論点 → T3 | P2。推奨にした |
| AI1  | 規則（破ればレビューで差し戻す）と知識（背景として読む）を分け、規則は短くするか | 採る | P1。C5 |
| AI2  | 使ってはいけないものを、禁止・理由・代わりの表で書くか | 直して採る | P1・P2。C11（例外として足した。下書き）。代わりは必ず並べる。理由の置き場は T3、書く形は T2 に従わせた |
| AI3  | 手本は動き、テスト付きで、文書から名指しで指し、古いものに印と後継を付けるか | 直して採る | P1・P2。C6。指すか載せるかは T4 に従わせた |
| AI4  | 既存のものに手を入れるとき、変えてはいけないものを書くか | 採る | P1。C7 |
| AI5  | 範囲の外を、範囲の内と同じ重さで書くか | 捨てる | 推す原則の外。使ってみて同じ抜けが2回起きたら足す（create-intent-skill の P4） |
| AI6  | 未決の問いを書くか | 捨てる | AI5 と同じ |
| AI7  | 試せる成功の条件と完了の定義を書くか | まとめる → MW3 | C3 |
| AI8  | 規則を「必ず」「決して」の短い命令形で書くか | 論点 → T2 | P2。MW4 と食い違う |
| AI9  | 技術環境の文書に、言語と版、パッケージマネージャーなどを書くか | 論点 → T5 | P2。MW2 と食い違う |
| AI10 | 決まった時期に、古い知識を刈り込むか | 捨てる | 推す原則の外。AI5 と同じ |
| AI11 | 人の訂正から学んだ規則に、日付を付けて足すか | まとめる → PE5 | C8 |
| AI12 | 決まった検査（センサー）で、出力を確かめるか | まとめる → PE6 | C10 |
| KS1  | 1ファイルに1つの領域を書き、名前で中身が分かるようにするか | 捨てる | P1。判定に読み手の判断が要る |
| KS2  | 決まりに、なぜそう決めたかを書くか | 論点 → T3 | P2。GA5 と食い違う |
| KS3  | コード片と前後の比較を載せるか | 論点 → T4 | P2。AI3 の指す側と食い違う。推奨に、短い前後の比較だけは載せてよい、として残した |
| KS4  | 生きたファイルを参照して、規約を最新に保つか | まとめる → AI3 | C6。参照の構文は書かない（P4） |
| KS5  | 秘密の値を書かないか | 捨てる | create-intent-skill の P2。モデルが言われなくてもやる |
| KS6  | 規約の変更を、コードと同じくレビューに通すか | 捨てる | 推す原則の外。配り方は製品ごとに違う（P4） |
| KS7  | 文書ごとに、いつ読まれるかを宣言するか | 捨てる | 宣言の書き方は製品の設定（P4）。毎回読まれるかは C2 の対象を決めるときに見る |
| KS8  | 範囲が重なったとき、狭い範囲が勝つか | 捨てる | GA6 と同じ |

採ったルールは、SKILL.md では短い指示にして置いた。理由はこの表にだけある。

推す原則の10個は、C1〜C10 に当たる（C1：MW1、C2：PE3、C3：MW3、C4：PE1、C5：AI1、C6：AI3、C7：AI4、C8：PE5、C9：MW10、C10：PE6）。例外の1つは C11（AI2）。

## 3. 形（/principles の判断の手順を上から当てた結果）

1. 機械で判定できるもの：C2（長さの上限）と、手順2の2（パスとコマンドの実在）。どちらも、使うチームのリポジトリで検査にするものなので、このスキルには作らない。C2 と C10 で、検査にする候補として書かせる。このスキル自身の検査は、同じ抜けが2回起きてから考える（create-intent-skill の P3、P4）。
2. 分岐の条件（入口で対象外の種類を止める、チームの決めごとが無い論点を聞く、見直しで消す直しを提案にとどめる）は、SKILL.md の本文に置いた。
3. 毎回要る事実は無い。常に読み込まれるメモリには何も追加しない。
4. 文書の種類の表と論点の表は、どの実行でも読むので本文に置いた（P3）。手元の道具だけで使う手順は無いので、local.md は持たない。
5. 共有するもの：共有の方針 S1〜S3 は、GitHub の URL で指す。SKILL.md の本文は、ほかのスキルのファイルを読まない。そのため、1つだけで入れても動く（README）。
6. サブエージェントは使わない。
7. 適用されたかは、返答の4つ（とくに、チームが決めた論点と推奨のまま進めた論点、差し戻したチェックの件数）で見える。

起動のされ方：手動でだけ（`disable-model-invocation: true`）。このリポジトリのほかのスキルと同じく、人が名前で呼ぶ。下書き。規約のファイルを直すたびにモデルが呼ぶ形にする案もあるが、description が毎回読まれる負担と、意図しない場面での起動を避けた。

SKILL.md 自身の概念の圧縮：新しい語は「規約」「仕様」と、チェックの ID（C1〜C11）、論点の ID（T1〜T5）だけ。「規約」は持ち主の言葉に合わせた。

## 4. どう検証するか

3回使ったら、差し戻したチェックのうち、チームがそのまま直した数と、チームが当たらないと退けた数、推奨のまま進めた論点の数を見て、見直す（この値と時期は下書き）。

本文の読み手のテストは、まだしていない。
