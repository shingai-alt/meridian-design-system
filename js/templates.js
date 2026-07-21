"use strict";
/* ============ Templates ============ */
const TEMPLATES={};
function defTpl(id,name,desc,fn,notes){TEMPLATES[id]={name,desc,fn,notes};
  docPage('templates/'+id,()=>{
    return shell(`
${head('Templates',name,desc)}
<div class="rowflex" style="margin-bottom:var(--sp-3);gap:var(--sp-2)">
<span style="font-size:var(--text-small);color:var(--fg-subtle)">Viewport:</span>
<div class="seg" id="tpl-vp-seg">${[['desktop','Desktop'],['tablet','Tablet'],['mobile','Mobile']].map(([v,l],i)=>`<button aria-pressed="${i===0}" data-vp="${v}">${l}</button>`).join('')}</div>
<span style="font-size:var(--text-small);color:var(--fg-subtle);margin-left:auto">テーマ・密度・Seed は右上のコントロールに連動します</span>
</div>
<div class="tpl-frame"><div class="tpl-vp" id="tpl-vp" style="max-width:100%">${fn('desktop')}</div></div>
${notes?`${h2('構成メモ')}<ul class="plain">${notes.map(n=>`<li>${n}</li>`).join('')}</ul>`:''}
${h2('使用しているコンポーネント')}
<p class="muted" style="font-size:var(--text-small)">このテンプレートは Meridian のトークンとコンポーネントのみで構成されています。直接の hex・固定 px は使用していません。</p>
`,{wide:true})})}

function tplShell(vp,side,main,topExtra=''){
  const narrow=vp==='mobile';
  return `<div class="tpl-shell ${narrow?'narrow':''}">
  ${narrow?'':`<aside class="tpl-side">${side}</aside>`}
  <div class="tpl-main">
    <div class="tpl-top">${narrow?`<button class="tb-btn" aria-label="メニュー">${I.menu}</button>`:''}${topExtra}</div>
    <div class="tpl-body">${main}</div>
  </div></div>`}
function tplSide(active){
  const it=(ic,l,on,b)=>`<div class="tsb-item ${on?'on':''}">${ic} ${l}${b?`<span style="margin-left:auto;font-size:9.5px;background:var(--primary-subtle);color:var(--primary);padding:0 6px;border-radius:var(--radius-full);font-weight:600">${b}</span>`:''}</div>`;
  return `<button class="tsb-item" style="font-weight:600;width:100%;margin-bottom:6px">${avatar({name:'AC',size:'xs'})} Acme Inc. <span style="margin-left:auto">${I.chevD}</span></button>
  <div class="tsb-hd">Workspace</div>
  ${it(I.zap,'ダッシュボード',active==='dash')}${it(I.folder,'プロジェクト',active==='proj','12')}${it(I.file,'Issues',active==='issues','48')}${it(I.spark,'AI Workspace',active==='ai')}
  <div class="tsb-hd">Organization</div>
  ${it(I.users,'メンバー',active==='team')}${it(I.cal,'Billing',active==='billing')}${it(I.gear,'設定',active==='settings')}
  <div style="margin-top:16px;border-top:1px solid var(--border-muted);padding-top:8px">${it('',`${avatar({name:'SN',size:'xs'})} 新谷`,false)}</div>`}
const topSearch=(title)=>`${crumbsEl({items:['Acme',title]})}<div style="margin-left:auto"></div><div class="input" data-size="sm" style="width:200px"><span class="affix">${I.search}</span><input placeholder="検索"><span class="affix"><kbd style="border:1px solid var(--border);border-radius:var(--radius-2xs);padding:0 4px;font-size:9px">⌘K</kbd></span></div><button class="tb-btn" aria-label="通知">${I.bell}</button>${avatar({name:'SN',size:'sm'})}`;

defTpl('saas-dashboard','SaaS Dashboard','KPI → チャート → 明細の標準ダッシュボード構成。',vp=>tplShell(vp,tplSide('dash'),`
<div class="rowflex" style="justify-content:space-between;margin-bottom:var(--sp-4)">
<div><h2 style="font-size:19px;font-weight:650;letter-spacing:-.015em">ダッシュボード</h2><span style="font-size:var(--text-small);color:var(--fg-subtle)">過去 30 日 · Production</span></div>
<div class="rowflex">${segEl({items:['7日','30日','90日'],active:1})}${btn({label:'フィルタ',variant:'secondary',size:'sm'})}${btn({label:'レポート作成',size:'sm'})}</div></div>
<div class="grid4" style="margin-bottom:var(--sp-4)">
${kpiEl({label:'MRR',value:'¥2,840,000',delta:'+12.4%'})}${kpiEl({label:'アクティブユーザー',value:'12,480',delta:'+8.2%'})}${kpiEl({label:'API リクエスト',value:'1.24M',delta:'+18.9%'})}${kpiEl({label:'エラー率',value:'0.42%',delta:'-0.11pt',dir:'down'})}
</div>
<div class="grid2" style="margin-bottom:var(--sp-4);align-items:stretch">${chartContainerEl()}${activityFeedEl()}</div>
${tableEl({selectable:true})}
`,topSearch('ダッシュボード')),
['1 段目: KPI Card × 4。健全性を 3 秒で判断できる指標に絞る。','2 段目: Chart Container + Activity Feed。','3 段目: サービステーブル(選択・状態列つき)。','フィルタと期間切替はページヘッダーに集約。']);

