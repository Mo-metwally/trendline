'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import './AdminHeader.scss';

export default function AdminHeader({
  adminUser = { name: 'Ahmed Sayed', email: 'ahmed.sayed@trendlineeg.com', role: 'SUPER_ADMIN' },
  lang = 'ar',
  onToggleLanguage,
  onToggleSidebar,
  isSidebarCollapsed = false,
  notificationCount = 3
}) {
  const router = useRouter();
  const isRtl = lang === 'ar';

  const handleLogout = async () => {
    try {
      // Clear client session cookie
      document.cookie = 'trendline_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.cookie = 'next-auth.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.cookie = '__Secure-next-auth.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      
      // Call backend logout endpoint if available
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch {
        // Ignore network error on logout
      }
    } finally {
      router.push('/admin/login');
      router.refresh();
    }
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <header className={`admin-header ${isRtl ? 'dir-rtl' : 'dir-ltr'} ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Left Area: Toggle & Search */}
      <div className="header-left">
        {onToggleSidebar && (
          <button
            type="button"
            className="header-action-btn mobile-menu-btn"
            onClick={onToggleSidebar}
            aria-label="Toggle Sidebar Menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        )}

        <div className="header-search">
          <span className="search-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input
            type="text"
            placeholder={isRtl ? 'بحث في المنتجات، الطلبات، العملاء...' : 'Search products, orders, customers...'}
          />
        </div>
      </div>

      {/* Right Area: Language Switcher, Notifications, Profile & Logout */}
      <div className="header-right">
        {onToggleLanguage && (
          <button
            type="button"
            className="lang-toggle-btn"
            onClick={onToggleLanguage}
            title={isRtl ? 'تغيير اللغة إلى الإنجليزية' : 'Switch to Arabic'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <span>{isRtl ? 'English' : 'العربية'}</span>
          </button>
        )}

        {/* Notifications Icon */}
        <button
          type="button"
          className="header-action-btn"
          aria-label="Notifications"
          title={isRtl ? 'الإشعارات والتنبيهات' : 'Notifications'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          {notificationCount > 0 && <span className="notification-dot"></span>}
        </button>

        {/* User Profile & Logout */}
        <div className="admin-user-profile">
          <div className="avatar-box" title={adminUser?.name || 'Admin'}>
            {getInitials(adminUser?.name)}
          </div>
          <div className="user-meta">
            <span className="user-name">{adminUser?.name || 'Ahmed Sayed'}</span>
            <span className="user-role-badge">
              {adminUser?.role === 'SUPER_ADMIN' 
                ? (isRtl ? 'مدير عام النظام' : 'Super Admin')
                : (isRtl ? 'مسؤول مستودع' : 'Inventory Manager')}
            </span>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
            title={isRtl ? 'تسجيل الخروج' : 'Logout'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>{isRtl ? 'خروج' : 'Logout'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
