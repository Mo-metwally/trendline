'use client';

import React from 'react';
import './AdminStatusBadge.scss';

const STATUS_DICTIONARY = {
  // Order States
  NEW: { labelAr: 'جديد', labelEn: 'New', color: 'status-blue' },
  CONFIRMED: { labelAr: 'مؤكد', labelEn: 'Confirmed', color: 'status-cyan' },
  PROCESSING: { labelAr: 'قيد التجهيز', labelEn: 'Processing', color: 'status-purple' },
  SHIPPED: { labelAr: 'تم الشحن', labelEn: 'Shipped', color: 'status-amber' },
  DELIVERED: { labelAr: 'تم التوصيل', labelEn: 'Delivered', color: 'status-green' },
  CANCELLED: { labelAr: 'ملغي', labelEn: 'Cancelled', color: 'status-red' },
  RETURN_REQUESTED: { labelAr: 'طلب إرجاع', labelEn: 'Return Requested', color: 'status-amber' },
  RETURNED: { labelAr: 'مرتجع', labelEn: 'Returned', color: 'status-gray' },

  // Inventory States
  IN_STOCK: { labelAr: 'متوفر', labelEn: 'In Stock', color: 'status-green' },
  LOW_STOCK: { labelAr: 'مخزون منخفض', labelEn: 'Low Stock', color: 'status-amber' },
  OUT_OF_STOCK: { labelAr: 'نفذ المخزون', labelEn: 'Out of Stock', color: 'status-red' },

  // Transaction States
  CREDIT: { labelAr: 'إيداع / دائن', labelEn: 'Credit', color: 'status-green' },
  DEBIT: { labelAr: 'خصم / مدين', labelEn: 'Debit', color: 'status-red' },

  // Active / Inactive
  ACTIVE: { labelAr: 'نشط', labelEn: 'Active', color: 'status-green' },
  INACTIVE: { labelAr: 'معطل', labelEn: 'Inactive', color: 'status-gray' },
  PENDING: { labelAr: 'قيد الانتظار', labelEn: 'Pending', color: 'status-amber' }
};

export default function AdminStatusBadge({ status, lang = 'ar', customLabel, withDot = true }) {
  if (!status) return null;

  const normalized = String(status).toUpperCase();
  const config = STATUS_DICTIONARY[normalized] || {
    labelAr: status,
    labelEn: status,
    color: 'status-gray'
  };

  const displayText = customLabel || (lang === 'ar' ? config.labelAr : config.labelEn);

  return (
    <span className={`admin-status-badge ${config.color}`}>
      {withDot && <span className="badge-indicator-dot"></span>}
      <span>{displayText}</span>
    </span>
  );
}
