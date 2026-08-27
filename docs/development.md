# Development

This guide covers contributing code to OSMP itself. If you're here to use OSMP, see
[Getting Started](getting-started.md).

## Environment

```bash
git clone https://github.com/Nortaq-PlayNexus/osmp.git
cd osmp
npm ci
cp .env.example .env   # add GITHUB_TOKEN
```

## Commands

```bash
npm run typecheck       # strict TypeScript
npm run lint            # ESLint (flat config)
npm run lint:fix
npm run format          # Prettier
npm run format:check
npm test                # node:test suite
npm run test:coverage   # with coverage report
npm run verify          # typecheck + lint + test
```

## Language constraints

OSMP runs on **native Node TypeScript support** (type-stripping). This forbids syntax that requires transformation.
Concretely:

- ❌ Constructor parameter properties: `constructor(private x: T)`
- ❌ `enum` / `namespace`
- ❌ Decorators

Use explicit field declarations and string-literal union types instead:

```ts
// ✅
export class Client {
  private token: string;
  constructor(token: string) {
    this.token = token;
  }
}

// ❌
export class Client {
  constructor(private token: string) {}
}
```

Type-only imports must be explicit:

```ts
import type { RepoCandidate } from "./types.ts";
```

All internal imports use the `.ts` extension explicitly (ESM style).

## Adding a phase

Phases are grouped by file in `src/phases/`:

1. Implement the phase logic as an exported class or function.
2. Wire it into `PHASE_SEQUENCE` in `src/core/orchestrator.ts` with a phase id, agent, and title.
3. Record outcomes with `ProjectMemoryStore.recordPhase`.
4. Add tests under `tests/`.

## Testing

Tests use Node's built-in runner:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
```

Run a single file:

```bash
node --test tests/scoring.test.ts
```

## Conventions

- Conventional Commits (see [CONTRIBUTING.md](../CONTRIBUTING.md)).
- A `pre-commit` Husky hook runs `lint-staged` (Prettier + ESLint) automatically.
- Keep changes additive and upstream-friendly — the same ethics OSMP applies to other projects apply here.
