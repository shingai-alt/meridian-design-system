function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function list(items) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function jsonForScript(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e').replaceAll('&', '\\u0026');
}

function safeExternalUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function renderDirections(phaseOne) {
  return phaseOne.directionSet.directions.map((direction) => {
    const selected = direction.id === phaseOne.directionSet.recommendation;
    return `<article class="direction${selected ? ' selected' : ''}">
      <div class="direction-title"><h4>${escapeHtml(direction.title)}</h4>${selected ? '<span class="tag recommended">採用</span>' : '<span class="tag">比較案</span>'}</div>
      <p>${escapeHtml(direction.hypothesis)}</p>
      <strong>利点</strong>${list(direction.benefits)}
      <strong>リスク</strong>${list(direction.risks)}
    </article>`;
  }).join('');
}

function renderEvidence(phaseOne) {
  return phaseOne.researchPack.evidence.map((evidence) => {
    const evidenceUrl = safeExternalUrl(evidence.url);
    return `<article class="evidence-card">
    <div><span class="tag">${escapeHtml(evidence.sourceType)}</span> <strong>${escapeHtml(evidence.organization)}</strong></div>
    <h4>${evidenceUrl ? `<a href="${escapeHtml(evidenceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(evidence.title)}</a>` : escapeHtml(evidence.title)}</h4>
    <p>${escapeHtml(evidence.interpretation)}</p>
    <small>Limit: ${escapeHtml(evidence.limitations.join(' / '))}</small>
  </article>`;
  }).join('');
}

export function renderPhase2Html({ manifest, phaseOne, tokensCss, runtimeCss = '', registry = null, usage = null, browserRuntime = '', referenceManifest = null, designPrinciples = null, designStrategies = null, grounding = null, visualRubric = null, visualCandidates = null }) {
  const runtimeData = {
    conceptId: manifest.meta.id,
    sourcePackageId: phaseOne.meta.id,
    title: manifest.meta.title,
    startScenario: manifest.prototype.startScenario,
    scenarios: manifest.prototype.scenarios,
    lenses: manifest.prototype.reviewLenses,
    feedback: manifest.feedback,
    visualQuality: visualRubric && visualCandidates ? {
      rubric: visualRubric,
      baselineId: visualCandidates.baselineId,
      candidates: visualCandidates.candidates,
      comparisons: visualCandidates.comparisons,
    } : null,
    designIntelligence: referenceManifest && designPrinciples && designStrategies && grounding ? {
      references: referenceManifest.references,
      principles: designPrinciples.principles,
      antiPatterns: designPrinciples.antiPatterns,
      strategies: designStrategies.strategies,
      recommendation: designStrategies.recommendation,
      grounding: grounding.strategies,
    } : null,
    harness: usage ? {
      runtimeVersion: usage.runtimeVersion,
      translationPackDigest: usage.translationPackDigest,
      usageManifest: manifest.generation.usageOutput,
      validationDigest: usage.validationDigest,
    } : null,
  };
  const selectedDirection = phaseOne.directionSet.directions.find((item) => item.id === phaseOne.directionSet.recommendation);
  const alertContractVersion = registry?.components.find((component) => component.id === 'alert')?.contractVersion ?? '0.1.0';
  return `<!doctype html>
<html lang="ja" data-theme="light" data-density="comfortable">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="Meridian Phase 2 Concept Generator 0.2.0 · Component Harness 0.1.0">
<title>${escapeHtml(manifest.meta.title)} — Meridian Phase 2</title>
<style>
${tokensCss}
${runtimeCss}
*,*::before,*::after{box-sizing:border-box}
html{color-scheme:light}
body{margin:0;background:var(--bg);color:var(--fg);font:var(--type-body);min-width:320px}
button,input,select,textarea{font:inherit;color:inherit}
button{cursor:pointer}
:focus{outline:none}
:focus-visible{outline:var(--focus-w) solid var(--focus-ring);outline-offset:2px}
a{color:var(--primary)}
.skip-link{position:fixed;left:var(--sp-3);top:var(--sp-3);z-index:99;transform:translateY(-160%);background:var(--surface);padding:var(--sp-2) var(--sp-3);border-radius:var(--radius-sm);box-shadow:var(--shadow-md)}
.skip-link:focus{transform:none}
.review-header{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--surface) 94%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);padding:var(--sp-3) var(--sp-5)}
.review-header-main{display:flex;align-items:center;justify-content:space-between;gap:var(--sp-4);margin-bottom:var(--sp-3)}
.eyebrow{font:var(--type-label-sm);color:var(--fg-subtle);text-transform:uppercase;letter-spacing:.06em}
h1,h2,h3,h4,p{margin-top:0}
h1{font:var(--type-h2);margin-bottom:2px}
h2{font:var(--type-h1)}
h3{font:var(--type-h3)}
h4{font:var(--type-h4);margin-bottom:var(--sp-1)}
.status-line{display:flex;align-items:center;gap:var(--sp-2);font:var(--type-label)}
.status-dot{width:8px;height:8px;border-radius:50%;background:var(--success)}
.toolbar{display:flex;flex-wrap:wrap;align-items:end;gap:var(--sp-3)}
.tool{display:grid;gap:var(--sp-1)}
.tool label,.tool-label{font:var(--type-label-sm);color:var(--fg-muted)}
.select,.input,.textarea{min-height:40px;background:var(--input-bg);border:1px solid var(--input-border);border-radius:var(--radius-sm);padding:0 var(--sp-3)}
.textarea{width:100%;min-height:88px;padding-top:var(--sp-2);resize:vertical}
.segmented{display:flex;border:1px solid var(--border);border-radius:var(--radius-sm);padding:2px;background:var(--surface-sunken)}
.segmented button{min-height:34px;border:0;border-radius:var(--radius-xs);padding:0 var(--sp-3);background:transparent}
.segmented button[aria-pressed="true"]{background:var(--surface);box-shadow:var(--shadow-xs);font-weight:600}
.review-layout{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(320px,.75fr);gap:var(--sp-5);padding:var(--sp-5);max-width:1600px;margin:auto;align-items:start}
.canvas-column{min-width:0}
.scenario-note{display:flex;gap:var(--sp-2);align-items:start;background:var(--info-subtle);color:var(--info-fg);border:1px solid color-mix(in srgb,var(--info) 26%,var(--border));padding:var(--sp-3);border-radius:var(--radius-md);margin-bottom:var(--sp-3)}
.scenario-note strong{white-space:nowrap}
.canvas-shell{background:var(--surface-sunken);border:1px solid var(--border);border-radius:var(--radius-xl);padding:var(--sp-4);overflow:auto;min-height:720px}
.prototype{width:100%;max-width:1120px;margin:auto;background:var(--bg);min-height:680px;border:1px solid var(--border);border-radius:var(--radius-lg);box-shadow:var(--shadow-sm);overflow:hidden;transition:max-width var(--dur-normal) var(--ease-standard)}
.prototype[data-viewport="mobile"]{max-width:390px}
.appbar{height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 var(--sp-5);border-bottom:1px solid var(--border);background:var(--surface)}
.brand{font-weight:700;letter-spacing:-.02em}.workspace-name{font:var(--type-label);color:var(--fg-muted)}
.appbody{display:grid;grid-template-columns:200px 1fr;min-height:624px}
.appnav{padding:var(--sp-4);border-right:1px solid var(--border);background:var(--bg-subtle)}
.appnav span{display:block;padding:var(--sp-2) var(--sp-3);border-radius:var(--radius-sm);color:var(--fg-muted);margin-bottom:2px}
.appnav .active{background:var(--primary-subtle);color:var(--primary);font-weight:600}
.page{padding:var(--sp-6);min-width:0}
.breadcrumbs{font:var(--type-label-sm);color:var(--fg-muted);margin-bottom:var(--sp-3)}
.page-heading{display:flex;justify-content:space-between;gap:var(--sp-4);align-items:start;margin-bottom:var(--sp-5)}
.page-heading h2{margin-bottom:var(--sp-1)}
.page-heading p{color:var(--fg-muted);margin:0}
.flow-steps{display:none;align-items:center;gap:var(--sp-2);margin-bottom:var(--sp-4);font:var(--type-label-sm);color:var(--fg-subtle)}
.flow-step{display:flex;align-items:center;gap:var(--sp-2)}
.flow-step:not(:last-child)::after{content:"";width:28px;height:1px;background:var(--border);margin-left:var(--sp-2)}
.flow-step strong{display:grid;place-items:center;width:24px;height:24px;border:1px solid var(--border);border-radius:var(--radius-full);font:var(--type-label-sm)}
.flow-step.current{color:var(--primary);font-weight:700}.flow-step.current strong{background:var(--primary);border-color:var(--primary);color:var(--primary-fg)}
.seat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:var(--sp-2);margin-bottom:var(--sp-4)}
.seat-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);padding:var(--sp-3)}
.seat-card span{display:block;color:var(--fg-muted);font:var(--type-label-sm)}
.seat-card strong{font:var(--type-h3)}
.prototype[data-design-candidate="task-focus"] .appbody{grid-template-columns:1fr}
.prototype[data-design-candidate="task-focus"] .appnav{display:none}
.prototype[data-design-candidate="task-focus"] .page{width:100%;max-width:920px;margin:auto}
.prototype[data-design-candidate="task-focus"] .seat-grid{display:flex;align-items:center;gap:var(--sp-4);padding:var(--sp-2) var(--sp-3);background:var(--bg-subtle);border-radius:var(--radius-md)}
.prototype[data-design-candidate="task-focus"] .seat-card{padding:0;border:0;background:transparent;display:flex;align-items:baseline;gap:var(--sp-1)}
.prototype[data-design-candidate="task-focus"] .seat-card strong{font:var(--type-label);order:-1}
.prototype[data-design-candidate="task-focus"] .seat-card:last-child{margin-left:auto;color:var(--primary)}
.prototype[data-design-candidate="task-focus"] .seat-card:last-child strong{font:var(--type-h3)}
.prototype[data-design-candidate="task-focus"] .panel{border-color:transparent;box-shadow:var(--shadow-xs)}
.prototype[data-design-candidate="context-aside"] .page{display:grid;grid-template-columns:minmax(0,1fr) 216px;column-gap:var(--sp-5);align-items:start}
.prototype[data-design-candidate="context-aside"] .breadcrumbs,.prototype[data-design-candidate="context-aside"] .page-heading,.prototype[data-design-candidate="context-aside"] .flow-steps,.prototype[data-design-candidate="context-aside"] #prototype-live,.prototype[data-design-candidate="context-aside"] #error-summary,.prototype[data-design-candidate="context-aside"] #prototype-content{grid-column:1}
.prototype[data-design-candidate="context-aside"] .seat-grid{grid-column:2;grid-row:2/span 6;display:grid;grid-template-columns:1fr;gap:0;padding:var(--sp-3);border:1px solid var(--border);border-radius:var(--radius-lg);background:var(--surface);position:sticky;top:var(--sp-3)}
.prototype[data-design-candidate="context-aside"] .seat-grid::before{content:"Seatの状況";font:var(--type-h4);margin-bottom:var(--sp-2)}
.prototype[data-design-candidate="context-aside"] .seat-card{border:0;border-radius:0;padding:var(--sp-2) 0;display:flex;align-items:baseline;justify-content:space-between;gap:var(--sp-2)}
.prototype[data-design-candidate="context-aside"] .seat-card+.seat-card{border-top:1px solid var(--border-muted)}
.prototype[data-design-candidate="guided-flow"] .page{width:100%;max-width:860px;margin:auto;padding-left:var(--sp-4);padding-right:var(--sp-4)}
.prototype[data-design-candidate="guided-flow"] .flow-steps{display:flex}
.prototype[data-design-candidate="guided-flow"] .seat-grid{grid-template-columns:repeat(4,auto);justify-content:start;padding:var(--sp-2) 0;border-top:1px solid var(--border-muted);border-bottom:1px solid var(--border-muted)}
.prototype[data-design-candidate="guided-flow"] .seat-card{border:0;background:transparent;padding:0 var(--sp-3);border-radius:0}
.prototype[data-design-candidate="guided-flow"] .seat-card:first-child{padding-left:0}.prototype[data-design-candidate="guided-flow"] .seat-card+.seat-card{border-left:1px solid var(--border-muted)}
.prototype[data-design-candidate="guided-flow"] .seat-card strong{font:var(--type-label)}
.panel{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:var(--sp-4);margin-bottom:var(--sp-4)}
.panel-heading{display:flex;justify-content:space-between;align-items:center;gap:var(--sp-3);margin-bottom:var(--sp-3)}
.panel-heading h3{margin:0}.row-count{font:var(--type-label);color:var(--fg-muted)}
.invite-table th:first-child,.invite-table td:first-child{width:42%}
.invite-table th:nth-child(2),.invite-table td:nth-child(2){width:22%}
.invite-table th:nth-child(3),.invite-table td:nth-child(3){width:28%}
.invite-table th:last-child,.invite-table td:last-child{width:48px}
.invite-row .input,.invite-row .select{width:100%;min-width:0}
.field-error{display:block;color:var(--danger-fg);font:var(--type-label-sm);margin-top:var(--sp-1)}
.row-status{min-height:40px;display:flex;align-items:center;font:var(--type-label-sm);color:var(--fg-muted)}
.row-status.error{color:var(--danger-fg)}.row-status.success{color:var(--success-fg)}
.icon-btn{width:40px;height:40px;border:0;background:transparent;border-radius:var(--radius-sm);font-size:18px}
.icon-btn:hover{background:var(--surface-muted)}
.panel-actions,.page-actions{display:flex;gap:var(--sp-2);align-items:center;justify-content:space-between;margin-top:var(--sp-3)}
.btn{min-height:40px;border:1px solid transparent;border-radius:var(--radius-sm);padding:0 var(--sp-4);background:var(--surface);font-weight:600}
.btn.primary{min-height:44px;background:var(--button-primary-bg);color:var(--button-primary-fg)}
.btn.primary:hover{background:var(--button-primary-bg-hover)}
.btn.secondary{border-color:var(--border)}.btn.secondary:hover{border-color:var(--border-strong)}
.btn.ghost{background:transparent;color:var(--primary)}
.btn:disabled{cursor:not-allowed;opacity:.48}
.alert{padding:var(--sp-3);border-radius:var(--radius-md);border:1px solid var(--border);margin-bottom:var(--sp-3)}
.alert.error,.alert.danger{background:var(--danger-subtle);border-color:color-mix(in srgb,var(--danger) 35%,var(--border));color:var(--danger-fg)}
.alert.warning{background:var(--warning-subtle);border-color:color-mix(in srgb,var(--warning) 35%,var(--border));color:var(--warning-fg)}
.alert.success{background:var(--success-subtle);border-color:color-mix(in srgb,var(--success) 35%,var(--border));color:var(--success-fg)}
.alert h3{margin-bottom:var(--sp-1)}.alert p:last-child{margin-bottom:0}
.error-summary ul{margin-bottom:0}.error-summary a{color:inherit}
.owner-check{display:flex;align-items:start;gap:var(--sp-2);margin-top:var(--sp-2)}
.owner-check input{width:24px;height:24px;margin:0;flex:none}
.review-list{display:grid;gap:var(--sp-2)}
.review-person{display:flex;justify-content:space-between;gap:var(--sp-3);padding:var(--sp-3);background:var(--bg-subtle);border-radius:var(--radius-sm)}
.result-group{margin-top:var(--sp-4)}
.result-group ul{margin-bottom:0}
.review-sidebar{display:grid;gap:var(--sp-3);position:sticky;top:142px;max-height:calc(100vh - 164px);overflow:auto;padding-right:2px}
.review-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:var(--sp-4)}
.review-card>h3{margin-bottom:var(--sp-2)}
.review-card p,.review-card li{color:var(--fg-muted)}
.review-card ul{padding-left:var(--sp-5)}
.candidate-summary{display:grid;gap:var(--sp-2)}
.candidate-summary p{margin:0}.candidate-meta{display:grid;grid-template-columns:auto 1fr;gap:var(--sp-1) var(--sp-2);font:var(--type-body-sm)}
.candidate-meta dt{color:var(--fg-subtle)}.candidate-meta dd{margin:0}
.intelligence-list{display:grid;gap:var(--sp-2);padding:0;list-style:none}.intelligence-list li{padding:var(--sp-2) 0;border-top:1px solid var(--border-muted)}
.finding-list{margin:0;padding-left:var(--sp-4);color:var(--fg-muted)}
.repair-round{border-left:3px solid var(--primary);padding-left:var(--sp-3);margin-top:var(--sp-3)}
.repair-round h4{font:var(--type-label);margin-bottom:var(--sp-1)}
.rubric-list{display:grid;gap:var(--sp-1);padding:0!important;list-style:none}.rubric-list li{display:flex;justify-content:space-between;gap:var(--sp-2);font:var(--type-body-sm)}
.pairwise-fields{display:grid;gap:var(--sp-2)}
.comparison-preview{display:grid;gap:var(--sp-1)}.comparison-preview .segmented{width:100%}.comparison-preview button{flex:1}
.lens-box{background:var(--primary-subtle);border-radius:var(--radius-md);padding:var(--sp-3)}
.lens-box h4{color:var(--primary)}
.direction,.evidence-card{padding:var(--sp-3);border:1px solid var(--border);border-radius:var(--radius-md);margin-top:var(--sp-2)}
.direction.selected{border-color:var(--primary);background:var(--primary-subtle)}
.direction-title{display:flex;align-items:center;justify-content:space-between;gap:var(--sp-2)}
.direction p,.direction ul,.evidence-card p{font:var(--type-body-sm)}
.tag{display:inline-flex;border:1px solid var(--border);border-radius:var(--radius-full);padding:2px var(--sp-2);font:var(--type-label-sm);color:var(--fg-muted);background:var(--surface)}
.tag.recommended{border-color:var(--primary);color:var(--primary);background:var(--primary-subtle)}
.evidence-card small{color:var(--fg-subtle)}
details{border-top:1px solid var(--border);padding-top:var(--sp-3);margin-top:var(--sp-3)}
summary{cursor:pointer;font-weight:600}
.feedback-grid{display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-2);margin-bottom:var(--sp-2)}
.feedback-grid label,.feedback-field label{display:grid;gap:var(--sp-1);font:var(--type-label)}
.feedback-field{margin-bottom:var(--sp-2)}
.feedback-items{display:grid;gap:var(--sp-2);margin:var(--sp-3) 0}
.feedback-item{border-left:3px solid var(--primary);padding:var(--sp-2);background:var(--bg-subtle)}
.feedback-item button{float:right;border:0;background:transparent;color:var(--danger-fg)}
.export-actions{display:flex;flex-wrap:wrap;gap:var(--sp-2)}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
[hidden]{display:none!important}
@media(max-width:1000px){.review-layout{grid-template-columns:1fr}.review-sidebar{position:static;max-height:none}.review-header{position:static}}
.prototype[data-viewport="mobile"] .appbody{display:block}
.prototype[data-viewport="mobile"] .appnav{display:none}
.prototype[data-viewport="mobile"] .page{padding:var(--sp-4)}
.prototype[data-viewport="mobile"][data-design-candidate] .page{display:block;max-width:none}
.prototype[data-viewport="mobile"][data-design-candidate="task-focus"] .seat-grid,.prototype[data-viewport="mobile"][data-design-candidate="guided-flow"] .seat-grid{display:grid;grid-template-columns:1fr 1fr;padding:var(--sp-2);gap:var(--sp-2)}
.prototype[data-viewport="mobile"][data-design-candidate="task-focus"] .seat-card:last-child{margin-left:0}
.prototype[data-viewport="mobile"][data-design-candidate="context-aside"] .seat-grid{position:static;display:grid;grid-template-columns:1fr 1fr;gap:0 var(--sp-4);margin-bottom:var(--sp-4)}
.prototype[data-viewport="mobile"][data-design-candidate="context-aside"] .seat-grid::before{grid-column:1/-1}
.prototype[data-viewport="mobile"][data-design-candidate="context-aside"] .seat-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:var(--sp-2);min-width:0}
.prototype[data-viewport="mobile"][data-design-candidate="context-aside"] .seat-card span{min-width:0}
.prototype[data-viewport="mobile"] .flow-steps{overflow:auto}.prototype[data-viewport="mobile"] .flow-step:not(:last-child)::after{width:16px}
.prototype[data-viewport="mobile"] .page-heading{display:block}
.prototype[data-viewport="mobile"] .seat-grid{grid-template-columns:1fr 1fr}
.prototype[data-viewport="mobile"] .invite-head{display:none}
.prototype[data-viewport="mobile"] .invite-table,.prototype[data-viewport="mobile"] .invite-table tbody{display:block}
.prototype[data-viewport="mobile"] .invite-row{display:grid;grid-template-columns:1fr 44px;gap:var(--sp-2);padding:var(--sp-3) 0;border-top:1px solid var(--border-muted)}
.prototype[data-viewport="mobile"] .invite-row td{display:block;width:auto;border:0;padding:0}
.prototype[data-viewport="mobile"] .invite-row .email-field{grid-column:1}
.prototype[data-viewport="mobile"] .invite-row .role-field{grid-column:1}
.prototype[data-viewport="mobile"] .invite-row .status-field{grid-column:1}
.prototype[data-viewport="mobile"] .invite-row .action-field{grid-column:2;grid-row:1}
.prototype[data-viewport="mobile"] .appbar{padding:0 var(--sp-4)}
@media(max-width:620px){.review-layout{padding:var(--sp-3)}.review-header{padding:var(--sp-3)}.toolbar{align-items:stretch}.tool{width:100%}.select{width:100%}.segmented{width:100%}.segmented button{flex:1}.canvas-shell{padding:var(--sp-2)}.feedback-grid{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;transition-duration:.01ms!important;animation-duration:.01ms!important}}
</style>
</head>
<body>
<a class="skip-link" href="#prototype-heading">Prototypeへ移動</a>
<header class="review-header">
  <div class="review-header-main">
    <div><div class="eyebrow">Meridian · Phase 2 review concept</div><h1>${escapeHtml(manifest.meta.title)}</h1></div>
    <div class="status-line"><span class="status-dot" aria-hidden="true"></span>Phase 1 approved · Concept ${escapeHtml(manifest.meta.status)}${usage ? ` · Harness ${escapeHtml(usage.runtimeVersion)}` : ''}</div>
  </div>
  <div class="toolbar" aria-label="Review controls">
    <div class="tool"><label for="scenario-select">Scenario</label><select class="select" id="scenario-select"></select></div>
    ${visualCandidates ? '<div class="tool"><label for="candidate-select">Design candidate</label><select class="select" id="candidate-select"></select></div>' : ''}
    <div class="tool"><span class="tool-label">Canvas</span><div class="segmented" aria-label="Canvas width"><button type="button" data-viewport="desktop" aria-pressed="true">Desktop</button><button type="button" data-viewport="mobile" aria-pressed="false">Mobile</button></div></div>
    <div class="tool"><label for="lens-select">Review lens</label><select class="select" id="lens-select"></select></div>
  </div>
