import React, { useState } from 'react';
import { Asset, ScriptScene, Character } from '../types';
import { generateTTS } from '../services/geminiService';
import { Mic, Loader2, Music, Check, Globe } from 'lucide-react';

interface VoiceoverStudioProps {
  script: ScriptScene[];
  assets: Asset[];
  addAsset: (asset: Asset) => void;
  selectedLanguages: string[];
  characters: Character[];
}

export const VoiceoverStudio: React.FC<VoiceoverStudioProps> = ({ script, assets, addAsset, selectedLanguages, characters }) => {
  const [generatingState, setGeneratingState] = useState<Record<string, boolean>>({});

  const handleGenerateAllAudio = async (scene: ScriptScene) => {
    const key = scene.id;
    setGeneratingState(prev => ({ ...prev, [key]: true }));
    
    try {
      // Find the character for this scene to get their specific voice
      const matchedChar = characters.find(c => 
        c.name.toLowerCase() === scene.speaker.toLowerCase() || 
        scene.speaker.toLowerCase().includes(c.name.toLowerCase())
      );
      
      const voice = matchedChar?.voiceName || 'Kore'; // Default fallback if no match

      // Loop through selected languages for this scene
      for (const lang of selectedLanguages) {
        const textToSpeak = scene.translations[lang] || scene.text;
        
        try {
            const url = await generateTTS(textToSpeak, voice);
            
            addAsset({
                id: crypto.randomUUID(),
                type: 'audio',
                url,
                name: `Scene ${scene.sceneNumber} - ${lang} (${voice})`,
                status: 'ready',
                sceneId: scene.id,
                language: lang,
                metadata: { voice }
            });
        } catch (e) {
            console.error(`Failed TTS for ${lang}`, e);
        }
      }
    } finally {
      setGeneratingState(prev => ({ ...prev, [key]: false }));
    }
  };

  const getAudioAssets = (sceneId: string) => assets.filter(a => a.type === 'audio' && a.sceneId === sceneId);

  return (
    <div className="h-full flex flex-col space-y-6">
       <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">4. Multi-lingual Voiceover</h3>
          <p className="text-sm text-gray-500">Generating audio for: {selectedLanguages.join(', ') || "No languages selected"}</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-20">
         {script.map((scene) => {
             const audioAssets = getAudioAssets(scene.id);
             const isGenerating = generatingState[scene.id];
             const matchedChar = characters.find(c => 
                c.name.toLowerCase() === scene.speaker.toLowerCase() || 
                scene.speaker.toLowerCase().includes(c.name.toLowerCase())
             );

             return (
                 <div key={scene.id} className="bg-white p-5 rounded-xl border-2 border-gray-100 shadow-sm">
                     <div className="flex justify-between items-start mb-4">
                         <div>
                            <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2 py-1 rounded">SCENE {scene.sceneNumber}</span>
                            <p className="mt-2 text-gray-800 font-medium">"{scene.text}"</p>
                            <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                                <span>Speaker: {scene.speaker}</span>
                                {matchedChar?.voiceName && (
                                    <span className="flex items-center space-x-1 bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono">
                                        <Mic size={10} />
                                        <span>Voice: {matchedChar.voiceName}</span>
                                    </span>
                                )}
                            </div>
                         </div>
                         <button
                            onClick={() => handleGenerateAllAudio(scene)}
                            disabled={isGenerating || selectedLanguages.length === 0}
                            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center space-x-2 hover:bg-gray-800 disabled:opacity-50"
                         >
                            {isGenerating ? <Loader2 className="animate-spin" size={14} /> : <Music size={14} />}
                            <span>Generate Audio ({selectedLanguages.length})</span>
                         </button>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                         {selectedLanguages.map(lang => {
                             const asset = audioAssets.find(a => a.language === lang);
                             return (
                                 <div key={lang} className={`p-3 rounded-lg border flex items-center justify-between ${asset ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                     <div className="flex items-center space-x-2">
                                         <Globe size={14} className="text-gray-400" />
                                         <span className="text-sm font-semibold text-gray-700">{lang}</span>
                                     </div>
                                     {asset ? (
                                         <audio controls src={asset.url} className="h-6 w-24" />
                                     ) : (
                                         <span className="text-xs text-gray-400 italic">Pending</span>
                                     )}
                                 </div>
                             )
                         })}
                     </div>
                 </div>
             )
         })}
      </div>
    </div>
  );
};