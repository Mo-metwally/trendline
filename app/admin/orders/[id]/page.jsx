'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  AdminSidebar,
  AdminHeader,
  useToast,
} from '@/src/components/adminComponents';
import {
  FaArrowRight,
  FaArrowLeft,
  FaPrint,
  FaWhatsapp,
  FaPhone,
  FaEnvelope,
  FaLocationDot,
  FaLandmark,
  FaCreditCard,
  FaMoneyBillWave,
  FaWallet,
  FaCircleCheck,
  FaClockRotateLeft,
  FaTruckFast,
  FaBolt,
  FaRotateLeft,
  FaBan,
  FaCommentDots,
  FaBoxesStacked,
  FaCopy,
  FaCheck,
  FaUser,
  FaShieldHalved,
  FaCircleExclamation,
  FaSpinner,
} from 'react-icons/fa6';
import { getApiHost } from '@/src/utils/apiConfig';
import './OrderDetails.scss';

function OrderDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();

  const id = params?.id;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lang, setLang] = useState('ar');
  const isRtl = lang === 'ar';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  // Status updating state
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Shipping waybill modal state
  const [shippingModalOpen, setShippingModalOpen] = useState(false);
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  // Comment state
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Fetch Order Details
  const fetchOrderDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const apiHost = getApiHost();
      let headers = {};
      try {
        const tokenRes = await fetch('/api/auth/token');
        if (tokenRes.ok) {
          const { token } = await tokenRes.json();
          if (token) headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (e) {}

      const res = await fetch(`${apiHost}/api/v1/orders/${id}`, {
        headers,
        cache: 'no-store',
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setOrder(json.data);
          setCourierName(json.data.courier_name || '');
          setTrackingNumber(json.data.courier_tracking_number || '');
        } else {
          toast?.error?.(isRtl ? 'الطلب غير موجود' : 'Order not found');
        }
      } else {
        toast?.error?.(isRtl ? 'تعذر جلب تفاصيل الطلب' : 'Failed to fetch order');
      }
    } catch (err) {
      console.error('Fetch order error:', err);
      toast?.error?.(isRtl ? 'خطأ في الاتصال بالخادم' : 'Server error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  // Copy Order Code
  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Status Update
  const handleStatusTransition = async (targetStatus, extraData = {}) => {
    setUpdatingStatus(true);
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

      const res = await fetch(`${apiHost}/api/v1/orders/${order.id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: targetStatus, ...extraData }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast?.success?.(json.message || (isRtl ? 'تم تحديث حالة الطلب بنجاح' : 'Status updated'));
        setShippingModalOpen(false);
        fetchOrderDetails();
      } else {
        toast?.error?.(json.message || (isRtl ? 'فشل تحديث الحالة' : 'Update failed'));
      }
    } catch (err) {
      console.error('Update status error:', err);
      toast?.error?.(isRtl ? 'حدث خطأ أثناء تحديث الحالة' : 'Error updating status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
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

      const res = await fetch(`${apiHost}/api/v1/orders/${order.id}/comment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ comment: newComment.trim() }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast?.success?.(isRtl ? 'تمت إضافة الملاحظة بنجاح' : 'Note added');
        setNewComment('');
        fetchOrderDetails();
      } else {
        toast?.error?.(json.message || 'فشل حفظ الملاحظة');
      }
    } catch (err) {
      console.error('Add comment error:', err);
      toast?.error?.('حدث خطأ أثناء حفظ الملاحظة');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return { label: isRtl ? 'طلب جديد' : 'New Order', class: 'status-new' };
      case 'confirmed':
        return { label: isRtl ? 'معلق / مؤكد' : 'Confirmed', class: 'status-pending' };
      case 'processing':
        return { label: isRtl ? 'قيد التنفيذ' : 'Processing', class: 'status-processing' };
      case 'shipped':
        return { label: isRtl ? 'تم الشحن' : 'Shipped', class: 'status-shipped' };
      case 'delivered':
        return { label: isRtl ? 'تم التسليم' : 'Delivered', class: 'status-delivered' };
      case 'cancelled':
        return { label: isRtl ? 'تم الإلغاء' : 'Cancelled', class: 'status-cancelled' };
      case 'returned_to_warehouse':
      case 'return_received':
      case 'refunded':
        return { label: isRtl ? 'تم الإرجاع' : 'Returned', class: 'status-returned' };
      default:
        return { label: status, class: 'status-default' };
    }
  };

  // Payment Badge Helper
  const getPaymentBadge = (method) => {
    switch (method) {
      case 'instapay':
        return { label: 'InstaPay إنستاباي', icon: <FaWallet /> };
      case 'vodafone_cash':
        return { label: 'Vodafone Cash محفظة إلكترونية', icon: <FaWallet /> };
      case 'visa':
      case 'card':
        return { label: 'بطاقة ائتمانية / فيزا', icon: <FaCreditCard /> };
      case 'cod':
      default:
        return { label: isRtl ? 'الدفع عند الاستلام' : 'Cash On Delivery', icon: <FaMoneyBillWave /> };
    }
  };

  if (loading) {
    return (
      <div className={`admin-page-container ${isRtl ? 'dir-rtl' : 'dir-ltr'}`}>
        <AdminSidebar isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} lang={lang} />
        <div className={`admin-main-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <AdminHeader lang={lang} title={isRtl ? 'تفاصيل الطلب' : 'Order Details'} isSidebarCollapsed={sidebarCollapsed} />
          <div className="order-details-loading-state">
            <FaSpinner className="spinner-icon" size={40} />
            <p>{isRtl ? 'جاري تحميل تفاصيل الطلب...' : 'Loading order details...'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={`admin-page-container ${isRtl ? 'dir-rtl' : 'dir-ltr'}`}>
        <AdminSidebar isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} lang={lang} />
        <div className={`admin-main-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <AdminHeader lang={lang} title={isRtl ? 'تفاصيل الطلب' : 'Order Details'} isSidebarCollapsed={sidebarCollapsed} />
          <div className="order-details-empty-state">
            <FaCircleExclamation size={48} />
            <h2>{isRtl ? 'لم يتم العثور على الطلب المطلوب' : 'Order Not Found'}</h2>
            <Link href="/admin/orders" className="btn-back-link">
              <FaArrowRight /> <span>{isRtl ? 'العودة لقائمة الطلبات' : 'Back to Orders'}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(order.order_status);
  const paymentBadge = getPaymentBadge(order.payment_method);

  const rawCreatedAt = order.created_at || order.createdAt;
  const createdDate = rawCreatedAt ? new Date(rawCreatedAt) : new Date();
  const createdFormatted = !isNaN(createdDate.getTime())
    ? `${createdDate.getFullYear()}/${String(createdDate.getMonth() + 1).padStart(2, '0')}/${String(createdDate.getDate()).padStart(2, '0')} - ${createdDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`
    : '-';

  const rawUpdatedAt = order.updated_at || order.updatedAt;
  const updatedDate = rawUpdatedAt ? new Date(rawUpdatedAt) : null;
  const updatedFormatted = updatedDate && !isNaN(updatedDate.getTime())
    ? `${updatedDate.getFullYear()}/${String(updatedDate.getMonth() + 1).padStart(2, '0')}/${String(updatedDate.getDate()).padStart(2, '0')} - ${updatedDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`
    : createdFormatted;

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
          title={isRtl ? `طلب #${order.order_number}` : `Order #${order.order_number}`}
        />

        <main className="order-details-main-content">
          {/* Breadcrumb Navigation Bar */}
          <div className="order-details-top-bar">
            <div className="breadcrumb-links">
              <Link href="/admin/orders" className="back-link">
                <FaArrowRight size={13} />
                <span>{isRtl ? 'العودة لإدارة الطلبات' : 'Back to Orders List'}</span>
              </Link>
              <span className="crumb-sep">/</span>
              <span className="current-crumb">
                {isRtl ? 'طلب رقم:' : 'Order:'} <strong>{order.order_number}</strong>
              </span>
            </div>

            <div className="top-actions-cluster">
              <button
                type="button"
                className="btn-print-action"
                onClick={() => window.print()}
                title={isRtl ? 'طباعة بوليصة / فاتورة الطلب' : 'Print Invoice'}
              >
                <FaPrint size={13} />
                <span>{isRtl ? 'طباعة الفاتورة' : 'Print Invoice'}</span>
              </button>

              <a
                href={`https://wa.me/2${order.customer_phone.replace(/^0+/, '')}?text=${encodeURIComponent(
                  `مرحباً ${order.customer_name}، نتواصل معك من ترندلاين تك بخصوص طلبك رقم #${order.order_number}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp-action"
              >
                <FaWhatsapp size={15} />
                <span>{isRtl ? 'محادثة العميل' : 'WhatsApp Client'}</span>
              </a>
            </div>
          </div>

          {/* Executive Order Hero Banner */}
          <div className="order-hero-banner">
            <div className="hero-order-id-block">
              <span className="label-order">{isRtl ? 'كود الطلب الرسمي:' : 'Order Code:'}</span>
              <div className="code-copy-row">
                <h1 className="order-code-display">{order.order_number}</h1>
                <button
                  type="button"
                  className="btn-copy-code"
                  onClick={() => handleCopyCode(order.order_number)}
                  title={isRtl ? 'نسخ كود الطلب' : 'Copy code'}
                >
                  {copiedCode ? <FaCheck size={12} /> : <FaCopy size={12} />}
                  <span>{copiedCode ? (isRtl ? 'تم النسخ' : 'Copied') : isRtl ? 'نسخ' : 'Copy'}</span>
                </button>
              </div>
              <div className="order-timestamps">
                <span>{isRtl ? 'تاريخ الإنشاء:' : 'Created:'} <strong>{createdFormatted}</strong></span>
                <span className="sep">•</span>
                <span>{isRtl ? 'آخر تعديل:' : 'Updated:'} <strong>{updatedFormatted}</strong></span>
              </div>
            </div>

            {/* Status & Quick Action Pipeline */}
            <div className="hero-status-control-side">
              <div className="current-status-group">
                <span className="status-label">{isRtl ? 'الحالة الحالية:' : 'Current Status:'}</span>
                <span className={`status-pill-badge ${statusBadge.class}`}>
                  {statusBadge.label}
                </span>
              </div>

              {/* Status Action Buttons */}
              <div className="status-actions-bar">
                {order.order_status === 'new' && (
                  <button
                    type="button"
                    className="btn-transition-action btn-processing"
                    onClick={() => handleStatusTransition('processing')}
                    disabled={updatingStatus}
                  >
                    <FaBolt size={12} />
                    <span>{isRtl ? 'بدء التنفيذ والتجهيز' : 'Move to Processing'}</span>
                  </button>
                )}

                {(order.order_status === 'new' || order.order_status === 'confirmed' || order.order_status === 'processing') && (
                  <button
                    type="button"
                    className="btn-transition-action btn-shipped"
                    onClick={() => setShippingModalOpen(true)}
                    disabled={updatingStatus}
                  >
                    <FaTruckFast size={13} />
                    <span>{isRtl ? 'نقل إلى الشحن والتوصيل' : 'Dispatch / Ship'}</span>
                  </button>
                )}

                {order.order_status === 'shipped' && (
                  <button
                    type="button"
                    className="btn-transition-action btn-delivered"
                    onClick={() => handleStatusTransition('delivered')}
                    disabled={updatingStatus}
                  >
                    <FaCircleCheck size={13} />
                    <span>{isRtl ? 'تأكيد التسليم للعميل' : 'Mark Delivered'}</span>
                  </button>
                )}

                {order.order_status !== 'cancelled' && order.order_status !== 'delivered' && (
                  <button
                    type="button"
                    className="btn-transition-action btn-cancelled"
                    onClick={() => {
                      if (confirm(isRtl ? 'هل أنت متأكد من رغبتك في إلغاء هذا الطلب وفك حجز المخزون؟' : 'Confirm cancelling order?')) {
                        handleStatusTransition('cancelled');
                      }
                    }}
                    disabled={updatingStatus}
                  >
                    <FaBan size={12} />
                    <span>{isRtl ? 'إلغاء الطلب' : 'Cancel Order'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2-Column Master Layout */}
          <div className="order-details-grid-layout">
            {/* COLUMN 1: Main Content (Items & Timeline & Comments) */}
            <div className="main-content-column">
              {/* Card 1: Ordered Items Table */}
              <div className="details-card items-card">
                <div className="card-header-row">
                  <div className="card-title-cluster">
                    <FaBoxesStacked className="title-icon" />
                    <h3 className="card-title">{isRtl ? 'المنتجات المطلوبة في هذا الطلب' : 'Ordered Products'}</h3>
                  </div>
                  <span className="items-count-badge">
                    {order.items?.length || 0} {isRtl ? 'أصناف' : 'items'}
                  </span>
                </div>

                <div className="items-table-wrapper">
                  <table className="order-items-table">
                    <thead>
                      <tr>
                        <th>{isRtl ? 'المنتج' : 'Product'}</th>
                        <th>{isRtl ? 'سعر الوحدة' : 'Unit Price'}</th>
                        <th>{isRtl ? 'الكمية' : 'Qty'}</th>
                        <th>{isRtl ? 'الإجمالي الفرعي' : 'Subtotal'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items?.map((item) => {
                        const product = item.product;
                        const primaryImg = product?.images?.find((img) => img.is_primary) || product?.images?.[0];
                        const imgUrl = primaryImg?.image_url || '/assets/placeholder-product.png';

                        return (
                          <tr key={item.id} className="item-row">
                            <td className="item-info-cell">
                              <div className="item-product-flex">
                                <div className="product-thumb-box">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={imgUrl} alt={item.product_name} className="product-thumb-img" />
                                </div>
                                <div className="product-names">
                                  <h4 className="product-title">{item.product_name}</h4>
                                  <div className="product-meta-row">
                                    {product?.sku && (
                                      <span className="sku-tag">SKU: {product.sku}</span>
                                    )}
                                    {product?.slug && (
                                      <Link
                                        href={`/pd/${product.id}/${product.slug}`}
                                        target="_blank"
                                        className="view-store-link"
                                      >
                                        {isRtl ? 'عرض في المتجر ↗' : 'View on Store ↗'}
                                      </Link>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="item-price-cell">
                              <span className="price-num">{Number(item.unit_price).toLocaleString()} ج.م</span>
                            </td>
                            <td className="item-qty-cell">
                              <span className="qty-bubble">× {item.quantity}</span>
                            </td>
                            <td className="item-total-cell">
                              <strong className="subtotal-num">
                                {Number(item.total_price || item.unit_price * item.quantity).toLocaleString()} ج.م
                              </strong>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Financial Summary */}
                <div className="order-financial-breakdown">
                  <div className="breakdown-row">
                    <span className="row-key">{isRtl ? 'إجمالي المنتجات:' : 'Items Subtotal:'}</span>
                    <span className="row-val">{Number(order.subtotal || order.total_amount).toLocaleString()} ج.م</span>
                  </div>

                  <div className="breakdown-row">
                    <span className="row-key">{isRtl ? 'مصاريف الشحن والتوصيل:' : 'Shipping Fee:'}</span>
                    <span className="row-val">
                      {Number(order.shipping_fee || 0) > 0 ? (
                        `${Number(order.shipping_fee).toLocaleString()} ج.م`
                      ) : (
                        <span className="notice-shipping-later">
                          {isRtl ? 'تُحدد بعد مراجعة الوزن والمنطقة' : 'To be confirmed'}
                        </span>
                      )}
                    </span>
                  </div>

                  {Number(order.discount_amount || 0) > 0 && (
                    <div className="breakdown-row discount">
                      <span className="row-key">{isRtl ? 'الخصم / الكوبون:' : 'Discount:'}</span>
                      <span className="row-val">- {Number(order.discount_amount).toLocaleString()} ج.م</span>
                    </div>
                  )}

                  <div className="breakdown-row grand-total">
                    <span className="row-key">{isRtl ? 'الإجمالي النهائي للطلب:' : 'Grand Total:'}</span>
                    <span className="row-val">{Number(order.total_amount).toLocaleString()} ج.م</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Tracking Logs & Stepper */}
              <div className="details-card tracking-card">
                <div className="card-header-row">
                  <div className="card-title-cluster">
                    <FaClockRotateLeft className="title-icon" />
                    <h3 className="card-title">{isRtl ? 'سجل تتبع الحركات ومراحل الطلب' : 'Order Tracking Timeline'}</h3>
                  </div>
                </div>

                <div className="tracking-timeline-flow">
                  {order.tracking_logs && order.tracking_logs.length > 0 ? (
                    order.tracking_logs.map((log, idx) => {
                      const logDate = new Date(log.created_at);
                      const timeStr = !isNaN(logDate.getTime())
                        ? `${logDate.toLocaleDateString('ar-EG')} - ${logDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`
                        : '';

                      return (
                        <div key={log.id || idx} className="timeline-node">
                          <div className="node-marker">
                            <span className="dot" />
                            {idx < order.tracking_logs.length - 1 && <span className="line" />}
                          </div>
                          <div className="node-details">
                            <div className="node-top-row">
                              <span className="node-action-name">{log.action || log.status_to || 'تحديث'}</span>
                              <span className="node-time">{timeStr}</span>
                            </div>
                            {log.comment && <p className="node-comment">{log.comment}</p>}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="empty-timeline">
                      <p>{isRtl ? 'تم استلام الطلب وتسجيله بنجاح وفي انتظار الإجراءات التالية.' : 'Order received and logged.'}</p>
                    </div>
                  )}
                </div>

                {/* Add Internal Admin Note */}
                <form onSubmit={handleAddComment} className="add-note-subform">
                  <div className="note-input-row">
                    <FaCommentDots className="note-icon" />
                    <input
                      type="text"
                      placeholder={isRtl ? 'إضافة ملاحظة إدارية أو تعليق داخلي حول الطلب...' : 'Add an administrative note...'}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <button type="submit" className="btn-add-note" disabled={submittingComment || !newComment.trim()}>
                      {submittingComment ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : isRtl ? 'إضافة ملاحظة' : 'Add Note'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* COLUMN 2: Sidebar (Customer, Shipping Address, Payment) */}
            <div className="sidebar-column">
              {/* Customer Info Card */}
              <div className="details-card customer-card">
                <div className="card-header-row">
                  <div className="card-title-cluster">
                    <FaUser className="title-icon" />
                    <h3 className="card-title">{isRtl ? 'بيانات العميل' : 'Customer Info'}</h3>
                  </div>
                </div>

                <div className="meta-info-list">
                  <div className="meta-item">
                    <span className="meta-key">{isRtl ? 'اسم العميل:' : 'Full Name:'}</span>
                    <strong className="meta-val client-name">{order.customer_name || 'عميل المتجر'}</strong>
                  </div>

                  <div className="meta-item">
                    <span className="meta-key">{isRtl ? 'رقم الهاتف:' : 'Phone:'}</span>
                    <div className="meta-val phone-row">
                      <a href={`tel:${order.customer_phone}`} className="phone-link" dir="ltr">
                        {order.customer_phone}
                      </a>
                      <a
                        href={`https://wa.me/2${order.customer_phone.replace(/^0+/, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="whatsapp-icon-btn"
                        title="WhatsApp"
                      >
                        <FaWhatsapp size={14} />
                      </a>
                    </div>
                  </div>

                  {order.alt_phone && (
                    <div className="meta-item">
                      <span className="meta-key">{isRtl ? 'هاتف بديل:' : 'Alt Phone:'}</span>
                      <a href={`tel:${order.alt_phone}`} className="meta-val phone-link" dir="ltr">
                        {order.alt_phone}
                      </a>
                    </div>
                  )}

                  {order.customer_email && (
                    <div className="meta-item">
                      <span className="meta-key">{isRtl ? 'البريد الإلكتروني:' : 'Email:'}</span>
                      <a href={`mailto:${order.customer_email}`} className="meta-val email-link" dir="ltr">
                        {order.customer_email}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Address Card */}
              <div className="details-card address-card">
                <div className="card-header-row">
                  <div className="card-title-cluster">
                    <FaLocationDot className="title-icon" />
                    <h3 className="card-title">{isRtl ? 'عنوان التوصيل والشحن' : 'Shipping Address'}</h3>
                  </div>
                </div>

                <div className="meta-info-list">
                  <div className="meta-item">
                    <span className="meta-key">{isRtl ? 'المحافظة والمنطقة:' : 'Governorate & City:'}</span>
                    <strong className="meta-val">
                      {order.governorate} {order.city ? `- ${order.city}` : ''}
                    </strong>
                  </div>

                  <div className="meta-item">
                    <span className="meta-key">{isRtl ? 'العنوان بالتفصيل:' : 'Street Address:'}</span>
                    <span className="meta-val address-box">{order.street_address}</span>
                  </div>

                  {order.landmark && (
                    <div className="meta-item landmark-item">
                      <span className="meta-key">{isRtl ? 'أقرب علامة مميزة:' : 'Landmark:'}</span>
                      <div className="meta-val landmark-pill">
                        <FaLandmark size={12} />
                        <span>{order.landmark}</span>
                      </div>
                    </div>
                  )}

                  {order.customer_notes && (
                    <div className="meta-item notes-item">
                      <span className="meta-key">{isRtl ? 'ملاحظات العميل:' : 'Customer Notes:'}</span>
                      <p className="meta-val client-notes">{order.customer_notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Method Card */}
              <div className="details-card payment-card">
                <div className="card-header-row">
                  <div className="card-title-cluster">
                    <FaCreditCard className="title-icon" />
                    <h3 className="card-title">{isRtl ? 'طريقة الدفع والحساب' : 'Payment Method'}</h3>
                  </div>
                </div>

                <div className="payment-method-box">
                  <div className="method-icon-wrap">{paymentBadge.icon}</div>
                  <div className="method-text">
                    <strong>{paymentBadge.label}</strong>
                    <span>
                      {order.payment_status === 'paid'
                        ? isRtl
                          ? 'تم تحصيل المبلغ بنجاح'
                          : 'Paid'
                        : isRtl
                        ? 'الدفع نقداً أو إلكترونياً عند الاستلام'
                        : 'Unpaid / On Delivery'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shipping Carrier Card */}
              {(order.courier_name || order.courier_tracking_number) && (
                <div className="details-card courier-card">
                  <div className="card-header-row">
                    <div className="card-title-cluster">
                      <FaTruckFast className="title-icon" />
                      <h3 className="card-title">{isRtl ? 'شركة الشحن والبوليصة' : 'Courier & Waybill'}</h3>
                    </div>
                  </div>

                  <div className="meta-info-list">
                    {order.courier_name && (
                      <div className="meta-item">
                        <span className="meta-key">{isRtl ? 'شركة الشحن:' : 'Courier:'}</span>
                        <strong className="meta-val">{order.courier_name}</strong>
                      </div>
                    )}
                    {order.courier_tracking_number && (
                      <div className="meta-item">
                        <span className="meta-key">{isRtl ? 'رقم البوليصة:' : 'Waybill #:'}</span>
                        <code className="meta-val waybill-code">{order.courier_tracking_number}</code>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Dispatch / Shipping Modal */}
      {shippingModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setShippingModalOpen(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-cluster">
                <FaTruckFast size={18} />
                <h3>{isRtl ? 'تسجيل بيانات الشحن والتوصيل' : 'Shipping Dispatch Details'}</h3>
              </div>
              <button type="button" className="btn-close" onClick={() => setShippingModalOpen(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-field">
                <label>{isRtl ? 'اسم شركة الشحن أو المندوب:' : 'Courier Name:'}</label>
                <input
                  type="text"
                  placeholder={isRtl ? 'مثال: بوسطة (Bosta)، أرامكس، مندوب داخلي' : 'e.g. Bosta, Aramex'}
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>{isRtl ? 'رقم بوليصة الشحن (Waybill Number):' : 'Waybill / Tracking Number:'}</label>
                <input
                  type="text"
                  dir="ltr"
                  placeholder={isRtl ? 'مثال: BST-982341' : 'e.g. BST-982341'}
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={() => setShippingModalOpen(false)}>
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                className="btn-confirm"
                onClick={() =>
                  handleStatusTransition('shipped', {
                    courier_name: courierName,
                    courier_tracking_number: trackingNumber,
                  })
                }
                disabled={updatingStatus}
              >
                {updatingStatus ? (isRtl ? 'جاري التحويل...' : 'Updating...') : isRtl ? 'تأكيد ونقل للشحن' : 'Confirm Dispatch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderDetailsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#0057C2', fontWeight: 800 }}>
          جاري التحميل...
        </div>
      }
    >
      <OrderDetailsContent />
    </Suspense>
  );
}
