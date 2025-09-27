/**
 * Comprehensive Security Management System
 * Handles authentication, authorization, encryption, and security monitoring
 */

import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  FacebookAuthProvider,
  TwitterAuthProvider
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// Security configuration
const SECURITY_CONFIG = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_LOWERCASE: true,
  PASSWORD_REQUIRE_NUMBERS: true,
  PASSWORD_REQUIRE_SYMBOLS: true,
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  ENCRYPTION_KEY_LENGTH: 32,
  TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
  AUDIT_LOG_RETENTION: 90 * 24 * 60 * 60 * 1000 // 90 days
};

// User roles and permissions
export const USER_ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user',
  GUEST: 'guest'
};

export const PERMISSIONS = {
  // User management
  CREATE_USER: 'create_user',
  READ_USER: 'read_user',
  UPDATE_USER: 'update_user',
  DELETE_USER: 'delete_user',
  
  // Workout management
  CREATE_WORKOUT: 'create_workout',
  READ_WORKOUT: 'read_workout',
  UPDATE_WORKOUT: 'update_workout',
  DELETE_WORKOUT: 'delete_workout',
  
  // Program management
  CREATE_PROGRAM: 'create_program',
  READ_PROGRAM: 'read_program',
  UPDATE_PROGRAM: 'update_program',
  DELETE_PROGRAM: 'delete_program',
  
  // Analytics
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_DATA: 'export_data',
  
  // Admin functions
  MANAGE_USERS: 'manage_users',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  MANAGE_SETTINGS: 'manage_settings'
};

// Role-based permissions
const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: Object.values(PERMISSIONS),
  [USER_ROLES.MODERATOR]: [
    PERMISSIONS.READ_USER,
    PERMISSIONS.CREATE_WORKOUT,
    PERMISSIONS.READ_WORKOUT,
    PERMISSIONS.UPDATE_WORKOUT,
    PERMISSIONS.DELETE_WORKOUT,
    PERMISSIONS.CREATE_PROGRAM,
    PERMISSIONS.READ_PROGRAM,
    PERMISSIONS.UPDATE_PROGRAM,
    PERMISSIONS.DELETE_PROGRAM,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.EXPORT_DATA
  ],
  [USER_ROLES.USER]: [
    PERMISSIONS.READ_USER,
    PERMISSIONS.CREATE_WORKOUT,
    PERMISSIONS.READ_WORKOUT,
    PERMISSIONS.UPDATE_WORKOUT,
    PERMISSIONS.DELETE_WORKOUT,
    PERMISSIONS.CREATE_PROGRAM,
    PERMISSIONS.READ_PROGRAM,
    PERMISSIONS.UPDATE_PROGRAM,
    PERMISSIONS.DELETE_PROGRAM,
    PERMISSIONS.VIEW_ANALYTICS
  ],
  [USER_ROLES.GUEST]: [
    PERMISSIONS.READ_WORKOUT,
    PERMISSIONS.READ_PROGRAM
  ]
};

// Security events
export const SECURITY_EVENTS = {
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET: 'password_reset',
  ACCOUNT_LOCKED: 'account_locked',
  PERMISSION_DENIED: 'permission_denied',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  DATA_ACCESS: 'data_access',
  DATA_MODIFICATION: 'data_modification',
  SECURITY_SETTING_CHANGE: 'security_setting_change'
};

/**
 * Security Manager Class
 * Comprehensive security management with authentication, authorization, and monitoring
 */
export class SecurityManager {
  constructor() {
    this.currentUser = null;
    this.userProfile = null;
    this.sessionStartTime = null;
    this.loginAttempts = new Map();
    this.lockedAccounts = new Map();
    this.auditLogs = [];
    this.securitySettings = {};
    this.isInitialized = false;
    
    this.initialize();
  }

  /**
   * Initialize security manager
   */
  async initialize() {
    try {
      // Set up authentication state listener
      this.setupAuthStateListener();
      
      // Load security settings
      await this.loadSecuritySettings();
      
      // Set up session monitoring
      this.setupSessionMonitoring();
      
      // Set up security monitoring
      this.setupSecurityMonitoring();
      
      // Load audit logs
      await this.loadAuditLogs();
      
      this.isInitialized = true;
      console.log('SecurityManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SecurityManager:', error);
      throw error;
    }
  }

