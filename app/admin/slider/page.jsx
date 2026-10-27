'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getApiHost } from '@/src/utils/apiConfig';
import {
  AdminSidebar,
  AdminHeader,
  AdminStatsCard,
  AdminModal,
  CustomSelect,
  useToast,
} from '@/src/components/adminComponents';
import {
  FaFloppyDisk,
  FaLightbulb,
  FaEye,
  FaTruckFast,
  FaCreditCard,
  FaLaptop,
  FaFolder,
  FaBox,
  FaPlus,
  FaPalette,
  FaMoon,
  FaSun,
  FaWandMagicSparkles,
  FaTrashCan,
  FaTag,
  FaCircleCheck,
  FaSliders,
  FaGem,
  FaCloudArrowUp,
  FaArrowUp,
  FaArrowDown,
  FaPenToSquare,
  FaRotate,
  FaCheck,
  FaArrowRight,
  FaArrowLeft,
  FaCircleInfo,
  FaImages,
  FaDesktop,
  FaTabletScreenButton,
  FaMobileScreenButton,
  FaGear,
  FaLayerGroup,
  FaCrosshairs,
  FaMagnifyingGlassPlus,
  FaCropSimple,
  FaExpand,
  FaCircleDot,
  FaSpinner,
  FaImage,
} from 'react-icons/fa6';
import { formatFactory, formatBytes } from '@/src/utils/formatFactory';
import HeroSlider from '@/src/components/homeComponents/HeroSlider/HeroSlider';
import ImageSlider from '@/src/components/homeComponents/ImageSlider/ImageSlider';
import './SliderManagement.scss';

