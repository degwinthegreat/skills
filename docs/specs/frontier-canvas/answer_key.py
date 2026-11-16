#!/usr/bin/env python3
"""図の評価の答え合わせの表を、仕様書だけから作る（図の描画には頼らない）。

設計書（docs/specs/frontier-canvas.md）の「評価の段取り」の 1 で使う。
決まりは設計書から取った：人の関わりの導き方（情報の層の 1）、見出しの規則（3）、
足りないものの数え方（3e4fc5c の 770〜790 行と同じ決まり）と重さの順（b 次に直す）、段階の差（決まったこと 8）。

    python3 docs/specs/frontier-canvas/answer_key.py docs/specs/frontier-canvas/soramame.json > out.md
"""
import json
import sys

SESSION = {"plan", "run", "human"}
KIND = {"split", "work", "code", "gate"}
RISK_ORDER = {"irreversible": 0, "wide": 1, "narrow": 2}
RISK_JA = {"irreversible": "戻せない", "wide": "戻せるが広い", "narrow": "戻せて狭い"}
GROUP_JA = {"input": "入力", "routing": "振り分け", "candidate": "候補", "output": "出力"}
INV_JA = {"cond": "条件で人", "human": "人がやる", "agent": "エージェントがやる", "auto": "自動"}
BY_JA = {"human": "人", "schedule": "定期", "event": "イベント"}
RANK_JA = {1: "戻しにくさ", 2: "人の関門と戻り道", 3: "エージェントの段のスキル", 4: "検査", 5: "書き漏れ"}


def arr(v):
    return v if isinstance(v, list) else [] if v in (None, "") else [v]


