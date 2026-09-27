import React from 'react';
import { File, Image as ImageIcon, FileText, Network, X } from 'lucide-react';

export default function FilePreviewCard({ file, type, onRemove }) {
  const getIcon = () => {
    switch (type) {
      case 'image':
        return <ImageIcon size={24} style={{ color: 'var(--color-primary)' }} />;
      case 'text':
        return <FileText size={24} style={{ color: 'var(--color-primary)' }} />;
      case 'pcap':
        return <Network size={24} style={{ color: 'var(--color-primary)' }} />;
      default:
        return <File size={24} style={{ color: 'var(--color-primary)' }} />;
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="file-preview-card">
      <div className="file-preview-left">
        {file.preview ? (
          <img src={file.preview} alt="File Preview" className="preview-thumb" />
        ) : (
          <div className="preview-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {getIcon()}
          </div>
        )}
        <div className="file-meta-box">
          <h4>{file.name}</h4>
          <div className="file-meta-chips">
            <span className="file-meta-chip">Size: {formatSize(file.size)}</span>
            <span className="file-meta-chip">Type: {type.toUpperCase()}</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={onRemove}
        title="Remove file"
      >
        <X size={16} />
        <span>Remove</span>
      </button>
    </div>
  );
}