defTpl('analytics-dashboard','Analytics Dashboard','期間・セグメント指定つきの分析ダッシュボード。',vp=>tplShell(vp,tplSide('dash'),`
<div class="rowflex" style="margin-bottom:var(--sp-4);gap:var(--sp-2)">
<div class="input" data-size="sm" style="width:200px"><span class="affix">${I.cal}</span><input value="2026/06/07 – 2026/07/07" readonly></div>
<div class="input" data-size="sm" style="width:160px"><select><option>全セグメント</option><option>Enterprise</option><option>Pro</option></select><span class="affix">${I.chevD}</span></div>
${btn({label:'比較を追加',variant:'ghost',size:'sm'})}
<div style="margin-left:auto">${btn({label:'エクスポート',variant:'secondary',size:'sm'})}</div></div>
<div class="grid4" style="margin-bottom:var(--sp-4)">${kpiEl({label:'セッション',value:'84,210',delta:'+6.1%'})}${kpiEl({label:'コンバージョン',value:'3.8%',delta:'+0.4pt'})}${kpiEl({label:'平均滞在',value:'4m 12s',delta:'-8s',dir:'down'})}${kpiEl({label:'解約率',value:'1.9%',delta:'-0.2pt'})}</div>
<div class="grid2" style="margin-bottom:var(--sp-4)">
${chartContainerEl()}
<div class="cardc"><div class="rowflex" style="justify-content:space-between;margin-bottom:8px"><b style="font-size:var(--text-label)">プラン別サインアップ</b>${segEl({items:['週','月'],active:1})}</div>${barchart()}</div></div>
<div class="grid2" style="align-items:start">
<div>${tableEl({rows:[['/pricing','LP',['success','+12%'],'24,180','—'],['/docs/quickstart','Docs',['success','+8%'],'18,220','—'],['/blog/v2-4','Blog',['warning','-2%'],'9,860','—']]})}</div>
<div class="cardc" style="border-color:color-mix(in srgb,var(--primary) 30%,var(--border))"><span class="badge" data-tone="primary">${I.spark} Insight</span><p style="font-size:var(--text-label);margin:8px 0">Pricing ページからのコンバージョンが先週比 +12%。v2.4 リリース記事からの流入が主要因です。</p>${btn({label:'詳細を分析',variant:'secondary',size:'sm'})}</div></div>
`,topSearch('Analytics')),
['Date range picker + Segment selector をページ冒頭に固定。','KPI row → Line / Bar chart → Data table + Insight card の流れ。']);

defTpl('project-management','Project Management','カンバンボード型のプロジェクト管理画面。',vp=>tplShell(vp,tplSide('proj'),`
<div class="rowflex" style="justify-content:space-between;margin-bottom:var(--sp-4)">
<div class="rowflex">${crumbsEl({items:['プロジェクト','Meridian Docs']})}${badge({label:'On track',tone:'success',dot:true})}</div>
<div class="rowflex">${btn({label:'⌘K',variant:'secondary',size:'sm'})}${btn({label:'フィルタ',variant:'secondary',size:'sm'})}<span class="avstack">${avatar({name:'SN',size:'xs'})}${avatar({name:'YK',size:'xs'})}${avatar({name:'+3',size:'xs'})}</span>${btn({label:'タスクを追加',size:'sm'})}</div></div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--sp-3);align-items:start">
${[['Todo','3',[taskCard()]],['In Progress','2',[`<div class="cardc" style="padding:12px"><div class="rowflex" style="gap:4px;margin-bottom:6px">${badge({label:'feature',tone:'primary'})}</div><div style="font-weight:550;font-size:var(--text-label);margin-bottom:8px">Playground に Density selector を追加</div><div class="rowflex" style="justify-content:space-between"><span style="font-family:var(--font-mono);font-size:10.5px;color:var(--fg-subtle)">MRD-141</span>${avatar({name:'SN',size:'xs'})}</div></div>`]],['Done','8',[`<div class="cardc" style="padding:12px;opacity:.7"><div style="font-weight:550;font-size:var(--text-label);margin-bottom:8px;text-decoration:line-through">Seed picker の実装</div><div class="rowflex" style="justify-content:space-between"><span style="font-family:var(--font-mono);font-size:10.5px;color:var(--fg-subtle)">MRD-120</span>${badge({label:'Done',tone:'success'})}</div></div>`]]].map(([t,n,cards])=>`
<div><div class="rowflex" style="justify-content:space-between;margin-bottom:8px;padding:0 2px"><b style="font-size:var(--text-label)">${t} <span style="color:var(--fg-subtle);font-weight:400">${n}</span></b><button class="tb-btn" aria-label="追加">${I.plus}</button></div>
<div style="display:flex;flex-direction:column;gap:8px;background:var(--bg-subtle);border:1px dashed var(--border);border-radius:var(--radius-lg);padding:8px;min-height:140px">${cards.join('')}</div></div>`).join('')}
</div>`,topSearch('プロジェクト')),
['列見出しに件数、列は dashed border の well で表現。','カードは Task Board Card。ラベル 2 個+担当アバターの密度。']);