def main(path):
    D = json.load(open(path, encoding="utf-8"))
    stages = D["stages"]
    sidx = {s["id"]: i for i, s in enumerate(stages)}
    sname = {s["id"]: s["name"] for s in stages}
    roles = {r["id"]: r for r in D.get("roles", [])}
    phases = D.get("phases") or [{"id": "_all", "name": "（段階なし）"}]
    pidx = {p["id"]: i for i, p in enumerate(phases)}
    cur = next((i for i, p in enumerate(phases) if p.get("current")), 0)

    def alive(o, p):
        s, u = o.get("since"), o.get("until")
        return (not s or pidx[s] <= p) and (not u or pidx[u] > p)

    def gaps_at(v, p):
        out = []
        for g in arr(v):
            if isinstance(g, dict):
                if g.get("text") and alive(g, p):
                    out.append(g["text"])
            elif g:
                out.append(str(g))
        return "／".join(out)

    nodes = D["nodes"]
    for n in nodes:
        n.setdefault("layer", "task")
        n["_auto"] = n.get("session") not in SESSION and n.get("kind") in ("code", "gate")
        sess = n.get("session")
        if sess not in SESSION and not n["_auto"] and roles.get(n["role"], {}).get("actor") == "human":
            sess = "human"
        n["_sess"] = sess
        n["_missing"] = [] if (sess in SESSION or n["_auto"]) else ["セッション"]
        n["_skillless"] = not n.get("skills") and sess != "human" and n.get("kind") != "code"
        n["_wants"] = n["_skillless"] and sess in ("plan", "run")
        n["_short"] = n.get("short") or n["title"]
    byid = {n["id"]: n for n in nodes}
    edges = []
    for e in D.get("edges", []):
        e = dict(e)
        e["kind"] = e.get("kind") if e.get("kind") in ("data", "fix", "learn") else "data"
        edges.append(e)

    def nodes_at(p):
        return [n for n in nodes if alive(n, p)]

    def edges_at(p):
        return [e for e in edges if alive(e, p) and alive(byid[e["from"]], p) and alive(byid[e["to"]], p)]

    def checks_at(n, p):
        return [c for c in n.get("checks", []) if alive(c, p)]

    def involvement(n, p):
        # 設計書「人の関わりときっかけ」の 1。上から順に、最初に当たったもの。
        if gaps_at(n.get("human_if"), p):
            return "cond"
        if n.get("human") is True or n.get("session") == "human":
            return "human"
        if n["layer"] == "upstream" and roles.get(n["role"], {}).get("decides"):
            return "human"
        if n.get("session") in ("plan", "run"):
            return "agent"
        if roles.get(n["role"], {}).get("actor") == "human" and not n.get("session") and n.get("kind") not in ("code", "gate"):
            return "human"
        return "auto"

    def state(n, p):
        cks = checks_at(n, p)
        gap = gaps_at(n.get("gap"), p)
        noskill = n["_wants"] and not cks
        ckgaps = [c for c in cks if gaps_at(c.get("gap"), p)]
        tags = [m + "不明" for m in n["_missing"]] + (["スキル無し"] if noskill else [])
        is_gap = bool(gap or n["_missing"] or noskill or ckgaps)
        return dict(checks=cks, gap=gap, is_gap=is_gap, tags=tags)

    def gap_list(p):
        """段階 p の足りないもの。(順, 上流からの位置, 理由の文, 対象, 文) のリスト。"""
        ns, es = nodes_at(p), edges_at(p)
        st = {n["id"]: state(n, p) for n in ns}
        out = []
        pos = lambda n: sidx[n["stage"]]
        for s in stages:
            inside = [n for n in ns if n["stage"] == s["id"]]
            if not inside:
                out.append((5, sidx[s["id"]], f"段「{s['name']}」にノードが無い", "段:" + s["id"], f"段「{s['name']}」にノードが無い"))
            elif all(st[n["id"]]["is_gap"] for n in inside):
                out.append((3, sidx[s["id"]], f"段「{s['name']}」に、スキルの決まったノードが無い", "段:" + s["id"], f"段「{s['name']}」に、スキルの決まったノードが無い"))
        for n in ns:
            x = st[n["id"]]
            if x["is_gap"] and (x["gap"] or x["tags"]):
                why = x["gap"] or "欠けている：" + "、".join(x["tags"])
                if n.get("kind") == "gate":
                    rank, sub = 1, RISK_ORDER.get(n.get("risk"), 3)
                elif n["_sess"] in ("plan", "run"):
                    rank, sub = 3, 0
                else:
                    rank, sub = 5, 0
                out.append((rank, sub * 100 + pos(n), why, n["id"], f"{sname[n['stage']]} / {roles.get(n['role'], {}).get('name', n['role'])} の「{n['title']}」：{why}"))
        for n in ns:
            for c in st[n["id"]]["checks"]:
                g = gaps_at(c.get("gap"), p)
                if g:
                    out.append((4, RISK_ORDER.get(n.get("risk"), 3) * 100 + pos(n), g, n["id"] + "/" + c["id"], f"関門「{n['title']}」の検査「{c['title']}」：{g}"))
        humans = [n for n in ns if n.get("human") is True]
        if len(humans) != 1:
            out.append((2, 0, "人を置く関門の数", "-", f"人を置く関門が {len(humans)} か所"))
        for n in ns:
            if n["layer"] != "upstream" and n["_sess"] == "human" and n.get("human") is not True:
                out.append((2, 10 + pos(n), "流れの途中に人", n["id"], f"「{n['title']}」：タスクの流れの途中に人がいる"))
        if not any(e["kind"] == "fix" for e in es):
            out.append((2, 50, "直しの辺が無い", "-", "直しの辺が無い"))
        if not any(e["kind"] == "learn" for e in es):
            out.append((2, 60, "学びの辺が無い", "-", "学びの辺が無い（評価から、分ける所の指示か上流へ戻す矢印）"))
        for n in ns:
            if n.get("kind") == "gate" and n.get("risk") not in RISK_ORDER:
                out.append((1, 300 + pos(n), "戻しにくさが書かれていない", n["id"], f"関門「{n['title']}」：戻しにくさが書かれていない"))
            if n.get("kind") == "gate" and n.get("risk") == "irreversible" and n.get("human") is not True:
                out.append((1, pos(n), "戻せない変更を人を置かずに通す", n["id"], f"関門「{n['title']}」：戻せない変更を、人を置かずに通している"))
            if n.get("kind") in ("work", "gate") and not n.get("check") and not (st[n["id"]]["checks"] and all(c.get("check") for c in st[n["id"]]["checks"])):
                out.append((4, 900 + pos(n), "判定が書かれていない", n["id"], f"「{n['title']}」：判定が書かれていない"))
            if n["layer"] != "upstream" and n.get("kind") not in KIND:
                out.append((5, 900 + pos(n), "種類が書かれていない", n["id"], f"「{n['title']}」：ノードの種類が書かれていない"))
        out.sort(key=lambda t: (t[0], t[1]))
        # 同じ理由の文は 1 つにまとめる（決まったこと 7）。
        merged = []
        for t in out:
            hit = next((m for m in merged if m["rank"] == t[0] and m["why"] == t[2] and t[3] not in ("-",) and t[3].split("/")[0] == m["targets"][0].split("/")[0]), None)
            if hit:
                hit["targets"].append(t[3])
                hit["lines"].append(t[4])
            else:
                merged.append(dict(rank=t[0], why=t[2], targets=[t[3]], lines=[t[4]]))
        return out, merged

    def sig(n, p):
        return ([c["id"] + ":" + gaps_at(c.get("gap"), p) for c in checks_at(n, p)], gaps_at(n.get("gap"), p), involvement(n, p))

    def changes(n, p):
        """前の段階からの「変わる」の中身。"""
        a, b = sig(n, p - 1), sig(n, p)
        out = []
        ca = {c.split(":")[0]: c.split(":", 1)[1] for c in a[0]}
        cb = {c.split(":")[0]: c.split(":", 1)[1] for c in b[0]}
        title = {c["id"]: c["title"] for c in n.get("checks", [])}
        for k in cb:
            if k not in ca:
                out.append(f"検査が増えた（{title[k]}）")
            elif ca[k] and not cb[k]:
                out.append(f"検査の gap が埋まった（{title[k]}：{ca[k]}）")
            elif cb[k] and not ca[k]:
                out.append(f"検査に gap が出た（{title[k]}：{cb[k]}）")
        for k in ca:
            if k not in cb:
                out.append(f"検査が減った（{title[k]}）")
        if a[1] != b[1]:
            out.append(f"gap：{a[1] or 'なし'} → {b[1] or 'なし'}")
        if a[2] != b[2]:
            out.append(f"人の関わり：{INV_JA[a[2]]} → {INV_JA[b[2]]}")
        for e in edges:
            if n["id"] not in (e["from"], e["to"]):
                continue
            ends = [byid[e["from"]], byid[e["to"]]]
            if not all(alive(x, p) and alive(x, p - 1) for x in ends):
                continue
            was = alive(e, p - 1)
            now = alive(e, p)
            if was != now:
                out.append(f"矢印が{'増えた' if now else '無くなった'}（{byid[e['from']]['_short']} → {byid[e['to']]['_short']}・{e['kind']}・{e.get('label', '')}）")
        return out

    def headline_a(p):
        ns = nodes_at(p)
        inv = {n["id"]: involvement(n, p) for n in ns}
        first, last = stages[0]["name"], stages[-1]["name"]
        head = f"{first}から{last}まで {len(stages)} 段。"
        A = [t["label"] for t in D.get("triggers", []) if t.get("by") == "human" and alive(byid.get(t["to"], {}), p)]
        inputs = [s["id"] for s in stages if s.get("group") == "input"] if any(s.get("group") for s in stages) else \
            [s["id"] for s in stages if all(n["layer"] == "upstream" for n in ns if n["stage"] == s["id"]) and any(n["stage"] == s["id"] for n in ns)]
        B = []
        inp_nodes = [n for n in ns if n["stage"] in inputs]
        if inp_nodes and all(inv[n["id"]] == "human" for n in inp_nodes):
            B.append(f"入力の {len(inputs)} 段")
            rest = [n for n in ns if inv[n["id"]] == "human" and n["stage"] not in inputs]
        else:
            rest = [n for n in ns if inv[n["id"]] == "human"]
        for s in stages:
            if any(n["stage"] == s["id"] for n in rest) and s["name"] not in B:
                B.append(s["name"])
        C = [s["name"] for s in stages if any(inv[n["id"]] == "cond" and n["stage"] == s["id"] for n in ns)]
        who = A + B
        if who:
            head += "人がやるのは" + "と".join(who) + ("、" + "・".join(C) + "は条件で人。" if C else "。")
        elif C:
            head += f"人は{'・'.join(C)}で条件つきで関わる。"
        else:
            head += "人は関わらない。"
        return head

    def main_path(p):
        # データの線の最長の道（最初の段から最後の段まで）。同じ段の中の線も入れる。
        ns = {n["id"] for n in nodes_at(p)}
        es = [e for e in edges_at(p) if e["kind"] == "data"]
        order = sorted(ns, key=lambda i: (sidx[byid[i]["stage"]], i))
        best = {}
        def longest(i):
            if i in best:
                return best[i]
            outs = [longest(e["to"]) for e in es if e["from"] == i]
            r = [i] + (max(outs, key=len) if outs else [])
            best[i] = r
            return r
        starts = [i for i in order if sidx[byid[i]["stage"]] == 0]
        return max((longest(i) for i in starts), key=len) if starts else []

    w = print
    w(f"# 答え合わせの表（{D.get('team', '')}・{D.get('repo', '')}）\n")
    w(f"`{path}` から `answer_key.py` で作った。図の描画には頼らない。\n")

    w("## 段の並びとフェーズ（a1）\n")
    w("| 順 | 段 | フェーズ |\n| --- | --- | --- |")
    for i, s in enumerate(stages):
        w(f"| {i + 1} | {s['name']} | {GROUP_JA.get(s.get('group'), '－')} |")
    w(f"\n- {len(stages)} 段。始まり：{stages[0]['name']}、終わり：{stages[-1]['name']}。")
    # a は今の段階で判定する（2026-11-16 に「最後の段階」から改めた）
    mp = main_path(cur)
    w(f"- 主な道（{phases[cur]['name']}、データの線の最長）：" + " → ".join(byid[i]["_short"] for i in mp))

    w("\n## 人の関わりときっかけ（a2）\n")
    w("| ノード | 段 | 役割 | " + " | ".join(p["name"] for p in phases) + " |")
    w("| --- | --- | --- | " + " | ".join("---" for _ in phases) + " |")
    for n in sorted(nodes, key=lambda n: (sidx[n["stage"]], n["id"])):
        cells = []
        for i in range(len(phases)):
            cells.append(INV_JA[involvement(n, i)] if alive(n, i) else "－")
        w(f"| {n['_short']} | {sname[n['stage']]} | {roles.get(n['role'], {}).get('name', n['role'])} | " + " | ".join(cells) + " |")
    for n in nodes:
        for g in arr(n.get("human_if")):
            t = g["text"] if isinstance(g, dict) else g
            since = g.get("since", "") if isinstance(g, dict) else ""
            w(f"\n- 条件で人の条件（{n['_short']}{'、' + since + ' から' if since else ''}）：{t}")
    for t in D.get("triggers", []):
        who = roles.get(t.get("role"), {}).get("name", "") if t.get("by") == "human" else ""
        w(f"- きっかけ：{BY_JA.get(t['by'], t['by'])}{'（' + who + '）' if who else ''}「{t['label']}」→ {byid[t['to']]['_short']}")
    w(f"- 見出しの規則（{phases[cur]['name']}）：{headline_a(cur)}")

    w("\n## 関門と戻り道（a3）\n")
    w("| 段階 | 人を置く関門（`human`） | 関門（戻しにくさ） | 直しの辺 | 学びの辺 |\n| --- | --- | --- | --- | --- |")
    for i, p in enumerate(phases):
        ns, es = nodes_at(i), edges_at(i)
        hum = "、".join(n["_short"] + ("（条件で人）" if involvement(n, i) == "cond" else "") for n in ns if n.get("human") is True) or "なし"
        gates = "、".join(f"{n['_short']}（{RISK_JA.get(n.get('risk'), '不明')}）" for n in ns if n.get("kind") == "gate")
        fx = "、".join(f"{byid[e['from']]['_short']} → {byid[e['to']]['_short']}" for e in es if e["kind"] == "fix") or "なし"
        ln = "、".join(f"{byid[e['from']]['_short']} → {byid[e['to']]['_short']}" for e in es if e["kind"] == "learn") or "なし"
        w(f"| {p['name']} | {hum} | {gates} | {fx} | {ln} |")

    w(f"\n## 足りないもの（b1〜b3、今の段階＝{phases[cur]['name']}）\n")
    raw, merged = gap_list(cur)
    w("| 位 | 重さの段 | 対象 | 文 |\n| --- | --- | --- | --- |")
    for k, m in enumerate(merged, 1):
        tgt = "、".join(byid[t.split('/')[0]]["_short"] + ("／" + t.split('/')[1] if "/" in t else "") if t.split('/')[0] in byid else t for t in m["targets"])
        w(f"| {k} | {m['rank']} {RANK_JA[m['rank']]} | {tgt} | {'<br>'.join(m['lines'])} |")
    top = merged[0] if merged else None
    if top:
        tid = top["targets"][0].split("/")[0]
        rel = [e for e in edges_at(cur) if e["kind"] in ("fix", "learn") and tid in (e["from"], e["to"])]
        w(f"\n- b1 の答え：1 位は「{byid[tid]['_short'] if tid in byid else tid}」（{top['why']}）。")
        w("- b3 の答え（1 位のノードにつながる直し・学びの辺）：" + ("、".join(f"{byid[e['from']]['_short']} → {byid[e['to']]['_short']}（{e['kind']}：{e.get('label', '')}）" for e in rel) or "なし"))

    w("\n## 段階ごとの差と足りないもの（c1〜c3）\n")
    w("| 段階 | 理由（note） | 足す | 無くす | 置き換え | 変わる（中身） | 足りないもの（そのまま／まとめて） |\n| --- | --- | --- | --- | --- | --- | --- |")
    for i, p in enumerate(phases):
        raw, merged = gap_list(i)
        if i == 0:
            w(f"| {p['name']} | {p.get('note', '')} | － | － | － | － | {len(raw)}／{len(merged)} |")
            continue
        prev, now = nodes_at(i - 1), nodes_at(i)
        added = [n for n in now if not alive(n, i - 1)]
        gone = [n for n in prev if not alive(n, i)]
        repl = [(g, a) for g in gone for a in added if g["stage"] == a["stage"]]
        rg = {g["id"] for g, _ in repl}
        ra = {a["id"] for _, a in repl}
        ch = [(n, changes(n, i)) for n in now if alive(n, i - 1)]
        ch = [(n, c) for n, c in ch if c]
        w(f"| {p['name']} | {p.get('note', '')} | {'、'.join(n['_short'] for n in added if n['id'] not in ra) or 'なし'} | "
          f"{'、'.join(n['_short'] for n in gone if n['id'] not in rg) or 'なし'} | "
          f"{'、'.join(g['_short'] + ' ⇄ ' + a['_short'] for g, a in repl) or 'なし'} | "
          f"{'<br>'.join(n['_short'] + '：' + '、'.join(c) for n, c in ch) or 'なし'} | {len(raw)}／{len(merged)} |")
    w("\n足りないものの数の「そのまま」は 3e4fc5c の図のタブの数え方（最上位の `gaps` を除く）、「まとめて」は同じ理由の文を 1 つにしたもの。")
    w("\n### 段階ごとの足りないもの（まとめたあと、重さの順）\n")
    for i, p in enumerate(phases):
        _, merged = gap_list(i)
        w(f"- {p['name']}：" + ("／".join(m["lines"][0] + (f"（ほか {len(m['lines']) - 1} 行）" if len(m["lines"]) > 1 else "") for m in merged) or "なし"))


if __name__ == "__main__":
    main(sys.argv[1])
