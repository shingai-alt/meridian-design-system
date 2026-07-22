"use strict";
/* ============ Utilities ============ */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ICON_SVG={
  search:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  chevD:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  chevR:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
  sun:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/></svg>',
  contrast:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3v18" /><path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" stroke="none"/></svg>',
  density:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  code:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 7-5 5 5 5M16 7l5 5-5 5"/></svg>',
  menu:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  copy:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  check:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m4 12.5 5 5L20 6.5"/></svg>',
  x:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  plus:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  info:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
  warn:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17h.01"/></svg>',
  ok:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 5-6"/></svg>',
  err:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></svg>',
  spark:'<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c.6 4.8 2.7 7 7.5 7.5-4.8.6-7 2.7-7.5 7.5-.6-4.8-2.7-7-7.5-7.5C9.3 9 11.4 6.8 12 2Z"/><path d="M19 14c.3 2.4 1.3 3.4 3.7 3.7-2.4.3-3.4 1.3-3.7 3.7-.3-2.4-1.3-3.4-3.7-3.7 2.4-.3 3.4-1.3 3.7-3.7Z" opacity=".6"/></svg>',
  folder:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/></svg>',
  file:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6V3Z"/><path d="M14 3v4h4"/></svg>',
  send:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
  clip:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 12-8.5 8.5a5 5 0 0 1-7-7L14 5a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L16 7"/></svg>',
  bell:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 9a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M10 21h4"/></svg>',
  github:'<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.2-3.4-1.2-.4-1.1-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.6 1.1 1.6 1.1.9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7 0-.3-.4-1.3.1-2.7 0 0 .9-.3 2.8 1a9.5 9.5 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2Z"/></svg>',
  arrowR:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>',
  external:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
  download:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m-5-5 5 5 5-5M5 21h14"/></svg>',
  dots:'<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>',
  cal:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4m8-4v4M3 10h18"/></svg>',
  filter:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z"/></svg>',
  refresh:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6"/></svg>',
  cmd:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 9h6v6H9zM9 9H6a3 3 0 1 1 3-3v3Zm6 0h3a3 3 0 1 0-3-3v3ZM9 15H6a3 3 0 1 0 3 3v-3Zm6 0h3a3 3 0 1 1-3 3v-3Z"/></svg>',
  zap:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>',
  users:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 15.5a5.5 5.5 0 0 1 5.5 4.5"/></svg>',
  gear:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1Z"/></svg>'
};
const ICON_META_BY_ID=Object.fromEntries(ICON_META.map(icon=>[icon.id,icon]));
const I=Object.fromEntries(Object.entries(ICON_SVG).map(([id,svg])=>{
  const icon=ICON_META_BY_ID[id],size=ICON_SIZES[icon.defaultSize].value;
  return [id,svg
    .replace('<svg ',`<svg data-icon="${id}" data-directionality="${icon.directionality}" aria-hidden="true" focusable="false" `)
    .replace(/width="[^"]+"/,`width="${size}"`)
    .replace(/height="[^"]+"/,`height="${size}"`)];
}));

/* OKLCH色エンジン(buildPalettes/buildSemantics/buildCharts等)は
 * src/color-engine.js に切り出し済み。DOM非依存の純粋関数なので、
 * Node上で単体テストできる(test/color-engine.test.js)。 */

const STORED_THEME=localStorage.getItem('mrd.theme');
const STORED_CONTRAST=localStorage.getItem('mrd.contrast');
const LEGACY_HC=STORED_THEME==='hc';
const STATE={
  theme:['light','dark'].includes(STORED_THEME)?STORED_THEME:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'),
  contrast:LEGACY_HC?'high':['standard','high'].includes(STORED_CONTRAST)?STORED_CONTRAST:(matchMedia('(prefers-contrast: more)').matches?'high':'standard'),
  density: localStorage.getItem('mrd.density')||'default',
  seed: localStorage.getItem('mrd.seed')||'#5B5BD6',
  route: null, navOpen:false
};
let PALETTES={}, SEM={}, CHART=[];

function applyTheme(){
  const P=buildPalettes(STATE.seed);PALETTES=P;
  const T=buildSemantics(P,STATE.theme,STATE.contrast);SEM=T;
  CHART=buildCharts(STATE.seed,STATE.theme);
  const context=`${STATE.theme}-${STATE.contrast}`;
  const r=document.documentElement, st=r.style;
  r.dataset.theme=STATE.theme; r.dataset.contrast=STATE.contrast; r.dataset.density=STATE.density;
  for(const[k,v]of Object.entries(T)){
    const short=k.replace('foreground','fg').replace('background','bg');
    st.setProperty('--'+short,v);
  }
  st.setProperty('--fg',T.foreground);st.setProperty('--bg',T.background);
  // primitives
  for(const[name,scale]of Object.entries(P)){for(const[step,hex]of Object.entries(scale)){st.setProperty(`--${name==='neutralVariant'?'neutral-variant':name}-${step}`,hex)}}
  // Public component tokens are generated from tokens/src/component.json.
  for(const token of TOKEN_CATALOG.componentTokens){
    const source=token.aliases[context];
    const alias=typeof source==='string'&&/^\{color\.semantic\.([^}]+)\}$/.exec(source);
    st.setProperty(token.cssVariable,alias?T[alias[1]]:token.values[context]);
  }
  // Documentation code surfaces are private implementation values, not public tokens.
  const codeBg=STATE.theme==='dark'?(n950=>oklchToHex(16,n950.c,n950.h))(hexToOklch(P.neutral[950])):P.neutral[25];
  st.setProperty('--code-bg',codeBg);
  st.setProperty('--primary-fg',T['primary-foreground']);
  st.setProperty('--success-fg',T['success-foreground']);st.setProperty('--warning-fg',T['warning-foreground']);
  st.setProperty('--danger-fg',T['danger-foreground']);st.setProperty('--info-fg',T['info-foreground']);
  // code syntax
  if(STATE.theme==='dark'){st.setProperty('--code-k',P.accent[300]);st.setProperty('--code-s',P.success[400]);st.setProperty('--code-f',P.primary[300]);st.setProperty('--code-n',P.warning[400])}
  else{st.setProperty('--code-k',P.accent[700]);st.setProperty('--code-s',P.success[700]);st.setProperty('--code-f',P.primary[700]);st.setProperty('--code-n',P.warning[700])}
  // Shadow geometry is generated from tokens/src/shadow.json; themes only change its color modes.
  for(const[k,v]of Object.entries(SHADOW_THEME_COLORS[STATE.theme]))st.setProperty('--shadow-color-'+k,v);
  for(let i=0;i<6;i++)st.setProperty('--chart-'+(i+1),CHART[i]);
  const CHART_FG=chartForegrounds(CHART);
  for(let i=0;i<6;i++)st.setProperty('--chart-fg-'+(i+1),CHART_FG[i]);
  st.setProperty('--focus-w',STATE.contrast==='high'?'3px':'2px');
  localStorage.setItem('mrd.theme',STATE.theme);localStorage.setItem('mrd.contrast',STATE.contrast);localStorage.setItem('mrd.density',STATE.density);localStorage.setItem('mrd.seed',STATE.seed);
  document.dispatchEvent(new CustomEvent('mrd:theme'));
}

