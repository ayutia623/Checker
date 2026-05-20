'use client';

import { useCheckerStore } from '@/lib/store';
import { useEffect, useState } from 'react';

export function ThreadController() {
  const { config, setConfig } = useCheckerStore();
  const [limits, setLimits] = useState({ min: 1, max: 200, default: 10 });

  // Fetch configuration limits from API
  useEffect(() => {
    // In a real app, you might fetch this from an API
    // For now, we'll use default values that match the config
    setLimits({
      min: 1,
      max: 200,
      default: 10,
    });
  }, []);

  const handleThreadChange = (value: number) => {
    const clampedValue = Math.max(limits.min, Math.min(limits.max, value));
    setConfig({ threads: clampedValue });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-bold mb-4">Thread Settings</h3>
      
      {/* Thread Slider */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm text-gray-400">Threads</label>
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-blue-400">{config.threads}</span>
            {config.threads > 50 && (
              <span className="text-xs bg-yellow-600 px-2 py-1 rounded">High Load</span>
            )}
            {config.threads > 100 && (
              <span className="text-xs bg-red-600 px-2 py-1 rounded">Very High</span>
            )}
          </div>
        </div>
        
        <input
          type="range"
          min={limits.min}
          max={limits.max}
          value={config.threads}
          onChange={(e) => handleThreadChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
        
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{limits.min}</span>
          <span>25</span>
          <span>50</span>
          <span>100</span>
          <span>150</span>
          <span>{limits.max}</span>
        </div>
        
        {/* Quick preset buttons */}
        <div className="flex space-x-2 mt-3">
          {[5, 10, 25, 50, 100].map(preset => (
            <button
              key={preset}
              onClick={() => handleThreadChange(preset)}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                config.threads === preset
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Timeout */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm text-gray-400">Timeout (ms)</label>
          <span className="text-sm text-gray-300">{(config.timeout / 1000).toFixed(0)}s</span>
        </div>
        
        <input
          type="range"
          min="5000"
          max="60000"
          step="5000"
          value={config.timeout}
          onChange={(e) => setConfig({ timeout: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
        
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>5s</span>
          <span>15s</span>
          <span>30s</span>
          <span>45s</span>
          <span>60s</span>
        </div>
      </div>

      {/* Performance Warning */}
      {config.threads > 50 && (
        <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-500">⚠️</span>
            <div>
              <p className="text-yellow-400 text-sm font-medium">High Thread Count</p>
              <p className="text-yellow-300 text-xs">
                Using {config.threads} threads may cause rate limiting. Consider using proxies.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Options */}
      <div className="space-y-3">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm">Enable Proxy</span>
          <input
            type="checkbox"
            checked={config.proxyEnabled}
            onChange={(e) => setConfig({ proxyEnabled: e.target.checked })}
            className="w-4 h-4 rounded bg-gray-700 border-gray-600"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm">Proxy Rotation</span>
          <input
            type="checkbox"
            checked={config.proxyRotation}
            onChange={(e) => setConfig({ proxyRotation: e.target.checked })}
            className="w-4 h-4 rounded bg-gray-700 border-gray-600"
            disabled={!config.proxyEnabled}
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm">Stop on Error</span>
          <input
            type="checkbox"
            checked={config.stopOnError}
            onChange={(e) => setConfig({ stopOnError: e.target.checked })}
            className="w-4 h-4 rounded bg-gray-700 border-gray-600"
          />
        </label>
      </div>

      {/* Configuration Summary */}
      <div className="mt-4 p-3 bg-gray-700/30 rounded-lg border border-gray-600">
        <h4 className="text-xs font-medium text-gray-400 mb-2">Performance Estimate</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500">Est. CPM:</span>
            <span className="ml-1 text-white">{Math.round(config.threads * 2.5)}</span>
          </div>
          <div>
            <span className="text-gray-500">Load Level:</span>
            <span className={`ml-1 ${
              config.threads <= 25 ? 'text-green-400' :
              config.threads <= 50 ? 'text-yellow-400' :
              config.threads <= 100 ? 'text-orange-400' : 'text-red-400'
            }`}>
              {config.threads <= 25 ? 'Low' :
               config.threads <= 50 ? 'Medium' :
               config.threads <= 100 ? 'High' : 'Very High'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
