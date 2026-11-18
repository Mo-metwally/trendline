'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/src/components/common/Navbar/Navbar';
import Footer from '@/src/components/common/Footer/Footer';
import useTrendlineLang, { formatLangHref } from '@/src/hooks/useTrendlineLang';
import { useToast } from '@/src/context/ToastContext';
import { getApiHost } from '@/src/utils/apiConfig';
import {
  FaMagnifyingGlass,
  FaHouse,
  FaChevronLeft,
  FaChevronRight,
  FaBoxOpen,
  FaTruckFast,
  FaCircleCheck,
  FaCircleXmark,
  FaClockRotateLeft,
  FaPenToSquare,
  FaBan,
  FaTrashCan,
  FaPlus,
  FaMinus,
  FaWhatsapp,
  FaPhone,
  FaLocationDot,
  FaLandmark,
  FaCreditCard,
  FaMoneyBillWave,
  FaWallet,
  FaBolt,
  FaXmark,
  FaTriangleExclamation,
  FaLock,
  FaShieldHalved,
} from 'react-icons/fa6';
import './TrackOrder.scss';

const EGYPT_GOVERNORATES = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'الدقهلية',
  'الشرقية',
  'القليوبية',
  'كفر الشيخ',
  'الغربية',
  'المنوفية',
  'البحيرة',
  'دمياط',
  'بورسعيد',
  'الإسماعيلية',
  'السويس',
  'الفيوم',
  'بني سويف',
  'المنيا',
  'أسيوط',
  'سوهاج',
  'قنا',
  'الأقصر',
  'أسوان',
  'البحر الأحمر',
  'الوادي الجديد',
  'مطروح',
  'شمال سيناء',
  'جنوب سيناء',
];

