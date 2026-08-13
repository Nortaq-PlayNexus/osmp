# Changelog

All notable changes to OSMP are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Branding assets: logo, icon, banner, and CLI screenshots.
- Community standards: CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, issue/PR templates.
- Development tooling: TypeScript typecheck, ESLint, Prettier, Husky hooks.
- Documentation suite: getting started, configuration, usage, API, architecture,
  system design, deployment, development.
- Docker support for running OSMP itself.
- GitHub Actions CI (typecheck, lint, test, security scan).

## [1.0.0] - 2026-07-31

### Added
- 14-phase autonomous pipeline orchestrated by specialized agents.
- Phase 1: global repository discovery with filtering (rejects unlicensed, archived,
  forks, tutorials, spam, demos, stale repos).
- Open Source Potential Index (OSPI) scoring model with ≥80 threshold.
- Phase 2: repository acquisition with full branch topology and `MODERNIZATION_BLUEPRINT.md`.
- Phase 3: enterprise audit with secret detection and external scanner detection.
- Phase 4: modernization engine (CI, editorconfig, env templates, secure gitignore, docs).
- Phases 5–9: UX guidelines, backend hardening, AI feature analysis, testing strategy,
  DevOps automation.
- Phase 10: documentation generation (README + full docs suite).
- Phase 11: enterprise quality control with quality certificate.
- Phase 12: professional contribution preparation.
- Phase 13: community intelligence loop scaffold.
- Phase 14: modernization portfolio generator.
- Durable project memory store (`data/memory`).
- CLI runner (`osmp discover | pipeline | list`).
- Zero runtime dependencies (native Node type-stripping).
