Tailor Aleksandr Kim's CV and generate a cover letter for a specific job application.

**Usage:** `/tailor-cv <JD_URL or pasted JD text>`

The argument is: $ARGUMENTS

---

## Preflight — load lessons and locate files

Read the repo skill reference if it exists:

```text
/Users/alexkim/my-projects/MyCareerKB/career-kb-skills/skills/tailor-cv-for-position/references/recent-cv-lessons.md
```

Use it as the checklist of Alex's previous CV requirements and feedback.

Locate the CV repo dynamically. Prefer an explicit user-provided path. Otherwise search near the
`career-kb-skills` repo and its parent directories for `overleaf-cv*` directories containing
`resume/summary.tex`, `resume/experience.tex`, and role-specific `resume_*.tex` files.

For a new application, prefer the canonical `overleaf-cv` git repo when it is clean. Use copied
company-specific repos such as `overleaf-cv-kraken` as references unless Alex asks to modify that
specific working tree.

## Operating principle

This command is evidence-gated. You may tailor wording and ordering, but every factual claim, number, project, company, and metric used in the CV must come from a structured CV evidence claim.

Primary tools:
- `match_jd_to_evidence` — use this as the primary source for CV facts.
- `get_claims` — fetch exact source-bound claims before writing.
- `validate_cv_facts` — run before compile/commit.
- `search_kb` / `get_file` — use only for extra context after evidence claims are selected.

Do not use generic KB search as the primary CV input.

---

## Step 1 — Load the JD

If `$ARGUMENTS` is a URL, use `WebFetch` on it. If `$ARGUMENTS` is pasted JD text, use it directly.

Extract and record:
- Company name, exactly as written.
- Role title, exactly as written.
- Required skills and qualifications.
- Nice-to-have skills.
- Keywords that appear 3+ times.
- Seniority signals: IC vs lead, years, scope, ownership.
- What the role is actually about in 1-2 plain sentences.

If the URL fails or is behind a login wall, stop and ask the user to paste the JD text.

---

## Step 2 — Evidence shortlist

Call:
- `get_current_status`
- `match_jd_to_evidence` with the full JD text and `limit: 12`
- `get_style` with `samples: 3`

Then choose:
- 2-3 `headline` claims for the summary.
- 4-6 strongest claims for experience bullets.
- 1-3 claims for selected projects, only if projects add technical depth not already covered by experience.

Use `get_claims` for every selected claim ID.

Before editing files, output a concise fit thesis:

```text
## Evidence plan
Top fit thesis: ...
Summary claims: claim_id, claim_id, ...
Experience claims: claim_id, claim_id, ...
Project claims: claim_id, claim_id, ...
Claims excluded: claim_id — reason
```

Hard stop if honest tailoring is not possible because the role is too far outside Alex's background.

---

## Step 3 — Read the CV repo

Set and record:

```bash
CV_REPO="{absolute path to selected overleaf-cv repo}"
```

Read these files from `$CV_REPO`:
- `resume_isr.tex`
- `resume/summary.tex`
- `resume/skills.tex`
- `resume/experience.tex`
- `resume/project.tex`
- `resume/education.tex`
- `coverletter.tex`

Also inspect the latest role-specific variants near `$CV_REPO` and use them as examples of current
formatting and role framing:

```bash
find "$(dirname "$CV_REPO")" -maxdepth 2 -type f \( -name 'resume_*.tex' -o -name 'cover_letter_*.tex' \) -path '*/overleaf-cv*/*' -print0 \
  | xargs -0 stat -f '%Sm %N' -t '%Y-%m-%d %H:%M:%S' \
  | sort -r \
  | head -40
```

If `$CV_REPO` is a git repo, check the branch:

```bash
cd "$CV_REPO" && git branch --show-current
```

If creating a new application in the canonical git repo and not on `main`, warn the user and stop.
Only proceed from `main`. If Alex explicitly asked to update a copied company-specific working tree
that is not a git repo, do not use branch operations and do not overwrite unrelated variants.

---

## Step 4 — Create the branch

Derive slugs:
- Company slug: lowercase, hyphens, no special chars.
- Role slug: lowercase, hyphens, key words only.
- Branch name: `cv/{company-slug}-{role-slug}`

If `$CV_REPO` is not a git repo because Alex asked to update a copied application working tree,
skip this branch step. Otherwise:

```bash
cd "$CV_REPO" && git checkout -b cv/{company-slug}-{role-slug}
```

---

## Step 5 — Create the per-application main file

Copy `resume_isr.tex` to `resume_{company-slug}.tex`. If the same company has multiple active
variants, use `resume_{company-slug}_{role-slug}.tex`. Edit only the copy:

1. Add `% Application: {Company} — {Role}` near the top.
2. Set `\position{...}` to an honest role-matched title in ALL CAPS, for example `SENIOR AI ENGINEER \textbar{} AGENT SYSTEMS`.
3. Ensure section order is: summary → skills → experience → project → education.
4. Uncomment `\input{resume/project.tex}` only if the selected project claims add non-duplicative value.
5. Add this rendering fix after the existing `\makeatletter...\makeatother` block:

