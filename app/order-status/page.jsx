'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/src/components/common/Navbar/Navbar';
import Footer from '@/src/components/common/Footer/Footer';
import useTrendlineLang, { formatLangHref } from '@/src/hooks/useTrendlineLang';
import { getApiHost } from '@/src/utils/apiConfig';
import {
  FaCircleCheck,
  FaCircleXmark,
  FaTruckFast,
  FaHouse,
  FaChevronLeft,
  FaChevronRight,
  FaCopy,
  FaCheck,
  FaPrint,
  FaArrowLeft,
  FaArrowRight,
  FaWhatsapp,
  FaPhone,
  FaLocationDot,
  FaLandmark,
  FaCreditCard,
  FaMoneyBillWave,
  FaWallet,
  FaBolt,
  FaBoxOpen,
  FaClockRotateLeft,
  FaPenToSquare,
} from 'react-icons/fa6';
import './OrderStatus.scss';

function OrderStatusContent() {
  const { lang, isRtl, setLang } = useTrendlineLang('ar');
  const searchParams = useSearchParams();

  const orderNumber = searchParams?.get('order_number') || '';
  const statusParam = searchParams?.get('status') || 'success';
  const errorMessageParam = searchParams?.get('message') || '';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(Boolean(orderNumber));
  const [copiedCode, setCopiedCode] = useState(false);

  // Fetch Order details if orderNumber provided
  useEffect(() => {
    if (!orderNumber) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function fetchOrderDetails() {
      setLoading(true);
      try {
        const apiHost = getApiHost();
        const res = await fetch(`${apiHost}/api/v1/orders/by-number/${encodeURIComponent(orderNumber)}`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && isMounted) {
            setOrder(json.data);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch order details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchOrderDetails();
    return () => {
      isMounted = false;
    };
  }, [orderNumber]);

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const isSuccess = statusParam === 'success';

  return (
    <div className="order-status-page-wrapper" dir={isRtl ? 'rtl' : 'ltr'}>
      <Navbar lang={lang} onToggleLang={setLang} />

      <main className="order-status-main-container">
        {/* Breadcrumb */}
        <nav className="status-breadcrumbs" aria-label="Breadcrumb">
          <Link href={formatLangHref('/', lang)} className="crumb-link">
            <FaHouse className="crumb-icon" />
            <span>{isRtl ? 'الرئيسية' : 'Home'}</span>
          </Link>
          {isRtl ? <FaChevronLeft className="crumb-sep" /> : <FaChevronRight className="crumb-sep" />}
          <Link href={formatLangHref('/cart', lang)} className="crumb-link">
            <span>{isRtl ? 'عربة التسوق' : 'Cart'}</span>
          </Link>
          {isRtl ? <FaChevronLeft className="crumb-sep" /> : <FaChevronRight className="crumb-sep" />}
          <span className="crumb-active">
            {isSuccess
              ? (isRtl ? 'تأكيد وحالة الطلب' : 'Order Confirmation')
              : (isRtl ? 'خطأ في معالجة الطلب' : 'Order Processing Error')}
          </span>
        </nav>

        {loading ? (
          <div className="status-loading-stage">
            <div className="loading-spinner-ring" />
            <h3>{isRtl ? 'جاري تحميل تفاصيل طلبك...' : 'Loading order details...'}</h3>
            <p>{isRtl ? 'يرجى الانتظار لحظات، نقوم بمطابقة بيانات الشحن والأجهزة.' : 'Please wait a moment.'}</p>
          </div>
        ) : !isSuccess ? (
          /* ================= ERROR SCREEN ================= */
          <div className="status-card-box error-state-box">
            <div className="error-icon-badge">
              <FaCircleXmark />
            </div>

            <h1 className="status-headline">
              {isRtl ? 'حدث خطأ أثناء إتمام الطلب' : 'Failed to Process Your Order'}
            </h1>

            <p className="status-desc">
              {errorMessageParam ||
                (isRtl
                  ? 'تعذر تأكيد طلبك بسبب مشكلة غير متوقعة في الشبكة أو نفاد مخزون أحد العناصر. نعتذر بشدة عن ذلك.'
                  : 'We were unable to process your order. Please review your cart and try again.')}
            </p>

            <div className="status-error-actions">
              <Link href={formatLangHref('/cart', lang)} className="btn-retry-cart">
                <span>{isRtl ? 'العودة لعربة التسوق والمحاولة ثانية' : 'Return to Cart & Retry'}</span>
                {isRtl ? <FaArrowLeft size={13} /> : <FaArrowRight size={13} />}
              </Link>
              <a
                href="https://wa.me/201281717577"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-support-whatsapp"
              >
                <FaWhatsapp size={16} />
                <span>{isRtl ? 'تواصل مع الدعم الفني للمساعدة' : 'Contact Support'}</span>
              </a>
            </div>
          </div>
        ) : (
          /* ================= SUCCESS CONFIRMATION SCREEN ================= */
          <div className="status-confirmation-layout">
            {/* Top Celebration Hero */}
            <div className="confirmation-hero-card">
              <div className="hero-glow-backdrop" />
              <div className="success-check-badge">
                <FaCircleCheck />
              </div>

              <div className="hero-text-group">
                <span className="hero-tag-pill">
                  <FaBoxOpen />
                  <span>{isRtl ? 'تم تسجيل وتأكيد الطلب بنجاح' : 'Order Successfully Registered'}</span>
                </span>
                <h1 className="hero-title">
                  {isRtl ? 'شكراً لتسوقك من ترندلاين تك!' : 'Thank you for choosing Trendline Tech!'}
                </h1>
                <p className="hero-subtitle">
                  {isRtl
                    ? 'تم حفظ طلبكم في نظام العمليات بنجاح، وستتلقون اتصالاً هاتفياً لتأكيد موعد التوصيل ومصاريف الشحن.'
                    : 'Your order has been registered and is being processed by our operations team.'}
                </p>
              </div>

              {/* Order Reference Number Strip */}
              <div className="order-ref-strip">
                <div className="ref-info">
                  <span className="ref-label">{isRtl ? 'كود الطلب المرجعي:' : 'Order Code:'}</span>
                  <strong className="ref-code">#{order?.order_number || orderNumber}</strong>
                </div>

                <div className="ref-actions">
                  <button
                    type="button"
                    className="btn-copy-code"
                    onClick={() => handleCopyCode(order?.order_number || orderNumber)}
                    title={isRtl ? 'نسخ كود الطلب' : 'Copy order code'}
                  >
                    {copiedCode ? <FaCheck className="icon-copied" /> : <FaCopy />}
                    <span>{copiedCode ? (isRtl ? 'تم النسخ!' : 'Copied!') : (isRtl ? 'نسخ الكود' : 'Copy')}</span>
                  </button>

                  <button
                    type="button"
                    className="btn-print-summary"
                    onClick={handlePrint}
                    title={isRtl ? 'طباعة الفاتورة والملخص' : 'Print Invoice'}
                  >
                    <FaPrint />
                    <span>{isRtl ? 'طباعة' : 'Print'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="order-live-progress-card">
              <h3 className="section-title">
                <FaClockRotateLeft className="icon-section" />
                <span>{isRtl ? 'مراحل ومسار طلبك' : 'Live Order Journey'}</span>
              </h3>

              <div className="progress-steps-track">
                <div className="step-node completed">
                  <div className="step-dot">
                    <FaCheck size={11} />
                  </div>
                  <div className="step-labels">
                    <span className="step-name">{isRtl ? 'استلام الطلب' : 'Order Placed'}</span>
                    <span className="step-status">{isRtl ? 'تم بنجاح' : 'Done'}</span>
                  </div>
                </div>

                <div className="step-connector active" />

                <div className="step-node current">
                  <div className="step-dot">2</div>
                  <div className="step-labels">
                    <span className="step-name">{isRtl ? 'مراجعة وتأكيد' : 'Phone Verification'}</span>
                    <span className="step-status">{isRtl ? 'جارٍ الاتصال بك' : 'In Progress'}</span>
                  </div>
                </div>

                <div className="step-connector" />

                <div className="step-node pending">
                  <div className="step-dot">3</div>
                  <div className="step-labels">
                    <span className="step-name">{isRtl ? 'التجهيز والتغليف' : 'Packing & Quality'}</span>
                    <span className="step-status">{isRtl ? 'بالمستودع' : 'Warehouse'}</span>
                  </div>
                </div>

                <div className="step-connector" />

                <div className="step-node pending">
                  <div className="step-dot">4</div>
                  <div className="step-labels">
                    <span className="step-name">{isRtl ? 'مع مندوب الشحن' : 'Out for Delivery'}</span>
                    <span className="step-status">{isRtl ? 'للتسليم' : 'Courier'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid 2-Columns: Details & Shipping Notice */}
            <div className="confirmation-details-grid">
              {/* Column 1: Customer & Delivery Info */}
              <div className="details-col-card">
                <h3 className="col-heading">
                  <FaLocationDot className="icon-col" />
                  <span>{isRtl ? 'بيانات الشحن والتوصيل' : 'Delivery Destination'}</span>
                </h3>

                <div className="info-rows-list">
                  <div className="info-row">
                    <span className="row-label">{isRtl ? 'الاسم المستلم:' : 'Recipient Name:'}</span>
                    <strong className="row-val">{order?.customer_name || 'العميل'}</strong>
                  </div>

                  <div className="info-row">
                    <span className="row-label">{isRtl ? 'رقم الهاتف:' : 'Phone Number:'}</span>
                    <strong className="row-val" dir="ltr">{order?.customer_phone || '-'}</strong>
                  </div>

                  {order?.customer_phone_2 && (
                    <div className="info-row">
                      <span className="row-label">{isRtl ? 'رقم بديل:' : 'Secondary Phone:'}</span>
                      <strong className="row-val" dir="ltr">{order.customer_phone_2}</strong>
                    </div>
                  )}

                  <div className="info-row">
                    <span className="row-label">{isRtl ? 'المحافظة والمدينة:' : 'Governorate & City:'}</span>
                    <strong className="row-val">
                      {order?.governorate || 'القاهرة'} {order?.city ? ` - ${order.city}` : ''}
                    </strong>
                  </div>

                  <div className="info-row">
                    <span className="row-label">{isRtl ? 'العنوان بالتفصيل:' : 'Street Address:'}</span>
                    <strong className="row-val">{order?.street_address || '-'}</strong>
                  </div>

                  {order?.landmark && (
                    <div className="info-row landmark-highlight-row">
                      <span className="row-label">
                        <FaLandmark />
                        <span>{isRtl ? 'أقرب علامة مميزة:' : 'Landmark:'}</span>
                      </span>
                      <strong className="row-val">{order.landmark}</strong>
                    </div>
                  )}

                  {order?.order_notes && (
                    <div className="info-row">
                      <span className="row-label">{isRtl ? 'ملاحظات التوصيل:' : 'Order Notes:'}</span>
                      <span className="row-val italic-note">{order.order_notes}</span>
                    </div>
                  )}
                </div>

                {/* Payment Method Badge */}
                <div className="payment-method-summary-pill">
                  <div className="pm-icon">
                    {order?.payment_method === 'credit_card' ? (
                      <FaCreditCard />
                    ) : order?.payment_method === 'wallet' ? (
                      <FaWallet />
                    ) : order?.payment_method === 'instapay' ? (
                      <FaBolt />
                    ) : (
                      <FaMoneyBillWave />
                    )}
                  </div>
                  <div className="pm-info">
                    <span className="pm-caption">{isRtl ? 'طريقة الدفع المختارة' : 'Payment Method'}</span>
                    <strong className="pm-title">
                      {order?.payment_method === 'credit_card'
                        ? (isRtl ? 'بطاقة بنكية / فيزا' : 'Credit / Debit Card')
                        : order?.payment_method === 'wallet'
                        ? (isRtl ? 'محفظة إلكترونية' : 'E-Wallet')
                        : order?.payment_method === 'instapay'
                        ? (isRtl ? 'إنستاباي (InstaPay)' : 'InstaPay')
                        : (isRtl ? 'الدفع نقداً عند الاستلام (COD)' : 'Cash on Delivery')}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Column 2: Shipping Note & Order Summary */}
              <div className="details-col-card summary-col">
                <h3 className="col-heading">
                  <FaTruckFast className="icon-col" />
                  <span>{isRtl ? 'ملخص التكلفة ومصاريف الشحن' : 'Cost & Shipping Policy'}</span>
                </h3>

                {/* Important Shipping Fee Notice (Mandated by user) */}
                <div className="status-shipping-notice-box">
                  <div className="notice-head">
                    <FaTruckFast className="truck-icon" />
                    <strong>{isRtl ? 'ملاحظة هامة بخصوص مصاريف الشحن' : 'Important Shipping Notice'}</strong>
                  </div>
                  <p className="notice-lead">
                    {isRtl
                      ? 'تكلفة الشحن تُحدد بناءً على المنطقة وحجم الطرد أو الطلب.'
                      : 'Shipping cost is determined based on the destination area and parcel size/weight.'}
                  </p>
                  <p className="notice-followup">
                    {isRtl
                      ? '(سيتم التواصل معكم لإبلاغكم بقيمة الشحن بعد تحديد وزن الطلب وعنوان التوصيل)'
                      : '(We will contact you via phone to inform you of the exact shipping fee after determining parcel weight and delivery address)'}
                  </p>
                </div>

                {/* Cost Breakdown */}
                <div className="cost-breakdown-table">
                  <div className="cost-row">
                    <span>{isRtl ? 'قيمة المنتجات (Subtotal):' : 'Products Subtotal:'}</span>
                    <strong>{Number(order?.subtotal || order?.total_amount || 0).toLocaleString()} ج.م</strong>
                  </div>

                  {Number(order?.discount_amount || 0) > 0 && (
                    <div className="cost-row discount-row">
                      <span>{isRtl ? 'الخصم المطبق (كوبون):' : 'Discount Applied:'}</span>
                      <strong>- {Number(order.discount_amount).toLocaleString()} ج.م</strong>
                    </div>
                  )}

                  <div className="cost-row">
                    <span>{isRtl ? 'مصاريف الشحن:' : 'Shipping Fee:'}</span>
                    <span className="shipping-calc-tag">
                      {Number(order?.shipping_fee || 0) > 0
                        ? `${Number(order.shipping_fee).toLocaleString()} ج.م`
                        : (isRtl ? 'تُحدد هاتفياً حسب المحافظة' : 'Calculated by phone')}
                    </span>
                  </div>

                  <div className="cost-row total-row">
                    <span>{isRtl ? 'الإجمالي التقريبي للطلب:' : 'Estimated Total:'}</span>
                    <strong className="grand-total">
                      {Number(order?.total_amount || 0).toLocaleString()} ج.م
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Ordered Items Table if available */}
            {order?.items && order.items.length > 0 && (
              <div className="ordered-items-stage-card">
                <h3 className="section-title">
                  <FaBoxOpen className="icon-section" />
                  <span>{isRtl ? 'المنتجات المطلوبة في هذا الطلب' : 'Ordered Items'}</span>
                  <span className="items-count-badge">{order.items.length}</span>
                </h3>

                <div className="items-cards-grid">
                  {order.items.map((item, idx) => {
                    const itemName = isRtl
                      ? item.item_name_snapshot_ar || item.product?.name_ar || 'منتج ترندلاين'
                      : item.item_name_snapshot_en || item.product?.name_en || 'Trendline Product';

                    const itemImage =
                      item.product?.images?.[0]?.image_url ||
                      '/assets/placeholder-tech.png';

                    return (
                      <div key={item.id || idx} className="ordered-item-card">
                        <div className="item-thumbnail">
                          <img
                            src={itemImage}
                            alt={itemName}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/assets/placeholder-tech.png';
                            }}
                          />
                        </div>

                        <div className="item-meta">
                          <h4 className="item-title">{itemName}</h4>
                          <div className="item-sku">SKU: {item.sku_snapshot || item.product?.sku || 'TRD-SKU'}</div>
                          <div className="item-pricing-row">
                            <span className="item-qty">{isRtl ? 'الكمية:' : 'Qty:'} {item.quantity}</span>
                            <span className="item-price">
                              {Number(item.unit_price || 0).toLocaleString()} ج.م
                            </span>
                          </div>
                        </div>

                        <div className="item-total-col">
                          <span className="label">{isRtl ? 'الإجمالي' : 'Total'}</span>
                          <strong className="total-val">
                            {Number(item.total_price || (item.unit_price * item.quantity) || 0).toLocaleString()} ج.م
                          </strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Next Steps & Self-Service Management Actions */}
            <div className="status-footer-actions-card">
              <div className="card-message">
                <h4>{isRtl ? 'هل تريد متابعة أو تعديل أو إلغاء الطلب؟' : 'Need to track, edit, or cancel?'}</h4>
                <p>
                  {isRtl
                    ? 'يمكنكم في أي وقت قبل شحن الطلب تعديل العنوان، أو تعديل المنتجات والكميات، أو إلغاء الطلب مباشرة عبر صفحة تتبع وإدارة الطلبات.'
                    : 'You can update your address, modify quantities, or cancel your order anytime before it is dispatched.'}
                </p>
              </div>

              <div className="actions-cluster">
                {/* Track and Edit Order Button (Requested by user) */}
                <Link
                  href={formatLangHref(`/track-order?order_number=${encodeURIComponent(order?.order_number || orderNumber)}`, lang)}
                  className="btn-track-and-manage"
                >
                  <FaPenToSquare />
                  <span>{isRtl ? 'تتبع أو تعديل أو إلغاء الطلب' : 'Track & Manage Order'}</span>
                </Link>

                {/* Continue Shopping */}
                <Link
                  href={formatLangHref('/categories', lang)}
                  className="btn-continue-catalog"
                >
                  <span>{isRtl ? 'متابعة التسوق واستعراض الأجهزة' : 'Continue Shopping'}</span>
                  {isRtl ? <FaArrowLeft size={12} /> : <FaArrowRight size={12} />}
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer lang={lang} />
    </div>
  );
}

export default function OrderStatusPage() {
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
          جاري تحميل صفحة حالة الطلب...
        </div>
      }
    >
      <OrderStatusContent />
    </Suspense>
  );
}
