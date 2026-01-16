
import { GoogleGenAI, Type } from "@google/genai";
import { Gender } from "../types";

/**
 * Stage 1: Condition Map Generation & Styling Analysis
 * Explicitly detecting sleeve length to guide synthesis.
 */
export const analyzeTryOn = async (
  personImageBase64: string, 
  topImageBase64: string | null, 
  bottomImageBase64: string | null,
  dressImageBase64: string | null,
  gender: Gender
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Act as a Neural Fashion Stylist and Research Engineer.
    TASK: Execute 'Semantic Alignment' and 'Outfit Coordination Analysis'.
    
    1. POSE ESTIMATION: Map the skeletal structure for this ${gender} subject.
    2. SPATIAL BOUNDARIES: Identify where the person is currently wearing clothes.
    3. SLEEVE LENGTH DETECTION: Precisely determine if the PROVIDED reference garments (Top or Dress) have short, half, or long sleeves.
    4. OCCLUSION MAPPING: Identify foreground elements (hands, hair, accessories) that must stay in front of the new garment.
    5. COORDINATION: Suggest matching pants/shoes based on the garment's 'vibe'.
  `;

  const parts = [
    { text: prompt },
    { inlineData: { data: personImageBase64.split(',')[1], mimeType: 'image/jpeg' } }
  ];

  if (topImageBase64) parts.push({ inlineData: { data: topImageBase64.split(',')[1], mimeType: 'image/jpeg' } });
  if (bottomImageBase64) parts.push({ inlineData: { data: bottomImageBase64.split(',')[1], mimeType: 'image/jpeg' } });
  if (dressImageBase64) parts.push({ inlineData: { data: dressImageBase64.split(',')[1], mimeType: 'image/jpeg' } });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            garmentDescription: { type: Type.STRING },
            personDescription: { type: Type.STRING },
            bodySize: { type: Type.STRING, enum: ['S', 'M', 'L'] },
            technicalPrompt: { type: Type.STRING },
            stylingSuggestions: {
              type: Type.OBJECT,
              properties: {
                suggestedPants: { type: Type.STRING },
                suggestedShoes: { type: Type.STRING },
                suggestedShirt: { type: Type.STRING },
                styleVibe: { type: Type.STRING }
              }
            }
          },
          required: ["garmentDescription", "personDescription", "bodySize", "technicalPrompt", "stylingSuggestions"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};

/**
 * Stage 2: Spatial-Aware Detail Preservation Synthesis
 * Updated to respect the sleeve length of the reference garment.
 */
export const generateVirtualTryOnImage = async (
  personImageBase64: string, 
  topImageBase64: string | null, 
  bottomImageBase64: string | null,
  dressImageBase64: string | null,
  technicalDescription: string, 
  bodySize: string, 
  gender: Gender
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts: any[] = [
    { text: "TEMPLATE: Master image for identity and background." },
    { inlineData: { data: personImageBase64.split(',')[1], mimeType: 'image/jpeg' } }
  ];

  if (topImageBase64) {
    parts.push({ text: "REFERENCE GARMENT: Map this EXACT design onto the person." });
    parts.push({ inlineData: { data: topImageBase64.split(',')[1], mimeType: 'image/jpeg' } });
  }
  if (bottomImageBase64) {
    parts.push({ text: "REFERENCE BOTTOM: Map this EXACT design." });
    parts.push({ inlineData: { data: bottomImageBase64.split(',')[1], mimeType: 'image/jpeg' } });
  }
  if (dressImageBase64) {
    parts.push({ text: "REFERENCE DRESS: Map this EXACT design." });
    parts.push({ inlineData: { data: dressImageBase64.split(',')[1], mimeType: 'image/jpeg' } });
  }

  parts.push({ text: `
    CRITICAL INSTRUCTION: Sleeve Length Fidelity.
    - DO NOT default to the sleeve length of the original clothing in the template.
    - If the REFERENCE garment is short-sleeved (half-hands), you MUST render the person's actual arms/skin below the sleeve.
    - Do NOT stretch the reference garment to cover long sleeves if the reference itself is a t-shirt.
    - Maintain 1:1 texture and logo alignment.
    - Preserve all foreground occlusions (hands, watches, accessories).
    - BLENDING CONTEXT: ${technicalDescription}
  ` });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    return null;
  } catch (error) {
    console.error("Synthesis Error:", error);
    throw error;
  }
};
