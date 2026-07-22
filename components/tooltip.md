# Tooltip

## Summary

Focusまたはhover中のtriggerへ、短い非interactive補足情報を関連付けるpopupです。React実装前Contractは `0.2.0` です。

Machine-readable contract: `design/contracts/components/tooltip.contract.json`

## Role

Tooltipは既に単独で理解できるtriggerを補足します。Accessible name、必須instruction、error、interactive contentの所有者にはしません。

## Principles

- TriggerはTooltipなしでも理解できる。
- Pointerとkeyboardで同じ内容へ到達できる。
- Surfaceはfocusを受けず、短いplain textだけを持つ。

## When To Use

- Icon Buttonの可視Tooltipを提供する。
- 既に理解可能なcontrolへshortcutや短い補足を加える。

## When Not To Use

- 操作名、error、instructionなど必須情報の唯一の提供経路。
- Link、Button、form controlを含むinteractive popup。
- 複数文または構造化された長い説明。
- Touch tapだけで開く補助UI。

## Visual Model

Inverse surfaceをtrigger近傍に配置します。Arrowは必須にせず、placementはtopを既定としviewport collision時に反転またはshiftします。

## Anatomy

| Part | Required | Description |
|---|---:|---|
| trigger | Yes | Accessible nameを独立して持つ単一focusable element。 |
| surface | Yes | `role="tooltip"` の非focusable popup。 |
| content | Yes | 短い非interactive text。 |

## Variants

`default` のみです。Toneやpriority variantは持ちません。

## Sizes / Density

Size propはありません。`--text-micro`、`--sp-1`、`--sp-2`の固定した小型surfaceを使い、densityで意味やAPIを変えません。

## Icon Rules

Tooltip内にiconを置きません。Trigger側のiconはtrigger componentのContractに従います。

## States

| State | Behavior |
|---|---|
| `default` | Surfaceは視覚的にhidden。Triggerは単独で理解可能。 |
| `hover` | 既定400ms後に開き、triggerまたはsurfaceからpointerが離れると閉じる。 |
| `focus` | Focusで開き、Escapeまたはblurで閉じる。Focusはtriggerに保持。 |

## Behavior

- TriggerとTooltipをstable id + `aria-describedby` で関連付けます。
- `aria-expanded` は使いません。
- Hover transitionはtriggerからsurfaceへpointerを移しても閉じません。
- Escape、blur、pointer leaveを同じopen stateへ同期します。
- Touch tapをTooltip表示のために消費しません。

## Layout / Placement Rules

- Triggerとのgapは `--sp-2`。
- Viewport端でflipまたはshiftし、clippingを防ぎます。
- Surfaceは内容幅を基本にし、長文を許可しません。

## Responsive / Viewport Behavior

Desktopではhoverとfocusの両方で表示します。Mobile/touchではprogressive enhancementとして扱い、必須情報はvisible textまたはPopoverへ移します。同じTooltipをsheetへ自動変形しません。

PC用とSP用に分けません。Triggerは24px minimumを満たし、touch中心の主要操作は44px以上をparent componentで確保します。

## Accessibility

- Triggerは空でないaccessible nameを持つ。
- Surfaceは `role="tooltip"` とstable idを持つ。
- Triggerは `aria-describedby` でsurfaceを参照する。
- Surfaceへfocusを移さず、focusable descendantを置かない。
- Escapeで閉じてもtrigger focusを保持する。

Keyboard:

- `Tab / Shift+Tab`: Triggerへ移動しTooltipを表示。
- `Escape`: Tooltipを閉じ、focusを保持。

## Content Guidelines

- 1つの対象またはshortcutを短く書きます。
- Triggerのaccessible nameと矛盾する文言を使いません。
- 文、list、手順、error remediationはPopoverまたはvisible textへ移します。

## Tokens

`--tooltip-bg`, `--surface-inverse`, `--bg`, `--sp-1`, `--sp-2`, `--radius-xs`, `--shadow-md`, `--text-micro`, `--dur-fast`, `--ease-standard`。

全visual slotはContractで `complete` binding済みです。

## Do / Don't

Do: `<Tooltip content="フィルターを開く"><IconButton label="フィルターを開く" icon={<FilterIcon />} /></Tooltip>`

Don't: TooltipだけをIcon Buttonのaccessible nameにする、Tooltip内にButtonを置く。

## Prohibited Patterns

- Interactive Tooltip content。
- Tooltipだけに必須情報を置く。
- Hover-only、long-press-onlyの表示。
- Raw color、spacing、shadow。

## AI Selection Rules

短い非interactive補足だけに選択します。操作可能contentはPopover、常時必要な説明はvisible text、判断を求める内容はDialogを選択します。

## Examples

```tsx
<Tooltip content="変更を保存 ⌘S">
  <Button>保存</Button>
</Tooltip>
```

## Implementation Notes

IDは`useId`相当で安定化し、childの既存event handlerとTooltip handlerを合成します。Positioning engineはplacement希望値よりviewport内表示を優先します。

### React API Freeze

```ts
type TooltipProps = {
  children: ReactElement
  content: string
  placement?: 'top' | 'right' | 'bottom' | 'left' // top
  delayDuration?: number // 400
  open?: boolean
  defaultOpen?: boolean // false
  onOpenChange?: (open: boolean) => void
}
```

## Open Questions

Contract上のopen questionはありません。React実装、interaction test、visual regression完了後にstableへ昇格します。
