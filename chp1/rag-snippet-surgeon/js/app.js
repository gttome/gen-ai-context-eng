// RAG Snippet Surgeon — Iteration 2 (v0.3.0)
// Mobile-first, no-build, static data (no external services).

(() => {
  "use strict";

  const STORAGE_KEY = "rss_state_v0_3";
  const STORAGE_KEY_OLD = "rss_state_v0_2";
  const STORAGE_KEY_OLDER = "rss_state_v0_1";

  const BUDGET_TARGET_TOKENS = 320;
  const BUDGET_HARD_TOKENS = 480;

  // ---- Data (static, local) ----
  // Tags are intentionally simple so scoring is explainable.
  const questionCards = [
    {
      id: "q_rag_basics",
      title: "What is RAG used for?",
      prompt: "Explain RAG (retrieval-augmented generation) and when to use it.",
      requiredEvidenceTags: ["rag", "grounding"]
    },
    {
      id: "q_pitfall_dumping",
      title: "What is the #1 RAG pitfall?",
      prompt: "Identify the common RAG pitfall and the fix.",
      requiredEvidenceTags: ["pitfall", "token-budget", "retrieve"]
    },
    {
      id: "q_use_only_provided",
      title: "How do you force grounded answers?",
      prompt: "Write the constraint that forces the model to use only provided excerpts and say when evidence is insufficient.",
      requiredEvidenceTags: ["constraint", "insufficient"]
    },
    {
      id: "q_better_search",
      title: "Why did retrieval fail?",
      prompt: "Diagnose a retrieval failure caused by irrelevant excerpts and propose a better query.",
      requiredEvidenceTags: ["retrieve", "relevance", "fix"]
    },
    {
      id: "q_minimal_excerpts",
      title: "How many excerpts should you insert?",
      prompt: "Recommend how many short excerpts to retrieve and why (token budget).",
      requiredEvidenceTags: ["token-budget", "retrieve", "minimal"]
    }
  ];

  const excerpts = [
    {
      id: "e_rag_def",
      title: "RAG definition (grounded answers)",
      source: "Chapter concept",
      tags: ["rag", "grounding"],
      text:
        "Retrieval-augmented generation (RAG) is a workflow where you look up relevant passages from an approved knowledge source and insert them into the model’s context so it answers using those passages instead of guessing."
    },
    {
      id: "e_rag_steps",
      title: "RAG steps (no code)",
      source: "Chapter concept",
      tags: ["rag", "retrieve"],
      text:
        "RAG steps: start with the user question, retrieve 2–6 short relevant excerpts, place them in a Grounding Knowledge block, then instruct the model to answer using only those excerpts and to say when they are insufficient."
    },
    {
      id: "e_pitfall_dump",
      title: "Pitfall: dumping whole docs",
      source: "Chapter concept",
      tags: ["pitfall", "token-budget"],
      text:
        "Typical pitfall: dumping entire documents instead of short excerpts. This wastes token budget and increases distraction. Fix: retrieve only the few short passages that directly support the answer."
    },
    {
      id: "e_relevance_fix",
      title: "Pitfall: irrelevant retrieval",
      source: "Chapter concept",
      tags: ["relevance", "fix", "retrieve"],
      text:
        "Another pitfall: retrieving irrelevant text because search terms don’t match intent. Fix by rewriting the query to match what the user is actually asking and retrieving only the excerpts that support that intent."
    },
    {
      id: "e_use_only_rule",
      title: "Constraint: use only provided excerpts",
      source: "Chapter concept",
      tags: ["constraint", "insufficient"],
      text:
        "Rule: Use only the provided excerpts as sources. If the excerpts do not contain the needed information, say so explicitly and list what evidence is missing (what to retrieve next)."
    },
    {
      id: "e_token_budget",
      title: "Context window = token budget",
      source: "Chapter concept",
      tags: ["token-budget", "minimal"],
      text:
        "Treat the context window like a finite working memory. Include only what is required for this turn. Too much context can dilute attention and reduce answer quality even before the hard token limit."
    },
    {
      id: "e_overload_symptoms",
      title: "Overload symptoms",
      source: "Chapter concept",
      tags: ["token-budget"],
      text:
        "Too much context can make the model focus on irrelevant parts, ignore the latest instruction, or fixate on older details. Prune, summarize, and retrieve short excerpts instead of pasting everything."
    },

    // Distractors (intentionally tempting but not always helpful)
    {
      id: "e_finetune",
      title: "Fine-tuning (distractor)",
      source: "Decision guide",
      tags: ["distractor"],
      text:
        "Fine-tuning changes the model’s weights using labeled training data to produce consistent behavior across many similar tasks."
    },
    {
      id: "e_rlhf",
      title: "Reinforcement learning (distractor)",
      source: "Concept note",
      tags: ["distractor"],
      text:
        "Reinforcement learning updates model behavior through training loops driven by reward signals."
    },
    {
      id: "e_dynamic_facts",
      title: "Dynamic facts block (distractor)",
      source: "Pattern note",
      tags: ["distractor"],
      text:
        "Dynamic facts are real-time or session-specific values like today’s date or ticket status that you inject into context when tasks depend on “now.”"
    },
    {
      id: "e_memory",
      title: "Memory types (distractor)",
      source: "Pattern note",
      tags: ["distractor"],
      text:
        "Memory for multi-turn work can be a rolling summary, pinned facts, or retrieval memory, re-injected when needed."
    },

    // Additional mixed snippets
    {
      id: "e_query_rewrite",
      title: "Query rewrite checklist",
      source: "RAG practice",
      tags: ["retrieve", "fix"],
      text:
        "Rewrite retrieval queries by: (1) restating the user’s intent, (2) naming the specific artifact type (policy, FAQ, manual), (3) adding the key entities, and (4) removing ambiguous words."
    },
    {
      id: "e_min_excerpts",
      title: "2–6 excerpts guideline",
      source: "RAG practice",
      tags: ["retrieve", "minimal", "token-budget"],
      text:
        "A practical rule: retrieve 2–6 short excerpts. Fewer may miss evidence; more usually wastes tokens and introduces noise. Prefer short passages that directly support the answer."
    },
    {
      id: "e_insufficient_phrase",
      title: "Insufficiency language (template)",
      source: "Template",
      tags: ["insufficient", "constraint"],
      text:
        "If evidence is missing, respond: “The provided excerpts do not contain [missing item]. I need an excerpt that covers [evidence needed].” Then ask for or retrieve that specific evidence."
    }
  ];

  // ---- State ----
  const state = {
    selectedQuestionId: null,
    selectedExcerptIds: [],
    excerptOverrides: {}, // { [excerptId]: { trimmedText: string } }
    ruleOnlyProvided: true,
    scalpelMode: false,
    lastRun: null
  };

  // ---- DOM ----
  const el = {};

  function cacheDom() {
    el.questionGrid = document.getElementById("questionGrid");
    el.excerptGrid = document.getElementById("excerptGrid");
    el.searchBox = document.getElementById("searchBox");
    el.tagFilter = document.getElementById("tagFilter");
    el.relevanceFilter = document.getElementById("relevanceFilter");

    el.ruleOnlyProvided = document.getElementById("ruleOnlyProvided");
    el.scalpelMode = document.getElementById("scalpelMode");

    el.selectedCount = document.getElementById("selectedCount");
    el.tokenEstimate = document.getElementById("tokenEstimate");
    el.budgetBar = document.getElementById("budgetBar");
    el.budgetLabel = document.getElementById("budgetLabel");


    el.noiseBar = document.getElementById("noiseBar");
    el.noiseLabel = document.getElementById("noiseLabel");

    el.btnSimulate = document.getElementById("btnSimulate");
    el.simulateHint = document.getElementById("simulateHint");

    el.resultBanner = document.getElementById("resultBanner");
    el.resultPill = document.getElementById("resultPill");
    el.resultSummary = document.getElementById("resultSummary");
    el.groundingBlock = document.getElementById("groundingBlock");
    el.answerStub = document.getElementById("answerStub");
    el.scoreValue = document.getElementById("scoreValue");
    el.scoreWhy = document.getElementById("scoreWhy");
    el.scoreBadge = document.getElementById("scoreBadge");
    el.coverageList = document.getElementById("coverageList");

    el.btnCopyGrounding = document.getElementById("btnCopyGrounding");
    el.btnDownloadTxt = document.getElementById("btnDownloadTxt");
    el.btnReset = document.getElementById("btnReset");
    el.btnExportSession = document.getElementById("btnExportSession");
    el.btnImportSession = document.getElementById("btnImportSession");
    el.importSessionFile = document.getElementById("importSessionFile");


    // Modal
    el.modal = document.getElementById("scalpelModal");
    el.btnCloseModal = document.getElementById("btnCloseModal");
    el.btnSaveTrim = document.getElementById("btnSaveTrim");
    el.btnResetTrim = document.getElementById("btnResetTrim");
    el.btnAutoTrim = document.getElementById("btnAutoTrim");
    el.scalpelText = document.getElementById("scalpelText");
    el.scalpelMeta = document.getElementById("scalpelMeta");
  }

  // ---- Helpers ----
  function uniq(arr) {
    return Array.from(new Set(arr));
  }

  function tokenizeEstimate(str) {
    // Heuristic: ~4 chars per token (rough).
    return Math.max(1, Math.ceil((str || "").length / 4));
  }

  function countWords(str) {
    const t = String(str || "").trim();
    if (!t) return 0;
    return t.split(/\s+/).filter(Boolean).length;
  }

  function getQuestion() {
    return questionCards.find(q => q.id === state.selectedQuestionId) || null;
  }

  function getExcerptById(id) {
    return excerpts.find(e => e.id === id) || null;
  }

  function getExcerptText(excerpt) {
    const ov = state.excerptOverrides[excerpt.id];
    if (ov && typeof ov.trimmedText === "string" && ov.trimmedText.trim().length) {
      return ov.trimmedText.trim();
    }
    return excerpt.text;
  }

  function excerptTokenEstimate(excerpt) {
    return tokenizeEstimate(getExcerptText(excerpt));
  }

  function overlapCount(a, b) {
    const setB = new Set(b);
    let c = 0;
    for (const x of a) if (setB.has(x)) c++;
    return c;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function loadState() {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      let sourceKey = STORAGE_KEY;

      // migrate forward if needed
      if (!raw) { raw = localStorage.getItem(STORAGE_KEY_OLD); sourceKey = STORAGE_KEY_OLD; }
      if (!raw) { raw = localStorage.getItem(STORAGE_KEY_OLDER); sourceKey = STORAGE_KEY_OLDER; }
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;

      // Validate question selection
      const qid = parsed.selectedQuestionId || null;
      state.selectedQuestionId = questionCards.some(q => q.id === qid) ? qid : null;

      // Validate excerpt selections
      const exIds = Array.isArray(parsed.selectedExcerptIds) ? parsed.selectedExcerptIds : [];
      const valid = exIds.filter(id => excerpts.some(e => e.id === id));
      state.selectedExcerptIds = uniq(valid).slice(0, 6);

      // Validate overrides
      const ov = (parsed.excerptOverrides && typeof parsed.excerptOverrides === "object") ? parsed.excerptOverrides : {};
      const cleanOv = {};
      Object.keys(ov).forEach(k => {
        if (!excerpts.some(e => e.id === k)) return;
        const v = ov[k];
        if (v && typeof v === "object" && typeof v.trimmedText === "string") {
          cleanOv[k] = { trimmedText: v.trimmedText };
        }
      });
      state.excerptOverrides = cleanOv;

      state.ruleOnlyProvided = parsed.ruleOnlyProvided !== false;
      state.scalpelMode = parsed.scalpelMode === true;
      state.lastRun = parsed.lastRun || null;

      // If we loaded from an older key, save forward for next run.
      if (sourceKey !== STORAGE_KEY) {
        saveState();
      }
    } catch (_) {}
  }
  function renderQuestions() {
    if (!el.questionGrid) return;
    el.questionGrid.innerHTML = "";

    questionCards.forEach(q => {
      const card = document.createElement("div");
      card.className = "q-card";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-selected", String(q.id === state.selectedQuestionId));
      card.setAttribute("data-id", q.id);

      const title = document.createElement("div");
      title.className = "q-card-title";
      title.textContent = q.title;

      const body = document.createElement("p");
      body.className = "q-card-body";
      body.textContent = q.prompt;

      const tags = document.createElement("div");
      tags.className = "tag-row";
      q.requiredEvidenceTags.forEach(t => {
        const chip = document.createElement("span");
        chip.className = "chip";
        chip.textContent = t;
        tags.appendChild(chip);
      });

      card.appendChild(title);
      card.appendChild(body);
      card.appendChild(tags);

      card.addEventListener("click", () => selectQuestion(q.id));
      card.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          selectQuestion(q.id);
        }
      });

      el.questionGrid.appendChild(card);
    });
  }

  function selectQuestion(qid) {
    state.selectedQuestionId = qid;
    saveState();
    renderQuestions();
    renderExcerpts();
    updateStatsAndButtons();
    clearOutputsSoft();
  }

  // ---- Render: Excerpts ----
  function getAllTagsForFilter() {
    const tags = [];
    excerpts.forEach(e => e.tags.forEach(t => tags.push(t)));
    return uniq(tags).sort((a,b) => a.localeCompare(b));
  }

  function initTagFilter() {
    if (!el.tagFilter) return;
    const tags = getAllTagsForFilter();

    // preserve existing selection if possible
    const current = el.tagFilter.value || "__all__";
    el.tagFilter.innerHTML = '<option value="__all__">All tags</option>';

    tags.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      el.tagFilter.appendChild(opt);
    });

    if (tags.includes(current)) el.tagFilter.value = current;
  }

  function passesFilters(excerpt) {
    const q = getQuestion();
    const search = (el.searchBox && el.searchBox.value || "").trim().toLowerCase();
    const tag = (el.tagFilter && el.tagFilter.value) || "__all__";

    const text = (excerpt.title + " " + excerpt.source + " " + excerpt.tags.join(" ") + " " + getExcerptText(excerpt)).toLowerCase();

    const matchSearch = !search || text.includes(search);
    const matchTag = tag === "__all__" || excerpt.tags.includes(tag);

    const relMode = (el.relevanceFilter && el.relevanceFilter.value) || "__all__";
    let matchRel = true;
    if (q && relMode !== "__all__") {
      const overlap = overlapCount(excerpt.tags, q.requiredEvidenceTags);
      const isRelevant = overlap > 0;
      if (relMode === "relevant") matchRel = isRelevant;
      if (relMode === "distractor") matchRel = !isRelevant;
    }

    return matchSearch && matchTag && matchRel && !!q;
  }

  function renderExcerpts() {
    if (!el.excerptGrid) return;

    initTagFilter();
    el.excerptGrid.innerHTML = "";

    const q = getQuestion();
    if (!q) {
      el.excerptGrid.innerHTML = '<div class="muted">Select a question above to load the excerpt library.</div>';
      return;
    }

    const list = excerpts.filter(e => passesFilters(e));
    if (!list.length) {
      el.excerptGrid.innerHTML = '<div class="muted">No excerpts match your filters.</div>';
      return;
    }

    list.forEach(ex => {
      const card = document.createElement("div");
      card.className = "e-card";
      const isSel = state.selectedExcerptIds.includes(ex.id);
      if (isSel) card.classList.add("selected");

      const titleRow = document.createElement("div");
      titleRow.className = "e-title-row";

      const title = document.createElement("div");
      title.className = "e-title";
      title.textContent = ex.title;

      const qLocal = getQuestion();
      if (qLocal) {
        const overlap = overlapCount(ex.tags, qLocal.requiredEvidenceTags);
        const badge = document.createElement("span");
        badge.className = overlap > 0 ? "badge badge-relevant" : "badge badge-distractor";
        badge.textContent = overlap > 0 ? "Relevant" : "Distractor";
        titleRow.appendChild(title);
        titleRow.appendChild(badge);
      } else {
        titleRow.appendChild(title);
      }

      const meta = document.createElement("div");
      meta.className = "e-meta";
      const isTrimmed = !!(state.excerptOverrides[ex.id] && typeof state.excerptOverrides[ex.id].trimmedText === "string" && state.excerptOverrides[ex.id].trimmedText.trim().length);
      meta.textContent = `${ex.source} • ~${excerptTokenEstimate(ex)} tokens${isTrimmed ? " • trimmed" : ""}`;

      const tagsRow = document.createElement("div");
      tagsRow.className = "tag-row";
      ex.tags.forEach(t => {
        const chip = document.createElement("span");
        chip.className = "chip";
        chip.textContent = t;
        tagsRow.appendChild(chip);
      });

      const text = document.createElement("p");
      text.className = "e-text";
      text.textContent = getExcerptText(ex);

      const actions = document.createElement("div");
      actions.className = "e-actions";

      const btnSel = document.createElement("button");
      btnSel.type = "button";
      btnSel.className = "btn btn-secondary";
      btnSel.textContent = isSel ? "Remove" : "Select";
      btnSel.addEventListener("click", () => toggleExcerpt(ex.id));

      actions.appendChild(btnSel);

      const scalpelEnabled = !!(el.scalpelMode && el.scalpelMode.checked);
      if (scalpelEnabled) {
        const btnScalpel = document.createElement("button");
        btnScalpel.type = "button";
        btnScalpel.className = "btn btn-secondary";
        btnScalpel.textContent = "Scalpel";
        btnScalpel.addEventListener("click", () => openScalpel(ex.id));
        actions.appendChild(btnScalpel);
      }

      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(tagsRow);
      card.appendChild(text);
      card.appendChild(actions);

      el.excerptGrid.appendChild(card);
    });
  }

  function toggleExcerpt(excerptId) {
    const idx = state.selectedExcerptIds.indexOf(excerptId);

    if (idx >= 0) {
      state.selectedExcerptIds.splice(idx, 1);
    } else {
      if (state.selectedExcerptIds.length >= 6) {
        softBanner("Max 6 excerpts. Remove one before selecting another.");
        return;
      }
      state.selectedExcerptIds.push(excerptId);
    }

    saveState();
    renderExcerpts();
    updateStatsAndButtons();
    clearOutputsSoft();
  }

  // ---- Stats / Scoring ----
  function computeStats() {
    const q = getQuestion();
    const selected = state.selectedExcerptIds.map(getExcerptById).filter(Boolean);

    const tokens = selected.reduce((sum, ex) => sum + excerptTokenEstimate(ex), 0);
    const words = selected.reduce((sum, ex) => sum + countWords(getExcerptText(ex)), 0);

    let irrelevant = 0;
    if (q) {
      selected.forEach(ex => {
        const overlap = overlapCount(ex.tags, q.requiredEvidenceTags);
        if (overlap === 0) irrelevant += 1;
      });
    }

    const noisePct = selected.length ? Math.round((irrelevant / selected.length) * 100) : 0;

    const budgetPct = BUDGET_HARD_TOKENS ? Math.round((tokens / BUDGET_HARD_TOKENS) * 100) : 0;
    const budgetClamped = clamp(budgetPct, 0, 120);

    let budgetStatus = "—";
    if (selected.length) {
      if (tokens <= BUDGET_TARGET_TOKENS) budgetStatus = `Good — ${tokens} tokens (≤ ${BUDGET_TARGET_TOKENS})`;
      else if (tokens <= BUDGET_HARD_TOKENS) budgetStatus = `High — ${tokens} tokens (> ${BUDGET_TARGET_TOKENS})`;
      else budgetStatus = `Too high — ${tokens} tokens (> ${BUDGET_HARD_TOKENS})`;
    }

    return { selected, tokens, words, irrelevant, noisePct, budgetClamped, budgetStatus, q };
  }
  function updateStatsAndButtons() {
    const { selected, tokens, irrelevant, noisePct, budgetClamped, budgetStatus, q } = computeStats();

    if (el.selectedCount) el.selectedCount.textContent = String(selected.length);
    if (el.tokenEstimate) el.tokenEstimate.textContent = selected.length ? String(tokens) : "—";

    if (el.budgetBar) el.budgetBar.style.width = `${clamp(budgetClamped, 0, 100)}%`;
    if (el.budgetLabel) {
      if (!q) el.budgetLabel.textContent = "Select a question first.";
      else if (!selected.length) el.budgetLabel.textContent = "No excerpts selected yet.";
      else el.budgetLabel.textContent = budgetStatus;
    }

    if (el.noiseBar) el.noiseBar.style.width = `${clamp(noisePct, 0, 100)}%`;
    if (el.noiseLabel) {
      if (!q) el.noiseLabel.textContent = "Select a question first.";
      else if (!selected.length) el.noiseLabel.textContent = "No excerpts selected yet.";
      else el.noiseLabel.textContent = `${irrelevant} irrelevant of ${selected.length} selected (${noisePct}% noise)`;
    }

    const canSimulate = !!q && selected.length >= 2 && selected.length <= 6;
    if (el.btnSimulate) el.btnSimulate.disabled = !canSimulate;
    if (el.simulateHint) {
      if (!q) el.simulateHint.textContent = "Choose a question to start.";
      else if (selected.length < 2) el.simulateHint.textContent = "Select at least 2 excerpts.";
      else if (selected.length > 6) el.simulateHint.textContent = "Max 6 excerpts.";
      else el.simulateHint.textContent = "Ready to simulate.";
    }
  }
  function simulate() {
    const { selected, tokens, words, irrelevant, q } = computeStats();
    if (!q || selected.length < 2 || selected.length > 6) return;

    const selectedTags = uniq(selected.flatMap(ex => ex.tags));
    const missingTags = q.requiredEvidenceTags.filter(t => !selectedTags.includes(t));
    const sufficient = missingTags.length === 0;

    const ruleOnly = !!(el.ruleOnlyProvided && el.ruleOnlyProvided.checked);

    const tokensPenalty = Math.max(0, Math.floor((tokens - BUDGET_TARGET_TOKENS) / 40)); // penalize budget creep
    const hardPenalty = tokens > BUDGET_HARD_TOKENS ? 10 : 0;
    const scoreRaw = 100 - (missingTags.length * 20) - (irrelevant * 10) - tokensPenalty - hardPenalty;
    const score = clamp(scoreRaw, 0, 100);

    // Build grounding knowledge block
    const lines = [];
    lines.push("Grounding Knowledge (selected excerpts):");
    selected.forEach(ex => {
      const t = getExcerptText(ex);
      lines.push(`- [${ex.title}] (${ex.source}; tags: ${ex.tags.join(", ")})`);
      lines.push(`  ${t.replace(/\s+/g, " ").trim()}`);
    });

    const groundingText = lines.join("\n");
    if (el.groundingBlock) el.groundingBlock.value = groundingText;

    // Build response stub
    let stub = "";
    if (sufficient) {
      stub += "Explanation\n";
      stub += `- Based on the selected excerpts, the key idea is: ${summarizeFromEvidence(selected, q)}\n\n`;
      stub += "Next Steps\n";
      stub += "- Use these excerpts in a Grounding Knowledge block, and instruct the model to answer using only provided text.\n";
      stub += "- Keep excerpts short to protect token budget and reduce noise.\n";
    } else {
      if (ruleOnly) {
        stub += "Insufficient Evidence\n";
        stub += `- The provided excerpts do not cover: ${missingTags.join(", ")}.\n`;
        stub += "- Retrieve or add short excerpts that directly address the missing evidence.\n\n";
      } else {
        stub += "Likely Answer + Evidence Gap\n";
        stub += "- You could attempt a best-effort explanation, but you should still retrieve evidence for accuracy.\n";
        stub += `- Missing evidence: ${missingTags.join(", ")}.\n\n`;
      }
      stub += "Retrieval Fix\n";
      stub += `- Rewrite your query to target the missing evidence: ${suggestQuery(q, missingTags)}\n`;
    }

    if (el.answerStub) el.answerStub.value = stub;

    // Banner + score
    setResultBanner(sufficient, missingTags, score, irrelevant, tokens, tokensPenalty, hardPenalty);

    // Evidence coverage panel
    renderCoverage(q, selected, missingTags);

    state.lastRun = {
      timestamp: Date.now(),
      questionId: q.id,
      excerptIds: selected.map(s => s.id),
      score,
      sufficient,
      missingTags
    };
    saveState();
  }

  function summarizeFromEvidence(selected, q) {
    // Minimal heuristic summary: stitch first sentences from top 2 excerpts.
    const top = selected.slice(0, 2).map(ex => firstSentence(getExcerptText(ex)));
    return top.join(" ");
  }

  function firstSentence(text) {
    const t = (text || "").trim();
    if (!t) return "";
    const m = t.match(/^(.+?[.!?])\s/);
    return m ? m[1] : t;
  }

  function suggestQuery(q, missingTags) {
    const base = q.title.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
    const missing = missingTags.join(" ");
    return `"${base} ${missing}"`;
  }

  function setResultBanner(sufficient, missingTags, score, irrelevant, tokens, tokensPenalty, hardPenalty) {
    if (!el.resultPill || !el.resultSummary) return;

    if (sufficient) {
      el.resultPill.textContent = "Sufficient";
      el.resultSummary.textContent = "Evidence coverage looks complete for this question. Keep it minimal.";
      el.resultPill.style.background = "var(--surface)";
    } else {
      el.resultPill.textContent = "Insufficient";
      el.resultSummary.textContent = `Missing evidence: ${missingTags.join(", ")}`;
      el.resultPill.style.background = "var(--surface)";
    }

    if (tokens > BUDGET_TARGET_TOKENS) {
      const note = tokens > BUDGET_HARD_TOKENS ? "Too high" : "High";
      el.resultSummary.textContent += ` • ${note} evidence budget (${tokens} tokens). Consider trimming.`;
    }

    if (el.scoreValue) el.scoreValue.textContent = String(score);
    if (el.scoreBadge) {
      const b = badgeForScore(score);
      el.scoreBadge.textContent = b;
      el.scoreBadge.className = "badge " + (b === "Gold" ? "badge-gold" : b === "Silver" ? "badge-silver" : b === "Bronze" ? "badge-bronze" : "badge-warn");
    }

    const whyParts = [];
    if (!sufficient) whyParts.push(`${missingTags.length} missing tag(s)`);
    if (irrelevant) whyParts.push(`${irrelevant} irrelevant excerpt(s)`);
    if (hardPenalty) whyParts.push(`hard budget breach`);
    if (tokensPenalty) whyParts.push(`budget penalty`);
    if (!whyParts.length) whyParts.push("minimal + sufficient");
    if (el.scoreWhy) el.scoreWhy.textContent = whyParts.join(" • ");
  }

  
  function badgeForScore(score) {
    if (score >= 95) return "Gold";
    if (score >= 80) return "Silver";
    if (score >= 60) return "Bronze";
    return "Needs work";
  }

  function renderCoverage(q, selected, missingTags) {
    if (!el.coverageList) return;

    const items = [];
    items.push(`<div class="coverage-row"><span class="coverage-k">Required tags</span><span class="coverage-v">${q.requiredEvidenceTags.map(t => `<span class="chip chip-tight">${escapeHtml(t)}</span>`).join(" ")}</span></div>`);

    q.requiredEvidenceTags.forEach(tag => {
      const coveredBy = selected.filter(ex => ex.tags.includes(tag)).map(ex => ex.title);
      if (coveredBy.length) {
        items.push(`<div class="coverage-row"><span class="coverage-k">${escapeHtml(tag)}</span><span class="coverage-v"><span class="ok">Covered</span> — ${escapeHtml(coveredBy.join("; "))}</span></div>`);
      } else {
        items.push(`<div class="coverage-row"><span class="coverage-k">${escapeHtml(tag)}</span><span class="coverage-v"><span class="bad">Missing</span> — retrieve an excerpt that directly covers this.</span></div>`);
      }
    });

    const irrelevant = selected.filter(ex => overlapCount(ex.tags, q.requiredEvidenceTags) === 0).map(ex => ex.title);
    if (irrelevant.length) {
      items.push(`<div class="coverage-row"><span class="coverage-k">Noise</span><span class="coverage-v"><span class="warn">Irrelevant selected</span> — ${escapeHtml(irrelevant.join("; "))}</span></div>`);
    } else {
      items.push(`<div class="coverage-row"><span class="coverage-k">Noise</span><span class="coverage-v"><span class="ok">No irrelevant excerpts selected</span></span></div>`);
    }

    el.coverageList.innerHTML = items.join("");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
function clearOutputsSoft() {
    // Keep last output visible if the user is iterating; only hint that recompute is needed.
    if (el.resultPill && el.resultPill.textContent !== "No run yet") {
      el.resultSummary.textContent = "Selection changed — simulate again to update.";
    }
    if (el.coverageList && el.coverageList.innerHTML.trim().length) {
      el.coverageList.innerHTML = '<div class="muted">Selection changed — run Simulate to refresh evidence coverage.</div>';
    }
  }

  function softBanner(msg) {
    if (!el.resultPill || !el.resultSummary) return;
    el.resultPill.textContent = "Note";
    el.resultSummary.textContent = msg;
  }

  // ---- Session Import/Export ----
  function buildSessionExport() {
    const q = getQuestion();
    return {
      schema: "rag-snippet-surgeon-session",
      appVersion: "v0.3.0",
      exportedAt: new Date().toISOString(),
      selectedQuestionId: q ? q.id : null,
      selectedExcerptIds: state.selectedExcerptIds.slice(0),
      excerptOverrides: state.excerptOverrides,
      ruleOnlyProvided: state.ruleOnlyProvided !== false,
      scalpelMode: state.scalpelMode === true,
      lastRun: state.lastRun || null
    };
  }

  function exportSession() {
    const data = buildSessionExport();
    const base = data.selectedQuestionId || "session";
    const name = `rag_snippet_surgeon_${base}_v0.3.0.json`;

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    softBanner("Exported session JSON.");
  }

  function importSessionFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        if (!parsed || typeof parsed !== "object") throw new Error("Invalid JSON.");

        // Basic schema check (non-fatal)
        if (parsed.schema && parsed.schema !== "rag-snippet-surgeon-session") {
          softBanner("Imported file schema is unexpected, but we will try to load it.");
        }

        const qid = parsed.selectedQuestionId || null;
        state.selectedQuestionId = questionCards.some(q => q.id === qid) ? qid : null;

        const exIds = Array.isArray(parsed.selectedExcerptIds) ? parsed.selectedExcerptIds : [];
        const valid = exIds.filter(id => excerpts.some(e => e.id === id));
        state.selectedExcerptIds = uniq(valid).slice(0, 6);

        const ov = (parsed.excerptOverrides && typeof parsed.excerptOverrides === "object") ? parsed.excerptOverrides : {};
        const cleanOv = {};
        Object.keys(ov).forEach(k => {
          if (!excerpts.some(e => e.id === k)) return;
          const v = ov[k];
          if (v && typeof v === "object" && typeof v.trimmedText === "string") {
            cleanOv[k] = { trimmedText: v.trimmedText };
          }
        });
        state.excerptOverrides = cleanOv;

        state.ruleOnlyProvided = parsed.ruleOnlyProvided !== false;
        state.scalpelMode = parsed.scalpelMode === true;
        state.lastRun = parsed.lastRun || null;

        saveState();
        initFromState();
        renderQuestions();
        renderExcerpts();
        updateStatsAndButtons();
        clearOutputsSoft();

        softBanner("Imported session loaded.");
      } catch (_) {
        softBanner("Import failed. Ensure you selected a valid session JSON file.");
      }
    };
    reader.onerror = () => softBanner("Import failed (file read error).");
    reader.readAsText(file);
  }

  // ---- Copy/Download ----
  async function copyGrounding() {
    const txt = (el.groundingBlock && el.groundingBlock.value) || "";
    if (!txt) return;

    try {
      await navigator.clipboard.writeText(txt);
      softBanner("Copied grounding block to clipboard.");
    } catch (_) {
      // fallback
      try {
        el.groundingBlock.focus();
        el.groundingBlock.select();
        document.execCommand("copy");
        softBanner("Copied grounding block to clipboard.");
      } catch (_) {
        softBanner("Copy failed (browser restrictions). You can manually select and copy the text.");
      }
    }
  }

  function downloadTxt() {
    const txt = (el.groundingBlock && el.groundingBlock.value) || "";
    if (!txt) return;

    const q = getQuestion();
    const name = q ? `grounding_${q.id}.txt` : "grounding.txt";
    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  // ---- Reset ----
  function resetApp() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    try { localStorage.removeItem(STORAGE_KEY_OLD); } catch (_) {}
    try { localStorage.removeItem(STORAGE_KEY_OLDER); } catch (_) {}
    // Keep theme as user preference (do not clear app_theme).
    state.selectedQuestionId = null;
    state.selectedExcerptIds = [];
    state.excerptOverrides = {};
    state.ruleOnlyProvided = true;
    state.scalpelMode = false;
    state.lastRun = null;

    if (el.ruleOnlyProvided) el.ruleOnlyProvided.checked = true;
    if (el.scalpelMode) el.scalpelMode.checked = false;
    if (el.searchBox) el.searchBox.value = "";
    if (el.tagFilter) el.tagFilter.value = "__all__";

    renderQuestions();
    renderExcerpts();
    updateStatsAndButtons();

    if (el.groundingBlock) el.groundingBlock.value = "";
    if (el.answerStub) el.answerStub.value = "";
    if (el.scoreValue) el.scoreValue.textContent = "—";
    if (el.scoreWhy) el.scoreWhy.textContent = "—";
    if (el.scoreBadge) { el.scoreBadge.textContent = "—"; el.scoreBadge.className = "badge"; }
    if (el.coverageList) el.coverageList.innerHTML = "";
    if (el.resultPill) el.resultPill.textContent = "No run yet";
    if (el.resultSummary) el.resultSummary.textContent = "Select a question, pick excerpts, then simulate.";
  }

  // ---- Scalpel Modal ----
  const modalState = { excerptId: null, original: "" };
  let lastFocusEl = null;

  function getFocusableInModal() {
    if (!el.modal) return [];
    const panel = el.modal.querySelector(".modal-panel");
    if (!panel) return [];
    return Array.from(panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter(n => !n.disabled && n.getAttribute("aria-hidden") !== "true");
  }


  function openScalpel(excerptId) {
    const ex = getExcerptById(excerptId);
    if (!ex) return;

    modalState.excerptId = excerptId;
    modalState.original = ex.text;

    const current = getExcerptText(ex);

    if (el.scalpelText) el.scalpelText.value = current;
    if (el.scalpelMeta) {
      el.scalpelMeta.textContent = `Editing: ${ex.title} • Current tokens ~${tokenizeEstimate(current)} (original ~${tokenizeEstimate(ex.text)})`;
    }

    openModal();
  }

  function openModal() {
    if (!el.modal) return;
    lastFocusEl = document.activeElement;
    el.modal.classList.add("open");
    el.modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    // initial focus
    setTimeout(() => {
      const focusables = getFocusableInModal();
      const target = (el.btnCloseModal) || focusables[0];
      if (target && typeof target.focus === "function") target.focus();
    }, 0);
  }

  function closeModal() {
    if (!el.modal) return;
    el.modal.classList.remove("open");
    el.modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    modalState.excerptId = null;
    modalState.original = "";

    // restore focus
    if (lastFocusEl && typeof lastFocusEl.focus === "function") {
      try { lastFocusEl.focus(); } catch (_) {}
    }
    lastFocusEl = null;
  }

  function autoTrim() {
    const id = modalState.excerptId;
    if (!id) return;
    const ex = getExcerptById(id);
    if (!ex) return;

    const q = getQuestion();
    const suggestion = suggestTrimForExcerpt(ex.text, q);

    if (el.scalpelText) el.scalpelText.value = suggestion;
    if (el.scalpelMeta) {
      el.scalpelMeta.textContent = `Editing: ${ex.title} • Current tokens ~${tokenizeEstimate(suggestion)} (original ~${tokenizeEstimate(ex.text)})`;
    }
  }

  function suggestTrimForExcerpt(text, q) {
    const t = String(text || "").trim();
    if (!t) return "";

    // Split into sentences. Keep it simple and robust.
    const parts = (t.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [t]).map(s => s.trim()).filter(Boolean);

    if (!q || !parts.length) {
      // Fallback: first 2 sentences or 320 chars.
      const fallback = parts.slice(0, 2).join(" ");
      return fallback.length > 320 ? fallback.slice(0, 320).trim() + "…" : fallback;
    }

    // Build keyword set from question title + required tags
    const kw = new Set();
    const addTokens = (s) => {
      String(s || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(w => w.length >= 4)
        .slice(0, 30)
        .forEach(w => kw.add(w));
    };

    addTokens(q.title);
    q.requiredEvidenceTags.forEach(addTokens);

    const scored = parts.map((sent, idx) => {
      const lower = sent.toLowerCase();
      let score = 0;
      kw.forEach(k => { if (lower.includes(k)) score += 1; });
      // Prefer earlier sentences slightly
      score += Math.max(0, 3 - idx) * 0.25;
      return { sent, score, idx };
    });

    scored.sort((a,b) => b.score - a.score);

    const chosen = scored.filter(x => x.score > 0).slice(0, 2).sort((a,b) => a.idx - b.idx).map(x => x.sent);
    const out = (chosen.length ? chosen : [parts[0]]).join(" ");

    return out.length > 360 ? out.slice(0, 360).trim() + "…" : out;
  }

  function saveTrim() {
    const id = modalState.excerptId;
    if (!id) return;
    const ex = getExcerptById(id);
    if (!ex) return;

    const trimmed = (el.scalpelText && el.scalpelText.value || "").trim();
    if (!trimmed.length) {
      softBanner("Trim text is empty. Use Reset to restore the original excerpt.");
      return;
    }

    state.excerptOverrides[id] = { trimmedText: trimmed };
    saveState();
    renderExcerpts();
    updateStatsAndButtons();
    clearOutputsSoft();
    closeModal();
  }

  function resetTrim() {
    const id = modalState.excerptId;
    if (!id) return;
    const ex = getExcerptById(id);
    if (!ex) return;

    if (el.scalpelText) el.scalpelText.value = ex.text;
    if (el.scalpelMeta) el.scalpelMeta.textContent = `Editing: ${ex.title} • Current tokens ~${tokenizeEstimate(ex.text)} (original ~${tokenizeEstimate(ex.text)})`;
  }

  function bindModal() {
    if (!el.modal) return;

    el.modal.addEventListener("click", (ev) => {
      const t = ev.target;
      if (t && t.dataset && t.dataset.close === "1") closeModal();
    });

    if (el.btnCloseModal) el.btnCloseModal.addEventListener("click", closeModal);
    if (el.btnSaveTrim) el.btnSaveTrim.addEventListener("click", saveTrim);
    if (el.btnResetTrim) el.btnResetTrim.addEventListener("click", resetTrim);
    if (el.btnAutoTrim) el.btnAutoTrim.addEventListener("click", autoTrim);

    document.addEventListener("keydown", (ev) => {
      if (!el.modal || !el.modal.classList.contains("open")) return;

      if (ev.key === "Escape") {
        closeModal();
        return;
      }

      if (ev.key === "Tab") {
        const focusables = getFocusableInModal();
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (ev.shiftKey && document.activeElement === first) {
          ev.preventDefault();
          last.focus();
        } else if (!ev.shiftKey && document.activeElement === last) {
          ev.preventDefault();
          first.focus();
        }
      }
    });
  }

  // ---- Events ----
  function bindEvents() {
    if (el.searchBox) el.searchBox.addEventListener("input", () => renderExcerpts());
    if (el.tagFilter) el.tagFilter.addEventListener("change", () => renderExcerpts());
    if (el.relevanceFilter) el.relevanceFilter.addEventListener("change", () => renderExcerpts());

    if (el.ruleOnlyProvided) el.ruleOnlyProvided.addEventListener("change", () => {
      state.ruleOnlyProvided = !!el.ruleOnlyProvided.checked;
      saveState();
    });

    if (el.scalpelMode) el.scalpelMode.addEventListener("change", () => {
      state.scalpelMode = !!el.scalpelMode.checked;
      saveState();
      renderExcerpts();
    });

    if (el.btnExportSession) el.btnExportSession.addEventListener("click", exportSession);
    if (el.btnImportSession) el.btnImportSession.addEventListener("click", () => {
      if (el.importSessionFile) el.importSessionFile.click();
    });
    if (el.importSessionFile) el.importSessionFile.addEventListener("change", () => {
      const file = el.importSessionFile.files && el.importSessionFile.files[0];
      if (file) importSessionFile(file);
      // allow re-importing same file
      el.importSessionFile.value = "";
    });

    if (el.btnSimulate) el.btnSimulate.addEventListener("click", simulate);
    if (el.btnCopyGrounding) el.btnCopyGrounding.addEventListener("click", copyGrounding);
    if (el.btnDownloadTxt) el.btnDownloadTxt.addEventListener("click", downloadTxt);
    if (el.btnReset) el.btnReset.addEventListener("click", resetApp);
  }
  function initFromState() {
    if (el.ruleOnlyProvided) el.ruleOnlyProvided.checked = state.ruleOnlyProvided !== false;
    if (el.scalpelMode) el.scalpelMode.checked = state.scalpelMode === true;
  }

  function init() {
    cacheDom();
    loadState();
    initFromState();

    renderQuestions();
    renderExcerpts();
    updateStatsAndButtons();
    bindEvents();
    bindModal();
  }

  document.addEventListener("DOMContentLoaded", init);
})();