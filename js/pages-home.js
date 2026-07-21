"use strict";
/* ============ Home ============ */
docPage('home',()=>{
  const P=PALETTES;
  return `
<section class="hero"><div class="hero-in">
<div>
<span class="pill">${I.spark} v2.4 — Dynamic color API</span>
<h1>Meridian<br><span style="color:var(--fg-muted);font-weight:550;font-size:.62em;letter-spacing:-.01em">Calm precision for product interfaces</span></h1>
<p class="tg">プロダクトインターフェースのためのデザインシステム。1 つの Seed color から、テーマ・密度・60+ コンポーネントを一貫して導出します。</p>
<div class="rowflex" style="margin-bottom:var(--sp-5)">
<a href="#/overview/getting-started" class="btn" data-variant="primary" data-size="lg">Getting started</a>
<a href="#/components/button" class="btn" data-variant="secondary" data-size="lg">Components</a>
</div>
<div class="rowflex" style="gap:var(--sp-25)">
<span style="font-size:var(--text-small);color:var(--fg-subtle)">Seed:</span>
${SEED_PRESETS.map(s=>`<button class="seeddot" style="background:${s.hex};width:22px;height:22px" data-seed="${s.hex}" aria-pressed="${STATE.seed.toLowerCase()===s.hex.toLowerCase()}" aria-label="Seed: ${s.name}" title="${s.name}"></button>`).join('')}
<label style="display:inline-flex"><span class="vh">Custom seed</span><input type="color" value="${STATE.seed}" data-seedpick style="width:26px;height:24px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface);padding:1px;cursor:pointer"></label>
</div>
</div>
<div class="hero-demo">
<div class="hd-bar"><i></i><i></i><i></i><span>meridian — theme: ${STATE.theme} · contrast: ${STATE.contrast} · density: ${STATE.density} · seed: ${STATE.seed}</span></div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4);padding:var(--sp-4)">
<div style="display:flex;flex-direction:column;gap:var(--sp-3)">
${kpiEl({label:'API リクエスト',value:'1.24M',delta:'+12.4%'})}
${fieldEl({label:'Project name',placeholder:'Acme Dashboard',helper:'Seed に追従する focus ring'})}
<div class="rowflex">${btn({label:'Deploy',size:'sm'})}${btn({label:'Cancel',variant:'ghost',size:'sm'})}${badge({label:'Healthy',tone:'success',dot:true})}</div>
</div>
<div style="display:flex;flex-direction:column;gap:var(--sp-3)">
<div class="codeblock" style="margin:0"><div class="cb-hd">tokens.css</div><pre style="padding:10px 14px;font-size:11px"><code><span class="tk-f">--primary</span>: <span class="tk-n">${SEM.primary}</span>;
<span class="tk-f">--surface</span>: <span class="tk-n">${SEM.surface}</span>;
<span class="tk-f">--fg</span>: <span class="tk-n">${SEM.foreground}</span>;</code></pre></div>
${usageMeterEl({value:72})}
</div>
</div>
</div>
</div></section>

<section class="home-sec">
<h2>Seed input → Reference → Semantic → Component</h2>
<p class="sub">Seed を変えるだけで、この画面のすべて — パレット・トークン・コンポーネント・テンプレート — が再生成されます。</p>
<div class="panel pad" style="overflow-x:auto">
<div class="pal"><span class="nm">primary</span>${STEPS.map(s=>`<button class="cell" style="background:${P.primary[s]}" data-copy="${P.primary[s]}"><span style="color:${L_MAP[s]>60?'rgba(0,0,0,.5)':'rgba(255,255,255,.8)'}">${s}</span></button>`).join('')}</div>
<div class="pal"><span class="nm">neutral</span>${STEPS.map(s=>`<button class="cell" style="background:${P.neutral[s]}" data-copy="${P.neutral[s]}"><span style="color:${L_MAP[s]>60?'rgba(0,0,0,.5)':'rgba(255,255,255,.8)'}">${s}</span></button>`).join('')}</div>
</div>
<div class="rowflex" style="margin-top:var(--sp-3)"><a href="#/foundations/color" class="btn" data-variant="ghost" data-size="md">カラーシステムの詳細 →</a></div>
</section>

<section class="home-sec" style="padding-top:0">
<h2>Themes & Density</h2>
<p class="sub">Light / Dark、Standard / High contrast、Compact / Default / Comfortable は独立して選べる軸です。</p>
<div class="comp-grid">
${[['light','standard','Light / Standard'],['dark','standard','Dark / Standard'],['light','high','Light / High'],['dark','high','Dark / High']].map(([th,ct,label])=>{const t=buildSemantics(P,th,ct);return `<button class="comp-tile" data-settheme="${th}" data-setcontrast="${ct}" style="text-align:left;cursor:pointer">
<div class="pv" style="background:${t.background};border-bottom:1px solid ${t.border};flex-direction:column;gap:8px;align-items:stretch;padding:16px">
<div style="background:${t.surface};border:1px solid ${t.border};border-radius:var(--radius-md);padding:10px">
<div style="color:${t.foreground};font-size:12px;font-weight:600">Deploy service</div>
<div style="color:${t['foreground-muted']};font-size:11px;margin:2px 0 8px">main → production</div>
<span style="background:${t.primary};color:${t['primary-foreground']};font-size:11px;font-weight:550;padding:3px 10px;border-radius:var(--radius-sm)">Deploy</span>
</div></div>
<div class="nm">${label}<span>${STATE.theme===th&&STATE.contrast===ct?'現在のcontext':'クリックで切替'}</span></div></button>`}).join('')}
</div>
<div class="rowflex" style="margin-top:var(--sp-4);gap:var(--sp-2)">
<span style="font-size:var(--text-small);color:var(--fg-subtle)">Density:</span>
<div class="seg">${['compact','default','comfortable'].map(d=>`<button aria-pressed="${STATE.density===d}" data-setdensity="${d}">${d[0].toUpperCase()+d.slice(1)}</button>`).join('')}</div>
<span style="font-size:var(--text-small);color:var(--fg-subtle)">— 行高・余白・文字サイズが連動します</span>
</div>
</section>

<section class="home-sec" style="padding-top:0">
<h2>Components</h2>
<p class="sub">60+ のコンポーネント。それぞれに When to use / States / Playground / コード例が付属します。</p>
<div class="comp-grid">
${[['button',()=>btn({label:'Deploy',size:'sm'})+btn({label:'Cancel',variant:'ghost',size:'sm'})],
['text-field',()=>inputEl({placeholder:'Project name',size:'sm'})],
['badge',()=>badge({label:'Active',tone:'success',dot:true})+badge({label:'Beta',tone:'primary'})],
['table',()=>`<div style="transform:scale(.8);width:125%">${tableEl({rows:[['api-core','Prod',['success','Healthy'],'8.1k','2m'],['ml-jobs','Stg',['warning','Degraded'],'1.2k','5m']]})}</div>`],
['prompt-input',()=>`<div style="transform:scale(.72);width:138%">${promptEl()}</div>`],
['agent-status',()=>`<div style="transform:scale(.85)">${agentStatusEl({s:'running'})}</div>`],
['command-menu',()=>`<div style="transform:scale(.6);width:166%">${cmdMenuDemo()}</div>`],
['kpi-card',()=>`<div style="transform:scale(.8)">${kpiEl({label:'MRR',value:'¥2.84M',delta:'+12.4%'})}</div>`]
].map(([id,fn])=>{const c=CMAP[id];return `<a class="comp-tile" href="#/components/${id}"><div class="pv">${fn()}</div><div class="nm">${c.name}<span>${c.group}</span></div></a>`}).join('')}
</div>
<div class="rowflex" style="margin-top:var(--sp-4)"><a href="#/components/button" class="btn" data-variant="secondary" data-size="md">すべてのコンポーネント ${I.arrowR}</a></div>
</section>

<section class="home-sec" style="padding-top:0">
<h2>Templates</h2>
<p class="sub">トークンとコンポーネントだけで組まれた、実プロダクト相当の画面テンプレート。</p>
<div class="grid3">
${[['saas-dashboard','SaaS Dashboard','KPI・チャート・テーブルの標準構成'],['ai-workspace','AI Agent Workspace','チャット+ファイルツリー+実行ログ'],['settings','Settings','設定ナビ+フォーム+Danger zone'],['issue-tracker','Issue Tracker','List detail レイアウト'],['billing','Billing','プラン・使用量・請求書'],['login','Login / Signup','認証画面一式']].map(([id,t,d])=>`<a class="comp-tile" href="#/templates/${id}" style="padding:var(--sp-4)"><b style="font-size:var(--text-body)">${t}</b><p style="font-size:var(--text-small);color:var(--fg-muted);margin-top:4px">${d}</p></a>`).join('')}
</div>
</section>

<section class="home-sec" style="padding-top:0">
<div class="grid3">
<a class="comp-tile" href="#/overview/getting-started" style="padding:var(--sp-5)"><b>Getting started →</b><p style="font-size:var(--text-small);color:var(--fg-muted);margin-top:4px">5 分でセットアップ。ThemeProvider と最初のコンポーネント。</p></a>
<a class="comp-tile" href="#/overview/for-designers" style="padding:var(--sp-5)"><b>For Designers →</b><p style="font-size:var(--text-small);color:var(--fg-muted);margin-top:4px">Semantic token の使い方、密度の選び方、ハンドオフ。</p></a>
<a class="comp-tile" href="#/overview/for-engineers" style="padding:var(--sp-5)"><b>For Engineers →</b><p style="font-size:var(--text-small);color:var(--fg-muted);margin-top:4px">React / Tailwind / CSS Variables の実装ガイド。</p></a>
</div>
</section>
<footer class="foot"><div class="in"><span><b style="color:var(--fg)">Meridian</b> — Calm precision for product interfaces</span><span>v2.4.1 · WCAG 2.2 AA · MIT License</span></div></footer>`});
