# Security

## Supported release

Security fixes are made against the current `1.x` release line. Upgrade to the latest patch before reporting behavior that may already be fixed.

## Report a vulnerability

Use [GitHub's private vulnerability reporting](https://github.com/actually-useful-ai/accessibility-devkit/security/advisories/new). Please do not open a public issue for a vulnerability that could put people or systems at risk.

Include:

- the affected package and version;
- the smallest reproduction you can share safely;
- expected and observed behavior;
- likely impact;
- any temporary mitigation you have confirmed.

Luke Steuber will acknowledge a complete report as soon as practical, validate the impact, and coordinate a fix and disclosure. No guarantee is made for a particular response window, but credible reports are treated as release blockers.

## Scope

The static scanner reads local files and writes reports. It does not fetch live URLs or execute page scripts. Live browser auditing is intentionally delegated to Deque's maintained axe CLI. The Python distribution has no runtime dependencies.

Accessibility findings are not security findings, and neither automated result establishes that an application is safe or accessible. Review untrusted files, CI permissions, package provenance, and generated reports according to your own threat model.
