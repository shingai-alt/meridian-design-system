# Meridian UI Generation — Structure Planning

- Status: Implementation spike complete; Human approvals pending
- Milestone: M3
- Pattern registry: `design/product-ui-patterns.json`
- Research Decision: `design/research-decisions/ui-generation-product-pattern-model.research.json`

## 1. Purpose

Structure Planningは、承認対象となるDesign Briefを、要件配置、論理的な画面責務、Product UI Pattern、比較可能な構造案へ変換する。

この段階ではComponent、DOM、Token、色、余白を決めない。RequirementとResponsibilityを先に固定し、同じ業務責務を異なるTask Model、Information Architecture、Navigation、Disclosure、Action Model、Screen Boundaryへ配置した2〜3案を比較する。

## 2. Artifact chain

```text
Design Brief
  -> Requirement Allocation
  -> Screen Responsibilities
  -> Pattern Selection
  -> Direction Set
  -> Human Direction Approval
```

各Artifactは直前の正本pathとSHA-256 digestを保持する。Session validatorも現行Artifact同士のsource bindingを検証するため、別Session由来のAllocationや古いResponsibilityを混在できない。

正式Session transitionには承認済みDesign Briefが必要である。現在のTeam Invitation Artifactは実装Spikeとして生成されているが、M1 Config DecisionとM2 Briefが未承認なので、Sessionは`created`に留まる。

## 3. Requirement Allocation

RequirementはDesign BriefのAction、Constraint、Riskを、Task、Constraint、Risk Control、State、Qualityへ正規化する。各Requirementは1つ以上のResponsibilityへ配置する。

Quality Gate:

- Brief内の全Action、Constraint、RiskがRequirementへ表現される。
- 全Requirementが1つ以上のAllocationを持つ。
- `coverage.required`、`coverage.allocated`、`unallocatedRequirementRefs`が実データと一致する。
- `ready-for-review`ではAllocation coverageが100%である。

## 4. Screen Responsibility

Screen Responsibilityは物理的なpageやmodalを意味しない。方向案をまたいで維持する論理的な業務責務である。

各Responsibilityは次を持つ。

- 1文の`responsibility`
- 1つの`primaryTask`
- 担当するRequirement
- 明示的な`notResponsibleFor`
- Entry条件
- Completion条件

AllocationされたRequirementは、配置先Responsibilityの`supportsRequirementRefs`に含まれなければならない。これによりPersistent領域を含め、責務外の情報やActionを黙って配置できない。

Team Invitationでは次の4責務を固定した。

1. Member and Invitation Management
2. Invitation Composition
3. Invitation Review and Commit
4. Invitation Result Recovery

## 5. Product UI Pattern

MeridianのProduct UI Patternは、特定Componentの組合せではなく、利用者が目的を達成するための再利用可能な行動構造である。

Pattern Registryは次を要求する。

- 解決するuser problem
- Task Model
- 適用条件と非適用条件
- 必要Behavior
- Evidence
- Maturity

WAI-ARIA APGのPatternはWidget semanticsとKeyboard behaviorの重要な根拠だが、Product UI Pattern taxonomyそのものではない。APG自身も包括的UI Design SystemやProduction Ready codeを目的としていないと説明している。

初期candidate:

- Batch Entity Creation
- Review Before Commit
- Asynchronous Partial Result
- Status Management List

これらはまだ`candidate`であり、AIはsystem-wide `supported`へ昇格できない。追加PilotとHuman Reviewが必要である。

## 6. Direction distinctness

Directionは次の6次元をすべて宣言する。

1. Task Model
2. Information Architecture
3. Navigation
4. Disclosure
5. Action Model
6. Screen Boundary

2案の間には最低2次元の差を要求する。色、radius、spacing、Component variantだけを変えた案は同一構造として拒否する。

各Directionは全Requirementを維持し、すべての論理Responsibilityを一度だけ物理Containerへ配置する。Visual craftのためにRequirementやResponsibilityを削除・追加することはできない。

Team Invitationの3案:

| Direction | Structure |
|---|---|
| Dedicated Staged Workspace | 管理、入力、確認、結果を明示的なpage stateへ分離 |
| Contextual Staged Panel | Members文脈を維持し、Panel内で入力、確認、結果を段階化 |
| Inline Management Workspace | 管理、draft、Pending、結果を同一Workspaceへ統合し、確認だけを一時表示 |

AI recommendationはDedicated Staged Workspaceだが、採用決定ではない。

## 7. Research result

M3 Research Gateでは次の3境界を比較した。

- Task-first Product UI Pattern registry
- Component / ARIA-pattern-first taxonomy
- Page-template / container-first taxonomy

Task-firstを推奨する。成熟Design SystemはPatternをuser-focused taskまたはuser goalに対するsolutionとして扱っている。一方、Component-firstでは同じWidgetが複数の構造案に現れ、方向性の差を説明できない。Page-template-firstはScreen Boundary比較には有効だが、Task、Disclosure、Action ownershipを十分に表現できない。

Research Decisionは`decision-ready`であり、Human Approvalまではstable contractへ昇格しない。

## 8. Human direction gate

Direction Setの承認は`design-owner` roleのHumanだけが実行できる。Approvalは選択したDirection IDとreviewable Direction Setのcanonical digestへ結び付く。

次を拒否する。

- AI actorによるDirection承認
- 存在しないDirectionの選択
- 承認後に変更されたDirection Set
- Pattern selectionなしのDirection生成
- RequirementまたはResponsibilityを欠くDirection
- 構造差が最低値を満たさない代替案

## 9. Verification

```sh
node --test test/structure-planning.test.js test/ui-generation-session.test.js
node scripts/validate-system.mjs
npm run check:system
```

Team Invitation fixtures:

- `examples/ui-generation/team-invitation.requirement-allocation.json`
- `examples/ui-generation/team-invitation.screen-responsibilities.json`
- `examples/ui-generation/team-invitation.pattern-selection.json`
- `examples/ui-generation/team-invitation.direction-set.json`

