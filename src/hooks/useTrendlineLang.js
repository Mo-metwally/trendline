'use client';

import { useState, useEffect, useCallback } from 'react';

export function getInitialLang() {
  if (typeof window === 'undefined') return 'ar';

  // 1. Check URL Query param first for fastest response
  try {
    const params = new URLSearchParams(window.location.search);
    const qLang = params.get('lang');
    if (qLang === 'ar' || qLang === 'en') return qLang;
  } catch (e) {}

  // 2. Check localStorage
  try {
    const local = localStorage.getItem('trendline_lang');
    if (local === 'ar' || local === 'en') return local;
  } catch (e) {}

  // 3. Check Cookie
  try {
    const match = document.cookie.match(/trendline_lang=(ar|en)/);
    if (match && match[1]) return match[1];
  } catch (e) {}

  return 'ar';
}

export function setAppLang(newLang) {
  if (typeof window === 'undefined') return;
  const target = newLang === 'en' ? 'en' : 'ar';

  // 1. Save to localStorage
  try {
    localStorage.setItem('trendline_lang', target);
  } catch (e) {}

  // 2. Save to cookie
  try {
    document.cookie = `trendline_lang=${target}; path=/; max-age=31536000`;
  } catch (e) {}

  // 3. Update URL query param ?lang= without full reload for instant fast response
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('lang', target);
    window.history.replaceState({}, '', url.toString());
  } catch (e) {}

  // 4. Dispatch event for all listening components
  window.dispatchEvent(new CustomEvent('trendline_lang_changed', { detail: target }));
}

export function useTrendlineLang(defaultLang = 'ar') {
  // Always initialize with defaultLang (stable on server and initial client hydration to prevent hydration mismatch)
  const [lang, setLangState] = useState(defaultLang);
  const [mounted, setMounted] = useState(false);

  const isRtl = lang === 'ar';

  // Sync with URL query or storage immediately after initial hydration mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setMounted(true);

    const clientLang = getInitialLang();
    if (clientLang && (clientLang === 'ar' || clientLang === 'en')) {
      setLangState(clientLang);
    }

    const checkUrlOrStorage = () => {
      const current = getInitialLang();
      if (current && (current === 'ar' || current === 'en')) {
        setLangState(current);
      }
    };

    const handleEvent = (e) => {
      const next = e?.detail || getInitialLang() || 'ar';
      if (next === 'ar' || next === 'en') {
        setLangState(next);
      }
    };

    window.addEventListener('popstate', checkUrlOrStorage);
    window.addEventListener('trendline_lang_changed', handleEvent);
    window.addEventListener('storage', handleEvent);

    return () => {
      window.removeEventListener('popstate', checkUrlOrStorage);
      window.removeEventListener('trendline_lang_changed', handleEvent);
      window.removeEventListener('storage', handleEvent);
    };
  }, []);

  const toggleLang = useCallback(() => {
    const next = lang === 'ar' ? 'en' : 'ar';
    setLangState(next);
    setAppLang(next);
  }, [lang]);

  const setLang = useCallback((next) => {
    const target = next === 'en' ? 'en' : 'ar';
    setLangState(target);
    setAppLang(target);
  }, []);

  return { lang, isRtl, toggleLang, setLang, mounted };
}

export default useTrendlineLang;
