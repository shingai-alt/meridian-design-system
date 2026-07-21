#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const registrySource = readFileSync(join(root, 'js/components-registry.js'), 'utf8');
const sandbox = { esc: (value) => String(value ?? '') };
const components = vm.runInNewContext(`${registrySource}\n;COMPONENTS;`, sandbox);
const componentTokenSource = JSON.parse(readFileSync(join(root, 'tokens/src/component.json'), 'utf8'));

function semanticCssName(name) {
  return `--${name.replace('foreground', 'fg').replace('background', 'bg')}`;
}

function collectComponentTokens(node, result = new Map()) {
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith('$')) continue;
    if (value && typeof value === 'object' && Object.hasOwn(value, '$value')) {
      const metadata = value.$extensions?.['com.meridian'];
      if (!metadata?.cssVariable) continue;
      const alias = typeof value.$value === 'string' ? /^\{color\.semantic\.([^}]+)\}$/.exec(value.$value) : null;
      result.set(metadata.cssVariable, { alias: alias ? semanticCssName(alias[1]) : null, trigger: metadata.trigger, reason: metadata.reason });
    } else if (value && typeof value === 'object') collectComponentTokens(value, result);
  }
  return result;
}

const componentTokens = collectComponentTokens(componentTokenSource);

const boundaries = {
  'input-group': ['単位・prefix・補助actionを1つの入力境界として扱うとき。', '独立した複数入力を横並びにするだけの場合はForm Fieldを個別に使う。'],
  'form-field': ['Label、control、helpまたはerrorを1つの入力責務として関連付けるとき。', '表示だけのlabel/value対にはDescription Listを使う。'],
  'top-bar': ['画面横断の現在地、検索、通知、account操作を常設するとき。', 'ページ固有actionだけを置く領域にはPage headerを使う。'],
  'navigation-item': ['Sidebarや永続navigation内で現在地と遷移先を示すとき。', '本文中の単独遷移にはLink、状態切替にはButtonを使う。'],
  'product-switcher': ['複数productまたはworkspaceを同じaccount文脈で切り替えるとき。', '選択肢が1つ、または権限変更を伴う場合には表示しない。'],
  'status-indicator': ['稼働、接続、実行など短いresource状態を反復表示するとき。', '説明や回復actionが必要な状態にはAlertを使う。'],
  list: ['主情報と少量のmetadataを縦方向に走査するとき。', '列比較が必要ならTable、独立した面の比較ならCard gridを使う。'],
  card: ['1つの対象に属する情報と任意のactionを同じ面にまとめるとき。', '単なるsection区切りには余白と見出しを使い、不要な面を増やさない。'],
  'stat-card': ['単一指標と短い比較値を一覧で走査するとき。', 'trendや期間操作を含む主要KPIにはKPI Cardを使う。'],
  timeline: ['監査、deploy、変更履歴を時系列の出来事として読むとき。', '人物の行動が主語ならActivity Feed、処理stepならExecution Timelineを使う。'],
  'activity-feed': ['誰が何をいつ行ったかを連続して確認するとき。', 'system event中心の監査履歴にはTimelineを使う。'],
  'description-list': ['1つの対象の属性をkey/valueで参照するとき。', '複数対象を列比較する場合はTableを使う。'],
  'code-block': ['複数行codeを読み、選択またはcopyするとき。', '短いcommandやtoken名にはinline codeを使う。'],
  'key-value-row': ['Description List内で1組のlabel/valueを構成するとき。', '単独で意味のあるsectionや編集可能fieldには使わない。'],
  'chat-message': ['会話履歴内でuser、assistant、systemの発話を区別するとき。', '採用判断を伴う構造化提案にはAI Response Cardを使う。'],
  'ai-response-card': ['AI提案を確認し、適用・編集・破棄から判断するとき。', '通常の会話応答や確定済みsystem結果には使わない。'],
  'agent-status': ['agent全体の現在状態と停止・再試行actionを示すとき。', '個別stepの履歴にはExecution Timelineを使う。'],
  'run-log': ['長時間処理の逐次logを時刻・level付きで確認するとき。', '要約だけで十分な進捗にはProgressやAgent Statusを使う。'],
  'code-diff': ['変更前後のcodeを行単位でreviewするとき。', '完成したcodeの参照にはCode Blockを使う。'],
  'file-tree': ['階層fileを展開し、選択や変更状態を確認するとき。', 'flatな少数fileにはListを使う。'],
  'model-selector': ['複数AI modelの特性を比較して実行contextを選ぶとき。', 'modelが固定の体験では選択UIを表示しない。'],
  'usage-meter': ['quotaの現在値、上限、接近状態を常時確認するとき。', '1回の処理進捗にはProgressを使う。'],
  'workflow-step': ['順序のある少数stepの現在位置と結果を示すとき。', '時刻やtool入出力まで確認する場合はExecution Timelineを使う。'],
  'execution-timeline': ['agent処理をstep、所要時間、tool入出力で監査するとき。', '人の活動履歴にはActivity Feedを使う。'],
  'kpi-card': ['期間、trend、比較を伴う主要business指標をdashboardで読むとき。', '単一の補助数値だけならStat Cardを使う。'],
  'analytics-chart-container': ['chartにtitle、期間、legend、状態、menuを共通付与するとき。', '単一数値にはKPI Card、表形式比較にはTableを使う。'],
  'settings-panel': ['同じ目的の設定を説明付きの行としてまとめるとき。', '独立した短い設定1件だけならForm Fieldを直接使う。'],
  'billing-plan-card': ['料金planの価格、機能差、現在状態、CTAを比較するとき。', '請求履歴や支払方法の表示にはTableやSettings Panelを使う。'],
  'user-menu': ['account情報とaccount横断actionをTop Barから開くとき。', '主要navigationを格納する代替にはしない。'],
  'notification-center': ['複数通知を未読状態と遷移先付きで確認するとき。', '単発の操作結果にはToastを使う。'],
  'invite-member-dialog': ['emailとroleを指定してmember招待を完結するとき。', '多数memberの一括管理には専用pageを使う。'],
  'project-card': ['projectの状態、member、更新時刻をgridで比較するとき。', '列ごとの精密比較にはTableを使う。'],
  'issue-row': ['issue一覧でID、title、priority、status、assigneeを高密度に走査するとき。', '詳細編集や長い説明には専用detail viewを使う。'],
  'task-board-card': ['kanban列内でtaskを要約し、dragまたはkeyboardで移動するとき。', '列比較や大量走査にはTableを使う。'],
  'integration-card': ['外部integrationの接続状態と次actionをcatalogで比較するとき。', '接続後の詳細設定にはSettings Panelを使う。'],
};

