export interface ScriptScene {
  id: string;
  sceneNumber: number;
  text: string;
  translations: Record<string, string>; // Map language code/name to translated text
  speaker: string;
  duration?: number;
  visualPrompt?: string; // Auto-generated visual description
}

export interface Character {
  id: string;
  name: string;
  description: string; // The locked visual description (clothing, age, etc.)
  gender?: 'Male' | 'Female'; // Inferred gender
  voiceName?: string;  // The specific TTS voice assigned to this character
  imageUrl?: string;   // The canonical character sheet
  status: 'pending' | 'generating' | 'ready' | 'error';
}

export interface Project {
  id: string;
  title: string;
  selectedLanguages: string[]; // List of target languages
  script: ScriptScene[];
  assets: Asset[];
  characters: Character[];
}

export type AssetType = 'image' | 'video' | 'audio';

export interface Asset {
  id: string;
  type: AssetType;
  url: string;
  name: string;
  status: 'generating' | 'ready' | 'error';
  sceneId?: string;
  language?: string; // Language tag for audio/video assets
  metadata?: any;
}

export enum GeminiModel {
  FLASH_TEXT = 'gemini-3-flash-preview',
  PRO_TEXT = 'gemini-3-pro-preview',
  IMAGE_GEN = 'gemini-2.5-flash-image',
  IMAGE_EDIT = 'gemini-2.5-flash-image',
  VIDEO_FAST = 'veo-3.1-fast-generate-preview',
  TTS = 'gemini-2.5-flash-preview-tts',
  AUDIO_NATIVE = 'gemini-2.5-flash-native-audio-preview-12-2025'
}