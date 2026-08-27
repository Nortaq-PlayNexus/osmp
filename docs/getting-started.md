# Getting Started

This guide gets you from zero to a running OSMP pipeline in a few minutes.

## Prerequisites

| Tool         | Version               | Required for                        |
| ------------ | --------------------- | ----------------------------------- |
| Node.js      | ≥ 22.6                | Runtime (native TypeScript support) |
| git          | any recent            | Repository acquisition              |
| GitHub token | classic, `repo` scope | Authenticated discovery / fork / PR |

Check your environment:

```bash
node --version   # >= 22.6
git --version
```

## 1. Install

```bash
git clone https://github.com/Nortaq-PlayNexus/osmp.git
cd osmp
npm ci
```

`npm ci` installs only _development_ tooling (TypeScript, ESLint, Prettier, test runner). OSMP itself has **zero runtime
dependencies** and runs directly on Node's built-in TypeScript type-stripping — there is no build step.

## 2. Configure

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

```ini
GITHUB_TOKEN=ghp_your_token_here
GITHUB_OWNER=yourusername
```

- `GITHUB_TOKEN` authenticates all GitHub API calls, raising the rate limit from 60 to 5000 requests/hour and enabling
  forking and PR creation.
- `GITHUB_OWNER` is the GitHub account under which forks are created.

> **Tip:** never commit `.env`. It is already ignored by `.gitignore`.

## 3. Run discovery (Phase 1)

```bash
npm run discover
```

This searches GitHub, filters candidates (rejecting unlicensed, abandoned, tutorial, fork, and spam repositories),
enriches them with detail, and scores each with the Open Source Potential Index. Only repositories scoring ≥ 80 are
selected.

## 4. Run the full pipeline

```bash
npm run pipeline
```

By default `DRY_RUN=true`, so the pipeline:

1. Discovers and scores repositories.
2. Creates a local workspace with the full branch topology and `MODERNIZATION_BLUEPRINT.md`.
3. Audits the workspace, applies enterprise hardening, generates documentation.
4. Produces an Enterprise Quality Certificate.
5. Writes the portfolio report.

**No code is pushed to GitHub** in dry-run mode. To enable live forking and contribution, set `DRY_RUN=false` and
re-run.

## 5. Inspect the results

```bash
npm run list                  # projects tracked in project memory
cat data/portfolio/PORTFOLIO.md
ls data/workspaces/<repo>/    # modernized workspace
```

## Troubleshooting

| Symptom                        | Fix                                                                   |
| ------------------------------ | --------------------------------------------------------------------- |
| `rate limited (token: absent)` | Add `GITHUB_TOKEN` to `.env`                                          |
| `GitHub 403`                   | Token lacks `repo` scope — create a classic token with `repo` checked |
| `Cannot find module ...`       | Run `npm ci` (dev tooling missing)                                    |
| Slow discovery                 | Reduce `SEARCH_QUERIES`; raise `MIN_STARS`                            |

Next: [Configuration](configuration.md) · [Usage](usage.md)