const usageFallbacks = {
  slider: ['現在値を常に表示し、精密入力が必要ならnumber fieldを併設する。', 'Arrow key、Home、Endで同じ範囲を操作できるようにする。'],
  'key-value-row': ['Keyは短く一定幅にし、Valueは折り返しとcopyを許可する。', 'Actionがある場合もValueの読み上げ順を壊さない。'],
};

const profileSets = {
  action: new Set(['button', 'icon-button', 'link', 'tag']),
  input: new Set(['text-field', 'textarea', 'search-field', 'input-group', 'prompt-input']),
  selection: new Set(['select', 'combobox', 'checkbox', 'radio', 'switch', 'slider', 'date-picker', 'segmented-control', 'model-selector']),
  overlay: new Set(['tooltip', 'command-menu', 'product-switcher', 'dialog', 'drawer', 'popover', 'user-menu', 'notification-center', 'invite-member-dialog']),
  navigation: new Set(['sidebar', 'top-bar', 'breadcrumb', 'tabs', 'pagination', 'navigation-item']),
  feedback: new Set(['empty-state', 'validation-message', 'toast', 'alert', 'banner', 'status-indicator']),
  progress: new Set(['spinner', 'skeleton', 'progress', 'agent-status', 'usage-meter', 'workflow-step', 'execution-timeline']),
  collection: new Set(['table', 'data-grid', 'list', 'timeline', 'activity-feed', 'description-list', 'key-value-row', 'run-log', 'code-diff', 'file-tree', 'chat-message', 'issue-row']),
  container: new Set(['card', 'stat-card', 'code-block', 'ai-response-card', 'kpi-card', 'analytics-chart-container', 'settings-panel', 'billing-plan-card', 'project-card', 'task-board-card', 'integration-card']),
};

function profileFor(id) {
  for (const [profile, ids] of Object.entries(profileSets)) if (ids.has(id)) return profile;
  return 'presentational';
}

const anatomyByProfile = {
  action: [['root', true, 'Native interactive root or navigation target.'], ['label', true, 'Predictable accessible action or destination name.'], ['icon', false, 'Meaning reinforcement; decorative icons stay hidden from assistive technology.']],
  input: [['root', true, 'Control boundary and focus indicator.'], ['control', true, 'Native input or textarea that owns the value.'], ['adornment', false, 'Prefix, suffix, clear, attachment, or submit action.'], ['message', false, 'Help, count, loading, or validation feedback.']],
  selection: [['root', true, 'Selection control boundary.'], ['value', true, 'Current value or selected option.'], ['indicator', true, 'Selection, thumb, check, or disclosure indicator.'], ['popup', false, 'Option list or calendar when the pattern opens one.']],
  overlay: [['surface', true, 'Floating or modal surface.'], ['header', false, 'Title and context.'], ['content', true, 'Information or controls owned by the surface.'], ['actions', false, 'Confirmation, navigation, or dismiss controls.'], ['trigger', false, 'Element that opens the surface and receives restored focus.']],
  navigation: [['root', true, 'Navigation landmark or grouped navigation container.'], ['item', true, 'Destination or view selector.'], ['current-indicator', false, 'Non-color cue for the current location or selection.'], ['metadata', false, 'Count, icon, or supporting context.']],
  feedback: [['root', true, 'Status message boundary.'], ['indicator', false, 'Icon or shape that reinforces tone.'], ['message', true, 'Concise status and recovery guidance.'], ['action', false, 'Recovery, undo, or dismiss control.']],
  progress: [['root', true, 'Progress or execution status boundary.'], ['indicator', true, 'Current state, track, or active step.'], ['label', true, 'Accessible status text.'], ['value', false, 'Numeric progress, duration, or quota.'], ['action', false, 'Stop, retry, or inspect action.']],
  collection: [['root', true, 'Collection container with an explicit reading order.'], ['item', true, 'Repeated row, event, node, message, or entry.'], ['primary-content', true, 'Main scannable value.'], ['metadata', false, 'Secondary state, time, owner, or count.'], ['actions', false, 'Item-level operations with independent names.']],
  container: [['root', true, 'Bounded information or task container.'], ['header', false, 'Title, summary, and context controls.'], ['content', true, 'Primary values or composed components.'], ['footer', false, 'Secondary metadata or actions.']],
  presentational: [['root', true, 'Semantic display root.'], ['content', true, 'Primary perceivable content.'], ['supporting', false, 'Optional metadata or visual reinforcement.']],
};

