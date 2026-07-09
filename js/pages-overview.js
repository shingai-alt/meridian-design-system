"use strict";
/* ============ Overview ============ */
docPage('overview/introduction',()=>shell(`
${head('Overview','Meridian Design System','<b>Meridian</b> は、SaaS・AI プロダクト・Developer Tool のための、トークン駆動のデザインシステムです。1 つの Seed color から、Light / Dark / High contrast のテーマと 3 段階の密度を一貫して導出します。')}
<div class="rowflex" style="margin-bottom:var(--sp-6)">${badge({label:'v2.4.1',tone:'primary'})}${badge({label:'60+ components',tone:'neutral'})}${badge({label:'WCAG 2.2 AA',tone:'success'})}</div>
${h2('Meridian とは')}
<p>Meridian(子午線)は、座標の基準となる線です。このシステムでは、Seed color とデザイントークンが UI 全体の「基準線」となり、色・余白・タイポグラフィ・モーションのすべてがそこから導出されます。</p>
<p class="muted"><b>Tagline:</b> Calm precision for product interfaces — 静かな精密さを、プロダクトの隅々まで。</p>
<p><b>Concept statement:</b> 装飾ではなく判断を助ける UI を、トークンという再現可能な仕組みで作る。デザイナーとエンジニアが同じ語彙(トークン名)で会話でき、テーマ・密度・ブランド色の変更に設計変更なしで耐えることを目的とします。</p>
${h2('システムの態度')}
<p>UI デザインには大きく 3 つの態度があります。装飾を削ぎ落とし余白と精度で階層を作る<b>ミニマル</b>、色のトーンとモーションでブランドを語る<b>表現力</b>、1 画面の情報量を最大化する<b>高密度エンタープライズ</b>です。Meridian はこの 3 つから<b>ミニマル</b>を選択しています。</p>
<ul class="plain">
<li>想定用途が SaaS・AI プロダクト・Developer Tool であり、ブランド表現より判断の速さを優先すべきだから。</li>
<li>色・角丸・影・モーションのトークン数を絞るほど、テーマ / Seed / 密度が変わっても破綻しにくく、保守コストが低いから。</li>
<li>高密度な画面が必要になった場合も、態度そのものを変えるのではなく <a href="#/foundations/spacing">Density: Compact</a> で対応します。「高密度エンタープライズ型のコンポーネント群」を別途作ることはしません。</li>
</ul>
<div class="callout">${I.info}<span>新しいコンポーネントやトークンを追加する前に「これはユーザーの判断を速くするか、それとも装飾か」を問い、後者であれば追加しません。色・影・角丸の具体的な運用ルールは <a href="#/foundations/color">Color</a> / <a href="#/foundations/elevation">Elevation & Border</a> を参照してください。</span></div>
${h2('設計思想の要約')}
<ul class="plain">
<li><b>Clarity over decoration</b> — 情報の優先順位・状態・アクションが一目で分かることを最優先する。</li>
<li><b>Tokens before components</b> — すべてのコンポーネントは Primitive → Semantic → Component の 3 層トークンから構成される。</li>
<li><b>Adaptive by default</b> — テーマ・密度・Seed の変更は「対応する」ものではなく「前提」である。</li>
<li><b>Accessible precision</b> — フォーカス・コントラスト・キーボード操作は初期設計に含める。</li>
</ul>
<p>7 つの原則の全文は <a href="#/overview/principles">Principles</a> を参照してください。</p>
${h2('このサイト自体がデモです')}
<div class="callout info">${I.info}<span>右上の <b>テーマ切替・Density 切替・Seed picker</b> を操作すると、ドキュメント・コンポーネント・テンプレートを含むサイト全体が即座に再テーマ化されます。これが Meridian のトークンアーキテクチャの実働デモです。</span></div>
${h2('構成')}
<div class="grid3">
${[['Foundations','色・タイポグラフィ・余白・モーションの基礎設計','foundations/color'],['Tokens','全トークンの一覧と CSS / JSON 出力','tokens/overview'],['Components','60+ のコンポーネント詳細と Playground','components/button'],['Patterns','画面設計の定石パターン','patterns/dashboard-layout'],['Templates','実プロダクト相当の画面テンプレート','templates/saas-dashboard'],['Resources','実装ガイド・チェックリスト','resources/react-usage']].map(([t,d,l])=>`<a class="comp-tile" href="#/${l}" style="padding:var(--sp-4)"><b style="font-size:var(--text-body)">${t}</b><p style="font-size:var(--text-small);color:var(--fg-muted);margin-top:4px">${d}</p></a>`).join('')}
</div>
${nextPrev(null,['overview/principles','Principles'])}`));

