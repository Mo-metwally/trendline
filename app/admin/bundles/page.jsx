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
  useToast,
} from '@/src/components/adminComponents';
import {
  FaBoxesStacked,
  FaPlus,
  FaMagnifyingGlass,
  FaTag,
  FaClock,
  FaCheck,
  FaPenToSquare,
  FaTrashCan,
  FaCopy,
  FaUpRightFromSquare,
  FaBoxOpen,
  FaPercent,
  FaCircleInfo,
} from 'react-icons/fa6';
import './Bundles.scss';

export default function AdminBundlesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const toast = useToast();

  const [mounted, setMounted] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lang, setLang] = useState('ar');
  const isRtl = lang === 'ar';

  const [bundles, setBundles] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'discounted' | 'inactive'

  useEffect(() => {
    setMounted(true);
  }, []);

  // Ensure valid JWT token for Admin API mutations
  const ensureAuthToken = async () => {
    let token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    if (!token && session?.accessToken) {
      token = session.accessToken;
      localStorage.setItem('admin_token', token);
    }
    if (!token) {
      try {
        const res = await fetch('/api/auth/session');
        const sData = await res.json();
        if (sData?.accessToken) {
          token = sData.accessToken;
          localStorage.setItem('admin_token', token);
        }
      } catch (e) {
        // ignore
      }
    }
    return token;
  };

  useEffect(() => {
    if (status === 'loading') return;
    const savedUser = typeof window !== 'undefined' ? localStorage.getItem('admin_user') : null;
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

  const fetchBundlesAndProducts = async () => {
    setLoading(true);
    try {
      const apiHost = getApiHost();
      const [bundlesRes, prodsRes] = await Promise.all([
        fetch(`${apiHost}/api/v1/catalog/bundles?all=true`),
        fetch(`${apiHost}/api/v1/catalog/products?is_active=all&limit=200`),
      ]);

      const bundlesJson = await bundlesRes.json();
      const prodsJson = await prodsRes.json();

      if (bundlesJson?.success && Array.isArray(bundlesJson.data)) {
        setBundles(bundlesJson.data);
      }
      if (prodsJson?.success && Array.isArray(prodsJson.data)) {
        setProducts(prodsJson.data);
      }
    } catch (err) {
      console.error('Error loading bundles:', err);
      toast?.error?.('تعذر تحميل بيانات الباندلز');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBundlesAndProducts();
  }, []);

  // Count how many bundles each product belongs to
  const productBundleCountMap = useMemo(() => {
    const map = new Map();
    bundles.forEach((b) => {
      (b.items || []).forEach((it) => {
        const pid = String(it.product_id);
        map.set(pid, (map.get(pid) || 0) + 1);
      });
    });
    return map;
  }, [bundles]);

  // KPI Metrics
  const kpiStats = useMemo(() => {
    const total = bundles.length;
    const active = bundles.filter((b) => b.is_active).length;
    const withActiveDiscount = bundles.filter((b) => b.is_active && b.is_discount_active).length;
    const uniqueBundledProducts = productBundleCountMap.size;
    return { total, active, withActiveDiscount, uniqueBundledProducts };
  }, [bundles, productBundleCountMap]);

  // Filtered Bundles
  const filteredBundles = useMemo(() => {
    return bundles.filter((b) => {
      if (statusFilter === 'active' && !b.is_active) return false;
      if (statusFilter === 'inactive' && b.is_active) return false;
      if (statusFilter === 'discounted' && !b.is_discount_active) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchBundle =
          b.id?.toLowerCase().includes(q) ||
          b.name_ar?.toLowerCase().includes(q) ||
          b.name_en?.toLowerCase().includes(q);
        const matchProd = (b.items || []).some(
          (it) =>
            it.product?.name_ar?.toLowerCase().includes(q) ||
            it.product?.name_en?.toLowerCase().includes(q) ||
            it.product?.sku?.toLowerCase().includes(q)
        );
        return matchBundle || matchProd;
      }
      return true;
    });
  }, [bundles, statusFilter, searchQuery]);

  // Toggle Bundle Active Status
  const handleToggleBundleActive = async (bundle) => {
    try {
      const token = await ensureAuthToken();
      const apiHost = getApiHost();
      const res = await fetch(
        `${apiHost}/api/v1/catalog/bundles/${encodeURIComponent(bundle.id)}/toggle`,
        {
          method: 'PATCH',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (res.ok) {
        toast?.info?.(
          bundle.is_active ? 'تم تعطيل الباندل مؤقتاً' : 'تم تفعيل ظهور الباندل في صفحات المنتجات'
        );
        fetchBundlesAndProducts();
      }
    } catch (err) {
      toast?.error?.('فشل تغيير حالة الباندل');
    }
  };

  // Delete Bundle
  const handleDeleteBundle = async (bundle) => {
    if (!window.confirm(`هل أنت متأكد من حذف الباندل "${bundle.name_ar}" (${bundle.id}) نهائياً؟`)) {
      return;
    }
    try {
      const token = await ensureAuthToken();
      const apiHost = getApiHost();
      const res = await fetch(
        `${apiHost}/api/v1/catalog/bundles/${encodeURIComponent(bundle.id)}`,
        {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (res.ok) {
        toast?.success?.('تم حذف الباندل بنجاح');
        fetchBundlesAndProducts();
      }
    } catch (err) {
      toast?.error?.('فشل حذف الباندل');
    }
  };

  const handleCopyBundleId = async (id) => {
    try {
      await navigator.clipboard.writeText(id);
      toast?.success?.(`تم نسخ معرّف الباندل: ${id}`);
    } catch (e) {
      // ignore
    }
  };

  if (!mounted) return null;

  return (
    <div className="admin-bundles-page" dir={isRtl ? 'rtl' : 'ltr'} suppressHydrationWarning>
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

        <main className="bundles-workspace">
          {/* ================= PAGE HEADER ================= */}
          <div className="bundles-page-header">
            <div className="header-title-block">
              <h1>
                <FaBoxesStacked color="#1d4ed8" />
                <span>إدارة الباندلز والعروض المجمعة (Smart Bundles Hub)</span>
              </h1>
              <p>
                أنشئ باقات منتجات متكاملة بمعرّف فريد (ID) وخصم اختياري يطبّق تلقائياً عند اختيار الباندل كاملة في صفحات المنتجات، مع دوران عشوائي ذكي للمنتجات المشتركة.
              </p>
            </div>

            <Link
              href="/admin/bundles/add"
              className="btn-create-bundle"
            >
              <FaPlus />
              <span>إنشاء باندل جديدة</span>
            </Link>
          </div>

          {/* ================= KPI STATS CARDS ================= */}
          <div className="bundles-kpi-grid">
            <AdminStatsCard
              title="إجمالي الباندلز"
              value={kpiStats.total}
              subtitle="جميع الباقات المسجلة بالنظام"
              icon={<FaBoxesStacked />}
              color="primary"
            />
            <AdminStatsCard
              title="الباندلز النشطة بالمتجر"
              value={kpiStats.active}
              subtitle="تظهر تلقائياً في صفحات منتجاتها"
              icon={<FaCheck />}
              color="success"
            />
            <AdminStatsCard
              title="باندلز بخصم فعال"
              value={kpiStats.withActiveDiscount}
              subtitle="خصم حصري عند طلب الباندل كاملة"
              icon={<FaPercent />}
              color="warning"
            />
            <AdminStatsCard
              title="منتجات مرتبطة بباندلز"
              value={kpiStats.uniqueBundledProducts}
              subtitle="تظهر الباندل في صفحاتها (/pd/:id/:slug)"
              icon={<FaBoxOpen />}
              color="info"
            />
          </div>

          {/* ================= SEARCH & FILTER TOOLBAR ================= */}
          <div className="bundles-toolbar">
            <div className="search-box">
              <FaMagnifyingGlass className="s-icon" />
              <input
                type="text"
                placeholder="ابحث باسم الباندل، معرّف الـ ID، أو اسم منتج داخل الباندل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-pills">
              <button
                type="button"
                className={`f-pill ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                الكل ({bundles.length})
              </button>
              <button
                type="button"
                className={`f-pill ${statusFilter === 'active' ? 'active' : ''}`}
                onClick={() => setStatusFilter('active')}
              >
                النشطة ({kpiStats.active})
              </button>
              <button
                type="button"
                className={`f-pill ${statusFilter === 'discounted' ? 'active' : ''}`}
                onClick={() => setStatusFilter('discounted')}
              >
                بخصم فعال ({kpiStats.withActiveDiscount})
              </button>
              <button
                type="button"
                className={`f-pill ${statusFilter === 'inactive' ? 'active' : ''}`}
                onClick={() => setStatusFilter('inactive')}
              >
                المعطلة ({bundles.length - kpiStats.active})
              </button>
            </div>
          </div>

          {/* ================= BUNDLES LIST ================= */}
          {loading ? (
            <div
              style={{
                background: '#fff',
                borderRadius: '22px',
                padding: '64px 24px',
                textAlign: 'center',
                border: '1px solid #dce6f4',
              }}
            >
              <p style={{ fontSize: '17px', fontWeight: 800, color: '#1d4ed8' }}>
                جاري تحميل الباندلز والمنتجات المرتبطة...
              </p>
            </div>
          ) : filteredBundles.length === 0 ? (
            <div
              style={{
                background: '#fff',
                borderRadius: '22px',
                padding: '64px 24px',
                textAlign: 'center',
                border: '1px solid #dce6f4',
              }}
            >
              <FaBoxesStacked size={42} color="#93c5fd" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>
                لا توجد باندلز مطابقة حالياً
              </h3>
              <p style={{ color: '#64748b', marginBottom: '20px' }}>
                ابدأ بإنشاء باندل جديدة وإضافة المنتجات إليها لتظهر تلقائياً في صفحات تلك المنتجات بالمتجر.
              </p>
              <Link
                href="/admin/bundles/add"
                className="btn-create-bundle"
                style={{ margin: '0 auto' }}
              >
                <FaPlus />
                <span>إنشاء أول باندل الآن</span>
              </Link>
            </div>
          ) : (
            <div className="bundles-cards-list">
              {filteredBundles.map((bundle) => {
                const origTotal = Number(bundle.computed_original_total || bundle.original_total_price || 0);
                const finalPrice = Number(bundle.effective_bundle_price || bundle.bundle_price || origTotal);
                const savings = Number(bundle.savings_amount || Math.max(0, origTotal - finalPrice));

                return (
                  <article className="bundle-admin-card" key={bundle.id}>
                    {/* Card Top: Identity + Financial Summary */}
                    <div className="b-card-top">
                      <div className="b-identity">
                        <div className="id-and-badges">
                          <span
                            className="bundle-id-chip"
                            onClick={() => handleCopyBundleId(bundle.id)}
                            title="انقر لنسخ معرّف الباندل (ID)"
                          >
                            <FaCopy size={11} />
                            <span>ID: {bundle.id}</span>
                          </span>

                          {bundle.is_discount_active ? (
                            <span className="discount-status-chip active-discount">
                              <FaTag size={11} />
                              <span>
                                خصم الباندل الكاملة: {bundle.effective_discount_percent}% (توفير{' '}
                                {savings.toLocaleString()} ج.م)
                              </span>
                            </span>
                          ) : bundle.is_discount_expired ? (
                            <span className="discount-status-chip expired-discount">
                              <FaClock size={11} />
                              <span>انتهى تاريخ صلاحية الخصم</span>
                            </span>
                          ) : (
                            <span className="discount-status-chip no-discount">
                              <span>بدون خصم إضافي (سعر المنتجات الفردية)</span>
                            </span>
                          )}

                          {bundle.expires_at ? (
                            <span className="expiry-chip">
                              <FaClock size={11} />
                              <span>
                                ينتهي في:{' '}
                                {new Date(bundle.expires_at).toLocaleDateString('ar-EG', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </span>
                          ) : (
                            <span
                              className="expiry-chip"
                              style={{ background: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' }}
                            >
                              <span>ساري بدون تاريخ انتهاء</span>
                            </span>
                          )}
                        </div>

                        <h3>{bundle.name_ar || bundle.name_en}</h3>
                        {bundle.description_ar && <p>{bundle.description_ar}</p>}
                      </div>

                      {/* Financial Box */}
                      <div className="b-financial-box">
                        <div className="fin-col">
                          <span className="lbl">مجموع المنتجات منفردة</span>
                          <span className={`val ${savings > 0 ? 'crossed' : ''}`}>
                            {origTotal.toLocaleString()} ج.م
                          </span>
                        </div>

                        {savings > 0 && (
                          <>
                            <div className="fin-divider" />
                            <div className="fin-col">
                              <span className="lbl">قيمة الخصم (للباندل الكاملة)</span>
                              <span className="val savings">-{savings.toLocaleString()} ج.م</span>
                            </div>
                          </>
                        )}

                        <div className="fin-divider" />
                        <div className="fin-col">
                          <span className="lbl">السعر النهائي للباندل</span>
                          <span className="val final">{finalPrice.toLocaleString()} ج.م</span>
                        </div>
                      </div>
                    </div>

                    {/* Products Strip */}
                    <div className="b-products-strip">
                      <div className="strip-title">
                        <span>
                          المنتجات داخل الباندل ({bundle.items?.length || 0} منتجات — تظهر الباندل في صفحات جميع هذه المنتجات):
                        </span>
                      </div>

                      <div className="strip-grid">
                        {(bundle.items || []).map((item) => {
                          const prod = item.product;
                          if (!prod) return null;
                          const prodUrl = `/pd/${encodeURIComponent(prod.id)}/${encodeURIComponent(prod.slug || prod.id)}`;
                          const sharedCount = productBundleCountMap.get(String(prod.id)) || 1;

                          return (
                            <div className="b-prod-item" key={`${bundle.id}-${prod.id}`}>
                              <div className="bp-right">
                                <img
                                  src={prod.primary_image || '/assets/placeholder-tech.png'}
                                  alt={prod.name_ar || prod.name_en}
                                  onError={(e) => {
                                    e.currentTarget.src = '/assets/placeholder-tech.png';
                                  }}
                                />
                                <div className="bp-meta">
                                  <span className="bp-name" title={prod.name_ar || prod.name_en}>
                                    {prod.name_ar || prod.name_en}
                                  </span>
                                  <span className="bp-sub">
                                    {Number(item.unit_price || 0).toLocaleString()} ج.م
                                    {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                                    {sharedCount > 1 ? ` • مشترك في ${sharedCount} باندلز` : ''}
                                  </span>
                                </div>
                              </div>

                              <Link
                                href={prodUrl}
                                target="_blank"
                                className="bp-preview-link"
                                title="معاينة ظهور الباندل في صفحة هذا المنتج"
                              >
                                <FaUpRightFromSquare size={12} />
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Footer Controls */}
                    <div className="b-card-footer">
                      <div className="stock-note">
                        <FaCircleInfo color="#2563eb" />
                        <span>
                          أقصى كمية متاحة للباندل الكاملة حسب المخزون:{' '}
                          <strong>{bundle.dynamic_available_stock ?? 0} باقة</strong>
                        </span>
                      </div>

                      <div className="action-btns">
                        <button
                          type="button"
                          className={`btn-status-toggle ${bundle.is_active ? 'active' : 'inactive'}`}
                          onClick={() => handleToggleBundleActive(bundle)}
                        >
                          {bundle.is_active ? '● نشطة بالمتجر' : '○ معطلة'}
                        </button>

                        <Link
                          href={`/admin/bundles/edit/${bundle.id}`}
                          className="btn-edit-b"
                        >
                          <FaPenToSquare />
                          <span>تعديل الباندل والمنتجات</span>
                        </Link>

                        <button
                          type="button"
                          className="btn-delete-b"
                          onClick={() => handleDeleteBundle(bundle)}
                          title="حذف الباندل"
                        >
                          <FaTrashCan />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