const responsiveStrategy = {
  overlay: new Set(['dialog', 'drawer', 'command-menu', 'notification-center', 'invite-member-dialog']),
  anchored: new Set(['tooltip', 'popover', 'product-switcher', 'user-menu', 'date-picker', 'model-selector']),
  horizontal: new Set(['tabs', 'segmented-control', 'table', 'data-grid', 'code-block', 'code-diff']),
  shell: new Set(['sidebar', 'top-bar']),
  dense: new Set(['list', 'timeline', 'activity-feed', 'description-list', 'run-log', 'file-tree', 'issue-row', 'task-board-card']),
  stack: new Set(['card', 'stat-card', 'empty-state', 'alert', 'banner', 'ai-response-card', 'kpi-card', 'analytics-chart-container', 'settings-panel', 'billing-plan-card', 'project-card', 'integration-card']),
};

function strategyFor(id, profile) {
  for (const [strategy, ids] of Object.entries(responsiveStrategy)) if (ids.has(id)) return strategy;
  if (['input', 'selection', 'action'].includes(profile)) return 'inline';
  return 'intrinsic';
}

function responsiveFor(component, strategy, interactive) {
  const name = component.name;
  const touch = interactive
    ? ['Pointer targetは24px minimumを満たし、touch中心の主要操作は原則44px以上にする。', 'Hoverだけに情報や操作を依存させず、連打とdragには同等の非gesture操作を用意する。']
    : ['表示専用rootをtab順へ追加しない。', '内包する操作がある場合だけ、その操作targetを24px minimum、主要touch操作を原則44px以上にする。'];
  const modes = {
    overlay: {
      desktop: [`${name}は内容に応じたmax-widthを持ち、背景文脈を保つ。`, 'Focusをsurface内で管理し、閉じたらtriggerへ戻す。'],
      mobile: ['Viewportに収まらない固定幅を使わず、必要に応じてfull-screenまたはbottom-aligned presentationへ切り替える。', 'Safe areaとsoftware keyboardを考慮し、primary actionを見失わせない。'],
    },
    anchored: {
      desktop: ['Triggerへ位置付け、viewport端ではplacementを反転またはshiftする。', 'Pointerとkeyboardの両方で同じ内容へ到達できる。'],
      mobile: ['Hover起点を使わずtapまたはfocusで開き、狭い幅ではsheet presentationを選べる。', 'Triggerとsurfaceを同時に画面外へ追い出さない。'],
    },
    horizontal: {
      desktop: ['列・項目の比較可能性を保ち、必要な幅を確保する。', 'Keyboard focusと選択状態をscroll位置から失わない。'],
      mobile: ['意味のある列や項目を潰さず、横scroll、優先列、detail viewのいずれかを明示的に選ぶ。', 'Scroll領域の外にも現在位置や操作の手掛かりを残す。'],
    },
    shell: {
      desktop: ['恒常navigationとして固定領域を使い、main contentを覆わない。', 'Collapsed stateでもlabelへ到達できる。'],
      mobile: ['同じnavigation contractをDrawerまたはcompact barで提示し、別component APIへ分岐しない。', '開閉controlと現在地を常に認識できるようにする。'],
    },
    dense: {
      desktop: ['CompactまたはDefault densityで走査性を優先し、metadataとactionの列を安定させる。', 'Hover actionはfocusでも表示する。'],
      mobile: ['主情報を先にしてmetadataを折り返し、非表示情報にはdetail viewから到達できるようにする。', '行全体clickだけに依存せず明示的なtargetを残す。'],
    },
    stack: {
      desktop: ['Gridまたはsectionのreading orderに沿って配置し、同種itemの寸法を揃える。', '面の入れ子を増やさない。'],
      mobile: ['1列へreflowし、heading、content、actionの順序を保つ。', 'Actionが複数ある場合は縦積みまたはmenuへ整理する。'],
    },
    inline: {
      desktop: ['周辺layoutに応じたintrinsic widthを基本にし、formではlabelとの整列を保つ。', 'Keyboard focusとhoverを別々に確認する。'],
      mobile: ['Form文脈では利用可能幅まで広げ、複数controlを無理に横へ詰めない。', '同じpropとstate contractを維持する。'],
    },
    intrinsic: {
      desktop: ['Contentと周辺layoutに応じたintrinsic sizeを使う。', 'Viewportだけを理由にdensityを変更しない。'],
      mobile: ['意味とDOM順を変えず、wrapとavailable widthで適応する。', '省略した情報へ別経路から到達できるようにする。'],
    },
  };
  const selected = modes[strategy];
  return {
    desktop: { summary: `Desktopでの${name}。`, rules: selected.desktop, avoid: ['Hoverだけで状態や操作を伝えない。'] },
    mobile: { summary: `Mobileでの${name}。`, rules: selected.mobile, avoid: ['PC用とSP用に意味やAPIの異なるcomponentを複製しない。'] },
    touch: { summary: `Touch入力での${name}。`, rules: touch, avoid: ['小さな隣接targetやgestureだけの操作を作らない。'] },
  };
}

