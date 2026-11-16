// create-frontier-team/canvas.html の試験。依存は無く、headless の Chrome を DevTools Protocol で動かす。
// 設計書（docs/specs/frontier-canvas.md）の「操作」の試験と、「図の直しの完了」のうち機械で確かめられるものを見る。
//
//   node tests/canvas/run.mjs                 # 試験だけ
//   node tests/canvas/run.mjs --shots <dir>   # 画面も撮る（1440×900 と 1280×800）
//
// Chrome の場所は環境変数 CHROME で渡せる。無ければよくある場所を探す。起動した Chrome は、終わりに自分の PID だけを止める。
import { spawn, execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync } from "node:fs";
import { tmpdir, homedir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const CANVAS = join(ROOT, "create-frontier-team/canvas.html");
const SORAMAME = join(ROOT, "docs/specs/frontier-canvas/soramame.json");
const args = process.argv.slice(2);
const SHOTS = args.includes("--shots") ? resolve(args[args.indexOf("--shots") + 1]) : null;

// ---- 埋め込み（SKILL.md の進め方の 4 と同じ置き換え） ----
const work = mkdtempSync(join(tmpdir(), "canvas-test-"));
const embed = (spec, overlay, name) => {
  let h = readFileSync(CANVAS, "utf8");
  if (spec != null) h = h.replace("/*DESIGN*/null", () => spec.replaceAll("</", "<\\/"));
  if (overlay != null) h = h.replace("/*OVERLAY*/null", () => overlay.replaceAll("</", "<\\/"));
  const p = join(work, name); writeFileSync(p, h); return "file://" + p;
};
const soramameText = readFileSync(SORAMAME, "utf8");
const overlayText = readFileSync(join(HERE, "soramame-overlay.json"), "utf8");
const soraCur = JSON.parse(soramameText); soraCur.phases[1].current = true; // 段階1 を「今」にした版
const soraTobe = JSON.parse(soramameText); soraTobe.phases[3].current = true; // 目指す形を「今」にした版（a の描き方を、全部のカードで見る）
const PAGES = {
  sora: embed(soramameText, overlayText, "soramame.html"),
  soraTobe: embed(JSON.stringify(soraTobe), overlayText, "soramame-tobe.html"),
  trig: embed(readFileSync(join(HERE, "triggers.json"), "utf8"), null, "triggers.html"),
  soraPlain: embed(soramameText, null, "soramame-plain.html"),
  soraCur: embed(JSON.stringify(soraCur), null, "soramame-current.html"),
  v1: embed(readFileSync(join(HERE, "v1.json"), "utf8"), null, "v1.html"),
  broken: embed(readFileSync(join(HERE, "broken.json"), "utf8"), "{not json", "broken.html"),
  bare: embed(null, null, "bare.html"),
};

// ---- Chrome ----
const findChrome = () => {
  if (process.env.CHROME) return process.env.CHROME;
  const c = ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium"];
  const pw = join(homedir(), "Library/Caches/ms-playwright");
  if (existsSync(pw)) for (const d of readdirSync(pw).filter((x) => x.startsWith("chromium-")).sort().reverse()) {
    c.push(join(pw, d, "chrome-mac/Chromium.app/Contents/MacOS/Chromium"), join(pw, d, "chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"), join(pw, d, "chrome-linux/chrome"));
  }
  for (const p of c) if (existsSync(p)) return p;
  for (const n of ["google-chrome", "chromium", "chromium-browser"]) { try { return execFileSync("which", [n]).toString().trim(); } catch { /* 無い */ } }
  throw new Error("Chrome が見つからない。環境変数 CHROME に場所を入れてください。");
};
const profile = join(work, "profile");
const chrome = spawn(findChrome(), ["--headless=new", "--remote-debugging-port=0", "--user-data-dir=" + profile, "--no-first-run", "--no-default-browser-check", "--disable-gpu", "--hide-scrollbars", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows", "--force-device-scale-factor=1", "about:blank"], { stdio: ["ignore", "ignore", "pipe"], detached: true });
// 止めるのは、ここで起動した Chrome（とその子）だけ。PID のプロセスグループで止める。
const stop = () => { try { process.kill(-chrome.pid); } catch { try { process.kill(chrome.pid); } catch { /* もう止まっている */ } } try { rmSync(work, { recursive: true, force: true }); } catch { /* 消せなくてもよい */ } };
process.on("exit", stop);
process.on("SIGINT", () => process.exit(130)); process.on("SIGTERM", () => process.exit(143));
const LIMIT = setTimeout(() => { console.log("時間切れ（" + (step || "") + "）"); process.exit(2); }, 360000);
let step = "";
const log = (s) => { step = s; if (process.env.DEBUG) console.log("…" + s); };
const wsUrl = await new Promise((ok, ng) => {
  let buf = ""; const t = setTimeout(() => ng(new Error("Chrome が起動しない")), 20000);
  chrome.stderr.on("data", (d) => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(t); ok(m[1]); } });
  chrome.on("exit", (c) => ng(new Error("Chrome が止まった：" + c)));
});
const port = new URL(wsUrl).port;
const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((ok) => ws.addEventListener("open", ok, { once: true }));
let seq = 0; const waits = new Map(), listeners = [];
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && waits.has(m.id)) { const [ok, ng] = waits.get(m.id); waits.delete(m.id); m.error ? ng(new Error(m.error.message)) : ok(m.result); }
  else listeners.forEach((f) => f(m));
});
const send = (method, params = {}) => new Promise((ok, ng) => { const id = ++seq; waits.set(id, [ok, ng]); ws.send(JSON.stringify({ id, method, params })); });
const errors = [];
listeners.push((m) => {
  if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push(m.params.args.map((a) => a.value).join(" "));
});
await send("Page.enable"); await send("Runtime.enable");

