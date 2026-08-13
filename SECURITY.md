# Security Policy

OSMP automates security analysis of third-party open-source repositories, so we take
security seriously — both in the code we ship and in the code we touch.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |
| < latest | :x:               |

We recommend always running the latest release. OSMP follows SemVer; security fixes ship as
patch releases.

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Instead, report privately using GitHub's **Security Advisories** ("Report a vulnerability"
button on the repository's *Security* tab) or by emailing the maintainers directly.

When reporting, please include:

- A description of the vulnerability and its impact
- The OSMP version affected
- Steps to reproduce (or a proof-of-concept)
- Any suggested remediation (optional)

You should receive an acknowledgement within **48 hours**, and we aim to ship a fix within a
reasonable timeline depending on severity. We will coordinate disclosure with you.

## Security Guarantees

- **Never auto-generate licenses.** OSMP will flag a missing license for human decision; it will
  never choose or invent a license for an upstream project.
- **Dry-run by default.** Live writes to GitHub (fork, clone, push, PR) require explicitly
  setting `DRY_RUN=false`.
- **Secret hygiene.** OSMP's own code never logs tokens; project workspaces keep `.env` out of
  git. Detected secrets in audited repositories are surfaced in quality reports.
- **Secrets in `.env`** are your responsibility — keep them out of version control and rotate
  them if ever leaked.

## Auditing OSMP itself

Every run of the pipeline is a good excuse to scan OSMP too:

```bash
npm audit
npx eslint src tests
npm run verify
```
