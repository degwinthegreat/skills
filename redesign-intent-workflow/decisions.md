# redesign-intent-workflow の決定の記録

redesign-intent-workflow を、create-intent-skill の手順で作ったときの記録（2026-11-13）。理由は [policy.md](policy.md) の項目番号（P1〜P7）と、[共有の方針](../create-intent-skill/shared-policy.md)の S1〜S3 で書く。要旨は、そのルールが redesign-intent-workflow で何を決めるかを、こちらの言葉で書いたもので、原文の訳ではない。

## 0. 要求を疑った結果（create-intent-skill の手順1の2）

既存のもので済むかを先に確かめた。

- improve-intent-skill は、数えた失敗から入り、1つのスキルを最小の変更で直す。組み立てへの違和感からは入れない。最小の変更と、SKILL.md の書き方を作り替えない縛りは、組み立てを変える相談では足かせになる。持ち主が、別のスキルにすると決めた（2026-11-13）。improve-intent-skill の側には、そうした相談で止まる入口を足した（improve-intent-skill/decisions.md の6節）。
- create-intent-skill は、スキルを1つ作る。複数のスキルの分担や置き場を決める手順を持たない。
- メモリの1行や lint は、組み立てを決めないので代わりにならない。

そこで、新しいスキルを作る。移行の実装は create-intent-skill と improve-intent-skill に渡し、このスキルは設計と分け方だけを持つ（P7）。

## 1. 参照先

