import { loadIndex, readFile, IndexEntry } from "./kb.js";

export interface SearchResult {
  path: string;
  preview: string;
  score: number;
  meta: Omit<IndexEntry, "path" | "preview">;
}

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
]);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#.-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !STOPWORDS.has(token));
}

function countTokenMatches(haystack: Set<string>, queryTokens: string[], weight: number): number {
  return queryTokens.reduce((score, token) => score + (haystack.has(token) ? weight : 0), 0);
}

export function searchKb(
  query: string,
  type?: string,
  limit = 5
): SearchResult[] {
  const index = loadIndex();
  const queryTokens = [...new Set(tokens(query))];

  const filtered = type
    ? index.filter((e) => e.path.startsWith(type + "/"))
    : index;

  const scored = filtered.map((entry) => {
    const metadataText = [
      entry.path,
      ...(entry.tags || []),
      ...(entry.tech || []),
      ...(entry.claim_ids || []),
      entry.stage || "",
      entry.company || "",
      entry.role || "",
      entry.status || "",
    ].join(" ");
    const fullText = [metadataText, entry.preview, entry.content || ""].join(" ");
    const metadataTokens = new Set(tokens(metadataText));
    const fullTokens = new Set(tokens(fullText));
    const exactPhraseBonus =
      query.length > 4 && fullText.toLowerCase().includes(query.toLowerCase()) ? 5 : 0;

    const score =
      countTokenMatches(metadataTokens, queryTokens, 3) +
      countTokenMatches(fullTokens, queryTokens, 1) +
      exactPhraseBonus;

    return { entry, score };
  });

  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ entry, score }) => ({
      path: entry.path,
      preview: entry.preview,
      score,
      meta: {
        date: entry.date,
        tags: entry.tags,
        status: entry.status,
        stage: entry.stage,
        company: entry.company,
        role: entry.role,
        tech: entry.tech || [],
        result: entry.result,
        claim_ids: entry.claim_ids || [],
        content: entry.content,
      },
    }));
}

export function getFullFile(relativePath: string): string {
  return readFile(relativePath);
}
