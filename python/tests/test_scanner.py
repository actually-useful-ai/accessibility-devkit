import json
import pathlib
import subprocess
import sys
import tempfile
import unittest

from accessibility_devkit.scanner import scan_source


ROOT = pathlib.Path(__file__).resolve().parents[2]
FIXTURE = ROOT / "spec" / "fixtures" / "static-mixed.html"


class ScannerTests(unittest.TestCase):
    def test_static_rules_and_false_positive_controls(self):
        report = scan_source(FIXTURE.read_text(), target="static-mixed.html")
        findings = {item["ruleId"] for item in report["findings"]}
        manual = {item["ruleId"] for item in report["manualChecks"]}

        self.assertTrue(
            {
                "document-language",
                "duplicate-id",
                "focus-positive-tabindex",
                "form-label",
                "heading-order",
                "image-alt-missing",
            }.issubset(findings)
        )
        self.assertTrue(
            {
                "color-only-communication",
                "contrast-rendered",
                "image-alt-empty-context",
                "landmark-structure",
                "target-size-spacing",
            }.issubset(manual)
        )
        self.assertNotIn("duplicate-banner", findings | manual)
        self.assertNotIn("unnamed-section", findings | manual)
        self.assertNotIn("timing-autoplay", findings | manual)

    def test_cvi_and_switch_profiles_remain_manual(self):
        report = scan_source(FIXTURE.read_text(), target="static-mixed.html", profile="all")
        manual = {item["ruleId"] for item in report["manualChecks"]}
        self.assertIn("cvi-individual-profile", manual)
        self.assertIn("cvi-visual-complexity", manual)
        self.assertIn("switch-control-verification", manual)
        self.assertIn("switch-timing-preferences", manual)

    def test_manual_checks_do_not_fail_cli(self):
        with tempfile.TemporaryDirectory() as directory:
            path = pathlib.Path(directory) / "manual-only.html"
            path.write_text('<html lang="en"><main><img src="dot.png" alt=""></main></html>')
            completed = subprocess.run(
                [
                    sys.executable,
                    "-m",
                    "accessibility_devkit",
                    "scan",
                    str(path),
                    "--profile",
                    "all",
                    "--format",
                    "json",
                ],
                check=False,
                capture_output=True,
                text=True,
            )
            report = json.loads(completed.stdout)
            self.assertEqual(completed.returncode, 0)
            self.assertEqual(report["producer"]["runtime"], "python")
            self.assertEqual(report["summary"]["findings"], 0)
            self.assertGreater(report["summary"]["manualChecks"], 0)


if __name__ == "__main__":
    unittest.main()
