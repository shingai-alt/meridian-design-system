"use strict";
/* ============ Tokens ============ */
function tokenTable(keys){
  const L=buildSemantics(PALETTES,'light'),D=buildSemantics(PALETTES,'dark'),H=buildSemantics(PALETTES,'hc');
  return `<div class="tscroll"><table class="ttable"><thead><tr><th>Token</th><th>意味</th><th>Light</th><th>Dark</th><th>HC</th><th></th></tr></thead><tbody>
  ${keys.map(k=>{const m=SEM_META.find(x=>x[0]===k)||[k,'',''];const name='--'+k.replace('foreground','fg').replace('background','bg');
  const cell=v=>`<span class="swpair"><span class="sw" style="background:${v}"></span><span class="mono" style="font-size:10.5px">${v}</span></span>`;
  return `<tr><td class="mono">${name}</td><td style="color:var(--fg-muted)">${m[1]}<div style="font-size:10.5px;color:var(--fg-subtle)">${m[2]}</div></td><td>${cell(L[k])}</td><td>${cell(D[k])}</td><td>${cell(H[k])}</td><td><button class="cp" data-copy="var(${name})">${I.copy}</button></td></tr>`}).join('')}
  </tbody></table></div>`}
docPage('tokens/overview',()=>shell(`
${head('Tokens','Token Overview',`Meridian の全トークンです。値は現在の Seed(<code class="inline">${STATE.seed}</code>)から生成されたライブな値で、Seed を変えるとこの表も変わります。`)}
${h2('Semantic color tokens(42)')}
${tokenTable(SEM_META.map(m=>m[0]))}
${h2('その他のトークン群')}
<div class="grid3">
${[['Color Tokens','Primitive 9 系統 × 11 段','tokens/color'],['Typography Tokens','16 スタイル','tokens/typography'],['Spacing Tokens','16 段スケール','tokens/spacing'],['Radius Tokens','9 段','tokens/radius'],['Shadow Tokens','7 段(テーマ連動)','tokens/shadow'],['Motion Tokens','Duration 5 + Easing 4','tokens/motion'],['Component Tokens','コンポーネント固有','tokens/component'],['Theme Tokens','テーマ切替の仕組み','tokens/theme'],['Density Tokens','密度切替の仕組み','tokens/density']].map(([t,d,l])=>`<a class="comp-tile" href="#/${l}" style="padding:var(--sp-3) var(--sp-4)"><b style="font-size:var(--text-label)">${t}</b><div style="font-size:var(--text-micro);color:var(--fg-subtle)">${d}</div></a>`).join('')}
</div>
${h2('出力形式')}
<p><a href="#/tokens/css-variables">CSS Variables</a> と <a href="#/tokens/json-tokens">JSON Tokens</a>(W3C Design Tokens 形式)で全量をエクスポートできます。</p>`));
docPage('tokens/color',()=>{const P=PALETTES;return shell(`
${head('Tokens','Color Tokens','Primitive palette(9 系統 × 11 段)の全値です。セルをクリックでコピーできます。')}
${h2('Primitive palettes')}
<div class="panel pad" style="overflow-x:auto">
${Object.entries(P).map(([n,s])=>`<div class="pal"><span class="nm">${n==='neutralVariant'?'neutral-var':n}</span>${STEPS.map(st=>`<button class="cell" style="background:${s[st]}" data-copy="${s[st]}" title="${n}-${st}"><span style="color:${L_MAP[st]>60?'rgba(0,0,0,.55)':'rgba(255,255,255,.8)'}">${st}</span></button>`).join('')}</div>`).join('')}
</div>
<div class="callout warn">${I.warn}<span>Primitive はデザイン・実装で直接使用しないでください。必ず <a href="#/tokens/overview">Semantic tokens</a> を経由します。</span></div>`)});
docPage('tokens/typography',()=>PAGES['foundations/typography']());
docPage('tokens/spacing',()=>shell(`
${head('Tokens','Spacing Tokens','4px 基数・16 段のスケールです。')}
${h2('Scale')}
<div class="tscroll"><table class="ttable"><thead><tr><th>Token</th><th>Value</th><th></th></tr></thead><tbody>${SPACE_SCALE.map(([k,v])=>`<tr><td class="mono">--space-${k}</td><td class="mono">${v}</td><td><button class="cp" data-copy="var(--sp-${k.replace('.','')})">${I.copy}</button></td></tr>`).join('')}</tbody></table></div>
<p style="margin-top:var(--sp-3)">思想と使い方は <a href="#/foundations/spacing">Foundations / Spacing</a> を参照。</p>`));
docPage('tokens/radius',()=>PAGES['foundations/radius']());
docPage('tokens/shadow',()=>shell(`
${head('Tokens','Shadow Tokens','影はテーマに連動します。Light では Seed 色相を帯びたニュートラルの低透明度、Dark では黒ベースでやや強めです。')}
${h2('現在のテーマの値')}
${codeBlock(['xs','sm','md','lg','overlay'].map(k=>`--shadow-${k}: ${getComputedStyle(document.documentElement).getPropertyValue('--shadow-'+k).trim()};`).join('\n'),'css','generated shadows ('+STATE.theme+')')}
<p>視覚プレビューは <a href="#/foundations/elevation">Elevation</a> を参照。</p>`));
docPage('tokens/motion',()=>PAGES['foundations/motion']());
docPage('tokens/component',()=>shell(`
${head('Tokens','Component Tokens','コンポーネント固有トークンの一覧です。すべて Semantic 層への参照で定義されます。')}
${h2('定義')}
${codeBlock(`/* Button */\n--button-primary-bg:        var(--primary);\n--button-primary-bg-hover:  var(--primary-hover);\n--button-primary-bg-active: var(--primary-active);\n--button-primary-fg:        var(--primary-foreground);\n--button-secondary-bg:      var(--surface);\n--button-secondary-border:  var(--border);\n\n/* Input */\n--input-bg:            var(--surface);\n--input-border:        var(--border);\n--input-border-focus:  var(--primary);\n--input-placeholder:   var(--fg-subtle);\n\n/* Table / Sidebar / Overlay */\n--table-row-hover:         color-mix(in srgb, var(--fg) 3%, transparent);\n--sidebar-bg:              var(--bg-subtle);\n--sidebar-item-active-bg:  var(--primary-subtle);\n--tooltip-bg:              var(--surface-inverse);\n--dialog-bg:               var(--surface-overlay);`,'css','component-tokens.css')}
${h2('現在の解決値')}
<div class="tscroll"><table class="ttable"><thead><tr><th>Token</th><th>Value</th><th></th></tr></thead><tbody>
${['button-primary-bg','button-primary-bg-hover','button-primary-fg','input-bg','input-border','input-border-focus','table-row-hover','sidebar-bg','sidebar-item-active-bg','tooltip-bg'].map(k=>{const v=getComputedStyle(document.documentElement).getPropertyValue('--'+k).trim();return `<tr><td class="mono">--${k}</td><td><span class="swpair"><span class="sw" style="background:${v}"></span><span class="mono" style="font-size:10.5px">${v}</span></span></td><td><button class="cp" data-copy="var(--${k})">${I.copy}</button></td></tr>`}).join('')}
</tbody></table></div>`));
docPage('tokens/theme',()=>shell(`
${head('Tokens','Theme Tokens','テーマは Semantic 層のマッピング差し替えとして実装します。コンポーネントの CSS は一切変更しません。')}
${codeBlock(`html[data-theme="light"] { --bg: /* neutral-25 */; --fg: /* neutral-900 */; … }\nhtml[data-theme="dark"]  { --bg: /* neutral-950 系 */; --fg: /* neutral-50 */; … }\nhtml[data-theme="hc"]    { --border: /* neutral-500 */; --focus-w: 3px; … }`,'css','theme switching')}
<ul class="plain">
<li>Dark は「Light の反転」ではなく独自マッピング。primary は 600 → 400 に上げ、subtle 面は黒混合で作る。</li>
<li>High contrast は Light ベースで、テキストを近似黒・ボーダーを 2 段強く・フォーカスリングを 3px にする。</li>
<li>テーマ間で「トークン名と用途」は不変。変わるのは値だけ。</li>
</ul>
<p>3 テーマの比較値は <a href="#/tokens/overview">Token Overview</a> の表を参照。</p>`));
docPage('tokens/density',()=>shell(`
${head('Tokens','Density Tokens','密度はサイズ・余白系トークンの一括切替として実装します。')}
${codeBlock(`html[data-density="compact"] {\n  --ctl-md: 28px;  --text-body: 13px;  --row-h: 32px;\n  --card-pad: 12px; --gap-form: 12px;  --lh-normal: 1.45;\n}\nhtml[data-density="default"] {\n  --ctl-md: 32px;  --text-body: 14px;  --row-h: 40px;\n  --card-pad: 16px; --gap-form: 16px;  --lh-normal: 1.55;\n}\nhtml[data-density="comfortable"] {\n  --ctl-md: 36px;  --text-body: 15px;  --row-h: 48px;\n  --card-pad: 20px; --gap-form: 20px;  --lh-normal: 1.65;\n}`,'css','density.css')}
${preview(`<div style="display:flex;flex-direction:column;gap:12px;width:min(420px,100%)">${fieldEl({label:'プロジェクト名',placeholder:'Acme Dashboard'})}${btn({label:'保存',size:'md'})}</div>`,'Live — 右上メニューから密度を切替')}
<ul class="plain"><li>コンポーネントは密度を「知らない」。トークンを参照しているだけで自動追従する。</li><li>密度はアプリ全体で 1 つ。画面ごとに混在させない(テーブルのみの row-density 上書きは例外的に許可)。</li></ul>`));
docPage('tokens/css-variables',()=>{
  const T=SEM;const cs=getComputedStyle(document.documentElement);
  const g=k=>cs.getPropertyValue(k).trim();
  const code=`:root {\n  /* color (semantic) */\n  --color-bg: ${T.background};\n  --color-surface: ${T.surface};\n  --color-text: ${T.foreground};\n  --color-text-muted: ${T['foreground-muted']};\n  --color-border: ${T.border};\n  --color-primary: ${T.primary};\n  --color-primary-hover: ${T['primary-hover']};\n  --color-primary-active: ${T['primary-active']};\n  --color-primary-foreground: ${T['primary-foreground']};\n  --color-success: ${T.success};\n  --color-danger: ${T.danger};\n  --color-focus-ring: ${T['focus-ring']};\n\n  /* typography */\n  --font-sans: 'Inter', 'Noto Sans JP', system-ui, sans-serif;\n  --font-mono: 'JetBrains Mono', ui-monospace, monospace;\n  --text-body: ${g('--text-body')};\n  --text-label: ${g('--text-label')};\n  --line-height-normal: ${g('--lh-normal')};\n\n  /* spacing */\n  --space-1: 4px;\n  --space-2: 8px;\n  --space-3: 12px;\n  --space-4: 16px;\n\n  /* radius */\n  --radius-sm: 6px;\n  --radius-md: 8px;\n  --radius-lg: 10px;\n\n  /* elevation */\n  --shadow-sm: ${g('--shadow-sm')};\n  --shadow-md: ${g('--shadow-md')};\n\n  /* motion */\n  --duration-fast: 120ms;\n  --duration-normal: 180ms;\n}`;
  return shell(`${head('Tokens','CSS Variables','現在の Seed / テーマ / 密度から生成された CSS Variables です。コピーしてそのまま利用できます。')}
${codeBlock(code,'css',`meridian.css — theme: ${STATE.theme} / density: ${STATE.density} / seed: ${STATE.seed}`)}
<p>全 Semantic トークン・Primitive を含む完全版は <code class="inline">@meridian/tokens/css</code> で配布されます。</p>`)});
docPage('tokens/json-tokens',()=>{
  const T=SEM;
  const json={"$schema":"https://design-tokens.org","color":{"seed":{"value":STATE.seed},"background":{"value":"{primitive.neutral.25}","resolved":T.background},"surface":{"value":"{primitive.neutral.0}","resolved":T.surface},"foreground":{"value":"{primitive.neutral.900}","resolved":T.foreground},"primary":{"value":"{primitive.primary.600}","resolved":T.primary},"primary-hover":{"value":"{primitive.primary.700}","resolved":T['primary-hover']},"danger":{"value":"{primitive.danger.600}","resolved":T.danger}},"space":{"2":{"value":"8px"},"4":{"value":"16px"}},"radius":{"md":{"value":"8px"}},"duration":{"fast":{"value":"120ms"}}};
  return shell(`${head('Tokens','JSON Tokens','W3C Design Tokens 形式の出力です(抜粋)。参照(alias)と解決値の両方を持ち、Figma Variables へそのままインポートできます。')}
${codeBlock(JSON.stringify(json,null,2),'json','meridian.tokens.json')}`)});

