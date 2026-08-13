# OSMP runtime image — zero-runtime-dependency CLI
# Runs on native Node TypeScript support; no build step required.
FROM node:22-alpine

WORKDIR /app

# Copy source and docs (dev tooling is not needed at runtime)
COPY package.json ./
COPY src ./src
COPY assets ./assets
COPY docs ./docs
COPY README.md CHANGELOG.md LICENSE ./

# Runtime dirs for memory, workspaces, portfolio
RUN mkdir -p data/memory data/workspaces data/portfolio \
  && addgroup -S osmp && adduser -S osmp -G osmp \
  && chown -R osmp:osmp /app

USER osmp

ENV NODE_ENV=production

ENTRYPOINT ["node", "src/cli.ts"]
CMD ["pipeline"]
