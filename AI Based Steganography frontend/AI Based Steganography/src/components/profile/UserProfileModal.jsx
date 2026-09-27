import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Calendar,
  ShieldQuestion,
  LogOut,
  Check,
  AlertCircle,
  Save,
  Users
} from 'lucide-react';
import { authService, getUserShortcut } from '../../services/authService';

export default function UserProfileModal({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onLogout,
  onOpenSwitchAccount
}) {
  const [name, setName] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setSuccessMsg('');
      setErrorMsg('');
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleSaveName = (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Name cannot be empty.');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      const res = authService.updateUserName(currentUser.id || currentUser.email, name.trim());
      setIsSaving(false);
      if (res.success) {
        setSuccessMsg('Name updated successfully!');
        if (onUpdateUser) {
          onUpdateUser(res.user);
        }
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(res.message || 'Failed to update name.');
      }
    }, 250);
  };

  const memberSince = currentUser.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Active User';

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-card profile-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          className="auth-modal-close"
          onClick={onClose}
          type="button"
          title="Close Profile"
        >
          <X size={20} />
        </button>

        <div className="auth-modal-scrollable">
          {/* Profile Header */}
          <div className="profile-modal-header">
          <div className="profile-avatar-large">
            {getUserShortcut(currentUser.name)}
          </div>
          <h2 className="profile-modal-title">{currentUser.name}</h2>
          <p className="profile-modal-email">{currentUser.email}</p>
        </div>

        {/* Feedback Messages */}
        {successMsg && (
          <div className="auth-success-banner" style={{ marginBottom: '14px' }}>
            <Check size={16} />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="auth-error-banner" style={{ marginBottom: '14px' }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSaveName} className="profile-modal-body">
          {/* Edit Name */}
          <div className="auth-input-group">
            <label className="auth-label">Full Name</label>
            <div className="auth-input-wrapper">
              <User size={18} className="auth-field-icon" />
              <input
                type="text"
                className="auth-input"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Email (Read-Only) */}
          <div className="auth-input-group">
            <label className="auth-label">Registered Email</label>
            <div className="auth-input-wrapper">
              <Mail size={18} className="auth-field-icon" />
              <input
                type="email"
                className="auth-input profile-input-readonly"
                value={currentUser.email}
                readOnly
                disabled
              />
            </div>
          </div>



          {/* Member Since info */}
          <div className="auth-input-group">
            <label className="auth-label">Account Created</label>
            <div className="profile-info-pill">
              <Calendar size={16} className="profile-info-pill-icon" />
              <span className="profile-info-pill-text">{memberSince}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="profile-actions-container">
            <button
              type="submit"
              className="btn btn-primary profile-save-btn"
              disabled={isSaving || name.trim() === currentUser.name}
            >
              <Save size={16} />
              <span>{isSaving ? 'Saving...' : 'Save Name'}</span>
            </button>

            <div className="profile-secondary-actions-row">
              <button
                type="button"
                className="btn btn-secondary profile-switch-btn"
                onClick={() => {
                  onClose();
                  if (onOpenSwitchAccount) onOpenSwitchAccount();
                }}
                title="Switch to another registered account"
              >
                <Users size={16} />
                <span>Switch Account</span>
              </button>

              <button
                type="button"
                className="btn btn-danger profile-logout-btn"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                title="Sign Out of StegXplore"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
  );
}
