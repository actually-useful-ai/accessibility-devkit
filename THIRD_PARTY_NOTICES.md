# Third-party notices

Accessibility Devkit is MIT-licensed. The browser packages also use the following direct runtime dependencies under their own licenses.

| Dependency                                                                              | Used by          | License | Purpose                                          |
| --------------------------------------------------------------------------------------- | ---------------- | ------- | ------------------------------------------------ |
| [`@bjornlu/colorblind`](https://github.com/bluwy/colorblind) 1.0.3                      | `accommodations` | MIT     | Color-vision-deficiency simulation               |
| [`axe-core`](https://github.com/dequelabs/axe-core) 4.12.x                              | `audit`          | MPL-2.0 | Browser accessibility rules engine               |
| [`eslint-plugin-jsx-a11y`](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y) 6.10.x | `audit`          | MIT     | Recommended JSX accessibility lint configuration |
| [`focus-trap`](https://github.com/focus-trap/focus-trap) 8.2.x                          | `components`     | MIT     | Focus containment for modal interaction patterns |

`@bjornlu/colorblind` is pinned to 1.0.3 because its last release predates this Devkit. Golden fixtures protect the public simulation behavior; no undocumented API is used. Simulation remains a design-review aid and is never treated as proof of individual perception or CVI access.

The Node CLI has no browser runtime. For live URLs, documentation points to `@axe-core/cli` rather than embedding Playwright or WebDriver.

Complete license texts for installed dependencies remain available in their distributed packages and upstream repositories. Run `pnpm licenses list --prod` in this workspace to inspect the resolved dependency graph.
