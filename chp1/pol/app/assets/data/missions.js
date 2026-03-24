window.POLMissionData = {
  "version": "v1.5.2",
  "buildId": "pol-v1.5.2-score-explanation-limits",
  "appName": "Pattern Orchestrator Lab",
  "chapter": "Chapter 1 \u2014 Foundations of AI Context Engineering",
  "missions": [
    {
      "id": "support-downgrade",
      "title": "Support Downgrade",
      "family": "Customer Support",
      "time": "6\u20138 min",
      "difficulty": "Foundational",
      "dominantMechanism": "grounding",
      "signal": "Policy-grounded explanation",
      "goal": "Explain why the customer was downgraded and what they can do next without speculating.",
      "scenarioBrief": "A customer asks why their subscription was downgraded overnight. The weak state includes the instruction and account facts, but it withholds the exact policy text that determines downgrade timing and restoration options.",
      "userRequest": "Why was my subscription downgraded, and what can I do to restore it?",
      "qualityWatch": "Look for evidence-backed reasoning instead of generic reassurance.",
      "weakState": [
        "The instruction is clear, but the model lacks the policy excerpts that govern downgrade timing.",
        "Account facts are present, so the failure is not mainly about memory.",
        "A good prompt alone will still produce a shaky answer if the policy text is missing."
      ],
      "businessContext": [
        "Customer: Maya Ortiz",
        "Plan: Pro Annual",
        "Last payment attempt failed on 2026-03-11",
        "Promo add-on: AI Assist Launch Bundle"
      ],
      "starterPredictionHint": "If the model does not know the governing rule, it may sound confident without being supportable.",
      "defaultState": {
        "prediction": "",
        "groundingEnabled": false,
        "selectedEvidence": [],
        "memoryEnabled": false,
        "memoryMode": "none",
        "selectedMemory": [],
        "dynamicEnabled": true,
        "selectedFacts": [
          "sf1",
          "sf2"
        ],
        "pastedOutput": "",
        "copied": false,
        "analyzed": false,
        "bonusMode": false
      },
      "evidence": [
        {
          "id": "se1",
          "label": "Grace-period rule",
          "text": "Billing Policy \u00a74.2 \u2014 If payment fails, the subscription enters a 7-day grace period. If payment is still unresolved after the grace period, the account automatically downgrades to the Standard plan.",
          "tokens": 85
        },
        {
          "id": "se2",
          "label": "Restoration rule",
          "text": "Billing Policy \u00a74.3 \u2014 Customers who restore payment within 30 days may return to their prior paid plan. Restoring payment does not automatically reinstate expired promotional bundles.",
          "tokens": 82
        },
        {
          "id": "se3",
          "label": "Support guidance",
          "text": "Support Playbook \u2014 Agents should explain the policy in plain language, avoid speculation about system errors, and clearly state what information is confirmed versus unknown.",
          "tokens": 62
        }
      ],
      "memory": [
        {
          "id": "sm1",
          "label": "Prior chat summary",
          "text": "Yesterday the customer said they did not intentionally cancel and asked whether the downgrade was a bug.",
          "tokens": 42
        },
        {
          "id": "sm2",
          "label": "Agent preference",
          "text": "Use a calm, concise tone and separate explanation from next steps.",
          "tokens": 26
        }
      ],
      "dynamicFacts": [
        {
          "id": "sf1",
          "label": "Payment timing",
          "text": "Today\u2019s date: 2026-03-16. Failed payment date: 2026-03-11.",
          "tokens": 20
        },
        {
          "id": "sf2",
          "label": "Account state",
          "text": "Current plan shown in the account: Standard. Prior plan: Pro Annual.",
          "tokens": 22
        },
        {
          "id": "sf3",
          "label": "Promo state",
          "text": "Promotional add-on AI Assist Launch Bundle is marked expired after downgrade.",
          "tokens": 18
        }
      ],
      "memoryModes": [
        "none",
        "rolling",
        "pinned"
      ],
      "outputFormat": "Return sections: Explanation / Next Steps / What We Know",
      "tokenBudget": 420,
      "recommendedState": {
        "prediction": "grounding",
        "groundingEnabled": true,
        "selectedEvidence": [
          "se1",
          "se2",
          "se3"
        ],
        "memoryEnabled": false,
        "memoryMode": "none",
        "selectedMemory": [],
        "dynamicEnabled": true,
        "selectedFacts": [
          "sf1",
          "sf2",
          "sf3"
        ]
      },
      "missionFocus": [
        "input quality vs output quality",
        "engineered context components",
        "RAG grounding",
        "failure diagnosis"
      ],
      "baselineOutput": "It looks like your subscription may have been downgraded because of a billing issue. Usually accounts are restored after payment is fixed, so you can try updating your payment method and contacting support if the change seems wrong. I\u2019m sorry this happened.",
      "sampleImprovedOutput": "Explanation\\nYour account shows a failed payment on 2026-03-11 and the current plan is now Standard. Under Billing Policy \u00a74.2, accounts automatically downgrade after a 7-day unresolved grace period, which explains the overnight plan change.\\n\\nNext Steps\\n1. Restore payment to request return to the prior Pro Annual plan within 30 days under Policy \u00a74.3.\\n2. Be aware that the expired AI Assist Launch Bundle may not automatically return even after payment is fixed.\\n\\nWhat We Know\\nWe have confirmed the failed payment date, the current plan state, and the applicable downgrade/restoration rules. We do not yet have evidence of a platform bug.",
      "challenge": {
        "label": "Harder replay: fewer cues",
        "description": "Replay with the support guidance excerpt hidden. You must still keep the answer concise and avoid speculation.",
        "tokenBudget": 360,
        "lockedEvidence": [
          "se1",
          "se2"
        ],
        "strongThreshold": 82
      }
    },
    {
      "id": "hr-carryover",
      "title": "Carryover Decision",
      "family": "HR Policy",
      "time": "6\u20138 min",
      "difficulty": "Intermediate",
      "dominantMechanism": "dynamic",
      "signal": "Current-state accuracy",
      "goal": "Answer an employee\u2019s carryover question using policy plus the current employee facts that determine eligibility.",
      "scenarioBrief": "The weak state already contains the policy excerpt, but it withholds the current date and employee-specific facts that decide whether carryover applies this year.",
      "userRequest": "Can I carry over my unused vacation days into next year?",
      "qualityWatch": "Look for answers that apply the rule to the employee\u2019s actual situation instead of quoting policy in the abstract.",
      "weakState": [
        "The policy text is present, so pure grounding is not enough to finish the job.",
        "The missing mechanism is the current-state detail needed to apply the rule correctly.",
        "This mission surfaces that dynamic facts can matter even when the instruction is strong and the policy is available."
      ],
      "businessContext": [
        "Employee: Jordan Patel",
        "Region: US salaried",
        "Hire date: 2026-11-12",
        "Unused vacation balance: 32 hours"
      ],
      "starterPredictionHint": "Ask what the model still cannot know from the policy text alone.",
      "defaultState": {
        "prediction": "",
        "groundingEnabled": true,
        "selectedEvidence": [
          "he1"
        ],
        "memoryEnabled": false,
        "memoryMode": "none",
        "selectedMemory": [],
        "dynamicEnabled": false,
        "selectedFacts": [],
        "pastedOutput": "",
        "copied": false,
        "analyzed": false,
        "bonusMode": false
      },
      "evidence": [
        {
          "id": "he1",
          "label": "Carryover policy",
          "text": "HR Vacation Policy \u2014 US salaried employees hired on or before October 1 may carry over up to 40 hours into the next calendar year. Employees hired after October 1 receive year-end payout for unused accrued hours instead of carryover.",
          "tokens": 88
        },
        {
          "id": "he2",
          "label": "Escalation rule",
          "text": "If policy does not clearly address the employee\u2019s classification or local rule, direct the employee to HR Operations for confirmation.",
          "tokens": 44
        }
      ],
      "memory": [
        {
          "id": "hm1",
          "label": "Conversation summary",
          "text": "The employee asked this question after seeing a year-end balance notice in the HR portal.",
          "tokens": 20
        }
      ],
      "dynamicFacts": [
        {
          "id": "hf1",
          "label": "Current date",
          "text": "Today\u2019s date: 2026-12-29.",
          "tokens": 10
        },
        {
          "id": "hf2",
          "label": "Hire-date fact",
          "text": "Employee hire date: 2026-11-12, which is after October 1.",
          "tokens": 18
        },
        {
          "id": "hf3",
          "label": "Balance fact",
          "text": "Unused vacation balance: 32 hours.",
          "tokens": 8
        },
        {
          "id": "hf4",
          "label": "Employee class",
          "text": "Employee classification: US salaried.",
          "tokens": 8
        }
      ],
      "memoryModes": [
        "none",
        "rolling",
        "pinned"
      ],
      "outputFormat": "Return: Answer / Why / Escalation Needed?",
      "tokenBudget": 320,
      "recommendedState": {
        "prediction": "dynamic",
        "groundingEnabled": true,
        "selectedEvidence": [
          "he1",
          "he2"
        ],
        "memoryEnabled": false,
        "memoryMode": "none",
        "selectedMemory": [],
        "dynamicEnabled": true,
        "selectedFacts": [
          "hf1",
          "hf2",
          "hf3",
          "hf4"
        ]
      },
      "missionFocus": [
        "dynamic facts",
        "context skeleton",
        "failure diagnosis",
        "iterative improvement"
      ],
      "baselineOutput": "You may be able to carry over up to 40 hours into next year under the vacation policy. Check with HR if you need a final determination.",
      "sampleImprovedOutput": "Answer\\nBased on the current employee facts, you would not carry these 32 hours into next year.\\n\\nWhy\\nThe policy allows carryover for US salaried employees hired on or before October 1. Your hire date is 2026-11-12, which places you in the year-end payout path instead of carryover.\\n\\nEscalation Needed?\\nNo immediate escalation is required unless your employee classification or hire date is incorrect in the system.",
      "challenge": {
        "label": "Harder replay: ambiguity",
        "description": "Replay with the employee classification fact hidden. Decide whether you should answer directly or escalate.",
        "tokenBudget": 280,
        "lockedEvidence": [
          "he1",
          "he2"
        ],
        "strongThreshold": 80
      }
    },
    {
      "id": "incident-triage",
      "title": "Incident Triage Update",
      "family": "Operations",
      "time": "7\u20139 min",
      "difficulty": "Intermediate",
      "dominantMechanism": "memory",
      "signal": "Continuity and non-invention",
      "goal": "Summarize an active incident using confirmed facts, prior actions, and clear open questions without inventing missing details.",
      "scenarioBrief": "The weak state includes the current incident ID and severity, but it omits the rolling memory of what has already been confirmed and tried. Without that continuity, the model produces a generic update with weak next steps.",
      "userRequest": "Summarize the incident for the next status update.",
      "qualityWatch": "Look for continuity, explicit open questions, and assumptions that are clearly labeled.",
      "weakState": [
        "The model knows the incident exists right now, but it lacks the important trail of what already happened.",
        "This mission shows why raw current-state data is not the same as continuity.",
        "The fix is to provide a controlled memory block rather than pasting the entire chat log."
      ],
      "businessContext": [
        "Incident ID: INC-1842",
        "Severity: SEV-2",
        "Affected service: Customer login API"
      ],
      "starterPredictionHint": "Ask whether the model can distinguish confirmed facts from unanswered questions without a memory block.",
      "defaultState": {
        "prediction": "",
        "groundingEnabled": false,
        "selectedEvidence": [],
        "memoryEnabled": false,
        "memoryMode": "none",
        "selectedMemory": [],
        "dynamicEnabled": true,
        "selectedFacts": [
          "if1",
          "if2"
        ],
        "pastedOutput": "",
        "copied": false,
        "analyzed": false,
        "bonusMode": false
      },
      "evidence": [
        {
          "id": "ie1",
          "label": "Status update format",
          "text": "Status updates should use the structure Timeline / Current Impact / Hypotheses / Next Actions / Owner Requests.",
          "tokens": 38
        }
      ],
      "memory": [
        {
          "id": "im1",
          "label": "Confirmed facts",
          "text": "Confirmed facts: error rate increased from 2% to 31% at 09:14 CT; rollback of the auth proxy at 09:26 CT did not resolve the issue; support volume increased in parallel.",
          "tokens": 54
        },
        {
          "id": "im2",
          "label": "Open questions",
          "text": "Open questions: whether the issue is isolated to one region; whether recent cache invalidation jobs contributed; whether database latency is causal or incidental.",
          "tokens": 40
        },
        {
          "id": "im3",
          "label": "Actions already taken",
          "text": "Actions already taken: auth proxy rollback, cache warm-up, and temporary customer comms draft.",
          "tokens": 24
        }
      ],
      "dynamicFacts": [
        {
          "id": "if1",
          "label": "Current timestamp",
          "text": "Current time: 10:05 CT.",
          "tokens": 6
        },
        {
          "id": "if2",
          "label": "Current status",
          "text": "Incident INC-1842 remains open at SEV-2.",
          "tokens": 10
        },
        {
          "id": "if3",
          "label": "Customer impact",
          "text": "Users may experience intermittent login failures and delayed token refresh.",
          "tokens": 15
        }
      ],
      "memoryModes": [
        "none",
        "rolling",
        "pinned"
      ],
      "outputFormat": "Return: Timeline / Current Impact / Hypotheses / Next Actions / Owner Requests",
      "tokenBudget": 360,
      "recommendedState": {
        "prediction": "memory",
        "groundingEnabled": true,
        "selectedEvidence": [
          "ie1"
        ],
        "memoryEnabled": true,
        "memoryMode": "rolling",
        "selectedMemory": [
          "im1",
          "im2",
          "im3"
        ],
        "dynamicEnabled": true,
        "selectedFacts": [
          "if1",
          "if2",
          "if3"
        ]
      },
      "missionFocus": [
        "memory",
        "structured output",
        "do-not-invent constraint",
        "iterative diagnosis"
      ],
      "baselineOutput": "An incident is affecting login and the team is investigating. Users may be impacted, and engineers are working on mitigation. We will share more updates soon.",
      "sampleImprovedOutput": "Timeline\\nAt 09:14 CT the login API error rate rose from 2% to 31%. A rollback of the auth proxy at 09:26 CT did not resolve the issue, and support volume increased in parallel.\\n\\nCurrent Impact\\nINC-1842 remains open at SEV-2. Users are experiencing intermittent login failures and delayed token refresh.\\n\\nHypotheses\\nPossible contributors include regional concentration, recent cache invalidation jobs, or database latency. These remain hypotheses, not confirmed causes.\\n\\nNext Actions\\nContinue regional isolation checks, review cache job timing, and compare database latency to the incident timeline.\\n\\nOwner Requests\\nEngineering owners should confirm regional scope and update whether database latency is causal or incidental.",
      "challenge": {
        "label": "Harder replay: fewer memory cues",
        "description": "Replay with only confirmed facts pinned. Preserve clarity about what remains hypothesis versus fact.",
        "tokenBudget": 300,
        "lockedEvidence": [
          "ie1"
        ],
        "strongThreshold": 84
      }
    },
    {
      "id": "contract-activation",
      "title": "Contract Activation Exception",
      "family": "Revenue Operations",
      "time": "7\u20139 min",
      "difficulty": "Intermediate",
      "dominantMechanism": "mixed",
      "signal": "Grounding + current-state judgment",
      "goal": "Decide whether premium features can be restored today by combining the contract rule with the current activation status.",
      "scenarioBrief": "The weak state has some account facts and some contract language, but neither source alone is enough. The answer is only reliable when the contract rule and current status are used together.",
      "userRequest": "Can we turn premium analytics back on for Acme today?",
      "qualityWatch": "Look for answers that tie the contract rule to the current system status instead of treating either one as sufficient by itself.",
      "weakState": [
        "The contract language matters, but policy alone cannot tell you whether activation can happen today.",
        "The current CRM and billing facts matter, but status alone cannot override the signed-amendment rule.",
        "This mission teaches a mixed diagnosis: grounding plus dynamic facts are both required."
      ],
      "businessContext": [
        "Account: Acme Manufacturing",
        "Feature set: Premium analytics",
        "Request owner: Revenue operations manager",
        "Channel: Internal Slack escalation"
      ],
      "starterPredictionHint": "Ask whether a good answer needs both the contract rule and the current account state at the same time.",
      "defaultState": {
        "prediction": "",
        "groundingEnabled": false,
        "selectedEvidence": [],
        "memoryEnabled": false,
        "memoryMode": "none",
        "selectedMemory": [],
        "dynamicEnabled": false,
        "selectedFacts": [],
        "pastedOutput": "",
        "copied": false,
        "analyzed": false,
        "bonusMode": false
      },
      "evidence": [
        {
          "id": "ce1",
          "label": "Signed-amendment activation rule",
          "text": "Enterprise Activation Rule \u2014 Premium analytics may be restored only after a signed amendment is fully executed and the account is marked 'Billing Sync Complete.' A signed amendment by itself does not authorize same-day restoration when billing sync remains pending.",
          "tokens": 78
        },
        {
          "id": "ce2",
          "label": "Escalation exception",
          "text": "If billing sync remains pending for more than 24 hours after execution, Revenue Operations may request a temporary manual restore from Platform Ops with contract and account proof attached.",
          "tokens": 46
        }
      ],
      "memory": [
        {
          "id": "cm1",
          "label": "Prior account note",
          "text": "Yesterday's note: customer promised the amendment would be signed before noon, but operations should wait for system confirmation before restoring features.",
          "tokens": 30
        }
      ],
      "dynamicFacts": [
        {
          "id": "cf1",
          "label": "Execution timestamp",
          "text": "Signed amendment execution time: 2026-03-16 09:18 CT.",
          "tokens": 12
        },
        {
          "id": "cf2",
          "label": "Current billing status",
          "text": "Current account status: Billing Sync Pending as of 2026-03-16 10:42 CT.",
          "tokens": 14
        },
        {
          "id": "cf3",
          "label": "Platform access state",
          "text": "Premium analytics remains disabled in the production admin console.",
          "tokens": 10
        },
        {
          "id": "cf4",
          "label": "24-hour threshold",
          "text": "The signed amendment is less than 24 hours old, so the manual-restore exception threshold has not been reached.",
          "tokens": 18
        }
      ],
      "memoryModes": [
        "none",
        "rolling",
        "pinned"
      ],
      "outputFormat": "Return: Answer / Why / What to do next",
      "tokenBudget": 340,
      "recommendedState": {
        "prediction": "mixed",
        "groundingEnabled": true,
        "selectedEvidence": [
          "ce1",
          "ce2"
        ],
        "memoryEnabled": false,
        "memoryMode": "none",
        "selectedMemory": [],
        "dynamicEnabled": true,
        "selectedFacts": [
          "cf1",
          "cf2",
          "cf3",
          "cf4"
        ]
      },
      "missionFocus": [
        "mixed diagnosis",
        "grounding + dynamic facts",
        "contract rule application",
        "current-state gating"
      ],
      "baselineOutput": "The amendment has been signed, so we should be able to turn premium analytics back on today. If the system has not updated yet, operations can probably restore it manually and verify billing later.",
      "sampleImprovedOutput": "Answer\nNot yet. Premium analytics should stay disabled today because the signed amendment alone does not authorize restoration while Billing Sync is still pending.\n\nWhy\nThe activation rule requires both a fully executed amendment and an account state of Billing Sync Complete. As of 10:42 CT the amendment is signed, but the account still shows Billing Sync Pending and the feature remains disabled in the admin console. The temporary manual-restore exception also does not apply yet because the amendment is less than 24 hours old.\n\nWhat to do next\nWait for billing sync to complete, then restore the feature. If sync is still pending after 24 hours, attach the contract and account evidence and escalate to Platform Ops for the manual-restore exception.",
      "challenge": {
        "label": "Harder replay: hide the exception rule",
        "description": "Replay with only the core activation rule visible. The answer should still avoid promising same-day restoration.",
        "tokenBudget": 300,
        "lockedEvidence": [
          "ce1"
        ],
        "strongThreshold": 84
      }
    }
  ]
};
