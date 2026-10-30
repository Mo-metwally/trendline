'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ProductShortLinkRedirectContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id ? decodeURIComponent(String(params.id)) : '';
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function resolveAndRedirect() {
      try {
        const res = await fetch(`/api/v1/catalog/products/${encodeURIComponent(id)}`);
        const json = await res.json();

        if (res.ok && json?.success && json?.data) {
          const product = json.data;
          const canonicalId = product.id || id;
          const canonicalSlug =
            product.slug ||
            (product.name_en || product.name_ar || canonicalId)
              .toString()
              .trim()
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9\u0600-\u06FF-_]/g, '') ||
            canonicalId;

          const search = typeof window !== 'undefined' ? window.location.search : '';
          router.replace(`/pd/${encodeURIComponent(canonicalId)}/${encodeURIComponent(canonicalSlug)}${search}`);
        } else if (isMounted) {
          setError(true);
        }
      } catch (err) {
        if (isMounted) setError(true);
      }
    }

    resolveAndRedirect();
    return () => {
      isMounted = false;
    };
  }, [id, router]);

  if (error) {
    return (
      <div
        dir="rtl"
        style={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          background: '#f4f7fb',
          fontFamily: 'var(--font-cairo), sans-serif',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            fontWeight: 800,
          }}
        >
          !
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
          عذراً، لم يتم العثور على هذا المنتج
        </h1>
        <p style={{ fontSize: '15px', color: '#64748b', maxWidth: '420px', margin: 0 }}>
          الرابط القصير <code>/pd/{id}</code> غير مرتبط بمنتج متاح حالياً أو ربما تم نقله.
        </p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <Link
            href="/categories"
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              background: '#1e40af',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            تصفح الأقسام والمنتجات
          </Link>
          <Link
            href="/"
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              background: '#fff',
              color: '#1e293b',
              border: '1px solid #cbd5e1',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        background: '#f4f7fb',
        fontFamily: 'var(--font-cairo), sans-serif',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: '4px solid #dbeafe',
          borderTopColor: '#1d4ed8',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p style={{ fontSize: '16px', fontWeight: 700, color: '#1e3a8a', margin: 0 }}>
        جاري تحويل الرابط القصير إلى صفحة المنتج الكاملة...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function ProductShortLinkRedirectPage() {
  return (
    <Suspense fallback={<div dir="rtl" style={{ minHeight: '80vh', background: '#f4f7fb' }} />}>
      <ProductShortLinkRedirectContent />
    </Suspense>
  );
}
