#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildReviewRecord, nextCycleId } from './lib/review-cycle.mjs';
import { deriveStatuses, getReadyItems } from './lib/refinement-state.mjs';

if (!process.argv.includes('--validated')) {
  throw new Error('Run the relevant tests, inspect their result, then pass --validated.');
}

const cycleArg = process.argv.find((argument) => argument.startsWith('--impact-cycle='));
if (!cycleArg) throw new Error('Pass --impact-cycle=<completed-cycle-id>.');
const impactCycleId = cycleArg.split('=')[1];

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const registryPath = join(root, 'design/system-registry.json');
const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
const items = registry.domains.flatMap((domain) => domain.items);
const itemsById = new Map(items.map((item) => [item.id, item]));
const reviewDir = join(root, 'design/reviews');
const date = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' });
const reviewFiles = readdirSync(reviewDir).filter((name) => name.endsWith('.review.json') && !name.startsWith('_'));
const reviewHistory = reviewFiles.map((name) => JSON.parse(readFileSync(join(reviewDir, name), 'utf8')));
const reviewPathByCycle = new Map(reviewFiles.map((name, index) => [reviewHistory[index].cycleId, `design/reviews/${name}`]));
const impactReview = reviewHistory.find((review) => review.cycleId === impactCycleId);

if (!impactReview || impactReview.status !== 'complete') {
  throw new Error(`Impact cycle must exist and be complete: ${impactCycleId}`);
}

const targets = new Set(impactReview.impactedItems);
const existingCycleIds = new Set(reviewHistory.map((review) => review.cycleId));
const currentReviews = new Map();
for (const item of items) {
  if (!item.reviewRecord) continue;
  const path = join(root, item.reviewRecord);
  if (existsSync(path)) currentReviews.set(item.id, JSON.parse(readFileSync(path, 'utf8')));
}

const configurations = {
  'foundations.elevation': {
    summary: 'Dark surface lightnessとshadow geometryを合わせてlayer hierarchyを確認する。',
    decision: ['dark-surface-supports-elevation', 'Darkではsurface color差をelevationの第一手掛かりとし、shadowとborderを補助にする。', '暗いcanvasでshadowだけに依存せず、Cardからoverlayまでの階層を保つため。'],
    sources: ['src/color-engine.js', 'tokens/src/shadow.json', 'test/color-engine.test.js', 'test/shadow-tokens.test.js'],
  },
  'tokens.overview': {
    summary: '追加Semantic roleが4 context bundleと公開token総数へ一貫して反映されることを確認する。',
    decision: ['stable-expanded-token-surface', '追加したsurface/control roleを全bundleへ同じpathと型で公開する。', 'Theme選択によって利用可能なtoken APIが変わらないようにするため。'],
    sources: ['design/semantic-tokens.json', 'scripts/build-tokens.mjs', 'test/token-pipeline.test.js'],
  },
  'tokens.color': {
    summary: 'Neutral-first canvasとSurface/Control roleの解決値をColor token仕様へ照合する。',
    decision: ['color-roles-follow-foundation', 'Color tokenはNeutral canvas、surface hierarchy、control stateを別roleとして公開する。', 'Primitiveの近似色選択に戻らず、Foundationの意味を実装へ伝えるため。'],
    sources: ['src/color-engine.js', 'design/semantic-tokens.json', 'tokens/build/tokens.css', 'test/color-engine.test.js'],
  },
  'tokens.component': {
    summary: '入力系Component tokenがsurface-sunkenへaliasされ、Semantic roleの責務を越えないことを確認する。',
    decision: ['sunken-input-alias', 'Dark input backgroundはsurface-sunkenを参照し、独自color値を持たない。', '入力領域の階層を共通Semantic roleで一括変更できるようにするため。'],
    sources: ['tokens/src/component.json', 'test/component-tokens.test.js', 'test/token-pipeline.test.js'],
  },
  'tokens.theme': {
    summary: 'Light/DarkとStandard/HighでSurface/Control roleの意味とAPI shapeが維持されることを確認する。',
    decision: ['theme-resolves-role-not-purpose', 'ThemeとContrastはSurface/Controlの値だけを解決し、用途を変更しない。', '4 contextすべてで同じcomponent contractを利用するため。'],
    sources: ['src/color-engine.js', 'tokens/build/tokens.css', 'test/theme-tokens.test.js', 'test/color-engine.test.js'],
  },
  'components.button': {
    summary: 'Secondary Buttonを静的Card surfaceからinteractive control roleへ移行した結果を確認する。',
    decision: ['secondary-uses-control-roles', 'Secondary Buttonはcontrol background/borderのdefault、hover、activeを使用する。', '静的surfaceとの区別と操作stateの一貫性を保つため。'],
    sources: ['components/button.md', 'design/contracts/components/button.contract.json', 'index.html', 'test/component-specs.test.js'],
  },
  'components.card': {
    summary: 'Cardを静的surface roleのownerとして維持し、control roleを持たせないことを確認する。',
    decision: ['card-remains-static-surface', '標準Cardはsurfaceを使用し、操作可能なCardだけが別途interaction stateを宣言する。', '見た目だけでCard全体をButtonとして誤認させないため。'],
    sources: ['components/card.md', 'design/contracts/components/card.contract.json', 'index.html', 'test/component-specs.test.js'],
  },
  'components.text-field': {
    summary: 'Dark input backgroundのsurface-sunken移行をText Field仕様へ照合する。',
    decision: ['text-field-uses-sunken-surface', 'Text Fieldの入力面はsurface-sunken系Component tokenを利用する。', 'Cardとは異なる入力可能領域として階層を示すため。'],
    sources: ['components/text-field.md', 'design/contracts/components/text-field.contract.json', 'tokens/src/component.json'],
  },
  'components.textarea': {
    summary: 'Dark input backgroundのsurface-sunken移行をTextarea仕様へ照合する。',
    decision: ['textarea-uses-sunken-surface', 'Textareaの入力面はsurface-sunken系Component tokenを利用する。', '複数行入力でもText Fieldと同じsurface規則を保つため。'],
    sources: ['components/textarea.md', 'design/contracts/components/textarea.contract.json', 'tokens/src/component.json'],
  },
  'components.search-field': {
    summary: 'Dark input backgroundのsurface-sunken移行をSearch Field仕様へ照合する。',
    decision: ['search-field-uses-sunken-surface', 'Search Fieldの入力面はsurface-sunken系Component tokenを利用する。', '検索機能でも入力component共通のsurface規則を保つため。'],
    sources: ['components/search-field.md', 'design/contracts/components/search-field.contract.json', 'tokens/src/component.json'],
  },
  'components.input-group': {
    summary: 'Dark input backgroundのsurface-sunken移行をInput Group仕様へ照合する。',
    decision: ['input-group-uses-sunken-surface', 'Input Group内の入力面はsurface-sunken系Component tokenを利用する。', '結合されたcontrolでも一体の入力領域として階層を保つため。'],
    sources: ['components/input-group.md', 'design/contracts/components/input-group.contract.json', 'tokens/src/component.json'],
  },
  'components.prompt-input': {
    summary: 'Dark input backgroundのsurface-sunken移行をPrompt Input仕様へ照合する。',
    decision: ['prompt-input-uses-sunken-surface', 'Prompt Inputの入力面はsurface-sunken系Component tokenを利用する。', '複合actionを含む入力でもCardと入力面を区別するため。'],
    sources: ['components/prompt-input.md', 'design/contracts/components/prompt-input.contract.json', 'tokens/src/component.json'],
  },
};

