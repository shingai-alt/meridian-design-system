# Dialog

## Summary

現在の作業を一時的に中断し、短い判断または入力を完了させるmodal window。

Machine-readable contract: `design/contracts/components/dialog.contract.json`

## Role

Dialogはtrigger、backdrop、native modal lifecycle、accessible name、initial focus、contained Tab sequence、Escape、close後のfocus returnを所有します。内容componentはform、message、actionの意味を所有し、modal責務を重複させません。

## Principles

- Taskの主目的と現在状態を最短で理解できること。
- Native semanticsまたは確立したARIA patternを優先すること。
- Semantic tokenを基本とし、Component tokenはpolicy triggerがある場合だけ追加すること。
- 確認を増やすこと自体を安全性とせず、不可逆・高影響な操作だけに摩擦を使うこと。

## When To Use

- 現在の作業を中断して回答が必要な、短い確認または単一目的のform。
- 削除、法的同意、金融取引など、実行前のreviewまたは確認が必要な高影響action。
- 続行不能な短い重要messageへ即時responseを求める場合。

## When Not To Use

- 背景を参照しながら行う補助task、quick edit、filterはDrawerまたはPopoverを使う。
- 長いform、multi-step workflow、固有URLが必要なtaskは専用pageを使う。
- 判断を要求しない一時的な結果はToast、文脈内で残す情報はAlertを使う。
- 通常の保存や軽微な操作へ毎回確認を挟まず、可能ならUndoを優先する。

## Visual Model

中央配置のmodal surfaceとbackdropで現在の文脈を一時停止します。Surface toneは常に共通で、`danger`はmessageとprimary actionの意味を強めます。Dialog全体を赤いsurfaceへ変えません。

## Anatomy

| Part | Required | Description |
|---|---:|---|
| trigger | Yes | Dialogを開き、close後にfocusを受け取るfocusable control。 |
| backdrop | Yes | 背景が操作不能であることを視覚化する。 |
| surface | Yes | `showModal()`でtop layerへ表示するnative `dialog`。 |
| title | Yes | `aria-labelledby`でsurfaceを命名する可視heading。 |
| close-control | Yes | 常に可視でaccessible nameを持つIcon Button。 |
| description | No | 短く単純な目的説明。構造化content全体を参照しない。 |
| body | Yes | Messageまたはform content。必要な場合だけ内部scrollする。 |
| footer | Yes | 少なくともdismiss経路を含むaction領域。 |

## Variants

| Variant | Use | Notes |
|---|---|---|
| `default` | 通常の短いformまたは確認。 | Native roleは`dialog`を既定とする。 |
| `danger` | 不可逆または回復困難なactionの最終確認。 | Primary Buttonをdangerにし、初期focusはCancelなど最も安全なactionへ置く。 |

`variant`はvisual toneとcontent policyです。`role="alertdialog"`は別の`role` propで明示し、dangerだから自動適用しません。

## Sizes / Density

Dedicated size propは持ちません。Content幅は`--dialog-w-md`を上限にし、viewportとcontentで縮みます。Compact / Default / Comfortableは周辺densityに従いますが、target minimum、意味、APIは変えません。

## Icon Rules

Close controlはIcon Buttonを使用し、`closeLabel`からaccessible nameを得ます。Warning iconを追加してもtitleやmessageの代わりにしません。

## States

| State | Behavior |
|---|---|
| `open` | `showModal()`でtop layerへ表示し、背景をinertにしてfocusを内部へ移す。 |
| `closed` | native `open` attributeを残さず、triggerを通常のdocument順へ戻す。 |
| `submitting` | Actionの二重実行を防ぎ、Dialogを開いたまま進行状態を伝える。 |
| `error` | Dialogを開いたまま原因と修正方法をtextで示し、最初のerrorへfocusを移す。 |

## Behavior