docPage('overview/principles',()=>shell(`
${head('Overview','Principles','Meridian のすべての設計判断は、以下の 7 原則に基づきます。迷ったときは原則に戻ります。')}
${[
['1','Clarity over decoration','UI は装飾ではなく、意思決定を助けるためのものです。情報の優先順位・状態・実行できるアクションが一目で分かることを、視覚的な新しさよりも優先します。要素を足す前に「これはユーザーの判断を速くするか」を問います。'],
['2','Density with rhythm','SaaS や Developer Tool では高密度な情報表示が必要です。ただし詰め込むのではなく、余白・線・階層・コントラストで「読みやすい密度」を作ります。行の高さ・余白は Density トークンでリズムとして管理します。'],
['3','Tokens before components','すべてのコンポーネントはトークンから構成されます。色・余白・角丸・影・フォント・モーションをトークン化することで、テーマや密度の変更、ブランド色の差し替えに設計変更なしで耐えます。hex を直接書いた時点で、その UI はシステムの外にあります。'],
['4','Adaptive by default','Light / Dark / High contrast、Compact / Default / Comfortable、Primary color seed の変更に自然に対応します。「ダークモード対応」は後付けの作業ではなく、Semantic token を使っていれば自動的に成立する性質です。'],
['5','Accessible precision','アクセシビリティは後付けではなく、初期設計に含めます。フォーカスリング・キーボード操作・コントラスト比・色に依存しない状態表現を、すべてのコンポーネントの受け入れ条件とします。'],
['6','Calm interaction','動きは控えめで高速にします(標準 120–180ms)。モーションはブランド演出ではなく、状態変化を伝える認知補助として使い、作業中のユーザーを邪魔しません。prefers-reduced-motion を常に尊重します。'],
['7','Useful documentation','ドキュメントは説明ではなく、利用判断を助けるものです。すべてのコンポーネントページに「いつ使うか」「いつ使わないか」「どう実装するか」を明記し、Playground で挙動を確認できるようにします。'],
].map(([n,t,b])=>`${h2(`Principle ${n}: ${t}`)}<p>${b}</p>`).join('')}
${nextPrev(['overview/introduction','Introduction'],['overview/getting-started','Getting Started'])}`));

docPage('overview/getting-started',()=>shell(`
${head('Overview','Getting Started','デザイナー・エンジニアそれぞれの最短の始め方です。')}
${h2('エンジニア: 5 分で導入')}
${codeBlock(`npm install @meridian/react @meridian/tokens`,'bash','Terminal')}
${codeBlock(`import { ThemeProvider } from "@meridian/react";\nimport "@meridian/tokens/css";\n\nexport function Root() {\n  return (\n    <ThemeProvider theme="light" density="default" seedColor="#5B5BD6">\n      <App />\n    </ThemeProvider>\n  );\n}`,'tsx','app/root.tsx')}
<p>これだけで、全コンポーネントがテーマ・密度・Seed に追従します。詳細は <a href="#/overview/for-engineers">For Engineers</a>。</p>
${h2('デザイナー: Figma で開始')}
<ul class="plain">
<li>Figma ライブラリ「Meridian UI」を有効化し、Variables(Primitive / Semantic / Component)を読み込む。</li>
<li>色は必ず Semantic token(<code class="inline">surface</code>, <code class="inline">primary</code> など)を使う。Primitive の直接使用は禁止。</li>
<li>新規画面は <a href="#/templates/saas-dashboard">Templates</a> の複製から始める。</li>
</ul>
${h2('最初に読むべきページ')}
<ul class="plain">
<li><a href="#/overview/architecture">System Architecture</a> — トークンの 4 層構造</li>
<li><a href="#/foundations/color">Color</a> — Dynamic color の仕組み</li>
<li><a href="#/components/button">Button</a> — コンポーネントドキュメントの読み方</li>
</ul>
${nextPrev(['overview/principles','Principles'],['overview/architecture','System Architecture'])}`));

