import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { ensureFresh, loadIndex } from "./kb.js";
import { matchEvidenceToJd, validateCvFacts } from "./evidence.js";

const KB_ROOT = "/Users/alexkim/my-projects/MyCareerKB/career-kb";
process.env.KB_PATH = KB_ROOT;

test("build-index normalizes frontmatter arrays and indexes full content", () => {
  execSync("node scripts/build-index.mjs", { cwd: KB_ROOT });
  const index = loadIndex();
  const fusion = index.find((entry) => entry.path === "projects/fusion-ai-agents/README.md");
  assert.ok(fusion);
  assert.deepEqual(fusion.tags.slice(0, 2), ["llm-agents", "intuit"]);
  const fusionMetrics = index.find((entry) => entry.path === "projects/fusion-ai-agents/metrics.md");
  assert.ok(fusionMetrics?.content?.includes("70,000+ international customers"));

  const evidence = index.find((entry) => entry.path === "profile/cv-evidence.md");
  assert.ok(evidence);
  assert.ok(evidence.claim_ids.includes("intl_agentic_insights_impact"));
});

test("ensureFresh rebuilds stale local index", () => {
  const tempPath = join(KB_ROOT, "tmp-index-freshness-test.md");
  try {
    const before = existsSync(join(KB_ROOT, "search-index.json"))
      ? statSync(join(KB_ROOT, "search-index.json")).mtimeMs
      : 0;
    writeFileSync(
      tempPath,
      "---\ndate: 2026-06-03\ntags: [test-index]\nstatus: active\n---\n\n# Temporary index freshness test\n",
      "utf8"
    );
    const result = ensureFresh();
    const after = statSync(join(KB_ROOT, "search-index.json")).mtimeMs;
    assert.equal(result.rebuilt, true);
    assert.ok(after >= before);
    assert.ok(loadIndex().some((entry) => entry.path === "tmp-index-freshness-test.md"));
  } finally {
    rmSync(tempPath, { force: true });
    execSync("node scripts/build-index.mjs", { cwd: KB_ROOT });
  }
});

test("JD evidence matching returns expected top claims", () => {
  const agentClaims = matchEvidenceToJd(
    "Senior applied AI agent engineer building conversational AI agents, LLM evaluation, monitoring, LangGraph, customer-facing deployment",
    6
  ).map((claim) => claim.claim_id);
  assert.ok(agentClaims.includes("intl_fusion_ai_agents_evaluation"));
  assert.ok(agentClaims.includes("intl_agentic_insights_impact"));
  assert.ok(!agentClaims.includes("digital_diesel_forecasting"));

  const safetyClaims = matchEvidenceToJd(
    "Frontier AI safety role focused on adversarial evaluation, LLM-as-judge, human feedback, risk measurement",
    5
  ).map((claim) => claim.claim_id);
  assert.ok(safetyClaims.includes("israel_llm_judge_triage"));

  const recommendationClaims = matchEvidenceToJd(
    "Recommendation systems role with uplift modeling, personalization, experimentation, growth, customer adoption",
    5
  ).map((claim) => claim.claim_id);
  assert.ok(recommendationClaims.includes("intl_recommendations_advanced_upgrade"));
  assert.ok(recommendationClaims.includes("intl_auto_invoice_roemea"));

  const leadClaims = matchEvidenceToJd(
    "Data science manager role: hiring, team leadership, mentoring, cross-functional data science community",
    5
  ).map((claim) => claim.claim_id);
  assert.ok(leadClaims.includes("x5_team_leadership"));
  assert.ok(leadClaims.includes("leadership_data_science_guild"));
});

test("validateCvFacts flags unsupported and mixed metrics", () => {
  const valid = validateCvFacts(
    "Designed LLM-as-judge triage, reducing inference spend by 33\\% and improving human-rater agreement from 71\\% to 84\\%."
  );
  assert.equal(valid.unsupported_numbers.length, 0);
  assert.equal(valid.possible_mixed_facts.length, 0);

  const invalid = validateCvFacts(
    "Built one platform serving 70K+ customers while adding ~460 more Advanced users/year and reducing cost by 99\\%."
  );
  assert.ok(invalid.unsupported_numbers.includes("99%"));
  assert.ok(invalid.possible_mixed_facts.length >= 1);
});
