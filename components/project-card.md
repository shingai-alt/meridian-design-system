# Project Card

## Summary

1つのprojectのstatus、完了率、member、更新時刻を一覧内で要約し、project詳細へ移動するCard composition。

Machine-readable contract: `design/contracts/components/project-card.contract.json`

## Role

Project Cardはproject summaryの情報構造とprimary destinationを所有します。SurfaceはCard、destinationはLink、statusはBadge、membersはAvatar、completionはProgressへ委譲します。PC用とSP用に別componentを作らず、同じDOM、意味、APIをavailable widthへ適応させます。

## Principles

- Project名、status、完了率、member、freshnessを短く比較できること。
- Root全体をcustom controlにせず、native Linkと独立actionだけをTab順へ入れること。
- Hover、focus、status、progressを色だけで伝えないこと。
- Semantic tokenと既存child componentを優先し、Project Card固有tokenを増やさないこと。

## When To Use

- 複数projectをcard gridで走査し、要約から1つのproject詳細へ移動するとき。
- Project名、status、完了率、member、更新時刻が一覧での選択判断に必要なとき。

## When Not To Use

- 列ごとの精密比較、sort、bulk selectionが主目的ならTableまたはData Gridを使う。
- Destinationを持たない静的な情報groupにはCardを使う。
- 1件のproject詳細、編集form、複数stepの操作は専用pageを使う。

## Visual Model

Card surface内にheading link、status、description、completion、member summary、updated time、任意の独立actionを配置します。Primary Linkのpointer hit areaはsurfaceへ拡張できますが、Link自身のDOMにactionを入れず、actionを上位layerのsiblingとして保ちます。

## Anatomy

| Part | Required | Description |
|---|---:|---|
| root | Yes | `aria-labelledby`でproject headingへ関連付く`article`。 |
| heading | Yes | Project名を含む短いheading。 |
| primary-link | Yes | Project詳細へ移動するnative Link。 |
| status | Yes | Text labelを持つBadge。 |
| description | Yes | Projectの目的を1–2行で示すsummary。 |
| progress | Yes | 可視percentとnamed progressbar。 |
| members | Yes | Member名と残数を伝えるsummary。 |
| updated-time | Yes | 可視相対時刻とmachine-readable `datetime`。 |
| actions | No | Linkの外に置く1つの独立actionまたはMenu trigger。 |

## Variants

| Variant | Use | Notes |
|---|---|---|
| `default` | Project一覧の標準summary。 | Status toneはproject dataでありvisual variantではない。 |

## Sizes / Density

Dedicated size propは持ちません。Card paddingとchild control sizeは現在のdensity contextへ従い、viewportだけでCompactへ切り替えません。

## Icon Rules

- Actionsがある場合だけIcon Buttonを表示し、accessible nameへproject名とaction目的を含める。
- Statusやcompletionをiconだけで表さない。
- Member avatarが画像を持つ場合もmember名をaccessible textとして保持する。

## States

| State | Behavior |
|---|---|
| `default` | Summaryと2つ以下の明示的focus targetを表示する。 |
| `hover` | Pointerがsurface上にあることをborder変化で補助し、情報やactionを新たに出現させない。 |
| `focus-visible` | Primary Link focusをsurface全体のfocus ringで示し、action focusとは区別する。 |

Status、0% / 100%、member数はstateではなくproject dataです。

## Behavior

- Rootは`article`で、`onClick`、`role="link"`、`tabIndex`を持たない。
- Heading内のnative Linkを唯一のprimary destinationとする。Project名がLinkのaccessible nameになる。
- Pointer向けにLinkのpseudo-elementをsurfaceへ拡張できるが、DOM上のLinkはheading textだけを含む。
- `actions`はLinkとsiblingにし、拡張Link layerより前面へ置く。Action activationでnavigationを発生させない。
- Hover時だけactionsを表示しない。Actionsを提供する場合はdefault、keyboard focus、touchで常に発見できる。
- `progress`は0–100へ制約し、可視percentと`aria-valuenow/min/max`を同期する。
- Membersは先頭2名までをAvatarで要約し、残りは「ほかN人」とする。Accessible summaryから名前と残数を失わない。
- `updatedLabel`を可視表示し、`updatedAt`を`time[datetime]`へ設定する。
- Descriptionはvisual line clampを許可するがDOM textとaccessible textを切り詰めない。

## React API Freeze

```tsx
type ProjectCardMember = {
  id: string;
  name: string;
  avatarSrc?: string;
};

type ProjectCardStatus = {
  label: string;
  tone: "neutral" | "info" | "success" | "warning" | "danger";
};

type ProjectCardProject = {
  id: string;
  name: string;
  description: string;
  status: ProjectCardStatus;
  progress: number;
  members: readonly ProjectCardMember[];
  updatedAt: string;
  updatedLabel: string;
};

type ProjectCardProps = {
  project: ProjectCardProject;
  href: string;
  actions?: ReactElement;
  ref?: ForwardedRef<HTMLElement>;
};
```

- `href`は空文字を許可しません。Navigation callbackだけへ置き換えません。
- `updatedAt`はISO 8601文字列、`updatedLabel`はlocale済みの可視文言です。
- `actions`は1つのfocusable actionまたはMenu compositionとし、accessible nameとopen stateはそのcomponentが所有します。
- `ref`はroot `article`へforwardします。

## Layout / Placement Rules

### Recommended Pattern

- DOM順はheading/status → description → completion → members/timeとする。
- Headingとstatus/actionsはwrap可能にし、project名をactionsで押し潰さない。
- Grid内のCardは同じblock sizeへ揃え、footerを末尾へ配置する。
- Card内へ別Card surfaceを入れず、区切りはspacingとmuted textを使う。

## Responsive / Viewport Behavior

### Desktop

