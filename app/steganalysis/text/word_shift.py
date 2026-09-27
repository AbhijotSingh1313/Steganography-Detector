"""
Word-Shift Steganalysis Module
==============================
Detects word-shift steganography in text documents, including:
- Inconsistent or bimodal inter-word spacing (alternating single vs double/triple spaces).
- Multi-space bit encoding between consecutive words.
- Unnatural spacing variation in mid-sentence prose.
- Tab insertions between words.
"""

from typing import Dict, Any, List
from collections import Counter
import re
import numpy as np


def analyze_word_shift(text: str) -> Dict[str, Any]:
    """Analyze inter-word spacing for word-shift steganographic indicators."""
    if not text or not text.strip():
        return {
            "method": "word_shift",
            "suspicious": False,
            "score": 0.0,
            "features": {
                "total_word_gaps": 0,
                "single_space_gaps": 0,
                "multi_space_gaps": 0,
                "tab_gaps": 0,
                "multi_space_ratio": 0.0,
                "gap_variance": 0.0,
                "bimodal_entropy": 0.0,
            },
            "evidence": ["Text contains insufficient words for word-shift analysis."],
            "suspicious_locations": [],
        }

    lines = text.splitlines()
    gap_lengths = []
    single_spaces = 0
    multi_spaces = 0
    tab_gaps = 0
    suspicious_locations = []

    # Pattern to match word followed by whitespace and next word
    gap_pattern = re.compile(r"(\S+)([ \t\u00a0]+)(?=\S)")

    for line_idx, line in enumerate(lines, start=1):
        matches = list(gap_pattern.finditer(line))
        for m in matches:
            word = m.group(1)
            gap = m.group(2)
            spaces = gap.count(" ") + gap.count("\u00a0")
            tabs = gap.count("\t")
            gap_len = len(gap)

            gap_lengths.append(gap_len)
            if tabs > 0:
                tab_gaps += 1
            elif spaces == 1:
                single_spaces += 1
            elif spaces > 1:
                multi_spaces += 1

            # Ignore natural double spaces after sentence-terminating punctuation (. ! ?)
            is_sentence_break = word.endswith((".", "!", "?", ":", ";"))
            if (spaces > 1 and not is_sentence_break) or tabs > 0:
                if len(suspicious_locations) < 10:
                    suspicious_locations.append({
                        "line": line_idx,
                        "preceding_word": word,
                        "gap_length": spaces if tabs == 0 else f"{spaces}S+{tabs}T",
                        "snippet": line[max(0, m.start() - 10) : min(len(line), m.end() + 15)],
                    })

    total_gaps = len(gap_lengths)
    if total_gaps < 2:
        return {
            "method": "word_shift",
            "suspicious": False,
            "score": 0.0,
            "features": {
                "total_word_gaps": total_gaps,
                "single_space_gaps": single_spaces,
                "multi_space_gaps": multi_spaces,
                "tab_gaps": tab_gaps,
                "multi_space_ratio": 0.0,
                "gap_variance": 0.0,
                "bimodal_entropy": 0.0,
            },
            "evidence": ["Text too short for inter-word spacing evaluation."],
            "suspicious_locations": [],
        }

    multi_ratio = multi_spaces / total_gaps
    gap_var = float(np.var(gap_lengths))

    # Bimodality / Multi-state entropy
    counts = Counter(gap_lengths)
    common = counts.most_common(2)
    bimodal_entropy = 0.0
    if len(common) >= 2:
        c1, c2 = common[0][1], common[1][1]
        sum_c = c1 + c2
        if sum_c > 0:
            p1 = c1 / sum_c
            p2 = c2 / sum_c
            if p1 > 0.10 and p2 > 0.10:
                bimodal_entropy = float(-p1 * np.log2(p1) - p2 * np.log2(p2))

    evidence_points = []
    score = 0.0

    # Decision Logic:
    # A. Mid-sentence multi-spaces or tabs
    if tab_gaps > 0:
        score = max(score, min(0.95, 0.70 + (tab_gaps / total_gaps) * 0.5))
        evidence_points.append(f"Unexpected tab characters ({tab_gaps}) found between prose words.")

    if multi_spaces >= 2:
        # Deliberate multi-spacing between words
        if multi_ratio >= 0.20:
            base = 0.65 + min(0.25, (multi_ratio - 0.20) * 0.6)
            boost = 0.10 * bimodal_entropy
            score = max(score, min(0.96, base + boost))
            evidence_points.append(
                f"Significant inter-word spacing deviation ({round(multi_ratio * 100, 1)}% non-standard multi-space gaps, {multi_spaces} occurrences)."
            )
        elif multi_spaces >= 3:
            score = max(score, 0.60)
            evidence_points.append(
                f"Repeated artificial multi-space gaps ({multi_spaces} occurrences) detected mid-sentence."
            )
        else:
            # 2 multi-space occurrences
            score = max(score, 0.45)
            evidence_points.append(
                f"Irregular inter-word spacing detected ({multi_spaces} non-sentence multi-space gaps)."
            )

        if bimodal_entropy > 0.45:
            evidence_points.append(
                f"Bimodal spacing distribution observed (gap widths: {[w for w, _ in common]}, entropy: {bimodal_entropy:.3f}), consistent with binary state encoding."
            )
    elif multi_spaces == 1:
        score = max(score, 0.25)
        evidence_points.append("Single isolated multi-space gap observed (likely typographical variance).")
    else:
        if not evidence_points:
            score = 0.0
            evidence_points.append("Inter-word spacing is uniform (100% standard single spaces).")

    score = round(max(0.0, min(1.0, score)), 4)
    suspicious = bool(score >= 0.50)

    return {
        "method": "word_shift",
        "suspicious": suspicious,
        "score": score,
        "features": {
            "total_word_gaps": total_gaps,
            "single_space_gaps": single_spaces,
            "multi_space_gaps": multi_spaces,
            "tab_gaps": tab_gaps,
            "multi_space_ratio": round(multi_ratio, 4),
            "gap_variance": round(gap_var, 4),
            "bimodal_entropy": round(bimodal_entropy, 4),
        },
        "evidence": evidence_points,
        "suspicious_locations": suspicious_locations,
    }
