import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import localization safely
let Localization: any = null;
try {
  Localization = require('expo-localization');
} catch (e) {
  console.warn('expo-localization not available');
}

import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import ar from './locales/ar.json';
import bn from './locales/bn.json';

export const LANGUAGE_STORAGE_KEY = '@app_language';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  ar: { translation: ar },
  bn: { translation: bn },
};

// Get device locale as a fallback
const getDeviceLanguage = (): LanguageCode => {
  try {
    const deviceLocale = Localization?.getLocales?.()?.[0]?.languageCode || 'en';
    const supported = SUPPORTED_LANGUAGES.find((l) => l.code === deviceLocale);
    return supported ? supported.code : 'en';
  } catch (e) {
    console.warn('Could not get device locale:', e);
    return 'en';
  }
};

// Initialize i18n
const initI18n = async () => {
  let savedLanguage: string | null = null;
  try {
    savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }

  const lng = savedLanguage || 'en'; // Force English as default if no language is saved

  await i18n.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
  });
};

// Change language and persist choice
export const changeLanguage = async (languageCode: LanguageCode) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
    await i18n.changeLanguage(languageCode);
  } catch (e) {
    console.error('Failed to change language:', e);
  }
};

export const getCurrentLanguage = (): LanguageCode => {
  return (i18n.language || 'en') as LanguageCode;
};

export const isRTL = (): boolean => {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === getCurrentLanguage());
  return !!(lang && 'rtl' in lang && lang.rtl);
};

export { initI18n };
export default i18n;
