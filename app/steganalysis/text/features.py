"""
Text Feature Extraction Module
==============================
Aggregates statistical features across whitespace, word-shift, and line-shift
analyses into structured dictionaries and vectors.
"""

from typing import Dict, Any
from app.steganalysis.text.whitespace import analyze_whitespace
from app.steganalysis.text.word_shift import analyze_word_shift
from app.steganalysis.text.line_shift import analyze_line_shift


def extract_all_text_features(text: str) -> Dict[str, Any]:
    """Extract complete suite of text steganalysis features.

    Parameters
    ----------
    text : str

    Returns
    -------
    dict
        Nested and flattened statistical features.
    """
    ws = analyze_whitespace(text)
    word = analyze_word_shift(text)
    line = analyze_line_shift(text)

    return {
        "whitespace": ws["features"],
        "word_shift": word["features"],
        "line_shift": line["features"],
        "summary_scores": {
            "whitespace_score": ws["score"],
            "word_shift_score": word["score"],
            "line_shift_score": line["score"],
        },
    }