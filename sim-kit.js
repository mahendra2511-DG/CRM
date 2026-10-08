/* ============================================================
   Job Simulator kit (Incident Room · Broken Dashboard · Stakeholder Simulator)
   + cloud progress hook (window.HUB_PROGRESS, used by visit-kit.js)
   Content: window.SIM_CONTENT (sim-content.js) · Config: window.SIM_CFG
   Works in both the hub framework and the older 10-tab framework.
   ============================================================ */
(function () {
  const C = window.SIM_CONTENT, CFG = window.SIM_CFG || {};
  if (!C) return;
  const KEY = CFG.key || "hub";
  const SIM_KEY = KEY + "_sim_v1";
  const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const rich = (s) => esc(s).replace(/&lt;(\/?)b&gt;/g, "<$1b>");     // allow <b> only
  const lsG = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsS = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const go = (v) => { if (typeof window.switchView === "function") window.switchView(v); };
  const INC = C.incidents || [], BRK = C.broken || { tiles: [] }, STK = C.stakeholders || [];

  function simState() { try { const s = JSON.parse(lsG(SIM_KEY)); if (s && typeof s === "object") return Object.assign({ inc: {}, brk: {}, stk: {} }, s); } catch (e) {} return { inc: {}, brk: {}, stk: {} }; }
  function simSave(s) { lsS(SIM_KEY, JSON.stringify(s)); try { window.dispatchEvent(new Event("hub-progress")); } catch (e) {} }
  const best = (o) => o && o.best != null ? o.best : null;
  function record(group, id, sc) { const s = simState(); const prev = (id ? s[group][id] : s[group]) || {}; const v = { best: Math.max(prev.best || 0, sc), last: sc, tries: (prev.tries || 0) + 1, ts: Date.now() }; if (id) s[group][id] = v; else s[group] = v; simSave(s); }

  /* ---------------- Incident Room ---------------- */
  let incCur = null, incOpened = new Set();
  function renderIncident() {
    const root = document.getElementById("inc-root"); if (!root) return;
    const st = simState();
    if (!incCur) {
      root.innerHTML = `<div class="js-grid">${INC.map((x, i) => { const b = best(st.inc[x.id]); return `<button class="card js-case" data-inc="${x.id}">
        <div class="js-case-top"><span class="lvl lvl-${x.lvl.toLowerCase()}">${esc(x.lvl)}</span><span class="js-case-n">Incident ${i + 1}</span>${b != null ? `<span class="js-best ${b >= 70 ? "ok" : ""}">Best ${b}%</span>` : ""}</div>
        <h4>🚨 ${esc(x.title)}</h4><p>${esc(x.from)}</p><span class="js-open">${b != null ? "Retry" : "Investigate"} →</span></button>`; }).join("")}</div>`;
      root.querySelectorAll("[data-inc]").forEach(b => b.addEventListener("click", () => { incCur = INC.find(x => x.id === b.dataset.inc); incOpened = new Set(); renderIncident(); window.scrollTo({ top: 0 }); }));
      return;
    }
    const x = incCur;
    root.innerHTML = `<button class="btn-outline js-back" id="inc-back">← All incidents</button>
      <div class="card js-alert"><div class="js-alert-h"><span>🚨 DATA INCIDENT</span><small>${esc(x.time)}</small></div>
        <div class="js-msg"><b>${esc(x.from)}</b><p>${esc(x.msg)}</p></div>
        <div class="js-metrics">${(x.metric || []).map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join("")}</div></div>
      <h4 class="js-step">Step 1 · Collect evidence <small>(open what you need, not everything)</small></h4>
      <div class="js-ev">${x.evidence.map(e => `<div class="card js-evc ${incOpened.has(e.id) ? "open" : ""}" data-ev="${e.id}"><button class="js-evb">${incOpened.has(e.id) ? "▾" : "▸"} ${esc(e.t)}</button>
        ${incOpened.has(e.id) ? `<pre>${esc(e.sql)}</pre><table class="js-res">${(e.res || []).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</table><p class="js-note">${esc(e.note)}</p>` : ""}</div>`).join("")}</div>
      <h4 class="js-step">Step 2 · What is the root cause?</h4>
      <div class="js-opts">${x.causes.map(([id, t]) => `<label class="js-opt"><input type="radio" name="inc-c" value="${id}"> ${esc(t)}</label>`).join("")}</div>
      <h4 class="js-step">Step 3 · How do you fix it and stop it happening again?</h4>
      <div class="js-opts">${x.fixes.map(([id, t]) => `<label class="js-opt"><input type="radio" name="inc-f" value="${id}"> ${esc(t)}</label>`).join("")}</div>
      <h4 class="js-step">Step 4 · Your one-line reply to ${esc(String(x.from).split(" · ")[0])} <small>(not scored; compare with the model answer)</small></h4>
      <textarea class="js-reply" id="inc-reply" placeholder="Write it the way you would in Slack or email…"></textarea>
      <div class="js-actions"><button class="btn-blue" id="inc-submit">Submit investigation</button></div>
      <div id="inc-result"></div>`;
    root.querySelector("#inc-back").addEventListener("click", () => { incCur = null; renderIncident(); });
    root.querySelectorAll("[data-ev] .js-evb").forEach(b => b.addEventListener("click", () => {
      const id = b.parentNode.dataset.ev; if (incOpened.has(id)) incOpened.delete(id); else incOpened.add(id);
      const c = root.querySelector('input[name="inc-c"]:checked'), f = root.querySelector('input[name="inc-f"]:checked'), r = root.querySelector("#inc-reply").value;
      renderIncident();
      if (c) root.querySelector(`input[name="inc-c"][value="${c.value}"]`).checked = true; if (f) root.querySelector(`input[name="inc-f"][value="${f.value}"]`).checked = true; root.querySelector("#inc-reply").value = r;
    }));
    root.querySelector("#inc-submit").addEventListener("click", () => {
      const c = root.querySelector('input[name="inc-c"]:checked'), f = root.querySelector('input[name="inc-f"]:checked');
      if (!c || !f) { root.querySelector("#inc-result").innerHTML = `<div class="ed-msg bad">Pick a root cause and a fix first.</div>`; return; }
      const relOpen = x.evidence.filter(e => e.rel && incOpened.has(e.id)).length, decoys = x.evidence.filter(e => !e.rel && incOpened.has(e.id)).length;
      const cOk = (x.causes.find(o => o[0] === c.value) || [])[2] === true, fOk = (x.fixes.find(o => o[0] === f.value) || [])[2] === true;
      const ev = Math.max(0, Math.min(20, relOpen * 8) - decoys * 2), sc = Math.round(ev + (cOk ? 50 : 0) + (fOk ? 30 : 0));
      record("inc", x.id, sc);
      const fixRight = (x.fixes.find(o => o[2] === true) || [])[1] || "";
      root.querySelector("#inc-result").innerHTML = `<div class="card js-score"><div class="js-score-h"><span>Investigation score</span><b>${sc}%</b></div>
        <div class="js-bars">${[["Evidence", ev, 20], ["Root cause", cOk ? 50 : 0, 50], ["Fix & prevention", fOk ? 30 : 0, 30]].map(([k, v, m]) => `<div class="js-bar"><span>${k}</span><i><em style="width:${v / m * 100}%"></em></i><b>${Math.round(v)}/${m}</b></div>`).join("")}</div>
        <p>${cOk ? "✅" : "❌"} ${rich(x.answer)}</p><p>${fOk ? "✅" : "❌"} <b>Fix:</b> ${esc(fixRight)}</p>
        <p class="js-note">${relOpen < 2 ? "Tip: an analyst confirms the cause with evidence before answering. Open the relevant evidence next time." : decoys ? `You opened ${decoys} evidence card(s) that didn't help. That's fine, but drop a lead quickly when it doesn't explain the number.` : "Good evidence trail: you went straight to what explains the number."}</p>
        <div class="js-tell"><b>Model reply to the stakeholder</b><p>${rich(x.tell)}</p></div></div>`;
      renderSummary();
    });
  }

  /* ---------------- Broken Dashboard ---------------- */
  let brkFlags = new Set(), brkDone = false;
  function renderBroken() {
    const root = document.getElementById("brk-root"); if (!root) return;
    const b0 = best(simState().brk); const ch = BRK.chart;
    const tiles = BRK.tiles.map(t => { const f = brkFlags.has(t.id); const cls = brkDone ? (t.bad ? (f ? "hit" : "miss") : (f ? "false" : "okay")) : (f ? "flag" : ""); return `<button class="js-tile ${cls}" data-t="${t.id}"><span>${esc(t.label)}</span><b>${esc(t.val)}</b>${brkDone ? `<small>${t.bad ? (f ? "✅ You caught it" : "❌ Missed") : (f ? "⚠ This one was correct" : "✓ Correct")}</small>` : f ? "<small>🚩 Flagged</small>" : ""}</button>`; }).join("");
    const cf = brkFlags.has("chart"); const ccls = ch ? (brkDone ? (ch.bad ? (cf ? "hit" : "miss") : (cf ? "false" : "okay")) : (cf ? "flag" : "")) : "";
    root.innerHTML = `<div class="card js-brief"><b>📩 From the ${esc(BRK.from || "Director")}:</b> ${esc(BRK.brief || "")}${b0 != null ? `<span class="js-best ${b0 >= 70 ? "ok" : ""}">Your best: ${b0}%</span>` : ""}</div>
      <div class="card js-dash"><div class="js-dash-h"><span>${esc(BRK.title || "")}</span><small>click a tile or the chart to flag it</small></div>
        <div class="js-tiles">${tiles}</div>
        ${ch ? `<button class="js-chart ${ccls}" data-t="chart"><div class="js-chart-h">${esc(ch.title)} ${brkDone ? `<small>${ch.bad ? (cf ? "✅ You caught it" : "❌ Missed") : (cf ? "⚠ This one was correct" : "✓ Correct")}</small>` : cf ? "<small>🚩 Flagged</small>" : ""}</div>
          ${(ch.bars || []).map(([l, v, w]) => `<div class="js-cbar"><span>${esc(l)}</span><i><em style="width:${Math.max(0, Math.min(100, +w || 0))}%"></em></i><b>${esc(v)}</b></div>`).join("")}</button>` : ""}</div>
      <div class="js-actions">${brkDone ? `<button class="btn-outline" id="brk-reset">↺ Try again</button>` : `<button class="btn-blue" id="brk-submit">Submit review (${brkFlags.size} flagged)</button><button class="btn-outline" id="brk-clear">Clear flags</button>`}</div>
      <div id="brk-result"></div>`;
    root.querySelectorAll("[data-t]").forEach(b => b.addEventListener("click", () => { if (brkDone) return; const id = b.dataset.t; if (brkFlags.has(id)) brkFlags.delete(id); else brkFlags.add(id); renderBroken(); }));
    const sub = root.querySelector("#brk-submit"); if (sub) sub.addEventListener("click", () => {
      const all = BRK.tiles.map(t => Object.assign({}, t)).concat(ch ? [{ id: "chart", label: ch.title, bad: !!ch.bad, why: ch.why }] : []);
      const bad = all.filter(t => t.bad); const hits = bad.filter(t => brkFlags.has(t.id)).length, falses = all.filter(t => !t.bad && brkFlags.has(t.id)).length;
      const sc = Math.max(0, Math.round((hits - falses) / Math.max(1, bad.length) * 100));
      record("brk", null, sc); brkDone = true; renderBroken();
      document.getElementById("brk-result").innerHTML = `<div class="card js-score"><div class="js-score-h"><span>Dashboard QA score</span><b>${sc}%</b></div>
        <p>You caught <b>${hits} of ${bad.length}</b> errors${falses ? ` and flagged <b>${falses}</b> correct number(s) by mistake (−1 each)` : ""}.</p>
        <ul class="js-why">${all.map(t => `<li class="${t.bad ? "bad" : "good"}"><b>${esc(t.label)}</b> ${t.bad ? "✗" : "✓"} ${rich(t.why)}</li>`).join("")}</ul></div>`;
      renderSummary();
    });
    const cl = root.querySelector("#brk-clear"); if (cl) cl.addEventListener("click", () => { brkFlags.clear(); renderBroken(); });
    const rs = root.querySelector("#brk-reset"); if (rs) rs.addEventListener("click", () => { brkFlags.clear(); brkDone = false; renderBroken(); });
  }

  /* ---------------- Stakeholder Simulator ---------------- */
  const CATS = [["obj", "Business objective"], ["metric", "Metric definition"], ["time", "Time period"], ["scope", "Audience & granularity"], ["rules", "Filters & business rules"]];
  const MAXQ = 6; let stkCur = null, stkSel = new Set(), stkDone = false;
  function renderStake() {
    const root = document.getElementById("stk-root"); if (!root) return;
    const st = simState();
    if (!stkCur) {
      root.innerHTML = `<div class="js-grid">${STK.map((x, i) => { const b = best(st.stk[x.id]); return `<button class="card js-case" data-stk="${x.id}">
        <div class="js-case-top"><span class="js-case-n">Request ${i + 1}</span>${b != null ? `<span class="js-best ${b >= 70 ? "ok" : ""}">Best ${b}%</span>` : ""}</div>
        <h4>💬 “${esc(x.ask)}”</h4><p>${esc(x.who)}</p><span class="js-open">${b != null ? "Retry" : "Clarify the request"} →</span></button>`; }).join("")}</div>`;
      root.querySelectorAll("[data-stk]").forEach(b => b.addEventListener("click", () => { stkCur = STK.find(x => x.id === b.dataset.stk); stkSel = new Set(); stkDone = false; renderStake(); window.scrollTo({ top: 0 }); }));
      return;
    }
    const x = stkCur; const n = x.qs.length; const order = x.qs.map((q, i) => i).sort((a, b) => ((a * 7 + 3) % n) - ((b * 7 + 3) % n));
    root.innerHTML = `<button class="btn-outline js-back" id="stk-back">← All requests</button>
      <div class="card js-alert stk"><div class="js-alert-h"><span>💬 NEW REQUEST</span><small>${esc(x.who)}</small></div><div class="js-msg"><p class="js-big">“${esc(x.ask)}”</p></div></div>
      <h4 class="js-step">Before you build anything, pick up to ${MAXQ} clarifying questions <small>(${stkSel.size}/${MAXQ} chosen)</small></h4>
      <div class="js-opts">${order.map(i => { const q = x.qs[i]; const on = stkSel.has(i); const cls = stkDone ? (q[1] === "bad" ? (on ? "false" : "") : (on ? "hit" : "")) : ""; return `<label class="js-opt ${cls}"><input type="checkbox" data-q="${i}" ${on ? "checked" : ""} ${stkDone ? "disabled" : ""}> ${esc(q[0])}${stkDone && on ? `<span class="js-reply-a">↳ ${esc(q[3])}</span>` : ""}</label>`; }).join("")}</div>
      <div class="js-actions">${stkDone ? `<button class="btn-outline" id="stk-retry">↺ Try again</button>` : `<button class="btn-blue" id="stk-submit">Send questions</button>`}</div><div id="stk-result"></div>`;
    root.querySelector("#stk-back").addEventListener("click", () => { stkCur = null; renderStake(); });
    root.querySelectorAll("[data-q]").forEach(c => c.addEventListener("change", () => { const i = +c.dataset.q; if (c.checked) { if (stkSel.size >= MAXQ) { c.checked = false; return; } stkSel.add(i); } else stkSel.delete(i); renderStake(); }));
    const rt = root.querySelector("#stk-retry"); if (rt) rt.addEventListener("click", () => { stkSel = new Set(); stkDone = false; renderStake(); });
    const sb = root.querySelector("#stk-submit"); if (sb) sb.addEventListener("click", () => {
      if (stkSel.size < 3) { root.querySelector("#stk-result").innerHTML = `<div class="ed-msg bad">Ask at least 3 questions.</div>`; return; }
      stkDone = true; const sel = [...stkSel].map(i => x.qs[i]);
      const covered = CATS.map(([c]) => sel.some(q => q[1] === c)); const bad = sel.filter(q => q[1] === "bad");
      const raw = sel.reduce((a, q) => a + (+q[2] || 0), 0); const bestPossible = x.qs.filter(q => q[2] > 0).map(q => +q[2]).sort((a, b) => b - a).slice(0, MAXQ).reduce((a, b) => a + b, 0) || 1;
      const sc = Math.max(0, Math.min(100, Math.round(raw / bestPossible * 70 + covered.filter(Boolean).length / CATS.length * 30)));
      record("stk", x.id, sc); renderStake();
      const good = sel.filter(q => q[1] !== "bad");
      document.getElementById("stk-result").innerHTML = `<div class="card js-score"><div class="js-score-h"><span>Requirement quality</span><b>${sc}%</b></div>
        <div class="js-cov">${CATS.map(([c, nm], i) => `<span class="${covered[i] ? "ok" : "no"}">${covered[i] ? "✓" : "✗"} ${nm}</span>`).join("")}</div>
        ${bad.length ? `<p>⚠ ${bad.length} question(s) didn't help scope the work: ${bad.map(q => `“${esc(q[0])}”`).join(", ")}.</p>` : `<p>✅ Every question you asked helped scope the work.</p>`}
        ${covered.some(v => !v) ? `<p>Missing: ${CATS.filter((c, i) => !covered[i]).map(c => c[1]).join(", ")}. Without these you'd have to guess.</p>` : ""}
        <div class="js-tell"><b>📄 Your requirement brief (from the answers)</b><ul>${good.map(q => `<li><b>${esc((CATS.find(c => c[0] === q[1]) || ["", "Note"])[1])}:</b> ${esc(q[3])}</li>`).join("")}</ul></div></div>`;
      renderSummary();
    });
  }

  /* ---------------- Summary strip ---------------- */
  function scores() {
    const s = simState(); const avg = (o, ids) => { const v = ids.map(i => o[i] && o[i].best).filter(x => x != null); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null; };
    return { inc: avg(s.inc, INC.map(i => i.id)), incN: INC.filter(i => s.inc[i.id]).length, brk: best(s.brk), stk: avg(s.stk, STK.map(i => i.id)), stkN: STK.filter(i => s.stk[i.id]).length };
  }
  function renderSummary() {
    const sc = scores();
    document.querySelectorAll(".js-summary").forEach(el => {
      el.innerHTML = [["🚨 Incident Room", sc.inc, `${sc.incN}/${INC.length} solved`, "incident"], ["🧩 Broken Dashboard", sc.brk, sc.brk != null ? "best score" : "not tried", "broken"], ["💬 Stakeholder", sc.stk, `${sc.stkN}/${STK.length} done`, "stakeholder"]]
        .map(([t, v, sub, view]) => `<button class="js-sum" data-sim="${view}"><span>${t}</span><b>${v != null ? v + "%" : "—"}</b><small>${sub}</small></button>`).join("");
      el.querySelectorAll("[data-sim]").forEach(b => b.addEventListener("click", () => go(b.dataset.sim)));
    });
  }

  /* ---------------- Cloud progress hook ---------------- */
  const readJ = (k) => { try { return JSON.parse(lsG(k)); } catch (e) { return null; } };
  function pct() {
    try { if (typeof trackScores === "function") return trackScores().overall; } catch (e) {}
    const cap = document.getElementById("sidebar-progress-caption"); const m = cap && cap.textContent.match(/(\d+)\s*%/); return m ? +m[1] : 0;
  }
  function sqlSolved() { if (!CFG.editorKey) return null; const e = readJ(CFG.editorKey); return e && e.solved ? Object.keys(e.solved).length : 0; }
  function union(a, b) {
    let ch = false;
    for (const k in (b || {})) {
      const bv = b[k];
      if (!(k in a)) { a[k] = bv; ch = true; }
      else if (a[k] && bv && typeof a[k] === "object" && typeof bv === "object" && !Array.isArray(a[k])) { if (union(a[k], bv)) ch = true; }
      else if (Array.isArray(a[k]) && Array.isArray(bv)) { bv.forEach(x => { if (!a[k].includes(x)) { a[k].push(x); ch = true; } }); }
      else if (!a[k] && bv) { a[k] = bv; ch = true; }
    }
    return ch;
  }
  window.HUB_PROGRESS = {
    collect() {
      const ls = {}; (CFG.syncKeys || []).forEach(k => { const v = readJ(k); if (v != null) ls[k] = v; });
      const sc = scores(); const sq = sqlSolved();
      return { data: { ls, sim: simState() }, summary: { pct: pct(), sql: sq, inc: sc.inc, brk: sc.brk, stk: sc.stk } };
    },
    apply(r) {
      if (!r) return false; let ch = false;
      Object.entries(r.ls || {}).forEach(([k, v]) => { if ((CFG.syncKeys || []).indexOf(k) < 0 || !v || typeof v !== "object") return; const cur = readJ(k) || (Array.isArray(v) ? [] : {}); if (union(cur, v)) { lsS(k, JSON.stringify(cur)); ch = true; } });
      const sim = simState(); let sch = false;
      ["inc", "stk"].forEach(g => Object.entries((r.sim || {})[g] || {}).forEach(([k, v]) => { if (!sim[g][k] || (v.best || 0) > (sim[g][k].best || 0)) { sim[g][k] = v; sch = true; } }));
      if (r.sim && r.sim.brk && (r.sim.brk.best || 0) > ((sim.brk && sim.brk.best) || 0)) { sim.brk = r.sim.brk; sch = true; }
      if (sch) { lsS(SIM_KEY, JSON.stringify(sim)); ch = true; }
      return ch;
    },
    reportHead() { return ["Progress"].concat(CFG.sqlTotal ? ["SQL solved"] : [], ["Incidents", "Broken DB", "Stakeholder"]); },
    reportCells(p) { const f = (v) => v == null ? "—" : v + "%"; return [f(p.pct)].concat(CFG.sqlTotal ? [`${p.sql || 0}/${CFG.sqlTotal}`] : [], [f(p.inc), f(p.brk), f(p.stk)]); },
    welcome(profile) { welcomeProfile = profile; try { window.renderContinueBanner(); } catch (e) { welcomeBanner(); } },
  };

  /* ---------------- Welcome back banner (reuses the site's continue banner) ---------------- */
  let welcomeProfile = null;
  const origContinue = typeof window.renderContinueBanner === "function" ? window.renderContinueBanner : null;
  function nextStep() {
    try { if (typeof JOURNEY !== "undefined" && typeof loadState === "function") { const s = loadState(); const j = JOURNEY.find(x => !(s.journey || {})[x.id]); return j ? { t: j.t, v: j.go } : null; } } catch (e) {}
    return null;
  }
  function welcomeBanner() {
    const wrap = document.getElementById("continue-banner"); if (!wrap) return;
    if (!welcomeProfile || !welcomeProfile.name) { if (origContinue) origContinue(); return; }
    let last = null; try { last = JSON.parse(lsG(typeof LAST_VIEW_KEY !== "undefined" ? LAST_VIEW_KEY : "")); } catch (e) {}
    const labels = (typeof VIEW_LABELS === "object" && VIEW_LABELS) || {};
    const nx = nextStep(); const first = String(welcomeProfile.name).split(" ")[0]; const p = pct();
    wrap.style.display = "flex";
    wrap.innerHTML = `<span class="continue-text">👋 Welcome back, <strong>${esc(first)}</strong>. You're <strong>${p}%</strong> through the project.${nx ? ` Next step: <strong>${esc(nx.t)}</strong>` : ""}</span>
      <div class="continue-actions">${nx ? `<button type="button" class="continue-go" data-v="${esc(nx.v)}">Continue project →</button>` : ""}${last && last.view && labels[last.view] ? `<button type="button" class="continue-go ${nx ? "alt" : ""}" data-v="${esc(last.view)}">${nx ? "Back to " : "Continue: "}${esc(labels[last.view])}</button>` : ""}${!nx && !(last && last.view && labels[last.view]) ? `<button type="button" class="continue-go" data-v="incident">Try the Job Simulator →</button>` : ""}<button type="button" class="continue-dismiss" title="Dismiss">✕</button></div>`;
    wrap.querySelectorAll(".continue-go").forEach(b => b.addEventListener("click", () => go(b.dataset.v)));
    wrap.querySelector(".continue-dismiss").addEventListener("click", () => { wrap.style.display = "none"; });
  }
  window.renderContinueBanner = welcomeBanner;

  try { if (typeof VIEW_LABELS === "object") Object.assign(VIEW_LABELS, { incident: "Incident Room", broken: "Broken Dashboard Challenge", stakeholder: "Stakeholder Simulator" }); } catch (e) {}
  function start() { renderIncident(); renderBroken(); renderStake(); renderSummary(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
