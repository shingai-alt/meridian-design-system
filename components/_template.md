# Component Name

## Summary

1文で、このコンポーネントの責務を書きます。

Machine-readable contract: `design/contracts/components/<component>.contract.json`

## Role

UI 全体の中でこの部品が担う役割を書きます。

このセクションでは「何を表示するか」よりも「ユーザーの判断や操作にどう貢献するか」を説明します。

## Principles

- Meridian のどの原則に強く関係するかを書く。
- このコンポーネント固有の原則を書く。
- 見た目ではなく、判断基準として使える文にする。

## When To Use

- 使うべき状況を書く。
- 代表的な画面、タスク、ユーザー文脈を書く。
- AI が選びやすい具体度にする。

## When Not To Use

- 似たコンポーネントとの境界を書く。
- 代替コンポーネント名を書く。
- AI が誤用しやすいケースを書く。

## Visual Model

見た目の思想を書きます。

- 面、線、密度、余白、角丸、影、アイコン、状態表現の扱い。
- 何を強く見せ、何を控えめにするか。
- HTML 実装を見直す観点。

## Anatomy

| Part | Required | Description |
|---|---:|---|
| Root | Yes | ルート要素の役割。 |
| Label | No | ラベルや主要テキストの役割。 |
| Icon | No | アイコンがある場合の役割。 |

## Variants

| Variant | Use | Notes |
|---|---|---|
| `variant-name` | いつ使うか。 | 誤用や注意点。 |

Variant は見た目の名前ではなく、用途と意味で説明します。

## Sizes / Density

| Size | Token | Typical use |
|---|---|---|
| `sm` | `--ctl-sm` or related token | 使う文脈。 |
| `md` | `--ctl-md` or related token | 標準文脈。 |

Compact / Default / Comfortable density でどう変わるかを書きます。

## Icon Rules

アイコンを持つコンポーネントだけ記入します。該当しない場合は「このコンポーネントは icon slot を持たない」と書きます。

- leading / trailing / icon-only の扱い。
- 装飾アイコンと意味のあるアイコンの違い。
- accessible name の要件。

## States

| State | Behavior |
|---|---|
| `default` | 通常状態。 |
| `hover` | hover での変化。 |
| `focus` | focus-visible の扱い。 |
| `disabled` | 無効状態。 |
| `loading` | 実行中。 |
| `error` | エラー状態。 |

該当しない state は削除せず、「該当しない理由」を書くか、別セクションで扱います。

## Behavior

- クリック、入力、選択、開閉、送信、非同期処理などの振る舞い。
- controlled / uncontrolled の方針。
- 状態遷移やイベントの扱い。

## Layout / Placement Rules

画面内の置き方を書きます。

### Pattern Name

- 推奨配置。
- 避ける配置。
- 必要なら短い TSX 例。

## Responsive / Viewport Behavior

コンポーネントを PC 用 / SP 用に分けるかではなく、同じ contract のまま viewport、入力方式、密度に応じて何を変えるかを書きます。

### Desktop

- PC での標準サイズ、配置、振る舞い。
- hover / keyboard 前提で使える表現。

### Mobile

- SP でのサイズ、full width、縦積み、表示簡略化。
- 横並びを避ける条件。
- bottom fixed action などの扱い。

### Touch

- hit area、hover 非依存、連打防止。
- icon-only や gesture の注意点。

## Accessibility

- role / native element。
- aria 属性。
- focus management。
- keyboard interaction。
- screen reader に伝えるべき情報。
- 色だけに依存しない状態表現。

## Content Guidelines

- ラベル、説明文、エラー文、空状態文言など。
- Good / Avoid の短い例。
- 文体や語彙のルール。

## Tokens

このコンポーネントが参照できる token を列挙します。

- Color:
- Density:
- Spacing:
- Radius:
- Motion:
- Shadow:

使ってはいけない token も明記します。

### Token Binding Decisions

全ての anatomy / variant / state / size の visual slotについて、Semanticを直接使うか、Component tokenへ昇格するかを記録します。機械可読な全bindingはcontractの`tokenBindings`に入れます。

| Slot | Source | Scope | Trigger | Reason |
|---|---|---|---|---|
| `variant.default.container.background.default` | `--surface` | `semantic` | — | 同じsurface roleを持つ全componentと一緒に変わるため。 |

- `scope: component`には`design/token-policy.json`で許可された`trigger`が必要です。
- CSSの都合だけでComponent tokenを作りません。
- `coverage: complete`になるまでcontractを`stable`にしません。

## Do / Don't

Do:

```tsx
<ComponentName />
```

Don't:

```tsx
<ComponentName />
```

## Prohibited Patterns

- 禁止する実装や使い方。
- design/rules.json に対応するルールがあれば ID を意識して書く。
- AI がやりがちな誤用を書く。

## AI Selection Rules

AI がこのコンポーネントを選ぶ条件:

- 条件を書く。

AI がこのコンポーネントを避ける条件:

- 代替コンポーネントを書く。

AI が variant / size / state を判断するルール:

- 判断基準を書く。

## Examples

代表的な使い方だけを載せます。複雑な画面例は HTML docs や templates に寄せます。

```tsx
<ComponentName />
```

## Implementation Notes

- 将来 React 実装するときの API 方針。
- native element / ref / keyboard / aria / events。
- 初期実装では保留するもの。

## Open Questions

- 未確定の設計判断。
- stable にする前に決めること。
- token や別 component の追加が必要なこと。
