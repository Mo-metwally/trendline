'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
} from 'react-icons/fa6';
import { formatFactory, formatBytes } from '@/src/utils/formatFactory';
import HeroSlider from '@/src/components/homeComponents/HeroSlider/HeroSlider';
import './SliderManagement.scss';

export default function AdminSliderPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const toast = useToast();
  const [adminUser, setAdminUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lang, setLang] = useState('ar');

  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);
  const [hasUnsavedOrder, setHasUnsavedOrder] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(true);

  // Drag & Drop State
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State
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
  });

  // Advanced Theme & Finish Studio State
  const [themeMode, setThemeMode] = useState('preset'); // 'preset' | 'solid' | 'gradient'
  const [presetStyle, setPresetStyle] = useState('card-white-glass');
  const [solidColor, setSolidColor] = useState('#0057C2');
  const [gradientColor1, setGradientColor1] = useState('#0057C2');
  const [gradientColor2, setGradientColor2] = useState('#0f172a');
  const [gradientAngle, setGradientAngle] = useState(135);
  const [cardFinish, setCardFinish] = useState('glass'); // 'glass' | 'glossy' | 'matt'
  const [textColorMode, setTextColorMode] = useState('auto'); // 'auto' | 'light' | 'dark' | 'custom'
  const [customTextColor, setCustomTextColor] = useState('#ffffff');
  const [modalPreviewLang, setModalPreviewLang] = useState('ar');

  // Media / formatFactory State
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStats, setUploadStats] = useState(null);
  const fileInputRef = useRef(null);

  const isRtl = lang === 'ar';

  // Real-time computed mockup visual style
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

  // Fetch Banners, Categories, Products
  const fetchData = async () => {
    try {
      setLoading(true);
      const apiHost = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
        ? `http://${window.location.hostname}:5000`
        : 'http://localhost:5000';

      const [bannersRes, catsRes, prodsRes] = await Promise.all([
        fetch(`${apiHost}/api/v1/cms/banners?all=true`),
        fetch(`${apiHost}/api/v1/catalog/categories`),
        fetch(`${apiHost}/api/v1/catalog/products?limit=50`),
      ]);

      const [bannersJson, catsJson, prodsJson] = await Promise.all([
        bannersRes.json(),
        catsRes.json(),
        prodsRes.json(),
      ]);

      if (bannersJson.success) setBanners(bannersJson.data || []);
      if (catsJson.success) setCategories(catsJson.data || []);
      if (prodsJson.success) setProducts(prodsJson.data || []);
    } catch (err) {
      console.error('Failed to load slider data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ---------------- Drag & Drop Handlers ----------------
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

    const updated = [...banners];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    // Reassign sequential sort_orders
    const reordered = updated.map((item, idx) => ({
      ...item,
      sort_order: idx + 1,
    }));

    setBanners(reordered);
    setDraggedIndex(null);
    setDragOverIndex(null);
    setHasUnsavedOrder(true);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Move Up / Down Accessible Buttons
  const moveCard = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const updated = [...banners];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    const reordered = updated.map((item, idx) => ({
      ...item,
      sort_order: idx + 1,
    }));

    setBanners(reordered);
    setHasUnsavedOrder(true);
  };

  // Save Order to Backend
  const handleSaveOrder = async () => {
    try {
      setSavingOrder(true);
      const token = await ensureAuthToken();
      const apiHost = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
        ? `http://${window.location.hostname}:5000`
        : 'http://localhost:5000';

      const items = banners.map((b, idx) => ({ id: b.id, sort_order: idx + 1 }));

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
          isRtl ? 'تم حفظ الترتيب الجديد للسلايدر بنجاح!' : 'Order saved successfully!',
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

  // Toggle Active
  const handleToggleActive = async (banner) => {
    try {
      const token = await ensureAuthToken();
      const apiHost = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
        ? `http://${window.location.hostname}:5000`
        : 'http://localhost:5000';

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
            ? (isRtl ? 'تم تفعيل ظهور الكارت في السلايدر' : 'Card activated')
            : (isRtl ? 'تم إخفاء الكارت من السلايدر' : 'Card deactivated'),
          isRtl ? 'حالة الكارت' : 'Card Status'
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Add Modal
  const handleOpenAdd = () => {
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
      sort_order: banners.length + 1,
      is_active: true,
    });
    setLinkMode('category');
    setSelectedCategoryId(categories[0]?.id || '');
    setSelectedProductId(products[0]?.id || '');
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
    setCustomTextColor('#ffffff');
    setModalPreviewLang(lang);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title_ar: banner.title_ar || banner.title || '',
      title_en: banner.title_en || '',
      subtitle_ar: banner.subtitle_ar || banner.subtitle || '',
      subtitle_en: banner.subtitle_en || '',
      badge_text_ar: banner.badge_text_ar || banner.badge_text || '',
      badge_text_en: banner.badge_text_en || '',
      image_url: banner.image_url || '',
      bg_style: banner.bg_style || 'card-white-glass',
      button_text_ar: banner.button_text_ar || banner.button_text || 'تسوق الآن',
      button_text_en: banner.button_text_en || 'Shop Now',
      target_url: banner.target_url || '',
      sort_order: banner.sort_order || 1,
      is_active: banner.is_active !== undefined ? banner.is_active : true,
    });

    setImagePreview(banner.image_url || '');
    setUploadStats(null);
    setModalPreviewLang(lang);

    // Parse Theme and Finish
    if (banner.bg_style?.startsWith('custom:')) {
      try {
        const parsed = JSON.parse(banner.bg_style.replace('custom:', ''));
        if (parsed.bgType === 'gradient') {
          setThemeMode('gradient');
          setGradientColor1(parsed.color1 || '#0057C2');
          setGradientColor2(parsed.color2 || '#0f172a');
          setGradientAngle(parsed.gradientAngle || 135);
        } else if (parsed.bgType === 'solid') {
          setThemeMode('solid');
          setSolidColor(parsed.color1 || '#0057C2');
        } else if (parsed.bgType === 'preset') {
          setThemeMode('preset');
          setPresetStyle(parsed.preset || 'card-white-glass');
        }
        setCardFinish(parsed.finish || 'glass');
        if (parsed.textColor) {
          setCustomTextColor(parsed.textColor);
          setTextColorMode(parsed.textColor === '#ffffff' ? 'light' : (parsed.textColor === '#0f172a' ? 'dark' : 'custom'));
        }
      } catch (e) {
        setThemeMode('preset');
        setPresetStyle('card-white-glass');
        setCardFinish('glass');
      }
    } else {
      setThemeMode('preset');
      setPresetStyle(banner.bg_style || 'card-white-glass');
      setCardFinish('glass');
      setTextColorMode('auto');
    }

    // Determine link mode
    if (banner.target_url?.startsWith('/categories/')) {
      setLinkMode('category');
      const slug = banner.target_url.replace('/categories/', '');
      const matchCat = categories.find((c) => c.slug === slug || String(c.id) === slug);
      if (matchCat) setSelectedCategoryId(matchCat.id);
    } else if (banner.target_url?.startsWith('/products/')) {
      setLinkMode('product');
      const slug = banner.target_url.replace('/products/', '');
      const matchProd = products.find((p) => p.slug === slug || String(p.id) === slug);
      if (matchProd) setSelectedProductId(matchProd.id);
    } else {
      setLinkMode('custom');
    }

    setIsModalOpen(true);
  };

  // Image Processing & Compression via formatFactory (WebP 80%)
  const handleProcessImage = async (file) => {
    if (!file) return;
    try {
      setIsUploading(true);
      const result = await formatFactory(file, { quality: 0.8, maxDimension: 1200 });
      setImagePreview(result.previewUrl);
      setUploadStats({
        originalSize: result.originalSize,
        formattedSize: result.formattedSize,
        savingsPercent: result.savingsPercent,
      });

      // Upload formatted WebP to server in background
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
          setFormData((prev) => ({ ...prev, image_url: data.url }));
          toast.success(
            isRtl
              ? `تم ضغط الصورة إلى WebP وحفظها على الخادم بنجاح (وفر ${result.savingsPercent}%)`
              : `Image converted to WebP and saved successfully (Saved ${result.savingsPercent}%)`,
            isRtl ? 'محرك formatFactory' : 'formatFactory Engine'
          );
          return;
        }
      }

      // If server upload endpoint fails, convert to permanent Base64 Data URL so it is never a temporary dead blob!
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result;
        setFormData((prev) => ({ ...prev, image_url: base64data }));
      };
      reader.readAsDataURL(result.file);

      toast.info(
        isRtl ? 'تم تجهيز الصورة ومعاينتها محلياً بصيغة WebP 80%' : 'Image ready locally (WebP 80%)',
        isRtl ? 'محرك formatFactory' : 'formatFactory'
      );
    } catch (err) {
      console.error('Image processing error:', err);
      toast.error(
        err.message || (isRtl ? 'فشل معالجة الصورة عبر formatFactory' : 'Failed to process image'),
        isRtl ? 'خطأ في معالجة الوسائط' : 'Media Processing Error'
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleProcessImage(file);
  };

  const handleDropImage = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleProcessImage(file);
    }
  };

  // Save Add/Edit Banner
  const handleSaveBanner = async (e) => {
    e.preventDefault();
    if (isUploading) {
      toast.warning(
        isRtl ? 'جاري استكمال رفع ومعالجة الصورة، يرجى الانتظار ثانية واحدة...' : 'Image upload is still completing, please wait a second...',
        isRtl ? 'جاري الرفع' : 'Uploading'
      );
      return;
    }

    try {
      const token = await ensureAuthToken();
      const apiHost = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
        ? `http://${window.location.hostname}:5000`
        : 'http://localhost:5000';

      // Ensure image_url is not a dead temporary blob URL
      let finalImageUrl = formData.image_url || imagePreview || '';
      if (finalImageUrl.startsWith('blob:') && imagePreview) {
        finalImageUrl = imagePreview;
      }

      // Build target URL based on selected link mode
      let targetUrl = formData.target_url;
      if (linkMode === 'category') {
        const cat = categories.find((c) => String(c.id) === String(selectedCategoryId));
        targetUrl = cat ? `/categories/${cat.slug || cat.id}` : '/categories';
      } else if (linkMode === 'product') {
        const prod = products.find((p) => String(p.id) === String(selectedProductId));
        targetUrl = prod ? `/products/${prod.slug || prod.id}` : '/products';
      }

      // Serialize bg_style
      let finalBgStyle = 'card-white-glass';
      if (themeMode === 'preset') {
        if (cardFinish !== 'glass') {
          finalBgStyle = `custom:${JSON.stringify({
            bgType: 'preset',
            preset: presetStyle,
            finish: cardFinish,
          })}`;
        } else {
          finalBgStyle = presetStyle;
        }
      } else if (themeMode === 'solid') {
        finalBgStyle = `custom:${JSON.stringify({
          bgType: 'solid',
          color1: solidColor,
          finish: cardFinish,
          textColor: textColorMode === 'light' ? '#ffffff' : (textColorMode === 'dark' ? '#0f172a' : customTextColor),
        })}`;
      } else if (themeMode === 'gradient') {
        finalBgStyle = `custom:${JSON.stringify({
          bgType: 'gradient',
          color1: gradientColor1,
          color2: gradientColor2,
          gradientAngle: Number(gradientAngle),
          finish: cardFinish,
          textColor: textColorMode === 'dark' ? '#0f172a' : (textColorMode === 'custom' ? customTextColor : '#ffffff'),
        })}`;
      }

      const payload = {
        ...formData,
        image_url: finalImageUrl,
        title_en: formData.title_en || formData.title_ar,
        subtitle_en: formData.subtitle_en || formData.subtitle_ar,
        button_text_ar: formData.button_text_ar || 'تسوق الآن',
        button_text_en: formData.button_text_en || 'Shop Now',
        target_url: targetUrl,
        bg_style: finalBgStyle,
      };

      let res;
      if (editingBanner) {
        res = await fetch(`${apiHost}/api/v1/cms/banners/${editingBanner.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${apiHost}/api/v1/cms/banners`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        toast.success(
          editingBanner
            ? (isRtl ? 'تم تحديث كارت السلايدر بنجاح' : 'Slider card updated successfully')
            : (isRtl ? 'تم إضافة كارت السلايدر الجديد بنجاح' : 'New slider card created successfully'),
          isRtl ? 'إدارة السلايدر' : 'Slider Management'
        );
        fetchData();
      } else {
        toast.error(json.message || (isRtl ? 'حدث خطأ أثناء حفظ الكارت' : 'Error saving card'));
      }
    } catch (err) {
      console.error(err);
      toast.error(isRtl ? 'خطأ في الاتصال بالخادم أثناء الحفظ' : 'Network error saving banner');
    }
  };

  // Delete Banner
  const handleDeleteBanner = async (id) => {
    if (!confirm(isRtl ? 'هل أنت متأكد من حذف هذا الكارت من السلايدر؟' : 'Are you sure you want to delete this card?')) return;
    try {
      const token = await ensureAuthToken();
      const apiHost = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
        ? `http://${window.location.hostname}:5000`
        : 'http://localhost:5000';

      const res = await fetch(`${apiHost}/api/v1/cms/banners/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setBanners(banners.filter((b) => b.id !== id));
        toast.success(
          isRtl ? 'تم حذف الكارت من السلايدر بنجاح' : 'Card deleted successfully',
          isRtl ? 'حذف كارت' : 'Card Deleted'
        );
      } else {
        toast.error(isRtl ? 'تعذر حذف الكارت' : 'Could not delete card');
      }
    } catch (err) {
      console.error(err);
      toast.error(isRtl ? 'خطأ في الاتصال أثناء حذف الكارت' : 'Error deleting card');
    }
  };

  return (
    <div className="slider-admin-page" dir={isRtl ? 'rtl' : 'ltr'}>
      <AdminSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        lang={lang}
      />

      <div className="main-content">
        <AdminHeader
          user={adminUser}
          onLogout={() => {
            localStorage.removeItem('trendline_admin_token');
            router.push('/admin/login');
          }}
          lang={lang}
          onToggleLang={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          isSidebarCollapsed={sidebarCollapsed}
        />

        <div className="content-body">
          {/* Top Bar */}
          <div className="page-top-bar">
            <div className="title-group">
              <h1 className="page-title">
                {isRtl ? 'إدارة سلايدر الصفحة الرئيسية (Hero Slider)' : 'Hero Slider Management'}
              </h1>
              <p className="page-desc">
                {isRtl
                  ? 'تحكم بالسحب والإفلات (Drag & Drop) في كروت العروض، تخصيص الروابط للأقسام أو المنتجات أو الصفحات، وتحديث الترتيب فورا'
                  : 'Full Drag & Drop control to reorder slider cards, assign categories, products, or custom promo links'}
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

              <button className="btn-add-slide" onClick={handleOpenAdd}>
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

          {/* Collapsible Live Storefront Preview */}
          <div className="preview-collapsible-box">
            <div
              className="preview-header"
              onClick={() => setShowLivePreview(!showLivePreview)}
            >
              <div className="preview-title">
                <FaEye />
                <span>{isRtl ? 'معاينة حية لشكل السلايدر في المتجر' : 'Live Storefront Slider Preview'}</span>
              </div>
              <button className="preview-toggle-btn">
                {showLivePreview ? (isRtl ? 'إخفاء المعاينة ▴' : 'Hide Preview ▴') : (isRtl ? 'عرض المعاينة ▾' : 'Show Preview ▾')}
              </button>
            </div>

            {showLivePreview && (
              <div className="preview-body-content">
                <HeroSlider lang={lang} />
              </div>
            )}
          </div>

          {/* Cards Sortable Drag & Drop List */}
          <div className="cards-sortable-container">
            {banners.map((banner, index) => {
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
                      className="btn-move"
                      onClick={() => moveCard(index, -1)}
                      disabled={index === 0}
                      title="تحريك لأعلى"
                    >
                      ▲
                    </button>
                    <button
                      className="btn-move"
                      onClick={() => moveCard(index, 1)}
                      disabled={index === banners.length - 1}
                      title="تحريك لأسفل"
                    >
                      ▼
                    </button>

                    <button
                      className={`status-toggle-pill ${banner.is_active ? 'active' : 'inactive'}`}
                      onClick={() => handleToggleActive(banner)}
                    >
                      {banner.is_active ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'معطل' : 'Inactive')}
                    </button>

                    <button
                      className="btn-action-icon"
                      onClick={() => handleOpenEdit(banner)}
                      title="تعديل الكارت"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>

                    <button
                      className="btn-action-icon delete"
                      onClick={() => handleDeleteBanner(banner.id)}
                      title="حذف الكارت"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add / Edit Banner Modal */}
      {/* Add / Edit Banner Modal (Amazon / Salla Grade Studio) */}
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
          <form className="advanced-slider-modal-form" onSubmit={handleSaveBanner}>
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
                        isRtl={isRtl}
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
                        isRtl={isRtl}
                      />
                    </div>
                  )}

                  {linkMode === 'custom' && (
                    <div className="route-select-wrapper">
                      <input
                        type="text"
                        className="field-input"
                        placeholder="مثال: /deals أو /register أو /track-order أو https://..."
                        value={formData.target_url}
                        onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                {/* 3. Card Visual Style & Color Studio */}
                <div className="editor-fieldset-card studio-theme-card">
                  <div className="fieldset-header">
                    <div className="icon-title">
                      <FaPalette style={{ color: 'var(--main-color)' }} />
                      <h4>{isRtl ? 'استوديو نمط ومظهر وألوان الكارت (Card Theme & Colors)' : 'Card Visual Style & Color Studio'}</h4>
                    </div>
                  </div>

                  {/* Mode Selector (Presets vs Solid vs Gradient) */}
                  <div className="theme-mode-pills">
                    <button
                      type="button"
                      className={`theme-pill ${themeMode === 'preset' ? 'active' : ''}`}
                      onClick={() => setThemeMode('preset')}
                    >
                      <FaGem />
                      <span>{isRtl ? 'قوالب جاهزة (Presets)' : 'Ready Presets'}</span>
                    </button>
                    <button
                      type="button"
                      className={`theme-pill ${themeMode === 'solid' ? 'active' : ''}`}
                      onClick={() => setThemeMode('solid')}
                    >
                      <FaPalette />
                      <span>{isRtl ? 'لون مخصص مصمت (Solid)' : 'Solid Color'}</span>
                    </button>
                    <button
                      type="button"
                      className={`theme-pill ${themeMode === 'gradient' ? 'active' : ''}`}
                      onClick={() => setThemeMode('gradient')}
                    >
                      <FaWandMagicSparkles />
                      <span>{isRtl ? 'تدرج بين لونين (Gradient)' : '2-Color Gradient'}</span>
                    </button>
                  </div>

                  {/* Presets Grid */}
                  {themeMode === 'preset' && (
                    <div className="presets-select-grid">
                      <div
                        className={`preset-card-item ${presetStyle === 'card-white-glass' ? 'active' : ''}`}
                        onClick={() => setPresetStyle('card-white-glass')}
                      >
                        <div className="preset-swatch-box swatch-white-glass"></div>
                        <span className="preset-name">{isRtl ? 'زجاجي أبيض (منتج)' : 'White Glass'}</span>
                      </div>

                      <div
                        className={`preset-card-item ${presetStyle === 'card-primary-cta' ? 'active' : ''}`}
                        onClick={() => setPresetStyle('card-primary-cta')}
                      >
                        <div className="preset-swatch-box swatch-royal-blue"></div>
                        <span className="preset-name">{isRtl ? 'أزرق ملكي (عضوية/CTA)' : 'Royal Blue'}</span>
                      </div>

                      <div
                        className={`preset-card-item ${presetStyle === 'card-bank-promo' ? 'active' : ''}`}
                        onClick={() => setPresetStyle('card-bank-promo')}
                      >
                        <div className="preset-swatch-box swatch-dark-bank"></div>
                        <span className="preset-name">{isRtl ? 'داكن (عروض البنوك)' : 'Dark Bank'}</span>
                      </div>

                      <div
                        className={`preset-card-item ${presetStyle === 'card-cyber-purple' ? 'active' : ''}`}
                        onClick={() => setPresetStyle('card-cyber-purple')}
                      >
                        <div className="preset-swatch-box swatch-cyber-purple"></div>
                        <span className="preset-name">{isRtl ? 'سايبر بنفسجي' : 'Cyber Purple'}</span>
                      </div>

                      <div
                        className={`preset-card-item ${presetStyle === 'card-neon-emerald' ? 'active' : ''}`}
                        onClick={() => setPresetStyle('card-neon-emerald')}
                      >
                        <div className="preset-swatch-box swatch-neon-emerald"></div>
                        <span className="preset-name">{isRtl ? 'زمردي نيون' : 'Neon Emerald'}</span>
                      </div>

                      <div
                        className={`preset-card-item ${presetStyle === 'card-sunset-coral' ? 'active' : ''}`}
                        onClick={() => setPresetStyle('card-sunset-coral')}
                      >
                        <div className="preset-swatch-box swatch-sunset-coral"></div>
                        <span className="preset-name">{isRtl ? 'مرجاني دافئ' : 'Sunset Coral'}</span>
                      </div>
                    </div>
                  )}

                  {/* Solid Color Customizer */}
                  {themeMode === 'solid' && (
                    <div className="custom-color-controls">
                      <div className="color-picker-dual-row">
                        <div className="color-input-tile">
                          <label>{isRtl ? 'اختر لون خلفية الكارت' : 'Card Background Color'}</label>
                          <div className="color-picker-input-group">
                            <input
                              type="color"
                              className="color-wheel-circle"
                              value={solidColor}
                              onChange={(e) => setSolidColor(e.target.value)}
                            />
                            <input
                              type="text"
                              className="color-hex-text"
                              value={solidColor}
                              onChange={(e) => setSolidColor(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="quick-swatches-cluster">
                          <label>{isRtl ? 'باليت ألوان سريعة:' : 'Quick Swatches:'}</label>
                          <div className="swatches-row">
                            {['#0057C2', '#0f172a', '#10b981', '#6366f1', '#e11d48', '#ea580c', '#f8fafc'].map((c) => (
                              <button
                                key={c}
                                type="button"
                                className="swatch-btn"
                                style={{ background: c }}
                                onClick={() => setSolidColor(c)}
                                title={c}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Two-Color Gradient Customizer */}
                  {themeMode === 'gradient' && (
                    <div className="custom-gradient-controls">
                      <div className="gradient-pickers-row">
                        <div className="color-input-tile">
                          <label>{isRtl ? 'اللون الأول (بداية التدرج)' : 'Color 1 (Start)'}</label>
                          <div className="color-picker-input-group">
                            <input
                              type="color"
                              className="color-wheel-circle"
                              value={gradientColor1}
                              onChange={(e) => setGradientColor1(e.target.value)}
                            />
                            <input
                              type="text"
                              className="color-hex-text"
                              value={gradientColor1}
                              onChange={(e) => setGradientColor1(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="color-input-tile">
                          <label>{isRtl ? 'اللون الثاني (نهاية التدرج)' : 'Color 2 (End)'}</label>
                          <div className="color-picker-input-group">
                            <input
                              type="color"
                              className="color-wheel-circle"
                              value={gradientColor2}
                              onChange={(e) => setGradientColor2(e.target.value)}
                            />
                            <input
                              type="text"
                              className="color-hex-text"
                              value={gradientColor2}
                              onChange={(e) => setGradientColor2(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="angle-input-tile">
                          <label>{isRtl ? 'زاوية التدرج' : 'Gradient Angle'}</label>
                          <select
                            className="field-select"
                            value={gradientAngle}
                            onChange={(e) => setGradientAngle(Number(e.target.value))}
                          >
                            <option value={45}>45° ({isRtl ? 'مائل قطري' : 'Diagonal'})</option>
                            <option value={90}>90° ({isRtl ? 'أفقي' : 'Horizontal'})</option>
                            <option value={135}>135° ({isRtl ? 'قياسي عصري' : 'Modern 135°'})</option>
                            <option value={180}>180° ({isRtl ? 'رأسي من أعلى لأسفل' : 'Vertical'})</option>
                            <option value={225}>225° ({isRtl ? 'معكوس قطري' : 'Reverse Diagonal'})</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Finish Texture Chips (Glass vs Glossy vs Matt) */}
                  <div className="finish-texture-section">
                    <label className="section-sub-label">
                      <FaWandMagicSparkles style={{ color: 'var(--main-color)' }} />
                      <span>{isRtl ? 'المظهر واللمسة النهائية (Finish & Texture):' : 'Card Surface Finish & Texture:'}</span>
                    </label>

                    <div className="finish-chips-group">
                      <button
                        type="button"
                        className={`finish-chip-btn ${cardFinish === 'glass' ? 'active' : ''}`}
                        onClick={() => setCardFinish('glass')}
                      >
                        <div className="finish-icon-preview finish-preview-glass"></div>
                        <div className="finish-info">
                          <span className="finish-title">{isRtl ? 'زجاجي شفاف (Glass)' : 'Frosted Glass'}</span>
                          <span className="finish-desc">{isRtl ? 'تأثير زجاج بلوري عصري' : 'Soft frosted blur'}</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        className={`finish-chip-btn ${cardFinish === 'glossy' ? 'active' : ''}`}
                        onClick={() => setCardFinish('glossy')}
                      >
                        <div className="finish-icon-preview finish-preview-glossy"></div>
                        <div className="finish-info">
                          <span className="finish-title">{isRtl ? 'لامع (Glossy)' : 'Glossy Sheen'}</span>
                          <span className="finish-desc">{isRtl ? 'بريق كريستالي عاكس' : 'Reflective crystal sheen'}</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        className={`finish-chip-btn ${cardFinish === 'matt' ? 'active' : ''}`}
                        onClick={() => setCardFinish('matt')}
                      >
                        <div className="finish-icon-preview finish-preview-matt"></div>
                        <div className="finish-info">
                          <span className="finish-title">{isRtl ? 'مطفي (Matt / Matte)' : 'Matte Satin'}</span>
                          <span className="finish-desc">{isRtl ? 'مخملي ناعم غير عاكس' : 'Velvety smooth diffusion'}</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Text Color Chooser for solid / gradient */}
                  {(themeMode === 'solid' || themeMode === 'gradient') && (
                    <div className="text-color-mode-row">
                      <label>{isRtl ? 'لون نصوص الكارت:' : 'Card Text Color:'}</label>
                      <div className="text-color-pills">
                        <button
                          type="button"
                          className={`txt-pill ${textColorMode === 'light' || (textColorMode === 'auto' && themeMode !== 'solid') ? 'active' : ''}`}
                          onClick={() => { setTextColorMode('light'); setCustomTextColor('#ffffff'); }}
                        >
                          <span className="dot-white"></span>
                          <span>{isRtl ? 'نصوص بيضاء ناصعة' : 'White Text'}</span>
                        </button>
                        <button
                          type="button"
                          className={`txt-pill ${textColorMode === 'dark' ? 'active' : ''}`}
                          onClick={() => { setTextColorMode('dark'); setCustomTextColor('#0f172a'); }}
                        >
                          <span className="dot-dark"></span>
                          <span>{isRtl ? 'نصوص داكنة كحلية' : 'Dark Navy Text'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. formatFactory Image Engine & Dropzone */}
                <div className="editor-fieldset-card">
                  <div className="fieldset-header">
                    <div className="icon-title">
                      <FaWandMagicSparkles style={{ color: 'var(--main-color)' }} />
                      <h4>{isRtl ? 'صورة الكارت ومعالج الوسائط (formatFactory WebP 80%)' : 'Card Asset (formatFactory WebP 80%)'}</h4>
                    </div>
                    {uploadStats && (
                      <span className="savings-badge-pill">
                        {isRtl ? `وفر ${uploadStats.savingsPercent}%` : `Saved ${uploadStats.savingsPercent}%`}
                      </span>
                    )}
                  </div>

                  <div
                    className={`format-factory-dropzone ${isUploading ? 'uploading' : ''}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDropImage}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      style={{ display: 'none' }}
                    />

                    {isUploading ? (
                      <div className="dropzone-loading">
                        <FaRotate className="spinner-icon" />
                        <span>{isRtl ? 'جاري ضغط وتحويل الصورة إلى WebP 80%...' : 'Compressing to WebP 80%...'}</span>
                      </div>
                    ) : imagePreview ? (
                      <div className="dropzone-preview-box">
                        <img src={imagePreview} alt="Preview" className="uploaded-thumb" />
                        <div className="thumb-overlay">
                          <FaCloudArrowUp />
                          <span>{isRtl ? 'اضغط أو اسحب صورة جديدة للتغيير' : 'Click or drop to replace'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="dropzone-empty-prompt">
                        <div className="cloud-icon-circle">
                          <FaCloudArrowUp />
                        </div>
                        <h5>{isRtl ? 'اسحب وأفلت صورة الكارت هنا أو اضغط للاختيار' : 'Drag & drop card asset or click to browse'}</h5>
                        <p>{isRtl ? 'يقوم محرك formatFactory تلقائياً بتحويل الصورة لصيغة WebP المضغوطة بجودة 80%' : 'formatFactory auto-converts to optimized 80% WebP'}</p>
                      </div>
                    )}
                  </div>

                  <div className="url-fallback-row">
                    <label>{isRtl ? 'أو أدخل رابط مباشر للصورة (Direct URL):' : 'Or enter direct asset URL:'}</label>
                    <input
                      type="text"
                      className="field-input"
                      placeholder="https://images.trendlineeg.com/products/laptop-hero.png"
                      value={formData.image_url}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, image_url: val });
                        setImagePreview(val);
                      }}
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

                  {/* The Live Rendered Card Mockup */}
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
                    {/* 100% Full Bleed Background Image Layer */}
                    {(imagePreview || formData.image_url) ? (
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
                    ) : null}

                    {/* Top Content (Badge, Title, Subtitle) */}
                    <div className="mockup-card-top-content">
                      {/* Top Badge */}
                      {(modalPreviewLang === 'ar' ? formData.badge_text_ar : (formData.badge_text_en || formData.badge_text_ar)) && (
                        <div className="mockup-top-badge">
                          <span>
                            {modalPreviewLang === 'ar' ? formData.badge_text_ar : (formData.badge_text_en || formData.badge_text_ar)}
                          </span>
                        </div>
                      )}

                      {/* Main Title */}
                      <h3
                        className="mockup-title"
                        style={{ color: computedCardStyle.color }}
                      >
                        {(modalPreviewLang === 'ar' ? formData.title_ar : (formData.title_en || formData.title_ar)) ||
                          (isRtl ? 'عنوان الكارت الرئيسي' : 'Card Main Title')}
                      </h3>

                      {/* Subtitle */}
                      <p
                        className="mockup-subtitle"
                        style={{ color: computedCardStyle.color, opacity: 0.9 }}
                      >
                        {(modalPreviewLang === 'ar' ? formData.subtitle_ar : (formData.subtitle_en || formData.subtitle_ar)) ||
                          (isRtl ? 'الوصف الترويجي والمزايا الحصرية' : 'Promotional tagline and perks')}
                      </p>
                    </div>

                    {/* If no image yet, show a clean modern placeholder badge */}
                    {!(imagePreview || formData.image_url) && (
                      <div className="mockup-empty-center-hint">
                        <FaCloudArrowUp style={{ fontSize: '30px', opacity: 0.4 }} />
                        <span>{isRtl ? 'ارفع صورة لتغطي مساحة الكارت بالكامل' : 'Upload an image to fill the entire card'}</span>
                      </div>
                    )}

                    {/* Visual Center Spacer */}
                    <div className="mockup-card-center-spacer" />

                    {/* CTA Button */}
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

                  {/* Realtime Specs Footer Info */}
                  <div className="mockup-specs-footer">
                    <div className="spec-badge">
                      <span className="spec-label">{isRtl ? 'النمط:' : 'Theme:'}</span>
                      <span className="spec-val">
                        {themeMode === 'gradient'
                          ? (isRtl ? 'تدرج مخصص' : 'Custom Gradient')
                          : themeMode === 'solid'
                          ? (isRtl ? 'لون مصمت' : 'Solid Color')
                          : (isRtl ? 'قالب متجر' : 'Store Preset')}
                      </span>
                    </div>

                    <div className="spec-badge">
                      <span className="spec-label">{isRtl ? 'المظهر:' : 'Finish:'}</span>
                      <span className="spec-val">
                        {cardFinish === 'glossy'
                          ? (isRtl ? 'لامع' : 'Glossy')
                          : cardFinish === 'matt'
                          ? (isRtl ? 'مطفي' : 'Matte')
                          : (isRtl ? 'زجاجي' : 'Glass')}
                      </span>
                    </div>

                    <div className="spec-badge">
                      <span className="spec-label">{isRtl ? 'التوجيه:' : 'Route:'}</span>
                      <span className="spec-val">
                        {linkMode === 'category' ? '/categories/...' : linkMode === 'product' ? '/products/...' : formData.target_url || '/'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  );
}
