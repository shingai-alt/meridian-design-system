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
  /* Product surfaces must remain calm and predictable when the brand seed changes.
   * Keep the default neutral family seed-independent; tonal brand expression belongs
   * to primary-subtle and the explicitly tinted neutral-variant family. */
  const neutral=makeNeutral(260,0.004);
  const neutralVariant=makeNeutral(s.h,clamp(s.c*.06,0.012,0.024));
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
function buildSemantics(P,theme,contrastMode='standard'){
  if(!['light','dark'].includes(theme))throw new Error(`Unknown theme: ${theme}`);
  if(!['standard','high'].includes(contrastMode))throw new Error(`Unknown contrast mode: ${contrastMode}`);
  const n=P.neutral, ac=P.accent;
  const pr=P.primary, sc=P.secondary;
  const high=contrastMode==='high';
  let T;
  if(theme==='light'){
    const bg=high?'#ffffff':n[25];
    const target=high?7:4.5;
    const preferred=high?700:600;
    const prR=roleSteps(pr,bg,preferred,target,1), scR=roleSteps(sc,bg,preferred,target,1), acR=roleSteps(ac,bg,preferred,target,1);
    T={
    'background':bg,'background-subtle':n[50],'surface':n[0],'surface-muted':n[50],'surface-sunken':n[100],
    'surface-raised':n[0],'surface-overlay':n[0],'surface-inverse':high?'#000000':n[900],
    'control-background':high?n[0]:n[50],'control-background-hover':high?n[50]:n[100],'control-background-active':high?n[100]:n[200],
    'control-border':high?'#0a0a0f':n[500],'control-border-hover':high?'#0a0a0f':n[700],
    'foreground':high?'#0a0a0f':n[900],'foreground-muted':high?n[800]:n[600],'foreground-subtle':high?n[700]:n[500],'foreground-disabled':high?n[500]:n[400],
    'border':high?n[500]:n[200],'border-muted':high?n[300]:mix(n[100],n[200],.45),'border-strong':high?n[800]:n[300],
    'primary':prR.base,'primary-hover':prR.hover,'primary-active':prR.active,'primary-subtle':pr[50],'primary-muted':pr[100],'primary-foreground':onColor(prR.base),
    'secondary':scR.base,'secondary-hover':scR.hover,'secondary-active':scR.active,'secondary-on-solid':onColor(scR.base),
    'accent':acR.base,'accent-hover':acR.hover,'accent-active':acR.active,'accent-on-solid':onColor(acR.base),
    'success':P.success[high?700:600],'success-subtle':P.success[50],'success-foreground':P.success[high?800:700],'success-on-solid':onColor(P.success[high?700:600]),
    'warning':P.warning[high?600:500],'warning-subtle':P.warning[50],'warning-foreground':P.warning[high?800:700],'warning-on-solid':onColor(P.warning[high?600:500]),
    'danger':P.danger[high?700:600],'danger-subtle':P.danger[50],'danger-foreground':P.danger[high?800:700],'danger-on-solid':onColor(P.danger[high?700:600]),
    'info':P.info[high?700:600],'info-subtle':P.info[50],'info-foreground':P.info[high?800:700],'info-on-solid':onColor(P.info[high?700:600]),
    'focus-ring':high?'#0a0a0f':pr[500],'selection':pr[100],'highlight':P.warning[100],'disabled':n[high?400:300],
    'overlay':alpha(n[950],high?.6:.5),'scrim':alpha(n[950],high?.5:.4)
  }}
  else {
    const n950=hexToOklch(n[950]);
    const darkSurface=(standard,enhanced)=>oklchToHex(high?enhanced:standard,n950.c,n950.h);
    const bg=high?'#000000':darkSurface(18,0);
    const target=high?7:4.5;
    const preferred=high?300:400;
    const prR=roleSteps(pr,bg,preferred,target,-1), scR=roleSteps(sc,bg,preferred,target,-1), acR=roleSteps(ac,bg,preferred,target,-1);
    const statusStep=high?400:500;
    const statusFgStep=high?200:400;
    T={
    'background':bg,'background-subtle':darkSurface(21,10),
    'surface':darkSurface(24,16),'surface-muted':darkSurface(27,22),'surface-sunken':darkSurface(20,8),
    'surface-raised':darkSurface(30,28),'surface-overlay':darkSurface(34,34),'surface-inverse':high?'#ffffff':n[50],
    'control-background':darkSurface(28,18),'control-background-hover':darkSurface(34,25),'control-background-active':darkSurface(38,32),
    'control-border':high?'#ffffff':darkSurface(56,70),'control-border-hover':high?'#ffffff':darkSurface(64,82),
    'foreground':high?'#ffffff':n[50],'foreground-muted':high?n[200]:n[400],'foreground-subtle':high?n[300]:n[500],'foreground-disabled':high?n[500]:n[600],
    'border':high?n[400]:darkSurface(42,58),'border-muted':high?n[600]:darkSurface(34,42),'border-strong':high?n[100]:darkSurface(54,72),
    'primary':prR.base,'primary-hover':prR.hover,'primary-active':prR.active,'primary-subtle':mix(pr[900],'#000000',high?.2:.35),'primary-muted':high?pr[800]:pr[900],'primary-foreground':onColor(prR.base),
    'secondary':scR.base,'secondary-hover':scR.hover,'secondary-active':scR.active,'secondary-on-solid':onColor(scR.base),
    'accent':acR.base,'accent-hover':acR.hover,'accent-active':acR.active,'accent-on-solid':onColor(acR.base),
    'success':P.success[statusStep],'success-subtle':mix(P.success[900],'#000',high?.6:.45),'success-foreground':P.success[statusFgStep],'success-on-solid':onColor(P.success[statusStep]),
    'warning':P.warning[statusStep],'warning-subtle':mix(P.warning[900],'#000',high?.6:.45),'warning-foreground':P.warning[statusFgStep],'warning-on-solid':onColor(P.warning[statusStep]),
    'danger':P.danger[statusStep],'danger-subtle':mix(P.danger[900],'#000',high?.6:.45),'danger-foreground':P.danger[statusFgStep],'danger-on-solid':onColor(P.danger[statusStep]),
    'info':P.info[statusStep],'info-subtle':mix(P.info[900],'#000',high?.6:.45),'info-foreground':P.info[statusFgStep],'info-on-solid':onColor(P.info[statusStep]),
    'focus-ring':prR.base,'selection':alpha(pr[high?400:500],high?.45:.32),'highlight':alpha(P.warning[high?400:500],high?.35:.25),'disabled':n[700],
    'overlay':alpha('#000000',high?.7:.6),'scrim':alpha('#000000',high?.65:.55)
  }}
  return T;
}
function buildCharts(seed,theme){
  const s=hexToOklch(seed);const L=theme==='dark'?68:56;const c=clamp(s.c,0.12,0.19);
  return [0,36,80,148,198,262].map(d=>oklchToHex(L,c,(s.h+d)%360));
}
/* chart色(--chart-1..6)はカテゴリの塗り色専用で、その上に乗せる文字色を計算する
 * semantic tokenが無かった(danger-on-solidと同種の欠落)。buildCharts()の出力に
 * 対して一律onColor()を適用し、常に対応する文字色を用意できるようにする。 */
function chartForegrounds(chartColors){
  return chartColors.map(c=>onColor(c));
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    srgbToLinear, linearToSrgb8, linearRgbToOklab, oklabToLinearRgb,
    hexToOklch, oklchToLinearRgb, oklchInGamut, oklchToHex,
    luminance, contrast, onColor, alpha, hexToOklab, mix, clamp,
    STEPS, L_MAP, C_CURVE, makeScale, makeNeutral, accessibleStepIndex,
    SEED_PRESETS, buildPalettes, roleSteps, buildSemantics, buildCharts,
    chartForegrounds,
  };
}
