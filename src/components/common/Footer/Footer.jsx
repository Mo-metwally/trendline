'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  FaTruckFast,
  FaAward,
  FaShieldHalved,
  FaPhone,
  FaEnvelope,
  FaLocationDot,
  FaClock,
  FaPaperPlane,
  FaUser,
  FaWhatsapp,
  FaChevronUp,
  FaCircleCheck,
  FaMicrochip,
  FaBoxesStacked,
  FaHeadset,
  FaCheck,
  FaCopy,
  FaLock,
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaTiktok,
} from 'react-icons/fa6';
import { formatLangHref } from '@/src/hooks/useTrendlineLang';
import { getApiHost } from '@/src/utils/apiConfig';
import './Footer.scss';

export default function Footer({ lang = 'ar', showContactTrust = true }) {
  const isRtl = lang === 'ar';

  // Inquiry category selection
  const inquiryCategories = isRtl
    ? [
        { id: 'gaming', label: '💻 تجميعة قيمنق وهندسي' },
        { id: 'maintenance', label: '⚡ صيانة وترقية حاسوب' },
        { id: 'enterprise', label: '🏢 شبكات وحلول شركات' },
        { id: 'general', label: '💬 استفسار عام أو طلب شراء' },
      ]
    : [
        { id: 'gaming', label: '💻 Custom PC Build' },
        { id: 'maintenance', label: '⚡ Hardware Upgrade' },
        { id: 'enterprise', label: '🏢 Enterprise Network' },
        { id: 'general', label: '💬 General Inquiry' },
      ];

  const [selectedInquiry, setSelectedInquiry] = useState(inquiryCategories[0].id);

  // Contact Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Scroll to Top visibility
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 350);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyPhoneNumber = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText('+201281717577');
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2500);
  };

  // Submit Contact Form
  const handleSubmitContact = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setSubmitError(isRtl ? 'يرجى ملء جميع الحقول المطلوبة (الاسم، البريد، والرسالة)' : 'Please fill all required fields');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    const categoryObj = inquiryCategories.find((c) => c.id === selectedInquiry);
    const enrichedMessage = `[تصنيف الاستفسار: ${categoryObj?.label || selectedInquiry}]\n${formData.message}`;

    try {
      const apiHost = getApiHost();
      const res = await fetch(`${apiHost}/api/v1/cms/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          message: enrichedMessage,
          locale: isRtl ? 'ar' : 'en',
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSubmitSuccess(true);
        setFormData({ full_name: '', email: '', phone: '', message: '' });
      } else {
        setSubmitError(json.message || (isRtl ? 'فشل إرسال الرسالة، يرجى المحاولة لاحقاً' : 'Failed to send message'));
      }
    } catch (err) {
      console.error('Contact submit error:', err);
      setSubmitError(isRtl ? 'تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً' : 'Server connection error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="trendline-footer-root-wrapper" dir={isRtl ? 'rtl' : 'ltr'} suppressHydrationWarning>
      {/* Top Ambient Glow & Cyber Horizon */}
      <div className="footer-top-cyber-horizon" />

      {/* =========================================================================
          SECTION 1: ULTRA-LUXURY CONTACT & TRUST STAGE (DEEP COSMIC GLASS)
          ========================================================================= */}
      {showContactTrust && (
        <section className="contact-trust-stage" id="contact-section">
          <div className="stage-ambient-light light-1" />
          <div className="stage-ambient-light light-2" />

          <div className="stage-container">
            {/* Stage Header */}
            <div className="stage-header">
              <div className="stage-live-badge">
                <span className="live-pulse-dot" />
                <span>
                  {isRtl
                    ? 'مركز استشارات ودعم ترندلاين المعتمد | مهندسونا في خدمتك الآن'
                    : 'Trendline Certified Engineering & Support Hub | Online Now'}
                </span>
              </div>
              <h2 className="stage-title">
                {isRtl ? 'تواصل معنا أو اطلب استشارتك التقنية' : 'Get In Touch & Request Tech Advice'}
              </h2>
              <p className="stage-desc">
                {isRtl
                  ? 'سواء كنت تخطط لتجميع بي سي قيمنق خارق، ترقية حاسوبك، أو تجهيز شبكات وأنظمة متكاملة لشركتك، خبراء ترندلاين يقدمون لك الدعم الأمثل باحترافية وتوافقية تامة.'
                  : 'Whether building an extreme gaming rig, upgrading hardware, or setting up corporate networks, our certified engineers deliver tailored guidance with 100% compatibility.'}
              </p>
            </div>

            {/* Split Grid: Left Form Card & Right Capability Matrix */}
            <div className="stage-main-grid">
              {/* Form Card (Liquid Tech Terminal) */}
              <div className="contact-terminal-card">
                <div className="terminal-card-top-bar">
                  <div className="terminal-dots">
                    <span className="dot dot-red" />
                    <span className="dot dot-amber" />
                    <span className="dot dot-green" />
                  </div>
                  <div className="terminal-status-text">
                    <FaHeadset size={12} />
                    <span>{isRtl ? 'مستشار المبيعات والدعم جاهز للرد' : 'Support Engineer Ready'}</span>
                  </div>
                </div>

                {submitSuccess ? (
                  <div className="terminal-success-state">
                    <div className="success-icon-halo">
                      <FaCircleCheck size={40} />
                    </div>
                    <h3>{isRtl ? 'تم استلام طلبك ورسالتك بنجاح!' : 'Your Inquiry Was Received Successfully!'}</h3>
                    <p>
                      {isRtl
                        ? 'شكراً لتواصلك مع ترندلاين. سيقوم أحد مهندسينا بمراجعة متطلباتك والتواصل معك سريعاً عبر الهاتف أو الواتساب.'
                        : 'Thank you for reaching out. One of our engineers will review your specs and contact you via phone or WhatsApp shortly.'}
                    </p>
                    <button
                      type="button"
                      className="btn-terminal-reset"
                      onClick={() => setSubmitSuccess(false)}
                    >
                      {isRtl ? 'إرسال طلب أو استفسار آخر' : 'Send Another Inquiry'}
                    </button>
                  </div>
                ) : (
                  <form className="terminal-form" onSubmit={handleSubmitContact}>
                    {submitError && <div className="terminal-error-notice">{submitError}</div>}

                    {/* Inquiry Type Chips */}
                    <div className="inquiry-chips-group">
                      <span className="inquiry-label">
                        {isRtl ? 'اختر مجال استفسارك:' : 'Select inquiry type:'}
                      </span>
                      <div className="chips-row">
                        {inquiryCategories.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            className={`inquiry-chip ${selectedInquiry === cat.id ? 'active' : ''}`}
                            onClick={() => setSelectedInquiry(cat.id)}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Input Row: Name & Phone */}
                    <div className="inputs-two-col">
                      <div className="terminal-field">
                        <label>{isRtl ? 'الاسم بالكامل *' : 'Full Name *'}</label>
                        <div className="field-inner">
                          <FaUser className="field-icon" size={13} />
                          <input
                            type="text"
                            placeholder={isRtl ? 'مثال: أحمد عبد الله' : 'e.g. Ahmed Abdullah'}
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="terminal-field">
                        <label>{isRtl ? 'رقم الهاتف / الواتساب' : 'Phone / WhatsApp'}</label>
                        <div className="field-inner">
                          <FaPhone className="field-icon" size={13} />
                          <input
                            type="tel"
                            dir="ltr"
                            placeholder={isRtl ? '01xxxxxxxxx' : '+20 1xxxxxxxxx'}
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Email Field */}
                    <div className="terminal-field">
                      <label>{isRtl ? 'البريد الإلكتروني *' : 'Email Address *'}</label>
                      <div className="field-inner">
                        <FaEnvelope className="field-icon" size={13} />
                        <input
                          type="email"
                          placeholder={isRtl ? 'your.name@example.com' : 'your.name@example.com'}
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {/* Message Field */}
                    <div className="terminal-field">
                      <label>
                        {isRtl ? 'تفاصيل الطلب أو الاستفسار *' : 'Inquiry Details or Hardware Specs *'}
                      </label>
                      <div className="field-inner textarea-inner">
                        <textarea
                          rows={3}
                          placeholder={
                            isRtl
                              ? 'اكتب مواصفات التجميعة المطلوبة، الميزانية المقترحة، أو أي استفسار ترغب به...'
                              : 'Describe your desired PC specifications, target budget, or general questions...'
                          }
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button type="submit" className="terminal-submit-btn" disabled={submitting}>
                      {submitting ? (
                        <span>{isRtl ? 'جاري الإرسال والمعالجة...' : 'Sending Inquiry...'}</span>
                      ) : (
                        <>
                          <span>{isRtl ? 'إرسال الاستفسار الآن' : 'Submit Inquiry Now'}</span>
                          <FaPaperPlane size={13} />
                        </>
                      )}
                    </button>

                    {/* Instant Direct Connect Buttons */}
                    <div className="terminal-direct-connect">
                      <a
                        href="https://wa.me/201281717577?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%20%D8%AA%D8%B1%D9%86%D8%AF%D9%84%D8%A7%D9%8A%D9%86%D8%8C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8A%20%D8%A7%D8%B3%D8%AA%D8%B4%D8%A7%D8%B1%D8%A9%20%D8%AA%D9%82%D9%86%D9%8A%D8%A9%20%D8%AD%D9%88%D9%84%20%D8%A7%D9%84%D8%A3%D8%AC%D9%87%D8%B2%D8%A9"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-fast-connect btn-fast-whatsapp"
                      >
                        <FaWhatsapp size={15} />
                        <span>{isRtl ? 'محادثة واتساب فورية' : 'Instant WhatsApp'}</span>
                      </a>
                      <a href="tel:+201281717577" className="btn-fast-connect btn-fast-phone">
                        <FaPhone size={13} />
                        <span>{isRtl ? 'اتصال مباشر بالمعرض' : 'Direct Call'}</span>
                      </a>
                    </div>
                  </form>
                )}
              </div>

              {/* Capability Matrix & Store Location (Right Side) */}
              <div className="stage-capabilities-col">
                <div className="capabilities-grid">
                  {/* Card 1: Fast & Insured Shipping */}
                  <div className="capability-card glow-blue">
                    <div className="cap-icon-pod">
                      <FaTruckFast size={22} />
                    </div>
                    <div className="cap-content">
                      <div className="cap-top-row">
                        <h4 className="cap-title">{isRtl ? 'شحن فائق السرعة وتغليف مصفّح' : 'Express Insured Delivery'}</h4>
                        <span className="cap-badge">{isRtl ? 'خلال 24-48 ساعة' : '24-48h Delivery'}</span>
                      </div>
                      <p className="cap-desc">
                        {isRtl
                          ? 'توصيل سريع ومؤمن لكافة محافظات مصر لباب منزلك مع تغليف احترافي مضاد للصدمات لحماية الهاردوير.'
                          : 'Door-to-door express delivery across all Egyptian governorates with protective anti-shock packaging.'}
                      </p>
                    </div>
                  </div>

                  {/* Card 2: 100% Genuine & Official Warranty */}
                  <div className="capability-card glow-amber">
                    <div className="cap-icon-pod">
                      <FaAward size={22} />
                    </div>
                    <div className="cap-content">
                      <div className="cap-top-row">
                        <h4 className="cap-title">{isRtl ? 'ضمان الوكلاء المعتمدين 100%' : '100% Genuine & Certified'}</h4>
                        <span className="cap-badge badge-amber">{isRtl ? 'جديد بالكامل' : 'Brand New'}</span>
                      </div>
                      <p className="cap-desc">
                        {isRtl
                          ? 'جميع قطع الهاردوير والأجهزة أصلية وجديدة بالكامل بفواتير رسمية وضمان محلي معتمد من الوكلاء.'
                          : 'All hardware and components are 100% authentic and brand new with official distributor warranty.'}
                      </p>
                    </div>
                  </div>

                  {/* Card 3: Consumer Protection & 14-day Returns */}
                  <div className="capability-card glow-emerald">
                    <div className="cap-icon-pod">
                      <FaShieldHalved size={22} />
                    </div>
                    <div className="cap-content">
                      <div className="cap-top-row">
                        <h4 className="cap-title">{isRtl ? 'حماية المستهلك واستبدال مرن' : 'Easy 14-Day Returns'}</h4>
                        <span className="cap-badge badge-emerald">{isRtl ? '14 يوم استبدال' : '14-Day Guarantee'}</span>
                      </div>
                      <p className="cap-desc">
                        {isRtl
                          ? 'حقوقك محفوظة بالكامل مع مهلة 14 يوماً للاستبدال أو الاسترجاع في حال وجود أي عيب صناعة بكل سلاسة.'
                          : 'Full consumer protection with 14-day return and replacement policy in case of any manufacturing defects.'}
                      </p>
                    </div>
                  </div>

                  {/* Card 4: Engineering Compatibility & Stress Testing */}
                  <div className="capability-card glow-purple">
                    <div className="cap-icon-pod">
                      <FaMicrochip size={22} />
                    </div>
                    <div className="cap-content">
                      <div className="cap-top-row">
                        <h4 className="cap-title">{isRtl ? 'فحص هندسي وتوافقية تامة' : 'Engineering Stress-Testing'}</h4>
                        <span className="cap-badge badge-purple">{isRtl ? '100% توافقية' : '100% Tested'}</span>
                      </div>
                      <p className="cap-desc">
                        {isRtl
                          ? 'تجميعات البي سي يتم فحصها واختبار ثباتها وحرارتها تحت أقصى ضغط قبل التسليم لضمان الأداء الفائق.'
                          : 'Custom rigs undergo strict thermal and stability benchmark stress tests before handover to ensure peak performance.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Physical Store HQ & Live Status Card */}
                <div className="store-presence-card">
                  <div className="store-presence-header">
                    <div className="presence-pin-icon">
                      <FaLocationDot size={18} />
                    </div>
                    <div className="presence-titles">
                      <div className="presence-status-row">
                        <span className="store-status-pill">
                          <span className="status-live-dot" />
                          <span>{isRtl ? 'المعرض مفتوح ويستقبلكم الآن' : 'Showroom Open Now'}</span>
                        </span>
                        <span className="presence-hours">
                          <FaClock size={11} />
                          <span>{isRtl ? 'يومياً 9:00 ص – 12:00 م' : 'Daily 9:00 AM – 12:00 AM'}</span>
                        </span>
                      </div>
                      <h4 className="store-name">
                        {isRtl ? 'معرض ومقر ترندلاين تك (مول البستان التجاري)' : 'Trendline Systems Flagship Showroom'}
                      </h4>
                    </div>
                  </div>
                  <p className="store-address-text">
                    {isRtl
                      ? 'متجر صابر - الطابق السفلي - مول البستان التجاري - 5 شارع يوسف الجندي - باب اللوق، وسط البلد، القاهرة.'
                      : 'Saber Store - Lower Ground Floor - El-Bostan Commercial Mall - 5 Youssef El-Guindy St - Bab El-Louk, Downtown, Cairo.'}
                  </p>
                  <div className="store-actions-row">
                    <a
                      href="https://maps.google.com/?q=El-Bostan+Mall+Bab+El+Louk+Cairo"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="store-map-link"
                    >
                      <FaLocationDot size={12} />
                      <span>{isRtl ? 'عرض الموقع في خرائط Google' : 'View on Google Maps'}</span>
                    </a>
                    <button
                      type="button"
                      className="store-copy-btn"
                      onClick={copyPhoneNumber}
                      title={isRtl ? 'نسخ رقم الهاتف المباشر' : 'Copy direct hotline'}
                    >
                      {copiedPhone ? <FaCheck size={12} /> : <FaCopy size={12} />}
                      <span>
                        {copiedPhone
                          ? isRtl
                            ? 'تم النسخ!'
                            : 'Copied!'
                          : isRtl
                          ? 'نسخ الهاتف: 01281717577'
                          : 'Copy Tel: +201281717577'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 2: MASTER STOREFRONT TECH FOOTER (COSMIC OBSIDIAN GLASS)
          ========================================================================= */}
      <footer className="master-tech-footer" suppressHydrationWarning>
        <div className="footer-container">
          {/* Top Brand Horizon Row */}
          <div className="footer-brand-horizon">
            <div className="horizon-brand-side">
              <Link href={formatLangHref('/', lang)} className="footer-brand-logo-link">
                <Image
                  src="/assets/logo.png"
                  alt="Trendline Systems"
                  width={190}
                  height={54}
                  className="footer-brand-logo"
                  priority={false}
                />
              </Link>
              <div className="brand-tagline-block">
                <span className="brand-badge-est">{isRtl ? 'منذ 2019' : 'Est. 2019'}</span>
                <p className="brand-motto">
                  {isRtl
                    ? 'ترندلاين سيستمز — وجهتك الأولى لأقوى أجهزة الكمبيوتر، الهاردوير الاحترافي، والحلول التكنولوجية المتكاملة في مصر.'
                    : 'Trendline Systems — Egypt’s premier destination for enterprise tech, custom rigs, and performance PC components.'}
                </p>
              </div>
            </div>

            {/* Social Media Cluster */}
            <div className="horizon-social-cluster">
              <span className="social-label">{isRtl ? 'تابعنا على المنصات:' : 'Connect with us:'}</span>
              <div className="social-icons-row">
                <a
                  href="https://wa.me/201281717577"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon-btn whatsapp"
                  aria-label="WhatsApp"
                >
                  <FaWhatsapp size={16} />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon-btn facebook"
                  aria-label="Facebook"
                >
                  <FaFacebookF size={15} />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon-btn instagram"
                  aria-label="Instagram"
                >
                  <FaInstagram size={16} />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon-btn youtube"
                  aria-label="YouTube"
                >
                  <FaYoutube size={16} />
                </a>
                <a
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon-btn tiktok"
                  aria-label="TikTok"
                >
                  <FaTiktok size={15} />
                </a>
              </div>
            </div>
          </div>

          {/* 4 Architectural Columns */}
          <div className="footer-columns-quad">
            {/* Col 1: ركائز وقيم ترندلاين (Our Foundation) */}
            <div className="quad-col col-pillars">
              <h4 className="quad-heading">{isRtl ? 'عن ترندلاين تك' : 'About Trendline'}</h4>
              <div className="pillars-flow">
                <div className="pillar-tile">
                  <span className="pillar-dot" />
                  <div className="pillar-text">
                    <strong className="pillar-name">{isRtl ? 'الخبرة العميقة:' : 'Deep Expertise:'}</strong>
                    <span>
                      {isRtl
                        ? 'فريق من المتخصصين يتمتع بمعرفة واسعة في تكامل الأنظمة وبناء المحطات الاحترافية.'
                        : 'Specialized engineers offering extensive system integration capabilities.'}
                    </span>
                  </div>
                </div>

                <div className="pillar-tile">
                  <span className="pillar-dot" />
                  <div className="pillar-text">
                    <strong className="pillar-name">{isRtl ? 'الجودة الصارمة:' : 'Certified Quality:'}</strong>
                    <span>
                      {isRtl
                        ? 'نلتزم بتقديم منتجات وقطع هاردوير أصلية 100% متوافقة مع أعلى معايير الصناعة العالمية.'
                        : 'We deliver 100% genuine components meeting global performance standards.'}
                    </span>
                  </div>
                </div>

                <div className="pillar-tile">
                  <span className="pillar-dot" />
                  <div className="pillar-text">
                    <strong className="pillar-name">{isRtl ? 'العميل أولاً:' : 'Customer Care:'}</strong>
                    <span>
                      {isRtl
                        ? 'رضاكم هو أولويتنا، نقدم استشارات فنية مخصصة ودعماً فنياً حقيقياً لما بعد البيع.'
                        : 'Your satisfaction is our priority, backed by custom consultation and aftersales care.'}
                    </span>
                  </div>
                </div>

                <div className="pillar-tile">
                  <span className="pillar-dot" />
                  <div className="pillar-text">
                    <strong className="pillar-name">{isRtl ? 'الابتكار المستمر:' : 'Continuous Innovation:'}</strong>
                    <span>
                      {isRtl
                        ? 'نوظف أحدث التقنيات لتقديم حلول مبتكرة وفعالة تلبي تطلعات المستقبل الرقمي.'
                        : 'Deploying the newest technological breakthroughs to power future workloads.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Col 2: روابط التصفح والأقسام (Shop & Categories) */}
            <div className="quad-col col-nav">
              <h4 className="quad-heading">{isRtl ? 'الأقسام والتسوق' : 'Shop & Explore'}</h4>
              <ul className="footer-links-list">
                <li>
                  <Link href={formatLangHref('/', lang)}>
                    <span className="link-hover-indicator" />
                    <span>{isRtl ? 'الصفحة الرئيسية' : 'Home'}</span>
                  </Link>
                </li>
                <li>
                  <Link href={formatLangHref('/products', lang)}>
                    <span className="link-hover-indicator" />
                    <span>{isRtl ? 'جميع المنتجات والهاردوير' : 'All Products & Hardware'}</span>
                  </Link>
                </li>
                <li>
                  <Link href={formatLangHref('/categories', lang)}>
                    <span className="link-hover-indicator" />
                    <span>{isRtl ? 'الأقسام والتصنيفات' : 'Categories Directory'}</span>
                  </Link>
                </li>
                <li>
                  <Link href={formatLangHref('/products?on_sale=true', lang)}>
                    <span className="link-hover-indicator" />
                    <span>{isRtl ? 'العروض والتخفيضات الكبرى' : 'Hot Deals & Discounts'}</span>
                  </Link>
                </li>
                <li>
                  <Link href={formatLangHref('/products?sort=created_at_desc', lang)}>
                    <span className="link-hover-indicator" />
                    <span>{isRtl ? 'وصل حديثاً للمتجر' : 'New Arrivals'}</span>
                  </Link>
                </li>
                <li>
                  <Link href={formatLangHref('/services', lang)}>
                    <span className="link-hover-indicator" />
                    <span>{isRtl ? 'خدمات ترندلاين الهندسية' : 'Engineering Services'}</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: خدمات الدعم والعملاء (Customer Self-Service) */}
            <div className="quad-col col-support">
              <h4 className="quad-heading">{isRtl ? 'خدمات ومساعدة العملاء' : 'Customer Care'}</h4>
              <ul className="footer-links-list">
                <li className="highlighted-track-item">
                  <Link href={formatLangHref('/track-order', lang)} className="track-order-link">
                    <span className="track-icon-pod">
                      <FaBoxesStacked size={13} />
                    </span>
                    <span className="track-title-text">{isRtl ? 'تتبع حالة شحنتك المباشرة' : 'Live Order Tracking'}</span>
                    <span className="track-pill-new">{isRtl ? 'خدمة ذاتية' : 'Self-Service'}</span>
                  </Link>
                </li>
                <li>
                  <Link href={formatLangHref('/cart', lang)}>
                    <span className="link-hover-indicator" />
                    <span>{isRtl ? 'سلة المشتريات وإتمام الطلب' : 'Cart & Checkout'}</span>
                  </Link>
                </li>
                <li>
                  <a href="#contact-section">
                    <span className="link-hover-indicator" />
                    <span>{isRtl ? 'طلب صيانة أو دعم فني' : 'Technical Support Request'}</span>
                  </a>
                </li>
                <li>
                  <Link href={formatLangHref('/track-order', lang)}>
                    <span className="link-hover-indicator" />
                    <span>{isRtl ? 'تعديل أو إلغاء الطلب قبل الشحن' : 'Modify / Cancel Order'}</span>
                  </Link>
                </li>
                <li>
                  <span className="policy-note-item">
                    <FaShieldHalved size={12} />
                    <span>{isRtl ? 'ضمان استبدال 14 يوماً وحماية المستهلك' : '14-Day Consumer Protection'}</span>
                  </span>
                </li>
              </ul>
            </div>

            {/* Col 4: بيانات المقر والتواصل (Contact & HQ) */}
            <div className="quad-col col-contact-hq">
              <h4 className="quad-heading">{isRtl ? 'المقر والتواصل المباشر' : 'HQ & Direct Contact'}</h4>
              <div className="contact-hq-card">
                {/* Phone */}
                <div className="hq-detail-row">
                  <div className="hq-icon-bubble">
                    <FaPhone size={13} />
                  </div>
                  <div className="hq-meta">
                    <span className="hq-label">{isRtl ? 'الهاتف المباشر والمعرض:' : 'Direct Hotline:'}</span>
                    <a href="tel:+201281717577" className="hq-link tel" dir="ltr">
                      +20 128 171 7577
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="hq-detail-row">
                  <div className="hq-icon-bubble">
                    <FaEnvelope size={13} />
                  </div>
                  <div className="hq-meta">
                    <span className="hq-label">{isRtl ? 'البريد الإلكتروني:' : 'Email Address:'}</span>
                    <a href="mailto:ahmed.sayed@trendlineeg.com" className="hq-link email" dir="ltr">
                      ahmed.sayed@trendlineeg.com
                    </a>
                  </div>
                </div>

                {/* Address */}
                <div className="hq-detail-row">
                  <div className="hq-icon-bubble">
                    <FaLocationDot size={13} />
                  </div>
                  <div className="hq-meta">
                    <span className="hq-label">{isRtl ? 'العنوان والمقر الرسمي:' : 'Official Location:'}</span>
                    <span className="hq-text">
                      {isRtl
                        ? 'متجر صابر - الطابق السفلي - مول البستان التجاري - 5 شارع يوسف الجندي - باب اللوق، القاهرة'
                        : 'Saber Store - Lower Ground Floor - El-Bostan Mall - 5 Youssef El-Guindy St - Bab El-Louk, Cairo'}
                    </span>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="hq-detail-row">
                  <div className="hq-icon-bubble">
                    <FaClock size={13} />
                  </div>
                  <div className="hq-meta">
                    <span className="hq-label">{isRtl ? 'مواعيد العمل الرسمية:' : 'Working Hours:'}</span>
                    <span className="hq-text">
                      {isRtl ? 'يومياً من 9:00 صباحاً حتى 12:00 منتصف الليل' : 'Daily 9:00 AM – 12:00 AM'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secure Payment & Certified Security Bar */}
          <div className="footer-payment-security-strip">
            <div className="payment-security-left">
              <div className="security-icon-badge">
                <FaLock size={15} />
              </div>
              <div className="security-text">
                <h5 className="security-title">
                  {isRtl ? 'دفع آمن 100% ومشفّر بتشفير SSL 256-Bit' : '100% Secure 256-Bit SSL Payments'}
                </h5>
                <p className="security-subtitle">
                  {isRtl
                    ? 'نوفر لك خيارات دفع مرنة ومتعددة تناسب احتياجاتك مع سرية وأمان تام لمعلوماتك'
                    : 'Flexible payment options with maximum enterprise confidentiality'}
                </p>
              </div>
            </div>

            {/* Official High-Definition Badges */}
            <div className="payment-badges-row">
              <span className="pay-badge visa-badge">VISA</span>
              <span className="pay-badge master-badge">
                <span className="circle-red" />
                <span className="circle-yellow" />
                <span>Mastercard</span>
              </span>
              <span className="pay-badge meeza-badge">
                <span className="meeza-logo-text">ميزة</span>
              </span>
              <span className="pay-badge instapay-badge">
                <span className="insta-dot" />
                <span>InstaPay</span>
              </span>
              <span className="pay-badge vodafone-badge">
                <span className="voda-dot" />
                <span>Vodafone Cash</span>
              </span>
              <span className="pay-badge cod-badge">
                <FaCheck size={11} />
                <span>{isRtl ? 'الدفع عند الاستلام' : 'Cash On Delivery'}</span>
              </span>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Missan VIP Credit */}
          <div className="footer-bottom-bar">
            <div className="copyright-info">
              <span>© 2019 - 2026 TrendLine Systems Eg. {isRtl ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</span>
            </div>
            <div className="tax-record-info">
              <span>
                {isRtl
                  ? 'سجل تجاري وبطاقة ضريبية معتمدة | متجر إلكتروني مصري مرخص'
                  : 'Certified Commercial Register & Tax Card | Licensed Egyptian Entity'}
              </span>
            </div>
            <div className="developer-credit">
              <span>{isRtl ? 'تصميم وتطوير: ' : 'Designed & Developed by: '}</span>
              <a
                href="https://missanvip.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="developer-name-link"
              >
                Missan VIP
              </a>
            </div>
          </div>
        </div>

        {/* Floating Quick Action Cluster (WhatsApp + Scroll to Top) */}
        <div className="floating-actions-cluster">
          <a
            href="https://wa.me/201281717577?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%20%D8%AA%D8%B1%D9%86%D8%AF%D9%84%D8%A7%D9%8A%D9%86%D8%8C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8A%20%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B3%D8%B1%D9%8A%D8%B9"
            target="_blank"
            rel="noopener noreferrer"
            className="floating-btn whatsapp-btn"
            aria-label="WhatsApp Support"
            title={isRtl ? 'تحدث مباشرة مع فريق ترندلاين عبر واتساب' : 'Chat with Trendline on WhatsApp'}
          >
            <div className="whatsapp-pulse-ring" />
            <FaWhatsapp size={24} />
          </a>

          {showScrollTop && (
            <button
              type="button"
              className="floating-btn scroll-top-btn"
              onClick={scrollToTop}
              aria-label={isRtl ? 'الرجوع لأعلى الصفحة' : 'Scroll to top'}
              title={isRtl ? 'الرجوع لأعلى الصفحة' : 'Scroll to top'}
            >
              <FaChevronUp size={16} />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
