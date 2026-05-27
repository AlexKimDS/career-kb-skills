import { loadIndex, readFile, IndexEntry } from "./kb.js";

export interface SearchResult {
  path: string;
  preview: string;
  score: number;
  meta: Omit<IndexEntry, "path" | "preview">;
}

export function searchKb(
  query: string,
  type?: string,
  limit = 5
): SearchResult[] {
  const index = loadIndex();
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  const filtered = type
    ? index.filter((e) => e.path.startsWith(type + "/"))
    : index;

  const scored = filtered.map((entry) => {
    const haystack = [
      entry.path,
      entry.preview,
      ...(entry.tags || []),
      entry.stage || "",
      entry.company || "",
      entry.role || "",
    ]
      .join(" ")
      .toLowerCase();

    const score = terms.reduce((acc, term) => {
      const occurrences = (haystack.match(new RegExp(term, "g")) || []).length;
      return acc + occurrences;
    }, 0);

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
        result: entry.result,
      },
    }));
}

export function getFullFile(relativePath: string): string {
  return readFile(relativePath);
}
