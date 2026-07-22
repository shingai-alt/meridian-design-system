# Task Board Card

## Summary

Kanban列内でtaskを要約し、詳細遷移と代替操作つきreorderingを配置するlist item。

Machine-readable contract: `design/contracts/components/task-board-card.contract.json`

## Role

Task Board Cardは、1件のtask summary、primary destination、任意reordering、任意actionsの配置を所有します。Board columnはnamed list、列名、並び順、drop indicator、移動結果のstatus通知を所有します。Link、Tag、Avatar、Icon Button、DnD adapterの内部契約は各childへ委譲します。PC用とSP用に別componentを作らず、同じDOM、意味、APIをreflowします。

## Principles

- Task IDとtitleを最初に読み取り、labelsとassigneeを短く走査できること。
- Root全体をcustom controlにせず、native Linkと提供されたcontrolsだけをTab順へ入れること。
- Dragを提供する場合、同じ移動結果をclick/tapできるmove actionsも必ず提供すること。
- CardとBoardのstate ownershipを分離すること。
- Semantic tokenと既存child componentを優先し、Task Board Card固有tokenを増やさないこと。

## When To Use

- Named Kanban列内でtask summaryと1つの詳細destinationを提示するとき。
- 同じitemに任意reorderingとitem actionを配置するとき。
- Drag interactionと同等のsingle-pointer move actionを同時に提供できるとき。

## When Not To Use

- Column comparison、sort、bulk selectionが主目的ならTableまたはData Gridを使う。
- Drag/dropのない高密度issue listならIssue Rowを使う。
- Projectのstatus、progress、membersを要約するならProject Cardを使う。
- Lane、drop zone、column move、announcementを含む全体interactionにはTask Board patternを使う。

## Visual Model

1つのbounded list item内にlabels、Task ID/title Link、assignee、任意reordering/actionsをreading order順に配置します。Primary Linkのpointer hit areaはCard surfaceへ拡張できますが、drag handle、move actions、item actionsはLink外のsiblingかつ上位layerとして独立させます。通常Cardにはelevationを付けず、dragging中だけ`--shadow-md`で一時的なliftを示します。

## Anatomy

| Part | Required | Description |
|---|---:|---|
| collection | Yes | Task Board Cardを直接の子に持つnamed `ul`。Board columnが所有する。 |
| root | Yes | `ul`の直接の子になる非focusable `li`。 |
| labels | No | 最大2件、残数、full accessible summaryを持つTag group。 |
| primary-link | Yes | Task IDとtitleで命名されるnative Link。 |
| task-key | Yes | Monospaceで表示するstable Task ID。 |
| assignee | No | Assignee名を伝えるAvatar summary。 |
| reordering | No | Drag handleとsingle-pointer move actionsを必ず組で持つslot group。 |
| actions | No | Primary Link外に置く1つの独立actionまたはMenu trigger。 |

## Variants

| Variant | Use | Notes |
|---|---|---|
| `default` | Kanban列内のlinked task item。 | Priority、labels、assigneeはdataでありvisual variantではない。 |

## Sizes / Density

Dedicated size propは持ちません。`--card-pad`とchild Icon Buttonの`--ctl-sm`を現在のdensity contextから受け取ります。Viewportだけでdensityを変更しません。

## Icon Rules

- Reorderingを提供する場合だけdrag handleとmove actionsのIcon Buttonを表示する。
- 各accessible nameへTask IDと動作を含める。
- Drag icon、direction icon、Avatarだけに意味を閉じ込めない。

## States

| State | Behavior |
|---|---|
| `default` | Summaryと提供されたfocus targetを常時表示する。 |
| `hover` | Borderを補助的に変え、情報やcontrolsを新たに出現させない。 |
| `focus-visible` | Primary Link focusをCard surface全体のringとして表示する。 |
| `dragging` | Borderとshadowでdrag sourceを示す。Drop destinationはBoard columnが示す。 |

Labels数、assignee不在、reordering/actions有無はcomponent stateではなくtask dataまたはcapabilityです。

## Behavior

