"use strict";
/* ============ Foundations: Color ============ */
docPage('foundations/color',()=>{
  const P=PALETTES,T=SEM;
  const gb=(good,bad,gt,bt)=>`<div class="dodont"><div class="box do"><div class="cap">${I.check} Do</div><div class="bd">${good}</div><div class="tx">${gt}</div></div><div class="box dont"><div class="cap">${I.x} Don't</div><div class="bd">${bad}</div><div class="tx">${bt}</div></div></div>`;
  const palRow=(name,scale)=>`<div class="pal"><span class="nm">${name}</span>${STEPS.map(s=>`<button class="cell" style="background:${scale[s]}" data-copy="${scale[s]}" title="${name}-${s} ${scale[s]}"><span style="color:${L_MAP[s]>60?'rgba(0,0,0,.55)':'rgba(255,255,255,.8)'}">${s}</span></button>`).join('')}</div>`;
  const themePrev=(th,ct,label)=>{const t=buildSemantics(P,th,ct);return `<div style="background:${t.background};border:1px solid ${t.border};border-radius:var(--radius-lg);padding:14px;flex:1;min-width:220px">
    <div style="font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:${t['foreground-subtle']};margin-bottom:10px">${label}</div>
    <div style="background:${t.surface};border:1px solid ${t.border};border-radius:var(--radius-md);padding:12px">
      <div style="color:${t.foreground};font-weight:600;font-size:13px;margin-bottom:2px">Deploy service</div>
      <div style="color:${t['foreground-muted']};font-size:12px;margin-bottom:10px">main@a1b2c3 → production</div>
      <div style="display:flex;gap:6px"><span style="background:${t.primary};color:${t['primary-foreground']};font-size:12px;font-weight:550;padding:5px 12px;border-radius:var(--radius-sm)">Deploy</span><span style="background:${t['control-background']};border:1px solid ${t['control-border']};color:${t.foreground};font-size:12px;padding:5px 12px;border-radius:var(--radius-sm)">Cancel</span></div>
      <div style="margin-top:10px;display:flex;gap:6px"><span style="background:${t['success-subtle']};color:${t['success-foreground']};font-size:10.5px;font-weight:550;padding:1px 8px;border-radius:var(--radius-full)">Healthy</span><span style="background:${t['danger-subtle']};color:${t['danger-foreground']};font-size:10.5px;font-weight:550;padding:1px 8px;border-radius:var(--radius-full)">2 errors</span></div>
    </div></div>`};
  const pairs=[['foreground','background'],['foreground','surface'],['foreground-muted','surface'],['primary-foreground','primary'],['primary','surface'],['success-foreground','success-subtle'],['danger-foreground','danger-subtle']];
  const cRow=p=>{const fg=T[p[0]],bg=T[p[1]];const r=contrast(fg,bg);const pass=r>=4.5?'AA text':r>=3?'3:1 only':'Fail';
    return `<tr><td class="mono">${p[0]} / ${p[1]}</td><td><span style="background:${bg};color:${fg};padding:2px 10px;border-radius:var(--radius-xs);border:1px solid var(--border-muted);font-size:12px">Aa テキスト</span></td><td class="mono num" style="text-align:right">${r.toFixed(2)}</td><td>${badge({label:pass,tone:pass==='Fail'?'danger':pass==='AA text'?'success':'warning'})}</td></tr>`};
  return shell(`
${head('Foundations','Color',`1つの基準色(Seed color)から、OKLCH色空間で9系統のPrimitive palette、${SEM_META.length-12}のcore Semantic color、12のchart fill / foreground tokenを生成するカラーシステムです。`)}
${h2('カラーシステムの目的')}
<ul class="plain">
<li>Neutral-firstのSurface階層を安定させ、ブランド色はaction、selection、statusへ意図的に使う</li>
<li>Light / DarkとStandard / Highの全4 contextでroleを維持し、主要なtext / solid pairを自動テスト可能にする</li>
<li>表示用途ごとに Semantic color を使い、実装時に hex を直接使わない</li>
<li>UI の状態を色だけに頼らず、線・ラベル・アイコンでも補助する</li>
<li>ユーザー・テナントが Primary color seed を変更できる</li>
</ul>
${h2('Seed color')}
<p>Seedはユーザーまたはブランドが選択する基準色です。内部ではSeedをOKLCH(知覚的に均一な明度L・彩度C・色相Hで色を表す空間)に変換し、Primary、Secondary、Accentを導出します。通常のPage、Card、Controlに使うNeutral paletteはSeedから分離し、ブランド色を変えても長時間利用する画面のCanvasとSurface階層が変色しないようにします。Seed由来の色味は<code class="inline">primary-subtle</code>、selection、active navigationなど意味のある箇所へ限定します。</p>
<div class="panel pad">
<div class="rowflex" style="margin-bottom:var(--sp-3)">
${SEED_PRESETS.map(s=>`<button class="seeddot" style="background:${s.hex}" data-seed="${s.hex}" aria-pressed="${STATE.seed.toLowerCase()===s.hex.toLowerCase()}" title="${s.name}" aria-label="Seed: ${s.name}"></button>`).join('')}
<label class="rowflex" style="gap:8px;margin-left:8px;font-size:var(--text-small);color:var(--fg-muted)">Custom
<input type="color" value="${STATE.seed}" data-seedpick style="width:34px;height:26px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface);padding:2px;cursor:pointer"></label>
<code class="inline" style="margin-left:auto">${STATE.seed}</code></div>
<p class="muted" style="font-size:var(--text-small);margin:0">Seed を選ぶと、このサイト全体(Primitive・Semantic・Component・Chart)が即座に再生成されます。</p>
</div>
${h2('Primitive palette')}
<p>Seed から生成される 50–950 の 11 段スケールです。明度(OKLCH L)は色相に関わらず同じカーブを使うため、どの色相のスケールでも段ごとの明るさが揃って見えます。彩度(OKLCH C)は明暗の両端で自動的に減衰させ、sRGB の外に出る組み合わせはガマットマッピングで表示可能な範囲へ丸めるため、どんな Seed でも破綻した色は出力されません。クリックで hex をコピーできます。</p>
<div class="panel pad" style="overflow-x:auto">
${palRow('primary',P.primary)}${palRow('secondary',P.secondary)}${palRow('accent',P.accent)}${palRow('neutral',P.neutral)}${palRow('neutral-var',P.neutralVariant)}${palRow('success',P.success)}${palRow('warning',P.warning)}${palRow('danger',P.danger)}${palRow('info',P.info)}
</div>
${h2('Accent の使用範囲')}
<p><code class="inline">accent</code> は Primary とは別軸の第 2 色相で、ロゴマークやアバターのグラデーションなど<b>ブランドアイデンティティ表現専用</b>のトークンです。ボタン・バッジ・強調テキストなど一般的な UI の配色には使用しません。強調や状態の表現は Semantic token(<code class="inline">primary</code> / <code class="inline">success</code> / <code class="inline">warning</code> / <code class="inline">danger</code>)を使ってください。</p>
${gb(`<span style="width:24px;height:24px;border-radius:var(--radius-sm);background:linear-gradient(135deg,var(--primary),var(--accent));display:inline-block"></span>`,`<span style="background:var(--accent);color:var(--accent-on-solid);padding:5px 14px;border-radius:var(--radius-sm);font-size:13px;font-weight:550">Deploy</span>`,'ロゴマーク・アバターのフォールバック画像などブランドを識別させる箇所にのみ使う。','ボタンやバッジの配色に accent を使う。UI の状態や優先度の意味が伝わらず、ブランド色と状態色が混在する。')}
${h2('Semantic tokens')}
<p>UI の「用途」にマッピングされた色です。実装・デザインで使うのはこの層(と承認済みComponent層)のみです。全${SEM_META.length}トークンの値は <a href="#/tokens/overview">Token Overview</a> を参照してください。<code class="inline">primary</code> / <code class="inline">secondary</code> / <code class="inline">accent</code> は固定のスケール段ではなく、Standardでは4.5:1、Highでは7:1に達する段をLight / Darkそれぞれで探索します。これは全組み合わせの自動保証ではないため、実際に重なるforeground / background pairは個別に検証します。</p>
${h2('Surface hierarchy')}
<p>静的な面と操作可能なControlを同じ色tokenへまとめません。LightはNeutral canvasと白いSurface、Darkは高い面ほど明るい段階を使い、Shadowだけに階層を依存させません。</p>
<div class="tscroll"><table class="ttable"><thead><tr><th>Role</th><th>用途</th><th>Darkでの関係</th></tr></thead><tbody>
<tr><td><code>background</code></td><td>Page canvas</td><td>最下層</td></tr>
<tr><td><code>surface-sunken</code></td><td>Well、Dark field、recessed region</td><td>標準面より暗い</td></tr>
<tr><td><code>surface</code></td><td>Flat Card、Panel</td><td>Canvasより明るい</td></tr>
<tr><td><code>surface-muted</code></td><td>Table header、subtle section</td><td>標準面より一段明るい</td></tr>
<tr><td><code>surface-raised</code></td><td>強調された可動面</td><td>標準面より明るい</td></tr>
<tr><td><code>surface-overlay</code></td><td>Dialog、Popover、Menu</td><td>最も明るい一時面</td></tr>
<tr><td><code>control-*</code></td><td>Secondary ButtonなどのNeutral action</td><td>Cardとは別のrest / hover / active / border</td></tr>
</tbody></table></div>
${h2('Color decision ladder')}
<ol class="plain">
<li>情報構造をspacing、typography、borderで成立させ、色だけを唯一の手掛かりにしない。</li>
<li>用途に合うSemantic tokenを選ぶ。値や見た目が近いことを理由にPrimitiveを選ばない。</li>
<li>solid面では対応する<code class="inline">*-on-solid</code>、subtle面では<code class="inline">*-foreground</code>を組み合わせる。</li>
<li>Component固有の独立変更境界が必要な場合だけ、policy trigger付きでComponent tokenへ昇格する。</li>
<li>使用するtheme、Seed、stateでtext 4.5:1、large textとessential UI 3:1を検証する。</li>
</ol>
<div class="tscroll"><table class="ttable"><thead><tr><th>Token</th><th>Light</th><th>Dark</th><th>用途</th></tr></thead><tbody>
${['background','surface-sunken','surface','surface-raised','surface-overlay','control-background','control-border','foreground','foreground-muted','border','primary','primary-subtle','primary-foreground','success','danger','focus-ring'].map(k=>{const l=buildSemantics(P,'light')[k],d=buildSemantics(P,'dark')[k];
  return `<tr><td class="mono">--${k.replace('foreground','fg').replace('background','bg')}</td><td><span class="swpair"><span class="sw" style="background:${l}"></span><span class="mono">${l}</span></span></td><td><span class="swpair"><span class="sw" style="background:${d}"></span><span class="mono">${d}</span></span></td><td style="color:var(--fg-muted)">${(SEM_META.find(m=>m[0]===k)||['','',''])[1]}</td></tr>`}).join('')}
</tbody></table></div>
${h2('Theme preview')}
<p>同一の Semantic token が、Theme × Contrastの4 contextでどのようにマッピングされるかのプレビューです。</p>
<div class="rowflex" style="align-items:stretch;gap:var(--sp-3);flex-wrap:wrap">${themePrev('light','standard','Light / Standard')}${themePrev('dark','standard','Dark / Standard')}${themePrev('light','high','Light / High')}${themePrev('dark','high','Dark / High')}</div>
${h2('Component tokens')}
<p>コンポーネント固有の色は、3層目のComponent tokenとして必要な場合だけ定義します。「そのcomponentだけ変えたい」だけでは不十分で、public API、independent customization、cross-platform mappingなど<code class="inline">design/token-policy.json</code>のtriggerと具体的reasonをcontractへ記録します。</p>
${codeBlock(`--button-primary-bg: var(--primary);\n--button-primary-bg-hover: var(--primary-hover);\n--button-primary-fg: var(--primary-fg);\n--input-bg: var(--surface); /* Dark: var(--surface-sunken) */\n--input-border-focus: var(--primary);\n--table-row-hover: color-mix(in srgb, var(--fg) 3%, transparent);\n--sidebar-item-active-bg: var(--primary-subtle);`,'css','component-tokens.css')}
${h2('Contrast checker')}
<p>現在の Seed / テーマにおける主要ペアのコントラスト比です(WCAG 2.2 基準)。Seed を変えて確認してください。</p>
<div class="tscroll"><table class="ttable"><thead><tr><th>ペア</th><th>プレビュー</th><th style="text-align:right">比率</th><th>判定</th></tr></thead><tbody>${pairs.map(cRow).join('')}</tbody></table></div>
<div class="callout warn" style="margin-top:var(--sp-3)">${I.warn}<span>明るい Seed(Amber など)では <code class="inline">primary</code> 自体がより濃いステップへ、<code class="inline">primary-foreground</code> が自動的に暗色へ切り替わり、基準コントラストを満たすよう調整されます。それでも AA を満たさない組み合わせが残る場合は、リリース前に必ず解消してください。</span></div>
${h2('Data visualization colors')}
<p>チャート色は Seed の色相を起点に、識別しやすい色相差(36–70°)で 6 色を生成します。順序は chart-1 → chart-6 で固定です。</p>
<div class="rowflex" style="margin-bottom:var(--sp-3)">${CHART.map((c,i)=>`<button class="cell" style="width:64px;height:40px;background:${c};border-radius:var(--radius-sm);border:1px solid var(--border-muted)" data-copy="${c}" title="chart-${i+1}"><span style="font-size:9px;color:var(--chart-fg-${i+1});font-family:var(--font-mono)">${i+1}</span></button>`).join('')}
<span class="rowflex" style="margin-left:12px;gap:6px">${badge({label:'Positive',tone:'success'})}${badge({label:'Negative',tone:'danger'})}${badge({label:'Neutral',tone:'neutral'})}</span></div>
<ul class="plain"><li><b>Categorical</b>: chart-1〜6 を順に使用し、legend、label、shapeのいずれかを併用する</li><li><b>Sequential</b>: 単一色相の明度スケールを使い、値域と凡例を表示する</li><li><b>Diverging</b>: 中立点を明示し、positive / negativeの意味をlabelでも伝える</li><li>正負の意味を持つ値はsuccess / dangerを使い、カテゴリ色と混同しない</li><li>小さなmarkや隣接系列は色差だけで識別させず、pattern、stroke、direct labelを追加する</li></ul>
${h2('Standards and evidence')}
<ul class="plain">
<li><a href="https://www.w3.org/TR/css-color-4/">CSS Color Module Level 4</a>: OKLCHとgamut mappingの基準。</li>
<li><a href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html">WCAG 2.2 Contrast Minimum</a>: 通常text 4.5:1、大きなtext 3:1。</li>
<li><a href="https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast">WCAG 2.2 Non-text Contrast</a>: essentialなUI componentとstateの3:1。</li>
<li><a href="https://www.w3.org/WAI/WCAG22/Understanding/use-of-color">WCAG 2.2 Use of Color</a>: 色を唯一の情報伝達手段にしない。</li>
<li><a href="https://carbondesignsystem.com/elements/color/overview/">Carbon Color</a>: LightではNeutral layerを交互にし、Darkでは上位layerを一段ずつ明るくする。</li>
<li><a href="https://developer.android.com/develop/ui/compose/designsystems/material3">Material 3</a>: surface container roleとtonal elevationでSurfaceを区別する。</li>
<li><a href="https://fluent2.microsoft.design/color">Fluent 2 Color</a>: NeutralをSurfaceとLayoutへ、Brandを重要な強調へ使用する。</li>
<li><a href="https://primer.style/product/getting-started/foundations/color-usage/">Primer Color Usage</a>: default、muted、inset、overlayとControl stateをNeutral scale上で分離する。</li>
<li><a href="https://atlassian.design/foundations/elevation">Atlassian Elevation</a>: Darkでは高いSurfaceほど明るくし、Flat CardはSurfaceとBorderで表す。</li>
</ul>
${h2('CSS / JSON preview')}
<p>現在の Seed・テーマから生成された実トークンです。<a href="#/tokens/css-variables">CSS Variables</a> / <a href="#/tokens/json-tokens">JSON Tokens</a> で全量を確認できます。</p>
${codeBlock(`:root {\n  --bg: ${T.background};\n  --surface: ${T.surface};\n  --fg: ${T.foreground};\n  --border: ${T.border};\n  --primary: ${T.primary};\n  --primary-hover: ${T['primary-hover']};\n  --primary-fg: ${T['primary-foreground']};\n}`,'css','generated (current theme)')}
${nextPrev(['overview/architecture','System Architecture'],['foundations/typography','Typography'])}`)});

