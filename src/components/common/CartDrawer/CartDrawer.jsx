'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/src/context/CartContext';
import { getInitialLang, formatLangHref } from '@/src/hooks/useTrendlineLang';
import {
  FaCartShopping,
  FaXmark,
  FaTrashCan,
  FaArrowLeft,
  FaArrowRight,
  FaTruckFast,
  FaPlus,
  FaMinus,
  FaBagShopping,
  FaCircleCheck,
} from 'react-icons/fa6';
import './CartDrawer.scss';

export default function CartDrawer() {
  const {
    cart,
    loading,
    mutatingItemId,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const [lang, setLang] = useState('ar');
  const isRtl = lang === 'ar';
  const currencyLabel = isRtl ? 'ج.م' : 'EGP';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setLang(getInitialLang() || 'ar');

    const handleSync = (e) => {
      setLang(e?.detail || getInitialLang() || 'ar');
    };
    window.addEventListener('trendline_lang_changed', handleSync);
    return () => window.removeEventListener('trendline_lang_changed', handleSync);
  }, []);

  // Lock background scroll when drawer is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, closeCart]);

  if (!isCartOpen) return null;

  const items = cart?.items || [];
  const itemsCount = cart?.items_count || 0;
  const subtotal = Number(cart?.subtotal || 0);

  return (
    <div
      className="cart-drawer-overlay"
      dir={isRtl ? 'rtl' : 'ltr'}
      onClick={closeCart}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="cart-drawer-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= Drawer Header ================= */}
        <div className="cart-drawer-header">
          <div className="header-title-box">
            <div className="header-icon-badge">
              <FaCartShopping />
            </div>
            <div>
              <h3>{isRtl ? 'سلة المشتريات' : 'Shopping Cart'}</h3>
              <span className="items-count-pill">
                {itemsCount}{' '}
                {isRtl
                  ? itemsCount === 1
                    ? 'منتج'
                    : itemsCount === 2
                    ? 'منتجان'
                    : itemsCount > 10
                    ? 'منتجاً'
                    : 'منتجات'
                  : itemsCount === 1
                  ? 'item'
                  : 'items'}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="drawer-close-btn"
            onClick={closeCart}
            aria-label={isRtl ? 'إغلاق السلة' : 'Close Cart'}
          >
            <FaXmark />
          </button>
        </div>

        {/* ================= Drawer Body ================= */}
        <div className="cart-drawer-body">
          {items.length === 0 ? (
            <div className="cart-empty-stage">
              <div className="empty-icon-wrapper">
                <FaBagShopping />
              </div>
              <h4>{isRtl ? 'سلة المشتريات فارغة حالياً' : 'Your cart is empty'}</h4>
              <p>
                {isRtl
                  ? 'لم تقم بإضافة أي منتجات إلى السلة بعد. تصفح أحدث الأجهزة وحلول الشبكات والأنظمة الذكية الآن.'
                  : 'You have not added any products to your cart yet. Explore our latest tech hardware, networking, and security solutions.'}
              </p>
              <Link
                href={formatLangHref('/categories', lang)}
                className="btn-browse-store"
                onClick={closeCart}
              >
                <span>{isRtl ? 'تصفح جميع الأقسام' : 'Browse Categories'}</span>
                {isRtl ? <FaArrowLeft size={13} /> : <FaArrowRight size={13} />}
              </Link>
            </div>
          ) : (
            <div className="cart-items-list">
              {items.map((item) => {
                const title = isRtl
                  ? item.name_ar || item.name_en || 'منتج ترندلاين'
                  : item.name_en || item.name_ar || 'Trendline Product';
                const isMutating = mutatingItemId === item.id;
                const itemUrl = `/pd/${encodeURIComponent(item.product_id || item.bundle_id || '')}/${encodeURIComponent(item.slug || '')}`;

                return (
                  <div
                    key={item.id}
                    className={`cart-drawer-item ${isMutating ? 'is-mutating' : ''}`}
                  >
                    {/* Item Image */}
                    <Link
                      href={itemUrl}
                      className="item-thumb-link"
                      onClick={closeCart}
                    >
                      <img
                        src={item.image || '/assets/placeholder-tech.png'}
                        alt={title}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/assets/placeholder-tech.png';
                        }}
                      />
                    </Link>

                    {/* Item Info */}
                    <div className="item-info-col">
                      {item.brand && <span className="item-brand">{item.brand}</span>}
                      <Link
                        href={itemUrl}
                        className="item-name"
                        title={title}
                        onClick={closeCart}
                      >
                        {title}
                      </Link>

                      <div className="item-price-row">
                        <span className="unit-price">
                          {Number(item.unit_price).toLocaleString()}{' '}
                          <small>{currencyLabel}</small>
                        </span>
                        {item.original_price > item.unit_price && (
                          <span className="orig-price">
                            {Number(item.original_price).toLocaleString()} {currencyLabel}
                          </span>
                        )}
                      </div>

                      {/* Quantity & Actions Bar */}
                      <div className="item-actions-row">
                        <div className="drawer-qty-stepper">
                          <button
                            type="button"
                            disabled={isMutating}
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            aria-label="Decrease quantity"
                          >
                            {item.quantity === 1 ? <FaTrashCan size={11} /> : <FaMinus size={10} />}
                          </button>
                          <span className="qty-val">{item.quantity}</span>
                          <button
                            type="button"
                            disabled={isMutating || (item.max_stock && item.quantity >= item.max_stock)}
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            aria-label="Increase quantity"
                          >
                            <FaPlus size={10} />
                          </button>
                        </div>

                        <div className="item-line-total">
                          <span>{isRtl ? 'الإجمالي:' : 'Total:'}</span>
                          <strong>
                            {Number(item.line_total).toLocaleString()} {currencyLabel}
                          </strong>
                        </div>

                        <button
                          type="button"
                          className="btn-remove-item"
                          disabled={isMutating}
                          onClick={() => removeFromCart(item.id)}
                          title={isRtl ? 'حذف من السلة' : 'Remove item'}
                        >
                          <FaTrashCan size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ================= Drawer Footer ================= */}
        {items.length > 0 && (
          <div className="cart-drawer-footer">
            {/* Shipping Notice Card (Requested Specifically by User) */}
            <div className="cart-shipping-notice">
              <div className="notice-head">
                <FaTruckFast className="truck-icon" />
                <strong>{isRtl ? 'مصاريف الشحن' : 'Shipping Fees'}</strong>
              </div>
              <p className="notice-main-text">
                {isRtl
                  ? 'تكلفة الشحن تُحدد بناءً على المنطقة وحجم الطرد أو الطلب.'
                  : 'Shipping cost is determined based on the destination area and parcel size/weight.'}
              </p>
              <p className="notice-sub-text">
                {isRtl
                  ? '(سيتم التواصل معكم لإبلاغكم بقيمة الشحن بعد تحديد وزن الطلب وعنوان التوصيل)'
                  : '(We will contact you to inform you of the exact shipping fee after determining the parcel weight and delivery address)'}
              </p>
            </div>

            {/* Subtotal Calculation */}
            <div className="cart-subtotal-bar">
              <div className="subtotal-label">
                <span>{isRtl ? 'المجموع الفرعي' : 'Subtotal'}</span>
                <small>
                  {isRtl
                    ? `(${itemsCount} ${itemsCount === 1 ? 'منتج' : 'منتجات'})`
                    : `(${itemsCount} items)`}
                </small>
              </div>
              <div className="subtotal-amount">
                {subtotal.toLocaleString()} <span>{currencyLabel}</span>
              </div>
            </div>

            {/* Drawer Action CTAs */}
            <div className="drawer-ctas-grid">
              <Link
                href={formatLangHref('/cart', lang)}
                className="btn-view-full-cart"
                onClick={closeCart}
              >
                <span>{isRtl ? 'عرض تفاصيل العربة والطلب' : 'View Full Cart & Details'}</span>
                {isRtl ? <FaArrowLeft size={12} /> : <FaArrowRight size={12} />}
              </Link>

              <Link
                href={`${formatLangHref('/cart', lang)}#checkout-section`}
                className="btn-checkout-direct"
                onClick={closeCart}
              >
                <FaCircleCheck size={14} />
                <span>{isRtl ? 'متابعة الشراء وإتمام الطلب' : 'Proceed to Checkout'}</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
