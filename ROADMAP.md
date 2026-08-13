# Roadmap

This roadmap reflects where OSMP is today and where it is headed. It is a living document;
contributors are welcome to propose changes via pull request.

Legend: ✅ done · 🔶 in progress · ⬜ planned

## v1.0 — Foundation (current release)

- ✅ Zero-dependency TypeScript architecture on native Node type-stripping
- ✅ 14-phase orchestrator with durable project memory
- ✅ Phase 1: GitHub discovery + filtering + OSPI scoring (live API)
- ✅ Phase 2: acquisition with full branch topology and blueprint
- ✅ Phase 3: filesystem audit + secret detection + external scanner detection
- ✅ Phases 4–9: modernization, UX, backend, AI analysis, testing, devops
- ✅ Phases 10–12, 14: docs, quality certificate, contribution prep, portfolio
- ✅ CLI runner, `.env` config, unit tests, developer tooling
- ✅ Enterprise open-source release polish (branding, community files, CI, docs)

## v1.1 — Autonomous Depth

- ⬜ Real SAST integration: run Semgrep/CodeQL/Trivy/gitleaks in the pipeline when installed
- ⬜ Dependency vulnerability scanning via GitHub dependency graph / audit endpoints
- ⬜ GraphQL-backed search for higher discovery throughput
- ⬜ Live fork + clone + push with token (gated behind `DRY_RUN=false`)
- ⬜ Upstream PR creation via GitHub API with the standardized PR template
- ⬜ Coverage tracking and 80%/90% gate enforcement
- ⬜ Per-repo quality gate summaries surfaced in the CLI

## v1.2 — Community Intelligence

- 🔶 Phase 13 active loop: poll PR review threads + notifications
- ⬜ Professional automated responses to maintainer feedback
- ⬜ Iterative PR improvement based on review comments
- ⬜ Feedback history persisted in project memory

## v2.0 — Enterprise Scale

- ⬜ Configurable parallel pipelines (`MAX_PARALLEL_AGENTS`)
- ⬜ SQLite/Postgres backing for project memory
- ⬜ Web dashboard for the CTO agent (portfolio, metrics, pipeline state)
- ⬜ Scheduled discovery (cron) with incremental diffing
- ⬜ Multi-provider LLM adapters for decision/review agents

## v2.1 — Full Autonomy

- ⬜ Self-hosted runner for build/test verification per repository
- ⬜ Container scanning and deployment verification (Railway/Vercel/K8s)
- ⬜ AI feature analysis with live model calls gated by value assessment
- ⬜ Community impact prediction model
