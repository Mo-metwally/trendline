'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { getApiHost } from '@/src/utils/apiConfig';
import './Login.scss';

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [lang, setLang] = useState('ar'); // 'ar' | 'en'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Dual language strings
  const t = {
    ar: {
      badge: 'لوحة التحكم والـ ERP',
      brandTitle: 'ترندلاين تك',
      brandSubtitle: 'تسجيل دخول الإدارة والمستودعات',
      emailLabel: 'البريد الإلكتروني',
      emailPlaceholder: 'name@trendlineeg.com',
      passwordLabel: 'كلمة المرور',
      passwordPlaceholder: '••••••••••••',
      rememberMe: 'تذكر تسجيل دخولي',
      forgotPassword: 'نسيت كلمة المرور؟',
      signInBtn: 'تسجيل الدخول',
      signingIn: 'جارٍ التحقق...',
      loginSuccess: 'تم تسجيل الدخول بنجاح! جارٍ تحويلك إلى لوحة الإدارة...',
      loginFailed: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
      securityNotice: 'تسجيل دخول مشفر ومحمي بروتوكول TLS 1.3 & JWT',
      switchLang: 'English',
    },
    en: {
      badge: 'ERP & Admin Portal',
      brandTitle: 'Trendline Tech',
      brandSubtitle: 'Admin & Warehouse Management Portal',
      emailLabel: 'Email Address',
      emailPlaceholder: 'name@trendlineeg.com',
      passwordLabel: 'Password',
      passwordPlaceholder: '••••••••••••',
      rememberMe: 'Remember my session',
      forgotPassword: 'Forgot Password?',
      signInBtn: 'Sign In',
      signingIn: 'Authenticating...',
      loginSuccess: 'Login successful! Redirecting to admin dashboard...',
      loginFailed: 'Invalid email address or password.',
      securityNotice: 'Encrypted & Secured with TLS 1.3 & JWT Protocols',
      switchLang: 'عربي',
    },
  }[lang];

  // Reverse Protection: If already logged in, redirect to /admin
  useEffect(() => {
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('token='))
      ?.split('=')[1];

    if (status === 'authenticated' || token || localStorage.getItem('trendline_admin_token')) {
      router.replace('/admin');
    } else {
      setCheckingAuth(false);
    }
  }, [status, router]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      // 1. Authenticate with NextAuth Credentials Provider
      const result = await signIn('credentials', {
        redirect: false,
        email: email.trim(),
        password: password,
      });

      if (result?.error) {
        setErrorMessage(t.loginFailed);
        setLoading(false);
        return;
      }

      // 2. Obtain backend JWT token and set authentication cookie
      try {
        const apiHost = getApiHost();
        const backendRes = await fetch(`${apiHost}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const backendData = await backendRes.json();
        if (backendData.token) {
          localStorage.setItem('trendline_admin_token', backendData.token);
          localStorage.setItem('trendline_admin_user', JSON.stringify(backendData.user));
          // Set cookie for middleware access
          document.cookie = `token=${backendData.token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
          document.cookie = `trendline_token=${backendData.token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
        }
      } catch (err) {
        console.warn('Backend direct token sync warning:', err);
      }

      setSuccessMessage(t.loginSuccess);

      // 3. Redirect to /admin
      setTimeout(() => {
        router.replace('/admin');
      }, 700);
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage(t.loginFailed);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="login-container">
        <div className="ambient-orb orb-1" />
        <div className="glass-login-card" style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--main-color)', fontWeight: 700 }}>جارٍ التحقق من الجلسة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Background Animated Ambient Orbs */}
      <div className="ambient-orb orb-1" />
      <div className="ambient-orb orb-2" />
      <div className="ambient-orb orb-3" />

      {/* Glassmorphism Card */}
      <div className="glass-login-card">
        {/* Top Control Bar */}
        <div className="card-top-bar">
          <div className="badge-system">
            <span className="status-dot" />
            {t.badge}
          </div>
          <button
            type="button"
            className="lang-switcher-btn"
            onClick={toggleLanguage}
            title="Switch Language"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            {t.switchLang}
          </button>
        </div>

        {/* Brand Header */}
        <div className="brand-header">
          <div className="logo-icon-wrap">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
          <h1 className="title">{t.brandTitle}</h1>
          <p className="subtitle">{t.brandSubtitle}</p>
        </div>

        {/* Alert Notifications */}
        {errorMessage && (
          <div className="alert-banner alert-error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="alert-banner alert-success">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className={`login-form dir-${lang === 'ar' ? 'rtl' : 'ltr'}`}>
          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              {t.emailLabel}
            </label>
            <div className="input-wrapper">
              <span className="field-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              {t.passwordLabel}
            </label>
            <div className="input-wrapper">
              <span className="field-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-pwd-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Form Actions Row */}
          <div className="form-actions-row">
            <label className="remember-checkbox">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>{t.rememberMe}</span>
            </label>
            <a
              href="#forgot-password"
              className="forgot-link"
              onClick={(e) => {
                e.preventDefault();
                alert(lang === 'ar' ? 'يُرجى إدخال البريد الإلكتروني لاستلام رمز الـ OTP لإعادة تعيين كلمة المرور.' : 'Please enter your email to receive a 6-digit password reset OTP.');
              }}
            >
              {t.forgotPassword}
            </a>
          </div>

          {/* Submit Button */}
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" />
                <span>{t.signingIn}</span>
              </>
            ) : (
              <>
                <span>{t.signInBtn}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  {lang === 'ar' ? (
                    <line x1="19" y1="12" x2="5" y2="12" />
                  ) : (
                    <line x1="5" y1="12" x2="19" y2="12" />
                  )}
                  {lang === 'ar' ? (
                    <polyline points="12 19 5 12 12 5" />
                  ) : (
                    <polyline points="12 5 19 12 12 19" />
                  )}
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Security Footer Seal */}
        <div className="card-footer-security">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>{t.securityNotice}</span>
        </div>
      </div>
    </div>
  );
}