/* ============ Foundations: Typography ============ */
docPage('foundations/typography',()=>shell(`
${head('Foundations','Typography','同じ意味のロールをPCとSPで共有し、可読性・密度・情報階層を一貫して設計します。')}
${h2('Typography philosophy')}
<ul class="plain">
<li>見出しのHTMLレベルは文書構造で決め、見た目のロールとは分離する。サイズだけで階層を作らず、weightとspacingも使う。</li>
<li>日本語と英数字が混在しても崩れないfont stackを使い、利用者のOSにあるfallbackへ安全に移行する。</li>
<li>コード・比較する数値・control label・短いUI本文・長文は役割が異なるため、ロールを分ける。</li>
<li>PC用とSP用の別ロールは作らない。viewportに応じた配置変更や必要最小限のrole mappingで同じ意味を保つ。</li>
</ul>
${h2('Font family')}
${codeBlock(`--font-sans: 'Inter', 'Noto Sans JP', 'Hiragino Sans',\n             'Yu Gothic', system-ui, sans-serif;\n--font-mono: 'JetBrains Mono', 'Geist Mono', 'IBM Plex Mono',\n             ui-monospace, 'SFMono-Regular', monospace;`,'css','font tokens')}
${h2('Type scale')}
<p><code class="inline">tokens/src/typography.json</code>が17ロールの正規データです。CSS shorthandの<code class="inline">--type-*</code>と個別property tokenを同じ定義から生成します。</p>
<div class="tscroll"><table class="ttable"><thead><tr><th>Style</th><th>Sample</th><th>Size / LH</th><th>Weight</th><th>Tracking</th><th>用途</th><th>Token</th></tr></thead><tbody>
${TYPE_SCALE.map(role=>`<tr><td style="font-weight:550;white-space:nowrap">${role.label}</td><td><span style="font:var(${role.token});letter-spacing:var(${role.token}-letter-spacing);${role.id.startsWith('code')||role.id==='numeric'?'font-variant-numeric:tabular-nums;':''}white-space:nowrap">${role.id.startsWith('code')?'const x = 42;':role.id==='numeric'?'1,240.50':'見出し Aa 123'}</span></td><td class="mono">${role.fontSize} / ${role.lineHeight}</td><td class="mono">${role.fontWeight}</td><td class="mono">${role.letterSpacing}</td><td style="color:var(--fg-muted)">${role.usage}</td><td><button class="cp" data-copy="var(${role.token})" aria-label="${role.token}をコピー">${I.copy}</button></td></tr>`).join('')}
</tbody></table></div>
${h2('Reading and density')}
<p><b>Reading 16px / 1.65</b>は複数段落のdocumentation・help・consumer contentに使います。<b>Body 14px / 1.55</b>は短い業務UI本文の基準です。Body / Label / Table textはdensity tokenに連動しますが、Readingは可読性を保つため縮小しません。</p>
<div class="tscroll"><table class="ttable"><thead><tr><th>Role</th><th>Compact</th><th>Default</th><th>Comfortable</th></tr></thead><tbody>
${[['Reading','16px / 1.65','16px / 1.65','16px / 1.65'],['Body','13px','14px','15px'],['Label','12px','13px','14px'],['Table text','12px','13px','14px'],['UI line-height','1.45','1.55','1.65']].map(r=>`<tr><td style="font-weight:550">${r[0]}</td><td class="mono">${r[1]}</td><td class="mono">${r[2]}</td><td class="mono">${r[3]}</td></tr>`).join('')}
</tbody></table></div>
${preview(textDemo(),'Live — 現在の密度でのレンダリング')}
${h2('Usage decision')}
<ul class="plain">
<li>複数段落を読むならReading、短いUI説明ならBody、操作名ならLabel、補足metadataならCaptionを選ぶ。</li>
<li>本文の行長はLatinで45–90文字(目標66)、日本語で25–40文字を目安にし、長文content幅を制限する。</li>
<li>CaptionとCode Smallへ重要な説明を押し込まない。小さいtextが続く場合はBody Small以上へ上げる。</li>
<li>比較する数値にはNumericと<code class="inline">font-variant-numeric: tabular-nums</code>を使う。</li>
<li>文字サイズ・weight・line-height・letter-spacingを直接指定せず、type roleを使う。letter-spacingは全roleで0とする。</li>
</ul>
${h2('Responsive and accessibility')}
<ul class="plain">
<li>200%のtext resize・zoomでもcontentと操作を失わず、320 CSS px相当まで原則1方向scrollで読めることを確認する。</li>
<li>利用者がline-height 1.5、paragraph spacing 2em、letter spacing .12em、word spacing .16emへ上書きしてもclip・overlap・操作不能を起こさない。</li>
<li>labelと見出しはwrapを標準にする。truncationは反復一覧など全内容へ別経路で到達できる場合だけ許可し、操作名やerrorは省略しない。</li>
<li>native appへ移植するときは同じsemantic roleをDynamic Typeなどplatformのtext styleへmapし、固定point sizeにしない。</li>
</ul>
${h2('Standards and evidence')}
<ul class="plain">
<li><a href="https://designsystem.digital.gov/components/typography/">USWDS Typography</a>: running textの基準とline length。</li>
<li><a href="https://www.w3.org/WAI/WCAG22/Understanding/resize-text">WCAG 2.2 Resize Text</a>: 200%拡大時のcontentと機能の保持。</li>
<li><a href="https://www.w3.org/WAI/WCAG22/Understanding/text-spacing">WCAG 2.2 Text Spacing</a>: 利用者のspacing overrideへの耐性。</li>
<li><a href="https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation">WCAG 2.2 Visual Presentation</a>: line length・整列・paragraph spacing。</li>
<li><a href="https://developer.apple.com/design/human-interface-guidelines/typography">Apple HIG Typography</a>: platform text styleとDynamic Type。</li>
</ul>
${nextPrev(['foundations/color','Color'],['foundations/spacing','Spacing'])}`));

