const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.zoho.com',
  port: parseInt(process.env.EMAIL_PORT, 10) || 465,
  secure: parseInt(process.env.EMAIL_PORT, 10) === 465,
  auth: {
    user: process.env.USER_EMAIL || 'trendLine@trenline.com',
    pass: process.env.USER_PASSWORD || '',
  },
});

class EmailService {
  /**
   * Send an OTP email to an admin user for password recovery.
   * @param {string} toEmail 
   * @param {string} otpCode 
   * @param {string} adminName 
   */
  static async sendOtpEmail(toEmail, otpCode, adminName = 'Admin') {
    const mailOptions = {
      from: `"Trendline Tech Security" <${process.env.USER_EMAIL}>`,
      to: toEmail,
      subject: ' رمز التحقق لاستعادة كلمة المرور - ترندلاين تك | Trendline Tech OTP',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #f7f9fc; padding: 30px; color: #222;">
          <div style="max-width: 550px; margin: auto; background: #ffffff; border-radius: 12px; padding: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border-top: 5px solid #0057C2;">
            <h2 style="color: #0057C2; margin-top: 0;">مرحباً ${adminName}،</h2>
            <p style="font-size: 15px; line-height: 1.6;">تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في لوحة تحكم <strong>Trendline Tech</strong>.</p>
            <p style="font-size: 14px; color: #555;">استخدم الرمز التالي لإتمام عملية التعيين (صالح لمدة 10 دقائق):</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0057C2; background-color: #DFE3EE; padding: 12px 28px; border-radius: 8px;">
                ${otpCode}
              </span>
            </div>
            <p style="font-size: 13px; color: #777;">إذا لم تقم بطلب إعادة التعيين، يُرجى تجاهل هذا البريد الإلكتروني أو إبلاغ مسؤول الأمان فوراً.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;" />
            <p style="font-size: 12px; color: #999; text-align: center;">Trendline Tech ERP & E-Commerce &copy; 2026. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(` OTP email sent to ${toEmail}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(` Failed to send OTP email to ${toEmail}:`, error.message);
      // In development, log the OTP for testing if SMTP is unavailable or credentials are placeholders
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV OTP FALLBACK] OTP Code for ${toEmail} is: ${otpCode}`);
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify SMTP connection status.
   */
  static async verifyConnection() {
    try {
      await transporter.verify();
      console.log(' Zoho SMTP server connection established successfully.');
      return true;
    } catch (error) {
      console.warn('️ Zoho SMTP connection warning (check credentials):', error.message);
      return false;
    }
  }
}

module.exports = EmailService;
