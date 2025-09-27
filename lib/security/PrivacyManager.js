/**
 * Privacy Manager
 * Handles privacy protection, data anonymization, and GDPR compliance
 */

import { getEncryptionManager } from './EncryptionManager';

// Privacy configuration
const PRIVACY_CONFIG = {
  DATA_RETENTION_PERIOD: 365 * 24 * 60 * 60 * 1000, // 1 year
  ANONYMIZATION_THRESHOLD: 5, // Minimum records for anonymization
  CONSENT_EXPIRY: 365 * 24 * 60 * 60 * 1000, // 1 year
  AUDIT_LOG_RETENTION: 90 * 24 * 60 * 60 * 1000, // 90 days
  DATA_EXPORT_FORMAT: 'json',
  DATA_DELETION_GRACE_PERIOD: 30 * 24 * 60 * 60 * 1000 // 30 days
};

// Data categories for GDPR
export const DATA_CATEGORIES = {
  PERSONAL: 'personal',
  SENSITIVE: 'sensitive',
  BEHAVIORAL: 'behavioral',
  TECHNICAL: 'technical',
  ANALYTICS: 'analytics'
};

// Consent types
export const CONSENT_TYPES = {
  ESSENTIAL: 'essential',
  FUNCTIONAL: 'functional',
  ANALYTICS: 'analytics',
  MARKETING: 'marketing',
  THIRD_PARTY: 'third_party'
};

// Data processing purposes
export const PROCESSING_PURPOSES = {
  SERVICE_PROVISION: 'service_provision',
  ANALYTICS: 'analytics',
  MARKETING: 'marketing',
  SECURITY: 'security',
  COMPLIANCE: 'compliance',
  RESEARCH: 'research'
};

/**
 * Privacy Manager Class
 * Comprehensive privacy protection and GDPR compliance management
 */
export class PrivacyManager {
  constructor() {
    this.encryptionManager = getEncryptionManager();
    this.userConsents = new Map();
    this.dataProcessingRecords = new Map();
    this.anonymizationRules = new Map();
    this.dataRetentionPolicies = new Map();
    this.isInitialized = false;
    
    this.initialize();
  }

  /**
   * Initialize privacy manager
   */
  async initialize() {
    try {
      // Load privacy settings
      await this.loadPrivacySettings();
      
      // Set up data retention monitoring
      this.setupDataRetentionMonitoring();
      
      // Set up consent monitoring
      this.setupConsentMonitoring();
      
      // Initialize anonymization rules
      this.initializeAnonymizationRules();
      
      this.isInitialized = true;
      console.log('PrivacyManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PrivacyManager:', error);
      throw error;
    }
  }

  /**
   * Load privacy settings
   */
  async loadPrivacySettings() {
    // In a real implementation, this would load from secure storage
    // For now, we'll use default settings
    this.dataRetentionPolicies.set(DATA_CATEGORIES.PERSONAL, PRIVACY_CONFIG.DATA_RETENTION_PERIOD);
    this.dataRetentionPolicies.set(DATA_CATEGORIES.SENSITIVE, PRIVACY_CONFIG.DATA_RETENTION_PERIOD);
    this.dataRetentionPolicies.set(DATA_CATEGORIES.BEHAVIORAL, PRIVACY_CONFIG.DATA_RETENTION_PERIOD);
    this.dataRetentionPolicies.set(DATA_CATEGORIES.TECHNICAL, PRIVACY_CONFIG.AUDIT_LOG_RETENTION);
    this.dataRetentionPolicies.set(DATA_CATEGORIES.ANALYTICS, PRIVACY_CONFIG.DATA_RETENTION_PERIOD);
  }

