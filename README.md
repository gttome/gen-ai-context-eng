# Gen AI Context Engineering

This repository contains hands-on exercises and companion apps for **Chapter 1: Foundations of Context Engineering**.

## Chapter 1 — Applications (in chapter order)

> Order matches the Chapter 1 content flow: definition → tokens/window → context toolkit → core patterns → iteration → failure modes → practice.

1. **[Approach Switchboard](./chp1/approach-switchboard/docs)**  
   Decision guide for choosing: Basic Prompting vs Context Engineering vs RAG vs Fine-Tuning.

2. **[Context Tetris](./chp1/context-tetris/docs)**  
   Token budgeting and “finite working memory” practice (context window limits, pruning, structuring).

3. **[Context Skeleton Studio](./chp1/context-skeleton-studio/docs)**  
   Build and refine a reusable context template (role, rules, dynamic facts, grounding, memory, schema, request).

4. **[RAG Snippet Surgeon](./chp1/rag-snippet-surgeon/docs)**  
   Practice retrieval-grounding with short excerpts (avoid “document dumping”; improve snippet relevance).

5. **[Memory Mixer](./chp1/memory-mixer/docs)**  
   Maintain controlled memory across turns (rolling summary, pinned facts, retrieval memory).

6. **[Dynamic Facts Firewall](./chp1/dynamic-facts-firewall/docs)**  
   Add real-time/session values via a Dynamic Facts block; keep behavior rules separate from changing data.

7. **[Iteration Lab](./chp1/iteration-lab/docs)**  
   Run the iterative loop: Design → Test → Evaluate → Adjust (with regression checks).

8. **[Failure Mode Clinic](./chp1/failure-mode-clinic/docs)**  
   Diagnose failures (generic, wrong, ignores constraints, inconsistent, overload, forgets decisions) and apply quick fixes.

9. **[Enterprise Scenario Arcade](./chp1/enterprise-scenario/docs)**  
   Apply the patterns end-to-end with realistic mini-scenarios and structured outputs.

---

_Last updated: 2026_
