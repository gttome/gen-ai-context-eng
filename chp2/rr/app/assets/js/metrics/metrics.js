import { getScenarioFailures, getScenarioScores, getSelectedChange, getStepState } from '../domain/scenario-engine.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function computeCaseAverage(criteriaScores) {
  const values = Object.values(criteriaScores).filter((value) => value !== null);
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function getBaselineCaseScores(state, scenario) {
  const scores = getScenarioScores(state, scenario);
  return scenario.testCases.map((testCase) => ({
    caseId: testCase.id,
    average: computeCaseAverage(scores[testCase.id]),
    criteria: scores[testCase.id]
  }));
}

export function getRevisedCaseScores(state, scenario) {
  const selectedChange = getSelectedChange(scenario, state);
  if (!selectedChange) return null;
  const scores = getScenarioScores(state, scenario);
  return scenario.testCases.map((testCase) => {
    const baseCriteria = scores[testCase.id];
    const deltas = selectedChange.caseDeltas[testCase.id] || selectedChange.deltaByCriterion;
    const revisedCriteria = Object.fromEntries(
      Object.entries(baseCriteria).map(([criterionId, value]) => [criterionId, value === null ? null : clamp(value + (deltas[criterionId] || 0), 0, 2)])
    );
    return {
      caseId: testCase.id,
      average: computeCaseAverage(revisedCriteria),
      criteria: revisedCriteria,
      deltas
    };
  });
}


function scoreLabel(score) {
  if (score === 0) return 'weak';
  if (score === 1) return 'partial';
  if (score === 2) return 'strong';
  return 'unscored';
}

function buildBestPracticeReason(testCase, criterion, expertScore, userScore) {
  const signals = (testCase.expectedSignals || []).slice(0, 2).join(' • ');
  if (expertScore === userScore) {
    return `You matched the best-practice score here. The answer ${scoreLabel(expertScore)}ly fits the ${criterion.label.toLowerCase()} standard for this case.`;
  }
  if (expertScore === 0) {
    return `Best-practice review marks this weak because the answer breaks or misses the ${criterion.label.toLowerCase()} standard. Strong evidence would include signals such as ${signals}.`;
  }
  if (expertScore === 1) {
    return `Best-practice review marks this partial because there is some useful signal, but the answer still misses important case cues. The strongest missing cues here are ${signals}.`;
  }
  return `Best-practice review marks this strong because the answer clearly meets the ${criterion.label.toLowerCase()} standard and preserves the important case signals.`;
}

function computeBestPracticeReview(state, scenario) {
  const scores = getScenarioScores(state, scenario);
  const entries = [];
  scenario.testCases.forEach((testCase) => {
    const bestScores = testCase.bestPracticeScores || {};
    scenario.rubric.forEach((criterion) => {
      const userScore = scores[testCase.id]?.[criterion.id];
      const bestScore = bestScores[criterion.id];
      if (userScore === null || bestScore === undefined) return;
      const gap = Math.abs(userScore - bestScore);
      entries.push({
        caseId: testCase.id,
        question: testCase.question,
        criterionId: criterion.id,
        criterionLabel: criterion.label,
        userScore,
        bestScore,
        gap,
        direction: userScore > bestScore ? 'high' : userScore < bestScore ? 'low' : 'match',
        reason: buildBestPracticeReason(testCase, criterion, bestScore, userScore)
      });
    });
  });
  const mismatches = entries.filter((entry) => entry.gap > 0).sort((a, b) => b.gap - a.gap || a.caseId.localeCompare(b.caseId));
  return {
    totalComparisons: entries.length,
    exactMatches: entries.length - mismatches.length,
    mismatchCount: mismatches.length,
    exactMatchRate: entries.length ? (entries.length - mismatches.length) / entries.length : 0,
    largestGap: mismatches[0]?.gap || 0,
    focusEntries: mismatches.slice(0, 6),
    allEntries: entries
  };
}