- Rootは`li`で、`onClick`、`role="link"`、`role="option"`、`tabIndex`、native `draggable`を持たない。
- Task IDとtitleで命名したnative Linkを唯一のprimary destinationとする。
- Pointer向けにLinkのpseudo-elementをCard surfaceへ拡張できるが、Link内へButton、別Link、inputを入れない。
- Labelsはvisual上2件まで表示し、残数を`+N`で示す。Accessible summaryには全label名を残す。
- Assigneeがない場合は空Avatarや「未割当」を自動挿入せずslotを省略する。
- `reordering`は`dragHandle`と`moveActions`を同じobjectで受け取り、どちらか片方だけを公開APIで許可しない。
- Drag handleはDnD adapterがkeyboard/pointer lifecycleを所有し、Task IDを含むnameと操作説明を提供する。
- Move actionsはclick/tapだけで同じtask移動を完了できるButtonまたはMenu compositionにする。Keyboard操作だけをdrag代替とみなさない。
- Move後は実行したcontrol、または移動後の同じtaskの予測可能なcontrolへfocusを維持する。
- Board ownerは列名と並び順を解決し、移動後に「MRD-98を進行中へ移動しました」のような結果を`role="status"`で通知する。
- Drop indicatorとdestination highlightはCardではなくBoard columnが所有する。
- `dragging`はBoard DnD adapterから渡される一時stateで、Card自身が並び順を管理しない。

## React API Freeze

```tsx
type TaskBoardCardTask = {
  id: string;
  title: string;
  labels?: readonly string[];
  assignee?: { id: string; name: string; avatarSrc?: string };
};

type TaskBoardCardReordering = {
  dragHandle: ReactElement;
  moveActions: ReactElement;
};

type TaskBoardCardProps = {
  task: TaskBoardCardTask;
  href: string;
  reordering?: TaskBoardCardReordering;
  actions?: ReactElement;
  ref?: ForwardedRef<HTMLLIElement>;
};
```

- `task.id`、`task.title`、`href`は空文字を許可しません。
- `reordering`はpaired capabilityです。Drag handleだけ、move actionsだけのpropはありません。
- `dragHandle`は1つのfocusable DnD handle、`moveActions`は1つのButton groupまたはMenu compositionとします。
- `actions`は1つのfocusable actionまたはMenu compositionとし、name/open stateはそのcomponentが所有します。
- `ref`はroot `li`へforwardします。
- `onOpen`、`draggable`、`selected`、`columnId`、`onMove`はCard APIへ追加しません。Navigationは`href`、movementはreordering children、Board stateはownerへ帰属させます。

## Layout / Placement Rules

### Recommended Pattern

- Board columnを名前付き`section`とし、そのtask collectionをnamed `ul`にする。
- DOM順はlabels → Task ID/title Link → assignee → reordering → actionsとする。
- Titleへ残り幅を与え、footer controlsでtitleを固定heightへclipしない。
- Reordering/actions以外のCard surfaceをPrimary Linkのpointer areaとして使える。
- Column heading、item count、empty state、drop indicator、status live regionはBoard ownerが管理する。

## Responsive / Viewport Behavior

### Desktop

- Labelsとtitleを上段、Task ID、assignee、reordering/actionsをfooterへ配置する。
- Labelsは2件＋残数へ要約する。
- Reordering controlsはhoverに依存せず常時表示する。

### Mobile

- 同じ`li`、Link、reordering、actionsを使い、footer controlsを次行へwrapする。
- Titleをwrapし、320 CSS px相当でも横scrollを発生させない。
- Labels、Task ID、assignee、move actionsを無言で削除しない。

### Touch

- Dragとtap可能なmove actionsを同時に提供する。
- Primary Link、drag handle、move actions、actionsは24px minimumを満たし、hit areaを重ねない。
- 主要touch targetは44px以上を推奨する。
- Long press、drag、swipeだけで移動やactionを実行させない。

## Accessibility

- Named `ul` / `li`でcolumn collectionとitemの関係を伝える。`listbox` / `option`へ置き換えない。
- Primary LinkはTask IDとtitleを含むdescriptive accessible nameを持つ。
- Rootをfocusableにせず、Tab順はPrimary Link、drag handle、move actions、任意actionsのDOM順とする。
- Link focusはCard surface全体へ可視ringを表示し、独立controlsのfocus indicatorを上書きしない。
- Drag instructionsはdrag handleから`aria-describedby`で参照できるようにする。
- `aria-grabbed`は使用しない。DnD adapterが必要な現在stateとinstructionを管理する。
- Move完了messageはBoard ownerの`role="status"`へ出し、focusを不必要に移動しない。
- Labelsとassigneeはtextで理解でき、color、shape、Avatarだけに依存しない。
- 200% zoom、High contrast、Reduced motion、320 CSS px相当でも情報、focus、reading orderを保持する。

Keyboard:

- `Enter`: FocusされたPrimary Linkのdestinationへ移動する。
- `Space / Enter`: Focusされたdrag handleまたはmove actionを各DnD adapter / Button Contractに従って実行する。
- `Tab / Shift+Tab`: Primary Link、reordering controls、任意actionsをdocument順に移動する。
- `Escape`: Keyboard dragを開始している場合にcancelし、drag handleへfocusを戻す。

