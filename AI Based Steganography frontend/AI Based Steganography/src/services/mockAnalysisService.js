// Central Service Layer for Steganography Analysis
// Connected directly to the live Python FastAPI backend at http://localhost:8000/api/analyze
// History is stored PER-USER to prevent cross-account leakage.

const STORAGE_KEYS = {
  SETTINGS: 'stegodetect_settings'
};

const DEFAULT_SETTINGS = {
  theme: 'dark',
  autoClearTemp: true,
  sensitivity: 'standard'
};

// Returns the per-user localStorage key for a given user identifier (ID, email, or user object)
function historyKey(userOrId) {
  if (!userOrId) return 'stegodetect_analysis_history_guest';
  if (typeof userOrId === 'object') {
    const keyPart = userOrId.id || (userOrId.email ? userOrId.email.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'guest');
    return `stegodetect_analysis_history_${keyPart}`;
  }
  const str = String(userOrId).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  return `stegodetect_analysis_history_${str}`;
}

export const analysisService = {
  // Get the history for a specific user (or the current active user if no ID provided)
  getHistory(userId) {
    try {
      const data = localStorage.getItem(historyKey(userId));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveHistory(history, userId) {
    try {
      localStorage.setItem(historyKey(userId), JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  },

  deleteCase(id, userId) {
    const history = this.getHistory(userId).filter((c) => c.id !== id);
    this.saveHistory(history, userId);
    return history;
  },

  clearAllHistory(userId) {
    this.saveHistory([], userId);
    return [];
  },

  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  },

  // Live analysis pipeline calling the backend
  async processAnalysis(fileData, domain = 'image', onStageChange = () => {}, userId) {
    const stages = [
      'Preprocessing & Format Verification',
      'Extracting Statistical Bitplane Profiles',
      'Running Neural Steganalysis Inference',
      'Generating Forensic Confidence Report'
    ];

    let currentStage = 0;
    onStageChange(stages[currentStage]);

    // Animate stage transitions smoothly during processing
    const interval = setInterval(() => {
      currentStage += 1;
      if (currentStage < stages.length) {
        onStageChange(stages[currentStage]);
      }
    }, 600);

    try {
      const formData = new FormData();
      if (fileData.rawFile) {
        formData.append('file', fileData.rawFile, fileData.name);
      } else {
        // Fallback if passing Blob or mock object
        const blob = new Blob([fileData.content || ''], { type: fileData.type || 'text/plain' });
        formData.append('file', blob, fileData.name || 'document.txt');
      }
      formData.append('domain', domain);

      // Determine backend API URL (supports Vite dev port 5173, Electron file://, or production same-host)
      const isDevOrElectron =
        window.location.port === '5173' ||
        window.location.protocol === 'file:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

      const API_BASE = isDevOrElectron ? 'http://localhost:8000' : window.location.origin;

      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        body: formData
      });

      clearInterval(interval);
      onStageChange(stages[stages.length - 1]);

      if (!response.ok) {
        let errDetail = `Server returned HTTP ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson.detail) errDetail = errJson.detail;
        } catch {
          // Keep errDetail
        }
        throw new Error(errDetail);
      }

      const backendData = await response.json();

      const newCase = {
        id: backendData.id || `CASE-${Date.now().toString().slice(-6)}`,
        fileName: backendData.fileName || fileData.name || 'Sample_File.dat',
        fileSize: backendData.fileSize || (fileData.size ? `${(fileData.size / 1024).toFixed(1)} KB` : '420 KB'),
        fileType: backendData.fileType || domain.toUpperCase(),
        timestamp: backendData.timestamp || new Date().toISOString(),
        dateFormatted: backendData.dateFormatted || new Date().toLocaleString(),
        result: backendData.result,
        riskLevel: backendData.riskLevel,
        confidence: backendData.confidence,
        findings: backendData.findings,
        recommendation: backendData.recommendation,
        details: backendData.details
      };

      const history = this.getHistory(userId);
      this.saveHistory([newCase, ...history], userId);
      return newCase;
    } catch (err) {
      clearInterval(interval);
      console.error('Steganalysis backend request failed:', err);

      const errorCase = {
        id: `ERR-${Date.now().toString().slice(-6)}`,
        fileName: fileData.name || 'Uploaded_File',
        fileSize: fileData.size ? `${(fileData.size / 1024).toFixed(1)} KB` : '0 KB',
        fileType: domain.toUpperCase(),
        timestamp: new Date().toISOString(),
        dateFormatted: new Date().toLocaleString(),
        result: 'Suspicious',
        riskLevel: 'Medium',
        confidence: 0,
        findings: `Analysis request failed: ${err.message || 'Could not connect to FastAPI backend at http://localhost:8000'}. Make sure the backend server is running.`,
        recommendation: 'Check backend server connection at http://localhost:8000 and verify the uploaded file format.'
      };

      const history = this.getHistory(userId);
      this.saveHistory([errorCase, ...history], userId);
      return errorCase;
    }
  }
};
