import React, { useState } from 'react';
import { Layout, FileText, Image as ImageIcon, Music, PlayCircle, CheckCircle2, Users } from 'lucide-react';
import { Project, ScriptScene, Asset, Character } from './types';
import { ScriptEditor } from './components/ScriptEditor';
import { AssetGenerator } from './components/AssetGenerator';
import { VoiceoverStudio } from './components/VoiceoverStudio';
import { CharacterManager } from './components/CharacterManager';
import { VideoAssembler } from './components/VideoAssembler';
import { ApiKeySelector } from './components/ApiKeySelector';

// Mock initial project
const INITIAL_PROJECT: Project = {
  id: '1',
  title: 'Digital Literacy Campaign 2024',
  selectedLanguages: [],
  script: [],
  assets: [],
  characters: []
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'script' | 'characters' | 'assets' | 'audio' | 'preview'>('script');
  const [project, setProject] = useState<Project>(INITIAL_PROJECT);

  const updateScript = (newScript: ScriptScene[]) => {
    setProject(prev => ({ ...prev, script: newScript }));
  };

  const setSelectedLanguages = (langs: string[]) => {
    setProject(prev => ({ ...prev, selectedLanguages: langs }));
  };

  const addAsset = (asset: Asset) => {
    setProject(prev => ({ ...prev, assets: [...prev.assets, asset] }));
  };
  
  const setCharacters = (chars: Character[]) => {
    setProject(prev => ({ ...prev, characters: chars }));
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-900 p-2 rounded-lg">
                <Layout className="text-white" size={24} />
            </div>
            <div>
                 <h1 className="text-xl font-bold text-gray-900 leading-tight">EduVid Creator</h1>
                 <p className="text-xs text-blue-800 font-bold tracking-wider uppercase">TCS Literacy Edition</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
             {/* Success Metrics Mini-Card */}
             <div className="hidden lg:flex items-center space-x-6 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Success Rate</span>
                    <span className="text-sm font-bold text-green-600">95%</span>
                </div>
                <div className="w-px h-6 bg-gray-300"></div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Sync Latency</span>
                    <span className="text-sm font-bold text-blue-600">&lt;2ms</span>
                </div>
             </div>
             <ApiKeySelector />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col overflow-hidden">
        
        <div className="grid grid-cols-12 gap-8 h-full">
            {/* Sidebar Navigation */}
            <div className="col-span-12 md:col-span-3 lg:col-span-2 flex flex-col space-y-2">
                <NavButton 
                    active={activeTab === 'script'} 
                    onClick={() => setActiveTab('script')} 
                    icon={<FileText size={20} />} 
                    label="Script" 
                />
                 <NavButton 
                    active={activeTab === 'characters'} 
                    onClick={() => setActiveTab('characters')} 
                    icon={<Users size={20} />} 
                    label="Characters" 
                />
                <NavButton 
                    active={activeTab === 'assets'} 
                    onClick={() => setActiveTab('assets')} 
                    icon={<ImageIcon size={20} />} 
                    label="Visuals" 
                />
                <NavButton 
                    active={activeTab === 'audio'} 
                    onClick={() => setActiveTab('audio')} 
                    icon={<Music size={20} />} 
                    label="Voiceover" 
                />
                <NavButton 
                    active={activeTab === 'preview'} 
                    onClick={() => setActiveTab('preview')} 
                    icon={<PlayCircle size={20} />} 
                    label="Assembly" 
                />
            </div>

            {/* Content Area */}
            <div className="col-span-12 md:col-span-9 lg:col-span-10 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-full min-h-[600px]">
                <div className="h-full p-6 overflow-hidden flex flex-col">
                    {activeTab === 'script' && (
                        <ScriptEditor 
                            script={project.script} 
                            setScript={updateScript} 
                            selectedLanguages={project.selectedLanguages}
                            setSelectedLanguages={setSelectedLanguages}
                        />
                    )}
                    {activeTab === 'characters' && (
                        <CharacterManager
                            characters={project.characters}
                            setCharacters={setCharacters}
                            script={project.script}
                        />
                    )}
                    {activeTab === 'assets' && (
                        <AssetGenerator 
                            assets={project.assets} 
                            script={project.script}
                            characters={project.characters}
                            addAsset={addAsset} 
                        />
                    )}
                    {activeTab === 'audio' && (
                        <VoiceoverStudio 
                            script={project.script} 
                            assets={project.assets} 
                            addAsset={addAsset} 
                            selectedLanguages={project.selectedLanguages}
                            characters={project.characters}
                        />
                    )}
                    {activeTab === 'preview' && (
                        <VideoAssembler
                            script={project.script}
                            assets={project.assets}
                            selectedLanguages={project.selectedLanguages}
                        />
                    )}
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-3 px-4 py-4 rounded-xl text-sm font-bold transition-all w-full text-left ${
      active 
        ? 'bg-blue-50 text-blue-900 border-l-4 border-blue-900 shadow-sm' 
        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 border-l-4 border-transparent'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default App;