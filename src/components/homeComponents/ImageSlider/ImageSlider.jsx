'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { getApiHost } from '@/src/utils/apiConfig';
import './ImageSlider.scss';

export default function ImageSlider({
  lang = 'ar',
  banners: propBanners,
  config: propConfig,
  previewMode = false,
}) {
  const isRtl = lang === 'ar';
  const [banners, setBanners] = useState(propBanners || []);
  const [loading, setLoading] = useState(!propBanners);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Configuration defaults
  const config = {
    autoplay: true,
    autoplay_speed: 4000,
    height: 440,
    full_width: true,
    show_arrows: true,
    arrow_style: 'minimal',
    show_dots: true,
    border_radius: 16,
    show_overlay_text: true,
    ...propConfig,
  };

  // Touch Swipe tracking
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // Fallback banners if none found
  const fallbackSlides = [
    {
      id: 'fb-1',
      title_ar: 'عالم الجيمنج ومحطات العمل المتكاملة',
      title_en: 'Ultimate Gaming & Workstations Setup',
      subtitle_ar: 'أحدث التجهيزات التقنية والشاشات وملحقات الصوت الاحترافية',
      subtitle_en: 'High-end tech workspace, premium displays & studio sound gear',
      image_url: '/assets/slider/setup-workspace.png',
      target_url: '/categories/laptops',
      button_text_ar: 'اكتشف العروض',
      button_text_en: 'Explore Offers',
      is_active: true,
    },
    {
      id: 'fb-2',
      title_ar: 'أقوى أجهزة اللابتوب ومستلزماتها',
      title_en: 'High-Performance Laptops',
      subtitle_ar: 'تشكيلة واسعة بخصومات حصرية وتقسيط 0%',
      subtitle_en: 'Top world brands with exclusive discounts & 0% installments',
      image_url: '/assets/slider/laptop-bg.webp',
      target_url: '/categories/laptops',
      button_text_ar: 'تسوق الآن',
      button_text_en: 'Shop Now',
      is_active: true,
    },
  ];

  // Fetch image slider banners if not passed as prop
  useEffect(() => {
    if (propBanners !== undefined && propBanners !== null) {
      setBanners(propBanners.length > 0 ? propBanners : fallbackSlides);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchImageBanners = async () => {
      try {
        const apiHost = getApiHost();
        const res = await fetch(`${apiHost}/api/v1/cms/banners?placement=image_slider`, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0 && isMounted) {
            setBanners(json.data);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Using default image slider banners:', err);
      }

      if (isMounted) {
        setBanners(fallbackSlides);
        setLoading(false);
      }
    };

    fetchImageBanners();
    return () => {
      isMounted = false;
    };
  }, [propBanners]);

  const activeSlides = banners.filter((b) => b.is_active !== false);
  const slidesToRender = activeSlides.length > 0 ? activeSlides : fallbackSlides;
  const totalSlides = slidesToRender.length;

  // Next Slide Handler
  const goToNext = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  // Previous Slide Handler
  const goToPrev = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Autoplay Effect
  useEffect(() => {
    if (!config.autoplay || isPaused || totalSlides <= 1) return;

    const intervalTime = Math.max(2000, Number(config.autoplay_speed) || 4000);
    const timer = setInterval(() => {
      goToNext();
    }, intervalTime);

    return () => clearInterval(timer);
  }, [config.autoplay, config.autoplay_speed, isPaused, totalSlides, goToNext]);

  // Touch Handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Swiped Left
        isRtl ? goToPrev() : goToNext();
      } else {
        // Swiped Right
        isRtl ? goToNext() : goToPrev();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (totalSlides === 0 && !loading) return null;

  const currentSlide = slidesToRender[currentIndex] || slidesToRender[0] || {};
  const title = isRtl ? (currentSlide.title_ar || currentSlide.title_en) : (currentSlide.title_en || currentSlide.title_ar);
  const subtitle = isRtl ? (currentSlide.subtitle_ar || currentSlide.subtitle_en) : (currentSlide.subtitle_en || currentSlide.subtitle_ar);
  const buttonText = isRtl ? (currentSlide.button_text_ar || 'تسوق الآن') : (currentSlide.button_text_en || 'Shop Now');
  const targetUrl = currentSlide.target_url || '';

  const sliderStyle = {
    height: `${Number(config.height) || 440}px`,
    borderRadius: config.full_width ? '0px' : `${Number(config.border_radius) || 16}px`,
  };

  return (
    <section
      className={`image-slider-section ${config.full_width ? 'is-full-width' : 'is-boxed'} ${previewMode ? 'is-preview' : ''}`}
      dir={isRtl ? 'rtl' : 'ltr'}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="image-slider-wrapper" style={sliderStyle}>
        {/* Slides Track */}
        <div className="slides-container">
          {slidesToRender.map((slide, idx) => {
            const isActive = idx === currentIndex;
            const slideImg = slide.image_url || '/assets/slider/setup-workspace.png';

            // Meta framing & positioning settings
            const meta = slide.highlights_json || {};
            const posX = meta.image_position_x !== undefined ? meta.image_position_x : (config.image_position_x ?? 50);
            const posY = meta.image_position_y !== undefined ? meta.image_position_y : (config.image_position_y ?? 50);
            const fit = meta.image_fit || config.image_fit || 'cover';
            const zoom = Number(meta.image_zoom !== undefined ? meta.image_zoom : (config.image_zoom ?? 100));
            const overlayOpacity = meta.overlay_opacity !== undefined ? Number(meta.overlay_opacity) : (config.overlay_opacity !== undefined ? Number(config.overlay_opacity) : 0.35);
            const showBlurBackdrop = meta.blur_backdrop ?? (fit === 'contain');

            const bgSize = fit === 'contain' ? 'contain' : (fit === 'cover' ? (zoom === 100 ? 'cover' : `${zoom}% auto`) : `${zoom}% auto`);
            const bgPosition = `${posX}% ${posY}%`;

            const slideTitle = isRtl ? (slide.title_ar || slide.title_en) : (slide.title_en || slide.title_ar);
            const slideSubtitle = isRtl ? (slide.subtitle_ar || slide.subtitle_en) : (slide.subtitle_en || slide.subtitle_ar);
            const slideButtonText = isRtl ? (slide.button_text_ar || 'تسوق الآن') : (slide.button_text_en || 'Shop Now');
            const slideTargetUrl = slide.target_url || '';

            return (
              <div
                key={slide.id || idx}
                className={`slide-item ${isActive ? 'active' : ''} fit-${fit}`}
                style={
                  fit === 'contain'
                    ? { backgroundColor: '#0b0f19' }
                    : {
                        backgroundImage: `url("${slideImg}")`,
                        backgroundPosition: bgPosition,
                        backgroundSize: bgSize,
                        backgroundRepeat: 'no-repeat',
                      }
                }
              >
                {/* Ambient Blurry Backdrop for Contain Mode */}
                {showBlurBackdrop && (
                  <div
                    className="slide-ambient-blur-backdrop"
                    style={{
                      backgroundImage: `url("${slideImg}")`,
                    }}
                  />
                )}

                {/* Crisp Contain Foreground Layer */}
                {fit === 'contain' && (
                  <div
                    className="slide-crisp-contain-layer"
                    style={{
                      backgroundImage: `url("${slideImg}")`,
                      backgroundPosition: bgPosition,
                      backgroundSize: `${zoom}% auto`,
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                )}

                {/* Clickable Overlay Link if Target URL exists */}
                {slideTargetUrl && !previewMode ? (
                  <Link href={slideTargetUrl} className="slide-click-overlay" aria-label={slideTitle || 'Slide link'} />
                ) : null}

                {/* Elegant Gradient Vignette with dynamic opacity */}
                <div
                  className="slide-gradient-vignette"
                  style={{
                    opacity: overlayOpacity,
                  }}
                />

                {/* Optional Slide Content Banner */}
                {config.show_overlay_text && (slideTitle || slideSubtitle) && (
                  <div className="slide-caption-box">
                    <div className="caption-glass-pill">
                      {slideTitle && <h2 className="caption-title">{slideTitle}</h2>}
                      {slideSubtitle && <p className="caption-subtitle">{slideSubtitle}</p>}

                      {slideTargetUrl && (
                        <div className="caption-action-row">
                          {previewMode ? (
                            <span className="caption-cta-btn">{slideButtonText}</span>
                          ) : (
                            <Link href={slideTargetUrl} className="caption-cta-btn">
                              <span>{slideButtonText}</span>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points={isRtl ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
                              </svg>
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Navigation Arrows */}
        {config.show_arrows && totalSlides > 1 && (
          <>
            <button
              type="button"
              className={`slider-nav-btn prev-btn ${config.arrow_style === 'minimal' ? 'is-minimal' : ''}`}
              onClick={goToPrev}
              aria-label={isRtl ? 'الشريحة السابقة' : 'Previous Slide'}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points={isRtl ? '9 18 15 12 9 6' : '15 18 9 12 15 6'} />
              </svg>
            </button>

            <button
              type="button"
              className={`slider-nav-btn next-btn ${config.arrow_style === 'minimal' ? 'is-minimal' : ''}`}
              onClick={goToNext}
              aria-label={isRtl ? 'الشريحة التالية' : 'Next Slide'}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points={isRtl ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
              </svg>
            </button>
          </>
        )}

        {/* Pagination Dots */}
        {config.show_dots && totalSlides > 1 && (
          <div className="slider-dots-container">
            {slidesToRender.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`slider-dot ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
