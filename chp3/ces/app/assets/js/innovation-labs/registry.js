import * as teachableDoppelganger from './modules/teachable-doppelganger.js';
import * as productiveFailureTimeMachine from './modules/productive-failure-time-machine.js';
import * as calibrationMarket from './modules/calibration-market.js';
import * as claimEvidenceConstellation from './modules/claim-evidence-constellation.js';
import * as contextMRI from './modules/context-mri.js';
import * as sessionHologramReplay from './modules/session-hologram-replay.js';
import * as authorityFirewallSimulator from './modules/authority-firewall-simulator.js';
import * as trajectoryAuditor from './modules/trajectory-auditor.js';
import * as promptCardClaimLedger from './modules/prompt-card-claim-ledger.js';

export const LABS = [
  {
    id: 'teachable-doppelganger',
    title: 'Teachable Doppelgänger',
    category: 'Education',
    summary: 'Teach an AI apprentice, observe a plausible failure, then repair the misconception.',
    innovation: 'Learning by teaching',
    mount: teachableDoppelganger.mount
  },
  {
    id: 'productive-failure-time-machine',
    title: 'Productive Failure Time Machine',
    category: 'Education',
    summary: 'Compare three futures: your current package, a plausible weaker package, and strongest practice.',
    innovation: 'Counterfactual explanation',
    mount: productiveFailureTimeMachine.mount
  },
  {
    id: 'calibration-market',
    title: 'Calibration Market',
    category: 'Education',
    summary: 'Bet on likely strengths and weaknesses, then score your metacognitive calibration.',
    innovation: 'Confidence calibration',
    mount: calibrationMarket.mount
  },
  {
    id: 'claim-evidence-constellation',
    title: 'Claim-Evidence Constellation',
    category: 'Visual',
    summary: 'See claims, evidence, and conflict as a living star map.',
    innovation: 'Provenance visualization',
    mount: claimEvidenceConstellation.mount
  },
  {
    id: 'context-mri',
    title: 'Context MRI',
    category: 'Visual',
    summary: 'Scan the envelope at whole-package, section, and risk-band levels.',
    innovation: 'Semantic structural zoom',
    mount: contextMRI.mount
  },
  {
    id: 'session-hologram-replay',
    title: 'Session Hologram Replay',
    category: 'Visual',
    summary: 'Replay the session as a cinematic timeline of decisions, drift, and recovery.',
    innovation: 'Narrative replay',
    mount: sessionHologramReplay.mount
  },
  {
    id: 'authority-firewall-simulator',
    title: 'Authority Firewall Simulator',
    category: 'Context Engineering',
    summary: 'Run trust-boundary drills against stale policy, borrowed text, and tool-return confusion.',
    innovation: 'Trust-boundary stress test',
    mount: authorityFirewallSimulator.mount
  },
  {
    id: 'trajectory-auditor',
    title: 'Trajectory Auditor',
    category: 'Context Engineering',
    summary: 'Audit the full context-engineering lifecycle instead of grading only the final answer.',
    innovation: 'Lifecycle audit trail',
    mount: trajectoryAuditor.mount
  },
  {
    id: 'prompt-card-claim-ledger',
    title: 'Prompt Card + Claim Ledger',
    category: 'Context Engineering',
    summary: 'Export auditable artifacts that explain the package and map claims back to evidence.',
    innovation: 'Audit-ready delivery artifact',
    mount: promptCardClaimLedger.mount
  }
];

export function findLab(id) {
  return LABS.find((lab) => lab.id === id) || LABS[0];
}

export function categories() {
  return [...new Set(LABS.map((lab) => lab.category))];
}