  /**
   * Setup authentication state listener
   */
  setupAuthStateListener() {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.currentUser = user;
        this.sessionStartTime = Date.now();
        await this.loadUserProfile(user.uid);
        this.logSecurityEvent(SECURITY_EVENTS.LOGIN_SUCCESS, {
          userId: user.uid,
          email: user.email,
          loginTime: new Date().toISOString()
        });
      } else {
        this.currentUser = null;
        this.userProfile = null;
        this.sessionStartTime = null;
      }
    });
  }

  /**
   * Setup session monitoring
   */
  setupSessionMonitoring() {
    // Check session timeout every minute
    setInterval(() => {
      if (this.currentUser && this.sessionStartTime) {
        const sessionDuration = Date.now() - this.sessionStartTime;
        if (sessionDuration > SECURITY_CONFIG.SESSION_TIMEOUT) {
          this.handleSessionTimeout();
        }
      }
    }, 60000);

    // Monitor for suspicious activity
    setInterval(() => {
      this.checkSuspiciousActivity();
    }, 30000);
  }

  /**
   * Setup security monitoring
   */
  setupSecurityMonitoring() {
    // Monitor failed login attempts
    setInterval(() => {
      this.cleanupExpiredLockouts();
    }, 60000);

    // Monitor audit logs
    setInterval(() => {
      this.cleanupOldAuditLogs();
    }, 24 * 60 * 60 * 1000); // Daily cleanup
  }

  /**
   * Register user
   */
  async registerUser(email, password, userData = {}) {
    try {
      // Validate password strength
      const passwordValidation = this.validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
      }

      // Check if email is already registered
      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        throw new Error('Email is already registered');
      }

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user profile
      const userProfile = {
        uid: user.uid,
        email: user.email,
        displayName: userData.displayName || '',
        role: USER_ROLES.USER,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        isActive: true,
        preferences: userData.preferences || {},
        securitySettings: {
          twoFactorEnabled: false,
          emailNotifications: true,
          dataSharing: false
        }
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);

      // Log security event
      this.logSecurityEvent(SECURITY_EVENTS.LOGIN_SUCCESS, {
        userId: user.uid,
        email: user.email,
        action: 'user_registration'
      });

      return { user, userProfile };
    } catch (error) {
      this.logSecurityEvent(SECURITY_EVENTS.LOGIN_FAILED, {
        email,
        error: error.message,
        action: 'user_registration'
      });
      throw error;
    }
  }

  /**
   * Login user
   */
  async loginUser(email, password) {
    try {
      // Check if account is locked
      if (this.isAccountLocked(email)) {
        throw new Error('Account is temporarily locked due to too many failed login attempts');
      }

      // Attempt login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Reset login attempts
      this.loginAttempts.delete(email);

      // Update last login time
      await updateDoc(doc(db, 'users', user.uid), {
        lastLoginAt: serverTimestamp()
      });

      // Log security event
      this.logSecurityEvent(SECURITY_EVENTS.LOGIN_SUCCESS, {
        userId: user.uid,
        email: user.email,
        loginTime: new Date().toISOString()
      });

      return user;
    } catch (error) {
      // Record failed login attempt
      this.recordFailedLoginAttempt(email);
      
      // Log security event
      this.logSecurityEvent(SECURITY_EVENTS.LOGIN_FAILED, {
        email,
        error: error.message,
        loginTime: new Date().toISOString()
      });
      
      throw error;
    }
  }

  /**
   * Social login
   */
  async socialLogin(provider) {
    try {
      let authProvider;
      
      switch (provider) {
        case 'google':
          authProvider = new GoogleAuthProvider();
          break;
        case 'facebook':
          authProvider = new FacebookAuthProvider();
          break;
        case 'twitter':
          authProvider = new TwitterAuthProvider();
          break;
        default:
          throw new Error('Unsupported social provider');
      }

      const result = await signInWithPopup(auth, authProvider);
      const user = result.user;

      // Check if user profile exists
      const userProfile = await this.getUserProfile(user.uid);
      if (!userProfile) {
        // Create user profile for new social login user
        const newUserProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          role: USER_ROLES.USER,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          isActive: true,
          preferences: {},
          securitySettings: {
            twoFactorEnabled: false,
            emailNotifications: true,
            dataSharing: false
          }
        };

        await setDoc(doc(db, 'users', user.uid), newUserProfile);
      } else {
        // Update last login time
        await updateDoc(doc(db, 'users', user.uid), {
          lastLoginAt: serverTimestamp()
        });
      }

      // Log security event
      this.logSecurityEvent(SECURITY_EVENTS.LOGIN_SUCCESS, {
        userId: user.uid,
        email: user.email,
        provider,
        loginTime: new Date().toISOString()
      });

      return user;
    } catch (error) {
      this.logSecurityEvent(SECURITY_EVENTS.LOGIN_FAILED, {
        provider,
        error: error.message,
        loginTime: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logoutUser() {
    try {
      if (this.currentUser) {
        // Log security event
        this.logSecurityEvent(SECURITY_EVENTS.LOGOUT, {
          userId: this.currentUser.uid,
          email: this.currentUser.email,
          logoutTime: new Date().toISOString(),
          sessionDuration: Date.now() - this.sessionStartTime
        });
      }

      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword, newPassword) {
    try {
      if (!this.currentUser) {
        throw new Error('No authenticated user');
      }

      // Validate new password
      const passwordValidation = this.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
      }

      // Update password
      await updatePassword(this.currentUser, newPassword);

      // Log security event
      this.logSecurityEvent(SECURITY_EVENTS.PASSWORD_CHANGE, {
        userId: this.currentUser.uid,
        email: this.currentUser.email,
        changeTime: new Date().toISOString()
      });

      return true;
    } catch (error) {
      this.logSecurityEvent(SECURITY_EVENTS.PASSWORD_CHANGE, {
        userId: this.currentUser?.uid,
        email: this.currentUser?.email,
        error: error.message,
        changeTime: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);

      // Log security event
      this.logSecurityEvent(SECURITY_EVENTS.PASSWORD_RESET, {
        email,
        resetTime: new Date().toISOString()
      });

      return true;
    } catch (error) {
      this.logSecurityEvent(SECURITY_EVENTS.PASSWORD_RESET, {
        email,
        error: error.message,
        resetTime: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Check user permission
   */
  hasPermission(permission) {
    if (!this.userProfile) return false;
    
    const userPermissions = ROLE_PERMISSIONS[this.userProfile.role] || [];
    return userPermissions.includes(permission);
  }

  /**
   * Check user role
   */
  hasRole(role) {
    if (!this.userProfile) return false;
    return this.userProfile.role === role;
  }

  /**
   * Check if user is admin
   */
  isAdmin() {
    return this.hasRole(USER_ROLES.ADMIN);
  }

  /**
   * Check if user is moderator
   */
  isModerator() {
    return this.hasRole(USER_ROLES.MODERATOR) || this.isAdmin();
  }

  /**
   * Validate password strength
   */
  validatePassword(password) {
    const errors = [];
    
    if (password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
      errors.push(`Password must be at least ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} characters long`);
    }
    
    if (SECURITY_CONFIG.PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (SECURITY_CONFIG.PASSWORD_REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (SECURITY_CONFIG.PASSWORD_REQUIRE_NUMBERS && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (SECURITY_CONFIG.PASSWORD_REQUIRE_SYMBOLS && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Record failed login attempt
   */
  recordFailedLoginAttempt(email) {
    const attempts = this.loginAttempts.get(email) || 0;
    this.loginAttempts.set(email, attempts + 1);
    
    if (attempts + 1 >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
      this.lockAccount(email);
    }
  }

  /**
   * Lock account
   */
  lockAccount(email) {
    this.lockedAccounts.set(email, Date.now());
    
    this.logSecurityEvent(SECURITY_EVENTS.ACCOUNT_LOCKED, {
      email,
      lockTime: new Date().toISOString(),
      reason: 'Too many failed login attempts'
    });
  }

  /**
   * Check if account is locked
   */
  isAccountLocked(email) {
    const lockTime = this.lockedAccounts.get(email);
    if (!lockTime) return false;
    
    const lockDuration = Date.now() - lockTime;
    if (lockDuration > SECURITY_CONFIG.LOCKOUT_DURATION) {
      this.lockedAccounts.delete(email);
      return false;
    }
    
    return true;
  }

  /**
   * Cleanup expired lockouts
   */
  cleanupExpiredLockouts() {
    for (const [email, lockTime] of this.lockedAccounts.entries()) {
      if (Date.now() - lockTime > SECURITY_CONFIG.LOCKOUT_DURATION) {
        this.lockedAccounts.delete(email);
      }
    }
  }

  /**
   * Handle session timeout
   */
  handleSessionTimeout() {
    this.logSecurityEvent(SECURITY_EVENTS.SUSPICIOUS_ACTIVITY, {
      userId: this.currentUser?.uid,
      email: this.currentUser?.email,
      reason: 'Session timeout',
      timeoutTime: new Date().toISOString()
    });
    
    this.logoutUser();
  }

  /**
   * Check for suspicious activity
   */
  checkSuspiciousActivity() {
    // Implement suspicious activity detection logic
    // This could include checking for unusual login patterns, data access patterns, etc.
  }

  /**
   * Log security event
   */
  logSecurityEvent(eventType, data = {}) {
    const logEntry = {
      id: Date.now().toString(),
      eventType,
      timestamp: new Date().toISOString(),
      userId: this.currentUser?.uid || 'anonymous',
      email: this.currentUser?.email || data.email || 'unknown',
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      data
    };
    
    this.auditLogs.push(logEntry);
    
    // Store in Firestore
    this.storeAuditLog(logEntry);
    
    // Keep only last 1000 logs in memory
    if (this.auditLogs.length > 1000) {
      this.auditLogs.shift();
    }
  }

  /**
   * Store audit log in Firestore
   */
  async storeAuditLog(logEntry) {
    try {
      await setDoc(doc(db, 'audit_logs', logEntry.id), logEntry);
    } catch (error) {
      console.error('Failed to store audit log:', error);
    }
  }

  /**
   * Load audit logs
   */
  async loadAuditLogs() {
    try {
      const auditLogsQuery = query(
        collection(db, 'audit_logs'),
        where('timestamp', '>=', new Date(Date.now() - SECURITY_CONFIG.AUDIT_LOG_RETENTION).toISOString())
      );
      
      const snapshot = await getDocs(auditLogsQuery);
      this.auditLogs = snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    }
  }

  /**
   * Cleanup old audit logs
   */
  cleanupOldAuditLogs() {
    const cutoffTime = new Date(Date.now() - SECURITY_CONFIG.AUDIT_LOG_RETENTION);
    this.auditLogs = this.auditLogs.filter(log => 
      new Date(log.timestamp) > cutoffTime
    );
  }

  /**
   * Load user profile
   */
  async loadUserProfile(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        this.userProfile = userDoc.data();
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email) {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', email)
      );
      
      const snapshot = await getDocs(usersQuery);
      if (!snapshot.empty) {
        return snapshot.docs[0].data();
      }
      return null;
    } catch (error) {
      console.error('Failed to get user by email:', error);
      return null;
    }
  }

  /**
   * Load security settings
   */
  async loadSecuritySettings() {
    try {
      const settingsDoc = await getDoc(doc(db, 'security_settings', 'global'));
      if (settingsDoc.exists()) {
        this.securitySettings = settingsDoc.data();
      }
    } catch (error) {
      console.error('Failed to load security settings:', error);
    }
  }

  /**
   * Get client IP address
   */
  getClientIP() {
    // In a real implementation, this would get the actual IP address
    // For now, we'll return a placeholder
    return '127.0.0.1';
  }

  /**
   * Get security status
   */
  getSecurityStatus() {
    return {
      isAuthenticated: !!this.currentUser,
      userRole: this.userProfile?.role || USER_ROLES.GUEST,
      sessionDuration: this.sessionStartTime ? Date.now() - this.sessionStartTime : 0,
      loginAttempts: this.loginAttempts.size,
      lockedAccounts: this.lockedAccounts.size,
      auditLogs: this.auditLogs.length,
      securitySettings: this.securitySettings
    };
  }

  /**
   * Get audit logs
   */
  getAuditLogs(filter = {}) {
    let logs = [...this.auditLogs];
    
    if (filter.eventType) {
      logs = logs.filter(log => log.eventType === filter.eventType);
    }
    
    if (filter.userId) {
      logs = logs.filter(log => log.userId === filter.userId);
    }
    
    if (filter.startDate) {
      logs = logs.filter(log => new Date(log.timestamp) >= new Date(filter.startDate));
    }
    
    if (filter.endDate) {
      logs = logs.filter(log => new Date(log.timestamp) <= new Date(filter.endDate));
    }
    
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Cleanup any ongoing processes
    console.log('SecurityManager cleaned up');
  }
}

// Singleton instance
let securityManagerInstance = null;

/**
 * Get SecurityManager instance
 */
export const getSecurityManager = () => {
  if (!securityManagerInstance) {
    securityManagerInstance = new SecurityManager();
  }
  return securityManagerInstance;
};

export default SecurityManager;
