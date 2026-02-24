import { GoogleGenAI, Type, Modality } from "@google/genai";
import { GeminiModel } from "../types";

// Helper to get a configured AI instance
const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeScript = async (rawText: string): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: GeminiModel.FLASH_TEXT,
    contents: `Analyze this educational script and split it into scenes. Return a JSON array where each object has 'sceneNumber', 'speaker', and 'text'. Normalize the text for clarity.
    
    Script:
    ${rawText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sceneNumber: { type: Type.INTEGER },
            speaker: { type: Type.STRING },
            text: { type: Type.STRING },
          },
          required: ["sceneNumber", "speaker", "text"],
        },
      },
    },
  });
  return JSON.parse(response.text || "[]");
};

export const extractCharactersFromScript = async (scriptText: string): Promise<any[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: GeminiModel.PRO_TEXT, // Use Pro for better reasoning on details
    contents: `Analyze the following script and identify all unique characters. 
    Create a "Canonical Character Profile" for each.
    
    Style Guide:
    - Context: Rural India, Digital Literacy.
    - Style: Semi-cartoony, clean lines, soft colors, flat shading.
    - Attributes to Lock: Age, skin tone, facial structure, hair style, specific clothing colors/patterns, accessories (glasses, scarf).
    
    Return a JSON array where each object has:
    - 'name': The speaker name from the script (e.g., Learner, Guide).
    - 'description': A detailed visual prompt describing the character's physical appearance and clothing.
    - 'gender': Infer 'Male' or 'Female' based on the name and context.
    
    Script:
    ${scriptText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            gender: { type: Type.STRING, enum: ["Male", "Female"] }
          },
          required: ["name", "description", "gender"],
        },
      },
    },
  });
  return JSON.parse(response.text || "[]");
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: GeminiModel.FLASH_TEXT,
    contents: `You are a professional translator for rural digital literacy content.
    
    Task: Translate the exact text below into ${targetLanguage}.
    
    CRITICAL OUTPUT RULES:
    1. Return ONLY the translated string.
    2. Do NOT include any explanations, preambles, notes, or glossaries.
    3. Do NOT use labels like "Tamil Translation:" or "Output:".
    4. Do NOT use markdown formatting (no bold, italics, or code blocks).
    5. Ensure the tone is simple, warm, and respectful for low-literacy learners.
    
    Input Text: "${text}"`,
  });

  let cleanText = response.text?.trim() || "";
  if (cleanText.startsWith('"') && cleanText.endsWith('"')) {
    cleanText = cleanText.slice(1, -1);
  }
  return cleanText;
};

export const generateVisualPromptFromScript = async (
  sceneText: string, 
  speaker: string, 
  characterDescription?: string,
  otherCharacters: { name: string; description: string }[] = []
): Promise<string> => {
  const ai = getAI();
  
  // Incorporate the locked character description for the speaker
  const speakerContext = characterDescription 
    ? `FOCUS CHARACTER (SPEAKER) - foreground/center: ${speaker}. ATTRIBUTES: ${characterDescription}` 
    : `FOCUS CHARACTER (SPEAKER) - foreground/center: ${speaker}`;

  // Build context for secondary characters
  let secondaryContext = "";
  if (otherCharacters && otherCharacters.length > 0) {
      secondaryContext = `SECONDARY CHARACTERS (Must be visible in background/side):
      ${otherCharacters.map(c => `- ${c.name} (${c.description})`).join('\n')}`;
  }

  const response = await ai.models.generateContent({
    model: GeminiModel.FLASH_TEXT,
    contents: `You are an expert art director creating image generation prompts for an animated educational video series for rural India.

    ${speakerContext}

    ${secondaryContext}

    Scene Dialogue: "${sceneText}"

    Task: Write a detailed image prompt for this scene.
    
    Constraints:
    - COMPOSITION: The Speaker (${speaker}) must be the FOCAL POINT in the foreground or center.
    - VISIBILITY: All characters listed above (Speaker AND Secondary Characters) MUST be visible in the scene to maintain context. Do not exclude anyone.
    - CONTINUITY: You MUST use the exact attribute descriptions provided for all characters.
    - Setting: Rural settings (fields, simple homes, tea shop, veranda) consistent with the script.
    - Action: Describe the speaker's gesture matching the dialogue. Secondary characters should be reacting, listening, or engaging naturally in the background/side.
    - Style: Semi-cartoony, clean lines, soft colors, no photorealism.
    
    Output Format:
    Return ONLY the prompt string.`,
  });
  return response.text || "";
};

