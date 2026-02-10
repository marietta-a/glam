import { GoogleGenAI, Type } from "@google/genai";
import { WardrobeItem, Outfit, Category, Occasion, UserProfile, ORDERED_OCCASIONS } from "../types";
import { CATEGORIES } from "@/constants";

export type RestorationMode = 'portrait' | 'repair' | 'upscale' | 'creative';
export type StyleVibe = 'Studio' | 'Street' | 'Estate' | 'Minimal' | 'Sunset' | 'Paris' | 'Resort';
export type Occupation = 'Pop Star' | 'CEO' | 'Supermodel' | 'Professor' | 'Athlete' | 'Artist' | 'Astronaut' | 'Royal';

/**
 * CROWD RESTORATION PROTOCOL - V31.0 (SCENE FIDELITY + EDITORIAL TYPOGRAPHY)
 */
const CROWD_RESTORATION_PROTOCOL = `
[ALGORITHM: GLOBAL_SCENE_RECONSTRUCTION_V31.0]
- MISSION: High-fidelity restoration of the ENTIRE image with optional Typography.
- SUBJECTS: Preserve and enhance EVERY individual detected in the frame. If there are multiple people (10+), ensure each face is clear and sharpened.
- NO OVERRIDE: Do NOT use any external identity references. Keep original faces exactly as they are, but upscaled.
- TYPOGRAPHY: Artistically integrate any provided "Editorial Notes" using professional magazine-style fonts. The text should be legible, stylish, and placed to complement the composition.
- TEXTILE FIDELITY: Sharp focus on clothing patterns, textures, and silhouettes for all people.
- LIGHTING: Perform a global relighting pass that maintains natural shadows while improving dynamic range.
- QUALITY: 8K Professional Editorial Photography standards.
`;

const PHOTO_REAL_PROTOCOL = `
[ALGORITHM: IDENTITY_ARCHITECT_V25.0]
- MASTER SOURCE (IMAGE 1): Extract the exact face, skin, and physical characteristics. This is the only person who exists in the final result.
- DRESS SOURCE (IMAGE 2): Treat the person here as a ghost. Extract the dress (patterns, fabric, cut) and the background only.
- SYNTHESIS: Reconstruct the person from IMAGE 1 wearing the dress from IMAGE 2.
- NO BLENDING: Do NOT mix the faces. Use only the face from IMAGE 1. 
- QUALITY: 50MP iPhone 15 Pro Max editorial photography. No watermarks.
`;

const VIBE_PROMPTS: Record<StyleVibe, string> = {
  'Studio': 'A minimalist high-end luxury editorial studio with clean gray cyclorama and soft professional overhead lighting.',
  'Street': 'A sun-drenched, high-fashion street style scene in SoHo New York with realistic urban architecture and natural daylight.',
  'Estate': 'An opulent Old Money European estate garden with manicured hedges, stone fountains, and soft morning mist.',
  'Minimal': 'A stark, ultra-modern architectural space with floor-to-ceiling glass and sharp geometric shadows.',
  'Sunset': 'A warm, golden hour backlit outdoor terrace during the peak of sunset with long golden shadows and subtle lens flare.',
  'Paris': 'A chic Parisian Cafe outdoor table on a cobblestone street with warm ambient bistro lighting.',
  'Resort': 'A bright, high-contrast tropical luxury resort deck overlooking turquoise water and tropical palms.'
};

