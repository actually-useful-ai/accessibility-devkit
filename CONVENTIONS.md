# Accessibility Devkit Project Conventions

These conventions keep the Accessibility Devkit packages consistent and easy to maintain.

## 1. Naming Conventions

### 1.1. Repositories

- **Core Toolkit:** `accessibility-devkit`
- **Extensions:** `accessibility-devkit-<area>` (e.g., `accessibility-devkit-llm`, `accessibility-devkit-mobile`)

### 1.2. npm packages

Packages use the `@accessibility-devkit` scope.

- **Packages:** `@accessibility-devkit/<name>` (for example, `audit`, `components`, `accommodations`, `motor`, `cognitive`, `language`, `media`, and `motion`)

New disability-domain accommodations live as packages within this repository rather than as separate `accessibility-devkit-<area>` repositories. Name a domain package for the barrier it addresses (`motor`, `cognitive`, `language`, `media`, `motion`), and map each utility to the WCAG success criteria it serves.

## 2. Repository Structure

pnpm manages the monorepo.

```plaintext
accessibility-devkit/
├── CONVENTIONS.md         # This file
├── README.md              # High-level project overview
├── LICENSE                  # MIT License
├── package.json             # Root package.json for the workspace
├── .eslintrc.cjs            # Base ESLint config
├── .prettierrc.json         # Prettier config
├── tsconfig.base.json       # Base TypeScript config
├── packages/                # Directory for all individual NPM packages
│   ├── audit/               # Example: @accessibility-devkit/audit
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   └── README.md
│   └── components/          # Example: @accessibility-devkit/components
│       └── ...
├── examples/                # Reviewed usage examples
└── docs/                    # Conceptual documentation
    ├── 01-philosophy.md
    ├── 02-why-not-overlays.md
    └── 03-layered-approach.md
```

## 3. Coding Style & Tooling

- **Language:** Packages use TypeScript.
- **Style:** [Prettier](https://prettier.io/) formats source and test files from the root `.prettierrc.json`.
- **Linting:** [ESLint](https://eslint.org/) runs from `.eslintrc.cjs`.
- **Build:** `tsup` produces CommonJS, ECMAScript module, and TypeScript declaration output.
- **Tests:** Vitest runs package tests; jsdom supplies browser APIs where needed.

## 4. Documentation

- **Root `README.md`:** Explains installation, the plugin workflow, and the package map.
- **Package `README.md`:** Documents each package's purpose, API, and examples.
- **`docs/`:** Holds the project philosophy and architectural decisions.
- **Code examples:** Keep examples executable or pair them with an explicit verification procedure.

## 5. Commit Messages

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) so Changesets can produce useful release history.

- **`feat:`** A new feature
- **`fix:`** A bug fix
- **`docs:`** Documentation only changes
- **`style:`** Changes that do not affect the meaning of the code (white-space, formatting, etc)
- **`refactor:`** A code change that neither fixes a bug nor adds a feature
- **`perf:`** A code change that improves performance
- **`test:`** Adding missing tests or correcting existing tests
- **`chore:`** Changes to the build process or auxiliary tools and libraries

## 6. Versioning & Publishing

- **Tool:** [Changesets](https://github.com/changesets/changesets) manages package versions and release notes.
- **Process:** Run `pnpm changeset` for changes that require a package release. Commit the generated file with the implementation.
