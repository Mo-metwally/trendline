'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/src/components/common/Navbar/Navbar';
import Footer from '@/src/components/common/Footer/Footer';
import StoreProductCard from '@/src/components/common/StoreProductCard/StoreProductCard';
import { useToast } from '@/src/components/adminComponents';
import { getApiHost } from '@/src/utils/apiConfig';
import useTrendlineLang from '@/src/hooks/useTrendlineLang';
import {
  FaHouse,
  FaChevronLeft,
  FaChevronRight,
  FaMagnifyingGlass,
  FaLayerGroup,
  FaSitemap,
  FaBoxOpen,
  FaArrowLeft,
  FaFilter,
  FaRotateLeft,
  FaShareNodes,
  FaXmark,
  FaUpRightFromSquare,
  FaTags,
  FaBolt,
  FaGrip,
  FaList,
  FaTableCellsLarge,
} from 'react-icons/fa6';
import './CategoriesPage.scss';

function renderCategoryThumb(cat) {
  const imgSrc =
    cat.image_url ||
    (cat.icon_url && !cat.icon_url.trim().startsWith('<svg') ? cat.icon_url : '');
  if (imgSrc) {
    return (
      <img
        src={imgSrc}
        alt={cat.name_ar || cat.name_en || ''}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = '/assets/placeholder-tech.png';
        }}
      />
    );
  }
  return <FaLayerGroup />;
}