const OCCUPATION_PROMPTS: Record<Occupation, string> = {
  'Pop Star': 'Global Pop Icon performing in a stadium with dramatic stage lighting, sequins, microphone, and fierce energy. High-fashion performance wear.',
  'CEO': 'Fortune 500 Tech CEO in a modern glass office overlooking a skyline. Wearing a sharp bespoke power suit, confident posture, minimal aesthetic.',
  'Supermodel': 'High-fashion runway model during Fashion Week. Avant-garde couture outfit, dramatic makeup, intense gaze, catwalk lighting.',
  'Professor': 'Distinguished Ivy League Professor in a classic library with mahogany shelves. Tweed jacket, glasses, intellectual atmosphere, warm lighting.',
  'Athlete': 'Elite Olympic Athlete in a high-tech stadium or gym setting. Performance sportswear, sweat sheen, intense focus, dynamic action lighting.',
  'Artist': 'Contemporary Artist in a sunlit industrial loft studio. Paint-splattered designer overalls, holding brushes, surrounded by large canvas art.',
  'Astronaut': 'Futuristic Space Explorer inside a sci-fi spacecraft or on a lunar surface. Sleek, high-tech spacesuit (helmet off), glowing ambient lights.',
  'Royal': 'Modern Royalty in a palace throne room. Regal sash, crown jewels, velvet cape, ornate background, dignified and majestic posture.'
};

const VOGUE_PROTOCOL = `
[ALGORITHM: GLAM_CORE_V5.1]
1. IDENTITY LOCK (ABSOLUTE): The subject's appearance in the reference avatar (Image 1) is the immutable blueprint. You MUST NOT modify bone structure, eye geometry, or facial proportions. Retain 100% likeness.
2. NEURAL DRAPING: Analyze the garments in product images. Perform high-fidelity synthesis where the subject wears these items. Account for gravity, layered physics (e.g. jackets over shirts), and fabric-specific folds.
3. LUMINANCE RE-INDEXING: Apply high-key studio lighting. Eliminate muddy shadows and gray mid-tones. Use a "Radiant Editorial" finish.
4. TEXTURE ARCHITECTURE: Reconstruct micro-details in fabric (silk sheen, denim weave, leather grain) to 8K perceptual clarity.
`;

const OCCASION_ENVIRONMENTS: Record<Occasion, string> = {
  'Casual': 'An open-air urban plaza with modern architecture, soft daylight filtering through glass facades, and relaxed pedestrian flow.',
  'Work': 'A sleek corporate office with polished floors, ergonomic desks, large windows overlooking the city, and subtle ambient lighting.',
  'Date Night': 'An intimate upscale restaurant with dim candlelight, velvet seating, warm tones, and soft background music.',
  'Formal': 'A grand ballroom with marble floors, chandeliers, tall arched windows, and elegant gallery-style decor.',
  'Gym': 'A minimalist fitness studio with mirrored walls, polished concrete, high-end equipment, and bright overhead lighting.',
  'Party': 'A vibrant nightclub with neon accents, dynamic spotlights, a crowded dance floor, and pulsing electronic music.',
  'Wedding Guest': 'A romantic garden estate with manicured lawns, floral arches, string lights, and a serene sunset backdrop.',
  'Weekend Brunch': 'A sunlit café terrace with modern furniture, greenery-filled planters, glass walls, and bustling weekend energy.',
  'Beach & Vacation': 'A luxury resort deck with ocean views, wooden cabanas, flowing curtains, palm trees, and golden sunlight.',
  'Concert & Festival': 'A massive outdoor stage with dynamic lighting rigs, LED screens, energetic crowds, and cinematic atmosphere.',
  'Job Interview': 'A professional lobby with neutral tones, minimalist furniture, polished stone floors, and bright natural light.',
  'Business Trip': 'An exclusive airport lounge with leather seating, panoramic runway views, modern decor, and quiet ambiance.',
  'Lounge & Home': 'A cozy designer apartment with minimalist furniture, warm lighting, soft textiles, and a relaxed atmosphere.'
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
    else { tags = [String(raw)]; }
  } else { tags = [String(raw)]; }
  const normalizedOccasion = occasion.toLowerCase().trim().replace(/[^\w\s&]/g, '');
  return tags.some(tag => {
    let nt = String(tag).toLowerCase().trim().replace(/[\[\]"']/g, '').replace(/[^\w\s&]/g, '');
    if (!nt) return false;
    if (nt === normalizedOccasion) return true;
    return nt.length > 3 && (normalizedOccasion.includes(nt) || nt.includes(normalizedOccasion));
  });
};

const parseSafeJson = (text: string): any => {
  try { return JSON.parse(text.trim()); } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) { try { return JSON.parse(match[1].trim()); } catch { return null; } }
    const fb = text.indexOf('{'), lb = text.lastIndexOf('}');
    if (fb !== -1 && lb > fb) { try { try { return JSON.parse(text.substring(fb, lb + 1)); } catch {} } catch {} }
    return null;
  }
};

