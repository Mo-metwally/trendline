'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function CategoryShortLinkRedirectContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id ? decodeURIComponent(String(params.id)) : '';
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function resolveCategory() {
      try {
        const res = await fetch(`/api/v1/catalog/categories/${encodeURIComponent(id)}`);
        const json = await res.json();

        if (res.ok && json?.success && json?.data) {
          const cat = json.data;
          const canonicalId = cat.id || id;
          const canonicalSlug = cat.slug || canonicalId;
          const search = typeof window !== 'undefined' ? window.location.search : '';
          router.replace(
            `/categories/${encodeURIComponent(canonicalId)}/${encodeURIComponent(canonicalSlug)}${search}`
          );
        } else if (isMounted) {
          setError(true);
        }
      } catch (err) {
        if (isMounted) setError(true);
      }
    }

    resolveCategory();
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
          textAlign: 'center',
          padding: '24px',
        }}
      >
        <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
          لم يتم العثور على القسم المطلوب
        </h2>
        <Link
          href="/categories"
          style={{
            padding: '12px 24px',
            borderRadius: '12px',
            background: '#1d4ed8',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 800,
          }}
        >
          استعراض جميع الأقسام
        </Link>
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
        gap: '14px',
        background: '#f4f7fb',
        fontFamily: 'var(--font-cairo), sans-serif',
      }}
    >
      <p style={{ fontSize: '16px', fontWeight: 800, color: '#1d4ed8' }}>
        جاري فتح صفحة القسم...
      </p>
    </div>
  );
}

export default function CategoryShortLinkRedirectPage() {
  return (
    <Suspense fallback={<div dir="rtl" style={{ minHeight: '80vh', background: '#f4f7fb' }} />}>
      <CategoryShortLinkRedirectContent />
    </Suspense>
  );
}
