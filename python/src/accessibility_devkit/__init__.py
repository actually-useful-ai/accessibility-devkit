"""Accessibility Devkit portable checks."""

from .core import (
    analyze_readable_text,
    assess_time_limit,
    exceeds_flash_frequency_limit,
    find_nearest_passing_color,
    get_contrast_ratio,
    meets_contrast_threshold,
)
from .scanner import scan_source

__all__ = [
    "analyze_readable_text",
    "assess_time_limit",
    "exceeds_flash_frequency_limit",
    "find_nearest_passing_color",
    "get_contrast_ratio",
    "meets_contrast_threshold",
    "scan_source",
]

__version__ = "1.1.0"
