'use client';

import { useState, useEffect } from 'react';
import { useCheckerStore } from '@/lib/store';

export function CheckerEngine() {
  const {
    accounts,
    proxies,
    config,
    selectedPlatform,
    isRunning,
    setRunning,
    addResult,
    updateStats,
    clearResults,
  } = useCheckerStore();

  const [progress, setProgress] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);

  const startChecking = async () => {
    if (accounts.length === 0) {
      alert('Please upload combo list first!');
      return;
    }

    clearResults();
    setRunning(true);
    setProgress(0);
    const start = Date.now();
    setStartTime(start);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 5;
      });
    }, 500);

    try {
      const response = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform,
          accounts,
          proxies: config.proxyEnabled ? proxies : [],
          config,
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await response.json();

      if (data.success) {
        // Add results one by one
        data.results.forEach((result: any) => {
          addResult(result);
        });

        // Update final stats
        const elapsed = (Date.now() - start) / 1000;
        const cpm = (data.results.length / elapsed) * 60;

        updateStats({
          total: accounts.length,
          checked: data.results.length,
          valid: data.stats.valid,
          invalid: data.stats.invalid,
          errors: data.stats.errors,
          cpm,
          elapsed,
          eta: 0,
        });

        alert(`Checking completed!\nValid: ${data.stats.valid} | Invalid: ${data.stats.invalid} | Errors: ${data.stats.errors}`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      alert(`Failed to check accounts: ${error.message}`);
    } finally {
      setRunning(false);
      setProgress(0);
    }
  };

  const stopChecking = () => {
    setRunning(false);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Checker Engine</h2>
        
        {isRunning && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-400">Running...</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {isRunning && (
        <div className="mb-4">
          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-400 mt-2 text-center">
            {progress.toFixed(1)}% Complete
          </p>
        </div>
      )}

      {/* Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700/50 p-3 rounded-lg">
          <p className="text-xs text-gray-400">Accounts Loaded</p>
          <p className="text-xl font-bold text-blue-400">{accounts.length}</p>
        </div>
        <div className="bg-gray-700/50 p-3 rounded-lg">
          <p className="text-xs text-gray-400">Proxies Loaded</p>
          <p className="text-xl font-bold text-purple-400">{proxies.length}</p>
        </div>
        <div className="bg-gray-700/50 p-3 rounded-lg">
          <p className="text-xs text-gray-400">Threads</p>
          <p className="text-xl font-bold text-green-400">{config.threads}</p>
        </div>
        <div className="bg-gray-700/50 p-3 rounded-lg">
          <p className="text-xs text-gray-400">Proxy Mode</p>
          <p className="text-xl font-bold text-yellow-400">
            {config.proxyEnabled ? 'ON' : 'OFF'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        {!isRunning ? (
          <button
            onClick={startChecking}
            disabled={accounts.length === 0}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg transition-all font-bold text-lg shadow-lg"
          >
            🚀 Start Checking
          </button>
        ) : (
          <button
            onClick={stopChecking}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg transition-all font-bold text-lg shadow-lg"
          >
            ⏹️ Stop Checking
          </button>
        )}

        <button
          onClick={clearResults}
          disabled={isRunning}
          className="px-6 py-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
        >
          🗑️ Clear
        </button>
      </div>
    </div>
  );
}
