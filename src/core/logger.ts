const LEVELS = ["debug", "info", "warn", "error"] as const;
type Level = (typeof LEVELS)[number];

let currentLevel: Level = "info";

export function setLogLevel(level: Level) {
  currentLevel = level;
}

function ts(): string {
  return new Date().toISOString();
}

function out(level: Level, agent: string, msg: string) {
  if (LEVELS.indexOf(level) < LEVELS.indexOf(currentLevel)) return;
  const prefix = `[${ts()}] [${level.toUpperCase().padEnd(5)}]`;
  const line = ` ${prefix} [${agent}] ${msg}`;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (agent: string, msg: string) => out("debug", agent, msg),
  info: (agent: string, msg: string) => out("info", agent, msg),
  warn: (agent: string, msg: string) => out("warn", agent, msg),
  error: (agent: string, msg: string) => out("error", agent, msg),
};
