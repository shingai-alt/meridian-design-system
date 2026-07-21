"use strict";
/* ============ Navigation model ============ */
const COMP_GROUPS=['Core','Forms','Navigation','Feedback','Data Display','AI & Developer','SaaS'];
const NAV=[
 {label:'Overview',items:[['overview/introduction','Introduction'],['overview/principles','Principles'],['overview/getting-started','Getting Started'],['overview/architecture','System Architecture'],['overview/for-designers','For Designers'],['overview/for-engineers','For Engineers']]},
 {label:'Foundations',items:[['foundations/color','Color'],['foundations/typography','Typography'],['foundations/spacing','Spacing'],['foundations/layout','Layout'],['foundations/radius','Radius'],['foundations/elevation','Elevation'],['foundations/motion','Motion'],['foundations/iconography','Iconography'],['foundations/accessibility','Accessibility'],['foundations/content','Content Guidelines']]},
 {label:'Tokens',items:[['tokens/overview','Token Overview'],['tokens/color','Color Tokens'],['tokens/typography','Typography Tokens'],['tokens/spacing','Spacing Tokens'],['tokens/radius','Radius Tokens'],['tokens/shadow','Shadow Tokens'],['tokens/motion','Motion Tokens'],['tokens/component','Component Tokens'],['tokens/theme','Theme Tokens'],['tokens/density','Density Tokens'],['tokens/css-variables','CSS Variables'],['tokens/json-tokens','JSON Tokens']]},
 ...COMP_GROUPS.map(g=>({label:g==='Core'?'Components · Core':g,comp:true,items:COMPONENTS.filter(c=>c.group===g).map(c=>['components/'+c.id,c.name])})),
 {label:'Patterns',items:Object.entries(PATTERNS).map(([id,p])=>['patterns/'+id,p.t])},
 {label:'Templates',items:Object.entries(TEMPLATES).map(([id,t])=>['templates/'+id,t.name])},
 {label:'Resources',items:[['resources/figma-tokens','Figma Tokens'],['resources/css-variables','CSS Variables'],['resources/react-usage','React Usage'],['resources/tailwind-usage','Tailwind Usage'],['resources/design-handoff','Design Handoff'],['resources/a11y-checklist','A11y Checklist'],['resources/contribution','Contribution Guide'],['resources/changelog','Changelog']]}
];
const ALL_LINKS=NAV.flatMap(g=>g.items.map(it=>({route:it[0],label:it[1],group:g.label})));
function findLabel(route){const f=ALL_LINKS.find(l=>l.route===route);return f?f:{label:'Home',group:''}}

/* ============ Shell ============ */
const openGroups=new Set(['Overview','Foundations','Components · Core']);
function renderSidebar(){
  const cur=STATE.route;
  return `<div class="sb-logo"><span class="mark"></span>Meridian<span class="ver">v2.4.1</span></div>
  <button class="sb-search" data-opencmd>${I.search}<span>検索 / コマンド</span><kbd>⌘K</kbd></button>
  <a class="sb-item" href="#/home" aria-current="${cur==='home'?'page':'false'}" style="margin:0 var(--sp-1)">${I.zap} ホーム</a>
  ${NAV.map((g,groupIndex)=>{
    const open=openGroups.has(g.label)||g.items.some(it=>it[0]===cur);
    return `<div class="sb-group ${open?'':'closed'}" data-group="${esc(g.label)}">
    <button class="hd" aria-expanded="${open}" aria-controls="nav-group-${groupIndex}">${I.chevD}<span>${esc(g.label)}</span><span style="margin-left:auto;font-weight:500;letter-spacing:0">${g.items.length}</span></button>
    <div class="items" id="nav-group-${groupIndex}" style="margin:2px var(--sp-1) 0">${g.items.map(it=>`<a class="sb-item" href="#/${it[0]}" aria-current="${it[0]===cur?'page':'false'}">${esc(it[1])}</a>`).join('')}</div></div>`}).join('')}`}
