# Current Steganography Detection Pipeline Inspection

## 1. Project Overview & Component Identification
- **Repository Scope:** Backend API & Deep Learning model project (No frontend code is present in this repository).
- **Backend Framework:** FastAPI with Uvicorn, SQLite database, and JWT authentication in pp/.
- **Existing AI Model:** models/stego_detector_baseline.pth (ResNet18 architecture with a 2-class linear output head).
- **Model Loading:** Implemented in 	rain.py and evaluate.py:
  - model = models.resnet18(weights=None)
  - model.fc = nn.Linear(model.fc.in_features, 2)
  - model.load_state_dict(torch.load('models/stego_detector_baseline.pth', map_location=DEVICE))
- **Preprocessing Pipeline:**
  - Resized to 224x224 (evaluated) / 512x512 (trained)
  - Converted to Tensor (scaled to [0.0, 1.0])
  - Normalized with standard ImageNet statistics:
    - Mean: [0.485, 0.456, 0.406]
    - Std: [0.229, 0.224, 0.225]
- **Inference & Prediction:**
  - Evaluated via PyTorch forward pass: outputs = model(images)
  - Predicted class determined by 	orch.max(outputs, 1) or F.softmax(outputs, dim=1)
- **Class Ordering:**
  - Index 0: Clean / Non-stego
  - Index 1: Stego
- **Confidence / Probability:** Softmax probability of class 1 (P(stego)). Default decision threshold is 0.5.
- **Current API Status:** pp/main.py contains health check (/) and JWT authentication routes (/auth/*), but has no dedicated inference route (/predict).

## 2. Input Specifications
- **Format:** RGB image (3 channels)
- **Tensor Shape:** (Batch, 3, 224, 224)
- **Data Type:** Float32 tensor

## 3. Identified Deficiencies of AI-Only Detector
- ResNet18 trained on high-level spatial domain features can suffer from domain-shift and struggles to reliably detect fine-grained least significant bit (LSB) changes, especially at lower payload rates.
- AI predictions can be over-confident or biased without inspecting pixel bit-plane entropy and statistical distribution anomalies.
