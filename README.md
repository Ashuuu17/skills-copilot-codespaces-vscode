# Real-Time Communication App

A comprehensive video conferencing and collaboration platform built with modern web technologies, featuring WebRTC for real-time media, Socket.io for instant communication, and end-to-end encryption for security.

## 🚀 Features

### Core Communication
- **HD Video Calling**: Multi-user video conferencing with WebRTC
- **Audio Communication**: High-quality audio with noise suppression
- **Screen Sharing**: Share your screen with other participants
- **Real-time Chat**: Instant messaging with typing indicators
- **File Sharing**: Secure file upload and download with encryption
- **Collaborative Whiteboard**: Draw and collaborate in real-time

### Security & Authentication
- **User Authentication**: Secure JWT-based authentication
- **End-to-End Encryption**: AES encryption for messages and data
- **Secure File Handling**: Protected file upload and storage
- **Rate Limiting**: Protection against abuse and spam
- **Input Validation**: Comprehensive data validation

### User Experience
- **Modern UI/UX**: Beautiful, responsive design with Tailwind CSS
- **Smooth Animations**: Framer Motion animations throughout
- **Real-time Updates**: Live participant status and notifications
- **Mobile Responsive**: Works on desktop, tablet, and mobile
- **Intuitive Controls**: Easy-to-use interface for all features

## 🛠 Tech Stack

### Frontend
- **React 18**: Modern React with hooks and context
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations and transitions
- **Socket.io Client**: Real-time communication
- **Fabric.js**: Canvas manipulation for whiteboard
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls
- **React Hot Toast**: Beautiful notification system

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **Socket.io**: Real-time bidirectional communication
- **MongoDB**: NoSQL database with Mongoose ODM
- **JWT**: JSON Web Tokens for authentication
- **Bcrypt**: Password hashing
- **Multer**: File upload handling
- **Helmet**: Security middleware
- **CORS**: Cross-origin resource sharing

### Real-Time Communication
- **WebRTC**: Peer-to-peer video/audio communication
- **STUN Servers**: NAT traversal for WebRTC
- **Socket.io**: Signaling server for WebRTC

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd realtime-communication-app
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install all dependencies (root, server, client)
   npm run install-all
   ```

3. **Environment Configuration**
   
   Create environment files:
   
   **Server (.env in /server directory):**
   ```env
   PORT=5000
   JWT_SECRET=your_very_long_and_secure_jwt_secret_key_here
   MONGODB_URI=mongodb://localhost:27017/rtc_app
   CORS_ORIGIN=http://localhost:5173
   ENCRYPTION_KEY=your_32_character_encryption_key!!
   FILE_UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=50000000
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   
   # Or use MongoDB Atlas (cloud) - update MONGODB_URI accordingly
   ```

5. **Run the application**
   
   **Development mode (both server and client):**
   ```bash
   npm run dev
   ```
   
   **Or run separately:**
   ```bash
   # Terminal 1 - Server
   npm run server
   
   # Terminal 2 - Client
   npm run client
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 🎯 Usage

### Getting Started

1. **Create Account**: Register with username, email, and password
2. **Login**: Sign in with your credentials
3. **Create Room**: Generate a new room ID or enter an existing one
4. **Join Meeting**: Share room ID with others to join the call

### Features Guide

#### Video Calling
- Click camera icon to toggle video on/off
- Click microphone icon to mute/unmute audio
- Use screen share button to share your screen
- View all participants in a responsive grid layout

#### Chat
- Switch to chat tab in the sidebar
- Type messages and press Enter to send
- See typing indicators when others are typing
- All messages are encrypted for privacy

#### Whiteboard
- Switch to whiteboard tab
- Choose from drawing tools: pen, eraser, shapes, text
- Select colors and brush sizes
- Collaborate in real-time with other participants
- Download whiteboard as PNG image

#### File Sharing
- Switch to files tab
- Drag and drop files or click to upload
- Supported formats: images, documents, audio, video, archives
- Files are encrypted before upload
- Download shared files securely