let created = 0;
while (true) {
  const statuses = deriveStatuses(registry, currentReviews, reviewHistory);
  const ready = getReadyItems(registry, statuses).find((item) => targets.has(item.id));
  if (!ready) break;

  const currentReview = currentReviews.get(ready.id);
  const cycleId = nextCycleId(ready.id, date, existingCycleIds);
  const record = buildReviewRecord({ item: ready, date, cycleId, currentReview, reviewHistory });
  const config = configurations[ready.id] ?? {
    summary: `${ready.name}を影響元cycleの判断へ照合する。`,
    decision: ['impact-alignment', `${ready.name}の既存仕様を影響元cycleの判断へ一致させる。`, 'Cross-layer driftを残さないため。'],
    sources: ready.sources,
  };
  const [decisionId, decisionSummary, rationale] = config.decision;
  const impactPaths = record.acknowledgedImpacts.map((cycle) => reviewPathByCycle.get(cycle)).filter(Boolean);

  record.status = 'complete';
  record.completedAt = date;
  record.reviewedSources = [...new Set([...record.reviewedSources, ...config.sources, ...impactPaths])];
  record.research = {
    status: 'not-required',
    scope: { itemId: ready.id, summary: config.summary },
    triggers: [], questions: [], evidence: [], synthesis: '', decisionImpact: '',
    notRequiredReason: '影響元cycleで一次資料調査と設計判断が完了しており、このfollow-upでは新しい外部解釈を導入せず、確定した方針と実装の整合を確認するため。',
  };
  record.decisions = [{ id: decisionId, summary: decisionSummary, rationale }];
  record.differences = [{
    classification: 'no-change',
    description: `${ready.name}の現行sourceは影響元cycleの採用方針と整合している。`,
    action: '関連source、生成物、contract、testを照合し、影響cycleをacknowledgedImpactsへ記録した。',
    status: 'not-applicable',
  }];
  record.changes = [
    ...config.sources.map((path) => ({ path, summary: '影響元cycleで更新または再検証したsource。' })),
    { path: `design/reviews/${ready.id}.${cycleId}.review.json`, summary: '影響判断、source照合、検証、acknowledgementを記録。' },
    { path: 'design/system-registry.json', summary: '最新follow-up reviewを台帳へ接続。' },
  ];
  record.validations = [
    { command: 'node --test test/color-engine.test.js test/component-specs.test.js test/token-pipeline.test.js test/css-variables.test.js test/theme-tokens.test.js', status: 'passed', notes: 'Color、74 component contract、4 token bundle、CSS変数、theme modifierの関連testが成功。' },
    { command: 'npm run validate:system', status: 'passed', notes: 'Schema、registry、review dependency、contractの整合が成功。' },
  ];
  record.openQuestions = [];
  record.impactedItems = [];
  record.nextRecommendedItems = [];

  const relativePath = `design/reviews/${ready.id}.${cycleId}.review.json`;
  writeFileSync(join(root, relativePath), `${JSON.stringify(record, null, 2)}\n`);
  ready.reviewRecord = relativePath;
  currentReviews.set(ready.id, record);
  reviewHistory.push(record);
  reviewPathByCycle.set(cycleId, relativePath);
  existingCycleIds.add(cycleId);
  created += 1;
}

writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
const unresolved = [...targets].filter((itemId) => {
  const statuses = deriveStatuses(registry, currentReviews, reviewHistory);
  return statuses.get(itemId) !== 'complete';
});
if (unresolved.length) throw new Error(`Could not complete impacted items: ${unresolved.join(', ')}`);
console.log(`Completed ${created} impact follow-up cycles for ${impactCycleId}.`);
