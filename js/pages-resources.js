"use strict";
/* ============ Resources ============ */
docPage('resources/figma-tokens',()=>shell(`
${head('Resources','Figma Tokens','Figma Variables へ同期するための交換仕様です。現時点の配布物は、リポジトリ内の DTCG 形式ソースと解決済み JSON です。')}
${h2('推奨コレクション構成')}
<ul class="plain"><li><b>1. Primitive</b> — モードなし。色スケール・spacing・radius の原子値。</li><li><b>2. Semantic</b> — Theme: Light / Dark、Contrast: Standard / High。Primitive への alias。</li><li><b>3. Component</b> — 必要な場合だけ作成し、Semantic または理由付きの固有値を参照。</li><li><b>4. Density</b> — Compact / Default / Comfortable。サイズ系。</li></ul>
${h2('現在の同期境界')}
<p><a href="#/tokens/json-tokens">JSON Tokens</a> の4つの解決済み context bundle を、Figma plugin または変換アダプターの入力にします。Meridian 自体はまだ Figma library や自動 import plugin を配布していないため、Variables への直接 import は現在の保証範囲外です。</p>
${h2('運用ルール')}
<ul class="plain"><li>プロダクトデザインでは Semantic / Component を使用し、Primitive は値の編集・監査に限定する。</li><li>トークンソースを Source of truth とし、生成物を Figma へ一方向同期する。Figma 側の提案はソース変更の review として戻す。</li><li>同期アダプターを追加するときは alias、型、4 context、3 density の欠落を自動検証する。</li></ul>`));
docPage('resources/css-variables',()=>PAGES['tokens/css-variables']());
docPage('resources/react-usage',()=>PAGES['overview/for-engineers']());
docPage('resources/tailwind-usage',()=>shell(`
${head('Resources','Tailwind Usage','Tailwind v4 の @theme に Semantic token をマッピングし、ユーティリティ名からも hex / Primitive を排除します。npm package は未公開のため、現在は生成CSSをリポジトリ内のパスから読み込みます。')}
${codeBlock(`@import "tailwindcss";\n@import "../tokens/build/tokens.css";\n\n@theme inline {\n  --color-background: var(--bg);\n  --color-surface: var(--surface);\n  --color-surface-muted: var(--surface-muted);\n  --color-foreground: var(--fg);\n  --color-muted: var(--fg-muted);\n  --color-subtle: var(--fg-subtle);\n  --color-border: var(--border);\n  --color-primary: var(--primary);\n  --color-primary-foreground: var(--primary-fg);\n  --color-danger: var(--danger);\n  --color-success: var(--success);\n  --radius-meridian-sm: var(--radius-sm);\n  --radius-meridian-md: var(--radius-md);\n  --radius-meridian-lg: var(--radius-lg);\n}`,'css','globals.css')}
${codeBlock(`<div className="bg-surface border border-border rounded-meridian-lg p-4">\n  <h3 className="text-foreground font-semibold">Deploy</h3>\n  <p className="text-muted text-sm">main → production</p>\n  <button className="bg-primary text-primary-foreground rounded-meridian-md px-3 h-8">\n    Deploy\n  </button>\n</div>`,'tsx','usage.tsx')}
<div class="callout warn">${I.warn}<span><code class="inline">bg-blue-500</code> のような Tailwind 標準パレットの使用は lint で禁止します。テーマ切替が破綻するためです。</span></div>`));
docPage('resources/design-handoff',()=>shell(`
${head('Resources','Design Handoff','デザインとコードの間で「トークン名」を共通言語にします。hex や px の受け渡しをなくします。')}
${h2('ハンドオフの成果物')}
<ul class="plain"><li>Figma フレーム(Semantic token 使用、Auto layout 適用)</li><li>状態一覧: Default / Hover / Focus / Disabled / Error / Empty / Loading</li><li>文言: エラーメッセージ・空状態・確認ダイアログの実文言</li><li>レスポンシブ: Mobile / Desktop の 2 点 + 中間の振る舞いの注記</li></ul>
${h2('注記の書き方')}
${codeBlock(`背景: surface / ボーダー: border → hover で border-strong\n余白: card-padding(density 連動)\n見出し: Heading 3 / 補足: Body Small + foreground-muted\n主要アクション: Button primary md — 1 画面に 1 つ`,'txt','annotation example')}
${h2('レビュー観点')}
<ul class="plain"><li>Primitive・hex の直接指定が無いか</li><li>Light / Dark × Standard / High と必要な密度で確認したか</li><li>フォーカス順・キーボード操作が定義されているか</li></ul>`));
docPage('resources/a11y-checklist',()=>shell(`
${head('Resources','Accessibility Checklist','リリース前チェックリストです。すべて Yes になるまで出荷しません。')}
${['テキストのコントラスト比が 4.5:1 以上(大テキスト 3:1)','UI 部品・フォーカスリングのコントラストが 3:1 以上','すべての操作がキーボードのみで完結する','フォーカスが常に可視で、順序が視覚順と一致する','Dialog がフォーカストラップ+Esc+復帰を実装している','Icon only コントロールに aria-label がある','フォームが label / aria-describedby / aria-invalid を実装している','エラーが具体的で、修正方法を含む','状態を色だけで表現していない(アイコン・ラベル併記)','prefers-reduced-motion で動きが止まる','操作ターゲットが 24px 以上で、タッチ中心の操作は原則 44px 以上','Loading / Empty / Error 状態が定義されている'].map(t=>`<label class="checkbox" style="display:flex;margin-bottom:10px"><input type="checkbox"><span>${t}</span></label>`).join('')}
<p style="margin-top:var(--sp-4)">詳細は <a href="#/foundations/accessibility">Foundations / Accessibility</a> を参照。</p>`));
docPage('resources/contribution',()=>shell(`
${head('Resources','Contribution Guide','コンポーネント・トークンの追加は、以下のプロセスで受け付けます。')}
${h2('プロセス')}
<ul class="plain"><li><b>1. Proposal</b> — 用途・既存で代替できない理由・API 案を Issue で提出</li><li><b>2. Design review</b> — 全テーマ × 全密度でのデザイン、状態一覧、a11y 仕様</li><li><b>3. Implementation</b> — トークンのみで実装。hex / px 直書きは CI で拒否</li><li><b>4. Docs</b> — When to use / not use、Playground、コード例を必須で追加</li></ul>
${h2('受け入れ条件(抜粋)')}
<ul class="plain"><li>Light / Dark × Standard / High の4 context × Compact / Default / Comfortable の12通りで破綻しない</li><li>キーボード操作・フォーカス・aria が仕様化されている</li><li>Empty / Loading / Error を持つ(該当する場合)</li></ul>`));
docPage('resources/changelog',()=>shell(`
${head('Resources','Changelog','Meridian のリリース履歴です。')}
${[['v2.4.1','2026-07-02',['fix: Dark テーマの focus-ring コントラストを 3:1 以上に修正','fix: Compact 密度でのフォームギャップを 12px に調整']],
['v2.4.0','2026-06-24',['feat: Dynamic color API — seedColor prop でテーマ全体を生成','feat: AI コンポーネント群(Prompt Input / Agent Status / Run Log / Code Diff)を追加','feat: High contrast テーマを追加']],
['v2.3.0','2026-05-18',['feat: Density provider(Compact / Default / Comfortable)','feat: Data Grid の仮想スクロール対応','docs: 全コンポーネントに When to use / not use を追加']],
['v2.2.0','2026-04-09',['feat: Command Menu コンポーネント','change: radius スケールを 9 段に再編(2xl 追加)']]].map(([v,d,items])=>`
<div style="display:flex;gap:var(--sp-5);margin-bottom:var(--sp-6)"><div style="flex:none;width:110px"><code class="inline">${v}</code><div style="font-size:var(--text-micro);color:var(--fg-subtle);margin-top:4px">${d}</div></div>
<ul class="plain" style="margin:0 0 0 var(--sp-4)">${items.map(i=>`<li>${i}</li>`).join('')}</ul></div>`).join('')}`));
