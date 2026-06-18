import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { searchKb, getFullFile } from "./search.js";
import { readFile, writeAndCommitKbFile, listDir, loadIndex, ensureFresh } from "./kb.js";
import { projectTemplate, interviewTemplate, entryTemplate } from "./templates.js";
import { getClaimsByIds, matchEvidenceToJd, validateCvFacts } from "./evidence.js";

const server = new McpServer({
  name: "career-kb",
  version: "1.0.0",
});

function commitNotice(committed: boolean, warning?: string): string {
  return warning ? `\n> ⚠️ ${warning}` : committed ? `\n> ✅ Committed to git.` : "";
}

function freshnessNotice(): string {
  const { pulled, rebuilt, warning } = ensureFresh();
  if (warning) return `> ⚠️ KB freshness: ${warning}\n\n`;
  if (pulled && rebuilt) return `> ✅ KB updated from GitHub and local search index rebuilt.\n\n`;
  if (pulled) return `> ✅ KB updated from GitHub.\n\n`;
  if (rebuilt) return `> ✅ Local KB search index rebuilt.\n\n`;
  return "";
}

// ── search_kb ──────────────────────────────────────────────────────────────

server.tool(
  "search_kb",
  "Search the career knowledge base by keyword. Returns matching file paths and previews.",
  {
    query: z.string().describe("Search terms"),
    type: z
      .enum(["projects", "experience", "interviews", "content", "profile", "status"])
      .optional()
      .describe("Restrict results to a specific section"),
    limit: z.number().int().min(1).max(20).optional().default(5),
  },
  async ({ query, type, limit }) => {
    const notice = freshnessNotice();
    const results = searchKb(query, type, limit);
    if (results.length === 0) {
      return { content: [{ type: "text", text: notice + "No results found." }] };
    }
    const text = results
      .map(
        (r) =>
          `**${r.path}** (score: ${r.score})\n${r.preview}\n---`
      )
      .join("\n");
    return { content: [{ type: "text", text: notice + text }] };
  }
);

// ── match_jd_to_evidence ──────────────────────────────────────────────────

server.tool(
  "match_jd_to_evidence",
  "Rank structured CV evidence claims against a job description. Use this as the primary input for CV tailoring.",
  {
    jd_text: z.string().describe("Full job description text or a detailed JD summary"),
    limit: z.number().int().min(1).max(25).optional().default(10),
    include_avoid: z
      .boolean()
      .optional()
      .default(false)
      .describe("Include claims marked avoid_for_cv. Defaults to false."),
  },
  async ({ jd_text, limit, include_avoid }) => {
    const notice = freshnessNotice();
    const matches = matchEvidenceToJd(jd_text, limit, include_avoid);
    if (matches.length === 0) {
      return { content: [{ type: "text", text: notice + "No evidence claims matched." }] };
    }

    const text = matches
      .map(
        (claim, index) =>
          [
            `## ${index + 1}. ${claim.claim_id} (score: ${claim.score}, priority: ${claim.priority})`,
            `**Owner:** ${claim.owner}`,
            `**Dates:** ${claim.dates}`,
            `**Metric:** ${claim.metric}`,
            `**Tech:** ${claim.technologies.join(", ") || "n/a"}`,
            `**Visibility:** ${claim.visibility}; confidence: ${claim.confidence}`,
            `**Source paths:** ${claim.source_paths.join(", ")}`,
            `**Matched terms:** ${claim.matched_terms.join(", ") || "n/a"}`,
            `**Recommended CV wording:** ${claim.recommended_cv_wording}`,
          ].join("\n")
      )
      .join("\n\n---\n\n");

    return { content: [{ type: "text", text: notice + text }] };
  }
);

// ── get_claims ─────────────────────────────────────────────────────────────

