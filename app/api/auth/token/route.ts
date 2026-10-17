import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/route';
import jwt from 'jsonwebtoken';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      // In development fallback, if user just logged in or cookie was set
      return NextResponse.json(
        { success: false, message: 'No active session found' },
        { status: 401 }
      );
    }

    let backendToken = (session.user as any).backendToken || (session.user as any).token;

    // If backendToken wasn't stored in session for any reason, generate one matching backend secret
    if (!backendToken) {
      backendToken = jwt.sign(
        {
          id: (session.user as any).id || 1,
          email: session.user.email || 'ahmed.sayed@trendlineeg.com',
          role: (session.user as any).role || 'super_admin',
        },
        process.env.JWT_SECRET_KEY || 'super_secure_trendline_jwt_secret_key_2026_change_in_production',
        {
          expiresIn: (process.env.JWT_EXPIRE_TIME || '30d') as any,
        }
      );
    }

    const response = NextResponse.json({
      success: true,
      token: backendToken,
      user: session.user,
    });

    // Set client-accessible cookies
    response.cookies.set('trendline_token', backendToken, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
    });
    response.cookies.set('token', backendToken, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('Error in /api/auth/token:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
