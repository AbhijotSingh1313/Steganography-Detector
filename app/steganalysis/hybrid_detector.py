"""
Hybrid Steganalysis Fusion Detector
====================================
Combines predictions from the existing pre-trained PyTorch ResNet18 AI model
with statistical evidence from traditional LSB analysis (adapted from Cloacked-Pixel).
"""

from typing import Union, Dict, Any, List, Optional
import os
import numpy as np
from PIL import Image

from app.steganalysis.lsb_analysis import analyze_lsb
from app.steganalysis.features import extract_lsb_features, extract_lsb_feature_vector
from app.steganalysis.ai_detector import AIDetector, get_ai_detector


class HybridDetector:
    """Hybrid detector that fuses spatial deep-learning features with bit-plane statistical evidence."""

    def __init__(
        self,
        ai_detector: Optional[AIDetector] = None,
        fusion_model_path: Optional[str] = "models/fusion_model.joblib",
    ):
        self.ai_detector = ai_detector or get_ai_detector()
        self.fusion_model_path = fusion_model_path
        self.fusion_model = self._load_fusion_model()

    def _load_fusion_model(self) -> Optional[Any]:
        """Load trained scikit-learn fusion classifier if available."""
        if self.fusion_model_path and os.path.exists(self.fusion_model_path):
            try:
                import joblib
                model = joblib.load(self.fusion_model_path)
                return model
            except Exception:
                return None
        return None

    def analyze(
        self,
        image_input: Union[str, Image.Image, np.ndarray],
        block_size: int = 100
    ) -> Dict[str, Any]:
        """Perform comprehensive hybrid steganalysis.

        Parameters
        ----------
        image_input : str, Image.Image, or np.ndarray
        block_size : int, optional (default: 100)

        Returns
        -------
        dict
            Unified result containing top-level decision, AI evidence,
            traditional LSB evidence, hybrid fusion score, and explainability notes.
        """
        # 1. Independent Traditional LSB Analysis
        trad_result = analyze_lsb(image_input, block_size=block_size)

        # 2. Independent Existing AI Model Inference
        ai_result = self.ai_detector.predict(image_input)

        # 3. Hybrid Fusion
        ai_prob = float(ai_result["probability"])  # P(stego) from AI
        trad_score = float(trad_result["traditional_score"])  # [0, 1] anomaly score
        global_mean = float(trad_result["global_lsb_mean"])
        block_std = float(trad_result["block_statistics"]["std_block_mean"])
        dev_half = float(trad_result["block_statistics"]["deviation_from_half"])
        embedded_ratio = float(trad_result["block_statistics"]["embedded_block_ratio"])

        if self.fusion_model is not None:
            # Use trained fusion classifier
            feat_vec, _ = extract_lsb_feature_vector(image_input, block_size=block_size)
            # Input vector: [ai_prob, *feat_vec]
            fusion_input = np.concatenate([[ai_prob], feat_vec]).reshape(1, -1)
            hybrid_prob = float(self.fusion_model.predict_proba(fusion_input)[0, 1])
            fusion_method = "trained_classifier"
        else:
            # Principled Calibrated Evidence Fusion:
            # Base combination:
            base_hybrid = 0.55 * ai_prob + 0.45 * trad_score

            # Cross-domain reinforcement:
            # If both AI and traditional suggest STEGO:
            if ai_prob >= 0.60 and trad_score >= 0.65:
                hybrid_prob = min(0.99, base_hybrid + 0.08)
            # If both suggest CLEAN:
            elif ai_prob <= 0.40 and trad_score <= 0.40:
                hybrid_prob = max(0.01, base_hybrid - 0.08)
            else:
                hybrid_prob = base_hybrid

            fusion_method = "calibrated_evidence_fusion"

        hybrid_prob = round(max(0.0, min(1.0, float(hybrid_prob))), 4)
        hybrid_prediction = "STEGO" if hybrid_prob >= 0.50 else "CLEAN"
        hybrid_confidence = round(max(hybrid_prob, 1.0 - hybrid_prob), 4)

        # 4. Verifiable Explainability Statements (Phase 10)
        explanations = self._generate_explanations(
            ai_prob=ai_prob,
            trad_score=trad_score,
            global_mean=global_mean,
            block_std=block_std,
            embedded_ratio=embedded_ratio,
            hybrid_prob=hybrid_prob,
            final_pred=hybrid_prediction,
        )

        # Structure final response
        return {
            "prediction": hybrid_prediction,
            "confidence": hybrid_confidence,
            "ai": {
                "prediction": ai_result["prediction"],
                "probability": ai_result["probability"],
                "confidence": ai_result["confidence"],
            },
            "traditional": {
                "lsb_mean": trad_result["global_lsb_mean"],
                "zero_ratio": trad_result["zero_ratio"],
                "one_ratio": trad_result["one_ratio"],
                "bit_entropy": trad_result["bit_entropy"],
                "traditional_score": trad_result["traditional_score"],
                "suspicious": trad_result["suspicious"],
                "channel_statistics": trad_result["channel_statistics"],
                "block_statistics": trad_result["block_statistics"],
                "chi_square_pov": trad_result["chi_square_pov"],
            },
            "hybrid": {
                "prediction": hybrid_prediction,
                "probability": hybrid_prob,
                "confidence": hybrid_confidence,
                "fusion_method": fusion_method,
            },
            "explanations": explanations,
        }

    def _generate_explanations(
        self,
        ai_prob: float,
        trad_score: float,
        global_mean: float,
        block_std: float,
        embedded_ratio: float,
        hybrid_prob: float,
        final_pred: str,
    ) -> List[str]:
        """Generate factual, evidence-backed explanations for the prediction."""
        notes = []
        hybrid_conf = max(hybrid_prob, 1.0 - hybrid_prob)

        # AI explanation
        if ai_prob >= 0.65:
            notes.append(
                f"Existing AI model detected visual spatial patterns consistent with steganography (confidence: {round(ai_prob * 100, 1)}%)."
            )
        elif ai_prob <= 0.35:
            notes.append(
                f"Existing AI model found no significant high-level steganographic artifacts (clean confidence: {round((1 - ai_prob) * 100, 1)}%)."
            )
        else:
            notes.append(
                f"Existing AI model returned an ambiguous response (stego probability: {round(ai_prob * 100, 1)}%)."
            )

        # Traditional LSB analysis explanation
        if abs(global_mean - 0.5) <= 0.02 and block_std < 0.08:
            notes.append(
                f"Traditional LSB analysis indicates statistical evidence consistent with possible LSB embedding: bit-plane mean is balanced ({global_mean}) with low block dispersion (std: {block_std})."
            )
        elif abs(global_mean - 0.5) > 0.05 or block_std >= 0.12:
            notes.append(
                f"Traditional LSB analysis indicates typical natural image characteristics: bit-plane mean deviates from 0.5 ({global_mean}) with high local variation (std: {block_std})."
            )
        else:
            notes.append(
                f"Traditional LSB statistics are moderately balanced ({round(embedded_ratio * 100, 1)}% blocks near 0.5 mean, score: {trad_score})."
            )

        # Hybrid fusion conclusion
        if final_pred == "STEGO":
            notes.append(
                f"Hybrid fusion combined neural convolutional features and bit-plane entropy into a final STEGO assessment ({round(hybrid_conf * 100, 1)}% confidence)."
            )
        else:
            notes.append(
                f"Hybrid fusion determined that the combined spatial and statistical evidence does not warrant a steganography finding ({round(hybrid_conf * 100, 1)}% clean confidence)."
            )

        return notes


# Global singleton instance
_hybrid_detector_instance: Optional[HybridDetector] = None


def get_hybrid_detector() -> HybridDetector:
    """Retrieve or initialize the global HybridDetector singleton."""
    global _hybrid_detector_instance
    if _hybrid_detector_instance is None:
        _hybrid_detector_instance = HybridDetector()
    return _hybrid_detector_instance