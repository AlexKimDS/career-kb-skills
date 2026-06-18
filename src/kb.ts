import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, statSync } from "fs";
import { join, dirname } from "path";
import { execSync, spawnSync } from "child_process";

export function kbPath(): string {
  const p = process.env.KB_PATH;
  if (!p) throw new Error("KB_PATH environment variable is not set.");
  return p;
}

const FRESHNESS_TTL_MS = 5 * 60 * 1000; // 5 minutes
let lastFreshnessCheck = 0;

const SKIP_DIRS = new Set([".git", "node_modules", "scripts", "assets"]);

function latestMarkdownMtime(dir: string): number {
  let latest = 0;
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".") || SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      latest = Math.max(latest, latestMarkdownMtime(full));
    } else if (name.endsWith(".md")) {
      latest = Math.max(latest, stat.mtimeMs);
    }
  }
  return latest;
}

function ensureLocalIndexFresh(dir: string): { rebuilt: boolean; warning?: string } {
  const indexPath = join(dir, "search-index.json");
  const indexMtime = existsSync(indexPath) ? statSync(indexPath).mtimeMs : 0;
  const latestMdMtime = latestMarkdownMtime(dir);
  if (indexMtime >= latestMdMtime) return { rebuilt: false };

  try {
    execSync("node scripts/build-index.mjs", { cwd: dir, stdio: "pipe" });
    return { rebuilt: true };
  } catch {
    return {
      rebuilt: false,
      warning: "Local KB markdown is newer than search-index.json, and automatic index rebuild failed.",
    };
  }
}

export function ensureFresh(): { pulled: boolean; rebuilt: boolean; warning?: string } {
  const now = Date.now();
  if (now - lastFreshnessCheck < FRESHNESS_TTL_MS) {
    const local = ensureLocalIndexFresh(kbPath());
    return { pulled: false, rebuilt: local.rebuilt, warning: local.warning };
  }
  lastFreshnessCheck = now;

  const dir = kbPath();
  let pulled = false;
  let warning: string | undefined;
  try {
    execSync("git fetch origin", { cwd: dir, stdio: "pipe" });
  } catch {
    warning = "Could not reach GitHub to check for updates.";
  }

  if (!warning) {
    try {
      const local = execSync("git rev-parse HEAD", { cwd: dir }).toString().trim();
      const remote = execSync("git rev-parse origin/main", { cwd: dir }).toString().trim();
      if (local !== remote) {
        execSync("git pull --ff-only origin main", { cwd: dir, stdio: "pipe" });
        pulled = true;
        lastFreshnessCheck = 0; // reset so next call re-validates after the pull
      }
    } catch {
      warning = "Remote has updates but pull failed — local KB may be stale.";
    }
  }

  const localIndex = ensureLocalIndexFresh(dir);
  const warnings = [warning, localIndex.warning].filter(Boolean).join(" ");
  return {
    pulled,
    rebuilt: localIndex.rebuilt,
    warning: warnings || undefined,
  };
}

export interface IndexEntry {
  path: string;
  date: string | null;
  tags: string[];
  status: string | null;
  stage: string | null;
  company: string | null;
  role: string | null;
  tech: string[];
  result: string | null;
  claim_ids: string[];
  preview: string;
  content?: string;
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

function commitKbFile(relativePath: string, message: string): { committed: boolean; warning?: string } {
  const dir = kbPath();
  const add = spawnSync("git", ["add", "--", relativePath], { cwd: dir, encoding: "utf8" });
  if (add.status !== 0) {
    return { committed: false, warning: `git add failed: ${(add.stderr ?? "").trim() || "unknown error"}` };
  }
  const commit = spawnSync("git", ["commit", "-m", message], { cwd: dir, encoding: "utf8" });
  if (commit.status === 0) return { committed: true };
  const out = (commit.stdout ?? "") + (commit.stderr ?? "");
  const isNoop = out.includes("nothing to commit") || out.includes("nothing added to commit");
  return {
    committed: false,
    warning: isNoop ? undefined : `git commit failed: ${(commit.stderr ?? "").trim() || "unknown error"}`,
  };
}

export function writeAndCommitKbFile(
  relativePath: string,
  content: string,
  message: string
): { committed: boolean; warning?: string } {
  writeKbFile(relativePath, content);
  return commitKbFile(relativePath, message);
}

export function listDir(relativePath: string): string[] {
  const full = join(kbPath(), relativePath);
  if (!existsSync(full)) return [];
  return readdirSync(full);
}
