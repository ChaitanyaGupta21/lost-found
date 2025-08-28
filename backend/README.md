# Lost & Found Backend API

A comprehensive Node.js backend for the Lost & Found platform with user authentication, item management, AI chatbot integration, and real-time features.

## 🚀 Features

- **User Authentication & Authorization** - JWT-based auth with refresh tokens
- **Item Management** - CRUD operations for lost and found items
- **AI Chatbot Integration** - Google Gemini API powered assistant
- **Real-time Communication** - Socket.io for live updates
- **File Upload** - Cloudinary integration for image storage
- **Search & Matching** - Advanced search with AI-powered matching
- **Notifications** - Email, SMS, and push notifications
- **Security** - Rate limiting, CORS, helmet, input validation
- **Database** - MongoDB with Mongoose ODM
- **Caching** - Redis for session and data caching

## 🛠️ Tech Stack

- **Runtime**: Node.js (v16+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + bcryptjs
- **AI Integration**: Google Gemini API
- **Real-time**: Socket.io
- **File Upload**: Multer + Cloudinary
- **Validation**: Express-validator + Joi
- **Security**: Helmet, CORS, Rate Limiting
- **Email**: Nodemailer
- **SMS**: Twilio
- **Caching**: Redis

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Redis (optional, for caching)
- Google Gemini API key
- Cloudinary account (for image uploads)
- Twilio account (for SMS)
- Gmail account (for emails)

## 🚀 Installation

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd lost-found-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the environment file and configure your variables:
```bash
cp env.example .env
```

Edit `.env` with your configuration:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/lost_found_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# Google Gemini AI API
GEMINI_API_KEY=your_gemini_api_key_here

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### 4. Database Setup
```bash
# Start MongoDB (if local)
mongod

# Initialize database (optional)
npm run init-db
```

### 5. Start the server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+919876543210",
  "password": "SecurePass123!"
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

#### Refresh Token
```http
POST /auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "your_refresh_token_here"
}
```

#### Get Profile
```http
GET /auth/me
Authorization: Bearer <your_access_token>
```

### Item Management Endpoints

#### Report Lost Item
```http
POST /items/lost
Authorization: Bearer <your_access_token>
Content-Type: multipart/form-data

{
  "title": "Lost iPhone 13",
  "description": "Black iPhone 13 with blue case",
  "category": "electronics",
  "location": {
    "city": "Mumbai",
    "state": "Maharashtra",
    "coordinates": [72.8777, 19.0760]
  },
  "date": "2024-01-15",
  "time": "14:30",
  "reward": {
    "amount": 5000,
    "currency": "INR"
  },
  "images": [file1, file2]
}
```

#### Report Found Item
```http
POST /items/found
Authorization: Bearer <your_access_token>
Content-Type: multipart/form-data

{
  "title": "Found Gold Ring",
  "description": "Gold ring with diamond",
  "category": "jewelry",
  "location": {
    "city": "Delhi",
    "state": "Delhi",
    "coordinates": [77.2090, 28.7041]
  },
  "date": "2024-01-15",
  "time": "16:45"
}
```

#### Search Items
```http
GET /search?q=iphone&category=electronics&city=mumbai&type=lost
```

### AI Chatbot Endpoints

#### Get AI Response
```http
POST /ai-chatbot/chat
Content-Type: application/json

{
  "message": "How do I report a lost item?",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Hello"
    },
    {
      "role": "assistant", 
      "content": "Hi! How can I help you today?"
    }
  ]
}
```

#### Get Quick Responses
```http
POST /ai-chatbot/quick-responses
Content-Type: application/json

{
  "query": "lost item reporting"
}
```

#### Check AI Status
```http
GET /ai-chatbot/status
```

### File Upload Endpoints

#### Upload Image
```http
POST /upload/image
Authorization: Bearer <your_access_token>
Content-Type: multipart/form-data

{
  "image": <file>,
  "folder": "items"
}
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your_access_token>
```

### Token Types
- **Access Token**: Short-lived (7 days), used for API requests
- **Refresh Token**: Long-lived (30 days), used to get new access tokens

## 🗄️ Database Models

### User Model
- Personal information (name, email, phone)
- Address and location data
- Verification status
- Social accounts
- Statistics and preferences
- Security features (login attempts, account locking)

### Item Model
- Item details (title, description, category)
- Location information with coordinates
- Images and media
- Reward system
- Status tracking
- Matching and reporting

## 🤖 AI Chatbot Integration

The AI chatbot is powered by Google's Gemini API and provides:

- **24/7 Support** - Always available assistance
- **Context Awareness** - Remembers conversation history
- **Quick Responses** - Suggested questions and answers
- **Fallback System** - Works even when AI is unavailable
- **Multi-language Support** - Ready for Indian languages

### Setup AI Chatbot
1. Get Google Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add to your `.env` file: `GEMINI_API_KEY=your_key_here`
3. Test with: `GET /api/ai-chatbot/status`

## 🔒 Security Features

- **Rate Limiting** - Prevents abuse and DDoS
- **Input Validation** - Sanitizes all user inputs
- **CORS Protection** - Configurable cross-origin requests
- **Helmet Security** - HTTP headers security
- **JWT Security** - Secure token handling
- **Password Hashing** - bcrypt with configurable rounds
- **Account Locking** - Automatic after failed attempts

## 📱 Real-time Features

Socket.io integration provides:
- **Live Notifications** - Instant item matches
- **Real-time Chat** - User communication
- **Status Updates** - Live item status changes
- **Location Tracking** - Real-time location updates

## 🚀 Deployment

### Environment Variables
Set these in production:
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=very_long_random_secret_key
```

### PM2 (Recommended)
```bash
npm install -g pm2
pm2 start server.js --name "lost-found-api"
pm2 startup
pm2 save
```

### Docker
```bash
docker build -t lost-found-backend .
docker run -p 5000:5000 lost-found-backend
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- --grep "auth"
```

## 📊 Monitoring & Logging

- **Morgan** - HTTP request logging
- **Error Handling** - Centralized error management
- **Health Checks** - `/api/health` endpoint
- **Performance** - Response time tracking

## 🔧 Development

### Scripts
```bash
npm run dev          # Start with nodemon
npm run start        # Start production server
npm run test         # Run tests
npm run init-db      # Initialize database
```

### Code Style
- ESLint configuration included
- Prettier formatting
- Consistent error handling
- Comprehensive logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Email: support@lostandfound.com
- Documentation: [API Docs](link-to-docs)
- Issues: [GitHub Issues](link-to-issues)

## 🔮 Roadmap

- [ ] Advanced AI matching algorithms
- [ ] Payment gateway integration
- [ ] Mobile app API endpoints
- [ ] Analytics and reporting
- [ ] Multi-tenant support
- [ ] Advanced search filters
- [ ] Social media integration
- [ ] Push notifications

---

**Happy Coding! 🚀**
