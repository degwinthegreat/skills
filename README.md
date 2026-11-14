# skills

Agent skills for Claude Code, starting with create-intent-skill: decide what you want to solve first, then pick only the rules from reference skills that serve it.

Claude Code などのエージェントで使うスキルを置くリポジトリです。

## インストール

create-intent-skill、improve-intent-skill、redesign-intent-workflow は、3つ一緒に入れます。improve-intent-skill と redesign-intent-workflow は、隣にある create-intent-skill の手順を読み、互いを行き先として指すからです。cognitive-surrender と write-agent-rules は、それぞれ1つだけでも動きます。

### Claude Code の plugin（推奨）

```
/plugin marketplace add degwinthegreat/skills
/plugin install kstack@kstack
```

1つの plugin（`kstack`）に5つのスキルが入っています。plugin のスキルには plugin の名前が付くので、`/kstack:create-intent-skill`、`/kstack:improve-intent-skill`、`/kstack:redesign-intent-workflow`、`/kstack:cognitive-surrender`、`/kstack:write-agent-rules` で呼びます。

### npx skills

```sh
npx skills add degwinthegreat/skills --skill create-intent-skill --skill improve-intent-skill --skill redesign-intent-workflow
npx skills add degwinthegreat/skills --skill cognitive-surrender
npx skills add degwinthegreat/skills --skill write-agent-rules
```

npx で入れるときは、create-intent-skill、improve-intent-skill、redesign-intent-workflow を3つとも入れてください。create-intent-skill が無いと、ほかの2つが動きません。cognitive-surrender と write-agent-rules は、使うときだけ入れます。こちらは `/create-intent-skill`、`/improve-intent-skill`、`/redesign-intent-workflow`、`/cognitive-surrender`、`/write-agent-rules` で呼びます。

### 手で置く

`~/.claude/skills/` に、使うスキルのフォルダを並べてリンクかコピーで置きます。

```sh
git clone https://github.com/degwinthegreat/skills.git
# リンク（pull すると更新される）
ln -s "$(pwd)/skills/create-intent-skill" ~/.claude/skills/create-intent-skill
ln -s "$(pwd)/skills/improve-intent-skill" ~/.claude/skills/improve-intent-skill
ln -s "$(pwd)/skills/redesign-intent-workflow" ~/.claude/skills/redesign-intent-workflow
ln -s "$(pwd)/skills/cognitive-surrender" ~/.claude/skills/cognitive-surrender
ln -s "$(pwd)/skills/write-agent-rules" ~/.claude/skills/write-agent-rules
# またはコピー
cp -R skills/create-intent-skill skills/improve-intent-skill skills/redesign-intent-workflow skills/cognitive-surrender skills/write-agent-rules ~/.claude/skills/
```

plugin と手で置いたものの両方があると、両方が読み込まれます。どちらか1つにしてください。

## create-intent-skill

ほかの人のスキルをいくつも参考にしてスキルを書くと、ルールが混ざって筋がぶれます。create-intent-skill では、先に「何を解決したいか」を方針として下書きして人が確かめ、参照先のルールはその方針に役立つものだけを採ります。出力は、プロジェクト用の `SKILL.md` と、方針の `policy.md`、ルールごとの採否と出典を残す `decisions.md` の3つです。

- [SKILL.md](create-intent-skill/SKILL.md)：手順
- このスキル自身のこれまでの方針と決定の記録：[docs/decisions/create-intent-skill/](docs/decisions/create-intent-skill/)（凍結）

### 状態

v0 の試作です。最初に3つのスキルを作って1回見直しました（[decisions.md](docs/decisions/create-intent-skill/decisions.md) の「5. v0 の見直し」）。手順やファイルの形は、使いながら変わります。

### 入れ方

