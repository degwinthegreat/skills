# improve-intent-skill の決定の記録

improve-intent-skill を、create-intent-skill の手順で作ったときの記録（2026-11-11）。理由は [policy.md](policy.md) の項目番号（P1〜P7）で書く。要旨は、そのルールが improve-intent-skill で何を決めるかを、こちらの言葉で書いたもので、原文の訳ではない。

## 0. 要求を疑った結果（create-intent-skill の手順1の2）

新しいスキルが要るかを先に確かめた。anthropics の skill-creator にも、既存のスキルを直す流れはある。ただしそれは、試しの依頼をスキルあり・なしで並べて走らせ、人が評価する流れで、policy.md の非目標に当たる。また、起きた失敗の記録から始めて「削る → 直す → 足す」の順に当てる手順と、policy.md・decisions.md の形を持たない。create-intent-skill に節を足す案もあったが、持ち主が別のスキルにすると決めた（P6）。

## 1. 参照先

agent-taxonomy の [Skill authoring](https://agent-taxonomy.kawaida-dev.com/j/skill-authoring/) と [Retro](https://agent-taxonomy.kawaida-dev.com/j/retro/) の JOB から選んだ。概念の圧縮のよい例として、持ち主が挙げた mattpocock の chief-of-staff（agent-taxonomy では Orchestration と Memory の JOB に載っている）も候補に入れて比べた。

| ID  | 参照先 | 読んだもの（commit を固定） | 選んだ理由 |
| --- | --- | --- | --- |
| SC  | anthropics-skills / skill-creator | [SKILL.md @2c5958e](https://github.com/anthropics/skills/blob/2c5958ecac7cee2b583967a2c4981d0f4a75c579/skills/skill-creator/SKILL.md) の「Improving the skill」 | スキルを直すときの考え方と、直したあとにやり直すループの標準形。P5 と非目標（並べて採点しない）の線を引く相手 |
| RT  | mattpocock-skills / retro | [SKILL.md @4ae2317](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/retro/SKILL.md) | 終わった作業の記録から改善の候補を探す観点を持つ。原因がスキルの外（規約ファイル、検査、道具）にある場合の切り分けに使う |
| DS  | superpowers / diagnosing-superpowers | [SKILL.md @22f0b46](https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/diagnosing-superpowers/SKILL.md) | 記録の場所を示せない指摘を捨てる、数値は記録から出す、という証拠の扱い。P2（起きたことだけ）にいちばん近い |
| WFA | mattpocock-skills / writing-for-agents と chief-of-staff | [writing-for-agents/SKILL.md](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/productivity/writing-for-agents/SKILL.md)・[chief-of-staff/SKILL.md](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/in-progress/chief-of-staff/SKILL.md) @4ae2317 | 概念の圧縮（P3）の規則を writing-for-agents が持ち、chief-of-staff はそれを当てた例（少ない太字の語で行動を束ね、ほかのスキルと同じ語を使う）。同じ作者の同じ考え方なので、1件にまとめた |
| PR  | agent-taxonomy / [principles](https://agent-taxonomy.kawaida-dev.com/principles/) の「Writing a skill」 | [/principles/#authoring](https://agent-taxonomy.kawaida-dev.com/principles/#authoring)（2026-11-11 に読んだ版。サイトのソースは公開していないので commit では固定できない） | 形を決める判断の手順。create-intent-skill と同じものを使う（P6） |

選ばなかったもの：

- claude-reflect（Skill authoring・Retro）：人の言い直しをフックで拾って規約ファイルに書く。材料の種類は P2 で決まっていて、フックで集める仕組みは P3 の5段目（仕組みにする）に当たるので、同じ失敗が2回起きる前には入れない。
- screenpipe / screenpipe-durable-learning（Skill authoring・Retro）：訂正を手元のスキルに変える。作る前に既存のスキルを当たる点は RT・SC と同じ主張で、足すものが無い。
- superpowers / writing-skills、codex / skill-creator、deer-flow / skill-reviewer など、Skill authoring のほかのエントリ：新しく作る側か、公開の審査の側で、起きた失敗から直す手順を持たない（非目標の「新しく作ること」）。
- screenpipe の worklog・focus-review・workflow-* など、Retro のほかのエントリ：対象が作業の記録や作業の流れで、スキルの本文ではない。

## 2. ルールごとの採否

判定は4通り：採る、直して採る、まとめる（ほかの行と同じ主張なので、その行に寄せる）、捨てる。

| ID   | improve-intent-skill で決めること | 判定 | 理由 |
| ---- | --- | --- | --- |
| SC1  | 1回の不満に合わせた細かい直しや、強い命令の語を足すか | 直して採る | P2・P3。1回の失敗をそのまま規則にしない。足す前に、削る・移す・直すを当てる |
| SC2  | 出力だけでなく作業の記録を読み、無駄を生んでいる部分を消すか | 採る | P2・P3 の1〜2段目。失敗を集める手順2で記録を読み、手順3で消す側から当てる |
| SC3  | ルールに理由を添えるか | 直して採る | create-intent-skill の SC5 と同じ決め方（P6）。本文は指示だけ、理由は decisions.md |
| SC4  | 何度も同じ手作業が出たら、スクリプトにして同梱するか | 直して採る | P3 の5段目。同じ手作業が2回起きてから |
| SC5  | 直したら、全部の試しをスキルあり・なしで走らせ直し、人の評価を待って繰り返すか | 直して採る | P5 と非目標。失敗した場面だけを、直したスキルで1回やり直す。並べず、採点もしない |
| SC6  | 既存のスキルを直すとき、元の版を写して比べる基準にするか | 捨てる | git の履歴で足りる（WFA5）。decisions.md の見直しの節に日付を書けば、直す前の版は履歴でたどれる |
| SC7  | 起動されるかを試す問いの組で description を調整するか | 捨てる | P2。起動されない失敗が実際に2回起きたら、手順3で原因として扱う |
| RT1  | 対象の作業の一次の記録（セッションの記録、プルリクエスト）を読むか | 採る | P2。手順2で読む |
| RT2  | 原因がスキルの外（規約ファイル、検査、道具、情報が届かないこと）にあるか | 直して採る | P3 の前に置く。外にあれば、そこを直す提案をして、スキルは変えない（create-intent-skill の手順1の2と同じ立場） |
| RT3  | 機械で判定できる違反は、文章の規則ではなく検査にするか | まとめる → PR1 | |
| RT4  | 候補を重い順に人に見せ、どれを直すかは人が決めるか | 直して採る | P7・譲る順の1番目。失敗と回数を添えて人に見せ、OK をもらってから直す。他人のスキルを黙って書き換えない |
| RT5  | 規約の強制を、実装の側ではなくレビューの側に任せるか | 捨てる | 解決したいことに役立たない。スキルの本文を直す話ではない |
| DS1  | 失敗ごとに、記録の場所を示せるか | 直して採る | P2。失敗ごとに出典（プルリクエストのコメントの URL、セッションの記録の場所、commit）を付ける。付かないものは数えない |
| DS2  | 回数は、記録か走らせたコマンドから出すか | 採る | P2。記憶や推測で回数を書かない |
| DS3  | 人の言葉として数えるのは、人が書いたものだけか | 採る | P2。却下・言い直しを数えるとき、フックの出力やツールの結果、親のエージェントの指示を人の言葉に数えない |
| DS4  | 先に、人と問題の述べ方を決めるか | 捨てる | P2。材料は記録に限る。人の不満は、言い直しや却下として記録に残っていれば数える |
| DS5  | 診断する側は、直し方を提案しないか | 捨てる | このスキルは直す側。役割が違う |
| WFA1 | 1つの分岐を、言い換えて2度書いていないか | 採る | P3 の概念の圧縮（同じものには同じ語）。手順3で探す |
| WFA2 | 新しい語を作るか、学習にある語を使うか | 採る | P3 の概念の圧縮（新しい語を作らない）。対象のスキルとリポジトリにある語を先に使う |
| WFA3 | 同じ意味を何か所に書くか | 採る | P3 の概念の圧縮（概念の数を減らす）。1か所にする |
| WFA4 | モデルが言われなくてもやる文を、どう扱うか | 採る | P3 の2段目。文ごと消す。消してよいかは議論ではなく、失敗した場面のやり直し（手順5）で確かめる |
| WFA5 | 古くなった行を残すか | 採る | P3。直す節で、もう効いていない行を消す。足すほうが安全に見えて古い層が溜まるのを止める |
| WFA6 | 手順が参照に埋もれているとき、どうするか | 採る | P3 の1段目。どの分岐でも要るものは本文の上に、一部の分岐でしか要らないものは別のファイルに出す（PR4 と同じ） |
| WFA7 | 参照先が読まれないとき、本文に移すか、参照を指す1行を直すか | 採る | P3 の1段目。先に1行を、いつ読むかが分かる書き方に直す。効かなければ本文に移す |
| WFA8 | 手順を急いで終える失敗に、どう当てるか | 採る | P3 の3段目。先に完了の条件を判定できる形に直す。それでも起きたら手順を分ける |
| WFA9 | 禁止の形で書くか、望む動きの形で書くか | 直して採る | create-intent-skill の WFA4 と同じ（P6）。望む動きの形を基本にし、譲れない線だけ禁止の形で残す |
| WFA10 | 古い判断を書き換えるか、日付を付けて新しい判断を足し、古いほうに印を付けるか | 直して採る | P4。chief-of-staff の書き方に合わせる。古い行は消さずに superseded にし、新しい行を指す |
| PR1  | 機械で判定できるルールを、lint・型・テスト・フックにするか | 直して採る | P3 の5段目。消せるものを消したあと、同じ誤りが2回起きてから |
| PR2  | 分岐の条件をどこに置くか | 採る | 本文に置く（policy.md が無いとき、2回に満たないとき、原因がスキルの外にあるとき） |
| PR3  | 作業に関係なく毎回要る事実を、どこに置くか | 採る | 常に読み込まれるメモリ。このスキルには無い |
| PR4  | 本文と別のファイルの分け方 | まとめる → WFA6 | |
| PR5  | 複数のスキルで共有するものを、どこに置くか | 採る | 1か所に置いて参照させる。policy.md の下書きの仕方は create-intent-skill の手順1を指す（P6） |
| PR6  | サブエージェントにも適用するか | 採る | 手順5のやり直しと読み手のテストでサブエージェントを使う。手動でだけ起動するスキルは事前に読み込まれないので、プロンプトにファイルのパスを書く |
| PR7  | 採ったルールが使われたかを、どう見えるようにするか | 直して採る | P4。変更ごとに、どの失敗と P3 のどの段に当たるかを decisions.md に書かせる |

採ったルールは、SKILL.md では短い指示にして置いた。理由はこの表にだけある。

## 3. 形（/principles の判断の手順を上から当てた結果）

1. 機械で判定できるもの：decisions.md の見直しの行に、出典と回数があるか。superseded の行が新しい行を指しているか。今は作らない（P3、P4）。同じ抜けが2回起きたらスクリプトにする。
2. 分岐の条件（policy.md が無い、原因がスキルの外にある、同じ失敗が2回に満たない、人が1回で直すと決めた）は、SKILL.md の本文に置いた。
3. 毎回要る事実は無い。常に読み込まれるメモリには何も追加しない。
4. 5つの手順はどれも毎回使うので、本文に置いた。手元の道具（作業の記録から回数を数える道具など）がある環境だけで使う手順は local.md に出した。local.md はこのリポジトリには入れない。
5. 共有するもの：
   - policy.md の下書きの仕方は、create-intent-skill の手順1を相対パス（`../create-intent-skill/SKILL.md`）で指す。そのため、2つのスキルを並べて入れることを前提にした。
   - decisions.md の見直しの節の形は、create-intent-skill の decisions.md の「5. v0 の見直し」の表（変えたところ・起きたこと・直したこと・理由）に合わせた。
6. サブエージェント：手順5で使う。渡すものは本文に書いた（PR6）。
7. 適用されたかは、decisions.md の見直しの行に、P3 の段と policy の項目を書かせることで見える。

起動のされ方：手動でだけ（`disable-model-invocation: true`）。create-intent-skill と同じく、人が名前で呼ぶ。

SKILL.md 自身の概念の圧縮（P3）：新しい語は作っていない。「見直し」は create-intent-skill の decisions.md に、「superseded」は持ち主の骨組みにある語。原因の分け方は P3 の5段をそのまま使い、段に別の名前を付けていない。

## 4. どう検証するか

improve-intent-skill で直したスキルについて、直す前に数えた失敗が、そのあとの同じ種類の作業で起きた回数を見る。improve-intent-skill 自体は、直す案を人が却下・言い直した回数を見る。最初の見直しは、3つのスキルを直したあと（この時期はエージェントの下書き）。
