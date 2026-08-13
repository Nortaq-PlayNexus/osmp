# Architecture

The full architecture document lives at [`docs/architecture.md`](architecture.md). This page
summarizes the design and points to the key modules.

## System overview

OSMP is a single-process orchestrator that drives a pipeline of specialized "agent" modules.
Each agent has a mandate and responsibilities defined in `src/agents/roles.ts`. Durable project
memory persists state, decisions, and results across runs.

```
CLI (src/cli.ts)
   │
   ▼
Orchestrator (src/core/orchestrator.ts)   ──►  ProjectMemoryStore (src/core/memory.ts)
   │
   ├─ Discovery      (src/phases/discovery.ts)
   ├─ Acquisition    (src/phases/acquisition.ts)
   ├─ Audit          (src/phases/audit.ts)
   ├─ Modernization  (src/phases/modernization.ts)
   ├─ Transformation (src/phases/transformation.ts)  ── UX, Backend, AI, Testing, DevOps
   └─ Finalization   (src/phases/finalization.ts)    ── Docs, Quality, Contribution, Portfolio
        │
        ▼
   data/workspaces · data/memory · data/portfolio
```

## Key modules

| Module | Responsibility |
|---|---|
| `src/core/types.ts` | Shared domain model (`RepoCandidate`, `RepoScore`, `ProjectMemory`) |
| `src/core/config.ts` | `.env` + environment configuration |
| `src/core/logger.ts` | Leveled, timestamped agent logging |
| `src/core/scoring.ts` | Open Source Potential Index computation |
| `src/core/memory.ts` | Durable JSON-backed project memory |
| `src/github/client.ts` | GitHub REST client (search, enrich, fork) |
| `src/tools/git.ts` | `git` CLI wrappers (clone, branch, commit) |

## OSPI scoring

```
OSPI = Architecture×20% + Innovation×20% + Modernization×20%
     + Community×15%    + Enterprise×15%   + Activity×10%
```

Each dimension is scored 0–100 with attached evidence. Candidates scoring ≥ 80 qualify.
See [`docs/architecture.md`](architecture.md#scoring) for the dimension detail.

## Project memory

Each repository gets a JSON record in `data/memory/projects/` holding:

- Original and fork URLs, workspace path, branch topology
- OSPI and dimension scores
- Architectural decisions and rationale
- Audit output and phase results
- Community feedback

## Failure handling

Phases run independently. A failure is recorded in project memory and logged with the
responsible agent; subsequent phases continue. A project is marked `passed` only when all its
phases pass.
