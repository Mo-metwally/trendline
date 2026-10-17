'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import './HeroSlider.scss';

export default function HeroSlider({ lang = 'ar' }) {
  const isRtl = lang === 'ar';
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollContainerRef = useRef(null);

  // Fetch banners from API
  useEffect(() => {
    let isMounted = true;
    const fetchBanners = async () => {
      try {
        const apiHost = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
          ? `http://${window.location.hostname}:5000`
          : 'http://localhost:5000';

        const res = await fetch(`${apiHost}/api/v1/cms/banners`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0 && isMounted) {
            setBanners(json.data);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Using fallback hero banners:', err);
      }

      // High-Fidelity Fallback matching screenshot if offline
      if (isMounted) {
        setBanners([
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
            subtitle_ar: 'أداء أعلى... لكل احتياجاتك',
            subtitle_en: 'Top Performance for Every Need',
            bg_style: 'card-white-glass',
            button_text_ar: 'تسوق الآن',
            button_text_en: 'Shop Now',
            target_url: '/categories/accessories',
            image_url: 'https://images.trendlineeg.com/products/laptop-hero.png',
          },
          {
            id: 3,
            title_ar: 'وفر أكتر مع البنك الأهلي',
            title_en: 'Save More with NBE Bank',
            subtitle_ar: 'خصم حتى 10% عند الدفع ببطاقات البنك الأهلي',
            subtitle_en: 'Up to 10% Off with National Bank of Egypt',
            bg_style: 'card-bank-promo',
            button_text_ar: 'تسوق الآن',
            button_text_en: 'Shop Now',
            target_url: '/deals',
            badge_text_ar: '10% OFF',
          },
          {
            id: 4,
            title_ar: 'عروض محدودة الوقت',
            title_en: 'Limited-Time Tech Deals',
            subtitle_ar: 'خصم 1,000 جنية على الأجهزة والمعدات',
            subtitle_en: 'EGP 1,000 Off on Cleaning Devices',
            bg_style: 'card-white-glass',
            button_text_ar: 'تسوق الآن',
            button_text_en: 'Shop Now',
            target_url: '/deals',
            image_url: 'https://images.trendlineeg.com/products/vacuum-hero.png',
          },
          {
            id: 5,
            title_ar: 'أنظمة المراقبة الذكية',
            title_en: 'Smart Security Surveillance',
            subtitle_ar: 'حماية متكاملة لمنزلك ومكتبك بأعلى دقة 4K',
            subtitle_en: 'Protect Your Home & Workspace with 4K',
            bg_style: 'card-white-glass',
            button_text_ar: 'تسوق الآن',
            button_text_en: 'Shop Now',
            target_url: '/categories/surveillance',
            image_url: 'https://images.trendlineeg.com/products/cctv-hero.png',
          },
        ]);
        setLoading(false);
      }
    };

    fetchBanners();
    return () => { isMounted = false; };
  }, []);

  // Scroll controls
  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: isRtl ? 320 : -320, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: isRtl ? -320 : 320, behavior: 'smooth' });
    }
  };

  return (
    <section className="hero-slider-section" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="hero-container">
        {/* Carousel Navigation Arrows */}
        <button
          className="slider-nav-arrow arrow-prev"
          onClick={handleScrollLeft}
          aria-label="Previous Slide"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points={isRtl ? '9 18 15 12 9 6' : '15 18 9 12 15 6'}></polyline>
          </svg>
        </button>

        <button
          className="slider-nav-arrow arrow-next"
          onClick={handleScrollRight}
          aria-label="Next Slide"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points={isRtl ? '15 18 9 12 15 6' : '9 18 15 12 9 6'}></polyline>
          </svg>
        </button>

        {/* Horizontal Card Track */}
        <div className="hero-cards-wrapper" ref={scrollContainerRef}>
          {banners.map((banner, index) => {
            const title = isRtl ? (banner.title_ar || banner.title) : (banner.title_en || banner.title);
            const subtitle = isRtl ? (banner.subtitle_ar || banner.subtitle) : (banner.subtitle_en || banner.subtitle);
            const buttonText = isRtl ? (banner.button_text_ar || banner.button_text || 'تسوق الآن') : (banner.button_text_en || banner.button_text || 'Shop Now');
            const targetUrl = banner.target_url || '/products';
            const badge = isRtl ? (banner.badge_text_ar || banner.badge_text) : (banner.badge_text_en || banner.badge_text);

            // Card Style 1: Blue CTA (Primary Membership Card)
            if (banner.bg_style === 'card-primary-cta') {
              return (
                <div key={banner.id || index} className="hero-banner-card card-primary-cta">
                  <div>
                    <h2 className="card-title">{title}</h2>
                    {subtitle && <p className="card-subtitle">{subtitle}</p>}

                    <div className="benefits-grid">
                      <div className="benefit-item">
                        <div className="benefit-icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="1" y="3" width="15" height="13"></rect>
                            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                            <circle cx="5.5" cy="18.5" r="2.5"></circle>
                            <circle cx="18.5" cy="18.5" r="2.5"></circle>
                          </svg>
                        </div>
                        <span className="benefit-text">{isRtl ? 'شحن مجاني للطلبات' : 'Free Shipping'}</span>
                      </div>
                      <div className="benefit-item">
                        <div className="benefit-icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="19" y1="5" x2="5" y2="19"></line>
                            <circle cx="6.5" cy="6.5" r="2.5"></circle>
                            <circle cx="17.5" cy="17.5" r="2.5"></circle>
                          </svg>
                        </div>
                        <span className="benefit-text">{isRtl ? 'خصومات مميزة' : 'Special Deals'}</span>
                      </div>
                      <div className="benefit-item">
                        <div className="benefit-icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                          </svg>
                        </div>
                        <span className="benefit-text">{isRtl ? 'دفع آمن عند الاستلام' : 'Safe Payment'}</span>
                      </div>
                      <div className="benefit-item">
                        <div className="benefit-icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="1 4 1 10 7 10"></polyline>
                            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                          </svg>
                        </div>
                        <span className="benefit-text">{isRtl ? 'إرجاع مجاني خلال 14 يوم' : '14-Day Free Returns'}</span>
                      </div>
                    </div>
                  </div>

                  <Link href={targetUrl} className="cta-button">
                    <span>{buttonText} {isRtl ? '←' : '→'}</span>
                  </Link>
                </div>
              );
            }

            // Card Style 2: Bank Al-Ahly Card Promo
            if (banner.bg_style === 'card-bank-promo') {
              return (
                <div key={banner.id || index} className="hero-banner-card card-bank-promo">
                  <div>
                    <h2 className="card-title">{title}</h2>
                    {subtitle && <p className="card-subtitle">{subtitle}</p>}
                  </div>

                  <div className="bank-card-mockup">
                    <div className="credit-card-art">
                      <div className="chip"></div>
                      <div className="card-num">•••• •••• •••• 9284</div>
                    </div>
                  </div>

                  <div className="bank-badge-footer">
                    <span className="discount-pct">{badge || '10% OFF'}</span>
                    <span className="bank-name">{isRtl ? 'البنك الأهلي المصري' : 'National Bank of Egypt'}</span>
                  </div>
                </div>
              );
            }

            // Card Style 3: White Frosted Glass Card (Tech Products, Laptops, Vacuum, Surveillance)
            return (
              <div key={banner.id || index} className="hero-banner-card card-white-glass">
                <div>
                  <h2 className="card-title">{title}</h2>
                  {subtitle && <p className="card-subtitle">{subtitle}</p>}
                </div>

                <div className="card-visual-area">
                  {banner.image_url ? (
                    <img
                      src={banner.image_url}
                      alt={title}
                      className="card-preview-img"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  ) : null}
                  {/* Fallback SVG illustration if image URL fails */}
                  <div className="svg-illustration-fallback" style={{ display: banner.image_url ? 'none' : 'block' }}>
                    <svg width="120" height="110" viewBox="0 0 24 24" fill="none" stroke="#0057C2" strokeWidth="1.4">
                      <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="1.8" />
                      <line x1="1" y1="20" x2="23" y2="20" strokeWidth="2" />
                      <path d="M8 20l1-3h6l1 3" />
                    </svg>
                  </div>
                </div>

                <Link href={targetUrl} className="cta-button">
                  <span>{buttonText} {isRtl ? '←' : '→'}</span>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Carousel Pagination Dots */}
        <div className="slider-dots">
          {banners.map((_, idx) => (
            <button
              key={idx}
              className={`dot ${activeSlide === idx ? 'active' : ''}`}
              onClick={() => {
                setActiveSlide(idx);
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollTo({
                    left: isRtl ? -(idx * 310) : idx * 310,
                    behavior: 'smooth',
                  });
                }
              }}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
