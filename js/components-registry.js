"use strict";
/* ============ Component registry ============ */
const COMPONENTS=[];
const CMAP={};
function def(c){
  const spec=typeof COMPONENT_CONTRACTS!=='undefined'?COMPONENT_CONTRACTS[c.id]:null;
  if(spec){
    c.when=spec.intent.whenToUse;
    c.notWhen=spec.intent.whenNotToUse;
    c.anatomy=spec.anatomy.map(part=>[part.part,`${part.required?'Required':'Optional'} — ${part.description}`]);
    if(c.variants||spec.variants.some(variant=>variant!=='default'))c.variants=spec.variants;
    if(c.sizes||spec.sizes.length)c.sizes=spec.sizes;
    c.states=spec.states.map(state=>state.id);
    c.props=spec.props;
    c.tokens=[...new Set(Object.values(spec.tokenRefs).flat())];
    c.a11y=[...new Set([...spec.accessibility.requirements,...spec.accessibility.aria,...spec.accessibility.focus])];
    c.keys=spec.keyboardInteractions.map(item=>[item.key,item.action]);
    c.usageGuidance=spec.usagePatterns;
    c.responsiveBehavior=Object.entries(spec.responsiveBehavior).map(([mode,value])=>[
      mode[0].toUpperCase()+mode.slice(1),
      `${value.summary} ${value.rules.join(' ')} Avoid: ${value.avoid.join(' ')}`
    ]);
    c.openQuestions=spec.openQuestions;
  }
  c.states=c.states||['default'];
  c.tokens=c.tokens||['--surface','--border','--fg'];
  c.a11y=c.a11y||[];
  c.keys=c.keys||[];
  c.related=c.related||[];
  c.code=c.code||(p=>`<${c.name.replace(/\s/g,'')} />`);
  COMPONENTS.push(c);CMAP[c.id]=c;
}

/* ---- Core ---- */
def({id:'button',name:'Button',group:'Core',desc:'ユーザーが明確なアクションを実行するための基本コントロール。操作の重要度と危険度を variant で示す。',
 variants:['primary','secondary','tertiary','ghost','danger'],
 sizes:['xs','sm','md','lg','xl'],states:['default','hover','active','focus','disabled','loading'],
 flags:[['leadingIcon','Leading icon'],['trailingIcon','Trailing icon'],['fullWidth','Full width']],
 texts:[['label','Label','Create project']],
 when:['フォーム送信・設定保存・リソース作成など、状態を変更する明確な操作','ダイアログ内の確定・キャンセル・破壊的操作','テーブル行やツールバー内の補助操作'],
 notWhen:['ページ遷移だけが目的の場合 → Link を使う','表示モード切り替え → Segmented Control','ON/OFF 設定 → Switch','複数選択 → Checkbox、排他選択 → Radio','アイコンだけで意味が明確な低優先操作 → Icon Button'],
 usage:['Primary は 1 つの意思決定文脈に原則 1 つ。','Danger は削除・取り消し不能・権限剥奪などの最終確認に限定する。','Ghost はキャンセル、閉じる、ツールバー、行内操作に使う。','遷移は Link、アイコンだけの操作は Icon Button を使う。','Loading 中はラベル node、accessible name、Button幅を維持し、二重送信を防ぐ。'],
 anatomy:[['1','Root — native button element'],['2','Label — 操作結果を予測できる文言'],['3','Leading icon (optional) — 意味を補強する'],['4','Trailing icon (optional) — 展開・遷移を補足する'],['5','Loading spinner — aria-hidden で重ね、label は保持する']],
 tokens:['--primary','--primary-hover','--primary-active','--primary-subtle','--primary-muted','--primary-fg','--control-bg','--control-bg-hover','--control-bg-active','--control-border','--control-border-hover','--surface-muted','--fg','--fg-disabled','--danger','--danger-hover','--danger-active','--danger-on-solid','--disabled','--focus-ring','--button-icon-size-md','--button-spinner-stroke','--radius-sm','--ctl-md','--sp-2','--dur-fast','--dur-loop','--ease-standard'],
 a11y:['<button> 要素を使い、role の付与を不要にする','操作結果を予測できる可視ラベルを必須にする','Loading 中は aria-busy="true" と aria-disabled="true" を設定し、handler 側でも二重送信を防ぐ','色だけで danger の意味を伝えない','disabled は native disabled に写像し、理由は aria-describedby で周辺説明へ接続する'],
 keys:[['Enter / Space','アクションを実行'],['Tab','次のコントロールへ']],
 dos:[[()=>btn({label:'プロジェクトを作成'})+' '+btn({label:'キャンセル',variant:'ghost'}),'Primary は 1 つ。補助アクションは Ghost に落とす。']],
 donts:[[()=>btn({label:'作成'})+' '+btn({label:'保存'})+' '+btn({label:'送信'}),'Primary の乱用。どれが主要アクションか判別できない。']],
 usagePatterns:[
  ['Form footer',()=>btn({label:'キャンセル',variant:'ghost'})+' '+btn({label:'変更を保存',variant:'primary'}),'Primary action は末尾に置き、Cancel / discard は Ghost または Secondary にする。'],
  ['Dialog footer',()=>btn({label:'キャンセル',variant:'ghost'})+' '+btn({label:'削除する',variant:'danger'}),'破壊的な確定は Danger にし、本文で影響を説明する。'],
  ['Toolbar',()=>btn({label:'フィルタ',variant:'secondary',size:'sm',leadingIcon:true})+' '+btn({label:'コピー',variant:'ghost',size:'sm'}),'主要作業の起点だけを強くし、補助操作は Ghost / Icon Button に落とす。'],
  ['Table row',()=>btn({label:'詳細',variant:'ghost',size:'xs'})+' '+btn({label:'その他',variant:'ghost',size:'xs'}),'行内操作は軽くし、破壊的操作は直接置かず確認へ逃がす。'],
  ['Mobile CTA',()=>`<div style="width:220px">${btn({label:'続行',variant:'primary',size:'xl',fullWidth:true})}</div>`,'モバイルの主要 CTA は full width にできるが、複数ボタンを横に詰めない。']
 ],
 responsiveBehavior:[
  ['Desktop','md を標準にし、Form footer / Dialog footer / Toolbar では inline 配置を基本にする。Table row action は xs または sm を使う。'],
  ['Mobile','同じ Button を使い、主要 CTA は full width、lg / xl、縦積みなどの layout pattern で最適化する。'],
  ['Touch','操作targetは24px minimum、主要操作は原則44px以上にし、hoverに意味を依存せず、loading中の二重実行を防ぐ。']
 ],
 related:['icon-button','link','segmented-control'],
 render:p=>btn(p),
 code:p=>`<Button\n  variant="${p.variant||'primary'}"\n  size="${p.size||'md'}"${p.disabled||p.state==='disabled'?'\n  disabled':''}${p.loading||p.state==='loading'?'\n  loading':''}${p.fullWidth?'\n  fullWidth':''}${p.leadingIcon?'\n  leadingIcon={<PlusIcon />}':''}${p.trailingIcon?'\n  trailingIcon={<ArrowRightIcon />}':''}\n>\n  ${esc(p.label||'Create project')}\n</Button>`});

def({id:'icon-button',name:'Icon Button',group:'Core',desc:'可視ラベルを置かず、単一の明確な補助アクションを実行する正方形のbutton。',
 variants:['ghost','secondary','danger'],sizes:['xs','sm','md','lg','xl'],states:['default','hover','active','focus','disabled','loading'],
 flags:[['loading','Loading']],texts:[['label','Label','フィルターを開く']],
 usage:['labelをaria-labelとTooltipの単一sourceにする。','操作targetは24px minimum、touch中心の主要操作はxlの44pxを優先する。'],
 a11y:['Native buttonと空でないlabelを必須にする。','Tooltipはhoverとfocusで表示しEscapeで閉じる。'],related:['button','tooltip','switch'],
 render:p=>iconButton({...p,variant:p.variant||'ghost'}),
 code:p=>`<IconButton\n  label="${esc(p.label||'フィルターを開く')}"\n  icon={<FilterIcon />}\n  variant="${p.variant||'ghost'}"\n  size="${p.size||'md'}"${p.loading||p.state==='loading'?'\n  loading':''}\n/>`});

