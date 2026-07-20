# Why Not Overlays?

Accessibility overlay widgets are third-party tools that inject a toolbar or widget onto a website, offering users controls for things like font size, contrast, and cursor size. While they appear to offer a quick fix, the accessibility community has reached a strong consensus that they are not a substitute for proper, code-level accessibility work.

## The Problem with Overlays

Overlays attempt to fix accessibility issues at the presentation layer, after the page has already been rendered. This approach has several fundamental limitations.

**They cannot fix structural issues.** If a page lacks proper heading hierarchy, semantic HTML, or meaningful link text, an overlay cannot retroactively add these. Screen readers rely on the underlying DOM structure, not visual presentation, to convey meaning to users.

**They can interfere with assistive technology.** Users who rely on screen readers, switch devices, or voice control software have already configured their own tools to work the way they need. An overlay that modifies the page's behavior can conflict with these settings, making the experience worse, not better.

**They create a false sense of compliance.** Overlays are often marketed as a way to achieve WCAG compliance. In practice, they cannot guarantee compliance because they cannot address the full range of WCAG success criteria, many of which require changes to the underlying code and content.

**They add performance overhead.** Overlays inject additional JavaScript into the page, which can slow down load times and introduce new bugs, particularly on mobile devices.

## The Alternative: A Layered Approach

The `accessibility-devkit` advocates for a layered approach that addresses accessibility at every stage of the development lifecycle.

| Layer                     | What It Does                                             | Tools                                                                                           |
| ------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Testing & Auditing**    | Catches violations during development and in CI/CD.      | `@accessibility-devkit/audit` (axe-core, eslint-plugin-jsx-a11y)                                |
| **Components & Patterns** | Provides structurally sound, accessible building blocks. | `@accessibility-devkit/components` (focus-trap, skip-nav, live-region)                          |
| **Accommodations**        | Respects user preferences for specific needs.            | `@accessibility-devkit/accommodations` (color-blind simulation, reduced-motion, dyslexia fonts) |

This approach ensures that accessibility is built into the foundation of the application, rather than being painted on top.

## Further Reading

The [2025 Web Almanac Accessibility Chapter](https://almanac.httparchive.org/en/2025/accessibility) provides an excellent, data-driven overview of the current state of web accessibility, including a discussion of the overlay debate.
