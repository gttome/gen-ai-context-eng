export const APP_CONFIG = {
  "appName": "Enterprise Readiness Navigator",
  "version": "v0.3.1",
  "buildId": "ern-i13-userfocus-v14",
  "laneOrder": [
    "data_handling",
    "policy_refusal",
    "safety_moderation",
    "trust_security",
    "performance_routing",
    "governed_releases",
    "monitoring_governance",
    "fail_safe_behavior"
  ],
  "laneNames": {
    "data_handling": "Data Handling",
    "policy_refusal": "Policy & Refusal",
    "safety_moderation": "Safety & Moderation",
    "trust_security": "Trust Boundaries & Security",
    "performance_routing": "Performance & Routing",
    "governed_releases": "Governed Releases",
    "monitoring_governance": "Monitoring & Governance",
    "fail_safe_behavior": "Fail-safe Behavior"
  },
  "metrics": [
    {
      "id": "readiness",
      "label": "Operational Readiness",
      "goodDirection": "up"
    },
    {
      "id": "exposureRisk",
      "label": "Exposure Risk",
      "goodDirection": "down"
    },
    {
      "id": "trustSafety",
      "label": "Trust & User Safety",
      "goodDirection": "up"
    },
    {
      "id": "governance",
      "label": "Governance Completeness",
      "goodDirection": "up"
    },
    {
      "id": "maintainability",
      "label": "Maintainability",
      "goodDirection": "up"
    },
    {
      "id": "rolloutConfidence",
      "label": "Rollout Confidence",
      "goodDirection": "up"
    }
  ],
  "completionTarget": 8,
  "storageKeys": {
    "missionState": "ern_i13_state",
    "history": "ern_i13_history",
    "theme": "app_theme"
  }
};

export const GLOSSARY = [
  {
    "term": "Need-to-know",
    "definition": "Include only the smallest evidence package necessary for the task."
  },
  {
    "term": "Policy block",
    "definition": "A reusable instruction layer that states enterprise rules, limits, tone, and refusal expectations."
  },
  {
    "term": "Prompt injection",
    "definition": "Untrusted content attempting to override trusted instructions or expose restricted information."
  },
  {
    "term": "Regression set",
    "definition": "A representative set of cases used to verify that a release did not break acceptable behavior."
  },
  {
    "term": "Rollback",
    "definition": "A planned return to the previous safe configuration when metrics or audits show degradation."
  },
  {
    "term": "Graceful degradation",
    "definition": "A conservative fallback mode when normal operation is unclear, unsafe, or unavailable."
  }
];

export const COACH_MODES = {
  learn: {
    id: "learn",
    label: "Guided Path",
    noticeLead: "Start with the clearest signal in this lane.",
    signalLead: "Strong move:",
    watchLead: "Easy-to-miss risk:",
    questionLead: "Think about this:",
    assistLead: "Helpful hint:"
  },
  analyst: {
    id: "analyst",
    label: "Independent Path",
    noticeLead: "Read this lane as an operating decision, not a wording preference.",
    signalLead: "What stands out:",
    watchLead: "Operational tension:",
    questionLead: "Reason through this:",
    assistLead: "Helpful hint:"
  },
  challenge: {
    id: "challenge",
    label: "Challenge Path",
    noticeLead: "Assume the workflow will be reused under pressure and judged by its weakest control.",
    signalLead: "Challenge signal:",
    watchLead: "Failure pressure:",
    questionLead: "Challenge question:",
    assistLead: "Helpful hint:"
  },
  workshop: {
    id: "workshop",
    label: "Group Path",
    noticeLead: "Use this when you want to talk through the lane with other learners.",
    signalLead: "Group focus:",
    watchLead: "Group risk:",
    questionLead: "Discuss this:",
    assistLead: "Helpful hint:"
  }
};

export const SCENARIO_DRAMA = {
  hr: {
    sponsor: {
      title: "HR sponsor pressure",
      pending: "The HR sponsor wants {lane} to stay fast enough for manager adoption.",
      positive: "The HR sponsor sees {lane} becoming easier to defend in pilot rollout.",
      negative: "The HR sponsor likes the speed, but {lane} now looks harder to defend under review."
    },
    compliance: {
      title: "Compliance concern",
      pending: "Compliance is already watching {lane} because copied employee detail can quietly expand scope.",
      positive: "Compliance would likely accept {lane} because the workflow is narrowing exposure deliberately.",
      negative: "Compliance would likely challenge {lane} because sensitive detail is still too exposed or poorly justified."
    },
    security: {
      title: "Security note",
      pending: "Security wants {lane} to preserve clear trust boundaries before rollout expands.",
      positive: "Security would see {lane} as easier to reason about if an incident review were needed.",
      negative: "Security would flag {lane} because the workflow still mixes trusted logic with risky operational shortcuts."
    },
    reviewer: {
      title: "Governance reviewer",
      pending: "The review board is waiting to see whether {lane} becomes a clear blocker or a clear strength.",
      positive: "A governance reviewer would likely score {lane} as a stabilizing control.",
      negative: "A governance reviewer would likely call {lane} out as a launch blocker."
    },
    ops: {
      title: "Operations reaction",
      pending: "Operations wants {lane} to reduce rework, not create new escalation confusion.",
      positive: "Operations would likely trust {lane} more because downstream triage becomes clearer.",
      negative: "Operations would likely push back because {lane} still creates cleanup and escalation ambiguity."
    }
  },
  support: {
    sponsor: {
      title: "Support lead pressure",
      pending: "The support lead wants {lane} to stay fast without creating policy drift.",
      positive: "The support lead sees {lane} becoming safer to pilot at scale.",
      negative: "The support lead likes the tone, but {lane} still risks exception creep and rework."
    },
    compliance: {
      title: "Authorization concern",
      pending: "Compliance is watching {lane} because authorization mistakes are visible to customers quickly.",
      positive: "Compliance would likely approve {lane} because the workflow is making boundaries more explicit.",
      negative: "Compliance would likely reject {lane} because the boundary is still too soft or inconsistent."
    },
    security: {
      title: "Security note",
      pending: "Security wants {lane} to resist manipulative customer content and account-detail leakage.",
      positive: "Security would see {lane} as reducing the chance of customer-driven instruction drift.",
      negative: "Security would likely flag {lane} because untrusted text can still distort the workflow."
    },
    reviewer: {
      title: "Service review board",
      pending: "The service review board is looking for whichever lane still turns helpfulness into hidden risk.",
      positive: "The review board would likely see {lane} as a meaningful readiness gain.",
      negative: "The review board would likely see {lane} as a customer-facing liability."
    },
    ops: {
      title: "Operations reaction",
      pending: "Operations wants {lane} to reduce complaint handling, not increase it.",
      positive: "Operations would likely trust {lane} more because edge cases are becoming easier to route cleanly.",
      negative: "Operations would likely push back because {lane} still creates more manual recovery work."
    }
  },
  finance: {
    sponsor: {
      title: "Finance sponsor pressure",
      pending: "The finance sponsor wants {lane} to improve usability without weakening policy control.",
      positive: "The finance sponsor sees {lane} becoming more launchable without losing discipline.",
      negative: "The finance sponsor sees short-term usability, but {lane} still looks too fragile for broad release."
    },
    compliance: {
      title: "Finance compliance concern",
      pending: "Compliance is watching {lane} because reimbursement guidance can quietly become approval-like language.",
      positive: "Compliance would likely support {lane} because the workflow is keeping clearer operational boundaries.",
      negative: "Compliance would likely challenge {lane} because the workflow still overreaches or overexposes policy detail."
    },
    security: {
      title: "Security note",
      pending: "Security wants {lane} to preserve clear source and authority boundaries before rollout expands.",
      positive: "Security would see {lane} as narrowing unnecessary trust and access assumptions.",
      negative: "Security would likely flag {lane} because the workflow still treats too much internal material as safe by default."
    },
    reviewer: {
      title: "Release reviewer",
      pending: "The release reviewer is looking for the lane that would make rollback hardest if the update drifts.",
      positive: "The release reviewer would likely score {lane} as a concrete control improvement.",
      negative: "The release reviewer would likely treat {lane} as a launch blocker until the control is tightened."
    },
    ops: {
      title: "Operations reaction",
      pending: "Operations wants {lane} to reduce policy exceptions, not create more ambiguous cases.",
      positive: "Operations would likely trust {lane} more because follow-up handling becomes easier to govern.",
      negative: "Operations would likely push back because {lane} still creates hidden review and cleanup burden."
    }
  }
};

