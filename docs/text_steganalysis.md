# Text Steganalysis Architecture & Methodology

## 1. Overview
Text steganography conceals hidden information within written language by manipulating non-semantic formatting characteristics. This module implements a multi-method analytical detector focusing on:
1. **Whitespace Steganalysis**: Detects binary-like patterns and terminal whitespace.
2. **Word-Shift Steganalysis**: Detects multi-state spacing between consecutive words.
3. **Line-Shift Steganalysis**: Detects vertical line spacing and blank-line patterns.

---

## 2. Detection Methods & Features

### A. Whitespace Steganalysis
* **Principle:** Algorithms like SNOW (Steganographic Nature of Open Words) and StegFS append spaces ($0$) and tabs ($1$) to the ends of lines where visual rendering remains unperturbed.
* **Features Extracted:**
  - `trailing_lines_ratio`: Percentage of lines containing trailing whitespace.
  - `space_tab_ratio`: Ratio of space characters to tab characters.
  - `whitespace_entropy`: Binary Shannon entropy of the trailing bit plane.
  - `binary_like_sequences`: Count of lines carrying structured byte-length ($8$-bit) or mixed space/tab combinations.
* **Filtering Benign Artifacts:** Accidental single spaces on fewer than 15% of lines are categorized as harmless text-editor noise ($score \le 0.15$).

### B. Word-Shift Steganalysis
* **Principle:** Modulates horizontal distance between adjacent words. In digital text, this is represented as alternating 1-space vs 2-space (or 2-space vs 3-space) gap states.
* **Features Extracted:**
  - `multi_space_ratio`: Percentage of inter-word gaps larger than a single standard space.
  - `gap_variance`: Variance in inter-word gap widths.
  - `bimodal_entropy`: Shannon entropy between the two most dominant gap states.
* **Thresholds:**
  - Natural prose: $< 5\%$ multi-space gaps, low bimodal entropy.
  - Word-shift steganography: $> 25\%$ multi-space gaps, bimodal entropy $> 0.50$ ($score \ge 0.50$).

### C. Line-Shift Steganalysis
* **Principle:** Alternates vertical distance between lines or modulates blank-line periodicity.
* **Scope & Limitation:** In raw unformatted `.txt` files, physical font baseline displacements (points/millimeters) are not physically encoded. The detector explicitly evaluates logical paragraph breaks and blank-line periodicity rather than fabricating physical visual coordinates.

---

## 3. Evidence-Based Fusion & Scoring
The text detector computes an uncalibrated **Steganalysis Evidence Score** $\in [0.0, 1.0]$:
$$Score = 0.75 \times \max(S_{ws}, S_{word}, S_{line}) + 0.25 \times \text{secondary}$$

* $Score < 0.45$: **CLEAN**
* $Score \ge 0.45$: **SUSPICIOUS**

---

## 4. API Usage

### Endpoint: `POST /api/steganalysis/text`
#### JSON Payload:
```bash
curl -X POST "http://127.0.0.1:8000/api/steganalysis/text" \
     -H "Content-Type: application/json" \
     -d '{"text": "Line with hidden tabs and spaces   \t\nNext line\t \t"}'
```

#### File Upload:
```bash
curl -X POST "http://127.0.0.1:8000/api/steganalysis/text" \
     -F "file=@document.txt"
```