import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'corepack_super_secret_jwt_key_2026_production_ready'
    );
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired access token' });
  }
};

import { ROLE_PERMISSIONS } from '../constants/roles.js';

/**
 * Enterprise RBAC Authorization Middleware
 * Verifies if the authenticated user has ANY of the required permissions.
 * Falls back to customPermissions if role permissions are insufficient.
 */
export const authorize = (requiredPermissions = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required for authorization' });
    }

    // Owner and Admin bypass permission checks natively
    if (req.user.role === 'Owner' || req.user.role === 'Admin') {
      return next();
    }

    const userRolePermissions = ROLE_PERMISSIONS[req.user.role] || [];
    const userCustomPermissions = req.user.customPermissions || [];
    
    // Combine role-based and user-specific custom permissions
    const effectivePermissions = new Set([...userRolePermissions, ...userCustomPermissions]);

    const hasPermission = requiredPermissions.some(permission => effectivePermissions.has(permission));

    if (!hasPermission) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access Denied: You do not have the required permissions to perform this action.' 
      });
    }

    next();
  };
};
