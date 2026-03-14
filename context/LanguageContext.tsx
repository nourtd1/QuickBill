import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '../translations/en.json';
import fr from '../translations/fr.json';
import rw from '../translations/rw.json';
import ar from '../translations/ar.json';
import sw from '../translations/sw.json';

import { I18nManager, Alert } from 'react-native';

type Language = 'en-US' | 'fr-FR' | 'rw-RW' | 'ar-SA' | 'sw-KE';

const translations: Record<Language, any> = {
  'en-US': en,
  'fr-FR': fr,
  'rw-RW': rw,
  'ar-SA': ar,
  'sw-KE': sw,
};

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, options?: Record<string, string | number> & { defaultValue?: string }) => string;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en-US',
  setLanguage: async () => {},
  t: (key: string) => key,
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('fr-FR');

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLang = await AsyncStorage.getItem('user_language');
        if (savedLang && translations[savedLang as Language]) {
          setLanguageState(savedLang as Language);
        }
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = async (newLang: Language) => {
    try {
      const isRTL = newLang === 'ar-SA';
      const wasRTL = I18nManager.isRTL;

      await AsyncStorage.setItem('user_language', newLang);
      setLanguageState(newLang);

      if (isRTL !== wasRTL) {
          I18nManager.allowRTL(isRTL);
          I18nManager.forceRTL(isRTL);
          
          Alert.alert(
              newLang === 'ar-SA' ? 'تغيير اللغة' : 'Changement de langue',
              newLang === 'ar-SA' 
                ? 'يحتاج التطبيق لإعادة التشغيل لتطبيق تغييرات اللغة العربية.' 
                : 'L\'application doit redémarrer pour appliquer les changements de langue.',
              [{ text: 'OK' }]
          );
      }
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = (key: string, options?: Record<string, string | number> & { defaultValue?: string }) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        return options?.defaultValue || key;
      }
    }

    if (typeof value !== 'string') return options?.defaultValue || key;

    if (options) {
      Object.entries(options).forEach(([vKey, vValue]) => {
        if (vKey !== 'defaultValue') {
          value = (value as string).replace(`{{${vKey}}}`, String(vValue));
        }
      });
    }

    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