```latex
% Prevent text overlap under XeLaTeX (legacy 2020).
% cvitems close (-4mm) + cventry open (-3mm) = -7mm, overrunning 11pt line height.
% Fix: zero out closing vspace; leave open vspace as-is to preserve density.
\renewenvironment{cvitems}{%
  \vspace{-4.0mm}
  \begin{justify}
  \begin{itemize}[leftmargin=2ex, nosep, noitemsep]
    \setlength{\parskip}{0pt}
    \renewcommand{\labelitemi}{\bullet}
}{%
  \end{itemize}
  \end{justify}
  \vspace{0mm}
}
\makeatletter
\patchcmd{\cventry}{\vspace{-3.0mm}}{\vspace{-2.0mm}}{}{}
\makeatother
```

Do not modify `resume_isr.tex`.

---

## Step 6 — Tailor section files

Edit these files in place on the branch:
- `resume/summary.tex`
- `resume/skills.tex`
- `resume/experience.tex`
- `resume/project.tex` if included

Rules for all sections:
- Never fabricate facts, metrics, companies, titles, or skills.
- Use only selected claim IDs for summary and top bullets.
- Do not combine metrics from different claim IDs in one bullet unless the same claim supports all of them.
- Preserve all existing LaTeX comments.
- Do not change `resume/education.tex` or `resume/languages.tex`.
- Keep every `\cventry` job title in ALL CAPS.
- Do not leave claim IDs in the final rendered CV unless they are LaTeX comments.

Maintain a scratch claim map while editing:

```text
summary sentence 1 -> claim_id
experience bullet: Intuit #1 -> claim_id
project bullet: Agentic Insights -> claim_id
```

### `resume/summary.tex`

Rewrite only the active paragraph between `\begin{cvparagraph}` and `\end{cvparagraph}`.

Summary rules:
- Use only the 2-3 selected headline claims.
- Lead with the target role category and strongest fit.
- Include 2-3 high-frequency JD keywords naturally.
- Stay 2-3 tight sentences.
- Do not mention weaker early-career facts unless the JD specifically requires them.

### `resume/skills.tex`

Reorder categories and skill items by JD relevance.

Only add a JD keyword if it is already supported by the selected claims or existing skills. Example: adding `LangChain` beside `LangGraph` is allowed only if the role clearly values agent frameworks and the CV already shows adjacent agent-framework work.

### `resume/experience.tex`

Reorder bullets within each role so the strongest JD-matched claim comes first.

Experience prioritization:
1. Recent Intuit London production AI/LLM claims.
2. Intuit Israel LLM evaluation, Responsible AI, fintech-scale ML claims.
3. X5 leadership/scale claims for management or large-scale ML roles.
4. Kaspersky NLP/BERT claim for NLP-heavy roles.
5. Early-career or weak claims only when specifically relevant.

Never move bullets between companies or roles.

### `resume/project.tex`

Use this section only when it adds technical architecture or domain depth beyond experience bullets.

Rules:
- Change `\cvsection{Projects}` to `\cvsection{Selected Projects}`.
- Do not repeat the same story and metric already used in experience.
- Project bullets should explain implementation shape, architecture, or technical depth.
- Exclude cancelled projects and weak early-career projects unless the JD specifically asks for that story.

---

## Step 7 — Generate the cover letter

Create `$CV_REPO/cover_letter_{company-slug}.tex`.

Use `coverletter.tex` as the structural template and copy its full LaTeX preamble.

Header block:
- `\name{Aleksandr Kim}{}`
- `\position{SENIOR AI ENGINEER}` or an honest role-matched title.
- `\address{London, UK}`
- `\mobile{+44 7555 850960}`
- `\email{aleksandr.v.kim@gmail.com}`
- `\homepage{alexkimds.github.io}`
- `\linkedin{aleksandrkim}`

Metadata:
- `\lettertitle{Job Application for {Role} at {Company}}`
- `\letteropening{Dear Hiring Manager,}`
- `\letterclosing{Sincerely,}`

Body:
1. `\lettersection{About Me}` — current role and one headline claim.
2. `\lettersection{Why {Company}?}` — concrete company/JD signals, not generic flattery.
3. `\lettersection{Why Me?}` — map 3 strongest selected claims to requirements. Use metrics only from claim IDs.

---

## Step 8 — Validate facts before compiling

Run `validate_cv_facts` on the edited LaTeX content from:
- `resume/summary.tex`
- `resume/experience.tex`
- `resume/project.tex` if included
- `cover_letter_{company-slug}.tex`

If unsupported numbers or possible mixed facts are reported:
1. Re-check the relevant selected claim with `get_claims`.
2. Fix the wording or remove the unsupported metric.
3. Re-run `validate_cv_facts`.

Do not compile or commit until the validator reports no unsupported numbers and no possible mixed facts, unless the remaining item is a false positive you explicitly explain in the final report.

---

## Step 9 — Compile and visually verify

Check for `latexmk`:

```bash
which latexmk
```

If missing, tell the user:
`latexmk` not found. Run `brew install --cask mactex-no-gui` to install MacTeX. Let me know when done and I'll re-run.

