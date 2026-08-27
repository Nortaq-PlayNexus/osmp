import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { GitHubClient } from "../github/client.ts";
import type { ProjectMemory, RepoCandidate, RepoScore } from "../core/types.ts";
import { cloneRepo, ensureBranch, gitIn, workspaceFor, createBranch } from "../tools/git.ts";
import { logger } from "../core/logger.ts";

export interface AcquisitionOptions {
  workspaceRoot: string;
  githubOwner: string;
  dryRun: boolean;
}

export class AcquisitionPhase {
  private client: GitHubClient;
  private opts: AcquisitionOptions;

  constructor(client: GitHubClient, opts: AcquisitionOptions) {
    this.client = client;
    this.opts = opts;
  }

  async acquire(memory: ProjectMemory, candidate: RepoCandidate, score: RepoScore): Promise<string> {
    const ws = workspaceFor(candidate.fullName, this.opts.workspaceRoot);
    memory.workspacePath = ws;
    memory.originalBranch = candidate.defaultBranch;
    mkdirSync(this.opts.workspaceRoot, { recursive: true });

    const forkName = this.opts.githubOwner ? `${this.opts.githubOwner}/${candidate.fullName.split("/")[1]}` : "";

    if (!this.opts.dryRun) {
      if (this.opts.githubOwner) {
        try {
          logger.info("acquisition", `forking ${candidate.fullName} -> ${forkName}`);
          await this.client.request2(`/repos/${candidate.fullName}/forks`, {
            method: "POST",
            body: { default_branch_only: false },
          });
          memory.forkUrl = `https://github.com/${forkName}`;
        } catch (e) {
          logger.warn("acquisition", `fork failed (may already exist): ${(e as Error).message}`);
          memory.forkUrl = `https://github.com/${forkName}`;
        }
      }

      cloneRepo(candidate.url, ws, candidate.defaultBranch);
      ensureBranch(ws, "main-original");
      ensureBranch(ws, "backup/pre-modernization");
      gitIn(ws, "checkout", candidate.defaultBranch);
      createBranch(ws, "feature/enterprise-modernization");
      ensureBranch(ws, "security/hardening");
      ensureBranch(ws, "performance/optimization");
      gitIn(ws, "checkout", "feature/enterprise-modernization");

      const snapshot = this.buildSnapshot(memory, candidate, score);
      writeFileSync(join(ws, "MODERNIZATION_BLUEPRINT.md"), snapshot);
    } else {
      logger.info("acquisition", `DRY RUN — would fork, clone, and branch ${candidate.fullName} into ${ws}`);
      mkdirSync(ws, { recursive: true });
      writeFileSync(join(ws, "MODERNIZATION_BLUEPRINT.md"), this.buildSnapshot(memory, candidate, score));
    }

    memory.forkUrl = memory.forkUrl ?? candidate.url;
    return ws;
  }

  private buildSnapshot(memory: ProjectMemory, candidate: RepoCandidate, score: RepoScore): string {
    const deps = [...new Set([candidate.language])].filter(Boolean);
    return [
      "# MODERNIZATION BLUEPRINT",
      "",
      `Generated for: ${candidate.fullName}`,
      `Original: ${candidate.url}`,
      `Fork: ${memory.forkUrl ?? "n/a"}`,
      "",
      "## Current State",
      "",
      "- Architecture: monolithic, single-package layout (baseline)",
      `- Dependencies: ${deps.join(", ") || "unknown"}`,
      "- Weaknesses: no CI, limited test coverage, minimal documentation",
      "- Risks: dependency drift, security debt, no release pipeline",
      "",
      "## Future State",
      "",
      "- Target architecture: modular, layered, enterprise-ready",
      "- Feature upgrades: modern API surface, validation, structured errors",
      "- Security improvements: SAST, dependency scanning, secret detection",
      "- Performance goals: caching, query optimization, asset optimization",
      "- Testing strategy: unit + integration + security, 80%+ coverage",
      "",
      "## Baseline Scores",
      "",
      `- Open Source Potential Index: ${score.openSourcePotentialIndex}`,
      `- Architecture: ${score.architecture.score}/100`,
      `- Maintainability: ${score.maintainability.score}/100`,
      `- Innovation: ${score.innovation.score}/100`,
      `- Market Potential: ${score.marketPotential.score}/100`,
      `- Community Opportunity: ${score.communityOpportunity.score}/100`,
      `- Technical Debt: ${score.technicalDebt.score}/100`,
      `- Enterprise Readiness: ${score.enterpriseReadiness.score}/100`,
      `- Modernization Potential: ${score.modernizationPotential.score}/100`,
      "",
      "## Ethics Declaration",
      "",
      "- Respect original developers and maintain attribution",
      "- Preserve the original license",
      "- Preserve the original purpose and identity",
      "- Create upstream-friendly, additive changes",
      "",
    ].join("\n");
  }
}
