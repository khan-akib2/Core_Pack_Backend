export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const userRole = req.user.role ? req.user.role.toLowerCase() : '';
    const isAllowed = allowedRoles.some(role => role.toLowerCase() === userRole);
    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles [${allowedRoles.join(', ')}]`
      });
    }

    next();
  };
};
