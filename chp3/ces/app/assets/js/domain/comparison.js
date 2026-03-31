import { compareToStrongest } from "./envelope.js";

function blockMapFromScenario(scenario) {
  return Object.fromEntries((scenario?.blocks || []).map((block) => [block.id, block]));
}

function labelFor(blockMap, id) {
  return blockMap[id]?.label || id;
}

function optionLabel(options = [], id) {
  return options.find((item) => item.id === id)?.label || id || "Not selected";
}

function sectionImprovement(section, detail, rationale) {
  const missingCount = detail.missing.length;
  const extraCount = detail.extras.length;
  if (!detail.current.length && detail.expected.length) {
    return `${section} is empty right now. Add the expected material so the package stays reviewable. ${rationale}`.trim();
  }
  if (missingCount && extraCount) {
    return `${section} is blending missing and extra material. Restore the expected anchor blocks first, then move the extras to sections that match their job. ${rationale}`.trim();
  }
  if (missingCount) {
    return `${section} is missing a strongest-practice anchor block. Add it before rerunning so the model sees the governing logic in the right place. ${rationale}`.trim();
  }
  if (extraCount) {
    return `${section} contains material that would be easier to interpret elsewhere. Move the extra card${extraCount === 1 ? "" : "s"} so unlike things stay separate. ${rationale}`.trim();
  }
  if (detail.orderDrift.length) {
    return `${section} contains the right cards, but the order is weaker than the strongest-practice pattern. Tighten sequence so the model encounters the governing logic earlier. ${rationale}`.trim();
  }
  return `This section is close to the strongest-practice structure. ${rationale}`.trim();
}

export function buildDetailedComparison(scenario, runState, config) {
  const blockMap = blockMapFromScenario(scenario);
  const raw = compareToStrongest(scenario, runState, config);
  const sections = (config?.sectionOrder || []).map((section) => {
    const current = runState.sections?.[section] || [];
    const expected = scenario.strongestPractice?.sections?.[section] || [];
    const currentPosition = Object.fromEntries(current.map((id, index) => [id, index]));
    const orderDrift = expected
      .filter((id, index) => current.includes(id) && currentPosition[id] !== index)
      .map((id) => labelFor(blockMap, id));
    const detail = raw.diffs.find((item) => item.section === section) || { section, missing: [], extras: [] };
    const status = !detail.missing.length && !detail.extras.length && !orderDrift.length ? "aligned" : detail.missing.length && detail.extras.length ? "mixed" : detail.missing.length ? "missing" : detail.extras.length ? "extra" : "ordering";
    const rationale = scenario.strongestPractice?.rationale?.[section] || "The strongest-practice pattern keeps this section easier to review.";
    return {
      section,
      status,
      rationale,
      expectedLabels: expected.map((id) => labelFor(blockMap, id)),
      currentLabels: current.map((id) => labelFor(blockMap, id)),
      missingLabels: detail.missing.map((id) => labelFor(blockMap, id)),
      extraLabels: detail.extras.map((id) => labelFor(blockMap, id)),
      orderDrift,
      improvement: sectionImprovement(section, { ...detail, current, expected, orderDrift }, rationale)
    };
  });

  const decisions = [
    {
      key: "precedence",
      label: "Precedence rule",
      aligned: runState.precedenceRule === scenario.strongestPractice?.precedenceRule,
      current: optionLabel(scenario.options?.precedenceRules, runState.precedenceRule),
      expected: optionLabel(scenario.options?.precedenceRules, scenario.strongestPractice?.precedenceRule),
      why: "Strongest practice makes source priority explicit so the model does not guess which evidence wins."
    },
    {
      key: "output",
      label: "Output contract",
      aligned: runState.outputOption === scenario.strongestPractice?.outputOption,
      current: optionLabel(scenario.options?.outputOptions, runState.outputOption),
      expected: optionLabel(scenario.options?.outputOptions, scenario.strongestPractice?.outputOption),
      why: "A reviewable output contract keeps later evaluation consistent across runs and reviewers."
    },
    {
      key: "handling",
      label: "Missing-information behavior",
      aligned: runState.missingInfoHandling === scenario.strongestPractice?.missingInfoHandling,
      current: optionLabel(scenario.options?.handlingOptions, runState.missingInfoHandling),
      expected: optionLabel(scenario.options?.handlingOptions, scenario.strongestPractice?.missingInfoHandling),
      why: "Strongest practice makes uncertainty visible instead of letting the model silently over-answer."
    }
  ];

  return { sections, decisions };
}
