/* ============================================================
   Student check-in + real visitor counter + trainer visit report.
   Works only when the live API (/api/schedule + Upstash) is connected;
   otherwise it stays completely hidden (no fake numbers).
   Config: window.VISIT_KEY = "<site prefix>" (same prefix as the schedule keys).
   ============================================================ */
(function () {
  const KEY = String(window.VISIT_KEY || "hub");
  const API = "api/schedule";
  const ME_KEY = KEY + "_student_v1", UNLOCK = KEY + "_schedule_unlocked", PINK = KEY + "_schedule_pin";
  if (!/^https?:$/.test(location.protocol)) return;
  const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  const ss = (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } };
  const fmtN = (n) => Number(n || 0).toLocaleString("en-IN");
  const post = (b) => fetch(API, { method: "POST", body: JSON.stringify(b) }).then(r => r.json());

  function me() { try { const m = JSON.parse(ls.get(ME_KEY)); if (m && m.vid) return m; } catch (e) {} const m = { vid: "v_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36) }; ls.set(ME_KEY, JSON.stringify(m)); return m; }
  function saveMe(m) { ls.set(ME_KEY, JSON.stringify(m)); }

  /* ---------- styles ---------- */
  const css = `
  .vk-overlay{position:fixed;inset:0;background:rgba(10,15,30,.55);backdrop-filter:blur(3px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px}
  .vk-modal{background:var(--paper-raised,#fff);color:var(--ink,#111);border-radius:18px;max-width:420px;width:100%;padding:26px 24px;box-shadow:0 24px 60px rgba(0,0,0,.25);border:1px solid var(--line,#e6e6e2)}
  .vk-modal h3{margin:0 0 6px;font-size:22px} .vk-modal p{margin:0 0 16px;color:var(--ink-muted,#5f6368);font-size:13.5px;line-height:1.5}
  .vk-modal label{display:block;font-size:12.5px;font-weight:600;margin:10px 0 5px;color:var(--ink-muted,#5f6368)}
  .vk-modal input,.vk-modal select{width:100%;box-sizing:border-box;padding:11px 12px;border-radius:10px;border:1px solid var(--line,#ddd);background:var(--paper,#fafafa);color:var(--ink,#111);font-size:15px}
  .vk-modal button{margin-top:18px;width:100%;padding:12px;border:0;border-radius:10px;background:#1F9E8B;color:#fff;font-weight:700;font-size:15px;cursor:pointer}
  .vk-modal .vk-err{color:#DC2626;font-size:12.5px;min-height:16px;margin-top:6px}
  .vk-modal small{display:block;margin-top:12px;font-size:11.5px;color:var(--ink-muted,#888)}
  .vk-chip{margin:10px 20px 0;font-size:12.5px;color:var(--sidebar-text,#2b2f33);display:flex;gap:6px;align-items:center;flex-wrap:wrap}
  .vk-chip b{font-weight:700} .vk-chip button{border:0;background:none;color:#1F9E8B;cursor:pointer;font-size:12px;text-decoration:underline;padding:0}
  .vk-count{font-weight:600} .vk-count b{color:#137A6A}
  .vk-report{margin:8px 0 24px;padding:20px;border:2px dashed #93C5FD!important}
  .vk-head{display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap}
  .vk-head h3{margin:0;font-size:20px} .vk-head span{font-size:12.5px;color:var(--ink-muted,#666)}
  .vk-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:14px 0}
  .vk-tile{border:1px solid var(--line,#e6e6e2);border-radius:12px;padding:12px 14px;background:var(--paper,#fafafa)}
  .vk-tile b{display:block;font-size:24px;font-family:var(--mono,monospace);color:#137A6A} .vk-tile span{font-size:12px;color:var(--ink-muted,#666)}
  .vk-chart{display:flex;align-items:flex-end;gap:3px;height:120px;padding:8px 4px 0;border-bottom:1px solid var(--line,#ddd);margin:6px 0 4px}
  .vk-bar{flex:1;background:#BFE6DD;border-radius:4px 4px 0 0;position:relative;min-height:2px;cursor:default}
  .vk-bar.today{background:#1F9E8B} .vk-bar:hover{background:#137A6A}
  .vk-bar i{position:absolute;bottom:100%;left:50%;transform:translateX(-50%);font-style:normal;font-size:10px;color:var(--ink-muted,#666);white-space:nowrap}
  .vk-axis{display:flex;justify-content:space-between;font-size:11px;color:var(--ink-muted,#888);margin-bottom:14px}
  .vk-tools{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:10px 0}
  .vk-tools input,.vk-tools select{padding:8px 10px;border-radius:8px;border:1px solid var(--line,#ddd);background:var(--paper-raised,#fff);color:var(--ink,#111);font-size:13px}
  .vk-tools input[type=text]{flex:1;min-width:180px}
  .vk-tools button{padding:8px 12px;border-radius:8px;border:1px solid var(--line,#ddd);background:var(--paper-raised,#fff);color:var(--ink,#111);cursor:pointer;font-size:13px}
  .vk-table{width:100%;border-collapse:collapse;font-size:13px} .vk-table th{text-align:left;font-size:11.5px;text-transform:uppercase;letter-spacing:.04em;color:var(--ink-muted,#666);padding:8px;border-bottom:1px solid var(--line,#ddd);white-space:nowrap}
  .vk-table td{padding:8px;border-bottom:1px solid var(--line-soft,#eee);vertical-align:top} .vk-table td.n{font-family:var(--mono,monospace);text-align:right}
  .vk-yes{color:#15803D;font-weight:700} .vk-no{color:#9CA3AF} .vk-pages{font-size:11.5px;color:var(--ink-muted,#666)}
  .vk-wrap{overflow-x:auto}
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  /* ---------- project groups for the check-in form ---------- */
  function activeProject(sched) {
    const d = sched && sched.projects && sched.projects.length ? sched : window.PROJECT_SCHEDULE; if (!d || !d.projects) return null;
    return d.projects.find(p => p.code === d.active) || d.projects[0] || null;
  }

  /* ---------- check-in modal ---------- */
  function askName(project, cb, current) {
    const groups = (project && project.groups || []).map(g => g.name).filter(Boolean);
    const ov = document.createElement("div"); ov.className = "vk-overlay";
    ov.innerHTML = `<div class="vk-modal" role="dialog" aria-modal="true" aria-labelledby="vk-t">
      <h3 id="vk-t">👋 Welcome! Who's learning today?</h3>
      <p>Enter your name once. It is saved on this device, and your trainer uses it to see who is using the project site.</p>
      <label for="vk-name">Your full name</label><input id="vk-name" type="text" maxlength="48" autocomplete="name" placeholder="e.g. Ajay Sharma" value="${esc(current && current.name || "")}">
      <label for="vk-group">Your group</label>
      <select id="vk-group">${groups.map(g => `<option ${current && current.group === g ? "selected" : ""}>${esc(g)}</option>`).join("")}<option value="Not in a group yet" ${!groups.length || (current && current.group === "Not in a group yet") ? "selected" : ""}>Not in a group yet</option></select>
      <div class="vk-err" id="vk-err"></div>
      <button id="vk-go">Continue →</button>
      <small>Only your trainer can see the names. Nothing else about you is collected.</small></div>`;
    document.body.appendChild(ov);
    const inp = ov.querySelector("#vk-name"); setTimeout(() => inp.focus(), 50);
    const go = () => {
      const n = inp.value.replace(/\s+/g, " ").trim();
      const nn = n === n.toLowerCase() || n === n.toUpperCase() ? n.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase()) : n;
      if (n.length < 2 || !/[a-zA-Zऀ-ॿ]/.test(n)) { ov.querySelector("#vk-err").textContent = "Please enter your real name (at least 2 letters)."; return; }
      ov.remove(); cb(nn, ov.querySelector("#vk-group") ? ov.querySelector("#vk-group").value : "");
    };
    ov.querySelector("#vk-go").addEventListener("click", go);
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
  }

  /* ---------- greeting chip in the sidebar ---------- */
  function renderChip(m, project) {
    let c = document.getElementById("vk-chip");
    const host = document.querySelector(".sidebar-progress"); if (!host) return;
    if (!c) { c = document.createElement("div"); c.id = "vk-chip"; c.className = "vk-chip"; host.parentNode.insertBefore(c, host); }
    c.innerHTML = `👋 <b>${esc(m.name)}</b>${m.group && m.group !== "Not in a group yet" ? ` · ${esc(m.group)}` : ""} <button type="button">change</button>`;
    c.querySelector("button").onclick = () => askName(project, (n, g) => { m.name = n; m.group = g; saveMe(m); renderChip(m, project); ping(curView(), true); lastPush = ""; progressSync(); }, m);
  }

  /* ---------- visit pings ---------- */
  let lastPing = {}, profile = null;
  function curView() { const v = document.querySelector("section.view.active"); return v ? v.id.replace(/^view-/, "") : "home"; }
  function ping(page, force) {
    if (!profile) return; const now = Date.now(); page = page || "home";
    if (!force && lastPing[page] && now - lastPing[page] < 90000) return; lastPing[page] = now;
    post({ action: "visit", vid: profile.vid, name: profile.name || "", group: profile.group || "", batch: profile.batch || "", page }).catch(() => {});
  }
  function hookViews() {
    const orig = window.switchView;
    if (typeof orig === "function" && !orig._vk) { const w = function (v) { const r = orig.apply(this, arguments); setTimeout(() => ping(v), 50); return r; }; w._vk = true; window.switchView = w; }
    document.addEventListener("click", (e) => { const b = e.target.closest && e.target.closest("[data-view],[data-goto]"); if (b) setTimeout(() => ping(curView()), 120); });
  }

  /* ---------- cloud progress (site provides window.HUB_PROGRESS) ---------- */
  const normKey = (n, g) => (String(n || "").toLowerCase() + "|" + String(g || "").toLowerCase()).replace(/\s+/g, " ").trim();
  let pushTimer = null, lastPush = "";
  function progressSync() {
    const H = window.HUB_PROGRESS; if (!H || !profile || !profile.name) return;
    try { if (H.welcome) H.welcome(profile); } catch (e) {}
    const flag = KEY + "_restored_" + normKey(profile.name, profile.group);
    post({ action: "restore", name: profile.name, group: profile.group || "" }).then(j => {
      let changed = false; try { changed = !!(j && j.ok && j.data && H.apply(j.data)); } catch (e) {}
      if (changed && !ss(flag)) { try { sessionStorage.setItem(flag, "1"); } catch (e) {} location.reload(); return; }
      startPush();
    }).catch(startPush);
  }
  function pushNow() {
    const H = window.HUB_PROGRESS; if (!H || !profile || !profile.name) return;
    let c; try { c = H.collect(); } catch (e) { return; }
    const sig = JSON.stringify(c.data) + "|" + profile.name + "|" + (profile.group || ""); if (sig === lastPush) return; lastPush = sig;
    fetch(API, { method: "POST", keepalive: true, body: JSON.stringify({ action: "progress", name: profile.name, group: profile.group || "", data: c.data, summary: c.summary }) }).catch(() => { lastPush = ""; });
  }
  function startPush() {
    if (pushTimer) return; pushNow(); pushTimer = setInterval(pushNow, 15000);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") pushNow(); });
    window.addEventListener("hub-progress", () => setTimeout(pushNow, 300));
  }

  /* ---------- real counter in the hero ---------- */
  function renderCounter(s) {
    const host = document.querySelector(".ds-stats"); if (!host || !s) return;
    let el = document.getElementById("vk-count");
    if (!el) { el = document.createElement("span"); el.id = "vk-count"; el.className = "vk-count"; host.insertBefore(el, host.firstChild); }
    el.innerHTML = `👥 <b>${fmtN(s.unique)}</b> ${s.unique === 1 ? "student" : "students"} visited · <b>${fmtN(s.today)}</b> today`;
  }

  /* ---------- trainer report ---------- */
  let report = null, rState = { q: "", group: "All", today: false, sort: "last", days: 30 };
  const pl = (p) => { try { if (typeof VIEW_LABELS === "object" && VIEW_LABELS[p]) return VIEW_LABELS[p]; } catch (e) {} return p === "overview" ? "Home" : p; };
  const dt = (t) => t ? new Date(t).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
  function merged() {
    const by = {};
    (report.students || []).forEach(s => {
      const k = (s.name || "").toLowerCase().replace(/\s+/g, " ").trim() + "|" + (s.group || "").toLowerCase();
      const m = by[k] || (by[k] = { name: s.name, group: s.group, batch: s.batch, first: s.first, last: 0, views: 0, days: new Set(), pages: {}, devices: 0, lastPage: "" });
      m.devices++; m.views += s.views; m.first = Math.min(m.first || s.first, s.first); if (s.last > m.last) { m.last = s.last; m.lastPage = s.lastPage; }
      (s.days || []).forEach(d => m.days.add(d)); (s.pages || []).forEach(([p, n]) => m.pages[p] = (m.pages[p] || 0) + n);
      if (!m.batch && s.batch) m.batch = s.batch;
    });
    const P = report.progress || {};
    Object.values(by).forEach(m => { m.prog = P[normKey(m.name, m.group)] || null; });
    return Object.values(by);
  }
  function renderReport() {
    const box = document.getElementById("vk-report"); if (!box || !report) return;
    const all = merged(); const today = report.today;
    const groups = ["All", ...[...new Set(all.map(s => s.group || "—"))].sort()];
    let rows = all.filter(s => (!rState.q || s.name.toLowerCase().includes(rState.q.toLowerCase())) && (rState.group === "All" || (s.group || "—") === rState.group) && (!rState.today || s.days.has(today)));
    rows.sort(rState.sort === "name" ? (a, b) => a.name.localeCompare(b.name) : rState.sort === "views" ? (a, b) => b.views - a.views : rState.sort === "days" ? (a, b) => b.days.size - a.days.size : rState.sort === "prog" ? (a, b) => ((b.prog && b.prog.pct) || 0) - ((a.prog && a.prog.pct) || 0) : (a, b) => b.last - a.last);
    const daily = report.daily || []; const mx = Math.max(1, ...daily.map(d => d.unique));
    const todayN = all.filter(s => s.days.has(today)).length;
    const hasProg = all.some(s => s.prog);
    const pc = (s) => s.prog ? (window.HUB_PROGRESS && window.HUB_PROGRESS.reportCells ? window.HUB_PROGRESS.reportCells(s.prog) : [`${s.prog.pct || 0}%`]) : (window.HUB_PROGRESS && window.HUB_PROGRESS.reportHead ? window.HUB_PROGRESS.reportHead().map(() => "—") : ["—"]);
    const ph = hasProg ? (window.HUB_PROGRESS && window.HUB_PROGRESS.reportHead ? window.HUB_PROGRESS.reportHead() : ["Progress"]) : [];
    box.innerHTML = `<div class="vk-head"><h3>👥 Student visits</h3><span>Only you can see this (trainer login). Updated ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span></div>
      <div class="vk-tiles">
        <div class="vk-tile"><b>${fmtN(all.length)}</b><span>Students checked in by name</span></div>
        <div class="vk-tile"><b>${fmtN(todayN)}</b><span>Of them visited today</span></div>
        <div class="vk-tile"><b>${fmtN(report.unique)}</b><span>Unique visitors (all devices)</span></div>
        <div class="vk-tile"><b>${fmtN(report.views)}</b><span>Page views in total</span></div>
      </div>
      <div style="font-size:13px;font-weight:600;">Unique visitors per day · last ${daily.length} days</div>
      <div class="vk-chart">${daily.map(d => `<div class="vk-bar ${d.day === today ? "today" : ""}" style="height:${Math.round(d.unique / mx * 100)}%" title="${d.day}: ${d.unique} visitors · ${d.named} named · ${d.views} page views">${d.unique ? `<i>${d.unique}</i>` : ""}</div>`).join("")}</div>
      <div class="vk-axis"><span>${daily[0] ? daily[0].day : ""}</span><span>today</span></div>
      <div class="vk-tools">
        <input type="text" id="vk-q" placeholder="Search a student by name…" value="${esc(rState.q)}">
        <select id="vk-g">${groups.map(g => `<option ${g === rState.group ? "selected" : ""}>${esc(g)}</option>`).join("")}</select>
        <select id="vk-s"><option value="last" ${rState.sort === "last" ? "selected" : ""}>Sort: last visit</option><option value="views" ${rState.sort === "views" ? "selected" : ""}>Sort: most page views</option><option value="days" ${rState.sort === "days" ? "selected" : ""}>Sort: most active days</option><option value="name" ${rState.sort === "name" ? "selected" : ""}>Sort: name</option>${hasProg ? `<option value="prog" ${rState.sort === "prog" ? "selected" : ""}>Sort: progress</option>` : ""}</select>
        <label style="font-size:13px;display:flex;gap:6px;align-items:center;"><input type="checkbox" id="vk-t" ${rState.today ? "checked" : ""}> Visited today only</label>
        <button id="vk-csv">⬇ Download CSV</button><button id="vk-ref">⟳ Refresh</button>
      </div>
      <div class="vk-wrap"><table class="vk-table"><thead><tr><th>Student</th><th>Group</th><th>First visit</th><th>Last visit</th><th>Today</th><th>Active days</th><th>Page views</th>${ph.map(h => `<th>${esc(h)}</th>`).join("")}<th>Most opened pages</th></tr></thead>
      <tbody>${rows.length ? rows.map(s => `<tr><td><b>${esc(s.name)}</b>${s.devices > 1 ? `<div class="vk-pages">${s.devices} devices</div>` : ""}</td><td>${esc(s.group || "—")}</td><td>${dt(s.first)}</td><td>${dt(s.last)}<div class="vk-pages">on ${esc(pl(s.lastPage))}</div></td>
        <td>${s.days.has(today) ? '<span class="vk-yes">✓</span>' : '<span class="vk-no">—</span>'}</td><td class="n">${s.days.size}</td><td class="n">${fmtN(s.views)}</td>${hasProg ? pc(s).map(v => `<td class="n">${v}</td>`).join("") : ""}
        <td class="vk-pages">${Object.entries(s.pages).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([p, n]) => `${esc(pl(p))} (${n})`).join(", ")}</td></tr>`).join("")
        : `<tr><td colspan="${8 + ph.length}" style="color:var(--ink-muted,#888);padding:16px;">No students match. Students appear here after they open the site and enter their name.</td></tr>`}</tbody></table></div>`;
    const re = () => renderReport();
    box.querySelector("#vk-q").addEventListener("input", (e) => { rState.q = e.target.value; const pos = e.target.selectionStart; re(); const n = document.getElementById("vk-q"); n.focus(); n.setSelectionRange(pos, pos); });
    box.querySelector("#vk-g").addEventListener("change", (e) => { rState.group = e.target.value; re(); });
    box.querySelector("#vk-s").addEventListener("change", (e) => { rState.sort = e.target.value; re(); });
    box.querySelector("#vk-t").addEventListener("change", (e) => { rState.today = e.target.checked; re(); });
    box.querySelector("#vk-ref").addEventListener("click", loadReport);
    box.querySelector("#vk-csv").addEventListener("click", () => {
      const q = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
      const strip = (v) => String(v).replace(/<[^>]*>/g, "");
      const lines = [["Name", "Group", "Batch", "First visit", "Last visit", "Visited today", "Active days", "Page views", ...ph, "Days visited"].map(q).join(",")]
        .concat(rows.map(s => [s.name, s.group, s.batch, dt(s.first), dt(s.last), s.days.has(today) ? "Yes" : "No", s.days.size, s.views, ...(hasProg ? pc(s).map(strip) : []), [...s.days].sort().join(" ")].map(q).join(",")));
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + lines.join("\n")], { type: "text/csv" }));
      a.download = `student-visits-${KEY}-${today}.csv`; document.body.appendChild(a); a.click(); a.remove();
    });
  }
  function loadReport() {
    const box = document.getElementById("vk-report"); if (!box) return;
    if (!report) box.innerHTML = `<div class="vk-head"><h3>👥 Student visits</h3><span>Loading…</span></div>`;
    post({ action: "report", pin: ss(PINK) || "", days: rState.days }).then(j => {
      if (!j.ok) { box.innerHTML = `<div class="vk-head"><h3>👥 Student visits</h3><span>${esc(j.error || "Could not load")}</span></div>`; return; }
      report = j; renderReport();
    }).catch(() => { box.innerHTML = `<div class="vk-head"><h3>👥 Student visits</h3><span>Could not reach the server.</span></div>`; });
  }
  function trainerWatch() {
    const isTr = ss(UNLOCK) === "1" && !!ss(PINK);
    const root = document.getElementById("sch-root"); let box = document.getElementById("vk-report");
    if (isTr && root && !box) { box = document.createElement("div"); box.id = "vk-report"; box.className = "card vk-report"; root.parentNode.insertBefore(box, root); report = null; loadReport(); }
    if (!isTr && box) { box.remove(); report = null; }
  }

  /* ---------- start ---------- */
  function start() {
    fetch(API + "?stats=1&t=" + Date.now(), { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(s => {
      if (!s || typeof s.unique !== "number") return;          // live API not connected → stay hidden
      renderCounter(s);
      fetch(API + "?t=" + Date.now(), { cache: "no-store" }).then(r => r.json()).catch(() => null).then(sched => {
        const project = activeProject(sched);
        profile = me(); if (project && !profile.batch) { profile.batch = project.code; saveMe(profile); }
        const begin = () => { renderChip(profile, project); hookViews(); ping(curView(), true); progressSync(); setTimeout(() => fetch(API + "?stats=1&t=" + Date.now()).then(r => r.json()).then(renderCounter).catch(() => {}), 1500); };
        if (profile.name) begin();
        else askName(project, (n, g) => { profile.name = n; profile.group = g; saveMe(profile); begin(); });
      });
      setInterval(trainerWatch, 1500); trainerWatch();
    }).catch(() => {});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
