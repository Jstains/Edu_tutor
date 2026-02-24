import React, { useState } from 'react';
import { Asset, ScriptScene, AssetType, Character } from '../types';
import { generateImage, generateVideo, generateVisualPromptFromScript } from '../services/geminiService';
import { Image as ImageIcon, Video, Loader2, Sparkles, Film, AlertCircle, Link as LinkIcon } from 'lucide-react';

interface AssetGeneratorProps {
  assets: Asset[];
  script: ScriptScene[];
  characters: Character[]; // Pass characters to use as reference
  addAsset: (asset: Asset) => void;
}

export const AssetGenerator: React.FC<AssetGeneratorProps> = ({ assets, script, characters, addAsset }) => {
  const [generatingStates, setGeneratingStates] = useState<Record<string, boolean>>({});
  const [errorStates, setErrorStates] = useState<Record<string, string>>({});

  const handleAutoGenerate = async (scene: ScriptScene) => {
    setGeneratingStates(prev => ({ ...prev, [scene.id]: true }));
    setErrorStates(prev => ({ ...prev, [scene.id]: '' }));
    
    try {
      // 1. Find the matching character for this scene (Speaker)
      const matchedChar = characters.find(c => 
          c.name.toLowerCase() === scene.speaker.toLowerCase() || 
          scene.speaker.toLowerCase().includes(c.name.toLowerCase())
      );

      // 2. Identify other characters for background context (exclude speaker)
      const otherCharacters = characters
        .filter(c => c.id !== matchedChar?.id)
        .map(c => ({ name: c.name, description: c.description }));

      // 3. Generate Prompt, passing locked description if available + other characters
      const visualPrompt = await generateVisualPromptFromScript(
          scene.text, 
          scene.speaker, 
          matchedChar?.description,
          otherCharacters
      );
      
      // 4. Generate Image, passing canonical sheet as reference if available
      const referenceImage = matchedChar?.status === 'ready' ? matchedChar.imageUrl : undefined;
      const imageUrl = await generateImage(visualPrompt, "16:9", referenceImage);
      
      // Add Image Asset
      const imageAsset: Asset = {
        id: crypto.randomUUID(),
        type: 'image',
        url: imageUrl,
        name: `Scene ${scene.sceneNumber} - ${scene.speaker}`,
        status: 'ready',
        sceneId: scene.id,
        metadata: {
             characterId: matchedChar?.id,
             usedReference: !!referenceImage,
             othersIncluded: otherCharacters.length
        }
      };
      addAsset(imageAsset);
      
    } catch (e: any) {
      console.error(e);
      setErrorStates(prev => ({ ...prev, [scene.id]: e.message || "Failed to generate asset" }));
    } finally {
      setGeneratingStates(prev => ({ ...prev, [scene.id]: false }));
    }
  };

  const getAssetsForScene = (sceneId: string) => assets.filter(a => a.sceneId === sceneId);

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">4. Scene Asset Generation</h3>
          <p className="text-sm text-gray-500">Assets generated with character consistency locks.</p>
      </div>

      <div className="flex-1 overflow-y-auto grid grid-cols-1 gap-6 pb-20">
        {script.length === 0 && (
            <div className="text-center text-gray-400 py-20">
                Generate a script first to create visuals.
            </div>
        )}
        
        {script.map((scene) => {
          const sceneAssets = getAssetsForScene(scene.id);
          const isGenerating = generatingStates[scene.id];
          const error = errorStates[scene.id];
          const matchedChar = characters.find(c => 
              c.name.toLowerCase() === scene.speaker.toLowerCase() || 
              scene.speaker.toLowerCase().includes(c.name.toLowerCase())
          );

          return (
            <div key={scene.id} className="bg-white p-5 rounded-xl border-2 border-gray-100 shadow-sm flex flex-col md:flex-row gap-6">
               {/* Context */}
               <div className="md:w-1/3 space-y-4">
                  <div>
                      <span className="text-xs font-bold bg-gray-900 text-white px-2 py-1 rounded">SCENE {scene.sceneNumber}</span>
                      <p className="mt-2 text-gray-800 font-medium">"{scene.text}"</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-sm text-gray-500">Speaker: {scene.speaker}</span>
                        {matchedChar && matchedChar.status === 'ready' && (
                             <span className="flex items-center space-x-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                 <LinkIcon size={10} />
                                 <span>Locked to {matchedChar.name}</span>
                             </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                          With: {characters.filter(c => c.name !== scene.speaker).map(c => c.name).join(', ') || 'None'}
                      </div>
                  </div>
                  <button 
                    onClick={() => handleAutoGenerate(scene)}
                    disabled={isGenerating}
                    className="w-full py-3 bg-indigo-50 text-indigo-700 font-bold rounded-lg hover:bg-indigo-100 transition flex items-center justify-center space-x-2 border border-indigo-200"
                  >
                     {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                     <span>{sceneAssets.length > 0 ? 'Regenerate Scene' : 'Generate Scene'}</span>
                  </button>
                  {error && (
                      <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg flex items-start space-x-2">
                          <AlertCircle size={14} className="mt-0.5 shrink-0" />
                          <span>{error}</span>
                      </div>
                  )}
               </div>

               {/* Asset Gallery for Scene */}
               <div className="flex-1 bg-gray-50 rounded-lg p-4 flex gap-4 overflow-x-auto items-center min-h-[160px]">
                  {sceneAssets.length === 0 && !isGenerating && !error && (
                      <div className="w-full text-center text-gray-400 text-sm italic">
                          No visual assets yet. Click generate.
                      </div>
                  )}
                  {isGenerating && (
                      <div className="w-full flex items-center justify-center text-indigo-600">
                          <Loader2 className="animate-spin mr-2" /> Creating consistent scene...
                      </div>
                  )}
                  {sceneAssets.map(asset => (
                      <div key={asset.id} className="relative group min-w-[200px] h-[150px] rounded-lg overflow-hidden border border-gray-300 shadow-sm bg-black">
                          {asset.type === 'image' ? (
                              <img src={asset.url} alt="generated" className="w-full h-full object-cover" />
                          ) : (
                              <video src={asset.url} className="w-full h-full object-cover" />
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-xs font-bold uppercase tracking-wider">{asset.type}</span>
                          </div>
                      </div>
                  ))}
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};