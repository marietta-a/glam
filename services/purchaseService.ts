import { Purchases, LOG_LEVEL, PurchasesPackage, CustomerInfo } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

// Replace with actual keys from RevenueCat Dashboard
const REVENUECAT_KEYS = {
  apple: 'appl_placeholder_key',
  google: process.env.REVENUE_CAT_ANDROID_KEY || ''
};

export const initRevenueCat = async (userId: string) => {
  if (!Capacitor.isNativePlatform()) {
    console.warn("RevenueCat: Native platform not detected. Skipping initialization.");
    return;
  }

  try {
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    
    const apiKey = Capacitor.getPlatform() === 'ios' ? REVENUECAT_KEYS.apple : REVENUECAT_KEYS.google;
    
    await Purchases.configure({ 
      apiKey,
      appUserID: userId 
    });

    console.log("RevenueCat: Configured for user", userId);
  } catch (e) {
    console.error("RevenueCat: Configuration failed", e);
  }
};

export const getActiveEntitlements = async (): Promise<string[]> => {
  if (!Capacitor.isNativePlatform()) return [];
  try {
    const result: any = await Purchases.getCustomerInfo();
    const customerInfo = result && result.customerInfo ? result.customerInfo : result;
    return Object.keys(customerInfo.entitlements.active);
  } catch (e) {
    console.error("RevenueCat: Failed to fetch customer info", e);
    return [];
  }
};

export const fetchCurrentOfferings = async () => {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (e) {
    console.error("RevenueCat: Failed to fetch offerings", e);
    return null;
  }
};

export const executePurchase = async (pkg: PurchasesPackage): Promise<CustomerInfo | null> => {
  try {
    const result = await Purchases.purchasePackage({ aPackage: pkg });
    return result.customerInfo;
  } catch (e: any) {
    if (e.userCancelled) {
      console.log("RevenueCat: User cancelled purchase");
      return null;
    }
    throw e;
  }
};

export const restorePurchases = async (): Promise<CustomerInfo | null> => {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const result: any = await Purchases.restorePurchases();
    // SDK may return either a CustomerInfo or an object like { customerInfo: CustomerInfo }
    if (result && result.customerInfo) return result.customerInfo as CustomerInfo;
    return result as CustomerInfo;
  } catch (e) {
    console.error("RevenueCat: Restore failed", e);
    return null;
  }
};