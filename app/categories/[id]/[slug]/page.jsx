'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/src/components/common/Navbar/Navbar';
import Footer from '@/src/components/common/Footer/Footer';
import StoreProductCard from '@/src/components/common/StoreProductCard/StoreProductCard';
import { useToast } from '@/src/components/adminComponents';
import useTrendlineLang from '@/src/hooks/useTrendlineLang';
import {
  FaHouse,
  FaChevronLeft,
  FaChevronRight,
  FaMagnifyingGlass,
  FaLayerGroup,
  FaBoxOpen,
  FaFilter,
  FaGrip,
  FaList,
  FaShareNodes,
  FaArrowLeft,
  FaRotateLeft,
  FaXmark,
  FaStar,
  FaTag,
  FaBolt,
  FaCheck,
} from 'react-icons/fa6';
import '../../CategoriesPage.scss';

function SingleCategoryContent() {
  const { lang, isRtl, setLang } = useTrendlineLang('ar');
  const currencyLabel = isRtl ? 'ج.م' : 'EGP';

  const params = useParams();
  const toast = useToast();

  const rawId = params?.id ? decodeURIComponent(String(params.id)) : '';
  const rawSlug = params?.slug ? decodeURIComponent(String(params.slug)) : '';

  const [category, setCategory] = useState(null);
  const [allCategories, setAllCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Advanced E-Commerce Filter & Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubcat, setSelectedSubcat] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('created_at_desc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  useEffect(() => {
    if (!rawId) return;
    let isMounted = true;

    async function fetchCategoryAndProducts() {
      setLoading(true);
      setNotFound(false);
      setSelectedSubcat('all');

      try {
        const [catRes, allCatsRes, prodRes] = await Promise.all([
          fetch(`/api/v1/catalog/categories/${encodeURIComponent(rawId)}`),
          fetch('/api/v1/catalog/categories?include_inactive=false'),
          fetch(`/api/v1/catalog/products?category_id=${encodeURIComponent(rawId)}&limit=100`),
        ]);

        const catJson = await catRes.json();
        const allCatsJson = await allCatsRes.json();
        const prodJson = await prodRes.json();

        if (!catRes.ok || !catJson?.success || !catJson?.data) {
          if (isMounted) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }

        const catData = catJson.data;
        if (isMounted) {
          setCategory(catData);
          if (allCatsJson?.success && Array.isArray(allCatsJson.data)) {
            setAllCategories(allCatsJson.data);
          }
          setProducts(prodJson?.success && Array.isArray(prodJson.data) ? prodJson.data : []);
          setLoading(false);
        }

        // Normalize URL to /categories/:id/:slug
        const canonicalSlug = catData.slug || catData.id;
        if (typeof window !== 'undefined' && (rawId !== catData.id || rawSlug !== canonicalSlug)) {
          window.history.replaceState(
            null,
            '',
            `/categories/${encodeURIComponent(catData.id)}/${encodeURIComponent(canonicalSlug)}`
          );
        }
      } catch (err) {
        if (isMounted) {
          setNotFound(true);
          setLoading(false);
        }
      }
    }

    fetchCategoryAndProducts();
    return () => {
      isMounted = false;
    };
  }, [rawId, rawSlug]);

  // Root categories for sidebar tree
  const rootCategories = useMemo(() => {
    return allCategories.filter((c) => !c.parent_id);
  }, [allCategories]);

  // Subcategories of the current category (or sibling subcategories if viewing a child category)
  const navSubcategories = useMemo(() => {
    if (!category) return [];
    if (Array.isArray(category.subcategories) && category.subcategories.length > 0) {
      return category.subcategories.filter((s) => s.is_active !== false);
    }
    if (category.parent?.id) {
      const parentObj = allCategories.find((c) => String(c.id) === String(category.parent.id));
      if (parentObj && Array.isArray(parentObj.subcategories)) {
        return parentObj.subcategories.filter((s) => s.is_active !== false);
      }
      if (Array.isArray(category.parent.subcategories)) {
        return category.parent.subcategories.filter((s) => s.is_active !== false);
      }
    }
    return [];
  }, [category, allCategories]);

  // Extract available brands with product counts
  const availableBrands = useMemo(() => {
    const brandMap = new Map();
    products.forEach((p) => {
      if (p.brand && p.brand.id) {
        const existing = brandMap.get(p.brand.id) || {
          id: p.brand.id,
          name: p.brand.name_en || p.brand.name_ar,
          name_ar: p.brand.name_ar || p.brand.name_en,
          count: 0,
        };
        existing.count += 1;
        brandMap.set(p.brand.id, existing);
      }
    });
    return Array.from(brandMap.values());
  }, [products]);

  // Counts for availability & deals filters
  const filterCounts = useMemo(() => {
    let inStock = 0;
    let onSale = 0;
    let featured = 0;

    products.forEach((p) => {
      const avail = Math.max(0, Number(p.stock_quantity || 0) - Number(p.reserved_stock || 0));
      if (avail > 0) inStock += 1;
      const sale = Number(p.sale_price || 0);
      const orig = Number(p.original_price || 0);
      if ((sale > 0 && orig > sale) || Number(p.discount_percent || 0) > 0) onSale += 1;
      if (p.is_featured) featured += 1;
    });

    return { inStock, onSale, featured };
  }, [products]);

  // Apply Client-Side Filtering & Sorting
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Subcategory local filter (when viewing a parent category and clicking a subcategory chip)
    if (selectedSubcat !== 'all') {
      list = list.filter((p) =>
        (p.categories || []).some((c) => String(c.id) === String(selectedSubcat))
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name_ar?.toLowerCase().includes(q) ||
          p.name_en?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.short_desc_ar?.toLowerCase().includes(q) ||
          p.brand?.name_en?.toLowerCase().includes(q) ||
          p.brand?.name_ar?.toLowerCase().includes(q)
      );
    }

    if (selectedBrand !== 'all') {
      list = list.filter((p) => String(p.brand?.id) === String(selectedBrand));
    }

    if (minPrice !== '' && !Number.isNaN(Number(minPrice))) {
      list = list.filter(
        (p) => Number(p.sale_price || p.original_price || 0) >= Number(minPrice)
      );
    }

    if (maxPrice !== '' && !Number.isNaN(Number(maxPrice))) {
      list = list.filter(
        (p) => Number(p.sale_price || p.original_price || 0) <= Number(maxPrice)
      );
    }

    if (inStockOnly) {
      list = list.filter(
        (p) => Math.max(0, Number(p.stock_quantity || 0) - Number(p.reserved_stock || 0)) > 0
      );
    }

    if (onSaleOnly) {
      list = list.filter((p) => {
        const sale = Number(p.sale_price || 0);
        const orig = Number(p.original_price || 0);
        return (sale > 0 && orig > sale) || Number(p.discount_percent || 0) > 0;
      });
    }

    if (featuredOnly) {
      list = list.filter((p) => Boolean(p.is_featured));
    }

    if (minRating > 0) {
      list = list.filter((p) => Number(p.rating_avg || 4.8) >= minRating);
    }

    // Sort
    list.sort((a, b) => {
      const priceA = Number(a.sale_price || a.original_price || 0);
      const priceB = Number(b.sale_price || b.original_price || 0);

      if (sortBy === 'price_asc') return priceA - priceB;
      if (sortBy === 'price_desc') return priceB - priceA;
      if (sortBy === 'discount_desc') {
        const discA = Number(a.discount_percent || 0);
        const discB = Number(b.discount_percent || 0);
        return discB - discA;
      }
      if (sortBy === 'rating') return Number(b.rating_avg || 4.8) - Number(a.rating_avg || 4.8);
      if (sortBy === 'name_asc')
        return (a.name_ar || a.name_en || '').localeCompare(b.name_ar || b.name_en || '', 'ar');
      return (
        new Date(b.createdAt || b.created_at || 0).getTime() -
        new Date(a.createdAt || a.created_at || 0).getTime()
      );
    });

    return list;
  }, [
    products,
    selectedSubcat,
    searchQuery,
    selectedBrand,
    minPrice,
    maxPrice,
    inStockOnly,
    onSaleOnly,
    featuredOnly,
    minRating,
    sortBy,
  ]);

  const handleQuickPrice = (minVal, maxVal) => {
    setMinPrice(minVal !== null ? String(minVal) : '');
    setMaxPrice(maxVal !== null ? String(maxVal) : '');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSubcat('all');
    setSelectedBrand('all');
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setOnSaleOnly(false);
    setFeaturedOnly(false);
    setMinRating(0);
    setSortBy('created_at_desc');
    setCurrentPage(1);
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedSubcat,
    searchQuery,
    selectedBrand,
    minPrice,
    maxPrice,
    inStockOnly,
    onSaleOnly,
    featuredOnly,
    minRating,
    sortBy,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedSubcat !== 'all' ||
    selectedBrand !== 'all' ||
    minPrice !== '' ||
    maxPrice !== '' ||
    inStockOnly ||
    onSaleOnly ||
    featuredOnly ||
    minRating > 0;

  const handleQuickShareProduct = async (e, prod) => {
    e.preventDefault();
    e.stopPropagation();
    const shortUrl = `${window.location.origin}/pd/${encodeURIComponent(prod.id)}`;
    try {
      await navigator.clipboard.writeText(shortUrl);
      toast?.success?.(`تم نسخ رابط المنتج القصير: /pd/${prod.id}`);
    } catch (err) {
      // ignore
    }
  };

  if (loading) {
    return (
      <div suppressHydrationWarning className="cats-page-wrapper" dir={isRtl ? 'rtl' : 'ltr'}>
        <Navbar lang={lang} onToggleLang={setLang} />
        <div className="cats-container" style={{ paddingTop: '48px', textAlign: 'center' }}>
          <div
            style={{
              background: '#fff',
              borderRadius: '20px',
              padding: '56px 24px',
              border: '1px solid #e2e8f0',
            }}
          >
            <p style={{ fontSize: '17px', fontWeight: 800, color: '#1d4ed8', margin: 0 }}>
              {isRtl ? 'جاري تحميل منتجات القسم...' : 'Loading category products...'}
            </p>
          </div>
        </div>
        <Footer lang={lang} />
      </div>
    );
  }

  if (notFound || !category) {
    return (
      <div suppressHydrationWarning className="cats-page-wrapper" dir={isRtl ? 'rtl' : 'ltr'}>
        <Navbar lang={lang} onToggleLang={setLang} />
        <div className="cats-container" style={{ paddingTop: '48px', textAlign: 'center' }}>
          <div
            style={{
              background: '#fff',
              borderRadius: '20px',
              padding: '56px 24px',
              border: '1px solid #e2e8f0',
            }}
          >
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', marginBottom: '12px' }}>
              {isRtl ? 'عذراً، لم يتم العثور على هذا القسم' : 'Sorry, Category Not Found'}
            </h2>
            <Link
              href="/categories"
              style={{
                display: 'inline-block',
                padding: '11px 24px',
                borderRadius: '11px',
                background: '#1d4ed8',
                color: '#fff',
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              {isRtl ? 'العودة إلى جميع الأقسام' : 'Back to All Categories'}
            </Link>
          </div>
        </div>
        <Footer lang={lang} />
      </div>
    );
  }

  const hasDeduplicatedParent =
    category.parent &&
    String(category.parent.id) !== String(category.id) &&
    (category.parent.name_ar || category.parent.name_en) !==
      (category.name_ar || category.name_en);

  const catName = isRtl
    ? (category.name_ar || category.name_en)
    : (category.name_en || category.name_ar);

  return (
    <div suppressHydrationWarning className="cats-page-wrapper" dir={isRtl ? 'rtl' : 'ltr'}>
      <Navbar lang={lang} onToggleLang={setLang} />

      <div className="cats-container">
        {/* ================= SMOOTH, SIMPLE, PRACTICAL TOP CATEGORY BAR ================= */}
        <div className="ecom-cat-slim-header">
          <div className="slim-top-crumbs">
            <nav className="ecom-breadcrumbs" aria-label="Breadcrumb">
              <Link href="/">
                <FaHouse size={12} />
                <span>{isRtl ? 'الرئيسية' : 'Home'}</span>
              </Link>
              {isRtl ? <FaChevronLeft size={9} /> : <FaChevronRight size={9} />}
              <Link href="/categories">{isRtl ? 'الأقسام' : 'Categories'}</Link>

              {hasDeduplicatedParent && (
                <>
                  {isRtl ? <FaChevronLeft size={9} /> : <FaChevronRight size={9} />}
                  <Link
                    href={`/categories/${encodeURIComponent(category.parent.id)}/${encodeURIComponent(category.parent.slug || category.parent.id)}`}
                  >
                    {isRtl
                      ? (category.parent.name_ar || category.parent.name_en)
                      : (category.parent.name_en || category.parent.name_ar)}
                  </Link>
                </>
              )}

              {isRtl ? <FaChevronLeft size={9} /> : <FaChevronRight size={9} />}
              <span className="current">{catName}</span>
            </nav>

            <div className="slim-meta-pills">
              <span className="meta-pill">
                <FaBoxOpen size={12} />
                <strong>{products.length}</strong> {isRtl ? 'منتج متاح' : 'Products Available'}
              </span>
              {availableBrands.length > 0 && (
                <span className="meta-pill">
                  <FaTag size={11} />
                  <strong>{availableBrands.length}</strong> ماركة عالمية
                </span>
              )}
            </div>
          </div>

          <div className="slim-main-row">
            <div className="slim-title-wrap">
              <h1>{category.name_ar || category.name_en}</h1>
              {(category.description_ar || category.description_en) && (
                <span className="slim-subtitle">
                  {category.description_ar || category.description_en}
                </span>
              )}
            </div>

            {/* Subcategories Quick Filter Pills */}
            {navSubcategories.length > 0 && (
              <div className="slim-subcats-pills">
                {!category.parent ? (
                  <>
                    <button
                      type="button"
                      className={`slim-pill ${selectedSubcat === 'all' ? 'active' : ''}`}
                      onClick={() => setSelectedSubcat('all')}
                    >
                      <span>الكل</span>
                      <span className="cnt">{products.length}</span>
                    </button>
                    {navSubcategories.map((sub) => {
                      const subCount = products.filter((p) =>
                        (p.categories || []).some((c) => String(c.id) === String(sub.id))
                      ).length;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          className={`slim-pill ${String(selectedSubcat) === String(sub.id) ? 'active' : ''}`}
                          onClick={() =>
                            setSelectedSubcat(
                              String(selectedSubcat) === String(sub.id) ? 'all' : String(sub.id)
                            )
                          }
                        >
                          <span>{sub.name_ar || sub.name_en}</span>
                          <span className="cnt">{subCount || sub.products_count || 0}</span>
                        </button>
                      );
                    })}
                  </>
                ) : (
                  <>
                    {category.parent && (
                      <Link
                        href={`/categories/${encodeURIComponent(category.parent.id)}/${encodeURIComponent(category.parent.slug || category.parent.id)}`}
                        className="slim-pill"
                      >
                        <span>كل {category.parent.name_ar}</span>
                      </Link>
                    )}
                    {navSubcategories.map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/categories/${encodeURIComponent(sub.id)}/${encodeURIComponent(sub.slug || sub.id)}`}
                        className={`slim-pill ${String(sub.id) === String(category.id) ? 'active' : ''}`}
                      >
                        <span>{sub.name_ar || sub.name_en}</span>
                        {sub.products_count !== undefined && (
                          <span className="cnt">{sub.products_count}</span>
                        )}
                      </Link>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ================= 2-COLUMN E-COMMERCE WORKSPACE (SIDEBAR + MAIN) ================= */}
        <div className="single-cat-workspace">
          {/* ================= ADVANCED E-COMMERCE SIDEBAR ================= */}
          <aside className="cat-filters-sidebar">
            <div className="sidebar-head">
              <h4>
                <FaFilter color="#1d4ed8" />
                <span>فلترة وتصفية المنتجات</span>
              </h4>
              {hasActiveFilters && (
                <button type="button" className="reset-btn" onClick={handleResetFilters}>
                  <FaRotateLeft style={{ marginLeft: '4px' }} />
                  مسح الكل
                </button>
              )}
            </div>

            {/* 1. Quick Search Inside Category */}
            <div className="filter-group">
              <span className="fg-title">بحث سريع في القسم</span>
              <div className="sidebar-search-box">
                <FaMagnifyingGlass className="s-ic" />
                <input
                  type="text"
                  placeholder={`ابحث في ${category.name_ar}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="s-clear"
                    onClick={() => setSearchQuery('')}
                    aria-label="مسح البحث"
                  >
                    <FaXmark />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Subcategories Filter (if parent has subcategories) */}
            {!category.parent && navSubcategories.length > 0 && (
              <div className="filter-group">
                <span className="fg-title">التصنيفات الفرعية</span>
                <div className="fg-options">
                  <label className="fg-check-row">
                    <span className="label-left">
                      <input
                        type="radio"
                        name="subcat_filter_radio"
                        checked={selectedSubcat === 'all'}
                        onChange={() => setSelectedSubcat('all')}
                      />
                      <span>جميع منتجات {category.name_ar}</span>
                    </span>
                    <span className="opt-count">{products.length}</span>
                  </label>

                  {navSubcategories.map((sub) => {
                    const subCount = products.filter((p) =>
                      (p.categories || []).some((c) => String(c.id) === String(sub.id))
                    ).length;
                    return (
                      <label className="fg-check-row" key={sub.id}>
                        <span className="label-left">
                          <input
                            type="radio"
                            name="subcat_filter_radio"
                            checked={String(selectedSubcat) === String(sub.id)}
                            onChange={() => setSelectedSubcat(String(sub.id))}
                          />
                          <span>{sub.name_ar || sub.name_en}</span>
                        </span>
                        <span className="opt-count">{subCount || sub.products_count || 0}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Availability & Special Offers */}
            <div className="filter-group">
              <span className="fg-title">التوفر والعروض</span>
              <div className="fg-options">
                <label className="fg-check-row">
                  <span className="label-left">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                    />
                    <span>متوفر في المخزون فقط</span>
                  </span>
                  <span className="opt-count">{filterCounts.inStock}</span>
                </label>

                <label className="fg-check-row">
                  <span className="label-left">
                    <input
                      type="checkbox"
                      checked={onSaleOnly}
                      onChange={(e) => setOnSaleOnly(e.target.checked)}
                    />
                    <span>عروض وخصومات فقط</span>
                  </span>
                  <span className="opt-count">{filterCounts.onSale}</span>
                </label>

                <label className="fg-check-row">
                  <span className="label-left">
                    <input
                      type="checkbox"
                      checked={featuredOnly}
                      onChange={(e) => setFeaturedOnly(e.target.checked)}
                    />
                    <span>المنتجات الأكثر مبيعاً وتميزاً</span>
                  </span>
                  <span className="opt-count">{filterCounts.featured}</span>
                </label>
              </div>
            </div>

            {/* 4. Price Range Filter + Quick Presets */}
            <div className="filter-group">
              <span className="fg-title">نطاق السعر (ج.م)</span>
              <div className="price-inputs-row">
                <input
                  type="number"
                  placeholder="من (الأقل)"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="إلى (الأعلى)"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
              <div className="quick-price-presets">
                <button
                  type="button"
                  className={minPrice === '' && maxPrice === '2000' ? 'active' : ''}
                  onClick={() => handleQuickPrice(null, 2000)}
                >
                  أقل من 2,000
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
                  +15,000 ج.م
                </button>
              </div>
            </div>

            {/* 5. Brand Filter */}
            {availableBrands.length > 0 && (
              <div className="filter-group">
                <span className="fg-title">العلامة التجارية (البراند)</span>
                <div className="fg-options">
                  <label className="fg-check-row">
                    <span className="label-left">
                      <input
                        type="radio"
                        name="single_cat_brand"
                        checked={selectedBrand === 'all'}
                        onChange={() => setSelectedBrand('all')}
                      />
                      <span>جميع العلامات التجارية</span>
                    </span>
                    <span className="opt-count">{products.length}</span>
                  </label>
                  {availableBrands.map((b) => (
                    <label className="fg-check-row" key={b.id}>
                      <span className="label-left">
                        <input
                          type="radio"
                          name="single_cat_brand"
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

            {/* 6. Store Categories Directory Tree */}
            {rootCategories.length > 0 && (
              <div className="filter-group">
                <span className="fg-title">تصفح أقسام المتجر</span>
                <div className="sidebar-cat-tree">
                  {rootCategories.map((root) => {
                    const isCurrentRoot =
                      String(root.id) === String(category.id) ||
                      String(root.id) === String(category.parent?.id);
                    const subs = (root.subcategories || []).filter((s) => s.is_active !== false);

                    return (
                      <div className="tree-root-item" key={root.id}>
                        <Link
                          href={`/categories/${encodeURIComponent(root.id)}/${encodeURIComponent(root.slug || root.id)}`}
                          className={`tree-btn-row ${String(root.id) === String(category.id) ? 'active' : ''}`}
                          style={{ textDecoration: 'none' }}
                        >
                          <span className="tree-lbl">
                            <span>{root.name_ar || root.name_en}</span>
                          </span>
                          {root.products_count !== undefined && (
                            <span className="tree-count">{root.products_count}</span>
                          )}
                        </Link>

                        {isCurrentRoot && subs.length > 0 && (
                          <div className="tree-sub-list">
                            {subs.map((sub) => (
                              <Link
                                key={sub.id}
                                href={`/categories/${encodeURIComponent(sub.id)}/${encodeURIComponent(sub.slug || sub.id)}`}
                                className={`tree-sub-btn ${String(sub.id) === String(category.id) ? 'active' : ''}`}
                                style={{ textDecoration: 'none' }}
                              >
                                <span>{sub.name_ar || sub.name_en}</span>
                                {sub.products_count !== undefined && (
                                  <span className="sub-cnt">{sub.products_count}</span>
                                )}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>

          {/* ================= MAIN PRODUCTS COLUMN ================= */}
          <div className="cat-products-main">
            {/* Top E-Commerce Toolbar */}
            <div className="cat-toolbar">
              <div className="results-summary">
                <span>
                  عرض <strong>{filteredProducts.length}</strong> من أصل{' '}
                  <strong>{products.length}</strong> منتج
                </span>

                {selectedSubcat !== 'all' && (
                  <span
                    className="active-filter-tag"
                    onClick={() => setSelectedSubcat('all')}
                  >
                    <span>
                      الفرع:{' '}
                      {navSubcategories.find((s) => String(s.id) === String(selectedSubcat))
                        ?.name_ar || selectedSubcat}
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
                      الماركة:{' '}
                      {availableBrands.find((b) => String(b.id) === String(selectedBrand))
                        ?.name || selectedBrand}
                    </span>
                    <FaXmark size={11} />
                  </span>
                )}

                {(minPrice || maxPrice) && (
                  <span
                    className="active-filter-tag"
                    onClick={() => {
                      setMinPrice('');
                      setMaxPrice('');
                    }}
                  >
                    <span>
                      السعر: {minPrice || 0} - {maxPrice || '∞'} ج.م
                    </span>
                    <FaXmark size={11} />
                  </span>
                )}

                {onSaleOnly && (
                  <span
                    className="active-filter-tag"
                    onClick={() => setOnSaleOnly(false)}
                  >
                    <span>العروض والخصومات</span>
                    <FaXmark size={11} />
                  </span>
                )}

                {inStockOnly && (
                  <span
                    className="active-filter-tag"
                    onClick={() => setInStockOnly(false)}
                  >
                    <span>المتوفر فقط</span>
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
                  title="عدد المنتجات في الصفحة"
                >
                  <option value={8}>8 منتجات / صفحة</option>
                  <option value={12}>12 منتج / صفحة</option>
                  <option value={24}>24 منتج / صفحة</option>
                </select>

                <select
                  className="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="ترتيب المنتجات"
                >
                  <option value="created_at_desc">الترتيب: الأحدث أولاً</option>
                  <option value="price_asc">السعر: من الأقل للأعلى</option>
                  <option value="price_desc">السعر: من الأعلى للأقل</option>
                  <option value="discount_desc">الأعلى خصماً وتوفيراً</option>
                  <option value="rating">الأعلى تقييماً</option>
                  <option value="name_asc">الاسم (أ - ي)</option>
                </select>

                <div className="view-mode-btns">
                  <button
                    type="button"
                    className={viewMode === 'grid' ? 'active' : ''}
                    onClick={() => setViewMode('grid')}
                    title="عرض شبكي"
                  >
                    <FaGrip />
                    <span>شبكة</span>
                  </button>
                  <button
                    type="button"
                    className={viewMode === 'list' ? 'active' : ''}
                    onClick={() => setViewMode('list')}
                    title="عرض قائمة"
                  >
                    <FaList />
                    <span>قائمة</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Products Grid / Empty State */}
            {filteredProducts.length === 0 ? (
              <div className="empty-cat-state">
                <div className="empty-icon">
                  <FaBoxOpen />
                </div>
                <h3>لا توجد منتجات مطابقة للفلاتر المختارة</h3>
                <p>
                  جرّب تعديل معايير الفلترة في القائمة الجانبية أو مسح البحث لعرض جميع منتجات القسم.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="clear-filters-btn"
                >
                  إعادة ضبط جميع الفلاتر ({products.length})
                </button>
              </div>
            ) : (
              <>
                <div className={`cat-products-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
                  {paginatedProducts.map((prod) => (
                    <StoreProductCard
                      key={prod.id}
                      product={prod}
                      lang={lang}
                      onShareClick={handleQuickShareProduct}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <nav className="ecom-pagination-bar" aria-label="تصفح صفحات القسم">
                    <div className="pag-info">
                      صفحة <strong>{currentPage}</strong> من <strong>{totalPages}</strong> — إجمالي{' '}
                      <strong>{filteredProducts.length}</strong> منتج في القسم
                    </div>

                    <div className="pag-controls">
                      <button
                        type="button"
                        className="pag-nav-btn"
                        disabled={currentPage <= 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                      >
                        <FaChevronRight size={11} />
                        <span>السابق</span>
                      </button>

                      {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((num) => (
                        <button
                          key={num}
                          type="button"
                          className={`pag-num-btn ${currentPage === num ? 'active' : ''}`}
                          onClick={() => handlePageChange(num)}
                        >
                          {num}
                        </button>
                      ))}

                      <button
                        type="button"
                        className="pag-nav-btn"
                        disabled={currentPage >= totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                      >
                        <span>التالي</span>
                        <FaChevronLeft size={11} />
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

export default function SingleCategoryPage() {
  return (
    <Suspense
      fallback={
        <div className="cats-page-wrapper" dir="rtl">
          <div className="cats-container" style={{ paddingTop: '64px', textAlign: 'center' }}>
            <p style={{ fontSize: '18px', fontWeight: 800, color: '#1d4ed8' }}>
              جاري تحميل صفحة القسم...
            </p>
          </div>
        </div>
      }
    >
      <SingleCategoryContent />
    </Suspense>
  );
}
