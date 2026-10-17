'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/src/components/common/Navbar/Navbar';
import HeroSlider from '@/src/components/homeComponents/HeroSlider/HeroSlider';
import CategoryGrid from '@/src/components/homeComponents/CategoryGrid/CategoryGrid';
import './Home.scss';

export default function HomePage() {
  const [lang, setLang] = useState('ar');
  const isRtl = lang === 'ar';

  return (
    <div className="home-page-container" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 1. Glassmorphic Storefront Navbar */}
      <Navbar lang={lang} />

      {/* Main Content Flow */}
      <main className="main-home-flow">
        {/* Section 1: Hero Banner Slider (Dynamic from Admin) */}
        <HeroSlider lang={lang} />

        {/* Section 2: Shop by Category (with 4 Latest Products per Category) */}
        <CategoryGrid lang={lang} />

        {/* Trust Badges Strip */}
        <section className="trust-strip-section">
          <div className="trust-container">
            <div className="trust-badge-item">
              <div className="badge-icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
              </div>
              <div className="badge-text-group">
                <span className="badge-title">{isRtl ? 'شحن سريع ومجاني' : 'Fast & Free Delivery'}</span>
                <span className="badge-desc">{isRtl ? 'لجميع الطلبات المؤهلة' : 'On all eligible orders'}</span>
              </div>
            </div>

            <div className="trust-badge-item">
              <div className="badge-icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <div className="badge-text-group">
                <span className="badge-title">{isRtl ? 'ضمان وأصالة 100%' : '100% Genuine Tech'}</span>
                <span className="badge-desc">{isRtl ? 'منتجات أصلية معتمدة' : 'Official brand warranty'}</span>
              </div>
            </div>

            <div className="trust-badge-item">
              <div className="badge-icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10"></polyline>
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                </svg>
              </div>
              <div className="badge-text-group">
                <span className="badge-title">{isRtl ? 'إرجاع سهل خلال 14 يوم' : '14-Day Free Returns'}</span>
                <span className="badge-desc">{isRtl ? 'سياسة استبدال مرنة' : 'Hassle-free refund policy'}</span>
              </div>
            </div>

            <div className="trust-badge-item">
              <div className="badge-icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
              <div className="badge-text-group">
                <span className="badge-title">{isRtl ? 'دعم فني متخصص' : '24/7 Tech Support'}</span>
                <span className="badge-desc">{isRtl ? 'فريق جاهز لخدمتك' : 'Expert advice anytime'}</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Storefront Footer */}
      <footer className="storefront-simple-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <Image
              src="/assets/logo.png"
              alt="Trendline Tech"
              width={140}
              height={40}
              className="footer-logo"
            />
            <span>© 2026 ترندلاين تك - جميع الحقوق محفوظة</span>
          </div>

          <div className="footer-links">
            <Link href="/products">{isRtl ? 'جميع المنتجات' : 'All Products'}</Link>
            <Link href="/categories">{isRtl ? 'الأقسام' : 'Categories'}</Link>
            <Link href="/deals">{isRtl ? 'عروض خاصة' : 'Deals'}</Link>
            <Link href="/track-order">{isRtl ? 'تتبع الطلب' : 'Track Order'}</Link>
            <Link href="/admin/login">{isRtl ? 'بوابة الإدارة ERP' : 'Admin Portal'}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
