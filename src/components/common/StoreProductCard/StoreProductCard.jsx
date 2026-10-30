'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { FaShareNodes, FaArrowLeft, FaChevronRight, FaStar } from 'react-icons/fa6';
import './StoreProductCard.scss';

export default function StoreProductCard({
  product = {},
  lang = 'ar',
  isPreview = false,
  className = '',
  onShareClick,
}) {
  const isRtl = lang === 'ar';
  const currencyLabel = isRtl ? 'ج.م' : 'EGP';

  // Extract all available valid images from product data
  const imagesList = useMemo(() => {
    const list = [];

    // 1. Process images array (could be objects with image_url/previewUrl/uploadedUrl or strings)
    if (Array.isArray(product?.images) && product.images.length > 0) {
      product.images.forEach((img) => {
        let url = '';
        if (typeof img === 'string') {
          url = img;
        } else if (img && typeof img === 'object') {
          url = img.image_url || img.previewUrl || img.uploadedUrl || img.url || '';
        }
        if (url && !list.includes(url)) {
          if (img?.is_primary) {
            list.unshift(url);
          } else {
            list.push(url);
          }
        }
      });
    }

    // 2. Check primary_image or coverMedia
    if (product?.primary_image && !list.includes(product.primary_image)) {
      list.unshift(product.primary_image);
    }
    if (product?.coverImage && !list.includes(product.coverImage)) {
      list.unshift(product.coverImage);
    }

    return list.filter((u) => u && typeof u === 'string' && u.trim().length > 0);
  }, [product]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const primaryImg = imagesList[0] || '/assets/placeholder-tech.png';
  const secondaryImg = imagesList.length > 1 ? imagesList[1] : null;

  // Pricing & Discounts
  const salePrice = Number(product.sale_price || product.original_price || 0);
  const origPrice = Number(product.original_price || 0);
  const hasDiscount = salePrice > 0 && origPrice > salePrice;
  const discountPct =
    product.discount_percent ||
    (hasDiscount ? Math.round(((origPrice - salePrice) / origPrice) * 100) : 0);

  // Stock
  const stockQty = Number(product.stock_quantity ?? 10);
  const reservedQty = Number(product.reserved_stock ?? 0);
  const availStock = Math.max(0, stockQty - reservedQty);
  const inStock = availStock > 0;

  // Localized Info
  const prodName = isRtl
    ? (product.name_ar || product.name_en || product.name || (isPreview ? 'اسم المنتج النموذجي' : 'منتج ترند لاين'))
    : (product.name_en || product.name_ar || product.name || (isPreview ? 'Product Title Preview' : 'Trendline Product'));

  const prodBrand = isRtl
    ? (product.brand?.name_ar || product.brand?.name_en || product.brand_name || 'ترند لاين')
    : (product.brand?.name_en || product.brand?.name_ar || product.brand_name || 'TRENDLINE');

  const shortDesc = isRtl
    ? (product.short_desc_ar || product.description_ar || '')
    : (product.short_desc_en || product.description_en || product.short_desc_ar || product.description_ar || '');

  const prodUrl = isPreview
    ? '#'
    : `/pd/${encodeURIComponent(product.id || '')}/${encodeURIComponent(product.slug || product.id || '')}`;

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onShareClick) {
      onShareClick(e, product);
      return;
    }
    if (typeof window !== 'undefined' && product.id && !isPreview) {
      const shortUrl = `${window.location.origin}/pd/${encodeURIComponent(product.id)}`;
      navigator.clipboard?.writeText?.(shortUrl);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (imagesList.length > 1) {
      setActiveIdx(1);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setActiveIdx(0);
  };

  const displayedImg = imagesList[activeIdx] || primaryImg;

  return (
    <article
      className={`store-prod-card ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Media Stage with Hover Image Switch */}
      <div className="sp-media">
        {/* Floating Badges (Discount & Featured) */}
        <div className="sp-badges">
          {discountPct > 0 && (
            <span className="badge-sale">
              {isRtl ? `خصم ${discountPct}%` : `${discountPct}% OFF`}
            </span>
          )}
          {product.is_featured && (
            <span className="badge-featured">
              <FaStar size={10} />
              <span>{isRtl ? 'مميز' : 'Featured'}</span>
            </span>
          )}
          {product._recBadge && (
            <span className={`badge-rec-type ${product._recType || 'similar'}`}>
              {product._recBadge}
            </span>
          )}
        </div>

        {/* Floating Stock Indicator */}
        <div className="sp-stock-floating">
          {inStock ? (
            <span className="badge-stock">
              {isRtl ? `متوفر (${availStock})` : `In Stock (${availStock})`}
            </span>
          ) : (
            <span className="badge-out">
              {isRtl ? 'نفد المخزون' : 'Out of Stock'}
            </span>
          )}
        </div>

        {/* Floating Quick Share Button */}
        <button
          type="button"
          className="sp-quick-share"
          title={isRtl ? 'نسخ الرابط القصير للمنتج (/pd/:id)' : 'Copy short link (/pd/:id)'}
          onClick={handleShare}
        >
          <FaShareNodes size={13} />
        </button>

        {/* Image Display with Smooth Crossfade on Hover */}
        <Link
          href={prodUrl}
          className="sp-img-link"
          onClick={isPreview ? (e) => e.preventDefault() : undefined}
        >
          {/* Primary Main Image */}
          <img
            src={displayedImg}
            alt={prodName}
            className={`sp-img sp-img-main ${isHovered && secondaryImg ? 'is-secondary' : ''}`}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/assets/placeholder-tech.png';
            }}
          />

          {/* Secondary Hover Image (Preloaded for instant smooth crossfade) */}
          {secondaryImg && activeIdx === 0 && (
            <img
              src={secondaryImg}
              alt={`${prodName} alternate`}
              className="sp-img sp-img-hover"
              aria-hidden="true"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
        </Link>

        {/* Multi-Image Interactive Indicator Dots (Visible on hover when product has 2+ images) */}
        {imagesList.length > 1 && (
          <div className="sp-gallery-dots" onClick={(e) => e.stopPropagation()}>
            {imagesList.slice(0, 5).map((imgUrl, i) => (
              <span
                key={imgUrl + i}
                role="button"
                tabIndex={0}
                className={`dot ${activeIdx === i ? 'active' : ''}`}
                onMouseEnter={() => setActiveIdx(i)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveIdx(i);
                }}
                aria-label={`Image ${i + 1}`}
              />
            ))}
            {imagesList.length > 5 && (
              <span className="dots-more">+{imagesList.length - 5}</span>
            )}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="sp-body">
        <div className="sp-meta">
          <span className="sp-brand">{prodBrand}</span>
          {product.sku && <span className="sp-sku">{product.sku}</span>}
        </div>

        <Link
          href={prodUrl}
          className="sp-title"
          title={prodName}
          onClick={isPreview ? (e) => e.preventDefault() : undefined}
        >
          {prodName}
        </Link>

        {shortDesc && (
          <p className="sp-desc" title={shortDesc}>
            {shortDesc}
          </p>
        )}

        <div className="sp-footer">
          <div className="sp-price-col">
            {hasDiscount && (
              <div className="old-p-row">
                <span className="old-p">
                  {origPrice.toLocaleString()} {currencyLabel}
                </span>
                <span className="save-tag">
                  {isRtl
                    ? `وفّر ${(origPrice - salePrice).toLocaleString()} ${currencyLabel}`
                    : `Save ${(origPrice - salePrice).toLocaleString()} ${currencyLabel}`}
                </span>
              </div>
            )}
            <div className="curr-p">
              {salePrice.toLocaleString()} <small>{currencyLabel}</small>
            </div>
          </div>

          <Link
            href={prodUrl}
            className="sp-view-btn"
            onClick={isPreview ? (e) => e.preventDefault() : undefined}
          >
            <span>{isRtl ? 'عرض المنتج' : 'View Product'}</span>
            {isRtl ? <FaArrowLeft size={11} /> : <FaChevronRight size={11} />}
          </Link>
        </div>
      </div>
    </article>
  );
}
