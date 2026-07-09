/* ============ Color engine (OKLCH) ============
 * HSLではなくOKLCH(Björn Ottosson, 2020)でトーンスケールを生成する。
 * HSLのLは知覚的に不均一（同じLでも黄と青では体感の明るさが違う）ため、
 * 色相ごとにL_MAP/彩度カーブを手で補正する必要があった。OKLCHのLは
 * 知覚的に均一なので、単一のL_MAPが全色相で成立する。
 * Cはsx色域より広いので、sRGBに収まらない組み合わせが出る -> oklchToHexで
 * 彩度(チャコマ)を自動的に落として収める(ガマットマッピング)。
 *
 * このファイルはDOM(document/window/localStorage)に依存しない純粋関数のみを
 * 持つ。ブラウザでは classic <script src="src/color-engine.js"> として読み込まれ、
 * トップレベルの function 宣言がそのまま window の globals になる(index.html の
 * 残りのスクリプトはそれを前提に buildPalettes() 等をそのまま呼んでいる)。
 * Node ではテストから require('../src/color-engine.js') として読み込む。
 */
function srgbToLinear(c){c/=255;return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4)}
function linearToSrgb8(c){c=c<=0.0031308?c*12.92:1.055*Math.pow(c,1/2.4)-0.055;return Math.min(255,Math.max(0,Math.round(c*255)))}
function linearRgbToOklab(r,g,b){
  const l=0.4122214708*r+0.5363325363*g+0.0514459929*b;
  const m=0.2119034982*r+0.6806995451*g+0.1073969566*b;
  const s=0.0883024619*r+0.2817188376*g+0.6299787005*b;
  const l_=Math.cbrt(l),m_=Math.cbrt(m),s_=Math.cbrt(s);
  return{L:0.2104542553*l_+0.7936177850*m_-0.0040720468*s_,
    a:1.9779984951*l_-2.4285922050*m_+0.4505937099*s_,
    b:0.0259040371*l_+0.7827717662*m_-0.8086757660*s_};
}
function oklabToLinearRgb(L,a,b){
  const l_=L+0.3963377774*a+0.2158037573*b,m_=L-0.1055613458*a-0.0638541728*b,s_=L-0.0894841775*a-1.2914855480*b;
  const l=l_*l_*l_,m=m_*m_*m_,s=s_*s_*s_;
  return{r:4.0767416621*l-3.3077115913*m+0.2309699292*s,
    g:-1.2684380046*l+2.6097574011*m-0.3413193965*s,
    b:-0.0041960863*l-0.7034186147*m+1.7076147010*s};
}
function hexToOklch(hex){hex=hex.replace('#','');if(hex.length===3)hex=hex.split('').map(c=>c+c).join('');
  const r=srgbToLinear(parseInt(hex.slice(0,2),16)),g=srgbToLinear(parseInt(hex.slice(2,4),16)),b=srgbToLinear(parseInt(hex.slice(4,6),16));
  const{L,a,b:bb}=linearRgbToOklab(r,g,b);
  const c=Math.sqrt(a*a+bb*bb);let h=Math.atan2(bb,a)*180/Math.PI;if(h<0)h+=360;
  return{l:L*100,c,h};
}
function oklchToLinearRgb(l,c,h){const L=l/100,hr=h*Math.PI/180;return oklabToLinearRgb(L,c*Math.cos(hr),c*Math.sin(hr))}
function oklchInGamut(l,c,h){const{r,g,b}=oklchToLinearRgb(l,c,h);const e=1e-4;return r>=-e&&r<=1+e&&g>=-e&&g<=1+e&&b>=-e&&b<=1+e}
function oklchToHex(l,c,h){
  l=Math.min(100,Math.max(0,l));c=Math.max(0,c);
  if(!oklchInGamut(l,c,h)){
    let lo=0,hi=c;
    for(let i=0;i<20;i++){const mid=(lo+hi)/2;if(oklchInGamut(l,mid,h))lo=mid;else hi=mid}
    c=lo;
  }
  const{r,g,b}=oklchToLinearRgb(l,c,h);
  const f=v=>linearToSrgb8(v).toString(16).padStart(2,'0');
  return '#'+f(r)+f(g)+f(b);
}
function luminance(hex){hex=hex.replace('#','');const v=[0,2,4].map(i=>{let c=parseInt(hex.slice(i,i+2),16)/255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4)});return 0.2126*v[0]+0.7152*v[1]+0.0722*v[2]}
function contrast(a,b){const l1=luminance(a),l2=luminance(b);return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05)}
/* 固定しきい値(旧: 3.4、根拠なし)ではなく、白/黒それぞれの実際のコントラスト比を
 * 計算してより高い方を選ぶ。常に理論上ベストな組み合わせになる。 */
