'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/src/components/common/Navbar/Navbar';
import HeroSlider from '@/src/components/homeComponents/HeroSlider/HeroSlider';
import ImageSlider from '@/src/components/homeComponents/ImageSlider/ImageSlider';
import CategoryGrid from '@/src/components/homeComponents/CategoryGrid/CategoryGrid';
import ProductSlider from '@/src/components/homeComponents/ProductSlider/ProductSlider';
import ServicesSlider from '@/src/components/homeComponents/ServicesSlider/ServicesSlider';
import Footer from '@/src/components/common/Footer/Footer';
import { useTrendlineLang } from '@/src/hooks/useTrendlineLang';
import { getApiHost } from '@/src/utils/apiConfig';
import './Home.scss';

function HomeContent() {
  const { lang, isRtl, setLang, formatLangHref } = useTrendlineLang();

  const [sliderSettings, setSliderSettings] = useState({
    mode: 'both', // 'both' | 'store_only' | 'image_only' | 'none'
    order: 'image_first', // 'image_first' | 'store_first'
    imageConfig: {
      autoplay: true,
      autoplay_speed: 4000,
      height: 440,
      full_width: true,
      show_arrows: true,
      arrow_style: 'minimal',
      show_dots: true,
      border_radius: 16,
      show_overlay_text: true,
    },
  });

  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const apiHost = getApiHost();
        const res = await fetch(`${apiHost}/api/v1/cms/settings`, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && isMounted) {
            let imgConfig = {
              autoplay: true,
              autoplay_speed: 4000,
              height: 440,
              full_width: true,
              show_arrows: true,
              arrow_style: 'minimal',
              show_dots: true,
              border_radius: 16,
              show_overlay_text: true,
            };

            if (json.data.image_slider_config) {
              try {
                imgConfig = { ...imgConfig, ...JSON.parse(json.data.image_slider_config) };
              } catch (e) {
                console.warn('Failed to parse image_slider_config:', e);
              }
            }

            setSliderSettings({
              mode: json.data.slider_display_mode || 'both',
              order: json.data.slider_order || 'image_first',
              imageConfig: imgConfig,
            });
          }
        }
      } catch (err) {
        console.warn('Could not load site slider settings:', err);
      }
    };

    fetchSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="home-page-container" dir={isRtl ? 'rtl' : 'ltr'} suppressHydrationWarning>
      {/* 1. Glassmorphic Storefront Navbar */}
      <Navbar lang={lang} onToggleLang={setLang} />

      {/* Main Content Flow */}
      <main className="main-home-flow">
        {/* Dynamic Sliders Section */}
        {sliderSettings.mode !== 'none' && (
          <div className="home-sliders-stack">
            {sliderSettings.mode === 'both' ? (
              sliderSettings.order === 'image_first' ? (
                <>
                  <ImageSlider lang={lang} config={sliderSettings.imageConfig} />
                  <HeroSlider lang={lang} />
                </>
              ) : (
                <>
                  <HeroSlider lang={lang} />
                  <ImageSlider lang={lang} config={sliderSettings.imageConfig} />
                </>
              )
            ) : sliderSettings.mode === 'image_only' ? (
              <ImageSlider lang={lang} config={sliderSettings.imageConfig} />
            ) : (
              <HeroSlider lang={lang} />
            )}
          </div>
        )}

        {/* Section 2: Shop by Category (with 4 Latest Products per Category) */}
        <CategoryGrid lang={lang} />

        {/* Section 3: Hot Deals & Discounts Carousel (with smart fallback to recommendations / random) */}
        <ProductSlider type="deals" lang={lang} />

        {/* Section 4: New Arrivals Carousel (with smart fallback to recommendations / random) */}
        <ProductSlider type="new" lang={lang} />

        {/* Section 5: Services Slider (سلايدر الخدمات الهندسية والتقنية فوق سكشن الكونتاكت) */}
        <ServicesSlider lang={lang} />
      </main>

      {/* Advanced Liquid Glass Contact & Storefront Footer */}
      <Footer lang={lang} showContactTrust={true} />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc',
            fontFamily: 'Cairo, sans-serif',
            fontWeight: 800,
            color: '#1d4ed8',
          }}
        >
          Trendline Systems...
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
