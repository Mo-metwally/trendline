'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getApiHost } from '@/src/utils/apiConfig';
import { getInitialLang, setAppLang } from '@/src/hooks/useTrendlineLang';
import './Navbar.scss';

export default function Navbar({ lang = 'ar', onToggleLang }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [currentLang, setCurrentLang] = useState(lang || 'ar');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount] = useState(0);

  const dropdownRef = useRef(null);

  useEffect(() => {
    if (lang && (lang === 'ar' || lang === 'en')) {
      setCurrentLang(lang);
    }
  }, [lang]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const initial = getInitialLang();
    if (initial === 'ar' || initial === 'en') {
      setCurrentLang(initial);
    }

    const handleLangSync = (e) => {
      const next = e?.detail || getInitialLang() || 'ar';
      if (next === 'ar' || next === 'en') {
        setCurrentLang(next);
      }
    };

    window.addEventListener('trendline_lang_changed', handleLangSync);
    window.addEventListener('storage', handleLangSync);
    return () => {
      window.removeEventListener('trendline_lang_changed', handleLangSync);
      window.removeEventListener('storage', handleLangSync);
    };
  }, []);

  // Detect if Admin is logged in (NextAuth session, JWT cookie, or localStorage token)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasTokenCookie = document.cookie
      .split('; ')
      .some(
        (row) =>
          (row.startsWith('token=') && row.split('=')[1] && row.split('=')[1] !== 'null') ||
          (row.startsWith('trendline_token=') && row.split('=')[1] && row.split('=')[1] !== 'null') ||
          row.startsWith('next-auth.session-token=') ||
          row.startsWith('__Secure-next-auth.session-token=')
      );
    const localToken = localStorage.getItem('trendline_admin_token');
    const localUser = localStorage.getItem('trendline_admin_user');
    const hasValidLocal =
      (localToken && localToken !== 'undefined' && localToken !== 'null') ||
      (localUser && localUser !== 'undefined' && localUser !== 'null');

    setIsAdminLoggedIn(status === 'authenticated' || Boolean(session?.user) || hasTokenCookie || Boolean(hasValidLocal));
  }, [status, session, pathname]);

  const handleToggleLanguage = () => {
    const nextLang = currentLang === 'ar' ? 'en' : 'ar';
    setCurrentLang(nextLang);
    setAppLang(nextLang);
    if (typeof onToggleLang === 'function') {
      onToggleLang(nextLang);
    }
  };

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
      } catch (_err) {
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

  const isRtl = currentLang === 'ar';

  return (
    <header
      suppressHydrationWarning
      className={`trendline-navbar-wrapper ${isScrolled ? 'scrolled' : ''}`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
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
          {/* Language Switcher Button */}
          <button
            type="button"
            className="user-link-item lang-switch-btn"
            onClick={handleToggleLanguage}
            title={isRtl ? 'Switch to English' : 'التبديل إلى العربية'}
          >
            <span className="link-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
            </span>
            <span>{isRtl ? 'English' : 'العربية'}</span>
          </button>

          {/* Conditional Action: Dashboard (if Admin Logged In) OR Contact Us */}
          {isAdminLoggedIn ? (
            <Link href="/admin" className="user-link-item admin-dashboard-btn">
              <span className="link-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                  <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                  <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                  <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                </svg>
              </span>
              <span>{isRtl ? 'لوحة التحكم' : 'Dashboard'}</span>
            </Link>
          ) : (
            <Link href="/contact" className="user-link-item contact-us-btn">
              <span className="link-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </span>
              <span>{isRtl ? 'تواصل معنا' : 'Contact Us'}</span>
            </Link>
          )}

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
                      href={`/categories/${encodeURIComponent(cat.id)}/${encodeURIComponent(cat.slug || cat.id)}`}
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