docPage('overview/architecture',()=>{
  const P=PALETTES,T=SEM;
  return shell(`
${head('Overview','System Architecture','Meridian の中核は、Seed → Primitive → Semantic → Component の 4 層トークンパイプラインです。')}
${h2('トークンの 4 層構造')}
<div class="panel pad" style="margin-bottom:var(--sp-4)">
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--sp-2);text-align:center;font-size:var(--text-small)">
${[['1. Seed','ユーザー/ブランドが選ぶ基準色',`<span class="sw" style="width:28px;height:28px;background:${STATE.seed};margin:0 auto"></span><code class="inline">${STATE.seed}</code>`],
['2. Primitive','Seed から生成される色スケール',`<div class="rowflex" style="justify-content:center;gap:2px">${[200,400,600,800].map(s=>`<span class="sw" style="background:${P.primary[s]}"></span>`).join('')}</div><code class="inline">primary-600</code>`],
['3. Semantic','用途にマッピングされた色',`<span class="sw" style="width:28px;height:28px;background:${T.primary};margin:0 auto"></span><code class="inline">--primary</code>`],
['4. Component','コンポーネント固有の色',`${btn({label:'Button',size:'sm'})}<code class="inline">button-primary-bg</code>`]
].map(([t,d,v])=>`<div class="panel pad" style="background:var(--bg-subtle)"><b style="display:block;font-size:var(--text-label)">${t}</b><p style="color:var(--fg-muted);margin:4px 0 10px;font-size:var(--text-micro)">${d}</p><div style="display:flex;flex-direction:column;gap:6px;align-items:center">${v}</div></div>`).join('')}
</div></div>
<p>各層は一方向にのみ参照します。<b>Component は Semantic を、Semantic は Primitive を参照し、逆流しません。</b>これにより「テーマ変更 = Semantic 層のマッピング差し替え」で完結し、コンポーネント側の変更は不要になります。</p>
${h2('テーマ・密度・Seed の直交性')}
<p>Meridian では 3 つの軸が互いに独立しています。</p>
<ul class="plain">
<li><b>Theme(Light / Dark / High contrast)</b> — Semantic 層のマッピングを切り替える</li>
<li><b>Density(Compact / Default / Comfortable)</b> — サイズ・余白・行高のトークン値を切り替える</li>
<li><b>Seed color</b> — Primitive 層の生成元を切り替える</li>
</ul>
<p>3 × 3 × N 通りの組み合わせすべてで UI が成立することを、コンポーネントの受け入れ条件とします。</p>
${h2('実装アーキテクチャ')}
${codeBlock(`:root(テーマ適用後)\n├─ Primitive   --primary-50 … --primary-950, --neutral-0 … 950\n├─ Semantic    --surface, --fg, --border, --primary, --danger …\n├─ Component   --button-primary-bg, --input-border, --sidebar-bg …\n├─ Size/Space  --ctl-md, --row-h, --card-pad(density で切替)\n└─ Motion      --dur-fast, --ease-standard`,'css','CSS variables layer')}
${h2('命名規則')}
<ul class="plain">
<li>Semantic: <code class="inline">対象-状態</code>(例: <code class="inline">primary-hover</code>, <code class="inline">border-strong</code>)</li>
<li>Component: <code class="inline">コンポーネント-部位-状態</code>(例: <code class="inline">button-primary-bg-hover</code>)</li>
<li>接尾辞 <code class="inline">-subtle</code> は淡い面、<code class="inline">-foreground</code> はその上のテキストを指す</li>
</ul>
${nextPrev(['overview/getting-started','Getting Started'],['foundations/color','Color'])}`)});

