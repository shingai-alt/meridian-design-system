function safeJson(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

function layoutCss() {
  return `
*{box-sizing:border-box}
body{margin:0;color:var(--fg);background:var(--bg);font:var(--type-body)}
button,input,select{font:inherit}
.mrd-generic-shell{min-height:100vh}
.mrd-generic-toolbar{position:sticky;z-index:10;top:0;display:flex;flex-wrap:wrap;gap:var(--sp-3);align-items:end;padding:var(--sp-3) var(--page-pad-inline);background:var(--surface);border-bottom:1px solid var(--border)}
.mrd-generic-toolbar label{display:grid;gap:var(--sp-1);color:var(--fg-muted);font:var(--type-label)}
.mrd-generic-toolbar select{min-block-size:var(--ctl-md);padding-inline:var(--sp-2);color:var(--fg);background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm)}
.mrd-generic-main{padding:var(--page-pad-block) var(--page-pad-inline)}
.mrd-generic-viewport{inline-size:100%;max-inline-size:var(--content-wide);margin-inline:auto;transition:inline-size var(--dur-fast) var(--ease-standard)}
.mrd-generic-viewport[data-viewport="tablet"]{inline-size:min(100%,48rem)}
.mrd-generic-viewport[data-viewport="mobile"]{inline-size:min(100%,23.4375rem)}
.mrd-generic-screen{display:grid;gap:var(--section-gap)}
.mrd-generic-provenance{margin-block-start:var(--section-gap);padding:var(--sp-3);color:var(--fg-muted);background:var(--surface-muted);border-radius:var(--radius-md);font:var(--type-body-sm)}
.mrd-layout-stack,.mrd-layout-section{display:grid;gap:var(--layout-gap,var(--sp-4))}
.mrd-layout-stack[data-width="narrow"]{max-inline-size:var(--reading-max)}
.mrd-layout-stack[data-width="content"]{max-inline-size:var(--content-max)}
.mrd-layout-stack[data-width="wide"]{max-inline-size:var(--content-wide)}
.mrd-layout-cluster{display:flex;flex-wrap:wrap;gap:var(--layout-gap,var(--sp-4));align-items:var(--layout-align,center);justify-content:var(--layout-justify,flex-start)}
.mrd-layout-grid{display:grid;grid-template-columns:repeat(var(--layout-columns,2),minmax(0,1fr));gap:var(--layout-gap,var(--sp-4))}
.mrd-layout-section[data-emphasis="subtle"]{padding:var(--sp-4);background:var(--surface-muted);border-radius:var(--radius-lg)}
.mrd-layout-section[data-emphasis="bordered"]{padding:var(--sp-4);background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg)}
.mrd-layout-responsive-switch{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--layout-gap,var(--sp-4))}
.mrd-layout-responsive-switch[data-wide-layout="split"]{grid-template-columns:minmax(0,2fr) minmax(0,1fr)}
[data-gap="compact"]{--layout-gap:var(--sp-2)}[data-gap="default"]{--layout-gap:var(--sp-4)}[data-gap="relaxed"]{--layout-gap:var(--sp-6)}
[data-columns="two"]{--layout-columns:2}[data-columns="three"]{--layout-columns:3}[data-columns="auto-fit"]{grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr))}
[data-justify="start"]{--layout-justify:flex-start}[data-justify="between"]{--layout-justify:space-between}[data-justify="end"]{--layout-justify:flex-end}
[data-align="start"]{--layout-align:flex-start}[data-align="center"]{--layout-align:center}[data-align="end"]{--layout-align:flex-end}
.mrd-generic-heading{margin:0}
.mrd-generic-text{margin:0}.mrd-generic-text[data-tone="muted"]{color:var(--fg-muted)}.mrd-generic-text[data-tone="danger"]{color:var(--danger-fg)}.mrd-generic-text[data-tone="success"]{color:var(--success-fg)}
.mrd-generic-fields{display:grid;gap:var(--sp-3)}
.mrd-generic-actions{display:flex;flex-wrap:wrap;gap:var(--sp-2);justify-content:flex-end}
.mrd-generic-progress{display:flex;gap:var(--sp-4);padding:0;list-style:none}
.mrd-generic-empty{padding:var(--sp-6);color:var(--fg-muted);text-align:center;border:1px dashed var(--border);border-radius:var(--radius-md)}
body[data-meridian-visual-profile="dense-operations"] .mrd-generic-main{--section-gap:var(--sp-4);--page-pad-block:var(--sp-4)}
body[data-meridian-visual-profile="dense-operations"] .mrd-generic-screen{gap:var(--sp-4)}
body[data-meridian-visual-profile="dense-operations"] .mrd-layout-stack,
body[data-meridian-visual-profile="dense-operations"] .mrd-layout-section{--layout-gap:var(--sp-2)}
body[data-meridian-visual-profile="dense-operations"] [data-meridian-presentation="status-list"] th,
body[data-meridian-visual-profile="dense-operations"] [data-meridian-presentation="status-list"] td{padding:var(--sp-2)}
body[data-meridian-visual-profile="expressive-workspace"] .mrd-generic-main{--section-gap:var(--sp-8);--page-pad-block:var(--sp-8)}
body[data-meridian-visual-profile="expressive-workspace"] .mrd-generic-screen{gap:var(--sp-8)}
body[data-meridian-visual-profile="expressive-workspace"] .mrd-layout-stack,
body[data-meridian-visual-profile="expressive-workspace"] .mrd-layout-section{--layout-gap:var(--sp-6)}
body[data-meridian-visual-profile="expressive-workspace"] .mrd-generic-heading{font:var(--type-display)}
@media(max-width:48rem){.mrd-layout-grid[data-collapse-at="tablet"],.mrd-layout-responsive-switch[data-breakpoint="tablet"]{grid-template-columns:1fr}.mrd-generic-progress{display:grid}.mrd-generic-toolbar{position:static}}
@media(max-width:30rem){.mrd-layout-grid[data-collapse-at="mobile"],.mrd-layout-responsive-switch[data-breakpoint="mobile"]{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){.mrd-generic-viewport{transition:none}}
`;
}

function runtimeControllerSource() {
  return `(function(){
  'use strict';
  var MODEL=window.MERIDIAN_GENERIC_MODEL;
  var H=window.MeridianHTMLRuntime;
  var recipeClasses=window.MERIDIAN_LAYOUT_CLASSES;
  var screenSelect=document.getElementById('generic-screen');
  var fixtureSelect=document.getElementById('generic-fixture');
  var viewportSelect=document.getElementById('generic-viewport-select');
  var root=document.getElementById('generic-review-root');
  var viewport=document.getElementById('generic-viewport');
  function esc(value){return H.escape(value)}
  function usage(id,extra){var item=MODEL.usageIndex[id];if(!item)throw new Error('GENERIC_USAGE_UNKNOWN: '+id);return Object.assign({instanceId:id,usageId:id,decisionRef:item.decisionRef},extra||{})}
  function options(node){var result={};(node.options||[]).forEach(function(item){result[item.name]=item.value});return result}
  function attrs(values){return Object.keys(values).map(function(key){return values[key]?' data-'+key+'="'+esc(values[key])+'"':''}).join('')}
  function findNode(node,id){if(node.id===id)return node;for(var child of node.children||[]){var found=findNode(child,id);if(found)return found}return null}
  function cloneScreen(screen){return JSON.parse(JSON.stringify(screen))}
  function applyFixture(screen,fixture){var cloned=cloneScreen(screen);function mark(node){if(node.kind==='capability')node.fixtureState=fixture.state;(node.children||[]).forEach(mark)}mark(cloned.root);(fixture.overrides||[]).forEach(function(override){var node=findNode(cloned.root,override.nodeRef);if(!node)return;if(override.property==='state')node.fixtureState=override.value;else{var parts=override.property.split('.');var target=node;for(var i=0;i<parts.length-1;i++)target=target[parts[i]];target[parts.at(-1)]=override.value}});return cloned}
  function statusVariant(status){return {success:'success',loading:'running',pending:'running',warning:'warning',permission:'warning',error:'error',disabled:'idle',default:'idle',empty:'idle'}[status]||'idle'}
  function statusLabel(status){return {success:'完了',loading:'処理中',pending:'招待中',warning:'注意',permission:'権限が必要',error:'エラー',disabled:'利用不可',default:'未処理',empty:'なし'}[status]||status}
  function renderLayout(node){var opts=options(node);var cls=recipeClasses[node.recipeRef];if(!cls)throw new Error('GENERIC_RECIPE_UNKNOWN: '+node.recipeRef);var tag=node.recipeRef==='section'?'section':'div';return '<'+tag+' class="'+cls+'"'+attrs(opts)+' data-meridian-layout-recipe="'+esc(node.recipeRef)+'" data-meridian-decision="'+esc(node.decisionRef)+'">'+node.children.map(renderNode).join('')+'</'+tag+'>'}
  function renderField(node,field,plan,index){var error=field.state==='error'||(node.fixtureState==='error'&&index===0);var disabled=field.state==='disabled'||node.fixtureState==='permission';var controlId=plan.control;var control;if(field.options&&field.options.length){control=H.select(usage(controlId,{id:controlId,value:field.value,error:error,disabled:disabled,labelledBy:plan.field+'-label',describedBy:error?plan.message:null}),field.options.map(function(item){return {value:item.value||item.id,label:item.label}}))}else{control=H.textField(usage(controlId,{id:controlId,value:node.fixtureState==='empty'?'':field.value,error:error,disabled:disabled,labelledBy:plan.field+'-label',describedBy:error?plan.message:null}))}var message=error?H.validationMessage(usage(plan.message,{id:plan.message,variant:'error'}),field.message||'入力内容を確認してください'):'';return String(H.formField(usage(plan.field,{id:plan.field,controlId:controlId,label:field.label,error:error}),control,message))}
  function renderCapability(node){var c=node.content||{};var state=node.fixtureState||'default';var u=node.usages||{};
    if(node.presentation==='action')return String(H.button(usage(u.action,{variant:'primary',loading:state==='loading',disabled:state==='permission'||state==='disabled'}),c.label));
    if(node.presentation==='field-validation')return String(H.validationMessage(usage(u.message,{variant:'error'}),c.body));
    if(node.presentation==='section-status'){var tone=state==='error'?'danger':(state==='permission'?'warning':(c.tone||'info'));var body=H.paragraph(c.body);var alert=H.alert(usage(u.alert,{variant:tone,role:state==='error'?'alert':null}),c.title,body);var action=c.actionLabel?H.button(usage(u.action,{variant:'secondary',disabled:state==='permission',loading:state==='loading'}),c.actionLabel):'';return String(H.fragment([alert,action]))}
    if(node.presentation==='task-progress')return '<ol class="mrd-generic-progress">'+c.steps.map(function(step,index){var stepState=state==='error'&&index===0?'error':step.state;return String(H.workflowStep(usage(u.steps[index],{state:stepState}),step.label,step.description))}).join('')+'</ol>';
    if(node.presentation==='status-list'){var rows=state==='empty'?[]:c.rows;var headers=c.columns.map(function(column){return column.label}).concat(['操作']);var head=H.tableHead(headers);var body=H.fragment(rows.map(function(row,index){var status=state==='loading'?'loading':(state==='permission'?'permission':(state==='error'?'error':row.status));var cells=c.columns.map(function(column){var cell=row.cells.find(function(item){return item.columnRef===column.id});if(column.id==='status')return {content:H.statusIndicator(usage(u.rows[index].status,{variant:statusVariant(status)}),state==='default'&&cell&&cell.value?cell.value:statusLabel(status))};return {content:H.paragraph(cell?cell.value:'')}});cells.push({content:u.rows[index].action?H.button(usage(u.rows[index].action,{variant:'secondary',disabled:state==='permission'||state==='error',loading:state==='loading'}),row.actionLabel):H.paragraph('')});return H.tableRow(cells)}));var table=H.table(usage(u.table,{state:state==='loading'?'loading':(rows.length?'default':'empty')}),node.id,head,body);return rows.length?String(table):String(H.fragment([table,H.paragraph('表示する項目がありません')]))}
    if(node.presentation==='confirmation'){var dialogId=node.id+'-dialog';var trigger=H.button(usage(u.trigger,{id:node.id+'-trigger',variant:'primary',ariaHaspopup:'dialog',ariaControls:dialogId,ariaExpanded:'false',disabled:state==='permission'}),c.actionLabel);var summary=H.descriptionList(usage(u.summary,{ariaLabel:c.title}),c.items.map(function(item){return {term:item.label,description:item.value||item.description||''}}));var cancel=H.button(usage(u.cancel,{variant:'secondary'}),'キャンセル');var confirm=H.button(usage(u.confirm,{variant:'primary',loading:state==='loading',disabled:state==='permission'}),c.actionLabel);var dialog=H.dialog(usage(u.dialog,{id:dialogId,state:state==='error'?'error':'closed',variant:state==='error'?'danger':'default'}),c.title,H.fragment([c.description?H.paragraph(c.description):'',summary]),H.fragment([cancel,confirm]));return String(H.fragment([trigger,dialog]))}
    if(['text-input','choice-input','editable-collection'].includes(node.presentation)){var fields=state==='empty'?c.fields.map(function(field){return Object.assign({},field,{value:''})}):c.fields;var rendered=fields.map(function(field,index){return renderField(node,field,u.fields[index],index)}).join('');var action=u.action?String(H.button(usage(u.action,{variant:'secondary',disabled:state==='permission'}),c.actionLabel)):'';return '<div class="mrd-generic-fields">'+rendered+action+'</div>'}
    throw new Error('GENERIC_PRESENTATION_UNKNOWN: '+node.presentation)
  }
  function renderNode(node){if(node.kind==='layout')return renderLayout(node);if(node.kind==='heading')return '<h'+node.level+' class="mrd-generic-heading" data-meridian-decision="'+esc(node.decisionRef)+'">'+esc(node.text)+'</h'+node.level+'>';if(node.kind==='text')return '<p class="mrd-generic-text" data-tone="'+esc(node.tone||'default')+'" data-meridian-decision="'+esc(node.decisionRef)+'">'+esc(node.text)+'</p>';return '<div data-meridian-capability="'+esc(node.capabilityRequirementRef)+'" data-meridian-presentation="'+esc(node.presentation)+'">'+renderCapability(node)+'</div>'}
  function bindDialogs(){document.querySelectorAll('button[aria-haspopup="dialog"][aria-controls]').forEach(function(trigger){trigger.addEventListener('click',function(){H.openDialog(trigger.getAttribute('aria-controls'),trigger)})});document.querySelectorAll('.mrd-dialog__footer button[data-meridian-variant="secondary"]').forEach(function(button){button.addEventListener('click',function(){var dialog=button.closest('dialog');if(dialog)H.closeDialog(dialog.id)})})}
  function availableFixtures(screenId){return MODEL.stateFixtures.filter(function(fixture){return fixture.screenRefs.includes(screenId)})}
  function syncFixtures(){var selected=fixtureSelect.value;var available=availableFixtures(screenSelect.value);fixtureSelect.replaceChildren();available.forEach(function(fixture){fixtureSelect.add(new Option(fixture.label,fixture.id))});if(available.some(function(fixture){return fixture.id===selected}))fixtureSelect.value=selected}
  function render(){var screen=MODEL.screens.find(function(item){return item.id===screenSelect.value})||MODEL.screens[0];var fixture=availableFixtures(screen.id).find(function(item){return item.id===fixtureSelect.value})||availableFixtures(screen.id)[0];if(!fixture)throw new Error('GENERIC_FIXTURE_MISSING: '+screen.id);var prepared=applyFixture(screen,fixture);root.innerHTML='<article class="mrd-generic-screen" data-screen="'+esc(prepared.id)+'" data-state="'+esc(fixture.state)+'">'+renderNode(prepared.root)+'</article>';viewport.dataset.viewport=viewportSelect.value;bindDialogs();document.getElementById('generic-status').textContent=prepared.title+' · '+fixture.label+' · '+viewportSelect.value}
  MODEL.screens.forEach(function(screen){screenSelect.add(new Option(screen.title,screen.id))});MODEL.review.viewports.forEach(function(item){viewportSelect.add(new Option(item,item))});syncFixtures();
  screenSelect.addEventListener('change',function(){syncFixtures();render()});fixtureSelect.addEventListener('change',render);viewportSelect.addEventListener('change',render);render();
})();`;
}

export function renderGenericReviewHtml({
  model,
  usage,
  runtimeSource,
  tokensCss,
  runtimeCss,
  layoutRegistry,
}) {
  const classes = Object.fromEntries(layoutRegistry.recipes.map((recipe) => [recipe.id, recipe.className]));
  const firstScreen = model.screens[0];
  return `<!doctype html>
<html lang="${model.meta.locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${firstScreen.title} · Meridian Generic Review</title>
<style>${tokensCss}
${runtimeCss}
${layoutCss()}</style>
</head>
<body data-meridian-visual-profile="${model.source.visualProfileRef}">
<div class="mrd-generic-shell">
  <header class="mrd-generic-toolbar" aria-label="Review controls">
    <label>Screen<select id="generic-screen"></select></label>
    <label>State<select id="generic-fixture"></select></label>
    <label>Viewport<select id="generic-viewport-select"></select></label>
    <p id="generic-status" role="status"></p>
  </header>
  <main class="mrd-generic-main">
    <div id="generic-viewport" class="mrd-generic-viewport" data-viewport="desktop">
      <div id="generic-review-root"></div>
      <details class="mrd-generic-provenance">
        <summary>Generation provenance</summary>
        <p>Manifest: ${model.source.generationManifestId}</p>
        <p>Adapter: ${model.source.adapterRefs.join(', ')}</p>
        <p>Visual profile: ${model.source.visualProfileRef}</p>
        <p>Runtime: ${model.source.runtimeVersion}</p>
        <p>Validation: ${usage.validationDigest}</p>
      </details>
    </div>
  </main>
</div>
<script>window.MERIDIAN_GENERIC_MODEL=${safeJson(model)};window.MERIDIAN_GENERIC_USAGE=${safeJson(usage)};window.MERIDIAN_LAYOUT_CLASSES=${safeJson(classes)};</script>
<script>${runtimeSource}</script>
<script>${runtimeControllerSource()}</script>
</body>
</html>
`;
}
