'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getApiHost } from '@/src/utils/apiConfig';
import './CategoryGrid.scss';

export default function CategoryGrid({ lang = 'ar' }) {
  const isRtl = lang === 'ar';
  const [categories, setCategories] = useState([]);
  const [activeDot, setActiveDot] = useState(0);
  const trackRef = useRef(null);

  // Fetch categories with 4 latest products
  useEffect(() => {
    let isMounted = true;
    const fetchHomeCategories = async () => {
      try {
        const apiHost = getApiHost();
        const res = await fetch(`${apiHost}/api/v1/catalog/home-categories`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0 && isMounted) {
            setCategories(json.data);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Using default home categories data:', err);
      }

      // Fallback matching screenshot if needed
      if (isMounted) {
        setCategories([
          {
            id: 1,
            name_ar: 'الراوترات',
            name_en: 'Routers',
            slug: 'routers',
            products: [
              { id: 1, name_ar: 'راوتر منزلي', sale_price: '1350.00', image: 'https://images.trendlineeg.com/products/rtr-home.png' },
              { id: 2, name_ar: 'لوحة مفاتيح', sale_price: '650.00', image: 'https://images.trendlineeg.com/products/keyboard.png' },
              { id: 3, name_ar: 'راوتر 5G', sale_price: '6990.00', image: 'https://images.trendlineeg.com/products/rtr-5g.png' },
              { id: 4, name_ar: 'شاشات', sale_price: '4200.00', image: 'https://images.trendlineeg.com/products/monitor.png' },
            ],
          },
          {
            id: 2,
            name_ar: 'إكسسوارات كمبيوتر',
            name_en: 'Computer Accessories',
            slug: 'accessories',
            products: [
              { id: 5, name_ar: 'ماوس', sale_price: '450.00', image: 'https://images.trendlineeg.com/products/mouse.png' },
              { id: 6, name_ar: 'لوحة مفاتيح', sale_price: '650.00', image: 'https://images.trendlineeg.com/products/keyboard.png' },
              { id: 7, name_ar: 'لابتوب للأعمال', sale_price: '28999.00', image: 'https://images.trendlineeg.com/products/laptop.png' },
              { id: 8, name_ar: 'لاب توب للألعاب', sale_price: '32500.00', image: 'https://images.trendlineeg.com/products/laptop.png' },
            ],
          },
          {
            id: 3,
            name_ar: 'أجهزة الشبكات',
            name_en: 'Networking Devices',
            slug: 'networking-devices',
            products: [
              { id: 9, name_ar: 'سويتشات', sale_price: '1450.00', image: 'https://images.trendlineeg.com/products/switch.png' },
              { id: 10, name_ar: 'راوترات', sale_price: '2499.00', image: 'https://images.trendlineeg.com/products/rtr-home.png' },
              { id: 11, name_ar: 'نقاط وصول', sale_price: '1150.00', image: 'https://images.trendlineeg.com/products/ap.png' },
              { id: 12, name_ar: 'كابلات الشبكة', sale_price: '450.00', image: 'https://images.trendlineeg.com/products/cable.png' },
            ],
          },
          {
            id: 4,
            name_ar: 'كاميرات المراقبة',
            name_en: 'CCTV Cameras',
            slug: 'cctv-surveillance',
            products: [
              { id: 13, name_ar: 'كاميرا داخلية', sale_price: '1250.00', image: 'https://images.trendlineeg.com/products/cam-in.png' },
              { id: 14, name_ar: 'كاميرا خارجية', sale_price: '2750.00', image: 'https://images.trendlineeg.com/products/cam-out.png' },
              { id: 15, name_ar: 'كاميرا PTZ', sale_price: '4990.00', image: 'https://images.trendlineeg.com/products/cam-ptz.png' },
              { id: 16, name_ar: 'كاميرا لاسلكية', sale_price: '1850.00', image: 'https://images.trendlineeg.com/products/cam-wf.png' },
            ],
          },
          {
            id: 5,
            name_ar: 'أنظمة الأمان والمراقبة',
            name_en: 'Security Systems',
            slug: 'security-systems',
            products: [
              { id: 17, name_ar: 'أجهزة التسجيل', sale_price: '2450.00', image: 'https://images.trendlineeg.com/products/nvr.png' },
              { id: 18, name_ar: 'كاميرات مراقبة', sale_price: '1250.00', image: 'https://images.trendlineeg.com/products/cam-vu.png' },
              { id: 19, name_ar: 'أجهزة الإنذار', sale_price: '3680.00', image: 'https://images.trendlineeg.com/products/alarm.png' },
              { id: 20, name_ar: 'أقفال ذكية', sale_price: '3200.00', image: 'https://images.trendlineeg.com/products/lock.png' },
            ],
          },
        ]);
        setLoading(false);
      }
    };

    fetchHomeCategories();
    return () => { isMounted = false; };
  }, []);

  const scrollLeft = () => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: isRtl ? 280 : -280, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: isRtl ? -280 : 280, behavior: 'smooth' });
    }
  };

  return (
    <section className="category-grid-section" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="category-container">
        {/* Section Header */}
        <div className="section-header">
          <h2 className="section-title">
            {isRtl ? 'تسوق حسب الفئة' : 'Shop by Category'}
          </h2>
          <p className="section-subtitle">
            {isRtl ? 'اختر الفئة اللي تناسبك واستكشف أحدث المنتجات' : 'Choose your desired category and explore the newest tech gear'}
          </p>
        </div>

        {/* Carousel Navigation Arrows */}
        <button className="grid-nav-arrow arrow-prev" onClick={scrollLeft} aria-label="Previous Category">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points={isRtl ? '9 18 15 12 9 6' : '15 18 9 12 15 6'}></polyline>
          </svg>
        </button>

        <button className="grid-nav-arrow arrow-next" onClick={scrollRight} aria-label="Next Category">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points={isRtl ? '15 18 9 12 15 6' : '9 18 15 12 9 6'}></polyline>
          </svg>
        </button>

        {/* Cards Horizontal Track */}
        <div className="category-cards-track" ref={trackRef}>
          {categories.map((cat, idx) => {
            const catName = isRtl ? (cat.name_ar || cat.name) : (cat.name_en || cat.name);
            const products = (cat.products || []).slice(0, 4);

            return (
              <div key={cat.id || idx} className="category-card-box">
                {/* Header with Title and Icon */}
                <div className="card-header-bar">
                  <Link href={`/categories/${cat.slug || cat.id}`} className="cat-name">
                    {catName}
                  </Link>

                  <div className="cat-icon-badge">
                    {cat.icon_url?.trim() ? (
                      cat.icon_url.trim().startsWith('<svg') || cat.icon_url.trim().includes('<path') ? (
                        <div
                          className="dynamic-svg-icon"
                          dangerouslySetInnerHTML={{ __html: cat.icon_url.trim() }}
                        />
                      ) : (
                        <img
                          src={cat.icon_url.trim()}
                          alt={catName}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                        <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                        <line x1="6" y1="6" x2="6.01" y2="6"></line>
                        <line x1="6" y1="18" x2="6.01" y2="18"></line>
                      </svg>
                    )}
                  </div>
                </div>

                {/* 2x2 Products Quad Grid */}
                <div className="products-quad-grid">
                  {products.map((p, pIdx) => {
                    const prodName = isRtl ? (p.name_ar || p.name) : (p.name_en || p.name);
                    const formattedPrice = Number(p.sale_price || 0).toLocaleString();

                    return (
                      <Link
                        key={p.id || pIdx}
                        href={`/products/${p.slug || p.id}`}
                        className="product-quad-cell"
                      >
                        <div className="img-wrap">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={prodName}
                              className="product-thumb"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                              }}
                            />
                          ) : null}
                          <div className="product-thumb-fallback" style={{ display: p.image ? 'none' : 'block' }}>
                            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                              <rect x="2" y="3" width="20" height="14" rx="2"></rect>
                              <line x1="8" y1="21" x2="16" y2="21"></line>
                              <line x1="12" y1="17" x2="12" y2="21"></line>
                            </svg>
                          </div>
                        </div>

                        <span className="item-name" title={prodName}>
                          {prodName}
                        </span>

                        <span className="item-price">
                          EGP {formattedPrice}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Section Footer: Link and Dots */}
        <div className="section-footer-row">
          <Link href="/categories" className="view-all-link">
            <span>{isRtl ? 'عرض جميع الفئات ←' : 'View All Categories →'}</span>
          </Link>

          <div className="carousel-dots">
            {[0, 1, 2].map((dot) => (
              <button
                key={dot}
                className={`dot ${activeDot === dot ? 'active' : ''}`}
                onClick={() => {
                  setActiveDot(dot);
                  if (trackRef.current) {
                    trackRef.current.scrollTo({
                      left: isRtl ? -(dot * 270) : dot * 270,
                      behavior: 'smooth',
                    });
                  }
                }}
                aria-label={`Category slide ${dot + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
