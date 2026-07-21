# Button

## Summary

Button は、ユーザーが明確なアクションを実行するための基本コントロールです。Meridian では、装飾的な強調ではなく「次に何を実行できるか」と「その操作の重要度」を伝えるために使います。

Machine-readable contract: `design/contracts/components/button.contract.json`

## Role

Button は、UI 内の意思決定点を示します。

ユーザーが情報を読んだあと、保存する、作成する、送信する、削除する、キャンセルするなど、状態を変える操作を実行するときに使います。Button の見た目は操作の重さを表すためのものであり、視覚的なにぎやかさを作るためには使いません。

## Principles

- Clarity over decoration: ラベル、配置、variant から操作結果が予測できること。
- Density with rhythm: 高密度な業務 UI でも高さ、余白、並びのリズムが崩れないこと。
- Tokens before components: 色、余白、角丸、motion は Meridian token から参照すること。
- Accessible precision: フォーカス、キーボード操作、コントラスト、読み上げを初期条件にすること。
- Calm interaction: hover / active / loading の変化は控えめで高速にすること。

Button 固有の原則:

- 1 つの意思決定文脈に primary は原則 1 つ。
- ラベルは押した後に起きることを書く。
- danger は破壊的操作の最終確認に限定する。
- 色だけで状態や危険度を伝えない。
- 無効状態は「押せない理由」が分かる文脈と一緒に使う。

## When To Use

- フォームを送信する。
- 設定変更を保存する。
- 新しいリソースを作成する。
- ダイアログ内で操作を確定またはキャンセルする。
- テーブル行やツールバーで補助操作を実行する。
- 削除、権限変更、取り消し不能な操作を明示する。

## When Not To Use

- ページ遷移や外部参照だけが目的の場合は Link を使う。
- 2 から 4 個の表示モードを切り替える場合は Segmented Control を使う。
- 複数の排他選択肢を提示する場合は Radio Group を使う。
- 即時反映する設定の ON/OFF は Switch を使う。
- アイコンだけで意味が明確な補助操作は Icon Button を使う。
- ただ目立たせたいだけのテキストやラベルには使わない。

## Visual Model

Button は、小さな操作面です。サイズ、色面、境界線、ラベルの重みで階層を表します。

- Primary は solid な色面で最も強い。
- Secondary は neutral control 面と境界線で操作可能性を示す。
- Tertiary は primary の色相を保ちながら優先度を一段下げる。
- Ghost は通常時に面を持たず、周辺 UI の密度を壊さない。
- Danger は破壊的な最終操作だけに使う。

Button は static な card / panel のように面で階層を作る部品ではありません。全 variant で shadow を使いません。

## Anatomy

| Part | Required | Description |
|---|---:|---|
| Root | Yes | native `button` 要素。variant、size、state に応じた token だけで構成する。 |
| Label | Yes | 操作結果を予測できる可視文言。Button では省略不可。 |
| Leading icon | No | 操作の意味を補強するアイコン。装飾の場合は `aria-hidden="true"` にする。 |
| Trailing icon | No | 展開、遷移、外部リンクなど、操作後の方向を補足するアイコン。 |
| Spinner | No | loading 中の進行表示。装飾として扱い、ラベル node、accessible name、Button 幅を保つ。 |

## Variants

| Variant | Use | Notes |
|---|---|---|
| `primary` | 画面または文脈の最重要アクション。 | 原則 1 つ。複数ある場合は情報設計を見直す。 |
| `secondary` | primary に次ぐ補助アクション。 | Neutral control面と境界でCardから区別し、保存に対するプレビュー、作成に対するインポートなどに使う。 |
| `tertiary` | 低優先だが見つけやすくしたい操作。 | 選択済みや軽い強調にも使えるが、primary の代替にしない。 |
| `ghost` | 面を増やしたくない補助操作。 | キャンセル、閉じる、ツールバー、テーブル行内に向く。 |
| `danger` | 破壊的な最終操作。 | 削除、権限剥奪、取り消し不能な変更。確認 UI と併用する。 |

Variant 選定の優先順位:

1. 操作が破壊的なら `danger`。
2. その文脈で最重要なら `primary`。
3. primary を支える操作なら `secondary`。
4. primary 色相で低優先の操作を見つけやすくするなら `tertiary`。
5. 面を増やしたくない補助操作なら `ghost`。

