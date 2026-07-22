# Issue Row

## Summary

Issue ID、title、priority、status、labels、assigneeを要約し、詳細へ移動できる非表形式のlist item。

Machine-readable contract: `design/contracts/components/issue-row.contract.json`

## Role

Issue Rowは、issue collection内の1件分のsummary、primary destination、任意selection、任意actionsの配置を所有します。Link、Checkbox、Badge、Tag、Avatar、Icon Buttonの内部契約は各child componentへ委譲します。列見出し、sort、cell navigationを持つ表形式の管理は所有しません。PC用とSP用に別componentを作らず、同じDOM、意味、APIをreflowします。

## Principles

- Issue IDとtitleを最初に読み取り、priority、status、labels、assigneeを短く走査できること。
- Root全体をcustom controlにせず、native Link、Checkbox、任意actionsだけをTab順へ入れること。
- Selection、priority、statusを色だけで伝えないこと。
- DesktopとMobileで同じDOM、意味、APIを維持すること。
- Semantic tokenと既存child componentを優先し、Issue Row固有tokenを増やさないこと。

## When To Use

- Issue一覧で各itemのID、title、priority、status、labels、assigneeを高密度に走査するとき。
- 各issueが1つの詳細destinationを持ち、任意で複数選択やitem actionを提供するとき。
- Column alignmentよりissue単位のreading orderとresponsive reflowを優先するとき。

## When Not To Use

- Column header、sort、resize、cell comparison、spreadsheet-like keyboard navigationが必要ならTableまたはData Gridを使う。
- Board lane間のdrag/dropが主目的ならTask Board Cardを使う。
- 1件のissue本文、comment、編集formには専用Issue Detailを使う。
- Destinationを持たない静的metadata groupにはListまたはKey Valueを使う。

## Visual Model

1つのbounded list item内にselection、Issue ID/title Link、metadata、任意actionsをreading order順に配置します。Primary Linkのpointer hit areaはrow surfaceへ拡張できますが、CheckboxとactionsはLink外のsiblingかつ上位layerとして独立させます。

## Anatomy

| Part | Required | Description |
|---|---:|---|
| collection | Yes | Issue Rowを直接の子に持つnamed `ul`。呼び出し側が所有する。 |
| root | Yes | `ul`の直接の子になる`li`。 |
| selection | No | Issue固有labelを持つnative Checkbox。 |
| issue-key | Yes | Monospaceで表示するstable Issue ID。 |
| primary-link | Yes | Issue IDとtitleで命名されるnative Link。 |
| priority | Yes | Text labelを持つBadge。 |
| status | Yes | Dotとtext labelを持つStatus。 |
| labels | No | 最大2件を表示し、残数とfull accessible summaryを持つTag group。 |
| assignee | No | Assignee名を伝えるAvatar summary。 |
| actions | No | Link外に置く1つの独立actionまたはMenu trigger。 |

## Variants

| Variant | Use | Notes |
|---|---|---|
| `default` | 非表形式のIssue list item。 | Priority/status/selectionはdataまたはstateでありvisual variantではない。 |

## Sizes / Density

Dedicated size propは持ちません。`--row-h`、`--cell-y`、`--ctl-sm`を現在のdensity contextから受け取り、viewportだけでdensityを変更しません。

## Icon Rules

- Actionsがある場合だけIcon Buttonを表示し、nameへIssue IDと目的を含める。
- Priority、status、selectionをiconやcolorだけで表さない。
- Avatar画像の有無にかかわらずassignee名をaccessible textとして保持する。

## States

| State | Behavior |
|---|---|
| `default` | Summaryと提供されたfocus targetを常時表示する。 |
| `hover` | Backgroundとborderを補助的に変え、情報やactionsを新たに出現させない。 |
| `focus-visible` | Primary Link focusをrow surface全体のringとして表示する。 |
| `selected` | Native Checkboxのchecked stateを正本とし、background/borderは補助表示にする。 |

Priority、status、assignee不在、label数はcomponent stateではなくissue dataです。

## Behavior

- Rootは`li`で、`onClick`、`role="link"`、`role="row"`、`tabIndex`を持たない。
- Issue IDとtitleを`aria-labelledby`で結合したnative Linkを唯一のprimary destinationとする。
- Pointer向けにLinkのpseudo-elementをrow surfaceへ拡張できるが、Link内へCheckbox、Button、別Linkを入れない。
- `selection`がある場合だけnative Checkboxを表示し、labelを「MRD-142を選択」のようにIssue IDで識別する。
- `selection.selected`とCheckboxのchecked stateを同期し、change時は`onSelectedChange(nextSelected)`を1回呼ぶ。
- `actions`はLink外のsiblingとして拡張Link layerより前面へ置き、activationでnavigationを発生させない。
- Actionsをhover時だけ表示しない。
- Labelsはvisual上2件まで表示し、残数を`+N`で示す。Accessible summaryには全label名を残す。
- Assigneeがない場合は空Avatarや「未割当」を自動挿入せずslotを省略する。必要ならconsumerがstatus/filter contextで未割当を示す。
- TitleはDesktopで1行ellipsisを許可するが、DOM textとaccessible nameは切り詰めない。Mobileではwrapする。

