import React from 'react';
import { Shield, AlertTriangle, AlertCircle } from 'lucide-react';

export default function RiskIndicator({ level = 'Low' }) {
  const norm = (level || 'Low').toLowerCase();

  let className = 'risk-indicator low';
  let icon = <Shield size={14} />;
  let label = 'Low Risk';

  if (norm === 'medium' || norm === 'moderate') {
    className = 'risk-indicator medium';
    icon = <AlertTriangle size={14} />;
    label = 'Medium Risk';
  } else if (norm === 'high' || norm === 'critical') {
    className = 'risk-indicator high';
    icon = <AlertCircle size={14} />;
    label = 'High Risk';
  }

  return (
    <div className={className}>
      {icon}
      <span>{label}</span>
    </div>
  );
}
