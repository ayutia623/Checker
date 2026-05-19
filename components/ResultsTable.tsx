'use client';

import { useState } from 'react';
import { useCheckerStore } from '@/lib/store';
import { CheckResult } from '@/types';

export function ResultsTable() {
  const { results } = useCheckerStore();
  const [filter, setFilter] = useState<'all' | 'valid' | 'invalid' | 'error'>('all');
  const [showCapture, setShowCapture] = useState<number | null>(null);

  const filteredResults = results.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const exportResults = (format: 'txt' | 'csv' | 'json') => {
    let content = '';
    const exportData = filteredResults;

    if (format === 'txt') {
      content = exportData
        .map(r => `${r.account.email}:${r.account.password} | ${r.status.toUpperCase()}`)
        .join('\n');
    } else if (format === 'csv') {
      content = 'Email,Password,Platform,Status,Capture\n';
      content += exportData
        .map(r => `${r.account.email},${r.account.password},${r.account.platform},${r.status},"${JSON.stringify(r.capture || {})}"`)
        .join('\n');
    } else if (format === 'json') {
      content = JSON.stringify(exportData, null, 2);
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checker-results-${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'text-green-400 bg-green-500/20';
      case 'invalid': return 'text-red-400 bg-red-500/20';
      case 'error': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h2 className="text-xl font-bold">Results ({filteredResults.length})</h2>
        
        <div className="flex flex-wrap gap-2">
          {/* Filter Buttons */}
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            All ({results.length})
          </button>
          <button
            onClick={() => setFilter('valid')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'valid' ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Valid ({results.filter(r => r.status === 'valid').length})
          </button>
          <button
            onClick={() => setFilter('invalid')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'invalid' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Invalid ({results.filter(r => r.status === 'invalid').length})
          </button>
          <button
            onClick={() => setFilter('error')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'error' ? 'bg-yellow-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Errors ({results.filter(r => r.status === 'error').length})
          </button>
        </div>
      </div>



      {/* Export Buttons */}
      {filteredResults.length > 0 && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => exportResults('txt')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm font-medium"
          >
            📄 Export TXT
          </button>
          <button
            onClick={() => exportResults('csv')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm font-medium"
          >
            📊 Export CSV
          </button>
          <button
            onClick={() => exportResults('json')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm font-medium"
          >
            📋 Export JSON
          </button>
        </div>
      )}

      {/* Results Table */}
      <div className="overflow-x-auto">
        {filteredResults.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg">No results yet</p>
            <p className="text-sm mt-2">Start checking to see results here</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4">#</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Password</th>
                <th className="text-left py-3 px-4">Platform</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Capture</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((result, index) => (
                <>
                  <tr
                    key={index}
                    className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-400">{index + 1}</td>
                    <td className="py-3 px-4 font-mono text-sm">{result.account.email}</td>
                    <td className="py-3 px-4 font-mono text-sm">{'•'.repeat(result.account.password.length)}</td>
                    <td className="py-3 px-4 capitalize">{result.account.platform}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(result.status)}`}>
                        {result.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {result.capture && Object.keys(result.capture).length > 0 ? (
                        <button
                          onClick={() => setShowCapture(showCapture === index ? null : index)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium"
                        >
                          {showCapture === index ? 'Hide' : 'View'}
                        </button>
                      ) : (
                        <span className="text-gray-500 text-xs">No data</span>
                      )}
                    </td>
                  </tr>
                  
                  {/* Capture Details Row */}
                  {showCapture === index && result.capture && (
                    <tr className="bg-gray-900/50">
                      <td colSpan={6} className="py-4 px-4">
                        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                          <h4 className="font-bold mb-3 text-blue-400">Capture Details:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {Object.entries(result.capture).map(([key, value]) => (
                              <div key={key} className="bg-gray-700/50 p-2 rounded">
                                <p className="text-xs text-gray-400 capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </p>
                                <p className="text-sm font-medium text-white mt-1">
                                  {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value?.toString() || 'N/A'}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