/* ============ Foundations: Spacing / Layout / Radius / Elevation / Motion ============ */
docPage('foundations/spacing',()=>shell(`
${head('Foundations','Spacing','余白を関係性・階層・操作精度のために使い、PCとSPで同じscaleと意味を共有します。')}
${h2('Spacing philosophy')}
<ul class="plain">
<li>近いものは関連が強く、遠いものは弱い。余白の大小がそのままグルーピングになる。</li>
<li>4pxを基本unitとし、2px・6px・10pxはborder、icon、compact controlの光学調整に限定する。</li>
<li>高密度化は余白の一律縮小ではない。control size、row height、component paddingなどdensityが所有する範囲だけを一括変更する。</li>
<li>viewport幅だけでdensityを変えない。SPでもcomfortableとは限らず、input methodと利用文脈から決める。</li>
</ul>
${h2('Spacing scale')}
<p><code class="inline">tokens/src/spacing.json</code>が正本です。<code class="inline">--sp-*</code>は実値を持つreference scaleであり、表示名とcopy値は生成CSSと一致します。</p>
<div class="panel pad">${SPACING_SCALE.map(space=>`<div style="display:grid;grid-template-columns:88px 48px minmax(1px,1fr);align-items:center;gap:var(--sp-3);margin-bottom:var(--sp-15)"><code class="inline" style="text-align:right">${space.token}</code><span class="mono" style="font-size:11px;color:var(--fg-subtle)">${space.value}</span><span style="height:14px;width:min(${space.value},100%);background:var(--primary);border-radius:var(--radius-2xs);min-width:1px" title="${space.usage}"></span></div>`).join('')}</div>
${h2('Selection order')}
<ol class="plain">
<li><b>Semantic / modifier tokenを先に探す。</b>Card paddingは<code class="inline">--card-pad</code>、form間隔は<code class="inline">--gap-form</code>、table rowは<code class="inline">--row-h</code>を使う。</li>
<li><b>関係を決める。</b>同一control内部、関連要素group、component間、section間のどれかを明示する。</li>
<li><b>Referenceを選ぶ。</b>既存semantic tokenがないcompositionだけ、最も近い<code class="inline">--sp-*</code>を選び、2px系例外の理由を残す。</li>
<li><b>独立変更が必要なら昇格する。</b>複数箇所で同じ意味が再利用されるならsemantic token、component固有ならComponent Token Gateで判断する。</li>
</ol>
${h2('Density modes')}
<div class="grid3">
${[['Compact','高密度な管理画面・テーブル・ログビューア向け。パワーユーザーが 1 画面で多くを見渡す用途。','行高 32px / Body 13px'],['Default','標準。汎用的な画面全般。<b>迷ったらこれを使う。</b>','行高 40px / Body 14px'],['Comfortable','読みやすさ優先。設定・オンボーディング・タッチデバイス。','行高 48px / Body 15px']].map(([t,d,m],i)=>`<div class="cardc"><div class="rowflex" style="justify-content:space-between"><b>${t}</b>${STATE.density===['compact','default','comfortable'][i]?badge({label:'現在',tone:'primary'}):''}</div><p style="font-size:var(--text-small);color:var(--fg-muted);margin:6px 0">${d}</p><code class="inline">${m}</code><div style="margin-top:10px"><button class="btn" data-variant="secondary" data-size="sm" data-setdensity="${['compact','default','comfortable'][i]}">この密度を試す</button></div></div>`).join('')}
</div>
${preview(`<div style="width:min(480px,100%)">${tableEl()}</div>`,'Live — テーブルの行高は密度に連動')}
${h2('Responsive and target spacing')}
<ul class="plain">
<li>Pointer targetは原則24×24 CSS px以上を最低条件とし、頻繁な操作・取り消せない操作・touch中心の主要操作は44×44 CSS pxを目標にする。</li>
<li>24px未満のtargetを例外的に使う場合は、24px直径のclearanceが隣接targetと交差しないこと、または同等の操作経路があることを検証する。</li>
<li>見た目のicon sizeとhit areaを分離する。小さいiconでもinteractive containerを広げ、隣接操作とのgapを保つ。</li>
<li>SPでsection gapを無条件に縮めない。1 column化後も、groupの関係性が同じならsemantic spacingを維持する。</li>
</ul>
${h2('Standards and evidence')}
<ul class="plain">
<li><a href="https://carbondesignsystem.com/elements/spacing/overview/">Carbon Spacing</a>: 2・4・8の倍数とdetailからlayoutまでのtoken scale。</li>
<li><a href="https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum">WCAG 2.2 Target Size (Minimum)</a>: 24×24 CSS pxまたは十分なclearance。</li>
<li><a href="https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced">WCAG 2.2 Target Size (Enhanced)</a>: 44×44 CSS pxの強化基準。</li>
</ul>
${nextPrev(['foundations/typography','Typography'],['foundations/layout','Layout'])}`));

