'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';
import { getApiHost } from '../utils/apiConfig';

const CartContext = createContext(null);

const CART_TOKEN_STORAGE_KEY = 'trendline_cart_token';

// Helper to get cookie
function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

// Helper to set cookie
function setCookie(name, value, days = 30) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function CartProvider({ children }) {
  const toast = useToast();
  const [cartToken, setCartToken] = useState(null);
  const [cart, setCart] = useState({
    id: null,
    items: [],
    items_count: 0,
    subtotal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [mutatingItemId, setMutatingItemId] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Initialize or restore token
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let token = localStorage.getItem(CART_TOKEN_STORAGE_KEY) || getCookie(CART_TOKEN_STORAGE_KEY);
    if (!token) {
      token = 'crt_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      localStorage.setItem(CART_TOKEN_STORAGE_KEY, token);
      setCookie(CART_TOKEN_STORAGE_KEY, token);
    } else {
      // Sync cookie if only in localStorage or vice versa
      localStorage.setItem(CART_TOKEN_STORAGE_KEY, token);
      setCookie(CART_TOKEN_STORAGE_KEY, token);
    }
    setCartToken(token);
  }, []);

  // Fetch cart from server
  const fetchCart = useCallback(async (tokenToUse) => {
    const token = tokenToUse || cartToken;
    if (!token) return;

    try {
      const apiHost = getApiHost();
      const res = await fetch(`${apiHost}/api/v1/cart`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-cart-token': token,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.cart) {
          setCart(data.cart);
          if (data.cart_token && data.cart_token !== token) {
            setCartToken(data.cart_token);
            localStorage.setItem(CART_TOKEN_STORAGE_KEY, data.cart_token);
            setCookie(CART_TOKEN_STORAGE_KEY, data.cart_token);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load server cart:', err);
    } finally {
      setLoading(false);
    }
  }, [cartToken]);

  // Initial fetch once token is ready
  useEffect(() => {
    if (cartToken) {
      fetchCart(cartToken);
    }
  }, [cartToken, fetchCart]);

  // Add Item to Server Cart
  const addToCart = async (productId, quantity = 1, itemType = 'product', options = {}) => {
    const token = cartToken || localStorage.getItem(CART_TOKEN_STORAGE_KEY);
    if (!token) return false;

    setLoading(true);
    try {
      const apiHost = getApiHost();
      const body = {
        cart_token: token,
        item_type: itemType,
        quantity: Math.max(1, quantity),
      };

      if (itemType === 'product') {
        body.product_id = productId;
      } else {
        body.bundle_id = productId;
      }

      const res = await fetch(`${apiHost}/api/v1/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cart-token': token,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCart(data.cart);
        if (data.cart_token) {
          setCartToken(data.cart_token);
          localStorage.setItem(CART_TOKEN_STORAGE_KEY, data.cart_token);
          setCookie(CART_TOKEN_STORAGE_KEY, data.cart_token);
        }

        if (options.silent !== true) {
          toast?.success?.(
            options.lang === 'en'
              ? 'Item added to your cart successfully!'
              : 'تمت إضافة المنتج إلى سلة المشتريات بنجاح!'
          );
        }

        if (options.openDrawer !== false) {
          setIsCartOpen(true);
        }
        return true;
      } else {
        toast?.error?.(data.message || 'عذراً، تعذر إضافة المنتج إلى السلة');
        return false;
      }
    } catch (err) {
      console.error('addToCart error:', err);
      toast?.error?.('حدث خطأ أثناء التواصل مع السيرفر');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update item quantity
  const updateQuantity = async (itemId, quantity) => {
    const token = cartToken || localStorage.getItem(CART_TOKEN_STORAGE_KEY);
    if (!token || !itemId) return false;

    setMutatingItemId(itemId);
    try {
      const apiHost = getApiHost();
      const res = await fetch(`${apiHost}/api/v1/cart/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-cart-token': token,
        },
        body: JSON.stringify({ quantity }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCart(data.cart);
        return true;
      } else {
        toast?.error?.(data.message || 'تعذر تعديل الكمية');
        return false;
      }
    } catch (err) {
      console.error('updateQuantity error:', err);
      return false;
    } finally {
      setMutatingItemId(null);
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId) => {
    const token = cartToken || localStorage.getItem(CART_TOKEN_STORAGE_KEY);
    if (!token || !itemId) return false;

    setMutatingItemId(itemId);
    try {
      const apiHost = getApiHost();
      const res = await fetch(`${apiHost}/api/v1/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-cart-token': token,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCart(data.cart);
        toast?.info?.('تم حذف المنتج من السلة');
        return true;
      } else {
        toast?.error?.(data.message || 'تعذر حذف المنتج');
        return false;
      }
    } catch (err) {
      console.error('removeFromCart error:', err);
      return false;
    } finally {
      setMutatingItemId(null);
    }
  };

  // Clear all items from cart
  const clearCart = async () => {
    const token = cartToken || localStorage.getItem(CART_TOKEN_STORAGE_KEY);
    if (!token) return false;

    setLoading(true);
    try {
      const apiHost = getApiHost();
      const res = await fetch(`${apiHost}/api/v1/cart`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-cart-token': token,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCart({
          id: cart?.id,
          items: [],
          items_count: 0,
          subtotal: 0,
        });
        toast?.info?.('تم إفراغ سلة المشتريات');
        return true;
      }
      return false;
    } catch (err) {
      console.error('clearCart error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  const value = {
    cart,
    cartToken,
    loading,
    mutatingItemId,
    isCartOpen,
    openCart,
    closeCart,
    toggleCart,
    setIsCartOpen,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart: () => fetchCart(cartToken),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