function average(values) {
  const valid = values.filter((value) => value !== null && value !== undefined);
  if (!valid.length) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

export function computeMetrics(appData, state, scenario) {
  const stepState = getStepState(state, scenario);
  const baseline = getBaselineCaseScores(state, scenario);
  const revised = getRevisedCaseScores(state, scenario);
  const failures = getScenarioFailures(state, scenario);
  const scoredCoverage = stepState.totalCells ? stepState.scoredCells / stepState.totalCells : 0;
  const bestPractice = computeBestPracticeReview(state, scenario);

  const baselinePassCases = baseline.filter((entry) => entry.average !== null && entry.average >= 1.35 && !Object.values(entry.criteria).includes(0));
  const passRate = baseline.length ? baselinePassCases.length / baseline.length : 0;

  const failureCounts = Object.values(failures).filter(Boolean).reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});
  const topFailureCount = Object.values(failureCounts).sort((a, b) => b - a)[0] || 0;
  const failureConcentration = scenario.testCases.length ? topFailureCount / scenario.testCases.length : 0;

  let improvementDelta = null;
  let regressionStability = null;
  let deployReadiness = 'Revisit earlier phase work';
  let deployReadinessState = 'bad';

  if (revised) {
    const baselineAvg = average(baseline.map((entry) => entry.average));
    const revisedAvg = average(revised.map((entry) => entry.average));
    improvementDelta = baselineAvg !== null && revisedAvg !== null ? revisedAvg - baselineAvg : null;

    const stabilityCases = revised.map((revisedEntry) => {
      const baselineEntry = baseline.find((entry) => entry.caseId === revisedEntry.caseId);
      const revisedValues = Object.values(revisedEntry.criteria).filter((value) => value !== null);
      const baselineValues = Object.values(baselineEntry.criteria).filter((value) => value !== null);
      if (!revisedValues.length || !baselineValues.length) return null;
      const regressed = Object.keys(revisedEntry.criteria).some((criterionId) => (revisedEntry.criteria[criterionId] ?? 0) < (baselineEntry.criteria[criterionId] ?? 0));
      return regressed ? 0 : 1;
    }).filter((value) => value !== null);
    regressionStability = stabilityCases.length ? stabilityCases.reduce((sum, value) => sum + value, 0) / stabilityCases.length : null;

    const strictMode = (state.exploreSelections || []).includes('strict');
    const revisedPasses = revised.filter((entry) => {
      const values = Object.values(entry.criteria).filter((value) => value !== null);
      const avg = entry.average ?? 0;
      const threshold = strictMode ? 1.7 : 1.45;
      const minAllowed = strictMode ? 1 : 0;
      return avg >= threshold && !values.some((value) => value < minAllowed);
    }).length;
    const revisedPassRate = revised.length ? revisedPasses / revised.length : 0;

    if (revisedPassRate >= 0.8 && (regressionStability ?? 0) >= (strictMode ? 0.85 : 0.66)) {
      deployReadiness = 'Deploy';
      deployReadinessState = 'good';
    } else if (revisedPassRate >= 0.45) {
      deployReadiness = 'Iterate again';
      deployReadinessState = 'warn';
    }
  } else if (passRate >= 0.66 && failureConcentration <= 0.34) {
    deployReadiness = 'Iterate again';
    deployReadinessState = 'warn';
  }

  const criterionAverages = scenario.rubric.map((criterion) => {
    const baselineValues = baseline.map((entry) => entry.criteria[criterion.id]).filter((value) => value !== null);
    const revisedValues = revised ? revised.map((entry) => entry.criteria[criterion.id]).filter((value) => value !== null) : [];
    return {
      id: criterion.id,
      label: criterion.label,
      baseline: average(baselineValues) ?? 0,
      revised: revised ? (average(revisedValues) ?? 0) : null
    };
  });

  return {
    stepState,
    baseline,
    revised,
    criterionAverages,
    passRate,
    criterionCoverage: scoredCoverage,
    failureConcentration,
    improvementDelta,
    regressionStability,
    deployReadiness,
    deployReadinessState,
    failureCounts,
    bestPractice,
    topFailureId: Object.entries(failureCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null
  };
}


