import type { RepoCandidate, RepoScore, ScoreDimension } from "./types.ts";

const clamp = (n: number) => Math.max(0, Math.min(100, n));

interface Weights {
  architecture: number;
  innovation: number;
  modernization: number;
  community: number;
  enterprise: number;
  activity: number;
}

const DEFAULT_WEIGHTS: Weights = {
  architecture: 0.2,
  innovation: 0.2,
  modernization: 0.2,
  community: 0.15,
  enterprise: 0.15,
  activity: 0.1,
};

function dim(label: string, score: number, evidence: string[]): ScoreDimension {
  return { label, score: clamp(Math.round(score)), evidence };
}

export interface ScoreInputs {
  candidate: RepoCandidate;
  contributors: number;
  contributorsPerStar: number;
  hasDocs: boolean;
  hasTests: boolean;
  hasCI: boolean;
  hasReadme: boolean;
  starGrowthRatio: number;
  issueVelocity: number;
  languages: string[];
}

export function scoreCandidate(inputs: ScoreInputs, weights: Weights = DEFAULT_WEIGHTS): RepoScore {
  const c = inputs.candidate;

  const activityScore =
    activityDimension(c, inputs.starGrowthRatio, inputs.issueVelocity).score;

  const architecture = dim("Architecture Quality", architectureScore(c), [
    `primary language ${c.language ?? "unknown"}`,
    `~${c.forks} forks`,
    c.archived ? "archived (deducted)" : "not archived",
  ]);

  const maintainability = dim("Code Maintainability", maintainabilityScore(inputs), [
    `docs: ${inputs.hasDocs ? "yes" : "no"}`,
    `tests: ${inputs.hasTests ? "yes" : "no"}`,
    `CI: ${inputs.hasCI ? "yes" : "no"}`,
  ]);

  const innovation = dim("Innovation", innovationScore(c), [
    `topics: ${c.topics.slice(0, 5).join(", ") || "none"}`,
    `language diversity: ${inputs.languages.length}`,
  ]);

  const marketPotential = dim("Market Potential", marketPotentialScore(c), [
    `${c.stars} stars / ${c.forks} forks`,
    `homepage: ${c.homepage ?? "none"}`,
  ]);

  const communityOpportunity = dim("Community Opportunity", communityScore(c, inputs.contributors), [
    `${inputs.contributors} contributors`,
    `${c.openIssues} open issues`,
  ]);

  const technicalDebt = dim("Technical Debt (lower is better, scored as health)", technicalDebtScore(inputs), [
    c.archived ? "high risk" : "healthy lifecycle",
  ]);

  const enterpriseReadiness = dim("Enterprise Readiness", enterpriseScore(c, inputs), [
    `license: ${c.license ?? "none"}`,
    c.homepage ? "has homepage" : "no homepage",
  ]);

  const modernizationPotential = dim("Modernization Potential", modernizationScore(c, inputs), [
    inputs.hasCI ? "already has CI" : "no CI — opportunity",
    inputs.hasTests ? "already tested" : "no tests — opportunity",
    inputs.hasDocs ? "already documented" : "no docs — opportunity",
  ]);

  const ospi = clamp(
    architecture.score * weights.architecture +
      innovation.score * weights.innovation +
      modernizationPotential.score * weights.modernization +
      communityOpportunity.score * weights.community +
      enterpriseReadiness.score * weights.enterprise +
      activityScore * weights.activity
  );

  return {
    fullName: c.fullName,
    architecture,
    maintainability,
    innovation,
    marketPotential,
    communityOpportunity,
    technicalDebt,
    enterpriseReadiness,
    modernizationPotential,
    activity: activityDimension(c, inputs.starGrowthRatio, inputs.issueVelocity),
    openSourcePotentialIndex: ospi,
    qualified: ospi >= 80,
  };
}

function architectureScore(c: RepoCandidate): number {
  let s = 55;
  if (c.language && c.language !== "HTML" && c.language !== "CSS") s += 8;
  if (c.topics.length > 3) s += 7;
  if (!c.archived) s += 10;
  if (c.forks > 0) s += 5;
  if (c.homepage) s += 3;
  return s;
}

function maintainabilityScore(inputs: ScoreInputs): number {
  let s = 50;
  if (inputs.hasReadme) s += 15;
  if (inputs.hasDocs) s += 10;
  if (inputs.hasTests) s += 10;
  if (inputs.hasCI) s += 10;
  if (inputs.contributors > 1) s += 5;
  return s;
}

function innovationScore(c: RepoCandidate): number {
  let s = 60;
  if (c.topics.length >= 3) s += 10;
  else if (c.topics.length > 0) s += 5;
  if (c.description && c.description.length > 80) s += 5;
  if (c.homepage) s += 5;
  return s;
}

function marketPotentialScore(c: RepoCandidate): number {
  let s = 55;
  if (c.stars >= 200) s += 10;
  else if (c.stars >= 100) s += 5;
  if (c.forks >= 50) s += 5;
  else if (c.forks >= 10) s += 3;
  if (c.homepage) s += 10;
  if (c.openIssues > 10) s += 5;
  return s;
}

function communityScore(c: RepoCandidate, contributors: number): number {
  let s = 55;
  if (contributors >= 10) s += 10;
  else if (contributors >= 3) s += 5;
  if (c.openIssues > 5) s += 10;
  if (c.watchers > 20) s += 5;
  return s;
}

function technicalDebtScore(inputs: ScoreInputs): number {
  let s = 60;
  if (inputs.hasTests) s += 15;
  if (inputs.hasCI) s += 10;
  if (inputs.hasDocs) s += 10;
  return s;
}

function enterpriseScore(c: RepoCandidate, inputs: ScoreInputs): number {
  let s = 45;
  if (c.license) s += 20;
  if (c.homepage) s += 10;
  if (inputs.hasTests) s += 10;
  if (inputs.hasCI) s += 10;
  if (c.stars >= 100) s += 5;
  return s;
}

function modernizationScore(c: RepoCandidate, inputs: ScoreInputs): number {
  let s = 72;
  if (!inputs.hasCI) s += 8;
  if (!inputs.hasTests) s += 8;
  if (!inputs.hasDocs) s += 8;
  if (c.archived) s -= 30;
  return s;
}

function activityDimension(c: RepoCandidate, starGrowthRatio: number, issueVelocity: number): ScoreDimension {
  let s = 50;
  const monthsSincePush = monthsBetween(new Date(c.pushedAt));
  if (monthsSincePush <= 1) s += 20;
  else if (monthsSincePush <= 3) s += 10;
  else if (monthsSincePush <= 6) s += 5;
  else s -= 20;

  if (starGrowthRatio > 1.0) s += 10;
  else if (starGrowthRatio > 0.5) s += 5;

  if (issueVelocity > 1) s += 5;
  if (c.openIssues > 0) s += 5;

  return dim("Activity", s, [
    `last push ${monthsSincePush} month(s) ago`,
    `star growth ratio ${starGrowthRatio.toFixed(2)}`,
    `issue velocity ${issueVelocity.toFixed(1)}`,
  ]);
}

export function monthsBetween(date: Date): number {
  return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
}

export function computeWeights(): Weights {
  return DEFAULT_WEIGHTS;
}
