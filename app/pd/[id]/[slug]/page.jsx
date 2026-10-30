'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/src/components/common/Navbar/Navbar';
import Footer from '@/src/components/common/Footer/Footer';
import AmazonMediaGallery from '@/src/components/common/AmazonMediaGallery/AmazonMediaGallery';
import StoreProductCard from '@/src/components/common/StoreProductCard/StoreProductCard';
import { useToast, renderPillarIcon, DEFAULT_SHOWCASE_TABS } from '@/src/components/adminComponents';
import useTrendlineLang from '@/src/hooks/useTrendlineLang';
import {
  FaHouse,
  FaChevronLeft,
  FaChevronRight,
  FaArrowLeft,
  FaMagnifyingGlassPlus,
  FaStar,
  FaRegStar,
  FaTruckFast,
  FaAward,
  FaRotateLeft,
  FaCartShopping,
  FaShareNodes,
  FaCheck,
  FaCopy,
  FaBolt,
  FaGaugeHigh,
  FaMicrochip,
  FaShieldHalved,
  FaTag,
  FaBoxOpen,
  FaBarcode,
  FaLayerGroup,
  FaSliders,
  FaRulerCombined,
  FaWeightHanging,
  FaCubes,
  FaCircleCheck,
  FaWhatsapp,
  FaTelegram,
  FaFacebook,
  FaXmark,
  FaUpRightFromSquare,
  FaClockRotateLeft,
  FaWandMagicSparkles,
} from 'react-icons/fa6';
import '../../ProductDetails.scss';

// Helper to pick an appropriate icon for each specification row
function getSpecRowIcon(label = '', index = 0) {
  const key = label.toLowerCase();
  if (key.includes('علامة') || key.includes('ماركة') || key.includes('brand')) return <FaTag />;
  if (key.includes('اسم') || key.includes('منتج') || key.includes('موديل') || key.includes('model')) return <FaBoxOpen />;
  if (key.includes('قطعة') || key.includes('كود') || key.includes('sku') || key.includes('part')) return <FaBarcode />;
  if (key.includes('منافذ') || key.includes('منفذ') || key.includes('port') || key.includes('شبك')) return <FaMicrochip />;
  if (key.includes('طاقة') || key.includes('poe') || key.includes('بطارية') || key.includes('كهرباء')) return <FaBolt />;
  if (key.includes('طبقة') || key.includes('فئة') || key.includes('layer')) return <FaLayerGroup />;
  if (key.includes('ميزات') || key.includes('خصائص') || key.includes('دقة') || key.includes('feature')) return <FaSliders />;
  if (key.includes('أبعاد') || key.includes('مقاس') || key.includes('حجم') || key.includes('dimension')) return <FaRulerCombined />;
  if (key.includes('وزن') || key.includes('weight')) return <FaWeightHanging />;
  if (key.includes('عبوة') || key.includes('محتويات') || key.includes('ضمان') || key.includes('box')) return <FaCubes />;

  const fallbackIcons = [
    <FaTag key="0" />,
    <FaBoxOpen key="1" />,
    <FaBarcode key="2" />,
    <FaMicrochip key="3" />,
    <FaBolt key="4" />,
    <FaLayerGroup key="5" />,
    <FaSliders key="6" />,
    <FaRulerCombined key="7" />,
    <FaWeightHanging key="8" />,
    <FaCubes key="9" />,
  ];
  return fallbackIcons[index % fallbackIcons.length];
}

function ProductDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();

  const rawId = params?.id ? decodeURIComponent(String(params.id)) : '';
  const rawSlug = params?.slug ? decodeURIComponent(String(params.slug)) : '';

  // Unified Language state synchronized with Navbar / URL Query (?lang=) / localStorage / Cookies
  const { lang, isRtl, setLang } = useTrendlineLang('ar');

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState([]);
  const [interestProducts, setInterestProducts] = useState([]);
  const [recFilterTab, setRecFilterTab] = useState('all'); // 'all' | 'similar' | 'visited' | 'interests'
  const carouselTrackRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [quantity, setQuantity] = useState(1);
  const [copiedShortLink, setCopiedShortLink] = useState(false);
  const [showShareDrawer, setShowShareDrawer] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  // Smart Bundle State (Randomly selects 1 bundle per visit when product is in multiple bundles)
  const [activeBundle, setActiveBundle] = useState(null);
  const [selectedBundleProdIds, setSelectedBundleProdIds] = useState([]);
  const [bundleAddedSuccess, setBundleAddedSuccess] = useState(false);

  // Fetch product details
  useEffect(() => {
    if (!rawId) return;
    let isMounted = true;

    async function fetchProductData() {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await fetch(`/api/v1/catalog/products/${encodeURIComponent(rawId)}`);
        const json = await res.json();

        if (!res.ok || !json?.success || !json?.data) {
          if (isMounted) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }

        const prod = json.data;
        if (isMounted) {
          setProduct(prod);
          setActiveImageIdx(0);
          setLoading(false);
        }

        // Ensure canonical URL /pd/:id/:slug in address bar
        const canonicalSlug =
          prod.slug ||
          (prod.name_en || prod.name_ar || prod.id)
            .toString()
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9\u0600-\u06FF-_]/g, '') ||
          prod.id;

        if (typeof window !== 'undefined' && (rawId !== prod.id || rawSlug !== canonicalSlug)) {
          window.history.replaceState(
            null,
            '',
            `/pd/${encodeURIComponent(prod.id)}/${encodeURIComponent(canonicalSlug)}`
          );
        }

        // Fetch all active bundles that include this product, and pick ONE randomly per visit
        try {
          const bRes = await fetch(
            `/api/v1/catalog/bundles?product_id=${encodeURIComponent(prod.id)}`
          );
          const bJson = await bRes.json();
          if (isMounted && bJson?.success && Array.isArray(bJson.data) && bJson.data.length > 0) {
            const matchingBundles = bJson.data.filter(
              (b) => b.is_active && Array.isArray(b.items) && b.items.length > 0
            );
            if (matchingBundles.length > 0) {
              const randomIdx = Math.floor(Math.random() * matchingBundles.length);
              const chosen = matchingBundles[randomIdx];
              setActiveBundle(chosen);
              setSelectedBundleProdIds(chosen.items.map((it) => String(it.product_id)));
            } else {
              setActiveBundle(null);
            }
          } else if (isMounted) {
            setActiveBundle(null);
          }
        } catch (bErr) {
          // ignore bundle fetch error
        }

        // 1. Track & Retrieve User Browsing History + Interests in localStorage
        let storedVisited = [];
        let storedInterests = { categories: {}, brands: {} };

        if (typeof window !== 'undefined') {
          try {
            const rawVisited = localStorage.getItem('trendline_recently_viewed');
            if (rawVisited) {
              const parsed = JSON.parse(rawVisited);
              if (Array.isArray(parsed)) storedVisited = parsed;
            }
          } catch (e) {
            // ignore storage parse error
          }

          try {
            const rawInterests = localStorage.getItem('trendline_user_interests');
            if (rawInterests) {
              const parsedInt = JSON.parse(rawInterests);
              if (parsedInt && typeof parsedInt === 'object') {
                storedInterests = {
                  categories: parsedInt.categories || {},
                  brands: parsedInt.brands || {},
                };
              }
            }
          } catch (e) {
            // ignore
          }
        }

        const primaryCat =
          prod.categories?.find((c) => c.ProductCategory?.is_primary) || prod.categories?.[0];
        const parentCatId = primaryCat?.parent?.id || primaryCat?.parent_id;

        // Previously visited products (excluding current product)
        const prevVisited = storedVisited
          .filter((item) => item && String(item.id) !== String(prod.id))
          .slice(0, 10)
          .map((item) => ({ ...item, _recBadge: 'تمت زيارته مؤخراً', _recType: 'visited' }));

        if (isMounted) {
          setRecentlyViewedProducts(prevVisited);
        }

        // Update localStorage with current product visit & increment interest scores
        if (typeof window !== 'undefined') {
          try {
            const snapshot = {
              id: prod.id,
              slug: prod.slug || prod.id,
              name_ar: prod.name_ar,
              name_en: prod.name_en,
              sku: prod.sku,
              original_price: prod.original_price,
              sale_price: prod.sale_price,
              discount_percent: prod.discount_percent,
              stock_quantity: prod.stock_quantity,
              short_desc_ar: prod.short_desc_ar,
              brand: prod.brand,
              categories: prod.categories,
              images: prod.images,
              viewed_at: Date.now(),
            };
            const updatedVisited = [
              snapshot,
              ...storedVisited.filter((item) => item && String(item.id) !== String(prod.id)),
            ].slice(0, 14);
            localStorage.setItem('trendline_recently_viewed', JSON.stringify(updatedVisited));

            if (primaryCat?.id) {
              const cKey = String(primaryCat.id);
              storedInterests.categories[cKey] = (storedInterests.categories[cKey] || 0) + 2;
            }
            if (parentCatId) {
              const pKey = String(parentCatId);
              storedInterests.categories[pKey] = (storedInterests.categories[pKey] || 0) + 1;
            }
            const bId = prod.brand_id || prod.brand?.id;
            if (bId) {
              const bKey = String(bId);
              storedInterests.brands[bKey] = (storedInterests.brands[bKey] || 0) + 2;
            }
            localStorage.setItem('trendline_user_interests', JSON.stringify(storedInterests));
          } catch (e) {
            // ignore quota errors
          }
        }

        // 2. Fetch Similar Products (from primary category & parent category) + Catalog Pool for Interests
        const fetchPromises = [];
        if (primaryCat?.id) {
          fetchPromises.push(
            fetch(
              `/api/v1/catalog/products?category_id=${encodeURIComponent(primaryCat.id)}&limit=12`
            ).then((r) => r.json())
          );
        } else {
          fetchPromises.push(Promise.resolve(null));
        }

        fetchPromises.push(
          fetch(`/api/v1/catalog/products?limit=24`).then((r) => r.json())
        );

        const [catRelJson, poolJson] = await Promise.all(fetchPromises);

        if (isMounted) {
          const catRelList = Array.isArray(catRelJson?.data)
            ? catRelJson.data.filter((item) => String(item.id) !== String(prod.id))
            : [];

          const allPoolList = Array.isArray(poolJson?.data)
            ? poolJson.data.filter((item) => String(item.id) !== String(prod.id))
            : [];

          // If primary subcategory had few products, supplement with parent category or same brand products
          const similarMap = new Map();
          catRelList.forEach((item) => {
            similarMap.set(String(item.id), {
              ...item,
              _recBadge: 'منتج مشابه',
              _recType: 'similar',
            });
          });

          if (similarMap.size < 8) {
            allPoolList.forEach((item) => {
              if (similarMap.has(String(item.id))) return;
              const sharesRootOrSub = item.categories?.some(
                (c) =>
                  String(c.id) === String(primaryCat?.id) ||
                  String(c.id) === String(parentCatId) ||
                  String(c.parent_id) === String(parentCatId)
              );
              const sharesBrand =
                (prod.brand?.id && String(item.brand?.id) === String(prod.brand.id)) ||
                (prod.brand_id && String(item.brand_id) === String(prod.brand_id));

              if (sharesRootOrSub || sharesBrand) {
                similarMap.set(String(item.id), {
                  ...item,
                  _recBadge: sharesRootOrSub ? 'منتج مشابه' : `من نفس الماركة`,
                  _recType: 'similar',
                });
              }
            });
          }

          setRelatedProducts(Array.from(similarMap.values()).slice(0, 12));

          // Score products based on User Interests (visited categories, brands, featured, discounts)
          const scoredInterests = allPoolList
            .map((item) => {
              let score = 0;
              (item.categories || []).forEach((c) => {
                score += (storedInterests.categories[String(c.id)] || 0) * 3;
                if (c.parent_id) {
                  score += (storedInterests.categories[String(c.parent_id)] || 0) * 2;
                }
              });
              const itemBrandId = item.brand_id || item.brand?.id;
              if (itemBrandId && storedInterests.brands[String(itemBrandId)]) {
                score += storedInterests.brands[String(itemBrandId)] * 3;
              }
              if (item.is_featured) score += 2;
              if (item.sale_price && Number(item.sale_price) < Number(item.original_price)) {
                score += 2;
              }
              return {
                ...item,
                _interestScore: score,
                _recBadge: 'يناسب اهتماماتك',
                _recType: 'interests',
              };
            })
            .sort((a, b) => b._interestScore - a._interestScore)
            .slice(0, 12);

          setInterestProducts(scoredInterests);
        }
      } catch (err) {
        if (isMounted) {
          setNotFound(true);
          setLoading(false);
        }
      }
    }

    fetchProductData();
    return () => {
      isMounted = false;
    };
  }, [rawId, rawSlug]);

  // Build Gallery Images list
  const galleryImages = useMemo(() => {
    if (!product) return ['/assets/placeholder-tech.png'];
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images.map((img) => img.image_url).filter(Boolean);
    }
    return ['/assets/placeholder-tech.png'];
  }, [product]);

  // Resolve Category Hierarchy for Breadcrumbs (deduplicating identical names/IDs)
  const categoryHierarchy = useMemo(() => {
    if (!product?.categories || product.categories.length === 0) return { root: null, sub: null };
    const primary =
      product.categories.find((c) => c.ProductCategory?.is_primary) || product.categories[0];

    if (
      primary.parent &&
      String(primary.parent.id) !== String(primary.id) &&
      (primary.parent.name_ar || primary.parent.name_en) !== (primary.name_ar || primary.name_en)
    ) {
      return { root: primary.parent, sub: primary };
    }
    return { root: primary, sub: null };
  }, [product]);

  // Build Complete Specifications Rows (combining core product fields + JSONB specifications)
  const specificationRows = useMemo(() => {
    if (!product) return [];
    const rows = [];

    const brandName = isRtl
      ? (product.brand?.name_ar || product.brand?.name_en || 'ترند لاين')
      : (product.brand?.name_en || product.brand?.name_ar || 'Trendline Enterprise');

    rows.push({
      label: isRtl ? 'العلامة التجارية' : 'Brand',
      value: brandName,
    });
    rows.push({
      label: isRtl ? 'اسم المنتج' : 'Product Name',
      value: isRtl
        ? (product.name_ar || product.name_en || product.name)
        : (product.name_en || product.name_ar || product.name),
    });
    if (product.sku) {
      rows.push({
        label: isRtl ? 'رقم القطعة (SKU)' : 'Part Number (SKU)',
        value: product.sku,
      });
    }

    const rawSpecs = product.specifications;
    if (rawSpecs && typeof rawSpecs === 'object') {
      if (Array.isArray(rawSpecs.items) && rawSpecs.items.length > 0) {
        rawSpecs.items.forEach((item) => {
          if (item && (item.key_ar || item.key_en || item.key)) {
            const key = isRtl
              ? (item.key_ar || item.key || item.key_en)
              : (item.key_en || item.key || item.key_ar);
            const val = isRtl
              ? (item.value_ar || item.value || item.value_en)
              : (item.value_en || item.value || item.value_ar);
            rows.push({
              label: key,
              value: val,
            });
          }
        });
      } else if (!Array.isArray(rawSpecs)) {
        Object.entries(rawSpecs).forEach(([k, v]) => {
          if (
            k !== 'media_videos' &&
            k !== 'items' &&
            v !== null &&
            v !== undefined &&
            typeof v !== 'object' &&
            String(v).trim() !== ''
          ) {
            rows.push({ label: k, value: String(v) });
          }
        });
      }
    } else if (Array.isArray(rawSpecs)) {
      rawSpecs.forEach((item) => {
        if (item && (item.key_ar || item.key_en || item.key || item.name)) {
          const key = isRtl
            ? (item.key_ar || item.key || item.name || item.key_en)
            : (item.key_en || item.key || item.name || item.key_ar);
          const val = isRtl
            ? (item.value_ar || item.value || item.value_en)
            : (item.value_en || item.value || item.value_ar);
          rows.push({
            label: key,
            value: val,
          });
        }
      });
    }

    // Add default enterprise rows if product has very few custom specs so the table always looks complete
    if (rows.length < 6) {
      if (categoryHierarchy.sub || categoryHierarchy.root) {
        rows.push({
          label: isRtl ? 'الفئة والتصنيف' : 'Category & Classification',
          value: isRtl
            ? (categoryHierarchy.sub?.name_ar ||
                categoryHierarchy.root?.name_ar ||
                'الأجهزة والأنظمة التقنية')
            : (categoryHierarchy.sub?.name_en ||
                categoryHierarchy.root?.name_en ||
                'Technical Systems & Devices'),
        });
      }
      rows.push({
        label: isRtl ? 'الطبقة والاستخدام' : 'Tier & Usage',
        value: isRtl
          ? 'التجارية والمؤسسية (Enterprise Grade)'
          : 'Enterprise Grade Commercial',
      });
      rows.push({
        label: isRtl ? 'الضمان والدعم الفني' : 'Warranty & Support',
        value: isRtl
          ? 'ضمان الوكيل المعتمد + دعم فني متكامل من ترند لاين'
          : 'Authorized Dealer Warranty + Trendline Technical Support',
      });
      rows.push({
        label: isRtl ? 'محتويات العبوة' : 'Package Contents',
        value: isRtl
          ? `${product.name_ar || 'الجهاز الأساسي'}، كابلات التوصيل القياسية، دليل التشغيل السريع، شهادة الضمان`
          : `${product.name_en || product.name_ar || 'Main Unit'}, Standard Connectivity Cables, Quick Start Guide, Warranty Card`,
      });
    }

    return rows;
  }, [product, categoryHierarchy, isRtl]);

  // Top 5 Bullet Highlights for Hero Card
  const heroBullets = useMemo(() => {
    return specificationRows.slice(0, 6);
  }, [specificationRows]);

  // Smart Carousel Products List (combines Similar + Recently Visited + User Interests)
  const carouselProducts = useMemo(() => {
    if (recFilterTab === 'similar') {
      return relatedProducts;
    }
    if (recFilterTab === 'visited') {
      return recentlyViewedProducts.length > 0 ? recentlyViewedProducts : relatedProducts;
    }
    if (recFilterTab === 'interests') {
      return interestProducts.length > 0 ? interestProducts : relatedProducts;
    }

    // 'all': Smart blend of Similar + Recently Visited + Interests (deduplicated)
    const blendedMap = new Map();
    relatedProducts.slice(0, 5).forEach((item) => {
      blendedMap.set(String(item.id), item);
    });
    recentlyViewedProducts.slice(0, 4).forEach((item) => {
      if (!blendedMap.has(String(item.id))) {
        blendedMap.set(String(item.id), item);
      }
    });
    interestProducts.forEach((item) => {
      if (!blendedMap.has(String(item.id))) {
        blendedMap.set(String(item.id), item);
      }
    });
    relatedProducts.forEach((item) => {
      if (!blendedMap.has(String(item.id))) {
        blendedMap.set(String(item.id), item);
      }
    });

    return Array.from(blendedMap.values()).slice(0, 14);
  }, [recFilterTab, relatedProducts, recentlyViewedProducts, interestProducts]);

  const handleScrollCarousel = (direction) => {
    if (!carouselTrackRef.current) return;
    const scrollAmount = 580; // ~2 compact cards
    carouselTrackRef.current.scrollBy({
      left: direction === 'next' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleShareCardShortLink = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window === 'undefined') return;
    const shortUrl = `${window.location.origin}/pd/${encodeURIComponent(item.id)}`;
    navigator.clipboard.writeText(shortUrl);
    if (toast?.success) {
      toast.success(`تم نسخ الرابط القصير: ${shortUrl}`);
    }
  };

  // Dynamic Bundle Pricing & Selection Calculation
  // Discount applies ONLY when ALL products in the bundle are selected!
  const bundleCalc = useMemo(() => {
    if (!activeBundle || !Array.isArray(activeBundle.items)) {
      return {
        allItems: [],
        selectedItems: [],
        isFullBundleSelected: false,
        selectedOriginalSum: 0,
        appliedDiscount: 0,
        finalPrice: 0,
      };
    }

    const allItems = activeBundle.items;
    const selectedItems = allItems.filter((it) =>
      selectedBundleProdIds.includes(String(it.product_id))
    );
    const isFullBundleSelected =
      allItems.length > 0 && selectedItems.length === allItems.length;

    const selectedOriginalSum = selectedItems.reduce(
      (sum, it) => sum + Number(it.unit_price || 0) * Number(it.quantity || 1),
      0
    );

    let finalPrice = selectedOriginalSum;
    let appliedDiscount = 0;

    if (isFullBundleSelected && activeBundle.is_discount_active) {
      finalPrice = Number(activeBundle.effective_bundle_price || selectedOriginalSum);
      appliedDiscount = Math.max(0, selectedOriginalSum - finalPrice);
    }

    return {
      allItems,
      selectedItems,
      isFullBundleSelected,
      selectedOriginalSum,
      appliedDiscount,
      finalPrice,
    };
  }, [activeBundle, selectedBundleProdIds]);

  // Dynamic Showcase Tabs & Feature Pillars
  const showcaseData = useMemo(() => {
    if (!product) return DEFAULT_SHOWCASE_TABS;
    if (product.showcase_tabs && typeof product.showcase_tabs === 'object') {
      const isCustom = product.showcase_tabs.custom_enabled === true;
      if (!isCustom) {
        return DEFAULT_SHOWCASE_TABS;
      }
      return {
        custom_enabled: true,
        tabs: {
          description: {
            ...DEFAULT_SHOWCASE_TABS.tabs.description,
            ...(product.showcase_tabs.tabs?.description || {}),
            enabled: true, // Description is always enabled
          },
          specs: {
            ...DEFAULT_SHOWCASE_TABS.tabs.specs,
            ...(product.showcase_tabs.tabs?.specs || {}),
          },
          features: {
            ...DEFAULT_SHOWCASE_TABS.tabs.features,
            ...(product.showcase_tabs.tabs?.features || {}),
          },
          warranty: {
            ...DEFAULT_SHOWCASE_TABS.tabs.warranty,
            ...(product.showcase_tabs.tabs?.warranty || {}),
          },
        },
        pillars:
          Array.isArray(product.showcase_tabs.pillars) && product.showcase_tabs.pillars.length > 0
            ? product.showcase_tabs.pillars
            : DEFAULT_SHOWCASE_TABS.pillars,
      };
    }
    return DEFAULT_SHOWCASE_TABS;
  }, [product]);

  const visibleTabs = useMemo(() => {
    const list = [
      { key: 'description', data: showcaseData?.tabs?.description },
      { key: 'specs', data: showcaseData?.tabs?.specs },
      { key: 'features', data: showcaseData?.tabs?.features },
      { key: 'warranty', data: showcaseData?.tabs?.warranty },
    ];
    return list.filter((t) => t.key === 'description' || t.data?.enabled === true);
  }, [showcaseData]);

  // Ensure activeTab is valid
  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some((t) => t.key === activeTab)) {
      setActiveTab(visibleTabs[0]?.key || 'description');
    }
  }, [visibleTabs, activeTab]);

  const handleToggleBundleProduct = (prodId) => {
    const pid = String(prodId);
    setSelectedBundleProdIds((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid]
    );
  };

  const handleSelectAllBundleProducts = () => {
    if (!activeBundle?.items) return;
    setSelectedBundleProdIds(activeBundle.items.map((it) => String(it.product_id)));
  };

  const handleAddBundleToCart = () => {
    if (bundleCalc.selectedItems.length === 0) {
      toast?.error?.('يرجى تحديد منتج واحد على الأقل من الباندل لإضافته للعربة');
      return;
    }

    setBundleAddedSuccess(true);
    if (bundleCalc.isFullBundleSelected) {
      toast?.success?.(
        `تمت إضافة الباندل الكاملة "${activeBundle.name_ar}" (${bundleCalc.selectedItems.length} منتجات) بالسعر المخفض (${bundleCalc.finalPrice.toLocaleString()} ج.م) إلى العربة!`
      );
    } else {
      toast?.info?.(
        `تمت إضافة (${bundleCalc.selectedItems.length}) منتجات مختارة من الباندل بإجمالي (${bundleCalc.finalPrice.toLocaleString()} ج.م — بدون خصم الباندل الكاملة) إلى العربة!`
      );
    }
    setTimeout(() => setBundleAddedSuccess(false), 3500);
  };

  // Short Share URL Function: converts `/pd/:id/:slug` -> `/pd/:id`
  const shortSharePath = product ? `/pd/${product.id}` : `/pd/${rawId}`;
  const getFullShortShareUrl = () => {
    if (typeof window === 'undefined') return shortSharePath;
    return `${window.location.origin}/pd/${encodeURIComponent(product?.id || rawId)}`;
  };

  const handleShareShortLink = async () => {
    const shortUrl = getFullShortShareUrl();

    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedShortLink(true);
      toast?.success?.(
        isRtl
          ? 'تم نسخ رابط المنتج القصير للحافظة بنجاح'
          : 'Short product link copied to clipboard successfully'
      );
      setTimeout(() => setCopiedShortLink(false), 3000);
    } catch (err) {
      const input = document.createElement('input');
      input.value = shortUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedShortLink(true);
      toast?.success?.(
        isRtl
          ? 'تم نسخ رابط المنتج القصير للحافظة بنجاح'
          : 'Short product link copied to clipboard successfully'
      );
      setTimeout(() => setCopiedShortLink(false), 3000);
    }
  };

  const handleOrderNow = () => {
    setOrderSubmitted(true);
    const activeName = isRtl
      ? product?.name_ar || product?.name_en || product?.name
      : product?.name_en || product?.name_ar || product?.name;
    toast?.success?.(
      isRtl
        ? `تمت إضافة (${quantity}) من "${activeName}" إلى طلبك السريع بنجاح!`
        : `Added (${quantity}) of "${activeName}" to your quick order successfully!`
    );
    setTimeout(() => setOrderSubmitted(false), 3000);
  };

  if (loading) {
    return (
      <div suppressHydrationWarning className="pd-page-wrapper" dir={isRtl ? 'rtl' : 'ltr'}>
        <Navbar lang={lang} onToggleLang={setLang} />
        <div className="pd-container" style={{ paddingTop: '48px', textAlign: 'center' }}>
          <div
            style={{
              background: '#fff',
              borderRadius: '22px',
              padding: '64px 24px',
              border: '1px solid #dce6f4',
            }}
          >
            <p style={{ fontSize: '18px', fontWeight: 800, color: '#1e40af' }}>
              {isRtl
                ? 'جاري تحميل بيانات ومواصفات المنتج...'
                : 'Loading product details and specifications...'}
            </p>
          </div>
        </div>
        <Footer lang={lang} />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div suppressHydrationWarning className="pd-page-wrapper" dir={isRtl ? 'rtl' : 'ltr'}>
        <Navbar lang={lang} onToggleLang={setLang} />
        <div className="pd-container" style={{ paddingTop: '48px', textAlign: 'center' }}>
          <div
            style={{
              background: '#fff',
              borderRadius: '22px',
              padding: '64px 24px',
              border: '1px solid #dce6f4',
            }}
          >
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', marginBottom: '12px' }}>
              {isRtl ? 'لم يتم العثور على المنتج المطلوب' : 'Product Not Found'}
            </h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
              {isRtl
                ? 'تأكد من صحة الرابط أو تصفح أقسام المتجر للوصول إلى جميع المنتجات المتاحة.'
                : 'Please verify the URL or explore our store categories to find available products.'}
            </p>
            <Link
              href="/categories"
              style={{
                display: 'inline-block',
                padding: '12px 28px',
                borderRadius: '12px',
                background: '#1d4ed8',
                color: '#fff',
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              {isRtl ? 'تصفح جميع الأقسام' : 'Browse All Categories'}
            </Link>
          </div>
        </div>
        <Footer lang={lang} />
      </div>
    );
  }

  const brandName = isRtl
    ? (product.brand?.name_ar || product.brand?.name_en || 'ترند لاين')
    : (product.brand?.name_en || product.brand?.name_ar || 'TRENDLINE');
  const productName = isRtl
    ? (product.name_ar || product.name_en || product.name)
    : (product.name_en || product.name_ar || product.name);
  const currencyLabel = isRtl ? 'ج.م' : 'EGP';

  const currentPrice = Number(product.sale_price || product.original_price || 0);
  const oldPrice =
    product.sale_price && Number(product.original_price) > Number(product.sale_price)
      ? Number(product.original_price)
      : null;
  const discountPercent =
    product.discount_percent ||
    (oldPrice ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) : 0);
  const ratingValue = Number(product.rating_avg) > 0 ? Number(product.rating_avg).toFixed(1) : '4.8';
  const fullShortUrl = getFullShortShareUrl();

  return (
    <div suppressHydrationWarning className="pd-page-wrapper" dir={isRtl ? 'rtl' : 'ltr'}>
      <Navbar lang={lang} onToggleLang={setLang} />

      <div className="pd-container">
        {/* ================= SIMPLE & NATURAL BREADCRUMB BAR ================= */}
        <div className="pd-top-bar">
          <nav className="pd-breadcrumbs" aria-label="Breadcrumb">
            <Link href="/" className="crumb-link">
              <FaHouse className="home-icon" />
              <span>{isRtl ? 'الرئيسية' : 'Home'}</span>
            </Link>

            {isRtl ? <FaChevronLeft className="crumb-sep" /> : <FaChevronRight className="crumb-sep" />}
            <Link href="/categories" className="crumb-link">
              {isRtl ? 'الأقسام' : 'Categories'}
            </Link>

            {categoryHierarchy.root && (
              <>
                {isRtl ? <FaChevronLeft className="crumb-sep" /> : <FaChevronRight className="crumb-sep" />}
                <Link
                  href={`/categories/${encodeURIComponent(categoryHierarchy.root.id)}/${encodeURIComponent(categoryHierarchy.root.slug || categoryHierarchy.root.id)}`}
                  className="crumb-link"
                >
                  {isRtl
                    ? (categoryHierarchy.root.name_ar || categoryHierarchy.root.name_en)
                    : (categoryHierarchy.root.name_en || categoryHierarchy.root.name_ar)}
                </Link>
              </>
            )}

            {categoryHierarchy.sub && (
              <>
                {isRtl ? <FaChevronLeft className="crumb-sep" /> : <FaChevronRight className="crumb-sep" />}
                <Link
                  href={`/categories/${encodeURIComponent(categoryHierarchy.sub.id)}/${encodeURIComponent(categoryHierarchy.sub.slug || categoryHierarchy.sub.id)}`}
                  className="crumb-link"
                >
                  {isRtl
                    ? (categoryHierarchy.sub.name_ar || categoryHierarchy.sub.name_en)
                    : (categoryHierarchy.sub.name_en || categoryHierarchy.sub.name_ar)}
                </Link>
              </>
            )}

            {isRtl ? <FaChevronLeft className="crumb-sep" /> : <FaChevronRight className="crumb-sep" />}
            <span className="crumb-current">
              {productName}
            </span>
          </nav>

          <button
            type="button"
            onClick={handleShareShortLink}
            className={`pd-simple-share-btn ${copiedShortLink ? 'copied' : ''}`}
            title={isRtl ? 'نسخ رابط مشاركة المنتج' : 'Copy product share link'}
          >
            {copiedShortLink ? <FaCheck size={13} /> : <FaShareNodes size={13} />}
            <span>{copiedShortLink ? (isRtl ? 'تم نسخ الرابط' : 'Link Copied') : (isRtl ? 'مشاركة' : 'Share')}</span>
          </button>
        </div>

        {/* ================= MAIN HERO PRODUCT CARD ================= */}
        <section className="pd-hero-card">
          {/* Media Gallery (Photos + Videos + Hover Zoom Lens) */}
          <AmazonMediaGallery
            product={product}
            discountPercent={discountPercent}
            lang={lang}
          />

          {/* Left Column in RTL: Product Details, Bullet Highlights, Trust Triad & CTA */}
          <div className="pd-info-column">
            <div>
              {/* Brand Header Row */}
              <div className="pd-brand-header">
                <span className="brand-pill">{brandName}</span>
                <div className="brand-logo-box">
                  {product.brand?.logo_url ? (
                    <img src={product.brand.logo_url} alt={brandName} />
                  ) : (
                    <span>{brandName}</span>
                  )}
                </div>
              </div>

              {/* Product Title & SKU */}
              <h1 className="pd-title">
                {productName}
              </h1>

              <div className="pd-sku-subtitle">
                <span>{isRtl ? 'موديل / كود القطعة:' : 'Model / SKU:'}</span>
                <span className="sku-code">{product.sku || product.id}</span>
              </div>

              {/* Rating & Price Row */}
              <div className="pd-rating-price-row">
                <div className="rating-cluster">
                  <div
                    className="stars-row"
                    aria-label={isRtl ? `التقييم ${ratingValue} من 5` : `Rating ${ratingValue} out of 5`}
                  >
                    <FaStar />
                    <FaStar />
                    <FaStar />
                    <FaStar />
                    <FaRegStar />
                  </div>
                  <span className="rating-count">
                    ({ratingValue} {isRtl ? 'تقييمات' : 'reviews'})
                  </span>
                </div>

                <div className="price-cluster">
                  {oldPrice && (
                    <span className="old-price">
                      {oldPrice.toLocaleString()} {currencyLabel}
                    </span>
                  )}
                  <span className="current-price">
                    {currentPrice.toLocaleString()}
                    <small>{currencyLabel}</small>
                  </span>
                </div>
              </div>

              {/* Key Bullet Highlights with Blue Dots */}
              <ul className="pd-key-bullets">
                {heroBullets.map((item, idx) => (
                  <li key={`${item.label}-${idx}`}>
                    <span className="bullet-dot" />
                    <div>
                      <span className="bullet-label">{item.label}:</span>
                      <span className="bullet-val">{item.value}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              {/* 3 Horizontal Feature Cards */}
              <div className="pd-trust-triad">
                <div className="trust-card">
                  <div className="trust-icon">
                    <FaTruckFast />
                  </div>
                  <div className="trust-text">
                    <strong>{isRtl ? 'توصيل سريع' : 'Fast Delivery'}</strong>
                    <span>
                      {isRtl
                        ? 'شحن آمن لجميع المحافظات'
                        : 'Safe nationwide shipping'}
                    </span>
                  </div>
                </div>

                <div className="trust-card">
                  <div className="trust-icon">
                    <FaAward />
                  </div>
                  <div className="trust-text">
                    <strong>{isRtl ? 'تقييم عالي' : 'Top Quality'}</strong>
                    <span>
                      {isRtl ? 'أصلي ومضمون 100%' : '100% Genuine & certified'}
                    </span>
                  </div>
                </div>

                <div className="trust-card">
                  <div className="trust-icon">
                    <FaRotateLeft />
                  </div>
                  <div className="trust-text">
                    <strong>{isRtl ? 'الرجوع عند الإستلام' : 'Easy Returns'}</strong>
                    <span>
                      {isRtl ? 'فحص واسترجاع مرن' : 'Inspect upon receipt & flexible returns'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Primary Order CTA + Quantity + Short Link Share Button */}
              <div className="pd-cta-actions">
                <div
                  className="qty-selector"
                  aria-label={isRtl ? 'تحديد الكمية' : 'Select quantity'}
                >
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    -
                  </button>
                  <span>{quantity}</span>
                  <button type="button" onClick={() => setQuantity((q) => q + 1)}>
                    +
                  </button>
                </div>

                <button
                  type="button"
                  className="order-now-btn"
                  onClick={handleOrderNow}
                >
                  {orderSubmitted ? <FaCircleCheck /> : <FaCartShopping />}
                  <span>
                    {orderSubmitted
                      ? (isRtl ? 'تم تسجيل طلبك بنجاح!' : 'Order Placed Successfully!')
                      : (isRtl ? 'أطلب الآن' : 'Order Now')}
                  </span>
                </button>

                <button
                  type="button"
                  className="share-icon-btn"
                  onClick={handleShareShortLink}
                  title={
                    isRtl
                      ? `مشاركة الرابط القصير ${shortSharePath}`
                      : `Share short link ${shortSharePath}`
                  }
                >
                  <FaShareNodes />
                  <span>{isRtl ? 'مشاركة' : 'Share'}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ================= SMART BUNDLE SHOWCASE (SMOOTH & ADVANCED CARDS) ================= */}
        {activeBundle && bundleCalc.allItems.length > 0 && (
          <section
            className="pd-smart-bundle-card"
            aria-label={isRtl ? 'عرض الباندل المتكامل' : 'Smart Bundle Showcase'}
          >
            <div className="bundle-header-bar">
              <div className="bh-right">
                <div className="bh-title-row">
                  <span className="b-eyebrow">
                    <FaCubes size={12} />
                    <span>{isRtl ? 'باقة توفير ذكية' : 'Smart Value Bundle'}</span>
                  </span>

                  <h2>
                    {isRtl
                      ? (activeBundle.name_ar || activeBundle.name_en)
                      : (activeBundle.name_en || activeBundle.name_ar)}
                  </h2>

                  {activeBundle.is_discount_active && (
                    <span className="b-save-pill">
                      <FaTag size={11} />
                      <span>
                        {isRtl
                          ? `وفّر ${Number(activeBundle.savings_amount || 0).toLocaleString()} ${currencyLabel} (${activeBundle.effective_discount_percent}%)`
                          : `Save ${Number(activeBundle.savings_amount || 0).toLocaleString()} ${currencyLabel} (${activeBundle.effective_discount_percent}%)`}
                      </span>
                    </span>
                  )}

                  {activeBundle.expires_at && !activeBundle.is_discount_expired && (
                    <span className="b-expiry-pill">
                      <span>
                        {isRtl ? 'ساري حتى ' : 'Valid until '}
                        {new Date(activeBundle.expires_at).toLocaleDateString(
                          isRtl ? 'ar-EG' : 'en-US',
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          }
                        )}
                      </span>
                    </span>
                  )}
                </div>

                <p>
                  {isRtl
                    ? (activeBundle.description_ar ||
                        'حدد جميع منتجات الباندل للحصول على السعر النهائي المخفض، أو اختر بعض منتجاتها بالسعر الفردي.')
                    : (activeBundle.description_en ||
                        activeBundle.description_ar ||
                        'Select all bundle products to get the discounted bundle price, or choose individual products at regular prices.')}
                </p>
              </div>

              <div className="bh-select-toggle">
                {!bundleCalc.isFullBundleSelected ? (
                  <button
                    type="button"
                    className="select-all-btn"
                    onClick={handleSelectAllBundleProducts}
                  >
                    <FaCheck size={11} />
                    <span>
                      {isRtl
                        ? `تحديد الباقة كاملة (${bundleCalc.allItems.length} منتجات) لتفعيل الخصم`
                        : `Select full bundle (${bundleCalc.allItems.length} items) to unlock discount`}
                    </span>
                  </button>
                ) : (
                  <span className="all-selected-pill">
                    <FaCircleCheck size={13} />
                    <span>
                      {isRtl
                        ? `خصم الباقة الكاملة مفعّل (${activeBundle.effective_discount_percent}%)`
                        : `Full bundle discount active (${activeBundle.effective_discount_percent}%)`}
                    </span>
                  </span>
                )}
              </div>
            </div>

            <div className="bundle-body-grid">
              {/* Selectable Products Grid (Advanced Compact Cards) */}
              <div className="bundle-items-equation">
                {bundleCalc.allItems.map((item) => {
                  const bProd = item.product;
                  if (!bProd) return null;
                  const isChecked = selectedBundleProdIds.includes(String(item.product_id));
                  const isCurrentProduct = String(item.product_id) === String(product.id);
                  const companionUrl = `/pd/${encodeURIComponent(bProd.id)}/${encodeURIComponent(bProd.slug || bProd.id)}`;
                  const cleanTitle = isRtl
                    ? (bProd.name_ar && !bProd.name_ar.includes('???')
                        ? bProd.name_ar
                        : bProd.name_en || bProd.name_ar)
                    : (bProd.name_en || bProd.name_ar);

                  return (
                    <article
                      key={item.product_id}
                      className={`bundle-prod-selectable-card ${isChecked ? 'selected' : 'unselected'}`}
                      onClick={() => handleToggleBundleProduct(item.product_id)}
                      role="checkbox"
                      aria-checked={isChecked}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleToggleBundleProduct(item.product_id);
                        }
                      }}
                    >
                      {/* Full-bleed Media Stage with Floating Controls */}
                      <div className="bpc-media">
                        <div className="bpc-overlay-top">
                          <div className="bpc-check-group">
                            <div className={`custom-checkbox ${isChecked ? 'checked' : ''}`}>
                              {isChecked && <FaCheck size={11} />}
                            </div>
                            {isCurrentProduct && (
                              <span className="current-prod-badge">
                                {isRtl ? 'المنتج الحالي' : 'Current Item'}
                              </span>
                            )}
                          </div>

                          {!isCurrentProduct && (
                            <Link
                              href={companionUrl}
                              className="companion-link"
                              onClick={(e) => e.stopPropagation()}
                              title={isRtl ? 'فتح صفحة المنتج' : 'View product page'}
                            >
                              <span>{isRtl ? 'معاينة' : 'Preview'}</span>
                              <FaUpRightFromSquare size={9} />
                            </Link>
                          )}
                        </div>

                        <span className="bpc-qty-floating">
                          {isRtl ? `الكمية: ×${item.quantity || 1}` : `Qty: ×${item.quantity || 1}`}
                        </span>

                        <img
                          src={bProd.primary_image || '/assets/placeholder-tech.png'}
                          alt={cleanTitle}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/assets/placeholder-tech.png';
                          }}
                        />
                      </div>

                      {/* Card Body */}
                      <div className="bpc-body">
                        <div className="bpc-meta">
                          <span className="bpc-sku">{bProd.sku || `ID: ${bProd.id}`}</span>
                          <span className={`bpc-inc-tag ${isChecked ? 'on' : 'off'}`}>
                            {isChecked
                              ? (isRtl ? 'مشمول بالباقة' : 'Included')
                              : (isRtl ? 'غير محدد' : 'Unchecked')}
                          </span>
                        </div>

                        <h4 className="bpc-title" title={cleanTitle}>
                          {cleanTitle}
                        </h4>

                        <div className="bpc-foot">
                          <div className="bpc-price-wrap">
                            <span className="unit-price">
                              {Number(item.line_total || item.unit_price || 0).toLocaleString()}
                            </span>
                            <small>{currencyLabel}</small>
                          </div>

                          <span className="bpc-toggle-hint">
                            {isChecked
                              ? (isRtl ? 'إلغاء التحديد' : 'Deselect')
                              : (isRtl ? '+ تحديد للباقة' : '+ Add to bundle')}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Dynamic Bundle Pricing & Add-To-Cart Box */}
              <div className="bundle-checkout-panel">
                <div className="bcp-top-content">
                  <div className="bcp-head">
                    <span>{isRtl ? 'ملخص الباقة المختارة' : 'Bundle Summary'}</span>
                    <strong>
                      {isRtl
                        ? `${bundleCalc.selectedItems.length} من ${bundleCalc.allItems.length} منتجات`
                        : `${bundleCalc.selectedItems.length} of ${bundleCalc.allItems.length} items`}
                    </strong>
                  </div>

                  <div className="bcp-rows">
                    <div className="bcp-line">
                      <span>{isRtl ? 'السعر الفردي للمحدد:' : 'Selected Items Price:'}</span>
                      <span className={bundleCalc.appliedDiscount > 0 ? 'crossed-sum' : ''}>
                        {bundleCalc.selectedOriginalSum.toLocaleString()} {currencyLabel}
                      </span>
                    </div>

                    {activeBundle.is_discount_active && (
                      <div className="bcp-line">
                        <span>
                          {isRtl
                            ? `خصم الباقة (${activeBundle.effective_discount_percent}%):`
                            : `Bundle Discount (${activeBundle.effective_discount_percent}%):`}
                        </span>
                        {bundleCalc.isFullBundleSelected ? (
                          <span className="discount-active-val">
                            -{bundleCalc.appliedDiscount.toLocaleString()} {currencyLabel}
                          </span>
                        ) : (
                          <span className="discount-locked-val">
                            {isRtl ? 'عند تحديد الكل' : 'When all selected'}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="bcp-final-box">
                      <span className="final-lbl">
                        {bundleCalc.isFullBundleSelected
                          ? (isRtl ? 'إجمالي الباقة بعد الخصم:' : 'Total Bundle Price:')
                          : (isRtl ? 'إجمالي المنتجات المحددة:' : 'Total Selected Price:')}
                      </span>
                      <span className="final-num">
                        {bundleCalc.finalPrice.toLocaleString()}
                        <small>{currencyLabel}</small>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bcp-bottom-actions">
                  {activeBundle.is_discount_active && (
                    <div
                      className={`bcp-rule-banner ${
                        bundleCalc.isFullBundleSelected ? 'unlocked' : 'locked'
                      }`}
                    >
                      {bundleCalc.isFullBundleSelected ? (
                        <span>
                          {isRtl ? (
                            <>
                              ✓ تم تفعيل خصم الباقة الحصري وتوفير{' '}
                              <strong>
                                {bundleCalc.appliedDiscount.toLocaleString()} {currencyLabel}
                              </strong>
                            </>
                          ) : (
                            <>
                              ✓ Full bundle discount applied! You saved{' '}
                              <strong>
                                {bundleCalc.appliedDiscount.toLocaleString()} {currencyLabel}
                              </strong>
                            </>
                          )}
                        </span>
                      ) : (
                        <span>
                          {isRtl
                            ? `حدد كل منتجات الباقة (${bundleCalc.allItems.length}) للحصول على السعر المخفض (${Number(activeBundle.effective_bundle_price).toLocaleString()} ${currencyLabel})`
                            : `Select all (${bundleCalc.allItems.length}) items to unlock the discounted price (${Number(activeBundle.effective_bundle_price).toLocaleString()} ${currencyLabel})`}
                        </span>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    className="bcp-add-btn"
                    disabled={bundleCalc.selectedItems.length === 0}
                    onClick={handleAddBundleToCart}
                  >
                    {bundleAddedSuccess ? <FaCircleCheck /> : <FaCartShopping />}
                    <span>
                      {bundleAddedSuccess
                        ? (isRtl ? 'تمت الإضافة للعربة بنجاح!' : 'Added to Cart Successfully!')
                        : bundleCalc.isFullBundleSelected
                          ? (isRtl
                              ? `اطلب الباقة كاملة (${bundleCalc.finalPrice.toLocaleString()} ${currencyLabel})`
                              : `Order Full Bundle (${bundleCalc.finalPrice.toLocaleString()} ${currencyLabel})`)
                          : (isRtl
                              ? `إضافة (${bundleCalc.selectedItems.length}) منتجات للعربة (${bundleCalc.finalPrice.toLocaleString()} ${currencyLabel})`
                              : `Add (${bundleCalc.selectedItems.length}) items to Cart (${bundleCalc.finalPrice.toLocaleString()} ${currencyLabel})`)}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================= INTERACTIVE TABBED DESCRIPTION & FEATURE PILLARS ================= */}
        <section className="pd-details-card">
          <div className="pd-tabs-layout">
            {/* Vertical Tab Navigation */}
            <div className="pd-vertical-tabs" role="tablist">
              {visibleTabs.map((tab) => {
                const label = isRtl
                  ? tab.data?.title_ar ||
                    (tab.key === 'description'
                      ? 'وصف المنتج'
                      : tab.key === 'specs'
                      ? 'المواصفات الفنية'
                      : tab.key === 'features'
                      ? 'المميزات'
                      : 'سياسة الضمان')
                  : tab.data?.title_en ||
                    (tab.key === 'description'
                      ? 'Description'
                      : tab.key === 'specs'
                      ? 'Specifications'
                      : tab.key === 'features'
                      ? 'Features'
                      : 'Warranty Policy');
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.key}
                    className={`v-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <span>{label}</span>
                    {isRtl ? <FaChevronLeft size={12} /> : <FaChevronRight size={12} />}
                  </button>
                );
              })}
            </div>

            {/* Tab Content Panel */}
            <div className="pd-tab-panel">
              {activeTab === 'description' && (
                <>
                  <h3 className="panel-heading">
                    {isRtl
                      ? (showcaseData.tabs.description.heading_ar || 'وصف المنتج')
                      : (showcaseData.tabs.description.heading_en || 'Product Description')}
                  </h3>
                  <div className="panel-prose" style={{ whiteSpace: 'pre-line' }}>
                    {isRtl
                      ? (showcaseData.tabs.description.content_ar?.trim() ||
                          product.description_ar ||
                          product.short_desc_ar ||
                          `يُعد ${productName} من الحلول الاحترافية المتقدمة المصممة لتلبية متطلبات الشركات والمؤسسات العصرية بكفاءة واعتمادية عالية. يجمع الجهاز بين الأداء الفائق وسهولة الإدارة الذكية مع معايير حماية وأمان متطورة لضمان استمرارية العمل على مدار الساعة دون انقطاع.`)
                      : (showcaseData.tabs.description.content_en?.trim() ||
                          product.description_en ||
                          product.short_desc_en ||
                          product.description_ar ||
                          `${productName} is an advanced professional solution engineered to meet modern enterprise demands with high performance and reliability. It combines superior efficiency and smart management with robust security features to ensure uninterrupted operation.`)}
                  </div>
                </>
              )}

              {activeTab === 'specs' && (
                <>
                  <h3 className="panel-heading">
                    {isRtl
                      ? (showcaseData.tabs.specs.heading_ar || 'ملخص المواصفات الفنية الدقيقة')
                      : (showcaseData.tabs.specs.heading_en || 'Technical Specifications Summary')}
                  </h3>
                  <div className="panel-prose" style={{ whiteSpace: 'pre-line' }}>
                    {isRtl
                      ? (showcaseData.tabs.specs.content_ar ||
                          `تم تصميم هذا الطراز (${product.sku || product.id}) وفق أحدث المعايير العالمية مع توافق كامل مع البنية التحتية الرقمية الحديثة. يمكنك استعراض جدول المواصفات الفنية الكامل بالأسفل لمعرفة كافة التفاصيل الهندسية والفيزيائية.`)
                      : (showcaseData.tabs.specs.content_en ||
                          `Engineered according to international industry standards, model (${product.sku || product.id}) integrates seamlessly with modern digital infrastructure. Explore the comprehensive specifications table below for full physical and electrical details.`)}
                  </div>
                </>
              )}

              {activeTab === 'features' && (
                <>
                  <h3 className="panel-heading">
                    {isRtl
                      ? (showcaseData.tabs.features.heading_ar || 'أبرز المميزات التنافسية')
                      : (showcaseData.tabs.features.heading_en || 'Key Competitive Features')}
                  </h3>
                  <div className="panel-prose">
                    {Array.isArray(showcaseData.tabs.features.bullet_points) &&
                    showcaseData.tabs.features.bullet_points.length > 0 ? (
                      <ul
                        style={{
                          paddingRight: isRtl ? '1.25rem' : 0,
                          paddingLeft: isRtl ? 0 : '1.25rem',
                          margin: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.45rem',
                        }}
                      >
                        {showcaseData.tabs.features.bullet_points.map((pt, idx) => (
                          <li key={idx} style={{ listStyleType: 'disc' }}>
                            {typeof pt === 'object'
                              ? isRtl
                                ? (pt.ar || pt.en)
                                : (pt.en || pt.ar)
                              : pt}
                          </li>
                        ))}
                      </ul>
                    ) : Array.isArray(product.specifications) && product.specifications.length > 0 ? (
                      <ul
                        style={{
                          paddingRight: isRtl ? '1.25rem' : 0,
                          paddingLeft: isRtl ? 0 : '1.25rem',
                          margin: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.45rem',
                        }}
                      >
                        {product.specifications
                          .filter((s) => (s.key && s.key.trim()) || (s.value && s.value.trim()))
                          .map((spec, sIdx) => {
                            const specKey = isRtl
                              ? (spec.key_ar || spec.key || spec.key_en)
                              : (spec.key_en || spec.key || spec.key_ar);
                            const specVal = isRtl
                              ? (spec.value_ar || spec.value || spec.value_en)
                              : (spec.value_en || spec.value || spec.value_ar);
                            return (
                              <li key={sIdx} style={{ listStyleType: 'disc' }}>
                                <strong>{specKey}:</strong> {specVal}
                              </li>
                            );
                          })}
                      </ul>
                    ) : (
                      <div style={{ whiteSpace: 'pre-line' }}>
                        {isRtl
                          ? `• كفاءة تشغيلية عالية واستقرار مستمر في بيئات العمل المكثفة.\n• سهولة التركيب والربط المباشر مع الأنظمة والشبكات الحالية.\n• استهلاك ذكي للطاقة مع حماية متكاملة ضد تقلبات التيار.\n• تصميم هندسي متين يدعم التشغيل الطويل والأحمال العالية.`
                          : `• High operational efficiency and stability in continuous enterprise environments.\n• Seamless integration and direct plug-and-play with existing networks.\n• Smart power consumption with advanced electrical surge protection.\n• Robust engineering designed for extended lifecycles and peak workloads.`}
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeTab === 'warranty' && (
                <>
                  <h3 className="panel-heading">
                    {isRtl
                      ? (showcaseData.tabs.warranty.heading_ar || 'سياسة الضمان والدعم الفني المعتمد')
                      : (showcaseData.tabs.warranty.heading_en || 'Warranty & Certified Support Policy')}
                  </h3>
                  <div className="panel-prose" style={{ whiteSpace: 'pre-line' }}>
                    {isRtl
                      ? (showcaseData.tabs.warranty.content_ar ||
                          'يأتي المنتج بضمان رسمي معتمد من ترند لاين والوكيل المحلي، مع إمكانية الفحص والمعاينة عند الاستلام، وسياسة استبدال واسترجاع مرنة خلال 14 يوماً، بالإضافة إلى دعم فني متخصص للمساعدة في الإعداد والتشغيل.')
                      : (showcaseData.tabs.warranty.content_en ||
                          'Backed by official authorized warranty from Trendline and certified local agents, featuring inspection upon receipt, flexible 14-day return and replacement policy, and 24/7 technical customer support.')}
                  </div>
                </>
              )}

              {/* Feature Pillar Cards + Brand Series Box */}
              <div className="pd-pillars-and-series">
                <div className="pillars-grid">
                  {(showcaseData.pillars || []).map((pillar, idx) => (
                    <div key={idx} className="pillar-card">
                      <div className="pillar-icon">
                        {renderPillarIcon(pillar.icon)}
                      </div>
                      <strong>
                        {isRtl
                          ? (pillar.title_ar || pillar.title_en)
                          : (pillar.title_en || pillar.title_ar)}
                      </strong>
                      <span>
                        {isRtl
                          ? (pillar.subtitle_ar || pillar.subtitle_en)
                          : (pillar.subtitle_en || pillar.subtitle_ar)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="series-showcase-box">
                  <div className="series-info">
                    <span className="series-brand">{brandName}</span>
                    <h5>{product.sku || product.id} Series</h5>
                    <p>
                      {isRtl
                        ? (categoryHierarchy.sub?.name_ar ||
                            categoryHierarchy.root?.name_ar ||
                            'الجيل الاحترافي المعتمد للمؤسسات')
                        : (categoryHierarchy.sub?.name_en ||
                            categoryHierarchy.root?.name_en ||
                            'Enterprise Certified Series')}
                    </p>
                  </div>
                  <img
                    src={galleryImages[0] || '/assets/placeholder-tech.png'}
                    alt={productName}
                    className="series-thumb"
                    onError={(e) => {
                      e.currentTarget.src = '/assets/placeholder-tech.png';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FULL TWO-COLUMN SPECIFICATIONS TABLE ================= */}
        <section className="pd-specs-card">
          <div className="specs-card-header">
            <h3>
              <span className="header-icon">
                <FaSliders />
              </span>
              <span>
                {isRtl ? 'جدول المواصفات الفنية الكامل' : 'Complete Technical Specifications Table'}
              </span>
            </h3>
            <span className="specs-badge">
              {specificationRows.length} {isRtl ? 'مواصفة قياسية' : 'Standard Specifications'}
            </span>
          </div>

          <div className="specs-table-wrapper">
            {specificationRows.map((row, idx) => (
              <div className="spec-row" key={`${row.label}-${idx}`}>
                <div className="spec-key">
                  <span className="spec-icon-circle">{getSpecRowIcon(row.label, idx)}</span>
                  <span>{row.label}</span>
                </div>
                <div className="spec-value">{row.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= SMART RECOMMENDATIONS & SIMILAR PRODUCTS CAROUSEL ================= */}
        {(relatedProducts.length > 0 ||
          recentlyViewedProducts.length > 0 ||
          interestProducts.length > 0) && (
          <section className="pd-related-section">
            <div className="related-header">
              <div className="rh-titles-and-tabs">
                <div className="rh-title-line">
                  <h3>{isRtl ? 'منتجات مشابهة قد تهمك' : 'Similar Products You Might Like'}</h3>
                  <span className="rh-sub-pill">
                    <FaWandMagicSparkles size={11} />
                    <span>
                      {isRtl
                        ? 'توصيات ذكية حسب القسم واهتماماتك'
                        : 'Smart recommendations by category & interests'}
                    </span>
                  </span>
                </div>

                <div className="rh-filter-tabs" role="tablist">
                  <button
                    type="button"
                    className={`rh-tab ${recFilterTab === 'all' ? 'active' : ''}`}
                    onClick={() => setRecFilterTab('all')}
                  >
                    <span>{isRtl ? 'مقترحة لك' : 'Recommended'}</span>
                  </button>

                  <button
                    type="button"
                    className={`rh-tab ${recFilterTab === 'similar' ? 'active' : ''}`}
                    onClick={() => setRecFilterTab('similar')}
                  >
                    <FaLayerGroup size={11} />
                    <span>
                      {isRtl
                        ? `منتجات مشابهة (${relatedProducts.length})`
                        : `Similar Products (${relatedProducts.length})`}
                    </span>
                  </button>

                  {recentlyViewedProducts.length > 0 && (
                    <button
                      type="button"
                      className={`rh-tab ${recFilterTab === 'visited' ? 'active' : ''}`}
                      onClick={() => setRecFilterTab('visited')}
                    >
                      <FaClockRotateLeft size={11} />
                      <span>
                        {isRtl
                          ? `تمت زيارتها مؤخراً (${recentlyViewedProducts.length})`
                          : `Recently Viewed (${recentlyViewedProducts.length})`}
                      </span>
                    </button>
                  )}

                  {interestProducts.length > 0 && (
                    <button
                      type="button"
                      className={`rh-tab ${recFilterTab === 'interests' ? 'active' : ''}`}
                      onClick={() => setRecFilterTab('interests')}
                    >
                      <FaBolt size={11} />
                      <span>{isRtl ? 'حسب اهتماماتك' : 'Your Interests'}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="rh-actions">
                <div className="carousel-nav-btns">
                  <button
                    type="button"
                    className="c-nav-btn"
                    onClick={() => handleScrollCarousel('prev')}
                    title={isRtl ? 'السابق' : 'Previous'}
                    aria-label={isRtl ? 'السابق' : 'Previous'}
                  >
                    <FaChevronRight size={13} />
                  </button>
                  <button
                    type="button"
                    className="c-nav-btn"
                    onClick={() => handleScrollCarousel('next')}
                    title={isRtl ? 'التالي' : 'Next'}
                    aria-label={isRtl ? 'التالي' : 'Next'}
                  >
                    <FaChevronLeft size={13} />
                  </button>
                </div>

                {categoryHierarchy.root && (
                  <Link
                    href={`/categories/${encodeURIComponent(categoryHierarchy.root.id)}/${encodeURIComponent(categoryHierarchy.root.slug || categoryHierarchy.root.id)}`}
                    className="view-all-link"
                  >
                    <span>{isRtl ? 'عرض كل منتجات القسم' : 'View All In Category'}</span>
                    {isRtl ? <FaChevronLeft size={11} /> : <FaChevronRight size={11} />}
                  </Link>
                )}
              </div>
            </div>

            {/* Horizontal Carousel Track with Compact Traditional Product Cards */}
            <div className="pd-recommendations-carousel" ref={carouselTrackRef}>
              {carouselProducts.map((rel) => (
                <StoreProductCard
                  key={rel.id}
                  product={rel}
                  lang={lang}
                  className="compact-carousel-card"
                  onShareClick={handleShareCardShortLink}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <Footer lang={lang} />
    </div>
  );
}

export default function ProductDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="pd-page-wrapper" dir="rtl">
          <div className="pd-container" style={{ paddingTop: '64px', textAlign: 'center' }}>
            <p style={{ fontSize: '18px', fontWeight: 800, color: '#1e40af' }}>
              جاري تحميل صفحة المنتج...
            </p>
          </div>
        </div>
      }
    >
      <ProductDetailsContent />
    </Suspense>
  );
}
