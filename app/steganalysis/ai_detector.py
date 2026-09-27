"""
Existing AI Detector Interface
===============================
Loads and runs inference using the existing PyTorch ResNet18 model
(models/stego_detector_baseline.pth) without any modification or retraining.
"""

from typing import Union, Dict, Any, Optional
import os
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import numpy as np


# Preprocessing pipeline matching evaluate.py and train.py
DEFAULT_TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    ),
])


class AIDetector:
    """Wrapper around the pre-trained PyTorch ResNet18 steganography classifier."""

    def __init__(self, model_path: Optional[str] = None, device: Optional[str] = None):
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)

        # Locate existing trained model
        if model_path is None:
            candidates = [
                "models/stego_detector_baseline.pth",
                "models/stego_detector.pth",
                os.path.join(os.path.dirname(__file__), "../../models/stego_detector_baseline.pth"),
            ]
            self.model_path = None
            for p in candidates:
                if os.path.exists(p):
                    self.model_path = p
                    break
            if self.model_path is None:
                raise FileNotFoundError(
                    f"Trained AI model not found in any of candidate locations: {candidates}"
                )
        else:
            self.model_path = model_path

        self.transform = DEFAULT_TRANSFORM
        self.model = self._load_model()

    def _load_model(self) -> nn.Module:
        """Instantiate ResNet18 and load trained weights in eval mode."""
        net = models.resnet18(weights=None)
        in_features = net.fc.in_features
        net.fc = nn.Linear(in_features, 2)

        checkpoint = torch.load(self.model_path, map_location=self.device)
        net.load_state_dict(checkpoint)
        net.to(self.device)
        net.eval()
        return net

    def predict(self, image_input: Union[str, Image.Image, np.ndarray]) -> Dict[str, Any]:
        """Run forward pass and return probabilities and prediction.

        Parameters
        ----------
        image_input : str, Image.Image, or np.ndarray

        Returns
        -------
        dict
            {
                "prediction": "CLEAN" | "STEGO",
                "probability": float (P(stego)),
                "confidence": float,
                "probabilities": {"clean": float, "stego": float},
                "raw_logits": [float, float]
            }
        """
        if isinstance(image_input, str):
            img = Image.open(image_input).convert("RGB")
        elif isinstance(image_input, Image.Image):
            img = image_input.convert("RGB")
        elif isinstance(image_input, np.ndarray):
            img = Image.fromarray(image_input).convert("RGB")
        else:
            raise TypeError(f"Unsupported image type: {type(image_input)}")

        tensor = self.transform(img).unsqueeze(0).to(self.device)

        with torch.no_grad():
            logits = self.model(tensor)
            probs = torch.softmax(logits, dim=1).squeeze(0)

        prob_clean = float(probs[0].item())
        prob_stego = float(probs[1].item())
        predicted_class = "STEGO" if prob_stego >= 0.5 else "CLEAN"
        confidence = max(prob_clean, prob_stego)

        return {
            "prediction": predicted_class,
            "probability": round(prob_stego, 5),
            "confidence": round(confidence, 5),
            "probabilities": {
                "clean": round(prob_clean, 5),
                "stego": round(prob_stego, 5),
            },
            "raw_logits": [round(float(l), 4) for l in logits.squeeze(0).tolist()],
        }


# Global singleton instance
_ai_detector_instance: Optional[AIDetector] = None


def get_ai_detector(model_path: Optional[str] = None) -> AIDetector:
    """Retrieve or initialize the global AIDetector singleton."""
    global _ai_detector_instance
    if _ai_detector_instance is None:
        _ai_detector_instance = AIDetector(model_path=model_path)
    return _ai_detector_instance