const viewport = (w, h) => send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });
const open = async (url) => {
  await send("Page.navigate", { url: "about:blank" });
  const loaded = new Promise((ok) => { const f = (m) => { if (m.method === "Page.loadEventFired") { listeners.splice(listeners.indexOf(f), 1); ok(); } }; listeners.push(f); });
  await send("Page.navigate", { url });
  await loaded;
  await js("document.fonts.ready.then(() => true)");
};
const js = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error("評価で失敗：" + (r.exceptionDetails.exception?.description || r.exceptionDetails.text) + "\n" + expr.slice(0, 200));
  return r.result.value;
};
const KEYS = { Tab: 9, Enter: 13, Escape: 27, " ": 32, PageDown: 34, End: 35, Home: 36, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40 };
const press = async (key, shift = false) => {
  const base = { key, code: key === " " ? "Space" : key, windowsVirtualKeyCode: KEYS[key], nativeVirtualKeyCode: KEYS[key], modifiers: shift ? 8 : 0 };
  await send("Input.dispatchKeyEvent", Object.assign({ type: "rawKeyDown" }, base));
  if (key === "Enter" || key === " ") await send("Input.dispatchKeyEvent", Object.assign({ type: "char", text: key === "Enter" ? "\r" : " " }, base));
  await send("Input.dispatchKeyEvent", Object.assign({ type: "keyUp" }, base));
};
const shot = async (name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  const r = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(SHOTS, name + ".png"), Buffer.from(r.data, "base64"));
};
// hash を変え、図の hashchange（描き直し）が済むのを待つ
const go = (hash) => js(`new Promise((ok) => { const h = ${JSON.stringify(hash)}; if (location.hash === "#" + h) return ok(true); addEventListener("hashchange", () => setTimeout(() => ok(true)), { once: true }); location.hash = h; })`);

// ---- 試験の道具 ----
let pass = 0; const fails = [];
const check = (name, cond, info = "") => { log(name); if (cond) pass++; else fails.push(name + (info ? "：" + info : "")); };
const cut = (x) => { const s = JSON.stringify(x); return s.length > 400 ? s.slice(0, 400) + "…" : s; };
const eq = (name, a, b) => check(name, JSON.stringify(a) === JSON.stringify(b), `期待 ${cut(b)}、実際 ${cut(a)}`);
const headline = () => js(`document.getElementById("headline").textContent`);
const active = () => js(`(() => { const a = document.activeElement; return a.dataset.nodeId ? "card:" + a.dataset.nodeId : a.id ? "#" + a.id : a.getAttribute("role") === "option" ? "option:" + a.closest("[role=listbox]").id + ":" + a.dataset.key : a.closest("#tip") ? "tip:" + a.className : a.tagName; })()`);
// ページの中で使う道具（見えているか、図の座標、窓の重なり）
const HELP = `
  window.__vis = (e) => !!e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== "hidden";
  window.__cards = () => [...document.querySelectorAll(".card")].filter(__vis);
  window.__fs = (t) => parseFloat(t.getAttribute("font-size") || getComputedStyle(t).fontSize) * t.getScreenCTM().a;
  true;`;

