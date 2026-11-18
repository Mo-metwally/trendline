'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  AdminSidebar,
  AdminHeader,
  QuillEditor,
  useToast,
} from '@/src/components/adminComponents';
import {
  FaArrowRight,
  FaArrowLeft,
  FaCheck,
  FaImage,
  FaCloudArrowUp,
  FaTrashCan,
  FaWandMagicSparkles,
  FaPalette,
  FaGem,
  FaEye,
  FaCircleCheck,
  FaGlobe,
  FaLayerGroup,
  FaRotateLeft,
} from 'react-icons/fa6';
import { getApiHost } from '@/src/utils/apiConfig';
import { getServiceCardTheme } from '@/src/utils/serviceTheme';
import '../../add/AddService.scss';

function EditServiceContent() {
  const params = useParams();
  const serviceId = params?.id;

  const router = useRouter();
  const toast = useToast();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lang, setLang] = useState('ar');
  const isRtl = lang === 'ar';

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    slug: '',
    short_desc_ar: '',
    short_desc_en: '',
    details_ar: '',
    details_en: '',
    cover_image: '',
    theme_mode: 'preset',
    preset_style: 'card-primary-cta',
    surface_finish: 'glass',
    solid_color: '#0057C2',
    gradient_color1: '#0057C2',
    gradient_color2: '#002f6c',
    gradient_angle: 135,
    is_active: true,
    sort_order: 0,
  });

  // Fetch Service Details
  useEffect(() => {
    if (!serviceId) return;

    async function loadService() {
      setLoading(true);
      try {
        const apiHost = getApiHost();
        const res = await fetch(`${apiHost}/api/v1/services/${serviceId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const s = json.data;
            setFormData({
              name_ar: s.name_ar || '',
              name_en: s.name_en || '',
              slug: s.slug || '',
              short_desc_ar: s.short_desc_ar || '',
              short_desc_en: s.short_desc_en || '',
              details_ar: s.details_ar || '',
              details_en: s.details_en || '',
              cover_image: s.cover_image || '',
              theme_mode: s.theme_mode || 'preset',
              preset_style: s.preset_style || 'card-primary-cta',
              surface_finish: s.surface_finish || 'glass',
              solid_color: s.solid_color || '#0057C2',
              gradient_color1: s.gradient_color1 || '#0057C2',
              gradient_color2: s.gradient_color2 || '#002f6c',
              gradient_angle: typeof s.gradient_angle === 'number' ? s.gradient_angle : 135,
              is_active: s.is_active !== undefined ? s.is_active : true,
              sort_order: s.sort_order || 0,
            });
          }
        } else {
          toast.error(
            isRtl ? 'تعذر جلب تفاصيل الخدمة' : 'Service not found',
            isRtl ? 'خطأ' : 'Error'
          );
        }
      } catch (err) {
        console.error('Fetch service error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadService();
  }, [serviceId, isRtl, toast]);

  // Step 1 Validation & Next
  const handleStep1Next = () => {
    if (!formData.name_ar.trim()) {
      toast.error(
        isRtl ? 'اسم الخدمة بالعربية مطلوب للمتابعة' : 'Arabic service name is required',
        isRtl ? 'حقل مطلوب' : 'Required Field'
      );
      return;
    }
    setCurrentStep(2);
  };

  // Step 2 Validation & Next
  const handleStep2Next = () => {
    if (!formData.name_en.trim()) {
      toast.error(
        isRtl ? 'اسم الخدمة بالإنجليزية مطلوب للمتابعة' : 'English service name is required',
        isRtl ? 'حقل مطلوب' : 'Required Field'
      );
      return;
    }
    setCurrentStep(3);
  };

  // Cover Image Upload Handler
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(
        isRtl ? 'الملف المختار يجب أن يكون صورة' : 'Selected file must be an image',
        isRtl ? 'صيغة غير مدعومة' : 'Invalid format'
      );
      return;
    }

    setUploadingCover(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      if (!res.ok) throw new Error('Failed to upload image');

      const data = await res.json();
      const uploadedUrl = data.url || data.filePath || '';

      if (uploadedUrl) {
        setFormData((prev) => ({ ...prev, cover_image: uploadedUrl }));
        toast.success(
          isRtl ? 'تم رفع صورة غلاف الخدمة بنجاح' : 'Cover image uploaded successfully',
          isRtl ? 'تم الرفع' : 'Success'
        );
      }
    } catch (err) {
      console.error('Image upload error:', err);
      toast.error(
        isRtl ? 'حدث خطأ أثناء رفع الصورة' : 'Error uploading image',
        isRtl ? 'فشل الرفع' : 'Upload Failed'
      );
    } finally {
      setUploadingCover(false);
    }
  };

  // Final Submit Update
  const handleUpdateService = async () => {
    if (!formData.name_ar.trim() || !formData.name_en.trim()) {
      toast.error(
        isRtl ? 'يرجى التأكد من ملء اسم الخدمة بالعربية والإنجليزية' : 'Please check service names',
        isRtl ? 'بيانات ناقصة' : 'Incomplete Data'
      );
      return;
    }

    setSaving(true);
    try {
      const apiHost = getApiHost();
      const res = await fetch(`${apiHost}/api/v1/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        toast.success(
          isRtl ? 'تم تحديث بيانات الخدمة وتصميم الكارت بنجاح' : 'Service updated successfully',
          isRtl ? 'تم التحديث' : 'Success'
        );
        router.push('/admin/services');
      } else {
        toast.error(
          json.message || (isRtl ? 'حدث خطأ أثناء تحديث الخدمة' : 'Error updating service'),
          isRtl ? 'فشل التحديث' : 'Failed'
        );
      }
    } catch (err) {
      console.error('Update service error:', err);
      toast.error(
        isRtl ? 'تعذر الاتصال بالخادم لتحديث الخدمة' : 'Server connection failed',
        isRtl ? 'خطأ في الخادم' : 'Server Error'
      );
    } finally {
      setSaving(false);
    }
  };

  const getCardStyle = () => {
    return getServiceCardTheme(formData).style;
  };

  if (loading) {
    return (
      <div className={`admin-page-container ${isRtl ? 'dir-rtl' : 'dir-ltr'}`}>
        <AdminSidebar
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          lang={lang}
        />
        <div className={`admin-main-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <div style={{ padding: '60px', textAlign: 'center', fontWeight: 800, color: '#1d4ed8' }}>
            جاري تحميل بيانات الخدمة...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`admin-page-container ${isRtl ? 'dir-rtl' : 'dir-ltr'}`}>
      <AdminSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        lang={lang}
      />

      <div className={`admin-main-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <AdminHeader
          lang={lang}
          onToggleLanguage={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          isSidebarCollapsed={sidebarCollapsed}
          title={isRtl ? 'تعديل الخدمة وتصميم الكارت' : 'Edit Service & Theme Studio'}
        />

        <main className="add-service-content-flow">
          {/* Top Breadcrumb */}
          <div className="add-service-page-header">
            <div className="header-breadcrumbs">
              <Link href="/admin">{isRtl ? 'لوحة التحكم' : 'Dashboard'}</Link>
              <span className="crumb-sep">/</span>
              <Link href="/admin/services">{isRtl ? 'الخدمات' : 'Services'}</Link>
              <span className="crumb-sep">/</span>
              <span className="crumb-current">{isRtl ? 'تعديل الخدمة' : 'Edit Service'}</span>
            </div>

            <div className="header-action-row">
              <h1 className="page-heading-title">
                {isRtl ? `تعديل خدمة: ${formData.name_ar}` : `Edit: ${formData.name_en || 'Service'}`}
              </h1>
              <Link href="/admin/services" className="back-to-list-btn">
                {isRtl ? <FaArrowRight /> : <FaArrowLeft />}
                <span>{isRtl ? 'العودة لقائمة الخدمات' : 'Back to Services'}</span>
              </Link>
            </div>
          </div>

          {/* Wizard Stepper */}
          <div className="service-wizard-stepper">
            <button
              type="button"
              className={`wizard-step-node ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}
              onClick={() => setCurrentStep(1)}
            >
              <div className="step-circle">{currentStep > 1 ? <FaCheck /> : '1'}</div>
              <div className="step-label-group">
                <span className="step-label-title">{isRtl ? 'البيانات بالعربية' : 'Arabic Info'}</span>
                <span className="step-label-sub">{isRtl ? 'الاسم، الوصف المختصر، والتفاصيل' : 'Name, Desc & Scope'}</span>
              </div>
            </button>

            <div className={`stepper-line ${currentStep > 1 ? 'filled' : ''}`} />

            <button
              type="button"
              className={`wizard-step-node ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}
              onClick={() => {
                if (formData.name_ar.trim()) setCurrentStep(2);
              }}
            >
              <div className="step-circle">{currentStep > 2 ? <FaCheck /> : '2'}</div>
              <div className="step-label-group">
                <span className="step-label-title">{isRtl ? 'البيانات بالإنجليزية' : 'English Info'}</span>
                <span className="step-label-sub">{isRtl ? 'الاسم، الرابط، والتفاصيل' : 'Name, Slug & Scope'}</span>
              </div>
            </button>

            <div className={`stepper-line ${currentStep > 2 ? 'filled' : ''}`} />

            <button
              type="button"
              className={`wizard-step-node ${currentStep === 3 ? 'active' : ''}`}
              onClick={() => {
                if (formData.name_ar.trim() && formData.name_en.trim()) setCurrentStep(3);
              }}
            >
              <div className="step-circle">3</div>
              <div className="step-label-group">
                <span className="step-label-title">{isRtl ? 'استوديو التصميم والغلاف' : 'Cover & Card Studio'}</span>
                <span className="step-label-sub">{isRtl ? 'الألوان، التدرج، وتأثير السطح' : 'Theme, Colors & Gloss'}</span>
              </div>
            </button>
          </div>

          {/* STEP 1: ARABIC DATA */}
          {currentStep === 1 && (
            <div className="wizard-step-panel step-1-panel">
              <div className="panel-card-box">
                <div className="panel-card-header">
                  <div className="icon-badge ar-badge">
                    <FaLayerGroup />
                  </div>
                  <div>
                    <h3>{isRtl ? 'المرحلة الأولى: بيانات الخدمة باللغة العربية' : 'Step 1: Arabic Service Details'}</h3>
                    <p>{isRtl ? 'أدخل اسم الخدمة بالعربية والوصف والتفاصيل الكاملة' : 'Enter Arabic service name, short description, and full scope'}</p>
                  </div>
                </div>

                <div className="panel-card-body">
                  <div className="form-field-group">
                    <label className="field-label">
                      <span>{isRtl ? 'اسم الخدمة بالعربية' : 'Arabic Service Name'}</span>
                      <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      dir="rtl"
                      className="form-input-control"
                      value={formData.name_ar}
                      onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-field-group">
                    <label className="field-label">
                      <span>{isRtl ? 'وصف الخدمة المختصر بالعربية' : 'Arabic Short Description'}</span>
                    </label>
                    <textarea
                      dir="rtl"
                      rows={3}
                      className="form-textarea-control"
                      value={formData.short_desc_ar}
                      onChange={(e) => setFormData({ ...formData, short_desc_ar: e.target.value })}
                    />
                  </div>

                  <div className="form-field-group">
                    <div className="quill-header-row">
                      <label className="field-label">
                        <span>{isRtl ? 'تفاصيل الخدمة الكاملة بالعربية (React Quill)' : 'Detailed Service Description'}</span>
                      </label>
                      <span className="quill-tag">React Quill JS (RTL)</span>
                    </div>
                    <QuillEditor
                      value={formData.details_ar}
                      onChange={(html) => setFormData((prev) => ({ ...prev, details_ar: html }))}
                      dir="rtl"
                      minHeight="220px"
                    />
                  </div>
                </div>

                <div className="panel-card-footer">
                  <Link href="/admin/services" className="btn-secondary-cancel">
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </Link>
                  <button
                    type="button"
                    className="btn-primary-next"
                    onClick={handleStep1Next}
                  >
                    <span>{isRtl ? 'التالي: البيانات بالإنجليزية' : 'Next: English Data'}</span>
                    {isRtl ? <FaArrowLeft /> : <FaArrowRight />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ENGLISH DATA */}
          {currentStep === 2 && (
            <div className="wizard-step-panel step-2-panel">
              <div className="panel-card-box">
                <div className="panel-card-header">
                  <div className="icon-badge en-badge">
                    <FaGlobe />
                  </div>
                  <div>
                    <h3>{isRtl ? 'المرحلة الثانية: بيانات الخدمة باللغة الإنجليزية' : 'Step 2: English Service Details'}</h3>
                    <p>{isRtl ? 'أدخل اسم الخدمة بالإنجليزية والرابط الدائم والوصف والتفاصيل' : 'Enter English service name, slug, and scope'}</p>
                  </div>
                </div>

                <div className="panel-card-body">
                  <div className="form-field-group">
                    <label className="field-label">
                      <span>{isRtl ? 'اسم الخدمة بالإنجليزية' : 'English Service Name'}</span>
                      <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      className="form-input-control"
                      value={formData.name_en}
                      onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-field-group">
                    <label className="field-label">
                      <span>{isRtl ? 'الرابط الدائم (Slug)' : 'URL Slug'}</span>
                    </label>
                    <div className="slug-input-wrapper">
                      <span className="slug-prefix">/services/</span>
                      <input
                        type="text"
                        dir="ltr"
                        className="slug-control"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-field-group">
                    <label className="field-label">
                      <span>{isRtl ? 'وصف الخدمة المختصر بالإنجليزية' : 'English Short Description'}</span>
                    </label>
                    <textarea
                      dir="ltr"
                      rows={3}
                      className="form-textarea-control"
                      value={formData.short_desc_en}
                      onChange={(e) => setFormData({ ...formData, short_desc_en: e.target.value })}
                    />
                  </div>

                  <div className="form-field-group">
                    <div className="quill-header-row">
                      <label className="field-label">
                        <span>{isRtl ? 'تفاصيل الخدمة بالإنجليزية (React Quill)' : 'Detailed English Description'}</span>
                      </label>
                      <span className="quill-tag">React Quill JS (LTR)</span>
                    </div>
                    <QuillEditor
                      value={formData.details_en}
                      onChange={(html) => setFormData((prev) => ({ ...prev, details_en: html }))}
                      dir="ltr"
                      minHeight="220px"
                    />
                  </div>
                </div>

                <div className="panel-card-footer">
                  <button
                    type="button"
                    className="btn-secondary-prev"
                    onClick={() => setCurrentStep(1)}
                  >
                    {isRtl ? <FaArrowRight /> : <FaArrowLeft />}
                    <span>{isRtl ? 'السابق: البيانات بالعربية' : 'Previous: Arabic Data'}</span>
                  </button>
                  <button
                    type="button"
                    className="btn-primary-next"
                    onClick={handleStep2Next}
                  >
                    <span>{isRtl ? 'التالي: الغلاف وتصميم الكارت' : 'Next: Cover & Studio'}</span>
                    {isRtl ? <FaArrowLeft /> : <FaArrowRight />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: COVER & THEME STUDIO */}
          {currentStep === 3 && (
            <div className="wizard-step-panel step-3-panel">
              <div className="studio-dual-layout">
                {/* Controls Column */}
                <div className="studio-controls-col">
                  {/* 1. Cover Image Section */}
                  <div className="panel-card-box mb-4">
                    <div className="panel-card-header">
                      <div className="icon-badge cover-badge">
                        <FaImage />
                      </div>
                      <div>
                        <h3>{isRtl ? 'صورة غلاف الخدمة (Cover Image)' : 'Service Cover Image'}</h3>
                        <p>{isRtl ? 'اختر صورة رئيسية توضيحية للخدمة تظهر في رأس البطاقة' : 'Set high resolution cover image'}</p>
                      </div>
                    </div>

                    <div className="panel-card-body">
                      {formData.cover_image ? (
                        <div className="cover-preview-wrapper">
                          <img
                            src={formData.cover_image}
                            alt="Cover Preview"
                            className="cover-img-preview"
                          />
                          <div className="cover-actions-overlay">
                            <label className="change-cover-btn">
                              <FaCloudArrowUp />
                              <span>{isRtl ? 'تغيير الصورة' : 'Change Image'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleCoverUpload}
                                style={{ display: 'none' }}
                              />
                            </label>
                            <button
                              type="button"
                              className="remove-cover-btn"
                              onClick={() => setFormData({ ...formData, cover_image: '' })}
                            >
                              <FaTrashCan />
                              <span>{isRtl ? 'حذف' : 'Remove'}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className={`cover-dropzone-box ${uploadingCover ? 'uploading' : ''}`}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverUpload}
                            style={{ display: 'none' }}
                          />
                          <div className="dropzone-inner">
                            <div className="dropzone-icon">
                              <FaCloudArrowUp />
                            </div>
                            <span className="dropzone-text">
                              {uploadingCover
                                ? (isRtl ? 'جاري رفع صورة الغلاف...' : 'Uploading...')
                                : (isRtl ? 'اضغط هنا لرفع صورة الغلاف، أو اسحب الصورة وأفلتها' : 'Click or drop cover image here')}
                            </span>
                            <span className="dropzone-sub">
                              PNG, JPG, WebP {isRtl ? 'بحد أقصى 5 ميجابايت' : 'up to 5MB'}
                            </span>
                          </div>
                        </label>
                      )}

                      <div className="cover-direct-url">
                        <span className="url-label">{isRtl ? 'أو أدخل رابط الصورة مباشرة:' : 'Or enter direct URL:'}</span>
                        <input
                          type="text"
                          className="form-input-control"
                          placeholder="https://.../service-cover.webp"
                          value={formData.cover_image}
                          onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Theme & Card Studio */}
                  <div className="panel-card-box studio-theme-card mb-4">
                    <div className="panel-card-header">
                      <div className="icon-badge studio-badge">
                        <FaPalette />
                      </div>
                      <div>
                        <h3>{isRtl ? 'استوديو الألوان والتصميم (Theme & Card Studio)' : 'Theme & Card Studio'}</h3>
                        <p>{isRtl ? 'خصص نمط ولون ولمعان بطاقة الخدمة لتظهر بأعلى جودة بصرية' : 'Customize card colors, gradients, and surface finish'}</p>
                      </div>
                    </div>

                    <div className="panel-card-body">
                      {/* Theme Mode Pills */}
                      <div className="theme-mode-pills">
                        <button
                          type="button"
                          className={`theme-pill ${formData.theme_mode === 'preset' ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, theme_mode: 'preset' })}
                        >
                          <FaWandMagicSparkles />
                          <span>{isRtl ? 'قوالب جاهزة' : 'Store Presets'}</span>
                        </button>
                        <button
                          type="button"
                          className={`theme-pill ${formData.theme_mode === 'solid' ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, theme_mode: 'solid' })}
                        >
                          <FaPalette />
                          <span>{isRtl ? 'لون مصمت' : 'Solid Color'}</span>
                        </button>
                        <button
                          type="button"
                          className={`theme-pill ${formData.theme_mode === 'gradient' ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, theme_mode: 'gradient' })}
                        >
                          <FaGem />
                          <span>{isRtl ? 'تدرج لوني' : 'Gradient'}</span>
                        </button>
                      </div>

                      {/* Presets Grid */}
                      {formData.theme_mode === 'preset' && (
                        <div className="presets-select-grid">
                          <div
                            className={`preset-card-item ${formData.preset_style === 'card-white-glass' ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, preset_style: 'card-white-glass' })}
                          >
                            <div className="preset-swatch-box swatch-white-glass" />
                            <span className="preset-name">{isRtl ? 'أبيض زجاجي ناصع' : 'White Glass'}</span>
                          </div>
                          <div
                            className={`preset-card-item ${formData.preset_style === 'card-primary-cta' ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, preset_style: 'card-primary-cta' })}
                          >
                            <div className="preset-swatch-box swatch-royal-blue" />
                            <span className="preset-name">{isRtl ? 'أزرق ترندلاين الملكي' : 'Royal Blue'}</span>
                          </div>
                          <div
                            className={`preset-card-item ${formData.preset_style === 'card-bank-promo' ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, preset_style: 'card-bank-promo' })}
                          >
                            <div className="preset-swatch-box swatch-dark-bank" />
                            <span className="preset-name">{isRtl ? 'كحلي داكن بنكي' : 'Bank Dark'}</span>
                          </div>
                          <div
                            className={`preset-card-item ${formData.preset_style === 'card-cyber-purple' ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, preset_style: 'card-cyber-purple' })}
                          >
                            <div className="preset-swatch-box swatch-cyber-purple" />
                            <span className="preset-name">{isRtl ? 'بنفسجي تقني سايبر' : 'Cyber Purple'}</span>
                          </div>
                          <div
                            className={`preset-card-item ${formData.preset_style === 'card-neon-emerald' ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, preset_style: 'card-neon-emerald' })}
                          >
                            <div className="preset-swatch-box swatch-neon-emerald" />
                            <span className="preset-name">{isRtl ? 'أخضر زمردي نيون' : 'Neon Emerald'}</span>
                          </div>
                          <div
                            className={`preset-card-item ${formData.preset_style === 'card-sunset-coral' ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, preset_style: 'card-sunset-coral' })}
                          >
                            <div className="preset-swatch-box swatch-sunset-coral" />
                            <span className="preset-name">{isRtl ? 'برتقالي صن سيت' : 'Sunset Coral'}</span>
                          </div>
                        </div>
                      )}

                      {/* Solid Color */}
                      {formData.theme_mode === 'solid' && (
                        <div className="color-picker-dual-row">
                          <div className="color-input-tile">
                            <label>{isRtl ? 'لون البطاقة الأساسي:' : 'Background Color:'}</label>
                            <div className="color-picker-input-group">
                              <input
                                type="color"
                                className="color-wheel-circle"
                                value={formData.solid_color}
                                onChange={(e) => setFormData({ ...formData, solid_color: e.target.value })}
                              />
                              <input
                                type="text"
                                value={formData.solid_color}
                                onChange={(e) => setFormData({ ...formData, solid_color: e.target.value })}
                                className="color-hex-text"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Gradient */}
                      {formData.theme_mode === 'gradient' && (
                        <div className="gradient-pickers-row">
                          <div className="color-input-tile">
                            <label>{isRtl ? 'اللون الأول (البداية):' : 'Color 1 (Start):'}</label>
                            <div className="color-picker-input-group">
                              <input
                                type="color"
                                className="color-wheel-circle"
                                value={formData.gradient_color1}
                                onChange={(e) => setFormData({ ...formData, gradient_color1: e.target.value })}
                              />
                              <input
                                type="text"
                                value={formData.gradient_color1}
                                onChange={(e) => setFormData({ ...formData, gradient_color1: e.target.value })}
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
                                value={formData.gradient_color2}
                                onChange={(e) => setFormData({ ...formData, gradient_color2: e.target.value })}
                              />
                              <input
                                type="text"
                                value={formData.gradient_color2}
                                onChange={(e) => setFormData({ ...formData, gradient_color2: e.target.value })}
                                className="color-hex-text"
                              />
                            </div>
                          </div>

                          <div className="angle-input-tile" style={{ gridColumn: 'span 2' }}>
                            <div className="angle-label-row">
                              <label>{isRtl ? 'زاوية التدرج (Gradient Angle):' : 'Gradient Angle:'}</label>
                              <span className="angle-badge">{formData.gradient_angle}°</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="360"
                              step="5"
                              value={formData.gradient_angle}
                              onChange={(e) => setFormData({ ...formData, gradient_angle: Number(e.target.value) })}
                              className="angle-range-control"
                            />
                          </div>
                        </div>
                      )}

                      {/* Surface Finish */}
                      <div className="finish-texture-section">
                        <div className="section-sub-label">
                          <FaGem />
                          <span>{isRtl ? 'تأثير السطح واللمعان (Surface Finish):' : 'Surface Finish:'}</span>
                        </div>
                        <div className="finish-chips-group">
                          <button
                            type="button"
                            className={`finish-chip-btn ${formData.surface_finish === 'glass' ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, surface_finish: 'glass' })}
                          >
                            <div className="finish-icon-preview finish-preview-glass" />
                            <div className="finish-info">
                              <span className="finish-title">{isRtl ? 'زجاجي شفاف' : 'Glassmorphism'}</span>
                              <span className="finish-desc">{isRtl ? 'تأثير بلور عصري' : 'Modern blur effect'}</span>
                            </div>
                          </button>

                          <button
                            type="button"
                            className={`finish-chip-btn ${formData.surface_finish === 'glossy' ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, surface_finish: 'glossy' })}
                          >
                            <div className="finish-icon-preview finish-preview-glossy" />
                            <div className="finish-info">
                              <span className="finish-title">{isRtl ? 'لامع جلو' : 'Glossy Glow'}</span>
                              <span className="finish-desc">{isRtl ? 'انعكاس ضوئي بارز' : 'Vivid reflection'}</span>
                            </div>
                          </button>

                          <button
                            type="button"
                            className={`finish-chip-btn ${formData.surface_finish === 'matt' ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, surface_finish: 'matt' })}
                          >
                            <div className="finish-icon-preview finish-preview-matt" />
                            <div className="finish-info">
                              <span className="finish-title">{isRtl ? 'مطفي ناعم' : 'Smooth Matt'}</span>
                              <span className="finish-desc">{isRtl ? 'بدون انعكاس' : 'Non-reflective'}</span>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Active toggle */}
                      <div className="extra-options-row">
                        <label className="toggle-checkbox-label">
                          <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                          />
                          <span className="checkbox-custom" />
                          <span className="toggle-text">{isRtl ? 'تفعيل الخدمة وإظهارها في المتجر' : 'Active and visible in store'}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Live Interactive Card Preview */}
                <div className="studio-preview-col">
                  <div className="preview-sticky-box">
                    <div className="preview-header-bar">
                      <FaEye />
                      <span>{isRtl ? 'معاينة حية لبطاقة الخدمة' : 'Live Card Preview'}</span>
                    </div>

                    <div className="preview-stage-viewport">
                      <div
                        className={`service-live-preview-card finish-${formData.surface_finish}`}
                        style={getCardStyle()}
                      >
                        {formData.surface_finish === 'glossy' && <div className="specular-glare" />}

                        <div className="preview-card-media">
                          {formData.cover_image ? (
                            <img src={formData.cover_image} alt="Service Cover" />
                          ) : (
                            <div className="media-placeholder">
                              <FaImage size={32} />
                              <span>{isRtl ? 'صورة الغلاف' : 'Cover Image'}</span>
                            </div>
                          )}
                          <span className="service-live-pill">
                            <FaCircleCheck />
                            <span>{formData.is_active ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'معطل' : 'Draft')}</span>
                          </span>
                        </div>

                        <div className="preview-card-body">
                          <h4 className="preview-card-title">
                            {formData.name_ar || (isRtl ? 'اسم الخدمة' : 'Service Title')}
                          </h4>
                          {formData.name_en && (
                            <span className="preview-card-subtitle">{formData.name_en}</span>
                          )}
                          {formData.short_desc_ar && (
                            <p className="preview-card-desc">{formData.short_desc_ar}</p>
                          )}
                          <div className="preview-card-cta">
                            <span className="cta-link">
                              <span>{isRtl ? 'طلب واستشارة' : 'Inquire Now'}</span>
                              {isRtl ? <FaArrowLeft size={10} /> : <FaArrowRight size={10} />}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 Footer Navigation */}
              <div className="panel-card-footer mt-4">
                <button
                  type="button"
                  className="btn-secondary-prev"
                  onClick={() => setCurrentStep(2)}
                >
                  {isRtl ? <FaArrowRight /> : <FaArrowLeft />}
                  <span>{isRtl ? 'السابق: البيانات بالإنجليزية' : 'Previous: English Data'}</span>
                </button>
                <button
                  type="button"
                  className="btn-primary-publish"
                  onClick={handleUpdateService}
                  disabled={saving}
                >
                  {saving ? (
                    <span>{isRtl ? 'جاري تحديث الخدمة...' : 'Saving...'}</span>
                  ) : (
                    <>
                      <FaCheck />
                      <span>{isRtl ? 'تحديث وحفظ التعديلات' : 'Update & Save Changes'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function EditServicePage() {
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
            fontSize: '15px',
            fontWeight: 800,
            color: '#1d4ed8',
          }}
        >
          جاري تحميل استوديو تعديل الخدمة...
        </div>
      }
    >
      <EditServiceContent />
    </Suspense>
  );
}
