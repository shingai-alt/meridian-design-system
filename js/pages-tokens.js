"use strict";
/* ============ Tokens ============ */
const tokenSwatch=(value)=>`<span class="swpair"><span class="sw" style="background:${value}"></span><span class="mono">${value}</span></span>`;
const tokenCopy=(value,label)=>`<button class="cp" data-copy="${esc(value)}" aria-label="${esc(label)}をコピー">${I.copy}</button>`;
const tokenAlias=(value)=>typeof value==='string'?value:JSON.stringify(value);
const tokenValue=(value)=>value&&typeof value==='object'&&'value' in value?`${value.value}${value.unit}`:String(value);
const currentCssValue=(name)=>getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const sourceLink=(path)=>`<code class="inline">${esc(path)}</code>`;
const TOKEN_CONTEXT_SHORT={'light-standard':'LS','dark-standard':'DS','light-high':'LH','dark-high':'DH'};

function semanticTokenTable(rows=TOKEN_CATALOG.semanticTokens){
  return `<div class="tscroll"><table class="ttable"><thead><tr><th>Token</th><th>意味 / 用途</th>${TOKEN_CATALOG.contexts.map(context=>`<th>${context.label}</th>`).join('')}<th></th></tr></thead><tbody>
  ${rows.map(row=>`<tr><td><code>${row.cssVariable}</code><div class="mono" style="color:var(--fg-subtle);margin-top:2px">color.semantic.${row.token}</div></td><td><b>${esc(row.meaning)}</b><div style="color:var(--fg-muted)">${esc(row.usage)}</div></td>${TOKEN_CATALOG.contexts.map(context=>`<td>${tokenSwatch(row.values[context.id])}</td>`).join('')}<td>${tokenCopy(`var(${row.cssVariable})`,row.cssVariable)}</td></tr>`).join('')}
  </tbody></table></div>`;
}

function outputTable(){
  return `<div class="tscroll"><table class="ttable"><thead><tr><th>生成物</th><th>形式</th><th>Context</th><th>Token count</th></tr></thead><tbody>${TOKEN_CATALOG.outputs.map(output=>`<tr><td><code>${output.path}</code></td><td>${output.format}</td><td>${output.context}</td><td class="mono">${output.tokenCount??'CSS declarations'}</td></tr>`).join('')}</tbody></table></div>`;
}

