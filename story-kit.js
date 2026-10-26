/* Kick-off Story kit v2
   (1) animated, project-specific data architecture on Home, coloured from the site's own theme (light + dark)
   (2) "🎬 Kick-off Story": a comic-book role-play of a real BI kick-off (panels, backgrounds, posed characters).
   Content per project lives in story-data.js (window.KICKOFF_DATA[site]). No database, no network. */
(function () {
  "use strict";
  const me = document.currentScript;
  const SITE = (me && me.dataset.site) || "";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const RM = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ===================================================== styles ===================================================== */
  const STYLE = `
/* ---------- architecture (site theme colours) ---------- */
.arch2{--s-src:var(--blue,#2856A3);--t-src:var(--blue-tint,#E9F0FA);--s-ing:var(--teal,#0E86C9);--t-ing:var(--teal-tint,#E6F3FA);--s-stg:var(--blue,#2856A3);--t-stg:var(--blue-tint,#E9F0FA);--s-trf:var(--amber,#A15C07);--t-trf:var(--amber-tint,#FBF0DD);--s-mart:var(--teal-deep,#0A5A87);--t-mart:var(--teal-tint,#E6F3FA);
  position:relative;background:var(--paper-raised,#fff);border:1px solid var(--line,#DDE2E0);border-radius:16px;box-shadow:var(--shadow-card,0 6px 20px rgba(16,24,38,.06));padding:18px 18px 14px;color:var(--ink,#101826);overflow:hidden}
.arch2-top{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:10px}
.arch2-title{display:flex;align-items:center;gap:10px}
.arch2-title .lg{width:34px;height:34px;border-radius:10px;background:var(--teal,#0E86C9);display:grid;place-items:center;color:#fff;font-size:17px;box-shadow:0 6px 14px -6px var(--teal,#0E86C9)}
.arch2-title b{display:block;font:700 15px/1.2 var(--display,inherit);color:var(--ink,#101826)}
.arch2-title small{display:block;font:500 11.5px/1.3 var(--body,inherit);color:var(--ink-muted,#5B6472)}
.arch2-steps{display:flex;flex-wrap:wrap;gap:6px}
.arch2-steps span{font:600 11.5px/1 var(--body,inherit);padding:7px 10px;border-radius:99px;background:var(--paper,#F6F7F5);border:1px solid var(--line,#DDE2E0);color:var(--ink-muted,#5B6472);transition:all .25s}
.arch2-steps span i{font-style:normal;display:inline-grid;place-items:center;width:16px;height:16px;border-radius:50%;background:var(--line,#DDE2E0);color:var(--ink,#101826);font-size:10px;margin-right:6px}
.arch2-steps span.on{background:var(--teal,#0E86C9);border-color:var(--teal,#0E86C9);color:#fff;box-shadow:0 6px 16px -8px var(--teal,#0E86C9)}
.arch2-steps span.on i{background:rgba(255,255,255,.25);color:#fff}
.arch2-live{display:inline-flex;align-items:center;gap:7px;font:600 11px/1 var(--body,inherit);color:var(--teal-deep,#0A5A87);background:var(--teal-tint,#E6F3FA);padding:6px 10px;border-radius:99px}
.arch2-live i{width:7px;height:7px;border-radius:50%;background:#16a34a;animation:a2pulse 1.6s infinite}
@keyframes a2pulse{0%{box-shadow:0 0 0 0 rgba(22,163,74,.55)}70%{box-shadow:0 0 0 7px rgba(22,163,74,0)}100%{box-shadow:0 0 0 0 rgba(22,163,74,0)}}
.arch2 svg{display:block;width:100%;height:auto}
.arch2 .lane{fill:var(--paper,#F6F7F5)}
.arch2 .lane-h{font:700 10px var(--body,sans-serif);letter-spacing:.12em;fill:var(--ink-muted,#5B6472)}
.arch2 .nd .bg{fill:var(--paper-raised,#fff);stroke:var(--line,#DDE2E0);stroke-width:1.2;filter:drop-shadow(0 2px 5px rgba(16,24,38,.07));transition:stroke .25s,filter .25s}
.arch2 .nd.hit .bg{stroke:var(--c);stroke-width:2;filter:drop-shadow(0 6px 14px rgba(16,24,38,.16))}
.arch2 .nd .tile{fill:var(--t)}
.arch2 .nd .ic{color:var(--c)}
.arch2 .nd .t{font:700 12.5px var(--display,var(--body,sans-serif));fill:var(--ink,#101826)}
.arch2 .nd .s{font:500 10.5px var(--body,sans-serif);fill:var(--ink-muted,#5B6472)}
.arch2 .nd .k{font:700 9px var(--body,sans-serif);letter-spacing:.1em;fill:var(--c)}
.arch2 .nd .dot{fill:var(--line,#DDE2E0);transition:fill .2s}
.arch2 .nd.hit .dot{fill:#16a34a}
.arch2 .pth{fill:none;stroke:var(--line,#DDE2E0);stroke-width:2}
.arch2 .pth2{fill:none;stroke:var(--c);stroke-width:2;stroke-dasharray:3 9;opacity:.6;animation:a2dash 1.1s linear infinite}
@keyframes a2dash{to{stroke-dashoffset:-24}}
.arch2 .pk rect{fill:var(--c)}
.arch2 .pk text{font:700 9.5px var(--body,sans-serif);fill:#fff}
.arch2-feed{margin-top:12px;display:grid;grid-template-columns:1fr;gap:6px;background:var(--paper,#F6F7F5);border:1px solid var(--line,#DDE2E0);border-radius:12px;padding:10px 12px;height:116px;overflow:hidden}
.arch2-feed div{display:flex;align-items:center;gap:10px;font:500 12px/1.3 var(--body,inherit);color:var(--ink,#101826);white-space:nowrap;overflow:hidden;animation:a2in .35s ease}
.arch2-feed .tm{font:500 11px var(--mono,monospace);color:var(--ink-muted,#5B6472);flex:none}
.arch2-feed .bd{flex:none;font:700 10px/1 var(--body,inherit);letter-spacing:.06em;padding:4px 7px;border-radius:6px;background:var(--t);color:var(--c);min-width:78px;text-align:center}
.arch2-feed .mg{overflow:hidden;text-overflow:ellipsis}
@keyframes a2in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.arch2-cap{margin:10px 2px 0;font-size:13px;color:var(--ink-muted,#5B6472);line-height:1.55}
.arch2-cap b{color:var(--ink,#101826)}
.ko-teaser{margin-top:16px;display:flex;gap:16px;align-items:center;flex-wrap:wrap;border-radius:16px;padding:16px 18px;background:var(--teal-tint,#E6F3FA);border:1px solid var(--line,#DDE2E0);color:var(--ink,#101826);position:relative;overflow:hidden}
.ko-teaser:after{content:"";position:absolute;right:-40px;top:-40px;width:160px;height:160px;border-radius:50%;background:var(--teal,#0E86C9);opacity:.08}
.ko-teaser .em{font-size:36px}
.ko-teaser h4{margin:0 0 3px;font:800 16px/1.25 var(--display,inherit)}
.ko-teaser p{margin:0;font-size:13.5px;color:var(--ink-muted,#5B6472);max-width:640px}
.ko-teaser button{margin-left:auto;background:var(--teal,#0E86C9);color:#fff;border:0;border-radius:10px;padding:11px 16px;font-weight:700;cursor:pointer;position:relative;z-index:1}

/* ---------- comic ---------- */
.ko{--ln:#151515;--y:#ffd43b;--acc:var(--teal,#0E86C9);--acc-t:var(--teal-tint,#E6F3FA);--amb:var(--amber,#A15C07);max-width:1100px;margin:0 auto}
.ko-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px}
.ko-head h2{margin:6px 0 0;font:400 34px/1 "Bangers","Impact","Arial Black",sans-serif;letter-spacing:.05em;color:var(--ink,#101826)}
.ko-head p{margin:6px 0 0;color:var(--ink-muted,#666);font-size:14px}
.ko-ep{display:inline-block;background:var(--acc);color:#fff;font:700 11px/1 var(--body,inherit);letter-spacing:.06em;padding:6px 10px;border-radius:99px}
.ko-book{position:relative;background:#fbf7ee;border:3px solid var(--ln);border-radius:14px;box-shadow:8px 8px 0 var(--ln);padding:16px 16px 84px;min-height:560px;color:#151515}
body.dark-mode .ko-book{background:#efe9dc;box-shadow:8px 8px 0 #000}
.ko-page{animation:koPg .45s cubic-bezier(.2,.9,.3,1.15)}
@keyframes koPg{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:none}}
.ko-ptitle{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 12px}
.ko-ptitle .no{font:400 15px/1 "Bangers","Impact",sans-serif;letter-spacing:.06em;background:#151515;color:#fff;padding:6px 9px;border-radius:6px}
.ko-ptitle h3{margin:0;font:400 28px/1 "Bangers","Impact","Arial Black",sans-serif;letter-spacing:.05em;color:#151515}
.ko-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px}
.kp{position:relative;grid-column:span 6;border:3px solid var(--ln);border-radius:6px;background:#fff;overflow:hidden;display:flex;flex-direction:column;min-height:250px;opacity:.13;filter:grayscale(1);transform:scale(.98);transition:opacity .35s,filter .35s,transform .45s cubic-bezier(.2,1.3,.4,1)}
.kp.in{opacity:1;filter:none;transform:none}
.kp.w2{grid-column:span 2}.kp.w3{grid-column:span 3}.kp.w4{grid-column:span 4}
.kp-bg{position:absolute;inset:0;width:100%;height:100%;z-index:0}
.kp:after{content:"";position:absolute;inset:0;background-image:radial-gradient(rgba(0,0,0,.06) 1px,transparent 1.2px);background-size:7px 7px;pointer-events:none;z-index:1}
.kp>*:not(.kp-bg):not(.kp-sfx){position:relative;z-index:2}
.kp-cap{align-self:flex-start;margin:0;background:var(--y);border-right:3px solid var(--ln);border-bottom:3px solid var(--ln);padding:6px 10px;font:700 11.5px/1.3 var(--body,inherit);text-transform:uppercase;letter-spacing:.04em;max-width:90%;color:#151515}
.kp-talk{flex:1;display:flex;flex-direction:column;gap:12px;padding:12px 12px 6px}
.kb{position:relative;max-width:86%;background:#fff;border:2.5px solid var(--ln);border-radius:18px;padding:8px 12px;font:700 13.5px/1.42 "Comic Neue","Comic Sans MS","Trebuchet MS",sans-serif;color:#151515;box-shadow:2px 3px 0 rgba(0,0,0,.15);opacity:0;transform:scale(.6);transform-origin:var(--o,20% 100%)}
.kb.show{animation:kbPop .4s cubic-bezier(.2,1.6,.4,1) forwards}
.kb.done{opacity:1;transform:none}
.kb .caret{display:inline-block;width:2px;height:1em;background:#151515;margin-left:1px;vertical-align:-2px;animation:caret .6s steps(1) infinite}
@keyframes caret{50%{opacity:0}}
.ch .mo{opacity:0}
.ch.talk .mouth{animation:mA .28s steps(1) infinite}.ch.talk .mo{animation:mB .28s steps(1) infinite}
@keyframes mA{0%{opacity:1}50%{opacity:0}}@keyframes mB{0%{opacity:0}50%{opacity:1}}
.ch .bd{transform-origin:50% 100%;transform-box:fill-box;animation:breathe 3.2s ease-in-out infinite}
.ch .hd{transform-origin:50% 90%;transform-box:fill-box}
.ch.talk .hd{animation:bob .55s ease-in-out infinite alternate}
.ch.talk .arms{transform-origin:50% 0;transform-box:fill-box;animation:gest 1.1s ease-in-out infinite alternate}
@keyframes breathe{50%{transform:translateY(1.5px) scaleY(.992)}}
@keyframes bob{from{transform:rotate(-2.5deg)}to{transform:rotate(2.5deg) translateY(-1px)}}
@keyframes gest{from{transform:rotate(-1.5deg)}to{transform:rotate(1.5deg)}}
.kp.in .ch{animation:enter .55s cubic-bezier(.2,1.2,.4,1) backwards;animation-delay:var(--ed,0s)}
@keyframes enter{from{opacity:0;transform:translateX(-50%) translateY(40px)}to{opacity:1;transform:translateX(-50%)}}
.ch.talk .tag{background:var(--acc)}
.ko-play{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 12px}
.ko-play .big{border:3px solid #151515;background:var(--y);color:#151515;border-radius:14px;padding:12px 20px;font:400 22px/1 "Bangers","Impact",sans-serif;letter-spacing:.06em;cursor:pointer;box-shadow:4px 4px 0 #151515}
.ko-play .big:active{transform:translate(2px,2px);box-shadow:2px 2px 0 #151515}
.ko-play span{font-size:13px;color:var(--ink-muted,#555)}
.ko-nav button.pl{min-width:96px}
.ko-vbtn{border:2.5px solid #151515;background:#fff;color:#151515;border-radius:12px;padding:9px 12px;font:700 13.5px/1 var(--body,inherit);cursor:pointer;box-shadow:3px 3px 0 #151515}
.ko-vbtn[aria-pressed="false"]{background:#f1f1f1;color:#666}
.ko-vsel{display:inline-flex;align-items:center;gap:6px;font:600 12.5px/1 var(--body,inherit);color:var(--ink,#151515)}
.ko-vsel select{border:2px solid #151515;border-radius:8px;padding:5px 6px;font:inherit;background:#fff;color:#151515}
@keyframes kbPop{to{opacity:1;transform:none}}
.kb .who{display:block;font:800 10px/1 var(--body,inherit);letter-spacing:.08em;text-transform:uppercase;color:var(--acc);margin-bottom:3px}
.kb:after{content:"";position:absolute;bottom:-10px;left:var(--tx,28px);width:15px;height:15px;background:inherit;border-right:2.5px solid var(--ln);border-bottom:2.5px solid var(--ln);transform:rotate(45deg);border-radius:0 0 3px 0}
.kb.al{align-self:flex-start}.kb.ac{align-self:center;--tx:calc(50% - 8px);--o:50% 100%}.kb.ar{align-self:flex-end;--tx:calc(100% - 44px);--o:80% 100%}
.kb.think{background:#eef4ff;border-style:dashed;border-radius:26px}
.kb.think:after{width:11px;height:11px;border-radius:50%;border:2.5px solid var(--ln);transform:none;bottom:-15px}
.kb.shout{background:#fff1f1;border-width:3px}
.kb.narr{background:var(--y);border-radius:4px;box-shadow:none}.kb.narr:after{display:none}
.kb .why{display:block;margin-top:6px;font:700 11px/1.4 var(--body,inherit);color:var(--acc);background:var(--acc-t);border-radius:8px;padding:5px 7px}
.kp-cast{position:relative;height:176px;flex:none}
.kp-cast .ch{position:absolute;bottom:0;width:150px;transform:translateX(-50%)}
.kp-cast .ch svg{display:block;width:150px;height:176px}
.kp-cast .ch.flip svg{transform:scaleX(-1)}
.kp-cast .ch .tag{position:absolute;left:50%;bottom:6px;transform:translateX(-50%);background:#151515;color:#fff;font:700 10px/1 var(--body,inherit);padding:4px 7px;border-radius:5px;white-space:nowrap;z-index:3}
.kp-front{position:absolute;left:0;right:0;bottom:0;width:100%;height:34px;z-index:2;pointer-events:none}
.kp-cast.tbl .ch .tag{bottom:36px}
.kp-sfx{position:absolute;right:16px;top:12px;z-index:4;font:400 27px/1 "Bangers","Impact","Arial Black",sans-serif;letter-spacing:.06em;color:#ffd43b;-webkit-text-stroke:1.5px #151515;text-shadow:3px 3px 0 #151515;transform:rotate(8deg)}
.kp.in .kp-sfx{animation:sfx .5s cubic-bezier(.2,1.8,.4,1)}
@keyframes sfx{from{transform:rotate(8deg) scale(.2)}to{transform:rotate(8deg) scale(1)}}
.kp-note{background:#151515;color:#fff;font:600 12px/1.4 var(--body,inherit);padding:7px 10px}
.kp-info{padding:12px;display:flex;flex-direction:column;gap:10px;flex:1}
.kc{background:#fff;border:2.5px solid var(--ln);border-radius:10px;padding:10px 11px;box-shadow:3px 3px 0 var(--ln)}
.kc h5{margin:0 0 4px;font:800 13.5px/1.3 var(--body,inherit);color:#151515}
.kc p{margin:0;font-size:12.5px;line-height:1.45;color:#333}
.kc .tg{display:inline-block;font:700 9.5px/1 var(--body,inherit);letter-spacing:.08em;text-transform:uppercase;background:var(--acc);color:#fff;border-radius:4px;padding:4px 6px;margin-bottom:6px}
.kc code{display:block;margin-top:6px;font:600 11.5px/1.45 var(--mono,monospace);background:#f4f4f2;border:1px solid #ddd;border-radius:6px;padding:4px 6px;color:#151515;white-space:normal}
.kc.warn{background:#fffaf0}.kc.warn .tg{background:var(--amb)}
.kc.pain{background:#fff4f4}.kc.pain .tg{background:#dc2626}
.kc.ok{background:#f2fbf6}.kc.ok .tg{background:#15803d}
.kg{display:grid;gap:10px}.kg1{grid-template-columns:1fr}.kg2{grid-template-columns:repeat(2,minmax(0,1fr))}.kg3{grid-template-columns:repeat(3,minmax(0,1fr))}.kg4{grid-template-columns:repeat(4,minmax(0,1fr))}
.kn{background:#fff59d;padding:10px 11px;border-radius:3px;box-shadow:2px 4px 0 rgba(0,0,0,.2);transform:rotate(var(--r,-2deg));font:700 13px/1.35 "Comic Neue","Comic Sans MS",sans-serif;color:#151515}
.kn b{display:block;font:400 17px/1 "Bangers","Impact",sans-serif;letter-spacing:.05em;margin-bottom:4px}
.kroster{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.kroster .kc{text-align:center;padding:8px}
.kroster svg{width:100px;height:134px;display:block;margin:0 auto -4px}
.kroster .nm{font:800 12.5px/1.2 var(--body,inherit);color:#151515}
.kroster .rl{font:700 10.5px/1.2 var(--body,inherit);color:var(--acc);text-transform:uppercase;letter-spacing:.04em;margin:3px 0}
.kroster .sd{display:inline-block;font:700 9px/1 var(--body,inherit);letter-spacing:.08em;padding:3px 6px;border-radius:4px;margin-bottom:4px;background:#151515;color:#fff}
.kroster .sd.cl{background:var(--amb)}
.kroster p{font-size:11.5px}
.ktime{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));position:relative;margin-top:6px}
.ktime>div{position:relative;padding:40px 6px 0;text-align:center}
.ktime>div:before{content:"";position:absolute;top:16px;left:0;right:0;height:5px;background:#151515}
.ktime>div:first-child:before{left:50%}.ktime>div:last-child:before{right:50%}
.ktime .dt{position:absolute;top:3px;left:50%;transform:translateX(-50%);width:30px;height:30px;border-radius:50%;background:var(--acc-t);border:3px solid #151515;display:grid;place-items:center;font-size:14px}
.ktime h6{margin:0;font:400 16px/1 "Bangers","Impact",sans-serif;letter-spacing:.05em;color:#151515}
.ktime .wk{font:700 10px/1 var(--mono,monospace);color:#555;margin-top:3px}
.ktime p{font-size:12px;line-height:1.38;margin:5px 0 0;color:#222}
.kmom{background:#fff;border:2.5px solid var(--ln);border-radius:4px;box-shadow:5px 5px 0 var(--ln);padding:14px 16px;transform:rotate(-.5deg);font-size:13px;color:#151515}
.kmom h5{margin:0 0 6px;font:400 20px/1 "Bangers","Impact",sans-serif;letter-spacing:.05em}
.kmom table{width:100%;border-collapse:collapse}.kmom td,.kmom th{border-bottom:1.5px dashed #bbb;padding:6px 4px;text-align:left;vertical-align:top;font-size:12.5px}
.kmom th{font:700 10px/1 var(--body,inherit);text-transform:uppercase;letter-spacing:.06em;color:#555}
.kq{margin-bottom:12px}.kq p{font-weight:800;margin:0 0 6px;font-size:14px;color:#151515}
.kq button{display:block;width:100%;text-align:left;border:2.5px solid #151515;background:#fff;border-radius:10px;padding:8px 11px;margin:6px 0;font:600 13.5px/1.35 var(--body,inherit);cursor:pointer;color:#151515}
.kq button.ok{background:#bbf7d0}.kq button.no{background:#fecdd3}.kq .fb{font-size:12.5px;margin-top:4px;color:#333}
.kcta{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.kcta button{border:2.5px solid #151515;background:var(--y);border-radius:10px;padding:9px 12px;font:700 13px/1 var(--body,inherit);cursor:pointer;box-shadow:3px 3px 0 #151515;color:#151515}
.ko-nav{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center;gap:10px;padding:12px 16px;border-top:3px solid var(--ln);background:#fff;border-radius:0 0 11px 11px;z-index:5}
.ko-nav button{border:2.5px solid #151515;background:#fff;color:#151515;border-radius:10px;padding:9px 14px;font:800 14px/1 var(--body,inherit);cursor:pointer;box-shadow:3px 3px 0 #151515}
.ko-nav button:active{transform:translate(2px,2px);box-shadow:1px 1px 0 #151515}
.ko-nav button.go{background:var(--acc);color:#fff;min-width:140px}
.ko-nav button:disabled{opacity:.35;cursor:default}
.ko-prog{flex:1;min-width:80px;height:10px;border:2px solid #151515;border-radius:99px;overflow:hidden;background:#fff}
.ko-prog i{display:block;height:100%;width:0;background:var(--y);transition:width .3s}
.ko-scene{font:700 12px/1.2 var(--body,inherit);color:#333;white-space:nowrap}
.ko-arch{border:2.5px solid var(--ln);border-radius:10px;overflow:hidden}
.ko-arch .arch2{border:0;border-radius:0;box-shadow:none}
.kp .ch .eye{transform-origin:center;transform-box:fill-box;animation:koBlink 5s infinite}
@keyframes koBlink{0%,93%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
@media (max-width:860px){.kp.w2,.kp.w3,.kp.w4{grid-column:span 6}.kg3,.kg4{grid-template-columns:repeat(2,minmax(0,1fr))}.ktime{grid-template-columns:1fr}.ktime>div{padding:0 0 12px 44px;text-align:left}.ktime>div:before{top:0;bottom:0;left:16px;right:auto;width:5px;height:auto}.ktime>div:first-child:before{top:16px;left:16px}.ktime>div:last-child:before{bottom:auto;height:16px;right:auto}.ktime .dt{left:17px;top:0}}
@media (max-width:560px){.ko-book{padding:10px 10px 84px}.kg2,.kg3,.kg4{grid-template-columns:1fr}.kp-cast{height:140px}.kp-cast .ch{width:118px}.kp-cast .ch svg{width:118px;height:140px}.kb{max-width:96%;font-size:13px}.ko-ptitle h3{font-size:23px}.ko-scene{display:none}.ko-teaser button{margin-left:0;width:100%}.ko-nav{gap:6px;padding:10px}.ko-nav button{padding:8px 10px;font-size:13px}.ko-nav button.go,.ko-nav button.pl{min-width:0}.ko-prog{min-width:24px}.ko-play .big{font-size:19px;padding:10px 14px}}
@media (prefers-reduced-motion:reduce){.kp,.kb,.ko-page,.arch2-feed div,.kp.in .ch{animation:none!important;transition:none!important;opacity:1!important}.kp,.kb{transform:none!important}.arch2 .pth2,.arch2-live i,.kp .ch .eye,.ch .bd,.ch.talk .hd,.ch.talk .arms{animation:none!important}}
`;
  function addCss() { if (document.getElementById("ko-css")) return; const s = document.createElement("style"); s.id = "ko-css"; s.textContent = STYLE; document.head.appendChild(s); }

  /* ===================================================== characters ===================================================== */
  // look: {skin, hair, hs, top, wear: blazer|shirt|hoodie|kurta|tee|coat, inner, glasses, beard, stubble, mustache, bindi, earrings, lanyard, tie}
  const K = "#1b1b1b";
  const shade = (hex, f) => { const n = parseInt(String(hex).slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; r = Math.min(255, Math.round(r * f)); g = Math.min(255, Math.round(g * f)); b = Math.min(255, Math.round(b * f)); return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1); };
  function hairBack(L) {
    const d = shade(L.hair, .8);
    if (L.hs === "long") return `<path d="M42 70 C34 120 40 160 54 176 L106 176 C120 160 126 120 118 70 Z" fill="${d}" stroke="${K}" stroke-width="2.5"/>`;
    if (L.hs === "wavy") return `<path d="M44 70 C30 112 38 150 50 160 C58 168 70 164 80 166 C90 164 102 168 110 160 C122 150 130 112 116 70 Z" fill="${d}" stroke="${K}" stroke-width="2.5"/>`;
    if (L.hs === "pony") return `<path d="M112 64 C132 70 136 104 124 128 C120 112 116 96 108 86 Z" fill="${d}" stroke="${K}" stroke-width="2.5"/>`;
    return "";
  }
  function hairFront(L) {
    const h = L.hair, k = `stroke="${K}" stroke-width="2.5" stroke-linejoin="round"`;
    switch (L.hs) {
      case "short": return `<path d="M45 74 C40 40 62 24 82 25 C104 26 122 40 117 74 C112 60 104 52 92 50 C82 56 64 58 52 56 C48 62 46 68 45 74 Z" fill="${h}" ${k}/>`;
      case "side": return `<path d="M45 76 C40 38 66 22 86 24 C108 27 122 44 116 72 C110 56 98 46 80 46 C70 52 58 52 48 60 Z" fill="${h}" ${k}/><path d="M60 40 C72 34 88 34 102 42" fill="none" stroke="#fff" stroke-width="2" opacity=".35"/>`;
      case "spiky": return `<path d="M44 74 L46 44 L56 50 L58 30 L70 42 L78 24 L88 40 L98 26 L104 44 L116 38 L116 74 C108 58 96 52 80 52 C64 52 52 58 44 74 Z" fill="${h}" ${k}/>`;
      case "curly": return `<g fill="${h}" ${k}>${[[52, 46, 12], [66, 34, 13], [82, 30, 13], [98, 34, 13], [111, 46, 12], [46, 60, 9], [117, 60, 9]].map(c => `<circle cx="${c[0]}" cy="${c[1]}" r="${c[2]}"/>`).join("")}</g>`;
      case "long": case "wavy": return `<path d="M44 80 C38 40 62 24 80 24 C100 24 124 40 116 80 C112 62 104 50 86 46 C80 54 64 58 52 60 C48 66 46 72 44 80 Z" fill="${h}" ${k}/>`;
      case "bun": return `<circle cx="80" cy="20" r="13" fill="${h}" ${k}/><path d="M45 74 C42 40 62 28 80 28 C100 28 120 40 115 74 C110 58 98 48 80 47 C64 48 52 58 45 74 Z" fill="${h}" ${k}/>`;
      case "pony": return `<path d="M45 76 C42 40 62 26 80 26 C100 26 120 40 115 74 C110 58 98 48 80 47 C64 48 52 58 45 76 Z" fill="${h}" ${k}/>`;
      case "bald": return `<path d="M44 66 C44 56 46 52 48 50 L48 76 Z M116 66 C116 56 114 52 112 50 L112 76 Z" fill="${h}" ${k}/><path d="M58 38 C68 32 80 31 92 33" fill="none" stroke="#fff" stroke-width="3" opacity=".45" stroke-linecap="round"/>`;
      case "grey": return `<path d="M45 74 C40 40 62 24 82 25 C104 26 122 40 117 74 C112 60 104 52 92 50 C82 56 64 58 52 56 C48 62 46 68 45 74 Z" fill="#d6dbe1" ${k}/>`;
      default: return "";
    }
  }
  function faceParts(L, mood) {
    const k = K;
    const brow = { worry: `<path d="M56 56 L70 60 M104 56 L90 60" stroke="${k}" stroke-width="3.2" stroke-linecap="round"/>`, angry: `<path d="M56 54 L71 61 M104 54 L89 61" stroke="${k}" stroke-width="3.6" stroke-linecap="round"/>`, think: `<path d="M56 57 L70 56 M90 53 Q97 50 104 55" fill="none" stroke="${k}" stroke-width="3.2" stroke-linecap="round"/>`, wow: `<path d="M56 52 Q63 47 70 52 M90 52 Q97 47 104 52" fill="none" stroke="${k}" stroke-width="3.2" stroke-linecap="round"/>` }[mood] || `<path d="M56 56 Q63 52 70 56 M90 56 Q97 52 104 56" fill="none" stroke="${k}" stroke-width="3.2" stroke-linecap="round"/>`;
    let eyes;
    if (mood === "happy") eyes = `<path class="eye" d="M58 69 Q64 62 70 69 M90 69 Q96 62 102 69" fill="none" stroke="${k}" stroke-width="3.2" stroke-linecap="round"/>`;
    else { const px = mood === "think" ? 3 : 0, py = mood === "think" ? -3 : 0, r = mood === "wow" ? 7.5 : 6.5; eyes = `<g class="eye"><ellipse cx="64" cy="68" rx="${r}" ry="${r + .8}" fill="#fff" stroke="${k}" stroke-width="2"/><ellipse cx="96" cy="68" rx="${r}" ry="${r + .8}" fill="#fff" stroke="${k}" stroke-width="2"/><circle cx="${65 + px}" cy="${69 + py}" r="3.6" fill="${k}"/><circle cx="${97 + px}" cy="${69 + py}" r="3.6" fill="${k}"/><circle cx="${66.5 + px}" cy="${67.6 + py}" r="1.2" fill="#fff"/><circle cx="${98.5 + px}" cy="${67.6 + py}" r="1.2" fill="#fff"/></g>`; }
    const mouth = { worry: `<path d="M70 96 Q80 89 90 96" fill="none" stroke="${k}" stroke-width="3" stroke-linecap="round"/>`, angry: `<path d="M68 96 Q80 90 92 96 L92 98 Q80 94 68 98 Z" fill="#7a1d1d" stroke="${k}" stroke-width="2.6" stroke-linejoin="round"/>`, think: `<path d="M72 94 Q80 92 88 90" fill="none" stroke="${k}" stroke-width="3" stroke-linecap="round"/>`, wow: `<ellipse cx="80" cy="94" rx="6" ry="7.5" fill="#7a1d1d" stroke="${k}" stroke-width="2.5"/>`, happy: `<path d="M66 88 Q80 106 94 88 Z" fill="#fff" stroke="${k}" stroke-width="2.8" stroke-linejoin="round"/>` }[mood] || `<path d="M68 89 Q80 100 92 89" fill="none" stroke="${k}" stroke-width="3" stroke-linecap="round"/>`;
    const nose = `<path d="M80 74 Q76 83 81 85" fill="none" stroke="${shade(L.skin, .7)}" stroke-width="2.4" stroke-linecap="round"/>`;
    const blush = `<ellipse cx="57" cy="83" rx="6" ry="3.5" fill="#f87171" opacity=".28"/><ellipse cx="103" cy="83" rx="6" ry="3.5" fill="#f87171" opacity=".28"/>`;
    const glasses = L.glasses ? `<g fill="rgba(255,255,255,.18)" stroke="${k}" stroke-width="2.6"><rect x="53" y="59" width="22" height="18" rx="6"/><rect x="85" y="59" width="22" height="18" rx="6"/><path d="M75 67 H85 M53 66 L46 63 M107 66 L114 63"/></g>` : "";
    const beard = L.beard ? `<path d="M48 82 C50 108 64 120 80 120 C96 120 110 108 112 82 C104 96 94 100 80 100 C66 100 56 96 48 82 Z" fill="${L.hair}" stroke="${k}" stroke-width="2.4"/>` : "";
    const stub = L.stubble ? `<path d="M50 88 C54 106 66 116 80 116 C94 116 106 106 110 88" fill="none" stroke="${shade(L.skin, .72)}" stroke-width="9" opacity=".3"/>` : "";
    const must = L.mustache || L.beard ? `<path d="M66 86 Q73 81 80 85 Q87 81 94 86 Q87 90 80 87 Q73 90 66 86 Z" fill="${L.hair}" stroke="${k}" stroke-width="1.8"/>` : "";
    const bindi = L.bindi ? `<circle cx="80" cy="54" r="2.4" fill="#dc2626"/>` : "";
    const open = `<ellipse class="mo" cx="80" cy="93" rx="6.5" ry="5.5" fill="#7a1d1d" stroke="${k}" stroke-width="2.4"/>`;
    return brow + eyes + nose + blush + stub + beard + `<g class="mouth">${mouth}</g>` + open + must + glasses + bindi;
  }
  function arm(pts, col, skin, hand) {
    const d = "M" + pts.map(p => p.join(",")).join(" L"), h = pts[pts.length - 1];
    const hs = hand === "point" ? `<g transform="translate(${h[0]},${h[1]})"><circle r="8.5" fill="${skin}" stroke="${K}" stroke-width="2.4"/><path d="M2 -6 L9 -20" stroke="${K}" stroke-width="7" stroke-linecap="round"/><path d="M2 -6 L9 -20" stroke="${skin}" stroke-width="3.4" stroke-linecap="round"/></g>`
      : hand === "open" ? `<g transform="translate(${h[0]},${h[1]})"><path d="M-9 4 C-12 -4 -10 -12 -6 -16 M-2 -8 L-3 -20 M3 -8 L4 -21 M7 -6 L10 -17" stroke="${K}" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M-9 4 C-12 -4 -10 -12 -6 -16 M-2 -8 L-3 -20 M3 -8 L4 -21 M7 -6 L10 -17" stroke="${skin}" stroke-width="3.4" stroke-linecap="round" fill="none"/><ellipse rx="10" ry="9" fill="${skin}" stroke="${K}" stroke-width="2.4"/></g>`
      : `<circle cx="${h[0]}" cy="${h[1]}" r="9" fill="${skin}" stroke="${K}" stroke-width="2.4"/>`;
    return `<path d="${d}" fill="none" stroke="${K}" stroke-width="21" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>${hs}`;
  }
  const POSES = {
    idle: { l: [[44, 146], [36, 184], [38, 214]], r: [[116, 146], [124, 184], [122, 214]] },
    point: { l: [[44, 146], [36, 184], [38, 214]], r: [[116, 146], [138, 124], [146, 98]], rh: "point" },
    chin: { l: [[44, 146], [36, 184], [38, 214]], r: [[116, 148], [112, 186], [94, 116]] },
    present: { l: [[44, 146], [36, 184], [38, 214]], r: [[116, 146], [142, 170], [150, 150]], rh: "open" },
    cross: { l: [[44, 148], [62, 186], [112, 176]], r: [[116, 148], [98, 188], [48, 178]] },
    laptop: { l: [[44, 148], [46, 190], [70, 186]], r: [[116, 148], [114, 190], [90, 186]], prop: "laptop" },
    wave: { l: [[44, 146], [36, 184], [38, 214]], r: [[116, 146], [140, 124], [140, 92]], rh: "open" },
    cheer: { l: [[44, 146], [24, 116], [30, 84]], r: [[116, 146], [136, 116], [130, 84]] },
    phone: { l: [[44, 146], [36, 184], [38, 214]], r: [[116, 148], [128, 172], [114, 102]], prop: "phone" },
    facepalm: { l: [[44, 146], [36, 184], [38, 214]], r: [[116, 148], [124, 170], [96, 60]], rh: "open" },
    note: { l: [[44, 148], [50, 188], [74, 180]], r: [[116, 148], [112, 188], [92, 174]], prop: "note" },
    marker: { l: [[44, 146], [36, 184], [38, 214]], r: [[116, 146], [146, 132], [150, 106]], prop: "marker" },
    shrug: { l: [[44, 148], [26, 166], [20, 146]], r: [[116, 148], [134, 166], [140, 146]], lh: "open", rh: "open" }
  };
  function torso(L) {
    const c = L.top, d = shade(c, .82), inner = L.inner || "#ffffff";
    let s = `<path d="M18 214 C20 172 38 146 62 140 L98 140 C122 146 140 172 142 214 Z" fill="${c}" stroke="${K}" stroke-width="2.6"/><path d="M118 152 C130 168 136 190 138 214 L126 214 C124 190 120 170 112 156 Z" fill="#000" opacity=".08"/>`;
    if (L.wear === "blazer") s += `<path d="M66 140 L80 176 L94 140 Z" fill="${inner}" stroke="${K}" stroke-width="2.2"/><path d="M62 140 L80 186 L70 214 M98 140 L80 186 L90 214" fill="none" stroke="${K}" stroke-width="2.2"/><path d="M62 140 L54 158 L68 164 Z M98 140 L106 158 L92 164 Z" fill="${d}" stroke="${K}" stroke-width="2"/><circle cx="80" cy="198" r="2.4" fill="${K}"/>`;
    else if (L.wear === "hoodie") s += `<path d="M54 142 C60 162 100 162 106 142" fill="${d}" stroke="${K}" stroke-width="2.4"/><path d="M74 154 L72 178 M86 154 L88 178" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><path d="M56 194 H104 V214 H56 Z" fill="${d}" stroke="${K}" stroke-width="2"/>`;
    else if (L.wear === "kurta") s += `<path d="M70 140 L70 150 C70 156 90 156 90 150 L90 140" fill="${d}" stroke="${K}" stroke-width="2"/><path d="M80 150 V192" stroke="${K}" stroke-width="2"/><circle cx="80" cy="164" r="1.8" fill="${K}"/><circle cx="80" cy="176" r="1.8" fill="${K}"/>`;
    else if (L.wear === "coat") s += `<path d="M66 140 L80 166 L94 140 Z" fill="${inner}" stroke="${K}" stroke-width="2"/><path d="M80 166 V214" stroke="${K}" stroke-width="2"/><path d="M104 170 h9 v12 h-9 z" fill="#93c5fd" stroke="${K}" stroke-width="1.6"/><path d="M44 150 C52 168 54 190 52 214" fill="none" stroke="#94a3b8" stroke-width="3"/>`;
    else if (L.wear === "tee") s += `<path d="M66 140 Q80 154 94 140" fill="none" stroke="${K}" stroke-width="2.4"/><path d="M70 176 h20 v14 h-20 z" fill="rgba(255,255,255,.35)" stroke="${K}" stroke-width="1.5"/>`;
    else s += `<path d="M64 140 L80 156 L96 140 L90 150 L80 160 L70 150 Z" fill="${inner}" stroke="${K}" stroke-width="2.2"/><path d="M80 160 V214" stroke="${K}" stroke-width="1.6" opacity=".5"/><circle cx="80" cy="176" r="1.6" fill="${K}"/><circle cx="80" cy="192" r="1.6" fill="${K}"/>`;
    if (L.tie) s += `<path d="M80 156 L74 166 L80 198 L86 166 Z" fill="${L.tie === true ? "#b91c1c" : L.tie}" stroke="${K}" stroke-width="2"/>`;
    if (L.lanyard) s += `<path d="M66 142 L76 184 M94 142 L84 184" stroke="${L.lanyard}" stroke-width="3.5"/><rect x="72" y="182" width="16" height="20" rx="2" fill="#fff" stroke="${K}" stroke-width="2"/><rect x="75" y="186" width="10" height="6" fill="${L.lanyard}"/>`;
    return s;
  }
  function prop(kind) {
    if (kind === "laptop") return `<g><path d="M44 178 L116 178 L124 208 L36 208 Z" fill="#cbd5e1" stroke="${K}" stroke-width="2.4"/><rect x="50" y="146" width="60" height="34" rx="3" fill="#334155" stroke="${K}" stroke-width="2.4" transform="rotate(-6 80 162)"/><circle cx="80" cy="162" r="4" fill="#e2e8f0" transform="rotate(-6 80 162)"/></g>`;
    if (kind === "phone") return `<rect x="104" y="74" width="14" height="26" rx="3" fill="#1f2937" stroke="${K}" stroke-width="2"/>`;
    if (kind === "note") return `<g transform="rotate(-8 82 176)"><rect x="64" y="160" width="40" height="44" rx="3" fill="#fff" stroke="${K}" stroke-width="2.4"/><path d="M70 172 h28 M70 180 h24 M70 188 h26" stroke="#94a3b8" stroke-width="2"/><rect x="64" y="160" width="40" height="7" fill="#fbbf24" stroke="${K}" stroke-width="2"/></g>`;
    if (kind === "marker") return `<rect x="147" y="86" width="7" height="22" rx="2" fill="#2563eb" stroke="${K}" stroke-width="2" transform="rotate(20 150 98)"/>`;
    return "";
  }
  function figure(look, mood, pose) {
    const L = Object.assign({ skin: "#E0A982", hair: "#2a1d14", hs: "short", top: "#2563eb", wear: "shirt" }, look || {});
    const Pz = POSES[pose] || POSES.idle; mood = mood || "smile";
    const front = ["chin", "facepalm", "phone"].includes(pose);
    const arms = arm(Pz.l, L.top, L.skin, Pz.lh) + arm(Pz.r, L.top, L.skin, Pz.rh);
    const head = `<rect x="70" y="112" width="20" height="30" rx="7" fill="${shade(L.skin, .88)}" stroke="${K}" stroke-width="2.6"/>
      <ellipse cx="44" cy="74" rx="7" ry="10" fill="${L.skin}" stroke="${K}" stroke-width="2.6"/><ellipse cx="116" cy="74" rx="7" ry="10" fill="${L.skin}" stroke="${K}" stroke-width="2.6"/>
      ${L.earrings ? `<circle cx="44" cy="88" r="3.4" fill="#facc15" stroke="${K}" stroke-width="1.6"/><circle cx="116" cy="88" r="3.4" fill="#facc15" stroke="${K}" stroke-width="1.6"/>` : ""}
      <path d="M44 72 C44 40 60 30 80 30 C100 30 116 40 116 72 C116 102 100 120 80 120 C60 120 44 102 44 72 Z" fill="${L.skin}" stroke="${K}" stroke-width="2.6"/>
      <path d="M100 40 C114 54 116 90 98 114 C108 96 110 66 100 40 Z" fill="#000" opacity=".07"/>`;
    return `<svg viewBox="0 0 160 214" aria-hidden="true"><g class="bd">${torso(L)}${front ? "" : `<g class="arms">${arms}</g>`}<g class="hd">${hairBack(L)}${head}${hairFront(L)}${faceParts(L, mood)}</g>${front ? `<g class="arms">${arms}</g>` : ""}${prop(Pz.prop)}</g></svg>`;
  }

  /* ===================================================== backgrounds ===================================================== */
  const BG = {
    cabin: `<rect width="400" height="260" style="fill:var(--teal-tint,#E6F3FA)"/><rect x="220" y="24" width="150" height="120" rx="4" fill="#cfe8ff" stroke="#1b1b1b" stroke-width="3"/><path d="M220 144 V110 h20 V90 h16 v54 M262 144 V74 h22 v70 M290 144 V98 h18 v46 M314 144 V82 h24 v62 M344 144 V104 h26 v40" style="fill:var(--teal,#0E86C9)" opacity=".25"/><path d="M295 24 V144 M220 84 H370" stroke="#1b1b1b" stroke-width="3"/><rect x="30" y="40" width="70" height="52" rx="3" fill="#fff" stroke="#1b1b1b" stroke-width="3"/><path d="M40 80 l12 -12 l10 6 l14 -18 l14 8" fill="none" style="stroke:var(--teal,#0E86C9)" stroke-width="3"/><rect y="200" width="400" height="60" fill="#8a5a3c" stroke="#1b1b1b" stroke-width="3"/>`,
    meeting: `<rect width="400" height="260" style="fill:var(--paper,#F6F7F5)"/><rect width="400" height="24" style="fill:var(--teal-tint,#E6F3FA)"/><rect x="120" y="30" width="160" height="90" rx="6" fill="#1f2937" stroke="#1b1b1b" stroke-width="3"/><rect x="132" y="42" width="136" height="66" rx="3" fill="#0f172a"/><path d="M142 96 l20 -14 l16 8 l22 -22 l18 10 l22 -18" fill="none" style="stroke:var(--teal,#0E86C9)" stroke-width="3"/><rect x="20" y="40" width="70" height="110" fill="#e5e7eb" stroke="#1b1b1b" stroke-width="3"/><path d="M55 40 V150" stroke="#1b1b1b" stroke-width="2"/><g transform="translate(330 70)"><path d="M10 80 h30 l-5 30 h-20 z" fill="#b45309" stroke="#1b1b1b" stroke-width="2.5"/><path d="M25 80 C10 60 0 40 8 20 M25 80 C30 50 40 30 50 22 M25 80 C24 56 26 36 28 10" fill="none" stroke="#15803d" stroke-width="7" stroke-linecap="round"/></g>`,
    board: `<rect width="400" height="260" style="fill:var(--paper,#F6F7F5)"/><rect x="30" y="18" width="340" height="150" rx="4" fill="#fff" stroke="#1b1b1b" stroke-width="3"/><rect x="30" y="162" width="340" height="8" fill="#9ca3af" stroke="#1b1b1b" stroke-width="2"/><g fill="none" stroke-width="3" stroke-linecap="round"><rect x="56" y="44" width="56" height="34" rx="6" style="stroke:var(--teal,#0E86C9)"/><path d="M114 61 h40" style="stroke:var(--teal,#0E86C9)"/><ellipse cx="184" cy="52" rx="26" ry="8" style="stroke:var(--blue,#2856A3)"/><path d="M158 52 v24 a26 8 0 0 0 52 0 v-24" style="stroke:var(--blue,#2856A3)"/><path d="M212 64 h40" style="stroke:var(--amber,#A15C07)"/><path d="M262 44 l44 0 l-16 20 l0 18 l-12 6 l0 -24 z" style="stroke:var(--amber,#A15C07)"/><path d="M70 120 q40 -20 80 0 t80 0 t80 0" stroke="#ef4444"/></g>`,
    corridor: `<rect width="400" height="260" style="fill:var(--paper,#F6F7F5)"/><rect y="200" width="400" height="60" fill="#d6d3d1" stroke="#1b1b1b" stroke-width="3"/><g stroke="#1b1b1b" stroke-width="3"><rect x="20" y="20" width="110" height="180" style="fill:var(--teal-tint,#E6F3FA)"/><rect x="150" y="20" width="110" height="180" style="fill:var(--teal-tint,#E6F3FA)"/><rect x="290" y="40" width="80" height="160" fill="#a16207"/></g><circle cx="356" cy="122" r="4" fill="#fde68a" stroke="#1b1b1b" stroke-width="2"/><path d="M40 40 l30 60 M170 40 l30 60" stroke="#fff" stroke-width="6" opacity=".7"/>`,
    night: `<rect width="400" height="260" fill="#1e293b"/><rect x="240" y="20" width="140" height="110" rx="4" fill="#0f172a" stroke="#000" stroke-width="3"/><circle cx="340" cy="52" r="14" fill="#fef3c7"/><g fill="#fde68a" opacity=".6"><rect x="252" y="96" width="6" height="8"/><rect x="270" y="86" width="6" height="8"/><rect x="300" y="100" width="6" height="8"/></g><path d="M40 0 L90 0 L120 200 L10 200 Z" fill="#fde68a" opacity=".08"/><rect y="200" width="400" height="60" fill="#334155" stroke="#000" stroke-width="3"/>`,
    burst: `<rect width="400" height="260" style="fill:var(--amber-tint,#FBF0DD)"/><g style="fill:var(--amber,#A15C07)" opacity=".18">${Array.from({ length: 18 }, (_, i) => { const a = i / 18 * Math.PI * 2, b = a + Math.PI / 18; return `<path d="M200 130 L${(200 + 400 * Math.cos(a)).toFixed(1)} ${(130 + 400 * Math.sin(a)).toFixed(1)} L${(200 + 400 * Math.cos(b)).toFixed(1)} ${(130 + 400 * Math.sin(b)).toFixed(1)} Z"/>`; }).join("")}</g>`,
    plain: `<rect width="400" height="260" fill="#fff"/>`,
    desk: `<rect width="400" height="260" style="fill:var(--blue-tint,#E9F0FA)"/><rect x="40" y="40" width="120" height="80" rx="4" fill="#fff" stroke="#1b1b1b" stroke-width="3"/><path d="M52 104 v-30 M72 104 v-44 M92 104 v-22 M112 104 v-36 M132 104 v-50" style="stroke:var(--teal,#0E86C9)" stroke-width="9"/><rect x="250" y="34" width="110" height="74" rx="3" fill="#fde68a" stroke="#1b1b1b" stroke-width="3" transform="rotate(4 305 70)"/><rect y="200" width="400" height="60" fill="#8a5a3c" stroke="#1b1b1b" stroke-width="3"/>`
  };
  const TABLE = `<svg class="kp-front" viewBox="0 0 400 42" preserveAspectRatio="none" aria-hidden="true"><path d="M-10 42 L-10 14 Q200 -6 410 14 L410 42 Z" fill="#7c4a2d" stroke="#1b1b1b" stroke-width="3"/><path d="M-10 18 Q200 0 410 18" fill="none" stroke="#a46a44" stroke-width="5"/><rect x="60" y="12" width="26" height="14" rx="2" fill="#fff" stroke="#1b1b1b" stroke-width="2"/><rect x="300" y="10" width="34" height="18" rx="2" fill="#cbd5e1" stroke="#1b1b1b" stroke-width="2"/><circle cx="200" cy="18" r="7" fill="#fff" stroke="#1b1b1b" stroke-width="2"/></svg>`;

  /* ===================================================== architecture ===================================================== */
  const ST = { src: ["--s-src", "--t-src"], ing: ["--s-ing", "--t-ing"], stg: ["--s-stg", "--t-stg"], trf: ["--s-trf", "--t-trf"], mart: ["--s-mart", "--t-mart"] };
  const BRAND = { xl: ["#16a34a", "#dcfce7"], tb: ["#e8762c", "#fde8d8"], pbi: ["#c99a06", "#fef3c7"], ai: ["#7c3aed", "#ede9fe"] };
  const sty = (k) => ST[k] ? `--c:var(${ST[k][0]});--t:var(${ST[k][1]})` : `--c:${BRAND[k][0]};--t:${BRAND[k][1]}`;
  const IC = {
    app: `<rect x="1" y="3" width="22" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M1 8h22" stroke="currentColor" stroke-width="2"/><circle cx="4.5" cy="5.5" r=".9" fill="currentColor"/><circle cx="7.5" cy="5.5" r=".9" fill="currentColor"/>`,
    gear: `<g fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3.6"/><path d="M12 2v3.5M12 18.5V22M2 12h3.5M18.5 12H22M4.9 4.9l2.5 2.5M16.6 16.6l2.5 2.5M4.9 19.1l2.5-2.5M16.6 7.4l2.5-2.5"/></g>`,
    db: `<g fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3.4"/><path d="M3 5v14c0 1.9 4 3.4 9 3.4s9-1.5 9-3.4V5"/><path d="M3 12c0 1.9 4 3.4 9 3.4s9-1.5 9-3.4"/></g>`,
    funnel: `<path d="M3 4h18l-7 8.5V19l-4 2v-8.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>`,
    star: `<g fill="none" stroke="currentColor" stroke-width="2"><rect x="8.5" y="8.5" width="7" height="7" rx="1.5"/><rect x="1" y="1" width="5.5" height="5.5" rx="1"/><rect x="17.5" y="1" width="5.5" height="5.5" rx="1"/><rect x="1" y="17.5" width="5.5" height="5.5" rx="1"/><rect x="17.5" y="17.5" width="5.5" height="5.5" rx="1"/><path d="M6.5 6.5l2 2M17.5 6.5l-2 2M6.5 17.5l2-2M17.5 17.5l-2-2"/></g>`,
    xl: `<rect x="1" y="1" width="22" height="22" rx="5" fill="currentColor"/><path d="M7 7l10 10M17 7L7 17" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>`,
    tb: `<g stroke-linecap="round" stroke-width="2.3"><path d="M12 3v18M3 12h18" stroke="#e8762c"/><path d="M5.5 6v4M3.5 8h4M18.5 6v4M16.5 8h4M5.5 14v4M3.5 16h4M18.5 14v4M16.5 16h4" stroke="#1f6feb"/></g>`,
    pbi: `<rect x="2" y="11" width="5" height="11" rx="1.5" fill="#f2c811"/><rect x="9.5" y="6" width="5" height="16" rx="1.5" fill="#e3ad0c"/><rect x="17" y="1" width="5" height="21" rx="1.5" fill="#c99a06"/>`,
    ai: `<g fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="7" width="18" height="14" rx="4"/><path d="M12 7V3.5"/></g><circle cx="12" cy="3" r="1.7" fill="currentColor"/><circle cx="9" cy="14" r="1.8" fill="currentColor"/><circle cx="15" cy="14" r="1.8" fill="currentColor"/>`
  };
  function wrapTxt(t, max) { const w = String(t).split(" "); const out = []; let cur = ""; w.forEach(x => { if ((cur + " " + x).trim().length > max) { if (cur) out.push(cur); cur = x; } else cur = (cur + " " + x).trim(); }); if (cur) out.push(cur); return out; }
  function archLayout(A, vertical) {
    const N = [], lanes = [];
    const outs = [["xl", "Excel", "week-1 analysis"], ["tb", "Tableau", "interactive dashboards"], ["pbi", "Power BI", "data model + DAX report"], ["ai", "AI / Insights", "Dexa · questions & answers"]];
    if (!vertical) {
      const W = 1280, H = 452, top = 34, cw = 176, xs = [12, 224, 436, 648, 860, 1080];
      ["SOURCES", "INGEST", "STORE", "TRANSFORM", "MODEL", "CONSUME"].forEach((t, i) => lanes.push({ x: xs[i] - 6, y: 0, w: i === 5 ? 196 : cw + 12, h: H, t }));
      A.sources.forEach((s, i) => { const n = A.sources.length, h = 92, gap = (H - top - 10 - n * h) / (n + 1); N.push({ id: "s" + i, x: xs[0], y: top + gap + i * (h + gap), w: cw, h, st: sty("src"), kind: "SOURCE", t: s[0], s: s[1], ic: "app" }); });
      const mid = top + (H - top) / 2;
      N.push({ id: "ing", x: xs[1], y: mid - 60, w: cw, h: 120, st: sty("ing"), kind: "EXTRACT", t: A.ingest[0], s: A.ingest[1], ic: "gear" });
      N.push({ id: "stg", x: xs[2], y: mid - 60, w: cw, h: 120, st: sty("stg"), kind: "LOAD", t: A.staging[0], s: A.staging[1], ic: "db" });
      N.push({ id: "trf", x: xs[3], y: mid - 60, w: cw, h: 120, st: sty("trf"), kind: "TRANSFORM", t: A.transform[0], s: A.transform[1], ic: "funnel" });
      N.push({ id: "mart", x: xs[4], y: mid - 76, w: cw, h: 152, st: sty("mart"), kind: "MODEL", t: A.mart[0], s: A.mart[1], ic: "star" });
      outs.forEach((o, i) => N.push({ id: o[0], x: xs[5], y: top + 6 + i * 102, w: 184, h: 88, st: sty(o[0]), kind: "SERVE", t: o[1], s: o[2], ic: o[0] }));
      return { W, H, N, lanes };
    }
    const W = 420, x0 = 14, cw = 392; let y = 10; const ns = A.sources.length, sw = (cw - (ns - 1) * 8) / ns;
    A.sources.forEach((s, i) => N.push({ id: "s" + i, x: x0 + i * (sw + 8), y, w: sw, h: 96, st: sty("src"), kind: "SOURCE", t: s[0], s: s[1], ic: "app", small: true }));
    y += 96 + 40;
    [["ing", "EXTRACT", A.ingest, "gear"], ["stg", "LOAD", A.staging, "db"], ["trf", "TRANSFORM", A.transform, "funnel"], ["mart", "MODEL", A.mart, "star"]].forEach(r => { N.push({ id: r[0], x: x0 + 30, y, w: cw - 60, h: 82, st: sty(r[0]), kind: r[1], t: r[2][0], s: r[2][1], ic: r[3], row: true }); y += 82 + 38; });
    const ow = (cw - 8) / 2;
    outs.forEach((o, i) => N.push({ id: o[0], x: x0 + (i % 2) * (ow + 8), y: y + Math.floor(i / 2) * 80, w: ow, h: 72, st: sty(o[0]), kind: "SERVE", t: o[1], s: o[2], ic: o[0], row: true }));
    return { W, H: y + 160 + 8, N, lanes };
  }
  function archSvg(A, vertical) {
    const { W, H, N, lanes } = archLayout(A, vertical); const by = Object.fromEntries(N.map(n => [n.id, n]));
    const R = (n) => [n.x + n.w, n.y + n.h / 2], Lf = (n) => [n.x, n.y + n.h / 2], B = (n) => [n.x + n.w / 2, n.y + n.h], T = (n) => [n.x + n.w / 2, n.y];
    const curve = (a, b) => vertical ? `M${a[0]},${a[1]} C${a[0]},${(a[1] + b[1]) / 2} ${b[0]},${(a[1] + b[1]) / 2} ${b[0]},${b[1]}` : `M${a[0]},${a[1]} C${(a[0] + b[0]) / 2},${a[1]} ${(a[0] + b[0]) / 2},${b[1]} ${b[0]},${b[1]}`;
    const P = [];
    const link = (f, t) => { const a = vertical ? B(by[f]) : R(by[f]), b = vertical ? T(by[t]) : Lf(by[t]); P.push({ id: f + "-" + t, d: curve(a, b), st: ["xl", "tb", "pbi", "ai"].includes(t) ? by[t].st : by[f].st }); };
    A.sources.forEach((s, i) => link("s" + i, "ing"));
    link("ing", "stg"); link("stg", "trf"); link("trf", "mart");
    ["xl", "tb", "pbi", "ai"].forEach(o => link("mart", o));
    const node = (n) => {
      const pad = n.small ? 9 : 13, tile = n.small ? 26 : 32;
      const row = n.row;   // vertical layout: icon left, text right
      const tx = row ? n.x + pad + tile + 10 : n.x + pad, avail = row ? n.w - pad * 2 - tile - 10 : n.w - pad * 2;
      const tl = wrapTxt(n.t, Math.max(8, Math.floor(avail / 7.4))).slice(0, 2);
      const sub = wrapTxt(n.s, Math.max(10, Math.floor(avail / 6.1))).slice(0, row ? 2 : (n.small ? (tl.length > 1 ? 1 : 2) : (n.h > 100 ? 3 : 2)));
      const ty = row ? n.y + pad + 26 : n.y + pad + tile + 18;
      return `<g class="nd" id="nd-${n.id}" style="${n.st}"><rect class="bg" x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="12"/>
        <rect class="tile" x="${n.x + pad}" y="${n.y + pad}" width="${tile}" height="${tile}" rx="8"/>
        <g class="ic" transform="translate(${n.x + pad + (tile - 24) / 2},${n.y + pad + (tile - 24) / 2})">${IC[n.ic] || ""}</g>
        <text class="k" x="${row ? tx : n.x + pad + tile + 8}" y="${row ? n.y + pad + 10 : n.y + pad + tile / 2 + 3}">${esc(n.kind)}</text>
        <circle class="dot" cx="${n.x + n.w - 12}" cy="${n.y + 12}" r="4"/>
        ${tl.map((t, i) => `<text class="t" x="${tx}" y="${ty + i * 14}">${esc(t)}</text>`).join("")}
        ${sub.map((l, i) => `<text class="s" x="${tx}" y="${ty + tl.length * 14 + 1 + i * 13}">${esc(l)}</text>`).join("")}</g>`;
    };
    const lanesSvg = vertical ? "" : lanes.map(l => `<rect class="lane" x="${l.x}" y="${l.y}" width="${l.w}" height="${l.h}" rx="12"/><text class="lane-h" x="${l.x + 12}" y="${l.y + 21}">${l.t}</text>`).join("");
    return { svg: `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Animated data architecture: ${esc(A.sources.map(s => s[0]).join(", "))} → ${esc(A.ingest[0])} → ${esc(A.staging[0])} → ${esc(A.transform[0])} → ${esc(A.mart[0])} → Excel, Tableau, Power BI and AI insights">
      ${lanesSvg}${P.map(p => `<path class="pth" id="ap-${p.id}" d="${p.d}"/><path class="pth2" style="${p.st}" d="${p.d}"/>`).join("")}
      ${N.map(node).join("")}<g id="pk-layer"></g></svg>`, P };
  }
  function renderArch(host, A, opts) {
    opts = opts || {}; if (!host || !A) return;
    if (host._archStop) host._archStop();
    host.innerHTML = `<div class="arch2"><div class="arch2-top"><div class="arch2-title"><span class="lg">⚡</span><div><b>${esc(A.title || "Data architecture")}</b><small>How data travels from the source systems to your dashboards</small></div></div>
      <div class="arch2-steps">${["Extract", "Load", "Transform", "Model", "Serve"].map((s, i) => `<span data-st="${i}"><i>${i + 1}</i>${s}</span>`).join("")}</div>
      <span class="arch2-live"><i></i>Live pipeline</span></div><div class="arch2-svg"></div>
      <div class="arch2-feed" aria-live="off"></div>
      ${opts.caption === false ? "" : `<p class="arch2-cap">${A.caption || ""}</p>`}</div>`;
    const box = host.querySelector(".arch2-svg"), feed = host.querySelector(".arch2-feed"), steps = host.querySelectorAll(".arch2-steps span");
    let vertical = null, paths = {}, raf = 0, visible = true, packets = [], last = 0, spawnT = 0, logT = 0, li = 0;
    const draw = () => {
      const v = host.clientWidth < 660; if (v === vertical) return; vertical = v;
      const r = archSvg(A, v); box.innerHTML = r.svg; paths = {};
      r.P.forEach(p => { const el = box.querySelector("#ap-" + window.CSS.escape(p.id)); if (el) paths[p.id] = { el, len: el.getTotalLength(), st: p.st }; });
      packets = [];
    };
    draw();
    const logs = A.logs || [];
    const SC = { EXTRACT: "ing", LOAD: "stg", TRANSFORM: "trf", CHECK: "trf", MODEL: "mart", SERVE: "pbi" };
    const stamp = () => { const d = new Date(); return [d.getHours(), d.getMinutes(), d.getSeconds()].map(x => String(x).padStart(2, "0")).join(":"); };
    const pushLog = () => {
      if (!logs.length) return; const [stg, msg] = logs[li++ % logs.length];
      const div = document.createElement("div"); div.innerHTML = `<span class="tm">${stamp()}</span><span class="bd" style="${sty(SC[stg] || "ing")}">${esc(stg)}</span><span class="mg">${esc(msg)}</span>`;
      feed.appendChild(div); while (feed.children.length > 4) feed.removeChild(feed.firstChild);
      const si = { EXTRACT: 0, LOAD: 1, TRANSFORM: 2, CHECK: 2, MODEL: 3, SERVE: 4 }[stg]; steps.forEach((s, i) => s.classList.toggle("on", i === si));
    };
    for (let i = 0; i < 4; i++) pushLog();
    const chain = () => { const s = "s" + Math.floor(Math.random() * A.sources.length), o = ["xl", "tb", "pbi", "ai"][Math.floor(Math.random() * 4)]; return [s + "-ing", "ing-stg", "stg-trf", "trf-mart", "mart-" + o]; };
    const LBL = A.packet || ["row", "row", "clean", "fact", "KPI"];
    function setPk(p) {
      const Pp = paths[p.chain[p.seg]]; if (!Pp) return false;
      const lbl = [LBL[0], LBL[1] || LBL[0], LBL[2] || "clean", LBL[3] || "fact", LBL[4] || "KPI"][p.seg];
      const w = Math.max(30, lbl.length * 6.3 + 14);
      p.g.setAttribute("style", Pp.st);
      p.g.innerHTML = `<rect x="${-w / 2}" y="-8.5" width="${w}" height="17" rx="8.5"/><text x="0" y="3.6" text-anchor="middle">${esc(lbl)}</text>`;
      p.P = Pp; return true;
    }
    function hit(id) { const n = box.querySelector("#nd-" + id); if (!n) return; n.classList.add("hit"); clearTimeout(n._t); n._t = setTimeout(() => n.classList.remove("hit"), 480); }
    function frame(ts) {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden) { last = ts; return; }
      const dt = Math.min(0.05, (ts - (last || ts)) / 1000); last = ts;
      spawnT -= dt; logT -= dt;
      if (spawnT <= 0 && packets.length < (vertical ? 4 : 7)) { const layer = box.querySelector("#pk-layer"); if (layer) { const g = document.createElementNS("http://www.w3.org/2000/svg", "g"); g.setAttribute("class", "pk"); layer.appendChild(g); packets.push({ g, chain: chain(), seg: 0, t: 0, speed: 0.55 + Math.random() * 0.25 }); } spawnT = 0.75 + Math.random() * 0.6; }
      if (logT <= 0) { pushLog(); logT = 2; }
      packets = packets.filter(p => {
        if (!p.P && !setPk(p)) { p.g.remove(); return false; }
        p.t += dt * p.speed * (vertical ? 250 : 320) / p.P.len;
        if (p.t >= 1) { hit(p.chain[p.seg].split("-")[1]); p.seg++; p.t = 0; p.P = null; if (p.seg >= p.chain.length || !setPk(p)) { p.g.remove(); return false; } }
        const pt = p.P.el.getPointAtLength(p.t * p.P.len); p.g.setAttribute("transform", `translate(${pt.x.toFixed(1)},${pt.y.toFixed(1)})`);
        return true;
      });
    }
    let io = null;
    if (!RM()) { raf = requestAnimationFrame(frame); if ("IntersectionObserver" in window) { io = new IntersectionObserver(es => es.forEach(e => { visible = e.isIntersecting; }), { threshold: 0.05 }); io.observe(host); } }
    const onR = () => { clearTimeout(host._rt); host._rt = setTimeout(draw, 150); }; window.addEventListener("resize", onR);
    host._archStop = () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onR); if (io) io.disconnect(); };
  }

  /* ===================================================== comic engine ===================================================== */
  // panel: {w (2|3|4|6 of 6), bg, cap, sfx, note, table, cast:[[who, x%, mood, pose, flip]], say:[[who|'narr', html, kind]]}  ·  info panel: {w, info: html, cap, note}
  function panelHtml(pn, P, i) {
    const cls = `kp ${pn.w && pn.w < 6 ? "w" + pn.w : ""}`;
    if (pn.info != null) return `<div class="${cls}" data-p="${i}" style="background:${pn.bgc || "#fff"}">${pn.cap ? `<div class="kp-cap">${pn.cap}</div>` : ""}<div class="kp-info">${pn.info}</div>${pn.note ? `<div class="kp-note">${pn.note}</div>` : ""}</div>`;
    const xs = {}; (pn.cast || []).forEach(c => { xs[c[0]] = c[1]; });
    const talk = (pn.say || []).map((s, k) => {
      const who = s[0], x = xs[who], kind = s[2] || "";
      const al = who === "narr" ? "ac" : x == null ? "al" : x < 38 ? "al" : x > 62 ? "ar" : "ac";
      const nm = who === "narr" ? "" : (P[who] ? P[who].short : who);
      const tx = who !== "narr" && x != null && al === "al" ? `--tx:${Math.max(16, Math.min(80, x * 2.4))}px;` : "";
      return `<div class="kb ${al} ${who === "narr" ? "narr" : kind}" data-who="${esc(who)}" style="${tx}">${nm ? `<span class="who">${esc(nm)}</span>` : ""}${s[1]}</div>`;
    }).join("");
    const cast = (pn.cast || []).map((c, k) => { const p = P[c[0]]; if (!p) return ""; return `<div class="ch ${c[4] ? "flip" : ""}" data-who="${esc(c[0])}" style="left:${c[1]}%;--ed:${(k * 0.12).toFixed(2)}s">${figure(p.look, c[2], c[3])}<span class="tag">${esc(p.short)}</span></div>`; }).join("");
    return `<div class="${cls}" data-p="${i}"><svg class="kp-bg" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${BG[pn.bg || "plain"] || BG.plain}</svg>
      ${pn.cap ? `<div class="kp-cap">${pn.cap}</div>` : ""}${pn.sfx ? `<div class="kp-sfx">${esc(pn.sfx)}</div>` : ""}
      <div class="kp-talk">${talk}</div><div class="kp-cast ${pn.table ? "tbl" : ""}">${cast}${pn.table ? TABLE : ""}</div>${pn.note ? `<div class="kp-note">${pn.note}</div>` : ""}</div>`;
  }
  function people(D) {
    const yn = (() => { try { const p = window.VK_AUTH && window.VK_AUTH.profile && window.VK_AUTH.profile(); if (p && p.name) return String(p.name).split(" ")[0]; } catch (e) {} return ""; })();
    const mk = (o) => Object.assign({ side: "Client" }, o, { short: o.name.replace(/^Dr\.\s*/, "Dr. ").split(" ").slice(0, o.name.startsWith("Dr.") ? 2 : 1).join(" ") });
    return {
      sp: mk(D.sponsor), us: mk(D.user), ow: mk(D.owner),
      lead: { g: "m", name: "Mahendra Singh", short: "Mahendra", role: "BI Lead · your trainer", side: "BI team", cares: "Solving the right problem, quality, weekly demos.", look: { skin: "#D29A72", hair: "#17110d", hs: "side", top: "#1e3a8a", wear: "blazer", inner: "#e0f2fe", glasses: true, beard: true } },
      pm: { g: "f", name: "Riya Kapoor", short: "Riya", role: "Project Manager", side: "BI team", cares: "Timeline, owners, risks and status updates.", look: { skin: "#E8B58F", hair: "#2b1810", hs: "bun", top: "#9f1239", wear: "blazer", inner: "#fff", earrings: true, lanyard: "#0E86C9" } },
      ba: { g: "m", name: "Arjun Mehta", short: "Arjun", role: "Business Analyst", side: "BI team", cares: "Requirements, user stories, KPI definitions.", look: { skin: "#C98B62", hair: "#1a1a1a", hs: "short", top: "#f1f5f9", wear: "shirt", inner: "#fff", tie: "#1d4ed8", stubble: true } },
      de: { g: "f", name: "Neha Iyer", short: "Neha", role: "Data Engineer", side: "BI team", cares: "Pipelines, data quality, refresh on time.", look: { skin: "#DFA67F", hair: "#2a1a10", hs: "long", top: "#6d28d9", wear: "hoodie", earrings: true } },
      qa: { g: "m", name: "Kabir Sheikh", short: "Kabir", role: "QA / Test Analyst", side: "BI team", cares: "Every number on a dashboard must match SQL.", look: { skin: "#B97B54", hair: "#121212", hs: "spiky", top: "#15803d", wear: "tee", glasses: true } },
      you: { name: yn ? yn + " (you)" : "You", short: yn || "You", role: "Data Analyst / BI Developer", side: "BI team", cares: "SQL, KPIs, Excel, Tableau, Power BI, the story.", look: { skin: "#C68A63", hair: "#1c120c", hs: "curly", top: "#0f766e", wear: "hoodie" } }
    };
  }
  function pages(D) {
    const P = people(D), sp = P.sp.short, out = [];
    const card = (cls, tag, h, p, extra) => `<div class="kc ${cls}"><span class="tg">${tag}</span><h5>${esc(h)}</h5>${p ? `<p>${esc(p)}</p>` : ""}${extra || ""}</div>`;
    const firstLine = D.painIntro.replace(/<[^>]+>/g, "").split(/(?<=[.!?])\s/)[0];
    const qWho = (q) => q[3] === "ow" ? "ow" : q[3] === "us" ? "us" : "sp";
    // 1 — cold open
    out.push({ t: "The problem lands", panels: [
      { w: 3, bg: "cabin", cap: esc(D.when.split("·")[0].trim()) + " · " + esc(D.sponsor.role), sfx: "PING!", cast: [["sp", 34, "worry", "facepalm"]], say: [["sp", D.incident, "shout"]] },
      { w: 3, bg: "burst", cap: "Two minutes later", sfx: "RING!", cast: [["sp", 26, "angry", "phone"], ["lead", 76, "smile", "phone", true]], say: [["sp", `Mahendra, I need your team. ${esc(firstLine)}`], ["lead", `Understood. Before anyone builds anything, let's run a proper <b>kick-off</b>. Tomorrow, 10 AM?`]] },
      { w: 6, bg: "desk", cap: "BI team office · that evening", cast: [["lead", 14, "smile", "present"], ["pm", 38, "smile", "note"], ["ba", 60, "smile", "idle"], ["you", 86, "wow", "idle", true]], say: [["lead", `New client: <b>${esc(D.company)}</b>. Riya, book the room. Arjun, prepare discovery questions.`], ["pm", "Agenda and invite are going out now. 📅"], ["you", "Wait… I'm joining a REAL client kick-off? 😮"]] }] });
    // 2 — what is a kick-off
    out.push({ t: "What is a kick-off?", panels: [
      { w: 6, bg: "corridor", cap: "Next morning · 9:50 AM · outside the meeting room", cast: [["you", 22, "think", "chin"], ["lead", 74, "smile", "present", true]], say: [["you", `Sir, honestly… what <i>is</i> a kick-off? Just introductions?`], ["lead", `It's the <b>first official meeting</b> of a project. Client and BI team agree the <b>goal, scope, KPIs, data, timeline and owners</b> before anyone writes SQL or drags a chart.`], ["lead", `Get this wrong and you build a beautiful dashboard <b>nobody uses</b>.`, "shout"]] },
      { w: 6, info: `<div class="kg kg3">${[["1. Introductions", "Who's who, who decides, who owns the data", "#fff59d", -2], ["2. Business goal", "The pain, and the decision the dashboard must support", "#bae6fd", 2], ["3. Scope & users", "What's in, what's out, who uses it and how often", "#fbcfe8", -1], ["4. KPI definitions", "Exact formula for every number, in writing", "#bbf7d0", 2], ["5. Data & access", "Source systems, quality, refresh, privacy", "#fed7aa", -2], ["6. Plan & next steps", "Milestones, owners, risks, action items", "#ddd6fe", 1]].map(n => `<div class="kn" style="--r:${n[3]}deg;background:${n[2]}"><b>${n[0]}</b>${n[1]}</div>`).join("")}</div>`, cap: "Riya's agenda, stuck on the meeting-room door", note: "💡 Your job today: listen for pain, ask sharp questions, write the minutes." }] });
    // 3 — the room
    const roster = ["sp", "us", "ow", "lead", "pm", "ba", "de", "qa", "you"].map(k => { const p = P[k]; return `<div class="kc">${figure(p.look, k === "sp" ? "worry" : "smile", "idle")}<span class="sd ${p.side === "Client" ? "cl" : ""}">${p.side === "Client" ? "CLIENT · " + esc(D.company) : "BI TEAM"}</span><div class="nm">${esc(p.name)}</div><div class="rl">${esc(p.role)}</div><p>${esc(p.cares)}</p></div>`; }).join("");
    out.push({ t: "Who's in the room", panels: [
      { w: 6, bg: "meeting", table: true, cap: "10:00 AM · " + esc(D.company) + " · meeting room", cast: [["sp", 9, "worry", "cross"], ["us", 25, "smile", "idle"], ["ow", 41, "think", "laptop"], ["lead", 59, "smile", "present", true], ["ba", 75, "smile", "note", true], ["you", 91, "wow", "idle", true]], say: [["lead", `Thanks for having us. Quick introductions, then <b>${esc(sp)}</b> tells us what hurts.`], ["sp", "Let's do it. I want this sorted this quarter."]] },
      { w: 6, info: `<div class="kroster">${roster}</div>`, cap: "The cast · client side + BI team", note: "💡 In every real project, write down who SIGNS OFF (the sponsor) and who OWNS THE DATA." }] });
    // 4 — the pain
    out.push({ t: "Here's what's hurting us", panels: [
      { w: 4, bg: "meeting", table: true, cap: "10:05 AM · the sponsor opens", cast: [["sp", 22, "angry", "point"], ["us", 76, "worry", "cross", true]], say: [["sp", D.painIntro, "shout"], ["us", D.userPain]] },
      { w: 2, bg: "corridor", cap: "In your head", cast: [["you", 50, "think", "chin"]], say: [["you", `So the real problem isn't "we need a dashboard"… it's <b>${esc(D.realProblem)}</b>.`, "think"]] },
      { w: 6, info: `<div class="kg kg3">${D.pains.map((p, i) => card("pain", "Pain " + (i + 1), p[0], p[1])).join("")}</div>`, cap: "Arjun writes the pain points on the board" }] });
    // 5 — discovery
    out.push({ t: "Ask before you build", panels: [
      { w: 6, bg: "meeting", table: true, cap: "10:20 AM · discovery questions", cast: [["ba", 14, "smile", "note"], ["you", 38, "smile", "point"], [qWho(D.qa[0]), 80, "think", "idle", true]], say: [["ba", "Let's turn the pain into requirements. Go ahead, ask."], ["you", `${esc(D.qa[0][0])}<span class="why">Why ask: ${esc(D.qa[0][2])}</span>`], [qWho(D.qa[0]), esc(D.qa[0][1])]] },
      ...D.qa.slice(1).map(q => ({ w: 3, bg: "meeting", table: true, cast: [["you", 26, "think", "idle"], [qWho(q), 74, qWho(q) === "ow" ? "think" : "smile", qWho(q) === "ow" ? "laptop" : "present", true]], say: [["you", `${esc(q[0])}<span class="why">Why ask: ${esc(q[2])}</span>`], [qWho(q), esc(q[1])]] }))] });
    // 6 — conflict
    const C = D.conflict;
    out.push({ t: "Wait… whose number is right?", panels: [
      { w: 6, bg: "burst", table: true, cap: "10:35 AM · the argument", sfx: "WAIT!", cast: [["us", 18, "angry", "point"], ["sp", 50, "angry", "cross"], ["ow", 82, "worry", "shrug", true]], say: [["us", `For <b>${esc(C.kpi)}</b>, we always ${esc(C.a)}.`, "shout"], ["sp", `No! ${esc(C.b)}.`, "shout"], ["ow", "…and the source system can give you both. 😬"]] },
      { w: 3, bg: "meeting", table: true, cap: "The BI team steps in", cast: [["ba", 26, "smile", "present"], ["you", 76, "smile", "note", true]], say: [["ba", "Both are valid questions. They just need <b>different names</b>."], ["you", "Can we write both definitions down and agree which one is the <b>official</b> KPI?"]] },
      { w: 3, info: `${card("ok", "Decision · logged in the KPI document", C.kpi, C.fix)}<div class="kc"><span class="tg">Lesson</span><p>Most dashboard fights are really <b>definition</b> fights. Settle them at kick-off, in writing, approved by the sponsor.</p></div>`, cap: "Conflict resolved" }] });
    // 7 — data reality
    out.push({ t: "Where does the data live?", panels: [
      { w: 3, bg: "meeting", table: true, cap: "10:45 AM · data reality check", cast: [["ow", 28, "think", "laptop"], ["de", 76, "worry", "laptop", true]], say: [["ow", D.dataIntro], ["de", "I profiled a sample export last night. You need to see this before we promise any numbers."]] },
      { w: 3, info: `<div class="kg kg1">${D.arch.sources.map(s => card("", "Source system", s[0], s[1])).join("")}</div>`, cap: "Source systems" },
      { w: 4, info: `<div class="kg kg3">${D.issues.map(x => card("warn", "⚠ Data issue", x[0], x[1])).join("")}</div>`, cap: "What Neha found" },
      { w: 2, bg: "desk", cast: [["qa", 50, "smile", "note"]], say: [["qa", "I'll write <b>test cases</b>: every dashboard number must match SQL. ✔"]] }] });
    // 8 — architecture
    out.push({ t: "How the data will flow", arch: true, panels: [
      { w: 6, bg: "board", cap: "11:00 AM · Neha grabs the marker", cast: [["de", 16, "happy", "marker"], ["you", 84, "wow", "idle", true]], say: [["de", D.archTalk], ["you", "So the dashboards never touch the raw systems directly?"], ["de", "Never. <b>One governed model</b>, and every tool reads from it."]] },
      { w: 6, info: `<div class="ko-arch"></div>`, cap: "The architecture (live)" }] });
    // 9 — KPIs
    out.push({ t: "Agree the KPIs, in writing", panels: [
      { w: 6, info: `<div class="kg kg${Math.min(4, D.kpis.length)}">${D.kpis.map((k, i) => card("ok", "KPI " + (i + 1), k[0], k[2], `<code>${esc(k[1])}</code>`)).join("")}</div>`, cap: "11:20 AM · the KPI board" },
      { w: 6, bg: "meeting", table: true, cast: [["sp", 18, "think", "chin"], ["qa", 50, "smile", "note"], ["lead", 82, "happy", "present", true]], say: [["sp", `So Excel, Tableau and Power BI will all show the <b>same</b> ${esc(D.kpiPain)}?`], ["lead", "Yes. These definitions go into the <b>KPI document</b>, and Kabir checks every number against SQL."], ["qa", "If a number doesn't match SQL, it doesn't ship. 🔒"]] }] });
    // 10 — plan
    const STG = [["Kick-off", "Week 0", "🚀"], ["Excel", "Week 1", "🧮"], ["Tableau", "Week 2", "📊"], ["Power BI", "Week 3", "📈"], ["Final", "Week 4", "🏆"]];
    out.push({ t: "The plan", panels: [
      { w: 6, bg: "board", cap: "11:40 AM · Riya takes the stage", cast: [["pm", 16, "smile", "marker"], ["sp", 84, "smile", "idle", true]], say: [["pm", `We demo <b>every week</b>, so ${esc(sp)} can steer early instead of being surprised at the end.`], ["sp", "Good. No big-bang reveal on the last day."]] },
      { w: 6, info: `<div class="ktime">${STG.map((s, i) => `<div><span class="dt">${s[2]}</span><h6>${s[0]}</h6><div class="wk">${s[1]}</div><p>${esc(D.plan[i])}</p></div>`).join("")}</div>`, cap: "Milestones", note: "🎯 This is your capstone: these are the group presentations on the Project Schedule." },
      { w: 3, info: card("", "Owners", "Who does what", "", `<p>✅ <b>${esc(D.sponsor.name)}</b>: approves scope, signs off each milestone<br>✅ <b>${esc(D.owner.name)}</b>: data access within 1 day<br>✅ <b>${esc(D.user.name)}</b>: tests the dashboard as a real user<br>✅ <b>Riya</b>: plan & status · <b>Arjun</b>: requirements<br>✅ <b>Neha</b>: pipeline · <b>Kabir</b>: QA against SQL<br>✅ <b>${esc(P.you.short)}</b>: KPIs, Excel, Tableau, Power BI, the story</p>`), cap: "Who does what" },
      { w: 3, info: card("warn", "Risks → what we do", "Risk register", "", D.risks.map(r => `<p style="margin-top:5px">⚠ <b>${esc(r[0])}</b> → ${esc(r[1])}</p>`).join("")), cap: "Risks" }] });
    // 11 — wrap
    out.push({ t: "Minutes of meeting", panels: [
      { w: 4, info: `<div class="kmom"><h5>📝 MoM · ${esc(D.project)} kick-off</h5><p style="margin:0 0 8px"><b>Goal:</b> ${esc(D.goal)}</p><table><thead><tr><th>Action item</th><th>Owner</th><th>Due</th></tr></thead><tbody>${D.actions.map(a => `<tr><td>${esc(a[0])}</td><td>${esc(a[1] === "YOU" ? P.you.short : a[1])}</td><td>${esc(a[2])}</td></tr>`).join("")}</tbody></table></div>`, cap: "12:05 PM · you send the minutes", bgc: "#fffdf5" },
      { w: 2, bg: "meeting", table: true, sfx: "DEAL!", cast: [["sp", 30, "happy", "present"], ["lead", 72, "happy", "present", true]], say: [["sp", esc(D.quote)]] },
      { w: 6, bg: "desk", cap: "Back at the BI office", cast: [["pm", 12, "happy", "cheer"], ["you", 36, "happy", "cheer"], ["de", 60, "happy", "laptop"], ["lead", 86, "smile", "wave", true]], say: [["you", "That was way more useful than I expected! 🙌"], ["lead", "A good kick-off saves weeks of rework. Now the real work starts."]] }] });
    // 12 — teaser + quiz
    const Q = [["What is the main goal of a kick-off meeting?", ["Show the client a finished dashboard", "Agree goal, scope, KPIs, data, timeline and owners before building", "Load the data into the database"], 1, "A kick-off aligns everyone BEFORE building. Dashboards come later."], ["Two stakeholders define the same KPI differently. Best move?", ["Pick the one you like", "Show both without labels", "Write both definitions, name them clearly and get the sponsor to approve the official one"], 2, "Name both, document them, and let the sponsor approve the official KPI."]].concat(D.quiz || []);
    out.push({ t: "To be continued…", quiz: Q, panels: [
      { w: 6, bg: "night", cap: "That night · 11:48 PM", sfx: "UH-OH…", cast: [["de", 28, "wow", "laptop"], ["you", 72, "worry", "facepalm", true]], say: [["de", D.ep2], ["you", "Next episode: <b>The Data Arrives</b>. Bring coffee. ☕"]] },
      { w: 6, info: `<div>${Q.map((q, i) => `<div class="kq" data-q="${i}"><p>${i + 1}. ${esc(q[0])}</p>${q[1].map((o, j) => `<button type="button" data-o="${j}">${esc(o)}</button>`).join("")}<div class="fb"></div></div>`).join("")}<div class="kcta"><button type="button" data-go="problem">🎯 Open the business problem</button><button type="button" data-go="kpis">📊 See all KPIs</button><button type="button" data-go="schedule">📅 My presentation schedule</button><button type="button" data-replay>🔁 Read again</button></div></div>`, cap: "Your turn · quick check 🧠", bgc: "#fffdf5" }] });
    return out;
  }
  /* ---- voices: every character speaks with a male/female voice that suits them (browser speech, free, no key) ---- */
  const FEMALE = new Set(["kavya", "priya", "ankita", "sana", "meera", "farah", "lakshmi", "ayesha", "ananya", "ishita", "fatima", "sneha", "pooja", "ritu", "dr. ritu", "anjali", "nisha", "tanvi", "riya", "neha", "zoya"]);
  const LSK = "ko_voice_v1";
  const prefs = (() => { try { return Object.assign({ on: true, you: "m", rate: 1 }, JSON.parse(localStorage.getItem(LSK) || "{}")); } catch (e) { return { on: true, you: "m", rate: 1 }; } })();
  const savePrefs = () => { try { localStorage.setItem(LSK, JSON.stringify(prefs)); } catch (e) {} };
  const SPEECH = typeof window.speechSynthesis !== "undefined" && typeof window.SpeechSynthesisUtterance !== "undefined";
  const FEM_RE = /female|woman|zira|heera|neerja|swara|kalpana|aditi|raveena|veena|lekha|samantha|victoria|karen|moira|tessa|susan|hazel|catherine|sonia|libby|aria|jenny|michelle|emma|ava|allison|serena|fiona|kate|salli|joanna|kendra|kimberly|ivy|amy|google uk english female|google us english|ananya|isha|priya|anjali|kajal|nicky|shelley|sandy|flo|grandma/i;
  const MAL_RE = /\bmale\b|\bman\b|david|mark|ravi|prabhat|hemant|madhur|daniel|alex|fred|rishi|george|guy|ryan|thomas|oliver|arthur|aaron|tom\b|christopher|eric|james|brian|matthew|joey|justin|russell|google uk english male|kunal|aarav|rocko|reed|eddy|grandpa/i;
  let VOICES = null;
  function voices() {
    if (!SPEECH) return [];
    const all = speechSynthesis.getVoices().filter(v => /^en|^hi/i.test(v.lang));
    if (!all.length) return [];
    const score = (v) => (/en-IN/i.test(v.lang) ? 30 : /en-GB/i.test(v.lang) ? 12 : /en-US/i.test(v.lang) ? 10 : /^hi/i.test(v.lang) ? -50 : 0) + (/natural|neural|online|google/i.test(v.name) ? 8 : 0);
    const sorted = all.slice().sort((a, b) => score(b) - score(a));
    const f = sorted.filter(v => FEM_RE.test(v.name) && !MAL_RE.test(v.name)), m = sorted.filter(v => MAL_RE.test(v.name));
    const other = sorted.filter(v => !f.includes(v) && !m.includes(v));
    return (VOICES = { f: f.length ? f : other, m: m.length ? m : other, any: sorted });
  }
  if (SPEECH) { voices(); try { speechSynthesis.addEventListener("voiceschanged", voices); } catch (e) { speechSynthesis.onvoiceschanged = voices; } }
  // each character: gender, a voice (different people of the same gender get different voices when the device has them) and a pitch/speed of their own
  function voiceFor(key, P) {
    const V = VOICES || voices(); const p = P[key] || {};
    const g = key === "narr" ? "f" : key === "you" ? prefs.you : p.g || (FEMALE.has(String(p.short || "").toLowerCase()) ? "f" : "m");
    const order = { f: ["sp", "us", "ow", "pm", "de", "you", "narr"], m: ["lead", "sp", "us", "ow", "ba", "qa", "you"] }[g];
    const list = (V && V[g]) || [];
    const idx = Math.max(0, order.indexOf(key));
    const v = list.length ? list[idx % list.length] : null;
    const tone = { sp: [0.95, 0.98], us: [1.05, 1.04], ow: [1.0, 0.96], lead: [0.92, 0.97], pm: [1.1, 1.02], ba: [1.02, 1.04], de: [1.12, 1.03], qa: [1.08, 1.05], you: [1.06, 1.02], narr: [1.0, 0.98] }[key] || [1, 1];
    // only one voice of this gender on the device → shift the pitch so people still sound different
    const shift = list.length > 1 ? 1 : g === "f" ? (v && FEM_RE.test(v.name) ? 1 : 1.35) : (v && MAL_RE.test(v.name) ? 1 : 0.7);
    return { voice: v, pitch: Math.max(0.1, Math.min(2, tone[0] * shift)), rate: tone[1] * prefs.rate };
  }
  function speechText(t) {
    return String(t).replace(/\p{Extended_Pictographic}|\uFE0F/gu, "").replace(/₹\s?/g, " rupees ").replace(/÷/g, " divided by ").replace(/×/g, " times ").replace(/→|->/g, " to ").replace(/\bvs\.?\b/gi, "versus").replace(/\bKPIs\b/g, "K P Is").replace(/\bKPI\b/g, "K P I").replace(/\bMoM\b/g, "minutes of meeting").replace(/\bBI\b/g, "B I").replace(/\bQA\b/g, "Q A").replace(/…/g, ", ").replace(/\s+/g, " ").trim();
  }

  /* ---- player: reveals panels one by one, characters talk while their line types out; Play = runs on its own like a GIF ---- */
  function renderDeck(host, D) {
    const S = pages(D), P = people(D); let si = 0, beat = 0, playing = false, gen = 0, busy = false, timer = 0;
    host.innerHTML = `<div class="ko"><div class="ko-head"><div><span class="ko-ep">🎬 Animated comic · Episode 1 · ${S.length} pages · about 8 minutes</span><h2>The Kick-off: ${esc(D.project)}</h2><p>Watch a real BI kick-off meeting play out: the client, the BI team and you. Press <b>Play</b> to watch it like a video, or <b>Next</b> to go at your own pace.</p></div></div>
      <div class="ko-play"><button type="button" class="big">▶ Play the story</button>
        ${SPEECH ? `<button type="button" class="ko-vbtn" data-v="on" aria-pressed="${prefs.on}">${prefs.on ? "🔊 Voices on" : "🔇 Voices off"}</button>
        <label class="ko-vsel">Your voice <select data-v="you"><option value="m" ${prefs.you === "m" ? "selected" : ""}>👨 Male</option><option value="f" ${prefs.you === "f" ? "selected" : ""}>👩 Female</option></select></label>
        <label class="ko-vsel">Speed <select data-v="rate">${[[0.85, "Slow"], [1, "Normal"], [1.15, "Fast"]].map(r => `<option value="${r[0]}" ${+prefs.rate === r[0] ? "selected" : ""}>${r[1]}</option>`).join("")}</select></label>` : ""}
        <span>${SPEECH ? "Every character speaks in their own voice (use headphones in class). " : ""}Lines type out and pages turn by themselves. Pause any time.</span></div>
      <div class="ko-book" tabindex="0" aria-roledescription="comic book"><div class="ko-slot"></div>
      <div class="ko-nav"><button type="button" class="pv" aria-label="Previous page">←</button><button type="button" class="pl">▶ Play</button>${SPEECH ? `<button type="button" class="vo" aria-label="Voices on or off">${prefs.on ? "🔊" : "🔇"}</button>` : ""}<button type="button" class="go">Next →</button><span class="ko-scene"></span><div class="ko-prog" aria-hidden="true"><i></i></div></div></div></div>`;
    const slot = host.querySelector(".ko-slot"), book = host.querySelector(".ko-book"), go = host.querySelector(".go"), pv = host.querySelector(".pv"), pl = host.querySelector(".pl"), big = host.querySelector(".ko-play .big"), sc = host.querySelector(".ko-scene"), pr = host.querySelector(".ko-prog i");
    const wait = (ms, g) => new Promise(res => { clearTimeout(timer); timer = setTimeout(() => res(g === gen), ms); });
    const hush = () => { if (SPEECH) try { speechSynthesis.cancel(); } catch (e) {} };
    // speak one line; resolves when the voice finishes (or is stopped). Chrome sometimes never fires "end", so there is a time limit.
    function say(text, key, g) {
      if (!SPEECH || !prefs.on || RM() || !speechSynthesis.getVoices().length) return Promise.resolve(true);
      const t = speechText(text); if (!t) return Promise.resolve(true);
      return new Promise(res => {
        const u = new SpeechSynthesisUtterance(t), vf = voiceFor(key, P);
        try { if (vf.voice) { u.voice = vf.voice; u.lang = vf.voice.lang; } else u.lang = "en-IN"; } catch (e) { u.lang = "en-IN"; }
        try { u.pitch = vf.pitch; u.rate = vf.rate; } catch (e) {}
        let done = false; const fin = () => { if (done) return; done = true; clearInterval(iv); clearTimeout(lim); res(g === gen); };
        let started = false; u.onstart = () => { started = true; };
        u.onend = fin; u.onerror = fin;
        const lim = setTimeout(fin, 2500 + t.length * 95 / vf.rate);
        setTimeout(() => { if (!started && !speechSynthesis.speaking) fin(); }, 1600);   // no audio on this device: don't hold the story
        const iv = setInterval(() => { if (g !== gen) { hush(); fin(); } }, 150);
        try { speechSynthesis.speak(u); } catch (e) { fin(); }
      });
    }
    const estMs = (text) => Math.min(9000, Math.max(800, speechText(text).length * 62 / prefs.rate));
    const vb = host.querySelector(".ko-vbtn"), vo = host.querySelector(".ko-nav .vo");
    const setVoice = (on) => { prefs.on = on; savePrefs(); if (!on) hush(); if (vb) { vb.textContent = on ? "🔊 Voices on" : "🔇 Voices off"; vb.setAttribute("aria-pressed", on); } if (vo) vo.textContent = on ? "🔊" : "🔇"; };
    if (vb) vb.addEventListener("click", () => setVoice(!prefs.on)); if (vo) vo.addEventListener("click", () => setVoice(!prefs.on));
    host.querySelectorAll("select[data-v]").forEach(sel => sel.addEventListener("change", () => { prefs[sel.dataset.v] = sel.dataset.v === "rate" ? +sel.value : sel.value; savePrefs(); }));
    const plain = (el) => (el.textContent || "").replace(/\s+/g, " ").trim();
    function setPlay(on) {
      playing = on; pl.textContent = on ? "⏸ Pause" : "▶ Play"; big.textContent = on ? "⏸ Pause the story" : "▶ Play the story";
      if (!on) hush();
      if (on && !busy) advance();
    }
    // type the bubble's text nodes out (keeps bold/links); resolves false if interrupted
    function typeOut(el, g, msWanted) {
      const nodes = []; const walk = (n) => n.childNodes.forEach(c => { if (c.nodeType === 3) nodes.push(c); else if (!(c.classList && c.classList.contains("who"))) walk(c); }); walk(el);
      const full = nodes.map(n => n.nodeValue); const total = full.reduce((a, t) => a + t.length, 0);
      if (RM() || !total) return Promise.resolve(true);
      nodes.forEach(n => { n.nodeValue = ""; });
      const caret = document.createElement("span"); caret.className = "caret"; el.appendChild(caret);
      const ms = msWanted || Math.min(3600, Math.max(700, total * 26)); const t0 = performance.now();
      return new Promise(res => {
        const tick = (now) => {
          if (g !== gen) { nodes.forEach((n, i) => { n.nodeValue = full[i]; }); caret.remove(); return res(false); }
          let left = Math.round(Math.min(1, (now - t0) / ms) * total);
          nodes.forEach((n, i) => { const k = Math.min(full[i].length, left); n.nodeValue = full[i].slice(0, k); left -= k; });
          if (now - t0 >= ms) { caret.remove(); return res(true); }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }
    async function playPanel(el, g) {
      el.classList.add("in");
      if (!RM()) { const r = el.getBoundingClientRect(); if (r.bottom > innerHeight - 80 || r.top < 0) el.scrollIntoView({ block: r.height > innerHeight - 160 ? "start" : "center", behavior: "smooth" }); }
      const bubbles = [...el.querySelectorAll(".kb")];
      if (!bubbles.length) {
        const cap = el.querySelector(".kp-cap"), note = el.querySelector(".kp-note"), words = plain(el).split(" ").length;
        const spoken = prefs.on && SPEECH && (playing || cap) ? say([cap ? plain(cap) : "", note ? plain(note) : ""].filter(Boolean).join(". "), "narr", g) : null;
        const ok = await wait(playing ? Math.min(11000, Math.max(3000, words * 230)) : 250, g);
        if (spoken) await spoken;
        return ok && g === gen;
      }
      if (!(await wait(RM() ? 0 : 450, g))) return false;
      for (const b of bubbles) {
        const who = el.querySelector(`.ch[data-who="${b.dataset.who}"]`);
        b.classList.add("show");
        if (who) who.classList.add("talk");
        const line = [...b.childNodes].filter(n => !(n.classList && (n.classList.contains("who") || n.classList.contains("why") || n.classList.contains("caret")))).map(n => n.textContent).join(" ");
        const voiceOn = SPEECH && prefs.on && !RM() && speechSynthesis.getVoices().length > 0;
        const spoken = voiceOn ? say(line, b.dataset.who, g) : null;
        let ok = await typeOut(b, g, voiceOn ? estMs(line) * 0.85 : 0);
        if (spoken) ok = (await spoken) && ok;
        if (who) who.classList.remove("talk");
        b.classList.add("done");
        if (!ok) return false;
        const words = plain(b).split(" ").length;
        if (!(await wait(playing ? (SPEECH && prefs.on ? 350 : Math.min(2600, 500 + words * 70)) : 220, g))) return false;
      }
      return true;
    }
    function finishPanel(el) { if (!el) return; el.classList.add("in"); el.querySelectorAll(".kb").forEach(b => b.classList.add("show", "done")); el.querySelectorAll(".ch.talk").forEach(c => c.classList.remove("talk")); }
    function show(i, all) {
      gen++; clearTimeout(timer); busy = false; hush();
      si = Math.max(0, Math.min(S.length - 1, i)); const s = S[si];
      slot.innerHTML = `<div class="ko-page"><div class="ko-ptitle"><span class="no">PAGE ${si + 1}</span><h3>${esc(s.t)}</h3></div><div class="ko-grid">${s.panels.map((p, k) => panelHtml(p, P, k)).join("")}</div></div>`;
      beat = 0;
      if (s.arch) renderArch(slot.querySelector(".ko-arch"), D.arch, { caption: false });
      if (s.quiz) wireQuiz(s.quiz);
      slot.querySelectorAll("[data-go]").forEach(bt => bt.addEventListener("click", () => { setPlay(false); if (typeof window.switchView === "function") window.switchView(bt.dataset.go); }));
      const rp = slot.querySelector("[data-replay]"); if (rp) rp.addEventListener("click", () => { show(0); book.scrollIntoView({ block: "start" }); setPlay(true); });
      sc.textContent = `Page ${si + 1}/${S.length} · ${s.t}`; pr.style.width = ((si + 1) / S.length * 100) + "%";
      pv.disabled = si === 0;
      if (all) { s.panels.forEach((_, k) => finishPanel(slot.querySelector(`.kp[data-p="${k}"]`))); beat = s.panels.length; label(); return; }
      label(); step();
    }
    function label() { const s = S[si]; go.textContent = busy ? "Next →" : beat >= s.panels.length ? (si === S.length - 1 ? "🔁 Start again" : "Next page →") : "Next →"; }
    async function step() {
      const s = S[si]; if (beat >= s.panels.length) return;
      const el = slot.querySelector(`.kp[data-p="${beat}"]`); beat++; label();
      const g = gen; busy = true; label(); const ok = await playPanel(el, g); if (g !== gen) return; busy = false; label();
      if (ok && playing) advance();
    }
    function advance() {
      const s = S[si];
      if (beat < s.panels.length) return step();
      if (si < S.length - 1) { show(si + 1); book.scrollIntoView({ block: "start", behavior: RM() ? "auto" : "smooth" }); }
      else setPlay(false);   // last page: stop on the quiz
    }
    function next() {
      const s = S[si];
      if (busy) { gen++; busy = false; hush(); finishPanel(slot.querySelector(`.kp[data-p="${beat - 1}"]`)); label(); if (beat < s.panels.length) step(); return; }   // first click finishes the current panel
      if (beat < s.panels.length) step();
      else { show(si < S.length - 1 ? si + 1 : 0); book.scrollIntoView({ block: "start", behavior: RM() ? "auto" : "smooth" }); }
    }
    function prev() { if (si > 0) { setPlay(false); show(si - 1, true); book.scrollIntoView({ block: "start" }); } }
    function wireQuiz(Q) {
      slot.querySelectorAll(".kq").forEach(qe => { const q = Q[+qe.dataset.q]; qe.querySelectorAll("button").forEach(bt => bt.addEventListener("click", () => {
        if (qe.dataset.done) return; qe.dataset.done = "1"; const ok = +bt.dataset.o === q[2];
        bt.classList.add(ok ? "ok" : "no"); if (!ok) qe.querySelector(`[data-o="${q[2]}"]`).classList.add("ok");
        qe.querySelector(".fb").innerHTML = (ok ? "✅ <b>Correct!</b> " : "❌ <b>Not quite.</b> ") + esc(q[3]); })); });
    }
    go.addEventListener("click", () => { setPlay(false); next(); }); pv.addEventListener("click", prev);
    const toggle = () => { if (!playing && si === S.length - 1 && beat >= S[si].panels.length) { show(0); } setPlay(!playing); if (playing) book.scrollIntoView({ block: "start", behavior: "smooth" }); };
    pl.addEventListener("click", toggle); big.addEventListener("click", toggle);
    book.addEventListener("keydown", e => { if (e.target.tagName === "BUTTON" && e.key !== "ArrowRight" && e.key !== "ArrowLeft") return; if (e.key === "ArrowRight") { e.preventDefault(); setPlay(false); next(); } else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); } else if (e.key === " ") { e.preventDefault(); toggle(); } });
    let sx = null; book.addEventListener("touchstart", e => { sx = e.touches[0].clientX; }, { passive: true });
    book.addEventListener("touchend", e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 70) { setPlay(false); dx < 0 ? next() : prev(); } });
    // pause when the student leaves the Kick-off page or the tab
    const sec = document.getElementById("view-kickoff");
    if (sec) new MutationObserver(() => { if (!sec.classList.contains("active")) setPlay(false); }).observe(sec, { attributes: true, attributeFilter: ["class"] });
    document.addEventListener("visibilitychange", () => { if (document.hidden) setPlay(false); });
    show(0);
  }

  /* ===================================================== mount ===================================================== */
  function mount() {
    const D = window.KICKOFF_DATA && window.KICKOFF_DATA[SITE]; if (!D) return;
    addCss();
    const a = document.getElementById("arch-flow"); if (a) renderArch(a, D.arch);
    if (a && !document.getElementById("ko-teaser")) {
      const t = document.createElement("div"); t.id = "ko-teaser"; t.className = "ko-teaser";
      t.innerHTML = `<span class="em">🎬</span><div><h4>New: read the kick-off meeting as a comic</h4><p>${esc(D.company)}'s sponsor explains the pain, the BI team asks the right questions, two people fight over a KPI, and the project gets planned. It's your project, as a story.</p></div><button type="button">Read the comic →</button>`;
      t.querySelector("button").addEventListener("click", () => { if (typeof window.switchView === "function") window.switchView("kickoff"); });
      a.parentNode.insertBefore(t, a.nextSibling);
    }
    const v = document.getElementById("ko-deck"); let built = false;
    const build = () => { if (built || !v) return; built = true; renderDeck(v, D); };
    const sec = document.getElementById("view-kickoff");
    if (sec) { if (sec.classList.contains("active")) build(); new MutationObserver(() => { if (sec.classList.contains("active")) build(); }).observe(sec, { attributes: true, attributeFilter: ["class"] }); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
  // for checking which voice each character gets on this device: KICKOFF_KIT.voicePlan()
  window.KICKOFF_KIT = { renderArch, renderDeck, figure, voicePlan: () => { const D = window.KICKOFF_DATA && window.KICKOFF_DATA[SITE]; if (!D) return {}; const P = people(D); voices(); return Object.fromEntries(["sp", "us", "ow", "lead", "pm", "ba", "de", "qa", "you", "narr"].map(k => { const v = voiceFor(k, P); return [k + (P[k] ? " · " + P[k].short : ""), (v.voice ? v.voice.name : "default") + " · pitch " + v.pitch.toFixed(2)]; })); } };
})();
