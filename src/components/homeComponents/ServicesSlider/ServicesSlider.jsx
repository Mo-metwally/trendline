'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  FaChevronRight,
  FaChevronLeft,
  FaArrowLeft,
  FaArrowRight,
  FaScrewdriverWrench,
  FaServer,
  FaShieldHalved,
  FaNetworkWired,
  FaVideo,
  FaWrench,
  FaCircleCheck,
  FaArrowUpRightFromSquare,
} from 'react-icons/fa6';
import { getApiHost } from '@/src/utils/apiConfig';
import { formatLangHref } from '@/src/hooks/useTrendlineLang';
import { getServiceCardTheme } from '@/src/utils/serviceTheme';
import './ServicesSlider.scss';

// Fallback services in case DB has few items
const FALLBACK_SERVICES = [
  {
    id: 'f1',
    name_ar: 'تصميم وتنفيذ شبكات السيرفرات ومراكز البيانات',
    name_en: 'Data Centers & Server Infrastructure Design',
    slug: 'datacenter-infrastructure',
    short_desc_ar: 'تخطيط وتجهيز كبائن السيرفرات، حلول التبريد والـ UPS، الربط الهيكلي وشهادات كفاءة الكابلات بأعلى معايير الاعتمادية.',
    short_desc_en: 'Planning and outfitting server racks, cooling, UPS, structural cabling, and certified enterprise connectivity.',
    cover_image: '/assets/placeholder-tech.png',
    icon_type: 'server',
    theme_mode: 'gradient',
    gradient_color1: '#0057C2',
    gradient_color2: '#002f6c',
    gradient_angle: 135,
  },
  {
    id: 'f2',
    name_ar: 'أنظمة كاميرات المراقبة والتحكم بالدخول (CCTV & Access Control)',
    name_en: 'Smart CCTV & Access Control Systems',
    slug: 'cctv-security-solutions',
    short_desc_ar: 'توريد وتركيب كاميرات المراقبة الشبكية الذكية (IP Cameras)، أجهزة التسجيل NVR، بوابات التحكم البيومترية، والإنذار المبكر.',
    short_desc_en: 'Supply and deployment of smart IP security cameras, NVRs, biometric gates, and perimeter protection.',
    cover_image: '/assets/placeholder-tech.png',
    icon_type: 'cctv',
    theme_mode: 'gradient',
    gradient_color1: '#0f766e',
    gradient_color2: '#134e4a',
    gradient_angle: 135,
  },
  {
    id: 'f3',
    name_ar: 'حلول شبكات الفايبر والربط اللاسلكي للمواقع البعيدة',
    name_en: 'Fiber Optics & Long-Range Wireless Links',
    slug: 'fiber-wireless-links',
    short_desc_ar: 'لحام كابلات الألياف الضوئية، مد الشبكات الخارجية والداخلية، وإنشاء جسور هوائية لاسلكية (Point-to-Point) فائقة السرعة.',
    short_desc_en: 'Fiber optic splicing, indoor/outdoor cable laying, and high-throughput Point-to-Point microwave wireless links.',
    cover_image: '/assets/placeholder-tech.png',
    icon_type: 'network',
    theme_mode: 'gradient',
    gradient_color1: '#7c3aed',
    gradient_color2: '#4c1d95',
    gradient_angle: 135,
  },
  {
    id: 'f4',
    name_ar: 'عقود الصيانة الوقائية والدعم الفني للشركات',
    name_en: 'Enterprise IT Maintenance & SLA Support',
    slug: 'it-maintenance-sla',
    short_desc_ar: 'خدمات الدعم الفني السريع، الصيانة الدورية للأجهزة، حماية البيانات، وإدارة النسخ الاحتياطية بموجب اتفاقيات مستوى الخدمة (SLA).',
    short_desc_en: 'Rapid on-site IT support, periodic maintenance, disaster recovery, and scheduled backup management under SLAs.',
    cover_image: '/assets/placeholder-tech.png',
    icon_type: 'support',
    theme_mode: 'gradient',
    gradient_color1: '#ea580c',
    gradient_color2: '#9a3412',
    gradient_angle: 135,
  },
];

function getServiceIcon(type = '') {
  switch (type) {
    case 'server':
      return <FaServer />;
    case 'cctv':
      return <FaVideo />;
    case 'network':
      return <FaNetworkWired />;
    case 'support':
      return <FaScrewdriverWrench />;
    default:
      return <FaWrench />;
  }
}

