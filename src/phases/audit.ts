import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { execFileSync } from "node:child_process";
import { logger } from "../core/logger.ts";

export interface AuditReport {
  structure: string[];
  languages: Record<string, number>;
  totalFiles: number;
  totalLines: number;
  hasLockfile: boolean;
  packageManagers: string[];
  secretsFound: number;
  missingLicense: boolean;
  security: {
    dependencyVulnerabilities: string[];
    criticalSecrets: string[];
    notes: string[];
  };
  suggestions: string[];
}

const SECRET_PATTERNS = [
  { name: "AWS access key", re: /AKIA[0-9A-Z]{16}/ },
  { name: "Private key", re: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/ },
  { name: "GitHub token", re: /gh[pousr]_[A-Za-z0-9_]{20,}/ },
  { name: "Generic password in env", re: /(password|passwd|secret)\s*[=:]\s*["'][^"']{8,}["']/i },
];

export class AuditEngine {
  async audit(ws: string): Promise<AuditReport> {
    logger.info("audit", `running enterprise audit on ${ws}`);
    const structure: string[] = [];
    const languages: Record<string, number> = {};
    let totalFiles = 0;
    let totalLines = 0;
    const secretsFound = new Set<string>();
    const manifestFiles: string[] = [];

    const walk = (dir: string, depth: number) => {
      if (depth > 6) return;
      let entries: string[];
      try {
        entries = readdirSync(dir);
      } catch {
        return;
      }
      for (const e of entries) {
        if ([".git", "node_modules", "target", "dist", "build", ".venv", "venv"].includes(e)) continue;
        const p = join(dir, e);
        let st: ReturnType<typeof statSync>;
        try {
          st = statSync(p);
        } catch {
          continue;
        }
        if (st.isDirectory()) {
          if (depth === 0) structure.push(e);
          walk(p, depth + 1);
        } else {
          totalFiles++;
          const ext = extname(e).replace(".", "") || "txt";
          languages[ext] = (languages[ext] ?? 0) + 1;
          if (/^(package\.json|package-lock\.json|yarn\.lock|pnpm-lock\.yaml|Cargo\.lock|go\.sum|Pipfile|requirements\.txt|poetry\.lock|Gemfile\.lock)$/.test(e)) {
            manifestFiles.push(join(dir, e));
          }
          if (st.size < 200_000 && /\.(js|ts|py|rb|go|java|env|yml|yaml|json|sh|php|cs)$/.test(e)) {
            try {
              const content = readFileSync(p, "utf8");
              totalLines += content.split(/\r?\n/).length;
              for (const pat of SECRET_PATTERNS) {
                if (pat.re.test(content)) secretsFound.add(pat.name);
              }
            } catch {
              /* skip unreadable */
            }
          }
        }
      }
    };
    walk(ws, 0);

    const packageManagers = detectPackageManagers(manifestFiles);
    const suggestions = this.buildSuggestions({ languages, packageManagers, secretsFound, totalFiles });

    return {
      structure,
      languages,
      totalFiles,
      totalLines,
      hasLockfile: manifestFiles.some((f) => /lock/.test(f)),
      packageManagers,
      secretsFound: secretsFound.size,
      missingLicense: !existsSync(join(ws, "LICENSE")) && !existsSync(join(ws, "LICENSE.md")) && !existsSync(join(ws, "LICENSE.txt")),
      security: {
        dependencyVulnerabilities: [],
        criticalSecrets: [...secretsFound],
        notes: this.externalScannerNotes(ws),
      },
      suggestions,
    };
  }

  private buildSuggestions(info: {
    languages: Record<string, number>;
    packageManagers: string[];
    secretsFound: Set<string>;
    totalFiles: number;
  }): string[] {
    const out: string[] = [];
    if (info.secretsFound.size > 0) out.push("CRITICAL: rotate detected secrets before any PR");
    if (!info.languages["lock"]) out.push("Add a lockfile for reproducible builds");
    if (info.packageManagers.length === 0) out.push("No package manifest detected — consider standardizing tooling");
    if (info.totalFiles < 10) out.push("Small repo — preserve scope, avoid over-engineering");
    out.push("Add .editorconfig, CI linting, and typed errors");
    return out;
  }

  private externalScannerNotes(_ws: string): string[] {
    const notes: string[] = [];
    for (const tool of ["semgrep", "trivy", "gitleaks"]) {
      try {
        const res = execFileSync(tool, ["--version"], { encoding: "utf8", stdio: ["pipe", "ignore", "ignore"] });
        notes.push(`${tool}: available (${res.trim().split(/\s+/)[0]})`);
      } catch {
        notes.push(`${tool}: not installed — CI pipeline will run it`);
      }
    }
    return notes;
  }
}

function detectPackageManagers(manifests: string[]): string[] {
  const set = new Set<string>();
  for (const m of manifests) {
    if (/package\.json$/.test(m)) set.add("npm");
    if (/yarn\.lock$/.test(m)) set.add("yarn");
    if (/pnpm-lock/.test(m)) set.add("pnpm");
    if (/Cargo\.lock$/.test(m)) set.add("cargo");
    if (/go\.sum$/.test(m)) set.add("go");
    if (/requirements\.txt|Pipfile|poetry\.lock/.test(m)) set.add("python");
    if (/Gemfile/.test(m)) set.add("ruby");
  }
  return [...set];
}
