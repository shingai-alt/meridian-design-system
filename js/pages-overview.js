"use strict";
/* ============ Overview ============ */
docPage('overview/introduction',()=>shell(`
${head('Overview','Meridian Design System','<b>Meridian</b> は、プロダクトインターフェースのための、トークン駆動かつ AI-ready なデザインシステムです。1 つの Seed color からテーマと密度を一貫して導出し、設計判断を md / contract / HTML docs の3層で再利用できる形にします。')}
<div class="rowflex" style="margin-bottom:var(--sp-6)">${badge({label:'v2.4.1',tone:'primary'})}${badge({label:'60+ components',tone:'neutral'})}${badge({label:'WCAG 2.2 AA',tone:'success'})}</div>
${h2('Meridian とは')}
<p>Meridian(子午線)は、座標の基準となる線です。このシステムでは、Seed color とデザイントークンが UI 全体の「基準線」となり、色・余白・タイポグラフィ・モーションのすべてがそこから導出されます。</p>
<p class="muted"><b>Tagline:</b> Calm precision for product interfaces — 静かな精密さを、プロダクトの隅々まで。</p>
<p><b>Concept statement:</b> 装飾ではなく判断を助ける UI を、トークンと機械可読な設計仕様という再現可能な仕組みで作る。デザイナー、エンジニア、プロダクトチーム、AI が同じ語彙(トークン名・コンポーネント contract・パターン)で会話でき、テーマ・密度・ブランド色の変更に設計変更なしで耐えることを目的とします。</p>
${h2('システムの態度')}
<p>UI デザインには大きく 3 つの態度があります。装飾を削ぎ落とし余白と精度で階層を作る<b>ミニマル</b>、色のトーンとモーションでブランドを語る<b>表現力</b>、1 画面の情報量を最大化する<b>高密度エンタープライズ</b>です。Meridian はこの 3 つから<b>ミニマル</b>を選択しています。</p>
<ul class="plain">
<li>業務ツールから消費者向けアプリまで、多くのプロダクトでは、ブランド表現より判断の速さを優先すべき場面の方が多いから。ブランド表現そのものが主目的のプロダクト(マーケティングサイト等)では、この態度を見直す余地があります。</li>
<li>色・角丸・影・モーションのトークン数を絞るほど、テーマ / Seed / 密度が変わっても破綻しにくく、保守コストが低いから。</li>
<li>高密度な画面が必要になった場合も、態度そのものを変えるのではなく <a href="#/foundations/spacing">Density: Compact</a> で対応します。「高密度エンタープライズ型のコンポーネント群」を別途作ることはしません。</li>
</ul>
<div class="callout">${I.info}<span>新しいコンポーネントやトークンを追加する前に「これはユーザーの判断を速くするか、それとも装飾か」を問い、後者であれば追加しません。色・影・角丸の具体的な運用ルールは <a href="#/foundations/color">Color</a> / <a href="#/foundations/elevation">Elevation & Border</a> を参照してください。</span></div>
${h2('設計思想の要約')}
<ul class="plain">
<li><b>Clarity over decoration</b> — 情報の優先順位・状態・アクションが一目で分かることを最優先する。</li>
<li><b>Tokens before components</b> — すべてのコンポーネントは Reference(Primitive) → Semantic → Component の 3 層トークンから構成される。</li>
<li><b>Adaptive by default</b> — テーマ・密度・Seed の変更は「対応する」ものではなく「前提」である。</li>
<li><b>Accessible precision</b> — フォーカス・コントラスト・キーボード操作は初期設計に含める。</li>
</ul>
<p>7 つの原則の全文は <a href="#/overview/principles">Principles</a> を参照してください。</p>
${h2('設計判断の3層構造')}
<p>Meridian のドキュメントは、見た目を説明するだけではなく、設計判断を人間と AI が再利用できる形で残します。</p>
<div class="grid3" style="margin-bottom:var(--sp-4)">
${[['Human spec','components/*.md','いつ使うか、使わないか、Visual Model、PC/SP/touch の振る舞い、禁止事項、AI Selection Rules を記録する。'],
['Machine contract','design/contracts/components/*.contract.json','variant、state、tokenRefs、accessibility、responsiveBehavior などを AI とツールが読める形にする。'],
['HTML docs','index.html / js/*','Playground、Variants、States、Usage patterns、Responsive behavior を見て触って確認するショーケース。']
].map(([t,p,d])=>`<div class="panel pad" style="background:var(--bg-subtle)"><b style="font-size:var(--text-label)">${t}</b><code class="inline" style="display:inline-block;margin:6px 0">${p}</code><p style="font-size:var(--text-small);color:var(--fg-muted)">${d}</p></div>`).join('')}
</div>
<p>HTML docs は視覚確認の場であり、設計判断の全文は md と contract に残します。この分担により、コンポーネントを追加・改善するときも、見た目・使い方・AI が読む仕様を同期できます。</p>
${h2('AI-ready である理由')}
<p>Meridian は、速く画面を作るためだけの道具ではありません。コンポーネント、パターン、トークン、アクセシビリティ要件、禁止ルールを構造化し、AI が「なぜこの UI なのか」を説明できる状態を目指します。</p>
<ul class="plain">
<li>コンポーネントは md と contract JSON の両方で管理し、AI が選択条件・避ける条件・responsive behavior を読めるようにする。</li>
<li>画面生成では Meridian のトークン、コンポーネント、パターンから外れた自由生成を避ける。</li>
<li>PC / SP は別コンポーネントを増やすのではなく、同じ contract の responsive behavior と layout pattern で扱う。</li>
<li>生成後は token 準拠、アクセシビリティ、状態設計、説明可能性を検証できるようにする。</li>
</ul>
${h2('このサイト自体がデモです')}
<div class="callout info">${I.info}<span>右上の <b>テーマ切替・Density 切替・Seed picker</b> を操作すると、ドキュメント・コンポーネント・テンプレートを含むサイト全体が即座に再テーマ化されます。これが Meridian のトークンアーキテクチャの実働デモです。</span></div>
${h2('構成')}
<div class="grid3">
${[['Foundations','色・タイポグラフィ・余白・モーションの基礎設計','foundations/color'],['Tokens','全トークンの一覧と CSS / JSON 出力','tokens/overview'],['Components','60+ のコンポーネント詳細と Playground','components/button'],['Patterns','画面設計の定石パターン','patterns/dashboard-layout'],['Templates','実プロダクト相当の画面テンプレート','templates/saas-dashboard'],['Resources','実装ガイド・チェックリスト','resources/react-usage']].map(([t,d,l])=>`<a class="comp-tile" href="#/${l}" style="padding:var(--sp-4)"><b style="font-size:var(--text-body)">${t}</b><p style="font-size:var(--text-small);color:var(--fg-muted);margin-top:4px">${d}</p></a>`).join('')}
</div>
${nextPrev(null,['overview/principles','Principles'])}`));