## React API Freeze

```tsx
type IssueRowTone = "neutral" | "info" | "success" | "warning" | "danger";

type IssueRowIssue = {
  id: string;
  title: string;
  priority: { label: string; tone: IssueRowTone };
  status: { label: string; tone: IssueRowTone };
  labels?: readonly string[];
  assignee?: { id: string; name: string; avatarSrc?: string };
};

type IssueRowSelection = {
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
  disabled?: boolean;
};

type IssueRowProps = {
  issue: IssueRowIssue;
  href: string;
  selection?: IssueRowSelection;
  actions?: ReactElement;
  ref?: ForwardedRef<HTMLLIElement>;
};
```

- `issue.id`、`issue.title`、`href`は空文字を許可しません。
- `selection`はcontrolled objectです。Checkboxを表示する場合は`selected`とcallbackを必ず同時に渡します。
- `selection.disabled`はCheckboxだけをdisabledにし、Issue Linkやactionsをdisabledにしません。
- `actions`は1つのfocusable actionまたはMenu compositionとし、accessible nameとopen stateはそのcomponentが所有します。
- `ref`はroot `li`へforwardします。

## Layout / Placement Rules

### Recommended Pattern

- Collectionはnamed `ul`とし、Issue Rowを直接の`li` childにする。
- DOM順はselection → Issue ID/title → priority/status/labels/assignee → actionsとする。
- Issue IDとtitleへ残り幅を与え、metadataとactionsをtitleの前へ押し込まない。
- Selectionとactions以外のrow surfaceをPrimary Linkのpointer areaとして使える。
- Bulk toolbar、select-all、result count、paginationはcollection ownerが管理する。

## Responsive / Viewport Behavior

### Desktop

- 1行を基本にIssue ID/titleへ可変幅を与え、metadataとactionsを右側へ配置する。
- Available widthが不足したらlabelsを2件＋残数へ要約する。
- Densityに応じたrow heightを使い、固定pixel heightでtextをclipしない。

### Mobile

- 同じ`li`、Link、Checkbox、actionsを2段へreflowする。
- 1段目をselection、Issue ID/title、actions、2段目をpriority/status/labels/assigneeとする。
- Titleをwrapし、320 CSS px相当でも横scrollを発生させない。
- Metadataを無言で削除せず、必要なら視覚的な要約とdetail destinationを併用する。

### Touch

- Primary Linkのpointer hit areaをrow surfaceへ拡張し、focus targetは1つに保つ。
- Checkboxとactionsは24px minimumを満たし、Link hit areaと重ねない。
- Bulk selectionやactionsをswipe/long-pressだけに依存させない。

## Accessibility

- Named `ul` / `li`でcollectionとitemの関係を伝える。`listbox`、`option`、`grid`、`row`へ置き換えない。
- Primary LinkはIssue IDとtitleを組み合わせたdescriptive accessible nameを持つ。
- Checkboxはnative `input[type="checkbox"]`とlabelを使い、checked/disabledをplatformへ委譲する。
- Rootをfocusableにせず、Tab順はCheckbox、Primary Link、任意actionsのDOM順とする。
- Link focusはrow surface全体へ可視ringを表示し、Checkbox/Icon Buttonのfocus indicatorを上書きしない。
- Priority/status/labels/assigneeはtextで理解でき、color、dot、avatarだけに依存しない。
- 200% zoom、High contrast、Reduced motion、320 CSS px相当でも情報、focus、reading orderを保持する。
- 全pointer targetは24px minimum、主要touch targetは44px以上推奨とする。

Keyboard:

- `Space`: FocusされたCheckboxのchecked stateを切り替える。
- `Enter`: FocusされたPrimary Linkのdestinationへ移動する。
- `Tab / Shift+Tab`: Checkbox、Primary Link、任意actionsをdocument順に移動する。
- Actionsの追加interactionはそのcomponent Contractに従う。

## Content Guidelines

- Issue IDはproject prefixと連番を保持し、titleだけで識別しにくい反復listを補助する。
- Titleは問題または成果を具体的に書き、「修正」「対応」のような単独語を避ける。
- Priority/statusは「High」「In Progress」のように単独で理解できるlabelにする。
- Labelは分類語だけにし、statusやpriorityを重複させない。
- Actionsのnameは「MRD-142のアクションを開く」のように対象を含める。

## Tokens

- Surface / interaction: `--surface`, `--table-row-hover`, `--primary-subtle`, `--border`, `--border-strong`, `--primary`, `--focus-ring`, `--fg`, `--fg-subtle`
- Density / spacing: `--row-h`, `--cell-y`, `--ctl-sm`, `--sp-1`, `--sp-2`, `--sp-3`
- Shape / type / motion: `--radius-md`, `--font-mono`, `--text-label`, `--text-micro`, `--dur-fast`, `--ease-standard`

