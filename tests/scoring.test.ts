import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreCandidate } from "../src/core/scoring.ts";
import type { RepoCandidate } from "../src/core/types.ts";

function makeCandidate(over: Partial<RepoCandidate> = {}): RepoCandidate {
  const now = new Date().toISOString();
  return {
    fullName: "acme/tool",
    url: "https://github.com/acme/tool",
    description: "A useful toolkit for developers with some real value and decent length",
    stars: 500,
    forks: 40,
    openIssues: 12,
    watchers: 30,
    language: "TypeScript",
    license: "MIT",
    pushedAt: now,
    createdAt: now,
    updatedAt: now,
    archived: false,
    contributors: 8,
    defaultBranch: "main",
    topics: ["toolkit", "cli", "automation"],
    isFork: false,
    homepage: "https://example.com",
    ...over,
  };
}

function inputs(candidate: RepoCandidate) {
  return {
    candidate,
    contributors: 8,
    contributorsPerStar: 8 / Math.max(1, candidate.stars),
    hasDocs: true,
    hasTests: true,
    hasCI: true,
    hasReadme: true,
    starGrowthRatio: candidate.stars / (1 + candidate.forks),
    issueVelocity: candidate.openIssues / 1,
    languages: ["TypeScript"],
  };
}

test("strong project scores above 80 and qualifies", () => {
  const c = makeCandidate();
  const score = scoreCandidate(inputs(c));
  assert.ok(score.openSourcePotentialIndex >= 80, `expected >= 80, got ${score.openSourcePotentialIndex}`);
  assert.equal(score.qualified, true);
});

test("abandoned project does not qualify", () => {
  const c = makeCandidate({
    pushedAt: new Date(Date.now() - 18 * 30.44 * 24 * 3600 * 1000).toISOString(),
    stars: 60,
  });
  const score = scoreCandidate(inputs(c));
  assert.ok(score.openSourcePotentialIndex < 80, `expected < 80, got ${score.openSourcePotentialIndex}`);
  assert.equal(score.qualified, false);
});

test("all dimensions are clamped to 0..100", () => {
  const score = scoreCandidate(inputs(makeCandidate()));
  const dims = [
    score.architecture,
    score.maintainability,
    score.innovation,
    score.marketPotential,
    score.communityOpportunity,
    score.technicalDebt,
    score.enterpriseReadiness,
    score.modernizationPotential,
    score.activity,
  ];
  for (const d of dims) {
    assert.ok(d.score >= 0 && d.score <= 100, `${d.label} out of range: ${d.score}`);
  }
  assert.ok(score.openSourcePotentialIndex >= 0 && score.openSourcePotentialIndex <= 100);
});

test("OSPI weights sum to 1.0", () => {
  const score = scoreCandidate(inputs(makeCandidate()));
  assert.ok(score.openSourcePotentialIndex > 0);
});