  /**
   * Setup data retention monitoring
   */
  setupDataRetentionMonitoring() {
    // Check for expired data daily
    setInterval(() => {
      this.cleanupExpiredData();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Setup consent monitoring
   */
  setupConsentMonitoring() {
    // Check for expired consents daily
    setInterval(() => {
      this.cleanupExpiredConsents();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Initialize anonymization rules
   */
  initializeAnonymizationRules() {
    // Personal data anonymization rules
    this.anonymizationRules.set('email', {
      method: 'hash',
      preserveFormat: true,
      salt: 'email_salt_2024'
    });
    
    this.anonymizationRules.set('name', {
      method: 'replace',
      replacement: 'Anonymous User'
    });
    
    this.anonymizationRules.set('phone', {
      method: 'mask',
      maskChar: '*',
      visibleChars: 2
    });
    
    this.anonymizationRules.set('address', {
      method: 'generalize',
      level: 'city'
    });
    
    this.anonymizationRules.set('ip_address', {
      method: 'hash',
      preserveFormat: false
    });
  }

  /**
   * Record user consent
   */
  recordConsent(userId, consentType, purpose, granted = true, metadata = {}) {
    const consent = {
      id: this.generateConsentId(),
      userId,
      consentType,
      purpose,
      granted,
      timestamp: new Date().toISOString(),
      expiryDate: new Date(Date.now() + PRIVACY_CONFIG.CONSENT_EXPIRY).toISOString(),
      metadata,
      version: '1.0'
    };
    
    this.userConsents.set(consent.id, consent);
    
    // Log consent event
    this.logPrivacyEvent('consent_recorded', {
      userId,
      consentType,
      purpose,
      granted
    });
    
    return consent;
  }

  /**
   * Check user consent
   */
  hasConsent(userId, consentType, purpose) {
    const consents = Array.from(this.userConsents.values())
      .filter(consent => 
        consent.userId === userId &&
        consent.consentType === consentType &&
        consent.purpose === purpose &&
        consent.granted &&
        new Date(consent.expiryDate) > new Date()
      );
    
    return consents.length > 0;
  }

  /**
   * Withdraw consent
   */
  withdrawConsent(userId, consentType, purpose) {
    const consents = Array.from(this.userConsents.values())
      .filter(consent => 
        consent.userId === userId &&
        consent.consentType === consentType &&
        consent.purpose === purpose
      );
    
    consents.forEach(consent => {
      consent.granted = false;
      consent.withdrawnAt = new Date().toISOString();
    });
    
    // Log withdrawal event
    this.logPrivacyEvent('consent_withdrawn', {
      userId,
      consentType,
      purpose
    });
    
    return consents.length;
  }

  /**
   * Anonymize data
   */
  anonymizeData(data, rules = {}) {
    const anonymized = { ...data };
    
    for (const [field, rule] of Object.entries(rules)) {
      if (anonymized[field] !== undefined) {
        anonymized[field] = this.applyAnonymizationRule(anonymized[field], rule);
      }
    }
    
    return anonymized;
  }

  /**
   * Apply anonymization rule
   */
  applyAnonymizationRule(value, rule) {
    if (!value) return value;
    
    switch (rule.method) {
      case 'hash':
        return this.hashValue(value, rule.salt);
      
      case 'replace':
        return rule.replacement;
      
      case 'mask':
        return this.maskValue(value, rule.maskChar, rule.visibleChars);
      
      case 'generalize':
        return this.generalizeValue(value, rule.level);
      
      case 'remove':
        return undefined;
      
      default:
        return value;
    }
  }

  /**
   * Hash value
   */
  hashValue(value, salt = '') {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(value + salt).digest('hex');
  }

  /**
   * Mask value
   */
  maskValue(value, maskChar = '*', visibleChars = 2) {
    if (value.length <= visibleChars) return maskChar.repeat(value.length);
    
    const visible = value.substring(0, visibleChars);
    const masked = maskChar.repeat(value.length - visibleChars);
    return visible + masked;
  }

  /**
   * Generalize value
   */
  generalizeValue(value, level) {
    // This would implement generalization based on the level
    // For example, for addresses: full address -> city -> country
    return value; // Placeholder implementation
  }

  /**
   * Pseudonymize data
   */
  pseudonymizeData(data, userId) {
    const pseudonymized = { ...data };
    const pseudonym = this.generatePseudonym(userId);
    
    // Replace identifying fields with pseudonym
    const identifyingFields = ['email', 'name', 'phone', 'address'];
    identifyingFields.forEach(field => {
      if (pseudonymized[field]) {
        pseudonymized[field] = pseudonym;
      }
    });
    
    return pseudonymized;
  }

  /**
   * Generate pseudonym
   */
  generatePseudonym(userId) {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(userId + 'pseudonym_salt').digest('hex');
    return 'user_' + hash.substring(0, 8);
  }

  /**
   * Process data request
   */
  async processDataRequest(userId, requestType, data = {}) {
    try {
      const request = {
        id: this.generateRequestId(),
        userId,
        requestType,
        timestamp: new Date().toISOString(),
        status: 'pending',
        data
      };
      
      // Log data request
      this.logPrivacyEvent('data_request', {
        userId,
        requestType,
        requestId: request.id
      });
      
      // Process based on request type
      switch (requestType) {
        case 'export':
          return await this.exportUserData(userId);
        
        case 'delete':
          return await this.deleteUserData(userId);
        
        case 'rectify':
          return await this.rectifyUserData(userId, data);
        
        case 'portability':
          return await this.exportUserData(userId, 'portability');
        
        default:
          throw new Error(`Unknown request type: ${requestType}`);
      }
    } catch (error) {
      console.error('Data request processing error:', error);
      throw error;
    }
  }

  /**
   * Export user data
   */
  async exportUserData(userId, format = 'json') {
    try {
      // In a real implementation, this would fetch actual user data
      const userData = {
        personal: {
          userId,
          exportDate: new Date().toISOString(),
          dataCategories: Object.values(DATA_CATEGORIES)
        },
        consents: Array.from(this.userConsents.values())
          .filter(consent => consent.userId === userId),
        processingRecords: Array.from(this.dataProcessingRecords.values())
          .filter(record => record.userId === userId)
      };
      
      // Log export event
      this.logPrivacyEvent('data_export', {
        userId,
        format,
        dataSize: JSON.stringify(userData).length
      });
      
      return userData;
    } catch (error) {
      console.error('Data export error:', error);
      throw error;
    }
  }

  /**
   * Delete user data
   */
  async deleteUserData(userId) {
    try {
      // Mark data for deletion
      const deletionRecord = {
        userId,
        deletionDate: new Date().toISOString(),
        gracePeriodEnd: new Date(Date.now() + PRIVACY_CONFIG.DATA_DELETION_GRACE_PERIOD).toISOString(),
        status: 'pending'
      };
      
      // Log deletion event
      this.logPrivacyEvent('data_deletion_requested', {
        userId,
        gracePeriodEnd: deletionRecord.gracePeriodEnd
      });
      
      return deletionRecord;
    } catch (error) {
      console.error('Data deletion error:', error);
      throw error;
    }
  }

  /**
   * Rectify user data
   */
  async rectifyUserData(userId, corrections) {
    try {
      // Log rectification event
      this.logPrivacyEvent('data_rectification', {
        userId,
        corrections: Object.keys(corrections)
      });
      
      return {
        userId,
        corrections,
        timestamp: new Date().toISOString(),
        status: 'processed'
      };
    } catch (error) {
      console.error('Data rectification error:', error);
      throw error;
    }
  }

  /**
   * Record data processing
   */
  recordDataProcessing(userId, purpose, dataCategory, metadata = {}) {
    const record = {
      id: this.generateProcessingId(),
      userId,
      purpose,
      dataCategory,
      timestamp: new Date().toISOString(),
      metadata,
      legalBasis: this.getLegalBasis(purpose, dataCategory)
    };
    
    this.dataProcessingRecords.set(record.id, record);
    
    // Log processing event
    this.logPrivacyEvent('data_processing', {
      userId,
      purpose,
      dataCategory,
      legalBasis: record.legalBasis
    });
    
    return record;
  }

  /**
   * Get legal basis for processing
   */
  getLegalBasis(purpose, dataCategory) {
    // GDPR Article 6 legal bases
    const legalBases = {
      [PROCESSING_PURPOSES.SERVICE_PROVISION]: 'contract',
      [PROCESSING_PURPOSES.ANALYTICS]: 'consent',
      [PROCESSING_PURPOSES.MARKETING]: 'consent',
      [PROCESSING_PURPOSES.SECURITY]: 'legitimate_interest',
      [PROCESSING_PURPOSES.COMPLIANCE]: 'legal_obligation',
      [PROCESSING_PURPOSES.RESEARCH]: 'consent'
    };
    
    return legalBases[purpose] || 'consent';
  }

  /**
   * Cleanup expired data
   */
  async cleanupExpiredData() {
    try {
      const now = new Date();
      let cleanedCount = 0;
      
      // Clean up expired consents
      for (const [id, consent] of this.userConsents.entries()) {
        if (new Date(consent.expiryDate) < now) {
          this.userConsents.delete(id);
          cleanedCount++;
        }
      }
      
      // Clean up old processing records
      for (const [id, record] of this.dataProcessingRecords.entries()) {
        const retentionPeriod = this.dataRetentionPolicies.get(record.dataCategory) || PRIVACY_CONFIG.DATA_RETENTION_PERIOD;
        if (new Date(record.timestamp).getTime() + retentionPeriod < now.getTime()) {
          this.dataProcessingRecords.delete(id);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} expired privacy records`);
      }
    } catch (error) {
      console.error('Data cleanup error:', error);
    }
  }

  /**
   * Cleanup expired consents
   */
  cleanupExpiredConsents() {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [id, consent] of this.userConsents.entries()) {
      if (new Date(consent.expiryDate) < now) {
        this.userConsents.delete(id);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired consents`);
    }
  }

  /**
   * Log privacy event
   */
  logPrivacyEvent(eventType, data = {}) {
    const logEntry = {
      id: this.generateLogId(),
      eventType,
      timestamp: new Date().toISOString(),
      data
    };
    
    // In a real implementation, this would be stored securely
    console.log('Privacy event:', logEntry);
  }

  /**
   * Generate unique IDs
   */
  generateConsentId() {
    return 'consent_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  generateRequestId() {
    return 'request_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  generateProcessingId() {
    return 'processing_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  generateLogId() {
    return 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get privacy status
   */
  getPrivacyStatus() {
    return {
      isInitialized: this.isInitialized,
      activeConsents: this.userConsents.size,
      processingRecords: this.dataProcessingRecords.size,
      anonymizationRules: this.anonymizationRules.size,
      dataRetentionPolicies: this.dataRetentionPolicies.size,
      supportedDataCategories: Object.values(DATA_CATEGORIES),
      supportedConsentTypes: Object.values(CONSENT_TYPES),
      supportedProcessingPurposes: Object.values(PROCESSING_PURPOSES)
    };
  }

  /**
   * Get user privacy summary
   */
  getUserPrivacySummary(userId) {
    const consents = Array.from(this.userConsents.values())
      .filter(consent => consent.userId === userId);
    
    const processingRecords = Array.from(this.dataProcessingRecords.values())
      .filter(record => record.userId === userId);
    
    return {
      userId,
      activeConsents: consents.filter(c => c.granted && new Date(c.expiryDate) > new Date()).length,
      totalConsents: consents.length,
      processingRecords: processingRecords.length,
      dataCategories: [...new Set(processingRecords.map(r => r.dataCategory))],
      lastActivity: processingRecords.length > 0 ? 
        Math.max(...processingRecords.map(r => new Date(r.timestamp).getTime())) : null
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.userConsents.clear();
    this.dataProcessingRecords.clear();
    this.anonymizationRules.clear();
    this.dataRetentionPolicies.clear();
    console.log('PrivacyManager cleaned up');
  }
}

// Singleton instance
let privacyManagerInstance = null;

/**
 * Get PrivacyManager instance
 */
export const getPrivacyManager = () => {
  if (!privacyManagerInstance) {
    privacyManagerInstance = new PrivacyManager();
  }
  return privacyManagerInstance;
};

export default PrivacyManager;
