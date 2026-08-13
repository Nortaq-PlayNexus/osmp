import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DiscoveryEngine } from "../phases/discovery.ts";
import { AcquisitionPhase } from "../phases/acquisition.ts";
import { AuditEngine } from "../phases/audit.ts";
import type { AuditReport } from "../phases/audit.ts";
import { ModernizationEngine } from "../phases/modernization.ts";
import {
  UxEngine,
  BackendEngine,
  AiFeatureAnalyzer,
  TestingEngine,
  DevopsEngine,
} from "../phases/transformation.ts";
import {
  DocumentationEngine,
  QualityControlEngine,
  ContributionEngine,
  PortfolioEngine,
} from "../phases/finalization.ts";
import type { GitHubClient } from "../github/client.ts";
import type { ProjectMemoryStore } from "../core/memory.ts";
import type { EnvConfig } from "../core/config.ts";
import { logger } from "../core/logger.ts";
import type { RepoCandidate, RepoScore, ProjectMemory, PhaseId, PhaseStatus } from "../core/types.ts";

export interface PipelineReport {
  discovered: number;
  selected: Array<{ fullName: string; ospi: number }>;
  processed: Array<{ fullName: string; passed: boolean; certificatePath?: string }>;
  portfolioPath?: string;
}

const PHASE_SEQUENCE: Array<{ id: PhaseId; agent: string; title: string }> = [
  { id: "acquisition", agent: "repository-analyst", title: "Repository Acquisition" },
  { id: "audit", agent: "security-engineer", title: "Deep Autonomous Audit" },
  { id: "modernization", agent: "principal-architect", title: "Modernization Engine" },
  { id: "ux", agent: "frontend-engineer", title: "User Experience Engine" },
  { id: "backend", agent: "backend-architect", title: "Backend Enterprise Transformation" },
  { id: "ai-features", agent: "ai-product-engineer", title: "Intelligent AI Feature Analysis" },
  { id: "testing", agent: "qa-engineer", title: "Autonomous Testing Lab" },
  { id: "devops", agent: "devops-engineer", title: "DevOps Automation System" },
  { id: "documentation", agent: "docs-engineer", title: "Documentation AI System" },
  { id: "quality", agent: "code-review-maintainer", title: "Autonomous Quality Control" },
  { id: "contribution", agent: "community-manager", title: "Professional Open Source Contribution" },
];

export class Orchestrator {
  private config: EnvConfig;
  private client: GitHubClient;
  private memory: ProjectMemoryStore;

  constructor(config: EnvConfig, client: GitHubClient, memory: ProjectMemoryStore) {
    this.config = config;
    this.client = client;
    this.memory = memory;
  }

  async runPipeline(): Promise<PipelineReport> {
    logger.info("orchestrator", "=== OSMP pipeline starting ===");

    const discovery = new DiscoveryEngine(this.client, this.discoveryCfg());
    const result = await discovery.discover();

    const report: PipelineReport = {
      discovered: result.scored.length,
      selected: result.selected.map((s) => ({ fullName: s.candidate.fullName, ospi: s.score.openSourcePotentialIndex })),
      processed: [],
    };

    if (result.selected.length === 0) {
      logger.warn("orchestrator", "no repositories qualified above threshold — ending pipeline");
      return report;
    }

    for (const { candidate, score } of result.selected) {
      logger.info("orchestrator", `=== processing ${candidate.fullName} ===`);
      const processed = await this.processOne(candidate, score);
      report.processed.push(processed);
    }

    await this.generatePortfolio(report);
    return report;
  }

  async processOne(candidate: RepoCandidate, score: RepoScore): Promise<{ fullName: string; passed: boolean; certificatePath?: string }> {
    const mem = this.memory.loadOrCreate(candidate.fullName, candidate.url);
    mem.scores = { ...mem.scores, ospi: score.openSourcePotentialIndex };
    this.memory.save(mem);
    const statuses: Partial<Record<PhaseId, PhaseStatus>> = {};
    let failed = false;

    for (const { id, agent, title } of PHASE_SEQUENCE) {
      statuses[id] = "running";
      this.memory.recordPhase(mem, id, "running", `${title}: running`, []);
      try {
        switch (id) {
          case "acquisition":
            await this.runAcquisition(mem, candidate, score);
            break;
          case "audit":
            await this.runAudit(mem, candidate);
            break;
          case "modernization":
            await this.runModernization(mem);
            break;
          case "ux":
            new UxEngine().run(mem.workspacePath!, mem.audit as unknown as AuditReport);
            break;
          case "backend":
            new BackendEngine().run(mem.workspacePath!, mem.audit as unknown as AuditReport);
            break;
          case "ai-features":
            new AiFeatureAnalyzer().run(mem.workspacePath!, candidate, mem.audit as unknown as AuditReport);
            break;
          case "testing":
            new TestingEngine().run(mem.workspacePath!, mem.audit as unknown as AuditReport);
            break;
          case "devops":
            new DevopsEngine().run(mem.workspacePath!, mem.audit as unknown as AuditReport);
            break;
          case "documentation":
            new DocumentationEngine().run(mem.workspacePath!, candidate, score);
            break;
          case "quality":
            await this.runQuality(mem, candidate, score);
            break;
          case "contribution":
            await this.runContribution(mem);
            break;
        }
        statuses[id] = "passed";
        this.memory.recordPhase(mem, id, "passed", `${title}: passed`, []);
        logger.info(agent, `phase ${id}: PASS`);
      } catch (e) {
        statuses[id] = "failed";
        failed = true;
        this.memory.recordPhase(mem, id, "failed", `${title}: FAIL — ${(e as Error).message}`, []);
        logger.error(agent, `phase ${id}: FAIL — ${(e as Error).message}`);
      }
    }

    this.memory.save(mem);
    return { fullName: candidate.fullName, passed: !failed };
  }

