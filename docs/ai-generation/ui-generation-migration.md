# Meridian UI Generation Legacy Migration 0.1

- Status: Validated mapping
- Schema: `schemas/ui-generation-migration-map.schema.json`
- Semantic validator: `scripts/lib/ui-generation-migration.mjs`
- Pilot fixture: `examples/ui-generation/team-invitation.migration.json`

## Purpose

Legacy Phase 1/2成果物を、新しいUI Generation Sessionへ「移行済み」と誤認させずに引き継ぐための対応表である。

Migration Mapは次を区別する。

- `ready`: 変換後のtarget artifactを情報損失なく作れる。
- `partial`: 既存情報を保持できるが、新contractを満たす情報が不足する。
- `missing`: 対応する既存成果物がない。
- `not-applicable`: 対象pilotでは不要である。

すべてのlegacy sourceはpath、schema version、SHA-256 digestを持ち、最低1つのmappingから参照されなければならない。すべてのSession artifact typeはtarget coverageを1件だけ持つ。

## Team Invitation result

Team Invitationでは次の11成果物をinventory化した。

- Phase 1 Package
- 4 ScreenSpecs
- FlowSpec
- Phase 2 Concept
- Component Composition
- Component Usage
- Review UI
- Visual Review

移行調査時点で、Phase 1 PackageとFlowSpecが参照する4 ScreenSpecファイルが存在しないことが判明した。既存のFlow、Phase 1 Design Brief、承認済みDirectionに基づいて4件を復元し、Phase 1とFlowSpecの参照先存在確認をsystem validationへ追加した。

## Safe placement

Legacy成果物には後続工程の情報が多く含まれるが、新workflowの必須条件を満たしたことにはしない。安全な配置は`created`である。

次の`project_inspected`へ進むにはM1 Project Inspectorによる現在のProject Contextが必要である。その後、既存成果物をEvidenceとして再利用しながら以下を新contractへ変換する。

- Stable requirement IDと明示的なRequirement Allocation
- Screen Responsibilityと`notResponsibleFor`
- Library非依存Capability Plan
- Adapter identityとproject-first resolution provenance
- Tabletを含むbrowser task/state/accessibility quality evidence
- Source layerへ戻るStructured FeedbackとRepair Plan
- Cross-artifact Generation Report

この配置により、過去の設計判断と成果物は失わず、現在のResearch Gate、Human Gate、Adapter、品質要件を迂回しない。
