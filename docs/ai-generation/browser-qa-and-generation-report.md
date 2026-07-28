# Browser QA, repair, and Generation Report

MeridianのUI生成は、HTMLを出力した時点では完了しない。生成物、Browser QA証拠、修復履歴、Generation Report、Human reviewを一つの証拠連鎖として扱う。

## Browser QA matrix

`design/ui-generation-browser-qa-policy.json`が、Chromium環境、Desktop・Tablet・Mobile、Default・Loading・Empty・Error・Permissionの組合せを定義する。実際のscenarioは固定件数ではなく、Generation Manifestの各State Fixtureが参照するScreenとの直積から導出する。

各scenarioはScreenshotだけでなく、console error、page error、horizontal overflow、DOM ID、ARIA参照、accessible name、keyboard到達性、visible focus、focus obstruction、状態signal、Component runtime provenanceを記録する。Evidenceは入力Manifest、Review UI、Review Model、Usage Manifest、Policyのdigestに結び付く。

Screenshotは記録されたBrowser・OS・実行環境内の証拠であり、別環境との無条件なpixel同一性を意味しない。また自動検査だけでWCAG適合を宣言しない。VoiceOver、Browser UIを含む200% zoom、Windows High Contrastは手動証拠として残る。

## Repair boundary

修復対象は`generation-manifest`、`layout-recipe`、`component-runtime`、`content`、`browser-environment`に限定する。Requirements、Screen Responsibilities、Selected Patterns、Selected Direction、Capability Plan、Adapter Selectionはlocked layerである。

回数上限は次の通り。

- Deterministic validation: 5
- Structural repair: 2
- Visual repair: 2
- Pattern reselection: 1

AIはlocked layerを変更できない。Structural repairまたはPattern reselectionが必要なFindingは、変更せずHuman reviewへescalateする。各Attemptは修復前後のLocked Structure Digestを保持し、同一でなければ無効になる。

## Generation Report

Generation Reportは以下をまとめる。

- Screenと責務
- 選択Pattern、Direction、Visual Profile、Adapter
- AdapterごとのCapabilityとComponent割当
- 各Screenが責務外とした事項
- 検討したDirections、Recommendation、実選択
- Browser QA結果と自動検査の限界
- 実施したFixと未解決Finding
- Human design-owner review

Browser QA EvidenceがなければReportは`evidence-missing`、blocking Findingがあれば`qa-blocked`になる。QA passかつ未解決0件で初めて`ready-for-human-review`へ進む。`approved`にはHuman design-ownerの判断と、対象Reportを固定するdigestが必要であり、AIによる自動承認は認めない。

現在のfixture ReportはBrowser実行証拠がまだないため、意図的に`evidence-missing`かつHuman review `pending`で生成される。
