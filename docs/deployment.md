# Deployment

OSMP itself is a zero-dependency Node.js CLI application. Deployment is straightforward:
provision a machine with Node.js, install, configure, and schedule runs.

## Manual deployment

```bash
# 1. Install
git clone https://github.com/Nortaq-PlayNexus/osmp.git /opt/osmp
cd /opt/osmp
npm ci --omit=dev   # dev tooling not needed at runtime

# 2. Configure
cp .env.example .env
# set GITHUB_TOKEN, GITHUB_OWNER, DRY_RUN=false for live operation

# 3. Run
node src/cli.ts pipeline
```

## Docker

A `Dockerfile` and `docker-compose.yml` are included.

```bash
# Build and run in a container
docker build -t osmp .
docker run --env-file .env --rm -v "$PWD/data:/app/data" osmp pipeline
```

Or with Compose:

```bash
docker compose up --build
```

See the [Dockerfile](../Dockerfile) and [docker-compose.yml](../docker-compose.yml) for details.

## Scheduling

Run discovery on a schedule with a cron entry (or your platform equivalent):

```cron
# every Sunday at 03:00
0 3 * * 0 cd /opt/osmp && /usr/bin/node src/cli.ts pipeline >> /var/log/osmp.log 2>&1
```

## Operations guidance

- Mount `data/` to persistent storage — it holds project memory and workspaces.
- Keep `GITHUB_TOKEN` in a secret store (env file, CI secret, or vault).
- Monitor logs for rate-limit warnings and phase failures.
- Back up `data/memory/` — it is the durable record of every modernization.

## Target platforms

OSMP is platform-agnostic. The same CLI runs on Linux, macOS, and Windows. Containerized
deployment works on AWS ECS/EKS, Azure Container Apps, Google Cloud Run, and Kubernetes.