docPage('tokens/overview',()=>shell(`
${head('Tokens','Token Overview','Meridianの設計判断を、正本・生成処理・CSS・DTCG JSONまで追跡できるtoken systemです。値を手で転記せず、すべて同じsourceから再生成します。')}
<div class="callout info">${I.info}<span>現在の配布境界はrepository内の生成ファイルです。npm packageとReact packageは今後追加します。存在しないpackage名を利用手順として先行公開しません。</span></div>
${h2('Source of truth')}
<div class="grid3">${TOKEN_CATALOG.layers.map((layer,index)=>`<div class="cardc"><div class="rowflex" style="justify-content:space-between"><b>${index+1}. ${layer.label}</b>${badge({label:layer.id,tone:layer.id==='semantic'?'primary':layer.id==='component'?'warning':'neutral'})}</div><p style="color:var(--fg-muted);font-size:var(--text-small);margin:var(--sp-2) 0 0">${layer.description}</p></div>`).join('')}</div>
<ol class="plain" style="margin-top:var(--sp-4)">
<li><b>編集する:</b> <code class="inline">tokens/src/*.json</code>、<code class="inline">design/semantic-tokens.json</code>、<code class="inline">src/color-engine.js</code>を目的に応じて更新する。</li>
<li><b>生成する:</b> <code class="inline">npm run build:tokens</code>でCSS、theme × contrastの4 JSON、documentation metadataを同時に作る。</li>
<li><b>検証する:</b> <code class="inline">npm run check:tokens</code>でDTCG構造、alias、型、生成差分を拒否する。</li>
<li><b>利用する:</b> product codeはSemantic tokenを基本とし、policy triggerのあるComponent tokenだけを例外として使う。</li>
</ol>
${h2('Token families')}
<div class="tscroll"><table class="ttable"><thead><tr><th>Family</th><th>Layer</th><th>Count</th><th>Source</th><th>CSS output</th></tr></thead><tbody>${TOKEN_CATALOG.families.map(family=>`<tr><td style="font-weight:550">${family.label}</td><td>${badge({label:family.layer,tone:family.layer==='semantic'?'primary':family.layer==='component'?'warning':'neutral'})}</td><td class="mono">${family.count}</td><td><code>${family.source}</code></td><td class="mono">${family.css}</td></tr>`).join('')}</tbody></table></div>
${h2('Generated outputs')}
${outputTable()}
<p>生成CSSは2 theme × 2 contrast、3 density、reduced motionを含みます。JSONはtool側のmodifier対応差を避けるため、modifier contextを解決した4 bundleに分けています。bundle内aliasは保持し、正本からいつでも再生成できる配布物です。</p>
${h2('Naming and consumption')}
<ul class="plain">
<li>DTCG pathはdot区切り、CSS Custom Propertyはkebab-caseで出力する。</li>
<li>Referenceはgenerator、resolver、Semantic tokenだけが参照する。product UIからPrimitive colorやspacing実値を直接選ばない。</li>
<li>既存の短いCSS名(<code class="inline">--bg</code>、<code class="inline">--fg</code>、<code class="inline">--sp-4</code>など)は現行Web実装の互換APIとして維持する。</li>
<li>Component tokenは<code class="inline">design/token-policy.json</code>のtrigger、reason、aliasを持ち、未使用tokenを追加しない。</li>
</ul>
${h2('Specification baseline')}
<p>${TOKEN_CATALOG.specification.name} <b>${TOKEN_CATALOG.specification.version}</b>を交換形式の基準にします。これは安定版のW3C Community Group Final Reportですが、W3C Recommendationではありません。</p>
<ul class="plain">
<li><a href="${TOKEN_CATALOG.specification.formatUrl}">DTCG Format Module 2025.10</a>: token、group、type、alias、file extension。</li>
<li><a href="${TOKEN_CATALOG.specification.colorUrl}">DTCG Color Module 2025.10</a>: color space、components、alpha、fallback hex。</li>
<li><a href="${TOKEN_CATALOG.specification.resolverUrl}">DTCG Resolver Module 2025.10</a>: set、modifier、context、resolution order。</li>
</ul>
${nextPrev(['overview/architecture','System Architecture'],['tokens/color','Color Tokens'])}`));

docPage('tokens/color',()=>{
  const paletteRows=Object.entries(PALETTES).flatMap(([family,scale])=>Object.entries(scale).map(([step,value])=>({family:family==='neutralVariant'?'neutral-variant':family,step,value})));
  return shell(`
${head('Tokens','Color Tokens',`${paletteRows.length}のgenerated Reference colorと${TOKEN_CATALOG.semanticTokens.length}のSemantic colorを、現在のSeedと4つの配布contextで確認します。`)}
${h2('Generator input and output')}
<p>Seedはtoken layerではなくgenerator inputです。ドキュメントサイトでは現在のSeed <code class="inline">${STATE.seed}</code>を即時生成し、再現可能な配布物は既定Seed <code class="inline">${TOKEN_CATALOG.defaultSeed}</code>で固定します。</p>
<div class="callout">${I.info}<span>${TOKEN_CATALOG.liveSeedBehavior}</span></div>
${h2('Reference palettes')}
<p>9 familyをOKLCHからsRGBへgamut mappingして生成します。Neutral系にはcanvas用の0 / 25もあるため、単純な「9 × 11」ではなく現在は全${paletteRows.length}値です。</p>
<div class="tscroll"><table class="ttable"><thead><tr><th>Path</th><th>Value</th><th></th></tr></thead><tbody>${paletteRows.map(row=>`<tr><td class="mono">color.reference.${row.family}.${row.step}</td><td>${tokenSwatch(row.value)}</td><td>${tokenCopy(row.value,`${row.family}-${row.step}`)}</td></tr>`).join('')}</tbody></table></div>
<div class="callout warn" style="margin-top:var(--sp-3)">${I.warn}<span>Reference colorはpalette生成・contrast解決のための値です。product UIとcomponent実装では直接使わず、Semanticまたは承認済みComponent tokenを参照します。</span></div>
${h2('Semantic colors')}
${semanticTokenTable()}
${h2('Runtime validation')}
<ul class="plain">
<li>主要text pairはStandardで4.5:1、Highで7:1を目標に、Light / Darkそれぞれでstepを探索する。</li>
<li><code class="inline">*-on-solid</code>とchart foregroundは実際の背景色に対して明暗どちらか高いcontrastを選ぶ。</li>
<li>色だけをstate・error・selectionの唯一の手掛かりにせず、label、icon、border、shapeを併用する。</li>
<li>新しいSemantic colorは意味、使用範囲、全contextの値、contrast pairを揃えて追加する。</li>
</ul>
<p>色の設計原則とcontrast checkerは <a href="#/foundations/color">Foundations / Color</a> を参照してください。</p>
${nextPrev(['tokens/overview','Token Overview'],['tokens/typography','Typography Tokens'])}`)});

