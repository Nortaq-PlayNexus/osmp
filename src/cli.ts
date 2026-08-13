import { loadConfig } from "./core/config.ts";
import { GitHubClient } from "./github/client.ts";
import { ProjectMemoryStore } from "./core/memory.ts";
import { Orchestrator } from "./core/orchestrator.ts";
import { DiscoveryEngine } from "./phases/discovery.ts";
import { logger, setLogLevel } from "./core/logger.ts";

const USAGE = `
osmp — Open Source Modernization Intelligence Platform

Usage:
  node src/cli.ts discover [--dry-run]   Run Phase 1 discovery + scoring only
  node src/cli.ts pipeline               Run the full 14-phase pipeline
  node src/cli.ts list                   List tracked projects in project memory
`;

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] ?? "pipeline";

  if (cmd === "--help" || cmd === "help" || cmd === "-h") {
    console.log(USAGE);
    return;
  }

  if (args.includes("--debug")) setLogLevel("debug");

  const config = loadConfig();
  if (!config.githubToken) {
    logger.warn("config", "no GITHUB_TOKEN set — unauthenticated rate limits apply (60 req/hr)");
  }
  if (config.dryRun) {
    logger.info("config", "DRY RUN enabled — no writes to GitHub, no forking");
  }

  const client = new GitHubClient(config.githubToken);
  const memory = new ProjectMemoryStore(config.memoryDir);

  switch (cmd) {
    case "discover": {
      const dryRun = args.includes("--dry-run");
      const engine = new DiscoveryEngine(client, {
        minStars: config.minStars,
        maxStars: config.maxStars,
        scoreThreshold: config.scoreThreshold,
        maxRepositories: config.topRepositories,
        searchQueries: config.searchQueries,
        dryRun: dryRun || config.dryRun,
      });
      const result = await engine.discover();
      printDiscovery(result);
      break;
    }
    case "list": {
      const projects = memory.listProjects();
      if (projects.length === 0) {
        console.log("No projects tracked yet.");
      } else {
        for (const p of projects) console.log(`- ${p}`);
      }
      break;
    }
    case "pipeline": {
      const orchestrator = new Orchestrator(config, client, memory);
      const report = await orchestrator.runPipeline();
      console.log("\n=== PIPELINE REPORT ===");
      console.log(`Discovered: ${report.discovered}`);
      console.log(`Selected:   ${report.selected.map((s) => s.fullName).join(", ") || "none"}`);
      for (const p of report.processed) {
        console.log(`  ${p.fullName}: ${p.passed ? "PASSED" : "FAILED"}`);
      }
      if (report.portfolioPath) console.log(`Portfolio:  ${report.portfolioPath}`);
      break;
    }
    default:
      console.error(`Unknown command: ${cmd}`);
      console.log(USAGE);
      process.exitCode = 1;
  }
}

function printDiscovery(result: { selected: Array<{ candidate: any; score: any }>; rejected: Array<{ candidate: any; reasons: string[] }> }) {
  console.log("\n=== DISCOVERY RESULTS ===");
  console.log(`Qualified candidates: ${result.selected.length}`);
  for (const s of result.selected) {
    console.log(`\n[SELECT] ${s.candidate.fullName}  OSPI=${s.score.openSourcePotentialIndex}`);
    console.log(`  stars=${s.candidate.stars} lang=${s.candidate.language} license=${s.candidate.license || "NONE"}`);
    console.log(`  ${s.candidate.description?.slice(0, 90)}`);
  }
  if (result.rejected.length > 0) {
    console.log(`\nRejected: ${result.rejected.length}`);
    for (const r of result.rejected.slice(0, 10)) {
      console.log(`  - ${r.candidate.fullName} (${r.reasons.join(", ")})`);
    }
  }
}

main().catch((e) => {
  logger.error("cli", (e as Error).message);
  process.exitCode = 1;
});