Issue Row固有tokenは追加しません。Badge、Status、Tag、Avatar、Checkbox、Icon Button内部のvisual tokenは各child Contractへ委譲します。

### Token Binding Decisions

| Slot | Source | Scope | Trigger | Reason |
|---|---|---|---|---|
| `surface.background` | `--surface` | semantic | - | Default row surface。 |
| `surface.hover` | `--table-row-hover` | component | `intrinsic-component-value` | 反復rowの弱いhover濃度をTableと共有する。 |
| `surface.selected` | `--primary-subtle` | semantic | - | Native checked stateの補助面。 |
| `surface.border` | `--border` | semantic | - | Default boundary。 |
| `surface.hover-border` | `--border-strong` | semantic | - | Hover boundary。 |
| `surface.selected-border` | `--primary` | semantic | - | Selected補助boundary。 |
| `surface.focus` | `--focus-ring` | semantic | - | Primary Link focusをrow surfaceへ投影する。 |
| `surface.height` | `--row-h` | semantic | - | Density contextのminimum row height。 |
| `surface.padding-block` | `--cell-y` | semantic | - | Density contextのvertical padding。 |
| `selection.target` | `--ctl-sm` | semantic | - | Checkbox labelのminimum pointer area。 |
| `content.gap` | `--sp-3` | semantic | - | Primary/meta/action separation。 |
| `compact.gap` | `--sp-1`, `--sp-2` | semantic | - | Key/titleとmobile metadataのspacing。 |
| `surface.radius` | `--radius-md` | semantic | - | Bounded list item shape。 |
| `content.foreground` | `--fg` | semantic | - | Title Link。 |
| `metadata.foreground` | `--fg-subtle` | semantic | - | Issue ID。 |
| `content.type` | `--text-label` | semantic | - | Title scale。 |
| `metadata.type` | `--text-micro`, `--font-mono` | semantic | - | Stable Issue ID。 |
| `interaction.motion` | `--dur-fast`, `--ease-standard` | semantic | - | Hover/focus/selected transition。 |

Current coverage: `complete`。未結線のIssue Row固有visual slotはありません。

## Do / Don't

Do:

```tsx
<IssueRow
  issue={issue}
  href={`/issues/${issue.id}`}
  selection={{ selected, onSelectedChange: setSelected }}
  actions={<IssueActions issue={issue} />}
/>
```

Don't:

```tsx
{/* Interactive descendantを含むrow全体をLinkで包まない。 */}
<a href={`/issues/${issue.id}`}>
  <input type="checkbox" />
  <IssueRow issue={issue} />
</a>
```

## Prohibited Patterns

- Root `div`へ`onClick`、`role="link"`、`role="row"`、`tabIndex=0`を追加する。
- Row全体を包むLink内へCheckbox、Button、別Linkを入れる。
- `listbox` / `option`内へLinkやButtonを混在させる。
- Primary LinkとCheckbox/actionsのpointer hit areaを重ねる。
- Hover時だけselection、actions、full titleを表示する。
- Checkboxを「選択」、actionを「メニュー」だけで命名する。
- Priority/statusをcolorやdotだけ、assigneeを無名avatarだけで表す。
- Mobileでmetadataを削除する、またはhorizontal scrollを必須にする。
- Raw hex、任意spacing/radius、固定heightを追加する。
- `FOCUS_VISIBLE_REQUIRED`、`NO_POSITIVE_TABINDEX`、`TARGET_SIZE_MINIMUM`、`INTERACTIVE_NAME_REQUIRED`に反する実装。

## AI Selection Rules

AIが選ぶ条件:

- 非表形式のissue listで、各itemが1つの詳細destinationと任意selection/actionsを持つ。
- Issue単位のreading orderとresponsive reflowをcolumn comparisonより優先する。

AIが避ける条件:

- Column header/sort/cell navigationはTableまたはData Grid、drag/dropはTask Board Card、詳細編集はIssue Detail。

AIはIssue Rowを「row roleを持つ大きなButton」として生成しません。Named `ul`の`li`、Issue ID/title Link、任意Checkbox/actionsとして生成します。

## Examples

```tsx
<ul aria-label="Issues">
  {issues.map((issue) => (
    <IssueRow
      key={issue.id}
      issue={issue}
      href={`/issues/${issue.id}`}
      selection={{
        selected: selectedIds.has(issue.id),
        onSelectedChange: (selected) => updateSelection(issue.id, selected),
      }}
      actions={<IssueActions issue={issue} />}
    />
  ))}
</ul>
```

## Implementation Notes

- React packageは今後追加します。現在はContract 0.2.0、native HTML Showcase、review evidenceを実装正本とします。
- Pointer向けstretched Linkはpseudo-elementで実装し、selection/actionsを`position: relative; z-index: 1`で独立させます。
- Collection wrapper、select-all、bulk toolbar、paginationはIssue Rowに内包しません。
- Router integrationでもnative `href`を保持し、click callbackだけに置き換えません。

## Open Questions

なし。React実装、router/selection/action integration tests、visual regressionはstable昇格条件であり、実装前Contractの未決事項ではありません。