[インストール](#インストール)を見てください。人が名前で呼ぶスキルです（`disable-model-invocation: true`）。

### local.md（任意）

手元にだけある道具（プロジェクトの知識をまとめたもの、作業の記録を測るツールなど）の使い方は、`create-intent-skill/local.md` に各自で書けます。スキルは、このファイルがあれば読み、無ければその部分を飛ばします。このリポジトリには入れていません（`.gitignore` で除いています）。plugin で入れたときは、スキルのフォルダが plugin の cache にあり、更新で入れ替わります。`local.md` を使うなら、「手で置く」のリンクで入れると、clone した側に置けます。

## improve-intent-skill

既存のスキルを、使って起きた失敗の記録から直すスキルです。まず `policy.md` を読んで、スキルの意図を取り戻します。そのうえで、同じ失敗が2回起きたものだけを、削る → 直す → 足すの順で直します。どの変更がどの失敗のためかを、`decisions.md` に残します。`policy.md` と `decisions.md` の形は create-intent-skill と共通なので、どちらで作ったスキルも扱えます。どちらのファイルも無いスキルには、横に足します。

- [SKILL.md](improve-intent-skill/SKILL.md)：手順
- このスキル自身のこれまでの方針と決定の記録：[docs/decisions/improve-intent-skill/](docs/decisions/improve-intent-skill/)（凍結）

v0 の試作で、まだ使っていません。数えられる失敗が無い相談や、複数のスキルにまたがる組み立てを変える相談では、入口で止まり、redesign-intent-workflow を指します。create-intent-skill の手順1を相対パスで読むので、3つのスキルを同じフォルダに並べて入れます（[インストール](#インストール)）。`local.md` の扱いは、create-intent-skill と同じです。

## redesign-intent-workflow

いくつものスキルが読む置き場（決定の記録、守る制約の一覧など）の組み立てに違和感があるとき、それは数えられる失敗として残りません。1つのスキルを最小の変更で直しても消えません。redesign-intent-workflow は、複数のスキルにまたがる組み立て（置き場・読み手・信頼の順・スキルの分担）を設計し直すスキルです。直すのが1つのスキルでも、論点が隣のスキルとの分担（いつ呼ばれるか＝description、何を持つか、どこで渡すか）なら、このスキルで受けます。たとえば、PR を作るスキルの description を、文章を書くスキルとの関係を見て直す相談です。今の形と、スキルどうしの関係を棚卸しし、agent-taxonomy で同じ分野のスキルの分け方と description の書き方を比べ、困りごとを読み手ごとに分け、案を並べて、決めたいことを推奨付きで聞きます。そのうえでチーム向けの設計書を書き、移行を create-intent-skill か improve-intent-skill に渡せる大きさの PR に分けます。スキルの本文は、このスキルでは直しません。improve-intent-skill は、こうした相談が来ると入口で止まり、このスキルを指します。

- [SKILL.md](redesign-intent-workflow/SKILL.md)：手順
- このスキル自身のこれまでの方針と決定の記録：[docs/decisions/redesign-intent-workflow/](docs/decisions/redesign-intent-workflow/)（凍結）

v0 の試作で、まだ使っていません。create-intent-skill の手順で作りました。人が名前で呼ぶスキルです（`disable-model-invocation: true`）。create-intent-skill と improve-intent-skill を相対パスで読むので、3つを同じフォルダに並べて入れます（[インストール](#インストール)）。

## cognitive-surrender

AI に作業を渡すとき、人がやり方だけを渡して判断を持ち続けているのか（任せる）、自分の答えを持たないまま出力を受け入れているのか（明け渡す）は、履歴に残りません。cognitive-surrender は、週に一度、人に一問だけ聞き、Claude Code のセッションの記録と git、プルリクエストの履歴から、確かめずに通したものを2〜3件選びます。それを、文脈を引き継がない別のエージェントに確かめさせ、任せただけか、明け渡していたかを見分けます。見つけたものは直さず、スキルが原因なら improve-intent-skill に、作業の進め方なら retro に渡します。用語は Addy Osmani の記事 [Cognitive Surrender](https://addyosmani.com/blog/cognitive-surrender/) の区別に揃えています。

- [SKILL.md](cognitive-surrender/SKILL.md)：手順
- このスキル自身のこれまでの方針と決定の記録：[docs/decisions/cognitive-surrender/](docs/decisions/cognitive-surrender/)（凍結）

v0 の試作で、まだ使っていません。create-intent-skill の手順で作りました。人が名前で呼ぶスキルです（`disable-model-invocation: true`）。記録を集計する道具が手元にあれば、`cognitive-surrender/local.md` に使い方を書けます。扱いは create-intent-skill の `local.md` と同じです。

## write-agent-rules

エージェントが読むチームの規約（CLAUDE.md・AGENTS.md・steering・rules）を、書く・見直すときに使うスキルです。どのリポジトリでも使えます。規約は、エージェントが良い選択をするための薄い材料にします。チームが選んだことと理由、環境を見ても分からない落とし穴、作業の場面ごとに開く所を書きます。ルールは、実際に起きた誤りがあるものだけにします。見直しでは、実例のある4つの失敗に照らして直し方の表を作ります。4つは、規約が膨らんで読み切れない、規則を判断の時点で読まれない所に置く、記憶に頼る規則を文章だけで守らせる、実例の無いルールが積もる、です。人に聞くのは、規約の長さの上限だけです。チームの規約に決めがあれば、それに従います。仕様は、別のスキルで扱う予定です。特定の製品の設定の書き方は扱いません。

- [SKILL.md](write-agent-rules/SKILL.md)：手順
- [policy.md](write-agent-rules/policy.md)：このスキル自身の方針
- [decisions.md](write-agent-rules/decisions.md)：このスキル自身のルールの採否と出典

v0 の試作で、まだ使っていません。create-intent-skill の手順で作りました。人が名前で呼ぶスキルです（`disable-model-invocation: true`）。ほかのスキルのファイルを読まないので、1つだけでも入れられます。

## 方針と決定の記録

これまで各スキルのフォルダにあった `policy.md`・`decisions.md` と共有の方針は、[docs/decisions/](docs/decisions/README.md) に移して凍結しました。スキルの実行では読みません。これからの変更の理由は、PR の本文とコミットに書きます。

## 評価

スキルの評価のケースを [evals/](evals/README.md) に置いています（`claude plugin eval` の形）。plugin で入れたときも、スキルの実行では読みません。

## agent-taxonomy との関係

create-intent-skill は、参照先を [agent-taxonomy](https://agent-taxonomy.kawaida-dev.com) から探します。サイトの [llms.txt](https://agent-taxonomy.kawaida-dev.com/llms.txt) から参照先のスキルを選び、ルールの置き場所は [/principles の「Writing a skill」](https://agent-taxonomy.kawaida-dev.com/principles/#authoring)の手順で決めます。create-intent-skill の正本は、このリポジトリです。

サイトが使えないときは、参照先のスキルを3〜5件、使う人が自分で挙げれば足ります。残りの手順はそのまま動きます。

## ライセンス

[MIT](LICENSE)
