'use client';

import { useRef, useState } from 'react';
import { useCheckerStore } from '@/lib/store';

export function ComboUploader() {
  const { setAccounts, selectedPlatform } = useCheckerStore();
  const [comboText, setComboText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseComboList = (content: string): Array<{ email: string; password: string }> => {
    const lines = content.split('\n').filter(line => line.trim());
    const combos: Array<{ email: string; password: string }> = [];

    for (const line of lines) {
      const [email, password] = line.split(':').map(s => s.trim());
      if (email && password) {
        combos.push({ email, password });
      }
    }

    return combos;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setComboText(content);
      processComboList(content);
    };
    reader.readAsText(file);
  };

  const processComboList = (content: string) => {
    const combos = parseComboList(content);
    const accounts = combos.map(combo => ({
      ...combo,
      platform: selectedPlatform,
    }));
    setAccounts(accounts);
  };

  const handleTextSubmit = () => {
    if (!comboText.trim()) return;
    processComboList(comboText);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-bold mb-4">Upload Combo List</h2>
      
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
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
        >
          📁 Upload File (.txt)
        </button>
      </div>

      {/* Text Input */}
      <div className="mb-4">
        <textarea
          value={comboText}
          onChange={(e) => setComboText(e.target.value)}
          placeholder="Paste combo list here&#10;Format: email:password&#10;&#10;example@email.com:password123&#10;user@domain.com:mypass456"
          className="w-full h-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
        />
      </div>

      <button
        onClick={handleTextSubmit}
        disabled={!comboText.trim()}
        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
      >
        ✓ Load Combos
      </button>

      {/* Info */}
      <div className="mt-4 p-3 bg-gray-700/50 rounded-lg border border-gray-600 text-sm">
        <p className="text-gray-400">Format: <span className="text-white">email:password</span></p>
        <p className="text-gray-400 mt-1">One combo per line</p>
      </div>
    </div>
  );
}
