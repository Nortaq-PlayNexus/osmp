import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { AuditReport } from "./audit.ts";
import { logger } from "../core/logger.ts";

export interface ModernizationResult {
  applied: string[];
  skipped: string[];
}

export class ModernizationEngine {
  async run(ws: string, audit: AuditReport): Promise<ModernizationResult> {
    logger.info("modernization", `planning modernization for ${ws}`);
    const applied: string[] = [];
    const skipped: string[] = [];

    this.applyWorkflow(ws, applied);
    this.applyEditorconfig(ws, applied);
    this.applyHealthcheck(ws, applied, audit);
    this.applyDotEnv(ws, applied, audit);
    this.applySecureGitignore(ws, applied);
    this.applyErrorHandlingDocs(ws, applied, audit);

    if (!audit.missingLicense) {
      skipped.push("license already present");
    } else {
      logger.warn(
        "modernization",
        "no LICENSE file — not generating one automatically (license must be preserved from upstream)"
      );
      skipped.push("missing upstream license — requires human decision");
    }

    return { applied, skipped };
  }

  private write(ws: string, rel: string, content: string, applied: string[]): void {
    const p = join(ws, rel);
    mkdirSync(join(ws, rel.split("/").slice(0, -1).join("/")), { recursive: true });
    if (existsSync(p)) {
      applied.push(`updated ${rel}`);
    } else {
      applied.push(`added ${rel}`);
    }
    writeFileSync(p, content);
  }

  private applyWorkflow(ws: string, applied: string[]): void {
    this.write(ws, ".github/workflows/ci.yml", CI_WORKFLOW, applied);
  }

  private applyEditorconfig(ws: string, applied: string[]): void {
    if (!existsSync(join(ws, ".editorconfig"))) {
      this.write(ws, ".editorconfig", EDITORCONFIG, applied);
    }
  }

  private applyHealthcheck(ws: string, applied: string[], audit: AuditReport): void {
    if (audit.structure.includes("src") || audit.structure.includes("lib")) {
      this.write(ws, ".healthcheck.md", HEALTHCHECK_DOC, applied);
    }
  }

  private applyDotEnv(ws: string, applied: string[], _audit: AuditReport): void {
    if (!existsSync(join(ws, ".env.example"))) {
      this.write(ws, ".env.example", ENV_EXAMPLE, applied);
    }
  }

  private applySecureGitignore(ws: string, applied: string[]): void {
    const p = join(ws, ".gitignore");
    if (existsSync(p)) {
      const cur = readFileSync(p, "utf8");
      if (!cur.includes(".env")) {
        this.write(ws, ".gitignore", `${cur}\n\n# security\n.env\n*.pem\n*.key\nsecrets/*\n`, applied);
      }
    } else {
      this.write(ws, ".gitignore", `.env\n*.pem\n*.key\nsecrets/*\nnode_modules/\ndist/\nbuild/\n`, applied);
    }
  }

  private applyErrorHandlingDocs(ws: string, applied: string[], audit: AuditReport): void {
    const ext = Object.keys(audit.languages).find((e) => ["ts", "js", "py"].includes(e));
    if (ext) {
      this.write(ws, "docs/error-handling.md", ERROR_HANDLING_DOC, applied);
    }
  }
}

const CI_WORKFLOW = `name: CI
on:
  push:
    branches: [main, feature/enterprise-modernization]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
      - name: Install
        run: npm ci || npm install
      - name: Build
        run: npm run build --if-present
      - name: Test
        run: npm test --if-present
      - name: Lint
        run: npm run lint --if-present

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Dependency scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: fs
          scan-ref: .
          format: table
          exit-code: 1
`;

const EDITORCONFIG = `root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2
`;

const HEALTHCHECK_DOC = `# Healthcheck

Add a \`/healthz\` endpoint returning 200 with service metadata.
Use \`/readyz\` for dependency readiness. Wire into the orchestrator.`;

const ENV_EXAMPLE = `# copy to .env and fill in real values
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
`;

const ERROR_HANDLING_DOC = `# Error Handling

- Use structured error objects: { code, message, details }
- Centralize via a logging framework
- Never log secrets or PII
- Fail fast with clear messages on configuration errors
`;