docPage('overview/for-designers',()=>shell(`
${head('Overview','For Designers','Meridian でデザインする際の実務ルールです。Figma 上での判断基準として使ってください。')}
${h2('色のルール')}
<ul class="plain">
<li><b>Primitive color を直接使わない。</b><code class="inline">primary-600</code> ではなく Semantic の <code class="inline">primary</code> を使う。テーマ切替は Semantic 層でしか保証されない。</li>
<li>テキスト色は <code class="inline">foreground</code> / <code class="inline">foreground-muted</code> / <code class="inline">foreground-subtle</code> の 3 段のみ。第 4 のグレーを発明しない。</li>
<li>状態(成功・警告・危険)は色+アイコン+ラベルの 3 点セットで表現する。</li>
</ul>
${h2('アクションの優先度')}
<ul class="plain">
<li>Primary action は 1 画面に原則 1 つ。2 つ目からは Secondary / Ghost に落とす。</li>
<li>破壊的操作は Danger + 確認ダイアログ。並置するキャンセルは Ghost にする。</li>
</ul>
${h2('密度の選び方')}
<ul class="plain">
<li><b>Compact</b>: テーブル中心の管理画面、ログビューア、パワーユーザー向け</li>
<li><b>Default</b>: 迷ったらこれ。汎用的な SaaS 画面</li>
<li><b>Comfortable</b>: 設定・オンボーディング・タッチデバイス</li>
</ul>
${h2('コンポーネントの扱い')}
<ul class="plain">
<li>テンプレートをベースに設計する。ゼロから画面を組まない。</li>
<li>コンポーネントを detach して改造しない。要件に合わない場合はシステムへの追加を提案する。</li>
<li>例外が必要なときは、その値をトークン化してから使う(1 回限りのマジックナンバーを作らない)。</li>
</ul>
${h2('新規提案前のチェック(態度の一貫性)')}
<p>Meridian は<a href="#/overview/introduction">ミニマルという態度</a>を選んでいます。新しい画面・コンポーネントを提案する前に、次を自問してください。</p>
<ul class="plain">
<li>その装飾(影・グラデーション・大きな角丸)は、ユーザーの判断を速くするか? しないなら足さない。</li>
<li>影を足したくなったら、それは静的な Card / Panel ではなく Popover / Dialog / Toast のような浮遊要素か? 静的な面には <a href="#/foundations/elevation">border のみ</a>を使う。</li>
<li>ブランドを目立たせたい場面(ロゴ・アバター)以外で <code class="inline">accent</code> 色を使おうとしていないか? 状態や強調は Semantic token(<code class="inline">primary</code> / <code class="inline">success</code> / <code class="inline">warning</code> / <code class="inline">danger</code>)で表現する。</li>
<li>高密度な画面が欲しいだけなら、新しいコンポーネント群ではなく <a href="#/foundations/spacing">Density: Compact</a> で解決できないか、先に検討する。</li>
</ul>
${h2('アクセシビリティとハンドオフ')}
<ul class="plain">
<li>フォーカス順・キーボード操作・エラーメッセージ文言までをデザインの成果物に含める。</li>
<li>ハンドオフ時は hex ではなくトークン名を注記する(例:「背景: surface-muted」)。</li>
<li>コントラストは Color ページの <a href="#/foundations/color">Contrast checker</a> で検証する。</li>
</ul>
${nextPrev(['overview/architecture','System Architecture'],['overview/for-engineers','For Engineers'])}`));

