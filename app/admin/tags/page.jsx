'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getApiHost } from '@/src/utils/apiConfig';
import {
  AdminSidebar,
  AdminHeader,
  AdminStatsCard,
  AdminDataTable,
  AdminModal,
  CustomSelect,
} from '@/src/components/adminComponents';
import {
  FaTag,
  FaBolt,
  FaLightbulb,
  FaCheck,
  FaLink,
  FaLinkSlash,
} from 'react-icons/fa6';
import './Tags.scss';

export default function AdminTagsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [adminUser, setAdminUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lang, setLang] = useState('ar');

  const [tags, setTags] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters & View Mode
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all'); // 'all' | 'linked' | 'unlinked'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cloud'
  const [selectedCloudTag, setSelectedCloudTag] = useState(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [tagToDelete, setTagToDelete] = useState(null);

  // Form State
  const [formNameAr, setFormNameAr] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategoryIds, setFormCategoryIds] = useState([]);
  const [bulkTagsText, setBulkTagsText] = useState('');

  const isRtl = lang === 'ar';

  const filterCategoryOptions = useMemo(() => [
    { value: 'all', label: isRtl ? 'جميع الوسوم' : 'All Tags', icon: <FaTag /> },
    { value: 'linked', label: isRtl ? 'المرتبطة بأقسام فقط' : 'Linked to Categories', icon: <FaLink /> },
    { value: 'unlinked', label: isRtl ? 'غير المرتبطة بأقسام' : 'Standalone Only', icon: <FaLinkSlash /> },
  ], [isRtl]);

  const subcategoriesOnly = useMemo(() => {
    return categories.filter((c) => !!c.parent_id);
  }, [categories]);

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

  // Fetch Tags and Categories
  const fetchData = async () => {
    try {
      setLoading(true);
      const apiHost = getApiHost();

      const [tagsRes, catsRes] = await Promise.all([
        fetch(`${apiHost}/api/v1/catalog/tags`, { cache: 'no-store' }),
        fetch(`${apiHost}/api/v1/catalog/categories`, { cache: 'no-store' }),
      ]);

      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        if (tagsData.success) setTags(tagsData.data || []);
      }
      if (catsRes.ok) {
        const catsData = await catsRes.json();
        if (catsData.success) setCategories(catsData.data || []);
      }
    } catch (err) {
      console.error('Error fetching tags data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = tags.length;
    const linked = tags.filter((t) => t.categories_count > 0).length;
    const totalProductsMapped = tags.reduce((sum, t) => sum + (t.products_count || 0), 0);
    return {
      total,
      linked,
      unlinked: total - linked,
      totalProductsMapped,
    };
  }, [tags]);

  // Filtered Tags List
  const filteredTags = useMemo(() => {
    return tags.filter((tag) => {
      // Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesAr = tag.name_ar?.toLowerCase().includes(term);
        const matchesEn = tag.name_en?.toLowerCase().includes(term);
        const matchesSlug = tag.slug?.toLowerCase().includes(term);
        if (!matchesAr && !matchesEn && !matchesSlug) return false;
      }

      // Category Link Filter
      if (filterCategory === 'linked') {
        return (tag.categories_count || 0) > 0;
      }
      if (filterCategory === 'unlinked') {
        return !tag.categories_count || tag.categories_count === 0;
      }

      // Cloud click filter
      if (selectedCloudTag && selectedCloudTag.id !== tag.id) {
        return false;
      }

      return true;
    });
  }, [tags, searchTerm, filterCategory, selectedCloudTag]);

  // Slug auto-generation helper
  const handleNameEnChange = (e) => {
    const val = e.target.value;
    setFormNameEn(val);
    setFormSlug(
      val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
    );
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormNameAr('');
    setFormNameEn('');
    setFormSlug('');
    setFormCategoryIds([]);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (tag) => {
    setEditingTag(tag);
    setFormNameAr(tag.name_ar || '');
    setFormNameEn(tag.name_en || '');
    setFormSlug(tag.slug || '');
    setFormCategoryIds(tag.categories ? tag.categories.map((c) => c.id) : []);
    setIsEditModalOpen(true);
  };

  // Category checkbox toggle
  const handleToggleCategoryCheckbox = (catId) => {
    setFormCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  // Submit Create Tag
  const handleCreateTag = async (e) => {
    e.preventDefault();
    if (!formNameAr.trim() || !formNameEn.trim()) {
      alert(isRtl ? 'يرجى إدخال اسم الوسم بالعربية والإنجليزية' : 'Please provide both names');
      return;
    }

    try {
      setActionLoading(true);
      const apiHost = getApiHost();

      const token = await ensureAuthToken();
      const res = await fetch(`${apiHost}/api/v1/catalog/tags`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name_ar: formNameAr.trim(),
          name_en: formNameEn.trim(),
          slug: formSlug.trim(),
          category_ids: formCategoryIds,
        }),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed to create tag');

      setIsAddModalOpen(false);
      await fetchData();
    } catch (err) {
      alert(err.message || 'Error creating tag');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Edit Tag
  const handleUpdateTag = async (e) => {
    e.preventDefault();
    if (!editingTag) return;

    try {
      setActionLoading(true);
      const apiHost = getApiHost();

      const token = await ensureAuthToken();
      const res = await fetch(`${apiHost}/api/v1/catalog/tags/${editingTag.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name_ar: formNameAr.trim(),
          name_en: formNameEn.trim(),
          slug: formSlug.trim(),
          category_ids: formCategoryIds,
        }),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed to update tag');

      setIsEditModalOpen(false);
      setEditingTag(null);
      await fetchData();
    } catch (err) {
      alert(err.message || 'Error updating tag');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Delete Tag
  const handleDeleteTag = async () => {
    if (!tagToDelete) return;

    try {
      setActionLoading(true);
      const apiHost = getApiHost();

      const token = await ensureAuthToken();
      const res = await fetch(`${apiHost}/api/v1/catalog/tags/${tagToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Failed to delete tag');
      }

      setTagToDelete(null);
      await fetchData();
    } catch (err) {
      alert(err.message || 'Error deleting tag');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Bulk Create Tags
  const handleBulkCreateTags = async (e) => {
    e.preventDefault();
    if (!bulkTagsText.trim()) return;

    const lines = bulkTagsText
      .split(/[\n,،]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    const payload = lines.map((name) => {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') || 'tag-' + Math.random().toString(36).substring(2, 7);
      return {
        name_ar: name,
        name_en: name,
        slug: generatedSlug,
      };
    });

    try {
      setActionLoading(true);
      const apiHost = getApiHost();

      const token = await ensureAuthToken();
      const res = await fetch(`${apiHost}/api/v1/catalog/tags/bulk`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tags: payload }),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed to create bulk tags');

      setBulkTagsText('');
      setIsBulkModalOpen(false);
      await fetchData();
    } catch (err) {
      alert(err.message || 'Error creating bulk tags');
    } finally {
      setActionLoading(false);
    }
  };

  // Table Columns Definition
  const columns = [
    {
      key: 'id',
      label: '#ID',
      render: (val) => <span style={{ fontWeight: 800, color: '#94a3b8' }}>#{val}</span>,
    },
    {
      key: 'name',
      label: isRtl ? 'اسم الوسم' : 'Tag Name',
      render: (_, row) => (
        <div className="tag-badge-cell">
          <div className="tag-hash-box">#</div>
          <div className="tag-names-meta">
            <span className="name-ar">{row.name_ar}</span>
            <span className="name-en">{row.name_en}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'slug',
      label: 'Slug',
      render: (val) => <code style={{ color: 'var(--main-color)', fontWeight: 700 }}>/{val}</code>,
    },
    {
      key: 'categories',
      label: isRtl ? 'الأقسام المرتبطة تلقائياً (Hybrid Rules)' : 'Auto-Linked Categories',
      render: (_, row) => (
        <div className="tag-categories-chips">
          {row.categories && row.categories.length > 0 ? (
            row.categories.map((c) => (
              <span
                key={c.id}
                className={`cat-chip ${!c.parent_id ? 'root-chip' : ''}`}
                title={c.name_en}
              >
                {!c.parent_id ? '⭐ ' : '↳ '}
                {isRtl ? c.name_ar : c.name_en}
              </span>
            ))
          ) : (
            <span className="no-categories-chip">
              {isRtl ? '— غير مرتبط بأقسام' : '— Not linked'}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'products_count',
      label: isRtl ? 'المنتجات المرتبطة' : 'Products Mapped',
      render: (val) => (
        <span
          style={{
            fontWeight: 800,
            color: val > 0 ? '#10b981' : '#64748b',
            background: val > 0 ? 'rgba(16, 185, 129, 0.1)' : '#f1f5f9',
            padding: '4px 10px',
            borderRadius: '8px',
          }}
        >
          {val || 0} {isRtl ? 'منتج' : 'items'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: isRtl ? 'الإجراءات' : 'Actions',
      render: (_, row) => (
        <div className="tag-action-btns">
          <button
            type="button"
            className="btn-edit-tag"
            onClick={() => handleOpenEditModal(row)}
            title={isRtl ? 'تعديل الوسم وربطه بالأقسام' : 'Edit Tag & Linked Categories'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>{isRtl ? 'تعديل' : 'Edit'}</span>
          </button>

          <button
            type="button"
            className="btn-delete-tag"
            onClick={() => setTagToDelete(row)}
            title={isRtl ? 'حذف الوسم' : 'Delete Tag'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-tags-page" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <AdminSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        lang={lang}
      />

      <div className={`admin-main-wrapper ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Header */}
        <AdminHeader
          adminUser={adminUser}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          isSidebarCollapsed={sidebarCollapsed}
          lang={lang}
          onToggleLanguage={(newLang) => setLang(newLang)}
        />

        <main className="admin-tags-content">
          {/* Navigation Bar */}
          <div className="page-nav-header">
            <div className="breadcrumbs-line">
              <Link href="/admin">{isRtl ? 'لوحة التحكم' : 'Dashboard'}</Link>
              <span className="separator">/</span>
              <span className="current-crumb">{isRtl ? 'وسوم الربط والتصنيف (Tags)' : 'Rule Tags'}</span>
            </div>

            <div className="top-action-buttons">
              <button
                type="button"
                className="btn-bulk-add-tags"
                onClick={() => setIsBulkModalOpen(true)}
              >
                <FaBolt style={{ color: '#f59e0b', fontSize: '14px' }} />
                <span>{isRtl ? 'إضافة سريعة مجمعة' : 'Bulk Fast Add'}</span>
              </button>

              <Link
                href="/admin/tags/add"
                className="btn-add-tag-main"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>{isRtl ? 'إضافة وسم جديد' : 'New Tag'}</span>
              </Link>
            </div>
          </div>

          {/* Title Banner */}
          <div className="tags-title-banner">
            <h1>
              <span className="title-hash">#</span>
              <span>{isRtl ? 'إدارة وسوم الربط والتصنيف التلقائي الذكي' : 'Hybrid Auto-linking Rule Tags'}</span>
            </h1>
            <p>
              {isRtl
                ? 'محرك تصنيف المنتجات التلقائي: أي منتج يتم تزويده بأي وسم، يتم ربطه تلقائياً بالأقسام المرتبطة بهذا الوسم لتسريع استعراض الكتالوج.'
                : 'Automated catalog categorization engine powered by hybrid tag rules.'}
            </p>
          </div>

          {/* Hybrid Engine Architecture Banner */}
          <div className="hybrid-engine-info-box">
            <div className="engine-icon-badge"><FaLightbulb style={{ color: 'var(--main-color)' }} /></div>
            <div className="engine-text">
              <strong>{isRtl ? 'كيف يعمل محرك التصنيف التلقائي الذكي (Auto-Categorization Engine)؟' : 'How Hybrid Rule Engine Works:'}</strong>
              <p>
                {isRtl
                  ? 'عند ربط أي قسم من الأقسام بوسم معين (مثل #سويتشات أو #راوترات_5G)، فإن أي منتج تتم إضافته مستقبلاً أو استيراده ويحمل هذا الوسم، يقوم السيستم تلقائياً بربطه بهذا القسم في جدول product_categories بدون الحاجة لربطه يدوياً.'
                  : 'Products assigned any of these tags are automatically categorized into their linked departments.'}
              </p>
            </div>
            <div className="engine-badge-status" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <FaCheck /> {isRtl ? 'المحرك نشط تلقائياً' : 'Engine Active'}
            </div>
          </div>

          {/* KPI Overview */}
          <div className="tags-kpi-grid">
            <AdminStatsCard
              title={isRtl ? 'إجمالي الوسوم' : 'Total Tags'}
              value={stats.total}
              trend="PostgreSQL"
              trendDirection="up"
              trendLabel={isRtl ? 'في قاعدة البيانات' : 'In Database'}
              colorScheme="primary"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                  <line x1="7" y1="7" x2="7.01" y2="7"></line>
                </svg>
              }
            />

            <AdminStatsCard
              title={isRtl ? 'الوسوم الفعالة المرتبطة بأقسام' : 'Linked Rule Tags'}
              value={stats.linked}
              trend="Rules Active"
              trendDirection="up"
              trendLabel={isRtl ? 'تربط أقسام المتجر' : 'Mapped to categories'}
              colorScheme="success"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              }
            />

            <AdminStatsCard
              title={isRtl ? 'وسوم حرة (غير مرتبطة)' : 'Standalone Tags'}
              value={stats.unlinked}
              trend="Pending"
              trendDirection="down"
              trendLabel={isRtl ? 'يمكن ربطها بأقسام' : 'No category linked'}
              colorScheme="warning"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              }
            />

            <AdminStatsCard
              title={isRtl ? 'المنتجات المرتبطة بالوسوم' : 'Mapped Products'}
              value={stats.totalProductsMapped}
              trend="Catalog Items"
              trendDirection="up"
              trendLabel={isRtl ? 'في كافة الكتالوج' : 'Across catalog'}
              colorScheme="secondary"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              }
            />
          </div>

          {/* Toolbar */}
          <div className="tags-toolbar-card">
            <div className="toolbar-left-search">
              <div className="search-box-input">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  placeholder={isRtl ? 'بحث باسم الوسم أو الرابط المختصر...' : 'Search tags or slug...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div style={{ width: '220px' }}>
                <CustomSelect
                  value={filterCategory}
                  onChange={(val) => {
                    setFilterCategory(val);
                    setSelectedCloudTag(null);
                  }}
                  options={filterCategoryOptions}
                  isRtl={isRtl}
                />
              </div>
            </div>

            {/* View Modes */}
            <div className="view-mode-tabs">
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
                <span>{isRtl ? 'عرض جدول' : 'Table'}</span>
              </button>

              <button
                type="button"
                className={viewMode === 'cloud' ? 'active' : ''}
                onClick={() => setViewMode('cloud')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
                </svg>
                <span>{isRtl ? 'سحابة وسوم تفاعلية' : 'Tag Cloud'}</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          {viewMode === 'table' ? (
            <AdminDataTable
              title={isRtl ? `قائمة الوسوم (${filteredTags.length})` : `Tags List (${filteredTags.length})`}
              columns={columns}
              data={filteredTags}
              searchable={false}
              itemsPerPage={12}
              lang={lang}
            />
          ) : (
            <div className="tags-cloud-explorer-box">
              <div className="cloud-header">
                <h3>{isRtl ? 'سحابة الوسوم التفاعلية (Tag Cloud Explorer)' : 'Tag Cloud Explorer'}</h3>
                <span>{isRtl ? 'انقر على أي وسم لفلترة الجدول أو تعديله مباشرة' : 'Click any chip to inspect'}</span>
              </div>

              <div className="cloud-chips-grid">
                {filteredTags.map((tag) => (
                  <div
                    key={tag.id}
                    className={`interactive-cloud-chip ${selectedCloudTag?.id === tag.id ? 'active-filter' : ''}`}
                    onClick={() => {
                      if (selectedCloudTag?.id === tag.id) {
                        setSelectedCloudTag(null);
                      } else {
                        handleOpenEditModal(tag);
                      }
                    }}
                    title={isRtl ? `انقر لتعديل وسم #${tag.name_ar}` : `Click to edit #${tag.name_en}`}
                  >
                    <span className="chip-name">#{isRtl ? tag.name_ar : tag.name_en}</span>
                    <span className="chip-counter">
                      {tag.categories_count || 0} {isRtl ? 'أقسام' : 'cats'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal: Add New Tag */}
          <AdminModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            title={isRtl ? 'إضافة وسم جديد (New Rule Tag)' : 'Add New Tag'}
            size="md"
          >
            <form onSubmit={handleCreateTag} className="tag-modal-form">
              <div className="form-row-2">
                <div className="form-field">
                  <label>
                    {isRtl ? 'اسم الوسم بالعربية' : 'Tag Name (Arabic)'} <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isRtl ? 'مثال: سويتشات بو إي' : 'e.g. PoE Switches'}
                    value={formNameAr}
                    onChange={(e) => setFormNameAr(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label>
                    {isRtl ? 'اسم الوسم بالإنجليزية' : 'Tag Name (English)'} <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PoE Switches"
                    value={formNameEn}
                    onChange={handleNameEnChange}
                  />
                </div>
              </div>

              <div className="form-field">
                <label>
                  {isRtl ? 'الرابط الدائم (Slug)' : 'URL Slug'} <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="poe-switches"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                />
              </div>

              {/* Link to Categories directly */}
              <div className="categories-checklist-box">
                <div className="checklist-header">
                  <strong>{isRtl ? 'ربط هذا الوسم بأقسام المتجر (قواعد التصنيف التلقائي)' : 'Link to Categories'}</strong>
                  <span>{formCategoryIds.length} {isRtl ? 'محدد' : 'selected'}</span>
                </div>

                <div className="checklist-scroll">
                  {subcategoriesOnly.length === 0 ? (
                    <div style={{ padding: '12px', fontSize: '13px', color: '#64748b', textAlign: 'center' }}>
                      {isRtl ? 'لا توجد أقسام فرعية متاحة' : 'No subcategories available'}
                    </div>
                  ) : (
                    subcategoriesOnly.map((c) => {
                      const isChecked = formCategoryIds.includes(c.id);
                      const parentName = isRtl ? c.parent?.name_ar : c.parent?.name_en;
                      const catName = isRtl ? c.name_ar : c.name_en;
                      return (
                        <label key={c.id} className="cat-check-item">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleCategoryCheckbox(c.id)}
                          />
                          <span>
                            {parentName ? `${parentName} › ` : ''}{catName}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" disabled={actionLoading} className="btn-save">
                  {actionLoading ? (isRtl ? 'جارٍ الحفظ...' : 'Saving...') : isRtl ? 'حفظ ونشر الوسم' : 'Save Tag'}
                </button>
              </div>
            </form>
          </AdminModal>

          {/* Modal: Edit Tag */}
          <AdminModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingTag(null);
            }}
            title={isRtl ? `تعديل الوسم: #${editingTag?.name_ar || ''}` : `Edit Tag: #${editingTag?.name_en || ''}`}
            size="md"
          >
            <form onSubmit={handleUpdateTag} className="tag-modal-form">
              <div className="form-row-2">
                <div className="form-field">
                  <label>
                    {isRtl ? 'اسم الوسم بالعربية' : 'Tag Name (Arabic)'} <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formNameAr}
                    onChange={(e) => setFormNameAr(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label>
                    {isRtl ? 'اسم الوسم بالإنجليزية' : 'Tag Name (English)'} <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formNameEn}
                    onChange={(e) => setFormNameEn(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-field">
                <label>
                  {isRtl ? 'الرابط الدائم (Slug)' : 'URL Slug'} <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                />
              </div>

              {/* Link to Categories directly */}
              <div className="categories-checklist-box">
                <div className="checklist-header">
                  <strong>{isRtl ? 'ربط هذا الوسم بأقسام المتجر (قواعد التصنيف التلقائي)' : 'Link to Categories'}</strong>
                  <span>{formCategoryIds.length} {isRtl ? 'محدد' : 'selected'}</span>
                </div>

                <div className="checklist-scroll">
                  {subcategoriesOnly.length === 0 ? (
                    <div style={{ padding: '12px', fontSize: '13px', color: '#64748b', textAlign: 'center' }}>
                      {isRtl ? 'لا توجد أقسام فرعية متاحة' : 'No subcategories available'}
                    </div>
                  ) : (
                    subcategoriesOnly.map((c) => {
                      const isChecked = formCategoryIds.includes(c.id);
                      const parentName = isRtl ? c.parent?.name_ar : c.parent?.name_en;
                      const catName = isRtl ? c.name_ar : c.name_en;
                      return (
                        <label key={c.id} className="cat-check-item">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleCategoryCheckbox(c.id)}
                          />
                          <span>
                            {parentName ? `${parentName} › ` : ''}{catName}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingTag(null);
                  }}
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" disabled={actionLoading} className="btn-save">
                  {actionLoading ? (isRtl ? 'جارٍ التحديث...' : 'Updating...') : isRtl ? 'تحديث الوسم' : 'Update Tag'}
                </button>
              </div>
            </form>
          </AdminModal>

          {/* Modal: Bulk Fast Add */}
          <AdminModal
            isOpen={isBulkModalOpen}
            onClose={() => setIsBulkModalOpen(false)}
            title={isRtl ? 'إضافة سريعة مجمعة لعدة وسوم' : 'Bulk Fast Add Tags'}
            size="md"
          >
            <form onSubmit={handleBulkCreateTags} className="tag-modal-form">
              <div className="form-field">
                <label>
                  {isRtl
                    ? 'اكتب أو الصق أسماء الوسوم مفصولة بفاصلة (،) أو سطر جديد:'
                    : 'Paste tag names separated by commas or newlines:'}
                </label>
                <textarea
                  rows={6}
                  placeholder={
                    isRtl
                      ? 'مثال: راوترات سريعة، كابلات شبكات، سويتشات بو إي، كاميرات ليلية، بطاريات، إكسسوارات'
                      : 'e.g. 5G Modems, Cat7 Cables, PoE Switches, Night Cameras'
                  }
                  value={bulkTagsText}
                  onChange={(e) => setBulkTagsText(e.target.value)}
                />
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsBulkModalOpen(false)}
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !bulkTagsText.trim()}
                  className="btn-save"
                >
                  {actionLoading ? (isRtl ? 'جارٍ المعالجة...' : 'Processing...') : isRtl ? 'توليد وإضافة الوسوم' : 'Generate Tags'}
                </button>
              </div>
            </form>
          </AdminModal>

          {/* Modal: Delete Confirmation */}
          <AdminModal
            isOpen={!!tagToDelete}
            onClose={() => setTagToDelete(null)}
            title={isRtl ? 'تأكيد حذف الوسم' : 'Confirm Tag Deletion'}
            size="sm"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ margin: 0, fontSize: 13.5, color: '#334155', lineHeight: 1.5 }}>
                {isRtl ? (
                  <>
                    هل أنت متأكد من حذف الوسم <strong>#{tagToDelete?.name_ar}</strong> ({tagToDelete?.slug})؟
                    <br />
                    <span style={{ fontSize: 12, color: '#ef4444' }}>
                      سيتم فك ارتباط هذا الوسم من جميع المنتجات والأقسام المرتبطة به.
                    </span>
                  </>
                ) : (
                  `Are you sure you want to delete tag #${tagToDelete?.name_en}?`
                )}
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setTagToDelete(null)}
                  style={{
                    height: 38,
                    padding: '0 16px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleDeleteTag}
                  style={{
                    height: 38,
                    padding: '0 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#ef4444',
                    color: '#fff',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {actionLoading ? (isRtl ? 'جارٍ الحذف...' : 'Deleting...') : isRtl ? 'نعم، احذف الوسم' : 'Delete'}
                </button>
              </div>
            </div>
          </AdminModal>
        </main>
      </div>
    </div>
  );
}
