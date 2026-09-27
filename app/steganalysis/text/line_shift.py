"""
Line-Shift Steganalysis Module
==============================
Detects line-shift and vertical line spacing anomalies in text documents.
Explicitly distinguishes between logical line spacing in plain text and physical
vertical baseline shifts in layout-preserving document formats.
"""

from typing import Dict, Any, List
import re
import numpy as np


def analyze_line_shift(text: str) -> Dict[str, Any]:
    """Analyze text for vertical line-spacing and blank-line steganographic patterns.

    Note on Scope:
    Plain text files (.txt) do not encode physical font baseline coordinates (pt/mm).
    In accordance with forensic standards, this detector analyzes textual line-break
    density, alternating blank-line modulations, and line-length periodicity without
    fabricating physical geometric measurements.

    Parameters
    ----------
    text : str
        Input text content to inspect.

    Returns
    -------
    dict
        Structured analysis of line spacing characteristics and evidence.
    """
    if not text:
        return {
            "method": "line_shift",
            "suspicious": False,
            "score": 0.0,
            "features": {
                "total_lines": 0,
                "blank_lines_count": 0,
                "content_lines_count": 0,
                "blank_line_ratio": 0.0,
                "line_length_variance": 0.0,
                "alternating_spacing_detected": False,
                "measurement_domain": "textual_logical_spacing",
            },
            "evidence": ["Text is empty."],
            "limitations": [
                "Plain text analysis measures newline/blank-line patterns only; physical baseline offsets require visual PDF/PostScript formats."
            ],
        }

    raw_lines = text.splitlines(keepends=False)
    total_lines = len(raw_lines)

    content_lines = []
    blank_line_indices = []
    gap_between_paragraphs = []

    current_blank_streak = 0
    for idx, l in enumerate(raw_lines, start=1):
        if len(l.strip()) == 0:
            blank_line_indices.append(idx)
            current_blank_streak += 1
        else:
            content_lines.append(l)
            if current_blank_streak > 0:
                gap_between_paragraphs.append(current_blank_streak)
                current_blank_streak = 0
    if current_blank_streak > 0:
        gap_between_paragraphs.append(current_blank_streak)

    blank_count = len(blank_line_indices)
    content_count = len(content_lines)
    blank_ratio = blank_count / max(1, total_lines)

    line_lengths = [len(l) for l in content_lines]
    length_var = float(np.var(line_lengths)) if line_lengths else 0.0

    # Alternating spacing detection (e.g., alternating 1 blank line and 2 blank lines)
    alternating_detected = False
    if len(gap_between_paragraphs) >= 4:
        diffs = np.diff(gap_between_paragraphs)
        # Check if consecutive differences alternate sign or form periodic pattern
        if np.all(diffs[0::2] > 0) and np.all(diffs[1::2] < 0):
            alternating_detected = True

    evidence_points = []
    score = 0.0

    if total_lines < 6:
        evidence_points.append("Insufficient lines to establish a baseline vertical spacing pattern.")
    else:
        if alternating_detected:
            score = 0.65
            evidence_points.append(
                f"Suspicious alternating blank-line pattern detected across {len(gap_between_paragraphs)} paragraph breaks."
            )
        elif blank_ratio > 0.45 and len(gap_between_paragraphs) > 5:
            score = 0.45
            evidence_points.append(
                f"Elevated frequency of blank lines ({blank_count}/{total_lines} lines, {round(blank_ratio * 100, 1)}%)."
            )
        else:
            score = 0.05
            evidence_points.append("Line breaks and paragraph spacing adhere to conventional uniform prose patterns.")

    score = round(max(0.0, min(1.0, score)), 4)
    suspicious = bool(score >= 0.50)

    return {
        "method": "line_shift",
        "suspicious": suspicious,
        "score": score,
        "features": {
            "total_lines": total_lines,
            "content_lines_count": content_count,
            "blank_lines_count": blank_count,
            "blank_line_ratio": round(blank_ratio, 4),
            "paragraph_gaps": gap_between_paragraphs[:10],
            "line_length_variance": round(length_var, 2),
            "alternating_spacing_detected": alternating_detected,
            "measurement_domain": "textual_logical_spacing",
        },
        "evidence": evidence_points,
        "limitations": [
            "Plain text analysis measures newline/blank-line patterns only; physical baseline offsets require visual PDF/PostScript formats."
        ],
    }