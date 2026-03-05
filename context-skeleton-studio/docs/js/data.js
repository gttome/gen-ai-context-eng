window.CONTEXT_SKELETON_DATA = {
  appName: "Context Skeleton Studio",
  appVersion: "v0.6.0",
  storageKey: "contextSkeletonStudioDraft_v1",
  snapshotVersion: "1.1.0",
  workflowTypes: [
    {
      id: "one_off",
      label: "One-off Answer",
      required: ["role", "rules", "grounding", "output", "request"]
    },
    {
      id: "reliability",
      label: "Reliability / Grounded",
      required: ["role", "rules", "dynamic", "grounding", "output", "request"]
    },
    {
      id: "multi_turn",
      label: "Multi-turn Continuity",
      required: ["role", "rules", "memory", "output", "request"]
    },
    {
      id: "strict_structure",
      label: "Strict Structure",
      required: ["role", "rules", "grounding", "output", "request"]
    }
  ],
  blockTemplates: [
    {
      id: "role",
      xrayTag: "ROLE",
      label: "Role / System Instructions",
      description: "Behavior, scope, persona, and non-negotiable role guidance.",
      placeholder: "You are a careful assistant helping a new manager summarize policy updates without legal advice."
    },
    {
      id: "rules",
      xrayTag: "RULES",
      label: "Rules / Constraints",
      description: "What must/must not happen. Put key constraints near the top.",
      placeholder: "Use only the provided policy text. If something is missing, say what is missing. Keep tone neutral."
    },
    {
      id: "dynamic",
      xrayTag: "DYNAMIC_FACTS",
      label: "Dynamic Facts",
      description: "Session-specific values like date, account status, or current metrics.",
      placeholder: "Date: 2026-02-25\nCustomer tier: Gold\nRegion: Midwest"
    },
    {
      id: "grounding",
      xrayTag: "GROUNDING",
      label: "Grounding Knowledge",
      description: "Relevant excerpts or facts the output must be based on.",
      placeholder: "Paste the excerpt, bullets, notes, or policy text the model must use."
    },
    {
      id: "memory",
      xrayTag: "MEMORY",
      label: "Memory",
      description: "Pinned facts, decisions, and rolling summary for multi-turn work.",
      placeholder: "Pinned facts, previous decisions, and what was already completed."
    },
    {
      id: "output",
      xrayTag: "OUTPUT_SCHEMA",
      label: "Output Format / Schema",
      description: "Structure the result (headings, checklist, JSON shape, fields).",
      placeholder: "Output as:\n1) Summary\n2) Risks\n3) Next Steps\nUse short bullets."
    },
    {
      id: "request",
      xrayTag: "USER_REQUEST",
      label: "User Request",
      description: "The actual task request. Usually near the end.",
      placeholder: "Draft a concise response that explains the update and highlights action items."
    }
  ],
  blockExamples: {
    role: "You are a clear, factual assistant helping a non-technical user prepare a reliable summary.",
    rules: "Use only the supplied facts. If something is missing, say so. Do not invent numbers.",
    dynamic: "Date: 2026-02-25; Team: Support Ops; Priority: High",
    grounding: "Policy excerpt: Refunds allowed within 30 days with receipt. Exceptions require manager approval.",
    memory: "Prior step completed: categories agreed. Keep same tone as prior response.",
    output: "Use headings: Summary, Key Risks, Recommended Actions. Max 6 bullets total.",
    request: "Write a manager-ready summary of the refund policy for the support team."
  },
  presets: [
    {
      id: "blank",
      label: "Blank (keep my current text)",
      description: "Does not overwrite anything. Use this if you just want manual editing.",
      workflowId: "one_off",
      blocks: {}
    },
    {
      id: "qa",
      label: "Q&A Answer Starter",
      description: "Fast setup for a grounded one-off answer using provided excerpts.",
      workflowId: "one_off",
      blocks: {
        role: "You are a helpful subject-matter explainer. Give a clear answer for a busy reader.",
        rules: "Use only the grounding text. If the answer is not fully supported, say what is missing. Avoid jargon.",
        dynamic: "Audience: Internal learner\nDepth: Medium",
        grounding: "Paste the article, chapter excerpt, or notes here.",
        memory: "",
        output: "Format:\n- Direct answer (2-4 bullets)\n- Evidence used\n- Follow-up question (optional)",
        request: "Answer the user's question using the provided grounding text."
      }
    },
    {
      id: "policy",
      label: "Policy Summary Starter",
      description: "Good for compliance/policy explanations with explicit constraints and evidence.",
      workflowId: "reliability",
      blocks: {
        role: "You are a policy summarization assistant for internal operations teams.",
        rules: "Use only the policy excerpt and dynamic facts. Do not add legal advice. Flag unclear wording.",
        dynamic: "Date: 2026-02-25\nAudience: Frontline supervisors\nRegion: [insert region]",
        grounding: "Paste the policy excerpt(s), FAQ lines, and exception rules here.",
        memory: "",
        output: "Return sections:\n1) Plain-language summary\n2) Required actions\n3) Exceptions/risks\n4) Unclear points",
        request: "Summarize the policy update and list the actions supervisors must take."
      }
    },
    {
      id: "incident",
      label: "Incident Response Draft Starter",
      description: "Multi-turn continuity starter for incident updates with pinned decisions.",
      workflowId: "multi_turn",
      blocks: {
        role: "You are an incident communications drafting assistant.",
        rules: "Be factual and concise. Separate confirmed facts from assumptions. Keep updates time-stamped.",
        dynamic: "Incident ID: INC-001\nStatus: Investigating\nAudience: Internal stakeholders",
        grounding: "Paste the incident timeline, logs, and confirmed observations here.",
        memory: "Pinned facts:\n- Initial report received\n- Owner assigned\n- Next checkpoint time",
        output: "Return:\n- Current status\n- Confirmed facts\n- Risks/unknowns\n- Next update time",
        request: "Draft the next incident status update for stakeholders."
      }
    }
  ],
  fixtures: [
    {
      id: "smoke_one_off_valid",
      label: "Smoke: One-off (valid)",
      description: "Loads a minimal valid One-off workflow so you can quickly verify validate/export/save/load.",
      workflowId: "one_off",
      xrayEnabled: true,
      order: ["role", "rules", "dynamic", "grounding", "memory", "output", "request"],
      blocks: {
        role: "You are a careful assistant. Be clear and factual.",
        rules: "Use only the grounding text. If something is missing, say what is missing.",
        dynamic: "Date: 2026-02-25\nAudience: Internal",
        grounding: "Facts:\n- Context engineering improves reliability by making inputs explicit.\n- Keep role and rules near the top.",
        memory: "",
        output: "Return: 1) Direct answer 2) Evidence used 3) Next step",
        request: "Explain why role and rules should be placed near the top of a context package."
      }
    },
    {
      id: "smoke_reliability_valid",
      label: "Smoke: Reliability (valid)",
      description: "Loads a minimal valid Reliability workflow so you can verify required-block validation and snapshot export/import.",
      workflowId: "reliability",
      xrayEnabled: true,
      order: ["role", "rules", "dynamic", "grounding", "memory", "output", "request"],
      blocks: {
        role: "You are a grounded summarization assistant. Do not invent details.",
        rules: "Use only the grounding section. If the grounding does not support the answer, ask one clarifying question.",
        dynamic: "Date: 2026-02-25\nAudience: New hires",
        grounding: "Excerpt:\nThe context package should separate instructions from facts. Put constraints early so they are not buried.",
        memory: "",
        output: "Use headings: Summary, Evidence, Follow-up",
        request: "Summarize the excerpt for a new hire and list one follow-up question."
      }
    },
    {
      id: "ordering_warning_demo",
      label: "Demo: Ordering warnings",
      description: "Intentionally bad ordering: Role/Rules buried and User Request too early. Expect ordering warnings.",
      workflowId: "one_off",
      xrayEnabled: true,
      order: ["dynamic", "grounding", "request", "output", "memory", "rules", "role"],
      blocks: {
        role: "You are a careful assistant.",
        rules: "Do not invent information.",
        dynamic: "Date: 2026-02-25",
        grounding: "Use the provided text only.",
        memory: "",
        output: "Use short bullets.",
        request: "Answer the question using the grounding text."
      }
    },
    {
      id: "long_content_demo",
      label: "Demo: Long content warning",
      description: "Loads a long Grounding block to trigger the heavy/very long warnings. Useful for budget-hint checks.",
      workflowId: "reliability",
      xrayEnabled: true,
      order: ["role", "rules", "dynamic", "grounding", "memory", "output", "request"],
      blocks: {
        role: "You are a summarization assistant.",
        rules: "Be concise. Use only grounding.",
        dynamic: "Date: 2026-02-25",
        grounding: "LONG_EXCERPT_START\n" +
          "This is a deliberately long excerpt for testing length warnings. ".repeat(90) +
          "\nLONG_EXCERPT_END",
        memory: "",
        output: "Return a 3-bullet summary.",
        request: "Summarize the long excerpt in 3 bullets."
      }
    }
  ],
  sampleSnapshotFiles: [
    {
      id: "sample_reliability",
      label: "Sample snapshot (Reliability)",
      path: "./assets/fixtures/sample_snapshot_reliability.json"
    },
    {
      id: "sample_multi_turn",
      label: "Sample snapshot (Multi-turn)",
      path: "./assets/fixtures/sample_snapshot_multiturn.json"
    }
  ]
};
