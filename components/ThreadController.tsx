'use client';

import { useCheckerStore } from '@/lib/store';

export function ThreadController() {
  const { config, setConfig } = useCheckerStore();

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-bold mb-4">Thread Settings</h3>
      
      {/* Thread Slider */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm text-gray-400">Threads</label>
          <span className="text-xl font-bold text-blue-400">{config.threads}</span>
        </div>
        <input
          type="range"
          min="1"
          max="200"
          value={config.threads}
          onChange={(e) => setConfig({ threads: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1</span>
          <span>50</span>
          <span>100</span>
          <span>150</span>
          <span>200</span>
        </div>
      </div>

      {/* Timeout */}
      <div className="mb-4">
        <label className="text-sm text-gray-400 mb-2 block">Timeout (ms)</label>
        <input
          type="number"
          value={config.timeout}
          onChange={(e) => setConfig({ timeout: parseInt(e.target.value) })}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="5000"
          max="60000"
          step="1000"
        />
      </div>

      {/* Options */}
      <div className="space-y-3">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.proxyEnabled}
            onChange={(e) => setConfig({ proxyEnabled: e.target.checked })}
            className="w-4 h-4 rounded bg-gray-700 border-gray-600"
          />
          <span className="text-sm">Enable Proxy</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.proxyRotation}
            onChange={(e) => setConfig({ proxyRotation: e.target.checked })}
            className="w-4 h-4 rounded bg-gray-700 border-gray-600"
            disabled={!config.proxyEnabled}
          />
          <span className="text-sm">Proxy Rotation</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.stopOnError}
            onChange={(e) => setConfig({ stopOnError: e.target.checked })}
            className="w-4 h-4 rounded bg-gray-700 border-gray-600"
          />
          <span className="text-sm">Stop on Error</span>
        </label>
      </div>
    </div>
  );
}
