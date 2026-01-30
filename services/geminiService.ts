
import { GoogleGenAI, Type } from "@google/genai";
import { WardrobeItem, Outfit, Category, Occasion, UserProfile, ORDERED_OCCASIONS } from "../types";

export type RestorationMode = 'portrait' | 'repair' | 'upscale';

const OCCASION_ENVIRONMENTS: Record<Occasion, string> = {
  'Casual': 'A chic urban cobblestone street in Paris, soft cinematic sunlight.',
  'Work': 'A sleek, glass-walled executive lounge in a modern skyscraper, high-end professional atmosphere.',
  'Date Night': 'A moody, candlelit luxury rooftop terrace at night.',
  'Formal': 'The grand foyer of a Neo-Classical opera house, marble staircases, extremely elegant.',
  'Gym': 'A futuristic minimalist gym with soft ambient blue lighting.',
  'Party': 'An exclusive neon-lit underground lounge with a velvet aesthetic.',
  'Wedding Guest': 'A romantic Italian lakeside villa garden at twilight.',
  'Weekend Brunch': 'A sun-drenched botanical cafe with organic wooden textures.',
  'Beach & Vacation': 'A private overwater bungalow deck with turquoise waves.',
  'Concert & Festival': 'A cinematic view from a VIP balcony of a grand music stadium.',
  'Job Interview': 'A sophisticated minimalist office, professional lighting, corporate elite vibe.',
  'Business Trip': 'A luxurious first-class cabin of a private jet, soft leather.',
  'Lounge & Home': 'A serene minimalist sanctuary with floor-to-ceiling windows.'
};

const FORMALITY_ANCHORS: Record<Occasion, string> = {
  'Casual': 'Relaxed and effortless (Formality: 1-3/10).',
  'Work': 'Polished and authoritative (Formality: 8-9/10). Structured silhouettes, professional palette.',
  'Date Night': 'Elevated and alluring (Formality: 6-8/10).',
  'Formal': 'Black-tie excellence (Formality: 10/10).',
  'Gym': 'High-performance functional (Formality: 0-1/10).',
  'Party': 'Bold and expressive (Formality: 4-9/10).',
  'Wedding Guest': 'Celebratory and respectful (Formality: 8-9/10).',
  'Weekend Brunch': 'Breezy botanical (Formality: 3-5/10).',
  'Beach & Vacation': 'Resort leisure (Formality: 1-4/10).',
  'Concert & Festival': 'Editorial edge (Formality: 2-6/10).',
  'Job Interview': 'Impeccable first impression (Formality: 9-10/10). Extremely professional and modern.',
  'Business Trip': 'Versatile transit luxury (Formality: 7-8/10).',
  'Lounge & Home': 'Minimalist sanctuary (Formality: 0-2/10).'
};

export const isItemSuitableForOccasion = (item: WardrobeItem, occasion: Occasion): boolean => {
  if (!item.occasionSuitability) return false;
  let tags: string[] = [];
  const raw: any = item.occasionSuitability;
  if (Array.isArray(raw)) { tags = raw.map(String); } 
  else if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try { tags = JSON.parse(trimmed); } catch { tags = [trimmed]; }
    } else if (trimmed.includes(',')) { tags = trimmed.split(',').map(s => s.trim()); } 
    else { tags = [trimmed]; }
  } else { tags = [String(raw)]; }
  const normalizedOccasion = occasion.toLowerCase().trim().replace(/[^\w\s&]/g, '');
  return tags.some(tag => {
    let nt = String(tag).toLowerCase().trim().replace(/[\[\]"']/g, '').replace(/[^\w\s&]/g, '');
    if (!nt) return false;
    if (nt === normalizedOccasion) return true;
    const occWords = normalizedOccasion.split(/\s+|&|and/).filter(w => w.length > 2);
    const tagWords = nt.split(/\s+|&|and/).filter(w => w.length > 2);
    if (tagWords.some(tw => occWords.some(ow => ow.includes(tw) || tw.includes(ow)))) return true;
    return nt.length > 3 && (normalizedOccasion.includes(nt) || nt.includes(normalizedOccasion));
  });
};

const parseSafeJson = (text: string): any => {
  try { return JSON.parse(text.trim()); } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) { try { return JSON.parse(match[1].trim()); } catch { return null; } }
    const fb = text.indexOf('{'), lb = text.lastIndexOf('}');
    if (fb !== -1 && lb > fb) { try { return JSON.parse(text.substring(fb, lb + 1)); } catch {} }
    return null;
  }
};

