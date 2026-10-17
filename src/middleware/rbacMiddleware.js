/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts route access to specified roles.
 * Allowed roles: 'super_admin', 'erp_manager', 'sales_agent', 'warehouse', 'accountant'
 */
const permitRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access.',
      });
    }

    // super_admin always has universal authorization
    if (req.user.role === 'super_admin' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}]`,
    });
  };
};

module.exports = { permitRoles };