const keyboard = {
  button: [['Enter / Space', 'Actionを実行する。']],
  'icon-button': [['Enter / Space', 'Actionを実行する。']],
  link: [['Enter', 'リンク先へ移動する。']],
  tag: [['Delete / Backspace', '削除可能なTagを解除する。']],
  tooltip: [['Escape', 'Tooltipを閉じてtriggerへfocusを保つ。']],
  select: [['Arrow Up / Down', 'Optionを移動する。'], ['Enter / Space', 'Optionを選択する。'], ['Escape', '選択を変えずに閉じる。']],
  combobox: [['Arrow Up / Down', 'Popup optionを移動する。'], ['Enter', 'Active optionを選択する。'], ['Escape', 'Popupを閉じる。']],
  checkbox: [['Space', 'Checked stateを切り替える。']],
  radio: [['Arrow keys', 'Radio group内の選択を移動する。'], ['Space', 'Focused optionを選択する。']],
  switch: [['Space', 'On / Offを切り替える。']],
  slider: [['Arrow keys', 'Step単位で値を変更する。'], ['Home / End', '最小値 / 最大値へ移動する。']],
  'date-picker': [['Arrow keys', 'Calendar内の日付を移動する。'], ['Enter / Space', '日付を選択する。'], ['Escape', 'Calendarを閉じる。']],
  'search-field': [['Escape', '検索語をclearするか、空ならfocusを維持する。']],
  tabs: [['Arrow Left / Right', 'Tab間を移動する。'], ['Home / End', '最初 / 最後のTabへ移動する。']],
  'segmented-control': [['Arrow keys', '選択肢を移動して選択する。']],
  'command-menu': [['Arrow Up / Down', 'Commandを移動する。'], ['Enter', 'Active commandを実行する。'], ['Escape', '閉じて呼び出し元へfocusを戻す。']],
  dialog: [['Tab / Shift+Tab', 'Dialog内でfocusを循環する。'], ['Escape', 'Dismiss可能なDialogを閉じる。']],
  drawer: [['Escape', 'Drawerを閉じてtriggerへfocusを戻す。']],
  popover: [['Escape', 'Popoverを閉じてtriggerへfocusを戻す。']],
  'data-grid': [['Arrow keys', 'Grid cell間を移動する。'], ['Home / End', '行またはgrid端へ移動する。'], ['Enter / F2', '編集可能cellの編集を開始する。']],
  'file-tree': [['Arrow Up / Down', 'Visible nodeを移動する。'], ['Arrow Right / Left', 'Nodeを展開 / 折りたたむ。'], ['Enter', 'Focused fileを開く。']],
  'product-switcher': [['Arrow Up / Down', 'Product optionを移動する。'], ['Enter', 'Productを切り替える。'], ['Escape', 'Menuを閉じる。']],
  'user-menu': [['Arrow Up / Down', 'Menu itemを移動する。'], ['Enter', 'Focused itemを実行する。'], ['Escape', 'Menuを閉じる。']],
  'model-selector': [['Arrow Up / Down', 'Model optionを移動する。'], ['Enter', 'Modelを選択する。'], ['Escape', 'Menuを閉じる。']],
  'prompt-input': [['Command / Ctrl + Enter', 'Promptを送信する。'], ['Escape', '生成中なら停止actionへ移動またはpopupを閉じる。']],
};

const semantics = {
  button: ['Native <button>を使う。'],
  'icon-button': ['Native <button>と必須のaria-labelを使う。'],
  link: ['Navigationにはhrefを持つ<a>を使う。'],
  text: ['Content hierarchyに合うnative heading、paragraph、spanを選ぶ。'],
  divider: ['意味のある区切りは<hr>またはrole="separator"を使い、装飾線はaria-hiddenにする。'],
  tooltip: ['Surfaceにrole="tooltip"、triggerにaria-describedbyを使う。'],
  spinner: ['Loading containerへaria-busy、status textへrole="status"を使う。'],
  skeleton: ['Skeleton自体はaria-hiddenにし、containerのloading stateを別に伝える。'],
  'text-field': ['Native <input>をlabelとdescription/errorへ関連付ける。'],
  textarea: ['Native <textarea>をlabelとcounterへ関連付ける。'],
  select: ['要件を満たせる場合はnative <select>を優先する。'],
  combobox: ['role="combobox"、aria-expanded、aria-controls、active option関係を同期する。'],
  checkbox: ['Native checkboxをlabelと関連付け、mixed stateを必要時だけ使う。'],
  radio: ['Native radio groupまたはradiogroup semanticsを使う。'],
  switch: ['role="switch"または同等native controlとaria-checkedを同期する。'],
  slider: ['Native rangeまたはrole="slider"と現在値・範囲を公開する。'],
  tabs: ['tablist、tab、tabpanelの関係と選択状態を公開する。'],
  dialog: ['role="dialog"、aria-modal、accessible titleを持ち、focusを管理する。'],
  alert: ['Urgentで自動提示される内容だけrole="alert"を使う。'],
  'data-grid': ['Interactive cell navigationがある場合だけgrid semanticsを使う。'],
  table: ['Static comparisonはnative table、caption、header relationを使う。'],
  'file-tree': ['Interactive hierarchyはtree / treeitem semanticsとexpanded stateを同期する。'],
};