const resizeImageForAI = async (base64: string, maxDim = 384): Promise<{ data: string, mimeType: string }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > height) { if (width > maxDim) { height = (height * maxDim) / width; width = maxDim; } } 
      else { if (height > maxDim) { width = (width * maxDim) / height; height = maxDim; } }
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.fillStyle = 'white'; ctx.fillRect(0, 0, width, height); ctx.drawImage(img, 0, 0, width, height); }
      resolve({ data: canvas.toDataURL('image/jpeg', 0.7).split(',')[1], mimeType: 'image/jpeg' });
    };
    img.onerror = () => resolve({ data: base64.split(',')[1] || base64, mimeType: 'image/jpeg' });
    img.src = base64;
  });
};

const normalizeCategory = (cat: string): Category => {
  const c = cat.toLowerCase().trim();
  if (c.includes('bag') || ['handbag', 'satchel', 'purse', 'clutch', 'tote', 'backpack'].some(t => c.includes(t))) return 'Bags';
  if (c.includes('access') || ['jewelry','hat','belt','scarf','watch'].some(t => c.includes(t))) return 'Accessories';
  if (c.includes('top') || ['shirt','blouse','sweater','hoodie','t-shirt'].includes(c)) return 'Tops';
  if (c.includes('bottom') || ['pants','jeans','skirt','trousers','shorts'].includes(c)) return 'Bottoms';
  if (c.includes('shoe') || ['footwear','boots','sneakers','heels'].includes(c)) return 'Shoes';
  if (c.includes('dress') || ['gown','jumpsuit'].includes(c)) return 'Dresses';
  if (c.includes('outer') || ['jacket','coat','blazer','cardigan'].includes(c)) return 'Outerwear';
  return 'Tops'; 
};

export const getBase64Data = async (urlOrBase64: string): Promise<string> => {
  if (urlOrBase64.startsWith('data:image')) return urlOrBase64.split(',')[1];
  const response = await fetch(urlOrBase64, { mode: 'cors' });
  if (!response.ok) throw new Error("UNABLE_TO_FETCH_URL");
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = () => reject(new Error("FILE_READ_ERROR"));
    reader.readAsDataURL(blob);
  });
};

