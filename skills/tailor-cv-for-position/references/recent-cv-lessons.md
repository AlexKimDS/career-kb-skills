# Recent CV Lessons

Use this reference before tailoring Alex's CV for a specific position. It captures the practical requirements and feedback from the latest CV variants and prior conversations.

## Latest Role Variants Reviewed

- `overleaf-cv-kraken` (updated 2026-06-16): `resume_kraken_finance_agents.tex`, `cover_letter_kraken.tex`.
  - Role: AI Agents Solutions Architect, Finance at Kraken.
  - Requirements inferred from CV/letter: production agentic AI, finance automation, workflow discovery, architecture, regulated finance controls, auditability, SOX-style control mindset.
  - Strong evidence used: LangGraph agentic insights platform saving about 30 hrs/week, 100M+ financial transactions/day and about 40% error reduction, LLM-as-judge triage with 33% spend reduction and 71% to 84% agreement, Raiffeisen compliance/customer-identification background.

- `overleaf-cv-reflection` (updated 2026-06-13): `resume_reflectionai_evaluations.tex`.
  - Role theme: AI/ML engineer focused on LLM systems and evaluations.
  - Requirements inferred from CV: LLM-as-judge, human feedback, agentic evaluations, evaluation frameworks, Langfuse, Responsible AI, experimentation methodology.
  - Strong evidence used: Intuit LLM-as-judge triage, Fusion AI Agents evaluation and monitoring, agentic insights system, experimentation methodology remediation.

- `overleaf-cv-seamflow` (updated 2026-06-11): `resume_seamflow.tex`.
  - Role theme: AI Engineer, LLM Systems.
  - Requirements inferred from CV: LLM agents, advanced RAG, prompt/context engineering, GenAI products, customer discovery, AI roadmaps, LangGraph, Langfuse, observability.
  - Strong evidence used: production LangGraph agentic insights, customer-facing AI agents, LLM delivery and evaluation, product discovery framing.

- `overleaf-cv-wise` (updated 2026-06-11): `resume_wise_fraud.tex`.
  - Role: Staff Data Scientist, Fraud at Wise.
  - Requirements inferred from CV: fintech-scale ML, fraud/risk style monitoring, production AI, customer-facing data quality, patents and applied ML depth.
  - Strong evidence used: 100M+ financial transactions/day, about 40% data-error reduction, customer-facing AI agents, LLM-as-judge triage, X5 production ML, patents.

- `overleaf-cv-expedia` (updated 2026-06-11): `resume_expedia.tex`.
  - Role: Senior Machine Learning Scientist, Personalization at Expedia Group.
  - Requirements inferred from CV: personalization, recommendation systems, experimentation, production ML, model lifecycle, monitoring.
  - Strong evidence used: EMEA recommendation improvements, Auto Invoice recommendation rollout, A/B testing remediation, X5 promotions optimization, patents in recommendations/uplift/contextual bandits.

- `overleaf-cv-snyk` (updated 2026-06-09): `resume_snyk.tex`, `cover_letter_snyk.tex`.
  - Role: Staff Incubation Engineer, London at Snyk.
  - Requirements inferred from CV/letter: agentic products, production LLM systems, LLM evaluation infrastructure, responsible AI, product incubation.
  - Strong evidence used: LangGraph agentic insights, Fusion AI Agents evaluation, LLM-as-judge triage, applied AI patents.

## Feedback To Encode

### Visual and Layout

- Render and inspect screenshots every time. Opening the PDF is not enough.
- CV must be exactly one page unless Alex explicitly asks otherwise. Cover letter must be exactly one page.
- Prevent text overlap under XeLaTeX / TeX Live 2020 legacy. The working fix used in prior variants patches `cvitems` close spacing to `0mm` and `cventry` opening spacing to about `-2mm`.
- Do not let the last bullet of one `cventry` cram against the next `cventry` header.
- Avoid too-wide gap after "Selected Projects"; this often comes from an empty org field in the first `cvproject`.
- Keep all `\position{}` and `\cventry` job titles in ALL CAPS. Awesome-CV uses small caps; title-case strings can render as mixed-height text such as `SENiOR AI ENGiNEER`.
- Keep contact header order with the portfolio/clickable homepage first.
- Check older entries, especially X5 and previous roles, for consistent indentation.

### Content and Evidence

- Use structured CV evidence claims as the source of truth. Generic KB search is context, not proof.
- Do not move bullets between companies. Keep Intuit London, Intuit Israel, X5, Kaspersky, and Raiffeisen facts under the correct employer.
- Keep Kaspersky and Raiffeisen as separate entries by default. Earlier removals made some CVs feel too short and removed useful breadth.
- Do not duplicate the same story and metric in both experience and selected projects. Projects should add architecture or implementation depth.
- Avoid internal codenames in public text:
  - `Blob Bot` should become "Agentic Insights Platform", "LangGraph agent", or similar.
  - `ADVIL` should become "LLM-as-Judge Triage System", "LLM gateway refusal detector", or similar, depending on the claim.
- Avoid odd broad ranges like `20-80%`. Prefer a supported point framing such as "up to 80%" or omit the range if it distracts.
- Keep summaries to 2-3 tight sentences. Top half of the CV should carry the strongest JD-matched facts.

### Role Framing Patterns

- Agentic AI / solutions architect roles: lead with production LangGraph agents, workflow discovery, system architecture, tool use, structured outputs, evaluation, and finance-grade controls.
- LLM evaluation / safety roles: lead with LLM-as-judge triage, human feedback, evaluation methodology, Langfuse monitoring, distribution shift, responsible AI, and production constraints.
- Fraud / fintech risk roles: lead with 100M+ transactions/day, monitoring, data-error reduction, financial infrastructure, compliance/risk-adjacent history, and ML systems reliability.
- Personalization / recommendations roles: lead with recommendation systems, uplift modelling, A/B testing methodology, Auto Invoice rollout, X5 promotions forecasting, and patents in recommendation/uplift/bandits.
- Product incubation / staff engineer roles: lead with customer discovery, from-zero-to-production ownership, agentic products, cross-functional leadership, evaluation/observability, and patent-backed innovation.
