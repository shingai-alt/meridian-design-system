"use strict";
/* ============ Foundations: Color ============ */
docPage('foundations/color',()=>{
  const P=PALETTES,T=SEM;
  const gb=(good,bad,gt,bt)=>`<div class="dodont"><div class="box do"><div class="cap">${I.check} Do</div><div class="bd">${good}</div><div class="tx">${gt}</div></div><div class="box dont"><div class="cap">${I.x} Don't</div><div class="bd">${bad}</div><div class="tx">${bt}</div></div></div>`;
  const palRow=(name,scale)=>`<div class="pal"><span class="nm">${name}</span>${STEPS.map(s=>`<button class="cell" style="background:${scale[s]}" data-copy="${scale[s]}" title="${name}-${s} ${scale[s]}"><span style="color:${L_MAP[s]>60?'rgba(0,0,0,.55)':'rgba(255,255,255,.8)'}">${s}</span></button>`).join('')}</div>`;
  const themePrev=(th,label)=>{const t=buildSemantics(P,th);return `<div style="background:${t.background};border:1px solid ${t.border};border-radius:var(--radius-lg);padding:14px;flex:1;min-width:220px">
    <div style="font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:${t['foreground-subtle']};margin-bottom:10px">${label}</div>
    <div style="background:${t.surface};border:1px solid ${t.border};border-radius:var(--radius-md);padding:12px">
      <div style="color:${t.foreground};font-weight:600;font-size:13px;margin-bottom:2px">Deploy service</div>
      <div style="color:${t['foreground-muted']};font-size:12px;margin-bottom:10px">main@a1b2c3 → production</div>
      <div style="display:flex;gap:6px"><span style="background:${t.primary};color:${t['primary-foreground']};font-size:12px;font-weight:550;padding:5px 12px;border-radius:var(--radius-sm)">Deploy</span><span style="border:1px solid ${t.border};color:${t.foreground};font-size:12px;padding:5px 12px;border-radius:var(--radius-sm)">Cancel</span></div>
      <div style="margin-top:10px;display:flex;gap:6px"><span style="background:${t['success-subtle']};color:${t['success-foreground']};font-size:10.5px;font-weight:550;padding:1px 8px;border-radius:var(--radius-full)">Healthy</span><span style="background:${t['danger-subtle']};color:${t['danger-foreground']};font-size:10.5px;font-weight:550;padding:1px 8px;border-radius:var(--radius-full)">2 errors</span></div>
    </div></div>`};
  const pairs=[['foreground','background'],['foreground','surface'],['foreground-muted','surface'],['primary-foreground','primary'],['primary','surface'],['success-foreground','success-subtle'],['danger-foreground','danger-subtle']];
  const cRow=p=>{const fg=T[p[0]],bg=T[p[1]];const r=contrast(fg,bg);const pass=r>=4.5?'AA':r>=3?'AA Large':'Fail';
    return `<tr><td class="mono">${p[0]} / ${p[1]}</td><td><span style="background:${bg};color:${fg};padding:2px 10px;border-radius:var(--radius-xs);border:1px solid var(--border-muted);font-size:12px">Aa テキスト</span></td><td class="mono num" style="text-align:right">${r.toFixed(2)}</td><td>${badge({label:pass,tone:pass==='Fail'?'danger':pass==='AA'?'success':'warning'})}</td></tr>`};
  return shell(`
${head('Foundations','Color','1 つの基準色(Seed color)から、OKLCH 色空間で 9 系統の Primitive palette と 40+ の Semantic token を自動生成するカラーシステムです。')}
${h2('カラーシステムの目的')}
<ul class="plain">
<li>ブランドカラーを UI 全体へ自然に展開する(逐一の手調整をなくす)</li>
<li>Light / Dark / High contrast で破綻しない(WCAG コントラスト比を自動的に満たすよう調整される生成スケール)</li>
<li>表示用途ごとに Semantic color を使い、実装時に hex を直接使わない</li>
<li>UI の状態を色だけに頼らず、線・ラベル・アイコンでも補助する</li>
<li>ユーザー・テナントが Primary color seed を変更できる</li>
</ul>
${h2('Seed color')}
<p>Seed はユーザーまたはブランドが選択する基準色です。内部ではまず Seed を OKLCH(知覚的に均一な明度 L・彩度 C・色相 H で色を表す空間)に変換し、そこから全スケールを導出します。HSL と違い、OKLCH の L は色相が変わっても同じ数値なら同じ明るさに見えるため、どんな Seed を選んでも一貫した見え方のスケールになります。Neutral は Seed の色相をわずかに帯びた無彩色になり、画面全体の統一感につながります。</p>
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
${gb(`<span style="width:24px;height:24px;border-radius:var(--radius-sm);background:linear-gradient(135deg,var(--primary),var(--accent));display:inline-block"></span>`,`<span style="background:var(--accent);color:#fff;padding:5px 14px;border-radius:var(--radius-sm);font-size:13px;font-weight:550">Deploy</span>`,'ロゴマーク・アバターのフォールバック画像などブランドを識別させる箇所にのみ使う。','ボタンやバッジの配色に accent を使う。UI の状態や優先度の意味が伝わらず、ブランド色と状態色が混在する。')}
${h2('Semantic tokens')}
<p>UI の「用途」にマッピングされた色です。実装・デザインで使うのはこの層(と Component 層)のみです。全 42 トークンの値は <a href="#/tokens/overview">Token Overview</a> を参照してください。主要なマッピングは以下の通りです。<code class="inline">primary</code> / <code class="inline">secondary</code> / <code class="inline">accent</code> は固定のスケール段ではなく、背景とのコントラスト比が基準(Light / Dark は 4.5:1、High contrast は 7:1)を満たす段まで自動的に探索して選ばれます。</p>
<div class="tscroll"><table class="ttable"><thead><tr><th>Token</th><th>Light</th><th>Dark</th><th>用途</th></tr></thead><tbody>
${['background','surface','foreground','foreground-muted','border','primary','primary-subtle','primary-foreground','success','danger','focus-ring'].map(k=>{const l=buildSemantics(P,'light')[k],d=buildSemantics(P,'dark')[k];
  return `<tr><td class="mono">--${k.replace('foreground','fg').replace('background','bg')}</td><td><span class="swpair"><span class="sw" style="background:${l}"></span><span class="mono">${l}</span></span></td><td><span class="swpair"><span class="sw" style="background:${d}"></span><span class="mono">${d}</span></span></td><td style="color:var(--fg-muted)">${(SEM_META.find(m=>m[0]===k)||['','',''])[1]}</td></tr>`}).join('')}
</tbody></table></div>
${h2('Theme preview')}
<p>同一の Semantic token が、3 テーマでどのようにマッピングされるかのプレビューです。</p>
<div class="rowflex" style="align-items:stretch;gap:var(--sp-3)">${themePrev('light','Light')}${themePrev('dark','Dark')}${themePrev('hc','High contrast')}</div>
${h2('Component tokens')}
<p>コンポーネント固有の色は Semantic を参照する第 4 層として定義します。テーマ変更時に個別調整が必要になった場合も、この層だけで吸収できます。</p>
${codeBlock(`--button-primary-bg: var(--primary);\n--button-primary-bg-hover: var(--primary-hover);\n--button-primary-fg: var(--primary-foreground);\n--input-bg: var(--surface);\n--input-border-focus: var(--primary);\n--table-row-hover: color-mix(in srgb, var(--fg) 3%, transparent);\n--sidebar-item-active-bg: var(--primary-subtle);`,'css','component-tokens.css')}
${h2('Contrast checker')}
<p>現在の Seed / テーマにおける主要ペアのコントラスト比です(WCAG 2.2 基準)。Seed を変えて確認してください。</p>
<div class="tscroll"><table class="ttable"><thead><tr><th>ペア</th><th>プレビュー</th><th style="text-align:right">比率</th><th>判定</th></tr></thead><tbody>${pairs.map(cRow).join('')}</tbody></table></div>
<div class="callout warn" style="margin-top:var(--sp-3)">${I.warn}<span>明るい Seed(Amber など)では <code class="inline">primary</code> 自体がより濃いステップへ、<code class="inline">primary-foreground</code> が自動的に暗色へ切り替わり、基準コントラストを満たすよう調整されます。それでも AA を満たさない組み合わせが残る場合は、リリース前に必ず解消してください。</span></div>
${h2('Data visualization colors')}
<p>チャート色は Seed の色相を起点に、識別しやすい色相差(36–70°)で 6 色を生成します。順序は chart-1 → chart-6 で固定です。</p>
<div class="rowflex" style="margin-bottom:var(--sp-3)">${CHART.map((c,i)=>`<button class="cell" style="width:64px;height:40px;background:${c};border-radius:var(--radius-sm);border:1px solid rgba(0,0,0,.06)" data-copy="${c}" title="chart-${i+1}"><span style="font-size:9px;color:${onColor(c)==='#ffffff'?'rgba(255,255,255,.85)':'rgba(0,0,0,.6)'};font-family:var(--font-mono)">${i+1}</span></button>`).join('')}
<span class="rowflex" style="margin-left:12px;gap:6px">${badge({label:'Positive',tone:'success'})}${badge({label:'Negative',tone:'danger'})}${badge({label:'Neutral',tone:'neutral'})}</span></div>
<ul class="plain"><li><b>Categorical</b>: chart-1〜6 を順に使用</li><li><b>Sequential</b>: 単一色相の明度スケール(primary-200 → 800)</li><li><b>Diverging</b>: danger-500 ↔ neutral-100 ↔ success-500</li><li>正負の意味を持つ値は Positive / Negative(success / danger)を使い、カテゴリ色と混同しない</li></ul>
${h2('CSS / JSON preview')}
<p>現在の Seed・テーマから生成された実トークンです。<a href="#/tokens/css-variables">CSS Variables</a> / <a href="#/tokens/json-tokens">JSON Tokens</a> で全量を確認できます。</p>
${codeBlock(`:root {\n  --bg: ${T.background};\n  --surface: ${T.surface};\n  --fg: ${T.foreground};\n  --border: ${T.border};\n  --primary: ${T.primary};\n  --primary-hover: ${T['primary-hover']};\n  --primary-fg: ${T['primary-foreground']};\n}`,'css','generated (current theme)')}
${nextPrev(['overview/architecture','System Architecture'],['foundations/typography','Typography'])}`)});

