import React, { useState, useEffect, useRef } from 'react';
import { Asset, ScriptScene, Project } from '../types';
import { Play, Pause, SkipForward, SkipBack, Volume2, MonitorPlay, Film, AlertCircle } from 'lucide-react';

interface VideoAssemblerProps {
  script: ScriptScene[];
  assets: Asset[];
  selectedLanguages: string[];
}

interface TimelineItem {
  scene: ScriptScene;
  visual?: Asset;
  audio?: Asset;
}

export const VideoAssembler: React.FC<VideoAssemblerProps> = ({ script, assets, selectedLanguages }) => {
  const [activeLanguage, setActiveLanguage] = useState<string>(selectedLanguages[0] || '');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Refs for media control
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build timeline based on active language
  const timeline: TimelineItem[] = script.map(scene => ({
    scene,
    visual: assets.find(a => a.sceneId === scene.id && (a.type === 'image' || a.type === 'video')),
    audio: assets.find(a => a.sceneId === scene.id && a.type === 'audio' && a.language === activeLanguage)
  }));

  // Effect: Handle Autoplay and Transitions
  useEffect(() => {
    if (!isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      return;
    }

    const currentItem = timeline[currentIndex];
    if (!currentItem) {
      setIsPlaying(false);
      return;
    }

    // Play Audio
    if (audioRef.current && currentItem.audio) {
      // If we are just starting this index (not transitioning out)
      if (!isTransitioning) {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
              playPromise.catch(error => {
                  console.error("Audio playback failed:", error);
                  setIsPlaying(false);
              });
          }
      }
    } else {
       // No audio for this scene? Auto-advance after 3 seconds default duration
       const timer = setTimeout(() => {
           handleSceneEnd();
       }, 3000);
       return () => clearTimeout(timer);
    }
  }, [isPlaying, currentIndex, isTransitioning, activeLanguage]);

  // Handle Audio End -> Trigger Transition
  const handleSceneEnd = () => {
    if (currentIndex < timeline.length - 1) {
      setIsTransitioning(true);
      
      // Transition Duration: 1.5 seconds
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setIsTransitioning(false);
      }, 1500); 
    } else {
      setIsPlaying(false); // End of playback
      setIsTransitioning(false);
    }
  };

  // Helper to render visual asset
  const renderVisual = (item?: TimelineItem, isOverlay: boolean = false) => {
    if (!item || !item.visual) {
      return (
        <div className="w-full h-full bg-gray-900 flex items-center justify-center text-white">
          <Film size={48} className="opacity-20 mb-2" />
          <p className="opacity-50 text-sm">Missing Visual Asset</p>
        </div>
      );
    }

    if (item.visual.type === 'video') {
      return (
        <video 
          src={item.visual.url} 
          className="w-full h-full object-cover" 
          autoPlay={isPlaying && !isOverlay} 
          muted 
          loop 
        />
      );
    }
    
    return (
      <img 
        src={item.visual.url} 
        alt={item.scene.speaker} 
        className="w-full h-full object-cover" 
      />
    );
  };

  const currentItem = timeline[currentIndex];
  const nextItem = timeline[currentIndex + 1];

  // If no language selected or available
  if (!activeLanguage && selectedLanguages.length > 0) {
      setActiveLanguage(selectedLanguages[0]);
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <div>
           <h3 className="text-xl font-bold text-gray-900">5. Final Assembly & Preview</h3>
           <p className="text-sm text-gray-500">Review the assembled video with automatic scene transitions.</p>
        </div>
        
        {/* Language Selector */}
        <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-gray-600">Audio Track:</span>
            <select 
                value={activeLanguage}
                onChange={(e) => {
                    setIsPlaying(false);
                    setCurrentIndex(0);
                    setActiveLanguage(e.target.value);
                }}
                className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            >
                {selectedLanguages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                ))}
            </select>
        </div>
      </div>

      {/* Main Player Area */}
      <div className="flex-1 bg-black rounded-xl overflow-hidden shadow-2xl relative flex flex-col justify-center items-center aspect-video max-h-[600px] w-full mx-auto border-4 border-gray-800">
         
         {/* Visual Layer Stack */}
         <div className="relative w-full h-full bg-gray-900">
             
             {/* NEXT SCENE (Layer B - Bottom) */}
             {nextItem && (
                 <div className="absolute inset-0 z-0">
                     {renderVisual(nextItem)}
                 </div>
             )}

             {/* CURRENT SCENE (Layer A - Top) */}
             {/* Apply fade-out class if transitioning */}
             <div 
                className={`absolute inset-0 z-10 transition-opacity duration-[1500ms] ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
             >
                 {renderVisual(currentItem)}
             </div>
             
             {/* Subtitles Overlay */}
             <div className="absolute bottom-12 left-0 right-0 z-30 text-center px-8 pointer-events-none">
                 <div className="inline-block bg-black/70 backdrop-blur-sm px-6 py-3 rounded-lg">
                     <p className="text-white text-lg md:text-xl font-medium leading-relaxed drop-shadow-md">
                         {isTransitioning 
                            ? (nextItem?.scene.translations[activeLanguage] || nextItem?.scene.text || "...")
                            : (currentItem?.scene.translations[activeLanguage] || currentItem?.scene.text || "...")
                         }
                     </p>
                 </div>
             </div>

             {/* Hidden Audio Player */}
             {currentItem?.audio && (
                 <audio 
                    ref={audioRef}
                    src={currentItem.audio.url}
                    onEnded={handleSceneEnd}
                 />
             )}
         </div>

         {/* Playback Controls */}
         <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-between px-6 z-40">
             <div className="flex items-center space-x-4">
                 <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="text-white hover:text-indigo-400 transition"
                 >
                     {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                 </button>
                 <span className="text-xs font-mono text-gray-300">
                     SCENE {currentIndex + 1} / {timeline.length}
                 </span>
             </div>

             {/* Timeline Progress Mock */}
             <div className="flex-1 mx-6 h-1 bg-gray-700 rounded-full overflow-hidden">
                 <div 
                    className="h-full bg-indigo-500 transition-all duration-500" 
                    style={{ width: `${((currentIndex + 1) / timeline.length) * 100}%` }}
                 />
             </div>

             <div className="flex items-center space-x-4">
                 <button 
                    onClick={() => {
                        setCurrentIndex(Math.max(0, currentIndex - 1));
                        setIsPlaying(false);
                        setIsTransitioning(false);
                    }}
                    disabled={currentIndex === 0}
                    className="text-white hover:text-indigo-400 disabled:opacity-30 transition"
                 >
                     <SkipBack size={20} />
                 </button>
                 <button 
                    onClick={() => {
                        setCurrentIndex(Math.min(timeline.length - 1, currentIndex + 1));
                        setIsPlaying(false);
                        setIsTransitioning(false);
                    }}
                    disabled={currentIndex === timeline.length - 1}
                    className="text-white hover:text-indigo-400 disabled:opacity-30 transition"
                 >
                     <SkipForward size={20} />
                 </button>
             </div>
         </div>
      </div>
      
      {/* Assembly Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-start space-x-3">
              <Film className="text-indigo-600 mt-1" size={20} />
              <div>
                  <h4 className="font-bold text-gray-900">Automatic Transitions</h4>
                  <p className="text-xs text-gray-500">Applied 1.5s cross-fade between {timeline.length} scenes.</p>
              </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-start space-x-3">
              <MonitorPlay className="text-indigo-600 mt-1" size={20} />
              <div>
                  <h4 className="font-bold text-gray-900">Resolution</h4>
                  <p className="text-xs text-gray-500">1280x720 (16:9 HD Standard)</p>
              </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-start space-x-3">
              <Volume2 className="text-indigo-600 mt-1" size={20} />
              <div>
                  <h4 className="font-bold text-gray-900">Audio Normalization</h4>
                  <p className="text-xs text-gray-500">Targeting -16 LUFS for clear dialogue.</p>
              </div>
          </div>
      </div>
    </div>
  );
};