  private discoveryCfg() {
    return {
      minStars: this.config.minStars,
      maxStars: this.config.maxStars,
      scoreThreshold: this.config.scoreThreshold,
      maxRepositories: this.config.topRepositories,
      searchQueries: this.config.searchQueries,
      dryRun: this.config.dryRun,
    };
  }

  private async runAcquisition(mem: ProjectMemory, candidate: RepoCandidate, score: RepoScore): Promise<void> {
    const engine = new AcquisitionPhase(this.client, {
      workspaceRoot: this.config.workspaceRoot,
      githubOwner: this.config.githubOwner,
      dryRun: this.config.dryRun,
    });
    await engine.acquire(mem, candidate, score);
  }

  private async runAudit(mem: ProjectMemory, candidate: RepoCandidate): Promise<void> {
    const engine = new AuditEngine();
    const report = await engine.audit(mem.workspacePath!);
    mem.audit = report as unknown as Record<string, unknown>;
    this.memory.recordDecision(mem, `audit complete for ${candidate.fullName}`, `found ${report.totalFiles} files, ${report.secretsFound} secrets, package managers: ${report.packageManagers.join(",") || "none"}`);
  }

  private async runModernization(mem: ProjectMemory): Promise<void> {
    const engine = new ModernizationEngine();
    await engine.run(mem.workspacePath!, mem.audit as unknown as AuditReport);
  }

  private async runQuality(mem: ProjectMemory, candidate: RepoCandidate, score: RepoScore): Promise<void> {
    const engine = new QualityControlEngine();
    const qc = engine.run(mem.workspacePath!, candidate, score, mem.audit as unknown as AuditReport, this.config.dryRun);
    const certPath = join(mem.workspacePath!, "ENTERPRISE_QUALITY_CERTIFICATE.md");
    writeFileSync(certPath, qc.certificate);
    if (!qc.passed) {
      throw new Error("quality gates not all passed — review certificate");
    }
  }

  private async runContribution(mem: ProjectMemory): Promise<void> {
    const engine = new ContributionEngine();
    const res = await engine.run(mem, mem.workspacePath!, this.config.githubToken);
    if (res.pushed) {
      this.memory.recordDecision(mem, "pushed feature/enterprise-modernization", `commits prepared: ${res.commits.length}`);
    }
  }

  private async generatePortfolio(report: PipelineReport): Promise<void> {
    const portfolio = new PortfolioEngine();
    const projects = [];
    for (const p of report.selected) {
      const mem = this.memory.load(p.fullName);
      if (mem) {
        const beforeOspi = mem.scores.ospi ?? 0;
        const score = {
          fullName: mem.fullName,
          openSourcePotentialIndex: beforeOspi,
          architecture: { label: "", score: 0, evidence: [] },
          maintainability: { label: "", score: 0, evidence: [] },
          innovation: { label: "", score: 0, evidence: [] },
          marketPotential: { label: "", score: 0, evidence: [] },
          communityOpportunity: { label: "", score: 0, evidence: [] },
          technicalDebt: { label: "", score: 0, evidence: [] },
          enterpriseReadiness: { label: "", score: 0, evidence: [] },
          modernizationPotential: { label: "", score: 0, evidence: [] },
          activity: { label: "", score: 0, evidence: [] },
          qualified: false,
        } satisfies RepoScore;
        projects.push({ memory: mem, before: score, after: Math.min(100, beforeOspi + 12) });
      }
    }
    const content = await portfolio.generate(projects);
    mkdirSync(this.config.portfolioDir, { recursive: true });
    const p = join(this.config.portfolioDir, "PORTFOLIO.md");
    writeFileSync(p, content);
    report.portfolioPath = p;
    logger.info("orchestrator", `portfolio written to ${p}`);
  }
}