</header>
<main class="review-layout">
  <section class="canvas-column" aria-labelledby="prototype-heading">
    <div class="scenario-note"><strong>確認目的</strong><span id="scenario-purpose"></span></div>
    <div class="canvas-shell">
      <div class="prototype" id="prototype" data-viewport="desktop" data-design-candidate="baseline">
        <div class="appbar"><div class="brand">Northstar</div><div class="workspace-name">Acme Workspace · Owner</div></div>
        <div class="appbody">
          <nav class="appnav" aria-label="Workspace settings"><span>一般</span><span class="active">メンバー</span><span>Billing</span><span>監査ログ</span></nav>
          <div class="page">
            <div class="breadcrumbs">設定 / メンバー / 招待</div>
            <div class="page-heading"><div><h2 id="prototype-heading">メンバーを招待</h2><p>メールアドレスごとにRoleを設定します。招待は7日間有効です。</p></div></div>
            <div class="flow-steps" aria-label="招待の進行状況"><span class="flow-step current"><strong>1</strong>入力</span><span class="flow-step"><strong>2</strong>確認</span><span class="flow-step"><strong>3</strong>送信結果</span></div>
            <div class="seat-grid" aria-label="Seat usage"><div class="seat-card"><span>契約Seat</span><strong id="seat-contracted"></strong></div><div class="seat-card"><span>参加済み</span><strong id="seat-accepted"></strong></div><div class="seat-card"><span>招待中・予約</span><strong id="seat-pending"></strong></div><div class="seat-card"><span>今回送信可能</span><strong id="seat-available"></strong></div></div>
            <div id="prototype-live" class="sr-only" role="status" aria-live="polite"></div>
            <div id="error-summary" class="mrd-alert alert danger error-summary" tabindex="-1" hidden data-meridian-component="alert" data-meridian-instance="global-error-summary" data-meridian-usage="invite-page-alert" data-meridian-variant="danger" data-meridian-state="default" data-meridian-contract-version="${escapeHtml(alertContractVersion)}" data-meridian-runtime-version="${escapeHtml(usage?.runtimeVersion ?? '0.1.0')}" data-meridian-decision="decision.page-alert"></div>
            <div id="prototype-content"></div>
          </div>
        </div>
      </div>
    </div>
  </section>
  <aside class="review-sidebar" aria-label="Design review information">
    ${visualCandidates ? `<section class="review-card"><h3>Visual candidate</h3><div id="candidate-summary" class="candidate-summary"></div><details><summary>Visual Quality Rubric</summary><ul class="rubric-list">${visualRubric.criteria.map((criterion) => `<li><span>${escapeHtml(criterion.label)}</span><strong>${criterion.weight}</strong></li>`).join('')}</ul></details></section>
    <section class="review-card"><h3>Pairwise comparison</h3><p>絶対評価ではなく、2案を同じScenarioとViewportで切り替えて選択理由を記録します。画像証跡と一致する初期Scenarioで記録します。</p><div class="pairwise-fields"><label>Comparison<select id="comparison-select" class="select"></select></label><div class="comparison-preview"><span class="tool-label">表示する案</span><div class="segmented" id="comparison-toggle"><button id="comparison-left" type="button" data-comparison-side="left" aria-pressed="true"></button><button id="comparison-right" type="button" data-comparison-side="right" aria-pressed="false"></button></div></div><label>Winner<select id="comparison-winner" class="select"></select></label><label>Reviewer<input id="visual-reviewer" class="input" autocomplete="name"></label><label>Reason<textarea id="comparison-reason" class="textarea" placeholder="どの評価軸で、なぜ優れているか"></textarea></label><button id="record-comparison" class="btn primary" type="button">比較結果を記録</button><button id="record-tiebreak" class="btn primary" type="button" hidden>同率決着として記録</button><button id="download-visual-review" class="btn secondary" type="button">Visual Review JSONを保存</button><div id="visual-review-live" class="sr-only" role="status" aria-live="polite"></div></div></section>` : ''}
    ${referenceManifest && designPrinciples && designStrategies ? `<section class="review-card"><h3>Design intelligence</h3><p>Task Evidenceから取得した${referenceManifest.references.length}件の参照を、${designPrinciples.principles.length}件の画面固有原則と3つの異なるtask modelへ変換しています。</p><details><summary>Reference provenance</summary><ul class="intelligence-list">${referenceManifest.references.map((reference) => `<li><strong>${escapeHtml(reference.product)}</strong><br><small>${escapeHtml(reference.analogyType)} · ${escapeHtml(reference.sourceType)}</small></li>`).join('')}</ul></details><details><summary>避ける設計</summary>${list(designPrinciples.antiPatterns.map((pattern) => pattern.pattern))}</details></section>` : ''}
    <section class="review-card"><h3>この設計で解くこと</h3><p>${escapeHtml(phaseOne.designBrief.problem)}</p><div class="lens-box"><h4 id="lens-title"></h4><p id="lens-guidance"></p></div></section>
    <section class="review-card"><h3>推奨方向</h3><p><strong>${escapeHtml(selectedDirection.title)}</strong></p>${list(phaseOne.designProposal.rationale)}<details open><summary>比較した方向</summary>${renderDirections(phaseOne)}</details></section>
    <section class="review-card"><h3>Research & evidence</h3><p>${escapeHtml(phaseOne.researchPack.synthesis.join(' / '))}</p><details><summary>${phaseOne.researchPack.evidence.length}件の根拠を見る</summary>${renderEvidence(phaseOne)}</details><details><summary>Limitations</summary>${list([...phaseOne.researchPack.limitations, ...phaseOne.designProposal.unresolvedItems])}</details></section>
    <section class="review-card"><h3>Review feedback</h3><p>観察事実と提案を分けて記録し、JSONとして書き出します。自動反映はされません。</p>
      <div class="feedback-grid"><label>Category<select id="feedback-category" class="select"></select></label><label>Severity<select id="feedback-severity" class="select"></select></label></div>
      <div class="feedback-field"><label for="feedback-finding">Finding<textarea id="feedback-finding" class="textarea" placeholder="何が起き、誰にどう影響するか"></textarea></label></div>
      <div class="feedback-field"><label for="feedback-recommendation">Recommendation<textarea id="feedback-recommendation" class="textarea" placeholder="どう変更すると検証できるか（任意）"></textarea></label></div>
      <button class="btn secondary" id="add-feedback" type="button">Feedbackを追加</button>
      <div id="feedback-items" class="feedback-items"></div>
      <div class="feedback-grid"><label>Review outcome<select id="review-outcome" class="select"><option value="no-decision">No decision</option><option value="approved">Approve concept</option><option value="revision-requested">Request revision</option></select></label><label>Reviewer<input id="reviewer" class="input" autocomplete="name"></label></div>
      <div class="feedback-field"><label for="review-note">Summary note<textarea id="review-note" class="textarea"></textarea></label></div>
      <div class="export-actions"><button class="btn primary" id="download-feedback" type="button">Feedback JSONを保存</button><button class="btn secondary" id="copy-feedback" type="button">JSONをコピー</button></div>
      <div id="feedback-live" class="sr-only" role="status" aria-live="polite"></div>
    </section>
    <section class="review-card"><h3>Human checks</h3>${list(manifest.acceptance.manualChecks)}<details><summary>Known limitations</summary>${list(manifest.acceptance.knownLimitations)}</details></section>
  </aside>