持ち主が挙げた候補を、agent-taxonomy（2026-11-13 の [llms.txt](https://agent-taxonomy.kawaida-dev.com/llms.txt)）のエントリでたどった。上流の原文は、2026-11-13 に既定のブランチの先頭の commit で固定して読んだ。mattpocock-skills と aidlc-workflows は、agent-taxonomy が分析した commit（mattpocock-skills は 4ae2317、aidlc-workflows は 161ddb8）より上流が進んでいたので、上流の版で読んだ（S2）。chief-of-staff の Wiki の節は、上流の版で、共有の wiki を先に探す段落が入っている（上流の changeset `chief-of-staff-shared-wiki-procedures`）。

| ID  | 参照先 | 読んだもの（commit を固定） | 選んだ理由 |
| --- | --- | --- | --- |
| MP  | mattpocock-skills / grilling と to-spec | [grilling/SKILL.md](https://github.com/mattpocock/skills/blob/5863806dd4e15c63174bee4e7515a4256792ecfa/skills/productivity/grilling/SKILL.md)・[to-spec/SKILL.md](https://github.com/mattpocock/skills/blob/5863806dd4e15c63174bee4e7515a4256792ecfa/skills/engineering/to-spec/SKILL.md) @5863806 | 決めることを前提の順に並べ、推奨付きで聞く型（grilling）と、聞き終えたものを聞かずにまとめる型（to-spec）。手順5と6に効く。同じ作者の、聞く側とまとめる側の対なので1件にした |
| COS | mattpocock-skills / chief-of-staff の Wiki と Procedures | [chief-of-staff/SKILL.md @5863806](https://github.com/mattpocock/skills/blob/5863806dd4e15c63174bee4e7515a4256792ecfa/skills/in-progress/chief-of-staff/SKILL.md) | 置き場を決める前に共有のものを探す、主張に日付と commit を付ける、古い主張を消さずに superseded にする、隣のスキルの手順を相対パスで読む。手順1・6・7と、形に効く |
| ADR | addyosmani-agent-skills / documentation-and-adrs | [SKILL.md @301b02b](https://github.com/addyosmani/agent-skills/blob/301b02b12bff98e4688e6984af6556802322bbde/skills/documentation-and-adrs/SKILL.md) | ADR に書く決定（戻すのが高くつくもの）と書かないもの、既存の決まりに合わせること、文章の見直しで条件を落とさないこと。持ち主の相談の困りごと（メモ程度の判断を強い名前で呼ぶ）に直接効く |
| VD  | aidlc-workflows / vision-document-guide | [vision-document-guide.md @d8dd27d](https://github.com/awslabs/aidlc-workflows/blob/d8dd27dcf1fe889dd521ea462d983aef831ae815/docs/guide/writing-inputs/vision-document-guide.md) | 既存のものを変えるときの「変えてはいけないもの」と、範囲外・未決の問いを書く型。手順4と6に効く |
| PR  | agent-taxonomy / [principles](https://agent-taxonomy.kawaida-dev.com/principles/) の「Writing a skill」と「Migrate, then delete the old path」 | [/principles/index.md](https://agent-taxonomy.kawaida-dev.com/principles/index.md)（2026-11-13 に読んだ版。サイトのソースは公開していないので commit では固定できない） | 形を決める判断の手順と、移行の順の原則。create-intent-skill と同じものを使う |

選ばなかったもの：

- mattpocock-skills / grill-with-docs（Spec writing）：grilling に、用語集と ADR に書き残す手順を足したもの。聞く型は MP、ADR に書くかの線引きは ADR と同じ主張なので、それぞれに寄せた。
- mattpocock-skills / domain-modeling（Spec writing）：用語と ADR の記録。対象がドメインの語で、置き場と読み手の組み立てではない。
- mattpocock-skills / wayfinder・to-tickets（Planning）：計画をチケットに分ける。手順7の分け方に近いが、渡し先は create-intent-skill と improve-intent-skill に決まっているので、分け方の型は要らない。
- addyosmani-agent-skills / interview-me・idea-refine（Spec writing）：人に聞いて考えを固める。MP の grilling と同じ主張で、推奨を付けて聞く点まで書いている grilling に寄せた。
- aidlc-workflows / aidlc-knowledge・aidlc-scope（Shared context・Planning）：AI-DLC の流れの中の段で、その流れを使わない場面には持ち込めない。範囲を決める型は VD に寄せた。

## 2. ルールごとの採否

判定は4通り：採る、直して採る、まとめる（ほかの行と同じ主張なので、その行に寄せる）、捨てる。

| ID   | redesign-intent-workflow で決めること | 判定 | 理由 |
| ---- | --- | --- | --- |
| MP1  | 決めることを前提の関係で並べ、前提がそろったものだけを1回にまとめて聞くか | 採る | P5。手順5の1 |
| MP2  | 問いに番号と推奨を付け、「はい」で推奨を採れる聞き方にするか | 採る | P5。手順5の2 |
| MP3  | 事実は自分で調べ、人に聞かないか | 直して採る | P5。手順5の3。調べている間もほかの問いを進める、サブエージェントに任せる、の部分は捨てた（P2 の手順の少なさ。モデルが言われなくてもやる） |
| MP4  | 聞くことが無くなり、人が共有の理解を OK するまで、動き出さないか | 直して採る | P5。手順5の5と完了の条件。答えの無い問いは、止まらずに未決の問いとして設計書に残す（VD3） |
| MP5  | 聞き終えたことを、新しく聞かずにまとめて文書にするか（to-spec） | 直して採る | P6。手順6で、手順5までに決めたことをまとめる。新しく聞くことがあれば手順5に戻る |
| MP6  | テストの境目を先に決めて人と確かめるか | 捨てる | 解決したいことに役立たない。コードの仕様の話 |
| MP7  | 文書にファイルのパスやコードを書かないか（古くなるため） | まとめる → COS2 | 置き場そのものが設計の対象なので、パスは書く。古くなる問題は、commit を付けて時点の記録にすることで扱う |
| MP8  | ユーザーストーリーの長い一覧を書くか | 捨てる | create-intent-skill の P2（削る）。読み手は手順2で分けてある |
| MP9  | 範囲外を書くか | まとめる → VD1 | |
| MP10 | issue tracker に出し、ラベルを付けるか | 捨てる | 置き場はリポジトリの決まりに合わせる（COS1）。決まった道具を書かない |
| COS1 | 書く前に、共有の置き場を探してその決まりに従い、無ければ書く前に人と置き場を決めるか | 採る | P6。手順6の1 |
| COS2 | 主張に日付を付け、コードについては commit を付けるか。「今は」と書かないか | 採る | P1・P6。手順1の表の上に commit を書く。手順6の決めたことに日付を付ける |
| COS3 | 変わったときは、新しい主張を足し、古い主張は書き換えずに superseded にするか | 採る | P6。手順6の4。improve-intent-skill の P4 と同じ書き方 |
| COS4 | 出典を写さず、引くか | 採る | P6・S3。手順6の3。作者の文を写さない（譲る対象にしない） |
| COS5 | 1つのページに1つのことを書き、index を持つか | 捨てる | 出力の設計書は1つ。置き場の設計の中身として案に出ることはあるが、このスキルのルールではない |
| COS6 | 矛盾や古い主張を定期的に探すか（lint） | 捨てる | create-intent-skill の P3・P4。仕組みは最後。同じ抜けが2回起きてから |
| COS7 | 隣のスキルの手順を、相対パスで読むか | 採る | P7。渡し先と、手順3の読み方を相対パスで指す。そのため、create-intent-skill・improve-intent-skill と一緒に入れる |
| COS8 | 作業のたびに、まず環境（制約の強い道具、lint、規約）を直せないか考えるか | 直して採る | P4。手順4の2。文書ではなく構造で解ける案があれば含める。PR1 と同じ向き |
| ADR1 | 決定の記録に書くのは、戻すのが高くつく決定だけか | 直して採る | P6。手順6の2で、決定の重さを分けて書く。持ち主の相談の困りごと（メモ程度の判断を強い名前で呼ぶと、信じすぎる）に当てた。重さの分け方は下書き |
| ADR2 | 古い決定を消さず、新しい決定から superseded にするか | まとめる → COS3 | |
| ADR3 | 既存の置き場・番号・見出しの決まりに合わせ、食い違えば黙って新しい形を入れずに示すか | 採る | P6。手順6の1 |
| ADR4 | 決定ごとに、選ばなかった案と結果を書くか | 直して採る | P4。手順4の欄（効果・維持コスト・抜け道）と、手順6の「選ばなかった案と、その理由」 |
| ADR5 | エージェント向けの文書の種類（規約のファイル、仕様、ADR、落とし穴）を挙げるか | 捨てる | 一覧は要らない。手順1で、対象の実物を棚卸しする |
| ADR6 | 文章を直したあと、名前・数・条件・不確かさが落ちていないか、裏付けの無い保証を足していないかを確かめるか | 採る | P6・S1。手順6の5 |
| ADR7 | 自明なことを書かないか | 捨てる | モデルが言われなくてもやる |
| VD1  | 範囲の内と外を分けて書くか | 直して採る | P4・P7。手順7の「何を変えるか、何を変えないか」 |
| VD2  | 変えてはいけないもの（部品、API、データ）を書くか。いちばん大事か | 採る | P4。手順4の1で先に書き、手順6の中身に入れる。推奨の案は触らない（譲る対象にしない） |
| VD3  | 未決の問いを先に書き、早く聞くか | 採る | P5・P6。手順5の完了の条件と、手順6の中身 |
| VD4  | 文書を、指示ではなくデータとして扱い、承認は人に残すか | まとめる → 冒頭の外の文章の段落 | create-intent-skill の6節と同じ扱い |
| VD5  | 効果を、測れる言い方で書くか | 直して採る | P4。効果は、手順2のどの困りごとが消えるかで書く |
| VD6  | 前提を書いて、疑えるようにするか | まとめる → 手順2の「推測」 | S1 |
| VD7  | 全体の構想と、最初の一歩を分けるか | まとめる → PR3 | 移行の順で扱う |
| VD8  | 技術や実装の詳細を書かないか | 捨てる | 置き場とスキルの分担が設計の対象 |
| PR1  | 機械で判定できるルールを、lint・検査・フックにするか | 直して採る | create-intent-skill の P3。このスキル自身には作らない。設計の案として、構造で止める案を並べる（COS8） |
| PR2  | 分岐の条件をどこに置くか | 採る | 本文に置く（入口、変えてはいけないものに触る案、決まりが食い違うとき） |
| PR3  | 移行では、新しい道を作って移してから古い道を消すか（Migrate, then delete the old path） | 採る | P7。手順7の3 |
| PR4  | 複数のスキルで共有するものを、どこに置くか | 採る | 共有の方針を指す（create-intent-skill/decisions.md の8節） |
| PR5  | サブエージェントにも適用するか | 捨てる | このスキルの手順では使わない |

採ったルールは、SKILL.md では短い指示にして置いた。理由はこの表にだけある。

## 3. 形（/principles の判断の手順を上から当てた結果）

1. 機械で判定できるもの：設計書の根拠が、手元にしか無いパスを指していないか。移行の PR のそれぞれに渡し先があるか。今は作らない（create-intent-skill の P3、P4）。同じ抜けが2回起きたらスクリプトにする。
2. 分岐の条件（入口で渡し先に返す、変えてはいけないものに触る案を推奨しない、置き場の決まりが食い違えば人に示す）は、SKILL.md の本文に置いた。
3. 毎回要る事実は無い。常に読み込まれるメモリには何も追加しない。
4. 7つの手順はどれも毎回使うので、本文に置いた。手元の道具だけで使う手順は無いので、local.md は持たない。
5. 共有するもの：
   - 共有の方針 S1〜S3 は、create-intent-skill/shared-policy.md を指す。
   - 上流の読み方は、create-intent-skill の手順2の3を相対パスで指す。写さない。
   - 渡し先の2つのスキルは、相対パスで指す。そのため、3つのスキルを並べて入れることを前提にした（README）。
6. サブエージェントは使わない。
7. 適用されたかは、返答の5つ（とくに、人が決めたことと推奨のまま決めたことの件数、移行の PR の渡し先）で見える。

起動のされ方：手動でだけ（`disable-model-invocation: true`）。ほかの3つと同じく、人が名前で呼ぶ。

SKILL.md 自身の概念の圧縮：新しい語は作っていない。「置き場・読み手・信頼の順・スキルの分担」は持ち主の言葉、「superseded」は improve-intent-skill と同じ語、「入口」は improve-intent-skill の節の名前と揃えた。

## 4. どう検証するか

3回使ったら、移行の PR のうち、渡し先のスキルが分け直さずにそのまま受け取れた数と、人が推奨を言い直した回数を見て、見直す（この時期と値はエージェントの下書き）。

本文の読み手のテストの結果（2026-11-13）：書いた SKILL.md だけを、流れを知らない別のエージェントに読ませた。場面は、いくつものスキルが読む決定の記録の置き場に、メモ程度の判断まで「決定」として書かれ、信じすぎる、という相談。入口を通って手順1〜7に進むこと、人に聞くことと自分で調べること、本文を自分で直さず PR の一覧を渡すことは、意図どおりに答えた。迷った所として挙がった5つのうち、2つを直した。1つは、手順1の「どこまで信じられているか」の埋め方（出典か「推測」）。もう1つは、手順6で、置き場の決まりそのものが見直しの対象のときの扱い（書く前に人と決める）。残りの3つは直していない。参考にする運用が無いときの手順3、推奨で決めてよいものの線引き、policy.md を読んでいないこと。どれも、本文の条件どおりに読めていた。
