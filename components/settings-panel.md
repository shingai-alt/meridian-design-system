# Settings Panel

## Summary

設定グループの標準パネル。見出し・説明・行単位の設定・保存操作。

Machine-readable contract: `design/contracts/components/settings-panel.contract.json`

## Role

SaaS領域でSettings Panelの責務を1か所にまとめ、類似componentとの選択境界を固定します。PC用とSP用に別componentを作らず、同じ意味とAPIをlayout、viewport、input methodへ適応させます。

## Principles

- Taskの主目的と現在状態を最短で理解できること。
- Native semanticsまたは確立したARIA patternを優先すること。
- Semantic tokenを基本とし、Component tokenはpolicy triggerがある場合だけ追加すること。

## When To Use

- 同じ目的の設定を説明付きの行としてまとめるとき。

## When Not To Use

- 独立した短い設定1件だけならForm Fieldを直接使う。

## Visual Model

Bounded information or task container. Surface、border、type、spacingの強弱は内容の階層を支え、装飾のためだけにcard、shadow、accentを追加しません。状態は色だけでなくlabel、icon、shape、positionを組み合わせます。

## Anatomy

| Part | Required | Description |
|---|---:|---|
| root | Yes | Bounded information or task container. |
| header | No | Title, summary, and context controls. |
| content | Yes | Primary values or composed components. |
| footer | No | Secondary metadata or actions. |

## Variants

| Variant | Use | Notes |
|---|---|---|
| `default` | 標準文脈。 | 意味を変えずに見た目だけを増やさない。 |

## Sizes / Density

| Size | Token | Typical use |
|---|---|---|
| Dedicated size propなし | Density token | 周辺layoutのdensityに従う。 |

Compact / Default / Comfortableはviewportではなく作業密度と入力方式で選び、componentの意味やprop集合は変えません。

## Icon Rules

このcomponentは必須のicon slotを持ちません。追加する場合も情報をiconだけへ閉じ込めません。

## States

| State | Behavior |
|---|---|
| `default` | 通常状態。意味、label、valueを省略しない。 |

## Behavior

- 即時反映の設定は Switch、まとめて保存は Checkbox+Save bar を使う。
- 危険な設定(削除など)は Danger zone として分離する。

- Controlled stateを提供する場合、visual stateとprogrammatic stateを同じeventで同期します。
- 非同期actionでは二重実行を防ぎ、完了・失敗・中断を説明します。

## Layout / Placement Rules

### Recommended Pattern

- Reading orderとfocus orderを一致させます。
- 周辺componentとのspacingはtokenを使い、固定viewport値で内部寸法を変えません。
- 1列へreflowし、heading、content、actionの順序を保つ。

## Responsive / Viewport Behavior

### Desktop

- Gridまたはsectionのreading orderに沿って配置し、同種itemの寸法を揃える。
- 面の入れ子を増やさない。

### Mobile

- 1列へreflowし、heading、content、actionの順序を保つ。
- Actionが複数ある場合は縦積みまたはmenuへ整理する。

### Touch

- 表示専用rootをtab順へ追加しない。
- 内包する操作がある場合だけ、その操作targetを24px minimum、主要touch操作を原則44px以上にする。

## Accessibility

- 表示専用rootを不要にtab順へ追加しない。
- 状態は色だけで表さずtext、icon、shapeを併用する。
- Native semanticsを優先し、ARIAは不足する関係と状態だけを補う。
- Nested controlがある場合だけ、そのcontrolがfocusを受け取る。

Keyboard:

- Component root固有のkeyboard interactionは持たない。Nested controlは各componentのcontractに従う。

## Content Guidelines

- Labelは対象または結果を具体的に書き、状態だけを繰り返さない。
- Errorは原因と修正方法、Emptyは何がないかと次の一歩を示す。
- 省略するmetadataにも別経路から到達できるようにする。

## Tokens

- semanticColor: `--border`, `--border-muted`, `--fg`, `--fg-muted`, `--surface`
- density: `--card-pad`
- spacing: `--sp-4`
- radius: `--radius-md`
- typography: `--text-label`, `--text-small`

Primitive color、raw hex、任意pxをcomponentから直接選びません。

### Token Binding Decisions

| Slot | Source | Scope | Trigger | Reason |
|---|---|---|---|---|
| `token.surface.value` | `--surface` | `semantic` | - | Settings Panelの公開visual contractで用途tokenとして共有する。 |
| `token.border.value` | `--border` | `semantic` | - | Settings Panelの公開visual contractで用途tokenとして共有する。 |
| `token.fg.value` | `--fg` | `semantic` | - | Settings Panelの公開visual contractで用途tokenとして共有する。 |
| `token.fg-muted.value` | `--fg-muted` | `semantic` | - | Settings Panelの公開visual contractで用途tokenとして共有する。 |
| `token.card-pad.value` | `--card-pad` | `semantic` | - | Settings Panelの公開visual contractで用途tokenとして共有する。 |
| `token.sp-4.value` | `--sp-4` | `semantic` | - | Settings Panelの公開visual contractで用途tokenとして共有する。 |
| `token.radius-md.value` | `--radius-md` | `semantic` | - | Settings Panelの公開visual contractで用途tokenとして共有する。 |
| `token.border-muted.value` | `--border-muted` | `semantic` | - | Settings PanelのHTML showcaseで実際に参照する公開token。 |
| `token.text-label.value` | `--text-label` | `semantic` | - | Settings PanelのHTML showcaseで実際に参照する公開token。 |
| `token.text-small.value` | `--text-small` | `semantic` | - | Settings PanelのHTML showcaseで実際に参照する公開token。 |

Current coverage: `partial`。HTML showcaseを確認済みの仕様候補として記録し、React package実装時にDOM/state selectorまで結線して`complete`へ移行します。

## Do / Don't

Do:

```tsx
<SettingsPanel title="通知設定" description="…">
  <SettingsPanel.Row label="デプロイの完了">
    <Switch defaultChecked />
  </SettingsPanel.Row>
</SettingsPanel>
```

Don't:

```tsx
{/* 独立した短い設定1件だけならForm Fieldを直接使う。 */}
<SettingsPanel />
```

## Prohibited Patterns

- `NO_RAW_HEX_COLOR`に反する実装。
- `SPACING_FROM_TOKENS_ONLY`に反する実装。
- `RADIUS_FROM_TOKENS_ONLY`に反する実装。
- `CONTRAST_AA_MINIMUM`に反する実装。

## AI Selection Rules

AIが選ぶ条件:

- 同じ目的の設定を説明付きの行としてまとめるとき。

AIが避ける条件:

- 独立した短い設定1件だけならForm Fieldを直接使う。

AIはvariantを意味、sizeをtask密度、stateを実際のsystem stateから選びます。Viewport名だけでvariantやcomponentを分岐しません。

## Examples

```tsx
<SettingsPanel title="通知設定" description="…">
  <SettingsPanel.Row label="デプロイの完了">
    <Switch defaultChecked />
  </SettingsPanel.Row>
</SettingsPanel>
```

## Implementation Notes

- React packageは今後追加します。現在はsemantic contract、HTML showcase、token binding候補を正本として扱います。
- Native element、ref forwarding、controlled state、event名はpackage実装時にこのcontractへ同期します。

## Open Questions

- React package実装時にDOM/ref/event APIと全visual slot bindingを確定し、coverage completeでstableへ移行する。
