'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  AdminSidebar,
  AdminHeader,
  CustomSelect,
  OptionIconRenderer,
  ProductShowcaseStudio,
  DEFAULT_SHOWCASE_TABS,
  useToast,
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
  FaCloudArrowUp,
  FaImage,
  FaVideo,
  FaFilm,
  FaTrashCan,
  FaArrowsRotate,
  FaCircleCheck,
  FaPlay,
  FaPause,
  FaClock,
  FaCompress,
  FaWandMagicSparkles,
  FaPlus,
  FaEye,
  FaCopyright,
} from 'react-icons/fa6';
import dynamic from 'next/dynamic';
import { formatFactory, formatDuration, formatBytes } from '@/src/utils/formatFactory';
import StoreProductCard from '@/src/components/common/StoreProductCard/StoreProductCard';
import './AddProduct.scss';

const QuillEditor = dynamic(
  () => import('@/src/components/adminComponents/QuillEditor/QuillEditor'),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          minHeight: '180px',
          background: '#f8fafc',
          border: '1.5px solid #e2e8f0',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
          fontSize: '13px',
          fontWeight: 600,
        }}
      >
        جارٍ تهيئة محرر النصوص المتطور...
      </div>
    ),
  }
);

export default function AddProductPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const toast = useToast();

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

  // Media Processing & Feedback State
  const [mediaError, setMediaError] = useState('');
  const [mediaNotice, setMediaNotice] = useState('');
  const [coverLoading, setCoverLoading] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);

  // Hidden File Input Refs
  const coverInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const videoInputRef = useRef(null);

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
  const [selectedRootCategoryId, setSelectedRootCategoryId] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [primaryCategoryId, setPrimaryCategoryId] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [categoryValidationError, setCategoryValidationError] = useState(false);

  // Form Fields - Pricing & Profitability
  const [costPrice, setCostPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [saleEndsAt, setSaleEndsAt] = useState('');
  const [currentMinDate, setCurrentMinDate] = useState('');
  const [nowTimestamp, setNowTimestamp] = useState(null);

  useEffect(() => {
    const now = new Date();
    setTimeout(() => {
      setCurrentMinDate(now.toISOString().slice(0, 16));
      setNowTimestamp(now.getTime());
    }, 10);
  }, []);

  // Form Fields - Inventory & Codes
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [stockQuantity, setStockQuantity] = useState(10);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [uniquenessErrors, setUniquenessErrors] = useState({});
  const [checkingUnique, setCheckingUnique] = useState({});

  // Form Fields - Brand
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [showQuickAddBrand, setShowQuickAddBrand] = useState(false);
  const [quickBrandNameAr, setQuickBrandNameAr] = useState('');
  const [quickBrandNameEn, setQuickBrandNameEn] = useState('');
  const [quickBrandLoading, setQuickBrandLoading] = useState(false);

  // Form Fields - Advanced Media Assets (Cover, Gallery <= 9, Video <= 2)
  const [coverMedia, setCoverMedia] = useState(null); // { previewUrl, uploadedUrl, formattedSize, savingsPercent, width, height, ... }
  const [galleryMedia, setGalleryMedia] = useState([]); // Array of max 9 items
  const [videoMedia, setVideoMedia] = useState([]); // Array of max 2 items

  // Form Fields - Technical Specifications (Bilingual: Arabic + English)
  const [specifications, setSpecifications] = useState([
    { key_ar: '', key_en: '', value_ar: '', value_en: '', key: '', value: '' },
  ]);

  // Form Fields - Product Showcase & Feature Pillars Studio
  const [showcaseTabs, setShowcaseTabs] = useState(DEFAULT_SHOWCASE_TABS);

  // Form Fields - Tags
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [showQuickAddTag, setShowQuickAddTag] = useState(false);
  const [quickTagNameAr, setQuickTagNameAr] = useState('');
  const [quickTagNameEn, setQuickTagNameEn] = useState('');
  const [quickTagLoading, setQuickTagLoading] = useState(false);

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
      }, 10);
    } else {
      setTimeout(() => {
        setAdminUser({ name: 'مدير المتجر', email: 'admin@trendlineeg.com', role: 'SUPER_ADMIN' });
      }, 10);
    }
  }, [session, status, router]);

  // Determine backend API Host (Relative URL for single-port Next.js)
  const getApiHost = useCallback(() => {
    return '';
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
    }, 20);
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

  // Quick Preset Handlers for Discount Expiration
  const setSaleEndPreset = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(23, 59, 0, 0);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    setSaleEndsAt(`${year}-${month}-${day}T${hours}:${minutes}`);
  };

  const setSaleEndMonth = () => {
    const d = new Date();
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59);
    const year = endOfMonth.getFullYear();
    const month = String(endOfMonth.getMonth() + 1).padStart(2, '0');
    const day = String(endOfMonth.getDate()).padStart(2, '0');
    const hours = String(endOfMonth.getHours()).padStart(2, '0');
    const minutes = String(endOfMonth.getMinutes()).padStart(2, '0');
    setSaleEndsAt(`${year}-${month}-${day}T${hours}:${minutes}`);
  };

  const saleRemainingText = useMemo(() => {
    if (!saleEndsAt || !nowTimestamp) return null;
    const target = new Date(saleEndsAt);
    const diffMs = target.getTime() - nowTimestamp;
    if (diffMs <= 0) {
      return { expired: true, text: isRtl ? 'انتهت فترة الخصم المحددة' : 'Discount expired' };
    }
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (diffDays > 0) {
      return {
        expired: false,
        text: isRtl
          ? `ينتهي الخصم بعد ${diffDays} يوم${diffDays > 1 ? 'اً' : ''} و ${diffHours} ساعة`
          : `Ends in ${diffDays}d ${diffHours}h`,
      };
    }
    return {
      expired: false,
      text: isRtl ? `ينتهي الخصم خلال ${diffHours} ساعة` : `Ends in ${diffHours}h`,
    };
  }, [saleEndsAt, nowTimestamp, isRtl]);

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

  // Root Category Options for Root Category Selector
  const rootCategoryOptions = useMemo(() => {
    const defaultPlaceholder = {
      value: '',
      label: isRtl ? '-- اختر القسم الرئيسي أولاً لاستعراض أقسامه الفرعية --' : '-- Select Parent Category first --',
      icon: <FaFolderTree style={{ color: '#94a3b8' }} />,
    };

    const options = categoriesTree.map((root) => ({
      value: String(root.id),
      label: isRtl ? root.name_ar : root.name_en,
      image_url: root.image_url,
      icon_url: root.icon_url,
      idBadge: `ID: ${root.id}`,
    }));

    return [defaultPlaceholder, ...options];
  }, [categoriesTree, isRtl]);

  // Currently selected root category object and its subcategories
  const currentRootCategory = useMemo(() => {
    if (!selectedRootCategoryId) return null;
    return categoriesTree.find((c) => String(c.id) === String(selectedRootCategoryId)) || null;
  }, [categoriesTree, selectedRootCategoryId]);

  const availableSubcategories = useMemo(() => {
    if (!currentRootCategory) return [];
    return currentRootCategory.subcategories || [];
  }, [currentRootCategory]);

  // Standard EAN-13 Check Digit Calculation
  const calculateEAN13Check = (code12) => {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(code12[i], 10);
      sum += (i % 2 === 0) ? digit : digit * 3;
    }
    return (10 - (sum % 10)) % 10;
  };

  // Code Generators (Guaranteed unique EAN-13 & SKU)
  const generateBarcodeCode = async () => {
    try {
      const apiHost = getApiHost();
      const res = await fetch(`${apiHost}/api/v1/catalog/products/generate-codes`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.barcode) {
          setBarcode(json.data.barcode);
          setUniquenessErrors((prev) => ({ ...prev, barcode: null }));
          return;
        }
      }
    } catch (e) {}

    // Fallback standard EAN-13
    const prefix = '622';
    let code12 = prefix;
    for (let i = 0; i < 9; i++) {
      code12 += Math.floor(Math.random() * 10);
    }
    const check = calculateEAN13Check(code12);
    setBarcode(`${code12}${check}`);
    setUniquenessErrors((prev) => ({ ...prev, barcode: null }));
  };

  const generateSkuCode = async (targetCatId) => {
    const catId = targetCatId || primaryCategoryId;
    try {
      const apiHost = getApiHost();
      const res = await fetch(`${apiHost}/api/v1/catalog/products/generate-codes?category_id=${encodeURIComponent(catId || '')}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.sku) {
          setSku(json.data.sku);
          setUniquenessErrors((prev) => ({ ...prev, sku: null }));
          return;
        }
      }
    } catch (e) {}

    const prefix = 'TRD';
    const catCode = catId ? String(catId).replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() : 'GEN';
    const rand = Math.floor(10000 + Math.random() * 90000);
    setSku(`${prefix}-${catCode || 'GEN'}-${rand}`);
    setUniquenessErrors((prev) => ({ ...prev, sku: null }));
  };

  // Live Uniqueness Checker for SKU, Barcode, Slug, Name AR, Name EN
  const checkFieldUniqueness = useCallback(async (fieldName, value, excludeId = null) => {
    if (!value || !value.trim()) {
      setUniquenessErrors((prev) => ({ ...prev, [fieldName]: null }));
      return true;
    }
    try {
      setCheckingUnique((prev) => ({ ...prev, [fieldName]: true }));
      const apiHost = getApiHost();
      const url = `${apiHost}/api/v1/catalog/products/check-unique?${encodeURIComponent(fieldName)}=${encodeURIComponent(value.trim())}${excludeId ? `&exclude_id=${encodeURIComponent(excludeId)}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          const conflict = json.conflicts?.[fieldName] || null;
          setUniquenessErrors((prev) => ({ ...prev, [fieldName]: conflict }));
          return !conflict;
        }
      }
    } catch (e) {
      // ignore network glitch
    } finally {
      setCheckingUnique((prev) => ({ ...prev, [fieldName]: false }));
    }
    return true;
  }, []);

  // Auto-generate SKU & EAN-13 Barcode immediately on creation / mount
  useEffect(() => {
    let isMounted = true;
    async function initCodes() {
      try {
        const apiHost = getApiHost();
        const res = await fetch(`${apiHost}/api/v1/catalog/products/generate-codes`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && isMounted) {
            if (json.data.sku) setSku(json.data.sku);
            if (json.data.barcode) setBarcode(json.data.barcode);
            return;
          }
        }
      } catch (e) {}

      if (isMounted) {
        generateSkuCode();
        generateBarcodeCode();
      }
    }
    initCodes();
    return () => { isMounted = false; };
  }, []);

  // Category Multi-selection handlers: Products can ONLY be assigned to subcategories
  const toggleCategorySelection = (categoryId) => {
    // Check if this category is a root category
    const isRoot = categoriesTree.some((root) => String(root.id) === String(categoryId));
    if (isRoot) {
      toast.warning(
        isRtl
          ? 'لا يمكن إضافة المنتج في قسم رئيسي مباشرة! يرجى اختيار قسم فرعي تابع له.'
          : 'Products cannot be assigned directly to a root category! Please select a subcategory.',
        isRtl ? 'تنبيه التسلسل الهرمي' : 'Hierarchy Rule'
      );
      return;
    }

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
    const isRoot = categoriesTree.some((root) => String(root.id) === String(categoryId));
    if (isRoot) {
      toast.warning(
        isRtl
          ? 'لا يمكن تعيين قسم رئيسي كقسم أساسي للمنتج! يجب أن يكون قسماً فرعياً.'
          : 'Root categories cannot be set as primary. Please choose a subcategory.',
        isRtl ? 'تنبيه التسلسل الهرمي' : 'Hierarchy Rule'
      );
      return;
    }

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

    const target = flatCategories.find((c) => String(c.id) === String(primaryCategoryId));
    if (!target) return null;

    if (target.parent_id) {
      const parent = flatCategories.find((c) => String(c.id) === String(target.parent_id));
      return {
        rootName: parent ? (isRtl ? parent.name_ar : parent.name_en) : null,
        subName: isRtl ? target.name_ar : target.name_en,
      };
    }

    return {
      rootName: isRtl ? target.name_ar : target.name_en,
      subName: null,
    };
  }, [primaryCategoryId, flatCategories, isRtl]);

  // Selected Categories full hierarchy model
  const selectedCategoriesData = useMemo(() => {
    return selectedCategoryIds.map((catId) => {
      const cat = flatCategories.find((c) => String(c.id) === String(catId));
      if (!cat) {
        return {
          id: catId,
          name_ar: `قسم #${catId}`,
          name_en: `Category #${catId}`,
          slug: String(catId),
          parent: null,
          isPrimary: String(primaryCategoryId) === String(catId),
        };
      }
      const parent = cat.parent_id
        ? flatCategories.find((p) => String(p.id) === String(cat.parent_id))
        : null;
      return {
        ...cat,
        parent,
        isPrimary: String(primaryCategoryId) === String(cat.id),
      };
    });
  }, [selectedCategoryIds, flatCategories, primaryCategoryId]);

  // Live Storefront Product Model for Preview Card
  const livePreviewProduct = useMemo(() => {
    const availImages = [
      ...(coverMedia?.previewUrl || coverMedia?.uploadedUrl
        ? [{ image_url: coverMedia.previewUrl || coverMedia.uploadedUrl, is_primary: true }]
        : []),
      ...galleryMedia
        .filter((g) => g.mediaType !== 'video' && (g.previewUrl || g.uploadedUrl))
        .map((g, idx) => ({
          image_url: g.previewUrl || g.uploadedUrl,
          is_primary: false,
          sort_order: idx + 1,
        })),
    ];

    const curBrand = brands.find((b) => String(b.id) === String(selectedBrandId));

    return {
      id: 'preview',
      slug: slug || 'preview-product',
      name_ar: nameAr || (isRtl ? 'اسم المنتج النموذجي' : 'Sample Product Title'),
      name_en: nameEn || 'Sample Product Title',
      short_desc_ar: shortDescAr,
      short_desc_en: shortDescEn,
      description_ar: descriptionAr,
      sku: sku || 'PRD-PREVIEW',
      brand: curBrand ? { name_ar: curBrand.name_ar, name_en: curBrand.name_en } : null,
      original_price: originalPrice ? parseFloat(originalPrice) : 0,
      sale_price: salePrice ? parseFloat(salePrice) : (originalPrice ? parseFloat(originalPrice) : 0),
      discount_percent: metrics.discount,
      stock_quantity: stockQuantity ? parseInt(stockQuantity, 10) : 12,
      reserved_stock: 0,
      is_featured: isFeatured,
      images: availImages,
    };
  }, [
    coverMedia,
    galleryMedia,
    brands,
    selectedBrandId,
    slug,
    nameAr,
    nameEn,
    shortDescAr,
    shortDescEn,
    descriptionAr,
    sku,
    originalPrice,
    salePrice,
    metrics.discount,
    stockQuantity,
    isFeatured,
    isRtl,
  ]);

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

  // Specifications Repeater Handlers (Bilingual)
  const handleSpecChange = (index, field, value) => {
    setSpecifications((prev) => {
      const copy = [...prev];
      const current = copy[index] || {};
      copy[index] = {
        ...current,
        [field]: value,
        key: field === 'key_ar' ? value : (current.key_ar || current.key || ''),
        value: field === 'value_ar' ? value : (current.value_ar || current.value || ''),
      };
      return copy;
    });
  };

  const addSpecRow = () => {
    setSpecifications((prev) => [
      ...prev,
      { key_ar: '', key_en: '', value_ar: '', value_en: '', key: '', value: '' },
    ]);
  };

  const removeSpecRow = (index) => {
    setSpecifications((prev) => prev.filter((_, i) => i !== index));
  };

  // Tag Pill Toggle
  const toggleTagPill = (tagId) => {
    const idStr = String(tagId);
    setSelectedTagIds((prev) =>
      prev.map(String).includes(idStr)
        ? prev.filter((id) => String(id) !== idStr)
        : [...prev, tagId]
    );
  };

  // Quick Add Brand (Arabic and English name only)
  const handleQuickAddBrand = async (e) => {
    e?.preventDefault();
    if (!quickBrandNameAr.trim() || !quickBrandNameEn.trim()) {
      toast.warning(
        isRtl ? 'يرجى كتابة اسم البراند بالعربية والإنجليزية' : 'Please provide both Arabic and English brand names',
        isRtl ? 'بيانات ناقصة' : 'Missing Fields'
      );
      return;
    }

    try {
      setQuickBrandLoading(true);
      const token = await ensureAuthToken();
      const apiHost = getApiHost();

      const payload = {
        name_ar: quickBrandNameAr.trim(),
        name_en: quickBrandNameEn.trim(),
        slug: quickBrandNameEn.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        logo_url: '/icons/category-default.svg',
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

      if (res.ok && data.success && data.data) {
        const createdBrand = data.data;
        setBrands((prev) => [createdBrand, ...prev]);
        setSelectedBrandId(String(createdBrand.id));
        setQuickBrandNameAr('');
        setQuickBrandNameEn('');
        setShowQuickAddBrand(false);

        toast.success(
          isRtl
            ? `تمت إضافة البراند "${createdBrand.name_ar}" واختياره للمنتج!`
            : `Brand "${createdBrand.name_en}" added and selected!`,
          isRtl ? 'إضافة سريعة للبراند' : 'Brand Added'
        );
      } else {
        toast.error(
          data.message || (isRtl ? 'تعذر إنشاء البراند' : 'Failed to create brand'),
          isRtl ? 'خطأ' : 'Error'
        );
      }
    } catch (err) {
      console.error('Error in quick adding brand:', err);
      toast.error(
        isRtl ? 'حدث خطأ أثناء الاتصال بالخادم' : 'Server connection error',
        isRtl ? 'خطأ' : 'Error'
      );
    } finally {
      setQuickBrandLoading(false);
    }
  };

  // Quick Add Tag (Arabic and English name)
  const handleQuickAddTag = async (e) => {
    e?.preventDefault();
    if (!quickTagNameAr.trim() || !quickTagNameEn.trim()) {
      toast.warning(
        isRtl ? 'يرجى كتابة اسم الوسم بالعربية والإنجليزية' : 'Please provide both Arabic and English tag names',
        isRtl ? 'بيانات ناقصة' : 'Missing Fields'
      );
      return;
    }

    try {
      setQuickTagLoading(true);
      const token = await ensureAuthToken();
      const apiHost = getApiHost();

      const payload = {
        name_ar: quickTagNameAr.trim(),
        name_en: quickTagNameEn.trim(),
        slug: quickTagNameEn.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      };

      const res = await fetch(`${apiHost}/api/v1/catalog/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success && data.data) {
        const createdTag = data.data;
        setAvailableTags((prev) => {
          if (prev.some((t) => t.id === createdTag.id)) return prev;
          return [...prev, createdTag];
        });
        setSelectedTagIds((prev) =>
          prev.includes(createdTag.id) ? prev : [...prev, createdTag.id]
        );
        setQuickTagNameAr('');
        setQuickTagNameEn('');
        setShowQuickAddTag(false);

        toast.success(
          isRtl
            ? `تمت إضافة الوسم "${createdTag.name_ar}" وتحديده للمنتج!`
            : `Tag "${createdTag.name_en}" added and selected!`,
          isRtl ? 'إضافة سريعة للوسم' : 'Tag Added'
        );
      } else {
        toast.error(
          data.message || (isRtl ? 'تعذر إنشاء الوسم' : 'Failed to create tag'),
          isRtl ? 'خطأ' : 'Error'
        );
      }
    } catch (err) {
      console.error('Error in quick adding tag:', err);
      toast.error(
        isRtl ? 'حدث خطأ أثناء الاتصال بالخادم' : 'Server connection error',
        isRtl ? 'خطأ' : 'Error'
      );
    } finally {
      setQuickTagLoading(false);
    }
  };

  // =========================================================================
  // Upload Helper (Saves to server /uploads/products/ via Next.js API)
  // =========================================================================
  const uploadMediaFile = async (file, mediaType = 'image') => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mediaType', mediaType);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.url) {
          return data;
        }
      }
    } catch (err) {
      console.warn('Background upload note:', err);
    }
    return null;
  };

  // =========================================================================
  // MEDIA HANDLER: Primary Cover Image (Processed through formatFactory WebP 80%)
  // =========================================================================
  const handleCoverSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCoverLoading(true);
      setMediaError('');
      setMediaNotice('');

      // Run formatFactory on the image
      const result = await formatFactory(file, { quality: 0.8 });

      const tempCover = {
        previewUrl: result.previewUrl,
        originalName: result.originalName,
        formattedName: result.formattedName,
        originalSize: result.originalSize,
        formattedSize: result.formattedSize,
        savingsPercent: result.savingsPercent,
        width: result.width,
        height: result.height,
        uploading: true,
        uploadedUrl: '',
      };
      setCoverMedia(tempCover);

      // Upload formatted WebP to server in background
      const uploadRes = await uploadMediaFile(result.file, 'image');
      const uploadedUrl = uploadRes?.url || (typeof uploadRes === 'string' ? uploadRes : null);
      setCoverMedia((prev) =>
        prev
          ? {
            ...prev,
            uploadedUrl: uploadedUrl || prev.previewUrl,
            uploading: false,
          }
          : null
      );
    } catch (err) {
      console.error('Cover processing error:', err);
      setMediaError(err.message || 'حدث خطأ أثناء معالجة غلاف المنتج');
    } finally {
      setCoverLoading(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const removeCoverImage = () => {
    setCoverMedia(null);
  };

  // =========================================================================
  // MEDIA HANDLER: Additional Gallery Images (Max 9 Images)
  // =========================================================================
  const handleGallerySelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentCount = galleryMedia.length;
    const availableSlots = 9 - currentCount;

    if (availableSlots <= 0) {
      setMediaError(isRtl ? 'تم بلوغ الحد الأقصى لمعرض الصور (9 صور إضافية كحد أقصى).' : 'Maximum 9 gallery images reached.');
      return;
    }

    const filesToProcess = files.slice(0, availableSlots);
    if (files.length > availableSlots) {
      setMediaNotice(
        isRtl
          ? `تم قبول ${availableSlots} صور فقط لبلوغ السقف المحدد (9 صور كحد أقصى).`
          : `Only ${availableSlots} image(s) processed to adhere to the 9-image limit.`
      );
    }

    setGalleryLoading(true);
    setMediaError('');

    for (const file of filesToProcess) {
      try {
        const result = await formatFactory(file, { quality: 0.8 });
        const tempId = `gal_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        const newMediaItem = {
          id: tempId,
          previewUrl: result.previewUrl,
          originalName: result.originalName,
          formattedName: result.formattedName,
          originalSize: result.originalSize,
          formattedSize: result.formattedSize,
          savingsPercent: result.savingsPercent,
          width: result.width,
          height: result.height,
          uploading: true,
          uploadedUrl: '',
        };

        setGalleryMedia((prev) => [...prev, newMediaItem]);

        // Background server upload
        uploadMediaFile(result.file, 'image').then((uploadRes) => {
          const uploadedUrl = uploadRes?.url || (typeof uploadRes === 'string' ? uploadRes : null);
          setGalleryMedia((prev) =>
            prev.map((item) =>
              item.id === tempId
                ? { ...item, uploadedUrl: uploadedUrl || item.previewUrl, uploading: false }
                : item
            )
          );
        });
      } catch (err) {
        console.error('Gallery image error:', err);
        setMediaError(err.message || 'حدث خطأ أثناء معالجة وضغط صورة المعرض');
      }
    }

    setGalleryLoading(false);
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const removeGalleryImage = (index) => {
    setGalleryMedia((prev) => prev.filter((_, i) => i !== index));
  };

  // Quick Action: Swap Gallery Image to Cover Image
  const makeGalleryImageCover = (galleryIndex) => {
    const target = galleryMedia[galleryIndex];
    if (!target) return;

    const oldCover = coverMedia;
    setCoverMedia({
      ...target,
      id: undefined,
    });

    const remaining = galleryMedia.filter((_, idx) => idx !== galleryIndex);
    if (oldCover) {
      setGalleryMedia([
        ...remaining,
        {
          ...oldCover,
          id: `gal_${Date.now()}`,
        },
      ]);
    } else {
      setGalleryMedia(remaining);
    }
  };

  // =========================================================================
  // MEDIA HANDLER: Product Videos (Max 2 Videos, Max 60s, 720p HD)
  // =========================================================================
  const handleVideoSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (videoMedia.length >= 2) {
      const msg = isRtl ? 'تم بلوغ الحد الأقصى لمقاطع الفيديو (مقطعان كحد أقصى للمنتج).' : 'Maximum 2 product videos reached.';
      setMediaError(msg);
      toast.warning(msg, isRtl ? 'تنبيه الوسائط' : 'Media Limit');
      return;
    }

    const file = files[0];
    setVideoLoading(true);
    setMediaError('');
    setMediaNotice('');

    try {
      // Process through formatFactory with 60s and 720p enforcement
      const result = await formatFactory(file, { maxDurationSec: 60 });

      if (!result.success) {
        const msg = result.error || 'تعذر معالجة ملف الفيديو';
        setMediaError(msg);
        toast.error(msg, isRtl ? 'خطأ في معالجة الفيديو' : 'Video Error');
        return;
      }

      const tempId = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const newVideoItem = {
        id: tempId,
        previewUrl: result.previewUrl,
        posterUrl: result.posterUrl,
        originalName: result.originalName,
        size: result.originalSize,
        duration: result.duration,
        durationFormatted: result.durationFormatted,
        resolutionBadge: result.resolutionBadge,
        width: result.width,
        height: result.height,
        isScaledDown: result.isScaledDown,
        uploading: true,
        uploadedUrl: '',
      };

      setVideoMedia((prev) => [...prev, newVideoItem]);
      toast.success(
        isRtl
          ? `تم قبول ومعالجة الفيديو (${result.durationFormatted}) بدقة ${result.resolutionBadge} بنجاح`
          : `Video processed successfully (${result.durationFormatted}) at ${result.resolutionBadge}`,
        isRtl ? 'معالجة الفيديو' : 'Video Success'
      );

      // Upload video to server in background (compressed & resized to 720p via FFmpeg)
      uploadMediaFile(file, 'video').then((uploadRes) => {
        const uploadedUrl = uploadRes?.url || (typeof uploadRes === 'string' ? uploadRes : null);
        const finalSize = uploadRes?.size;
        const savingsPercent = uploadRes?.savingsPercent;
        setVideoMedia((prev) =>
          prev.map((item) =>
            item.id === tempId
              ? {
                  ...item,
                  uploadedUrl: uploadedUrl || item.previewUrl,
                  size: finalSize || item.size,
                  savingsPercent: savingsPercent || 0,
                  resolutionBadge: uploadRes?.resolutionBadge || '720p HD Optimized',
                  uploading: false,
                }
              : item
          )
        );

        if (finalSize && uploadRes?.isCompressed) {
          toast.success(
            isRtl
              ? `تم ضغط الفيديو وتخفيضه إلى 720p بنجاح (الحجم الجديد: ${formatBytes(finalSize)})`
              : `Video compressed to 720p (${formatBytes(finalSize)})`,
            isRtl ? 'ضغط الفيديو' : 'Video Compressed'
          );
        }
      });
    } catch (err) {
      console.error('Video error:', err);
      const msg = err.message || 'حدث خطأ أثناء فحص ومعالجة الفيديو';
      setMediaError(msg);
      toast.error(msg, isRtl ? 'تنبيه فحص الفيديو' : 'Video Validation Error');
    } finally {
      setVideoLoading(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const removeVideo = (index) => {
    setVideoMedia((prev) => prev.filter((_, i) => i !== index));
  };

  // Validation Check
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

    // Check if any active uniqueness conflict exists
    const activeConflicts = Object.values(uniquenessErrors).filter(Boolean);
    if (activeConflicts.length > 0) {
      setErrorMessage(activeConflicts[0]);
      toast.error(activeConflicts[0], isRtl ? 'تعارض بيانات' : 'Uniqueness Conflict');
      return;
    }

    setSubmitting(true);

    try {
      const token = await ensureAuthToken();
      const apiHost = getApiHost();

      // Build Specifications Payload (Bilingual Items + Legacy Key-Value Map)
      const validSpecs = specifications.filter(
        (s) =>
          (s.key_ar && s.key_ar.trim()) ||
          (s.key_en && s.key_en.trim()) ||
          (s.key && s.key.trim())
      );

      const specsItems = validSpecs.map((s) => ({
        key_ar: (s.key_ar || s.key || '').trim(),
        key_en: (s.key_en || '').trim(),
        value_ar: (s.value_ar || s.value || '').trim(),
        value_en: (s.value_en || '').trim(),
        key: (s.key_ar || s.key || '').trim(),
        value: (s.value_ar || s.value || '').trim(),
      }));

      const specsObject = {};
      specsItems.forEach((s) => {
        if (s.key_ar) {
          specsObject[s.key_ar] = s.value_ar;
        } else if (s.key_en) {
          specsObject[s.key_en] = s.value_en;
        }
      });

      // Build Image URLs Payload (Cover first, followed by up to 9 gallery images)
      const imagesPayload = [];
      if (coverMedia?.uploadedUrl || coverMedia?.previewUrl) {
        imagesPayload.push(coverMedia.uploadedUrl || coverMedia.previewUrl);
      }
      galleryMedia.forEach((g) => {
        const url = g.uploadedUrl || g.previewUrl;
        if (url && !imagesPayload.includes(url)) {
          imagesPayload.push(url);
        }
      });

      // Build Video URLs Payload (Up to 2 videos, max 60s, 720p HD)
      const videosPayload = videoMedia.map((v) => ({
        url: v.uploadedUrl || v.previewUrl,
        poster_url: v.posterUrl,
        duration: v.duration,
        duration_formatted: v.durationFormatted,
        resolution: v.resolutionBadge,
        name: v.originalName,
        size: v.size,
      }));

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
        sale_ends_at: saleEndsAt ? new Date(saleEndsAt).toISOString() : null,
        stock_quantity: parseInt(stockQuantity, 10) || 0,
        low_stock_threshold: parseInt(lowStockThreshold, 10) || 5,
        short_desc_ar: shortDescAr.trim() || null,
        short_desc_en: shortDescEn.trim() || null,
        description_ar: descriptionAr.trim() || null,
        description_en: descriptionEn.trim() || null,
        specifications: {
          ...specsObject,
          items: specsItems,
          ...(videosPayload.length > 0 ? { media_videos: videosPayload } : {}),
        },
        showcase_tabs: showcaseTabs,
        image_urls: imagesPayload,
        video_urls: videosPayload,
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

      const successText = isRtl ? 'تم حفظ ونشر المنتج بنجاح! يتم التحويل إلى قائمة المنتجات...' : 'Product created successfully! Redirecting...';
      setSuccessMessage(successText);
      toast.success(successText, isRtl ? 'إضافة منتج' : 'Product Created');
      setTimeout(() => {
        router.push('/admin/products');
      }, 1200);
    } catch (err) {
      console.error('Save product error:', err);
      let errorText = err.message || (isRtl ? 'تعذر حفظ المنتج، تحقق من البيانات والاتصال بالخادم' : 'Failed to save product');
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        errorText = isRtl
          ? 'تعذر الاتصال بالخادم. يرجى التأكد من تشغيل خادم الباك إند (Port 5000).'
          : 'Could not connect to server. Please verify backend is running on port 5000.';
      }
      setErrorMessage(errorText);
      toast.error(errorText, isRtl ? 'خطأ في الحفظ' : 'Submission Error');
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
              <span className="current-crumb">{isRtl ? 'إضافة منتج متكامل' : 'New Product'}</span>
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
                  <span>{isRtl ? 'جارٍ المعالجة والنشر...' : 'Publishing...'}</span>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    <span>{isRtl ? 'نشر المنتج في المتجر' : 'Publish Product'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="alert-message-banner alert-error">
              <FaTriangleExclamation />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="alert-message-banner alert-success">
              <FaCircleCheck />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Two-Column Form Layout */}
          <div className="product-form-layout">
            {/* ==============================================================
                MAIN COLUMN
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
                    <div>
                      <h2>{isRtl ? 'البيانات الأساسية والهوية التجارية' : 'Core Product Details'}</h2>
                      <p className="section-subtitle">
                        {isRtl
                          ? 'تحديد الاسم التجاري باللغتين والرابط الدائم وتفاصيل الوصف التسويقي.'
                          : 'Define multilingual product names, unique slug, and marketing descriptions.'}
                      </p>
                    </div>
                  </div>
                  <span className="mandatory-tag">{isRtl ? 'حقول إجبارية' : 'Required'}</span>
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
                      className={uniquenessErrors.name_ar ? 'has-unique-error' : ''}
                      placeholder={isRtl ? 'مثال: سويتش سيسكو كاتاليست 2960 جيجابت إيثرنت' : 'e.g. Cisco Catalyst 2960 Switch'}
                      value={nameAr}
                      onChange={(e) => {
                        setNameAr(e.target.value);
                        if (uniquenessErrors.name_ar) setUniquenessErrors((prev) => ({ ...prev, name_ar: null }));
                      }}
                      onBlur={() => checkFieldUniqueness('name_ar', nameAr)}
                    />
                    {uniquenessErrors.name_ar && (
                      <span className="unique-field-error">
                        <FaTriangleExclamation />
                        <span>{uniquenessErrors.name_ar}</span>
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>
                      <span>{isRtl ? 'اسم المنتج بالإنجليزية' : 'Product Name (English)'}</span>
                      <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className={uniquenessErrors.name_en ? 'has-unique-error' : ''}
                      placeholder="e.g. Cisco Catalyst 2960 Gigabit Switch"
                      value={nameEn}
                      onChange={handleNameEnChange}
                      onBlur={() => checkFieldUniqueness('name_en', nameEn)}
                    />
                    {uniquenessErrors.name_en && (
                      <span className="unique-field-error">
                        <FaTriangleExclamation />
                        <span>{uniquenessErrors.name_en}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Slug with Auto toggle */}
                <div className="form-group">
                  <label>
                    <span>{isRtl ? 'الرابط الدائم الفريد (URL Slug)' : 'Canonical URL Slug'}</span>
                    <button
                      type="button"
                      className="label-hint-btn"
                      onClick={() => setAutoSlug(!autoSlug)}
                      title={isRtl ? 'تبديل نمط التوليد' : 'Toggle auto slug generation'}
                    >
                      <FaArrowsRotate style={{ fontSize: 11 }} />
                      <span>{autoSlug ? (isRtl ? 'توليد تلقائي نشط' : 'Auto Sync') : (isRtl ? 'إدخال يدوي مخصص' : 'Manual')}</span>
                    </button>
                  </label>
                  <input
                    type="text"
                    required
                    className={uniquenessErrors.slug ? 'has-unique-error' : ''}
                    placeholder="cisco-catalyst-2960-gigabit-switch"
                    value={slug}
                    onChange={(e) => {
                      setAutoSlug(false);
                      setSlug(e.target.value);
                      if (uniquenessErrors.slug) setUniquenessErrors((prev) => ({ ...prev, slug: null }));
                    }}
                    onBlur={() => checkFieldUniqueness('slug', slug)}
                  />
                  {uniquenessErrors.slug && (
                    <span className="unique-field-error">
                      <FaTriangleExclamation />
                      <span>{uniquenessErrors.slug}</span>
                    </span>
                  )}
                  <div className="slug-preview-bar">
                    <span>{isRtl ? 'المسار الدائم في المتجر:' : 'Storefront URL:'}</span>
                    <span className="slug-highlight">
                      trendlineeg.com/products/{slug || 'product-slug'}
                    </span>
                  </div>
                </div>

                {/* Short Descriptions */}
                <div className="form-group-grid">
                  <div className="form-group">
                    <label>{isRtl ? 'الموجز التسويقي بالعربية' : 'Short Summary (Arabic)'}</label>
                    <textarea
                      rows={2}
                      placeholder={isRtl ? 'موجز سريع يظهر في بطاقات المنتجات ومحركات البحث...' : 'Quick highlight shown on product cards...'}
                      value={shortDescAr}
                      onChange={(e) => setShortDescAr(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>{isRtl ? 'الموجز التسويقي بالإنجليزية' : 'Short Summary (English)'}</label>
                    <textarea
                      rows={2}
                      placeholder="Concise commercial summary for search engines and cards..."
                      value={shortDescEn}
                      onChange={(e) => setShortDescEn(e.target.value)}
                    />
                  </div>
                </div>

                {/* Full Descriptions (Powered by React Quill JS - Full Width Flex Column) */}
                <div className="full-descriptions-flex-col">
                  <div className="form-group">
                    <label>
                      <span>{isRtl ? 'الوصف الكامل بالعربية' : 'Detailed Description (Arabic)'}</span>
                      <span className="quill-indicator-pill">React Quill JS (RTL)</span>
                    </label>
                    <QuillEditor
                      value={descriptionAr}
                      onChange={(content) => setDescriptionAr(content)}
                      placeholder={
                        isRtl
                          ? 'المواصفات الكاملة للمنتج، الميزات التقنية، محتويات العلبة...'
                          : 'Comprehensive specifications, features, package contents...'
                      }
                      dir="rtl"
                      minHeight="180px"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <span>{isRtl ? 'الوصف الكامل بالإنجليزية' : 'Detailed Description (English)'}</span>
                      <span className="quill-indicator-pill">React Quill JS (LTR)</span>
                    </label>
                    <QuillEditor
                      value={descriptionEn}
                      onChange={(content) => setDescriptionEn(content)}
                      placeholder="Comprehensive product features, technical capabilities, and package items..."
                      dir="ltr"
                      minHeight="180px"
                    />
                  </div>
                </div>
              </div>

              {/* ==============================================================
                  Card 2: ADVANCED MEDIA ASSETS HUB (Cover + Gallery 9 + Video 2)
                 ============================================================== */}
              <div className="form-section-card media-hub-card">
                <div className="section-header">
                  <div className="title-wrap">
                    <div className="section-icon media-hub-icon">
                      <FaImage />
                    </div>
                    <div>
                      <h2>{isRtl ? 'إدارة الوسائط المرئية ومحرك الضغط formatFactory' : 'Visual Media & formatFactory Engine'}</h2>
                      <p className="section-subtitle">
                        {isRtl
                          ? 'غلاف رئيسي، حتى 9 صور إضافية بتقنية WebP بجودة 80%، ومقطعان فيديو بدقة 720p ومدى زمني حتى دقيقة.'
                          : 'Cover thumbnail, up to 9 WebP 80% gallery images, and up to 2 product videos (max 60s, 720p HD).'}
                      </p>
                    </div>
                  </div>
                  <div className="format-factory-badge">
                    <FaWandMagicSparkles />
                    <span>formatFactory: WebP 80% & 720p HD</span>
                  </div>
                </div>

                {mediaError && (
                  <div className="media-feedback-alert error">
                    <FaTriangleExclamation />
                    <span>{mediaError}</span>
                    <button type="button" onClick={() => setMediaError('')} className="btn-close-alert"><FaXmark /></button>
                  </div>
                )}

                {mediaNotice && (
                  <div className="media-feedback-alert notice">
                    <FaCircleCheck />
                    <span>{mediaNotice}</span>
                    <button type="button" onClick={() => setMediaNotice('')} className="btn-close-alert"><FaXmark /></button>
                  </div>
                )}

                {/* Sub-Section A: Primary Cover Image */}
                <div className="media-sub-section">
                  <div className="sub-section-title-row">
                    <div className="sub-title">
                      <FaStar className="star-icon" />
                      <span>{isRtl ? 'غلاف المنتج الرئيسي (Cover Image)' : 'Primary Product Cover Image'}</span>
                      <span className="badge-mandatory">{isRtl ? 'مستحسن للمتجر' : 'Recommended'}</span>
                    </div>
                    {coverMedia && (
                      <span className="media-status-pill success">
                        <FaCircleCheck />
                        <span>{isRtl ? 'محول WebP بنجاح' : 'WebP Optimized'}</span>
                      </span>
                    )}
                  </div>

                  <p className="sub-instruction-text">
                    {isRtl
                      ? 'الصورة البارزة الأساسية التي ستظهر في نتائج البحث وبطاقات الكتالوج ومنشورات التواصل الاجتماعي.'
                      : 'The main hero thumbnail shown on search cards, catalog grids, and social share cards.'}
                  </p>

                  <div className="cover-uploader-wrapper">
                    {coverMedia ? (
                      <div className="cover-active-card">
                        <div className="cover-preview-canvas">
                          <img
                            src={coverMedia.previewUrl || coverMedia.uploadedUrl}
                            alt="Cover Preview"
                            onError={(e) => {
                              e.target.src = '/icons/fallback-product.svg';
                            }}
                          />
                          <div className="cover-badge-float">
                            <span>{isRtl ? 'الغلاف النشط' : 'Active Cover'}</span>
                          </div>
                        </div>

                        <div className="cover-details-panel">
                          <div className="file-meta-row">
                            <strong className="file-name">{coverMedia.originalName}</strong>
                            <span className="file-format-tag">WebP 80%</span>
                          </div>

                          <div className="media-specs-grid">
                            <div className="spec-metric">
                              <span className="lbl">{isRtl ? 'الحجم المضغوط:' : 'Optimized Size:'}</span>
                              <strong className="val">{formatBytes(coverMedia.formattedSize)}</strong>
                            </div>
                            {coverMedia.savingsPercent > 0 && (
                              <div className="spec-metric savings">
                                <span className="lbl">{isRtl ? 'نسبة الوفر:' : 'Size Saved:'}</span>
                                <strong className="val">-{coverMedia.savingsPercent}%</strong>
                              </div>
                            )}
                            {coverMedia.width && (
                              <div className="spec-metric">
                                <span className="lbl">{isRtl ? 'الأبعاد:' : 'Dimensions:'}</span>
                                <strong className="val">{coverMedia.width} × {coverMedia.height}px</strong>
                              </div>
                            )}
                          </div>

                          <div className="cover-actions-row">
                            <button
                              type="button"
                              className="btn-replace-media"
                              onClick={() => coverInputRef.current?.click()}
                              disabled={coverLoading}
                            >
                              <FaArrowsRotate />
                              <span>{isRtl ? 'استبدال الغلاف' : 'Replace Cover'}</span>
                            </button>

                            <button
                              type="button"
                              className="btn-delete-media"
                              onClick={removeCoverImage}
                              title={isRtl ? 'حذف صورة الغلاف' : 'Remove Cover'}
                            >
                              <FaTrashCan />
                              <span>{isRtl ? 'حذف' : 'Remove'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="cover-dropzone-box"
                        onClick={() => coverInputRef.current?.click()}
                      >
                        <input
                          type="file"
                          ref={coverInputRef}
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleCoverSelect}
                        />
                        <div className="dropzone-center-content">
                          <div className="dropzone-icon-circle">
                            <FaCloudArrowUp />
                          </div>
                          <h4>{isRtl ? 'انقر لاختيار غلاف المنتج أو اسحب الصورة هنا' : 'Click to select or drag product cover image'}</h4>
                          <p>
                            {isRtl
                              ? 'يقوم محرك formatFactory تلقائياً بتحويل الصورة لصيغة WebP المضغوطة بجودة 80% لتسريع التصفح.'
                              : 'formatFactory will auto-convert your image to 80% WebP for instant load times.'}
                          </p>
                          <span className="specs-pill">{isRtl ? 'يدعم: PNG, JPG, JPEG, WEBP, AVIF' : 'Supports all major image formats'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub-Section B: Additional Gallery Images (Max 9 Images) */}
                <div className="media-sub-section">
                  <div className="sub-section-title-row">
                    <div className="sub-title">
                      <FaImage className="gallery-icon" />
                      <span>{isRtl ? 'معرض الصور الإضافية' : 'Additional Gallery Images'}</span>
                      <span className="counter-pill">{galleryMedia.length} / 9 {isRtl ? 'صور' : 'images'}</span>
                    </div>

                    {galleryMedia.length < 9 && (
                      <button
                        type="button"
                        className="btn-add-gallery-trigger"
                        onClick={() => galleryInputRef.current?.click()}
                        disabled={galleryLoading}
                      >
                        <FaPlus />
                        <span>{isRtl ? 'إضافة صور إضافية' : 'Add Gallery Images'}</span>
                      </button>
                    )}
                  </div>

                  <p className="sub-instruction-text">
                    {isRtl
                      ? 'يمكنك إضافة حتى 9 صور إضافية بزوايا وتفاصيل مختلفة للمنتج. يتم ضغط جميع الصور تلقائياً عبر formatFactory.'
                      : 'Upload up to 9 supplemental product views. All assets are automatically formatted to WebP 80%.'}
                  </p>

                  <input
                    type="file"
                    ref={galleryInputRef}
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleGallerySelect}
                  />

                  {galleryMedia.length === 0 ? (
                    <div
                      className="gallery-empty-dropzone"
                      onClick={() => galleryInputRef.current?.click()}
                    >
                      <FaImage />
                      <span>{isRtl ? 'لا توجد صور إضافية مضافة بعد. انقر لإضافة صور للمعرض (بحد أقصى 9 صور).' : 'No gallery images yet. Click to add up to 9 images.'}</span>
                    </div>
                  ) : (
                    <div className="gallery-cards-grid">
                      {galleryMedia.map((item, gIdx) => (
                        <div key={item.id || gIdx} className="gallery-thumb-card">
                          <div className="thumb-preview-box">
                            <img
                              src={item.previewUrl || item.uploadedUrl}
                              alt={`Gallery ${gIdx + 1}`}
                              onError={(e) => {
                                e.target.src = '/icons/fallback-product.svg';
                              }}
                            />
                            <span className="thumb-index-tag">#{gIdx + 1}</span>

                            <div className="thumb-overlay-actions">
                              <button
                                type="button"
                                className="action-btn-pill make-cover"
                                onClick={() => makeGalleryImageCover(gIdx)}
                                title={isRtl ? 'تعيين كغلاف رئيسي' : 'Set as primary cover'}
                              >
                                <FaStar />
                                <span>{isRtl ? 'جعله غلاف' : 'Make Cover'}</span>
                              </button>

                              <button
                                type="button"
                                className="action-btn-pill delete"
                                onClick={() => removeGalleryImage(gIdx)}
                                title={isRtl ? 'حذف هذه الصورة' : 'Remove image'}
                              >
                                <FaTrashCan />
                              </button>
                            </div>
                          </div>

                          <div className="thumb-meta-footer">
                            <span className="thumb-format">WebP 80%</span>
                            <span className="thumb-size">{formatBytes(item.formattedSize)}</span>
                            {item.savingsPercent > 0 && (
                              <span className="thumb-savings">-{item.savingsPercent}%</span>
                            )}
                          </div>
                        </div>
                      ))}

                      {galleryMedia.length < 9 && (
                        <div
                          className="gallery-add-slot-card"
                          onClick={() => galleryInputRef.current?.click()}
                          title={isRtl ? 'إضافة صورة جديدة' : 'Add another image'}
                        >
                          <FaPlus />
                          <span>{isRtl ? `إضافة (${9 - galleryMedia.length} متبقية)` : `Add (${9 - galleryMedia.length} left)`}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {galleryMedia.length >= 9 && (
                    <div className="media-limit-banner">
                      <FaCircleCheck />
                      <span>{isRtl ? 'تم بلوغ الحد الأقصى لمعرض الصور (9 صور إضافية).' : 'Maximum gallery limit reached (9 images).'}</span>
                    </div>
                  )}
                </div>

                {/* Sub-Section C: Product Videos (Max 2 Videos, Max 60s, 720p HD) */}
                <div className="media-sub-section">
                  <div className="sub-section-title-row">
                    <div className="sub-title">
                      <FaVideo className="video-icon" />
                      <span>{isRtl ? 'مقاطع الفيديو الترويجية (Video Reels)' : 'Product Demonstration Videos'}</span>
                      <span className="counter-pill">{videoMedia.length} / 2 {isRtl ? 'فيديوهات' : 'videos'}</span>
                    </div>

                    {videoMedia.length < 2 && (
                      <button
                        type="button"
                        className="btn-add-video-trigger"
                        onClick={() => videoInputRef.current?.click()}
                        disabled={videoLoading}
                      >
                        <FaFilm />
                        <span>{isRtl ? 'إضافة مقطع فيديو' : 'Add Product Video'}</span>
                      </button>
                    )}
                  </div>

                  <div className="video-rules-banner">
                    <div className="rule-item">
                      <FaClock />
                      <span>{isRtl ? 'الحد الأقصى للمدة: دقيقة واحدة (60 ثانية)' : 'Max duration: 1 minute (60s)'}</span>
                    </div>
                    <div className="rule-item">
                      <FaCompress />
                      <span>{isRtl ? 'دقة العرض: 720p HD كحد أقصى (تبقى كما هي لو أقل)' : 'Max resolution: 720p HD (preserved if lower)'}</span>
                    </div>
                    <div className="rule-item">
                      <FaFilm />
                      <span>{isRtl ? 'العدد المسموح: بحد أقصى مقطعان' : 'Max videos: 2 reels'}</span>
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={videoInputRef}
                    accept="video/mp4,video/webm,video/quicktime,video/*"
                    style={{ display: 'none' }}
                    onChange={handleVideoSelect}
                  />

                  {videoMedia.length === 0 ? (
                    <div
                      className="video-empty-dropzone"
                      onClick={() => videoInputRef.current?.click()}
                    >
                      <div className="video-drop-icon">
                        <FaFilm />
                      </div>
                      <h4>{isRtl ? 'انقر هنا لإضافة فيديو للمنتج (بحد أقصى 2 فيديو)' : 'Click to upload product video (Max 2)'}</h4>
                      <p>
                        {isRtl
                          ? 'يقوم محرك formatFactory بفحص مدة الفيديو والتأكد من ألا تتجاوز 60 ثانية، مع ضبط الجودة إلى 720p لاستعراض سلس وسريع.'
                          : 'formatFactory verifies 60s max length and aligns quality to 720p for fast streaming.'}
                      </p>
                    </div>
                  ) : (
                    <div className="videos-cards-grid">
                      {videoMedia.map((vid, vIdx) => (
                        <div key={vid.id || vIdx} className="product-video-card">
                          <div className="video-player-container">
                            <video
                              src={vid.previewUrl || vid.uploadedUrl}
                              poster={vid.posterUrl}
                              controls
                              playsInline
                              preload="metadata"
                            />
                            <div className="video-badge-overlay">
                              <span className="badge-duration">
                                <FaClock style={{ fontSize: 10 }} />
                                {vid.durationFormatted}
                              </span>
                              <span className="badge-resolution">{vid.resolutionBadge}</span>
                            </div>
                          </div>

                          <div className="video-card-meta">
                            <div className="meta-text-wrap">
                              <strong className="video-title">
                                {isRtl ? `فيديو المنتج #${vIdx + 1}` : `Product Video #${vIdx + 1}`}
                              </strong>
                              <span className="video-filename">{vid.originalName}</span>
                            </div>

                            <div className="video-badges-row">
                              {vid.uploading ? (
                                <span className="info-chip highlight" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}>
                                  {isRtl ? 'جاري الضغط إلى 720p وتقليل الحجم...' : 'Compressing to 720p...'}
                                </span>
                              ) : (
                                <>
                                  <span className="info-chip">{formatBytes(vid.size)}</span>
                                  {vid.savingsPercent > 0 && (
                                    <span className="info-chip" style={{ background: '#dcfce7', color: '#166534', borderColor: '#bbf7d0', fontWeight: '800' }}>
                                      {isRtl ? `وفر ${vid.savingsPercent}%` : `-${vid.savingsPercent}%`}
                                    </span>
                                  )}
                                  <span className="info-chip highlight">{vid.resolutionBadge || '720p HD'}</span>
                                </>
                              )}
                            </div>

                            <div className="video-card-actions">
                              <button
                                type="button"
                                className="btn-delete-video"
                                onClick={() => removeVideo(vIdx)}
                                title={isRtl ? 'حذف الفيديو' : 'Remove video'}
                              >
                                <FaTrashCan />
                                <span>{isRtl ? 'حذف المقطع' : 'Delete Video'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {videoMedia.length < 2 && (
                        <div
                          className="video-add-slot-card"
                          onClick={() => videoInputRef.current?.click()}
                        >
                          <FaPlus />
                          <span>{isRtl ? 'إضافة فيديو ثانٍ (متبقي 1)' : 'Add 2nd Video (1 left)'}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {videoMedia.length >= 2 && (
                    <div className="media-limit-banner">
                      <FaCircleCheck />
                      <span>{isRtl ? 'تم بلوغ الحد الأقصى لمقاطع الفيديو للمنتج (مقطعان).' : 'Maximum video limit reached (2 videos).'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ==============================================================
                  Card 3: CATEGORY HIERARCHY TREE SELECTOR
                 ============================================================== */}
              <div
                className="form-section-card"
                style={categoryValidationError ? { borderColor: '#ef4444', boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.15)' } : {}}
              >
                <div className="section-header">
                  <div className="title-wrap">
                    <div className="section-icon">
                      <FaFolderTree />
                    </div>
                    <div>
                      <h2>{isRtl ? 'التصنيف الهرمي والأقسام التابعة' : 'Category Hierarchy & Strict Breadcrumbs'}</h2>
                      <p className="section-subtitle">
                        {isRtl
                          ? 'التسلسل المعتمد: القسم الرئيسي ← القسم الفرعي ← المنتج. مع اختيار قسم أساسي واحد.'
                          : 'Strict hierarchy: Root Category &rarr; Subcategory &rarr; Products.'}
                      </p>
                    </div>
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
                          <strong>الهيكل الهرمي:</strong> القسم الرئيسي ← القسم الفرعي ← المنتج.
                          <strong> لا يمكن إضافة المنتجات في قسم رئيسي بشكل مباشر</strong>؛ اختر القسم الرئيسي أولاً لاستعراض أقسامه الفرعية، ثم حدد الأقسام الفرعية التي ينتمي إليها المنتج، مع اختيار <strong>قسم أساسي واحد</strong> لتوجيه مسار التصفح.
                        </>
                      ) : (
                        <>
                          <strong>Strict Hierarchy:</strong> Root Category &rarr; Subcategory &rarr; Products.
                          <strong> Products cannot be added directly to root categories.</strong> Choose a parent category first, then select subcategories to assign this product.
                        </>
                      )}
                    </div>
                  </div>

                  {/* Selected Categories Showcase with Full Hierarchy */}
                  <div className="selected-categories-panel">
                    <div className="scp-header">
                      <div className="scp-title-group">
                        <div className="scp-icon">
                          <FaSitemap />
                        </div>
                        <div>
                          <h4>{isRtl ? 'الأقسام والتصنيفات المحددة للمنتج' : 'Selected Product Categories'}</h4>
                          <p className="scp-rule-note">
                            {isRtl
                              ? 'التسلسل المعتمد: القسم الرئيسي ← القسم الفرعي ← المنتج. مع اختيار قسم أساسي واحد.'
                              : 'Approved Sequence: Root Category → Subcategory → Product. With one primary category.'}
                          </p>
                        </div>
                      </div>
                      <span className="scp-count-badge">
                        {selectedCategoriesData.length} {isRtl ? 'أقسام محددة' : 'Selected'}
                      </span>
                    </div>

                    {selectedCategoriesData.length === 0 ? (
                      <div className="scp-empty-state">
                        <FaFolderTree className="empty-icon" />
                        <div>
                          <strong>{isRtl ? 'لم يتم تحديد أي قسم للمنتج حتى الآن!' : 'No categories selected yet!'}</strong>
                          <p>
                            {isRtl
                              ? 'يرجى اختيار القسم الرئيسي بالأسفل (الخطوة 1) ثم تحديد الأقسام الفرعية التابعة له (الخطوة 2)، وتعيين قسم أساسي واحد.'
                              : 'Please select a root category below (Step 1) and pick its subcategories (Step 2), then designate one primary category.'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="scp-cards-list">
                        {selectedCategoriesData.map((item) => {
                          const rootTitle = isRtl
                            ? (item.parent?.name_ar || item.parent?.name_en || 'القسم الرئيسي')
                            : (item.parent?.name_en || item.parent?.name_ar || 'Root Category');
                          const subTitle = isRtl
                            ? (item.name_ar || item.name_en)
                            : (item.name_en || item.name_ar);

                          return (
                            <div
                              key={item.id}
                              className={`selected-cat-card ${item.isPrimary ? 'is-primary' : ''}`}
                            >
                              <div className="scc-chain-row">
                                <span className="chain-step root-step">
                                  <FaFolder className="step-icon" />
                                  <span>{rootTitle}</span>
                                </span>
                                <span className="chain-arrow">
                                  {isRtl ? <FaChevronLeft /> : <FaChevronRight />}
                                </span>
                                <span className="chain-step sub-step">
                                  <OptionIconRenderer
                                    iconUrl={item.icon_url}
                                    imageUrl={item.image_url}
                                    isSubcategory={true}
                                  />
                                  <span>{subTitle}</span>
                                </span>
                                <span className="chain-arrow">
                                  {isRtl ? <FaChevronLeft /> : <FaChevronRight />}
                                </span>
                                <span className="chain-step prod-step">
                                  <span>{nameAr || nameEn || (isRtl ? '[اسم المنتج]' : '[Product]')}</span>
                                </span>
                              </div>

                              <div className="scc-meta-row">
                                <div className="scc-info">
                                  <span className="scc-id">ID: {item.id}</span>
                                  {item.slug && <span className="scc-slug">#{item.slug}</span>}
                                </div>

                                <div className="scc-actions">
                                  {item.isPrimary ? (
                                    <span className="primary-active-badge">
                                      <FaStar />
                                      <span>{isRtl ? 'القسم الأساسي المعتمد' : 'Primary Category'}</span>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      className="btn-make-primary"
                                      onClick={(e) => setAsPrimaryCategory(item.id, e)}
                                      title={isRtl ? 'تعيين هذا القسم كقسم أساسي للمنتج' : 'Set as primary category'}
                                    >
                                      <FaRegStar />
                                      <span>{isRtl ? 'تعيين كقسم أساسي' : 'Set as Primary'}</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    className="btn-remove-selected-cat"
                                    onClick={() => toggleCategorySelection(item.id)}
                                    title={isRtl ? 'إزالة هذا القسم من المنتج' : 'Remove category'}
                                  >
                                    <FaXmark size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Step 1: Parent Category Custom Selector */}
                  <div className="root-category-picker-box">
                    <label className="picker-step-label">
                      <span className="step-number">1</span>
                      <span className="step-title">
                        {isRtl ? 'اختر القسم الرئيسي (Parent Category)' : 'Select Parent Category'}
                        <span className="req">*</span>
                      </span>
                      <span className="step-desc">
                        {isRtl
                          ? 'استعرض الأقسام الرئيسية في الكتالوج لعرض الأقسام الفرعية المندرجة تحتها'
                          : 'Select a catalog root department to view and pick its subcategories'}
                      </span>
                    </label>

                    <div className="selector-wrapper">
                      <CustomSelect
                        options={rootCategoryOptions}
                        value={selectedRootCategoryId}
                        onChange={(val) => {
                          setSelectedRootCategoryId(val);
                          setCategoryValidationError(false);
                        }}
                        placeholder={isRtl ? '-- اضغط لاختيار القسم الرئيسي أولاً --' : '-- Choose Parent Category --'}
                        isRtl={isRtl}
                        searchable={true}
                      />
                    </div>
                  </div>

                  {/* Step 2: Available Subcategories in the selected Root Category */}
                  {selectedRootCategoryId && currentRootCategory && (
                    <div className="subcategories-selection-container">
                      <div className="subcategories-header-bar">
                        <div className="header-left">
                          <span className="step-number">2</span>
                          <div>
                            <h4 className="sub-section-title">
                              {isRtl
                                ? `الأقسام الفرعية التابعة لقسم: ${currentRootCategory.name_ar}`
                                : `Subcategories under: ${currentRootCategory.name_en}`}
                            </h4>
                            <p className="sub-section-desc">
                              {isRtl
                                ? 'حدد قسماً فرعياً واحداً أو أكثر لإدراج المنتج فيه، وحدد القسم الأساسي (Primary)'
                                : 'Select one or more subcategories for this product and set the primary one'}
                            </p>
                          </div>
                        </div>

                        {availableSubcategories.length > 0 && (
                          <div className="category-filter-search-mini">
                            <input
                              type="text"
                              placeholder={isRtl ? 'بحث في الأقسام الفرعية...' : 'Filter subcategories...'}
                              value={categorySearchQuery}
                              onChange={(e) => setCategorySearchQuery(e.target.value)}
                            />
                          </div>
                        )}
                      </div>

                      {availableSubcategories.length === 0 ? (
                        <div className="empty-subcategories-alert">
                          <FaTriangleExclamation />
                          <div>
                            <strong>{isRtl ? 'لا توجد أقسام فرعية داخل هذا القسم الرئيسي!' : 'No subcategories found in this root category!'}</strong>
                            <p>
                              {isRtl
                                ? 'نظراً لأن المنتجات لا يمكن إضافتها في قسم رئيسي مباشرة، يرجى إضافة قسم فرعي أولاً من لوحة تحكم الأقسام أو اختيار قسم رئيسي آخر يحتوي على أقسام فرعية.'
                                : 'Since products must belong to a subcategory, please add subcategories under this parent or select a different parent.'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="subcategories-cards-grid">
                          {availableSubcategories
                            .filter((sub) => {
                              if (!categorySearchQuery.trim()) return true;
                              const q = categorySearchQuery.toLowerCase().trim();
                              return (
                                (sub.name_ar && sub.name_ar.toLowerCase().includes(q)) ||
                                (sub.name_en && sub.name_en.toLowerCase().includes(q)) ||
                                (sub.slug && sub.slug.toLowerCase().includes(q)) ||
                                String(sub.id).includes(q)
                              );
                            })
                            .map((sub) => {
                              const isSubSelected = selectedCategoryIds.includes(sub.id);
                              const isSubPrimary = String(primaryCategoryId) === String(sub.id);

                              return (
                                <div
                                  key={sub.id}
                                  className={`subcategory-select-card ${isSubSelected ? 'selected' : ''}`}
                                  onClick={() => toggleCategorySelection(sub.id)}
                                >
                                  <div className="card-top-row">
                                    <div className="checkbox-wrap">
                                      <input
                                        type="checkbox"
                                        checked={isSubSelected}
                                        onChange={() => { }}
                                      />
                                    </div>
                                    <div className="sub-icon-box">
                                      <OptionIconRenderer
                                        iconUrl={sub.icon_url}
                                        imageUrl={sub.image_url}
                                        isSubcategory={true}
                                      />
                                    </div>
                                    <div className="sub-text-content">
                                      <span className="sub-name">{isRtl ? sub.name_ar : sub.name_en}</span>
                                      <span className="sub-slug">#{sub.slug}</span>
                                    </div>
                                  </div>

                                  <div className="card-bottom-actions">
                                    <span className="sub-id-pill">ID: {sub.id}</span>
                                    {isSubSelected && (
                                      <button
                                        type="button"
                                        className={`btn-set-primary-chip ${isSubPrimary ? 'active' : ''}`}
                                        onClick={(e) => setAsPrimaryCategory(sub.id, e)}
                                      >
                                        {isSubPrimary ? (
                                          <>
                                            <FaStar />
                                            <span>{isRtl ? 'القسم الأساسي' : 'Primary'}</span>
                                          </>
                                        ) : (
                                          <>
                                            <FaRegStar />
                                            <span>{isRtl ? 'جعله أساسي' : 'Set Primary'}</span>
                                          </>
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
                  )}

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

                  {/* Summary Bar */}
                  <div className="selected-summary-bar">
                    <div className="summary-info">
                      <span>{isRtl ? 'الأقسام الفرعية المحددة: ' : 'Selected Subcategories: '}</span>
                      <strong className="badge-count">{selectedCategoryIds.length}</strong>
                      {primaryCategoryId && (
                        <span className="primary-notice">
                          ({isRtl ? 'الفرعي الأساسي: ' : 'Primary Subcategory: '} <strong>{flatCategories.find((c) => String(c.id) === String(primaryCategoryId))?.name_ar || primaryCategoryId}</strong>)
                        </span>
                      )}
                    </div>
                    {categoryValidationError && (
                      <span style={{ color: '#ef4444', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <FaCircleXmark />
                        <span>{isRtl ? 'يجب اختيار قسم فرعي واحد على الأقل للمنتج' : 'At least 1 subcategory must be selected'}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 4: Pricing & Profitability Dashboard */}
              <div className="form-section-card">
                <div className="section-header">
                  <div className="title-wrap">
                    <div className="section-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                    </div>
                    <div>
                      <h2>{isRtl ? 'التسعير وتحليلات هوامش الربحية' : 'Pricing & Profit Analytics'}</h2>
                      <p className="section-subtitle">
                        {isRtl
                          ? 'تحديد سعر التكلفة، السعر الأصلي، وسعر العرض مع احتساب صافي الربح وهامش المارجن لحظياً.'
                          : 'Configure COGS, retail, and sale prices with real-time margin calculations.'}
                      </p>
                    </div>
                  </div>
                  <span className="mandatory-tag">{isRtl ? 'السعر إجباري' : 'Price Required'}</span>
                </div>

                <div className="form-group-grid pricing-grid-row">
                  <div className="form-group">
                    <label>
                      <span>{isRtl ? 'سعر التكلفة (ج.م)' : 'Cost Price / COGS (EGP)'}</span>
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
                      <span>{isRtl ? 'سعر البيع الأصلي (ج.م)' : 'Retail Price (EGP)'}</span>
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
                      <span>{isRtl ? 'سعر العرض / التخفيض (ج.م)' : 'Sale Price (EGP)'}</span>
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

                  <div className="form-group discount-expiration-group">
                    <label>
                      <span className="label-with-icon">
                        <FaClock style={{ fontSize: 12, color: 'var(--main-color, #0057C2)' }} />
                        <span>{isRtl ? 'مدة انتهاء الخصم' : 'Discount Expiry'}</span>
                      </span>
                      {saleEndsAt && (
                        <button
                          type="button"
                          className="btn-clear-date"
                          onClick={() => setSaleEndsAt('')}
                          title={isRtl ? 'إلغاء الموعد' : 'Clear expiration date'}
                        >
                          <FaXmark style={{ fontSize: 10 }} />
                          <span>{isRtl ? 'إلغاء' : 'Clear'}</span>
                        </button>
                      )}
                    </label>
                    <div className="date-input-container">
                      <input
                        type="datetime-local"
                        className="custom-date-picker-input"
                        value={saleEndsAt}
                        min={currentMinDate || undefined}
                        onChange={(e) => setSaleEndsAt(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Presets for Discount Expiry */}
                {salePrice && parseFloat(originalPrice) > parseFloat(salePrice) && (
                  <div className="discount-presets-bar">
                    <span className="presets-label">{isRtl ? 'تحديد سريع لانتهاء العرض:' : 'Quick Presets:'}</span>
                    <div className="presets-chips">
                      <button type="button" className="preset-chip" onClick={() => setSaleEndPreset(3)}>
                        +3 {isRtl ? 'أيام' : 'Days'}
                      </button>
                      <button type="button" className="preset-chip" onClick={() => setSaleEndPreset(7)}>
                        +1 {isRtl ? 'أسبوع' : 'Week'}
                      </button>
                      <button type="button" className="preset-chip" onClick={() => setSaleEndPreset(14)}>
                        +2 {isRtl ? 'أسبوعين' : 'Weeks'}
                      </button>
                      <button type="button" className="preset-chip" onClick={() => setSaleEndPreset(30)}>
                        +1 {isRtl ? 'شهر' : 'Month'}
                      </button>
                      <button type="button" className="preset-chip" onClick={setSaleEndMonth}>
                        {isRtl ? 'نهاية الشهر الحالي' : 'End of Month'}
                      </button>
                    </div>

                    {saleRemainingText && (
                      <div className={`countdown-status-pill ${saleRemainingText.expired ? 'expired' : 'active'}`}>
                        <FaClock />
                        <span>{saleRemainingText.text}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Live Profitability Dashboard Box */}
                <div className="profitability-dashboard-box">
                  <div className="metric-card">
                    <span className="metric-label">{isRtl ? 'صافي الربح المتوقع للوحدة' : 'Unit Net Profit'}</span>
                    <span className="metric-val profit-val">
                      {metrics.netProfit} <small style={{ fontSize: '11px' }}>{isRtl ? 'ج.م' : 'EGP'}</small>
                    </span>
                  </div>

                  <div className="metric-card">
                    <span className="metric-label">{isRtl ? 'هامش الربح التجاري (Gross Margin)' : 'Gross Margin'}</span>
                    <span className="metric-val profit-val">
                      {metrics.margin}%
                    </span>
                  </div>

                  <div className="metric-card">
                    <span className="metric-label">{isRtl ? 'نسبة الخصم الفعلي' : 'Discount Rate'}</span>
                    <span className={`metric-val ${metrics.discount > 0 ? 'discount-val' : ''}`}>
                      {metrics.discount > 0 ? `${metrics.discount}%` : (isRtl ? 'بدون خصم' : 'None')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 5: Inventory & Codes */}
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
                    <div>
                      <h2>{isRtl ? 'المخزون والأكواد ومستوى التنبيه' : 'Inventory Tracking & Warehouse Barcodes'}</h2>
                      <p className="section-subtitle">
                        {isRtl ? 'إدارة أكواد الـ SKU والباركود والتحكم بكميات المستودعات الفعلية.' : 'SKU generation, barcode tagging, and stock safety triggers.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="form-group-grid">
                  <div className="form-group">
                    <label>{isRtl ? 'رمز SKU التعريفي' : 'SKU Identifier'}</label>
                    <div className="input-with-button-wrap">
                      <input
                        type="text"
                        className={uniquenessErrors.sku ? 'has-unique-error' : ''}
                        placeholder="e.g. TRD-CISCO-8492"
                        value={sku}
                        onChange={(e) => {
                          setSku(e.target.value);
                          if (uniquenessErrors.sku) setUniquenessErrors((prev) => ({ ...prev, sku: null }));
                        }}
                        onBlur={() => checkFieldUniqueness('sku', sku)}
                      />
                      <button type="button" className="btn-inner-action" onClick={() => generateSkuCode()}>
                        {isRtl ? 'توليد تلقائي' : 'Generate'}
                      </button>
                    </div>
                    {uniquenessErrors.sku && (
                      <span className="unique-field-error">
                        <FaTriangleExclamation />
                        <span>{uniquenessErrors.sku}</span>
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>{isRtl ? 'الباركود الدولي (EAN-13)' : 'International Barcode'}</label>
                    <div className="input-with-button-wrap">
                      <input
                        type="text"
                        className={uniquenessErrors.barcode ? 'has-unique-error' : ''}
                        placeholder="e.g. 6221234567890"
                        value={barcode}
                        onChange={(e) => {
                          setBarcode(e.target.value);
                          if (uniquenessErrors.barcode) setUniquenessErrors((prev) => ({ ...prev, barcode: null }));
                        }}
                        onBlur={() => checkFieldUniqueness('barcode', barcode)}
                      />
                      <button type="button" className="btn-inner-action" onClick={generateBarcodeCode}>
                        {isRtl ? 'توليد باركود' : 'Generate'}
                      </button>
                    </div>
                    {uniquenessErrors.barcode && (
                      <span className="unique-field-error">
                        <FaTriangleExclamation />
                        <span>{uniquenessErrors.barcode}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-group-grid">
                  <div className="form-group">
                    <label>
                      <span>{isRtl ? 'الكمية المتوفرة بالمستودع' : 'Stock Quantity'}</span>
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
                      <span>{isRtl ? 'حد تنبيه انخفاض المخزون' : 'Low Stock Threshold'}</span>
                      <span className="label-hint">{isRtl ? 'إشعار فوري عند الوصول' : 'ERP Trigger'}</span>
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

              {/* Card 6: Technical Specifications Repeater */}
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
                    <div>
                      <h2>{isRtl ? 'المواصفات الفنية والسمات التقنية' : 'Technical Specifications (Key-Value)'}</h2>
                      <p className="section-subtitle">
                        {isRtl ? 'جدول المواصفات التفصيلية الذي يظهر في صفحة عرض المنتج للعميل.' : 'Detailed attribute table rendered on storefront product specifications tab.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="specs-repeater-container">
                  {specifications.map((spec, idx) => (
                    <div key={idx} className="spec-bilingual-card">
                      <div className="spec-card-top-bar">
                        <div className="spec-card-badge-wrap">
                          <span className="spec-badge-num">
                            {isRtl ? `خاصية ومواصفة #${idx + 1}` : `Specification #${idx + 1}`}
                          </span>
                          <span className="spec-badge-hint">
                            {isRtl ? 'حقل موحد مزدوج اللغة (عربي / English)' : 'Unified Bilingual Field (AR / EN)'}
                          </span>
                        </div>
                        {specifications.length > 1 && (
                          <button
                            type="button"
                            className="btn-remove-spec-card"
                            onClick={() => removeSpecRow(idx)}
                            title={isRtl ? 'حذف هذه الخاصية بالكامل' : 'Remove specification'}
                          >
                            <FaXmark size={12} />
                            <span>{isRtl ? 'حذف الخاصية' : 'Remove'}</span>
                          </button>
                        )}
                      </div>

                      <div className="spec-bilingual-body">
                        {/* Arabic Section */}
                        <div className="spec-lang-section ar-section">
                          <div className="lang-tag ar-tag">
                            <span>🇸🇦 البيانات بالعربية (AR)</span>
                          </div>
                          <div className="spec-inputs-row">
                            <div className="spec-field-item">
                              <label>{isRtl ? 'اسم الخاصية (عربي)' : 'Property Name (Arabic)'}</label>
                              <input
                                type="text"
                                placeholder={isRtl ? 'مثال: المعالج / الرام / المنافذ / الدقة' : 'e.g. Processor / RAM / Ports'}
                                value={spec.key_ar ?? spec.key ?? ''}
                                onChange={(e) => handleSpecChange(idx, 'key_ar', e.target.value)}
                              />
                            </div>
                            <div className="spec-field-item">
                              <label>{isRtl ? 'القيمة (عربي)' : 'Value (Arabic)'}</label>
                              <input
                                type="text"
                                placeholder={isRtl ? 'مثال: إنتل Core i7 الجيل 13 / 16 جيجابايت DDR5' : 'e.g. Intel Core i7 / 16GB DDR5'}
                                value={spec.value_ar ?? spec.value ?? ''}
                                onChange={(e) => handleSpecChange(idx, 'value_ar', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        {/* English Section */}
                        <div className="spec-lang-section en-section">
                          <div className="lang-tag en-tag">
                            <span>🇬🇧 English Details (EN)</span>
                          </div>
                          <div className="spec-inputs-row">
                            <div className="spec-field-item">
                              <label>Property Name (English)</label>
                              <input
                                type="text"
                                dir="ltr"
                                placeholder="e.g. Processor / Memory RAM / Gigabit Ports"
                                value={spec.key_en ?? ''}
                                onChange={(e) => handleSpecChange(idx, 'key_en', e.target.value)}
                              />
                            </div>
                            <div className="spec-field-item">
                              <label>Value (English)</label>
                              <input
                                type="text"
                                dir="ltr"
                                placeholder="e.g. Intel Core i7 13th Gen / 16GB DDR5"
                                value={spec.value_en ?? ''}
                                onChange={(e) => handleSpecChange(idx, 'value_en', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button type="button" className="btn-add-spec-row" onClick={addSpecRow}>
                    <FaPlus size={12} />
                    <span>{isRtl ? 'إضافة مواصفة وخاصية فنية جديدة (Add Specification)' : 'Add Technical Specification'}</span>
                  </button>
                </div>
              </div>

              {/* Card 6.5: Product Showcase Tabs & Feature Pillars Studio */}
              <ProductShowcaseStudio
                showcaseTabs={showcaseTabs}
                onChange={setShowcaseTabs}
                productContext={{
                  nameAr,
                  nameEn,
                  sku,
                  brandName:
                    brands.find((b) => String(b.id) === String(selectedBrandId))?.name_ar ||
                    brands.find((b) => String(b.id) === String(selectedBrandId))?.name_en ||
                    '',
                  categoryName:
                    activeBreadcrumbTrail?.subName ||
                    activeBreadcrumbTrail?.rootName ||
                    '',
                  coverImage: coverMedia?.previewUrl || coverMedia?.uploadedUrl || '',
                  descriptionAr,
                  descriptionEn,
                  specifications,
                }}
                isRtl={isRtl}
              />
            </div>

            {/* ==============================================================
                SIDE COLUMN (Live Preview, Brand, Tags, Visibility)
               ============================================================== */}
            <div className="form-side-column">
              {/* Card 7: Live Storefront Card Preview */}
              <div className="form-section-card storefront-preview-card">
                <div className="section-header">
                  <div className="title-wrap">
                    <div className="section-icon">
                      <FaEye />
                    </div>
                    <div>
                      <h2>{isRtl ? 'معاينة بطاقة المنتج الحية' : 'Storefront Live Preview'}</h2>
                      <p className="section-subtitle">{isRtl ? 'الشكل الظاهر للعملاء في المتجر' : 'Live consumer card representation'}</p>
                    </div>
                  </div>
                </div>

                <div className="admin-live-preview-stage">
                  <StoreProductCard
                    product={livePreviewProduct}
                    lang={isRtl ? 'ar' : 'en'}
                    isPreview={true}
                  />
                </div>
              </div>

              {/* Card 8: Brand Selection & Quick Add */}
              <div className="form-section-card">
                <div className="section-header">
                  <div className="title-wrap">
                    <div className="section-icon">
                      <FaTag />
                    </div>
                    <div>
                      <h2>{isRtl ? 'العلامة التجارية والمُصنّع' : 'Brand & Manufacturer'}</h2>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-quick-add-trigger"
                    onClick={() => setShowQuickAddBrand(!showQuickAddBrand)}
                  >
                    <FaPlus size={11} />
                    <span>{showQuickAddBrand ? (isRtl ? 'إغلاق' : 'Close') : (isRtl ? 'إضافة براند سريع +' : 'Quick Add Brand +')}</span>
                  </button>
                </div>

                {/* Inline Quick Add Brand Box (Arabic & English name only) */}
                {showQuickAddBrand && (
                  <div className="quick-add-inline-box">
                    <div className="quick-add-header">
                      <FaCopyright />
                      <span>{isRtl ? 'إضافة سريعة للبراند (اسم عربي وإنجليزي فقط):' : 'Quick Add Brand (Name only):'}</span>
                    </div>

                    <div className="quick-add-fields-grid">
                      <div className="field-item">
                        <label>{isRtl ? 'اسم البراند بالعربية *' : 'Brand Name (Arabic) *'}</label>
                        <input
                          type="text"
                          placeholder={isRtl ? 'مثال: أسوس، سامسونج' : 'e.g. ASUS, Samsung'}
                          value={quickBrandNameAr}
                          onChange={(e) => setQuickBrandNameAr(e.target.value)}
                        />
                      </div>

                      <div className="field-item">
                        <label>{isRtl ? 'اسم البراند بالإنجليزية *' : 'Brand Name (English) *'}</label>
                        <input
                          type="text"
                          placeholder={isRtl ? 'مثال: ASUS, Samsung' : 'e.g. ASUS, Samsung'}
                          value={quickBrandNameEn}
                          onChange={(e) => setQuickBrandNameEn(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="quick-add-actions">
                      <button
                        type="button"
                        className="btn-quick-cancel"
                        onClick={() => {
                          setShowQuickAddBrand(false);
                          setQuickBrandNameAr('');
                          setQuickBrandNameEn('');
                        }}
                      >
                        {isRtl ? 'إلغاء' : 'Cancel'}
                      </button>

                      <button
                        type="button"
                        className="btn-quick-submit"
                        disabled={quickBrandLoading}
                        onClick={handleQuickAddBrand}
                      >
                        <FaCheck />
                        <span>{quickBrandLoading ? (isRtl ? 'جاري الإضافة...' : 'Adding...') : (isRtl ? 'حفظ واختيار البراند' : 'Save & Select')}</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="form-group" style={{ marginTop: '12px' }}>
                  <CustomSelect
                    value={selectedBrandId}
                    onChange={(val) => setSelectedBrandId(val)}
                    options={brandOptions}
                    searchable={true}
                    searchPlaceholder={isRtl ? 'ابحث عن علامة تجارية...' : 'Search brands...'}
                    placeholder={isRtl ? 'اختر العلامة التجارية...' : 'Select Brand...'}
                    isRtl={isRtl}
                  />
                </div>
              </div>

              {/* Card 9: Tags Checklist & Quick Add */}
              <div className="form-section-card">
                <div className="section-header">
                  <div className="title-wrap">
                    <div className="section-icon">
                      <FaTags />
                    </div>
                    <div>
                      <h2>{isRtl ? 'وسوم الربط وعلاقات الذكاء' : 'Smart Tags & Rules'}</h2>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-quick-add-trigger"
                    onClick={() => setShowQuickAddTag(!showQuickAddTag)}
                  >
                    <FaPlus size={11} />
                    <span>{showQuickAddTag ? (isRtl ? 'إغلاق' : 'Close') : (isRtl ? 'إضافة وسم سريع +' : 'Quick Add Tag +')}</span>
                  </button>
                </div>

                {/* Inline Quick Add Tag Box (Arabic & English name) */}
                {showQuickAddTag && (
                  <div className="quick-add-inline-box">
                    <div className="quick-add-header">
                      <FaTags />
                      <span>{isRtl ? 'إضافة سريعة لوسم جديد (عربي وإنجليزي):' : 'Quick Add New Tag (Arabic & English):'}</span>
                    </div>

                    <div className="quick-add-fields-grid">
                      <div className="field-item">
                        <label>{isRtl ? 'اسم الوسم بالعربية *' : 'Tag Name (Arabic) *'}</label>
                        <input
                          type="text"
                          placeholder={isRtl ? 'مثال: ألعاب احترافية، شحن سريع' : 'e.g. Gaming, Fast Charging'}
                          value={quickTagNameAr}
                          onChange={(e) => setQuickTagNameAr(e.target.value)}
                        />
                      </div>

                      <div className="field-item">
                        <label>{isRtl ? 'اسم الوسم بالإنجليزية *' : 'Tag Name (English) *'}</label>
                        <input
                          type="text"
                          placeholder={isRtl ? 'مثال: Pro Gaming, Fast Charge' : 'e.g. Pro Gaming, Fast Charge'}
                          value={quickTagNameEn}
                          onChange={(e) => setQuickTagNameEn(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="quick-add-actions">
                      <button
                        type="button"
                        className="btn-quick-cancel"
                        onClick={() => {
                          setShowQuickAddTag(false);
                          setQuickTagNameAr('');
                          setQuickTagNameEn('');
                        }}
                      >
                        {isRtl ? 'إلغاء' : 'Cancel'}
                      </button>

                      <button
                        type="button"
                        className="btn-quick-submit"
                        disabled={quickTagLoading}
                        onClick={handleQuickAddTag}
                      >
                        <FaCheck />
                        <span>{quickTagLoading ? (isRtl ? 'جاري الإضافة...' : 'Adding...') : (isRtl ? 'حفظ وتحديد الوسم' : 'Save & Select')}</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="tags-checklist-box" style={{ marginTop: '12px' }}>
                  {availableTags.length === 0 ? (
                    <div style={{ padding: '8px', color: '#94a3b8', fontSize: '12px' }}>
                      {isRtl ? 'لا توجد وسوم مضافة حالياً. استخدم الإضافة السريعة أعلاه!' : 'No tags found. Use quick add above!'}
                    </div>
                  ) : (
                    availableTags.map((tag) => {
                      const isTagSelected = selectedTagIds.map(String).includes(String(tag.id));
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          className={`tag-checkbox-pill ${isTagSelected ? 'selected' : ''}`}
                          onClick={() => toggleTagPill(tag.id)}
                        >
                          <span>#{isRtl ? tag.name_ar : tag.name_en}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Card 10: Visibility & Status */}
              <div className="form-section-card">
                <div className="section-header">
                  <div className="title-wrap">
                    <div className="section-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </div>
                    <div>
                      <h2>{isRtl ? 'حالة النشر والظهور' : 'Visibility & Store Status'}</h2>
                    </div>
                  </div>
                </div>

                <div className="switches-vertical-list">
                  <div className="switch-row">
                    <div className="switch-text">
                      <strong>{isRtl ? 'نشط في واجهة المتجر' : 'Active in Store'}</strong>
                      <small>{isRtl ? 'متاح للعملاء للطلب والشراء الفوري' : 'Visible and purchasable by clients'}</small>
                    </div>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                  </div>

                  <div className="switch-row">
                    <div className="switch-text">
                      <strong>{isRtl ? 'منتج مميز (Featured Spotlight)' : 'Featured Spotlight'}</strong>
                      <small>{isRtl ? 'يظهر في واجهة المتجر والبانرات الترويجية' : 'Highlighted on homepage carousel'}</small>
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
                  <span>{isRtl ? 'جميع المتطلبات الأساسية مكتملة وجاهزة للنشر الفوري' : 'All required fields are completed'}</span>
                </div>
              ) : (
                <div className="validation-alert">
                  <FaTriangleExclamation style={{ fontSize: 13 }} />
                  <span>
                    {isRtl
                      ? 'مطلوب: الاسم باللغتين، سعر البيع، وتحديد قسم واحد على الأقل'
                      : 'Required: Name, Price, and at least 1 Category'}
                  </span>
                </div>
              )}
            </div>

            <div className="bottom-actions">
              <button
                type="button"
                className="btn-bottom-draft"
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
                  <span>{isRtl ? 'حفظ ونشر المنتج في المتجر' : 'Publish Product'}</span>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