docPage('overview/principles',()=>shell(`
${head('Overview','Principles','Meridian のすべての設計判断は、以下の 7 原則に基づきます。迷ったときは好みではなく、原則・判断基準・Red flags に戻ります。')}
<p>Principles は理念文ではなく、tokens、components、patterns、HTML docs、contract JSON、AI generation をレビューするための基準です。各原則は「守れている兆候」と「危険な兆候」を持ち、設計判断を説明可能にします。</p>
${[
{
  n:'1',
  title:'Clarity over decoration',
  meaning:'UI は装飾ではなく、意思決定を助けるためのものです。情報の優先順位・状態・実行できるアクションが一目で分かることを、視覚的な新しさよりも優先します。要素を足す前に「これはユーザーの判断を速くするか」を問います。',
  use:['新しい visual treatment、装飾、アイコン、強調表現を足すとき','画面内の primary action や情報優先度を決めるとき','AI が UI 案を複数出すときの推奨理由を評価するとき'],
  good:['主要タスクと次のアクションが説明なしで分かる','強調が少なく、優先度の差が明確','空状態、エラー、権限不足でも次に何をすべきか分かる'],
  red:['見栄えのためだけの装飾がある','primary action が複数あり、主導線が曖昧','色・アイコン・ラベルが多く、何が重要か分からない'],
  applies:['components/*.md','HTML usage patterns','ScreenSpec rationale','templates'],
  rules:['ACCENT_BRAND_MARK_ONLY','SHADOW_ONLY_ON_FLOATING_LAYER']
},
{
  n:'2',
  title:'Density with rhythm',
  meaning:'業務ツールやダッシュボードに限らず、情報量の多い画面では高密度な表示が必要になります。ただし詰め込むのではなく、余白・線・階層・コントラストで「読みやすい密度」を作ります。行の高さ・余白は Density トークンでリズムとして管理します。',
  use:['一覧、テーブル、設定、ログ、管理画面の密度を決めるとき','Compact / Default / Comfortable を選ぶとき','PC / SP / touch の layout pattern を決めるとき'],
  good:['情報量が多くても走査できる','density を切り替えても階層とリズムが崩れない','SP では詰め込まず、必要に応じて表示パターンを変える'],
  red:['余白を削っただけで読みづらい','任意の余白値でその場しのぎをしている','PC の密度をそのまま SP に押し込んでいる'],
  applies:['density tokens','responsiveBehavior','tables / lists','templates'],
  rules:['SPACING_FROM_TOKENS_ONLY']
},
{
  n:'3',
  title:'Tokens before components',
  meaning:'すべてのコンポーネントはトークンから構成されます。色・余白・角丸・影・フォント・モーションをトークン化することで、テーマや密度の変更、ブランド色の差し替えに設計変更なしで耐えます。hex を直接書いた時点で、その UI はシステムの外にあります。',
  use:['CSS、component contract、HTML docs、React API を更新するとき','新しい variant や component token が必要か判断するとき','AI が UI を生成した後の token 準拠を検証するとき'],
  good:['色、余白、角丸、motion が tokenRefs に接続されている','component contract が使用 token を明示している','theme / density / seed の変更に追従する'],
  red:['生の色、任意の余白、任意の角丸を使っている','component contract と実装の token がずれている','solid 背景上の文字色を即席で決めている'],
  applies:['design/contracts','index.html CSS','tokens','design-lint'],
  rules:['NO_RAW_HEX_COLOR','TEXT_ON_SOLID_MUST_USE_TOKEN','SPACING_FROM_TOKENS_ONLY','RADIUS_FROM_TOKENS_ONLY']
},
{
  n:'4',
  title:'Adaptive by default',
  meaning:'Light / Dark、Standard / High contrast、Compact / Default / Comfortable、Primary color seed の変更に自然に対応します。Theme、Contrast、Densityは独立した軸として扱い、Semantic tokenを使うことで各contextへ一貫して解決します。',
  use:['theme、density、seed、PC / SP / touch の対応を設計するとき','コンポーネントを PC 用 / SP 用に分けるか判断するとき','HTML docs の responsive behavior を確認するとき'],
  good:['同じ component contract のまま viewport と入力方式に適応する','PC / SP / touch の振る舞いが md と contract に書かれている','High contrast でも意味と操作が保たれる'],
  red:['DesktopButton / MobileButton のように意味が重複した部品を増やす','hover 前提の情報が touch で失われる','theme や density を変えると崩れる'],
  applies:['responsiveBehavior','layout patterns','semantic tokens','templates'],
  rules:['CONTRAST_AA_MINIMUM']
},
{
  n:'5',
  title:'Accessible precision',
  meaning:'アクセシビリティは後付けではなく、初期設計に含めます。フォーカスリング・キーボード操作・コントラスト比・色に依存しない状態表現を、すべてのコンポーネントの受け入れ条件とします。',
  use:['コンポーネントの state、keyboard、aria、focus を定義するとき','Dialog、Tabs、Form、Table などの interaction を設計するとき','AI 生成 UI の qualityChecks を作るとき'],
  good:['keyboard interaction と focus behavior が contract にある','色以外のラベル、アイコン、説明で状態が伝わる','エラーや loading でも読み上げと回復手段がある'],
  red:['focus ring が消えている','色だけで danger / success / selected を表す','loading 中に accessible name や二重実行防止がない'],
  applies:['accessibility section','contract qualityChecks','HTML states','AI generation evals'],
  rules:['FOCUS_VISIBLE_REQUIRED','CONTRAST_AA_MINIMUM']
},
{
  n:'6',
  title:'Calm interaction',
  meaning:'動きは控えめで高速にします。モーションはブランド演出ではなく、状態変化を伝える認知補助として使い、作業中のユーザーを邪魔しません。prefers-reduced-motion を常に尊重します。',
  use:['hover、active、loading、dialog、drawer、toast などの motion を決めるとき','操作の完了・失敗・進行中を伝えるとき','AI が派手な演出を提案したときの採否を判断するとき'],
  good:['motion duration が token から参照される','動きが状態変化の理解を助ける','reduced motion でも意味が失われない'],
  red:['装飾やブランド演出のためだけに動く','長い transition で作業を待たせる','motion がないと状態が分からない'],
  applies:['motion tokens','interactive states','feedback components','prototype behavior'],
  rules:['MOTION_DURATION_FROM_TOKENS_ONLY']
},
{
  n:'7',
  title:'Useful documentation',
  meaning:'ドキュメントは説明ではなく、利用判断を助けるものです。Meridian では md、contract JSON、HTML docs の3層で、人間・AI・視覚確認のそれぞれに必要な情報を残します。',
  use:['コンポーネント仕様を追加・更新するとき','HTML docs に何を載せるか判断するとき','AI が読む contract と人間が読む md の差分を確認するとき'],
  good:['md に判断、禁止事項、AI Selection Rules がある','contract JSON に tokenRefs、responsiveBehavior、qualityChecks がある','HTML docs で Playground、Usage patterns、States を確認できる'],
  red:['HTML docs だけが source of truth になっている','使い方はあるが、使わない条件がない','md と contract と HTML の判断がずれている'],
  applies:['components/*.md','design/contracts','component-pages.js','spec-workflow'],
  rules:[]
}
].map(p=>`${h2(`Principle ${p.n}: ${p.title}`)}
<p>${p.meaning}</p>
<div class="grid2" style="align-items:start;margin-top:var(--sp-3)">
  <div class="panel pad" style="background:var(--bg-subtle)">
    <b style="font-size:var(--text-label)">Use it when</b>
    <ul class="plain" style="margin-top:var(--sp-2)">${p.use.map(x=>`<li>${x}</li>`).join('')}</ul>
  </div>
  <div class="panel pad" style="background:var(--bg-subtle)">
    <b style="font-size:var(--text-label)">Good signals</b>
    <ul class="plain" style="margin-top:var(--sp-2)">${p.good.map(x=>`<li>${x}</li>`).join('')}</ul>
  </div>
  <div class="panel pad" style="border-color:color-mix(in srgb,var(--danger) 28%,var(--border));background:var(--surface)">
    <b style="font-size:var(--text-label);color:var(--danger-fg)">Red flags</b>
    <ul class="plain" style="margin-top:var(--sp-2)">${p.red.map(x=>`<li>${x}</li>`).join('')}</ul>
  </div>
  <div class="panel pad" style="background:var(--surface)">
    <b style="font-size:var(--text-label)">Applies to</b>
    <div class="rowflex" style="margin-top:var(--sp-2);gap:var(--sp-1)">${p.applies.map(x=>`<code class="inline">${x}</code>`).join('')}</div>
    ${p.rules.length?`<b style="display:block;font-size:var(--text-label);margin-top:var(--sp-3)">Related rules</b><div class="rowflex" style="margin-top:var(--sp-2);gap:var(--sp-1)">${p.rules.map(x=>`<code class="inline">${x}</code>`).join('')}</div>`:''}
  </div>
</div>`).join('')}
${nextPrev(['overview/introduction','Introduction'],['overview/getting-started','Getting Started'])}`));

