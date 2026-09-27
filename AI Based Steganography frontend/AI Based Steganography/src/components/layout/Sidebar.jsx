import {
  Scan,
  History,
  FileText,
  Settings,
  Home,
  LogOut,
  Users
} from 'lucide-react';
import { getUserShortcut } from '../../services/authService';
import stegxploreLogo from '../../assets/stegxplore-logo.jpg';


export default function Sidebar({
  activePage,
  onNavigate,
  onGoHome,
  isDesktop,
  currentUser,
  onOpenProfile,
  onLogout,
  onOpenSwitchAccount
}) {
  const menuItems = [
    { id: 'new-analysis', label: 'New Analysis', icon: <Scan className="nav-icon" /> },
    { id: 'analysis-history', label: 'Analysis History', icon: <History className="nav-icon" /> },
    { id: 'reports', label: 'Reports', icon: <FileText className="nav-icon" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="nav-icon" /> }
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div
        className="sidebar-header"
        onClick={() => {
          if (!isDesktop) onGoHome();
          else onNavigate('new-analysis');
        }}
        style={{ cursor: 'pointer' }}
        title={!isDesktop ? 'Return to Frontpage Portal' : 'New Analysis'}
      >
        <div className="landing-brand-logo-wrapper" style={{ width: '42px', height: '42px', borderRadius: '12px' }}>
          <img src={stegxploreLogo} alt="StegXplore" className="landing-brand-logo-img" />
        </div>
        <div className="brand-title-wrap">
          <span className="brand-name" style={{ fontSize: '1.3rem' }}>
            <span className="brand-text-steg" style={{ fontSize: '1.3rem' }}>Steg</span>
            <span className="brand-x-creative" style={{ fontSize: '1.65rem' }}>X</span>
            <span className="brand-text-plore" style={{ fontSize: '1.3rem' }}>plore</span>
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
              type="button"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Section & Home Portal */}
      <div className="sidebar-bottom-action">
        {currentUser && (
          <div className="sidebar-user-card" style={{ marginBottom: !isDesktop ? '8px' : '0' }}>
            <div
              className="sidebar-user-details"
              onClick={onOpenProfile}
              style={{ cursor: 'pointer' }}
              title="Manage Profile"
            >
              <div className="user-avatar-circle" style={{ width: '26px', height: '26px', fontSize: '0.66rem', fontWeight: 750 }}>
                {getUserShortcut(currentUser.name)}
              </div>
              <div className="sidebar-user-meta">
                <span className="sidebar-user-meta-name">{currentUser.name}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                className="sidebar-user-switch-btn"
                onClick={onOpenSwitchAccount}
                title="Switch Account"
              >
                <Users size={14} />
              </button>
              <button
                type="button"
                className="sidebar-user-logout-btn"
                onClick={onLogout}
                title="Sign Out"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Home Portal option in web browser mode */}
        {!isDesktop && (
          <button
            className="home-portal-btn"
            onClick={onGoHome}
            type="button"
            title="Go to Frontpage / Download options"
          >
            <span className="home-portal-icon-wrapper">
              <Home size={19} className="home-portal-icon" />
            </span>
            <span className="home-portal-label">Home Portal</span>
          </button>
        )}
      </div>
    </aside>
  );
}
