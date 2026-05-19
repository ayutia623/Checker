'use client';

import { useState } from 'react';
import { useCheckerStore } from '@/lib/store';
import { ComboUploader } from './ComboUploader';
import { ProxyManager } from './ProxyManager';
import { PlatformSelector } from './PlatformSelector';
import { ThreadController } from './ThreadController';
import { ResultsTable } from './ResultsTable';
import { StatsCard } from './StatsCard';
import { CheckerEngine } from './CheckerEngine';

export function Dashboard() {
  const { stats, isRunning, accounts, selectedPlatform } = useCheckerStore();
  const [showProxyManager, setShowProxyManager] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Multi-Platform Account Checker
          </h1>
          <p className="text-gray-400 mt-2">
            Check accounts across 70+ platforms with proxy support and multi-threading
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatsCard
            label="Total"
            value={stats.total}
            className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30"
          />
          <StatsCard
            label="Checked"
            value={stats.checked}
            className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/30"
          />
          <StatsCard
            label="Valid"
            value={stats.valid}
            className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30"
          />
          <StatsCard
            label="Invalid"
            value={stats.invalid}
            className="bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/30"
          />
          <StatsCard
            label="Errors"
            value={stats.errors}
            className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-yellow-500/30"
          />
          <StatsCard
            label="CPM"
            value={stats.cpm.toFixed(0)}
            className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border-cyan-500/30"
          />
        </div>



        {/* Control Panel */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Platform Selector */}
          <div className="lg:col-span-1">
            <PlatformSelector />
          </div>

          {/* Combo Uploader */}
          <div className="lg:col-span-1">
            <ComboUploader />
          </div>

          {/* Settings */}
          <div className="lg:col-span-1 space-y-4">
            <ThreadController />
            
            <button
              onClick={() => setShowProxyManager(!showProxyManager)}
              className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors border border-gray-600"
            >
              {showProxyManager ? 'Hide' : 'Show'} Proxy Manager
            </button>
          </div>
        </div>

        {/* Proxy Manager */}
        {showProxyManager && (
          <div className="mb-8">
            <ProxyManager />
          </div>
        )}

        {/* Checker Engine */}
        <div className="mb-8">
          <CheckerEngine />
        </div>

        {/* Results Table */}
        <ResultsTable />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-700 bg-gray-800/50 backdrop-blur-sm mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-gray-400">
          <p>Multi-Platform Account Checker - Support 70+ platforms</p>
          <p className="text-sm mt-2">For educational purposes only</p>
        </div>
      </footer>
    </div>
  );
}