/* copy + toast */
function copyText(t,btn){navigator.clipboard.writeText(t).then(()=>{if(btn){const o=btn.innerHTML;btn.classList.add('ok');btn.innerHTML=I.check+' Copied';setTimeout(()=>{btn.classList.remove('ok');btn.innerHTML=o},1200)}else toast('コピーしました',t)})}
function toast(title,sub,tone){const r=$('#toast-root');const el=document.createElement('div');el.className='toastc';el.setAttribute('role',tone==='danger'?'alert':'status');
  el.innerHTML=`<span class="ic" style="color:var(--${tone==='danger'?'danger':tone==='success'?'success':'info'})">${tone==='danger'?I.err:tone==='success'?I.ok:I.info}</span><div style="flex:1;min-width:0"><b>${esc(title)}</b>${sub?`<span class="sub">${esc(sub)}</span>`:''}</div><button class="tb-btn" aria-label="閉じる" onclick="this.closest('.toastc').remove()">${I.x}</button>`;
  r.appendChild(el);setTimeout(()=>{
    el.style.transition='opacity var(--dur-slow) var(--ease-exit)';
    el.addEventListener('transitionend',()=>el.remove(),{once:true});
    el.style.opacity='0';
  },4000)}
document.addEventListener('click',e=>{
  const cp=e.target.closest('[data-copy]');if(cp){copyText(cp.dataset.copy,cp.classList.contains('cp')?cp:null);return}
});

/* simple syntax highlight */
function hl(code,lang){let s=esc(code);
  if(lang==='css'||lang==='json'){
    s=s.replace(/(&quot;[^&]*?&quot;)/g,'<span class="tk-s">$1</span>');
    s=s.replace(/(--[\w-]+)/g,'<span class="tk-f">$1</span>');
    s=s.replace(/(\/\*[\s\S]*?\*\/)/g,'<span class="tk-c">$1</span>');
    s=s.replace(/\b(\d+(?:\.\d+)?(?:px|ms|rem|em|%)?)\b/g,'<span class="tk-n">$1</span>');
  } else {
    s=s.replace(/(\/\/[^\n]*)/g,'<span class="tk-c">$1</span>');
    s=s.replace(/(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;|'[^']*'|`[^`]*`)/g,'<span class="tk-s">$1</span>');
    s=s.replace(/\b(import|from|export|const|let|return|function|default|new|if|else|async|await|true|false|null)\b/g,'<span class="tk-k">$1</span>');
    s=s.replace(/(&lt;\/?)([A-Z][\w.]*)/g,'$1<span class="tk-f">$2</span>');
    s=s.replace(/\s([a-zA-Z-]+)=(?=&quot;|\{)/g,' <span class="tk-n">$1</span>=');
  }
  return s}
function codeBlock(code,lang='tsx',label){
  return `<div class="codeblock"><div class="cb-hd">${esc(label||lang)}<button class="cp cb-copy-btn" data-copy="${esc(code)}">${I.copy} Copy</button></div><pre><code>${hl(code,lang)}</code></pre></div>`}
