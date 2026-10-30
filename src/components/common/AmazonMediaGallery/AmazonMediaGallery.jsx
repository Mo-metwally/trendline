'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  FaChevronLeft,
  FaChevronRight,
  FaChevronUp,
  FaChevronDown,
  FaPlay,
  FaPause,
  FaMagnifyingGlassPlus,
  FaMagnifyingGlassMinus,
  FaRotateLeft,
  FaXmark,
  FaExpand,
  FaVolumeHigh,
  FaVolumeXmark,
} from 'react-icons/fa6';
import './AmazonMediaGallery.scss';

// Helper to detect and format embed URLs (YouTube, Vimeo, direct MP4)
function getEmbedVideoUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // YouTube match
  const ytMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`;
  }

  // Vimeo match
  const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  }

  return trimmed;
}

function isDirectVideo(url) {
  if (!url || typeof url !== 'string') return false;
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url.trim());
}

function getYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  return match ? match[1] : null;
}

function resolveVideoThumbnail(v, vUrl) {
  // 1. Explicit poster from video object (e.g. from admin upload with generated base64 webp screenshot)
  if (typeof v === 'object' && v !== null) {
    const candidate =
      v.poster_url ||
      v.posterUrl ||
      v.poster ||
      v.thumbnail ||
      v.thumb ||
      v.thumbnail_url ||
      v.previewUrl;
    if (candidate && typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  // 2. YouTube official HQ thumbnail
  const ytId = getYouTubeId(vUrl);
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }

  // 3. Vimeo thumbnail
  const vimeoMatch = (vUrl || '').match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://vumbnail.com/${vimeoMatch[1]}.jpg`;
  }

  return null;
}