const profileTokens = {
  action: ['--surface', '--surface-muted', '--fg', '--fg-disabled', '--border', '--border-strong', '--primary', '--primary-hover', '--primary-active', '--primary-fg', '--focus-ring', '--ctl-md', '--sp-2', '--radius-sm', '--dur-fast'],
  input: ['--input-bg', '--input-border', '--input-border-focus', '--input-placeholder', '--fg', '--fg-muted', '--fg-disabled', '--danger', '--focus-ring', '--ctl-md', '--input-x', '--radius-sm', '--dur-fast'],
  selection: ['--surface', '--surface-muted', '--fg', '--fg-muted', '--border', '--border-strong', '--primary', '--primary-subtle', '--focus-ring', '--ctl-md', '--sp-2', '--radius-sm', '--dur-fast'],
  overlay: ['--surface-overlay', '--fg', '--fg-muted', '--border', '--overlay', '--shadow-overlay', '--focus-ring', '--sp-4', '--radius-md', '--dur-normal'],
  navigation: ['--surface', '--surface-muted', '--fg', '--fg-muted', '--border', '--primary', '--primary-subtle', '--focus-ring', '--ctl-md', '--sp-2', '--dur-fast'],
  feedback: ['--surface', '--fg', '--fg-muted', '--border', '--info-subtle', '--info-fg', '--success-subtle', '--success-fg', '--warning-subtle', '--warning-fg', '--danger-subtle', '--danger-fg', '--sp-3', '--radius-md'],
  progress: ['--surface-muted', '--fg', '--fg-muted', '--primary', '--success', '--warning', '--danger', '--sp-2', '--radius-full', '--dur-normal'],
  collection: ['--surface', '--surface-muted', '--fg', '--fg-muted', '--border', '--border-muted', '--table-row-hover', '--row-h', '--cell-y', '--focus-ring'],
  container: ['--surface', '--fg', '--fg-muted', '--border', '--card-pad', '--sp-4', '--radius-md'],
  presentational: ['--fg', '--fg-muted', '--surface', '--border'],
};

function unique(values) { return [...new Set(values.filter(Boolean))]; }
function profileTokensFor(component, profile) {
  const tokens = unique([...(component.tokens ?? []), ...profileTokens[profile]]);
  if (component.sizes?.length) tokens.push(...component.sizes.map((size) => `--ctl-${size}`), '--text-label', '--sp-2');
  return unique(tokens);
}

function groupTokens(tokens) {
  const groups = { semanticColor: [], density: [], spacing: [], radius: [], motion: [], shadow: [], layout: [] };
  for (const token of tokens) {
    if (/^--sp-/.test(token)) groups.spacing.push(token);
    else if (/^--radius-/.test(token)) groups.radius.push(token);
    else if (/^--(?:dur|ease|motion-distance)-/.test(token)) groups.motion.push(token);
    else if (/^--shadow-/.test(token)) groups.shadow.push(token);
    else if (/^--(?:ctl|text|row-h|cell-y|card-pad|gap-form|input-x)/.test(token)) groups.density.push(token);
    else if (/^--(?:sidebar-w|topbar-h|content-|reading-|toc-w|page-pad|section-gap|dialog-w|drawer-w|command-w)/.test(token)) groups.layout.push(token);
    else groups.semanticColor.push(token);
  }
  return Object.fromEntries(Object.entries(groups).filter(([, values]) => values.length));
}

function stateDescription(state) {
  const descriptions = {
    default: '通常状態。意味、label、valueを省略しない。', hover: 'Pointer hoverの補助変化。意味をhoverだけに依存させない。', active: '押下または実行中の瞬間的feedback。', focus: 'focus-visibleで明確なringを表示する。', disabled: '操作不能である理由を周辺文脈から理解できるようにする。', readonly: '値を参照・選択できるが変更できない。', loading: 'Accessible nameを維持し、二重実行を防ぐ。', error: '色だけでなくmessageとaria stateで問題を伝える。', checked: '選択状態をvisualとprogrammatic stateの両方で同期する。', open: 'Popupまたはsurfaceの表示とexpanded stateを同期する。', selected: '選択状態を色以外のcueでも示す。', empty: 'データがない理由と次のactionを示す。', running: '現在進行中であることと停止手段を示す。', setup: '設定未完了と次stepを示す。', connected: '接続済み状態と管理actionを示す。', none: '未接続状態と開始actionを示す。',
  };
  return descriptions[state] ?? `${state}の意味をlabelとprogrammatic stateで同期する。`;
}

function variantIntent(variant) {
  const intents = {
    primary: '主要actionまたは最優先の選択。', secondary: '主要actionを補助する標準表現。', tertiary: '低い優先度のaction。', ghost: '面を増やさない補助action。', outline: '境界を保つ中立action。', danger: '破壊的または回復困難な操作・状態。', success: '完了または肯定的状態。', warning: '注意と判断が必要な状態。', info: '中立的な補足情報。', default: '標準文脈。', user: 'Userの入力。', assistant: 'AI assistantの応答。', system: 'Systemが生成した状態通知。',
  };
  return intents[variant] ?? `${variant}という明示的な意味を持つ文脈。`;
}

