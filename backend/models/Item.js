const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    type: {
        type: String,
        required: [true, 'Item type is required'],
        enum: ['lost', 'found'],
        index: true
    },
    category: {
        type: String,
        required: [true, 'Item category is required'],
        enum: [
            'electronics', 'documents', 'jewelry', 'accessories', 
            'clothing', 'books', 'vehicles', 'pets', 'other'
        ],
        index: true
    },
    subcategory: {
        type: String,
        trim: true,
        maxlength: [100, 'Subcategory cannot exceed 100 characters']
    },
    title: {
        type: String,
        required: [true, 'Item title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters'],
        index: 'text'
    },
    description: {
        type: String,
        required: [true, 'Item description is required'],
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters'],
        index: 'text'
    },
    brand: {
        type: String,
        trim: true,
        maxlength: [100, 'Brand cannot exceed 100 characters']
    },
    model: {
        type: String,
        trim: true,
        maxlength: [100, 'Model cannot exceed 100 characters']
    },
    color: {
        type: String,
        trim: true,
        maxlength: [50, 'Color cannot exceed 50 characters']
    },
    size: {
        type: String,
        trim: true,
        maxlength: [50, 'Size cannot exceed 50 characters']
    },
    condition: {
        type: String,
        enum: ['new', 'like-new', 'good', 'fair', 'poor'],
        default: 'good'
    },
    images: [{
        url: {
            type: String,
            required: true
        },
        publicId: String,
        caption: String,
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],
    location: {
        address: {
            street: String,
            city: {
                type: String,
                required: [true, 'City is required'],
                trim: true,
                index: true
            },
            state: {
                type: String,
                required: [true, 'State is required'],
                trim: true,
                index: true
            },
            country: {
                type: String,
                default: 'India',
                index: true
            },
            postalCode: String,
            landmark: String
        },
        coordinates: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number],
                required: [true, 'Coordinates are required'],
                index: '2dsphere'
            }
        },
        area: String,
        district: String
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
        index: true
    },
    time: {
        type: String,
        required: [true, 'Time is required']
    },
    reward: {
        amount: {
            type: Number,
            min: [0, 'Reward amount cannot be negative'],
            default: 0
        },
        currency: {
            type: String,
            default: 'INR',
            enum: ['INR', 'USD', 'EUR']
        },
        description: String,
        isNegotiable: {
            type: Boolean,
            default: false
        }
    },
    contact: {
        name: {
            type: String,
            required: [true, 'Contact name is required'],
            trim: true
        },
        phone: {
            type: String,
            required: [true, 'Contact phone is required'],
            trim: true
        },
        email: {
            type: String,
            required: [true, 'Contact email is required'],
            trim: true,
            lowercase: true
        },
        alternatePhone: String,
        preferredContact: {
            type: String,
            enum: ['phone', 'email', 'both'],
            default: 'both'
        }
    },
    status: {
        type: String,
        enum: ['active', 'matched', 'claimed', 'expired', 'cancelled'],
        default: 'active',
        index: true
    },
    matchDetails: {
        matchedItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item'
        },
        matchedAt: Date,
        matchedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        confidence: {
            type: Number,
            min: 0,
            max: 100
        }
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: [50, 'Tag cannot exceed 50 characters']
    }],
    features: [{
        name: String,
        value: String
    }],
    additionalInfo: {
        type: String,
        trim: true,
        maxlength: [500, 'Additional info cannot exceed 500 characters']
    },
    isUrgent: {
        type: Boolean,
        default: false,
        index: true
    },
    expiryDate: {
        type: Date,
        default: function() {
            // Items expire after 90 days
            return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        },
        index: true
    },
    views: {
        type: Number,
        default: 0
    },
    shares: {
        type: Number,
        default: 0
    },
    reports: [{
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reason: {
            type: String,
            required: true,
            enum: ['inappropriate', 'spam', 'fake', 'duplicate', 'other']
        },
        description: String,
        reportedAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
            default: 'pending'
        }
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Creator is required'],
        index: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationMethod: {
        type: String,
        enum: ['email', 'phone', 'document', 'none'],
        default: 'none'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
itemSchema.index({ type: 1, category: 1, status: 1 });
itemSchema.index({ 'location.city': 1, 'location.state': 1 });
itemSchema.index({ createdAt: -1 });
itemSchema.index({ isUrgent: 1, createdAt: -1 });
itemSchema.index({ expiryDate: 1 });

// Text index for search functionality
itemSchema.index({
    title: 'text',
    description: 'text',
    tags: 'text',
    'location.city': 'text',
    'location.state': 'text'
});

// Virtual for isExpired
itemSchema.virtual('isExpired').get(function() {
    return this.expiryDate < new Date();
});

// Virtual for daysUntilExpiry
itemSchema.virtual('daysUntilExpiry').get(function() {
    const now = new Date();
    const diffTime = this.expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
});

// Virtual for primary image
itemSchema.virtual('primaryImage').get(function() {
    const primary = this.images.find(img => img.isPrimary);
    return primary ? primary.url : (this.images[0] ? this.images[0].url : null);
});

// Pre-save middleware to set primary image
itemSchema.pre('save', function(next) {
    if (this.images.length > 0 && !this.images.some(img => img.isPrimary)) {
        this.images[0].isPrimary = true;
    }
    next();
});

// Pre-save middleware to update expiry date for urgent items
itemSchema.pre('save', function(next) {
    if (this.isUrgent && this.type === 'lost') {
        // Urgent lost items expire after 30 days
        this.expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
    next();
});

// Instance method to increment views
itemSchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

// Instance method to increment shares
itemSchema.methods.incrementShares = function() {
    this.shares += 1;
    return this.save();
};

// Instance method to check if item can be matched
itemSchema.methods.canBeMatched = function() {
    return this.status === 'active' && !this.isExpired;
};

// Static method to find active items
itemSchema.statics.findActive = function() {
    return this.find({
        status: 'active',
        expiryDate: { $gt: new Date() }
    });
};

// Static method to find items by location
itemSchema.statics.findByLocation = function(city, state) {
    return this.find({
        'location.city': new RegExp(city, 'i'),
        'location.state': new RegExp(state, 'i'),
        status: 'active',
        expiryDate: { $gt: new Date() }
    });
};

// Static method to find urgent items
itemSchema.statics.findUrgent = function() {
    return this.find({
        isUrgent: true,
        status: 'active',
        expiryDate: { $gt: new Date() }
    }).sort({ createdAt: -1 });
};

// Static method to find expired items
itemSchema.statics.findExpired = function() {
    return this.find({
        expiryDate: { $lt: new Date() },
        status: 'active'
    });
};

module.exports = mongoose.model('Item', itemSchema);
