export type AgentRole =
  | "cto"
  | "principal-architect"
  | "repository-analyst"
  | "security-engineer"
  | "backend-architect"
  | "frontend-engineer"
  | "devops-engineer"
  | "database-engineer"
  | "ai-product-engineer"
  | "qa-engineer"
  | "accessibility-engineer"
  | "docs-engineer"
  | "community-manager"
  | "code-review-maintainer";

export type PhaseId =
  | "discovery"
  | "acquisition"
  | "audit"
  | "modernization"
  | "ux"
  | "backend"
  | "ai-features"
  | "testing"
  | "devops"
  | "documentation"
  | "quality"
  | "contribution"
  | "community"
  | "portfolio";

export type PhaseStatus = "pending" | "running" | "passed" | "failed" | "skipped";

export interface RepoCandidate {
  fullName: string;
  url: string;
  description: string;
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
  language: string;
  license: string;
  pushedAt: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  contributors: number;
  defaultBranch: string;
  topics: string[];
  isFork: boolean;
  homepage?: string;
}

export interface ScoreDimension {
  label: string;
  score: number; // 0..100
  evidence: string[];
}

export interface RepoScore {
  fullName: string;
  architecture: ScoreDimension;
  maintainability: ScoreDimension;
  innovation: ScoreDimension;
  marketPotential: ScoreDimension;
  communityOpportunity: ScoreDimension;
  technicalDebt: ScoreDimension;
  enterpriseReadiness: ScoreDimension;
  modernizationPotential: ScoreDimension;
  activity: ScoreDimension;
  openSourcePotentialIndex: number;
  qualified: boolean;
}

export interface PhaseResult {
  phase: PhaseId;
  status: PhaseStatus;
  startedAt: string;
  completedAt: string;
  summary: string;
  artifacts: string[];
  details?: unknown;
}

export interface ProjectMemory {
  projectId: string;
  fullName: string;
  originalUrl: string;
  forkUrl?: string;
  pullRequestUrl?: string;
  originalBranch: string;
  workspacePath?: string;
  createdAt: string;
  updatedAt: string;
  scores: Record<string, number>;
  decisions: Array<{ decision: string; rationale: string; timestamp: string }>;
  audit: Record<string, unknown>;
  modernizationPlan?: unknown;
  testResults?: Record<string, unknown>;
  phases: Record<PhaseId, PhaseResult>;
  communityFeedback: Array<{
    source: string;
    text: string;
    responded: boolean;
    timestamp: string;
  }>;
}

export interface DiscoveryConfig {
  minStars: number;
  maxStars: number;
  scoreThreshold: number;
  maxRepositories: number;
  searchQueries: number;
  dryRun: boolean;
}

export interface PipelineContext {
  config: DiscoveryConfig;
  candidate?: RepoCandidate;
  score?: RepoScore;
  memory?: ProjectMemory;
  workspacePath?: string;
}