const resizeImageForAI = async (base64: string, maxDim = 1024): Promise<{ data: string, mimeType: string }> => {
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
      if (ctx) { 
        ctx.fillStyle = 'white'; 
        ctx.fillRect(0, 0, width, height); 
        ctx.drawImage(img, 0, 0, width, height); 
      }
      resolve({ data: canvas.toDataURL('image/jpeg', 0.9).split(',')[1], mimeType: 'image/jpeg' });
    };
    img.onerror = () => resolve({ data: base64.split(',')[1] || base64, mimeType: 'image/jpeg' });
    img.src = base64;
  });
};

export const getBase64Data = async (urlOrBase64: string): Promise<string> => {
  if (urlOrBase64.startsWith('data:image')) return urlOrBase64.split(',')[1];
  const response = await fetch(urlOrBase64, { mode: 'cors' });
  if (!response.ok) throw new Error("UNABLE_TO_FETCH_URL");
  const blob = await response.blob() as Blob;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = () => reject(new Error("FILE_READ_ERROR"));
    reader.readAsDataURL(blob);
  });
};

const validateOutfitRules = (items: WardrobeItem[], isUniversal: boolean): boolean => {
  const categories = items.map(i => i.category);
  
  const has = (cat: Category) => categories.includes(cat);
  const count = (cat: Category) => categories.filter(c => c === cat).length;

  // 1. DUPLICATE CHECK: No duplicate Item IDs
  const ids = items.map(i => i.id);
  if (new Set(ids).size !== ids.length) return false;

  // 2. CORE LOGIC: The "Body" Rule
  // An outfit must have EITHER a Dress OR (Top + Bottom).
  if (has('Dresses')) {
    if (has('Tops') || has('Bottoms')) return false; // Clash
    if (count('Dresses') > 1) return false; // No double dresses
  } else {
    // If no dress, we generally need Top + Bottom
    // Exception: In "Universal/Creative" mode, we allow just a Top (concept look) 
    // but we generally reject Just Bottoms.
    if (has('Tops') && !has('Bottoms') && !isUniversal) return false;
    if (!has('Tops') && has('Bottoms') && !isUniversal) return false;
    if (!has('Tops') && !has('Bottoms') && !has('Outerwear')) return false; // Must have something to wear
  }

  // 3. LOGISTIC CONSTRAINTS
  if (count('Shoes') > 1) return false;
  if (count('Bags') > 1) return false;
  if (count('Caps') > 1) return false;
  if (count('Outerwear') > 1) return false; // Usually 1 coat is enough

  return true;
};