defTpl('issue-tracker','Issue Tracker','一覧+詳細パネルの List Detail レイアウト。',vp=>tplShell(vp,tplSide('issues'),`
<div class="rowflex" style="margin-bottom:var(--sp-3);gap:var(--sp-2)">
<div class="input" data-size="sm" style="flex:1;max-width:280px"><span class="affix">${I.search}</span><input placeholder="Issue を検索"></div>
${btn({label:'状態',variant:'secondary',size:'sm'})}${btn({label:'優先度',variant:'secondary',size:'sm'})}${btn({label:'ラベル',variant:'secondary',size:'sm'})}
<div style="margin-left:auto" class="rowflex"><span style="font-size:var(--text-small);color:var(--fg-subtle)">並び: 更新順</span>${btn({label:'New issue',size:'sm'})}</div></div>
<div style="display:grid;grid-template-columns:${vp==='mobile'?'1fr':'1.5fr 1fr'};gap:var(--sp-4);align-items:start">
<div style="display:flex;flex-direction:column;gap:6px">
${issueRow()}${issueRow({id:'MRD-138',title:'Density: Comfortable でフォーム間隔が広すぎる',pr:'Med',st:['idle','Todo'],labels:['density'],who:'YK'})}${issueRow({id:'MRD-131',title:'HC テーマ: Badge outline のコントラスト不足',pr:'High',st:['running','In Review'],labels:['a11y','color'],who:'MT'})}${issueRow({id:'MRD-129',title:'Docs: Combobox のキーボード仕様を追記',pr:'Low',st:['success','Done'],labels:['docs'],who:'SN'})}
<div style="margin-top:8px">${pagerEl()}</div></div>
${vp==='mobile'?'':`<div class="panel" style="overflow:hidden"><div class="rowflex" style="justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border)"><b style="font-size:var(--text-label)">MRD-142</b><button class="tb-btn">${I.x}</button></div>
<div style="padding:16px"><b style="display:block;margin-bottom:8px">Table: ソート状態が URL に同期されない</b>
<p style="font-size:var(--text-small);color:var(--fg-muted);margin-bottom:12px">ソート変更後にリロードすると初期状態に戻る。sort / order をクエリに保存し、共有可能にする。</p>
${kvEl({width:'100%',items:[['状態','In Progress'],['優先度','High'],['担当','新谷'],['マイルストーン','v2.5']]})}
<div class="rowflex" style="margin-top:12px">${btn({label:'ブランチを作成',variant:'secondary',size:'sm'})}${btn({label:'完了にする',size:'sm'})}</div></div></div>`}
</div>`,topSearch('Issues')),
['一覧 60% + 詳細 40%。選択行と URL を同期する。','検索・状態・優先度・ラベルのフィルタバーを一覧上部に固定。']);

