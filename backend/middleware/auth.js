const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to authenticate JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.type && decoded.type !== 'access') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token type'
            });
        }

        // Check if user exists and is active
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'User account is deactivated'
            });
        }

        if (user.isBlocked) {
            return res.status(401).json({
                success: false,
                message: 'User account is blocked'
            });
        }

        // Add user info to request
        req.user = {
            userId: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role || 'user'
        };

        next();

    } catch (error) {
        console.error('Authentication error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired',
                code: 'TOKEN_EXPIRED'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Authentication failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Middleware to check if user is verified
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireVerification = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.verification.email.verified) {
            return res.status(403).json({
                success: false,
                message: 'Email verification required',
                code: 'EMAIL_NOT_VERIFIED'
            });
        }

        next();

    } catch (error) {
        console.error('Verification check error:', error);
        res.status(500).json({
            success: false,
            message: 'Verification check failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Middleware to check if user has required permissions
 * @param {Array} requiredPermissions - Array of required permissions
 * @returns {Function} Middleware function
 */
const requirePermissions = (requiredPermissions) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const user = await User.findById(req.user.userId);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Check if user has required permissions
            // This is a basic implementation - you can extend it based on your needs
            if (user.role === 'admin') {
                return next(); // Admin has all permissions
            }

            // Add your permission logic here
            // For now, we'll just check if user is verified
            if (!user.verification.email.verified) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions'
                });
            }

            next();

        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({
                success: false,
                message: 'Permission check failed',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    };
};

/**
 * Middleware to check if user owns the resource
 * @param {string} resourceModel - Name of the resource model
 * @param {string} resourceIdField - Field name containing the resource ID (default: 'id')
 * @returns {Function} Middleware function
 */
const requireOwnership = (resourceModel, resourceIdField = 'id') => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const resourceId = req.params[resourceIdField] || req.body[resourceIdField];
            if (!resourceId) {
                return res.status(400).json({
                    success: false,
                    message: 'Resource ID is required'
                });
            }

            // Import the model dynamically
            const Model = require(`../models/${resourceModel}`);
            const resource = await Model.findById(resourceId);

            if (!resource) {
                return res.status(404).json({
                    success: false,
                    message: 'Resource not found'
                });
            }

            // Check if user owns the resource
            if (resource.createdBy.toString() !== req.user.userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only modify your own resources.'
                });
            }

            // Add resource to request for later use
            req.resource = resource;
            next();

        } catch (error) {
            console.error('Ownership check error:', error);
            res.status(500).json({
                success: false,
                message: 'Ownership check failed',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    };
};

/**
 * Middleware to rate limit specific actions
 * @param {number} maxAttempts - Maximum attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Function} Middleware function
 */
const rateLimitAction = (maxAttempts, windowMs) => {
    const attempts = new Map();

    return (req, res, next) => {
        const key = req.user ? req.user.userId : req.ip;
        const now = Date.now();
        const userAttempts = attempts.get(key) || [];

        // Remove expired attempts
        const validAttempts = userAttempts.filter(timestamp => now - timestamp < windowMs);

        if (validAttempts.length >= maxAttempts) {
            return res.status(429).json({
                success: false,
                message: 'Too many attempts. Please try again later.',
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }

        // Add current attempt
        validAttempts.push(now);
        attempts.set(key, validAttempts);

        next();
    };
};

/**
 * Middleware to validate request body
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Middleware function
 */
const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body);
        
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }))
            });
        }

        // Replace req.body with validated data
        req.body = value;
        next();
    };
};

module.exports = {
    authenticateToken,
    requireVerification,
    requirePermissions,
    requireOwnership,
    rateLimitAction,
    validateRequest
};
