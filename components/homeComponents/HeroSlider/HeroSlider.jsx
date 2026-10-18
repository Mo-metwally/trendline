'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getApiHost } from '@/src/utils/apiConfig';
import './HeroSlider.scss';

// Helper to map broken mock URLs to local assets
const resolveBannerImage = (url, id) => {
  if (!url) return null;
  if (url.includes('images.trendlineeg.com')) {
    if (url.includes('laptop')) return '/assets/slider/laptop-bg.webp';
    if (url.includes('vacuum')) return '/assets/slider/vacuum-bg.webp';
    if (url.includes('cctv')) return '/assets/slider/cctv-bg.webp';
    if (url.includes('nbe')) return '/assets/slider/card-bank.png';
  }
  return url;
};

export default function HeroSlider({ lang = 'ar' }) {
  const isRtl = lang === 'ar';
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollContainerRef = useRef(null);

  // Fallback high-fidelity banners matching reference screenshot
  const fallbackBanners = [
    {
      id: 1,
      title_ar: 'سجل الآن واحصل علي مزايا حصرية',
      title_en: 'Register Now & Get Exclusive Perks',
      subtitle_ar: 'تخفيضات • عروض • نقاط • أسرع',
      subtitle_en: 'Discounts • Offers • Points • Faster',
      bg_style: 'card-primary-cta',
      button_text_ar: 'تسوق الآن',
      button_text_en: 'Shop Now',
      target_url: '/register',
      highlights_json: [
        { icon: 'truck', text: 'شحن مجاني للطلبات' },
        { icon: 'percent', text: 'خصومات مميزة' },
        { icon: 'shield', text: 'دفع آمن عند الاستلام' },
        { icon: 'repeat', text: 'إرجاع مجاني خلال 14 يوم' },
      ],
    },
    {
      id: 2,
      title_ar: 'أجهزة لابتوب وإكسسواراتها',
      title_en: 'Laptops & Accessories',
      subtitle_ar: 'أداء أعلى.. لكل احتياجاتك',
      subtitle_en: 'Top Performance for Every Need',
      badge_text_ar: 'موديلات حديثة',
      badge_text_en: 'Latest Tech',
      bg_style: 'card-white-glass',
      button_text_ar: 'تسوق الآن',
      button_text_en: 'Shop Now',
      target_url: '/categories/accessories',
      image_url: '/assets/slider/laptop-bg.webp',
    },
    {
      id: 3,
      title_ar: 'وفر أكثر مع البنك الأهلي',
      title_en: 'Save More with NBE Bank',
      subtitle_ar: 'خصم حتى 10% عند الدفع ببطاقات البنك الأهلي',
      subtitle_en: 'Up to 10% Off with National Bank of Egypt',
      badge_text_ar: '10% OFF',
      badge_text_en: '10% OFF',
      bg_style: 'card-bank-promo',
      button_text_ar: 'تسوق الآن',
      button_text_en: 'Shop Now',
      target_url: '/deals',
    },
    {
      id: 4,
      title_ar: 'عروض محدودة الوقت',
      title_en: 'Limited-Time Tech Deals',
      subtitle_ar: 'خصم 1,000 جنية على المكانس الكهربائية',
      subtitle_en: 'EGP 1,000 Off on Vacuum Cleaners',
      badge_text_ar: 'لفترة محدودة',
      badge_text_en: 'Limited Offer',
      bg_style: 'card-white-glass',
      button_text_ar: 'تسوق الآن',
      button_text_en: 'Shop Now',
      target_url: '/deals',
      image_url: '/assets/slider/vacuum-bg.webp',
    },
    {
      id: 5,
      title_ar: 'أنظمة المراقبة الذكية',
      title_en: 'Smart Security Surveillance',
      subtitle_ar: 'حماية متكاملة لمنزلك ومكتبك بأعلى دقة 4K',
      subtitle_en: 'Protect Your Home & Workspace with 4K',
      badge_text_ar: 'أمان كامل',
      badge_text_en: 'Full Security',
      bg_style: 'card-white-glass',
      button_text_ar: 'تسوق الآن',
      button_text_en: 'Shop Now',
      target_url: '/categories/surveillance',
      image_url: '/assets/slider/cctv-bg.webp',
    },
  ];

  // Fetch banners from API
  useEffect(() => {
    let isMounted = true;
    const fetchBanners = async () => {
      try {
        const apiHost = getApiHost();
        const res = await fetch(`${apiHost}/api/v1/cms/banners`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0 && isMounted) {
            const processed = json.data.map((b) => ({
              ...b,
              image_url: resolveBannerImage(b.image_url, b.id),
            }));
            setBanners(processed);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Using fallback hero banners:', err);
      }

      if (isMounted) {
        setBanners(fallbackBanners);
        setLoading(false);
      }
    };

    fetchBanners();
    return () => {
      isMounted = false;
    };
  }, []);

  // Scroll tracking to update dots
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) return;
    const scrollPos = Math.abs(scrollLeft);
    const step = 315;
    const activeIndex = Math.min(
      banners.length - 1,
      Math.max(0, Math.round(scrollPos / step))
    );
    setActiveSlide(activeIndex);
  };

  // Scroll controls
  const handleScrollPrev = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = 315;
      scrollContainerRef.current.scrollBy({
        left: isRtl ? scrollAmount : -scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleScrollNext = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = 315;
      scrollContainerRef.current.scrollBy({
        left: isRtl ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleDotClick = (idx) => {
    setActiveSlide(idx);
    if (scrollContainerRef.current) {
      const targetPos = idx * 315;
      scrollContainerRef.current.scrollTo({
        left: isRtl ? -targetPos : targetPos,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="hero-slider-section" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="hero-container">
        {/* Carousel Navigation Arrow Prev */}
        <button
          type="button"
          className="slider-nav-arrow arrow-prev"
          onClick={handleScrollPrev}
          aria-label={isRtl ? 'السابق' : 'Previous Slide'}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <polyline points={isRtl ? '9 18 15 12 9 6' : '15 18 9 12 15 6'}></polyline>
          </svg>
        </button>

        {/* Carousel Navigation Arrow Next */}
        <button
          type="button"
          className="slider-nav-arrow arrow-next"
          onClick={handleScrollNext}
          aria-label={isRtl ? 'التالي' : 'Next Slide'}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <polyline points={isRtl ? '15 18 9 12 15 6' : '9 18 15 12 9 6'}></polyline>
          </svg>
        </button>

        {/* Horizontal Card Track */}
        <div
          className="hero-cards-wrapper"
          ref={scrollContainerRef}
          onScroll={handleScroll}
        >
          {banners.map((banner, index) => {
            const title = isRtl
              ? banner.title_ar || banner.title
              : banner.title_en || banner.title;
            const subtitle = isRtl
              ? banner.subtitle_ar || banner.subtitle
              : banner.subtitle_en || banner.subtitle;
            const buttonText = isRtl
              ? banner.button_text_ar || banner.button_text || 'تسوق الآن'
              : banner.button_text_en || banner.button_text || 'Shop Now';
            const targetUrl = banner.target_url || '/products';
            const badge = isRtl
              ? banner.badge_text_ar || banner.badge_text
              : banner.badge_text_en || banner.badge_text;
            const resolvedImg = resolveBannerImage(banner.image_url, banner.id);

            // Card Style 1: Blue CTA (Primary Membership Card)
            if (banner.bg_style === 'card-primary-cta') {
              return (
                <div key={banner.id || index} className="hero-banner-card card-primary-cta">
                  <div className="card-top-content">
                    <h2 className="card-title">{title}</h2>
                    {subtitle && <p className="card-subtitle">{subtitle}</p>}
                  </div>

                  <div className="benefits-grid">
                    <div className="benefit-item">
                      <div className="benefit-icon-circle">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="1" y="3" width="15" height="13" rx="1.5"></rect>
                          <polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon>
                          <circle cx="5.5" cy="18.5" r="2.5"></circle>
                          <circle cx="18.5" cy="18.5" r="2.5"></circle>
                        </svg>
                      </div>
                      <span className="benefit-text">{isRtl ? 'شحن مجاني للطلبات' : 'Free Shipping'}</span>
                    </div>

                    <div className="benefit-item">
                      <div className="benefit-icon-circle">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="19" y1="5" x2="5" y2="19"></line>
                          <circle cx="6.5" cy="6.5" r="2.5"></circle>
                          <circle cx="17.5" cy="17.5" r="2.5"></circle>
                        </svg>
                      </div>
                      <span className="benefit-text">{isRtl ? 'خصومات مميزة' : 'Special Deals'}</span>
                    </div>

                    <div className="benefit-item">
                      <div className="benefit-icon-circle">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                      </div>
                      <span className="benefit-text">{isRtl ? 'دفع آمن عند الاستلام' : 'Safe Payment'}</span>
                    </div>

                    <div className="benefit-item">
                      <div className="benefit-icon-circle">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="1 4 1 10 7 10"></polyline>
                          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                        </svg>
                      </div>
                      <span className="benefit-text">{isRtl ? 'إرجاع مجاني خلال 14 يوم' : '14-Day Free Returns'}</span>
                    </div>
                  </div>

                  <div className="card-bottom-content">
                    <Link href={targetUrl} className="cta-button glass-pill">
                      <span>{buttonText}</span>
                      <span className="arrow-sym">{isRtl ? '←' : '→'}</span>
                    </Link>
                  </div>
                </div>
              );
            }

            // Card Style 2: Bank Al-Ahly Card Promo
            if (banner.bg_style === 'card-bank-promo') {
              return (
                <div key={banner.id || index} className="hero-banner-card card-bank-promo">
                  <div className="card-top-content">
                    <h2 className="card-title">{title}</h2>
                    {subtitle && <p className="card-subtitle">{subtitle}</p>}
                  </div>

                  <div className="bank-card-stage">
                    {/* 3D Bank Cards Art */}
                    <div className="bank-card-3d card-gold-ahly">
                      <div className="card-chip"></div>
                      <div className="card-logo-badge">NBE</div>
                      <div className="card-dots-num">•••• •••• •••• 9284</div>
                    </div>
                    <div className="bank-card-3d card-platinum-ahly"></div>
                  </div>

                  <div className="bank-badge-footer">
                    <div className="discount-block">
                      <span className="discount-pct">{badge || '10%'}</span>
                      <span className="discount-label">{isRtl ? 'خصم حتى' : 'Up to'}</span>
                    </div>

                    <div className="bank-official-identity">
                      <div className="bank-symbol-circle"></div>
                      <div className="bank-names-wrap">
                        <span className="bank-ar">{isRtl ? 'البنك الأهلي المصري' : 'National Bank of Egypt'}</span>
                        <span className="bank-en">NATIONAL BANK OF EGYPT</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Card Style 3: Edge-to-Edge Image Cards & Custom Finishes
            const isCustomStyle = banner.bg_style?.startsWith('custom:');
            let customInlineStyle = {};
            let cardCustomClass = 'card-white-glass';
            let textColor = null;

            if (isCustomStyle) {
              try {
                const parsed = JSON.parse(banner.bg_style.replace('custom:', ''));
                if (parsed.bgType === 'gradient') {
                  customInlineStyle.background = `linear-gradient(${parsed.gradientAngle || 135}deg, ${parsed.color1 || '#0057C2'} 0%, ${parsed.color2 || '#0f172a'} 100%)`;
                  textColor = parsed.textColor || '#ffffff';
                } else if (parsed.bgType === 'solid') {
                  customInlineStyle.background = parsed.color1 || '#ffffff';
                  textColor = parsed.textColor || '#0f172a';
                } else if (parsed.bgType === 'preset') {
                  cardCustomClass = parsed.preset || 'card-white-glass';
                }
                if (parsed.finish === 'glossy') {
                  cardCustomClass += ' card-finish-glossy';
                } else if (parsed.finish === 'matt') {
                  cardCustomClass += ' card-finish-matt';
                }
                if (parsed.textColor) {
                  textColor = parsed.textColor;
                }
              } catch (e) {
                console.warn('Failed to parse banner custom style', e);
              }
            } else if (banner.bg_style && banner.bg_style !== 'card-white-glass') {
              cardCustomClass = banner.bg_style;
            }

            const hasImage = Boolean(resolvedImg);
            const isDarkText = textColor === '#0f172a' || (!textColor && !customInlineStyle.background);

            return (
              <div
                key={banner.id || index}
                className={`hero-banner-card ${cardCustomClass} ${hasImage ? 'has-full-bg' : ''}`}
                style={customInlineStyle}
              >
                {/* 100% Edge-to-Edge Full Background Image */}
                {hasImage && (
                  <div className="card-full-bg-wrap">
                    <img
                      src={resolvedImg}
                      alt={title}
                      className="card-full-bg-img"
                      loading="lazy"
                      onError={(e) => {
                        if (resolvedImg.includes('laptop-bg.webp')) {
                          e.currentTarget.src = '/assets/slider/card-laptop.png';
                        } else if (resolvedImg.includes('vacuum-bg.webp')) {
                          e.currentTarget.src = '/assets/slider/card-vacuum.png';
                        } else if (resolvedImg.includes('cctv-bg.webp')) {
                          e.currentTarget.src = '/assets/slider/card-laptop.png';
                        }
                      }}
                    />
                    <div
                      className={`card-full-bg-overlay ${
                        isDarkText ? 'overlay-light' : 'overlay-dark'
                      }`}
                    />
                  </div>
                )}

                {/* Top Content: Badge, Title, Subtitle */}
                <div className="card-top-content">
                  {badge && (
                    <div className="card-top-badge">
                      <span>{badge}</span>
                    </div>
                  )}

                  <h2
                    className="card-title"
                    style={textColor ? { color: textColor } : {}}
                  >
                    {title}
                  </h2>

                  {subtitle && (
                    <p
                      className="card-subtitle"
                      style={textColor ? { color: textColor, opacity: 0.9 } : {}}
                    >
                      {subtitle}
                    </p>
                  )}
                </div>

                {/* Center visual spacer for full background */}
                <div className="card-center-spacer" />

                {/* Bottom CTA Button */}
                <div className="card-bottom-content">
                  <Link href={targetUrl} className="cta-button primary-pill">
                    <span>{buttonText}</span>
                    <span className="arrow-sym">{isRtl ? '←' : '→'}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel Pagination Dots */}
        <div className="slider-dots">
          {banners.map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={`dot ${activeSlide === idx ? 'active' : ''}`}
              onClick={() => handleDotClick(idx)}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
