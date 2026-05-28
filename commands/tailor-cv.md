Tailor Aleksandr Kim's CV and generate a cover letter for a specific job application.

**Usage:** `/tailor-cv <JD_URL>`

The argument is: $ARGUMENTS

---

## Your task

Given a job description URL, you will:
1. Crawl the JD
2. Load relevant career KB context
3. Read the current CV files
4. Create an isolated git branch in the CV repo
5. Tailor CV sections to match the role (non-destructively)
6. Generate a targeted cover letter
7. Compile both to PDF and open them
8. Commit and report

Follow every step below in order. Do not skip steps.

---

## Step 1 — Crawl the JD

Use `WebFetch` on the URL provided in $ARGUMENTS.

Extract and record:
- **Company name** (exact, as written on the page)
- **Role title** (exact)
- **Required skills / qualifications** (bulleted list)
- **Nice-to-have skills**
- **Keywords that appear 3+ times** (these are the ones that matter for ATS)
- **Seniority signals** (IC vs lead, years of experience asked, scope)
- **What the role is actually about** (1–2 sentence plain summary)

If the URL fails to load or is behind a login wall, stop and ask the user to paste the JD text directly.

---

## Step 2 — Load KB context

Call these career-kb MCP tools:
- `get_current_status` — current role and what you're open to
- `search_kb` with the role title + top 3 JD keywords — find relevant experience and projects
- `get_style` with `samples: 3` — writing style reference (use this to keep the CV tone consistent)

---

## Step 3 — Read the current CV

Read these files from `/Users/alexkim/my-projects/overleaf-cv/`:
- `resume_isr.tex` — the canonical main template
- `resume/summary.tex`
- `resume/skills.tex`
- `resume/experience.tex`
- `resume/project.tex`
- `resume/education.tex`

Also read `coverletter.tex` for the cover letter structure.

Check the current git branch:
```bash
cd /Users/alexkim/my-projects/overleaf-cv && git branch --show-current
```
If not on `main`, warn the user and stop. Only proceed from `main`.

---

## Step 4 — Create the branch

Derive slugs:
- Company slug: lowercase, hyphens, no special chars (e.g. "Google" → `google`, "DeepMind" → `deepmind`)
- Role slug: lowercase, hyphens, key words only (e.g. "Senior AI Engineer" → `senior-ai-engineer`)
- Branch name: `cv/{company-slug}-{role-slug}`

```bash
cd /Users/alexkim/my-projects/overleaf-cv && git checkout -b cv/{company-slug}-{role-slug}
```

---

## Step 5 — Create the per-application main file

Copy `resume_isr.tex` to `resume_{company-slug}.tex`. Then make these targeted edits to the copy:

1. **`\position{...}`** — update to match the JD role title, but only if it's a genuine match to your background (Senior Data Scientist, Senior AI Engineer, Staff DS, etc.). Do not fabricate a title you haven't held.
2. **Uncomment `\input{resume/project.tex}`** — always include projects.
3. **Section order** — ensure the `\input` order is: summary → skills → experience → project → education. Update if different.
4. **Output filename hint** — add a comment at the top: `% Application: {Company} — {Role}`

Do NOT modify `resume_isr.tex` itself.

---

## Step 6 — Tailor the section files

Edit these files **in place** on the branch. The originals on `main` are protected by the branch — that's your safety net.

### Rules that apply to ALL sections
- Never fabricate facts, metrics, companies, titles, or skills
- Only reframe, reorder, and keyword-swap what already exists
- Keep ALL existing LaTeX comments (`%`) intact — they are alternative versions for future use
- Do not break any `\begin{...}` / `\end{...}` pairs
- Do not change `resume/education.tex` or `resume/languages.tex`

### `resume/summary.tex`
Rewrite **only the active paragraph** (the uncommented one between `\begin{cvparagraph}` and `\end{cvparagraph}`). Keep commented-out alternatives untouched.

The new summary should:
- Open with the role title from the JD (or closest match to your actual title)
- Emphasise the 2–3 experiences most relevant to this JD
- Include 2–3 of the JD's high-frequency keywords naturally
- Stay 2–4 sentences max
- Sound like the existing writing style (reference `get_style` output)

### `resume/skills.tex`
Reorder `\cvskill` rows so the most JD-relevant category appears first. Within each row, reorder the comma-separated items so JD-matching skills lead. Add JD keywords only if they are genuinely equivalent to skills you already list (e.g. if JD says "LangChain" and you list "LangGraph", you may add "LangChain" alongside it — they are peers).