def({id:'link',name:'Link',group:'Core',desc:'現在の文脈から別のURLまたは同一document内の位置へ移動するnative hyperlink。',
 variants:['inline','standalone'],states:['default','hover','active','focus'],
 flags:[['external','External'],['download','Download'],['newTab','New tab']],
 usage:['Inline Linkは通常時からunderlineを表示する。','Externalとnew-tabを分離し、target=_blankではnoopenerと補足textを付ける。','Disabled Linkは作らない。'],
 render:p=>linkDemo(p),code:p=>`<Link\n  href="${p.external?'https://www.w3.org/WAI/':p.download?'/reports/q2.pdf':'/docs/accessibility'}"\n  variant="${p.variant||'inline'}"${p.external?'\n  external':''}${p.download?'\n  download':''}${p.newTab?'\n  target="_blank"':''}\n>\n  ${p.download?'Q2レポート（PDF）':p.external?'WAIガイドライン':'アクセシビリティ指針'}\n</Link>`,related:['button','breadcrumb','navigation-item']});

def({id:'text',name:'Text',group:'Core',desc:'タイポグラフィトークンをコンポーネント化した基本テキスト。',
 when:['見出し・本文・補助テキストの一貫した実装'],notWhen:['数値の等幅表示 → Numeric スタイル'],
 usage:['サイズ・行間は直接指定せず、type scale のロールを選ぶ。','色は foreground / foreground-muted / foreground-subtle の 3 段で管理する。'],
 render:()=>textDemo(),code:()=>`<Text role="heading-3">見出し</Text>\n<Text role="body">本文テキスト</Text>\n<Text role="body-small" tone="muted">補助テキスト</Text>`,related:['typography']});

def({id:'badge',name:'Badge',group:'Core',desc:'状態やカテゴリを示す小さなラベル。読み取り専用で、操作は持たない。',
 variants:['neutral','primary','success','warning','danger','info'],states:['default'],
 flags:[['dot','Status dot'],['outline','Outline']],texts:[['label','Label','Active']],
 when:['ステータス表示(Active / Failed など)','件数・カテゴリの補足'],
 notWhen:['削除可能な属性 → Tag','クリックで絞り込む操作 → Filter chip(Tag の亜種)'],
 usage:['色だけに意味を持たせず、必ずテキストを併記する。','1 行に 3 つ以上並べると走査性が落ちる。優先度の高いものに絞る。'],
 tokens:['--success-subtle','--success-fg','--danger-subtle','--danger-fg','--radius-full'],
 render:p=>badge({...p,tone:p.variant||'neutral'}),
 code:p=>`<Badge tone="${p.variant||'neutral'}"${p.dot?' dot':''}>${esc(p.label||'Active')}</Badge>`,related:['tag','status-indicator']});

def({id:'tag',name:'Tag',group:'Core',desc:'ユーザーが付与・削除できる属性ラベル。Badge と異なり操作可能。',
 states:['default','hover'],texts:[['label','Label','design-system']],
 when:['ラベル・トピックの付与','フィルタ条件の表示と解除'],notWhen:['システムが決めるステータス → Badge'],
 usage:['削除ボタンには aria-label「◯◯を削除」を付ける。'],
 keys:[['Backspace / Delete','フォーカス中の Tag を削除']],
 render:p=>tagEl(p),code:p=>`<Tag onRemove={...}>${esc(p.label||'design-system')}</Tag>`,related:['badge','combobox']});

def({id:'avatar',name:'Avatar',group:'Core',desc:'ユーザー・チームを表す円形の識別子。イニシャルまたは画像。',
 sizes:['xs','sm','md','lg'],texts:[['name','Name','新谷']],
 when:['担当者・作成者の表示','メンバーリスト'],notWhen:['装飾目的のアイコン'],
 usage:['画像が無い場合はイニシャルにフォールバックする。','重ね表示(AvatarStack)は 3〜4 個で省略し「+N」を付ける。'],
 render:p=>`<div class="rowflex">${avatar(p)}<span class="avstack">${avatar({name:'SN',size:p.size})}${avatar({name:'YK',size:p.size})}${avatar({name:'MT',size:p.size})}${avatar({name:'+3',size:p.size})}</span></div>`,
 code:p=>`<Avatar name="${esc(p.name||'新谷')}" size="${p.size||'md'}" />\n<AvatarStack max={3} users={members} />`,related:['user-menu']});

def({id:'tooltip',name:'Tooltip',group:'Core',desc:'ホバー・フォーカス時に補足情報を表示する。重要情報は入れない。',
 states:['default','hover','focus'],texts:[['content','Content','変更を保存 ⌘S'],['anchor','Trigger label','保存']],when:['Icon Buttonの可視label','既知commandのshortcut提示'],
 notWhen:['必須情報の唯一の経路','interactiveまたは長い内容 → Popover','touch tapだけで開く情報'],
 usage:['既定400ms後に表示しpointer leaveでは即時に閉じる。','Focusでも表示しEscapeで閉じ、focusはtriggerへ保持する。','Surfaceへfocusable contentを置かない。'],
 tokens:['--tooltip-bg','--bg','--sp-1','--sp-2','--radius-xs','--shadow-md','--text-micro'],
 keys:[['Escape','Tooltipを閉じ、trigger focusを保持']],
 render:p=>tooltipEl(p),code:p=>`<Tooltip content="${esc(p.content||'変更を保存 ⌘S')}">\n  <Button>${esc(p.anchor||'保存')}</Button>\n</Tooltip>`,related:['popover','icon-button']});

def({id:'divider',name:'Divider',group:'Core',desc:'コンテンツのグループを分ける水平・垂直の境界線。',
 when:['意味の切れ目を明示する場合'],notWhen:['余白で十分に区切れる場合 — 線を足す前に spacing を検討する'],
 usage:['border-muted を基本にし、強調が必要な場合のみ border を使う。'],
 render:()=>dividerDemo(),code:()=>`<Divider />\n<Divider orientation="vertical" />`,related:['card']});

def({id:'spinner',name:'Spinner',group:'Core',desc:'進捗が不定の読み込み表示。1 秒未満の待ちには使わない。',
 sizes:['sm','md','lg'],when:['所要時間が不明な非同期処理'],
 notWhen:['進捗率が分かる処理 → Progress','コンテンツ形状が分かっている読み込み → Skeleton'],
 usage:['role="status" と視覚外テキストで読み込み中であることを伝える。'],
 render:p=>spinnerEl(p),code:p=>`<Spinner size="${p.size||'md'}" aria-label="読み込み中" />`,related:['progress','skeleton']});

def({id:'skeleton',name:'Skeleton',group:'Core',desc:'読み込み中にレイアウトの骨格を表示し、レイアウトシフトを防ぐ。',
 when:['ページ・カードの初期読み込み'],notWhen:['短時間(300ms 未満)の待ち — 表示すると逆にちらつく'],
 usage:['実コンテンツと同じ寸法にする。','アニメーションは prefers-reduced-motion で停止する。'],
 render:()=>skeletonEl(),code:()=>`<Skeleton height={12} width="40%" />\n<Skeleton height={10} count={3} />`,related:['spinner','empty-state']});

def({id:'empty-state',name:'Empty State',group:'Core',desc:'データが無い状態を、次のアクションへの導線として設計する。',
 texts:[['title','Title','プロジェクトがありません'],['body','Body','最初のプロジェクトを作成すると、ここにダッシュボードが表示されます。']],
 when:['初回利用・データ 0 件','検索結果 0 件(文言を変える)'],
 notWhen:['エラーによる非表示 → Error 表示で原因と回復手段を示す'],
 usage:['「何が無いのか」「作るとどうなるか」「最初の一歩」の 3 点を必ず含める。','検索 0 件では「条件を変える・クリアする」導線を出す。'],
 render:p=>emptyEl(p),code:()=>`<EmptyState\n  icon={<FolderIcon />}\n  title="プロジェクトがありません"\n  description="最初のプロジェクトを作成すると、ここにダッシュボードが表示されます。"\n  action={<Button size="sm">プロジェクトを作成</Button>}\n/>`,related:['error-screen','skeleton']});

