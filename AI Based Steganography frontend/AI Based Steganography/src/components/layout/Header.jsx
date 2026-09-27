import React from 'react';
import { Scan, ShieldCheck, Sparkles } from 'lucide-react';
import { getUserShortcut } from '../../services/authService';

export default function Header({
  activePage,
  currentUser,
  onOpenProfile
}) {
  const getPageInfo = () => {
    switch (activePage) {
      case 'new-analysis':
        return {
          title: 'Analyze a File',
          icon: <Scan size={20} className="attractive-header-icon" />
        };
      case 'analysis-results':
        return {
          title: 'Analysis Results',
          icon: <Sparkles size={20} className="attractive-header-icon" />
        };
      case 'analysis-history':
        return {
          title: 'Analysis History',
          icon: <Sparkles size={20} className="attractive-header-icon" />
        };
      case 'reports':
        return {
          title: 'Forensic Reports',
          icon: <Sparkles size={20} className="attractive-header-icon" />
        };
      case 'about':
        return {
          title: 'About the Project',
          icon: <ShieldCheck size={20} className="attractive-header-icon" />
        };
      case 'settings':
        return {
          title: 'Settings',
          icon: null
        };
      default:
        return {
          title: 'Forensic Console',
          icon: null
        };
    }
  };

  const { title, icon } = getPageInfo();

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="attractive-title-container">
          {icon && (
            <div className="attractive-icon-badge">
              {icon}
            </div>
          )}
          <h2 className="attractive-page-title">{title}</h2>
        </div>
      </div>

      <div className="header-right">
        {currentUser && (
          <div className="header-user-profile-zone">
            <span className="header-user-greeting">
              <span className="greeting-hello-text">Hello,</span>{' '}
              <span className="header-greeting-name">{currentUser.name}</span>
            </span>
            <button
              type="button"
              className="header-user-profile-btn"
              onClick={onOpenProfile}
              title={`View Profile: ${currentUser.name}`}
            >
              <div className="user-avatar-circle" style={{ width: '34px', height: '34px', fontSize: '0.82rem', fontWeight: 750 }}>
                {getUserShortcut(currentUser.name)}
              </div>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
