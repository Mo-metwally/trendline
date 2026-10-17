const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AdminUser } = require('../models');
const OtpService = require('../services/otpService');

/**
 * Generate JWT token helper
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET_KEY || 'super_secure_trendline_jwt_secret_key_2026_change_in_production',
    {
      expiresIn: process.env.JWT_EXPIRE_TIME || '30d',
    }
  );
};

class AuthController {
  /**
   * Admin Login
   * POST /api/v1/auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      const admin = await AdminUser.findOne({
        where: { email: email.toLowerCase().trim() },
      });

      if (!admin || !admin.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials or inactive account',
        });
      }

      const isMatch = await bcrypt.compare(password, admin.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Update last login timestamp
      await admin.update({ last_login_at: new Date() });

      const token = generateToken(admin);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: admin.id,
          full_name: admin.full_name,
          email: admin.email,
          role: admin.role,
          preferred_lang: admin.preferred_lang,
          last_login_at: admin.last_login_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * NextAuth Integration Bridge
   * POST /api/v1/auth/nextauth-verify
   * Allows NextAuth Credentials Provider in frontend to authenticate against backend
   */
  static async nextAuthVerify(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Missing credentials' });
      }

      const admin = await AdminUser.findOne({
        where: { email: email.toLowerCase().trim() },
      });

      if (!admin || !admin.is_active) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, admin.password_hash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      await admin.update({ last_login_at: new Date() });
      const token = generateToken(admin);

      return res.status(200).json({
        id: admin.id.toString(),
        name: admin.full_name,
        email: admin.email,
        role: admin.role,
        preferred_lang: admin.preferred_lang,
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Current Authenticated Profile
   * GET /api/v1/auth/me
   */
  static async getProfile(req, res) {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  }

  /**
   * Update Profile Language
   * PUT /api/v1/auth/preferences
   */
  static async updatePreferences(req, res, next) {
    try {
      const { preferred_lang } = req.body;
      if (!['ar', 'en'].includes(preferred_lang)) {
        return res.status(400).json({ success: false, message: 'Language must be "ar" or "en"' });
      }

      await req.user.update({ preferred_lang });

      return res.status(200).json({
        success: true,
        message: 'Preferences updated successfully',
        preferred_lang,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Forgot Password - Send OTP
   * POST /api/v1/auth/forgot-password
   */
  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await OtpService.requestPasswordResetOtp(email);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset Password - Verify OTP & Set Password
   * POST /api/v1/auth/reset-password
   */
  static async resetPassword(req, res, next) {
    try {
      const { email, otp_code, new_password } = req.body;
      const result = await OtpService.verifyOtpAndResetPassword(email, otp_code, new_password);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all admin users (super_admin only)
   * GET /api/v1/auth/admins
   */
  static async listAdmins(req, res, next) {
    try {
      const admins = await AdminUser.findAll({
        attributes: ['id', 'full_name', 'email', 'role', 'preferred_lang', 'is_active', 'last_login_at', 'created_at'],
        order: [['created_at', 'DESC']],
      });
      return res.status(200).json({ success: true, count: admins.length, data: admins });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new admin user (super_admin only)
   * POST /api/v1/auth/admins
   */
  static async createAdmin(req, res, next) {
    try {
      const { full_name, email, password, role, preferred_lang } = req.body;

      if (!full_name || !email || !password || !role) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
      }

      const existing = await AdminUser.findOne({ where: { email: email.toLowerCase().trim() } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const newAdmin = await AdminUser.create({
        full_name,
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        role,
        preferred_lang: preferred_lang || 'ar',
        is_active: true,
      });

      return res.status(201).json({
        success: true,
        message: 'Admin account created successfully',
        user: {
          id: newAdmin.id,
          full_name: newAdmin.full_name,
          email: newAdmin.email,
          role: newAdmin.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