</main>
${browserRuntime ? `<script>${browserRuntime}</script>` : ''}
<script>window.MERIDIAN_PHASE2=${jsonForScript(runtimeData)};</script>
<script>
(function(){
  'use strict';
  var DATA=window.MERIDIAN_PHASE2;
  var H=window.MeridianHTMLRuntime;
  var state={scenario:null,rows:[],mode:'edit',errors:[],ownerConfirmed:false,feedback:[],feedbackSeq:0,sendFailures:[],candidateId:'baseline',visualComparisons:[],tieBreakComparisons:[],viewedComparisonSides:{}};
  var roles=['Owner','Admin','Member','Viewer'];
  var lensCopy={
    product:['Product lens','権限制約、Seatモデル、完了条件がBusiness Ruleと一致するか。'],
    design:['Design lens','情報の優先順位、状態遷移、誤操作からの回復が理解しやすいか。'],
    engineering:['Engineering lens','行単位state、Seat計算、部分成功が一貫した実装モデルになるか。'],
    accessibility:['Accessibility lens','Keyboard、Focus、Error association、Status announcementを確認する。'],
    content:['Content lens','Roleの影響、送信不可理由、次の行動が具体的な言葉で伝わるか。']
  };
  function byId(id){return document.getElementById(id)}
  function escape(value){var node=document.createElement('div');node.textContent=String(value);return node.innerHTML}
  function announce(message){byId('prototype-live').textContent='';requestAnimationFrame(function(){byId('prototype-live').textContent=message})}
  function option(value,label){return '<option value="'+escape(value)+'">'+escape(label)+'</option>'}
  function scenarioById(id){return DATA.scenarios.find(function(item){return item.id===id})}
  function availableSeats(){return Math.max(0,state.scenario.contractedSeats-state.scenario.acceptedMembers-state.scenario.pendingInvitations)}
  function validEmail(value){return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value)}
  function validateRows(){
    var seen={};var errors=[];
    state.rows.forEach(function(row,index){
      var message='';var normalized=row.email.trim().toLowerCase();
      if(!validEmail(normalized)) message='有効なメールアドレスを入力してください。';
      else if(seen[normalized]) message='同じ宛先がこの一覧にあります。';
      else if(row.existingState==='member') message='すでにWorkspaceへ参加しています。';
      else if(row.existingState==='pending') message='すでに招待済みです。新規送信から除外します。';
      seen[normalized]=true;
      row.error=message;row.excluded=Boolean(message);row.index=index;
      if(message) errors.push({index:index,message:message,email:row.email});
    });
    state.errors=errors;return errors;
  }
  function validRows(){validateRows();return state.rows.filter(function(row){return !row.excluded})}
  function updateSeatCards(){
    byId('seat-contracted').textContent=state.scenario.contractedSeats;
    byId('seat-accepted').textContent=state.scenario.acceptedMembers;
    byId('seat-pending').textContent=state.scenario.pendingInvitations;
    byId('seat-available').textContent=availableSeats();
  }
  function renderErrorSummary(extra){
    var box=byId('error-summary');var items=state.errors.map(function(error){return '<li><a href="#email-'+error.index+'">'+escape(error.email||('行 '+(error.index+1)))+': '+escape(error.message)+'</a></li>'});
    if(extra)items.unshift('<li>'+escape(extra)+'</li>');
    if(!items.length){box.hidden=true;box.innerHTML='';return}
    box.hidden=false;box.innerHTML='<h3>確認が必要な項目があります</h3><ul>'+items.join('')+'</ul>';
  }
  function rowStatus(row){
    if(row.error&&row.existingState==='pending')return H.fragment([H.statusIndicator({instanceId:'invite-row-status-'+row.index,usageId:'invite-row-status',variant:'warning',id:'row-status-'+row.index,decisionRef:'decision.row-status'},'招待済み · 新規対象外'),H.button({instanceId:'resend-invite-'+row.index,usageId:'invite-action',variant:'ghost',className:'resend',index:row.index,decisionRef:'decision.invite-action'},'招待を再送')]);
    if(row.error)return H.statusIndicator({instanceId:'invite-row-status-'+row.index,usageId:'invite-row-status',variant:'error',id:'row-status-'+row.index,decisionRef:'decision.row-status'},'修正が必要');
    return H.statusIndicator({instanceId:'invite-row-status-'+row.index,usageId:'invite-row-status',variant:'idle',id:'row-status-'+row.index,decisionRef:'decision.row-status'},'未検証');
  }
  function renderEdit(){
    validateRows();var owner=validRows().some(function(row){return row.role==='Owner'});var validCount=validRows().length;var seatOver=validCount>availableSeats();
    var rows=state.rows.map(function(row,index){
      var emailFieldId='invite-email-field-'+index;var emailStatusId='email-status-'+index;
      var emailMessage=row.error?H.validationMessage({instanceId:'invite-validation-message-'+index,usageId:'invite-validation-message',id:emailStatusId,variant:row.existingState==='pending'?'warning':'error',decisionRef:'decision.validation-message'},row.error):'';
      var emailControl=H.textField({instanceId:'invite-email-input-'+index,usageId:'invite-email-input',id:'email-'+index,index:index,type:'email',value:row.email,error:Boolean(row.error),className:'email-input',labelledBy:emailFieldId+'-label',describedBy:row.error?emailStatusId:null,decisionRef:'decision.email-field'});
      var emailField=H.formField({instanceId:emailFieldId,usageId:'invite-email-field',id:emailFieldId,controlId:'email-'+index,label:'招待先 '+(index+1)+' のメールアドレス',hiddenLabel:true,error:Boolean(row.error),decisionRef:'decision.form-field'},emailControl,emailMessage);
      var roleFieldId='invite-role-field-'+index;
      var roleControl=H.select({instanceId:'invite-role-select-'+index,usageId:'invite-role-select',id:'role-'+index,index:index,value:row.role,className:'role-select',labelledBy:roleFieldId+'-label',decisionRef:'decision.role-select'},roles.map(function(role){return {value:role,label:role}}));
      var roleField=H.formField({instanceId:roleFieldId,usageId:'invite-role-field',id:roleFieldId,controlId:'role-'+index,label:(row.email||('招待先 '+(index+1)))+' のRole',hiddenLabel:true,decisionRef:'decision.form-field'},roleControl,'');
      var remove=H.button({instanceId:'remove-invite-'+index,usageId:'invite-action',variant:'ghost',className:'icon-btn remove-row',index:index,ariaLabel:(row.email||('招待先 '+(index+1)))+' を削除',decisionRef:'decision.invite-action'},'×');
      return H.tableRow([{className:'email-field',content:emailField},{className:'role-field',content:roleField},{className:'status-field',content:rowStatus(row)},{className:'action-field',content:remove}]);
    });
    var seatAlert=seatOver?H.alert({instanceId:'seat-exceeded-alert',usageId:'invite-page-alert',variant:'danger',decisionRef:'decision.page-alert'},'Seatが不足しています',H.paragraph('正常な新規招待は'+validCount+'人ですが、送信できるのは'+availableSeats()+'人です。'+(validCount-availableSeats())+' Seat分を減らすか、招待中の状態を確認してください。')):'';
    var ownerAlert=owner?H.alert({instanceId:'owner-invite-alert',usageId:'invite-page-alert',variant:'warning',decisionRef:'decision.page-alert'},'Ownerを招待します',H.paragraph('Ownerは請求、権限、Workspace削除を含むすべての操作を行えます。送信前のReviewで明示的な確認が必要です。')):'';
    var head=H.tableHead(['メールアドレス','Role','Status','行の操作']);
    var table=H.table({instanceId:'invite-row-group',usageId:'invite-row-group',decisionRef:'decision.invitation-row-group'},'招待するメンバー',head,H.fragment(rows));
    var addButton=H.button({instanceId:'add-invite-row',usageId:'invite-action',id:'add-row',variant:'secondary',disabled:state.rows.length>=10,decisionRef:'decision.invite-action'},'＋ 宛先を追加');
    var cancelButton=H.button({instanceId:'cancel-invitation',usageId:'invite-action',variant:'secondary',decisionRef:'decision.invite-action'},'キャンセル');
    var reviewButton=H.button({instanceId:'review-invitation',usageId:'invite-action',id:'review-button',variant:'primary',decisionRef:'decision.invite-action'},validCount+'人の招待を確認');
    byId('prototype-content').innerHTML=seatAlert+ownerAlert+'<section class="panel" aria-labelledby="invite-list-title"><div class="panel-heading"><h3 id="invite-list-title">招待するメンバー</h3><span class="row-count">'+state.rows.length+' / 10人</span></div><div id="invite-rows">'+table+'</div><div class="panel-actions">'+addButton+'<span>'+availableSeats()+'人まで送信可能</span></div></section><div class="page-actions">'+cancelButton+reviewButton+'</div>';
    bindPrototypeControls();renderErrorSummary(seatOver?'空きSeat数を超えているため送信できません。':'');
  }
  function renderReview(){
    var valid=validRows();var owner=valid.some(function(row){return row.role==='Owner'});
    var people=valid.map(function(row){return '<div class="review-person"><span><strong>'+escape(row.email)+'</strong></span><span>'+escape(row.role)+'</span></div>'}).join('');
    var excluded=state.rows.length-valid.length;
    var ownerCheck=owner?H.checkbox({instanceId:'owner-confirmation',usageId:'owner-confirmation',id:'owner-confirm',checked:state.ownerConfirmed,label:'付与される権限と影響を理解しました',decisionRef:'decision.owner-confirmation'}):'';
    var ownerBlock=owner?H.alert({instanceId:'owner-confirmation-alert',usageId:'invite-page-alert',variant:'warning',decisionRef:'decision.page-alert'},'Owner権限の確認',H.fragment([H.paragraph('Ownerは請求、権限変更、Workspace削除を含むすべての操作を行えます。'),ownerCheck])):'';
    var backButton=H.button({instanceId:'back-to-invitation',usageId:'invite-action',id:'back-button',variant:'secondary',decisionRef:'decision.invite-action'},'入力へ戻る');
    var sendButton=H.button({instanceId:'send-invitations',usageId:'invite-action',id:'send-button',variant:'primary',disabled:owner&&!state.ownerConfirmed,decisionRef:'decision.invite-action'},valid.length+'人に招待を送信');
    byId('prototype-content').innerHTML='<section class="panel"><div class="panel-heading"><h3>招待内容を確認</h3><span class="row-count">'+valid.length+'人</span></div><div class="review-list">'+people+'</div>'+(excluded?'<p class="field-error">'+excluded+'件は新規送信の対象外です。</p>':'')+'</section>'+ownerBlock+'<div class="page-actions">'+backButton+sendButton+'</div>';
    var confirm=byId('owner-confirm');if(confirm)confirm.addEventListener('change',function(){state.ownerConfirmed=confirm.checked;var send=byId('send-button');send.disabled=!confirm.checked;send.dataset.meridianState=confirm.checked?'default':'disabled';announce(confirm.checked?'Owner権限を確認しました。':'Owner権限の確認を外しました。')});
    byId('back-button').addEventListener('click',function(){state.mode='edit';render()});
    byId('send-button').addEventListener('click',sendInvites);
  }
  function sendInvites(){
    var valid=validRows();var failed=valid.filter(function(row){return state.sendFailures.includes(row.email)});var succeeded=valid.filter(function(row){return !state.sendFailures.includes(row.email)});
    state.result={succeeded:succeeded,failed:failed,excluded:state.rows.filter(function(row){return row.excluded})};state.mode='result';state.sendFailures=[];render();
    requestAnimationFrame(function(){var result=byId('result-summary');if(result)result.focus()});
  }
  function renderResult(){
    var result=state.result;var partial=result.failed.length>0;var title=partial?'一部の招待を送信できませんでした':'招待を送信しました';var klass=partial?'warning':'success';
    var successList=result.succeeded.map(function(row){return '<li>'+escape(row.email)+' · '+escape(row.role)+'</li>'}).join('');
    var failedList=result.failed.map(function(row){return '<li>'+escape(row.email)+' · 一時的な送信エラー</li>'}).join('');
    var resultAlert=H.alert({instanceId:'invitation-result-alert',usageId:'invite-page-alert',id:'result-summary',variant:klass,tabindex:'-1',decisionRef:'decision.page-alert'},title,H.paragraph('成功 '+result.succeeded.length+'件 · 失敗 '+result.failed.length+'件 · 対象外 '+result.excluded.length+'件'));
    var restart=H.button({instanceId:'restart-invitation',usageId:'invite-action',id:'restart-button',variant:'secondary',decisionRef:'decision.invite-action'},'別の招待を作成');
    var next=partial?H.button({instanceId:'retry-invitations',usageId:'invite-action',id:'retry-button',variant:'primary',decisionRef:'decision.invite-action'},'失敗した招待を再試行'):H.button({instanceId:'return-to-members',usageId:'invite-action',variant:'primary',decisionRef:'decision.invite-action'},'メンバー一覧へ戻る');
    byId('prototype-content').innerHTML=resultAlert+'<section class="panel"><div class="result-group"><h3>送信済み</h3><ul>'+successList+'</ul></div>'+(failedList?'<div class="result-group"><h3>再試行が必要</h3><ul>'+failedList+'</ul></div>':'')+'<p>招待は7日間有効です。Pending invitationsから再送・取消できます。</p></section><div class="page-actions">'+restart+next+'</div>';
    byId('restart-button').addEventListener('click',function(){loadScenario(state.scenario.id)});
    var retry=byId('retry-button');if(retry)retry.addEventListener('click',function(){state.rows=result.failed.map(function(row){return {email:row.email,role:row.role,existingState:'new'}});state.mode='edit';render();announce('失敗した'+state.rows.length+'件だけを編集します。')});
    announce(title+'。成功'+result.succeeded.length+'件、失敗'+result.failed.length+'件。');
  }
  function bindPrototypeControls(){
    document.querySelectorAll('.email-input').forEach(function(input){input.addEventListener('input',function(){state.rows[Number(input.dataset.index)].email=input.value;state.rows[Number(input.dataset.index)].existingState='new'});input.addEventListener('blur',function(){setTimeout(rerenderPreservingFocus,0)})});
    document.querySelectorAll('.role-select').forEach(function(select){select.addEventListener('change',function(){state.rows[Number(select.dataset.index)].role=select.value;rerenderPreservingFocus()})});
    document.querySelectorAll('.remove-row').forEach(function(button){button.addEventListener('click',function(){var index=Number(button.dataset.index);state.rows.splice(index,1);if(!state.rows.length)state.rows.push({email:'',role:'Member',existingState:'new'});render();announce('宛先を削除しました。現在'+state.rows.length+'人です。')})});
    document.querySelectorAll('.resend').forEach(function(button){button.addEventListener('click',function(){announce(state.rows[Number(button.dataset.index)].email+'の既存招待を再送する操作へ進みます。')})});
    byId('add-row').addEventListener('click',function(){if(state.rows.length>=10)return;state.rows.push({email:'',role:'Member',existingState:'new'});render();requestAnimationFrame(function(){byId('email-'+(state.rows.length-1)).focus()});announce('宛先を追加しました。現在'+state.rows.length+'人です。')});
    byId('review-button').addEventListener('click',function(){var valid=validRows();var seatOver=valid.length>availableSeats();renderErrorSummary(seatOver?'空きSeat数を超えているため送信できません。':'');if(!valid.length||seatOver){byId('error-summary').focus();announce('確認が必要な項目があります。');return}state.mode='review';render();announce(valid.length+'人の招待内容を確認します。')});
  }
  function updateFlowSteps(){var active=state.mode==='edit'?0:(state.mode==='review'?1:2);document.querySelectorAll('.flow-step').forEach(function(step,index){step.classList.toggle('current',index===active);if(index===active)step.setAttribute('aria-current','step');else step.removeAttribute('aria-current')})}
  function render(){updateSeatCards();updateFlowSteps();if(state.mode==='edit')renderEdit();else if(state.mode==='review')renderReview();else renderResult()}
  function rerenderPreservingFocus(){var focused=document.activeElement&&document.activeElement.id;render();if(focused){var replacement=byId(focused);if(replacement)replacement.focus()}}
  function loadScenario(id){
    state.scenario=scenarioById(id);state.rows=JSON.parse(JSON.stringify(state.scenario.rows));state.mode='edit';state.errors=[];state.ownerConfirmed=false;state.result=null;state.sendFailures=state.scenario.sendFailureEmails.slice();byId('prototype').dataset.scenarioId=id;
    byId('scenario-select').value=id;byId('scenario-purpose').textContent=state.scenario.purpose;render();announce(state.scenario.label+' scenarioを読み込みました。')
  }
  function setupToolbar(){
    byId('scenario-select').innerHTML=DATA.scenarios.map(function(item){return option(item.id,item.label)}).join('');byId('scenario-select').addEventListener('change',function(){loadScenario(this.value)});
    byId('lens-select').innerHTML=DATA.lenses.map(function(item){return option(item,lensCopy[item][0])}).join('');byId('lens-select').addEventListener('change',function(){setLens(this.value)});
    document.querySelectorAll('.segmented [data-viewport]').forEach(function(button){button.addEventListener('click',function(){document.querySelectorAll('.segmented [data-viewport]').forEach(function(item){item.setAttribute('aria-pressed',String(item===button))});byId('prototype').dataset.viewport=button.dataset.viewport;announce(button.textContent+' canvasに切り替えました。')})});
  }
  function candidateById(id){return DATA.visualQuality.candidates.find(function(candidate){return candidate.id===id})}
  function comparisonViewKey(comparison){return comparison.id+':'+state.scenario.id+':'+byId('prototype').dataset.viewport}
  function renderCandidateSummary(candidate){
    var rounds=candidate.repairRounds.map(function(round){return '<div class="repair-round"><h4>Critique '+round.round+'</h4><p>'+escape(round.findings.map(function(item){return item.finding}).join(' / '))+'</p><strong>Repair</strong><p>'+escape(round.repairs.map(function(item){return item.change}).join(' / '))+'</p></div>'}).join('');
    var intelligence=DATA.designIntelligence;var strategy=intelligence&&intelligence.strategies.find(function(item){return item.id===candidate.strategyRef});var ground=intelligence&&intelligence.grounding.find(function(item){return item.strategyId===candidate.strategyRef});var principleLabels=intelligence?candidate.principleRefs.map(function(id){var item=intelligence.principles.find(function(principle){return principle.id===id});return item?item.principle:id}).join(' / '):'';var grounded=strategy?'<dl class="candidate-meta"><dt>Strategy</dt><dd>'+escape(strategy.label)+'</dd><dt>Task model</dt><dd>'+escape(strategy.taskModel)+'</dd><dt>Grounding</dt><dd>'+escape(ground?ground.status:'unverified')+' · '+escape(ground?ground.resolvedComponents.length:0)+' components</dd></dl><details><summary>適用原則</summary><p>'+escape(principleLabels)+'</p></details>':'<dl class="candidate-meta"><dt>Task model</dt><dd>'+escape(candidate.taskModel)+'</dd></dl>';
    byId('candidate-summary').innerHTML='<span class="tag '+(candidate.kind==='baseline'?'':'recommended')+'">'+escape(candidate.kind)+'</span><h4>'+escape(candidate.label)+'</h4><p>'+escape(candidate.hypothesis)+'</p>'+grounded+'<dl class="candidate-meta"><dt>Primary</dt><dd>'+escape(candidate.primaryAction)+'</dd></dl><p><small>Screenshot critiqueとscoreはdigest-linked review reportを参照。</small></p>'+rounds;
  }
  function syncComparisonToggle(){var comparison=selectedComparison();if(!comparison)return;document.querySelectorAll('[data-comparison-side]').forEach(function(button){button.setAttribute('aria-pressed',String(comparison[button.dataset.comparisonSide]===state.candidateId))})}
  function applyCandidate(id){var candidate=candidateById(id);if(!candidate)return;state.candidateId=id;byId('prototype').dataset.designCandidate=candidate.layout;byId('candidate-select').value=id;renderCandidateSummary(candidate);syncComparisonToggle();announce(candidate.label+'へ切り替えました。')}
  function selectedComparison(){return DATA.visualQuality.comparisons.find(function(item){return item.id===byId('comparison-select').value})}
  function applyComparisonSide(side){var comparison=selectedComparison();if(!comparison)return;var candidateId=comparison[side];var key=comparisonViewKey(comparison);state.viewedComparisonSides[key]=state.viewedComparisonSides[key]||[];if(!state.viewedComparisonSides[key].includes(side))state.viewedComparisonSides[key].push(side);document.querySelectorAll('[data-comparison-side]').forEach(function(button){button.setAttribute('aria-pressed',String(button.dataset.comparisonSide===side))});applyCandidate(candidateId)}
  function updateComparison(){var comparison=selectedComparison();if(!comparison)return;var left=candidateById(comparison.left);var right=candidateById(comparison.right);byId('comparison-winner').innerHTML=option(left.id,left.label)+option(right.id,right.label);byId('comparison-left').textContent=left.label;byId('comparison-right').textContent=right.label;applyComparisonSide('left')}
  function reviewState(){var required=DATA.visualQuality.comparisons.map(function(item){return item.id});var complete=state.visualComparisons.length===required.length;var wins=Object.fromEntries(DATA.visualQuality.candidates.map(function(item){return [item.id,0]}));state.visualComparisons.forEach(function(item){wins[item.winner]+=1});var standings=Object.entries(wins).map(function(entry){return {candidateId:entry[0],wins:entry[1]}}).sort(function(a,b){return b.wins-a.wins||a.candidateId.localeCompare(b.candidateId)});var leaders=complete?standings.filter(function(item){return item.wins===standings[0].wins}).map(function(item){return item.candidateId}):[];if(!complete)return {required:required,standings:standings,leaders:leaders,result:{state:'incomplete',winner:null}};if(leaders.length===1)return {required:required,standings:standings,leaders:leaders,result:{state:'decision-ready',winner:leaders[0]}};var tieWins=Object.fromEntries(leaders.map(function(id){return [id,0]}));var covered=new Set();state.tieBreakComparisons.forEach(function(item){if(leaders.includes(item.left)&&leaders.includes(item.right)){covered.add(item.left);covered.add(item.right);tieWins[item.winner]+=1}});var tieStanding=Object.entries(tieWins).sort(function(a,b){return b[1]-a[1]||a[0].localeCompare(b[0])});var resolved=covered.size===leaders.length&&tieStanding.length>1&&tieStanding[0][1]>tieStanding[1][1];return {required:required,standings:standings,leaders:leaders,result:resolved?{state:'decision-ready',winner:tieStanding[0][0]}:{state:'additional-comparison-required',winner:null}}}
  function visualReviewPayload(){var review=reviewState();return {schemaVersion:'0.1.0',kind:'visual-pairwise-review',conceptId:DATA.conceptId,rubricId:DATA.visualQuality.rubric.id,captureManifestRef:'examples/generated/visual-review/manifest.json',createdAt:new Date().toISOString(),reviewer:byId('visual-reviewer').value.trim(),status:review.result.state==='decision-ready'?'complete':'in-progress',requiredComparisonIds:review.required,standings:review.standings,result:review.result,comparisons:state.visualComparisons,tieBreakComparisons:state.tieBreakComparisons}}
  function updateTieBreakControl(){var review=reviewState();byId('record-tiebreak').hidden=review.result.state!=='additional-comparison-required'}
  function setupVisualQuality(){
    if(!DATA.visualQuality)return;
    byId('candidate-select').innerHTML=DATA.visualQuality.candidates.map(function(item){return option(item.id,item.label)}).join('');byId('candidate-select').addEventListener('change',function(){applyCandidate(this.value)});
    byId('comparison-select').innerHTML=DATA.visualQuality.comparisons.map(function(item){var left=candidateById(item.left);var right=candidateById(item.right);return option(item.id,left.label+' vs '+right.label)}).join('');byId('comparison-select').addEventListener('change',updateComparison);updateComparison();
    document.querySelectorAll('[data-comparison-side]').forEach(function(button){button.addEventListener('click',function(){applyComparisonSide(button.dataset.comparisonSide)})});
    function comparisonRecord(id,comparison,reviewer,reason){var viewport=byId('prototype').dataset.viewport;return {comparisonId:id,left:comparison.left,right:comparison.right,winner:byId('comparison-winner').value,reason:reason,reviewer:reviewer,scenarioId:state.scenario.id,viewport:viewport,evidenceRefs:['examples/generated/visual-review/'+comparison.left+'.'+viewport+'.png','examples/generated/visual-review/'+comparison.right+'.'+viewport+'.png'],recordedAt:new Date().toISOString()}}
    function validateComparisonInput(){var reviewer=byId('visual-reviewer').value.trim();var reason=byId('comparison-reason').value.trim();var comparison=selectedComparison();var viewed=state.viewedComparisonSides[comparisonViewKey(comparison)]||[];if(!reviewer){byId('visual-reviewer').focus();return null}if(state.scenario.id!==DATA.startScenario){byId('visual-review-live').textContent='画像証跡と同じ初期Scenarioへ戻してから記録してください。';byId('scenario-select').focus();return null}if(viewed.length<2){byId('visual-review-live').textContent='現在のScenarioとViewportで左右両方の案を表示してから記録してください。';byId('comparison-right').focus();return null}if(![comparison.left,comparison.right].includes(state.candidateId)){byId('visual-review-live').textContent='比較対象の案を表示してから記録してください。';byId('comparison-left').focus();return null}if(!reason){byId('comparison-reason').focus();return null}return {reviewer:reviewer,reason:reason,comparison:comparison}}
    byId('record-comparison').addEventListener('click',function(){var input=validateComparisonInput();if(!input)return;var existing=state.visualComparisons.findIndex(function(item){return item.comparisonId===input.comparison.id});var record=comparisonRecord(input.comparison.id,input.comparison,input.reviewer,input.reason);if(existing>=0)state.visualComparisons[existing]=record;else state.visualComparisons.push(record);byId('comparison-reason').value='';updateTieBreakControl();byId('visual-review-live').textContent='比較結果を記録しました。現在'+state.visualComparisons.length+' / '+DATA.visualQuality.comparisons.length+'件です。'});
    byId('record-tiebreak').addEventListener('click',function(){var input=validateComparisonInput();if(!input)return;var review=reviewState();if(review.result.state!=='additional-comparison-required'||!review.leaders.includes(input.comparison.left)||!review.leaders.includes(input.comparison.right)){byId('visual-review-live').textContent='同率首位の2案をComparisonで選択してください。';byId('comparison-select').focus();return}var pair=[input.comparison.left,input.comparison.right].sort().join(':');var existing=state.tieBreakComparisons.findIndex(function(item){return [item.left,item.right].sort().join(':')===pair});var id=existing>=0?state.tieBreakComparisons[existing].comparisonId:'tiebreak.'+(state.tieBreakComparisons.length+1);var record=comparisonRecord(id,input.comparison,input.reviewer,input.reason);if(existing>=0)state.tieBreakComparisons[existing]=record;else state.tieBreakComparisons.push(record);byId('comparison-reason').value='';updateTieBreakControl();var next=reviewState();byId('visual-review-live').textContent=next.result.state==='decision-ready'?'同率決着を記録し、最終候補が決まりました。':'同率候補をすべて比較するため、追加比較を続けてください。'});
    byId('download-visual-review').addEventListener('click',function(){var reviewer=byId('visual-reviewer').value.trim();if(!reviewer){byId('visual-reviewer').focus();byId('visual-review-live').textContent='Reviewerを入力してください。';return}if(!state.visualComparisons.length){byId('visual-review-live').textContent='少なくとも1件の比較結果を記録してください。';byId('record-comparison').focus();return}var payload=visualReviewPayload();var blob=new Blob([JSON.stringify(payload,null,2)+'\\n'],{type:'application/json'});var link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='visual-review_'+safeId(DATA.conceptId)+'.json';link.click();URL.revokeObjectURL(link.href);byId('visual-review-live').textContent='Visual Review JSONを書き出しました。'});
    var requested=new URLSearchParams(location.search).get('candidate');applyCandidate(candidateById(requested)?requested:DATA.visualQuality.baselineId);
  }
  function setLens(id){byId('lens-title').textContent=lensCopy[id][0];byId('lens-guidance').textContent=lensCopy[id][1]}
  function setupFeedback(){
    byId('feedback-category').innerHTML=DATA.feedback.categories.map(function(item){return option(item,item)}).join('');byId('feedback-severity').innerHTML=DATA.feedback.severities.map(function(item){return option(item,item)}).join('');
    byId('add-feedback').addEventListener('click',function(){var finding=byId('feedback-finding').value.trim();if(!finding){byId('feedback-finding').focus();return}state.feedbackSeq+=1;state.feedback.push({id:'feedback_'+String(state.feedbackSeq).padStart(2,'0'),category:byId('feedback-category').value,severity:byId('feedback-severity').value,scenarioId:state.scenario.id,finding:finding,recommendation:byId('feedback-recommendation').value.trim(),status:'candidate'});byId('feedback-finding').value='';byId('feedback-recommendation').value='';renderFeedback();byId('feedback-live').textContent='Feedbackを追加しました。'});
    byId('download-feedback').addEventListener('click',function(){var payload=feedbackPayload();var blob=new Blob([JSON.stringify(payload,null,2)+'\\n'],{type:'application/json'});var link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=payload.meta.id+'.json';link.click();URL.revokeObjectURL(link.href);byId('feedback-live').textContent='Feedback JSONを書き出しました。'});
    byId('copy-feedback').addEventListener('click',async function(){var value=JSON.stringify(feedbackPayload(),null,2);try{await navigator.clipboard.writeText(value);byId('feedback-live').textContent='Feedback JSONをコピーしました。'}catch(error){byId('feedback-live').textContent='Clipboardへコピーできませんでした。保存を利用してください。'}});
  }
  function renderFeedback(){byId('feedback-items').innerHTML=state.feedback.map(function(item,index){return '<div class="feedback-item"><button type="button" data-feedback-index="'+index+'" aria-label="Feedbackを削除">×</button><strong>'+escape(item.severity)+' · '+escape(item.category)+'</strong><div>'+escape(item.finding)+'</div><small>'+escape(item.scenarioId)+'</small></div>'}).join('');document.querySelectorAll('[data-feedback-index]').forEach(function(button){button.addEventListener('click',function(){state.feedback.splice(Number(button.dataset.feedbackIndex),1);renderFeedback()})})}
  function safeId(value){return value.toLowerCase().replace(/[^a-z0-9_-]+/g,'_').replace(/^_+|_+$/g,'')||'anonymous'}
  function feedbackPayload(){return {meta:{schemaVersion:'0.1.0',kind:'phase-2-feedback',id:'feedback_'+safeId(DATA.conceptId)+'_'+new Date().toISOString().slice(0,10).replaceAll('-','_'),conceptId:DATA.conceptId,sourcePackageId:DATA.sourcePackageId,createdAt:new Date().toISOString(),reviewer:byId('reviewer').value.trim()},summary:{outcome:byId('review-outcome').value,note:byId('review-note').value.trim()},entries:state.feedback}}
  setupToolbar();setupFeedback();loadScenario(DATA.startScenario);setupVisualQuality();setLens(DATA.lenses[0]);
})();
</script>
</body>
</html>
`;
}
