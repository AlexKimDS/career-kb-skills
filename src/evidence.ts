import { readFile } from "./kb.js";

export type ClaimPriority = "headline" | "strong" | "supporting" | "avoid_for_cv";

export interface EvidenceClaim {
  claim_id: string;
  priority: ClaimPriority;
  owner: string;
  dates: string;
  technologies: string[];
  metric: string;
  source_paths: string[];
  confidence: "high" | "medium" | "low";
  visibility: string;
  tags: string[];
  recommended_cv_wording: string;
}

export interface MatchedEvidenceClaim extends EvidenceClaim {
  score: number;
  matched_terms: string[];
}

export interface ValidationResult {
  supported_numbers: Array<{
    number: string;
    claim_ids: string[];
  }>;
  unsupported_numbers: string[];
  possible_mixed_facts: Array<{
    text: string;
    numbers: string[];
    candidate_claim_ids: string[];
    reason: string;
  }>;
  checked_claims: number;
}

const PRIORITY_WEIGHT: Record<ClaimPriority, number> = {
  headline: 10,
  strong: 6,
  supporting: 2,
  avoid_for_cv: -12,
};

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "our",
  "the",
  "to",
  "with",
  "you",
  "your",
  "will",
  "work",
  "team",
  "role",
]);

function parseScalar(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed === "") return "";
  if (trimmed === "null") return null;
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) return [];
    return inner
      .split(",")
      .map((item) => parseScalar(item))
      .filter((item) => item !== "");
  }
  return trimmed;
}

function parseYamlBlock(block: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const rawLine of block.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const [key, ...rest] = line.split(":");
    if (!key || rest.length === 0) continue;
    result[key.trim()] = parseScalar(rest.join(":"));
  }
  return result;
}

function asString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (value === null || value === undefined || value === "") return [];
  return [String(value)];
}

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#.-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !STOPWORDS.has(token));
}

function claimSearchText(claim: EvidenceClaim): string {
  return [
    claim.claim_id,
    claim.priority,
    claim.owner,
    claim.dates,
    claim.metric,
    claim.recommended_cv_wording,
    claim.visibility,
    claim.confidence,
    ...claim.technologies,
    ...claim.tags,
    ...claim.source_paths,
  ].join(" ");
}

function normalizeMetricText(text: string): string {
  return text
    .replace(/\\%/g, "%")
    .replace(/\\textasciitilde/g, "~")
    .replace(/--/g, "-")
    .replace(/[–—]/g, "-")
    .toLowerCase();
}

export function loadEvidenceClaims(): EvidenceClaim[] {
  const content = readFile("profile/cv-evidence.md");
  const blocks = [...content.matchAll(/```ya?ml\n([\s\S]*?)```/g)].map((match) => match[1]);
  return blocks
    .map(parseYamlBlock)
    .filter((raw) => raw.claim_id)
    .map((raw) => ({
      claim_id: asString(raw.claim_id),
      priority: asString(raw.priority) as ClaimPriority,
      owner: asString(raw.owner),
      dates: asString(raw.dates),
      technologies: asStringArray(raw.technologies),
      metric: asString(raw.metric),
      source_paths: asStringArray(raw.source_paths),
      confidence: asString(raw.confidence) as EvidenceClaim["confidence"],
      visibility: asString(raw.visibility),
      tags: asStringArray(raw.tags),
      recommended_cv_wording: asString(raw.recommended_cv_wording),
    }));
}

export function matchEvidenceToJd(
  jdText: string,
  limit = 10,
  includeAvoid = false
): MatchedEvidenceClaim[] {
  const queryTokens = [...new Set(tokens(jdText))];
  const claims = loadEvidenceClaims().filter(
    (claim) => includeAvoid || claim.priority !== "avoid_for_cv"
  );

  return claims
    .map((claim) => {
      const claimTokens = new Set(tokens(claimSearchText(claim)));
      const matchedTerms = queryTokens.filter((token) => claimTokens.has(token));
      const score = matchedTerms.length + PRIORITY_WEIGHT[claim.priority];
      return {
        ...claim,
        score,
        matched_terms: matchedTerms,
      };
    })
    .filter((claim) => claim.matched_terms.length > 0 && claim.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
    })
    .slice(0, limit);
}

export function getClaimsByIds(claimIds: string[]): EvidenceClaim[] {
  const requested = new Set(claimIds);
  return loadEvidenceClaims().filter((claim) => requested.has(claim.claim_id));
}

function extractNumbers(text: string): string[] {
  const normalized = normalizeMetricText(text);
  const matches = normalized.match(
    /(?:~|\+)?\d+(?:\.\d+)?(?:\s*[-/]\s*(?:~|\+)?\d+(?:\.\d+)?)?\s*(?:k|m|b|%|pp|hrs?\/week|days?\/week|users?\/year|customers?|stores?|transactions?\/day|fis|members|patents?|disclosures|classes|categories)?\+?/gi
  );
  return [...new Set((matches || []).map((match) => match.replace(/\s+/g, " ").trim()))];
}

function claimNumbers(claim: EvidenceClaim): string[] {
  return extractNumbers([claim.metric, claim.recommended_cv_wording].join(" "));
}

export function validateCvFacts(cvText: string): ValidationResult {
  const claims = loadEvidenceClaims();
  const numberToClaimIds = new Map<string, Set<string>>();
  for (const claim of claims) {
    for (const number of claimNumbers(claim)) {
      if (!numberToClaimIds.has(number)) numberToClaimIds.set(number, new Set());
      numberToClaimIds.get(number)?.add(claim.claim_id);
    }
  }

  const normalizedCv = normalizeMetricText(cvText);
  const cvNumbers = extractNumbers(normalizedCv);
  const supportedNumbers: ValidationResult["supported_numbers"] = [];
  const unsupportedNumbers: string[] = [];
  for (const number of cvNumbers) {
    const claimIds = numberToClaimIds.get(number);
    if (claimIds?.size) {
      supportedNumbers.push({ number, claim_ids: [...claimIds].sort() });
    } else {
      unsupportedNumbers.push(number);
    }
  }

  const possibleMixedFacts: ValidationResult["possible_mixed_facts"] = [];
  const candidateLines = normalizedCv
    .split(/\n|\\\\item|\.\s+/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of candidateLines) {
    const numbers = extractNumbers(line);
    if (numbers.length < 2) continue;
    const claimSets = numbers
      .map((number) => numberToClaimIds.get(number))
      .filter((set): set is Set<string> => Boolean(set?.size));
    if (claimSets.length < 2) continue;

    const common = [...claimSets[0]].filter((claimId) =>
      claimSets.every((set) => set.has(claimId))
    );
    if (common.length === 0) {
      const candidateClaimIds = [...new Set(claimSets.flatMap((set) => [...set]))].sort();
      possibleMixedFacts.push({
        text: line,
        numbers,
        candidate_claim_ids: candidateClaimIds,
        reason: "This line contains metrics that do not share a single evidence claim.",
      });
    }
  }

  return {
    supported_numbers: supportedNumbers,
    unsupported_numbers: unsupportedNumbers,
    possible_mixed_facts: possibleMixedFacts,
    checked_claims: claims.length,
  };
}