/* ---- Forms ---- */
def({id:'text-field',name:'Text Field',group:'Forms',desc:'1 行のテキスト入力。ラベル・ヘルプ・エラーは Form Field と組み合わせる。',
 sizes:['sm','md','lg'],states:['default','hover','focus','error','disabled','readonly'],
 flags:[['leading','Leading icon'],['trailing','Trailing affix']],
 texts:[['label','Label','Project name'],['placeholder','Placeholder','Acme Dashboard'],['helper','Helper text','後から変更できます。']],
 when:['短い自由入力(名前・URL・メール)'],notWhen:['長文 → Textarea','限られた選択肢 → Select / Radio'],
 usage:['Placeholder に必須情報を書かない。入力を始めると消える。','エラーは具体的に書く。「不正な値」ではなく「@ を含むメールアドレスを入力してください」。','Disabled は操作不能+送信対象外、Readonly は参照可能+送信対象。区別して使う。'],
 tokens:['--input-bg','--input-border','--input-border-focus','--input-placeholder','--danger','--radius-sm','--ctl-md'],
 a11y:['label 要素と htmlFor で関連付ける','エラーは aria-describedby + aria-invalid で通知する','focus ring はコントラスト比 3:1 以上'],
 keys:[['Tab','フィールド間を移動'],['Esc','(検索系) 入力をクリア']],
 dos:[[()=>fieldEl({label:'メールアドレス',placeholder:'name@company.com',state:'error',error:'@ を含むメールアドレスを入力してください'}),'エラーは修正方法まで具体的に書く。']],
 donts:[[()=>fieldEl({label:'',placeholder:'メールアドレス(必須)'}),'ラベルを省略し placeholder に依存。入力中に要件が見えなくなる。']],
 render:p=>fieldEl(p),
 code:p=>`<TextField\n  label="${esc(p.label||'Project name')}"\n  placeholder="${esc(p.placeholder||'Acme Dashboard')}"${p.helper?`\n  helperText="${esc(p.helper)}"`:''}${p.state==='error'?'\n  error="値を確認してください"':''}${p.state==='disabled'?'\n  disabled':''}\n/>`,
 related:['form-field','textarea','search-field']});

def({id:'textarea',name:'Textarea',group:'Forms',desc:'複数行のテキスト入力。行数の目安を rows で示す。',
 states:['default','focus','error','disabled'],texts:[['label','Label','説明'],['placeholder','Placeholder','このプロジェクトの目的を記述…']],
 when:['説明文・コメントなどの長文入力'],notWhen:['1 行で収まる入力 → Text Field'],
 usage:['最大文字数がある場合はカウンタを表示する。','縦リサイズのみ許可し、レイアウト崩れを防ぐ。'],
 render:p=>fieldEl({...p,control:`<textarea class="input ${simCls(p.state)}" placeholder="${esc(p.placeholder||'このプロジェクトの目的を記述…')}" ${p.state==='disabled'?'disabled':''} ${p.state==='error'?'data-invalid style="border-color:var(--danger)"':''}></textarea>`}),
 code:p=>`<Textarea label="${esc(p.label||'説明')}" rows={4} maxLength={500} />`,related:['text-field','prompt-input']});

def({id:'select',name:'Select',group:'Forms',desc:'定義済みの選択肢から 1 つを選ぶ。5〜15 個程度の選択肢に向く。',
 sizes:['sm','md','lg'],states:['default','focus','error','disabled'],
 when:['選択肢が 5 個以上で 1 つだけ選ぶ'],notWhen:['4 個以下 → Radio / Segmented Control','検索が必要な多数の選択肢 → Combobox'],
 usage:['デフォルト値は最も安全・一般的なものにする。','「選択してください」を初期値にする場合は必須バリデーションを付ける。'],
 render:p=>fieldEl({label:p.label||'ロール',control:`<div class="input ${simCls(p.state)}" data-size="${p.size||'md'}" ${p.state==='disabled'?'data-disabled':''} ${p.state==='error'?'data-invalid':''}><select ${p.state==='disabled'?'disabled':''}><option>Editor — 編集と実行が可能</option><option>Viewer — 閲覧のみ</option><option>Admin — すべての管理権限</option></select><span class="affix">${I.chevD}</span></div>`,helper:p.helper}),
 code:()=>`<Select label="ロール" defaultValue="editor">\n  <Option value="editor">Editor</Option>\n  <Option value="viewer">Viewer</Option>\n</Select>`,related:['combobox','radio']});

def({id:'combobox',name:'Combobox',group:'Forms',desc:'検索入力と選択リストを組み合わせた選択コントロール。多数の候補から絞り込む。',
 states:['default','open','focus','disabled'],
 when:['候補が 15 個を超える選択','メンバー・リポジトリなど動的な候補'],notWhen:['固定の少数選択 → Select'],
 usage:['0 件時は「一致する候補がありません」と、新規作成の導線を出す。','選択済み項目は Tag で表示し、個別に解除できるようにする。'],
 keys:[['↑ ↓','候補を移動'],['Enter','選択'],['Esc','リストを閉じる']],
 a11y:['role="combobox" + aria-expanded + aria-activedescendant を実装する','候補リストは role="listbox" にする'],
 render:p=>comboboxEl(p),code:()=>`<Combobox\n  label="メンバー"\n  items={members}\n  itemToString={(m) => m.name}\n  onSelect={...}\n/>`,related:['select','command-menu','tag']});

def({id:'checkbox',name:'Checkbox',group:'Forms',desc:'独立した ON/OFF、または複数選択。即時反映しない設定に使う。',
 states:['default','checked','disabled'],flags:[['checked','Checked']],texts:[['label','Label','通知を受け取る']],
 when:['複数選択リスト','利用規約への同意'],notWhen:['即時に反映されるトグル → Switch','排他選択 → Radio'],
 usage:['ラベルクリックでも切り替わるようにする。','一部選択(indeterminate)は「すべて選択」の親にのみ使う。'],
 render:p=>checkboxEl({...p,checked:p.checked||p.state==='checked'}),
 code:p=>`<Checkbox label="${esc(p.label||'通知を受け取る')}"${p.checked?' defaultChecked':''} />`,related:['switch','radio']});

def({id:'radio',name:'Radio',group:'Forms',desc:'排他的な選択肢から 1 つを選ぶ。すべての選択肢を見せたい場合に使う。',
 states:['default','disabled'],
 when:['2〜4 個の排他選択で、比較して選ばせたい場合'],notWhen:['選択肢が多い → Select','ON/OFF → Switch / Checkbox'],
 usage:['デフォルト選択を必ず用意する。','選択肢ごとに補足説明を付けられるレイアウトにする。'],
 keys:[['↑ ↓ ← →','グループ内の選択を移動']],
 render:p=>`<div style="display:flex;flex-direction:column;gap:10px">${radioEl({label:'Public — 誰でも閲覧可能',name:'pg-r',checked:true,disabled:p.state==='disabled'})}${radioEl({label:'Private — メンバーのみ',name:'pg-r',disabled:p.state==='disabled'})}</div>`,
 code:()=>`<RadioGroup label="公開範囲" defaultValue="public">\n  <Radio value="public" label="Public" />\n  <Radio value="private" label="Private" />\n</RadioGroup>`,related:['checkbox','segmented-control']});

def({id:'switch',name:'Switch',group:'Forms',desc:'即時に反映される ON/OFF。保存ボタンを伴う設定には Checkbox を使う。',
 states:['default','checked','disabled'],flags:[['checked','Checked']],texts:[['label','Label','自動保存']],
 when:['切り替えた瞬間に反映される設定'],notWhen:['フォーム送信で確定する項目 → Checkbox'],
 usage:['切り替え結果はトーストなどで軽くフィードバックする。','ラベルは状態ではなく対象を書く(「自動保存」であり「ON」ではない)。'],
 render:p=>switchEl({...p,checked:p.checked||p.state==='checked'}),
 code:p=>`<Switch label="${esc(p.label||'自動保存')}"${p.checked?' defaultChecked':''} onChange={...} />`,related:['checkbox']});

def({id:'slider',name:'Slider',group:'Forms',desc:'連続値・範囲値の直感的な調整。正確な値の入力には数値フィールドを併設する。',
 states:['default','disabled'],
 when:['音量・透明度など「だいたい」で良い調整'],notWhen:['正確な数値が必要 → 数値入力と併用'],
 keys:[['← →','1 ステップ移動'],['Shift + ← →','10 ステップ移動'],['Home / End','最小・最大']],
 render:p=>`<div style="width:260px">${sliderEl(p)}</div>`,code:()=>`<Slider min={0} max={100} step={1} defaultValue={60} label="不透明度" />`,related:['text-field']});

