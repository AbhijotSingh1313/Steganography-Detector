# ICMP Steganalysis & Covert Channel Detection

## 1. Overview & Defensive Scope
ICMP (Internet Control Message Protocol) is typically utilized for network diagnostics (ping/echo, path MTU, unreachable signaling). Covert channels exploit ICMP echo request/reply packets by encoding unauthorized data into payload fields, ID/sequence values, or inter-packet timing intervals.

**DEFENSIVE SCOPE:**
This module is strictly offline and analytical. It parses uploaded packet captures (`.pcap`, `.pcapng`) using Scapy and computes structural and statistical metrics. It contains no packet generation, injection, or transmission capabilities.

---

## 2. Statistical & Structural Features

### A. Payload Entropy & Structure
* **Shannon Entropy:** Standard diagnostic ping packets carry repetitive alphanumeric sequences (e.g., Windows 32-byte `abcdefghijklmnopqrstuvwabcdefghi`). Encrypted or compressed covert channels exhibit high Shannon entropy ($\ge 5.5 - 7.5$ bits/byte).
* **Payload Length & Variance:** Standard ping payloads are fixed at 32 bytes (Windows) or 56-64 bytes (Linux/BSD). Payloads exceeding 64 bytes or exhibiting unusual fixed lengths indicate non-standard data transmission.
* **Standard OS Signature Ratio:** Measures the proportion of packets whose payload matches legitimate operating system ping signatures.

### B. Timing & Flow Periodicity
* **Inter-Arrival Time (IAT):** Covert beacons often emit packets at exact periodic intervals with near-zero jitter (Coefficient of Variation $CV = \sigma / \mu < 0.15$).
* **Flow Aggregation:** Tracks packet counts, payload distributions, and entropy across individual `(Source IP, Destination IP)` pairs.

---

## 3. Suspicion Scoring
The detector produces an uncalibrated **Covert Channel Suspicion Score** $\in [0.0, 1.0]$:
* **High Payload Entropy** ($35\%$ weight)
* **Non-Standard Payload Size** ($25\%$ weight)
* **OS Ping Signature Divergence** ($20\%$ weight)
* **Periodic Beaconing Timing** ($20\%$ weight)

**Classifications:**
* $Score < 0.40$: **NORMAL**
* $0.40 \le Score < 0.65$: **MODERATE_EVIDENCE**
* $Score \ge 0.65$: **SUSPICIOUS**

---

## 4. API Usage

### Endpoint: `POST /api/steganalysis/network`
```bash
curl -X POST "http://127.0.0.1:8000/api/steganalysis/network" \
     -F "file=@capture.pcap"
```