docPage('overview/for-engineers',()=>shell(`
${head('Overview','For Engineers','React + CSS Variables を前提とした実装ガイドです。')}
${h2('Installation')}
${codeBlock(`npm install @meridian/react @meridian/tokens\n# トークンのみ使う場合\nnpm install @meridian/tokens`,'bash','Terminal')}
${h2('Theme provider / Density provider')}
${codeBlock(`import { ThemeProvider } from "@meridian/react";\n\n<ThemeProvider\n  theme="dark"          // "light" | "dark" | "hc"\n  density="compact"     // "compact" | "default" | "comfortable"\n  seedColor="#6D5DF6"   // Dynamic color の基準色\n>\n  <App />\n</ThemeProvider>`,'tsx','providers.tsx')}
<p>Provider は <code class="inline">html</code> に <code class="inline">data-theme</code> / <code class="inline">data-density</code> を設定し、Seed から生成した CSS Variables を注入します。ネストして一部のサブツリーだけ別テーマにすることもできます。</p>
${h2('Component usage')}
${codeBlock(`<Button variant="primary" size="md">\n  Create project\n</Button>\n\n<TextField\n  label="Project name"\n  placeholder="Acme Dashboard"\n  helperText="Use a clear, recognizable name."\n/>`,'tsx','usage.tsx')}
${h2('Dark mode / Dynamic seed の切替')}
${codeBlock(`const { setTheme, setSeedColor } = useTheme();\n\n<Switch\n  label="ダークモード"\n  checked={theme === "dark"}\n  onChange={(on) => setTheme(on ? "dark" : "light")}\n/>\n\n// ワークスペースのブランド色を反映\nuseEffect(() => setSeedColor(workspace.brandColor), [workspace]);`,'tsx','theme-switch.tsx')}
${h2('Tailwind mapping')}
<p>Tailwind v4 を使う場合、Semantic token を <code class="inline">@theme</code> にマッピングします。ユーティリティ名からも Primitive を排除します。</p>
${codeBlock(`@import "tailwindcss";\n@import "@meridian/tokens/css";\n\n@theme inline {\n  --color-background: var(--bg);\n  --color-surface: var(--surface);\n  --color-foreground: var(--fg);\n  --color-muted: var(--fg-muted);\n  --color-border: var(--border);\n  --color-primary: var(--primary);\n  --color-primary-foreground: var(--primary-fg);\n  --radius-md: var(--radius-md);\n}\n/* 使用例: bg-surface text-foreground border-border rounded-md */`,'css','globals.css')}
${h2('CSS を直接書く場合')}
${codeBlock(`.deploy-card {\n  background: var(--surface);\n  border: 1px solid var(--border);\n  border-radius: var(--radius-lg);\n  padding: var(--card-pad); /* density に自動連動 */\n  color: var(--fg);\n}\n.deploy-card:hover { border-color: var(--border-strong); }`,'css','deploy-card.css')}
${h2('Token export')}
${codeBlock(`import { exportTokens } from "@meridian/tokens";\n\nconst json = exportTokens({ theme: "dark", seed: "#6D5DF6" });\n// → W3C Design Tokens 形式の JSON(Figma Variables 互換)`,'tsx','export.ts')}
${h2('態度の一貫性チェックリスト(PR レビュー時)')}
<p>Meridian は<a href="#/overview/introduction">ミニマルという態度</a>を選んでいます。レビューでは実装がこれを裏切っていないかを機械的に確認できます。</p>
<ul class="plain">
<li><code class="inline">border-radius</code> / <code class="inline">box-shadow</code> / <code class="inline">transition</code> に raw な px・ms 値を書いていないか(必ず <code class="inline">var(--radius-*)</code> / <code class="inline">var(--shadow-*)</code> / <code class="inline">var(--dur-*)</code> を参照する)</li>
<li>静的な Card / Panel に <code class="inline">box-shadow</code> を追加していないか(浮遊レイヤー以外は border のみ、<a href="#/foundations/elevation">Elevation & Border</a> 参照)</li>
<li><code class="inline">var(--accent)</code> をブランドマーク以外(ボタン・バッジ・強調テキストなど)に使っていないか</li>
<li>高密度な画面を理由に、新しいコンポーネントを増やしていないか(<code class="inline">density="compact"</code> で解決できないか先に検討する)</li>
</ul>
${h2('Accessibility checklist(実装時)')}
<ul class="plain">
<li>インタラクティブ要素はネイティブ要素(button / a / input)を優先する</li>
<li><code class="inline">:focus-visible</code> のリングを消さない(<code class="inline">--focus-ring</code> を使う)</li>
<li>Icon only のコントロールに aria-label</li>
<li>Dialog はフォーカストラップ+復帰、Esc で閉じる</li>
<li>動きは <code class="inline">prefers-reduced-motion</code> で無効化(トークン側で対応済み)</li>
</ul>
${nextPrev(['overview/for-designers','For Designers'],['foundations/color','Color'])}`));

