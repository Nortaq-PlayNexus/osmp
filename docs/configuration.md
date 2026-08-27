# Configuration

OSMP is configured through environment variables. Load them from a `.env` file at the project root (created from
`.env.example`) or via the process environment.

## Reference

| Variable              | Default                          | Description                                           |
| --------------------- | -------------------------------- | ----------------------------------------------------- |
| `GITHUB_TOKEN`        | _(empty)_                        | GitHub personal access token (classic, `repo` scope)  |
| `GITHUB_OWNER`        | _(empty)_                        | GitHub account used to create forks                   |
| `WORKSPACE_ROOT`      | `./data/workspaces`              | Directory for acquired repository workspaces          |
| `MEMORY_DIR`          | `./data/memory`                  | Project memory store location                         |
| `PORTFOLIO_DIR`       | `./data/portfolio`               | Portfolio report output directory                     |
| `TOP_REPOSITORIES`    | `5`                              | Maximum repositories selected per run                 |
| `MIN_STARS`           | `50`                             | Lower bound of the discovery star range               |
| `MAX_STARS`           | `5000`                           | Upper bound of the discovery star range               |
| `SCORE_THRESHOLD`     | `80`                             | Minimum OSPI required to select a repository          |
| `SEARCH_QUERIES`      | `10`                             | Number of GitHub search queries to run                |
| `DRY_RUN`             | `true`                           | When `true`, no writes to GitHub (no fork/clone/push) |
| `GITHUB_GRAPHQL_URL`  | `https://api.github.com/graphql` | Reserved for GraphQL search (future)                  |
| `MAX_PARALLEL_AGENTS` | `4`                              | Reserved for parallel pipeline execution (future)     |

## Recommended production values

```ini
GITHUB_TOKEN=ghp_...
GITHUB_OWNER=yourusername
DRY_RUN=false
TOP_REPOSITORIES=20
MIN_STARS=100
MAX_STARS=3000
SCORE_THRESHOLD=80
SEARCH_QUERIES=30
```

## Behavior notes

- **`DRY_RUN=true` is the safe default.** Live acquisition (`DRY_RUN=false`) forks the target, clones it into the
  workspace, and prepares branches. Contribution then pushes the `feature/enterprise-modernization` branch to your fork.
- The scoring threshold is a hard gate: repositories below `SCORE_THRESHOLD` are never selected.
- `SEARCH_QUERIES` multiplies API calls. Keep it low during development to stay within rate limits.
- Values are read with `loadConfig()` in `src/core/config.ts`. All variables are optional.

## Environment variable precedence

`.env` values override nothing — they are merged with `process.env`, and explicit environment variables take precedence
over the `.env` file.