export default function ServicesSlider({ lang = 'ar' }) {
  const isRtl = lang === 'ar';
  const trackRef = useRef(null);

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  // Mouse drag state
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);

  // Fetch Services from API
  useEffect(() => {
    let isMounted = true;

    async function fetchServicesList() {
      setLoading(true);
      try {
        const apiHost = getApiHost();
        const res = await fetch(`${apiHost}/api/v1/services?is_active=true&limit=20`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            if (isMounted) {
              // Combine DB services with fallbacks if DB has only 1 or 2
              if (json.data.length >= 4) {
                setServices(json.data);
              } else {
                const combined = [...json.data];
                FALLBACK_SERVICES.forEach((fb) => {
                  if (!combined.some((s) => s.slug === fb.slug || s.name_ar === fb.name_ar)) {
                    combined.push(fb);
                  }
                });
                setServices(combined);
              }
            }
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to load services from API, using defaults:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }

      if (isMounted) {
        setServices(FALLBACK_SERVICES);
        setLoading(false);
      }
    }

    fetchServicesList();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update boundary indicators
  const updateScrollBoundaries = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }

    const current = Math.abs(el.scrollLeft);
    const atStart = current <= 6;
    const atEnd = current >= maxScroll - 6;

    if (isRtl) {
      setCanScrollPrev(!atStart);
      setCanScrollNext(!atEnd);
    } else {
      setCanScrollPrev(el.scrollLeft > 6);
      setCanScrollNext(el.scrollLeft < maxScroll - 6);
    }
  }, [isRtl]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    updateScrollBoundaries();
    el.addEventListener('scroll', updateScrollBoundaries, { passive: true });
    window.addEventListener('resize', updateScrollBoundaries);

    return () => {
      el.removeEventListener('scroll', updateScrollBoundaries);
      window.removeEventListener('resize', updateScrollBoundaries);
    };
  }, [services, updateScrollBoundaries]);

  // Scroll buttons handlers
  const handleScroll = (direction) => {
    const el = trackRef.current;
    if (!el) return;

    const scrollAmount = Math.max(300, el.clientWidth * 0.75);
    const multiplier = direction === 'next' ? 1 : -1;

    if (isRtl) {
      el.scrollBy({
        left: -multiplier * scrollAmount,
        behavior: 'smooth',
      });
    } else {
      el.scrollBy({
        left: multiplier * scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Drag to scroll
  const handleMouseDown = (e) => {
    const el = trackRef.current;
    if (!el) return;
    isDragging.current = true;
    startX.current = e.pageX - el.offsetLeft;
    scrollLeftStart.current = el.scrollLeft;
    el.classList.add('is-dragging');
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const el = trackRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    el.scrollLeft = scrollLeftStart.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
    const el = trackRef.current;
    if (el) {
      el.classList.remove('is-dragging');
    }
  };

  return (
    <section className="services-slider-section" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="services-slider-container">
        {/* ================= Header ================= */}
        <div className="section-header-box">
          <div className="header-info-col">
            <div className="section-badge">
              <FaScrewdriverWrench className="badge-icon" />
              <span>{isRtl ? 'حلول وخدمات ترندلاين الهندسية' : 'Trendline Enterprise Services'}</span>
            </div>

            <h2 className="section-title">
              {isRtl ? 'خدماتنا التقنية المتكاملة' : 'Our Comprehensive Tech Services'}
            </h2>

            <p className="section-subtitle">
              {isRtl
                ? 'نقدم حلولاً احترافية لتجهيز غرف الخوادم، شبكات الفايبر، كاميرات المراقبة، وعقود الصيانة الدورية للشركات والمؤسسات.'
                : 'Professional turnkey engineering solutions for server rooms, fiber optics, smart surveillance, and corporate IT maintenance.'}
            </p>
          </div>

          {/* Action Row: Navigation Arrows + View All Button */}
          <div className="header-actions-col">
            {/* View All Button (زر المزيد) */}
            <Link href={formatLangHref('/services', lang)} className="btn-view-all-services">
              <span>{isRtl ? 'المزيد من الخدمات' : 'View All Services'}</span>
              {isRtl ? <FaArrowLeft size={12} /> : <FaArrowRight size={12} />}
            </Link>

            {/* Slider Navigation Arrows */}
            <div className="slider-arrows-group">
              <button
                type="button"
                className="slider-arrow prev"
                disabled={!canScrollPrev}
                onClick={() => handleScroll('prev')}
                aria-label={isRtl ? 'الخدمة السابقة' : 'Previous service'}
              >
                {isRtl ? <FaChevronRight size={14} /> : <FaChevronLeft size={14} />}
              </button>

              <button
                type="button"
                className="slider-arrow next"
                disabled={!canScrollNext}
                onClick={() => handleScroll('next')}
                aria-label={isRtl ? 'الخدمة التالية' : 'Next service'}
              >
                {isRtl ? <FaChevronLeft size={14} /> : <FaChevronRight size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* ================= Slider Track ================= */}
        <div
          ref={trackRef}
          className="services-slider-track"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
        >
          {loading ? (
            /* Loading Skeleton */
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="service-card-item skeleton-card">
                <div className="skeleton-media" />
                <div className="skeleton-body">
                  <div className="skeleton-line title" />
                  <div className="skeleton-line text" />
                  <div className="skeleton-line text short" />
                </div>
              </div>
            ))
          ) : (
            services.map((service, index) => {
              const title = isRtl
                ? service.name_ar || service.name_en || 'خدمة ترندلاين'
                : service.name_en || service.name_ar || 'Trendline Service';

              const shortDesc = isRtl
                ? service.short_desc_ar || service.short_desc_en || ''
                : service.short_desc_en || service.short_desc_ar || '';

              const serviceUrl = formatLangHref(
                `/services/${encodeURIComponent(service.slug || service.id)}`,
                lang
              );

              // Compute rich card theme matching Admin Studio exactly
              const cardTheme = getServiceCardTheme(service);
              const isDark = cardTheme.isDark;
              const finishClass = `finish-${cardTheme.finish || 'glass'}`;
              const themeClass = isDark ? 'is-dark-theme' : 'is-light-theme';

              return (
                <article
                  key={service.id || index}
                  className={`service-card-item ${finishClass} ${themeClass}`}
                  style={cardTheme.style}
                >
                  {/* Specular glare for glossy finish */}
                  {cardTheme.finish === 'glossy' && <div className="specular-glare" />}

                  {/* Card Media Stage */}
                  <div className="card-media-stage">
                    {service.cover_image && service.cover_image.trim() !== '' ? (
                      <img
                        src={service.cover_image}
                        alt={title}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : null}

                    {/* Gradient Overlay & Floating Badge */}
                    <div className="media-overlay">
                      <div className="floating-icon-pill">
                        {getServiceIcon(service.icon_type)}
                      </div>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="card-content-body">
                    <h3 className="card-service-title" title={title}>
                      <Link href={serviceUrl}>{title}</Link>
                    </h3>

                    {shortDesc && (
                      <p className="card-service-desc" title={shortDesc}>
                        {shortDesc}
                      </p>
                    )}

                    {/* Trust Highlights */}
                    <div className="card-service-features">
                      <span className="feature-pill">
                        <FaCircleCheck size={11} />
                        <span>{isRtl ? 'تنفيذ هندسي معتمد' : 'Certified Engineering'}</span>
                      </span>
                      <span className="feature-pill">
                        <FaShieldHalved size={11} />
                        <span>{isRtl ? 'ضمان ودعم فني' : 'Warranty & Support'}</span>
                      </span>
                    </div>

                    {/* Footer CTA */}
                    <div className="card-footer-action">
                      <Link href={serviceUrl} className="btn-service-details">
                        <span>{isRtl ? 'تفاصيل الخدمة وطلب المعاينة' : 'Details & Inquiry'}</span>
                        {isRtl ? <FaArrowLeft size={11} /> : <FaArrowRight size={11} />}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })
          )}

          {/* Special "Explore All" Slide Card at the end of slider */}
          {!loading && (
            <article className="service-card-item explore-all-card">
              <div className="explore-all-inner">
                <div className="explore-icon-bubble">
                  <FaScrewdriverWrench />
                </div>
                <h3>{isRtl ? 'هل تبحث عن حلول تقنية مخصصة؟' : 'Looking for Custom IT Solutions?'}</h3>
                <p>
                  {isRtl
                    ? 'استعرض جميع خدمات وحلول ترندلاين واطلب استشارة أو معاينة مجانية لموقع شركتك أو مشروعك.'
                    : 'Browse our full catalog of turnkey services and request a free site survey for your project.'}
                </p>
                <Link href={formatLangHref('/services', lang)} className="btn-explore-all-cta">
                  <span>{isRtl ? 'عرض كل الخدمات' : 'View All Services'}</span>
                  {isRtl ? <FaArrowLeft size={13} /> : <FaArrowRight size={13} />}
                </Link>
              </div>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