server.tool(
  "get_claims",
  "Fetch exact source-bound CV evidence claims by claim_id.",
  {
    claim_ids: z.array(z.string()).min(1).max(25).describe("Claim IDs to retrieve"),
  },
  async ({ claim_ids }) => {
    const notice = freshnessNotice();
    const claims = getClaimsByIds(claim_ids);
    const found = new Set(claims.map((claim) => claim.claim_id));
    const missing = claim_ids.filter((claimId) => !found.has(claimId));

    const text = claims
      .map(
        (claim) =>
          [
            `## ${claim.claim_id}`,
            `**Priority:** ${claim.priority}`,
            `**Owner:** ${claim.owner}`,
            `**Dates:** ${claim.dates}`,
            `**Metric:** ${claim.metric}`,
            `**Tech:** ${claim.technologies.join(", ") || "n/a"}`,
            `**Visibility:** ${claim.visibility}; confidence: ${claim.confidence}`,
            `**Source paths:** ${claim.source_paths.join(", ")}`,
            `**Recommended CV wording:** ${claim.recommended_cv_wording}`,
          ].join("\n")
      )
      .join("\n\n---\n\n");

    const missingText = missing.length ? `\n\nMissing claim IDs: ${missing.join(", ")}` : "";
    return {
      content: [
        {
          type: "text",
          text: notice + (text || "No requested claims found.") + missingText,
        },
      ],
    };
  }
);

// ── validate_cv_facts ──────────────────────────────────────────────────────

server.tool(
  "validate_cv_facts",
  "Validate numbers in a CV draft against the structured CV evidence claim bank and flag possible metric mixing.",
  {
    cv_text: z.string().describe("Full CV text, LaTeX source, or selected CV bullets to validate"),
  },
  async ({ cv_text }) => {
    const notice = freshnessNotice();
    const result = validateCvFacts(cv_text);
    const text = [
      `Checked ${result.checked_claims} evidence claims.`,
      "",
      "## Supported numbers",
      result.supported_numbers.length
        ? result.supported_numbers
            .map((item) => `- ${item.number}: ${item.claim_ids.join(", ")}`)
            .join("\n")
        : "- None found",
      "",
      "## Unsupported numbers",
      result.unsupported_numbers.length
        ? result.unsupported_numbers.map((number) => `- ${number}`).join("\n")
        : "- None",
      "",
      "## Possible mixed facts",
      result.possible_mixed_facts.length
        ? result.possible_mixed_facts
            .map(
              (item) =>
                `- ${item.reason}\n  Text: ${item.text}\n  Numbers: ${item.numbers.join(", ")}\n  Candidate claims: ${item.candidate_claim_ids.join(", ")}`
            )
            .join("\n")
        : "- None",
    ].join("\n");

    return { content: [{ type: "text", text: notice + text }] };
  }
);

// ── get_project ────────────────────────────────────────────────────────────

server.tool(
  "get_project",
  "Get the full content of a project entry. Returns README, context, and metrics files.",
  {
    slug: z.string().describe("Project folder name under projects/"),
  },
  async ({ slug }) => {
    const notice = freshnessNotice();
    const files = ["README.md", "context.md", "metrics.md"];
    const parts: string[] = [];
    for (const file of files) {
      try {
        const content = getFullFile(`projects/${slug}/${file}`);
        parts.push(`## ${file}\n\n${content}`);
      } catch {
        // file doesn't exist for this project — skip silently
      }
    }
    if (parts.length === 0) {
      return {
        content: [{ type: "text", text: notice + `Project '${slug}' not found.` }],
      };
    }
    return { content: [{ type: "text", text: notice + parts.join("\n\n") }] };
  }
);

// ── get_style ──────────────────────────────────────────────────────────────

server.tool(
  "get_style",
  "Retrieve the writing style guide and recent post samples. Use before generating any content.",
  {
    samples: z
      .number()
      .int()
      .min(0)
      .max(20)
      .optional()
      .default(5)
      .describe("Number of post samples to include"),
  },
  async ({ samples }) => {
    const notice = freshnessNotice();
    const parts: string[] = [];

    try {
      parts.push("## Writing style guide\n\n" + readFile("profile/writing-style.md"));
    } catch {
      parts.push("## Writing style guide\n\n(Not yet created)");
    }

    if (samples > 0) {
      const postFiles = listDir("content/posts").slice(0, samples);
      for (const file of postFiles) {
        try {
          parts.push(`## Sample: ${file}\n\n` + readFile(`content/posts/${file}`));
        } catch {}
      }
    }

    return { content: [{ type: "text", text: notice + parts.join("\n\n---\n\n") }] };
  }
);

// ── get_current_status ─────────────────────────────────────────────────────

