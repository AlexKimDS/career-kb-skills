import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";

export function kbPath(): string {
  const p = process.env.KB_PATH;
  if (!p) throw new Error("KB_PATH environment variable is not set.");
  return p;
}

export interface IndexEntry {
  path: string;
  date: string | null;
  tags: string[];
  status: string | null;
  stage: string | null;
  company: string | null;
  role: string | null;
  result: string | null;
  preview: string;
}

export function loadIndex(): IndexEntry[] {
  const indexPath = join(kbPath(), "search-index.json");
  if (!existsSync(indexPath)) return [];
  return JSON.parse(readFileSync(indexPath, "utf8"));
}

export function readFile(relativePath: string): string {
  return readFileSync(join(kbPath(), relativePath), "utf8");
}

export function writeKbFile(relativePath: string, content: string): void {
  const full = join(kbPath(), relativePath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content, "utf8");
}

export function listDir(relativePath: string): string[] {
  const full = join(kbPath(), relativePath);
  if (!existsSync(full)) return [];
  return readdirSync(full);
}
