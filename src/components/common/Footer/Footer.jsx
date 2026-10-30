'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer({ lang = 'ar' }) {
  const isRtl = lang === 'ar';

  return (
    <footer
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        background: '#0f172a',
        color: '#cbd5e1',
        marginTop: '64px',
        padding: '32px 20px',
        borderTop: '1px solid #1e293b',
        fontFamily: 'var(--font-cairo), sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '1320px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <Image
              src="/assets/logo.png"
              alt="Trendline Tech"
              width={140}
              height={40}
              style={{ objectFit: 'contain' }}
            />
          </Link>
          <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#94a3b8' }}>
            © 2026 ترندلاين تك - جميع الحقوق محفوظة
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <Link
            href="/"
            style={{ color: '#e2e8f0', textDecoration: 'none', fontSize: '14px', fontWeight: 700 }}
          >
            {isRtl ? 'الرئيسية' : 'Home'}
          </Link>
          <Link
            href="/categories"
            style={{ color: '#e2e8f0', textDecoration: 'none', fontSize: '14px', fontWeight: 700 }}
          >
            {isRtl ? 'جميع الأقسام' : 'Categories'}
          </Link>
          <Link
            href="/deals"
            style={{ color: '#e2e8f0', textDecoration: 'none', fontSize: '14px', fontWeight: 700 }}
          >
            {isRtl ? 'عروض خاصة' : 'Special Deals'}
          </Link>
          <Link
            href="/track-order"
            style={{ color: '#e2e8f0', textDecoration: 'none', fontSize: '14px', fontWeight: 700 }}
          >
            {isRtl ? 'تتبع الطلب' : 'Track Order'}
          </Link>
          <Link
            href="/admin/login"
            style={{ color: '#93c5fd', textDecoration: 'none', fontSize: '14px', fontWeight: 800 }}
          >
            {isRtl ? 'بوابة الإدارة ERP' : 'Admin Portal'}
          </Link>
        </div>
      </div>
    </footer>
  );
}
