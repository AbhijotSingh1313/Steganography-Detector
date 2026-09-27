import React, { useState } from 'react';
import {
  History,
  Search,
  Trash2,
  Eye,
  FileSearch,
  Filter,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';

export default function AnalysisHistory({
  history = [],
  onSelectCase,
  onDeleteCase,
  onClearHistory,
  onNewScan
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const filtered = history.filter((item) => {
    const matchesSearch = item.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || item.result?.toUpperCase() === filterType;
    return matchesSearch && matchesType;
  });

  const getResultBadge = (result) => {
    switch (result?.toLowerCase()) {
      case 'clean':
        return (
          <span className="status-badge clean">
            <ShieldCheck size={13} /> Clean
          </span>
        );
      case 'suspicious':
        return (
          <span className="status-badge suspicious">
            <AlertTriangle size={13} /> Suspicious
          </span>
        );
      case 'stego':
        return (
          <span className="status-badge stego">
            <ShieldAlert size={13} /> Stego
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Controls Bar */}
      <div className="cyber-card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '240px' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '36px' }}
                placeholder="Search file name or Case ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={15} style={{ color: 'var(--text-muted)' }} />
              <select
                className="form-select"
                style={{ width: 'auto', padding: '8px 12px' }}
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="ALL">All Outcomes</option>
                <option value="CLEAN">Clean</option>
                <option value="SUSPICIOUS">Suspicious</option>
                <option value="STEGO">Stego</option>
              </select>
            </div>
          </div>

          {history.length > 0 && (
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => {
                if (window.confirm('Clear all analysis history?')) onClearHistory();
              }}
            >
              <Trash2 size={14} />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* History Table or Empty State */}
      {history.length === 0 ? (
        <div className="cyber-card empty-state">
          <div className="empty-state-icon">
            <History size={32} />
          </div>
          <h3>No Analysis History Yet</h3>
          <p>Files that you analyze will appear here with detailed records and classifications.</p>
          <button type="button" className="btn btn-primary" onClick={onNewScan}>
            Start First Analysis
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="cyber-card empty-state">
          <div className="empty-state-icon">
            <FileSearch size={32} />
          </div>
          <h3>No matching records</h3>
          <p>Try adjusting your search query or filter criteria.</p>
        </div>
      ) : (
        <div className="cyber-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>File Name</th>
                  <th>Type</th>
                  <th>Result</th>
                  <th>Confidence</th>
                  <th>Date & Time</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {item.id}
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.fileName}</td>
                    <td><span className="format-pill">{item.fileType}</span></td>
                    <td>{getResultBadge(item.result)}</td>
                    <td style={{ fontWeight: 600 }}>{item.confidence}%</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {item.dateFormatted}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => onSelectCase(item)}
                          title="View Case Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => onDeleteCase(item.id)}
                          title="Delete Record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