def({id:'date-picker',name:'Date Picker',group:'Forms',desc:'日付・期間の選択。テキスト入力とカレンダーの両方を提供する。',
 when:['日付・期間の指定'],notWhen:['「過去 30 日」などの相対指定が主 → プリセット付き Segmented Control'],
 usage:['よく使う範囲(今日 / 過去 7 日 / 過去 30 日)はプリセットで提供する。','タイムゾーンの扱いをヘルプで明示する。'],
 keys:[['← → ↑ ↓','日付を移動'],['PageUp / PageDown','月を移動'],['Enter','決定']],
 render:()=>datePickerEl(),code:()=>`<DatePicker\n  label="期間"\n  mode="range"\n  presets={["today", "7d", "30d"]}\n/>`,related:['text-field','analytics-chart-container']});

def({id:'search-field',name:'Search Field',group:'Forms',desc:'検索専用の入力。ショートカットヒントとクリア操作を持つ。',
 sizes:['sm','md'],when:['一覧・ドキュメントの検索'],notWhen:['グローバル操作の起点 → Command Menu'],
 usage:['入力に対しデバウンス(200ms 程度)して結果を更新する。','Esc でクリアできるようにする。'],
 keys:[['⌘K / Ctrl+K','検索へフォーカス'],['Esc','クリア']],
 render:p=>searchFieldEl(p),code:()=>`<SearchField placeholder="コンポーネントを検索" shortcut="⌘K" onSearch={...} />`,related:['command-menu','text-field']});

def({id:'input-group',name:'Input Group',group:'Forms',desc:'入力とプレフィックス・ボタンを結合した複合コントロール。',
 when:['URL・金額など単位を伴う入力','入力+即時アクション(コピー・送信)'],
 usage:['結合部分の border を重ねず 1px に保つ。','グループ全体で 1 つの label に関連付ける。'],
 render:()=>inputGroupEl(),code:()=>`<InputGroup label="ドメイン">\n  <InputGroup.Prefix>https://</InputGroup.Prefix>\n  <InputGroup.Input defaultValue="acme.meridian.app" />\n  <InputGroup.Button aria-label="コピー"><CopyIcon /></InputGroup.Button>\n</InputGroup>`,related:['text-field','button']});

def({id:'form-field',name:'Form Field',group:'Forms',desc:'ラベル・コントロール・ヘルプ・エラーを束ねるレイアウトプリミティブ。',
 states:['default','error'],
 when:['すべてのフォームコントロールの配置'],
 usage:['ラベル → コントロール → ヘルプ/エラー の縦順を固定する。','必須マークは * とし、フォーム冒頭で意味を説明する。','エラー発生時はヘルプをエラーに置き換え、二重表示しない。'],
 a11y:['label / aria-describedby / aria-invalid の関連付けを一元管理する'],
 render:p=>fieldEl({label:'API キー名',placeholder:'production-key',helper:'用途が分かる名前を付けてください。',required:true,state:p.state,error:'この名前は既に使われています'}),
 code:()=>`<FormField label="API キー名" required error={errors.name}>\n  <TextField placeholder="production-key" />\n  <FormField.Help>用途が分かる名前を付けてください。</FormField.Help>\n</FormField>`,related:['text-field','validation-message']});

def({id:'validation-message',name:'Validation Message',group:'Forms',desc:'入力エラー・成功の通知。アイコン+テキストで色覚に依存しない。',
 variants:['error','success','warning'],
 when:['フィールド単位の検証結果'],notWhen:['フォーム全体・API 起因のエラー → Alert'],
 usage:['「何が悪いか」+「どう直すか」を 1 文で書く。','送信時にまとめて出す場合は、最初のエラーへフォーカスを移動する。'],
 a11y:['role="alert" または aria-live="polite" で通知する'],
 render:p=>{const v=p.variant||'error';const m={error:[I.err,'danger-fg','@ を含むメールアドレスを入力してください'],success:[I.ok,'success-fg','このワークスペース名は利用できます'],warning:[I.warn,'warning-fg','大文字は小文字に変換されます']}[v];return `<span class="rowflex" style="gap:5px;font-size:var(--text-small);color:var(--${m[1]})">${m[0]}${m[2]}</span>`},
 code:()=>`<ValidationMessage tone="error">\n  @ を含むメールアドレスを入力してください\n</ValidationMessage>`,related:['form-field','alert']});

/* ---- Navigation ---- */
def({id:'sidebar',name:'Sidebar',group:'Navigation',desc:'アプリの主ナビゲーション。ワークスペース切替・グループ・ユーザーメニューを含む。',
 when:['5件以上の恒常的なapp destinationをgroup化する'],notWhen:['少数peer view → Tabs','Mobile overlay → Drawer'],
 usage:['名前付きnavとul/li hierarchyを所有する。','開閉・overlay・focus managementはApp Shell／Drawerへ委譲する。','通常navigationへmenu roleやArrow key modelを追加しない。'],
 keys:[['Tab','Native順で移動'],['Enter / Space','Child controlをactivate']],
 render:()=>sidebarDemo(),code:()=>`<Sidebar ariaLabel="Primary">\n  <Sidebar.Header><WorkspaceSwitcher /></Sidebar.Header>\n  <Sidebar.Group label="Workspace">\n    <NavigationItem href="/dashboard" current>ダッシュボード</NavigationItem>\n    <NavigationItem href="/projects">プロジェクト</NavigationItem>\n  </Sidebar.Group>\n  <Sidebar.Footer><UserMenu /></Sidebar.Footer>\n</Sidebar>`,related:['navigation-item','top-bar','drawer']});

def({id:'top-bar',name:'Top Bar',group:'Navigation',desc:'現在地(パンくず)とグローバル操作(検索・通知・ユーザー)を置く上部バー。',
 states:['default','sticky'],when:['App全体の現在地とpage横断actionをshell上端へ置く'],notWhen:['Page固有title/action → Page Header','編集command群 → Toolbar'],
 usage:['Rootはheaderでnav/toolbar roleを持たない。','LocationをrequiredにしBreadcrumbのlandmarkを維持する。','Sticky高さとfocus scroll offsetを--topbar-hへ同期する。'],
 keys:[['Tab','Leading、location、actionsをNative順で移動']],
 render:p=>topBarDemo(p),code:()=>`<TopBar\n  leading={<SidebarTrigger />}\n  location={<Breadcrumb items={crumbs} />}\n  actions={<><SearchField /><NotificationButton /><UserMenu /></>}\n/>`,related:['breadcrumb','sidebar','page-header']});

def({id:'breadcrumb',name:'Breadcrumb',group:'Navigation',desc:'階層内の現在地を示し、上位階層へ戻る導線を提供する。',
 states:['default','hover','focus','current'],
 when:['3 階層以上の構造を持つ画面'],notWhen:['フラットな構造 — 現在地はページタイトルで十分'],
 usage:['nav > ol > liで階層を表し、最後の現在地はlinkにしない。','Narrow viewportでは同じDOMを横scrollし、itemを削らない。'],
 a11y:['Navigation landmarkを命名する。','Current liへaria-current="page"、separatorへaria-hiddenを設定する。'],
 render:p=>crumbsEl(p),code:()=>`<Breadcrumb\n  items={[\n    { label: "Workspace", href: "/" },\n    { label: "Projects", href: "/projects" },\n    { label: "Meridian" },\n  ]}\n/>`,related:['top-bar','link']});

def({id:'tabs',name:'Tabs',group:'Navigation',desc:'同一コンテキスト内のビュー切り替え。URL に状態を持たせる。',
 states:['default'],
 when:['詳細画面のセクション切り替え(Overview / Members / Settings)'],notWhen:['排他的な表示モード切替 → Segmented Control','ページ間の移動 → Sidebar / Link'],
 usage:['タブの数は 6 個まで。超える場合は情報設計を見直す。','選択状態は下線+primary 色で示し、色のみに頼らない。'],
 keys:[['← →','タブを移動'],['Home / End','先頭・末尾のタブへ']],
 a11y:['role="tablist" / "tab" / "tabpanel" と aria-selected を実装する'],
 render:p=>tabsEl(p),code:()=>`<Tabs defaultValue="overview">\n  <Tabs.List>\n    <Tabs.Tab value="overview">Overview</Tabs.Tab>\n    <Tabs.Tab value="members">Members</Tabs.Tab>\n  </Tabs.List>\n  <Tabs.Panel value="overview">…</Tabs.Panel>\n</Tabs>`,related:['segmented-control','sidebar']});