defTpl('ai-workspace','AI Chat / Agent Workspace','チャット中心+File tree・Run log・Diff を周辺に配置した AI ワークスペース。',vp=>{
  const chat=`
<div style="display:flex;flex-direction:column;height:100%;min-height:440px">
<div class="rowflex" style="justify-content:space-between;margin-bottom:var(--sp-3)">${agentStatusEl({s:'running'})}${execTimelineEl().replace('width:min(520px,100%)','width:auto;display:none')}</div>
<div style="flex:1;overflow:auto;padding-right:4px">
${chatMsgEl({role:'user'})}
${chatMsgEl({role:'assistant',tool:true})}
${chatMsgEl({role:'system'})}
${chatMsgEl({role:'assistant',streaming:true})}
</div>
<div style="margin-top:var(--sp-3)">${promptEl()}</div></div>`;
  if(vp==='mobile')return tplShell(vp,'',chat,`${crumbsEl({items:['AI Workspace']})}`);
  return `<div class="tpl-shell" style="grid-template-columns:200px 1fr 260px">
  <aside class="tpl-side">${fileTreeEl().replace('width:240px','width:100%').replace('panel pad','filetree')}</aside>
  <div class="tpl-main"><div class="tpl-top">${topSearch('AI Workspace')}</div><div class="tpl-body">${chat}</div></div>
  <aside style="border-left:1px solid var(--border);padding:var(--sp-3);background:var(--bg-subtle);display:flex;flex-direction:column;gap:var(--sp-3)">
  <div><div class="tsb-hd" style="padding-left:0">Run log</div>${runLogEl().replace('width:min(560px,100%)','width:100%')}</div>
  <div><div class="tsb-hd" style="padding-left:0">Diff</div>${diffEl().replace('width:min(560px,100%)','width:100%')}</div>
  <div><div class="tsb-hd" style="padding-left:0">Steps</div>${workflowStepsEl().replace('width:280px','width:100%')}</div>
  </aside></div>`},
['中央: 会話 + Prompt Input(下部固定)。左: File Tree。右: Run Log / Code Diff / Workflow Steps。','Agent Status を常時表示し、Running 中は停止を提供。','ツール実行は会話内の折りたたみブロック。']);

defTpl('settings','Settings','設定ナビ+Settings Panel+Danger zone の標準構成。',vp=>tplShell(vp,`
<div class="tsb-hd">設定</div>
${['一般','通知','メンバー','API キー','連携'].map((t,i)=>`<div class="tsb-item ${i===0?'on':''}">${t}</div>`).join('')}
<div class="tsb-hd">Organization</div><div class="tsb-item">Billing</div><div class="tsb-item">監査ログ</div>`,`
<h2 style="font-size:19px;font-weight:650;margin-bottom:4px">一般</h2>
<p style="font-size:var(--text-small);color:var(--fg-subtle);margin-bottom:var(--sp-5)">ワークスペースの基本設定を管理します。</p>
<div style="max-width:560px">
<div class="panel pad" style="margin-bottom:var(--sp-4)">
${fieldEl({label:'ワークスペース名',value:'Acme Inc.',placeholder:''})}
${fieldEl({label:'URL',control:inputGroupEl()})}
${fieldEl({label:'説明',control:`<textarea class="input" placeholder="このワークスペースの目的…">デザインシステムと社内ツールの開発</textarea>`,helper:'メンバー招待時に表示されます。'})}
</div>
${settingsPanelEl().replace('width:min(460px,100%)','width:100%;margin-bottom:var(--sp-4)')}
<div class="panel pad" style="border-color:color-mix(in srgb,var(--danger) 40%,var(--border))">
<b style="color:var(--danger-fg)">Danger zone</b>
<div class="rowflex" style="justify-content:space-between;margin-top:12px;padding-top:12px;border-top:1px solid var(--border-muted)"><div><div style="font-weight:550;font-size:var(--text-label)">ワークスペースを削除</div><div style="font-size:var(--text-small);color:var(--fg-muted)">すべてのプロジェクトとデータが完全に削除されます。</div></div>${btn({label:'削除…',variant:'danger',size:'sm'})}</div></div>
<div class="rowflex" style="justify-content:flex-end;gap:8px;margin-top:var(--sp-4);padding:12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);position:sticky;bottom:8px;box-shadow:var(--shadow-md)"><span style="margin-right:auto;font-size:var(--text-small);color:var(--fg-muted)">未保存の変更があります</span>${btn({label:'破棄',variant:'ghost',size:'sm'})}${btn({label:'変更を保存',size:'sm'})}</div>
</div>`,topSearch('設定')),
['即時反映(Switch)と明示保存(Save bar)を分離。','Danger zone は danger ボーダーで隔離し最下部に配置。','未保存変更は sticky な Save bar で通知。']);

