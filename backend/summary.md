# Lost & Found Backend - Summary & Setup Instructions

## 🎯 **Project Overview**

A comprehensive **Node.js backend API** for the Lost & Found platform featuring:
- **User Authentication & Management** with JWT tokens
- **Item Management** for lost/found items
- **AI Chatbot Integration** powered by Google Gemini API
- **Real-time Features** with Socket.io
- **File Upload** system with Cloudinary
- **Advanced Security** with rate limiting, CORS, and validation

## 🏗️ **System Architecture**

```
backend/
├── 📁 config/          # Database & configuration
├── 📁 models/          # MongoDB schemas (User, Item)
├── 📁 routes/          # API endpoints
├── 📁 middleware/      # Authentication & validation
├── 📁 services/        # Email, SMS, file upload
├── 📁 uploads/         # File storage
├── 📄 server.js        # Main server file
├── 📄 package.json     # Dependencies
└── 📄 .env            # Environment variables
```

## 🚀 **Quick Setup Guide**

### **Step 1: Prerequisites**
- ✅ Node.js (v16 or higher)
- ✅ MongoDB (local or Atlas)
- ✅ Google Gemini API key
- ✅ Cloudinary account (optional)
- ✅ Gmail account (optional)

### **Step 2: Installation**
```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Copy environment file
cp env.example .env
```

### **Step 3: Environment Configuration**
Edit `.env` file with your settings:
```env
# Essential Settings
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/lost_found_db
JWT_SECRET=your_super_secret_key_here

# AI Chatbot (Required)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional Services
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### **Step 4: Start Server**
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## 🔑 **Key Features & Endpoints**

### **🔐 Authentication System**
- **POST** `/api/auth/register` - User registration
- **POST** `/api/auth/login` - User login
- **POST** `/api/auth/refresh-token` - Token refresh
- **GET** `/api/auth/me` - Get user profile
- **POST** `/api/auth/logout` - User logout

### **📱 Item Management**
- **POST** `/api/items/lost` - Report lost item
- **POST** `/api/items/found` - Report found item
- **GET** `/api/items` - List items
- **PUT** `/api/items/:id` - Update item
- **DELETE** `/api/items/:id` - Delete item

### **🤖 AI Chatbot (Google Gemini)**
- **POST** `/api/ai-chatbot/chat` - Get AI response
- **POST** `/api/ai-chatbot/quick-responses` - Get suggestions
- **GET** `/api/ai-chatbot/status` - Check service status

### **🔍 Search & Matching**
- **GET** `/api/search` - Search items
- **GET** `/api/search/nearby` - Location-based search
- **POST** `/api/search/match` - AI-powered matching

### **📁 File Management**
- **POST** `/api/upload/image` - Upload images
- **DELETE** `/api/upload/:id` - Delete files

## 🗄️ **Database Models**

### **👤 User Model**
```javascript
{
  firstName: String,        // Required
  lastName: String,         // Required
  email: String,            // Required, unique
  phone: String,            // Required, unique
  password: String,         // Required, hashed
  address: {
    city: String,           // Required
    state: String,          // Required
    coordinates: [Number]   // [longitude, latitude]
  },
  verification: {
    email: { verified: Boolean, token: String },
    phone: { verified: Boolean, otp: String }
  },
  stats: {
    itemsReported: Number,
    itemsFound: Number,
    successfulMatches: Number
  }
}
```

### **📦 Item Model**
```javascript
{
  type: String,             // 'lost' or 'found'
  category: String,         // electronics, documents, jewelry, etc.
  title: String,            // Required
  description: String,      // Required
  location: {
    city: String,           // Required
    state: String,          // Required
    coordinates: [Number]   // [longitude, latitude]
  },
  images: [{
    url: String,            // Required
    isPrimary: Boolean
  }],
  reward: {
    amount: Number,
    currency: String        // INR, USD, EUR
  },
  status: String,           // active, matched, claimed, expired
  createdBy: ObjectId       // Reference to User
}
```

## 🔒 **Security Features**

- **JWT Authentication** with refresh tokens
- **Password Hashing** using bcrypt (12 rounds)
- **Rate Limiting** (100 requests per 15 minutes)
- **CORS Protection** with configurable origins
- **Input Validation** using express-validator
- **Account Locking** after 5 failed login attempts
- **Helmet Security** headers

## 🌐 **API Usage Examples**

### **User Registration**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+919876543210",
    "password": "SecurePass123!"
  }'
```

