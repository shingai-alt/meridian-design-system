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
- Secondary / outline は境界線で操作可能性を示す。
- Ghost は面を持たず、周辺 UI の密度を壊さない。
- Danger / success は状態文脈が明確なときだけ solid にする。
- Link variant は Button の中で最も軽く、データ変更を伴う操作には使わない。

Button は static な card / panel のように面で階層を作る部品ではありません。shadow は基本的に使わず、必要な場合も `--shadow-xs` 程度の小さな操作感に留めます。

## Anatomy

| Part | Required | Description |
|---|---:|---|
| Root | Yes | native `button` 要素。variant、size、state に応じた token だけで構成する。 |
| Label | Yes | 操作結果を予測できる短い文言。icon-only では視覚表示ではなく accessible name として必要。 |
| Leading icon | No | 操作の意味を補強するアイコン。装飾の場合は `aria-hidden="true"` にする。 |
| Trailing icon | No | 展開、遷移、外部リンクなど、操作後の方向を補足するアイコン。 |
| Spinner | No | loading 中の進行表示。ラベルまたは accessible name を失わせない。 |

## Variants

| Variant | Use | Notes |
|---|---|---|
| `primary` | 画面または文脈の最重要アクション。 | 原則 1 つ。複数ある場合は情報設計を見直す。 |
| `secondary` | primary に次ぐ補助アクション。 | Neutral control面と境界でCardから区別し、保存に対するプレビュー、作成に対するインポートなどに使う。 |
| `tertiary` | 低優先だが見つけやすくしたい操作。 | 選択済みや軽い強調にも使えるが、primary の代替にしない。 |
| `ghost` | 面を増やしたくない補助操作。 | キャンセル、閉じる、ツールバー、テーブル行内に向く。 |
| `outline` | 並列に近い補助操作。 | 面ではなく border で affordance を示す。 |
| `danger` | 破壊的な最終操作。 | 削除、権限剥奪、取り消し不能な変更。確認 UI と併用する。 |
| `success` | 承認、復旧、完了など肯定的な確定操作。 | primary の代わりに常用しない。状態文脈があるときだけ使う。 |
| `link` | 軽い参照や補助導線。 | データ変更を伴う操作には使わない。 |

Variant 選定の優先順位:

1. 操作が破壊的なら `danger`。
2. その文脈で最重要なら `primary`。
3. primary を支える操作なら `secondary`。
4. 面を増やしたくない補助操作なら `ghost`。
5. 情報参照に近い軽い導線なら `link`。

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
- Icon-only の操作は原則 Icon Button として扱う。
- Button で icon-only を許可する場合は `aria-label` を必須にする。
- アイコンだけで危険度や成功状態を伝えない。

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

Loading 中は、ラベルを完全に消さないでください。視覚的に spinner を出す場合でも、読み上げ可能な名前を保持します。

## Behavior

- Click / Enter / Space で action を実行する。
- Loading 中は同じ action を再実行できない。
- `disabled` はフォーム送信対象から外す。
- 無効理由を説明したい場合は `aria-disabled` を使い、フォーカス可能なまま説明へ接続することを検討する。
- Toggle 的に使う場合は `aria-pressed` を明示する。ただし単純な ON/OFF 設定には Switch を優先する。

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

- 行内操作は `ghost`、`link`、Icon Button を優先する。
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
- Icon-only action は `aria-label` と十分な touch target を必須にする。
- Loading 中は連打による二重実行を防ぐ。

## Accessibility

- 既定では native `button` を使う。
- Icon-only は `aria-label` を必須にする。
- Loading 中は `aria-busy="true"` を設定する。
- Loading 中も accessible name を失わない。
- `danger` や `success` の意味を色だけで伝えない。
- `:focus-visible` で `--focus-ring` を表示する。
- Focus ring は周辺背景とのコントラストを保つ。
- Disabled 状態の理由が必要な場合は、説明テキストと `aria-describedby` を検討する。

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

- Color: `--primary`, `--primary-hover`, `--primary-active`, `--primary-subtle`, `--primary-muted`, `--primary-fg`, `--control-bg`, `--control-bg-hover`, `--control-bg-active`, `--control-border`, `--control-border-hover`, `--surface`, `--surface-muted`, `--fg`, `--fg-disabled`, `--border`, `--border-muted`, `--border-strong`, `--danger`, `--danger-on-solid`, `--success`, `--success-on-solid`, `--disabled`, `--focus-ring`
- Density: `--ctl-xs`, `--ctl-sm`, `--ctl-md`, `--ctl-lg`, `--ctl-xl`, `--text-micro`, `--text-small`, `--text-label`, `--text-body`
- Spacing: `--sp-1`, `--sp-15`, `--sp-2`, `--sp-25`, `--sp-3`, `--sp-4`, `--sp-5`
- Radius: `--radius-sm`
- Motion: `--dur-fast`, `--dur-normal`

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
<Button variant="ghost" aria-label="検索">
  <SearchIcon aria-hidden="true" />
</Button>
```

Don't:

```tsx
<Button variant="ghost">
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
- キャンセル、閉じる、行内操作なら `ghost`。
- 軽い参照や補助導線なら `link`。

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
<Button variant="primary" loading aria-busy="true">
  保存中
</Button>
```

Full width mobile CTA:

```tsx
<Button variant="primary" size="xl" fullWidth>
  続行
</Button>
```

## Implementation Notes

- React 実装では `ButtonHTMLAttributes<HTMLButtonElement>` を基礎にする。
- `ref` を forward する。
- `type` の既定値は `button` にする。フォーム送信は明示的に `type="submit"` を指定する。
- `loading` 中は click handler の二重実行を防ぐ。
- `disabled` と `aria-disabled` は用途を分ける。
- `asChild` / polymorphic API は初期実装では保留する。
- Icon-only を Button に含めるか、Icon Button に分けるかは未決定。

## Open Questions

- `danger`、`success` の hover / active 専用 semantic token を追加するか。
- Button と Icon Button を同じ contract に含めるか、別 contract に分けるか。
- React 実装時に `asChild` / polymorphic API を許可するか。
- `link` variant を Button に残すか、Link component に寄せるか。
- `success` variant は Button として必要か、Alert / Badge / status action に限定するか。
