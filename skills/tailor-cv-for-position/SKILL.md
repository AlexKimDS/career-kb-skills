---
name: tailor-cv-for-position
description: Tailor Aleksandr Kim's LaTeX CV and cover letter for a specific job description using career-kb evidence claims and nearby overleaf-cv repositories. Use when asked to customize, adapt, rewrite, review, compile, or validate a CV/resume or cover letter for a particular company, role, JD URL, pasted job description, or application.
---

# Tailor CV for Position

## Overview

Tailor a role-specific CV and cover letter from evidence-backed claims, preserving LaTeX structure and verifying the rendered PDF before reporting completion.

Before acting, read `references/recent-cv-lessons.md` when the task involves a role-specific CV, cover letter, or feedback from previous CV iterations.

## Workflow

1. Load the job description.
   - If the user provides a URL, fetch the current page. If it is inaccessible, ask for pasted JD text.
   - Extract company, exact role title, must-have skills, nice-to-have skills, repeated keywords, seniority signals, and the role thesis in 1-2 plain sentences.

2. Locate the CV repo near the current work.
   - Prefer an explicit path from the user.
   - Otherwise search near the `career-kb-skills` repo and its parent directories for `overleaf-cv*` directories containing `resume/summary.tex`, `resume/experience.tex`, and at least one `resume_*.tex`.
   - For a new application, prefer the canonical `overleaf-cv` repo if it is a clean git repo. Use company-specific `overleaf-cv-*` directories as references unless the user asks to modify one of them.
   - If a git repo is used, do not touch `main` directly. Create a branch named `cv/{company-slug}-{role-slug}` from a clean base. If the repo is a non-git copied working tree, create new per-application files and do not rewrite unrelated variants.

3. Build an evidence plan.
   - Use the career-kb MCP tools when available: `get_current_status`, `match_jd_to_evidence`, `get_claims`, `validate_cv_facts`, and `get_style`.
   - Use `profile/cv-evidence.md` directly only when MCP tools are unavailable.
   - Select 2-3 headline claims for the summary, 4-6 claims for experience bullets, and 1-3 project claims only when they add technical depth not already covered.
   - Stop if honest tailoring is not possible from the evidence bank.

4. Edit the CV.
   - Start from `resume_isr.tex` when creating a new per-application main file.
   - Name the new main file `resume_{company-slug}.tex` or `resume_{company-slug}_{role-slug}.tex` when the company has multiple roles.
   - Add a top comment: `% Application: {Company} -- {Role}`.
   - Use section order: summary, skills, experience, selected projects if useful, education.
   - Keep `resume/education.tex` and identity/contact data factual; do not tailor them unless the user asks.
   - Preserve comments and valid LaTeX environments.

5. Tailor content under evidence constraints.
   - Rewrite the active summary to 2-3 tight sentences using selected headline claims.
   - Reorder skills by JD relevance; add only supported adjacent keywords.
   - Reorder bullets within a role; never move bullets between companies or roles.
   - Keep Kaspersky and Raiffeisen as separate experience entries unless the user explicitly asks for a shorter variant and approves the tradeoff.
   - Use projects only for non-duplicative architecture or implementation depth.
   - Never expose internal codenames in public-facing text.

6. Generate the cover letter.
   - Use the existing cover letter template and full preamble.
   - Create `cover_letter_{company-slug}.tex`.
   - Structure: About Me, Why {Company}, Why Me.
   - Make "Why {Company}" concrete to the JD/company, not generic.
   - Map "Why Me" to the strongest selected claims and supported metrics.

7. Validate facts and render.
   - Run `validate_cv_facts` over the edited CV and cover letter content.
   - Compile with `latexmk -xelatex -interaction=nonstopmode -halt-on-error`.
   - Render screenshots with `qlmanage` or another PDF-to-image path and visually inspect the actual pages.
   - Do not commit or call the work done until visual and fact checks pass.

8. Report.
   - Include the branch or working tree path, created files, evidence claim IDs used, compile status, screenshot paths, and any false-positive validation notes.
   - Explain the fit thesis briefly, grounded in the selected claims.

## Hard Rules

- Do not fabricate facts, metrics, employers, titles, dates, projects, skills, or company-specific claims.
- Do not combine metrics from different claim IDs in one bullet unless one claim supports all of them.
- Do not leave claim IDs in rendered text; LaTeX comments are acceptable.
- Do not commit if the CV is not exactly one page, the cover letter is not exactly one page, text overlaps, bottom margins overflow, or fact validation has unresolved issues.
- Make every `\position{}` and every `\cventry` job title ALL CAPS because the Awesome-CV small-caps style renders title-case text unevenly.
- Keep the portfolio/clickable homepage first in the contact header when editing header order.

## Quick Commands

Find nearby CV repos:

```bash
find .. ../.. -maxdepth 2 -type d -name 'overleaf-cv*' -print
```

Find latest role-specific CV files:

```bash
find /Users/alexkim/my-projects -maxdepth 2 -type f \( -name 'resume_*.tex' -o -name 'cover_letter_*.tex' \) -path '*/overleaf-cv*/*' -print0 \
  | xargs -0 stat -f '%Sm %N' -t '%Y-%m-%d %H:%M:%S' \
  | sort -r \
  | head -40
```

Compile and preview:

```bash
latexmk -xelatex -interaction=nonstopmode -halt-on-error resume_{slug}.tex
latexmk -xelatex -interaction=nonstopmode -halt-on-error cover_letter_{company}.tex
mkdir -p /tmp/cv_preview
qlmanage -t -s 1400 -o /tmp/cv_preview/ resume_{slug}.pdf 2>/dev/null
qlmanage -t -s 1400 -o /tmp/cv_preview/ cover_letter_{company}.pdf 2>/dev/null
```
