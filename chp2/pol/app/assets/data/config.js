window.POLConfig = {
  "themeStorageKey": "app_theme",
  "stateStorageKey": "pol_state_v1_5_1",
  "feedbackStorageKey": "pol_feedback_v1",
  "walkthroughStorageKey": "pol_walkthrough_seen",
  "readinessBands": [
    { "label": "Not Ready", "min": 0, "color": "var(--danger)" },
    { "label": "Fragile", "min": 35, "color": "var(--warning)" },
    { "label": "Improving", "min": 50, "color": "var(--info)" },
    { "label": "Strong", "min": 70, "color": "var(--success)" },
    { "label": "Mission Ready", "min": 85, "color": "var(--accent)" }
  ],
  "metricOrder": ["Pattern Fit", "Grounding", "Continuity", "Current-State", "Token Discipline"],
  "metricDescriptions": {
    "Pattern Fit": "Did the selected mechanism match the real cause of the weak answer?",
    "Grounding": "Did the package and answer use approved evidence instead of guesswork?",
    "Continuity": "Did the context preserve prior decisions, confirmed facts, and open questions?",
    "Current-State": "Did the package and answer account for the current date, status, or account facts?",
    "Token Discipline": "Did the learner include enough context without bloating the package?"
  }
};