export const MISSIONS = {
  "hr": {
    "id": "hr",
    "title": "HR Leave Policy Assistant",
    "tag": "Internal policy drafting",
    "prototypeState": "Produces strong first drafts, but managers paste entire employee messages with names, IDs, dates, and medical details. The workflow also logs too much raw text.",
    "coreTension": "Useful policy drafting versus need-to-know filtering and clear escalation to HR specialists.",
    "fragileBranch": "Keeping full copied messages in both context and logs.",
    "optionalBranch": "Stricter accommodation-related governance and narrower retention policy.",
    "advanceOrganizer": "A useful HR drafting assistant is not enterprise-ready until it narrows sensitive context, handles refusals predictably, escalates appropriately, and can be updated without hidden risk.",
    "guidedExample": {
      "title": "Worked example: redact before drafting",
      "prompt": "A manager pasted an employee note that includes a name, employee ID, leave dates, and medical detail. For a first-draft response, the assistant only needs the leave-policy question and non-identifying context.",
      "strongMove": "Convert the note into a need-to-know packet: role = manager, task = draft policy-based reply, facts = leave topic + timing, escalation flag = medical/accommodation detail present.",
      "delta": {
        "readiness": 8,
        "exposureRisk": -14,
        "trustSafety": 4,
        "governance": 6,
        "maintainability": 2,
        "rolloutConfidence": 3
      },
      "coaching": "The point is not zero information. It is proportionate information. Reducing raw identifiers lowers exposure while preserving the facts the draft actually needs."
    },
    "initialMetrics": {
      "readiness": 38,
      "exposureRisk": 72,
      "trustSafety": 48,
      "governance": 44,
      "maintainability": 42,
      "rolloutConfidence": 35
    },
    "lanes": {
      "data_handling": {
        "title": "Need-to-know intake packet",
        "issue": "Managers often paste full employee messages into the workflow, including direct identifiers and medical detail.",
        "whyItMatters": "Context selection is a privacy and governance choice, not just a relevance choice.",
        "evidence": [
          "Current prompt packet stores full copied email text.",
          "Logs currently retain raw employee identifiers for troubleshooting."
        ],
        "disciplinedPath": "Use a redacted policy packet with only the leave topic, timing, and a flag that specialist review may be required.",
        "fragilePath": "Keep the copied message intact in context and logs because it is faster for the manager.",
        "options": [
          {
            "id": "redacted_packet",
            "label": "Use a redacted need-to-know packet",
            "summary": "Mask identifiers, keep only policy-relevant facts, and log document IDs instead of raw text.",
            "deltas": {
              "readiness": 12,
              "exposureRisk": -18,
              "trustSafety": 5,
              "governance": 10,
              "maintainability": 6,
              "rolloutConfidence": 5
            },
            "coachLocal": "This lowers unnecessary exposure without making the drafting task impossible.",
            "coachSystem": "Data minimization also improves audit clarity and makes later release reviews easier.",
            "consequence": "Audit preparation becomes simpler because the workflow retains far less sensitive detail."
          },
          {
            "id": "full_copy",
            "label": "Keep the full copied message available",
            "summary": "Preserve raw employee text in context and logs so managers can move faster.",
            "deltas": {
              "readiness": -8,
              "exposureRisk": 16,
              "trustSafety": -3,
              "governance": -10,
              "maintainability": -4,
              "rolloutConfidence": -6
            },
            "coachLocal": "The draft may be convenient, but the workflow now over-collects and over-retains medical detail.",
            "coachSystem": "Exposure risk rises, audit scope expands, and a later privacy review becomes harder to defend.",
            "consequence": "A later governance review flags avoidable retention of regulated details."
          }
        ]
      },
      "policy_refusal": {
        "title": "Policy block and refusal behavior",
        "issue": "Managers sometimes ask for guidance that crosses from policy explanation into case adjudication.",
        "whyItMatters": "Enterprise trust depends on predictable boundaries and professional next-step guidance.",
        "evidence": [
          "The current prototype answers almost any HR question in a helpful tone.",
          "No refusal pattern tells managers when specialist review is required."
        ],
        "disciplinedPath": "Explain policy, refuse case adjudication, and route accommodation or medical determinations to HR specialists.",
        "fragilePath": "Let the assistant sound helpful by speculating about what HR will likely approve.",
        "options": [
          {
            "id": "clear_boundary",
            "label": "Add a clear policy/refusal block",
            "summary": "Allow policy explanation, but refuse adjudication and guide the manager to HR when protected details are involved.",
            "deltas": {
              "readiness": 9,
              "exposureRisk": -4,
              "trustSafety": 9,
              "governance": 9,
              "maintainability": 4,
              "rolloutConfidence": 6
            },
            "coachLocal": "The assistant stays useful while making the boundary explicit.",
            "coachSystem": "Clear refusal behavior reduces risky improvisation and protects brand trust under pressure.",
            "consequence": "Managers get a usable next step instead of a guess dressed up as policy."
          },
          {
            "id": "speculative_help",
            "label": "Keep responses flexible and highly helpful",
            "summary": "Let the assistant infer likely approval outcomes so managers get quicker answers.",
            "deltas": {
              "readiness": -7,
              "exposureRisk": 2,
              "trustSafety": -10,
              "governance": -8,
              "maintainability": -2,
              "rolloutConfidence": -5
            },
            "coachLocal": "This sounds supportive, but it blurs the line between policy explanation and case determination.",
            "coachSystem": "A soft boundary creates inconsistent refusals and raises operational risk when cases become sensitive.",
            "consequence": "The workflow now makes policy-sounding statements it is not authorized to make."
          }
        ]
      },
      "safety_moderation": {
        "title": "Pre-call and post-call controls",
        "issue": "The prototype has no staged checks for accommodation language, abuse, or specialist-review triggers.",
        "whyItMatters": "Safety is stronger when it operates as a workflow with pre-call, in-call, and post-call checks.",
        "evidence": [
          "No pre-call rule inspects for sensitive accommodation terms.",
          "No post-call review checks whether the answer quietly overreached."
        ],
        "disciplinedPath": "Scan for protected-detail triggers before drafting and validate the final answer against escalation rules.",
        "fragilePath": "Rely on the prompt alone and assume a good draft is safe enough.",
        "options": [
          {
            "id": "staged_controls",
            "label": "Use staged moderation controls",
            "summary": "Pre-call trigger for protected categories, in-call boundary instructions, and a post-call escalation check.",
            "deltas": {
              "readiness": 8,
              "exposureRisk": -6,
              "trustSafety": 10,
              "governance": 8,
              "maintainability": 4,
              "rolloutConfidence": 7
            },
            "coachLocal": "The workflow now has a clear place to catch high-risk cases before and after generation.",
            "coachSystem": "Moderation becomes operationally visible instead of being an invisible hope baked into the prompt.",
            "consequence": "Borderline accommodation requests are routed before an unsafe draft leaves the system."
          },
          {
            "id": "prompt_only",
            "label": "Keep a single prompt-only safety rule",
            "summary": "Rely on one broad instruction telling the assistant to be careful with sensitive topics.",
            "deltas": {
              "readiness": -5,
              "exposureRisk": 4,
              "trustSafety": -8,
              "governance": -5,
              "maintainability": -1,
              "rolloutConfidence": -4
            },
            "coachLocal": "A generic caution line is not the same as a real moderation workflow.",
            "coachSystem": "Without staged checks, risky cases are more likely to slip through until a human spots them later.",
            "consequence": "The team has no reliable checkpoint when the assistant drifts into protected-detail guidance."
          }
        ]
      },
      "trust_security": {
        "title": "Separate trusted rules from untrusted text",
        "issue": "Employee emails and pasted notes can contain forceful language that competes with trusted instructions.",
        "whyItMatters": "Ordinary-looking content can distort workflow behavior when trust boundaries are weak.",
        "evidence": [
          "Managers sometimes paste long email threads into the tool.",
          "The prototype treats pasted text and trusted instructions as one mixed block."
        ],
        "disciplinedPath": "Keep enterprise rules in a trusted policy layer and treat pasted email text only as evidence to reason over.",
        "fragilePath": "Mix pasted employee text directly with instructions because it is simpler to assemble.",
        "options": [
          {
            "id": "trusted_separation",
            "label": "Keep trusted instructions separate from pasted content",
            "summary": "Label employee notes as untrusted evidence and block any instruction-like text from outranking the policy layer.",
            "deltas": {
              "readiness": 8,
              "exposureRisk": -5,
              "trustSafety": 7,
              "governance": 7,
              "maintainability": 5,
              "rolloutConfidence": 6
            },
            "coachLocal": "This lowers the chance that copied text changes workflow behavior.",
            "coachSystem": "Clear trust boundaries support injection defense, output validation, and safer future reuse.",
            "consequence": "The workflow is less likely to obey an instruction hidden inside a copied email thread."
          },
          {
            "id": "mixed_context",
            "label": "Assemble everything into one mixed context block",
            "summary": "Combine manager input, copied email text, and rules together for convenience.",
            "deltas": {
              "readiness": -6,
              "exposureRisk": 3,
              "trustSafety": -7,
              "governance": -6,
              "maintainability": -3,
              "rolloutConfidence": -5
            },
            "coachLocal": "This keeps assembly simple but makes instruction hierarchy harder to defend.",
            "coachSystem": "Weak trust boundaries raise injection risk and make incident review more ambiguous.",
            "consequence": "Reviewers cannot easily tell whether a risky answer came from the policy layer or pasted content."
          }
        ]
      },
      "performance_routing": {
        "title": "Lean evidence and routing",
        "issue": "The prototype includes long policy blocks and old thread history on almost every request.",
        "whyItMatters": "More context is not free. It raises cost, latency, and review complexity.",
        "evidence": [
          "Average request packet includes entire policy page plus full conversation history.",
          "Many drafting requests are routine and low consequence."
        ],
        "disciplinedPath": "Use short reusable rules, narrow excerpts, and a lighter path for routine policy drafts.",
        "fragilePath": "Keep the whole policy page and thread history in every request to be safe.",
        "options": [
          {
            "id": "lean_routing",
            "label": "Use lean evidence with a routine-draft path",
            "summary": "Keep only the needed excerpt, summarize stale history, and reserve heavier context for ambiguous cases.",
            "deltas": {
              "readiness": 7,
              "exposureRisk": -3,
              "trustSafety": 3,
              "governance": 4,
              "maintainability": 8,
              "rolloutConfidence": 7
            },
            "coachLocal": "The workflow becomes faster and easier to inspect without sacrificing the task.",
            "coachSystem": "Token discipline improves cost control and makes later regression analysis easier.",
            "consequence": "Routine leave-policy drafts no longer pay the cost of a high-complexity path."
          },
          {
            "id": "always_full_context",
            "label": "Send the full policy and full history every time",
            "summary": "Use the largest context on every request so no edge case is missed.",
            "deltas": {
              "readiness": -4,
              "exposureRisk": 1,
              "trustSafety": 0,
              "governance": -1,
              "maintainability": -8,
              "rolloutConfidence": -6
            },
            "coachLocal": "The answer may still look good, but the workflow becomes slower and harder to maintain.",
            "coachSystem": "Context bloat quietly accumulates operational debt even when visible quality seems stable.",
            "consequence": "Latency rises and the team can no longer explain which evidence actually mattered."
          }
        ]
      },
      "governed_releases": {
        "title": "Change control and rollback",
        "issue": "Managers want prompt tweaks quickly, but the workflow has no release log or regression gate.",
        "whyItMatters": "Prompt edits are production changes when people rely on the output.",
        "evidence": [
          "Current changes are made directly in a shared prompt file.",
          "No rollback owner is named if behavior worsens."
        ],
        "disciplinedPath": "Version prompt and policy changes, run an HR regression set, and assign rollback ownership.",
        "fragilePath": "Edit the shared prompt directly and trust anecdotal improvements.",
        "options": [
          {
            "id": "version_and_regress",
            "label": "Version changes and require regression checks",
            "summary": "Record what changed, why it changed, the tested cases, and who can revert the release.",
            "deltas": {
              "readiness": 9,
              "exposureRisk": -2,
              "trustSafety": 4,
              "governance": 12,
              "maintainability": 8,
              "rolloutConfidence": 12
            },
            "coachLocal": "The workflow gains traceability and a safer update path.",
            "coachSystem": "Release discipline turns memory into evidence and reduces the blast radius of future edits.",
            "consequence": "A later downgrade can be reverted quickly because the operating state is known."
          },
          {
            "id": "edit_live",
            "label": "Keep live-editing the shared prompt",
            "summary": "Let the team patch wording directly in production whenever a manager asks.",
            "deltas": {
              "readiness": -7,
              "exposureRisk": 0,
              "trustSafety": -2,
              "governance": -11,
              "maintainability": -9,
              "rolloutConfidence": -12
            },
            "coachLocal": "Fast edits feel responsive, but they erase traceability.",
            "coachSystem": "Without versioning and rollback ownership, the workflow becomes fragile under ongoing change.",
            "consequence": "A risky wording change cannot be tied cleanly to the complaints it caused."
          }
        ]
      },
      "monitoring_governance": {
        "title": "Monitoring thresholds and ownership",
        "issue": "The prototype has no shared view of who samples outputs or what signals should trigger review.",
        "whyItMatters": "Metrics matter only when they lead to review and action.",
        "evidence": [
          "No threshold exists for privacy flags or escalation volume.",
          "Operations and HR reviewers are not assigned ongoing ownership."
        ],
        "disciplinedPath": "Define sampling cadence, thresholds, and accountable reviewers across HR and operations.",
        "fragilePath": "Check complaints only when someone notices a problem.",
        "options": [
          {
            "id": "thresholded_review",
            "label": "Define thresholds, sampling, and owners",
            "summary": "Set review triggers for privacy flags, dissatisfaction, and escalation volume, with named owners and follow-up actions.",
            "deltas": {
              "readiness": 8,
              "exposureRisk": -4,
              "trustSafety": 5,
              "governance": 11,
              "maintainability": 7,
              "rolloutConfidence": 8
            },
            "coachLocal": "Now the team knows what drift looks like and who responds.",
            "coachSystem": "Monitoring becomes maintenance discipline instead of a passive dashboard.",
            "consequence": "Recurring reviewer comments can feed directly into the next controlled update."
          },
          {
            "id": "ad_hoc_review",
            "label": "Review only when complaints appear",
            "summary": "Wait for managers or employees to surface issues before investigating quality or risk.",
            "deltas": {
              "readiness": -6,
              "exposureRisk": 2,
              "trustSafety": -4,
              "governance": -9,
              "maintainability": -5,
              "rolloutConfidence": -7
            },
            "coachLocal": "The workflow may appear stable, but drift will stay invisible longer.",
            "coachSystem": "Ad hoc review weakens governance and slows learning from near misses.",
            "consequence": "The first clear signal arrives from a painful case instead of a designed threshold."
          }
        ]
      },
      "fail_safe_behavior": {
        "title": "Escalation and conservative fallback",
        "issue": "Some requests will still be ambiguous, high-consequence, or too sensitive for automated drafting.",
        "whyItMatters": "A reliable workflow knows when not to keep improvising.",
        "evidence": [
          "The prototype currently tries to produce a draft for almost every request.",
          "No retrieval-only or human-review fallback exists when ambiguity remains."
        ],
        "disciplinedPath": "Escalate high-risk cases to HR specialists and use a conservative retrieval-only answer when drafting is not safe.",
        "fragilePath": "Keep producing a best-effort draft so the tool never appears unhelpful.",
        "options": [
          {
            "id": "escalate_and_fallback",
            "label": "Use human escalation plus retrieval-only fallback",
            "summary": "For protected-detail cases, hand off clearly and provide only safe policy excerpts when generation would overreach.",
            "deltas": {
              "readiness": 8,
              "exposureRisk": -5,
              "trustSafety": 11,
              "governance": 8,
              "maintainability": 4,
              "rolloutConfidence": 9
            },
            "coachLocal": "This preserves usefulness without pretending every case can be automated safely.",
            "coachSystem": "Fail-safe behavior strengthens trust because users can see the workflow knows its limits.",
            "consequence": "Managers get a clear handoff path instead of a risky draft that invites overreliance."
          },
          {
            "id": "always_generate",
            "label": "Always generate a best-effort draft",
            "summary": "Keep the assistant helpful by drafting even when the case is ambiguous or sensitive.",
            "deltas": {
              "readiness": -9,
              "exposureRisk": 6,
              "trustSafety": -11,
              "governance": -7,
              "maintainability": -2,
              "rolloutConfidence": -8
            },
            "coachLocal": "Helpfulness becomes misleading when the workflow no longer respects its safe operating boundary.",
            "coachSystem": "A workflow that never backs off accumulates trust debt and incident risk.",
            "consequence": "Users cannot tell which drafts are low-risk and which required a specialist."
          }
        ]
      }
    }
  },
  "support": {
    "id": "support",
    "title": "Support Response Assistant",
    "tag": "Customer support drafting",
    "prototypeState": "Sounds helpful and on-brand, but it handles unauthorized account-detail requests inconsistently and sometimes softens the refusal too much.",
    "coreTension": "Helpfulness and brand tone versus clear refusal boundaries and escalation paths.",
    "fragileBranch": "Permissive answers that soften the boundary too much.",
    "optionalBranch": "High-pressure user escalation plus post-call moderation review.",
    "advanceOrganizer": "A support assistant becomes enterprise-ready only when it protects authorization boundaries, applies moderation consistently, and stays operationally maintainable under real customer pressure.",
    "guidedExample": {
      "title": "Worked example: useful refusal with next step",
      "prompt": "A customer asks for account details on a profile they are not verified to access. The strongest response is not a vague rejection; it is a clear boundary plus a safe next step.",
      "strongMove": "State that account-specific details cannot be shared here, explain the approved verification channel, and preserve brand tone without weakening the boundary.",
      "delta": {
        "readiness": 7,
        "exposureRisk": -8,
        "trustSafety": 7,
        "governance": 5,
        "maintainability": 2,
        "rolloutConfidence": 3
      },
      "coaching": "Strong refusals preserve trust because they are clear, professional, and action-oriented. They do not merely block the user; they route the user."
    },
    "initialMetrics": {
      "readiness": 42,
      "exposureRisk": 61,
      "trustSafety": 50,
      "governance": 46,
      "maintainability": 45,
      "rolloutConfidence": 40
    },
    "lanes": {
      "data_handling": {
        "title": "Authorized context only",
        "issue": "Support agents sometimes pull broad customer-history context even when the current user is not fully verified.",
        "whyItMatters": "Need-to-know applies to support context assembly, not just final wording.",
        "evidence": [
          "The prototype often loads full recent-case history before identity is confirmed.",
          "Logs keep full ticket text for convenience."
        ],
        "disciplinedPath": "Load only minimal issue context until authorization is confirmed and log case IDs plus redacted excerpts.",
        "fragilePath": "Load the entire recent customer history to maximize helpfulness.",
        "options": [
          {
            "id": "minimal_preverify",
            "label": "Use minimal pre-verification context",
            "summary": "Keep only the issue type and approved account state until the user passes the correct verification step.",
            "deltas": {
              "readiness": 10,
              "exposureRisk": -15,
              "trustSafety": 5,
              "governance": 9,
              "maintainability": 5,
              "rolloutConfidence": 5
            },
            "coachLocal": "This protects unauthorized details before the workflow has a legitimate reason to load them.",
            "coachSystem": "The support flow becomes easier to defend in audit and easier to stage safely.",
            "consequence": "The assistant stops exposing account history too early in the interaction."
          },
          {
            "id": "broad_history",
            "label": "Load broad account history immediately",
            "summary": "Give the assistant the full recent account context so it can answer faster.",
            "deltas": {
              "readiness": -7,
              "exposureRisk": 14,
              "trustSafety": -4,
              "governance": -8,
              "maintainability": -3,
              "rolloutConfidence": -5
            },
            "coachLocal": "The assistant may sound informed, but it now sees more than the current user is authorized to access.",
            "coachSystem": "Broader exposure early in the workflow weakens both privacy posture and trust.",
            "consequence": "A routine request now carries avoidable exposure risk before verification occurs."
          }
        ]
      },
      "policy_refusal": {
        "title": "Refusal boundary with usable next step",
        "issue": "The current refusal is friendly but inconsistent about what cannot be disclosed.",
        "whyItMatters": "Boundary quality matters as much as tone when users push for exceptions or unauthorized detail.",
        "evidence": [
          "Current responses sometimes imply that an exception may be possible without verification.",
          "No decision hierarchy clearly prioritizes account authorization."
        ],
        "disciplinedPath": "Make the authorization rule explicit, refuse the disallowed request, and route to the approved verification path.",
        "fragilePath": "Soften the refusal so the assistant still sounds extra helpful.",
        "options": [
          {
            "id": "explicit_boundary",
            "label": "Use explicit authorization-first refusal guidance",
            "summary": "State the boundary clearly, keep the tone respectful, and provide the next approved support step.",
            "deltas": {
              "readiness": 10,
              "exposureRisk": -5,
              "trustSafety": 11,
              "governance": 10,
              "maintainability": 4,
              "rolloutConfidence": 6
            },
            "coachLocal": "The answer stays professional without becoming permissive.",
            "coachSystem": "Clear refusal behavior reduces inconsistent edge handling across agents and scenarios.",
            "consequence": "Customers get a path forward without receiving unauthorized detail."
          },
          {
            "id": "soft_refusal",
            "label": "Keep a soft, highly empathetic refusal",
            "summary": "Prioritize friendliness even if the message becomes less explicit about the boundary.",
            "deltas": {
              "readiness": -8,
              "exposureRisk": 5,
              "trustSafety": -9,
              "governance": -7,
              "maintainability": -2,
              "rolloutConfidence": -6
            },
            "coachLocal": "Tone improves, but the boundary becomes ambiguous.",
            "coachSystem": "Inconsistent refusal language encourages unsafe workarounds and reviewer disagreement.",
            "consequence": "The workflow now sounds negotiable when the policy is not."
          }
        ]
      },
      "safety_moderation": {
        "title": "Moderation around abusive or pressured requests",
        "issue": "Escalated users often push for exceptions or become abusive when refused.",
        "whyItMatters": "Moderation should manage risky inputs and risky outputs, not just label them as bad.",
        "evidence": [
          "No pre-call classifier distinguishes routine verification issues from abusive escalation.",
          "No post-call review checks whether the answer stayed within policy under pressure."
        ],
        "disciplinedPath": "Use pre-call pressure signals, in-call policy reminders, and post-call output validation for boundary language.",
        "fragilePath": "Treat every support request the same and hope tone rules are enough.",
        "options": [
          {
            "id": "pressure_controls",
            "label": "Add high-pressure moderation controls",
            "summary": "Route abusive or exception-seeking requests through stronger moderation and validate the final response before release.",
            "deltas": {
              "readiness": 7,
              "exposureRisk": -4,
              "trustSafety": 10,
              "governance": 8,
              "maintainability": 4,
              "rolloutConfidence": 6
            },
            "coachLocal": "High-pressure cases now trigger a more deliberate support path.",
            "coachSystem": "The workflow becomes safer under stress instead of only in routine conditions.",
            "consequence": "Moderation catches a pressured exception request before it becomes an unauthorized disclosure."
          },
          {
            "id": "same_for_all",
            "label": "Use the same response flow for every case",
            "summary": "Keep a single support path and rely on the assistant to stay calm in difficult interactions.",
            "deltas": {
              "readiness": -5,
              "exposureRisk": 3,
              "trustSafety": -8,
              "governance": -5,
              "maintainability": 0,
              "rolloutConfidence": -4
            },
            "coachLocal": "Uniform handling is simpler, but it ignores the real operational difference between routine and pressured cases.",
            "coachSystem": "The absence of a pressure-specific path makes safety drift harder to notice.",
            "consequence": "A borderline case reaches the customer without an extra policy check."
          }
        ]
      },
      "trust_security": {
        "title": "Prompt-injection and retrieval boundaries",
        "issue": "Customer messages and pasted transcripts may contain instruction-like text that tries to bypass support policy.",
        "whyItMatters": "Untrusted user content should never compete with trusted operational rules.",
        "evidence": [
          "Customers sometimes paste 'ignore prior instructions' style text from community forums.",
          "The prototype passes long user text directly alongside system policy."
        ],
        "disciplinedPath": "Treat customer text as untrusted evidence, limit retrieval scope, and validate outputs before release.",
        "fragilePath": "Let the assistant parse everything in one block and trust the core prompt to resist manipulation.",
        "options": [
          {
            "id": "strict_boundary",
            "label": "Separate untrusted customer text from trusted rules",
            "summary": "Constrain retrieval scope, label user content as untrusted, and validate that the answer did not disclose hidden instructions or account data.",
            "deltas": {
              "readiness": 8,
              "exposureRisk": -4,
              "trustSafety": 8,
              "governance": 8,
              "maintainability": 5,
              "rolloutConfidence": 6
            },
            "coachLocal": "This lowers the chance that a customer can alter the workflow through instruction-like text.",
            "coachSystem": "Trusted boundaries support both security and cleaner incident analysis.",
            "consequence": "The assistant resists a message that tries to override verification rules."
          },
          {
            "id": "one_block_context",
            "label": "Mix customer text and trusted rules together",
            "summary": "Allow the assistant to interpret everything in a single shared prompt block.",
            "deltas": {
              "readiness": -6,
              "exposureRisk": 4,
              "trustSafety": -7,
              "governance": -6,
              "maintainability": -3,
              "rolloutConfidence": -5
            },
            "coachLocal": "The workflow becomes easier to assemble but harder to defend.",
            "coachSystem": "Weak trust boundaries raise both injection risk and uncertainty about why a bad answer appeared.",
            "consequence": "A forceful customer message now has a better chance of distorting the answer."
          }
        ]
      },
      "performance_routing": {
        "title": "Complexity-aware routing",
        "issue": "Every support request currently takes the same heavy path, even low-risk status questions.",
        "whyItMatters": "Scale depends on matching context size and model effort to task consequence.",
        "evidence": [
          "Low-risk FAQ-style questions use the same packet as exception-heavy disputes.",
          "Latency complaints increase during high-volume periods."
        ],
        "disciplinedPath": "Route routine questions to a leaner path and reserve heavy policy context for sensitive or disputed cases.",
        "fragilePath": "Use the same richest path for every request.",
        "options": [
          {
            "id": "tiered_routing",
            "label": "Route by complexity and consequence",
            "summary": "Use a lightweight path for routine questions and a heavier path for disputes, exceptions, or authorization-sensitive requests.",
            "deltas": {
              "readiness": 7,
              "exposureRisk": -2,
              "trustSafety": 3,
              "governance": 3,
              "maintainability": 9,
              "rolloutConfidence": 8
            },
            "coachLocal": "The workflow becomes faster where it safely can, without downgrading high-risk handling.",
            "coachSystem": "Complexity-aware routing keeps latency and cost from quietly undermining trust.",
            "consequence": "Routine status questions stop waiting behind heavyweight dispute handling."
          },
          {
            "id": "single_heavy_path",
            "label": "Keep one heavy path for all support work",
            "summary": "Always use the largest evidence packet and the strongest route to stay consistent.",
            "deltas": {
              "readiness": -4,
              "exposureRisk": 1,
              "trustSafety": 0,
              "governance": 0,
              "maintainability": -9,
              "rolloutConfidence": -6
            },
            "coachLocal": "Consistency helps, but the cost and latency burden grows quickly.",
            "coachSystem": "The workflow now pays its most expensive price on every request whether it needs to or not.",
            "consequence": "Support volume spikes produce visible delay without improving boundary quality."
          }
        ]
      },
      "governed_releases": {
        "title": "Versioned support-policy updates",
        "issue": "The team frequently tweaks tone and refusal wording after customer complaints, but changes are not governed.",
        "whyItMatters": "Small wording changes can quietly alter authorization behavior.",
        "evidence": [
          "Recent edits were pushed directly to production.",
          "No regression set checks normal, edge, and pressured support cases."
        ],
        "disciplinedPath": "Version the policy block, test a representative support regression set, and stage rollout with rollback criteria.",
        "fragilePath": "Push wording changes live and judge success by anecdotal sentiment.",
        "options": [
          {
            "id": "staged_release",
            "label": "Stage policy updates with regressions and rollback",
            "summary": "Track the version, test normal and high-pressure cases, and roll out gradually with a named rollback owner.",
            "deltas": {
              "readiness": 9,
              "exposureRisk": -2,
              "trustSafety": 5,
              "governance": 12,
              "maintainability": 8,
              "rolloutConfidence": 11
            },
            "coachLocal": "The team can now improve tone without losing control of the boundary.",
            "coachSystem": "Release discipline prevents customer-experience fixes from quietly weakening policy behavior.",
            "consequence": "The team can revert a bad support-policy change before it spreads broadly."
          },
          {
            "id": "patch_live",
            "label": "Patch live wording whenever complaints rise",
            "summary": "Optimize quickly in production and rely on agent feedback to spot regressions.",
            "deltas": {
              "readiness": -6,
              "exposureRisk": 1,
              "trustSafety": -3,
              "governance": -10,
              "maintainability": -8,
              "rolloutConfidence": -11
            },
            "coachLocal": "This feels responsive, but it removes release evidence.",
            "coachSystem": "Without staged rollout, the team learns from customer pain instead of controlled review.",
            "consequence": "A softer refusal goes live everywhere before anyone notices it weakened the boundary."
          }
        ]
      },
      "monitoring_governance": {
        "title": "Signals, sampling, and owners",
        "issue": "The support workflow lacks thresholds for unauthorized-disclosure risk, dissatisfied responses, and escalation volume.",
        "whyItMatters": "Monitoring is useful only when it points to action and named owners.",
        "evidence": [
          "Supervisors review only a few complaint cases manually.",
          "No weekly audit sample exists for refusal quality or policy drift."
        ],
        "disciplinedPath": "Set sampling rules, dispute thresholds, and reviewer ownership across support and operations.",
        "fragilePath": "Wait for obvious complaints or incidents before reviewing behavior.",
        "options": [
          {
            "id": "active_monitoring",
            "label": "Monitor refusal quality, dissatisfaction, and escalation volume",
            "summary": "Use weekly samples and response thresholds with support-ops ownership and clear follow-up actions.",
            "deltas": {
              "readiness": 8,
              "exposureRisk": -3,
              "trustSafety": 5,
              "governance": 10,
              "maintainability": 7,
              "rolloutConfidence": 8
            },
            "coachLocal": "Now the team can detect drift before it becomes a headline incident.",
            "coachSystem": "Monitoring becomes a closed loop because metrics are tied to review action.",
            "consequence": "Reviewer comments on weak refusals now trigger a concrete update path."
          },
          {
            "id": "complaint_only",
            "label": "Review only on major customer complaints",
            "summary": "Use incident-driven review instead of regular operational sampling.",
            "deltas": {
              "readiness": -5,
              "exposureRisk": 2,
              "trustSafety": -4,
              "governance": -8,
              "maintainability": -5,
              "rolloutConfidence": -6
            },
            "coachLocal": "You will still learn, but later and more painfully.",
            "coachSystem": "Incident-only monitoring creates false calm between visible failures.",
            "consequence": "The first strong signal comes from escalations that could have been caught earlier."
          }
        ]
      },
      "fail_safe_behavior": {
        "title": "Escalation path for sensitive disputes",
        "issue": "Some account disputes, abuse cases, or exception requests should not be completed automatically.",
        "whyItMatters": "Reliable support systems back off when the safe action space narrows.",
        "evidence": [
          "The prototype attempts to answer nearly every customer message directly.",
          "No retrieval-only fallback exists when policy allows explanation but not action."
        ],
        "disciplinedPath": "Escalate sensitive disputes, provide conservative verification guidance, and use retrieval-only fallback where generation would overreach.",
        "fragilePath": "Always provide a best-effort answer to avoid seeming unhelpful.",
        "options": [
          {
            "id": "escalate_sensitive",
            "label": "Escalate sensitive disputes and use conservative fallback",
            "summary": "Route account-sensitive disputes to the approved team and provide only safe next-step guidance when the workflow cannot act.",
            "deltas": {
              "readiness": 8,
              "exposureRisk": -4,
              "trustSafety": 11,
              "governance": 8,
              "maintainability": 4,
              "rolloutConfidence": 8
            },
            "coachLocal": "This preserves trust by being explicit about what the assistant can and cannot do safely.",
            "coachSystem": "Fail-safe behavior reduces the pressure to improvise in the very cases that most need control.",
            "consequence": "Customers still get a clear path forward, but not an unsafe pseudo-resolution."
          },
          {
            "id": "never_back_off",
            "label": "Always answer with a best-effort resolution",
            "summary": "Keep the assistant highly responsive, even when the case approaches a sensitive boundary.",
            "deltas": {
              "readiness": -8,
              "exposureRisk": 5,
              "trustSafety": -10,
              "governance": -7,
              "maintainability": -2,
              "rolloutConfidence": -7
            },
            "coachLocal": "Best-effort language can turn into false authority in the wrong case.",
            "coachSystem": "A workflow that never backs off accumulates trust debt under real customer pressure.",
            "consequence": "The assistant now sounds more decisive exactly when it should become more conservative."
          }
        ]
      }
    }
  },
  "finance": {
    "id": "finance",
    "title": "Finance Guidance Assistant",
    "tag": "Internal reimbursement guidance",
    "prototypeState": "Summarizes approved policy accurately, but it became too rigid after recent prompt changes and no one owns rollback if the update harms the workflow.",
    "coreTension": "Quality improvements versus governed releases, monitoring, and fail-safe planning.",
    "fragileBranch": "Shipping a prompt change without a regression set or rollback owner.",
    "optionalBranch": "Latency increase caused by context growth and routing drift.",
    "advanceOrganizer": "Enterprise readiness in finance depends not only on correct answers, but also on controlled releases, measurable drift signals, and conservative fallback when ambiguity or policy edge cases appear.",
    "guidedExample": {
      "title": "Worked example: version the policy update",
      "prompt": "Users say the assistant is too rigid. The strongest first move is not to loosen the prompt live. It is to define the change, test representative cases, and keep rollback ready.",
      "strongMove": "Create a short release record: what changed, why it changed, which routine and edge cases were retested, and who can revert if the update weakens policy compliance.",
      "delta": {
        "readiness": 7,
        "exposureRisk": -2,
        "trustSafety": 3,
        "governance": 8,
        "maintainability": 6,
        "rolloutConfidence": 8
      },
      "coaching": "Release discipline turns a vague quality complaint into a controlled improvement cycle. That is central to Chapter 5 operationalization."
    },
    "initialMetrics": {
      "readiness": 47,
      "exposureRisk": 48,
      "trustSafety": 54,
      "governance": 52,
      "maintainability": 46,
      "rolloutConfidence": 43
    },
    "lanes": {
      "data_handling": {
        "title": "Minimal policy evidence packet",
        "issue": "Finance users attach large policy documents and reimbursement records even when the current question is narrow.",
        "whyItMatters": "Context size and sensitivity should be justified by task need, not by habit.",
        "evidence": [
          "Current packet includes full policy text and sometimes raw reimbursement lines.",
          "Logs capture broad snippets for troubleshooting."
        ],
        "disciplinedPath": "Use narrow approved excerpts plus redacted transaction references instead of full records.",
        "fragilePath": "Include full policy files and raw reimbursement details to avoid missing context.",
        "options": [
          {
            "id": "narrow_finance_packet",
            "label": "Use narrow approved excerpts and redacted references",
            "summary": "Keep only the policy clause, request category, and redacted identifiers needed for the explanation.",
            "deltas": {
              "readiness": 9,
              "exposureRisk": -10,
              "trustSafety": 4,
              "governance": 8,
              "maintainability": 5,
              "rolloutConfidence": 4
            },
            "coachLocal": "The assistant retains enough evidence to explain policy without carrying unnecessary financial detail.",
            "coachSystem": "Leaner, safer packets are easier to review and cheaper to maintain over time.",
            "consequence": "The workflow stops treating every finance question like a full-case audit."
          },
          {
            "id": "full_finance_records",
            "label": "Load full policy files and raw reimbursement detail",
            "summary": "Include broad supporting records so the assistant has maximum context on every request.",
            "deltas": {
              "readiness": -5,
              "exposureRisk": 9,
              "trustSafety": -2,
              "governance": -5,
              "maintainability": -4,
              "rolloutConfidence": -3
            },
            "coachLocal": "The answer may be rich, but the packet is now heavier and more exposed than the task requires.",
            "coachSystem": "Over-collection quietly increases cost and governance burden for routine finance guidance.",
            "consequence": "Audit review now has to justify why so much sensitive material entered the prompt path."
          }
        ]
      },
      "policy_refusal": {
        "title": "Policy clarity without false flexibility",
        "issue": "Users want the assistant to feel less rigid, but finance policy boundaries still need to remain explicit.",
        "whyItMatters": "A quality fix that weakens rule clarity can still be an enterprise regression.",
        "evidence": [
          "Recent complaint: 'The assistant says no too quickly.'",
          "No updated refusal pattern differentiates explanation from exception approval."
        ],
        "disciplinedPath": "Explain the policy clearly, distinguish standard guidance from exception approval, and route edge cases to review.",
        "fragilePath": "Loosen the boundary so the assistant sounds more flexible about exceptions.",
        "options": [
          {
            "id": "clarify_not_loosen",
            "label": "Clarify policy guidance without weakening approval boundaries",
            "summary": "Improve explanation quality, but keep exception approval out of scope and route edge cases for review.",
            "deltas": {
              "readiness": 8,
              "exposureRisk": -1,
              "trustSafety": 8,
              "governance": 9,
              "maintainability": 4,
              "rolloutConfidence": 6
            },
            "coachLocal": "The user experience improves because the boundary is clearer, not because the policy got softer.",
            "coachSystem": "This preserves finance control while addressing a real usability complaint.",
            "consequence": "Users understand what the policy says and when a reviewer must decide the exception."
          },
          {
            "id": "soften_finance_boundary",
            "label": "Make the assistant more flexible about likely exceptions",
            "summary": "Let the assistant imply when an exception would probably be approved.",
            "deltas": {
              "readiness": -7,
              "exposureRisk": 2,
              "trustSafety": -7,
              "governance": -9,
              "maintainability": -2,
              "rolloutConfidence": -7
            },
            "coachLocal": "This feels helpful, but it crosses into approval-shaping language.",
            "coachSystem": "The workflow now trades short-term satisfaction for policy ambiguity and reviewer risk.",
            "consequence": "An answer sounds operationally authoritative when the workflow lacks authority to grant it."
          }
        ]
      },
      "safety_moderation": {
        "title": "Checks for unsupported financial guidance",
        "issue": "Even accurate-sounding finance explanations can become risky if the assistant overreaches on edge cases.",
        "whyItMatters": "Post-call validation is especially valuable when the cost of unsupported guidance is high.",
        "evidence": [
          "No post-call check looks for unsupported exception statements.",
          "The current prototype treats routine and edge cases similarly."
        ],
        "disciplinedPath": "Use staged checks that catch missing evidence, exception language, and unsupported certainty before release.",
        "fragilePath": "Assume a policy summary that sounds plausible is good enough.",
        "options": [
          {
            "id": "finance_validation",
            "label": "Validate outputs for unsupported exception guidance",
            "summary": "Pre-call detect edge-case language, enforce in-call scope, and run a post-call check for unsupported certainty.",
            "deltas": {
              "readiness": 7,
              "exposureRisk": -2,
              "trustSafety": 9,
              "governance": 7,
              "maintainability": 4,
              "rolloutConfidence": 6
            },
            "coachLocal": "The workflow now checks whether the answer stayed inside finance guidance scope.",
            "coachSystem": "Moderation protects not just safety categories, but operational integrity in high-consequence domains.",
            "consequence": "An unsupported exception statement is caught before it reaches the requester."
          },
          {
            "id": "plausible_is_enough",
            "label": "Release any answer that sounds policy-consistent",
            "summary": "Skip extra validation unless a user complains later.",
            "deltas": {
              "readiness": -4,
              "exposureRisk": 1,
              "trustSafety": -8,
              "governance": -5,
              "maintainability": -1,
              "rolloutConfidence": -5
            },
            "coachLocal": "Plausible wording is not the same as supported operational guidance.",
            "coachSystem": "Without output validation, the workflow depends too heavily on tone and first impressions.",
            "consequence": "A confident but unsupported edge-case answer escapes into operational use."
          }
        ]
      },
      "trust_security": {
        "title": "Keep trusted finance rules separate",
        "issue": "Uploaded receipts, policy notes, and email threads can include instruction-like text or irrelevant confidential detail.",
        "whyItMatters": "Security and operational clarity both improve when trusted rules stay separate from untrusted documents.",
        "evidence": [
          "The prototype sometimes passes uploaded notes directly alongside policy instructions.",
          "No output validation checks whether the answer quoted unnecessary confidential detail."
        ],
        "disciplinedPath": "Constrain retrieval, label uploaded finance documents as untrusted evidence, and validate the final answer.",
        "fragilePath": "Treat uploaded documents as if they were trusted instructions because they are internal.",
        "options": [
          {
            "id": "finance_boundary",
            "label": "Separate trusted finance rules from uploaded evidence",
            "summary": "Use clear trust labels, limited retrieval scope, and output validation for sensitive detail.",
            "deltas": {
              "readiness": 7,
              "exposureRisk": -4,
              "trustSafety": 7,
              "governance": 8,
              "maintainability": 5,
              "rolloutConfidence": 6
            },
            "coachLocal": "Internal does not automatically mean trusted instruction.",
            "coachSystem": "Clear boundaries reduce injection risk and make audit reconstruction cleaner.",
            "consequence": "The workflow no longer treats uploaded notes as command text."
          },
          {
            "id": "internal_equals_trusted",
            "label": "Treat internal uploaded files as trusted by default",
            "summary": "Assume internal material can safely share the same instruction space as policy rules.",
            "deltas": {
              "readiness": -5,
              "exposureRisk": 4,
              "trustSafety": -6,
              "governance": -6,
              "maintainability": -3,
              "rolloutConfidence": -5
            },
            "coachLocal": "This simplifies assembly, but it weakens trust boundaries.",
            "coachSystem": "The workflow is now more vulnerable to accidental instruction override and unnecessary disclosure.",
            "consequence": "A note pasted from an approval thread quietly reshapes the assistant\u2019s behavior."
          }
        ]
      },
      "performance_routing": {
        "title": "Context budget after the policy update",
        "issue": "Recent changes increased context size and slowed responses, especially when the app loads multiple policy sections.",
        "whyItMatters": "Quality improvements can fail operationally if context growth quietly raises latency and cost.",
        "evidence": [
          "Average response latency rose after the last prompt update.",
          "The route now includes extra examples and history on most requests."
        ],
        "disciplinedPath": "Trim reusable rules, retrieve narrower sections, and reserve heavy context for ambiguous cases.",
        "fragilePath": "Keep adding examples and policy blocks whenever users say the answer felt rigid.",
        "options": [
          {
            "id": "trim_and_route",
            "label": "Trim the packet and route only complex cases to the heavy path",
            "summary": "Reduce duplicated rules, narrow retrieval, and use a heavier path only when the request truly needs it.",
            "deltas": {
              "readiness": 7,
              "exposureRisk": -1,
              "trustSafety": 2,
              "governance": 2,
              "maintainability": 10,
              "rolloutConfidence": 7
            },
            "coachLocal": "The workflow becomes faster without sacrificing its strongest controls.",
            "coachSystem": "Context discipline prevents 'quality fixes' from mutating into hidden cost and latency debt.",
            "consequence": "Routine reimbursement guidance becomes noticeably faster and easier to inspect."
          },
          {
            "id": "keep_growing_context",
            "label": "Solve rigidity by adding more examples and policy text",
            "summary": "Expand the context package whenever the assistant feels too constrained.",
            "deltas": {
              "readiness": -3,
              "exposureRisk": 1,
              "trustSafety": 0,
              "governance": 0,
              "maintainability": -10,
              "rolloutConfidence": -7
            },
            "coachLocal": "This may help a few cases, but it steadily bloats the operating path.",
            "coachSystem": "Unbounded context growth weakens scale readiness and makes the workflow harder to govern.",
            "consequence": "The next release inherits a slower, harder-to-debug finance path."
          }
        ]
      },
      "governed_releases": {
        "title": "Regression set and rollback ownership",
        "issue": "The latest finance prompt change shipped without a named rollback owner or a clear regression set.",
        "whyItMatters": "Prompt changes are production changes when they affect policy guidance.",
        "evidence": [
          "Current release record lists only a short note: 'made assistant less rigid.'",
          "No one owns rollback if compliance or user quality worsens."
        ],
        "disciplinedPath": "Define regression cases, document the change rationale, and name the rollback owner before rollout.",
        "fragilePath": "Ship the update broadly and learn from complaints.",
        "options": [
          {
            "id": "governed_finance_release",
            "label": "Define regressions, stage rollout, and name rollback ownership",
            "summary": "Use normal, edge, and policy-pressure cases before release and keep the revert path explicit.",
            "deltas": {
              "readiness": 11,
              "exposureRisk": -2,
              "trustSafety": 4,
              "governance": 13,
              "maintainability": 9,
              "rolloutConfidence": 13
            },
            "coachLocal": "This directly addresses the core failure mode of the prototype.",
            "coachSystem": "Release evidence, not memory, now governs finance updates.",
            "consequence": "The team can compare the new prompt against known finance benchmark cases before expanding rollout."
          },
          {
            "id": "ship_without_controls",
            "label": "Ship broadly without regression or rollback ownership",
            "summary": "Use user sentiment after launch as the main quality signal.",
            "deltas": {
              "readiness": -10,
              "exposureRisk": 1,
              "trustSafety": -4,
              "governance": -13,
              "maintainability": -10,
              "rolloutConfidence": -14
            },
            "coachLocal": "The workflow is now exposed to exactly the release discipline gap Chapter 5 warns about.",
            "coachSystem": "This is hidden debt: the answer may look improved before the operational weakness becomes visible.",
            "consequence": "A degraded release spreads before anyone can cleanly explain or reverse it."
          }
        ]
      },
      "monitoring_governance": {
        "title": "Thresholds for drift and reviewer disagreement",
        "issue": "The team lacks defined thresholds for rigidity complaints, unsupported guidance, and reviewer disagreement.",
        "whyItMatters": "Monitoring is only useful when it leads to investigation and action.",
        "evidence": [
          "No weekly sample exists for edge-case finance responses.",
          "Reviewer disagreement is discussed informally but never tracked."
        ],
        "disciplinedPath": "Track complaint rate, unsupported-claim flags, and reviewer disagreement with clear response thresholds.",
        "fragilePath": "Rely on informal judgment and occasional user complaints.",
        "options": [
          {
            "id": "finance_thresholds",
            "label": "Set drift thresholds and reviewer ownership",
            "summary": "Use routine audits and threshold-based review for rigidity complaints, unsupported statements, and disagreement spikes.",
            "deltas": {
              "readiness": 8,
              "exposureRisk": -2,
              "trustSafety": 5,
              "governance": 11,
              "maintainability": 8,
              "rolloutConfidence": 9
            },
            "coachLocal": "Now the team knows what 'too rigid again' or 'too loose' would look like operationally.",
            "coachSystem": "Monitoring becomes a maintenance discipline instead of a vague sense that users seem happier or unhappier.",
            "consequence": "The next update can be judged against agreed signals instead of anecdotes."
          },
          {
            "id": "informal_finance_monitoring",
            "label": "Use informal reviewer impressions only",
            "summary": "Let experienced reviewers raise concerns when something feels off.",
            "deltas": {
              "readiness": -4,
              "exposureRisk": 1,
              "trustSafety": -3,
              "governance": -8,
              "maintainability": -5,
              "rolloutConfidence": -6
            },
            "coachLocal": "Expert judgment matters, but it needs thresholds and follow-up actions to scale.",
            "coachSystem": "Without designed monitoring, drift becomes visible later and more ambiguously.",
            "consequence": "The workflow continues drifting until the disagreement becomes too obvious to ignore."
          }
        ]
      },
      "fail_safe_behavior": {
        "title": "Conservative fallback for ambiguous policy edge cases",
        "issue": "Some reimbursement questions mix policy explanation with edge-case judgment the workflow should not automate.",
        "whyItMatters": "Back-off plans matter when the answer space becomes narrow, ambiguous, or high consequence.",
        "evidence": [
          "The prototype often tries to resolve edge cases rather than pausing for review.",
          "No retrieval-only fallback exists when finance policy is unclear or conflicting."
        ],
        "disciplinedPath": "Use human escalation for exception-sensitive cases and retrieval-only policy excerpts when interpretation would overreach.",
        "fragilePath": "Always provide a best guess so the workflow looks complete.",
        "options": [
          {
            "id": "finance_fallback",
            "label": "Escalate edge cases and use retrieval-only fallback",
            "summary": "Provide approved policy excerpts and route ambiguous or approval-shaping cases to finance review.",
            "deltas": {
              "readiness": 8,
              "exposureRisk": -3,
              "trustSafety": 10,
              "governance": 8,
              "maintainability": 4,
              "rolloutConfidence": 8
            },
            "coachLocal": "The workflow remains useful without pretending it should decide every case.",
            "coachSystem": "Conservative fallbacks reduce the chance that ambiguity turns into unsupported operational guidance.",
            "consequence": "Users get grounded policy evidence plus a clear review path when automation should stop."
          },
          {
            "id": "guess_on_edge_cases",
            "label": "Always provide a best guess on edge cases",
            "summary": "Keep the assistant helpful by interpreting unclear policy and likely reviewer intent.",
            "deltas": {
              "readiness": -8,
              "exposureRisk": 2,
              "trustSafety": -10,
              "governance": -8,
              "maintainability": -2,
              "rolloutConfidence": -8
            },
            "coachLocal": "This creates apparent speed at the cost of unsafe authority.",
            "coachSystem": "A workflow that never backs off makes the riskiest cases look deceptively routine.",
            "consequence": "An ambiguous reimbursement question now receives a recommendation that should have gone to review."
          }
        ]
      }
    }
  }
};


