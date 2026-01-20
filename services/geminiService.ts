import { GoogleGenAI, Type } from "@google/genai";
import { WardrobeItem, Outfit, Category, Occasion, UserProfile } from "../types";

const OCCASIONS_LIST = [
  'Casual', 'Work', 'Date Night', 'Formal', 'Weekend Brunch', 
  'Beach & Vacation', 'Wedding Guest', 'Gym', 'Party', 
  'Concert & Festival', 'Job Interview', 'Business Trip', 'Lounge & Home'
];

const WARDROBE_ITEM_PROPERTIES = {
  name: { type: Type.STRING },
  category: { type: Type.STRING, description: "One of: Tops, Bottoms, Outerwear, Shoes, Dresses, Accessories" },
  subCategory: { type: Type.STRING },
  primaryColor: { type: Type.STRING },
  secondaryColors: { type: Type.ARRAY, items: { type: Type.STRING } },
  pattern: { type: Type.STRING },
  materialLook: { type: Type.STRING },
  seasonality: { type: Type.ARRAY, items: { type: Type.STRING } },
  formality: { type: Type.STRING },
  warmthLevel: { type: Type.STRING },
  occasionSuitability: { 
    type: Type.ARRAY, 
    items: { type: Type.STRING },
    description: `STRICT CATEGORIZATION: You MUST select one or more only from this list: ${OCCASIONS_LIST.join(', ')}`
  },
  tags: { type: Type.ARRAY, items: { type: Type.STRING } },
  description: { type: Type.STRING }
};

const REQUIRED_ITEM_FIELDS = ["name", "category", "primaryColor", "occasionSuitability"];

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorMsg = error?.message?.toLowerCase() || "";
    const isRetryable = error?.status === 500 || 
                       errorMsg.includes('xhr') || 
                       errorMsg.includes('rpc failed') || 
                       errorMsg.includes('proxyunarycall') ||
                       errorMsg.includes('fetch');
    
    if (retries > 0 && isRetryable) {
      console.warn(`Gemini API transient error detected. Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

const resizeImageForAI = async (base64: string, maxDim = 1024): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > height) {
        if (width > maxDim) {
          height = (height * maxDim) / width;
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = (width * maxDim) / height;
          height = maxDim;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.85).split(',')[1]);
    };
    img.src = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;
  });
};

export const getBase64Data = async (urlOrBase64: string): Promise<string> => {
  if (urlOrBase64.startsWith('data:image')) {
    const parts = urlOrBase64.split(',');
    return parts.length > 1 ? parts[1] : parts[0];
  }
  
  try {
    // Fixed: Corrected variable name from 'urlOrOrBase64' to 'urlOrBase64'
    const response = await fetch(urlOrBase64, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const blob = (await response.blob()) as unknown as Blob;
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("Failed to read image as base64"));
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Failed to fetch image for Gemini:", e);
    throw new Error("Could not process image for AI analysis.");
  }
};

export const analyzeUpload = async (base64Image: string, lang: string = 'en'): Promise<Partial<WardrobeItem>[]> => {
  const resized = await resizeImageForAI(base64Image);
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `You are a luxury fashion archivist. Analyze this image for fashion items. 
    STRICT OCCASION CATEGORIZATION: Use ONLY values from: ${OCCASIONS_LIST.join(', ')}.
    Provide 'name' and 'description' in ${lang}. 
    SAFETY: Do not process any images containing nudity or sexually explicit content. Return an empty array if detected.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [
          { inlineData: { data: resized, mimeType: 'image/jpeg' } },
          { text: prompt }
        ]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: WARDROBE_ITEM_PROPERTIES,
                required: REQUIRED_ITEM_FIELDS
              }
            }
          },
          required: ["items"]
        }
      }
    });

    try {
      const result = JSON.parse(response.text || '{"items":[]}');
      return (result.items || []).map((item: any) => ({
        ...item,
        category: (item.category as Category) || 'Tops',
        isFavorite: false
      }));
    } catch (e) {
      console.error("Failed to parse Gemini upload analysis", e);
      return [];
    }
  });
};

