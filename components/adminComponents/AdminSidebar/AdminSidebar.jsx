'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaBoxesStacked, FaFolderTree, FaPlus, FaChevronDown, FaTag, FaCopyright } from 'react-icons/fa6';
import './AdminSidebar.scss';

export default function AdminSidebar({ isCollapsed, onToggleCollapse, lang = 'ar' }) {
  const pathname = usePathname();
  const isRtl = lang === 'ar';

  const [openMenus, setOpenMenus] = useState(() => ({
    products: pathname === '/admin/products' || pathname?.startsWith('/admin/products/'),
    categories: pathname === '/admin/categories' || pathname?.startsWith('/admin/categories/'),
    tags: pathname === '/admin/tags' || pathname?.startsWith('/admin/tags/') || pathname === '/admin/brands' || pathname?.startsWith('/admin/brands/'),
  }));

  useEffect(() => {
    if (pathname === '/admin/products' || pathname?.startsWith('/admin/products/')) {
      setOpenMenus((prev) => ({ ...prev, products: true }));
    }
    if (pathname === '/admin/categories' || pathname?.startsWith('/admin/categories/')) {
      setOpenMenus((prev) => ({ ...prev, categories: true }));
    }
    if (pathname === '/admin/tags' || pathname?.startsWith('/admin/tags/') || pathname === '/admin/brands' || pathname?.startsWith('/admin/brands/')) {
      setOpenMenus((prev) => ({ ...prev, tags: true }));
    }
  }, [pathname]);

  const toggleSubmenu = (menuKey) => {
    if (isCollapsed && onToggleCollapse) {
      onToggleCollapse();
      setOpenMenus((prev) => ({ ...prev, [menuKey]: true }));
      return;
    }
    setOpenMenus((prev) => ({ ...prev, [menuKey]: !prev[menuKey] }));
  };

  const menuSections = [
    {
      title: isRtl ? 'نظرة عامة' : 'Overview',
      items: [
        {
          href: '/admin',
          label: isRtl ? 'لوحة التحكم' : 'Dashboard',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          )
        }
      ]
    },
    {
      title: isRtl ? 'إدارة المتجر والكتالوج' : 'Catalog & Store',
      items: [
        {
          key: 'products',
          label: isRtl ? 'المنتجات' : 'Products',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          ),
          subItems: [
            {
              href: '/admin/products',
              label: isRtl ? 'كل المنتجات' : 'All Products',
              icon: <FaBoxesStacked size={13} />
            },
            {
              href: '/admin/products/add',
              label: isRtl ? 'إضافة منتج' : 'Add Product',
              icon: <FaPlus size={12} />
            }
          ]
        },
        {
          key: 'categories',
          label: isRtl ? 'الأقسام والتصنيفات' : 'Categories',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          ),
          subItems: [
            {
              href: '/admin/categories',
              label: isRtl ? 'كل الأقسام' : 'All Categories',
              icon: <FaFolderTree size={13} />
            },
            {
              href: '/admin/categories/add',
              label: isRtl ? 'إضافة قسم' : 'Add Category',
              icon: <FaPlus size={12} />
            }
          ]
        },
        {
          key: 'tags',
          label: isRtl ? 'وسوم الربط والعلامات' : 'Tags & Brands',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
          ),
          subItems: [
            {
              href: '/admin/brands',
              label: isRtl ? 'إدارة البراندات' : 'Manage Brands',
              icon: <FaCopyright size={13} />
            },
            {
              href: '/admin/brands/add',
              label: isRtl ? 'إضافة براند جديد' : 'Add Brand',
              icon: <FaPlus size={12} />
            },
            {
              href: '/admin/tags',
              label: isRtl ? 'وسوم الربط (Tags)' : 'Rule Tags',
              icon: <FaTag size={13} />
            },
            {
              href: '/admin/tags/add',
              label: isRtl ? 'إضافة وسم جديد' : 'Add New Tag',
              icon: <FaPlus size={12} />
            }
          ]
        },
        {
          href: '/admin/bundles',
          label: isRtl ? 'باقات التوفير (Bundles)' : 'Bundles',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="21 8 21 21 3 21 3 8"></polyline>
              <rect x="1" y="3" width="22" height="5"></rect>
              <line x1="10" y1="12" x2="14" y2="12"></line>
            </svg>
          )
        }
      ]
    },
    {
      title: isRtl ? 'المبيعات والطلبات' : 'Sales & Orders',
      items: [
        {
          href: '/admin/orders',
          label: isRtl ? 'إدارة الطلبات' : 'Orders',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          )
        },
        {
          href: '/admin/returns',
          label: isRtl ? 'المرتجعات (RMA)' : 'Returns & RMA',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10"></polyline>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
            </svg>
          )
        }
      ]
    },
    {
      title: isRtl ? 'نظام المستودعات ERP' : 'ERP & Logistics',
      items: [
        {
          href: '/admin/inventory',
          label: isRtl ? 'إدارة المخزون والمستودعات' : 'Inventory & WMS',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          )
        },
        {
          href: '/admin/procurement',
          label: isRtl ? 'أوامر الشراء والموردين' : 'Procurement & Suppliers',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          )
        },
        {
          href: '/admin/finance',
          label: isRtl ? 'الدفتر المالي (Financials)' : 'Financial Ledger',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          )
        }
      ]
    },
    {
      title: isRtl ? 'التسويق والإعدادات' : 'Marketing & Settings',
      items: [
        {
          href: '/admin/coupons',
          label: isRtl ? 'كوبونات الخصم والعروض' : 'Coupons & Offers',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          )
        },
        {
          href: '/admin/slider',
          label: isRtl ? 'سلايدر الرئيسية' : 'Hero Slider',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          )
        },
        {
          href: '/admin/cms',
          label: isRtl ? 'إدارة البانرات والمحتوى' : 'Banners & CMS',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          )
        },
        {
          href: '/admin/settings',
          label: isRtl ? 'إعدادات النظام والشحن' : 'Settings & Shipping',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          )
        }
      ]
    }
  ];

  return (
    <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''} ${!isRtl ? 'dir-ltr' : ''}`}>
      {/* Brand Header */}
      <div className="brand-header">
        <Link href="/admin" className="brand-link">
          <div className="brand-icon-box">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="brand-title">Trendline Tech</h2>
              <span className="brand-sub">{isRtl ? 'لوحة تحكم ERP' : 'ERP Control Portal'}</span>
            </div>
          )}
        </Link>
        {onToggleCollapse && (
          <button
            type="button"
            className="collapse-toggle-btn"
            onClick={onToggleCollapse}
            aria-label="Toggle Sidebar"
            title={isCollapsed ? (isRtl ? 'توسيع القائمة' : 'Expand Sidebar') : (isRtl ? 'طي القائمة' : 'Collapse Sidebar')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isCollapsed ? (
                isRtl ? (
                  <path d="M15 18l-6-6 6-6" />
                ) : (
                  <path d="M9 18l6-6-6-6" />
                )
              ) : (
                isRtl ? (
                  <path d="M9 18l6-6-6-6" />
                ) : (
                  <path d="M15 18l-6-6 6-6" />
                )
              )}
            </svg>
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {menuSections.map((section, sIdx) => (
          <div key={sIdx} className="nav-section-group">
            {!isCollapsed && <div className="nav-section-title">{section.title}</div>}
            {section.items.map((item, iIdx) => {
              if (item.subItems) {
                const isParentActive =
                  item.key === 'products'
                    ? pathname === '/admin/products' || pathname?.startsWith('/admin/products/')
                    : item.key === 'categories'
                    ? pathname === '/admin/categories' || pathname?.startsWith('/admin/categories/')
                    : item.key === 'tags'
                    ? pathname === '/admin/tags' || pathname?.startsWith('/admin/tags/') || pathname?.startsWith('/admin/brands/')
                    : false;
                const isOpen = !!openMenus[item.key];

                return (
                  <div key={iIdx} className="nav-group-container">
                    <button
                      type="button"
                      className={`nav-item nav-parent-btn ${isParentActive ? 'parent-active' : ''} ${isOpen ? 'menu-open' : ''}`}
                      onClick={() => toggleSubmenu(item.key)}
                      title={item.label}
                      aria-expanded={isOpen}
                    >
                      <span className="nav-icon">{item.icon}</span>
                      {!isCollapsed && <span className="nav-label">{item.label}</span>}
                      {!isCollapsed && (
                        <span className={`nav-chevron ${isOpen ? 'rotated' : ''}`}>
                          <FaChevronDown size={11} />
                        </span>
                      )}
                    </button>

                    {!isCollapsed && isOpen && (
                      <div className="nav-sub-menu">
                        {item.subItems.map((subItem, subIdx) => {
                          const isSubActive = pathname === subItem.href;
                          return (
                            <Link
                              key={subIdx}
                              href={subItem.href}
                              className={`nav-sub-item ${isSubActive ? 'active' : ''}`}
                              title={subItem.label}
                            >
                              <span className="nav-sub-icon">{subItem.icon}</span>
                              <span className="nav-sub-label">{subItem.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const isActive = pathname === item.href;
              return (
                <Link
                  key={iIdx}
                  href={item.href}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  title={item.label}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!isCollapsed && <span className="nav-label">{item.label}</span>}
                  {!isCollapsed && item.badge && (
                    <span className="nav-badge">{item.badge}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ERP Status Footer */}
      {!isCollapsed && (
        <div className="sidebar-footer">
          <div className="erp-status-indicator">
            <span className="status-pulse"></span>
            <span>{isRtl ? 'نظام الـ ERP متصل ونشط' : 'ERP Engine Connected'}</span>
          </div>
        </div>
      )}
    </aside>
  );
}
