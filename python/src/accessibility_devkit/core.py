"""Dependency-free deterministic checks shared by the Python CLI."""

import math
import re


CONTRAST_THRESHOLDS = {
    "AA": {"normal": 4.5, "large": 3.0},
    "AAA": {"normal": 7.0, "large": 4.5},
}
GENERAL_FLASH_FREQUENCY_LIMIT_HZ = 3.0


def hex_to_rgb(color):
    if not isinstance(color, str) or not re.fullmatch(r"#?(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})", color):
        raise ValueError(f"Expected a three- or six-digit hex color; received {color!r}")
    compact = color.removeprefix("#")
    if len(compact) == 3:
        compact = "".join(character * 2 for character in compact)
    return tuple(int(compact[offset : offset + 2], 16) for offset in (0, 2, 4))


def _linearize(channel):
    value = channel / 255
    return value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4


def relative_luminance(color):
    red, green, blue = (_linearize(channel) for channel in hex_to_rgb(color))
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue


def get_contrast_ratio(foreground, background):
    first = relative_luminance(foreground)
    second = relative_luminance(background)
    lighter, darker = max(first, second), min(first, second)
    return (lighter + 0.05) / (darker + 0.05)


def meets_contrast_threshold(foreground, background, level="AA", text_size="normal"):
    try:
        threshold = CONTRAST_THRESHOLDS[level][text_size]
    except KeyError as error:
        raise ValueError("level must be AA or AAA and text size must be normal or large") from error
    return get_contrast_ratio(foreground, background) >= threshold


def find_nearest_passing_color(foreground, background, level="AA", text_size="normal"):
    if meets_contrast_threshold(foreground, background, level, text_size):
        red, green, blue = hex_to_rgb(foreground)
        hex_to_rgb(background)
        return f"#{red:02x}{green:02x}{blue:02x}"
    red, green, blue = hex_to_rgb(foreground)
    hex_to_rgb(background)
    for distance in range(2, 512, 2):
        for direction in (-1, 1):
            channels = [max(0, min(255, value + direction * distance)) for value in (red, green, blue)]
            candidate = "#" + "".join(f"{value:02x}" for value in channels)
            if meets_contrast_threshold(candidate, background, level, text_size):
                return candidate
    return "#000000" if relative_luminance(background) > 0.179 else "#ffffff"


def count_english_syllables(word):
    normalized = re.sub(r"[^a-z]", "", word.lower())
    if not normalized:
        return 0
    if len(normalized) <= 3:
        return 1
    trimmed = re.sub(r"(?:[^laeiouy]es|[^laeiouy]ed|[^laeiouy]e)$", "", normalized)
    trimmed = re.sub(r"^y", "", trimmed)
    groups = re.findall(r"[aeiouy]{1,2}", trimmed)
    return len(groups) or 1


def _round_two(value):
    return math.floor(value * 100 + 0.5) / 100


def analyze_readable_text(text):
    words = re.findall(r"[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*", text)
    sentence_parts = [part.strip() for part in re.split(r"[.!?]+(?:\s|$)", text) if part.strip()]
    sentence_count = max(len(sentence_parts), 1 if text.strip() else 0)
    word_count = len(words)
    base = {"language": "en", "method": "english-heuristic", "sentences": sentence_count, "words": word_count}
    if not word_count or not sentence_count:
        return {
            **base,
            "syllables": 0,
            "fleschReadingEase": 0,
            "fleschKincaidGrade": 0,
            "automatedReadabilityIndex": 0,
        }
    syllables = sum(count_english_syllables(word) for word in words)
    letters = len(re.findall(r"[A-Za-z0-9]", text))
    words_per_sentence = word_count / sentence_count
    syllables_per_word = syllables / word_count
    letters_per_word = letters / word_count
    return {
        **base,
        "syllables": syllables,
        "fleschReadingEase": _round_two(206.835 - 1.015 * words_per_sentence - 84.6 * syllables_per_word),
        "fleschKincaidGrade": _round_two(0.39 * words_per_sentence + 11.8 * syllables_per_word - 15.59),
        "automatedReadabilityIndex": _round_two(4.71 * letters_per_word + 0.5 * words_per_sentence - 21.43),
    }


def exceeds_flash_frequency_limit(flashes_per_second):
    if not isinstance(flashes_per_second, (int, float)) or not math.isfinite(flashes_per_second) or flashes_per_second < 0:
        raise ValueError("Flash frequency must be a finite, non-negative number.")
    return flashes_per_second > GENERAL_FLASH_FREQUENCY_LIMIT_HZ


def _validate_optional_non_negative(value, label):
    if value is not None and (not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0):
        raise ValueError(f"{label} must be a finite, non-negative number.")


def assess_time_limit(policy):
    _validate_optional_non_negative(policy.get("adjustmentMultiplier"), "adjustmentMultiplier")
    _validate_optional_non_negative(policy.get("warningDurationMs"), "warningDurationMs")
    _validate_optional_non_negative(policy.get("extensionCount"), "extensionCount")
    if policy.get("essential") or policy.get("realTime"):
        return {"status": "manual", "satisfiedBy": None, "reason": "Essential and real-time exceptions require contextual human review."}
    if policy.get("canDisable"):
        return {"status": "passes", "satisfiedBy": "disabled", "reason": "The time limit can be disabled."}
    if policy.get("adjustmentMultiplier", 0) >= 10:
        return {"status": "passes", "satisfiedBy": "adjustment", "reason": "The time limit can be adjusted to at least ten times its default duration."}
    if policy.get("warningDurationMs", 0) >= 20_000 and policy.get("extensionCount", 0) >= 10:
        return {"status": "passes", "satisfiedBy": "extensions", "reason": "The warning provides at least 20 seconds and at least ten extensions."}
    return {"status": "fails", "satisfiedBy": None, "reason": "No deterministic Timing Adjustable alternative was established by this policy."}
