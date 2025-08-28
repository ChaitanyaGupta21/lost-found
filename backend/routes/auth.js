const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const { generateOTP, sendSMS } = require('../services/smsService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// Generate Refresh Token
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
    );
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
    body('firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('phone')
        .matches(/^[\+]?[1-9][\d]{0,15}$/)
        .withMessage('Please provide a valid phone number'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { firstName, lastName, email, phone, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { phone }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.email === email.toLowerCase() 
                    ? 'Email already registered' 
                    : 'Phone number already registered'
            });
        }

        // Create new user
        const user = new User({
            firstName,
            lastName,
            email: email.toLowerCase(),
            phone,
            password
        });

        // Generate verification token
        const verificationToken = jwt.sign(
            { userId: user._id, type: 'email-verification' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        user.verification.email.token = verificationToken;
        user.verification.email.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await user.save();

        // Send verification email
        try {
            await sendVerificationEmail(user.email, verificationToken, user.firstName);
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Continue with registration even if email fails
        }

        // Generate tokens
        const token = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: 'User registered successfully. Please check your email for verification.',
            data: {
                user: userResponse,
                token,
                refreshToken
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is blocked
        if (user.isBlocked) {
            return res.status(401).json({
                success: false,
                message: 'Account is blocked. Please contact support.'
            });
        }

        // Check if account is locked
        if (user.isLocked) {
            return res.status(423).json({
                success: false,
                message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.'
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            // Increment login attempts
            await user.incLoginAttempts();
            
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Reset login attempts on successful login
        if (user.loginAttempts > 0) {
            await user.resetLoginAttempts();
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate tokens
        const token = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: userResponse,
                token,
                refreshToken
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token
// @access  Public
router.post('/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(
            refreshToken, 
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
        );

        if (decoded.type !== 'refresh') {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        // Check if user exists
        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'User not found or inactive'
            });
        }

        // Generate new tokens
        const newToken = generateToken(user._id);
        const newRefreshToken = generateRefreshToken(user._id);

        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                token: newToken,
                refreshToken: newRefreshToken
            }
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Refresh token expired'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Token refresh failed. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   POST /api/auth/verify-email
// @desc    Verify user email
// @access  Public
router.post('/verify-email', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Verification token is required'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.type !== 'email-verification') {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification token'
            });
        }

        // Find user
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if already verified
        if (user.verification.email.verified) {
            return res.status(400).json({
                success: false,
                message: 'Email already verified'
            });
        }

        // Check if token expired
        if (user.verification.email.expiresAt < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Verification token expired'
            });
        }

        // Mark email as verified
        user.verification.email.verified = true;
        user.verification.email.token = undefined;
        user.verification.email.expiresAt = undefined;

        await user.save();

        res.json({
            success: true,
            message: 'Email verified successfully'
        });

    } catch (error) {
        console.error('Email verification error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification token'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({
                success: false,
                message: 'Verification token expired'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Email verification failed. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email } = req.body;

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            // Don't reveal if user exists or not
            return res.json({
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent.'
            });
        }

        // Generate reset token
        const resetToken = jwt.sign(
            { userId: user._id, type: 'password-reset' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Store reset token
        user.verification.email.token = resetToken;
        user.verification.email.expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await user.save();

        // Send reset email
        try {
            await sendPasswordResetEmail(user.email, resetToken, user.firstName);
        } catch (emailError) {
            console.error('Password reset email sending failed:', emailError);
            return res.status(500).json({
                success: false,
                message: 'Failed to send password reset email. Please try again.'
            });
        }

        res.json({
            success: true,
            message: 'Password reset email sent successfully'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Password reset request failed. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', [
    body('token')
        .notEmpty()
        .withMessage('Reset token is required'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { token, password } = req.body;

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.type !== 'password-reset') {
            return res.status(400).json({
                success: false,
                message: 'Invalid reset token'
            });
        }

        // Find user
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if token expired
        if (user.verification.email.expiresAt < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Reset token expired'
            });
        }

        // Update password
        user.password = password;
        user.verification.email.token = undefined;
        user.verification.email.expiresAt = undefined;

        await user.save();

        res.json({
            success: true,
            message: 'Password reset successfully'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid reset token'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({
                success: false,
                message: 'Reset token expired'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Password reset failed. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   POST /api/auth/logout
// @desc    Logout user (invalidate token)
// @access  Private
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        // In a real application, you might want to add the token to a blacklist
        // For now, we'll just return success as the client will remove the token
        
        res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({
            success: true,
            data: {
                user: userResponse
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
