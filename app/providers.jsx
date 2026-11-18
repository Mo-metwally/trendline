'use client';

import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '@/src/context/ToastContext';
import { CartProvider } from '@/src/context/CartContext';
import { CartDrawer } from '@/src/components/common';

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