docPage('tokens/typography',()=>shell(`
${head('Tokens','Typography Tokens',`${TYPE_SCALE.length}のsemantic typography roleをDTCG composite tokenとして管理し、CSS shorthandと個別propertyへ展開します。`)}
${h2('Canonical source')}
<p>${sourceLink('tokens/src/typography.json')}が正本です。各tokenは<code class="inline">fontFamily</code>、<code class="inline">fontSize</code>、<code class="inline">fontWeight</code>、<code class="inline">letterSpacing</code>、<code class="inline">lineHeight</code>を一体で持ちます。</p>
<div class="tscroll"><table class="ttable"><thead><tr><th>Path / CSS</th><th>Role</th><th>Size / line-height</th><th>Weight</th><th>Usage</th><th></th></tr></thead><tbody>${TYPE_SCALE.map(role=>`<tr><td><code>typography.${role.id}</code><div class="mono" style="color:var(--fg-subtle)">${role.token}</div></td><td><span style="font:var(${role.token});letter-spacing:0">${role.id.startsWith('code')?'const value = 42;':'見出し Aa 123'}</span></td><td class="mono">${role.fontSize} / ${role.lineHeight}</td><td class="mono">${role.fontWeight}</td><td>${role.usage}</td><td>${tokenCopy(`var(${role.token})`,role.token)}</td></tr>`).join('')}</tbody></table></div>
${h2('Generated CSS')}
${codeBlock(`.title {
  font: var(--type-h1);
  letter-spacing: var(--type-h1-letter-spacing);
}

.metric {
  font: var(--type-numeric);
  font-variant-numeric: tabular-nums;
}`,'css','generated typography usage')}
<ul class="plain">
<li><code class="inline">--type-{role}</code>はfont shorthand、<code class="inline">--type-{role}-{property}</code>はproperty単位の出力。</li>
<li>UIのBody / Labelサイズはdensity modifierにも値を持つ。長文Reading roleは密度で縮小しない。</li>
<li>HTML heading levelは文書構造、Typography tokenは視覚roleとして別々に決める。</li>
</ul>
<p>選択基準、responsive behavior、可読性要件は <a href="#/foundations/typography">Foundations / Typography</a> を参照してください。</p>
${nextPrev(['tokens/color','Color Tokens'],['tokens/spacing','Spacing Tokens'])}`));

