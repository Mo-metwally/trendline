'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AdminSidebar,
  AdminHeader,
  useToast,
} from '@/src/components/adminComponents';
import {
  FaPlus,
  FaMagnifyingGlass,
  FaTrashCan,
  FaPenToSquare,
  FaEye,
  FaCheck,
  FaXmark,
  FaLayerGroup,
  FaGlobe,
  FaCircleCheck,
  FaBan,
  FaImage,
} from 'react-icons/fa6';
import { getApiHost } from '@/src/utils/apiConfig';
import { getServiceCardTheme } from '@/src/utils/serviceTheme';
import './Services.scss';

export default function ServicesListPage() {
  const toast = useToast();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lang, setLang] = useState('ar');
  const isRtl = lang === 'ar';

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Fetch Services List
  const fetchServices = async () => {
    setLoading(true);
    try {
      const apiHost = getApiHost();
      const res = await fetch(`${apiHost}/api/v1/services`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setServices(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch services:', err);
      toast.error(
        isRtl ? 'تعذر جلب قائمة الخدمات من الخادم' : 'Failed to load services',
        isRtl ? 'خطأ في الاتصال' : 'Connection Error'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Toggle Active Status
  const handleToggleActive = async (id, currentStatus) => {
    try {
      const apiHost = getApiHost();
      const res = await fetch(`${apiHost}/api/v1/services/${id}/toggle`, {
        method: 'PATCH',
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setServices((prev) =>
          prev.map((s) => (s.id === id ? { ...s, is_active: !currentStatus } : s))
        );
        toast.success(
          json.message || (isRtl ? 'تم تحديث حالة الخدمة' : 'Service status updated'),
          isRtl ? 'تم التحديث' : 'Updated'
        );
      }
    } catch (err) {
      toast.error(
        isRtl ? 'فشل تغيير حالة الخدمة' : 'Failed to toggle status',
        isRtl ? 'خطأ' : 'Error'
      );
    }
  };

  // Delete Service
  const handleDeleteService = async (id, name) => {
    if (
      !window.confirm(
        isRtl
          ? `هل أنت متأكد من حذف الخدمة "${name}"؟`
          : `Are you sure you want to delete service "${name}"?`
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      const apiHost = getApiHost();
      const res = await fetch(`${apiHost}/api/v1/services/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setServices((prev) => prev.filter((s) => s.id !== id));
        toast.success(
          isRtl ? 'تم حذف الخدمة بنجاح' : 'Service deleted successfully',
          isRtl ? 'تم الحذف' : 'Deleted'
        );
      }
    } catch (err) {
      toast.error(
        isRtl ? 'حدث خطأ أثناء حذف الخدمة' : 'Error deleting service',
        isRtl ? 'خطأ' : 'Error'
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered Services by Search
  const filteredServices = services.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name_ar?.toLowerCase().includes(q) ||
      s.name_en?.toLowerCase().includes(q) ||
      s.slug?.toLowerCase().includes(q) ||
      s.short_desc_ar?.toLowerCase().includes(q)
    );
  });

  // Stats Counters
  const totalCount = services.length;
  const activeCount = services.filter((s) => s.is_active).length;
  const inactiveCount = totalCount - activeCount;

  return (
    <div className={`admin-page-container ${isRtl ? 'dir-rtl' : 'dir-ltr'}`}>
      <AdminSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        lang={lang}
      />

      <div className={`admin-main-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <AdminHeader
          lang={lang}
          onToggleLanguage={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          isSidebarCollapsed={sidebarCollapsed}
          title={isRtl ? 'إدارة الخدمات' : 'Services Management'}
        />

        <main className="services-list-content-flow">
          {/* Top Breadcrumbs & Action Bar */}
          <div className="services-page-header">
            <div className="header-breadcrumbs">
              <Link href="/admin">{isRtl ? 'لوحة التحكم' : 'Dashboard'}</Link>
              <span className="crumb-sep">/</span>
              <span className="crumb-current">{isRtl ? 'الخدمات' : 'Services'}</span>
            </div>
            <div className="header-action-row">
              <h1 className="page-heading-title">
                {isRtl ? 'إدارة خدمات المتجر' : 'Services Management'}
              </h1>
              <Link href="/admin/services/add" className="btn-add-service-main">
                <FaPlus />
                <span>{isRtl ? 'إضافة خدمة جديدة' : 'Add New Service'}</span>
              </Link>
            </div>
          </div>

          {/* Stats Cards Row */}
          <div className="services-stats-grid">
            <div className="stat-card-box stat-total">
              <div className="stat-icon-wrapper">
                <FaLayerGroup />
              </div>
              <div className="stat-meta">
                <span className="stat-number">{totalCount}</span>
                <span className="stat-title">{isRtl ? 'إجمالي الخدمات' : 'Total Services'}</span>
              </div>
            </div>

            <div className="stat-card-box stat-active">
              <div className="stat-icon-wrapper">
                <FaCircleCheck />
              </div>
              <div className="stat-meta">
                <span className="stat-number">{activeCount}</span>
                <span className="stat-title">{isRtl ? 'خدمات نشطة' : 'Active Services'}</span>
              </div>
            </div>

            <div className="stat-card-box stat-inactive">
              <div className="stat-icon-wrapper">
                <FaBan />
              </div>
              <div className="stat-meta">
                <span className="stat-number">{inactiveCount}</span>
                <span className="stat-title">{isRtl ? 'خدمات مسودة / معطلة' : 'Draft / Inactive'}</span>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="services-filter-card">
            <div className="search-input-box">
              <FaMagnifyingGlass className="search-icon" />
              <input
                type="text"
                placeholder={isRtl ? 'بحث باسم الخدمة، الرابط، أو الوصف...' : 'Search services...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                >
                  <FaXmark />
                </button>
              )}
            </div>
          </div>

          {/* Data Table */}
          <div className="services-table-wrapper">
            {loading ? (
              <div className="table-loading-stage">
                <div className="spinner-ring" />
                <span>{isRtl ? 'جاري تحميل الخدمات...' : 'Loading services...'}</span>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="table-empty-stage">
                <div className="empty-icon-circle">
                  <FaLayerGroup size={36} />
                </div>
                <h3>{isRtl ? 'لا توجد خدمات مضافة حالياً' : 'No services found'}</h3>
                <p>
                  {searchQuery
                    ? (isRtl ? 'لا توجد خدمات مطابقة لبحثك' : 'No services matching your search query')
                    : (isRtl ? 'ابدأ بإضافة أول خدمة تقنية في المتجر' : 'Start by adding your first service')}
                </p>
                <Link href="/admin/services/add" className="btn-add-service-main">
                  <FaPlus />
                  <span>{isRtl ? 'إضافة خدمة جديدة الآن' : 'Add First Service'}</span>
                </Link>
              </div>
            ) : (
              <table className="services-data-table">
                <thead>
                  <tr>
                    <th>{isRtl ? 'غلاف الخدمة والاستايل' : 'Cover & Style'}</th>
                    <th>{isRtl ? 'اسم الخدمة' : 'Service Name'}</th>
                    <th>{isRtl ? 'الرابط (Slug)' : 'Slug'}</th>
                    <th>{isRtl ? 'تأثير السطح' : 'Surface Finish'}</th>
                    <th>{isRtl ? 'الحالة' : 'Status'}</th>
                    <th>{isRtl ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map((srv) => (
                    <tr key={srv.id}>
                      {/* Cover & Style Swatch */}
                      <td>
                        <div className="service-cell-cover">
                          {srv.cover_image ? (
                            <img src={srv.cover_image} alt={srv.name_ar} className="cell-cover-img" />
                          ) : (
                            <div className="cell-cover-placeholder">
                              <FaImage />
                            </div>
                          )}
                          <span
                            className="cell-theme-dot"
                            style={{ background: getServiceCardTheme(srv).style.background }}
                            title={srv.preset_style || srv.theme_mode}
                          />
                        </div>
                      </td>

                      {/* Name AR & EN */}
                      <td>
                        <div className="service-cell-names">
                          <span className="name-ar-title">{srv.name_ar}</span>
                          <span className="name-en-sub">{srv.name_en}</span>
                        </div>
                      </td>

                      {/* Slug */}
                      <td>
                        <code className="service-slug-badge">/services/{srv.slug}</code>
                      </td>

                      {/* Surface Finish */}
                      <td>
                        <span className={`finish-tag finish-${srv.surface_finish || 'glass'}`}>
                          {srv.surface_finish === 'glossy'
                            ? (isRtl ? 'لامع جلو' : 'Glossy')
                            : srv.surface_finish === 'matt'
                            ? (isRtl ? 'مطفي ناعم' : 'Matt')
                            : (isRtl ? 'زجاجي شفاف' : 'Glass')}
                        </span>
                      </td>

                      {/* Active Toggle */}
                      <td>
                        <button
                          type="button"
                          className={`status-toggle-pill ${srv.is_active ? 'active' : 'inactive'}`}
                          onClick={() => handleToggleActive(srv.id, srv.is_active)}
                        >
                          <span className="toggle-dot" />
                          <span>{srv.is_active ? (isRtl ? 'نشطة' : 'Active') : (isRtl ? 'معطلة' : 'Inactive')}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="table-actions-cluster">
                          <Link
                            href={`/admin/services/edit/${srv.id}`}
                            className="action-icon-btn edit-btn"
                            title={isRtl ? 'تعديل الخدمة والتصميم' : 'Edit Service & Theme'}
                          >
                            <FaPenToSquare />
                          </Link>
                          <button
                            type="button"
                            className="action-icon-btn delete-btn"
                            title={isRtl ? 'حذف الخدمة' : 'Delete'}
                            onClick={() => handleDeleteService(srv.id, srv.name_ar)}
                            disabled={deletingId === srv.id}
                          >
                            <FaTrashCan />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
