'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/src/components/common/Navbar/Navbar';
import Footer from '@/src/components/common/Footer/Footer';
import { useCart } from '@/src/context/CartContext';
import { useToast } from '@/src/context/ToastContext';
import useTrendlineLang, { formatLangHref } from '@/src/hooks/useTrendlineLang';
import { getApiHost } from '@/src/utils/apiConfig';
import {
  FaHouse,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaCartShopping,
  FaTrashCan,
  FaPlus,
  FaMinus,
  FaTruckFast,
  FaShieldHalved,
  FaCircleCheck,
  FaBagShopping,
  FaArrowLeft,
  FaArrowRight,
  FaPhone,
  FaUser,
  FaLocationDot,
  FaCity,
  FaNoteSticky,
  FaClock,
  FaMagnifyingGlass,
  FaLandmark,
  FaCreditCard,
  FaMoneyBillWave,
  FaWallet,
  FaBolt,
  FaCircleDot,
  FaCircle,
  FaXmark,
} from 'react-icons/fa6';
import './CartPage.scss';

const EGYPT_GOVERNORATES = [
  { ar: 'القاهرة', en: 'Cairo' },
  { ar: 'الجيزة', en: 'Giza' },
  { ar: 'الإسكندرية', en: 'Alexandria' },
  { ar: 'الدقهلية', en: 'Dakahlia' },
  { ar: 'الشرقية', en: 'Sharkia' },
  { ar: 'القليوبية', en: 'Qalyubia' },
  { ar: 'كفر الشيخ', en: 'Kafr El Sheikh' },
  { ar: 'الغربية', en: 'Gharbia' },
  { ar: 'المنوفية', en: 'Monufia' },
  { ar: 'البحيرة', en: 'Beheira' },
  { ar: 'دمياط', en: 'Damietta' },
  { ar: 'بورسعيد', en: 'Port Said' },
  { ar: 'الإسماعيلية', en: 'Ismailia' },
  { ar: 'السويس', en: 'Suez' },
  { ar: 'الفيوم', en: 'Fayoum' },
  { ar: 'بني سويف', en: 'Beni Suef' },
  { ar: 'المنيا', en: 'Minya' },
  { ar: 'أسيوط', en: 'Asyut' },
  { ar: 'سوهاج', en: 'Sohag' },
  { ar: 'قنا', en: 'Qena' },
  { ar: 'الأقصر', en: 'Luxor' },
  { ar: 'أسوان', en: 'Aswan' },
  { ar: 'البحر الأحمر', en: 'Red Sea' },
  { ar: 'الوادي الجديد', en: 'New Valley' },
  { ar: 'مطروح', en: 'Matrouh' },
  { ar: 'شمال سيناء', en: 'North Sinai' },
  { ar: 'جنوب سيناء', en: 'South Sinai' },
];

