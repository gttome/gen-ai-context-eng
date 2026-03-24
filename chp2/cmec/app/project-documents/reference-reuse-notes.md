# Reference Reuse Notes

## What was reused conceptually from the uploaded sources

### From the CEMC planning pack
- learner-first mission-control framing
- guided short-session experience model
- scenario-driven structure
- prediction → repair → compare → debrief loop
- restrained, professional gamification
- compare-first teaching value
- optional Explore More branch
- manual external-LLM support

### From the CEMC technical blueprint
- content-driven architecture
- proposed static file/folder shape
- semantic action model
- dedicated metrics layer
- lightweight local persistence
- mobile-first responsiveness
- compare and chart surfaces as educational renderers

### From the Lifecycle Navigator Studio blueprint
- reusable architectural discipline
- state/domain/metrics/UI separation
- no-silent-update principle
- chart/rendering guidance
- continuation-ready packaging mindset

## What was intentionally not reused
- Chapter 2 lifecycle-specific terminology or workflow framing
- builder-style artifact creation expectations
- broader phase-based app behavior that would pull the learner away from Chapter 1 foundations

## Adapted patterns
- scenario-pack structure was adapted from the uploaded CEMC planning documents into three Chapter 1 missions
- chart guidance was narrowed to a smaller, clearer set of visuals
- persistence guidance was implemented lightly rather than in a more advanced schema-evolution model
- compare guidance was extended into rule-based causality summaries rather than a heavier explanation subsystem
- Explore More was adapted into scenario-specific micro-drills rather than a much larger branching architecture

## Anti-cargo-cult note
The build did not copy Lifecycle Navigator Studio behaviors just because they existed. Architecture patterns were reused where they improved maintainability or teaching clarity, while product meaning remained tied to Chapter 1 and the uploaded CEMC pack.
