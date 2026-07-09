"use strict";
/* ============ Resources ============ */
docPage('resources/figma-tokens',()=>shell(`
${head('Resources','Figma Tokens','Figma Variables として全トークンを配布します。Primitive / Semantic / Component の 3 コレクション構成です。')}
${h2('コレクション構成')}
<ul class="plain"><li><b>1. Primitive</b> — モードなし。色スケール・spacing・radius の原子値。</li><li><b>2. Semantic</b> — モード: Light / Dark / HC。Primitive への alias。</li><li><b>3. Component</b> — モードは Semantic を継承。コンポーネント固有値。</li><li><b>4. Density</b> — モード: Compact / Default / Comfortable。サイズ系。</li></ul>
${h2('インポート')}
<p><a href="#/tokens/json-tokens">JSON Tokens</a> を書き出し、Figma の Variables import(または Tokens Studio)で読み込みます。alias(<code class="inline">{primitive.primary.600}</code>)はそのまま Variables 参照になります。</p>
${h2('運用ルール')}
<ul class="plain"><li>デザインでは Semantic / Component のみ使用。Primitive コレクションは公開設定で hidden にする。</li><li>トークンの追加・変更はコードを Source of truth とし、Figma へ同期する(逆方向は PR ベース)。</li></ul>`));
docPage('resources/css-variables',()=>PAGES['tokens/css-variables']());
docPage('resources/react-usage',()=>PAGES['overview/for-engineers']());
docPage('resources/tailwind-usage',()=>shell(`
${head('Resources','Tailwind Usage','Tailwind v4 の @theme に Semantic token をマッピングし、ユーティリティ名からも hex / Primitive を排除します。')}
${codeBlock(`@import "tailwindcss";\n@import "@meridian/tokens/css";\n\n@theme inline {\n  --color-background: var(--bg);\n  --color-surface: var(--surface);\n  --color-surface-muted: var(--surface-muted);\n  --color-foreground: var(--fg);\n  --color-muted: var(--fg-muted);\n  --color-subtle: var(--fg-subtle);\n  --color-border: var(--border);\n  --color-primary: var(--primary);\n  --color-primary-foreground: var(--primary-fg);\n  --color-danger: var(--danger);\n  --color-success: var(--success);\n  --radius-sm: var(--radius-sm);\n  --radius-md: var(--radius-md);\n  --radius-lg: var(--radius-lg);\n}`,'css','globals.css')}
${codeBlock(`<div className="bg-surface border border-border rounded-lg p-4">\n  <h3 className="text-foreground font-semibold">Deploy</h3>\n  <p className="text-muted text-sm">main → production</p>\n  <button className="bg-primary text-primary-foreground rounded-md px-3 h-8">\n    Deploy\n  </button>\n</div>`,'tsx','usage.tsx')}
<div class="callout warn">${I.warn}<span><code class="inline">bg-blue-500</code> のような Tailwind 標準パレットの使用は lint で禁止します。テーマ切替が破綻するためです。</span></div>`));
docPage('resources/design-handoff',()=>shell(`
${head('Resources','Design Handoff','デザインとコードの間で「トークン名」を共通言語にします。hex や px の受け渡しをなくします。')}
${h2('ハンドオフの成果物')}
<ul class="plain"><li>Figma フレーム(Semantic token 使用、Auto layout 適用)</li><li>状態一覧: Default / Hover / Focus / Disabled / Error / Empty / Loading</li><li>文言: エラーメッセージ・空状態・確認ダイアログの実文言</li><li>レスポンシブ: Mobile / Desktop の 2 点 + 中間の振る舞いの注記</li></ul>
${h2('注記の書き方')}
${codeBlock(`背景: surface / ボーダー: border → hover で border-strong\n余白: card-padding(density 連動)\n見出し: Heading 3 / 補足: Body Small + foreground-muted\n主要アクション: Button primary md — 1 画面に 1 つ`,'txt','annotation example')}
${h2('レビュー観点')}
<ul class="plain"><li>Primitive・hex の直接指定が無いか</li><li>Dark / HC / Compact で確認したか(Figma のモード切替)</li><li>フォーカス順・キーボード操作が定義されているか</li></ul>`));
docPage('resources/a11y-checklist',()=>shell(`
${head('Resources','Accessibility Checklist','リリース前チェックリストです。すべて Yes になるまで出荷しません。')}
${['テキストのコントラスト比が 4.5:1 以上(大テキスト 3:1)','UI 部品・フォーカスリングのコントラストが 3:1 以上','すべての操作がキーボードのみで完結する','フォーカスが常に可視で、順序が視覚順と一致する','Dialog がフォーカストラップ+Esc+復帰を実装している','Icon only コントロールに aria-label がある','フォームが label / aria-describedby / aria-invalid を実装している','エラーが具体的で、修正方法を含む','状態を色だけで表現していない(アイコン・ラベル併記)','prefers-reduced-motion で動きが止まる','タッチターゲットが 40px 以上(タッチ環境)','Loading / Empty / Error 状態が定義されている'].map(t=>`<label class="checkbox" style="display:flex;margin-bottom:10px"><input type="checkbox"><span>${t}</span></label>`).join('')}
<p style="margin-top:var(--sp-4)">詳細は <a href="#/foundations/accessibility">Foundations / Accessibility</a> を参照。</p>`));
docPage('resources/contribution',()=>shell(`
${head('Resources','Contribution Guide','コンポーネント・トークンの追加は、以下のプロセスで受け付けます。')}
${h2('プロセス')}
<ul class="plain"><li><b>1. Proposal</b> — 用途・既存で代替できない理由・API 案を Issue で提出</li><li><b>2. Design review</b> — 全テーマ × 全密度でのデザイン、状態一覧、a11y 仕様</li><li><b>3. Implementation</b> — トークンのみで実装。hex / px 直書きは CI で拒否</li><li><b>4. Docs</b> — When to use / not use、Playground、コード例を必須で追加</li></ul>
${h2('受け入れ条件(抜粋)')}
<ul class="plain"><li>Light / Dark / HC × Compact / Default / Comfortable の 9 通りで破綻しない</li><li>キーボード操作・フォーカス・aria が仕様化されている</li><li>Empty / Loading / Error を持つ(該当する場合)</li></ul>`));
docPage('resources/changelog',()=>shell(`
${head('Resources','Changelog','Meridian のリリース履歴です。')}
${[['v2.4.1','2026-07-02',['fix: Dark テーマの focus-ring コントラストを 3:1 以上に修正','fix: Compact 密度でのフォームギャップを 12px に調整']],
['v2.4.0','2026-06-24',['feat: Dynamic color API — seedColor prop でテーマ全体を生成','feat: AI コンポーネント群(Prompt Input / Agent Status / Run Log / Code Diff)を追加','feat: High contrast テーマを追加']],
['v2.3.0','2026-05-18',['feat: Density provider(Compact / Default / Comfortable)','feat: Data Grid の仮想スクロール対応','docs: 全コンポーネントに When to use / not use を追加']],
['v2.2.0','2026-04-09',['feat: Command Menu コンポーネント','change: radius スケールを 9 段に再編(2xl 追加)']]].map(([v,d,items])=>`
<div style="display:flex;gap:var(--sp-5);margin-bottom:var(--sp-6)"><div style="flex:none;width:110px"><code class="inline">${v}</code><div style="font-size:var(--text-micro);color:var(--fg-subtle);margin-top:4px">${d}</div></div>
<ul class="plain" style="margin:0 0 0 var(--sp-4)">${items.map(i=>`<li>${i}</li>`).join('')}</ul></div>`).join('')}`));
