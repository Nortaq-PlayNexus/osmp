# Usage

OSMP ships a single CLI. All commands run against your `.env` configuration.

## Commands

```
osmp <command>

Commands:
  discover              Run Phase 1 (discovery + scoring) only
  pipeline              Run the full 14-phase pipeline
  list                  List projects tracked in project memory
  help                  Show usage
```

### `discover`

```bash
npm run discover            # with live API enrichment
npm run discover:dry        # filters + scores without network enrichment
```

Output includes the selected repositories with their OSPI, plus the top rejected candidates
and the reasons.

### `pipeline`

```bash
npm run pipeline
```

Runs discovery, then for every selected repository executes acquisition, audit, modernization,
UX/backend/AI analysis, testing, DevOps, documentation, quality control, and contribution
preparation. In dry-run mode this is fully local and safe.

### `list`

```bash
npm run list
```

Prints the repositories stored in project memory (`data/memory`).

## Flags

| Flag | Effect |
|------|--------|
| `--dry-run` | Force dry-run for the current command |
| `--debug` | Enable debug-level logging |

## Example session

```bash
# 1. Discover with a small query budget
SEARCH_QUERIES=2 npm run discover

# 2. Run the full pipeline against selected repositories
npm run pipeline

# 3. Inspect what was tracked
npm run list
```

## Understanding the output

- Logs are timestamped and prefixed with the agent responsible for the current phase, e.g.
  `[security-engineer]`, `[principal-architect]`, `[code-review-maintainer]`.
- Phase results are recorded in project memory as `passed` / `failed`.
- `ENTERPRISE_QUALITY_CERTIFICATE.md` in each workspace summarizes the before/after state and
  the quality gates.
- `data/portfolio/PORTFOLIO.md` aggregates every processed repository.

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | Command completed |
| `1` | A phase failed or an unrecoverable error occurred |
