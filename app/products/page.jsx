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
  FaBoxOpen,
  FaArrowLeft,
  FaFilter,
  FaRotateLeft,
  FaGrip,
  FaList,
  FaShareNodes,
  FaTags,
  FaXmark,
} from 'react-icons/fa6';
import '../categories/CategoriesPage.scss';

function AllProductsCatalogContent() {
  const { lang, isRtl, setLang } = useTrendlineLang('ar');
  const currencyLabel = isRtl ? 'ج.م' : 'EGP';

  const searchParams = useSearchParams();
  const toast = useToast();

  const initialSearch = searchParams?.get('search') || '';
  const initialCategory = searchParams?.get('category') || 'all';
  const initialBrand = searchParams?.get('brand') || 'all';
  const initialPage = Math.max(1, Number(searchParams?.get('page')) || 1);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Server-Side Pagination States
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(12);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filter & Sort States
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedBrand, setSelectedBrand] = useState(initialBrand);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [sortBy, setSortBy] = useState('created_at_desc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Prevent background scroll when mobile filter drawer is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isMobileFilterOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isMobileFilterOpen]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory && selectedCategory !== 'all') count++;
    if (selectedBrand && selectedBrand !== 'all') count++;
    if (inStockOnly) count++;
    if (onSaleOnly) count++;
    if (minPrice || maxPrice) count++;
    if (searchQuery && searchQuery.trim()) count++;
    return count;
  }, [selectedCategory, selectedBrand, inStockOnly, onSaleOnly, minPrice, maxPrice, searchQuery]);

  // Sync URL query params if user navigates via Navbar search
  useEffect(() => {
    const q = searchParams?.get('search');
    const c = searchParams?.get('category');
    if (q !== null) {
      setSearchQuery(q);
      setDebouncedSearch(q);
      setCurrentPage(1);
    }
    if (c !== null) {
      setSelectedCategory(c);
      setCurrentPage(1);
    }
  }, [searchParams]);

  // Debounce search input before hitting server
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 320);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load Categories & Brands once for Sidebar
  useEffect(() => {
    let isMounted = true;
    async function fetchMeta() {
      try {
        const apiBase = getApiHost();
        const [catsRes, brandsRes] = await Promise.all([
          fetch(`${apiBase}/api/v1/catalog/categories?include_inactive=false`),
          fetch(`${apiBase}/api/v1/catalog/brands`),
        ]);
        const catsJson = await catsRes.json();
        const brandsJson = await brandsRes.json();

        if (!isMounted) return;
        if (catsJson?.success && Array.isArray(catsJson.data)) {
          setCategories(catsJson.data);
        }
        if (brandsJson?.success && Array.isArray(brandsJson.data)) {
          setBrands(brandsJson.data.filter((b) => b.is_active !== false));
        }
      } catch (err) {
        console.error('Error loading catalog metadata:', err);
      }
    }
    fetchMeta();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Paginated Products from Server whenever page, limit, or filters change
  useEffect(() => {
    let isMounted = true;

    async function fetchPaginatedProducts() {
      setLoading(true);
      try {
        const apiBase = getApiHost();
        const qs = new URLSearchParams();
        qs.set('page', String(currentPage));
        qs.set('limit', String(pageSize));
        qs.set('is_active', 'true');
        qs.set('sort', sortBy);

        if (debouncedSearch.trim()) {
          qs.set('search', debouncedSearch.trim());
        }
        if (selectedCategory && selectedCategory !== 'all') {
          qs.set('category_id', String(selectedCategory));
        }
        if (selectedBrand && selectedBrand !== 'all') {
          qs.set('brand_id', String(selectedBrand));
        }
        if (minPrice !== '' && !Number.isNaN(Number(minPrice))) {
          qs.set('min_price', String(minPrice));
        }
        if (maxPrice !== '' && !Number.isNaN(Number(maxPrice))) {
          qs.set('max_price', String(maxPrice));
        }
        if (inStockOnly) {
          qs.set('in_stock_only', 'true');
        }
        if (onSaleOnly) {
          qs.set('on_sale_only', 'true');
        }

        const res = await fetch(`${apiBase}/api/v1/catalog/products?${qs.toString()}`);
        const json = await res.json();

        if (!isMounted) return;

        if (json?.success) {
          setProducts(Array.isArray(json.data) ? json.data : []);
          setTotalProductsCount(Number(json.count || 0));
          setTotalPages(Math.max(1, Number(json.total_pages || 1)));
        } else {
          setProducts([]);
          setTotalProductsCount(0);
          setTotalPages(1);
        }
      } catch (err) {
        console.error('Error fetching paginated products:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchPaginatedProducts();
    return () => {
      isMounted = false;
    };
  }, [
    currentPage,
    pageSize,
    debouncedSearch,
    selectedCategory,
    selectedBrand,
    minPrice,
    maxPrice,
    inStockOnly,
    onSaleOnly,
    sortBy,
  ]);

  // Root categories for quick tabs & sidebar tree
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

  const handleFilterChange = (updater) => {
    updater();
    setCurrentPage(1);
  };

  const handleQuickPrice = (minVal, maxVal) => {
    setMinPrice(minVal !== null ? String(minVal) : '');
    setMaxPrice(maxVal !== null ? String(maxVal) : '');
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setOnSaleOnly(false);
    setSortBy('created_at_desc');
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  // Compute visible page numbers for pagination bar
  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  const handleShareShortProductLink = (e, prod) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window === 'undefined') return;
    const shortUrl = `${window.location.origin}/pd/${encodeURIComponent(prod.id)}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shortUrl);
      toast.success(isRtl ? `تم نسخ الرابط القصير للمنتج: /pd/${prod.id}` : `Short link copied: /pd/${prod.id}`);
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

  const startItemIndex = totalProductsCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItemIndex = Math.min(totalProductsCount, currentPage * pageSize);

  return (
    <div suppressHydrationWarning className="cats-page-wrapper" dir={isRtl ? 'rtl' : 'ltr'}>
      <Navbar lang={lang} onToggleLang={setLang} />

      <div className="cats-container">
        {/* ================= SMOOTH COMPACT E-COMMERCE HEADER ================= */}
        <div className="ecom-cat-slim-header">
          <div className="slim-top-crumbs">
            <nav className="ecom-breadcrumbs" aria-label="Breadcrumb">
              <Link href="/">
                <FaHouse size={12} />
                <span>{isRtl ? 'الرئيسية' : 'Home'}</span>
              </Link>
              {isRtl ? <FaChevronLeft size={9} /> : <FaChevronRight size={9} />}
              <span className="current">
                {isRtl ? 'كتالوج المنتجات' : 'Products Catalog'}
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
                <FaBoxOpen size={12} />
                <strong>{totalProductsCount}</strong>{' '}
                {isRtl ? 'منتج مطابق' : 'Matching Products'}
              </span>
              <span className="meta-pill">
                <FaLayerGroup size={12} />
                <strong>{rootCategories.length}</strong>{' '}
                {isRtl ? 'أقسام رئيسية' : 'Main Categories'}
              </span>
              <span className="meta-pill">
                <FaTags size={12} />
                <strong>{brands.length}</strong>{' '}
                {isRtl ? 'علامة تجارية' : 'Brands'}
              </span>
            </div>
          </div>

          <div className="slim-main-row">
            <div className="slim-title-wrap">
              <h1>
                {activeCategoryObj
                  ? (isRtl
                      ? `منتجات ${activeCategoryObj.name_ar || activeCategoryObj.name_en}`
                      : `${activeCategoryObj.name_en || activeCategoryObj.name_ar} Products`)
                  : (isRtl ? 'كتالوج منتجات وأجهزة ترند لاين' : 'Trendline Products & Devices Catalog')}
              </h1>
              <span className="slim-subtitle">
                {isRtl
                  ? 'تصفح المنتجات بنظام الصفحات الذكي (Server Pagination) مع الفلترة الفورية'
                  : 'Browse catalog with server-side pagination and real-time filtering'}
              </span>
            </div>

            <div className="slim-subcats-pills">
              <button
                type="button"
                className={`slim-pill ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => handleFilterChange(() => setSelectedCategory('all'))}
              >
                <span>{isRtl ? 'كل الأقسام' : 'All Categories'}</span>
              </button>

              {rootCategories.map((cat) => {
                const isSelected = String(selectedCategory) === String(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`slim-pill ${isSelected ? 'active' : ''}`}
                    onClick={() =>
                      handleFilterChange(() =>
                        setSelectedCategory(isSelected ? 'all' : String(cat.id))
                      )
                    }
                  >
                    <span>
                      {isRtl
                        ? (cat.name_ar || cat.name_en)
                        : (cat.name_en || cat.name_ar)}
                    </span>
                    {cat.products_count !== undefined && (
                      <span className="cnt">{cat.products_count}</span>
                    )}
                  </button>
                );
              })}

              <Link
                href="/categories"
                className="slim-pill"
                style={{ color: '#1d4ed8', borderColor: '#bfdbfe', background: '#eff6ff' }}
              >
                <span>{isRtl ? 'دليل الأقسام' : 'Categories Directory'}</span>
                {isRtl ? <FaArrowLeft size={10} /> : <FaChevronRight size={10} />}
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Filter Backdrop */}
        <div
          className={`mobile-filter-backdrop ${isMobileFilterOpen ? 'active' : ''}`}
          onClick={() => setIsMobileFilterOpen(false)}
          aria-hidden="true"
        />

        {/* ================= MAIN WORKSPACE (SIDEBAR FILTERS + PAGINATED PRODUCTS) ================= */}
        <div className="single-cat-workspace">
          {/* Sidebar Filters */}
          <aside className={`cat-filters-sidebar ${isMobileFilterOpen ? 'mobile-filter-open' : ''}`}>
            <div className="sidebar-head">
              <h4>
                <FaFilter color="#1d4ed8" />
                <span>{isRtl ? 'تصفية المنتجات' : 'Filter Products'}</span>
              </h4>
              <div className="sidebar-head-actions">
                <button
                  type="button"
                  className="reset-btn"
                  onClick={handleResetFilters}
                >
                  <FaRotateLeft style={{ marginLeft: isRtl ? '4px' : 0, marginRight: isRtl ? 0 : '4px' }} />
                  {isRtl ? 'إعادة ضبط' : 'Reset'}
                </button>
                <button
                  type="button"
                  className="mobile-close-filter-btn"
                  onClick={() => setIsMobileFilterOpen(false)}
                  aria-label={isRtl ? 'إغلاق الفلتر' : 'Close filters'}
                >
                  <FaXmark />
                </button>
              </div>
            </div>

            {/* 1. Search Input */}
            <div className="filter-group">
              <span className="fg-title">{isRtl ? 'بحث بالاسم أو الكود (SKU)' : 'Search by Name or SKU'}</span>
              <div className="sidebar-search-box">
                <FaMagnifyingGlass className="s-ic" />
                <input
                  type="text"
                  placeholder={isRtl ? 'ابحث عن منتج، موديل، أو SKU...' : 'Search product, model, or SKU...'}
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

            {/* 2. Category Tree Filter */}
            <div className="filter-group">
              <span className="fg-title">{isRtl ? 'الأقسام والتصنيفات' : 'Categories'}</span>
              <div className="sidebar-cat-tree">
                <div className="tree-root-item">
                  <button
                    type="button"
                    className={`tree-btn-row ${selectedCategory === 'all' ? 'active' : ''}`}
                    onClick={() => handleFilterChange(() => setSelectedCategory('all'))}
                  >
                    <span className="tree-lbl">
                      <span>{isRtl ? 'جميع الأقسام' : 'All Categories'}</span>
                    </span>
                  </button>
                </div>

                {rootCategories.map((root) => {
                  const isRootActive = String(selectedCategory) === String(root.id);
                  const subs = (root.subcategories || []).filter(
                    (s) => s.is_active !== false
                  );

                  return (
                    <div className="tree-root-item" key={root.id}>
                      <button
                        type="button"
                        className={`tree-btn-row ${isRootActive ? 'active' : ''}`}
                        onClick={() =>
                          handleFilterChange(() => setSelectedCategory(String(root.id)))
                        }
                      >
                        <span className="tree-lbl">
                          <span>{isRtl ? (root.name_ar || root.name_en) : (root.name_en || root.name_ar)}</span>
                        </span>
                        {root.products_count !== undefined && (
                          <span className="tree-count">{root.products_count}</span>
                        )}
                      </button>

                      {subs.length > 0 && (
                        <div className="tree-sub-list">
                          {subs.map((sub) => {
                            const isSubSelected =
                              String(selectedCategory) === String(sub.id);
                            return (
                              <button
                                key={sub.id}
                                type="button"
                                className={`tree-sub-btn ${isSubSelected ? 'active' : ''}`}
                                onClick={() =>
                                  handleFilterChange(() => setSelectedCategory(String(sub.id)))
                                }
                              >
                                <span>{isRtl ? (sub.name_ar || sub.name_en) : (sub.name_en || sub.name_ar)}</span>
                                {sub.products_count !== undefined && (
                                  <span className="sub-cnt">{sub.products_count}</span>
                                )}
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

            {/* 3. Availability & Offers Filter */}
            <div className="filter-group">
              <span className="fg-title">{isRtl ? 'حالة التوفر والعروض' : 'Availability & Offers'}</span>
              <div className="fg-options">
                <label className="fg-check-row">
                  <span className="label-left">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) =>
                        handleFilterChange(() => setInStockOnly(e.target.checked))
                      }
                    />
                    <span>{isRtl ? 'المتوفر في المخزون فقط' : 'In Stock Only'}</span>
                  </span>
                </label>
                <label className="fg-check-row">
                  <span className="label-left">
                    <input
                      type="checkbox"
                      checked={onSaleOnly}
                      onChange={(e) =>
                        handleFilterChange(() => setOnSaleOnly(e.target.checked))
                      }
                    />
                    <span>{isRtl ? 'العروض والخصومات فقط' : 'On Sale & Discounts Only'}</span>
                  </span>
                </label>
              </div>
            </div>

            {/* 4. Price Range Filter */}
            <div className="filter-group">
              <span className="fg-title">{isRtl ? 'نطاق السعر (ج.م)' : `Price Range (${currencyLabel})`}</span>
              <div className="price-inputs-row">
                <input
                  type="number"
                  placeholder={isRtl ? 'من (الأقل)' : 'Min'}
                  value={minPrice}
                  onChange={(e) =>
                    handleFilterChange(() => setMinPrice(e.target.value))
                  }
                />
                <input
                  type="number"
                  placeholder={isRtl ? 'إلى (الأعلى)' : 'Max'}
                  value={maxPrice}
                  onChange={(e) =>
                    handleFilterChange(() => setMaxPrice(e.target.value))
                  }
                />
              </div>
              <div className="quick-price-presets">
                <button
                  type="button"
                  className={minPrice === '' && maxPrice === '2000' ? 'active' : ''}
                  onClick={() => handleQuickPrice(null, 2000)}
                >
                  {isRtl ? 'أقل من 2,000' : 'Under 2,000'}
                </button>
                <button
                  type="button"
                  className={minPrice === '2000' && maxPrice === '7000' ? 'active' : ''}
                  onClick={() => handleQuickPrice(2000, 7000)}
                >
                  2,000 - 7,000
                </button>
                <button
                  type="button"
                  className={minPrice === '7000' && maxPrice === '15000' ? 'active' : ''}
                  onClick={() => handleQuickPrice(7000, 15000)}
                >
                  7,000 - 15,000
                </button>
                <button
                  type="button"
                  className={minPrice === '15000' && maxPrice === '' ? 'active' : ''}
                  onClick={() => handleQuickPrice(15000, null)}
                >
                  {isRtl ? '+15,000 ج.م' : `+15,000 ${currencyLabel}`}
                </button>
              </div>
            </div>

            {/* 5. Brands Filter */}
            {brands.length > 0 && (
              <div className="filter-group">
                <span className="fg-title">{isRtl ? 'العلامة التجارية' : 'Brand'}</span>
                <div className="fg-options">
                  <label className="fg-check-row">
                    <span className="label-left">
                      <input
                        type="radio"
                        name="prod_brand_filter"
                        checked={selectedBrand === 'all'}
                        onChange={() =>
                          handleFilterChange(() => setSelectedBrand('all'))
                        }
                      />
                      <span>{isRtl ? 'جميع الماركات' : 'All Brands'}</span>
                    </span>
                  </label>

                  {brands.map((b) => (
                    <label className="fg-check-row" key={b.id}>
                      <span className="label-left">
                        <input
                          type="radio"
                          name="prod_brand_filter"
                          checked={String(selectedBrand) === String(b.id)}
                          onChange={() =>
                            handleFilterChange(() => setSelectedBrand(String(b.id)))
                          }
                        />
                        <span>{isRtl ? (b.name_ar || b.name_en) : (b.name_en || b.name_ar)}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Mobile Filter Apply Bar */}
            <div className="mobile-filter-apply-bar">
              <button
                type="button"
                className="apply-filter-action-btn"
                onClick={() => setIsMobileFilterOpen(false)}
              >
                {isRtl ? `تطبيق وعرض (${totalProductsCount} منتج)` : `Apply & Show (${totalProductsCount} Products)`}
              </button>
            </div>
          </aside>

          {/* Main Products Column */}
          <div className="cat-products-main">
            {/* Top Sort, Page Size & View Mode Toolbar */}
            <div className="cat-toolbar">
              <div className="results-summary">
                {/* Mobile Filter Toggle Button */}
                <button
                  type="button"
                  className="mobile-filter-toggle-btn"
                  onClick={() => setIsMobileFilterOpen(true)}
                  aria-label={isRtl ? 'فتح فلاتر البحث' : 'Open search filters'}
                >
                  <FaFilter size={12} />
                  <span>{isRtl ? 'تصفية وفلترة' : 'Filters'}</span>
                  {activeFiltersCount > 0 && (
                    <span className="filter-badge">{activeFiltersCount}</span>
                  )}
                </button>

                <span>
                  {isRtl ? (
                    <>
                      عرض <strong>{startItemIndex}</strong> - <strong>{endItemIndex}</strong> من أصل{' '}
                      <strong>{totalProductsCount}</strong> منتج (صفحة {currentPage} من {totalPages})
                    </>
                  ) : (
                    <>
                      Showing <strong>{startItemIndex}</strong> - <strong>{endItemIndex}</strong> of{' '}
                      <strong>{totalProductsCount}</strong> products (Page {currentPage} of {totalPages})
                    </>
                  )}
                </span>

                {activeCategoryObj && (
                  <span
                    className="active-filter-tag"
                    onClick={() => handleFilterChange(() => setSelectedCategory('all'))}
                  >
                    <span>
                      {isRtl
                        ? `القسم: ${activeCategoryObj.name_ar || activeCategoryObj.name_en}`
                        : `Category: ${activeCategoryObj.name_en || activeCategoryObj.name_ar}`}
                    </span>
                    <FaXmark size={11} />
                  </span>
                )}

                {selectedBrand !== 'all' && (
                  <span
                    className="active-filter-tag"
                    onClick={() => handleFilterChange(() => setSelectedBrand('all'))}
                  >
                    <span>
                      {isRtl ? 'الماركة: ' : 'Brand: '}
                      {(() => {
                        const brandObj = brands.find((b) => String(b.id) === String(selectedBrand));
                        return brandObj
                          ? (isRtl ? (brandObj.name_ar || brandObj.name_en) : (brandObj.name_en || brandObj.name_ar))
                          : selectedBrand;
                      })()}
                    </span>
                    <FaXmark size={11} />
                  </span>
                )}

                {(minPrice || maxPrice) && (
                  <span
                    className="active-filter-tag"
                    onClick={() => handleQuickPrice(null, null)}
                  >
                    <span>
                      {isRtl
                        ? `السعر: ${minPrice || 0} - ${maxPrice || '∞'} ج.م`
                        : `Price: ${minPrice || 0} - ${maxPrice || '∞'} ${currencyLabel}`}
                    </span>
                    <FaXmark size={11} />
                  </span>
                )}
              </div>

              <div className="toolbar-controls">
                <select
                  className="sort-select"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  title={isRtl ? 'عدد المنتجات في الصفحة' : 'Products per page'}
                >
                  <option value={8}>{isRtl ? '8 منتجات / صفحة' : '8 / page'}</option>
                  <option value={12}>{isRtl ? '12 منتج / صفحة' : '12 / page'}</option>
                  <option value={24}>{isRtl ? '24 منتج / صفحة' : '24 / page'}</option>
                </select>

                <select
                  className="sort-select"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label={isRtl ? 'ترتيب المنتجات' : 'Sort Products'}
                >
                  <option value="created_at_desc">{isRtl ? 'الترتيب: الأحدث أولاً' : 'Sort: Newest First'}</option>
                  <option value="price_asc">{isRtl ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
                  <option value="price_desc">{isRtl ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
                  <option value="discount_desc">{isRtl ? 'الأعلى خصماً' : 'Biggest Discount'}</option>
                  <option value="rating">{isRtl ? 'الأعلى تقييماً' : 'Top Rated'}</option>
                  <option value="name_asc">{isRtl ? 'الاسم: أ - ي' : 'Name: A - Z'}</option>
                </select>

                <div className="view-mode-btns">
                  <button
                    type="button"
                    className={viewMode === 'grid' ? 'active' : ''}
                    onClick={() => setViewMode('grid')}
                    title={isRtl ? 'عرض شبكي' : 'Grid View'}
                  >
                    <FaGrip />
                  </button>
                  <button
                    type="button"
                    className={viewMode === 'list' ? 'active' : ''}
                    onClick={() => setViewMode('list')}
                    title={isRtl ? 'عرض قائمة' : 'List View'}
                  >
                    <FaList />
                  </button>
                </div>
              </div>
            </div>

            {/* Products Grid / List */}
            {loading ? (
              <div
                style={{
                  background: '#fff',
                  borderRadius: '18px',
                  padding: '56px 24px',
                  textAlign: 'center',
                  border: '1px solid #e2e8f0',
                }}
              >
                <p style={{ fontSize: '16px', fontWeight: 800, color: '#1d4ed8', margin: 0 }}>
                  {isRtl
                    ? `جاري تحميل صفحة ${currentPage} من المنتجات...`
                    : `Loading products page ${currentPage}...`}
                </p>
              </div>
            ) : products.length === 0 ? (
              <div className="empty-cat-state">
                <div className="empty-icon">
                  <FaBoxOpen />
                </div>
                <h3>{isRtl ? 'لا توجد منتجات مطابقة للفلاتر المختارة' : 'No products found matching your filters'}</h3>
                <p>
                  {isRtl
                    ? 'جرّب تغيير معايير التصفية أو مسح البحث لاستعراض جميع منتجات المتجر.'
                    : 'Try adjusting your filter criteria or clearing search to explore all products.'}
                </p>
                <button
                  type="button"
                  className="clear-filters-btn"
                  onClick={handleResetFilters}
                >
                  {isRtl ? 'إعادة ضبط الفلاتر وعرض الكل' : 'Reset Filters & Show All'}
                </button>
              </div>
            ) : (
              <>
                <div className={`cat-products-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
                  {products.map((prod) => (
                    <StoreProductCard
                      key={prod.id}
                      product={prod}
                      lang={lang}
                      onShareClick={handleShareShortProductLink}
                    />
                  ))}
                </div>

                {/* ================= SERVER-SIDE PAGINATION BAR ================= */}
                {totalPages > 1 && (
                  <nav className="ecom-pagination-bar" aria-label={isRtl ? 'تصفح صفحات المنتجات' : 'Products Pagination'}>
                    <div className="pag-info">
                      {isRtl ? (
                        <>
                          عرض المنتجات <strong>{startItemIndex}</strong> إلى{' '}
                          <strong>{endItemIndex}</strong> من إجمالي{' '}
                          <strong>{totalProductsCount}</strong> منتج
                        </>
                      ) : (
                        <>
                          Showing products <strong>{startItemIndex}</strong> to{' '}
                          <strong>{endItemIndex}</strong> of{' '}
                          <strong>{totalProductsCount}</strong>
                        </>
                      )}
                    </div>

                    <div className="pag-controls">
                      <button
                        type="button"
                        className="pag-nav-btn"
                        disabled={currentPage <= 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                      >
                        {isRtl ? <FaChevronRight size={11} /> : <FaChevronLeft size={11} />}
                        <span>{isRtl ? 'السابق' : 'Prev'}</span>
                      </button>

                      {pageNumbers[0] > 1 && (
                        <>
                          <button
                            type="button"
                            className="pag-num-btn"
                            onClick={() => handlePageChange(1)}
                          >
                            1
                          </button>
                          {pageNumbers[0] > 2 && <span className="pag-dots">...</span>}
                        </>
                      )}

                      {pageNumbers.map((num) => (
                        <button
                          key={num}
                          type="button"
                          className={`pag-num-btn ${currentPage === num ? 'active' : ''}`}
                          onClick={() => handlePageChange(num)}
                        >
                          {num}
                        </button>
                      ))}

                      {pageNumbers[pageNumbers.length - 1] < totalPages && (
                        <>
                          {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                            <span className="pag-dots">...</span>
                          )}
                          <button
                            type="button"
                            className="pag-num-btn"
                            onClick={() => handlePageChange(totalPages)}
                          >
                            {totalPages}
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        className="pag-nav-btn"
                        disabled={currentPage >= totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                      >
                        <span>{isRtl ? 'التالي' : 'Next'}</span>
                        {isRtl ? <FaChevronLeft size={11} /> : <FaChevronRight size={11} />}
                      </button>
                    </div>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer lang={lang} />
    </div>
  );
}

export default function AllProductsPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f5f8fc',
            fontFamily: 'Cairo, sans-serif',
            fontWeight: 800,
            color: '#1d4ed8',
          }}
        >
          جاري تحميل كتالوج المنتجات...
        </div>
      }
    >
      <AllProductsCatalogContent />
    </Suspense>
  );
}
