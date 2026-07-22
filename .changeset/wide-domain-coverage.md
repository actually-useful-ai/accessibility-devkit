---
'@accessibility-devkit/accommodations': minor
'@accessibility-devkit/components': patch
---

accommodations: add dyslexia-friendly typography and WCAG 1.4.12 text-spacing helpers (`applyDyslexiaFriendlyFont`, `applyTextSpacing`, `meetsTextSpacing`), closing the docs-vs-code gap in the layered-approach guide.

components: fix an `AccessibleDialog` listener leak — a new `destroy()` method removes the document `keydown` listener and deactivates the focus trap, matching the cleanup contract already offered by `AccessibleMenu`.

Also introduces five new disability-domain packages at their initial release: `@accessibility-devkit/motor`, `cognitive`, `language`, `media`, and `motion`.
