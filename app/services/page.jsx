'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Navbar from '@/src/components/common/Navbar/Navbar';
import Footer from '@/src/components/common/Footer/Footer';
import useTrendlineLang, { formatLangHref } from '@/src/hooks/useTrendlineLang';
import { getApiHost } from '@/src/utils/apiConfig';
import { getServiceCardTheme } from '@/src/utils/serviceTheme';
import {
  FaHouse,
  FaChevronLeft,
  FaChevronRight,
  FaScrewdriverWrench,
  FaMagnifyingGlass,
  FaServer,
  FaVideo,
  FaNetworkWired,
  FaWrench,
  FaShieldHalved,
  FaCircleCheck,
  FaPhone,
  FaWhatsapp,
  FaXmark,
  FaArrowLeft,
  FaArrowRight,
  FaComments,
} from 'react-icons/fa6';
import './ServicesPage.scss';

// Fallback services catalog
const FALLBACK_SERVICES = [
  {
    id: 'fb-datacenter',
    name_ar: 'تصميم وتنفيذ شبكات السيرفرات ومراكز البيانات',
    name_en: 'Data Centers & Server Infrastructure Design',
    slug: 'datacenter-infrastructure',
    short_desc_ar: 'تخطيط وتجهيز كبائن السيرفرات، حلول التبريد والـ UPS، الربط الهيكلي وشهادات كفاءة الكابلات بأعلى معايير الاعتمادية.',
    short_desc_en: 'Planning and outfitting server racks, cooling, UPS, structural cabling, and certified enterprise connectivity.',
    details_ar: '<p>نقدم في ترندلاين تك حلولاً هندسية متكاملة لتجهيز مراكز البيانات وغرف السيرفرات باحترافية كاملة، تشمل:</p><ul><li>توريد وتركيب كبائن الخوادم Rack Cabinets وسويتشات Core & Edge.</li><li>تمديدات الكابلات الهيكلية المنظمة مع تقديم تقارير فحص واختبار Fluke Test معتمدة.</li><li>أنظمة التبريد الموجه وأنظمة الطاقة غير المنقطعة (UPS) لضمان استمرارية التشغيل 24/7.</li><li>إدارة الكابلات وترقيم النقاط وتوثيق كامل لمخطط الشبكة.</li></ul>',
    details_en: '<p>Comprehensive enterprise data center and server room design and deployment services including certified cabling and 24/7 power management.</p>',
    cover_image: '/assets/placeholder-tech.png',
    icon_type: 'server',
    theme_mode: 'gradient',
    gradient_color1: '#0057C2',
    gradient_color2: '#002f6c',
    gradient_angle: 135,
  },
  {
    id: 'fb-cctv',
    name_ar: 'أنظمة كاميرات المراقبة والتحكم بالدخول (CCTV & Access Control)',
    name_en: 'Smart CCTV & Access Control Systems',
    slug: 'cctv-security-solutions',
    short_desc_ar: 'توريد وتركيب كاميرات المراقبة الشبكية الذكية (IP Cameras)، أجهزة التسجيل NVR، بوابات التحكم البيومترية، والإنذار المبكر.',
    short_desc_en: 'Supply and deployment of smart IP security cameras, NVRs, biometric gates, and perimeter protection.',
    details_ar: '<p>حلول أمنية ذكية تضمن حماية متكاملة لمنشأتك ومراقبة على مدار الساعة:</p><ul><li>كاميرات مراقبة IP بدقة 4K مع خاصية الرؤية الليلية الملونة والذكاء الاصطناعي (AI Analytics).</li><li>أنظمة التعرف على الوجوه ولوحات السيارات وتتبع الحركة الذكي.</li><li>بوابات التحكم بالدخول بالبصمة، الكارت، وبصمة الوجه مع أنظمة الحضور والانصراف.</li><li>ربط النظام بالهواتف الذكية للمتابعة عن بُعد مع سيرفرات تخزين سحابية ومحلية آمنة.</li></ul>',
    details_en: '<p>AI-powered IP surveillance and biometric access control systems for maximum facility security.</p>',
    cover_image: '/assets/placeholder-tech.png',
    icon_type: 'cctv',
    theme_mode: 'gradient',
    gradient_color1: '#0f766e',
    gradient_color2: '#134e4a',
    gradient_angle: 135,
  },
  {
    id: 'fb-fiber',
    name_ar: 'حلول شبكات الفايبر والربط اللاسلكي للمواقع البعيدة',
    name_en: 'Fiber Optics & Long-Range Wireless Links',
    slug: 'fiber-wireless-links',
    short_desc_ar: 'لحام كابلات الألياف الضوئية، مد الشبكات الخارجية والداخلية، وإنشاء جسور هوائية لاسلكية (Point-to-Point) فائقة السرعة.',
    short_desc_en: 'Fiber optic splicing, indoor/outdoor cable laying, and high-throughput Point-to-Point microwave wireless links.',
    details_ar: '<p>ربط فروع الشركات والمصانع والمواقع البعيدة بشبكات عالية السرعة واستقرار فائق:</p><ul><li>لحام الألياف الضوئية (Fiber Splicing) باستخدام أحدث أجهزة اللحام الدقيقة واختبار OTDR.</li><li>مد كابلات الفايبر الداخلية والخارجية المدفونة والمعلقة مع كبائن التوزيع ODF.</li><li>جسور لاسلكية Point-to-Point و Point-to-Multipoint لربط المواقع عبر مسافات تصل إلى عشرات الكيلومترات.</li><li>حلول احتياطية Failover لضمان عدم انقطاع الاتصال نهائياً.</li></ul>',
    details_en: '<p>High-speed fiber optic deployment and wireless point-to-point microwave communication bridges.</p>',
    cover_image: '/assets/placeholder-tech.png',
    icon_type: 'network',
    theme_mode: 'gradient',
    gradient_color1: '#7c3aed',
    gradient_color2: '#4c1d95',
    gradient_angle: 135,
  },
  {
    id: 'fb-sla',
    name_ar: 'عقود الصيانة الوقائية والدعم الفني للشركات',
    name_en: 'Enterprise IT Maintenance & SLA Support',
    slug: 'it-maintenance-sla',
    short_desc_ar: 'خدمات الدعم الفني السريع، الصيانة الدورية للأجهزة، حماية البيانات، وإدارة النسخ الاحتياطية بموجب اتفاقيات مستوى الخدمة (SLA).',
    short_desc_en: 'Rapid on-site IT support, periodic maintenance, disaster recovery, and scheduled backup management under SLAs.',
    details_ar: '<p>راحة بال تامة واستقرار كامل لبيئة عملك التقنية مع باقات صيانة مخصصة:</p><ul><li>زيارات دورية لفحص وصيانة السيرفرات وأجهزة الشبكات وأجهزة المستخدمين.</li><li>دعم فني طارئ وسريع عبر الزيارات الميدانية أو الدعم عن بُعد (Remote Support).</li><li>تأمين البيانات وخطط التعافي من الكوارث (Disaster Recovery & Backup).</li><li>تقارير دورية عن أداء البنية التحتية وتوصيات التطوير والتحديث.</li></ul>',
    details_en: '<p>Proactive IT system maintenance, rapid SLA remote and on-site support, and backup assurance.</p>',
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

function ServicesPageContent() {
  const { lang, isRtl, setLang } = useTrendlineLang('ar');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchServices() {
      setLoading(true);
      try {
        const apiHost = getApiHost();
        const res = await fetch(`${apiHost}/api/v1/services?is_active=true&limit=50`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            if (isMounted) {
              if (json.data.length >= 4) {
                setServices(json.data);
              } else {
                const combined = [...json.data];
                FALLBACK_SERVICES.forEach((fb) => {
                  if (
                    !combined.some(
                      (s) =>
                        String(s.id) === String(fb.id) ||
                        s.slug === fb.slug ||
                        s.name_ar === fb.name_ar
                    )
                  ) {
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
        console.warn('Could not load services from API:', err);
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

    fetchServices();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter services by search
  const filteredServices = services.filter((srv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameAr = (srv.name_ar || '').toLowerCase();
    const nameEn = (srv.name_en || '').toLowerCase();
    const descAr = (srv.short_desc_ar || '').toLowerCase();
    const descEn = (srv.short_desc_en || '').toLowerCase();
    return nameAr.includes(q) || nameEn.includes(q) || descAr.includes(q) || descEn.includes(q);
  });

  return (
    <div className="services-page-wrapper" dir={isRtl ? 'rtl' : 'ltr'}>
      <Navbar lang={lang} onToggleLang={setLang} />

      <main className="services-main-container">
        {/* ================= Breadcrumbs ================= */}
        <nav className="services-breadcrumbs" aria-label="Breadcrumb">
          <Link href={formatLangHref('/', lang)} className="crumb-link">
            <FaHouse className="crumb-icon" />
            <span>{isRtl ? 'الرئيسية' : 'Home'}</span>
          </Link>
          {isRtl ? <FaChevronLeft className="crumb-sep" /> : <FaChevronRight className="crumb-sep" />}
          <span className="crumb-active">{isRtl ? 'خدمات وحلول ترندلاين' : 'Services & Solutions'}</span>
        </nav>

        {/* ================= Hero Banner ================= */}
        <div className="services-hero-banner">
          <div className="hero-content">
            <div className="hero-badge">
              <FaScrewdriverWrench className="badge-icon" />
              <span>{isRtl ? 'حلول هندسية وتقنية متكاملة' : 'Turnkey Engineering & IT Solutions'}</span>
            </div>

            <h1>{isRtl ? 'خدمات وحلول ترندلاين تك المعتمدة' : 'Trendline Enterprise Services & Solutions'}</h1>
            <p>
              {isRtl
                ? 'فريق متخصص يقدم أحدث الحلول الهندسية لتجهيز غرف الخوادم، شبكات الفايبر، كاميرات المراقبة، وعقود الصيانة الدورية للشركات والمؤسسات بأعلى معايير الجودة والموثوقية.'
                : 'Specialized enterprise team delivering turnkey data center build-outs, fiber optics, smart surveillance, and SLA maintenance.'}
            </p>

            {/* Search Input Box */}
            <div className="services-search-bar">
              <FaMagnifyingGlass className="search-icon" />
              <input
                type="text"
                placeholder={isRtl ? 'ابحث في الخدمات الهندسية والتقنية...' : 'Search enterprise services...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="btn-clear-search"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <FaXmark />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ================= Services Grid ================= */}
        <div className="services-grid-wrapper">
          {loading ? (
            <div className="services-loading-stage">
              <div className="loading-spinner" />
              <span>{isRtl ? 'جاري تحميل قائمة الخدمات...' : 'Loading services...'}</span>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="services-empty-stage">
              <FaScrewdriverWrench size={38} />
              <h3>{isRtl ? 'لم يتم العثور على خدمات مطابقة' : 'No matching services found'}</h3>
              <p>{isRtl ? 'يرجى تجربة كلمات بحث أخرى أو استعراض جميع الخدمات.' : 'Try different search keywords.'}</p>
              <button
                type="button"
                className="btn-reset-search"
                onClick={() => setSearchQuery('')}
              >
                {isRtl ? 'عرض كل الخدمات' : 'View All'}
              </button>
            </div>
          ) : (
            <div className="services-cards-grid">
              {filteredServices.map((service, index) => {
                const title = isRtl
                  ? service.name_ar || service.name_en || 'خدمة ترندلاين'
                  : service.name_en || service.name_ar || 'Trendline Service';

                const shortDesc = isRtl
                  ? service.short_desc_ar || service.short_desc_en || ''
                  : service.short_desc_en || service.short_desc_ar || '';

                // Compute rich card theme matching Admin Studio exactly
                const cardTheme = getServiceCardTheme(service);
                const isDark = cardTheme.isDark;
                const finishClass = `finish-${cardTheme.finish || 'glass'}`;
                const themeClass = isDark ? 'is-dark-theme' : 'is-light-theme';

                const cardUniqueKey = `service-card-${service.id || service.slug || index}-${index}`;

                return (
                  <article
                    key={cardUniqueKey}
                    className={`service-main-card ${finishClass} ${themeClass}`}
                    style={cardTheme.style}
                  >
                    {/* Specular glare for glossy finish */}
                    {cardTheme.finish === 'glossy' && <div className="specular-glare" />}

                    {/* Media Top */}
                    <div className="service-media">
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

                      <div className="media-overlay">
                        <div className="icon-badge">
                          {getServiceIcon(service.icon_type)}
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="service-card-body">
                      <h3>{title}</h3>
                      {shortDesc && <p className="service-desc">{shortDesc}</p>}

                      {/* Feature Pills */}
                      <div className="service-highlights">
                        <span className="hl-pill">
                          <FaCircleCheck size={11} />
                          <span>{isRtl ? 'فريق هندسي متخصص' : 'Specialized Engineers'}</span>
                        </span>
                        <span className="hl-pill">
                          <FaShieldHalved size={11} />
                          <span>{isRtl ? 'ضمان جودة واعتمادية' : 'Quality Guaranteed'}</span>
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="service-actions-row">
                        <button
                          type="button"
                          className="btn-open-details"
                          onClick={() => setSelectedService(service)}
                        >
                          <span>{isRtl ? 'عرض تفاصيل الخدمة' : 'View Full Details'}</span>
                          {isRtl ? <FaArrowLeft size={11} /> : <FaArrowRight size={11} />}
                        </button>

                        <a
                          href="https://wa.me/201281717577"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-whatsapp-inquiry"
                          title={isRtl ? 'طلب استشارة سريعة عبر واتساب' : 'Inquire via WhatsApp'}
                        >
                          <FaWhatsapp size={15} />
                          <span>{isRtl ? 'طلب معاينة' : 'Survey'}</span>
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* ================= Consultation Callout ================= */}
        <section className="services-cta-banner">
          <div className="cta-inner">
            <div className="cta-icon-stage">
              <FaComments />
            </div>
            <div className="cta-texts">
              <h3>{isRtl ? 'تحتاج حلاً مخصصاً أو دراسة متكاملة لمشروعك؟' : 'Need a Custom Solution or Site Survey?'}</h3>
              <p>
                {isRtl
                  ? 'مهندسونا مستعدون لإجراء معاينات ميدانية وتقديم دراسات جدوى ومخططات تنفيذية بأفضل التكاليف وأعلى مواصفات.'
                  : 'Our engineers are ready to conduct on-site surveys and provide technical designs at optimal costs.'}
              </p>
            </div>
            <div className="cta-buttons">
              <a
                href="tel:+201281717577"
                className="btn-call-consultant"
              >
                <FaPhone size={13} />
                <span>{isRtl ? 'اتصل بنا مباشرة' : 'Call Engineers'}</span>
              </a>

              <a
                href="https://wa.me/201281717577"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-chat-whatsapp"
              >
                <FaWhatsapp size={15} />
                <span>{isRtl ? 'محادثة عبر واتساب' : 'Chat on WhatsApp'}</span>
              </a>
            </div>
          </div>
        </section>

        {/* ================= Details Modal ================= */}
        {selectedService && (
          <div
            className="service-modal-overlay"
            onClick={() => setSelectedService(null)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="service-modal-dialog"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="modal-title-row">
                  <div className="modal-icon">
                    {getServiceIcon(selectedService.icon_type)}
                  </div>
                  <h3>
                    {isRtl
                      ? selectedService.name_ar || selectedService.name_en
                      : selectedService.name_en || selectedService.name_ar}
                  </h3>
                </div>

                <button
                  type="button"
                  className="btn-close-modal"
                  onClick={() => setSelectedService(null)}
                  aria-label="Close"
                >
                  <FaXmark />
                </button>
              </div>

              <div className="modal-body">
                {selectedService.cover_image && (
                  <div className="modal-media-banner">
                    <img
                      src={selectedService.cover_image}
                      alt={selectedService.name_ar || selectedService.name_en}
                    />
                  </div>
                )}

                {/* HTML Details */}
                <div
                  className="modal-rich-html"
                  dangerouslySetInnerHTML={{
                    __html: isRtl
                      ? selectedService.details_ar || selectedService.short_desc_ar || ''
                      : selectedService.details_en || selectedService.short_desc_en || '',
                  }}
                />
              </div>

              <div className="modal-footer">
                <a
                  href="https://wa.me/201281717577"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-modal-inquire"
                >
                  <FaWhatsapp size={16} />
                  <span>{isRtl ? 'طلب استشارة أو معاينة ميدانية للخدمة' : 'Request Site Survey via WhatsApp'}</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer lang={lang} />
    </div>
  );
}

export default function ServicesPage() {
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
          جاري تحميل خدمات ترندلاين...
        </div>
      }
    >
      <ServicesPageContent />
    </Suspense>
  );
}
