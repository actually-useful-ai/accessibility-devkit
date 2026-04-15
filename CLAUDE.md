# accessibility

Claude Code plugin for WCAG 2.2 AA accessibility auditing.

## What This Does

One command: `/accessibility [path]`

- Pass a file or directory path to run accessibility analysis
- Covers motor, cognitive, visual, and communication accessibility
- Includes 10 standalone Python audit scripts (stdlib only, no pip install needed)
- Grounded in real-world AAC (Augmentative and Alternative Communication) development

## Structure

```
.claude-plugin/          Plugin metadata
agents/
  conscience.md          Accessibility agent (color: green)
skills/accessibility/
  SKILL.md               Full accessibility skill (349 lines)
commands/
  accessibility.md       /accessibility command entry point
scripts/                 10 Python audit scripts
```

## Audit Scripts

All scripts use Python stdlib only. No dependencies to install.

| Script | What It Checks |
|--------|---------------|
| `alt-text-audit.py` | Missing, empty, or suspicious alt text |
| `contrast-checker.py` | WCAG contrast ratio between two hex colors |
| `cvi-contrast-check.py` | CVI-safe contrast (10:1+), photophobia, deuteranopia |
| `color-only-check.py` | Color as sole information carrier |
| `focus-order-check.py` | Tabindex issues, non-focusable interactive elements |
| `heading-outline.py` | Heading hierarchy, skipped levels, missing h1 |
| `landmark-audit.py` | ARIA landmarks, missing main, unlabeled duplicates |
| `link-text-audit.py` | Vague link text, empty links, image-only links |
| `target-size-check.py` | Undersized touch targets (24px AA, 44px AAA) |
| `timing-audit.py` | Autoplay, animations without reduced-motion support |

Run individual scripts directly:
```bash
python3 scripts/contrast-checker.py "#333333" "#f5f5f5"
python3 scripts/alt-text-audit.py index.html
python3 scripts/heading-outline.py --format json page.html
```