const CORE_SCENARIO_IDS = ["hr", "support", "finance"];
function cloneDeep(value) { return JSON.parse(JSON.stringify(value)); }
function replaceAllStrings(value, replacements = []) {
  if (typeof value === "string") return replacements.reduce((acc, [from, to]) => acc.replaceAll(from, to), value);
  if (Array.isArray(value)) return value.map(item => replaceAllStrings(item, replacements));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceAllStrings(item, replacements)]));
  return value;
}
function buildPremiumScenario(baseId, overrides, replacements = []) {
  const base = cloneDeep(MISSIONS[baseId]);
  const replaced = replaceAllStrings(base, replacements);
  return { ...replaced, ...overrides, guidedExample: { ...replaced.guidedExample, ...(overrides.guidedExample || {}) } };
}
MISSIONS.executive = buildPremiumScenario("support", {
  id: "executive",
  title: "Executive Communications Assistant",
  tag: "Advanced scenario · executive response drafting",
  prototypeState: "Drafts executive replies and briefing notes quickly, but it sometimes softens confidentiality boundaries and overreaches when unverified requesters ask for sensitive schedule or board-prep detail.",
  coreTension: "Executive responsiveness and polish versus confidentiality boundaries, authorization, and clean escalation.",
  fragileBranch: "Helpful-sounding replies that reveal too much or blur the approval boundary.",
  optionalBranch: "Board-prep request pressure plus post-send review.",
  advanceOrganizer: "Executive workflows become enterprise-ready when they preserve authority, confidentiality, and escalation discipline even when a requester sounds urgent or well-connected.",
  guidedExample: {
    title: "Worked example: protect executive detail without sounding evasive",
    prompt: "An unverified requester asks for briefing detail and calendar context tied to an executive meeting. The strongest move is not a vague refusal; it is a clear confidentiality boundary plus the approved next channel.",
    strongMove: "State that executive-specific detail cannot be shared in this channel, point to the approved authorization path, and preserve tone without weakening the boundary.",
    coaching: "Executive support workflows earn trust when they stay polished without treating urgency or seniority as permission to loosen control."
  }
}, [["Support Response Assistant","Executive Communications Assistant"],["Customer support drafting","Executive response drafting"],["customer","requester"],["Customer","Requester"],["account","briefing"],["Account","Briefing"],["support","executive communications"],["Support","Executive communications"],["service","executive"],["ticket","message"],["verification","authorization"],["profile","channel"],["customers","requesters"],["support agents","executive communications staff"],["account history","briefing history"]]);
MISSIONS.compliance = buildPremiumScenario("finance", {
  id: "compliance",
  title: "Compliance Knowledge Assistant",
  tag: "Advanced scenario · regulated guidance drafting",
  prototypeState: "Summarizes approved control language well, but it can sound overly certain on edge cases and the launch plan still lacks explicit thresholds for regulated use.",
  coreTension: "Helpful compliance guidance versus controlled interpretation, release discipline, and conservative fallback.",
  fragileBranch: "Launching on policy confidence without explicit review thresholds.",
  optionalBranch: "Regulator-style edge case plus tighter audit expectations.",
  advanceOrganizer: "Compliance workflows become enterprise-ready when interpretation boundaries, release controls, monitoring, and fallback behavior remain visible under scrutiny.",
  guidedExample: {
    title: "Worked example: tighten the update path before loosening the answer",
    prompt: "Reviewers say the assistant sounds too rigid. The strongest first move is not to loosen the response live. It is to define the change, test regulated edge cases, and keep rollback ready.",
    strongMove: "Create a short change record: what changed, which regulated and edge cases were retested, which reviewers approved it, and who can revert if the update weakens control.",
    coaching: "Regulated workflows do not become stronger by sounding more flexible unless the organization can still prove where interpretation stops and review begins."
  }
}, [["Finance Guidance Assistant","Compliance Knowledge Assistant"],["Internal reimbursement guidance","Regulated guidance drafting"],["finance","compliance"],["Finance","Compliance"],["reimbursement","regulated-use"],["Reimbursement","Regulated-use"],["finance users","compliance users"],["financial","regulated"],["policy clause","control clause"],["finance review","compliance review"],["finance benchmark cases","regulated benchmark cases"]]);
SCENARIO_DRAMA.executive = replaceAllStrings(cloneDeep(SCENARIO_DRAMA.support), [["Support lead pressure","Executive sponsor pressure"],["support lead","executive sponsor"],["customer","requester"],["service review board","executive review board"],["customers","requesters"],["account-detail","briefing-detail"],["support","executive communications"],["Support","Executive communications"]]);
SCENARIO_DRAMA.compliance = replaceAllStrings(cloneDeep(SCENARIO_DRAMA.finance), [["Finance sponsor pressure","Compliance sponsor pressure"],["finance sponsor","compliance sponsor"],["finance","compliance"],["Finance","Compliance"],["reimbursement","regulated-use"],["Release reviewer","Compliance release reviewer"]]);
export const SCENARIO_PACKS = [
  { id: "core", label: "Core scenarios", description: "Start here. These three scenarios cover the Chapter 5 foundation without making the mission feel heavy.", scenarioIds: CORE_SCENARIO_IDS },
  { id: "premium", label: "Advanced scenarios", description: "Optional scenarios with more pressure and nuance after you are comfortable with the core flow.", scenarioIds: ["executive", "compliance"] }
];
