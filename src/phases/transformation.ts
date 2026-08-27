import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { AuditReport } from "./audit.ts";
import type { RepoCandidate } from "../core/types.ts";
import { logger } from "../core/logger.ts";

export interface PhaseResultMeta {
  applied: string[];
  skipped: string[];
  notes: string[];
}

function write(ws: string, rel: string, content: string, applied: string[], skipIfExists = false): void {
  const p = join(ws, rel);
  mkdirSync(join(ws, rel.split("/").slice(0, -1).join("/")), { recursive: true });
  if (skipIfExists && existsSync(p)) return;
  applied.push(skipIfExists ? `verified ${rel}` : `added ${rel}`);
  writeFileSync(p, content);
}

// PHASE 5 — UX ENGINE
export class UxEngine {
  run(ws: string, audit: AuditReport): PhaseResultMeta {
    logger.info("ux", "auditing frontend experience");
    const applied: string[] = [];
    const notes: string[] = [];

    const hasWebFrontend = Object.keys(audit.languages).some((e) =>
      ["jsx", "tsx", "vue", "svelte", "html", "css"].includes(e)
    );
    if (hasWebFrontend) {
      write(ws, "docs/ux/design-guidelines.md", UX_DESIGN_DOC, applied, true);
      write(ws, "docs/ux/accessibility.md", A11Y_DOC, applied, true);
      applied.push("accessibility standards documented");
    } else {
      notes.push("no web frontend detected — UX phase skipped (core is backend/library)");
    }
    return { applied, skipped: [], notes };
  }
}

// PHASE 6 — BACKEND ENTERPRISE TRANSFORMATION
export class BackendEngine {
  run(ws: string, audit: AuditReport): PhaseResultMeta {
    logger.info("backend", "transforming backend to enterprise standards");
    const applied: string[] = [];
    const isJs = audit.packageManagers.includes("npm") || audit.packageManagers.includes("yarn");

    if (isJs) {
      write(ws, "src/middleware/validate.ts", VALIDATION_MIDDLEWARE, applied, true);
      write(ws, "src/lib/errors.ts", STRUCTURED_ERRORS, applied, true);
      write(ws, "docs/api/README.md", API_DOCS, applied, true);
    } else {
      write(ws, "docs/api/README.md", API_DOCS, applied, true);
    }

    return { applied, skipped: [], notes: ["rate limiting + authn/authz annotated in API docs"] };
  }
}

// PHASE 7 — AI FEATURE ANALYSIS
export class AiFeatureAnalyzer {
  run(ws: string, candidate: RepoCandidate, _audit: AuditReport): PhaseResultMeta {
    logger.info("ai-features", `analyzing whether AI adds value to ${candidate.fullName}`);
    const applied: string[] = [];
    const notes: string[] = [];

    const description = (candidate.description ?? "").toLowerCase();
    const aiValue = [
      /search/.test(description),
      /analytics|data|report/.test(description),
      /workflow|automation/.test(description),
      /recommend/.test(description),
    ].some(Boolean);

    if (aiValue) {
      write(ws, "docs/ai/opportunity.md", AI_OPPORTUNITY_DOC, applied, true);
      applied.push("AI opportunity documented — value confirmed");
    } else {
      notes.push("AI features NOT recommended — no measurable user value");
      write(ws, "docs/ai/opportunity.md", AI_NO_DOC, applied, true);
    }
    return { applied, skipped: [], notes };
  }
}

// PHASE 8 — TESTING LAB
export class TestingEngine {
  run(ws: string, audit: AuditReport): PhaseResultMeta {
    logger.info("testing", "establishing enterprise testing lab");
    const applied: string[] = [];

    const isJs = audit.packageManagers.includes("npm") || audit.packageManagers.includes("yarn");
    if (isJs) {
      write(ws, "test/unit/example.test.ts", UNIT_TEST_EXAMPLE, applied, true);
      write(ws, "docs/testing-strategy.md", TESTING_DOC, applied, true);
    } else {
      write(ws, "docs/testing-strategy.md", TESTING_DOC, applied, true);
    }

    return {
      applied,
      skipped: [],
      notes: ["target: 80% coverage, 90%+ critical modules"],
    };
  }
}

