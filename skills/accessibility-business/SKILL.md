---
name: accessibility-business
description: Use when building or reviewing business, enterprise, or SaaS applications for accessibility — long forms, data tables, authentication and SSO, session timeouts, error recovery, plain-language content, and procurement or conformance evidence.
---

# Business & Enterprise Accessibility

A specialist lens over the core `accessibility` skill for business software: internal tools, SaaS products, dashboards, and anything built around forms, data, and accounts. The baseline review order still applies; this skill weights the criteria that decide whether people can actually complete work, and gathers the evidence procurement and legal teams ask for.

Start from the core review, then apply the priorities below.

## Where the risk concentrates

1. **Forms and data entry.** Long, multi-step forms and dense tables are where people lose work, re-enter information, and hit unrecoverable errors.
2. **Time and sessions.** Enterprise apps time out. Without warning and a way to extend, people lose in-progress work.
3. **Authentication.** SSO, one-time codes, and password fields that block paste create cognitive-function barriers.
4. **Conformance evidence.** Buyers and legal teams expect a defensible WCAG 2.2 AA record across the product, not one green scan.

## Review lens

- **Never re-ask for what was given.** Information a person already entered in a process is remembered or auto-filled (WCAG 3.3.7), and passwords are never persisted.
- **Warn before timeout, and let people extend.** Session limits have a warning and an extension path (2.2.1 / 2.2.6); data survives a timeout where feasible.
- **Authentication without a memory test.** Paste works in credential and code fields, `autocomplete` is set, and no step demands transcription or a puzzle with no alternative (3.3.8).
- **Reversible, recoverable actions.** Consequential actions (delete, submit, pay) are reviewable and reversible, with clear, specific error recovery (3.3.4 / 3.3.6).
- **Plain language.** Instructions, errors, and policy text read at a reasonable level; jargon and abbreviations are expanded.
- **Consistent conformance.** The same patterns pass across the app, and the evidence is recorded per the verification matrix.

## Packages to reach for

| Need                                    | Package                                | Key utilities                                                                                                         |
| --------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Timeouts, redundant entry, auth, undo   | `@accessibility-devkit/cognitive`      | `createSessionTimeout`, `createFieldMemory`, `allowPaste`, `auditAuthentication`, `createUndoController`              |
| Forms, dialogs, menus, dense navigation | `@accessibility-devkit/components`     | `FocusTrap`, `AccessibleDialog`, `AccessibleMenu`, `createRovingTabindex`, `createSkipLink`, `announceToScreenReader` |
| Plain-language content and errors       | `@accessibility-devkit/language`       | `readingLevel`, `findLongSentences`, `annotateAbbreviations`                                                          |
| Conformance scanning and CI gates       | `@accessibility-devkit/audit`          | `runAudit`, `formatReport`, `eslintConfig`                                                                            |
| Status color and data-viz contrast      | `@accessibility-devkit/accommodations` | `meetsWCAG`, `findAccessibleColor`, `simulateColorBlindness`                                                          |

## Domain patterns

- Multi-step forms that save progress, restore entered values, and validate with specific, recoverable errors.
- Data tables with real headers, keyboard operation, and a non-color encoding for every status.
- A session-timeout dialog that announces itself, warns in advance, and offers "stay signed in".
- Bulk actions guarded by confirmation and backed by undo.
- Captioned, transcribed training and onboarding video.
- A conformance record produced from `runAudit` output plus the manual verification matrix, kept current for procurement.

## Guardrails

- Do not block paste on password, email, or one-time-code fields.
- Do not expire a session silently, and do not discard entered data on timeout without a recovery path.
- Do not encode status in color alone in tables, charts, or badges.
- Do not claim conformance from a scan; attach the manual evidence.

## Routing

Keep semantic, keyboard, and assistive-technology work in the core `accessibility` skill. Route workflow efficiency, task-path friction, and decision burden in dense tools to `intentional-ux`. Keep the accessibility evidence attached when an issue affects both.