function onColor(bg){return contrast(bg,'#ffffff')>=contrast(bg,'#0a0a14')?'#ffffff':'#0a0a14'}
function alpha(hex,a){hex=hex.replace('#','');const r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),b=parseInt(hex.slice(4,6),16);return `rgba(${r},${g},${b},${a})`}
function hexToOklab(hex){hex=hex.replace('#','');if(hex.length===3)hex=hex.split('').map(c=>c+c).join('');
  return linearRgbToOklab(srgbToLinear(parseInt(hex.slice(0,2),16)),srgbToLinear(parseInt(hex.slice(2,4),16)),srgbToLinear(parseInt(hex.slice(4,6),16)));
}
/* 旧実装はsRGBのバイト値(ガンマ補正後)をそのまま線形補間していたため、
 * 特に黒/白へ向けたブレンドで彩度が濁って見えやすかった(sRGBの補間は
 * 知覚的にもガンマ的にも均一ではない)。OKLab(直交座標なので色相の
 * 巻き戻り問題もない)でL/a/bを補間し、そこからoklchToHexで書き戻すことで、
 * 「primary-subtleは薄いprimaryの色味を保ったまま暗くなる」ような
 * 直感通りのブレンド結果になる。 */
function mix(h1,h2,w){
  const c1=hexToOklab(h1),c2=hexToOklab(h2);
  const L=c1.L*(1-w)+c2.L*w,a=c1.a*(1-w)+c2.a*w,b=c1.b*(1-w)+c2.b*w;
  const c=Math.sqrt(a*a+b*b);let h=Math.atan2(b,a)*180/Math.PI;if(h<0)h+=360;
  return oklchToHex(L*100,c,h);
}
function clamp(v,min,max){return Math.min(max,Math.max(min,v))}

const STEPS=[50,100,200,300,400,500,600,700,800,900,950];
/* OKLCH Lは知覚的に均一なので、色相依存の補正なしで全ロールに共通のカーブを使える。 */
const L_MAP={50:97,100:93,200:86,300:77,400:67,500:58,600:49,700:40,800:31,900:23,950:15};
/* Cの相対カーブ。絶対値の上限はここでは決めず、oklchToHexのガマットマッピングに
 * 委ねる(色相によってsRGBに収まる最大彩度が大きく違うため、固定上限を持たない)。 */
const C_CURVE={50:.08,100:.16,200:.32,300:.52,400:.75,500:.92,600:1,700:.94,800:.82,900:.66,950:.46};
function makeScale(h,c){const o={};for(const st of STEPS){o[st]=oklchToHex(L_MAP[st],c*C_CURVE[st],h)}return o}
function makeNeutral(h,c){const o=makeScale(h,c);o[0]='#ffffff';o[25]=oklchToHex(98.4,Math.min(c,0.01),h);return o}
/* preferredステップから開始し、bgとのコントラストがtargetを満たすまでdir方向
 * (+1=より濃く/950側、-1=より薄く/50側)にステップを歩いて自動選択する。
 * 旧実装は「lightテーマは常に600番」のように固定していたため、ユーザーが
 * 選んだシード色によってはAA基準(4.5:1)を満たさない組み合わせが出ていた。 */
function accessibleStepIndex(scale,bg,preferred,target,dir){
  let idx=STEPS.indexOf(preferred);
  while(idx>=0&&idx<STEPS.length){
    if(contrast(scale[STEPS[idx]],bg)>=target)return idx;
    idx+=dir;
  }
  return dir>0?STEPS.length-1:0;
}

const SEED_PRESETS=[
  {name:'Blue',hex:'#3D74E0'},{name:'Violet',hex:'#7856D6'},{name:'Indigo',hex:'#5B5BD6'},
  {name:'Emerald',hex:'#1F9D6B'},{name:'Amber',hex:'#C97A12'},{name:'Rose',hex:'#D64570'},
  {name:'Slate',hex:'#5C6B84'}
];

