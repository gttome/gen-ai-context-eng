import { buildPreviewText } from "./envelope.js";

function optionLabel(options = [], selectedId = "") {
  return options.find((item) => item.id === selectedId)?.label || "Not selected";
}

function sectionSummary(metrics) {
  return Object.entries(metrics.metrics || {})
    .map(([key, value]) => {
      const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (match) => match.toUpperCase());
      return `- ${label}: ${value}`;
    })
    .join("\n");
}

export function buildLearnerArtifactText(scenario, runState, metrics, reviewResult, config, priorAttempt = null) {
  const preview = buildPreviewText(scenario, runState, config);
  const lines = [];
  lines.push(`${scenario.title} — Learner Artifact`);
  lines.push(`Build: ${config.version}`);
  lines.push("");
  lines.push("MISSION");
  lines.push(`- Learning objective: ${scenario.learningObjective}`);
  lines.push(`- Chapter concept: ${scenario.chapterConcept}`);
  lines.push(`- Readiness: ${metrics.readiness}`);
  lines.push(`- Composite score: ${metrics.composite}`);
  lines.push("");
  lines.push("SELECTED RUN DECISIONS");
  lines.push(`- Precedence: ${optionLabel(scenario.options.precedenceRules, runState.precedenceRule)}`);
  lines.push(`- Output mode: ${optionLabel(scenario.options.outputOptions, runState.outputOption)}`);
  lines.push(`- Missing-information handling: ${optionLabel(scenario.options.handlingOptions, runState.missingInfoHandling)}`);
  lines.push("");
  lines.push("METRICS");
  lines.push(sectionSummary(metrics));
  lines.push("");
  lines.push("NEXT-BEST CHANGES");
  (metrics.nextBestActions || ["Continue comparing section separation, order, and checks."]).forEach((item) => lines.push(`- ${item}`));
  lines.push("");
  lines.push("STRUCTURAL NARRATIVE");
  lines.push(metrics.narrativeSummary || "No narrative summary available.");
  lines.push("");
  if (reviewResult?.hasOutput) {
    lines.push("OBSERVED OUTPUT REVIEW");
    lines.push(`- Status: ${reviewResult.summary}`);
    lines.push(`- Task fit: ${reviewResult.scores.taskFit}`);
    lines.push(`- Evidence use: ${reviewResult.scores.evidenceUse}`);
    lines.push(`- Uncertainty handling: ${reviewResult.scores.uncertaintyHandling}`);
    lines.push(`- Format fit: ${reviewResult.scores.formatFit}`);
    (reviewResult.notes || []).forEach((note) => lines.push(`- ${note}`));
    lines.push("");
  }
  if (priorAttempt) {
    lines.push("PRIOR ATTEMPT COMPARISON");
    lines.push(`- Prior composite score: ${priorAttempt.score}`);
    lines.push(`- Prior readiness: ${priorAttempt.readiness}`);
    if (priorAttempt.metrics) {
      Object.entries(priorAttempt.metrics).forEach(([key, value]) => {
        const current = metrics.metrics[key];
        const delta = typeof current === "number" && typeof value === "number" ? current - value : 0;
        lines.push(`- ${key}: current ${current}, prior ${value}, delta ${delta >= 0 ? "+" : ""}${delta}`);
      });
    }
    lines.push("");
  }
  lines.push("ENVELOPE PREVIEW");
  lines.push(preview);
  return lines.join("\n");
}

export function buildPrintableArtifactHtml({ title, bodyText, theme = "light" }) {
  const background = theme === "dark" ? "#0b1220" : "#ffffff";
  const text = theme === "dark" ? "#eef4ff" : "#172033";
  const panel = theme === "dark" ? "#111a2b" : "#f7fafc";
  const border = theme === "dark" ? "#2c3f5c" : "#d7e1ea";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<style>
body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 24px; background: ${background}; color: ${text}; }
main { max-width: 980px; margin: 0 auto; }
header { margin-bottom: 20px; }
pre { white-space: pre-wrap; background: ${panel}; border: 1px solid ${border}; border-radius: 16px; padding: 20px; line-height: 1.5; }
@media print { body { padding: 0; background: #fff; color: #000; } pre { border-color: #bbb; background: #fff; } }
</style>
</head>
<body>
<main>
<header>
<h1>${title}</h1>
<p>Printable learner artifact generated locally from the current Context Envelope Studio run.</p>
</header>
<pre>${bodyText.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</pre>
</main>
<script>window.addEventListener("load", () => window.print());</script>
</body>
</html>`;
}
