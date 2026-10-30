'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getApiHost } from '@/src/utils/apiConfig';
import {
  AdminSidebar,
  AdminHeader,
  AdminStatsCard,
  AdminModal,
  useToast,
} from '@/src/components/adminComponents';
import {
  FaTicket,
  FaPlus,
  FaMagnifyingGlass,
  FaTag,
  FaClock,
  FaCheck,
  FaPenToSquare,
  FaTrashCan,
  FaCopy,
  FaPercent,
  FaMoneyBillWave,
  FaWandMagicSparkles,
  FaUser,
  FaPhone,
  FaReceipt,
  FaCalendarCheck,
  FaUsers,
  FaRepeat,
  FaCircleInfo,
  FaLocationDot,
  FaEye,
  FaBolt,
  FaBan,
  FaFilter,
  FaArrowUpRightFromSquare,
} from 'react-icons/fa6';
import './Coupons.scss';

const ORDER_STATUS_META = {
  new: { label: 'طلب جديد', color: '#2563eb', bg: '#eff6ff' },
  confirmed: { label: 'تم التأكيد', color: '#0284c7', bg: '#e0f2fe' },
  processing: { label: 'قيد التجهيز', color: '#7c3aed', bg: '#f3e8ff' },
  shipped: { label: 'تم الشحن', color: '#d97706', bg: '#fef3c7' },
  delivered: { label: 'تم التسليم', color: '#059669', bg: '#ecfdf5' },
  cancelled: { label: 'ملغي', color: '#dc2626', bg: '#fef2f2' },
  delivery_failed: { label: 'فشل التسليم', color: '#dc2626', bg: '#fef2f2' },
  returned_to_warehouse: { label: 'مرتجع للمخزن', color: '#64748b', bg: '#f1f5f9' },
  return_requested: { label: 'طلب استرجاع', color: '#ea580c', bg: '#ffedd5' },
  refunded: { label: 'تم الاسترداد', color: '#475569', bg: '#f1f5f9' },
};

const PAYMENT_METHOD_LABELS = {
  cod: 'الدفع عند الاستلام (COD)',
  credit_card: 'بطاقة بنكية',
  bank_installment: 'تقسيط بنكي',
  instapay: 'إنستا باي (InstaPay)',
  wallet: 'محفظة إلكترونية',
};