docPage('foundations/layout',()=>shell(`
${head('Foundations','Layout','Viewport名ではなくcontentが成立する幅を境界にし、同じcomponent contractをPCとSPへreflowします。')}
${h2('Layout principles')}
<ul class="plain">
<li>Shell、page composition、component内部を分ける。Shellはviewport media query、再利用componentはcontainer queryを優先する。</li>
<li>Breakpointは端末判定ではなく、contentがwrap・overflow・過密になる直前の移行点として決める。</li>
<li>狭い幅では機能を消さず、stack、wrap、relocate、disclosureの順で再配置する。</li>
<li>Table、diagram、mapなど2次元layoutが本質的な領域だけ局所scrollを許し、page全体の2方向scrollを避ける。</li>
</ul>
${h2('Layout tokens')}
<p><code class="inline">tokens/src/layout.json</code>が正本です。Spacing aliasはsource pathと解決済みCSS値の両方を表示します。</p>
<div class="tscroll"><table class="ttable"><thead><tr><th>Token</th><th>Source</th><th>Resolved</th><th>用途</th></tr></thead><tbody>
${LAYOUT_TOKENS.filter(token=>token.id!=='focus-w').map(token=>`<tr><td class="mono">${token.token}</td><td class="mono">${token.source}</td><td class="mono">${getComputedStyle(document.documentElement).getPropertyValue(token.token).trim()}</td><td style="color:var(--fg-muted)">${token.usage}</td></tr>`).join('')}
</tbody></table></div>
${h2('Content-driven breakpoints')}
<p>CSS custom propertyはmedia query conditionでは使えないため、breakpoint metadataからbuild時に定数を同期し、testで実CSSと照合します。</p>
<div class="tscroll"><table class="ttable"><thead><tr><th>Boundary</th><th>Value</th><th>変更</th><th>範囲</th></tr></thead><tbody>
${LAYOUT_BREAKPOINTS.map(point=>`<tr><td class="mono">${point.id}</td><td class="mono">${point.value}</td><td>${point.description}</td><td style="color:var(--fg-muted)">${point.usage}</td></tr>`).join('')}
</tbody></table></div>
<div class="callout">${I.info}<span>600pxを「mobile」とみなすわけではありません。同じcomponentが狭いsidebarに入る場合はviewportが広くてもcontainer queryでstackします。</span></div>
${h2('シェルの構成')}
${codeBlock(`┌────────────┬────────────────────────────────┐\n│  Sidebar   │  Top Bar (breadcrumb / search)  │\n│  264px     ├────────────────────────────────┤\n│  fixed     │  Content  max-width: 880–1280px │\n│            │  var(--page-pad-inline)         │\n└────────────┴────────────────────────────────┘`,'txt','App shell')}
${h2('Responsive behavior contract')}
<div class="tscroll"><table class="ttable"><thead><tr><th>Concern</th><th>Wide container</th><th>Narrow container</th><th>不変</th></tr></thead><tbody>
${[
['Navigation','Sidebarを常設','Overlay drawerへ移動','項目、順序、current state'],
['Actions','Inline group','wrapまたはoverflow menu','primary actionとaccessible name'],
['Form','必要な場合だけ2 columns','1 column','field order、label、error association'],
['Data table','全columnを表示','優先column + local horizontal scrollまたは別detail view','data access、sort/filter semantics'],
['Dialog / Drawer','上限幅token','viewport gutterを残して縮小、必要ならfull-height','focus management、dismiss behavior'],
].map(row=>`<tr>${row.map((cell,index)=>`<td${index===0?' style="font-weight:550"':''}>${cell}</td>`).join('')}</tr>`).join('')}
</tbody></table></div>
${h2('Validation')}
<ul class="plain">
<li>320 CSS px相当まで、contentと機能を失わず原則vertical scrollだけで利用できる。</li>
<li>200% text resizeと400% zoomでsticky header/footerがfocusやcontentを隠さない。</li>
<li>320、600、900、1080、1280、1440pxと、各boundaryの前後1pxでwrap、overflow、focus orderを確認する。</li>
<li>PC/SPの差分はcontractの<code class="inline">responsiveBehavior</code>に記録し、別componentを作らない。</li>
</ul>
${h2('Standards and evidence')}
<ul class="plain">
<li><a href="https://www.w3.org/WAI/WCAG22/Understanding/reflow">WCAG 2.2 Reflow</a>: 320 CSS px相当での一方向scrollと機能保持。</li>
<li><a href="https://www.w3.org/TR/css-contain-3/">CSS Containment Level 3</a>: componentをcontainer inline-sizeへ応答させる仕組み。</li>
<li><a href="https://designsystem.digital.gov/utilities/layout-grid/">USWDS Layout Grid</a>: mobile-first responsive gridと設定可能なbreakpoint運用。</li>
</ul>
${nextPrev(['foundations/spacing','Spacing'],['foundations/radius','Radius'])}`));