## Content Guidelines

- Task IDはproject prefixと連番を保持する。
- Titleは作業結果または問題を具体的に書き、「修正」「対応」のような単独語を避ける。
- Labelは分類語だけにし、列名やpriorityを重複させない。
- Control nameは「MRD-98を次の列へ移動」のように対象と結果を含める。
- Status messageはtaskとdestinationを含め、視覚位置だけで結果を説明しない。

## Tokens

- Surface / interaction: `--surface`, `--border`, `--border-strong`, `--primary`, `--focus-ring`, `--fg`, `--fg-subtle`, `--shadow-md`
- Density / spacing: `--card-pad`, `--ctl-sm`, `--sp-1`, `--sp-2`
- Shape / type / motion: `--radius-md`, `--font-mono`, `--text-label`, `--text-micro`, `--dur-fast`, `--ease-standard`

Task Board Card固有tokenは追加しません。Tag、Avatar、Icon Button内部のvisual tokenは各child Contractへ委譲します。

### Token Binding Decisions

| Slot | Source | Scope | Reason |
|---|---|---|---|
| default / hover / drag border | `--border`, `--border-strong`, `--primary` | semantic | Card boundaryとdrag source。 |
| focus | `--focus-ring` | semantic | Primary Link focusをsurfaceへ投影。 |
| dragging elevation | `--shadow-md` | semantic | 一時的なliftとsource識別。 |
| padding / control | `--card-pad`, `--ctl-sm` | semantic | Densityとminimum target。 |
| gaps | `--sp-1`, `--sp-2` | semantic | Tags、sections、controls。 |
| content / metadata | `--fg`, `--fg-subtle`, `--text-label`, `--text-micro`, `--font-mono` | semantic | TitleとTask ID。 |
| motion | `--dur-fast`, `--ease-standard` | semantic | Hover/focus/drag transition。 |

Current coverage: `complete`。未結線のTask Board Card固有visual slotはありません。

## Do / Don't

Do:

```tsx
<TaskBoardCard
  task={task}
  href={`/tasks/${task.id}`}
  reordering={{
    dragHandle: <TaskDragHandle task={task} />,
    moveActions: <TaskMoveActions task={task} />,
  }}
  actions={<TaskActions task={task} />}
/>
```

Don't:

```tsx
{/* Dragだけを提供し、Card root自体をcustom controlにしない。 */}
<TaskBoardCard task={task} draggable onOpen={open} />
```

## Prohibited Patterns

- Root `li`へ`onClick`、`role="link"`、`role="option"`、`tabIndex`、native `draggable`を追加する。
- Card全体を包むLink内へdrag handle、move Button、actionsを入れる。
- `listbox` / `option`内へLinkやButtonを混在させる。
- Drag handleだけを提供し、click/tap可能なmove actionsを省略する。
- Keyboard操作だけをdragのsingle-pointer alternativeとみなす。
- Card内部でcolumn list、drop indicator、live region、movement stateを重複所有する。
- Drag handle、move actions、actionsをhover/long press時だけ表示する。
- Linkとcontrolsのpointer hit areaを重ねる。
- Mobileでcontrolsを削除する、またはhorizontal scrollを必須にする。
- Raw hex、任意spacing/radius、通常Cardへのshadowを追加する。

## AI Selection Rules

AIが選ぶ条件:

- Kanban列内のlinked task summaryにreorderingと任意actionsを配置する。
- Dragとsingle-pointer move actionsを同時に実装できる。

AIが避ける条件:

- 表形式比較、非drag list、静的project summary、Board全体のinteractionを実装する。
- Root draggable Card、drag-only movement、hover-only controlsを生成する。

AIは`reordering`をpaired capabilityとして扱い、viewport名だけでvariantやAPIを分岐しません。

## Examples

```tsx
<TaskBoardCard
  task={task}
  href={`/tasks/${task.id}`}
  reordering={{
    dragHandle: <TaskDragHandle task={task} />,
    moveActions: <TaskMoveActions task={task} />,
  }}
/>
```

## Implementation Notes

- Contract `0.2.0`はReact実装前の公開API、DOM、state ownership、token bindingを確定しています。
- `implementationReadiness.status = ready`はproduction stableを意味しません。
- React package、router/DnD adapter/Board integration tests、CI visual regression baselineはstable移行時に追加します。

## Open Questions

なし。React実装前の判断は確定しています。