- Trigger activationはcontrolled/uncontrolled stateを同じlifecycleで開く。
- Native `showModal()` / `requestClose()` / `close()`を使い、renderで`open` attributeを直接toggleしない。
- Escapeとclose controlは同じclose requestへ合流する。Backdrop clickは既定で閉じず、誤操作による入力喪失を避ける。
- Close後はtriggerへfocusを戻す。Triggerが消えた場合はworkflow上の論理的な次の要素へ移す。
- Defaultでは最初の意味あるcontrolへfocusする。長い・構造化contentでは`tabindex="-1"`のtitleまたは冒頭へ置く。
- DangerではCancelなど最も安全なactionへinitial focusを置く。Primary destructive actionへ自動focusしない。
- Submit中は二重実行を防ぐ。Successでcloseするかはcontent actionが決め、failureではcloseしない。

## React API Freeze

React実装前に次のpublic APIへ固定します。

```tsx
type DialogProps = {
  trigger: ReactElement;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  variant?: "default" | "danger";
  role?: "dialog" | "alertdialog";
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialFocusRef?: RefObject<HTMLElement | null>;
  closeLabel?: string;
  ref?: ForwardedRef<HTMLDialogElement>;
};
```

- `trigger`へ`aria-haspopup="dialog"`、`aria-controls`、`aria-expanded`、open handlerを合成します。
- `title`は可視headingとして必須です。
- `description`が短く単純な場合だけ`aria-describedby`へ接続します。List、table、複数paragraphなど構造化contentへは接続しません。
- `footer`は必須で、Cancelまたは同等のdismiss actionを含めます。Headerのclose controlも常にrenderします。
- `role="alertdialog"`では短い重要messageを`aria-describedby`で参照し、responseを要求する場合だけ使います。
- `ref`はnative `HTMLDialogElement`へforwardします。

## Layout / Placement Rules

### Recommended Pattern

- Dialogをblock/inline中央へ置き、viewport edgeからtokenized insetを確保する。
- Headerとfooterを到達可能に保ち、長い場合はbodyだけをscrollする。
- Footer actionはDOM orderとvisual orderを一致させ、Cancelの後にprimary actionを置く。
- Nested modalは原則避け、必要な場合もtopmost Dialogだけをactiveにする。

## Responsive / Viewport Behavior

PC用とSP用に別componentを作らず、同じ意味、API、modal lifecycleをviewportへ適応させます。

### Desktop

- Inline sizeは`--dialog-w-md`を上限にcontentへ適応する。
- Block sizeはdynamic viewport内へ制限し、bodyだけをscrollする。
- Backdrop中のbackground contentを操作不能にする。

### Mobile

- `100vi`と`100dvb`、safe areaへ収め、横overflowを起こさない。
- 同じAPIとmodal semanticsのままedge insetを縮める。Bottom sheetへ意味を変えない。
- Software keyboardでfocused fieldとerror、footer actionが完全に隠れないようscrollする。

### Touch

- 全targetは24px minimum、主要actionは44px以上を推奨する。
- Backdrop tapやswipeだけをdismiss経路にしない。
- Hoverだけにwarningやaction説明を依存させない。

## Accessibility

- Native `dialog`を`showModal()`で開き、背景を実際にinertにする。
- Visible title、visible close control、footerのdismiss actionを持つ。
- Open中は`Tab / Shift+Tab`をDialog内に保持し、Escapeでclose requestを発行する。
- Close後はtriggerまたは論理的な次のfocus先へ戻す。
- Positive tabindexを使わず、focus indicatorをsticky footerで完全に隠さない。
- Input errorはtextで特定し、`aria-invalid`と説明関係を同期する。

Keyboard:

- `Tab / Shift+Tab`: Open中はDialog内のtabbable element間を循環する。
- `Escape`: Close requestを発行し、close後にtriggerへfocusを戻す。
- `Enter`: Formのnative submit規則に従う。Textarea中やIME変換中にprimary actionを誤発火させない。

## Content Guidelines