ページ遷移は Link、アイコンだけの操作は Icon Button、完了結果の表示は status component が担当します。`outline` は `secondary` に統合し、`success` と `link` は Button variant に含めません。

## Sizes / Density

| Size | Height token | Typical use |
|---|---|---|
| `xs` | `--ctl-xs` | 密度の高いテーブル行内、短い補助操作。 |
| `sm` | `--ctl-sm` | ツールバー、カード内、フォーム補助操作。 |
| `md` | `--ctl-md` | 標準。ダイアログ、フォーム、ページ内アクション。 |
| `lg` | `--ctl-lg` | ページ上部の主要操作、余白のある画面。 |
| `xl` | `--ctl-xl` | モバイルの主要 CTA、オンボーディングなど。 |

Density によって高さ、余白、文字サイズは変化します。任意の px 値で上書きせず、`--ctl-*`、`--sp-*`、`--text-*` token を使います。

標準は `md` です。業務 UI の密度を保つため、ページ全体で `lg` や `xl` を多用しないでください。

## Icon Rules

- Leading icon は、ラベルの意味を補強するときだけ使う。
- Trailing icon は、展開、遷移、外部リンクなど方向性を伝えるときに使う。
- 装飾アイコンは `aria-hidden="true"` にする。
- Icon-only の操作は必ず Icon Button として扱う。
- Button の leading / trailing icon は可視ラベルを補助し、accessible name を重複させない。
- アイコンだけで危険度を伝えない。

Icon + text の場合、アイコンとラベルの間隔は `--sp-1` から `--sp-2` の範囲に収めます。ボタンの高さを変えるためにアイコンサイズだけを大きくしないでください。

## States

| State | Behavior |
|---|---|
| `default` | 操作可能な通常状態。 |
| `hover` | token による控えめな面または色の変化。意味を hover のみに依存させない。 |
| `active` | 押下中の状態。寸法や配置を変えない。 |
| `focus` | `:focus-visible` で `--focus-ring` を表示する。 |
| `disabled` | 操作不可。必要なら理由を近くに示す。 |
| `loading` | 実行中。二重送信を防ぎ、accessible name を維持する。 |

State transition:

```text
default -> hover -> active -> default
default -> focus -> default
default -> loading -> default
default -> disabled
```

Loading 中はラベル node を DOM から外さず、文字だけを透明化して中央の spinnerへ置き換えます。これにより Button 幅と読み上げ可能な名前を保持します。

## Behavior

- Click / Enter / Space で action を実行する。
- `type` の既定値は `button`。フォーム送信時だけ `type="submit"` を明示する。
- Loading 中は `aria-busy="true"` と `aria-disabled="true"` を設定し、event handler 側でも同じ action の再実行を防ぐ。フォーカスは移動しない。
- `disabled` は native `disabled` へ写像し、フォーム送信対象と Tab 順序から外す。
- 無効理由は周辺テキストで説明し、必要なら `aria-describedby` で接続する。
- Toggle state は Button の managed API に含めない。ON/OFF は Switch、選択状態は専用 selection control を使う。

## Layout / Placement Rules

### Form footer

- Primary action は右端または末尾に置く。
- Cancel / discard は `ghost` または `secondary` にする。
- 保存前に未保存状態を示す場合は、Button だけでなく save bar や status text と組み合わせる。

```tsx
<Button variant="ghost">キャンセル</Button>
<Button variant="primary">変更を保存</Button>
```

### Dialog footer

- 破壊的でない確定は `primary`。
- キャンセルは `ghost`。
- 破壊的な確定は `danger` にし、本文で影響を説明する。

```tsx
<Button variant="ghost">キャンセル</Button>
<Button variant="danger">削除する</Button>
```

### Toolbar

- 主要作業の起点だけ `primary` または `secondary` にする。
- フィルタ、表示切替、コピーなどは `ghost` または Icon Button にする。
- Toolbar 内に primary を複数並べない。

### Table row

- 可視ラベルが必要な行内操作は `ghost`、アイコンだけなら Icon Button、遷移なら Link を使う。
- 行の高さを Button に合わせて広げすぎない。
- 破壊的行内操作は直接 `danger` を置かず、メニューまたは確認ダイアログへ逃がす。

### Danger zone

- セクション自体で危険文脈を示し、最終操作だけ `danger` にする。
- `danger` をページ上部の通常操作群に混ぜない。

