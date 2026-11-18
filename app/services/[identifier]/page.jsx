'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/src/components/common/Navbar/Navbar';
import Footer from '@/src/components/common/Footer/Footer';
import useTrendlineLang, { formatLangHref } from '@/src/hooks/useTrendlineLang';
import { getApiHost } from '@/src/utils/apiConfig';
import {
  FaHouse,
  FaChevronLeft,
  FaChevronRight,
  FaScrewdriverWrench,
  FaShieldHalved,
  FaCircleCheck,
  FaPhone,
  FaWhatsapp,
  FaArrowLeft,
  FaArrowRight,
} from 'react-icons/fa6';
import '../ServicesPage.scss';

function SingleServiceContent() {
  const { lang, isRtl, setLang } = useTrendlineLang('ar');
  const params = useParams();
  const identifier = params?.identifier ? decodeURIComponent(String(params.identifier)) : '';

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!identifier) return;

    let isMounted = true;
    async function fetchService() {
      setLoading(true);
      try {
        const apiHost = getApiHost();
        const res = await fetch(`${apiHost}/api/v1/services/${encodeURIComponent(identifier)}`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && isMounted) {
            setService(json.data);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to load single service:', err);
      }

      if (isMounted) {
        setLoading(false);
      }
    }

    fetchService();
    return () => {
      isMounted = false;
    };
  }, [identifier]);

  const title = isRtl
    ? service?.name_ar || service?.name_en || 'خدمة ترندلاين'
    : service?.name_en || service?.name_ar || 'Trendline Service';

  const shortDesc = isRtl
    ? service?.short_desc_ar || service?.short_desc_en || ''
    : service?.short_desc_en || service?.short_desc_ar || '';

  const detailsHtml = isRtl
    ? service?.details_ar || service?.short_desc_ar || ''
    : service?.details_en || service?.short_desc_en || '';

  return (
    <div className="services-page-wrapper" dir={isRtl ? 'rtl' : 'ltr'}>
      <Navbar lang={lang} onToggleLang={setLang} />

      <main className="services-main-container">
        {/* Breadcrumb */}
        <nav className="services-breadcrumbs" aria-label="Breadcrumb">
          <Link href={formatLangHref('/', lang)} className="crumb-link">
            <FaHouse className="crumb-icon" />
            <span>{isRtl ? 'الرئيسية' : 'Home'}</span>
          </Link>
          {isRtl ? <FaChevronLeft className="crumb-sep" /> : <FaChevronRight className="crumb-sep" />}
          <Link href={formatLangHref('/services', lang)} className="crumb-link">
            <span>{isRtl ? 'خدمات ترندلاين' : 'Services'}</span>
          </Link>
          {isRtl ? <FaChevronLeft className="crumb-sep" /> : <FaChevronRight className="crumb-sep" />}
          <span className="crumb-active">{title}</span>
        </nav>

        {loading ? (
          <div className="services-loading-stage">
            <div className="loading-spinner" />
            <span>{isRtl ? 'جاري تحميل تفاصيل الخدمة...' : 'Loading service details...'}</span>
          </div>
        ) : !service ? (
          <div className="services-empty-stage">
            <FaScrewdriverWrench size={38} />
            <h3>{isRtl ? 'الخدمة غير متوفرة حالياً' : 'Service not found'}</h3>
            <p>{isRtl ? 'يرجى تصفح قائمة الخدمات المتاحة.' : 'Please check our all services list.'}</p>
            <Link href={formatLangHref('/services', lang)} className="btn-reset-search">
              {isRtl ? 'عرض كل الخدمات' : 'View All Services'}
            </Link>
          </div>
        ) : (
          <article className="single-service-detail-box" style={{ background: '#ffffff', borderRadius: '24px', padding: '36px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(15,23,42,0.04)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '999px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontSize: '13px', fontWeight: 800, marginBottom: '16px' }}>
              <FaScrewdriverWrench size={13} />
              <span>{isRtl ? 'خدمة تقنية معتمدة' : 'Certified Tech Service'}</span>
            </div>

            <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', marginBottom: '14px', lineHeight: 1.3 }}>{title}</h1>

            {shortDesc && (
              <p style={{ fontSize: '16px', color: '#475569', lineHeight: 1.7, marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
                {shortDesc}
              </p>
            )}

            {service.cover_image && (
              <div style={{ borderRadius: '16px', overflow: 'hidden', maxHeight: '380px', marginBottom: '32px' }}>
                <img src={service.cover_image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}

            <div
              className="service-rich-details"
              style={{ fontSize: '15px', lineHeight: 1.8, color: '#334155', marginBottom: '36px' }}
              dangerouslySetInnerHTML={{ __html: detailsHtml }}
            />

            <div style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)', borderRadius: '18px', padding: '28px', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px' }}>{isRtl ? 'هل ترغب في طلب هذه الخدمة أو استشارة فريقنا؟' : 'Ready to request this service?'}</h3>
                <p style={{ fontSize: '13.5px', color: '#dbeafe', margin: 0 }}>{isRtl ? 'تواصل معنا مباشرة للمعاينة الميدانية وتقديم عرض الأسعار الفني.' : 'Contact us directly for a survey and detailed proposal.'}</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <a href="https://wa.me/201281717577" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#16a34a', color: '#fff', padding: '12px 20px', borderRadius: '10px', fontWeight: 800, textDecoration: 'none', fontSize: '13.5px' }}>
                  <FaWhatsapp size={15} />
                  <span>{isRtl ? 'طلب عبر واتساب' : 'WhatsApp'}</span>
                </a>
                <Link href={formatLangHref('/services', lang)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '12px 18px', borderRadius: '10px', fontWeight: 700, textDecoration: 'none', fontSize: '13.5px' }}>
                  <span>{isRtl ? 'باقي الخدمات' : 'All Services'}</span>
                  {isRtl ? <FaArrowLeft size={11} /> : <FaArrowRight size={11} />}
                </Link>
              </div>
            </div>
          </article>
        )}
      </main>

      <Footer lang={lang} />
    </div>
  );
}

export default function SingleServicePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>جاري التحميل...</div>}>
      <SingleServiceContent />
    </Suspense>
  );
}
