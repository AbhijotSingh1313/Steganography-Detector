"""
Train Hybrid Fusion Classifier
==============================
Trains a small, regularized fusion classifier (Logistic Regression) on the
training split only (data/benchmark/train) using:
[AI Stego Probability, 20 LSB Statistical Features]

Ensures strict zero data leakage:
- Evaluates only on the training split.
- Saves the trained model to models/fusion_model.joblib for HybridDetector.
"""

import os
import sys
import glob

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import numpy as np
from PIL import Image
import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report

from app.steganalysis import (
    get_ai_detector,
    extract_lsb_feature_vector,
)

TRAIN_DIR = "data/benchmark/train"
MODEL_OUTPUT = "models/fusion_model.joblib"


def load_train_features():
    samples = []
    clean_files = glob.glob(os.path.join(TRAIN_DIR, "clean", "*.png"))
    for p in clean_files:
        samples.append((p, 0))
    for p_type in ["stego_low", "stego_med", "stego_high"]:
        for p in glob.glob(os.path.join(TRAIN_DIR, p_type, "*.png")):
            samples.append((p, 1))

    ai_detector = get_ai_detector()
    X = []
    y = []

    print(f"Extracting features from {len(samples)} training samples...")
    for idx, (path, label) in enumerate(samples):
        img = Image.open(path).convert("RGB")
        ai_res = ai_detector.predict(img)
        ai_prob = float(ai_res["probability"])
        lsb_vec, _ = extract_lsb_feature_vector(img)

        sample_vec = np.concatenate([[ai_prob], lsb_vec])
        X.append(sample_vec)
        y.append(label)

    return np.array(X, dtype=np.float32), np.array(y, dtype=np.int32)


def main():
    X_train, y_train = load_train_features()
    print(f"X_train shape: {X_train.shape}, y_train shape: {y_train.shape}")

    # Create balanced logistic regression pipeline with standard scaling
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", LogisticRegression(class_weight="balanced", C=1.0, max_iter=1000, random_state=42)),
    ])

    pipeline.fit(X_train, y_train)
    train_preds = pipeline.predict(X_train)
    acc = accuracy_score(y_train, train_preds)
    print(f"\nTraining Split Accuracy: {acc * 100:.2f}%")
    print(classification_report(y_train, train_preds, target_names=["clean", "stego"]))

    os.makedirs(os.path.dirname(MODEL_OUTPUT), exist_ok=True)
    joblib.dump(pipeline, MODEL_OUTPUT)
    print(f"Saved trained fusion model to {MODEL_OUTPUT}")


if __name__ == "__main__":
    main()