const jwt = require('jsonwebtoken');
const { AdminUser } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check Authorization Bearer header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // 2. Fallback to raw Cookie header if Authorization header is missing
    if ((!token || token === 'undefined' || token === 'null') && req.headers.cookie) {
      const match = req.headers.cookie.match(/(?:^|;\s*)(?:token|trendline_token)=([^;]+)/);
      if (match) {
        token = decodeURIComponent(match[1]);
      }
    }

    // 3. Fallback to parsed req.cookies if available
    if ((!token || token === 'undefined' || token === 'null') && req.cookies) {
      token = req.cookies.token || req.cookies.trendline_token;
    }

    // Clean quotes or spaces if any
    if (token) {
      token = token.replace(/^["']|["']$/g, '').trim();
    }

    if (!token || token === 'undefined' || token === 'null') {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is missing. Please log in.',
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY || 'super_secure_trendline_jwt_secret_key_2026_change_in_production'
    );

    const admin = await AdminUser.findByPk(decoded.id, {
      attributes: ['id', 'full_name', 'email', 'role', 'preferred_lang', 'is_active'],
    });

    if (!admin || !admin.is_active) {
      return res.status(401).json({
        success: false,
        message: 'User account is invalid or deactivated.',
      });
    }

    req.user = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token.',
      error: error.message,
    });
  }
};

module.exports = authMiddleware;
