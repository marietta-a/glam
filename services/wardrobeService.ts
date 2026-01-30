import { supabase } from '../lib/supabase';
import { WardrobeItem, UserProfile, CachedOutfit, Outfit, Occasion } from '../types';

/**
 * Compresses a base64 image using canvas to reduce storage size.
 */
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

export const getWardrobeCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('wardrobe_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  if (error) throw error;
  return count || 0;
};

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
  
  // Persist avatar locally for personalization
  if (data?.avatar_url) {
    localStorage.setItem('glam_last_avatar', data.avatar_url);
  }
  
  return data;
};

export const updateUserProfile = async (profile: Partial<UserProfile>): Promise<void> => {
  if (profile.avatar_url) {
    localStorage.setItem('glam_last_avatar', profile.avatar_url);
  }

  const { error } = await supabase
    .from('user_profile')
    .update({ ...profile, updated_at: new Date().toISOString() })
    .eq('id', profile.id);

  if (error) throw error;
};

export const createUserProfile = async (profile: Partial<UserProfile>): Promise<void> => {
  const { error } = await supabase
    .from('user_profile')
    .insert([profile]);

  if (error) throw error;
};

export const logoutUser = async (): Promise<void> => {
  localStorage.removeItem('glam_outfits_cache');
  localStorage.removeItem('glam_active_view');
  localStorage.removeItem('glam_active_tab');
  const { error } = await (supabase.auth as any).signOut();
  if (error) throw error;
};


export const uploadWardrobeImage = async (userId: string, itemId: string, base64Image: string): Promise<string> => {
  const compressedBase64 = await compressImage(base64Image);
  const base64Content = compressedBase64.split(';base64,').pop()!;
  
  const response = await fetch(`data:image/jpeg;base64,${base64Content}`);
  const blob = (await response.blob()) as unknown as Blob;
  const filePath = `${userId}/${itemId}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from('glamorous')
    .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });

  if (uploadError) throw uploadError;

  const { data: { signedUrl }, error } = await supabase.storage
    .from('glamorous')
    .createSignedUrl(filePath, 31536000); 

  if(error) throw error;
  
  if (itemId === 'avatar') {
    localStorage.setItem('glam_last_avatar', signedUrl);
  }
  
  return signedUrl;
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
    // Using materialLook from item (Partial<WardrobeItem>) instead of material_look
    material_look: item.materialLook,
    seasonality: item.seasonality,
    formality: item.formality,
    // Using warmthLevel from item instead of warmth_level
    warmth_level: item.warmthLevel,
    // Using fitsWithColors from item instead of fits_with_colors
    fits_with_colors: item.fitsWithColors,
    // Using occasionSuitability from item instead of occasion_suitability
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

  return {
    ...item,
    id: data.item_id,
    createdAt: data.created_at
  } as WardrobeItem;
};

export const updateWardrobeItem = async (item: WardrobeItem): Promise<void> => {
  const { error } = await supabase
    .from('wardrobe_items')
    .update({
      name: item.name,
      category: item.category,
      sub_category: item.subCategory,
      primary_color: item.primaryColor,
      secondary_colors: item.secondaryColors,
      pattern: item.pattern,
      // Using materialLook from item (WardrobeItem) instead of material_look
      material_look: item.materialLook,
      seasonality: item.seasonality,
      formality: item.formality,
      // Using warmthLevel from item instead of warmth_level
      warmth_level: item.warmthLevel,
      // Using fitsWithColors from item instead of fits_with_colors
      fits_with_colors: item.fitsWithColors,
      // Using occasionSuitability from item instead of occasion_suitability
      occasion_suitability: item.occasionSuitability,
      tags: item.tags,
      description: item.description,
      price: item.price,
      is_favorite: item.isFavorite
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
  await supabase.storage
    .from('glamorous')
    .remove([filePath]);
};

export const fetchOutfitCache = async (userId: string, wardrobeItems: WardrobeItem[]): Promise<Record<string, CachedOutfit>> => {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('outfit_cache')
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
      cache[row.occasion] = {
        outfit: {
          id: row.outfit_id,
          name: row.outfit_name,
          items: items,
          stylistNotes: row.stylist_notes,
          occasion: row.occasion as Occasion
        },
        visualizedImage: row.visualized_image_url,
        generatedAt: new Date(row.generated_at).getTime(),
        combinationHistory: row.history || [], // Map database 'history' column to combinationHistory
        pastOutfits: [],
        pastImages: [],
        isRecycled: false
      };
    }
  });

  return cache;
};

export const saveOutfitToCache = async (userId: string, occasion: string, cachedOutfit: CachedOutfit): Promise<void> => {
  const { outfit, visualizedImage, combinationHistory, generatedAt } = cachedOutfit;
  
  const wardrobeItemIds = outfit.items.map(i => i.id);

  const signedUrl = visualizedImage ? await uploadWardrobeImage(userId, occasion, visualizedImage) : null;
  
  await supabase
    .from('outfit_cache')
    .delete()
    .eq('user_id', userId)
    .eq('occasion', occasion);

  const { error } = await supabase
    .from('outfit_cache')
    .insert([{
      user_id: userId,
      outfit_id: outfit.id,
      outfit_name: outfit.name,
      wardrobe_item_ids: wardrobeItemIds,
      // Property access is 'stylistNotes' (camelCase) to match Outfit interface
      stylist_notes: outfit.stylistNotes,
      occasion: occasion,
      visualized_image_url: signedUrl,
      generated_at: new Date(generatedAt).toISOString(),
      expires_at: new Date(generatedAt + 24 * 60 * 60 * 1000).toISOString(),
      history: combinationHistory || [] // Persist combinationHistory to 'history' column
    }]);

  if (error) throw error;
};

export const deleteOutfitFromCache = async (userId: string, occasion: string): Promise<void> => {
  const { error } = await supabase
    .from('outfit_cache')
    .delete()
    .eq('user_id', userId)
    .eq('occasion', occasion);

  if (error) throw error;
};

export const deleteAllUserData = async (userId: string): Promise<void> => {
  localStorage.removeItem('glam_last_avatar');
  const { data: items } = await supabase
    .from('wardrobe_items')
    .select('item_id')
    .eq('user_id', userId);

  await supabase.from('user_profile').delete().eq('id', userId);
  await supabase.from('outfit_cache').delete().eq('user_id', userId);
  await supabase.from('wardrobe_items').delete().eq('user_id', userId);

  const paths: string[] = [`${userId}/profile.jpg`, `${userId}/avatar.jpg`];
  if (items && items.length > 0) {
    items.forEach(item => paths.push(`${userId}/${item.item_id}.jpg`));
  }
  
  // Fix: Consolidating 'Beach' and 'Vacation' to match the Occasion type definition 'Beach & Vacation'
  const occasions: Occasion[] = ['Casual', 'Work', 'Date Night', 'Formal', 'Gym', 'Party', 'Wedding Guest', 'Weekend Brunch', 'Beach & Vacation', 'Concert & Festival', 'Job Interview', 'Business Trip', 'Lounge & Home'];
  occasions.forEach(occ => paths.push(`${userId}/${occ}.jpg`));
    
  try {
    await supabase.storage
      .from('glamorous')
      .remove(paths);
  } catch (e) {
    console.warn("Storage cleanup incomplete", e);
  }
};