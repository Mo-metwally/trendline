'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

export function getInitialLang() {
  if (typeof window === 'undefined') return 'ar';

  // 1. Check URL Query param first for fastest response
  try {
    const params = new URLSearchParams(window.location.search);
    const qLang = params.get('lang');
    if (qLang === 'ar' || qLang === 'en') return qLang;
  } catch (e) {}

  // 2. Check Cookie
  try {
    const match = document.cookie.match(/trendline_lang=(ar|en)/);
    if (match && match[1]) return match[1];
  } catch (e) {}

  // 3. Check localStorage
  try {
    const local = localStorage.getItem('trendline_lang');
    if (local === 'ar' || local === 'en') return local;
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

  // 2. Save to cookie with 1 year max-age & SameSite=Lax
  try {
    document.cookie = `trendline_lang=${target}; path=/; max-age=31536000; SameSite=Lax`;
  } catch (e) {}

  // 3. Update HTML root dir and lang attributes immediately
  try {
    document.documentElement.lang = target;
    document.documentElement.dir = target === 'ar' ? 'rtl' : 'ltr';
  } catch (e) {}

  // 4. Update URL query param ?lang= without full reload
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('lang', target);
    window.history.replaceState({}, '', url.toString());
  } catch (e) {}

  // 5. Dispatch event for all listening components
  window.dispatchEvent(new CustomEvent('trendline_lang_changed', { detail: target }));
}

/**
 * Helper to preserve the active language across all internal site links
 */
export function formatLangHref(href, currentLang) {
  if (!href || typeof href !== 'string') return href;
  if (
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('#')
  ) {
    return href;
  }
  const target = currentLang === 'en' ? 'en' : 'ar';
  if (href.includes(`lang=${target}`)) return href;
  const [pathAndQuery, hash] = href.split('#');
  // Remove any conflicting lang param first
  const cleanPath = pathAndQuery.replace(/([?&])lang=(ar|en)(&|$)/, '$1').replace(/[?&]$/, '');
  const separator = cleanPath.includes('?') ? '&' : '?';
  const newPath = `${cleanPath}${separator}lang=${target}`;
  return hash ? `${newPath}#${hash}` : newPath;
}

export function useTrendlineLang(defaultLang = 'ar') {
  // Read searchParams directly from Next.js router (available during SSR & initial client hydration)
  const searchParams = useSearchParams();
  const queryLang = searchParams?.get('lang');

  // Determine initial language from URL query first for zero-flash consistency
  const initialLang =
    queryLang === 'en' || queryLang === 'ar'
      ? queryLang
      : defaultLang;

  const [lang, setLangState] = useState(initialLang);
  const [mounted, setMounted] = useState(false);

  // Synchronize when the URL query param changes via router navigation
  useEffect(() => {
    if (queryLang === 'en' || queryLang === 'ar') {
      if (queryLang !== lang) {
        setLangState(queryLang);
        try {
          document.documentElement.lang = queryLang;
          document.documentElement.dir = queryLang === 'ar' ? 'rtl' : 'ltr';
        } catch (e) {}
      }
    }
  }, [queryLang]);

  // Client-side initialization: runs ONCE on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setMounted(true);

    try {
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get('lang');
      if (urlLang === 'ar' || urlLang === 'en') {
        if (urlLang !== lang) {
          setLangState(urlLang);
        }
      } else {
        // If URL has no ?lang= query, silently append it via replaceState without triggering network reload
        const stored = getInitialLang();
        const url = new URL(window.location.href);
        url.searchParams.set('lang', stored);
        window.history.replaceState({}, '', url.toString());
        if (stored !== lang) {
          setLangState(stored);
        }
      }
    } catch (e) {}

    const handleEvent = (e) => {
      const next = e?.detail;
      if (next === 'ar' || next === 'en') {
        setLangState(next);
      }
    };

    window.addEventListener('trendline_lang_changed', handleEvent);
    return () => {
      window.removeEventListener('trendline_lang_changed', handleEvent);
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

  const isRtl = lang === 'ar';

  return {
    lang,
    isRtl,
    toggleLang,
    setLang,
    mounted,
    formatLangHref: (href) => formatLangHref(href, lang),
  };
}

export default useTrendlineLang;
