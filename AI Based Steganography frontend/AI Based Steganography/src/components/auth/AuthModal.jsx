import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Shield,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  KeyRound,
  Eye,
  EyeOff,
  ChevronDown
} from 'lucide-react';
import { authService, SECURITY_QUESTIONS } from '../../services/authService';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onSuccess, titleNotice = '' }) {
  const [mode, setMode] = useState(initialMode); // 'login', 'signup', or 'forgot'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSecurityAnswer, setShowSecurityAnswer] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password sub-steps
  const [forgotStep, setForgotStep] = useState(1); // 1: enter email, 2: answer question & enter new pass
  const [recoveredQuestion, setRecoveredQuestion] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Reset/sync modal state when opened or when initialMode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setName('');
      setEmail('');
      setError('');
      setSuccessMsg('');
      setForgotStep(1);
      setPassword('');
      setConfirmPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setSecurityQuestion('');
      setSecurityAnswer('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setShowSecurityAnswer(false);
      setShowNewPassword(false);
      setShowConfirmNewPassword(false);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

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
          onClose();
        } else {
          setError(result.message);
        }
      }, 300);
    } else if (mode === 'login') {
      setIsLoading(true);
      setTimeout(() => {
        const result = authService.login(email, password);
        setIsLoading(false);
        if (result.success) {
          if (onSuccess) onSuccess(result.user);
          onClose();
        } else {
          setError(result.message);
        }
      }, 300);
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
        }, 300);
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
            setSuccessMsg(res.message);
            setMode('login');
            setPassword('');
            setConfirmPassword('');
            setSecurityAnswer('');
            setForgotStep(1);
          } else {
            setError(res.message);
          }
        }, 300);
      }
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
    setForgotStep(1);
    setPassword('');
    setConfirmPassword('');
    setSecurityQuestion('');
    setSecurityAnswer('');
  };

  const handleCloseModal = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setSecurityQuestion('');
    setSecurityAnswer('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowSecurityAnswer(false);
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
    setError('');
    setSuccessMsg('');
    setForgotStep(1);
    if (onClose) onClose();
  };

  return (
    <div className="auth-modal-overlay" onClick={handleCloseModal}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Close Button */}
        <button className="auth-modal-close" onClick={handleCloseModal} type="button" title="Close">
          <X size={20} />
        </button>

        <div className="auth-modal-scrollable">
          {/* Modal Brand Header */}
          <div className="auth-modal-header">
          <div className="auth-icon-badge">
            <Shield size={24} />
          </div>
          <h2 className="auth-modal-title">
            {mode === 'login'
              ? 'Welcome Back'
              : mode === 'signup'
              ? 'Create StegXplore Account'
              : 'Reset Your Password'}
          </h2>
          <p className="auth-modal-subtitle">
            {titleNotice
              ? titleNotice
              : mode === 'login'
              ? 'Sign in to access your StegXplore workspace'
              : mode === 'signup'
              ? 'Register to inspect concealed media payloads and audit security cases'
              : 'Verify your registered email and security question to recover your password'}
          </p>
        </div>

        {/* Tab Switcher (only for login and signup) */}
        {mode !== 'forgot' && (
          <div className="auth-tab-switch">
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => switchMode('signup')}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="auth-success-banner">
            <CheckCircle2 size={17} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="auth-error-banner">
            <AlertCircle size={17} />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <div className="auth-input-group">
              <label className="auth-label">Full Name</label>
              <div className="auth-input-wrapper">
                <User size={18} className="auth-field-icon" />
                <input
                  type="text"
                  className="auth-input"
                  placeholder="e.g. Alex Mercer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* Email Address field for login, signup, and forgot step 1 */}
          {(mode !== 'forgot' || forgotStep === 1) && (
            <div className="auth-input-group">
              <label className="auth-label">Email Address</label>
              <div className="auth-input-wrapper">
                <Mail size={18} className="auth-field-icon" />
                <input
                  type="email"
                  className="auth-input"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* Standard Login & Signup Password Fields */}
          {mode !== 'forgot' && (
            <div className="auth-input-group">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrapper">
                <Lock size={18} className="auth-field-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input auth-input-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Forgot Password Link in Login View */}
          {mode === 'login' && (
            <div className="auth-forgot-row">
              <button
                type="button"
                className="auth-link-subtle-btn"
                onClick={() => switchMode('forgot')}
              >
                Forgot Password?
              </button>
            </div>
          )}

          {/* Confirm Password field in Signup */}
          {mode === 'signup' && (
            <div className="auth-input-group">
              <label className="auth-label">Confirm Password</label>
              <div className="auth-input-wrapper">
                <Lock size={18} className="auth-field-icon" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="auth-input auth-input-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle-btn"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Security Question & Answer in Signup */}
          {mode === 'signup' && (
            <>
              <div className="auth-input-group">
                <label className="auth-label">Security Question</label>
                <div className="auth-input-wrapper">
                  <HelpCircle size={18} className="auth-field-icon" />
                  <select
                    className={`auth-input auth-select ${!securityQuestion ? 'auth-select-placeholder' : ''}`}
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
                  <ChevronDown size={17} className="auth-select-arrow" />
                </div>
              </div>

              <div className="auth-input-group">
                <label className="auth-label">Security Answer</label>
                <div className="auth-input-wrapper">
                  <KeyRound size={18} className="auth-field-icon" />
                  <input
                    type={showSecurityAnswer ? 'text' : 'password'}
                    className="auth-input auth-input-password"
                    placeholder="Enter your secret answer"
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle-btn"
                    onClick={() => setShowSecurityAnswer((prev) => !prev)}
                    title={showSecurityAnswer ? 'Hide answer' : 'Show answer'}
                    aria-label={showSecurityAnswer ? 'Hide answer' : 'Show answer'}
                  >
                    {showSecurityAnswer ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Forgot Password Step 2: Answer Question & Set New Password */}
          {mode === 'forgot' && forgotStep === 2 && (
            <>
              <div className="auth-security-question-banner">
                <span className="auth-security-question-label">Security Question:</span>
                <p className="auth-security-question-text">{recoveredQuestion}</p>
              </div>

              <div className="auth-input-group">
                <label className="auth-label">Your Security Answer</label>
                <div className="auth-input-wrapper">
                  <KeyRound size={18} className="auth-field-icon" />
                  <input
                    type={showSecurityAnswer ? 'text' : 'password'}
                    className="auth-input auth-input-password"
                    placeholder="Enter the answer you set during signup"
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle-btn"
                    onClick={() => setShowSecurityAnswer((prev) => !prev)}
                    title={showSecurityAnswer ? 'Hide answer' : 'Show answer'}
                    aria-label={showSecurityAnswer ? 'Hide answer' : 'Show answer'}
                  >
                    {showSecurityAnswer ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="auth-input-group">
                <label className="auth-label">New Password</label>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-field-icon" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    className="auth-input auth-input-password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle-btn"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    title={showNewPassword ? 'Hide password' : 'Show password'}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="auth-input-group">
                <label className="auth-label">Confirm New Password</label>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-field-icon" />
                  <input
                    type={showConfirmNewPassword ? 'text' : 'password'}
                    className="auth-input auth-input-password"
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle-btn"
                    onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                    title={showConfirmNewPassword ? 'Hide password' : 'Show password'}
                    aria-label={showConfirmNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={isLoading}
          >
            <span>
              {isLoading
                ? 'Processing...'
                : mode === 'login'
                ? 'Sign In & Enter'
                : mode === 'signup'
                ? 'Create & Enter'
                : forgotStep === 1
                ? 'Verify Email & Continue'
                : 'Save New Password'}
            </span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Modal Footer Toggle */}
        <div className="auth-modal-footer">
          {mode === 'login' && (
            <p>
              Don't have an account yet?{' '}
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => switchMode('signup')}
              >
                Sign up now
              </button>
            </p>
          )}
          {mode === 'signup' && (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => switchMode('login')}
              >
                Sign in
              </button>
            </p>
          )}
          {mode === 'forgot' && (
            <p>
              Remember your credentials?{' '}
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => switchMode('login')}
              >
                Back to Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}
