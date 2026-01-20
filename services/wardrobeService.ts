
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
  return data;
};

export const updateUserProfile = async (profile: Partial<UserProfile>): Promise<void> => {
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
  localStorage.removeItem('glam_profile_image');
  localStorage.removeItem('glam_outfits_cache');
  localStorage.removeItem('glam_active_view');
  localStorage.removeItem('glam_active_tab');
  // Cast auth to any to handle library type inconsistency
  const { error } = await (supabase.auth as any).signOut();
  if (error) throw error;
};

export const uploadWardrobeImage = async (userId: string, itemId: string, base64Image: string): Promise<string> => {
  const compressedBase64 = await compressImage(base64Image);
  const base64Content = compressedBase64.split(';base64,').pop()!;
  
  // FIX: Refactor fetch logic to avoid 'unknown' type errors for res.blob()
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
  return signedUrl;
};

export const saveWardrobeItem = async (item: Partial<WardrobeItem>): Promise<WardrobeItem> => {
  // Mapping WardrobeItem (camelCase) to DB table columns (snake_case)
  // FIX: Use camelCase property names when accessing the 'item' object (WardrobeItem)
  const dbItem = {
    user_id: item.userId,
    name: item.name,
    category: item.category,
    sub_category: item.subCategory,
    primary_color: item.primaryColor,
    secondary_colors: item.secondaryColors,
    pattern: item.pattern,
    material_look: item.materialLook,
    seasonality: item.seasonality,
    formality: item.formality,
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

  return {
    ...item,
    id: data.item_id,
    createdAt: data.created_at
  } as WardrobeItem;
};

export const updateWardrobeItem = async (item: WardrobeItem): Promise<void> => {
  // Mapping WardrobeItem (camelCase) to DB table columns (snake_case) for update
  // FIX: Use camelCase property names when accessing the 'item' object (WardrobeItem)
  const { error } = await supabase
    .from('wardrobe_items')
    .update({
      name: item.name,
      category: item.category,
      sub_category: item.subCategory,
      primary_color: item.primaryColor,
      secondary_colors: item.secondaryColors,
      pattern: item.pattern,
      material_look: item.materialLook,
      seasonality: item.seasonality,
      formality: item.formality,
      warmth_level: item.warmthLevel,
      fits_with_colors: item.fitsWithColors,
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

/**
 * Fetches all non-expired outfit cache entries for a user.
 */
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
    // Resolve wardrobe items from the current items list
    const items = row.wardrobe_item_ids
      .map((id: string) => wardrobeItems.find(item => item.id === id))
      .filter(Boolean) as WardrobeItem[];

    // Only add to cache if we still have at least some items
    if (items.length > 0) {
      cache[row.occasion] = {
        outfit: {
          id: row.outfit_id,
          name: row.outfit_name,
          items: items,
          stylist_notes: row.stylist_notes,
          occasion: row.occasion as Occasion
        },
        visualizedImage: row.visualized_image_url,
        generatedAt: new Date(row.generated_at).getTime(),
        history: row.history || []
      };
    }
  });

  return cache;
};

/**
 * Saves or updates an outfit cache entry in Supabase.
 */
export const saveOutfitToCache = async (userId: string, occasion: string, cachedOutfit: CachedOutfit): Promise<void> => {
  const { outfit, visualizedImage, history, generatedAt } = cachedOutfit;
  
  const wardrobeItemIds = outfit.items.map(i => i.id);
  
  // Upsert logic: Delete existing for this occasion/user and insert new
  // Note: If you add a unique constraint on (user_id, occasion), you can use .upsert() directly.
  // Here we do a delete then insert to be safe without knowing the exact constraints.
  await supabase
    .from('outfit_cache')
    .delete()
    .eq('user_id', userId)
    .eq('occasion', occasion);

  // FIX: Use camelCase property name 'stylistNotes' when accessing the 'outfit' object
  const { error } = await supabase
    .from('outfit_cache')
    .insert([{
      user_id: userId,
      outfit_id: outfit.id,
      outfit_name: outfit.name,
      wardrobe_item_ids: wardrobeItemIds,
      stylist_notes: (outfit as any).stylistNotes || (outfit as any).stylist_notes,
      occasion: occasion,
      visualized_image_url: visualizedImage,
      generated_at: new Date(generatedAt).toISOString(),
      expires_at: new Date(generatedAt + 24 * 60 * 60 * 1000).toISOString(),
      history: history || []
    }]);

  if (error) throw error;
};

/**
 * COMPREHENSIVE DELETION: Purges user record from auth.users via RPC
 * and removes all associated data across the database and storage.
 */
export const deleteAllUserData = async (userId: string): Promise<void> => {
  // 1. Gather item references for storage cleanup
  const { data: items } = await supabase
    .from('wardrobe_items')
    .select('item_id')
    .eq('user_id', userId);

  // 2. Trigger RPC to delete the Auth account (Requires SECURITY DEFINER function)
  const { error: rpcError } = await supabase.rpc('delete_user_account');
  if (rpcError) {
    console.warn("RPC deletion failed or not found. Falling back to data-only cleanup.", rpcError);
  }

  // 3. Clear data in public schema (Cascade should handle some, but explicit for safety)
  await supabase.from('user_profile').delete().eq('id', userId);

  const { error: dbError } = await supabase
    .from('wardrobe_items')
    .delete()
    .eq('user_id', userId);

  if (dbError) throw dbError;

  // 4. Cleanup cloud storage files
  if (items && items.length > 0) {
    const paths = items.map(item => `${userId}/${item.item_id}.jpg`);
    paths.push(`${userId}/profile.jpg`);
    paths.push(`${userId}/avatar.jpg`);
    
    await supabase.storage
      .from('glamorous')
      .remove(paths);
  }
};