def({id:'segmented-control',name:'Segmented Control',group:'Navigation',desc:'2〜4 個の排他的な表示モードをその場で切り替える。',
 when:['期間(日/週/月)や表示形式(リスト/ボード)の切替'],notWhen:['ページコンテンツ自体の切替 → Tabs'],
 usage:['選択肢は短い単語にする。','どれか 1 つが常に選択されている状態を保つ。'],
 render:p=>segEl(p),code:()=>`<SegmentedControl\n  options={["日", "週", "月"]}\n  value={range}\n  onChange={setRange}\n/>`,related:['tabs','radio']});

def({id:'pagination',name:'Pagination',group:'Navigation',desc:'大量データのページ移動。件数と現在位置を明示する。',
 when:['100 件を超える一覧'],notWhen:['フィード型の連続閲覧 → 無限スクロール+「もっと見る」'],
 usage:['「全 1,240 件中 41–60 件」のように総数を併記する。','ページサイズ変更(20 / 50 / 100)を提供する。'],
 render:()=>pagerEl(),code:()=>`<Pagination page={3} totalPages={8} onChange={setPage} />`,related:['table']});

def({id:'command-menu',name:'Command Menu',group:'Navigation',desc:'⌘K で開くグローバルなコマンドパレット。ナビゲーションと操作を統合する。',
 states:['default','empty','loading'],
 when:['パワーユーザー向けの高速な移動・操作'],notWhen:['主要導線の代替 — Sidebar は残す'],
 usage:['最近使ったコマンドを先頭グループに出す。','結果はカテゴリでグループ化し、ショートカットを右端に表示する。','0 件時は「一致するコマンドがありません」と入力例を示す。'],
 keys:[['⌘K','開閉'],['↑ ↓','移動'],['Enter','実行'],['Esc','閉じる']],
 a11y:['開いたら入力へフォーカス、閉じたら元の位置へ戻す(フォーカス管理)'],
 render:()=>cmdMenuDemo(),code:()=>`<CommandMenu shortcut="cmd+k">\n  <CommandMenu.Group heading="最近">\n    <CommandMenu.Item icon={<PlusIcon />} shortcut="⌘N">\n      新しいプロジェクト\n    </CommandMenu.Item>\n  </CommandMenu.Group>\n</CommandMenu>`,related:['search-field','dialog']});

def({id:'navigation-item',name:'Navigation Item',group:'Navigation',desc:'Sidebar 内の 1 項目。アイコン・ラベル・バッジ・ネストを持つ。',
 states:['default','hover','focus','current'],flags:[['showBadge','Badge']],texts:[['label','Label','プロジェクト']],
 when:['Sidebarなど永続navigation内の単一destination'],notWhen:['本文中の遷移 → Link','Action → Button','Submenu開閉 → Disclosure Button'],
 usage:['Current pageはaria-current="page"とsurface/weightを同期する。','Native anchorとTab順を保ちrole="menuitem"を追加しない。','Badgeは未読・件数など短いmetadataに限る。'],
 render:p=>navigationItemEl(p),
 code:p=>`<NavigationItem\n  href="/projects"\n  icon={<FolderIcon />}${p.showBadge?'\n  badge={12}':''}${p.state==='current'?'\n  current':''}\n>\n  ${esc(p.label||'プロジェクト')}\n</NavigationItem>`,related:['sidebar','link','tooltip']});

def({id:'product-switcher',name:'Product Switcher',group:'Navigation',desc:'組織内の複数プロダクト・ワークスペースを切り替えるメニュー。',
 usage:['現在のプロダクトにチェックを付ける。','切替は即時遷移とし、確認ダイアログを挟まない。'],
 render:()=>productSwitcherEl(),code:()=>`<ProductSwitcher\n  current="meridian-docs"\n  products={workspaces}\n  onSwitch={...}\n/>`,related:['sidebar','user-menu']});

/* ---- Feedback ---- */
def({id:'toast',name:'Toast',group:'Feedback',desc:'操作結果の一時的な通知。自動で消え、作業を妨げない。',
 variants:['success','info','danger'],texts:[['title','Title','プロジェクトを作成しました'],['body','Body','Acme Dashboard を workspace に追加しました。']],
 when:['保存・作成・削除など操作の完了通知'],notWhen:['ユーザーの判断が必要な情報 → Dialog','恒常的な警告 → Banner / Alert'],
 usage:['4〜6 秒で自動消滅し、閉じるボタンも必ず付ける。','取り消し可能な操作には「元に戻す」アクションを載せる。','同時表示は 3 件まで。古いものから消す。'],
 a11y:['role="status"(エラーは role="alert")で読み上げる','ホバー中は自動消滅タイマーを停止する'],
 render:p=>toastEl({...p,tone:p.variant}),code:p=>`toast.${p.variant||'success'}({\n  title: "${esc(p.title||'プロジェクトを作成しました')}",\n  action: { label: "元に戻す", onClick: undo },\n});`,related:['alert','banner']});

def({id:'alert',name:'Alert',group:'Feedback',desc:'ページ・セクション内に埋め込む恒常的な通知。文脈に密着した情報を伝える。',
 variants:['info','success','warning','danger'],
 when:['フォーム全体のエラー','セクションに関する注意・状態'],notWhen:['一時的な操作結果 → Toast','サイト全体のお知らせ → Banner'],
 usage:['タイトル 1 行+本文 1〜2 文に収める。','danger にはリカバリー手段(再試行・ログ確認)への導線を含める。'],
 render:p=>`<div style="width:min(480px,100%)">${alertEl({tone:p.variant||'info'})}</div>`,
 code:p=>`<Alert tone="${p.variant||'info'}" title="…">\n  本文テキスト\n</Alert>`,related:['toast','banner','validation-message']});

def({id:'banner',name:'Banner',group:'Feedback',desc:'アプリ全体に関わるお知らせを画面上部に表示する。',
 when:['リリース告知・メンテナンス予告・支払い警告'],notWhen:['ページ固有の情報 → Alert'],
 usage:['同時に 1 枚まで。閉じた状態を記憶する。','行動が必要な場合は右端にボタンを 1 つだけ置く。'],
 render:()=>bannerEl(),code:()=>`<Banner tone="info" dismissible action={{ label: "詳細", href: "/changelog" }}>\n  v2.4 リリース: Dynamic color API が利用可能になりました。\n</Banner>`,related:['alert','toast']});

def({id:'dialog',name:'Dialog',group:'Feedback',desc:'ユーザーの判断・入力を求めるモーダル。フォーカスを閉じ込める。',
 variants:['default','danger'],
 when:['短い入力・確認(作成・削除の確認)'],notWhen:['多量の入力・参照 → 専用ページ / Drawer','単なる通知 → Toast'],
 usage:['タイトルは動詞で(「プロジェクトを削除」)。','主要アクションは右端、キャンセルはその左。','破壊的操作は名称の再入力など摩擦を意図的に足す。'],
 keys:[['Esc','閉じる'],['Tab','ダイアログ内を循環(フォーカストラップ)'],['Enter','主要アクション']],
 a11y:['role="dialog" + aria-modal="true" + aria-labelledby','開いたら最初のコントロールへ、閉じたら起点へフォーカスを戻す'],
 render:p=>dialogDemo({tone:p.variant==='danger'?'danger':''}),
 code:p=>`<Dialog open={open} onClose={close}>\n  <Dialog.Title>プロジェクトを${p.variant==='danger'?'削除':'作成'}</Dialog.Title>\n  <Dialog.Body>…</Dialog.Body>\n  <Dialog.Footer>\n    <Button variant="ghost" onClick={close}>キャンセル</Button>\n    <Button variant="${p.variant==='danger'?'danger':'primary'}">${p.variant==='danger'?'完全に削除':'作成'}</Button>\n  </Dialog.Footer>\n</Dialog>`,related:['drawer','toast','invite-member-dialog']});

