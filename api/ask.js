/**
 * "Ask Mahendra" — AI answers for this capstone site (Vercel serverless function), URL: /api/ask
 *
 * Uses Groq's free API. Set ONE environment variable in Vercel → Settings → Environment Variables:
 *   GROQ_API_KEY = gsk_...        (never put the key in code or GitHub)
 * Optional: GROQ_MODEL = a model id from console.groq.com/docs/models (otherwise the list below is tried in order).
 *
 *   GET  /api/ask                → {ok, configured}
 *   POST {q, ctx:[{h,t}], hist:[{r,c}], site}  → {answer, model}
 *
 * The browser sends the question plus the most relevant passages from this site, so answers stay grounded in the
 * project. If the key is missing, the limit is hit, or Groq is down, the site falls back to its built-in search.
 */
const MODELS = ["llama-3.3-70b-versatile", "openai/gpt-oss-120b", "llama-3.1-8b-instant"];
const PER_IP = 20, WINDOW_MS = 10 * 60 * 1000;           // 20 questions / 10 minutes per student (per server instance)
const hits = new Map();

function limited(ip) {
  const now = Date.now(); const a = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  if (a.length >= PER_IP) { hits.set(ip, a); return true; }
  a.push(now); hits.set(ip, a); if (hits.size > 5000) hits.clear(); return false;
}
const clip = (s, n) => String(s == null ? "" : s).slice(0, n);

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  return await new Promise(r => { let d = ""; req.on("data", c => { d += c; if (d.length > 60000) req.destroy(); }); req.on("end", () => { try { r(JSON.parse(d || "{}")); } catch (e) { r({}); } }); req.on("error", () => r({})); });
}

function systemPrompt(site, ctx) {
  return `You are "Ask Mahendra", the AI teaching assistant of Mahendra Singh, a Data Analyst trainer at ExcelR. You live on the "${site}" capstone project website and help Data Analyst students with this project: business questions, KPIs and formulas, the data model, SQL, Excel, Tableau, Power BI, presentations and interview preparation.

Rules:
- Base your answer on the SITE CONTEXT below whenever it covers the question. Do not invent dataset numbers, table names or column names that are not in the context.
- If the context does not cover it, answer from general Data Analyst knowledge and say in one short line that it is general guidance, not from this project's site.
- Be short and practical: at most about 150 words unless the student asks for detail. Use short bullet points when listing. Put SQL, DAX or Excel formulas in fenced code blocks.
- Reply in the student's language: English, Hindi or Hinglish, matching how they wrote.
- Guide students to do their own capstone work: explain the approach and give small examples, but do not write a whole graded deliverable for them.
- You are an AI assistant, not Mahendra himself. For schedules, marks, attendance, certificates or personal issues, tell the student to ask Mahendra Sir directly.
- Politely decline anything unrelated to data analytics, careers in data, or this project.

SITE CONTEXT (passages from this website):
${ctx || "(no matching passage found on the site)"}`;
}

async function callGroq(key, model, messages) {
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 25000);
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST", signal: ac.signal,
      headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 700 }),
    });
    const j = await r.json().catch(() => ({}));
    return { status: r.status, j };
  } finally { clearTimeout(t); }
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const key = process.env.GROQ_API_KEY || "";
  if (req.method === "GET") return res.status(200).json({ ok: true, configured: !!key });
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  if (!key) return res.status(503).json({ error: "not_configured" });

  // only this website may use the key
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").toLowerCase();
  const origin = String(req.headers.origin || req.headers.referer || "").toLowerCase();
  if (origin && host && !origin.replace(/^https?:\/\//, "").startsWith(host)) return res.status(403).json({ error: "origin" });

  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "?").split(",")[0].trim();
  if (limited(ip)) return res.status(429).json({ error: "slow_down", message: "Too many questions in a short time. Please wait a few minutes." });

  const b = await readBody(req);
  const q = clip(b.q, 600).trim(); if (!q) return res.status(400).json({ error: "empty" });
  const site = clip(b.site, 120) || "Data Analyst capstone";
  const ctx = (Array.isArray(b.ctx) ? b.ctx : []).slice(0, 10).map(c => `### ${clip(c && c.h, 120)}\n${clip(c && c.t, 1400)}`).join("\n\n").slice(0, 9000);
  const hist = (Array.isArray(b.hist) ? b.hist : []).slice(-6).filter(m => m && (m.r === "user" || m.r === "assistant"))
    .map(m => ({ role: m.r, content: clip(m.c, 1200) }));
  const messages = [{ role: "system", content: systemPrompt(site, ctx) }, ...hist, { role: "user", content: q }];

  const models = (process.env.GROQ_MODEL ? [process.env.GROQ_MODEL] : []).concat(MODELS);
  let last = null;
  for (const model of models) {
    let r;
    try { r = await callGroq(key, model, messages); } catch (e) { last = { status: 504 }; continue; }
    const answer = r.j && r.j.choices && r.j.choices[0] && r.j.choices[0].message && r.j.choices[0].message.content;
    if (r.status === 200 && answer) return res.status(200).json({ answer: String(answer).trim(), model });
    last = r;
    if (r.status === 401) return res.status(502).json({ error: "bad_key", message: "The GROQ_API_KEY in Vercel is not valid." });
    // 404/400 = model retired or unknown, 429 = this model's free limit reached, 5xx = Groq hiccup → try the next model
  }
  const busy = last && last.status === 429;
  return res.status(busy ? 429 : 502).json({ error: busy ? "limit" : "upstream", message: busy ? "The free AI limit is used up for now. Please try again later." : "The AI service did not answer." });
};
