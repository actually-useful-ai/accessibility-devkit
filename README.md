# accessibility

A Claude Code plugin for WCAG 2.2 AA accessibility auditing. Covers motor, cognitive, visual, and communication accessibility, grounded in real-world AAC (Augmentative and Alternative Communication) development.

## Install

```bash
claude plugin add actually-useful-ai/accessibility
```

## Usage

```bash
# Run accessibility review on a file or directory
/accessibility src/
/accessibility index.html

# Or invoke the agent directly
@conscience "Review this component for accessibility"
```

## What It Covers

- **Motor accessibility**: Touch targets (44x44px), keyboard navigation, switch access, eye gaze/head tracking, pointer cancellation, drag-and-drop alternatives, fatigue detection
- **Cognitive accessibility**: Consistent navigation, plain language, dyslexia-friendly typography, reduced motion, error prevention, chunking, memory support
- **Visual accessibility**: WCAG contrast ratios (4.5:1 text, 3:1 UI), color independence, CVI support, forced colors mode, 200% zoom, no images of text
- **Screen reader compatibility**: Semantic landmarks, heading hierarchy, proper form labels, live regions, ARIA usage
- **Communication / AAC**: Modified Fitzgerald Key color coding, spatial consistency for muscle memory, captions, text/touch alternatives to voice
- **WCAG 2.2 additions**: Focus not obscured (2.4.11), target size (2.5.8), dragging alternatives (2.5.7), consistent help (3.2.6), no redundant entry (3.3.7)

## Included Audit Scripts

10 standalone Python scripts. No dependencies -- stdlib only, no `pip install` needed. All accept HTML files as arguments and support `--format json` for CI integration.

| Script | Domain | What It Checks |
|--------|--------|---------------|
| `contrast-checker.py` | Visual | WCAG contrast ratio between two hex colors |
| `cvi-contrast-check.py` | CVI / Low vision | CVI-safe contrast (10:1+), photophobia, deuteranopia presets |
| `alt-text-audit.py` | Visual / SR | Missing, empty, or suspicious alt text on images |
| `heading-outline.py` | Cognitive / SR | Heading hierarchy -- skipped levels, missing h1, empty headings |
| `landmark-audit.py` | SR | ARIA landmark structure -- missing main, unlabeled duplicates |
| `link-text-audit.py` | SR / Cognitive | Vague link text ("click here"), empty links, image-only links |
| `focus-order-check.py` | Motor / Keyboard | Positive tabindex, non-focusable interactive elements, aria-hidden conflicts |
| `target-size-check.py` | Motor | Undersized touch targets (WCAG 2.5.8: 24px AA, 44px AAA) |
| `color-only-check.py` | Color blindness | Patterns where color is the sole information carrier |
| `timing-audit.py` | Motor / Cognitive | setTimeout, autoplay, animations without reduced-motion support |

### Script Usage

```bash
# Check contrast between two colors
python3 scripts/contrast-checker.py "#333333" "#f5f5f5"

# Check CVI-safe presets
python3 scripts/cvi-contrast-check.py --preset cvi

# Audit alt text
python3 scripts/alt-text-audit.py index.html

# Check heading outline
python3 scripts/heading-outline.py index.html

# Audit ARIA landmarks
python3 scripts/landmark-audit.py index.html

# Check link text quality
python3 scripts/link-text-audit.py index.html

# Check focus order
python3 scripts/focus-order-check.py --show-all index.html

# Check touch target sizes (44px threshold)
python3 scripts/target-size-check.py --threshold 44 index.html

# Check for color-only information
python3 scripts/color-only-check.py index.html

# Audit timing and animations
python3 scripts/timing-audit.py index.html app.js styles.css

# Run all HTML audits at once
for script in scripts/*-audit.py scripts/*-check.py; do
  python3 "$script" index.html
done

# JSON output for CI pipelines
python3 scripts/alt-text-audit.py --format json index.html | jq '.issues'
```

## Author

Luke Steuber — [lukesteuber.com](https://lukesteuber.com)

## License

MIT
