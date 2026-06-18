Prepare Alex Kim's LinkedIn and portfolio posts from rough notes, event links, career updates, patent news, project stories, or draft text.

**Usage:** `/prepare-post <draft, topic, event link, or rough notes>`

The argument is: $ARGUMENTS

---

## Operating principle

Prepare two outputs:

1. A paste-ready LinkedIn post.
2. A local portfolio post draft in `alexkimds.github.io`, committed on a local post branch and rendered at localhost for visual review.

Default behavior is local review only. Do not push, open a PR, or publish unless Alex explicitly asks.

---

## Step 1 — Gather context

Use the `career-kb` MCP tools when available; direct file reads are also acceptable.

Read:
- `/Users/alexkim/my-projects/MyCareerKB/career-kb/profile/writing-style.md`
- `/Users/alexkim/my-projects/MyCareerKB/career-kb/profile/bio.md`
- `/Users/alexkim/my-projects/MyCareerKB/career-kb/profile/linkedin.md`
- `/Users/alexkim/my-projects/MyCareerKB/career-kb/profile/patents.md` when the post touches patents
- 2-4 relevant examples from `/Users/alexkim/my-projects/MyCareerKB/career-kb/content/posts/`
- 2-3 portfolio examples from `/Users/alexkim/my-projects/alexkimds.github.io/_posts/`

If `$ARGUMENTS` includes an event link, date, company announcement, news, or anything time-sensitive, verify it before drafting. Use exact dates in the post and final summary.

---

## Step 2 — Draft in Alex's voice

Style rules:
- Direct, first person, anti-hype.
- No "excited", "thrilled", "humbled", "game-changer", or corporate announcement tone.
- Start with what happened or the concrete observation.
- Keep achievements as hooks unless Alex asks for an achievement-focused post.
- Use broad patent/project topics unless full titles are explicitly requested.
- End with a simple reflection or practical invitation.

Draft:
- **LinkedIn version:** paste-ready plain text.
- **Portfolio version:** Jekyll Markdown with frontmatter.

If the post will announce an event, include the event URL as a clickable Markdown link in the portfolio version.

---

## Step 3 — Create local portfolio draft

Work in:

```bash
cd /Users/alexkim/my-projects/alexkimds.github.io
```

Before editing:

```bash
git status --short --branch
```

If the worktree is dirty, stop and ask unless all changes clearly belong to the current post task.

If not already on an appropriate post branch:

```bash
git checkout main
git pull --ff-only origin main
git checkout -b post/{short-slug}
```

Create:

```text
_posts/YYYY-MM-DD-{short-slug}.md
```

Use today's date unless Alex specifies a publish date.

---

## Step 4 — Validate formatting and build

Run Prettier:

```bash
npx prettier _posts/YYYY-MM-DD-{short-slug}.md --write
npx prettier . --check
```

If Prettier cannot resolve the Liquid plugin, run `npm ci` once and retry.

Build:

```bash
bundle exec jekyll build
```

If local Ruby/Bundler is blocked, use:

```bash
docker compose run --rm jekyll bundle exec jekyll build
```

Run link checks for touched Markdown when practical, especially when adding external links. If full-repo link checking is noisy because of untracked `_site` or `node_modules`, check only the touched tracked files and explain the limitation.

---

## Step 5 — Browser visual QA

Rendered validation is required. Build/curl checks are not enough.

Use this preference order:

1. Available browser MCP / Chrome DevTools MCP.
2. Playwright fallback via Node/npm.

Start or keep the local site running:

```bash
docker compose up -d
```

Validate:
- Blog index shows the new post title, date, tags/category.
- Post URL loads with the expected title and body.
- External/event links render as clickable anchors.
- Desktop and mobile screenshots show no blank page, obvious text overlap, broken wrapping, missing main content, or framework error overlay.
- Console has no relevant errors.

Save screenshots outside the repo, for example:

```text
/tmp/prepare-post-{short-slug}-index.png
/tmp/prepare-post-{short-slug}-desktop.png
/tmp/prepare-post-{short-slug}-mobile.png
```

For Playwright fallback, use `npx --yes playwright@latest screenshot` for screenshots and a temporary script outside the repo when console/link inspection is needed. Do not add Playwright as a repo dependency just for QA.

---

## Step 6 — Commit local draft

Stage only intended files:

```bash
git add _posts/YYYY-MM-DD-{short-slug}.md
git commit -m "Add post on {topic}"
```

If CI-supporting docs/config files were fixed as part of validation, stage only those explicit files and explain why.

Do not push or open a PR unless Alex asks.

---

## Final response

Report:
- LinkedIn draft.
- Portfolio post path and local URL.
- Branch and commit SHA.
- Checks run and status.
- Browser QA result and screenshot paths.
- Whether localhost is still running.
- Any remaining risk or manual review point.
