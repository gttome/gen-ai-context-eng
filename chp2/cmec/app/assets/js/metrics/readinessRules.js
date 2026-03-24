import { signedDelta } from '../utils/format.js';

export function maturityFromReadiness(readiness) {
  if (readiness >= 85) return 'Mission Ready';
  if (readiness >= 70) return 'Stable';
  if (readiness >= 55) return 'Grounded';
  if (readiness >= 40) return 'Strengthened';
  return 'Drafted';
}

export function deriveCoaching(appData, scenario, metricSet) {
  const { baseline, current } = metricSet;
  const messages = [];

  if (current.overload > 65) messages.push(appData.coachingRules.highOverload);
  if (current.grounding < 45) messages.push(appData.coachingRules.lowGrounding);
  if (current.structure < 45) messages.push(appData.coachingRules.lowStructure);
  if (scenario?.patternLens === 'memory' && current.continuity < 45) {
    messages.push(appData.coachingRules.lowContinuity);
  }
  if (current.readiness >= 75) messages.push(appData.coachingRules.missionReady);

  const compareNotes = [
    `Signal ${signedDelta(current.signal - baseline.signal)}`,
    `Grounding ${signedDelta(current.grounding - baseline.grounding)}`,
    `Structure ${signedDelta(current.structure - baseline.structure)}`,
    `Overload ${signedDelta(current.overload - baseline.overload)}`
  ];

  return {
    messages: messages.length ? messages : ['Make one meaningful repair and watch which metric moves first.'],
    compareNotes
  };
}
