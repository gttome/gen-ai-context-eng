// Iteration Lab — scenario + test set data (static, editable).
// Global: window.ITER_LAB_DATA

(function(){
  const BLOCKS = [
    { id: "role", label: "System / Role", hint: "Define who the assistant is and what it must do." },
    { id: "rules", label: "Rules / Constraints", hint: "Non-negotiables, do/don't rules, tone, and limits." },
    { id: "dynamic", label: "Dynamic Facts", hint: "Today’s date, IDs, account status, current values." },
    { id: "grounding", label: "Grounding Knowledge", hint: "Approved excerpts or references (2–6 short snippets)." },
    { id: "memory", label: "Memory", hint: "Pinned facts + decisions + open questions (short, structured)." },
    { id: "format", label: "Output Format", hint: "Headings / schema / structure the response must follow." },
    { id: "request", label: "User Request", hint: "The question/task for this run (test questions override this in Test)." }
  ];

  const CHECKLIST = [
    { id: "grounded", label: "Grounded", tip: "Uses provided facts/excerpts; says when evidence is missing." },
    { id: "relevant", label: "Relevant", tip: "Directly answers the request; avoids detours." },
    { id: "consistent", label: "Consistent", tip: "Follows role + constraints every time." },
    { id: "structured", label: "Structured", tip: "Matches the requested headings/schema." },
    { id: "safe", label: "Safe / On-Policy", tip: "Avoids speculation; labels assumptions; respects rules." }
  ];

  const RUBRIC_DEFAULT = {
    weights: { grounded: 1, relevant: 1, consistent: 1, structured: 1, safe: 1 },
    passThreshold: 1.50,
    regressionAlertDelta: -0.20
  };


  const CHANGE_TYPES = [
    "Add / tighten constraints",
    "Add grounding excerpt(s)",
    "Reduce noise (prune/summarize)",
    "Add / improve output schema",
    "Fix ordering (move role/rules higher)",
    "Improve memory (pin decisions)",
    "Clarify the task statement"
  ];

  const SCENARIOS = [
    {
      id: "support",
      name: "Customer Support: Subscription downgrade",
      description: "Answer using policy excerpts + account facts; do not speculate.",
      baseline: {
        role: "You are a customer support agent for [Company]. Your job is to explain account changes clearly and help the customer resolve issues.",
        rules: [
          "Use only provided policy excerpts and Dynamic Facts.",
          "Do not speculate. If information is missing, ask for it.",
          "Be concise and friendly.",
          "Use the required headings."
        ].join("\n"),
        dynamic: [
          "Today’s date: [YYYY-MM-DD]",
          "Account status: [ACTIVE/PAST_DUE/etc]",
          "Plan: [PLAN_NAME]",
          "Last payment: [DATE]",
          "Downgrade event: [DATE]"
        ].join("\n"),
        grounding: [
          "Policy Excerpt 1: [Paste downgrade rule excerpt here]",
          "Policy Excerpt 2: [Paste remediation options excerpt here]"
        ].join("\n"),
        memory: [
          "Pinned facts:",
          "- [Customer says: ...]",
          "Decisions:",
          "- [We will: ...]",
          "Open questions:",
          "- [Need: ...]"
        ].join("\n"),
        format: "Use headings: Explanation / Next Steps / Needed Info",
        request: "Customer asks: “Why was my subscription downgraded?”"
      },
      tests: [
        "Customer: Why was my subscription downgraded last night?",
        "Customer: I updated my card today. When will my plan restore?",
        "Customer: I think this is a mistake—what evidence do you have?",
        "Customer: Can you refund the difference for this billing cycle?",
        "Customer: What exact information do you need from me to fix this?"
      ]
    },
    {
      id: "hr",
      name: "HR Policy Assistant: Vacation carryover",
      description: "Answer grounded in HR policy; avoid legal advice; escalate when policy is silent.",
      baseline: {
        role: "You are an HR policy assistant. You explain policy clearly and neutrally.",
        rules: [
          "Do not provide legal advice.",
          "Use only the HR policy excerpt provided.",
          "If the policy is silent or unclear, say so and escalate to HR.",
          "Keep it scannable."
        ].join("\n"),
        dynamic: [
          "Today’s date: [YYYY-MM-DD]",
          "Employee location: [COUNTRY/STATE]",
          "Employment type: [FULL_TIME/PART_TIME]"
        ].join("\n"),
        grounding: "HR Policy Excerpt:\n- [Paste relevant carryover excerpt here]",
        memory: "Pinned facts:\n- [Any prior HR guidance shared in this run]\nOpen questions:\n- [Anything missing?]",
        format: "Return: bullet answer + 1 sentence summary + escalation note (if needed).",
        request: "Employee: “Can I carry over unused vacation days into next year?”"
      },
      tests: [
        "Employee: Can I carry over unused vacation days into next year?",
        "Employee: How many days can I carry over, exactly?",
        "Employee: Does carryover differ by location or union contract?",
        "Employee: If I leave the company, are unused days paid out?",
        "Employee: Who should I contact if my manager says something different?"
      ]
    },
    {
      id: "ops",
      name: "Ops Incident Triage: Status update",
      description: "Summarize confirmed facts, label assumptions, list hypotheses + next actions.",
      baseline: {
        role: "You are an operations incident analyst.",
        rules: [
          "Do not invent facts.",
          "Label assumptions as assumptions.",
          "Separate confirmed facts vs hypotheses.",
          "Use the required status-update structure."
        ].join("\n"),
        dynamic: [
          "Incident ID: [INC-####]",
          "Severity: [SEV-#]",
          "Start time: [YYYY-MM-DD HH:MM TZ]"
        ].join("\n"),
        grounding: "Incident notes (paste):\n- [Paste notes from monitoring / tickets / chat here]",
        memory: [
          "Confirmed facts so far:",
          "- [ ]",
          "Open questions:",
          "- [ ]"
        ].join("\n"),
        format: "Use headings: Timeline / Current Impact / Hypotheses / Next Actions / Owner Requests",
        request: "Summarize the incident based on the notes above."
      },
      tests: [
        "Create a first status update from the current notes (no speculation).",
        "List 3 hypotheses and label uncertainty levels.",
        "What are the next 5 actions (with owners requested)?",
        "Identify missing data needed to confirm the top hypothesis.",
        "Rewrite the status update to be shorter but keep the structure."
      ]
    }
  ];

  window.ITER_LAB_DATA = {
    RUBRIC_DEFAULT, BLOCKS, CHECKLIST, CHANGE_TYPES, SCENARIOS };
})();
