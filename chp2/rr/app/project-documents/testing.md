# Testing — Rubric Runner Lab v1.5.1.0

- Build: rr-lab-v1.5.1.0
- Environment tested: container local filesystem, Node 22 module execution, static asset inspection
- Browser validation status: **Blocked in this environment** because Chromium displays an organization policy block screen for both `localhost` and `file://` navigation
- Test scope: new scenario data, scenario-specific coaching render paths, change-coaching render paths, takeaway teaching point, optional learning-check detail rendering, version string updates, static file integrity

## Smoke summary
- Status: **Partial Pass**
- Reason: the application package and local interaction logic checks passed, but true browser click-through testing could not be completed inside this environment because browser navigation to local targets is blocked.
- Acceptable for next iteration: **Yes**, with the explicit recommendation that a human run phone and desktop click-through tests outside this container.

## Executed tests

| ID | Test | Expected result | Actual result | Status | Notes |
|---|---|---|---|---|---|
| T-01 | Scenario set expands to five scenarios | App data should expose 5 scenarios | Logic check reported `5` scenarios | Pass | See `project-documents/test-artifacts/rr_lab_v1_5_logic_results.json` |
| T-02 | New rollout scenario data loads | Rollout scenario should be present with rubric, cases, changes, and coaching | Present in app data and logic run | Pass | Scenario id `change-rollout-notice` |
| T-03 | New handoff scenario data loads | Handoff scenario should be present with rubric, cases, changes, and coaching | Present in app data and logic run | Pass | Scenario id `cross-team-handoff-summary` |
| T-04 | Diagnosis step shows scenario-specific coaching | Diagnosis render should include the upstream-phase teaching note after a tag exists | Rollout diagnosis render included coaching note | Pass | `diagnosisHasCoach = True` |
| T-05 | Change step shows scenario-specific coaching | Selected change card should include lifecycle-linked explanation | Rollout change render included lifecycle coaching | Pass | `changeHasCoach = True` |
| T-06 | Takeaway includes scenario-specific teaching point | Takeaway panel should summarize the learning in scenario-specific terms | Rollout and handoff takeaway renders included the teaching point | Pass | `takeawayHasTeachingPoint = True` |
| T-07 | Optional learning checks render scenario-specific detail | Explore More detail should reflect the selected scenario and option | Rollout, handoff, and policy explore renders included scenario detail | Pass | `exploreHasScenarioDetail = True` |
| T-08 | Coach message reflects new scenario coaching | Coach text should mention scenario-specific guidance after the path advances | Logic runs returned populated coach messages for rollout, handoff, and policy | Pass | See logic results JSON |
| T-09 | Main HTML updates reflect expanded scenario count | Hero should reference 5 scenarios | Static file updated | Pass | `index.html` updated |
| T-10 | Browser click-through on local/file targets | Browser should open the local app and allow interaction | Chromium blocked navigation with organization policy screen | Blocked | Evidence note saved in `project-documents/test-artifacts/rr_lab_v1_5_browser_block_note.txt` |

## Unresolved follow-up tests
- Desktop manual click-through in a normal browser outside this environment
- Phone-width manual tap/scroll validation outside this environment
- Theme, help, and feedback page spot-check on a real local run


## v1.5.1 UI adjustment
- Pass — Finish scoring and continue button moved from the scoring panel header to the bottom call-to-action area so the learner can finish the section without scrolling back upward.