- Titleは対象とactionを具体的に書く（「プロジェクトを削除」）。「確認」のような抽象語だけにしない。
- Danger messageは何が失われるか、対象名、recovery可否を説明する。
- 名称再入力は高影響かつUndo不能な場合だけ使い、通常の確認へ常用しない。
- Action labelは結果を明示する（「削除」「変更を破棄」）。「はい」「OK」だけにしない。
- Errorは原因と修正方法をDialog内へ残す。

## Tokens

- semanticColor: `--surface-overlay`, `--fg`, `--fg-muted`, `--border`, `--border-muted`, `--overlay`, `--focus-ring`
- spacing: `--sp-2`, `--sp-3`, `--sp-4`, `--sp-5`, `--sp-8`
- radius: `--radius-xl`
- sizing: `--dialog-w-md`
- motion: `--dur-normal`, `--ease-enter`
- shadow: `--shadow-overlay`

Primitive color、raw hex、任意pxをcomponentから直接選びません。

### Token Binding Decisions

Surface、backdrop、header/body/footer、title/description、width、radius、shadow、motionを上記public tokenへ完全に結線します。Intrinsicな`100vi` / `100dvb`はviewport constraintとして許可し、visual theme decisionには使いません。

Current coverage: `complete`。React実装前に未結線visual slotはありません。

## Do / Don't

Do:

```tsx
<Dialog
  trigger={<Button variant="danger">削除</Button>}
  title="プロジェクトを削除"
  description="Meridian Docs は復元できません。"
  variant="danger"
  role="alertdialog"
  initialFocusRef={cancelRef}
  footer={
    <>
      <Button ref={cancelRef} variant="secondary">キャンセル</Button>
      <Button variant="danger" type="submit">完全に削除</Button>
    </>
  }
>
  <ProjectNameConfirmation />
</Dialog>
```

Don't:

```tsx
{/* aria-modalだけでは背景は操作不能にならない。 */}
<div role="dialog" aria-modal="true">削除しますか？</div>
```

## Prohibited Patterns

- `aria-modal="true"`を付けながら背景操作とfocus移動を許す。
- Native `open` attributeをReact renderだけで追加・削除する。
- Danger primary actionへinitial focusを置く。
- Backdrop tapまたはswipeだけで閉じる。
- 構造化body全体を`aria-describedby`へ接続する。
- `NO_RAW_HEX_COLOR`、`SPACING_FROM_TOKENS_ONLY`、`RADIUS_FROM_TOKENS_ONLY`、`CONTRAST_AA_MINIMUM`に反する実装。
- `FOCUS_VISIBLE_REQUIRED`、`NO_POSITIVE_TABINDEX`、`TARGET_SIZE_MINIMUM`、`INTERACTIVE_NAME_REQUIRED`に反する実装。

## AI Selection Rules

AIが選ぶ条件:

- Background taskを中断して短いresponseが必要。
- High-impact actionのreview / confirm / correct機会が必要。

AIが避ける条件:

- 補助taskはDrawer、anchored optionはPopover、長いworkflowはdedicated page。
- Response不要の結果はToast、context内に残すmessageはAlert。

AIは`danger`と`alertdialog`を同義に扱いません。Dangerはactionの影響、alertdialogは短い重要messageによる即時割り込みのsemanticです。

## Examples

```tsx
<Dialog
  trigger={<Button>プロジェクトを作成</Button>}
  title="プロジェクトを作成"
  footer={<><Button variant="secondary">キャンセル</Button><Button type="submit">作成</Button></>}
>
  <ProjectForm />
</Dialog>
```

## Implementation Notes

- React packageは今後追加します。現在はContract 0.2.0、HTML Showcase、review evidenceを実装正本とします。
- Production runtimeは`showModal()` / `requestClose()` / `close()`とcontrolled stateをeventで同期します。
- Static Showcaseの`<dialog open>`は複数scenarioを同時比較する表示であり、実際のmodalityを宣言する`aria-modal="true"`を付けません。

## Open Questions

なし。React実装、native dialog lifecycle integration test、visual regressionはstable昇格条件であり、実装前Contractの未決事項ではありません。