docPage('tokens/spacing',()=>shell(`
${head('Tokens','Spacing Tokens',`${SPACING_SCALE.length}stepのReference scaleと、Layout / Densityからのalias関係を管理します。`)}
${h2('Scale')}
<div class="tscroll"><table class="ttable"><thead><tr><th>Path / CSS</th><th>Value</th><th>Description</th><th>Usage</th><th></th></tr></thead><tbody>${SPACING_SCALE.map(space=>`<tr><td><code>spacing.${space.id}</code><div class="mono" style="color:var(--fg-subtle)">${space.token}</div></td><td class="mono">${space.value}</td><td>${space.description}</td><td>${space.usage}</td><td>${tokenCopy(`var(${space.token})`,space.token)}</td></tr>`).join('')}</tbody></table></div>
${h2('Aliases')}
${codeBlock(`layout.dimension.page-pad-inline -> {spacing.6}
density.default.card-pad       -> {spacing.4}
density.compact.card-pad       -> {spacing.3}
density.comfortable.card-pad   -> {spacing.5}`,'txt','DTCG aliases')}
<p>Compositionで直接Referenceを選ぶ前に、<code class="inline">--card-pad</code>、<code class="inline">--gap-form</code>、<code class="inline">--page-pad-inline</code>など用途を持つtokenを優先します。</p>
<p>Scaleの判断基準とtarget spacingは <a href="#/foundations/spacing">Foundations / Spacing</a> を参照してください。</p>
${nextPrev(['tokens/typography','Typography Tokens'],['tokens/radius','Radius Tokens'])}`));

docPage('tokens/radius',()=>shell(`
${head('Tokens','Radius Tokens',`${RADIUS_SCALE.length}stepのshape scaleです。静的なCard / Panelは8px以下、より大きな値は用途を限定します。`)}
${h2('Scale')}
<div class="tscroll"><table class="ttable"><thead><tr><th>Path / CSS</th><th>Preview</th><th>Value</th><th>Usage</th><th></th></tr></thead><tbody>${RADIUS_SCALE.map(radius=>`<tr><td><code>radius.${radius.id}</code><div class="mono" style="color:var(--fg-subtle)">${radius.token}</div></td><td><span style="display:block;width:42px;height:28px;border:1px solid var(--border-strong);background:var(--surface-muted);border-radius:var(${radius.token})"></span></td><td class="mono">${radius.value}</td><td>${radius.usage}</td><td>${tokenCopy(`var(${radius.token})`,radius.token)}</td></tr>`).join('')}</tbody></table></div>
${h2('Rules')}
<ul class="plain"><li>Component sizeとanatomyで選び、viewportやthemeでは値を変えない。</li><li><code class="inline">full</code>はAvatar、Status、Badgeなど円・pillに意味がある要素だけに使う。</li><li>既存stepで説明できない場合は、利用範囲と所有者を定義してからscale追加を判断する。</li></ul>
<p>Component別の選択表は <a href="#/foundations/radius">Foundations / Radius</a> を参照してください。</p>
${nextPrev(['tokens/spacing','Spacing Tokens'],['tokens/shadow','Shadow Tokens'])}`));

docPage('tokens/shadow',()=>shell(`
${head('Tokens','Shadow Tokens',`${SHADOW_LEVELS.length}levelのgeometryと4つのtheme color roleを分離し、テーマ間ではalphaだけを切り替えます。`)}
${h2('Levels')}
<div class="tscroll"><table class="ttable"><thead><tr><th>Path / CSS</th><th>Preview</th><th>Usage</th><th>Generated value</th></tr></thead><tbody>${SHADOW_LEVELS.map(level=>`<tr><td><code>shadow.level.${level.id}</code><div class="mono" style="color:var(--fg-subtle)">${level.token}</div></td><td><span style="display:block;width:56px;height:36px;background:var(--surface-overlay);border:1px solid var(--border);border-radius:var(--radius-md);box-shadow:var(${level.token})"></span></td><td>${level.usage}</td><td class="mono">${level.value}</td></tr>`).join('')}</tbody></table></div>
${h2('Color modes')}
<div class="tscroll"><table class="ttable"><thead><tr><th>Role</th><th>Light</th><th>Dark</th></tr></thead><tbody>${Object.keys(SHADOW_THEME_COLORS.light).map(role=>`<tr><td class="mono">shadow.color.${role}</td><td class="mono">${SHADOW_THEME_COLORS.light[role]}</td><td class="mono">${SHADOW_THEME_COLORS.dark[role]}</td></tr>`).join('')}</tbody></table></div>
<p>Contrast modifierはshadowを変更しません。Highではshadowを境界として数えず、強いborderとsurface差でlayerを識別します。</p>
<div class="callout warn" style="margin-top:var(--sp-3)">${I.warn}<span>ShadowはCardの常設装飾ではありません。Dropdown、Popover、Toast、Dialogなど他contentに重なる一時surfaceだけに使い、構造はsurface colorとborderで作ります。</span></div>
<p>Layering modelは <a href="#/foundations/elevation">Foundations / Elevation &amp; Border</a> を参照してください。</p>
${nextPrev(['tokens/radius','Radius Tokens'],['tokens/motion','Motion Tokens'])}`));

