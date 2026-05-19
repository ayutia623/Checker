'use client';

import { useState } from 'react';
import { useCheckerStore } from '@/lib/store';
import { PLATFORMS } from '@/lib/platforms';

export function PlatformSelector() {
  const { selectedPlatform, setSelectedPlatform } = useCheckerStore();
  const [category, setCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'All Platforms' },
    { id: 'email', name: 'Email' },
    { id: 'gaming', name: 'Gaming' },
    { id: 'mobile-gaming', name: 'Mobile Gaming' },
    { id: 'social-media', name: 'Social Media' },
    { id: 'streaming', name: 'Streaming' },
    { id: 'other', name: 'Other' },
  ];

  const filteredPlatforms = category === 'all'
    ? PLATFORMS
    : PLATFORMS.filter(p => p.category === category);

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-bold mb-4">Select Platform</h2>
      
      {/* Category Filter */}
      <div className="mb-4">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Platform List */}
      <div className="max-h-96 overflow-y-auto space-y-2">
        {filteredPlatforms.map(platform => (
          <button
            key={platform.id}
            onClick={() => setSelectedPlatform(platform.id)}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              selectedPlatform === platform.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
            }`}
          >
            <div className="font-medium">{platform.name}</div>
            <div className="text-xs text-gray-400 capitalize">
              {platform.category.replace('-', ' ')}
            </div>
          </button>
        ))}
      </div>

      {/* Selected Platform Info */}
      <div className="mt-4 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
        <p className="text-sm text-gray-400">Selected:</p>
        <p className="font-medium text-blue-400">
          {PLATFORMS.find(p => p.id === selectedPlatform)?.name || 'None'}
        </p>
      </div>
    </div>
  );
}