export const suggestOutfit = async (
  items: WardrobeItem[], 
  occasion: Occasion, 
  profile?: UserProfile | null,
  avoidCombinations: string[] = [],
  isUniversal: boolean = false
): Promise<Outfit> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const strictlyMatched = items.filter(i => isItemSuitableForOccasion(i, occasion));
  
  const itemsText = items.slice(0, 100).map(i => {
    const isStrict = strictlyMatched.find(s => s.id === i.id);
    return `[ID:${i.id}] ${i.name} (${i.category}) | F:${i.formality || 'Med'} | Suitability:${isStrict ? 'HIGH' : 'LOW'}`;
  }).join('\n');

  const formalityGuideline = FORMALITY_ANCHORS[occasion] || "Standard high-fashion aesthetic.";

  const systemInstruction = `You are the World's Best Professional Fashion Stylist. 
OCCASION: "${occasion}" (${formalityGuideline})
${isUniversal ? 'CREATIVE IMPROV: Use your elite taste to curate from the entire archive. Prioritize aesthetic harmony and occasion formality.' : 'SIGNATURE EDIT: Prioritize items with HIGH Suitability.'}
AVOID REPETITION: Do not use ID combinations listed here: ${avoidCombinations.join(', ')}.
Output JSON: { name, itemIds, stylistNotes, noMoreCombinations }. 
IMPORTANT: Only return noMoreCombinations: true if you have literally tried every single logical permutation for this occasion and cannot produce a fresh look.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview', 
    contents: `ARCHIVE:\n${itemsText}`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 0 }, 
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          itemIds: { type: Type.ARRAY, items: { type: Type.STRING } },
          stylistNotes: { type: Type.STRING },
          noMoreCombinations: { type: Type.BOOLEAN }
        },
        required: ["name", "itemIds", "stylistNotes", "noMoreCombinations"]
      }
    }
  });

  const result = parseSafeJson(response.text) || {};
  const selectedItems = (result.itemIds || []).map((id: string) => items.find(item => item.id === id)).filter(Boolean);

  return {
    id: Math.random().toString(36).substr(2, 9),
    name: result.name || `${occasion} Elite Selection`,
    items: selectedItems as WardrobeItem[],
    stylistNotes: result.stylistNotes,
    occasion,
    noMoreCombinations: result.noMoreCombinations || false,
    isUniversal
  };
};

export const visualizeOutfit = async (outfit: Outfit, profile: UserProfile | null): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const itemsDesc = outfit.items.map(i => `${i.name} (${i.description})`).join(', ');
  const envDetail = outfit.occasion ? (OCCASION_ENVIRONMENTS[outfit.occasion as Occasion] || "A luxury lifestyle setting.") : "A luxury studio.";

  const promptText = `World-class hyper-realistic Virtual Reality Simulation. 
  SUBJECT: Maintain EXACT facial features, skin tone, and identity from Image 1. DO NOT change the person's face. 
  The person in the final image must look exactly like the person in the source image.
  WEARING: ${itemsDesc}. Do not modify the outfit design.
  SETTING: A professional, hyper-realistic VR depiction of the user immersed in: ${envDetail}.
  PROMPT: Full-body professional photography, cinematic lighting, 8k resolution. Zero identity drift. The person MUST look identical to Image 1.`;

  const parts: any[] = [];
  if (profile?.avatar_url) {
    const avatarBase64 = await getBase64Data(profile.avatar_url);
    parts.push({ inlineData: { data: avatarBase64, mimeType: 'image/jpeg' } });
  }
  parts.push({ text: promptText });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: { imageConfig: { aspectRatio: "3:4" } }
  });

  const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!part) throw new Error("Reality synthesis failed.");
  return `data:image/png;base64,${part.inlineData!.data}`;
};

export const analyzeUpload = async (base64Image: string, lang: string = 'en'): Promise<Partial<WardrobeItem>[]> => {
  const { data, mimeType } = await resizeImageForAI(base64Image, 384); 
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [{ inlineData: { data, mimeType } }, { text: "Digitize garments." }] },
    config: {
      systemInstruction: `Extract garments: NAME, CATEGORY (Tops, Bottoms, Shoes, Bags, Dresses, Outerwear, Accessories), PRIMARY COLOR (HEX), DESCRIPTION, MATERIAL, and 2+ OCCASIONS from: ${ORDERED_OCCASIONS.join(', ')}. Also extract Pattern and Warmth Grade.`,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 0 },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: { type: Type.STRING },
                primaryColor: { type: Type.STRING },
                description: { type: Type.STRING },
                materialLook: { type: Type.STRING },
                pattern: { type: Type.STRING },
                warmthLevel: { type: Type.STRING },
                occasionSuitability: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["name", "category", "primaryColor", "description", "materialLook", "pattern", "warmthLevel", "occasionSuitability"]
            }
          }
        },
        required: ["items"]
      }
    }
  });
  const result = parseSafeJson(response.text) || { items: [] };
  return result.items.map((item: any) => ({ ...item, category: normalizeCategory(item.category) }));
};

export const generateItemImage = async (itemData: Partial<WardrobeItem>, sourceBase64: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { data, mimeType } = await resizeImageForAI(sourceBase64, 384);
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ inlineData: { data, mimeType } }, { text: `Isolate ${itemData.name} on pure white. NO HUMANS.` }] }
  });
  const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!part) throw new Error("Isolation failed");
  return `data:image/png;base64,${part.inlineData!.data}`;
};

export const restoreFashionImage = async (base64: string, mode: RestorationMode, userRequest?: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ inlineData: { data: base64, mimeType: 'image/jpeg' } }, { text: `Restoration: ${mode}. ${userRequest || ''}. Preserve identity.` }] }
  });
  const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!part) throw new Error("Restoration failed");
  return `data:image/png;base64,${part.inlineData!.data}`;
};

export const processQuickDress = async (clothesBase64: string[], avatarBase64: string, descriptions: string, userRequest?: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts: any[] = [{ inlineData: { data: avatarBase64.split(',')[1] || avatarBase64, mimeType: 'image/jpeg' } }];
  clothesBase64.forEach(c => parts.push({ inlineData: { data: c.split(',')[1] || c, mimeType: 'image/jpeg' } }));
  parts.push({ text: `Dress person in Image 1 with items provided. IDENTITY MUST BE PRESERVED. NO FACE CHANGES. ${descriptions}. ${userRequest || ''}.` });
  const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts } });
  const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!part) throw new Error("Simulation failed");
  return `data:image/png;base64,${part.inlineData!.data}`;
};