docPage('foundations/radius',()=>shell(`
${head('Foundations','Radius','Shapeはcomponentの役割と階層を補助し、装飾目的で大きくしません。静的なCardは8px以下に保ちます。')}
${h2('Shape principles')}
<ul class="plain">
<li>Controlは4–8px、静的なCard/Panel/Tileは8pxを上限にし、密度が変わってもshapeの意味を保つ。</li>
<li>10–12pxはfloating surfaceとDialog、16pxは独立したhero mediaに限定する。</li>
<li>999pxは円またはpillであることが意味を持つAvatar、Status、Badgeに限る。通常Buttonの既定shapeには使わない。</li>
<li>Nested surfaceではinner radiusをouter radius以下にし、paddingが小さいときに角同士が衝突しないことを確認する。</li>
</ul>
${h2('Radius tokens')}
<p><code class="inline">tokens/src/radius.json</code>が正本で、CSSとこの表は同じmetadataから生成されます。</p>
<div class="rowflex" style="gap:var(--sp-4);align-items:flex-end;margin:var(--sp-3) 0;flex-wrap:wrap">
${RADIUS_SCALE.map(radius=>`<div style="text-align:center"><div style="width:56px;height:56px;background:var(--surface);border:1px solid var(--border-strong);border-radius:var(${radius.token});margin-bottom:6px"></div><code class="inline">${radius.token}</code><div class="mono" style="font-size:10px;color:var(--fg-subtle);margin-top:2px">${radius.value}</div></div>`).join('')}
</div>
${h2('Component usage')}
<div class="tscroll"><table class="ttable"><thead><tr><th>Component</th><th>Radius</th><th>備考</th></tr></thead><tbody>
${[['Button / Input','--radius-xs〜sm','Control sizeに応じる。largeでもmdを超えない'],['Card / Panel / Tile','--radius-md','静的containerの上限8px'],['Menu / Popover','--radius-lg','小さなfloating surface'],['Dialog / Command menu','--radius-xl','独立したoverlay surface'],['Badge / Avatar / Status','--radius-full','pillまたは円形という意味がある場合'],['Table row state','--radius-xs','選択highlightをcell edge内に収める'],['Navigation item','--radius-sm','密な反復item']].map(r=>`<tr><td style="font-weight:550">${r[0]}</td><td class="mono">${r[1]}</td><td style="color:var(--fg-muted)">${r[2]}</td></tr>`).join('')}
</tbody></table></div>
${h2('Decision checks')}
<ul class="plain">
<li>そのshapeはcontrol、static container、floating surface、circle/pillのどれか説明できるか。</li>
<li>同じanatomyとsizeのcomponentで同じradius tokenを使っているか。</li>
<li>Focus ring、overflow content、nested backgroundが角でclipされていないか。</li>
<li>PC/SPで別radiusへ切り替えていないか。Viewportではなくcomponent size/roleで決める。</li>
</ul>
<div class="callout">${I.info}<span>大きいradiusを「親しみやすさ」の一度限りの調整として追加しません。意味が既存stepで表せない場合だけ、利用範囲と変更所有者を定義してscale追加を検討します。</span></div>
${nextPrev(['foundations/layout','Layout'],['foundations/elevation','Elevation'])}`));

docPage('foundations/elevation',()=>shell(`
${head('Foundations','Elevation & Border','Surface colorとborderで持続的な階層を作り、shadowは他contentに重なる一時surfaceだけへ使います。')}
${h2('Layering model')}
<p>Elevationはvisual decorationではなく、どのsurfaceが他のcontentより手前にあり、一時的にdismissできるかを伝える関係です。</p>
<div class="tscroll"><table class="ttable"><thead><tr><th>Layer</th><th>Surface token</th><th>Elevation</th><th>例</th></tr></thead><tbody>
${[['Background','--bg','none','Page canvas'],['Static surface','--surface','border only','Card / Panel / Tile'],['Layered static surface','--surface-muted / --surface-raised','border or tonal difference','Nested field / selected region'],['Transient surface','--surface-overlay','sm–md','Dropdown / Menu / Popover / Tooltip'],['High transient surface','--surface-overlay','lg','Toast'],['Modal surface','--surface-overlay + --scrim','overlay','Dialog / Drawer']].map(r=>`<tr><td style="font-weight:550">${r[0]}</td><td class="mono">${r[1]}</td><td class="mono">${r[2]}</td><td style="color:var(--fg-muted)">${r[3]}</td></tr>`).join('')}
</tbody></table></div>
${h2('Elevation tokens')}
<p><code class="inline">tokens/src/shadow.json</code>がgeometryとtheme color modeの正本です。Offset、blur、spreadはtheme間で変えず、color/alphaだけを切り替えます。</p>
<div class="rowflex" style="gap:var(--sp-4);margin:var(--sp-3) 0;flex-wrap:wrap">
${SHADOW_LEVELS.map(level=>`<div style="text-align:center"><div style="width:88px;height:60px;background:var(--surface-overlay);border:1px solid var(--border);border-radius:var(--radius-md);box-shadow:var(${level.token});margin-bottom:8px"></div><code class="inline">${level.token}</code><div style="font-size:10px;color:var(--fg-subtle);margin-top:2px;max-width:112px">${level.usage}</div></div>`).join('')}
</div>
${h2('Selection rules')}
<ol class="plain">
<li><b>重なりを確認する。</b>通常document flow内の静的surfaceならshadowを使わず、surface tokenとborderを選ぶ。</li>
<li><b>一時性を確認する。</b>DismissできるDropdown/Menu/Popoverならsm–md、Toastならlg、modal surfaceならoverlayを使う。</li>
<li><b>Scrimを分離する。</b>Dialog/Drawerのbackground modalityは<code class="inline">--scrim</code>が担い、shadowだけで背後の無効化を表さない。</li>
<li><b>Stackingを実装する。</b>Shadow levelはz-indexやfocus managementを決めない。overlay system側でstack、dismiss、focus returnを管理する。</li>
</ol>
<div class="callout">${I.info}<span><code class="inline">--shadow-xs</code>だけはcontrolの触感またはごく小さな一時surfaceに許可します。<code class="inline">--shadow-sm</code>以上をCard、Panel、Tileへ付けません。</span></div>
<p>Dark themeではshadow colorのalphaだけを調整し、<code class="inline">--surface-raised</code>の明度差とborderも併用します。High Contrastではshadowを唯一の境界にせず、常に明確なborderを残します。</p>
${h2('Border tokens')}
<div class="tscroll"><table class="ttable"><thead><tr><th>Token</th><th>プレビュー</th><th>用途</th></tr></thead><tbody>
${[['--border-muted','--border-muted','Table row・list divider'],['--border','--border','Card・Inputの標準境界'],['--border-strong','--border-strong','Hover・強いgroup boundary'],['--focus-ring','--focus-ring','Keyboard focus indicator'],['--danger','--danger','Error field'],['--success','--success','成功state'],['--warning','--warning','警告state']].map(([k,v,u])=>`<tr><td class="mono">${k}</td><td><span style="display:inline-block;width:72px;height:26px;border:2px solid var(${v});border-radius:var(--radius-sm);background:var(--surface)"></span></td><td style="color:var(--fg-muted)">${u}</td></tr>`).join('')}
</tbody></table></div>
${h2('Standards and evidence')}
<ul class="plain">
<li><a href="https://spectrum.adobe.com/page/object-styles/">Spectrum Object Styles</a>: shadowをelevatedでdismissibleなtransient componentへ限定する運用。</li>
<li><a href="https://carbondesignsystem.com/components/dropdown/usage/">Carbon Dropdown</a>: open menuの重なりをshadowで伝えるcomponent例。</li>
<li><a href="https://carbondesignsystem.com/elements/color/usage/">Carbon Color Layering</a>: static hierarchyをtheme-relative surface layerで表す運用。</li>
</ul>
${nextPrev(['foundations/radius','Radius'],['foundations/motion','Motion'])}`));

