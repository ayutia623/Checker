// Core Types
export type ProxyType = 'http' | 'https' | 'socks4' | 'socks5';

export interface Proxy {
  host: string;
  port: number;
  type: ProxyType;
  username?: string;
  password?: string;
}

export interface Account {
  email: string;
  password: string;
  platform: string;
}

export type CheckStatus = 'valid' | 'invalid' | 'error' | 'checking';

export interface CheckResult {
  account: Account;
  status: CheckStatus;
  capture?: CaptureData;
  error?: string;
  timestamp: number;
  proxy?: Proxy;
}

// Capture Data Types
export interface CaptureData {
  username?: string;
  displayName?: string;
  email?: string;
  emailVerified?: boolean;
  phoneNumber?: string;
  
  // Gaming specific
  level?: number;
  rank?: string;
  region?: string;
  vp?: number; // Valorant Points
  rp?: number; // Riot Points
  steamBalance?: number;
  epicBalance?: number;
  
  // Gaming stats
  wins?: number;
  losses?: number;
  kd?: number;
  playtime?: number;
  
  // Inventory
  skins?: number;
  items?: number;
  characters?: number;
  inventory?: string[];

  
  // Subscription & Premium
  subscription?: string;
  subscriptionExpiry?: string;
  isPremium?: boolean;
  premiumUntil?: string;
  
  // Social Media
  followers?: number;
  following?: number;
  posts?: number;
  verified?: boolean;
  bio?: string;
  
  // Streaming services
  profileName?: string;
  screenCount?: number;
  plan?: string;
  nextBillingDate?: string;
  
  // Mobile games
  diamonds?: number;
  gold?: number;
  gems?: number;
  seasonPass?: boolean;
  
  // Additional info
  createdDate?: string;
  lastLogin?: string;
  country?: string;
  language?: string;
  twoFactorEnabled?: boolean;
  
  // Custom fields for specific platforms
  [key: string]: any;
}


// Platform Types
export type PlatformCategory = 
  | 'email' 
  | 'gaming' 
  | 'mobile-gaming' 
  | 'social-media' 
  | 'streaming' 
  | 'other';

export interface Platform {
  id: string;
  name: string;
  category: PlatformCategory;
  icon?: string;
  enabled: boolean;
}

// Checker Configuration
export interface CheckerConfig {
  threads: number;
  retries: number;
  timeout: number;
  proxyEnabled: boolean;
  proxyRotation: boolean;
  stopOnError: boolean;
}

// Statistics
export interface CheckerStats {
  total: number;
  checked: number;
  valid: number;
  invalid: number;
  errors: number;
  cpm: number; // checks per minute
  elapsed: number; // seconds
  eta: number; // seconds
}

// Store State
export interface CheckerStore {
  accounts: Account[];
  results: CheckResult[];
  proxies: Proxy[];
  config: CheckerConfig;
  stats: CheckerStats;
  isRunning: boolean;
  selectedPlatform: string;
  
  setAccounts: (accounts: Account[]) => void;
  setProxies: (proxies: Proxy[]) => void;
  setConfig: (config: Partial<CheckerConfig>) => void;
  addResult: (result: CheckResult) => void;
  clearResults: () => void;
  setRunning: (running: boolean) => void;
  setSelectedPlatform: (platform: string) => void;
  updateStats: (stats: Partial<CheckerStats>) => void;
}