- Gridはavailable widthに応じて列数を変え、Project Card自身は固定260px幅を持たない。
- Heading link、status、actionsを上部、members/timeを下部に保つ。

### Mobile

- 1 columnへreflowし、同じarticle/link/action semanticsを維持する。
- Project名とdescriptionは折り返し、updated timeとmember summaryは必要なら複数行にする。
- Horizontal scrollを発生させず、actionsをhover依存にしない。

### Touch

- Primary Linkのpointer hit areaはCard surfaceまで拡張し、Link focus targetは1つに保つ。
- Actionsは24px minimum、主要touch targetは44px以上推奨を満たす。
- Linkとactionのhit areaを重ねず、単一pointerでそれぞれを実行できる。

## Accessibility

- `article[aria-labelledby]`、heading、native `a[href]`でproject summaryとdestinationを構造化する。
- Link名はproject名から得て、同名projectがある場合は周辺contextまたはhidden qualifierで識別する。
- Rootをfocusableにせず、Tab順はprimary Linkと任意actionsだけにする。
- Link focusはCard surface全体へ可視ringを表示し、Icon Button focus ringを上書きしない。
- Progressは可視label/percentと`role="progressbar"`の値を同期する。
- Statusは可視text、membersは名前と残数、timeは可視文言と`datetime`を持つ。
- 200% zoom、High contrast、Reduced motionでも情報、focus、reading orderを保持する。

Keyboard:

- `Enter`: Focusされたprimary Linkのdestinationへ移動する。
- `Tab / Shift+Tab`: Primary Linkと任意actionsをdocument順に移動する。
- Actionsの追加interactionはそのcomponent Contractに従う。

## Content Guidelines

- Project名はdestination page headingと同じか連続性のある文言にする。
- Descriptionは何を作るprojectかを1文で示し、statusや更新時刻を重複させない。
- Statusは「進行中」「要確認」「完了」のように単独で理解できるlabelにする。
- Completionは「完了率 72%」とし、装飾barだけにしない。
- 更新時刻は「更新 2時間前」のように対象を明示する。
- Actionsのnameは「Meridian Docsのアクションを開く」のように対象を含める。

## Tokens

- Surface / interaction: `--surface`, `--border`, `--border-strong`, `--fg`, `--fg-muted`, `--fg-subtle`, `--focus-ring`
- Progress: `--surface-muted`, `--border-muted`, `--primary`
- Layout / density: `--card-pad`, `--sp-1`, `--sp-2`, `--sp-3`, `--sp-4`
- Shape / type / motion: `--radius-md`, `--radius-full`, `--text-body`, `--text-label`, `--text-small`, `--text-micro`, `--dur-fast`, `--dur-slow`, `--ease-standard`

Project Card固有tokenは追加しません。

### Token Binding Decisions

Card surfaceとLink focus、completion track、content regionsを既存semantic tokenへ結線します。Badge、Avatar、Icon Buttonの内部visualは各child Contractへ委譲します。

Current coverage: `complete`。未結線のProject Card固有visual slotはありません。

## Do / Don't

Do:

```tsx
<ProjectCard
  project={project}
  href={`/projects/${project.id}`}
  actions={<ProjectActions project={project} />}
/>
```

Don't:

```tsx
{/* Link内にButtonを入れず、rootへclick/keyboardを再実装しない。 */}
<a href={`/projects/${project.id}`}>
  <ProjectCard project={project} actions={<button>Menu</button>} />
</a>
```

## Prohibited Patterns

- Root `div`へ`onClick`、`role="link"`、`tabIndex=0`を追加する。
- Card全体を包むLink内へButton、別Link、tabindex付き要素を入れる。
- Primary Linkとactionsのpointer hit areaを重ねる。
- Hover時だけactions、status、full titleを表示する。
- Project名を含まない「メニュー」だけをIcon Button nameにする。
- Progressを装飾barだけ、statusを色だけ、membersを無名avatarだけで表す。
- Relative timeだけを表示し`datetime`を省く。
- Fixed width、raw hex、任意spacing/radiusを追加する。
- `FOCUS_VISIBLE_REQUIRED`、`NO_POSITIVE_TABINDEX`、`TARGET_SIZE_MINIMUM`、`INTERACTIVE_NAME_REQUIRED`に反する実装。

## AI Selection Rules

AIが選ぶ条件:

- 複数projectをcard gridで走査し、要約から1つのproject詳細へ移動するとき。
- Project名、status、完了率、member、更新時刻が一覧での選択判断に必要なとき。

AIが避ける条件:

- 精密比較やbulk操作はTable / Data Grid、静的groupはCard、詳細編集は専用page。

AIはProject Cardを「大きなButton」として生成しません。Native heading Linkをprimary destination、actionsを独立siblingとして生成します。

## Examples

```tsx
<ProjectCard
  project={{
    id: "meridian-docs",
    name: "Meridian Docs",
    description: "デザインシステムのドキュメントサイト",
    status: { label: "進行中", tone: "info" },
    progress: 72,
    members,
    updatedAt: "2026-07-22T09:00:00+09:00",
    updatedLabel: "更新 2時間前",
  }}
  href="/projects/meridian-docs"
  actions={<ProjectActions projectId="meridian-docs" />}
/>
```

## Implementation Notes

- React packageは今後追加します。現在はContract 0.2.0、native HTML Showcase、review evidenceを実装正本とします。
- Pointer向けstretched Linkはpseudo-elementで実装し、actionsを`position: relative; z-index: 1`で独立させます。
- Status toneはBadge Contract、completion visualはProgress Contract、action semanticsは渡されたcomponent Contractに従います。

## Open Questions

なし。React実装、router integration、interaction tests、visual regressionはstable昇格条件であり、実装前Contractの未決事項ではありません。
