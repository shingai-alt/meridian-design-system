"use strict";
/* ============ Component detail pages + Playground ============ */
const simCSS=document.createElement('style');
simCSS.textContent=`.sim-hover{filter:brightness(.955)}html[data-theme="dark"] .sim-hover{filter:brightness(1.18)}.sim-active{filter:brightness(.9)}html[data-theme="dark"] .sim-active{filter:brightness(1.3)}.sim-focus{outline:var(--focus-w) solid var(--focus-ring);outline-offset:2px;border-radius:var(--radius-2xs)}`;
document.head.appendChild(simCSS);

function themeVars(th){
  const t=buildSemantics(PALETTES,th);
  const m={'--bg':t.background,'--bg-subtle':t['background-subtle'],'--surface':t.surface,'--surface-muted':t['surface-muted'],'--surface-overlay':t['surface-overlay'],'--surface-inverse':t['surface-inverse'],'--fg':t.foreground,'--fg-muted':t['foreground-muted'],'--fg-subtle':t['foreground-subtle'],'--border':t.border,'--border-muted':t['border-muted'],'--border-strong':t['border-strong'],'--primary':t.primary,'--primary-hover':t['primary-hover'],'--primary-active':t['primary-active'],'--primary-subtle':t['primary-subtle'],'--primary-muted':t['primary-muted'],'--primary-fg':t['primary-foreground'],'--success':t.success,'--success-subtle':t['success-subtle'],'--success-fg':t['success-foreground'],'--warning':t.warning,'--warning-subtle':t['warning-subtle'],'--warning-fg':t['warning-foreground'],'--danger':t.danger,'--danger-subtle':t['danger-subtle'],'--danger-fg':t['danger-foreground'],'--info':t.info,'--info-subtle':t['info-subtle'],'--info-fg':t['info-foreground'],'--focus-ring':t['focus-ring'],'--button-primary-bg':t.primary,'--button-primary-bg-hover':t['primary-hover'],'--button-primary-bg-active':t['primary-active'],'--button-primary-fg':t['primary-foreground'],'--input-bg':th==='dark'?t['surface-muted']:t.surface,'--input-border':th==='hc'?t['border-strong']:t.border,'--input-border-focus':t.primary,'--input-placeholder':t['foreground-subtle'],'--sidebar-bg':th==='dark'?t.background:t['background-subtle'],'--sidebar-item-active-bg':t['primary-subtle'],'--tooltip-bg':t['surface-inverse'],'--table-row-hover':th==='dark'?'rgba(255,255,255,.035)':'rgba(0,0,0,.028)'};
  return Object.entries(m).map(([k,v])=>`${k}:${v}`).join(';');
}

let PG={};
function pgDefaults(c){const p={};
  if(c.variants)p.variant=c.variants[0];
  if(c.sizes)p.size=c.sizes.includes('md')?'md':c.sizes[0];
  p.state='default';
  (c.texts||[]).forEach(([k,,d])=>p[k]=d);
  (c.flags||[]).forEach(([k])=>p[k]=false);
  p._bg='muted';
  return p}
function pgControls(c){
  const opt=(key,vals,cur)=>`<div class="ctl"><span>${key}</span><div class="opts">${vals.map(v=>`<button class="opt" data-pg="${key}" data-val="${v}" aria-pressed="${String(cur)===String(v)}">${v}</button>`).join('')}</div></div>`;
  let s='';
  if(c.variants)s+=opt('variant',c.variants,PG.variant);
  if(c.sizes)s+=opt('size',c.sizes,PG.size);
  if(c.states&&c.states.length>1)s+=opt('state',c.states,PG.state);
  (c.flags||[]).forEach(([k,l])=>{s+=`<div class="ctl"><label class="switch"><input type="checkbox" data-pgflag="${k}" ${PG[k]?'checked':''}><span>${l}</span></label></div>`});
  (c.texts||[]).forEach(([k,l])=>{s+=`<div class="ctl"><span>${l}</span><div class="input" data-size="sm"><input data-pgtext="${k}" value="${esc(PG[k]||'')}"></div></div>`});
  s+=opt('preview bg',['muted','surface','bg'],PG._bg).replace(/data-pg="preview bg"/g,'data-pg="_bg"');
  s+=`<div class="ctl"><span>Global</span><div class="opts">
    <button class="opt" data-cycletheme>theme: ${STATE.theme}</button>
    <button class="opt" data-cycledensity>density: ${STATE.density}</button></div>
    <div class="rowflex" style="margin-top:8px;gap:5px">${SEED_PRESETS.slice(0,5).map(sd=>`<button class="seeddot" style="background:${sd.hex};width:18px;height:18px" data-seed="${sd.hex}" aria-pressed="${STATE.seed.toLowerCase()===sd.hex.toLowerCase()}" aria-label="Seed ${sd.name}"></button>`).join('')}<input type="color" value="${STATE.seed}" data-seedpick style="width:24px;height:20px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface);padding:1px;cursor:pointer"></div></div>`;
  return s}
