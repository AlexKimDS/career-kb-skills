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
