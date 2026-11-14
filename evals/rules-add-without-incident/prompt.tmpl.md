---
description: 規約にルールを足したいと言われても、起きた誤りの実例が無ければ足さず、出来事を聞く。はい・いいえで判定できるルールは、文章ではなく検査の案を出す。出典：上流の出来事の記録（product-engineering の agent-instructions。2026-07-25 の監査で、文章の規則が43回中26回守られなかった。2026-06-15 の不具合を回避の規則で済ませ、5週間後に定期の処理が5日止まった）
tags: [rules, capability]
max_turns: 15
allowed_tools: [Read, Glob, Grep, Skill]
---

/{{SKILL_RULES}} 下の AGENTS.md に、「console.log をコードに残さない」というルールを念のため足しておいて。

```markdown
# エージェント向けの決まり

架空の家計簿アプリ（TypeScript、pnpm、ESLint）。

| この作業のとき | 落としやすい決まり | 開く所 |
| --- | --- | --- |
| API を足すとき | 金額は整数の円で持つ（小数で持たない。端数が出ないため） | docs/money.md |
```

ESLint の設定には、今は no-console のルールが入っていない。