docPage('tokens/motion',()=>shell(`
${head('Tokens','Motion Tokens','Duration、Easing、Distanceを別tokenとして管理し、reduced motionではdurationと移動距離を生成CSSで上書きします。')}
${h2('Duration')}
<div class="tscroll"><table class="ttable"><thead><tr><th>Path / CSS</th><th>Value</th><th>Usage</th></tr></thead><tbody>${MOTION_DURATIONS.map(row=>`<tr><td><code>motion.duration.${row.id}</code><div class="mono" style="color:var(--fg-subtle)">${row.token}</div></td><td class="mono">${row.value}</td><td>${row.usage}</td></tr>`).join('')}</tbody></table></div>
${h2('Easing')}
<div class="tscroll"><table class="ttable"><thead><tr><th>Path / CSS</th><th>Value</th><th>Usage</th></tr></thead><tbody>${MOTION_EASINGS.map(row=>`<tr><td><code>motion.easing.${row.id}</code><div class="mono" style="color:var(--fg-subtle)">${row.token}</div></td><td class="mono">${row.value}</td><td>${row.usage}</td></tr>`).join('')}</tbody></table></div>
${h2('Distance')}
<div class="tscroll"><table class="ttable"><thead><tr><th>Path / CSS</th><th>Value</th><th>Usage</th></tr></thead><tbody>${MOTION_DISTANCES.map(row=>`<tr><td><code>motion.distance.${row.id}</code><div class="mono" style="color:var(--fg-subtle)">${row.token}</div></td><td class="mono">${row.value}</td><td>${row.usage}</td></tr>`).join('')}</tbody></table></div>
${h2('Reduced motion output')}
${codeBlock(`@media (prefers-reduced-motion: reduce) {
  :root {
    --dur-fast: 0ms;
    --dur-normal: 0ms;
    --motion-distance-sm: 0px;
    --motion-distance-md: 0px;
  }
}`,'css','tokens/build/tokens.css')}
<p>適用判断、禁止事項、検証方法は <a href="#/foundations/motion">Foundations / Motion</a> を参照してください。</p>
${nextPrev(['tokens/shadow','Shadow Tokens'],['tokens/component','Component Tokens'])}`));