docPage('overview/getting-started',()=>shell(`
${head('Overview','Getting Started','現在の Meridian で、見る・使う・改善するための最短の入口です。')}
<div class="callout info">${I.info}<span>Meridian は現在、HTML docs、トークン、component spec、contract JSON を中心に整備しています。React package と Figma library は今後提供予定です。</span></div>
${h2('Start here')}
<ol class="plain">
<li>この HTML docs で右上の <b>Theme / Density / Seed</b> を切り替え、システム全体が同じトークンに追従することを確認する。</li>
<li><a href="#/overview/introduction">Introduction</a> と <a href="#/overview/principles">Principles</a> で、Meridian が優先する判断基準を理解する。</li>
<li><a href="#/components/button">Button</a> で、Playground、Variants、States、Usage patterns、Responsive behavior の読み方を確認する。</li>
</ol>
${h2('プロダクトデザイナー')}
<ul class="plain">
<li>現時点では HTML docs と <a href="#/templates/saas-dashboard">Templates</a> を画面設計の基準にする。</li>
<li>色・余白・角丸などは Foundations と Tokens に定義された名前で指定し、Primitive や任意の値を直接使わない。</li>
<li>コンポーネントを使う前に Usage patterns、Responsive behavior、アクセシビリティ要件を確認する。</li>
<li>Figma library は今後整備予定。提供までは HTML docs、token names、Templates をデザインとハンドオフの共通語彙にする。</li>
</ul>
${h2('エンジニア')}
<ul class="plain">
<li>HTML docs で見た目と状態を確認し、既存の CSS Variables と Semantic token を実装に利用する。</li>
<li><code class="inline">DESIGN.md</code> と <code class="inline">design/rules.json</code> を参照し、raw color、任意の spacing、focus 欠落などを避ける。</li>
<li><code class="inline">components/*.md</code> で利用判断を、<code class="inline">design/contracts/components/*.contract.json</code> で機械可読な制約を確認する。</li>
</ul>
<div class="callout"><span><b>React package:</b> <code class="inline">@meridian/react</code> は現在 pilot / placeholder です。コアコンポーネントの spec と contract が安定した順に実装 API を追加し、将来的に theme・density・Seed に追従する package として提供します。</span></div>
${h2('コントリビューター / AI agent')}
<ol class="plain">
<li><code class="inline">docs/components/spec-workflow.md</code> で、md → HTML review → contract JSON → validation の更新手順を確認する。</li>
<li><code class="inline">components/_template.md</code> と <code class="inline">design/contracts/components/_template.contract.json</code> から仕様を作成する。</li>
<li><code class="inline">components/button.md</code> と Button の contract / HTML docs を、完成形に近い参照例として使う。</li>
</ol>
${h2('現在準備中のもの')}
<ul class="plain">
<li>配布可能な React component package</li>
<li>正式な Figma component library と Variables</li>
<li>全コンポーネントの md / contract JSON</li>
<li>contract から画面を組み立て、検証する AI generation pipeline</li>
</ul>
${h2('最初に読むべきページ')}
<ul class="plain">
<li><a href="#/overview/architecture">System Architecture</a> — 入力・生成・3層トークン・modifier の関係</li>
<li><a href="#/foundations/color">Color</a> — Dynamic color の仕組み</li>
<li><a href="#/foundations/spacing">Spacing & Density</a> — PC / SP / touch に適応する密度設計</li>
<li><a href="#/components/button">Button</a> — コンポーネント仕様と HTML docs の読み方</li>
</ul>
${nextPrev(['overview/principles','Principles'],['overview/architecture','System Architecture'])}`));

