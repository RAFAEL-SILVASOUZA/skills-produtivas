---
name: learning-lookup
description: "Mandatory pre-flight: read learning/ micro-docs before working on the project. Use automatically before any code task, debugging, or question about project behavior."
category: project-context
trigger: "always, pre-flight, before code"
depends_on: project-learner
input: "learning/"
---

# Learning Lookup

Mandatory pre-flight step: before working on ANY part of this project, read the LLM-optimized micro-documents in `learning/` to get instant context.

## When to use

**ALWAYS** before:
- Writing or modifying code in this project
- Debugging an issue
- Answering a question about how something works
- Planning a change or refactor
- Reviewing code

**Skip only when:**
- The task is purely about `learning/` itself (e.g., regenerating docs)
- The user explicitly says "skip learning lookup"

## Process

### Step 1: Read the index

Read `learning/INDEX.md`. This gives you:
- Project stack (one line)
- All modules with a one-line description
- Quick Nav by area (app, db, lib, comp, root)

### Step 2: Identify relevant docs

Based on the task, pick the 2-5 most relevant micro-docs from the index. Use the `Quick Nav` section to narrow by area, then scan the `does:` descriptions.

**Selection rules:**
- If the task mentions a specific route/page → read that `app-*.md`
- If it touches data → read the relevant `db-*.md`
- If it involves logic/actions → read the relevant `lib-*.md`
- If it involves a component → read the relevant `comp-*.md`
- If it involves auth/routing → read `root-middleware.md`
- Always follow `links:` in a doc to find related modules (one level deep max)

### Step 3: Read the selected docs

Read each selected micro-doc. They are small (under 150 tokens each), so reading 3-5 of them costs very little context.

### Step 4: Proceed with the task

You now have:
- Which files exist and where
- What each module does (one sentence)
- Which modules depend on which
- Which DB tables are touched
- Which roles are involved

Use this as your mental map. You do NOT need to read every file before starting. Read specific files only when you need implementation details.

## If `learning/` does not exist

If `learning/INDEX.md` is missing or the folder does not exist:
1. Tell the user: "No learning index found. I'll work from the code directly, but consider running the `project-learner` skill to build one for faster future context."
2. Proceed with the task using normal code exploration.

## If `learning/` is stale

If you notice during the task that a micro-doc contradicts the actual code:
- Trust the code, not the doc
- Note the discrepancy
- After finishing the task, suggest: "The learning docs may be stale for <module>. Consider re-running `project-learner` to refresh."

## What NOT to do

- Do NOT read all 14+ micro-docs when 3 are enough
- Do NOT treat micro-docs as the source of truth for implementation details (they are navigation aids, not specs)
- Do NOT modify files in `learning/` unless the user explicitly asks to update them
- Do NOT skip this step because "I already know the project" — the docs may have changed

## Example

**Task:** "Add a new status to the kitchen kanban"

1. Read `learning/INDEX.md` → see `app-barra-cozinha.md` and `db-pedidos.md`
2. Read `learning/app-barra-cozinha.md` → learns: kanban board, tracks order status, roles: cozinha, db: pedidos
3. Read `learning/db-pedidos.md` → learns: pedidos table, status field with CHECK constraint, migration file path
4. Now you know exactly which files to open and what constraints exist. Start coding.

**Tokens spent on context:** ~300. **Files read before coding:** 2 micro-docs instead of 752-line page + 234-line schema.