/* ============ Foundations: Typography ============ */
const TYPE_SCALE=[
 ['Display','28px','1.2','650','-0.022em','ページタイトル・Hero','--type-display'],
 ['Heading 1','24px','1.25','650','-0.02em','画面見出し','--type-h1'],
 ['Heading 2','19px','1.3','600','-0.015em','セクション見出し','--type-h2'],
 ['Heading 3','16px','1.4','600','-0.01em','カード見出し','--type-h3'],
 ['Heading 4','14px','1.4','600','0','小見出し','--type-h4'],
 ['Heading 5','13px','1.4','600','0.02em','ラベル的見出し','--type-h5'],
 ['Body Large','15px','1.6','400','0','リード文・設定画面','--type-body-lg'],
 ['Body','14px','1.55','400','0','標準本文(Default 密度)','--type-body'],
 ['Body Small','13px','1.5','400','0','補助説明','--type-body-sm'],
 ['Label Large','14px','1.4','550','0','ボタン(lg)','--type-label-lg'],
 ['Label','13px','1.4','550','0','ボタン・フォームラベル','--type-label'],
 ['Label Small','12px','1.4','550','0.01em','タブ・小ボタン','--type-label-sm'],
 ['Caption','11px','1.4','500','0.02em','メタ情報・タイムスタンプ','--type-caption'],
 ['Code','13px','1.6','400','0','コードブロック','--type-code'],
 ['Code Small','11.5px','1.6','400','0','ログ・差分','--type-code-sm'],
 ['Numeric','14px','1.4','500','0','表の数値(tabular-nums)','--type-numeric'],
];
docPage('foundations/typography',()=>shell(`
${head('Foundations','Typography','UI では可読性・密度・階層のバランスを最優先します。過度に大きな文字より、安定した読みやすさを重視します。')}
${h2('Typography philosophy')}
<ul class="plain">
<li>SaaS / Developer Tool では、1 画面の情報量が多い。見出しを大きくするより、ウェイトと余白で階層を作る。</li>
<li>日本語と英数字の混在で破綻しないこと。Inter + Noto Sans JP の組み合わせで x-height と字面を揃える。</li>
<li>コード・数値・ラベル・本文は役割が異なるため、スタイルを分離する。数値は必ず tabular-nums で桁を揃える。</li>
</ul>
${h2('Font family')}
${codeBlock(`--font-sans: 'Inter', 'Geist', 'IBM Plex Sans', 'Noto Sans JP',\n             'Hiragino Sans', 'Yu Gothic', system-ui, sans-serif;\n--font-mono: 'JetBrains Mono', 'Geist Mono', 'IBM Plex Mono',\n             ui-monospace, monospace;`,'css','font tokens')}
${h2('Type scale')}
<div class="tscroll"><table class="ttable"><thead><tr><th>Style</th><th>Sample</th><th>Size / LH</th><th>Weight</th><th>Tracking</th><th>用途</th><th>Token</th></tr></thead><tbody>
${TYPE_SCALE.map(([n,s,lh,w,ls,u,t])=>`<tr><td style="font-weight:550;white-space:nowrap">${n}</td><td><span style="font-size:${s};line-height:${lh};font-weight:${w};letter-spacing:${ls};${n.startsWith('Code')||n==='Numeric'?'font-family:var(--font-mono);':''}white-space:nowrap">${n.startsWith('Code')?'const x = 42;':n==='Numeric'?'1,240.50':'見出し Aa 123'}</span></td><td class="mono">${s} / ${lh}</td><td class="mono">${w}</td><td class="mono">${ls}</td><td style="color:var(--fg-muted)">${u}</td><td><button class="cp" data-copy="var(${t})">${I.copy}</button></td></tr>`).join('')}
</tbody></table></div>
${h2('Density 対応')}
<p>Body / Label / Table text は密度トークンに連動します。現在の密度は右上のメニューから変更できます。</p>
<div class="tscroll"><table class="ttable"><thead><tr><th>Role</th><th>Compact</th><th>Default</th><th>Comfortable</th></tr></thead><tbody>
${[['Body','13px','14px','15px'],['Label','12px','13px','14px'],['Table text','12px','13px','14px'],['Line-height','1.45','1.55','1.65']].map(r=>`<tr><td style="font-weight:550">${r[0]}</td><td class="mono">${r[1]}</td><td class="mono">${r[2]}</td><td class="mono">${r[3]}</td></tr>`).join('')}
</tbody></table></div>
${preview(textDemo(),'Live — 現在の密度でのレンダリング')}
${h2('使用ルール')}
<ul class="plain">
<li>1 画面の見出しレベルは 3 段まで。それ以上必要なら情報設計を見直す。</li>
<li>英大文字+letter-spacing はセクションラベル(Caption 相当)のみに使用する。</li>
<li>フォントサイズの直接指定は禁止。必ず type scale のロールを選ぶ。</li>
</ul>
${nextPrev(['foundations/color','Color'],['foundations/spacing','Spacing'])}`));

