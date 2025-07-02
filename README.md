# IELTS Exam Simulation Platform

A comprehensive web application for IELTS exam preparation with authentic exam simulation, user management, and advanced analytics.

## 🚀 Features

### Core Exam Features
- **Four IELTS Modules**: Listening, Reading, Writing, and Speaking
- **Authentic Exam Simulation**: Realistic exam environment with strict timing
- **Interactive Question Types**: Multiple choice, fill-in-the-blank, true/false, matching, short answer, essay, and speaking
- **Real-time Timer**: Countdown timer with auto-submit functionality
- **Progress Saving**: Automatic saving of answers during exams
- **Note-taking**: Built-in note-taking feature during exams
- **Question Flagging**: Mark questions for review
- **Audio Support**: Integrated audio player for listening modules

### User Management
- **User Registration & Authentication**: Secure JWT-based authentication
- **User Profiles**: Complete profile management with preferences
- **Role-based Access**: User, Admin, and Moderator roles
- **Account Settings**: Password change, email preferences, notifications

### Exam Management
- **Exam Creation**: Admin can create and manage exams
- **Question Bank**: Comprehensive question management system
- **Exam Scheduling**: Flexible exam scheduling with availability slots
- **Speaking Test Bookings**: Integrated booking system for speaking tests
- **Google Calendar Integration**: Automatic calendar scheduling

### Analytics & Reporting
- **Performance Analytics**: Detailed performance insights and trends
- **Progress Tracking**: Visual progress indicators and statistics
- **Score Analysis**: Band score breakdown and improvement suggestions
- **Admin Dashboard**: Comprehensive analytics for administrators

### Payment & Wallet System
- **Digital Wallet**: User wallet with balance management
- **Transaction History**: Complete transaction tracking
- **Top-up & Withdrawal**: Multiple payment methods
- **Referral Rewards**: Earn credits through referral program

### Support System
- **Support Tickets**: User support ticket system
- **Admin Support Management**: Complete ticket management for admins
- **Email Notifications**: Automated email notifications
- **Real-time Updates**: Live status updates

### Admin Features
- **User Management**: Complete user administration
- **Exam Management**: Create, edit, and manage exams
- **Question Management**: Comprehensive question bank management
- **Submission Grading**: Manual and automated grading system
- **Analytics Dashboard**: Advanced analytics and reporting
- **System Settings**: Platform configuration and settings

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcrypt** for password hashing
- **Nodemailer** for email functionality
- **Multer** for file uploads
- **CORS** for cross-origin requests

### Frontend
- **React.js** with functional components and hooks
- **React Router** for navigation
- **React Query** for state management and API calls
- **Tailwind CSS** for styling
- **React Icons** for iconography
- **React Hot Toast** for notifications

### Development Tools
- **ESLint** for code linting
- **Prettier** for code formatting
- **Nodemon** for development server
- **Concurrently** for running multiple scripts

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ezsim2
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/ielts_platform
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=7d
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_password
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```

4. **Start the backend server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to client directory**
   ```bash
   cd client
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Start the frontend development server**
   ```bash
   npm start
   ```

## 🚀 Usage

### For Users

1. **Registration**: Create a new account with email verification
2. **Browse Exams**: View available exams by module and difficulty
3. **Take Exams**: Start exams with real-time timer and progress tracking
4. **View Results**: Get detailed performance analysis and feedback
5. **Book Speaking Tests**: Schedule speaking test appointments
6. **Manage Profile**: Update personal information and preferences
7. **Support**: Create support tickets for assistance

### For Administrators

1. **User Management**: Manage user accounts, roles, and permissions
2. **Exam Creation**: Create and configure new exams with questions
3. **Question Bank**: Manage question database with various types
4. **Submission Grading**: Grade and provide feedback on submissions
5. **Analytics**: View comprehensive platform analytics and insights
6. **Support Management**: Handle user support tickets and inquiries
7. **System Settings**: Configure platform settings and preferences

## 📁 Project Structure

```
ezsim2/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── server.js
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.js
│   └── package.json
├── package.json
└── README.md
```

## 🔧 Configuration

### Database Configuration
- MongoDB connection string in `.env` file
- Database indexes for optimal performance
- Data validation and sanitization

### Email Configuration
- SMTP settings for email notifications
- Email templates for various notifications
- Automated email scheduling

### Payment Configuration
- Stripe integration for payments
- Multiple payment method support
- Transaction logging and reconciliation

### Security Configuration
- JWT token management
- Password hashing and validation
- CORS configuration
- Rate limiting and security headers

## 🧪 Testing

### Backend Testing
```bash
npm test
```

### Frontend Testing
```bash
cd client
npm test
```

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset

### User Endpoints
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/password` - Change password
- `GET /api/users/wallet` - Get wallet information

### Exam Endpoints
- `GET /api/exams` - Get available exams
- `GET /api/exams/:id` - Get exam details
- `POST /api/exams/:id/start` - Start exam
- `POST /api/exams/:id/submit` - Submit exam
- `GET /api/exams/:id/results` - Get exam results

### Admin Endpoints
- `GET /api/admin/users` - Get all users
- `POST /api/admin/exams` - Create exam
- `GET /api/admin/analytics` - Get analytics data
- `PUT /api/admin/settings` - Update system settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation

## 🔮 Roadmap

### Phase 2 Features
- Mobile application (React Native)
- Advanced AI-powered grading
- Video conferencing for speaking tests
- Social learning features
- Gamification elements
- Advanced analytics and reporting
- Multi-language support
- Offline exam capability

### Phase 3 Features
- Machine learning for personalized learning
- Virtual reality speaking test environment
- Advanced proctoring features
- Integration with educational institutions
- API for third-party integrations
- Advanced security features

## 📈 Performance

- Optimized database queries with proper indexing
- Efficient caching strategies
- Responsive design for all devices
- Fast loading times with code splitting
- Real-time updates with WebSocket support

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- Rate limiting
- Security headers
- Data encryption

---

**Built with ❤️ for IELTS preparation** 