### `resume/experience.tex`
For each `\cventry`, reorder `\item` bullet points so the most JD-relevant achievement appears first. You may rephrase a bullet to include a JD keyword **only if the underlying fact is unchanged** — same metric, same scope, just different vocabulary. Never move bullets between companies or roles.

### `resume/project.tex`
- Change `\cvsection{Projects}` → `\cvsection{Selected Projects}`
- Reorder `\cventry` blocks so the most JD-relevant project appears first
- Do not edit project descriptions — only reorder

---

## Step 7 — Generate the cover letter

Create `/Users/alexkim/my-projects/overleaf-cv/cover_letter_{company-slug}.tex`.

Use `coverletter.tex` as the structural template. Copy its full LaTeX preamble and structure. Then fill in:

**Header block** (copy from `resume_isr.tex`):
- `\name{Aleksandr Kim}{}`
- `\position{Senior AI Engineer}` (or role-matched title)
- `\address{London, UK}`
- `\mobile{+44 7555 850960}`
- `\email{aleksandr.v.kim@gmail.com}`
- `\homepage{alexkimds.github.io}`
- `\linkedin{aleksandrkim}`

**Letter metadata:**
- `\lettertitle{Job Application for {Role} at {Company}}`
- `\letteropening{Dear Hiring Manager,}` (keep generic unless the JD names a specific team or person)
- `\letterclosing{Sincerely,}`

**Letter body — three `\lettersection` blocks inside `\begin{cvletter}...\end{cvletter}`:**

1. `\lettersection{About Me}` — 3–4 sentences. Who you are, your current role, one headline achievement relevant to this JD. Do not repeat the CV verbatim — this should read as a human introduction.

2. `\lettersection{Why {Company}?}` — 2–3 sentences. What specifically about this company, product, or role draws you. Use concrete signals from the JD (their tech stack, mission, scale, problem domain). Do not write generic flattery.

3. `\lettersection{Why Me?}` — 4–5 sentences. Map your 3 strongest matching experiences directly to their stated requirements. Use metrics. Be concrete. End with one sentence on what you would bring that is additive — not just a match, but a differentiator.

Keep the tone consistent with the KB writing style samples.

---

## Step 8 — Compile and verify

First check for `latexmk`:
```bash
which latexmk
```

If missing, tell the user:
> `latexmk` not found. Run `brew install --cask mactex-no-gui` to install MacTeX (this takes a few minutes). Let me know when done and I'll re-run.

Then stop and wait.

If present, compile from the repo directory:
```bash
cd /Users/alexkim/my-projects/overleaf-cv
latexmk -xelatex -interaction=nonstopmode -halt-on-error resume_{company-slug}.tex 2>&1 | tail -30
latexmk -xelatex -interaction=nonstopmode -halt-on-error cover_letter_{company-slug}.tex 2>&1 | tail -30
```

**On compile error:**
- Show the relevant error lines (look for lines starting with `!` in the output)
- Identify which section file caused it
- Fix the LaTeX syntax error in that file (most likely a stray `&`, `_`, `#`, `%` or broken environment)
- Re-run the compile
- If it still fails after one fix attempt, revert that section file to its pre-edit state and report clearly what failed

**On success:**
```bash
open resume_{company-slug}.pdf
open cover_letter_{company-slug}.pdf
```

---

## Step 9 — Commit

```bash
cd /Users/alexkim/my-projects/overleaf-cv
git add resume_{company-slug}.tex cover_letter_{company-slug}.tex resume/summary.tex resume/skills.tex resume/experience.tex resume/project.tex
git commit -m "cv: tailor for {Company} — {Role}"
```

---

## Step 10 — Report

Output a clean summary:

```
## CV tailored for {Company} — {Role}

**Branch:** cv/{company-slug}-{role-slug}
**CV PDF:** resume_{company-slug}.pdf
**Cover letter PDF:** cover_letter_{company-slug}.pdf

### Changes made
- summary.tex: [what changed]
- skills.tex: [what changed]
- experience.tex: [what changed]
- project.tex: [what changed]

### Why you're a strong fit
[2–3 sentences from the Why Me section — the core argument]

### JD keywords incorporated
[comma-separated list]
```

---

## Hard stops

Stop immediately and ask the user if:
- The JD URL fails to load
- You're not on the `main` branch in overleaf-cv
- The role is so far outside the background that honest tailoring isn't possible
- A compile error persists after one fix attempt
