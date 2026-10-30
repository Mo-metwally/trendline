'use client';

import React, { useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';

function LegacyProductRedirectContent() {
  const params = useParams();
  const router = useRouter();
  const identifier = params?.identifier ? decodeURIComponent(String(params.identifier)) : '';

  useEffect(() => {
    if (!identifier) {
      router.replace('/categories');
      return;
    }

    async function resolveLegacyProduct() {
      try {
        const res = await fetch(`/api/v1/catalog/products/${encodeURIComponent(identifier)}`);
        const json = await res.json();
        const search = typeof window !== 'undefined' ? window.location.search : '';
        if (res.ok && json?.success && json?.data) {
          const prod = json.data;
          router.replace(
            `/pd/${encodeURIComponent(prod.id)}/${encodeURIComponent(prod.slug || prod.id)}${search}`
          );
          return;
        }
      } catch (err) {
        // fallback below
      }
      const search = typeof window !== 'undefined' ? window.location.search : '';
      router.replace(`/pd/${encodeURIComponent(identifier)}${search}`);
    }

    resolveLegacyProduct();
  }, [identifier, router]);

  return null;
}

export default function LegacyProductRedirectPage() {
  return (
    <Suspense fallback={null}>
      <LegacyProductRedirectContent />
    </Suspense>
  );
}
