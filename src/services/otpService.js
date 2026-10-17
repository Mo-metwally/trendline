const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { AdminUser, AdminOtp } = require('../models');
const EmailService = require('./emailService');

class OtpService {
  /**
   * Request password reset OTP for an admin user.
   * @param {string} email 
   * @returns {Promise<{success: boolean, message: string}>}
   */
  static async requestPasswordResetOtp(email) {
    if (!email) {
      throw new Error('Email is required');
    }

    const admin = await AdminUser.findOne({
      where: {
        email: email.toLowerCase().trim(),
        is_active: true,
      },
    });

    if (!admin) {
      // Return ambiguous message for security to avoid email enumeration
      return { success: true, message: 'If this email is registered, an OTP code has been dispatched.' };
    }

    // Invalidate existing active OTPs for this admin
    await AdminOtp.update(
      { is_used: true },
      {
        where: {
          admin_id: admin.id,
          is_used: false,
        },
      }
    );

    // Generate random 6-digit numeric OTP
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    await AdminOtp.create({
      admin_id: admin.id,
      otp_hash: otpHash,
      expires_at: expiresAt,
      attempts: 0,
      is_used: false,
    });

    // Send email via Zoho SMTP
    await EmailService.sendOtpEmail(admin.email, rawOtp, admin.full_name);

    return {
      success: true,
      message: 'If this email is registered, an OTP code has been dispatched.',
    };
  }

  /**
   * Verify OTP and reset password.
   * @param {string} email 
   * @param {string} otpCode 
   * @param {string} newPassword 
   */
  static async verifyOtpAndResetPassword(email, otpCode, newPassword) {
    if (!email || !otpCode || !newPassword) {
      throw new Error('Email, OTP code, and new password are required');
    }

    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const admin = await AdminUser.findOne({
      where: {
        email: email.toLowerCase().trim(),
        is_active: true,
      },
    });

    if (!admin) {
      throw new Error('Invalid request or expired OTP');
    }

    // Find the latest active OTP
    const otpRecord = await AdminOtp.findOne({
      where: {
        admin_id: admin.id,
        is_used: false,
        expires_at: {
          [Op.gt]: new Date(),
        },
      },
      order: [['created_at', 'DESC']],
    });

    if (!otpRecord) {
      throw new Error('No active OTP found or code has expired. Please request a new code.');
    }

    if (otpRecord.attempts >= 3) {
      await otpRecord.update({ is_used: true });
      throw new Error('Maximum verification attempts exceeded. Please request a new OTP code.');
    }

    const isMatch = await bcrypt.compare(otpCode.toString().trim(), otpRecord.otp_hash);

    if (!isMatch) {
      await otpRecord.increment('attempts', { by: 1 });
      const remainingAttempts = 3 - (otpRecord.attempts + 1);
      throw new Error(`Invalid OTP code. ${remainingAttempts > 0 ? `${remainingAttempts} attempt(s) remaining.` : 'Code locked.'}`);
    }

    // OTP is valid -> Hash new password and update user
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await admin.update({ password_hash: newPasswordHash });

    // Mark OTP as used
    await otpRecord.update({ is_used: true });

    return {
      success: true,
      message: 'Password has been reset successfully. You may now log in with your new password.',
    };
  }
}

module.exports = OtpService;
