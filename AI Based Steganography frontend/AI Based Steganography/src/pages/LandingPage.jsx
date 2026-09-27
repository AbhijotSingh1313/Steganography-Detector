import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import {
  ShieldCheck,
  Download,
  Globe,
  ArrowRight,
  Image as ImageIcon,
  FileText,
  Network,
  CheckCircle2,
  Monitor,
  Moon,
  Sun,
  Cpu,
  Layers,
  Shield,
  Zap,
  HardDrive,
  ChevronRight,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X as CloseIcon,
  Lock
} from 'lucide-react';
import { getUserShortcut } from '../services/authService';
import ForensicHeroVisual from '../components/landing/ForensicHeroVisual';
import ParticleBackground from '../components/landing/ParticleBackground';
import stegxploreLogo from '../assets/stegxplore-logo.jpg';


export default function LandingPage({
  onLaunchOnline,
  theme,
  onToggleTheme,
  currentUser,
  onOpenAuthModal,
  onOpenProfile,
  onLogout
}) {
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState('home');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themeAnimating, setThemeAnimating] = useState(false);
  const [showLaunchPrompt, setShowLaunchPrompt] = useState(false);
  const pageContainerRef = useRef(null);
  const navLinksRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
  // When true we suppress the CSS slide transition so the pill snaps instantly
  // (used on auth-state changes to prevent animating from a stale position)
  const suppressTransitionRef = useRef(false);

  // ── Core measurement function ──────────────────────────────────────────────
  // Uses getBoundingClientRect() relative to the nav container.
  // This is immune to flex layout shifts because it always calculates
  // container-local left (activeRect.left - navRect.left), never viewport-left.
  const measureIndicator = useCallback((skipTransition = false) => {
    const nav = navLinksRef.current;
    if (!nav) return;

    // Re-query inside the container every time — never cache the element
    const activeBtn = nav.querySelector(`.nav-link-btn[data-tab]`);
    // Find the button that matches activeNavTab; we read it from a ref so
    // this callback doesn't need activeNavTab in its dep array.
    // We look for the .active class which React has already applied by now.
    const activeBtnExact = nav.querySelector(`.nav-link-btn.active`);
    const target = activeBtnExact || activeBtn;

    if (!target) {
      setIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
      return;
    }

    const navRect = nav.getBoundingClientRect();
    const btnRect = target.getBoundingClientRect();

    // left is relative to the nav container, not the viewport
    const left = btnRect.left - navRect.left;
    const width = btnRect.width;

    if (skipTransition) {
      suppressTransitionRef.current = true;
    }

    setIndicatorStyle({ left, width, opacity: 1 });

    if (skipTransition) {
      // Re-enable transition after a single paint so normal navigation
      // still gets the smooth slide animation
      requestAnimationFrame(() => {
        suppressTransitionRef.current = false;
      });
    }
  }, []);

  // ── Effect: remeasure when active tab changes (normal navigation) ──────────
  useLayoutEffect(() => {
    measureIndicator(false);
  }, [activeNavTab, measureIndicator]);

  // ── Effect: auth-state changes → snap instantly, no stale slide ──────────
  // useLayoutEffect fires after DOM commit but before browser paint,
  // so we measure the navbar AFTER React has re-rendered with the new
  // currentUser value (login buttons ↔ avatar button) but BEFORE the
  // user sees anything. The pill never draws at the wrong position.
  useLayoutEffect(() => {
    if (!currentUser) setUserMenuOpen(false);
    // Snap (no transition) so the pill cannot slide from a stale coord
    measureIndicator(true);
  }, [currentUser, measureIndicator]);

  // ── Effect: ResizeObserver + window resize ─────────────────────────────────
  useEffect(() => {
    const nav = navLinksRef.current;
    if (!nav) return;

    const handleResize = () => measureIndicator(false);

    // ResizeObserver watches the nav container for width changes
    // (more accurate than window resize alone)
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(handleResize);
      ro.observe(nav);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [measureIndicator]);


  const scrollToTop = () => {
    if (pageContainerRef.current) {
      pageContainerRef.current.scrollTop = 0;
      if (typeof pageContainerRef.current.scrollTo === 'function') {
        pageContainerRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  };

  const handleNavClick = (tabId) => {
    setShowLaunchPrompt(false);
    setActiveNavTab(tabId);
    scrollToTop();
  };

  useEffect(() => {
    scrollToTop();
    const rafId = requestAnimationFrame(() => {
      scrollToTop();
    });
    const timerId = setTimeout(() => {
      scrollToTop();
    }, 20);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
    };
  }, [activeNavTab]);

  const handleWebAppRequest = () => {
    if (currentUser) {
      onLaunchOnline();
    } else {
      // Show inline auth prompt so user can choose Sign In or Create Account
      setShowLaunchPrompt(true);
    }
  };

  // Called from the inline launch prompt — opens modal with 'app' target
  const handleLaunchAuth = (mode) => {
    setShowLaunchPrompt(false);
    onOpenAuthModal(mode, '', 'app');
  };

  const handleDownload = (platform) => {
    setDownloadStarted(true);

    // Direct URL to real installer in /public/downloads/
    const fileUrl =
      platform === 'windows'
        ? '/downloads/StegXplore-Setup.exe'
        : '/downloads/StegXplore-Portable.exe';

    // Use window.location.href — ensures a raw binary HTTP download
    // (programmatic anchor clicks can cause Vite to corrupt .exe files)
    window.location.href = fileUrl;

    setTimeout(() => setDownloadStarted(false), 4000);
  };

  // Sticky Navbar Scroll State (Section 9: reduces height by ~6px on scroll)
  useEffect(() => {
    const container = pageContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      setIsScrolled(container.scrollTop > 15);
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const handleToggleTheme = () => {
    setThemeAnimating(true);
    onToggleTheme();
    setTimeout(() => setThemeAnimating(false), 450);
  };

  return (
    <div ref={pageContainerRef} className="landing-page-container" id="hero">
      {/* Top Navbar */}
      <nav className={`landing-navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
        {/* Subtle Ambient Glow behind navbar brand & active nav (Section 12) */}
        <div className="navbar-ambient-glow" />

        {/* Brand Group (Sections 2, 3, 4, 5, 6) */}
        <div className="landing-brand" onClick={() => handleNavClick('home')} title="StegXplore Home">
          {/* Subtle violet/orange glow behind logo */}
          <div className="brand-ambient-glow" />
          
          {/* Forensic scanner line that sweeps across once on hover */}
          <div className="brand-scanner-sweep" />

          <div className="landing-brand-logo-wrapper">
            <img src={stegxploreLogo} alt="StegXplore" className="landing-brand-logo-img" />
            {/* Idle light sweep diagonal shine every 8-12s */}
            <div className="logo-idle-shimmer" />
          </div>

          <div className="brand-title-wrap">
            <span className="brand-name">
              <span className="brand-text-steg">Steg</span>
              <span className="brand-x-creative">X</span>
              <span className="brand-text-plore">plore</span>
            </span>
          </div>
        </div>

        {/* Navigation Options with Smooth Sliding Indicator (Sections 7, 8) */}
        <div className="landing-nav-links" ref={navLinksRef}>
          {/* Sliding Pill Indicator */}
          <span
            className="nav-sliding-indicator"
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
              opacity: indicatorStyle.opacity,
              // Suppress CSS transition during auth-layout snaps so the pill
              // never slides visibly from a stale logged-in/logged-out position
              transition: suppressTransitionRef.current ? 'none' : undefined
            }}
          />

          <button
            type="button"
            data-tab="home"
            className={`nav-link-btn ${activeNavTab === 'home' ? 'active' : ''}`}
            onClick={() => handleNavClick('home')}
          >
            Home
          </button>
          <button
            type="button"
            data-tab="download"
            className={`nav-link-btn ${activeNavTab === 'download' ? 'active' : ''}`}
            onClick={() => handleNavClick('download')}
          >
            Download
          </button>
          <button
            type="button"
            data-tab="webapp"
            className={`nav-link-btn ${activeNavTab === 'webapp' ? 'active' : ''}`}
            onClick={() => handleNavClick('webapp')}
          >
            Web App
          </button>
          <button
            type="button"
            data-tab="security"
            className={`nav-link-btn ${activeNavTab === 'security' ? 'active' : ''}`}
            onClick={() => handleNavClick('security')}
          >
            Security
          </button>
          <button
            type="button"
            data-tab="features"
            className={`nav-link-btn ${activeNavTab === 'features' ? 'active' : ''}`}
            onClick={() => handleNavClick('features')}
          >
            Features
          </button>
        </div>

        {/* Right Actions */}
        <div className="landing-nav-actions">
          {currentUser ? (
            <div className="user-profile-menu-container">
              <button
                type="button"
                className="user-profile-badge"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                title={`Signed in as ${currentUser.name}`}
              >
                <div className="user-avatar-circle">
                  {getUserShortcut(currentUser.name)}
                </div>
                <ChevronDown
                  size={14}
                  className={`user-dropdown-arrow ${userMenuOpen ? 'open' : ''}`}
                />
              </button>

              {userMenuOpen && (
                <div className="user-dropdown-menu">
                  <div className="user-dropdown-header">
                    <div className="user-dropdown-title">{currentUser.name}</div>
                    <div className="user-dropdown-email">{currentUser.email}</div>
                  </div>
                  <button
                    type="button"
                    className="user-dropdown-item"
                    onClick={() => {
                      setUserMenuOpen(false);
                      if (onOpenProfile) onOpenProfile();
                    }}
                  >
                    <User size={15} />
                    <span>My Profile</span>
                  </button>
                  <button
                    type="button"
                    className="user-dropdown-item"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLaunchOnline();
                    }}
                  >
                    <Globe size={15} />
                    <span>Open Web App</span>
                  </button>
                  <button
                    type="button"
                    className="user-dropdown-item danger"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout();
                    }}
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="landing-auth-btn"
              onClick={() => onOpenAuthModal('login')}
              title="Sign in or create account"
            >
              <User size={16} />
              <span>Sign In</span>
            </button>
          )}

          {/* Theme Toggle Button with Smooth Icon Rotation (Section 11) */}
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={handleToggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            <div className={`theme-icon-wrapper ${themeAnimating ? 'theme-toggle-animate' : ''}`}>
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </div>
          </button>

          {/* Mobile Hamburger Toggle Button (Section 14) */}
          <button
            type="button"
            className="mobile-nav-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <CloseIcon size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown Drawer (Section 14) */}
        {mobileMenuOpen && (
          <div className="mobile-nav-drawer">
            <button
              type="button"
              className={`mobile-nav-link ${activeNavTab === 'home' ? 'active' : ''}`}
              onClick={() => {
                setMobileMenuOpen(false);
                handleNavClick('home');
              }}
            >
              Home
            </button>
            <button
              type="button"
              className={`mobile-nav-link ${activeNavTab === 'download' ? 'active' : ''}`}
              onClick={() => {
                setMobileMenuOpen(false);
                handleNavClick('download');
              }}
            >
              Download
            </button>
            <button
              type="button"
              className={`mobile-nav-link ${activeNavTab === 'webapp' ? 'active' : ''}`}
              onClick={() => {
                setMobileMenuOpen(false);
                handleNavClick('webapp');
              }}
            >
              Web App
            </button>
            <button
              type="button"
              className={`mobile-nav-link ${activeNavTab === 'security' ? 'active' : ''}`}
              onClick={() => {
                setMobileMenuOpen(false);
                handleNavClick('security');
              }}
            >
              Security
            </button>
            <button
              type="button"
              className={`mobile-nav-link ${activeNavTab === 'features' ? 'active' : ''}`}
              onClick={() => {
                setMobileMenuOpen(false);
                handleNavClick('features');
              }}
            >
              Features
            </button>
          </div>
        )}
      </nav>

      {activeNavTab === 'home' && (
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Hero Section: Full Screen Split Layout */}
          <section className="landing-hero-fullscreen">
            <div className="hero-split-grid">
              {/* Left Hero Column: Clean Title & Action CTAs */}
              <div className="hero-left-content">
                <h1 className="hero-title">
                  <span className="hero-brand-name">
                    <span className="hero-brand-steg">Steg</span>
                    <span className="hero-brand-x">X</span>
                    <span className="hero-brand-plore">plore</span>
                  </span>
                </h1>

                <h2 className="hero-subheadline">
                  AI-Based Multimedia Steganography Detection
                </h2>

                <p className="hero-subtitle">
                  Easily find hidden files, secret messages, and concealed data inside your everyday digital images, documents, and network traffic.
                </p>

                {/* Clean Navigation CTAs */}
                <div className="hero-cta-group">
                  <button
                    type="button"
                    className="btn btn-primary btn-xl hero-action-btn"
                    onClick={handleWebAppRequest}
                  >
                    <Globe size={20} />
                    <span>Launch Web App</span>
                    <ArrowRight size={18} />
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-xl hero-action-btn hero-web-btn"
                    onClick={() => handleNavClick('features')}
                  >
                    <Layers size={20} />
                    <span>Explore Capabilities</span>
                  </button>
                </div>
              </div>

              {/* Right Hero Column: Interactive AI Steganography Forensic Visualizer */}
              <div className="hero-right-image-wrapper">
                <ForensicHeroVisual onSelectDomain={handleNavClick} />
              </div>
            </div>
          </section>

          {/* Clean Overview Cards */}
          <section className="landing-info-section">
            <div className="section-header-center">
              <div className="section-header-pill pill-orange">
                <Shield size={14} />
                <span>OVERVIEW</span>
              </div>
              <h2 className="section-heading">Multimedia Steganography Inspection</h2>
              <p className="section-desc">
                Check whether secret information or hidden payloads have been placed inside your everyday files.
              </p>
            </div>

            <div className="info-cards-grid">
              <div className="info-card">
                <div className="info-icon-box info-icon-layers">
                  <Layers size={26} />
                </div>
                <h3>Images, Documents &amp; Network</h3>
                <p>
                  Scan common photos (PNG, JPG, BMP), text files with hidden spaces or invisible characters, and network packet recordings (PCAP).
                </p>
              </div>

              <div className="info-card">
                <div className="info-icon-box info-icon-cpu">
                  <Cpu size={26} />
                </div>
                <h3>Smart Detection</h3>
                <p>
                  Finds hidden archives (like ZIP or EXE files), altered pixel patterns, and unusual file data without altering your original files.
                </p>
              </div>

              <div className="info-card">
                <div className="info-icon-box info-icon-shield">
                  <ShieldCheck size={26} />
                </div>
                <h3>100% Private &amp; Offline</h3>
                <p>
                  All processing happens right on your computer. Your files and evidence never leave your device or upload to the internet.
                </p>
              </div>
            </div>
          </section>

          {/* Clean 3-Step Workflow */}
          <section className="landing-pipeline-section">
            <div className="section-header-center">
              <div className="section-header-pill pill-orange">
                <CheckCircle2 size={14} />
                <span>SIMPLE WORKFLOW</span>
              </div>
              <h2 className="section-heading">How It Works</h2>
              <p className="section-desc">
                Three simple steps to inspect any suspicious file.
              </p>
            </div>

            <div className="hero-pipeline-steps">
              <div className="step-card">
                <div className="step-number">01</div>
                <h4>Choose a File</h4>
                <p>Drag and drop any image, document, or network capture file you want to check.</p>
              </div>
              <div className="step-card">
                <div className="step-number">02</div>
                <h4>Scan Automatically</h4>
                <p>StegXplore inspects the file locally to see if secret messages or files are hidden inside.</p>
              </div>
              <div className="step-card">
                <div className="step-number">03</div>
                <h4>See Clear Results</h4>
                <p>Get a quick verdict (Clean or Suspicious) and view an easy-to-read summary report.</p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. DOWNLOAD TAB: SPREAD-OUT PROFESSIONAL PAGE                */}
      {/* ============================================================ */}
      {activeNavTab === 'download' && (
        <section className="landing-download-page" style={{ position: 'relative', zIndex: 1 }}>
          <ParticleBackground variant="download" />
          <div className="download-spread-container">
            <div className="section-header-pill pill-orange">
              <Monitor size={14} />
              <span>WINDOWS 64-BIT</span>
            </div>

            <h1 className="download-hero-title">
              Get StegXplore for Windows
            </h1>

            <p className="download-hero-desc">
              Offline AI multimedia steganography detection suite. 100% private, air-gapped, and built for digital forensics on everyday files.
            </p>

            <div className="download-cta-box">
              <button
                className="btn btn-primary btn-xl download-main-btn"
                onClick={() => handleDownload('windows')}
                type="button"
              >
                <Download size={22} />
                <span>{downloadStarted ? 'Starting Download...' : 'Download for Windows'}</span>
                <ArrowRight size={18} />
              </button>

              <div className="download-platform-note">
                <CheckCircle2 size={16} style={{ color: 'var(--color-clean)' }} />
                <span>Compatible with Windows 10 &amp; 11 (64-bit)</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* 3. WEB APP TAB: BROWSER-BASED FORENSICS PAGE                 */}
      {/* ============================================================ */}
      {activeNavTab === 'webapp' && (
        <section className="landing-webapp-page" style={{ position: 'relative', zIndex: 1 }}>
          <ParticleBackground variant="webapp" />
          <div className="webapp-spread-container">
            <div className="section-header-pill pill-orange">
              <Globe size={14} />
              <span>BROWSER-BASED FORENSICS</span>
            </div>

            <h1 className="webapp-hero-title">
              Inspect Steganography in Your Browser
            </h1>

            <p className="webapp-hero-desc">
              Instant access to AI-powered steganography detection with zero local installation. Inspect images, documents, and network packets safely in an isolated sandbox environment.
            </p>

            <div className="webapp-cta-box">
              <button
                className="btn btn-primary btn-xl download-main-btn"
                onClick={handleWebAppRequest}
                type="button"
              >
                <Globe size={22} />
                <span>{currentUser ? 'Open Web App' : 'Launch Web App Online'}</span>
                <ArrowRight size={18} />
              </button>

              <div className="webapp-platform-note">
                <CheckCircle2 size={16} style={{ color: 'var(--color-clean)' }} />
                <span>Zero Installation Required</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* 4. FEATURES TAB: DEDICATED CAPABILITIES PAGE                 */}
      {/* ============================================================ */}
      {activeNavTab === 'features' && (
        <section className="landing-domains-page" style={{ position: 'relative', zIndex: 1 }}>
          <ParticleBackground variant="features" />
          <div className="domains-page-container">
            <div className="section-header-pill pill-orange">
              <Layers size={14} />
              <span>CAPABILITIES</span>
            </div>
            <h1 className="section-heading">
              Supported Media Domains
            </h1>
            <p className="section-desc">
              StegXplore provides dedicated steganalysis capabilities across common digital media types.
            </p>

            <div className="domains-grid">
              <div className="domain-box">
                <div className="domain-icon-circle domain-icon-img">
                  <ImageIcon size={22} />
                </div>
                <h4>Image Steganalysis</h4>
                <p>Detects hidden payloads, secret messages, and embedded files inside digital images.</p>
                <ul className="domain-feature-list">
                  <li>PNG, JPG, and BMP format support</li>
                  <li>Concealed payload and archive discovery</li>
                  <li>Pixel-level modification analysis</li>
                  <li>LSB 0–7 bitplane inspection</li>
                </ul>
              </div>

              <div className="domain-box">
                <div className="domain-icon-circle domain-icon-doc">
                  <FileText size={22} />
                </div>
                <h4>Document &amp; Text Inspection</h4>
                <p>Uncovers covert data channels concealed within plain text and document files.</p>
                <ul className="domain-feature-list">
                  <li>Invisible character pattern scanning</li>
                  <li>Hidden spacing and whitespace analysis</li>
                  <li>Zero-width Unicode payload detection</li>
                  <li>Clean text integrity verification</li>
                </ul>
              </div>

              <div className="domain-box">
                <div className="domain-icon-circle domain-icon-net">
                  <Network size={22} />
                </div>
                <h4>Network Traffic Forensics</h4>
                <p>Analyzes packet capture files to identify hidden communication and covert channels.</p>
                <ul className="domain-feature-list">
                  <li>PCAP and PCAPNG file evaluation</li>
                  <li>Covert channel traffic detection</li>
                  <li>Protocol communication inspection</li>
                  <li>Suspicious data stream flagging</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* 5. SECURITY TAB: SCREEN-WIDE PROFESSIONAL PRIVACY PAGE       */}
      {/* ============================================================ */}
      {activeNavTab === 'security' && (
        <section className="landing-security-page" style={{ position: 'relative', zIndex: 1 }}>
          <ParticleBackground variant="security" />
          <div className="security-page-spread">
            <div className="security-spread-header">
              <div className="security-header-left">
                <div className="security-icon-box">
                  <Shield size={30} />
                </div>
                <div className="security-header-text">
                  <h1 className="security-spread-title">Data Privacy &amp; Analysis Integrity</h1>
                  <p className="security-spread-desc">Built with a strict local privacy model to keep your data safe and confidential.</p>
                </div>
              </div>
            </div>

            <div className="security-cards-grid">
              <div className="security-grid-card">
                <div className="security-card-icon security-icon-lock">
                  <Lock size={24} />
                </div>
                <h3>100% Local Processing</h3>
                <p>All analysis runs directly on your local device. Files are never uploaded to any remote server or cloud service.</p>
              </div>

              <div className="security-grid-card">
                <div className="security-card-icon security-icon-check">
                  <CheckCircle2 size={24} />
                </div>
                <h3>Non-Destructive Scanning</h3>
                <p>StegXplore inspects your files safely without altering, writing to, or modifying your original files.</p>
              </div>

              <div className="security-grid-card">
                <div className="security-card-icon security-icon-cpu">
                  <Cpu size={24} />
                </div>
                <h3>Consistent &amp; Reliable</h3>
                <p>Delivers repeatable, clear inspection results that can be exported directly into structured reports.</p>
              </div>
            </div>
          </div>
        </section>
      )}


      {/* Professional Footer */}
      <footer className="landing-footer">
        <div className="footer-top-grid">
          <div className="footer-brand-col">
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', cursor: 'pointer' }}
              onClick={() => handleNavClick('home')}
              title="StegXplore Home"
            >
              <div className="footer-brand-logo-wrapper">
                <img src={stegxploreLogo} alt="StegXplore" className="landing-brand-logo-img" />
              </div>
              <span className="footer-brand-name">
                <span className="footer-brand-text">Steg</span>
                <span className="footer-brand-x">X</span>
                <span className="footer-brand-text">plore</span>
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '280px' }}>
              Multimedia steganography detection suite for modern digital inspection.
            </p>
          </div>

          <div className="footer-links-col">
            <h5>Navigation</h5>
            <button type="button" onClick={() => handleNavClick('home')}>Home Overview</button>
            <button type="button" onClick={() => handleNavClick('download')}>Download Windows App</button>
            <button type="button" onClick={handleWebAppRequest}>Launch Web App</button>
            <button type="button" onClick={() => handleNavClick('security')}>Privacy & Security</button>
            <button type="button" onClick={() => handleNavClick('features')}>Features & Capabilities</button>
          </div>

          <div className="footer-links-col">
            <h5>Capabilities</h5>
            <button type="button" onClick={() => handleNavClick('features')}>Image Steganalysis</button>
            <button type="button" onClick={() => handleNavClick('features')}>Text & Document Inspection</button>
            <button type="button" onClick={() => handleNavClick('features')}>Network Traffic Analysis</button>
            <button type="button" onClick={() => handleNavClick('features')}>Forensic Summary Reports</button>
          </div>

          <div className="footer-links-col">
            <h5>Privacy & Security</h5>
            <button type="button" onClick={() => handleNavClick('security')}>Privacy Overview</button>
            <button type="button" onClick={() => handleNavClick('security')}>Air-Gapped Local Model</button>
            <button type="button" onClick={() => handleNavClick('download')}>Windows Compatible</button>
          </div>
        </div>

        <div className="footer-bottom-row">
          <div>
            &copy; {new Date().getFullYear()} <strong>StegXplore</strong>. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ── Centered Auth-Choice Overlay ─────────────────────────────────── */}
      {/* Shown when unauthenticated user clicks "Launch Web App".            */}
      {/* Renders above all page content; backdrop click dismisses it.        */}
      {showLaunchPrompt && !currentUser && (
        <div
          className="launch-overlay-backdrop"
          onClick={() => setShowLaunchPrompt(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Sign in to access the Web App"
        >
          <div
            className="launch-overlay-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="launch-overlay-icon">
              <Globe size={28} />
            </div>

            {/* Heading */}
            <h2 className="launch-overlay-title">Access the Web App</h2>
            <p className="launch-overlay-sub">
              Sign in to your existing account or create a new one to get started.
            </p>

            {/* Buttons */}
            <div className="launch-overlay-btns">
              <button
                type="button"
                className="btn btn-primary btn-xl launch-overlay-action-btn"
                onClick={() => handleLaunchAuth('login')}
              >
                <User size={18} />
                <span>Sign In &amp; Enter</span>
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-xl launch-overlay-action-btn"
                onClick={() => handleLaunchAuth('signup')}
              >
                <ShieldCheck size={18} />
                <span>Create Account</span>
              </button>
            </div>

            {/* Dismiss */}
            <button
              type="button"
              className="launch-overlay-dismiss"
              onClick={() => setShowLaunchPrompt(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>

  );
}