function propsFor(component, profile) {
  const props = [];
  if (component.variants?.length) props.push({ name: 'variant', type: component.variants.map((v) => `"${v}"`).join(' | '), required: false, default: component.variants[0], description: '意味と優先度を選ぶ。' });
  if (component.sizes?.length) props.push({ name: 'size', type: component.sizes.map((v) => `"${v}"`).join(' | '), required: false, default: component.sizes.includes('md') ? 'md' : component.sizes[0], description: 'Density内の相対sizeを選ぶ。' });
  if (['input', 'selection'].includes(profile)) {
    props.push({ name: 'value', type: 'unknown', required: false, default: null, description: 'Controlled value。' });
    props.push({ name: 'onChange', type: '(value) => void', required: false, default: null, description: 'User操作で値が変わるときに通知する。' });
  }
  if (profile === 'overlay') {
    props.push({ name: 'open', type: 'boolean', required: false, default: null, description: 'Controlled open state。' });
    props.push({ name: 'onOpenChange', type: '(open: boolean) => void', required: false, default: null, description: 'Open state変更を通知する。' });
  }
  if ((component.states ?? []).includes('disabled')) props.push({ name: 'disabled', type: 'boolean', required: false, default: 'false', description: '操作不能state。' });
  if ((component.states ?? []).includes('loading')) props.push({ name: 'loading', type: 'boolean', required: false, default: 'false', description: '進行中stateと二重実行防止。' });
  for (const [name, label] of component.texts ?? []) props.push({ name, type: 'string', required: false, default: null, description: label });
  for (const [name, label] of component.flags ?? []) props.push({ name, type: 'boolean', required: false, default: 'false', description: label });
  if (!props.length) props.push({ name: 'children', type: 'ReactNode', required: true, default: null, description: 'Componentの主要content。' });
  return uniqueBy(props, (prop) => prop.name);
}

function uniqueBy(values, key) {
  const seen = new Set();
  return values.filter((value) => { const id = key(value); if (seen.has(id)) return false; seen.add(id); return true; });
}

function codeFor(component) {
  const defaults = { variant: component.variants?.[0], size: component.sizes?.includes('md') ? 'md' : component.sizes?.[0], state: 'default' };
  for (const [key, , value] of component.texts ?? []) defaults[key] = value;
  try { return component.code(defaults); } catch { return `<${component.name.replaceAll(' ', '')} />`; }
}

function accessibilityFor(component, profile, interactive) {
  const existing = (component.a11y ?? []).filter((item) => !item.startsWith('ロールと accessible name') && !item.startsWith('フォーカス可視化'));
  const requirements = unique([
    ...existing,
    interactive ? 'Keyboardとpointerで同じ機能を実行できる。' : '表示専用rootを不要にtab順へ追加しない。',
    interactive ? 'Focus indicatorを常に視認でき、sticky layerで完全に隠さない。' : '状態は色だけで表さずtext、icon、shapeを併用する。',
    interactive ? 'Targetは24px minimumを満たし、主要touch操作は原則44px以上にする。' : null,
  ]);
  return {
    requirements,
    aria: semantics[component.id] ?? ['Native semanticsを優先し、ARIAは不足する関係と状態だけを補う。'],
    focus: interactive ? ['focus-visibleで--focus-ringを使う。', 'Positive tabindexを使わず、DOMとvisualの順序を一致させる。'] : ['Nested controlがある場合だけ、そのcontrolがfocusを受け取る。'],
  };
}

