"use strict";
/* AUTO-GENERATED from tokens/src foundation files. */
const SPACING_SCALE=[
  {
    "id": "0",
    "token": "--sp-0",
    "value": "0px",
    "description": "余白を明示的に取り除く。",
    "usage": "resetとedge alignment"
  },
  {
    "id": "05",
    "token": "--sp-05",
    "value": "2px",
    "description": "borderやiconの光学調整に限るhalf step。",
    "usage": "optical adjustmentのみ"
  },
  {
    "id": "1",
    "token": "--sp-1",
    "value": "4px",
    "description": "密接した要素の最小gap。",
    "usage": "icon内部・密接したmetadata"
  },
  {
    "id": "15",
    "token": "--sp-15",
    "value": "6px",
    "description": "compact UIの補助step。",
    "usage": "compact controlの内部gap"
  },
  {
    "id": "2",
    "token": "--sp-2",
    "value": "8px",
    "description": "関連するcontrolやinline要素の標準gap。",
    "usage": "inline group・iconとlabel"
  },
  {
    "id": "25",
    "token": "--sp-25",
    "value": "10px",
    "description": "compact componentのpadding補助step。",
    "usage": "compact control padding"
  },
  {
    "id": "3",
    "token": "--sp-3",
    "value": "12px",
    "description": "小groupとcompact containerの標準gap。",
    "usage": "small group・compact card"
  },
  {
    "id": "4",
    "token": "--sp-4",
    "value": "16px",
    "description": "component内paddingとform field間の標準値。",
    "usage": "component padding・form gap"
  },
  {
    "id": "5",
    "token": "--sp-5",
    "value": "20px",
    "description": "comfortable componentのpadding。",
    "usage": "comfortable container"
  },
  {
    "id": "6",
    "token": "--sp-6",
    "value": "24px",
    "description": "page gutterと大きなcomponent group。",
    "usage": "page padding・large group"
  },
  {
    "id": "8",
    "token": "--sp-8",
    "value": "32px",
    "description": "section内の大きな区切り。",
    "usage": "section gap"
  },
  {
    "id": "10",
    "token": "--sp-10",
    "value": "40px",
    "description": "独立したcontent block間の余白。",
    "usage": "content block separation"
  },
  {
    "id": "12",
    "token": "--sp-12",
    "value": "48px",
    "description": "page section間の余白。",
    "usage": "page section"
  },
  {
    "id": "16",
    "token": "--sp-16",
    "value": "64px",
    "description": "大きなpage region間の余白。",
    "usage": "major region"
  },
  {
    "id": "20",
    "token": "--sp-20",
    "value": "80px",
    "description": "広いviewportのmajor region間隔。",
    "usage": "wide layout region"
  },
  {
    "id": "24",
    "token": "--sp-24",
    "value": "96px",
    "description": "独立したheroまたはlarge empty region。",
    "usage": "large regionのみ"
  }
];
const LAYOUT_TOKENS=[
  {
    "id": "sidebar-w",
    "token": "--sidebar-w",
    "value": "264px",
    "source": "264px",
    "description": "常設navigation railの幅。",
    "usage": "desktop app shell sidebar"
  },
  {
    "id": "sidebar-w-collapsed",
    "token": "--sidebar-w-collapsed",
    "value": "0px",
    "source": "0px",
    "description": "navigationを完全に閉じたときのgrid track。",
    "usage": "collapsed shell track"
  },
  {
    "id": "topbar-h",
    "token": "--topbar-h",
    "value": "52px",
    "source": "52px",
    "description": "global top barの高さ。",
    "usage": "sticky top bar"
  },
  {
    "id": "content-max",
    "token": "--content-max",
    "value": "880px",
    "source": "880px",
    "description": "標準documentationとform contentの最大幅。",
    "usage": "standard content region"
  },
  {
    "id": "content-wide",
    "token": "--content-wide",
    "value": "1280px",
    "source": "1280px",
    "description": "table、dashboard、galleryなどwide contentの最大幅。",
    "usage": "wide data region"
  },
  {
    "id": "reading-max",
    "token": "--reading-max",
    "value": "640px",
    "source": "640px",
    "description": "複数段落のreading measure上限。",
    "usage": "reading text and callout"
  },
  {
    "id": "toc-w",
    "token": "--toc-w",
    "value": "200px",
    "source": "200px",
    "description": "On this page navigationの幅。",
    "usage": "documentation table of contents"
  },
  {
    "id": "page-pad-inline",
    "token": "--page-pad-inline",
    "value": "var(--sp-6)",
    "source": "{spacing.6}",
    "description": "標準pageのinline gutter。",
    "usage": "page inline padding"
  },
  {
    "id": "page-pad-block",
    "token": "--page-pad-block",
    "value": "var(--sp-8)",
    "source": "{spacing.8}",
    "description": "標準pageの開始側block gutter。",
    "usage": "page block padding"
  },
  {
    "id": "section-gap",
    "token": "--section-gap",
    "value": "var(--sp-8)",
    "source": "{spacing.8}",
    "description": "同一page内の主要section間隔。",
    "usage": "major section separation"
  },
  {
    "id": "dialog-w-sm",
    "token": "--dialog-w-sm",
    "value": "400px",
    "source": "400px",
    "description": "確認など短いdialogの上限幅。",
    "usage": "short confirmation dialog"
  },
  {
    "id": "dialog-w-md",
    "token": "--dialog-w-md",
    "value": "480px",
    "source": "480px",
    "description": "標準dialogの上限幅。",
    "usage": "standard dialog"
  },
  {
    "id": "dialog-w-lg",
    "token": "--dialog-w-lg",
    "value": "640px",
    "source": "640px",
    "description": "複数fieldを含むdialogの上限幅。",
    "usage": "large form dialog"
  },
  {
    "id": "drawer-w",
    "token": "--drawer-w",
    "value": "420px",
    "source": "420px",
    "description": "side drawerの標準幅。",
    "usage": "detail and edit drawer"
  },
  {
    "id": "command-w",
    "token": "--command-w",
    "value": "560px",
    "source": "560px",
    "description": "command menuの上限幅。",
    "usage": "command menu and compact tool"
  },
  {
    "id": "focus-w",
    "token": "--focus-w",
    "value": "2px",
    "source": "2px",
    "description": "standard contrastでのfocus indicator幅。contrast modifierがhigh時に上書きする。",
    "usage": "legacy location; accessibility sourceへ移行予定"
  }
];
const LAYOUT_BREAKPOINTS=[
  {
    "id": "column-stack-max",
    "value": "600px",
    "description": "generic multi-column compositionを1 columnへstackする上限。",
    "usage": "content composition, not device detection"
  },
  {
    "id": "navigation-overlay-max",
    "value": "900px",
    "description": "常設sidebarをoverlay navigationへ切り替える上限。",
    "usage": "app shell navigation"
  },
  {
    "id": "toc-hide-max",
    "value": "1080px",
    "description": "補助TOCを隠してmain contentを優先する上限。",
    "usage": "documentation shell"
  }
];
const RADIUS_SCALE=[
  {
    "id": "none",
    "token": "--radius-none",
    "value": "0px",
    "description": "直線edgeまたは隣接面の連結。",
    "usage": "table cell、divider、connected edge"
  },
  {
    "id": "2xs",
    "token": "--radius-2xs",
    "value": "2px",
    "description": "code chipや極小indicator。",
    "usage": "code、focus clipping補助"
  },
  {
    "id": "xs",
    "token": "--radius-xs",
    "value": "4px",
    "description": "小型controlとtable内highlight。",
    "usage": "xs control、table row state"
  },
  {
    "id": "sm",
    "token": "--radius-sm",
    "value": "6px",
    "description": "標準controlのshape。",
    "usage": "button、input、navigation item"
  },
  {
    "id": "md",
    "token": "--radius-md",
    "value": "8px",
    "description": "静的なcontainerとcardの上限。",
    "usage": "card、panel、tile、framed tool"
  },
  {
    "id": "lg",
    "token": "--radius-lg",
    "value": "10px",
    "description": "小さなfloating surface。",
    "usage": "menu、popover、tooltip surface"
  },
  {
    "id": "xl",
    "token": "--radius-xl",
    "value": "12px",
    "description": "Dialogと大きなinput surface。",
    "usage": "dialog、command menu、prompt input"
  },
  {
    "id": "2xl",
    "token": "--radius-2xl",
    "value": "16px",
    "description": "独立したhero mediaまたはlarge showcase。",
    "usage": "hero mediaのみ"
  },
  {
    "id": "full",
    "token": "--radius-full",
    "value": "999px",
    "description": "円形またはcontent長に依存するpill。",
    "usage": "avatar、status dot、badge pill"
  }
];
const SHADOW_LEVELS=[
  {
    "id": "xs",
    "token": "--shadow-xs",
    "value": "0px 1px 2px 0px var(--shadow-color-soft)",
    "description": "Controlまたはごく小さな一時surfaceの触感。",
    "usage": "control tactile cue、small transient surface"
  },
  {
    "id": "sm",
    "token": "--shadow-sm",
    "value": "0px 1px 2px 0px var(--shadow-color-soft),0px 2px 6px -1px var(--shadow-color-default)",
    "description": "Dropdown、Menuなど近いoverlay。",
    "usage": "dropdown、menu、calendar popover"
  },
  {
    "id": "md",
    "token": "--shadow-md",
    "value": "0px 2px 4px 0px var(--shadow-color-soft),0px 6px 16px -4px var(--shadow-color-default)",
    "description": "Popover、Tooltipなど明確に重なるsurface。",
    "usage": "popover、tooltip、floating panel"
  },
  {
    "id": "lg",
    "token": "--shadow-lg",
    "value": "0px 4px 8px 0px var(--shadow-color-soft),0px 12px 32px -8px var(--shadow-color-strong)",
    "description": "Toastや高い一時surface。",
    "usage": "toast、high transient surface"
  },
  {
    "id": "overlay",
    "token": "--shadow-overlay",
    "value": "0px 8px 16px 0px var(--shadow-color-soft),0px 24px 56px -12px var(--shadow-color-overlay)",
    "description": "Dialog、Drawerなどmodal layer。",
    "usage": "dialog、drawer、modal overlay"
  }
];
const SHADOW_THEME_COLORS={
  "light": {
    "soft": "rgba(10,10,15,0.05)",
    "default": "rgba(10,10,15,0.08)",
    "strong": "rgba(10,10,15,0.13)",
    "overlay": "rgba(10,10,15,0.22)"
  },
  "dark": {
    "soft": "rgba(0,0,0,0.24)",
    "default": "rgba(0,0,0,0.32)",
    "strong": "rgba(0,0,0,0.42)",
    "overlay": "rgba(0,0,0,0.58)"
  }
};
const MOTION_DURATIONS=[
  {
    "id": "instant",
    "token": "--dur-instant",
    "value": "50ms",
    "milliseconds": 50,
    "description": "ごく短いcolor/border feedback。Focus indicatorにはtransitionを使わない。",
    "usage": "hover、pressed color feedback"
  },
  {
    "id": "fast",
    "token": "--dur-fast",
    "value": "120ms",
    "milliseconds": 120,
    "description": "Controlのmicro-interaction。",
    "usage": "button、input、toggle state"
  },
  {
    "id": "normal",
    "token": "--dur-normal",
    "value": "180ms",
    "milliseconds": 180,
    "description": "小さなsurfaceのenter/exitとdisclosure。",
    "usage": "menu、popover、toast、collapse"
  },
  {
    "id": "slow",
    "token": "--dur-slow",
    "value": "240ms",
    "milliseconds": 240,
    "description": "大きなoverlayまたは長いdistanceのtransition。",
    "usage": "dialog、drawer、large expansion"
  },
  {
    "id": "slower",
    "token": "--dur-slower",
    "value": "320ms",
    "milliseconds": 320,
    "description": "Page-level continuityが必要な限定transition。",
    "usage": "rare page-level transition only"
  },
  {
    "id": "loop",
    "token": "--dur-loop",
    "value": "960ms",
    "milliseconds": 960,
    "description": "Spinnerなど継続状態を示す反復motionの1cycle。Reduced modeでは静止表示へ解決する。",
    "usage": "loading spinner loop"
  }
];
const MOTION_EASINGS=[
  {
    "id": "standard",
    "token": "--ease-standard",
    "value": "cubic-bezier(0.2,0,0,1)",
    "description": "開始から終了まで見えているstate change。",
    "usage": "state change、expansion"
  },
  {
    "id": "enter",
    "token": "--ease-enter",
    "value": "cubic-bezier(0,0,0.2,1)",
    "description": "素早く現れ、停止へ減速する。",
    "usage": "surface enter"
  },
  {
    "id": "exit",
    "token": "--ease-exit",
    "value": "cubic-bezier(0.4,0,1,1)",
    "description": "画面外へ加速して消える。",
    "usage": "surface exit; enterより短くする"
  },
  {
    "id": "emphasized",
    "token": "--ease-emphasized",
    "value": "cubic-bezier(0.2,0,0,1)",
    "description": "重要な一度限りのsystem feedback。反復操作には使わない。",
    "usage": "rare system feedback; bounce禁止"
  }
];
const MOTION_DISTANCES=[
  {
    "id": "none",
    "token": "--motion-distance-none",
    "value": "0px",
    "description": "Spatial movementを使わない。",
    "usage": "color/opacity-only feedback"
  },
  {
    "id": "sm",
    "token": "--motion-distance-sm",
    "value": "4px",
    "description": "近接surfaceのenter/exit距離。",
    "usage": "menu、popover、dialog"
  },
  {
    "id": "md",
    "token": "--motion-distance-md",
    "value": "8px",
    "description": "Drawerなど方向が意味を持つ大きなsurfaceの上限。",
    "usage": "drawer、page continuity"
  }
];
