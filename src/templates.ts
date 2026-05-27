export function projectTemplate(slug: string, date: string): string {
  return `---
date: ${date}
tags: []
status: active
stage: in-progress
tech: []
role: ""
---

# ${slug}

## What it is

## My role

## Tech stack

## Links

- Repo:
- Live:
`;
}

export function interviewTemplate(company: string, date: string): string {
  return `---
date: ${date}
tags: []
status: active
company: "${company}"
role: ""
stage: "applied"
result: "pending"
---

# Interview — ${company}

## About the company

## About the role

## Why I'm interested

## Questions to ask

-
`;
}

export function entryTemplate(type: string, slug: string, date: string): string {
  return `---
date: ${date}
tags: []
status: active
---

# ${slug}

`;
}
