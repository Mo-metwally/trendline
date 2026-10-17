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
} from 'react-icons/fa6';
import HeroSlider from '@/src/components/homeComponents/HeroSlider/HeroSlider';
import './SliderManagement.scss';

export default function AdminSliderPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
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

  const [imagePreview, setImagePreview] = useState('');
  const isRtl = lang === 'ar';

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
        alert(isRtl ? 'تم حفظ الترتيب الجديد بنجاح!' : 'Order saved successfully!');
      } else {
        alert(json.message || 'Failed to save order');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving order');
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

      const res = await fetch(`${apiHost}/api/v1/cms/banners/${banner.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !banner.is_active }),
      });

      if (res.ok) {
        setBanners(banners.map((b) => (b.id === banner.id ? { ...b, is_active: !b.is_active } : b)));
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
    setImagePreview('');
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

  // Handle Image Drop / Pick
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const blobUrl = URL.createObjectURL(file);
      setImagePreview(blobUrl);
      setFormData((prev) => ({ ...prev, image_url: blobUrl }));
    }
  };

  // Save Add/Edit Banner
  const handleSaveBanner = async (e) => {
    e.preventDefault();
    try {
      const token = await ensureAuthToken();
      const apiHost = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
        ? `http://${window.location.hostname}:5000`
        : 'http://localhost:5000';

      // Build target URL based on selected link mode
      let targetUrl = formData.target_url;
      if (linkMode === 'category') {
        const cat = categories.find((c) => String(c.id) === String(selectedCategoryId));
        targetUrl = cat ? `/categories/${cat.slug || cat.id}` : '/categories';
      } else if (linkMode === 'product') {
        const prod = products.find((p) => String(p.id) === String(selectedProductId));
        targetUrl = prod ? `/products/${prod.slug || prod.id}` : '/products';
      }

      const payload = {
        ...formData,
        target_url: targetUrl,
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
        fetchData();
      } else {
        alert(json.message || 'Error saving banner');
      }
    } catch (err) {
      console.error(err);
      alert('Network error saving banner');
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
      }
    } catch (err) {
      console.error(err);
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
      {isModalOpen && (
        <AdminModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingBanner ? (isRtl ? 'تعديل كارت السلايدر' : 'Edit Slider Card') : (isRtl ? 'إضافة كارت جديد للسلايدر' : 'Add New Slider Card')}
        >
          <form className="slide-edit-form" onSubmit={handleSaveBanner}>
            {/* Title bilingual */}
            <div className="form-row">
              <div className="form-group">
                <label>{isRtl ? 'عنوان الكارت (عربي) *' : 'Title (Arabic) *'}</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.title_ar}
                  onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                  placeholder="مثال: أجهزة لابتوب وإكسسواراتها"
                />
              </div>

              <div className="form-group">
                <label>{isRtl ? 'عنوان الكارت (إنجليزي)' : 'Title (English)'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.title_en}
                  onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                  placeholder="e.g. Laptops & Accessories"
                />
              </div>
            </div>

            {/* Subtitle bilingual */}
            <div className="form-row">
              <div className="form-group">
                <label>{isRtl ? 'الوصف الفرعي (عربي)' : 'Subtitle (Arabic)'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.subtitle_ar}
                  onChange={(e) => setFormData({ ...formData, subtitle_ar: e.target.value })}
                  placeholder="مثال: أداء أعلى... لكل احتياجاتك"
                />
              </div>

              <div className="form-group">
                <label>{isRtl ? 'الوصف الفرعي (إنجليزي)' : 'Subtitle (English)'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.subtitle_en}
                  onChange={(e) => setFormData({ ...formData, subtitle_en: e.target.value })}
                  placeholder="e.g. Top Performance for Every Need"
                />
              </div>
            </div>

            {/* Card Visual Theme Selection */}
            <div className="form-group">
              <label>{isRtl ? 'نمط ومظهر الكارت (Card Theme)' : 'Card Visual Style'}</label>
              <div className="style-picker-grid">
                <div
                  className={`style-option-btn ${formData.bg_style === 'card-white-glass' ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, bg_style: 'card-white-glass' })}
                >
                  <div className="style-sample-bar" style={{ background: 'rgba(255, 255, 255, 0.9)', border: '1px solid #cbd5e1' }}></div>
                  <span className="style-label">{isRtl ? 'زجاجي أبيض (منتج)' : 'White Glass'}</span>
                </div>

                <div
                  className={`style-option-btn ${formData.bg_style === 'card-primary-cta' ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, bg_style: 'card-primary-cta' })}
                >
                  <div className="style-sample-bar" style={{ background: 'linear-gradient(135deg, #0057C2 0%, #003c88 100%)' }}></div>
                  <span className="style-label">{isRtl ? 'أزرق ملكي (عضوية/CTA)' : 'Royal Blue CTA'}</span>
                </div>

                <div
                  className={`style-option-btn ${formData.bg_style === 'card-bank-promo' ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, bg_style: 'card-bank-promo' })}
                >
                  <div className="style-sample-bar" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}></div>
                  <span className="style-label">{isRtl ? 'داكن (عروض البنوك)' : 'Dark Bank Promo'}</span>
                </div>
              </div>
            </div>

            {/* Destination Link Chooser (Category vs Product vs Custom) */}
            <div className="form-group">
              <label>{isRtl ? 'الرابط الموجه إليه عند الضغط (Destination Link)' : 'Target Link'}</label>

              <div className="link-mode-tabs">
                <button
                  type="button"
                  className={`tab-btn ${linkMode === 'category' ? 'active' : ''}`}
                  onClick={() => setLinkMode('category')}
                >
                  {isRtl ? 'ربط بقسم / تصنيف' : 'Category'}
                </button>
                <button
                  type="button"
                  className={`tab-btn ${linkMode === 'product' ? 'active' : ''}`}
                  onClick={() => setLinkMode('product')}
                >
                  {isRtl ? 'ربط بمنتج محدد' : 'Product'}
                </button>
                <button
                  type="button"
                  className={`tab-btn ${linkMode === 'custom' ? 'active' : ''}`}
                  onClick={() => setLinkMode('custom')}
                >
                  {isRtl ? 'رابط مخصص أو صفحة' : 'Custom Page'}
                </button>
              </div>

              {linkMode === 'category' && (
                <div style={{ marginTop: '8px' }}>
                  <CustomSelect
                    value={selectedCategoryId}
                    onChange={(val) => setSelectedCategoryId(val)}
                    options={categorySelectOptions}
                    placeholder={isRtl ? 'اختر القسم...' : 'Select category...'}
                    searchable={true}
                    isRtl={isRtl}
                  />
                </div>
              )}

              {linkMode === 'product' && (
                <div style={{ marginTop: '8px' }}>
                  <CustomSelect
                    value={selectedProductId}
                    onChange={(val) => setSelectedProductId(val)}
                    options={productSelectOptions}
                    placeholder={isRtl ? 'اختر المنتج...' : 'Select product...'}
                    searchable={true}
                    isRtl={isRtl}
                  />
                </div>
              )}

              {linkMode === 'custom' && (
                <input
                  type="text"
                  className="form-input"
                  placeholder="مثال: /deals أو /register أو /track-order"
                  value={formData.target_url}
                  onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                />
              )}
            </div>

            {/* Image Upload / URL */}
            <div className="form-group">
              <label>{isRtl ? 'صورة الكارت (Drag & Drop أو URL)' : 'Card Image'}</label>
              <div className="image-drop-area">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                />
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="preview-image-box" />
                ) : (
                  <div className="drop-label">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <FaFolder style={{ color: 'var(--main-color)' }} />
                      {isRtl ? 'اضغط أو اسحب صورة هنا للمعاينة الفورية' : 'Click or drag image here'}
                    </span>
                  </div>
                )}
              </div>
              <input
                type="text"
                className="form-input"
                style={{ marginTop: '8px' }}
                placeholder={isRtl ? 'أو أدخل رابط الصورة المباشر (URL)' : 'Or paste direct image URL'}
                value={formData.image_url}
                onChange={(e) => {
                  setFormData({ ...formData, image_url: e.target.value });
                  setImagePreview(e.target.value);
                }}
              />
            </div>

            {/* Buttons & Status */}
            <div className="form-row">
              <div className="form-group">
                <label>{isRtl ? 'نص الزر (عربي)' : 'Button Text (Arabic)'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.button_text_ar}
                  onChange={(e) => setFormData({ ...formData, button_text_ar: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>{isRtl ? 'بادج ترويجي (Badge / Tag)' : 'Badge Text'}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="مثال: 10% OFF أو عرض محدود"
                  value={formData.badge_text_ar}
                  onChange={(e) => setFormData({ ...formData, badge_text_ar: e.target.value })}
                />
              </div>
            </div>

            <div className="form-modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button type="submit" className="btn-submit">
                {editingBanner ? (isRtl ? 'حفظ التعديلات' : 'Update Card') : (isRtl ? 'إضافة الكارت' : 'Create Card')}
              </button>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  );
}