Then stop.

If present:

```bash
cd "$CV_REPO"
latexmk -xelatex -interaction=nonstopmode -halt-on-error resume_{company-slug}.tex 2>&1 | tail -30
latexmk -xelatex -interaction=nonstopmode -halt-on-error cover_letter_{company-slug}.tex 2>&1 | tail -30
open resume_{company-slug}.pdf
open cover_letter_{company-slug}.pdf
```

Overleaf note: use XeLaTeX and TeX Live 2020 (Legacy) if uploading to Overleaf.

Generate previews:

```bash
mkdir -p /tmp/cv_preview
qlmanage -t -s 1400 -o /tmp/cv_preview/ resume_{company-slug}.pdf 2>/dev/null
qlmanage -t -s 1400 -o /tmp/cv_preview/ cover_letter_{company-slug}.pdf 2>/dev/null
```

Read and visually inspect:
- `/tmp/cv_preview/resume_{company-slug}.pdf.png`
- `/tmp/cv_preview/cover_letter_{company-slug}.pdf.png`

### CV post-update checklist

Run this after every compile. Do not commit until every item passes.

#### Visual

- [ ] No text overlap anywhere on the page (compare screenshot pixel-by-pixel if unsure)
- [ ] CV is exactly 1 page; cover letter is exactly 1 page
- [ ] Gaps between sections are consistent — not too wide, not too narrow
- [ ] Last bullet of each `cventry` is not crammed against the next `cventry` header
- [ ] Selected Projects section: gap between section title and first entry is normal-width
      (a too-wide gap usually means the first `cvproject` has an empty org field)
- [ ] All `\position{}` and `\cventry` job titles are ALL CAPS
      (`\scshape` turns title-case "Senior AI Engineer" into "SENiOR AI ENGiNEER")
- [ ] Contact header order: portfolio/clickable link is first (not buried after phone/email)
- [ ] All experience entry indentation is consistent (check X5 and older entries)
- [ ] No text overflows the bottom margin

#### Content — no duplication

- [ ] No bullet appears in both experience AND selected projects (same story, same metric)
- [ ] Each project in "Selected Projects" tells a different story from its experience block
      (architecture / depth angle is fine; re-stating the same outcome is not)

#### Content — correct attribution

- [ ] Every bullet is under the company it actually happened at
      (never move bullets between Intuit London, Intuit Israel, X5, Kaspersky, Raiffeisen)
- [ ] Employment date ranges are correct for each role:
      - Intuit London: Sep 2024 – present
      - Intuit Israel: ~2021 – Aug 2024
      - X5 Retail: 2019 – 2021
      - Kaspersky: 2018 – 2019
      - Raiffeisen Bank: 2016 – 2018
- [ ] No internal codenames in any public-facing bullet:
      "Blob Bot" → "Agentic Insights Platform / LangGraph agent"
      "ADVIL" → "LLM-as-Judge Triage System" (or similar external description)

#### Content — metric precision

- [ ] No overly broad ranges that look odd (e.g., "20-80%")
      Replace with "~80%", "up to 80%", or split into two separate bullets with one metric each
- [ ] All metrics validated by `validate_cv_facts` (no unsupported numbers)

#### Content — completeness

- [ ] Kaspersky is present as its own separate experience entry (not merged or omitted)
- [ ] Raiffeisen Bank is present as its own separate experience entry (not merged or omitted)
- [ ] Summary is 2-3 tight sentences (not shorter, not longer)
- [ ] Top half of the CV contains the strongest JD-matched facts

If visual check fails:
1. Shorten summary to 2 tight sentences.
2. Remove or comment out the least relevant old role/bullet.
3. Reduce highest-bullet-count entry to top 3-4 bullets.
4. Recompile and re-screenshot.

---

## Step 10 — Commit

```bash
cd "$CV_REPO"
git add resume_{company-slug}.tex cover_letter_{company-slug}.tex resume/summary.tex resume/skills.tex resume/experience.tex resume/project.tex
git commit -m "cv: tailor for {Company} — {Role}"
```

---

## Step 11 — Report

Output:

```text
## CV tailored for {Company} — {Role}

Branch: cv/{company-slug}-{role-slug}
CV PDF: resume_{company-slug}.pdf
Cover letter PDF: cover_letter_{company-slug}.pdf

Evidence claims used:
- claim_id: where used

Changes made:
- summary.tex: ...
- skills.tex: ...
- experience.tex: ...
- project.tex: ...

Validation:
- Fact validation: passed / false positives explained
- Visual check: passed

Why you're a strong fit:
...

JD keywords incorporated:
...
```

---

## Hard stops

Stop immediately and ask the user if:
- The JD cannot be loaded.
- No nearby CV repo containing the required LaTeX files can be located.
- A canonical git CV repo is being used for a new application and it is not on `main`.
- The role is too far outside the evidence bank for honest tailoring.
- `validate_cv_facts` reports unresolved unsupported metrics.
- A compile error persists after one fix attempt.
- Visual check fails and fixing it would require removing essential evidence.
- CV post-update checklist has unresolved items after one fix attempt.