defTpl('billing','Billing','現在のプラン・使用量・プラン比較・請求書の 4 段構成。',vp=>tplShell(vp,tplSide('billing'),`
<h2 style="font-size:19px;font-weight:650;margin-bottom:var(--sp-4)">Billing</h2>
<div class="grid2" style="margin-bottom:var(--sp-4);align-items:stretch">
<div class="cardc"><div class="rowflex" style="justify-content:space-between"><b>現在のプラン</b>${badge({label:'Pro',tone:'primary'})}</div>
<div style="font-size:22px;font-weight:650;margin:8px 0 2px">¥5,800<span style="font-size:var(--text-small);font-weight:400;color:var(--fg-subtle)"> /月 · 次回請求 8/1</span></div>
<p style="font-size:var(--text-small);color:var(--fg-muted);margin-bottom:12px">支払い方法: Visa •••• 4242</p>
<div class="rowflex">${btn({label:'支払い方法を変更',variant:'secondary',size:'sm'})}${btn({label:'請求先情報',variant:'ghost',size:'sm'})}</div></div>
${usageMeterEl({value:72}).replace('width:300px','width:100%')}
</div>
<h3 style="font-size:15px;font-weight:600;margin-bottom:var(--sp-3)">プラン</h3>
<div class="rowflex" style="gap:var(--sp-3);margin-bottom:var(--sp-5);align-items:stretch">
${planCard({name:'Starter',price:'¥0',feats:['メンバー 3 名まで','API 100k リクエスト/月','コミュニティサポート']})}
${planCard({name:'Pro',price:'¥5,800',cur:true})}
${planCard({name:'Enterprise',price:'お問い合わせ',feats:['メンバー無制限','SSO / SAML','監査ログ 無制限・SLA']})}
</div>
<h3 style="font-size:15px;font-weight:600;margin-bottom:var(--sp-3)">請求書</h3>
<div class="tscroll"><table class="tbl"><thead><tr><th>日付</th><th>内容</th><th class="num">金額</th><th>状態</th><th></th></tr></thead><tbody>
${[['2026-07-01','Pro プラン(月額)','¥5,800',['success','支払済み']],['2026-06-01','Pro プラン(月額)','¥5,800',['success','支払済み']],['2026-05-01','Pro プラン(月額)+ 超過分','¥6,420',['success','支払済み']]].map(r=>`<tr><td class="mono" style="font-size:12px">${r[0]}</td><td>${r[1]}</td><td class="num">${r[2]}</td><td>${statusEl({s:r[3][0],label:r[3][1]})}</td><td><a href="#" class="btn" data-variant="ghost" data-size="xs">PDF</a></td></tr>`).join('')}
</tbody></table></div>`,topSearch('Billing')),
['現在のプラン+Usage Meter を最初に提示。','プラン比較は現在のプランを primary ボーダーで明示。','請求書テーブルは数値右揃え+tabular-nums。']);

defTpl('team-management','Team Management','メンバー・ロール・招待・監査ログの管理画面。',vp=>tplShell(vp,tplSide('team'),`
<div class="rowflex" style="justify-content:space-between;margin-bottom:var(--sp-4)">
<h2 style="font-size:19px;font-weight:650">メンバー <span style="color:var(--fg-subtle);font-weight:400;font-size:14px">12</span></h2>
${btn({label:'メンバーを招待',size:'sm',leadingIcon:true})}</div>
${alertEl({tone:'warning',title:'保留中の招待が 2 件あります',body:'yuki@acme.co, mori@acme.co — 7 日後に期限切れになります。'})}
<div style="height:var(--sp-4)"></div>
<div class="tscroll"><table class="tbl"><thead><tr><th>メンバー</th><th>ロール</th><th>状態</th><th>最終アクセス</th><th></th></tr></thead><tbody>
${[['新谷','sn@acme.co','Admin',['success','Active'],'2 分前'],['Yuki Kato','yuki@acme.co','Editor',['success','Active'],'1 時間前'],['Mori Yusuke','mori@acme.co','Viewer',['idle','Invited'],'—']].map(r=>`<tr><td><div class="rowflex" style="gap:10px;flex-wrap:nowrap">${avatar({name:r[0],size:'sm'})}<div><div style="font-weight:550">${r[0]}</div><div style="font-size:var(--text-micro);color:var(--fg-subtle)">${r[1]}</div></div></div></td>
<td><div class="input" data-size="sm" style="width:120px"><select><option ${r[2]==='Admin'?'selected':''}>Admin</option><option ${r[2]==='Editor'?'selected':''}>Editor</option><option ${r[2]==='Viewer'?'selected':''}>Viewer</option></select></div></td>
<td>${statusEl({s:r[3][0],label:r[3][1]})}</td><td style="color:var(--fg-subtle)">${r[4]}</td><td><button class="tb-btn" aria-label="メニュー">${I.dots}</button></td></tr>`).join('')}
</tbody></table></div>
<div class="grid2" style="margin-top:var(--sp-4);align-items:start">
<div class="panel pad"><b style="font-size:var(--text-label)">ロールと権限</b>
${[['Admin','メンバー管理・Billing・削除を含むすべて'],['Editor','プロジェクトの作成・編集・実行'],['Viewer','閲覧のみ']].map(([r,d])=>`<div class="kv"><dt>${badge({label:r,tone:r==='Admin'?'primary':'neutral'})}</dt><dd style="font-weight:400;color:var(--fg-muted);text-align:right;font-size:var(--text-small)">${d}</dd></div>`).join('')}</div>
${activityFeedEl().replace('width:min(400px,100%)','width:100%')}
</div>`,topSearch('メンバー')),
['ロール変更はインライン Select。降格時は確認ダイアログで影響を明示(パターン参照)。','保留中の招待は Alert + テーブル内 Invited 状態の両方で可視化。']);

