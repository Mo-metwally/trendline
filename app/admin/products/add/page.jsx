'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  AdminSidebar,
  AdminHeader,
  CustomSelect,
  OptionIconRenderer,
} from '@/src/components/adminComponents';
import {
  FaFolderTree,
  FaFolder,
  FaTag,
  FaTags,
  FaStar,
  FaRegStar,
  FaSitemap,
  FaChevronLeft,
  FaChevronRight,
  FaCircleXmark,
  FaCheck,
  FaTriangleExclamation,
  FaXmark,
} from 'react-icons/fa6';
import './AddProduct.scss';

export default function AddProductPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Layout & Language State
  const [adminUser, setAdminUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lang, setLang] = useState('ar');
  const isRtl = lang === 'ar';

  // Loading & Submission States
  const [loadingPrereqs, setLoadingPrereqs] = useState(true);
  const [prereqError, setPrereqError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Prerequisites from DB
  const [categoriesTree, setCategoriesTree] = useState([]);
  const [flatCategories, setFlatCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);

  // Form Fields - Basic Info
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [autoSlug, setAutoSlug] = useState(true);
  const [shortDescAr, setShortDescAr] = useState('');
  const [shortDescEn, setShortDescEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');

  // Form Fields - Category Hierarchy (Multi-selection & Primary)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [primaryCategoryId, setPrimaryCategoryId] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [categoryValidationError, setCategoryValidationError] = useState(false);

  // Form Fields - Pricing & Profitability
  const [costPrice, setCostPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');

  // Form Fields - Inventory & Codes
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [stockQuantity, setStockQuantity] = useState(10);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);

  // Form Fields - Brand
  const [selectedBrandId, setSelectedBrandId] = useState('');

  // Form Fields - Media & Gallery
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [galleryImages, setGalleryImages] = useState(['']);

  // Form Fields - Technical Specifications
  const [specifications, setSpecifications] = useState([
    { key: '', value: '' },
    { key: '', value: '' },
  ]);

  // Form Fields - Tags
  const [selectedTagIds, setSelectedTagIds] = useState([]);

  // Form Fields - Visibility
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // Ensure Auth Token Helper
  const ensureAuthToken = async () => {
    if (typeof window === 'undefined') return '';

    let token = localStorage.getItem('trendline_admin_token');
    if (token && token !== 'undefined' && token !== 'null') return token;

    const cookieToken = document.cookie
      .split('; ')
      .find((row) => row.startsWith('token=') || row.startsWith('trendline_token='))
      ?.split('=')[1];
    if (cookieToken && cookieToken !== 'undefined' && cookieToken !== 'null') {
      localStorage.setItem('trendline_admin_token', cookieToken);
      return cookieToken;
    }

    try {
      const res = await fetch('/api/auth/token');
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('trendline_admin_token', data.token);
          document.cookie = `trendline_token=${data.token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
          document.cookie = `token=${data.token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
          return data.token;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch token from /api/auth/token', e);
    }

    return '';
  };

  // Auth protection check
  useEffect(() => {
    const hasTokenCookie = document.cookie
      .split('; ')
      .some((row) => row.startsWith('token=') || row.startsWith('trendline_token=') || row.startsWith('next-auth.session-token='));
    const localUser = localStorage.getItem('trendline_admin_user');

    if (!hasTokenCookie && status === 'unauthenticated' && !localUser) {
      router.replace('/admin/login');
      return;
    }

    if (localUser) {
      try {
        setTimeout(() => {
          setAdminUser(JSON.parse(localUser));
        }, 10);
      } catch (e) {
        console.error(e);
      }
    } else if (session?.user) {
      setTimeout(() => {
        setAdminUser(session.user);
      }, 10)
    } else {
      setTimeout(() => {
        setAdminUser({ name: 'مدير المتجر', email: 'admin@trendlineeg.com', role: 'SUPER_ADMIN' });
      }, 10)
    }
  }, [session, status, router]);

  // Determine backend API Host
  const getApiHost = useCallback(() => {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return `http://${window.location.hostname}:5000`;
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  }, []);

  // Fetch initial data (Categories, Brands, Tags)
  const fetchPrerequisites = useCallback(async () => {
    try {
      setLoadingPrereqs(true);
      setPrereqError('');
      const apiHost = getApiHost();

      const [treeRes, flatRes, brandsRes, tagsRes] = await Promise.all([
        fetch(`${apiHost}/api/v1/catalog/categories/tree`),
        fetch(`${apiHost}/api/v1/catalog/categories`),
        fetch(`${apiHost}/api/v1/catalog/brands`),
        fetch(`${apiHost}/api/v1/catalog/tags`),
      ]);

      if (treeRes.ok) {
        const treeData = await treeRes.json();
        setCategoriesTree(treeData.data || []);
      }

      if (flatRes.ok) {
        const flatData = await flatRes.json();
        setFlatCategories(flatData.data || []);
      }

      if (brandsRes.ok) {
        const brandsData = await brandsRes.json();
        setBrands(brandsData.data || []);
      }

      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        setAvailableTags(tagsData.data || []);
      }
    } catch (err) {
      console.error('Error fetching product prerequisites:', err);
      setPrereqError(
        isRtl
          ? 'تعذر الاتصال بخادم الـ API (تأكد من تشغيل خادم الباك إند على المنفذ 5000)'
          : 'Could not connect to backend server (Port 5000)'
      );
    } finally {
      setLoadingPrereqs(false);
    }
  }, [getApiHost, isRtl]);

  useEffect(() => {
    setTimeout(() => {
      fetchPrerequisites();
    }, 20)
  }, [fetchPrerequisites]);

  // Auto-slug sync when typing English name
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

  // Live Profitability Calculations
  const metrics = useMemo(() => {
    const cost = parseFloat(costPrice) || 0;
    const orig = parseFloat(originalPrice) || 0;
    const sale = parseFloat(salePrice) || null;
    const effectivePrice = sale && sale > 0 ? sale : orig;

    const netProfit = effectivePrice > 0 ? (effectivePrice - cost).toFixed(2) : '0.00';
    const margin = effectivePrice > 0 ? (((effectivePrice - cost) / effectivePrice) * 100).toFixed(1) : '0.0';
    const discount = orig > 0 && sale && orig > sale ? Math.round(((orig - sale) / orig) * 100) : 0;

    return {
      netProfit,
      margin,
      discount,
      effectivePrice,
    };
  }, [costPrice, originalPrice, salePrice]);

  // Brand Options for CustomSelect
  const brandOptions = useMemo(() => {
    const genericOption = {
      value: '',
      label: isRtl ? '-- بدون علامة تجارية محددة --' : '-- No Brand / Generic --',
      icon: <FaTag style={{ color: '#94a3b8' }} />,
    };

    const list = brands.map((b) => ({
      value: String(b.id),
      label: isRtl ? `${b.name_ar} (${b.name_en})` : b.name_en,
      image_url: b.logo_url,
      icon: <FaTag style={{ color: '#64748b' }} />,
      idBadge: b.slug,
    }));

    return [genericOption, ...list];
  }, [brands, isRtl]);

  // Code Generators
  const generateSkuCode = () => {
    const prefix = 'TRD';
    const catCode = primaryCategoryId ? primaryCategoryId.replace('_', '').toUpperCase() : 'GEN';
    const rand = Math.floor(10000 + Math.random() * 90000);
    setSku(`${prefix}-${catCode}-${rand}`);
  };

  const generateBarcodeCode = () => {
    const prefix = '622'; // Egypt country prefix
    const rand = Math.floor(100000000 + Math.random() * 900000000);
    setBarcode(`${prefix}${rand}`);
  };

  // Category Multi-selection handlers
  const toggleCategorySelection = (categoryId) => {
    setCategoryValidationError(false);
    setSelectedCategoryIds((prev) => {
      let updated;
      if (prev.includes(categoryId)) {
        updated = prev.filter((id) => id !== categoryId);
        // If the deselected was the primary, reassign primary to first remaining
        if (primaryCategoryId === categoryId) {
          setPrimaryCategoryId(updated.length > 0 ? updated[0] : '');
        }
      } else {
        updated = [...prev, categoryId];
        // If no primary is set, make this newly selected one primary
        if (!primaryCategoryId) {
          setPrimaryCategoryId(categoryId);
        }
      }
      return updated;
    });
  };

  const setAsPrimaryCategory = (categoryId, e) => {
    if (e) e.stopPropagation();
    // Ensure it is in selected list first
    if (!selectedCategoryIds.includes(categoryId)) {
      setSelectedCategoryIds((prev) => [...prev, categoryId]);
    }
    setPrimaryCategoryId(categoryId);
    setCategoryValidationError(false);
  };

  const clearAllCategories = () => {
    setSelectedCategoryIds([]);
    setPrimaryCategoryId('');
  };

  // Live Storefront Breadcrumbs trail finder
  const activeBreadcrumbTrail = useMemo(() => {
    if (!primaryCategoryId) return null;

    // Find the category in flat categories
    const target = flatCategories.find((c) => String(c.id) === String(primaryCategoryId));
    if (!target) return null;

    // If it has a parent, trace hierarchy: Root -> Subcategory
    if (target.parent_id) {
      const parent = flatCategories.find((c) => String(c.id) === String(target.parent_id));
      return {
        rootName: parent ? (isRtl ? parent.name_ar : parent.name_en) : null,
        subName: isRtl ? target.name_ar : target.name_en,
      };
    }

    // Root category itself
    return {
      rootName: isRtl ? target.name_ar : target.name_en,
      subName: null,
    };
  }, [primaryCategoryId, flatCategories, isRtl]);

  // Filtered categories tree for search
  const filteredTree = useMemo(() => {
    if (!categorySearchQuery.trim()) return categoriesTree;
    const q = categorySearchQuery.toLowerCase().trim();

    return categoriesTree
      .map((root) => {
        const rootMatches = (root.name_ar && root.name_ar.toLowerCase().includes(q)) ||
          (root.name_en && root.name_en.toLowerCase().includes(q)) ||
          (root.id && String(root.id).toLowerCase().includes(q));

        const matchedSubs = (root.subcategories || []).filter((sub) =>
          (sub.name_ar && sub.name_ar.toLowerCase().includes(q)) ||
          (sub.name_en && sub.name_en.toLowerCase().includes(q)) ||
          (sub.id && String(sub.id).toLowerCase().includes(q))
        );

        if (rootMatches || matchedSubs.length > 0) {
          return {
            ...root,
            subcategories: rootMatches ? root.subcategories : matchedSubs,
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [categoriesTree, categorySearchQuery]);

  // Specifications Repeater Handlers
  const handleSpecChange = (index, field, value) => {
    setSpecifications((prev) => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  };

  const addSpecRow = () => {
    setSpecifications((prev) => [...prev, { key: '', value: '' }]);
  };

  const removeSpecRow = (index) => {
    setSpecifications((prev) => prev.filter((_, i) => i !== index));
  };

  // Additional Gallery Handlers
  const handleGalleryChange = (index, value) => {
    setGalleryImages((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const addGalleryRow = () => {
    setGalleryImages((prev) => [...prev, '']);
  };

  const removeGalleryRow = (index) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Tag Pill Toggle
  const toggleTagPill = (tagId) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  // Validation
  const isFormValid = useMemo(() => {
    return (
      nameAr.trim().length > 0 &&
      nameEn.trim().length > 0 &&
      originalPrice &&
      parseFloat(originalPrice) > 0 &&
      selectedCategoryIds.length > 0
    );
  }, [nameAr, nameEn, originalPrice, selectedCategoryIds]);

  // Main Submit Handler
  const handleSubmit = async (publishImmediately = true) => {
    setErrorMessage('');
    setSuccessMessage('');

    // Mandatory Category Validation Check
    if (selectedCategoryIds.length === 0) {
      setCategoryValidationError(true);
      setErrorMessage(isRtl ? 'يجب اختيار قسم واحد على الأقل للمنتج' : 'At least one category must be selected');
      window.scrollTo({ top: 380, behavior: 'smooth' });
      return;
    }

    if (!nameAr.trim() || !nameEn.trim() || !originalPrice) {
      setErrorMessage(isRtl ? 'يرجى ملء الحقول الإجبارية (الاسم باللغتين وسعر البيع)' : 'Please fill all required fields');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);

    try {
      const token = await ensureAuthToken();
      const apiHost = getApiHost();

      // Build Specifications Object
      const specsObject = {};
      specifications.forEach((s) => {
        if (s.key.trim()) {
          specsObject[s.key.trim()] = s.value.trim();
        }
      });

      // Build Images Array
      const imagesPayload = [];
      if (coverImageUrl.trim()) {
        imagesPayload.push(coverImageUrl.trim());
      }
      galleryImages.forEach((url) => {
        if (url.trim() && !imagesPayload.includes(url.trim())) {
          imagesPayload.push(url.trim());
        }
      });

      const payload = {
        name_ar: nameAr.trim(),
        name_en: nameEn.trim(),
        slug: slug.trim() || nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        sku: sku.trim() || undefined,
        barcode: barcode.trim() || undefined,
        brand_id: selectedBrandId ? parseInt(selectedBrandId, 10) : null,
        category_ids: selectedCategoryIds,
        primary_category_id: primaryCategoryId || selectedCategoryIds[0],
        cost_price: parseFloat(costPrice) || 0.0,
        original_price: parseFloat(originalPrice),
        sale_price: salePrice ? parseFloat(salePrice) : null,
        stock_quantity: parseInt(stockQuantity, 10) || 0,
        low_stock_threshold: parseInt(lowStockThreshold, 10) || 5,
        short_desc_ar: shortDescAr.trim() || null,
        short_desc_en: shortDescEn.trim() || null,
        description_ar: descriptionAr.trim() || null,
        description_en: descriptionEn.trim() || null,
        specifications: Object.keys(specsObject).length > 0 ? specsObject : null,
        image_urls: imagesPayload,
        tag_ids: selectedTagIds,
        is_featured: isFeatured,
        is_active: publishImmediately ? isActive : false,
      };

      const res = await fetch(`${apiHost}/api/v1/catalog/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || (isRtl ? 'حدث خطأ أثناء حفظ المنتج' : 'Failed to save product'));
      }

      setSuccessMessage(isRtl ? ' تم حفظ المنتج بنجاح! يتم التحويل إلى قائمة المنتجات...' : ' Product created successfully! Redirecting...');
      setTimeout(() => {
        router.push('/admin/products');
      }, 1200);
    } catch (err) {
      console.error('Save product error:', err);
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setErrorMessage(
          isRtl
            ? 'تعذر الاتصال بالخادم. يرجى التأكد من تشغيل خادم الباك إند (Port 5000).'
            : 'Could not connect to server. Please verify backend is running on port 5000.'
        );
      } else {
        setErrorMessage(err.message || (isRtl ? 'تعذر حفظ المنتج، تحقق من البيانات والاتصال بالخادم' : 'Failed to save product'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-product-page" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 1. Admin Sidebar */}
      <AdminSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        lang={lang}
      />

      {/* 2. Admin Main Wrapper */}
      <div className="admin-main-wrapper">
        {/* Admin Header */}
        <AdminHeader
          adminUser={adminUser}
          lang={lang}
          onToggleLanguage={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          isSidebarCollapsed={sidebarCollapsed}
          notificationCount={2}
        />

        {/* Content Body */}
        <main className="add-product-content">
          {/* Page Top Navigation */}
          <div className="page-nav-header">
            <div className="breadcrumbs-line">
              <Link href="/admin">{isRtl ? 'لوحة التحكم' : 'Dashboard'}</Link>
              <span className="separator">/</span>
              <Link href="/admin/products">{isRtl ? 'المنتجات' : 'Products'}</Link>
              <span className="separator">/</span>
              <span className="current-crumb">{isRtl ? 'إضافة منتج جديد' : 'New Product'}</span>
            </div>

            <div className="top-action-buttons">
              <Link href="/admin/products" className="btn-cancel">
                {isRtl ? 'إلغاء وعودة' : 'Cancel'}
              </Link>

              <button
                type="button"
                className="btn-save-draft"
                onClick={() => handleSubmit(false)}
                disabled={submitting}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                <span>{isRtl ? 'حفظ كمسودة' : 'Save as Draft'}</span>
              </button>

              <button
                type="button"
                className="btn-publish-main"
                onClick={() => handleSubmit(true)}
                disabled={submitting}
              >
                {submitting ? (
                  <span>{isRtl ? 'جارٍ النشر في المتجر...' : 'Publishing...'}</span>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    <span>{isRtl ? 'نشر المنتج الآن' : 'Publish Product'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div
              style={{
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                border: '1px solid #f87171',
                padding: '12px 18px',
                borderRadius: '12px',
                fontSize: '13.5px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div
              style={{
                backgroundColor: '#dcfce7',
                color: '#15803d',
                border: '1px solid #86efac',
                padding: '12px 18px',
                borderRadius: '12px',
                fontSize: '13.5px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>{successMessage}</span>
            </div>
          )}

          {/* Two-Column Form Layout */}
          <div className="product-form-layout">
            {/* ==============================================================
                MAIN COLUMN (Left in RTL, Right in LTR)
               ============================================================== */}
            <div className="form-main-column">
              {/* Card 1: Basic Information */}
              <div className="form-section-card">
                <div className="section-header">
                  <div className="title-wrap">
                    <div className="section-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                      </svg>
                    </div>
                    <h2>{isRtl ? 'البيانات الأساسية للمنتج' : 'Product Information'}</h2>
                    <span className="mandatory-tag">{isRtl ? 'أساسي' : 'Required'}</span>
                  </div>
                </div>

                <div className="form-group-grid">
                  <div className="form-group">
                    <label>
                      <span>{isRtl ? 'اسم المنتج بالعربية' : 'Product Name (Arabic)'}</span>
                      <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={isRtl ? 'مثال: راوتر سيسكو 2960 جيجابت إيثرنت' : 'e.g. Cisco Catalyst 2960 Switch'}
                      value={nameAr}
                      onChange={(e) => setNameAr(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <span>{isRtl ? 'اسم المنتج بالإنجليزية' : 'Product Name (English)'}</span>
                      <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cisco Catalyst 2960 Switch"
                      value={nameEn}
                      onChange={handleNameEnChange}
                    />
                  </div>
                </div>

                {/* Slug with Auto toggle */}
                <div className="form-group">
                  <label>
                    <span>{isRtl ? 'الرابط الدائم (Slug)' : 'URL Slug'}</span>
                    <button
                      type="button"
                      className="label-hint"
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                      onClick={() => setAutoSlug(!autoSlug)}
                    >
                      {autoSlug
                        ? (isRtl ? 'توليد تلقائي نشط' : 'Auto Sync Active')
                        : (isRtl ? 'توليد يدوي' : 'Manual')}
                    </button>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="cisco-catalyst-2960-switch"
                    value={slug}
                    onChange={(e) => {
                      setAutoSlug(false);
                      setSlug(e.target.value);
                    }}
                  />
                  <div className="slug-preview-bar">
                    <span>{isRtl ? 'رابط المنتج في المتجر:' : 'Storefront URL:'}</span>
                    <span className="slug-highlight">
                      trendlineeg.com/products/{slug || 'product-slug'}
                    </span>
                  </div>
                </div>

                {/* Short Descriptions */}
                <div className="form-group-grid">
                  <div className="form-group">
                    <label>{isRtl ? 'نبذة مختصرة بالعربية' : 'Short Description (Arabic)'}</label>
                    <textarea
                      rows={2}
                      placeholder={isRtl ? 'وصف سريع يظهر أسفل عنوان المنتج في قائمة المتجر...' : 'Quick highlight shown on cards...'}
                      value={shortDescAr}
                      onChange={(e) => setShortDescAr(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>{isRtl ? 'نبذة مختصرة بالإنجليزية' : 'Short Description (English)'}</label>
                    <textarea
                      rows={2}
                      placeholder="Short marketing excerpt for search engines..."
                      value={shortDescEn}
                      onChange={(e) => setShortDescEn(e.target.value)}
                    />
                  </div>
                </div>

                {/* Full Descriptions */}
                <div className="form-group-grid">
                  <div className="form-group">
                    <label>{isRtl ? 'الوصف الكامل بالعربية' : 'Full Description (Arabic)'}</label>
                    <textarea
                      rows={4}
                      placeholder={isRtl ? 'تفاصيل المنتج ومميزاته ومحتويات العبوة...' : 'Comprehensive specifications and features...'}
                      value={descriptionAr}
                      onChange={(e) => setDescriptionAr(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>{isRtl ? 'الوصف الكامل بالإنجليزية' : 'Full Description (English)'}</label>
                    <textarea
                      rows={4}
                      placeholder="Comprehensive product details, package contents..."
                      value={descriptionEn}
                      onChange={(e) => setDescriptionEn(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* ==============================================================
                  Card 2: CATEGORY HIERARCHY TREE SELECTOR (CORE REQUIREMENT)
                 ============================================================== */}
              <div
                className="form-section-card"
                style={categoryValidationError ? { borderColor: '#ef4444', boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.15)' } : {}}
              >
                <div className="section-header">
                  <div className="title-wrap">
                    <div className="section-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <line x1="6" y1="3" x2="6" y2="15"></line>
                        <circle cx="18" cy="6" r="3"></circle>
                        <circle cx="6" cy="18" r="3"></circle>
                        <path d="M18 9a9 9 0 0 1-9 9"></path>
                      </svg>
                    </div>
                    <h2>{isRtl ? 'التصنيف الهرمي والأقسام التابعة' : 'Category Hierarchy & Assignment'}</h2>
                    <span className="mandatory-tag">{isRtl ? 'إجباري قسم واحد على الأقل' : 'Min 1 Required'}</span>
                  </div>
                  {selectedCategoryIds.length > 0 && (
                    <button
                      type="button"
                      className="header-extra-action"
                      onClick={clearAllCategories}
                    >
                      {isRtl ? 'إلغاء التحديد بالكامل' : 'Clear All'}
                    </button>
                  )}
                </div>

                <div className="category-hierarchy-selector">
                  {/* Instructional Banner */}
                  <div className="hierarchy-instruction-banner">
                    <div className="banner-icon" style={{ display: 'flex', alignItems: 'center', color: 'var(--main-color, #0057C2)' }}>
                      <FaSitemap />
                    </div>
                    <div className="banner-text">
                      {isRtl ? (
                        <>
                          <strong>الهيكل الهرمي الصارم:</strong> القسم الرئيسي ← القسم الفرعي ← المنتج.
                          يمكن إضافة المنتج إلى عدة أقسام في نفس الوقت، مع تحديد <strong>القسم الأساسي (Primary)</strong> الذي يقود مسار التنقل وروابط المتجر وتوريث التاجز تلقائياً.
                        </>
                      ) : (
                        <>
                          <strong>Strict Hierarchy:</strong> Root Category &rarr; Subcategory &rarr; Products.
                          You can assign this product to multiple categories. Choose one <strong>Primary Category</strong> to drive store breadcrumbs and auto-categorization.
                        </>
                      )}
                    </div>
                  </div>

                  {/* Live Storefront Breadcrumb Preview */}
                  {activeBreadcrumbTrail && (
                    <div className="live-breadcrumb-trail">
                      <span className="trail-label">{isRtl ? 'مسار المنتج في المتجر:' : 'Storefront Trail:'}</span>
                      <span className="crumb-item">{isRtl ? 'المتجر' : 'Store'}</span>
                      <span className="crumb-arrow">
                        {isRtl ? <FaChevronLeft style={{ fontSize: '10px' }} /> : <FaChevronRight style={{ fontSize: '10px' }} />}
                      </span>
                      <span className="crumb-item primary-crumb">{activeBreadcrumbTrail.rootName}</span>
                      {activeBreadcrumbTrail.subName && (
                        <>
                          <span className="crumb-arrow">
                            {isRtl ? <FaChevronLeft style={{ fontSize: '10px' }} /> : <FaChevronRight style={{ fontSize: '10px' }} />}
                          </span>
                          <span className="crumb-item primary-crumb">{activeBreadcrumbTrail.subName}</span>
                        </>
                      )}
                      <span className="crumb-arrow">
                        {isRtl ? <FaChevronLeft style={{ fontSize: '10px' }} /> : <FaChevronRight style={{ fontSize: '10px' }} />}
                      </span>
                      <span className="crumb-item" style={{ color: '#0f172a', fontWeight: 800 }}>
                        {nameAr || nameEn || (isRtl ? '[اسم المنتج]' : '[Product Name]')}
                      </span>
                    </div>
                  )}

                  {/* Category Search Filter */}
                  <div className="category-filter-search">
                    <input
                      type="text"
                      placeholder={isRtl ? 'ابحث عن قسم رئيسي أو فرعي بالاسم أو المعرف (ID)...' : 'Search categories by name or ID...'}
                      value={categorySearchQuery}
                      onChange={(e) => setCategorySearchQuery(e.target.value)}
                    />
                    <div className="search-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                    </div>
                  </div>

                  {/* Hierarchy Tree Visual Box */}
                  <div className="categories-tree-box">
                    {loadingPrereqs ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                        {isRtl ? 'جارٍ تحميل شجرة الأقسام...' : 'Loading categories tree...'}
                      </div>
                    ) : prereqError ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#ef4444', fontSize: '13px' }}>
                        <p style={{ marginBottom: '10px', fontWeight: 600 }}>{prereqError}</p>
                        <button
                          type="button"
                          onClick={fetchPrerequisites}
                          style={{
                            padding: '6px 16px',
                            borderRadius: '8px',
                            background: '#0057C2',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '12.5px',
                            fontWeight: 700,
                          }}
                        >
                          {isRtl ? 'إعادة المحاولة' : 'Retry'}
                        </button>
                      </div>
                    ) : filteredTree.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                        {isRtl ? 'لا توجد أقسام مطابقة للبحث' : 'No matching categories found'}
                      </div>
                    ) : (
                      filteredTree.map((root) => {
                        const isRootSelected = selectedCategoryIds.includes(root.id);
                        const isRootPrimary = String(primaryCategoryId) === String(root.id);

                        return (
                          <div key={root.id} className="tree-node-group">
                            {/* Root Category Row */}
                            <div
                              className={`root-category-row ${isRootSelected ? 'selected-root' : ''}`}
                              onClick={() => toggleCategorySelection(root.id)}
                            >
                              <div className="row-left">
                                <input
                                  type="checkbox"
                                  checked={isRootSelected}
                                  onChange={() => { }} // handled by parent onClick
                                />
                                <div className="category-icon-box" style={{ width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <OptionIconRenderer
                                    iconUrl={root.icon_url}
                                    imageUrl={root.image_url}
                                    isSubcategory={false}
                                  />
                                </div>
                                <span className="category-title">
                                  {isRtl ? root.name_ar : root.name_en}
                                </span>
                                <span className="id-badge">ID: {root.id}</span>
                              </div>

                              <div className="row-right">
                                {isRootSelected && (
                                  <button
                                    type="button"
                                    className={`btn-mark-primary ${isRootPrimary ? 'is-primary' : ''}`}
                                    onClick={(e) => setAsPrimaryCategory(root.id, e)}
                                    title={isRtl ? 'تعيين كقسم رئيسي للمنتج' : 'Set as primary category'}
                                  >
                                    {isRootPrimary ? (
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <FaStar style={{ fontSize: 11 }} /> {isRtl ? 'القسم الأساسي' : 'Primary'}
                                      </span>
                                    ) : (
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <FaRegStar style={{ fontSize: 11 }} /> {isRtl ? 'جعله أساسي' : 'Make Primary'}
                                      </span>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Subcategories Nested List */}
                            {root.subcategories && root.subcategories.length > 0 && (
                              <div className="subcategories-list">
                                {root.subcategories.map((sub) => {
                                  const isSubSelected = selectedCategoryIds.includes(sub.id);
                                  const isSubPrimary = String(primaryCategoryId) === String(sub.id);

                                  return (
                                    <div
                                      key={sub.id}
                                      className={`subcategory-row ${isSubSelected ? 'selected-sub' : ''}`}
                                      onClick={() => toggleCategorySelection(sub.id)}
                                    >
                                      <div className="sub-left">
                                        <input
                                          type="checkbox"
                                          checked={isSubSelected}
                                          onChange={() => { }} // handled by parent onClick
                                        />
                                        <div className="sub-icon-box" style={{ width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                          <OptionIconRenderer
                                            iconUrl={sub.icon_url}
                                            imageUrl={sub.image_url}
                                            isSubcategory={true}
                                          />
                                        </div>
                                        <span className="sub-title">
                                          {isRtl ? sub.name_ar : sub.name_en}
                                        </span>
                                        <span className="sub-id-badge">ID: {sub.id}</span>
                                      </div>

                                      <div className="sub-right">
                                        {isSubSelected && (
                                          <button
                                            type="button"
                                            className={`btn-mark-primary ${isSubPrimary ? 'is-primary' : ''}`}
                                            onClick={(e) => setAsPrimaryCategory(sub.id, e)}
                                            title={isRtl ? 'تعيين كقسم رئيسي للمنتج' : 'Set as primary category'}
                                          >
                                            {isSubPrimary ? (
                                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                <FaStar style={{ fontSize: 10 }} /> {isRtl ? 'القسم الأساسي' : 'Primary'}
                                              </span>
                                            ) : (
                                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                <FaRegStar style={{ fontSize: 10 }} /> {isRtl ? 'جعله أساسي' : 'Make Primary'}
                                              </span>
                                            )}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Summary Bar */}
                  <div className="selected-summary-bar">
                    <div>
                      <span>{isRtl ? 'الأقسام المحددة: ' : 'Selected Categories: '}</span>
                      <strong className="badge-count">{selectedCategoryIds.length}</strong>
                      {primaryCategoryId && (
                        <span style={{ marginInlineStart: '10px', color: '#0f172a' }}>
                          ({isRtl ? 'الأساسي: ' : 'Primary: '} <code>{primaryCategoryId}</code>)
                        </span>
                      )}
                    </div>
                    {categoryValidationError && (
                      <span style={{ color: '#ef4444', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <FaCircleXmark />
                        <span>{isRtl ? 'مطلوب تحديد قسم واحد على الأقل' : 'At least 1 category required'}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 3: Pricing & Profitability Dashboard */}
              <div className="form-section-card">
                <div className="section-header">
                  <div className="title-wrap">
                    <div className="section-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                    </div>
                    <h2>{isRtl ? 'التسعير وتحليلات الأرباح' : 'Pricing & Profit Analytics'}</h2>
                    <span className="mandatory-tag">{isRtl ? 'إجباري السعر' : 'Price Required'}</span>
                  </div>
                </div>

                <div className="form-group-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  <div className="form-group">
                    <label>
                      <span>{isRtl ? 'سعر التكلفة (ج.م)' : 'Cost Price (EGP)'}</span>
                      <span className="label-hint">{isRtl ? 'لحساب الأرباح' : 'For Margin'}</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <span>{isRtl ? 'السعر الأصلي (ج.م)' : 'Original Price (EGP)'}</span>
                      <span className="req">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <span>{isRtl ? 'سعر الخصم / العرض (ج.م)' : 'Sale Price (EGP)'}</span>
                      <span className="label-hint">{isRtl ? 'اختياري' : 'Optional'}</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                    />
                  </div>
                </div>

                {/* Live Profitability Dashboard Box */}
                <div className="profitability-dashboard-box">
                  <div className="metric-card">
                    <span className="metric-label">{isRtl ? 'صافي الربح المتوقع' : 'Estimated Profit'}</span>
                    <span className="metric-val profit-val">
                      {metrics.netProfit} <small style={{ fontSize: '11px' }}>{isRtl ? 'ج.م' : 'EGP'}</small>
                    </span>
                  </div>

                  <div className="metric-card">
                    <span className="metric-label">{isRtl ? 'هامش الربح (Margin)' : 'Profit Margin'}</span>
                    <span className="metric-val profit-val">
                      {metrics.margin}%
                    </span>
                  </div>

                  <div className="metric-card">
                    <span className="metric-label">{isRtl ? 'نسبة التخفيض' : 'Discount Rate'}</span>
                    <span className={`metric-val ${metrics.discount > 0 ? 'discount-val' : ''}`}>
                      {metrics.discount > 0 ? `${metrics.discount}%` : (isRtl ? 'بدون خصم' : 'No discount')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 4: Inventory & Codes */}
              <div className="form-section-card">
                <div className="section-header">
                  <div className="title-wrap">
                    <div className="section-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                        <line x1="12" y1="22.08" x2="12" y2="12"></line>
                      </svg>
                    </div>
                    <h2>{isRtl ? 'المخزون والأكواد ومستوى التنبيه' : 'Inventory & Tracking'}</h2>
                  </div>
                </div>

                <div className="form-group-grid">
                  <div className="form-group">
                    <label>{isRtl ? 'رمز SKU المميز' : 'SKU Code'}</label>
                    <div className="input-with-button-wrap">
                      <input
                        type="text"
                        placeholder="e.g. TRD-CISCO-8492"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                      />
                      <button type="button" className="btn-inner-action" onClick={generateSkuCode}>
                        {isRtl ? 'توليد تلقائي' : 'Generate'}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>{isRtl ? 'الباركود الدولي (EAN / Barcode)' : 'Barcode'}</label>
                    <div className="input-with-button-wrap">
                      <input
                        type="text"
                        placeholder="e.g. 6221234567890"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                      />
                      <button type="button" className="btn-inner-action" onClick={generateBarcodeCode}>
                        {isRtl ? 'توليد باركود' : 'Generate'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-group-grid">
                  <div className="form-group">
                    <label>
                      <span>{isRtl ? 'الكمية المتوفرة بالمخزن' : 'Stock Quantity'}</span>
                      <span className="req">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <span>{isRtl ? 'حد تنبيه انخفاض المخزون' : 'Low Stock Alert Threshold'}</span>
                      <span className="label-hint">{isRtl ? 'ينبهك النظام عند الوصول له' : 'Alert Trigger'}</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Card 5: Technical Specifications Repeater */}
              <div className="form-section-card">
                <div className="section-header">
                  <div className="title-wrap">
                    <div className="section-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                        <rect x="9" y="9" width="6" height="6"></rect>
                        <line x1="9" y1="1" x2="9" y2="4"></line>
                        <line x1="15" y1="1" x2="15" y2="4"></line>
                        <line x1="9" y1="20" x2="9" y2="23"></line>
                        <line x1="15" y1="20" x2="15" y2="23"></line>
                        <line x1="20" y1="9" x2="23" y2="9"></line>
                        <line x1="20" y1="14" x2="23" y2="14"></line>
                        <line x1="1" y1="9" x2="4" y2="9"></line>
                        <line x1="1" y1="14" x2="4" y2="14"></line>
                      </svg>
                    </div>
                    <h2>{isRtl ? 'المواصفات الفنية والتقنية (Key-Value)' : 'Technical Specifications'}</h2>
                  </div>
                </div>

                <div className="specs-repeater-container">
                  {specifications.map((spec, idx) => (
                    <div key={idx} className="spec-row">
                      <input
                        type="text"
                        placeholder={isRtl ? 'اسم الخاصية (مثال: المعالج / الرام)' : 'Property (e.g. RAM / Processor)'}
                        value={spec.key}
                        onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder={isRtl ? 'القيمة (مثال: 16GB DDR5 / Core i7)' : 'Value (e.g. 16GB / Core i7)'}
                        value={spec.value}
                        onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn-remove-spec"
                        onClick={() => removeSpecRow(idx)}
                        title={isRtl ? 'حذف هذه الخاصية' : 'Remove specification'}
                      >
                        <FaXmark />
                      </button>
                    </div>
                  ))}

                  <button type="button" className="btn-add-spec-row" onClick={addSpecRow}>
                    <span>+ {isRtl ? 'إضافة مواصفة فنية جديدة' : 'Add New Specification'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ==============================================================
                SIDE COLUMN (Media, Brand, Tags, Visibility)
               ============================================================== */}
            <div className="form-side-column">
              {/* Card 6: Product Images & Media Gallery */}
              <div className="form-section-card">
                <div className="section-header">
                  <div className="title-wrap">
                    <div className="section-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                    </div>
                    <h2>{isRtl ? 'صور المنتج والمعرض' : 'Images & Media'}</h2>
                  </div>
                </div>

                <div className="media-upload-area">
                  {/* Primary Cover Image Preview */}
                  <div className="cover-image-preview-box">
                    {coverImageUrl ? (
                      <img
                        src={coverImageUrl}
                        alt="Product Preview"
                        onError={(e) => {
                          e.target.src = '/icons/fallback-product.svg';
                        }}
                      />
                    ) : (
                      <div className="empty-placeholder">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                        <span>{isRtl ? 'معاينة الصورة الرئيسية' : 'Cover Image Preview'}</span>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>
                      <span>{isRtl ? 'رابط الصورة الرئيسية (Cover)' : 'Primary Image URL'}</span>
                    </label>
                    <input
                      type="text"
                      placeholder="https://.../product.jpg"
                      value={coverImageUrl}
                      onChange={(e) => setCoverImageUrl(e.target.value)}
                    />
                  </div>

                  {/* Additional Gallery Images */}
                  <div className="additional-images-list">
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                      {isRtl ? 'صور إضافية لمعرض المنتج:' : 'Additional Gallery Images:'}
                    </label>

                    {galleryImages.map((imgUrl, gIdx) => (
                      <div key={gIdx} className="gallery-item-row">
                        <input
                          type="text"
                          placeholder={`https://.../gallery-${gIdx + 1}.jpg`}
                          value={imgUrl}
                          onChange={(e) => handleGalleryChange(gIdx, e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn-delete-img"
                          onClick={() => removeGalleryRow(gIdx)}
                          title={isRtl ? 'حذف' : 'Remove'}
                        >
                          <FaXmark />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      style={{
                        height: '34px',
                        borderRadius: '8px',
                        border: '1px dashed #cbd5e1',
                        background: 'transparent',
                        color: 'var(--main-color, #0057C2)',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        marginTop: '4px',
                      }}
                      onClick={addGalleryRow}
                    >
                      + {isRtl ? 'إضافة صورة إضافية' : 'Add Gallery Image'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 7: Brand Selection */}
              <div className="form-section-card">
                <div className="section-header">
                  <div className="title-wrap">
                    <div className="section-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                    </div>
                    <h2>{isRtl ? 'العلامة التجارية (Brand)' : 'Brand'}</h2>
                  </div>
                </div>

                <div className="form-group">
                  <CustomSelect
                    value={selectedBrandId}
                    onChange={(val) => setSelectedBrandId(val)}
                    options={brandOptions}
                    searchable={true}
                    searchPlaceholder={isRtl ? 'ابحث عن ماركة تجارية...' : 'Search brands...'}
                    placeholder={isRtl ? 'اختر العلامة التجارية...' : 'Select Brand...'}
                    isRtl={isRtl}
                  />
                </div>
              </div>

              {/* Card 8: Tags Checklist */}
              <div className="form-section-card">
                <div className="section-header">
                  <div className="title-wrap">
                    <div className="section-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                        <line x1="7" y1="7" x2="7.01" y2="7"></line>
                      </svg>
                    </div>
                    <h2>{isRtl ? 'الوسوم وعلاقات الذكاء' : 'Tags & Rules'}</h2>
                  </div>
                </div>

                <div className="tags-checklist-box">
                  {availableTags.length === 0 ? (
                    <div style={{ padding: '8px', color: '#94a3b8', fontSize: '12px' }}>
                      {isRtl ? 'لا توجد وسوم مضافة حالياً' : 'No tags found'}
                    </div>
                  ) : (
                    availableTags.map((tag) => {
                      const isTagSelected = selectedTagIds.includes(tag.id);
                      return (
                        <label
                          key={tag.id}
                          className={`tag-checkbox-pill ${isTagSelected ? 'selected' : ''}`}
                          onClick={() => toggleTagPill(tag.id)}
                        >
                          <input
                            type="checkbox"
                            checked={isTagSelected}
                            onChange={() => { }}
                          />
                          <span>#{isRtl ? tag.name_ar : tag.name_en}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Card 9: Visibility & Status */}
              <div className="form-section-card">
                <div className="section-header">
                  <div className="title-wrap">
                    <div className="section-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </div>
                    <h2>{isRtl ? 'حالة النشر والظهور' : 'Visibility & Status'}</h2>
                  </div>
                </div>

                <div className="switches-vertical-list">
                  <div className="switch-row">
                    <div className="switch-text">
                      <strong>{isRtl ? 'نشط في المتجر' : 'Active in Store'}</strong>
                      <small>{isRtl ? 'متاح للعملاء للطلب والشراء' : 'Visible and purchasable by clients'}</small>
                    </div>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                  </div>

                  <div className="switch-row">
                    <div className="switch-text">
                      <strong>{isRtl ? 'منتج مميز (Featured)' : 'Featured Product'}</strong>
                      <small>{isRtl ? 'يظهر في بانرات المتجر والواجهة الرئيسية' : 'Spotlighted on homepage'}</small>
                    </div>
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Publishing Bar */}
          <div className="sticky-bottom-bar">
            <div className="status-summary">
              {isFormValid ? (
                <div className="validation-ok">
                  <FaCheck style={{ fontSize: 13 }} />
                  <span>{isRtl ? 'جميع المتطلبات الأساسية مكتملة وجاهزة للنشر' : 'All required fields are completed'}</span>
                </div>
              ) : (
                <div className="validation-alert">
                  <FaTriangleExclamation style={{ fontSize: 13 }} />
                  <span>
                    {isRtl
                      ? 'مطلوب: الاسم، السعر، وقسم واحد على الأقل'
                      : 'Required: Name, Price, and at least 1 Category'}
                  </span>
                </div>
              )}
            </div>

            <div className="bottom-actions">
              <button
                type="button"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '0 18px',
                }}
                onClick={() => handleSubmit(false)}
                disabled={submitting}
              >
                {isRtl ? 'حفظ كمسودة' : 'Save Draft'}
              </button>

              <button
                type="button"
                className="btn-bottom-publish"
                onClick={() => handleSubmit(true)}
                disabled={submitting}
              >
                {submitting ? (
                  <span>{isRtl ? 'جارٍ النشر...' : 'Publishing...'}</span>
                ) : (
                  <span>{isRtl ? 'حفظ ونشر المنتج' : 'Publish Product'}</span>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
