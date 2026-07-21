# Meridian Design Intelligence Loop — Phase 2.2

Status: Implemented for Team Invitation pilot
Date: 2026-07-14

## Outcome

Phase 2.2 makes the reasoning between the approved Design Brief and visual generation explicit and testable.

```text
Approved Task Evidence
    ↓
Reference Retrieval + provenance
    ↓
Screen-specific Principle Extraction
    ↓
3 distinct Design Strategies
    ↓
Meridian Grounding
    ↓
Registered Component composition
    ↓
Desktop / Mobile capture
    ↓
Screenshot-grounded Critique
    ↓
Human pairwise decision
```

The three generated alternatives must differ by task model, not only by cards, spacing, or color. A strategy that needs an unregistered Component becomes `proposal-required`; the generator cannot silently invent it.

## Artifacts

- Reference manifest: `research/references/team-invitation/manifest.json`
- Captured public evidence: `research/references/team-invitation/screenshots/*.png`
- Screen principles: `research/principles/team-invitation.principles.json`
- Design strategies: `examples/phase-2/team-invitation.design-strategies.json`
- Generated grounding report: `examples/generated/team-invitation.grounding.json`
- Screenshot critique: `examples/phase-2/team-invitation.visual-critique.json`
- Generated review report: `examples/generated/team-invitation.visual-review.json`

## Evidence boundary

The current GitHub, Slack, and Notion captures are public official-documentation pages. They support product rules, terminology, task conditions, and provenance. They are not represented as authenticated product-screen captures and therefore do not prove the products' detailed visual hierarchy or keyboard behavior.

Each extracted principle contains:

- an observed fact;
- the conditional design principle inferred from it;
- the Team Invitation application;
- confidence;
- evidence references.

This boundary prevents visual imitation and unsupported claims. Reference content informs a reusable principle; Meridian Contracts and Tokens still determine the implementation.

## CI gates

System validation blocks the Phase 2 concept when:

- a reference capture is missing or its digest or dimensions changed;
- a principle points to unknown evidence;
- strategies reuse the same task model;
- a candidate points to an unknown strategy or principle;
- a required Component is absent from the Registry;
- the generated grounding report is stale;
- visual critique omits a candidate, viewport, or Rubric criterion;
- critique evidence no longer matches the capture manifest;
- generated review scores do not match screenshot-grounded critique.

The AI critique is advisory. Human pairwise review remains required before a design can be approved or fed back into the system of record.