function CartPageContent() {
  const router = useRouter();
  const { lang, isRtl, setLang } = useTrendlineLang('ar');
  const searchParams = useSearchParams();
  const toast = useToast();
  const {
    cart,
    loading,
    mutatingItemId,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  // 2-Step Flow: Step 1 = Cart Items, Step 2 = Shipping & Payment
  const [currentStep, setCurrentStep] = useState(1);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_phone_2: '',
    customer_email: '',
    governorate: 'القاهرة',
    city: '',
    street_address: '',
    landmark: '', // علامة مميزة
    order_notes: '',
    payment_method: 'cod', // 'cod' | 'credit_card' | 'wallet' | 'instapay'
  });

  // Advanced Searchable Governorate Dropdown State
  const [govDropdownOpen, setGovDropdownOpen] = useState(false);
  const [govSearch, setGovSearch] = useState('');
  const govDropdownRef = useRef(null);

  // Check URL hash or query to jump directly to Step 2 if user clicked Checkout in drawer
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hash === '#checkout-section' || searchParams?.get('step') === '2') {
        setCurrentStep(2);
      }
    }
  }, [searchParams]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (govDropdownRef.current && !govDropdownRef.current.contains(e.target)) {
        setGovDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currencyLabel = isRtl ? 'ج.م' : 'EGP';
  const items = cart?.items || [];
  const itemsCount = cart?.items_count || 0;
  const subtotal = Number(cart?.subtotal || 0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectGovernorate = (govName) => {
    setFormData((prev) => ({ ...prev, governorate: govName }));
    setGovDropdownOpen(false);
    setGovSearch('');
  };

  // Filter Governorates
  const filteredGovs = EGYPT_GOVERNORATES.filter((gov) => {
    if (!govSearch.trim()) return true;
    const q = govSearch.toLowerCase().trim();
    return gov.ar.includes(q) || gov.en.toLowerCase().includes(q);
  });

  // Proceed to Step 2
  const handleProceedToStep2 = () => {
    if (items.length === 0) {
      toast?.error?.(isRtl ? 'سلة المشتريات فارغة' : 'Cart is empty');
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Submit Order in Step 2
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customer_name.trim()) {
      toast?.error?.(isRtl ? 'يرجى إدخال اسم المستلم' : 'Please enter recipient name');
      return;
    }
    if (!formData.customer_phone.trim()) {
      toast?.error?.(isRtl ? 'يرجى إدخال رقم الهاتف للتواصل' : 'Please enter phone number');
      return;
    }
    if (!formData.city.trim()) {
      toast?.error?.(isRtl ? 'يرجى إدخال المدينة أو المنطقة' : 'Please enter city/area');
      return;
    }
    if (!formData.street_address.trim()) {
      toast?.error?.(isRtl ? 'يرجى إدخال العنوان التفصيلي' : 'Please enter street address');
      return;
    }
    if (items.length === 0) {
      toast?.error?.(isRtl ? 'سلة المشتريات فارغة' : 'Your cart is empty');
      return;
    }

    setCheckoutSubmitting(true);
    try {
      const apiHost = getApiHost();
      const checkoutItems = items.map((it) => ({
        item_type: it.item_type || 'product',
        product_id: it.product_id || null,
        bundle_id: it.bundle_id || null,
        quantity: it.quantity,
      }));

      // Combine address and landmark
      const finalStreetAddress = formData.landmark.trim()
        ? `${formData.street_address.trim()} (علامة مميزة: ${formData.landmark.trim()})`
        : formData.street_address.trim();

      const finalNotes = formData.landmark.trim()
        ? `[علامة مميزة: ${formData.landmark.trim()}] ${formData.order_notes || ''}`.trim()
        : formData.order_notes;

      const res = await fetch(`${apiHost}/api/v1/orders/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: formData.customer_name,
          customer_phone: formData.customer_phone,
          customer_phone_2: formData.customer_phone_2,
          customer_email: formData.customer_email,
          governorate: formData.governorate,
          city: formData.city,
          street_address: formData.street_address.trim(),
          landmark: formData.landmark.trim(),
          order_notes: formData.order_notes,
          locale: lang,
          payment_method: formData.payment_method || 'cod',
          cart_items: checkoutItems,
        }),
      });

      const resJson = await res.json();
      if (res.ok && resJson.success && resJson.data) {
        const orderData = resJson.data;
        const orderNum = orderData.order_number || orderData.id;
        await clearCart();
        toast?.success?.(
          isRtl
            ? 'تم تأكيد طلبك بنجاح! جاري تحويلك لصفحة تفاصيل الطلب...'
            : 'Order placed successfully! Redirecting...'
        );
        router.push(formatLangHref(`/order-status?order_number=${encodeURIComponent(orderNum)}&status=success`, lang));
      } else {
        toast?.error?.(resJson.message || (isRtl ? 'تعذر إتمام الطلب، يرجى مراجعة البيانات' : 'Checkout failed'));
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast?.error?.(isRtl ? 'حدث خطأ أثناء إتمام الطلب. يرجى المحاولة لاحقاً' : 'Checkout connection error');
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  return (
    <div className="cart-page-wrapper" dir={isRtl ? 'rtl' : 'ltr'}>
      <Navbar lang={lang} onToggleLang={setLang} />

      <main className="cart-main-container">
        {/* ================= Breadcrumb ================= */}
        <nav className="cart-breadcrumbs" aria-label="Breadcrumb">
          <Link href={formatLangHref('/', lang)} className="crumb-link">
            <FaHouse className="crumb-icon" />
            <span>{isRtl ? 'الرئيسية' : 'Home'}</span>
          </Link>
          {isRtl ? <FaChevronLeft className="crumb-sep" /> : <FaChevronRight className="crumb-sep" />}
          <span className="crumb-active">
            {currentStep === 1
              ? (isRtl ? 'سلة المشتريات (الخطوة 1)' : 'Shopping Cart (Step 1)')
              : (isRtl ? 'بيانات الشحن والتوصيل (الخطوة 2)' : 'Shipping & Payment (Step 2)')}
          </span>
        </nav>

        {/* ================= SUCCESS STATE ================= */}
        {completedOrder ? (
          <div className="order-success-stage">
            <div className="success-icon-badge">
              <FaCircleCheck />
            </div>
            <h2>{isRtl ? 'تم تسجيل وتأكيد طلبكم بنجاح!' : 'Order Placed Successfully!'}</h2>
            <div className="order-number-pill">
              <span>{isRtl ? 'رقم الطلب:' : 'Order Number:'}</span>
              <strong>#{completedOrder.order_number || completedOrder.id}</strong>
            </div>

            <div className="order-payment-method-pill">
              <span>{isRtl ? 'طريقة الدفع المختارة:' : 'Payment Method:'}</span>
              <strong>
                {formData.payment_method === 'cod'
                  ? (isRtl ? 'الدفع عند الاستلام' : 'Cash on Delivery')
                  : formData.payment_method === 'credit_card'
                  ? (isRtl ? 'فيزا / بطاقة بنكية' : 'Credit / Debit Card')
                  : formData.payment_method === 'wallet'
                  ? (isRtl ? 'محفظة إلكترونية' : 'E-Wallet')
                  : (isRtl ? 'إنستاباي (InstaPay)' : 'InstaPay')}
              </strong>
            </div>

            <p className="success-note">
              {isRtl
                ? 'شكراً لتسوقكم من ترندلاين تك. تم حفظ طلبكم بنجاح وجاري مراجعته من قبل مسؤولي العمليات.'
                : 'Thank you for shopping with Trendline Tech. Your order has been placed and is being processed.'}
            </p>

            {/* Prominent Shipping Notice Reminder */}
            <div className="success-shipping-card">
              <div className="card-head">
                <FaTruckFast className="truck-icon" />
                <strong>{isRtl ? 'ملاحظة هامة بخصوص مصاريف الشحن' : 'Important Shipping Fee Notice'}</strong>
              </div>
              <p className="card-main">
                {isRtl
                  ? 'تكلفة الشحن تُحدد بناءً على المنطقة وحجم الطرد أو الطلب.'
                  : 'Shipping cost is determined based on the destination area and parcel size/weight.'}
              </p>
              <p className="card-sub">
                {isRtl
                  ? '(سيتم التواصل معكم هاتفياً على الرقم المسجل لإبلاغكم بقيمة الشحن بعد تحديد وزن الطلب وعنوان التوصيل)'
                  : '(We will contact you via phone to inform you of the exact shipping fee after determining parcel weight and delivery address)'}
              </p>
            </div>

            <div className="success-actions">
              <Link href={formatLangHref('/categories', lang)} className="btn-continue-shopping">
                <span>{isRtl ? 'متابعة التسوق واستعراض الأجهزة' : 'Continue Shopping'}</span>
                {isRtl ? <FaArrowLeft size={13} /> : <FaArrowRight size={13} />}
              </Link>
            </div>
          </div>
        ) : items.length === 0 ? (
          /* ================= EMPTY CART SCREEN ================= */
          <div className="cart-page-empty">
            <div className="empty-cart-graphic">
              <FaBagShopping />
            </div>
            <h2>{isRtl ? 'سلة المشتريات فارغة حالياً' : 'Your Shopping Cart is Empty'}</h2>
            <p>
              {isRtl
                ? 'لم تقم بإضافة أي منتجات إلى سلة المشتريات حتى الآن. استكشف أقسام المتجر من أحدث أجهزة الشبكات، الخوادم، وأنظمة الأمان الذكية.'
                : 'You have not added any items to your cart yet. Explore our network gear, servers, and smart security products.'}
            </p>
            <Link href={formatLangHref('/categories', lang)} className="btn-explore-catalog">
              <span>{isRtl ? 'استعراض أقسام المنتجات' : 'Browse Categories'}</span>
              {isRtl ? <FaArrowLeft size={13} /> : <FaArrowRight size={13} />}
            </Link>
          </div>
        ) : (
          /* ================= ACTIVE CHECKOUT FLOW ================= */
          <div className="checkout-stepper-wrapper">
            {/* 2-Step Modern Flow Indicator */}
            <div className="checkout-steps-bar">
              <div
                className={`step-bubble ${currentStep === 1 ? 'active' : 'completed'}`}
                onClick={() => setCurrentStep(1)}
                role="button"
                tabIndex={0}
              >
                <div className="bubble-circle">
                  {currentStep > 1 ? <FaCircleCheck /> : <span>1</span>}
                </div>
                <div className="bubble-text">
                  <strong>{isRtl ? 'الخطوة الأولى' : 'Step 1'}</strong>
                  <span>{isRtl ? 'سلة المشتريات والمنتجات' : 'Cart Review'}</span>
                </div>
              </div>

              <div className={`step-connector ${currentStep >= 2 ? 'active' : ''}`} />

              <div
                className={`step-bubble ${currentStep === 2 ? 'active' : ''}`}
                onClick={handleProceedToStep2}
                role="button"
                tabIndex={0}
              >
                <div className="bubble-circle">
                  <span>2</span>
                </div>
                <div className="bubble-text">
                  <strong>{isRtl ? 'الخطوة الثانية' : 'Step 2'}</strong>
                  <span>{isRtl ? 'بيانات الشحن وطريقة الدفع' : 'Shipping & Payment'}</span>
                </div>
              </div>
            </div>

            <div className="cart-content-grid">
              {/* ================= STEP 1: CART ITEMS ================= */}
              {currentStep === 1 && (
                <div className="cart-table-column">
                  <div className="cart-box-header">
                    <div className="title-row">
                      <FaCartShopping className="cart-header-icon" />
                      <h2>{isRtl ? 'مراجعة منتجات السلة' : 'Review Cart Items'}</h2>
                      <span className="count-pill">
                        {itemsCount} {isRtl ? 'منتجات' : 'items'}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="btn-clear-cart"
                      onClick={clearCart}
                      title={isRtl ? 'إفراغ السلة بالكامل' : 'Clear entire cart'}
                    >
                      <FaTrashCan size={12} />
                      <span>{isRtl ? 'إفراغ السلة' : 'Clear Cart'}</span>
                    </button>
                  </div>

                  {/* Items List */}
                  <div className="cart-items-wrapper">
                    {items.map((item) => {
                      const title = isRtl
                        ? item.name_ar || item.name_en || 'منتج ترندلاين'
                        : item.name_en || item.name_ar || 'Trendline Product';
                      const isMutating = mutatingItemId === item.id;
                      const itemUrl = `/pd/${encodeURIComponent(item.product_id || item.bundle_id || '')}/${encodeURIComponent(item.slug || '')}`;

                      return (
                        <article
                          key={item.id}
                          className={`cart-row-item ${isMutating ? 'is-loading' : ''}`}
                        >
                          <Link href={itemUrl} className="row-thumb-link">
                            <img
                              src={item.image || '/assets/placeholder-tech.png'}
                              alt={title}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = '/assets/placeholder-tech.png';
                              }}
                            />
                          </Link>

                          <div className="row-info-col">
                            <div className="row-meta">
                              {item.brand && <span className="meta-brand">{item.brand}</span>}
                              {item.sku && <span className="meta-sku">{item.sku}</span>}
                            </div>

                            <Link href={itemUrl} className="row-title" title={title}>
                              {title}
                            </Link>

                            <div className="row-unit-price">
                              <span className="unit-label">{isRtl ? 'سعر الوحدة:' : 'Unit price:'}</span>
                              <strong>
                                {Number(item.unit_price).toLocaleString()} {currencyLabel}
                              </strong>
                              {item.original_price > item.unit_price && (
                                <span className="unit-orig-price">
                                  {Number(item.original_price).toLocaleString()} {currencyLabel}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Stepper */}
                          <div className="row-stepper-col">
                            <div className="stepper-box">
                              <button
                                type="button"
                                disabled={isMutating}
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                aria-label="Decrease quantity"
                              >
                                {item.quantity === 1 ? <FaTrashCan size={11} /> : <FaMinus size={10} />}
                              </button>
                              <span className="stepper-val">{item.quantity}</span>
                              <button
                                type="button"
                                disabled={isMutating || (item.max_stock && item.quantity >= item.max_stock)}
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                aria-label="Increase quantity"
                              >
                                <FaPlus size={10} />
                              </button>
                            </div>
                          </div>

                          {/* Line Total & Remove */}
                          <div className="row-total-col">
                            <div className="line-total-price">
                              {Number(item.line_total).toLocaleString()} <span>{currencyLabel}</span>
                            </div>

                            <button
                              type="button"
                              className="btn-delete-row"
                              disabled={isMutating}
                              onClick={() => removeFromCart(item.id)}
                              title={isRtl ? 'حذف من السلة' : 'Remove item'}
                            >
                              <FaTrashCan size={13} />
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {/* Button to proceed to Step 2 */}
                  <div className="step1-cta-box">
                    <button
                      type="button"
                      className="btn-proceed-step2"
                      onClick={handleProceedToStep2}
                    >
                      <span>{isRtl ? 'المتابعة لبيانات الشحن والتوصيل (الخطوة 2)' : 'Proceed to Shipping & Delivery (Step 2)'}</span>
                      {isRtl ? <FaArrowLeft size={14} /> : <FaArrowRight size={14} />}
                    </button>
                  </div>
                </div>
              )}

              {/* ================= STEP 2: SHIPPING DETAILS & PAYMENT ================= */}
              {currentStep === 2 && (
                <div className="cart-table-column">
                  <div className="cart-checkout-form-box">
                    {/* Header */}
                    <div className="form-head">
                      <div className="head-icon">
                        <FaLocationDot />
                      </div>
                      <div>
                        <h3>{isRtl ? 'بيانات الشحن والتوصيل' : 'Delivery & Shipping Details'}</h3>
                        <p>
                          {isRtl
                            ? 'يرجى ملء البيانات بدقة لسرعة التوصيل والتواصل لتأكيد مصاريف الشحن'
                            : 'Please provide accurate details for fast delivery and shipping coordination'}
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleCheckoutSubmit} className="checkout-inputs-grid">
                      {/* Full Name */}
                      <div className="field-group full-width">
                        <label htmlFor="customer_name">
                          {isRtl ? 'الاسم بالكامل *' : 'Full Name *'}
                        </label>
                        <div className="input-wrap">
                          <FaUser className="f-icon" />
                          <input
                            id="customer_name"
                            name="customer_name"
                            type="text"
                            required
                            placeholder={isRtl ? 'مثال: محمد أحمد علي' : 'e.g. John Doe'}
                            value={formData.customer_name}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      {/* Primary Phone */}
                      <div className="field-group">
                        <label htmlFor="customer_phone">
                          {isRtl ? 'رقم الهاتف للتواصل *' : 'Contact Phone Number *'}
                        </label>
                        <div className="input-wrap">
                          <FaPhone className="f-icon" />
                          <input
                            id="customer_phone"
                            name="customer_phone"
                            type="tel"
                            required
                            placeholder={isRtl ? '010XXXXXXXX' : '+20 10...'}
                            value={formData.customer_phone}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      {/* Secondary Phone */}
                      <div className="field-group">
                        <label htmlFor="customer_phone_2">
                          {isRtl ? 'رقم هاتف بديل (اختياري)' : 'Secondary Phone (Optional)'}
                        </label>
                        <div className="input-wrap">
                          <FaPhone className="f-icon" />
                          <input
                            id="customer_phone_2"
                            name="customer_phone_2"
                            type="tel"
                            placeholder={isRtl ? '01XXXXXXXXX' : '+20 11...'}
                            value={formData.customer_phone_2}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      {/* ================= ADVANCED SEARCHABLE GOVERNORATE SELECTOR ================= */}
                      <div className="field-group" ref={govDropdownRef}>
                        <label htmlFor="gov-selector-btn">
                          {isRtl ? 'المحافظة *' : 'Governorate *'}
                        </label>
                        <div className="gov-custom-dropdown">
                          <button
                            id="gov-selector-btn"
                            type="button"
                            className={`gov-selected-display ${govDropdownOpen ? 'is-active' : ''}`}
                            onClick={() => setGovDropdownOpen(!govDropdownOpen)}
                          >
                            <div className="gov-text-left">
                              <FaCity className="f-icon-gov" />
                              <span className="gov-current-val">{formData.governorate}</span>
                            </div>
                            <FaChevronDown className={`arrow-indicator ${govDropdownOpen ? 'open' : ''}`} size={12} />
                          </button>

                          {govDropdownOpen && (
                            <div className="gov-dropdown-popover">
                              {/* Search Input inside Dropdown */}
                              <div className="gov-search-wrap">
                                <FaMagnifyingGlass className="search-ico" size={12} />
                                <input
                                  type="text"
                                  autoFocus
                                  placeholder={isRtl ? 'ابحث عن المحافظة...' : 'Search governorate...'}
                                  value={govSearch}
                                  onChange={(e) => setGovSearch(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                {govSearch && (
                                  <button
                                    type="button"
                                    className="clear-gov-btn"
                                    onClick={() => setGovSearch('')}
                                  >
                                    <FaXmark size={11} />
                                  </button>
                                )}
                              </div>

                              {/* Options List */}
                              <div className="gov-options-scroll">
                                {filteredGovs.length === 0 ? (
                                  <div className="gov-no-results">
                                    {isRtl ? 'لا توجد محافظة مطابقة' : 'No matching governorate'}
                                  </div>
                                ) : (
                                  filteredGovs.map((gov) => {
                                    const isSelected = formData.governorate === gov.ar;
                                    return (
                                      <div
                                        key={gov.en}
                                        className={`gov-option-row ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleSelectGovernorate(gov.ar)}
                                      >
                                        <span>{isRtl ? gov.ar : gov.en}</span>
                                        {isSelected && <FaCircleCheck className="check-ico" size={13} />}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* City / Area */}
                      <div className="field-group">
                        <label htmlFor="city">
                          {isRtl ? 'المدينة / المنطقة *' : 'City / Area *'}
                        </label>
                        <div className="input-wrap">
                          <FaCity className="f-icon" />
                          <input
                            id="city"
                            name="city"
                            type="text"
                            required
                            placeholder={isRtl ? 'مثال: مدينة نصر / سموحة' : 'e.g. Nasr City'}
                            value={formData.city}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      {/* Street Address */}
                      <div className="field-group full-width">
                        <label htmlFor="street_address">
                          {isRtl ? 'العنوان التفصيلي (الشارع، رقم العمارة، الشقة) *' : 'Detailed Street Address *'}
                        </label>
                        <div className="input-wrap">
                          <FaLocationDot className="f-icon" />
                          <input
                            id="street_address"
                            name="street_address"
                            type="text"
                            required
                            placeholder={isRtl ? 'مثال: 15 شارع عباس العقاد، الدور الرابع، شقة 8' : 'Street name, building number, floor'}
                            value={formData.street_address}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      {/* ================= USER REQUESTED FIELD: علامة مميزة ================= */}
                      <div className="field-group full-width">
                        <label htmlFor="landmark">
                          {isRtl ? 'علامة مميزة (أسم أقرب معلم: اسم محل, صيدلية..) *' : 'Nearby Landmark (Shop, Pharmacy, Mosque..) *'}
                        </label>
                        <div className="input-wrap">
                          <FaLandmark className="f-icon landmark-icon" />
                          <input
                            id="landmark"
                            name="landmark"
                            type="text"
                            required
                            placeholder={isRtl ? 'مثال: بجوار صيدلية العزبي، أمام مسجد النور، بجانب سوبرماركت سعودي' : 'e.g. Next to El-Ezaby Pharmacy, opposite Central Bank'}
                            value={formData.landmark}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      {/* Order Notes */}
                      <div className="field-group full-width">
                        <label htmlFor="order_notes">
                          {isRtl ? 'ملاحظات إضافية للطلب (اختياري)' : 'Order Notes (Optional)'}
                        </label>
                        <div className="input-wrap textarea-wrap">
                          <FaNoteSticky className="f-icon top" />
                          <textarea
                            id="order_notes"
                            name="order_notes"
                            rows={2}
                            placeholder={isRtl ? 'أي تعليمات إضافية بخصوص مواعيد الاستلام أو تفاصيل خاصة...' : 'Special delivery instructions...'}
                            value={formData.order_notes}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      {/* ================= ADVANCED PAYMENT METHOD SELECTOR ================= */}
                      <div className="field-group full-width payment-methods-container">
                        <label className="payment-section-title">
                          {isRtl ? 'طريقة الدفع *' : 'Payment Method *'}
                        </label>

                        <div className="payment-options-grid">
                          {/* Option 1: الدفع عند الاستلام (الأساسي) */}
                          <div
                            className={`payment-method-card ${formData.payment_method === 'cod' ? 'selected' : ''}`}
                            onClick={() => setFormData((prev) => ({ ...prev, payment_method: 'cod' }))}
                          >
                            <div className="pmc-radio">
                              {formData.payment_method === 'cod' ? <FaCircleDot className="radio-active" /> : <FaCircle className="radio-inactive" />}
                            </div>
                            <div className="pmc-icon-badge cod-badge">
                              <FaMoneyBillWave />
                            </div>
                            <div className="pmc-content">
                              <div className="pmc-title-row">
                                <strong>{isRtl ? 'الدفع عند الاستلام' : 'Cash on Delivery (COD)'}</strong>
                                <span className="primary-pill">{isRtl ? 'الأساسي والأكثر أماناً' : 'Primary & Most Popular'}</span>
                              </div>
                              <p>
                                {isRtl
                                  ? 'عاين طلبك وافحصه أولاً عند باب بيتك، ثم ادفع نقداً أو بالفيزا لمندوب الشحن.'
                                  : 'Inspect your order upon delivery, then pay cash or card to the courier.'}
                              </p>
                            </div>
                          </div>

                          {/* Option 2: فيزا / ماستركارد */}
                          <div
                            className={`payment-method-card ${formData.payment_method === 'credit_card' ? 'selected' : ''}`}
                            onClick={() => setFormData((prev) => ({ ...prev, payment_method: 'credit_card' }))}
                          >
                            <div className="pmc-radio">
                              {formData.payment_method === 'credit_card' ? <FaCircleDot className="radio-active" /> : <FaCircle className="radio-inactive" />}
                            </div>
                            <div className="pmc-icon-badge card-badge">
                              <FaCreditCard />
                            </div>
                            <div className="pmc-content">
                              <div className="pmc-title-row">
                                <strong>{isRtl ? 'بطاقة بنكية (فيزا / ماستركارد)' : 'Credit / Debit Card (Visa / Mastercard)'}</strong>
                              </div>
                              <p>
                                {isRtl
                                  ? 'دفع إلكتروني آمن ومشفر 100%، أو الدفع ببطاقتك الائتمانية مع مندوب التوصيل.'
                                  : 'Secure encrypted card payment online or via POS device with the courier.'}
                              </p>
                            </div>
                          </div>

                          {/* Option 3: محفظة إلكترونية */}
                          <div
                            className={`payment-method-card ${formData.payment_method === 'wallet' ? 'selected' : ''}`}
                            onClick={() => setFormData((prev) => ({ ...prev, payment_method: 'wallet' }))}
                          >
                            <div className="pmc-radio">
                              {formData.payment_method === 'wallet' ? <FaCircleDot className="radio-active" /> : <FaCircle className="radio-inactive" />}
                            </div>
                            <div className="pmc-icon-badge wallet-badge">
                              <FaWallet />
                            </div>
                            <div className="pmc-content">
                              <div className="pmc-title-row">
                                <strong>{isRtl ? 'محفظة إلكترونية' : 'E-Wallet'}</strong>
                                <span className="wallets-logos-text">{isRtl ? 'فودافون كاش، أورنج، اتصالات، وي' : 'Vodafone, Orange, Etisalat, WE'}</span>
                              </div>
                              <p>
                                {isRtl
                                  ? 'تحويل مباشر من محفظتك الذكية مع تأكيد فوري للطلب فور إتمام العملية.'
                                  : 'Instant transfer from your smart mobile wallet with instant receipt.'}
                              </p>
                            </div>
                          </div>

                          {/* Option 4: إنستاباي */}
                          <div
                            className={`payment-method-card ${formData.payment_method === 'instapay' ? 'selected' : ''}`}
                            onClick={() => setFormData((prev) => ({ ...prev, payment_method: 'instapay' }))}
                          >
                            <div className="pmc-radio">
                              {formData.payment_method === 'instapay' ? <FaCircleDot className="radio-active" /> : <FaCircle className="radio-inactive" />}
                            </div>
                            <div className="pmc-icon-badge instapay-badge">
                              <FaBolt />
                            </div>
                            <div className="pmc-content">
                              <div className="pmc-title-row">
                                <strong>{isRtl ? 'إنستاباي (InstaPay)' : 'InstaPay'}</strong>
                                <span className="instant-pill">{isRtl ? 'تحويل لحظي فوري' : 'Instant Transfer'}</span>
                              </div>
                              <p>
                                {isRtl
                                  ? 'الدفع المباشر عبر تطبيق إنستاباي للشبكة القومية للتحويلات اللحظية.'
                                  : 'Instant direct payment via InstaPay national payments network.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Submit & Back Controls */}
                      <div className="form-submit-row step2-actions-row">
                        <button
                          type="button"
                          className="btn-back-to-step1"
                          onClick={() => {
                            setCurrentStep(1);
                            window.scrollTo({ top: 120, behavior: 'smooth' });
                          }}
                        >
                          {isRtl ? <FaArrowRight size={13} /> : <FaArrowLeft size={13} />}
                          <span>{isRtl ? 'الرجوع لتعديل المنتجات' : 'Back to Cart'}</span>
                        </button>

                        <button
                          type="submit"
                          disabled={checkoutSubmitting}
                          className="btn-confirm-order-main"
                        >
                          <FaCircleCheck />
                          <span>
                            {checkoutSubmitting
                              ? (isRtl ? 'جاري تسجيل الطلب...' : 'Placing Order...')
                              : (isRtl ? 'تأكيد وإرسال الطلب الآن' : 'Confirm & Place Order')}
                          </span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* ================= Right Column: Sticky Summary & Shipping Notice ================= */}
              <aside className="cart-summary-sidebar">
                <div className="summary-sticky-card">
                  <h3 className="summary-title">{isRtl ? 'تفاصيل وملخص الطلب' : 'Order Summary'}</h3>

                  {/* Subtotal */}
                  <div className="summary-row">
                    <span>{isRtl ? 'المجموع الفرعي للمنتجات' : 'Products Subtotal'}</span>
                    <strong>
                      {subtotal.toLocaleString()} {currencyLabel}
                    </strong>
                  </div>

                  <div className="summary-row">
                    <span>{isRtl ? 'عدد القطع الإجمالي' : 'Total Items Count'}</span>
                    <span>{itemsCount}</span>
                  </div>

                  {/* =========================================================
                      USER SPECIFIED SHIPPING NOTICE (EXACT REQUIREMENT)
                      ========================================================= */}
                  <div className="shipping-notice-banner">
                    <div className="notice-badge">
                      <FaTruckFast className="truck-icon" />
                      <h4>{isRtl ? 'مصاريف الشحن' : 'Shipping Cost'}</h4>
                    </div>
                    <p className="notice-lead">
                      {isRtl
                        ? 'تكلفة الشحن تُحدد بناءً على المنطقة وحجم الطرد أو الطلب.'
                        : 'Shipping cost is determined based on the destination area and parcel size/weight.'}
                    </p>
                    <p className="notice-detail">
                      {isRtl
                        ? '(سيتم التواصل معكم لإبلاغكم بقيمة الشحن بعد تحديد وزن الطلب وعنوان التوصيل)'
                        : '(We will contact you to inform you of the exact shipping fee after determining the parcel weight and delivery address)'}
                    </p>
                  </div>

                  {/* Total Line */}
                  <div className="summary-total-box">
                    <div className="total-title">
                      <span>{isRtl ? 'إجمالي المنتجات' : 'Products Total'}</span>
                      <small>{isRtl ? '(غير شامل مصاريف الشحن)' : '(Excludes Shipping Fee)'}</small>
                    </div>
                    <div className="total-number">
                      {subtotal.toLocaleString()} <span>{currencyLabel}</span>
                    </div>
                  </div>

                  {/* Trust Points */}
                  <div className="summary-trust-points">
                    <div className="trust-item">
                      <FaShieldHalved className="t-icon" />
                      <span>{isRtl ? 'ضمان رسمي معتمد على جميع المنتجات' : 'Official Warranty on all devices'}</span>
                    </div>
                    <div className="trust-item">
                      <FaCircleCheck className="t-icon" />
                      <span>{isRtl ? 'معاينة وفحص الطلب قبل الاستلام' : 'Inspect upon receipt'}</span>
                    </div>
                    <div className="trust-item">
                      <FaClock className="t-icon" />
                      <span>{isRtl ? 'تأكيد فوري للشحن والتوصيل' : 'Prompt delivery coordination'}</span>
                    </div>
                  </div>

                  {/* Action in Step 1 vs Step 2 */}
                  {currentStep === 1 ? (
                    <button
                      type="button"
                      onClick={handleProceedToStep2}
                      className="btn-jump-checkout"
                    >
                      <FaCircleCheck />
                      <span>{isRtl ? 'المتابعة لبيانات الشحن والدفع (الخطوة 2)' : 'Proceed to Checkout (Step 2)'}</span>
                    </button>
                  ) : (
                    <div className="summary-step2-status-pill">
                      <FaCircleCheck />
                      <span>{isRtl ? 'أنت في خطوة تأكيد الشحن والدفع' : 'Shipping & Payment Step'}</span>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </div>
        )}
      </main>

      <Footer lang={lang} />
    </div>
  );
}

export default function CartPage() {
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
          جاري تحميل سلة المشتريات...
        </div>
      }
    >
      <CartPageContent />
    </Suspense>
  );
}