function buildPalettes(seed){
  const s=hexToOklch(seed);
  /* シードのチャコマをロールごとに相対配分し、絶対上限はガマットマッピングに任せる。
   * 旧HSL版は色相ごとに安全な彩度上限が違うため個別のclampが必要だったが、
   * OKLCHはoklchToHexが色相に応じて自動的に収めるので単純な相対値で済む。 */
  const primary=makeScale(s.h, clamp(s.c,0.09,0.32));
  const secondary=makeScale(s.h, clamp(s.c*.32,0.02,0.10));
  const accent=makeScale((s.h+42)%360, clamp(s.c*.95,0.10,0.28));
  const neutral=makeNeutral(s.h, clamp(s.c*.045,0.006,0.018));
  const neutralVariant=makeNeutral(s.h, clamp(s.c*.09,0.014,0.036));
  /* ステータス色はユーザー入力に依存しない固定値。HSL色相をそのままOKLCH色相として
   * 流用すると見た目の色味がずれる(例: HSL 4°の赤 ≠ OKLCH 4°の赤)ため、
   * OKLCH上で見た目通りの色相(green≈150 / amber≈75 / red≈27 / blue≈255)に定義し直した。 */
  const success=makeScale(150,0.15), warning=makeScale(75,0.16), danger=makeScale(27,0.18), info=makeScale(255,0.14);
  return {primary,secondary,accent,neutral,neutralVariant,success,warning,danger,info};
}
/* あるロールのスケールから、preferredステップを基準にhover/active用の
 * 隣接ステップも一緒に返す。preferred自体はaccessibleStepIndexでbgとの
 * コントラストが確保できるところまで自動でズレるので、hover/activeは
 * 「そこからさらにdir方向へ1〜2段階」という相対関係を保てば、
 * どのステップに着地しても常にprimaryより濃い(薄い)ままになる。 */
