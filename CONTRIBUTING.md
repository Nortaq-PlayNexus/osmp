# Contributing to OSMP

First off, thank you for taking the time to contribute! OSMP is an open-source project that
believes every repository deserves professional attention, and that includes this one.

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) — participation is governed by it.

## Table of Contents

- [Ways to Contribute](#ways-to-contribute)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Code Standards](#code-standards)
- [Commit Conventions](#commit-conventions)
- [Opening a Pull Request](#opening-a-pull-request)
- [Review Process](#review-process)

## Ways to Contribute

- **Report bugs** — open an issue with a clear reproduction.
- **Suggest features** — open an issue using the feature request template.
- **Improve documentation** — typos, missing examples, better guides.
- **Add tests** — improve coverage, especially around the scoring model and discovery engine.
- **Improve agents** — each phase is a module; make one smarter.

## Development Setup

```bash
# Prerequisites: Node.js >= 22.6, git
git clone https://github.com/Nortaq-PlayNexus/osmp.git
cd osmp
npm ci
cp .env.example .env   # add a GITHUB_TOKEN for authenticated API access
```

Run the verification suite before and after your changes:

```bash
npm run verify   # typecheck + lint + tests
```

## Project Structure

```
src/
  agents/       # role definitions for the 14 engineering agents
  core/         # types, config, logger, scoring, project memory, orchestrator
  github/       # GitHub REST client
  phases/       # one module per phase group (discovery ... finalization)
  tools/        # git CLI wrappers
tests/          # node:test suites
docs/           # project documentation
assets/         # branding and screenshots
```

## Code Standards

- **TypeScript strict** — the project runs on native Node type-stripping, so no parameter
  properties (`constructor(private x)`) and no `enum`/`namespace`; use plain field assignment
  and string literal unions.
- **Type-only imports** must use `import type { ... }`.
- **No runtime dependencies** — new features must rely on built-in Node APIs (`node:fs`,
  `node:test`, global `fetch`). If you truly need a dependency, open a discussion first.
- **Run `npm run format`** before submitting (Prettier, 120 col, double quotes, semicolons).
- **Keep methods small and named** after the phase/agent they serve.

## Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org):

```
feat: add phase 13 community polling
fix(discovery): handle rate-limit resets gracefully
docs: document the OSPI scoring model
test: add coverage for scoreCandidate clamping
chore: bump dev tooling
refactor: extract audit secret patterns
security: rotate detected secrets guidance
performance: cache contributor counts
```

## Opening a Pull Request

1. Create a branch: `feat/your-feature`, `fix/your-fix`, `docs/...`, etc.
2. Write a focused change; keep PRs reviewable (under ~400 lines when possible).
3. Ensure `npm run verify` passes locally.
4. Open the PR against `main` using the [pull request template](.github/pull_request_template.md).
5. Link any related issues.

## Review Process

- Maintainers review within a few days.
- Address review feedback in follow-up commits (no force-push).
- Two approvals or one maintainer approval merges.
- Releases follow [SemVer](https://semver.org) and are documented in [CHANGELOG.md](CHANGELOG.md).

Thanks again for helping improve open source — everywhere, including here.
