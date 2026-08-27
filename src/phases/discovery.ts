import type { DiscoveryConfig, RepoCandidate, RepoScore } from "../core/types.ts";
import type { GitHubClient } from "../github/client.ts";
import type { GitHubSearchItem } from "../github/client.ts";
import { scoreCandidate } from "../core/scoring.ts";
import type { ScoreInputs } from "../core/scoring.ts";
import { logger } from "../core/logger.ts";

const REJECT_REASONS = {
  unlicensed: "no license",
  archived: "archived",
  fork: "is a fork",
  tutorial: "looks like a tutorial",
  spam: "suspected AI spam",
  abandoned: "stale (no push in 12+ months)",
  lowStars: "below star range",
  highStars: "above star range",
  demo: "demo/boilerplate",
} as const;

export interface DiscoveryResult {
  candidates: RepoCandidate[];
  scored: Array<{ candidate: RepoCandidate; score: RepoScore }>;
  selected: Array<{ candidate: RepoCandidate; score: RepoScore }>;
  rejected: Array<{ candidate: RepoCandidate; reasons: string[] }>;
}

export class DiscoveryEngine {
  private client: GitHubClient;
  private config: DiscoveryConfig;

  constructor(client: GitHubClient, config: DiscoveryConfig) {
    this.client = client;
    this.config = config;
  }

  async discover(): Promise<DiscoveryResult> {
    logger.info("discovery", "beginning global repository discovery");
    const queries = this.buildQueries();
    const raw = new Map<string, GitHubSearchItem>();

    for (const q of queries) {
      try {
        const items = await this.client.searchRepositories(q, 30);
        logger.debug("discovery", `query "${q}" -> ${items.length} results`);
        for (const it of items) raw.set(it.full_name, it);
      } catch (e) {
        logger.warn("discovery", `query failed "${q}": ${(e as Error).message}`);
      }
      await sleep(600);
    }

    logger.info("discovery", `collected ${raw.size} unique repositories`);

    const candidates: RepoCandidate[] = [];
    const rejected: DiscoveryResult["rejected"] = [];

    for (const item of raw.values()) {
      const cand = this.client.toCandidate(item);
      const reasons = this.rejectReasons(cand);
      if (reasons.length === 0) {
        candidates.push(cand);
      } else {
        rejected.push({ candidate: cand, reasons });
      }
    }

    logger.info("discovery", `${candidates.length} passed filters, ${rejected.length} rejected`);

    const scored = await this.enrichAndScore(candidates);
    scored.sort((a, b) => b.score.openSourcePotentialIndex - a.score.openSourcePotentialIndex);

    const selected = scored.filter((s) => s.score.qualified).slice(0, this.config.maxRepositories);

    for (const s of selected) {
      logger.info("discovery", `SELECT ${s.candidate.fullName} OSPI=${s.score.openSourcePotentialIndex}`);
    }

    return { candidates, scored, selected, rejected };
  }

  private buildQueries(): string[] {
    const { minStars, maxStars, searchQueries } = this.config;
    const base = `stars:${minStars}..${maxStars}`;
    const terms = [
      "toolkit",
      "framework",
      "library",
      "cli",
      "dashboard",
      "engine",
      "sdk",
      "api",
      "parser",
      "visualization",
      "automation",
      "notebook",
      "pipeline",
      "widget",
      "bot",
      "scanner",
      "reporter",
      "analytics",
      "workflow",
      "gallery",
    ];
    const queries: string[] = [];
    for (const t of terms) {
      if (queries.length >= searchQueries) break;
      queries.push(`${base} ${t}`);
    }
    while (queries.length < searchQueries) {
      queries.push(`${base} language:TypeScript stars:${minStars}..${maxStars}`);
    }
    return queries.slice(0, searchQueries);
  }

  private rejectReasons(c: RepoCandidate): string[] {
    const reasons: string[] = [];
    if (!c.license) reasons.push(REJECT_REASONS.unlicensed);
    if (c.archived) reasons.push(REJECT_REASONS.archived);
    if (c.isFork) reasons.push(REJECT_REASONS.fork);
    if (c.stars < this.config.minStars) reasons.push(REJECT_REASONS.lowStars);
    if (c.stars > this.config.maxStars) reasons.push(REJECT_REASONS.highStars);
    if (isTutorial(c)) reasons.push(REJECT_REASONS.tutorial);
    if (isSpam(c)) reasons.push(REJECT_REASONS.spam);
    if (isDemo(c)) reasons.push(REJECT_REASONS.demo);
    if (monthsSince(c.pushedAt) > 12) reasons.push(REJECT_REASONS.abandoned);
    return reasons;
  }

  private async enrichAndScore(list: RepoCandidate[]): Promise<DiscoveryResult["scored"]> {
    const scored: DiscoveryResult["scored"] = [];
    for (const candidate of list) {
      try {
        const full = await this.client.getRepository(candidate.fullName);
        const merged = { ...candidate, ...this.client.toCandidate(full) };

        let contributors = 0;
        if (!this.config.dryRun) {
          const cc = await this.client.countContributors(merged.fullName);
          contributors = cc.count;
        }

        const inputs: ScoreInputs = {
          candidate: merged,
          contributors,
          contributorsPerStar: contributors / Math.max(1, merged.stars),
          hasDocs: false,
          hasTests: false,
          hasCI: false,
          hasReadme: true,
          starGrowthRatio: merged.stars / (1 + merged.forks),
          issueVelocity: merged.openIssues / Math.max(1, monthsSince(merged.createdAt)),
          languages: [merged.language],
        };
        const score = scoreCandidate(inputs);
        scored.push({ candidate: merged, score });
        await sleep(400);
      } catch (e) {
        logger.warn("discovery", `enrich failed for ${candidate.fullName}: ${(e as Error).message}`);
      }
    }
    return scored;
  }
}

function isTutorial(c: RepoCandidate): boolean {
  const d = c.description.toLowerCase();
  const topics = c.topics.join(" ").toLowerCase();
  return (
    /(^|\s)(tutorial|example|sample|demo project|how-to|guide)(\s|$)/.test(d + " " + topics) ||
    /tutorial|learn to|step-by-step/.test(d)
  );
}

function isSpam(c: RepoCandidate): boolean {
  const topics = c.topics.join(" ").toLowerCase();
  return /gpt|chatgpt|llm-spam|ai-generated/.test(topics) && c.stars < 100;
}

function isDemo(c: RepoCandidate): boolean {
  return c.topics.includes("demo") || c.topics.includes("template");
}

function monthsSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
