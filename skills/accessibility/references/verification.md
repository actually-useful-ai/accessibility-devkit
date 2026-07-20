# Accessibility Verification Matrix

Use this matrix to state what was checked, what evidence was observed, and what remains unverified. WCAG 2.2 is a W3C Recommendation; its success criteria are technology-neutral and are intended to be evaluated with automated testing and human evaluation. See [Evaluating Web Accessibility](https://www.w3.org/WAI/test-evaluate/) and [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

| Evidence          | Check                                                                                                                              | Typical coverage                                                                | Limitation                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Source inspection | Read HTML, CSS, and behavior code for native semantics, labels, state synchronization, focus movement, hidden content, and motion. | Underlying implementation and likely defects.                                   | Does not prove browser, assistive-technology, or task-flow behavior.                 |
| Automated scan    | Run available linters and browser rules against representative states and pages.                                                   | Repeatable detectable patterns such as missing labels or invalid relationships. | Cannot establish WCAG conformance or usability.                                      |
| Keyboard          | Use Tab, Shift+Tab, Enter, Space, Escape, arrow keys, and required shortcuts through the full task.                                | Reachability, visible focus, order, traps, dialogs, menus, and activation.      | Does not expose all screen-reader or visual barriers.                                |
| Screen reader     | Test the relevant browser and assistive-technology combination, including changes of state and dynamic messages.                   | Names, roles, values, landmarks, reading order, focus, and announcements.       | Browser and assistive-technology combinations differ; document the combination used. |
| Zoom and reflow   | Check 200% zoom, narrow viewports, text spacing, orientation, and high-contrast or forced-color settings when available.           | Readability, clipping, overlap, responsive order, and non-color cues.           | Does not assess all task or language needs.                                          |
| User testing      | Include disabled people who use relevant input methods and assistive technology in realistic tasks.                                | Actual task success, workarounds, fatigue, comprehension, and recovery.         | A small sample informs but does not represent every person or context.               |

## Minimum verification plan

1. Name the page, component, state, and complete task path.
2. Run source inspection and available automated scans; retain their output as limited evidence.
3. Perform keyboard checks for every interactive state and record focus movement.
4. Test affected flows with the relevant screen reader and browser combination.
5. Test zoom and reflow before calling a visual layout complete.
6. Plan or record user testing when the flow has material complexity, high consequence, or a population-specific interaction risk.

## Reporting template

| Field                     | Record                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------- |
| Finding                   | Observed barrier and its underlying cause.                                                              |
| Affected people and modes | For example keyboard-only, screen-reader, low-vision, switch, voice, touch, or cognitive support needs. |
| Evidence                  | Source inspection, automated scan, keyboard, screen reader, zoom and reflow, or user testing.           |
| Standard status           | WCAG 2.2 success criterion when applicable; otherwise advisory or supplemental.                         |
| Remediation               | Smallest practical change that removes the cause.                                                       |
| Verification              | Exact check, task, environment, and result still needed.                                                |

Passing a single row is not a conformance claim. Report the evidence and gaps plainly.