/* ============ Foundations: Spacing / Layout / Radius / Elevation / Motion ============ */
const SPACE_SCALE=[['0','0px'],['0.5','2px'],['1','4px'],['1.5','6px'],['2','8px'],['2.5','10px'],['3','12px'],['4','16px'],['5','20px'],['6','24px'],['8','32px'],['10','40px'],['12','48px'],['16','64px'],['20','80px'],['24','96px']];
docPage('foundations/spacing',()=>shell(`
${head('Foundations','Spacing','余白は装飾ではなく、情報構造を表現するための手段です。高密度 UI では余白を削るのではなく、リズムを保ちます。')}
${h2('Spacing philosophy')}
<ul class="plain">
<li>近いものは関連が強く、遠いものは弱い。余白の大小がそのままグルーピングになる。</li>
<li>高密度化とは「余白を一律に小さくする」ことではなく、階層ごとの比率を保ったままスケールを下げること。</li>
<li>余白はコンポーネント単位で決めず、画面全体の密度(Density トークン)に連動させる。</li>
</ul>
${h2('Spacing scale')}
<p>4px 基数のスケールです。6px / 10px は高密度 UI の微調整用に用意しています。</p>
<div class="panel pad">${SPACE_SCALE.map(([k,v])=>`<div style="display:flex;align-items:center;gap:12px;margin-bottom:6px"><code class="inline" style="width:88px;text-align:right">--space-${k}</code><span class="mono" style="width:44px;font-size:11px;color:var(--fg-subtle)">${v}</span><span style="height:14px;width:${v};background:var(--primary);border-radius:var(--radius-2xs);min-width:1px"></span></div>`).join('')}</div>
${h2('Density modes')}
<div class="grid3">
${[['Compact','高密度な管理画面・テーブル・ログビューア向け。パワーユーザーが 1 画面で多くを見渡す用途。','行高 32px / Body 13px'],['Default','標準。汎用的な SaaS 画面。<b>迷ったらこれを使う。</b>','行高 40px / Body 14px'],['Comfortable','読みやすさ優先。設定・オンボーディング・タッチデバイス。','行高 48px / Body 15px']].map(([t,d,m],i)=>`<div class="cardc"><div class="rowflex" style="justify-content:space-between"><b>${t}</b>${STATE.density===['compact','default','comfortable'][i]?badge({label:'現在',tone:'primary'}):''}</div><p style="font-size:var(--text-small);color:var(--fg-muted);margin:6px 0">${d}</p><code class="inline">${m}</code><div style="margin-top:10px"><button class="btn" data-variant="secondary" data-size="sm" data-setdensity="${['compact','default','comfortable'][i]}">この密度を試す</button></div></div>`).join('')}
</div>
${preview(`<div style="width:min(480px,100%)">${tableEl()}</div>`,'Live — テーブルの行高は密度に連動')}
${nextPrev(['foundations/typography','Typography'],['foundations/layout','Layout'])}`));

