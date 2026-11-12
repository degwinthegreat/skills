# skills

Agent skills for Claude Code, starting with create-intent-skill: decide what you want to solve first, then pick only the rules from reference skills that serve it.

Claude Code などのエージェントで使うスキルを置くリポジトリです。

## インストール

create-intent-skill と improve-intent-skill は、2つ一緒に入れます。improve-intent-skill は、隣にある create-intent-skill の手順を読むからです。cognitive-surrender は、1つだけでも動きます。

### Claude Code の plugin（推奨）

```
/plugin marketplace add degwinthegreat/skills
/plugin install kstack@kstack
```

1つの plugin（`kstack`）に3つのスキルが入っています。plugin のスキルには plugin の名前が付くので、`/kstack:create-intent-skill`、`/kstack:improve-intent-skill`、`/kstack:cognitive-surrender` で呼びます。

### npx skills

```sh
npx skills add degwinthegreat/skills --skill create-intent-skill --skill improve-intent-skill
npx skills add degwinthegreat/skills --skill cognitive-surrender
```

npx で入れるときは、create-intent-skill と improve-intent-skill を2つとも入れてください。片方だけだと improve-intent-skill が動きません。cognitive-surrender は、使うときだけ入れます。こちらは `/create-intent-skill`、`/improve-intent-skill`、`/cognitive-surrender` で呼びます。

### 手で置く

`~/.claude/skills/` に、使うスキルのフォルダを並べてリンクかコピーで置きます。

```sh
git clone https://github.com/degwinthegreat/skills.git
# リンク（pull すると更新される）
ln -s "$(pwd)/skills/create-intent-skill" ~/.claude/skills/create-intent-skill
ln -s "$(pwd)/skills/improve-intent-skill" ~/.claude/skills/improve-intent-skill
ln -s "$(pwd)/skills/cognitive-surrender" ~/.claude/skills/cognitive-surrender
# またはコピー
cp -R skills/create-intent-skill skills/improve-intent-skill skills/cognitive-surrender ~/.claude/skills/
```

plugin と手で置いたものの両方があると、両方が読み込まれます。どちらか1つにしてください。

## create-intent-skill

ほかの人のスキルをいくつも参考にしてスキルを書くと、ルールが混ざって筋がぶれます。create-intent-skill では、先に「何を解決したいか」を方針として下書きして人が確かめ、参照先のルールはその方針に役立つものだけを採ります。出力は、プロジェクト用の `SKILL.md` と、方針の `policy.md`、ルールごとの採否と出典を残す `decisions.md` の3つです。

- [SKILL.md](create-intent-skill/SKILL.md)：手順
- [policy.md](create-intent-skill/policy.md)：このスキル自身の方針
- [decisions.md](create-intent-skill/decisions.md)：このスキル自身のルールの採否と出典、見直しの記録

### 状態

v0 の試作です。3つのスキルを作って1回見直しました（[decisions.md](create-intent-skill/decisions.md) の「5. v0 の見直し」）。手順やファイルの形は、使いながら変わります。

### 入れ方

[インストール](#インストール)を見てください。人が名前で呼ぶスキルです（`disable-model-invocation: true`）。

### local.md（任意）

手元にだけある道具（プロジェクトの知識をまとめたもの、作業の記録を測るツールなど）の使い方は、`create-intent-skill/local.md` に各自で書けます。スキルは、このファイルがあれば読み、無ければその部分を飛ばします。このリポジトリには入れていません（`.gitignore` で除いています）。plugin で入れたときは、スキルのフォルダが plugin の cache にあり、更新で入れ替わります。`local.md` を使うなら、「手で置く」のリンクで入れると、clone した側に置けます。

## improve-intent-skill

既存のスキルを、使って起きた失敗の記録から直すスキルです。まず `policy.md` を読んで、スキルの意図を取り戻します。そのうえで、同じ失敗が2回起きたものだけを、削る → 直す → 足すの順で直します。どの変更がどの失敗のためかを、`decisions.md` に残します。`policy.md` と `decisions.md` の形は create-intent-skill と共通なので、どちらで作ったスキルも扱えます。どちらのファイルも無いスキルには、横に足します。

- [SKILL.md](improve-intent-skill/SKILL.md)：手順
- [policy.md](improve-intent-skill/policy.md)：このスキル自身の方針
- [decisions.md](improve-intent-skill/decisions.md)：このスキル自身のルールの採否と出典

v0 の試作で、まだ使っていません。create-intent-skill の手順1を相対パスで読むので、2つのスキルを同じフォルダに並べて入れます（[インストール](#インストール)）。`local.md` の扱いは、create-intent-skill と同じです。

## cognitive-surrender

AI に作業を渡すとき、人がやり方だけを渡して判断を持ち続けているのか（任せる）、自分の答えを持たないまま出力を受け入れているのか（明け渡す）は、履歴に残りません。cognitive-surrender は、週に一度、人に一問だけ聞き、Claude Code のセッションの記録と git、プルリクエストの履歴から、確かめずに通したものを2〜3件選びます。それを、文脈を引き継がない別のエージェントに確かめさせ、任せただけか、明け渡していたかを見分けます。見つけたものは直さず、スキルが原因なら improve-intent-skill に、作業の進め方なら retro に渡します。用語は Addy Osmani の記事 [Cognitive Surrender](https://addyosmani.com/blog/cognitive-surrender/) の区別に揃えています。

- [SKILL.md](cognitive-surrender/SKILL.md)：手順
- [policy.md](cognitive-surrender/policy.md)：このスキル自身の方針
- [decisions.md](cognitive-surrender/decisions.md)：このスキル自身のルールの採否と出典

v0 の試作で、まだ使っていません。create-intent-skill の手順で作りました。人が名前で呼ぶスキルです（`disable-model-invocation: true`）。記録を集計する道具が手元にあれば、`cognitive-surrender/local.md` に使い方を書けます。扱いは create-intent-skill の `local.md` と同じです。

## agent-taxonomy との関係

create-intent-skill は、参照先を [agent-taxonomy](https://agent-taxonomy.kawaida-dev.com) から探します。サイトの [llms.txt](https://agent-taxonomy.kawaida-dev.com/llms.txt) から参照先のスキルを選び、ルールの置き場所は [/principles の「Writing a skill」](https://agent-taxonomy.kawaida-dev.com/principles/#authoring)の手順で決めます。create-intent-skill の正本は、このリポジトリです。

サイトが使えないときは、参照先のスキルを3〜5件、使う人が自分で挙げれば足ります。残りの手順はそのまま動きます。

## ライセンス

[MIT](LICENSE)
