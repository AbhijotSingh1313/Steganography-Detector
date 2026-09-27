import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import NewAnalysis from './pages/NewAnalysis';
import AnalysisResults from './pages/AnalysisResults';
import AnalysisHistory from './pages/AnalysisHistory';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AuthModal from './components/auth/AuthModal';
import UserProfileModal from './components/profile/UserProfileModal';
import SwitchAccountModal from './components/profile/SwitchAccountModal';
import DesktopAuthScreen from './components/desktop/DesktopAuthScreen';
import { analysisService } from './services/mockAnalysisService';
import { authService } from './services/authService';

// Helper to detect if running inside the desktop Electron .exe app
const isDesktopApp = () => {
  if (typeof window !== 'undefined') {
    if (window.electronAPI?.isElectron) return true;
    if (navigator.userAgent && navigator.userAgent.toLowerCase().includes('electron')) return true;
    // Packaged Electron apps load from file:// protocol
    if (window.location.protocol === 'file:') return true;
  }
  return false;
};

export default function App() {
  // Desktop app: shows auth screen first, then workspace
  // Web browser: lands on the frontpage portal
  const [viewMode, setViewMode] = useState(() => (isDesktopApp() ? 'app' : 'landing'));
  const [activePage, setActivePage] = useState('new-analysis');
  const [history, setHistory] = useState(() => analysisService.getHistory(authService.getCurrentUser()?.id));
  const [currentCase, setCurrentCase] = useState(null);
  const [selectedScanType, setSelectedScanType] = useState(null);
  const [selectedScanFile, setSelectedScanFile] = useState(null);
  const [theme, setTheme] = useState('dark');
  const isDesktop = isDesktopApp();

  // Authentication & Profile State
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [authNotice, setAuthNotice] = useState('');
  const [pendingTarget, setPendingTarget] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [switchAccountModalOpen, setSwitchAccountModalOpen] = useState(false);

  useEffect(() => {
    const savedSettings = analysisService.getSettings();
    if (savedSettings?.theme) {
      setTheme(savedSettings.theme);
      document.documentElement.setAttribute('data-theme', savedSettings.theme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  // Keep React auth state synchronized if localStorage accounts were cleared or reset
  useEffect(() => {
    const active = authService.getCurrentUser();
    if (!active && currentUser) {
      setCurrentUser(null);
      setHistory(analysisService.getHistory(null));
      setCurrentCase(null);
    }
  }, [currentUser]);

  // Automatic 2-hour inactivity auto-logout monitor
  useEffect(() => {
    if (!currentUser) return;

    // Refresh last active timestamp on mount/user login
    authService.recordActivity();

    let lastRecorded = Date.now();
    const handleUserActivity = () => {
      const now = Date.now();
      // Throttle activity recording to at most once every 30 seconds
      if (now - lastRecorded > 30000) {
        authService.recordActivity();
        lastRecorded = now;
      }
    };

    const checkInactivity = () => {
      if (authService.isSessionExpired()) {
        authService.logout();
        setCurrentUser(null);
        setProfileModalOpen(false);
        setSwitchAccountModalOpen(false);
        const notice = 'Your account was automatically logged out due to 3 hours of inactivity. Please sign in again.';
        setAuthNotice(notice);
        if (!isDesktop) {
          setViewMode('landing');
          handleOpenAuthModal('login', notice);
        }
      }
    };

    // Cross-tab logout synchronization
    const handleStorage = (e) => {
      if (e.key === 'stegxplore_current_user' && !e.newValue) {
        setCurrentUser(null);
        setProfileModalOpen(false);
        if (!isDesktop) {
          setViewMode('landing');
        }
      }
    };

    // Activity event listeners across the window
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    // Check inactivity every 30 seconds
    const intervalId = setInterval(checkInactivity, 30000);

    // Immediate check when tab regains focus or visibility
    window.addEventListener('focus', checkInactivity);
    document.addEventListener('visibilitychange', checkInactivity);
    window.addEventListener('storage', handleStorage);

    return () => {
      activityEvents.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      clearInterval(intervalId);
      window.removeEventListener('focus', checkInactivity);
      document.removeEventListener('visibilitychange', checkInactivity);
      window.removeEventListener('storage', handleStorage);
    };
  }, [currentUser, isDesktop]);

  const handleToggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    analysisService.saveSettings({ ...analysisService.getSettings(), theme: newTheme });
  };

  const handleOpenAuthModal = (mode = 'login', notice = '', target = null) => {
    setAuthModalMode(mode);
    setAuthNotice(notice);
    setPendingTarget(target);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setAuthModalOpen(false);
    // Load this user's own history on login
    setHistory(analysisService.getHistory(user?.id));
    setCurrentCase(null);
    if (pendingTarget === 'app') {
      setViewMode('app');
      setActivePage('new-analysis');
    }
    setPendingTarget(null);
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setHistory([]);
    setCurrentCase(null);
    setProfileModalOpen(false);
    setSwitchAccountModalOpen(false);
    setSelectedScanType(null);
    setSelectedScanFile(null);
    // On desktop, stay in 'app' viewMode — DesktopAuthScreen renders automatically
    // On web, go back to landing page
    if (!isDesktop) {
      setViewMode('landing');
    }
  };

  const handleUpdateUser = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  const handleSwitchAccountSuccess = (user) => {
    setCurrentUser(user);
    // Load the switched account's own history
    setHistory(analysisService.getHistory(user?.id));
    setCurrentCase(null);
    setSwitchAccountModalOpen(false);
    setSelectedScanType(null);
    setSelectedScanFile(null);
    setActivePage('new-analysis');
    setViewMode('app');
  };

  const handleLaunchOnline = () => {
    // Reset scan state on entering web app from portal/landing
    setSelectedScanType(null);
    setSelectedScanFile(null);
    if (currentUser) {
      // User is already logged in - enter directly without asking for login!
      setViewMode('app');
      setActivePage('new-analysis');
    } else {
      // User is not logged in - prompt for login/signup first
      handleOpenAuthModal('login', 'Please sign in or create an account to access the Web App', 'app');
    }
  };

  const handleGoHome = () => {
    // Reset scan state when leaving web app to home portal
    setSelectedScanType(null);
    setSelectedScanFile(null);
    if (!isDesktop) {
      setViewMode('landing');
    } else {
      setActivePage('new-analysis');
    }
  };

  const handleNewScan = () => {
    setSelectedScanType(null);
    setSelectedScanFile(null);
    setActivePage('new-analysis');
  };

  const handleNavigate = (page) => {
    if (page !== activePage) {
      // If moving away from new-analysis or switching pages, refresh new-analysis selection
      setSelectedScanType(null);
      setSelectedScanFile(null);
    }
    setActivePage(page);
  };

  const handleAnalysisComplete = (newResult) => {
    setCurrentCase(newResult);
    setHistory(analysisService.getHistory(currentUser?.id));
    setSelectedScanType(null);
    setSelectedScanFile(null);
    setActivePage('analysis-results');
  };

  const handleSelectCase = (caseItem) => {
    setCurrentCase(caseItem);
    setActivePage('analysis-results');
  };

  const handleDeleteCase = (id) => {
    const updated = analysisService.deleteCase(id, currentUser?.id);
    setHistory(updated);
    if (currentCase && currentCase.id === id) {
      setCurrentCase(updated[0] || null);
    }
  };

  const handleClearHistory = () => {
    const updated = analysisService.clearAllHistory(currentUser?.id);
    setHistory(updated);
    setCurrentCase(null);
  };

  // ── DESKTOP APP: Show full-screen auth gate when no user is logged in ──
  if (isDesktop && !currentUser) {
    return (
      <DesktopAuthScreen
        initialNotice={authNotice}
        onSuccess={(user) => {
          setAuthNotice('');
          setCurrentUser(user);
          setHistory(analysisService.getHistory(user?.id));
          setCurrentCase(null);
          setActivePage('new-analysis');
        }}
      />
    );
  }

  // ── WEB BROWSER: Show landing/frontpage portal ──
  if (viewMode === 'landing' && !isDesktop) {
    return (
      <>
        <LandingPage
          onLaunchOnline={handleLaunchOnline}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          currentUser={currentUser}
          onOpenAuthModal={(mode, notice, target) => handleOpenAuthModal(mode, notice, target)}
          onOpenProfile={() => setProfileModalOpen(true)}
          onLogout={handleLogout}
        />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authModalMode}
          titleNotice={authNotice}
          onSuccess={handleAuthSuccess}
        />
        <UserProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          currentUser={currentUser}
          onUpdateUser={handleUpdateUser}
          onLogout={handleLogout}
          onOpenSwitchAccount={() => setSwitchAccountModalOpen(true)}
        />
        <SwitchAccountModal
          isOpen={switchAccountModalOpen}
          onClose={() => setSwitchAccountModalOpen(false)}
          currentUser={currentUser}
          onSwitchSuccess={handleSwitchAccountSuccess}
          onOpenAuthModal={(mode, notice) => handleOpenAuthModal(mode, notice)}
        />
      </>
    );
  }

  // Otherwise, show the Full Forensic Application (Directly on Desktop App or when Online is clicked)
  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        onGoHome={handleGoHome}
        isDesktop={isDesktop}
        currentUser={currentUser}
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenSwitchAccount={() => setSwitchAccountModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <Header
          activePage={activePage}
          onGoHome={handleGoHome}
          currentUser={currentUser}
          onOpenProfile={() => setProfileModalOpen(true)}
        />

        <main className="page-content">
          {activePage === 'new-analysis' && (
            <NewAnalysis
              selectedType={selectedScanType}
              onSelectType={setSelectedScanType}
              selectedFile={selectedScanFile}
              onSelectFile={setSelectedScanFile}
              onAnalysisComplete={handleAnalysisComplete}
              currentUserId={currentUser?.id}
            />
          )}

          {activePage === 'analysis-results' && (
            <AnalysisResults
              caseData={currentCase}
              onNewScan={handleNewScan}
              onViewReport={(c) => {
                setCurrentCase(c);
                setActivePage('reports');
              }}
            />
          )}

          {activePage === 'analysis-history' && (
            <AnalysisHistory
              history={history}
              onSelectCase={handleSelectCase}
              onDeleteCase={handleDeleteCase}
              onClearAll={handleClearHistory}
              onNewScan={handleNewScan}
            />
          )}

          {activePage === 'reports' && (
            <Reports
              currentCase={currentCase}
              allCases={history}
              onSelectCase={handleSelectCase}
              onNewScan={handleNewScan}
            />
          )}

          {activePage === 'settings' && (
            <Settings
              theme={theme}
              onToggleTheme={handleToggleTheme}
              onClearHistory={handleClearHistory}
              currentUser={currentUser}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        titleNotice={authNotice}
        onSuccess={handleAuthSuccess}
      />

      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        currentUser={currentUser}
        onUpdateUser={handleUpdateUser}
        onLogout={handleLogout}
        onOpenSwitchAccount={() => setSwitchAccountModalOpen(true)}
      />

      <SwitchAccountModal
        isOpen={switchAccountModalOpen}
        onClose={() => setSwitchAccountModalOpen(false)}
        currentUser={currentUser}
        onSwitchSuccess={handleSwitchAccountSuccess}
        onLogout={handleLogout}
        onOpenAuthModal={(mode, notice) => handleOpenAuthModal(mode, notice)}
      />
    </div>
  );
}
