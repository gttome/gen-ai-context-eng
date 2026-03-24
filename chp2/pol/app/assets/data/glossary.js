window.POLGlossary = {
  "items": [
    {
      "term": "Context engineering",
      "definition": "Deliberately designing the full input package a model sees before it responds."
    },
    {
      "term": "Context window",
      "definition": "The finite token budget available for instructions, facts, memory, examples, and the user request."
    },
    {
      "term": "Grounding / RAG",
      "definition": "Providing relevant reference excerpts so the model answers from known material instead of guessing."
    },
    {
      "term": "Memory",
      "definition": "A controlled summary or durable facts from earlier turns, re-injected to preserve continuity."
    },
    {
      "term": "Dynamic facts",
      "definition": "Current-session or real-time values such as dates, status, IDs, balances, or account state."
    },
    {
      "term": "Context skeleton",
      "definition": "A repeatable structure for role, rules, dynamic facts, grounding, memory, format, and request."
    },
    {
      "term": "Token discipline",
      "definition": "Prioritizing the smallest set of context that still lets the model do reliable work."
    }
  ],
  "skeleton": [
    "System / Role",
    "Rules / Constraints",
    "Dynamic Facts",
    "Grounding Knowledge",
    "Memory",
    "Output Format",
    "User Request"
  ]
};
