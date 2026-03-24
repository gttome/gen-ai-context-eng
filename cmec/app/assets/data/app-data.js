export const appData = {
  "app": {
    "name": "Context Engineering Mission Control",
    "shortName": "CEMC",
    "version": "v1.1.8",
    "buildId": "cemc-v1.1.8",
    "tagline": "Repair weak context packages and watch reliability change in real time.",
    "chapter": "Chapter 1 - Foundations of AI Context Engineering",
    "storageKey": "cemc_state_v1",
    "themeKey": "app_theme",
    "defaultTheme": "dark"
  },
  "metrics": [
    {
      "id": "signal",
      "label": "Signal Quality",
      "question": "Did the package get more specific and relevant?",
      "goodHigh": true
    },
    {
      "id": "grounding",
      "label": "Grounding",
      "question": "Is the model anchored in approved facts?",
      "goodHigh": true
    },
    {
      "id": "structure",
      "label": "Structure",
      "question": "Will the answer follow a reusable format?",
      "goodHigh": true
    },
    {
      "id": "continuity",
      "label": "Continuity",
      "question": "Will the model remember the right prior context?",
      "goodHigh": true
    },
    {
      "id": "overload",
      "label": "Overload Risk",
      "question": "Is the package still too noisy or too big?",
      "goodHigh": false
    },
    {
      "id": "readiness",
      "label": "Mission Readiness",
      "question": "Is the package ready for a reliable run?",
      "goodHigh": true
    }
  ],
  "glossary": [
    {
      "term": "Context engineering",
      "definition": "Designing the whole input package so the model sees the right role, facts, memory, constraints, and output shape."
    },
    {
      "term": "Grounding",
      "definition": "Injecting trusted reference information so the model answers from known facts instead of guessing."
    },
    {
      "term": "Memory",
      "definition": "A short controlled summary of prior turns, decisions, or open items that must carry forward."
    },
    {
      "term": "Dynamic facts",
      "definition": "Current values such as today's date, account status, ticket ID, or live operational state."
    },
    {
      "term": "Schema / format constraint",
      "definition": "A required structure for the answer so outputs stay consistent and reusable."
    },
    {
      "term": "Context window",
      "definition": "The finite working memory the model can attend to at once; too much text creates overload."
    }
  ],
  "coachingRules": {
    "highOverload": "The package is still carrying too much noise for the budget. Trim generic background before adding more detail.",
    "lowGrounding": "The answer is still exposed to guessing because approved facts are missing or too weak.",
    "lowStructure": "The package still lacks a strong output pattern, so even a correct answer may arrive in an inconsistent format.",
    "lowContinuity": "This mission depends on prior-turn memory. Add only the memory that matters so the model can stay aligned without dragging in noise.",
    "missionReady": "This package now gives the model clear instructions, useful facts, and manageable token pressure. Review the compare view and debrief to lock in the lesson."
  },
  "scenarios": [
    {
      "id": "support-resolution",
      "family": "Customer support resolution",
      "conceptFocus": [
        "Grounding",
        "Dynamic facts",
        "Output schema",
        "Token budgeting"
      ],
      "patternLens": "grounding",
      "difficulty": "Recommended first run",
      "budget": 220,
      "learningObjective": "See how approved policy excerpts and current account facts improve a customer-facing answer while noise reduction keeps the package inside budget.",
      "whyItMatters": "Chapter 1 teaches that output quality is limited by input quality. This mission makes that visible by contrasting a vague support prompt with a grounded, budget-aware package.",
      "predictionPrompt": "Before changing anything, what is the likeliest failure in the weak package?",
      "predictionOptions": [
        "The model will guess because it lacks approved policy evidence.",
        "The model will ignore the need for a structured customer reply.",
        "The model will be distracted by irrelevant background and become generic."
      ],
      "observeChecklist": [
        "Does the answer cite or clearly use the provided policy excerpts?",
        "Does it explain the downgrade using the current account facts instead of speculation?",
        "Does it follow the requested structure: explanation, next steps, and what is still needed?"
      ],
      "debriefPrompt": "What changed most: specificity, trustworthiness, or consistency? Explain in one or two sentences.",
      "preparedOutputs": {
        "weak": "Your subscription may have changed for a few possible reasons. Please contact support so we can look into your account and help further.",
        "strong": "Based on the downgrade policy and the account facts provided, the plan dropped after the grace period ended on 2026-02-07. Next steps: update payment or choose a new plan. If you need confirmation on billing details, support should verify the last successful payment date."
      },
      "components": [
        {
          "id": "task-frame",
          "label": "Task frame",
          "type": "task",
          "tokenEstimate": 24,
          "priority": "high",
          "includedWeak": true,
          "recommendedStrong": true,
          "content": "Act as a support agent. Explain why the subscription changed and what the customer can do next."
        },
        {
          "id": "friendly-tone",
          "label": "Role + tone",
          "type": "role",
          "tokenEstimate": 16,
          "priority": "medium",
          "includedWeak": true,
          "recommendedStrong": true,
          "content": "Use a calm, concise, friendly tone. Do not speculate."
        },
        {
          "id": "generic-background",
          "label": "Generic company background",
          "type": "noise",
          "tokenEstimate": 58,
          "priority": "low",
          "includedWeak": true,
          "recommendedStrong": false,
          "content": "Our company values customer satisfaction, innovation, and quality support across many industries and subscription options."
        },
        {
          "id": "account-facts",
          "label": "Dynamic account facts",
          "type": "dynamic",
          "tokenEstimate": 44,
          "priority": "high",
          "includedWeak": false,
          "recommendedStrong": true,
          "content": "Current date: 2026-02-07. Account status: payment failed twice. Plan: Pro Monthly. Grace period ended yesterday."
        },
        {
          "id": "policy-excerpts",
          "label": "Approved policy excerpts",
          "type": "grounding",
          "tokenEstimate": 54,
          "priority": "high",
          "includedWeak": false,
          "recommendedStrong": true,
          "content": "Policy excerpt A: After two failed renewal attempts, the account enters a 7-day grace period. Policy excerpt B: After the grace period, the subscription downgrades to Basic until payment is restored."
        },
        {
          "id": "reply-schema",
          "label": "Output schema",
          "type": "schema",
          "tokenEstimate": 18,
          "priority": "high",
          "includedWeak": false,
          "recommendedStrong": true,
          "content": "Answer in 3 sections: Explanation, Next Steps, What We Still Need If Unknown."
        }
      ],
      "recommendedActions": [
        {
          "id": "support-repair-1",
          "label": "Inject policy excerpts",
          "changes": {
            "policy-excerpts": true
          }
        },
        {
          "id": "support-repair-2",
          "label": "Add current account facts",
          "changes": {
            "account-facts": true
          }
        },
        {
          "id": "support-repair-3",
          "label": "Require a clear reply structure",
          "changes": {
            "reply-schema": true
          }
        },
        {
          "id": "support-repair-4",
          "label": "Trim generic company background",
          "changes": {
            "generic-background": false
          }
        }
      ],
      "exploreMore": {
        "title": "Grounding lens",
        "summary": "Grounding reduces guesswork by telling the model which approved facts to use.",
        "notes": [
          "Grounding is strongest when excerpts are short, relevant, and clearly tied to the current task.",
          "Grounding should not drown the request in a giant document dump.",
          "If the excerpts are insufficient, the answer should say so rather than invent missing facts."
        ],
        "harderReplayLabel": "Harder replay: keep the same task but tighten the budget and add one distracting note.",
        "drills": [
          {
            "id": "support-wrong-evidence",
            "title": "Wrong evidence drill",
            "summary": "Keep the customer-facing task but strip out the approved policy and current account facts so the answer leans on generic background.",
            "watch": [
              "Grounding should stay weak or fall.",
              "Signal may look polite but still lack proof.",
              "Notice how confidence without evidence increases guess risk."
            ],
            "changes": {
              "task-frame": true,
              "friendly-tone": true,
              "generic-background": true,
              "account-facts": false,
              "policy-excerpts": false,
              "reply-schema": true
            }
          },
          {
            "id": "support-too-much-context",
            "title": "Too much context drill",
            "summary": "Load every block, including the generic company background, and watch how a fuller package can still become noisier than it needs to be.",
            "watch": [
              "Overload Risk should rise.",
              "Grounding and structure may improve, but not as cleanly as the stronger curated package.",
              "Ask whether every token is still earning its place."
            ],
            "changes": {
              "task-frame": true,
              "friendly-tone": true,
              "generic-background": true,
              "account-facts": true,
              "policy-excerpts": true,
              "reply-schema": true
            }
          },
          {
            "id": "support-poor-structure",
            "title": "Relevant but poorly structured drill",
            "summary": "Give the model the right evidence but remove the explicit reply schema so the answer has facts without consistent organization.",
            "watch": [
              "Grounding should stay higher than the weak package.",
              "Structure should lag because the answer shape is now implicit.",
              "The lesson: relevant context still needs output discipline."
            ],
            "changes": {
              "task-frame": true,
              "friendly-tone": true,
              "generic-background": false,
              "account-facts": true,
              "policy-excerpts": true,
              "reply-schema": false
            }
          }
        ]
      }
    },
    {
      "id": "hr-carryover",
      "family": "HR policy assistant",
      "conceptFocus": [
        "Grounding",
        "Constraints",
        "Format consistency",
        "Escalation rule"
      ],
      "patternLens": "grounding",
      "difficulty": "Core mission",
      "budget": 210,
      "learningObjective": "Show how policy-grounded answers become safer and more reusable when constraints and escalation rules are explicit.",
      "whyItMatters": "Static reading can explain policy grounding, but this mission lets you feel the difference between a generic HR answer and one anchored in the actual rule.",
      "predictionPrompt": "Before changing anything, what is the highest risk in the weak package?",
      "predictionOptions": [
        "The model may give legal advice or speculate beyond the policy.",
        "The model may answer correctly but in an unhelpful blob of text.",
        "The model may miss the need to escalate when the policy is silent."
      ],
      "observeChecklist": [
        "Does the answer reference or quote the policy excerpt?",
        "Does it avoid unsupported legal interpretation?",
        "Does it give a scannable answer with an escalation path if needed?"
      ],
      "debriefPrompt": "Why does a short escalation rule matter even when the policy excerpt looks clear?",
      "preparedOutputs": {
        "weak": "Vacation carryover depends on your manager and local rules. It is usually possible in some circumstances, so check with HR.",
        "strong": "Policy excerpt: unused vacation may carry over up to 5 days with manager approval and must be used by March 31. If your region has a different local addendum or the policy is silent, escalate to HR Operations rather than interpreting the rule yourself."
      },
      "components": [
        {
          "id": "hr-task",
          "label": "Task frame",
          "type": "task",
          "tokenEstimate": 22,
          "priority": "high",
          "includedWeak": true,
          "recommendedStrong": true,
          "content": "Answer an employee question about carrying over unused vacation days into next year."
        },
        {
          "id": "hr-policy",
          "label": "Policy excerpt",
          "type": "grounding",
          "tokenEstimate": 52,
          "priority": "high",
          "includedWeak": false,
          "recommendedStrong": true,
          "content": "Unused vacation may carry over up to 5 days with manager approval. Carried-over days must be used by March 31 of the next calendar year."
        },
        {
          "id": "hr-escalation",
          "label": "If policy is silent, escalate",
          "type": "constraint",
          "tokenEstimate": 20,
          "priority": "high",
          "includedWeak": false,
          "recommendedStrong": true,
          "content": "If the policy excerpt does not resolve the case, direct the employee to HR Operations. Do not improvise legal or regional guidance."
        },
        {
          "id": "hr-format",
          "label": "Short scannable format",
          "type": "schema",
          "tokenEstimate": 16,
          "priority": "high",
          "includedWeak": false,
          "recommendedStrong": true,
          "content": "Use 3 bullets: Answer, Policy Basis, What To Do If Unsure."
        },
        {
          "id": "hr-legal-noise",
          "label": "Irrelevant legal history",
          "type": "noise",
          "tokenEstimate": 60,
          "priority": "low",
          "includedWeak": true,
          "recommendedStrong": false,
          "content": "Long summary of historical labor law disputes and court interpretations that are not part of the current policy excerpt."
        },
        {
          "id": "hr-friendly",
          "label": "Role + tone",
          "type": "role",
          "tokenEstimate": 12,
          "priority": "medium",
          "includedWeak": true,
          "recommendedStrong": true,
          "content": "Be clear, practical, and policy-first."
        }
      ],
      "recommendedActions": [
        {
          "id": "hr-repair-1",
          "label": "Insert the policy excerpt",
          "changes": {
            "hr-policy": true
          }
        },
        {
          "id": "hr-repair-2",
          "label": "Add the escalation rule",
          "changes": {
            "hr-escalation": true
          }
        },
        {
          "id": "hr-repair-3",
          "label": "Require a short bullet format",
          "changes": {
            "hr-format": true
          }
        },
        {
          "id": "hr-repair-4",
          "label": "Remove irrelevant legal history",
          "changes": {
            "hr-legal-noise": false
          }
        }
      ],
      "exploreMore": {
        "title": "Constraint lens",
        "summary": "Constraints keep the model from wandering past what the evidence supports.",
        "notes": [
          "A short escalation rule often prevents confident but unsupported answers.",
          "Grounding and constraints work together: one adds evidence, the other limits inference.",
          "Formatting matters because reusable outputs reduce review time for human teams."
        ],
        "harderReplayLabel": "Harder replay: reintroduce a second irrelevant excerpt and lower the budget.",
        "drills": [
          {
            "id": "hr-wrong-evidence",
            "title": "Wrong evidence drill",
            "summary": "Keep the HR task but remove the actual policy excerpt and escalation rule so the answer leans on broad legal history instead of the active policy.",
            "watch": [
              "Grounding should remain low.",
              "Noise can make the answer sound informed while staying unsafe.",
              "Watch for drift into unsupported legal interpretation."
            ],
            "changes": {
              "hr-task": true,
              "hr-policy": false,
              "hr-escalation": false,
              "hr-format": true,
              "hr-legal-noise": true,
              "hr-friendly": true
            }
          },
          {
            "id": "hr-too-much-context",
            "title": "Too much context drill",
            "summary": "Include every block and test how policy grounding competes with irrelevant legal history when the package gets crowded.",
            "watch": [
              "Overload Risk should rise.",
              "The answer may still be correct but less focused.",
              "Ask which block should be trimmed first."
            ],
            "changes": {
              "hr-task": true,
              "hr-policy": true,
              "hr-escalation": true,
              "hr-format": true,
              "hr-legal-noise": true,
              "hr-friendly": true
            }
          },
          {
            "id": "hr-poor-structure",
            "title": "Relevant but poorly structured drill",
            "summary": "Provide the policy excerpt and escalation rule but remove the scannable output format so the answer loses reusability.",
            "watch": [
              "Grounding should improve.",
              "Structure should stay weaker than the best-practice package.",
              "Look for how format constraints affect reuse."
            ],
            "changes": {
              "hr-task": true,
              "hr-policy": true,
              "hr-escalation": true,
              "hr-format": false,
              "hr-legal-noise": false,
              "hr-friendly": true
            }
          }
        ]
      }
    },
    {
      "id": "incident-triage",
      "family": "Operations incident triage",
      "conceptFocus": [
        "Memory",
        "Structure",
        "No-invention constraint",
        "Selective context"
      ],
      "patternLens": "memory",
      "difficulty": "Core mission",
      "budget": 240,
      "learningObjective": "See how a concise memory block and a clear incident schema improve continuity without dragging in too much old conversation.",
      "whyItMatters": "Multi-turn work often fails because the model forgets what matters or gets buried in history. This mission shows why curated memory beats dumping the whole chat.",
      "predictionPrompt": "Before changing anything, what will hurt this weak package most?",
      "predictionOptions": [
        "The model will invent facts because the constraint is too weak.",
        "The model will miss the current state because key prior-turn memory is absent.",
        "The model will produce a messy summary with no next-action structure."
      ],
      "observeChecklist": [
        "Does the answer summarize only established facts?",
        "Does it separate hypotheses from confirmed observations?",
        "Does it produce explicit next actions in a reusable format?"
      ],
      "debriefPrompt": "Why is a short memory summary better than dropping the entire chat history into the model?",
      "preparedOutputs": {
        "weak": "There may be a network issue or a deployment problem. The team should investigate and gather more information.",
        "strong": "Confirmed: error rates rose at 09:12 UTC after deployment 72B. Hypotheses: rollback mismatch, cache invalidation miss. Next actions: verify rollback status, check cache nodes, confirm customer impact. Unknowns remain clearly separated from facts."
      },
      "components": [
        {
          "id": "ops-task",
          "label": "Task frame",
          "type": "task",
          "tokenEstimate": 26,
          "priority": "high",
          "includedWeak": true,
          "recommendedStrong": true,
          "content": "Summarize the incident, list hypotheses, and name next actions for the operations team."
        },
        {
          "id": "ops-memory",
          "label": "Prior-turn memory block",
          "type": "memory",
          "tokenEstimate": 40,
          "priority": "high",
          "includedWeak": false,
          "recommendedStrong": true,
          "content": "Earlier notes: issue began after deployment 72B at 09:12 UTC; rollback attempt started; customer impact seen in EU region; DB healthy; cache status uncertain."
        },
        {
          "id": "ops-constraint",
          "label": "No invention rule",
          "type": "constraint",
          "tokenEstimate": 18,
          "priority": "high",
          "includedWeak": false,
          "recommendedStrong": true,
          "content": "Do not invent facts. Separate confirmed observations, hypotheses, and next actions."
        },
        {
          "id": "ops-schema",
          "label": "Incident schema",
          "type": "schema",
          "tokenEstimate": 18,
          "priority": "high",
          "includedWeak": false,
          "recommendedStrong": true,
          "content": "Use headings: Confirmed Facts, Hypotheses, Next Actions, Open Questions."
        },
        {
          "id": "ops-noise",
          "label": "Full raw chat log dump",
          "type": "noise",
          "tokenEstimate": 92,
          "priority": "low",
          "includedWeak": true,
          "recommendedStrong": false,
          "content": "Long pasted thread with duplicate guesses, jokes, repeated status updates, and stale notes from earlier false alarms."
        },
        {
          "id": "ops-role",
          "label": "Role + tone",
          "type": "role",
          "tokenEstimate": 12,
          "priority": "medium",
          "includedWeak": true,
          "recommendedStrong": true,
          "content": "Be concise, operational, and explicit about uncertainty."
        }
      ],
      "recommendedActions": [
        {
          "id": "ops-repair-1",
          "label": "Add the prior-turn memory block",
          "changes": {
            "ops-memory": true
          }
        },
        {
          "id": "ops-repair-2",
          "label": "Add a no-invention rule",
          "changes": {
            "ops-constraint": true
          }
        },
        {
          "id": "ops-repair-3",
          "label": "Require an incident schema",
          "changes": {
            "ops-schema": true
          }
        },
        {
          "id": "ops-repair-4",
          "label": "Remove the raw chat dump",
          "changes": {
            "ops-noise": false
          }
        }
      ],
      "exploreMore": {
        "title": "Memory lens",
        "summary": "Memory works best as a short, curated summary of what still matters.",
        "notes": [
          "Long chat history burns budget and mixes important facts with dead ends.",
          "A memory block should preserve decisions, constraints, and open items, not every word.",
          "Good memory supports continuity without pretending the model has unlimited working memory."
        ],
        "harderReplayLabel": "Harder replay: add one contradictory stale note and lower the budget.",
        "drills": [
          {
            "id": "ops-wrong-evidence",
            "title": "Wrong evidence drill",
            "summary": "Remove the prior-turn memory and no-invention rule, then rely on the raw chat dump so the package has activity but weak operational proof.",
            "watch": [
              "Continuity should stay weak.",
              "Noise should make the summary less reliable.",
              "Look for hypotheses that outrun confirmed facts."
            ],
            "changes": {
              "ops-task": true,
              "ops-memory": false,
              "ops-constraint": false,
              "ops-schema": true,
              "ops-noise": true,
              "ops-role": true
            }
          },
          {
            "id": "ops-too-much-context",
            "title": "Too much context drill",
            "summary": "Include all operational context blocks, including the raw chat dump, to see how memory and noise compete inside the same package.",
            "watch": [
              "Continuity may rise, but Overload Risk should rise too.",
              "The best package is often selective, not maximal.",
              "Ask whether the raw chat is helping or diluting the summary."
            ],
            "changes": {
              "ops-task": true,
              "ops-memory": true,
              "ops-constraint": true,
              "ops-schema": true,
              "ops-noise": true,
              "ops-role": true
            }
          },
          {
            "id": "ops-poor-structure",
            "title": "Relevant but poorly structured drill",
            "summary": "Keep the prior-turn memory and operational guardrails but remove the schema so the response has facts without a stable incident format.",
            "watch": [
              "Continuity should improve.",
              "Structure should lag the best-practice package.",
              "Notice how schema turns good content into reusable incident handling."
            ],
            "changes": {
              "ops-task": true,
              "ops-memory": true,
              "ops-constraint": true,
              "ops-schema": false,
              "ops-noise": false,
              "ops-role": true
            }
          }
        ]
      }
    }
  ]
};
