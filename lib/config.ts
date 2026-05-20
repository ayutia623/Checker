// Configuration management for environment variables
export interface AppConfig {
  // API Keys
  steamApiKey?: string;
  discordClientId?: string;
  discordClientSecret?: string;
  instagramClientId?: string;
  instagramClientSecret?: string;
  spotifyClientId?: string;
  spotifyClientSecret?: string;
  riotApiKey?: string;

  // Rate Limiting
  defaultRateLimit: number;
  defaultTimeout: number;
  defaultRetries: number;
  defaultRetryDelay: number;

  // Proxy Configuration
  proxyTimeout: number;
  maxProxyRetries: number;

  // Security Features
  enableCaptchaDetection: boolean;
  enableRateLimitDetection: boolean;
  enable2FADetection: boolean;

  // Logging
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logToFile: boolean;
  logFilePath: string;

  // Anti-Detection
  userAgentRotation: boolean;
  randomDelays: boolean;
  minDelay: number;
  maxDelay: number;

  // Threading
  minThreads: number;
  maxThreads: number;
  defaultThreads: number;

  // Platform-specific Rate Limits
  platformRateLimits: {
    discord: number;
    instagram: number;
    steam: number;
    spotify: number;
    riot: number;
  };
}

class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadConfig(): AppConfig {
    return {
      // API Keys
      steamApiKey: process.env.STEAM_API_KEY,
      discordClientId: process.env.DISCORD_CLIENT_ID,
      discordClientSecret: process.env.DISCORD_CLIENT_SECRET,
      instagramClientId: process.env.INSTAGRAM_CLIENT_ID,
      instagramClientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
      spotifyClientId: process.env.SPOTIFY_CLIENT_ID,
      spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      riotApiKey: process.env.RIOT_API_KEY,

      // Rate Limiting
      defaultRateLimit: parseInt(process.env.DEFAULT_RATE_LIMIT_PER_MINUTE || '60'),
      defaultTimeout: parseInt(process.env.DEFAULT_TIMEOUT_MS || '30000'),
      defaultRetries: parseInt(process.env.DEFAULT_RETRIES || '3'),
      defaultRetryDelay: parseInt(process.env.DEFAULT_RETRY_DELAY_MS || '1000'),

      // Proxy Configuration
      proxyTimeout: parseInt(process.env.DEFAULT_PROXY_TIMEOUT_MS || '10000'),
      maxProxyRetries: parseInt(process.env.MAX_PROXY_RETRIES || '2'),

      // Security Features
      enableCaptchaDetection: process.env.ENABLE_CAPTCHA_DETECTION === 'true',
      enableRateLimitDetection: process.env.ENABLE_RATE_LIMIT_DETECTION === 'true',
      enable2FADetection: process.env.ENABLE_2FA_DETECTION === 'true',

      // Logging
      logLevel: (process.env.LOG_LEVEL as any) || 'info',
      logToFile: process.env.LOG_TO_FILE === 'true',
      logFilePath: process.env.LOG_FILE_PATH || './logs/checker.log',

      // Anti-Detection
      userAgentRotation: process.env.USER_AGENT_ROTATION !== 'false',
      randomDelays: process.env.RANDOM_DELAYS !== 'false',
      minDelay: parseInt(process.env.MIN_DELAY_MS || '500'),
      maxDelay: parseInt(process.env.MAX_DELAY_MS || '2000'),

      // Threading
      minThreads: parseInt(process.env.MIN_THREADS || '1'),
      maxThreads: parseInt(process.env.MAX_THREADS || '200'),
      defaultThreads: parseInt(process.env.DEFAULT_THREADS || '10'),

      // Platform-specific Rate Limits
      platformRateLimits: {
        discord: parseInt(process.env.DISCORD_RATE_LIMIT || '30'),
        instagram: parseInt(process.env.INSTAGRAM_RATE_LIMIT || '20'),
        steam: parseInt(process.env.STEAM_RATE_LIMIT || '100'),
        spotify: parseInt(process.env.SPOTIFY_RATE_LIMIT || '50'),
        riot: parseInt(process.env.RIOT_RATE_LIMIT || '100'),
      },
    };
  }

  public getConfig(): AppConfig {
    return this.config;
  }

  public get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  public getPlatformRateLimit(platform: string): number {
    const platformLimits = this.config.platformRateLimits as any;
    return platformLimits[platform] || this.config.defaultRateLimit;
  }

  public isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  public isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  // Validate required configuration
  public validateConfig(): { isValid: boolean; missingKeys: string[] } {
    const missingKeys: string[] = [];

    // Check critical API keys for production
    if (this.isProduction()) {
      if (!this.config.steamApiKey) missingKeys.push('STEAM_API_KEY');
      if (!this.config.riotApiKey) missingKeys.push('RIOT_API_KEY');
    }

    // Validate numeric configurations
    if (this.config.defaultTimeout < 1000) {
      console.warn('DEFAULT_TIMEOUT_MS is too low, using minimum 1000ms');
    }

    if (this.config.defaultThreads > this.config.maxThreads) {
      console.warn('DEFAULT_THREADS exceeds MAX_THREADS, adjusting...');
    }

    return {
      isValid: missingKeys.length === 0,
      missingKeys,
    };
  }

  // Get user agent based on configuration
  public shouldRotateUserAgent(): boolean {
    return this.config.userAgentRotation;
  }

  // Get random delay if enabled
  public getRandomDelay(): number {
    if (!this.config.randomDelays) return 0;
    
    const min = this.config.minDelay;
    const max = this.config.maxDelay;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Log configuration status
  public logConfigStatus(): void {
    const validation = this.validateConfig();
    
    console.log('🔧 Configuration Status:');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Valid: ${validation.isValid ? '✅' : '❌'}`);
    
    if (validation.missingKeys.length > 0) {
      console.log('Missing Keys:', validation.missingKeys.join(', '));
    }

    console.log('Rate Limits:', {
      default: this.config.defaultRateLimit,
      platforms: this.config.platformRateLimits,
    });

    console.log('Security Features:', {
      captcha: this.config.enableCaptchaDetection,
      rateLimit: this.config.enableRateLimitDetection,
      twoFA: this.config.enable2FADetection,
    });

    console.log('Anti-Detection:', {
      userAgent: this.config.userAgentRotation,
      delays: this.config.randomDelays,
    });
  }
}

// Export singleton instance
export const config = ConfigManager.getInstance();