function renderTopbar(){
  const meta=STATE.route==='home'?{label:'Home',group:''}:findLabel(STATE.route);
  return `<button class="tb-btn mob-nav-btn" data-navtoggle aria-label="ナビゲーションを開く" aria-expanded="${STATE.navOpen}" aria-controls="sidebar">${I.menu}</button>
  <div class="tb-crumb">${meta.group?`<span>${esc(meta.group)}</span><span>${I.chevR}</span>`:''}<b>${esc(meta.label)}</b></div>
  <div class="tb-right">
  <button class="tb-btn hide-m" data-cycletheme title="テーマ切替 (Light / Dark)">${STATE.theme==='light'?I.sun:I.moon}<span style="font-size:11px">${STATE.theme[0].toUpperCase()+STATE.theme.slice(1)}</span></button>
  <button class="tb-btn hide-m" data-cyclecontrast title="コントラスト切替 (Standard / High)">${I.contrast}<span style="font-size:11px">${STATE.contrast==='high'?'High':'Std'}</span></button>
  <button class="tb-btn hide-m" data-opensettings title="Density">${I.density}<span style="font-size:11px">${STATE.density[0].toUpperCase()+STATE.density.slice(1)}</span></button>
  <button class="tb-btn" data-opensettings title="Seed color" aria-label="表示設定を開く" aria-expanded="${Boolean($('#tb-menu'))}" aria-controls="tb-menu"><span class="tb-seed"></span></button>
  <button class="tb-btn bordered hide-m" title="Version"><span style="font-family:var(--font-mono);font-size:10.5px">v2.4.1</span>${I.chevD}</button>
  <a class="tb-btn" href="#/resources/react-usage" title="実装ガイド" aria-label="実装ガイド">${I.code}</a>
  <a class="tb-btn hide-m" href="#/resources/changelog" title="GitHub" aria-label="GitHubと変更履歴">${I.github}</a>
  <button class="tb-btn" data-opensettings aria-label="表示設定を開く" aria-expanded="false" aria-controls="tb-menu"><span class="tb-avatar">SN</span></button>
  </div>`}
function settingsMenu(){
  return `<div class="tb-menu" id="tb-menu" role="group" aria-label="表示設定">
  <h4>Theme</h4><div class="seg" style="width:100%">${[['light','Light'],['dark','Dark']].map(([v,l])=>`<button style="flex:1" aria-pressed="${STATE.theme===v}" data-settheme="${v}">${l}</button>`).join('')}</div>
  <h4>Contrast</h4><div class="seg" style="width:100%">${[['standard','Standard'],['high','High']].map(([v,l])=>`<button style="flex:1" aria-pressed="${STATE.contrast===v}" data-setcontrast="${v}">${l}</button>`).join('')}</div>
  <h4>Density</h4><div class="seg" style="width:100%">${[['compact','Compact'],['default','Default'],['comfortable','Comfortable']].map(([v,l])=>`<button style="flex:1" aria-pressed="${STATE.density===v}" data-setdensity="${v}">${l}</button>`).join('')}</div>
  <h4>Primary color seed</h4><div class="rowflex" style="gap:6px">${SEED_PRESETS.map(s=>`<button class="seeddot" style="background:${s.hex};width:22px;height:22px" data-seed="${s.hex}" aria-pressed="${STATE.seed.toLowerCase()===s.hex.toLowerCase()}" title="${s.name}" aria-label="Seed ${s.name}"></button>`).join('')}<input type="color" value="${STATE.seed}" data-seedpick style="width:28px;height:22px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface);padding:1px;cursor:pointer" aria-label="Custom seed"></div>
  <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border-muted);font-size:var(--text-micro);color:var(--fg-subtle)">設定はサイト全体に即時反映され、保存されます。</div>
  </div>`}

