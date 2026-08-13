# Architecture

## Overview

OSMP is a single-process orchestrator that drives a pipeline of specialized "agent" modules.
Each agent has a mandate and responsibilities defined in `src/agents/roles.ts`. The system
preserves a durable project memory between runs so the "organization" remembers state,
decisions, and results for every repository it touches.

```
                         ┌─────────────────────────────────┐
                         │         CLI (src/cli.ts)         │
                         └───────────────┬─────────────────┘
                                         │
                    ┌────────────────────▼────────────────────┐
                    │           Orchestrator                   │
                    │        (src/core/orchestrator.ts)        │
                    │   runs the 14-phase lifecycle state      │
                    └──┬────┬────┬────┬────┬────┬────┬────┬───┘
                       │    │    │    │    │    │    │    │
              ┌────────▼┐  │    │    │    │    │    │    │
              │Discovery│  │    │    │    │    │    │    │
              └─────────┘  │    │    │    │    │    │    │
             acquisition audit modernization ux backend ai-features testing
                      devops documentation quality contribution portfolio
                       │                    │                    │
                       ▼                    ▼                    ▼
                data/workspaces      data/memory          data/portfolio
```

## Core Modules

### `src/core/`
- **`types.ts`** — the domain model: `RepoCandidate`, `RepoScore`, `ProjectMemory`,
  `PhaseResult`, `PipelineContext`.
- **`config.ts`** — environment + `.env` configuration loader.
- **`logger.ts`** — leveled, timestamped agent logging.
- **`memory.ts`** — `ProjectMemoryStore`: JSON-file backed project memory with an index.
  Records phase statuses, architectural decisions, audit results, and community feedback.
- **`scoring.ts`** — the Open Source Potential Index (OSPI):
  ```
  OSPI = Architecture×20% + Innovation×20% + Modernization×20%
       + Community×15% + Enterprise×15% + Activity×10%
  ```
  Every dimension is 0–100 and qualified repos must score ≥ 80.

### `src/github/client.ts`
Thin REST client over the GitHub API with response caching, pagination-aware contributor
counting, fork creation, and structured rate-limit handling.

### `src/phases/`
One module per phase group:
- `discovery.ts` — Phase 1: query generation, filtering (rejects unlicensed, archived, forks,
  tutorials, spam, demos, stale repos), enrichment, scoring, ranking.
- `acquisition.ts` — Phase 2: fork, clone, branch topology (`main-original`,
  `backup/pre-modernization`, `feature/enterprise-modernization`, `security/hardening`,
  `performance/optimization`), backup snapshot + `MODERNIZATION_BLUEPRINT.md`.
- `audit.ts` — Phase 3: filesystem audit (structure, languages, manifests, line counts,
  secret detection) plus optional external tool detection (Semgrep/Trivy/gitleaks).
- `transformation.ts` — Phases 5–9: UX guidelines, backend hardening, AI feature analysis,
  testing strategy, and CI/CD/security/Docker/deployment automation.
- `modernization.ts` — Phase 4: applies enterprise hardening (workflows, editorconfig,
  env templates, secure gitignore, error-handling guidance).
- `finalization.ts` — Phases 10–14: docs generation, Enterprise Quality Certificate,
  contribution/PR preparation, community monitoring, portfolio report.

### `src/tools/git.ts`
Thin wrappers around `git` CLI for clone/branch/commit/diff operations.

## Data Flows

1. **Discovery** enriches raw search hits into `RepoCandidate`s, scores them, and selects
   only OSPI ≥ 80.
2. **Acquisition** creates the workspace and branch topology, persisting a blueprint.
3. **Audit** produces an `AuditReport` stored in project memory.
4. **Transformation phases** write hardening artifacts into the workspace (idempotent).
5. **Quality Control** evaluates gates and writes the certificate.
6. **Contribution** prepares and optionally pushes the branch; **Portfolio** aggregates
   results into a report.

## Failure Handling

Each phase is wrapped by the orchestrator. A phase failure is recorded in project memory and
does not halt subsequent phases; the final project `passed` flag reflects whether all gates
were satisfied. Quality-control failures produce a certificate but block the contribution step.

## Security & Ethics Guarantees

- Secrets detected during audit are surfaced in the certificate; a non-zero secret count
  fails the quality gate.
- Missing licenses are never auto-generated; they require human decision.
- Contribution pushes preserve upstream licensing and use an explicit bot identity.
