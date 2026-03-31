import { escapeHtml } from "../../utils/helpers.js";

export function renderBonusBranchButtons(mission) {
  const branches = mission.bonusBranches || [];
  if (!branches.length) return "";
  return branches.map(branch => `
    <button class="primary-button" data-activate-bonus="${branch.id}">${escapeHtml(branch.title)}</button>
  `).join("");
}

export function renderBranchChecklist(mission) {
  if (!mission.branchVariant?.checklist?.length) return "";
  return `<ul>${mission.branchVariant.checklist.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}


export function renderBranchContextBanner(mission, activeBonusBranch, branchPolicy) {
  if (!activeBonusBranch) return "";
  const overlay = mission?.branchVariant?.overlayLabel
    ? `<p><strong>Replay pack shift:</strong> ${escapeHtml(mission.branchVariant.overlayLabel)}</p>`
    : "";
  const rules = branchPolicy?.exportRules?.length
    ? `<ul>${branchPolicy.exportRules.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : "";
  return `<div class="warning-box" data-bonus-branch-banner="true"><strong>Bonus drill guidance</strong><p>${escapeHtml(activeBonusBranch.coachNote || activeBonusBranch.description || activeBonusBranch.title)}</p>${overlay}${rules}</div>`;
}
