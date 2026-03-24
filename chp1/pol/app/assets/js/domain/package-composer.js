(function () {
  const utils = window.POLUtils;
  function mapById(items) { return (items || []).reduce((acc, item) => { acc[item.id] = item; return acc; }, {}); }
  function getSelectedItems(collection, ids) { const lookup = mapById(collection); return (ids || []).map(id => lookup[id]).filter(Boolean); }
  function computeTokenUsage(mission, missionState) {
    const evidence = missionState.groundingEnabled ? getSelectedItems(mission.evidence, missionState.selectedEvidence) : [];
    const memory = missionState.memoryEnabled ? getSelectedItems(mission.memory, missionState.selectedMemory) : [];
    const facts = missionState.dynamicEnabled ? getSelectedItems(mission.dynamicFacts, missionState.selectedFacts) : [];
    const fixed = 78;
    const usage = fixed + evidence.reduce((s, i) => s + i.tokens, 0) + memory.reduce((s, i) => s + i.tokens, 0) + facts.reduce((s, i) => s + i.tokens, 0);
    return { total: usage, fixed, evidence, memory, facts };
  }
  function buildContextPackage(mission, missionState) {
    const token = computeTokenUsage(mission, missionState);
    const ruleLines = [
      'Use only the information provided below.',
      'If something is missing, say what is unknown instead of guessing.',
      mission.outputFormat ? `Follow this output format: ${mission.outputFormat}.` : 'Keep the answer structured and scannable.'
    ];
    if (mission.id === 'support-downgrade') ruleLines.push('Avoid speculation about bugs unless evidence supports it.');
    if (mission.id === 'hr-carryover') ruleLines.push('Do not provide legal advice. Escalate only if policy is silent or a key fact is missing.');
    if (mission.id === 'incident-triage') ruleLines.push('Do not invent facts. Label unconfirmed ideas as hypotheses.');
    if (mission.id === 'contract-activation') ruleLines.push('Do not promise feature restoration until the contract rule and current account status agree.');
    const sections = [
      'System / Role',
      `You are a professional assistant helping with the mission "${mission.title}". Your job is to answer clearly, apply context-engineering discipline, and stay faithful to the provided material.`,
      '', 'Rules / Constraints', utils.asTextList(ruleLines), ''
    ];
    if (missionState.dynamicEnabled && token.facts.length) { sections.push('Dynamic Facts'); sections.push(utils.asTextList(token.facts.map(item => item.text))); sections.push(''); }
    if (missionState.groundingEnabled && token.evidence.length) { sections.push('Grounding Knowledge'); sections.push(utils.asTextList(token.evidence.map(item => item.text))); sections.push(''); }
    if (missionState.memoryEnabled && token.memory.length) {
      sections.push('Memory');
      if (missionState.memoryMode === 'rolling') sections.push('Use the following rolling summary to preserve continuity:');
      else if (missionState.memoryMode === 'pinned') sections.push('Treat the following as pinned facts that should remain stable unless contradicted:');
      else sections.push('Use only if directly relevant:');
      sections.push(utils.asTextList(token.memory.map(item => item.text))); sections.push('');
    }
    sections.push('Output Format'); sections.push(mission.outputFormat || 'Respond with a concise, structured answer.'); sections.push(''); sections.push('User Request'); sections.push(mission.userRequest);
    return { text: sections.join('\n'), tokenUsage: token };
  }
  function buildPastePrompt(mission) {
    return [`Write the answer for the mission "${mission.title}" using the provided package only.`, 'Keep the answer concise, clear, and faithful to the supplied facts and evidence.', 'Do not explain your reasoning process. Just return the answer the end user should see.'].join(' ');
  }
  function buildExternalPrompt(mission, missionState) {
    const pkg = buildContextPackage(mission, missionState);
    const instruction = buildPastePrompt(mission);
    return { text: ['Copy everything below into ChatGPT or another external LLM.', '', 'Task for the external model', instruction, '', 'Mission package', pkg.text, '', 'Return only the finished answer.'].join('\n') };
  }
  function selectedSummary(mission, missionState) {
    const summary = [];
    if (missionState.groundingEnabled) summary.push('Grounding on');
    if (missionState.memoryEnabled) summary.push(`Memory ${missionState.memoryMode}`);
    if (missionState.dynamicEnabled) summary.push('Dynamic facts on');
    if (!summary.length) summary.push('Weak state retained');
    return summary.join(' · ');
  }
  window.POLPackageComposer = { computeTokenUsage, buildContextPackage, buildPastePrompt, buildExternalPrompt, selectedSummary, getSelectedItems };
})();
