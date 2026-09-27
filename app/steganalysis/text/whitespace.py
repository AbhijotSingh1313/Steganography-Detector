"""
Whitespace & Invisible Unicode Steganalysis Module
==================================================
Detects whitespace-based and invisible character steganography in text documents:
- Zero-Width Unicode characters (ZWSP, ZWNJ, ZWJ, ZWNBSP, LRM, RLM, WJ, etc.)
- Non-standard/special Unicode spaces (NBSP, thin spaces, hair spaces, quad spaces)
- Systematic trailing spaces and tabs (SNOW, StegFS encoding)
- Alternating space/tab binary encoding patterns
- High-density whitespace clusters
- Filtering of benign editor single-space artifacts
"""

from typing import Dict, Any, List, Tuple
from collections import Counter
import re
import numpy as np

# Zero-Width and Invisible Unicode Characters commonly used in covert text channels
ZERO_WIDTH_CHARS = {
    '\u200b': 'Zero-Width Space (ZWSP)',
    '\u200c': 'Zero-Width Non-Joiner (ZWNJ)',
    '\u200d': 'Zero-Width Joiner (ZWJ)',
    '\u200e': 'Left-to-Right Mark (LRM)',
    '\u200f': 'Right-to-Left Mark (RLM)',
    '\ufeff': 'Zero-Width No-Break Space / BOM (ZWNBSP)',
    '\u2060': 'Word Joiner (WJ)',
    '\u2061': 'Function Application',
    '\u2062': 'Invisible Times',
    '\u2063': 'Invisible Separator',
    '\u2064': 'Invisible Plus',
    '\u180e': 'Mongolian Vowel Separator',
    '\u00ad': 'Soft Hyphen (SHY)',
    '\u034f': 'Combining Grapheme Joiner',
}

# Tag characters in Plane 14 (U+E0001 to U+E007F) used by Unicode tag stego
UNICODE_TAG_RANGE = (0xE0001, 0xE007F)

# Special non-standard Unicode whitespace characters
SPECIAL_WHITESPACE_CHARS = {
    '\u00a0': 'Non-Breaking Space (NBSP)',
    '\u2000': 'En Quad',
    '\u2001': 'Em Quad',
    '\u2002': 'En Space',
    '\u2003': 'Em Space',
    '\u2004': 'Three-Per-Em Space',
    '\u2005': 'Four-Per-Em Space',
    '\u2006': 'Six-Per-Em Space',
    '\u2007': 'Figure Space',
    '\u2008': 'Punctuation Space',
    '\u2009': 'Thin Space',
    '\u200a': 'Hair Space',
    '\u202f': 'Narrow No-Break Space',
    '\u205f': 'Medium Mathematical Space',
    '\u3000': 'Ideographic Space',
}