function generateClientRandomCode(len = 7) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = 'TRD';
  for (let i = 0; i < Math.max(3, len - 3); i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

export default function AdminCouponsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const toast = useToast();

  const [mounted, setMounted] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lang, setLang] = useState('ar');
  const isRtl = lang === 'ar';

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters & View Mode
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'used' | 'inactive'
  const [activeViewTab, setActiveViewTab] = useState('coupons'); // 'coupons' | 'redemptions_log'

  // Create / Edit Coupon Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [codeMode, setCodeMode] = useState('manual'); // 'manual' | 'auto'

  // Usage Details Modal State
  const [selectedCouponForOrders, setSelectedCouponForOrders] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name_ar: '',
    code: '',
    discount_type: 'percentage', // 'percentage' | 'fixed_amount'
    discount_value: '',
    expires_at: '',
    usage_limit: '',
    per_user_limit: '1',
    min_order_value: '0',
    max_discount: '',
    first_order_only: false,
    is_active: true,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Ensure valid JWT token for Admin API mutations
  const ensureAuthToken = async () => {
    if (typeof window === 'undefined') return '';
    let token =
      localStorage.getItem('trendline_admin_token') ||
      localStorage.getItem('admin_token') ||
      '';
    if (token) return token;

    if (session?.accessToken) {
      localStorage.setItem('trendline_admin_token', session.accessToken);
      return session.accessToken;
    }

    try {
      const res = await fetch('/api/auth/token');
      if (res.ok) {
        const data = await res.json();
        if (data?.token) {
          localStorage.setItem('trendline_admin_token', data.token);
          return data.token;
        }
      }
    } catch (e) {
      // ignore
    }

    try {
      const res = await fetch('/api/auth/session');
      const sData = await res.json();
      if (sData?.accessToken) {
        localStorage.setItem('trendline_admin_token', sData.accessToken);
        return sData.accessToken;
      }
    } catch (e) {
      // ignore
    }

    return '';
  };

  useEffect(() => {
    if (status === 'loading') return;
    const savedUser =
      typeof window !== 'undefined'
        ? localStorage.getItem('trendline_admin_user') || localStorage.getItem('admin_user')
        : null;
    if (session?.user) {
      setAdminUser(session.user);
    } else if (savedUser) {
      try {
        setAdminUser(JSON.parse(savedUser));
      } catch (e) {
        // ignore
      }
    }
  }, [session, status]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const apiHost = getApiHost();
      const token = await ensureAuthToken();
      const res = await fetch(`${apiHost}/api/v1/cms/coupons`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      });
      const json = await res.json();
      if (json?.success && Array.isArray(json.data)) {
        setCoupons(json.data);
        if (selectedCouponForOrders) {
          const updatedSelected = json.data.find((c) => String(c.id) === String(selectedCouponForOrders.id));
          if (updatedSelected) setSelectedCouponForOrders(updatedSelected);
        }
      }
    } catch (err) {
      toast.error('تعذر تحميل بيانات الكوبونات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // KPI Statistics
  const stats = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter((c) => c.computed_status === 'active').length;
    const totalUsages = coupons.reduce((acc, c) => acc + Number(c.actual_used_count || 0), 0);
    const totalDiscountSaved = coupons.reduce(
      (acc, c) => acc + Number(c.total_discount_granted || 0),
      0
    );
    return { total, active, totalUsages, totalDiscountSaved };
  }, [coupons]);

  // Flatten all coupon redemptions across all orders for the Global Redemptions Log tab
  const allRedemptions = useMemo(() => {
    const rows = [];
    coupons.forEach((coupon) => {
      if (Array.isArray(coupon.usages)) {
        coupon.usages.forEach((u) => {
          rows.push({
            ...u,
            coupon_id: coupon.id,
            coupon_code: coupon.code,
            coupon_name: coupon.name_ar || coupon.description_ar || coupon.code,
            coupon_discount_type: coupon.discount_type,
            coupon_discount_value: coupon.discount_value,
            coupon_per_user_limit: coupon.per_user_limit,
          });
        });
      }
    });
    rows.sort((a, b) => new Date(b.used_at || 0).getTime() - new Date(a.used_at || 0).getTime());
    return rows;
  }, [coupons]);

  // Filtered Coupons
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const matchCode = c.code?.toLowerCase().includes(q);
        const matchName = (c.name_ar || c.description_ar || '')?.toLowerCase().includes(q);
        const matchCustomer = c.usages?.some(
          (u) =>
            u.customer_name?.toLowerCase().includes(q) ||
            u.customer_phone?.toLowerCase().includes(q) ||
            u.order_number?.toLowerCase().includes(q)
        );
        if (!matchCode && !matchName && !matchCustomer) return false;
      }

      if (statusFilter === 'active') return c.computed_status === 'active';
      if (statusFilter === 'used') return Number(c.actual_used_count || 0) > 0;
      if (statusFilter === 'inactive') return c.computed_status !== 'active';
      return true;
    });
  }, [coupons, searchQuery, statusFilter]);

  // Filtered Redemptions Log
  const filteredRedemptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allRedemptions;
    return allRedemptions.filter(
      (r) =>
        r.coupon_code?.toLowerCase().includes(q) ||
        r.coupon_name?.toLowerCase().includes(q) ||
        r.customer_name?.toLowerCase().includes(q) ||
        r.customer_phone?.toLowerCase().includes(q) ||
        r.order_number?.toLowerCase().includes(q) ||
        r.governorate?.toLowerCase().includes(q)
    );
  }, [allRedemptions, searchQuery]);

  // Format date helper
  const formatDateTime = (dStr, includeTime = true) => {
    if (!dStr) return '—';
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
      });
    } catch (e) {
      return '—';
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setCodeMode('manual');
    setFormData({
      name_ar: '',
      code: '',
      discount_type: 'percentage',
      discount_value: '15',
      expires_at: '',
      usage_limit: '100',
      per_user_limit: '1',
      min_order_value: '0',
      max_discount: '',
      first_order_only: false,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (coupon) => {
    setEditingCoupon(coupon);
    setCodeMode('manual');

    let formattedDate = '';
    if (coupon.expires_at) {
      const d = new Date(coupon.expires_at);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toISOString().split('T')[0];
      }
    }

    setFormData({
      name_ar: coupon.name_ar || coupon.description_ar || '',
      code: coupon.code || '',
      discount_type: coupon.discount_type || 'percentage',
      discount_value: String(coupon.discount_value || ''),
      expires_at: formattedDate,
      usage_limit:
        coupon.usage_limit !== null && coupon.usage_limit !== undefined
          ? String(coupon.usage_limit)
          : '',
      per_user_limit:
        coupon.per_user_limit !== null && coupon.per_user_limit !== undefined
          ? String(coupon.per_user_limit)
          : '',
      min_order_value:
        coupon.min_order_value !== null && coupon.min_order_value !== undefined
          ? String(coupon.min_order_value)
          : '0',
      max_discount:
        coupon.max_discount !== null && coupon.max_discount !== undefined
          ? String(coupon.max_discount)
          : '',
      first_order_only: Boolean(coupon.first_order_only),
      is_active: Boolean(coupon.is_active),
    });
    setIsModalOpen(true);
  };

  // Quick Date Helper for Expires At
  const setQuickExpiryDays = (days) => {
    if (!days) {
      setFormData((prev) => ({ ...prev, expires_at: '' }));
      return;
    }
    const target = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    setFormData((prev) => ({
      ...prev,
      expires_at: target.toISOString().split('T')[0],
    }));
  };

  // Auto-generate code handler
  const handleGenerateCode = () => {
    const newCode = generateClientRandomCode(8);
    setCodeMode('auto');
    setFormData((prev) => ({ ...prev, code: newCode }));
  };

  // Validate Code (min 3 alphanumeric characters)
  const sanitizedCode = useMemo(() => {
    return String(formData.code || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
  }, [formData.code]);

  const isCodeValid = sanitizedCode.length >= 3;

  // Save Coupon (Create or Update)
  const handleSaveCoupon = async (e) => {
    e.preventDefault();

    if (!formData.name_ar.trim()) {
      toast.error('يرجى إدخال اسم الكوبون (إجباري)');
      return;
    }

    if (!isCodeValid && codeMode !== 'auto') {
      toast.error('كود الكوبون يجب أن يتكون من 3 أحرف إنجليزية وأرقام على الأقل');
      return;
    }

    const numVal = Number(formData.discount_value);
    if (isNaN(numVal) || numVal <= 0) {
      toast.error('يرجى إدخال قيمة خصم صحيحة أكبر من صفر');
      return;
    }

    if (formData.discount_type === 'percentage' && numVal > 100) {
      toast.error('نسبة الخصم لا يمكن أن تتجاوز 100%');
      return;
    }

    setSaving(true);
    try {
      const apiHost = getApiHost();
      const token = await ensureAuthToken();
      const isEdit = Boolean(editingCoupon?.id);
      const url = isEdit
        ? `${apiHost}/api/v1/cms/coupons/${encodeURIComponent(editingCoupon.id)}`
        : `${apiHost}/api/v1/cms/coupons`;

      const payload = {
        name_ar: formData.name_ar.trim(),
        description_ar: formData.name_ar.trim(),
        code: sanitizedCode || generateClientRandomCode(8),
        auto_generate: codeMode === 'auto' && !sanitizedCode,
        discount_type: formData.discount_type,
        discount_value: numVal,
        expires_at: formData.expires_at ? formData.expires_at : null,
        usage_limit:
          formData.usage_limit && Number(formData.usage_limit) > 0
            ? Number(formData.usage_limit)
            : null,
        per_user_limit:
          formData.per_user_limit && Number(formData.per_user_limit) > 0
            ? Number(formData.per_user_limit)
            : null,
        min_order_value:
          formData.min_order_value && Number(formData.min_order_value) >= 0
            ? Number(formData.min_order_value)
            : 0,
        max_discount:
          formData.discount_type === 'percentage' &&
          formData.max_discount &&
          Number(formData.max_discount) > 0
            ? Number(formData.max_discount)
            : null,
        first_order_only: Boolean(formData.first_order_only),
        is_active: Boolean(formData.is_active),
      };

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.message || 'حدث خطأ أثناء حفظ الكوبون');
      } else {
        toast.success(
          isEdit ? 'تم تحديث بيانات الكوبون بنجاح' : 'تم إنشاء الكوبون الجديد بنجاح'
        );
        setIsModalOpen(false);
        fetchCoupons();
      }
    } catch (err) {
      toast.error('تعذر الاتصال بالخادم لحفظ الكوبون');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Active Status
  const handleToggleStatus = async (coupon) => {
    try {
      const apiHost = getApiHost();
      const token = await ensureAuthToken();
      const res = await fetch(
        `${apiHost}/api/v1/cms/coupons/${encodeURIComponent(coupon.id)}/toggle`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ is_active: !coupon.is_active }),
        }
      );
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(
          !coupon.is_active ? 'تم تفعيل الكوبون بنجاح' : 'تم إيقاف الكوبون بنجاح'
        );
        fetchCoupons();
      } else {
        toast.error(json.message || 'فشل تغيير حالة الكوبون');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء تحديث حالة الكوبون');
    }
  };

  // Delete Coupon
  const handleDeleteCoupon = async (coupon) => {
    if (!window.confirm(`هل أنت متأكد من حذف الكوبون "${coupon.code} - ${coupon.name_ar}"؟`)) {
      return;
    }
    try {
      const apiHost = getApiHost();
      const token = await ensureAuthToken();
      const res = await fetch(
        `${apiHost}/api/v1/cms/coupons/${encodeURIComponent(coupon.id)}`,
        {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('تم حذف الكوبون بنجاح');
        fetchCoupons();
      } else {
        toast.error(json.message || 'تعذر حذف الكوبون');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء حذف الكوبون');
    }
  };

  const copyText = (text, label = 'تم النسخ') => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(String(text));
      toast.success(`${label}: ${text}`);
    }
  };

  const getStatusBadge = (coupon) => {
    if (!coupon.is_active) {
      return { label: 'معطّل', cls: 'status-inactive' };
    }
    if (coupon.is_expired) {
      return { label: 'منتهي الصلاحية', cls: 'status-expired' };
    }
    if (coupon.is_exhausted) {
      return { label: 'مكتمل الحد العام', cls: 'status-exhausted' };
    }
    return { label: 'نشط وفعّال', cls: 'status-active' };
  };

  if (!mounted) return null;

  return (
    <div className="coupons-admin-page" dir={isRtl ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <AdminSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        lang={lang}
      />

      <div className={`admin-main-wrapper ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <AdminHeader
          adminUser={adminUser}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          isSidebarCollapsed={sidebarCollapsed}
          lang={lang}
          onToggleLanguage={(l) => setLang(l || (lang === 'ar' ? 'en' : 'ar'))}
        />

        <main className="admin-content-area">
          {/* Page Hero Header */}
          <div className="coupons-page-header">
            <div className="header-titles">
              <div className="title-badge">
                <FaTicket />
                <span>إدارة الكوبونات وسجل استخدامات العملاء والطلبات</span>
              </div>
              <h1>كوبونات الخصم والعروض الترويجية</h1>
              <p>
                أنشئ وعدّل كوبونات الخصم (نسبة مئوية أو مبلغ ثابت)، راقب حالة كل كوبون، عدد مرات
                الاستخدام، تاريخ آخر استخدام، وبيانات صاحب الطلب (الاسم ورقم الهاتف والطلب المرتبط).
              </p>
            </div>

            <div className="header-actions">
              <button
                type="button"
                className="create-coupon-btn"
                onClick={handleOpenCreate}
              >
                <FaPlus />
                <span>إنشاء كوبون جديد</span>
              </button>
            </div>
          </div>

          {/* KPI Stats Row */}
          <div className="coupons-stats-grid">
            <AdminStatsCard
              title="إجمالي الكوبونات"
              value={stats.total}
              subtitle="جميع الأكواد المسجلة بالنظام"
              icon={<FaTicket size={20} />}
              variant="primary"
            />
            <AdminStatsCard
              title="الكوبونات النشطة"
              value={stats.active}
              subtitle="صالحة ومتاحة للاستخدام في المتجر"
              icon={<FaCheck size={20} />}
              variant="success"
            />
            <AdminStatsCard
              title="إجمالي مرات الاستخدام"
              value={stats.totalUsages}
              subtitle="مرات تطبيق الكوبونات في الطلبات"
              icon={<FaReceipt size={20} />}
              variant="warning"
            />
            <AdminStatsCard
              title="إجمالي توفير العملاء"
              value={`${stats.totalDiscountSaved.toLocaleString('ar-EG')} ج.م`}
              subtitle="قيمة الخصومات الممنوحة عبر الطلبات"
              icon={<FaMoneyBillWave size={20} />}
              variant="info"
            />
          </div>

          {/* View Switcher & Search/Filter Toolbar */}
          <div className="coupons-toolbar-card">
            <div className="view-mode-switcher">
              <button
                type="button"
                className={activeViewTab === 'coupons' ? 'active' : ''}
                onClick={() => setActiveViewTab('coupons')}
              >
                <FaTicket />
                <span>بطاقات الكوبونات والطلبات المرتبطة ({coupons.length})</span>
              </button>
              <button
                type="button"
                className={activeViewTab === 'redemptions_log' ? 'active' : ''}
                onClick={() => setActiveViewTab('redemptions_log')}
              >
                <FaUsers />
                <span>سجل المستخدمين والطلبات بالـكوبونات ({allRedemptions.length})</span>
              </button>
            </div>

            <div className="toolbar-controls-row">
              <div className="search-box">
                <FaMagnifyingGlass className="search-icon" />
                <input
                  type="text"
                  placeholder="ابحث باسم الكوبون، الكود، اسم العميل، رقم الهاتف، أو رقم الطلب (TRD-...)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {activeViewTab === 'coupons' && (
                <div className="filter-tabs">
                  <button
                    type="button"
                    className={statusFilter === 'all' ? 'active' : ''}
                    onClick={() => setStatusFilter('all')}
                  >
                    الكل ({coupons.length})
                  </button>
                  <button
                    type="button"
                    className={statusFilter === 'active' ? 'active' : ''}
                    onClick={() => setStatusFilter('active')}
                  >
                    نشط ({coupons.filter((c) => c.computed_status === 'active').length})
                  </button>
                  <button
                    type="button"
                    className={statusFilter === 'used' ? 'active' : ''}
                    onClick={() => setStatusFilter('used')}
                  >
                    تم استخدامه ({coupons.filter((c) => Number(c.actual_used_count) > 0).length})
                  </button>
                  <button
                    type="button"
                    className={statusFilter === 'inactive' ? 'active' : ''}
                    onClick={() => setStatusFilter('inactive')}
                  >
                    معطّل / منتهي ({coupons.filter((c) => c.computed_status !== 'active').length})
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* CONTENT AREA */}
          {loading ? (
            <div className="coupons-loading-state">
              <div className="spinner-ring" />
              <p>جاري تحميل الكوبونات وسجل الطلبات المرتبطة...</p>
            </div>
          ) : activeViewTab === 'coupons' ? (
            filteredCoupons.length === 0 ? (
              <div className="coupons-empty-state">
                <FaTicket className="empty-icon" />
                <h3>لا توجد كوبونات مطابقة للبحث</h3>
                <p>يمكنك إنشاء كوبون خصم جديد بنسبة مئوية أو مبلغ ثابت وتخصيص حدود استخدامه.</p>
                <button type="button" className="create-coupon-btn" onClick={handleOpenCreate}>
                  <FaPlus />
                  <span>إنشاء كوبون جديد</span>
                </button>
              </div>
            ) : (
              <div className="coupons-cards-grid">
                {filteredCoupons.map((coupon) => {
                  const statusBadge = getStatusBadge(coupon);
                  const isPercentage = coupon.discount_type === 'percentage';
                  const usageLimit = coupon.usage_limit ? Number(coupon.usage_limit) : null;
                  const usedCount = Number(coupon.actual_used_count || 0);
                  const usagePercent = usageLimit
                    ? Math.min(100, Math.round((usedCount / usageLimit) * 100))
                    : 0;
                  const lastUsage = coupon.last_usage;
                  const usagesList = Array.isArray(coupon.usages) ? coupon.usages : [];

                  return (
                    <div
                      key={coupon.id}
                      className={`coupon-admin-card ${!coupon.is_active ? 'is-disabled' : ''}`}
                    >
                      {/* Top Header: Code Ticket + Status + Actions */}
                      <div className="coupon-card-top">
                        <div className="coupon-code-badge-wrap">
                          <button
                            type="button"
                            className="coupon-code-ticket"
                            onClick={() => copyText(coupon.code, 'تم نسخ كود الكوبون')}
                            title="اضغط لنسخ كود الكوبون"
                          >
                            <FaTicket className="ticket-ic" />
                            <span className="code-str">{coupon.code}</span>
                            <FaCopy className="copy-ic" />
                          </button>

                          <span className={`coupon-status-pill ${statusBadge.cls}`}>
                            <span className="dot" />
                            {statusBadge.label}
                          </span>
                        </div>

                        <div className="coupon-top-actions">
                          <label className="status-switch" title="تفعيل أو إيقاف الكوبون">
                            <input
                              type="checkbox"
                              checked={Boolean(coupon.is_active)}
                              onChange={() => handleToggleStatus(coupon)}
                            />
                            <span className="switch-slider" />
                          </label>
                          <button
                            type="button"
                            className="icon-btn edit"
                            onClick={() => handleOpenEdit(coupon)}
                            title="تعديل الكوبون"
                          >
                            <FaPenToSquare />
                          </button>
                          <button
                            type="button"
                            className="icon-btn delete"
                            onClick={() => handleDeleteCoupon(coupon)}
                            title="حذف الكوبون"
                          >
                            <FaTrashCan />
                          </button>
                        </div>
                      </div>

                      {/* Coupon Name & Discount Banner */}
                      <div className="coupon-main-info">
                        <div className="coupon-titles">
                          <h3 className="coupon-name">{coupon.name_ar}</h3>
                          {coupon.min_order_value > 0 && (
                            <span className="min-order-note">
                              الحد الأدنى للطلب: {Number(coupon.min_order_value).toLocaleString('ar-EG')} ج.م
                            </span>
                          )}
                        </div>

                        <div className={`discount-value-box ${isPercentage ? 'pct' : 'fixed'}`}>
                          <span className="disc-num">
                            {isPercentage
                              ? `${Number(coupon.discount_value)}%`
                              : `${Number(coupon.discount_value).toLocaleString('ar-EG')} ج.م`}
                          </span>
                          <span className="disc-type-lbl">
                            {isPercentage ? 'خصم نسبي' : 'خصم ثابت'}
                          </span>
                          {isPercentage && coupon.max_discount && (
                            <span className="max-cap-lbl">
                              بحد أقصى {Number(coupon.max_discount).toLocaleString('ar-EG')} ج.م
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Key Metrics Grid: Usage Count, Per-Person Limit, Expiry Date, Last Used Date */}
                      <div className="coupon-metrics-grid">
                        <div className="metric-box">
                          <span className="m-label">
                            <FaRepeat /> عدد الاستخدام العام
                          </span>
                          <div className="m-val-row">
                            <strong className="m-val">
                              {usedCount}
                              {usageLimit ? ` / ${usageLimit}` : ' (غير محدود ∞)'}
                            </strong>
                            {usageLimit && (
                              <span className="m-pct">{usagePercent}%</span>
                            )}
                          </div>
                          {usageLimit && (
                            <div className="usage-progress-bar">
                              <div
                                className="usage-progress-fill"
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                          )}
                        </div>

                        <div className="metric-box">
                          <span className="m-label">
                            <FaUser /> الحد لنفس الشخص (برقم الهاتف)
                          </span>
                          <strong className="m-val">
                            {coupon.per_user_limit
                              ? `${coupon.per_user_limit} مرة لكل رقم هاتف`
                              : 'غير محدود لكل عميل'}
                          </strong>
                          {coupon.first_order_only && (
                            <span className="m-sub-tag">مخصص لأول طلب فقط</span>
                          )}
                        </div>

                        <div className="metric-box">
                          <span className="m-label">
                            <FaClock /> تاريخ انتهاء الكوبون
                          </span>
                          <strong className={`m-val ${coupon.is_expired ? 'text-danger' : ''}`}>
                            {coupon.expires_at
                              ? formatDateTime(coupon.expires_at, false)
                              : 'مفتوح بدون تاريخ انتهاء'}
                          </strong>
                        </div>

                        <div className="metric-box highlight-last-use">
                          <span className="m-label">
                            <FaCalendarCheck /> تاريخ آخر استخدام
                          </span>
                          <strong className="m-val">
                            {coupon.last_used_at
                              ? formatDateTime(coupon.last_used_at, true)
                              : 'لم يُستخدم حتى الآن'}
                          </strong>
                        </div>
                      </div>

                      {/* Customer & Linked Orders Section (Guest Checkout Order Data) */}
                      <div className="coupon-customer-orders-section">
                        <div className="section-head">
                          <div className="sh-title">
                            <FaReceipt />
                            <span>
                              بيانات صاحب الطلب والطلبات المرتبطة بالكوبون ({usagesList.length})
                            </span>
                          </div>
                          {usagesList.length > 0 && (
                            <button
                              type="button"
                              className="view-all-usages-btn"
                              onClick={() => setSelectedCouponForOrders(coupon)}
                            >
                              <FaEye />
                              <span>عرض كل الاستخدامات ({usagesList.length})</span>
                            </button>
                          )}
                        </div>

                        {lastUsage ? (
                          <div className="latest-usage-showcase">
                            <div className="latest-customer-banner">
                              <div className="cust-identity">
                                <div className="cust-avatar">
                                  <FaUser />
                                </div>
                                <div className="cust-text">
                                  <div className="cust-name-row">
                                    <span className="lbl">آخر مستخدم (صاحب الطلب):</span>
                                    <strong className="cust-name">{lastUsage.customer_name}</strong>
                                    <span className="cust-usage-pill">
                                      استخدم الكوبون {lastUsage.customer_usage_count_for_coupon} مرة
                                    </span>
                                  </div>
                                  <div className="cust-phone-row">
                                    <button
                                      type="button"
                                      className="phone-chip"
                                      onClick={() =>
                                        copyText(lastUsage.customer_phone, 'تم نسخ رقم الهاتف')
                                      }
                                      title="اضغط لنسخ رقم هاتف العميل"
                                    >
                                      <FaPhone />
                                      <span dir="ltr">{lastUsage.customer_phone}</span>
                                      <FaCopy className="mini-copy" />
                                    </button>
                                    {lastUsage.governorate && (
                                      <span className="cust-loc">
                                        <FaLocationDot />
                                        {lastUsage.governorate} - {lastUsage.city}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="linked-order-badge-box">
                                <span className="ord-lbl">الطلب المرتبط بالكوبون</span>
                                <div className="ord-num-row">
                                  <button
                                    type="button"
                                    className="order-number-pill"
                                    onClick={() => setSelectedCouponForOrders(coupon)}
                                    title="عرض تفاصيل الطلب المرتبط"
                                  >
                                    <FaReceipt />
                                    <span>{lastUsage.order_number}</span>
                                  </button>
                                  <span
                                    className="ord-status-tag"
                                    style={{
                                      color:
                                        ORDER_STATUS_META[lastUsage.order_status]?.color ||
                                        '#334155',
                                      background:
                                        ORDER_STATUS_META[lastUsage.order_status]?.bg ||
                                        '#f1f5f9',
                                    }}
                                  >
                                    {ORDER_STATUS_META[lastUsage.order_status]?.label ||
                                      lastUsage.order_status}
                                  </span>
                                </div>
                                <div className="ord-financials">
                                  <span>
                                    الخصم المطبق:{' '}
                                    <strong className="saved">
                                      -{Number(lastUsage.discount_amount).toLocaleString('ar-EG')} ج.م
                                    </strong>
                                  </span>
                                  <span>•</span>
                                  <span>
                                    إجمالي الطلب:{' '}
                                    <strong>
                                      {Number(lastUsage.total_amount).toLocaleString('ar-EG')} ج.م
                                    </strong>
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Mini table if there are multiple orders using this coupon */}
                            {usagesList.length > 1 && (
                              <div className="other-usages-mini-list">
                                <div className="mini-list-title">
                                  جميع الطلبات التي تم استخدام الكوبون فيها ({usagesList.length} طلب):
                                </div>
                                <div className="mini-table-wrap">
                                  <table className="mini-usages-table">
                                    <thead>
                                      <tr>
                                        <th>رقم الطلب</th>
                                        <th>اسم صاحب الطلب</th>
                                        <th>رقم الهاتف</th>
                                        <th>قيمة الخصم</th>
                                        <th>إجمالي الطلب</th>
                                        <th>تاريخ الاستخدام</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {usagesList.slice(0, 4).map((u) => (
                                        <tr key={u.order_id}>
                                          <td>
                                            <span className="mono-order">{u.order_number}</span>
                                          </td>
                                          <td>
                                            <strong>{u.customer_name}</strong>
                                          </td>
                                          <td>
                                            <button
                                              type="button"
                                              className="inline-phone-btn"
                                              onClick={() =>
                                                copyText(u.customer_phone, 'تم نسخ رقم الهاتف')
                                              }
                                            >
                                              <span dir="ltr">{u.customer_phone}</span>
                                              <FaCopy size={10} />
                                            </button>
                                          </td>
                                          <td className="discount-cell">
                                            -{Number(u.discount_amount).toLocaleString('ar-EG')} ج.م
                                          </td>
                                          <td>
                                            {Number(u.total_amount).toLocaleString('ar-EG')} ج.م
                                          </td>
                                          <td className="date-cell">
                                            {formatDateTime(u.used_at, true)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="no-usages-yet">
                            <FaCircleInfo />
                            <span>
                              لم يتم استخدام هذا الكوبون في أي طلب حتى الآن. ستظهر هنا بيانات العميل
                              (الاسم ورقم الهاتف ورقم الطلب) فور استخدامه عند إتمام الشراء.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* GLOBAL REDEMPTIONS LOG TAB */
            <div className="redemptions-log-card">
              <div className="log-card-header">
                <div>
                  <h3>سجل عمليات استخدام الكوبونات عبر الطلبات</h3>
                  <p>
                    جميع الطلبات التي تم تطبيق كوبونات خصم عليها مع بيانات صاحب الطلب (الاسم، رقم
                    الهاتف، المحافظة) بناءً على بيانات إتمام الطلب.
                  </p>
                </div>
              </div>

              {filteredRedemptions.length === 0 ? (
                <div className="coupons-empty-state">
                  <FaReceipt className="empty-icon" />
                  <h3>لا توجد عمليات استخدام مطابقة</h3>
                </div>
              ) : (
                <div className="redemptions-table-responsive">
                  <table className="redemptions-full-table">
                    <thead>
                      <tr>
                        <th>الكوبون المستخدم</th>
                        <th>الطلب المرتبط</th>
                        <th>اسم المستخدم (صاحب الطلب)</th>
                        <th>رقم الهاتف</th>
                        <th>المحافظة / العنوان</th>
                        <th>عدد استخدامات العميل</th>
                        <th>قيمة الخصم</th>
                        <th>إجمالي الطلب</th>
                        <th>حالة الطلب</th>
                        <th>تاريخ الاستخدام</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRedemptions.map((row) => {
                        const st = ORDER_STATUS_META[row.order_status] || {
                          label: row.order_status,
                          color: '#334155',
                          bg: '#f1f5f9',
                        };
                        return (
                          <tr key={`${row.coupon_id}-${row.order_id}`}>
                            <td>
                              <div className="cell-coupon">
                                <span
                                  className="code-badge"
                                  onClick={() => copyText(row.coupon_code, 'تم نسخ الكود')}
                                >
                                  {row.coupon_code}
                                </span>
                                <span className="c-name">{row.coupon_name}</span>
                              </div>
                            </td>
                            <td>
                              <span className="order-ref-pill">{row.order_number}</span>
                            </td>
                            <td>
                              <strong className="cust-name-cell">{row.customer_name}</strong>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="phone-copy-pill"
                                onClick={() => copyText(row.customer_phone, 'تم نسخ رقم الهاتف')}
                              >
                                <FaPhone size={11} />
                                <span dir="ltr">{row.customer_phone}</span>
                                <FaCopy size={11} />
                              </button>
                            </td>
                            <td>
                              <span className="loc-text">
                                {row.governorate} - {row.city}
                              </span>
                            </td>
                            <td>
                              <span className="usage-freq-badge">
                                {row.customer_usage_count_for_coupon}
                                {row.coupon_per_user_limit
                                  ? ` / ${row.coupon_per_user_limit}`
                                  : ''}{' '}
                                مرة
                              </span>
                            </td>
                            <td>
                              <strong className="discount-val-green">
                                -{Number(row.discount_amount).toLocaleString('ar-EG')} ج.م
                              </strong>
                            </td>
                            <td>
                              <strong>
                                {Number(row.total_amount).toLocaleString('ar-EG')} ج.م
                              </strong>
                            </td>
                            <td>
                              <span
                                className="status-chip"
                                style={{ color: st.color, background: st.bg }}
                              >
                                {st.label}
                              </span>
                            </td>
                            <td className="date-col">{formatDateTime(row.used_at, true)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* CREATE / EDIT COUPON MODAL */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingCoupon
            ? `تعديل الكوبون: ${editingCoupon.code}`
            : 'إنشاء كوبون خصم جديد'
        }
        size="lg"
      >
        <form onSubmit={handleSaveCoupon} className="coupon-studio-form" dir="rtl">
          {/* 1. Coupon Name & Code Section */}
          <div className="form-section-box">
            <div className="section-box-header">
              <span className="step-num">1</span>
              <div>
                <h4>بيانات الكوبون الأساسية وكود التفعيل</h4>
                <p>أدخل اسم الكوبون، واختر بين كتابة الكود يدوياً (3 أحرف وأرقام على الأقل) أو توليده تلقائياً</p>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <div className="field-label-row">
                  <label>
                    اسم الكوبون <span className="req">*</span>
                  </label>
                  <span className="opt-tag req-tag">إجباري</span>
                </div>
                <input
                  type="text"
                  required
                  className="std-input"
                  placeholder="مثال: كوبون خصم الجمعة البيضاء 20% أو خصم الشحن"
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                />
              </div>

              <div className="form-group">
                <div className="field-label-row">
                  <label>
                    كود الكوبون <span className="req">*</span>
                  </label>
                  <span className={`char-counter-pill ${isCodeValid ? 'valid' : 'short'}`}>
                    {sanitizedCode.length} / 3+ أحرف وأرقام
                  </span>
                </div>

                <div className="code-input-group">
                  <input
                    type="text"
                    required
                    dir="ltr"
                    className={`std-input code-input ${sanitizedCode.length > 0 && !isCodeValid ? 'invalid' : ''}`}
                    placeholder="TRD250 / VIP20"
                    value={formData.code}
                    onChange={(e) => {
                      setCodeMode('manual');
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
                      });
                    }}
                  />
                  <button
                    type="button"
                    className="auto-gen-btn"
                    onClick={handleGenerateCode}
                    title="توليد كود كوبون عشوائي"
                  >
                    <FaWandMagicSparkles />
                    <span>توليد تلقائي</span>
                  </button>
                </div>

                {sanitizedCode.length > 0 && !isCodeValid && (
                  <small className="error-hint">
                    يجب أن يتكون الكود من 3 أحرف إنجليزية أو أرقام على الأقل.
                  </small>
                )}
              </div>
            </div>
          </div>

          {/* 2. Discount Type & Value Section */}
          <div className="form-section-box">
            <div className="section-box-header">
              <span className="step-num">2</span>
              <div>
                <h4>نوع وقيمة الخصم</h4>
                <p>حدد ما إذا كان الكوبون يمنح خصماً بنسبة مئوية (%) أو بسعر ثابت (ج.م)</p>
              </div>
            </div>

            <div className="discount-type-cards">
              <button
                type="button"
                className={`dtype-card ${formData.discount_type === 'percentage' ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, discount_type: 'percentage' })}
              >
                <div className="dt-icon">
                  <FaPercent />
                </div>
                <div className="dt-info">
                  <strong>خصم بنسبة مئوية (%)</strong>
                  <span>مثال: خصم 15% أو 20% من قيمة الطلب</span>
                </div>
              </button>

              <button
                type="button"
                className={`dtype-card ${formData.discount_type === 'fixed_amount' ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, discount_type: 'fixed_amount' })}
              >
                <div className="dt-icon">
                  <FaMoneyBillWave />
                </div>
                <div className="dt-info">
                  <strong>خصم بسعر ثابت (ج.م)</strong>
                  <span>مثال: خصم 250 ج.م مباشرة من إجمالي الطلب</span>
                </div>
              </button>
            </div>

            <div className={formData.discount_type === 'percentage' ? 'form-grid-3' : 'form-grid-2'}>
              <div className="form-group">
                <div className="field-label-row">
                  <label>
                    {formData.discount_type === 'percentage'
                      ? 'نسبة الخصم'
                      : 'قيمة الخصم الثابت'}{' '}
                    <span className="req">*</span>
                  </label>
                  <span className="opt-tag unit-tag">
                    {formData.discount_type === 'percentage' ? 'نسبة %' : 'ج.م'}
                  </span>
                </div>
                <div className="input-with-unit">
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={formData.discount_type === 'percentage' ? '100' : undefined}
                    required
                    className="std-input"
                    placeholder={formData.discount_type === 'percentage' ? '15' : '250'}
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  />
                  <span className="unit-suffix">
                    {formData.discount_type === 'percentage' ? '%' : 'ج.م'}
                  </span>
                </div>
              </div>

              {formData.discount_type === 'percentage' && (
                <div className="form-group">
                  <div className="field-label-row">
                    <label>الحد الأقصى للخصم</label>
                    <span className="opt-tag">اختياري</span>
                  </div>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      className="std-input"
                      placeholder="بدون سقف أقصى"
                      value={formData.max_discount}
                      onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                    />
                    <span className="unit-suffix">ج.م</span>
                  </div>
                </div>
              )}

              <div className="form-group">
                <div className="field-label-row">
                  <label>الحد الأدنى لقيمة الطلب</label>
                  <span className="opt-tag">اختياري</span>
                </div>
                <div className="input-with-unit">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    className="std-input"
                    placeholder="0"
                    value={formData.min_order_value}
                    onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                  />
                  <span className="unit-suffix">ج.م</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Usage Limits & Expiration Date */}
          <div className="form-section-box">
            <div className="section-box-header">
              <span className="step-num">3</span>
              <div>
                <h4>حدود الاستخدام وتاريخ انتهاء الكوبون</h4>
                <p>
                  تحكم في عدد مرات الاستخدام العام، عدد مرات الاستخدام لنفس الشخص (بناءً على رقم
                  الهاتف في الطلب)، وتاريخ انتهاء الصلاحية
                </p>
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <div className="field-label-row">
                  <label>عدد الاستخدام العام</label>
                  <span className="opt-tag">اختياري</span>
                </div>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="std-input"
                  placeholder="فارغ = غير محدود"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                />
                <small className="field-hint">
                  إجمالي المرات المسموح بها لكل العملاء في المتجر
                </small>
              </div>

              <div className="form-group">
                <div className="field-label-row">
                  <label>الاستخدام لنفس الشخص</label>
                  <span className="opt-tag">اختياري</span>
                </div>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="std-input"
                  placeholder="مثال: 1 لكل عميل"
                  value={formData.per_user_limit}
                  onChange={(e) => setFormData({ ...formData, per_user_limit: e.target.value })}
                />
                <small className="field-hint">
                  يُحسب تلقائياً برقم هاتف العميل المُدخل في الطلب
                </small>
              </div>

              <div className="form-group">
                <div className="field-label-row">
                  <label>تاريخ انتهاء الكوبون</label>
                  <span className="opt-tag">اختياري</span>
                </div>
                <input
                  type="date"
                  className="std-input"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                />
                <div className="quick-expiry-pills">
                  <button type="button" onClick={() => setQuickExpiryDays(7)}>
                    +7 أيام
                  </button>
                  <button type="button" onClick={() => setQuickExpiryDays(14)}>
                    +14 يوم
                  </button>
                  <button type="button" onClick={() => setQuickExpiryDays(30)}>
                    +30 يوم
                  </button>
                  <button type="button" onClick={() => setQuickExpiryDays(null)}>
                    بدون انتهاء
                  </button>
                </div>
              </div>
            </div>

            <div className="toggles-row">
              <label className="checkbox-card">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <div>
                  <strong>تفعيل الكوبون فوراً</strong>
                  <span>السماح للعملاء باستخدام الكوبون في صفحة إتمام الطلب</span>
                </div>
              </label>

              <label className="checkbox-card">
                <input
                  type="checkbox"
                  checked={formData.first_order_only}
                  onChange={(e) =>
                    setFormData({ ...formData, first_order_only: e.target.checked })
                  }
                />
                <div>
                  <strong>مخصص لأول طلب فقط للعميل الجديد</strong>
                  <span>يشترط عدم وجود أي طلبات سابقة مسجلة بنفس رقم الهاتف</span>
                </div>
              </label>
            </div>
          </div>

          <div className="modal-actions-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              إلغاء
            </button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving
                ? 'جاري الحفظ...'
                : editingCoupon
                ? 'حفظ التعديلات على الكوبون'
                : 'إنشاء وتفعيل الكوبون'}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* LINKED ORDERS & CUSTOMERS DETAILS MODAL */}
      <AdminModal
        isOpen={Boolean(selectedCouponForOrders)}
        onClose={() => setSelectedCouponForOrders(null)}
        title={
          selectedCouponForOrders
            ? `سجل استخدامات الكوبون (${selectedCouponForOrders.code}) والطلبات المرتبطة`
            : ''
        }
        size="lg"
      >
        {selectedCouponForOrders && (
          <div className="coupon-orders-modal-body" dir="rtl">
            <div className="modal-coupon-summary-bar">
              <div className="sum-item">
                <span>اسم الكوبون:</span>
                <strong>{selectedCouponForOrders.name_ar}</strong>
              </div>
              <div className="sum-item">
                <span>الكود:</span>
                <strong className="mono">{selectedCouponForOrders.code}</strong>
              </div>
              <div className="sum-item">
                <span>مرات الاستخدام:</span>
                <strong>
                  {selectedCouponForOrders.actual_used_count}
                  {selectedCouponForOrders.usage_limit
                    ? ` / ${selectedCouponForOrders.usage_limit}`
                    : ''}
                </strong>
              </div>
              <div className="sum-item">
                <span>الحد للشخص الواحد:</span>
                <strong>
                  {selectedCouponForOrders.per_user_limit
                    ? `${selectedCouponForOrders.per_user_limit} مرة لكل رقم هاتف`
                    : 'غير محدود'}
                </strong>
              </div>
              <div className="sum-item">
                <span>إجمالي الخصومات الممنوحة:</span>
                <strong className="green">
                  {Number(selectedCouponForOrders.total_discount_granted || 0).toLocaleString(
                    'ar-EG'
                  )}{' '}
                  ج.م
                </strong>
              </div>
            </div>

            <h4 className="sub-heading">
              الطلبات وأصحاب الطلبات الذين استخدموا الكوبون ({selectedCouponForOrders.usages?.length || 0})
            </h4>

            <div className="detailed-orders-list">
              {(selectedCouponForOrders.usages || []).map((u) => {
                const st = ORDER_STATUS_META[u.order_status] || {
                  label: u.order_status,
                  color: '#334155',
                  bg: '#f1f5f9',
                };
                return (
                  <div key={u.order_id} className="detailed-order-card">
                    <div className="doc-header">
                      <div className="doc-order-id">
                        <FaReceipt />
                        <strong>طلب رقم: {u.order_number}</strong>
                        <span
                          className="doc-status"
                          style={{ color: st.color, background: st.bg }}
                        >
                          {st.label}
                        </span>
                      </div>
                      <span className="doc-date">{formatDateTime(u.used_at, true)}</span>
                    </div>

                    <div className="doc-customer-grid">
                      <div className="doc-field">
                        <span>اسم صاحب الطلب:</span>
                        <strong>{u.customer_name}</strong>
                      </div>
                      <div className="doc-field">
                        <span>رقم الهاتف الأساسي:</span>
                        <button
                          type="button"
                          className="phone-copy-inline"
                          onClick={() => copyText(u.customer_phone, 'تم نسخ رقم الهاتف')}
                        >
                          <span dir="ltr">{u.customer_phone}</span>
                          <FaCopy size={11} />
                        </button>
                      </div>
                      {u.customer_phone_2 && (
                        <div className="doc-field">
                          <span>رقم هاتف إضافي:</span>
                          <strong dir="ltr">{u.customer_phone_2}</strong>
                        </div>
                      )}
                      <div className="doc-field">
                        <span>العنوان والمحافظة:</span>
                        <strong>
                          {u.governorate} - {u.city} ({u.street_address})
                        </strong>
                      </div>
                      <div className="doc-field">
                        <span>مرات استخدام هذا الرقم للكوبون:</span>
                        <strong className="primary-txt">
                          {u.customer_usage_count_for_coupon} مرة
                        </strong>
                      </div>
                      <div className="doc-field">
                        <span>وسيلة الدفع:</span>
                        <strong>
                          {PAYMENT_METHOD_LABELS[u.payment_method] || u.payment_method}
                        </strong>
                      </div>
                    </div>

                    <div className="doc-financial-bar">
                      <div>
                        <span>المجموع الفرعي:</span>{' '}
                        <strong>{Number(u.subtotal).toLocaleString('ar-EG')} ج.م</strong>
                      </div>
                      <div>
                        <span>قيمة خصم الكوبون:</span>{' '}
                        <strong className="discount-green">
                          -{Number(u.discount_amount).toLocaleString('ar-EG')} ج.م
                        </strong>
                      </div>
                      <div>
                        <span>الشحن:</span>{' '}
                        <strong>{Number(u.shipping_fee).toLocaleString('ar-EG')} ج.م</strong>
                      </div>
                      <div>
                        <span>الإجمالي النهائي للطلب:</span>{' '}
                        <strong className="total-blue">
                          {Number(u.total_amount).toLocaleString('ar-EG')} ج.م
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