docPage('foundations/layout',()=>shell(`
${head('Foundations','Layout','アプリシェル(Sidebar + Top Bar + Content)の寸法をトークンで固定し、画面ごとのブレを防ぎます。')}
${h2('Layout tokens')}
<div class="tscroll"><table class="ttable"><thead><tr><th>Token</th><th>Value</th><th>用途</th></tr></thead><tbody>
${[['--sidebar-width','264px','固定サイドバー'],['--sidebar-width-collapsed','64px','折りたたみ時(アイコンのみ)'],['--topbar-height','52px','上部バー'],['--content-max-width','880px','ドキュメント・フォームの最大幅'],['--page-padding','24px','ページ左右余白'],['--section-gap','32px','セクション間'],['--card-padding','16px','カード内(density 連動)'],['--form-gap','16px','フォームフィールド間(density 連動)'],['--table-row-height','40px','テーブル行(density 連動)'],['--modal-width-sm','400px','確認ダイアログ'],['--modal-width-md','480px','標準ダイアログ'],['--modal-width-lg','640px','フォームダイアログ'],['--drawer-width','420px','サイドドロワー']].map(r=>`<tr><td class="mono">${r[0]}</td><td class="mono">${r[1]}</td><td style="color:var(--fg-muted)">${r[2]}</td></tr>`).join('')}
</tbody></table></div>
${h2('Breakpoints')}
<div class="tscroll"><table class="ttable"><thead><tr><th>Token</th><th>Range</th><th>シェルの挙動</th></tr></thead><tbody>
${[['--mobile-breakpoint','360–767px','Sidebar は Drawer 化、1 カラム、テーブルはカード化 or 横スクロール'],['--tablet-breakpoint','768–1023px','Sidebar 折りたたみ可、2 カラムまで'],['--desktop-breakpoint','1024–1439px','Sidebar 固定、コンテンツ中央、右に On this page'],['wide','1440px+','余白を広げ、コンテンツ幅は最大値で固定']].map(r=>`<tr><td class="mono">${r[0]}</td><td class="mono">${r[1]}</td><td style="color:var(--fg-muted)">${r[2]}</td></tr>`).join('')}
</tbody></table></div>
${h2('シェルの構成')}
${codeBlock(`┌────────────┬────────────────────────────────┐\n│  Sidebar   │  Top Bar (breadcrumb / search)  │\n│  264px     ├────────────────────────────────┤\n│  fixed     │  Content  max-width: 880–1280px │\n│            │  padding: var(--page-padding)   │\n└────────────┴────────────────────────────────┘`,'txt','App shell')}
${nextPrev(['foundations/spacing','Spacing'],['foundations/radius','Radius'])}`));