export default function AmazonMediaGallery({
  product = {},
  discountPercent = 0,
  onOpenGlobalLightbox,
  lang = 'ar',
}) {
  const isRtl = lang === 'ar';
  // 1. Build Unified Media List (Images + Videos)
  const mediaList = useMemo(() => {
    const list = [];

    // Process Images
    if (Array.isArray(product?.images) && product.images.length > 0) {
      product.images.forEach((img, idx) => {
        const url = typeof img === 'string' ? img : img?.image_url;
        if (url) {
          list.push({
            id: `img-${img.id || idx}`,
            type: 'image',
            url: url,
            alt:
              (typeof img === 'object' && (img.alt_text_ar || img.alt_text_en)) ||
              product.name_ar ||
              product.name_en ||
              `صورة المنتج ${idx + 1}`,
          });
        }
      });
    }

    // Process Videos (from product.video_urls, product.video_url, or specifications)
    const rawVideos =
      product?.video_urls ||
      product?.video_url ||
      product?.specifications?.media_videos ||
      [];

    if (Array.isArray(rawVideos)) {
      rawVideos.forEach((v, idx) => {
        const vUrl = typeof v === 'string' ? v : v?.url;
        if (vUrl && typeof vUrl === 'string' && vUrl.trim()) {
          const videoPoster = resolveVideoThumbnail(v, vUrl.trim());
          list.push({
            id: `video-${idx}`,
            type: 'video',
            url: vUrl.trim(),
            embedUrl: getEmbedVideoUrl(vUrl),
            isDirect: isDirectVideo(vUrl),
            title: (typeof v === 'object' && v?.title) || `فيديو المنتج ${idx + 1}`,
            poster: videoPoster,
          });
        }
      });
    } else if (typeof rawVideos === 'string' && rawVideos.trim()) {
      const videoPoster = resolveVideoThumbnail(rawVideos, rawVideos.trim());
      list.push({
        id: 'video-0',
        type: 'video',
        url: rawVideos.trim(),
        embedUrl: getEmbedVideoUrl(rawVideos),
        isDirect: isDirectVideo(rawVideos),
        title: 'فيديو توضيحي للمنتج',
        poster: videoPoster,
      });
    }

    // Fallback if no images found
    if (list.length === 0) {
      list.push({
        id: 'img-default',
        type: 'image',
        url: '/assets/placeholder-tech.png',
        alt: product?.name_ar || product?.name_en || 'صورة المنتج',
      });
    }

    return list;
  }, [product]);

  // State
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [lensSize, setLensSize] = useState({ width: 140, height: 140 });
  const [bgPos, setBgPos] = useState({ x: 0, y: 0 });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [isDirectPlaying, setIsDirectPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const containerRef = useRef(null);
  const imageWrapperRef = useRef(null);
  const imgRef = useRef(null);
  const railRef = useRef(null);
  const videoPlayerRef = useRef(null);

  // Active media safe accessor
  const activeMedia = mediaList[activeIndex] || mediaList[0];
  const hasMultipleMedia = mediaList.length > 1;

  // Reset lightbox zoom when switching slides
  useEffect(() => {
    setLightboxZoom(1);
  }, [activeIndex]);

  // Amazon-style: Hover over thumbnail changes the main stage immediately
  const handleThumbnailHover = (idx) => {
    setActiveIndex(idx);
    setIsZooming(false);
  };

  // Amazon-style: Precise Mouse Move Lens Calculation (Dead-Center Cursor Alignment)
  const handleMouseMove = (e) => {
    if (!imageWrapperRef.current || !imgRef.current || activeMedia?.type !== 'image') return;

    const rect = imageWrapperRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    // Mouse coordinates strictly relative to the image
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Responsive lens size based on actual image dimensions
    const lensW = Math.min(140, Math.max(60, Math.floor(rect.width * 0.4)));
    const lensH = Math.min(140, Math.max(60, Math.floor(rect.height * 0.4)));

    // Calculate lens position so cursor is DEAD CENTER inside the lens
    let lensX = mouseX - lensW / 2;
    let lensY = mouseY - lensH / 2;

    // Keep lens strictly within image bounds
    const maxLensX = Math.max(0, rect.width - lensW);
    const maxLensY = Math.max(0, rect.height - lensH);

    lensX = Math.max(0, Math.min(lensX, maxLensX));
    lensY = Math.max(0, Math.min(lensY, maxLensY));

    setLensPos({ x: lensX, y: lensY });
    setLensSize((prev) => {
      if (prev.width === lensW && prev.height === lensH) return prev;
      return { width: lensW, height: lensH };
    });

    // Background zoom percentages (0% to 100% across the image)
    const pctX = maxLensX > 0 ? (lensX / maxLensX) * 100 : 50;
    const pctY = maxLensY > 0 ? (lensY / maxLensY) * 100 : 50;

    setBgPos({ x: pctX, y: pctY });
    setIsZooming(true);
  };

  const handleMouseEnter = (e) => {
    setIsZooming(true);
    handleMouseMove(e);
  };

  const handleMouseLeave = () => {
    setIsZooming(false);
  };

  // Navigation Arrows
  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : mediaList.length - 1));
    setIsZooming(false);
  }, [mediaList.length]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev < mediaList.length - 1 ? prev + 1 : 0));
    setIsZooming(false);
  }, [mediaList.length]);

  // Scroll thumbnails rail up / down
  const handleScrollRail = (direction) => {
    if (!railRef.current) return;
    const scrollAmount = 140;
    railRef.current.scrollBy({
      top: direction === 'up' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === '+') setLightboxZoom((z) => Math.min(z + 0.5, 3));
      if (e.key === '-') setLightboxZoom((z) => Math.max(z - 0.5, 1));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, handleNext, handlePrev]);

  return (
    <div className="amazon-gallery-wrapper">
      {/* ================= 1. VERTICAL THUMBNAIL RAIL (SIDE STRIP) ================= */}
      {hasMultipleMedia && (
        <div className="amazon-thumbs-strip" aria-label="شريط وسائط المنتج">
          {mediaList.length > 5 && (
            <button
              type="button"
              className="rail-nav-btn rail-up"
              onClick={() => handleScrollRail('up')}
              aria-label="تمرير للأعلى"
            >
              <FaChevronUp size={10} />
            </button>
          )}

          <div className="thumbs-scroll-container" ref={railRef}>
            {mediaList.map((item, idx) => {
              const isActive = activeIndex === idx;
              const isVideo = item.type === 'video';

              return (
                <button
                  type="button"
                  key={item.id}
                  className={`amazon-thumb-btn ${isActive ? 'active' : ''} ${isVideo ? 'is-video-thumb' : ''}`}
                  onMouseEnter={() => handleThumbnailHover(idx)}
                  onClick={() => handleThumbnailHover(idx)}
                  aria-label={isVideo ? `فيديو المنتج ${idx + 1}` : `صورة المنتج ${idx + 1}`}
                >
                  <div className="thumb-img-wrapper">
                    {isVideo && !item.poster && item.isDirect ? (
                      <video
                        src={`${item.url}#t=0.5`}
                        preload="metadata"
                        muted
                        playsInline
                        className="thumb-video-element"
                      />
                    ) : (
                      <img
                        src={isVideo ? (item.poster || '/assets/placeholder-tech.png') : item.url}
                        alt={item.alt || (isVideo ? 'معاينة فيديو المنتج' : `صورة المنتج ${idx + 1}`)}
                        className={isVideo ? 'thumb-video-img' : ''}
                        onError={(e) => {
                          e.currentTarget.src = '/assets/placeholder-tech.png';
                        }}
                      />
                    )}
                  </div>

                  {/* Amazon Signature Video Badge Overlay */}
                  {isVideo && (
                    <div className="video-thumb-badge">
                      <FaPlay size={9} />
                      <span>{isRtl ? 'فيديو' : 'Video'}</span>
                    </div>
                  )}

                  {/* Amazon Active Indicator Pointer */}
                  {isActive && <span className="active-arrow-indicator" />}
                </button>
              );
            })}
          </div>

          {mediaList.length > 5 && (
            <button
              type="button"
              className="rail-nav-btn rail-down"
              onClick={() => handleScrollRail('down')}
              aria-label={isRtl ? 'تمرير للأسفل' : 'Scroll down'}
            >
              <FaChevronDown size={10} />
            </button>
          )}
        </div>
      )}

      {/* ================= 2. MAIN MEDIA STAGE ================= */}
      <div
        className={`amazon-main-stage ${!hasMultipleMedia ? 'single-media' : ''}`}
        ref={containerRef}
      >
        {/* Discount Badge */}
        {discountPercent > 0 && (
          <span className="amazon-discount-badge">
            {isRtl ? `خصم ${discountPercent}%` : `${discountPercent}% OFF`}
          </span>
        )}

        {/* Media Type & Counter Badge */}
        <span className="amazon-counter-badge">
          {activeMedia.type === 'video'
            ? (isRtl ? 'فيديو المنتج' : 'Product Video')
            : `${activeIndex + 1} / ${mediaList.length}`}
        </span>

        {/* Main Media Content: Image OR Video Player */}
        {activeMedia.type === 'image' ? (
          <div
            className="main-image-container"
            onClick={() => setIsLightboxOpen(true)}
            title={isRtl ? 'انقر لتكبير الصورة في شاشة كاملة' : 'Click to expand image fullscreen'}
          >
            <div
              className="image-zoom-wrapper"
              ref={imageWrapperRef}
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <img
                ref={imgRef}
                src={activeMedia.url}
                alt={activeMedia.alt || (isRtl ? (product?.name_ar || 'صورة المنتج') : (product?.name_en || 'Product Image'))}
                className="amazon-main-image"
                onError={(e) => {
                  e.currentTarget.src = '/assets/placeholder-tech.png';
                }}
              />

              {/* Amazon Magnifier Lens (visible on hover) */}
              {isZooming && (
                <div
                  className="amazon-zoom-lens"
                  style={{
                    transform: `translate3d(${lensPos.x}px, ${lensPos.y}px, 0)`,
                    width: `${lensSize.width}px`,
                    height: `${lensSize.height}px`,
                  }}
                />
              )}
            </div>
          </div>
        ) : (
          /* ================= AMAZON VIDEO PLAYER VIEW ================= */
          <div className="amazon-video-stage">
            {activeMedia.isDirect ? (
              <div className="direct-video-wrapper">
                <video
                  ref={videoPlayerRef}
                  src={activeMedia.url}
                  poster={activeMedia.poster}
                  autoPlay
                  muted={isMuted}
                  controls
                  playsInline
                  className="native-video-player"
                />
              </div>
            ) : (
              <iframe
                src={activeMedia.embedUrl}
                title={activeMedia.title || 'فيديو المنتج'}
                className="embed-video-iframe"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}

            <div className="video-overlay-bar">
              <span className="video-title-tag">
                <FaPlay size={10} />
                <span>{activeMedia.title || (isRtl ? 'عرض فيديو المنتج' : 'Play Product Video')}</span>
              </span>
              <button
                type="button"
                className="back-to-images-btn"
                onClick={() => setActiveIndex(0)}
              >
                {isRtl ? 'العودة للصور' : 'Back to Images'}
              </button>
            </div>
          </div>
        )}

        {/* Quick Prev / Next Floating Arrows */}
        {hasMultipleMedia && (
          <>
            <button
              type="button"
              className="stage-nav-arrow arrow-prev"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              title={isRtl ? 'السابق' : 'Previous'}
              aria-label={isRtl ? 'السابق' : 'Previous'}
            >
              <FaChevronRight size={14} />
            </button>

            <button
              type="button"
              className="stage-nav-arrow arrow-next"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              title={isRtl ? 'التالي' : 'Next'}
              aria-label={isRtl ? 'التالي' : 'Next'}
            >
              <FaChevronLeft size={14} />
            </button>
          </>
        )}

        {/* Amazon Bottom Hint Text */}
        {activeMedia.type === 'image' && (
          <div className="amazon-zoom-hint" onClick={() => setIsLightboxOpen(true)}>
            <FaMagnifyingGlassPlus size={12} />
            <span>
              {isRtl
                ? 'مرر مؤشر الفأرة فوق الصورة لتكبيرها، أو انقر لعرض ملء الشاشة'
                : 'Roll over image to zoom in, or click to view full screen'}
            </span>
          </div>
        )}

        {/* Open Fullscreen Button */}
        <button
          type="button"
          className="amazon-expand-btn"
          onClick={() => setIsLightboxOpen(true)}
          title={isRtl ? 'معاينة بكامل الشاشة' : 'Full Screen View'}
          aria-label={isRtl ? 'معاينة بكامل الشاشة' : 'Full Screen View'}
        >
          <FaExpand size={13} />
        </button>

        {/* ================= 3. AMAZON ULTRA-HD FLYOUT ZOOM WINDOW ================= */}
        {isZooming && activeMedia?.type === 'image' && (
          <div
            className="amazon-flyout-zoom"
            style={{
              backgroundImage: `url(${activeMedia.url})`,
              backgroundPosition: `${bgPos.x}% ${bgPos.y}%`,
              backgroundSize: '280%',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <div className="flyout-zoom-header">
              <span>{isRtl ? 'تكبير فائق الدقة (Ultra-HD Zoom)' : 'Ultra-HD Zoom'}</span>
            </div>
          </div>
        )}
      </div>

      {/* ================= 4. AMAZON FULLSCREEN LIGHTBOX MODAL ================= */}
      {isLightboxOpen && (
        <div
          className="amazon-lightbox-backdrop"
          onClick={() => setIsLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="amazon-lightbox-container"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="lightbox-header">
              <div className="lightbox-title-area">
                <h4>
                  {isRtl
                    ? (product?.name_ar || product?.name_en || 'معاينة المنتج')
                    : (product?.name_en || product?.name_ar || 'Product Preview')}
                </h4>
                {product?.sku && <span className="lightbox-sku">SKU: {product.sku}</span>}
                <span className="lightbox-counter">
                  {isRtl
                    ? `(${activeIndex + 1} من ${mediaList.length})`
                    : `(${activeIndex + 1} of ${mediaList.length})`}
                </span>
              </div>

              {/* Controls: Zoom In / Out / Reset / Close */}
              <div className="lightbox-actions">
                {activeMedia.type === 'image' && (
                  <>
                    <button
                      type="button"
                      className="lb-btn"
                      onClick={() => setLightboxZoom((z) => Math.min(z + 0.4, 3))}
                      title={isRtl ? 'تكبير (+)' : 'Zoom In (+)'}
                    >
                      <FaMagnifyingGlassPlus size={14} />
                    </button>
                    <button
                      type="button"
                      className="lb-btn"
                      onClick={() => setLightboxZoom((z) => Math.max(z - 0.4, 1))}
                      title={isRtl ? 'تصغير (-)' : 'Zoom Out (-)'}
                    >
                      <FaMagnifyingGlassMinus size={14} />
                    </button>
                    <button
                      type="button"
                      className="lb-btn"
                      onClick={() => setLightboxZoom(1)}
                      title={isRtl ? 'إعادة ضبط الحجم' : 'Reset Zoom'}
                    >
                      <FaRotateLeft size={13} />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="lb-close-btn"
                  onClick={() => setIsLightboxOpen(false)}
                  title={isRtl ? 'إغلاق (Esc)' : 'Close (Esc)'}
                  aria-label={isRtl ? 'إغلاق' : 'Close'}
                >
                  <FaXmark size={18} />
                </button>
              </div>
            </div>

            {/* Lightbox Main Stage */}
            <div className="lightbox-viewport">
              {hasMultipleMedia && (
                <>
                  <button
                    type="button"
                    className="lb-nav-arrow lb-prev"
                    onClick={handlePrev}
                    aria-label={isRtl ? 'السابق' : 'Previous'}
                  >
                    <FaChevronRight size={18} />
                  </button>
                  <button
                    type="button"
                    className="lb-nav-arrow lb-next"
                    onClick={handleNext}
                    aria-label={isRtl ? 'التالي' : 'Next'}
                  >
                    <FaChevronLeft size={18} />
                  </button>
                </>
              )}

              <div className="lightbox-media-wrapper">
                {activeMedia.type === 'image' ? (
                  <img
                    src={activeMedia.url}
                    alt={activeMedia.alt}
                    style={{
                      transform: `scale(${lightboxZoom})`,
                      cursor: lightboxZoom > 1 ? 'grab' : 'zoom-in',
                    }}
                    onClick={() =>
                      setLightboxZoom((z) => (z === 1 ? 2 : 1))
                    }
                    className="lb-active-img"
                  />
                ) : activeMedia.isDirect ? (
                  <video
                    src={activeMedia.url}
                    poster={activeMedia.poster}
                    controls
                    autoPlay
                    className="lb-active-video"
                  />
                ) : (
                  <iframe
                    src={activeMedia.embedUrl}
                    title={activeMedia.title}
                    className="lb-active-iframe"
                    allowFullScreen
                  />
                )}
              </div>
            </div>

            {/* Lightbox Bottom Thumbnails Carousel */}
            {hasMultipleMedia && (
              <div className="lightbox-thumbs-bar">
                {mediaList.map((item, idx) => (
                  <button
                    type="button"
                    key={`lb-${item.id}`}
                    className={`lb-thumb ${activeIndex === idx ? 'active' : ''}`}
                    onClick={() => setActiveIndex(idx)}
                  >
                    {item.type === 'video' && !item.poster && item.isDirect ? (
                      <video
                        src={`${item.url}#t=0.5`}
                        preload="metadata"
                        muted
                        playsInline
                        className="thumb-video-element"
                      />
                    ) : (
                      <img
                        src={item.type === 'video' ? (item.poster || '/assets/placeholder-tech.png') : item.url}
                        alt={`مصغر ${idx + 1}`}
                        className={item.type === 'video' ? 'thumb-video-img' : ''}
                      />
                    )}
                    {item.type === 'video' && (
                      <span className="lb-video-pill">
                        <FaPlay size={8} />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