def({id:'drawer',name:'Drawer',group:'Feedback',desc:'現在の画面文脈を視覚的に残しながら、画面端へ一時的な補助taskをmodal表示するside-aligned dialog。',
 usage:['Native dialogをshowModal()で開き背景を実際にinertにする。','Drawerがmodal lifecycle、childrenがcontent semanticsを所有する。','Close後はtriggerへfocusを戻す。'],
 render:p=>drawerEl(p),code:()=>`<Drawer\n  trigger={<Button variant="secondary">詳細を表示</Button>}\n  title="MRD-142 の詳細"\n  open={open}\n  onOpenChange={setOpen}\n  footer={<Button fullWidth>Issueを開く</Button>}\n>\n  <IssueSummary issue={issue} />\n</Drawer>`,related:['dialog','sidebar','icon-button','list-detail-layout']});

def({id:'popover',name:'Popover',group:'Feedback',desc:'トリガーに紐づく小さな浮遊パネル。フィルタや補助操作を格納する。',
 when:['フィルタ・簡易フォーム・補足 UI'],notWhen:['テキストのみの補足 → Tooltip','重要な確認 → Dialog'],
 usage:['トリガーの近くに表示し、外側クリックと Esc で閉じる。','内部にフォーカス可能な要素がある場合はフォーカスを移す。'],
 render:()=>popoverEl(),code:()=>`<Popover>\n  <Popover.Trigger asChild>\n    <Button variant="secondary" size="sm">フィルタ</Button>\n  </Popover.Trigger>\n  <Popover.Content>…</Popover.Content>\n</Popover>`,related:['tooltip','dialog']});

def({id:'progress',name:'Progress',group:'Feedback',desc:'進捗率が分かる処理の可視化。残り時間の目安があれば併記する。',
 when:['アップロード・エクスポートなど進捗が計測できる処理'],notWhen:['所要不明 → Spinner'],
 usage:['100% 到達後は完了状態(チェック)へ切り替える。','複数ステップの処理は Workflow Step と組み合わせる。'],
 a11y:['role="progressbar" + aria-valuenow / min / max'],
 render:p=>progressEl(p),code:()=>`<Progress value={64} label="アップロード中" />`,related:['spinner','usage-meter','workflow-step']});

def({id:'status-indicator',name:'Status Indicator',group:'Feedback',desc:'リソースの状態を色ドット+ラベルで示す。色のみに依存しない。',
 variants:['success','running','warning','error','idle'],
 usage:['ラベルを必ず併記する。ドット単体は凡例がある表内のみ許容。','点滅アニメーションは「実行中」に限定する。'],
 render:p=>statusEl({s:p.variant||'running'}),code:p=>`<StatusIndicator status="${p.variant||'running'}" label="Running" />`,related:['badge','agent-status']});

/* ---- Data Display ---- */
def({id:'table',name:'Table',group:'Data Display',desc:'構造化データの標準表示。高密度でも読みやすい行リズムを保つ。',
 states:['default','selected','loading','empty'],flags:[['selectable','Row selection']],
 when:['属性を比較しながら走査する一覧'],notWhen:['カード的な閲覧が主 → Card grid','編集・仮想スクロールが必要 → Data Grid'],
 usage:['数値列は右揃え+等幅(tabular-nums)にする。','行の高さは density に連動させる(Compact 32px / Default 40px / Comfortable 48px)。','行クリックで詳細を開く場合も、行内に明示的なリンクを置く。','Empty / Loading / Error の 3 状態を必ず設計する。'],
 tokens:['--table-row-hover','--row-h','--border-muted','--surface-muted'],
 keys:[['↑ ↓','行を移動'],['Space','行を選択'],['Enter','詳細を開く']],
 render:p=>{if(p.state==='empty')return emptyEl({title:'該当するサービスがありません',body:'フィルタ条件を変更するか、新しいサービスを作成してください。'});
  if(p.state==='loading')return `<div class="tscroll" style="width:min(560px,100%)"><table class="tbl"><thead><tr><th>サービス</th><th>環境</th><th>状態</th></tr></thead><tbody>${[1,2,3].map(()=>`<tr><td><div class="skeleton" style="height:10px;width:120px"></div></td><td><div class="skeleton" style="height:10px;width:70px"></div></td><td><div class="skeleton" style="height:10px;width:60px"></div></td></tr>`).join('')}</tbody></table></div>`;
  return `<div style="width:min(620px,100%)">${tableEl({selectable:p.selectable,selectedRow:p.state==='selected'?1:undefined})}</div>`},
 code:()=>`<Table\n  columns={columns}\n  data={services}\n  rowKey="id"\n  selectable\n  onRowClick={openDetail}\n  empty={<EmptyState … />}\n/>`,related:['data-grid','pagination','list']});

def({id:'data-grid',name:'Data Grid',group:'Data Display',desc:'ソート・フィルタ・列リサイズ・仮想スクロールを備えた高機能テーブル。',
 when:['数千行規模のデータ操作','インライン編集'],notWhen:['単純な一覧 → Table(実装コストが 1/10)'],
 usage:['列の表示/非表示・並び順はユーザーごとに保存する。','ソート状態は URL クエリに同期し、共有可能にする。'],
 render:()=>`<div style="width:min(620px,100%)"><div class="rowflex" style="margin-bottom:8px;gap:8px">${searchFieldEl({size:'sm'})}<button class="btn" data-variant="secondary" data-size="sm">${I.filter} フィルタ</button><span style="margin-left:auto;font-size:var(--text-small);color:var(--fg-subtle)">1,240 件中 1–4 件</span></div>${tableEl({selectable:true})}<div style="margin-top:8px">${pagerEl()}</div></div>`,
 code:()=>`<DataGrid\n  columns={columns}\n  rows={rows}\n  sortModel={sort}\n  onSortChange={setSort}\n  virtualized\n/>`,related:['table','pagination']});

def({id:'list',name:'List',group:'Data Display',desc:'単一軸で走査する項目の縦並び。ファイル・履歴などに使う。',
 usage:['行の主情報は左、メタ情報は右に揃える。','ホバーで行全体をハイライトし、クリック領域を広く取る。'],
 render:()=>listEl(),code:()=>`<List>\n  <List.Item icon={<FileIcon />} meta="2.4 KB · 2分前">\n    design-tokens.json\n  </List.Item>\n</List>`,related:['table','activity-feed']});

def({id:'card',name:'Card',group:'Data Display',desc:'関連情報を 1 つの面にまとめる基本コンテナ。',
 states:['default','hover'],
 usage:['カードの入れ子は 1 段まで。深い階層は線と背景で表現する。','padding は card-padding トークンで density に連動させる。','クリック可能なカードは hover でボーダーを強調し、影は控えめに。'],
 tokens:['--surface','--border','--radius-md','--card-pad'],
 render:p=>`<div class="cardc ${p.state==='hover'?'hover sim-hover':''}" style="width:280px"><div class="rowflex" style="justify-content:space-between;margin-bottom:8px"><b style="font-size:var(--text-label)">デプロイ設定</b>${badge({label:'Production',tone:'primary'})}</div><p style="font-size:var(--text-small);color:var(--fg-muted);margin-bottom:12px">main ブランチへの push で自動的にデプロイされます。</p>${btn({label:'設定を編集',variant:'secondary',size:'sm'})}</div>`,
 code:()=>`<Card>\n  <Card.Header title="デプロイ設定" badge={<Badge tone="primary">Production</Badge>} />\n  <Card.Body>…</Card.Body>\n</Card>`,related:['stat-card','kpi-card','panel']});

def({id:'stat-card',name:'Stat Card',group:'Data Display',desc:'単一の指標を強調表示するカード。KPI Card の汎用版。',
 render:()=>`<div class="rowflex">${kpiEl({label:'アクティブユーザー',value:'12,480',delta:'+8.2%'})}${kpiEl({label:'エラー率',value:'0.42%',delta:'-0.11pt',dir:'down'})}</div>`,
 usage:['数値は tabular-nums で桁を揃える。','前期比は矢印+色+符号の 3 重で伝える(色覚対応)。'],
 code:()=>`<StatCard label="アクティブユーザー" value={12480} delta={+8.2} />`,related:['kpi-card','analytics-chart-container']});

def({id:'timeline',name:'Timeline',group:'Data Display',desc:'時系列イベントの縦表示。監査ログ・デプロイ履歴に使う。',
 usage:['新しいものを上にする(作業ログは逆も可、文脈で固定)。','イベント種別を Status ドットで区別する。'],
 render:()=>timelineEl(),code:()=>`<Timeline>\n  <Timeline.Item status="success" title="デプロイ完了" time="2分前">\n    production · v2.4.1\n  </Timeline.Item>\n</Timeline>`,related:['activity-feed','execution-timeline']});

