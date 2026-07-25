function riskRank(check) {
  const level = String(check.riskLevel || "medium").toLowerCase();
  return level === "high" ? 0 : level === "medium" ? 1 : 2;
}

function expectedStatusPhrase(status) {
  if (status === "weakened") return "something important got weaker";
  if (status === "tradeoff") return "the change created a real trade-off";
  if (status === "improved") return "the change made this stronger";
  return "the candidate largely held the baseline behavior";
}

export function buildCheckStudyGuide(check, learnerSelection) {
  const expected = check.expectedStatus;
  const matched = learnerSelection === expected;
  const question = check.interpretationPrompt || `Ask what the baseline was protecting and whether the candidate still makes that protection easy to see.`;
  const strongestRead = check.strongestPracticeRead || `Strongest practice reads this as ${expected} because ${check.candidateObservation}`;
  const commonMistake = check.commonMistake || `A common mistake is to reward surface improvement before checking whether the baseline protection stayed visible.`;
  const studyNudge = matched
    ? `Your read matches the strongest-practice interpretation.`
    : learnerSelection
      ? `You marked this as ${learnerSelection}. Re-check whether the evidence really supports that, or whether it more accurately shows that ${expectedStatusPhrase(expected)}.`
      : `Review this check before deciding. The strongest-practice read is ${expected}.`;

  return {
    question,
    strongestRead,
    commonMistake,
    studyNudge
  };
}

export function buildScenarioCoaching(scenario, scoredState, runState) {
  const selections = runState?.checkSelections || {};
  const matrix = scenario.standingChecks.map((check) => ({
    check,
    learner: selections[check.id] || null,
    matched: selections[check.id] === check.expectedStatus
  }));

  const unreviewed = matrix.filter((row) => !row.learner).sort((a, b) => riskRank(a.check) - riskRank(b.check));
  const mismatched = matrix.filter((row) => row.learner && !row.matched).sort((a, b) => riskRank(a.check) - riskRank(b.check));
  const riskyChecks = matrix.filter((row) => ["weakened", "tradeoff"].includes(row.check.expectedStatus)).sort((a, b) => riskRank(a.check) - riskRank(b.check));

  const bullets = [];
  let headline = 'Use the baseline to earn the decision.';

  if (scenario.difficulty === 'Advanced') {
    bullets.push('This is an advanced mission. Treat readability gains as secondary until the protected boundary is stable again.');
  }

  if (!scoredState.totalReviewed) {
    headline = 'Start with the highest-risk checks, not the nicest polish win.';
    bullets.push(`Begin with ${riskyChecks.slice(0, 2).map((row) => row.check.title).join(' and ')}.`);
    bullets.push('For each risky check, ask what the baseline protected before you judge the candidate tone.');
  } else if (unreviewed.length) {
    headline = 'Finish the comparison before you lock the release call.';
    bullets.push(`Next best review target: ${unreviewed[0].check.title}.`);
    if (unreviewed[1]) bullets.push(`After that, inspect ${unreviewed[1].check.title} so the trade-offs stay visible.`);
  } else if (!runState?.decision) {
    headline = 'Now convert the comparison into a proportionate release path.';
    bullets.push(`The strongest-practice direction is usually driven by ${riskyChecks.slice(0, 2).map((row) => row.check.title).join(' and ')}.`);
    bullets.push(`Before you choose, ask whether the candidate still preserves the baseline boundary or merely sounds easier to ship.`);
  } else if (runState.decision !== scoredState.correctDecision) {
    headline = `Your current decision is drifting from the strongest-practice path.`;
    bullets.push(`The evidence is pointing toward ${scoredState.correctDecision}, not ${runState.decision}.`);
    if (mismatched[0]) bullets.push(`Revisit ${mismatched[0].check.title}; that check is probably driving the decision gap.`);
  } else if (!runState?.monitoring?.length) {
    headline = 'A good judgment still needs stewardship.';
    bullets.push('Choose the monitoring item that best watches the uncertainty the change leaves behind.');
    bullets.push('Do not use monitoring to compensate for a release-blocking weakness; use it to watch a bounded, acceptable risk.');
  } else {
    headline = 'You are close to a strong debrief.';
    bullets.push('Use the debrief to compare your path with the authored strongest-practice reasoning.');
    if (mismatched.length) bullets.push(`One more improvement pass: tighten ${mismatched[0].check.title}.`);
    else bullets.push('Your check interpretations and final decision are aligned. Study the walkthrough to make the pattern reusable.');
  }

  if (mismatched.length && runState?.decision === scoredState.correctDecision) {
    bullets.push(`Your final decision may be right, but ${mismatched[0].check.title} still deserves a sharper interpretation.`);
  }

  return {
    headline,
    bullets: bullets.filter(Boolean).slice(0, 4),
    priorityChecks: [...unreviewed, ...mismatched].slice(0, 3).map((row) => row.check.title)
  };
}
