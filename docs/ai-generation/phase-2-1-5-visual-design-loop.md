# Meridian Visual Design Loop — Phase 2.1.5 P0

Status: Implemented — awaiting Human pairwise comparison
Pilot: Team Invitation
Date: 2026-07-14

## Outcome

P0 adds a visual quality loop above the Component Harness. The Harness continues to protect Contract, Component, Token, provenance, and accessibility boundaries. The Visual Design Loop compares structurally different valid compositions and records which one humans prefer.

```text
Design Brief
    ↓
Reference Retrieval → Principles → 3 Design Strategies
    ↓
Meridian Grounding + Baseline
    ↓
Official Meridian Runtime
    ↓
Desktop / Mobile render captures
    ↓
Screenshot-grounded visual critique
    ↓
Maximum 2 repair rounds
    ↓
Provisional quality gate
    ↓
Human pairwise comparison
```

Provisional scores cannot approve a design. The final status remains `awaiting-human-comparison` until a reviewer records pairwise decisions.

## P0 artifacts

- Visual Quality Rubric: `design/visual-quality-rubric.json`
- Candidate source: `examples/phase-2/team-invitation.visual-candidates.json`
- Design Intelligence flow: `docs/ai-generation/phase-2-2-design-intelligence-loop.md`
- Screenshot-grounded critique: `examples/phase-2/team-invitation.visual-critique.json`
- Generated report: `examples/generated/team-invitation.visual-review.json`
- Human comparison schema: `schemas/visual-pairwise-review.schema.json`
- Render capture manifest: `examples/generated/visual-review/manifest.json`
- Desktop and Mobile captures: `examples/generated/visual-review/*.png`
- Interactive review: `examples/generated/team-invitation.phase2.html`

## Candidate set

| ID | Purpose |
|---|---|
| `baseline` | Preserve the previous equal-card layout as the control |
| `task-focus` | Make invitation editing the dominant task and compress capacity context |
| `context-aside` | Keep capacity context visible without placing it in the main task flow |
| `guided-flow` | Emphasize Edit, Review, and Result as a three-stage flow |

All candidates use the same Design Brief, scenarios, Component Composition, HTML Runtime, and business rules. The comparison changes hierarchy and layout, not product capability.

## Quality gate

The Rubric has nine weighted criteria totaling 100 points. Scores are read from the digest-linked Desktop and Mobile critique, not from the candidate's pre-render hypothesis. A candidate provisionally passes when:

- weighted score is at least 76;
- the final repair round has no major findings;
- the generated artifacts and Component Harness checks pass.

Human comparison is still mandatory. The provisional preference is a recommendation for review order, not approval.

## Screenshot provenance

`npm run capture:visual` renders every candidate at Desktop and Mobile sizes. The capture manifest stores path, width, height, and SHA-256 digest for every image. The critique stores those same paths and digests, so CI prevents it from silently referring to a different render.

The command requires Playwright. In the Codex workspace runtime it can be run with the bundled Node dependency path exposed through `NODE_PATH`.

## Human review procedure

1. Open the generated Phase 2 HTML.
2. Select candidates with `Design candidate`.
3. Check the same scenario and viewport for both sides of a comparison.
4. Record a winner and a concrete Rubric-based reason.
5. Complete all six candidate pairs, including each candidate against Baseline.
6. Export `Visual Review JSON`.

The export ranks candidates by pairwise wins. A unique leader is `decision-ready`. A tie or preference cycle is `additional-comparison-required` and cannot be promoted without an explicit follow-up comparison.

The winning design can be promoted only after the exported comparison record is approved and imported into the Feedback Harness.