export default function AdminSliderPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const toast = useToast();
  const [mounted, setMounted] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lang, setLang] = useState('ar');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Active navigation tab: 'display_controls' | 'image_slider' | 'store_slider'
  const [activeTab, setActiveTab] = useState('display_controls');

  // Global Slider Settings State
  const [displayMode, setDisplayMode] = useState('both'); // 'both' | 'store_only' | 'image_only' | 'none'
  const [sliderOrder, setSliderOrder] = useState('image_first'); // 'image_first' | 'store_first'
  const [imageConfig, setImageConfig] = useState({
    autoplay: true,
    autoplay_speed: 4000,
    height: 460,
    full_width: true,
    show_arrows: true,
    arrow_style: 'minimal',
    show_dots: true,
    border_radius: 16,
    show_overlay_text: false,
    image_fit: 'cover',
    image_zoom: 100,
    overlay_opacity: 0.25,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [hasUnsavedSettings, setHasUnsavedSettings] = useState(false);

  // Live Preview Settings
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'

  // Banners, Categories, Products
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);
  const [hasUnsavedOrder, setHasUnsavedOrder] = useState(false);

  // Split Banners into Hero Store Cards & Image Banners
  const heroBanners = useMemo(() => {
    return banners.filter((b) => b.placement === 'hero_vertical_slider' || !b.placement);
  }, [banners]);

  const imageBanners = useMemo(() => {
    return banners.filter((b) => b.placement === 'image_slider');
  }, [banners]);

  // Drag & Drop State for Store Cards
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Modal State for Store Hero Cards
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  // Form State for Store Hero Cards
  const [linkMode, setLinkMode] = useState('category'); // 'category' | 'product' | 'custom'
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [formData, setFormData] = useState({
    title_ar: '',
    title_en: '',
    subtitle_ar: '',
    subtitle_en: '',
    badge_text_ar: '',
    badge_text_en: '',
    image_url: '',
    bg_style: 'card-white-glass',
    button_text_ar: 'تسوق الآن',
    button_text_en: 'Shop Now',
    target_url: '',
    sort_order: 1,
    is_active: true,
    placement: 'hero_vertical_slider',
  });

  // Modal State for Image Slider Slides
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [editingImageBanner, setEditingImageBanner] = useState(null);
  const [imageFormData, setImageFormData] = useState({
    title_ar: '',
    title_en: '',
    subtitle_ar: '',
    subtitle_en: '',
    image_url: '/assets/slider/setup-workspace.png',
    button_text_ar: 'تسوق الآن',
    button_text_en: 'Shop Now',
    target_url: '',
    sort_order: 1,
    is_active: true,
    placement: 'image_slider',
    // Advanced Framing & Focal Point Fields
    image_position_x: 50,
    image_position_y: 50,
    image_fit: 'cover', // 'cover' | 'contain'
    image_zoom: 100, // 80 - 160%
    overlay_opacity: 0.25,
    blur_backdrop: false,
  });
  const [imageLinkMode, setImageLinkMode] = useState('category');
  const [imageSelectedCatId, setImageSelectedCatId] = useState('');
  const [imageSelectedProdId, setImageSelectedProdId] = useState('');

  // Advanced Theme & Finish Studio State for Store Cards
  const [themeMode, setThemeMode] = useState('preset');
  const [presetStyle, setPresetStyle] = useState('card-white-glass');
  const [solidColor, setSolidColor] = useState('#0057C2');
  const [gradientColor1, setGradientColor1] = useState('#0057C2');
  const [gradientColor2, setGradientColor2] = useState('#0f172a');
  const [gradientAngle, setGradientAngle] = useState(135);
  const [cardFinish, setCardFinish] = useState('glass');
  const [textColorMode, setTextColorMode] = useState('auto');
  const [customTextColor, setCustomTextColor] = useState('#ffffff');
  const [modalPreviewLang, setModalPreviewLang] = useState('ar');

  // Media / formatFactory State
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStats, setUploadStats] = useState(null);
  const fileInputRef = useRef(null);
  const imageSliderFileInputRef = useRef(null);

  const isRtl = lang === 'ar';

  // Dynamic preview banner list including unsaved modal edits for 100% true live preview
  const previewImageBanners = useMemo(() => {
    if (isImageModalOpen && editingImageBanner) {
      return imageBanners.map((b) => {
        if (b.id === editingImageBanner.id) {
          return {
            ...b,
            ...imageFormData,
            highlights_json: {
              image_position_x: imageFormData.image_position_x,
              image_position_y: imageFormData.image_position_y,
              image_fit: imageFormData.image_fit,
              image_zoom: imageFormData.image_zoom,
              overlay_opacity: imageFormData.overlay_opacity,
              blur_backdrop: imageFormData.blur_backdrop,
            },
          };
        }
        return b;
      });
    }
    return imageBanners;
  }, [imageBanners, isImageModalOpen, editingImageBanner, imageFormData]);

  // Real-time computed mockup visual style for Store Card Modal
  const computedCardStyle = useMemo(() => {
    let background = 'rgba(255, 255, 255, 0.95)';
    let color = '#0f172a';

    if (themeMode === 'gradient') {
      background = `linear-gradient(${gradientAngle}deg, ${gradientColor1} 0%, ${gradientColor2} 100%)`;
      color = textColorMode === 'dark' ? '#0f172a' : (textColorMode === 'custom' ? customTextColor : '#ffffff');
    } else if (themeMode === 'solid') {
      background = solidColor;
      color = textColorMode === 'light' ? '#ffffff' : (textColorMode === 'custom' ? customTextColor : '#0f172a');
    } else {
      if (presetStyle === 'card-primary-cta') {
        background = 'linear-gradient(145deg, #0057C2 0%, #003c88 100%)';
        color = '#ffffff';
      } else if (presetStyle === 'card-bank-promo') {
        background = 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)';
        color = '#ffffff';
      } else if (presetStyle === 'card-cyber-purple') {
        background = 'linear-gradient(135deg, #6366f1 0%, #312e81 100%)';
        color = '#ffffff';
      } else if (presetStyle === 'card-neon-emerald') {
        background = 'linear-gradient(135deg, #059669 0%, #064e3b 100%)';
        color = '#ffffff';
      } else if (presetStyle === 'card-sunset-coral') {
        background = 'linear-gradient(135deg, #ea580c 0%, #991b1b 100%)';
        color = '#ffffff';
      } else {
        background = 'rgba(255, 255, 255, 0.95)';
        color = '#0f172a';
      }
    }

    return { background, color };
  }, [themeMode, presetStyle, solidColor, gradientColor1, gradientColor2, gradientAngle, textColorMode, customTextColor]);

  const categorySelectOptions = useMemo(() => {
    return categories.map((c) => ({
      value: String(c.id),
      label: isRtl ? (c.name_ar || c.name) : (c.name_en || c.name),
      icon_url: c.icon_url,
      image_url: c.image_url,
      idBadge: c.id,
      badge: `/${c.slug}`,
    }));
  }, [categories, isRtl]);

  const productSelectOptions = useMemo(() => {
    return products.map((p) => ({
      value: String(p.id),
      label: isRtl ? (p.name_ar || p.name) : (p.name_en || p.name),
      image_url: p.main_image || p.image_url,
      badge: p.sku ? `SKU: ${p.sku}` : undefined,
    }));
  }, [products, isRtl]);

  // Helper: Get Auth Token
  const ensureAuthToken = async () => {
    if (typeof window === 'undefined') return '';
    let token = localStorage.getItem('trendline_admin_token');
    if (token) return token;

    try {
      const res = await fetch('/api/auth/token');
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('trendline_admin_token', data.token);
          return data.token;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch auth token', e);
    }
    return '';
  };

  // Auth protection check
  useEffect(() => {
    const hasTokenCookie = document.cookie
      .split('; ')
      .some((row) => row.startsWith('token=') || row.startsWith('trendline_token=') || row.startsWith('next-auth.session-token='));
    const localUser = localStorage.getItem('trendline_admin_user');

    if (!hasTokenCookie && status === 'unauthenticated' && !localUser) {
      router.replace('/admin/login');
      return;
    }

    if (localUser) {
      try {
        setAdminUser(JSON.parse(localUser));
      } catch (e) {
        console.error(e);
      }
    } else if (session?.user) {
      setAdminUser(session.user);
    }
  }, [status, router, session]);

  // Fetch Banners, Categories, Products, and CMS Settings
  const fetchData = async () => {
    try {
      setLoading(true);
      const apiHost = getApiHost();

      const [bannersRes, catsRes, prodsRes, settingsRes] = await Promise.all([
        fetch(`${apiHost}/api/v1/cms/banners?all=true`, { cache: 'no-store' }),
        fetch(`${apiHost}/api/v1/catalog/categories`, { cache: 'no-store' }),
        fetch(`${apiHost}/api/v1/catalog/products?limit=50`, { cache: 'no-store' }),
        fetch(`${apiHost}/api/v1/cms/settings`, { cache: 'no-store' }),
      ]);

      if (bannersRes.ok) {
        const bannersJson = await bannersRes.json();
        if (bannersJson.success) setBanners(bannersJson.data || []);
      }
      if (catsRes.ok) {
        const catsJson = await catsRes.json();
        if (catsJson.success) setCategories(catsJson.data || []);
      }
      if (prodsRes.ok) {
        const prodsJson = await prodsRes.json();
        if (prodsJson.success) setProducts(prodsJson.data || []);
      }
      if (settingsRes.ok) {
        const settingsJson = await settingsRes.json();
        if (settingsJson.success && settingsJson.data) {
          if (settingsJson.data.slider_display_mode) {
            setDisplayMode(settingsJson.data.slider_display_mode);
          }
          if (settingsJson.data.slider_order) {
            setSliderOrder(settingsJson.data.slider_order);
          }
          if (settingsJson.data.image_slider_config) {
            try {
              const parsed = JSON.parse(settingsJson.data.image_slider_config);
              setImageConfig((prev) => ({ ...prev, ...parsed }));
            } catch (e) {
              console.warn('Failed to parse image_slider_config:', e);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load slider data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ---------------- Save Master Slider Settings ----------------
  const handleSaveMasterSettings = async (overrideMode, overrideOrder, overrideConfig) => {
    try {
      setSavingSettings(true);
      const token = await ensureAuthToken();
      const apiHost = getApiHost();

      const modeToSave = overrideMode || displayMode;
      const orderToSave = overrideOrder || sliderOrder;
      const configToSave = overrideConfig || imageConfig;

      const payload = {
        settings: [
          { setting_key: 'slider_display_mode', setting_value_common: modeToSave },
          { setting_key: 'slider_order', setting_value_common: orderToSave },
          { setting_key: 'image_slider_config', setting_value_common: JSON.stringify(configToSave) },
        ],
      };

      const res = await fetch(`${apiHost}/api/v1/cms/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setHasUnsavedSettings(false);
        toast.success(
          isRtl ? 'تم حفظ إعدادات وتوجل السلايدر بنجاح وتحديث المتجر فورا!' : 'Slider settings saved and applied to storefront!',
          isRtl ? 'إعدادات السلايدر' : 'Settings Saved'
        );
      } else {
        toast.error(json.message || (isRtl ? 'فشل حفظ الإعدادات' : 'Failed to save settings'));
      }
    } catch (err) {
      console.error(err);
      toast.error(isRtl ? 'حدث خطأ أثناء حفظ الإعدادات' : 'Error saving settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // ---------------- Drag & Drop Handlers for Store Cards ----------------
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...heroBanners];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    const reordered = updated.map((item, idx) => ({
      ...item,
      sort_order: idx + 1,
    }));

    setBanners((prev) => {
      const nonHero = prev.filter((b) => b.placement === 'image_slider');
      return [...reordered, ...nonHero];
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
    setHasUnsavedOrder(true);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Move Up / Down Accessible Buttons for Store Cards
  const moveCard = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= heroBanners.length) return;

    const updated = [...heroBanners];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    const reordered = updated.map((item, idx) => ({
      ...item,
      sort_order: idx + 1,
    }));

    setBanners((prev) => {
      const nonHero = prev.filter((b) => b.placement === 'image_slider');
      return [...reordered, ...nonHero];
    });

    setHasUnsavedOrder(true);
  };

  // Move Up / Down Accessible Buttons for Image Slides
  const moveImageSlide = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= imageBanners.length) return;

    const updated = [...imageBanners];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    const reordered = updated.map((item, idx) => ({
      ...item,
      sort_order: idx + 1,
    }));

    setBanners((prev) => {
      const nonImage = prev.filter((b) => b.placement !== 'image_slider');
      return [...nonImage, ...reordered];
    });

    setHasUnsavedOrder(true);
  };

  // Save Store Cards Order to Backend
  const handleSaveOrder = async () => {
    try {
      setSavingOrder(true);
      const token = await ensureAuthToken();
      const apiHost = getApiHost();

      const items = heroBanners.map((b, idx) => ({ id: b.id, sort_order: idx + 1 }));

      const res = await fetch(`${apiHost}/api/v1/cms/banners/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
      });

      const json = await res.json();
      if (json.success) {
        setHasUnsavedOrder(false);
        toast.success(
          isRtl ? 'تم حفظ الترتيب الجديد لكروت المتجر بنجاح!' : 'Store cards order saved successfully!',
          isRtl ? 'حفظ الترتيب' : 'Order Updated'
        );
      } else {
        toast.error(json.message || (isRtl ? 'فشل حفظ الترتيب' : 'Failed to save order'));
      }
    } catch (err) {
      console.error(err);
      toast.error(isRtl ? 'حدث خطأ أثناء حفظ الترتيب' : 'Error saving order');
    } finally {
      setSavingOrder(false);
    }
  };

  // Toggle Active for Any Banner
  const handleToggleActive = async (banner) => {
    try {
      const token = await ensureAuthToken();
      const apiHost = getApiHost();

      const nextStatus = !banner.is_active;
      const res = await fetch(`${apiHost}/api/v1/cms/banners/${banner.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: nextStatus }),
      });

      if (res.ok) {
        setBanners(banners.map((b) => (b.id === banner.id ? { ...b, is_active: nextStatus } : b)));
        toast.info(
          nextStatus
            ? (isRtl ? 'تم تفعيل ظهور العنصر بنجاح' : 'Slide activated')
            : (isRtl ? 'تم إخفاء العنصر بنجاح' : 'Slide deactivated'),
          isRtl ? 'حالة الظهور' : 'Status Updated'
        );
      }
    } catch (err) {
      console.error(err);
      toast.error(isRtl ? 'فشل تحديث حالة العنصر' : 'Failed to toggle status');
    }
  };

  // ---------------- Open Modal: Store Card ----------------
  const handleOpenAddStoreCard = () => {
    setEditingBanner(null);
    setFormData({
      title_ar: '',
      title_en: '',
      subtitle_ar: '',
      subtitle_en: '',
      badge_text_ar: '',
      badge_text_en: '',
      image_url: '',
      bg_style: 'card-white-glass',
      button_text_ar: 'تسوق الآن',
      button_text_en: 'Shop Now',
      target_url: '',
      sort_order: heroBanners.length + 1,
      is_active: true,
      placement: 'hero_vertical_slider',
    });
    setLinkMode('category');
    setSelectedCategoryId(categories[0]?.id ? String(categories[0].id) : '');
    setSelectedProductId('');
    setImagePreview('');
    setUploadStats(null);
    setThemeMode('preset');
    setPresetStyle('card-white-glass');
    setSolidColor('#0057C2');
    setGradientColor1('#0057C2');
    setGradientColor2('#0f172a');
    setGradientAngle(135);
    setCardFinish('glass');
    setTextColorMode('auto');
    setIsModalOpen(true);
  };

  const handleOpenEditStoreCard = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title_ar: banner.title_ar || '',
      title_en: banner.title_en || '',
      subtitle_ar: banner.subtitle_ar || '',
      subtitle_en: banner.subtitle_en || '',
      badge_text_ar: banner.badge_text_ar || '',
      badge_text_en: banner.badge_text_en || '',
      image_url: banner.image_url || '',
      bg_style: banner.bg_style || 'card-white-glass',
      button_text_ar: banner.button_text_ar || 'تسوق الآن',
      button_text_en: banner.button_text_en || 'Shop Now',
      target_url: banner.target_url || '',
      sort_order: banner.sort_order || 1,
      is_active: banner.is_active !== false,
      placement: 'hero_vertical_slider',
    });

    setImagePreview(banner.image_url || '');
    setUploadStats(null);

    // Parse background style
    if (banner.bg_style && banner.bg_style.startsWith('custom:')) {
      try {
        const parsed = JSON.parse(banner.bg_style.replace('custom:', ''));
        if (parsed.type === 'gradient') {
          setThemeMode('gradient');
          setGradientColor1(parsed.color1 || '#0057C2');
          setGradientColor2(parsed.color2 || '#0f172a');
          setGradientAngle(parsed.angle || 135);
        } else if (parsed.type === 'solid') {
          setThemeMode('solid');
          setSolidColor(parsed.color || '#0057C2');
        } else {
          setThemeMode('preset');
          setPresetStyle(parsed.preset || 'card-white-glass');
        }
        setCardFinish(parsed.finish || 'glass');
        if (parsed.textColor) {
          setTextColorMode(parsed.textColor === '#ffffff' ? 'light' : (parsed.textColor === '#0f172a' ? 'dark' : 'custom'));
          setCustomTextColor(parsed.textColor);
        }
      } catch (e) {
        setThemeMode('preset');
        setPresetStyle(banner.bg_style);
      }
    } else {
      setThemeMode('preset');
      setPresetStyle(banner.bg_style || 'card-white-glass');
      setCardFinish('glass');
      setTextColorMode('auto');
    }

    if (banner.target_url && banner.target_url.startsWith('/categories/')) {
      setLinkMode('category');
      const slug = banner.target_url.replace('/categories/', '');
      const matched = categories.find((c) => c.slug === slug);
      if (matched) setSelectedCategoryId(String(matched.id));
    } else if (banner.target_url && banner.target_url.startsWith('/products/')) {
      setLinkMode('product');
      const slug = banner.target_url.replace('/products/', '');
      const matched = products.find((p) => p.slug === slug || String(p.id) === slug);
      if (matched) setSelectedProductId(String(matched.id));
    } else {
      setLinkMode('custom');
    }

    setIsModalOpen(true);
  };

  // ---------------- Open Modal: Image Slider Banner with Focal Point Studio ----------------
  const handleOpenAddImageSlide = () => {
    setEditingImageBanner(null);
    setImageFormData({
      title_ar: '',
      title_en: '',
      subtitle_ar: '',
      subtitle_en: '',
      image_url: '/assets/slider/setup-workspace.png',
      button_text_ar: 'تسوق الآن',
      button_text_en: 'Shop Now',
      target_url: '',
      sort_order: imageBanners.length + 1,
      is_active: true,
      placement: 'image_slider',
      image_position_x: 50,
      image_position_y: 50,
      image_fit: 'cover',
      image_zoom: 100,
      overlay_opacity: 0.2,
      blur_backdrop: false,
    });
    setImageLinkMode('custom');
    setImageSelectedCatId('');
    setImageSelectedProdId('');
    setIsImageModalOpen(true);
  };

  const handleOpenEditImageSlide = (banner) => {
    setEditingImageBanner(banner);
    const meta = banner.highlights_json || {};

    setImageFormData({
      title_ar: banner.title_ar || '',
      title_en: banner.title_en || '',
      subtitle_ar: banner.subtitle_ar || '',
      subtitle_en: banner.subtitle_en || '',
      image_url: banner.image_url || '/assets/slider/setup-workspace.png',
      button_text_ar: banner.button_text_ar || 'تسوق الآن',
      button_text_en: banner.button_text_en || 'Shop Now',
      target_url: banner.target_url || '',
      sort_order: banner.sort_order || 1,
      is_active: banner.is_active !== false,
      placement: 'image_slider',
      image_position_x: meta.image_position_x !== undefined ? Number(meta.image_position_x) : 50,
      image_position_y: meta.image_position_y !== undefined ? Number(meta.image_position_y) : 50,
      image_fit: meta.image_fit || 'cover',
      image_zoom: meta.image_zoom !== undefined ? Number(meta.image_zoom) : 100,
      overlay_opacity: meta.overlay_opacity !== undefined ? Number(meta.overlay_opacity) : 0.25,
      blur_backdrop: Boolean(meta.blur_backdrop),
    });

    if (banner.target_url && banner.target_url.startsWith('/categories/')) {
      setImageLinkMode('category');
      const slug = banner.target_url.replace('/categories/', '');
      const matched = categories.find((c) => c.slug === slug);
      if (matched) setImageSelectedCatId(String(matched.id));
    } else if (banner.target_url && banner.target_url.startsWith('/products/')) {
      setImageLinkMode('product');
      const slug = banner.target_url.replace('/products/', '');
      const matched = products.find((p) => p.slug === slug || String(p.id) === slug);
      if (matched) setImageSelectedProdId(String(matched.id));
    } else {
      setImageLinkMode('custom');
    }

    setIsImageModalOpen(true);
  };

  // Interactive Focal Point Smooth Drag & Precision Handlers
  const [isDraggingPin, setIsDraggingPin] = useState(false);

  const updateCoordinatesFromPointer = (clientX, clientY, targetRect) => {
    if (!targetRect || targetRect.width === 0 || targetRect.height === 0) return;
    const x = Math.round(((clientX - targetRect.left) / targetRect.width) * 100);
    const y = Math.round(((clientY - targetRect.top) / targetRect.height) * 100);
    setImageFormData((prev) => ({
      ...prev,
      image_position_x: Math.max(0, Math.min(100, x)),
      image_position_y: Math.max(0, Math.min(100, y)),
    }));
  };

  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingPin(true);
    const rect = e.currentTarget.getBoundingClientRect();
    updateCoordinatesFromPointer(e.clientX, e.clientY, rect);
  };

  const handlePointerMove = (e) => {
    if (!isDraggingPin) return;
    const rect = e.currentTarget.getBoundingClientRect();
    updateCoordinatesFromPointer(e.clientX, e.clientY, rect);
  };

  const handlePointerUp = (e) => {
    if (isDraggingPin) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {}
      setIsDraggingPin(false);
    }
  };

  const handleWheelZoom = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 5 : -5;
    setImageFormData((prev) => ({
      ...prev,
      image_zoom: Math.max(80, Math.min(160, (prev.image_zoom || 100) + delta)),
    }));
  };

  const nudgePosition = (deltaX, deltaY) => {
    setImageFormData((prev) => ({
      ...prev,
      image_position_x: Math.max(0, Math.min(100, (prev.image_position_x ?? 50) + deltaX)),
      image_position_y: Math.max(0, Math.min(100, (prev.image_position_y ?? 50) + deltaY)),
    }));
  };

  // Preset 3x3 Grid Alignment
  const setFocalAlignmentPreset = (x, y) => {
    setImageFormData((prev) => ({
      ...prev,
      image_position_x: x,
      image_position_y: y,
    }));
  };

  // Image Processing for Uploads
  const handleProcessImage = async (file, isForImageSlider = false) => {
    if (!file) return;

    try {
      setIsUploading(true);
      const result = await formatFactory(file, { quality: 0.85, maxDimension: 1920 });
      setUploadStats({
        originalSize: result.originalSize,
        formattedSize: result.formattedSize,
        savingsPercent: result.savingsPercent,
      });

      const uploadFormData = new FormData();
      uploadFormData.append('file', result.file);
      uploadFormData.append('mediaType', 'image');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.url) {
          if (isForImageSlider) {
            setImageFormData((prev) => ({ ...prev, image_url: data.url }));
          } else {
            setFormData((prev) => ({ ...prev, image_url: data.url }));
            setImagePreview(data.url);
          }
          toast.success(
            isRtl ? `تم رفع وضغط الصورة بنجاح (وفر ${result.savingsPercent}%)` : `Image uploaded and optimized (Saved ${result.savingsPercent}%)`,
            isRtl ? 'محرك formatFactory' : 'formatFactory'
          );
          return;
        }
      }

      // Fallback to local Base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result;
        if (isForImageSlider) {
          setImageFormData((prev) => ({ ...prev, image_url: base64data }));
        } else {
          setFormData((prev) => ({ ...prev, image_url: base64data }));
          setImagePreview(base64data);
        }
      };
      reader.readAsDataURL(result.file);

      toast.info(
        isRtl ? 'تم تجهيز الصورة ومعاينتها محلياً بصيغة WebP' : 'Image ready locally (WebP)',
        isRtl ? 'formatFactory' : 'formatFactory'
      );
    } catch (err) {
      console.error('Image processing error:', err);
      toast.error(isRtl ? 'فشل معالجة الصورة' : 'Failed to process image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (imageSliderFileInputRef.current) imageSliderFileInputRef.current.value = '';
    }
  };

  // ---------------- Save Store Card ----------------
  const handleSaveStoreCard = async (e) => {
    e.preventDefault();
    if (isUploading) {
      toast.warning(isRtl ? 'يرجى الانتظار لحين اكتمال معالجة الصورة...' : 'Please wait for image upload to complete...');
      return;
    }

    try {
      const token = await ensureAuthToken();
      const apiHost = getApiHost();

      let targetUrl = formData.target_url;
      if (linkMode === 'category') {
        const cat = categories.find((c) => String(c.id) === String(selectedCategoryId));
        targetUrl = cat ? `/categories/${cat.slug}` : '/categories';
      } else if (linkMode === 'product') {
        const prod = products.find((p) => String(p.id) === String(selectedProductId));
        targetUrl = prod ? `/products/${prod.slug || prod.id}` : '/products';
      }

      let bgStyleToSave = presetStyle;
      if (themeMode === 'preset') {
        bgStyleToSave = presetStyle;
      } else if (themeMode === 'solid') {
        bgStyleToSave = `custom:${JSON.stringify({
          type: 'solid',
          color: solidColor,
          finish: cardFinish,
          textColor: textColorMode === 'light' ? '#ffffff' : (textColorMode === 'dark' ? '#0f172a' : customTextColor),
        })}`;
      } else if (themeMode === 'gradient') {
        bgStyleToSave = `custom:${JSON.stringify({
          type: 'gradient',
          color1: gradientColor1,
          color2: gradientColor2,
          angle: gradientAngle,
          finish: cardFinish,
          textColor: textColorMode === 'dark' ? '#0f172a' : (textColorMode === 'custom' ? customTextColor : '#ffffff'),
        })}`;
      }

      const payload = {
        ...formData,
        target_url: targetUrl,
        bg_style: bgStyleToSave,
        placement: 'hero_vertical_slider',
      };

      if (editingBanner) {
        const res = await fetch(`${apiHost}/api/v1/cms/banners/${editingBanner.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (json.success) {
          toast.success(isRtl ? 'تم تحديث كارت المتجر بنجاح!' : 'Store card updated!');
          setIsModalOpen(false);
          fetchData();
        } else {
          toast.error(json.message || 'Failed to update card');
        }
      } else {
        const res = await fetch(`${apiHost}/api/v1/cms/banners`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (json.success) {
          toast.success(isRtl ? 'تمت إضافة كارت المتجر الجديد بنجاح!' : 'Store card added!');
          setIsModalOpen(false);
          fetchData();
        } else {
          toast.error(json.message || 'Failed to create card');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(isRtl ? 'حدث خطأ أثناء حفظ الكارت' : 'Error saving card');
    }
  };

  // ---------------- Save Image Slide Banner with Exact Framing ----------------
  const handleSaveImageSlide = async (e) => {
    e.preventDefault();
    if (isUploading) {
      toast.warning(isRtl ? 'يرجى الانتظار لحين اكتمال معالجة الصورة...' : 'Please wait for image upload to complete...');
      return;
    }

    try {
      const token = await ensureAuthToken();
      const apiHost = getApiHost();

      let targetUrl = imageFormData.target_url;
      if (imageLinkMode === 'category') {
        const cat = categories.find((c) => String(c.id) === String(imageSelectedCatId));
        targetUrl = cat ? `/categories/${cat.slug}` : '/categories';
      } else if (imageLinkMode === 'product') {
        const prod = products.find((p) => String(p.id) === String(imageSelectedProdId));
        targetUrl = prod ? `/products/${prod.slug || prod.id}` : '/products';
      }

      const highlightsJson = {
        image_position_x: Number(imageFormData.image_position_x),
        image_position_y: Number(imageFormData.image_position_y),
        image_fit: imageFormData.image_fit || 'cover',
        image_zoom: Number(imageFormData.image_zoom) || 100,
        overlay_opacity: Number(imageFormData.overlay_opacity),
        blur_backdrop: Boolean(imageFormData.blur_backdrop),
      };

      const payload = {
        title_ar: imageFormData.title_ar || 'عالم التقنية والجيمنج',
        title_en: imageFormData.title_en || 'High-End Tech & Gaming',
        subtitle_ar: imageFormData.subtitle_ar || '',
        subtitle_en: imageFormData.subtitle_en || '',
        image_url: imageFormData.image_url || '/assets/slider/setup-workspace.png',
        button_text_ar: imageFormData.button_text_ar || 'تسوق الآن',
        button_text_en: imageFormData.button_text_en || 'Shop Now',
        target_url: targetUrl || '',
        sort_order: Number(imageFormData.sort_order) || 1,
        is_active: imageFormData.is_active !== false,
        placement: 'image_slider',
        highlights_json: highlightsJson,
      };

      if (editingImageBanner) {
        const res = await fetch(`${apiHost}/api/v1/cms/banners/${editingImageBanner.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (json.success) {
          toast.success(
            isRtl ? 'تم حفظ أبعاد وموضع وتعديلات شريحة الصورة بنجاح وتطبيقها 100%!' : 'Image slide framing and settings saved 100%!',
            isRtl ? 'حفظ الشريحة' : 'Slide Saved'
          );
          setIsImageModalOpen(false);
          fetchData();
        } else {
          toast.error(json.message || 'Failed to update slide');
        }
      } else {
        const res = await fetch(`${apiHost}/api/v1/cms/banners`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (json.success) {
          toast.success(
            isRtl ? 'تمت إضافة شريحة الصور وحفظ أبعادها بنجاح!' : 'Image slide added with exact framing!',
            isRtl ? 'إضافة شريحة' : 'Slide Created'
          );
          setIsImageModalOpen(false);
          fetchData();
        } else {
          toast.error(json.message || 'Failed to create slide');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(isRtl ? 'حدث خطأ أثناء حفظ شريحة الصور' : 'Error saving image slide');
    }
  };

  // Delete Banner (Either Store Card or Image Slide)
  const handleDeleteBanner = async (bannerId) => {
    if (!window.confirm(isRtl ? 'هل أنت متأكد من رغبتك في حذف هذا العنصر نهائياً من السلايدر؟' : 'Are you sure you want to delete this slider item?')) {
      return;
    }

    try {
      const token = await ensureAuthToken();
      const apiHost = getApiHost();

      const res = await fetch(`${apiHost}/api/v1/cms/banners/${bannerId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setBanners(banners.filter((b) => b.id !== bannerId));
        toast.success(isRtl ? 'تم حذف العنصر بنجاح' : 'Item deleted successfully');
      } else {
        toast.error(isRtl ? 'تعذر حذف العنصر' : 'Could not delete item');
      }
    } catch (err) {
      console.error(err);
      toast.error(isRtl ? 'خطأ في الاتصال أثناء الحذف' : 'Error deleting item');
    }
  };

  if (!mounted) {
    return (
      <div className="slider-admin-page" dir={isRtl ? 'rtl' : 'ltr'} suppressHydrationWarning>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', border: '3.5px solid #e2e8f0', borderTopColor: 'var(--main-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#64748b' }}>
              {isRtl ? 'جاري تحميل لوحة التحكم بالسلايدر...' : 'Loading Slider Hub...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="slider-admin-page" dir={isRtl ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <AdminSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        lang={lang}
      />

      <div className="main-content">
        <AdminHeader
          adminUser={adminUser}
          onLogout={() => {
            localStorage.removeItem('trendline_admin_token');
            router.push('/admin/login');
          }}
          lang={lang}
          onToggleLang={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          isSidebarCollapsed={sidebarCollapsed}
        />

        <div className="content-body">
          {/* Top Page Header & Quick Overview */}
          <div className="page-top-bar">
            <div className="title-group">
              <h1 className="page-title">
                {isRtl ? 'لوحة التحكم المتقدمة في السلايدرز (Unified Slider Hub)' : 'Advanced Sliders Studio & Focal Control'}
              </h1>
              <p className="page-desc">
                {isRtl
                  ? 'معاينة حية حقيقية 100%، ضبط دقيق لموضع وأبعاد الصور (Focal Point & Zoom)، وتحكم منطقي متكامل في سلايدر المتجر وسلايدر الصور'
                  : '100% Authentic Live Preview, precise Image Focal Point Framing & Zoom, and advanced logical controls for Store & Widescreen Sliders'}
              </p>
            </div>

            <div className="top-actions-cluster">
              <Link
                href="/"
                target="_blank"
                className="btn-add-slide"
                style={{ background: '#334155', color: '#fff', textDecoration: 'none' }}
                title={isRtl ? 'فتح المتجر الرئيسي في تبويب جديد' : 'Open Storefront in New Tab'}
              >
                <FaEye />
                <span>{isRtl ? 'معاينة في المتجر ↗' : 'Store View ↗'}</span>
              </Link>

              <button
                className={`btn-save-master-settings ${hasUnsavedSettings ? 'pulse-btn' : ''}`}
                onClick={() => handleSaveMasterSettings()}
                disabled={savingSettings}
              >
                <FaFloppyDisk />
                <span>
                  {savingSettings
                    ? (isRtl ? 'جاري حفظ الإعدادات...' : 'Saving...')
                    : (isRtl ? 'حفظ إعدادات وتوجل السلايدر' : 'Save All Settings')}
                </span>
              </button>
            </div>
          </div>

          {/* =========================================================================
              AUTHENTIC 100% REAL-TIME LIVE STOREFRONT PREVIEW STAGE
             ========================================================================= */}
          <div className="preview-collapsible-box">
            <div className="preview-header">
              <div className="preview-title" onClick={() => setShowLivePreview(!showLivePreview)} style={{ cursor: 'pointer' }}>
                <FaEye style={{ color: 'var(--main-color)' }} />
                <span>
                  {isRtl
                    ? `معاينة حية ومطابقة 100% للمتجر (${displayMode === 'both' ? (sliderOrder === 'image_first' ? 'سلايدر الصور بالأعلى ثم سلايدر المتجر' : 'سلايدر المتجر بالأعلى ثم سلايدر الصور') : displayMode === 'image_only' ? 'سلايدر الصور فقط' : displayMode === 'store_only' ? 'سلايدر المتجر فقط' : 'السلايدرز معطلة'})`
                    : `100% Authentic Storefront Live Preview (${displayMode})`}
                </span>
              </div>

              {/* Responsive Device Simulator Toolbar */}
              <div className="preview-device-switch">
                <button
                  type="button"
                  className={`btn-dev ${previewDevice === 'desktop' ? 'active' : ''}`}
                  onClick={() => setPreviewDevice('desktop')}
                  title="Desktop (100% Full Width)"
                >
                  <FaDesktop style={{ marginLeft: isRtl ? '4px' : '0', marginRight: isRtl ? '0' : '4px' }} />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  className={`btn-dev ${previewDevice === 'tablet' ? 'active' : ''}`}
                  onClick={() => setPreviewDevice('tablet')}
                  title="Tablet (768px)"
                >
                  <FaTabletScreenButton style={{ marginLeft: isRtl ? '4px' : '0', marginRight: isRtl ? '0' : '4px' }} />
                  <span>Tablet (768px)</span>
                </button>
                <button
                  type="button"
                  className={`btn-dev ${previewDevice === 'mobile' ? 'active' : ''}`}
                  onClick={() => setPreviewDevice('mobile')}
                  title="Mobile (410px)"
                >
                  <FaMobileScreenButton style={{ marginLeft: isRtl ? '4px' : '0', marginRight: isRtl ? '0' : '4px' }} />
                  <span>Mobile (410px)</span>
                </button>

                <button
                  type="button"
                  className="preview-toggle-btn"
                  onClick={() => setShowLivePreview(!showLivePreview)}
                  style={{ marginRight: isRtl ? '12px' : '0', marginLeft: isRtl ? '0' : '12px' }}
                >
                  {showLivePreview ? (isRtl ? 'إخفاء ▴' : 'Hide ▴') : (isRtl ? 'إظهار ▾' : 'Show ▾')}
                </button>
              </div>
            </div>

            {showLivePreview && (
              <div className="preview-body-content">
                <div
                  className={`preview-device-frame ${
                    previewDevice === 'tablet'
                      ? 'device-tablet'
                      : previewDevice === 'mobile'
                      ? 'device-mobile'
                      : 'device-desktop'
                  }`}
                >
                  {displayMode === 'none' ? (
                    <div style={{ padding: '48px 24px', textAlign: 'center', background: '#0b0f19', color: '#94a3b8', borderRadius: '14px' }}>
                      <FaCircleInfo style={{ fontSize: '32px', marginBottom: '10px', color: '#f59e0b' }} />
                      <p style={{ margin: 0, fontWeight: 800, fontSize: '16px', color: '#f8fafc' }}>
                        {isRtl ? 'السلايدرز مخفية حالياً في الصفحة الرئيسية للمتجر (وضع العرض: معطل)' : 'Sliders are currently disabled on storefront'}
                      </p>
                      <p style={{ margin: '6px 0 0', fontSize: '13px' }}>
                        {isRtl ? 'اختر "كلا السلايدرين معاً" أو أحدهما من خيارات العرض أدناه لتفعيلهما فوراً' : 'Select "Both Sliders" or either one below to enable'}
                      </p>
                    </div>
                  ) : (
                    <div className="live-preview-sliders-flow" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                      {displayMode === 'both' ? (
                        sliderOrder === 'image_first' ? (
                          <>
                            <ImageSlider lang={lang} banners={previewImageBanners} config={imageConfig} previewMode={true} />
                            <HeroSlider lang={lang} banners={heroBanners} />
                          </>
                        ) : (
                          <>
                            <HeroSlider lang={lang} banners={heroBanners} />
                            <ImageSlider lang={lang} banners={previewImageBanners} config={imageConfig} previewMode={true} />
                          </>
                        )
                      ) : displayMode === 'image_only' ? (
                        <ImageSlider lang={lang} banners={previewImageBanners} config={imageConfig} previewMode={true} />
                      ) : (
                        <HeroSlider lang={lang} banners={heroBanners} />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* =========================================================================
              LOGICAL ADVANCED CONTROL TABS
             ========================================================================= */}
          <div className="slider-tabs-nav">
            <button
              type="button"
              className={`slider-tab-btn ${activeTab === 'display_controls' ? 'active' : ''}`}
              onClick={() => setActiveTab('display_controls')}
            >
              <FaSliders />
              <span>{isRtl ? '1. هيكل وترتيب الصفحة الرئيسية (Master Stack)' : '1. Master Display & Stack Flow'}</span>
            </button>

            <button
              type="button"
              className={`slider-tab-btn ${activeTab === 'image_slider' ? 'active' : ''}`}
              onClick={() => setActiveTab('image_slider')}
            >
              <FaCropSimple />
              <span>{isRtl ? '2. استوديو بنرات الصور وضبط الأبعاد (Focal Point)' : '2. Widescreen Image Slider & Framing'}</span>
              <span className="tab-counter-badge">{imageBanners.length}</span>
            </button>

            <button
              type="button"
              className={`slider-tab-btn ${activeTab === 'store_slider' ? 'active' : ''}`}
              onClick={() => setActiveTab('store_slider')}
            >
              <FaLayerGroup />
              <span>{isRtl ? '3. كروت المتجر التفاعلية (Store Cards)' : '3. Store Hero Cards'}</span>
              <span className="tab-counter-badge">{heroBanners.length}</span>
            </button>
          </div>

          {/* ==================== TAB 1: MASTER DISPLAY & STACK FLOW ==================== */}
          {activeTab === 'display_controls' && (
            <div className="display-controls-view">
              {/* Display Mode Selector Cards */}
              <div className="order-settings-card" style={{ marginBottom: '24px' }}>
                <div className="order-card-header">
                  <div className="header-text">
                    <h3>{isRtl ? 'أ. وضع ظهور السلايدر في الصفحة الرئيسية (Storefront Display Mode)' : 'A. Storefront Sliders Display Mode'}</h3>
                    <p>{isRtl ? 'حدد تركيبة السلايدرات التي يراها زوار متجر ترندلاين في قمة الصفحة الرئيسية' : 'Choose which sliders appear on the home page'}</p>
                  </div>
                </div>

                <div className="display-settings-grid">
                  {/* Both Sliders */}
                  <div
                    className={`display-mode-card ${displayMode === 'both' ? 'selected' : ''}`}
                    onClick={() => {
                      setDisplayMode('both');
                      setHasUnsavedSettings(true);
                    }}
                  >
                    <div className="card-header-row">
                      <div className="icon-box">
                        <FaLayerGroup />
                      </div>
                      <div className="radio-circle">
                        {displayMode === 'both' && <div className="inner-dot" />}
                      </div>
                    </div>
                    <h4 className="mode-title">{isRtl ? '🌟 كلا السلايدرين معاً (Both Sliders)' : '🌟 Both Sliders Stack'}</h4>
                    <p className="mode-desc">
                      {isRtl
                        ? 'إظهار بنر الصور العريض الحديث مع كروت المتجر التفاعلية معاً بالترتيب المفضل لديك'
                        : 'Display both the widescreen image slider and store hero cards together.'}
                    </p>
                  </div>

                  {/* Image Slider Only */}
                  <div
                    className={`display-mode-card ${displayMode === 'image_only' ? 'selected' : ''}`}
                    onClick={() => {
                      setDisplayMode('image_only');
                      setHasUnsavedSettings(true);
                    }}
                  >
                    <div className="card-header-row">
                      <div className="icon-box">
                        <FaImages />
                      </div>
                      <div className="radio-circle">
                        {displayMode === 'image_only' && <div className="inner-dot" />}
                      </div>
                    </div>
                    <h4 className="mode-title">{isRtl ? '🖼️ سلايدر الصور فقط (Image Slider Only)' : '🖼️ Image Slider Only'}</h4>
                    <p className="mode-desc">
                      {isRtl
                        ? 'عرض بنرات الصور العريضة الحديثة فقط بكامل العرض (مثل بنر السيت أب والشاشات النقي)'
                        : 'Show only widescreen visual photography banner slider.'}
                    </p>
                  </div>

                  {/* Store Slider Only */}
                  <div
                    className={`display-mode-card ${displayMode === 'store_only' ? 'selected' : ''}`}
                    onClick={() => {
                      setDisplayMode('store_only');
                      setHasUnsavedSettings(true);
                    }}
                  >
                    <div className="card-header-row">
                      <div className="icon-box">
                        <FaLaptop />
                      </div>
                      <div className="radio-circle">
                        {displayMode === 'store_only' && <div className="inner-dot" />}
                      </div>
                    </div>
                    <h4 className="mode-title">{isRtl ? '🏬 سلايدر المتجر فقط (Store Slider Only)' : '🏬 Store Slider Only'}</h4>
                    <p className="mode-desc">
                      {isRtl
                        ? 'عرض كروت العروض التفاعلية الموجهة للأقسام والمنتجات مع بطاقات البنوك والخصومات'
                        : 'Show only interactive store product cards slider.'}
                    </p>
                  </div>

                  {/* None */}
                  <div
                    className={`display-mode-card ${displayMode === 'none' ? 'selected' : ''}`}
                    onClick={() => {
                      setDisplayMode('none');
                      setHasUnsavedSettings(true);
                    }}
                  >
                    <div className="card-header-row">
                      <div className="icon-box" style={{ color: '#ef4444', background: '#fee2e2' }}>
                        <FaSliders />
                      </div>
                      <div className="radio-circle">
                        {displayMode === 'none' && <div className="inner-dot" style={{ background: '#ef4444' }} />}
                      </div>
                    </div>
                    <h4 className="mode-title">{isRtl ? '🚫 إخفاء السلايدرات (Disabled / None)' : '🚫 Hide All Sliders'}</h4>
                    <p className="mode-desc">
                      {isRtl
                        ? 'تعطيل وإخفاء السلايدرز تماماً والبدء بشبكة الأقسام والمنتجات مباشرة'
                        : 'Hide all hero sliders and begin storefront with category grid directly.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Slider Order Switcher */}
              <div className="order-settings-card">
                <div className="order-card-header">
                  <div className="header-text">
                    <h3>{isRtl ? 'ب. اختيار ترتيب السلايدرات (مين فيهم الأول فوق ومين تحته)' : 'B. Slider Stack Order (Which comes first?)'}</h3>
                    <p>
                      {isRtl
                        ? 'في حالة تفعيل كلا السلايدرين، حدد السلايدر الذي يظهر أولاً في قمة الصفحة الرئيسية للمتجر'
                        : 'When both sliders are enabled, choose which one takes priority at the very top.'}
                    </p>
                  </div>
                </div>

                <div className="order-options-grid">
                  {/* Image First */}
                  <div
                    className={`order-option-card ${sliderOrder === 'image_first' ? 'selected' : ''}`}
                    onClick={() => {
                      setSliderOrder('image_first');
                      setHasUnsavedSettings(true);
                    }}
                  >
                    <div className="order-icon-badge">
                      <FaImages />
                    </div>
                    <div className="order-text-col">
                      <h4 className="order-title">
                        {isRtl ? '🖼️⬆️ سلايدر الصور أولاً ثم سلايدر المتجر' : '🖼️⬆️ Image Slider First, Store Slider Below'}
                      </h4>
                      <p className="order-subtitle">
                        {isRtl
                          ? 'البنر العريض في القمة يليه كروت عروض المتجر التفاعلية أسفله'
                          : 'Full-width cinematic photo banner first, followed by store cards below'}
                      </p>
                    </div>
                    <div className="order-radio-check">
                      {sliderOrder === 'image_first' && <div className="dot" />}
                    </div>
                  </div>

                  {/* Store First */}
                  <div
                    className={`order-option-card ${sliderOrder === 'store_first' ? 'selected' : ''}`}
                    onClick={() => {
                      setSliderOrder('store_first');
                      setHasUnsavedSettings(true);
                    }}
                  >
                    <div className="order-icon-badge">
                      <FaLayerGroup />
                    </div>
                    <div className="order-text-col">
                      <h4 className="order-title">
                        {isRtl ? '🏬⬆️ سلايدر المتجر أولاً ثم سلايدر الصور' : '🏬⬆️ Store Slider First, Image Slider Below'}
                      </h4>
                      <p className="order-subtitle">
                        {isRtl
                          ? 'كروت عروض المتجر التفاعلية في القمة يليها بنر الصور العريض أسفلها'
                          : 'Store product cards first, followed by widescreen image slider below'}
                      </p>
                    </div>
                    <div className="order-radio-check">
                      {sliderOrder === 'store_first' && <div className="dot" />}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '22px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn-save-master-settings"
                    onClick={() => handleSaveMasterSettings()}
                    disabled={savingSettings}
                  >
                    <FaFloppyDisk />
                    <span>
                      {savingSettings
                        ? (isRtl ? 'جاري الحفظ...' : 'Saving...')
                        : (isRtl ? 'حفظ إعدادات الظهور والترتيب' : 'Save Display & Order Settings')}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 2: IMAGE SLIDER & FOCAL POINT FRAMING STUDIO ==================== */}
          {activeTab === 'image_slider' && (
            <div className="image-slider-admin-view">
              {/* Appearance & Behavior Config Box */}
              <div className="image-slider-config-box">
                <div className="config-box-header">
                  <div className="title-area">
                    <FaGear style={{ color: 'var(--main-color)', fontSize: '18px' }} />
                    <h3>{isRtl ? 'إعدادات وأبعاد سلايدر الصور العام' : 'Global Image Slider Framing & Layout'}</h3>
                    <span>{isRtl ? '(الارتفاع، العرض، نمط الأسهم، والتوقيت)' : '(Height, Full-Width, Arrows, Intervals)'}</span>
                  </div>

                  <button
                    type="button"
                    className="btn-save-master-settings"
                    style={{ padding: '8px 18px', fontSize: '13px' }}
                    onClick={() => handleSaveMasterSettings()}
                    disabled={savingSettings}
                  >
                    <FaFloppyDisk />
                    <span>{isRtl ? 'حفظ إعدادات المظهر' : 'Save Appearance'}</span>
                  </button>
                </div>

                <div className="config-grid">
                  {/* Height Slider */}
                  <div className="config-field">
                    <label>
                      <span>{isRtl ? 'ارتفاع السلايدر في المتجر' : 'Slider Height'}</span>
                      <span className="val-preview">{imageConfig.height || 460}px</span>
                    </label>
                    <div className="range-input-wrapper">
                      <input
                        type="range"
                        min="280"
                        max="700"
                        step="20"
                        value={imageConfig.height || 460}
                        onChange={(e) => {
                          setImageConfig({ ...imageConfig, height: Number(e.target.value) });
                          setHasUnsavedSettings(true);
                        }}
                      />
                      <span className="range-val">{imageConfig.height || 460}px</span>
                    </div>
                  </div>

                  {/* Autoplay Speed */}
                  <div className="config-field">
                    <label>
                      <span>{isRtl ? 'سرعة التقليب التلقائي' : 'Autoplay Interval'}</span>
                      <span className="val-preview">{((imageConfig.autoplay_speed || 4000) / 1000).toFixed(1)}s</span>
                    </label>
                    <div className="range-input-wrapper">
                      <input
                        type="range"
                        min="2000"
                        max="9000"
                        step="500"
                        value={imageConfig.autoplay_speed || 4000}
                        onChange={(e) => {
                          setImageConfig({ ...imageConfig, autoplay_speed: Number(e.target.value) });
                          setHasUnsavedSettings(true);
                        }}
                      />
                      <span className="range-val">{((imageConfig.autoplay_speed || 4000) / 1000).toFixed(1)}s</span>
                    </div>
                  </div>

                  {/* Border Radius */}
                  <div className="config-field">
                    <label>
                      <span>{isRtl ? 'استدارة الزوايا' : 'Border Radius'}</span>
                      <span className="val-preview">{imageConfig.border_radius ?? 16}px</span>
                    </label>
                    <div className="range-input-wrapper">
                      <input
                        type="range"
                        min="0"
                        max="32"
                        step="4"
                        value={imageConfig.border_radius ?? 16}
                        onChange={(e) => {
                          setImageConfig({ ...imageConfig, border_radius: Number(e.target.value) });
                          setHasUnsavedSettings(true);
                        }}
                      />
                      <span className="range-val">{imageConfig.border_radius ?? 16}px</span>
                    </div>
                  </div>

                  {/* Arrow Style */}
                  <div className="config-field">
                    <label>{isRtl ? 'شكل ونمط الأسهم' : 'Arrow Style'}</label>
                    <select
                      className="select-input"
                      value={imageConfig.arrow_style || 'minimal'}
                      onChange={(e) => {
                        setImageConfig({ ...imageConfig, arrow_style: e.target.value });
                        setHasUnsavedSettings(true);
                      }}
                    >
                      <option value="minimal">{isRtl ? 'مينيمال Chevron (مثل الصورة المرفقة < )' : 'Minimalist Chevron (<)'}</option>
                      <option value="circle">{isRtl ? 'دائري زجاجي مع خلفية (Circular Pill)' : 'Circular Backdrop'}</option>
                    </select>
                  </div>

                  {/* Toggles */}
                  <div className="config-field">
                    <label>{isRtl ? 'عرض كامل للشاشة' : 'Full Width'}</label>
                    <label className="toggle-switch-field">
                      <span>{imageConfig.full_width ? (isRtl ? 'كامل العرض 100%' : 'Full Width 100%') : (isRtl ? 'داخل إطار Container' : 'Boxed Container')}</span>
                      <input
                        type="checkbox"
                        checked={imageConfig.full_width !== false}
                        onChange={(e) => {
                          setImageConfig({ ...imageConfig, full_width: e.target.checked });
                          setHasUnsavedSettings(true);
                        }}
                      />
                    </label>
                  </div>

                  <div className="config-field">
                    <label>{isRtl ? 'التشغيل التلقائي' : 'Autoplay'}</label>
                    <label className="toggle-switch-field">
                      <span>{imageConfig.autoplay ? (isRtl ? 'مفعل' : 'Enabled') : (isRtl ? 'معطل' : 'Disabled')}</span>
                      <input
                        type="checkbox"
                        checked={imageConfig.autoplay !== false}
                        onChange={(e) => {
                          setImageConfig({ ...imageConfig, autoplay: e.target.checked });
                          setHasUnsavedSettings(true);
                        }}
                      />
                    </label>
                  </div>

                  <div className="config-field">
                    <label>{isRtl ? 'أسهم التنقل' : 'Navigation Arrows'}</label>
                    <label className="toggle-switch-field">
                      <span>{imageConfig.show_arrows !== false ? (isRtl ? 'ظاهرة' : 'Visible') : (isRtl ? 'مخفية' : 'Hidden')}</span>
                      <input
                        type="checkbox"
                        checked={imageConfig.show_arrows !== false}
                        onChange={(e) => {
                          setImageConfig({ ...imageConfig, show_arrows: e.target.checked });
                          setHasUnsavedSettings(true);
                        }}
                      />
                    </label>
                  </div>

                  <div className="config-field">
                    <label>{isRtl ? 'نقاط الترقيم' : 'Pagination Dots'}</label>
                    <label className="toggle-switch-field">
                      <span>{imageConfig.show_dots !== false ? (isRtl ? 'ظاهرة' : 'Visible') : (isRtl ? 'مخفية' : 'Hidden')}</span>
                      <input
                        type="checkbox"
                        checked={imageConfig.show_dots !== false}
                        onChange={(e) => {
                          setImageConfig({ ...imageConfig, show_dots: e.target.checked });
                          setHasUnsavedSettings(true);
                        }}
                      />
                    </label>
                  </div>

                  <div className="config-field">
                    <label>{isRtl ? 'نصوص وعناوين فوق الصورة' : 'Overlay Captions'}</label>
                    <label className="toggle-switch-field">
                      <span>{imageConfig.show_overlay_text ? (isRtl ? 'إظهار النصوص' : 'Show Text') : (isRtl ? 'صورة نقية بدون نصوص (مثل الصورة المرفقة)' : 'Clean Photo Only')}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(imageConfig.show_overlay_text)}
                        onChange={(e) => {
                          setImageConfig({ ...imageConfig, show_overlay_text: e.target.checked });
                          setHasUnsavedSettings(true);
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Image Slides List Header */}
              <div className="page-top-bar" style={{ marginTop: '28px', marginBottom: '16px' }}>
                <div className="title-group">
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {isRtl ? 'شرائح سلايدر الصور الحالية مع إعدادات الضبط البصري' : 'Image Slides & Visual Framing Presets'}
                  </h2>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
                    {isRtl
                      ? 'يمكنك تحديد موضع كل صورة بدقة (Focal Point X/Y) ونمط احتواء الصورة لضمان ظهورها بالشكل المطلوب 100%'
                      : 'Set individual focal alignment point, zoom scale, and framing per slide'}
                  </p>
                </div>

                <div className="top-actions-cluster">
                  <button className="btn-add-slide" onClick={handleOpenAddImageSlide}>
                    <FaPlus />
                    <span>{isRtl ? 'إضافة شريحة صورة جديدة' : 'Add Image Slide'}</span>
                  </button>
                </div>
              </div>

              {/* Image Slides List */}
              <div className="image-slides-list-container">
                {imageBanners.length === 0 ? (
                  <div style={{ background: '#ffffff', border: '2px dashed #cbd5e1', borderRadius: '16px', padding: '40px 20px', textAlign: 'center' }}>
                    <FaImages style={{ fontSize: '42px', color: '#94a3b8', marginBottom: '12px' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                      {isRtl ? 'لا توجد شرائح صور حالياً' : 'No image slides created yet'}
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '6px 0 16px' }}>
                      {isRtl ? 'أضف شريحة صورة جديدة لعرضها في سلايدر الصور بالصفحة الرئيسية' : 'Add an image slide to showcase in the widescreen slider'}
                    </p>
                    <button className="btn-add-slide" onClick={handleOpenAddImageSlide}>
                      <FaPlus />
                      <span>{isRtl ? 'إضافة أول شريحة صورة' : 'Add First Slide'}</span>
                    </button>
                  </div>
                ) : (
                  imageBanners.map((slide, index) => {
                    const title = isRtl ? (slide.title_ar || slide.title) : (slide.title_en || slide.title);
                    const subtitle = isRtl ? (slide.subtitle_ar || slide.subtitle) : (slide.subtitle_en || slide.subtitle);
                    const meta = slide.highlights_json || {};
                    const posX = meta.image_position_x ?? 50;
                    const posY = meta.image_position_y ?? 50;
                    const fit = meta.image_fit || 'cover';
                    const zoom = meta.image_zoom ?? 100;

                    return (
                      <div key={slide.id || index} className="image-slide-card-item">
                        <div className="slide-main-cluster">
                          <div className="slide-thumb-preview">
                            <img
                              src={slide.image_url || '/assets/slider/setup-workspace.png'}
                              alt={title}
                              style={{
                                objectFit: fit === 'contain' ? 'contain' : 'cover',
                                objectPosition: `${posX}% ${posY}%`,
                                transform: `scale(${zoom / 100})`,
                              }}
                            />
                          </div>

                          <div className="slide-meta-info">
                            <h4 className="slide-title-text">{title || (isRtl ? 'شريحة بدون عنوان' : 'Untitled Slide')}</h4>
                            {subtitle && <p className="slide-sub-text">{subtitle}</p>}
                            <div className="slide-badges-row">
                              <span className="badge-link">{slide.target_url || '/'}</span>
                              <span className="badge-type">{isRtl ? `الترتيب: #${slide.sort_order || index + 1}` : `Order #${slide.sort_order || index + 1}`}</span>
                              <span className="badge-type" style={{ background: '#e0f2fe', color: '#0369a1', direction: 'ltr' }}>
                                🎯 {posX}% {posY}% | {fit} {zoom}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="card-actions-cluster">
                          <button
                            type="button"
                            className="btn-move"
                            onClick={() => moveImageSlide(index, -1)}
                            disabled={index === 0}
                            title={isRtl ? 'تحريك لأعلى' : 'Move Up'}
                          >
                            <FaArrowUp />
                          </button>
                          <button
                            type="button"
                            className="btn-move"
                            onClick={() => moveImageSlide(index, 1)}
                            disabled={index === imageBanners.length - 1}
                            title={isRtl ? 'تحريك لأسفل' : 'Move Down'}
                          >
                            <FaArrowDown />
                          </button>

                          <button
                            type="button"
                            className="btn-focal-adjust"
                            onClick={() => handleOpenEditImageSlide(slide)}
                            title={isRtl ? 'تحديد موضع وحجم الصورة بدقة' : 'Adjust focal point & framing'}
                          >
                            <FaCrosshairs />
                            <span>{isRtl ? 'ضبط الموضع والحجم' : 'Focal & Frame'}</span>
                          </button>

                          <button
                            type="button"
                            className={`status-toggle-pill ${slide.is_active !== false ? 'active' : 'inactive'}`}
                            onClick={() => handleToggleActive(slide)}
                            title={isRtl ? 'انقر للتبديل بين التفعيل والتعطيل' : 'Toggle Active Status'}
                          >
                            {slide.is_active !== false ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'معطل' : 'Inactive')}
                          </button>

                          <button
                            type="button"
                            className="btn-action-icon"
                            onClick={() => handleOpenEditImageSlide(slide)}
                            title={isRtl ? 'تعديل الشريحة' : 'Edit Slide'}
                          >
                            <FaPenToSquare />
                          </button>

                          <button
                            type="button"
                            className="btn-action-icon delete"
                            onClick={() => handleDeleteBanner(slide.id)}
                            title={isRtl ? 'حذف الشريحة' : 'Delete Slide'}
                          >
                            <FaTrashCan />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ==================== TAB 3: STORE HERO CARDS (DRAG & DROP) ==================== */}
          {activeTab === 'store_slider' && (
            <div className="store-slider-admin-view">
              {/* Actions Header */}
              <div className="page-top-bar" style={{ marginBottom: '16px' }}>
                <div className="title-group">
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {isRtl ? 'كروت سلايدر المتجر التفاعلية' : 'Store Hero Cards Management'}
                  </h2>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
                    {isRtl
                      ? 'تحكم بالسحب والإفلات (Drag & Drop) في كروت العروض، تخصيص الروابط للأقسام أو المنتجات أو الصفحات'
                      : 'Drag & Drop to reorder cards, customize visual styles, assign direct routes'}
                  </p>
                </div>

                <div className="top-actions-cluster">
                  <button
                    className={`btn-save-order ${hasUnsavedOrder ? 'has-changes' : ''}`}
                    onClick={handleSaveOrder}
                    disabled={savingOrder || !hasUnsavedOrder}
                  >
                    <FaFloppyDisk />
                    <span>
                      {savingOrder
                        ? (isRtl ? 'جاري الحفظ...' : 'Saving...')
                        : hasUnsavedOrder
                        ? (isRtl ? 'حفظ الترتيب الجديد *' : 'Save Order *')
                        : (isRtl ? 'الترتيب محفوظ' : 'Order Saved')}
                    </span>
                  </button>

                  <button className="btn-add-slide" onClick={handleOpenAddStoreCard}>
                    <FaPlus />
                    <span>{isRtl ? 'إضافة كارت جديد' : 'Add New Card'}</span>
                  </button>
                </div>
              </div>

              {/* Drag & Drop Instructions Tip */}
              <div className="drag-instruction-alert">
                <div className="alert-icon-text">
                  <FaLightbulb style={{ fontSize: '18px', color: 'var(--main-color)' }} />
                  <span>
                    {isRtl
                      ? 'يمكنك سحب وإفلات أي كارت لتغيير مكانه بسهولة، أو استخدام أسهم التحريك السريع. التغييرات تنعكس فوراً على المتجر!'
                      : 'Drag and drop any card by the handle to reorder. Changes reflect live on the storefront!'}
                  </span>
                </div>
                <span className="badge-dnd-tip">Drag & Drop Enabled</span>
              </div>

              {/* Cards Sortable Drag & Drop List */}
              <div className="cards-sortable-container">
                {heroBanners.map((banner, index) => {
                  const title = isRtl ? (banner.title_ar || banner.title) : (banner.title_en || banner.title);
                  const subtitle = isRtl ? (banner.subtitle_ar || banner.subtitle) : (banner.subtitle_en || banner.subtitle);

                  return (
                    <div
                      key={banner.id || index}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`draggable-card-item ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
                    >
                      {/* Left Cluster: Handle, Order Number, Thumbnail, Text */}
                      <div className="card-identity-cluster">
                        <div className="drag-handle" title="اسحب لإعادة الترتيب">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="9" cy="5" r="1.5"></circle>
                            <circle cx="9" cy="12" r="1.5"></circle>
                            <circle cx="9" cy="19" r="1.5"></circle>
                            <circle cx="15" cy="5" r="1.5"></circle>
                            <circle cx="15" cy="12" r="1.5"></circle>
                            <circle cx="15" cy="19" r="1.5"></circle>
                          </svg>
                        </div>

                        <div className="order-badge">#{banner.sort_order || index + 1}</div>

                        <div className={`card-visual-pill style-${banner.bg_style}`}>
                          {banner.image_url ? (
                            <img src={banner.image_url} alt={title} />
                          ) : banner.bg_style === 'card-primary-cta' ? (
                            <FaTruckFast style={{ fontSize: '20px', color: 'var(--main-color)' }} />
                          ) : banner.bg_style === 'card-bank-promo' ? (
                            <FaCreditCard style={{ fontSize: '20px', color: '#10b981' }} />
                          ) : (
                            <FaLaptop style={{ fontSize: '20px', color: '#6366f1' }} />
                          )}
                        </div>

                        <div className="card-text-details">
                          <h4 className="card-main-title">{title}</h4>
                          <div className="card-sub-info">
                            {subtitle && <span>{subtitle}</span>}
                            <span className="badge-target-link">{banner.target_url || '/products'}</span>
                            <span className="badge-style-tag">{banner.bg_style || 'glass'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Cluster: Up/Down Buttons, Active Toggle, Edit/Delete */}
                      <div className="card-actions-cluster">
                        <button
                          type="button"
                          className="btn-move"
                          onClick={() => moveCard(index, -1)}
                          disabled={index === 0}
                          title={isRtl ? 'تحريك لأعلى' : 'Move Up'}
                        >
                          <FaArrowUp />
                        </button>
                        <button
                          type="button"
                          className="btn-move"
                          onClick={() => moveCard(index, 1)}
                          disabled={index === heroBanners.length - 1}
                          title={isRtl ? 'تحريك لأسفل' : 'Move Down'}
                        >
                          <FaArrowDown />
                        </button>

                        <button
                          type="button"
                          className={`status-toggle-pill ${banner.is_active ? 'active' : 'inactive'}`}
                          onClick={() => handleToggleActive(banner)}
                          title={isRtl ? 'انقر للتبديل بين التفعيل والتعطيل' : 'Toggle Active Status'}
                        >
                          {banner.is_active ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'معطل' : 'Inactive')}
                        </button>

                        <button
                          type="button"
                          className="btn-action-icon"
                          onClick={() => handleOpenEditStoreCard(banner)}
                          title={isRtl ? 'تعديل الكارت' : 'Edit Card'}
                        >
                          <FaPenToSquare />
                        </button>

                        <button
                          type="button"
                          className="btn-action-icon delete"
                          onClick={() => handleDeleteBanner(banner.id)}
                          title={isRtl ? 'حذف الكارت' : 'Delete Card'}
                        >
                          <FaTrashCan />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================== MODAL 1: ADD/EDIT STORE HERO CARD ==================== */}
      {isModalOpen && (
        <AdminModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          size="xl"
          title={
            editingBanner
              ? (isRtl ? 'تعديل وتخصيص كارت السلايدر' : 'Edit & Customize Slider Card')
              : (isRtl ? 'استوديو إضافة كارت جديد للسلايدر' : 'Hero Slider Card Studio')
          }
        >
          <form className="advanced-slider-modal-form" onSubmit={handleSaveStoreCard}>
            <div className="advanced-slider-modal-grid">
              {/* Column 1: Customization Controls & Form Fields */}
              <div className="modal-form-column">
                
                {/* 1. Bilingual Titles & Text */}
                <div className="editor-fieldset-card">
                  <div className="fieldset-header">
                    <div className="icon-title">
                      <FaPenToSquare style={{ color: 'var(--main-color)' }} />
                      <h4>{isRtl ? 'النصوص والعناوين الترويجية (ثنائي اللغة)' : 'Headlines & Copy (Bilingual)'}</h4>
                    </div>
                    <span className="lang-indicator-pill">AR & EN</span>
                  </div>

                  {/* Main Title Row */}
                  <div className="form-row-dual">
                    <div className="form-group-field">
                      <label>
                        {isRtl ? 'عنوان الكارت الرئيسي (عربي) *' : 'Card Main Title (Arabic) *'}
                      </label>
                      <input
                        type="text"
                        required
                        className="field-input"
                        value={formData.title_ar}
                        onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                        placeholder="مثال: أجهزة لابتوب وإكسسواراتها"
                      />
                    </div>

                    <div className="form-group-field">
                      <label>
                        {isRtl ? 'عنوان الكارت (إنجليزي)' : 'Card Main Title (English)'}
                      </label>
                      <input
                        type="text"
                        className="field-input"
                        value={formData.title_en}
                        onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                        placeholder="e.g. Laptops & Tech Accessories"
                      />
                    </div>
                  </div>

                  {/* Subtitle Row */}
                  <div className="form-row-dual">
                    <div className="form-group-field">
                      <label>
                        {isRtl ? 'الوصف الفرعي / الميزة (عربي)' : 'Subtitle / Tagline (Arabic)'}
                      </label>
                      <input
                        type="text"
                        className="field-input"
                        value={formData.subtitle_ar}
                        onChange={(e) => setFormData({ ...formData, subtitle_ar: e.target.value })}
                        placeholder="مثال: أداء أعلى ومزايا غير مسبوقة لكل احتياجاتك"
                      />
                    </div>

                    <div className="form-group-field">
                      <label>
                        {isRtl ? 'الوصف الفرعي (إنجليزي)' : 'Subtitle / Tagline (English)'}
                      </label>
                      <input
                        type="text"
                        className="field-input"
                        value={formData.subtitle_en}
                        onChange={(e) => setFormData({ ...formData, subtitle_en: e.target.value })}
                        placeholder="e.g. Peak Performance for All Your Needs"
                      />
                    </div>
                  </div>

                  {/* Promotional Badge & Button Row */}
                  <div className="form-row-dual">
                    <div className="form-group-field">
                      <label>
                        {isRtl ? 'بادج ترويجي (عربي)' : 'Promotional Badge (Arabic)'}
                        <span className="hint-tag">{isRtl ? 'Badge' : 'Tag'}</span>
                      </label>
                      <input
                        type="text"
                        className="field-input"
                        value={formData.badge_text_ar}
                        onChange={(e) => setFormData({ ...formData, badge_text_ar: e.target.value })}
                        placeholder="مثال: خصم 20% أو حصري أو وصل حديثاً"
                      />
                    </div>

                    <div className="form-group-field">
                      <label>
                        {isRtl ? 'بادج ترويجي (إنجليزي)' : 'Promotional Badge (English)'}
                        <span className="hint-tag">Badge</span>
                      </label>
                      <input
                        type="text"
                        className="field-input"
                        value={formData.badge_text_en}
                        onChange={(e) => setFormData({ ...formData, badge_text_en: e.target.value })}
                        placeholder="e.g. 20% OFF or Limited Deal"
                      />
                    </div>
                  </div>

                  <div className="form-row-dual">
                    <div className="form-group-field">
                      <label>
                        {isRtl ? 'نص زر الإجراء (عربي) *' : 'Button CTA (Arabic) *'}
                      </label>
                      <input
                        type="text"
                        required
                        className="field-input"
                        value={formData.button_text_ar}
                        onChange={(e) => setFormData({ ...formData, button_text_ar: e.target.value })}
                        placeholder="تسوق الآن"
                      />
                    </div>

                    <div className="form-group-field">
                      <label>
                        {isRtl ? 'نص زر الإجراء (إنجليزي) *' : 'Button CTA (English) *'}
                      </label>
                      <input
                        type="text"
                        required
                        className="field-input"
                        value={formData.button_text_en}
                        onChange={(e) => setFormData({ ...formData, button_text_en: e.target.value })}
                        placeholder="Shop Now"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Target Link Destination */}
                <div className="editor-fieldset-card">
                  <div className="fieldset-header">
                    <div className="icon-title">
                      <FaBox style={{ color: 'var(--main-color)' }} />
                      <h4>{isRtl ? 'الرابط الموجه إليه عند الضغط (Destination Link)' : 'Destination Link Routing'}</h4>
                    </div>
                  </div>

                  <div className="link-mode-tabs-cluster">
                    <button
                      type="button"
                      className={`mode-btn ${linkMode === 'category' ? 'active' : ''}`}
                      onClick={() => setLinkMode('category')}
                    >
                      <FaFolder />
                      <span>{isRtl ? 'ربط بقسم / تصنيف' : 'Category Link'}</span>
                    </button>
                    <button
                      type="button"
                      className={`mode-btn ${linkMode === 'product' ? 'active' : ''}`}
                      onClick={() => setLinkMode('product')}
                    >
                      <FaTag />
                      <span>{isRtl ? 'ربط بمنتج محدد' : 'Product Link'}</span>
                    </button>
                    <button
                      type="button"
                      className={`mode-btn ${linkMode === 'custom' ? 'active' : ''}`}
                      onClick={() => setLinkMode('custom')}
                    >
                      <FaSliders />
                      <span>{isRtl ? 'رابط مخصص أو صفحة' : 'Custom Route'}</span>
                    </button>
                  </div>

                  {linkMode === 'category' && (
                    <div className="route-select-wrapper">
                      <CustomSelect
                        value={selectedCategoryId}
                        onChange={(val) => setSelectedCategoryId(val)}
                        options={categorySelectOptions}
                        placeholder={isRtl ? 'ابحث واختر القسم المستهدف...' : 'Search and select category...'}
                        searchable={true}
                      />
                    </div>
                  )}

                  {linkMode === 'product' && (
                    <div className="route-select-wrapper">
                      <CustomSelect
                        value={selectedProductId}
                        onChange={(val) => setSelectedProductId(val)}
                        options={productSelectOptions}
                        placeholder={isRtl ? 'ابحث واختر المنتج المستهدف...' : 'Search and select product...'}
                        searchable={true}
                      />
                    </div>
                  )}

                  {linkMode === 'custom' && (
                    <div className="form-group-field" style={{ marginTop: '10px' }}>
                      <input
                        type="text"
                        className="field-input"
                        placeholder="مثال: /deals أو /brands/apple أو رابط خارجي https://..."
                        value={formData.target_url}
                        onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                {/* 3. Theme & Finish Studio */}
                <div className="editor-fieldset-card studio-theme-card">
                  <div className="fieldset-header">
                    <div className="icon-title">
                      <FaPalette style={{ color: 'var(--main-color)' }} />
                      <h4>{isRtl ? 'استوديو الألوان والتصميم (Theme & Card Studio)' : 'Theme Studio & Colors'}</h4>
                    </div>
                  </div>

                  <div className="theme-mode-pills">
                    <button
                      type="button"
                      className={`theme-pill ${themeMode === 'preset' ? 'active' : ''}`}
                      onClick={() => setThemeMode('preset')}
                    >
                      <FaWandMagicSparkles />
                      <span>{isRtl ? 'قوالب جاهزة' : 'Store Presets'}</span>
                    </button>
                    <button
                      type="button"
                      className={`theme-pill ${themeMode === 'solid' ? 'active' : ''}`}
                      onClick={() => setThemeMode('solid')}
                    >
                      <FaPalette />
                      <span>{isRtl ? 'لون مصمت' : 'Solid Color'}</span>
                    </button>
                    <button
                      type="button"
                      className={`theme-pill ${themeMode === 'gradient' ? 'active' : ''}`}
                      onClick={() => setThemeMode('gradient')}
                    >
                      <FaGem />
                      <span>{isRtl ? 'تدرج لوني' : 'Gradient'}</span>
                    </button>
                  </div>

                  {themeMode === 'preset' && (
                    <div className="presets-select-grid">
                      <div
                        className={`preset-card-item ${presetStyle === 'card-white-glass' ? 'active' : ''}`}
                        onClick={() => setPresetStyle('card-white-glass')}
                      >
                        <div className="preset-swatch-box swatch-white-glass" />
                        <span className="preset-name">{isRtl ? 'أبيض زجاجي ناصع' : 'White Glass'}</span>
                      </div>
                      <div
                        className={`preset-card-item ${presetStyle === 'card-primary-cta' ? 'active' : ''}`}
                        onClick={() => setPresetStyle('card-primary-cta')}
                      >
                        <div className="preset-swatch-box swatch-royal-blue" />
                        <span className="preset-name">{isRtl ? 'أزرق ترندلاين الملكي' : 'Royal Blue'}</span>
                      </div>
                      <div
                        className={`preset-card-item ${presetStyle === 'card-bank-promo' ? 'active' : ''}`}
                        onClick={() => setPresetStyle('card-bank-promo')}
                      >
                        <div className="preset-swatch-box swatch-dark-bank" />
                        <span className="preset-name">{isRtl ? 'كحلي داكن بنكي' : 'Bank Dark'}</span>
                      </div>
                      <div
                        className={`preset-card-item ${presetStyle === 'card-cyber-purple' ? 'active' : ''}`}
                        onClick={() => setPresetStyle('card-cyber-purple')}
                      >
                        <div className="preset-swatch-box swatch-cyber-purple" />
                        <span className="preset-name">{isRtl ? 'بنفسجي تقني سايبر' : 'Cyber Purple'}</span>
                      </div>
                      <div
                        className={`preset-card-item ${presetStyle === 'card-neon-emerald' ? 'active' : ''}`}
                        onClick={() => setPresetStyle('card-neon-emerald')}
                      >
                        <div className="preset-swatch-box swatch-neon-emerald" />
                        <span className="preset-name">{isRtl ? 'أخضر زمردي نيون' : 'Neon Emerald'}</span>
                      </div>
                      <div
                        className={`preset-card-item ${presetStyle === 'card-sunset-coral' ? 'active' : ''}`}
                        onClick={() => setPresetStyle('card-sunset-coral')}
                      >
                        <div className="preset-swatch-box swatch-sunset-coral" />
                        <span className="preset-name">{isRtl ? 'برتقالي صن سيت' : 'Sunset Coral'}</span>
                      </div>
                    </div>
                  )}

                  {themeMode === 'solid' && (
                    <div className="color-picker-dual-row">
                      <div className="color-input-tile">
                        <label>{isRtl ? 'لون الخلفية الأساسي:' : 'Background Color:'}</label>
                        <div className="color-picker-input-group">
                          <input
                            type="color"
                            className="color-wheel-circle"
                            value={solidColor}
                            onChange={(e) => setSolidColor(e.target.value)}
                          />
                          <input
                            type="text"
                            value={solidColor}
                            onChange={(e) => setSolidColor(e.target.value)}
                            className="color-hex-text"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {themeMode === 'gradient' && (
                    <div className="gradient-pickers-row">
                      <div className="color-input-tile">
                        <label>{isRtl ? 'اللون الأول (البداية):' : 'Color 1 (Start):'}</label>
                        <div className="color-picker-input-group">
                          <input
                            type="color"
                            className="color-wheel-circle"
                            value={gradientColor1}
                            onChange={(e) => setGradientColor1(e.target.value)}
                          />
                          <input
                            type="text"
                            value={gradientColor1}
                            onChange={(e) => setGradientColor1(e.target.value)}
                            className="color-hex-text"
                          />
                        </div>
                      </div>

                      <div className="color-input-tile">
                        <label>{isRtl ? 'اللون الثاني (النهاية):' : 'Color 2 (End):'}</label>
                        <div className="color-picker-input-group">
                          <input
                            type="color"
                            className="color-wheel-circle"
                            value={gradientColor2}
                            onChange={(e) => setGradientColor2(e.target.value)}
                          />
                          <input
                            type="text"
                            value={gradientColor2}
                            onChange={(e) => setGradientColor2(e.target.value)}
                            className="color-hex-text"
                          />
                        </div>
                      </div>

                      <div className="angle-input-tile" style={{ gridColumn: 'span 2' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569' }}>
                            {isRtl ? 'زاوية التدرج (Gradient Angle):' : 'Gradient Angle:'}
                          </label>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--main-color)', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px' }}>
                            {gradientAngle}°
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          step="5"
                          value={gradientAngle}
                          onChange={(e) => setGradientAngle(Number(e.target.value))}
                          style={{ width: '100%', accentColor: 'var(--main-color)', cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Finish Texture Selector */}
                  <div className="finish-texture-section">
                    <div className="section-sub-label">
                      <FaGem style={{ color: 'var(--main-color)' }} />
                      <span>{isRtl ? 'تأثير السطح واللمعان (Surface Finish):' : 'Surface Finish:'}</span>
                    </div>
                    <div className="finish-chips-group">
                      <button
                        type="button"
                        className={`finish-chip-btn ${cardFinish === 'glass' ? 'active' : ''}`}
                        onClick={() => setCardFinish('glass')}
                      >
                        <div className="finish-icon-preview finish-preview-glass" />
                        <div className="finish-info">
                          <span className="finish-title">{isRtl ? 'زجاجي شفاف' : 'Glassmorphism'}</span>
                          <span className="finish-desc">{isRtl ? 'تأثير بلور عصري' : 'Blur & frosty'}</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        className={`finish-chip-btn ${cardFinish === 'glossy' ? 'active' : ''}`}
                        onClick={() => setCardFinish('glossy')}
                      >
                        <div className="finish-icon-preview finish-preview-glossy" />
                        <div className="finish-info">
                          <span className="finish-title">{isRtl ? 'لامع جلو' : 'Glossy Glow'}</span>
                          <span className="finish-desc">{isRtl ? 'انعكاس ضوئي بارز' : 'Vivid reflections'}</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        className={`finish-chip-btn ${cardFinish === 'matt' ? 'active' : ''}`}
                        onClick={() => setCardFinish('matt')}
                      >
                        <div className="finish-icon-preview finish-preview-matt" />
                        <div className="finish-info">
                          <span className="finish-title">{isRtl ? 'مطفي ناعم' : 'Smooth Matt'}</span>
                          <span className="finish-desc">{isRtl ? 'بدون انعكاس' : 'Non-reflective'}</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4. Background Image & formatFactory */}
                <div className="editor-fieldset-card">
                  <div className="fieldset-header">
                    <div className="icon-title">
                      <FaCloudArrowUp style={{ color: 'var(--main-color)' }} />
                      <h4>{isRtl ? 'صورة الكارت (formatFactory Engine)' : 'Card Image'}</h4>
                    </div>
                    {uploadStats && (
                      <span className="lang-indicator-pill" style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0' }}>
                        {isRtl ? `وفر ${uploadStats.savingsPercent}%` : `Saved ${uploadStats.savingsPercent}%`}
                      </span>
                    )}
                  </div>

                  <div
                    className={`format-factory-dropzone ${isUploading ? 'uploading' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleProcessImage(file, false);
                      }}
                    />
                    {isUploading ? (
                      <div className="dropzone-loading">
                        <FaSpinner className="spinner-icon" />
                        <span>{isRtl ? 'جاري ضغط ومعالجة الصورة إلى WebP فائقة السرعة...' : 'Optimizing and converting image to WebP...'}</span>
                      </div>
                    ) : (imagePreview || formData.image_url) ? (
                      <div className="dropzone-preview-box">
                        <img src={imagePreview || formData.image_url} alt="Uploaded Card" className="uploaded-thumb" />
                        <div className="thumb-overlay">
                          <FaCloudArrowUp style={{ fontSize: '20px' }} />
                          <span>{isRtl ? 'تغيير الصورة (WebP Engine)' : 'Change Image'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="dropzone-empty-prompt">
                        <div className="cloud-icon-circle">
                          <FaCloudArrowUp />
                        </div>
                        <h5>{isRtl ? 'انقر لرفع صورة أو اسحبها هنا' : 'Click to upload or drag image here'}</h5>
                        <p>{isRtl ? 'محرك formatFactory يقوم بالتحويل التلقائي لـ WebP وضغط الحجم حتى 85%' : 'Auto WebP conversion and up to 85% compression'}</p>
                      </div>
                    )}
                  </div>

                  <div className="url-fallback-row">
                    <label>{isRtl ? 'أو أدخل رابط مباشر للصورة (Image URL):' : 'Or direct Image URL:'}</label>
                    <input
                      type="text"
                      className="field-input"
                      value={formData.image_url}
                      onChange={(e) => {
                        setFormData({ ...formData, image_url: e.target.value });
                        setImagePreview(e.target.value);
                      }}
                      placeholder="https://... أو /assets/..."
                    />
                  </div>
                </div>

                {/* Form Actions Footer */}
                <div className="modal-actions-footer">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setIsModalOpen(false)}
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="btn-submit-hero"
                    disabled={isUploading}
                  >
                    <FaCheck />
                    <span>
                      {isUploading
                        ? (isRtl ? 'جاري المعالجة...' : 'Processing...')
                        : editingBanner
                        ? (isRtl ? 'حفظ تعديلات الكارت' : 'Save Changes')
                        : (isRtl ? 'إضافة الكارت للسلايدر' : 'Add Card to Slider')}
                    </span>
                  </button>
                </div>
              </div>

              {/* Column 2: Sticky Realtime Interactive Mockup Card */}
              <div className="modal-preview-column">
                <div className="mockup-sticky-wrapper">
                  <div className="mockup-header-bar">
                    <div className="header-info">
                      <FaEye style={{ color: 'var(--main-color)' }} />
                      <span>{isRtl ? 'معاينة حية ومباشرة (Real-Time)' : 'Live Interactive Mockup'}</span>
                    </div>

                    <div className="mockup-lang-toggle">
                      <button
                        type="button"
                        className={`lang-btn ${modalPreviewLang === 'ar' ? 'active' : ''}`}
                        onClick={() => setModalPreviewLang('ar')}
                      >
                        عربي
                      </button>
                      <button
                        type="button"
                        className={`lang-btn ${modalPreviewLang === 'en' ? 'active' : ''}`}
                        onClick={() => setModalPreviewLang('en')}
                      >
                        English
                      </button>
                    </div>
                  </div>

                  {/* Rendered Mockup */}
                  <div
                    className={`live-slider-mockup-card ${
                      cardFinish === 'glossy'
                        ? 'card-finish-glossy'
                        : cardFinish === 'matt'
                        ? 'card-finish-matt'
                        : 'card-finish-glass'
                    } ${imagePreview || formData.image_url ? 'has-full-bg' : ''}`}
                    style={computedCardStyle}
                  >
                    {(imagePreview || formData.image_url) && (
                      <div className="mockup-full-bg-wrap">
                        <img
                          src={imagePreview || formData.image_url}
                          alt="Card Full Background"
                          className="mockup-full-bg-img"
                        />
                        <div
                          className={`mockup-full-bg-overlay ${
                            computedCardStyle.color === '#0f172a' ? 'overlay-light' : 'overlay-dark'
                          }`}
                        />
                      </div>
                    )}

                    <div className="mockup-card-top-content">
                      {(modalPreviewLang === 'ar' ? formData.badge_text_ar : (formData.badge_text_en || formData.badge_text_ar)) && (
                        <div className="mockup-top-badge">
                          <span>
                            {modalPreviewLang === 'ar' ? formData.badge_text_ar : (formData.badge_text_en || formData.badge_text_ar)}
                          </span>
                        </div>
                      )}

                      <h3 className="mockup-title" style={{ color: computedCardStyle.color }}>
                        {(modalPreviewLang === 'ar' ? formData.title_ar : (formData.title_en || formData.title_ar)) ||
                          (isRtl ? 'عنوان الكارت الرئيسي' : 'Card Main Title')}
                      </h3>

                      <p className="mockup-subtitle" style={{ color: computedCardStyle.color, opacity: 0.9 }}>
                        {(modalPreviewLang === 'ar' ? formData.subtitle_ar : (formData.subtitle_en || formData.subtitle_ar)) ||
                          (isRtl ? 'الوصف الترويجي والمزايا الحصرية' : 'Promotional tagline and perks')}
                      </p>
                    </div>

                    <div className="mockup-card-center-spacer" />

                    <div className="mockup-cta-btn-box">
                      <span className="mockup-cta-btn">
                        <span>
                          {(modalPreviewLang === 'ar'
                            ? formData.button_text_ar
                            : (formData.button_text_en || formData.button_text_ar)) ||
                            (isRtl ? 'تسوق الآن' : 'Shop Now')}
                        </span>
                        <span className="mockup-arrow-icon">
                          {modalPreviewLang === 'ar' ? '←' : '→'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </AdminModal>
      )}

      {/* =========================================================================
          MODAL 2: ADVANCED FOCAL POINT & IMAGE FRAMING STUDIO
         ========================================================================= */}
      {isImageModalOpen && (
        <AdminModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          size="xl"
          title={
            editingImageBanner
              ? (isRtl ? '🎯 استوديو ضبط وتحديد موضع وحجم صورة السلايدر (Focal Point Studio)' : 'Focal Point & Image Sizer Studio')
              : (isRtl ? 'إضافة شريحة بنر صورة جديدة وضبط أبعادها' : 'Add New Widescreen Image Slide & Framing')
          }
        >
          <form className="advanced-slider-modal-form focal-modal-pro" onSubmit={handleSaveImageSlide}>
            <div className="focal-modal-container">
              
              {/* 1. HERO ACTIVE UPLOADED IMAGE PREVIEW & SOURCE STUDIO */}
              <div className="focal-source-preview-card">
                <div className="focal-source-header">
                  <div className="source-title-group">
                    <FaImage style={{ color: 'var(--main-color)', fontSize: '18px' }} />
                    <div>
                      <h4>{isRtl ? 'معاينة ومصدر صورة البنر المرفوعة (Active Image Source)' : 'Active Image Source & Preview'}</h4>
                      <p>{isRtl ? 'معاينة حية للصورة الأصلية مع دعم الضغط والتحويل الفوري إلى WebP لتسريع التحميل' : 'Real-time preview of the active image with instant WebP compression'}</p>
                    </div>
                  </div>
                  <div className="source-meta-badges">
                    <span className="meta-badge webp">⚡ WebP Ultra HD</span>
                    <span className="meta-badge aspect">21:9 Widescreen</span>
                  </div>
                </div>

                <div className="focal-source-grid">
                  {/* Left: Active Image Crisp Preview Stage */}
                  <div className="active-image-preview-stage">
                    <div className="stage-frame">
                      <img
                        src={imageFormData.image_url || '/assets/slider/setup-workspace.png'}
                        alt="Active Uploaded Banner"
                        className="stage-img"
                      />
                      <div className="stage-overlay-badge">
                        <span>{isRtl ? 'معاينة الصورة الأصلية 📷' : 'Active Source Image 📷'}</span>
                      </div>
                    </div>
                    <div className="stage-footer-bar">
                      <span className="stage-url-text" title={imageFormData.image_url}>
                        {imageFormData.image_url || '/assets/slider/setup-workspace.png'}
                      </span>
                      <button
                        type="button"
                        className="btn-replace-img"
                        onClick={() => imageSliderFileInputRef.current?.click()}
                      >
                        <FaCloudArrowUp />
                        <span>{isRtl ? 'استبدال / رفع صورة' : 'Replace Image'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Right: Upload Dropzone & Direct URL Controls */}
                  <div className="source-controls-panel">
                    {/* formatFactory Dropzone */}
                    <div
                      className={`format-factory-dropzone ${isUploading ? 'uploading' : ''}`}
                      onClick={() => imageSliderFileInputRef.current?.click()}
                    >
                      <input
                        ref={imageSliderFileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleProcessImage(file, true);
                        }}
                      />
                      {isUploading ? (
                        <div className="dropzone-loading">
                          <FaSpinner className="spinner-icon" />
                          <span>{isRtl ? 'جاري ضغط ومعالجة الصورة إلى WebP...' : 'Optimizing and converting image...'}</span>
                        </div>
                      ) : (
                        <div className="dropzone-empty-prompt">
                          <div className="cloud-icon-circle">
                            <FaCloudArrowUp />
                          </div>
                          <h5>{isRtl ? 'انقر لرفع صورة أو اسحبها هنا' : 'Click to upload or drag image here'}</h5>
                          <p>{isRtl ? 'تحويل فوري إلى WebP لتسريع الصفحة 10 أضعاف' : 'Instant conversion to WebP for 10x faster loading'}</p>
                        </div>
                      )}
                    </div>

                    {/* Direct URL input */}
                    <div className="url-fallback-row">
                      <label>{isRtl ? 'أو ضع رابط مباشر للصورة هنا:' : 'Or direct Image URL:'}</label>
                      <input
                        type="text"
                        className="field-input"
                        placeholder="https://... أو /assets/slider/..."
                        value={imageFormData.image_url}
                        onChange={(e) => setImageFormData({ ...imageFormData, image_url: e.target.value })}
                      />
                    </div>

                    {/* Quick Presets Picker */}
                    <div className="presets-quick-bar">
                      <label className="presets-bar-title">
                        <FaWandMagicSparkles style={{ color: 'var(--main-color)' }} />
                        <span>{isRtl ? 'أو اختر بسرعة من الصور الجاهزة:' : 'Or Quick Pick Curated Presets:'}</span>
                      </label>
                      <div className="preset-thumbs-grid">
                        <button
                          type="button"
                          className={`preset-thumb-btn ${imageFormData.image_url === '/assets/slider/setup-workspace.png' ? 'selected' : ''}`}
                          onClick={() => setImageFormData({ ...imageFormData, image_url: '/assets/slider/setup-workspace.png' })}
                        >
                          <img src="/assets/slider/setup-workspace.png" alt="Gaming Setup" className="thumb-img" />
                          <span className="thumb-label">{isRtl ? 'سيت أب جيمنج' : 'Gaming'}</span>
                        </button>

                        <button
                          type="button"
                          className={`preset-thumb-btn ${imageFormData.image_url === '/assets/slider/laptop-bg.webp' ? 'selected' : ''}`}
                          onClick={() => setImageFormData({ ...imageFormData, image_url: '/assets/slider/laptop-bg.webp' })}
                        >
                          <img src="/assets/slider/laptop-bg.webp" alt="Laptops" className="thumb-img" />
                          <span className="thumb-label">{isRtl ? 'لابتوبات حديثة' : 'Laptops'}</span>
                        </button>

                        <button
                          type="button"
                          className={`preset-thumb-btn ${imageFormData.image_url === '/assets/slider/vacuum-bg.webp' ? 'selected' : ''}`}
                          onClick={() => setImageFormData({ ...imageFormData, image_url: '/assets/slider/vacuum-bg.webp' })}
                        >
                          <img src="/assets/slider/vacuum-bg.webp" alt="Smart Home" className="thumb-img" />
                          <span className="thumb-label">{isRtl ? 'منزل ذكي' : 'Smart Home'}</span>
                        </button>

                        <button
                          type="button"
                          className={`preset-thumb-btn ${imageFormData.image_url === '/assets/slider/cctv-bg.webp' ? 'selected' : ''}`}
                          onClick={() => setImageFormData({ ...imageFormData, image_url: '/assets/slider/cctv-bg.webp' })}
                        >
                          <img src="/assets/slider/cctv-bg.webp" alt="Security" className="thumb-img" />
                          <span className="thumb-label">{isRtl ? 'كاميرات 4K' : 'Security'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. INTERACTIVE FOCAL POINT & FRAMING STUDIO */}
              <div className="focal-point-studio-card">
                <div className="focal-studio-header">
                  <div className="header-text">
                    <h4>
                      <FaCrosshairs style={{ color: 'var(--main-color)' }} />
                      <span>{isRtl ? 'تحديد موضع ونقطة التركيز في الصورة (Interactive Focal Point Canvas)' : 'Interactive Focal Point Canvas'}</span>
                    </h4>
                    <p>{isRtl ? 'انقر أو اسحب الماوس في أي مكان لتحديد موضع تركيز الصورة بدقة، أو استخدم الشبكة وأزرار التحريك أدناه' : 'Click or drag anywhere on the canvas to set focal point'}</p>
                  </div>
                  <div className="coordinates-pill">
                    🎯 X: {imageFormData.image_position_x}% | Y: {imageFormData.image_position_y}%
                  </div>
                </div>

                <div className="focal-studio-grid-layout">
                  {/* Left: Ultra-Smooth Interactive Canvas & D-Pad */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div
                      className={`interactive-focal-canvas-wrap ${isDraggingPin ? 'active-dragging' : ''}`}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                      onWheel={handleWheelZoom}
                      title={isRtl ? 'اسحب الماوس في أي مكان لتحريك نقطة التركيز بسلاسة مطلقة، أو استخدم عجلة الماوس للزووم' : 'Drag smoothly anywhere to set focus point, or scroll wheel to zoom'}
                    >
                      {/* Top HUD Toolbar */}
                      <div className="canvas-hud-toolbar">
                        <div className="canvas-badge-tip">
                          <FaCrosshairs />
                          <span>{isRtl ? 'اسحب الماوس في أي اتجاه بسلاسة لتحريك الموضع' : 'Drag smoothly anywhere to reposition'}</span>
                        </div>
                        <div className="canvas-zoom-pill">
                          🔍 {imageFormData.image_zoom}%
                        </div>
                      </div>

                      {/* Ambient Glow if Contain */}
                      {imageFormData.image_fit === 'contain' && (
                        <div
                          className="canvas-ambient-glow"
                          style={{
                            backgroundImage: `url("${imageFormData.image_url || '/assets/slider/setup-workspace.png'}")`,
                          }}
                        />
                      )}

                      {/* Rule of Thirds Viewfinder Grid */}
                      <div className="canvas-grid-lines">
                        <div className="grid-line vertical line-1" />
                        <div className="grid-line vertical line-2" />
                        <div className="grid-line horizontal line-1" />
                        <div className="grid-line horizontal line-2" />
                      </div>

                      {/* Image Layer with Real-Time Framing */}
                      <div
                        className="canvas-bg-image"
                        style={{
                          backgroundImage: `url("${imageFormData.image_url || '/assets/slider/setup-workspace.png'}")`,
                          backgroundPosition: `${imageFormData.image_position_x}% ${imageFormData.image_position_y}%`,
                          backgroundSize: imageFormData.image_fit === 'contain' ? 'contain' : (imageFormData.image_zoom === 100 ? 'cover' : `${imageFormData.image_zoom}% auto`),
                          transition: isDraggingPin ? 'none' : 'background-position 0.25s cubic-bezier(0.16, 1, 0.3, 1), background-size 0.25s ease',
                        }}
                      />

                      {/* Dynamic Focal Point Pin with Floating Coordinate Tooltip */}
                      <div
                        className={`focal-crosshair-pin ${isDraggingPin ? 'is-dragging' : ''}`}
                        style={{
                          left: `${imageFormData.image_position_x}%`,
                          top: `${imageFormData.image_position_y}%`,
                          transition: isDraggingPin ? 'none' : 'top 0.2s cubic-bezier(0.16, 1, 0.3, 1), left 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                      >
                        <div className="pin-floating-tag">
                          X: {imageFormData.image_position_x}% , Y: {imageFormData.image_position_y}%
                        </div>
                      </div>
                    </div>

                    {/* Micro-Nudge D-Pad Controls for Ultra-Easy Adjustments */}
                    <div className="focal-nudge-dpad-container">
                      <div className="dpad-title-info">
                        <FaSliders style={{ color: 'var(--main-color)' }} />
                        <span>{isRtl ? 'تحريك دقيق وسهل (Micro Nudge):' : 'Easy Micro Nudge:'}</span>
                      </div>
                      <div className="dpad-buttons-cluster">
                        <button type="button" className="btn-nudge" onClick={() => nudgePosition(0, -5)} title={isRtl ? 'تحريك لأعلى 5%' : 'Nudge Up 5%'}>▲</button>
                        <button type="button" className="btn-nudge" onClick={() => nudgePosition(0, 5)} title={isRtl ? 'تحريك لأسفل 5%' : 'Nudge Down 5%'}>▼</button>
                        <button type="button" className="btn-nudge" onClick={() => nudgePosition(-5, 0)} title={isRtl ? 'تحريك لليسار 5%' : 'Nudge Left 5%'}>◀</button>
                        <button type="button" className="btn-nudge" onClick={() => nudgePosition(5, 0)} title={isRtl ? 'تحريك لليمين 5%' : 'Nudge Right 5%'}>▶</button>
                        <button type="button" className="btn-nudge btn-center-reset" onClick={() => setFocalAlignmentPreset(50, 50)} title={isRtl ? 'إعادة ضبط للمنتصف 50%' : 'Reset to Center'}>
                          🎯 {isRtl ? 'توسيط 50%' : 'Center'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right: Sizing & Framing Controls */}
                  <div className="focal-tools-column">
                    {/* Fit Mode Selector */}
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '6px' }}>
                        {isRtl ? 'نمط احتواء الصورة في السلايدر:' : 'Image Fit Mode:'}
                      </label>
                      <div className="fit-mode-pills-row">
                        <button
                          type="button"
                          className={`fit-pill-btn ${imageFormData.image_fit === 'cover' ? 'active' : ''}`}
                          onClick={() => setImageFormData({ ...imageFormData, image_fit: 'cover' })}
                        >
                          <FaCropSimple style={{ marginLeft: isRtl ? '4px' : '0', marginRight: isRtl ? '0' : '4px' }} />
                          <span>{isRtl ? 'Cover (ملء المساحة)' : 'Cover (Fill)'}</span>
                        </button>
                        <button
                          type="button"
                          className={`fit-pill-btn ${imageFormData.image_fit === 'contain' ? 'active' : ''}`}
                          onClick={() => setImageFormData({ ...imageFormData, image_fit: 'contain', blur_backdrop: true })}
                        >
                          <FaExpand style={{ marginLeft: isRtl ? '4px' : '0', marginRight: isRtl ? '0' : '4px' }} />
                          <span>{isRtl ? 'Contain (إظهار كامل)' : 'Contain (No Crop)'}</span>
                        </button>
                      </div>
                    </div>

                    {/* 3x3 Grid Presets */}
                    <div className="focal-9grid-container">
                      <label>{isRtl ? 'المحاذاة السريعة (3x3 Presets):' : 'Quick Alignment Presets:'}</label>
                      <div className="focal-9grid">
                        <button
                          type="button"
                          className={`grid-align-btn ${imageFormData.image_position_x === 0 && imageFormData.image_position_y === 0 ? 'active' : ''}`}
                          onClick={() => setFocalAlignmentPreset(0, 0)}
                        >
                          {isRtl ? 'أعلى يسار' : 'Top Left'}
                        </button>
                        <button
                          type="button"
                          className={`grid-align-btn ${imageFormData.image_position_x === 50 && imageFormData.image_position_y === 0 ? 'active' : ''}`}
                          onClick={() => setFocalAlignmentPreset(50, 0)}
                        >
                          {isRtl ? 'أعلى وسط' : 'Top Center'}
                        </button>
                        <button
                          type="button"
                          className={`grid-align-btn ${imageFormData.image_position_x === 100 && imageFormData.image_position_y === 0 ? 'active' : ''}`}
                          onClick={() => setFocalAlignmentPreset(100, 0)}
                        >
                          {isRtl ? 'أعلى يمين' : 'Top Right'}
                        </button>

                        <button
                          type="button"
                          className={`grid-align-btn ${imageFormData.image_position_x === 0 && imageFormData.image_position_y === 50 ? 'active' : ''}`}
                          onClick={() => setFocalAlignmentPreset(0, 50)}
                        >
                          {isRtl ? 'وسط يسار' : 'Center Left'}
                        </button>
                        <button
                          type="button"
                          className={`grid-align-btn ${imageFormData.image_position_x === 50 && imageFormData.image_position_y === 50 ? 'active' : ''}`}
                          onClick={() => setFocalAlignmentPreset(50, 50)}
                        >
                          {isRtl ? 'المركز 🎯' : 'Center 🎯'}
                        </button>
                        <button
                          type="button"
                          className={`grid-align-btn ${imageFormData.image_position_x === 100 && imageFormData.image_position_y === 50 ? 'active' : ''}`}
                          onClick={() => setFocalAlignmentPreset(100, 50)}
                        >
                          {isRtl ? 'وسط يمين' : 'Center Right'}
                        </button>

                        <button
                          type="button"
                          className={`grid-align-btn ${imageFormData.image_position_x === 0 && imageFormData.image_position_y === 100 ? 'active' : ''}`}
                          onClick={() => setFocalAlignmentPreset(0, 100)}
                        >
                          {isRtl ? 'أسفل يسار' : 'Bottom Left'}
                        </button>
                        <button
                          type="button"
                          className={`grid-align-btn ${imageFormData.image_position_x === 50 && imageFormData.image_position_y === 100 ? 'active' : ''}`}
                          onClick={() => setFocalAlignmentPreset(50, 100)}
                        >
                          {isRtl ? 'أسفل وسط' : 'Bottom Center'}
                        </button>
                        <button
                          type="button"
                          className={`grid-align-btn ${imageFormData.image_position_x === 100 && imageFormData.image_position_y === 100 ? 'active' : ''}`}
                          onClick={() => setFocalAlignmentPreset(100, 100)}
                        >
                          {isRtl ? 'أسفل يمين' : 'Bottom Right'}
                        </button>
                      </div>
                    </div>

                    {/* Fine-Tuning Sliders */}
                    <div className="focal-sliders-group">
                      {/* Zoom Slider */}
                      <div className="slider-control-row">
                        <div className="slider-label-row">
                          <span>{isRtl ? 'نسبة تكبير/حجم الصورة (Zoom Scale)' : 'Zoom Scale'}</span>
                          <span className="badge-val">{imageFormData.image_zoom}%</span>
                        </div>
                        <input
                          type="range"
                          min="80"
                          max="160"
                          step="5"
                          value={imageFormData.image_zoom}
                          onChange={(e) => setImageFormData({ ...imageFormData, image_zoom: Number(e.target.value) })}
                        />
                      </div>

                      {/* Position X Slider */}
                      <div className="slider-control-row">
                        <div className="slider-label-row">
                          <span>{isRtl ? 'الموضع الأفقي (Position X)' : 'Horizontal X%'}</span>
                          <span className="badge-val">{imageFormData.image_position_x}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={imageFormData.image_position_x}
                          onChange={(e) => setImageFormData({ ...imageFormData, image_position_x: Number(e.target.value) })}
                        />
                      </div>

                      {/* Position Y Slider */}
                      <div className="slider-control-row">
                        <div className="slider-label-row">
                          <span>{isRtl ? 'الموضع الرأسي (Position Y)' : 'Vertical Y%'}</span>
                          <span className="badge-val">{imageFormData.image_position_y}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={imageFormData.image_position_y}
                          onChange={(e) => setImageFormData({ ...imageFormData, image_position_y: Number(e.target.value) })}
                        />
                      </div>

                      {/* Vignette / Contrast Darkness */}
                      <div className="slider-control-row">
                        <div className="slider-label-row">
                          <span>{isRtl ? 'تعتيم التباين (Contrast Darkness)' : 'Vignette Darkness'}</span>
                          <span className="badge-val">{Math.round((imageFormData.overlay_opacity || 0) * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="0.8"
                          step="0.05"
                          value={imageFormData.overlay_opacity}
                          onChange={(e) => setImageFormData({ ...imageFormData, overlay_opacity: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional Headlines */}
              <div className="editor-fieldset-card">
                <div className="fieldset-header">
                  <div className="icon-title">
                    <FaPenToSquare style={{ color: 'var(--main-color)' }} />
                    <h4>{isRtl ? 'النصوص والعناوين (اختياري - لن تظهر إذا عطلت النصوص)' : 'Titles & Captions (Optional)'}</h4>
                  </div>
                </div>

                <div className="form-row-dual">
                  <div className="form-group-field">
                    <label>{isRtl ? 'العنوان الرئيسي (عربي)' : 'Main Title (Arabic)'}</label>
                    <input
                      type="text"
                      className="field-input"
                      value={imageFormData.title_ar}
                      onChange={(e) => setImageFormData({ ...imageFormData, title_ar: e.target.value })}
                      placeholder="عالم الجيمنج ومحطات العمل المتكاملة"
                    />
                  </div>

                  <div className="form-group-field">
                    <label>{isRtl ? 'العنوان الرئيسي (إنجليزي)' : 'Main Title (English)'}</label>
                    <input
                      type="text"
                      className="field-input"
                      value={imageFormData.title_en}
                      onChange={(e) => setImageFormData({ ...imageFormData, title_en: e.target.value })}
                      placeholder="Ultimate Gaming & Workstation Setup"
                    />
                  </div>
                </div>

                <div className="form-row-dual">
                  <div className="form-group-field">
                    <label>{isRtl ? 'العنوان الفرعي (عربي)' : 'Subtitle (Arabic)'}</label>
                    <input
                      type="text"
                      className="field-input"
                      value={imageFormData.subtitle_ar}
                      onChange={(e) => setImageFormData({ ...imageFormData, subtitle_ar: e.target.value })}
                      placeholder="أحدث التجهيزات التقنية والشاشات وملحقات الصوت الاحترافية"
                    />
                  </div>

                  <div className="form-group-field">
                    <label>{isRtl ? 'العنوان الفرعي (إنجليزي)' : 'Subtitle (English)'}</label>
                    <input
                      type="text"
                      className="field-input"
                      value={imageFormData.subtitle_en}
                      onChange={(e) => setImageFormData({ ...imageFormData, subtitle_en: e.target.value })}
                      placeholder="High-end tech workspace and professional audio"
                    />
                  </div>
                </div>
              </div>

              {/* Target Link & Route */}
              <div className="editor-fieldset-card">
                <div className="fieldset-header">
                  <div className="icon-title">
                    <FaBox style={{ color: 'var(--main-color)' }} />
                    <h4>{isRtl ? 'رابط التوجيه عند النقر على الصورة (Target URL)' : 'Target Link Destination'}</h4>
                  </div>
                </div>

                <div className="link-mode-tabs-cluster">
                  <button
                    type="button"
                    className={`mode-btn ${imageLinkMode === 'category' ? 'active' : ''}`}
                    onClick={() => setImageLinkMode('category')}
                  >
                    <FaFolder />
                    <span>{isRtl ? 'قسم / تصنيف' : 'Category'}</span>
                  </button>
                  <button
                    type="button"
                    className={`mode-btn ${imageLinkMode === 'product' ? 'active' : ''}`}
                    onClick={() => setImageLinkMode('product')}
                  >
                    <FaTag />
                    <span>{isRtl ? 'منتج محدد' : 'Product'}</span>
                  </button>
                  <button
                    type="button"
                    className={`mode-btn ${imageLinkMode === 'custom' ? 'active' : ''}`}
                    onClick={() => setImageLinkMode('custom')}
                  >
                    <FaSliders />
                    <span>{isRtl ? 'رابط مخصص' : 'Custom Route'}</span>
                  </button>
                </div>

                {imageLinkMode === 'category' && (
                  <div className="route-select-wrapper">
                    <CustomSelect
                      value={imageSelectedCatId}
                      onChange={(val) => setImageSelectedCatId(val)}
                      options={categorySelectOptions}
                      placeholder={isRtl ? 'اختر القسم المستهدف...' : 'Select category...'}
                      searchable={true}
                    />
                  </div>
                )}

                {imageLinkMode === 'product' && (
                  <div className="route-select-wrapper">
                    <CustomSelect
                      value={imageSelectedProdId}
                      onChange={(val) => setImageSelectedProdId(val)}
                      options={productSelectOptions}
                      placeholder={isRtl ? 'اختر المنتج المستهدف...' : 'Select product...'}
                      searchable={true}
                    />
                  </div>
                )}

                {imageLinkMode === 'custom' && (
                  <div className="form-group-field" style={{ marginTop: '10px' }}>
                    <input
                      type="text"
                      className="field-input"
                      placeholder="مثال: /categories/gaming أو /deals أو رابط خارجي https://..."
                      value={imageFormData.target_url}
                      onChange={(e) => setImageFormData({ ...imageFormData, target_url: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* Order & Status */}
              <div className="form-row-dual">
                <div className="form-group-field">
                  <label>{isRtl ? 'الترتيب (Sort Order)' : 'Sort Order'}</label>
                  <input
                    type="number"
                    min="1"
                    className="field-input"
                    value={imageFormData.sort_order}
                    onChange={(e) => setImageFormData({ ...imageFormData, sort_order: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group-field">
                  <label>{isRtl ? 'حالة التفعيل' : 'Active Status'}</label>
                  <label className="toggle-switch-field" style={{ height: '42px' }}>
                    <span>{imageFormData.is_active !== false ? (isRtl ? 'مفعل ويظهر في السلايدر' : 'Active & Visible') : (isRtl ? 'معطل' : 'Inactive')}</span>
                    <input
                      type="checkbox"
                      checked={imageFormData.is_active !== false}
                      onChange={(e) => setImageFormData({ ...imageFormData, is_active: e.target.checked })}
                    />
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsImageModalOpen(false)}
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="btn-submit-hero"
                  disabled={isUploading}
                >
                  <FaCheck />
                  <span>
                    {isUploading
                      ? (isRtl ? 'جاري المعالجة...' : 'Processing...')
                      : editingImageBanner
                      ? (isRtl ? 'حفظ وضبط الشريحة بنفس الشكل 100%' : 'Save Framing 100%')
                      : (isRtl ? 'إضافة الشريحة للسلايدر' : 'Add Slide to Slider')}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  );
}
