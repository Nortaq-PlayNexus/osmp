# API Reference

OSMP's public interface is its CLI. There is no HTTP API; internal modules are documented here for contributors.

## CLI surface

| Command                                | Description                     |
| -------------------------------------- | ------------------------------- |
| `node src/cli.ts discover [--dry-run]` | Run Phase 1 discovery + scoring |
| `node src/cli.ts pipeline`             | Run the full 14-phase pipeline  |
| `node src/cli.ts list`                 | List tracked projects           |
| `node src/cli.ts help`                 | Show usage                      |

## Internal API — core modules

### `GitHubClient` (`src/github/client.ts`)

| Method                                       | Description                                |
| -------------------------------------------- | ------------------------------------------ |
| `searchRepositories(query, perPage?, page?)` | GitHub search, returns items               |
| `getRepository(fullName)`                    | Single-repo enrichment                     |
| `countContributors(fullName)`                | Contributor count (sampled)                |
| `request2(path, { method, body })`           | Generic authenticated request (e.g. forks) |

### `DiscoveryEngine` (`src/phases/discovery.ts`)

| Method       | Description                                          |
| ------------ | ---------------------------------------------------- |
| `discover()` | Returns `{ candidates, scored, selected, rejected }` |

### `scoreCandidate(inputs, weights?)` (`src/core/scoring.ts`)

Accepts a `ScoreInputs` object and returns a `RepoScore` with all dimensions and the OSPI.

### `ProjectMemoryStore` (`src/core/memory.ts`)

| Method                                                    | Description                     |
| --------------------------------------------------------- | ------------------------------- |
| `createProject(fullName, url)`                            | Create a memory record          |
| `load(fullName)`                                          | Load a record                   |
| `save(memory)`                                            | Persist a record                |
| `recordPhase(memory, phase, status, summary, artifacts?)` | Record a phase result           |
| `recordDecision(memory, decision, rationale)`             | Append an architecture decision |
| `listProjects()`                                          | List tracked repositories       |

## Types

All shared types live in `src/core/types.ts`:

- `RepoCandidate` — a discovered repository.
- `ScoreDimension` — a 0–100 score with evidence.
- `RepoScore` — all dimensions plus the OSPI.
- `ProjectMemory` — the durable per-project record.
- `PhaseResult` / `PhaseStatus` — pipeline lifecycle types.

## Exit codes

| Code | Meaning                                              |
| ---- | ---------------------------------------------------- |
| `0`  | Success                                              |
| `1`  | Failure (missing config, phase failure, fatal error) |
