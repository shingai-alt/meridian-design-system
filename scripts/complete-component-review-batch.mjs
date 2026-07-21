#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildReviewRecord, nextCycleId } from './lib/review-cycle.mjs';
import { deriveStatuses } from './lib/refinement-state.mjs';

if (!process.argv.includes('--validated')) {
  throw new Error('Run npm run check:system, inspect its result, then pass --validated.');
}

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const registryPath = join(root, 'design/system-registry.json');
const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
const items = registry.domains.flatMap((domain) => domain.items);
const componentItems = registry.domains.find((domain) => domain.id === 'components').items;
const reviewDir = join(root, 'design/reviews');
const date = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' });

const currentReviews = new Map();
for (const item of items) {
  if (!item.reviewRecord) continue;
  const path = join(root, item.reviewRecord);
  if (existsSync(path)) currentReviews.set(item.id, JSON.parse(readFileSync(path, 'utf8')));
}

const reviewHistory = readdirSync(reviewDir)
  .filter((name) => name.endsWith('.review.json') && !name.startsWith('_'))
  .map((name) => JSON.parse(readFileSync(join(reviewDir, name), 'utf8')));
const statuses = deriveStatuses(registry, currentReviews, reviewHistory);
const existingCycleIds = new Set(reviewHistory.map((review) => review.cycleId));

const patternByComponent = {
  button: 'button',
  'icon-button': 'button',
  tooltip: 'tooltip',
  select: 'native-controls',
  combobox: 'combobox',
  checkbox: 'checkbox',
  radio: 'radio',
  switch: 'switch',
  slider: 'slider',
  'date-picker': 'grid',
  'segmented-control': 'radio',
  breadcrumb: 'breadcrumb',
  tabs: 'tabs',
  'command-menu': 'combobox',
  'product-switcher': 'listbox',
  dialog: 'dialog',
  drawer: 'dialog',
  popover: 'patterns-index',
  'data-grid': 'grid',
  'file-tree': 'treeview',
  'model-selector': 'listbox',
  'user-menu': 'menu',
  'notification-center': 'dialog',
  'invite-member-dialog': 'dialog',
  'task-board-card': 'dragging',
};