export const suggestOutfits = async (
  items: WardrobeItem[], 
  occasion: Occasion, 
  profile?: UserProfile | null,
  avoidCombinations: string[] = [], 
  isUniversal: boolean = false
): Promise<{ outfits: Outfit[], noMoreCombinations: boolean }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // 1. DATA PREP: Enriched Metadata for better AI matching
  // We include pattern/material if available to help with texture matching
  const itemsText = items.slice(0, 400)
    .map(i => `[${i.id}] ${i.category}: ${i.name.slice(0, 30)} | Color: ${i.primaryColor || 'N/A'} | Vibe: ${i.materialLook || 'Standard'}`)
    .join('\n');

  // 2. THE "ELITE STYLIST" PROMPT
  const systemInstruction = `
    ROLE: Elite Fashion Stylist (Vogue/GQ Standard).
    TASK: Curate 6 distinct, high-cohesion outfits for occasion: "${occasion}".
    
    ARCHIVE CONTEXT:
    You have access to these categories ONLY: ['Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Dresses', 'Bags', 'Caps', 'Accessories'].
    
    STYLING ALGORITHM:
    1. THE ANCHOR: Start with a "Hero Piece" (a Dress, or a strong Top+Bottom combo).
    2. THE LAYER: Add 'Outerwear' only if it complements the silhouette and occasion (e.g., Blazer for Work, Denim Jacket for Casual).
    3. THE FINISH: Add 'Shoes' (Mandatory if available), 'Bags', 'Caps', and 'Accessories'.
    
    STRICT RULES (VIOLATIONS = REJECTION):
    - EXCLUSIVE: A 'Dress' takes the slot of both 'Tops' and 'Bottoms'. NEVER mix them.
    - FOOTWEAR: Max 1 pair of 'Shoes'.
    - HEADWEAR: 'Caps' are great for Casual/Street/Festival. Avoid for Formal/Job Interview unless it's a specific fashion statement.
    - VARIETY: Do not reuse the same "Hero Piece" in more than 2 outfits.
    
    EXCEPTION PROTOCOL (LOW INVENTORY):
    - If shoes are missing in the archive, create the look without them. Do not hallucinate items.
    - If only Tops exist, create "Portrait/Zoom Looks" (Top + Accessories + Cap).
    
    OUTPUT JSON FORMAT:
    { "options": [{ "name": "Editorial Title", "itemIds": ["id1", "id2"], "stylistNotes": "Pitch this look in 10 words." }] }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest', 
      contents: `ARCHIVE INVENTORY:\n${itemsText}\n\nPREVIOUSLY SEEN COMBOS (AVOID):\n${avoidCombinations.join(' | ')}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  itemIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                  stylistNotes: { type: Type.STRING }
                },
                required: ["name", "itemIds", "stylistNotes"]
              }
            }
          },
          required: ["options"]
        }
      }
    });

    const result = parseSafeJson(response.text || '') || { options: [] };
    const generatedOptions = result.options || [];

    // 3. POST-PROCESS VALIDATION ENGINE
    const validOutfits: Outfit[] = [];
    const seenCombinations = new Set(avoidCombinations);

    for (const opt of generatedOptions) {
      // A. Hydrate Items
      const foundItems = (opt.itemIds || [])
        .map((id: string) => items.find(item => item.id === id))
        .filter(Boolean) as WardrobeItem[];

      if (foundItems.length === 0) continue;

      // B. Deduplication Check
      const comboSignature = foundItems.map(i => i.id).sort().join(',');
      if (seenCombinations.has(comboSignature)) continue;

      // C. Logic Check (The Guard Rails)
      if (!validateOutfitRules(foundItems, isUniversal)) continue;

      // D. Success
      seenCombinations.add(comboSignature);
      validOutfits.push({
        id: Math.random().toString(36).substr(2, 9),
        name: opt.name,
        items: foundItems,
        stylistNotes: opt.stylistNotes,
        occasion
      });
    }
    
    return { 
      outfits: validOutfits,
      noMoreCombinations: validOutfits.length < generatedOptions.length
    };

  } catch (error) {
    console.error("Gemini Stylist Error:", error);
    return { outfits: [], noMoreCombinations: false };
  }
};

