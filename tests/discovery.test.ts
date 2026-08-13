import { test } from "node:test";
import assert from "node:assert/strict";
import { DiscoveryEngine } from "../src/phases/discovery.ts";
import type { GitHubClient } from "../src/github/client.ts";
import type { RepoCandidate } from "../src/core/types.ts";

function makeClient(items: Record<string, any>) {
  const toCandidate = (item: any): RepoCandidate => ({
    fullName: item.full_name,
    url: item.html_url,
    description: item.description ?? "",
    stars: item.stargazers_count,
    forks: item.forks_count,
    openIssues: item.open_issues_count,
    watchers: item.watchers_count,
    language: item.language ?? "unknown",
    license: item.license?.spdx_id ?? "",
    pushedAt: item.pushed_at,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    archived: item.archived,
    contributors: 0,
    defaultBranch: item.default_branch,
    topics: item.topics ?? [],
    isFork: item.fork,
    homepage: item.homepage ?? undefined,
  });
  const client = {
    toCandidate,
    async searchRepositories() {
      return Object.values(items);
    },
    async getRepository(fullName: string) {
      return items[fullName];
    },
    async countContributors() {
      return { count: 5, total: 5 };
    },
  } as unknown as GitHubClient;
  return client;
}

const goodItem = {
  full_name: "acme/good-tool",
  html_url: "https://github.com/acme/good-tool",
  description: "A solid toolkit with enterprise potential and modern stack",
  stargazers_count: 800,
  forks_count: 60,
  open_issues_count: 20,
  watchers_count: 40,
  language: "TypeScript",
  license: { spdx_id: "MIT" },
  pushed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  archived: false,
  fork: false,
  default_branch: "main",
  topics: ["toolkit", "api", "automation"],
  homepage: "https://good-tool.example",
  owner: { login: "acme" },
};

test("discovery rejects unlicensed, archived, and tutorial repos", async () => {
  const items = {
    "acme/unlicensed": { ...goodItem, full_name: "acme/unlicensed", license: null },
    "acme/dead": { ...goodItem, full_name: "acme/dead", archived: true },
    "acme/tutorial": { ...goodItem, full_name: "acme/tutorial", description: "A tutorial on building things step by step" },
  };
  const engine = new DiscoveryEngine(makeClient(items), {
    minStars: 50,
    maxStars: 5000,
    scoreThreshold: 80,
    maxRepositories: 5,
    searchQueries: 1,
    dryRun: true,
  });
  const result = await engine.discover();
  assert.equal(result.candidates.length, 0);
  assert.equal(result.rejected.length, 3);
});

test("discovery selects qualified repos sorted by OSPI", async () => {
  const items = { "acme/good-tool": goodItem };
  const engine = new DiscoveryEngine(makeClient(items), {
    minStars: 50,
    maxStars: 5000,
    scoreThreshold: 80,
    maxRepositories: 5,
    searchQueries: 1,
    dryRun: true,
  });
  const result = await engine.discover();
  assert.equal(result.selected.length, 1);
  assert.equal(result.selected[0].candidate.fullName, "acme/good-tool");
  assert.ok(result.selected[0].score.openSourcePotentialIndex >= 80);
});
