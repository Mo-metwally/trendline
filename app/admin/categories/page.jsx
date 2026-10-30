'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getApiHost } from '@/src/utils/apiConfig';
import {
  AdminSidebar,
  AdminHeader,
  AdminStatsCard,
  AdminDataTable,
  AdminStatusBadge,
  AdminModal,
  CustomSelect,
} from '@/src/components/adminComponents';
import {
  FaFolderTree,
  FaFolder,
  FaTag,
  FaStar,
  FaCheck,
  FaEye,
  FaChevronDown,
  FaChevronUp,
  FaArrowUpRightFromSquare,
  FaPenToSquare,
  FaTrashCan,
  FaPowerOff,
  FaLayerGroup,
  FaBoxesStacked,
} from 'react-icons/fa6';
import './Categories.scss';

function renderCategoryIcon(iconUrl) {
  if (!iconUrl || !iconUrl.trim()) {
    return <FaFolder style={{ color: 'var(--main-color)' }} />;
  }
  const clean = iconUrl.trim();
  // 1. Raw SVG Code (Font Awesome, Lucide, Custom SVG)
  if (clean.startsWith('<svg') || clean.includes('<path')) {
    return (
      <div
        className="category-svg-wrapper"
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    );
  }
  // 2. Image URL or Static Path
  if (clean.startsWith('http') || clean.startsWith('/') || clean.startsWith('data:image')) {
    return (
      <div className="category-img-icon-wrap">
        <img
          src={clean}
          alt="Icon"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'inline-block';
          }}
        />
        <span className="icon-fallback" style={{ display: 'none' }}><FaFolder style={{ color: 'var(--main-color)' }} /></span>
      </div>
    );
  }
  // 3. Fallback text
  return <span>{clean}</span>;
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [adminUser, setAdminUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lang, setLang] = useState('ar');

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all | main | sub | home_grid | inactive
  const [viewMode, setViewMode] = useState('table'); // table | tree

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    slug: '',
    parent_id: '',
    starting_price: '',
    sort_order: 0,
    show_in_home_grid: false,
    icon_url: '',
    image_url: '',
    description_ar: '',
    description_en: '',
    tag_ids: [],
  });

  const [modalIconMode, setModalIconMode] = useState('svg');
  const isRtl = lang === 'ar';

  const filterTypeOptions = useMemo(() => [
    { value: 'all', label: isRtl ? 'جميع الأقسام' : 'All Categories', icon: <FaFolderTree /> },
    { value: 'main', label: isRtl ? 'الأقسام الرئيسية فقط' : 'Main Only', icon: <FaFolder /> },
    { value: 'sub', label: isRtl ? 'الأقسام الفرعية فقط' : 'Subcategories Only', icon: <FaFolder /> },
    { value: 'home_grid', label: isRtl ? 'المعروضة بالرئيسية' : 'Home Grid Only', icon: <FaStar /> },
    { value: 'inactive', label: isRtl ? 'المعطلة (غير النشطة)' : 'Inactive Only', icon: <FaEye /> },
  ], [isRtl]);

  const modalParentOptions = useMemo(() => [
    { value: '', label: isRtl ? '— قسم رئيسي مستقل (Root Category) —' : '— Root Main Category —' },
    ...categories
      .filter((c) => !editingCategory || String(c.id) !== String(editingCategory.id))
      .filter((c) => !c.parent_id)
      .map((cat) => ({
        value: String(cat.id),
        label: isRtl ? `${cat.name_ar} (${cat.name_en})` : cat.name_en,
        icon_url: cat.icon_url,
        image_url: cat.image_url,
        idBadge: cat.id,
        badge: `/${cat.slug}`,
      })),
  ], [categories, editingCategory, isRtl]);

  // Ensure Auth Token helper
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
        setAdminUser(JSON.parse(localUser));
      } catch (e) {
        console.error(e);
      }
    } else if (session?.user) {
      setAdminUser(session.user);
    } else {
      setAdminUser({ name: 'Ahmed Sayed', email: 'ahmed.sayed@trendlineeg.com', role: 'SUPER_ADMIN' });
    }
  }, [session, status, router]);

  // Fetch Categories & Tags from Backend API
  const fetchData = async () => {
    try {
      setLoading(true);
      const apiHost = getApiHost();

      const [catRes, tagRes] = await Promise.all([
        fetch(`${apiHost}/api/v1/catalog/categories`, { cache: 'no-store' }),
        fetch(`${apiHost}/api/v1/catalog/tags`, { cache: 'no-store' }),
      ]);

      if (catRes.ok) {
        const catJson = await catRes.json();
        if (catJson.success) setCategories(catJson.data || []);
      }
      if (tagRes.ok) {
        const tagJson = await tagRes.json();
        if (tagJson.success) setTags(tagJson.data || []);
      }
    } catch (err) {
      console.error('Failed to load categories/tags:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Categories
  const filteredCategories = useMemo(() => {
    let result = [...categories];

    if (filterType === 'main') {
      result = result.filter((c) => !c.parent_id);
    } else if (filterType === 'sub') {
      result = result.filter((c) => !!c.parent_id);
    } else if (filterType === 'home_grid') {
      result = result.filter((c) => c.show_in_home_grid);
    } else if (filterType === 'inactive') {
      result = result.filter((c) => !c.is_active);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          (c.name_ar && c.name_ar.toLowerCase().includes(term)) ||
          (c.name_en && c.name_en.toLowerCase().includes(term)) ||
          (c.slug && c.slug.toLowerCase().includes(term)) ||
          (c.tags && c.tags.some((t) => t.name_ar?.includes(term) || t.name_en?.toLowerCase().includes(term)))
      );
    }

    return result;
  }, [categories, filterType, searchTerm]);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = categories.length;
    const main = categories.filter((c) => !c.parent_id).length;
    const sub = categories.filter((c) => !!c.parent_id).length;
    const homeGrid = categories.filter((c) => c.show_in_home_grid).length;
    return { total, main, sub, homeGrid };
  }, [categories]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name_ar: '',
      name_en: '',
      slug: '',
      parent_id: '',
      starting_price: '',
      sort_order: 0,
      show_in_home_grid: false,
      icon_url: '',
      image_url: '',
      description_ar: '',
      description_en: '',
      tag_ids: [],
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name_ar: cat.name_ar || '',
      name_en: cat.name_en || '',
      slug: cat.slug || '',
      parent_id: cat.parent_id ? String(cat.parent_id) : '',
      starting_price: cat.starting_price || '',
      sort_order: cat.sort_order || 0,
      show_in_home_grid: !!cat.show_in_home_grid,
      icon_url: cat.icon_url || '',
      image_url: cat.image_url || '',
      description_ar: cat.description_ar || '',
      description_en: cat.description_en || '',
      tag_ids: cat.tags ? cat.tags.map((t) => (typeof t === 'object' ? t.id : t)) : [],
    });
    setIsModalOpen(true);
  };

  // Auto generate slug from english name
  const handleNameEnChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name_en: val,
      slug: !editingCategory ? val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : prev.slug,
    }));
  };

  // Tag chip toggle
  const toggleTagSelection = (tagId) => {
    setFormData((prev) => {
      const exists = prev.tag_ids.includes(tagId);
      return {
        ...prev,
        tag_ids: exists ? prev.tag_ids.filter((id) => id !== tagId) : [...prev.tag_ids, tagId],
      };
    });
  };

  // Save Category (Create or Update)
  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    if (!formData.name_ar.trim() || !formData.name_en.trim() || !formData.slug.trim()) {
      alert(isRtl ? 'يرجى ملء جميع الحقول المطلوبة (الاسم بالعربية والإنجليزية والـ Slug)' : 'Please fill all required fields');
      return;
    }

    try {
      setActionLoading(true);
      const apiHost = getApiHost();

      const token = await ensureAuthToken();
      const url = editingCategory
        ? `${apiHost}/api/v1/catalog/categories/${editingCategory.id}`
        : `${apiHost}/api/v1/catalog/categories`;
      const method = editingCategory ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        parent_id: formData.parent_id ? Number(formData.parent_id) : null,
        starting_price: formData.starting_price ? Number(formData.starting_price) : null,
        sort_order: Number(formData.sort_order) || 0,
      };

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Operation failed');
      }

      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Active Status
  const handleToggleStatus = async (cat) => {
    try {
      const apiHost = getApiHost();

      const token = await ensureAuthToken();
      const res = await fetch(`${apiHost}/api/v1/catalog/categories/${cat.id}/toggle`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setCategories((prev) =>
          prev.map((c) => (c.id === cat.id ? { ...c, is_active: !c.is_active } : c))
        );
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  // Delete Category
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      setActionLoading(true);
      const apiHost = getApiHost();

      const token = await ensureAuthToken();
      const res = await fetch(`${apiHost}/api/v1/catalog/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setCategoryToDelete(null);
        await fetchData();
      } else {
        const d = await res.json();
        alert(d.message || 'Failed to delete');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting category');
    } finally {
      setActionLoading(false);
    }
  };

  // Hierarchy Tree structure for Tree View & Subcategory Lookup
  const mainCategoriesWithSubs = useMemo(() => {
    const mains = categories.filter((c) => !c.parent_id);
    return mains.map((main) => ({
      ...main,
      subs: categories.filter((c) => String(c.parent_id) === String(main.id)),
    }));
  }, [categories]);

  // Collapsible Row State & Pagination for Smart 2-Row Table
  const [expandedRowIds, setExpandedRowIds] = useState([]);
  const [collapsedTreeIds, setCollapsedTreeIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage) || 1;
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCategories.slice(start, start + itemsPerPage);
  }, [filteredCategories, currentPage, itemsPerPage]);

  const toggleExpandRow = (id) => {
    const key = String(id);
    setExpandedRowIds((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const toggleExpandAllRows = () => {
    const pageKeys = paginatedCategories.map((c) => String(c.id));
    const allExpanded = pageKeys.length > 0 && pageKeys.every((k) => expandedRowIds.includes(k));
    if (allExpanded) {
      setExpandedRowIds((prev) => prev.filter((k) => !pageKeys.includes(k)));
    } else {
      setExpandedRowIds((prev) => Array.from(new Set([...prev, ...pageKeys])));
    }
  };

  const toggleTreeBranch = (id) => {
    const key = String(id);
    setCollapsedTreeIds((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const allCurrentPageExpanded =
    paginatedCategories.length > 0 &&
    paginatedCategories.every((c) => expandedRowIds.includes(String(c.id)));

  return (
    <div className="categories-page-layout" dir={isRtl ? 'rtl' : 'ltr'} suppressHydrationWarning>
      {/* 1. Sidebar */}
      <AdminSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        lang={lang}
      />

      {/* Main Wrapper */}
      <div className={`categories-main-wrapper ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* 2. Header */}
        <AdminHeader
          adminUser={adminUser}
          lang={lang}
          onToggleLanguage={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          isSidebarCollapsed={sidebarCollapsed}
          notificationCount={2}
        />

        {/* Content Body */}
        <main className="categories-content-body">
          {/* Header Card */}
          <div className="categories-header-card">
            <div className="header-text">
              <h1>{isRtl ? 'إدارة الأقسام والتصنيفات الذكية' : 'Smart Categories & Taxonomies'}</h1>
              <p>
                {isRtl
                  ? 'هيكلة الأقسام الرئيسية والفرعية وقواعد الربط التلقائي بالوسوم (Hybrid Tag-to-Category Integration)'
                  : 'Manage hierarchical categories and automated tag linking rules for lightning-fast catalog browsing'}
              </p>
            </div>

            <div className="header-actions">
              <Link href="/admin/categories/add" className="btn-add-category">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>{isRtl ? 'إضافة قسم جديد' : 'Add New Category'}</span>
              </Link>
            </div>
          </div>

          {/* KPI Overview */}
          <div className="categories-kpi-grid">
            <AdminStatsCard
              title={isRtl ? 'إجمالي الأقسام' : 'Total Categories'}
              value={stats.total}
              trend={isRtl ? 'نشط' : 'Active'}
              trendDirection="up"
              trendLabel={isRtl ? 'في قاعدة البيانات' : 'In PostgreSQL'}
              colorScheme="primary"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
              }
            />

            <AdminStatsCard
              title={isRtl ? 'الأقسام الرئيسية' : 'Main Categories'}
              value={stats.main}
              trend="Level 1"
              trendDirection="up"
              trendLabel={isRtl ? 'أقسام بدون أب' : 'Root categories'}
              colorScheme="success"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                  <polyline points="2 17 12 22 22 17"></polyline>
                  <polyline points="2 12 12 17 22 12"></polyline>
                </svg>
              }
            />

            <AdminStatsCard
              title={isRtl ? 'الأقسام الفرعية' : 'Subcategories'}
              value={stats.sub}
              trend="Level 2"
              trendDirection="neutral"
              trendLabel={isRtl ? 'متفرعة من أقسام أخرى' : 'Nested branches'}
              colorScheme="warning"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              }
            />

            <AdminStatsCard
              title={isRtl ? 'معروض في شبكة الرئيسية' : 'Home Grid Display'}
              value={stats.homeGrid}
              trend={isRtl ? 'الصفحة الأولى' : 'Homepage'}
              trendDirection="up"
              trendLabel={isRtl ? 'بطاقات استعراض سريعة' : 'Visual cards'}
              colorScheme="purple"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              }
            />
          </div>

          {/* Toolbar and Filter Card */}
          <div className="categories-toolbar-card">
            <div className="toolbar-search">
              <span className="search-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </span>
              <input
                type="text"
                placeholder={isRtl ? 'بحث باسم القسم، الرابط أو الوسم المرتبط...' : 'Search category name, slug or tag...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="toolbar-filters">
              <div style={{ width: '220px' }}>
                <CustomSelect
                  value={filterType}
                  onChange={(val) => setFilterType(val)}
                  options={filterTypeOptions}
                  isRtl={isRtl}
                />
              </div>

              <div className="view-toggle-btns">
                <button
                  type="button"
                  className={viewMode === 'table' ? 'active' : ''}
                  onClick={() => setViewMode('table')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                  <span>{isRtl ? 'جدول تفاعلي' : 'Table'}</span>
                </button>
                <button
                  type="button"
                  className={viewMode === 'tree' ? 'active' : ''}
                  onClick={() => setViewMode('tree')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="8" width="7" height="7"></rect>
                    <rect x="14" y="17" width="7" height="7"></rect>
                    <path d="M10 6.5h2a2 2 0 0 1 2 2V20.5"></path>
                  </svg>
                  <span>{isRtl ? 'شجري' : 'Hierarchy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content: Smart Collapsible 2-Row Table vs Collapsible Tree View */}
          {viewMode === 'table' ? (
            <div className="smart-categories-table-card">
              {/* Table Top Bar */}
              <div className="smart-table-header">
                <div className="header-left-title">
                  <h3>{isRtl ? 'قائمة الأقسام والتصنيفات' : 'Categories Directory'}</h3>
                  <span className="count-pill">
                    {filteredCategories.length} {isRtl ? 'قسم' : 'items'}
                  </span>
                </div>

                <div className="header-right-controls">
                  <button
                    type="button"
                    className={`btn-expand-all-toggle ${allCurrentPageExpanded ? 'active' : ''}`}
                    onClick={toggleExpandAllRows}
                  >
                    {allCurrentPageExpanded ? <FaChevronUp /> : <FaChevronDown />}
                    <span>
                      {allCurrentPageExpanded
                        ? isRtl
                          ? 'طي جميع التفاصيل'
                          : 'Collapse All Details'
                        : isRtl
                        ? 'توسيع كل الصفوف (عرض صفين)'
                        : 'Expand All Rows'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Responsive Table */}
              <div className="smart-table-scroll">
                <table className="smart-cats-table">
                  <thead>
                    <tr>
                      <th style={{ width: '30%' }}>{isRtl ? 'القسم والهوية' : 'Category & Identity'}</th>
                      <th style={{ width: '17%' }}>{isRtl ? 'المستوى والتفرع' : 'Hierarchy Level'}</th>
                      <th style={{ width: '16%' }}>{isRtl ? 'التسعير والظهور' : 'Price & Display'}</th>
                      <th style={{ width: '17%' }}>{isRtl ? 'المنتجات والوسوم' : 'Products & Tags'}</th>
                      <th style={{ width: '8%' }}>{isRtl ? 'الحالة' : 'Status'}</th>
                      <th style={{ width: '12%' }}>{isRtl ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCategories.length > 0 ? (
                      paginatedCategories.map((row) => {
                        const isExpanded = expandedRowIds.includes(String(row.id));
                        const childSubs = categories.filter(
                          (c) => String(c.parent_id) === String(row.id)
                        );
                        const parentObj = row.parent_id
                          ? row.parent || categories.find((c) => String(c.id) === String(row.parent_id))
                          : null;
                        const rowTags = Array.isArray(row.tags) ? row.tags : [];

                        return (
                          <Fragment key={row.id}>
                            {/* Primary Row (2-line structured cells) */}
                            <tr className={`cat-primary-row ${isExpanded ? 'is-expanded' : ''} ${!row.is_active ? 'is-inactive' : ''}`}>
                              {/* 1. Category Identity (Image + Icon + AR/EN Names + Storefront Slug Link) */}
                              <td>
                                <div className="cat-identity-cell">
                                  <div className="cat-media-cluster" onClick={() => toggleExpandRow(row.id)}>
                                    <div className="category-table-thumb-box" title={row.name_ar}>
                                      {row.image_url ? (
                                        <img
                                          src={row.image_url}
                                          alt={row.name_ar}
                                          className="cat-thumb-img"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                                          }}
                                        />
                                      ) : null}
                                      <div className="cat-thumb-placeholder" style={{ display: row.image_url ? 'none' : 'flex' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                          <polyline points="21 15 16 10 5 21"></polyline>
                                        </svg>
                                      </div>
                                    </div>
                                    <div className="category-icon-badge" title={isRtl ? 'رمز القسم' : 'Category Icon'}>
                                      {renderCategoryIcon(row.icon_url)}
                                    </div>
                                  </div>

                                  <div className="cat-identity-lines">
                                    <div className="line-1-titles">
                                      <span className="name-ar" onClick={() => toggleExpandRow(row.id)}>
                                        {row.name_ar}
                                      </span>
                                      <span className="cat-id-chip">#{row.id}</span>
                                    </div>
                                    <div className="line-2-meta">
                                      <span className="name-en">{row.name_en}</span>
                                      <span className="dot-sep">•</span>
                                      <Link
                                        href={`/categories/${encodeURIComponent(row.id)}/${encodeURIComponent(row.slug || row.id)}`}
                                        target="_blank"
                                        className="slug-store-link"
                                        title={isRtl ? 'فتح صفحة القسم في المتجر' : 'Open in Store'}
                                      >
                                        <code>/{row.slug}</code>
                                        <FaArrowUpRightFromSquare className="ext-ic" />
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* 2. Hierarchy Level & Subcategories Count (2 lines) */}
                              <td>
                                <div className="cat-hierarchy-cell">
                                  {!row.parent_id ? (
                                    <>
                                      <span className="parent-pill main">
                                        <FaStar className="star-ic" />
                                        {isRtl ? 'قسم رئيسي (Root)' : 'Main Root'}
                                      </span>
                                      <button
                                        type="button"
                                        className={`sub-branches-trigger ${childSubs.length > 0 ? 'has-subs' : ''}`}
                                        onClick={() => toggleExpandRow(row.id)}
                                      >
                                        <FaLayerGroup />
                                        <span>
                                          {childSubs.length > 0
                                            ? isRtl
                                              ? `${childSubs.length} أقسام فرعية تابعة`
                                              : `${childSubs.length} Subcategories`
                                            : isRtl
                                            ? 'بدون فروع تابعة'
                                            : 'No subcategories'}
                                        </span>
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <span className="parent-pill sub">
                                        {isRtl ? '↳ قسم فرعي (Level 2)' : '↳ Subcategory'}
                                      </span>
                                      <div className="parent-ref-line">
                                        <span>{isRtl ? 'تابع لـ:' : 'Parent:'}</span>
                                        <strong>{parentObj?.name_ar || parentObj?.name_en || `#${row.parent_id}`}</strong>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </td>

                              {/* 3. Pricing & Home Grid Display (2 lines) */}
                              <td>
                                <div className="cat-pricing-display-cell">
                                  <div className="price-line">
                                    <span className="lbl">{isRtl ? 'يبدأ من:' : 'From:'}</span>
                                    {row.starting_price ? (
                                      <strong className="price-val">
                                        {Number(row.starting_price).toLocaleString()} <small>ج.م</small>
                                      </strong>
                                    ) : (
                                      <span className="muted-dash">—</span>
                                    )}
                                  </div>
                                  <div className="display-badges-line">
                                    <span className={`home-grid-badge ${row.show_in_home_grid ? 'enabled' : 'disabled'}`}>
                                      {row.show_in_home_grid ? (
                                        <>
                                          <FaCheck /> {isRtl ? 'بالرئيسية' : 'Home Grid'}
                                        </>
                                      ) : (
                                        isRtl ? 'غير معروض بالهوم' : 'Hidden on Home'
                                      )}
                                    </span>
                                    <span className="sort-badge" title={isRtl ? 'ترتيب الظهور' : 'Sort Order'}>
                                      #{row.sort_order || 0}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* 4. Products Count & Auto-Linking Tags Preview (2 lines) */}
                              <td>
                                <div className="cat-products-tags-cell">
                                  <div className="products-count-line">
                                    <span className="prod-count-pill">
                                      <FaBoxesStacked />
                                      <strong>{row.products_count || 0}</strong>
                                      <span>{isRtl ? 'منتج' : 'Products'}</span>
                                    </span>
                                    {rowTags.length > 0 && (
                                      <span className="tags-count-hint">
                                        ({rowTags.length} {isRtl ? 'وسم' : 'tags'})
                                      </span>
                                    )}
                                  </div>

                                  <div className="tag-chips-preview" onClick={() => toggleExpandRow(row.id)}>
                                    {rowTags.length > 0 ? (
                                      <>
                                        {rowTags.slice(0, 2).map((t, idx) => (
                                          <span key={t.id || idx} className="rule-tag-chip" title={t.name_en}>
                                            #{isRtl ? t.name_ar || t.name_en : t.name_en || t.name_ar}
                                          </span>
                                        ))}
                                        {rowTags.length > 2 && (
                                          <span className="more-tags-chip">+{rowTags.length - 2}</span>
                                        )}
                                      </>
                                    ) : (
                                      <span className="no-tags">{isRtl ? 'بدون وسوم ربط' : 'No rule tags'}</span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* 5. Status */}
                              <td>
                                <AdminStatusBadge status={row.is_active ? 'ACTIVE' : 'INACTIVE'} lang={lang} />
                              </td>

                              {/* 6. Actions + Collapsible Drawer Trigger */}
                              <td>
                                <div className="action-buttons-group">
                                  <Link
                                    href={`/admin/categories/edit/${row.id}`}
                                    className="btn-edit"
                                    title={isRtl ? 'تعديل بيانات القسم' : 'Edit Category'}
                                  >
                                    <FaPenToSquare />
                                    <span>{isRtl ? 'تعديل' : 'Edit'}</span>
                                  </Link>

                                  <button
                                    type="button"
                                    className={`btn-toggle ${row.is_active ? 'is-on' : 'is-off'}`}
                                    onClick={() => handleToggleStatus(row)}
                                    title={row.is_active ? (isRtl ? 'تعطيل القسم' : 'Disable') : (isRtl ? 'تفعيل القسم' : 'Enable')}
                                  >
                                    <FaPowerOff />
                                    <span>{row.is_active ? (isRtl ? 'تعطيل' : 'Disable') : (isRtl ? 'تفعيل' : 'Enable')}</span>
                                  </button>

                                  <button
                                    type="button"
                                    className="btn-delete"
                                    onClick={() => setCategoryToDelete(row)}
                                    title={isRtl ? 'حذف القسم' : 'Delete'}
                                  >
                                    <FaTrashCan />
                                  </button>

                                  <button
                                    type="button"
                                    className={`btn-expand-row ${isExpanded ? 'expanded' : ''}`}
                                    onClick={() => toggleExpandRow(row.id)}
                                    title={isRtl ? 'عرض / إخفاء التفاصيل الكاملة' : 'Toggle Full Details'}
                                  >
                                    {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Secondary Collapsible Details Row */}
                            {isExpanded && (
                              <tr className="cat-detail-drawer-row">
                                <td colSpan={6}>
                                  <div className="cat-collapsible-panel">
                                    {/* Column 1: SEO & Metadata */}
                                    <div className="drawer-section seo-meta-box">
                                      <div className="drawer-sec-head">
                                        <FaFolder className="sec-ic" />
                                        <h4>{isRtl ? 'بيانات الوصف والـ SEO والروابط' : 'SEO Descriptions & URL'}</h4>
                                      </div>
                                      <div className="seo-descriptions-grid">
                                        <div className="desc-item">
                                          <span className="desc-lbl">{isRtl ? 'الوصف بالعربية:' : 'Arabic SEO:'}</span>
                                          <p>{row.description_ar || (isRtl ? 'لا يوجد وصف عربي مسجل لهذا القسم.' : 'No Arabic description.')}</p>
                                        </div>
                                        <div className="desc-item">
                                          <span className="desc-lbl">{isRtl ? 'الوصف بالإنجليزية:' : 'English SEO:'}</span>
                                          <p dir="ltr">{row.description_en || 'No English description provided.'}</p>
                                        </div>
                                      </div>
                                      <div className="drawer-quick-links">
                                        <Link
                                          href={`/categories/${encodeURIComponent(row.id)}/${encodeURIComponent(row.slug || row.id)}`}
                                          target="_blank"
                                          className="store-preview-pill"
                                        >
                                          <FaArrowUpRightFromSquare />
                                          <span>{isRtl ? 'معاينة القسم في المتجر' : 'View in Store'}</span>
                                          <code>/categories/{row.id}/{row.slug}</code>
                                        </Link>
                                      </div>
                                    </div>

                                    {/* Column 2: All Auto-Linking Rule Tags */}
                                    <div className="drawer-section tags-full-box">
                                      <div className="drawer-sec-head">
                                        <FaTag className="sec-ic purple" />
                                        <h4>
                                          {isRtl ? 'وسوم الربط التلقائي (Hybrid Rules)' : 'Auto-Linking Tags'}
                                          <span className="sec-count">{rowTags.length}</span>
                                        </h4>
                                      </div>
                                      {rowTags.length > 0 ? (
                                        <div className="drawer-tags-cloud">
                                          {rowTags.map((t, idx) => (
                                            <span key={t.id || idx} className="drawer-tag-pill">
                                              <strong>#{t.name_ar || t.name_en}</strong>
                                              {t.name_en && t.name_ar && <small>({t.name_en})</small>}
                                            </span>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="drawer-empty-note">
                                          {isRtl
                                            ? 'لا توجد وسوم مربوطة بهذا القسم حالياً. يمكنك إضافة وسوم من صفحة تعديل القسم.'
                                            : 'No rule tags linked to this category yet.'}
                                        </div>
                                      )}
                                    </div>

                                    {/* Column 3: Subcategories or Parent Info */}
                                    <div className="drawer-section hierarchy-full-box">
                                      <div className="drawer-sec-head">
                                        <FaFolderTree className="sec-ic teal" />
                                        <h4>
                                          {!row.parent_id
                                            ? isRtl
                                              ? 'الأقسام الفرعية التابعة'
                                              : 'Nested Subcategories'
                                            : isRtl
                                            ? 'بيانات القسم الرئيسي الأب'
                                            : 'Parent Category Info'}
                                          {!row.parent_id && <span className="sec-count">{childSubs.length}</span>}
                                        </h4>
                                      </div>

                                      {!row.parent_id ? (
                                        childSubs.length > 0 ? (
                                          <div className="drawer-subs-grid">
                                            {childSubs.map((sub) => (
                                              <div key={sub.id} className="drawer-sub-mini-card">
                                                <div className="sub-mini-info">
                                                  <div className="sub-mini-icon">
                                                    {renderCategoryIcon(sub.icon_url)}
                                                  </div>
                                                  <div className="sub-mini-text">
                                                    <strong>{sub.name_ar}</strong>
                                                    <span>/{sub.slug}</span>
                                                  </div>
                                                </div>
                                                <div className="sub-mini-actions">
                                                  {sub.starting_price && (
                                                    <span className="sub-price-tag">
                                                      {Number(sub.starting_price).toLocaleString()} ج.م
                                                    </span>
                                                  )}
                                                  <Link
                                                    href={`/admin/categories/edit/${sub.id}`}
                                                    className="sub-mini-edit-btn"
                                                    title={isRtl ? 'تعديل القسم الفرعي' : 'Edit Subcategory'}
                                                  >
                                                    <FaPenToSquare />
                                                    <span>{isRtl ? 'تعديل' : 'Edit'}</span>
                                                  </Link>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="drawer-empty-note">
                                            <span>{isRtl ? 'لا توجد أقسام فرعية تابعة لهذا القسم الرئيسي.' : 'No subcategories yet.'}</span>
                                            <Link href={`/admin/categories/edit/${row.id}`} className="add-sub-inline-link">
                                              {isRtl ? '+ إضافة فروع لهذا القسم' : '+ Add Subcategories'}
                                            </Link>
                                          </div>
                                        )
                                      ) : parentObj ? (
                                        <div className="drawer-sub-mini-card parent-highlight">
                                          <div className="sub-mini-info">
                                            <div className="sub-mini-icon">
                                              {renderCategoryIcon(parentObj.icon_url)}
                                            </div>
                                            <div className="sub-mini-text">
                                              <strong>⭐ {parentObj.name_ar}</strong>
                                              <span>/{parentObj.slug}</span>
                                            </div>
                                          </div>
                                          <Link
                                            href={`/admin/categories/edit/${parentObj.id}`}
                                            className="sub-mini-edit-btn"
                                          >
                                            <FaPenToSquare />
                                            <span>{isRtl ? 'تعديل الأب' : 'Edit Parent'}</span>
                                          </Link>
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6}>
                          <div className="smart-table-empty">
                            <FaFolderTree className="empty-ic" />
                            <h4>{isRtl ? 'لا توجد أقسام مطابقة للبحث' : 'No matching categories found'}</h4>
                            <p>{isRtl ? 'جرّب تغيير كلمات البحث أو الفلتر المختار أعلاه' : 'Try adjusting your search or filter criteria'}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              {totalPages > 1 && (
                <div className="smart-table-pagination">
                  <div className="page-info">
                    {isRtl
                      ? `عرض ${(currentPage - 1) * itemsPerPage + 1} إلى ${Math.min(currentPage * itemsPerPage, filteredCategories.length)} من أصل ${filteredCategories.length} قسم`
                      : `Showing ${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(currentPage * itemsPerPage, filteredCategories.length)} of ${filteredCategories.length}`}
                  </div>
                  <div className="page-buttons">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      {isRtl ? 'السابق' : 'Prev'}
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        className={currentPage === page ? 'active' : ''}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      {isRtl ? 'التالي' : 'Next'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="categories-tree-container">
              {mainCategoriesWithSubs.map((main) => {
                const isTreeCollapsed = collapsedTreeIds.includes(String(main.id));
                return (
                  <div key={main.id} className="tree-main-category">
                    <div className="tree-parent-row">
                      <div className="parent-info">
                        {main.subs && main.subs.length > 0 && (
                          <button
                            type="button"
                            className={`tree-collapse-btn ${isTreeCollapsed ? 'collapsed' : ''}`}
                            onClick={() => toggleTreeBranch(main.id)}
                            title={isRtl ? 'طي / توسيع الفروع' : 'Toggle Subcategories'}
                          >
                            {isTreeCollapsed ? <FaChevronDown /> : <FaChevronUp />}
                          </button>
                        )}
                        <div className="category-name-cell">
                          {main.image_url && (
                            <div className="tree-thumb-box" title={main.name_ar}>
                              <img src={main.image_url} alt={main.name_ar} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            </div>
                          )}
                          <div className="category-icon-box" title={isRtl ? 'أيقونة القسم' : 'Category Icon'}>
                            {renderCategoryIcon(main.icon_url)}
                          </div>
                          <div className="category-name-meta">
                            <span className="name-ar">⭐ {main.name_ar}</span>
                            <span className="name-en">{main.name_en} (/{main.slug})</span>
                          </div>
                        </div>
                        <span className="parent-pill main">
                          {isRtl ? `قسم رئيسي (${main.subs?.length || 0} فروع)` : `Root (${main.subs?.length || 0})`}
                        </span>
                        <AdminStatusBadge status={main.is_active ? 'ACTIVE' : 'INACTIVE'} lang={lang} />
                      </div>

                      <div className="action-buttons-group">
                        <Link href={`/admin/categories/edit/${main.id}`} className="btn-edit">
                          <FaPenToSquare />
                          <span>{isRtl ? 'تعديل' : 'Edit'}</span>
                        </Link>
                        <button type="button" className="btn-toggle" onClick={() => handleToggleStatus(main)}>
                          <FaPowerOff />
                          <span>{main.is_active ? (isRtl ? 'تعطيل' : 'Disable') : (isRtl ? 'تفعيل' : 'Enable')}</span>
                        </button>
                        <button type="button" className="btn-delete" onClick={() => setCategoryToDelete(main)}>
                          <FaTrashCan />
                        </button>
                      </div>
                    </div>

                    {main.subs && main.subs.length > 0 && !isTreeCollapsed && (
                      <div className="tree-subcategories-list">
                        {main.subs.map((sub) => (
                          <div key={sub.id} className="tree-sub-row">
                            <div className="category-name-cell">
                              <span style={{ color: '#94a3b8', fontWeight: 800 }}>↳</span>
                              {sub.image_url && (
                                <div className="tree-thumb-box" title={sub.name_ar}>
                                  <img src={sub.image_url} alt={sub.name_ar} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                </div>
                              )}
                              <div className="category-icon-box small" title={isRtl ? 'أيقونة الفرع' : 'Sub Icon'}>
                                {renderCategoryIcon(sub.icon_url)}
                              </div>
                              <div className="category-name-meta">
                                <span className="name-ar">{sub.name_ar}</span>
                                <span className="name-en">{sub.name_en} (/{sub.slug})</span>
                              </div>
                              <AdminStatusBadge status={sub.is_active ? 'ACTIVE' : 'INACTIVE'} lang={lang} />
                            </div>

                            <div className="action-buttons-group">
                              <Link href={`/admin/categories/edit/${sub.id}`} className="btn-edit">
                                <FaPenToSquare />
                                <span>{isRtl ? 'تعديل' : 'Edit'}</span>
                              </Link>
                              <button type="button" className="btn-toggle" onClick={() => handleToggleStatus(sub)}>
                                <FaPowerOff />
                                <span>{sub.is_active ? (isRtl ? 'تعطيل' : 'Disable') : (isRtl ? 'تفعيل' : 'Enable')}</span>
                              </button>
                              <button type="button" className="btn-delete" onClick={() => setCategoryToDelete(sub)}>
                                <FaTrashCan />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* 3. Create / Edit Category Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingCategory
            ? (isRtl ? `تعديل القسم: ${editingCategory.name_ar}` : `Edit Category: ${editingCategory.name_en}`)
            : (isRtl ? 'إضافة قسم أو تصنيف جديد' : 'Create New Category')
        }
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                background: '#f1f5f9',
                border: '1px solid var(--sec-color)',
                color: '#475569',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              form="categoryForm"
              disabled={actionLoading}
              style={{
                padding: '9px 24px',
                borderRadius: '10px',
                background: 'var(--main-color)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 12px var(--main-color-op)',
              }}
            >
              {actionLoading ? (isRtl ? 'جارٍ الحفظ...' : 'Saving...') : isRtl ? 'حفظ القسم' : 'Save Category'}
            </button>
          </div>
        }
      >
        <form id="categoryForm" onSubmit={handleSubmitCategory} className="category-modal-form">
          {/* Row 1: Name AR & Name EN */}
          <div className="form-row-2">
            <div className="form-group">
              <label>{isRtl ? 'اسم القسم بالعربية *' : 'Category Name (Arabic) *'}</label>
              <input
                type="text"
                required
                placeholder={isRtl ? 'مثال: أجهزة التوجيه والراوتر' : 'e.g. Routers'}
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>{isRtl ? 'اسم القسم بالإنجليزية *' : 'Category Name (English) *'}</label>
              <input
                type="text"
                required
                placeholder={isRtl ? 'مثال: Routers & WiFi' : 'e.g. Routers & WiFi'}
                value={formData.name_en}
                onChange={handleNameEnChange}
              />
            </div>
          </div>

          {/* Row 2: Slug & Parent Category */}
          <div className="form-row-2">
            <div className="form-group">
              <label>{isRtl ? 'الرابط الدائم (Slug) *' : 'Slug *'}</label>
              <input
                type="text"
                required
                placeholder="e.g. routers-wifi"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
              <span className="input-hint">{isRtl ? 'يستخدم في مسار الـ URL للمتجر' : 'Used in storefront URL'}</span>
            </div>
            <div className="form-group">
              <label>{isRtl ? 'القسم الأب (التبعية الهرمية)' : 'Parent Category'}</label>
              <CustomSelect
                value={formData.parent_id}
                onChange={(val) => setFormData({ ...formData, parent_id: val })}
                options={modalParentOptions}
                placeholder={isRtl ? '— قسم رئيسي مستقل (Root Category) —' : '— Root Main Category —'}
                searchable={true}
                isRtl={isRtl}
              />
            </div>
          </div>

          {/* Row 3: Starting Price & Sort Order */}
          <div className="form-row-2">
            <div className="form-group">
              <label>{isRtl ? 'سعر يبدأ من (EGP)' : 'Starting Price (EGP)'}</label>
              <input
                type="number"
                step="0.01"
                placeholder="499.00"
                value={formData.starting_price}
                onChange={(e) => setFormData({ ...formData, starting_price: e.target.value })}
              />
              <span className="input-hint">{isRtl ? 'يظهر على بطاقة القسم في المتجر' : 'Displayed on category card'}</span>
            </div>
            <div className="form-group">
              <label>{isRtl ? 'ترتيب الظهور' : 'Sort Order'}</label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
              />
            </div>
          </div>

          {/* Row 4: Image URL */}
          <div className="form-group">
            <label>{isRtl ? 'رابط صورة البانر (Image URL)' : 'Banner Image URL'}</label>
            <input
              type="text"
              placeholder="/images/categories/routers.jpg"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            />
          </div>

          {/* Row 5: Icon URL or Raw SVG Code */}
          <div className="form-group">
            <label>{isRtl ? 'رمز أو أيقونة القسم (Icon URL / SVG)' : 'Category Icon (SVG or URL)'}</label>
            <span style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '4px', display: 'block' }}>
              {isRtl
                ? 'يمكنك لصق كود SVG مباشرة من Font Awesome أو مواقع الأيقونات، أو كتابة مسار صورة'
                : 'Paste raw SVG code from Font Awesome or enter an image URL'}
            </span>

            <div className="icon-custom-cluster">
              <div className="icon-mode-switcher">
                <button
                  type="button"
                  className={modalIconMode === 'svg' ? 'active' : ''}
                  onClick={() => setModalIconMode('svg')}
                >
                  {isRtl ? 'كود SVG مباشر (Font Awesome)' : 'Raw SVG Code'}
                </button>
                <button
                  type="button"
                  className={modalIconMode === 'url' ? 'active' : ''}
                  onClick={() => setModalIconMode('url')}
                >
                  {isRtl ? 'رابط أيقونة / مسار صورة' : 'Icon URL'}
                </button>
              </div>

              <div className="icon-editor-row">
                <div className="icon-input-side">
                  {modalIconMode === 'svg' ? (
                    <textarea
                      rows={3}
                      placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="..."/></svg>'
                      value={formData.icon_url}
                      onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder="/icons/wifi.svg أو https://..."
                      value={formData.icon_url}
                      onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                    />
                  )}
                </div>

                {/* Live Preview Box */}
                <div className="icon-live-preview-box" title={isRtl ? 'معاينة حية لشكل الأيقونة' : 'Icon Live Preview'}>
                  {formData.icon_url?.trim() ? (
                    <>
                      <div className="icon-render-target">
                        {formData.icon_url.trim().startsWith('<svg') || formData.icon_url.trim().includes('<path') ? (
                          <div
                            dangerouslySetInnerHTML={{ __html: formData.icon_url.trim() }}
                            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          />
                        ) : (
                          <img
                            src={formData.icon_url.trim()}
                            alt="Icon Preview"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}
                      </div>
                      <span className="icon-preview-tag">{isRtl ? 'معاينة' : 'Preview'}</span>
                    </>
                  ) : (
                    <span className="icon-empty-hint">{isRtl ? 'معاينة الأيقونة' : 'Icon Preview'}</span>
                  )}
                </div>
              </div>

              {/* Quick test sample button */}
              <button
                type="button"
                className="sample-test-btn"
                onClick={() => {
                  setModalIconMode('svg');
                  setFormData({
                    ...formData,
                    icon_url: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M248 106.6c18.9-9 32-28.3 32-50.6c0-30.9-25.1-56-56-56s-56 25.1-56 56c0 22.3 13.1 41.6 32 50.6l0 98.8c-2.8 1.3-5.5 2.9-8 4.7l-80.1-45.8c1.6-20.8-8.6-41.6-27.9-52.8C57.2 96 23 105.2 7.5 132S1.2 193 28 208.5c1.3 .8 2.6 1.5 4 2.1l0 90.8c-1.3 .6-2.7 1.3-4 2.1C1.2 319-8 353.2 7.5 380S57.2 416 84 400.5c19.3-11.1 29.4-32 27.8-52.8l50.5-28.9c-11.5-11.2-19.9-25.6-23.8-41.7L88 306.1c-2.6-1.8-5.2-3.3-8-4.7l0-90.8c2.8-1.3 5.5-2.9 8-4.7l80.1 45.8c-.1 1.4-.2 2.8-.2 4.3c0 22.3 13.1 41.6 32 50.6l0 98.8c-18.9 9-32 28.3-32 50.6c0 30.9 25.1 56 56 56s56-25.1 56-56c0-22.3-13.1-41.6-32-50.6l0-98.8c2.8-1.3 5.5-2.9 8-4.7l80.1 45.8c-1.6 20.8 8.6 41.6 27.8 52.8c26.8 15.5 61 6.3 76.5-20.5s6.3-61-20.5-76.5c-1.3-.8-2.7-1.5-4-2.1l0-90.8c1.4-.6 2.7-1.3 4-2.1c26.8-15.5 36-49.7 20.5-76.5S390.8 96 364 111.5c-19.3 11.1-29.4 32-27.8 52.8l-50.6 28.9c11.5 11.2 19.9 25.6 23.8 41.7L360 205.9c2.6 1.8 5.2 3.3 8 4.7l0 90.8c-2.8 1.3-5.5 2.9-8 4.6l-80.1-45.8c.1-1.4 .2-2.8 .2-4.3c0-22.3-13.1-41.6-32-50.6l0-98.8z"/></svg>',
                  });
                }}
              >
                {isRtl ? 'تجربة كود Font Awesome تجريبي' : 'Paste Font Awesome sample'}
              </button>
            </div>
          </div>

          {/* Checkbox: Show in Home Grid */}
          <label className="checkbox-group">
            <input
              type="checkbox"
              checked={formData.show_in_home_grid}
              onChange={(e) => setFormData({ ...formData, show_in_home_grid: e.target.checked })}
            />
            <span>{isRtl ? 'عرض هذا القسم في شبكة الصفحة الرئيسية (Home Grid)' : 'Show this category in Homepage Grid'}</span>
          </label>

          {/* Critical Architecture Rule: Hybrid Auto-linking Tags */}
          <div className="form-group">
            <label>
              {isRtl
                ? 'وسوم الربط والتصنيف التلقائي (Hybrid Auto-linking Rule Tags)'
                : 'Rule Tags for Auto-Categorization'}
            </label>
            <span className="input-hint" style={{ marginBottom: 4 }}>
              {isRtl
                ? 'أي منتج يتم تزويده بأحد هذه الوسوم أثناء الإدخال سيتم ربطه بهذا القسم تلقائياً دون تدخل يدوي.'
                : 'Products assigned with these tags will automatically link to this category.'}
            </span>
            <div className="tags-picker-box">
              {tags.map((tag) => {
                const isSelected = formData.tag_ids.includes(tag.id);
                return (
                  <div
                    key={tag.id}
                    className={`selectable-tag-pill ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleTagSelection(tag.id)}
                  >
                    #{isRtl ? tag.name_ar || tag.name_en : tag.name_en || tag.name_ar}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Descriptions */}
          <div className="form-row-2">
            <div className="form-group">
              <label>{isRtl ? 'الوصف بالعربية' : 'Description (Arabic)'}</label>
              <textarea
                rows={3}
                placeholder={isRtl ? 'وصف مختصر لتحسين محركات البحث SEO...' : 'SEO description...'}
                value={formData.description_ar}
                onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>{isRtl ? 'الوصف بالإنجليزية' : 'Description (English)'}</label>
              <textarea
                rows={3}
                placeholder={isRtl ? 'English description for SEO...' : 'English description for SEO...'}
                value={formData.description_en}
                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
              />
            </div>
          </div>
        </form>
      </AdminModal>

      {/* 4. Delete Confirmation Modal */}
      <AdminModal
        isOpen={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        title={isRtl ? 'تأكيد حذف القسم' : 'Confirm Category Deletion'}
        size="sm"
        footer={
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setCategoryToDelete(null)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: '#f1f5f9',
                border: '1px solid var(--sec-color)',
                color: '#475569',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleDeleteCategory}
              disabled={actionLoading}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                background: '#ef4444',
                border: 'none',
                color: '#ffffff',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {actionLoading ? (isRtl ? 'جارٍ الحذف...' : 'Deleting...') : isRtl ? 'نعم، احذف' : 'Yes, Delete'}
            </button>
          </div>
        }
      >
        <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: 'var(--main-text-color)' }}>
          {isRtl
            ? `هل أنت متأكد من رغبتك في حذف القسم "${categoryToDelete?.name_ar}"؟ في حال وجود أقسام فرعية تابعة له، سيتم تحويلها لأقسام رئيسية دون حذفها.`
            : `Are you sure you want to delete category "${categoryToDelete?.name_en}"? Any nested subcategories will be reassigned as root categories.`}
        </p>
      </AdminModal>
    </div>
  );
}
