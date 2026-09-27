import React, { useState, useEffect } from 'react';
import { X, Users, ArrowRight, Check, Plus, ShieldCheck, Mail } from 'lucide-react';
import { authService, getUserShortcut } from '../../services/authService';

export default function SwitchAccountModal({
  isOpen,
  onClose,
  currentUser,
  onSwitchSuccess,
  onLogout,
  onOpenAuthModal
}) {
  const [usersList, setUsersList] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const allUsers = authService.getUsers();
      setUsersList(allUsers);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSwitch = (targetUser) => {
    if (currentUser && (targetUser.id === currentUser.id || targetUser.email.toLowerCase() === currentUser.email.toLowerCase())) {
      onClose();
      return;
    }

    const res = authService.switchUser(targetUser.id || targetUser.email);
    if (res.success) {
      onSwitchSuccess(res.user);
      onClose();
    } else {
      alert(res.message || 'Failed to switch account.');
    }
  };

  const handleDeleteAccount = (e, targetUser) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to remove account "${targetUser.name}" (${targetUser.email})?`)) {
      return;
    }
    const res = authService.deleteAccount(targetUser.id || targetUser.email);
    if (res.success) {
      const remaining = authService.getUsers();
      setUsersList(remaining);
      if (res.wasCurrent) {
        if (onLogout) onLogout();
        onClose();
      }
    }
  };

  const handleClearAll = () => {
    if (!window.confirm('Are you sure you want to remove ALL accounts created on this website?')) {
      return;
    }
    authService.clearAllAccounts();
    setUsersList([]);
    if (onLogout) onLogout();
    onClose();
  };

  const handleAddNew = () => {
    onClose();
    if (onOpenAuthModal) {
      onOpenAuthModal('login', 'Sign in or register another account to switch to');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content switch-account-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '460px', width: '92%' }}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="attractive-icon-badge" style={{ width: '38px', height: '38px' }}>
              <Users size={20} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Switch Account
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Select or manage accounts created on this website
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Accounts List */}
        <div className="switch-accounts-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
          {usersList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-secondary)' }}>
              <p style={{ fontSize: '0.9rem', marginBottom: '12px' }}>No saved accounts found.</p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleAddNew}
              >
                <Plus size={14} />
                <span>Create New Account</span>
              </button>
            </div>
          ) : (
            usersList.map((user) => {
              const isCurrent =
                currentUser &&
                (user.id === currentUser.id || user.email.toLowerCase() === currentUser.email.toLowerCase());

              return (
                <div
                  key={user.id || user.email}
                  className={`switch-account-item ${isCurrent ? 'active' : ''}`}
                  onClick={() => !isCurrent && handleSwitch(user)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: isCurrent ? '1.5px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                    background: isCurrent ? 'var(--color-primary-dim)' : 'var(--bg-card)',
                    cursor: isCurrent ? 'default' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div
                      className="user-avatar-circle"
                      style={{
                        width: '38px',
                        height: '38px',
                        fontSize: '0.88rem',
                        fontWeight: 750,
                        flexShrink: 0
                      }}
                    >
                      {getUserShortcut(user.name)}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, textAlign: 'left' }}>
                      <span
                        style={{
                          fontSize: '0.92rem',
                          fontWeight: 750,
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {user.name}
                      </span>
                      <span
                        style={{
                          fontSize: '0.76rem',
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {user.email}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isCurrent ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          background: 'var(--color-clean-dim)',
                          color: 'var(--color-clean)',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          border: '1px solid rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <Check size={12} />
                        <span>Active</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSwitch(user);
                        }}
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      >
                        <span>Switch</span>
                        <ArrowRight size={13} />
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      title="Remove this account from this device"
                      onClick={(e) => handleDeleteAccount(e, user)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '8px',
                        color: '#ef4444',
                        borderColor: 'rgba(239, 68, 68, 0.3)',
                        fontSize: '0.76rem',
                        fontWeight: 650
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions: Add new account / Clear All */}
        <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleAddNew}
            style={{ width: '100%', justifyContent: 'center', padding: '9px 14px', fontWeight: 650 }}
          >
            <Plus size={15} />
            <span>Add or Sign In with Another Account</span>
          </button>

          {usersList.length > 0 && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleClearAll}
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '8px 14px',
                fontSize: '0.8rem',
                color: '#ef4444',
                borderColor: 'rgba(239, 68, 68, 0.3)'
              }}
            >
              <span>Remove All Accounts</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