export const generateCharacterSheet = async (description: string): Promise<string> => {
  const ai = getAI();
  
  const sheetPrompt = `Generate a canonical character sheet for the following character. 
  
  Character Description: ${description}
  
  Composition:
  Create a wide image featuring three views of the SAME character standing side-by-side:
  1. Front View (Full Body)
  2. 3/4 View (Full Body)
  3. Side Profile (Upper Body)
  
  Style:
  - Semi-cartoony, vector illustration style.
  - Clean thick outlines, soft flat colors.
  - White or transparent background.
  - High legibility.
  `;

  // We reuse the generateImage logic but with a specific prompt
  return generateImage(sheetPrompt, "16:9");
};

export const generateImage = async (prompt: string, aspectRatio: string = "16:9", referenceImageUrl?: string): Promise<string> => {
  const ai = getAI();
  
  const validRatios = ["1:1", "3:4", "4:3", "9:16", "16:9"];
  const safeAspectRatio = validRatios.includes(aspectRatio) ? aspectRatio : "16:9";

  try {
    const parts: any[] = [];

    // If a reference image (Canonical Character Sheet) is provided, pass it for consistency
    if (referenceImageUrl) {
        const base64Data = referenceImageUrl.split(',')[1] || referenceImageUrl;
        parts.push({
            inlineData: {
                mimeType: "image/png",
                data: base64Data
            }
        });
        // Strengthen the prompt to enforce usage of the reference
        prompt = `(Reference Image provided is the CHARACTER SHEET. Use this exact character design, including clothing, face, and body type.) ${prompt}`;
    }

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
        model: GeminiModel.IMAGE_GEN,
        contents: { parts },
        config: {
            imageConfig: {
                aspectRatio: safeAspectRatio as any
            }
        }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData && part.inlineData.data) {
            return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
    }
    
    throw new Error("No image data returned from API response.");
  } catch (error: any) {
    console.error("Image generation error:", error);
    
    const errorMsg = error.toString();
    if (errorMsg.includes("403") || errorMsg.includes("Permission denied")) {
        throw new Error("Access Denied: Your API key project needs billing enabled.");
    }
    if (errorMsg.includes("404") || errorMsg.includes("NOT_FOUND")) {
        throw new Error(`Model '${GeminiModel.IMAGE_GEN}' not found. Verify your API key has access to Gemini 2.5 Flash Image.`);
    }
    throw error;
  }
};

export const editImage = async (base64Image: string, prompt: string): Promise<string> => {
  const ai = getAI();
  const base64Data = base64Image.split(',')[1] || base64Image;
  
  const response = await ai.models.generateContent({
    model: GeminiModel.IMAGE_EDIT,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/png",
            data: base64Data
          }
        },
        { text: prompt }
      ]
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No edited image generated");
};

export const generateVideo = async (prompt: string, imageBase64?: string): Promise<string> => {
  const ai = getAI();
  let config: any = {
    numberOfVideos: 1,
    resolution: '720p',
    aspectRatio: '16:9'
  };

  let operation;
  
  if (imageBase64) {
    const base64Data = imageBase64.split(',')[1] || imageBase64;
    operation = await ai.models.generateVideos({
      model: GeminiModel.VIDEO_FAST,
      prompt: prompt,
      image: {
        imageBytes: base64Data,
        mimeType: 'image/png'
      },
      config
    });
  } else {
    operation = await ai.models.generateVideos({
      model: GeminiModel.VIDEO_FAST,
      prompt: prompt,
      config
    });
  }

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed");
  
  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

export const generateTTS = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: GeminiModel.TTS,
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");

  const binaryString = atob(base64Audio);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const wavBlob = pcmToWav(bytes, 24000);
  return URL.createObjectURL(wavBlob);
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const ai = getAI();
  
  const reader = new FileReader();
  const base64Promise = new Promise<string>((resolve) => {
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
  });
  reader.readAsDataURL(audioBlob);
  const base64Data = await base64Promise;

  const response = await ai.models.generateContent({
    model: GeminiModel.FLASH_TEXT,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: audioBlob.type || 'audio/wav',
            data: base64Data
          }
        },
        { text: "Transcribe the audio exactly." }
      ]
    }
  });

  return response.text || "";
};

function pcmToWav(pcmData: Uint8Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);
  
  new Uint8Array(buffer, 44).set(pcmData);

  return new Blob([buffer], { type: 'audio/wav' });
}