export const visualizeOutfit = async (outfit: Outfit, profile: UserProfile | null): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const isGown = outfit.items.some(i => i.category === 'Dresses');
  const itemsDesc = outfit.items.map(i => `${i.name} (${i.description || i.category})`).join(', ');
  const envDetail = outfit.occasion ? (OCCASION_ENVIRONMENTS[outfit.occasion as Occasion] || "A luxury setting.") : "A luxury studio.";

  const promptText = `${VOGUE_PROTOCOL}
  WEARING: ${itemsDesc}. 
  OUTFIT STRUCTURE: ${isGown ? "SINGLE-PIECE CONTINUOUS GOWN SILHOUETTE" : "SEPARATE PIECES: TOP AND BOTTOM ENSEMBLE"}.
  SETTING: ${envDetail}.
  IDENTITY PROTECTION: Image 1 is the subject's face. You MUST RETAIN 100% of their facial features and appearance. ZERO CHANGES.
  QUALITY: Professional editorial lighting, vibrant colors.`;

  const parts: any[] = [];
  if (profile?.avatar_url) {
    const rawAvatar = await getBase64Data(profile.avatar_url);
    const optimizedAvatar = await resizeImageForAI(`data:image/jpeg;base64,${rawAvatar}`, 768);
    parts.push({ inlineData: { data: optimizedAvatar.data, mimeType: optimizedAvatar.mimeType } });
  }
  parts.push({ text: promptText });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: { imageConfig: { aspectRatio: "3:4" } }
  });

  const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!part) throw new Error("Synthesis failed.");
  return `data:image/png;base64,${part.inlineData!.data}`;
};

export const restoreFashionImage = async (base64: string, mode: RestorationMode, userRequest?: string, vibe?: StyleVibe): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const optimizedInput = await resizeImageForAI(base64, 1024);
  
  let modeFocus = "";
  switch(mode) {
    case 'portrait': modeFocus = "Extreme detail pass on all detected faces. Maintain 100% original likeness for everyone in frame."; break;
    case 'repair': modeFocus = "Fix background artifacts and reconstruct fabric fidelity for all subjects."; break;
    case 'upscale': modeFocus = "8K professional photography resolution across entire group shot."; break;
    case 'creative': modeFocus = "Cinematic relighting shift for every person in the frame."; break;
  }

  const vibeDetail = vibe ? `ATMOSPHERE: ${VIBE_PROMPTS[vibe]}` : "Editorial atmosphere.";
  const editorialNote = userRequest ? `EDITORIAL_NOTE (Integrate as Typography): "${userRequest}"` : "";

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { 
      parts: [
        { inlineData: { data: optimizedInput.data, mimeType: optimizedInput.mimeType } }, 
        { text: `${CROWD_RESTORATION_PROTOCOL}\nMODE_FOCUS: ${modeFocus}. ${vibeDetail}.\n${editorialNote}` }
      ] 
    }
  });

  const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!part) throw new Error("Restoration failed.");
  return `data:image/png;base64,${part.inlineData!.data}`;
};

export const generateOccupationImage = async (base64: string, occupation: Occupation): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const optimizedInput = await resizeImageForAI(base64, 1024);
  
  const occupationPrompt = OCCUPATION_PROMPTS[occupation];

  const prompt = `
    [ALGORITHM: CAREER_IDENTITY_SHIFT_V2]
    - INPUT: Portrait of the user.
    - GOAL: Generate a photorealistic image of this EXACT person as a ${occupation}.
    - IDENTITY LOCK: The face in the output MUST be identical to the input face. Maintain identity, facial structure, and ethnicity 100%. Do not generate a new face.
    - SCENE & ATTIRE: ${occupationPrompt}
    - QUALITY: 8K, cinematic lighting, highly detailed texture.
    - OUTPUT: Single image of the user in the new role.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: optimizedInput.data, mimeType: optimizedInput.mimeType } },
        { text: prompt }
      ]
    },
    config: { imageConfig: { aspectRatio: "3:4" } }
  });

  const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!part) throw new Error("Transformation failed.");
  return `data:image/png;base64,${part.inlineData!.data}`;
};

export const processFaceReplacement = async (targetSceneBase64: string, avatarBase64: string, userRequest?: string, vibe?: StyleVibe): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const avatar = await resizeImageForAI(avatarBase64, 1024);
  const target = await resizeImageForAI(targetSceneBase64, 1024);

  const vibeDetail = vibe ? `ATMOSPHERE: ${VIBE_PROMPTS[vibe]}` : "Editorial studio lighting.";

  const prompt = `
    ${PHOTO_REAL_PROTOCOL}
    [ACTION: BIOMETRIC_IDENTITY_MIGRATION]
    - TARGET: Take the person from IMAGE 1 (Identity Source).
    - ACTION: Place the person from IMAGE 1 into the clothing and background of IMAGE 2 (Dress Source).
    - MANDATORY: The resulting face MUST be an exact replica of the face in IMAGE 1. Discard the face from IMAGE 2.
    - OUTFIT: The garment and its patterns (especially complex prints) from IMAGE 2 must be preserved exactly.
    - ENVIRONMENT: ${vibeDetail}. ${userRequest || ''}
    QUALITY: 8K Photorealistic. No watermarks.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: avatar.data, mimeType: avatar.mimeType } }, // MASTER IDENTITY
        { inlineData: { data: target.data, mimeType: target.mimeType } }, // STYLE HOST
        { text: prompt }
      ]
    },
    config: { imageConfig: { aspectRatio: "3:4" } }
  });

  const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!part) throw new Error("Migration failed.");
  return `data:image/png;base64,${part.inlineData!.data}`;
};

