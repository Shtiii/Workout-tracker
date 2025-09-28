/**
 * Encryption Manager
 * Handles data encryption, decryption, and secure storage
 */

import CryptoJS from 'crypto-js';

// Encryption configuration
const ENCRYPTION_CONFIG = {
  ALGORITHM: 'AES',
  KEY_SIZE: 256,
  IV_SIZE: 16,
  SALT_SIZE: 32,
  ITERATIONS: 10000,
  HASH_ALGORITHM: 'SHA256'
};

// Data sensitivity levels
export const DATA_SENSITIVITY = {
  PUBLIC: 'public',
  INTERNAL: 'internal',
  CONFIDENTIAL: 'confidential',
  RESTRICTED: 'restricted'
};

// Encryption keys for different data types
const ENCRYPTION_KEYS = {
  [DATA_SENSITIVITY.PUBLIC]: null, // No encryption needed
  [DATA_SENSITIVITY.INTERNAL]: 'internal_key_2024',
  [DATA_SENSITIVITY.CONFIDENTIAL]: 'confidential_key_2024',
  [DATA_SENSITIVITY.RESTRICTED]: 'restricted_key_2024'
};

/**
 * Encryption Manager Class
 * Comprehensive data encryption and secure storage management
 */
export class EncryptionManager {
  constructor() {
    this.encryptionKeys = new Map();
    this.keyDerivationCache = new Map();
    this.isInitialized = false;
    
    this.initialize();
  }

  /**
   * Initialize encryption manager
   */
  async initialize() {
    try {
      // Generate or load encryption keys
      await this.initializeEncryptionKeys();
      
      // Set up key rotation
      this.setupKeyRotation();
      
      this.isInitialized = true;
      console.log('EncryptionManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize EncryptionManager:', error);
      throw error;
    }
  }

  /**
   * Initialize encryption keys
   */
  async initializeEncryptionKeys() {
    // In a real implementation, keys would be loaded from secure storage
    // For now, we'll use the predefined keys
    for (const [sensitivity, key] of Object.entries(ENCRYPTION_KEYS)) {
      if (key) {
        this.encryptionKeys.set(sensitivity, key);
      }
    }
  }

  /**
   * Setup key rotation
   */
  setupKeyRotation() {
    // Rotate keys every 30 days
    setInterval(() => {
      this.rotateKeys();
    }, 30 * 24 * 60 * 60 * 1000);
  }

  /**
   * Generate encryption key
   */
  generateKey(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let key = '';
    for (let i = 0; i < length; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  }

  /**
   * Derive key from password
   */
  deriveKey(password, salt, iterations = ENCRYPTION_CONFIG.ITERATIONS) {
    const cacheKey = `${password}_${salt}_${iterations}`;
    
    if (this.keyDerivationCache.has(cacheKey)) {
      return this.keyDerivationCache.get(cacheKey);
    }
    
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: ENCRYPTION_CONFIG.KEY_SIZE / 32,
      iterations: iterations
    });
    
