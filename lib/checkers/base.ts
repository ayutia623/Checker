import axios, { AxiosInstance } from 'axios';
import { Proxy, CheckResult, CaptureData } from '@/types';
import { ProxyManager } from '@/lib/utils/proxy';

export abstract class BaseChecker {
  protected client: AxiosInstance;
  protected proxy: Proxy | null = null;
  protected timeout: number = 30000;

  constructor(proxy?: Proxy, timeout?: number) {
    if (proxy) {
      this.proxy = proxy;
    }
    if (timeout) {
      this.timeout = timeout;
    }

    this.client = axios.create({
      timeout: this.timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      ...(proxy && {
        httpsAgent: new ProxyManager([proxy]).getAgent(proxy),
      }),
    });
  }

  abstract check(credential: string, password: string): Promise<CheckResult>;

  protected createResult(
    credential: string,
    password: string,
    platform: string,
    status: 'valid' | 'invalid' | 'error',
    capture?: CaptureData,
    error?: string
  ): CheckResult {
    return {
      account: { email: credential, password, platform }, // Keep email field for backward compatibility
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