### **User Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### **Report Lost Item**
```bash
curl -X POST http://localhost:5000/api/items/lost \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Lost iPhone 13" \
  -F "description=Black iPhone with blue case" \
  -F "category=electronics" \
  -F "city=Mumbai" \
  -F "state=Maharashtra" \
  -F "date=2024-01-15" \
  -F "time=14:30"
```

### **AI Chatbot Query**
```bash
curl -X POST http://localhost:5000/api/ai-chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I report a lost item?",
    "conversationHistory": []
  }'
```

## 🧪 **Testing & Development**

### **Run Tests**
```bash
npm test                    # Run all tests
npm run test:coverage      # Run with coverage
npm test -- --grep "auth"  # Run specific tests
```

### **Development Scripts**
```bash
npm run dev                # Start with nodemon
npm run start              # Start production server
npm run init-db            # Initialize database
```

### **Health Check**
```bash
curl http://localhost:5000/api/health
```

## 🚀 **Deployment Options**

### **PM2 (Recommended)**
```bash
npm install -g pm2
pm2 start server.js --name "lost-found-api"
pm2 startup
pm2 save
```

### **Docker**
```bash
docker build -t lost-found-backend .
docker run -p 5000:5000 lost-found-backend
```

### **Environment Variables for Production**
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=very_long_random_secret_key
CORS_ORIGIN=https://yourdomain.com
```

## 🔧 **Troubleshooting**

### **Common Issues**

1. **MongoDB Connection Failed**
   - Check if MongoDB is running
   - Verify connection string in `.env`
   - Ensure network access

2. **JWT Token Invalid**
   - Check `JWT_SECRET` in `.env`
   - Verify token expiration
   - Ensure proper Authorization header

3. **AI Chatbot Not Working**
   - Verify `GEMINI_API_KEY` in `.env`
   - Check API quota and limits
   - Test with `/api/ai-chatbot/status`

4. **CORS Errors**
   - Update `CORS_ORIGIN` in `.env`
   - Check frontend URL configuration
   - Verify credentials settings

### **Logs & Monitoring**
```bash
# View server logs
npm run dev

# Check MongoDB connection
# Look for "🗄️ MongoDB Connected" message

# Monitor API requests
# Morgan logging shows all HTTP requests
```

## 📊 **Performance & Scaling**

- **Database Indexing** for fast queries
- **Connection Pooling** (max 10 connections)
- **Compression** middleware for responses
- **Rate Limiting** to prevent abuse
- **Caching** ready with Redis integration

## 🔮 **Future Enhancements**

- [ ] **Payment Gateway** integration
- [ ] **Push Notifications** system
- [ ] **Advanced AI Matching** algorithms
- [ ] **Mobile App** API endpoints
- [ ] **Analytics Dashboard**
- [ ] **Multi-language** support
- [ ] **Social Media** integration

## 📞 **Support & Resources**

- **Documentation**: See `README.md` for detailed API docs
- **Environment**: Copy from `env.example`
- **Dependencies**: Check `package.json` for versions
- **Database**: MongoDB with Mongoose ODM
- **AI Service**: Google Gemini API integration

---

## 🎉 **Ready to Launch!**

Your Lost & Found backend is now configured with:
- ✅ **Complete API** with authentication
- ✅ **Database models** for users and items
- ✅ **AI Chatbot** powered by Google Gemini
- ✅ **Security features** and validation
- ✅ **Real-time capabilities** with Socket.io
- ✅ **File upload** system
- ✅ **Comprehensive documentation**

**Next Steps:**
1. Configure your `.env` file
2. Start the server with `npm run dev`
3. Test the health endpoint
4. Integrate with your frontend
5. Deploy to production

**Happy Coding! 🚀**