function renderApp(){
  const app=$('#app');
  app.className='app'+(STATE.navOpen?' nav-open':'');
  app.innerHTML=`<aside class="sidebar" id="sidebar" aria-label="サイトナビゲーション">${renderSidebar()}</aside>
  <div class="main"><header class="topbar" id="topbar">${renderTopbar()}</header><main class="content" id="content" tabindex="-1"></main></div>`;
  renderRoute();
}
function renderRoute(){
  H2N=0;
  const fn=PAGES[STATE.route]||PAGES['home'];
  $('#content').innerHTML=fn();
  buildToc();
  const c=STATE.route.startsWith('components/')?CMAP[STATE.route.split('/')[1]]:null;
  if(c)pgRefresh(c);
}
function buildToc(){
  const toc=$('#toc');if(!toc)return;
  const hs=$$('#doc-body h2');
  if(hs.length<2){toc.style.display='none';return}
  toc.innerHTML='<div class="t">On this page</div>'+hs.map(h=>`<a href="#${''}" data-scroll="${h.id}">${h.textContent}</a>`).join('');
}
function navigate(route){
  if(!PAGES[route])route='home';
  STATE.route=route;STATE.navOpen=false;
  const c=route.startsWith('components/')?CMAP[route.split('/')[1]]:null;
  if(c)PG=pgDefaults(c);
  renderApp();
  const meta=findLabel(route);document.title=`${meta.label} | Meridian Design System`;
  const heading=$('#content h1');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true})}
  window.scrollTo(0,0);
}
window.addEventListener('hashchange',()=>{const r=location.hash.replace(/^#\//,'')||'home';if(r!==STATE.route)navigate(r)});

/* ============ Command menu ============ */
let cmdSel=0,cmdItems=[],cmdReturnFocus=null;
function openCmd(){
  cmdReturnFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const root=$('#overlay-root');
  root.innerHTML=`<div class="ovl" data-closecmd><div class="cmdk" role="dialog" aria-modal="true" aria-label="コマンドメニュー" onclick="event.stopPropagation()">
  <div class="ci">${I.search}<input id="cmd-input" role="combobox" aria-label="ページとコンポーネントを検索" aria-autocomplete="list" aria-controls="cmd-list" aria-expanded="true" placeholder="ページ・コンポーネントを検索…" autocomplete="off"><kbd style="font-size:10px;color:var(--fg-subtle);border:1px solid var(--border);border-radius:var(--radius-2xs);padding:1px 5px">esc</kbd></div>
  <div class="list" id="cmd-list" role="listbox" aria-label="検索結果"></div></div></div>`;
  cmdFilter('');
  const inp=$('#cmd-input');inp.focus();
  inp.addEventListener('input',()=>cmdFilter(inp.value));
}
function closeCmd(){const returnFocus=cmdReturnFocus;cmdReturnFocus=null;$('#overlay-root').innerHTML='';if(returnFocus?.isConnected)returnFocus.focus()}
function cmdFilter(q){
  q=q.trim().toLowerCase();
  const acts=[
    {label:'テーマを切替 (Light / Dark)',k:'T',run:()=>cycleTheme(),group:'アクション'},
    {label:'コントラストを切替 (Standard / High)',k:'C',run:()=>cycleContrast(),group:'アクション'},
    {label:'密度を切替 (Compact → Default → Comfortable)',k:'D',run:()=>cycleDensity(),group:'アクション'},
  ];
  const pages=ALL_LINKS.filter(l=>!q||l.label.toLowerCase().includes(q)||l.route.includes(q)||l.group.toLowerCase().includes(q)).slice(0,14).map(l=>({label:l.label,k:l.group,run:()=>{location.hash='#/'+l.route},group:'ページ'}));
  cmdItems=[...(!q?acts:acts.filter(a=>a.label.toLowerCase().includes(q))),...pages];
  cmdSel=0;
  const list=$('#cmd-list');
  if(!cmdItems.length){list.innerHTML=`<div class="empty">「${esc(q)}」に一致する結果がありません。<br><span style="font-size:11px">例: button, color, dashboard</span></div>`;$('#cmd-input').removeAttribute('aria-activedescendant');return}
  let html='',lastG='';
  cmdItems.forEach((it,i)=>{if(it.group!==lastG){html+=`<div class="ghd">${it.group}</div>`;lastG=it.group}
    html+=`<div class="it ${i===cmdSel?'sel':''}" id="cmd-option-${i}" role="option" aria-selected="${i===cmdSel}" data-cmdi="${i}">${it.group==='アクション'?I.zap:I.file}${esc(it.label)}<span class="k">${esc(it.k)}</span></div>`});
  list.innerHTML=html;
  $('#cmd-input').setAttribute('aria-activedescendant','cmd-option-0');
}
document.addEventListener('keydown',e=>{
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#cmd-input')?closeCmd():openCmd();return}
  if(!$('#cmd-input'))return;
  if(e.key==='Tab'){e.preventDefault();$('#cmd-input').focus()}
  else if(e.key==='Escape'){closeCmd()}
  else if(e.key==='ArrowDown'){e.preventDefault();cmdSel=Math.min(cmdSel+1,cmdItems.length-1);paintSel()}
  else if(e.key==='ArrowUp'){e.preventDefault();cmdSel=Math.max(cmdSel-1,0);paintSel()}
  else if(e.key==='Enter'){e.preventDefault();const it=cmdItems[cmdSel];if(it){closeCmd();it.run()}}
});
function paintSel(){$$('#cmd-list .it').forEach((el,i)=>{const selected=i===cmdSel;el.classList.toggle('sel',selected);el.setAttribute('aria-selected',selected);if(selected)el.scrollIntoView({block:'nearest'})});const inp=$('#cmd-input');if(inp)inp.setAttribute('aria-activedescendant',`cmd-option-${cmdSel}`)}

/* ============ Global interactions ============ */
function cycleTheme(){STATE.theme=STATE.theme==='light'?'dark':'light';refreshAll()}
function cycleContrast(){STATE.contrast=STATE.contrast==='standard'?'high':'standard';refreshAll()}
function cycleDensity(){STATE.density=STATE.density==='compact'?'default':STATE.density==='default'?'comfortable':'compact';refreshAll()}
function refreshAll(){
  const y=window.scrollY;
  applyTheme();renderApp();window.scrollTo(0,y);
}
document.addEventListener('click',e=>{
  const t=e.target;
  const skip=t.closest('[data-skip-content]');if(skip){e.preventDefault();const main=$('#content');if(main)main.focus();return}
  const seed=t.closest('[data-seed]');if(seed){STATE.seed=seed.dataset.seed;refreshAll();return}
  const th=t.closest('[data-settheme]');if(th){STATE.theme=th.dataset.settheme;if(th.dataset.setcontrast)STATE.contrast=th.dataset.setcontrast;refreshAll();return}
  const ct=t.closest('[data-setcontrast]');if(ct){STATE.contrast=ct.dataset.setcontrast;refreshAll();return}
  const dn=t.closest('[data-setdensity]');if(dn){STATE.density=dn.dataset.setdensity;refreshAll();return}
  if(t.closest('[data-cycletheme]')){cycleTheme();return}
  if(t.closest('[data-cyclecontrast]')){cycleContrast();return}
  if(t.closest('[data-cycledensity]')){cycleDensity();return}
  if(t.closest('[data-opencmd]')){openCmd();return}
  if(t.closest('[data-closecmd]')&&!t.closest('.cmdk')){closeCmd();return}
  const ci=t.closest('[data-cmdi]');if(ci){const it=cmdItems[+ci.dataset.cmdi];closeCmd();if(it)it.run();return}
  if(t.closest('[data-navtoggle]')){STATE.navOpen=!STATE.navOpen;$('#app').classList.toggle('nav-open',STATE.navOpen);t.closest('[data-navtoggle]').setAttribute('aria-expanded',STATE.navOpen);return}
  const gh=t.closest('.sb-group>.hd');if(gh){const g=gh.parentElement;const name=g.dataset.group;g.classList.toggle('closed');const open=!g.classList.contains('closed');gh.setAttribute('aria-expanded',open);open?openGroups.add(name):openGroups.delete(name);return}
  const os=t.closest('[data-opensettings]');if(os){const ex=$('#tb-menu');if(ex){ex.remove();$$('[data-opensettings]').forEach(trigger=>trigger.setAttribute('aria-expanded','false'))}else{$('#topbar').insertAdjacentHTML('beforeend',settingsMenu());$$('[data-opensettings]').forEach(trigger=>trigger.setAttribute('aria-expanded','true'))}return}
  if(!t.closest('#tb-menu')&&!t.closest('[data-opensettings]')){const m=$('#tb-menu');if(m){m.remove();$$('[data-opensettings]').forEach(trigger=>trigger.setAttribute('aria-expanded','false'))}}
  const sc=t.closest('[data-scroll]');if(sc){e.preventDefault();const el=document.getElementById(sc.dataset.scroll);if(el)el.scrollIntoView({behavior:'smooth'});return}
  const vp=t.closest('[data-vp]');if(vp){$$('#tpl-vp-seg [data-vp]').forEach(b=>b.setAttribute('aria-pressed',b===vp));const v=vp.dataset.vp;const frame=$('#tpl-vp');if(frame){frame.style.maxWidth=v==='mobile'?'390px':v==='tablet'?'768px':'100%';const tid=STATE.route.split('/')[1];frame.innerHTML=TEMPLATES[tid].fn(v)}return}
  /* playground */
  const po=t.closest('[data-pg]');if(po){PG[po.dataset.pg]=po.dataset.val;$$('#pg-ctl [data-pg="'+po.dataset.pg+'"]').forEach(b=>b.setAttribute('aria-pressed',b===po));const c=CMAP[STATE.route.split('/')[1]];if(c)pgRefresh(c);return}
});
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.matches('[data-seedpick]')){STATE.seed=t.value;refreshAll();return}
  if(t.matches('[data-pgflag]')){PG[t.dataset.pgflag]=t.checked;const c=CMAP[STATE.route.split('/')[1]];if(c)pgRefresh(c);return}
});
document.addEventListener('input',e=>{
  const t=e.target;
  if(t.matches('[data-pgtext]')){PG[t.dataset.pgtext]=t.value;const c=CMAP[STATE.route.split('/')[1]];if(c){const stage=$('#pg-stage');if(stage)stage.innerHTML=c.render(PG);const code=$('#pg-code pre code');if(code)code.innerHTML=hl(c.code(PG),'tsx');const cmp=$('#pg-compare');if(cmp)pgRefresh(c)}return}
});

/* ============ Boot ============ */
applyTheme();
STATE.route=location.hash.replace(/^#\//,'')||'home';
if(!PAGES[STATE.route])STATE.route='home';
{const c=STATE.route.startsWith('components/')?CMAP[STATE.route.split('/')[1]]:null;if(c)PG=pgDefaults(c)}
renderApp();
