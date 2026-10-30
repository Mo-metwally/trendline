'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FaBolt,
  FaGaugeHigh,
  FaMicrochip,
  FaShieldHalved,
  FaWifi,
  FaBatteryFull,
  FaCamera,
  FaAward,
  FaHeadset,
  FaCloud,
  FaMobileScreen,
  FaVolumeHigh,
  FaLock,
  FaTruckFast,
  FaGear,
  FaFire,
  FaCheck,
  FaPlus,
  FaTrashCan,
  FaPenToSquare,
  FaEye,
  FaWandMagicSparkles,
  FaChevronLeft,
  FaRotateLeft,
  FaSliders,
  FaLayerGroup,
  FaXmark,
  FaArrowsRotate,
} from 'react-icons/fa6';
import './ProductShowcaseStudio.scss';

export const ICON_PRESETS = [
  { key: 'award', label: 'ضمان وجودة', icon: FaAward },
  { key: 'truck', label: 'شحن سريع', icon: FaTruckFast },
  { key: 'shield', label: 'حماية وأمان', icon: FaShieldHalved },
  { key: 'headset', label: 'دعم فني 24/7', icon: FaHeadset },
  { key: 'bolt', label: 'طاقة / PoE', icon: FaBolt },
  { key: 'gauge', label: 'أداء وسرعة', icon: FaGaugeHigh },
  { key: 'microchip', label: 'معالج / شريحة', icon: FaMicrochip },
  { key: 'wifi', label: 'شبكات وواي فاي', icon: FaWifi },
  { key: 'battery', label: 'بطارية وشحن', icon: FaBatteryFull },
  { key: 'camera', label: 'كاميرا وعدسة', icon: FaCamera },
  { key: 'cloud', label: 'ربط سحابي', icon: FaCloud },
  { key: 'mobile', label: 'تطبيق ذكي', icon: FaMobileScreen },
  { key: 'volume', label: 'صوت ومايك', icon: FaVolumeHigh },
  { key: 'lock', label: 'تشفير وخصوصية', icon: FaLock },
  { key: 'gear', label: 'إعداد سهل', icon: FaGear },
  { key: 'fire', label: 'الأكثر طلباً', icon: FaFire },
];

export const renderPillarIcon = (iconKey, size = 18) => {
  const match = ICON_PRESETS.find((p) => p.key === iconKey);
  if (match) {
    const IconComp = match.icon;
    return <IconComp size={size} />;
  }
  return <FaAward size={size} />;
};

export const DEFAULT_SHOWCASE_TABS = {
  custom_enabled: false, // Optional studio, disabled by default
  tabs: {
    description: {
      enabled: true,
      title_ar: 'وصف المنتج',
      title_en: 'Description',
      heading_ar: 'وصف المنتج',
      heading_en: 'Product Description',
      content_ar: '',
      content_en: '',
    },
    specs: {
      enabled: false, // Disabled by default -> only description tab shows
      title_ar: 'المواصفات الفنية',
      title_en: 'Specifications',
      heading_ar: 'ملخص المواصفات الفنية الدقيقة',
      heading_en: 'Technical Specifications Summary',
      content_ar: '',
      content_en: '',
    },
    features: {
      enabled: false, // Disabled by default
      title_ar: 'المميزات',
      title_en: 'Key Features',
      heading_ar: 'أبرز المميزات التنافسية',
      heading_en: 'Key Competitive Features',
      bullet_points: [], // Will sync from specifications
    },
    warranty: {
      enabled: false, // Disabled by default
      title_ar: 'سياسة الضمان',
      title_en: 'Warranty & Support',
      heading_ar: 'سياسة الضمان والدعم الفني المعتمد',
      heading_en: 'Warranty & Customer Support Policy',
      content_ar:
        'ضمان رسمي معتمد من ترند لاين والوكيل المحلي، مع إمكانية الفحص والمعاينة عند الاستلام، وسياسة استبدال واسترجاع مرنة خلال 14 يوماً، بالإضافة إلى دعم فني متخصص للمساعدة في الإعداد والتشغيل.',
      content_en:
        'Official authorized warranty from Trendline and authorized distributors, with full inspection upon delivery, a flexible 14-day return and exchange policy, and dedicated technical support.',
    },
  },
  pillars: [
    {
      icon: 'award',
      title_ar: 'ضمان الجودة',
      title_en: 'Quality Guarantee',
      subtitle_ar: 'ضمان أصلي ومعتمد 100%',
      subtitle_en: '100% Certified Original',
    },
    {
      icon: 'truck',
      title_ar: 'شحن سريع',
      title_en: 'Fast Shipping',
      subtitle_ar: 'توصيل آمن وموثوق لباب منزلك',
      subtitle_en: 'Fast & Secure Door Delivery',
    },
    {
      icon: 'shield',
      title_ar: 'حماية المستهلك',
      title_en: 'Consumer Protection',
      subtitle_ar: 'استبدال واسترجاع ميسر ومرن',
      subtitle_en: 'Easy & Flexible Return Policy',
    },
    {
      icon: 'headset',
      title_ar: 'دعم فني',
      title_en: 'Technical Support',
      subtitle_ar: 'مساعدة متخصصة على مدار 24/7',
      subtitle_en: '24/7 Dedicated Assistance',
    },
  ],
};

