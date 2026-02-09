
import { Calendar, Crown, Sparkles, Zap } from 'lucide-react';
import { WardrobeItem, Category, SubscriptionPack } from './types';
import { SUBSCRIPTION_PACK_ID } from './enum';

export const CATEGORIES: Category[] = ['All Items', 'Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Dresses', 'Bags', 'Caps', 'Accessories'];

export const INITIAL_ITEMS: WardrobeItem[] = [];

export const SUBSCRIPTION_PACK: SubscriptionPack[] = [
    {
        id: SUBSCRIPTION_PACK_ID.YEARLY, 
        name: 'Yearly Membership', 
        abr: 'yearly',
        sortOrder: 0,
        price: 549.99, 
        credits: 120000, 
        description: 'Remove Daily Limits + No Ads',
        icon: <Crown className="w-5 h-5" />,
        highlight: true,
        tag: 'Best Value'
    },
    {
      id: SUBSCRIPTION_PACK_ID.MONTHLY, 
      name: 'Monthly Elite', 
      abr: 'monthly',
      sortOrder: 1,
      price: 49.99, 
      credits: 10000, 
      description: 'Remove Daily Limits + No Ads',
      icon: <Calendar className="w-5 h-5" />,
      highlight: false
    },
    { 
        id: SUBSCRIPTION_PACK_ID.GROWTH, 
        name: 'Growth Pack', 
        abr: 'growth',
        sortOrder: 2,
        price: 10.99, 
        credits: 1000, 
        description: 'Refill Credits',
        icon: <Sparkles className="w-5 h-5" />
    },
    { 
        id: SUBSCRIPTION_PACK_ID.STARTER, 
        name: 'Starter Pack', 
        abr: 'starter',
        sortOrder: 3,
        price: 2.99, 
        credits: 200, 
        description: 'Refill Credits',
        icon: <Zap className="w-5 h-5" />
    }

];

// Store URLs for fallback
export const STORE_URLS = {
  android: 'https://play.google.com/store/apps/details?id=com.glamai',
  ios: 'itms-apps://itunes.apple.com/app/id123456789'
};