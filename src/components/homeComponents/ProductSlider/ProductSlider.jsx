'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  FaChevronRight,
  FaChevronLeft,
  FaFire,
  FaStar,
  FaArrowLeft,
  FaArrowRight,
  FaTag,
} from 'react-icons/fa6';
import StoreProductCard from '@/src/components/common/StoreProductCard/StoreProductCard';
import { getApiHost } from '@/src/utils/apiConfig';
import { formatLangHref } from '@/src/hooks/useTrendlineLang';
import './ProductSlider.scss';

// Shuffle helper for random fallback products
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function ProductSlider({
  type = 'deals', // 'deals' | 'new' | 'featured' | 'random'
  customTitle,
  customSubtitle,
  badgeText,
  lang = 'ar',
  limit = 16,
}) {
  const isRtl = lang === 'ar';
  const trackRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMeta, setActiveMeta] = useState({
    title: '',
    subtitle: '',
    badge: '',
    badgeType: 'fire',
    viewAllHref: '/products',
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Mouse drag to scroll state
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);

  // Check scroll boundary to enable/disable arrow buttons
  const updateScrollBoundaries = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      setCanScrollPrev(false);
      setCanScrollNext(false);
      setScrollProgress(100);
      return;
    }

    const current = Math.abs(el.scrollLeft);
    const progress = Math.min(100, Math.max(0, (current / maxScroll) * 100));
    setScrollProgress(progress);

    // Depending on RTL / LTR
    if (isRtl) {
      // In RTL browsers, scrollLeft can be 0 at right, negative or positive going left
      const atStart = current <= 4;
      const atEnd = current >= maxScroll - 4;
      setCanScrollPrev(!atStart);
      setCanScrollNext(!atEnd);
    } else {
      setCanScrollPrev(el.scrollLeft > 4);
      setCanScrollNext(el.scrollLeft < maxScroll - 4);
    }
  }, [isRtl]);

  // Handle arrows scroll
  const handleScroll = (direction) => {
    const el = trackRef.current;
    if (!el) return;

    const scrollAmount = Math.max(el.clientWidth * 0.75, 280);
    const multiplier = direction === 'next' ? 1 : -1;

    // In RTL, moving forward ("next") means scrolling towards left (negative in modern DOM or handled by direction)
    const delta = isRtl ? -multiplier * scrollAmount : multiplier * scrollAmount;

    el.scrollBy({
      left: delta,
      behavior: 'smooth',
    });

    setTimeout(updateScrollBoundaries, 350);
  };

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    const el = trackRef.current;
    if (!el) return;
    isDragging.current = true;
    startX.current = e.pageX - el.offsetLeft;
    scrollLeftStart.current = el.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const el = trackRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    el.scrollLeft = scrollLeftStart.current - walk;
    updateScrollBoundaries();
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
    updateScrollBoundaries();
  };

  // Fetch products with multi-tier fallback: Deals -> New -> Featured -> Random
  useEffect(() => {
    let isMounted = true;
    const apiHost = getApiHost();

    const fetchSliderData = async () => {
      setLoading(true);
      try {
        let fetchedList = [];
        let finalTitle = customTitle || '';
        let finalSubtitle = customSubtitle || '';
        let finalBadge = badgeText || '';
        let finalBadgeType = 'fire';
        let finalViewAll = '/products';

        if (type === 'deals') {
          // Tier 1: Try on_sale_only products
          try {
            const res = await fetch(
              `${apiHost}/api/v1/catalog/products?on_sale_only=true&limit=${limit}&is_active=true`
            );
            if (res.ok) {
              const json = await res.json();
              if (json.success && Array.isArray(json.data) && json.data.length >= 3) {
                fetchedList = json.data;
                finalTitle = customTitle || (isRtl ? 'عروض وتخفيضات حصرية' : 'Exclusive Hot Deals');
                finalSubtitle =
                  customSubtitle ||
                  (isRtl
                    ? 'اقتنص أقوى الخصومات والأسعار المخفضة قبل نفاد الكمية'
                    : 'Grab top discounts and discounted prices before stock runs out');
                finalBadge = badgeText || (isRtl ? '  عروض حصرية' : '  Hot Deals');
                finalBadgeType = 'fire';
                finalViewAll = '/products?on_sale=true';
              }
            }
          } catch (e) {
            console.warn('[ProductSlider] Deals tier error, falling back:', e);
          }

          // Tier 2: Fallback to featured recommendations if deals are empty
          if (fetchedList.length < 3) {
            try {
              const resFeat = await fetch(
                `${apiHost}/api/v1/catalog/products?is_featured=true&limit=${limit}&is_active=true`
              );
              if (resFeat.ok) {
                const jsonFeat = await resFeat.json();
                if (jsonFeat.success && Array.isArray(jsonFeat.data) && jsonFeat.data.length >= 3) {
                  fetchedList = jsonFeat.data;
                  finalTitle =
                    customTitle || (isRtl ? 'اقتراحات مختارة لك' : 'Recommended For You');
                  finalSubtitle =
                    customSubtitle ||
                    (isRtl
                      ? 'تشكيلة مختارة بعناية من أفضل الأجهزة التقنية الموصى بها'
                      : 'Handpicked selection of our top recommended devices');
                  finalBadge = badgeText || (isRtl ? '⭐ مقترحاتنا' : '⭐ Picks For You');
                  finalBadgeType = 'star';
                  finalViewAll = '/products';
                }
              }
            } catch (e) {
              console.warn('[ProductSlider] Featured fallback error:', e);
            }
          }

          // Tier 3: Fallback to random general products
          if (fetchedList.length < 3) {
            try {
              const resGen = await fetch(
                `${apiHost}/api/v1/catalog/products?limit=24&is_active=true`
              );
              if (resGen.ok) {
                const jsonGen = await resGen.json();
                if (jsonGen.success && Array.isArray(jsonGen.data) && jsonGen.data.length > 0) {
                  fetchedList = shuffleArray(jsonGen.data).slice(0, limit);
                  finalTitle =
                    customTitle || (isRtl ? 'استكشف منتجاتنا' : 'Explore Tech Selections');
                  finalSubtitle =
                    customSubtitle ||
                    (isRtl
                      ? 'تصفح باقة مميزة ومتنوعة من أحدث أجهزتنا'
                      : 'Explore a diverse selection of our high quality devices');
                  finalBadge = badgeText || (isRtl ? '  استكشف' : '  Discover');
                  finalBadgeType = 'sparkle';
                  finalViewAll = '/products';
                }
              }
            } catch (e) {
              console.warn('[ProductSlider] Random fallback error:', e);
            }
          }
        } else if (type === 'new') {
          // Tier 1: Try latest products sorted by created_at_desc
          try {
            const res = await fetch(
              `${apiHost}/api/v1/catalog/products?sort=created_at_desc&limit=${limit}&is_active=true`
            );
            if (res.ok) {
              const json = await res.json();
              if (json.success && Array.isArray(json.data) && json.data.length >= 3) {
                fetchedList = json.data;
                finalTitle =
                  customTitle || (isRtl ? 'وصل حديثاً إلى ترندلاين' : 'New Arrivals');
                finalSubtitle =
                  customSubtitle ||
                  (isRtl
                    ? 'أحدث الأجهزة الإلكترونية والحلول التقنية المضافة حديثاً للمتجر'
                    : 'The freshest electronics and tech gear recently added');
                finalBadge = badgeText || (isRtl ? '  جديدنا' : '  Fresh Tech');
                finalBadgeType = 'sparkle';
                finalViewAll = '/products?sort=created_at_desc';
              }
            }
          } catch (e) {
            console.warn('[ProductSlider] New products tier error:', e);
          }

          // Tier 2: Fallback to featured or random
          if (fetchedList.length < 3) {
            try {
              const resGen = await fetch(
                `${apiHost}/api/v1/catalog/products?limit=24&is_active=true`
              );
              if (resGen.ok) {
                const jsonGen = await resGen.json();
                if (jsonGen.success && Array.isArray(jsonGen.data) && jsonGen.data.length > 0) {
                  fetchedList = shuffleArray(jsonGen.data).slice(0, limit);
                  finalTitle =
                    customTitle || (isRtl ? 'منتجات مقترحة لك' : 'Featured Electronics');
                  finalSubtitle =
                    customSubtitle ||
                    (isRtl
                      ? 'مجموعة مختارة من أفضل أجهزتنا بأعلى معايير الجودة'
                      : 'A curated collection of top-rated tech equipment');
                  finalBadge = badgeText || (isRtl ? '⭐ مميز' : '⭐ Spotlight');
                  finalBadgeType = 'star';
                  finalViewAll = '/products';
                }
              }
            } catch (e) { }
          }
        } else {
          // Generic / Featured / Random
          try {
            const queryParam = type === 'featured' ? 'is_featured=true&' : '';
            const res = await fetch(
              `${apiHost}/api/v1/catalog/products?${queryParam}limit=${limit}&is_active=true`
            );
            if (res.ok) {
              const json = await res.json();
              if (json.success && Array.isArray(json.data) && json.data.length > 0) {
                fetchedList = type === 'random' ? shuffleArray(json.data) : json.data;
                finalTitle =
                  customTitle || (isRtl ? 'منتجات مقترحة لك' : 'Featured Products');
                finalSubtitle =
                  customSubtitle ||
                  (isRtl
                    ? 'أفضل خيارات الأجهزة الإلكترونية المختارة بعناية'
                    : 'Handpicked electronics and accessories');
                finalBadge = badgeText || (isRtl ? '⭐ مميز' : '⭐ Featured');
                finalBadgeType = 'star';
                finalViewAll = '/products';
              }
            }
          } catch (e) { }
        }

        if (isMounted) {
          setProducts(fetchedList);
          setActiveMeta({
            title: finalTitle,
            subtitle: finalSubtitle,
            badge: finalBadge,
            badgeType: finalBadgeType,
            viewAllHref: finalViewAll,
          });
          setLoading(false);
          setTimeout(updateScrollBoundaries, 150);
        }
      } catch (err) {
        console.error('[ProductSlider] Fatal fetch error:', err);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSliderData();

    return () => {
      isMounted = false;
    };
  }, [type, customTitle, customSubtitle, badgeText, lang, limit, isRtl, updateScrollBoundaries]);

  // Listen to scroll events on track
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const onScroll = () => updateScrollBoundaries();
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [updateScrollBoundaries]);

  // Badge icon helper
  const renderBadgeIcon = () => {
    switch (activeMeta.badgeType) {
      case 'fire':
        return <FaFire className="badge-icon fire-icon" />;
      case 'sparkle':
        return (
          <svg className="badge-icon sparkle-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
          </svg>
        );
      case 'star':
      default:
        return <FaStar className="badge-icon star-icon" />;
    }
  };

  if (!loading && products.length === 0) {
    return null; // Don't render empty section
  }

  return (
    <section
      className={`trendline-product-slider-section ${type}-slider-theme`}
      dir={isRtl ? 'rtl' : 'ltr'}
      suppressHydrationWarning
    >
      <div className="slider-stage-container">
        {/* Section Header with Liquid Glass Meta & Controls */}
        <div className="slider-header-bar">
          <div className="header-meta-group">
            {activeMeta.badge && (
              <span className={`slider-pill-badge badge-${activeMeta.badgeType}`}>
                {renderBadgeIcon()}
                <span>{activeMeta.badge}</span>
              </span>
            )}
            <h2 className="slider-main-title">{activeMeta.title}</h2>
            {activeMeta.subtitle && (
              <p className="slider-subtitle">{activeMeta.subtitle}</p>
            )}
          </div>

          <div className="header-controls-group">
            <Link
              href={formatLangHref(activeMeta.viewAllHref, lang)}
              className="slider-view-all-btn"
            >
              <span>{isRtl ? 'عرض الكل' : 'View All'}</span>
              {isRtl ? <FaArrowLeft size={13} /> : <FaArrowRight size={13} />}
            </Link>

            <div className="slider-nav-arrows">
              <button
                type="button"
                className={`slider-arrow-btn prev-btn ${!canScrollPrev ? 'disabled' : ''}`}
                onClick={() => handleScroll('prev')}
                disabled={!canScrollPrev}
                aria-label={isRtl ? 'السابق' : 'Previous'}
              >
                {isRtl ? <FaChevronRight size={14} /> : <FaChevronLeft size={14} />}
              </button>
              <button
                type="button"
                className={`slider-arrow-btn next-btn ${!canScrollNext ? 'disabled' : ''}`}
                onClick={() => handleScroll('next')}
                disabled={!canScrollNext}
                aria-label={isRtl ? 'التالي' : 'Next'}
              >
                {isRtl ? <FaChevronLeft size={14} /> : <FaChevronRight size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Product Carousel Track */}
        <div
          className="slider-scroll-viewport"
          ref={trackRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
        >
          {loading ? (
            // Shimmer Skeleton Cards
            <div className="slider-shimmer-track">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div key={idx} className="slider-skeleton-card">
                  <div className="skeleton-image-box"></div>
                  <div className="skeleton-text-line title"></div>
                  <div className="skeleton-text-line price"></div>
                  <div className="skeleton-btn"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="slider-products-track">
              {products.map((prod) => (
                <div key={prod.id} className="slider-product-item">
                  <StoreProductCard
                    product={prod}
                    lang={lang}
                    className="slider-card-instance"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom subtle progress line */}
        <div className="slider-progress-wrapper">
          <div
            className="slider-progress-bar"
            style={{ width: `${Math.max(12, scrollProgress)}%` }}
          ></div>
        </div>
      </div>
    </section>
  );
}
