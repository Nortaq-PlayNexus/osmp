import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { logger } from "../core/logger.ts";

export function git(...args: string[]): string {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string };
    throw new Error(`git ${args.join(" ")} failed: ${(err.stderr ?? err.stdout ?? "").toString().slice(0, 800)}`, {
      cause: e,
    });
  }
}

export function gitIn(dir: string, ...args: string[]): string {
  try {
    return execFileSync("git", args, { encoding: "utf8", cwd: dir, stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string };
    throw new Error(`git ${args.join(" ")} in ${dir} failed: ${(err.stderr ?? err.stdout ?? "").toString().slice(0, 800)}`, {
      cause: e,
    });
  }
}

export function cloneRepo(url: string, dir: string, branch = "main"): void {
  if (existsSync(dir)) {
    logger.warn("git", `clone target exists, skipping: ${dir}`);
    return;
  }
  logger.info("git", `cloning ${url} -> ${dir}`);
  git("clone", "--branch", branch, "--single-branch", url, dir);
}

export function createBranch(dir: string, branch: string): void {
  logger.info("git", `creating branch ${branch}`);
  gitIn(dir, "checkout", "-b", branch);
}

export function commitAll(dir: string, message: string): void {
  gitIn(dir, "add", "-A");
  gitIn(dir, "commit", "-m", message);
}

export function branchExists(dir: string, branch: string): boolean {
  try {
    gitIn(dir, "rev-parse", "--verify", `refs/heads/${branch}`);
    return true;
  } catch {
    return false;
  }
}

export function ensureBranch(dir: string, branch: string): void {
  if (branchExists(dir, branch)) {
    logger.debug("git", `branch ${branch} exists`);
  } else {
    gitIn(dir, "checkout", "-b", branch);
  }
}

export function currentBranch(dir: string): string {
  return gitIn(dir, "branch", "--show-current");
}

export function repoIsClean(dir: string): boolean {
  return gitIn(dir, "status", "--porcelain") === "";
}

export function commitCount(dir: string): number {
  try {
    return Number(gitIn(dir, "rev-list", "--count", "HEAD"));
  } catch {
    return 0;
  }
}

export function diffStat(dir: string, base: string): { files: number; added: number; removed: number } {
  try {
    const out = gitIn(dir, "diff", "--shortstat", base);
    const files = Number((out.match(/(\d+) file/) ?? [])[1] ?? 0);
    const added = Number((out.match(/(\d+) insertion/) ?? [])[1] ?? 0);
    const removed = Number((out.match(/(\d+) deletion/) ?? [])[1] ?? 0);
    return { files, added, removed };
  } catch {
    return { files: 0, added: 0, removed: 0 };
  }
}

export function workspaceFor(fullName: string, root: string): string {
  return join(root, fullName.replace(/[^a-zA-Z0-9_-]+/g, "_"));
}
