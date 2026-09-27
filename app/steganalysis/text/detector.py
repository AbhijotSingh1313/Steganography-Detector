"""
Text Steganalysis Detector (Hybrid Structural + BERT AI-Assisted)
================================================================
Combines:
1. Whitespace & Invisible Unicode steganalysis
2. Word-shift inter-word gap steganalysis
3. Line-shift layout & paragraph spacing steganalysis
4. BERT Neural Linguistic Steganalysis (Transformer Language Model)
"""

from typing import Dict, Any, List, Optional
from app.steganalysis.text.whitespace import analyze_whitespace
from app.steganalysis.text.word_shift import analyze_word_shift
from app.steganalysis.text.line_shift import analyze_line_shift
from app.steganalysis.text.bert_steganalysis import analyze_bert_linguistic


class TextSteganalysisDetector:
    """Unified text steganalysis detector combining structural and neural AI methods."""

    def analyze(self, text: str) -> Dict[str, Any]:
        """Perform full multi-method text steganalysis with BERT AI assistance."""
        if not text or not text.strip():
            return {
                "module": "text",
                "prediction": "CLEAN",
                "score": 0.0,
                "confidence_type": "evidence_score",
                "methods": {
                    "whitespace": analyze_whitespace(text),
                    "word_shift": analyze_word_shift(text),
                    "line_shift": analyze_line_shift(text),
                    "bert_linguistic": analyze_bert_linguistic(text),
                },
                "summary": "Document is empty.",
                "evidence": ["No text content provided to analyze."],
                "limitations": [
                    "Requires readable text with formatting intact to detect whitespace or spacing modulations."
                ],
            }

        # Run independent structural and neural AI analyzers
        ws_res = analyze_whitespace(text)
        word_res = analyze_word_shift(text)
        line_res = analyze_line_shift(text)
        bert_res = analyze_bert_linguistic(text)

        ws_score = ws_res["score"]
        word_score = word_res["score"]
        line_score = line_res["score"]
        bert_score = bert_res["score"]

        # Steganographic channels are selective: evidence in any single layer must be preserved
        scores = [ws_score, word_score, line_score, bert_score]
        primary_score = max(scores)
        secondary_contribution = (sum(scores) - primary_score) / max(1, len(scores) - 1)
        fused_score = min(1.0, primary_score + 0.15 * secondary_contribution)

        # Immediate override for zero-width characters (definitive stego indicators)
        zw_count = ws_res.get("features", {}).get("zero_width_count", 0)
        if zw_count >= 3:
            fused_score = max(fused_score, 0.98)
        elif zw_count > 0:
            fused_score = max(fused_score, 0.88)

        fused_score = round(fused_score, 4)

        if fused_score >= 0.65 or zw_count > 0:
            prediction = "SUSPICIOUS"
            summary_statement = "Strong steganographic formatting or lexical indicators detected across text structure."
        elif fused_score >= 0.40:
            prediction = "SUSPICIOUS"
            summary_statement = "Moderate structural or linguistic anomalies observed in document formatting."
        else:
            prediction = "CLEAN"
            summary_statement = "No significant whitespace, spacing, or neural linguistic steganographic patterns observed."

        # Compile consolidated evidence points
        all_evidence = []
        if ws_res["suspicious"] or zw_count > 0:
            all_evidence.extend([f"[Whitespace] {e}" for e in ws_res["evidence"] if "No trailing" not in e])
        if word_res["suspicious"]:
            all_evidence.extend([f"[Word-Shift] {e}" for e in word_res["evidence"] if "uniform" not in e])
        if line_res["suspicious"]:
            all_evidence.extend([f"[Line-Shift] {e}" for e in line_res["evidence"] if "conventional" not in e])
        if bert_res["suspicious"]:
            all_evidence.extend([f"[BERT-AI] {e}" for e in bert_res["evidence"] if "confirms natural" not in e])

        if not all_evidence:
            all_evidence.append("Document formatting, word spacing, and BERT contextual perplexity match normal prose baselines.")

        return {
            "module": "text",
            "prediction": prediction,
            "score": fused_score,
            "confidence_type": "evidence_score",
            "methods": {
                "whitespace": ws_res,
                "word_shift": word_res,
                "line_shift": line_res,
                "bert_linguistic": bert_res,
            },
            "summary": summary_statement,
            "evidence": all_evidence,
            "limitations": [
                "Plain text analysis measures character patterns only; physical print/PDF font baseline offsets cannot be measured in raw .txt.",
                "Accidental whitespace added by text editors can occasionally trigger low-level suspicion.",
            ],
        }


_text_detector_instance: Optional[TextSteganalysisDetector] = None


def get_text_detector() -> TextSteganalysisDetector:
    """Retrieve or initialize global TextSteganalysisDetector singleton."""
    global _text_detector_instance
    if _text_detector_instance is None:
        _text_detector_instance = TextSteganalysisDetector()
    return _text_detector_instance
