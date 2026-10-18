'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { getApiHost } from '@/src/utils/apiConfig';
import './Navbar.scss';

export default function Navbar({ lang = 'ar' }) {
  const pathname = usePathname();
  const router = useRouter();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);

  const dropdownRef = useRef(null);

  // Handle scroll effect for glassmorphism elevation
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch categories for the dynamic dropdown
  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      try {
        const apiHost = getApiHost();
        const res = await fetch(`${apiHost}/api/v1/catalog/categories/tree`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && isMounted) {
            setCategories(json.data);
          }
        }
      } catch (err) {
        // Fallback default categories if offline or server loading
        if (isMounted) {
          setCategories([
            { id: 1, name_ar: 'أجهزة الشبكات والواي فاي', name_en: 'Networking & WiFi', slug: 'networking' },
            { id: 2, name_ar: 'أنظمة الأمان والمراقبة', name_en: 'Security & Surveillance', slug: 'surveillance' },
            { id: 3, name_ar: 'إكسسوارات كمبيوتر ولابتوب', name_en: 'Computer Accessories', slug: 'accessories' },
            { id: 4, name_ar: 'راوترات ومقويات إشارة', name_en: 'Routers & Extenders', slug: 'routers' },
          ]);
        }
      }
    };

    fetchCategories();
    return () => { isMounted = false; };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setCategoriesDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Search Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isRtl = lang === 'ar';

  return (
    <header className={`trendline-navbar-wrapper ${isScrolled ? 'scrolled' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* ---------------- Upper Bar ---------------- */}
      <div className="navbar-upper-bar">
        {/* Brand Logo Area */}
        <div className="nav-brand-area">
          <Link href="/" className="brand-logo-link" aria-label="Trendline Tech Home">
            <Image
              src="/assets/logo.png"
              alt="Trendline Tech"
              width={180}
              height={50}
              priority
              className="brand-logo-img"
            />
          </Link>
        </div>

        {/* Central Search Box (Pill Shape) */}
        <div className="nav-search-container">
          <form className="search-form" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              className="search-input"
              placeholder={isRtl ? 'ابحث عن منتجات، ماركات، أو فئات...' : 'Search for products, brands, or categories...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="search-icon-btn" aria-label="Search">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </form>
        </div>

        {/* User Actions & Cart */}
        <div className="nav-user-actions">
          {/* Login Link */}
          <Link href="/admin/login" className="user-link-item">
            <span className="link-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z" />
              </svg>
            </span>
            <span>{isRtl ? 'تسجيل الدخول' : 'Sign In'}</span>
          </Link>

          {/* Register Link */}
          <Link href="/register" className="user-link-item">
            <span className="link-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </span>
            <span>{isRtl ? 'إنشاء حساب' : 'Register'}</span>
          </Link>

          {/* Shopping Cart Icon with Badge */}
          <Link href="/cart" className="cart-btn-wrapper" aria-label="Shopping Cart">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span className="cart-badge">{cartCount}</span>
          </Link>

          {/* Mobile Menu Toggle Button */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* ---------------- Lower Bar ---------------- */}
      <nav className={`navbar-lower-bar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="lower-nav-content">
          <ul className="nav-links-list">
            {/* الرئيسية (Active on root) */}
            <li className={`nav-link-item ${pathname === '/' ? 'active' : ''}`}>
              <Link href="/" className="nav-anchor">
                {isRtl ? 'الرئيسية' : 'Home'}
              </Link>
            </li>

            {/* المنتجات */}
            <li className={`nav-link-item ${pathname?.startsWith('/products') ? 'active' : ''}`}>
              <Link href="/products" className="nav-anchor">
                {isRtl ? 'المنتجات' : 'Products'}
              </Link>
            </li>

            {/* الأقسام (With Dropdown) */}
            <li
              className={`nav-link-item ${pathname?.startsWith('/categories') ? 'active' : ''}`}
              ref={dropdownRef}
              onMouseEnter={() => setCategoriesDropdownOpen(true)}
              onMouseLeave={() => setCategoriesDropdownOpen(false)}
            >
              <Link
                href="/categories"
                className="nav-anchor"
                onClick={(e) => {
                  // Allow navigation, or toggle on touch devices
                  if (window.innerWidth <= 860) {
                    e.preventDefault();
                    setCategoriesDropdownOpen(!categoriesDropdownOpen);
                  }
                }}
              >
                <span>{isRtl ? 'الأقسام' : 'Categories'}</span>
                <svg
                  className="dropdown-chevron"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </Link>

              {/* Glassmorphic Dropdown Menu */}
              <div className={`categories-dropdown-menu ${categoriesDropdownOpen ? 'show' : ''}`}>
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/categories/${cat.slug || cat.id}`}
                      className="dropdown-category-link"
                      onClick={() => setCategoriesDropdownOpen(false)}
                    >
                      <span>{isRtl ? (cat.name_ar || cat.name) : (cat.name_en || cat.name)}</span>
                      {cat.subcategories?.length > 0 && (
                        <span className="cat-tag">+{cat.subcategories.length}</span>
                      )}
                    </Link>
                  ))
                ) : (
                  <div className="p-3 text-sm text-slate-400 text-center">
                    {isRtl ? 'جاري تحميل الأقسام...' : 'Loading categories...'}
                  </div>
                )}
                <div className="dropdown-divider"></div>
                <Link
                  href="/categories"
                  className="dropdown-category-link view-all-cats"
                  onClick={() => setCategoriesDropdownOpen(false)}
                >
                  {isRtl ? 'عرض جميع الأقسام ←' : 'View All Categories →'}
                </Link>
              </div>
            </li>

            {/* عروض خاصة */}
            <li className={`nav-link-item ${pathname === '/deals' ? 'active' : ''}`}>
              <Link href="/deals" className="nav-anchor">
                {isRtl ? 'عروض خاصة' : 'Special Deals'}
              </Link>
            </li>

            {/* تتبع الطلب */}
            <li className={`nav-link-item ${pathname === '/track-order' ? 'active' : ''}`}>
              <Link href="/track-order" className="nav-anchor">
                {isRtl ? 'تتبع الطلب' : 'Track Order'}
              </Link>
            </li>

            {/* من نحن */}
            <li className={`nav-link-item ${pathname === '/about' ? 'active' : ''}`}>
              <Link href="/about" className="nav-anchor">
                {isRtl ? 'من نحن' : 'About Us'}
              </Link>
            </li>

            {/* تواصل معنا */}
            <li className={`nav-link-item ${pathname === '/contact' ? 'active' : ''}`}>
              <Link href="/contact" className="nav-anchor">
                {isRtl ? 'تواصل معنا' : 'Contact Us'}
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