export function buildCoachMessage(appData, scenario, metrics, state) {
  const { stepState, topFailureId, improvementDelta, regressionStability, deployReadiness } = metrics;
  const topFailure = appData.failureTypes.find((item) => item.id === topFailureId);
  const scores = getScenarioScores(state, scenario);
  const failureGuidance = scenario.coaching?.failureGuidance || {};
  const changeGuidance = scenario.coaching?.changeGuidance || {};
  const selectedChange = getSelectedChange(scenario, state);

  if (!state.started) {
    return 'Start with the brief, not the buttons. This lab teaches a Chapter 2 habit: define what good looks like before you judge an answer.';
  }
  if (!stepState.scoringComplete) {
    for (const testCase of scenario.testCases) {
      for (const criterion of scenario.rubric) {
        if (scores[testCase.id][criterion.id] === null) {
          const signals = testCase.expectedSignals.join(' • ');
          return `Next scoring focus: ${testCase.id} — ${criterion.label}. Look for ${signals}. Score what is visible in the answer, not what you wish were there.`;
        }
      }
    }
    return 'Finish the last few scores. The heatmap and pass rate become trustworthy only when coverage is complete.';
  }
  if (!stepState.scoringLocked) {
    return stepState.scoringComplete
      ? 'Press Finish scoring and continue. The lab will reveal the best-practice review so you can calibrate before moving on.'
      : 'Finish the last few scores. The heatmap and pass rate become trustworthy only when coverage is complete.';
  }
  if (!stepState.diagnosisComplete) {
    const biggestGap = metrics.bestPractice?.focusEntries?.[0];
    const taggedEntry = Object.entries(getScenarioFailures(state, scenario)).find(([, value]) => Boolean(value));
    if (taggedEntry) {
      const taggedGuidance = failureGuidance[taggedEntry[1]];
      if (taggedGuidance) {
        return `${scenario.title}: ${taggedGuidance.title}. ${taggedGuidance.notice} Keep tagging one dominant failure per case before you pick a fix.`;
      }
    }
    if (biggestGap) {
      return `Best-practice review: start with ${biggestGap.caseId} — ${biggestGap.criterionLabel}. Your score was ${biggestGap.userScore}; the recommended score is ${biggestGap.bestScore}. Read why, then tag the dominant failure.`;
    }
    return topFailure
      ? `Your scores mostly align with the best-practice review. Now tag the single biggest weakness in each case so the next fix stays disciplined.`
      : 'Use the best-practice review to calibrate, then name the dominant failure in each case.';
  }
  if (!stepState.changeSelected) {
    const taggedFailureId = Object.values(getScenarioFailures(state, scenario)).find(Boolean) || topFailureId;
    const taggedGuidance = taggedFailureId ? failureGuidance[taggedFailureId] : null;
    if (taggedGuidance) {
      return `${taggedGuidance.title}. ${taggedGuidance.notice} Choose the one fix that best addresses that pattern.`;
    }
    return topFailure
      ? `${topFailure.label} is the dominant pattern. Choose the one fix that best addresses that pattern. One change at a time keeps the comparison trustworthy.`
      : 'Choose one targeted change. Chapter 2’s rule is to change one variable at a time when possible.';
  }
  if (selectedChange && changeGuidance[selectedChange.id]) {
    const guide = changeGuidance[selectedChange.id];
    if (improvementDelta !== null && improvementDelta > 0) {
      return `${guide.title}. ${guide.notice} Then use the takeaway to decide whether the evidence is strong enough to move forward.`;
    }
    return `${guide.title}. ${guide.why} Review the before/after evidence carefully before trusting the change.`;
  }
  if (improvementDelta !== null && improvementDelta >= 0.6 && (regressionStability ?? 0) >= 0.66) {
    return `The change produced a broad improvement pattern. Recommendation state: ${deployReadiness}. Read the takeaway summary to connect the evidence back to the lifecycle lesson.`;
  }
  if (improvementDelta !== null && improvementDelta > 0) {
    return 'The change helped, but the pattern is still mixed. Use the takeaway summary and optional learning checks to decide whether this is good enough or still needs another iteration.';
  }
  if (improvementDelta !== null && improvementDelta <= 0) {
    return 'The selected change did not improve the evidence enough. Chapter 2 would treat that as a signal to revisit shaping or selection, not to keep blindly tweaking.';
  }
  return 'Use the recommendation and takeaway summary to connect scores, failure patterns, and the next responsible lifecycle move.';
}
