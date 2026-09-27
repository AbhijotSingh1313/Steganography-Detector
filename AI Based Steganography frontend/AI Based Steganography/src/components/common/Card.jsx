import React from 'react';

export default function Card({ title, icon, action, children, className = '', style = {} }) {
  return (
    <div className={`cyber-card ${className}`} style={style}>
      {(title || action) && (
        <div className="card-header">
          {title && (
            <div className="card-title">
              {icon && <span style={{ color: 'var(--color-cyan)', display: 'flex', alignItems: 'center' }}>{icon}</span>}
              {title}
            </div>
          )}
          {action && <div className="card-action">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
