export const EXTENSIONS = {
  hr: {
    id: "hr_optional_branch",
    title: "Accommodation review and retention tightening",
    intro: "This optional branch tests whether the workflow can stay useful when accommodation-related detail appears and retention expectations become stricter.",
    summary: "Push the HR workflow through a narrower governance path without turning it into a dead-end tool.",
    steps: [
      {
        id: "accommodation_trigger",
        title: "Accommodation trigger handling",
        issue: "A manager pastes accommodation-related detail and asks whether the employee will likely qualify.",
        whyItMatters: "The assistant should separate policy explanation from case adjudication and specialist review.",
        evidence: [
          "The request now includes protected medical or accommodation detail.",
          "The manager wants a probable determination, not just policy guidance."
        ],
        options: [
          {
            id: "route_specialist",
            label: "Explain policy limits and route to HR specialist review",
            summary: "Provide policy-safe drafting support only, then hand the judgment step to HR.",
            deltas: { readiness: 6, exposureRisk: -8, trustSafety: 7, governance: 7, maintainability: 3, rolloutConfidence: 4 },
            coaching: "This preserves usefulness while preventing the workflow from acting like an adjudicator.",
            consequence: "The workflow stays helpful without claiming authority it does not have."
          },
          {
            id: "predict_outcome",
            label: "Predict likely qualification outcome",
            summary: "Keep the reply highly helpful by estimating how HR will probably decide.",
            deltas: { readiness: -5, exposureRisk: 4, trustSafety: -7, governance: -7, maintainability: -2, rolloutConfidence: -4 },
            coaching: "This looks helpful, but it blurs policy explanation and case determination in a protected context.",
            consequence: "The workflow starts making sensitive case judgments it is not meant to own."
          }
        ]
      },
      {
        id: "retention_narrowing",
        title: "Retention and audit tightening",
        issue: "Troubleshooting has been keeping raw copied employee text for 90 days.",
        whyItMatters: "Minimum viable auditability should support review without creating a second uncontrolled record.",
        evidence: [
          "Support wants full text in logs for future investigation.",
          "The workflow already stores document IDs and timestamps."
        ],
        options: [
          {
            id: "metadata_plus_excerpt",
            label: "Keep metadata and redacted excerpts only",
            summary: "Retain event IDs, timestamps, policy packet version, and tightly redacted snippets when needed.",
            deltas: { readiness: 5, exposureRisk: -7, trustSafety: 3, governance: 6, maintainability: 4, rolloutConfidence: 3 },
            coaching: "You still support auditability, but with a far smaller privacy surface.",
            consequence: "Later review can reconstruct the workflow without retaining raw protected narratives."
          },
          {
            id: "fulltext_90d",
            label: "Keep full-text logs for 90 days",
            summary: "Preserve everything so troubleshooting never lacks context.",
            deltas: { readiness: -4, exposureRisk: 8, trustSafety: -2, governance: -6, maintainability: -1, rolloutConfidence: -4 },
            coaching: "This solves for convenience by expanding retention risk.",
            consequence: "Troubleshooting becomes easier, but governance exposure expands materially."
          }
        ]
      },
      {
        id: "fallback_message",
        title: "Fail-safe user experience",
        issue: "When the workflow cannot continue, the current draft simply says it cannot proceed.",
        whyItMatters: "Strong refusals and escalations preserve trust by explaining the limit and the next correct path.",
        evidence: [
          "Managers need to know when the workflow stopped because specialist review is required.",
          "Vague dead-end messages encourage unsafe workaround behavior."
        ],
        options: [
          {
            id: "clear_escalation",
            label: "Use a clear escalation message with a safe next step",
            summary: "Say why specialist review is needed and direct the manager to the approved HR path.",
            deltas: { readiness: 4, exposureRisk: -3, trustSafety: 6, governance: 5, maintainability: 2, rolloutConfidence: 3 },
            coaching: "This is conservative without becoming opaque or frustrating.",
            consequence: "Users see the workflow as controlled rather than mysteriously blocked."
          },
          {
            id: "generic_stop",
            label: "Use a generic stop message",
            summary: "Keep the fallback short and non-specific so the assistant does not say too much.",
            deltas: { readiness: -3, exposureRisk: 1, trustSafety: -5, governance: -3, maintainability: 0, rolloutConfidence: -2 },
            coaching: "The system becomes safer in one narrow sense but less usable and less trustworthy overall.",
            consequence: "Managers may bypass the workflow because the handoff feels confusing and abrupt."
          }
        ]
      },
      {
        id: "specialist_owner",
        title: "Ownership and handoff record",
        issue: "The escalation path exists, but no explicit owner receives the handoff packet or confirms follow-through.",
        whyItMatters: "Enterprise escalation is stronger when ownership and minimum viable evidence are visible instead of implied.",
        evidence: [
          "Managers need to know who owns the case after the workflow stops.",
          "The current prototype sends a generic note without packet version or escalation owner."
        ],
        options: [
          {
            id: "named_owner_packet",
            label: "Name the specialist owner and include a minimal review packet",
            summary: "Route the case to the correct HR queue with policy packet version, timestamps, and redacted context summary.",
            deltas: { readiness: 5, exposureRisk: -2, trustSafety: 4, governance: 7, maintainability: 4, rolloutConfidence: 4 },
            coaching: "This turns escalation into an operational handoff instead of an abandoned draft.",
            consequence: "The workflow stops cleanly and the next team can act without requesting raw sensitive text again."
          },
          {
            id: "owner_unspecified",
            label: "Leave ownership implicit and rely on general queue pickup",
            summary: "Assume someone in HR will see the issue eventually without changing the escalation message.",
            deltas: { readiness: -4, exposureRisk: 1, trustSafety: -2, governance: -6, maintainability: -3, rolloutConfidence: -4 },
            coaching: "The workflow now escalates in theory but not with enough operational clarity to support repeatable enterprise use.",
            consequence: "Cases can stall because the system stops without a visible owner or review packet."
          }
        ]
      }
    ]
  },
  support: {
    id: "support_optional_branch",
    title: "Escalation pressure and post-call moderation",
    intro: "This optional branch tests the workflow when a frustrated user pushes for unauthorized account detail and the response draft risks saying too much.",
    summary: "Keep the support assistant calm, brand-safe, and policy-tight under user pressure.",
    steps: [
      {
        id: "user_pressure",
        title: "High-pressure account request",
        issue: "A user insists that support should reveal account details immediately because they are angry and in a hurry.",
        whyItMatters: "A refusal should remain professional, boundary-aware, and action-oriented even when the user is pressuring the system.",
        evidence: [
          "The current session lacks verified authorization for the requested details.",
          "The user is escalating emotionally and demanding an exception."
        ],
        options: [
          {
            id: "verify_then_help",
            label: "Refuse disclosure and direct the user to verification steps",
            summary: "Hold the boundary, explain the limit, and give the fastest approved next step.",
            deltas: { readiness: 6, exposureRisk: -7, trustSafety: 7, governance: 6, maintainability: 2, rolloutConfidence: 4 },
            coaching: "This keeps the experience usable without weakening account-protection rules.",
            consequence: "The refusal remains brand-safe and reduces the chance of pressure-driven exception handling."
          },
          {
            id: "partial_detail",
            label: "Reveal a few details to calm the user",
            summary: "Offer partial account information to appear accommodating in the moment.",
            deltas: { readiness: -6, exposureRisk: 9, trustSafety: -5, governance: -8, maintainability: -2, rolloutConfidence: -5 },
            coaching: "Pressure is exactly when the workflow should become more disciplined, not less.",
            consequence: "The assistant now encourages unauthorized disclosure under emotional pressure."
          }
        ]
      },
      {
        id: "post_call_check",
        title: "Post-call moderation review",
        issue: "A draft answer sounds polite but still includes unsupported service-credit language.",
        whyItMatters: "Post-call controls catch what in-call guidance can miss.",
        evidence: [
          "The knowledge base allows acknowledgement, not compensation promises.",
          "The current prototype performs no post-call review on drafted replies."
        ],
        options: [
          {
            id: "promise_filter",
            label: "Add a post-call compensation and disclosure filter",
            summary: "Review the draft for account disclosure, unsupported promises, and escalation wording before release.",
            deltas: { readiness: 5, exposureRisk: -4, trustSafety: 6, governance: 6, maintainability: 3, rolloutConfidence: 4 },
            coaching: "This turns moderation into a workflow step rather than a vague aspiration.",
            consequence: "The assistant stops releasing polite-but-risky drafts that still violate policy."
          },
          {
            id: "trust_in_prompt",
            label: "Trust the prompt and skip post-call review",
            summary: "Assume the in-call instructions will be enough for normal support use.",
            deltas: { readiness: -4, exposureRisk: 3, trustSafety: -5, governance: -6, maintainability: -1, rolloutConfidence: -3 },
            coaching: "Helpful wording alone does not guarantee policy-safe output.",
            consequence: "Risky replies can slip through because there is no last-stage check."
          }
        ]
      },
      {
        id: "escalation_copy",
        title: "Escalation language under pressure",
        issue: "When support cannot complete the request, the escalation wording currently sounds cold and procedural.",
        whyItMatters: "Brand tone should support trust without weakening security or policy boundaries.",
        evidence: [
          "Users interpret abrupt escalations as the company refusing to help.",
          "Support wants language that is warm but not permissive."
        ],
        options: [
          {
            id: "warm_boundary",
            label: "Use warm, explicit escalation language",
            summary: "Acknowledge the issue, explain the boundary, and direct the user to the correct channel.",
            deltas: { readiness: 4, exposureRisk: -2, trustSafety: 6, governance: 4, maintainability: 2, rolloutConfidence: 3 },
            coaching: "Tone can preserve trust when the workflow must still hold a firm line.",
            consequence: "Escalations feel controlled and helpful rather than dismissive."
          },
          {
            id: "abrupt_policy",
            label: "Use a short policy-only escalation message",
            summary: "Keep it brief and rule-focused without additional guidance.",
            deltas: { readiness: -3, exposureRisk: 0, trustSafety: -4, governance: -2, maintainability: 0, rolloutConfidence: -2 },
            coaching: "The boundary remains, but the experience becomes colder and more likely to drive channel-hopping.",
            consequence: "Users see a block, not a controlled next step."
          }
        ]
      },
      {
        id: "incident_sampling",
        title: "Monitoring and sampled review",
        issue: "The support team wants to trust the improved branch but has not defined what to monitor after launch.",
        whyItMatters: "A safer support workflow still needs thresholds for disclosure risk, dissatisfaction, and escalation quality after release.",
        evidence: [
          "Support can review a small weekly sample of drafted responses.",
          "No one has agreed which signals would trigger copy changes or rollback."
        ],
        options: [
          {
            id: "sample_and_thresholds",
            label: "Set weekly sample audits and rollback triggers",
            summary: "Track unauthorized-disclosure flags, escalation dissatisfaction, and unsupported promise rates with named reviewers.",
            deltas: { readiness: 5, exposureRisk: -2, trustSafety: 4, governance: 7, maintainability: 4, rolloutConfidence: 5 },
            coaching: "Monitoring turns good prompt behavior into maintained operational behavior.",
            consequence: "The support assistant can now be corrected before drift becomes a customer-facing incident."
          },
          {
            id: "launch_without_sampling",
            label: "Launch without sampled review",
            summary: "Assume the stronger branch will stay stable once the wording feels right.",
            deltas: { readiness: -4, exposureRisk: 1, trustSafety: -3, governance: -6, maintainability: -3, rolloutConfidence: -4 },
            coaching: "The branch looks better, but the enterprise workflow still lacks a maintenance discipline.",
            consequence: "Support loses the early warning system that would catch disclosure or tone drift."
          }
        ]
      }
    ]
  },
  finance: {
    id: "finance_optional_branch",
    title: "Latency, routing drift, and controlled rollback",
    intro: "This optional branch tests the finance assistant after context growth and routing drift begin slowing the workflow and creating uneven behavior.",
    summary: "Improve speed and release discipline without sacrificing grounded finance guidance.",
    steps: [
      {
        id: "context_growth",
        title: "Context growth response",
        issue: "A recent update added more policy text, more history, and broader retrieval. Latency is now rising noticeably.",
        whyItMatters: "More context is not free. Token budgets and evidence discipline are operational design choices.",
        evidence: [
          "The workflow now includes duplicate guidance and stale history.",
          "Users are complaining that routine answers feel slower and more verbose."
        ],
        options: [
          {
            id: "trim_and_summarize",
            label: "Trim duplicate rules and summarize stale history",
            summary: "Keep only the decisive finance policy blocks and the smallest support evidence set.",
            deltas: { readiness: 6, exposureRisk: -3, trustSafety: 4, governance: 4, maintainability: 6, rolloutConfidence: 5 },
            coaching: "A leaner package is usually easier to review, faster to run, and clearer to maintain.",
            consequence: "Latency drops while the evidence trail becomes more understandable."
          },
          {
            id: "keep_everything",
            label: "Keep the larger context to avoid losing coverage",
            summary: "Accept slower answers in exchange for feeling more comprehensive.",
            deltas: { readiness: -5, exposureRisk: 1, trustSafety: -2, governance: -2, maintainability: -6, rolloutConfidence: -5 },
            coaching: "Coverage feels safer, but hidden bloat reduces interpretability and operating discipline.",
            consequence: "The workflow keeps slowing down and becomes harder to evaluate after each change."
          }
        ]
      },
      {
        id: "routing_split",
        title: "Routing by complexity",
        issue: "Simple reimbursement questions and edge-case interpretations are currently using the same heavy path.",
        whyItMatters: "Complexity-based routing protects cost and latency without forcing the safest path on every request.",
        evidence: [
          "Most finance questions are routine policy lookups.",
          "A smaller set of cases require stronger review and escalation."
        ],
        options: [
          {
            id: "tiered_routing",
            label: "Split routine and high-consequence paths",
            summary: "Route routine questions through a lean path and reserve the heavy path for ambiguous or approval-shaping cases.",
            deltas: { readiness: 5, exposureRisk: -2, trustSafety: 4, governance: 5, maintainability: 5, rolloutConfidence: 4 },
            coaching: "Routing is part of enterprise design, not just an implementation detail.",
            consequence: "The workflow becomes faster on common cases while preserving discipline on sensitive ones."
          },
          {
            id: "single_heavy_path",
            label: "Use the same heavy path for every request",
            summary: "Avoid routing complexity by sending all finance requests through the strongest model path.",
            deltas: { readiness: -4, exposureRisk: 0, trustSafety: 1, governance: -2, maintainability: -4, rolloutConfidence: -3 },
            coaching: "Uniformity sounds simpler, but it wastes latency budget and hides where special handling is actually needed.",
            consequence: "Routine work pays the cost of the heaviest path without added learning value."
          }
        ]
      },
      {
        id: "rollback_threshold",
        title: "Rollback threshold and release response",
        issue: "The team wants to keep the recent update because users like the tone, even though latency and reviewer disagreement are rising.",
        whyItMatters: "A governed release needs explicit thresholds and a real rollback owner.",
        evidence: [
          "Quality feedback improved, but latency and disagreement are both trending upward.",
          "No written threshold currently triggers a staged rollback or freeze."
        ],
        options: [
          {
            id: "define_threshold",
            label: "Define rollback thresholds and freeze until retest",
            summary: "Document the trigger, assign the owner, and move back to the last safe version if thresholds are crossed.",
            deltas: { readiness: 5, exposureRisk: -1, trustSafety: 3, governance: 7, maintainability: 4, rolloutConfidence: 7 },
            coaching: "This is slower in the moment, but much stronger operationally.",
            consequence: "The team now has a clear back-off plan instead of debating under pressure."
          },
          {
            id: "watch_and_wait",
            label: "Watch the trend informally and avoid rollback for now",
            summary: "Keep the new release live while the team gathers more anecdotal feedback.",
            deltas: { readiness: -5, exposureRisk: 1, trustSafety: -2, governance: -7, maintainability: -3, rolloutConfidence: -6 },
            coaching: "This delays a hard decision, but it also delays operational control.",
            consequence: "The workflow drifts without a clear threshold for intervention."
          }
        ]
      },
      {
        id: "release_record",
        title: "Release record and ownership clarity",
        issue: "The prompt text changed, routing changed, and the source set changed, but the team only documented the prompt wording.",
        whyItMatters: "A release record is incomplete if it cannot reconstruct the operating state that was actually deployed.",
        evidence: [
          "Finance reviewers need to know which model, source set, and rollback owner were active.",
          "The current release note tracks only the tone improvement request."
        ],
        options: [
          {
            id: "full_release_record",
            label: "Record model, source set, thresholds, and rollback owner",
            summary: "Treat the update as a governed operational release, not just a prompt tweak.",
            deltas: { readiness: 4, exposureRisk: -1, trustSafety: 2, governance: 7, maintainability: 6, rolloutConfidence: 5 },
            coaching: "This creates institutional memory instead of relying on the team to remember what changed.",
            consequence: "Future reviewers can reconstruct the finance workflow without guessing which configuration shipped."
          },
          {
            id: "prompt_only_record",
            label: "Record only the prompt wording change",
            summary: "Keep documentation lightweight by omitting routing, source, and rollback details.",
            deltas: { readiness: -3, exposureRisk: 0, trustSafety: -1, governance: -6, maintainability: -5, rolloutConfidence: -4 },
            coaching: "This feels efficient now, but it weakens later diagnosis and rollback discipline.",
            consequence: "The team cannot fully explain the deployed finance configuration when behavior drifts."
          }
        ]
      }
    ]
  }
};