docPage('foundations/motion',()=>shell(`
${head('Foundations','Motion','Motionは状態変化の理解を補助し、意味や操作完了を動きだけへ依存させません。')}
${h2('Motion philosophy')}
<ul class="plain">
<li>Motionを使う前に、何が変わったかをtext、icon、surface、positionで静的にも理解できる状態にする。</li>
<li>反復する業務操作は50–180ms、大きなoverlayは240msまでを基準にし、320msはpage continuityが必要な限定用途にする。</li>
<li>Position/scaleの変化は4–8pxを上限にし、bounce、parallax、decorative loopを標準componentへ入れない。</li>
<li><code class="inline">prefers-reduced-motion: reduce</code>では非本質的なspatial motionを0ms/0pxへ置換し、最終stateとfeedbackは保持する。</li>
</ul>
${h2('Duration tokens')}
<p><code class="inline">tokens/src/motion.json</code>がduration、easing、distanceの正本です。</p>
<div class="tscroll"><table class="ttable"><thead><tr><th>Token</th><th>Value</th><th>用途</th><th>Demo</th></tr></thead><tbody>
${MOTION_DURATIONS.map(duration=>`<tr><td class="mono">${duration.token}</td><td class="mono">${duration.value}</td><td style="color:var(--fg-muted)">${duration.usage}</td><td><button class="btn" data-variant="secondary" data-size="xs" onclick="this.animate([{transform:'translateX(0)'},{transform:'translateX(8px)'},{transform:'translateX(0)'}],{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:${duration.milliseconds*2},easing:'${MOTION_EASINGS.find(easing=>easing.id==='standard').value}'})">再生</button></td></tr>`).join('')}
</tbody></table></div>
${h2('Easing tokens')}
<div class="tscroll"><table class="ttable"><thead><tr><th>Token</th><th>Curve</th><th>用途</th></tr></thead><tbody>
${MOTION_EASINGS.map(easing=>`<tr><td class="mono">${easing.token}</td><td class="mono">${easing.value}</td><td style="color:var(--fg-muted)">${easing.usage}</td></tr>`).join('')}
</tbody></table></div>
${h2('Distance tokens')}
<div class="tscroll"><table class="ttable"><thead><tr><th>Token</th><th>Value</th><th>用途</th></tr></thead><tbody>
${MOTION_DISTANCES.map(distance=>`<tr><td class="mono">${distance.token}</td><td class="mono">${distance.value}</td><td style="color:var(--fg-muted)">${distance.usage}</td></tr>`).join('')}
</tbody></table></div>
${h2('Interaction behavior')}
<div class="tscroll"><table class="ttable"><thead><tr><th>State</th><th>Standard motion</th><th>Reduced motion</th><th>不変</th></tr></thead><tbody>
${[
['hover / pressed','Color/borderのみ、instant–fast','即時','state colorとsemantics'],
['focus','即時focus ring','即時focus ring','focus visibility'],
['selected','Surface/colorをfastで変更','即時','aria-selected/checkedとlabel'],
['expanded / collapsed','normal + chevron、必要なら4px以内','即時、chevron最終向き','aria-expandedとcontent'],
['enter','opacity + 4px、normal/enter','即時表示','focus移動とaccessible name'],
['exit','opacity、fast/exit','即時非表示','focus returnとdismiss result'],
['loading','Spinner + status text','Static progress icon + status text','role=statusと二重実行防止'],
].map(row=>`<tr>${row.map((cell,index)=>`<td${index===0?' class="mono"':index>0?' style="color:var(--fg-muted)"':''}>${cell}</td>`).join('')}</tr>`).join('')}
</tbody></table></div>
${h2('Implementation requirements')}
<ul class="plain">
<li>CSS transition/animationは<code class="inline">--dur-*</code>、<code class="inline">--ease-*</code>、<code class="inline">--motion-distance-*</code>を使う。</li>
<li>Web Animations API、canvas、video、chart animationは<code class="inline">matchMedia('(prefers-reduced-motion: reduce)')</code>を個別に確認する。</li>
<li><code class="inline">animationend</code>をstate更新の唯一のtriggerにしない。Durationが0でも最終stateへ到達させる。</li>
<li>5秒を超えて自動で動く、点滅する、scrollするcontentにはpause/stop/hideを提供する。Loading feedbackはtextでも伝える。</li>
<li>Responsiveでdistanceを増やさない。同じ意味のtransitionをPC/SPで共有し、狭い画面でも静的代替を保つ。</li>
</ul>
${h2('Standards and evidence')}
<ul class="plain">
<li><a href="https://www.w3.org/TR/mediaqueries-5/#prefers-reduced-motion">Media Queries Level 5</a>: 非本質的motionをremove/replaceするuser preference。</li>
<li><a href="https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions">WCAG 2.2 Animation from Interactions</a>: interaction起点の非本質的animationを無効化できること。</li>
<li><a href="https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide">WCAG 2.2 Pause, Stop, Hide</a>: 自動で続くmoving contentのcontrol。</li>
<li><a href="https://carbondesignsystem.com/elements/motion/overview/">Carbon Motion</a>: productive motion、enter/exit easing、duration scale、静的代替の運用例。</li>
</ul>
${nextPrev(['foundations/elevation','Elevation'],['foundations/iconography','Iconography'])}`));

docPage('foundations/iconography',()=>shell(`
${head('Foundations','Iconography','アイコンは操作や状態の走査を速める補助記号です。意味、名前、サイズ、方向性を機械可読レジストリで固定します。')}
${h2('Source of truth')}
<p><code class="inline">design/iconography.json</code> が ${ICON_META.length} glyph の正本です。表示用SVGは <code class="inline">js/utils.js</code>、生成済みmetadataは <code class="inline">js/generated/iconography-meta.js</code> に同期します。</p>
<ul class="plain">
<li>座標系は <code class="inline">0 0 24 24</code>。Stroke iconは原則2px、小サイズの単純形状だけ1.5pxを許可する。</li>
<li>Strokeを標準とし、solid・mixed・brandは意味やsilhouetteに必要な例外としてregistryに明記する。</li>
<li>色は <code class="inline">currentColor</code> を継承する。状態は色だけで伝えず、text、shape、またはprogrammatic stateを併用する。</li>
</ul>
${preview(`<div class="rowflex" style="gap:var(--sp-4);color:var(--fg-muted);flex-wrap:wrap">${ICON_META.map(icon=>`<span title="${esc(icon.label)}" style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px">${I[icon.id]}</span>`).join('')}</div>`,'全33 glyph')}
${h2('Registry')}
<div class="tscroll"><table class="ttable"><thead><tr><th>Icon</th><th>Canonical name</th><th>Meaning</th><th>Aliases</th><th>Default</th><th>Direction</th></tr></thead><tbody>
${ICON_META.map(icon=>`<tr><td><span class="rowflex" style="gap:var(--sp-2)">${I[icon.id]} ${esc(icon.label)}</span></td><td class="mono">${esc(icon.canonicalName)}</td><td>${esc(icon.meaning)}</td><td class="mono">${icon.aliases.map(esc).join(', ')}</td><td class="mono">${icon.defaultSize} / ${ICON_SIZES[icon.defaultSize].value}px</td><td class="mono">${icon.directionality}</td></tr>`).join('')}
</tbody></table></div>
${h2('Size scale')}
<div class="tscroll"><table class="ttable"><thead><tr><th>Token</th><th>Size</th><th>Usage</th></tr></thead><tbody>
${Object.values(ICON_SIZES).map(size=>`<tr><td class="mono">${size.id}</td><td class="mono">${size.value}px</td><td>${esc(size.usage)}</td></tr>`).join('')}
</tbody></table></div>
<ul class="plain">
<li>PCとSPで同じsemantic iconを使う。SPではglyphを任意に拡大せず、Buttonなどcontrol全体のhit areaを24px以上、原則44px程度へ広げる。</li>
<li>Text labelとのgapはSpacing tokenを使い、glyph boxを固定してlabelやloading stateでlayout shiftを起こさない。</li>
<li><code class="inline">mirror-in-rtl</code> だけRTLで反転する。中立形状とbrand markは反転しない。</li>
</ul>
${h2('Accessibility decisions')}
<ul class="plain">
<li>再利用SVG glyphは <code class="inline">aria-hidden="true"</code>、<code class="inline">focusable="false"</code> とする。Accessible nameはButtonまたはLinkが所有する。</li>
<li>Icon-only controlには <code class="inline">aria-label</code> または <code class="inline">aria-labelledby</code> が必須。Tooltipは視覚的な補足であり、accessible nameの代替にはしない。</li>
<li>Visible textにない情報をiconが伝える場合は、近接textまたはscreen reader向けtextで同じ意味を提供する。</li>
<li>理解やcontrol stateの識別に必要なiconは隣接色と3:1以上を満たす。同じ機能には同じcanonical nameを使う。</li>
<li>意味が曖昧なactionや破壊的actionはiconだけにせず、visible labelを併記する。</li>
</ul>
${h2('Standards and evidence')}
<ul class="plain">
<li><a href="https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html">WCAG 2.2 Non-text Content</a>: 意味を持つnon-text contentには同等のtext alternativeを提供する。</li>
<li><a href="https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html">WCAG 2.2 Non-text Contrast</a>: 必要なUI componentとgraphical objectは隣接色と3:1以上。</li>
<li><a href="https://www.w3.org/WAI/WCAG22/Understanding/consistent-identification.html">WCAG 2.2 Consistent Identification</a>: 同じ機能を持つcomponentは一貫して識別する。</li>
</ul>
${nextPrev(['foundations/motion','Motion'],['foundations/accessibility','Accessibility'])}`));