function makeContract(component) {
  const profile = profileFor(component.id);
  const interactive = ['action', 'input', 'selection', 'overlay', 'navigation'].includes(profile) || ['data-grid', 'file-tree', 'prompt-input', 'task-board-card'].includes(component.id);
  const strategy = strategyFor(component.id, profile);
  const fallback = boundaries[component.id];
  const whenToUse = component.when?.length ? component.when : [fallback?.[0] ?? `${component.name}の責務が画面内で繰り返し必要なとき。`];
  const whenNotToUse = component.notWhen?.length ? component.notWhen : [fallback?.[1] ?? `同じ目的をより単純なnative elementまたは既存componentで満たせるとき。`];
  const usage = component.usage?.length ? component.usage : (usageFallbacks[component.id] ?? [`${component.name}の主情報と状態を最初に理解できる順序で配置する。`]);
  const tokens = unique(profileTokensFor(component, profile).flatMap((token) => [token, componentTokens.get(token)?.alias]));
  const tokenRefs = groupTokens(tokens);
  const states = (component.states?.length ? component.states : ['default']).map((state) => ({ id: state, description: stateDescription(state), requiredBehavior: [stateDescription(state)] }));
  const variants = Object.fromEntries((component.variants?.length ? component.variants : ['default']).map((variant) => [variant, { intent: variantIntent(variant), tokenRefs: {}, states: {} }]));
  const sizes = Object.fromEntries((component.sizes ?? []).map((size) => [size, { controlHeight: `--ctl-${size}`, paddingInline: ['--sp-2', '--sp-2'], gap: '--sp-2', textToken: '--text-label', iconSize: size === 'xs' ? '12' : size === 'sm' ? '14' : size === 'lg' ? '18' : size === 'xl' ? '20' : '16' }]));
  const bindings = tokens.map((token) => {
    const metadata = componentTokens.get(token);
    if (!metadata) return { slot: `token.${token.slice(2)}.value`, source: token, scope: 'semantic', componentToken: null, aliases: null, trigger: null, reason: `${component.name}の公開visual contractで用途tokenとして共有する。` };
    return { slot: `token.${token.slice(2)}.value`, source: token, scope: 'component', componentToken: token, aliases: metadata.alias, trigger: metadata.trigger, reason: metadata.reason };
  });
  const usagePatterns = whenToUse.slice(0, 2).map((description, index) => ({ id: `recommended-${index + 1}`, title: index === 0 ? 'Primary context' : 'Secondary context', description, recommended: [usage[index] ?? usage[0]], avoid: [whenNotToUse[index] ?? whenNotToUse[0]] }));
  return {
    '$schema': '../../../schemas/component-contract.schema.json', schemaVersion: '0.1.0', id: component.id, name: component.name, status: 'draft', category: component.group.toLowerCase(), description: component.desc,
    source: { humanDoc: `components/${component.id}.md`, registry: `js/components-registry.js#${component.id}` },
    intent: { whenToUse, whenNotToUse, principles: [1, 2, 3, 5, 6] },
    anatomy: anatomyByProfile[profile].map(([part, required, description]) => ({ part, required, description })),
    variants, sizes, states, props: propsFor(component, profile), tokenRefs,
    tokenBindings: { coverage: 'partial', bindings, unboundSlots: [{ slot: 'implementation.visual-state-audit', reason: 'React package実装時にDOM、state selector、全visual slotの最終bindingを照合する。', owner: `components.${component.id}` }] },
    accessibility: accessibilityFor(component, profile, interactive),
    keyboardInteractions: (keyboard[component.id] ?? (interactive ? [['Tab', '順序どおりにfocusを移動する。']] : [])).map(([key, action]) => ({ key, action })),
    usagePatterns, responsiveBehavior: responsiveFor(component, strategy, interactive),
    rules: unique(['NO_RAW_HEX_COLOR', 'SPACING_FROM_TOKENS_ONLY', 'RADIUS_FROM_TOKENS_ONLY', 'CONTRAST_AA_MINIMUM', interactive ? 'FOCUS_VISIBLE_REQUIRED' : null, interactive ? 'NO_POSITIVE_TABINDEX' : null, interactive ? 'TARGET_SIZE_MINIMUM' : null, interactive ? 'INTERACTIVE_NAME_REQUIRED' : null, component.id === 'task-board-card' ? 'DRAG_ALTERNATIVE_REQUIRED' : null, ['feedback', 'progress'].includes(profile) ? 'STATE_NOT_COLOR_ONLY' : null]),
    qualityChecks: ['When to use / not useの境界が明確', 'PC / SP / touchで同じsemantic contractを維持', '公開tokenだけを参照', 'Keyboardとaccessible nameを検証', 'Light / Dark × Standard / Highと3 densityで確認'],
    examples: [{ id: 'default', description: `${component.name}の標準例。`, code: codeFor(component) }],
    openQuestions: ['React package実装時にDOM/ref/event APIと全visual slot bindingを確定し、coverage completeでstableへ移行する。'],
    _doc: { profile, strategy, interactive, usage },
  };
}

