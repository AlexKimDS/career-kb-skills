import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { execSync } from "child_process";

export function kbPath(): string {
  const p = process.env.KB_PATH;
  if (!p) throw new Error("KB_PATH environment variable is not set.");
  return p;
}

const FRESHNESS_TTL_MS = 5 * 60 * 1000; // 5 minutes
let lastFreshnessCheck = 0;

export function ensureFresh(): { pulled: boolean; warning?: string } {
  const now = Date.now();
  if (now - lastFreshnessCheck < FRESHNESS_TTL_MS) {
    return { pulled: false };
  }
  lastFreshnessCheck = now;

  const dir = kbPath();
  try {
    execSync("git fetch origin", { cwd: dir, stdio: "pipe" });
  } catch {
    return { pulled: false, warning: "Could not reach GitHub to check for updates." };
  }

  try {
    const local = execSync("git rev-parse HEAD", { cwd: dir }).toString().trim();
    const remote = execSync("git rev-parse origin/main", { cwd: dir }).toString().trim();
    if (local === remote) return { pulled: false };

    execSync("git pull --ff-only origin main", { cwd: dir, stdio: "pipe" });
    lastFreshnessCheck = 0; // reset so next call re-validates after the pull
    return { pulled: true };
  } catch {
    return { pulled: false, warning: "Remote has updates but pull failed — local KB may be stale." };
  }
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