function pgRefresh(c){
  const stage=$('#pg-stage');if(!stage)return;
  stage.innerHTML=c.render(PG);
  stage.parentElement.dataset.bg=PG._bg;
  const code=$('#pg-code');if(code){const src=c.code(PG);code.innerHTML=`<div class="codeblock"><div class="cb-hd">Usage<button class="cp" data-copy="${esc(src)}">${I.copy} Copy</button></div><pre><code>${hl(src,'tsx')}</code></pre></div>`}
  const cmp=$('#pg-compare');if(cmp){cmp.innerHTML=[['light','Light'],['dark','Dark'],['hc','High contrast']].map(([th,l])=>{const t=buildSemantics(PALETTES,th);return `<div style="${themeVars(th)};background:${t.background};color:${t.foreground}"><span class="cl" style="color:${t['foreground-subtle']}">${l}</span>${c.render(PG)}</div>`}).join('')}
}
function playground(c){
  return `<div class="pg" id="pg-root">
  <div class="pg-top">
    <div class="pg-preview" data-bg="${PG._bg}"><div id="pg-stage" style="max-width:100%">${c.render(PG)}</div></div>
    <div class="pg-controls" id="pg-ctl">${pgControls(c)}</div>
  </div>
  <div class="pg-code" id="pg-code"></div>
  <div class="pg-compare" id="pg-compare"></div>
  <div class="pg-tokens"><div class="t">Tokens used</div><div class="rowflex">${c.tokens.map(t=>`<button class="tokchip" data-copy="var(${t.startsWith('--')?t:'--'+t})">${t}</button>`).join('')}</div></div>
  </div>`}