function renderList(items) { return items.map((item) => `- ${item}`).join('\n'); }
function renderMd(component, contract) {
  const doc = contract._doc;
  const variants = Object.entries(contract.variants).map(([name, value]) => `| \`${name}\` | ${value.intent} | 意味を変えずに見た目だけを増やさない。 |`).join('\n');
  const sizes = Object.entries(contract.sizes);
  const sizeRows = sizes.length ? sizes.map(([name, value]) => `| \`${name}\` | \`${value.controlHeight}\` | ${name === 'md' ? '標準文脈。' : '周辺密度とtask priorityに合わせる。'} |`).join('\n') : '| Dedicated size propなし | Density token | 周辺layoutのdensityに従う。 |';
  const anatomy = contract.anatomy.map((part) => `| ${part.part} | ${part.required ? 'Yes' : 'No'} | ${part.description} |`).join('\n');
  const states = contract.states.map((state) => `| \`${state.id}\` | ${state.description} |`).join('\n');
  const tokenLines = Object.entries(contract.tokenRefs).map(([group, values]) => `- ${group}: ${values.map((value) => `\`${value}\``).join(', ')}`).join('\n');
  const bindingRows = contract.tokenBindings.bindings.map((binding) => `| \`${binding.slot}\` | \`${binding.source}\` | \`${binding.scope}\` | - | ${binding.reason} |`).join('\n');
  const keys = contract.keyboardInteractions.length ? contract.keyboardInteractions.map((item) => `- \`${item.key}\`: ${item.action}`).join('\n') : '- Component root固有のkeyboard interactionは持たない。Nested controlは各componentのcontractに従う。';
  const example = contract.examples[0].code;
  return `# ${component.name}\n\n## Summary\n\n${component.desc}\n\nMachine-readable contract: \`design/contracts/components/${component.id}.contract.json\`\n\n## Role\n\n${component.group}領域で${component.name}の責務を1か所にまとめ、類似componentとの選択境界を固定します。PC用とSP用に別componentを作らず、同じ意味とAPIをlayout、viewport、input methodへ適応させます。\n\n## Principles\n\n- Taskの主目的と現在状態を最短で理解できること。\n- Native semanticsまたは確立したARIA patternを優先すること。\n- Semantic tokenを基本とし、Component tokenはpolicy triggerがある場合だけ追加すること。\n\n## When To Use\n\n${renderList(contract.intent.whenToUse)}\n\n## When Not To Use\n\n${renderList(contract.intent.whenNotToUse)}\n\n## Visual Model\n\n${anatomyByProfile[doc.profile][0][2]} Surface、border、type、spacingの強弱は内容の階層を支え、装飾のためだけにcard、shadow、accentを追加しません。状態は色だけでなくlabel、icon、shape、positionを組み合わせます。\n\n## Anatomy\n\n| Part | Required | Description |\n|---|---:|---|\n${anatomy}\n\n## Variants\n\n| Variant | Use | Notes |\n|---|---|---|\n${variants}\n\n## Sizes / Density\n\n| Size | Token | Typical use |\n|---|---|---|\n${sizeRows}\n\nCompact / Default / Comfortableはviewportではなく作業密度と入力方式で選び、componentの意味やprop集合は変えません。\n\n## Icon Rules\n\n${component.id.includes('icon') || ['feedback', 'progress', 'navigation'].includes(doc.profile) ? '意味を補強するiconはtext labelと併用し、装飾iconはassistive technologyから隠します。Icon-only actionには見えるtooltipとprogrammatic accessible nameを付けます。' : 'このcomponentは必須のicon slotを持ちません。追加する場合も情報をiconだけへ閉じ込めません。'}\n\n## States\n\n| State | Behavior |\n|---|---|\n${states}\n\n## Behavior\n\n${renderList(doc.usage)}\n\n- Controlled stateを提供する場合、visual stateとprogrammatic stateを同じeventで同期します。\n- 非同期actionでは二重実行を防ぎ、完了・失敗・中断を説明します。\n\n## Layout / Placement Rules\n\n### Recommended Pattern\n\n- Reading orderとfocus orderを一致させます。\n- 周辺componentとのspacingはtokenを使い、固定viewport値で内部寸法を変えません。\n- ${contract.responsiveBehavior.mobile.rules[0]}\n\n## Responsive / Viewport Behavior\n\n### Desktop\n\n${renderList(contract.responsiveBehavior.desktop.rules)}\n\n### Mobile\n\n${renderList(contract.responsiveBehavior.mobile.rules)}\n\n### Touch\n\n${renderList(contract.responsiveBehavior.touch.rules)}\n\n## Accessibility\n\n${renderList([...contract.accessibility.requirements, ...contract.accessibility.aria, ...contract.accessibility.focus])}\n\nKeyboard:\n\n${keys}\n\n## Content Guidelines\n\n- Labelは対象または結果を具体的に書き、状態だけを繰り返さない。\n- Errorは原因と修正方法、Emptyは何がないかと次の一歩を示す。\n- 省略するmetadataにも別経路から到達できるようにする。\n\n## Tokens\n\n${tokenLines}\n\nPrimitive color、raw hex、任意pxをcomponentから直接選びません。\n\n### Token Binding Decisions\n\n| Slot | Source | Scope | Trigger | Reason |\n|---|---|---|---|---|\n${bindingRows}\n\nCurrent coverage: \`partial\`。HTML showcaseを確認済みの仕様候補として記録し、React package実装時にDOM/state selectorまで結線して\`complete\`へ移行します。\n\n## Do / Don't\n\nDo:\n\n\`\`\`tsx\n${example}\n\`\`\`\n\nDon't:\n\n\`\`\`tsx\n{/* ${contract.intent.whenNotToUse[0]} */}\n<${component.name.replaceAll(' ', '')} />\n\`\`\`\n\n## Prohibited Patterns\n\n${renderList(contract.rules.map((rule) => `\`${rule}\`に反する実装。`))}\n\n## AI Selection Rules\n\nAIが選ぶ条件:\n\n${renderList(contract.intent.whenToUse)}\n\nAIが避ける条件:\n\n${renderList(contract.intent.whenNotToUse)}\n\nAIはvariantを意味、sizeをtask密度、stateを実際のsystem stateから選びます。Viewport名だけでvariantやcomponentを分岐しません。\n\n## Examples\n\n\`\`\`tsx\n${example}\n\`\`\`\n\n## Implementation Notes\n\n- React packageは今後追加します。現在はsemantic contract、HTML showcase、token binding候補を正本として扱います。\n- Native element、ref forwarding、controlled state、event名はpackage実装時にこのcontractへ同期します。\n\n## Open Questions\n\n${renderList(contract.openQuestions)}\n`;
}

let created = 0;
for (const component of components) {
  if (component.id === 'button') continue;
  const contract = makeContract(component);
  const doc = renderMd(component, contract);
  delete contract._doc;
  const mdPath = join(root, 'components', `${component.id}.md`);
  const contractPath = join(root, 'design/contracts/components', `${component.id}.contract.json`);
  if (!existsSync(mdPath)) { writeFileSync(mdPath, doc); created += 1; }
  if (!existsSync(contractPath)) { writeFileSync(contractPath, `${JSON.stringify(contract, null, 2)}\n`); created += 1; }
}

console.log(`Component specification bootstrap complete: ${created} files created.`);
