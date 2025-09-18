const jwt = require('jsonwebtoken');
const { User, Organization, Role } = require('../models');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // console.log(token)

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // console.log(decoded)
    const user = await User.findByPk(decoded.userId, {
      include: [
        { model: Organization, as: 'organization' },
        { model: Role, as: 'role' }
      ]
    });

    // console.log(user)

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or inactive user'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid token',
      error: error.message
    });
  }
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (req.user.userType === 'individual') {
      return next(); // Allow all actions for individual users
    } else if (req.user.role && req.user.role.permissions[permission]) {
      return next();
    } 

    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions'
    });
  };
};

const requireOrgAdmin = (req, res, next) => {
  if (req.user.userType !== 'organization') {
    return res.status(403).json({
      success: false,
      message: 'Organization user required'
    });
  }

  if (!req.user.role || !req.user.role.permissions.canManageUsers) {
    return res.status(403).json({
      success: false,
      message: 'Organization admin privileges required'
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  requirePermission,
  requireOrgAdmin
};