docPage('foundations/radius',()=>shell(`
${head('Foundations','Radius','角丸は控えめに。Meridian は Material Design よりシャープで、Linear / Vercel 寄りの精密感を保ちます。')}
${h2('Radius tokens')}
<div class="rowflex" style="gap:var(--sp-4);align-items:flex-end;margin:var(--sp-3) 0;flex-wrap:wrap">
${[['none','0px'],['2xs','2px'],['xs','4px'],['sm','6px'],['md','8px'],['lg','10px'],['xl','12px'],['2xl','16px'],['full','999px']].map(([k,v])=>`<div style="text-align:center"><div style="width:56px;height:56px;background:var(--surface);border:1px solid var(--border-strong);border-radius:${v};margin-bottom:6px"></div><code class="inline">${k}</code><div class="mono" style="font-size:10px;color:var(--fg-subtle);margin-top:2px">${v}</div></div>`).join('')}
</div>
${h2('Component usage')}
<div class="tscroll"><table class="ttable"><thead><tr><th>Component</th><th>Radius</th><th>備考</th></tr></thead><tbody>
${[['Button','sm–md','サイズに応じて。xl でも md まで'],['Input','sm–md','Button と揃える'],['Card','md–lg','標準は lg'],['Dialog','lg–xl','浮遊面はやや大きく'],['Badge','full','ピル形状'],['Avatar','full','円形'],['Table row','xs–sm','選択ハイライト用'],['Sidebar item','sm','']].map(r=>`<tr><td style="font-weight:550">${r[0]}</td><td class="mono">${r[1]}</td><td style="color:var(--fg-muted)">${r[2]}</td></tr>`).join('')}
</tbody></table></div>
<div class="callout">${I.info}<span>2xl 以上をカードに使うと「浮ついた」印象になり、高密度 UI の精密感を損ないます。大きな角丸は Hero・イラストレーション領域に限定してください。</span></div>
${nextPrev(['foundations/layout','Layout'],['foundations/elevation','Elevation'])}`));

