"use strict";
/* ============ Patterns ============ */
const PATTERNS={
'dashboard-layout':{t:'Dashboard Layout',d:'KPI → チャート → 明細の 3 段構成で「概観 → 深掘り」の視線を設計する。',body:()=>`
${h2('構成')}
<ul class="plain"><li><b>1 段目:</b> KPI Card 3–4 枚。今期の健全性を 3 秒で判断できる指標に絞る。</li><li><b>2 段目:</b> Chart Container。期間切替(Segmented Control)を右上に統一配置。</li><li><b>3 段目:</b> Table / Activity。行から詳細へ遷移する導線を持つ。</li></ul>
${h2('ガイドライン')}
<ul class="plain"><li>フィルタ(期間・環境)はページ上部に置き、全セクションに適用する。</li><li>Empty / Loading をセクション単位で設計する(全画面スケルトンにしない)。</li></ul>
<p>実装例: <a href="#/templates/saas-dashboard">SaaS Dashboard template</a></p>`},
'settings-layout':{t:'Settings Layout',d:'左に設定ナビ、右にセクション化されたフォーム。保存モデルを画面内で統一する。',body:()=>`
${h2('構成')}
<ul class="plain"><li>左: 設定カテゴリのローカルナビ(General / Members / Billing / API)。</li><li>右: Settings Panel の縦積み。1 パネル = 1 関心事。</li><li>破壊的操作は最下部の Danger zone に隔離する。</li></ul>
${h2('保存モデル')}
<ul class="plain"><li>即時反映(Switch)と明示保存(Save bar)を 1 画面で混在させない。</li><li>未保存変更がある場合、画面下に固定 Save bar を表示し、離脱時に確認する。</li></ul>
<p>実装例: <a href="#/templates/settings">Settings template</a></p>`},
'list-detail-layout':{t:'List Detail Layout',d:'一覧の文脈を保ったまま詳細を見せる。選択状態と URL を同期する。',body:()=>`
${h2('選択肢')}
<ul class="plain"><li><b>右パネル(推奨):</b> 一覧 60% + 詳細 40%。Issue Tracker 型。</li><li><b>Drawer:</b> 一時的な詳細確認。閉じると一覧に戻る。</li><li><b>別ページ:</b> 詳細が独立した作業になる場合のみ。</li></ul>
${h2('ガイドライン')}
<ul class="plain"><li>選択行は primary-subtle でハイライトし、↑↓ で移動できるようにする。</li><li>詳細の ID を URL に持たせ、リロード・共有に耐える。</li></ul>
<p>実装例: <a href="#/templates/issue-tracker">Issue Tracker template</a></p>`},
'command-first-workflow':{t:'Command First Workflow',d:'⌘K を操作の主経路として設計し、GUI はその可視化として扱う。',body:()=>`
${h2('原則')}
<ul class="plain"><li>すべての主要操作(作成・移動・切替)に Command Menu からの経路を用意する。</li><li>GUI 上のボタンにはショートカットを併記し、学習の階段を作る。</li><li>最近使ったコマンドを先頭に出し、繰り返し操作を高速化する。</li></ul>
${h2('注意')}
<ul class="plain"><li>Command Menu は Sidebar の代替ではない。初学者の導線として GUI は必ず残す。</li></ul>`},
'ai-chat-workflow':{t:'AI Chat Workflow',d:'チャットを中心に、実行状態・成果物・コンテキストを周辺パネルで可視化する。',body:()=>`
${h2('レイアウト')}
<ul class="plain"><li>中央: 会話ストリーム + Prompt Input(下部固定)。</li><li>左: File Tree などのコンテキスト。右: Run Log / Diff などの成果物。</li></ul>
${h2('状態設計')}
<ul class="plain"><li>Agent Status を常時表示し、Running 中は停止を提供する。</li><li>ツール実行は折りたたみで会話に埋め込み、成否を明示する。</li><li>AI の提案は AI Response Card で「適用 / 編集 / 破棄」を選ばせる。人間が最終決定者。</li></ul>
<p>実装例: <a href="#/templates/ai-workspace">AI Agent Workspace template</a></p>`},
'empty-to-active':{t:'Empty to Active State',d:'空状態を「最初の成功体験」への導線として設計する。',body:()=>`
${h2('段階')}
<ul class="plain"><li><b>Empty:</b> 何が無いか+作るとどうなるか+主要 CTA(1 つ)。</li><li><b>First item:</b> 作成直後にサンプルデータ or ガイドを重ね、次の一歩を示す。</li><li><b>Active:</b> 通常表示。ガイドは消えるが Help から再表示できる。</li></ul>
${h2('注意')}
<ul class="plain"><li>検索 0 件・フィルタ 0 件・権限なしは、初回 Empty と文言を変える。</li></ul>`},
'error-recovery':{t:'Error Recovery',d:'エラーは「行き止まり」ではなく「回復の起点」。原因・影響・次の一手を示す。',body:()=>`
${h2('階層別の扱い')}
<ul class="plain"><li><b>フィールド:</b> Validation Message。具体的な直し方。</li><li><b>操作:</b> Toast(danger)+ 再試行。入力は保持。</li><li><b>セクション:</b> Alert + 再読み込みボタン。他セクションは生かす。</li><li><b>ページ:</b> Error Screen。エラーコード・詳細開示・サポート導線。</li></ul>
<p>実装例: <a href="#/templates/error-screen">Error Screen template</a></p>`},
'permission-management':{t:'Permission Management',d:'ロールは「できること」の言葉で説明し、変更の影響を事前に見せる。',body:()=>`
${h2('ガイドライン')}
<ul class="plain"><li>ロール名(Admin / Editor / Viewer)には必ず 1 行の説明を添える。</li><li>権限の降格・削除は確認ダイアログで影響(アクセス不能になるリソース)を明示する。</li><li>自分自身の Admin 剥奪など、ロックアウトを招く操作はブロックする。</li><li>変更は監査ログ(Activity Feed)に記録する。</li></ul>
<p>実装例: <a href="#/templates/team-management">Team Management template</a></p>`},
'billing-flow':{t:'Billing Flow',d:'現状 → 差分 → 確定の順で、金額の変化を隠さない。',body:()=>`
${h2('構成')}
<ul class="plain"><li>現在のプラン+使用量(Usage Meter)を最初に見せる。</li><li>プラン比較は Plan Card を横並びにし、現在のプランを明示。</li><li>変更確定前に「今日の請求額・次回請求額・日割り」を必ず表示する。</li><li>ダウングレードでは失う機能を列挙して確認を取る。</li></ul>
<p>実装例: <a href="#/templates/billing">Billing template</a></p>`},
'team-invitation-flow':{t:'Team Invitation Flow',d:'招待は非同期。送信後の Pending 状態を一覧で管理できるようにする。',body:()=>`
${h2('構成')}
<ul class="plain"><li>Invite Member Dialog: メール(複数可)+ロール+説明。</li><li>送信後: Pending invites 一覧に即時反映。再送・取消を提供。</li><li>期限切れは自動で失効し、状態を Badge で表示する。</li></ul>
<p>実装例: <a href="#/templates/team-management">Team Management template</a></p>`},
};
for(const[pid,p]of Object.entries(PATTERNS)){
  docPage('patterns/'+pid,()=>shell(`${head('Patterns',p.t,p.d)}${p.body()}`));
}

