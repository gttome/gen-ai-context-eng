function normalize(text) {
  return String(text || "").trim().toLowerCase();
}

function difficultyRank(value) {
  return { Foundational: 0, Intermediate: 1, Advanced: 2 }[value] ?? 0;
}

function packRank(value) {
  return String(value || "Core Watchtower Pack").includes("Optional") ? 1 : 0;
}

export function filterScenarios(scenarios = [], filters = {}) {
  const search = normalize(filters.search);
  const domain = filters.domain || "all";
  const difficulty = filters.difficulty || "all";
  const pack = filters.pack || "all";
  const mode = filters.mode || "all";
  const sort = filters.sort || "recommended";

  const rows = scenarios.map((scenario) => ({
    scenario,
    searchable: normalize([
      scenario.title,
      scenario.objective,
      scenario.domain,
      scenario.difficulty,
      scenario.pack || "Core Watchtower Pack"
    ].join(" "))
  })).filter((row) => {
    if (search && !row.searchable.includes(search)) return false;
    if (domain !== "all" && row.scenario.domain !== domain) return false;
    if (difficulty !== "all" && row.scenario.difficulty !== difficulty) return false;
    if (pack !== "all" && (row.scenario.pack || "Core Watchtower Pack") !== pack) return false;
    if (mode === "external" && !row.scenario.manualExternalComparison) return false;
    if (mode === "internal" && row.scenario.manualExternalComparison) return false;
    return true;
  });

  rows.sort((a, b) => {
    if (sort === "title") return a.scenario.title.localeCompare(b.scenario.title);
    if (sort === "difficulty") {
      return difficultyRank(a.scenario.difficulty) - difficultyRank(b.scenario.difficulty) || a.scenario.title.localeCompare(b.scenario.title);
    }
    return packRank(a.scenario.pack) - packRank(b.scenario.pack)
      || difficultyRank(a.scenario.difficulty) - difficultyRank(b.scenario.difficulty)
      || Number(a.scenario.manualExternalComparison) - Number(b.scenario.manualExternalComparison)
      || a.scenario.title.localeCompare(b.scenario.title);
  });

  return rows;
}
