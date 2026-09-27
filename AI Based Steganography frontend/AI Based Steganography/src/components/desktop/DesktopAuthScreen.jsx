import React, { useState, useEffect, useRef } from 'react';
import {
  Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2,
  Eye, EyeOff, ChevronLeft, HelpCircle, KeyRound, ChevronDown,
  Sparkles, Shield
} from 'lucide-react';
import { authService, SECURITY_QUESTIONS } from '../../services/authService';
import ParticleBackground from '../landing/ParticleBackground';
import stegxploreLogo from '../../assets/stegxplore-logo.jpg';
import '../../styles/desktopAuth.css';

/**
 * RightSnowCanvas
 * Gentle, small snow particles falling on the right panel background.
 * Confined strictly to the right side and rendered behind the auth form card
 * so particles never overlap the text area, form labels, or inputs.
 */
function RightSnowCanvas() {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        width = parent.clientWidth || window.innerWidth / 2;
        height = parent.clientHeight || window.innerHeight;
      } else {
        width = window.innerWidth / 2;
        height = window.innerHeight;
      }
      canvas.width = width;
      canvas.height = height;
    };

    resize();

    // Create 45 subtle, tiny snow flakes
    const SNOW_COUNT = 45;
    const flakes = Array.from({ length: SNOW_COUNT }, () => ({
      x: Math.random() * (width || 500),
      y: Math.random() * (height || 800),
      radius: Math.random() * 1.3 + 0.6, // Small, subtle snow grain size (0.6px to 1.9px)
      speedY: Math.random() * 0.45 + 0.25, // Gentle falling speed
      driftX: (Math.random() - 0.5) * 0.2, // Subtle horizontal sway
      opacity: Math.random() * 0.45 + 0.25, // Soft translucent opacity
      swayOffset: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.015 + 0.008,
    }));

    window.addEventListener('resize', resize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        f.swayOffset += f.swaySpeed;
        f.y += f.speedY;
        f.x += f.driftX + Math.sin(f.swayOffset) * 0.25;

        // Wrap around smoothly when leaving view
        if (f.y > height + 6) {
          f.y = -6;
          f.x = Math.random() * width;
        }
        if (f.x < -6) f.x = width + 6;
        if (f.x > width + 6) f.x = -6;

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        // Soft snow color with slight frosty lavender/white tint
        ctx.fillStyle = `rgba(235, 230, 255, ${f.opacity})`;
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(216, 180, 254, 0.4)';
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      frameRef.current = requestAnimationFrame(render);
    };

    frameRef.current = requestAnimationFrame(render);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="desktop-auth-snow-canvas"
      aria-hidden="true"
    />
  );
}