defTpl('integration-marketplace','Integration Marketplace','連携カード+カテゴリフィルタ+接続状態の一覧。',vp=>tplShell(vp,tplSide('settings'),`
<div class="rowflex" style="justify-content:space-between;margin-bottom:var(--sp-4)">
<h2 style="font-size:19px;font-weight:650">連携</h2>
<div class="input" data-size="sm" style="width:220px"><span class="affix">${I.search}</span><input placeholder="連携を検索"></div></div>
<div class="rowflex" style="margin-bottom:var(--sp-4)">${['すべて','通知','開発','分析','CRM'].map((t,i)=>`<button class="opt" aria-pressed="${i===0}" style="font-size:var(--text-small);padding:3px 12px;border-radius:var(--radius-full);border:1px solid var(--border);background:${i===0?'var(--primary-subtle)':'var(--surface)'};color:${i===0?'var(--primary)':'var(--fg-muted)'}">${t}</button>`).join('')}</div>
<div class="rowflex" style="gap:var(--sp-3);align-items:stretch">
${integrationCard({name:'Slack',desc:'レビュー結果をチャンネルに通知',state:'connected'})}
${integrationCard({name:'GitHub',desc:'PR・Issue と双方向同期',state:'connected'})}
${integrationCard({name:'Figma',desc:'デザイントークンを自動同期',state:'setup'})}
${integrationCard({name:'Datadog',desc:'メトリクスとログを転送',state:'none'})}
</div>`,topSearch('連携')),
['状態(接続済み / 設定が必要 / 未接続)で CTA を変える。','0 件時は「検索条件を変える」導線つきの Empty state を表示。']);