function AllCategoriesContent() {
  const { lang, isRtl, setLang } = useTrendlineLang('ar');
  const currencyLabel = isRtl ? 'ج.م' : 'EGP';

  const searchParams = useSearchParams();
  const toast = useToast();
  const initialSearch = searchParams?.get('search') || '';
  const initialCat = searchParams?.get('category') || 'all';

  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Category-Focused Filter & View Mode States
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCat); // 'all' or category.id
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [onlyWithSubcats, setOnlyWithSubcats] = useState(false);
  const [onlyWithOffers, setOnlyWithOffers] = useState(false);
  const [catSortBy, setCatSortBy] = useState('default'); // 'default' | 'products_desc' | 'subcats_desc' | 'price_asc' | 'name_asc'
  const [hubViewMode, setHubViewMode] = useState('sections'); // 'sections' | 'bento_grid' | 'directory_matrix'

  useEffect(() => {
    let isMounted = true;

    async function fetchCatalog() {
      setLoading(true);
      try {
        const apiBase = getApiHost();
        const [catsRes, prodsRes] = await Promise.all([
          fetch(`${apiBase}/api/v1/catalog/categories?include_inactive=false`),
          fetch(`${apiBase}/api/v1/catalog/products?limit=150&is_active=true`),
        ]);

        const catsJson = await catsRes.json();
        const prodsJson = await prodsRes.json();

        if (!isMounted) return;

        if (catsJson?.success && Array.isArray(catsJson.data)) {
          setCategories(catsJson.data);
        }
        if (prodsJson?.success && Array.isArray(prodsJson.data)) {
          setAllProducts(prodsJson.data);
        }
      } catch (err) {
        console.error('Error loading categories hub:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Root categories & flat lookup
  const rootCategories = useMemo(
    () => categories.filter((c) => !c.parent_id),
    [categories]
  );

  const flatCategories = useMemo(() => {
    const list = [];
    categories.forEach((c) => {
      list.push(c);
      if (Array.isArray(c.subcategories)) {
        c.subcategories.forEach((sub) => {
          if (!list.find((x) => String(x.id) === String(sub.id))) {
            list.push({ ...sub, parent_id: sub.parent_id || c.id, parent: c });
          }
        });
      }
    });
    return list;
  }, [categories]);

  const totalSubcategoriesCount = useMemo(() => {
    return rootCategories.reduce(
      (sum, rc) =>
        sum + (rc.subcategories || []).filter((s) => s.is_active !== false).length,
      0
    );
  }, [rootCategories]);

  // Available brands across catalog
  const availableBrands = useMemo(() => {
    const map = new Map();
    allProducts.forEach((p) => {
      if (p.brand && p.brand.id) {
        const prev = map.get(p.brand.id) || {
          id: p.brand.id,
          name: p.brand.name_en || p.brand.name_ar,
          count: 0,
        };
        prev.count += 1;
        map.set(p.brand.id, prev);
      }
    });
    return Array.from(map.values());
  }, [allProducts]);

  // Helper: get all products belonging to a category (and its subcategories)
  const getCategoryProducts = (catObj) => {
    const validCatIds = new Set([
      String(catObj.id),
      ...(catObj.subcategories || []).map((s) => String(s.id)),
    ]);

    return allProducts.filter((prod) => {
      const inCat = (prod.categories || []).some((c) => validCatIds.has(String(c.id)));
      if (!inCat) return false;

      if (selectedBrand !== 'all' && String(prod.brand?.id) !== String(selectedBrand)) {
        return false;
      }

      if (onlyWithOffers) {
        const sale = Number(prod.sale_price || 0);
        const orig = Number(prod.original_price || 0);
        const hasOffer = (sale > 0 && orig > sale) || Number(prod.discount_percent || 0) > 0;
        if (!hasOffer) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const catMatches =
          (catObj.name_ar || '').toLowerCase().includes(q) ||
          (catObj.name_en || '').toLowerCase().includes(q) ||
          (catObj.subcategories || []).some(
            (s) =>
              (s.name_ar || '').toLowerCase().includes(q) ||
              (s.name_en || '').toLowerCase().includes(q)
          );
        if (catMatches) return true;

        return (
          (prod.name_ar || '').toLowerCase().includes(q) ||
          (prod.name_en || '').toLowerCase().includes(q) ||
          (prod.sku || '').toLowerCase().includes(q) ||
          (prod.brand?.name_en || '').toLowerCase().includes(q) ||
          (prod.brand?.name_ar || '').toLowerCase().includes(q)
        );
      }

      return true;
    });
  };

  // Filtered Category Sections to display in the main showcase
  const displayedCategorySections = useMemo(() => {
    let baseList = [];

    if (selectedCategory === 'all') {
      baseList = rootCategories;
    } else {
      const target = flatCategories.find(
        (c) => String(c.id) === String(selectedCategory)
      );
      if (target) {
        baseList = [target];
      } else {
        baseList = rootCategories;
      }
    }

    const mapped = baseList
      .filter((cat) => {
        if (onlyWithSubcats) {
          const subs = (cat.subcategories || []).filter((s) => s.is_active !== false);
          if (subs.length === 0) return false;
        }

        if (searchQuery.trim() || selectedBrand !== 'all' || onlyWithOffers) {
          const q = searchQuery.trim().toLowerCase();
          const nameMatch =
            q &&
            ((cat.name_ar || '').toLowerCase().includes(q) ||
              (cat.name_en || '').toLowerCase().includes(q) ||
              (cat.description_ar || '').toLowerCase().includes(q));
          const matchingProds = getCategoryProducts(cat);
          return nameMatch || matchingProds.length > 0;
        }

        return true;
      })
      .map((cat) => {
        const catProducts = getCategoryProducts(cat);
        const activeSubs = (cat.subcategories || []).filter(
          (s) => s.is_active !== false
        );
        const prices = catProducts
          .map((p) => Number(p.sale_price || p.original_price || 0))
          .filter((n) => n > 0);
        const minCatPrice =
          prices.length > 0
            ? Math.min(...prices)
            : Number(cat.starting_price || 0);

        return {
          category: cat,
          subcategories: activeSubs,
          totalProductsCount: catProducts.length || Number(cat.products_count || 0),
          previewProducts: catProducts.slice(0, 4),
          minCatPrice,
        };
      });

    if (catSortBy === 'products_desc') {
      mapped.sort((a, b) => b.totalProductsCount - a.totalProductsCount);
    } else if (catSortBy === 'subcats_desc') {
      mapped.sort((a, b) => b.subcategories.length - a.subcategories.length);
    } else if (catSortBy === 'price_asc') {
      mapped.sort((a, b) => (a.minCatPrice || 999999) - (b.minCatPrice || 999999));
    } else if (catSortBy === 'name_asc') {
      mapped.sort((a, b) => {
        const nameA = isRtl
          ? (a.category.name_ar || a.category.name_en || '')
          : (a.category.name_en || a.category.name_ar || '');
        const nameB = isRtl
          ? (b.category.name_ar || b.category.name_en || '')
          : (b.category.name_en || b.category.name_ar || '');
        return nameA.localeCompare(nameB, isRtl ? 'ar' : 'en');
      });
    }

    return mapped;
  }, [
    rootCategories,
    flatCategories,
    selectedCategory,
    onlyWithSubcats,
    onlyWithOffers,
    searchQuery,
    selectedBrand,
    catSortBy,
    allProducts,
    isRtl,
  ]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setOnlyWithSubcats(false);
    setOnlyWithOffers(false);
  };

  const handleShareShortProductLink = (e, prod) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window === 'undefined') return;
    const shortUrl = `${window.location.origin}/pd/${encodeURIComponent(prod.id)}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shortUrl);
      toast.success(
        isRtl
          ? `تم نسخ الرابط القصير للمنتج: /pd/${prod.id}`
          : `Product short link copied: /pd/${prod.id}`
      );
    }
  };

  const activeCategoryObj = useMemo(() => {
    if (selectedCategory === 'all') return null;
    return (
      flatCategories.find(
        (c) =>
          String(c.id) === String(selectedCategory) ||
          String(c.slug) === String(selectedCategory)
      ) || null
    );
  }, [flatCategories, selectedCategory]);

  return (
    <div suppressHydrationWarning className="cats-page-wrapper" dir={isRtl ? 'rtl' : 'ltr'}>
      <Navbar lang={lang} onToggleLang={setLang} />

      <div className="cats-container">
        {/* ================= SMOOTH TOP HEADER FOR CATEGORIES HUB ================= */}
        <div className="ecom-cat-slim-header">
          <div className="slim-top-crumbs">
            <nav className="ecom-breadcrumbs" aria-label="Breadcrumb">
              <Link href="/">
                <FaHouse size={12} />
                <span>{isRtl ? 'الرئيسية' : 'Home'}</span>
              </Link>
              {isRtl ? <FaChevronLeft size={9} /> : <FaChevronRight size={9} />}
              <span className="current">
                {isRtl ? 'دليل الأقسام والتصنيفات' : 'Categories Directory'}
              </span>
              {activeCategoryObj && (
                <>
                  {isRtl ? <FaChevronLeft size={9} /> : <FaChevronRight size={9} />}
                  <span className="current">
                    {isRtl
                      ? (activeCategoryObj.name_ar || activeCategoryObj.name_en)
                      : (activeCategoryObj.name_en || activeCategoryObj.name_ar)}
                  </span>
                </>
              )}
            </nav>

            <div className="slim-meta-pills">
              <span className="meta-pill">
                <FaLayerGroup size={12} />
                <strong>{rootCategories.length}</strong>{' '}
                {isRtl ? 'أقسام رئيسية' : 'Main Categories'}
              </span>
              <span className="meta-pill">
                <FaSitemap size={12} />
                <strong>{totalSubcategoriesCount}</strong>{' '}
                {isRtl ? 'أقسام فرعية' : 'Subcategories'}
              </span>
              <span className="meta-pill">
                <FaBoxOpen size={12} />
                <strong>{allProducts.length}</strong>{' '}
                {isRtl ? 'منتج متاح' : 'Available Products'}
              </span>
            </div>
          </div>

          <div className="slim-main-row">
            <div className="slim-title-wrap">
              <h1>
                {isRtl
                  ? 'الأقسام والتصنيفات المعتمدة'
                  : 'Approved Categories & Departments'}
              </h1>
              <span className="slim-subtitle">
                {isRtl
                  ? 'استعرض الأقسام الرئيسية والفرعية مع عينة مختارة من أبرز منتجات كل قسم'
                  : 'Explore main and subcategories along with curated featured products'}
              </span>
            </div>

            <Link
              href="/products"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '11px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#1d4ed8',
                fontWeight: 800,
                fontSize: '13px',
                textDecoration: 'none',
              }}
            >
              <span>
                {isRtl
                  ? `تصفح كتالوج جميع المنتجات (${allProducts.length})`
                  : `Browse All Products Catalog (${allProducts.length})`}
              </span>
              {isRtl ? <FaArrowLeft size={11} /> : <FaChevronRight size={11} />}
            </Link>
          </div>
        </div>

        {/* ================= VISUAL ROOT CATEGORIES SHOWCASE STRIP ================= */}
        <div className="ecom-visual-cats-strip">
          <div
            role="button"
            tabIndex={0}
            className={`visual-cat-tile all-cats-tile ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
            onKeyDown={(e) => e.key === 'Enter' && setSelectedCategory('all')}
          >
            <div className="vct-thumb all-thumb">
              <div className="all-icon-circle">
                <FaLayerGroup />
              </div>
              <span className="vct-count-pill">
                {rootCategories.length} {isRtl ? 'أقسام رئيسية' : 'Main Categories'}
              </span>
            </div>
            <div className="vct-info">
              <span className="vct-name">
                {isRtl ? 'جميع الأقسام والتصنيفات' : 'All Categories & Departments'}
              </span>
              <span className="vct-meta">
                {isRtl
                  ? `${totalSubcategoriesCount} فرع متخصص • ${allProducts.length} منتج`
                  : `${totalSubcategoriesCount} Subcategories • ${allProducts.length} Products`}
              </span>
            </div>
          </div>

          {rootCategories.map((rc) => {
            const isSelected =
              String(selectedCategory) === String(rc.id) ||
              (activeCategoryObj && String(activeCategoryObj.parent_id) === String(rc.id));
            const dedicatedUrl = `/categories/${encodeURIComponent(rc.id)}/${encodeURIComponent(rc.slug || rc.id)}`;
            const subCount = (rc.subcategories || []).filter((s) => s.is_active !== false).length;
            const rcName = isRtl
              ? (rc.name_ar || rc.name_en)
              : (rc.name_en || rc.name_ar);

            return (
              <div
                key={rc.id}
                role="button"
                tabIndex={0}
                className={`visual-cat-tile ${isSelected ? 'active' : ''}`}
                onClick={() =>
                  setSelectedCategory(
                    String(selectedCategory) === String(rc.id) ? 'all' : String(rc.id)
                  )
                }
                onKeyDown={(e) =>
                  e.key === 'Enter' &&
                  setSelectedCategory(
                    String(selectedCategory) === String(rc.id) ? 'all' : String(rc.id)
                  )
                }
              >
                <div className="vct-thumb">
                  {renderCategoryThumb(rc)}
                  <span className="vct-count-pill">
                    {rc.products_count || 0} {isRtl ? 'منتج' : 'Products'}
                  </span>
                  <Link
                    href={dedicatedUrl}
                    className="vct-page-link"
                    title={
                      isRtl
                        ? `فتح صفحة قسم ${rcName} المستقلة`
                        : `Open ${rcName} Dedicated Page`
                    }
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FaUpRightFromSquare />
                  </Link>
                </div>
                <div className="vct-info">
                  <span className="vct-name">{rcName}</span>
                  <span className="vct-meta">
                    {subCount > 0
                      ? (isRtl
                          ? `${subCount} أقسام فرعية متخصصة`
                          : `${subCount} Subcategories`)
                      : (isRtl ? 'تصفح القسم والمنتجات' : 'Browse Category & Products')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ================= 2-COLUMN WORKSPACE: SIDEBAR + CATEGORIES SHOWCASE ================= */}
        {loading ? (
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '56px 24px',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
            }}
          >
            <p style={{ fontSize: '16px', fontWeight: 800, color: '#1d4ed8', margin: 0 }}>
              {isRtl
                ? 'جاري تحميل الأقسام والتصنيفات...'
                : 'Loading categories and departments...'}
            </p>
          </div>
        ) : (
          <div className="single-cat-workspace">
            {/* ================= SIDEBAR: CATEGORY TREE & FILTERS ================= */}
            <aside className="cat-filters-sidebar">
              <div className="sidebar-head">
                <h4>
                  <FaFilter color="#1d4ed8" />
                  <span>{isRtl ? 'فلترة الأقسام' : 'Filter Categories'}</span>
                </h4>
                <button
                  type="button"
                  className="reset-btn"
                  onClick={handleResetFilters}
                >
                  <FaRotateLeft style={{ marginLeft: isRtl ? '4px' : 0, marginRight: isRtl ? 0 : '4px' }} />
                  {isRtl ? 'إعادة ضبط' : 'Reset'}
                </button>
              </div>

              {/* 1. Search Categories or Subcategories */}
              <div className="filter-group">
                <span className="fg-title">
                  {isRtl ? 'بحث في الأقسام أو المنتجات' : 'Search Categories or Products'}
                </span>
                <div className="sidebar-search-box">
                  <FaMagnifyingGlass className="s-ic" />
                  <input
                    type="text"
                    placeholder={
                      isRtl
                        ? 'ابحث باسم القسم، الفرع، أو المنتج...'
                        : 'Search by category, subcategory, or product...'
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="s-clear"
                      onClick={() => setSearchQuery('')}
                      aria-label={isRtl ? 'مسح البحث' : 'Clear search'}
                    >
                      <FaXmark />
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Interactive Category & Subcategory Tree */}
              <div className="filter-group">
                <span className="fg-title">
                  {isRtl ? 'شجرة الأقسام والفروع' : 'Category Tree & Branches'}
                </span>
                <div className="sidebar-cat-tree">
                  <div className="tree-root-item">
                    <button
                      type="button"
                      className={`tree-btn-row ${selectedCategory === 'all' ? 'active' : ''}`}
                      onClick={() => setSelectedCategory('all')}
                    >
                      <span className="tree-lbl">
                        <FaLayerGroup size={12} />
                        <span>{isRtl ? 'جميع الأقسام الرئيسية' : 'All Main Categories'}</span>
                      </span>
                      <span className="tree-count">{rootCategories.length}</span>
                    </button>
                  </div>

                  {rootCategories.map((root) => {
                    const isRootActive =
                      String(selectedCategory) === String(root.id) ||
                      (activeCategoryObj &&
                        String(activeCategoryObj.parent_id) === String(root.id));
                    const subs = (root.subcategories || []).filter(
                      (s) => s.is_active !== false
                    );
                    const rootName = isRtl
                      ? (root.name_ar || root.name_en)
                      : (root.name_en || root.name_ar);

                    return (
                      <div className="tree-root-item" key={root.id}>
                        <button
                          type="button"
                          className={`tree-btn-row ${isRootActive ? 'active' : ''}`}
                          onClick={() => setSelectedCategory(String(root.id))}
                        >
                          <span className="tree-lbl">
                            <span>{rootName}</span>
                          </span>
                          <span className="tree-count">{root.products_count || 0}</span>
                        </button>

                        {subs.length > 0 && (
                          <div className="tree-sub-list">
                            {subs.map((sub) => {
                              const isSubSelected =
                                String(selectedCategory) === String(sub.id);
                              const subName = isRtl
                                ? (sub.name_ar || sub.name_en)
                                : (sub.name_en || sub.name_ar);
                              return (
                                <button
                                  key={sub.id}
                                  type="button"
                                  className={`tree-sub-btn ${isSubSelected ? 'active' : ''}`}
                                  onClick={() => setSelectedCategory(String(sub.id))}
                                >
                                  <span>{subName}</span>
                                  <span className="sub-cnt">{sub.products_count || 0}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Category Preferences Filter */}
              <div className="filter-group">
                <span className="fg-title">{isRtl ? 'خيارات العرض' : 'Display Options'}</span>
                <div className="fg-options">
                  <label className="fg-check-row">
                    <span className="label-left">
                      <input
                        type="checkbox"
                        checked={onlyWithSubcats}
                        onChange={(e) => setOnlyWithSubcats(e.target.checked)}
                      />
                      <span>
                        {isRtl ? 'الأقسام التي تضم فروعاً فقط' : 'Categories with subcategories only'}
                      </span>
                    </span>
                  </label>
                  <label className="fg-check-row">
                    <span className="label-left">
                      <input
                        type="checkbox"
                        checked={onlyWithOffers}
                        onChange={(e) => setOnlyWithOffers(e.target.checked)}
                      />
                      <span>
                        {isRtl ? 'عرض منتجات العروض والخصومات فقط' : 'Discounted & offer products only'}
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              {/* 4. Filter Category Preview by Brand */}
              {availableBrands.length > 0 && (
                <div className="filter-group">
                  <span className="fg-title">
                    {isRtl ? 'تصفية حسب العلامة التجارية' : 'Filter by Brand'}
                  </span>
                  <div className="fg-options">
                    <label className="fg-check-row">
                      <span className="label-left">
                        <input
                          type="radio"
                          name="cat_hub_brand"
                          checked={selectedBrand === 'all'}
                          onChange={() => setSelectedBrand('all')}
                        />
                        <span>{isRtl ? 'جميع الماركات' : 'All Brands'}</span>
                      </span>
                      <span className="opt-count">{allProducts.length}</span>
                    </label>
                    {availableBrands.map((b) => (
                      <label className="fg-check-row" key={b.id}>
                        <span className="label-left">
                          <input
                            type="radio"
                            name="cat_hub_brand"
                            checked={String(selectedBrand) === String(b.id)}
                            onChange={() => setSelectedBrand(String(b.id))}
                          />
                          <span>{b.name}</span>
                        </span>
                        <span className="opt-count">{b.count}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </aside>

            {/* ================= MAIN AREA: CATEGORIES SHOWCASE WITH 3 VIEW MODES ================= */}
            <div className="cat-products-main">
              {/* Top Toolbar: Category Count + Active Filters + Category Sort + 3 View Modes */}
              <div className="cat-toolbar">
                <div className="results-summary">
                  <span>
                    {isRtl ? (
                      <>
                        عرض <strong>{displayedCategorySections.length}</strong> أقسام رئيسية
                      </>
                    ) : (
                      <>
                        Showing <strong>{displayedCategorySections.length}</strong> Main Categories
                      </>
                    )}
                  </span>

                  {activeCategoryObj && (
                    <span
                      className="active-filter-tag"
                      onClick={() => setSelectedCategory('all')}
                    >
                      <span>
                        {isRtl ? 'القسم: ' : 'Category: '}
                        {isRtl
                          ? (activeCategoryObj.name_ar || activeCategoryObj.name_en)
                          : (activeCategoryObj.name_en || activeCategoryObj.name_ar)}
                      </span>
                      <FaXmark size={11} />
                    </span>
                  )}

                  {selectedBrand !== 'all' && (
                    <span
                      className="active-filter-tag"
                      onClick={() => setSelectedBrand('all')}
                    >
                      <span>
                        {isRtl ? 'الماركة: ' : 'Brand: '}
                        {availableBrands.find((b) => String(b.id) === String(selectedBrand))
                          ?.name || selectedBrand}
                      </span>
                      <FaXmark size={11} />
                    </span>
                  )}

                  {onlyWithOffers && (
                    <span
                      className="active-filter-tag"
                      onClick={() => setOnlyWithOffers(false)}
                    >
                      <span>{isRtl ? 'عروض وخصومات فقط' : 'Offers & Discounts Only'}</span>
                      <FaXmark size={11} />
                    </span>
                  )}
                </div>

                <div className="toolbar-controls">
                  <select
                    className="sort-select"
                    value={catSortBy}
                    onChange={(e) => setCatSortBy(e.target.value)}
                    aria-label={isRtl ? 'ترتيب الأقسام' : 'Sort categories'}
                  >
                    <option value="default">
                      {isRtl ? 'ترتيب الأقسام: الافتراضي' : 'Category Sorting: Default'}
                    </option>
                    <option value="products_desc">
                      {isRtl ? 'الأكثر منتجات أولاً' : 'Most Products First'}
                    </option>
                    <option value="subcats_desc">
                      {isRtl ? 'الأكثر أقساماً فرعية' : 'Most Subcategories'}
                    </option>
                    <option value="price_asc">
                      {isRtl ? 'الأقل سعراً يبدأ من' : 'Lowest Price Starts From'}
                    </option>
                    <option value="name_asc">
                      {isRtl ? 'الاسم: أ - ي' : 'Name: A - Z'}
                    </option>
                  </select>

                  <div className="view-mode-btns">
                    <button
                      type="button"
                      className={hubViewMode === 'sections' ? 'active' : ''}
                      onClick={() => setHubViewMode('sections')}
                      title={
                        isRtl
                          ? 'عرض أقسام مفصّلة مع مختارات المنتجات'
                          : 'Detailed sections with product highlights'
                      }
                    >
                      <FaTableCellsLarge />
                      <span>{isRtl ? 'أقسام + مختارات' : 'Sections + Picks'}</span>
                    </button>
                    <button
                      type="button"
                      className={hubViewMode === 'bento_grid' ? 'active' : ''}
                      onClick={() => setHubViewMode('bento_grid')}
                      title={
                        isRtl
                          ? 'عرض شبكة بطاقات الكاتيجوريز'
                          : 'Visual category cards grid'
                      }
                    >
                      <FaGrip />
                      <span>{isRtl ? 'بطاقات الأقسام' : 'Category Cards'}</span>
                    </button>
                    <button
                      type="button"
                      className={hubViewMode === 'directory_matrix' ? 'active' : ''}
                      onClick={() => setHubViewMode('directory_matrix')}
                      title={
                        isRtl
                          ? 'عرض الدليل الشجري المدمج للأقسام والفروع'
                          : 'Compact directory tree of categories & branches'
                      }
                    >
                      <FaList />
                      <span>{isRtl ? 'الدليل الشجري' : 'Directory Tree'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {displayedCategorySections.length === 0 ? (
                <div className="empty-cat-state">
                  <div className="empty-icon">
                    <FaLayerGroup />
                  </div>
                  <h3>
                    {isRtl
                      ? 'لا توجد أقسام مطابقة للفلاتر الحالية'
                      : 'No categories match current filters'}
                  </h3>
                  <p>
                    {isRtl
                      ? 'جرّب مسح البحث أو اختيار جميع الأقسام لاستعراض دليل الأقسام الكامل.'
                      : 'Try clearing your search or selecting all categories to view the catalog.'}
                  </p>
                  <button
                    type="button"
                    className="clear-filters-btn"
                    onClick={handleResetFilters}
                  >
                    {isRtl ? 'عرض جميع الأقسام' : 'View All Categories'}
                  </button>
                </div>
              ) : hubViewMode === 'sections' ? (
                /* ================= VIEW MODE 1: DETAILED SECTIONS + SUBCATEGORIES + 4 SAMPLE PRODUCTS ================= */
                <div className="cats-hub-sections-list">
                  {displayedCategorySections.map(
                    ({
                      category: cat,
                      subcategories: subs,
                      totalProductsCount,
                      previewProducts,
                      minCatPrice,
                    }) => {
                      const catUrl = `/categories/${encodeURIComponent(cat.id)}/${encodeURIComponent(cat.slug || cat.id)}`;
                      const catName = isRtl
                        ? (cat.name_ar || cat.name_en)
                        : (cat.name_en || cat.name_ar);

                      return (
                        <section className="cat-hub-section-card" key={cat.id}>
                          {/* 1. Category Main Header Banner */}
                          <div className="cat-hub-header">
                            <div className="ch-identity">
                              <Link href={catUrl} className="ch-hero-thumb">
                                {renderCategoryThumb(cat)}
                              </Link>

                              <div className="ch-titles">
                                <div className="ch-badges-row">
                                  <span className="ch-badge primary">
                                    <FaBoxOpen size={11} />
                                    <span>
                                      {totalProductsCount}{' '}
                                      {isRtl ? 'منتج في القسم' : 'products in category'}
                                    </span>
                                  </span>
                                  {subs.length > 0 && (
                                    <span className="ch-badge sub">
                                      <FaSitemap size={11} />
                                      <span>
                                        {subs.length}{' '}
                                        {isRtl ? 'أقسام فرعية' : 'subcategories'}
                                      </span>
                                    </span>
                                  )}
                                  {minCatPrice > 0 && (
                                    <span className="ch-badge price">
                                      <span>
                                        {isRtl ? 'يبدأ من ' : 'Starts from '}
                                        <strong>
                                          {minCatPrice.toLocaleString()} {currencyLabel}
                                        </strong>
                                      </span>
                                    </span>
                                  )}
                                </div>

                                <h2>
                                  <Link href={catUrl}>{catName}</Link>
                                </h2>

                                <p>
                                  {isRtl
                                    ? (cat.description_ar ||
                                        cat.description_en ||
                                        `تصفح أحدث منتجات وأجهزة ${catName} الأصلية بضمان الوكيل المعتمد من ترند لاين.`)
                                    : (cat.description_en ||
                                        cat.description_ar ||
                                        `Browse genuine ${catName} devices and solutions with authorized dealer warranty from Trendline.`)}
                                </p>
                              </div>
                            </div>

                            <Link href={catUrl} className="ch-explore-all-btn">
                              <span>
                                {isRtl
                                  ? `تصفح كل منتجات القسم (${totalProductsCount})`
                                  : `Browse All Products (${totalProductsCount})`}
                              </span>
                              {isRtl ? <FaArrowLeft size={12} /> : <FaChevronRight size={12} />}
                            </Link>
                          </div>

                          {/* 2. Subcategories Visual Cards Row */}
                          {subs.length > 0 && (
                            <div className="cat-hub-subcats-block">
                              <div className="block-label">
                                <FaSitemap color="#2563eb" size={13} />
                                <span>
                                  {isRtl
                                    ? `الأقسام الفرعية المتخصصة داخل ${catName}:`
                                    : `Specialized subcategories in ${catName}:`}
                                </span>
                              </div>

                              <div className="subcats-visual-grid">
                                {subs.map((sub) => {
                                  const subUrl = `/categories/${encodeURIComponent(sub.id)}/${encodeURIComponent(sub.slug || sub.id)}`;
                                  const subName = isRtl
                                    ? (sub.name_ar || sub.name_en)
                                    : (sub.name_en || sub.name_ar);
                                  return (
                                    <Link
                                      href={subUrl}
                                      className="subcat-showcase-card"
                                      key={sub.id}
                                    >
                                      <div className="sc-thumb">
                                        {renderCategoryThumb(sub)}
                                      </div>
                                      <div className="sc-info">
                                        <h4>{subName}</h4>
                                        <span>
                                          {sub.products_count || 0}{' '}
                                          {isRtl
                                            ? 'منتج متاح • استعراض الفرع'
                                            : 'Products Available • Explore'}
                                        </span>
                                      </div>
                                      {isRtl ? (
                                        <FaArrowLeft className="sc-arrow" size={12} />
                                      ) : (
                                        <FaChevronRight className="sc-arrow" size={12} />
                                      )}
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* 3. Small Curated Sample of 4 Products from this Category */}
                          {previewProducts.length > 0 && (
                            <div className="cat-hub-preview-block">
                              <div className="preview-block-head">
                                <span className="pb-title">
                                  <FaBolt color="#f59e0b" size={13} />
                                  <span>
                                    {isRtl
                                      ? `مختارات من منتجات ${catName}`
                                      : `Featured ${catName} Products`}
                                  </span>
                                </span>
                                <Link href={catUrl} className="pb-more-link">
                                  <span>
                                    {isRtl
                                      ? `عرض الكل (${totalProductsCount})`
                                      : `View All (${totalProductsCount})`}
                                  </span>
                                  {isRtl ? <FaArrowLeft size={11} /> : <FaChevronRight size={11} />}
                                </Link>
                              </div>

                              <div className="cat-products-grid">
                                {previewProducts.map((prod) => (
                                  <StoreProductCard
                                    key={prod.id}
                                    product={prod}
                                    lang={lang}
                                    onShareClick={handleShareShortProductLink}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </section>
                      );
                    }
                  )}
                </div>
              ) : hubViewMode === 'bento_grid' ? (
                /* ================= VIEW MODE 2: VISUAL CATEGORY BENTO CARDS GRID ================= */
                <section className="cats-bento-grid">
                  {displayedCategorySections.map(
                    ({
                      category: cat,
                      subcategories: subs,
                      totalProductsCount,
                      previewProducts,
                      minCatPrice,
                    }) => {
                      const catUrl = `/categories/${encodeURIComponent(cat.id)}/${encodeURIComponent(cat.slug || cat.id)}`;
                      const catName = isRtl
                        ? (cat.name_ar || cat.name_en)
                        : (cat.name_en || cat.name_ar);

                      return (
                        <article className="bento-cat-card" key={cat.id}>
                          {/* Large Hero Cover Banner */}
                          <div className="bento-cover">
                            <Link href={catUrl} className="bento-cover-link">
                              {renderCategoryThumb(cat)}
                            </Link>
                            <div className="bento-top-badges">
                              <span className="b-pill blue">
                                {totalProductsCount} {isRtl ? 'منتج' : 'Products'}
                              </span>
                              {subs.length > 0 && (
                                <span className="b-pill dark">
                                  {subs.length} {isRtl ? 'فروع' : 'Branches'}
                                </span>
                              )}
                            </div>
                            {minCatPrice > 0 && (
                              <span className="bento-price-tag">
                                {isRtl ? 'يبدأ من ' : 'Starts from '}
                                <strong>
                                  {minCatPrice.toLocaleString()} {currencyLabel}
                                </strong>
                              </span>
                            )}
                          </div>

                          <div className="bento-body">
                            <div className="bento-head">
                              <h2>
                                <Link href={catUrl}>{catName}</Link>
                              </h2>
                              <p>
                                {isRtl
                                  ? (cat.description_ar ||
                                      `أحدث أجهزة وحلول ${catName} الأصلية بضمان الوكيل.`)
                                  : (cat.description_en ||
                                      `Latest genuine ${catName} systems with dealer warranty.`)}
                              </p>
                            </div>

                            {subs.length > 0 && (
                              <div className="bento-subcats">
                                {subs.map((sub) => {
                                  const subName = isRtl
                                    ? (sub.name_ar || sub.name_en)
                                    : (sub.name_en || sub.name_ar);
                                  return (
                                    <Link
                                      key={sub.id}
                                      href={`/categories/${encodeURIComponent(sub.id)}/${encodeURIComponent(sub.slug || sub.id)}`}
                                      className="bento-sub-chip"
                                    >
                                      <span>{subName}</span>
                                      <span className="cnt">{sub.products_count || 0}</span>
                                    </Link>
                                  );
                                })}
                              </div>
                            )}

                            {previewProducts.length > 0 && (
                              <div className="bento-mini-previews">
                                {previewProducts.map((prod) => {
                                  const prodImg =
                                    prod.images?.find((i) => i.is_primary)?.image_url ||
                                    prod.images?.[0]?.image_url ||
                                    '/assets/placeholder-tech.png';
                                  const prodPrice = Number(
                                    prod.sale_price || prod.original_price || 0
                                  );
                                  const prodName = isRtl
                                    ? (prod.name_ar || prod.name_en)
                                    : (prod.name_en || prod.name_ar);
                                  return (
                                    <Link
                                      key={prod.id}
                                      href={`/pd/${encodeURIComponent(prod.id)}/${encodeURIComponent(prod.slug || prod.id)}`}
                                      className="bento-mini-item"
                                    >
                                      <div className="bmi-thumb">
                                        <img
                                          src={prodImg}
                                          alt={prodName}
                                          onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = '/assets/placeholder-tech.png';
                                          }}
                                        />
                                      </div>
                                      <span className="bmi-name">
                                        {prodName}
                                      </span>
                                      <strong className="bmi-price">
                                        {prodPrice.toLocaleString()} {currencyLabel}
                                      </strong>
                                    </Link>
                                  );
                                })}
                              </div>
                            )}

                            <Link href={catUrl} className="bento-cta-btn">
                              <span>
                                {isRtl
                                  ? `استكشف قسم ${catName} بالكامل`
                                  : `Explore All ${catName}`}
                              </span>
                              {isRtl ? <FaArrowLeft size={11} /> : <FaChevronRight size={11} />}
                            </Link>
                          </div>
                        </article>
                      );
                    }
                  )}
                </section>
              ) : (
                /* ================= VIEW MODE 3: COMPACT DIRECTORY MATRIX / TREE VIEW ================= */
                <section className="cats-directory-matrix">
                  {displayedCategorySections.map(
                    ({
                      category: cat,
                      subcategories: subs,
                      totalProductsCount,
                      previewProducts,
                      minCatPrice,
                    }) => {
                      const catUrl = `/categories/${encodeURIComponent(cat.id)}/${encodeURIComponent(cat.slug || cat.id)}`;
                      const catName = isRtl
                        ? (cat.name_ar || cat.name_en)
                        : (cat.name_en || cat.name_ar);

                      return (
                        <div className="matrix-cat-row" key={cat.id}>
                          {/* Column 1: Main Category Identity */}
                          <div className="matrix-col-main">
                            <Link href={catUrl} className="mc-thumb">
                              {renderCategoryThumb(cat)}
                            </Link>
                            <div className="mc-info">
                              <h3>
                                <Link href={catUrl}>{catName}</Link>
                              </h3>
                              <div className="mc-stats">
                                <span>
                                  {totalProductsCount} {isRtl ? 'منتج' : 'Products'}
                                </span>
                                <span>•</span>
                                <span>
                                  {subs.length} {isRtl ? 'فروع' : 'Branches'}
                                </span>
                                {minCatPrice > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="green">
                                      {isRtl ? 'من ' : 'From '}
                                      {minCatPrice.toLocaleString()} {currencyLabel}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Column 2: Subcategories Matrix Links */}
                          <div className="matrix-col-subs">
                            <span className="col-lbl">
                              {isRtl ? 'الأقسام الفرعية:' : 'Subcategories:'}
                            </span>
                            {subs.length === 0 ? (
                              <span className="no-subs">
                                {isRtl ? 'قسم مباشر بدون فروع' : 'Direct category without branches'}
                              </span>
                            ) : (
                              <div className="mc-subs-list">
                                {subs.map((sub) => {
                                  const subName = isRtl
                                    ? (sub.name_ar || sub.name_en)
                                    : (sub.name_en || sub.name_ar);
                                  return (
                                    <Link
                                      key={sub.id}
                                      href={`/categories/${encodeURIComponent(sub.id)}/${encodeURIComponent(sub.slug || sub.id)}`}
                                      className="mc-sub-pill"
                                    >
                                      <span>{subName}</span>
                                      <strong>({sub.products_count || 0})</strong>
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Column 3: Top Sample Products Pills + Action */}
                          <div className="matrix-col-prods">
                            <div className="mc-prod-thumbs">
                              {previewProducts.slice(0, 4).map((prod) => {
                                const prodImg =
                                  prod.images?.find((i) => i.is_primary)?.image_url ||
                                  prod.images?.[0]?.image_url ||
                                  '/assets/placeholder-tech.png';
                                const prodName = isRtl
                                  ? (prod.name_ar || prod.name_en)
                                  : (prod.name_en || prod.name_ar);
                                const prodPrice = Number(prod.sale_price || prod.original_price || 0);

                                return (
                                  <Link
                                    key={prod.id}
                                    href={`/pd/${encodeURIComponent(prod.id)}/${encodeURIComponent(prod.slug || prod.id)}`}
                                    className="mc-mini-avatar"
                                    title={`${prodName} — ${prodPrice.toLocaleString()} ${currencyLabel}`}
                                  >
                                    <img
                                      src={prodImg}
                                      alt={prodName}
                                      onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = '/assets/placeholder-tech.png';
                                      }}
                                    />
                                  </Link>
                                );
                              })}
                            </div>

                            <Link href={catUrl} className="mc-open-btn">
                              <span>{isRtl ? 'فتح القسم' : 'Open Category'}</span>
                              {isRtl ? <FaArrowLeft size={11} /> : <FaChevronRight size={11} />}
                            </Link>
                          </div>
                        </div>
                      );
                    }
                  )}
                </section>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer lang={lang} />
    </div>
  );
}

export default function AllCategoriesPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc',
            fontFamily: 'Cairo, sans-serif',
            fontWeight: 800,
            color: '#1d4ed8',
          }}
        >
          جاري تحميل الأقسام والتصنيفات...
        </div>
      }
    >
      <AllCategoriesContent />
    </Suspense>
  );
}