try {
  // ==== そらまめ 1440×900 ====
  await viewport(1440, 900);
  await open(PAGES.sora); await js(HELP);

  // 開いたとき：見方 a、チェックボックスと凡例と雛形が無い
  eq("開いたときの見方", await js(`document.querySelector("[role=tab][aria-selected=true]").dataset.v`), "a");
  eq("チェックボックスが無い", await js(`document.querySelectorAll("input").length`), 0);
  check("チケットの雛形が無い", !(await js(`document.body.innerText.includes("雛形") || document.body.innerHTML.includes("## ゴール")`)));
  eq("画面の枠の要素（見方 3・表 1）", await js(`[...document.querySelectorAll("#top button")].filter(__vis).map((b) => b.textContent)`), ["全体を掴む", "次に直す", "移行", "表"]);
  check("凡例が無い", !(await js(`/凡例|legend/i.test(document.body.innerHTML.replace(/<script[\\s\\S]*?<\\/script>/g, ""))`)));
  // a は今の段階を描く（current が無ければ最初の段階。2026-11-16 に改めた）。目指す形で足すカードは出さない
  eq("見出し a（今の段階を描き、頭にその名前）", await headline(), "今：要求・原則から評価まで 8 段。人がやるのは機能の依頼と入力の 3 段と検証とマージ。");
  eq("a のカードは今の段階のもの", await js(`__cards().map((g) => g.dataset.nodeId)`), ["n1", "n2", "n3", "n4", "n6", "n9", "n8h"]);
  // ここから下の a の描き方は、目指す形を今にした版で、全部のカードについて見る
  await open(PAGES.soraTobe); await js(HELP);
  eq("見出し a（頭にどの段階の図か）", await headline(), "目指す形：要求・原則から評価まで 8 段。人がやるのは機能の依頼と入力の 3 段、マージは条件で人。");
  check("a の下の 1 行に段階の名前を重ねない", !(await js(`document.querySelector("[data-layer=bg] text:nth-of-type(2)").textContent`)).includes("目指す形"));
  eq("a のカードの札", await js(`__cards().map((g) => g.dataset.nodeId + ":" + [...g.querySelectorAll("text")].map((t) => t.textContent).filter((t) => ["人", "条件で人", "エージェント", "自動"].includes(t)).join())`),
    ["n1:人", "n2:人", "n3:人", "n4:エージェント", "n5:自動", "n6:エージェント", "n7:自動", "n8:エージェント", "n9:条件で人", "dc:自動", "n10:自動", "n11:エージェント"]);
  // 情報 I1（2026-11-16）：a に関門の印と直しの線。直しの線は細く薄い破線で、データの線より軽い。学びの線は出さない
  eq("a に直しの線（目指す形で生きているもの）", await js(`[...document.querySelectorAll("[data-layer=back] g")].filter(__vis).map((g) => g.dataset.edgeId).sort()`), ["dc>n4:fix", "n7>n4:fix", "n7>n6:fix", "n8>n6:fix", "n9>n6:fix"]);
  eq("a に学びの線を出さない", await js(`[...document.querySelectorAll("g[data-edge-id]")].filter((g) => __vis(g) && g.dataset.edgeId.endsWith(":learn")).length`), 0);
  check("a の直しの線は破線で、データの線より細く薄い", await js(`(() => {
    const fx = [...document.querySelectorAll("[data-layer=back] g")].filter(__vis).map((g) => g.querySelector("path"));
    const dt = [...document.querySelectorAll("[data-layer=thin] g")].filter(__vis).map((g) => g.querySelector("path"));
    const lum = (c) => { const n = parseInt(c.slice(1), 16); return ((n >> 16) & 255) + ((n >> 8) & 255) + (n & 255); };
    return fx.length && dt.length && fx.every((p) => p.getAttribute("stroke-dasharray") && +p.getAttribute("stroke-width") < Math.min(...dt.map((d) => +d.getAttribute("stroke-width"))) && lum(p.getAttribute("stroke")) > Math.max(...dt.map((d) => lum(d.getAttribute("stroke")))));
  })()`));
  eq("a の関門に印", await js(`__cards().filter((g) => __vis(g.querySelector(".gate"))).map((g) => g.dataset.nodeId)`), ["n7", "n8", "n9"]);
  // 印は、カードの中の字（関わりの札・名前）にも、上から入る矢印にも重ならない
  eq("a の関門の印がほかの字と矢印に重ならない", await js(`(() => {
    const box = (e) => e.getBoundingClientRect(), hit = (a, b) => Math.min(a.right, b.right) > Math.max(a.left, b.left) + 0.5 && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top) + 0.5;
    const marks = __cards().map((g) => g.querySelector(".gate")).filter((m) => m && __vis(m));
    const others = [...document.querySelectorAll(".card text, [data-layer=main] path, [data-layer=thin] path, [data-layer=top] text")].filter((t) => __vis(t) && !t.closest(".gate") && (t.textContent || t.tagName === "path"));
    return marks.flatMap((m) => others.filter((o) => hit(box(m), box(o))).map((o) => m.closest(".card").dataset.nodeId + ":" + (o.textContent || o.parentNode.dataset.edgeId)));
  })()`), []);
  check("a にきっかけ 2 つ", (await js(`document.querySelector("[data-layer=top]").textContent`)).includes("プロダクトオーナーが渡す：機能の依頼") && (await js(`document.querySelector("[data-layer=top]").textContent`)).includes("定期：毎週"));
  check("a にフェーズの行", ["入力", "振り分け", "候補", "出力"].every((g) => true) && (await js(`["入力","振り分け","候補","出力"].every((g) => [...document.querySelectorAll("[data-layer=dyn] text")].some((t) => t.textContent === g))`)));
  check("a の条件で人のカードに条件の文", (await js(`document.querySelector("[data-node-id=n9]").textContent`)).includes("移行・削除"));
  eq("a の主な道（データの線の最長の道。同じ段の中の矢印も入れる）", await js(`[...document.querySelectorAll("[data-layer=main] g[data-edge-id]")].filter(__vis).map((g) => g.dataset.edgeId)`).then((l) => l.sort()),
    ["n1>n2:data", "n2>n4:data", "n4>n5:data", "n5>n6:data", "n6>n7:data", "n7>n8:data", "n8>n9:data", "n9>dc:data", "dc>n10:data", "n10>n11:data"].sort());
  check("a の主な道は濃い線", await js(`[...document.querySelectorAll("[data-layer=main] g[data-edge-id] path")].filter(__vis).every((x) => x.getAttribute("stroke") === "#6e665b")`));
  check("赤を a で使わない", !(await js(`document.getElementById("v").innerHTML.toLowerCase().includes("#c23a22")`)));
  await open(PAGES.sora); await js(HELP);

  // 属性
  const attrs = await js(`["data-node-id","data-edge-id","data-check-id","data-role-id","data-stage-id"].map((a) => document.querySelectorAll("[" + a + "]").length)`);
  check("data-*-id がある", attrs.every((n) => n > 0), JSON.stringify(attrs));
  check("辺の ID の決め方（from>to:kind）", await js(`!!document.querySelector('[data-edge-id="n7>n6:fix"]') && !!document.querySelector('[data-edge-id="n1>n2:data"]')`));
  check("検査の ID（ノード/検査）", await js(`!!document.querySelector('[data-check-id="n7/test"]')`));

  // 位置が動かない：すべての見方と段階で、カードの枠と線の座標が同じ
  const geo = `JSON.stringify([...document.querySelectorAll(".card")].map((g) => [g.dataset.nodeId, g.querySelector("rect:nth-of-type(3)").getAttribute("x"), g.querySelector("rect:nth-of-type(3)").getAttribute("y")]).concat([...document.querySelectorAll("g[data-edge-id] > path:first-child")].map((p) => [p.parentNode.dataset.edgeId, p.getAttribute("d")])))`;
  const g0 = await js(geo);
  for (const h of ["b", "b&sel=n8h", "c&p=asis", "c&p=step1", "c&p=step2", "c", "c&p=step1&sel=n7", "a&sel=n9"]) { await go(h); eq("位置が変わらない（#" + h + "）", await js(geo), g0); }
  // 同じ仕様書からは同じ図
  await open(PAGES.sora); const svg1 = await js(`document.getElementById("v").outerHTML`);
  await open(PAGES.sora); await js(HELP); check("同じ仕様書からは同じ図", (await js(`document.getElementById("v").outerHTML`)) === svg1);

  // 名前は 14px 以上（1440×900、どの見方でも）。カードの字が枠からはみ出さない（表から戻ったときも）
  const spill = `__cards().filter((g) => { const f = g.querySelector("rect:nth-of-type(3)"), r = +f.getAttribute("x") + +f.getAttribute("width"); return [...g.querySelectorAll("text")].some((t) => __vis(t) && t.textContent && !t.closest("g g") && t.getBBox().x + t.getBBox().width > r + 0.5); }).map((g) => g.dataset.nodeId)`;
  for (const h of ["a", "b", "c&p=asis", "c&p=step1", "c&p=step2", "c", "a&table", "b"]) {
    await go(h);
    if (h.includes("table")) continue;
    const m = await js(`Math.min(...__cards().map((g) => __fs(g.querySelector("text:nth-of-type(2)"))))`);
    check(`カードの名前が 14px 以上（1440×900 #${h}）`, m >= 14, m.toFixed(2) + "px");
    eq(`カードの字が枠に収まる（#${h}）`, await js(spill), []);
    eq(`スキル名を切らない（#${h}）`, await js(`__cards().map((g) => [...g.querySelectorAll("text")].find((t) => t.getAttribute("font-family") && t.getAttribute("font-family").includes("Mono"))).filter((t) => t && __vis(t) && t.textContent.includes("…")).map((t) => t.closest(".card").dataset.nodeId)`), []);
  }

  // ブラウザの中の高さは 800px ほどになることが多い（設計書の「作って分かったこと」）。1440×800 でも見る
  await viewport(1440, 800);
  for (const h of ["a", "b", "c"]) {
    await go(h);
    const m = await js(`Math.min(...__cards().map((g) => __fs(g.querySelector("text:nth-of-type(2)"))))`);
    check(`カードの名前が 14px 以上（1440×800 #${h}）`, m >= 14, m.toFixed(2) + "px");
  }
  await viewport(1440, 900);

  // ==== 見方 b ====
  await go("b");
  eq("見出し b（1 位がこの先で置き換わることを添える）", await headline(), "次に直すのは「人のレビュー」（段階1 で置き換える予定）：レビューの観点が書かれていない。");
  eq("b の一覧（重さの順。1 位に置き換える予定）", await js(`[...document.querySelectorAll("#gapList [role=option]")].map((o) => o.textContent)`),
    ["人のレビューレビューの観点が書かれていない段階1 で置き換える予定", "人のレビュー流れの途中に人がいる（人を置くのは 1 か所に絞る）", "流れ全体学びの辺が無い（評価から、分ける所か入力へ戻す矢印）", "人のレビュー段「検証」に、スキルの決まったノードが無い", "段「評価」段「評価」にノードが無い"]);
  eq("b の重さの段", await js(`[...document.querySelectorAll("#gapList [role=group]")].map((g) => document.getElementById(g.getAttribute("aria-labelledby")).textContent)`), ["戻しにくさ", "人の関門と戻り道", "スキル", "書き漏れ"]);
  check("b は今の段階で判定（見出しの下と一覧）", (await js(`document.getElementById("v").textContent`)).includes("今の段階「今」で判定") && (await js(`document.getElementById("panel").textContent`)).includes("今の段階「今」で判定"));
  eq("赤は 1 位のカードだけ", await js(`[...document.querySelectorAll(".card")].filter((g) => __vis(g) && g.innerHTML.toLowerCase().includes("#c23a22")).map((g) => g.dataset.nodeId)`), ["n8h"]);
  eq("b の既定では戻り道の線を出さない", await js(`[...document.querySelectorAll("[data-layer=back] g")].filter(__vis).length`), 0);
  check("b の戻り先に、数と分かる「直しで戻る 2 本」", (await js(`document.querySelector("[data-layer=dyn]").textContent`)).includes("直しで戻る 2 本"));
  check("b に段階の切り替えが無い", !(await js(`!!document.getElementById("phaseList")`)));
  // 一覧で選ぶ → 図のカードが選ばれ、戻り道が出る
  await js(`document.querySelector("#gapList [role=option]").click(); true`);
  eq("一覧で選ぶとカードが選ばれる", await js(`[...document.querySelectorAll(".card[aria-expanded=true]")].map((g) => g.dataset.nodeId)`), ["n8h"]);
  eq("選んだカードの戻り道だけ出る", await js(`[...document.querySelectorAll("[data-layer=back] g")].filter(__vis).map((g) => g.dataset.edgeId)`), ["n8h>n6:fix"]);
  eq("一覧の選びに aria-selected", await js(`document.querySelector("#gapList [aria-selected=true]").dataset.key`), "g0");
  // 詳細の窓：題は短い名前、その下に題名。足りないものと戻り道は「／」でつながず 1 行ずつ
  eq("窓の題は短い名前、下に題名", await js(`[document.getElementById("tipTitle").textContent, document.querySelector("#tip .full").textContent]`), ["人のレビュー", "テックリードがすべての PR を読む"]);
  eq("窓の足りないものは 1 行ずつ", await js(`[...document.querySelectorAll("#tip .r")].find((r) => r.firstChild.textContent === "足りない").querySelectorAll("li").length`), 3);
  check("窓の足りないものを「／」でつながない", !(await js(`[...document.querySelectorAll("#tip .r")].find((r) => r.firstChild.textContent === "足りない").textContent`)).includes("／"));
  check("窓の 1 位に置き換える予定", (await js(`document.getElementById("tip").textContent`)).includes("【次に直す】レビューの観点が書かれていない（段階1 で置き換える予定）"));
  // 段階1 を「今」にした版：同じ理由（CI がまだ無い）は 1 行にまとまり、検査を選ぶと関門の中の検査が示される
  await open(PAGES.soraCur + "#b"); await js(HELP);
  const curList = await js(`[...document.querySelectorAll("#gapList [role=option]")].map((o) => o.textContent)`);
  eq("段階1 が今：件数", curList.length, 3);
  check("段階1 が今：1 位は学びの辺", curList[0].includes("学びの辺が無い"), curList[0]);
  check("段階1 が今：1 位がこの先で消えないなら「予定」を書かない", !(await headline()).includes("予定") && !curList[0].includes("予定"), await headline());
  check("段階1 が今：CI の 3 行が 1 行に", curList.filter((t) => t.includes("CI がまだ無い")).length === 1 && curList.some((t) => t.includes("CI がまだ無い（テスト・型・lint）")), JSON.stringify(curList));
  await js(`[...document.querySelectorAll("#gapList [role=option]")].find((o) => o.textContent.includes("CI")).click(); true`);
  eq("検査の足りないものを選ぶと関門の中の検査を示す", await js(`[...document.querySelectorAll("#tip li[aria-current=true]")].map((l) => l.dataset.checkId)`), ["n7/test", "n7/type", "n7/lint"]);

  // ==== 見方 c ====
  await open(PAGES.sora); await js(HELP);
  const cHead = {};
  for (const p of ["asis", "step1", "step2", "tobe"]) { await go("c&p=" + p); cHead[p] = await headline(); }
  eq("見出し c（段階1）", cHead.step1, "段階1：検査とレビューを自動に：人のレビューを決定的な検査・レビューに置き換える。");
  eq("見出し c（段階2）", cHead.step2, "段階2：CI を入れる：決定的な検査・マージが変わる。");
  eq("見出し c（目指す形）", cHead.tobe, "目指す形：worktree に配る ほか 3 つを足す、決定的な検査が変わる、線 1 本が無くなる。");
  await go("c&p=step1");
  check("c：無くなったカードが跡として残る", await js(`(() => { const g = document.querySelector("[data-node-id=n8h]"); return __vis(g) && g.textContent.includes("無くなる"); })()`));
  check("c：置き換えの印", (await js(`document.querySelector("[data-node-id=n7]").textContent`)).includes("⇄ 置き換え"));
  check("c：差の一覧に置き換えが 1 行", (await js(`[...document.querySelectorAll("#diffList [role=option]")].map((o) => o.textContent)`)).join("|") === "置き換え人のレビュー → 決定的な検査・レビュー");
  await go("c&p=step2");
  const d2 = await js(`[...document.querySelectorAll("#diffList [role=option]")].map((o) => o.textContent)`);
  check("c：変わるの中身（検査・gap・人の関わり）", d2.some((t) => t.includes("足りないものが埋まった：テスト・型・lint")) && d2.some((t) => t.includes("人の関わり：人 → 条件で人")) && d2.some((t) => t.includes("検査が無くなった：すべての差分を読む")), JSON.stringify(d2));
  check("c：段階の理由（note）", (await js(`document.getElementById("panel").textContent`)).includes("ノードは変えない。検査を CI に載せ"));
  check("c：段階1 で跡（段階2 では出さない）", await js(`!__vis(document.querySelector("[data-node-id=n8h]"))`));
  eq("c：段階ごとの足りないものの数", await js(`[...document.querySelectorAll("#phaseList .n")].map((x) => x.textContent)`), ["足りない 5", "足りない 3", "足りない 3", "足りない 1"]);
  // 問い c3：選んだ段階の足りないものを、中身まで（b と同じまとめ方。同じ理由は 1 行）
  const cGaps = {};
  for (const p of ["asis", "step1", "step2", "tobe"]) { await go("c&p=" + p); cGaps[p] = await js(`[...document.querySelectorAll("#phaseList [aria-selected=true] li")].map((l) => l.textContent)`); }
  eq("c：段階1 の足りないものの中身", cGaps.step1, ["流れ全体学びの辺が無い（評価から、分ける所か入力へ戻す矢印）", "決定的な検査CI がまだ無い（テスト・型・lint）", "段「評価」段「評価」にノードが無い"]);
  eq("c：中身の行の数は足りないものの数と同じ", [cGaps.asis.length, cGaps.step1.length, cGaps.step2.length, cGaps.tobe.length], [5, 3, 3, 1]);
  eq("c：選んでいない段階には中身を出さない", await js(`[...document.querySelectorAll("#phaseList [aria-selected=false] li")].length`), 0);
  check("c：一覧に赤を使わない", !(await js(`[...document.querySelectorAll("#panel *")].some((e) => /rgb\(194, 58, 34\)/.test(getComputedStyle(e).color + getComputedStyle(e).borderColor))`)));
  // c で選んだ段階は、ほかの見方へ移っても残る（hash の p=）
  await go("c&p=step1");
  await js(`document.getElementById("tab-b").click(); true`);
  check("c の段階が b へ移っても hash に残る", (await js(`location.hash`)).includes("p=step1"), await js(`location.hash`));
  eq("b の判定は今の段階のまま", await headline(), "次に直すのは「人のレビュー」（段階1 で置き換える予定）：レビューの観点が書かれていない。");
  await js(`document.getElementById("tab-a").click(); true`);
  await js(`document.getElementById("tab-c").click(); true`);
  eq("c へ戻ると選んだ段階のまま", [await js(`location.hash`), await js(`document.querySelector("#phaseList [aria-selected=true]").dataset.key`)], ["#c&p=step1", "step1"]);
  await go("c");
  check("c：線が無くなった跡", await js(`(() => { const g = document.querySelector('[data-edge-id="n4>n6:data"]'); return __vis(g) && g.querySelector("path").getAttribute("stroke-dasharray") === "2 3"; })()`));

  // ==== 注記 ====
  await go("a");
  check("注記：a でカードに札", (await js(`document.querySelector("[data-node-id=n9]").textContent`)).includes("✎ 差し戻し 12%"));
  await go("b&sel=n9");
  check("注記：b でカードに札", (await js(`document.querySelector("[data-node-id=n9]").textContent`)).includes("✎ 差し戻し 12%"));
  check("注記：b で線に札（選んだ戻り道）", await js(`[...document.querySelectorAll('[data-layer=top] [data-edge-id="n9>n6:fix"]')].some(__vis)`));
  check("注記：検査の注記は詳細の中の検査に", (await js(`document.querySelector('#tip li[data-check-id="n9/risk"]').textContent`)).includes("見落とし 1"));
  await go("c");
  eq("関門の印は c に出さない", await js(`[...document.querySelectorAll(".gate")].filter(__vis).length`), 0);
  await go("b"); eq("関門の印は b に出さない（b は左上に戻しにくさ）", await js(`[...document.querySelectorAll(".gate")].filter(__vis).length`), 0);
  await go("c");
  check("注記：c では出さない", !(await js(`[...document.querySelectorAll("[data-node-id=n9] text")].some((t) => __vis(t) && t.textContent.includes("✎"))`)));
  await go("a&table");
  // 表はページそのものがスクロールする（ホイール・PageDown・キー）。中の箱だけが動く形にしない
  check("表：ページが表の長さまでスクロールできる", await js(`document.scrollingElement.scrollHeight > innerHeight + 200`), await js(`document.scrollingElement.scrollHeight + "/" + innerHeight`));
  check("表：中の箱だけがスクロールする形でない", await js(`(() => { const t = document.getElementById("table"); return t.scrollHeight <= t.clientHeight + 1; })()`));
  eq("表：キーボードで入れる", await js(`document.getElementById("table").tabIndex`), 0);
  await js(`scrollTo(0, 0); document.getElementById("table").focus(); true`);
  await press("PageDown"); await js(`new Promise((ok) => setTimeout(() => ok(true), 300))`);
  check("表：PageDown でページが動く", (await js(`scrollY`)) > 100, String(await js(`scrollY`)));
  await press("End"); await js(`new Promise((ok) => setTimeout(() => ok(true), 300))`);
  check("表：End で終わりまで動く", (await js(`scrollY + innerHeight >= document.scrollingElement.scrollHeight - 2`)));
  await js(`scrollTo(0, 0); true`);
  eq("表：短い名前を先に、題名を下に", await js(`[...document.querySelector('#table tr[data-node-id="n8"]').children[2].children].slice(0, 2).map((x) => x.tagName + ":" + x.textContent)`), ["B:レビュー", "SMALL:規約と仕様のレビュー"]);
  check("表：題名と短い名前が同じなら 1 つだけ", await js(`!document.querySelector('#table tr[data-node-id="n7"]').children[2].querySelector("small")`));
  check("表：図に無い対象の注記", (await js(`document.getElementById("table").textContent`)).includes("node:n99（図に無い対象）"));
  eq("表：ノードの行", await js(`document.querySelectorAll("#table tr[data-node-id]").length`), 13);
  eq("表：役割 × 段 × スキル × セッション × ツールの列", await js(`[...document.querySelectorAll("#table table:first-of-type th")].map((t) => t.textContent).filter((t) => ["段", "役割", "スキル", "セッション", "ツール"].includes(t))`), ["段", "役割", "セッション", "スキル", "ツール"]);
  eq("表：セッションの中身", await js(`[...document.querySelectorAll("#table tr[data-node-id]")].map((r) => r.children[4].textContent).slice(0, 5)`), ["計画", "計画", "計画", "計画", "自動"]);
  check("表：表の中にチケットの雛形が無い", !(await js(`document.getElementById("table").textContent.includes("雛形")`)));

  // ==== 詳細の窓が、選んだカード・戻り道・戻り先・見出しの帯を隠さない ====
  for (const [w, h] of [[1440, 900], [1280, 800]]) {
    await viewport(w, h);
    for (const v of ["a", "b", "c&p=asis", "c&p=step1", "c&p=step2", "c"]) {
      await go(v);
      const ids = await js(`__cards().map((g) => g.dataset.nodeId)`);
      for (const id of ids) {
        await go(v + "&sel=" + id);
        const bad = await js(`(() => {
          const tip = document.getElementById("tip"); if (tip.hidden) return "窓が出ない";
          const t = tip.getBoundingClientRect(), hit = (r) => Math.min(t.right, r.right) > Math.max(t.left, r.left) + 0.5 && Math.min(t.bottom, r.bottom) > Math.max(t.top, r.top) + 0.5;
          const sel = "${id}", view = document.body.dataset.view;
          const guard = [document.querySelector('[data-node-id="' + sel + '"]')];
          [...document.querySelectorAll("g[data-edge-id]")].filter((g) => __vis(g) && g.querySelector("path")).forEach((g) => {
            const [f, rest] = g.dataset.edgeId.split(">"), to = rest.split(":")[0], kind = rest.split(":")[1].split("#")[0];
            if ((f === sel || to === sel) && (kind === "data" || view === "b" || (view === "a" && kind === "fix"))) { guard.push(document.querySelector('[data-node-id="' + f + '"]'), document.querySelector('[data-node-id="' + to + '"]')); if (kind !== "data") guard.push(g); }
          });
          const over = guard.filter((g) => g && __vis(g) && hit(g.getBoundingClientRect())).map((g) => g.dataset.nodeId || g.dataset.edgeId);
          const head = document.querySelector("[data-stage-id]").getBoundingClientRect();
          if (t.top < head.bottom - 1 && !tip.classList.contains("dock")) over.push("段の名前の帯");
          if (document.getElementById("panel").getBoundingClientRect().width && getComputedStyle(document.getElementById("panel")).display !== "none" && t.right > document.getElementById("panel").getBoundingClientRect().left + 0.5) over.push("右の一覧");
          return over.join(",");
        })()`);
        check(`詳細の窓が隠さない（${w}×${h} #${v}&sel=${id}）`, !bad, bad);
      }
    }
  }
  await viewport(1440, 900);

  // ==== 操作：役と名前 ====
  await open(PAGES.sora + "#b"); await js(HELP);
  eq("tablist と tab", await js(`[document.querySelectorAll("[role=tablist]").length, document.querySelectorAll("[role=tablist] [role=tab]").length]`), [1, 3]);
  check("listbox と option と group", await js(`!!document.querySelector("#gapList[role=listbox] [role=group] [role=option]")`));
  const label = await js(`document.querySelector("[data-node-id=n8h]").getAttribute("aria-label")`);
  check("カードの名前（名前・関わり・段・役割・足りない）", label.startsWith("人のレビュー、人、段 6「検証」、テックリード、足りない："), label);
  check("カードは button 役", await js(`[...document.querySelectorAll(".card")].every((g) => g.getAttribute("role") === "button")`));

  // ==== 操作：キーボードだけで ====
  await open(PAGES.sora); await js(HELP);
  await js(`document.activeElement.blur(); true`);
  const order = [];
  for (let i = 0; i < 4; i++) { await press("Tab"); order.push(await active()); }
  eq("Tab の順（a）：見方 → 表 → 図", order.slice(0, 3), ["#tab-a", "#tableBtn", "card:n1"]);
  // 見方の切り替え：← → Home End
  await js(`document.getElementById("tab-a").focus(); true`);
  await press("ArrowRight"); eq("→ で次に直す", [await active(), await js(`document.body.dataset.view`)], ["#tab-b", "b"]);
  await press("End"); eq("End で移行", [await active(), await js(`document.body.dataset.view`)], ["#tab-c", "c"]);
  await press("Home"); eq("Home で全体を掴む", [await active(), await js(`document.body.dataset.view`)], ["#tab-a", "a"]);
  await press("ArrowLeft"); eq("← で端から反対の端へ", await js(`document.body.dataset.view`), "c");
  await press("ArrowRight"); eq("→ で端から反対の端へ", await js(`document.body.dataset.view`), "a");
  // b：見方 → 表 → 図 → 一覧 → 窓
  await press("ArrowRight"); // b
  const ob = [];
  for (let i = 0; i < 3; i++) { await press("Tab"); ob.push(await active()); }
  eq("Tab の順（b）：表 → 図 → 一覧", ob, ["#tableBtn", "card:n8h", "option:gapList:g0"]);
  await press("ArrowDown"); eq("一覧で ↓", await active(), "option:gapList:g1");
  await press("Enter"); eq("一覧で Enter で選ぶ", await js(`document.querySelector(".card[aria-expanded=true]")?.dataset.nodeId`), "n8h");
  await press("Tab", true); eq("Shift+Tab で図へ", await active(), "card:n8h");
  await press("Tab"); eq("選んだカードから Tab で窓の中へ", await active(), "tip:x");
  await press("Tab"); eq("窓を抜けると一覧へ", (await active()).startsWith("option:gapList"), true);
  await js(`document.querySelector("[data-node-id=n8h]").focus(); true`);
  await press("Tab"); await press("Escape");
  eq("窓で Esc：閉じてカードへ戻る", [await active(), await js(`document.getElementById("tip").hidden`)], ["card:n8h", true]);
  // 図の中：矢印キーで隣のカード、Enter で選ぶ、Esc で外す
  await js(`document.getElementById("tab-a").focus(); true`); await press("Home");
  await js(`document.querySelector("[data-node-id=n1]").focus(); true`);
  await press("ArrowRight"); eq("図で → は同じ行の隣", await active(), "card:n2");
  await press("ArrowDown"); eq("図で ↓ は近い行", (await active()).startsWith("card:"), true);
  await press("Enter"); const picked = await active();
  eq("Enter で選ぶ（フォーカスはカードに残る）", [await js(`document.querySelector(".card[aria-expanded=true]")?.dataset.nodeId`), await js(`!document.getElementById("tip").hidden`)], [picked.slice(5), true]);
  eq("窓の題はカードの短い名前", await js(`document.getElementById(document.getElementById("tip").getAttribute("aria-labelledby")).textContent`), await js(`(() => { const n = ${JSON.stringify(JSON.parse(soramameText).nodes)}.find((x) => x.id === "${picked.slice(5)}"); return n.short || n.title; })()`));
  await press("Escape"); eq("Esc で選びを外す", [await js(`document.querySelectorAll(".card[aria-expanded=true]").length`), await active()], [0, picked]);
  // c：段階をキーボードで
  await js(`document.getElementById("tab-c").focus(); true`); await press("End");
  await js(`document.querySelector("#phaseList [role=option]").focus(); true`);
  await press("ArrowDown"); await press("Enter");
  eq("c の段階をキーボードで切り替え", [await js(`location.hash`), await active()], ["#c&p=step1", "option:phaseList:step1"]);
  check("切り替えで見出しを読み上げる（live region）", (await js(`document.getElementById("live").textContent`)).startsWith("段階1"));

  // ==== hash で開き直すと同じ状態 ====
  await open(PAGES.sora + "#c&p=step1&sel=n8"); await js(HELP);
  eq("hash で戻る", [await js(`document.body.dataset.view`), await js(`document.querySelector("#phaseList [aria-selected=true]").dataset.key`), await js(`document.querySelector(".card[aria-expanded=true]").dataset.nodeId`), await js(`!document.getElementById("tip").hidden`)], ["c", "step1", "n8", true]);

  // ==== 1280×800：一覧をたためる（見せ方 V1） ====
  await viewport(1280, 800); await open(PAGES.sora + "#b"); await js(HELP);
  const before = await js(`Math.min(...__cards().map((g) => __fs(g.querySelector("text:nth-of-type(2)"))))`);
  check("1280 で一覧をたたむボタンが出る", await js(`__vis(document.getElementById("fold"))`));
  await js(`document.getElementById("fold").click(); true`);
  const after = await js(`Math.min(...__cards().map((g) => __fs(g.querySelector("text:nth-of-type(2)"))))`);
  check("1280 で一覧を出したままでも、カードの名前が 14px 以上（見せ方 V1）", before >= 14, before.toFixed(2) + "px");
  check("たたんでもカードの名前が 14px 以上", after >= 14, after.toFixed(1));
  await js(`document.getElementById("fold").click(); true`);
  for (const h of ["b", "c&p=asis", "c&p=step1", "c&p=step2", "c"]) {
    await go(h);
    const m = await js(`Math.min(...__cards().map((g) => __fs(g.querySelector("text:nth-of-type(2)"))))`);
    check(`カードの名前が 14px 以上（1280×800 #${h}）`, m >= 14, m.toFixed(2) + "px");
    eq(`カードの字が枠に収まる（1280×800 #${h}）`, await js(spill), []);
    eq(`スキル名を切らない（1280×800 #${h}）`, await js(`__cards().map((g) => [...g.querySelectorAll("text")].find((t) => t.getAttribute("font-family") && t.getAttribute("font-family").includes("Mono"))).filter((t) => t && __vis(t) && t.textContent.includes("…")).map((t) => t.closest(".card").dataset.nodeId)`), []);
  }
  // カードの中の文字（名前・下の 1 行・札）と、下の端の注記の札が重ならない。接するのも窮屈なので 2px の隙間を求める（1280×800 の b・c。b は一覧を出したまま）
  const tagHit = `__cards().flatMap((g) => { const tag = [...g.children].find((c) => c.tagName === "g" && c.querySelector("rect[stroke='#cfc7ba']")); if (!tag || !__vis(tag)) return []; const b0 = tag.querySelector("rect").getBoundingClientRect(), b = { left: b0.left - 2, right: b0.right + 2, top: b0.top - 2, bottom: b0.bottom + 2 }; return [...g.querySelectorAll("text")].filter((t) => __vis(t) && t.textContent && !tag.contains(t)).filter((t) => { const r = t.getBoundingClientRect(); return Math.min(r.right, b.right) > Math.max(r.left, b.left) + 0.5 && Math.min(r.bottom, b.bottom) > Math.max(r.top, b.top) + 0.5; }).map((t) => g.dataset.nodeId + ":" + t.textContent); })`;
  for (const h of ["b", "b&sel=n8h", "c&p=asis", "c&p=step1", "c&p=step2", "c"]) { await go(h); check(`一覧を出したまま（1280×800 #${h}）`, !(await js(`document.body.hasAttribute("data-fold")`))); eq(`カードの中の文字と札が重ならない（2px の隙間、1280×800 #${h}）`, await js(tagHit), []); }
  check("1280×800 の b：省いても理由は一覧とカードの名前（読み上げ）に残る", (await js(`(async () => { location.hash = "b"; await new Promise((ok) => setTimeout(ok, 50)); return document.querySelector("[data-node-id=n8h]").getAttribute("aria-label"); })()`)).includes("足りない：レビューの観点が書かれていない"));
  await viewport(1440, 900);
  for (const h of ["a", "b"]) { await go(h); eq(`カードの中の文字と札が重ならない（2px の隙間、1440×900 #${h}）`, await js(tagHit), []); }
  await viewport(1280, 800);
  await go("c&p=step1");
  check("1280×800 の c：選んだ段階の足りないものが、一覧をスクロールせずに見える", await js(`(() => { const l = [...document.querySelectorAll("#phaseList [aria-selected=true] li")]; return l.length > 0 && l[l.length - 1].getBoundingClientRect().bottom <= innerHeight; })()`));
  await viewport(1440, 900); await open(PAGES.sora + "#b"); await js(HELP);
  check("1440 ではたたむボタンを出さない", !(await js(`__vis(document.getElementById("fold"))`)));

  // ==== きっかけと今の段階（持ち主のフィードバック、2026-11-16）：tests/canvas/triggers.json ====
  // 長い役割名・隣の列の人のきっかけ・同じノードへの 2 本（まとめるものと積むもの）・段階 2 つ（今が current）・目指す形で足すノード
  const trigBoxes = `(() => {
    const r = (e) => { const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom }; };
    return [...document.querySelectorAll("[data-trigger-to]")].map((g) => ({ to: g.dataset.triggerTo,
      texts: [...g.querySelectorAll("text")].map((t) => Object.assign(r(t), { s: t.childNodes[0].textContent, full: t.querySelector("title").textContent })),
      paths: [...g.querySelectorAll("path, circle")].map(r), arrows: g.querySelectorAll("path").length }));
  })()`;
  const hit = (a, b) => Math.min(a.r, b.r) > Math.max(a.l, b.l) + 0.5 && Math.min(a.b, b.b) > Math.max(a.t, b.t) + 0.5;
  for (const [w, h] of [[1440, 900], [1280, 800]]) {
    await viewport(w, h); await open(PAGES.trig + "#a"); await js(HELP);
    const sz = `（${w}×${h}）`, T = await js(trigBoxes), byTo = new Map(T.map((g) => [g.to, g]));
    // (a) 隣の列のきっかけの文字は、ほかのきっかけの文字・矢印に重ならない。段の名前と罫にも重ならない
    const bg = await js(`[...document.querySelectorAll("[data-layer=bg] text, [data-layer=bg] line")].filter((e) => __vis(e) && e.getBoundingClientRect().top < document.querySelector("[data-trigger-to]").getBoundingClientRect().bottom).map((e) => { const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, s: e.textContent || "罫" }; })`);
    const clash = [];
    T.forEach((g) => g.texts.forEach((t) => {
      T.filter((o) => o !== g).forEach((o) => [...o.texts, ...o.paths].forEach((x) => { if (hit(t, x)) clash.push(g.to + ":" + t.s + " × " + o.to + ":" + (x.s || "矢印")); }));
      g.texts.filter((u) => u !== t).forEach((u) => { if (hit(t, u)) clash.push(g.to + ":" + t.s + " × " + u.s); });
      bg.forEach((x) => { if (hit(t, x)) clash.push(g.to + ":" + t.s + " × " + x.s); });
    }));
    eq("きっかけの文字が、隣の列のきっかけ・同じノードのきっかけ・段の名前と罫に重ならない" + sz, clash, []);
    // 切った文字には … を付け、全文はツールチップに出す。役割の名前は外さない
    eq("きっかけの全文はツールチップに" + sz, T.flatMap((g) => g.texts.map((t) => t.full)), ["プロダクトマネージャーが渡す：市場の変化と競合の動き", "定期：四半期ごとの見直し", "プロダクトマネージャーが渡す：顧客からの要望の見直し", "プロダクトマネージャー・アプリケーション開発が渡す：改善の依頼"]);
    check("切ったきっかけの文字は … で終わり、全文の頭と同じ" + sz, T.every((g) => g.texts.every((t) => t.s === t.full || (t.s.endsWith("…") && t.full.startsWith(t.s.slice(0, -1))))), JSON.stringify(T.map((g) => g.texts.map((t) => t.s))));
    check("きっかけの文字は役割の名前から始まる" + sz, ["p1", "p2", "p3"].every((id) => byTo.get(id).texts[0].s.startsWith("プロダクトマネージャー")));
    // (b) 同じノードの 2 本：by と label が同じなら 1 行にまとめ、違えば積む。矢印は 1 本（線と矢じりの 2 つの path）
    eq("同じノードへの 2 本：違うものは 2 行に積む" + sz, byTo.get("p1").texts.length, 2);
    eq("同じノードへの 2 本：同じものは 1 行にまとめる" + sz, byTo.get("p3").texts.length, 1);
    eq("同じノードへのきっかけの矢印は 1 本" + sz, T.map((g) => g.arrows), [2, 2, 2]);
    check("積んだ 2 行はどちらも画面の中で読める" + sz, byTo.get("p1").texts.every((t) => t.r - t.l > 20 && t.t >= 0 && t.b <= h));
  }
  await viewport(1440, 900);
  // (c) a は今の段階を描き、目指す形で足すノードを出さない。c で目指す形を選ぶと出る
  await open(PAGES.trig + "#a"); await js(HELP);
  check("a の見出しの頭は今の段階の名前", (await headline()).startsWith("今："), await headline());
  eq("a に目指す形で足すノードを出さない", await js(`__cards().map((g) => g.dataset.nodeId)`), ["p1", "p2", "p3", "a4", "a5", "g6", "m7"]);
  await go("c&p=tobe");
  check("c の目指す形には、足すノードが出る", await js(`["v6", "e8"].every((id) => __vis(document.querySelector("[data-node-id=" + id + "]")))`));
  await go("a");
  check("c で段階を選んだあとも、a は今の段階", (await headline()).startsWith("今：") && !(await js(`__vis(document.querySelector("[data-node-id=e8]"))`)));
  // current が最初の段階でないとき、a は current の段階を描く（最初の段階ではない）
  await open(PAGES.soraCur + "#a"); await js(HELP);
  check("current が段階1 なら、a は段階1 を描く", (await headline()).startsWith(soraCur.phases[1].name + "："), await headline());

  // ==== version 1・欠けた仕様書・埋め込みなし ====
  await open(PAGES.v1); await js(HELP);
  eq("version 1：見出し", await headline(), "原則から評価まで 5 段。人がやるのは入力の 1 段とレビューと評価。");
  await go("b");
  check("version 1：b の一覧", (await js(`document.getElementById("panel").textContent`)).includes("分けるスキルが無い"));
  await go("c");
  check("version 1：段階が無い c", (await headline()) === "移行の段階は書かれていない。");
  await open(PAGES.broken + "#b"); await js(HELP);
  const bt = await js(`document.getElementById("panel").textContent`);
  check("欠けた仕様書：既定の段で描く", (await js(`document.querySelectorAll("[data-stage-id]").length`)) >= 8);
  check("欠けた仕様書：書き漏れに出す", ["端のノードが無い", "version が無い", "注記の JSON を読めませんでした", "が human・schedule・event のどれでもない", "セッションが不明", "役割"].every((t) => bt.includes(t)), bt);
  await open(PAGES.bare);
  check("埋め込みなし：案内を出す", (await js(`document.body.innerText`)).includes("設計の JSON が埋め込まれていません"));

  // ==== 画面を撮る ====
  if (SHOTS) {
    await viewport(1440, 900); await open(PAGES.soraPlain); await shot("readme-a"); // README の画像（注記なし）
    for (const [w, h] of [[1440, 900], [1280, 800]]) {
      await viewport(w, h); await open(PAGES.sora); const sz = w + "x" + h;
      for (const [name, hash] of [["a", "a"], ["a-sel-n9", "a&sel=n9"], ["a-sel-n7", "a&sel=n7"], ["b", "b"], ["b-sel-n8h", "b&sel=n8h&g=g0"], ["b-sel-n9", "b&sel=n9"],
        ["c-asis", "c&p=asis"], ["c-step1", "c&p=step1"], ["c-step1-sel-n8", "c&p=step1&sel=n8"], ["c-step2", "c&p=step2"], ["c-tobe", "c"], ["table", "a&table"]]) {
        await go(hash); await shot(sz + "-" + name);
      }
      if (w === 1280) { await go("b"); await js(`document.getElementById("fold").click(); true`); await shot(sz + "-b-folded"); }
    }
  }
  eq("コンソールにエラーが無い", errors, []);
} catch (e) {
  fails.push("試験が途中で止まった：" + e.message);
} finally {
  ws.close(); stop();
}
console.log(`通った ${pass}、落ちた ${fails.length}`);
fails.forEach((f) => console.log("  ✗ " + f));
clearTimeout(LIMIT);
process.exit(fails.length ? 1 : 0);
