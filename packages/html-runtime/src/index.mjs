export { auditRendererUsage, createUsageManifest, digest, stableStringify, validateComposition } from './harness-core.mjs';

export const RUNTIME_VERSION = '0.1.0';

export const RUNTIME_DEFINITIONS = {
  button: { renderer: 'button', rootElements: ['button'] },
  'text-field': { renderer: 'textField', rootElements: ['input'] },
  select: { renderer: 'select', rootElements: ['select'] },
  'form-field': { renderer: 'formField', rootElements: ['div'] },
  'validation-message': { renderer: 'validationMessage', rootElements: ['span', 'div'] },
  checkbox: { renderer: 'checkbox', rootElements: ['input'] },
  alert: { renderer: 'alert', rootElements: ['div', 'section'] },
  'status-indicator': { renderer: 'statusIndicator', rootElements: ['span'] },
  table: { renderer: 'table', rootElements: ['table'] },
};

export function browserRuntimeSource(registry, composition) {
  const versions = Object.fromEntries(registry.components.map((component) => [component.id, component.contractVersion]));
  const policy = Object.fromEntries(composition.nodes.map((node) => [node.instanceId, {
    component: node.component,
    decisionRef: node.decisionRef,
    allowedVariants: node.allowedVariants,
    allowedStates: node.allowedStates,
  }]));
  return `(function(global){
  'use strict';
  var VERSION=${JSON.stringify(RUNTIME_VERSION)};
  var CONTRACTS=${JSON.stringify(versions)};
  var POLICY=${JSON.stringify(policy)};
  var RENDERED=new Map();
  var SAFE=Symbol('MeridianSafeHTML');
  function esc(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#39;')}
  function mark(html){var value={html:html,toString:function(){return html}};value[SAFE]=true;return Object.freeze(value)}
  function unwrap(value){return value&&value[SAFE]===true?value.html:esc(value)}
  function fragment(values){return mark((values||[]).map(unwrap).join(''))}
  function paragraph(value){return mark('<p>'+esc(value)+'</p>')}
  function attr(name,value){if(value===false||value==null)return '';if(value===true)return ' '+name;return ' '+name+'="'+esc(value)+'"'}
  function meta(component,config){
    var c=config||{};var state=c.state||'default';var variant=c.variant||'default';
    var usageId=c.usageId||c.instanceId;var policy=POLICY[usageId];
    if(!policy)throw new Error('USAGE_TEMPLATE_UNKNOWN: '+usageId);
    if(policy.component!==component)throw new Error('USAGE_COMPONENT_MISMATCH: '+usageId+' expected '+policy.component+', received '+component);
    if(policy.decisionRef!==c.decisionRef)throw new Error('USAGE_DECISION_MISMATCH: '+usageId);
    if(!policy.allowedVariants.includes(variant))throw new Error('USAGE_VARIANT_NOT_ALLOWED: '+usageId+' '+variant);
    if(!policy.allowedStates.includes(state))throw new Error('USAGE_STATE_NOT_ALLOWED: '+usageId+' '+state);
    RENDERED.set(c.instanceId,{component:component,instanceId:c.instanceId,usageId:usageId,variant:variant,state:state,contractVersion:CONTRACTS[component],runtimeVersion:VERSION,decisionRef:c.decisionRef});
    return attr('data-meridian-component',component)+attr('data-meridian-instance',c.instanceId)+attr('data-meridian-usage',usageId)+attr('data-meridian-variant',variant)+attr('data-meridian-state',state)+attr('data-meridian-contract-version',CONTRACTS[component])+attr('data-meridian-runtime-version',VERSION)+attr('data-meridian-decision',c.decisionRef);
  }
  function button(c,label){var state=c.loading?'loading':(c.disabled?'disabled':(c.state||'default'));var variant=c.variant||'secondary';return mark('<button type="button" class="mrd-button btn '+esc(variant)+(c.className?' '+esc(c.className):'')+'"'+attr('id',c.id)+attr('data-index',c.index)+attr('aria-label',c.ariaLabel)+attr('aria-busy',c.loading?'true':null)+attr('disabled',c.disabled||c.loading)+meta('button',Object.assign({},c,{state:state,variant:variant}))+'>'+esc(label)+'</button>')}
  function textField(c){var state=c.error?'error':(c.disabled?'disabled':(c.state||'default'));return mark('<input class="mrd-text-field input '+esc(c.className||'')+'"'+attr('id',c.id)+attr('data-index',c.index)+attr('type',c.type||'text')+attr('value',c.value)+attr('placeholder',c.placeholder)+attr('disabled',c.disabled)+attr('readonly',c.readonly)+attr('aria-invalid',c.error?'true':null)+attr('aria-labelledby',c.labelledBy)+attr('aria-describedby',c.describedBy)+meta('text-field',Object.assign({},c,{state:state,variant:'default'}))+'>')}
  function select(c,options){var state=c.error?'error':(c.disabled?'disabled':(c.state||'default'));return mark('<select class="mrd-select select '+esc(c.className||'')+'"'+attr('id',c.id)+attr('data-index',c.index)+attr('disabled',c.disabled)+attr('aria-invalid',c.error?'true':null)+attr('aria-labelledby',c.labelledBy)+attr('aria-describedby',c.describedBy)+meta('select',Object.assign({},c,{state:state,variant:'default'}))+'>'+options.map(function(option){return '<option value="'+esc(option.value)+'"'+(option.value===c.value?' selected':'')+'>'+esc(option.label)+'</option>'}).join('')+'</select>')}
  function formField(c,control,message){var labelId=c.id+'-label';return mark('<div class="mrd-form-field '+esc(c.className||'')+'"'+meta('form-field',Object.assign({},c,{state:c.error?'error':'default',variant:'default'}))+'><label id="'+esc(labelId)+'" class="'+(c.hiddenLabel?'sr-only':'mrd-form-field__label')+'" for="'+esc(c.controlId)+'">'+esc(c.label)+'</label>'+unwrap(control)+unwrap(message||'')+'</div>')}
  function validationMessage(c,message){var symbol=c.variant==='error'?'!':(c.variant==='success'?'✓':'!');return mark('<span class="mrd-validation-message field-error"'+attr('id',c.id)+meta('validation-message',Object.assign({},c,{state:'default'}))+'><span aria-hidden="true">'+symbol+'</span> '+esc(message)+'</span>')}
  function checkbox(c){var state=c.disabled?'disabled':(c.checked?'checked':'default');return mark('<label class="mrd-checkbox owner-check"><input type="checkbox"'+attr('id',c.id)+attr('checked',c.checked)+attr('disabled',c.disabled)+attr('aria-describedby',c.describedBy)+meta('checkbox',Object.assign({},c,{state:state,variant:'default'}))+'><span>'+esc(c.label)+'</span></label>')}
  function alert(c,title,body){var titleId=c.instanceId+'-title';return mark('<div class="mrd-alert alert '+esc(c.variant)+(c.className?' '+esc(c.className):'')+'"'+attr('id',c.id)+attr('tabindex',c.tabindex)+attr('role',c.role)+attr('aria-labelledby',titleId)+meta('alert',Object.assign({},c,{state:'default'}))+'><h3 id="'+esc(titleId)+'">'+esc(title)+'</h3>'+unwrap(body)+'</div>')}
  function statusIndicator(c,label){var symbols={success:'✓',running:'…',warning:'!',error:'×',idle:'•'};return mark('<span class="mrd-status-indicator row-status '+esc(c.variant)+'"'+attr('id',c.id)+meta('status-indicator',Object.assign({},c,{state:'default'}))+'><span aria-hidden="true">'+symbols[c.variant]+'</span><span>'+esc(label)+'</span></span>')}
  function tableHead(labels){return mark('<tr class="invite-head">'+labels.map(function(label,index){return '<th scope="col">'+(index===labels.length-1?'<span class="sr-only">'+esc(label)+'</span>':esc(label))+'</th>'}).join('')+'</tr>')}
  function tableRow(cells){return mark('<tr class="invite-row">'+cells.map(function(cell){return '<td class="'+esc(cell.className||'')+'">'+unwrap(cell.content)+'</td>'}).join('')+'</tr>')}
  function table(c,caption,head,body){return mark('<table class="mrd-table invite-table"'+meta('table',Object.assign({},c,{state:c.state||'default',variant:'default'}))+'><caption class="sr-only">'+esc(caption)+'</caption><thead>'+unwrap(head)+'</thead><tbody>'+unwrap(body)+'</tbody></table>')}
  global.MeridianHTMLRuntime={version:VERSION,escape:esc,meta:meta,fragment:fragment,paragraph:paragraph,button:button,textField:textField,select:select,formField:formField,validationMessage:validationMessage,checkbox:checkbox,alert:alert,statusIndicator:statusIndicator,tableHead:tableHead,tableRow:tableRow,table:table,renderedUsage:function(){return Array.from(RENDERED.values())}};
})(window);`;
}
