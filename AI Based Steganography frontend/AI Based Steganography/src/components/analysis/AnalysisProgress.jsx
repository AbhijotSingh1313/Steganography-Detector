import React from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function AnalysisProgress({ currentStage, fileName }) {
  const stages = [
    'Preprocessing & Format Verification',
    'Extracting Statistical Bitplane Profiles',
    'Running Neural Steganalysis Inference',
    'Generating Forensic Confidence Report'
  ];

  const currentIndex = stages.indexOf(currentStage);

  return (
    <div className="analysis-progress-wrapper">
      <div className="cyber-card" style={{ padding: '36px 28px' }}>
        <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'var(--color-primary-dim)', color: 'var(--color-primary)', marginBottom: '16px' }}>
          <Loader2 size={36} className="spin" style={{ animation: 'spin 1.5s linear infinite' }} />
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>
          Analyzing Forensic Payload
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Target File: <strong style={{ color: 'var(--text-primary)' }}>{fileName}</strong>
        </p>

        <div className="progress-stages-list">
          {stages.map((stage, idx) => {
            const isDone = currentIndex > idx;
            const isActive = currentIndex === idx;

            return (
              <div
                key={stage}
                className={`stage-item ${isDone ? 'completed' : ''} ${isActive ? 'active' : ''}`}
              >
                {isDone ? (
                  <CheckCircle2 size={18} style={{ color: 'var(--color-clean)' }} />
                ) : (
                  <span className="stage-dot"></span>
                )}
                <span style={{ fontSize: '0.86rem', fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {stage}
                </span>
              </div>
            );
          })}
        </div>

        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Please wait while neural steganography heuristics process the file...
        </span>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
