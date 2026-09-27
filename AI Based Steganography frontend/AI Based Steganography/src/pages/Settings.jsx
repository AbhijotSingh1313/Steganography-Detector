import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Trash2,
  Info,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  UserMinus
} from 'lucide-react';
import { authService } from '../services/authService';
import stegxploreLogo from '../assets/stegxplore-logo.jpg';

export default function Settings({ theme, onToggleTheme, onClearHistory, currentUser, onLogout }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleChangePassword = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentUser?.email) {
      setErrorMsg('You must be signed in to change your password.');
      return;
    }

    if (!oldPassword) {
      setErrorMsg('Please enter your current password.');
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      setErrorMsg('New password must be at least 4 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match. Please re-enter.');
      return;
    }

    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
      const res = authService.changePasswordWithOldPassword(currentUser.email, oldPassword, newPassword);
      if (res.success) {
        setSuccessMsg('Password updated successfully!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowOldPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        setTimeout(() => {
          setIsFormOpen(false);
          setSuccessMsg('');
        }, 2200);
      } else {
        setErrorMsg(res.message);
      }
    }, 300);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setErrorMsg('');
    setSuccessMsg('');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* 1. Interface Theme Section */}
      <div className="cyber-card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <h4 className="card-title">
            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
            <span>Interface Theme</span>
          </h4>
        </div>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Switch between dark cybersecurity mode and light mode.
        </p>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onToggleTheme}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
        </button>
      </div>

      {/* 2. Data & History Management Section */}
      <div className="cyber-card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <h4 className="card-title">
            <Trash2 size={18} style={{ color: 'var(--color-stego)' }} />
            <span>Clear Local Storage & History</span>
          </h4>
        </div>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Delete all saved analysis records and reset cached forensic cases.
        </p>

        <button
          type="button"
          className="btn btn-danger"
          onClick={() => {
            if (window.confirm('Are you sure you want to delete all local forensic records?')) {
              onClearHistory();
              alert('History cleared successfully.');
            }
          }}
        >
          <Trash2 size={16} />
          <span>Clear All Analysis History</span>
        </button>
      </div>

      {/* 3. Change Password Section (Positioned Directly Above StegXplore) */}
      {currentUser && (
        <div className="cyber-card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <h4 className="card-title">
              <Lock size={18} style={{ color: 'var(--color-primary)' }} />
              <span>Password & Security</span>
            </h4>
          </div>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Update your account password by entering your current credentials.
          </p>

          {/* Success Banner */}
          {successMsg && (
            <div className="auth-success-banner" style={{ marginBottom: '16px' }}>
              <CheckCircle2 size={17} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="auth-error-banner" style={{ marginBottom: '16px' }}>
              <AlertCircle size={17} />
              <span>{errorMsg}</span>
            </div>
          )}

          {!isFormOpen ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setIsFormOpen(true);
                setErrorMsg('');
                setSuccessMsg('');
              }}
            >
              <Lock size={16} />
              <span>Change Password</span>
            </button>
          ) : (
            <form onSubmit={handleChangePassword}>
              {/* 1. Old Password */}
              <div className="auth-input-group">
                <label className="auth-label">Old Password</label>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-field-icon" />
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    className="auth-input auth-input-password"
                    placeholder="Enter your current password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle-btn"
                    onClick={() => setShowOldPassword((prev) => !prev)}
                    title={showOldPassword ? 'Hide password' : 'Show password'}
                    aria-label={showOldPassword ? 'Hide password' : 'Show password'}
                  >
                    {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* 2. New Password */}
              <div className="auth-input-group">
                <label className="auth-label">New Password</label>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-field-icon" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    className="auth-input auth-input-password"
                    placeholder="Enter new password (min. 4 characters)"
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

              {/* 3. Confirm New Password */}
              <div className="auth-input-group">
                <label className="auth-label">Confirm New Password</label>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-field-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="auth-input auth-input-password"
                    placeholder="Re-enter new password"
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isUpdating}
                >
                  <Lock size={16} />
                  <span>{isUpdating ? 'Updating Password...' : 'Update Password'}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancel}
                  disabled={isUpdating}
                >
                  <X size={16} />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 4. Delete Account (only shown when logged in) */}
      {currentUser && (
        <div className="cyber-card" style={{ marginBottom: '20px', borderColor: 'rgba(239, 68, 68, 0.25)' }}>
          <div className="card-header">
            <h4 className="card-title">
              <Trash2 size={18} style={{ color: '#ef4444' }} />
              <span style={{ color: '#ef4444' }}>Delete Account</span>
            </h4>
          </div>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Permanently delete your account and all associated forensic analysis data. You will not be able to sign in directly with this account once deleted.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.35)' }}
            onClick={() => {
              if (window.confirm(`Are you sure you want to permanently delete account "${currentUser.name}" (${currentUser.email})? This action cannot be undone and you will not be able to sign in with this account.`)) {
                const res = authService.deleteAccount(currentUser.id || currentUser.email);
                if (res.success && onLogout) onLogout();
              }
            }}
          >
            <Trash2 size={16} />
            <span>Delete My Account</span>
          </button>
        </div>
      )}

      {/* 5. About Application Section (StegXplore) */}
      <div className="cyber-card">
        <div className="card-header">
          <h4 className="card-title">
            <Info size={18} style={{ color: 'var(--color-primary)' }} />
            <span>About StegXplore</span>
          </h4>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div className="sidebar-logo-img-wrapper" style={{ width: '52px', height: '52px', borderRadius: '12px' }}>
            <img src={stegxploreLogo} alt="StegXplore" className="sidebar-logo-img" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
              Steg<span className="brand-x-colored">X</span>plore
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '4px 0 10px 0' }}>
              Version 1.0.0 &bull; Forensic Steganography Detection &amp; Analysis Suite
            </p>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              AI-driven multimedia forensic steganalysis for Images, Text documents, and PCAP network captures.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