defTpl('developer-console','Developer Console','API キー・使用量・ログ・Webhook の開発者向け画面。',vp=>tplShell(vp,tplSide('settings'),`
<h2 style="font-size:19px;font-weight:650;margin-bottom:var(--sp-4)">Developer Console</h2>
<div class="grid2" style="margin-bottom:var(--sp-4);align-items:start">
<div class="panel pad"><div class="rowflex" style="justify-content:space-between;margin-bottom:10px"><b style="font-size:var(--text-label)">API キー</b>${btn({label:'キーを作成',size:'xs'})}</div>
${[['production-key','mrd_live_••••4f2a',['success','Active']],['staging-key','mrd_test_••••9c1b',['idle','Revoked']]].map(([n,k,s])=>`<div class="rowflex" style="justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-muted);flex-wrap:nowrap"><div style="min-width:0"><div style="font-weight:550;font-size:var(--text-label)">${n}</div><code class="inline" style="font-size:11px">${k}</code></div><div class="rowflex" style="flex:none">${statusEl({s:s[0],label:s[1]})}<button class="cp" data-copy="${k}">${I.copy}</button></div></div>`).join('')}</div>
${chartContainerEl().replace('width:min(480px,100%)','width:100%')}
</div>
${codeBlock(`curl https://api.meridian.app/v1/tokens \\\n  -H "Authorization: Bearer $MERIDIAN_API_KEY" \\\n  -d '{ "seed": "#5B5BD6", "theme": "dark" }'`,'bash','Quickstart')}
<div class="grid2" style="align-items:start">
<div><b style="font-size:var(--text-label);display:block;margin-bottom:8px">リクエストログ</b>${runLogEl().replace('width:min(560px,100%)','width:100%')}</div>
<div class="panel pad"><div class="rowflex" style="justify-content:space-between;margin-bottom:10px"><b style="font-size:var(--text-label)">Webhooks</b>${btn({label:'追加',variant:'secondary',size:'xs'})}</div>
${[['https://acme.co/hooks/deploy',['success','Healthy']],['https://acme.co/hooks/usage',['error','Failing']]].map(([u,s])=>`<div class="rowflex" style="justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-muted);flex-wrap:nowrap"><code class="inline" style="font-size:11px;overflow:hidden;text-overflow:ellipsis">${u}</code>${statusEl({s:s[0],label:s[1]})}</div>`).join('')}</div>
</div>`,topSearch('Developer')),
['API キーはマスク表示+コピー。Revoked も履歴として残す。','失敗している Webhook は error 状態で目立たせ、詳細ログへ誘導。']);

defTpl('login','Login / Signup','認証カード。SSO・エラー・ローディングの各状態を含む。',vp=>`
<div style="min-height:520px;display:flex;align-items:center;justify-content:center;background:var(--bg);background-image:radial-gradient(var(--border-muted) 1px,transparent 1px);background-size:24px 24px;padding:var(--sp-6)">
<div style="width:360px;max-width:100%">
<div class="rowflex" style="justify-content:center;margin-bottom:var(--sp-5);gap:8px"><span class="mark" style="width:24px;height:24px;border-radius:var(--radius-sm);background:linear-gradient(135deg,var(--primary),var(--accent));display:inline-block"></span><b style="font-size:16px;letter-spacing:-.01em">Meridian</b></div>
<div class="panel pad" style="padding:var(--sp-6)">
<h3 style="font-size:16px;font-weight:650;margin-bottom:4px">ログイン</h3>
<p style="font-size:var(--text-small);color:var(--fg-muted);margin-bottom:var(--sp-4)">Acme Inc. のワークスペースへ</p>
${btn({label:'Google で続行',variant:'secondary',size:'md',full:true})}
<div style="height:8px"></div>
${btn({label:'GitHub で続行',variant:'secondary',size:'md',full:true})}
<div class="rowflex" style="margin:var(--sp-4) 0;gap:10px"><span style="flex:1;height:1px;background:var(--border)"></span><span style="font-size:var(--text-micro);color:var(--fg-subtle)">または</span><span style="flex:1;height:1px;background:var(--border)"></span></div>
${fieldEl({label:'メールアドレス',placeholder:'name@company.com'})}
${fieldEl({label:'パスワード',type:'password',placeholder:'••••••••',state:'error',error:'メールアドレスまたはパスワードが正しくありません'})}
${btn({label:'ログイン',size:'md',full:true})}
<p style="font-size:var(--text-small);color:var(--fg-muted);text-align:center;margin-top:var(--sp-4)">アカウントがない場合は <a href="#">サインアップ</a></p>
</div>
<p style="font-size:var(--text-micro);color:var(--fg-subtle);text-align:center;margin-top:var(--sp-4)">続行すると <a href="#">利用規約</a> と <a href="#">プライバシーポリシー</a> に同意したことになります。</p>
</div></div>`,
['SSO を先頭・メール認証を下に。エラーはフィールド単位で具体的に。','法的リンクはカード外に小さく配置。']);

defTpl('onboarding','Onboarding','Stepper 付きの初期セットアップフロー。',vp=>`
<div style="min-height:520px;display:flex;background:var(--bg)">
<div style="width:280px;border-right:1px solid var(--border);padding:var(--sp-6);background:var(--bg-subtle);${vp==='mobile'?'display:none':''}">
<b style="display:block;margin-bottom:var(--sp-5)">セットアップ</b>
${workflowStepsEl().replace('width:280px','width:100%').replace('リポジトリを解析','アカウント作成').replace('変更計画を作成','ワークスペース設定').replace('コードを生成','チームを招待').replace('テストを実行','テーマを選択').replace('レビューを依頼','完了').replace('src/lib/sort.ts を編集中…','2 名を招待済み')}
</div>
<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:var(--sp-6)">
<div style="width:440px;max-width:100%">
<span class="badge" data-tone="primary">ステップ 3 / 5</span>
<h2 style="font-size:22px;font-weight:650;margin:var(--sp-3) 0 4px">チームを招待</h2>
<p style="font-size:var(--text-label);color:var(--fg-muted);margin-bottom:var(--sp-5)">後からでも招待できます。まずは一緒に使うメンバーを追加しましょう。</p>
${fieldEl({label:'メールアドレス',placeholder:'name@company.com, ...',helper:'カンマ区切りで複数入力できます。'})}
${fieldEl({label:'ロール',control:`<div class="input"><select><option>Editor — 編集と実行が可能</option><option>Viewer — 閲覧のみ</option></select><span class="affix">${I.chevD}</span></div>`})}
<div class="progressc" style="margin:var(--sp-5) 0 var(--sp-3)"><i style="width:60%"></i></div>
<div class="rowflex" style="justify-content:space-between">${btn({label:'スキップ',variant:'ghost',size:'md'})}<div class="rowflex">${btn({label:'戻る',variant:'secondary',size:'md'})}${btn({label:'次へ',size:'md',trailingIcon:true})}</div></div>
</div></div></div>`,
['左に Workflow Steps、右に 1 ステップ 1 タスクのフォーム。','スキップ可能にし、オンボーディングを離脱理由にしない。']);

defTpl('empty-state','Empty State Screen','初回利用時の空状態。次のアクションへの導線を設計する。',vp=>tplShell(vp,tplSide('proj'),`
<div style="display:flex;align-items:center;justify-content:center;min-height:420px">
${emptyEl({width:'420px'})}
</div>`,topSearch('プロジェクト')),
['「何が無いか」「作るとどうなるか」「最初の一歩(Primary CTA 1 つ)」の 3 点構成。','補助導線(ドキュメント)は Ghost で並置。']);

defTpl('error-screen','Error Screen','エラーコード・回復手段・詳細開示・サポート導線。',vp=>`
<div style="min-height:480px;display:flex;align-items:center;justify-content:center;background:var(--bg);padding:var(--sp-6)">
<div style="width:440px;max-width:100%;text-align:center">
<div style="font-family:var(--font-mono);font-size:12px;color:var(--fg-subtle);margin-bottom:var(--sp-2)">ERROR 500 · req_8f2a91</div>
<h2 style="font-size:22px;font-weight:650;margin-bottom:var(--sp-2)">データを読み込めませんでした</h2>
<p style="font-size:var(--text-label);color:var(--fg-muted);margin-bottom:var(--sp-5)">サーバー側で問題が発生しています。数分後に再試行してください。入力中の内容は保存されています。</p>
<div class="rowflex" style="justify-content:center;margin-bottom:var(--sp-5)">${btn({label:'再試行',size:'md'})}${btn({label:'ダッシュボードへ戻る',variant:'secondary',size:'md'})}</div>
<details style="text-align:left" class="panel pad"><summary style="cursor:pointer;font-size:var(--text-small);color:var(--fg-muted)">技術的な詳細</summary>
<pre style="font-family:var(--font-mono);font-size:11px;color:var(--fg-muted);margin-top:8px;overflow-x:auto">GET /api/v1/services → 500\ntrace: req_8f2a91 · 2026-07-07T14:02:11+09:00</pre></details>
<p style="font-size:var(--text-small);color:var(--fg-subtle);margin-top:var(--sp-4)">解決しない場合は <a href="#">サポートに連絡</a>(リクエスト ID を添えてください)</p>
</div></div>`,
['エラーコード+リクエスト ID を明示し、サポート連絡に使えるようにする。','詳細は details で折りたたみ。回復アクションを主役にする。']);

defTpl('mobile-layout','Mobile Responsive Layout','モバイル幅でのシェル変形(Drawer ナビ+ボトムバー+カード化テーブル)。',vp=>`
<div style="max-width:390px;margin:0 auto;border-left:1px solid var(--border);border-right:1px solid var(--border);min-height:560px;display:flex;flex-direction:column;background:var(--bg)">
<div class="tpl-top" style="position:sticky;top:0"><button class="tb-btn" aria-label="メニュー">${I.menu}</button><b style="font-size:var(--text-label)">ダッシュボード</b><div style="margin-left:auto" class="rowflex"><button class="tb-btn">${I.search}</button>${avatar({name:'SN',size:'sm'})}</div></div>
<div style="flex:1;padding:var(--sp-4);overflow:auto">
<div style="display:flex;gap:var(--sp-3);overflow-x:auto;padding-bottom:4px;margin-bottom:var(--sp-4)">${kpiEl({label:'MRR',value:'¥2.84M',delta:'+12.4%'})}${kpiEl({label:'ユーザー',value:'12,480',delta:'+8.2%'})}</div>
${[['acme-dashboard',['success','Healthy'],'12,480 req/min'],['ml-pipeline',['warning','Degraded'],'3,204 req/min']].map(r=>`<div class="cardc" style="margin-bottom:10px"><div class="rowflex" style="justify-content:space-between"><b style="font-size:var(--text-label)">${r[0]}</b>${statusEl({s:r[1][0],label:r[1][1]})}</div><div style="font-size:var(--text-small);color:var(--fg-muted);margin-top:4px;font-family:var(--font-mono)">${r[2]}</div><div class="rowflex" style="margin-top:10px">${btn({label:'詳細',variant:'secondary',size:'sm',full:true})}</div></div>`).join('')}
${btn({label:'サービスを追加',size:'lg',full:true})}
</div>
<div style="display:flex;border-top:1px solid var(--border);background:var(--surface)">${[[I.zap,'ホーム',true],[I.folder,'プロジェクト',false],[I.bell,'通知',false],[I.gear,'設定',false]].map(([ic,l,on])=>`<button style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px 0;font-size:10px;color:${on?'var(--primary)':'var(--fg-subtle)'}">${ic}${l}</button>`).join('')}</div>
</div>`,
['テーブルはカード化し、主要情報+状態+1 アクションに絞る。','タップターゲットは 44px 以上。ボトムナビは 4 項目まで。']);