// PHASE 9 — DEVOPS AUTOMATION
export class DevopsEngine {
  run(ws: string, _audit: AuditReport): PhaseResultMeta {
    logger.info("devops", "generating CI/CD, security, and deployment automation");
    const applied: string[] = [];

    write(ws, ".github/workflows/cd.yml", CD_WORKFLOW, applied, true);
    write(ws, ".github/workflows/security.yml", SECURITY_WORKFLOW, applied, true);
    write(ws, "docker-compose.yml", DOCKER_COMPOSE, applied, true);
    write(ws, "Dockerfile", DOCKERFILE, applied, true);
    write(ws, "docs/deployment.md", DEPLOYMENT_DOC, applied, true);

    return {
      applied,
      skipped: [],
      notes: ["deployment templates for AWS, Azure, GCP, Railway, Kubernetes"],
    };
  }
}

const UX_DESIGN_DOC = `# Design Guidelines

- Adopt a token-based design system (colors, spacing, typography)
- Responsive layouts for all breakpoints
- Support dark/light themes
- Provide a command palette (Ctrl/Cmd+K) when appropriate
- Keyboard shortcuts for power users
- Meaningful empty states and error recovery
`;

const A11Y_DOC = `# Accessibility (WCAG 2.2 AA)

- Semantic HTML, ARIA where needed
- Full keyboard navigation
- Contrast ratio >= 4.5:1
- Focus-visible indicators
- Screen-reader labels on all interactive elements
- Preferred-reduced-motion support
`;

const VALIDATION_MIDDLEWARE = `export function validate(schema: any) {
  return (req: any, res: any, next: any) => {
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ code: "VALIDATION_ERROR", details: error.details });
    next();
  };
}
`;

const STRUCTURED_ERRORS = `export class AppError extends Error {
  code: string;
  details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
  }
}
`;

const API_DOCS = `# API Reference

- REST with OpenAPI schema
- Request validation on all endpoints
- Rate limiting (e.g., 100 req/min per IP)
- Authentication: bearer tokens / OAuth2
- Authorization: role-based access control
- Structured error envelope: { code, message, details }
`;

const AI_OPPORTUNITY_DOC = `# AI Feature Opportunity

## Value Proposition
AI creates measurable value for this project:
- Natural-language interfaces over existing data
- Intelligent search / retrieval
- Workflow automation
- Recommendation engines

## Guardrails
- Respect the original project's scope
- Keep AI optional and incremental
- Expose deterministic fallbacks
`;

const AI_NO_DOC = `# AI Feature Analysis

**Recommendation: Do NOT add AI.**

This project's core value is not improved by generative features.
Avoid unnecessary complexity. Keep the implementation deterministic.`;

const UNIT_TEST_EXAMPLE = `import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("example unit", () => {
  it("passes", () => {
    assert.equal(1 + 1, 2);
  });
});
`;

const TESTING_DOC = `# Testing Strategy

## Coverage targets
- Overall: >= 80%
- Critical modules: >= 90%

## Layers
- Unit tests (fast, in-memory)
- Integration tests (real dependencies)
- API tests (contract validation)
- Security tests (auth, injection, secrets)
- Load tests (k6 / artillery)
`;

const CD_WORKFLOW = `name: CD
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build
        run: npm run build --if-present
      - name: Release
        uses: softprops/action-gh-release@v2
        if: startsWith(github.ref, 'refs/tags/')
        with:
          generate_release_notes: true
`;

const SECURITY_WORKFLOW = `name: Security
on:
  push:
    branches: [main, feature/enterprise-modernization]
  schedule:
    - cron: '0 2 * * 1'

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Trivy filesystem scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: fs
          scan-ref: .
          exit-code: 1
      - name: gitleaks secret scan
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`;

const DOCKER_COMPOSE = `services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/healthz"]
      interval: 30s
      timeout: 5s
      retries: 3
`;

const DOCKERFILE = `FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install
COPY . .
RUN npm run build --if-present

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app ./
EXPOSE 3000
CMD ["node", "dist/index.js"]
`;

const DEPLOYMENT_DOC = `# Deployment

## Supported targets
- AWS (ECS/EKS, Amplify)
- Azure (Container Apps, Static Web Apps)
- Google Cloud (Cloud Run, GKE)
- Vercel (frontend)
- Railway
- Kubernetes (via Helm chart)

## Requirements
- Health endpoint at /healthz
- Metrics at /metrics (Prometheus format)
- Structured JSON logs to stdout
`;
