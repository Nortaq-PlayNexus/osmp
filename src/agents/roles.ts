import type { AgentRole } from "../core/types.ts";

export interface AgentSpec {
  role: AgentRole;
  title: string;
  mandate: string;
  responsibilities: string[];
}

export const AGENTS: AgentSpec[] = [
  {
    role: "cto",
    title: "Chief Technology Officer",
    mandate: "Set the technical vision and gate every modernization decision against enterprise quality.",
    responsibilities: ["Final sign-off", "Technical strategy", "Risk acceptance"],
  },
  {
    role: "principal-architect",
    title: "Principal Software Architect",
    mandate: "Design target architectures that preserve the original creator's vision.",
    responsibilities: ["Architecture blueprints", "Design patterns", "Modularization"],
  },
  {
    role: "repository-analyst",
    title: "Repository Intelligence Analyst",
    mandate: "Score and rank candidates using the Open Source Potential Index.",
    responsibilities: ["Discovery", "Scoring", "Ranking", "Risk assessment"],
  },
  {
    role: "security-engineer",
    title: "Security Research Engineer",
    mandate: "Never ship a critical vulnerability upstream.",
    responsibilities: ["SAST", "Dependency scanning", "Secret detection", "License compliance"],
  },
  {
    role: "backend-architect",
    title: "Backend Architect",
    mandate: "Transform backends to enterprise standards.",
    responsibilities: ["API design", "Validation", "Rate limiting", "AuthN/AuthZ"],
  },
  {
    role: "frontend-engineer",
    title: "Frontend Experience Engineer",
    mandate: "Deliver premium, accessible user experiences.",
    responsibilities: ["Design systems", "Responsive layouts", "Command palettes", "Theming"],
  },
  {
    role: "devops-engineer",
    title: "DevOps/SRE Engineer",
    mandate: "Automate build, deploy, security, and reliability.",
    responsibilities: ["CI/CD", "Docker", "Monitoring", "Deployment templates"],
  },
  {
    role: "database-engineer",
    title: "Database Optimization Engineer",
    mandate: "Make queries fast and data safe.",
    responsibilities: ["Query optimization", "Indexes", "Migrations", "Caching"],
  },
  {
    role: "ai-product-engineer",
    title: "AI Product Engineer",
    mandate: "Only add AI where it creates measurable user value.",
    responsibilities: ["AI feature analysis", "Assistants", "Recommendations"],
  },
  {
    role: "qa-engineer",
    title: "QA Automation Engineer",
    mandate: "Guarantee 80%+ coverage and 90%+ on critical modules.",
    responsibilities: ["Unit tests", "Integration tests", "Coverage reports"],
  },
  {
    role: "accessibility-engineer",
    title: "Accessibility Engineer",
    mandate: "Make every interface WCAG-compliant.",
    responsibilities: ["A11y audits", "Keyboard navigation", "Screen readers"],
  },
  {
    role: "docs-engineer",
    title: "Technical Documentation Engineer",
    mandate: "Document everything a developer needs to succeed.",
    responsibilities: ["README", "API reference", "Architecture docs", "Guides"],
  },
  {
    role: "community-manager",
    title: "Open Source Community Manager",
    mandate: "Communicate professionally with maintainers and communities.",
    responsibilities: ["PR communication", "Feedback loops", "Contribution etiquette"],
  },
  {
    role: "code-review-maintainer",
    title: "Code Review Maintainer",
    mandate: "Ensure every change meets enterprise quality before PR creation.",
    responsibilities: ["Code review", "Quality gate", "Enterprise Quality Certificate"],
  },
];

export function getAgent(role: AgentRole): AgentSpec {
  return AGENTS.find((a) => a.role === role)!;
}

export function agentTitles(): Record<AgentRole, string> {
  return Object.fromEntries(AGENTS.map((a) => [a.role, a.title])) as Record<AgentRole, string>;
}
