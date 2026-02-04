
// types.ts

export type Category = 'All Items' | 'Tops' | 'Bottoms' | 'Outerwear' | 'Shoes' | 'Dresses' | 'Accessories' | 'Bags' | 'Caps';

export type Occasion = 
  | 'Casual' 
  | 'Work' 
  | 'Date Night' 
  | 'Formal' 
  | 'Gym' 
  | 'Party' 
  | 'Wedding Guest' 
  | 'Weekend Brunch' 
  | 'Beach & Vacation'
  | 'Concert & Festival' 
  | 'Job Interview' 
  | 'Business Trip' 
  | 'Lounge & Home';

export type ViewType = 'wardrobe' | 'outfits' | 'explore';

export const ORDERED_OCCASIONS: Occasion[] = [
  'Casual', 'Work', 'Date Night', 'Formal', 'Weekend Brunch', 
  'Beach & Vacation', 'Wedding Guest', 'Gym', 'Party', 
  'Concert & Festival', 'Job Interview', 'Business Trip', 'Lounge & Home'
];

export interface WardrobeItem {
  id: string; 
  userId: string;
  name: string;
  category: Category;
  subCategory?: string;
  primaryColor?: string;
  secondaryColors?: string[];
  pattern?: string;
  materialLook?: string;
  seasonality?: string[];
  formality?: string;
  warmthLevel?: string;
  fitsWithColors?: string[];
  occasionSuitability?: string[];
  tags?: string[];
  imageUrl: string;
  description?: string;
  price?: number;
  isFavorite: boolean;
  createdAt: string; 
}

export interface UserProfile {
  id: string;
  username: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  sex: 'male' | 'female' | 'non-binary' | 'other' | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  body_type: string | null;
  skin_tone: string | null;
  preferred_style: string | null;
  favorite_colors: string[] | null;
  shoe_size: number | null;
  measurements: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  is_premium: boolean;
  credits: number;
  total_generations: number;
  trial_started_at: string | null;
  language: string;
  // Daily Usage Tracking
  last_reset_date?: string;
  daily_outfit_count?: number;
  daily_image_count?: number;
}

/**
 * Represents a text-based AI suggestion (Step 1)
 */
export interface OutfitSuggestion {
  id: string; // Database suggestion_id (UUID)
  name: string;
  items: WardrobeItem[];
  stylistNotes: string;
  occasion: Occasion;
  isRejected?: boolean;
}

/**
 * Represents the generic Outfit structure used in UI
 */
export interface Outfit {
  id: string;
  name: string;
  items: WardrobeItem[];
  stylistNotes: string;
  occasion?: Occasion;
  noMoreCombinations?: boolean;
}

/**
 * Represents the Final Visualized Result stored in Cache (Step 2)
 */
export interface CachedOutfit {
  id?: string; // Links to suggestion_id
  outfit: Outfit; 
  visualizedImage: string | null;
  generatedAt: number;
  history?: string[]; 
  combinationHistory?: string[];
  pastOutfits?: Outfit[];
  pastImages?: string[];
}

export interface UploadTask {
  id: string;
  status: 'analyzing' | 'illustrating' | 'saving' | 'complete' | 'error';
  progress: number;
  errorMessage?: string;
  previewUrl?: string;
  totalItemsInBatch?: number;
  processedItemsInBatch?: number;
}

export type OutfitCache = Record<string, CachedOutfit>; // Key is suggestion_id
export type SuggestionCache = Record<string, OutfitSuggestion[]>; // Key is Occasion