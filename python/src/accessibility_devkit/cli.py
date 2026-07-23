"""Command-line interface matching @accessibility-devkit/cli."""

import json
import pathlib
import sys

from .core import analyze_readable_text, assess_time_limit, get_contrast_ratio, meets_contrast_threshold
from .report import create_report, item
from .scanner import scan_source


def _parse(args):
    options = {"format": "text", "fail_on": "error", "profile": None, "level": "AA", "text_size": "normal"}
    positionals = []
    index = 0
    mapping = {"--format": "format", "--fail-on": "fail_on", "--profile": "profile", "--level": "level", "--text-size": "text_size"}
    allowed = {"format": ("text", "json"), "fail_on": ("error", "warning", "never"), "profile": ("cvi", "switch", "all"), "level": ("AA", "AAA"), "text_size": ("normal", "large")}
    while index < len(args):
        value = args[index]
        if value.startswith("--"):
            if value not in mapping or index + 1 >= len(args):
                raise ValueError(f"Unknown or incomplete option: {value}")
            key, option = mapping[value], args[index + 1]
            if option not in allowed[key]:
                raise ValueError(f"Invalid value for {value}: {option}")
            options[key] = option
            index += 2
        else:
            positionals.append(value)
            index += 1
    return positionals, options


def _text(report):
    lines = [f"Accessibility Devkit — {report['target']['value']}", f"{report['summary']['findings']} finding(s), {report['summary']['manualChecks']} manual check(s)"]
    lines.extend(f"[{finding['severity'].upper()}] {finding['ruleId']}: {finding['message']}" for finding in report["findings"])
    if report["manualChecks"]:
        lines.append("Manual verification still required:")
        lines.extend(f"- {check['ruleId']}: {check['message']}" for check in report["manualChecks"])
    return "\n".join(lines) + "\n"


def _fails(findings, threshold):
    if threshold == "never":
        return False
    severities = ("error", "warning") if threshold == "warning" else ("error",)
    return any(finding["severity"] in severities for finding in findings)


def _scan(positionals, options):
    if not positionals:
        raise ValueError("scan requires at least one file.")
    if any(path.startswith(("http://", "https://")) for path in positionals):
        raise ValueError("Live URLs use the maintained browser runner: npx @axe-core/cli <url>")
    reports = [scan_source(pathlib.Path(path).read_text(), target=path, profile=options["profile"]) for path in positionals]
    if len(reports) == 1:
        return reports[0]
    findings = [finding for report in reports for finding in report["findings"]]
    manual = []
    seen = set()
    for report in reports:
        for check in report["manualChecks"]:
            key = (check["ruleId"], json.dumps(check.get("location"), sort_keys=True))
            if key not in seen:
                seen.add(key)
                manual.append(check)
    return create_report("file", ", ".join(positionals), findings, manual)


def _contrast(positionals, options):
    if len(positionals) != 2:
        raise ValueError("contrast requires a foreground and background hex color.")
    foreground, background = positionals
    ratio = get_contrast_ratio(foreground, background)
    findings = []
    if not meets_contrast_threshold(foreground, background, options["level"], options["text_size"]):
        findings.append(item("contrast-text", f"Contrast is {ratio:.2f}:1 and does not meet {options['level']} for {options['text_size']} text.", evidence="computed", wcag=["1.4.3", "1.4.6"], remediation="Change the foreground or background until the applicable contrast threshold is met.", verification="Measure the final computed colors in every rendered state."))
    return create_report("colors", f"{foreground} on {background}", findings)


def _readability(positionals, stdin):
    if len(positionals) != 1:
        raise ValueError("readability requires one file path or -.")
    path = positionals[0]
    text = stdin if path == "-" else pathlib.Path(path).read_text()
    analysis = analyze_readable_text(text)
    findings = []
    if analysis["fleschKincaidGrade"] > 9:
        findings.append(item("readability-english", f"The English-specific estimate is grade {analysis['fleschKincaidGrade']}.", classification="advisory", certainty="potential", severity="warning", evidence="computed", wcag=["3.1.5"], remediation="Shorten sentences, explain specialist terms, and test the revised content with readers.", verification="Treat the score as a writing clue; test comprehension with the intended audience."))
    manual = [item("readability-comprehension", f"English heuristic: {analysis['words']} words, grade {analysis['fleschKincaidGrade']}, reading ease {analysis['fleschReadingEase']}.", classification="advisory", certainty="manual", severity="info", evidence="human", remediation="Revise for the audience’s vocabulary, context, and task, not a target score alone.", verification="Test understanding and task completion with representative readers.")]
    return create_report("stdin" if path == "-" else "text", path, findings, manual)


def _timing(positionals):
    if len(positionals) != 1:
        raise ValueError("timing requires one policy JSON file.")
    path = positionals[0]
    assessment = assess_time_limit(json.loads(pathlib.Path(path).read_text()))
    shared = dict(wcag=["2.2.1"], remediation="Allow disabling, at least ten-times adjustment, or a 20-second warning with at least ten extensions.", verification="Exercise the complete time-limit policy and any claimed exception in context.")
    findings = [item("timing-adjustable", assessment["reason"], evidence="computed", **shared)] if assessment["status"] == "fails" else []
    manual = [item("timing-adjustable", assessment["reason"], certainty="manual", severity="info", evidence="human", **shared)] if assessment["status"] == "manual" else []
    return create_report("policy", path, findings, manual)


def execute(args, stdin=""):
    try:
        if not args:
            raise ValueError("A command is required: scan, contrast, readability, or timing.")
        command, rest = args[0], args[1:]
        positionals, options = _parse(rest)
        if command == "scan":
            report = _scan(positionals, options)
        elif command == "contrast":
            report = _contrast(positionals, options)
        elif command == "readability":
            report = _readability(positionals, stdin)
        elif command == "timing":
            report = _timing(positionals)
        else:
            raise ValueError(f"Unknown command: {command}")
        output = json.dumps(report, indent=2, ensure_ascii=False) + "\n" if options["format"] == "json" else _text(report)
        return (1 if _fails(report["findings"], options["fail_on"]) else 0, output, "")
    except (OSError, ValueError, TypeError, json.JSONDecodeError) as error:
        return (2, "", f"{error}\n")


def main():
    stdin = "" if sys.stdin.isatty() else sys.stdin.read()
    code, stdout, stderr = execute(sys.argv[1:], stdin)
    if stdout:
        sys.stdout.write(stdout)
    if stderr:
        sys.stderr.write(stderr)
    raise SystemExit(code)
