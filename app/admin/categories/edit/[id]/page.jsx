'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
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
  FaShieldHalved,
  FaLock,
} from 'react-icons/fa6';
import '@/app/admin/categories/add/AddCategory.scss';

function EditCategoryContent() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params?.id;
  const { data: session, status } = useSession();

  const [adminUser, setAdminUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lang, setLang] = useState('ar');

  // Loading & Saving States
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tagCreating, setTagCreating] = useState(false);

  // Available Data
  const [allCategories, setAllCategories] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [isOriginalMainCategory, setIsOriginalMainCategory] = useState(false);

  // Form Fields
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');

  // Hierarchy
  const [isSubcategory, setIsSubcategory] = useState(false);
  const [parentId, setParentId] = useState('');

  // Media (Blob + URL)
  const [mediaMode, setMediaMode] = useState('upload'); // 'upload' | 'url'
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [iconUrl, setIconUrl] = useState('');
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

  // Inline Subcategories
  const [hasInlineSubcategories, setHasInlineSubcategories] = useState(false);
  const [inlineSubcategories, setInlineSubcategories] = useState([]);

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
    if (cookieToken && cookieToken !== 'undefined' && cookieToken !== 'null') {
      return cookieToken;
    }

    try {
      const res = await fetch('/api/auth/token');
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('trendline_admin_token', data.token);
          return data.token;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch auth token', e);
    }
    return '';
  };

  // Auth Protection Check
  useEffect(() => {
    const hasTokenCookie = document.cookie
      .split('; ')
      .some(
        (row) =>
          row.startsWith('token=') ||
          row.startsWith('trendline_token=') ||
          row.startsWith('next-auth.session-token=')
      );
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
    }
  }, [status, router, session]);

  // Fetch Category Data, Categories, and Tags
  useEffect(() => {
    if (!categoryId) return;
    const fetchCategoryData = async () => {
      try {
        setPageLoading(true);
        const apiHost = getApiHost();

        const [catRes, allCatsRes, tagsRes] = await Promise.all([
          fetch(`${apiHost}/api/v1/catalog/categories/${categoryId}`),
          fetch(`${apiHost}/api/v1/catalog/categories`),
          fetch(`${apiHost}/api/v1/catalog/tags`),
        ]);

        const [catData, allCatsData, tagsData] = await Promise.all([
          catRes.json(),
          allCatsRes.json(),
          tagsRes.json(),
        ]);

        if (allCatsData.success) {
          setAllCategories(allCatsData.data || []);
        }
        if (tagsData.success) {
          setAvailableTags(tagsData.data || []);
        }

        if (catData.success && catData.data) {
          const cat = catData.data;

          setNameAr(cat.name_ar || '');
          setNameEn(cat.name_en || '');
          setSlug(cat.slug || '');
          setDescriptionAr(cat.description_ar || '');
          setDescriptionEn(cat.description_en || '');

          // Check if this is an original Main Category
          const isMain = !cat.parent_id;
          setIsOriginalMainCategory(isMain);
          setIsSubcategory(!isMain);
          setParentId(cat.parent_id ? String(cat.parent_id) : '');

          // Media
          if (cat.image_url) {
            setImageUrl(cat.image_url);
            setImagePreview(cat.image_url);
            setMediaMode(cat.image_url.startsWith('http') ? 'url' : 'upload');
          }

          if (cat.icon_url) {
            setIconUrl(cat.icon_url);
            setIconInputMode(
              cat.icon_url.startsWith('<svg') || cat.icon_url.includes('<path') ? 'svg' : 'url'
            );
          }

          // Commercial
          setStartingPrice(cat.starting_price || '');
          setSortOrder(cat.sort_order || 0);
          setShowInHomeGrid(cat.show_in_home_grid !== undefined ? !!cat.show_in_home_grid : true);
          setIsActive(cat.is_active !== undefined ? !!cat.is_active : true);

          // Tags
          if (Array.isArray(cat.tags)) {
            setSelectedTagIds(cat.tags.map((t) => t.id));
          }

          // Subcategories
          if (Array.isArray(cat.subcategories) && cat.subcategories.length > 0) {
            setHasInlineSubcategories(true);
            setInlineSubcategories(
              cat.subcategories.map((s) => ({
                id: s.id,
                name_ar: s.name_ar || '',
                name_en: s.name_en || '',
                slug: s.slug || '',
                starting_price: s.starting_price || '',
              }))
            );
          }
        } else {
          alert('Category not found');
          router.push('/admin/categories');
        }
      } catch (err) {
        console.error('Failed to load category for editing:', err);
      } finally {
        setPageLoading(false);
      }
    };

    fetchCategoryData();
  }, [categoryId, router]);

  // Filter root categories for parent selection (exclude current category and its children)
  const rootCategories = useMemo(() => {
    return allCategories.filter((c) => !c.parent_id && String(c.id) !== String(categoryId));
  }, [allCategories, categoryId]);

  // Parent Category options for CustomSelect with image/SVG display
  const parentSelectOptions = useMemo(() => {
    return rootCategories.map((p) => ({
      value: String(p.id),
      label: isRtl ? `${p.name_ar} (${p.name_en})` : p.name_en,
      icon_url: p.icon_url,
      image_url: p.image_url,
      idBadge: p.id,
      badge: `/${p.slug}`,
    }));
  }, [rootCategories, isRtl]);

  // Filter tags by search term
  const filteredTags = useMemo(() => {
    if (!tagSearchTerm.trim()) return availableTags;
    const term = tagSearchTerm.toLowerCase();
    return availableTags.filter(
      (t) =>
        t.name_ar?.toLowerCase().includes(term) ||
        t.name_en?.toLowerCase().includes(term) ||
        t.slug?.toLowerCase().includes(term)
    );
  }, [availableTags, tagSearchTerm]);

  // Handle Image Upload (File -> Base64 / Data URL)
  const handleImageFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setImageUrl('');
    setImagePreview('');
  };

  const handleToggleTag = (tagId) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  // Quick Create New Tag
  const handleCreateNewTag = async (e) => {
    e.preventDefault();
    if (!newTagAr.trim() || !newTagEn.trim()) {
      alert(isRtl ? 'يرجى إدخال اسم الوسم بالعربية والإنجليزية' : 'Please provide both tag names');
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
      setAvailableTags((prev) => [createdTag, ...prev]);
      setSelectedTagIds((prev) => [...prev, createdTag.id]);
      setNewTagAr('');
      setNewTagEn('');
    } catch (err) {
      alert(err.message || 'Error creating tag');
    } finally {
      setTagCreating(false);
    }
  };

  // Subcategory rows handlers
  const [bulkAddOpen, setBulkAddOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const handleAddSubcategoryRow = () => {
    setInlineSubcategories((prev) => [
      ...prev,
      { name_ar: '', name_en: '', slug: '', starting_price: '' },
    ]);
  };

  const handleRemoveSubcategoryRow = (index) => {
    setInlineSubcategories((prev) => prev.filter((_, i) => i !== index));
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

  const handleSubcategoryChange = (index, field, value) => {
    setInlineSubcategories((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'name_en' && !updated[index].slugManuallyEdited) {
        updated[index].slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
      }
      return updated;
    });
  };

  // Form Submit (PUT /api/v1/catalog/categories/:id)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nameAr.trim() || !nameEn.trim() || !slug.trim()) {
      alert(isRtl ? 'يرجى استيفاء الحقول الإجبارية (الاسم بالعربية، الإنجليزية، والرابط المختصر)' : 'Please fill all required fields');
      return;
    }

    // STRICT ARCHITECTURE CONSTRAINT: Main categories CANNOT be converted into subcategories
    if (isOriginalMainCategory && isSubcategory) {
      alert(isRtl ? 'لا يمكن تحويل الفئة الرئيسية إلى فرعية للحفاظ على استقرار المنتجات والأقسام التابعة!' : 'Main categories cannot be converted to subcategories!');
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

      const res = await fetch(`${apiHost}/api/v1/catalog/categories/${categoryId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update category');
      }

      alert(isRtl ? 'تم تحديث بيانات القسم بنجاح!' : 'Category updated successfully!');
      router.push('/admin/categories');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error occurred while updating category');
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="add-category-page" dir={isRtl ? 'rtl' : 'ltr'}>
        <AdminSidebar
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          lang={lang}
        />
        <div className="add-category-wrapper">
          <AdminHeader
            adminUser={adminUser}
            onLogout={() => {
              localStorage.removeItem('trendline_admin_token');
              router.push('/admin/login');
            }}
            lang={lang}
            onToggleLang={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            isSidebarCollapsed={sidebarCollapsed}
          />
          <main className="add-category-content">
            <div style={{ textAlign: 'center', padding: '100px 20px', color: '#64748b' }}>
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>⏳</span>
              <strong>{isRtl ? 'جارٍ تحميل بيانات القسم للتعديل...' : 'Loading category data...'}</strong>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="add-category-page" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 1. Sidebar */}
      <AdminSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        lang={lang}
      />

      {/* Main Wrapper */}
      <div className="add-category-wrapper">
        {/* 2. Header */}
        <AdminHeader
          adminUser={adminUser}
          onLogout={() => {
            localStorage.removeItem('trendline_admin_token');
            router.push('/admin/login');
          }}
          lang={lang}
          onToggleLang={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          isSidebarCollapsed={sidebarCollapsed}
        />

        {/* 3. Main Content Body */}
        <main className="add-category-content">
          {/* Top Bar with Breadcrumbs & Action Buttons */}
          <div className="top-action-bar">
            <div className="breadcrumbs-line">
              <Link href="/admin">{isRtl ? 'لوحة التحكم' : 'Dashboard'}</Link>
              <span className="separator">/</span>
              <Link href="/admin/categories">{isRtl ? 'الأقسام والتصنيفات' : 'Categories'}</Link>
              <span className="separator">/</span>
              <span className="current-crumb">
                {isRtl ? `تعديل: ${nameAr || 'القسم'}` : `Edit: ${nameEn || 'Category'}`}
              </span>
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
                form="categoryEditForm"
                disabled={saving}
                className="btn-submit-save"
              >
                {saving ? (
                  <span>{isRtl ? 'جارٍ حفظ التعديلات...' : 'Saving...'}</span>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    <span>{isRtl ? 'حفظ التعديلات' : 'Save Changes'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Form Grid */}
          <form id="categoryEditForm" onSubmit={handleSubmit} className="category-form-grid">
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
                      placeholder="مثال: أجهزة الشبكات والواي فاي"
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
                      placeholder="e.g. Networking & WiFi"
                      value={nameEn}
                      onChange={(e) => setNameEn(e.target.value)}
                    />
                  </div>
                </div>

                {/* Slug (URL key) */}
                <div className="form-field">
                  <label>
                    {isRtl ? 'المعرف الفريد في الرابط (Slug)' : 'URL Slug'}{' '}
                    <span className="required-star">*</span>
                  </label>
                  <div className="slug-input-wrapper">
                    <span className="slug-prefix">/categories/</span>
                    <input
                      type="text"
                      required
                      placeholder="networking"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                    />
                  </div>
                </div>

                {/* Descriptions */}
                <div className="form-row-2">
                  <div className="form-field">
                    <label>{isRtl ? 'الوصف بالعربية (SEO)' : 'Description (Arabic)'}</label>
                    <textarea
                      rows={3}
                      placeholder="وصف مختصر للقسم يظهر في محركات البحث وفي رأس صفحة القسم..."
                      value={descriptionAr}
                      onChange={(e) => setDescriptionAr(e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label>{isRtl ? 'الوصف بالإنجليزية (SEO)' : 'Description (English)'}</label>
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
                  <span className="alert-icon"><FaLightbulb style={{ color: '#0284c7' }} /></span>
                  <div>
                    <strong>{isRtl ? 'محرك الربط التلقائي (Auto-Categorization Engine):' : 'Auto-Categorization Engine:'}</strong>{' '}
                    {isRtl
                      ? 'أي منتج يتم تزويده بأي من هذه الوسوم سيتم ربطه بهذا القسم تلقائياً في جدول product_categories.'
                      : 'Any product with these tags will automatically map to this category.'}
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

                {/* Tag Cloud Picker */}
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

                  <div className="tags-cloud-scroll">
                    {filteredTags.map((tag) => {
                      const isSelected = selectedTagIds.includes(tag.id);
                      return (
                        <div
                          key={tag.id}
                          className={`tag-selectable-chip ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleToggleTag(tag.id)}
                        >
                          <span className="tag-hash">#</span>
                          <span>{isRtl ? tag.name_ar || tag.name_en : tag.name_en || tag.name_ar}</span>
                          {isSelected && <span className="check-mark"><FaCheck /></span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Card 3: Inline Subcategories (Advanced Tree Panel) */}
              {isOriginalMainCategory && (
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
                        <h2>{isRtl ? 'الأقسام الفرعية التابعة (Nested Subcategories)' : 'Nested Subcategories'}</h2>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          {isRtl ? 'إدارة وتفريع الأقسام التابعة لهذا القسم الرئيسي مباشرة' : 'Direct taxonomy branches of this root category'}
                        </span>
                      </div>
                    </div>

                    <span className="card-badge" style={{ background: 'rgba(14, 165, 233, 0.12)', color: '#0369a1' }}>
                      {inlineSubcategories.length} {isRtl ? 'أقسام مضافة' : 'nested'}
                    </span>
                  </div>

                  <div className="subcategories-advanced-panel">
                    {/* Advanced Toolbar */}
                    <div className="sub-toolbar">
                      <div className="toolbar-actions-left">
                        <button
                          type="button"
                          className="btn-toolbar-add"
                          onClick={handleAddSubcategoryRow}
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

                      {inlineSubcategories.length > 0 && (
                        <button
                          type="button"
                          className="btn-toolbar-clear"
                          onClick={() => {
                            if (confirm(isRtl ? 'هل أنت متأكد من تفريغ كافة الأقسام الفرعية؟' : 'Clear all subcategories?')) {
                              setInlineSubcategories([]);
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
                        <div key={sub.id || index} className="sub-tree-row">
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
                              onChange={(e) => handleSubcategoryChange(index, 'name_ar', e.target.value)}
                            />
                          </div>

                          {/* English Name */}
                          <div className="sub-input-wrap">
                            <span className="input-hint">{isRtl ? 'اسم الفرع (EN) *' : 'Name (EN) *'}</span>
                            <input
                              type="text"
                              placeholder="e.g. Home Routers"
                              value={sub.name_en}
                              onChange={(e) => handleSubcategoryChange(index, 'name_en', e.target.value)}
                            />
                          </div>

                          {/* Slug */}
                          <div className="sub-input-wrap">
                            <span className="input-hint">Slug</span>
                            <input
                              type="text"
                              placeholder="slug"
                              value={sub.slug}
                              onChange={(e) => handleSubcategoryChange(index, 'slug', e.target.value)}
                            />
                          </div>

                          {/* Optional starting price */}
                          <div className="sub-input-wrap">
                            <span className="input-hint">{isRtl ? 'يبدأ من (ج.م)' : 'Price (EGP)'}</span>
                            <input
                              type="number"
                              placeholder="0.00"
                              value={sub.starting_price}
                              onChange={(e) => handleSubcategoryChange(index, 'starting_price', e.target.value)}
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
                            <button
                              type="button"
                              className="btn-remove-sub"
                              onClick={() => handleRemoveSubcategoryRow(index)}
                              title={isRtl ? 'حذف هذا الفرع' : 'Remove Subcategory'}
                            >
                              <FaXmark />
                            </button>
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
                          <strong>{nameAr || nameEn || (isRtl ? 'القسم الحالي (Level 1 Root)' : 'Root Category')}</strong>
                          <span className="root-slug">/{slug || 'main-category'}</span>
                        </div>

                        {/* Child Branches */}
                        <div className="canvas-children-list">
                          {inlineSubcategories.filter((s) => s.name_ar || s.name_en).length > 0 ? (
                            inlineSubcategories
                              .filter((s) => s.name_ar || s.name_en)
                              .map((sub, i) => (
                                <div key={sub.id || i} className="canvas-child-node">
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
                                ? '— لا توجد أقسام فرعية مسجلة حالياً، استخدم زر إضافة فرع لإنشاء فروع جديدة.'
                                : '— No nested subcategories registered yet.'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Media, Hierarchy & Display */}
            <div className="form-right-col">
              {/* Hierarchy & Parent Category with Advanced Visual Tiles */}
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
                      <h2>{isRtl ? 'المستوى الهرمي والتبعية (Hierarchy Level)' : 'Hierarchy & Taxonomy Level'}</h2>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        {isRtl ? 'موقع القسم في هيكل الشجرة والكتالوج' : 'Position within store taxonomy tree'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Architecture Constraint Lock Banner for Root Categories */}
                {isOriginalMainCategory && (
                  <div className="architecture-lock-notice">
                    <div className="lock-icon-box"><FaShieldHalved style={{ color: 'var(--main-color)' }} /></div>
                    <div className="lock-text">
                      <strong>{isRtl ? 'قفل معماري معزز (Architecture Security Lock)' : 'Architecture Protected Node'}</strong>
                      <p>
                        {isRtl
                          ? 'هذا القسم مسجل كـ «قسم رئيسي Level 1». تم تأمين إمكانية تحويله إلى قسم فرعي لحماية تماسك المنتجات والأقسام المتفرعة منه في المتجر وقاعدة البيانات.'
                          : 'This category is an anchored Level 1 Root category and cannot be converted into a subcategory.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Visual Dual Choice Tiles */}
                <div className="hierarchy-choice-grid">
                  {/* Option 1: Root / Level 1 */}
                  <div
                    className={`hierarchy-tile ${!isSubcategory ? 'selected' : ''} ${isOriginalMainCategory ? 'locked' : ''}`}
                    onClick={() => {
                      if (!isOriginalMainCategory) {
                        setIsSubcategory(false);
                        setParentId('');
                      }
                    }}
                  >
                    <div className="tile-header-row">
                      <div className="tile-icon-wrapper">
                        <div className="tile-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                        </div>
                        <span className={`tile-badge-corner ${isOriginalMainCategory ? 'locked-badge' : 'primary'}`}>
                          {isOriginalMainCategory ? (
                            <><FaLock /> {isRtl ? 'المستوى 1 (مثبت)' : 'Level 1 (Anchored)'}</>
                          ) : (
                            <><FaStar style={{ color: '#f59e0b' }} /> {isRtl ? 'المستوى 1 (Root)' : 'Level 1 (Root)'}</>
                          )}
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
                          ? 'يظهر مباشرة في شريط التنقل العلوي للمتجر وواجهة الأقسام، وله تفرعات خاصة به.'
                          : 'Top-level root taxonomy node visible in header and navigation.'}
                      </p>
                    </div>
                  </div>

                  {/* Option 2: Subcategory / Level 2 */}
                  <div
                    className={`hierarchy-tile ${isSubcategory ? 'selected' : ''} ${isOriginalMainCategory ? 'disabled' : ''}`}
                    onClick={() => {
                      if (!isOriginalMainCategory) {
                        setIsSubcategory(true);
                      }
                    }}
                    title={isOriginalMainCategory ? (isRtl ? 'محمي من التحويل لفرعي' : 'Cannot convert root to sub') : ''}
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
                          ? 'يتفرع من قسم رئيسي آخر ويظهر تحته في القوائم المنسدلة وشريط الفلترة.'
                          : 'Nested child node belonging to an anchor parent category.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Subcategory Parent Picker and Live Visual Trail (Only when not a root category) */}
                {isSubcategory && !isOriginalMainCategory && (
                  <div className="parent-picker-wrapper">
                    <div className="parent-select-header">
                      <label>
                        {isRtl ? 'اختر القسم الأب (Parent Category)' : 'Select Parent Category'} <span className="required-star">*</span>
                      </label>
                      <span className="parent-count-tag">
                        {rootCategories.length} {isRtl ? 'أقسام رئيسية متاحة' : 'available'}
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
                          <FaFolder /> {rootCategories.find((c) => String(c.id) === String(parentId))?.name_ar || (isRtl ? 'القسم الأب' : 'Parent Category')}
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
                          {rootCategories.find((c) => String(c.id) === String(parentId))
                            ? `${rootCategories.find((c) => String(c.id) === String(parentId))?.name_ar} (/${rootCategories.find((c) => String(c.id) === String(parentId))?.slug})`
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
                            {nameAr || nameEn || (isRtl ? 'هذا القسم' : 'Current Category')} (/{slug || 'current-slug'})
                          </span>
                          <span className="node-badge sub-badge">{isRtl ? 'فرع تابع' : 'Sub'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Media & Icon with Raw SVG Support & Live Preview */}
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

                {/* Image Upload / URL Input */}
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

                {/* Icon URL / Raw SVG Code with Live Preview */}
                <div className="form-field" style={{ marginTop: 14 }}>
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

              {/* Commercial & Display Settings */}
              <div className="form-section-card">
                <div className="card-title-header">
                  <div className="title-left">
                    <div className="title-icon-box">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                    </div>
                    <h2>{isRtl ? 'إعدادات العرض والتسعير' : 'Pricing & Display'}</h2>
                  </div>
                </div>

                <div className="form-field">
                  <label>{isRtl ? 'سعر البداية التقريبي (يبدأ من ج.م)' : 'Starting Price (EGP)'}</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="650.00"
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label>{isRtl ? 'ترتيب الظهور في القوائم (Sort Order)' : 'Sort Order'}</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  />
                </div>

                {/* Home Grid Toggle */}
                <div className="setting-toggle-item">
                  <div className="toggle-info">
                    <strong>{isRtl ? 'عرض في شبكة الصفحة الرئيسية (Home Grid)' : 'Show in Homepage Grid'}</strong>
                    <p>{isRtl ? 'إظهار القسم ضمن بطاقات استعراض الفئات في الرئيسية' : 'Display this category on the homepage grid'}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={showInHomeGrid}
                    onChange={(e) => setShowInHomeGrid(e.target.checked)}
                  />
                </div>

                {/* Active Status Toggle */}
                <div className="setting-toggle-item">
                  <div className="toggle-info">
                    <strong>{isRtl ? 'حالة القسم (نشط / معطل)' : 'Category Status'}</strong>
                    <p>{isRtl ? 'إمكانية تصفح القسم والمنتجات المرتبطة به' : 'Make category accessible to store customers'}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                </div>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

export default function EditCategoryPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '1.1rem' }}>جاري التحميل...</div>}>
      <EditCategoryContent />
    </Suspense>
  );
}