function TrackOrderContent() {
  const { lang, isRtl, setLang } = useTrendlineLang('ar');
  const searchParams = useSearchParams();
  const toast = useToast();

  const initialQuery = searchParams?.get('order_number') || searchParams?.get('query') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [ordersList, setOrdersList] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searched, setSearched] = useState(false);

  // Modals state
  const [showEditAddressModal, setShowEditAddressModal] = useState(false);
  const [showEditItemsModal, setShowEditItemsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Edit Address Form
  const [addressForm, setAddressForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_phone_2: '',
    governorate: 'القاهرة',
    city: '',
    street_address: '',
    landmark: '',
    order_notes: '',
  });

  // Edit Items State
  const [editableItems, setEditableItems] = useState([]);

  // Cancel Reason State
  const [cancelReason, setCancelReason] = useState('رغبة في تغيير المنتج أو الكمية');
  const [customCancelReason, setCustomCancelReason] = useState('');

  // Search function
  const handleSearch = async (term) => {
    const q = (term !== undefined ? term : searchQuery).trim();
    if (!q) {
      toast?.error?.(isRtl ? 'يرجى إدخال كود الطلب أو رقم الهاتف للبحث' : 'Please enter order code or phone');
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const apiHost = getApiHost();
      const res = await fetch(`${apiHost}/api/v1/orders/track?query=${encodeURIComponent(q)}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data) && json.data.length > 0) {
        setOrdersList(json.data);
        setSelectedOrder(json.data[0]);
      } else {
        setOrdersList([]);
        setSelectedOrder(null);
        toast?.error?.(json.message || (isRtl ? 'لم يتم العثور على أي طلبات مطابقة' : 'No orders found'));
      }
    } catch (err) {
      console.error('Track order error:', err);
      toast?.error?.(isRtl ? 'تعذر الاتصال بالخادم' : 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  // Run initial search if query in URL
  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  // Open Edit Address Modal
  const openAddressModal = () => {
    if (!selectedOrder) return;
    setAddressForm({
      customer_name: selectedOrder.customer_name || '',
      customer_phone: selectedOrder.customer_phone || '',
      customer_phone_2: selectedOrder.customer_phone_2 || '',
      governorate: selectedOrder.governorate || 'القاهرة',
      city: selectedOrder.city || '',
      street_address: selectedOrder.street_address || '',
      landmark: selectedOrder.landmark || '',
      order_notes: selectedOrder.order_notes || '',
    });
    setShowEditAddressModal(true);
  };

  // Submit Edit Address
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    if (!addressForm.customer_name.trim() || !addressForm.customer_phone.trim() || !addressForm.street_address.trim()) {
      toast?.error?.(isRtl ? 'يرجى ملء الحقول الإلزامية (الاسم، الهاتف، العنوان)' : 'Please fill required fields');
      return;
    }

    setActionSubmitting(true);
    try {
      const apiHost = getApiHost();
      const res = await fetch(`${apiHost}/api/v1/orders/${encodeURIComponent(selectedOrder.order_number)}/customer-update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressForm),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast?.success?.(isRtl ? 'تم تحديث بيانات التوصيل بنجاح' : 'Delivery info updated successfully');
        setShowEditAddressModal(false);
        // Refresh order
        handleSearch(selectedOrder.order_number);
      } else {
        toast?.error?.(json.message || 'فشل التحديث');
      }
    } catch (err) {
      console.error('Update address error:', err);
      toast?.error?.('حدث خطأ أثناء حفظ البيانات');
    } finally {
      setActionSubmitting(false);
    }
  };

  // Open Edit Items Modal
  const openItemsModal = () => {
    if (!selectedOrder || !selectedOrder.items) return;
    setEditableItems(selectedOrder.items.map((i) => ({ ...i, quantity: Number(i.quantity) })));
    setShowEditItemsModal(true);
  };

  // Item quantity adjustment inside modal
  const handleItemQtyChange = (itemId, delta) => {
    setEditableItems((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const nextQty = Math.max(0, item.quantity + delta);
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  // Submit Edit Items
  const handleSaveItems = async () => {
    if (!selectedOrder) return;

    if (editableItems.length === 0) {
      toast?.error?.(isRtl ? 'لا يمكن إفراغ جميع محتويات الطلب، يمكنك إلغاء الطلب بالكامل بدلاً من ذلك' : 'Order cannot be empty');
      return;
    }

    setActionSubmitting(true);
    try {
      const apiHost = getApiHost();
      const res = await fetch(`${apiHost}/api/v1/orders/${encodeURIComponent(selectedOrder.order_number)}/customer-update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: editableItems.map((i) => ({ id: i.id, quantity: i.quantity })),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast?.success?.(isRtl ? 'تم تحديث منتجات الطلب وإعادة حساب الإجمالي' : 'Order items updated');
        setShowEditItemsModal(false);
        handleSearch(selectedOrder.order_number);
      } else {
        toast?.error?.(json.message || 'فشل تعديل المنتجات');
      }
    } catch (err) {
      console.error('Update items error:', err);
      toast?.error?.('حدث خطأ أثناء تعديل المنتجات');
    } finally {
      setActionSubmitting(false);
    }
  };

  // Submit Cancel Order
  const handleCancelOrder = async () => {
    if (!selectedOrder) return;

    const finalReason = cancelReason === 'أخرى' && customCancelReason.trim()
      ? customCancelReason.trim()
      : cancelReason;

    setActionSubmitting(true);
    try {
      const apiHost = getApiHost();
      const res = await fetch(`${apiHost}/api/v1/orders/${encodeURIComponent(selectedOrder.order_number)}/customer-cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellation_reason: finalReason }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast?.success?.(isRtl ? 'تم إلغاء الطلب بنجاح وتحرير المنتجات' : 'Order cancelled successfully');
        setShowCancelModal(false);
        handleSearch(selectedOrder.order_number);
      } else {
        toast?.error?.(json.message || 'فشل إلغاء الطلب');
      }
    } catch (err) {
      console.error('Cancel order error:', err);
      toast?.error?.('حدث خطأ أثناء إلغاء الطلب');
    } finally {
      setActionSubmitting(false);
    }
  };

  // Can the customer edit or cancel?
  // Only if status is 'new', 'confirmed', or 'processing' (NOT shipped, delivered, or cancelled)
  const canCustomerModify = selectedOrder && ['new', 'confirmed', 'processing'].includes(selectedOrder.order_status);
  const isShipped = selectedOrder?.order_status === 'shipped';
  const isDelivered = selectedOrder?.order_status === 'delivered';
  const isCancelled = selectedOrder?.order_status === 'cancelled';

  // Status Labels in Arabic
  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return { label: isRtl ? 'طلب جديد (قيد المراجعة)' : 'New Order', class: 'status-new' };
      case 'confirmed':
        return { label: isRtl ? 'تم تأكيد الطلب' : 'Confirmed', class: 'status-confirmed' };
      case 'processing':
        return { label: isRtl ? 'قيد التجهيز والتغليف' : 'Processing', class: 'status-processing' };
      case 'shipped':
        return { label: isRtl ? 'تم الشحن مع المندوب' : 'Shipped', class: 'status-shipped' };
      case 'delivered':
        return { label: isRtl ? 'تم التسليم بنجاح' : 'Delivered', class: 'status-delivered' };
      case 'cancelled':
        return { label: isRtl ? 'تم الإلغاء' : 'Cancelled', class: 'status-cancelled' };
      case 'returned_to_warehouse':
      case 'return_received':
      case 'refunded':
        return { label: isRtl ? 'مرتجع' : 'Returned', class: 'status-returned' };
      default:
        return { label: status, class: 'status-default' };
    }
  };

  return (
    <div className="track-order-page-wrapper" dir={isRtl ? 'rtl' : 'ltr'}>
      <Navbar lang={lang} onToggleLang={setLang} />

      <main className="track-order-main-container">
        {/* Breadcrumb */}
        <nav className="track-breadcrumbs" aria-label="Breadcrumb">
          <Link href={formatLangHref('/', lang)} className="crumb-link">
            <FaHouse className="crumb-icon" />
            <span>{isRtl ? 'الرئيسية' : 'Home'}</span>
          </Link>
          {isRtl ? <FaChevronLeft className="crumb-sep" /> : <FaChevronRight className="crumb-sep" />}
          <span className="crumb-active">{isRtl ? 'تتبع وإدارة الطلبات' : 'Track & Manage Orders'}</span>
        </nav>

        {/* ================= Hero Search Box ================= */}
        <div className="track-hero-search-card">
          <div className="hero-text">
            <h1>{isRtl ? 'تتبع وإدارة طلباتك بكل سهولة' : 'Track & Manage Your Orders'}</h1>
            <p>
              {isRtl
                ? 'أدخل كود الطلب (مثل TRD-2611-1234) أو رقم الهاتف المسجل للاطلاع على حالة الشحنة، أو تعديل العنوان، أو تعديل المنتجات وإلغاء الطلب قبل الشحن.'
                : 'Enter your order code or phone number to track live status, update address, modify items, or cancel.'}
            </p>
          </div>

          <form
            className="track-search-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
          >
            <div className="search-input-wrapper">
              <FaMagnifyingGlass className="search-icon" />
              <input
                type="text"
                placeholder={isRtl ? 'أدخل كود الطلب المرجعي (TRD-XXXX) أو رقم الهاتف...' : 'Enter order code or phone...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                required
              />
              {searchQuery && (
                <button
                  type="button"
                  className="btn-clear-query"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear"
                >
                  <FaXmark />
                </button>
              )}
            </div>
            <button type="submit" className="btn-submit-track" disabled={loading}>
              {loading ? (
                <span>{isRtl ? 'جاري البحث...' : 'Searching...'}</span>
              ) : (
                <>
                  <FaMagnifyingGlass />
                  <span>{isRtl ? 'بحث وتتبع الطلب' : 'Track Order'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* ================= Search Results Stage ================= */}
        {loading ? (
          <div className="track-loading-box">
            <div className="spinner-ring" />
            <h3>{isRtl ? 'جاري جلب تفاصيل الطلب...' : 'Fetching order details...'}</h3>
          </div>
        ) : searched && !selectedOrder ? (
          <div className="track-empty-box">
            <div className="empty-icon-circle">
              <FaBoxOpen />
            </div>
            <h3>{isRtl ? 'لم يتم العثور على أي طلبات مطابقة' : 'No matching orders found'}</h3>
            <p>
              {isRtl
                ? 'يرجى التأكد من كتابة كود الطلب بدقة أو رقم الهاتف المسجل أثناء الشراء.'
                : 'Please double check your order reference or registered mobile number.'}
            </p>
          </div>
        ) : selectedOrder ? (
          <div className="order-details-live-view">
            {/* Multiple orders switcher tabs if user searched by phone and has > 1 order */}
            {ordersList.length > 1 && (
              <div className="multiple-orders-tabs">
                <span className="tabs-title">{isRtl ? 'الطلبات المسجلة برقمك:' : 'Your Orders:'}</span>
                <div className="tabs-chips-list">
                  {ordersList.map((ord) => (
                    <button
                      key={ord.id}
                      type="button"
                      className={`order-chip-btn ${selectedOrder.id === ord.id ? 'active' : ''}`}
                      onClick={() => setSelectedOrder(ord)}
                    >
                      <strong>#{ord.order_number}</strong>
                      <span className={`chip-status ${getStatusBadge(ord.order_status).class}`}>
                        {getStatusBadge(ord.order_status).label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Top Order Summary Header */}
            <div className="order-main-header-card">
              <div className="header-meta">
                <div className="order-code-title">
                  <h2>#{selectedOrder.order_number}</h2>
                  <span className={`status-pill ${getStatusBadge(selectedOrder.order_status).class}`}>
                    {getStatusBadge(selectedOrder.order_status).label}
                  </span>
                </div>
                <div className="order-timestamp">
                  <span>{isRtl ? 'تاريخ تسجيل الطلب:' : 'Date Placed:'}</span>
                  <strong>{new Date(selectedOrder.created_at).toLocaleDateString('ar-EG', { dateStyle: 'full' })}</strong>
                </div>
              </div>

              {/* Self-Service Action Buttons Cluster */}
              <div className="header-action-buttons">
                {canCustomerModify ? (
                  <>
                    <button
                      type="button"
                      className="btn-customer-action btn-edit-address"
                      onClick={openAddressModal}
                    >
                      <FaLocationDot />
                      <span>{isRtl ? 'تعديل بيانات التوصيل' : 'Edit Delivery Info'}</span>
                    </button>

                    <button
                      type="button"
                      className="btn-customer-action btn-edit-items"
                      onClick={openItemsModal}
                    >
                      <FaPenToSquare />
                      <span>{isRtl ? 'تعديل منتجات الطلب' : 'Modify Items'}</span>
                    </button>

                    <button
                      type="button"
                      className="btn-customer-action btn-cancel-order"
                      onClick={() => setShowCancelModal(true)}
                    >
                      <FaBan />
                      <span>{isRtl ? 'إلغاء الطلب' : 'Cancel Order'}</span>
                    </button>
                  </>
                ) : (
                  <div className="locked-status-pill">
                    <FaLock />
                    <span>
                      {isShipped
                        ? (isRtl ? 'الشحنة مع المندوب (مغلق للتعديل)' : 'Out for delivery (Locked)')
                        : isDelivered
                        ? (isRtl ? 'تم التسليم بنجاح' : 'Delivered')
                        : isCancelled
                        ? (isRtl ? 'الطلب ملغي' : 'Order Cancelled')
                        : (isRtl ? 'مغلق للتعديل' : 'Locked')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Notice / Reassurance Banner */}
            <div className={`order-status-banner-notice ${canCustomerModify ? 'banner-editable' : isCancelled ? 'banner-cancelled' : 'banner-shipped'}`}>
              <div className="banner-icon">
                {canCustomerModify ? <FaShieldHalved /> : isCancelled ? <FaCircleXmark /> : <FaTruckFast />}
              </div>
              <div className="banner-text">
                {canCustomerModify ? (
                  <p>
                    <strong>{isRtl ? 'طلبك قيد المراجعة والتجهيز:' : 'Order in Preparation:'}</strong>{' '}
                    {isRtl
                      ? 'يمكنك تعديل العنوان، أرقام التواصل، العلامة المميزة، أو تعديل كميات المنتجات وإلغاء الطلب بحرية قبل تسليمه لمندوب الشحن.'
                      : 'You can modify destination details, change items, or cancel freely before courier dispatch.'}
                  </p>
                ) : isShipped ? (
                  <p>
                    <strong>{isRtl ? 'تم شحن الطلب بنجاح:' : 'Package Dispatched:'}</strong>{' '}
                    {isRtl
                      ? 'الشحنة حالياً مع مندوب شركة التوصيل وفي طريقها إليك. لا يمكن تعديل أو إلغاء الطلب من الموقع. للاستفسارات السريعة تواصل عبر واتساب.'
                      : 'The courier is currently on the way with your shipment. Modifications are closed.'}
                  </p>
                ) : isDelivered ? (
                  <p>
                    <strong>{isRtl ? 'تم تسليم الطلب بنجاح:' : 'Order Delivered:'}</strong>{' '}
                    {isRtl
                      ? 'شكراً لثقتكم بترندلاين تك. جميع أجهزتنا مشمولة بضمان الوكيل وخدمة ما بعد البيع وحق الاسترجاع خلال 14 يوماً.'
                      : 'Delivered successfully. Covered by 14-day return and agent warranty.'}
                  </p>
                ) : (
                  <p>
                    <strong>{isRtl ? 'الطلب ملغي:' : 'Order Cancelled:'}</strong>{' '}
                    {selectedOrder.cancellation_reason
                      ? `${isRtl ? 'سبب الإلغاء:' : 'Reason:'} ${selectedOrder.cancellation_reason}`
                      : (isRtl ? 'تم إلغاء الطلب وتحرير كافة المنتجات المحجوزة للمخزون.' : 'Order has been cancelled.')}
                  </p>
                )}
              </div>

              {!canCustomerModify && (
                <a
                  href={`https://wa.me/201281717577?text=${encodeURIComponent(`مرحباً ترندلاين تك، بخصوص طلبي كود #${selectedOrder.order_number}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp-direct"
                >
                  <FaWhatsapp size={15} />
                  <span>{isRtl ? 'مساعدة عبر واتساب' : 'WhatsApp'}</span>
                </a>
              )}
            </div>

            {/* Stepper Timeline Visualizer */}
            <div className="order-stepper-card">
              <h3 className="card-heading">
                <FaClockRotateLeft />
                <span>{isRtl ? 'سجل وحالة تتبع الشحنة' : 'Tracking Journey'}</span>
              </h3>

              <div className="stepper-horizontal">
                {/* Step 1: استلام الطلب */}
                <div className={`step-item ${selectedOrder.order_status !== 'cancelled' ? 'done' : 'cancelled'}`}>
                  <div className="step-circle">
                    <FaCircleCheck />
                  </div>
                  <div className="step-content">
                    <span className="step-title">{isRtl ? 'تم استلام الطلب' : 'Received'}</span>
                    <span className="step-time">
                      {new Date(selectedOrder.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div className={`step-line ${['confirmed', 'processing', 'shipped', 'delivered'].includes(selectedOrder.order_status) ? 'filled' : ''}`} />

                {/* Step 2: قيد التجهيز */}
                <div className={`step-item ${['confirmed', 'processing', 'shipped', 'delivered'].includes(selectedOrder.order_status) ? 'done' : selectedOrder.order_status === 'new' ? 'current' : ''}`}>
                  <div className="step-circle">
                    {['confirmed', 'processing', 'shipped', 'delivered'].includes(selectedOrder.order_status) ? <FaCheck /> : '2'}
                  </div>
                  <div className="step-content">
                    <span className="step-title">{isRtl ? 'المراجعة والتجهيز' : 'Processing'}</span>
                    <span className="step-time">
                      {['confirmed', 'processing', 'shipped', 'delivered'].includes(selectedOrder.order_status)
                        ? (isRtl ? 'تم التأكيد' : 'Verified')
                        : (isRtl ? 'قيد المراجعة' : 'Pending')}
                    </span>
                  </div>
                </div>

                <div className={`step-line ${['shipped', 'delivered'].includes(selectedOrder.order_status) ? 'filled' : ''}`} />

                {/* Step 3: تم الشحن */}
                <div className={`step-item ${['shipped', 'delivered'].includes(selectedOrder.order_status) ? 'done' : selectedOrder.order_status === 'processing' ? 'current' : ''}`}>
                  <div className="step-circle">
                    {['shipped', 'delivered'].includes(selectedOrder.order_status) ? <FaCheck /> : <FaTruckFast size={12} />}
                  </div>
                  <div className="step-content">
                    <span className="step-title">{isRtl ? 'تم الشحن' : 'Shipped'}</span>
                    <span className="step-time">
                      {selectedOrder.shipped_at
                        ? new Date(selectedOrder.shipped_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })
                        : (isRtl ? 'مع المندوب' : 'Courier')}
                    </span>
                  </div>
                </div>

                <div className={`step-line ${selectedOrder.order_status === 'delivered' ? 'filled' : ''}`} />

                {/* Step 4: تم التسليم */}
                <div className={`step-item ${selectedOrder.order_status === 'delivered' ? 'done' : ''}`}>
                  <div className="step-circle">
                    {selectedOrder.order_status === 'delivered' ? <FaCheck /> : '4'}
                  </div>
                  <div className="step-content">
                    <span className="step-title">{isRtl ? 'تم التسليم' : 'Delivered'}</span>
                    <span className="step-time">
                      {selectedOrder.delivered_at
                        ? new Date(selectedOrder.delivered_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })
                        : (isRtl ? 'تسليم للعميل' : 'Arrival')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid 2 Columns: Destination & Cost Summary */}
            <div className="order-info-two-cols">
              {/* Col 1: Delivery Details */}
              <div className="info-card-box">
                <div className="card-top-bar">
                  <h3 className="card-heading">
                    <FaLocationDot />
                    <span>{isRtl ? 'بيانات التوصيل والعنوان' : 'Delivery Address'}</span>
                  </h3>
                  {canCustomerModify && (
                    <button
                      type="button"
                      className="btn-mini-action"
                      onClick={openAddressModal}
                    >
                      <FaPenToSquare />
                      <span>{isRtl ? 'تعديل' : 'Edit'}</span>
                    </button>
                  )}
                </div>

                <div className="info-key-val-list">
                  <div className="kv-row">
                    <span className="k">{isRtl ? 'الاسم:' : 'Name:'}</span>
                    <strong className="v">{selectedOrder.customer_name}</strong>
                  </div>
                  <div className="kv-row">
                    <span className="k">{isRtl ? 'رقم الهاتف:' : 'Phone:'}</span>
                    <strong className="v" dir="ltr">{selectedOrder.customer_phone}</strong>
                  </div>
                  {selectedOrder.customer_phone_2 && (
                    <div className="kv-row">
                      <span className="k">{isRtl ? 'رقم إضافي:' : 'Secondary Phone:'}</span>
                      <strong className="v" dir="ltr">{selectedOrder.customer_phone_2}</strong>
                    </div>
                  )}
                  <div className="kv-row">
                    <span className="k">{isRtl ? 'المحافظة والمدينة:' : 'Area:'}</span>
                    <strong className="v">{selectedOrder.governorate} {selectedOrder.city ? `- ${selectedOrder.city}` : ''}</strong>
                  </div>
                  <div className="kv-row">
                    <span className="k">{isRtl ? 'العنوان:' : 'Street Address:'}</span>
                    <strong className="v">{selectedOrder.street_address}</strong>
                  </div>
                  {selectedOrder.landmark && (
                    <div className="kv-row landmark-row">
                      <span className="k">
                        <FaLandmark />
                        <span>{isRtl ? 'علامة مميزة:' : 'Landmark:'}</span>
                      </span>
                      <strong className="v">{selectedOrder.landmark}</strong>
                    </div>
                  )}
                  {selectedOrder.order_notes && (
                    <div className="kv-row">
                      <span className="k">{isRtl ? 'ملاحظات:' : 'Notes:'}</span>
                      <span className="v italic">{selectedOrder.order_notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Col 2: Payment & Shipping Policy */}
              <div className="info-card-box">
                <div className="card-top-bar">
                  <h3 className="card-heading">
                    <FaCreditCard />
                    <span>{isRtl ? 'طريقة الدفع والحساب' : 'Payment & Total'}</span>
                  </h3>
                </div>

                <div className="payment-pill-display">
                  <div className="pm-symbol">
                    {selectedOrder.payment_method === 'credit_card' ? (
                      <FaCreditCard />
                    ) : selectedOrder.payment_method === 'wallet' ? (
                      <FaWallet />
                    ) : selectedOrder.payment_method === 'instapay' ? (
                      <FaBolt />
                    ) : (
                      <FaMoneyBillWave />
                    )}
                  </div>
                  <div>
                    <span className="caption">{isRtl ? 'طريقة الدفع' : 'Payment Channel'}</span>
                    <h4>
                      {selectedOrder.payment_method === 'credit_card'
                        ? (isRtl ? 'بطاقة بنكية / فيزا' : 'Credit Card')
                        : selectedOrder.payment_method === 'wallet'
                        ? (isRtl ? 'محفظة إلكترونية' : 'E-Wallet')
                        : selectedOrder.payment_method === 'instapay'
                        ? (isRtl ? 'إنستاباي' : 'InstaPay')
                        : (isRtl ? 'الدفع نقداً عند الاستلام' : 'Cash on Delivery')}
                    </h4>
                  </div>
                </div>

                {/* Shipping notice */}
                <div className="shipping-notice-compact">
                  <FaTruckFast />
                  <div>
                    <strong>{isRtl ? 'مصاريف الشحن:' : 'Shipping Notice:'}</strong>{' '}
                    <span>
                      {isRtl
                        ? 'تُحدد بناءً على المنطقة وحجم الطرد، وسيتم التواصل معكم لتأكيد القيمة النهائية.'
                        : 'Determined based on destination and weight.'}
                    </span>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="finance-breakdown">
                  <div className="f-row">
                    <span>{isRtl ? 'إجمالي المنتجات:' : 'Subtotal:'}</span>
                    <strong>{Number(selectedOrder.subtotal || selectedOrder.total_amount).toLocaleString()} ج.م</strong>
                  </div>
                  {Number(selectedOrder.discount_amount || 0) > 0 && (
                    <div className="f-row discount">
                      <span>{isRtl ? 'الخصم:' : 'Discount:'}</span>
                      <strong>- {Number(selectedOrder.discount_amount).toLocaleString()} ج.م</strong>
                    </div>
                  )}
                  <div className="f-row">
                    <span>{isRtl ? 'الشحن:' : 'Shipping:'}</span>
                    <span>
                      {Number(selectedOrder.shipping_fee || 0) > 0
                        ? `${Number(selectedOrder.shipping_fee).toLocaleString()} ج.م`
                        : (isRtl ? 'تُحدد هاتفياً' : 'By phone')}
                    </span>
                  </div>
                  <div className="f-row grand">
                    <span>{isRtl ? 'المبلغ الكلي:' : 'Total Amount:'}</span>
                    <strong className="grand-price">{Number(selectedOrder.total_amount).toLocaleString()} ج.م</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Ordered Items List */}
            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div className="order-items-catalog-card">
                <div className="card-top-bar">
                  <h3 className="card-heading">
                    <FaBoxOpen />
                    <span>{isRtl ? 'محتويات الطلب والأجهزة' : 'Items in Order'}</span>
                    <span className="count-pill">{selectedOrder.items.length}</span>
                  </h3>
                  {canCustomerModify && (
                    <button
                      type="button"
                      className="btn-mini-action"
                      onClick={openItemsModal}
                    >
                      <FaPenToSquare />
                      <span>{isRtl ? 'تعديل الكميات أو حذف عنصر' : 'Modify Items'}</span>
                    </button>
                  )}
                </div>

                <div className="items-list-container">
                  {selectedOrder.items.map((item) => {
                    const itemName = isRtl
                      ? item.item_name_snapshot_ar || item.product?.name_ar || 'جهاز ترندلاين'
                      : item.item_name_snapshot_en || item.product?.name_en || 'Trendline Device';

                    return (
                      <div key={item.id} className="item-row-card">
                        <div className="item-img-box">
                          <img
                            src="/assets/placeholder-tech.png"
                            alt={itemName}
                          />
                        </div>

                        <div className="item-body">
                          <h4>{itemName}</h4>
                          <span className="item-sku">SKU: {item.sku_snapshot || item.product?.sku || 'TRD-SKU'}</span>
                        </div>

                        <div className="item-qty-col">
                          <span className="qty-badge">{isRtl ? 'الكمية:' : 'Qty:'} {item.quantity}</span>
                        </div>

                        <div className="item-pricing-col">
                          <span className="unit-price">{Number(item.unit_price).toLocaleString()} ج.م / قطعة</span>
                          <strong className="line-total">{Number(item.total_price || (item.unit_price * item.quantity)).toLocaleString()} ج.م</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* ================= MODAL 1: EDIT ADDRESS ================= */}
        {showEditAddressModal && (
          <div className="modal-backdrop">
            <div className="modal-box address-modal">
              <div className="modal-header">
                <h3>
                  <FaLocationDot />
                  <span>{isRtl ? 'تعديل بيانات الشحن والتوصيل' : 'Edit Delivery Details'}</span>
                </h3>
                <button
                  type="button"
                  className="btn-close-modal"
                  onClick={() => setShowEditAddressModal(false)}
                >
                  <FaXmark />
                </button>
              </div>

              <form onSubmit={handleSaveAddress} className="modal-body-form">
                <div className="form-grid-two">
                  <div className="form-group">
                    <label>{isRtl ? 'الاسم بالكامل' : 'Full Name'} *</label>
                    <input
                      type="text"
                      value={addressForm.customer_name}
                      onChange={(e) => setAddressForm({ ...addressForm, customer_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>{isRtl ? 'رقم الهاتف الأساسي' : 'Primary Phone'} *</label>
                    <input
                      type="tel"
                      dir="ltr"
                      value={addressForm.customer_phone}
                      onChange={(e) => setAddressForm({ ...addressForm, customer_phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-two">
                  <div className="form-group">
                    <label>{isRtl ? 'رقم هاتف بديل' : 'Secondary Phone'}</label>
                    <input
                      type="tel"
                      dir="ltr"
                      value={addressForm.customer_phone_2}
                      onChange={(e) => setAddressForm({ ...addressForm, customer_phone_2: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>{isRtl ? 'المحافظة' : 'Governorate'} *</label>
                    <select
                      value={addressForm.governorate}
                      onChange={(e) => setAddressForm({ ...addressForm, governorate: e.target.value })}
                    >
                      {EGYPT_GOVERNORATES.map((gov) => (
                        <option key={gov} value={gov}>{gov}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-grid-two">
                  <div className="form-group">
                    <label>{isRtl ? 'المدينة / الحي' : 'City / District'} *</label>
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>{isRtl ? 'أقرب علامة مميزة (محل، صيدلية، مسجد)' : 'Landmark'}</label>
                    <input
                      type="text"
                      placeholder={isRtl ? 'مثال: بجوار صيدلية العزبي' : 'e.g. Near El-Ezaby'}
                      value={addressForm.landmark}
                      onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>{isRtl ? 'العنوان بالتفصيل (اسم الشارع، رقم العقار، رقم الشقة)' : 'Street Address'} *</label>
                  <textarea
                    rows={2}
                    value={addressForm.street_address}
                    onChange={(e) => setAddressForm({ ...addressForm, street_address: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{isRtl ? 'ملاحظات إضافية للتوصيل' : 'Delivery Notes'}</label>
                  <input
                    type="text"
                    value={addressForm.order_notes}
                    onChange={(e) => setAddressForm({ ...addressForm, order_notes: e.target.value })}
                  />
                </div>

                <div className="modal-actions-bar">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowEditAddressModal(false)}
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="btn-save"
                    disabled={actionSubmitting}
                  >
                    {actionSubmitting ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ التعديلات' : 'Save Changes')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= MODAL 2: EDIT ITEMS ================= */}
        {showEditItemsModal && (
          <div className="modal-backdrop">
            <div className="modal-box items-modal">
              <div className="modal-header">
                <h3>
                  <FaPenToSquare />
                  <span>{isRtl ? 'تعديل محتويات وكميات الطلب' : 'Modify Order Items'}</span>
                </h3>
                <button
                  type="button"
                  className="btn-close-modal"
                  onClick={() => setShowEditItemsModal(false)}
                >
                  <FaXmark />
                </button>
              </div>

              <div className="modal-items-list">
                {editableItems.map((it) => (
                  <div key={it.id} className="modal-item-tile">
                    <div className="it-details">
                      <h4>{it.item_name_snapshot_ar || it.product?.name_ar}</h4>
                      <span className="it-price">{Number(it.unit_price).toLocaleString()} ج.م للقطعة</span>
                    </div>

                    <div className="it-qty-controls">
                      <button
                        type="button"
                        className="qty-btn minus"
                        onClick={() => handleItemQtyChange(it.id, -1)}
                        title={it.quantity === 1 ? (isRtl ? 'حذف العنصر' : 'Remove') : (isRtl ? 'تقليل الكمية' : 'Decrease')}
                      >
                        {it.quantity === 1 ? <FaTrashCan size={12} /> : <FaMinus size={11} />}
                      </button>
                      <span className="qty-count">{it.quantity}</span>
                      <button
                        type="button"
                        className="qty-btn plus"
                        onClick={() => handleItemQtyChange(it.id, 1)}
                        title={isRtl ? 'زيادة الكمية' : 'Increase'}
                      >
                        <FaPlus size={11} />
                      </button>
                    </div>

                    <div className="it-line-total">
                      {(it.quantity * Number(it.unit_price)).toLocaleString()} ج.م
                    </div>
                  </div>
                ))}
              </div>

              <div className="modal-actions-bar">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowEditItemsModal(false)}
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  className="btn-save"
                  onClick={handleSaveItems}
                  disabled={actionSubmitting}
                >
                  {actionSubmitting ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'تأكيد وحفظ التعديلات' : 'Confirm Updates')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL 3: CANCEL ORDER ================= */}
        {showCancelModal && (
          <div className="modal-backdrop">
            <div className="modal-box cancel-modal">
              <div className="cancel-icon-circle">
                <FaTriangleExclamation />
              </div>

              <h3>{isRtl ? 'هل أنت متأكد من إلغاء هذا الطلب؟' : 'Confirm Order Cancellation?'}</h3>
              <p>
                {isRtl
                  ? `سيتم إلغاء الطلب #${selectedOrder?.order_number} فوراً وإرجاع المنتجات للمخزون المتاح.`
                  : `Order #${selectedOrder?.order_number} will be cancelled immediately.`}
              </p>

              <div className="cancel-reasons-group">
                <label>{isRtl ? 'يرجى توضيح سبب الإلغاء:' : 'Reason for cancellation:'}</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                >
                  <option value="رغبة في تغيير المنتجات أو الكميات">{isRtl ? 'رغبة في تغيير المنتجات أو الكميات' : 'Want to change items'}</option>
                  <option value="الرغبة في تعديل العنوان أو طريقة الدفع">{isRtl ? 'الرغبة في تعديل العنوان أو طريقة الدفع' : 'Change address / payment'}</option>
                  <option value="تم الطلب عن طريق الخطأ">{isRtl ? 'تم الطلب عن طريق الخطأ' : 'Ordered by mistake'}</option>
                  <option value="وجدت سعراً أفضل">{isRtl ? 'وجدت سعراً أفضل' : 'Found better price'}</option>
                  <option value="أخرى">{isRtl ? 'سبب آخر...' : 'Other reason...'}</option>
                </select>

                {cancelReason === 'أخرى' && (
                  <input
                    type="text"
                    placeholder={isRtl ? 'اكتب سبب الإلغاء هنا...' : 'Type reason here...'}
                    value={customCancelReason}
                    onChange={(e) => setCustomCancelReason(e.target.value)}
                    style={{ marginTop: '10px' }}
                  />
                )}
              </div>

              <div className="modal-actions-bar">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowCancelModal(false)}
                >
                  {isRtl ? 'تراجع والاحتفاظ بالطلب' : 'Keep Order'}
                </button>
                <button
                  type="button"
                  className="btn-danger-confirm"
                  onClick={handleCancelOrder}
                  disabled={actionSubmitting}
                >
                  {actionSubmitting ? (isRtl ? 'جاري الإلغاء...' : 'Cancelling...') : (isRtl ? 'نعم، قم بإلغاء الطلب' : 'Yes, Cancel Order')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer lang={lang} />
    </div>
  );
}

export default function TrackOrderPage() {
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
          جاري تحميل صفحة تتبع الطلبات...
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
