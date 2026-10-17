'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  AdminSidebar,
  AdminHeader,
  AdminStatsCard,
  AdminDataTable,
  AdminStatusBadge,
  AdminModal
} from '@/src/components/adminComponents';
import { FaHand } from 'react-icons/fa6';
import './Admin.scss';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lang, setLang] = useState('ar');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const isRtl = lang === 'ar';

  useEffect(() => {
    const hasTokenCookie = document.cookie
      .split('; ')
      .some((row) => row.startsWith('trendline_token=') || row.startsWith('token=') || row.startsWith('next-auth.session-token='));

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
    } else {
      setAdminUser({
        name: 'Ahmed Sayed',
        email: 'ahmed.sayed@trendlineeg.com',
        role: 'SUPER_ADMIN'
      });
    }

    setLoading(false);
  }, [session, status, router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
        <p style={{ color: 'var(--main-color)', fontWeight: 800, fontSize: 18 }}>
          {isRtl ? 'جارٍ التحقق من الجلسة وتحميل لوحة الإدارة...' : 'Verifying session & loading dashboard...'}
        </p>
      </div>
    );
  }

  // Sample data demonstrating the ERP tables and status badges
  const sampleOrders = [
    {
      id: 'ORD-98214',
      customerName: 'محمد أحمد الشناوي',
      governorate: 'القاهرة - المعادي',
      totalAmount: '1,450.00 EGP',
      paymentMethod: 'الدفع عند الاستلام (COD)',
      status: 'CONFIRMED',
      date: '15 أكتوبر 2026'
    },
    {
      id: 'ORD-98215',
      customerName: 'سارة طارق إبراهيم',
      governorate: 'الإسكندرية - سموحة',
      totalAmount: '3,890.00 EGP',
      paymentMethod: 'بطاقة ائتمانية (Visa)',
      status: 'PROCESSING',
      date: '15 أكتوبر 2026'
    },
    {
      id: 'ORD-98216',
      customerName: 'كريم محمود يوسف',
      governorate: 'الجيزة - الدقي',
      totalAmount: '850.00 EGP',
      paymentMethod: 'الدفع عند الاستلام (COD)',
      status: 'SHIPPED',
      date: '14 أكتوبر 2026'
    },
    {
      id: 'ORD-98217',
      customerName: 'منى عبد الرحمن حسن',
      governorate: 'المنصورة - الدقهلية',
      totalAmount: '2,150.00 EGP',
      paymentMethod: 'فودافون كاش',
      status: 'DELIVERED',
      date: '13 أكتوبر 2026'
    },
    {
      id: 'ORD-98218',
      customerName: 'عمر خالد الصاوي',
      governorate: 'طنطا - الغربية',
      totalAmount: '620.00 EGP',
      paymentMethod: 'الدفع عند الاستلام (COD)',
      status: 'RETURN_REQUESTED',
      date: '12 أكتوبر 2026'
    }
  ];

  const orderColumns = [
    {
      key: 'id',
      label: isRtl ? 'رقم الطلب' : 'Order ID',
      render: (val) => <strong style={{ color: 'var(--main-color)', fontWeight: 800 }}>{val}</strong>
    },
    {
      key: 'customerName',
      label: isRtl ? 'اسم العميل' : 'Customer',
      render: (val) => <span>{val}</span>
    },
    {
      key: 'governorate',
      label: isRtl ? 'المحافظة / العنوان' : 'Location'
    },
    {
      key: 'totalAmount',
      label: isRtl ? 'القيمة الإجمالية' : 'Total',
      render: (val) => <span style={{ fontWeight: 800 }}>{val}</span>
    },
    {
      key: 'status',
      label: isRtl ? 'حالة الطلب' : 'Status',
      render: (status) => <AdminStatusBadge status={status} lang={lang} />
    },
    {
      key: 'date',
      label: isRtl ? 'تاريخ الإنشاء' : 'Date'
    },
    {
      key: 'actions',
      label: isRtl ? 'الإجراءات' : 'Actions',
      render: (_, row) => (
        <button
          type="button"
          onClick={() => setSelectedOrder(row)}
          style={{
            background: 'rgba(0, 87, 194, 0.08)',
            border: '1px solid rgba(0, 87, 194, 0.2)',
            color: 'var(--main-color)',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          {isRtl ? 'عرض التفاصيل' : 'View Details'}
        </button>
      )
    }
  ];

  const todayFormatted = isRtl
    ? new Intl.DateTimeFormat('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())
    : new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

  return (
    <div className="admin-portal-container" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 1. Modular Admin Sidebar */}
      <AdminSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        lang={lang}
      />

      {/* Main Column */}
      <div className="admin-main-wrapper">
        {/* 2. Modular Admin Header */}
        <AdminHeader
          adminUser={adminUser}
          lang={lang}
          onToggleLanguage={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          isSidebarCollapsed={sidebarCollapsed}
          notificationCount={4}
        />

        {/* Dashboard Body */}
        <main className="admin-dashboard-body">
          {/* Welcome Banner with Today's Live Pulse */}
          <div className="admin-welcome-banner">
            <div className="banner-top-row">
              <div className="banner-greeting-box">
                <div className="greeting-header-line">
                  <h1>
                    {isRtl
                      ? `أهلاً بك، ${adminUser?.name || 'Ahmed Sayed'}`
                      : `Welcome back, ${adminUser?.name || 'Ahmed Sayed'}`}{' '}
                    <FaHand style={{ color: '#f59e0b', fontSize: '20px', display: 'inline-block', transform: 'rotate(15deg)' }} />
                  </h1>
                  <span className="today-date-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>{todayFormatted}</span>
                  </span>
                </div>
                <p>
                  {isRtl
                    ? 'نظرة لحظية على أداء المتجر والمستودع اليوم — تدفق الطلبات، المعاملات المالية، والمخزون المباشر.'
                    : 'Realtime snapshot of today’s store & warehouse performance — orders flow, revenue, and WMS fulfillment.'}
                </p>
              </div>

              <div className="banner-status-tag">
                <span className="pulse-dot"></span>
                <span>{isRtl ? 'الـ ERP متصل ونشط لحظياً' : 'ERP Realtime Sync Active'}</span>
              </div>
            </div>

            {/* Today's Data Metrics Grid */}
            <div className="banner-today-metrics-grid">
              <div className="today-metric-tile">
                <div className="tile-head">
                  <span className="tile-title">{isRtl ? 'مبيعات اليوم' : "Today's Revenue"}</span>
                  <div className="tile-icon-box">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <line x1="12" y1="1" x2="12" y2="23"></line>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                  </div>
                </div>
                <div className="tile-main-value">48,250 EGP</div>
                <div className="tile-sub-note">
                  <span className="trend-indicator">+14.8%</span>
                  <span>{isRtl ? 'مقارنة بأمس' : 'vs yesterday'}</span>
                </div>
              </div>

              <div className="today-metric-tile">
                <div className="tile-head">
                  <span className="tile-title">{isRtl ? 'طلبات اليوم' : "Today's Orders"}</span>
                  <div className="tile-icon-box">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <circle cx="9" cy="21" r="1"></circle>
                      <circle cx="20" cy="21" r="1"></circle>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                  </div>
                </div>
                <div className="tile-main-value">{isRtl ? '38 طلب' : '38 Orders'}</div>
                <div className="tile-sub-note">
                  <span className="trend-indicator">+6 طلبات</span>
                  <span>{isRtl ? 'منها 32 مؤكد' : '32 confirmed'}</span>
                </div>
              </div>

              <div className="today-metric-tile">
                <div className="tile-head">
                  <span className="tile-title">{isRtl ? 'قيد التجهيز والشحن' : 'Pending Fulfillment'}</span>
                  <div className="tile-icon-box">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                      <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                  </div>
                </div>
                <div className="tile-main-value">{isRtl ? '12 شحنة' : '12 Shipments'}</div>
                <div className="tile-sub-note">
                  <span>{isRtl ? 'جاهزة للتسليم للمناديب' : 'Ready for courier dispatch'}</span>
                </div>
              </div>

              <div className="today-metric-tile">
                <div className="tile-head">
                  <span className="tile-title">{isRtl ? 'متوسط قيمة الطلب' : 'Avg Order Value'}</span>
                  <div className="tile-icon-box">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                  </div>
                </div>
                <div className="tile-main-value">1,270 EGP</div>
                <div className="tile-sub-note">
                  <span className="trend-indicator">+3.5%</span>
                  <span>{isRtl ? 'زيادة سلة الشراء' : 'cart value growth'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Modular KPI Stats Cards */}
          <div className="admin-kpi-grid">
            <AdminStatsCard
              title={isRtl ? 'إجمالي المبيعات' : 'Total Sales'}
              value="184,950 EGP"
              trend="+18.4%"
              trendDirection="up"
              trendLabel={isRtl ? 'مقارنة بالشهر الماضي' : 'vs last month'}
              colorScheme="primary"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              }
            />

            <AdminStatsCard
              title={isRtl ? 'الطلبات المسجلة' : 'Total Orders'}
              value="1,248"
              trend="+7.2%"
              trendDirection="up"
              trendLabel={isRtl ? '34 طلب اليوم' : '34 orders today'}
              colorScheme="success"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
              }
            />

            <AdminStatsCard
              title={isRtl ? 'منتجات أوشكت على النفاد' : 'Low Stock Items'}
              value="12 منتج"
              trend="-2"
              trendDirection="down"
              trendLabel={isRtl ? 'تنبيه مخزون WMS' : 'WMS low stock alert'}
              colorScheme="warning"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              }
            />

            <AdminStatsCard
              title={isRtl ? 'طلبات الاسترجاع (RMA)' : 'Return Requests'}
              value="3 طلبات"
              trend="جديد"
              trendDirection="neutral"
              trendLabel={isRtl ? 'تحت الفحص والمراجعة' : 'Under inspection'}
              colorScheme="purple"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10"></polyline>
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                </svg>
              }
            />
          </div>

          {/* Quick ERP Actions */}
          <section>
            <div className="admin-section-heading">
              <h3>{isRtl ? 'الإجراءات السريعة في النظام' : 'Quick Actions'}</h3>
              <span>{isRtl ? 'وصول مباشر لعمليات ERP' : 'Direct access to ERP functions'}</span>
            </div>

            <div className="admin-actions-grid">
              <div className="action-tile-btn">
                <div className="tile-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </div>
                <span>{isRtl ? 'إضافة منتج جديد' : 'Add Product'}</span>
              </div>

              <div className="action-tile-btn">
                <div className="tile-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                </div>
                <span>{isRtl ? 'أمر توريد وشراء' : 'Purchase Order'}</span>
              </div>

              <div className="action-tile-btn">
                <div className="tile-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <polyline points="21 8 21 21 3 21 3 8"></polyline>
                    <rect x="1" y="3" width="22" height="5"></rect>
                    <line x1="10" y1="12" x2="14" y2="12"></line>
                  </svg>
                </div>
                <span>{isRtl ? 'إنشاء باقة توفير' : 'New Bundle'}</span>
              </div>

              <div className="action-tile-btn">
                <div className="tile-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <span>{isRtl ? 'تسوية مالية' : 'Financial Entry'}</span>
              </div>
            </div>
          </section>

          {/* 4. Modular Admin Data Table */}
          <section>
            <AdminDataTable
              title={isRtl ? 'أحدث طلبات المتجر والمستودع' : 'Recent Store & Warehouse Orders'}
              columns={orderColumns}
              data={sampleOrders}
              searchPlaceholder={isRtl ? 'بحث برقم الطلب، اسم العميل أو المحافظة...' : 'Search by ID, customer or city...'}
              searchKeys={['id', 'customerName', 'governorate', 'status']}
              lang={lang}
              itemsPerPage={5}
              primaryAction={{
                label: isRtl ? 'تصدير الطلبات (Excel)' : 'Export Orders',
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                ),
                onClick: () => alert(isRtl ? 'جارٍ تصدير الطلبات...' : 'Exporting orders...')
              }}
            />
          </section>
        </main>
      </div>

      {/* 5. Modular Admin Modal for Order Details */}
      <AdminModal
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={isRtl ? `تفاصيل الطلب: ${selectedOrder?.id}` : `Order Details: ${selectedOrder?.id}`}
        footer={
          <button
            type="button"
            onClick={() => setSelectedOrder(null)}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              background: 'var(--main-color)',
              color: '#fff',
              border: 'none',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            {isRtl ? 'إغلاق' : 'Close'}
          </button>
        }
      >
        {selectedOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--sec-color)', paddingBottom: '10px' }}>
              <span>{isRtl ? 'اسم العميل:' : 'Customer Name:'}</span>
              <strong>{selectedOrder.customerName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--sec-color)', paddingBottom: '10px' }}>
              <span>{isRtl ? 'العنوان / المحافظة:' : 'Location:'}</span>
              <strong>{selectedOrder.governorate}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--sec-color)', paddingBottom: '10px' }}>
              <span>{isRtl ? 'طريقة الدفع:' : 'Payment Method:'}</span>
              <strong>{selectedOrder.paymentMethod}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--sec-color)', paddingBottom: '10px' }}>
              <span>{isRtl ? 'حالة الطلب:' : 'Order Status:'}</span>
              <AdminStatusBadge status={selectedOrder.status} lang={lang} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px' }}>
              <span>{isRtl ? 'المبلغ الإجمالي:' : 'Total Amount:'}</span>
              <strong style={{ fontSize: '18px', color: 'var(--main-color)' }}>{selectedOrder.totalAmount}</strong>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
