import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle } from 'lucide-react';

export default function StatusBadge({ status }) {
  const norm = (status || '').toLowerCase();

  if (norm === 'clean') {
    return (
      <span className="status-badge clean">
        <ShieldCheck size={14} />
        Clean
      </span>
    );
  }

  if (norm === 'suspicious') {
    return (
      <span className="status-badge suspicious">
        <AlertTriangle size={14} />
        Suspicious
      </span>
    );
  }

  return (
    <span className="status-badge stego">
      <AlertCircle size={14} />
      Hidden Content Detected
    </span>
  );
}