def({id:'activity-feed',name:'Activity Feed',group:'Data Display',desc:'ユーザー行動のフィード。アバター+行動+時刻の定型で表示する。',
 usage:['「誰が」「何を」「いつ」の順で 1 行に収める。','同種イベントの連続は「SN が 3 件のファイルを更新」と集約する。'],
 render:()=>activityFeedEl(),code:()=>`<ActivityFeed items={events} groupBy="hour" />`,related:['timeline','notification-center']});

def({id:'description-list',name:'Description List',group:'Data Display',desc:'キーと値のペアを縦に並べる詳細表示。',
 usage:['キーは foreground-muted、値は foreground で強弱を付ける。','値が長い場合は折り返し、キーの幅を固定する。'],
 render:()=>descListEl(),code:()=>`<DescriptionList>\n  <DescriptionList.Item label="リージョン">ap-northeast-1</DescriptionList.Item>\n</DescriptionList>`,related:['key-value-row','card']});

def({id:'code-block',name:'Code Block',group:'Data Display',desc:'シンタックスハイライト付きのコード表示。コピー操作を標準装備する。',
 usage:['ファイル名・言語をヘッダーに表示する。','横スクロールを許可し、折り返しはオプトインにする。','コピーは 1 クリック+成功フィードバック。'],
 tokens:['--code-bg','--font-mono','--border'],
 render:()=>`<div style="width:min(520px,100%)">${codeBlockDemo()}</div>`,
 code:()=>`<CodeBlock language="tsx" filename="create-action.tsx" copyable>\n  {source}\n</CodeBlock>`,related:['code-diff','run-log']});

def({id:'key-value-row',name:'Key Value Row',group:'Data Display',desc:'1 組のキーと値の行。Description List の構成要素。',
 render:()=>kvEl({items:[['コミット','a1b2c3d'],['ビルド時間','48s']]}),
 code:()=>`<KeyValueRow label="コミット" value="a1b2c3d" copyable />`,related:['description-list']});

/* ---- AI & Developer ---- */
def({id:'prompt-input',name:'Prompt Input',group:'AI & Developer',desc:'AI への指示入力。添付・モデル選択・送信・トークン見積りを統合する。',
 states:['default','focus','loading','disabled','error'],
 when:['チャット・エージェントへの指示入力'],notWhen:['通常のフォーム入力 → Textarea'],
 usage:['Enter は改行、⌘Enter で送信(ヒントを常時表示)。','生成中は送信を停止ボタンに切り替える。','エラー(レート制限など)は入力欄の直下に表示し、内容は保持する。'],
 keys:[['⌘Enter','送信'],['Esc','(生成中) 停止'],['↑','直前のプロンプトを編集']],
 a11y:['textarea に aria-label を付与','トークン見積り・状態変化は aria-live で通知'],
 render:p=>promptEl(p),code:()=>`<PromptInput\n  model={model}\n  onModelChange={setModel}\n  onSubmit={send}\n  attachments\n  tokenEstimate\n/>`,related:['chat-message','model-selector','textarea']});

def({id:'chat-message',name:'Chat Message',group:'AI & Developer',desc:'ユーザー・アシスタント・システムの発話表示。ツール実行やコードを内包する。',
 variants:['assistant','user','system'],flags:[['streaming','Streaming'],['tool','Tool call']],
 usage:['ユーザー発話は面(バブル)、アシスタントは地の文で区別する。','ストリーミング中もコピー・停止操作を可能にする。','ツール実行は折りたたみブロックで、結果の成否を明示する。'],
 render:p=>`<div style="width:min(560px,100%)">${chatMsgEl({role:p.variant||'assistant',streaming:p.streaming,tool:p.tool})}</div>`,
 code:p=>`<ChatMessage role="${p.variant||'assistant'}"${p.streaming?' streaming':''}>\n  <Markdown>{content}</Markdown>\n  ${p.tool?'<ToolCall name="read_file" status="success" />':''}\n</ChatMessage>`,related:['prompt-input','ai-response-card','code-block']});

def({id:'ai-response-card',name:'AI Response Card',group:'AI & Developer',desc:'AI の提案・分析結果を採用/却下できるカードとして提示する。',
 usage:['AI 生成であることをラベルで明示する。','「適用」「編集」「破棄」の 3 操作を標準にする。','確信度・根拠(参照ファイル等)を開示できるようにする。'],
 render:()=>`<div class="cardc" style="width:min(440px,100%);border-color:color-mix(in srgb,var(--primary) 35%,var(--border))"><div class="rowflex" style="justify-content:space-between;margin-bottom:8px"><span class="badge" data-tone="primary">${I.spark} AI の提案</span><span style="font-size:var(--text-micro);color:var(--fg-subtle)">confidence 0.92</span></div><b style="font-size:var(--text-label)">ソート処理をサーバーサイドへ移動</b><p style="font-size:var(--text-small);color:var(--fg-muted);margin:4px 0 12px">クライアントの全件保持をやめ、クエリパラメータ + ページネーションに変更します。参照: data-table.tsx, sort.ts</p><div class="rowflex">${btn({label:'変更を適用',size:'sm'})}${btn({label:'編集',variant:'secondary',size:'sm'})}${btn({label:'破棄',variant:'ghost',size:'sm'})}</div></div>`,
 code:()=>`<AIResponseCard\n  title="ソート処理をサーバーサイドへ移動"\n  confidence={0.92}\n  sources={files}\n  onApply={apply}\n  onDismiss={dismiss}\n/>`,related:['chat-message','code-diff']});

def({id:'agent-status',name:'Agent Status',group:'AI & Developer',desc:'エージェントの実行状態(Idle〜Cancelled の 7 状態)を一目で伝える。',
 variants:['idle','thinking','running','waiting','succeeded','failed','cancelled'],
 usage:['Running / Thinking では停止操作を常に提供する。','Waiting(承認待ち)は warning トーンで、必要な操作を明示する。','Failed は失敗ステップへのリンクを持つ。'],
 render:p=>agentStatusEl({s:p.variant||'running'}),
 code:p=>`<AgentStatus status="${p.variant||'running'}" step={2} totalSteps={5} onCancel={cancel} />`,related:['status-indicator','workflow-step','run-log']});

def({id:'run-log',name:'Run Log',group:'AI & Developer',desc:'実行ログのストリーム表示。タイムスタンプ・レベル・展開可能な詳細を持つ。',
 usage:['等幅フォント+タブラー数字で桁を揃える。','ERROR 行は行全体を danger トーンにし、詳細展開を付ける。','追尾スクロールはユーザーが上へスクロールしたら停止する。'],
 render:()=>runLogEl(),code:()=>`<RunLog\n  entries={logs}\n  follow\n  levelFilter={["info", "warn", "error"]}\n/>`,related:['code-block','execution-timeline']});

def({id:'code-diff',name:'Code Diff',group:'AI & Developer',desc:'変更差分の表示。追加・削除・変更行を色+記号で示す。',
 usage:['+/− 記号を必ず併記し、色のみに依存しない。','ファイルヘッダーに変更量(+2 −1)とパスコピーを置く。','大きな差分はファイル単位で折りたたむ。'],
 render:()=>diffEl(),code:()=>`<CodeDiff\n  file="src/lib/sort.ts"\n  hunks={hunks}\n  collapsible\n  onComment={addComment}\n/>`,related:['code-block','run-log']});

def({id:'file-tree',name:'File Tree',group:'AI & Developer',desc:'階層構造のファイル表示。アクティブ・変更インジケータ・検索を持つ。',
 keys:[['↑ ↓','ノードを移動'],['← →','折りたたみ / 展開'],['Enter','ファイルを開く']],
 usage:['変更のあるファイルにはドットを付ける。','深い階層はインデント+ガイド線で示す。'],
 render:()=>fileTreeEl(),code:()=>`<FileTree\n  data={tree}\n  activePath="src/components/data-table.tsx"\n  modified={changedFiles}\n  searchable\n/>`,related:['list','code-diff']});

