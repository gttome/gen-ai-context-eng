import { validateScenarioCollection } from "./scenarioValidation.js";

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Unable to load ${path} (${response.status}).`);
  }
  return response.json();
}

export async function loadScenarioContent() {
  const [registry, glossary] = await Promise.all([
    fetchJson("./assets/data/scenario-registry.json"),
    fetchJson("./assets/data/glossary.json")
  ]);

  const packPayloads = await Promise.all(
    registry.packs.map((pack) => fetchJson(`./${pack.file}`))
  );

  return validateScenarioCollection({
    registry,
    packPayloads,
    glossary
  });
}
