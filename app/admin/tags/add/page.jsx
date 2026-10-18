'use client';

import { useState, useEffect, useMemo } from 'react';
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
  FaTag,
  FaArrowRight,
  FaArrowLeft,
  FaCheck,
  FaTriangleExclamation,
  FaLightbulb,
  FaHashtag,
  FaFolderTree,
  FaCircleCheck,
} from 'react-icons/fa6';
import './AddTag.scss';

export default function AddTagPage() {
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
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);

  // Data from backend
  const [categories, setCategories] = useState([]);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [loadingPrereqs, setLoadingPrereqs] = useState(true);

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
  }, [status, session, router]);

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingPrereqs(true);
        const apiHost = getApiHost();

        const res = await fetch(`${apiHost}/api/v1/catalog/categories`);
        if (res.ok) {
          const data = await res.json();
          setCategories(data.data || []);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoadingPrereqs(false);
      }
    };
    fetchCategories();
  }, []);

  // Subcategories only & grouped by their parent category
  const groupedSubcategories = useMemo(() => {
    if (!categories || categories.length === 0) return [];

    // Parent root categories (parent_id is null)
    const roots = categories.filter((c) => !c.parent_id);
    // Subcategories (parent_id is not null)
    const subs = categories.filter((c) => !!c.parent_id);

    // Group subcategories under their respective parent category
    const groups = roots
      .map((root) => {
        const children = subs.filter((s) => String(s.parent_id) === String(root.id));
        return {
          parent: root,
          subcategories: children,
        };
      })
      .filter((g) => g.subcategories.length > 0);

    // Handle any orphan subcategories whose parent isn't in roots list
    const groupedSubIds = new Set(groups.flatMap((g) => g.subcategories.map((s) => s.id)));
    const orphans = subs.filter((s) => !groupedSubIds.has(s.id));
    if (orphans.length > 0) {
      groups.push({
        parent: {
          id: 'other',
          name_ar: 'أقسام فرعية أخرى',
          name_en: 'Other Subcategories',
        },
        subcategories: orphans,
      });
    }

    return groups;
  }, [categories]);

  // Total count of subcategories
  const totalSubcategoriesCount = useMemo(() => {
    return groupedSubcategories.reduce((acc, g) => acc + g.subcategories.length, 0);
  }, [groupedSubcategories]);

  // Filtered groups based on search term (searches subcategory name, slug, or parent name)
  const filteredGroups = useMemo(() => {
    const q = categorySearchQuery.toLowerCase().trim();
    if (!q) return groupedSubcategories;

    return groupedSubcategories
      .map((group) => {
        const parentMatches =
          (group.parent.name_ar && group.parent.name_ar.toLowerCase().includes(q)) ||
          (group.parent.name_en && group.parent.name_en.toLowerCase().includes(q));

        if (parentMatches) {
          return group;
        }

        const matchingSubs = group.subcategories.filter((sub) => {
          return (
            (sub.name_ar && sub.name_ar.toLowerCase().includes(q)) ||
            (sub.name_en && sub.name_en.toLowerCase().includes(q)) ||
            (sub.slug && sub.slug.toLowerCase().includes(q))
          );
        });

        return {
          ...group,
          subcategories: matchingSubs,
        };
      })
      .filter((group) => group.subcategories.length > 0);
  }, [groupedSubcategories, categorySearchQuery]);

  // Flat list of currently visible subcategories in filtered results
  const allFilteredSubcategoryIds = useMemo(() => {
    return filteredGroups.flatMap((g) => g.subcategories.map((s) => s.id));
  }, [filteredGroups]);

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

  // Toggle Category Checkbox
  const toggleCategory = (catId) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  // Select / Deselect All Filtered Subcategories
  const toggleSelectAllFiltered = () => {
    if (allFilteredSubcategoryIds.length === 0) return;
    const allSelected = allFilteredSubcategoryIds.every((id) => selectedCategoryIds.includes(id));
    if (allSelected) {
      setSelectedCategoryIds((prev) => prev.filter((id) => !allFilteredSubcategoryIds.includes(id)));
    } else {
      setSelectedCategoryIds((prev) => Array.from(new Set([...prev, ...allFilteredSubcategoryIds])));
    }
  };

  // Toggle all subcategories of a specific parent group
  const toggleSelectGroup = (groupSubcategories) => {
    const groupIds = groupSubcategories.map((s) => s.id);
    const allSelected = groupIds.every((id) => selectedCategoryIds.includes(id));
    if (allSelected) {
      setSelectedCategoryIds((prev) => prev.filter((id) => !groupIds.includes(id)));
    } else {
      setSelectedCategoryIds((prev) => Array.from(new Set([...prev, ...groupIds])));
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!nameAr.trim() || !nameEn.trim()) {
      setErrorMsg(isRtl ? 'يرجى إدخال اسم الوسم باللغتين العربية والإنجليزية.' : 'Please provide tag name in both Arabic and English.');
      return;
    }

    try {
      setSubmitting(true);
      const apiHost = getApiHost();

      const token = await ensureAuthToken();

      const payload = {
        name_ar: nameAr.trim(),
        name_en: nameEn.trim(),
        slug: slug.trim() || nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        category_ids: selectedCategoryIds,
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

      if (res.ok && data.success) {
        const msg = isRtl ? 'تم حفظ الوسم بنجاح وتفعيل قواعد الربط التلقائي!' : 'Tag created and linked successfully!';
        setSuccessMsg(msg);
        toast.success(msg, isRtl ? 'إضافة وسم' : 'Tag Created');
        setTimeout(() => {
          router.push('/admin/tags');
        }, 1200);
      } else {
        const msg = data.message || (isRtl ? 'تعذر حفظ الوسم. يرجى مراجعة البيانات.' : 'Failed to save tag.');
        setErrorMsg(msg);
        toast.error(msg, isRtl ? 'خطأ في الحفظ' : 'Tag Save Error');
      }
    } catch (err) {
      console.error('Error creating tag:', err);
      const msg = isRtl ? 'حدث خطأ غير متوقع أثناء الاتصال بالخادم.' : 'Unexpected network error occurred.';
      setErrorMsg(msg);
      toast.error(msg, isRtl ? 'خطأ في الاتصال' : 'Connection Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-add-tag-page" dir={isRtl ? 'rtl' : 'ltr'}>
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

        <main className="admin-add-tag-content">
          {/* Breadcrumb Header */}
          <div className="page-nav-header">
            <div className="breadcrumbs-line">
              <Link href="/admin">{isRtl ? 'لوحة التحكم' : 'Dashboard'}</Link>
              <span className="separator">/</span>
              <Link href="/admin/tags">{isRtl ? 'وسوم الربط (Tags)' : 'Rule Tags'}</Link>
              <span className="separator">/</span>
              <span className="current-crumb">{isRtl ? 'إضافة وسم جديد' : 'New Tag'}</span>
            </div>

            <Link href="/admin/tags" className="btn-back-link">
              {isRtl ? <FaArrowRight /> : <FaArrowLeft />}
              <span>{isRtl ? 'الرجوع إلى جدول الوسوم' : 'Back to Tags'}</span>
            </Link>
          </div>

          {/* Form Header Banner */}
          <div className="add-tag-title-banner">
            <div className="banner-icon-badge">
              <FaTag />
            </div>
            <div className="banner-text">
              <h1>{isRtl ? 'إضافة وسم ربط وتصنيف جديد' : 'Create New Rule Tag'}</h1>
              <p>
                {isRtl
                  ? 'قم بإنشاء الوسم وتعيين الأقسام المرتبطة به. أي منتج يحمل هذا الوسم سيتم إدراجه تلقائياً ضمن الأقسام المحددة.'
                  : 'Define tag names and map them to catalog categories for automated hybrid grouping.'}
              </p>
            </div>
          </div>

          {/* Alert messages */}
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

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="tag-form-layout">
            <div className="form-sections-grid">
              {/* Left/Main Column: Basic Details */}
              <div className="form-card-box">
                <div className="card-header">
                  <div className="card-header-icon">
                    <FaHashtag />
                  </div>
                  <div>
                    <h3>{isRtl ? 'بيانات الوسم الأساسية' : 'Tag Identity'}</h3>
                    <p className="card-subtitle">{isRtl ? 'الاسم باللغات المعيارية والمعرف اللطيف (Slug)' : 'Names and URL slug'}</p>
                  </div>
                </div>

                <div className="card-body">
                  <div className="input-field-group">
                    <label>
                      {isRtl ? 'اسم الوسم بالعربية' : 'Arabic Tag Name'}
                      <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control-input"
                      placeholder={isRtl ? 'مثال: سويتشات بو PoE' : 'e.g. سويتشات بو PoE'}
                      value={nameAr}
                      onChange={(e) => setNameAr(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-field-group">
                    <label>
                      {isRtl ? 'اسم الوسم بالإنجليزية' : 'English Tag Name'}
                      <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control-input"
                      placeholder="e.g. PoE Switches"
                      value={nameEn}
                      onChange={handleNameEnChange}
                      required
                    />
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
                      <span className="slug-prefix">#</span>
                      <input
                        type="text"
                        className="form-control-input slug-input"
                        placeholder="poe-switches"
                        value={slug}
                        onChange={(e) => {
                          setAutoSlug(false);
                          setSlug(e.target.value);
                        }}
                        required
                      />
                    </div>
                  </div>

                  {/* Info Notice Box */}
                  <div className="info-explanation-box">
                    <div className="info-icon">
                      <FaLightbulb />
                    </div>
                    <div className="info-content">
                      <strong>{isRtl ? 'قاعدة التصنيف التلقائي الذكي:' : 'Automated Mapping Rule:'}</strong>
                      <p>
                        {isRtl
                          ? 'عند إضافة منتجات لاحقاً وتحديد هذا الوسم لها، سيقوم النظام تلقائياً بربطها في الأقسام المحددة في الجدول الجانبي دون الحاجة لتحديدها يدوياً كل مرة.'
                          : 'Any products assigned this tag will inherit catalog categorization according to your selected categories.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Category Mapping Selector */}
              <div className="form-card-box">
                <div className="card-header">
                  <div className="card-header-icon categories-icon">
                    <FaFolderTree />
                  </div>
                  <div>
                    <h3>{isRtl ? 'ربط الوسم بالأقسام المستهدفة' : 'Linked Subcategories'}</h3>
                    <p className="card-subtitle">
                      {isRtl
                        ? `تم تحديد ${selectedCategoryIds.length} من أصل ${totalSubcategoriesCount} قسم فرعي`
                        : `${selectedCategoryIds.length} of ${totalSubcategoriesCount} subcategories selected`}
                    </p>
                  </div>
                </div>

                <div className="card-body">
                  <div className="categories-filter-bar">
                    <input
                      type="text"
                      className="category-search-input"
                      placeholder={isRtl ? 'ابحث في الأقسام الفرعية...' : 'Search subcategories...'}
                      value={categorySearchQuery}
                      onChange={(e) => setCategorySearchQuery(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-select-all-cats"
                      onClick={toggleSelectAllFiltered}
                      title={isRtl ? 'تحديد أو إلغاء تحديد كل الأقسام الفرعية المعروضة' : 'Toggle all filtered subcategories'}
                    >
                      {isRtl ? 'تحديد / إلغاء المعروض' : 'Toggle Filtered'}
                    </button>
                  </div>

                  <div className="categories-checkbox-list">
                    {loadingPrereqs ? (
                      <div className="loading-cats-placeholder">
                        <span className="spinner-dots"></span>
                        <span>{isRtl ? 'جاري تحميل الأقسام من قاعدة البيانات...' : 'Loading categories...'}</span>
                      </div>
                    ) : filteredGroups.length === 0 ? (
                      <div className="empty-cats-notice">
                        {isRtl ? 'لا توجد أقسام فرعية مطابقة للبحث' : 'No matching subcategories found'}
                      </div>
                    ) : (
                      filteredGroups.map((group) => {
                        const groupIds = group.subcategories.map((s) => s.id);
                        const allGroupSelected =
                          groupIds.length > 0 && groupIds.every((id) => selectedCategoryIds.includes(id));

                        return (
                          <div key={group.parent.id} className="category-parent-group">
                            <div className="parent-group-header">
                              <div className="parent-info">
                                <FaFolderTree className="parent-icon" />
                                <span>{isRtl ? group.parent.name_ar : group.parent.name_en}</span>
                                <span className="parent-badge">
                                  {group.subcategories.length} {isRtl ? 'أقسام فرعية' : 'subcategories'}
                                </span>
                              </div>
                              <button
                                type="button"
                                className="btn-group-toggle-all"
                                onClick={() => toggleSelectGroup(group.subcategories)}
                              >
                                {allGroupSelected
                                  ? (isRtl ? 'إلغاء تحديد القسم' : 'Deselect Group')
                                  : (isRtl ? 'تحديد الكل في هذا القسم' : 'Select All')}
                              </button>
                            </div>

                            <div className="parent-subcategories-grid">
                              {group.subcategories.map((sub) => {
                                const isSelected = selectedCategoryIds.includes(sub.id);
                                return (
                                  <label
                                    key={sub.id}
                                    className={`category-item-label ${isSelected ? 'selected' : ''}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleCategory(sub.id)}
                                    />
                                    <div className="cat-info-wrap">
                                      <span className="cat-name">
                                        {isRtl ? sub.name_ar : sub.name_en}
                                      </span>
                                      <span className="cat-meta">
                                        {sub.slug}
                                      </span>
                                    </div>
                                    {isSelected && <FaCheck className="check-icon" />}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    )}
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
                className="btn-submit-tag"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="btn-spinner"></span>
                    <span>{isRtl ? 'جاري الحفظ والربط...' : 'Saving Tag...'}</span>
                  </>
                ) : (
                  <>
                    <FaCheck />
                    <span>{isRtl ? 'حفظ الوسم والربط التلقائي' : 'Save & Link Tag'}</span>
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
