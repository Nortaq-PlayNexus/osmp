import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import type { ProjectMemory, PhaseResult, PhaseId, PhaseStatus } from "./types.ts";
import { logger } from "./logger.ts";

const MEMORY_VERSION = 1;

function initialMemory(fullName: string, originalUrl: string): ProjectMemory {
  const now = new Date().toISOString();
  return {
    projectId: slugify(fullName),
    fullName,
    originalUrl,
    originalBranch: "main",
    createdAt: now,
    updatedAt: now,
    scores: {},
    decisions: [],
    audit: {},
    phases: {} as ProjectMemory["phases"],
    communityFeedback: [],
  };
}

function slugify(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]+/g, "_");
}

export class ProjectMemoryStore {
  private dir: string;

  constructor(memoryDir: string) {
    this.dir = resolve(memoryDir);
    mkdirSync(join(this.dir, "projects"), { recursive: true });
    const indexPath = join(this.dir, "index.json");
    if (!existsSync(indexPath)) {
      writeFileSync(indexPath, JSON.stringify({ version: MEMORY_VERSION, projects: [] }, null, 2));
    }
  }

  private pathFor(fullName: string): string {
    return join(this.dir, "projects", `${slugify(fullName)}.json`);
  }

  createProject(fullName: string, originalUrl: string): ProjectMemory {
    const mem = initialMemory(fullName, originalUrl);
    this.save(mem);
    this.indexAdd(mem.projectId, fullName);
    logger.info("memory", `created project record ${mem.projectId}`);
    return mem;
  }

  load(fullName: string): ProjectMemory | null {
    const p = this.pathFor(fullName);
    if (!existsSync(p)) return null;
    return JSON.parse(readFileSync(p, "utf8")) as ProjectMemory;
  }

  loadOrCreate(fullName: string, originalUrl: string): ProjectMemory {
    return this.load(fullName) ?? this.createProject(fullName, originalUrl);
  }

  save(memory: ProjectMemory): void {
    memory.updatedAt = new Date().toISOString();
    writeFileSync(this.pathFor(memory.fullName), JSON.stringify(memory, null, 2));
  }

  recordPhase(
    memory: ProjectMemory,
    phase: PhaseId,
    status: PhaseStatus,
    summary: string,
    artifacts: string[] = [],
    details?: unknown
  ): void {
    const now = new Date().toISOString();
    memory.phases[phase] = {
      phase,
      status,
      startedAt: now,
      completedAt: now,
      summary,
      artifacts,
      details,
    } satisfies PhaseResult;
    this.save(memory);
  }

  recordDecision(memory: ProjectMemory, decision: string, rationale: string): void {
    memory.decisions.push({ decision, rationale, timestamp: new Date().toISOString() });
    this.save(memory);
  }

  private indexAdd(projectId: string, fullName: string): void {
    const indexPath = join(this.dir, "index.json");
    const idx = JSON.parse(readFileSync(indexPath, "utf8")) as { version: number; projects: string[] };
    if (!idx.projects.includes(fullName)) {
      idx.projects.push(fullName);
      writeFileSync(indexPath, JSON.stringify(idx, null, 2));
    }
  }

  listProjects(): string[] {
    const indexPath = join(this.dir, "index.json");
    if (!existsSync(indexPath)) return [];
    const idx = JSON.parse(readFileSync(indexPath, "utf8")) as { version: number; projects: string[] };
    return idx.projects;
  }
}

export function getInitialMemoryFor(fullName: string, originalUrl: string): ProjectMemory {
  return initialMemory(fullName, originalUrl);
}
