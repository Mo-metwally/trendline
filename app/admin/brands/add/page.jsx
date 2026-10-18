'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  AdminSidebar,
  AdminHeader,
  useToast,
} from '@/src/components/adminComponents';
import {
  FaCopyright,
  FaArrowRight,
  FaArrowLeft,
  FaCheck,
  FaTriangleExclamation,
  FaCloudArrowUp,
  FaTrashCan,
  FaWandMagicSparkles,
  FaGlobe,
  FaArrowDown19,
  FaCircleCheck,
  FaStar,
} from 'react-icons/fa6';
import { formatFactory } from '@/src/utils/formatFactory';
import './AddBrand.scss';

export default function AddBrandPage() {
  const router = useRouter();
  const toast = useToast();
  const { data: session, status } = useSession();
  const [adminUser, setAdminUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lang, setLang] = useState('ar');

  // Form State
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [autoSlug, setAutoSlug] = useState(true);
  const [descriptionAr, setDescriptionAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Logo Media State
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState('');
  const [logoUploadedUrl, setLogoUploadedUrl] = useState('');
  const [logoMeta, setLogoMeta] = useState(null);
  const [logoLoading, setLogoLoading] = useState(false);
  const logoInputRef = useRef(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isRtl = lang === 'ar';

  // Ensure Auth Token
  const ensureAuthToken = async () => {
    if (typeof window === 'undefined') return '';
    let token = localStorage.getItem('trendline_admin_token');
    if (token && token !== 'undefined' && token !== 'null') return token;

    const cookieToken = document.cookie
      .split('; ')
      .find((row) => row.startsWith('token=') || row.startsWith('trendline_token='))
      ?.split('=')[1];
    if (cookieToken) {
      localStorage.setItem('trendline_admin_token', cookieToken);
      return cookieToken;
    }

    try {
      const res = await fetch('/api/auth/token');
      if (res.ok) {
        const d = await res.json();
        if (d.token) {
          localStorage.setItem('trendline_admin_token', d.token);
          return d.token;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch session token:', e);
    }
    return '';
  };

  // Auth Guard
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated' && session?.user) {
      setTimeout(() => {
        setAdminUser(session.user);
      }, 10);
    }
  }, [status, session, router]);

  // Handle English name change & auto slug
  const handleNameEnChange = (e) => {
    const val = e.target.value;
    setNameEn(val);
    if (autoSlug) {
      const generatedSlug = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generatedSlug);
    }
  };

  // Upload helper for brand logo
  const uploadBrandLogo = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mediaType', 'image');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.url) {
          return data.url;
        }
      }
    } catch (err) {
      console.warn('Brand logo upload to server note:', err);
    }
    return null;
  };

  // Handle logo file selection through formatFactory (WebP 80%)
  const handleLogoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLogoLoading(true);
      setErrorMsg('');

      // Process image through formatFactory
      const result = await formatFactory(file, { quality: 0.8, maxDimension: 1024 });

      setLogoFile(result.file);
      setLogoPreviewUrl(result.previewUrl);
      setLogoMeta({
        originalSize: result.originalSize,
        formattedSize: result.formattedSize,
        savingsPercent: result.savingsPercent,
        width: result.width,
        height: result.height,
      });

      toast.success(
        isRtl
          ? `تم ضغط الشعار بصيغة WebP 80% بنجاح (وفر ${result.savingsPercent}%)`
          : `Logo converted to WebP 80% successfully (${result.savingsPercent}% saved)`,
        isRtl ? 'معالجة الشعار' : 'Logo Processed'
      );

      // Background upload to server /uploads/
      const serverUrl = await uploadBrandLogo(result.file);
      setLogoUploadedUrl(serverUrl || result.previewUrl);
    } catch (err) {
      console.error('Logo processing error:', err);
      const msg = err.message || (isRtl ? 'تعذر معالجة شعار البراند' : 'Failed to process brand logo');
      setErrorMsg(msg);
      toast.error(msg, isRtl ? 'خطأ في معالجة الشعار' : 'Logo Error');
    } finally {
      setLogoLoading(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  // Clear selected logo
  const clearLogo = () => {
    setLogoFile(null);
    setLogoPreviewUrl('');
    setLogoUploadedUrl('');
    setLogoMeta(null);
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!nameAr.trim() || !nameEn.trim()) {
      const msg = isRtl ? 'يرجى إدخال اسم العلامة التجارية بالعربية والإنجليزية.' : 'Please enter brand name in both Arabic and English.';
      setErrorMsg(msg);
      toast.warning(msg, isRtl ? 'بيانات ناقصة' : 'Missing Fields');
      return;
    }

    const finalLogoUrl = logoUploadedUrl || logoPreviewUrl;
    if (!finalLogoUrl) {
      const msg = isRtl ? 'يرجى رفع شعار (لوجو) العلامة التجارية.' : 'Please upload a brand logo.';
      setErrorMsg(msg);
      toast.warning(msg, isRtl ? 'شعار البراند مطلوب' : 'Logo Required');
      return;
    }

    try {
      setSubmitting(true);
      const apiHost = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
        ? `http://${window.location.hostname}:5000`
        : 'http://localhost:5000';

      const token = await ensureAuthToken();

      const payload = {
        name_ar: nameAr.trim(),
        name_en: nameEn.trim(),
        slug: slug.trim() || nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        logo_url: finalLogoUrl,
        description_ar: descriptionAr.trim() || null,
        description_en: descriptionEn.trim() || null,
        website_url: websiteUrl.trim() || null,
        sort_order: Number(sortOrder) || 0,
        is_featured: isFeatured,
        is_active: isActive,
      };

      const res = await fetch(`${apiHost}/api/v1/catalog/brands`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const msg = isRtl ? 'تمت إضافة العلامة التجارية بنجاح!' : 'Brand added successfully!';
        setSuccessMsg(msg);
        toast.success(msg, isRtl ? 'إضافة براند' : 'Brand Created');
        setTimeout(() => {
          router.push('/admin/brands');
        }, 1200);
      } else {
        const msg = data.message || (isRtl ? 'تعذر حفظ العلامة التجارية. تحقق من البيانات المدخلة.' : 'Failed to save brand.');
        setErrorMsg(msg);
        toast.error(msg, isRtl ? 'خطأ في الحفظ' : 'Brand Save Error');
      }
    } catch (err) {
      console.error('Error creating brand:', err);
      let msg = isRtl ? 'حدث خطأ غير متوقع أثناء الاتصال بالخادم.' : 'Unexpected network error occurred.';
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        msg = isRtl
          ? 'تعذر الاتصال بالخادم. يرجى التأكد من تشغيل خادم الباك إند (Port 5000).'
          : 'Could not connect to server. Please verify backend is running on port 5000.';
      }
      setErrorMsg(msg);
      toast.error(msg, isRtl ? 'خطأ في الاتصال' : 'Connection Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-add-brand-page" dir={isRtl ? 'rtl' : 'ltr'}>
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
          lang={lang}
          onToggleLanguage={(newLang) => setLang(newLang)}
        />

        <main className="admin-add-brand-content">
          {/* Breadcrumbs Navigation */}
          <div className="page-nav-header">
            <div className="breadcrumbs-line">
              <Link href="/admin">{isRtl ? 'لوحة التحكم' : 'Dashboard'}</Link>
              <span className="separator">/</span>
              <Link href="/admin/brands">{isRtl ? 'إدارة البراندات' : 'Brands'}</Link>
              <span className="separator">/</span>
              <span className="current-crumb">{isRtl ? 'إضافة علامة تجارية (Brand)' : 'Add Brand'}</span>
            </div>

            <Link href="/admin/brands" className="btn-back-link">
              {isRtl ? <FaArrowRight /> : <FaArrowLeft />}
              <span>{isRtl ? 'الرجوع للبراندات' : 'Back to Brands'}</span>
            </Link>
          </div>

          {/* Banner */}
          <div className="add-brand-title-banner">
            <div className="banner-icon-badge">
              <FaCopyright />
            </div>
            <div className="banner-text">
              <h1>{isRtl ? 'إضافة علامة تجارية جديدة (Brand)' : 'Register New Brand'}</h1>
              <p>
                {isRtl
                  ? 'سجل علامة تجارية معتمدة لمنتجات المتجر مع تخصيص الشعار المحول تلقائياً بصيغة WebP 80%، الاسم، والوصف التجاري.'
                  : 'Add a verified enterprise brand with auto-optimized WebP logo, official multilingual naming, and commercial description.'}
              </p>
            </div>
            <div className="format-factory-badge">
              <FaWandMagicSparkles />
              <span>formatFactory: WebP 80%</span>
            </div>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="alert-message-box error">
              <FaTriangleExclamation />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="alert-message-box success">
              <FaCircleCheck />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="brand-form-layout">
            <div className="form-sections-grid">
              {/* Left/Main Column: Basic Identity & Description */}
              <div className="left-sections-stack">
                {/* Brand Identity Card */}
                <div className="form-card-box">
                  <div className="card-header">
                    <div className="card-header-icon">
                      <FaCopyright />
                    </div>
                    <div>
                      <h3>{isRtl ? 'هوية العلامة التجارية' : 'Brand Identity'}</h3>
                      <p className="card-subtitle">{isRtl ? 'الاسم باللغات المعتمدة والترميز اللطيف' : 'Official names and slug'}</p>
                    </div>
                  </div>

                  <div className="card-body">
                    <div className="two-cols-row">
                      <div className="input-field-group">
                        <label>
                          {isRtl ? 'اسم البراند بالعربية' : 'Arabic Brand Name'}
                          <span className="required-star">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control-input"
                          placeholder={isRtl ? 'مثال: سيسكو سيستمز' : 'e.g. سيسكو سيستمز'}
                          value={nameAr}
                          onChange={(e) => setNameAr(e.target.value)}
                          required
                        />
                      </div>

                      <div className="input-field-group">
                        <label>
                          {isRtl ? 'اسم البراند بالإنجليزية' : 'English Brand Name'}
                          <span className="required-star">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control-input"
                          placeholder="e.g. Cisco Systems"
                          value={nameEn}
                          onChange={handleNameEnChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="input-field-group">
                      <div className="label-with-action">
                        <label>
                          {isRtl ? 'المعرف اللطيف للرابط (Slug)' : 'URL Slug'}
                          <span className="required-star">*</span>
                        </label>
                        <button
                          type="button"
                          className={`toggle-slug-sync-btn ${autoSlug ? 'active' : ''}`}
                          onClick={() => setAutoSlug(!autoSlug)}
                        >
                          {autoSlug ? (isRtl ? 'توليد تلقائي نشط' : 'Auto-Sync On') : (isRtl ? 'توليد يدوي' : 'Manual')}
                        </button>
                      </div>
                      <div className="slug-input-wrapper">
                        <span className="slug-prefix">@</span>
                        <input
                          type="text"
                          className="form-control-input slug-input"
                          placeholder="cisco-systems"
                          value={slug}
                          onChange={(e) => {
                            setAutoSlug(false);
                            setSlug(e.target.value);
                          }}
                          required
                        />
                      </div>
                    </div>

                    <div className="input-field-group">
                      <label>
                        {isRtl ? 'الموقع الإلكتروني الرسمي للبراند' : 'Official Website URL'}
                      </label>
                      <div className="slug-input-wrapper">
                        <span className="slug-prefix"><FaGlobe size={14} /></span>
                        <input
                          type="url"
                          className="form-control-input slug-input"
                          placeholder="https://www.cisco.com"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Brand Description Card */}
                <div className="form-card-box">
                  <div className="card-header">
                    <div className="card-header-icon desc-icon">
                      <FaGlobe />
                    </div>
                    <div>
                      <h3>{isRtl ? 'نبذة ووصف العلامة التجارية' : 'Brand Descriptions'}</h3>
                      <p className="card-subtitle">{isRtl ? 'معلومات تعريفية باللغتين تظهر في صفحة البراند' : 'Descriptions for storefront presentation'}</p>
                    </div>
                  </div>

                  <div className="card-body">
                    <div className="input-field-group">
                      <label>{isRtl ? 'الوصف بالعربية' : 'Arabic Description'}</label>
                      <textarea
                        rows={4}
                        className="form-control-textarea"
                        placeholder={isRtl ? 'اكتب نبذة تعريفية باللغة العربية عن الشركة وتخصصاتها ومنتجاتها...' : 'Write Arabic brand overview...'}
                        value={descriptionAr}
                        onChange={(e) => setDescriptionAr(e.target.value)}
                      />
                    </div>

                    <div className="input-field-group">
                      <label>{isRtl ? 'الوصف بالإنجليزية' : 'English Description'}</label>
                      <textarea
                        rows={4}
                        className="form-control-textarea"
                        placeholder="Write English corporate overview about the brand and products..."
                        value={descriptionEn}
                        onChange={(e) => setDescriptionEn(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Logo Upload & Visibility Settings */}
              <div className="right-sections-stack">
                {/* Logo Upload Card with formatFactory */}
                <div className="form-card-box">
                  <div className="card-header">
                    <div className="card-header-icon logo-icon">
                      <FaCloudArrowUp />
                    </div>
                    <div>
                      <h3>{isRtl ? 'شعار البراند (Logo)' : 'Brand Logo'}</h3>
                      <p className="card-subtitle">{isRtl ? 'معالجة فورية عبر formatFactory بصيغة WebP 80%' : 'Processed via formatFactory WebP 80%'}</p>
                    </div>
                  </div>

                  <div className="card-body">
                    <input
                      type="file"
                      ref={logoInputRef}
                      style={{ display: 'none' }}
                      accept="image/*"
                      onChange={handleLogoSelect}
                    />

                    {logoPreviewUrl ? (
                      <div className="logo-preview-card">
                        <div className="logo-image-box">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={logoPreviewUrl} alt="Brand Logo Preview" />
                        </div>
                        <div className="logo-preview-details">
                          <span className="badge-webp">WebP 80%</span>
                          {logoMeta && (
                            <div className="meta-text">
                              <span>{logoMeta.width} × {logoMeta.height} px</span>
                              {logoMeta.savingsPercent > 0 && (
                                <span className="savings-badge">وفر {logoMeta.savingsPercent}%</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="logo-preview-actions">
                          <button
                            type="button"
                            className="btn-change-logo"
                            onClick={() => logoInputRef.current?.click()}
                          >
                            {isRtl ? 'تغيير الشعار' : 'Change Logo'}
                          </button>
                          <button
                            type="button"
                            className="btn-remove-logo"
                            onClick={clearLogo}
                            title={isRtl ? 'حذف الشعار' : 'Remove Logo'}
                          >
                            <FaTrashCan />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`logo-dropzone ${logoLoading ? 'loading' : ''}`}
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <div className="dropzone-icon">
                          <FaCloudArrowUp />
                        </div>
                        <h4>{isRtl ? 'انقر لاختيار شعار البراند' : 'Click to select brand logo'}</h4>
                        <p>{isRtl ? 'سيتم ضغط وتنسيق الشعار تلقائياً بتقنية WebP 80%' : 'Automatically converted to WebP 80%'}</p>
                        <span className="specs-pill">{isRtl ? 'يدعم: PNG, JPG, SVG, WEBP' : 'Supports PNG, JPG, SVG, WEBP'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Display & Status Settings */}
                <div className="form-card-box">
                  <div className="card-header">
                    <div className="card-header-icon settings-icon">
                      <FaStar />
                    </div>
                    <div>
                      <h3>{isRtl ? 'حالة العرض والترتيب' : 'Display & Status'}</h3>
                      <p className="card-subtitle">{isRtl ? 'إبراز العلامة التجارية والتحكم في ظهورها' : 'Featured flag and sequence'}</p>
                    </div>
                  </div>

                  <div className="card-body">
                    <div className="input-field-group">
                      <label>
                        {isRtl ? 'ترتيب الظهور في القوائم' : 'Sort Order'}
                      </label>
                      <div className="slug-input-wrapper">
                        <span className="slug-prefix"><FaArrowDown19 size={13} /></span>
                        <input
                          type="number"
                          className="form-control-input slug-input"
                          min="0"
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="checkboxes-stack">
                      <label className="checkbox-toggle-label">
                        <input
                          type="checkbox"
                          checked={isFeatured}
                          onChange={(e) => setIsFeatured(e.target.checked)}
                        />
                        <div className="toggle-text">
                          <span className="toggle-title">{isRtl ? 'علامة تجارية مميزة (Featured)' : 'Featured Brand'}</span>
                          <span className="toggle-desc">{isRtl ? 'تظهر في الشريط المميز بالصفحة الرئيسية' : 'Show prominently on home hero bar'}</span>
                        </div>
                      </label>

                      <label className="checkbox-toggle-label">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                        />
                        <div className="toggle-text">
                          <span className="toggle-title">{isRtl ? 'تفعيل العلامة التجارية' : 'Active Status'}</span>
                          <span className="toggle-desc">{isRtl ? 'إتاحتها لاختيار المنتجات وفلاتر المتجر' : 'Enable in product selector and filters'}</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="form-actions-bottom-bar">
              <Link href="/admin/tags" className="btn-cancel-action">
                {isRtl ? 'إلغاء والعودة' : 'Cancel & Return'}
              </Link>
              <button
                type="submit"
                className="btn-submit-brand"
                disabled={submitting || logoLoading}
              >
                {submitting ? (
                  <>
                    <span className="btn-spinner"></span>
                    <span>{isRtl ? 'جاري حفظ العلامة التجارية...' : 'Saving Brand...'}</span>
                  </>
                ) : (
                  <>
                    <FaCheck />
                    <span>{isRtl ? 'حفظ العلامة التجارية' : 'Save Brand'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
