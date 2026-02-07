import { supabase } from '../lib/supabase';
import { WardrobeItem, UserProfile, CachedOutfit, Occasion, OutfitSuggestion, Outfit } from '../types';
import {store} from '../services/storeService';
import { DEDUCTION_VALUE } from '@/enum';
// --- IMAGE UTILS ---

export const compressImage = async (base64: string, maxWidth = 1200, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context not available'));
      
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
  });
};

export const uploadWardrobeImage = async (userId: string, itemId: string, base64Image: string): Promise<string> => {
  if (base64Image.startsWith('http')) return base64Image;

  const compressedBase64 = await compressImage(base64Image);
  const base64Content = compressedBase64.split(';base64,').pop()!;
  
  const response = await fetch(`data:image/jpeg;base64,${base64Content}`);
  const blob = (await response.blob()) as unknown as Blob;
  const filePath = `${userId}/${itemId}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from('glamorous')
    .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });

  if (uploadError) throw uploadError;

  const { data, error } = await supabase.storage
    .from('glamorous')
    .createSignedUrl(filePath, 31536000); 

  if(error) throw error;
  
  const signedUrl = data?.signedUrl;
  
  if (itemId === 'avatar') {
    localStorage.setItem('glam_last_avatar', signedUrl);
  }
  
  return signedUrl;
};

// --- WARDROBE ITEMS ---

export const getWardrobeCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('wardrobe_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  if (error) throw error;
  return count || 0;
};

export const fetchWardrobeItemsBatch = async (userId: string, limit: number, offset: number): Promise<WardrobeItem[]> => {
  const { data, error } = await supabase
    .from('wardrobe_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return (data || []).map(item => ({
    id: item.item_id,
    userId: item.user_id,
    name: item.name,
    category: item.category,
    subCategory: item.sub_category,
    // Corrected to camelCase as per WardrobeItem interface
    primaryColor: item.primary_color,
    secondaryColors: item.secondary_colors,
    pattern: item.pattern,
    materialLook: item.material_look,
    seasonality: item.seasonality,
    formality: item.formality,
    warmthLevel: item.warmth_level,
    fitsWithColors: item.fits_with_colors,
    occasionSuitability: item.occasion_suitability,
    tags: item.tags,
    imageUrl: item.image_url,
    description: item.description,
    price: item.price,
    isFavorite: item.is_favorite,
    createdAt: item.created_at
  }));
};

export const saveWardrobeItem = async (item: Partial<WardrobeItem>): Promise<WardrobeItem> => {
  const dbItem = {
    user_id: item.userId,
    name: item.name,
    category: item.category,
    sub_category: item.subCategory,
    primary_color: item.primaryColor,
    secondary_colors: item.secondaryColors,
    pattern: item.pattern,
    // Corrected item.material_look to item.materialLook (camelCase)
    material_look: item.materialLook,
    seasonality: item.seasonality,
    formality: item.formality,
    // Corrected item.warmth_level to item.warmthLevel (camelCase)
    warmth_level: item.warmthLevel,
    fits_with_colors: item.fitsWithColors,
    occasion_suitability: item.occasionSuitability,
    tags: item.tags,
    image_url: item.imageUrl,
    description: item.description,
    price: item.price,
    is_favorite: item.isFavorite
  };

  const { data, error } = await supabase
    .from('wardrobe_items')
    .insert([dbItem])
    .select()
    .single();

  if (error) throw error;

  return { ...item, id: data.item_id, createdAt: data.created_at } as WardrobeItem;
};

export const updateWardrobeItem = async (item: WardrobeItem): Promise<void> => {
  const { error } = await supabase
    .from('wardrobe_items')
    .update({
      name: item.name,
      category: item.category,
      is_favorite: item.isFavorite,
      description: item.description,
      primary_color: item.primaryColor,
      // Corrected item.material_look to item.materialLook (camelCase)
      material_look: item.materialLook,
      pattern: item.pattern,
      // Corrected item.warmth_level to item.warmthLevel (camelCase)
      warmth_level: item.warmthLevel,
      occasion_suitability: item.occasionSuitability
    })
    .eq('item_id', item.id);
  
  if (error) throw error;
};

export const deleteWardrobeItem = async (userId: string, itemId: string): Promise<void> => {
  const { error: dbError } = await supabase
    .from('wardrobe_items')
    .delete()
    .eq('item_id', itemId);

  if (dbError) throw dbError;

  const filePath = `${userId}/${itemId}.jpg`;
  await supabase.storage.from('glamorous').remove([filePath]);
};

// --- USER PROFILE ---

export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('user_profile')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error("Fetch profile error:", error);
    return null;
  }
  
  if (data?.avatar_url) localStorage.setItem('glam_last_avatar', data.avatar_url);
  return data;
};

export const createUserProfile = async (profile: Partial<UserProfile>): Promise<void> => {
  const { error } = await supabase
    .from('user_profile')
    .insert([profile]);
  if (error) throw error;
};

export const updateUserProfile = async (profile: Partial<UserProfile>): Promise<void> => {
  if (profile.avatar_url) localStorage.setItem('glam_last_avatar', profile.avatar_url);
  const { error } = await supabase
    .from('user_profile')
    .update({ ...profile, updated_at: new Date().toISOString() })
    .eq('id', profile.id);
  if (error) throw error;
  store.avatarUpdated = true;
};

export const logoutUser = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  localStorage.removeItem('glam_last_avatar');
};

// --- OUTFIT SUGGESTIONS (STEP 1: TEXT GENERATION) ---

export const fetchAllOutfitSuggestions = async (
  userId: string,
  allWardrobeItems: WardrobeItem[]
): Promise<Record<string, OutfitSuggestion[]>> => {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('outfit_suggestions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_rejected', false)
    .gt('expires_at', now);

  if (error) {
    console.error("Fetch all suggestions error:", error);
    return {};
  }

  const cache: Record<string, OutfitSuggestion[]> = {};
  (data || []).forEach(row => {
    const items = (row.wardrobe_item_ids || [])
      .map((id: string) => allWardrobeItems.find(i => i.id === id))
      .filter(Boolean) as WardrobeItem[];

    if (!cache[row.occasion]) cache[row.occasion] = [];
    cache[row.occasion].push({
      id: row.suggestion_id,
      name: row.outfit_name,
      stylistNotes: row.stylist_notes,
      occasion: row.occasion as Occasion,
      items: items
    });
  });

  return cache;
};

export const fetchOutfitSuggestions = async (
  userId: string, 
  occasion: string,
  allWardrobeItems: WardrobeItem[]
): Promise<OutfitSuggestion[]> => {
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('outfit_suggestions')
    .select('*')
    .eq('user_id', userId)
    .eq('occasion', occasion)
    .eq('is_rejected', false)
    .gt('expires_at', now);

  if (error) {
    console.error("Fetch suggestions error:", error);
    return [];
  }

  return (data || []).map(row => {
    const items = (row.wardrobe_item_ids || [])
      .map((id: string) => allWardrobeItems.find(i => i.id === id))
      .filter(Boolean) as WardrobeItem[];

    return {
      id: row.suggestion_id,
      name: row.outfit_name,
      stylistNotes: row.stylist_notes,
      occasion: row.occasion as Occasion,
      items: items
    };
  });
};

export const deleteOutfitSuggestion = async (userId: string, suggestionId: string): Promise<void> => {
  const { error } = await supabase
    .from('outfit_suggestions')
    .delete()
    .eq('user_id', userId)
    .eq('suggestion_id', suggestionId);
  
  if (error) throw error;
};

export const saveOutfitSuggestions = async (
  userId: string, 
  occasion: string, 
  suggestions: Omit<Outfit, 'id'>[]
): Promise<OutfitSuggestion[]> => {
  // Additive logic: Do not clear old suggestions. User deletes them manually now.
  const dbRows = suggestions.map(s => ({
    user_id: userId,
    occasion: occasion,
    outfit_name: s.name,
    stylist_notes: s.stylistNotes,
    wardrobe_item_ids: s.items.map(i => i.id),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  }));

  const { data, error } = await supabase
    .from('outfit_suggestions')
    .insert(dbRows)
    .select();

  if (error) throw error;

  return data.map((row, index) => ({
    id: row.suggestion_id,
    name: row.outfit_name,
    stylistNotes: row.stylist_notes,
    occasion: row.occasion as Occasion,
    items: suggestions[index].items
  }));
};

// --- OUTFIT VISUALIZATION CACHE (STEP 2: IMAGE GENERATION) ---

export const fetchOutfitCache = async (userId: string, wardrobeItems: WardrobeItem[]): Promise<Record<string, CachedOutfit>> => {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('visualized_outfits')
    .select('*')
    .eq('user_id', userId)
    .gt('expires_at', now);

  if (error) {
    console.error("Fetch outfit cache error:", error);
    return {};
  }

  const cache: Record<string, CachedOutfit> = {};
  
  (data || []).forEach(row => {
    const items = (row.wardrobe_item_ids || [])
      .map((id: string) => wardrobeItems.find(item => item.id === id))
      .filter(Boolean) as WardrobeItem[];

    if (items.length > 0) {
      cache[row.suggestion_id] = {
        id: row.suggestion_id,
        outfit: {
          id: row.suggestion_id,
          name: row.outfit_name,
          items: items,
          stylistNotes: row.stylist_notes,
          occasion: row.occasion as Occasion
        },
        visualizedImage: row.visualized_image_url,
        avatarUrl: row.avatar_url,
        generatedAt: new Date(row.generated_at).getTime(),
        combinationHistory: row.history || []
      };
    }
  });

  return cache;
};

export const saveOutfitToCache = async (userId: string, occasion: string, cacheItem: CachedOutfit): Promise<void> => {
  const suggestionId = cacheItem.outfit.id;

  await supabase
    .from('visualized_outfits')
    .delete()
    .eq('user_id', userId)
    .eq('suggestion_id', suggestionId);

  const { error } = await supabase
    .from('visualized_outfits')
    .insert([{
      user_id: userId,
      suggestion_id: suggestionId,
      outfit_name: cacheItem.outfit.name,
      wardrobe_item_ids: cacheItem.outfit.items.map(i => i.id),
      stylist_notes: cacheItem.outfit.stylistNotes,
      occasion: occasion,
      avatar_url: cacheItem.avatarUrl,
      visualized_image_url: cacheItem.visualizedImage,
      generated_at: new Date(cacheItem.generatedAt).toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      history: cacheItem.combinationHistory || []
    }]);

  if (error) throw error;
};

export const deleteOutfitFromCache = async (userId: string, suggestionId: string): Promise<void> => {
  const { error } = await supabase
    .from('visualized_outfits')
    .delete()
    .eq('user_id', userId)
    .eq('suggestion_id', suggestionId);
  if (error) throw error;
};

// --- CREDITS & DAILY LIMITS ---

/**
 * Checks if the daily reset has occurred. If so, resets counters.
 */
export const checkAndResetDailyLimits = async (profile: UserProfile): Promise<UserProfile> => {
  const today = new Date().toISOString().split('T')[0];
  
  if (profile.last_reset_date !== today) {
    const updated = {
      ...profile,
      daily_outfit_count: 0,
      daily_image_count: 0,
      last_reset_date: today,
      updated_at: new Date().toISOString()
    };
    
    // We update Supabase silently
    await supabase
      .from('user_profile')
      .update({ 
        daily_outfit_count: 0, 
        daily_image_count: 0, 
        last_reset_date: today,
        updated_at: updated.updated_at 
      })
      .eq('id', profile.id);
      
    store.updateProfile(updated);
    return updated;
  }
  return profile;
};

export const addCredits = async (profile: UserProfile, amount: number): Promise<UserProfile> => {
  const newCredits = (profile.credits || 0) + amount;
  const { error } = await supabase
    .from('user_profile')
    .update({ credits: newCredits, updated_at: new Date().toISOString() })
    .eq('id', profile.id);

  if (error) throw error;
  return { ...profile, credits: newCredits };
};

/**
 * Tracks usage for outfit suggestions (Step 1).
 * Freemium Limit: 10 per day.
 * Updated: Only enforces limits if user has 0 credits.
 */
export const trackOutfitGeneration = async (profile: UserProfile): Promise<UserProfile> => {
  if (profile.is_premium) return profile;

  // If user has credits, they bypass the daily limit restriction for outfits
  if ((profile.credits || 0) > 0) return profile;

  const currentCount = profile.daily_outfit_count || 0;
  if (currentCount >= 10) throw new Error("DAILY_LIMIT_REACHED_OUTFIT");

  const newCount = currentCount + 1;
  const updated = { ...profile, daily_outfit_count: newCount };

  await supabase
    .from('user_profile')
    .update({ daily_outfit_count: newCount })
    .eq('id', profile.id);

  store.updateProfile(updated);
  return updated;
};

/**
 * Tracks usage for image visualization (Step 2) & Restores.
 * Freemium Limit: 1 per day.
 * Replaces old 'useGenerationCredit' for visual tasks.
 */
export const useGenerationCredit = async (profile: UserProfile, isHD: boolean): Promise<UserProfile> => {
  // 1. UNLIMITED ACCESS for Elite/Premium members
  if (profile.is_premium) return profile;

  // 2. Calculate Cost
  const deduction = (isHD 
                      ? (profile.credits < DEDUCTION_VALUE.HD_IMG ? profile.credits : DEDUCTION_VALUE.HD_IMG)
                      : (profile.credits < DEDUCTION_VALUE.STD_IMG ? profile.credits : DEDUCTION_VALUE.STD_IMG)
                    );

  // 3. Strict Credit Check
  // If user has fewer credits than required, BLOCK ACTION.
  // We use a small buffer (e.g. 0.5) to handle floating point variations, or just check <= 0
  if ((profile.credits || 0) < deduction) {
      throw new Error("OUT_OF_CREDITS"); // Triggers Paywall in App.tsx
  }

  // 4. Process Deduction
  const newCredits = (profile.credits || 0) - deduction;
  
  // 5. Update Database & Store
  const updated = { 
    ...profile, 
    credits: newCredits, 
    daily_image_count: (profile.daily_image_count || 0) + 1, // We still track count for analytics, but it doesn't grant free access
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('user_profile')
    .update({ 
      credits: newCredits, 
      daily_image_count: updated.daily_image_count,
      updated_at: updated.updated_at 
    })
    .eq('id', profile.id);

  if (error) throw error;

  store.updateProfile(updated);
  return updated;
};


export const deleteAllUserData = async (userId: string): Promise<void> => {
  const { data: items } = await supabase.from('wardrobe_items').select('item_id').eq('user_id', userId);
  const paths: string[] = [`${userId}/profile.jpg`, `${userId}/avatar.jpg`];
  if (items) items.forEach(item => paths.push(`${userId}/${item.item_id}.jpg`));
  
  await supabase.from('visualized_outfits').delete().eq('user_id', userId);
  await supabase.from('outfit_suggestions').delete().eq('user_id', userId);
  await supabase.from('wardrobe_items').delete().eq('user_id', userId);
  await supabase.from('user_profile').delete().eq('id', userId);

  try {
    await supabase.storage.from('glamorous').remove(paths);
  } catch (e) { console.warn("Storage cleanup incomplete", e); }
};