# career-kb-skills

MCP server for the `career-kb` personal knowledge base.
Provides tools for searching, reading, and writing career knowledge from any MCP-compatible agent.

> **No persistent service needed.** This is a stdio MCP server. Claude Desktop, Claude Code, Cursor, etc.
> launch it on demand when a session starts — nothing needs to be running in the background.

## Tools

| Tool | Description |
|------|-------------|
| `search_kb` | Full-text search across all KB files |
| `get_project` | Fetch full project context by slug |
| `get_style` | Retrieve writing style guide + post samples |
| `get_current_status` | Read current career status |
| `list_projects` | List projects, optionally filtered by stage |
| `add_entry` | Create a new KB entry from a template |
| `update_file` | Overwrite any file by path |
| `update_status` | Overwrite current status file (convenience alias) |
| `get_file` | Read any file by path |

## Setup

```bash
npm install
cp .env.example .env
# Edit .env: set KB_PATH to the absolute path of your career-kb clone
npm run build
```

## Agent configuration

Use `npx tsx` during development (no build step needed), or `node dist/index.js` after building.

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "career-kb": {
      "command": "node",
      "args": ["/absolute/path/to/career-kb-skills/dist/index.js"],
      "env": {
        "KB_PATH": "/absolute/path/to/career-kb"
      }
    }
  }
}
```

**Dev shortcut** (no build needed):
```json
{
  "mcpServers": {
    "career-kb": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/career-kb-skills/src/index.ts"],
      "env": {
        "KB_PATH": "/absolute/path/to/career-kb"
      }
    }
  }
}
```

### Claude Code (global)

Edit `~/.claude/settings.json` — add under `"mcpServers"`:

```json
"career-kb": {
  "command": "node",
  "args": ["/absolute/path/to/career-kb-skills/dist/index.js"],
  "env": {
    "KB_PATH": "/absolute/path/to/career-kb"
  }
}
```

### Cursor

Edit `.cursor/mcp.json` in the same format as Claude Desktop.

### Zed

Edit `~/.config/zed/settings.json`:

```json
{
  "context_servers": {
    "career-kb": {
      "command": "node",
      "args": ["/absolute/path/to/career-kb-skills/dist/index.js"],
      "env": {
        "KB_PATH": "/absolute/path/to/career-kb"
      }
    }
  }
}
```

## Claude Code Skills

In addition to the MCP server, this repo includes Claude Code slash command skills — markdown instruction files that Claude executes when invoked with `/command-name`.

Install a skill by copying it to `~/.claude/commands/`:

```bash
cp commands/tailor-cv.md ~/.claude/commands/tailor-cv.md
```

### Available skills

#### `/tailor-cv <JD_URL>`

Tailors the CV for a specific job application and generates a matching cover letter.

**What it does:**
1. Crawls the job description URL
2. Pulls relevant context from the career KB (experience, projects, writing style)
3. Creates an isolated git branch in the CV repo (`cv/{company}-{role}`)
4. Tailors CV sections to match the JD — reorders, keyword-matches, adjusts emphasis. Never fabricates facts.
5. Generates a cover letter with company-specific "Why them / Why me" sections
6. Compiles both to PDF via `latexmk` and opens them
7. Commits everything on the branch; `main` is never touched

**Requires:**
- The `career-kb` MCP server configured and running (see Setup above)
- The CV repo (`overleaf-cv`) — a LaTeX project using the [Awesome-CV](https://github.com/posquit0/Awesome-CV) template that compiles to a PDF résumé. The repo holds modular `.tex` section files (`resume/summary.tex`, `resume/experience.tex`, etc.) and a per-variant main file (`resume_isr.tex`) that `\input`s them.
- `latexmk` installed (`brew install --cask mactex-no-gui`)

---

## First-time index build

The search index builds automatically on push via GitHub Action.
To build it locally before your first push:

```bash
cd /path/to/career-kb
node scripts/build-index.mjs
git add search-index.json
git commit -m "chore: initial search index"
git push
```
