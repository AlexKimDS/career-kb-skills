import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { searchKb, getFullFile } from "./search.js";
import { readFile, writeKbFile, listDir, loadIndex } from "./kb.js";
import { projectTemplate, interviewTemplate, entryTemplate } from "./templates.js";

const server = new McpServer({
  name: "career-kb",
  version: "1.0.0",
});

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
    const results = searchKb(query, type, limit);
    if (results.length === 0) {
      return { content: [{ type: "text", text: "No results found." }] };
    }
    const text = results
      .map(
        (r) =>
          `**${r.path}** (score: ${r.score})\n${r.preview}\n---`
      )
      .join("\n");
    return { content: [{ type: "text", text }] };
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
        content: [{ type: "text", text: `Project '${slug}' not found.` }],
      };
    }
    return { content: [{ type: "text", text: parts.join("\n\n") }] };
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

    return { content: [{ type: "text", text: parts.join("\n\n---\n\n") }] };
  }
);

// ── get_current_status ─────────────────────────────────────────────────────

server.tool(
  "get_current_status",
  "Retrieve the current career status: role, what you're open to, and goals.",
  {},
  async () => {
    try {
      const content = readFile("status/current.md");
      return { content: [{ type: "text", text: content }] };
    } catch {
      return { content: [{ type: "text", text: "status/current.md not found." }] };
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
    const index = loadIndex();
    let projects = index.filter((e) => e.path.startsWith("projects/") && e.path.endsWith("README.md"));
    if (stage) projects = projects.filter((e) => e.stage === stage);
    if (projects.length === 0) {
      return { content: [{ type: "text", text: "No projects found." }] };
    }
    const text = projects
      .map((p) => `- **${p.path}** | stage: ${p.stage || "?"} | ${p.preview.slice(0, 100)}`)
      .join("\n");
    return { content: [{ type: "text", text }] };
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

    writeKbFile(path, body);
    return {
      content: [{ type: "text", text: `Created: ${path}` }],
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
    writeKbFile(filePath, content);
    return { content: [{ type: "text", text: `Updated: ${filePath}` }] };
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
    writeKbFile("status/current.md", content);
    return { content: [{ type: "text", text: "status/current.md updated." }] };
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
    try {
      const content = readFile(filePath);
      return { content: [{ type: "text", text: content }] };
    } catch {
      return { content: [{ type: "text", text: `File not found: ${filePath}` }] };
    }
  }
);

// ── Boot ───────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
