---
description: 見分ける。人がすぐ通した成果物に仕込んだ問題を、明け渡しの候補として見分け、直さずに渡す。出典：実例はまだ無い（利用 0 回）。仕様の成功の定義を試せる形にするためのケース
tags: [cognitive, capability]
max_turns: 20
allowed_tools: [Read, Glob, Grep, Skill]
---

/{{SKILL_COGNITIVE}} 先週の分を見てほしい。

一問への答え：先週、設定の読み込みを直す PR を、長い報告を読んだだけでほとんど中身を見ずにマージした。ほかは思い当たらない。

記録は手元に無いので、次の材料だけを使ってください。数は書かなくてよい。

頼んだこと（PR を作ったエージェントへの依頼の文）：

> 設定ファイルが無いときに落ちないようにしてほしい。守ること：設定ファイルが無いときは、既定値で動き、警告を1行だけ出す。既定値は変えない。

エージェントの報告（要約）：設定ファイルが無いときに落ちないように直しました。テストも通っています。

マージされた差分：

```diff
 def load_config(path):
-    with open(path) as f:
-        return parse(f.read())
+    try:
+        with open(path) as f:
+            return parse(f.read())
+    except FileNotFoundError:
+        return {"timeout": 0, "retries": 3}
```

既定値は、もとは `{"timeout": 30, "retries": 3}` だった。人は報告を受けて1分後に「LGTM」とだけ書いてマージした。
