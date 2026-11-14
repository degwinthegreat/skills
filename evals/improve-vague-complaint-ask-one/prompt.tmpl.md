---
description: 直す。記録に残っていない、はっきりしない不満から呼ばれたら、それを1件の実例として受け、場面を一問だけ聞く。出典：2026-11-11 と 2026-11-13、人が言葉で言った不満から呼ばれ、数える失敗が無いまま何も変えずに終わるか、手順を飛ばして普通の相談になった
tags: [improve, capability]
max_turns: 15
allowed_tools: [Read, Glob, Grep, Skill]
---

/{{SKILL_INTENT}} 下のスキル、なんか改善が必要だと思う。

```markdown
---
name: release-notes
description: マージされた PR から、利用者向けのリリースノートを書く
disable-model-invocation: true
---

# release-notes

1. 前のリリースのタグから今までにマージされた PR を一覧にする。
2. PR ごとに、利用者から見て何が変わったかを1行で書く。
3. 新機能・修正・その他に分けて並べる。
4. 書いたものを人に見せる。
```

使った記録は手元に無い。