docPage('foundations/elevation',()=>shell(`
${head('Foundations','Elevation & Border','影は強くしません。薄い境界線・微細な影・背景レイヤーの 3 つで階層を表現します。')}
${h2('Layering model')}
<p>Meridian の階層は「影の強さ」ではなく「面のレイヤー」で決まります。</p>
<div class="tscroll"><table class="ttable"><thead><tr><th>Layer</th><th>Surface token</th><th>Elevation</th><th>例</th></tr></thead><tbody>
${[['Background','background','none','ページ地'],['Surface','surface','line(border のみ)','Card / Panel'],['Raised surface','surface-raised','xs–sm','Hover card / Dropdown'],['Overlay','surface-overlay','md–lg','Popover / Menu'],['Modal','surface-overlay','overlay','Dialog / Drawer'],['Toast','surface-overlay','lg','通知'],['Tooltip','surface-inverse','md','反転面+小影']].map(r=>`<tr><td style="font-weight:550">${r[0]}</td><td class="mono">${r[1]}</td><td class="mono">${r[2]}</td><td style="color:var(--fg-muted)">${r[3]}</td></tr>`).join('')}
</tbody></table></div>
${h2('Elevation tokens')}
<div class="rowflex" style="gap:var(--sp-4);margin:var(--sp-3) 0;flex-wrap:wrap">
${[['none','なし'],['line','border のみ'],['xs','shadow-xs'],['sm','shadow-sm'],['md','shadow-md'],['lg','shadow-lg'],['overlay','shadow-overlay']].map(([k,d])=>`<div style="text-align:center"><div style="width:88px;height:60px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);box-shadow:${k==='none'||k==='line'?'none':`var(--shadow-${k})`};margin-bottom:8px"></div><code class="inline">${k}</code><div style="font-size:10px;color:var(--fg-subtle);margin-top:2px">${d}</div></div>`).join('')}
</div>
<div class="callout">${I.info}<span><code class="inline">shadow-xs</code>〜<code class="inline">shadow-overlay</code> は、Surface より上に浮くレイヤー(Raised surface 以上 — Dropdown / Popover / Menu / Dialog / Drawer / Toast)にのみ使用します。Card・Panel など画面のベース面(Surface 層)は静的な要素なので、例外なく border のみで階層を表現し、影を足しません。</span></div>
<p>Dark テーマでは影が視認しにくいため、影を強めるのではなく <code class="inline">surface-raised</code> の明度差で階層を補います。</p>
${h2('Border tokens')}
<div class="tscroll"><table class="ttable"><thead><tr><th>Token</th><th>プレビュー</th><th>用途</th></tr></thead><tbody>
${[['border-subtle','--border-muted','テーブル行・リスト区切り'],['border-default','--border','カード・入力の標準'],['border-strong','--border-strong','ホバー・強調'],['border-focus','--primary','フォーカスリング'],['border-danger','--danger','エラー入力'],['border-success','--success','成功状態'],['border-warning','--warning','警告状態']].map(([k,v,u])=>`<tr><td class="mono">${k}</td><td><span style="display:inline-block;width:72px;height:26px;border:1.5px solid var(${v});border-radius:var(--radius-sm);background:var(--surface)"></span></td><td style="color:var(--fg-muted)">${u}</td></tr>`).join('')}
</tbody></table></div>
${nextPrev(['foundations/radius','Radius'],['foundations/motion','Motion'])}`));

docPage('foundations/motion',()=>shell(`
${head('Foundations','Motion','動きは状態変化を伝えるために使います。速く、控えめに。作業中のユーザーを決して邪魔しません。')}
${h2('Motion philosophy')}
<ul class="plain">
<li>モーションはブランド演出ではなく認知補助。何が変わったかを目で追えるようにするために動かす。</li>
<li>SaaS UI の標準は 120–180ms。300ms を超える動きは「待たされている」と感じさせる。</li>
<li><code class="inline">prefers-reduced-motion</code> ではすべてのアニメーションを実質無効化する(トークン側で対応済み)。</li>
</ul>
${h2('Duration tokens')}
<div class="tscroll"><table class="ttable"><thead><tr><th>Token</th><th>Value</th><th>用途</th><th>Demo</th></tr></thead><tbody>
${[['instant','50ms','hover の色変化'],['fast','120ms','ボタン・入力の状態変化'],['normal','180ms','ドロップダウン・トースト'],['slow','240ms','ダイアログ・ドロワー'],['slower','320ms','ページレベルの遷移']].map(([k,v,u])=>`<tr><td class="mono">--duration-${k}</td><td class="mono">${v}</td><td style="color:var(--fg-muted)">${u}</td><td><button class="btn" data-variant="secondary" data-size="xs" onclick="this.animate([{transform:'translateX(0)'},{transform:'translateX(48px)'},{transform:'translateX(0)'}],{duration:${parseInt(v)*2},easing:'cubic-bezier(.2,0,0,1)'})">再生</button></td></tr>`).join('')}
</tbody></table></div>
${h2('Easing tokens')}
<div class="tscroll"><table class="ttable"><thead><tr><th>Token</th><th>Curve</th><th>用途</th></tr></thead><tbody>
${[['easing-standard','cubic-bezier(.2, 0, 0, 1)','状態変化全般'],['easing-enter','cubic-bezier(0, 0, .2, 1)','出現(減速)'],['easing-exit','cubic-bezier(.4, 0, 1, 1)','退出(加速)。出現より短く'],['easing-emphasized','cubic-bezier(.2, 0, 0, 1.08)','わずかなオーバーシュート。強調時のみ']].map(r=>`<tr><td class="mono">${r[0]}</td><td class="mono">${r[1]}</td><td style="color:var(--fg-muted)">${r[2]}</td></tr>`).join('')}
</tbody></table></div>
${h2('Interaction behavior')}
<div class="tscroll"><table class="ttable"><thead><tr><th>State</th><th>変化</th><th>Duration</th></tr></thead><tbody>
${[['hover','背景/ボーダー色の変化のみ。移動・拡大はしない','instant–fast'],['active / pressed','1 段暗い背景。押下感は色で表現','instant'],['focus','focus-ring を即時表示(アニメーションしない)','0'],['disabled','opacity .5 + pointer-events 無効','—'],['loading','ラベルを透明化し spinner を重ねる(幅を保つ)','fast'],['selected','primary-subtle 背景','fast'],['expanded / collapsed','高さ + シェブロン回転','normal'],['entered(Dialog 等)','opacity + 4px 移動 + scale .98→1','normal / enter'],['exited','opacity のみ。入りより短く','fast / exit']].map(r=>`<tr><td class="mono">${r[0]}</td><td style="color:var(--fg-muted)">${r[1]}</td><td class="mono">${r[2]}</td></tr>`).join('')}
</tbody></table></div>
${nextPrev(['foundations/elevation','Elevation'],['foundations/iconography','Iconography'])}`));