export const generateItemImage = async (item: Partial<WardrobeItem>, referenceImageBase64?: string): Promise<string> => {
  let resizedRef = '';
  if (referenceImageBase64) {
    resizedRef = await resizeImageForAI(referenceImageBase64);
  }

  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Professional item extraction. Replicate the EXACT ${item.primaryColor} ${item.pattern || ''} ${item.name} from the reference image. Studio lighting, pure white background. 3/4 angle. No shadows. Clean boutique look.`;

    const parts: any[] = [{ text: prompt }];
    if (resizedRef) {
      parts.push({ inlineData: { data: resizedRef, mimeType: 'image/jpeg' } });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts }],
      config: { imageConfig: { aspectRatio: "3:4" } }
    });

    let imageUrl = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
    if (!imageUrl) throw new Error("Failed to generate item image");
    return imageUrl;
  });
};

export const suggestOutfit = async (
  items: WardrobeItem[], 
  occasion: Occasion, 
  profile?: UserProfile | null,
  avoidOutfitNames: string[] = []
): Promise<Outfit> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const lang = profile?.language || 'en';
    
    const prioritizedItems = items.slice(0, 50); 
    const itemsText = prioritizedItems.map((i, idx) => 
      `[${idx}] ${i.name} (Category: ${i.category}, Color: ${i.primaryColor}, Pattern: ${i.pattern || 'none'})`
    ).join('; ');
    
    const promptText = `You are a professional luxury fashion stylist. Create a complete ensemble for ${occasion}.
    WARDROBE INVENTORY: ${itemsText}.
    EXCLUDE PREVIOUS NAMES: ${avoidOutfitNames.join(', ')}.
    STRICT RULES: Use ONLY items from the inventory. Ensure a cohesive editorial silhouette. Respond in ${lang}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: [{ text: promptText }],
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            itemIndices: { type: Type.ARRAY, items: { type: Type.INTEGER } },
            stylistNotes: { type: Type.STRING }
          },
          required: ["name", "itemIndices", "stylistNotes"]
        }
      }
    });

    try {
      const result = JSON.parse(response.text || '{}');
      const selectedItems = (result.itemIndices || []).map((idx: number) => prioritizedItems[idx]).filter(Boolean);
      return {
        id: Math.random().toString(36).substr(2, 9),
        name: result.name || `${occasion} Ensemble`,
        items: selectedItems.length > 0 ? selectedItems : items.slice(0, 2),
        stylistNotes: result.stylistNotes || `A curated ${occasion} look.`,
        occasion
      };
    } catch (e) {
      console.error("Failed to parse outfit suggestion", e);
      return { id: 'fallback', name: 'Default Look', items: items.slice(0, 2), stylistNotes: 'Classic ensemble.', occasion };
    }
  });
};

/**
 * AI Stylist: Editorial Visualization
 * Role: High-fashion digital stylist and editorial photographer.
 * Protocol: Performs high-fidelity virtual try-on with strict identity and garment protocols.
 */