export default function DesktopAuthScreen({ onSuccess, initialNotice = '' }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSecurityAnswer, setShowSecurityAnswer] = useState(false);

  // Forgot password sub-steps (Step 1: Enter email; Step 2: Answer question & set new pass)
  const [forgotStep, setForgotStep] = useState(1);
  const [recoveredQuestion, setRecoveredQuestion] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [error, setError] = useState(initialNotice || '');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Keep error updated if initialNotice changes
  useEffect(() => {
    if (initialNotice) {
      setError(initialNotice);
    }
  }, [initialNotice]);

  // Reset fields on mode change
  useEffect(() => {
    setError('');
    setSuccessMsg('');
    setPassword('');
    setConfirmPassword('');
    setSecurityQuestion('');
    setSecurityAnswer('');
    setForgotStep(1);
    setRecoveredQuestion('');
    setNewPassword('');
    setConfirmNewPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowSecurityAnswer(false);
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
  }, [mode]);

  const switchMode = (m) => {
    setMode(m);
    setName('');
    setEmail('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter.');
        return;
      }
      if (!securityQuestion || !securityQuestion.trim()) {
        setError('Please select a security question from the dropdown.');
        return;
      }
      if (!securityAnswer.trim()) {
        setError('Please provide an answer to the security question.');
        return;
      }
      setIsLoading(true);
      setTimeout(() => {
        const result = authService.signup(name, email, password, securityQuestion, securityAnswer);
        setIsLoading(false);
        if (result.success) {
          if (onSuccess) onSuccess(result.user);
        } else {
          setError(result.message);
        }
      }, 320);

    } else if (mode === 'login') {
      setIsLoading(true);
      setTimeout(() => {
        const result = authService.login(email, password);
        setIsLoading(false);
        if (result.success) {
          if (onSuccess) onSuccess(result.user);
        } else {
          setError(result.message);
        }
      }, 320);

    } else if (mode === 'forgot') {
      if (forgotStep === 1) {
        setIsLoading(true);
        setTimeout(() => {
          setIsLoading(false);
          const res = authService.getSecurityQuestionForEmail(email);
          if (res.success) {
            setRecoveredQuestion(res.securityQuestion);
            setForgotStep(2);
          } else {
            setError(res.message);
          }
        }, 320);
      } else {
        if (!securityAnswer.trim()) {
          setError('Please enter your security answer.');
          return;
        }
        if (newPassword !== confirmNewPassword) {
          setError('New passwords do not match.');
          return;
        }
        if (newPassword.length < 4) {
          setError('New password must be at least 4 characters.');
          return;
        }
        setIsLoading(true);
        setTimeout(() => {
          setIsLoading(false);
          const res = authService.resetPasswordWithSecurityAnswer(email, securityAnswer, newPassword);
          if (res.success) {
            setSuccessMsg(res.message || 'Password updated! You can now sign in.');
            setMode('login');
            setPassword('');
            setConfirmPassword('');
            setSecurityAnswer('');
            setForgotStep(1);
          } else {
            setError(res.message);
          }
        }, 320);
      }
    }
  };

  const welcomeText =
    mode === 'login'
      ? 'Welcome Back'
      : mode === 'signup'
      ? 'Create Your Account'
      : forgotStep === 1
      ? 'Reset Password'
      : 'Verify & Set Password';

  const subtitleText =
    mode === 'login'
      ? 'Sign in to access your forensic workspace'
      : mode === 'signup'
      ? 'Register to begin detecting concealed media payloads'
      : forgotStep === 1
      ? 'Enter your registered email address to find your account'
      : 'Answer your security question to set a new password';

  return (
    <div className="desktop-auth-root">
      {/* ── LEFT: Centered Clean Logo Panel with Animated Ambient Canvas ── */}
      <div className="desktop-auth-brand-panel">
        <ParticleBackground variant="download" />
        <div className="desktop-auth-brand-grid" />

        <div className="desktop-auth-logo-wrap">
          {/* Animated cosmic rings and pulse waves around logo */}
          <div className="desktop-auth-orbit-ring desktop-auth-orbit-ring-1" />
          <div className="desktop-auth-orbit-ring desktop-auth-orbit-ring-2" />
          <div className="desktop-auth-pulse-wave" />

          {/* App logo with high-contrast badge for all wallpapers */}
          <div className="desktop-auth-logo-img-box">
            <img src={stegxploreLogo} alt="StegXplore" className="desktop-auth-logo-img" />
          </div>

          {/* App name */}
          <div className="desktop-auth-app-name">
            Steg<span className="brand-x">X</span>plore
          </div>

          {/* Beautiful tagline */}
          <div className="desktop-auth-tagline-badge">
            <span className="desktop-auth-tagline-sparkle"><Sparkles size={13} /></span>
            <span className="desktop-auth-tagline-text">
              AI-Based Multimedia Steganography Detection
            </span>
            <span className="desktop-auth-tagline-dot" />
          </div>
        </div>
      </div>

      {/* ── Clean Elegant Divider Line with Subtle Thickness ── */}
      <div className="desktop-auth-divider-line" />

      {/* ── RIGHT: Auth Form Panel ── */}
      <div className="desktop-auth-form-panel">
        {/* Gentle small snow particle background confined strictly to the right side and layered behind the card */}
        <div className="desktop-auth-snow-container" aria-hidden="true">
          <RightSnowCanvas />
        </div>

        <div className="desktop-auth-form-card">

          {/* Header */}
          <div className="desktop-auth-form-header">
            <div className="desktop-auth-form-welcome">{welcomeText}</div>
            <div className="desktop-auth-form-subtitle">{subtitleText}</div>
          </div>

          {/* Back link for forgot */}
          {mode === 'forgot' && (
            <button type="button" className="desktop-auth-back-link" onClick={() => switchMode('login')}>
              <ChevronLeft size={15} /> Back to Sign In
            </button>
          )}

          {/* Tab switcher (login / signup only) */}
          {mode !== 'forgot' && (
            <div className="desktop-auth-tabs">
              <button type="button" className={`desktop-auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => switchMode('login')}>
                Sign In
              </button>
              <button type="button" className={`desktop-auth-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => switchMode('signup')}>
                Create Account
              </button>
            </div>
          )}

          {/* Success banner */}
          {successMsg && (
            <div className="desktop-auth-success">
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="desktop-auth-error">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{error}</span>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit}>

            {/* Full Name (signup only) */}
            {mode === 'signup' && (
              <div className="desktop-auth-input-group">
                <label className="desktop-auth-label">Full Name</label>
                <div className="desktop-auth-input-wrap">
                  <span className="desktop-auth-input-icon"><User size={16} /></span>
                  <input
                    type="text" className="desktop-auth-input"
                    placeholder="e.g. Alex Mercer"
                    value={name} onChange={e => setName(e.target.value)} required
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="desktop-auth-input-group">
              <label className="desktop-auth-label">Email Address</label>
              <div className="desktop-auth-input-wrap">
                <span className="desktop-auth-input-icon"><Mail size={16} /></span>
                <input
                  type="email" className="desktop-auth-input"
                  placeholder="name@domain.com"
                  value={email} onChange={e => setEmail(e.target.value)} required
                />
              </div>
            </div>

            {/* Password (login + signup) */}
            {mode !== 'forgot' && (
              <div className="desktop-auth-input-group">
                <label className="desktop-auth-label">Password</label>
                <div className="desktop-auth-input-wrap">
                  <span className="desktop-auth-input-icon"><Lock size={16} /></span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="desktop-auth-input has-toggle"
                    placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)} required
                  />
                  <button type="button" className="desktop-auth-toggle-btn" onClick={() => setShowPassword(p => !p)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Forgot Password link (login) */}
            {mode === 'login' && (
              <div className="desktop-auth-forgot-row">
                <button type="button" className="desktop-auth-forgot-btn" onClick={() => switchMode('forgot')}>
                  Forgot Password?
                </button>
              </div>
            )}

            {/* Confirm Password (signup) */}
            {mode === 'signup' && (
              <div className="desktop-auth-input-group">
                <label className="desktop-auth-label">Confirm Password</label>
                <div className="desktop-auth-input-wrap">
                  <span className="desktop-auth-input-icon"><Lock size={16} /></span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="desktop-auth-input has-toggle"
                    placeholder="••••••••"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                  />
                  <button type="button" className="desktop-auth-toggle-btn" onClick={() => setShowConfirmPassword(p => !p)}>
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Security Question & Answer (signup only) */}
            {mode === 'signup' && (
              <>
                <div className="desktop-auth-input-group">
                  <label className="desktop-auth-label">Security Question</label>
                  <div className="desktop-auth-input-wrap">
                    <span className="desktop-auth-input-icon"><HelpCircle size={16} /></span>
                    <select
                      className={`desktop-auth-input desktop-auth-select ${!securityQuestion ? 'auth-select-placeholder' : ''}`}
                      value={securityQuestion}
                      onChange={(e) => setSecurityQuestion(e.target.value)}
                      required
                    >
                      <option value="" className="auth-select-placeholder-option">
                        Select a security question...
                      </option>
                      {SECURITY_QUESTIONS.map((q, idx) => (
                        <option key={idx} value={q}>
                          {q}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="desktop-auth-select-arrow" />
                  </div>
                </div>

                <div className="desktop-auth-input-group">
                  <label className="desktop-auth-label">Security Answer</label>
                  <div className="desktop-auth-input-wrap">
                    <span className="desktop-auth-input-icon"><KeyRound size={16} /></span>
                    <input
                      type={showSecurityAnswer ? 'text' : 'password'}
                      className="desktop-auth-input has-toggle"
                      placeholder="Enter your secret answer"
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="desktop-auth-toggle-btn"
                      onClick={() => setShowSecurityAnswer((prev) => !prev)}
                    >
                      {showSecurityAnswer ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Forgot Password Step 2: Answer Question & Set New Password */}
            {mode === 'forgot' && forgotStep === 2 && (
              <>
                <div className="desktop-auth-sq-banner">
                  <div className="desktop-auth-sq-label">Security Question</div>
                  <div className="desktop-auth-sq-text">{recoveredQuestion}</div>
                </div>

                <div className="desktop-auth-input-group">
                  <label className="desktop-auth-label">Your Security Answer</label>
                  <div className="desktop-auth-input-wrap">
                    <span className="desktop-auth-input-icon"><KeyRound size={16} /></span>
                    <input
                      type={showSecurityAnswer ? 'text' : 'password'}
                      className="desktop-auth-input has-toggle"
                      placeholder="Enter the answer you set during signup"
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="desktop-auth-toggle-btn"
                      onClick={() => setShowSecurityAnswer((prev) => !prev)}
                    >
                      {showSecurityAnswer ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="desktop-auth-input-group">
                  <label className="desktop-auth-label">New Password</label>
                  <div className="desktop-auth-input-wrap">
                    <span className="desktop-auth-input-icon"><Lock size={16} /></span>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      className="desktop-auth-input has-toggle"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="desktop-auth-toggle-btn"
                      onClick={() => setShowNewPassword((p) => !p)}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="desktop-auth-input-group">
                  <label className="desktop-auth-label">Confirm New Password</label>
                  <div className="desktop-auth-input-wrap">
                    <span className="desktop-auth-input-icon"><Lock size={16} /></span>
                    <input
                      type={showConfirmNewPassword ? 'text' : 'password'}
                      className="desktop-auth-input has-toggle"
                      placeholder="••••••••"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="desktop-auth-toggle-btn"
                      onClick={() => setShowConfirmNewPassword((p) => !p)}
                    >
                      {showConfirmNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Submit */}
            <button type="submit" className="desktop-auth-submit-btn" disabled={isLoading}>
              <span>
                {isLoading
                  ? 'Processing...'
                  : mode === 'login'
                  ? 'Sign In & Enter'
                  : mode === 'signup'
                  ? 'Create Account & Enter'
                  : forgotStep === 1
                  ? 'Find Account & Continue'
                  : 'Save New Password & Sign In'}
              </span>
              <ArrowRight size={17} />
            </button>
          </form>

          {/* Footer toggle */}
          <div className="desktop-auth-form-footer">
            {mode === 'login' && (
              <p>Don't have an account?<button type="button" className="desktop-auth-form-footer-link" onClick={() => switchMode('signup')}>Create one now</button></p>
            )}
            {mode === 'signup' && (
              <p>Already have an account?<button type="button" className="desktop-auth-form-footer-link" onClick={() => switchMode('login')}>Sign in</button></p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