docPage('overview/architecture',()=>{
  const P=PALETTES,T=SEM;
  return shell(`
${head('Overview','System Architecture','Meridian は、Design input を Generator / Resolver で解決し、Reference → Semantic → Component の3層トークンを CSS・Figma・React・Native へ出力します。')}
${h2('全体モデル')}
<p>Seed はトークン層ではなく、色を生成するための入力です。Theme や Density も層ではなく、同じトークン名の値を文脈に応じて切り替える modifier として扱います。</p>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:var(--sp-2);margin-bottom:var(--sp-4);text-align:center;font-size:var(--text-small)">
${[
['1. Design input','Seed / Brand config',`<span class="sw" style="width:28px;height:28px;background:${STATE.seed};margin:0 auto"></span><code class="inline">${STATE.seed}</code>`],
['2. Generate / Resolve','palette と context を解決',`<code class="inline">color engine</code><code class="inline">resolver</code>`],
['3. Reference','意味を持たない基礎値',`<div class="rowflex" style="justify-content:center;gap:2px">${[200,400,600,800].map(s=>`<span class="sw" style="background:${P.primary[s]}"></span>`).join('')}</div><code class="inline">color.palette.primary.600</code>`],
['4. Semantic','UI の用途と役割',`<span class="sw" style="width:28px;height:28px;background:${T.primary};margin:0 auto"></span><code class="inline">color.action.primary.background</code>`],
['5. Component','必要な固有判断だけ公開',`${btn({label:'Button',size:'sm'})}<code class="inline">component.button.*</code>`],
['6. Outputs','利用先へ変換',`<code class="inline">CSS</code><code class="inline">Figma / React / Native</code>`]
].map(([t,d,v])=>`<div class="panel pad" style="background:var(--bg-subtle)"><b style="display:block;font-size:var(--text-label)">${t}</b><p style="color:var(--fg-muted);margin:4px 0 10px;font-size:var(--text-micro)">${d}</p><div style="display:flex;flex-direction:column;gap:6px;align-items:center">${v}</div></div>`).join('')}
</div>
<div class="callout info">${I.info}<span><b>「Seed → Reference → Semantic → Component」</b>は色生成の流れを短く説明するときに使えます。ただし正式な構造では、Seed は input、Generator / Resolver は処理、トークンは3層として区別します。</span></div>
${h2('3つの token layers')}
<div class="grid3" style="align-items:start">
${[
['Reference','実値または生成値を持つ基礎層。palette、spacing scale、radius、duration など。UI 実装から直接参照しません。','color.palette.primary.600 / space.4'],
['Semantic','対象・用途・状態を表す共通語彙。プロダクトとコンポーネントが通常参照する層です。','color.text.primary / color.border.focus'],
['Component','特定コンポーネントだけを独立して変更するための層。必要な binding だけを安定したカスタマイズ API として公開します。','component.button.loading.spinner.color']
].map(([t,d,e])=>`<div class="panel pad" style="background:var(--bg-subtle)"><b>${t}</b><p style="font-size:var(--text-small);color:var(--fg-muted);margin:var(--sp-2) 0">${d}</p><code class="inline">${e}</code></div>`).join('')}
</div>
<p>参照は原則として一方向です。<b>Semantic → Reference、Component → Semantic</b>の順に解決し、循環参照と上位層への逆流を許可しません。Component 固有の寸法など、Semantic に一般化できない値だけは、理由を contract に記録した上で Reference を参照できます。</p>
${h2('Context modifiers')}
<p>modifier はトークン階層とは別の軸です。それぞれが担当するtokenを重複させないよう、可能な限り直交させます。</p>
<ul class="plain">
<li><b>Theme(Light / Dark)</b> — 背景・文字・境界・状態色の Semantic mapping を切り替える。</li>
<li><b>Contrast(Standard / High)</b> — コントラスト目標、focus width、境界の強度をLight / Darkとは独立して切り替える。</li>
<li><b>Density(Compact / Default / Comfortable)</b> — control size、文字サイズ、余白、行高を切り替える。</li>
<li><b>Platform(Web / iOS / Android)</b> — font、focus、native interaction など、プラットフォーム固有値が必要な場合だけ使う。</li>
<li><b>Motion(Standard / Reduced)</b> — duration と transition を切り替え、ユーザー設定を尊重する。</li>
</ul>
<p><b>Seed / Brand config</b> は任意値を受け取る generator input です。<b>Viewport と input method</b> は原則として token modifier にせず、component contract の <code class="inline">responsiveBehavior</code> と layout pattern で扱います。</p>
${h2('Component binding と token 昇格')}
<p>すべてのコンポーネントは、anatomy / variant / state ごとの visual slot に <code class="inline">tokenBinding</code> を持ちます。Component token を作るかどうかに関係なく、何を参照しているかは必ず機械可読にします。</p>
${codeBlock(`component slot\n  └─ Semantic token                       # 通常\n\ncomponent slot\n  └─ Component token → Semantic token     # 独立変更が必要な場合`,'text','Token binding')}
<p>次のいずれかに該当する binding だけを Component token に昇格します。</p>
<ul class="plain">
<li>Semantic を変えず、そのコンポーネントだけ変更する必要がある。</li>
<li>React / Figma / Native で、コンポーネント単位のカスタマイズ API として公開する。</li>
<li>同じ Semantic role でも、そのコンポーネントでは独立した値が必要になる。</li>
<li>コンポーネント固有の anatomy・variant・state を表す。</li>
<li>複数プラットフォーム間で、コンポーネント固有の設計判断を固定する。</li>
</ul>
<p>Semantic と1対1で対応し、同じ役割を持つ全コンポーネントが一緒に変わるべき場合は Semantic を直接 binding します。CSS の都合だけで別名を作ることは、Component token の作成理由になりません。</p>
${codeBlock(`{\n  "slot": "loading.spinner.color",\n  "source": "{component.button.loading.spinner.color}",\n  "scope": "component",\n  "aliases": "{color.action.primary.foreground}",\n  "trigger": "component-anatomy",\n  "reason": "The spinner is Button-specific anatomy."\n}`,'json','component contract binding')}
${h2('Source of truth と生成物')}
<p>最終的には、token source と resolver を唯一の真実源にし、各プラットフォームの形式を生成します。HTML docs や CSS Variables は編集元ではなく、解決結果を確認する出力です。</p>
${codeBlock(`design inputs / generator config\ntokens/reference/*.tokens.json\ntokens/semantic/*.tokens.json\ntokens/component/*.tokens.json\ntokens/meridian.resolver.json\ncomponents/*.md\ndesign/contracts/components/*.contract.json\n        ↓ generate / validate\nCSS Variables / Figma Variables / React theme / Native resources / HTML docs`,'text','Target source flow')}
<div class="callout warn">${I.warn}<span><b>Current state:</b> 現在は color engine、<code class="inline">tokens/src/*.json</code>、<code class="inline">js/utils.js</code> に生成責務が分かれています。また token JSON は DTCG 2025.10 の完全準拠形式へ移行途中です。このページは目標構造を示し、実データは段階的に同期します。</span></div>
${h2('命名規則')}
<ul class="plain">
<li>Reference: <code class="inline">category.family.step</code>(例: <code class="inline">color.palette.primary.600</code>, <code class="inline">space.4</code>)</li>
<li>Semantic: <code class="inline">category.property.role.state</code>(例: <code class="inline">color.background.surface</code>, <code class="inline">color.action.primary.background.hover</code>)</li>
<li>Component: <code class="inline">component.name.variant.anatomy.property.state</code>(例: <code class="inline">component.button.primary.container.background.hover</code>)</li>
<li>不要な segment は省略できますが、略語は使いません。CSS名は canonical path から <code class="inline">--color-background-surface</code> のように生成します。</li>
</ul>
${h2('Architecture invariants')}
<ul class="plain">
<li>UI 実装は Reference tokenを直接参照しない。</li>
<li>すべての visual slot は component contract に binding を持つ。</li>
<li>Component token には <code class="inline">trigger</code> と <code class="inline">reason</code> が必要。</li>
<li>Theme / Contrast / Density などの modifier は、可能な限り異なるtoken群を担当する。</li>
<li>循環参照、未解決alias、未使用Component tokenをvalidationで拒否する。</li>
</ul>
${nextPrev(['overview/getting-started','Getting Started'],['foundations/color','Color'])}`)});

docPage('overview/for-designers',()=>shell(`
${head('Overview','For Designers','Meridian の判断を画面設計へ適用し、仕様・実装へ曖昧さなく渡すための実務ガイドです。現在は HTML docs、token names、component md / contract、Templates を共通語彙として使います。')}
<div class="callout info">${I.info}<span>Figma library は今後提供予定です。提供前も、見た目だけを模倣せず、md の利用判断、contract の制約、HTML docs の視覚例を組み合わせて設計します。</span></div>
${h2('設計を始める順序')}
<ol class="plain">
<li><a href="#/overview/principles">Principles</a> と対象プロダクトのタスクを確認し、画面で最も重要な判断を 1 つ定める。</li>
<li>既存の Template / Pattern から最も近い構成を選び、レイアウトをゼロから発明しない。</li>
<li>各 component の <b>When To Use / When Not To Use</b>、Responsive behavior、Accessibility を確認する。</li>
<li>色・余白・文字・角丸・motion を Semantic token 名で指定し、必要な state と content を埋める。</li>
<li>Light / Dark × Standard / High、Compact / Default / Comfortable、desktop / mobile / touch で成立するか HTML docs 上で確認する。</li>
<li>ハンドオフでは token 名、component 名とvariant、state、responsive rule、未確定事項を残す。</li>
</ol>
${h2('Token の選び方')}
<ul class="plain">
<li><b>Primitive color を直接使わない。</b><code class="inline">primary-600</code> ではなく Semantic の <code class="inline">primary</code> を使う。テーマ切替は Semantic 層でしか保証されない。</li>
<li>テキスト色は <code class="inline">foreground</code> / <code class="inline">foreground-muted</code> / <code class="inline">foreground-subtle</code> の 3 段のみ。第 4 のグレーを発明しない。</li>
<li>状態(成功・警告・危険)は色+アイコン+ラベルの 3 点セットで表現する。</li>
<li>Component token はcontractにbindingがある場合だけ選ぶ。新規Component tokenが必要なら、独立した変更境界が必要な理由とtriggerを提案に含める。</li>
</ul>
${h2('アクションの優先度')}
<ul class="plain">
<li>Primary action は 1 つの意思決定文脈に原則 1 つ。画面に複数の独立領域がある場合も、同時に競合して見えない階層を作る。</li>
<li>破壊的操作は Danger + 確認ダイアログ。並置するキャンセルは Ghost にする。</li>
<li>遷移は Link、状態変更は Button、即時反映のON/OFFは Switchとして、見た目よりsemanticで選ぶ。</li>
</ul>
${h2('密度の選び方')}
<ul class="plain">
<li><b>Compact</b>: テーブル中心の管理画面、ログビューア、パワーユーザー向け</li>
<li><b>Default</b>: 迷ったらこれ。汎用的な画面全般</li>
<li><b>Comfortable</b>: 設定・オンボーディング・タッチデバイス</li>
</ul>
${h2('コンポーネントの扱い')}
<ul class="plain">
<li>テンプレートをベースに設計する。ゼロから画面を組まない。</li>
<li>md で利用判断を、contract JSON でvariant・state・token・responsive制約を、HTML docsで実際の見え方を確認する。</li>
<li>PC用 / SP用という理由だけで別componentを作らない。同じcontractのまま、layout、visibility、density、placementを適応させる。</li>
<li>要件に合わない場合は既存componentを局所改造せず、利用文脈、必要なstate / slot、代替できない理由を添えてsystem変更を提案する。</li>
<li>一度限りの見た目調整をtoken化しない。まず既存Semantic tokenとlayout patternで解決し、再利用可能な判断だけをsystemへ昇格する。</li>
</ul>
${h2('Responsive と状態設計')}
<ul class="plain">
<li>desktopでは走査性とkeyboard効率、mobileでは優先情報と縦方向の流れ、touchではtarget sizeとhover非依存を確認する。</li>
<li>defaultだけでなく、loading、empty、error、disabled、permission denied、long contentを必要に応じて設計する。</li>
<li>表示を省略する場合は、情報自体を失わせず詳細画面、Drawer、Dialog、progressive disclosureなどの到達経路を残す。</li>
<li>文字拡大、翻訳による長文化、動きの軽減でもタスクが完了できることを確認する。</li>
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
<li>semantic element、accessible name、フォーカス順・キーボード操作・エラーメッセージ文言までをデザインの成果物に含める。</li>
<li>ハンドオフ時は hex ではなくトークン名を注記する(例:「背景: surface-muted」)。</li>
<li>componentのvariant / size / state、content、responsive差分を名前で記録し、スクリーンショットだけを仕様にしない。</li>
<li>コントラストは Color ページの <a href="#/foundations/color">Contrast checker</a> で検証し、色以外の手掛かりも確認する。</li>
</ul>
${h2('Ready for handoff')}
<ul class="plain">
<li>主要タスク、primary action、情報階層を説明できる。</li>
<li>使用componentと選択理由、避けた代替を説明できる。</li>
<li>すべてのvisual valueがtokenまたはcontract bindingに接続されている。</li>
<li>必要なstate、desktop / mobile / touch、theme、densityを確認している。</li>
<li>accessibility、content、未確定事項、検証条件が実装者へ渡っている。</li>
</ul>
${nextPrev(['overview/architecture','System Architecture'],['overview/for-engineers','For Engineers'])}`));

docPage('overview/for-engineers',()=>shell(`
${head('Overview','For Engineers','現在のMeridianを安全に参照・改善するための実装ガイドです。React packageの将来APIと、今このrepositoryで利用できる成果物を分けて説明します。')}
<div class="callout warn">${I.warn}<span><code class="inline">@meridian/react</code> と <code class="inline">@meridian/tokens</code> は未公開です。現在のReact packageはbuild pipeline確認用のplaceholderで、component API、ThemeProvider、hooks、package installationはまだ利用できません。</span></div>
${h2('現在利用できるもの')}
<ul class="plain">
<li><code class="inline">tokens/src/*.json</code>: spacing、radius、motion、layout、densityの編集元。</li>
<li><code class="inline">tokens/build/tokens.css</code>: <code class="inline">npm run build:tokens</code>で生成するReference / density CSS Variables。</li>
<li><code class="inline">src/color-engine.js</code>: SeedからpaletteとLight / Dark × Standard / HighのSemantic colorを計算する現行engine。</li>
<li><code class="inline">components/*.md</code> と <code class="inline">design/contracts/components/*.contract.json</code>: componentの人間向け判断と機械可読契約。</li>
<li>このHTML docs: componentの見た目、state、theme、density、responsive behaviorを確認する実働showcase。</li>
</ul>
${h2('Repository setup')}
${codeBlock(`npm run refine:status\nnpm run check:system\nnpm run build:tokens\nnpm run design:build`,'bash','Terminal')}
<p>ビルド不要のdocsは<code class="inline">index.html</code>を直接開けます。sourceを更新した後は、生成物を直接編集せず上記commandで同期します。</p>
${h2('実装前に読む順序')}
<ol class="plain">
<li><code class="inline">DESIGN.md</code> と <code class="inline">design/rules.json</code>で全体制約を確認する。</li>
<li>対象componentのmdでWhen To Use / When Not To Use、behavior、content、responsive判断を確認する。</li>
<li>contract JSONでvariant、state、token binding、keyboard、qualityChecksを機械的に確認する。</li>
<li>HTML docsでtheme、density、state、desktop / mobileの表示を確認する。</li>
<li>実装とdocsを同じreview cycleで更新し、<code class="inline">npm run check:system</code>を通す。</li>
</ol>
${h2('CSS を書く場合')}
${codeBlock(`.deploy-card {\n  background: var(--surface);\n  border: 1px solid var(--border);\n  border-radius: var(--radius-lg);\n  padding: var(--card-pad); /* density に自動連動 */\n  color: var(--fg);\n}\n.deploy-card:hover { border-color: var(--border-strong); }`,'css','deploy-card.css')}
<ul class="plain">
<li>UIからReference tokenを直接参照せず、Semantic tokenまたはcontractで承認されたComponent tokenを使う。</li>
<li>rawなhex、spacing、radius、durationを追加しない。必要な役割がなければ、まずownerとなるFoundation / Tokenをreviewする。</li>
<li>native semantic elementを優先し、interaction engineを手書きする前に既存libraryやplatform primitiveの採用可否を調べる。</li>
<li>component固有CSSはanatomyとstateのvisual slotへ対応させ、contractの<code class="inline">tokenBindings</code>から追跡できるようにする。</li>
</ul>
${h2('React package roadmap contract')}
<p>将来の<code class="inline">@meridian/react</code>は、stableになったcomponent contractから順に実装します。次のAPI名は方向性であり、公開済みAPIではありません。</p>
${codeBlock(`// Planned, not currently available\n<MeridianProvider theme="dark" density="compact" seedColor={seed}>\n  <Button variant="primary">Create project</Button>\n</MeridianProvider>`,'tsx','planned-api.tsx')}
<ul class="plain">
<li>React APIはnative semantics、ref、controlled / uncontrolled方針、keyboard、ariaをcontractから導出する。</li>
<li>theme / density / Seedはcomponent propsへ分散させず、providerとSemantic token resolutionが所有する。</li>
<li>公開前にpackage build、type tests、interaction tests、accessibility tests、SSR compatibilityを検証する。</li>
</ul>
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
<li>動きは <code class="inline">prefers-reduced-motion</code> で削減する。現時点ではcomponent実装側でも確認し、tokenだけで対応済みと仮定しない</li>
</ul>
${h2('Ready for review')}
<ul class="plain">
<li>md、contract、HTML docs、実装の責務と差分が説明できる。</li>
<li>全visual slotがtoken bindingまたはowner付きunbound slotとして記録されている。</li>
<li>keyboard、focus、screen reader、error / loading、responsive behaviorが検証されている。</li>
<li>生成物が編集元から再生成され、<code class="inline">npm run check:system</code>が通っている。</li>
</ul>
${nextPrev(['overview/for-designers','For Designers'],['foundations/color','Color'])}`));
