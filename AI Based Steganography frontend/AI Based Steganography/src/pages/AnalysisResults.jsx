import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  FileText,
  FileSearch,
  CheckCircle2,
  Calendar,
  HardDrive
} from 'lucide-react';

export default function AnalysisResults({ caseData, onNewScan, onViewReport }) {
  if (!caseData) {
    return (
      <div className="cyber-card empty-state">
        <div className="empty-state-icon">
          <FileSearch size={32} />
        </div>
        <h3>No Analysis Selected</h3>
        <p>Run a new steganography scan to see forensic classifications and confidence scores.</p>
        <button type="button" className="btn btn-primary" onClick={onNewScan}>
          Start New Analysis
        </button>
      </div>
    );
  }

  const getResultBadge = (result) => {
    switch (result?.toLowerCase()) {
      case 'clean':
        return (
          <div className="status-badge clean">
            <ShieldCheck size={16} />
            <span>CLEAN - NO HIDDEN DATA</span>
          </div>
        );
      case 'suspicious':
        return (
          <div className="status-badge suspicious">
            <AlertTriangle size={16} />
            <span>SUSPICIOUS - ANOMALY DETECTED</span>
          </div>
        );
      case 'stego':
        return (
          <div className="status-badge stego">
            <ShieldAlert size={16} />
            <span>STEGO - CONCEALED PAYLOAD FOUND</span>
          </div>
        );
      default:
        return null;
    }
  };

  const getRiskIndicator = (risk) => {
    const r = risk?.toLowerCase() || 'low';
    return (
      <span className={`risk-indicator ${r}`}>
        {risk?.toUpperCase() || 'LOW'} RISK
      </span>
    );
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Top Banner Card */}
      <div className="cyber-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {caseData.id}
              </span>
              {getResultBadge(caseData.result)}
              {getRiskIndicator(caseData.riskLevel)}
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {caseData.fileName}
            </h2>
            <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <HardDrive size={14} /> {caseData.fileSize}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} /> {caseData.dateFormatted}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onViewReport(caseData)}
            >
              <FileText size={16} />
              <span>View Report</span>
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onNewScan}
            >
              <RotateCcw size={16} />
              <span>New Analysis</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <div className="cyber-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Detection Classification</span>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '6px', color: 'var(--text-primary)' }}>
            {caseData.result}
          </h3>
        </div>

        <div className="cyber-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>AI Confidence Score</span>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '6px', color: 'var(--color-primary)' }}>
            {caseData.confidence}%
          </h3>
        </div>

        <div className="cyber-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Assessed Risk Level</span>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '6px', color: caseData.riskLevel === 'High' ? 'var(--color-stego)' : caseData.riskLevel === 'Medium' ? 'var(--color-suspicious)' : 'var(--color-clean)' }}>
            {caseData.riskLevel}
          </h3>
        </div>
      </div>

      {/* Findings & Recommendations */}
      <div className="cyber-card">
        <div className="card-header">
          <h4 className="card-title">
            <CheckCircle2 size={18} style={{ color: 'var(--color-primary)' }} />
            <span>Forensic Findings & Recommendation</span>
          </h4>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <strong style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Key Findings:
            </strong>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {caseData.findings}
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
            <strong style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Actionable Recommendation:
            </strong>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {caseData.recommendation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