docPage('tokens/component',()=>shell(`
${head('Tokens','Component Tokens',`Semantic tokenを複製する層ではありません。現在はpolicy triggerと具体的reasonを持つ${TOKEN_CATALOG.componentTokens.length}個だけを公開します。`)}
${h2('Decision gate')}
<ol class="plain">
<li>Visual slotとSemantic tokenが1対1で、全componentが一緒に変わるならSemanticを直接bindingする。</li>
<li>独立customization、公開component API、semantic divergence、固有anatomy、cross-platform stability、固有寸法のいずれかを満たす場合だけComponent tokenを検討する。</li>
<li>trigger、reason、Semantic alias、使用slotをmachine-readable contractへ記録する。</li>
<li>未使用、単純な短縮alias、一度限りの見た目調整はrelease前に拒否する。</li>
</ol>
${h2('Published tokens')}
<div class="tscroll"><table class="ttable"><thead><tr><th>DTCG path / CSS</th><th>Alias by context</th><th>Resolved values</th><th>Trigger</th><th>Reason</th></tr></thead><tbody>${TOKEN_CATALOG.componentTokens.map(row=>`<tr><td><code>${row.path}</code><div class="mono" style="color:var(--fg-subtle)">${row.cssVariable}</div></td><td class="mono">${TOKEN_CATALOG.contexts.map(context=>`${TOKEN_CONTEXT_SHORT[context.id]} ${esc(tokenAlias(row.aliases[context.id]))}`).join('<br>')}</td><td>${TOKEN_CATALOG.contexts.map(context=>`<div style="margin-top:var(--sp-1)">${TOKEN_CONTEXT_SHORT[context.id]} ${tokenSwatch(row.values[context.id])}</div>`).join('')}</td><td>${badge({label:row.trigger,tone:'warning'})}</td><td>${row.reason}</td></tr>`).join('')}</tbody></table></div>
${h2('Canonical source')}
<p>${sourceLink('tokens/src/component.json')}がtoken path、CSS名、trigger、reason、mode overrideの正本です。ButtonのSecondaryなどSemanticで十分なslotはComponent tokenを作らず、直接<code class="inline">--surface</code>や<code class="inline">--border</code>へbindingします。</p>
${nextPrev(['tokens/motion','Motion Tokens'],['tokens/theme','Theme Tokens'])}`));

docPage('tokens/theme',()=>shell(`
${head('Tokens','Theme Tokens','Component CSSを変更せず、Semanticと承認済みComponent tokenの値をcontextごとに解決します。')}
${h2('Published contexts')}
<div class="tscroll"><table class="ttable"><thead><tr><th>Context</th><th>Output</th><th>Background</th><th>Foreground</th><th>Primary</th><th>Focus</th></tr></thead><tbody>${TOKEN_CATALOG.contexts.map(context=>`<tr><td style="font-weight:550">${context.label}</td><td><code>${context.file}</code></td><td>${tokenSwatch(context.values.background)}</td><td>${tokenSwatch(context.values.foreground)}</td><td>${tokenSwatch(context.values.primary)}</td><td>${tokenSwatch(context.values['focus-ring'])}</td></tr>`).join('')}</tbody></table></div>
${h2('Ownership')}
<ul class="plain">
<li><b>Theme</b>はLight / Darkのsurface luminanceとtheme-relative mappingを所有する。</li>
<li><b>Contrast</b>はcontrast target、focus width、border strengthを所有し、Standard / HighをLight / Darkの双方へ適用する。</li>
<li><b>Density</b>、viewport layout、brand identityはThemeで変更しない。</li>
<li>解決順はTheme → Contrast。Context間でtoken pathと用途は不変にし、値だけを差し替える。</li>
</ul>
${h2('Runtime selector')}
${codeBlock(`html[data-theme="light"][data-contrast="standard"] { /* Light / Standard */ }
html[data-theme="dark"][data-contrast="standard"]  { /* Dark / Standard */ }
html[data-theme="light"][data-contrast="high"] { /* Light / High */ }
html[data-theme="dark"][data-contrast="high"]  { /* Dark / High */ }`,'css','tokens/build/tokens.css')}
<div class="callout">${I.info}<span>保存設定がない初回は<code class="inline">prefers-color-scheme</code>と<code class="inline">prefers-contrast: more</code>を初期値に使います。<code class="inline">forced-colors: active</code>はHigh modeへ変換せず、UAのsystem color置換を尊重します。</span></div>
${h2('Standards and boundaries')}
<ul class="plain">
<li><a href="${TOKEN_CATALOG.specification.resolverUrl}">DTCG Resolver Module 2025.10</a>: modifier permutation、resolution order、orthogonality。</li>
<li><a href="https://www.w3.org/TR/mediaqueries-5/#prefers-contrast">Media Queries Level 5</a>: <code class="inline">prefers-contrast</code>と<code class="inline">forced-colors</code>の意味。</li>
<li><a href="https://www.w3.org/TR/css-color-adjust-1/#forced-colors-mode">CSS Color Adjustment Level 1</a>: forced color paletteとsystem color。</li>
<li><a href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html">WCAG 2.2 Contrast Enhanced</a>: High modeの通常text 7:1目標。</li>
</ul>
<div class="callout">${I.info}<span>DTCG Resolver documentはまだ配布していません。tool間の実装差を避けるため、現時点ではmodifier contextを解決した4 bundleを正式な交換物にします。bundle内aliasは保持します。</span></div>
${nextPrev(['tokens/component','Component Tokens'],['tokens/density','Density Tokens'])}`));

