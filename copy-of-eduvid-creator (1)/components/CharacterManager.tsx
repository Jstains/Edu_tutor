import React, { useState } from 'react';
import { Character, ScriptScene } from '../types';
import { extractCharactersFromScript, generateCharacterSheet } from '../services/geminiService';
import { Users, Loader2, Wand2, Lock, UserCheck, AlertCircle, Mic } from 'lucide-react';

interface CharacterManagerProps {
  characters: Character[];
  setCharacters: (chars: Character[]) => void;
  script: ScriptScene[];
}

// Available voices
const MALE_VOICES = ['Fenrir', 'Puck', 'Charon'];
const FEMALE_VOICES = ['Kore', 'Zephyr'];

export const CharacterManager: React.FC<CharacterManagerProps> = ({ characters, setCharacters, script }) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGeneratingSheet, setIsGeneratingSheet] = useState<Record<string, boolean>>({});

  const handleExtract = async () => {
    if (script.length === 0) return;
    setIsExtracting(true);
    try {
      // Reconstruct full script text
      const fullScript = script.map(s => `${s.speaker}: ${s.text}`).join('\n');
      const result = await extractCharactersFromScript(fullScript);
      
      let mIndex = 0;
      let fIndex = 0;

      const newCharacters: Character[] = result.map((item: any) => {
        let voiceName = 'Kore';
        if (item.gender === 'Male') {
            voiceName = MALE_VOICES[mIndex % MALE_VOICES.length];
            mIndex++;
        } else {
            voiceName = FEMALE_VOICES[fIndex % FEMALE_VOICES.length];
            fIndex++;
        }

        return {
            id: crypto.randomUUID(),
            name: item.name,
            description: item.description,
            gender: item.gender,
            voiceName: voiceName,
            status: 'pending'
        };
      });
      setCharacters(newCharacters);
    } catch (e) {
      console.error(e);
      alert("Failed to identify characters.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleGenerateSheet = async (char: Character) => {
    setIsGeneratingSheet(prev => ({ ...prev, [char.id]: true }));
    try {
      const sheetUrl = await generateCharacterSheet(char.description);
      
      const updatedChars = characters.map(c => 
        c.id === char.id 
          ? { ...c, imageUrl: sheetUrl, status: 'ready' as const } 
          : c
      );
      setCharacters(updatedChars);
    } catch (e) {
      console.error(e);
      const updatedChars = characters.map(c => 
        c.id === char.id 
          ? { ...c, status: 'error' as const } 
          : c
      );
      setCharacters(updatedChars);
    } finally {
      setIsGeneratingSheet(prev => ({ ...prev, [char.id]: false }));
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex justify-between items-center">
        <div>
           <h3 className="text-xl font-bold text-gray-900">2. Character Identity Lock</h3>
           <p className="text-sm text-gray-500">Identify roles, assign voices, and generate canonical assets.</p>
        </div>
        <button
            onClick={handleExtract}
            disabled={isExtracting || script.length === 0}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-indigo-700 transition font-bold"
        >
            {isExtracting ? <Loader2 className="animate-spin" size={16} /> : <Users size={16} />}
            <span>Identify Characters</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
         {characters.length === 0 && (
             <div className="col-span-full text-center text-gray-400 py-20 flex flex-col items-center">
                 <Users size={48} className="mb-4 text-gray-200" />
                 <p>No characters identified yet.</p>
                 <p className="text-sm">Import a script and click "Identify Characters" to begin.</p>
             </div>
         )}
         
         {characters.map((char) => (
             <div key={char.id} className="bg-white rounded-xl border-2 border-gray-100 shadow-sm overflow-hidden flex flex-col">
                 <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div>
                        <h4 className="font-bold text-lg text-gray-900">{char.name}</h4>
                        <div className="flex items-center space-x-2">
                             <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">ID: {char.id.slice(0,6)}</span>
                             {char.voiceName && (
                                 <span className="flex items-center space-x-1 text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-100 font-bold">
                                     <Mic size={8} />
                                     <span>{char.voiceName}</span>
                                 </span>
                             )}
                        </div>
                    </div>
                    {char.status === 'ready' && (
                        <div title="Identity Locked">
                            <Lock size={16} className="text-green-500" />
                        </div>
                    )}
                 </div>
                 
                 <div className="p-4 space-y-4 flex-1 flex flex-col">
                     <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 italic text-xs max-h-24 overflow-y-auto">
                         <span className="font-bold not-italic text-gray-800">{char.gender}</span>: {char.description}
                     </div>

                     <div className="flex-1 min-h-[160px] bg-black rounded-lg overflow-hidden relative border border-gray-200">
                         {char.imageUrl ? (
                             <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
                         ) : (
                             <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-100">
                                 {char.status === 'generating' ? (
                                     <Loader2 className="animate-spin text-indigo-500" />
                                 ) : char.status === 'error' ? (
                                     <div className="flex flex-col items-center text-red-400">
                                         <AlertCircle size={24} />
                                         <span className="text-xs mt-1">Generation Failed</span>
                                     </div>
                                 ) : (
                                     <UserCheck size={32} className="opacity-20" />
                                 )}
                             </div>
                         )}
                     </div>

                     <button
                        onClick={() => handleGenerateSheet(char)}
                        disabled={isGeneratingSheet[char.id]}
                        className={`w-full py-2 rounded-lg text-sm font-bold flex items-center justify-center space-x-2 transition ${
                            char.status === 'ready' 
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'bg-black text-white hover:bg-gray-800'
                        }`}
                     >
                        {isGeneratingSheet[char.id] ? <Loader2 className="animate-spin" size={14} /> : <Wand2 size={14} />}
                        <span>{char.status === 'ready' ? 'Regenerate Sheet' : 'Generate Canonical Sheet'}</span>
                     </button>
                 </div>
             </div>
         ))}
      </div>
    </div>
  );
};