function componentPage(c){
  const li=a=>a.map(x=>`<li>${x}</li>`).join('');
  const statesRow=c.states&&c.states.length>1?`${h2('States')}<div class="panel pad" style="display:flex;gap:var(--sp-5);flex-wrap:wrap;align-items:flex-start;background:var(--bg-subtle)">${c.states.map(st=>`<div style="text-align:center"><div style="margin-bottom:8px">${c.render({...pgDefaults(c),state:st})}</div><code class="inline" style="font-size:10px">${st}</code></div>`).join('')}</div>`:'';
  const variantsRow=c.variants?`${h2('Variants')}<div class="panel pad" style="display:flex;gap:var(--sp-4);flex-wrap:wrap;align-items:flex-start;background:var(--bg-subtle)">${c.variants.map(v=>`<div style="text-align:center"><div style="margin-bottom:8px">${c.render({...pgDefaults(c),variant:v})}</div><code class="inline" style="font-size:10px">${v}</code></div>`).join('')}</div>`:'';
  const sizesRow=c.sizes?`${h2('Sizes')}<div class="panel pad" style="display:flex;gap:var(--sp-4);flex-wrap:wrap;align-items:center;background:var(--bg-subtle)">${c.sizes.map(v=>`<div style="text-align:center"><div style="margin-bottom:8px">${c.render({...pgDefaults(c),size:v})}</div><code class="inline" style="font-size:10px">${v}</code></div>`).join('')}</div>`:'';
  const props=[];
  if(c.variants)props.push(['variant',c.variants.map(v=>`"${v}"`).join(' | '),`"${c.variants[0]}"`,'見た目のバリアント']);
  if(c.sizes)props.push(['size',c.sizes.map(v=>`"${v}"`).join(' | '),'"md"','サイズ']);
  if((c.states||[]).includes('disabled'))props.push(['disabled','boolean','false','操作不可(送信対象外)']);
  if((c.states||[]).includes('loading'))props.push(['loading','boolean','false','読み込み中表示']);
  (c.texts||[]).forEach(([k,l])=>props.push([k,'string','—',l]));
  (c.flags||[]).forEach(([k,l])=>props.push([k,'boolean','false',l]));
  const dodont=(c.dos||c.donts)?`${h2("Do / Don't")}<div class="dodont">
    ${(c.dos||[]).map(([fn,t])=>`<div class="box do"><div class="cap">${I.check} Do</div><div class="bd">${fn()}</div><div class="tx">${t}</div></div>`).join('')}
    ${(c.donts||[]).map(([fn,t])=>`<div class="box dont"><div class="cap">${I.x} Don't</div><div class="bd">${fn()}</div><div class="tx">${t}</div></div>`).join('')}
  </div>`:'';
  return shell(`
${head('Components · '+c.group,c.name,c.desc)}
${playground(c)}
${c.anatomy?`${h2('Anatomy')}<ul class="plain">${li(c.anatomy.map(a=>`<b>${a[0]}.</b> ${a[1]}`))}</ul>`:''}
${c.when?`${h2('When to use')}<ul class="plain">${li(c.when)}</ul>`:''}
${c.notWhen?`${h2('When not to use')}<ul class="plain">${li(c.notWhen)}</ul>`:''}
${c.usage?`${h2('Usage')}<ul class="plain">${li(c.usage)}</ul>`:''}
${variantsRow}${sizesRow}${statesRow}
${props.length?`${h2('Props / API')}<div class="tscroll"><table class="ttable"><thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>説明</th></tr></thead><tbody>${props.map(p=>`<tr><td class="mono">${p[0]}</td><td class="mono" style="font-size:11px;color:var(--fg-muted)">${esc(p[1])}</td><td class="mono">${esc(p[2])}</td><td style="color:var(--fg-muted)">${p[3]}</td></tr>`).join('')}</tbody></table></div>`:''}
${h2('Design tokens')}<div class="rowflex" style="gap:6px">${c.tokens.map(t=>`<button class="tokchip" data-copy="var(${t.startsWith('--')?t:'--'+t})">${t}</button>`).join('')}</div>
${h2('Accessibility')}<ul class="plain">${li(c.a11y)}</ul>
${c.keys?`${h2('Keyboard interaction')}<div class="tscroll"><table class="ttable"><thead><tr><th style="width:180px">Key</th><th>Action</th></tr></thead><tbody>${c.keys.map(k=>`<tr><td><kbd style="border:1px solid var(--border);border-radius:var(--radius-2xs);padding:1px 7px;font-size:11px;background:var(--surface-muted)">${k[0]}</kbd></td><td style="color:var(--fg-muted)">${k[1]}</td></tr>`).join('')}</tbody></table></div>`:''}
${dodont}
${h2('Responsive behavior')}
<p class="muted" style="font-size:var(--text-label)">サイズ・余白は density トークンに連動し、タッチ環境では Comfortable 密度でヒット領域 40px 以上を確保します。モバイル幅では full width 配置を推奨します。</p>
${c.related.length?`${h2('Related components')}<div class="rowflex">${c.related.map(r=>CMAP[r]?`<a class="btn" data-variant="secondary" data-size="sm" href="#/components/${r}">${CMAP[r].name}</a>`:PAGES['foundations/'+r]?`<a class="btn" data-variant="secondary" data-size="sm" href="#/foundations/${r}">${r}</a>`:PAGES['templates/'+r]||PAGES['patterns/'+r]?`<a class="btn" data-variant="secondary" data-size="sm" href="#/${PAGES['templates/'+r]?'templates':'patterns'}/${r}">${r}</a>`:'').join('')}</div>`:''}
`)}
for(const c of COMPONENTS){docPage('components/'+c.id,()=>componentPage(c))}