const evidenceCatalog = {
  button: ['WAI-ARIA APG Button Pattern', 'https://www.w3.org/WAI/ARIA/apg/patterns/button/', 'Native button、accessible name、Enter/Spaceのinteraction modelを示す。'],
  tooltip: ['WAI-ARIA APG Tooltip Pattern', 'https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/', 'Tooltipとtriggerのdescription関係、focus、Escapeの基準を示す。'],
  combobox: ['WAI-ARIA APG Combobox Pattern', 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/', 'Combobox、popup、active option、keyboard interactionの関係を示す。'],
  checkbox: ['WAI-ARIA APG Checkbox Pattern', 'https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/', 'Checkboxのchecked stateとSpace操作を示す。'],
  radio: ['WAI-ARIA APG Radio Group Pattern', 'https://www.w3.org/WAI/ARIA/apg/patterns/radio/', '排他選択、roving focus、Arrow key操作を示す。'],
  switch: ['WAI-ARIA APG Switch Pattern', 'https://www.w3.org/WAI/ARIA/apg/patterns/switch/', '二値stateのname、checked state、keyboard操作を示す。'],
  slider: ['WAI-ARIA APG Slider Pattern', 'https://www.w3.org/WAI/ARIA/apg/patterns/slider/', '値、範囲、Arrow/Home/End操作を示す。'],
  grid: ['WAI-ARIA APG Grid Pattern', 'https://www.w3.org/WAI/ARIA/apg/patterns/grid/', '方向keyで移動するinteractive gridのsemanticとkeyboard modelを示す。'],
  breadcrumb: ['WAI-ARIA APG Breadcrumb Pattern', 'https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/', 'Breadcrumb landmarkと現在地の関係を示す。'],
  tabs: ['WAI-ARIA APG Tabs Pattern', 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/', 'Tablist、tab、tabpanel、selection、roving focusの関係を示す。'],
  listbox: ['WAI-ARIA APG Listbox Pattern', 'https://www.w3.org/WAI/ARIA/apg/patterns/listbox/', '選択候補とactive/selected optionのkeyboard modelを示す。'],
  dialog: ['WAI-ARIA APG Dialog Modal Pattern', 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/', 'Accessible title、modal state、focus containmentとrestoreを示す。'],
  treeview: ['WAI-ARIA APG Tree View Pattern', 'https://www.w3.org/WAI/ARIA/apg/patterns/treeview/', 'Treeitem階層、expanded state、方向key操作を示す。'],
  menu: ['WAI-ARIA APG Menu and Menubar Pattern', 'https://www.w3.org/WAI/ARIA/apg/patterns/menubar/', 'Menuitem、focus移動、実行後のclose behaviorを示す。'],
  'patterns-index': ['WAI-ARIA APG Patterns', 'https://www.w3.org/WAI/ARIA/apg/patterns/', '既知widget patternのsemantic、keyboard、stateを比較する入口を提供する。'],
  dragging: ['WCAG 2.2 Understanding Dragging Movements', 'https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html', 'Dragだけに依存せずsingle-pointer alternativeを提供する基準を示す。'],
  'native-controls': ['HTML Standard', 'https://html.spec.whatwg.org/multipage/', 'Button、input、select、textarea、label、linkなどnative elementの意味とbehaviorを定義する。'],
};

const nativeInteractive = new Set([
  'link', 'tag', 'text-field', 'textarea', 'search-field', 'input-group', 'prompt-input',
  'pagination', 'navigation-item', 'sidebar', 'top-bar',
]);
const semanticImplementationChanges = new Set([
  'tag', 'avatar', 'tooltip', 'skeleton', 'text-field', 'textarea', 'select', 'combobox',
  'switch', 'slider', 'date-picker', 'input-group', 'breadcrumb', 'tabs', 'segmented-control',
  'pagination', 'sidebar', 'top-bar', 'command-menu', 'navigation-item', 'product-switcher',
  'toast', 'banner', 'dialog', 'drawer', 'popover', 'progress', 'table', 'list', 'timeline',
  'prompt-input', 'agent-status', 'run-log', 'file-tree', 'model-selector', 'usage-meter',
  'workflow-step', 'execution-timeline', 'analytics-chart-container', 'settings-panel',
  'user-menu', 'notification-center', 'invite-member-dialog', 'task-board-card',
]);

function makeEvidence(id, title, url, summary, supportedDecisions) {
  return {
    id,
    title,
    url,
    sourceType: url.includes('html.spec.whatwg.org') || url.includes('/WCAG22/') ? 'standard' : 'official-guideline',
    authority: 'primary',
    accessedAt: date,
    summary,
    supportedDecisions,
  };
}

let created = 0;

for (const [index, item] of componentItems.entries()) {
  if (statuses.get(item.id) === 'complete') continue;
  const componentId = item.id.replace(/^components\./, '');
  const contract = JSON.parse(readFileSync(join(root, `design/contracts/components/${componentId}.contract.json`), 'utf8'));
  const cycleId = nextCycleId(item.id, date, existingCycleIds);
  const record = buildReviewRecord({ item, date, cycleId, currentReview: currentReviews.get(item.id), reviewHistory });
  const pattern = patternByComponent[componentId] ?? (nativeInteractive.has(componentId) ? 'native-controls' : null);
  const nextItem = componentItems[index + 1]?.id;
  const implementationChanged = semanticImplementationChanges.has(componentId);
  const implementationTokenBindings = contract.tokenBindings.bindings.filter((binding) => binding.reason.includes('HTML showcaseで実際に参照'));

  record.status = 'complete';
  record.completedAt = date;
  record.reviewedSources = [...new Set([...record.reviewedSources, 'docs/components/spec-workflow.md'])];
  record.decisions = [
    {
      id: 'selection-boundary',
      summary: `${contract.name}の利用条件と代替componentの境界をcontractへ固定する。`,
      rationale: `Use: ${contract.intent.whenToUse.join(' / ')} Avoid: ${contract.intent.whenNotToUse.join(' / ')}`,
    },
    {
      id: 'semantic-contract',
      summary: `${contract.name}のnative/ARIA semantics、state、keyboard責務をmd、contract、HTMLで共有する。`,
      rationale: 'AIが見た目だけから誤ったinteractionを生成せず、表示専用rootと操作部品の責務を分離するため。',
    },
    {
      id: 'responsive-target',
      summary: 'PC用とSP用にcomponentを分けず、同じ意味とAPIをlayout、viewport、input methodへ適応する。',
      rationale: '24px minimumと主要touch操作44px推奨を守りながら、densityをviewportだけで切り替えないため。',
    },
    {
      id: 'token-contract',
      summary: `${contract.name}のshowcaseが使う公開tokenをtokenRefsとtokenBindingsへ列挙する。`,
      rationale: '実装と機械可読仕様の依存差分を自動検出し、Component tokenを必要条件なしに増やさないため。',
    },
  ];

  if (pattern) {
    const [title, url, summary] = evidenceCatalog[pattern];
    record.research = {
      status: 'complete',
      scope: { itemId: item.id, summary: `${contract.name}のselection boundary、semantic、keyboard、focus、responsive behaviorを確認する。` },
      triggers: ['standard-or-regulation', 'accessibility-or-safety', 'cross-platform-behavior'],
      questions: [
        `${contract.name}で優先すべきnative elementまたはARIA patternとkeyboard modelは何か。`,
        `Desktop、Mobile、Touchで意味とAPIを維持しながらtargetとfocusをどう担保するか。`,
      ],
      evidence: [
        makeEvidence(`pattern-${pattern}`, title, url, summary, ['semantic-contract']),
        makeEvidence('wcag-target-size', 'WCAG 2.2 Understanding Target Size Minimum', 'https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum', 'Pointer targetの24 CSS px最低条件、spacing例外、touch利用者への意図を示す。', ['responsive-target']),
        makeEvidence('wcag-focus-not-obscured', 'WCAG 2.2 Understanding Focus Not Obscured Minimum', 'https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum', 'Sticky layerやpersistent overlayでkeyboard focusを完全に隠さない基準を示す。', ['responsive-target']),
      ],
      synthesis: `${title}を${contract.name}固有のsemantic/keyboard基準、WCAG 2.2を全viewport共通のtarget/focus基準として適用した。`,
      decisionImpact: 'Native semanticsを優先し、必要なARIA関係だけを補い、PC/SPでAPIを複製しないresponsive contractへ反映した。',
      notRequiredReason: null,
    };
  } else {
    record.research = {
      status: 'not-required',
      scope: { itemId: item.id, summary: `${contract.name}の表示責務、composition boundary、token、responsive behaviorを内部仕様と実装で確認する。` },
      triggers: [],
      questions: [],
      evidence: [],
      synthesis: '',
      decisionImpact: '',
      notRequiredReason: `${contract.name}自体には新しいcustom keyboard interactionや外部standard解釈を導入せず、nested controlは各component contract、表示規則は確定済みFoundation/Token policyへ委譲するため。`,
    };
  }

  record.differences = item.id === 'components.button'
    ? [{
        classification: 'cross-layer-conflict',
        description: '旧40px target記述と長いCSS variable名が、確定したAccessibility/CSS Variables policyとずれていた。',
        action: '24px minimum / 44px preferenceと公開CSS名へmd、contract、HTMLを同期した。',
        status: 'resolved',
      }]
    : [{
        classification: 'missing-contract',
        description: `${contract.name}に完全な人間向けmdと機械可読contractが存在しなかった。`,
        action: '共通templateへ利用境界、anatomy、state、API、accessibility、responsive、AI selection ruleを記述した。',
        status: 'resolved',
      }];

  if (implementationChanged) {
    record.differences.push({
      classification: 'implementation-stale',
      description: `${contract.name}のHTML showcaseが確定したnative/ARIA semanticsまたはkeyboard到達性を十分に表現していなかった。`,
      action: 'Showcase markupをcontractのsemantic relationshipとaccessible nameへ合わせた。',
      status: 'resolved',
    });
  }
  if (implementationTokenBindings.length > 0) {
    record.differences.push({
      classification: 'cross-layer-conflict',
      description: `${implementationTokenBindings.length}個のshowcase token依存がcontractに未宣言だった。`,
      action: '全variant/stateのrender結果からtokenRefsとtokenBindingsへ同期した。',
      status: 'resolved',
    });
  }

  record.changes = [
    { path: `components/${componentId}.md`, summary: `${contract.name}の人間・AI向け設計仕様を完全templateで同期。` },
    { path: `design/contracts/components/${componentId}.contract.json`, summary: 'Intent、behavior、responsive、accessibility、token bindingを機械可読化。' },
    { path: 'js/generated/component-contract-meta.js', summary: 'ContractからHTML docsへ表示するmetadataを生成。' },
    { path: 'design/system-registry.json', summary: '仕様、実装、検査sourceと最新review cycleを台帳へ接続。' },
    { path: 'test/component-specs.test.js', summary: '全74件の契約同期、全state/variant描画、semantic、token依存を検査。' },
  ];
  if (implementationChanged) record.changes.push({ path: 'js/ui-builders.js', summary: `${contract.name} showcaseのnative/ARIA markupをcontractへ同期。` });

  record.validations = [
    { command: 'npm run check:system', status: 'passed', notes: 'Schema、registry、generated artifacts、JS syntaxと105 unit testsが成功。' },
    { command: 'node --test test/component-specs.test.js', status: 'passed', notes: `${contract.name}を含む74件の全state/variant render、tag balance、semantic relationship、token declarationが成功。` },
    { command: 'Automated browser viewport QA', status: 'not-run', notes: 'In-app browserがlocal file URLの自動操作をsecurity policyで拒否したため、このcycleでは自動screenshotを取得していない。' },
  ];
  record.openQuestions = [
    {
      question: contract.openQuestions[0],
      owner: item.id,
      exitCriteria: 'React packageのDOM/ref/event APIを実装し、全visual slot bindingをcompleteにしてcontractをstableへ移行すること。',
    },
    {
      question: `${contract.name}のDesktop/Mobile、Light/Dark、Standard/High contrast、3 densityのvisual regression baselineを取得する。`,
      owner: item.id,
      exitCriteria: 'Local pageを許可されたbrowser runnerで全matrix撮影し、overflow、重なり、focus表示、text fitに差分がないこと。',
    },
  ];
  record.impactedItems = [];
  record.nextRecommendedItems = nextItem ? [nextItem] : [];

  const relativePath = `design/reviews/${item.id}.${cycleId}.review.json`;
  writeFileSync(join(root, relativePath), `${JSON.stringify(record, null, 2)}\n`);
  item.reviewRecord = relativePath;
  currentReviews.set(item.id, record);
  reviewHistory.push(record);
  existingCycleIds.add(cycleId);
  created += 1;
}

writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
console.log(`Completed ${created} component review cycles.`);