export const PACKAGE_PRESETS = [
  {
    name: 'الخدمات القياسية (الافتراضية)',
    pillars: [
      { icon: 'award', title_ar: 'ضمان الجودة', title_en: 'Quality Guarantee', subtitle_ar: 'ضمان أصلي ومعتمد 100%', subtitle_en: '100% Certified Original' },
      { icon: 'truck', title_ar: 'شحن سريع', title_en: 'Fast Shipping', subtitle_ar: 'توصيل آمن وموثوق لباب منزلك', subtitle_en: 'Fast & Secure Door Delivery' },
      { icon: 'shield', title_ar: 'حماية المستهلك', title_en: 'Consumer Protection', subtitle_ar: 'استبدال واسترجاع ميسر ومرن', subtitle_en: 'Easy & Flexible Return Policy' },
      { icon: 'headset', title_ar: 'دعم فني', title_en: 'Technical Support', subtitle_ar: 'مساعدة متخصصة على مدار 24/7', subtitle_en: '24/7 Dedicated Assistance' },
    ],
  },
  {
    name: 'كاميرات ومراقبة (CCTV)',
    pillars: [
      { icon: 'shield', title_ar: 'أمان متقدم', title_en: 'Advanced Security', subtitle_ar: 'حماية متكاملة وتشفير بيانات', subtitle_en: 'Full Protection & Encryption' },
      { icon: 'camera', title_ar: 'رؤية ليلية 24/7', title_en: '24/7 Night Vision', subtitle_ar: 'دقة فائقة ورصد حي', subtitle_en: 'Ultra HD & Live Monitoring' },
      { icon: 'microchip', title_ar: 'رصد بشري ذكي', title_en: 'AI Human Detection', subtitle_ar: 'ذكاء اصطناعي وتتبع حركي', subtitle_en: 'Smart Motion Tracking' },
      { icon: 'bolt', title_ar: 'تشغيل PoE+', title_en: 'PoE+ Powered', subtitle_ar: 'طاقة وبيانات بكابل واحد', subtitle_en: 'Single Cable Power & Data' },
    ],
  },
  {
    name: 'شبكات وراوترات (Networking)',
    pillars: [
      { icon: 'wifi', title_ar: 'تغطية واسعة', title_en: 'Broad Coverage', subtitle_ar: 'تقنية Wi-Fi 6 فائقة السرعة', subtitle_en: 'Ultra-Fast Wi-Fi 6 Tech' },
      { icon: 'gauge', title_ar: 'أداء مستقر', title_en: 'Stable Performance', subtitle_ar: 'معالج قوي يتحمل الضغط العالي', subtitle_en: 'Robust Multi-Core CPU' },
      { icon: 'microchip', title_ar: 'إدارة ذكية', title_en: 'Smart Management', subtitle_ar: 'تحكم ومراقبة عبر التطبيق', subtitle_en: 'Cloud & App Management' },
      { icon: 'shield', title_ar: 'جدار حماية', title_en: 'Firewall Defense', subtitle_ar: 'حماية كاملة ضد الاختراقات', subtitle_en: 'Comprehensive Cyber Defense' },
    ],
  },
  {
    name: 'لابتوبات وكمبيوتر (Hardware)',
    pillars: [
      { icon: 'microchip', title_ar: 'معالج متطور', title_en: 'Advanced Processor', subtitle_ar: 'أداء قوي للمهام الثقيلة', subtitle_en: 'Heavy Duty Performance' },
      { icon: 'gauge', title_ar: 'سرعة استجابة', title_en: 'Ultra-Fast Response', subtitle_ar: 'ذاكرة تخزين فائقة السرعة', subtitle_en: 'High-Speed NVMe Storage' },
      { icon: 'battery', title_ar: 'بطارية تدوم', title_en: 'All-Day Battery', subtitle_ar: 'تشغيل متواصل ودعم الشحن السريع', subtitle_en: 'Long Life & Fast Charge' },
      { icon: 'award', title_ar: 'جودة تصنيع', title_en: 'Premium Build', subtitle_ar: 'خامات عالية وتبريد ذكي', subtitle_en: 'Durable Chassis & Smart Cool' },
    ],
  },
  {
    name: 'أجهزة منزلية وإلكترونيات (Appliances)',
    pillars: [
      { icon: 'bolt', title_ar: 'توفير الطاقة', title_en: 'Energy Efficient', subtitle_ar: 'استهلاك اقتصادي ذكي', subtitle_en: 'Eco-Friendly Smart Power' },
      { icon: 'mobile', title_ar: 'تحكم ذكي', title_en: 'Smart Control', subtitle_ar: 'تطبيق موبايل وتكامل صوتي', subtitle_en: 'App & Voice Integration' },
      { icon: 'award', title_ar: 'خامات متينة', title_en: 'Durable Materials', subtitle_ar: 'تصميم صحي ومقاوم للاهتراء', subtitle_en: 'Food-Grade Robust Design' },
      { icon: 'shield', title_ar: 'أمان معتمد', title_en: 'Certified Safety', subtitle_ar: 'حماية من السخونة والجهد الزائد', subtitle_en: 'Surge & Overheat Protection' },
    ],
  },
];