export const analyzeUpload = async (base64Image: string, lang: string = 'en'): Promise<Partial<WardrobeItem>[]> => {
  const { data, mimeType } = await resizeImageForAI(base64Image, 512); 
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { 
      parts: [
        { inlineData: { data, mimeType } }, 
        { text: `
          You are a strict Fashion Inventory AI. Analyze the image.

          PHASE 1: RELEVANCE CHECK
          - Is this image clearly a fashion item (clothing, footwear, bag, accessory)?
          - REJECT IF: The image contains ONLY pets, food, landscapes, vehicles, furniture, documents, or blurry non-objects.
          - IF REJECTED: Return exactly { "items": [] }. Do not hallucinate.

          PHASE 2: EXTRACTION (Only if Phase 1 passes)
          Identify items and return JSON. 
          
          RULES:
          1. CATEGORY: Classify every item into exactly one of: ${CATEGORIES.join(', ')}.
             - Map 'Pants', 'Skirts', 'Shorts' -> 'Bottoms'
             - Map 'Shirts', 'Blouses', 'T-Shirts' -> 'Tops'
             - Map 'Jackets', 'Coats', 'Blazers' -> 'Outerwear'
             - Map 'Sneakers', 'Boots', 'Sandals' -> 'Shoes'
             
          2. OCCASION: For 'occasionSuitability', pick appropriate tags ONLY from this list: ${ORDERED_OCCASIONS.join(', ')}.
             - Select multiple if applicable.
          ` 
        }
      ] 
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: { 
                  type: Type.STRING,
                  enum: CATEGORIES 
                },
                primaryColor: { type: Type.STRING },
                description: { type: Type.STRING },
                materialLook: { type: Type.STRING },
                pattern: { type: Type.STRING },
                warmthLevel: { type: Type.STRING },
                occasionSuitability: { 
                  type: Type.ARRAY, 
                  items: { 
                    type: Type.STRING,
                    enum: ORDERED_OCCASIONS
                  } 
                }
              },
              required: ["name", "category", "occasionSuitability"]
            }
          }
        }
      }
    }
  });
  
  const result = parseSafeJson(response.text || '') || { items: [] };
  return result.items;
};

export const generateItemImage = async (itemData: Partial<WardrobeItem>, sourceBase64: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { data, mimeType } = await resizeImageForAI(sourceBase64, 512);
  
  const prompt = `
    [TASK: GARMENT_EXTRACTION]
    - TARGET: Extract the ${itemData.name}.
    - STYLE: Ghost Mannequin / Invisible Mannequin / Flat Lay style.
    - CONSTRAINT: REMOVE ALL HUMAN BODY PARTS. No heads, no hands, no legs, no skin, no models.
    - BACKGROUND: Pure white (#FFFFFF) background.
    - OUTPUT: The item only, floating on white.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { 
      parts: [
        { inlineData: { data, mimeType } }, 
        { text: prompt }
      ] 
    }
  });

  const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!part) throw new Error("Isolation failed");
  return `data:image/png;base64,${part.inlineData!.data}`;
};