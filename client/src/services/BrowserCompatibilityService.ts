interface BrowserInfo {
  name: string;
  version: string;
  isSupported: boolean;
  features: {
    webAuthn: boolean;
    webCrypto: boolean;
    secureContext: boolean;
    indexedDB: boolean;
    localStorage: boolean;
  };
}

export class BrowserCompatibilityService {
  private static instance: BrowserCompatibilityService;
  private readonly minimumVersions: Record<string, number> = {
    chrome: 67,
    firefox: 60,
    safari: 13,
    edge: 79,
    opera: 54
  };

  private constructor() {}

  public static getInstance(): BrowserCompatibilityService {
    if (!BrowserCompatibilityService.instance) {
      BrowserCompatibilityService.instance = new BrowserCompatibilityService();
    }
    return BrowserCompatibilityService.instance;
  }

  /**
   * Get detailed browser information and compatibility status
   */
  public getBrowserInfo(): BrowserInfo {
    const userAgent = navigator.userAgent;
    const browserData = this.parseBrowserInfo(userAgent);
    
    return {
      name: browserData.name,
      version: browserData.version,
      isSupported: this.isBrowserSupported(browserData.name, browserData.version),
      features: this.checkFeatureSupport()
    };
  }

  /**
   * Check if the current browser is supported
   */
  public isBrowserSupported(browserName: string, version: string): boolean {
    const numericVersion = parseFloat(version);
    const minVersion = this.minimumVersions[browserName.toLowerCase()];
    
    if (!minVersion) {
      return false; // Unsupported browser
    }

    return numericVersion >= minVersion;
  }

  /**
   * Check support for required features
   */
  private checkFeatureSupport(): BrowserInfo['features'] {
    return {
      webAuthn: this.isWebAuthnSupported(),
      webCrypto: this.isWebCryptoSupported(),
      secureContext: this.isSecureContext(),
      indexedDB: this.isIndexedDBSupported(),
      localStorage: this.isLocalStorageSupported()
    };
  }

  /**
   * Parse browser name and version from user agent
   */
  private parseBrowserInfo(userAgent: string): { name: string; version: string } {
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('edge') || ua.includes('edg')) {
      const match = ua.match(/edge?\/(\d+(\.\d+)?)/);
      return { name: 'Edge', version: match ? match[1] : '0' };
    }
    
    if (ua.includes('chrome')) {
      const match = ua.match(/chrome\/(\d+(\.\d+)?)/);
      return { name: 'Chrome', version: match ? match[1] : '0' };
    }
    
    if (ua.includes('firefox')) {
      const match = ua.match(/firefox\/(\d+(\.\d+)?)/);
      return { name: 'Firefox', version: match ? match[1] : '0' };
    }
    
    if (ua.includes('safari') && !ua.includes('chrome')) {
      const match = ua.match(/version\/(\d+(\.\d+)?)/);
      return { name: 'Safari', version: match ? match[1] : '0' };
    }
    
    if (ua.includes('opera')) {
      const match = ua.match(/opera\/(\d+(\.\d+)?)/);
      return { name: 'Opera', version: match ? match[1] : '0' };
    }

    return { name: 'Unknown', version: '0' };
  }

  /**
   * Check WebAuthn support
   */
  private isWebAuthnSupported(): boolean {
    return !!(
      window &&
      'PublicKeyCredential' in window &&
      'credentials' in navigator
    );
  }

  /**
   * Check Web Crypto API support
   */
  private isWebCryptoSupported(): boolean {
    return !!(
      window.crypto &&
      window.crypto.subtle &&
      typeof window.crypto.getRandomValues === 'function'
    );
  }

  /**
   * Check if running in a secure context
   */
  private isSecureContext(): boolean {
    return window.isSecureContext === true;
  }

  /**
   * Check IndexedDB support
   */
  private isIndexedDBSupported(): boolean {
    return !!(
      window.indexedDB ||
      window.mozIndexedDB ||
      window.webkitIndexedDB ||
      window.msIndexedDB
    );
  }

  /**
   * Check localStorage support
   */
  private isLocalStorageSupported(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get upgrade instructions for unsupported browsers
   */
  public getUpgradeInstructions(browserInfo: BrowserInfo): string {
    const { name, version } = browserInfo;
    const minVersion = this.minimumVersions[name.toLowerCase()];

    if (!minVersion) {
      return `Your browser (${name}) is not supported. Please use a modern browser like Chrome, Firefox, Safari, or Edge.`;
    }

    if (parseFloat(version) < minVersion) {
      return `Your ${name} version (${version}) is outdated. Please upgrade to version ${minVersion} or later for full functionality.`;
    }

    return '';
  }

  /**
   * Get alternative authentication methods based on browser support
   */
  public getAlternativeAuthMethods(browserInfo: BrowserInfo): string[] {
    const alternatives: string[] = ['password'];

    // Add other authentication methods based on feature support
    if (browserInfo.features.webCrypto) {
      alternatives.push('time-based-otp');
    }

    if (browserInfo.features.secureContext && browserInfo.features.webCrypto) {
      alternatives.push('sms-verification');
    }

    return alternatives;
  }
}
