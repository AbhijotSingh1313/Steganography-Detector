// Central Authentication Service for StegXplore AI
// Handles user registration, basic email format validation, credentials, security questions, and local session state

const AUTH_STORAGE_KEYS = {
  CURRENT_USER: 'stegxplore_current_user',
  USERS_LIST: 'stegxplore_registered_users',
  LAST_ACTIVE: 'stegxplore_last_active'
};

// 3 hours in milliseconds (3 * 60 * 60 * 1000)
export const INACTIVITY_TIMEOUT_MS = 3 * 60 * 60 * 1000;

export const SECURITY_QUESTIONS = [
  "What is your favorite pet's name?",
  "What city were you born in?",
  "What was the name of your first school?",
  "What is your mother's maiden name?",
  "What was your childhood nickname?",
  "What is the name of the street you grew up on?",
  "What was your favorite food as a child?",
  "What was the make and model of your first car?",
  "What is your favorite movie or book?",
  "In what city did your parents meet?"
];

const DEFAULT_USERS = [];

// Standard email validation regex: name@domain.tld
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const authService = {
  getUsers() {
    try {
      const data = localStorage.getItem(AUTH_STORAGE_KEYS.USERS_LIST);
      let users = data ? JSON.parse(data) : [];
      if (!Array.isArray(users)) users = [];

      // Ensure current user is preserved in users list
      const rawCurrent = localStorage.getItem(AUTH_STORAGE_KEYS.CURRENT_USER);
      if (rawCurrent) {
        const current = JSON.parse(rawCurrent);
        if (current && current.email && !users.some((u) => u.email.toLowerCase() === current.email.toLowerCase())) {
          users.push(current);
          localStorage.setItem(AUTH_STORAGE_KEYS.USERS_LIST, JSON.stringify(users));
        }
      }

      return users;
    } catch {
      return DEFAULT_USERS;
    }
  },

  getLastActive() {
    try {
      const time = localStorage.getItem(AUTH_STORAGE_KEYS.LAST_ACTIVE);
      return time ? parseInt(time, 10) : null;
    } catch {
      return null;
    }
  },

  recordActivity() {
    try {
      localStorage.setItem(AUTH_STORAGE_KEYS.LAST_ACTIVE, Date.now().toString());
    } catch {
      // Storage unavailable or quota exceeded
    }
  },

  isSessionExpired() {
    try {
      const rawUser = localStorage.getItem(AUTH_STORAGE_KEYS.CURRENT_USER);
      if (!rawUser) return false;

      const lastActive = this.getLastActive();
      if (!lastActive) {
        // First initialization for currently logged in session
        this.recordActivity();
        return false;
      }

      const elapsed = Date.now() - lastActive;
      return elapsed >= INACTIVITY_TIMEOUT_MS;
    } catch {
      return false;
    }
  },

  getCurrentUser() {
    try {
      const data = localStorage.getItem(AUTH_STORAGE_KEYS.CURRENT_USER);
      if (!data) return null;

      // Automatically logout if inactive for 3+ hours
      if (this.isSessionExpired()) {
        this.logout();
        return null;
      }

      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return !!this.getCurrentUser();
  },

  logout() {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(AUTH_STORAGE_KEYS.LAST_ACTIVE);
    } catch {
      // Storage error
    }
  },

  validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return { valid: false, message: 'Email address cannot be empty.' };
    }
    const clean = email.trim();
    if (!clean.includes('@')) {
      return { valid: false, message: "Email is missing an '@' symbol." };
    }
    const parts = clean.split('@');
    if (!parts[0] || parts[0].length === 0) {
      return { valid: false, message: "Please provide a username before the '@'." };
    }
    if (!parts[1] || !parts[1].includes('.')) {
      return { valid: false, message: "Please provide a valid domain (e.g. gmail.com, outlook.com)." };
    }
    if (!EMAIL_REGEX.test(clean)) {
      return { valid: false, message: 'Please enter a valid email address format (e.g. name@domain.com).' };
    }
    return { valid: true };
  },

  login(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    
    // Basic email format check
    const emailCheck = this.validateEmail(cleanEmail);
    if (!emailCheck.valid) {
      return { success: false, message: emailCheck.message };
    }

    if (!password) {
      return { success: false, message: 'Please enter your password.' };
    }

    const users = this.getUsers();
    const found = users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.password === password
    );

    if (!found) {
      return { success: false, message: 'Invalid credentials. Please verify your email and password.' };
    }

    localStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify(found));
    this.recordActivity();
    return { success: true, user: found };
  },

  signup(name, email, password, securityQuestion, securityAnswer) {
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanQuestion = (securityQuestion || '').trim();
    const cleanAnswer = (securityAnswer || '').trim();

    // Basic Checks
    if (!cleanName) {
      return { success: false, message: 'Please enter your full name.' };
    }

    const emailCheck = this.validateEmail(cleanEmail);
    if (!emailCheck.valid) {
      return { success: false, message: emailCheck.message };
    }

    if (!password || password.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters.' };
    }

    const users = this.getUsers();
    const exists = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (exists) {
      return { success: false, message: 'An account with this email already exists. Please sign in instead.' };
    }

    // Create user with security question and answer
    const newUser = {
      id: `user-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      password: password,
      securityQuestion: cleanQuestion,
      securityAnswer: cleanAnswer,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(AUTH_STORAGE_KEYS.USERS_LIST, JSON.stringify(users));
    localStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
    this.recordActivity();

    return {
      success: true,
      user: newUser
    };
  },

  getSecurityQuestionForEmail(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const emailCheck = this.validateEmail(cleanEmail);
    if (!emailCheck.valid) {
      return { success: false, message: emailCheck.message };
    }

    const users = this.getUsers();
    const found = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!found) {
      return { success: false, message: 'No registered account found with this email address.' };
    }

    return {
      success: true,
      email: cleanEmail,
      securityQuestion: found.securityQuestion || SECURITY_QUESTIONS[0]
    };
  },

  resetPasswordWithSecurityAnswer(email, securityAnswer, newPassword) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanAnswer = (securityAnswer || '').trim().toLowerCase();

    if (!cleanAnswer) {
      return { success: false, message: 'Please enter your security answer.' };
    }

    if (!newPassword || newPassword.length < 4) {
      return { success: false, message: 'New password must be at least 4 characters.' };
    }

    const users = this.getUsers();
    const userIndex = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);

    if (userIndex === -1) {
      return { success: false, message: 'Account not found. Please try again.' };
    }

    const targetUser = users[userIndex];
    const expectedAnswer = (targetUser.securityAnswer || '').trim().toLowerCase();

    if (expectedAnswer !== cleanAnswer) {
      return { success: false, message: 'Incorrect answer to the security question. Please try again.' };
    }

    // Update password
    targetUser.password = newPassword;
    users[userIndex] = targetUser;
    localStorage.setItem(AUTH_STORAGE_KEYS.USERS_LIST, JSON.stringify(users));

    // Also update active session if same user is logged in
    const current = this.getCurrentUser();
    if (current && current.email.toLowerCase() === cleanEmail) {
      current.password = newPassword;
      localStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify(current));
    }

    return {
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
      user: targetUser
    };
  },

  changePasswordWithOldPassword(email, oldPassword, newPassword) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!oldPassword) {
      return { success: false, message: 'Please enter your current password.' };
    }
    if (!newPassword || newPassword.length < 4) {
      return { success: false, message: 'New password must be at least 4 characters.' };
    }

    const users = this.getUsers();
    const userIndex = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
    if (userIndex === -1) {
      return { success: false, message: 'Account not found. Please log in again.' };
    }

    const targetUser = users[userIndex];
    if (targetUser.password !== oldPassword) {
      return { success: false, message: 'Current password does not match our records.' };
    }

    targetUser.password = newPassword;
    users[userIndex] = targetUser;
    localStorage.setItem(AUTH_STORAGE_KEYS.USERS_LIST, JSON.stringify(users));

    const current = this.getCurrentUser();
    if (current && current.email.toLowerCase() === cleanEmail) {
      current.password = newPassword;
      localStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify(current));
    }

    return {
      success: true,
      message: 'Password updated successfully!'
    };
  },

  changePassword(email, securityAnswer, newPassword) {
    return this.resetPasswordWithSecurityAnswer(email, securityAnswer, newPassword);
  },

  updateUserName(emailOrId, newName) {
    const cleanName = (newName || '').trim();
    if (!cleanName) {
      return { success: false, message: 'Name cannot be empty.' };
    }

    const users = this.getUsers();
    const target = users.find(
      (u) => u.id === emailOrId || u.email.toLowerCase() === String(emailOrId).toLowerCase()
    );

    if (!target) {
      return { success: false, message: 'User not found.' };
    }

    target.name = cleanName;
    localStorage.setItem(AUTH_STORAGE_KEYS.USERS_LIST, JSON.stringify(users));

    const current = this.getCurrentUser();
    if (current && (current.id === target.id || current.email.toLowerCase() === target.email.toLowerCase())) {
      current.name = cleanName;
      localStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify(current));
    }

    return { success: true, user: target };
  },

  switchUser(userIdOrEmail) {
    const users = this.getUsers();
    const target = users.find(
      (u) => u.id === userIdOrEmail || u.email.toLowerCase() === String(userIdOrEmail).toLowerCase()
    );

    if (!target) {
      return { success: false, message: 'Selected account was not found.' };
    }

    localStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify(target));
    this.recordActivity();
    return { success: true, user: target };
  },

  deleteAccount(userIdOrEmail) {
    try {
      if (!userIdOrEmail) return { success: false, message: 'Invalid account identifier.' };

      // 1. If the deleted account is currently logged in, log out first so getUsers() doesn't re-insert it
      let wasCurrent = false;
      const rawCurrent = localStorage.getItem(AUTH_STORAGE_KEYS.CURRENT_USER);
      if (rawCurrent) {
        try {
          const current = JSON.parse(rawCurrent);
          if (
            current &&
            (current.id === userIdOrEmail || current.email.toLowerCase() === String(userIdOrEmail).toLowerCase())
          ) {
            wasCurrent = true;
            this.logout();
          }
        } catch {
          // Ignore json parse error
        }
      }

      // 2. Read existing users list directly from storage to prevent re-addition
      let users = [];
      const data = localStorage.getItem(AUTH_STORAGE_KEYS.USERS_LIST);
      if (data) {
        try {
          users = JSON.parse(data);
          if (!Array.isArray(users)) users = [];
        } catch {
          users = [];
        }
      }

      // Find user to delete to get their id and email for full cleanup
      const targetUser = users.find(
        (u) => u.id === userIdOrEmail || u.email.toLowerCase() === String(userIdOrEmail).toLowerCase()
      );

      // Permanently filter out the target user
      const remainingUsers = users.filter(
        (u) => u.id !== userIdOrEmail && u.email.toLowerCase() !== String(userIdOrEmail).toLowerCase()
      );
      localStorage.setItem(AUTH_STORAGE_KEYS.USERS_LIST, JSON.stringify(remainingUsers));

      // 3. Remove per-user analysis history if exists
      if (targetUser) {
        if (targetUser.id) {
          localStorage.removeItem(`stegxplore_analysis_history_usr_${targetUser.id}`);
          localStorage.removeItem(`stegodetect_analysis_history_${targetUser.id}`);
        }
        if (targetUser.email) {
          const cleanEmailPart = targetUser.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
          localStorage.removeItem(`stegxplore_analysis_history_usr_${targetUser.email.toLowerCase()}`);
          localStorage.removeItem(`stegodetect_analysis_history_${cleanEmailPart}`);
          localStorage.removeItem(`stegodetect_analysis_history_${targetUser.email.toLowerCase()}`);
        }
      }
      localStorage.removeItem(`stegxplore_analysis_history_usr_${userIdOrEmail}`);
      localStorage.removeItem(`stegodetect_analysis_history_${userIdOrEmail}`);

      return { success: true, wasCurrent, remainingUsers };
    } catch {
      return { success: false, message: 'Could not delete account.' };
    }
  },

  clearAllAccounts() {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEYS.USERS_LIST);
      localStorage.removeItem(AUTH_STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(AUTH_STORAGE_KEYS.LAST_ACTIVE);

      // Clean up any per-user analysis history keys
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith('stegxplore_analysis_history_usr_') ||
            key.startsWith('stegodetect_analysis_history_') ||
            key === 'stegxplore_registered_users' ||
            key === 'stegxplore_current_user' ||
            key === 'stegxplore_last_active')
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      return true;
    } catch {
      return false;
    }
  },

  getUserShortcut(name) {
    return getUserShortcut(name);
  }
};



export function getUserShortcut(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

