import unittest

from accessibility_devkit.core import (
    analyze_readable_text,
    assess_time_limit,
    exceeds_flash_frequency_limit,
    get_contrast_ratio,
    meets_contrast_threshold,
)


class CoreTests(unittest.TestCase):
    def test_contrast_and_invalid_colors(self):
        self.assertAlmostEqual(get_contrast_ratio("#fff", "#000000"), 21, places=10)
        self.assertTrue(meets_contrast_threshold("#777", "#fff", "AA", "large"))
        with self.assertRaisesRegex(ValueError, "hex color"):
            get_contrast_ratio("red", "#fff")

    def test_readability_is_explicitly_english_specific(self):
        result = analyze_readable_text("We can help. Ask us any time.")
        self.assertEqual(result["language"], "en")
        self.assertEqual(result["method"], "english-heuristic")

    def test_flash_frequency_boundary(self):
        self.assertFalse(exceeds_flash_frequency_limit(3))
        self.assertTrue(exceeds_flash_frequency_limit(3.01))

    def test_timing_boundaries(self):
        self.assertEqual(assess_time_limit({"adjustmentMultiplier": 9.999})["status"], "fails")
        self.assertEqual(assess_time_limit({"adjustmentMultiplier": 10})["status"], "passes")
        self.assertEqual(
            assess_time_limit({"warningDurationMs": 19_999, "extensionCount": 10})["status"],
            "fails",
        )
        self.assertEqual(
            assess_time_limit({"warningDurationMs": 20_000, "extensionCount": 9})["status"],
            "fails",
        )
        self.assertEqual(
            assess_time_limit({"warningDurationMs": 20_000, "extensionCount": 10})["status"],
            "passes",
        )


if __name__ == "__main__":
    unittest.main()
