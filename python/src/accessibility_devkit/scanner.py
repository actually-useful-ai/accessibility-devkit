"""Conservative dependency-free HTML source scanner."""

import json
import re

from .report import create_report, item


TAG_PATTERN = re.compile(r"<([a-zA-Z][\w:-]*)(\s[^<>]*?)?\s*/?>")
ATTR_PATTERN = re.compile(r"([^\s=/>]+)(?:\s*=\s*(?:\"([^\"]*)\"|'([^']*)'|([^\s>]+)))?")


def _attributes(raw):
    return {match.group(1).lower(): next((value for value in match.groups()[1:] if value is not None), "") for match in ATTR_PATTERN.finditer(raw)}


def _location(source, index, excerpt):
    line_start = source.rfind("\n", 0, index) + 1
    return {
        "line": source.count("\n", 0, index) + 1,
        "column": index - line_start + 1,
        "excerpt": re.sub(r"\s+", " ", excerpt).strip()[:160],
    }


def _tags(source):
    return [
        {
            "name": match.group(1).lower(),
            "attributes": _attributes(match.group(2) or ""),
            "index": match.start(),
            "location": _location(source, match.start(), match.group(0)),
        }
        for match in TAG_PATTERN.finditer(source)
    ]


def _manual_baseline():
    return [
        item(
            "color-only-communication",
            "Confirm that color is not the only way information, status, or required action is conveyed.",
            certainty="manual",
            severity="info",
            evidence="human",
            wcag=["1.4.1"],
            remediation="Pair color with text, shape, pattern, position, or another programmatically available cue.",
            verification="Review each state visually and with color or custom styles disabled.",
        ),
        item(
            "contrast-rendered",
            "Measure rendered foreground and background colors, including states, images, gradients, and transparency.",
            certainty="manual",
            severity="info",
            evidence="runtime",
            wcag=["1.4.3", "1.4.11"],
            remediation="Adjust rendered colors that do not meet the applicable text or non-text threshold.",
            verification="Measure computed colors in the browser and inspect every interactive state.",
        ),
        item(
            "landmark-structure",
            "Review the rendered landmark structure, including nesting, repeated landmark labels, and content outside landmarks.",
            certainty="manual",
            severity="info",
            evidence="runtime",
            wcag=["1.3.1", "2.4.1"],
            remediation="Use native landmark elements and label repeated landmarks of the same type when their purposes differ.",
            verification="Inspect the accessibility tree and navigate the page with a screen reader landmark list.",
        ),
    ]


def _profile_checks(profile):
    checks = []
    if profile in ("cvi", "all"):
        cvi = [
            (
                "cvi-individual-profile",
                "Review the experience against the person’s individual CVI profile and preferred presentation.",
                "Make presentation, contrast, spacing, field complexity, and pacing adjustable.",
                "Evaluate with the person or a qualified specialist; no universal palette or ratio establishes CVI access.",
            ),
            (
                "cvi-visual-complexity",
                "Review clutter, crowding, background complexity, and competing visual targets.",
                "Reduce simultaneous visual demands and allow isolation of the current task.",
                "Observe target recognition across realistic screens, not isolated components only.",
            ),
            (
                "cvi-fatigue-motion",
                "Review visual fatigue, latency, motion, and the time needed to find and interpret targets.",
                "Provide pauses, stable layouts, reduced motion, and enough processing time.",
                "Test over a representative session with the person’s preferred pacing.",
            ),
            (
                "cvi-multisensory-alternatives",
                "Confirm that important information has usable nonvisual or multisensory alternatives.",
                "Provide meaningful speech, sound, touch, or text alternatives chosen with the person.",
                "Complete key tasks using the person’s preferred combination of senses.",
            ),
        ]
        for rule_id, message, remediation, verification in cvi:
            checks.append(
                item(
                    rule_id,
                    message,
                    classification="supplemental",
                    certainty="manual",
                    severity="info",
                    evidence="human",
                    remediation=remediation,
                    verification=verification,
                )
            )
    if profile in ("switch", "all"):
        switch = [
            (
                "switch-control-verification",
                "Complete the primary flow with the operating system’s Switch Control.",
                [],
                "Use native semantics, predictable focus order, and visible focus; remove unreachable controls.",
                "Navigate, activate, dismiss, recover from errors, and complete the task using switch input only.",
            ),
            (
                "switch-timing-preferences",
                "Confirm scan speed, dwell, repeat filtering, and time limits can match the person’s needs.",
                [],
                "Expose timing choices and avoid a universal dwell or repeat interval.",
                "Test slow and fast settings with the person’s switch configuration.",
            ),
            (
                "switch-simple-action",
                "Confirm complex pointer gestures have a single-switch or simple-action alternative.",
                ["2.5.1", "2.5.7"],
                "Add controls for drag, path, multipoint, and pointer-only actions.",
                "Complete every pointer-driven action using focus and a single activation command.",
            ),
        ]
        for rule_id, message, wcag, remediation, verification in switch:
            checks.append(
                item(
                    rule_id,
                    message,
                    classification="supplemental",
                    certainty="manual",
                    severity="info",
                    evidence="human",
                    wcag=wcag,
                    remediation=remediation,
                    verification=verification,
                )
            )
    return checks