    this.keyDerivationCache.set(cacheKey, key);
    return key;
  }

  /**
   * Generate random salt
   */
  generateSalt(size = ENCRYPTION_CONFIG.SALT_SIZE) {
    return CryptoJS.lib.WordArray.random(size);
  }

  /**
   * Generate random IV
   */
  generateIV(size = ENCRYPTION_CONFIG.IV_SIZE) {
    return CryptoJS.lib.WordArray.random(size);
  }

  /**
   * Encrypt data
   */
  encrypt(data, sensitivity = DATA_SENSITIVITY.CONFIDENTIAL, customKey = null) {
    try {
      // Check if encryption is needed
      if (sensitivity === DATA_SENSITIVITY.PUBLIC) {
        return {
          encrypted: false,
          data: data,
          sensitivity: sensitivity
        };
      }

      // Get encryption key
      const key = customKey || this.encryptionKeys.get(sensitivity);
      if (!key) {
        throw new Error(`No encryption key found for sensitivity level: ${sensitivity}`);
      }

      // Convert data to string if needed
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);

      // Generate salt and IV
      const salt = this.generateSalt();
      const iv = this.generateIV();

      // Derive key from password and salt
      const derivedKey = this.deriveKey(key, salt);

      // Encrypt data
      const encrypted = CryptoJS.AES.encrypt(dataString, derivedKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      return {
        encrypted: true,
        data: encrypted.toString(),
        salt: salt.toString(),
        iv: iv.toString(),
        sensitivity: sensitivity,
        algorithm: ENCRYPTION_CONFIG.ALGORITHM,
        keySize: ENCRYPTION_CONFIG.KEY_SIZE,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error(`Failed to encrypt data: ${error.message}`);
    }
  }

  /**
   * Decrypt data
   */
  decrypt(encryptedData, customKey = null) {
    try {
      // Check if data is encrypted
      if (!encryptedData.encrypted) {
        return encryptedData.data;
      }

      // Get decryption key
      const key = customKey || this.encryptionKeys.get(encryptedData.sensitivity);
      if (!key) {
        throw new Error(`No decryption key found for sensitivity level: ${encryptedData.sensitivity}`);
      }

      // Convert salt and IV back to WordArray
      const salt = CryptoJS.enc.Hex.parse(encryptedData.salt);
      const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);

      // Derive key from password and salt
      const derivedKey = this.deriveKey(key, salt);

      // Decrypt data
      const decrypted = CryptoJS.AES.decrypt(encryptedData.data, derivedKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      
      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(decryptedString);
      } catch {
        return decryptedString;
      }
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error(`Failed to decrypt data: ${error.message}`);
    }
  }

  /**
   * Encrypt sensitive fields in object
   */
  encryptObject(obj, fieldSensitivity = {}) {
    const encrypted = { ...obj };
    
    for (const [field, sensitivity] of Object.entries(fieldSensitivity)) {
      if (obj[field] !== undefined && obj[field] !== null) {
        encrypted[field] = this.encrypt(obj[field], sensitivity);
      }
    }
    
    return encrypted;
  }

  /**
   * Decrypt sensitive fields in object
   */
  decryptObject(obj, fieldSensitivity = {}) {
    const decrypted = { ...obj };
    
    for (const [field, sensitivity] of Object.entries(fieldSensitivity)) {
      if (obj[field] && typeof obj[field] === 'object' && obj[field].encrypted) {
        decrypted[field] = this.decrypt(obj[field]);
      }
    }
    
    return decrypted;
  }

  /**
   * Hash data
   */
  hash(data, algorithm = ENCRYPTION_CONFIG.HASH_ALGORITHM) {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return CryptoJS[algorithm](dataString).toString();
  }

  /**
   * Generate HMAC
   */
  generateHMAC(data, key, algorithm = ENCRYPTION_CONFIG.HASH_ALGORITHM) {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return CryptoJS.HmacSHA256(dataString, key).toString();
  }

  /**
   * Verify HMAC
   */
  verifyHMAC(data, key, hmac, algorithm = ENCRYPTION_CONFIG.HASH_ALGORITHM) {
    const expectedHMAC = this.generateHMAC(data, key, algorithm);
    return expectedHMAC === hmac;
  }

  /**
   * Encrypt file
   */
  async encryptFile(file, sensitivity = DATA_SENSITIVITY.CONFIDENTIAL) {
    try {
      const fileData = await this.readFileAsArrayBuffer(file);
      const encrypted = this.encrypt(fileData, sensitivity);
      
      return {
        ...encrypted,
        originalName: file.name,
        originalSize: file.size,
        originalType: file.type
      };
    } catch (error) {
      console.error('File encryption error:', error);
      throw new Error(`Failed to encrypt file: ${error.message}`);
    }
  }

  /**
   * Decrypt file
   */
  async decryptFile(encryptedFile) {
    try {
      const decryptedData = this.decrypt(encryptedFile);
      
      // Create blob from decrypted data
      const blob = new Blob([decryptedData], { type: encryptedFile.originalType });
      
      return {
        blob,
        name: encryptedFile.originalName,
        size: encryptedFile.originalSize,
        type: encryptedFile.originalType
      };
    } catch (error) {
      console.error('File decryption error:', error);
      throw new Error(`Failed to decrypt file: ${error.message}`);
    }
  }

  /**
   * Read file as ArrayBuffer
   */
  readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Rotate encryption keys
   */
  async rotateKeys() {
    try {
      console.log('Rotating encryption keys...');
      
      // Generate new keys for each sensitivity level
      for (const sensitivity of Object.keys(ENCRYPTION_KEYS)) {
        if (sensitivity !== DATA_SENSITIVITY.PUBLIC) {
          const newKey = this.generateKey();
          this.encryptionKeys.set(sensitivity, newKey);
        }
      }
      
      // Clear key derivation cache
      this.keyDerivationCache.clear();
      
      console.log('Encryption keys rotated successfully');
    } catch (error) {
      console.error('Key rotation error:', error);
    }
  }

  /**
   * Get encryption status
   */
  getEncryptionStatus() {
    return {
      isInitialized: this.isInitialized,
      supportedAlgorithms: [ENCRYPTION_CONFIG.ALGORITHM],
      keySizes: [ENCRYPTION_CONFIG.KEY_SIZE],
      sensitivityLevels: Object.values(DATA_SENSITIVITY),
      activeKeys: Array.from(this.encryptionKeys.keys()),
      cacheSize: this.keyDerivationCache.size
    };
  }

  /**
   * Validate encryption key strength
   */
  validateKeyStrength(key) {
    const strength = {
      score: 0,
      feedback: []
    };
    
    if (key.length >= 16) {
      strength.score += 25;
    } else {
      strength.feedback.push('Key should be at least 16 characters long');
    }
    
    if (/[A-Z]/.test(key)) {
      strength.score += 25;
    } else {
      strength.feedback.push('Key should contain uppercase letters');
    }
    
    if (/[a-z]/.test(key)) {
      strength.score += 25;
    } else {
      strength.feedback.push('Key should contain lowercase letters');
    }
    
    if (/\d/.test(key)) {
      strength.score += 25;
    } else {
      strength.feedback.push('Key should contain numbers');
    }
    
    if (/[!@#$%^&*(),.?":{}|<>]/.test(key)) {
      strength.score += 25;
    } else {
      strength.feedback.push('Key should contain special characters');
    }
    
    return strength;
  }

  /**
   * Generate secure random string
   */
  generateSecureRandom(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }
    
    return result;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.encryptionKeys.clear();
    this.keyDerivationCache.clear();
    console.log('EncryptionManager cleaned up');
  }
}

// Singleton instance
let encryptionManagerInstance = null;

/**
 * Get EncryptionManager instance
 */
export const getEncryptionManager = () => {
  if (!encryptionManagerInstance) {
    encryptionManagerInstance = new EncryptionManager();
  }
  return encryptionManagerInstance;
};

export default EncryptionManager;


