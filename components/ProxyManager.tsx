'use client';

import { useState, useRef } from 'react';
import { useCheckerStore } from '@/lib/store';
import { Proxy, ProxyType } from '@/types';

export function ProxyManager() {
  const { setProxies, proxies } = useCheckerStore();
  const [proxyText, setProxyText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setProxyText(content);
      processProxyList(content);
    };
    reader.readAsText(file);
  };

  const parseProxyLine = (line: string): Proxy | null => {
    try {
      const match = line.match(/^(?:(https?|socks[45]):\/\/)?(?:([^:@]+):([^@]+)@)?([^:]+):(\d+)$/);
      
      if (!match) return null;

      const [, type, username, password, host, port] = match;

      return {
        host,
        port: parseInt(port),
        type: (type as ProxyType) || 'http',
        username,
        password,
      };
    } catch {
      return null;
    }
  };

  const processProxyList = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    const proxies: Proxy[] = [];

    for (const line of lines) {
      const proxy = parseProxyLine(line);
      if (proxy) proxies.push(proxy);
    }

    setProxies(proxies);
  };

  const handleTextSubmit = () => {
    if (!proxyText.trim()) return;
    processProxyList(proxyText);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-bold mb-4">Proxy Manager</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Upload */}
        <div>
          {/* File Upload */}
          <div className="mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors font-medium"
            >
              📁 Upload Proxy List
            </button>
          </div>

          {/* Text Input */}
          <div className="mb-4">
            <textarea
              value={proxyText}
              onChange={(e) => setProxyText(e.target.value)}
              placeholder="Paste proxy list here&#10;&#10;Formats supported:&#10;host:port&#10;http://host:port&#10;socks5://host:port&#10;http://user:pass@host:port"
              className="w-full h-48 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm font-mono"
            />
          </div>

          <button
            onClick={handleTextSubmit}
            disabled={!proxyText.trim()}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
          >
            ✓ Load Proxies
          </button>
        </div>

        {/* Right: Info */}
        <div>
          <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 mb-4">
            <h3 className="font-bold mb-2">Loaded Proxies</h3>
            <p className="text-3xl font-bold text-purple-400">{proxies.length}</p>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 text-sm">
            <h3 className="font-bold mb-2">Supported Formats:</h3>
            <ul className="space-y-1 text-gray-400 font-mono text-xs">
              <li>• HTTP: http://host:port</li>
              <li>• HTTPS: https://host:port</li>
              <li>• SOCKS4: socks4://host:port</li>
              <li>• SOCKS5: socks5://host:port</li>
              <li>• With auth: http://user:pass@host:port</li>
              <li>• Simple: host:port (defaults to HTTP)</li>
            </ul>
          </div>

          {proxies.length > 0 && (
            <button
              onClick={() => {
                setProxies([]);
                setProxyText('');
              }}
              className="w-full mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium"
            >
              🗑️ Clear Proxies
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
