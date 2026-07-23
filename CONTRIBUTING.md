# Contributing to Accessibility Devkit

Thanks for contributing. This project builds code-level accessibility tools and welcomes fixes, tests, documentation, and new patterns.

## How to Contribute

1. **Fork the repository** and create your branch from `master`.
2. **Install dependencies** with `pnpm install`.
3. **Make your changes.** Add tests for new behavior and bug fixes. Keep Node and Python contract behavior aligned when a portable rule changes.
4. **Run the checks** with `pnpm test`, `pnpm lint`, `pnpm format:check`, and `pnpm test:pack`.
5. **Submit a pull request** with a clear description of the change.

## Commit Messages

Please follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification for all commit messages. See `CONVENTIONS.md` for details.

## Evidence and rule changes

Automated rules need a source or computed signal strong enough to support the result. Put uncertain cases in `manualChecks` with a focused verification step. Do not add a synthetic accessibility score, a universal CVI threshold, or a timing default presented as suitable for everyone.

Contract changes need matching Node and Python tests, a JSON Schema update, and an updated golden fixture. Public API changes need a migration note.

## Code of Conduct

Please be respectful and constructive in all interactions. Accessibility is for everyone, and so is this project.
