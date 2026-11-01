'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getApiHost } from '@/src/utils/apiConfig';
import { getInitialLang, setAppLang, formatLangHref } from '@/src/hooks/useTrendlineLang';
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

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (mobileMenuOpen) {
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
  }, [mobileMenuOpen]);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
      const searchTarget = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
      router.push(formatLangHref(searchTarget, currentLang));
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
          <Link href={formatLangHref('/', currentLang)} className="brand-logo-link" aria-label="Trendline Tech Home">
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
            <Link href={formatLangHref('/contact', currentLang)} className="user-link-item contact-us-btn">
              <span className="link-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </span>
              <span>{isRtl ? 'تواصل معنا' : 'Contact Us'}</span>
            </Link>
          )}

          {/* Shopping Cart Icon with Badge */}
          <Link href={formatLangHref('/cart', currentLang)} className="cart-btn-wrapper" aria-label="Shopping Cart">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span className="cart-badge">{cartCount}</span>
          </Link>

          {/* Mobile Menu Toggle Button */}
          <button
            className={`mobile-menu-toggle ${mobileMenuOpen ? 'is-active' : ''}`}
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

      {/* Mobile Drawer Glassmorphic Backdrop */}
      <div
        className={`mobile-menu-backdrop ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* ---------------- Lower Bar / Mobile Drawer ---------------- */}
      <nav className={`navbar-lower-bar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="lower-nav-content">
          {/* Mobile Search inside Drawer */}
          <div className="mobile-drawer-search">
            <form
              className="drawer-search-form"
              onSubmit={(e) => {
                handleSearchSubmit(e);
                setMobileMenuOpen(false);
              }}
            >
              <input
                type="text"
                className="drawer-search-input"
                placeholder={isRtl ? 'ابحث عن منتجات، ماركات، فئات...' : 'Search for products, brands...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="drawer-search-btn" aria-label="Search">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            </form>
          </div>

          <ul className="nav-links-list">
            {/* الرئيسية (Active on root) */}
            <li className={`nav-link-item ${pathname === '/' ? 'active' : ''}`}>
              <Link
                href={formatLangHref('/', currentLang)}
                className="nav-anchor"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="nav-anchor-left">
                  <span className="nav-item-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                  </span>
                  <span className="nav-item-label">{isRtl ? 'الرئيسية' : 'Home'}</span>
                </div>
              </Link>
            </li>

            {/* المنتجات */}
            <li className={`nav-link-item ${pathname?.startsWith('/products') ? 'active' : ''}`}>
              <Link
                href={formatLangHref('/products', currentLang)}
                className="nav-anchor"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="nav-anchor-left">
                  <span className="nav-item-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="7" height="7" x="3" y="3" rx="1"></rect>
                      <rect width="7" height="7" x="14" y="3" rx="1"></rect>
                      <rect width="7" height="7" x="14" y="14" rx="1"></rect>
                      <rect width="7" height="7" x="3" y="14" rx="1"></rect>
                    </svg>
                  </span>
                  <span className="nav-item-label">{isRtl ? 'المنتجات' : 'Products'}</span>
                </div>
              </Link>
            </li>

            {/* الأقسام (With Dropdown) */}
            <li
              className={`nav-link-item ${pathname?.startsWith('/categories') ? 'active' : ''} ${categoriesDropdownOpen ? 'categories-expanded' : ''}`}
              ref={dropdownRef}
              onMouseEnter={() => setCategoriesDropdownOpen(true)}
              onMouseLeave={() => setCategoriesDropdownOpen(false)}
            >
              <Link
                href={formatLangHref('/categories', currentLang)}
                className="nav-anchor"
                onClick={(e) => {
                  if (typeof window !== 'undefined' && window.innerWidth <= 860) {
                    e.preventDefault();
                    setCategoriesDropdownOpen(!categoriesDropdownOpen);
                  } else {
                    setMobileMenuOpen(false);
                  }
                }}
              >
                <div className="nav-anchor-left">
                  <span className="nav-item-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                      <polyline points="2 17 12 22 22 17"></polyline>
                      <polyline points="2 12 12 17 22 12"></polyline>
                    </svg>
                  </span>
                  <span className="nav-item-label">{isRtl ? 'الأقسام' : 'Categories'}</span>
                </div>
                <svg
                  className="dropdown-chevron"
                  width="15"
                  height="15"
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
                      href={formatLangHref(`/categories/${encodeURIComponent(cat.id)}/${encodeURIComponent(cat.slug || cat.id)}`, currentLang)}
                      className="dropdown-category-link"
                      onClick={() => {
                        setCategoriesDropdownOpen(false);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <div className="cat-left-meta">
                        <span className="cat-bullet"></span>
                        <span className="cat-name">{isRtl ? (cat.name_ar || cat.name) : (cat.name_en || cat.name)}</span>
                      </div>
                      {cat.subcategories?.length > 0 && (
                        <span className="cat-tag">
                          {cat.subcategories.length} {isRtl ? 'أقسام' : 'subs'}
                        </span>
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
                  href={formatLangHref('/categories', currentLang)}
                  className="dropdown-category-link view-all-cats"
                  onClick={() => {
                    setCategoriesDropdownOpen(false);
                    setMobileMenuOpen(false);
                  }}
                >
                  {isRtl ? 'عرض جميع الأقسام ←' : 'View All Categories →'}
                </Link>
              </div>
            </li>

            {/* عروض خاصة */}
            <li className={`nav-link-item ${pathname === '/deals' ? 'active' : ''}`}>
              <Link
                href={formatLangHref('/deals', currentLang)}
                className="nav-anchor"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="nav-anchor-left">
                  <span className="nav-item-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
                    </svg>
                  </span>
                  <span className="nav-item-label">{isRtl ? 'عروض خاصة' : 'Special Deals'}</span>
                </div>
                <span className="nav-item-badge hot-badge">
                  {isRtl ? 'عروض 🔥' : 'Hot 🔥'}
                </span>
              </Link>
            </li>

            {/* تتبع الطلب */}
            <li className={`nav-link-item ${pathname === '/track-order' ? 'active' : ''}`}>
              <Link
                href={formatLangHref('/track-order', currentLang)}
                className="nav-anchor"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="nav-anchor-left">
                  <span className="nav-item-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path>
                      <path d="M15 18H9"></path>
                      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"></path>
                      <circle cx="17" cy="18" r="2"></circle>
                      <circle cx="7" cy="18" r="2"></circle>
                    </svg>
                  </span>
                  <span className="nav-item-label">{isRtl ? 'تتبع الطلب' : 'Track Order'}</span>
                </div>
              </Link>
            </li>

            {/* من نحن */}
            <li className={`nav-link-item ${pathname === '/about' ? 'active' : ''}`}>
              <Link
                href={formatLangHref('/about', currentLang)}
                className="nav-anchor"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="nav-anchor-left">
                  <span className="nav-item-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 16v-4"></path>
                      <path d="M12 8h.01"></path>
                    </svg>
                  </span>
                  <span className="nav-item-label">{isRtl ? 'من نحن' : 'About Us'}</span>
                </div>
              </Link>
            </li>

            {/* تواصل معنا */}
            <li className={`nav-link-item ${pathname === '/contact' ? 'active' : ''}`}>
              <Link
                href={formatLangHref('/contact', currentLang)}
                className="nav-anchor"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="nav-anchor-left">
                  <span className="nav-item-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </span>
                  <span className="nav-item-label">{isRtl ? 'تواصل معنا' : 'Contact Us'}</span>
                </div>
              </Link>
            </li>
          </ul>

          {/* Quick Action Footer inside Drawer */}
          <div className="mobile-drawer-footer">
            <button
              type="button"
              className="drawer-footer-btn lang-toggle"
              onClick={() => {
                handleToggleLanguage();
                setMobileMenuOpen(false);
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <span>{currentLang === 'ar' ? 'English (EN)' : 'العربية (AR)'}</span>
            </button>

            {isAdminLoggedIn && (
              <Link
                href="/admin/products"
                className="drawer-footer-btn admin-dashboard"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="7" height="7" x="3" y="3" rx="1"></rect>
                  <rect width="7" height="7" x="14" y="3" rx="1"></rect>
                  <rect width="7" height="7" x="14" y="14" rx="1"></rect>
                  <rect width="7" height="7" x="3" y="14" rx="1"></rect>
                </svg>
                <span>{isRtl ? 'لوحة التحكم' : 'Dashboard'}</span>
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