export default function ProductShowcaseStudio({
  showcaseTabs,
  onChange,
  productContext = {},
  isRtl = true,
}) {
  const [activeSubView, setActiveSubView] = useState('tabs'); // 'tabs' | 'pillars' | 'preview'
  const [previewTab, setPreviewTab] = useState('description');
  const [previewLang, setPreviewLang] = useState('ar'); // 'ar' | 'en'
  const [editingIconIndex, setEditingIconIndex] = useState(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setEditingIconIndex(null);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setEditingIconIndex(null);
      }
    };

    if (editingIconIndex !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [editingIconIndex]);

  const state = showcaseTabs || DEFAULT_SHOWCASE_TABS;
  const isCustomEnabled = state.custom_enabled === true;
  const tabs = state.tabs || DEFAULT_SHOWCASE_TABS.tabs;
  const pillars = Array.isArray(state.pillars) && state.pillars.length > 0
    ? state.pillars
    : DEFAULT_SHOWCASE_TABS.pillars;

  const handleToggleCustomStudio = (enabled) => {
    onChange({
      ...state,
      custom_enabled: enabled,
    });
  };

  const handleUpdateTab = (tabKey, updates) => {
    const nextTabs = {
      ...tabs,
      [tabKey]: {
        ...tabs[tabKey],
        ...updates,
      },
    };
    onChange({
      ...state,
      tabs: nextTabs,
    });
  };

  const handleUpdatePillar = (index, updates) => {
    const nextPillars = pillars.map((p, idx) => (idx === index ? { ...p, ...updates } : p));
    onChange({
      ...state,
      pillars: nextPillars,
    });
  };

  const handleAddPillar = () => {
    if (pillars.length >= 6) return;
    const nextPillars = [
      ...pillars,
      {
        icon: 'award',
        title_ar: 'ميزة إضافية',
        title_en: 'Extra Feature',
        subtitle_ar: 'وصف تفصيلي للميزة المعتمدة',
        subtitle_en: 'Certified feature description',
      },
    ];
    onChange({
      ...state,
      pillars: nextPillars,
    });
  };

  const handleRemovePillar = (index) => {
    if (pillars.length <= 1) return;
    const nextPillars = pillars.filter((_, idx) => idx !== index);
    onChange({
      ...state,
      pillars: nextPillars,
    });
  };

  const handleApplyPresetPackage = (pkg) => {
    onChange({
      ...state,
      pillars: [...pkg.pillars],
    });
  };

  // Bullet points in Features tab: support both Arabic & English
  const handleAddBulletPoint = (initialAr = '', initialEn = '') => {
    const currentPoints = tabs.features?.bullet_points || [];
    handleUpdateTab('features', {
      bullet_points: [
        ...currentPoints,
        {
          ar: initialAr || 'ميزة تنافسية جديدة للمنتج...',
          en: initialEn || 'New competitive feature...',
        },
      ],
    });
  };

  const handleUpdateBulletPoint = (index, field, value) => {
    const currentPoints = [...(tabs.features?.bullet_points || [])];
    const prev = currentPoints[index];
    if (typeof prev === 'string') {
      currentPoints[index] = {
        ar: field === 'ar' ? value : prev,
        en: field === 'en' ? value : '',
      };
    } else {
      currentPoints[index] = {
        ar: '',
        en: '',
        ...prev,
        [field]: value,
      };
    }
    handleUpdateTab('features', { bullet_points: currentPoints });
  };

  const handleRemoveBulletPoint = (index) => {
    const currentPoints = (tabs.features?.bullet_points || []).filter((_, idx) => idx !== index);
    handleUpdateTab('features', { bullet_points: currentPoints });
  };

  // Sync points from Technical Specifications entered above (Card 6)
  const handleSyncFromSpecs = () => {
    const rawSpecs = productContext.specifications;
    if (!Array.isArray(rawSpecs) || rawSpecs.length === 0) return;
    const validSpecs = rawSpecs.filter(
      (s) =>
        (s.key_ar && s.key_ar.trim()) ||
        (s.key_en && s.key_en.trim()) ||
        (s.key && s.key.trim())
    );
    if (validSpecs.length === 0) return;

    const points = validSpecs.map((s) => {
      const arKey = (s.key_ar || s.key || '').trim();
      const arVal = (s.value_ar || s.value || '').trim();
      const enKey = (s.key_en || s.key_ar || s.key || '').trim();
      const enVal = (s.value_en || s.value_ar || s.value || '').trim();
      return {
        ar: arVal ? `${arKey}: ${arVal}` : arKey,
        en: enVal ? `${enKey}: ${enVal}` : enKey,
      };
    });

    handleUpdateTab('features', {
      bullet_points: points,
    });
  };

  const handleResetDefaults = () => {
    onChange(DEFAULT_SHOWCASE_TABS);
  };

  // Count valid specs from Card 6
  const validSpecsList = Array.isArray(productContext.specifications)
    ? productContext.specifications.filter(
        (s) =>
          (s.key_ar && s.key_ar.trim()) ||
          (s.key_en && s.key_en.trim()) ||
          (s.key && s.key.trim())
      )
    : [];

  return (
    <div className={`product-showcase-studio-card form-section-card ${!isCustomEnabled ? 'mode-standard-disabled' : 'mode-custom-active'}`}>
      <div className="section-header">
        <div className="title-wrap">
          <div className="header-icon-badge">
            <FaLayerGroup />
          </div>
          <div>
            <div className="title-row-top">
              <h3>استوديو تخصيص تبويبات ومميزات عرض المنتج</h3>
              <span className={`studio-status-pill ${isCustomEnabled ? 'active' : 'optional'}`}>
                {isCustomEnabled ? '● التخصيص المتقدم مفعّل' : '○ اختياري (وضع العرض الافتراضي القياسي)'}
              </span>
            </div>
            <p>
              تحكم بالتبويبات التي تظهر للمشتري في صفحة المنتج (عربي / إنجليزي) مع تخصيص بطاقات الأيقونات الترويجية ونقاط المميزات.
            </p>
          </div>
        </div>

        <div className="header-actions">
          {isCustomEnabled ? (
            <>
              <button
                type="button"
                className="btn-disable-studio"
                onClick={() => handleToggleCustomStudio(false)}
                title="إلغاء التخصيص والرجوع للوضع الافتراضي التلقائي"
              >
                <span>تعطيل والرجوع للوضع الافتراضي</span>
              </button>
              <button
                type="button"
                className="btn-reset-defaults"
                onClick={handleResetDefaults}
                title="استعادة الإعدادات النموذجية"
              >
                <FaRotateLeft size={12} />
                <span>استعادة الافتراضي</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn-enable-studio-top"
              onClick={() => handleToggleCustomStudio(true)}
            >
              <FaWandMagicSparkles size={13} />
              <span>تفعيل وتخصيص التبويبات والمميزات (عربي / إنجليزي)</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= OPTIONAL DISABLED BANNER (Standard Default Mode) ================= */}
      {!isCustomEnabled ? (
        <div className="studio-optional-banner">
          <div className="banner-top-info">
            <div className="banner-heading-wrap">
              <span className="banner-badge">وضع العرض القياسي التلقائي (السكشن اختياري)</span>
              <h4>هذا السكشن اختياري بالكامل — سيتم اعتماد العرض التلقائي النظيف التالي:</h4>
            </div>
            <button
              type="button"
              className="btn-activate-custom"
              onClick={() => handleToggleCustomStudio(true)}
            >
              <FaWandMagicSparkles />
              <span>تخصيص التبويبات والمميزات المتقدمة الآن</span>
            </button>
          </div>

          <div className="default-rules-grid">
            <div className="rule-card">
              <span className="rule-title">📑 تبويبات العرض بالصفحة:</span>
              <p>
                يتم إظهار <strong>تبويب "وصف المنتج" فقط</strong> (المواصفات الفنية، المميزات، والضمان معطلة افتراضياً لتفادي تكرار التبويبات).
              </p>
            </div>

            <div className="rule-card">
              <span className="rule-title">⚡ المميزات التنافسية:</span>
              <p>
                تُعتمد تلقائياً من <strong>المواصفات الفنية والسمات التقنية</strong> المدخلة في القسم السابق ({validSpecsList.length} مواصفة متوفرة حالياً).
              </p>
            </div>

            <div className="rule-card wide">
              <span className="rule-title">🛡️ بطاقات الخدمات الترويجية الـ 4 الافتراضية للعميل:</span>
              <div className="default-pillars-preview-row">
                <div className="mini-pillar-chip">
                  <span className="pillar-icon-sym"><FaAward /></span>
                  <div className="p-text">
                    <strong>ضمان الجودة</strong>
                    <small>Quality Guarantee</small>
                  </div>
                </div>
                <div className="mini-pillar-chip">
                  <span className="pillar-icon-sym"><FaTruckFast /></span>
                  <div className="p-text">
                    <strong>شحن سريع</strong>
                    <small>Fast Shipping</small>
                  </div>
                </div>
                <div className="mini-pillar-chip">
                  <span className="pillar-icon-sym"><FaShieldHalved /></span>
                  <div className="p-text">
                    <strong>حماية المستهلك</strong>
                    <small>Consumer Protection</small>
                  </div>
                </div>
                <div className="mini-pillar-chip">
                  <span className="pillar-icon-sym"><FaHeadset /></span>
                  <div className="p-text">
                    <strong>دعم فني</strong>
                    <small>Technical Support</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= FULL ADVANCED STUDIO ACTIVE ================= */
        <>
          {/* Navigation Sub-Tabs */}
          <div className="studio-nav-tabs">
            <button
              type="button"
              className={`s-tab-btn ${activeSubView === 'tabs' ? 'active' : ''}`}
              onClick={() => setActiveSubView('tabs')}
            >
              <FaSliders size={13} />
              <span>1. إدارة التبويبات والمحتوى ({[tabs.description?.enabled, tabs.specs?.enabled, tabs.features?.enabled, tabs.warranty?.enabled].filter(Boolean).length} مفعلة)</span>
            </button>

            <button
              type="button"
              className={`s-tab-btn ${activeSubView === 'pillars' ? 'active' : ''}`}
              onClick={() => setActiveSubView('pillars')}
            >
              <FaBolt size={13} />
              <span>2. بطاقات وأيقونات المميزات ({pillars.length} بطاقات)</span>
            </button>

            <button
              type="button"
              className={`s-tab-btn ${activeSubView === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveSubView('preview')}
            >
              <FaEye size={13} />
              <span>3. المعاينة المباشرة كما تظهر للعميل</span>
            </button>
          </div>

          <div className="studio-content-body">
            {/* ================= VIEW 1: TABS & CONTENT CONTROLS (AR / EN) ================= */}
            {activeSubView === 'tabs' && (
              <div className="tabs-management-panel">
                {/* TAB 1: DESCRIPTION */}
                <div className="tab-control-card essential-card">
                  <div className="card-top">
                    <div className="title-side">
                      <span className="tab-number">1</span>
                      <div>
                        <h4>تبويب: وصف المنتج (Product Description)</h4>
                        <span className="essential-badge">أساسي (دائماً مفعل في صفحة المنتج)</span>
                      </div>
                    </div>
                    <div className="toggle-wrapper locked">
                      <span className="toggle-label active">● مفعل أساسي</span>
                    </div>
                  </div>

                  <div className="card-fields">
                    <div className="field-group">
                      <label>عنوان التبويب في القائمة (عربي)</label>
                      <input
                        type="text"
                        className="studio-input"
                        value={tabs.description?.title_ar || 'وصف المنتج'}
                        onChange={(e) => handleUpdateTab('description', { title_ar: e.target.value })}
                      />
                    </div>

                    <div className="field-group">
                      <label>Tab Title in Menu (English)</label>
                      <input
                        type="text"
                        className="studio-input"
                        dir="ltr"
                        value={tabs.description?.title_en || 'Description'}
                        onChange={(e) => handleUpdateTab('description', { title_en: e.target.value })}
                      />
                    </div>

                    <div className="field-group">
                      <label>العنوان الرئيسي أعلى محتوى الوصف (عربي)</label>
                      <input
                        type="text"
                        className="studio-input"
                        value={tabs.description?.heading_ar || 'وصف المنتج'}
                        onChange={(e) => handleUpdateTab('description', { heading_ar: e.target.value })}
                      />
                    </div>

                    <div className="field-group">
                      <label>Main Section Heading (English)</label>
                      <input
                        type="text"
                        className="studio-input"
                        dir="ltr"
                        value={tabs.description?.heading_en || 'Product Description'}
                        onChange={(e) => handleUpdateTab('description', { heading_en: e.target.value })}
                      />
                    </div>

                    <div className="field-group full-width">
                      <div className="field-hint-row">
                        <label>نص مخصص للتبويب بالعربية (اختياري)</label>
                        <span className="hint">إذا تُرك فارغاً، سيتم استخدام وصف المنتج الأساسي تلقائياً</span>
                      </div>
                      <textarea
                        rows={2}
                        className="studio-textarea"
                        placeholder="اتركه فارغاً ليتم استخدام وصف المنتج المدخل في أعلى الصفحة..."
                        value={tabs.description?.content_ar || ''}
                        onChange={(e) => handleUpdateTab('description', { content_ar: e.target.value })}
                      />
                    </div>

                    <div className="field-group full-width">
                      <div className="field-hint-row">
                        <label>Custom Tab Content in English (Optional)</label>
                        <span className="hint">If left empty, default English description from product fields will be used</span>
                      </div>
                      <textarea
                        rows={2}
                        className="studio-textarea"
                        dir="ltr"
                        placeholder="Leave empty to use main product English description..."
                        value={tabs.description?.content_en || ''}
                        onChange={(e) => handleUpdateTab('description', { content_en: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* TAB 2: TECHNICAL SPECIFICATIONS */}
                <div className={`tab-control-card ${tabs.specs?.enabled ? 'enabled' : 'disabled'}`}>
                  <div className="card-top">
                    <div className="title-side">
                      <span className="tab-number">2</span>
                      <div>
                        <h4>تبويب: المواصفات الفنية (Technical Specifications)</h4>
                        <span className="sub-desc">يعرض ملخصاً هندسياً يسبق جدول المواصفات الفنية الكامل</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`btn-toggle-tab ${tabs.specs?.enabled ? 'active' : 'inactive'}`}
                      onClick={() => handleUpdateTab('specs', { enabled: !tabs.specs?.enabled })}
                    >
                      {tabs.specs?.enabled ? '● مفعل للظهور' : '○ معطل (مخفي)'}
                    </button>
                  </div>

                  {tabs.specs?.enabled && (
                    <div className="card-fields">
                      <div className="field-group">
                        <label>عنوان التبويب في القائمة (عربي)</label>
                        <input
                          type="text"
                          className="studio-input"
                          value={tabs.specs?.title_ar || 'المواصفات الفنية'}
                          onChange={(e) => handleUpdateTab('specs', { title_ar: e.target.value })}
                        />
                      </div>

                      <div className="field-group">
                        <label>Tab Title in Menu (English)</label>
                        <input
                          type="text"
                          className="studio-input"
                          dir="ltr"
                          value={tabs.specs?.title_en || 'Specifications'}
                          onChange={(e) => handleUpdateTab('specs', { title_en: e.target.value })}
                        />
                      </div>

                      <div className="field-group">
                        <label>العنوان الرئيسي للقسم (عربي)</label>
                        <input
                          type="text"
                          className="studio-input"
                          value={tabs.specs?.heading_ar || 'ملخص المواصفات الفنية الدقيقة'}
                          onChange={(e) => handleUpdateTab('specs', { heading_ar: e.target.value })}
                        />
                      </div>

                      <div className="field-group">
                        <label>Main Section Heading (English)</label>
                        <input
                          type="text"
                          className="studio-input"
                          dir="ltr"
                          value={tabs.specs?.heading_en || 'Technical Specifications Summary'}
                          onChange={(e) => handleUpdateTab('specs', { heading_en: e.target.value })}
                        />
                      </div>

                      <div className="field-group full-width">
                        <label>نص المقدمة التعريفية للمواصفات (عربي)</label>
                        <textarea
                          rows={2}
                          className="studio-textarea"
                          value={tabs.specs?.content_ar || ''}
                          onChange={(e) => handleUpdateTab('specs', { content_ar: e.target.value })}
                        />
                      </div>

                      <div className="field-group full-width">
                        <label>Introductory Specifications Text (English)</label>
                        <textarea
                          rows={2}
                          className="studio-textarea"
                          dir="ltr"
                          value={tabs.specs?.content_en || ''}
                          onChange={(e) => handleUpdateTab('specs', { content_en: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* TAB 3: FEATURES (BULLET POINTS & SYNC FROM SPECS) */}
                <div className={`tab-control-card ${tabs.features?.enabled ? 'enabled' : 'disabled'}`}>
                  <div className="card-top">
                    <div className="title-side">
                      <span className="tab-number">3</span>
                      <div>
                        <h4>تبويب: المميزات التنافسية (Competitive Features)</h4>
                        <span className="sub-desc">قائمة نقطية منسقة بأقوى نقاط القوة والتفوق للمنتج</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`btn-toggle-tab ${tabs.features?.enabled ? 'active' : 'inactive'}`}
                      onClick={() => handleUpdateTab('features', { enabled: !tabs.features?.enabled })}
                    >
                      {tabs.features?.enabled ? '● مفعل للظهور' : '○ معطل (مخفي)'}
                    </button>
                  </div>

                  {tabs.features?.enabled && (
                    <div className="card-fields">
                      <div className="field-group">
                        <label>عنوان التبويب في القائمة (عربي)</label>
                        <input
                          type="text"
                          className="studio-input"
                          value={tabs.features?.title_ar || 'المميزات'}
                          onChange={(e) => handleUpdateTab('features', { title_ar: e.target.value })}
                        />
                      </div>

                      <div className="field-group">
                        <label>Tab Title in Menu (English)</label>
                        <input
                          type="text"
                          className="studio-input"
                          dir="ltr"
                          value={tabs.features?.title_en || 'Key Features'}
                          onChange={(e) => handleUpdateTab('features', { title_en: e.target.value })}
                        />
                      </div>

                      <div className="field-group">
                        <label>العنوان الرئيسي للقسم (عربي)</label>
                        <input
                          type="text"
                          className="studio-input"
                          value={tabs.features?.heading_ar || 'أبرز المميزات التنافسية'}
                          onChange={(e) => handleUpdateTab('features', { heading_ar: e.target.value })}
                        />
                      </div>

                      <div className="field-group">
                        <label>Main Section Heading (English)</label>
                        <input
                          type="text"
                          className="studio-input"
                          dir="ltr"
                          value={tabs.features?.heading_en || 'Key Competitive Features'}
                          onChange={(e) => handleUpdateTab('features', { heading_en: e.target.value })}
                        />
                      </div>

                      {/* Bullet points builder & sync */}
                      <div className="bullet-points-builder full-width">
                        <div className="bp-header">
                          <div>
                            <label>نقاط المميزات التنافسية (عربي / إنجليزي)</label>
                            <span className="bp-sub-hint">
                              تظهر كنقاط مرتبة في صفحة المنتج، ويمكنك استيرادها مباشرة من المواصفات الفنية المدخلة أعلاه.
                            </span>
                          </div>

                          <div className="bp-actions-row">
                            {validSpecsList.length > 0 && (
                              <button
                                type="button"
                                className="btn-sync-specs"
                                onClick={handleSyncFromSpecs}
                                title="استيراد وتوليد النقاط من جدول المواصفات الفنية"
                              >
                                <FaArrowsRotate size={11} />
                                <span>استيراد من المواصفات الفنية ({validSpecsList.length})</span>
                              </button>
                            )}

                            <button
                              type="button"
                              className="btn-add-bullet"
                              onClick={() => handleAddBulletPoint()}
                            >
                              <FaPlus size={11} />
                              <span>إضافة نقطة ميزة</span>
                            </button>
                          </div>
                        </div>

                        {/* If points are empty and specs exist, show helper prompt */}
                        {(!tabs.features?.bullet_points || tabs.features.bullet_points.length === 0) && validSpecsList.length > 0 && (
                          <div className="specs-sync-callout">
                            <span>💡 لم يتم إدخال نقاط مميزات بعد — هل ترغب في سحب ({validSpecsList.length}) مواصفات فنية تلقائياً كنقاط مميزات؟</span>
                            <button type="button" className="btn-callout-sync" onClick={handleSyncFromSpecs}>
                              مزامنة المواصفات الآن
                            </button>
                          </div>
                        )}

                        <div className="bullets-list">
                          {(tabs.features?.bullet_points || []).map((point, pIdx) => {
                            const pointAr = typeof point === 'object' ? (point.ar || '') : point;
                            const pointEn = typeof point === 'object' ? (point.en || '') : '';

                            return (
                              <div className="bullet-item-row-bilingual" key={pIdx}>
                                <span className="bullet-num">#{pIdx + 1}</span>
                                <div className="bullet-inputs-pair">
                                  <input
                                    type="text"
                                    className="studio-input bullet-input-ar"
                                    value={pointAr}
                                    onChange={(e) => handleUpdateBulletPoint(pIdx, 'ar', e.target.value)}
                                    placeholder="نص الميزة بالعربية (مثال: دقة تصوير 4K فائقة الوضوح)..."
                                  />
                                  <input
                                    type="text"
                                    className="studio-input bullet-input-en"
                                    dir="ltr"
                                    value={pointEn}
                                    onChange={(e) => handleUpdateBulletPoint(pIdx, 'en', e.target.value)}
                                    placeholder="Feature in English (e.g. Ultra HD 4K Clear Resolution)..."
                                  />
                                </div>
                                <button
                                  type="button"
                                  className="btn-delete-bullet"
                                  onClick={() => handleRemoveBulletPoint(pIdx)}
                                  title="حذف هذه النقطة"
                                >
                                  <FaTrashCan size={12} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* TAB 4: WARRANTY & SUPPORT */}
                <div className={`tab-control-card ${tabs.warranty?.enabled ? 'enabled' : 'disabled'}`}>
                  <div className="card-top">
                    <div className="title-side">
                      <span className="tab-number">4</span>
                      <div>
                        <h4>تبويب: سياسة الضمان والدعم الفني (Warranty & Support)</h4>
                        <span className="sub-desc">توضيح فترة الضمان وسياسة الاسترجاع المعتمدة لزيادة ثقة المشتري</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`btn-toggle-tab ${tabs.warranty?.enabled ? 'active' : 'inactive'}`}
                      onClick={() => handleUpdateTab('warranty', { enabled: !tabs.warranty?.enabled })}
                    >
                      {tabs.warranty?.enabled ? '● مفعل للظهور' : '○ معطل (مخفي)'}
                    </button>
                  </div>

                  {tabs.warranty?.enabled && (
                    <div className="card-fields">
                      <div className="field-group">
                        <label>عنوان التبويب في القائمة (عربي)</label>
                        <input
                          type="text"
                          className="studio-input"
                          value={tabs.warranty?.title_ar || 'سياسة الضمان'}
                          onChange={(e) => handleUpdateTab('warranty', { title_ar: e.target.value })}
                        />
                      </div>

                      <div className="field-group">
                        <label>Tab Title in Menu (English)</label>
                        <input
                          type="text"
                          className="studio-input"
                          dir="ltr"
                          value={tabs.warranty?.title_en || 'Warranty & Support'}
                          onChange={(e) => handleUpdateTab('warranty', { title_en: e.target.value })}
                        />
                      </div>

                      <div className="field-group">
                        <label>العنوان الرئيسي للقسم (عربي)</label>
                        <input
                          type="text"
                          className="studio-input"
                          value={tabs.warranty?.heading_ar || 'سياسة الضمان والدعم الفني المعتمد'}
                          onChange={(e) => handleUpdateTab('warranty', { heading_ar: e.target.value })}
                        />
                      </div>

                      <div className="field-group">
                        <label>Main Section Heading (English)</label>
                        <input
                          type="text"
                          className="studio-input"
                          dir="ltr"
                          value={tabs.warranty?.heading_en || 'Certified Warranty & Support Policy'}
                          onChange={(e) => handleUpdateTab('warranty', { heading_en: e.target.value })}
                        />
                      </div>

                      <div className="field-group full-width">
                        <label>تفاصيل سياسة الضمان والاستبدال (عربي)</label>
                        <textarea
                          rows={2}
                          className="studio-textarea"
                          value={tabs.warranty?.content_ar || ''}
                          onChange={(e) => handleUpdateTab('warranty', { content_ar: e.target.value })}
                        />
                      </div>

                      <div className="field-group full-width">
                        <label>Warranty & Return Policy Details (English)</label>
                        <textarea
                          rows={2}
                          className="studio-textarea"
                          dir="ltr"
                          value={tabs.warranty?.content_en || ''}
                          onChange={(e) => handleUpdateTab('warranty', { content_en: e.target.value })}
                        />

                        {/* Quick Warranty Presets */}
                        <div className="quick-warranty-chips">
                          <span className="chip-lbl">قوالب ضمان ثنائية اللغة:</span>
                          <button
                            type="button"
                            className="warranty-chip"
                            onClick={() =>
                              handleUpdateTab('warranty', {
                                content_ar:
                                  'ضمان رسمي معتمد لمدة عام كامل ضد عيوب الصناعة مع استبدال فوري خلال 14 يوماً من تاريخ الاستلام.',
                                content_en:
                                  '1-Year official authorized manufacturer warranty with 14-day instant replacement upon delivery.',
                              })
                            }
                          >
                            ضمان سنة كاملة (1 Year)
                          </button>
                          <button
                            type="button"
                            className="warranty-chip"
                            onClick={() =>
                              handleUpdateTab('warranty', {
                                content_ar:
                                  'ضمان الوكيل المعتمد لمدة عامين يشمل الصيانة المجانية وقطع الغيار الأصلية ودعم فني متخصص.',
                                content_en:
                                  '2-Year authorized distributor warranty covering free maintenance, genuine parts, and expert tech support.',
                              })
                            }
                          >
                            ضمان الوكيل سنتين (2 Years)
                          </button>
                          <button
                            type="button"
                            className="warranty-chip"
                            onClick={() =>
                              handleUpdateTab('warranty', {
                                content_ar:
                                  'إمكانية الفحص والمعاينة عند الاستلام قبل الدفع، مع حق الاستبدال أو الاسترجاع خلال 14 يوماً.',
                                content_en:
                                  'Inspection on delivery before payment, with flexible 14-day return and exchange policy.',
                              })
                            }
                          >
                            فحص عند الاستلام + 14 يوم استرجاع
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= VIEW 2: FEATURE PILLARS & ICON PRESETS (AR / EN) ================= */}
            {activeSubView === 'pillars' && (
              <div className="pillars-management-panel">
                {/* Quick Packages Bar */}
                <div className="preset-packages-box">
                  <div className="pkg-header">
                    <FaWandMagicSparkles className="sparkle-icon" />
                    <div>
                      <strong>باقات قوالب أيقونات ومميزات جاهزة (عربي / إنجليزي):</strong>
                      <span>اختر قالباً يناسب نوع المنتج لتعبئة البطاقات الـ 4 بأيقونات ونصوص احترافية فوراً</span>
                    </div>
                  </div>

                  <div className="packages-row">
                    {PACKAGE_PRESETS.map((pkg, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        className="btn-package-preset"
                        onClick={() => handleApplyPresetPackage(pkg)}
                      >
                        <span>{pkg.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pillars Cards Editor */}
                <div className="pillars-cards-editor">
                  <div className="editor-top-bar">
                    <h4>بطاقات المميزات الترويجية ({pillars.length} بطاقات معروضة بالأسفل)</h4>
                    {pillars.length < 6 && (
                      <button
                        type="button"
                        className="btn-add-pillar"
                        onClick={handleAddPillar}
                      >
                        <FaPlus size={11} />
                        <span>إضافة بطاقة ميزة</span>
                      </button>
                    )}
                  </div>

                  <div className="pillar-cards-grid">
                    {pillars.map((pillar, idx) => {
                      const isOpen = editingIconIndex === idx;
                      return (
                        <div
                          className={`pillar-editor-card ${isOpen ? 'has-active-popover' : ''}`}
                          key={idx}
                          ref={isOpen ? popoverRef : null}
                        >
                          <div className="pillar-card-header">
                            <span className="card-num">بطاقة #{idx + 1}</span>
                            {pillars.length > 1 && (
                              <button
                                type="button"
                                className="btn-remove-pillar"
                                onClick={() => handleRemovePillar(idx)}
                                title="حذف هذه البطاقة"
                              >
                                <FaTrashCan size={11} />
                              </button>
                            )}
                          </div>

                          <div className={`icon-selector-field ${isOpen ? 'is-open' : ''}`}>
                            <label>الأيقونة المختارة:</label>
                            <button
                              type="button"
                              className="current-icon-display"
                              onClick={() =>
                                setEditingIconIndex(isOpen ? null : idx)
                              }
                            >
                              <div className="icon-preview-box">
                                {renderPillarIcon(pillar.icon, 20)}
                              </div>
                              <span className="icon-key-lbl">
                                {ICON_PRESETS.find((p) => p.key === pillar.icon)?.label || pillar.icon}
                              </span>
                              <FaPenToSquare size={11} className="pen-icon" />
                            </button>

                            {/* Icon Dropdown / Grid Picker */}
                            {isOpen && (
                              <div className="icon-picker-popover">
                                <div className="pop-header">
                                  <span className="pop-title">اختر أيقونة من المكتبة:</span>
                                  <button
                                    type="button"
                                    className="btn-close-pop"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingIconIndex(null);
                                    }}
                                    title="إغلاق"
                                  >
                                    <FaXmark size={12} />
                                  </button>
                                </div>
                                <div className="icons-grid-picker">
                                  {ICON_PRESETS.map((preset) => {
                                    const Comp = preset.icon;
                                    const isSelected = pillar.icon === preset.key;
                                    return (
                                      <button
                                        key={preset.key}
                                        type="button"
                                        className={`icon-choice-btn ${isSelected ? 'selected' : ''}`}
                                        onClick={() => {
                                          handleUpdatePillar(idx, { icon: preset.key });
                                          setEditingIconIndex(null);
                                        }}
                                        title={preset.label}
                                      >
                                        <Comp size={18} />
                                        <span className="choice-lbl">{preset.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="pillar-inputs">
                            {/* Title AR / EN */}
                            <div className="bilingual-inputs-grid">
                              <div className="p-input-group">
                                <label>العنوان (عربي)</label>
                                <input
                                  type="text"
                                  className="studio-input"
                                  placeholder="مثال: ضمان الجودة"
                                  value={pillar.title_ar || ''}
                                  onChange={(e) =>
                                    handleUpdatePillar(idx, { title_ar: e.target.value })
                                  }
                                />
                              </div>
                              <div className="p-input-group">
                                <label>Title (English)</label>
                                <input
                                  type="text"
                                  className="studio-input"
                                  dir="ltr"
                                  placeholder="e.g. Quality Guarantee"
                                  value={pillar.title_en || ''}
                                  onChange={(e) =>
                                    handleUpdatePillar(idx, { title_en: e.target.value })
                                  }
                                />
                              </div>
                            </div>

                            {/* Subtitle AR / EN */}
                            <div className="bilingual-inputs-grid">
                              <div className="p-input-group">
                                <label>الوصف (عربي)</label>
                                <input
                                  type="text"
                                  className="studio-input"
                                  placeholder="مثال: ضمان أصلي 100%"
                                  value={pillar.subtitle_ar || ''}
                                  onChange={(e) =>
                                    handleUpdatePillar(idx, { subtitle_ar: e.target.value })
                                  }
                                />
                              </div>
                              <div className="p-input-group">
                                <label>Subtitle (English)</label>
                                <input
                                  type="text"
                                  className="studio-input"
                                  dir="ltr"
                                  placeholder="e.g. 100% Certified"
                                  value={pillar.subtitle_en || ''}
                                  onChange={(e) =>
                                    handleUpdatePillar(idx, { subtitle_en: e.target.value })
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ================= VIEW 3: LIVE PREVIEW MATCHING STOREFRONT ================= */}
            {activeSubView === 'preview' && (
              <div className="live-storefront-preview-panel">
                <div className="preview-guidance-bar">
                  <div className="guidance-text">
                    <FaEye />
                    <span>
                      معاينة تفاعلية حية تمثل شكل العرض في صفحة المنتج. يمكنك التبديل بين اللغتين وتجربة النقر على التبويبات.
                    </span>
                  </div>

                  <div className="lang-preview-switcher">
                    <button
                      type="button"
                      className={`btn-preview-lang ${previewLang === 'ar' ? 'active' : ''}`}
                      onClick={() => setPreviewLang('ar')}
                    >
                      🇸🇦 العربية
                    </button>
                    <button
                      type="button"
                      className={`btn-preview-lang ${previewLang === 'en' ? 'active' : ''}`}
                      onClick={() => setPreviewLang('en')}
                    >
                      🇬🇧 English
                    </button>
                  </div>
                </div>

                <div className="pd-details-card-preview" dir={previewLang === 'ar' ? 'rtl' : 'ltr'}>
                  <div className="pd-tabs-layout-preview">
                    {/* Vertical Tabs */}
                    <div className="pd-vertical-tabs-preview">
                      {tabs.description?.enabled && (
                        <button
                          type="button"
                          className={`v-tab-btn-p ${previewTab === 'description' ? 'active' : ''}`}
                          onClick={() => setPreviewTab('description')}
                        >
                          <span>
                            {previewLang === 'ar'
                              ? tabs.description?.title_ar || 'وصف المنتج'
                              : tabs.description?.title_en || 'Description'}
                          </span>
                          <FaChevronLeft size={12} />
                        </button>
                      )}

                      {tabs.specs?.enabled && (
                        <button
                          type="button"
                          className={`v-tab-btn-p ${previewTab === 'specs' ? 'active' : ''}`}
                          onClick={() => setPreviewTab('specs')}
                        >
                          <span>
                            {previewLang === 'ar'
                              ? tabs.specs?.title_ar || 'المواصفات الفنية'
                              : tabs.specs?.title_en || 'Specifications'}
                          </span>
                          <FaChevronLeft size={12} />
                        </button>
                      )}

                      {tabs.features?.enabled && (
                        <button
                          type="button"
                          className={`v-tab-btn-p ${previewTab === 'features' ? 'active' : ''}`}
                          onClick={() => setPreviewTab('features')}
                        >
                          <span>
                            {previewLang === 'ar'
                              ? tabs.features?.title_ar || 'المميزات'
                              : tabs.features?.title_en || 'Key Features'}
                          </span>
                          <FaChevronLeft size={12} />
                        </button>
                      )}

                      {tabs.warranty?.enabled && (
                        <button
                          type="button"
                          className={`v-tab-btn-p ${previewTab === 'warranty' ? 'active' : ''}`}
                          onClick={() => setPreviewTab('warranty')}
                        >
                          <span>
                            {previewLang === 'ar'
                              ? tabs.warranty?.title_ar || 'سياسة الضمان'
                              : tabs.warranty?.title_en || 'Warranty & Support'}
                          </span>
                          <FaChevronLeft size={12} />
                        </button>
                      )}
                    </div>

                    {/* Content Area */}
                    <div className="pd-tab-panel-preview">
                      {previewTab === 'description' && (
                        <div className="tab-pane-content">
                          <h3 className="panel-heading-p">
                            <span className="heading-bar">|</span>
                            <span>
                              {previewLang === 'ar'
                                ? tabs.description?.heading_ar || 'وصف المنتج'
                                : tabs.description?.heading_en || 'Product Description'}
                            </span>
                          </h3>
                          <div className="panel-prose-p">
                            {previewLang === 'ar'
                              ? (tabs.description?.content_ar || productContext.descriptionAr || 'يُعد هذا المنتج من الحلول الاحترافية المتقدمة المصممة لتلبية متطلبات الشركات والمؤسسات العصرية بكفاءة واعتمادية عالية.')
                              : (tabs.description?.content_en || productContext.descriptionEn || 'This product is designed with premium industrial standards, providing high reliability and performance.')}
                          </div>
                        </div>
                      )}

                      {previewTab === 'specs' && (
                        <div className="tab-pane-content">
                          <h3 className="panel-heading-p">
                            <span className="heading-bar">|</span>
                            <span>
                              {previewLang === 'ar'
                                ? tabs.specs?.heading_ar || 'ملخص المواصفات الفنية الدقيقة'
                                : tabs.specs?.heading_en || 'Technical Specifications Summary'}
                            </span>
                          </h3>
                          <div className="panel-prose-p">
                            {previewLang === 'ar'
                              ? (tabs.specs?.content_ar || 'تم تصميم هذا الطراز وفق أحدث المعايير العالمية مع توافق كامل مع البنية التحتية الرقمية الحديثة.')
                              : (tabs.specs?.content_en || 'Engineered according to modern global industry standards with full hardware compatibility.')}
                          </div>
                        </div>
                      )}

                      {previewTab === 'features' && (
                        <div className="tab-pane-content">
                          <h3 className="panel-heading-p">
                            <span className="heading-bar">|</span>
                            <span>
                              {previewLang === 'ar'
                                ? tabs.features?.heading_ar || 'أبرز المميزات التنافسية'
                                : tabs.features?.heading_en || 'Key Competitive Features'}
                            </span>
                          </h3>
                          <ul className="features-bullet-list">
                            {(tabs.features?.bullet_points || []).map((pt, pIdx) => {
                              const text = previewLang === 'ar'
                                ? (typeof pt === 'object' ? pt.ar : pt)
                                : (typeof pt === 'object' ? (pt.en || pt.ar) : pt);
                              return <li key={pIdx}>{text}</li>;
                            })}
                          </ul>
                        </div>
                      )}

                      {previewTab === 'warranty' && (
                        <div className="tab-pane-content">
                          <h3 className="panel-heading-p">
                            <span className="heading-bar">|</span>
                            <span>
                              {previewLang === 'ar'
                                ? tabs.warranty?.heading_ar || 'سياسة الضمان والدعم الفني المعتمد'
                                : tabs.warranty?.heading_en || 'Certified Warranty & Support Policy'}
                            </span>
                          </h3>
                          <div className="panel-prose-p">
                            {previewLang === 'ar'
                              ? (tabs.warranty?.content_ar || 'يأتي المنتج بضمان رسمي معتمد من ترند لاين والوكيل المحلي، مع إمكانية الفحص والمعاينة عند الاستلام.')
                              : (tabs.warranty?.content_en || 'Comes with official certified warranty with flexible exchange and dedicated support.')}
                          </div>
                        </div>
                      )}

                      {/* Feature Pillars Grid */}
                      <div className="preview-pillars-and-series">
                        <div className="preview-pillars-grid">
                          {pillars.map((pillar, idx) => (
                            <div key={idx} className="preview-pillar-card">
                              <div className="preview-pillar-icon">
                                {renderPillarIcon(pillar.icon)}
                              </div>
                              <strong>
                                {previewLang === 'ar'
                                  ? pillar.title_ar || pillar.title_en
                                  : pillar.title_en || pillar.title_ar}
                              </strong>
                              <span>
                                {previewLang === 'ar'
                                  ? pillar.subtitle_ar || pillar.subtitle_en
                                  : pillar.subtitle_en || pillar.subtitle_ar}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="preview-series-box">
                          <div className="series-text">
                            <span className="series-brand-name">
                              {productContext.brandName || 'Brand Series'}
                            </span>
                            <h5>{productContext.sku || 'PRO-SERIES'}</h5>
                            <p>{productContext.categoryName || 'الجيل الاحترافي المعتمد'}</p>
                          </div>
                          <div className="series-img-wrap">
                            <img
                              src={productContext.coverImage || '/assets/placeholder-tech.png'}
                              alt="preview"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
