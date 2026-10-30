'use client';

import React, { Suspense } from 'react';
import { useParams } from 'next/navigation';
import BundleStudio from '../../_components/BundleStudio';

function EditBundleContent() {
  const params = useParams();
  const id = params?.id;
  return <BundleStudio isEditMode={true} bundleId={id} />;
}

export default function EditBundlePage() {
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
            fontFamily: 'inherit',
            fontSize: '15px',
            color: '#64748b',
          }}
        >
          جاري تحميل استوديو تعديل الباندل...
        </div>
      }
    >
      <EditBundleContent />
    </Suspense>
  );
}
