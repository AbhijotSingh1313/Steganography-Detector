# Multi-Modal Steganalysis Platform Architecture

## 1. System Overview

```
                        STEGANALYSIS PLATFORM
                                 │
     ┌───────────────────────────┼───────────────────────────┐
     │                           │                           │
     ▼                           ▼                           ▼
IMAGE MODULE                TEXT MODULE                 NETWORK MODULE
(Spatial & Bit-Plane)       (Linguistic Formatting)     (Packet & Flow Analysis)
     │                           │                           │
  ResNet18 CNN                Whitespace                  ICMP Payloads
       +                           +                           +
  Cloacked-Pixel LSB          Word-Shift                  Payload Entropy
       │                           +                           +
       ▼                       Line-Shift                 Timing Periodicity
  Hybrid Fusion                   │                           │
       │                           ▼                           ▼
  Prediction:                 Prediction:                 Prediction:
  CLEAN / STEGO               CLEAN / SUSPICIOUS          NORMAL / SUSPICIOUS
```

---

## 2. Module Specifications

| Module | Inspection Domain | Primary Methods | Output Verdicts | Confidence/Score Type |
| :--- | :--- | :--- | :--- | :--- |
| **Image** | Pixel bit-planes & spatial convolution | PyTorch ResNet18 + Cloacked-Pixel Block LSB Analysis + Calibrated Logistic Fusion | `CLEAN`, `STEGO` | Fused Probability & Confidence |
| **Text** | Plain text formatting | Trailing whitespace (SNOW), Bimodal word-gap distribution, Paragraph spacing | `CLEAN`, `SUSPICIOUS` | Steganalysis Evidence Score |
| **Network** | Network packet captures (.pcap) | Offline ICMP packet inspection, Payload Shannon entropy, OS ping signature verification, Periodic timing CV | `NORMAL`, `MODERATE_EVIDENCE`, `SUSPICIOUS` | Covert Channel Suspicion Score |

---

## 3. Preserved Infrastructure
* **AI Model:** Pre-trained weights `models/stego_detector_baseline.pth` are loaded read-only with zero modification.
* **Authentication Backend:** SQLite persistence and JWT token authentication routes remain completely intact and active.
* **Interactive Dashboard:** Accessible at `/dashboard` and `/` with unified tabs for Image, Text, and Network analysis.