docPage('foundations/iconography',()=>shell(`
${head('Foundations','Iconography','アイコンは 1.5–2px ストロークのアウトラインで統一します。装飾ではなく、走査を速くするための記号です。')}
${h2('スタイル')}
<ul class="plain">
<li>24px グリッド・ストローク 2px(小サイズは 1.5px)・角は round cap</li>
<li>塗り(filled)は選択状態・AI 関連(spark)のみに限定</li>
<li>色は currentColor を継承し、単体で色を持たない</li>
</ul>
${preview(`<div class="rowflex" style="gap:var(--sp-4);color:var(--fg-muted)">${[I.search,I.plus,I.gear,I.users,I.bell,I.folder,I.file,I.zap,I.spark,I.filter,I.cal,I.copy,I.check,I.x,I.info,I.warn,I.ok,I.err,I.github,I.send].join('')}</div>`,'Icon set (抜粋)')}
${h2('サイズと配置')}
<div class="tscroll"><table class="ttable"><thead><tr><th>Context</th><th>Size</th><th>備考</th></tr></thead><tbody>
${[['ボタン内(sm–md)','14–16px','テキストと光学的に中央揃え'],['ナビゲーション項目','16px','ラベルの先頭に 8px ギャップ'],['テーブル・メタ情報','13–14px','foreground-subtle'],['Empty state','20–24px','枠付きコンテナに収める']].map(r=>`<tr><td>${r[0]}</td><td class="mono">${r[1]}</td><td style="color:var(--fg-muted)">${r[2]}</td></tr>`).join('')}
</tbody></table></div>
<ul class="plain"><li>アイコン単体で意味を伝える場合は必ず aria-label + Tooltip を付ける。</li><li>同じ概念に複数のアイコンを使わない(削除 = ゴミ箱で固定、など)。</li></ul>
${nextPrev(['foundations/motion','Motion'],['foundations/accessibility','Accessibility'])}`));