### Mobile

- 主要 CTA は `fullWidth` を使ってもよい。
- 複数の Button を横並びにしてラベルを詰め込まない。
- Bottom fixed action とページ内の大きな CTA を重複させない。

## Responsive / Viewport Behavior

Button は PC 用と SP 用に分けません。同じ Button contract を使い、viewport、入力方式、密度に応じて size、placement、layout pattern を変えます。

### Desktop

- 標準サイズは `md`。
- Form footer、Dialog footer、Toolbar では inline 配置を基本にする。
- Table row action は `xs` または `sm` を使い、行高を Button に合わせて広げない。
- Hover / active の視覚変化を持ってよいが、hover だけに意味を依存しない。
- Primary は 1 つの意思決定文脈に原則 1 つ。

### Mobile

- 主要 CTA は `fullWidth` を許可する。
- 主要 CTA は `lg` または `xl` を使える。
- 複数 Button の横並びを避け、縦積みまたは primary + text link に分ける。
- Danger action は画面下部の大きな CTA として常時露出させず、確認 UI の中で使う。
- Bottom fixed action とページ内 CTA を重複させない。

### Touch

- 操作 target は 24px minimum を満たし、touch 中心の主要操作は原則 44px 以上にする。
- Comfortable density では主要操作が押しやすい高さになることを優先する。
- Hover に意味を依存しない。
- Icon-only action は Icon Button へ分離し、十分な touch target を確保する。
- Loading 中は連打による二重実行を防ぐ。

## Accessibility

- 既定では native `button` を使う。
- 操作結果を予測できる可視ラベルを必須にする。アイコンだけの操作は Icon Button を使う。
- Loading 中は `aria-busy="true"` と `aria-disabled="true"` を設定し、ラベル node、accessible name、Button 幅を失わない。
- Loading 中は見た目だけでなく event handler 側でも click / submit の再実行を防ぐ。
- `danger` の意味を色だけで伝えず、対象と操作をラベルや確認文で示す。
- `:focus-visible` で `--focus-ring` を表示する。
- Focus ring は周辺背景とのコントラストを保つ。
- Disabled 状態の理由が必要な場合は、説明テキストと `aria-describedby` を検討する。
- 操作 target は 24 CSS px minimum を満たし、touch 中心の主要操作は原則 44px 以上にする。

## Content Guidelines

Button label は動詞から始め、押した結果を予測できる文言にします。

Good:

- `変更を保存`
- `プロジェクトを作成`
- `招待を送信`
- `ワークスペースを削除`

Avoid:

- `OK`
- `実行`
- `はい`
- `次へ` だけで遷移先が分からない文言

Danger label は対象と操作を具体的に書きます。`削除` より `ワークスペースを削除` を優先します。

## Tokens

Button が参照できる token:

- Component color: `--button-primary-bg`, `--button-primary-bg-hover`, `--button-primary-bg-active`, `--button-primary-fg`
- Semantic color provenance: `--primary`, `--primary-hover`, `--primary-active`, `--primary-subtle`, `--primary-muted`, `--primary-fg`, `--control-bg`, `--control-bg-hover`, `--control-bg-active`, `--control-border`, `--control-border-hover`, `--surface-muted`, `--fg`, `--fg-disabled`, `--danger`, `--danger-hover`, `--danger-active`, `--danger-on-solid`, `--disabled`, `--focus-ring`
- Density: `--ctl-xs`, `--ctl-sm`, `--ctl-md`, `--ctl-lg`, `--ctl-xl`, `--text-micro`, `--text-small`, `--text-label`, `--text-body`
- Spacing: `--sp-1`, `--sp-15`, `--sp-2`, `--sp-25`, `--sp-3`, `--sp-4`, `--sp-5`
- Component dimension: `--button-icon-size-xs`, `--button-icon-size-sm`, `--button-icon-size-md`, `--button-icon-size-lg`, `--button-icon-size-xl`, `--button-spinner-stroke`
- Radius: `--radius-sm`
- Motion: `--dur-fast`, `--dur-loop`, `--ease-standard`

Button では `--accent` を使いません。Accent はブランドマークやアバターなどの識別表現に限定します。

`secondary`はCardと同じ`--surface`を直接使いません。Neutral action専用の`--control-*`を使い、Light / Darkのどちらでも静的surfaceと操作可能なcontrolを識別できる状態にします。

