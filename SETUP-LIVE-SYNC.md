# Project Schedule — Live Sync setup (Vercel + Upstash Redis, free)

Ek baar setup karo. Uske baad: **PIN se login → details bharo → apne aap save → sab students ko dikhe.**
Koi Google Sheet / script nahi. Sab kuch aapke Vercel account me hi.

> Setup se pehle bhi site normal chalti hai (project-schedule.js file se). Database judte hi apne aap Live mode on ho jata hai.

## Step 1 — Naye files GitHub par daalo
Is zip ke saare files apne GitHub repo me upload/replace karo (khas karke naya folder **`api/`** aur `schedule-config.js`, `app.js`, `index.html`, `vercel.json`).
Vercel apne aap deploy kar dega.

## Step 2 — Free database jodo (2–3 min)
1. vercel.com → apna project kholo → upar **Storage** tab.
2. **Create Database** → **Upstash** (Redis) chuno → Continue.
3. Plan: **Free** · Region: **Mumbai (ap-south-1)** ya jo paas ho · koi bhi naam → **Create**.
4. "Connect to project" me apna project chuno (Production + Preview dono tick) → **Connect**.
   (Ye apne aap `KV_REST_API_URL` aur `KV_REST_API_TOKEN` settings me daal deta hai — aapko kuch copy nahi karna.)

## Step 3 — Redeploy
Project → **Deployments** → sabse upar wale ke **⋯** → **Redeploy**.

## Step 4 — Check
1. Site kholo → **Project Schedule & Status** → **Trainer login** → PIN `excelr2026`.
2. Upar **"☁ Live sync ON"** dikhe to setup ho gaya.
3. Aapne jo details pehle isi browser me bhari thi, wo pehli login par apne aap server par chali jayengi.
4. **Turant "Change PIN" dabake apna naya PIN rakho.** (Naya PIN server par safe rehta hai; website code me kahin nahi hota.)

## Rozana use
- Login → status badlo (Done / Pending / Nobody presented) → "✅ Saved" dikhega → students page refresh karein to turant dikhega (khula page bhi har 1 min me khud update hota hai).
- Kaam ke baad **Lock** daba do.

## Security
- PIN server par check hota hai. Students ke paas na PIN hai na database key, isliye wo kuch badal/reset nahi kar sakte.
- 8 galat PIN 15 minute me → 15 minute ke liye login band (guessing se bachav).
- PIN bhool gaye? Vercel → Settings → Environment Variables me `ADMIN_PIN` = naya PIN daalo, phir Storage → Upstash → Data Browser me key `axon:crm:pinhash` delete karo → Redeploy.

## Optional
- Shuruaati PIN alag chahiye to Vercel → Settings → Environment Variables → `ADMIN_PIN` add karo (default `excelr2026`).

## Real visitor counter + student check-in (same database, nothing extra to set up)
- Students open the site → enter their **name and group once** (saved on their device).
- Hero shows the real count: "👥 X students visited · Y today" (only when the database is connected; otherwise hidden).
- **Trainer login** on Project Schedule → a "👥 Student visits" panel appears below the schedule:
  who visited, first/last visit, visited today ✓, active days, page views, most opened pages, a 30-day chart, search, group filter and **Download CSV**.
- Same student on phone + laptop shows as one row (merged by name + group).
