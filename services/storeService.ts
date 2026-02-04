// store.ts
import { WardrobeItem, OutfitCache, UserProfile, SuggestionCache } from '../types';

/**
 * Global Boutique Store
 * Acts as a static-like singleton for application data.
 */
class BoutiqueStore {
  private static instance: BoutiqueStore;
  
  public items: WardrobeItem[] = [];
  
  // Stores the FINAL visualized result for each occasion
  public outfitCache: OutfitCache = {};

  public avatarUpdated: boolean = false;
  
  // Stores the list of text suggestions for each occasion
  public suggestionCache: SuggestionCache = {};
  
  public profile: UserProfile | null = null;
  public isHydrated: boolean = false;

  private constructor() {}

  public static getInstance(): BoutiqueStore {
    if (!BoutiqueStore.instance) {
      BoutiqueStore.instance = new BoutiqueStore();
    }
    return BoutiqueStore.instance;
  }

  public setHydrated(val: boolean) {
    this.isHydrated = val;
  }

  public updateItems(newItems: WardrobeItem[]) {
    this.items = newItems;
  }

  public updateCache(newCache: OutfitCache) {
    this.outfitCache = newCache;
  }

  public updateSuggestions(newSuggestions: SuggestionCache) {
    this.suggestionCache = newSuggestions;
  }

  public updateProfile(newProfile: UserProfile | null) {
    this.profile = newProfile;
  }

  public clear() {
    this.items = [];
    this.outfitCache = {};
    this.suggestionCache = {};
    this.profile = null;
    this.isHydrated = false;
  }
}

export const store = BoutiqueStore.getInstance();