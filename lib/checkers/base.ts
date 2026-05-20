import axios, { AxiosInstance } from 'axios';
import { Proxy, CheckResult, CaptureData } from '@/types';
import { ProxyManager } from '@/lib/utils/proxy';
import { config } from '@/lib/config';

export abstract class BaseChecker {
  protected client: AxiosInstance;
  protected proxy: Proxy | null = null;
  protected timeout: number;
  protected retries: number;
  protected retryDelay: number;
  protected platform: string;

  // Rotating User Agents for better success rate
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  ];

  constructor(platform: string, proxy?: Proxy, timeout?: number, retries?: number) {
    this.platform = platform;
    
    if (proxy) {
      this.proxy = proxy;
    }
    
    // Use configuration values with fallbacks
    this.timeout = timeout || config.get('defaultTimeout');
    this.retries = retries || config.get('defaultRetries');
    this.retryDelay = config.get('defaultRetryDelay');

    this.client = axios.create({
      timeout: this.timeout,
      headers: {
        'User-Agent': this.getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      ...(proxy && {
        httpsAgent: new ProxyManager([proxy]).getAgent(proxy),
        timeout: config.get('proxyTimeout'),
      }),
    });
  }

  abstract check(email: string, password: string): Promise<CheckResult>;

  protected async checkWithRetry(email: string, password: string): Promise<CheckResult> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const result = await this.check(email, password);
        return result;
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on authentication failures (401, 403)
        if (error.response?.status === 401 || error.response?.status === 403) {
          break;
        }
        
        // Don't retry on rate limiting with long delays
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          if (retryAfter && parseInt(retryAfter) > 60) {
            break;
          }
        }
        
        if (attempt < this.retries) {
          const delay = this.retryDelay * attempt + Math.random() * 1000;
          await this.sleep(delay);
        }
      }
    }
    
    return this.createResult(
      email,
      password,
      this.constructor.name.replace('Checker', '').toLowerCase(),
      'error',
      undefined,
      lastError?.message || 'Failed after retries'
    );
  }

  protected getRandomUserAgent(): string {
    if (!config.get('userAgentRotation')) {
      return this.userAgents[0]; // Use first one if rotation disabled
    }
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  protected async applyRandomDelay(): Promise<void> {
    const delay = config.getRandomDelay();
    if (delay > 0) {
      await this.sleep(delay);
    }
  }

  protected detectCaptcha(responseText: string): boolean {
    if (!config.get('enableCaptchaDetection')) {
      return false;
    }

    const captchaIndicators = [
      'captcha',
      'recaptcha',
      'hcaptcha',
      'cloudflare',
      'please prove you are human',
      'verification required',
      'security check',
    ];
    
    const lowercaseText = responseText.toLowerCase();
    return captchaIndicators.some(indicator => lowercaseText.includes(indicator));
  }

  protected detectRateLimit(status: number, headers: any): { isRateLimit: boolean; retryAfter?: number } {
    if (!config.get('enableRateLimitDetection')) {
      return { isRateLimit: false };
    }

    if (status === 429) {
      const retryAfter = headers['retry-after'] ? parseInt(headers['retry-after']) : 60;
      return { isRateLimit: true, retryAfter };
    }
    
    if (status === 503 && headers['server']?.includes('cloudflare')) {
      return { isRateLimit: true, retryAfter: 60 };
    }
    
    return { isRateLimit: false };
  }

  protected detect2FA(responseData: any): boolean {
    if (!config.get('enable2FADetection')) {
      return false;
    }

    if (typeof responseData === 'string') {
      const indicators = ['2fa', 'two-factor', 'verification code', 'authenticator', 'mfa'];
      return indicators.some(indicator => responseData.toLowerCase().includes(indicator));
    }
    
    if (typeof responseData === 'object') {
      return !!(responseData?.requires_2fa || responseData?.mfa || responseData?.two_factor);
    }
    
    return false;
  }

  protected getPlatformRateLimit(): number {
    return config.getPlatformRateLimit(this.platform);
  }

  protected log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    const configLevel = config.get('logLevel');
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    
    if (levels[level] >= levels[configLevel]) {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [${level.toUpperCase()}] [${this.platform}] ${message}`;
      
      console.log(logMessage, data ? data : '');
      
      // TODO: Implement file logging if enabled
      if (config.get('logToFile')) {
        // Would write to log file here
      }
    }
  }

  protected createResult(
    email: string,
    password: string,
    platform: string,
    status: 'valid' | 'invalid' | 'error',
    capture?: CaptureData,
    error?: string
  ): CheckResult {
    return {
      account: { email, password, platform },
      status,
      capture,
      error,
      timestamp: Date.now(),
      proxy: this.proxy || undefined,
    };
  }

  protected async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