def analyze_whitespace(text: str) -> Dict[str, Any]:
    """Analyze text for whitespace-based and invisible unicode steganographic indicators."""
    if not text:
        return {
            "method": "whitespace",
            "suspicious": False,
            "score": 0.0,
            "features": {
                "total_lines": 0,
                "trailing_lines_count": 0,
                "trailing_lines_ratio": 0.0,
                "total_trailing_spaces": 0,
                "total_trailing_tabs": 0,
                "zero_width_count": 0,
                "special_whitespace_count": 0,
                "binary_like_sequences": 0,
                "max_trailing_length": 0,
                "whitespace_entropy": 0.0,
            },
            "evidence": ["Text is empty."],
            "suspicious_lines": [],
        }

    # 1. Inspect for Zero-Width / Invisible Unicode characters throughout entire text
    zw_matches = []
    zw_counts = Counter()
    for idx, char in enumerate(text):
        # Ignore initial byte order mark if it's the very first character of the document
        if char == '\ufeff' and idx == 0:
            continue

        if char in ZERO_WIDTH_CHARS:
            name = ZERO_WIDTH_CHARS[char]
            zw_counts[name] += 1
            if len(zw_matches) < 15:
                line_no = text[:idx].count("\n") + 1
                zw_matches.append({
                    "offset": idx,
                    "line": line_no,
                    "codepoint": f"U+{ord(char):04X}",
                    "name": name,
                })
        elif UNICODE_TAG_RANGE[0] <= ord(char) <= UNICODE_TAG_RANGE[1]:
            zw_counts["Unicode Plane 14 Tag"] += 1
            if len(zw_matches) < 15:
                line_no = text[:idx].count("\n") + 1
                zw_matches.append({
                    "offset": idx,
                    "line": line_no,
                    "codepoint": f"U+{ord(char):04X}",
                    "name": "Unicode Plane 14 Tag Character",
                })

    total_zw = sum(zw_counts.values())

    # 2. Inspect for Special / Non-Standard Unicode Whitespace
    special_ws_counts = Counter()
    for char in text:
        if char in SPECIAL_WHITESPACE_CHARS:
            special_ws_counts[SPECIAL_WHITESPACE_CHARS[char]] += 1
    total_special_ws = sum(special_ws_counts.values())

    # 3. Line-by-Line Trailing Whitespace Analysis
    lines = text.splitlines()
    total_lines = len(lines)
    if total_lines == 0:
        total_lines = 1
        lines = [text]

    trailing_lines = []
    total_trailing_spaces = 0
    total_trailing_tabs = 0
    trailing_lengths = []
    binary_like_seqs = 0
    suspicious_line_details = []

    trailing_pattern = re.compile(r"([ \t\u00a0\u2000-\u200b\ufeff]+)$")

    for line_idx, line in enumerate(lines, start=1):
        match = trailing_pattern.search(line)
        if match:
            ws_seq = match.group(1)
            spaces = ws_seq.count(" ") + ws_seq.count("\u00a0")
            tabs = ws_seq.count("\t")
            length = len(ws_seq)

            trailing_lines.append(line_idx)
            total_trailing_spaces += spaces
            total_trailing_tabs += tabs
            trailing_lengths.append(length)

            # Check for binary-like patterns (SNOW, StegFS, whitespace bit strings)
            is_structured = False
            if spaces > 0 and tabs > 0:
                binary_like_seqs += 1
                is_structured = True
            elif length >= 3:
                binary_like_seqs += 1
                is_structured = True
            elif tabs > 0:
                binary_like_seqs += 1
                is_structured = True

            if is_structured or length > 2:
                suspicious_line_details.append({
                    "line": line_idx,
                    "length": length,
                    "spaces": spaces,
                    "tabs": tabs,
                    "representation": ws_seq.replace(" ", "[S]").replace("\t", "[T]").replace("\u00a0", "[NBSP]"),
                })

    trailing_lines_count = len(trailing_lines)
    trailing_ratio = trailing_lines_count / total_lines
    max_trailing = max(trailing_lengths) if trailing_lengths else 0
    avg_trailing = float(np.mean(trailing_lengths)) if trailing_lengths else 0.0

    total_ws = total_trailing_spaces + total_trailing_tabs
    entropy = 0.0
    if total_ws > 0:
        p_space = total_trailing_spaces / total_ws
        p_tab = total_trailing_tabs / total_ws
        if p_space > 0 and p_tab > 0:
            entropy = float(-p_space * np.log2(p_space) - p_tab * np.log2(p_tab))

    # 4. Formulate Evidence & Scoring
    evidence_points = []
    score = 0.0

    # A. Zero-width character evidence
    if total_zw > 0:
        zw_breakdown = ", ".join(f"{name}: {count}" for name, count in zw_counts.most_common(4))
        evidence_points.append(
            f"Detected {total_zw} hidden zero-width/invisible Unicode character(s) ({zw_breakdown})."
        )
        if total_zw >= 3:
            score = max(score, min(0.99, 0.85 + (total_zw / 50.0)))
        else:
            score = max(score, 0.80)

    # B. Special non-standard whitespace evidence
    if total_special_ws >= 4:
        ws_types = ", ".join(f"{name}: {count}" for name, count in special_ws_counts.most_common(3))
        evidence_points.append(
            f"Detected {total_special_ws} non-standard Unicode whitespace characters ({ws_types})."
        )
        score = max(score, min(0.90, 0.50 + (total_special_ws / 20.0)))

    # C. Trailing whitespace evidence (SNOW / StegFS)
    if binary_like_seqs > 0:
        if total_trailing_tabs > 0 and total_trailing_spaces > 0:
            score = max(score, min(0.96, 0.70 + (binary_like_seqs / max(1, total_lines)) * 0.5 + entropy * 0.2))
            evidence_points.append(
                f"{binary_like_seqs} line(s) contain mixed space/tab sequences (SNOW binary steganography signature; entropy: {entropy:.3f})."
            )
        elif max_trailing >= 4:
            score = max(score, min(0.92, 0.60 + min(0.35, max_trailing / 15.0)))
            evidence_points.append(
                f"Extended trailing whitespace sequence detected (up to {max_trailing} characters on a line)."
            )
        else:
            score = max(score, 0.65)
            evidence_points.append(
                f"{binary_like_seqs} line(s) exhibit non-accidental trailing whitespace patterns."
            )
    elif trailing_lines_count > 0:
        # Benign accidental trailing spaces (single or double space only, no tabs, no structured seqs)
        if max_trailing <= 2 and total_trailing_tabs == 0:
            score = max(score, min(0.24, trailing_ratio * 0.35))
            evidence_points.append(
                f"Minor single-space trailing whitespace detected on {trailing_lines_count}/{total_lines} lines (typical editor artifact)."
            )
        else:
            score = max(score, min(0.70, trailing_ratio * 0.8))
            evidence_points.append(
                f"Trailing whitespace observed on {round(trailing_ratio * 100, 1)}% of lines."
            )
    else:
        if not evidence_points:
            evidence_points.append("No trailing whitespace or invisible zero-width characters detected.")

    score = round(max(0.0, min(1.0, score)), 4)
    suspicious = bool(score >= 0.50)

    return {
        "method": "whitespace",
        "suspicious": suspicious,
        "score": score,
        "features": {
            "total_lines": total_lines,
            "zero_width_count": total_zw,
            "special_whitespace_count": total_special_ws,
            "trailing_lines_count": trailing_lines_count,
            "trailing_lines_ratio": round(trailing_ratio, 4),
            "total_trailing_spaces": total_trailing_spaces,
            "total_trailing_tabs": total_trailing_tabs,
            "binary_like_sequences": binary_like_seqs,
            "max_trailing_length": max_trailing,
            "average_trailing_length": round(avg_trailing, 2),
            "whitespace_entropy": round(entropy, 4),
        },
        "evidence": evidence_points,
        "suspicious_lines": suspicious_line_details[:10],
        "zero_width_samples": zw_matches[:10],
    }
