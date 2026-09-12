---
name: project-learner
description: "Multi-agent pipeline that generates LLM-optimized micro-documents in learning/ to give any LLM instant project context. Use when asked to \"learn the project\", \"generate project docs\", \"build learning index\", or \"create LLM docs\"."
category: project-context
trigger: "learn project, generate docs, build index, LLM docs"
output: "learning/"
---

# Project Learner

Generate a set of small, dense, LLM-optimized micro-documents in `learning/` that give any LLM instant context about the project. Humans do NOT read these files. They are navigation aids for LLMs.

## When to use

- User says "learn the project", "generate project docs", "build learning index", "create LLM docs", "map the project for AI"
- After major refactors or new modules are added (re-run to refresh)

## Output location

All files go in `learning/` at the project root.

## Pipeline

Run these agents in sequence. Each agent's output feeds the next.

### Agent 1: Scanner

**Role:** Read-only codebase mapper.

**Task:**
1. List all files in `src/`, `supabase/`, `public/`, and root config files
2. Identify: routes/pages, database tables/migrations, components, lib/logic modules
3. Group files into logical modules (e.g., `barra-cozinha`, `financeiro`, `auth`, `produtos`)
4. For each module, list: file paths, line counts, key exports, dependencies on other modules

**Output:** A structured list of modules with their file inventory. Pass this to the Analyst agents.

**Constraints:**
- Do NOT read file contents in detail, just structure and exports
- Do NOT create any files
- Report: module name, file paths, line counts, key symbols, cross-module dependencies

---

### Agent 2: Analysts (one per module, run in parallel)

**Role:** Deep reader + micro-doc writer.

**Task (per module):**
1. Read all files in the assigned module
2. Write ONE micro-document to `learning/<module-name>.md`

**Micro-doc format (STRICT):**

```
# <module-name>
path: <primary file or folder>
files: <comma-separated file list>
lines: <total line count>
deps: <modules this depends on, comma-separated>
exports: <key exported symbols/functions, comma-separated>
does: <one sentence, max 15 words, what this module does>
roles: <which user roles interact with this, if applicable>
db: <tables touched, if any>
links: <other learning/ docs this relates to, comma-separated>
```

**Rules:**
- Max 150 tokens per doc
- No prose, no introductions, no "this document describes..."
- `does:` is the most important line: must be specific enough that an LLM knows exactly what to expect
- `links:` must reference other module names that exist or will exist (use the module names from Scanner output)
- File name = module name + `.md` (e.g., `barra-cozinha.md`, `db-pedidos.md`, `lib-financeiro.md`)
- Naming convention: `<area>-<specific>.md` where area is one of: `app`, `db`, `lib`, `comp`, `root`
  - `app-barra-cozinha.md` = route/page
  - `db-pedidos.md` = database table/migration
  - `lib-financeiro-actions.md` = logic module
  - `comp-ProductForm.md` = component
  - `root-middleware.md` = root-level file

**Do NOT:**
- Write more than 150 tokens
- Use markdown headers beyond the single `#` title
- Add examples, code snippets, or explanations
- Create docs for `node_modules`, `.next`, or build artifacts

---

### Agent 3: Linker

**Role:** Index builder + link validator.

**Task:**
1. Read all files in `learning/`
2. Create `learning/INDEX.md` with this format:

```
# Project Index
project: <project name from package.json>
stack: <framework, language, key deps, one line>
modules: <total count>
updated: <YYYY-MM-DD>

## Modules
<file-name> | <does: line from that doc>
<file-name> | <does: line from that doc>
...

## Quick Nav
<area>: <comma-separated file names in that area>
```

3. Validate all `links:` fields in every micro-doc:
   - Every referenced name must match an existing file in `learning/`
   - If a link points to a non-existent doc, fix it to the closest match or remove it
4. Ensure `INDEX.md` lists every file in `learning/` (no orphans)

**Output:** `learning/INDEX.md` + any fixes applied to micro-docs.

---

## Execution order

```
Scanner (1 agent)
    ↓
Analysts (N agents, parallel, one per module)
    ↓
Linker (1 agent)
```

Use the `agent` tool for each. Scanner runs first, its output is passed to all Analysts via `requiredContext`. All Analysts must finish before Linker starts.

## Refresh mode

If `learning/` already exists:
1. Scanner runs as normal
2. Analysts only write docs for NEW or CHANGED modules (compare file lists)
3. Linker rebuilds `INDEX.md` from scratch (it's cheap)

## Quality check (after Linker)

Before reporting done, verify:
- [ ] `learning/INDEX.md` exists and lists all files
- [ ] Every micro-doc is under 150 tokens
- [ ] No `links:` point to non-existent files
- [ ] File names follow the `<area>-<specific>.md` convention
- [ ] `does:` lines are specific (not "handles stuff" or "manages data")

## Example output (for reference)

`learning/app-barra-cozinha.md`:
```
# app-barra-cozinha
path: src/app/barra-cozinha/page.tsx
files: src/app/barra-cozinha/page.tsx
lines: 752
deps: lib-supabase-actions, comp-Icon, comp-Toast
exports: default (page)
does: Kanban board for kitchen staff to track order status (pendente, em_preparo, pronto, entregue, cancelado)
roles: cozinha
db: pedidos
links: db-pedidos, app-barra-caixa, lib-supabase-actions
```

`learning/INDEX.md`:
```
# Project Index
project: fast-food-app
stack: Next.js 14, TypeScript, Supabase, Tailwind CSS
modules: 14
updated: 2026-09-12

## Modules
app-barra-atendimento.md | Order entry screen for front-of-house staff to create and send orders
app-barra-cozinha.md | Kanban board for kitchen staff to track order status
app-barra-caixa.md | Cash register with payment processing and order history
app-login.md | Authentication page with email/password and role-based redirect
app-admin-produtos.md | CRUD interface for managing menu products and categories
app-admin-financeiro.md | Financial dashboard with receivables, payables, and monthly summary
db-pedidos.md | Orders table with status workflow and delivery timestamps
db-financeiro.md | Financial entries table for receivables and payables
db-produtos.md | Products and categories tables for menu management
lib-supabase-actions.md | Server actions for auth, orders, and general Supabase operations
lib-financeiro-actions.md | Server actions for financial CRUD, dashboard stats, and CSV export
lib-product-actions.md | Server actions for product and category CRUD
comp-ProductForm.md | Form component for creating and editing products
root-middleware.md | Auth middleware that validates tokens and enforces role-based route access

## Quick Nav
app: app-barra-atendimento, app-barra-cozinha, app-barra-caixa, app-login, app-admin-produtos, app-admin-financeiro
db: db-pedidos, db-financeiro, db-produtos
lib: lib-supabase-actions, lib-financeiro-actions, lib-product-actions
comp: comp-ProductForm
root: root-middleware
```