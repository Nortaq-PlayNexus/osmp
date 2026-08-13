import { readFileSync } from "node:fs";
import { join } from "node:path";
import { existsSync } from "node:fs";

export interface EnvConfig {
  githubToken: string;
  githubOwner: string;
  workspaceRoot: string;
  memoryDir: string;
  portfolioDir: string;
  topRepositories: number;
  minStars: number;
  maxStars: number;
  scoreThreshold: number;
  searchQueries: number;
  dryRun: boolean;
}

function parseEnv(path = ".env"): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (key) out[key] = value;
  }
  return out;
}

export function loadConfig(): EnvConfig {
  const env = parseEnv(join(process.cwd(), ".env"));
  const num = (key: string, dflt: number) => {
    const v = env[key] ?? process.env[key];
    const n = Number(v);
    return Number.isFinite(n) && v !== undefined && v !== "" ? n : dflt;
  };
  const bool = (key: string, dflt: boolean) => {
    const v = env[key] ?? process.env[key];
    if (v === undefined) return dflt;
    return v.toLowerCase() === "true";
  };

  return {
    githubToken: env.GITHUB_TOKEN ?? process.env.GITHUB_TOKEN ?? "",
    githubOwner: env.GITHUB_OWNER ?? process.env.GITHUB_OWNER ?? "",
    workspaceRoot: env.WORKSPACE_ROOT ?? "./data/workspaces",
    memoryDir: env.MEMORY_DIR ?? "./data/memory",
    portfolioDir: env.PORTFOLIO_DIR ?? "./data/portfolio",
    topRepositories: num("TOP_REPOSITORIES", 5),
    minStars: num("MIN_STARS", 50),
    maxStars: num("MAX_STARS", 5000),
    scoreThreshold: num("SCORE_THRESHOLD", 80),
    searchQueries: num("SEARCH_QUERIES", 10),
    dryRun: bool("DRY_RUN", true),
  };
}
