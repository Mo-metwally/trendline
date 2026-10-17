import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Trendline Admin Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'admin@trendlineeg.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const candidateUrls = [
          process.env.INTERNAL_API_URL,
          'http://127.0.0.1:5000',
          'http://localhost:5000',
          process.env.BASE_URL,
        ].filter(Boolean) as string[];

        // Remove duplicates
        const uniqueUrls = Array.from(new Set(candidateUrls));

        for (const baseUrl of uniqueUrls) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const res = await fetch(`${baseUrl}/api/v1/auth/nextauth-verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: credentials.email.trim(),
                password: credentials.password,
              }),
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              console.warn(`Auth failed on ${baseUrl}:`, errData);
              return null;
            }

            const user = await res.json();
            if (user && user.id) {
              return user;
            }
          } catch (error: any) {
            console.warn(`Attempt to authenticate via ${baseUrl} failed:`, error?.message || error);
            // Continue to next candidate URL
          }
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.preferred_lang = (user as any).preferred_lang;
        token.backendToken = (user as any).token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).preferred_lang = token.preferred_lang;
        (session.user as any).backendToken = token.backendToken;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'super_secure_nextauth_secret_key_2026',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
