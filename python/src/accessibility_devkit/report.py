"""The versioned runtime-neutral report envelope."""

SCHEMA_VERSION = "1.0.0"
RUNTIME_VERSION = "1.1.0"


def item(rule_id, message, **overrides):
    value = {
        "ruleId": rule_id,
        "classification": "normative",
        "certainty": "detected",
        "severity": "error",
        "evidence": "source",
        "message": message,
        "wcag": [],
        "location": None,
        "remediation": "Review and correct the reported accessibility concern.",
        "verification": "Repeat the check and complete the relevant human or browser verification.",
    }
    value.update(overrides)
    return value


def summarize(findings, manual_checks):
    return {
        "errors": sum(finding["severity"] == "error" for finding in findings),
        "warnings": sum(finding["severity"] == "warning" for finding in findings),
        "info": sum(finding["severity"] == "info" for finding in findings),
        "findings": len(findings),
        "manualChecks": len(manual_checks),
    }


def create_report(kind, target, findings, manual_checks=None, runtime="python"):
    manual_checks = manual_checks or []
    return {
        "schemaVersion": SCHEMA_VERSION,
        "producer": {"name": "accessibility-devkit", "version": RUNTIME_VERSION, "runtime": runtime},
        "target": {"kind": kind, "value": target},
        "summary": summarize(findings, manual_checks),
        "findings": findings,
        "manualChecks": manual_checks,
    }
