# Testing

## Iteration record
- Build version: v15.0.0
- Test date: 2026-04-03
- Primary environment: containerized local build workspace
- Local HTTP port used for integration checks: 8065
- Scope: module validation, scenario loading, learner-flow integrity, small-screen shell checks, mission-jump and reading-order markup, local HTTP integration, syntax checks, file completeness

## Test cases

| ID | Area | Expected result | Actual result | Status | Notes / evidence |
|---|---|---|---|---|---|
| T01 | Module tests | Core actions, loader, scenario validation, scoring, debrief building, external-analysis logic, launcher filtering, and learner-flow assertions should pass. | `module_test.mjs` passed. | Pass | See `project-documents/test-artifacts/module_test_output.txt`. |
| T02 | Scenario registry | Registry should declare 2 packs and the loader should flatten all scenarios correctly. | Registry validated and loader returned 6 scenarios across 2 packs. | Pass | Verified in `module_test.mjs`. |
| T03 | Learner flow state | Starting, resetting, and completing a mission should move the in-memory run state correctly. | Action tests passed for start, reset, and complete transitions. | Pass | Covered in `module_test.mjs`. |
| T04 | Small-screen learner shell | The source should contain the v15 mission-flow note, sticky mission-jump shell, and phone reading-order hooks. | Assertions passed for mission-flow note, jump intro, sticky mission-jump CSS, and baseline-before-candidate mobile ordering hooks. | Pass | Verified in `module_test.mjs`. |
| T05 | Local HTTP integration | Main pages, registry/pack files, CSS, and main JS modules should return HTTP 200 and non-empty content. | Integration checks passed at local port 8065. | Pass | See `integration_test_output.txt` and `http_checks.txt`. |
| T06 | Versioning | Code should identify the current build version and should not expose removed persistence or verification subsystems. | `store.js` exposes `v15.0.0` and no run-persistence storage-key family or verification page was found. | Pass | Verified in `integration_test.mjs`. |
| T07 | Syntax checks | Updated JavaScript files should parse without syntax errors. | `node --check` passed for the updated JS modules. | Pass | See `syntax_checks.txt`. |
| T08 | File completeness | Required app/docs/data files should exist and removed build-only files should remain absent. | Required files present; removed files absent. | Pass | See `required_file_check.txt` and `file_inventory.txt`. |

## Smoke summary
The v15.0.0 package is executable and continuation-ready at the file, module, and local HTTP levels. The main verified outcome for this iteration is a more readable small-screen learner shell with clearer mission flow and better section navigation support.

## Release-readiness statement
This build is acceptable as the new baseline for the next iteration.

## Unresolved defects / follow-up tests
1. Run normal browser UX and accessibility checks on Windows and GitHub Pages.
2. Continue tuning the small-screen experience after real learner feedback is captured outside this container.
