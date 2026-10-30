'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getApiHost } from '@/src/utils/apiConfig';
import {
  AdminSidebar,
  AdminHeader,
  useToast,
} from '@/src/components/adminComponents';
import {
  FaBoxesStacked,
  FaPlus,
  FaMagnifyingGlass,
  FaTag,
  FaClock,
  FaCheck,
  FaPenToSquare,
  FaTrashCan,
  FaBoxOpen,
  FaPercent,
  FaXmark,
  FaCircleInfo,
  FaCoins,
  FaMoneyBillWave,
  FaCalendarDays,
  FaLayerGroup,
  FaCircleCheck,
  FaMinus,
  FaArrowRight,
  FaArrowRotateLeft,
} from 'react-icons/fa6';
import './BundleStudio.scss';

export default function BundleStudio({ isEditMode = false, bundleId = null }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const toast = useToast();

  const [mounted, setMounted] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lang, setLang] = useState('ar');
  const isRtl = lang === 'ar';

  const [products, setProducts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingBundle, setEditingBundle] = useState(null);

  // Search & Filter within Studio
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Form State
  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    description_ar: '',
    description_en: '',
    discount_type: 'percentage', // 'percentage' | 'fixed' | 'custom_price' | 'none'
    discount_value: '10',
    custom_bundle_price: '',
    expires_at: '',
    is_active: true,
    items: [], // [{ product_id, quantity }]
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const ensureAuthToken = async () => {
    if (session?.accessToken) return session.accessToken;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('token');
      if (stored) return stored;
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const parsed = JSON.parse(user);
          if (parsed?.token) return parsed.token;
        } catch (e) {}
      }
    }
    return null;
  };

  // Auth User check
  useEffect(() => {
    const savedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (session?.user) {
      setAdminUser(session.user);
    } else if (savedUser) {
      try {
        setAdminUser(JSON.parse(savedUser));
      } catch (e) {}
    }
  }, [session, status]);

  // Fetch Bundle & Products
  useEffect(() => {
    const loadStudioData = async () => {
      setLoading(true);
      try {
        const apiHost = getApiHost();
        const fetches = [
          fetch(`${apiHost}/api/v1/catalog/products?is_active=all&limit=300`),
          fetch(`${apiHost}/api/v1/catalog/bundles?all=true`),
        ];

        if (isEditMode && bundleId) {
          fetches.push(fetch(`${apiHost}/api/v1/catalog/bundles/${encodeURIComponent(bundleId)}`));
        }

        const [prodsRes, bundlesRes, singleBundleRes] = await Promise.all(fetches);

        const prodsJson = await prodsRes.json();
        const bundlesJson = await bundlesRes.json();

        if (prodsJson?.success && Array.isArray(prodsJson.data)) {
          setProducts(prodsJson.data);
        }
        if (bundlesJson?.success && Array.isArray(bundlesJson.data)) {
          setBundles(bundlesJson.data);
        }

        if (isEditMode && singleBundleRes) {
          const singleJson = await singleBundleRes.json();
          if (singleJson?.success && singleJson.data) {
            const b = singleJson.data;
            setEditingBundle(b);

            const hasDisc =
              Number(b.discount_percent || 0) > 0 ||
              Number(b.bundle_price) < Number(b.computed_original_total);

            const formattedDate = b.expires_at
              ? new Date(b.expires_at).toISOString().slice(0, 16)
              : '';

            setFormData({
              name_ar: b.name_ar || '',
              name_en: b.name_en || '',
              description_ar: b.description_ar || '',
              description_en: b.description_en || '',
              discount_type: hasDisc ? 'percentage' : 'none',
              discount_value: hasDisc
                ? String(b.effective_discount_percent || b.discount_percent || 0)
                : '',
              custom_bundle_price: String(b.effective_bundle_price || b.bundle_price || ''),
              expires_at: formattedDate,
              is_active: b.is_active !== false,
              items: (b.items || []).map((it) => ({
                product_id: String(it.product_id),
                quantity: Number(it.quantity || 1),
              })),
            });
          } else {
            toast?.error?.('تعذر العثور على الباندل المطلوبة');
            router.push('/admin/bundles');
          }
        }
      } catch (err) {
        console.error('Error loading studio data:', err);
        toast?.error?.('حدث خطأ أثناء تحميل بيانات الاستوديو');
      } finally {
        setLoading(false);
      }
    };

    loadStudioData();
  }, [isEditMode, bundleId]);

  // Product Bundles map for badge
  const productBundleCountMap = useMemo(() => {
    const map = new Map();
    bundles.forEach((b) => {
      (b.items || []).forEach((it) => {
        const pid = String(it.product_id);
        map.set(pid, (map.get(pid) || 0) + 1);
      });
    });
    return map;
  }, [bundles]);

  // Extract Categories dynamically
  const availableCategories = useMemo(() => {
    const map = new Map();
    products.forEach((p) => {
      if (Array.isArray(p.categories) && p.categories.length > 0) {
        p.categories.forEach((c) => {
          if (c && (c.id || c.name_ar)) {
            const key = String(c.id || c.name_ar);
            if (!map.has(key)) map.set(key, c.name_ar || c.name_en || 'قسم');
          }
        });
      } else if (p.category) {
        const key = String(p.category.id || p.category.name_ar);
        if (!map.has(key)) map.set(key, p.category.name_ar || p.category.name_en || 'قسم');
      } else if (p.category_name_ar) {
        if (!map.has(p.category_name_ar)) map.set(p.category_name_ar, p.category_name_ar);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  // Filtered Products for Explorer
  const filteredPickerProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== 'all') {
        const matchesCategory =
          (Array.isArray(p.categories) &&
            p.categories.some((c) => String(c?.id || c?.name_ar) === String(categoryFilter))) ||
          (p.category && String(p.category?.id || p.category?.name_ar) === String(categoryFilter)) ||
          p.category_name_ar === categoryFilter;
        if (!matchesCategory) return false;
      }

      if (productSearchTerm.trim()) {
        const q = productSearchTerm.trim().toLowerCase();
        const matchesQuery =
          p.name_ar?.toLowerCase().includes(q) ||
          p.name_en?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          String(p.id).toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }
      return true;
    });
  }, [products, productSearchTerm, categoryFilter]);

  // Live Price Calculations
  const pricingPreview = useMemo(() => {
    let originalSum = 0;
    formData.items.forEach((it) => {
      const prod = products.find((p) => String(p.id) === String(it.product_id));
      if (prod) {
        const unitPrice = Number(prod.sale_price || prod.original_price || 0);
        originalSum += unitPrice * Number(it.quantity || 1);
      }
    });

    let finalPrice = originalSum;
    let discountPct = 0;

    if (formData.discount_type === 'percentage' && Number(formData.discount_value) > 0) {
      discountPct = Math.min(99, Math.max(0, Math.round(Number(formData.discount_value))));
      finalPrice = Math.round(originalSum * (1 - discountPct / 100));
    } else if (formData.discount_type === 'fixed' && Number(formData.discount_value) > 0) {
      const fixedOff = Math.min(originalSum, Math.max(0, Number(formData.discount_value)));
      finalPrice = Math.max(0, originalSum - fixedOff);
      discountPct = originalSum > 0 ? Math.round(((originalSum - finalPrice) / originalSum) * 100) : 0;
    } else if (
      formData.discount_type === 'custom_price' &&
      formData.custom_bundle_price !== '' &&
      Number(formData.custom_bundle_price) > 0 &&
      Number(formData.custom_bundle_price) < originalSum
    ) {
      finalPrice = Number(formData.custom_bundle_price);
      discountPct = originalSum > 0 ? Math.round(((originalSum - finalPrice) / originalSum) * 100) : 0;
    }

    const savings = Math.max(0, originalSum - finalPrice);
    return { originalSum, finalPrice, discountPct, savings };
  }, [
    formData.items,
    formData.discount_type,
    formData.discount_value,
    formData.custom_bundle_price,
    products,
  ]);

  const totalItemsQty = useMemo(() => {
    return formData.items.reduce((sum, it) => sum + Number(it.quantity || 1), 0);
  }, [formData.items]);

  // Handlers
  const handleToggleProduct = (productId) => {
    const pid = String(productId);
    setFormData((prev) => {
      const exists = prev.items.some((it) => String(it.product_id) === pid);
      if (exists) {
        return {
          ...prev,
          items: prev.items.filter((it) => String(it.product_id) !== pid),
        };
      }
      return {
        ...prev,
        items: [...prev.items, { product_id: pid, quantity: 1 }],
      };
    });
  };

  const handleChangeItemQty = (productId, delta) => {
    const pid = String(productId);
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        String(it.product_id) === pid
          ? { ...it, quantity: Math.max(1, Number(it.quantity || 1) + delta) }
          : it
      ),
    }));
  };

  const handleClearAllItems = () => {
    setFormData((prev) => ({ ...prev, items: [] }));
  };

  const handleSetQuickExpiry = (days) => {
    if (days === null) {
      setFormData((prev) => ({ ...prev, expires_at: '' }));
      return;
    }
    const d = new Date();
    d.setDate(d.getDate() + days);
    const pad = (n) => String(n).padStart(2, '0');
    const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setFormData((prev) => ({ ...prev, expires_at: formatted }));
  };

  // Submit Bundle
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name_ar.trim()) {
      toast?.error?.('اسم الباندل إجباري، يرجى إدخال اسم الباندل');
      return;
    }

    if (formData.items.length === 0) {
      toast?.error?.('يرجى إضافة منتج واحد على الأقل داخل الباندل');
      return;
    }

    setSaving(true);
    try {
      const token = await ensureAuthToken();
      const apiHost = getApiHost();

      const payload = {
        name_ar: formData.name_ar.trim(),
        name_en: (formData.name_en || formData.name_ar).trim(),
        description_ar: formData.description_ar?.trim() || null,
        description_en: formData.description_en?.trim() || null,
        discount_type: formData.discount_type,
        discount_value:
          formData.discount_type === 'percentage' || formData.discount_type === 'fixed'
            ? Number(formData.discount_value || 0)
            : 0,
        bundle_price:
          formData.discount_type === 'custom_price'
            ? Number(formData.custom_bundle_price || pricingPreview.finalPrice)
            : pricingPreview.finalPrice,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
        is_active: formData.is_active,
        items: formData.items,
      };

      const url =
        isEditMode && bundleId
          ? `${apiHost}/api/v1/catalog/bundles/${encodeURIComponent(bundleId)}`
          : `${apiHost}/api/v1/catalog/bundles`;

      const res = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json?.success) {
        toast?.success?.(
          isEditMode
            ? `تم تحديث الباندل (${json.data.id}) بنجاح!`
            : `تم إنشاء الباندل الجديدة برقم (${json.data.id}) بنجاح!`
        );
        router.push('/admin/bundles');
      } else {
        toast?.error?.(json?.message || 'حدث خطأ أثناء حفظ الباندل');
      }
    } catch (err) {
      console.error(err);
      toast?.error?.('حدث خطأ في الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="admin-bundle-studio-page" dir={isRtl ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <AdminSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        lang={lang}
      />

      <div className={`admin-main-wrapper ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <AdminHeader
          adminUser={adminUser}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          isSidebarCollapsed={sidebarCollapsed}
        />

        <main className="studio-main-content">
          {/* Top Breadcrumb & Page Actions Bar */}
          <div className="studio-page-header">
            <div className="header-breadcrumbs">
              <Link href="/admin/bundles" className="back-btn-pill">
                <FaArrowRight />
                <span>الرجوع للباندلز</span>
              </Link>
              <div className="bc-trail">
                <Link href="/admin" className="trail-item">لوحة التحكم</Link>
                <span className="trail-sep">/</span>
                <Link href="/admin/bundles" className="trail-item">الباندلز والعروض</Link>
                <span className="trail-sep">/</span>
                <span className="trail-current">
                  {isEditMode ? `تعديل الباندل: ${editingBundle?.name_ar || bundleId}` : 'استوديو إنشاء باندل جديدة'}
                </span>
              </div>
            </div>

            <div className="header-action-group">
              <Link href="/admin/bundles" className="btn-secondary-link">
                إلغاء التغييرات
              </Link>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving || formData.items.length === 0}
                className="btn-primary-action"
              >
                {saving ? (
                  'جاري الحفظ...'
                ) : isEditMode ? (
                  <>
                    <FaCheck size={14} />
                    <span>حفظ تعديلات الباندل</span>
                  </>
                ) : (
                  <>
                    <FaCheck size={14} />
                    <span>حفظ ونشر الباندل</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="studio-loading-card">
              <div className="loading-spinner"></div>
              <span>جاري تحميل استوديو هندسة وتصميم الباندل...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="studio-page-form">
              {/* Studio Hero Overview Bar */}
              <div className="studio-hero-bar">
                <div className="hero-identity">
                  <div className="hero-icon-wrapper">
                    <FaBoxesStacked />
                  </div>
                  <div>
                    <div className="hero-tag-row">
                      <span className={`mode-badge ${isEditMode ? 'edit-mode' : 'create-mode'}`}>
                        {isEditMode ? 'وضع التعديل المتقدم' : 'استوديو التصميم والإنشاء'}
                      </span>
                      <span className="bundle-code-tag">
                        {isEditMode && editingBundle ? `ID: ${editingBundle.id}` : 'معرّف آلي جديد: BND-xxxxxx'}
                      </span>
                    </div>
                    <h2 className="hero-title">
                      {formData.name_ar ? formData.name_ar : 'باندل ترويجية جديدة'}
                    </h2>
                    <p className="hero-subtext">
                      قم بدمج المنتجات المتوافقة وتحديد الخصومات المناسبة لرفع متوسط سلة التسوق (AOV)
                    </p>
                  </div>
                </div>

                <div className="hero-live-kpis">
                  <div className="live-kpi-chip">
                    <span className="kpi-label">المنتجات المركبة</span>
                    <span className="kpi-val count">
                      {formData.items.length} منتجات ({totalItemsQty} قطعة)
                    </span>
                  </div>
                  <div className="live-kpi-chip">
                    <span className="kpi-label">المجموع الأصلي</span>
                    <span className="kpi-val original">
                      {pricingPreview.originalSum.toLocaleString()} ج.م
                    </span>
                  </div>
                  <div className="live-kpi-chip highlight">
                    <span className="kpi-label">سعر الباندل النهائي</span>
                    <span className="kpi-val final">
                      {pricingPreview.finalPrice.toLocaleString()} ج.م
                    </span>
                  </div>
                  {pricingPreview.savings > 0 && (
                    <div className="live-kpi-chip save">
                      <span className="kpi-label">قيمة التوفير الممنوح</span>
                      <span className="kpi-val savings">
                        %{pricingPreview.discountPct} (-{pricingPreview.savings.toLocaleString()} ج.م)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Main Studio 2-Column Grid */}
              <div className="bundle-studio-grid">
                {/* Column 1 (Right in RTL): Strategy, Marketing & Financial Simulator */}
                <div className="studio-col-strategy">
                  {/* 1. Identity & Info Card */}
                  <div className="studio-card">
                    <div className="card-header">
                      <div className="header-icon-box">
                        <FaPenToSquare />
                      </div>
                      <div>
                        <h3>1. بيانات وهوية الباندل</h3>
                        <p>المسميات التسويقية التي ستظهر للمتسوقين في المتجر</p>
                      </div>
                    </div>

                    <div className="card-body">
                      <div className="studio-field">
                        <div className="field-top-label">
                          <label>اسم الباندل بالعربية</label>
                          <span className="req-pill">مطلوب *</span>
                        </div>
                        <input
                          type="text"
                          required
                          className="studio-input"
                          placeholder="مثال: باقة المراقبة الذكية المتكاملة للمكاتب"
                          value={formData.name_ar}
                          onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                        />
                      </div>

                      <div className="studio-field">
                        <div className="field-top-label">
                          <label>اسم الباندل بالإنجليزية</label>
                          <span className="opt-pill">اختياري</span>
                        </div>
                        <input
                          type="text"
                          className="studio-input"
                          placeholder="e.g. Smart Office Surveillance Bundle"
                          value={formData.name_en}
                          onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                        />
                      </div>

                      <div className="studio-field">
                        <div className="field-top-label">
                          <label>وصف ترويجي مختصر للباندل (بالعربية)</label>
                          <span className="opt-pill">اختياري</span>
                        </div>
                        <textarea
                          rows={2}
                          className="studio-textarea"
                          placeholder="اكتب عبارة تسويقية تبرز ميزة توفير الباقة وتوافق المنتجات المعروضة..."
                          value={formData.description_ar}
                          onChange={(e) =>
                            setFormData({ ...formData, description_ar: e.target.value })
                          }
                        />
                      </div>

                      <div className="studio-field">
                        <div className="field-top-label">
                          <label>وصف ترويجي مختصر للباندل (بالإنجليزية) - Promotional Description</label>
                          <span className="opt-pill">Optional</span>
                        </div>
                        <textarea
                          rows={2}
                          dir="ltr"
                          className="studio-textarea ltr-field"
                          placeholder="e.g. Special bundle discount on selected products, save more when purchased together..."
                          value={formData.description_en}
                          onChange={(e) =>
                            setFormData({ ...formData, description_en: e.target.value })
                          }
                        />
                      </div>

                      <div className="studio-field active-toggle-field">
                        <div className="toggle-info">
                          <strong>حالة تفعيل ونشر الباندل</strong>
                          <span>عند التفعيل ستظهر مباشرة في المتجر وأسفل صفحات المنتجات المدرجة بها</span>
                        </div>
                        <button
                          type="button"
                          className={`studio-status-toggle ${formData.is_active ? 'active' : 'inactive'}`}
                          onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                        >
                          {formData.is_active ? '● مفعلة ونشطة بالمتجر' : '○ مسودة معطلة'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2. Pricing & Discount Strategy Card */}
                  <div className="studio-card">
                    <div className="card-header">
                      <div className="header-icon-box discount-icon">
                        <FaPercent />
                      </div>
                      <div>
                        <h3>2. استراتيجية الخصم والتسعير الذكي</h3>
                        <p>اختر آلية الخصم المناسبة لتحفيز العميل على شراء كامل الباقة</p>
                      </div>
                    </div>

                    <div className="card-body">
                      {/* Visual 4-mode discount cards */}
                      <div className="discount-strategy-selector">
                        <div
                          className={`strategy-btn ${formData.discount_type === 'percentage' ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, discount_type: 'percentage' })}
                        >
                          <div className="s-icon"><FaPercent /></div>
                          <div className="s-text">
                            <strong>نسبة مئوية (%)</strong>
                            <span>خصم نسبة من المجموع</span>
                          </div>
                        </div>

                        <div
                          className={`strategy-btn ${formData.discount_type === 'fixed' ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, discount_type: 'fixed' })}
                        >
                          <div className="s-icon"><FaMoneyBillWave /></div>
                          <div className="s-text">
                            <strong>خصم نقدي ثابت</strong>
                            <span>خصم مبلغ محدد (ج.م)</span>
                          </div>
                        </div>

                        <div
                          className={`strategy-btn ${formData.discount_type === 'custom_price' ? 'active' : ''}`}
                          onClick={() =>
                            setFormData({
                              ...formData,
                              discount_type: 'custom_price',
                              custom_bundle_price: String(pricingPreview.finalPrice || ''),
                            })
                          }
                        >
                          <div className="s-icon"><FaCoins /></div>
                          <div className="s-text">
                            <strong>سعر محدد يدوياً</strong>
                            <span>تحديد السعر النهائي</span>
                          </div>
                        </div>

                        <div
                          className={`strategy-btn ${formData.discount_type === 'none' ? 'active' : ''}`}
                          onClick={() =>
                            setFormData({ ...formData, discount_type: 'none', discount_value: '' })
                          }
                        >
                          <div className="s-icon"><FaLayerGroup /></div>
                          <div className="s-text">
                            <strong>بدون خصم</strong>
                            <span>تجميع بالسعر الأصلي</span>
                          </div>
                        </div>
                      </div>

                      {/* Inputs according to strategy */}
                      {formData.discount_type === 'percentage' && (
                        <div className="strategy-input-panel">
                          <div className="studio-field">
                            <label>نسبة الخصم الإجمالية على الباندل (%)</label>
                            <div className="input-with-adornment">
                              <input
                                type="number"
                                min="0"
                                max="99"
                                className="studio-input"
                                placeholder="مثال: 15"
                                value={formData.discount_value}
                                onChange={(e) =>
                                  setFormData({ ...formData, discount_value: e.target.value })
                                }
                              />
                              <span className="adornment">%</span>
                            </div>
                          </div>

                          <div className="quick-presets-row">
                            <span className="preset-label">نسب سريعة:</span>
                            {[5, 10, 15, 20, 25, 30, 50].map((pct) => (
                              <button
                                key={pct}
                                type="button"
                                className={`preset-btn ${String(formData.discount_value) === String(pct) ? 'selected' : ''}`}
                                onClick={() => setFormData({ ...formData, discount_value: String(pct) })}
                              >
                                %{pct}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {formData.discount_type === 'fixed' && (
                        <div className="strategy-input-panel">
                          <div className="studio-field">
                            <label>قيمة الخصم النقدي المباشر (ج.م)</label>
                            <div className="input-with-adornment">
                              <input
                                type="number"
                                min="0"
                                className="studio-input"
                                placeholder="مثال: 500"
                                value={formData.discount_value}
                                onChange={(e) =>
                                  setFormData({ ...formData, discount_value: e.target.value })
                                }
                              />
                              <span className="adornment">ج.م</span>
                            </div>
                          </div>

                          <div className="quick-presets-row">
                            <span className="preset-label">مبالغ شائعة:</span>
                            {[50, 100, 250, 500, 1000].map((amt) => (
                              <button
                                key={amt}
                                type="button"
                                className={`preset-btn ${String(formData.discount_value) === String(amt) ? 'selected' : ''}`}
                                onClick={() => setFormData({ ...formData, discount_value: String(amt) })}
                              >
                                {amt} ج.م
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {formData.discount_type === 'custom_price' && (
                        <div className="strategy-input-panel">
                          <div className="studio-field">
                            <div className="field-top-label">
                              <label>السعر الإجمالي المطلوب للباندل (ج.م)</label>
                              <span className="current-ref">
                                المجموع الأصلي: {pricingPreview.originalSum.toLocaleString()} ج.م
                              </span>
                            </div>
                            <div className="input-with-adornment">
                              <input
                                type="number"
                                min="1"
                                className="studio-input"
                                placeholder="أدخل السعر المطلوب بيع الباندل به..."
                                value={formData.custom_bundle_price}
                                onChange={(e) =>
                                  setFormData({ ...formData, custom_bundle_price: e.target.value })
                                }
                              />
                              <span className="adornment">ج.م</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Expiration Date Section */}
                      <div className="studio-field expiry-field-group">
                        <div className="field-top-label">
                          <label>
                            <FaCalendarDays style={{ marginLeft: '6px', color: '#64748b' }} />
                            تاريخ انتهاء صلاحية العرض الترويجي
                          </label>
                          {formData.expires_at ? (
                            <button
                              type="button"
                              className="btn-clear-date"
                              onClick={() => handleSetQuickExpiry(null)}
                            >
                              مسح التاريخ (دائم ومستمر)
                            </button>
                          ) : (
                            <span className="date-status-pill">دائم بدون انتهاء</span>
                          )}
                        </div>

                        <input
                          type="datetime-local"
                          className="studio-input date-input"
                          value={formData.expires_at}
                          onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                        />

                        <div className="quick-presets-row date-presets">
                          <span className="preset-label">فترات ذكية:</span>
                          <button
                            type="button"
                            className="preset-btn"
                            onClick={() => handleSetQuickExpiry(7)}
                          >
                            أسبوع (+7d)
                          </button>
                          <button
                            type="button"
                            className="preset-btn"
                            onClick={() => handleSetQuickExpiry(30)}
                          >
                            شهر (+30d)
                          </button>
                          <button
                            type="button"
                            className="preset-btn"
                            onClick={() => handleSetQuickExpiry(90)}
                          >
                            3 أشهر (+90d)
                          </button>
                          <button
                            type="button"
                            className="preset-btn"
                            onClick={() => handleSetQuickExpiry(null)}
                          >
                            بدون انتهاء
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Real-time Financial Simulator Card */}
                  <div className="studio-finance-card">
                    <div className="finance-header">
                      <div className="f-title">
                        <FaCoins className="f-icon" />
                        <span>المحاكي المالي اللحظي للباندل</span>
                      </div>
                      <span className="f-badge">حساب فوري دقيق</span>
                    </div>

                    <div className="finance-breakdown">
                      <div className="f-row">
                        <span className="lbl">إجمالي أسعار المنتجات الفردية:</span>
                        <span className="val">{pricingPreview.originalSum.toLocaleString()} ج.م</span>
                      </div>

                      <div className="f-row discount-highlight">
                        <span className="lbl">
                          قيمة الخصم الترويجي الممنوح ({pricingPreview.discountPct}%):
                        </span>
                        <span className="val save">
                          -{pricingPreview.savings.toLocaleString()} ج.م
                        </span>
                      </div>

                      <div className="f-row net-row">
                        <div>
                          <span className="net-lbl">السعر النهائي للباندل كاملة:</span>
                          <span className="net-sub">سعر البيع المعتمد للعميل في المتجر</span>
                        </div>
                        <div className="net-price-box">
                          <span className="net-price">
                            {pricingPreview.finalPrice.toLocaleString()}
                          </span>
                          <span className="currency">ج.م</span>
                        </div>
                      </div>

                      {totalItemsQty > 0 && (
                        <div className="f-unit-summary">
                          <span>متوسط سعر القطعة داخل الباندل:</span>
                          <strong>
                            {Math.round(pricingPreview.finalPrice / (totalItemsQty || 1)).toLocaleString()} ج.م / قطعة
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Column 2 (Left in RTL): Assembly Workbench & Catalog Explorer */}
                <div className="studio-col-workbench">
                  {/* 4. Assembly Workbench Card */}
                  <div className="studio-card workbench-card">
                    <div className="card-header workbench-header">
                      <div className="header-icon-box wb-icon">
                        <FaBoxesStacked />
                      </div>
                      <div className="wb-title-box">
                        <div className="wb-title-row">
                          <h3>3. منصة تركيب منتجات الباندل</h3>
                          <span className="wb-counter-badge">
                            {formData.items.length} منتجات • {totalItemsQty} قطعة
                          </span>
                        </div>
                        <p>المنتجات التي ستُباع معاً كحزمة متكاملة في طلب واحد</p>
                      </div>

                      {formData.items.length > 0 && (
                        <button
                          type="button"
                          className="btn-clear-workbench"
                          onClick={handleClearAllItems}
                          title="إفراغ كل المنتجات"
                        >
                          <FaArrowRotateLeft size={11} />
                          <span>تفريغ المنصة</span>
                        </button>
                      )}
                    </div>

                    <div className="workbench-body">
                      {formData.items.length === 0 ? (
                        <div className="workbench-empty-state">
                          <div className="empty-icon-circle">
                            <FaBoxOpen />
                          </div>
                          <h4>منصة الباندل فارغة حالياً</h4>
                          <p>
                            تصفح كتالوج المتجر بالأسفل واضغط على <strong>(+ إضافة للباندل)</strong> لإدراج المنتجات في الباقة.
                          </p>
                        </div>
                      ) : (
                        <div className="assembled-items-list">
                          {formData.items.map((item) => {
                            const prod = products.find(
                              (p) => String(p.id) === String(item.product_id)
                            );
                            if (!prod) return null;
                            const prodImg =
                              prod.images?.find((i) => i.is_primary)?.image_url ||
                              prod.images?.[0]?.image_url ||
                              '/assets/placeholder-tech.png';
                            const unitPrice = Number(prod.sale_price || prod.original_price || 0);
                            const lineTotal = unitPrice * Number(item.quantity || 1);

                            return (
                              <div className="assembled-item-card" key={item.product_id}>
                                <div className="item-thumbnail">
                                  <img
                                    src={prodImg}
                                    alt={prod.name_ar || prod.name_en}
                                    onError={(e) => {
                                      e.currentTarget.src = '/assets/placeholder-tech.png';
                                    }}
                                  />
                                </div>

                                <div className="item-info">
                                  <strong className="item-name">{prod.name_ar || prod.name_en}</strong>
                                  <div className="item-meta">
                                    <span className="sku-tag">SKU: {prod.sku || prod.id}</span>
                                    <span className="unit-price-tag">{unitPrice.toLocaleString()} ج.م / وحدة</span>
                                  </div>
                                </div>

                                <div className="item-controls">
                                  <div className="qty-stepper">
                                    <button
                                      type="button"
                                      className="stepper-btn"
                                      onClick={() => handleChangeItemQty(item.product_id, -1)}
                                      title="إنقاص الكمية"
                                    >
                                      <FaMinus size={10} />
                                    </button>
                                    <span className="stepper-val">{item.quantity}</span>
                                    <button
                                      type="button"
                                      className="stepper-btn"
                                      onClick={() => handleChangeItemQty(item.product_id, 1)}
                                      title="زيادة الكمية"
                                    >
                                      <FaPlus size={10} />
                                    </button>
                                  </div>

                                  <div className="line-price-box">
                                    <span className="price-num">{lineTotal.toLocaleString()}</span>
                                    <span className="cur">ج.م</span>
                                  </div>

                                  <button
                                    type="button"
                                    className="btn-remove-item"
                                    onClick={() => handleToggleProduct(item.product_id)}
                                    title="إزالة من الباندل"
                                  >
                                    <FaXmark size={13} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 5. Smart Store Catalog Explorer */}
                  <div className="studio-card catalog-explorer-card">
                    <div className="card-header explorer-header">
                      <div className="header-icon-box explorer-icon">
                        <FaMagnifyingGlass />
                      </div>
                      <div className="exp-title-box">
                        <div className="exp-title-row">
                          <h3>4. مستكشف كتالوج منتجات المتجر</h3>
                          <span className="exp-count-badge">
                            {filteredPickerProducts.length} منتج متاح
                          </span>
                        </div>
                        <p>اختر المنتجات لإدراجها في الباندل (يمكن إضافة نفس المنتج لأكثر من باندل)</p>
                      </div>
                    </div>

                    <div className="catalog-search-filter-bar">
                      <div className="explorer-search-input">
                        <FaMagnifyingGlass className="search-icon" />
                        <input
                          type="text"
                          placeholder="ابحث باسم المنتج، كود SKU، أو رقم المعرّف..."
                          value={productSearchTerm}
                          onChange={(e) => setProductSearchTerm(e.target.value)}
                        />
                        {productSearchTerm && (
                          <button
                            type="button"
                            className="btn-clear-search"
                            onClick={() => setProductSearchTerm('')}
                          >
                            <FaXmark size={12} />
                          </button>
                        )}
                      </div>

                      {availableCategories.length > 0 && (
                        <div className="catalog-category-pills">
                          <button
                            type="button"
                            className={`cat-pill ${categoryFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setCategoryFilter('all')}
                          >
                            جميع الأقسام ({products.length})
                          </button>
                          {availableCategories.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              className={`cat-pill ${categoryFilter === cat.id ? 'active' : ''}`}
                              onClick={() => setCategoryFilter(cat.id)}
                            >
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="catalog-items-scroll">
                      {filteredPickerProducts.length === 0 ? (
                        <div className="catalog-empty-search">
                          <FaCircleInfo size={24} color="#94a3b8" />
                          <span>لم يتم العثور على منتجات مطابقة لمعايير البحث</span>
                        </div>
                      ) : (
                        filteredPickerProducts.map((prod) => {
                          const isAdded = formData.items.some(
                            (it) => String(it.product_id) === String(prod.id)
                          );
                          const prodImg =
                            prod.images?.find((i) => i.is_primary)?.image_url ||
                            prod.images?.[0]?.image_url ||
                            '/assets/placeholder-tech.png';
                          const unitPrice = Number(prod.sale_price || prod.original_price || 0);
                          const otherBundlesCount = productBundleCountMap.get(String(prod.id)) || 0;
                          const catName =
                            prod.categories?.[0]?.name_ar ||
                            prod.category?.name_ar ||
                            prod.category_name_ar ||
                            'عام';

                          return (
                            <div
                              className={`catalog-prod-row ${isAdded ? 'is-selected' : ''}`}
                              key={prod.id}
                            >
                              <div className="cp-image-wrap">
                                <img
                                  src={prodImg}
                                  alt={prod.name_ar || prod.name_en}
                                  onError={(e) => {
                                    e.currentTarget.src = '/assets/placeholder-tech.png';
                                  }}
                                />
                              </div>

                              <div className="cp-details">
                                <strong className="cp-name">{prod.name_ar || prod.name_en}</strong>
                                <div className="cp-meta-row">
                                  <span className="cp-category-pill">{catName}</span>
                                  <span className="cp-price-tag">{unitPrice.toLocaleString()} ج.م</span>
                                  <span className="cp-sku">ID: {prod.id}</span>
                                  {otherBundlesCount > 0 && (
                                    <span className="cp-bundle-count">
                                      موجود في {otherBundlesCount} باندل
                                    </span>
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                className={`btn-catalog-action ${isAdded ? 'btn-is-added' : 'btn-add-item'}`}
                                onClick={() => handleToggleProduct(prod.id)}
                              >
                                {isAdded ? (
                                  <>
                                    <FaCircleCheck size={13} />
                                    <span>مضاف للباندل</span>
                                  </>
                                ) : (
                                  <>
                                    <FaPlus size={12} />
                                    <span>إضافة للباندل</span>
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky Action Footer */}
              <div className="studio-sticky-footer">
                <div className="footer-summary-badge">
                  <div className="summary-indicator-dot"></div>
                  <span>
                    جاهز للحفظ: <strong>{formData.items.length} منتجات</strong> • السعر الإجمالي: <strong>{pricingPreview.finalPrice.toLocaleString()} ج.م</strong>
                    {pricingPreview.savings > 0 && ` (وفر ${pricingPreview.savings.toLocaleString()} ج.م)`}
                  </span>
                </div>

                <div className="footer-action-buttons">
                  <Link href="/admin/bundles" className="btn-footer-cancel">
                    إلغاء والعودة
                  </Link>
                  <button
                    type="submit"
                    disabled={saving || formData.items.length === 0}
                    className="btn-footer-save"
                  >
                    {saving ? (
                      'جاري الحفظ...'
                    ) : isEditMode ? (
                      <>
                        <FaCheck size={14} />
                        <span>حفظ تعديلات الباندل</span>
                      </>
                    ) : (
                      <>
                        <FaCheck size={14} />
                        <span>حفظ ونشر الباندل في المتجر</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
