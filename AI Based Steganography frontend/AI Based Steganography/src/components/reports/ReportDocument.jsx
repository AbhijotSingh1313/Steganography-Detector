import React from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import RiskIndicator from '../common/RiskIndicator';

export default function ReportDocument({ caseData }) {
  if (!caseData) return null;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
        color: 'var(--text-primary)'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            Steganography Analysis Report
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            StegoDetect Analysis Summary
          </p>
        </div>

        <div style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <div>Date: {caseData.date}</div>
        </div>
      </div>

      {/* Case Details */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
          File Information
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', background: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>File Name</span>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{caseData.fileName}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>File Type</span>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{(caseData.fileType || '').toUpperCase()}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>File Size</span>
            <div style={{ fontSize: '0.9rem' }}>{caseData.fileSize}</div>
          </div>
        </div>
      </div>

      {/* Result Summary */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
          Analysis Outcome
        </h3>
        <div style={{ display: 'flex', gap: '16px', background: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Detection Result</span>
            <div style={{ marginTop: '4px' }}>
              <StatusBadge status={caseData.result} />
            </div>
          </div>
          {caseData.riskLevel && (
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Risk Level</span>
              <div style={{ marginTop: '4px' }}>
                <RiskIndicator level={caseData.riskLevel} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Findings */}
      {caseData.findings && caseData.findings.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
            Findings
          </h3>
          <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {caseData.findings.map((finding, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                  <CheckCircle2 size={15} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }} />
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Recommendation */}
      {caseData.recommendation && (
        <div>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
            Recommendation
          </h3>
          <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            {caseData.recommendation}
          </div>
        </div>
      )}
    </div>
  );
}