## 🏗 Project Structure

```
realtime-communication-app/
├── client/                 # React frontend
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # React context providers
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   ├── package.json
│   └── vite.config.js
├── server/                # Node.js backend
│   ├── middleware/        # Express middleware
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── uploads/          # File storage
│   └── index.js          # Server entry point
├── package.json          # Root package.json
└── README.md
```

## 🔧 Configuration

### WebRTC Configuration
The app uses Google's STUN servers by default. For production, consider:
- Adding TURN servers for better connectivity
- Implementing ICE candidate gathering optimization
- Adding bandwidth adaptation

### Security Configuration
- Change JWT_SECRET to a secure random string
- Use strong ENCRYPTION_KEY (32 characters)
- Configure CORS_ORIGIN for production domain
- Enable HTTPS in production

### File Upload Configuration
- Adjust MAX_FILE_SIZE as needed
- Configure FILE_UPLOAD_PATH for your storage
- Add virus scanning for uploaded files in production

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**
   - Use production MongoDB URI
   - Set secure JWT secret
   - Configure proper CORS origins
   - Use HTTPS for WebRTC

2. **Performance**
   - Enable gzip compression
   - Use CDN for static assets
   - Implement caching strategies
   - Monitor server resources

3. **Security**
   - Enable HTTPS/SSL
   - Use environment-specific secrets
   - Implement proper rate limiting
   - Regular security audits

### Deployment Platforms
- **Frontend**: Vercel, Netlify, AWS S3 + CloudFront
- **Backend**: Railway, Heroku, AWS EC2, DigitalOcean
- **Database**: MongoDB Atlas, AWS DocumentDB

## 🧪 Development

### Available Scripts

```bash
# Root level
npm run dev          # Start both server and client
npm run install-all  # Install all dependencies
npm run server       # Start server only
npm run client       # Start client only

# Server
cd server
npm start           # Production server
npm run dev         # Development server with nodemon

# Client
cd client
npm run dev         # Development server
npm run build       # Production build
npm run preview     # Preview production build
```

### Code Style
- ESLint for code linting
- Prettier for code formatting
- Consistent naming conventions
- Component-based architecture

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout
- `PATCH /api/auth/profile` - Update profile

### File Endpoints
- `POST /api/files/upload` - Upload file
- `GET /api/files/:fileId/download` - Download file
- `GET /api/files/:fileId/info` - Get file info
- `DELETE /api/files/:fileId` - Delete file

### WebSocket Events
- `join-room` - Join a video call room
- `offer/answer/ice-candidate` - WebRTC signaling
- `chat-message` - Send chat message
- `whiteboard-draw` - Whiteboard drawing events
- `file-share` - File sharing events

## 🔐 Security Features

### Data Encryption
- AES encryption for chat messages
- File metadata encryption
- Secure key exchange simulation
- Data integrity verification

### Authentication Security
- JWT tokens with expiration
- Password hashing with bcrypt
- Rate limiting on authentication endpoints
- Input validation and sanitization

### Communication Security
- WebRTC peer-to-peer encryption
- Socket.io connection security
- CORS protection
- Helmet security headers

## 📱 Browser Support

- Chrome 88+ (recommended)
- Firefox 85+
- Safari 14+
- Edge 88+

**Note**: WebRTC features require HTTPS in production and may not work in older browsers.

## 🐛 Troubleshooting

### Common Issues

1. **WebRTC Connection Failed**
   - Check firewall settings
   - Ensure HTTPS in production
   - Verify STUN/TURN server configuration

2. **File Upload Issues**
   - Check file size limits
   - Verify upload directory permissions
   - Ensure proper MIME type configuration

3. **Database Connection**
   - Verify MongoDB is running
   - Check connection string format
   - Ensure network connectivity

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎉 Acknowledgments

- WebRTC community for excellent documentation
- Socket.io team for real-time communication
- React team for the amazing framework
- All contributors and users of this project

---

Built with ❤️ using modern web technologies for seamless real-time communication and collaboration.