docPage('tokens/density',()=>{
  const modes=['compact','default','comfortable'];
  const keys=Object.keys(TOKEN_CATALOG.densities.default);
  return shell(`
${head('Tokens','Density Tokens','Control size、UI text、row height、component paddingを一括で切り替えるmodifierです。ViewportやThemeとは独立して選びます。')}
${h2('Mode values')}
<div class="tscroll"><table class="ttable"><thead><tr><th>Token</th>${modes.map(mode=>`<th>${mode}</th>`).join('')}</tr></thead><tbody>${keys.map(key=>`<tr><td class="mono">density.{mode}.${key}<div style="color:var(--fg-subtle)">--${key}</div></td>${modes.map(mode=>`<td class="mono">${TOKEN_CATALOG.densities[mode][key]}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
${h2('Selection rules')}
<ul class="plain">
<li><b>Compact:</b> pointer中心の高密度なtable、log、monitoring UI。target間隔と代替経路を確認する。</li>
<li><b>Default:</b> 汎用の既定値。判断材料がなければこれを使う。</li>
<li><b>Comfortable:</b> touch中心、onboarding、設定、読みやすさを優先する画面。</li>
<li>全modeでcontrol tokenは24px以上を保つ。Touch中心の主要actionと隣接icon controlは44px程度を優先する。</li>
<li>SPだからCompact、PCだからDefaultとは決めない。input methodと利用文脈で選ぶ。</li>
<li>同一画面内でmodeを混在させず、Table rowだけの局所overrideは明示的な例外として扱う。</li>
</ul>
${preview(`<div style="display:flex;flex-direction:column;gap:var(--gap-form);width:min(420px,100%)">${fieldEl({label:'プロジェクト名',placeholder:'Meridian'})}<div>${btn({label:'保存',size:'md'})}</div></div>`,'現在のdensity')}
<div class="rowflex" style="margin-bottom:var(--sp-4)">${modes.map(mode=>`<button class="btn" data-variant="secondary" data-size="sm" data-setdensity="${mode}">${mode}</button>`).join('')}</div>
${h2('Output selector')}
${codeBlock(`html[data-density="compact"] { /* compact values */ }
html[data-density="default"] { /* default values */ }
html[data-density="comfortable"] { /* comfortable values */ }`,'css','tokens/build/tokens.css')}
${nextPrev(['tokens/theme','Theme Tokens'],['tokens/css-variables','CSS Variables'])}`)});

docPage('tokens/css-variables',()=>{
  const light=Object.fromEntries(TOKEN_CATALOG.semanticTokens.map(row=>[row.cssVariable,row.values['light-standard']]));
  const sample=['--bg','--surface','--fg','--border','--primary','--primary-hover','--primary-fg','--focus-ring'].map(name=>`  ${name}: ${light[name]};`).join('\n');
  return shell(`
${head('Tokens','CSS Variables','repositoryから直接利用できる、2 theme × 2 contrast・3 density・reduced motionを含む生成CSSです。')}
${h2('Use from this repository')}
${codeBlock(`<link rel="stylesheet" href="tokens/build/tokens.css">`,'html','index.html')}
<p>現在npm packageは未公開です。<code class="inline">@meridian/tokens/css</code>のような未配布specifierは利用手順に含めません。</p>
${h2('Actual output')}
${codeBlock(`:root,
html[data-theme="light"][data-contrast="standard"] {
${sample}
}`,'css',`tokens/build/tokens.css — seed ${TOKEN_CATALOG.defaultSeed}`)}
${h2('Naming groups')}
<div class="tscroll"><table class="ttable"><thead><tr><th>Group</th><th>Examples</th><th>Consumer</th></tr></thead><tbody>${[
['Semantic color','--bg, --surface, --fg, --primary','Product UI / components'],
['Reference spacing','--sp-0 … --sp-24','Semantic layout / composition'],
['Typography','--type-body, --type-h1-*','Text role binding'],
['Shape / elevation','--radius-*, --shadow-*','Component anatomy'],
['Motion','--dur-*, --ease-*, --motion-distance-*','Transitions'],
['Modifier','--ctl-*, --row-h, --card-pad','Density-aware components'],
['Component','--button-primary-*, --input-*, --sidebar-*','Approved component API'],
].map(row=>`<tr><td style="font-weight:550">${row[0]}</td><td class="mono">${row[1]}</td><td>${row[2]}</td></tr>`).join('')}</tbody></table></div>
${h2('Build and drift check')}
${codeBlock(`npm run build:tokens  # regenerate all token outputs
npm run check:tokens  # fail when generated files or DTCG structure drift`,'sh','repository scripts')}
${outputTable()}
${nextPrev(['tokens/density','Density Tokens'],['tokens/json-tokens','JSON Tokens'])}`)});

docPage('tokens/json-tokens',()=>shell(`
${head('Tokens','JSON Tokens','DTCG 2025.10準拠を検査する、modifier context解決済みの交換形式です。Light / DarkとStandard / Highの4 permutationを別々の .tokens.json として生成し、bundle内aliasは保持します。')}
${h2('Files')}
${outputTable()}
${h2('Actual format')}
${codeBlock(JSON.stringify(TOKEN_CATALOG.jsonPreview,null,2),'json','tokens/build/meridian.tokens.json (excerpt)')}
${h2('Conformance rules')}
<ul class="plain">
<li>Tokenは<code class="inline">$value</code>を必須とし、<code class="inline">$type</code>はtokenまたは親groupから一意に決定できるようにする。</li>
<li>Dimensionは<code class="inline">{ value, unit }</code>、Colorは<code class="inline">{ colorSpace, components, alpha?, hex? }</code>を使う。</li>
<li>Aliasは<code class="inline">{group.token}</code>で表し、未解決・循環aliasをbuild時に拒否する。</li>
<li>Alias tokenの型は参照先から決定でき、明示または継承した型がある場合は参照先の型と一致させる。</li>
<li>4 bundleは同じ309 token pathと有効型を持ち、theme / contrastで値だけが変化する。Density 3 modeは各bundle内に共通して含める。</li>
<li>推奨extensionは<code class="inline">.tokens.json</code>、HTTP media typeは<code class="inline">application/design-tokens+json</code>。</li>
<li>DTCG 2025.10は公式JSON Schemaを定義していないため、架空の<code class="inline">$schema</code> URLを埋め込まない。repositoryのvalidatorで準拠条件を検査する。</li>
</ul>
${h2('Tool interoperability')}
<ul class="plain">
<li>Figma Variablesへ「そのままimport可能」とは保証しない。toolが対応するDTCG type、alias、modeの範囲を確認し、変換後の値とbindingを検証する。</li>
<li>未知の<code class="inline">$extensions</code>は保持し、Meridian固有metadataがtoken値の解釈に必須にならないようにする。</li>
<li>Theme / Contrastは該当するcontext bundleを選ぶ。Aliasを展開済みの値が必要なtoolは、bundle内参照を解決してから変換する。</li>
<li>Resolver documentの公開はconsumer toolでの検証が揃ってから行う。</li>
</ul>
${h2('Specification')}
<ul class="plain"><li><a href="${TOKEN_CATALOG.specification.formatUrl}">DTCG Format Module 2025.10</a></li><li><a href="${TOKEN_CATALOG.specification.colorUrl}">DTCG Color Module 2025.10</a></li><li><a href="${TOKEN_CATALOG.specification.resolverUrl}">DTCG Resolver Module 2025.10</a></li></ul>
${nextPrev(['tokens/css-variables','CSS Variables'],['components/button','Button'])}`));