def({id:'model-selector',name:'Model Selector',group:'AI & Developer',desc:'AI モデルの切り替えメニュー。特性の説明を添えて選択を助ける。',
 usage:['モデル名は等幅フォントで表示する。','速度・精度などのトレードオフを 1 行で説明する。','会話中の切替はシステムメッセージとして履歴に残す。'],
 render:()=>modelSelectorEl(),code:()=>`<ModelSelector\n  models={models}\n  value="claude-sonnet-4-6"\n  onChange={setModel}\n/>`,related:['prompt-input','select']});

def({id:'usage-meter',name:'Usage Meter',group:'AI & Developer',desc:'使用量と上限の可視化。閾値で色が変化する。',
 usage:['75% で warning、90% で danger に切り替える。','数値(720k / 1M)と割合を併記する。','上限接近時はアップグレード導線を近くに置く。'],
 render:p=>usageMeterEl(p),code:()=>`<UsageMeter\n  label="API リクエスト"\n  value={720_000}\n  max={1_000_000}\n  thresholds={{ warning: 0.75, danger: 0.9 }}\n/>`,related:['progress','billing-plan-card']});

def({id:'workflow-step',name:'Workflow Step',group:'AI & Developer',desc:'複数ステップ処理の進行表示。完了・実行中・未着手を区別する。',
 usage:['実行中ステップにはサブテキストで現在の処理を表示する。','失敗時は該当ステップに error を表示し、再実行を提供する。'],
 render:()=>workflowStepsEl(),code:()=>`<WorkflowSteps\n  steps={steps}\n  current={2}\n  onRetry={retryStep}\n/>`,related:['execution-timeline','progress','agent-status']});

def({id:'execution-timeline',name:'Execution Timeline',group:'AI & Developer',desc:'エージェント実行の時系列ビュー。各ステップの種別・所要時間・成否を表示する。',
 usage:['ツール呼び出しは名前を等幅で表示し、クリックで入出力を展開する。','失敗ステップから再開できる導線を付ける。'],
 render:()=>execTimelineEl(),code:()=>`<ExecutionTimeline\n  run={run}\n  expandable\n  onResumeFrom={resume}\n/>`,related:['run-log','workflow-step','timeline']});

/* ---- SaaS ---- */
def({id:'kpi-card',name:'KPI Card',group:'SaaS',desc:'ダッシュボードの主要指標。値・変化量・スパークラインをまとめる。',
 texts:[['label','Label','MRR'],['value','Value','¥2,840,000']],
 usage:['1 行目ラベル、2 行目に大きな値、3 行目に変化量の 3 段構成を守る。','変化量の色は良し悪しで決める(コスト減は緑)。'],
 render:p=>kpiEl(p),code:p=>`<KPICard\n  label="${esc(p.label||'MRR')}"\n  value={2_840_000}\n  format="currency"\n  delta={+12.4}\n  sparkline={history}\n/>`,related:['stat-card','analytics-chart-container']});

def({id:'analytics-chart-container',name:'Analytics Chart Container',group:'SaaS',desc:'チャートの標準コンテナ。タイトル・期間切替・凡例・メニューを備える。',
 usage:['チャート色は chart-1〜6 トークンを順に使う。','凡例は色+ラベルを併記し、クリックで系列を切り替えられるようにする。','データ 0 件・読み込み中・エラーの 3 状態を用意する。'],
 render:()=>chartContainerEl(),code:()=>`<ChartContainer title="API リクエスト数" range={range} onRangeChange={setRange}>\n  <LineChart data={data} series={["production", "staging"]} />\n</ChartContainer>`,related:['kpi-card','date-picker']});

def({id:'settings-panel',name:'Settings Panel',group:'SaaS',desc:'設定グループの標準パネル。見出し・説明・行単位の設定・保存操作。',
 usage:['即時反映の設定は Switch、まとめて保存は Checkbox+Save bar を使う。','危険な設定(削除など)は Danger zone として分離する。'],
 render:()=>settingsPanelEl(),code:()=>`<SettingsPanel title="通知設定" description="…">\n  <SettingsPanel.Row label="デプロイの完了">\n    <Switch defaultChecked />\n  </SettingsPanel.Row>\n</SettingsPanel>`,related:['switch','settings-layout']});

def({id:'billing-plan-card',name:'Billing Plan Card',group:'SaaS',desc:'料金プランの比較カード。現在のプランを明示する。',
 flags:[['cur','Current plan']],
 usage:['現在のプランは primary ボーダーで囲み、CTA を「プランを管理」に変える。','機能差分はチェックリストで揃える。'],
 render:p=>planCard(p),code:()=>`<PlanCard\n  plan={pro}\n  current={plan.id === "pro"}\n  onUpgrade={upgrade}\n/>`,related:['usage-meter','billing-flow']});

def({id:'user-menu',name:'User Menu',group:'SaaS',desc:'アカウント関連操作のドロップダウン。フッターやトップバー右端に置く。',
 usage:['名前+メールを先頭に固定表示する。','ログアウトは区切り線の下、danger トーンで配置する。'],
 render:()=>userMenuEl(),code:()=>`<UserMenu user={user}>\n  <UserMenu.Item href="/profile">プロフィール</UserMenu.Item>\n  <UserMenu.Separator />\n  <UserMenu.Item tone="danger" onClick={logout}>ログアウト</UserMenu.Item>\n</UserMenu>`,related:['avatar','sidebar']});

def({id:'notification-center',name:'Notification Center',group:'SaaS',desc:'通知の一覧パネル。未読の強調と一括既読を持つ。',
 usage:['未読は primary-subtle 背景で示す。','通知クリックで対象へ遷移し、既読化する。'],
 render:()=>notifCenterEl(),code:()=>`<NotificationCenter\n  notifications={items}\n  onMarkAllRead={markAll}\n  onItemClick={open}\n/>`,related:['toast','activity-feed']});

def({id:'invite-member-dialog',name:'Invite Member Dialog',group:'SaaS',desc:'メンバー招待の定型ダイアログ。メール+ロール選択。',
 usage:['複数メールのカンマ区切り入力に対応する。','ロールには権限の説明を添える。','送信後は Pending invites 一覧に反映し、再送・取消を可能にする。'],
 render:()=>inviteDialogEl(),code:()=>`<InviteMemberDialog\n  open={open}\n  roles={roles}\n  onInvite={sendInvites}\n/>`,related:['dialog','team-invitation-flow']});

def({id:'project-card',name:'Project Card',group:'SaaS',desc:'プロジェクト一覧のカード表示。進捗・メンバー・更新時刻を要約する。',
 render:()=>projectCard(),code:()=>`<ProjectCard project={p} onOpen={open} />`,
 usage:['カード全体をクリック可能にしつつ、メニューは独立した操作にする。'],related:['card','task-board-card']});

def({id:'issue-row',name:'Issue Row',group:'SaaS',desc:'Issue トラッカーの 1 行。ID・タイトル・優先度・状態・担当を 1 行に収める。',
 usage:['タイトルは省略記号で 1 行に収め、詳細はパネルで見せる。','優先度と状態は色+ラベルで表示する。'],
 render:()=>`<div style="width:min(620px,100%);display:flex;flex-direction:column;gap:6px">${issueRow()}${issueRow({id:'MRD-138',title:'Density: Comfortable でフォーム間隔が広すぎる',pr:'Med',st:['idle','Todo'],labels:['density'],who:'YK'})}</div>`,
 code:()=>`<IssueRow issue={issue} selected={sel} onSelect={toggle} onOpen={openDetail} />`,related:['table','issue-tracker']});

def({id:'task-board-card',name:'Task Board Card',group:'SaaS',desc:'カンバンボードのタスクカード。ドラッグ対応を想定した密度。',
 usage:['ラベルは 2 個まで表示し、残りは +N にまとめる。','ドラッグ中は影を強め、ドロップ先をハイライトする。'],
 render:()=>taskCard(),code:()=>`<TaskCard task={task} draggable onOpen={open} />`,related:['project-card','project-management']});

def({id:'integration-card',name:'Integration Card',group:'SaaS',desc:'外部連携のカード。接続済み・要設定・未接続の状態を持つ。',
 variants:['connected','setup','none'],
 usage:['状態ごとに CTA を変える(接続する / 設定を完了 / 設定)。'],
 render:p=>integrationCard({state:p.variant||'connected'}),
 code:()=>`<IntegrationCard\n  integration={slack}\n  status="connected"\n  onConfigure={openConfig}\n/>`,related:['card','integration-marketplace']});
