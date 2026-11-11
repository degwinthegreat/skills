# skills

Agent skills for Claude Code, starting with create-intent-skill: decide what you want to solve first, then pick only the rules from reference skills that serve it.

Claude Code などのエージェントで使うスキルを置くリポジトリです。

## create-intent-skill

ほかの人のスキルをいくつも参考にしてスキルを書くと、ルールが混ざって筋がぶれます。create-intent-skill では、先に「何を解決したいか」を方針として下書きして人が確かめ、参照先のルールはその方針に役立つものだけを採ります。出力は、プロジェクト用の `SKILL.md` と、方針の `policy.md`、ルールごとの採否と出典を残す `decisions.md` の3つです。

- [SKILL.md](create-intent-skill/SKILL.md)：手順
- [policy.md](create-intent-skill/policy.md)：このスキル自身の方針
- [decisions.md](create-intent-skill/decisions.md)：このスキル自身のルールの採否と出典、見直しの記録

### 状態

v0 の試作です。3つのスキルを作って1回見直しました（[decisions.md](create-intent-skill/decisions.md) の「5. v0 の見直し」）。手順やファイルの形は、使いながら変わります。

### 入れ方

`~/.claude/skills/` に、リンクかコピーで置きます。

```sh
git clone https://github.com/degwinthegreat/skills.git
# リンク（pull すると更新される）
ln -s "$(pwd)/skills/create-intent-skill" ~/.claude/skills/create-intent-skill
# またはコピー
cp -R skills/create-intent-skill ~/.claude/skills/
```

人が名前で呼ぶスキルです（`disable-model-invocation: true`）。Claude Code では `/create-intent-skill` で呼びます。

### local.md（任意）

手元にだけある道具（プロジェクトの知識をまとめたもの、作業の記録を測るツールなど）の使い方は、`create-intent-skill/local.md` に各自で書けます。スキルは、このファイルがあれば読み、無ければその部分を飛ばします。このリポジトリには入れていません（`.gitignore` で除いています）。

## agent-taxonomy との関係

create-intent-skill は、参照先を [agent-taxonomy](https://agent-taxonomy.kawaida-dev.com) から探します。サイトの [llms.txt](https://agent-taxonomy.kawaida-dev.com/llms.txt) から参照先のスキルを選び、ルールの置き場所は [/principles の「Writing a skill」](https://agent-taxonomy.kawaida-dev.com/principles/#authoring)の手順で決めます。create-intent-skill の正本は、このリポジトリです。

サイトが使えないときは、参照先のスキルを3〜5件、使う人が自分で挙げれば足ります。残りの手順はそのまま動きます。

## ライセンス

[MIT](LICENSE)
