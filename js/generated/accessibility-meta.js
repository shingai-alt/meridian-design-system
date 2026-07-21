"use strict";
/* AUTO-GENERATED from design/accessibility.json. */
const A11Y_META={
  "standard": {
    "name": "WCAG",
    "version": "2.2",
    "conformanceLevel": "AA",
    "url": "https://www.w3.org/TR/WCAG22/"
  },
  "policy": {
    "scope": "Meridianが提供するdocumentation、tokens、components、patterns、templatesと、それらから生成するWeb UI。",
    "registryScope": "requirementsはdesign systemで横断的に適用頻度が高い基準を実装可能な単位へまとめたregistryであり、WCAG A/AA success criteriaの完全な代替一覧ではない。",
    "conformance": "適用されるWCAG 2.2 Level AとAAをすべて満たす。個別requirementだけを選んでAA適合を表明しない。",
    "exceptions": "WCAG本文に定義された例外だけを適用できる。製品都合の例外はowner、期限、代替手段をreview recordへ記録する。",
    "releaseBlocker": "Keyboard trap、欠落したaccessible name、不可視focus、taskを妨げるreflow、必須contrast未達はrelease blockerとする。"
  },
  "targetSize": {
    "minimumCssPx": 24,
    "preferredCssPx": 44,
    "minimumRule": "全densityで24×24 CSS px以上を基本とする。WCAG 2.5.8のspacing、inline、user-agent、essential例外を使う場合はcontractへ理由を残す。",
    "preferredRule": "Touch中心、主要action、破壊的action、隣接するicon controlは44×44 CSS px程度を優先する。Glyphではなくcontrol boxを広げる。"
  },
  "liveRegions": {
    "polite": "保存完了、読み込み結果、非緊急statusはrole=statusまたはaria-live=politeで通知し、同じmessageを重複通知しない。",
    "assertive": "即時対応が必要なerrorだけrole=alertを使う。入力中の検証で連続割り込みを起こさない。",
    "focus": "Dialog、route change、error summaryなど作業context自体が変わる場合はlive regionだけに頼らず、予測可能なfocus移動と復帰を設計する。"
  },
  "disabledState": {
    "native": "通常の単独controlはnative disabledを使いtab順から外す。近接textまたは常時到達可能なhelpで理由を説明する。",
    "discoverable": "Menu、toolbar、tabsなどpattern上discoverabilityが必要な場合だけaria-disabled=trueでfocus可能にし、activationを実装側で抑止する。",
    "explanation": "Hover専用Tooltipを唯一の説明にしない。Disabled controlはhover/focusを受けない場合があるため、説明は近接text、group help、または有効なtriggerから到達可能にする。"
  }
};
const A11Y_REQUIREMENTS=[
  {
    "id": "text-alternatives",
    "principle": "perceivable",
    "level": "A",
    "criteria": [
      "1.1.1"
    ],
    "appliesTo": "Image、icon、chart、canvas、audio/video fallback",
    "requirement": "意味を持つnon-text contentへ同じ目的を果たすtext alternativeを提供し、装飾は支援技術から除外する。",
    "verification": [
      "Imageのaltを文脈で確認する。",
      "Icon-only controlのnameが所有controlにあることを確認する。",
      "Chartの要点とdata alternativeを確認する。"
    ],
    "exceptions": [
      "純粋な装飾はempty altまたはaria-hiddenを使う。"
    ]
  },
  {
    "id": "structure-and-relationships",
    "principle": "perceivable",
    "level": "A",
    "criteria": [
      "1.3.1"
    ],
    "appliesTo": "Heading、list、table、form、group、landmark",
    "requirement": "視覚的な構造、関係、順序をsemantic HTMLまたは適切なARIAでprogrammatically determinableにする。",
    "verification": [
      "CSSを外してreading orderを確認する。",
      "Heading、label、fieldset/legend、table headerの関係を確認する。"
    ],
    "exceptions": []
  },
  {
    "id": "orientation",
    "principle": "perceivable",
    "level": "AA",
    "criteria": [
      "1.3.4"
    ],
    "appliesTo": "Responsive pageとcomponent",
    "requirement": "Essentialでない限りportraitまたはlandscapeの一方向へ表示や操作を固定しない。",
    "verification": [
      "PC/SPと端末回転でcontentとactionが利用できることを確認する。"
    ],
    "exceptions": [
      "Orientation自体がtaskに不可欠な場合。"
    ]
  },
  {
    "id": "color-not-only",
    "principle": "perceivable",
    "level": "A",
    "criteria": [
      "1.4.1"
    ],
    "appliesTo": "Error、success、selection、status、chart、required state",
    "requirement": "色を情報、action、response、状態の唯一の視覚的手段にしない。",
    "verification": [
      "Grayscaleまたは色覚simulationで意味が残ることを確認する。",
      "Text、shape、icon、pattern、programmatic stateのいずれかを併用する。"
    ],
    "exceptions": []
  },
  {
    "id": "text-contrast",
    "principle": "perceivable",
    "level": "AA",
    "criteria": [
      "1.4.3"
    ],
    "appliesTo": "Textとimages of text",
    "requirement": "通常textは4.5:1以上、大きなtextは3:1以上を実際のforeground/background pairで満たす。",
    "verification": [
      "全seed preset×light/dark/hcでtoken pairを自動検査する。",
      "Image、gradient、overlay上は実際のpixel条件で手動確認する。"
    ],
    "exceptions": [
      "Inactive、logo、incidental textなどWCAG本文の例外。"
    ]
  },
  {
    "id": "resize-and-reflow",
    "principle": "perceivable",
    "level": "AA",
    "criteria": [
      "1.4.4",
      "1.4.10"
    ],
    "appliesTo": "Page、dialog、drawer、table、toolbar、form",
    "requirement": "200% text拡大と320 CSS px相当でcontentと機能を失わず、一方向scrollを基本に再配置する。",
    "verification": [
      "Browser text zoom 200%を確認する。",
      "Viewport 320 CSS pxまたは400% zoomでhorizontal page scroll、clipping、overlapを確認する。"
    ],
    "exceptions": [
      "Data table、map、diagram、toolbarなど意味の保持に二方向layoutが必要な領域は、その領域内scrollを許可する。"
    ]
  },
  {
    "id": "non-text-contrast",
    "principle": "perceivable",
    "level": "AA",
    "criteria": [
      "1.4.11"
    ],
    "appliesTo": "Control boundary、state、focus indicator、essential icon、chart segment",
    "requirement": "識別に必要なvisual informationは隣接色と3:1以上を満たす。",
    "verification": [
      "Default、hover、focus、selected、invalid、disabledをthemeごとに確認する。"
    ],
    "exceptions": [
      "User agentが変更していないnative appearance、inactive component、essentialなpresentation。"
    ]
  },
  {
    "id": "text-spacing",
    "principle": "perceivable",
    "level": "AA",
    "criteria": [
      "1.4.12"
    ],
    "appliesTo": "Textを含む全component",
    "requirement": "利用者がline、paragraph、letter、word spacingを上書きしてもcontentと機能を失わない。",
    "verification": [
      "WCAG text spacing値を注入し、clipping、overlap、hidden actionを確認する。"
    ],
    "exceptions": [
      "Human languageを表さないlogoやcode notation。"
    ]
  },
  {
    "id": "keyboard-operation",
    "principle": "operable",
    "level": "A",
    "criteria": [
      "2.1.1",
      "2.1.2"
    ],
    "appliesTo": "全interactive componentとflow",
    "requirement": "Pointer固有のtimingに依存せずkeyboardで全機能を操作でき、focusを閉じ込めない。",
    "verification": [
      "Tab、Shift+Tab、Enter、Space、Escape、pattern固有Arrow keyで操作する。",
      "Modal以外からTabで退出でき、modalはclose後triggerへfocusを返すことを確認する。"
    ],
    "exceptions": [
      "Freehand drawingなど入力path自体が本質的な機能。"
    ]
  },
  {
    "id": "timing-and-autoplay",
    "principle": "operable",
    "level": "A",
    "criteria": [
      "2.2.1",
      "2.2.2"
    ],
    "appliesTo": "Session、carousel、toast、auto-refresh、moving content",
    "requirement": "Time limitは延長または解除可能にし、5秒を超える自動更新・移動・点滅contentにはpause/stop/hideを提供する。",
    "verification": [
      "Timeout warning、extension、pause、hover/focus中のdismissを確認する。"
    ],
    "exceptions": [
      "Real-time eventまたはtime limit自体がessentialな場合。"
    ]
  },
  {
    "id": "flash-threshold",
    "principle": "operable",
    "level": "A",
    "criteria": [
      "2.3.1"
    ],
    "appliesTo": "Animation、video、status、loading feedback",
    "requirement": "1秒間に3回を超えるflashを発生させない。",
    "verification": [
      "Animationとmediaをframe単位で確認する。"
    ],
    "exceptions": [
      "一般flash/red flash thresholdを下回る場合。"
    ]
  },
  {
    "id": "bypass-blocks",
    "principle": "operable",
    "level": "A",
    "criteria": [
      "2.4.1"
    ],
    "appliesTo": "App shellと繰り返しnavigation",
    "requirement": "Skip linkとlandmarkで繰り返しblockを迂回できるようにする。",
    "verification": [
      "最初のTabでskip linkを表示し、mainへfocusが移ることを確認する。"
    ],
    "exceptions": []
  },
  {
    "id": "focus-order",
    "principle": "operable",
    "level": "A",
    "criteria": [
      "2.4.3"
    ],
    "appliesTo": "Page、overlay、composite widget",
    "requirement": "Focus順をDOMとtaskの論理順に一致させ、positive tabindexで順序を修正しない。",
    "verification": [
      "DOM順とTab順を比較する。",
      "Overlay open/closeとroute changeのfocus移動を確認する。"
    ],
    "exceptions": []
  },
  {
    "id": "focus-visible-and-unobscured",
    "principle": "operable",
    "level": "AA",
    "criteria": [
      "2.4.7",
      "2.4.11"
    ],
    "appliesTo": "全keyboard-focusable element",
    "requirement": "Keyboard focusを常に視認でき、sticky headerやauthor-created overlayで完全に隠さない。",
    "verification": [
      "全themeとsurfaceでfocus ringを確認する。",
      "Scroll container、sticky header、drawer、toast表示中にfocused itemが見えることを確認する。"
    ],
    "exceptions": []
  },
  {
    "id": "drag-alternative",
    "principle": "operable",
    "level": "AA",
    "criteria": [
      "2.5.7"
    ],
    "appliesTo": "Sortable、slider-like canvas、resize、drag and drop",
    "requirement": "Draggingで行うactionへclick、button、menu、inputなどsingle-pointer alternativeを提供する。",
    "verification": [
      "Dragせずpointer clickとkeyboardだけで同じ結果へ到達する。"
    ],
    "exceptions": [
      "Draggingが機能としてessentialな場合。"
    ]
  },
  {
    "id": "label-in-name",
    "principle": "operable",
    "level": "A",
    "criteria": [
      "2.5.3"
    ],
    "appliesTo": "Visible labelを持つcontrol",
    "requirement": "Accessible nameにvisible label textを含め、voice controlで見た名前を使えるようにする。",
    "verification": [
      "Computed accessible nameとvisible labelを比較する。"
    ],
    "exceptions": []
  },
  {
    "id": "target-size-minimum",
    "principle": "operable",
    "level": "AA",
    "criteria": [
      "2.5.8"
    ],
    "appliesTo": "Pointer target",
    "requirement": "全densityで24×24 CSS px以上または24px clearanceを確保し、touch主要actionは44px程度を優先する。",
    "verification": [
      "Bounding boxと隣接target clearanceをdesktop/mobileで測定する。"
    ],
    "exceptions": [
      "Inline、user-agent controlled、essential、equivalent control、spacingのWCAG例外。"
    ]
  },
  {
    "id": "page-language",
    "principle": "understandable",
    "level": "A",
    "criteria": [
      "3.1.1"
    ],
    "appliesTo": "Documentとlanguage change",
    "requirement": "Pageのprimary languageをhtml langで指定し、異なる言語のphraseは必要に応じてlangを付ける。",
    "verification": [
      "Document languageと読み上げ発音を確認する。"
    ],
    "exceptions": [
      "固有名詞、専門用語、周囲言語へ取り込まれた語。"
    ]
  },
  {
    "id": "consistent-navigation-and-help",
    "principle": "understandable",
    "level": "AA",
    "criteria": [
      "3.2.3",
      "3.2.4",
      "3.2.6"
    ],
    "appliesTo": "Navigation、icon、help、repeated flow",
    "requirement": "繰り返すnavigation、識別、help mechanismのrelative orderと名称を一貫させる。",
    "verification": [
      "同一product内のpageとstateを比較する。"
    ],
    "exceptions": [
      "利用者が変更を開始した場合。"
    ]
  },
  {
    "id": "labels-and-instructions",
    "principle": "understandable",
    "level": "A",
    "criteria": [
      "3.3.2"
    ],
    "appliesTo": "Form controlとinput group",
    "requirement": "入力にprogrammatic labelを付け、format、required、constraintを入力前に理解できるようにする。Placeholderだけをlabelにしない。",
    "verification": [
      "Label association、required、helper、autocompleteを確認する。"
    ],
    "exceptions": []
  },
  {
    "id": "error-identification-and-suggestion",
    "principle": "understandable",
    "level": "AA",
    "criteria": [
      "3.3.1",
      "3.3.3"
    ],
    "appliesTo": "Form、command、upload、transaction",
    "requirement": "Error箇所、原因、既知の修正方法をtextで示し、入力を保持してerror messageへprogrammaticに関連付ける。",
    "verification": [
      "aria-invalidとaria-describedby/errormessageを確認する。",
      "Summary linkまたは最初のerrorへの予測可能なfocus導線を確認する。",
      "Retryと入力保持を確認する。"
    ],
    "exceptions": [
      "Suggestionがsecurityまたは目的を損なう場合。"
    ]
  },
  {
    "id": "redundant-entry",
    "principle": "understandable",
    "level": "A",
    "criteria": [
      "3.3.7"
    ],
    "appliesTo": "Multi-step formと同一session flow",
    "requirement": "同じprocessで既に入力した情報を再入力させず、自動入力または選択できるようにする。",
    "verification": [
      "Back/forward、step transition、address copyなどで値保持を確認する。"
    ],
    "exceptions": [
      "Security、expired information、再入力がessentialな場合。"
    ]
  },
  {
    "id": "accessible-authentication",
    "principle": "understandable",
    "level": "AA",
    "criteria": [
      "3.3.8"
    ],
    "appliesTo": "Login、MFA、re-authentication",
    "requirement": "Cognitive function testを唯一の認証手段にせず、paste、password manager、autocomplete、passkey等を妨げない。",
    "verification": [
      "Password paste、autocomplete属性、password manager、代替認証を確認する。"
    ],
    "exceptions": [
      "Object recognition、personal content、補助mechanism、alternative mechanismのWCAG例外。"
    ]
  },
  {
    "id": "name-role-value",
    "principle": "robust",
    "level": "A",
    "criteria": [
      "4.1.2"
    ],
    "appliesTo": "全UI component",
    "requirement": "Name、role、state、valueをprogrammatically determinableにし、変更を支援技術へ通知する。Native elementを優先する。",
    "verification": [
      "Accessibility treeとcomputed nameを確認する。",
      "ARIA stateがvisual/behavioral stateと同期することを確認する。"
    ],
    "exceptions": []
  },
  {
    "id": "status-messages",
    "principle": "robust",
    "level": "AA",
    "criteria": [
      "4.1.3"
    ],
    "appliesTo": "Toast、loading、search result、save、validation summary",
    "requirement": "Focusを移動せず提示するstatus messageはrole/status/live regionで支援技術が判別できるようにする。",
    "verification": [
      "Message挿入をscreen readerで確認し、重複と過剰なassertive通知がないことを確認する。"
    ],
    "exceptions": [
      "Context changeとしてfocusを移動するmessage。"
    ]
  },
  {
    "id": "reduced-motion-preference",
    "principle": "operable",
    "level": "recommended",
    "criteria": [
      "2.3.3"
    ],
    "appliesTo": "CSS、Web Animations API、canvas、video、chart transition",
    "requirement": "prefers-reduced-motionで非本質的なspatial motionを0ms/0pxまたは静的代替へ置換し、final stateとfeedbackを保持する。",
    "verification": [
      "OS preferenceをreduceにしてCSSとscripted motionを確認する。"
    ],
    "exceptions": [
      "Functionalityまたは伝達内容にessentialなmotion。"
    ]
  }
];
const A11Y_QUALITY_GATES=[
  {
    "id": "contract-gate",
    "stage": "contract",
    "owner": "Component author",
    "checks": [
      "Semantic element/role",
      "Accessible name and description",
      "Keyboard map",
      "Focus entry/exit/return",
      "State announcement",
      "Responsive and reduced-motion behavior"
    ]
  },
  {
    "id": "implementation-gate",
    "stage": "implementation",
    "owner": "Engineer",
    "checks": [
      "Native semantics first",
      "ARIA state synchronization",
      "No positive tabindex",
      "Target size",
      "Input preservation and recovery"
    ]
  },
  {
    "id": "automated-gate",
    "stage": "automated",
    "owner": "CI",
    "checks": [
      "Schema and contract validation",
      "Static design rules",
      "Accessible-name and landmark checks where testable",
      "Token contrast matrix",
      "No stale generated artifact"
    ]
  },
  {
    "id": "keyboard-gate",
    "stage": "manual",
    "owner": "Reviewer",
    "checks": [
      "Tab/Shift+Tab order",
      "Enter/Space/Escape and pattern keys",
      "No trap",
      "Visible and unobscured focus",
      "Focus return after overlay"
    ]
  },
  {
    "id": "visual-gate",
    "stage": "manual",
    "owner": "Reviewer",
    "checks": [
      "320px and wide desktop",
      "200% text and 400% zoom",
      "Light/Dark × Standard/High",
      "Text spacing override",
      "Reduced motion",
      "Pointer target measurement"
    ]
  },
  {
    "id": "assistive-tech-gate",
    "stage": "release",
    "owner": "Release reviewer",
    "checks": [
      "VoiceOver/Safari smoke test",
      "NVDA/Firefox or Chrome smoke test",
      "Name/role/state/value",
      "Live region timing",
      "Reading and landmark order"
    ]
  }
];
