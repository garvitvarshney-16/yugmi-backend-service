const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validation
const validateUserRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().isLength({ min: 2 }),
  body('lastName').trim().isLength({ min: 2 }),
  body('userType').isIn(['individual', 'organization']),
  handleValidationErrors
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  handleValidationErrors
];

// Organization validation
const validateOrganization = [
  body('name').trim().isLength({ min: 2 }),
  body('email').isEmail().normalizeEmail(),
  body('phone').optional().isMobilePhone(),
  handleValidationErrors
];

// Project validation
const validateProject = [
  body('name').trim().isLength({ min: 2 }),
  body('startDate').isISO8601(),
  body('endDate').optional().isISO8601(),
  handleValidationErrors
];

// Site validation
const validateSite = [
  body('name').trim().isLength({ min: 2 }),
  body('projectId').isUUID(),
  body('operationType').isIn(['progress-monitoring', 'auditing', 'inspection']),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
  handleValidationErrors
];

// Capture validation
const validateCapture = [
  // body('siteId').isUUID(),
  // body('mediaType').isIn(['image', 'video']),
  // body('fileName').notEmpty(),
  // body('sensorData').isObject(),
  handleValidationErrors
];

// UUID parameter validation
const validateUUIDParam = (paramName) => [
  param(paramName).isUUID(),
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateLogin,
  validateOrganization,
  validateProject,
  validateSite,
  validateCapture,
  validateUUIDParam,
  handleValidationErrors
};