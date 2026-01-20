export type Category = 'All Items' | 'Tops' | 'Bottoms' | 'Outerwear' | 'Shoes' | 'Dresses' | 'Accessories';

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
  trial_started_at: string | null;
  language: string;
}

export interface Outfit {
  id: string;
  name: string;
  items: WardrobeItem[];
  stylistNotes: string;
  occasion?: Occasion;
}

export interface CachedOutfit {
  outfit: Outfit;
  visualizedImage: string | null;
  generatedAt: number;
  history?: string[]; 
}

export interface UploadTask {
  id: string;
  status: 'analyzing' | 'illustrating' | 'saving' | 'complete' | 'error';
  progress: number;
  totalItemsInBatch?: number;
  processedItemsInBatch?: number;
  errorMessage?: string;
  previewUrl?: string;
}

export type OutfitCache = Record<string, CachedOutfit>;

export type ViewType = 'wardrobe' | 'outfits' | 'explore';