server.tool(
  "get_current_status",
  "Retrieve the current career status: role, what you're open to, and goals.",
  {},
  async () => {
    const notice = freshnessNotice();
    try {
      const content = readFile("status/current.md");
      return { content: [{ type: "text", text: notice + content }] };
    } catch {
      return { content: [{ type: "text", text: notice + "status/current.md not found." }] };
    }
  }
);

// ── list_projects ──────────────────────────────────────────────────────────

server.tool(
  "list_projects",
  "List all projects in the knowledge base with their status and stage.",
  {
    stage: z
      .enum(["in-progress", "shipped", "archived"])
      .optional()
      .describe("Filter by project stage"),
  },
  async ({ stage }) => {
    const notice = freshnessNotice();
    const index = loadIndex();
    let projects = index.filter((e) => e.path.startsWith("projects/") && e.path.endsWith("README.md"));
    if (stage) projects = projects.filter((e) => e.stage === stage);
    if (projects.length === 0) {
      return { content: [{ type: "text", text: notice + "No projects found." }] };
    }
    const text = projects
      .map((p) => `- **${p.path}** | stage: ${p.stage || "?"} | ${p.preview.slice(0, 100)}`)
      .join("\n");
    return { content: [{ type: "text", text: notice + text }] };
  }
);

// ── add_entry ──────────────────────────────────────────────────────────────

server.tool(
  "add_entry",
  "Create a new entry in the knowledge base from a template.",
  {
    type: z
      .enum(["project", "experience", "interview", "post", "note"])
      .describe("Type of entry to create"),
    slug: z.string().describe("Folder or file name (kebab-case)"),
    content: z
      .string()
      .optional()
      .describe("Optional initial content. If omitted, a template is used."),
  },
  async ({ type, slug, content }) => {
    const date = new Date().toISOString().split("T")[0];
    let path: string;
    let body: string;

    switch (type) {
      case "project":
        path = `projects/${slug}/README.md`;
        body = content ?? projectTemplate(slug, date);
        break;
      case "experience":
        path = `experience/${slug}/role.md`;
        body = content ?? entryTemplate("experience", slug, date);
        break;
      case "interview":
        path = `interviews/${slug}/prep.md`;
        body = content ?? interviewTemplate(slug, date);
        break;
      case "post":
        path = `content/posts/${date}-${slug}.md`;
        body = content ?? entryTemplate("post", slug, date);
        break;
      case "note":
      default:
        path = `notes/${slug}.md`;
        body = content ?? entryTemplate("note", slug, date);
        break;
    }

    const { committed, warning } = writeAndCommitKbFile(path, body, `kb: add ${type} ${slug}`);
    return {
      content: [{ type: "text", text: `Created: ${path}${commitNotice(committed, warning)}` }],
    };
  }
);

// ── update_file ────────────────────────────────────────────────────────────

server.tool(
  "update_file",
  "Overwrite any file in the knowledge base with new content.",
  {
    path: z.string().describe("Relative path from KB root, e.g. projects/my-project/README.md"),
    content: z.string().describe("Full new content for the file"),
  },
  async ({ path: filePath, content }) => {
    const { committed, warning } = writeAndCommitKbFile(filePath, content, `kb: update ${filePath}`);
    return { content: [{ type: "text", text: `Updated: ${filePath}${commitNotice(committed, warning)}` }] };
  }
);

// ── update_status ──────────────────────────────────────────────────────────

server.tool(
  "update_status",
  "Overwrite status/current.md with new content.",
  {
    content: z.string().describe("Full Markdown content for status/current.md"),
  },
  async ({ content }) => {
    const { committed, warning } = writeAndCommitKbFile("status/current.md", content, "kb: update status/current.md");
    return { content: [{ type: "text", text: `status/current.md updated.${commitNotice(committed, warning)}` }] };
  }
);

// ── get_file ───────────────────────────────────────────────────────────────

server.tool(
  "get_file",
  "Read any file in the knowledge base by its relative path.",
  {
    path: z.string().describe("Relative path from the KB root, e.g. profile/bio.md"),
  },
  async ({ path: filePath }) => {
    const notice = freshnessNotice();
    try {
      const content = readFile(filePath);
      return { content: [{ type: "text", text: notice + content }] };
    } catch {
      return { content: [{ type: "text", text: notice + `File not found: ${filePath}` }] };
    }
  }
);

// ── Boot ───────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