function roleSteps(scale,bg,preferred,target,dir){
  const i=accessibleStepIndex(scale,bg,preferred,target,dir);
  const at=off=>scale[STEPS[clamp(i+off*dir,0,STEPS.length-1)]];
  return{base:at(0),hover:at(1),active:at(2)};
}
function buildSemantics(P,theme){
  const n=P.neutral, ac=P.accent;
  const pr=P.primary, sc=P.secondary;
  let T;
  if(theme==='light'){
    const bg=n[25];
    const prR=roleSteps(pr,bg,600,4.5,1), scR=roleSteps(sc,bg,600,4.5,1), acR=roleSteps(ac,bg,600,4.5,1);
    T={
    'background':bg,'background-subtle':n[50],'surface':n[0],'surface-muted':n[50],
    'surface-raised':n[0],'surface-overlay':n[0],'surface-inverse':n[900],
    'foreground':n[900],'foreground-muted':n[600],'foreground-subtle':n[500],'foreground-disabled':n[400],
    'border':n[200],'border-muted':mix(n[100],n[200],.45),'border-strong':n[300],
    'primary':prR.base,'primary-hover':prR.hover,'primary-active':prR.active,'primary-subtle':pr[50],'primary-muted':pr[100],'primary-foreground':onColor(prR.base),
    'secondary':scR.base,'secondary-hover':scR.hover,'secondary-active':scR.active,
    'accent':acR.base,'accent-hover':acR.hover,'accent-active':acR.active,
    'success':P.success[600],'success-subtle':P.success[50],'success-foreground':P.success[700],
    'warning':P.warning[500],'warning-subtle':P.warning[50],'warning-foreground':P.warning[700],
    'danger':P.danger[600],'danger-subtle':P.danger[50],'danger-foreground':P.danger[700],
    'info':P.info[600],'info-subtle':P.info[50],'info-foreground':P.info[700],
    'focus-ring':pr[500],'selection':pr[100],'highlight':P.warning[100],'disabled':n[300],
    'overlay':alpha(n[950],.5),'scrim':alpha(n[950],.4)
  }}
  else if(theme==='dark'){
    /* サーフェス色はneutralの色相・チャコマを保ったまま明度だけ変える。
     * n[950]等のOKLCH値を取り出して低L側で再合成する。 */
    const n950=hexToOklch(n[950]), n900=hexToOklch(n[900]), n800=hexToOklch(n[800]), n700=hexToOklch(n[700]);
    const bg=oklchToHex(9,n950.c,n950.h);
    const prR=roleSteps(pr,bg,400,4.5,-1), scR=roleSteps(sc,bg,400,4.5,-1), acR=roleSteps(ac,bg,400,4.5,-1);
    T={
    'background':bg,'background-subtle':oklchToHex(11.5,n950.c,n950.h),
    'surface':oklchToHex(13,n900.c,n900.h),'surface-muted':oklchToHex(16.5,n900.c,n900.h),
    'surface-raised':oklchToHex(15.5,n900.c,n900.h),'surface-overlay':oklchToHex(17,n900.c,n900.h),'surface-inverse':n[50],
    'foreground':n[50],'foreground-muted':n[400],'foreground-subtle':n[500],'foreground-disabled':n[600],
    'border':oklchToHex(22,n800.c,n800.h),'border-muted':oklchToHex(18,n800.c,n800.h),'border-strong':oklchToHex(30,n700.c,n700.h),
    'primary':prR.base,'primary-hover':prR.hover,'primary-active':prR.active,'primary-subtle':mix(pr[900],'#000000',.35),'primary-muted':pr[900],'primary-foreground':onColor(prR.base),
    'secondary':scR.base,'secondary-hover':scR.hover,'secondary-active':scR.active,
    'accent':acR.base,'accent-hover':acR.hover,'accent-active':acR.active,
    'success':P.success[500],'success-subtle':mix(P.success[900],'#000',.45),'success-foreground':P.success[400],
    'warning':P.warning[500],'warning-subtle':mix(P.warning[900],'#000',.45),'warning-foreground':P.warning[400],
    'danger':P.danger[500],'danger-subtle':mix(P.danger[900],'#000',.45),'danger-foreground':P.danger[400],
    'info':P.info[500],'info-subtle':mix(P.info[900],'#000',.45),'info-foreground':P.info[400],
    'focus-ring':prR.base,'selection':alpha(pr[500],.32),'highlight':alpha(P.warning[500],.25),'disabled':n[700],
    'overlay':alpha('#000000',.6),'scrim':alpha('#000000',.55)
  }}
  else {
    /* high contrast: 通常のAA(4.5:1)より厳しいAAA相当(7:1)を目標にステップを選ぶ */
    const bg='#ffffff';
    const prR=roleSteps(pr,bg,700,7,1), scR=roleSteps(sc,bg,700,7,1), acR=roleSteps(ac,bg,700,7,1);
    T={
    'background':bg,'background-subtle':n[50],'surface':'#ffffff','surface-muted':n[50],
    'surface-raised':'#ffffff','surface-overlay':'#ffffff','surface-inverse':'#000000',
    'foreground':'#0a0a0f','foreground-muted':n[800],'foreground-subtle':n[700],'foreground-disabled':n[500],
    'border':n[500],'border-muted':n[300],'border-strong':n[800],
    'primary':prR.base,'primary-hover':prR.hover,'primary-active':prR.active,'primary-subtle':pr[50],'primary-muted':pr[100],'primary-foreground':onColor(prR.base),
    'secondary':scR.base,'secondary-hover':scR.hover,'secondary-active':scR.active,
    'accent':acR.base,'accent-hover':acR.hover,'accent-active':acR.active,
    'success':P.success[700],'success-subtle':P.success[50],'success-foreground':P.success[800],
    'warning':P.warning[600],'warning-subtle':P.warning[50],'warning-foreground':P.warning[800],
    'danger':P.danger[700],'danger-subtle':P.danger[50],'danger-foreground':P.danger[800],
    'info':P.info[700],'info-subtle':P.info[50],'info-foreground':P.info[800],
    'focus-ring':'#0a0a0f','selection':pr[100],'highlight':P.warning[100],'disabled':n[400],
    'overlay':alpha('#000000',.6),'scrim':alpha('#000000',.5)
  }}
  return T;
}
function buildCharts(seed,theme){
  const s=hexToOklch(seed);const L=theme==='dark'?68:56;const c=clamp(s.c,0.12,0.19);
  return [0,36,80,148,198,262].map(d=>oklchToHex(L,c,(s.h+d)%360));
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    srgbToLinear, linearToSrgb8, linearRgbToOklab, oklabToLinearRgb,
    hexToOklch, oklchToLinearRgb, oklchInGamut, oklchToHex,
    luminance, contrast, onColor, alpha, hexToOklab, mix, clamp,
    STEPS, L_MAP, C_CURVE, makeScale, makeNeutral, accessibleStepIndex,
    SEED_PRESETS, buildPalettes, roleSteps, buildSemantics, buildCharts,
  };
}
