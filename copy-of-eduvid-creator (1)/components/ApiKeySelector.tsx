import React, { useState, useEffect } from 'react';
import { Key } from 'lucide-react';

export const ApiKeySelector: React.FC = () => {
  const [hasKey, setHasKey] = useState(false);

  const checkKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && aistudio.hasSelectedApiKey) {
      const selected = await aistudio.hasSelectedApiKey();
      setHasKey(selected);
    }
  };

  useEffect(() => {
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && aistudio.openSelectKey) {
      await aistudio.openSelectKey();
      // Assume success immediately to avoid race condition
      setHasKey(true);
    } else {
      alert("AI Studio environment not detected. Please run this in Google IDX or an environment with window.aistudio.");
    }
  };

  if (hasKey) {
    return (
      <div className="flex items-center space-x-2 text-green-600 text-sm bg-green-50 px-3 py-1 rounded-full border border-green-200">
        <Key size={14} />
        <span>API Key Active</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleSelectKey}
      className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg transition-colors shadow-sm"
    >
      <Key size={16} />
      <span>Select API Key</span>
    </button>
  );
};