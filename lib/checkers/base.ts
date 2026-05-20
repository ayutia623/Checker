import axios, { AxiosInstance } from 'axios';
import { Proxy, CheckResult, CaptureData } from '@/types';
import { ProxyManager } from '@/lib/utils/proxy';
import { getPlatformCredentialType } from '@/lib/platforms';

export abstract class BaseChecker {
  protected client: AxiosInstance;
  protected proxy: Proxy | null = null;
  protected timeout: number = 30000;
  protected platform: string = '';

  constructor(platform?: string, proxy?: Proxy, timeout?: number) {
    this.platform = platform || '';
    if (proxy) {
      this.proxy = proxy;
    }
    if (timeout) {
      this.timeout = timeout;
    }

    this.client = axios.create({
      timeout: this.timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      ...(proxy && {
        httpsAgent: new ProxyManager([proxy]).getAgent(proxy),
      }),
    });
  }

  // Main check method that tries both formats if applicable
  abstract check(credential: string, password: string): Promise<CheckResult>;

  // Helper method for dual format checking
  protected async checkWithFallback(
    credential: string, 
    password: string,
    primaryCheckFn: (cred: string, pass: string) => Promise<CheckResult>,
    fallbackCheckFn?: (cred: string, pass: string) => Promise<CheckResult>
  ): Promise<CheckResult> {
    try {
      // Try primary authentication method
      const result = await primaryCheckFn(credential, password);
      
      // If successful or no fallback, return result
      if (result.status === 'valid' || !fallbackCheckFn) {
        return result;
      }
      
      // If failed and we have fallback, try it
      if (result.status === 'invalid') {
        await this.sleep(1000); // Brief delay between attempts
        return await fallbackCheckFn(credential, password);
      }
      
      return result;
    } catch (error) {
      // If primary method errors and we have fallback, try it
      if (fallbackCheckFn) {
        try {
          await this.sleep(1000);
          return await fallbackCheckFn(credential, password);
        } catch (fallbackError) {
          // Return original error if fallback also fails
          return this.createResult(credential, password, this.platform, 'error', undefined, (error as Error).message);
        }
      }
      
      return this.createResult(credential, password, this.platform, 'error', undefined, (error as Error).message);
    }
  }

  protected createResult(
    credential: string,
    password: string,
    platform: string,
    status: 'valid' | 'invalid' | 'error',
    capture?: CaptureData,
    error?: string
  ): CheckResult {
    const credentialType = this.detectCredentialType(credential);
    
    return {
      account: { 
        email: credential, // Keep for backward compatibility
        password, 
        platform,
        credentialType 
      },
      status,
      capture,
      error,
      timestamp: Date.now(),
      proxy: this.proxy || undefined,
    };
  }

  // Intelligent credential type detection
  protected detectCredentialType(credential: string): 'email' | 'username' {
    // Email pattern detection
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (emailRegex.test(credential)) {
      return 'email';
    }
    
    // Check platform preference
    if (this.platform) {
      const platformType = getPlatformCredentialType(this.platform);
      if (platformType === 'username') {
        return 'username';
      }
    }
    
    // Default fallback logic
    if (credential.includes('@')) {
      return 'email';
    }
    
    return 'username';
  }

  // Check if credential looks like an email
  protected isEmail(credential: string): boolean {
    return this.detectCredentialType(credential) === 'email';
  }

  // Check if credential looks like a username
  protected isUsername(credential: string): boolean {
    return this.detectCredentialType(credential) === 'username';
  }

  // Generate random delay for rate limiting
  protected getRandomDelay(min: number = 1000, max: number = 3000): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  protected async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Enhanced error handling
  protected handleError(error: any, credential: string, password: string): CheckResult {
    let errorMessage = 'Unknown error';
    let status: 'invalid' | 'error' = 'error';
    
    if (error.response) {
      const statusCode = error.response.status;
      
      switch (statusCode) {
        case 401:
        case 403:
          status = 'invalid';
          errorMessage = 'Invalid credentials';
          break;
        case 429:
          errorMessage = 'Rate limited - too many requests';
          break;
        case 404:
          errorMessage = 'Endpoint not found';
          break;
        case 500:
        case 502:
        case 503:
          errorMessage = 'Server error';
          break;
        default:
          errorMessage = `HTTP ${statusCode}: ${error.response.statusText}`;
      }
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      errorMessage = 'Connection failed';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Request timeout';
    } else {
      errorMessage = error.message || 'Unknown error';
    }
    
    return this.createResult(credential, password, this.platform, status, undefined, errorMessage);
  }
}
