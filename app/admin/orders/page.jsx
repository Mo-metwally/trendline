'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import {
  AdminSidebar,
  AdminHeader,
  useToast,
} from '@/src/components/adminComponents';
import {
  FaMagnifyingGlass,
  FaEllipsis,
  FaCommentDots,
  FaBolt,
  FaTruckFast,
  FaCircleCheck,
  FaRotateLeft,
  FaBan,
  FaCalendarDays,
  FaFilter,
  FaArrowUpRightFromSquare,
  FaPhone,
  FaWhatsapp,
  FaLocationDot,
  FaLandmark,
  FaCreditCard,
  FaMoneyBillWave,
  FaWallet,
  FaXmark,
  FaBoxOpen,
  FaClockRotateLeft,
  FaPrint,
  FaUser,
} from 'react-icons/fa6';
import { getApiHost } from '@/src/utils/apiConfig';
import './Orders.scss';

function OrdersPageContent() {
  const toast = useToast();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lang, setLang] = useState('ar');
  const isRtl = lang === 'ar';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'today', '7days', '30days', 'month', 'custom'
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  // Status Counts Badges (Matching Screenshot)
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    new: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    returned: 0,
    cancelled: 0,
  });

  // Action Menu State
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  // Selected Order for Details Drawer
  const [drawerOrder, setDrawerOrder] = useState(null);

  // Comment Modal State
  const [commentModalOrder, setCommentModalOrder] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Quick Action Submitting
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (!event.target.closest('.options-dropdown-container')) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Orders from API
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const apiHost = getApiHost();
      const params = new URLSearchParams();

      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (timeFilter && timeFilter !== 'all') {
        params.append('time_filter', timeFilter);
      }
      if (timeFilter === 'custom') {
        if (customDateFrom) params.append('date_from', customDateFrom);
        if (customDateTo) params.append('date_to', customDateTo);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      params.append('limit', '50');

      // Fetch with auth token if available
      let headers = {};
      try {
        const tokenRes = await fetch('/api/auth/token');
        if (tokenRes.ok) {
          const { token } = await tokenRes.json();
          if (token) headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (e) {}

      const res = await fetch(`${apiHost}/api/v1/orders?${params.toString()}`, {
        headers,
        cache: 'no-store',
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setOrders(json.data || []);
          setTotalCount(json.count || 0);
          if (json.status_counts) {
            setStatusCounts(json.status_counts);
          }
        }
      } else {
        toast?.error?.(isRtl ? 'تعذر جلب قائمة الطلبات' : 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
      toast?.error?.(isRtl ? 'خطأ في الاتصال بالخادم' : 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, timeFilter, customDateFrom, customDateTo]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  // Status transition handler
  const handleTransitionStatus = async (orderId, targetStatus) => {
    setOpenDropdownId(null);
    setStatusUpdatingId(orderId);
    try {
      const apiHost = getApiHost();
      let headers = { 'Content-Type': 'application/json' };
      try {
        const tokenRes = await fetch('/api/auth/token');
        if (tokenRes.ok) {
          const { token } = await tokenRes.json();
          if (token) headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (e) {}

      const res = await fetch(`${apiHost}/api/v1/orders/${orderId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: targetStatus }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast?.success?.(json.message || (isRtl ? 'تم تحديث حالة الطلب بنجاح' : 'Order status updated'));
        // Refresh local orders list
        setOrders((prev) =>
          prev.map((ord) => (ord.id === orderId ? { ...ord, order_status: targetStatus } : ord))
        );
        if (drawerOrder && drawerOrder.id === orderId) {
          setDrawerOrder({ ...drawerOrder, order_status: targetStatus });
        }
        fetchOrders();
      } else {
        toast?.error?.(json.message || (isRtl ? 'فشل تحديث الحالة' : 'Failed to update'));
      }
    } catch (err) {
      console.error('Update status error:', err);
      toast?.error?.(isRtl ? 'حدث خطأ أثناء تحديث الحالة' : 'Error updating status');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Add Comment Handler
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentModalOrder || !commentText.trim()) return;

    setCommentSubmitting(true);
    try {
      const apiHost = getApiHost();
      let headers = { 'Content-Type': 'application/json' };
      try {
        const tokenRes = await fetch('/api/auth/token');
        if (tokenRes.ok) {
          const { token } = await tokenRes.json();
          if (token) headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (e) {}

      const res = await fetch(`${apiHost}/api/v1/orders/${commentModalOrder.id}/comment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ comment: commentText.trim() }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast?.success?.(isRtl ? 'تمت إضافة التعليق الإداري بنجاح' : 'Comment added successfully');
        setCommentModalOrder(null);
        setCommentText('');
        fetchOrders();
      } else {
        toast?.error?.(json.message || 'فشل حفظ التعليق');
      }
    } catch (err) {
      console.error('Add comment error:', err);
      toast?.error?.('حدث خطأ أثناء حفظ التعليق');
    } finally {
      setCommentSubmitting(false);
    }
  };

  // Status Badge Label & Class
  const getStatusBadgeInfo = (status) => {
    switch (status) {
      case 'new':
        return { label: isRtl ? 'طلب جديد' : 'New Order', class: 'badge-new' };
      case 'confirmed':
        return { label: isRtl ? 'معلق / مؤكد' : 'Confirmed', class: 'badge-pending' };
      case 'processing':
        return { label: isRtl ? 'قيد التنفيذ' : 'Processing', class: 'badge-processing' };
      case 'shipped':
        return { label: isRtl ? 'تم الشحن' : 'Shipped', class: 'badge-shipped' };
      case 'delivered':
        return { label: isRtl ? 'تم التسليم' : 'Delivered', class: 'badge-delivered' };
      case 'cancelled':
        return { label: isRtl ? 'تم الإلغاء' : 'Cancelled', class: 'badge-cancelled' };
      case 'returned_to_warehouse':
      case 'return_received':
      case 'refunded':
        return { label: isRtl ? 'تم الإرجاع' : 'Returned', class: 'badge-returned' };
      default:
        return { label: status, class: 'badge-default' };
    }
  };

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
          title={isRtl ? 'إدارة الطلبات والعمليات' : 'Orders & Operations'}
        />

        <main className="admin-orders-content">
          {/* ================= Top Search Bar (Matches Screenshot) ================= */}
          <div className="orders-top-search-card">
            <div className="search-title-row">
              <span className="search-title-label">
                {isRtl ? 'ابحث برقم الهاتف أو الاسم أو كود الطلب' : 'Search by phone, customer name, or order code'}
              </span>
              <span className="count-label">
                {isRtl ? 'عدد الطلبات:' : 'Orders Count:'} <strong>{totalCount}</strong>
              </span>
            </div>

            <form onSubmit={handleSearchSubmit} className="search-input-form">
              <div className="input-group">
                <input
                  type="text"
                  placeholder={isRtl ? 'ابحث...' : 'Search...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="search-btn">
                  <FaMagnifyingGlass />
                </button>
              </div>
            </form>
          </div>

          {/* ================= Time Filter Row (فيلتر زمني) ================= */}
          <div className="orders-time-filter-strip">
            <div className="filter-lead">
              <FaCalendarDays className="calendar-icon" />
              <span>{isRtl ? 'الفترة الزمنية:' : 'Time Range:'}</span>
            </div>

            <div className="time-pills-list">
              <button
                type="button"
                className={`time-pill ${timeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setTimeFilter('all')}
              >
                {isRtl ? 'كل الأوقات' : 'All Time'}
              </button>
              <button
                type="button"
                className={`time-pill ${timeFilter === 'today' ? 'active' : ''}`}
                onClick={() => setTimeFilter('today')}
              >
                {isRtl ? 'اليوم' : 'Today'}
              </button>
              <button
                type="button"
                className={`time-pill ${timeFilter === '7days' ? 'active' : ''}`}
                onClick={() => setTimeFilter('7days')}
              >
                {isRtl ? 'آخر 7 أيام' : 'Last 7 Days'}
              </button>
              <button
                type="button"
                className={`time-pill ${timeFilter === 'month' ? 'active' : ''}`}
                onClick={() => setTimeFilter('month')}
              >
                {isRtl ? 'هذا الشهر' : 'This Month'}
              </button>
              <button
                type="button"
                className={`time-pill ${timeFilter === 'custom' ? 'active' : ''}`}
                onClick={() => setTimeFilter('custom')}
              >
                {isRtl ? 'مخصص من - إلى' : 'Custom Range'}
              </button>
            </div>

            {timeFilter === 'custom' && (
              <div className="custom-dates-inputs">
                <input
                  type="date"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                  placeholder="من"
                />
                <span>-</span>
                <input
                  type="date"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                  placeholder="إلى"
                />
              </div>
            )}
          </div>

          {/* ================= Status Tabs (Matches Screenshot) ================= */}
          <div className="orders-status-tabs-row">
            {/* الكل */}
            <button
              type="button"
              className={`status-tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              <span className="tab-count-pill">{statusCounts.all}</span>
              <span className="tab-name">{isRtl ? 'الكل' : 'All'}</span>
            </button>

            {/* طلب جديد */}
            <button
              type="button"
              className={`status-tab-btn ${statusFilter === 'new' ? 'active' : ''}`}
              onClick={() => setStatusFilter('new')}
            >
              <span className="tab-count-pill">{statusCounts.new}</span>
              <span className="tab-name">{isRtl ? 'طلب جديد' : 'New Order'}</span>
            </button>

            {/* معلق */}
            <button
              type="button"
              className={`status-tab-btn ${statusFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setStatusFilter('pending')}
            >
              <span className="tab-count-pill">{statusCounts.pending}</span>
              <span className="tab-name">{isRtl ? 'معلق' : 'Pending'}</span>
            </button>

            {/* قيد التنفيذ */}
            <button
              type="button"
              className={`status-tab-btn ${statusFilter === 'processing' ? 'active' : ''}`}
              onClick={() => setStatusFilter('processing')}
            >
              <span className="tab-count-pill">{statusCounts.processing}</span>
              <span className="tab-name">{isRtl ? 'قيد التنفيذ' : 'Processing'}</span>
            </button>

            {/* تم الشحن */}
            <button
              type="button"
              className={`status-tab-btn ${statusFilter === 'shipped' ? 'active' : ''}`}
              onClick={() => setStatusFilter('shipped')}
            >
              <span className="tab-count-pill">{statusCounts.shipped}</span>
              <span className="tab-name">{isRtl ? 'تم الشحن' : 'Shipped'}</span>
            </button>

            {/* تم التسليم */}
            <button
              type="button"
              className={`status-tab-btn ${statusFilter === 'delivered' ? 'active' : ''}`}
              onClick={() => setStatusFilter('delivered')}
            >
              <span className="tab-count-pill">{statusCounts.delivered}</span>
              <span className="tab-name">{isRtl ? 'تم التسليم' : 'Delivered'}</span>
            </button>

            {/* تم الإرجاع */}
            <button
              type="button"
              className={`status-tab-btn ${statusFilter === 'returned' ? 'active' : ''}`}
              onClick={() => setStatusFilter('returned')}
            >
              <span className="tab-count-pill">{statusCounts.returned}</span>
              <span className="tab-name">{isRtl ? 'تم الإرجاع' : 'Returned'}</span>
            </button>

            {/* تم الإلغاء */}
            <button
              type="button"
              className={`status-tab-btn ${statusFilter === 'cancelled' ? 'active' : ''}`}
              onClick={() => setStatusFilter('cancelled')}
            >
              <span className="tab-count-pill">{statusCounts.cancelled}</span>
              <span className="tab-name">{isRtl ? 'تم الإلغاء' : 'Cancelled'}</span>
            </button>
          </div>

          {/* ================= Orders Table (Matches Screenshot) ================= */}
          <div className="orders-table-wrapper-card">
            {loading ? (
              <div className="table-loading-stage">
                <div className="table-spinner" />
                <p>{isRtl ? 'جاري تحميل الطلبات وتحديث الحالات...' : 'Loading orders...'}</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="table-empty-stage">
                <FaBoxOpen size={42} />
                <h3>{isRtl ? 'لا توجد طلبات مطابقة للبحث أو الفلتر' : 'No matching orders found'}</h3>
                <p>{isRtl ? 'جرب تغيير شروط البحث أو التصفية الزمنية.' : 'Try adjusting search or time filters.'}</p>
              </div>
            ) : (
              <div className="table-scroll-stage">
                <table className="orders-data-table">
                  <thead>
                    <tr>
                      <th className="th-code">{isRtl ? 'كود الطلب' : 'Order Code'}</th>
                      <th className="th-customer">{isRtl ? 'العميل' : 'Customer'}</th>
                      <th className="th-phone">{isRtl ? 'الموبايل' : 'Mobile'}</th>
                      <th className="th-address">{isRtl ? 'العنوان' : 'Address'}</th>
                      <th className="th-date">{isRtl ? 'اخر تعديل' : 'Last Updated'}</th>
                      <th className="th-shipping">{isRtl ? 'الشحن' : 'Shipping'}</th>
                      <th className="th-total">{isRtl ? 'الإجمالي' : 'Total'}</th>
                      <th className="th-status">{isRtl ? 'الحالة' : 'Status'}</th>
                      <th className="th-actions">{isRtl ? 'خيارات' : 'Options'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((ord, idx) => {
                      const badge = getStatusBadgeInfo(ord.order_status);
                      const rawDate = ord.updated_at || ord.updatedAt || ord.created_at || ord.createdAt;
                      const updatedDate = rawDate ? new Date(rawDate) : null;
                      const dateFormatted = updatedDate && !isNaN(updatedDate.getTime())
                        ? `${updatedDate.getFullYear()}/${String(updatedDate.getMonth() + 1).padStart(2, '0')}/${String(updatedDate.getDate()).padStart(2, '0')}`
                        : '-';

                      return (
                        <tr key={ord.id} className={`order-row ${drawerOrder?.id === ord.id ? 'row-active' : ''}`}>
                          {/* 1. كود الطلب */}
                          <td className="cell-code">
                            <Link
                              href={`/admin/orders/${ord.id}`}
                              className="code-link-btn"
                              title={isRtl ? 'فتح صفحة تفاصيل الطلب والمنتجات' : 'Open order details page'}
                            >
                              <span>{ord.order_number}</span>
                              <FaArrowUpRightFromSquare size={11} />
                            </Link>
                          </td>

                          {/* 2. العميل */}
                          <td className="cell-customer">
                            <span className="customer-name" title={ord.customer_name}>
                              {ord.customer_name || 'عميل المتجر'}
                            </span>
                            {ord.customer_email && (
                              <span className="customer-email" title={ord.customer_email}>
                                {ord.customer_email}
                              </span>
                            )}
                          </td>

                          {/* 3. الموبايل */}
                          <td className="cell-phone">
                            <div className="phone-wrapper">
                              <span className="phone-text" dir="ltr">{ord.customer_phone}</span>
                              <a
                                href={`https://wa.me/2${ord.customer_phone.replace(/^0+/, '')}?text=${encodeURIComponent(`مرحباً ${ord.customer_name}، بخصوص طلبك رقم #${ord.order_number} من ترندلاين تك`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="whatsapp-quick-icon"
                                title="WhatsApp"
                              >
                                <FaWhatsapp size={13} />
                              </a>
                            </div>
                          </td>

                          {/* 4. العنوان */}
                          <td className="cell-address">
                            <span className="address-area">
                              {ord.governorate} {ord.city ? `- ${ord.city}` : ''}
                            </span>
                            <span className="address-details" title={ord.street_address}>
                              {ord.street_address}
                            </span>
                            {ord.landmark && (
                              <span className="address-landmark" title={ord.landmark}>
                                <FaLandmark size={10} /> {ord.landmark}
                              </span>
                            )}
                          </td>

                          {/* 5. اخر تعديل */}
                          <td className="cell-date">
                            <span className="date-text" dir="ltr">{dateFormatted}</span>
                          </td>

                          {/* 6. الشحن */}
                          <td className="cell-shipping">
                            <span className="shipping-text">
                              {Number(ord.shipping_fee || 0) > 0
                                ? `${Number(ord.shipping_fee).toLocaleString()} ج.م`
                                : (isRtl ? 'تحدد لاحقاً' : 'Pending')}
                            </span>
                          </td>

                          {/* 7. الإجمالي */}
                          <td className="cell-total">
                            <strong className="total-text">
                              {Number(ord.total_amount).toLocaleString()} ج.م
                            </strong>
                          </td>

                          {/* 8. الحالة */}
                          <td className="cell-status">
                            <span className={`status-badge-tag ${badge.class}`}>
                              {badge.label}
                            </span>
                          </td>

                          {/* 9. خيارات (Matching dropdown menu from user screenshot) */}
                          <td className="cell-actions">
                            <div className="options-dropdown-container" ref={dropdownRef}>
                              <button
                                type="button"
                                className="btn-options-dots"
                                onClick={() => setOpenDropdownId(openDropdownId === ord.id ? null : ord.id)}
                                aria-label="Options"
                              >
                                <FaEllipsis />
                              </button>

                              {openDropdownId === ord.id && (
                                <div className={`options-dropdown-menu ${idx >= orders.length - 2 && orders.length > 2 ? 'dropup' : ''}`}>
                                  {/* تعليق */}
                                  <button
                                    type="button"
                                    className="menu-item item-comment"
                                    onClick={() => {
                                      setOpenDropdownId(null);
                                      setCommentModalOrder(ord);
                                    }}
                                  >
                                    <FaCommentDots />
                                    <span>{isRtl ? 'تعليق' : 'Add Note'}</span>
                                  </button>

                                  {/* نقل الي التنفيذ */}
                                  <button
                                    type="button"
                                    className="menu-item item-processing"
                                    onClick={() => handleTransitionStatus(ord.id, 'processing')}
                                  >
                                    <FaBolt />
                                    <span>{isRtl ? 'نقل الي التنفيذ' : 'Move to Processing'}</span>
                                  </button>

                                  {/* نقل الي الشحن */}
                                  <button
                                    type="button"
                                    className="menu-item item-shipped"
                                    onClick={() => handleTransitionStatus(ord.id, 'shipped')}
                                  >
                                    <FaTruckFast />
                                    <span>{isRtl ? 'نقل الي الشحن' : 'Move to Shipped'}</span>
                                  </button>

                                  {/* نقل الي التسليم */}
                                  <button
                                    type="button"
                                    className="menu-item item-delivered"
                                    onClick={() => handleTransitionStatus(ord.id, 'delivered')}
                                  >
                                    <FaCircleCheck />
                                    <span>{isRtl ? 'نقل الي التسليم' : 'Move to Delivered'}</span>
                                  </button>

                                  {/* نقل الي الإرجاع */}
                                  <button
                                    type="button"
                                    className="menu-item item-returned"
                                    onClick={() => handleTransitionStatus(ord.id, 'returned_to_warehouse')}
                                  >
                                    <FaRotateLeft />
                                    <span>{isRtl ? 'نقل الي الإرجاع' : 'Move to Returned'}</span>
                                  </button>

                                  {/* تم الإلغاء */}
                                  <button
                                    type="button"
                                    className="menu-item item-cancel"
                                    onClick={() => handleTransitionStatus(ord.id, 'cancelled')}
                                  >
                                    <FaBan />
                                    <span>{isRtl ? 'تم الإلغاء' : 'Cancel Order'}</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ================= ORDER DETAILS DRAWER / MODAL ================= */}
          {drawerOrder && (
            <div className="drawer-backdrop" onClick={() => setDrawerOrder(null)}>
              <div className="order-details-drawer" onClick={(e) => e.stopPropagation()}>
                <div className="drawer-header">
                  <div className="drawer-title-group">
                    <span className="drawer-caption">{isRtl ? 'تفاصيل الطلب' : 'Order Details'}</span>
                    <h3>#{drawerOrder.order_number}</h3>
                    <span className={`status-badge-tag ${getStatusBadgeInfo(drawerOrder.order_status).class}`}>
                      {getStatusBadgeInfo(drawerOrder.order_status).label}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-close-drawer"
                    onClick={() => setDrawerOrder(null)}
                  >
                    <FaXmark />
                  </button>
                </div>

                <div className="drawer-body">
                  {/* Customer Information */}
                  <div className="drawer-section">
                    <h4 className="sec-heading">
                      <FaUser />
                      <span>{isRtl ? 'بيانات العميل والتوصيل' : 'Customer Info'}</span>
                    </h4>
                    <div className="drawer-key-val-grid">
                      <div className="kv">
                        <span className="k">{isRtl ? 'اسم العميل:' : 'Name:'}</span>
                        <strong className="v">{drawerOrder.customer_name}</strong>
                      </div>
                      <div className="kv">
                        <span className="k">{isRtl ? 'رقم الهاتف:' : 'Phone:'}</span>
                        <strong className="v" dir="ltr">{drawerOrder.customer_phone}</strong>
                      </div>
                      {drawerOrder.customer_phone_2 && (
                        <div className="kv">
                          <span className="k">{isRtl ? 'هاتف بديل:' : 'Secondary:'}</span>
                          <strong className="v" dir="ltr">{drawerOrder.customer_phone_2}</strong>
                        </div>
                      )}
                      <div className="kv">
                        <span className="k">{isRtl ? 'المحافظة:' : 'Governorate:'}</span>
                        <strong className="v">{drawerOrder.governorate}</strong>
                      </div>
                      <div className="kv">
                        <span className="k">{isRtl ? 'المدينة:' : 'City:'}</span>
                        <strong className="v">{drawerOrder.city || '-'}</strong>
                      </div>
                      <div className="kv span-2">
                        <span className="k">{isRtl ? 'العنوان بالتفصيل:' : 'Address:'}</span>
                        <strong className="v">{drawerOrder.street_address}</strong>
                      </div>
                      {drawerOrder.landmark && (
                        <div className="kv span-2 landmark-box">
                          <span className="k">
                            <FaLandmark />
                            <span>{isRtl ? 'علامة مميزة:' : 'Landmark:'}</span>
                          </span>
                          <strong className="v">{drawerOrder.landmark}</strong>
                        </div>
                      )}
                      {drawerOrder.order_notes && (
                        <div className="kv span-2">
                          <span className="k">{isRtl ? 'ملاحظات العميل:' : 'Customer Notes:'}</span>
                          <span className="v italic">{drawerOrder.order_notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="drawer-section">
                    <h4 className="sec-heading">
                      <FaCreditCard />
                      <span>{isRtl ? 'الدفع والتكلفة' : 'Payment & Pricing'}</span>
                    </h4>
                    <div className="drawer-key-val-grid">
                      <div className="kv">
                        <span className="k">{isRtl ? 'طريقة الدفع:' : 'Method:'}</span>
                        <strong className="v">
                          {drawerOrder.payment_method === 'credit_card'
                            ? (isRtl ? 'بطاقة بنكية / فيزا' : 'Credit Card')
                            : drawerOrder.payment_method === 'wallet'
                            ? (isRtl ? 'محفظة إلكترونية' : 'E-Wallet')
                            : drawerOrder.payment_method === 'instapay'
                            ? (isRtl ? 'إنستاباي' : 'InstaPay')
                            : (isRtl ? 'الدفع عند الاستلام' : 'COD')}
                        </strong>
                      </div>
                      <div className="kv">
                        <span className="k">{isRtl ? 'حالة السداد:' : 'Payment Status:'}</span>
                        <strong className="v">{drawerOrder.payment_status}</strong>
                      </div>
                      <div className="kv">
                        <span className="k">{isRtl ? 'قيمة المنتجات:' : 'Subtotal:'}</span>
                        <strong className="v">{Number(drawerOrder.subtotal || drawerOrder.total_amount).toLocaleString()} ج.م</strong>
                      </div>
                      <div className="kv">
                        <span className="k">{isRtl ? 'مصاريف الشحن:' : 'Shipping:'}</span>
                        <strong className="v">{Number(drawerOrder.shipping_fee || 0).toLocaleString()} ج.م</strong>
                      </div>
                      <div className="kv span-2 total-row">
                        <span className="k">{isRtl ? 'إجمالي الطلب:' : 'Total Amount:'}</span>
                        <strong className="v grand">{Number(drawerOrder.total_amount).toLocaleString()} ج.م</strong>
                      </div>
                    </div>
                  </div>

                  {/* Ordered Items List */}
                  {drawerOrder.items && drawerOrder.items.length > 0 && (
                    <div className="drawer-section">
                      <h4 className="sec-heading">
                        <FaBoxOpen />
                        <span>{isRtl ? 'المنتجات المطلوبة' : 'Items'}</span>
                        <span className="items-badge">{drawerOrder.items.length}</span>
                      </h4>
                      <div className="drawer-items-list">
                        {drawerOrder.items.map((it) => (
                          <div key={it.id} className="drawer-item-row">
                            <div className="it-meta">
                              <h5>{it.item_name_snapshot_ar || it.product?.name_ar}</h5>
                              <span className="it-sku">SKU: {it.sku_snapshot || it.product?.sku}</span>
                            </div>
                            <div className="it-qty">
                              {it.quantity} × {Number(it.unit_price).toLocaleString()} ج.م
                            </div>
                            <div className="it-total">
                              {Number(it.total_price || (it.unit_price * it.quantity)).toLocaleString()} ج.م
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tracking Logs / History */}
                  {drawerOrder.tracking_logs && drawerOrder.tracking_logs.length > 0 && (
                    <div className="drawer-section">
                      <h4 className="sec-heading">
                        <FaClockRotateLeft />
                        <span>{isRtl ? 'سجل العمليات والتتبع' : 'Timeline History'}</span>
                      </h4>
                      <div className="drawer-timeline-list">
                        {drawerOrder.tracking_logs.map((log) => (
                          <div key={log.id} className="timeline-node">
                            <div className="node-dot" />
                            <div className="node-body">
                              <div className="node-header">
                                <strong>{log.title_ar || log.to_status}</strong>
                                <span className="node-time">
                                  {new Date(log.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                                </span>
                              </div>
                              {log.notes_ar && <p className="node-note">{log.notes_ar}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Drawer Footer Actions */}
                <div className="drawer-footer">
                  <button
                    type="button"
                    className="btn-drawer-comment"
                    onClick={() => {
                      setCommentModalOrder(drawerOrder);
                    }}
                  >
                    <FaCommentDots />
                    <span>{isRtl ? 'إضافة تعليق إداري' : 'Add Note'}</span>
                  </button>

                  <div className="drawer-quick-status-group">
                    {drawerOrder.order_status === 'new' && (
                      <button
                        type="button"
                        className="btn-status-act btn-act-processing"
                        onClick={() => handleTransitionStatus(drawerOrder.id, 'processing')}
                      >
                        <FaBolt />
                        <span>{isRtl ? 'تأكيد ونقل للتنفيذ' : 'Start Processing'}</span>
                      </button>
                    )}
                    {['new', 'confirmed', 'processing'].includes(drawerOrder.order_status) && (
                      <button
                        type="button"
                        className="btn-status-act btn-act-shipped"
                        onClick={() => handleTransitionStatus(drawerOrder.id, 'shipped')}
                      >
                        <FaTruckFast />
                        <span>{isRtl ? 'تسليم للشحن' : 'Ship Order'}</span>
                      </button>
                    )}
                    {drawerOrder.order_status === 'shipped' && (
                      <button
                        type="button"
                        className="btn-status-act btn-act-delivered"
                        onClick={() => handleTransitionStatus(drawerOrder.id, 'delivered')}
                      >
                        <FaCircleCheck />
                        <span>{isRtl ? 'تأكيد التسليم' : 'Mark Delivered'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= COMMENT MODAL ================= */}
          {commentModalOrder && (
            <div className="modal-backdrop">
              <div className="modal-box comment-modal">
                <div className="modal-header">
                  <h3>
                    <FaCommentDots />
                    <span>{isRtl ? `إضافة تعليق للطلب #${commentModalOrder.order_number}` : 'Add Order Comment'}</span>
                  </h3>
                  <button
                    type="button"
                    className="btn-close-modal"
                    onClick={() => setCommentModalOrder(null)}
                  >
                    <FaXmark />
                  </button>
                </div>

                <form onSubmit={handleAddComment} className="modal-body-form">
                  <div className="form-group">
                    <label>{isRtl ? 'نص التعليق أو الملاحظة الإدارية:' : 'Comment text:'}</label>
                    <textarea
                      rows={4}
                      placeholder={isRtl ? 'اكتب ملاحظتك حول هذا الطلب (مثال: تم الاتصال بالعميل وأكد الشحن غداً...)' : 'Type admin comment...'}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      required
                    />
                  </div>

                  <div className="modal-actions-bar">
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setCommentModalOrder(null)}
                    >
                      {isRtl ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="btn-save"
                      disabled={commentSubmitting}
                    >
                      {commentSubmitting ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ التعليق' : 'Save Comment')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function OrdersPage() {
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
          جاري تحميل لوحة إدارة الطلبات...
        </div>
      }
    >
      <OrdersPageContent />
    </Suspense>
  );
}