export const visualizeOutfit = async (outfit: Outfit, profile: UserProfile | null): Promise<string> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const itemsDescription = outfit.items.map(item => {
      return `- ${item.name} (Category: ${item.category}, Colors: ${item.primaryColor}, Patterns: ${item.pattern || 'none'}, Textures: ${item.materialLook || 'standard'}, Fit: ${item.formality || 'tailored'}).`;
    }).join('\n');
    
    const systemPrompt = `AI Stylist: Editorial Visualization
Role: You are a high-fashion digital stylist and editorial photographer. Your task is to create Vogue-style simulation images where you perfectly dress a user avatar in specific wardrobe items for a given occasion, with pixel-perfect accuracy.

CRITICAL RULES (MUST FOLLOW):
1. AVATAR PRESERVATION: The person in the final image MUST BE IDENTICAL to the provided user avatar. Do NOT alter face shape, features, expression, hairstyle, color, skin tone, or body proportions. Treat the avatar as a 3D mannequin—only change the clothing.
2. ITEM ACCURACY: Render each clothing/accessory item with exact fidelity:
   - Colors: Match hex codes or described colors precisely: ${outfit.items.map(i => i.primaryColor).join(', ')}.
   - Patterns: Replicate complex patterns EXACTLY as described. Do not invent new motifs.
   - Texture: Render fabric textures accurately (silk drape, denim stiffness, wool weave).
   - Silhouette/Cut: Maintain the described fit (tailored, oversized, fitted).
3. VOGUE SIMULATION STYLE: Create an editorial photograph that embodies:
   - Dramatic, cinematic lighting (studio strobes, chiaroscuro).
   - High-fashion composition (dynamic angles, negative space).
   - Contextual backdrop for "${outfit.occasion}" suggesting ambiance through a Vogue-style visual representation.

ITEMS TO RENDER:
${itemsDescription}

8k clarity. Realistic fabric physics. Professional editorial photoshoot.`;

    const imageParts: any[] = [];
    
    if (profile?.avatar_url) {
      const avatarBase64 = await getBase64Data(profile.avatar_url);
      const resizedAvatar = await resizeImageForAI(avatarBase64, 1024);
      imageParts.push({ inlineData: { data: resizedAvatar, mimeType: 'image/jpeg' } });
    }

    // Limit to top 3 items to avoid RPC/Payload issues while providing enough context
    const visualizationItems = outfit.items.slice(0, 3);
    for (const item of visualizationItems) {
      try {
        const itemBase64 = await getBase64Data(item.imageUrl);
        const resizedItem = await resizeImageForAI(itemBase64, 1024);
        imageParts.push({ inlineData: { data: resizedItem, mimeType: 'image/jpeg' } });
      } catch (e) {
        console.warn(`Skipping item image ${item.name}:`, e);
      }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{
        parts: [
          ...imageParts,
          { text: systemPrompt }
        ]
      }],
      config: { imageConfig: { aspectRatio: "3:4" } }
    });

    let imageUrl = '';
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) throw new Error("Failed to visualize editorial ensemble");
    return imageUrl;
  });
};

export type RestorationMode = 'portrait' | 'repair' | 'upscale';

export const restoreFashionImage = async (
  base64: string, 
  mode: RestorationMode = 'portrait',
  additionalRequest?: string
): Promise<string> => {
  const resized = await resizeImageForAI(base64, 1536);
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `Professional Vogue Restoration. 
    Mode: ${mode}. Editorial: Remove background. Skin retouching. High clarity rebuild. 50MP quality.
    Note: ${additionalRequest || 'Standard editorial finish.'}
    SAFETY: No nudity. Boutique standards only.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{
        parts: [
          { inlineData: { data: resized, mimeType: 'image/jpeg' } },
          { text: prompt }
        ]
      }],
      config: { imageConfig: { aspectRatio: "3:4" } }
    });

    let imageUrl = '';
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
    if (!imageUrl) throw new Error("Restoration failed");
    return imageUrl;
  });
};

export const processQuickDress = async (
  clothingBase64s: string[], 
  avatarBase64: string, 
  userRequest?: string
): Promise<string> => {
  const resizedAvatar = await resizeImageForAI(avatarBase64, 1024);
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `Vogue Editorial Simulation - DressMe Couture.
    IDENTITY ANCHOR: The face MUST remain exactly as provided in the avatar. No alterations.
    MISSION: Dress the person in the provided clothing references. 
    STYLE: ${userRequest || 'Elegant studio minimalism'}.
    SAFETY: No nudity. Sophisticated fashion only.`;

    const imageParts = clothingBase64s.slice(0, 3).map(async b => {
      const r = await resizeImageForAI(b, 1024);
      return { inlineData: { data: r, mimeType: 'image/jpeg' } };
    });

    const parts: any[] = [
      { inlineData: { data: resizedAvatar, mimeType: 'image/jpeg' } },
      ...(await Promise.all(imageParts)),
      { text: prompt }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts }],
      config: { imageConfig: { aspectRatio: "3:4" } }
    });

    let imageUrl = '';
    const parts_out = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts_out) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
    if (!imageUrl) throw new Error("DressMe simulation failed");
    return imageUrl;
  });
};