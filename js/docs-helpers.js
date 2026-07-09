"use strict";
/* ============ Docs helpers ============ */
const PAGES={};
function docPage(id,fn){PAGES[id]=fn}
function shell(html,opts={}){return `<div class="doc-wrap ${opts.wide?'wide':''} ${opts.toc===false?'no-toc':''}"><article class="doc" id="doc-body">${html}</article>${opts.toc!==false&&!opts.wide?'<nav class="toc" id="toc" aria-label="このページ"></nav>':''}</div>`}
function head(eyebrow,title,lead){return `<p class="eyebrow">${esc(eyebrow)}</p><h1>${esc(title)}</h1><p class="lead">${lead}</p>`}
let H2N=0;
function h2(t){return `<h2 id="s-${++H2N}">${t}</h2>`}
function nextPrev(prev,next){let s='<div class="next-prev">';
  if(prev)s+=`<a href="#/${prev[0]}"><small>← 前へ</small>${esc(prev[1])}</a>`;
  if(next)s+=`<a class="n" href="#/${next[0]}"><small>次へ →</small>${esc(next[1])}</a>`;
  return s+'</div>'}
function preview(html,label){return `<div class="panel" style="margin:var(--sp-3) 0;overflow:hidden">${label?`<div style="padding:6px 14px;border-bottom:1px solid var(--border-muted);font-size:var(--text-micro);color:var(--fg-subtle);text-transform:uppercase;letter-spacing:.05em;font-weight:600">${esc(label)}</div>`:''}<div style="padding:var(--sp-6);display:flex;align-items:center;justify-content:center;gap:var(--sp-3);flex-wrap:wrap;background:var(--bg-subtle)">${html}</div></div>`}

