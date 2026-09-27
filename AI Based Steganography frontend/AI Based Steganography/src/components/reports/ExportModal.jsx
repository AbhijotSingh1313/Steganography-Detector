import React, { useState } from 'react';
import { Download, CheckCircle2, X } from 'lucide-react';

export default function ExportModal({ isOpen, onClose, caseData }) {
  const [format, setFormat] = useState('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !caseData) return null;

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1200);
    }, 800);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Export Report</h3>
          <button
            onClick={onClose}
            type="button"
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
          Export analysis report for <strong>{caseData.fileName}</strong>.
        </p>

        {/* Format Selector */}
        <div className="form-group">
          <label className="form-label">Format</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {[
              { id: 'pdf', label: 'PDF Document (.pdf)' },
              { id: 'json', label: 'JSON Data (.json)' }
            ].map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                className={`btn btn-sm ${format === fmt.id ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFormat(fmt.id)}
              >
                {fmt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button className="btn btn-secondary" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleExport}
            disabled={isExporting || isSuccess}
            type="button"
          >
            {isSuccess ? (
              <>
                <CheckCircle2 size={15} />
                <span>Exported!</span>
              </>
            ) : isExporting ? (
              <span>Exporting...</span>
            ) : (
              <>
                <Download size={15} />
                <span>Download</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