def scan_source(source, target, profile=None):
    tags = _tags(source)
    findings = []
    manual = _manual_baseline()
    html = next((tag for tag in tags if tag["name"] == "html"), None)
    if not html or not html["attributes"].get("lang", "").strip():
        findings.append(item("document-language", "The document does not declare a default language.", wcag=["3.1.1"], location=html["location"] if html else {"line": 1, "column": 1}, remediation="Add a valid lang attribute to the html element.", verification="Inspect the accessibility tree and confirm language changes are also marked."))

    ids = {}
    for tag in tags:
        identifier = tag["attributes"].get("id")
        if not identifier:
            continue
        if identifier in ids:
            quoted_identifier = json.dumps(identifier)
            findings.append(item("duplicate-id", f"The id {quoted_identifier} is used more than once.", wcag=["1.3.1", "4.1.2"], location=tag["location"], remediation="Give each relationship target a unique id and update its references.", verification=f"Confirm every reference to {quoted_identifier} resolves to one intended element."))
        else:
            ids[identifier] = tag

    for tag in (candidate for candidate in tags if candidate["name"] == "img"):
        attrs = tag["attributes"]
        if "alt" not in attrs:
            findings.append(item("image-alt-missing", "An image has no alt attribute.", wcag=["1.1.1"], location=tag["location"], remediation='Add contextual alternative text, or alt="" when the image is intentionally decorative.', verification="Review the image in context and confirm the accessible name communicates its purpose."))
        elif not attrs["alt"].strip():
            manual.append(item("image-alt-empty-context", "An image uses empty alternative text; that can be correct only when its content is redundant or decorative.", certainty="manual", severity="info", evidence="human", wcag=["1.1.1"], location=tag["location"], remediation='Keep alt="" for decorative images; otherwise provide concise contextual alternative text.', verification="Review adjacent content and the task with images unavailable."))

    label_fors = {tag["attributes"]["for"] for tag in tags if tag["name"] == "label" and tag["attributes"].get("for")}
    for tag in (candidate for candidate in tags if candidate["name"] in ("input", "select", "textarea")):
        attrs = tag["attributes"]
        if attrs.get("type", "text").lower() in ("hidden", "button", "submit", "reset", "image"):
            continue
        named = (attrs.get("id") in label_fors) or any(attrs.get(key, "").strip() for key in ("aria-label", "aria-labelledby", "title"))
        if not named:
            findings.append(item("form-label", "A form control has no source-visible label or accessible-name reference.", certainty="potential", wcag=["1.3.1", "3.3.2", "4.1.2"], location=tag["location"], remediation="Associate a visible label with the control and preserve its accessible name.", verification="Inspect the computed accessible name; account for labels created at runtime."))

    for tag in tags:
        tabindex = tag["attributes"].get("tabindex")
        try:
            positive = tabindex is not None and int(tabindex) > 0
        except ValueError:
            positive = False
        if positive:
            findings.append(item("focus-positive-tabindex", "A positive tabindex can create a focus order that diverges from reading order.", certainty="potential", severity="warning", wcag=["2.4.3"], location=tag["location"], remediation='Use DOM order and tabindex="0" or native focusability instead of a positive value.', verification="Traverse the complete flow with Tab, Shift+Tab, and Switch Control."))

    previous_heading = 0
    for tag in (candidate for candidate in tags if re.fullmatch(r"h[1-6]", candidate["name"])):
        level = int(tag["name"][1])
        if previous_heading and level > previous_heading + 1:
            findings.append(item("heading-order", f"Heading level jumps from h{previous_heading} to h{level}.", classification="advisory", certainty="potential", severity="warning", wcag=["1.3.1", "2.4.6"], location=tag["location"], remediation="Use heading levels that reflect the content hierarchy without skipping a parent level.", verification="Review the heading outline and confirm it matches the information structure."))
        previous_heading = level

    for match in re.finditer(r"<a\b[^>]*>([\s\S]*?)</a>", source, re.IGNORECASE):
        text = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", match.group(1))).strip()
        if not text or re.fullmatch(r"click here|read more|learn more|more", text, re.IGNORECASE):
            findings.append(item("link-purpose", "A link has empty or generic source-visible text.", certainty="potential", severity="warning", wcag=["2.4.4"], location=_location(source, match.start(), source[match.start():match.start() + 120]), remediation="Write link text that identifies the destination or action in context.", verification="Review the computed accessible name and a links-only list."))

    for match in re.finditer(r"<table\b[^>]*>([\s\S]*?)</table>", source, re.IGNORECASE):
        if not re.search(r"<th\b", match.group(1), re.IGNORECASE):
            manual.append(item("table-headers-context", "A table has no source-visible header cells; determine whether it presents data or is only layout.", certainty="manual", severity="info", evidence="human", wcag=["1.3.1"], location=_location(source, match.start(), match.group(0)[:120]), remediation="For data tables, add correctly scoped headers and a useful caption when needed.", verification="Navigate the table by row and column with a screen reader."))

    for tag in tags:
        attrs = tag["attributes"]
        interactive = tag["name"] in ("button", "input", "select", "textarea") or (tag["name"] == "a" and bool(attrs.get("href"))) or bool(re.fullmatch(r"button|link|checkbox|radio|switch|tab|menuitem", attrs.get("role", "")))
        if not interactive:
            continue
        style = attrs.get("style", "")
        width = re.search(r"(?:^|;)\s*width\s*:\s*([\d.]+)px", style, re.IGNORECASE)
        height = re.search(r"(?:^|;)\s*height\s*:\s*([\d.]+)px", style, re.IGNORECASE)
        if (width and float(width.group(1)) < 24) or (height and float(height.group(1)) < 24):
            manual.append(item("target-size-spacing", "A source dimension is below 24 CSS pixels; rendered size, spacing, and WCAG exceptions still require review.", certainty="manual", severity="info", evidence="runtime", wcag=["2.5.8"], location=tag["location"], remediation="Increase the rendered target or provide sufficient spacing or an applicable exception.", verification="Measure rendered boxes and spacing at representative viewport sizes and zoom levels."))

    for tag in tags:
        attrs = tag["attributes"]
        executable = (tag["name"] in ("audio", "video") and "autoplay" in attrs) or (tag["name"] == "meta" and attrs.get("http-equiv", "").lower() == "refresh")
        if executable:
            manual.append(item("timing-media-control", "Source markup configures automatic media or refresh behavior that needs runtime timing review.", certainty="manual", severity="info", evidence="runtime", wcag=["2.2.1", "2.2.2"], location=tag["location"], remediation="Provide pause, stop, hide, disable, or adjustment controls as applicable.", verification="Exercise the behavior in the browser and evaluate the complete timing policy."))

    manual.extend(_profile_checks(profile))
    return create_report("file", target, findings, manual)
