/**
 * Service Worker registration and management utilities
 * Provides enhanced service worker lifecycle management and communication
 */

import { CONFIG } from './constants';

export interface ServiceWorkerMessage {
  type: string;
  data?: any;
  id?: string;
}

export interface ServiceWorkerResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isActive: boolean;
  registration?: ServiceWorkerRegistration;
  error?: string;
}

/**
 * Service Worker Manager class
 */
export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private messageId = 0;

  private constructor() {}

  public static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  /**
   * Check if service workers are supported
   */
  public isSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  /**
   * Register service worker with enhanced error handling
   */
  public async register(): Promise<ServiceWorkerStatus> {
    if (!this.isSupported()) {
      return {
        isSupported: false,
        isRegistered: false,
        isActive: false,
        error: 'Service workers not supported'
      };
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      // Wait for the service worker to become active
      await this.waitForServiceWorker();

      // Set up message handling
      this.setupMessageHandling();

      // Set up update handling
      this.setupUpdateHandling();

      return {
        isSupported: true,
        isRegistered: true,
        isActive: true,
        registration: this.registration
      };

    } catch (error) {
      console.error('Service worker registration failed:', error);
      return {
        isSupported: true,
        isRegistered: false,
        isActive: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  /**
   * Unregister service worker
   */
  public async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();
      this.registration = null;
      return result;
    } catch (error) {
      console.error('Service worker unregistration failed:', error);
      return false;
    }
  }

  /**
   * Get current service worker status
   */
  public getStatus(): ServiceWorkerStatus {
    if (!this.isSupported()) {
      return {
        isSupported: false,
        isRegistered: false,
        isActive: false
      };
    }

    return {
      isSupported: true,
      isRegistered: !!this.registration,
      isActive: !!this.registration?.active,
      registration: this.registration
    };
  }

  /**
   * Send message to service worker
   */
  public async sendMessage(message: ServiceWorkerMessage): Promise<ServiceWorkerResponse> {
    if (!this.registration?.active) {
      return {
        success: false,
        error: 'Service worker not active'
      };
    }

    const messageId = (++this.messageId).toString();
    const messageWithId = { ...message, id: messageId };

    return new Promise((resolve) => {
      const channel = new MessageChannel();
      
      channel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      this.registration!.active!.postMessage(messageWithId, [channel.port2]);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        resolve({
          success: false,
          error: 'Message timeout'
        });
      }, 10000);
    });
  }

  /**
   * Register message handler
   */
  public onMessage(type: string, handler: (data: any) => void): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Remove message handler
   */
  public offMessage(type: string): void {
    this.messageHandlers.delete(type);
  }

  /**
   * Force service worker update
   */
  public async update(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      await this.registration.update();
      return true;
    } catch (error) {
      console.error('Service worker update failed:', error);
      return false;
    }
  }

  /**
   * Skip waiting and activate new service worker
   */
  public async skipWaiting(): Promise<boolean> {
    try {
      const response = await this.sendMessage({ type: 'SKIP_WAITING' });
      return response.success;
    } catch (error) {
      console.error('Skip waiting failed:', error);
      return false;
    }
  }

  /**
   * Check storage quota
   */
  public async checkStorage(): Promise<any> {
    try {
      const response = await this.sendMessage({ type: 'CHECK_STORAGE' });
      return response;
    } catch (error) {
      console.error('Storage check failed:', error);
      return { success: false, error: 'Storage check failed' };
    }
  }

  /**
   * Clean up cache
   */
  public async cleanupCache(): Promise<boolean> {
    try {
      const response = await this.sendMessage({ type: 'CLEANUP_CACHE' });
      return response.success;
    } catch (error) {
      console.error('Cache cleanup failed:', error);
      return false;
    }
  }

  /**
   * Force sync offline data
   */
  public async forceSync(): Promise<any> {
    try {
      const response = await this.sendMessage({ type: 'FORCE_SYNC' });
      return response;
    } catch (error) {
      console.error('Force sync failed:', error);
      return { success: false, error: 'Force sync failed' };
    }
  }

  /**
   * Wait for service worker to become active
   */
  private async waitForServiceWorker(): Promise<void> {
    if (!this.registration) {
      throw new Error('No registration found');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Service worker activation timeout'));
      }, 10000);

      if (this.registration.active) {
        clearTimeout(timeout);
        resolve();
        return;
      }

      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              clearTimeout(timeout);
              resolve();
            }
          });
        }
      });
    });
  }

  /**
   * Set up message handling from service worker
   */
  private setupMessageHandling(): void {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, data, id } = event.data;
      
      if (id) {
        // This is a response to a message we sent
        return;
      }

      const handler = this.messageHandlers.get(type);
      if (handler) {
        handler(data);
      }
    });
  }

  /**
   * Set up service worker update handling
   */
  private setupUpdateHandling(): void {
    if (!this.registration) {
      return;
    }

    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration!.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker is available
            this.notifyUpdateAvailable();
          }
        });
      }
    });
  }

  /**
   * Notify that a service worker update is available
   */
  private notifyUpdateAvailable(): void {
    // Dispatch custom event for update notification
    window.dispatchEvent(new CustomEvent('sw-update-available', {
      detail: { registration: this.registration }
    }));
  }
}

/**
 * Initialize service worker
 */
export async function initializeServiceWorker(): Promise<ServiceWorkerStatus> {
  const manager = ServiceWorkerManager.getInstance();
  return await manager.register();
}

/**
 * Get service worker manager instance
 */
export function getServiceWorkerManager(): ServiceWorkerManager {
  return ServiceWorkerManager.getInstance();
}

/**
 * Service worker event listeners for common operations
 */
export function setupServiceWorkerListeners(): void {
  const manager = getServiceWorkerManager();

  // Handle offline/online status
  manager.onMessage('NETWORK_STATUS', (data) => {
    window.dispatchEvent(new CustomEvent('network-status', { detail: data }));
  });

  // Handle sync status
  manager.onMessage('SYNC_STATUS', (data) => {
    window.dispatchEvent(new CustomEvent('sync-status', { detail: data }));
  });

  // Handle storage quota warnings
  manager.onMessage('STORAGE_WARNING', (data) => {
    window.dispatchEvent(new CustomEvent('storage-warning', { detail: data }));
  });
}

export default ServiceWorkerManager;
