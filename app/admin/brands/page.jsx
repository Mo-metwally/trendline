'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  AdminSidebar,
  AdminHeader,
  AdminStatsCard,
  AdminModal,
  useToast,
} from '@/src/components/adminComponents';
import {
  FaCopyright,
  FaPlus,
  FaPenToSquare,
  FaTrashCan,
  FaMagnifyingGlass,
  FaRotate,
  FaStar,
  FaCheck,
  FaGlobe,
  FaBox,
  FaTriangleExclamation,
  FaCloudArrowUp,
  FaTag,
  FaArrowRight,
  FaArrowLeft,
} from 'react-icons/fa6';
import { formatFactory } from '@/src/utils/formatFactory';
import './Brands.scss';

export default function AdminBrandsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const toast = useToast();
  const [adminUser, setAdminUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lang, setLang] = useState('ar');

  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive' | 'featured'

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [editForm, setEditForm] = useState({
    name_ar: '',
    name_en: '',
    slug: '',
    description_ar: '',
    description_en: '',
    website_url: '',
    sort_order: 0,
    is_featured: false,
    is_active: true,
    logo_url: '',
  });

  // Edit Logo Upload State
  const [editLogoFile, setEditLogoFile] = useState(null);
  const [editLogoPreview, setEditLogoPreview] = useState('');
  const [editLogoUploading, setEditLogoUploading] = useState(false);
  const editLogoInputRef = useRef(null);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState(null);

  const isRtl = lang === 'ar';

  // Helper: Ensure Auth Token
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
      setAdminUser(session.user);
    }
  }, [status, router, session]);

  // Fetch Brands from API
  const fetchBrands = async () => {
    try {
      setLoading(true);
      const apiHost =
        typeof window !== 'undefined' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1'
          ? `http://${window.location.hostname}:5000`
          : 'http://localhost:5000';

      const res = await fetch(`${apiHost}/api/v1/catalog/brands?all=true`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setBrands(json.data);
          return;
        }
      }
      setBrands([]);
    } catch (err) {
      console.error('Error fetching brands:', err);
      toast.error(
        isRtl ? 'فشل تحميل قائمة العلامات التجارية' : 'Failed to load brands',
        isRtl ? 'خطأ في الاتصال' : 'Connection Error'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = brands.length;
    const active = brands.filter((b) => b.is_active).length;
    const featured = brands.filter((b) => b.is_featured).length;
    const totalProducts = brands.reduce((sum, b) => sum + (b.products_count || 0), 0);
    return { total, active, featured, totalProducts };
  }, [brands]);

  // Filtered Brands
  const filteredBrands = useMemo(() => {
    return brands.filter((b) => {
      // Search match
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const mAr = b.name_ar?.toLowerCase().includes(term);
        const mEn = b.name_en?.toLowerCase().includes(term);
        const mSlug = b.slug?.toLowerCase().includes(term);
        if (!mAr && !mEn && !mSlug) return false;
      }
      // Status filter
      if (statusFilter === 'active') return b.is_active;
      if (statusFilter === 'inactive') return !b.is_active;
      if (statusFilter === 'featured') return b.is_featured;
      return true;
    });
  }, [brands, searchTerm, statusFilter]);

  // Quick Toggle Active Status
  const handleToggleActive = async (brand) => {
    try {
      const token = await ensureAuthToken();
      const apiHost =
        typeof window !== 'undefined' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1'
          ? `http://${window.location.hostname}:5000`
          : 'http://localhost:5000';

      const newStatus = !brand.is_active;

      // Optimistic update
      setBrands((prev) =>
        prev.map((item) => (item.id === brand.id ? { ...item, is_active: newStatus } : item))
      );

      const res = await fetch(`${apiHost}/api/v1/catalog/brands/${brand.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ is_active: newStatus }),
      });

      if (res.ok) {
        toast.success(
          newStatus
            ? isRtl ? `تم تفعيل البراند "${brand.name_ar}"` : `Brand "${brand.name_en}" activated`
            : isRtl ? `تم تعطيل البراند "${brand.name_ar}"` : `Brand "${brand.name_en}" deactivated`,
          isRtl ? 'تحديث الحالة' : 'Status Updated'
        );
      } else {
        // Rollback
        setBrands((prev) =>
          prev.map((item) => (item.id === brand.id ? { ...item, is_active: !newStatus } : item))
        );
        toast.error(
          isRtl ? 'تعذر تحديث حالة البراند' : 'Failed to update brand status',
          isRtl ? 'خطأ' : 'Error'
        );
      }
    } catch (err) {
      console.error('Error toggling brand status:', err);
      fetchBrands();
    }
  };

  // Quick Toggle Featured Status
  const handleToggleFeatured = async (brand) => {
    try {
      const token = await ensureAuthToken();
      const apiHost =
        typeof window !== 'undefined' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1'
          ? `http://${window.location.hostname}:5000`
          : 'http://localhost:5000';

      const newFeatured = !brand.is_featured;

      // Optimistic update
      setBrands((prev) =>
        prev.map((item) => (item.id === brand.id ? { ...item, is_featured: newFeatured } : item))
      );

      const res = await fetch(`${apiHost}/api/v1/catalog/brands/${brand.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ is_featured: newFeatured }),
      });

      if (res.ok) {
        toast.success(
          newFeatured
            ? isRtl ? `تم تمييز البراند "${brand.name_ar}" في الواجهة` : `Brand "${brand.name_en}" marked as featured`
            : isRtl ? `تم إلغاء تمييز البراند "${brand.name_ar}"` : `Brand "${brand.name_en}" unfeatured`,
          isRtl ? 'البراندات المميزة' : 'Featured Updated'
        );
      } else {
        fetchBrands();
      }
    } catch (err) {
      console.error('Error toggling featured:', err);
      fetchBrands();
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (brand) => {
    setEditingBrand(brand);
    setEditForm({
      name_ar: brand.name_ar || '',
      name_en: brand.name_en || '',
      slug: brand.slug || '',
      description_ar: brand.description_ar || '',
      description_en: brand.description_en || '',
      website_url: brand.website_url || '',
      sort_order: brand.sort_order ?? 0,
      is_featured: !!brand.is_featured,
      is_active: !!brand.is_active,
      logo_url: brand.logo_url || '',
    });
    setEditLogoFile(null);
    setEditLogoPreview(brand.logo_url || '');
    setIsEditModalOpen(true);
  };

  // Upload Logo Helper
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

  // Handle Logo Selection in Edit Modal
  const handleEditLogoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setEditLogoUploading(true);

      // Process via formatFactory WebP 80%
      const processed = await formatFactory(file, {
        allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
        maxImageSize: 5 * 1024 * 1024,
        imageQuality: 0.8,
        convertToWebp: true,
      });

      setEditLogoFile(processed.file);
      setEditLogoPreview(processed.previewUrl);

      // Upload to server
      const uploadedServerUrl = await uploadBrandLogo(processed.file);
      if (uploadedServerUrl) {
        setEditForm((prev) => ({ ...prev, logo_url: uploadedServerUrl }));
      } else {
        setEditForm((prev) => ({ ...prev, logo_url: processed.previewUrl }));
      }

      toast.info(
        isRtl ? 'تمت معالجة الشعار بصيغة WebP الحديثة' : 'Logo compressed via WebP',
        isRtl ? 'معالجة الوسائط' : 'formatFactory'
      );
    } catch (err) {
      console.error('Error selecting logo:', err);
      toast.error(
        err.message || (isRtl ? 'تعذر معالجة صورة الشعار' : 'Logo processing failed'),
        isRtl ? 'خطأ بالصورة' : 'Image Error'
      );
    } finally {
      setEditLogoUploading(false);
    }
  };

  // Save Edit Changes
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingBrand) return;

    if (!editForm.name_ar.trim() || !editForm.name_en.trim()) {
      toast.warning(
        isRtl ? 'يرجى كتابة اسم البراند بالعربية والإنجليزية' : 'Both Arabic and English names are required',
        isRtl ? 'بيانات مطلوبة' : 'Missing Fields'
      );
      return;
    }

    try {
      setActionLoading(true);
      const token = await ensureAuthToken();
      const apiHost =
        typeof window !== 'undefined' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1'
          ? `http://${window.location.hostname}:5000`
          : 'http://localhost:5000';

      const payload = {
        name_ar: editForm.name_ar.trim(),
        name_en: editForm.name_en.trim(),
        slug: editForm.slug.trim() || editForm.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        logo_url: editForm.logo_url || editLogoPreview,
        description_ar: editForm.description_ar.trim() || null,
        description_en: editForm.description_en.trim() || null,
        website_url: editForm.website_url.trim() || null,
        sort_order: Number(editForm.sort_order) || 0,
        is_featured: editForm.is_featured,
        is_active: editForm.is_active,
      };

      const res = await fetch(`${apiHost}/api/v1/catalog/brands/${editingBrand.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      let data = {};
      try {
        data = await res.json();
      } catch (parseErr) {
        console.error('Failed to parse response JSON:', parseErr);
      }

      if (res.ok && data.success) {
        toast.success(
          isRtl ? `تم تحديث البراند "${payload.name_ar}" بنجاح!` : `Brand "${payload.name_en}" updated successfully!`,
          isRtl ? 'تم الحفظ' : 'Brand Saved'
        );
        setIsEditModalOpen(false);
        setEditingBrand(null);
        fetchBrands();
      } else {
        toast.error(
          data.message || (isRtl ? 'تعذر حفظ تعديلات البراند' : 'Failed to update brand'),
          isRtl ? 'خطأ' : 'Error'
        );
      }
    } catch (err) {
      console.error('Error saving brand changes:', err);
      toast.error(
        isRtl ? 'حدث خطأ أثناء الاتصال بالخادم' : 'Server connection error',
        isRtl ? 'خطأ' : 'Error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (brand) => {
    setBrandToDelete(brand);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!brandToDelete) return;

    try {
      setActionLoading(true);
      const token = await ensureAuthToken();
      const apiHost =
        typeof window !== 'undefined' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1'
          ? `http://${window.location.hostname}:5000`
          : 'http://localhost:5000';

      const res = await fetch(`${apiHost}/api/v1/catalog/brands/${brandToDelete.id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      let data = {};
      try {
        data = await res.json();
      } catch (parseErr) {
        console.error('Failed to parse response JSON:', parseErr);
      }

      if (res.ok && data.success) {
        toast.success(
          isRtl ? `تم حذف العلامة التجارية "${brandToDelete.name_ar}" بنجاح` : `Brand "${brandToDelete.name_en}" deleted successfully`,
          isRtl ? 'حذف براند' : 'Brand Deleted'
        );
        setIsDeleteModalOpen(false);
        setBrandToDelete(null);
        setBrands((prev) => prev.filter((b) => b.id !== brandToDelete.id));
      } else {
        toast.error(
          data.message || (isRtl ? 'تعذر حذف العلامة التجارية' : 'Failed to delete brand'),
          isRtl ? 'خطأ بالحذف' : 'Delete Error'
        );
      }
    } catch (err) {
      console.error('Error deleting brand:', err);
      toast.error(
        isRtl ? 'حدث خطأ غير متوقع أثناء الحذف' : 'Unexpected error during delete',
        isRtl ? 'خطأ' : 'Error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="admin-brands-page" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <AdminSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        lang={lang}
      />

      {/* Main Content Area */}
      <div className={`admin-main-wrapper ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Header */}
        <AdminHeader
          adminUser={adminUser}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          isSidebarCollapsed={sidebarCollapsed}
          lang={lang}
          onToggleLanguage={(newLang) => setLang(newLang)}
        />

        <div className="brands-main-container">
          {/* Breadcrumbs */}
          <div className="brands-breadcrumbs">
            <Link href="/admin">{isRtl ? 'لوحة التحكم' : 'Dashboard'}</Link>
            <span className="crumb-sep">/</span>
            <Link href="/admin/tags">{isRtl ? 'وسوم الربط والعلامات' : 'Tags & Brands'}</Link>
            <span className="crumb-sep">/</span>
            <span className="current-crumb">{isRtl ? 'إدارة البراندات' : 'Brands Management'}</span>
          </div>

          {/* Page Title & Actions */}
          <div className="brands-header-bar">
            <div className="header-title-box">
              <h1>
                <div className="brand-icon-pill">
                  <FaCopyright />
                </div>
                <span>{isRtl ? 'إدارة العلامات التجارية (البراندات)' : 'Brands Management'}</span>
              </h1>
              <p>
                {isRtl
                  ? 'عرض وتعديل وحذف البراندات المعتمدة في المتجر مع ضبط الشعار والترتيب وحالة الظهور'
                  : 'Manage store brands, customize logos, update details, or remove brands.'}
              </p>
            </div>

            <div className="header-actions-cluster">
              <button
                type="button"
                className="btn-refresh-brands"
                onClick={fetchBrands}
                title={isRtl ? 'تحديث البيانات' : 'Refresh Data'}
              >
                <FaRotate className={loading ? 'fa-spin' : ''} />
              </button>

              <Link href="/admin/brands/add" className="btn-add-brand">
                <FaPlus />
                <span>{isRtl ? 'إضافة براند جديد' : 'Add New Brand'}</span>
              </Link>
            </div>
          </div>

          {/* Stats Cards Grid */}
          <div className="brands-stats-grid">
            <AdminStatsCard
              title={isRtl ? 'إجمالي العلامات' : 'Total Brands'}
              value={stats.total}
              icon={<FaCopyright />}
              variant="default"
              description={isRtl ? 'جميع البراندات المسجلة' : 'All registered brands'}
            />
            <AdminStatsCard
              title={isRtl ? 'العلامات النشطة' : 'Active Brands'}
              value={stats.active}
              icon={<FaCheck />}
              variant="success"
              description={isRtl ? 'تظهر للعملاء في المتجر' : 'Visible in storefront'}
            />
            <AdminStatsCard
              title={isRtl ? 'العلامات المميزة' : 'Featured Brands'}
              value={stats.featured}
              icon={<FaStar />}
              variant="warning"
              description={isRtl ? 'معروضة في الصفحة الرئيسية' : 'Highlighted on homepage'}
            />
            <AdminStatsCard
              title={isRtl ? 'المنتجات المرتبطة' : 'Mapped Products'}
              value={stats.totalProducts}
              icon={<FaBox />}
              variant="info"
              description={isRtl ? 'إجمالي المنتجات التابعة للبراندات' : 'Products under all brands'}
            />
          </div>

          {/* Controls & Search Card */}
          <div className="brands-controls-card">
            <div className="search-filter-cluster">
              {/* Search Bar */}
              <div className="search-input-wrap">
                <FaMagnifyingGlass className="search-icon" />
                <input
                  type="text"
                  placeholder={isRtl ? 'ابحث باسم البراند (عربي أو إنجليزي) أو الرابط...' : 'Search brand by name or slug...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="filter-tabs-pills">
                <button
                  type="button"
                  className={`filter-pill ${statusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  {isRtl ? 'الكل' : 'All'} ({stats.total})
                </button>
                <button
                  type="button"
                  className={`filter-pill ${statusFilter === 'active' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('active')}
                >
                  {isRtl ? 'نشط' : 'Active'} ({stats.active})
                </button>
                <button
                  type="button"
                  className={`filter-pill ${statusFilter === 'featured' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('featured')}
                >
                  {isRtl ? 'مميز' : 'Featured'} ({stats.featured})
                </button>
                <button
                  type="button"
                  className={`filter-pill ${statusFilter === 'inactive' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('inactive')}
                >
                  {isRtl ? 'معطل' : 'Inactive'} ({stats.total - stats.active})
                </button>
              </div>
            </div>

            <div className="controls-meta-info">
              <span>{isRtl ? 'المعروض:' : 'Showing:'} </span>
              <span className="highlight-count">{filteredBrands.length}</span>
              <span> {isRtl ? 'علامة تجارية' : 'brands'}</span>
            </div>
          </div>

          {/* Brands Table Card */}
          <div className="brands-table-card">
            {loading ? (
              <div className="empty-brands-container">
                <FaRotate className="fa-spin" style={{ fontSize: '32px', color: 'var(--main-color)' }} />
                <p>{isRtl ? 'جاري تحميل بيانات العلامات التجارية...' : 'Loading brands...'}</p>
              </div>
            ) : filteredBrands.length === 0 ? (
              <div className="empty-brands-container">
                <div className="empty-icon-wrap">
                  <FaCopyright />
                </div>
                <h3>{isRtl ? 'لم يتم العثور على علامات تجارية' : 'No brands found'}</h3>
                <p>
                  {searchTerm
                    ? isRtl
                      ? `لا توجد نتائج تطابق بحثك عن "${searchTerm}". جرب مصطلح بحث آخر.`
                      : `No results matching "${searchTerm}". Try another term.`
                    : isRtl
                    ? 'لم تقم بإضافة أي براند بعد. ابدأ بإضافة أول براند الآن!'
                    : 'No brands added yet. Start by adding your first brand!'}
                </p>
                {!searchTerm && (
                  <Link href="/admin/brands/add" className="btn-add-brand" style={{ marginTop: '12px' }}>
                    <FaPlus />
                    <span>{isRtl ? 'إضافة براند جديد' : 'Add Brand'}</span>
                  </Link>
                )}
              </div>
            ) : (
              <div className="table-responsive-wrapper">
                <table className="brands-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>{isRtl ? 'الشعار' : 'Logo'}</th>
                      <th>{isRtl ? 'اسم البراند' : 'Brand Name'}</th>
                      <th>{isRtl ? 'الرابط (Slug)' : 'Slug'}</th>
                      <th>{isRtl ? 'المنتجات' : 'Products'}</th>
                      <th>{isRtl ? 'الحالة' : 'Status'}</th>
                      <th>{isRtl ? 'مميز' : 'Featured'}</th>
                      <th>{isRtl ? 'الترتيب' : 'Sort Order'}</th>
                      <th style={{ width: '110px' }}>{isRtl ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBrands.map((brand) => (
                      <tr key={brand.id}>
                        {/* Logo Thumbnail */}
                        <td className="brand-logo-cell">
                          <div className="logo-box">
                            {brand.logo_url ? (
                              <img
                                src={brand.logo_url}
                                alt={brand.name_en || brand.name_ar}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                                }}
                              />
                            ) : null}
                            <FaCopyright
                              className="fallback-logo-icon"
                              style={{ display: brand.logo_url ? 'none' : 'block' }}
                            />
                          </div>
                        </td>

                        {/* Name (AR & EN) */}
                        <td>
                          <div className="brand-names-box">
                            <span className="brand-ar-name">{brand.name_ar}</span>
                            <span className="brand-en-name">{brand.name_en}</span>
                          </div>
                        </td>

                        {/* Slug */}
                        <td>
                          <span className="slug-badge">/{brand.slug}</span>
                        </td>

                        {/* Products count */}
                        <td>
                          <Link href={`/admin/products?brand=${brand.id}`} className="products-count-badge">
                            <FaBox size={11} />
                            <span>{brand.products_count || 0} {isRtl ? 'منتج' : 'items'}</span>
                          </Link>
                        </td>

                        {/* Status Toggle */}
                        <td>
                          <button
                            type="button"
                            className={`status-toggle-btn ${brand.is_active ? 'is-active' : 'is-inactive'}`}
                            onClick={() => handleToggleActive(brand)}
                            title={isRtl ? 'اضغط للتبديل السريع' : 'Click to toggle'}
                          >
                            <span className="dot">●</span>
                            <span>{brand.is_active ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'معطل' : 'Inactive')}</span>
                          </button>
                        </td>

                        {/* Featured Toggle */}
                        <td>
                          <button
                            type="button"
                            className={`featured-toggle-btn ${brand.is_featured ? 'is-featured' : ''}`}
                            onClick={() => handleToggleFeatured(brand)}
                            title={brand.is_featured ? (isRtl ? 'براند مميز' : 'Featured') : (isRtl ? 'غير مميز' : 'Not featured')}
                          >
                            <FaStar />
                          </button>
                        </td>

                        {/* Sort Order */}
                        <td style={{ fontWeight: '700', color: '#475569' }}>
                          #{brand.sort_order ?? 0}
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="actions-buttons-cell">
                            <button
                              type="button"
                              className="btn-action btn-edit"
                              onClick={() => handleOpenEdit(brand)}
                              title={isRtl ? 'تعديل البراند' : 'Edit Brand'}
                            >
                              <FaPenToSquare />
                            </button>
                            <button
                              type="button"
                              className="btn-action btn-delete"
                              onClick={() => handleOpenDelete(brand)}
                              title={isRtl ? 'حذف البراند' : 'Delete Brand'}
                            >
                              <FaTrashCan />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          EDIT BRAND MODAL
          ======================================================== */}
      {isEditModalOpen && (
        <AdminModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={isRtl ? `تعديل البراند: ${editingBrand?.name_ar || ''}` : `Edit Brand: ${editingBrand?.name_en || ''}`}
          size="lg"
        >
          <form className="edit-brand-form" onSubmit={handleSaveEdit}>
            {/* Arabic & English Names */}
            <div className="form-group-row">
              <div className="form-group">
                <label>
                  <span className="required-star">*</span>
                  <span>{isRtl ? 'اسم البراند بالعربية' : 'Brand Name (Arabic)'}</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name_ar}
                  onChange={(e) => setEditForm({ ...editForm, name_ar: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>
                  <span className="required-star">*</span>
                  <span>{isRtl ? 'اسم البراند بالإنجليزية' : 'Brand Name (English)'}</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name_en}
                  onChange={(e) => setEditForm({ ...editForm, name_en: e.target.value })}
                />
              </div>
            </div>

            {/* Slug & Website */}
            <div className="form-group-row">
              <div className="form-group">
                <label>{isRtl ? 'الرابط الفرعي (Slug)' : 'URL Slug'}</label>
                <input
                  type="text"
                  value={editForm.slug}
                  onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>{isRtl ? 'الموقع الرسمي للعلامة التجارية' : 'Official Website URL'}</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={editForm.website_url}
                  onChange={(e) => setEditForm({ ...editForm, website_url: e.target.value })}
                />
              </div>
            </div>

            {/* Logo Uploader (formatFactory WebP 80%) */}
            <div className="form-group">
              <label>
                <span className="required-star">*</span>
                <span>{isRtl ? 'شعار البراند (Logo) - WebP 80%' : 'Brand Logo'}</span>
              </label>

              <div className="modal-logo-uploader">
                <div className="current-logo-preview">
                  {editLogoPreview ? (
                    <img src={editLogoPreview} alt="Logo" />
                  ) : (
                    <FaCopyright size={26} color="#94a3b8" />
                  )}
                </div>

                <div className="logo-upload-info">
                  <input
                    type="file"
                    ref={editLogoInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleEditLogoSelect}
                  />
                  <button
                    type="button"
                    className="btn-change-logo"
                    disabled={editLogoUploading}
                    onClick={() => editLogoInputRef.current?.click()}
                  >
                    <FaCloudArrowUp />
                    <span>
                      {editLogoUploading
                        ? (isRtl ? 'جاري المعالجة...' : 'Compressing...')
                        : (isRtl ? 'تغيير الشعار' : 'Change Logo')}
                    </span>
                  </button>
                  <span className="upload-hint">
                    {isRtl
                      ? 'يتم ضغط الشعار تلقائياً بتقنية WebP 80% لتوفير أعلى سرعة تحميل.'
                      : 'Automatically optimized via WebP 80% for fastest performance.'}
                  </span>
                </div>
              </div>
            </div>

            {/* Descriptions */}
            <div className="form-group-row">
              <div className="form-group">
                <label>{isRtl ? 'نبذة عن البراند (عربي)' : 'Description (Arabic)'}</label>
                <textarea
                  value={editForm.description_ar}
                  onChange={(e) => setEditForm({ ...editForm, description_ar: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>{isRtl ? 'نبذة عن البراند (إنجليزي)' : 'Description (English)'}</label>
                <textarea
                  value={editForm.description_en}
                  onChange={(e) => setEditForm({ ...editForm, description_en: e.target.value })}
                />
              </div>
            </div>

            {/* Sort Order & Switches */}
            <div className="form-group-row" style={{ alignItems: 'center' }}>
              <div className="form-group">
                <label>{isRtl ? 'ترتيب الظهور' : 'Sort Order'}</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.sort_order}
                  onChange={(e) => setEditForm({ ...editForm, sort_order: Number(e.target.value) })}
                />
              </div>

              <div className="switches-dual-row" style={{ height: 'fit-content', marginTop: '18px' }}>
                <label className="switch-item">
                  <input
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  />
                  <span>{isRtl ? 'براند نشط' : 'Active'}</span>
                </label>

                <label className="switch-item">
                  <input
                    type="checkbox"
                    checked={editForm.is_featured}
                    onChange={(e) => setEditForm({ ...editForm, is_featured: e.target.checked })}
                  />
                  <span>{isRtl ? 'براند مميز (Featured)' : 'Featured'}</span>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="modal-footer-buttons">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setIsEditModalOpen(false)}
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="submit"
                className="btn-save-changes"
                disabled={actionLoading || editLogoUploading}
              >
                <FaCheck />
                <span>
                  {actionLoading
                    ? (isRtl ? 'جاري الحفظ...' : 'Saving...')
                    : (isRtl ? 'حفظ التعديلات' : 'Save Changes')}
                </span>
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* ========================================================
          DELETE BRAND MODAL
          ======================================================== */}
      {isDeleteModalOpen && (
        <AdminModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title={isRtl ? 'تأكيد حذف العلامة التجارية' : 'Confirm Brand Deletion'}
          size="sm"
        >
          <div className="delete-brand-modal-content">
            <div className="delete-warning-icon">
              <FaTriangleExclamation />
            </div>

            <h4>{isRtl ? 'هل أنت متأكد من حذف هذا البراند؟' : 'Are you sure you want to delete this brand?'}</h4>

            <div className="brand-delete-card-preview">
              {brandToDelete?.logo_url && (
                <img src={brandToDelete.logo_url} alt="Logo Preview" />
              )}
              <span className="delete-preview-name">{brandToDelete?.name_ar} ({brandToDelete?.name_en})</span>
            </div>

            <p>
              {brandToDelete?.products_count > 0
                ? (isRtl
                  ? `تنبيه: يوجد ${brandToDelete.products_count} منتج مرتبط بهذا البراند. عند الحذف سيتم فك ارتباط المنتجات تلقائياً لتظل موجودة في الكتالوج بدون براند.`
                  : `Notice: There are ${brandToDelete.products_count} products assigned to this brand. They will be unlinked safely.`)
                : (isRtl
                  ? 'هذا الإجراء سيقوم بحذف البراند نهائياً من قاعدة البيانات ولا يمكن التراجع عنه.'
                  : 'This action will permanently remove the brand from the database.')}
            </p>

            <div className="delete-actions-row">
              <button
                type="button"
                className="btn-cancel-delete"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="button"
                className="btn-confirm-delete"
                disabled={actionLoading}
                onClick={handleConfirmDelete}
              >
                <FaTrashCan />
                <span>
                  {actionLoading
                    ? (isRtl ? 'جاري الحذف...' : 'Deleting...')
                    : (isRtl ? 'تأكيد الحذف النهائي' : 'Confirm Delete')}
                </span>
              </button>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
