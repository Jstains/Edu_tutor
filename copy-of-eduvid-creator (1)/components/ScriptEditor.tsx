import React, { useState } from 'react';
import { ScriptScene } from '../types';
import { analyzeScript, translateText } from '../services/geminiService';
import { Wand2, Languages, Loader2, Check, Globe } from 'lucide-react';

interface ScriptEditorProps {
  script: ScriptScene[];
  setScript: (script: ScriptScene[]) => void;
  selectedLanguages: string[];
  setSelectedLanguages: (langs: string[]) => void;
}

const INDIAN_LANGUAGES = [
  "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam", "Bengali", "Marathi", "Gujarati", "Punjabi", "Odia"
];

export const ScriptEditor: React.FC<ScriptEditorProps> = ({ script, setScript, selectedLanguages, setSelectedLanguages }) => {
  const [rawText, setRawText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const toggleLanguage = (lang: string) => {
    if (selectedLanguages.includes(lang)) {
      setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeScript(rawText);
      const scenes: ScriptScene[] = result.map((item: any) => ({
        id: crypto.randomUUID(),
        sceneNumber: item.sceneNumber,
        text: item.text,
        speaker: item.speaker,
        translations: {}
      }));
      setScript(scenes);
    } catch (e) {
      console.error(e);
      alert("Failed to analyze script. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBatchTranslate = async () => {
    if (script.length === 0 || selectedLanguages.length === 0) return;
    setIsTranslating(true);
    try {
      // Create a deep copy to mutate
      const updatedScript = [...script];
      
      // Iterate through languages and scenes
      // In a real app, this should be more optimized (e.g., parallel requests with rate limiting)
      for (const lang of selectedLanguages) {
        for (let i = 0; i < updatedScript.length; i++) {
           if (!updatedScript[i].translations[lang]) {
               const translated = await translateText(updatedScript[i].text, lang);
               updatedScript[i].translations = {
                   ...updatedScript[i].translations,
                   [lang]: translated
               };
           }
        }
      }
      setScript(updatedScript);
    } catch (e) {
      console.error(e);
      alert("Translation process encountered errors.");
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Top Controls: Upload & Language */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Script Input */}
        <div className="flex flex-col space-y-3">
            <h3 className="text-xl font-bold text-gray-900">1. Script Ingestion</h3>
            <textarea
              className="flex-1 w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none font-mono text-sm shadow-sm"
              placeholder="Paste your raw script here... (e.g. Learner: How do I install WhatsApp?)"
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
            <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !rawText}
                className="flex items-center justify-center space-x-2 bg-black text-white px-6 py-3 rounded-xl disabled:opacity-50 hover:bg-gray-800 transition font-bold"
            >
                {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                <span>Analyze & Split Scenes</span>
            </button>
        </div>

        {/* Language Selector */}
        <div className="flex flex-col space-y-3">
             <div className="flex justify-between items-center">
                 <h3 className="text-xl font-bold text-gray-900">2. Target Languages</h3>
                 <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold">{selectedLanguages.length} Selected</span>
             </div>
             
             <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm flex-1">
                 <div className="flex flex-wrap gap-2">
                     {INDIAN_LANGUAGES.map(lang => (
                         <button
                            key={lang}
                            onClick={() => toggleLanguage(lang)}
                            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all border-2 flex items-center space-x-1 ${
                                selectedLanguages.includes(lang) 
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                                : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300'
                            }`}
                         >
                            {selectedLanguages.includes(lang) && <Check size={14} strokeWidth={3} />}
                            <span>{lang}</span>
                         </button>
                     ))}
                 </div>
                 {script.length > 0 && selectedLanguages.length > 0 && (
                     <div className="mt-6 pt-4 border-t border-gray-100">
                         <button
                             onClick={handleBatchTranslate}
                             disabled={isTranslating}
                             className="w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white px-4 py-3 rounded-lg disabled:opacity-50 hover:bg-indigo-700 transition font-bold"
                         >
                             {isTranslating ? <Loader2 className="animate-spin" size={18} /> : <Globe size={18} />}
                             <span>Translate All Scenes</span>
                         </button>
                     </div>
                 )}
             </div>
        </div>
      </div>

      {/* Scene Preview */}
      <div className="flex flex-col flex-1 bg-gray-50 p-6 rounded-xl border-2 border-gray-200 min-h-0">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Scene Preview</h3>
        
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {script.length === 0 && (
                <div className="text-center text-gray-400 mt-10">
                    <p>Processed scenes will appear here.</p>
                </div>
            )}
            {script.map((scene) => (
                <div key={scene.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                        <span className="bg-black text-white text-xs font-bold px-2 py-1 rounded">SCENE {scene.sceneNumber}</span>
                        <span className="text-sm font-bold text-gray-600">{scene.speaker}</span>
                    </div>
                    <p className="text-lg text-gray-900 font-medium mb-4">"{scene.text}"</p>
                    
                    {/* Translations Grid */}
                    {Object.keys(scene.translations).length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            {Object.entries(scene.translations).map(([lang, text]) => (
                                <div key={lang} className="text-sm">
                                    <span className="text-xs font-bold text-indigo-600 uppercase mb-1 block">{lang}</span>
                                    <p className="text-gray-700">{text}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