## Do / Don't

Do:

```tsx
<Button variant="ghost">キャンセル</Button>
<Button variant="primary">変更を保存</Button>
```

Don't:

```tsx
<Button variant="primary">キャンセル</Button>
<Button variant="primary">変更を保存</Button>
```

Do:

```tsx
<Button variant="danger">ワークスペースを削除</Button>
```

Don't:

```tsx
<Button variant="danger">OK</Button>
```

Do:

```tsx
<IconButton variant="ghost" aria-label="検索">
  <SearchIcon aria-hidden="true" />
</IconButton>
```

Don't:

```tsx
<Button variant="ghost" aria-label="検索">
  <SearchIcon />
</Button>
```

## Prohibited Patterns

- 生の hex 色を指定する。
- 任意の px 値で margin、padding、gap、border-radius を指定する。
- Button に `--accent` を使う。
- Solid 背景上の文字色を即席の白黒や hex で指定する。
- focus outline を消したまま focus-visible を復元しない。
- Primary を同じ意思決定文脈に複数置く。
- Danger を通常の強調色として使う。
- Disabled によって必要な説明や回復手段まで隠す。
- Loading 中に同じ操作を再実行できる状態にする。

## AI Selection Rules

AI が Button を選ぶ条件:

- ユーザーがクリックして状態を変更する操作である。
- フォーム送信、保存、作成、削除、招待、実行などの action である。
- Dialog footer、Form footer、Toolbar、Table row action のいずれかに置く操作である。

AI が Button を避ける条件:

- 遷移だけなら Link を選ぶ。
- 表示モード切り替えなら Segmented Control を選ぶ。
- ON/OFF 設定なら Switch を選ぶ。
- 複数選択なら Checkbox を選ぶ。
- 排他選択なら Radio を選ぶ。

AI の variant 選定:

- 破壊的操作なら `danger`。
- 画面または文脈の最重要 action なら `primary`。
- primary を支える補助 action なら `secondary`。
- primary 色相で低優先の操作を見つけやすくするなら `tertiary`。
- キャンセル、閉じる、行内操作なら `ghost`。

AI は Button を生成するとき、必ず label、variant、size、disabled/loading の有無、周辺配置を判断します。判断できない場合は `primary` を増やさず、`secondary` または `ghost` を選びます。

## Examples

Primary action:

```tsx
<Button variant="primary">プロジェクトを作成</Button>
```

Dialog actions:

```tsx
<Button variant="ghost">キャンセル</Button>
<Button variant="primary">保存</Button>
```

Danger confirmation:

```tsx
<Button variant="ghost">キャンセル</Button>
<Button variant="danger">ワークスペースを削除</Button>
```

Loading:

```tsx
<Button type="submit" variant="primary" loading>
  変更を保存
</Button>
```

Full width mobile CTA:

```tsx
<Button variant="primary" size="xl" fullWidth>
  続行
</Button>
```

## Implementation Notes

- React 実装では `ComponentPropsWithoutRef<'button'>` を基礎にし、`ButtonProps` が `children`、`variant`、`size`、`leadingIcon`、`trailingIcon`、`loading`、`disabled`、`fullWidth` を所有する。
- `formAction`、`formEncType`、`formMethod`、`formNoValidate`、`formTarget`を含むnative button属性、event handler、`aria-*`、`data-*`はrootへ透過する。Component所有propだけを上書きする。
- `forwardRef<HTMLButtonElement, ButtonProps>` で native button へ `ref` を渡す。
- `type` の既定値は `button` にする。フォーム送信は明示的に `type="submit"` を指定する。
- `loading` 中は `aria-busy` と `aria-disabled` を component が付与し、click / submit handler の実行を guard する。native `disabled` にはせず、処理完了までフォーカスを保持する。
- `disabled` は native `disabled` に写像する。
- Leading / trailing icon の wrapper は `aria-hidden="true"` にし、ラベルを accessible name とする。
- `asChild` / polymorphic API、`iconOnly`、toggle state は初期 API に含めない。
- Contract `0.2.0` を React 実装前の API freeze とする。実装と visual regression baseline の検証後に `status: stable` へ昇格する。

## Open Questions

React 実装前の仕様判断はすべて解決済みです。`status: stable` への昇格条件は、React 実装、全 required scenario の自動テスト、visual regression baseline の完了です。
