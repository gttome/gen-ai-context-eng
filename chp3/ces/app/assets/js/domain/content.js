import { validateScenarioPack } from "./schema.js";
import { compileScenario } from "./scenario-engine.js";

const cache = new Map();
async function getJson(path) {
  if (cache.has(path)) return cache.get(path);
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
  const data = await response.json();
  cache.set(path, data);
  return data;
}
export async function loadConfig(){ return getJson("./assets/data/config.json"); }
export async function loadGlossary(){ return getJson("./assets/data/glossary.json"); }
export async function loadScenarioIndex(){ return getJson("./assets/data/scenarios/index.json"); }
export async function loadScenarioPack(id){
  const [config, rawScenario] = await Promise.all([loadConfig(), getJson(`./assets/data/scenarios/${id}.json`)]);
  return compileScenario(rawScenario, config);
}
export function getBlockMap(scenario){ return Object.fromEntries(scenario.blocks.map((block)=>[block.id,block])); }
export function getScenarioSummary(scenario){
  return {
    id: scenario.id,
    title: scenario.title,
    timing: scenario.timing,
    difficulty: scenario.difficulty,
    chapterConcept: scenario.chapterConcept,
    learningObjective: scenario.learningObjective,
    missionTags: scenario.missionTags || [],
    counterfactualCount: (scenario.counterfactuals || []).length
  };
}
export function validateScenarioCollection(scenariosById, config){ const results={}; for (const [id,scenario] of Object.entries(scenariosById||{})) results[id]=validateScenarioPack(scenario, config); return results; }