docPage('foundations/accessibility',()=>{
  const gb=(good,bad,gt,bt)=>`<div class="dodont"><div class="box do"><div class="cap">${I.check} Do</div><div class="bd">${good}</div><div class="tx">${gt}</div></div><div class="box dont"><div class="cap">${I.x} Don't</div><div class="bd">${bad}</div><div class="tx">${bt}</div></div></div>`;
  const principleLabel={perceivable:'Perceivable',operable:'Operable',understandable:'Understandable',robust:'Robust'};
  return shell(`
${head('Foundations','Accessibility',`${A11Y_META.standard.name} ${A11Y_META.standard.version} ${A11Y_META.standard.conformanceLevel} は、すべてのMeridian componentと生成UIの受け入れ条件です。`)}
${h2('Conformance policy')}
<p>${esc(A11Y_META.policy.conformance)}</p>
<div class="callout warn">${I.warn}<span>${esc(A11Y_META.policy.releaseBlocker)}</span></div>
<ul class="plain"><li><b>Baseline:</b> 適用されるLevel A / AAをすべて満たす。</li><li><b>Enhancement:</b> 44px targetやreduced motionなどMeridianの強化基準はbaselineと区別して維持する。</li><li><b>Exception:</b> ${esc(A11Y_META.policy.exceptions)}</li></ul>
${h2('Requirements registry')}
<p><code class="inline">design/accessibility.json</code> が ${A11Y_REQUIREMENTS.length} requirements の正本です。Component contractは該当requirementをsemantic、keyboard、focus、announcement、responsive behaviorへ具体化します。</p>
<p class="muted">${esc(A11Y_META.policy.registryScope)}</p>
<div class="tscroll"><table class="ttable"><thead><tr><th>Principle</th><th>ID</th><th>WCAG</th><th>Level</th><th>Requirement</th></tr></thead><tbody>
${A11Y_REQUIREMENTS.map(req=>`<tr><td>${principleLabel[req.principle]}</td><td class="mono">${req.id}</td><td class="mono">${req.criteria.join(', ')}</td><td>${req.level}</td><td>${esc(req.requirement)}</td></tr>`).join('')}
</tbody></table></div>
${h2('Contrast and non-color cues')}
<p>通常text 4.5:1、大きなtext 3:1、識別に必要なcontrol・state・iconは隣接色と3:1以上です。値は<a href="#/foundations/color">Color</a>で全seed/themeを検査し、実際に重なるpairを個別確認します。</p>
${gb(`<span style="background:var(--primary);color:var(--primary-fg);padding:var(--sp-2) var(--sp-3);border-radius:var(--radius-sm);font-size:var(--text-label);font-weight:550">Deploy</span>`,`<span style="background:var(--primary-subtle);color:var(--fg-subtle);padding:var(--sp-2) var(--sp-3);border-radius:var(--radius-sm);font-size:var(--text-label)">Deploy</span>`,'承認済みforeground/background pairを使い、状態はtextやshapeも併用する。','淡い面へ任意の淡いtextを重ね、色だけで状態を示す。')}
${h2('Keyboard and focus')}
<ul class="plain"><li>Native elementを優先し、Tab順はDOM順にする。Positive <code class="inline">tabindex</code>で順序を修正しない。</li><li>CompositeはAPG準拠のArrow keyとroving tabindex/aria-activedescendantを実装する。</li><li>Modalはfocusを内側に保ち、Escape/closeを提供し、閉じた後triggerへ戻す。通常componentはTabで退出できる。</li><li>Focus ringは全theme/surfaceで見え、sticky contentやoverlayで完全に隠れないようscroll marginと配置を検証する。</li></ul>
${gb(`<button class="btn sim-focus" data-variant="secondary" data-size="sm">フォーカス中</button>`,`<button class="btn" data-variant="secondary" data-size="sm" style="outline:none">フォーカス中(不可視)</button>`,'focus-visible ringと論理的なfocus順を保持する。','outlineを消したまま代替indicatorを提供しない。')}
${h2('Pointer target')}
<p>WCAG 2.5.8のbaselineは <b>${A11Y_META.targetSize.minimumCssPx}×${A11Y_META.targetSize.minimumCssPx} CSS px</b>または規定のclearanceです。Meridianはtouch中心・主要action・隣接icon controlで <b>${A11Y_META.targetSize.preferredCssPx}×${A11Y_META.targetSize.preferredCssPx}px程度</b>を優先します。PC/SPでglyphを変えず、control boxを広げます。</p>
${h2('Forms, errors, and recovery')}
${gb(`<span class="rowflex" style="gap:var(--sp-1);font-size:var(--text-small);color:var(--danger-fg)">${I.err}@ を含むメールアドレスを入力してください</span>`,`<span style="font-size:var(--text-small);color:var(--danger-fg)">エラー: 不正な値です</span>`,'Error箇所、原因、修正方法をtextで示し、fieldと関連付ける。','原因も修正方法も分からないgeneric message。')}
<ul class="plain"><li>Visible label、format、required、helperを入力前に示し、placeholderだけをlabelにしない。</li><li>送信失敗時は入力を保持する。Short formは最初のinvalid field、long formはfocus可能なerror summaryとfield linkを選び、contextに応じてcontractへ明記する。</li><li><code class="inline">aria-invalid</code>と<code class="inline">aria-describedby</code>/<code class="inline">aria-errormessage</code>をvisual stateと同期する。</li></ul>
${h2('Status, loading, and focus')}
<div class="tscroll"><table class="ttable"><thead><tr><th>Change</th><th>Mechanism</th><th>Focus</th></tr></thead><tbody>
${[['保存完了・結果件数・通常loading','role=status / aria-live=polite','現在位置を保持'],['即時対応が必要なerror','role=alert。連続使用しない','原則保持'],['Dialog open / route change','Semantic container + focus management','初期位置へ移動し、closeで復帰'],['Form submit error','Inline error + summary/field association','formの長さとcontextでsummaryまたは最初のinvalidへ']].map(row=>`<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join('')}
</tbody></table></div>
<p>Loading indicatorを出す遅延時間はWCAG要件ではありません。予測時間とlayout stabilityから製品ごとに決め、表示したstatusはtextでも通知し、二重submitを防ぎます。</p>
${h2('Disabled and readonly')}
<div class="tscroll"><table class="ttable"><thead><tr><th></th><th>Disabled</th><th>Readonly</th></tr></thead><tbody>
<tr><td>意味</td><td>現在は操作できない</td><td>参照のみ(値は有効)</td></tr>
<tr><td>フォーカス</td><td>不可(aria-disabled なら可)</td><td>可・コピー可</td></tr>
<tr><td>送信</td><td>対象外</td><td>対象</td></tr>
<tr><td>推奨</td><td>通常はnative disabled。discoverabilityが必要なcompositeだけaria-disabled</td><td>編集手段への導線を示す</td></tr>
</tbody></table></div>
<p>${esc(A11Y_META.disabledState.explanation)}</p>
${h2('Motion and responsive content')}
<ul class="plain"><li><a href="#/foundations/motion">Motion</a>のreduced matrixを適用し、非本質的spatial motionを0ms/0pxまたは静的代替へ置換する。CSSのglobal overrideだけでscripted animationを解決したことにしない。</li><li>200% text、320 CSS px相当、text spacing overrideで内容・action・focus indicatorを失わない。</li><li>Drag actionにはsingle-pointerとkeyboard alternativeを提供する。</li></ul>
${h2('Quality gates')}
<div class="grid2">${A11Y_QUALITY_GATES.map(gate=>`<section class="panel pad"><h3 style="margin-top:0">${esc(gate.id)}</h3><p class="muted">${esc(gate.stage)} / ${esc(gate.owner)}</p><ul class="plain">${gate.checks.map(check=>`<li>${esc(check)}</li>`).join('')}</ul></section>`).join('')}</div>
${h2('Standards and evidence')}
<ul class="plain"><li><a href="https://www.w3.org/TR/WCAG22/">WCAG 2.2</a>: A/AA baselineと2.2追加criteria。</li><li><a href="https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum">Target Size (Minimum)</a>: 24px baselineとspacing/inline等の例外。</li><li><a href="https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum">Focus Not Obscured</a>: author-created contentでfocusを完全に隠さない。</li><li><a href="https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/">APG Keyboard Interface</a>: predictable focus、composite navigation、disabled discoverability。</li><li><a href="https://www.w3.org/WAI/tutorials/forms/notifications/">WAI Form Notifications</a>: error summary、inline association、修正方法、focus option。</li><li><a href="https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html">Status Messages</a>: focusを移動しないmessageのprogrammatic通知。</li></ul>
${nextPrev(['foundations/iconography','Iconography'],['foundations/content','Content Guidelines'])}`)});

docPage('foundations/content',()=>{
  const categoryLabel={voice:'Voice',actions:'Actions',states:'States',forms:'Forms',format:'Format',localization:'Localization',accessibility:'Accessibility',ai:'AI'};
  return shell(`
${head('Foundations','Content Guidelines','UI textはtask、state、risk、次のactionを伝える設計要素です。人間とAIが同じ判断で書けるmachine-readable rulesを正本にします。')}
${h2('Source of truth')}
<p><code class="inline">design/content-guidelines.json</code> が ${CONTENT_RULES.length} writing rules、${CONTENT_PATTERNS.length} message patterns、${CONTENT_TERMS.length} canonical terms の正本です。<code class="inline">js/generated/content-guidelines-meta.js</code> とこのページは同じsourceから生成します。</p>
<div class="callout info">${I.info}<span>Default localeは <b>${CONTENT_META.locale.default}</b>、fallbackは <b>${CONTENT_META.locale.fallback}</b>。${esc(CONTENT_META.locale.policy)}</span></div>
${h2('Voice')}
<div class="grid2">${CONTENT_META.voice.map(voice=>`<section class="panel pad"><h3 style="margin-top:0">${esc(voice.attribute)}</h3><p>${esc(voice.means)}</p><p class="muted"><b>避ける:</b> ${esc(voice.avoid)}</p></section>`).join('')}</div>
<p>Voiceは一定に保ち、toneだけをriskとcontextへ合わせます。Successでも大げさに称賛せず、errorでも責めたり過剰に謝ったりせず、事実と次のstepを伝えます。</p>
${h2('Writing rules')}
<div class="tscroll"><table class="ttable"><thead><tr><th>Category</th><th>Rule</th><th>Decision</th><th>Do</th><th>Don't</th></tr></thead><tbody>
${CONTENT_RULES.map(rule=>`<tr><td>${categoryLabel[rule.category]}</td><td class="mono">${rule.id}</td><td>${esc(rule.rule)}</td><td style="color:var(--success-fg)">${rule.do.map(esc).join(' / ')}</td><td style="color:var(--fg-subtle)">${rule.dont.map(esc).join(' / ')}</td></tr>`).join('')}
</tbody></table></div>
${h2('Action labels')}
<ul class="plain"><li>動詞と必要な対象で結果を予測できるようにする。対象が近接contextで明白なら「再試行」のように短縮できる。</li><li>破壊的actionは「はい」「続行」ではなく「プロジェクトを削除」のように対象と動詞を維持する。</li><li>「キャンセル」は変更を保存せず取り消す場合に使う。「戻る」「閉じる」「後で行う」と交換しない。</li><li>同じ画面のprimary actionは原則1つにし、labelだけでaction hierarchyの不足を補わない。</li></ul>
${h2('Message patterns')}
<div class="tscroll"><table class="ttable"><thead><tr><th>State</th><th>Required parts</th><th>Example</th><th>Avoid</th></tr></thead><tbody>
${CONTENT_PATTERNS.map(pattern=>`<tr><td class="mono">${pattern.id}</td><td>${pattern.requiredParts.map(esc).join(' + ')}</td><td style="color:var(--success-fg)">${esc(pattern.example)}</td><td style="color:var(--fg-subtle)">${esc(pattern.avoid)}</td></tr>`).join('')}
</tbody></table></div>
<ul class="plain"><li>Errorは利用者が修正できる入力errorと、service/permission側の問題を区別する。入力を消さない。</li><li>Successは完了が画面変化だけで明らかな場合に重複表示しない。</li><li>Emptyはfirst use、zero result、permission、service failureを同じ「データがありません」で扱わない。</li><li>Confirmationはtitleにactionと対象、bodyに影響と取消可否、primary buttonに同じ動詞を使う。</li></ul>
${h2('Canonical terminology')}
<p>Component、docs、contract、translation keyで同じconcept IDを参照します。Aliasを検索入力として受け入れても、表示はlocaleのcanonical termへ戻します。</p>
<div class="tscroll"><table class="ttable"><thead><tr><th>Concept</th><th>ja-JP</th><th>en</th><th>Avoid in ja-JP</th></tr></thead><tbody>
${CONTENT_TERMS.map(term=>`<tr><td class="mono">${term.concept}</td><td>${esc(term.ja)}</td><td>${esc(term.en)}</td><td>${term.avoid.map(esc).join(', ')}</td></tr>`).join('')}
</tbody></table></div>
${h2('Localization and formatting')}
<ul class="plain"><li>Sentence fragmentを連結せず、placeholderを含む完全なmessageを翻訳単位にする。</li><li>Number、currency、unit、date、time、pluralはlocale-aware formatterを使う。<code class="inline">07/13/26</code>のような曖昧な日付を避ける。</li><li>Button、tab、table、dialogはtranslationで長くなる前提でwrap/reflowする。Action名を固定widthのellipsisで隠さない。</li><li>短いbutton/label/headingに句点を付けず、複数文や完全な説明文にはlocaleの句読点を使う。</li></ul>
${h2('AI-generated content')}
<ul class="plain"><li>AIを使う場所と生成元を明示し、人間が作成または確認したように装わない。</li><li>Capabilityと主要なlimitationをtask前またはoutput近傍で示す。高riskな内容では誤りの可能性とverificationを具体化する。</li><li>Review、edit、retry、undoと可能ならnon-AI fallbackを提供する。不可逆・高影響actionを自動実行しない。</li><li>Promptやfileをserverへ送る前に、送信対象、用途、保存、学習、第三者共有を説明する。</li></ul>
${h2('Quality gates')}
<div class="grid2">${CONTENT_QUALITY_GATES.map(gate=>`<section class="panel pad"><h3 style="margin-top:0">${esc(gate.id)}</h3><ul class="plain">${gate.checks.map(check=>`<li>${esc(check)}</li>`).join('')}</ul></section>`).join('')}</div>
${h2('Standards and evidence')}
<ul class="plain"><li><a href="https://design-system.service.gov.uk/components/error-message/">GOV.UK Error message</a>: 問題と修正方法を具体的に示し、入力を保持し、summaryとinlineで同じmessageを使う。</li><li><a href="https://design-system.service.gov.uk/components/button/">GOV.UK Button</a>: main actionを明確にし、warning actionを限定し、結果が分かるlabelを使う。</li><li><a href="https://learn.microsoft.com/ja-jp/style-guide/global-communications/writing-tips">Microsoft Global Writing Tips</a>: 短く単純な文、翻訳しやすい完全なstructure。</li><li><a href="https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/">Microsoft HAX Guidelines</a>: AIのcapability/limitation、error recovery、explanationをinteraction全体で設計する。</li><li><a href="https://developer.apple.com/design/human-interface-guidelines/generative-ai/">Apple Generative AI</a>: AI利用の明示、human control、error可能性、data transparency、fallback。</li></ul>
${nextPrev(['foundations/accessibility','Accessibility'],['tokens/overview','Token Overview'])}`)});
