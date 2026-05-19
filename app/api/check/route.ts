import { NextRequest, NextResponse } from 'next/server';
import { Proxy, CheckResult } from '@/types';
import { ProxyManager } from '@/lib/utils/proxy';
import { ThreadManager } from '@/lib/utils/threading';

// Import all checkers
import { SteamChecker } from '@/lib/checkers/steam';
import { RiotChecker } from '@/lib/checkers/riot';
import { RobloxChecker } from '@/lib/checkers/roblox';
import { EpicGamesChecker } from '@/lib/checkers/epic';
import { DiscordChecker } from '@/lib/checkers/discord';
import { NetflixChecker } from '@/lib/checkers/netflix';
import { HotmailChecker } from '@/lib/checkers/hotmail';
import { SpotifyChecker } from '@/lib/checkers/spotify';
import { InstagramChecker } from '@/lib/checkers/instagram';

const checkerMap: Record<string, any> = {
  steam: SteamChecker,
  riot: RiotChecker,
  roblox: RobloxChecker,
  epic: EpicGamesChecker,
  discord: DiscordChecker,
  netflix: NetflixChecker,
  hotmail: HotmailChecker,
  spotify: SpotifyChecker,
  instagram: InstagramChecker,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      platform,
      accounts,
      proxies = [],
      config = {},
    } = body;

    if (!platform || !checkerMap[platform]) {
      return NextResponse.json(
        { error: 'Invalid platform' },
        { status: 400 }
      );
    }

    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
      return NextResponse.json(
        { error: 'No accounts provided' },
        { status: 400 }
      );
    }

    const CheckerClass = checkerMap[platform];
    const proxyManager = proxies.length > 0 ? new ProxyManager(proxies) : null;
    const threadManager = new ThreadManager(config.threads || 10);

    const tasks = accounts.map((account: { email: string; password: string }) => {
      return async () => {
        const proxy = proxyManager?.getNext() || undefined;
        const checker = new CheckerClass(proxy, config.timeout);
        return await checker.check(account.email, account.password);
      };
    });

    const results = await threadManager.execute(tasks);

    return NextResponse.json({
      success: true,
      results,
      stats: {
        total: results.length,
        valid: results.filter((r: CheckResult) => r.status === 'valid').length,
        invalid: results.filter((r: CheckResult) => r.status === 'invalid').length,
        errors: results.filter((r: CheckResult) => r.status === 'error').length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
