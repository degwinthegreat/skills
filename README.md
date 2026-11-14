# skills

Agent skills for Claude Code. intent-skill creates, improves and restructures skills around what you want to solve: thin context, rules only where there is a real example, and evals instead of growing policies.

Claude Code などのエージェントで使うスキルを置くリポジトリです。

## インストール

### Claude Code の plugin（推奨）

```
/plugin marketplace add degwinthegreat/skills
/plugin install kstack@kstack
```

1つの plugin（`kstack`）に、intent-skill と cognitive-surrender が入っています。plugin のスキルには plugin の名前が付くので、`/kstack:intent-skill`、`/kstack:cognitive-surrender` で呼びます。

### npx skills

```sh
npx skills add degwinthegreat/skills --skill intent-skill
npx skills add degwinthegreat/skills --skill cognitive-surrender
```

どちらも1つだけで動きます。こちらは `/intent-skill`、`/cognitive-surrender` で呼びます。

### 手で置く

`~/.claude/skills/` に、使うスキルのフォルダをリンクかコピーで置きます。

```sh
git clone https://github.com/degwinthegreat/skills.git
# リンク（pull すると更新される）
ln -s "$(pwd)/skills/intent-skill" ~/.claude/skills/intent-skill
ln -s "$(pwd)/skills/cognitive-surrender" ~/.claude/skills/cognitive-surrender
# またはコピー
cp -R skills/intent-skill skills/cognitive-surrender ~/.claude/skills/
```

plugin と手で置いたものの両方があると、両方が読み込まれます。どちらか1つにしてください。

### 前の名前

create-intent-skill、improve-intent-skill、redesign-intent-workflow は、intent-skill にまとめました。前の名前で呼ぶと、intent-skill を使うよう案内だけが出ます。この案内は次の版で消します。

## intent-skill

スキルは、エージェントが良い選択をするための薄い材料にし、ルールは実例か人の決定があるものだけにする、という向きでスキルを扱います。1つのスキルに3つの節があります。

- **作る**：作るきっかけの実例を1つ書き、仕様（ユースケース、判定できる成功の定義、避けたい失敗の実例）を下書きして人が確かめます。参照先は [agent-taxonomy](https://agent-taxonomy.kawaida-dev.com) から3〜5件を選び、解決したいことに効くものだけを採ります。作るのは `SKILL.md` 1つで、仕様はその頭に書きます。
- **直す**：起きた失敗を1件の実例として受け、評価のケースにして直す前の版で落ちることを確かめ、最小の変更で直してケースが通るのを確かめます。足すのは実例か人の決定があるときだけで、削るのに回数は要りません。
- **組み立てを見直す**：複数のスキルが読む置き場や、スキルの分担の相談を受けます。置き場と読み手、スキルの関係を表にし、案を推奨付きで並べ、移行を PR に分けます。

- [SKILL.md](intent-skill/SKILL.md)
- 前の3つのスキルの方針と決定の記録：[docs/decisions/](docs/decisions/README.md)（凍結）

人が名前で呼ぶスキルです（`disable-model-invocation: true`）。手元にだけある道具（プロジェクトの知識をまとめたもの、作業の記録を測るツールなど）の使い方は、`intent-skill/local.md` に各自で書けます。スキルは、このファイルがあれば読み、無ければその部分を飛ばします。このリポジトリには入れていません（`.gitignore` で除いています）。plugin で入れたときは、スキルのフォルダが plugin の cache にあり、更新で入れ替わります。`local.md` を使うなら、「手で置く」のリンクで入れると、clone した側に置けます。

## cognitive-surrender

AI に作業を渡すとき、人がやり方だけを渡して判断を持ち続けているのか（任せる）、自分の答えを持たないまま出力を受け入れているのか（明け渡す）は、履歴に残りません。cognitive-surrender は、週に一度、人に一問だけ聞き、Claude Code のセッションの記録と git、プルリクエストの履歴から、確かめずに通したものを2〜3件選びます。それを、文脈を引き継がない別のエージェントに確かめさせ、任せただけか、明け渡していたかを見分けます。見つけたものは直さず、スキルが原因なら intent-skill の「直す」に、作業の進め方なら retro に渡します。用語は Addy Osmani の記事 [Cognitive Surrender](https://addyosmani.com/blog/cognitive-surrender/) の区別に揃えています。

- [SKILL.md](cognitive-surrender/SKILL.md)：手順
- このスキル自身のこれまでの方針と決定の記録：[docs/decisions/cognitive-surrender/](docs/decisions/cognitive-surrender/)（凍結）

v0 の試作で、まだ使っていません。人が名前で呼ぶスキルです（`disable-model-invocation: true`）。記録を集計する道具が手元にあれば、`cognitive-surrender/local.md` に使い方を書けます。扱いは intent-skill の `local.md` と同じです。

## 方針と決定の記録

これまで各スキルのフォルダにあった `policy.md`・`decisions.md` と共有の方針は、[docs/decisions/](docs/decisions/README.md) に移して凍結しました。スキルの実行では読みません。これからの変更の理由は、PR の本文とコミットに書きます。

## 評価

スキルの評価のケースを [evals/](evals/README.md) に置いています（`claude plugin eval` の形）。plugin で入れたときも、スキルの実行では読みません。

## agent-taxonomy との関係

intent-skill は、スキルを作るときの参照先を [agent-taxonomy](https://agent-taxonomy.kawaida-dev.com) から探します。サイトの [llms.txt](https://agent-taxonomy.kawaida-dev.com/llms.txt) から参照先のスキルを選び、ルールの置き場所は [/principles の「Writing a skill」](https://agent-taxonomy.kawaida-dev.com/principles/#authoring)の手順で決めます。intent-skill の正本は、このリポジトリです。

サイトが使えないときは、参照先のスキルを3〜5件、使う人が自分で挙げれば足ります。残りの手順はそのまま動きます。

## ライセンス

[MIT](LICENSE)
