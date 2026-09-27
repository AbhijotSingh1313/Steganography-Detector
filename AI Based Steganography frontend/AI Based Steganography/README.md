# StegoDetect AI - Multimedia Steganography Detection

A clean, modern desktop application built with **React**, **Vite**, and **Electron** for detecting potential hidden information in **Images**, **Text Documents**, and **Network Capture (PCAP)** files.

---

## 📦 Windows `.exe` Executables

The application has been packaged for Windows and is available in the `dist-installer/` directory:

| Executable | Type | Description |
| :--- | :--- | :--- |
| **`StegoDetect AI Setup 1.0.0.exe`** | **Installer** | Standard Windows NSIS installer. Creates desktop & Start Menu shortcuts and installs the application. |
| **`StegoDetect AI 1.0.0.exe`** | **Portable** | Standalone portable executable. Runs immediately on any Windows PC with no installation required. |

To build new `.exe` packages at any time, run:
```bash
npm run build:exe
```

---

## 🚀 Running in Development

### 1. Browser Mode
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

### 2. Live Electron Window
```bash
npm run electron:dev
```

### 3. Production Web Bundle
```bash
npm run build
```

---

## 📱 Navigation Structure

- **New Analysis** (Default Landing Screen): Choose file type (Image, Text, Network Capture), drag and drop or browse files, and start analysis.
- **Analysis History**: View and manage previous file analyses with real-time filtering and search (empty until analyses are completed).
- **Reports**: View and export formal analysis summary reports.
- **Settings**: Toggle between Dark and Light mode, clear local history data, and view application info.

---

## 🔌 Backend Integration Guide

The frontend uses a centralized service interface in [mockAnalysisService.js](file:///src/services/mockAnalysisService.js). When connecting to your Python / PyTorch backend:
1. Update `processAnalysis()` to send an HTTP POST request to your API endpoint (e.g. `http://localhost:8000/api/analyze`).
2. Map the response object into `{ fileName, fileType, result, confidence, riskLevel, findings, recommendation }`.
3. The UI components will automatically render the live backend data.
