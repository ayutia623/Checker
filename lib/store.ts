import { create } from 'zustand';
import { CheckerStore, CheckerConfig, CheckerStats } from '@/types';

const defaultConfig: CheckerConfig = {
  threads: 10,
  retries: 3,
  timeout: 30000,
  proxyEnabled: false,
  proxyRotation: true,
  stopOnError: false,
};

const defaultStats: CheckerStats = {
  total: 0,
  checked: 0,
  valid: 0,
  invalid: 0,
  errors: 0,
  cpm: 0,
  elapsed: 0,
  eta: 0,
};

export const useCheckerStore = create<CheckerStore>((set) => ({
  accounts: [],
  results: [],
  proxies: [],
  config: defaultConfig,
  stats: defaultStats,
  isRunning: false,
  selectedPlatform: 'steam',

  setAccounts: (accounts) => set({ accounts }),
  
  setProxies: (proxies) => set({ proxies }),
  
  setConfig: (config) => set((state) => ({
    config: { ...state.config, ...config },
  })),
  
  addResult: (result) => set((state) => ({
    results: [...state.results, result],
  })),
  
  clearResults: () => set({ 
    results: [],
    stats: defaultStats,
  }),
  
  setRunning: (running) => set({ isRunning: running }),
  
  setSelectedPlatform: (platform) => set({ selectedPlatform: platform }),
  
  updateStats: (stats) => set((state) => ({
    stats: { ...state.stats, ...stats },
  })),
}));
