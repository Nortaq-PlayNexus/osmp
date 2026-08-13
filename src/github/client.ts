import type { RepoCandidate } from "../core/types.ts";

const API = "https://api.github.com";

export interface GitHubSearchItem {
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  language: string | null;
  license: { spdx_id: string | null } | null;
  pushed_at: string;
  created_at: string;
  updated_at: string;
  archived: boolean;
  fork: boolean;
  default_branch: string;
  topics: string[];
  homepage: string | null;
  owner: { login: string };
}

export class RateLimitError extends Error {
  resetAt?: string;
}

export class GitHubClient {
  private token: string;
  private cache = new Map<string, unknown>();

  constructor(token: string) {
    this.token = token;
  }

  async request2<T = unknown>(
    path: string,
    opts: { method?: string; body?: unknown } = {}
  ): Promise<T> {
    const url = `${API}${path}`;
    const res = await fetch(url, {
      method: opts.method ?? "GET",
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "osmp-autonomous-modernization",
        "Content-Type": "application/json",
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`GitHub ${res.status} ${opts.method ?? "GET"} ${path}: ${body.slice(0, 500)}`);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  private async request<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const qs = new URLSearchParams(params).toString();
    const url = `${API}${path}${qs ? `?${qs}` : ""}`;
    if (this.cache.has(url)) return this.cache.get(url) as T;

    const res = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "osmp-autonomous-modernization",
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
    });

    if (res.status === 403) {
      const reset = res.headers.get("x-ratelimit-reset");
      throw new RateLimitError(`rate limited (token: ${this.token ? "present" : "absent"})` + (reset ? ` resets ${new Date(+reset * 1000).toISOString()}` : ""));
    }
    if (res.status === 404) {
      const err = new Error(`GitHub 404 on ${url}`);
      (err as any).status = 404;
      throw err;
    }
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`GitHub ${res.status} on ${url}: ${body.slice(0, 500)}`);
    }
    const json = (await res.json()) as T;
    this.cache.set(url, json);
    return json;
  }

  async searchRepositories(query: string, perPage = 30, page = 1): Promise<GitHubSearchItem[]> {
    const data = await this.request<{ items: GitHubSearchItem[] }>("/search/repositories", {
      q: query,
      per_page: String(perPage),
      page: String(page),
    });
    return data.items;
  }

  async getRepository(fullName: string): Promise<GitHubSearchItem> {
    return this.request<GitHubSearchItem>(`/repos/${fullName}`);
  }

  async countContributors(fullName: string): Promise<{ count: number; total: number }> {
    // contributors endpoint may paginate; sample up to a few pages
    let page = 1;
    let total = 0;
    while (page <= 3) {
      const list = await this.request<unknown[]>(`/repos/${fullName}/contributors`, {
        per_page: "100",
        page: String(page),
      });
      total += list.length;
      if (list.length < 100) break;
      page++;
    }
    return { count: total, total };
  }

  async repoExists(fullName: string): Promise<boolean> {
    try {
      await this.request(`/repos/${fullName}`);
      return true;
    } catch (e) {
      if ((e as any).status === 404) return false;
      throw e;
    }
  }

  toCandidate(item: GitHubSearchItem): RepoCandidate {
    return {
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
    };
  }
}
