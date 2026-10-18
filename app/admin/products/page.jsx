'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  AdminSidebar,
  AdminHeader,
  CustomSelect,
} from '@/src/components/adminComponents';
import {
  FaBox,
  FaBoxesStacked,
  FaBoxOpen,
  FaTag,
  FaTags,
  FaStar,
  FaRegStar,
  FaKey,
  FaPenToSquare,
  FaEye,
  FaTrashCan,
  FaXmark,
  FaCheck,
  FaLayerGroup,
  FaArrowDownWideShort,
  FaArrowUpWideShort,
  FaArrowDown91,
  FaArrowUp19,
  FaArrowDownAZ,
  FaCircleCheck,
  FaTriangleExclamation,
} from 'react-icons/fa6';
import './Products.scss';

export default function AdminProductsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Layout & Global State
  const [adminUser, setAdminUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lang, setLang] = useState('ar');
  const isRtl = lang === 'ar';

  // Products Data
  const [products, setProducts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Loading States
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Filters & Controls
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [stockStatus, setStockStatus] = useState('all'); // all | in_stock | low_stock | out_of_stock
  const [visibilityStatus, setVisibilityStatus] = useState('all'); // all | active | inactive | featured
  const [sortBy, setSortBy] = useState('created_at_desc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Selection & Bulk Actions
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  // Modals & Drawers
  const [quickEditProduct, setQuickEditProduct] = useState(null);
  const [quickEditForm, setQuickEditForm] = useState({
    stock_quantity: 0,
    original_price: 0,
    sale_price: '',
    is_active: true,
    is_featured: false,
  });
  const [productToDelete, setProductToDelete] = useState(null);

  // Toast Feedback
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Auth helper
  const getAuthToken = () => {
    if (typeof window === 'undefined') return '';
    let token = localStorage.getItem('trendline_admin_token');
    if (token && token !== 'undefined' && token !== 'null') return token;

    const cookieToken = document.cookie
      .split('; ')
      .find((row) => row.startsWith('token=') || row.startsWith('trendline_token='));
    if (cookieToken) return decodeURIComponent(cookieToken.split('=')[1]);
    return '';
  };

  // Check Session & Auth
  useEffect(() => {
    const hasTokenCookie = typeof document !== 'undefined' && document.cookie
      .split('; ')
      .some((row) => row.startsWith('token=') || row.startsWith('trendline_token=') || row.startsWith('next-auth.session-token='));
    const localUser = typeof window !== 'undefined' ? localStorage.getItem('trendline_admin_user') : null;

    if (!hasTokenCookie && status === 'unauthenticated' && !localUser) {
      router.replace('/admin/login');
      return;
    }

    if (localUser) {
      try {
        setAdminUser(JSON.parse(localUser));
      } catch (e) {
        console.error(e);
      }
    } else if (session?.user) {
      setAdminUser(session.user);
    } else {
      setAdminUser({ name: 'Ahmed Sayed', email: 'ahmed.sayed@trendlineeg.com', role: 'SUPER_ADMIN' });
    }
  }, [status, router, session]);

  // Determine API Host (Relative URL for single-port Next.js)
  const getApiHost = () => {
    return '';
  };

  // Fetch Static Categories & Brands once
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const apiHost = getApiHost();
        const [catsRes, brandsRes] = await Promise.all([
          fetch(`${apiHost}/api/v1/catalog/categories`, { cache: 'no-store' }),
          fetch(`${apiHost}/api/v1/catalog/brands`, { cache: 'no-store' }),
        ]);

        if (catsRes.ok) {
          const catsData = await catsRes.json();
          if (catsData.success) setCategories(catsData.data || []);
        }
        if (brandsRes.ok) {
          const brandsData = await brandsRes.json();
          if (brandsData.success) setBrands(brandsData.data || []);
        }
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch Analytics KPI
  const fetchAnalytics = useCallback(async () => {
    try {
      const apiHost = getApiHost();
      const res = await fetch(`${apiHost}/api/v1/catalog/products/analytics`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAnalytics(data.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  }, []);

  // Fetch Filtered Products
  const fetchProducts = useCallback(async () => {
    try {
      setPageLoading(true);
      const apiHost = getApiHost();
      const params = new URLSearchParams();

      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (selectedCategory !== 'all') params.append('category_id', selectedCategory);
      if (selectedBrand !== 'all') params.append('brand_id', selectedBrand);
      if (stockStatus !== 'all') params.append('stock_status', stockStatus);

      if (visibilityStatus === 'active') params.append('is_active', 'true');
      else if (visibilityStatus === 'inactive') params.append('is_active', 'false');
      else if (visibilityStatus === 'featured') params.append('is_featured', 'true');
      else params.append('is_active', 'all');

      params.append('sort', sortBy);
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());

      const res = await fetch(`${apiHost}/api/v1/catalog/products?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setProducts(data.data || []);
          setTotalCount(data.count || 0);
          setTotalPages(data.total_pages || 1);
        }
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      showToast('حدث خطأ أثناء تحميل المنتجات');
    } finally {
      setPageLoading(false);
      setRefreshing(false);
    }
  }, [searchTerm, selectedCategory, selectedBrand, stockStatus, visibilityStatus, sortBy, currentPage, pageSize]);

  // Memoized options for CustomSelect components
  const categorySelectOptions = useMemo(() => {
    const allOption = {
      value: 'all',
      label: 'كل الأقسام والتصنيفات',
      icon: <FaLayerGroup style={{ color: 'var(--main-color, #0057C2)' }} />,
    };

    const formattedCats = categories.map((c) => ({
      value: c.id,
      label: isRtl ? c.name_ar : c.name_en,
      icon_url: c.icon_url,
      image_url: c.image_url,
      isSubcategory: !!c.parent_id,
      idBadge: c.id,
      badge: c.products_count !== undefined ? String(c.products_count) : undefined,
    }));

    return [allOption, ...formattedCats];
  }, [categories, isRtl]);

  const brandSelectOptions = useMemo(() => {
    const allOption = {
      value: 'all',
      label: 'كل الماركات التجارية',
      icon: <FaTags style={{ color: 'var(--main-color, #0057C2)' }} />,
    };

    const formattedBrands = brands.map((b) => ({
      value: b.id,
      label: isRtl ? b.name_ar : b.name_en,
      image_url: b.logo_url,
      icon: <FaTag style={{ color: '#64748b' }} />,
      idBadge: b.slug,
    }));

    return [allOption, ...formattedBrands];
  }, [brands, isRtl]);

  const sortSelectOptions = useMemo(() => [
    { value: 'created_at_desc', label: 'الأحدث إضافة', icon: <FaArrowDownWideShort /> },
    { value: 'created_at_asc', label: 'الأقدم أولاً', icon: <FaArrowUpWideShort /> },
    { value: 'price_asc', label: 'السعر: من الأقل للأعلى', icon: <FaArrowUp19 /> },
    { value: 'price_desc', label: 'السعر: من الأعلى للأقل', icon: <FaArrowDown91 /> },
    { value: 'stock_desc', label: 'المخزون: الأكثر توفراً', icon: <FaBoxesStacked /> },
    { value: 'stock_asc', label: 'المخزون: الأقل توفراً', icon: <FaBoxOpen /> },
    { value: 'name_asc', label: 'الاسم: أبجدياً (أ - ي)', icon: <FaArrowDownAZ /> },
  ], []);

  // Initial and reactive load
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle Refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
    fetchProducts();
  };

  // Toggle Active Status
  const handleToggleStatus = async (product) => {
    const token = getAuthToken();
    setActionLoadingId(product.id);
    try {
      const apiHost = getApiHost();
      const res = await fetch(`${apiHost}/api/v1/catalog/products/${product.id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        showToast(product.is_active ? 'تم إخفاء المنتج من المتجر' : 'تم تفعيل المنتج بنجاح');
        fetchProducts();
        fetchAnalytics();
      } else {
        showToast(data.message || 'فشل تعديل الحالة');
      }
    } catch (err) {
      showToast('تعذر الاتصال بالخادم');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Toggle Featured Status
  const handleToggleFeatured = async (product) => {
    const token = getAuthToken();
    setActionLoadingId(product.id);
    try {
      const apiHost = getApiHost();
      const res = await fetch(`${apiHost}/api/v1/catalog/products/${product.id}/featured`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        showToast(product.is_featured ? 'تم إزالة المنتج من المنتجات المميزة' : 'تم تمييز المنتج بنجاح');
        fetchProducts();
        fetchAnalytics();
      } else {
        showToast(data.message || 'فشل تحديث التمييز');
      }
    } catch (err) {
      showToast('تعذر الاتصال بالخادم');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open Quick Edit
  const handleOpenQuickEdit = (product) => {
    setQuickEditProduct(product);
    setQuickEditForm({
      stock_quantity: product.stock_quantity || 0,
      original_price: product.original_price || 0,
      sale_price: product.sale_price || '',
      is_active: product.is_active !== undefined ? product.is_active : true,
      is_featured: !!product.is_featured,
    });
  };

  // Save Quick Edit
  const handleSaveQuickEdit = async () => {
    if (!quickEditProduct) return;
    const token = getAuthToken();
    try {
      const apiHost = getApiHost();
      const res = await fetch(`${apiHost}/api/v1/catalog/products/${quickEditProduct.id}/quick-update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(quickEditForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast('تم حفظ التعديلات السريعة للمنتج بنجاح');
        setQuickEditProduct(null);
        fetchProducts();
        fetchAnalytics();
      } else {
        showToast(data.message || 'فشل الحفظ');
      }
    } catch (err) {
      showToast('حدث خطأ أثناء الحفظ');
    }
  };

  // Delete Single Product
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    const token = getAuthToken();
    try {
      const apiHost = getApiHost();
      const res = await fetch(`${apiHost}/api/v1/catalog/products/${productToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        showToast('تم حذف المنتج بنجاح');
        setProductToDelete(null);
        setSelectedProductIds((prev) => prev.filter((id) => id !== productToDelete.id));
        fetchProducts();
        fetchAnalytics();
      } else {
        showToast(data.message || 'فشل الحذف');
      }
    } catch (err) {
      showToast('تعذر إتمام عملية الحذف');
    }
  };

  // Selection Logic
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProductIds(products.map((p) => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleToggleSelectProduct = (id) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk Action Execution
  const handleBulkAction = async (action) => {
    if (!selectedProductIds.length) return;
    if (action === 'delete') {
      const confirmDelete = window.confirm(`هل أنت متأكد من حذف ${selectedProductIds.length} منتجات نهائياً؟`);
      if (!confirmDelete) return;
    }

    const token = getAuthToken();
    try {
      const apiHost = getApiHost();
      const res = await fetch(`${apiHost}/api/v1/catalog/products/bulk-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          product_ids: selectedProductIds,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('تم تطبيق الإجراء الجماعي بنجاح');
        setSelectedProductIds([]);
        fetchProducts();
        fetchAnalytics();
      } else {
        showToast(data.message || 'فشلت العملية');
      }
    } catch (err) {
      showToast('تعذر تنفيذ الإجراء الجماعي');
    }
  };

  // Copy ID to Clipboard
  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    showToast(`تم نسخ كود المنتج (${id})`);
  };

  // Export CSV of visible/filtered products
  const handleExportCSV = () => {
    if (!products.length) {
      showToast('لا توجد منتجات لتصديرها');
      return;
    }

    const headers = ['المعرف ID', 'اسم المنتج (عربي)', 'Product Name (EN)', 'SKU', 'الباركود', 'السعر', 'سعر البيع', 'المخزون', 'الحالة'];
    const rows = products.map((p) => [
      `"${p.id}"`,
      `"${p.name_ar || ''}"`,
      `"${p.name_en || ''}"`,
      `"${p.sku || ''}"`,
      `"${p.barcode || ''}"`,
      p.original_price,
      p.sale_price || '',
      p.stock_quantity,
      p.is_active ? 'نشط' : 'معطل',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `trendline_products_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('تم تصدير ملف Excel / CSV بنجاح');
  };

  // Calculated Profit Margin Helper
  const calculateMargin = (price, cost) => {
    const p = Number(price) || 0;
    const c = Number(cost) || 0;
    if (p <= 0 || c <= 0) return 0;
    return Math.round(((p - c) / p) * 100);
  };

  return (
    <div className="admin-products-page" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Toast */}
      {toastMessage && (
        <div className="toast-feedback-message">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Sidebar */}
      <AdminSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        lang={lang}
      />

      <div className={`admin-main-wrapper ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Main Header */}
        <AdminHeader
          adminUser={adminUser}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          isSidebarCollapsed={sidebarCollapsed}
          lang={lang}
          onToggleLanguage={(l) => setLang(l)}
        />

        <main className="admin-products-content">
          {/* Breadcrumbs & Primary Actions */}
          <section className="page-nav-header">
            <div className="breadcrumbs-line">
              <Link href="/admin">الرئيسية</Link>
              <span className="separator">/</span>
              <span>المتجر والكتالوج</span>
              <span className="separator">/</span>
              <span className="current-crumb">المنتجات ({totalCount})</span>
            </div>

            <div className="top-action-buttons">
              <button
                className={`btn-secondary-action btn-refresh ${refreshing ? 'loading' : ''}`}
                onClick={handleRefresh}
                title="تحديث البيانات"
              >
                <svg
                  className={refreshing ? 'spin' : ''}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                <span>تحديث</span>
              </button>

              <button className="btn-secondary-action" onClick={handleExportCSV} title="تصدير ملف Excel">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>تصدير CSV</span>
              </button>

              <Link href="/admin/products/add" className="btn-add-product-main">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>إضافة منتج جديد</span>
              </Link>
            </div>
          </section>

          {/* 5 Executive KPI Analytics Cards */}
          <section className="kpi-analytics-grid">
            {/* 1. Total Products */}
            <div className="kpi-card kpi-primary">
              <div className="kpi-icon-wrap icon-primary">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <div className="kpi-details">
                <span className="kpi-title">إجمالي المنتجات</span>
                <span className="kpi-value">{analytics ? analytics.total.toLocaleString() : '...'}</span>
                <span className="kpi-subtext">
                  <span>{analytics?.inventory_units?.toLocaleString() || 0} قطعة في المخازن</span>
                </span>
              </div>
            </div>

            {/* 2. Active in Store */}
            <div className="kpi-card kpi-success">
              <div className="kpi-icon-wrap icon-success">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <div className="kpi-details">
                <span className="kpi-title">المعروض في المتجر</span>
                <span className="kpi-value">{analytics ? analytics.active.toLocaleString() : '...'}</span>
                <span className="kpi-subtext">
                  <span style={{ color: '#10b981', fontWeight: 800 }}>
                    {analytics?.total ? Math.round((analytics.active / analytics.total) * 100) : 0}% نشط حالياً
                  </span>
                </span>
              </div>
            </div>

            {/* 3. Low Stock Alert */}
            <div className="kpi-card kpi-warning">
              <div className="kpi-icon-wrap icon-warning">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="kpi-details">
                <span className="kpi-title">أوشك على النفاد</span>
                <span className="kpi-value">{analytics ? analytics.low_stock.toLocaleString() : '...'}</span>
                <span className="kpi-subtext">تحت حد الطلب الأدنى</span>
              </div>
            </div>

            {/* 4. Out of Stock */}
            <div className="kpi-card kpi-danger">
              <div className="kpi-icon-wrap icon-danger">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <div className="kpi-details">
                <span className="kpi-title">نفد من المخزن</span>
                <span className="kpi-value">{analytics ? analytics.out_of_stock.toLocaleString() : '...'}</span>
                <span className="kpi-subtext">يتطلب إعادة توريد</span>
              </div>
            </div>

            {/* 5. Inventory Asset Value */}
            <div className="kpi-card kpi-info">
              <div className="kpi-icon-wrap icon-info">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="kpi-details">
                <span className="kpi-title">القيمة البيعية للمخزون</span>
                <span className="kpi-value" style={{ display: 'inline-flex', alignItems: 'baseline', gap: '4px' }}>
                  <span>{analytics ? Number(analytics.inventory_retail_value || 0).toLocaleString('en-US') : '...'}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>ج.م</span>
                </span>
                <span className="kpi-subtext">
                  <span>التكلفة: {Number(analytics?.inventory_cost_value || 0).toLocaleString('en-US')} ج.م</span>
                </span>
              </div>
            </div>
          </section>

          {/* Advanced Filter & Control Toolbar */}
          <section className="products-control-toolbar">
            <div className="toolbar-row-top">
              {/* Search Box */}
              <div className="search-box-wrap">
                <span className="search-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="ابحث بالاسم، كود Base64، الـ SKU، أو الباركود..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                {searchTerm && (
                  <button className="clear-search-btn" onClick={() => setSearchTerm('')} title="مسح">
                    <FaXmark />
                  </button>
                )}
              </div>

              {/* Dropdowns */}
              <div className="filter-selects-group">
                {/* Category Filter */}
                <div className="select-filter-item">
                  <CustomSelect
                    value={selectedCategory}
                    onChange={(val) => {
                      setSelectedCategory(val);
                      setCurrentPage(1);
                    }}
                    options={categorySelectOptions}
                    searchable={true}
                    searchPlaceholder="ابحث في الأقسام..."
                    placeholder="كل الأقسام والتصنيفات"
                    isRtl={isRtl}
                  />
                </div>

                {/* Brand Filter */}
                <div className="select-filter-item">
                  <CustomSelect
                    value={selectedBrand}
                    onChange={(val) => {
                      setSelectedBrand(val);
                      setCurrentPage(1);
                    }}
                    options={brandSelectOptions}
                    searchable={true}
                    searchPlaceholder="ابحث في الماركات..."
                    placeholder="كل الماركات التجارية"
                    isRtl={isRtl}
                  />
                </div>

                {/* Sort Filter */}
                <div className="select-filter-item">
                  <CustomSelect
                    value={sortBy}
                    onChange={(val) => {
                      setSortBy(val);
                      setCurrentPage(1);
                    }}
                    options={sortSelectOptions}
                    isRtl={isRtl}
                  />
                </div>
              </div>

              {/* View Mode Switcher */}
              <div className="view-mode-toggle">
                <button
                  className={`btn-view-mode ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="عرض الكروت الذكية"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                  <span>كروت</span>
                </button>
                <button
                  className={`btn-view-mode ${viewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setViewMode('table')}
                  title="عرض جدول البيانات"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                  <span>جدول</span>
                </button>
              </div>
            </div>

            {/* Quick Status Filter Pills */}
            <div className="toolbar-row-bottom">
              <div className="status-pills-wrap">
                <span className="pill-label">حالة المخزون:</span>
                <button
                  className={`filter-pill ${stockStatus === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    setStockStatus('all');
                    setCurrentPage(1);
                  }}
                >
                  الكل
                </button>
                <button
                  className={`filter-pill ${stockStatus === 'in_stock' ? 'active' : ''}`}
                  onClick={() => {
                    setStockStatus('in_stock');
                    setCurrentPage(1);
                  }}
                >
                  متوفر بالمخزن
                </button>
                <button
                  className={`filter-pill ${stockStatus === 'low_stock' ? 'active' : ''}`}
                  onClick={() => {
                    setStockStatus('low_stock');
                    setCurrentPage(1);
                  }}
                >
                  أوشك على النفاد
                  {analytics && <span className="pill-count">{analytics.low_stock}</span>}
                </button>
                <button
                  className={`filter-pill ${stockStatus === 'out_of_stock' ? 'active' : ''}`}
                  onClick={() => {
                    setStockStatus('out_of_stock');
                    setCurrentPage(1);
                  }}
                >
                  نفد من المخزن
                  {analytics && <span className="pill-count">{analytics.out_of_stock}</span>}
                </button>
              </div>

              <div className="status-pills-wrap">
                <span className="pill-label">العرض:</span>
                <button
                  className={`filter-pill ${visibilityStatus === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    setVisibilityStatus('all');
                    setCurrentPage(1);
                  }}
                >
                  الكل
                </button>
                <button
                  className={`filter-pill ${visibilityStatus === 'active' ? 'active' : ''}`}
                  onClick={() => {
                    setVisibilityStatus('active');
                    setCurrentPage(1);
                  }}
                >
                  نشط فقط
                </button>
                <button
                  className={`filter-pill ${visibilityStatus === 'inactive' ? 'active' : ''}`}
                  onClick={() => {
                    setVisibilityStatus('inactive');
                    setCurrentPage(1);
                  }}
                >
                  مخفي / معطل
                </button>
                <button
                  className={`filter-pill ${visibilityStatus === 'featured' ? 'active' : ''}`}
                  onClick={() => {
                    setVisibilityStatus('featured');
                    setCurrentPage(1);
                  }}
                >
                  مميز ⭐
                </button>
              </div>

              <div className="sort-limit-wrap">
                <span className="total-matches-count">
                  إجمالي النتائج: <span>{totalCount}</span> منتج
                </span>
              </div>
            </div>
          </section>

          {/* Floating Bulk Actions Bar */}
          {selectedProductIds.length > 0 && (
            <div className="bulk-actions-floating-bar">
              <div className="bulk-selection-info">
                <span className="badge-selected-count">{selectedProductIds.length}</span>
                <span>منتجات محددة لتنفيذ إجراء موحد</span>
              </div>

              <div className="bulk-buttons-group">
                <button className="btn-bulk-activate" onClick={() => handleBulkAction('activate')}>
                  <span>تفعيل في المتجر</span>
                </button>
                <button className="btn-bulk-deactivate" onClick={() => handleBulkAction('deactivate')}>
                  <span>إخفاء / تعطيل</span>
                </button>
                <button className="btn-bulk-feature" onClick={() => handleBulkAction('feature')}>
                  <span>تعيين كمميز ⭐</span>
                </button>
                <button className="btn-bulk-delete" onClick={() => handleBulkAction('delete')}>
                  <span>حذف المحدد</span>
                </button>
                <button className="btn-bulk-clear" onClick={() => setSelectedProductIds([])}>
                  <span>إلغاء التحديد</span>
                </button>
              </div>
            </div>
          )}

          {/* Products Content Area */}
          {pageLoading ? (
            <div className="products-empty-state">
              <div className="empty-icon spin">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="2" x2="12" y2="6" />
                  <line x1="12" y1="18" x2="12" y2="22" />
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                  <line x1="2" y1="12" x2="6" y2="12" />
                  <line x1="18" y1="12" x2="22" y2="12" />
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                  <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                </svg>
              </div>
              <h3>جاري تحميل المنتجات...</h3>
              <p>يتم جلب البيانات الحالية من قاعدة البيانات ومزامنة أسعار ومخزون المتجر.</p>
            </div>
          ) : products.length === 0 ? (
            <div className="products-empty-state">
              <div className="empty-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <h3>لم يتم العثور على أي منتجات تطابق الفلاتر</h3>
              <p>جرّب تعديل كلمات البحث، أو تغيير القسم أو الماركة المحددة لرؤية المنتجات المتاحة.</p>
              <button
                className="btn-reset-filters"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedBrand('all');
                  setStockStatus('all');
                  setVisibilityStatus('all');
                }}
              >
                إعادة ضبط جميع الفلاتر
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* ==============================================================
               1. GRID VIEW (E-COMMERCE ADVANCED CARDS)
               ============================================================== */
            <div className="products-cards-grid">
              {products.map((product) => {
                const isSelected = selectedProductIds.includes(product.id);
                const primaryImage =
                  product.images?.find((img) => img.is_primary)?.image_url ||
                  product.images?.[0]?.image_url ||
                  '';
                const primaryCat = product.categories?.[0];
                const margin = calculateMargin(product.sale_price || product.original_price, product.cost_price);
                const hasDiscount =
                  product.sale_price && Number(product.sale_price) < Number(product.original_price);
                const discountPct = product.discount_percent || (hasDiscount ? Math.round(((product.original_price - product.sale_price) / product.original_price) * 100) : 0);

                let stockClass = 'in-stock';
                let stockLabel = `متوفر: ${product.stock_quantity}`;
                if (product.stock_quantity === 0) {
                  stockClass = 'out-of-stock';
                  stockLabel = 'نفد من المخزن';
                } else if (product.stock_quantity <= (product.low_stock_threshold || 5)) {
                  stockClass = 'low-stock';
                  stockLabel = `قليل: ${product.stock_quantity}`;
                }

                return (
                  <div
                    key={product.id}
                    className={`product-ecom-card ${isSelected ? 'selected' : ''} ${!product.is_active ? 'inactive-product' : ''}`}
                  >
                    {/* Image Area with Badges */}
                    <div className="card-image-wrap">
                      <input
                        type="checkbox"
                        className="card-checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectProduct(product.id)}
                        aria-label="تحديد المنتج"
                      />

                      <div className="badges-top-start">
                        {hasDiscount && <span className="discount-badge">خصم {discountPct}%</span>}
                        {product.is_featured && <span className="featured-badge">⭐ مميز</span>}
                      </div>

                      {primaryImage ? (
                        <img
                          src={primaryImage}
                          alt={product.name_ar}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextSibling) {
                              e.currentTarget.nextSibling.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div
                        className="img-placeholder"
                        style={{ display: primaryImage ? 'none' : 'flex' }}
                      >
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="3" width="20" height="14" rx="2" />
                          <line x1="8" y1="21" x2="16" y2="21" />
                          <line x1="12" y1="17" x2="12" y2="21" />
                        </svg>
                      </div>

                      <div className={`stock-pill-badge ${stockClass}`}>
                        <span className="stock-dot" />
                        <span>{stockLabel}</span>
                      </div>
                    </div>

                    {/* Card Content Body */}
                    <div className="card-body">
                      {/* Meta Tags */}
                      <div className="meta-tags-line">
                        <span className="cat-badge">
                          {primaryCat ? primaryCat.name_ar : 'بدون قسم'}
                        </span>
                        <span className="brand-name">
                          {product.brand ? product.brand.name_ar : 'علامة عامة'}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="product-title" title={`${product.name_ar} (${product.name_en || ''})`}>
                        {product.name_ar}
                      </h3>

                      {/* Base64 ID & SKU Tag */}
                      <div className="identifier-pills-row">
                        <span
                          className="id-tag"
                          onClick={() => handleCopyId(product.id)}
                          title="اضغط لنسخ المعرّف الفريد"
                        >
                          <FaKey style={{ fontSize: '11px', color: '#64748b' }} /> {product.id}
                        </span>
                        <span className="sku-tag" title={product.sku}>
                          SKU: {product.sku}
                        </span>
                      </div>

                      {/* Pricing Section */}
                      <div className="pricing-section">
                        <div className="sale-price" style={{ display: 'inline-flex', alignItems: 'baseline', gap: '3px' }}>
                          <span>{Number(product.sale_price || product.original_price).toLocaleString('en-US')}</span>
                          <span className="currency">ج.م</span>
                        </div>
                        {hasDiscount && (
                          <div className="original-striked-price" style={{ display: 'inline-flex', alignItems: 'baseline', gap: '2px' }}>
                            <span>{Number(product.original_price).toLocaleString('en-US')}</span>
                            <span>ج.م</span>
                          </div>
                        )}
                        {margin > 0 && <span className="margin-badge">ربح {margin}%</span>}
                      </div>

                      {/* Inventory Mini Progress Gauge */}
                      <div className="inventory-progress-wrap">
                        <div className="progress-label-line">
                          <span>المخزون المتاح للبيع:</span>
                          <span>
                            {Math.max(0, (product.stock_quantity || 0) - (product.reserved_stock || 0))} قطعة
                          </span>
                        </div>
                        <div className="progress-track">
                          <div
                            className={`progress-fill ${
                              product.stock_quantity === 0
                                ? 'fill-red'
                                : product.stock_quantity <= (product.low_stock_threshold || 5)
                                ? 'fill-amber'
                                : 'fill-green'
                            }`}
                            style={{
                              width: `${Math.min(100, (product.stock_quantity / 50) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Footer Controls */}
                    <div className="card-footer">
                      <div className="card-switches-group">
                        {/* Active Switch */}
                        <label className="switch-control" title="تفعيل أو إخفاء المنتج من واجهة المتجر">
                          <input
                            type="checkbox"
                            checked={!!product.is_active}
                            disabled={actionLoadingId === product.id}
                            onChange={() => handleToggleStatus(product)}
                          />
                          <span>{product.is_active ? 'معروض' : 'مخفي'}</span>
                        </label>

                        {/* Featured Star Button */}
                        <button
                          className={`btn-star-featured ${product.is_featured ? 'starred' : ''}`}
                          onClick={() => handleToggleFeatured(product)}
                          title={product.is_featured ? 'إلغاء التمييز' : 'تمييز المنتج في الواجهة'}
                        >
                          <FaStar style={{ fontSize: '13px' }} />
                        </button>
                      </div>

                      {/* Action Buttons */}
                      <div className="card-action-btns">
                        <button
                          className="btn-quick-edit"
                          onClick={() => handleOpenQuickEdit(product)}
                          title="تعديل سريع للأسعار والمخزون"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>

                        <a
                          href={`/products/${product.slug || product.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="معاينة المنتج في صفحة المتجر"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>

                        <button
                          className="btn-delete"
                          onClick={() => setProductToDelete(product)}
                          title="حذف المنتج"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ==============================================================
               2. TABLE VIEW (ERP ADVANCED DATA TABLE)
               ============================================================== */
            <div className="products-table-container">
              <div className="table-scroll-wrapper">
                <table className="erp-products-table">
                  <thead>
                    <tr>
                      <th style={{ width: 44 }}>
                        <input
                          type="checkbox"
                          checked={selectedProductIds.length === products.length && products.length > 0}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th>المنتج والمعرّف</th>
                      <th>القسم والماركة</th>
                      <th className="th-sortable" onClick={() => setSortBy(sortBy === 'price_asc' ? 'price_desc' : 'price_asc')}>
                        التسعير وهامش الربح {sortBy.includes('price') ? (sortBy === 'price_asc' ? '▲' : '▼') : ''}
                      </th>
                      <th className="th-sortable" onClick={() => setSortBy(sortBy === 'stock_desc' ? 'stock_asc' : 'stock_desc')}>
                        حالة المخزون {sortBy.includes('stock') ? (sortBy === 'stock_desc' ? '▼' : '▲') : ''}
                      </th>
                      <th>الحالة والظهور</th>
                      <th style={{ textAlign: 'center' }}>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const isSelected = selectedProductIds.includes(product.id);
                      const primaryImage =
                        product.images?.find((img) => img.is_primary)?.image_url ||
                        product.images?.[0]?.image_url ||
                        '';
                      const primaryCat = product.categories?.[0];
                      const margin = calculateMargin(product.sale_price || product.original_price, product.cost_price);

                      let stockClass = '#10b981';
                      if (product.stock_quantity === 0) stockClass = '#ef4444';
                      else if (product.stock_quantity <= (product.low_stock_threshold || 5)) stockClass = '#f59e0b';

                      return (
                        <tr key={product.id} className={isSelected ? 'row-selected' : ''}>
                          <td>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectProduct(product.id)}
                            />
                          </td>
                          <td>
                            <div className="cell-product-main">
                              <div className="product-thumb-small">
                                {primaryImage ? (
                                  <img src={primaryImage} alt="" />
                                ) : (
                                  <FaBoxOpen style={{ fontSize: '18px', color: '#cbd5e1' }} />
                                )}
                              </div>
                              <div className="product-name-block">
                                <span className="title-text" title={product.name_ar}>
                                  {product.name_ar}
                                </span>
                                <div className="code-subline">
                                  <span
                                    className="base64-badge"
                                    onClick={() => handleCopyId(product.id)}
                                    title="انسخ المعرف"
                                  >
                                    ID: {product.id}
                                  </span>
                                  <span className="sku-text">SKU: {product.sku}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              <span style={{ fontWeight: 800, color: 'var(--main-color, #0057C2)' }}>
                                {primaryCat?.name_ar || 'بدون قسم'}
                              </span>
                              <span style={{ fontSize: 11.5, color: '#64748b' }}>
                                {product.brand?.name_ar || 'علامة تجارية عامة'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="cell-pricing">
                              <span className="sale-num">
                                {Number(product.sale_price || product.original_price).toLocaleString()} ج.م
                              </span>
                              <div className="cost-margin-sub">
                                <span>تكلفة: {Number(product.cost_price || 0).toLocaleString()}</span>
                                {margin > 0 && <span className="margin-pct">+{margin}%</span>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="cell-stock">
                              <div className="stock-num-line">
                                <span style={{ color: stockClass }}>
                                  {product.stock_quantity === 0
                                    ? 'نفد'
                                    : `${product.stock_quantity} قطعة`}
                                </span>
                                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                                  متاح: {Math.max(0, product.stock_quantity - (product.reserved_stock || 0))}
                                </span>
                              </div>
                              <div className="mini-progress">
                                <div
                                  className="mini-fill"
                                  style={{
                                    width: `${Math.min(100, (product.stock_quantity / 40) * 100)}%`,
                                    background: stockClass,
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '3px 10px',
                                  borderRadius: 12,
                                  fontSize: 11.5,
                                  fontWeight: 800,
                                  background: product.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                  color: product.is_active ? '#10b981' : '#ef4444',
                                }}
                              >
                                {product.is_active ? 'نشط بالمتجر' : 'مخفي'}
                              </span>
                              {product.is_featured && (
                                <span style={{ color: '#f59e0b', fontSize: 13, display: 'inline-flex', alignItems: 'center' }} title="منتج مميز">
                                  <FaStar />
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="cell-actions" style={{ justifyContent: 'center' }}>
                              <button
                                className="btn-quick-edit"
                                onClick={() => handleOpenQuickEdit(product)}
                                title="تعديل سريع"
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  border: '1px solid #e2e8f0',
                                  background: '#fff',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#475569',
                                }}
                              >
                                <FaPenToSquare style={{ fontSize: '13px' }} />
                              </button>
                              <a
                                href={`/products/${product.slug || product.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="معاينة بالمتجر"
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  border: '1px solid #e2e8f0',
                                  background: '#fff',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  textDecoration: 'none',
                                  color: '#0057C2',
                                }}
                              >
                                <FaEye style={{ fontSize: '13px' }} />
                              </a>
                              <button
                                onClick={() => setProductToDelete(product)}
                                title="حذف"
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  border: '1px solid #fee2e2',
                                  background: '#fff',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <FaTrashCan style={{ fontSize: '13px' }} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination Bar */}
          {totalPages > 1 && (
            <div className="pagination-bar">
              <div className="pagination-info">
                عرض {((currentPage - 1) * pageSize) + 1} إلى {Math.min(currentPage * pageSize, totalCount)} من أصل {totalCount} منتج
              </div>

              <div className="pagination-controls">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  السابق
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={page === currentPage ? 'active-page' : ''}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  التالي
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Quick Edit Modal */}
      {quickEditProduct && (
        <div className="quick-edit-modal-backdrop" onClick={() => setQuickEditProduct(null)}>
          <div className="quick-edit-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>تعديل سريع: {quickEditProduct.name_ar}</h3>
              <button className="close-btn" onClick={() => setQuickEditProduct(null)}>
                <FaXmark />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-cols-2">
                <div className="form-row">
                  <label>السعر الأساسي (ج.م)</label>
                  <input
                    type="number"
                    value={quickEditForm.original_price}
                    onChange={(e) =>
                      setQuickEditForm({ ...quickEditForm, original_price: e.target.value })
                    }
                  />
                </div>
                <div className="form-row">
                  <label>سعر التخفيض (اختياري)</label>
                  <input
                    type="number"
                    value={quickEditForm.sale_price}
                    placeholder="بدون خصم"
                    onChange={(e) =>
                      setQuickEditForm({ ...quickEditForm, sale_price: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-cols-2">
                <div className="form-row">
                  <label>كمية المخزون الفعلي بالمخزن</label>
                  <input
                    type="number"
                    value={quickEditForm.stock_quantity}
                    onChange={(e) =>
                      setQuickEditForm({ ...quickEditForm, stock_quantity: e.target.value })
                    }
                  />
                </div>
                <div className="form-row">
                  <label>تكلفة التوريد (للحسابات)</label>
                  <input
                    type="number"
                    disabled
                    value={quickEditProduct.cost_price || 0}
                    style={{ background: '#f1f5f9', color: '#64748b' }}
                  />
                </div>
              </div>

              <div className="margin-indicator-box">
                <span>هامش الربح المتوقع للوحدة:</span>
                <span style={{ color: '#10b981', fontWeight: 900, fontSize: 15 }}>
                  +{calculateMargin(quickEditForm.sale_price || quickEditForm.original_price, quickEditProduct.cost_price)}%
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={quickEditForm.is_active}
                    onChange={(e) =>
                      setQuickEditForm({ ...quickEditForm, is_active: e.target.checked })
                    }
                  />
                  <span>عرض المنتج في المتجر (نشط)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={quickEditForm.is_featured}
                    onChange={(e) =>
                      setQuickEditForm({ ...quickEditForm, is_featured: e.target.checked })
                    }
                  />
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    تمييز المنتج في الواجهة <FaStar style={{ color: '#f59e0b', fontSize: 12 }} />
                  </span>
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setQuickEditProduct(null)}>
                إلغاء
              </button>
              <button className="btn-save" onClick={handleSaveQuickEdit}>
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="quick-edit-modal-backdrop" onClick={() => setProductToDelete(null)}>
          <div className="quick-edit-modal-card" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: '#ef4444' }}>تأكيد حذف المنتج</h3>
              <button className="close-btn" onClick={() => setProductToDelete(null)}>
                <FaXmark />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ margin: 0, fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
                هل أنت متأكد من رغبتك في حذف المنتج:
                <br />
                <strong>{productToDelete.name_ar}</strong>
                <br />
                <span style={{ fontSize: 12, color: '#64748b' }}>كود: {productToDelete.id} (SKU: {productToDelete.sku})</span>
                <br />
                سيتم حذف كافة الصور وحركات المخزن المرتبطة بهذا المنتج بصورة نهائية.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setProductToDelete(null)}>
                إلغاء
              </button>
              <button
                className="btn-save"
                style={{ background: '#ef4444' }}
                onClick={handleConfirmDelete}
              >
                تأكيد الحذف النهائي
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
