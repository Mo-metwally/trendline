import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Trendline Tech | ترندلاين تك للأجهزة والحلول التقنية',
  description: 'Enterprise E-Commerce Platform & Built-in ERP System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // 1. Intercept and ignore errors from third-party browser extensions
                  // (e.g. chrome-extension://... executors/200.js) so they don't break Next.js dev overlay
                  if (typeof window !== 'undefined') {
                    window.addEventListener('error', function(event) {
                      var src = (event && (event.filename || (event.error && event.error.stack))) || '';
                      if (
                        src.indexOf('chrome-extension://') !== -1 ||
                        src.indexOf('moz-extension://') !== -1 ||
                        src.indexOf('safari-extension://') !== -1
                      ) {
                        event.stopImmediatePropagation();
                        event.preventDefault();
                        return true;
                      }
                    }, true);

                    window.addEventListener('unhandledrejection', function(event) {
                      var reason = event && event.reason;
                      var stack = (reason && (reason.stack || reason.message)) || '';
                      if (
                        stack.indexOf('chrome-extension://') !== -1 ||
                        stack.indexOf('moz-extension://') !== -1 ||
                        stack.indexOf('safari-extension://') !== -1
                      ) {
                        event.stopImmediatePropagation();
                        event.preventDefault();
                      }
                    }, true);
                  }

                  // 2. Intercept setAttribute to stop extensions like Bitdefender (bis_skin_checked)
                  // from causing React hydration mismatches
                  var originalSetAttribute = Element.prototype.setAttribute;
                  Element.prototype.setAttribute = function(name, value) {
                    if (name && typeof name === 'string' && name.indexOf('bis_') === 0) {
                      return;
                    }
                    return originalSetAttribute.apply(this, arguments);
                  };

                  var cleanExtAttrs = function() {
                    var els = document.querySelectorAll('[bis_skin_checked],[bis_register],[bis_size]');
                    for (var i = 0; i < els.length; i++) {
                      els[i].removeAttribute('bis_skin_checked');
                      els[i].removeAttribute('bis_register');
                      els[i].removeAttribute('bis_size');
                    }
                  };
                  cleanExtAttrs();
                  if (typeof document !== 'undefined') {
                    document.addEventListener('DOMContentLoaded', cleanExtAttrs);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