docPage('foundations/accessibility',()=>{
  const gb=(good,bad,gt,bt)=>`<div class="dodont"><div class="box do"><div class="cap">${I.check} Do</div><div class="bd">${good}</div><div class="tx">${gt}</div></div><div class="box dont"><div class="cap">${I.x} Don't</div><div class="bd">${bad}</div><div class="tx">${bt}</div></div></div>`;
  return shell(`
${head('Foundations','Accessibility','アクセシビリティはすべてのコンポーネントの受け入れ条件です。WCAG 2.2 AA を基準とします。')}
${h2('Color contrast')}
<p>テキスト 4.5:1 以上(大テキスト 3:1)、UI 部品・フォーカスリングは 3:1 以上。<a href="#/foundations/color">Contrast checker</a> で Seed ごとに検証できます。</p>
${gb(`<span style="background:var(--primary);color:var(--primary-fg);padding:5px 14px;border-radius:var(--radius-sm);font-size:13px;font-weight:550">Deploy</span>`,`<span style="background:var(--primary-subtle);color:color-mix(in srgb,var(--primary) 45%,var(--primary-subtle));padding:5px 14px;border-radius:var(--radius-sm);font-size:13px">Deploy</span>`,'primary-foreground は Seed に応じて白/黒が自動選択され、AA を満たす。','淡い背景に淡い前景。装飾としては成立しても読めない。')}
${h2('Keyboard navigation & Focus ring')}
<p>すべての操作をキーボードだけで完結できること。フォーカスは <code class="inline">--focus-ring</code> の 2px リング(High contrast では 3px)で常に可視化します。</p>
${gb(`<button class="btn sim-focus" data-variant="secondary" data-size="sm">フォーカス中</button>`,`<button class="btn" data-variant="secondary" data-size="sm" style="outline:none">フォーカス中(不可視)</button>`,'focus-visible でリングを表示。offset 2px で背景と分離。','outline: none で消す。キーボードユーザーが現在地を失う。')}
${h2('Screen reader support')}
<ul class="plain"><li>ネイティブ要素(button / a / input / table)を優先し、role の再実装を避ける</li><li>動的な変化(トースト・検証結果)は aria-live で通知</li><li>Icon only には aria-label、画像には alt</li></ul>
${h2('Reduced motion')}
<p><code class="inline">prefers-reduced-motion: reduce</code> ではアニメーション・トランジションを 0.01ms に短縮します(グローバル CSS で一括対応)。スケルトンの点滅・実行中パルスも停止します。</p>
${h2('Error messaging & Error recovery')}
${gb(`<span class="rowflex" style="gap:5px;font-size:12px;color:var(--danger-fg)">${I.err}@ を含むメールアドレスを入力してください</span>`,`<span style="font-size:12px;color:var(--danger-fg)">エラー: 不正な値です</span>`,'何が悪いか+どう直すかを具体的に。アイコン併記で色覚に依存しない。','原因も対処も分からない。ユーザーは試行錯誤を強いられる。')}
<ul class="plain"><li>送信失敗時は入力内容を保持し、再試行を提供する</li><li>フォーム送信エラー時は最初のエラーフィールドへフォーカスを移動する</li></ul>
${h2('Form labels')}
${gb(fieldEl({label:'メールアドレス',placeholder:'name@company.com'}),`<div class="input" style="width:220px"><input placeholder="メールアドレス(必須)"></div>`,'label 要素で恒常的に表示。placeholder は入力例。','placeholder をラベル代わりに。入力を始めると要件が消える。')}
${h2('Touch target size')}
<p>タッチ環境では 40×40px 以上(Comfortable 密度で自動的に確保)。密なアイコン群では間隔 8px 以上を空けます。</p>
${h2('Semantic HTML & ARIA usage')}
<ul class="plain"><li>まずネイティブ要素。ARIA は「不足を補う」ためだけに使う(No ARIA is better than bad ARIA)</li><li>ランドマーク(nav / main / aside)でページ構造を伝える</li><li>見出しレベルを飛ばさない(h1 → h2 → h3)</li></ul>
${h2('Disabled vs Readonly')}
<div class="tscroll"><table class="ttable"><thead><tr><th></th><th>Disabled</th><th>Readonly</th></tr></thead><tbody>
<tr><td>意味</td><td>現在は操作できない</td><td>参照のみ(値は有効)</td></tr>
<tr><td>フォーカス</td><td>不可(aria-disabled なら可)</td><td>可・コピー可</td></tr>
<tr><td>送信</td><td>対象外</td><td>対象</td></tr>
<tr><td>推奨</td><td>理由を Tooltip 等で説明する</td><td>編集手段への導線を示す</td></tr>
</tbody></table></div>
${h2('Loading state / Empty state')}
<ul class="plain"><li>Loading: role="status"+テキスト。1 秒未満はインジケータを出さない</li><li>Empty: 「何が無いか」「次に何をするか」を必ず示す(<a href="#/components/empty-state">Empty State</a>)</li></ul>
${nextPrev(['foundations/iconography','Iconography'],['foundations/content','Content Guidelines'])}`)});

docPage('foundations/content',()=>shell(`
${head('Foundations','Content Guidelines','UI テキストは装飾ではなく設計要素です。短く、具体的に、一貫した語彙で書きます。')}
${h2('原則')}
<ul class="plain">
<li><b>ユーザーの側から書く。</b>システムの都合(webhook 設定)ではなく、ユーザーが認識する対象(通知)で名付ける。</li>
<li><b>動詞で始めるボタン。</b>「Submit」ではなく「変更を保存」。実行結果が想像できる名前にする。</li>
<li><b>語彙を固定する。</b>「公開」で始めた操作は完了トーストも「公開しました」。同じ概念に別の言葉を使わない。</li>
<li><b>能動態・現在形。</b>「保存されました」より「保存しました」。</li>
</ul>
${h2('状態別の文体')}
<div class="tscroll"><table class="ttable"><thead><tr><th>文脈</th><th>Do</th><th>Don't</th></tr></thead><tbody>
${[['エラー','API キーの権限が不足しています。write スコープを追加してください。','エラーが発生しました。'],['空状態','最初のプロジェクトを作成すると、ここにダッシュボードが表示されます。','データがありません。'],['確認','「Meridian Docs」を削除します。この操作は取り消せません。','本当によろしいですか?'],['成功','プロジェクトを作成しました','操作が正常に完了しました']].map(r=>`<tr><td style="font-weight:550">${r[0]}</td><td style="color:var(--success-fg)">${r[1]}</td><td style="color:var(--fg-subtle)">${r[2]}</td></tr>`).join('')}
</tbody></table></div>
${h2('避ける表現')}
<ul class="plain"><li>「革新的」「次世代」「シームレス」などの曖昧な形容</li><li>謝罪の乱用(エラーは謝らず、直し方を示す)</li><li>「簡単に」「すぐに」などの主観的な難易度表現</li></ul>
${nextPrev(['foundations/accessibility','Accessibility'],['tokens/overview','Token Overview'])}`));

