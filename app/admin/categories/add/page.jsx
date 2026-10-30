'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getApiHost } from '@/src/utils/apiConfig';
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
  FaStar,
  FaRegStar,
  FaLightbulb,
  FaCheck,
  FaXmark,
  FaBolt,
  FaTrashCan,
  FaStore,
  FaEye,
  FaCodeBranch,
  FaArrowUp,
  FaArrowDown,
} from 'react-icons/fa6';
import './AddCategory.scss';

export default function AddCategoryPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [adminUser, setAdminUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lang, setLang] = useState('ar');

  // Loading states
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tagCreating, setTagCreating] = useState(false);

  // Existing Data from Backend
  const [parentCategories, setParentCategories] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);

  // Form State
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [autoSlug, setAutoSlug] = useState(true);
  const [descriptionAr, setDescriptionAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');

  // Hierarchy
  const [isSubcategory, setIsSubcategory] = useState(false);
  const [parentId, setParentId] = useState('');

  // Media (Blob + URL)
  const [mediaMode, setMediaMode] = useState('upload'); // 'upload' | 'url'
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [iconUrl, setIconUrl] = useState('/icons/category-default.svg');
  const [iconInputMode, setIconInputMode] = useState('svg'); // 'svg' | 'url'

  // Commercial & Display
  const [startingPrice, setStartingPrice] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [showInHomeGrid, setShowInHomeGrid] = useState(true);
  const [isActive, setIsActive] = useState(true);

  // Rule Tags
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  const [newTagAr, setNewTagAr] = useState('');
  const [newTagEn, setNewTagEn] = useState('');

  // Inline Subcategories Repeater
  const [hasInlineSubcategories, setHasInlineSubcategories] = useState(false);
  const [inlineSubcategories, setInlineSubcategories] = useState([
    { name_ar: '', name_en: '', slug: '', starting_price: '' },
  ]);

  const isRtl = lang === 'ar';

  // Parent Category options for CustomSelect
  const parentSelectOptions = useMemo(() => {
    return parentCategories.map((p) => ({
      value: String(p.id),
      label: isRtl ? `${p.name_ar} (${p.name_en})` : p.name_en,
      icon_url: p.icon_url,
      image_url: p.image_url,
      idBadge: p.id,
    }));
  }, [parentCategories, isRtl]);

  // Ensure Auth Token helper (retrieves from storage, cookies, or /api/auth/token)
  const ensureAuthToken = async () => {
    if (typeof window === 'undefined') return '';

    // 1. Try local storage
    let token = localStorage.getItem('trendline_admin_token');
    if (token && token !== 'undefined' && token !== 'null') return token;

    // 2. Try document cookies
    const cookieToken = document.cookie
      .split('; ')
      .find((row) => row.startsWith('token=') || row.startsWith('trendline_token='))
      ?.split('=')[1];
    if (cookieToken && cookieToken !== 'undefined' && cookieToken !== 'null') {
      localStorage.setItem('trendline_admin_token', cookieToken);
      return cookieToken;
    }

    // 3. Fallback: fetch directly from NextAuth server session bridge
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

  // Fetch initial parents and tags
  useEffect(() => {
    const fetchPrerequisites = async () => {
      try {
        const apiHost = getApiHost();

        const [catsRes, tagsRes] = await Promise.all([
          fetch(`${apiHost}/api/v1/catalog/categories`),
          fetch(`${apiHost}/api/v1/catalog/tags`),
        ]);

        const catsData = await catsRes.json();
        const tagsData = await tagsRes.json();

        if (catsData.success && catsData.data) {
          // Filter root categories
          setParentCategories(catsData.data.filter((c) => !c.parent_id));
        }

        if (tagsData.success && tagsData.data) {
          setAvailableTags(tagsData.data);
        }
      } catch (err) {
        console.error('Error fetching categories/tags:', err);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchPrerequisites();
    ensureAuthToken();
  }, []);

  // Handle English Name Change & Auto-Slug
  const handleNameEnChange = (e) => {
    const val = e.target.value;
    setNameEn(val);
    if (autoSlug) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      );
    }
  };

  // Handle Image File Upload (Blob + Preview)
  const handleImageFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create client-side Blob URL for instant high-speed preview
    const blobUrl = URL.createObjectURL(file);
    setImagePreview(blobUrl);

    // Also convert to Base64 data URL so it can be transmitted and saved without external storage server
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Clear Image
  const handleClearImage = () => {
    setImageUrl('');
    setImagePreview('');
  };

  // Toggle Tag Selection
  const handleToggleTag = (tagId) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  // Quick Create New Tag On-The-Fly
  const handleCreateNewTag = async (e) => {
    e.preventDefault();
    if (!newTagAr.trim() || !newTagEn.trim()) {
      alert(isRtl ? 'يرجى إدخال اسم الوسم بالعربية والإنجليزية' : 'Please provide both Arabic & English tag names');
      return;
    }

    try {
      setTagCreating(true);
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
          name_ar: newTagAr.trim(),
          name_en: newTagEn.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create tag');

      const createdTag = data.data;
      // Add to available tags if not already there
      setAvailableTags((prev) => {
        if (prev.some((t) => t.id === createdTag.id)) return prev;
        return [createdTag, ...prev];
      });

      // Automatically select the newly created tag
      setSelectedTagIds((prev) => [...prev, createdTag.id]);

      // Reset tag inputs
      setNewTagAr('');
      setNewTagEn('');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error creating tag');
    } finally {
      setTagCreating(false);
    }
  };

  // Subcategory repeater helpers
  const [bulkAddOpen, setBulkAddOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const handleAddSubRow = () => {
    setInlineSubcategories((prev) => [
      ...prev,
      { name_ar: '', name_en: '', slug: '', starting_price: '' },
    ]);
  };

  const handleRemoveSubRow = (index) => {
    setInlineSubcategories((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleMoveSubRow = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === inlineSubcategories.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    setInlineSubcategories((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  const handleApplyBulkAdd = () => {
    if (!bulkText.trim()) return;
    const items = bulkText
      .split(/[\n,،]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const generatedRows = items.map((item) => {
      const generatedSlug = item
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') || 'sub-' + Math.random().toString(36).substring(2, 7);
      return {
        name_ar: item,
        name_en: item,
        slug: generatedSlug,
        starting_price: '',
      };
    });

    setInlineSubcategories((prev) => {
      if (prev.length === 1 && !prev[0].name_ar && !prev[0].name_en) {
        return generatedRows;
      }
      return [...prev, ...generatedRows];
    });

    setBulkText('');
    setBulkAddOpen(false);
  };

  const handleSubRowChange = (index, field, value) => {
    setInlineSubcategories((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      if (field === 'name_en' && !updated[index].slugManuallyEdited) {
        updated[index].slug = value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
      }
      return updated;
    });
  };

  // Submit Category
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nameAr.trim() || !nameEn.trim() || !slug.trim()) {
      alert(isRtl ? 'يرجى استكمال البيانات الأساسية للقسم (الاسم بالعربية والإنجليزية والرابط)' : 'Please fill all basic category fields');
      return;
    }

    if (isSubcategory && !parentId) {
      alert(isRtl ? 'يرجى اختيار القسم الأب الذي يتبعه هذا القسم الفرعي' : 'Please select the parent category');
      return;
    }

    try {
      setSaving(true);
      const apiHost = getApiHost();

      const token = await ensureAuthToken();

      const payload = {
        name_ar: nameAr.trim(),
        name_en: nameEn.trim(),
        slug: slug.trim(),
        description_ar: descriptionAr.trim() || null,
        description_en: descriptionEn.trim() || null,
        parent_id: isSubcategory && parentId ? Number(parentId) : null,
        image_url: imageUrl || imagePreview || null,
        icon_url: iconUrl || null,
        starting_price: startingPrice ? Number(startingPrice) : null,
        sort_order: Number(sortOrder) || 0,
        show_in_home_grid: !!showInHomeGrid,
        is_active: !!isActive,
        tag_ids: selectedTagIds,
        subcategories: hasInlineSubcategories
          ? inlineSubcategories.filter((s) => s.name_ar.trim() && s.name_en.trim())
          : [],
      };

      const res = await fetch(`${apiHost}/api/v1/catalog/categories`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save category');
      }

      // Success redirect
      router.push('/admin/categories');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error occurred while saving category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="add-category-page" dir={isRtl ? 'rtl' : 'ltr'} suppressHydrationWarning>
      {/* 1. Sidebar */}
      <AdminSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        lang={lang}
      />

      {/* Main Wrapper */}
      <div className={`add-category-wrapper ${sidebarCollapsed ? 'collapsed' : ''}`}>
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
        <main className="add-category-content">
          {/* Breadcrumbs & Action Top Bar */}
          <div className="page-nav-header">
            <div className="breadcrumbs-line">
              <Link href="/admin">{isRtl ? 'لوحة التحكم' : 'Dashboard'}</Link>
              <span className="separator">/</span>
              <Link href="/admin/categories">{isRtl ? 'الأقسام والتصنيفات' : 'Categories'}</Link>
              <span className="separator">/</span>
              <span className="current-crumb">{isRtl ? 'إضافة قسم جديد' : 'New Category'}</span>
            </div>

            <div className="top-action-buttons">
              <Link href="/admin/categories" className="btn-back-cancel">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  {isRtl ? (
                    <polyline points="9 18 15 12 9 6"></polyline>
                  ) : (
                    <polyline points="15 18 9 12 15 6"></polyline>
                  )}
                </svg>
                <span>{isRtl ? 'إلغاء وعودة' : 'Cancel'}</span>
              </Link>

              <button
                type="submit"
                form="categoryMainForm"
                disabled={saving}
                className="btn-submit-save"
              >
                {saving ? (
                  <span>{isRtl ? 'جارٍ الحفظ في قاعدة البيانات...' : 'Saving...'}</span>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    <span>{isRtl ? 'حفظ ونشر القسم' : 'Save & Publish'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Form */}
          <form id="categoryMainForm" onSubmit={handleSubmit} className="category-form-grid">
            {/* Left Column: Core Data, Rule Tags & Subcategories */}
            <div className="form-left-col">
              {/* Card 1: Basic Information */}
              <div className="form-section-card">
                <div className="card-title-header">
                  <div className="title-left">
                    <div className="title-icon-box">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                      </svg>
                    </div>
                    <h2>{isRtl ? 'البيانات الأساسية للقسم' : 'Basic Category Information'}</h2>
                  </div>
                  <span className="card-badge">{isRtl ? 'مطلوب *' : 'Mandatory *'}</span>
                </div>

                {/* Names AR & EN */}
                <div className="form-row-2">
                  <div className="form-field">
                    <label>
                      {isRtl ? 'اسم القسم بالعربية' : 'Category Name (Arabic)'} <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={isRtl ? 'مثال: أجهزة الراوتر والشبكات' : 'e.g. Networking & Routers'}
                      value={nameAr}
                      onChange={(e) => setNameAr(e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label>
                      {isRtl ? 'اسم القسم بالإنجليزية' : 'Category Name (English)'} <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Networking & Routers"
                      value={nameEn}
                      onChange={handleNameEnChange}
                    />
                  </div>
                </div>

                {/* Slug */}
                <div className="form-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label>
                      {isRtl ? 'الرابط الدائم (Slug)' : 'URL Slug'} <span className="required-star">*</span>
                    </label>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={autoSlug}
                        onChange={(e) => setAutoSlug(e.target.checked)}
                        style={{ marginInlineEnd: 4 }}
                      />
                      {isRtl ? 'توليد تلقائي' : 'Auto Generate'}
                    </label>
                  </div>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => {
                      setAutoSlug(false);
                      setSlug(e.target.value);
                    }}
                    placeholder="e.g. networking-routers"
                  />
                  <span className="field-hint">
                    {isRtl ? 'رابط القسم في المتجر: ' : 'Storefront URL: '}
                    <code>trendlineeg.com/shop/{slug || 'category-slug'}</code>
                  </span>
                </div>

                {/* Descriptions AR & EN */}
                <div className="form-row-2">
                  <div className="form-field">
                    <label>{isRtl ? 'الوصف بالعربية (SEO Meta)' : 'Arabic Description'}</label>
                    <textarea
                      rows={3}
                      placeholder={isRtl ? 'وصف تسويقي لمحركات البحث...' : 'Marketing & SEO description...'}
                      value={descriptionAr}
                      onChange={(e) => setDescriptionAr(e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label>{isRtl ? 'الوصف بالإنجليزية (SEO Meta)' : 'English Description'}</label>
                    <textarea
                      rows={3}
                      placeholder="English description for search engines..."
                      value={descriptionEn}
                      onChange={(e) => setDescriptionEn(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Hybrid Auto-linking Rule Tags */}
              <div className="form-section-card">
                <div className="card-title-header">
                  <div className="title-left">
                    <div className="title-icon-box">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                        <line x1="7" y1="7" x2="7.01" y2="7"></line>
                      </svg>
                    </div>
                    <h2>{isRtl ? 'وسوم الربط والتصنيف التلقائي الذكي' : 'Hybrid Auto-linking Rule Tags'}</h2>
                  </div>
                  <span className="card-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                    {selectedTagIds.length} {isRtl ? 'وسم محدد' : 'tags linked'}
                  </span>
                </div>

                {/* Explanatory Alert Box */}
                <div className="info-alert-box">
                  <span className="alert-icon" style={{ display: 'flex', alignItems: 'center' }}>
                    <FaLightbulb />
                  </span>
                  <div>
                    <strong>{isRtl ? 'محرك الربط التلقائي (Auto-Categorization Engine):' : 'Auto-Categorization Engine:'}</strong>{' '}
                    {isRtl
                      ? 'عند إضافة منتجات لاحقاً وتزويدها بأي من هذه الوسوم، سيقوم النظام تلقائياً بربط المنتج بهذا القسم في جدول product_categories للحفاظ على أعلى سرعة قراءة في المتجر.'
                      : 'Any future product assigned these tags will be automatically mapped to this category.'}
                  </div>
                </div>

                {/* On-The-Fly Tag Creation Bar */}
                <div className="tag-creation-bar">
                  <input
                    type="text"
                    placeholder={isRtl ? 'اسم الوسم بالعربية (مثال: سويتشات)' : 'Tag Name (Arabic)'}
                    value={newTagAr}
                    onChange={(e) => setNewTagAr(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder={isRtl ? 'اسم الوسم بالإنجليزية (مثال: Switches)' : 'Tag Name (English)'}
                    value={newTagEn}
                    onChange={(e) => setNewTagEn(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-create-tag"
                    disabled={tagCreating}
                    onClick={handleCreateNewTag}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    <span>{tagCreating ? (isRtl ? 'جارٍ الإضافة...' : 'Adding...') : isRtl ? '+ إضافة وسم' : '+ Add Tag'}</span>
                  </button>
                </div>

                {/* Search & Cloud Picker */}
                <div className="tags-selection-wrapper">
                  <input
                    type="text"
                    style={{
                      height: '38px',
                      padding: '0 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--sec-color)',
                      fontSize: '12px',
                    }}
                    placeholder={isRtl ? 'فلترة أو بحث في الوسوم الموجودة...' : 'Filter available tags...'}
                    value={tagSearchTerm}
                    onChange={(e) => setTagSearchTerm(e.target.value)}
                  />

                  <div className="tags-cloud">
                    {availableTags
                      .filter((t) => {
                        if (!tagSearchTerm.trim()) return true;
                        const term = tagSearchTerm.toLowerCase();
                        return (
                          t.name_ar?.includes(term) ||
                          t.name_en?.toLowerCase().includes(term) ||
                          t.slug?.toLowerCase().includes(term)
                        );
                      })
                      .map((tag) => {
                        const isSelected = selectedTagIds.includes(tag.id);
                        return (
                          <div
                            key={tag.id}
                            className={`tag-toggle-chip ${isSelected ? 'active' : ''}`}
                            onClick={() => handleToggleTag(tag.id)}
                          >
                            <span>#{isRtl ? tag.name_ar || tag.name_en : tag.name_en || tag.name_ar}</span>
                            {isSelected && <FaCheck style={{ fontSize: '10px' }} />}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Card 3: Inline Nested Subcategories Manager (Advanced) */}
              {!isSubcategory && (
                <div className="form-section-card">
                  <div className="card-title-header">
                    <div className="title-left">
                      <div className="title-icon-box" style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0284c7' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="7" height="7"></rect>
                          <rect x="14" y="8" width="7" height="7"></rect>
                          <rect x="14" y="17" width="7" height="7"></rect>
                          <path d="M10 6.5h2a2 2 0 0 1 2 2V20.5"></path>
                        </svg>
                      </div>
                      <div>
                        <h2>{isRtl ? 'إضافة أقسام فرعية تابعة (Nested Subcategories)' : 'Nested Subcategories'}</h2>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          {isRtl ? 'تفريع القسم مباشرة لبناء شجرة التصنيفات دفعة واحدة' : 'Multi-level taxonomy hierarchy generator'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {hasInlineSubcategories && (
                        <span className="card-badge" style={{ background: 'rgba(14, 165, 233, 0.12)', color: '#0369a1' }}>
                          {inlineSubcategories.length} {isRtl ? 'أقسام مجهزة' : 'nested'}
                        </span>
                      )}
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12.5px', fontWeight: 800, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={hasInlineSubcategories}
                          onChange={(e) => setHasInlineSubcategories(e.target.checked)}
                        />
                        <span>{isRtl ? 'تفعيل الأقسام الفرعية' : 'Enable'}</span>
                      </label>
                    </div>
                  </div>

                  {hasInlineSubcategories && (
                    <div className="subcategories-advanced-panel">
                      {/* Advanced Toolbar */}
                      <div className="sub-toolbar">
                        <div className="toolbar-actions-left">
                          <button
                            type="button"
                            className="btn-toolbar-add"
                            onClick={handleAddSubRow}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <line x1="12" y1="5" x2="12" y2="19"></line>
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            <span>{isRtl ? 'إضافة فرع جديد' : 'Add Subcategory'}</span>
                          </button>

                          <button
                            type="button"
                            className={`btn-toolbar-bulk ${bulkAddOpen ? 'active' : ''}`}
                            onClick={() => setBulkAddOpen(!bulkAddOpen)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                            </svg>
                            <span>{isRtl ? 'إضافة سريعة متعددة (Bulk Add)' : 'Bulk Fast Add'}</span>
                          </button>
                        </div>

                        {inlineSubcategories.length > 1 && (
                          <button
                            type="button"
                            className="btn-toolbar-clear"
                            onClick={() => {
                              if (confirm(isRtl ? 'هل أنت متأكد من تفريغ كافة الأقسام الفرعية؟' : 'Clear all subcategories?')) {
                                setInlineSubcategories([{ name_ar: '', name_en: '', slug: '', starting_price: '' }]);
                              }
                            }}
                          >
                            {isRtl ? 'إفراغ القائمة' : 'Clear All'}
                          </button>
                        )}
                      </div>

                      {/* Bulk Fast Add Drawer */}
                      {bulkAddOpen && (
                        <div className="bulk-add-drawer">
                          <div className="bulk-header">
                            <strong>
                              <FaBolt style={{ color: '#f59e0b' }} />
                              {isRtl ? 'إضافة فروع متعددة دفعة واحدة' : 'Bulk Fast Add Subcategories'}
                            </strong>
                            <span>{isRtl ? 'افصل بين الأسماء بفاصلة (،) أو سطر جديد' : 'Separate names with commas or newlines'}</span>
                          </div>

                          <textarea
                            placeholder={isRtl ? 'مثال: كابلات شبكات، محولات بوي، راوترات هوائية، بطاريات، إكسسوارات' : 'e.g. Cat6 Cables, PoE Adapters, 5G Modems, Accessories'}
                            value={bulkText}
                            onChange={(e) => setBulkText(e.target.value)}
                          />

                          <div className="bulk-actions-footer">
                            <button
                              type="button"
                              className="btn-cancel-bulk"
                              onClick={() => {
                                setBulkAddOpen(false);
                                setBulkText('');
                              }}
                            >
                              {isRtl ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button
                              type="button"
                              className="btn-apply-bulk"
                              onClick={handleApplyBulkAdd}
                            >
                              {isRtl ? 'توليد وإدراج الفروع' : 'Generate Rows'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Connected Tree Container */}
                      <div className="tree-branch-container">
                        {inlineSubcategories.map((sub, index) => (
                          <div key={index} className="sub-tree-row">
                            <div className="sub-index-badge" title={isRtl ? `فرع رقم #${index + 1}` : `Row #${index + 1}`}>
                              #{index + 1}
                            </div>

                            {/* Arabic Name */}
                            <div className="sub-input-wrap">
                              <span className="input-hint">{isRtl ? 'اسم الفرع (عربي) *' : 'Name (Arabic) *'}</span>
                              <input
                                type="text"
                                placeholder={isRtl ? 'مثال: راوترات منزلية' : 'Name (AR)'}
                                value={sub.name_ar}
                                onChange={(e) => handleSubRowChange(index, 'name_ar', e.target.value)}
                              />
                            </div>

                            {/* English Name */}
                            <div className="sub-input-wrap">
                              <span className="input-hint">{isRtl ? 'اسم الفرع (EN) *' : 'Name (EN) *'}</span>
                              <input
                                type="text"
                                placeholder="e.g. Home Routers"
                                value={sub.name_en}
                                onChange={(e) => handleSubRowChange(index, 'name_en', e.target.value)}
                              />
                            </div>

                            {/* Slug */}
                            <div className="sub-input-wrap">
                              <span className="input-hint">Slug</span>
                              <input
                                type="text"
                                placeholder="slug"
                                value={sub.slug}
                                onChange={(e) => {
                                  sub.slugManuallyEdited = true;
                                  handleSubRowChange(index, 'slug', e.target.value);
                                }}
                              />
                            </div>

                            {/* Optional starting price */}
                            <div className="sub-input-wrap">
                              <span className="input-hint">{isRtl ? 'يبدأ من (ج.م)' : 'Price (EGP)'}</span>
                              <input
                                type="number"
                                placeholder="0.00"
                                value={sub.starting_price}
                                onChange={(e) => handleSubRowChange(index, 'starting_price', e.target.value)}
                              />
                            </div>

                            {/* Actions & Reorder */}
                            <div className="sub-row-actions">
                              <button
                                type="button"
                                className="btn-reorder"
                                disabled={index === 0}
                                onClick={() => handleMoveSubRow(index, 'up')}
                                title={isRtl ? 'تحريك للأعلى' : 'Move Up'}
                              >
                                <FaArrowUp />
                              </button>
                              <button
                                type="button"
                                className="btn-reorder"
                                disabled={index === inlineSubcategories.length - 1}
                                onClick={() => handleMoveSubRow(index, 'down')}
                                title={isRtl ? 'تحريك للأسفل' : 'Move Down'}
                              >
                                <FaArrowDown />
                              </button>
                              {inlineSubcategories.length > 1 && (
                                <button
                                  type="button"
                                  className="btn-remove-sub"
                                  onClick={() => handleRemoveSubRow(index)}
                                  title={isRtl ? 'حذف هذا الفرع' : 'Remove Subcategory'}
                                >
                                  <FaXmark />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Live Visual Hierarchy Tree Preview */}
                      <div className="live-tree-preview-box">
                        <div className="preview-header-line">
                          <strong>
                            <FaFolderTree style={{ color: 'var(--main-color)' }} />
                            {isRtl ? 'المعاينة الحية لشجرة الفروع في المتجر' : 'Real-time Hierarchy Tree Preview'}
                          </strong>
                          <span>{inlineSubcategories.filter((s) => s.name_ar || s.name_en).length} {isRtl ? 'فروع نشطة' : 'active branches'}</span>
                        </div>

                        <div className="preview-tree-canvas">
                          {/* Root Node */}
                          <div className="canvas-root-node">
                            <FaStar style={{ color: '#f59e0b' }} />
                            <strong>{nameAr || nameEn || (isRtl ? 'القسم الرئيسي (Level 1 Root)' : 'Root Category')}</strong>
                            <span className="root-slug">/{slug || 'main-category'}</span>
                          </div>

                          {/* Child Branches */}
                          <div className="canvas-children-list">
                            {inlineSubcategories.filter((s) => s.name_ar || s.name_en).length > 0 ? (
                              inlineSubcategories
                                .filter((s) => s.name_ar || s.name_en)
                                .map((sub, i) => (
                                  <div key={i} className="canvas-child-node">
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#64748b' }}>
                                      <FaCodeBranch />
                                      <FaFolder />
                                    </span>
                                    <span>{sub.name_ar || sub.name_en}</span>
                                    <span className="child-slug">/{sub.slug || 'slug'}</span>
                                    {sub.starting_price && (
                                      <span className="child-price">{Number(sub.starting_price).toLocaleString()} ج.م</span>
                                    )}
                                  </div>
                                ))
                            ) : (
                              <div className="canvas-empty-state">
                                {isRtl
                                  ? '— لم يتم إدخال أسماء فروع بعد، اكتب اسم الفرع لترى شجرة التفرع مباشرة.'
                                  : '— No subcategory names entered yet.'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Media, Hierarchy, & Visibility */}
            <div className="form-right-col">
              {/* Card 4: Media & Image Upload */}
              <div className="form-section-card">
                <div className="card-title-header">
                  <div className="title-left">
                    <div className="title-icon-box">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                    </div>
                    <h2>{isRtl ? 'صورة القسم والأيقونة' : 'Media & Icon'}</h2>
                  </div>
                </div>

                {/* Tabs */}
                <div className="media-tabs">
                  <button
                    type="button"
                    className={mediaMode === 'upload' ? 'active' : ''}
                    onClick={() => setMediaMode('upload')}
                  >
                    {isRtl ? 'رفع ملف (Blob / File)' : 'File Upload'}
                  </button>
                  <button
                    type="button"
                    className={mediaMode === 'url' ? 'active' : ''}
                    onClick={() => setMediaMode('url')}
                  >
                    {isRtl ? 'رابط مباشر (URL)' : 'Direct URL'}
                  </button>
                </div>

                {/* Image Input Area */}
                {mediaMode === 'upload' ? (
                  !imagePreview ? (
                    <div className="image-upload-dropzone">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                      />
                      <div className="dropzone-icon">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                      </div>
                      <h4 className="dropzone-title">
                        {isRtl ? 'انقر أو اسحب صورة القسم هنا' : 'Click or drag image here'}
                      </h4>
                      <p className="dropzone-sub">PNG, JPG, WebP (Max 5MB)</p>
                    </div>
                  ) : (
                    <div className="image-live-preview-box">
                      <img src={imagePreview} alt="Category preview" />
                      <button
                        type="button"
                        className="preview-overlay-btn"
                        onClick={handleClearImage}
                      >
                        <FaXmark /> {isRtl ? 'حذف / تغيير' : 'Remove'}
                      </button>
                    </div>
                  )
                ) : (
                  <div className="form-field">
                    <label>{isRtl ? 'رابط الصورة الخارجي' : 'Image URL'}</label>
                    <input
                      type="url"
                      placeholder="https://example.com/banner.jpg"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setImagePreview(e.target.value);
                      }}
                    />
                    {imagePreview && (
                      <div className="image-live-preview-box" style={{ marginTop: 10 }}>
                        <img src={imagePreview} alt="Preview" />
                      </div>
                    )}
                  </div>
                )}

                {/* Icon URL or Raw SVG Code */}
                <div className="form-field">
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
                        className={iconInputMode === 'svg' ? 'active' : ''}
                        onClick={() => setIconInputMode('svg')}
                      >
                        {isRtl ? 'كود SVG مباشر (Font Awesome)' : 'Raw SVG Code'}
                      </button>
                      <button
                        type="button"
                        className={iconInputMode === 'url' ? 'active' : ''}
                        onClick={() => setIconInputMode('url')}
                      >
                        {isRtl ? 'رابط أيقونة / مسار صورة' : 'Icon URL'}
                      </button>
                    </div>

                    <div className="icon-editor-row">
                      <div className="icon-input-side">
                        {iconInputMode === 'svg' ? (
                          <textarea
                            rows={3}
                            placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="..."/></svg>'
                            value={iconUrl}
                            onChange={(e) => setIconUrl(e.target.value)}
                          />
                        ) : (
                          <input
                            type="text"
                            placeholder="/icons/wifi.svg أو https://..."
                            value={iconUrl}
                            onChange={(e) => setIconUrl(e.target.value)}
                          />
                        )}
                      </div>

                      {/* Live Preview Box */}
                      <div className="icon-live-preview-box" title={isRtl ? 'معاينة حية لشكل الأيقونة' : 'Icon Live Preview'}>
                        {iconUrl?.trim() ? (
                          <>
                            <div className="icon-render-target">
                              {iconUrl.trim().startsWith('<svg') || iconUrl.trim().includes('<path') ? (
                                <div
                                  dangerouslySetInnerHTML={{ __html: iconUrl.trim() }}
                                  style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                />
                              ) : (
                                <img
                                  src={iconUrl.trim()}
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
                        setIconInputMode('svg');
                        setIconUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M248 106.6c18.9-9 32-28.3 32-50.6c0-30.9-25.1-56-56-56s-56 25.1-56 56c0 22.3 13.1 41.6 32 50.6l0 98.8c-2.8 1.3-5.5 2.9-8 4.7l-80.1-45.8c1.6-20.8-8.6-41.6-27.9-52.8C57.2 96 23 105.2 7.5 132S1.2 193 28 208.5c1.3 .8 2.6 1.5 4 2.1l0 90.8c-1.3 .6-2.7 1.3-4 2.1C1.2 319-8 353.2 7.5 380S57.2 416 84 400.5c19.3-11.1 29.4-32 27.8-52.8l50.5-28.9c-11.5-11.2-19.9-25.6-23.8-41.7L88 306.1c-2.6-1.8-5.2-3.3-8-4.7l0-90.8c2.8-1.3 5.5-2.9 8-4.7l80.1 45.8c-.1 1.4-.2 2.8-.2 4.3c0 22.3 13.1 41.6 32 50.6l0 98.8c-18.9 9-32 28.3-32 50.6c0 30.9 25.1 56 56 56s56-25.1 56-56c0-22.3-13.1-41.6-32-50.6l0-98.8c2.8-1.3 5.5-2.9 8-4.7l80.1 45.8c-1.6 20.8 8.6 41.6 27.8 52.8c26.8 15.5 61 6.3 76.5-20.5s6.3-61-20.5-76.5c-1.3-.8-2.7-1.5-4-2.1l0-90.8c1.4-.6 2.7-1.3 4-2.1c26.8-15.5 36-49.7 20.5-76.5S390.8 96 364 111.5c-19.3 11.1-29.4 32-27.8 52.8l-50.6 28.9c11.5 11.2 19.9 25.6 23.8 41.7L360 205.9c2.6 1.8 5.2 3.3 8 4.7l0 90.8c-2.8 1.3-5.5 2.9-8 4.6l-80.1-45.8c.1-1.4 .2-2.8 .2-4.3c0-22.3-13.1-41.6-32-50.6l0-98.8z"/></svg>');
                      }}
                    >
                      {isRtl ? 'تجربة كود Font Awesome تجريبي' : 'Paste Font Awesome sample'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 5: Hierarchy & Parent Category (Advanced Visual Tiles) */}
              <div className="form-section-card">
                <div className="card-title-header">
                  <div className="title-left">
                    <div className="title-icon-box" style={{ background: 'rgba(0, 87, 194, 0.08)', color: 'var(--main-color)' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                        <polyline points="2 17 12 22 22 17"></polyline>
                        <polyline points="2 12 12 17 22 12"></polyline>
                      </svg>
                    </div>
                    <div>
                      <h2>{isRtl ? 'التبعية والمستوى الهرمي (Hierarchy Level)' : 'Hierarchy & Taxonomy Level'}</h2>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        {isRtl ? 'حدد ما إذا كان القسم جذراً رئيسياً بالمتجر أو فرعاً تابعاً' : 'Determine root level vs nested child placement'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Visual Dual Choice Tiles */}
                <div className="hierarchy-choice-grid">
                  {/* Option 1: Root / Level 1 */}
                  <div
                    className={`hierarchy-tile ${!isSubcategory ? 'selected' : ''}`}
                    onClick={() => {
                      setIsSubcategory(false);
                      setParentId('');
                    }}
                  >
                    <div className="tile-header-row">
                      <div className="tile-icon-wrapper">
                        <div className="tile-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                        </div>
                        <span className="tile-badge-corner primary">
                          <FaStar style={{ color: '#f59e0b' }} /> {isRtl ? 'المستوى 1 (Root)' : 'Level 1 (Root)'}
                        </span>
                      </div>

                      <div className="tile-radio-indicator">
                        {!isSubcategory && <span className="dot"><FaCheck /></span>}
                      </div>
                    </div>

                    <div className="tile-content">
                      <h4>{isRtl ? 'قسم رئيسي مستقل (Level 1 Root)' : 'Root Category (Level 1)'}</h4>
                      <p>
                        {isRtl
                          ? 'يظهر مباشرة في شريط التنقل العلوي للمتجر (Navbar) وصفحة التصنيفات الرئيسية، ويمكن تفريع أقسام فرعية منه.'
                          : 'Appears directly in top navbar and storefront root category grid.'}
                      </p>
                    </div>
                  </div>

                  {/* Option 2: Subcategory / Level 2 */}
                  <div
                    className={`hierarchy-tile ${isSubcategory ? 'selected' : ''}`}
                    onClick={() => {
                      setIsSubcategory(true);
                      setHasInlineSubcategories(false);
                    }}
                  >
                    <div className="tile-header-row">
                      <div className="tile-icon-wrapper">
                        <div className="tile-icon branch-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="6" y1="3" x2="6" y2="15"></line>
                            <circle cx="18" cy="6" r="3"></circle>
                            <circle cx="6" cy="18" r="3"></circle>
                            <path d="M18 9a9 9 0 0 1-9 9"></path>
                          </svg>
                        </div>
                        <span className="tile-badge-corner secondary">
                          <FaCodeBranch style={{ color: 'var(--main-color)' }} /> {isRtl ? 'المستوى 2 (Sub)' : 'Level 2 (Sub)'}
                        </span>
                      </div>

                      <div className="tile-radio-indicator">
                        {isSubcategory && <span className="dot"><FaCheck /></span>}
                      </div>
                    </div>

                    <div className="tile-content">
                      <h4>{isRtl ? 'قسم فرعي تابع (Level 2 Subcategory)' : 'Nested Subcategory (Level 2)'}</h4>
                      <p>
                        {isRtl
                          ? 'يتفرع من قسم رئيسي آخر، ويظهر تحته في القوائم المنسدلة وشريط الفلاتر الجانبي للمتجر.'
                          : 'Belongs to an existing parent category in dropdowns and filter trees.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Subcategory Configuration & Realtime Visual Path */}
                {isSubcategory && (
                  <div className="parent-picker-wrapper">
                    <div className="parent-select-header">
                      <label>
                        {isRtl ? 'اختر القسم الأب (Parent Category)' : 'Select Parent Category'} <span className="required-star">*</span>
                      </label>
                      <span className="parent-count-tag">
                        {parentCategories.length} {isRtl ? 'أقسام رئيسية متاحة' : 'available'}
                      </span>
                    </div>

                    <CustomSelect
                      value={parentId}
                      onChange={(val) => setParentId(val)}
                      options={parentSelectOptions}
                      placeholder={isRtl ? '— انقر لتحديد القسم الرئيسي الأب —' : '— Select Parent Category —'}
                      searchable={true}
                      isRtl={isRtl}
                    />

                    {/* Live Store Breadcrumb Simulation */}
                    <div className="live-store-breadcrumb">
                      <div className="breadcrumb-label">
                        <FaEye />
                        <span>{isRtl ? 'محاكاة مسار التصفح بالمتجر (Store Breadcrumb Trail):' : 'Store Breadcrumb Trail:'}</span>
                      </div>
                      <div className="crumbs-flow">
                        <span className="crumb-item store">
                          <FaStore /> {isRtl ? 'المتجر' : 'Store'}
                        </span>
                        <span className="crumb-arrow">{isRtl ? '←' : '→'}</span>
                        <span className="crumb-item parent">
                          <FaFolder /> {parentCategories.find((p) => String(p.id) === String(parentId))?.name_ar || (isRtl ? 'القسم الأب' : 'Parent Category')}
                        </span>
                        <span className="crumb-arrow">{isRtl ? '←' : '→'}</span>
                        <span className="crumb-item current">
                          <FaTag /> {nameAr || nameEn || (isRtl ? 'هذا القسم الفرعي' : 'This Subcategory')}
                        </span>
                      </div>
                    </div>

                    {/* Mini Visual Tree */}
                    <div className="mini-tree-visualizer">
                      <div className="tree-node">
                        <span className="node-icon"><FaFolder /></span>
                        <span className="node-text">
                          {parentCategories.find((p) => String(p.id) === String(parentId))
                            ? `${parentCategories.find((p) => String(p.id) === String(parentId))?.name_ar} (/${parentCategories.find((p) => String(p.id) === String(parentId))?.slug})`
                            : (isRtl ? 'يرجى اختيار القسم الأب أعلاه' : 'Please select parent above')}
                        </span>
                        <span className="node-badge root-badge">{isRtl ? 'رئيسي' : 'Root'}</span>
                      </div>

                      <div className="tree-branch-connector">
                        <div className="tree-node">
                          <span className="node-icon" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <FaCodeBranch />
                            <FaTag />
                          </span>
                          <span className="node-text">
                            {nameAr || nameEn || (isRtl ? 'هذا القسم' : 'Current Category')} (/{slug || 'new-slug'})
                          </span>
                          <span className="node-badge sub-badge">{isRtl ? 'فرع تابع' : 'Sub'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 6: Commercial & Display Settings */}
              <div className="form-section-card">
                <div className="card-title-header">
                  <div className="title-left">
                    <div className="title-icon-box">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                      </svg>
                    </div>
                    <h2>{isRtl ? 'إعدادات العرض والمتجر' : 'Display & Store Settings'}</h2>
                  </div>
                </div>

                {/* Starting Price */}
                <div className="form-field">
                  <label>{isRtl ? 'يبدأ من سعر (EGP)' : 'Starting Price (EGP)'}</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="499.00"
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(e.target.value)}
                  />
                  <span className="field-hint">
                    {isRtl ? 'يظهر على بطاقة القسم بالمتجر: يبدأ من 499 ج.م' : 'Displays: Starts from 499 EGP'}
                  </span>
                </div>

                {/* Sort Order */}
                <div className="form-field">
                  <label>{isRtl ? 'ترتيب الظهور (Sort Order)' : 'Sort Order'}</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  />
                </div>

                {/* Home Grid Toggle */}
                <div className="setting-toggle-item">
                  <div className="toggle-meta">
                    <span className="toggle-title">{isRtl ? 'شبكة الصفحة الرئيسية' : 'Homepage Grid'}</span>
                    <span className="toggle-sub">{isRtl ? 'عرض في شبكة الأقسام الأولى' : 'Feature in home categories'}</span>
                  </div>
                  <label className="custom-switch">
                    <input
                      type="checkbox"
                      checked={showInHomeGrid}
                      onChange={(e) => setShowInHomeGrid(e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                {/* Active Status Toggle */}
                <div className="setting-toggle-item">
                  <div className="toggle-meta">
                    <span className="toggle-title">{isRtl ? 'تفعيل القسم فوراً' : 'Active Status'}</span>
                    <span className="toggle-sub">{isRtl ? 'إتاحة القسم للمتسوقين' : 'Available for shoppers'}</span>
                  </div>
                  <label className="custom-switch">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
