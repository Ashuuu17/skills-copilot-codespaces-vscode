# 📚 API Documentation

Complete API reference for the Video Conference Application backend services.

## 🔐 Authentication

All API endpoints (except public ones) require authentication using JWT tokens.

### Authentication Flow

1. **Register** or **Login** to get access token
2. **Include token** in `Authorization` header
3. **Refresh token** when access token expires

### Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Token Types

- **Access Token**: Short-lived (15 minutes), used for API calls
- **Refresh Token**: Long-lived (7 days), used to get new access tokens

## 📍 Base URL

- **Development**: `http://localhost:5000/api`
- **Production**: `https://yourdomain.com/api`

## 🔑 Authentication Endpoints

### Register User

```http
POST /auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phone": "+1234567890",
  "location": "New York",
  "bio": "Software developer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://via.placeholder.com/150",
      "phone": "+1234567890",
      "location": "New York",
      "bio": "Software developer",
      "isOnline": false,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Validation Rules:**
- `name`: 2-50 characters, required
- `email`: Valid email format, required, unique
- `password`: 6+ characters, required
- `phone`: Optional, valid phone format
- `location`: Optional, max 100 characters
- `bio`: Optional, max 500 characters

### Login User

```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://via.placeholder.com/150",
      "isOnline": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

### Refresh Token

```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Logout

```http
POST /auth/logout
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Forgot Password

```http
POST /auth/forgot-password
```

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### Reset Password

```http
POST /auth/reset-password
```

**Request Body:**
```json
{
  "token": "reset_token_here",
  "password": "newPassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

## 👤 User Management

### Get User Profile

```http
GET /users/profile
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://via.placeholder.com/150",
      "phone": "+1234567890",
      "location": "New York",
      "bio": "Software developer",
      "isOnline": true,
      "lastSeen": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Update User Profile

```http
PUT /users/profile
```

**Request Body:**
```json
{
  "name": "John Smith",
  "phone": "+1987654321",
  "location": "Los Angeles",
  "bio": "Full-stack developer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "John Smith",
      "email": "john@example.com",
      "phone": "+1987654321",
      "location": "Los Angeles",
      "bio": "Full-stack developer",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

### Upload Avatar

```http
POST /users/avatar
Content-Type: multipart/form-data
```

**Request Body:**
```
avatar: [file]
```

**Response:**
```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "avatar": "https://yourdomain.com/uploads/avatars/64f8a1b2c3d4e5f6a7b8c9d0.jpg"
  }
}
```

### Change Password

```http
PUT /users/change-password
```

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Get Online Users

```http
GET /users/online
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "name": "John Doe",
        "avatar": "https://via.placeholder.com/150",
        "isOnline": true,
        "lastSeen": "2024-01-15T10:30:00.000Z"
      }
    ],
    "total": 1
  }
}
```

## 🏠 Room Management

### Create Room

```http
POST /rooms
```

**Request Body:**
```json
{
  "name": "Team Meeting",
  "description": "Weekly team sync meeting",
  "isPrivate": false,
  "password": "",
  "maxParticipants": 20,
  "settings": {
    "allowChat": true,
    "allowScreenShare": true,
    "allowRecording": false,
    "allowWhiteboard": true,
    "requirePassword": false,
    "maxDuration": 86400000
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Room created successfully",
  "data": {
    "room": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "Team Meeting",
      "description": "Weekly team sync meeting",
      "isPrivate": false,
      "createdBy": "64f8a1b2c3d4e5f6a7b8c9d0",
      "participants": ["64f8a1b2c3d4e5f6a7b8c9d0"],
      "maxParticipants": 20,
      "settings": {
        "allowChat": true,
        "allowScreenShare": true,
        "allowRecording": false,
        "allowWhiteboard": true,
        "requirePassword": false,
        "maxDuration": 86400000
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Get All Rooms

```http
GET /rooms?page=1&limit=10&search=meeting&isPrivate=false
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 50)
- `search`: Search in room name/description
- `isPrivate`: Filter by privacy (true/false)
- `createdBy`: Filter by creator ID

**Response:**
```json
{
  "success": true,
  "data": {
    "rooms": [
      {
        "id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "name": "Team Meeting",
        "description": "Weekly team sync meeting",
        "isPrivate": false,
        "createdBy": {
          "id": "64f8a1b2c3d4e5f6a7b8c9d0",
          "name": "John Doe",
          "avatar": "https://via.placeholder.com/150"
        },
        "participantCount": 5,
        "maxParticipants": 20,
        "lastActivity": "2024-01-15T10:30:00.000Z",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### Get Room by ID

```http
GET /rooms/:roomId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "room": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "Team Meeting",
      "description": "Weekly team sync meeting",
      "isPrivate": false,
      "createdBy": {
        "id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "name": "John Doe",
        "avatar": "https://via.placeholder.com/150"
      },
      "participants": [
        {
          "id": "64f8a1b2c3d4e5f6a7b8c9d0",
          "name": "John Doe",
          "avatar": "https://via.placeholder.com/150",
          "isOnline": true
        }
      ],
      "maxParticipants": 20,
      "settings": {
        "allowChat": true,
        "allowScreenShare": true,
        "allowRecording": false,
        "allowWhiteboard": true,
        "requirePassword": false,
        "maxDuration": 86400000
      },
      "lastActivity": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Update Room

```http
PUT /rooms/:roomId
```

**Request Body:**
```json
{
  "name": "Updated Team Meeting",
  "description": "Updated description",
  "maxParticipants": 25,
  "settings": {
    "allowRecording": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Room updated successfully",
  "data": {
    "room": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "Updated Team Meeting",
      "description": "Updated description",
      "maxParticipants": 25,
      "settings": {
        "allowChat": true,
        "allowScreenShare": true,
        "allowRecording": true,
        "allowWhiteboard": true,
        "requirePassword": false,
        "maxDuration": 86400000
      },
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

### Delete Room

```http
DELETE /rooms/:roomId
```

**Response:**
```json
{
  "success": true,
  "message": "Room deleted successfully"
}
```

### Join Room

```http
POST /rooms/:roomId/join
```

**Request Body:**
```json
{
  "password": "roomPassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Joined room successfully",
  "data": {
    "room": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "Team Meeting",
      "participants": ["64f8a1b2c3d4e5f6a7b8c9d0"]
    }
  }
}
```

### Leave Room

```http
POST /rooms/:roomId/leave
```

**Response:**
```json
{
  "success": true,
  "message": "Left room successfully"
}
```

## 💬 Chat & Messages

### Get Room Messages

```http
GET /rooms/:roomId/messages?page=1&limit=50
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Messages per page (default: 50, max: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "content": "Hello everyone!",
        "type": "text",
        "user": {
          "id": "64f8a1b2c3d4e5f6a7b8c9d0",
          "name": "John Doe",
          "avatar": "https://via.placeholder.com/150"
        },
        "roomId": "64f8a1b2c3d4e5f6a7b8c9d0",
        "timestamp": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "pages": 3
    }
  }
}
```

### Send Message

```http
POST /rooms/:roomId/messages
```

**Request Body:**
```json
{
  "content": "Hello everyone!",
  "type": "text"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "message": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "content": "Hello everyone!",
      "type": "text",
      "user": {
        "id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "name": "John Doe",
        "avatar": "https://via.placeholder.com/150"
      },
      "roomId": "64f8a1b2c3d4e5f6a7b8c9d0",
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

## 📁 File Management

### Upload File

```http
POST /rooms/:roomId/files
Content-Type: multipart/form-data
```

**Request Body:**
```
file: [file]
description: "Important document"
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "file": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "filename": "64f8a1b2c3d4e5f6a7b8c9d0.pdf",
      "originalName": "document.pdf",
      "mimeType": "application/pdf",
      "size": 1024000,
      "description": "Important document",
      "uploadedBy": "64f8a1b2c3d4e5f6a7b8c9d0",
      "roomId": "64f8a1b2c3d4e5f6a7b8c9d0",
      "downloadUrl": "https://yourdomain.com/api/files/64f8a1b2c3d4e5f6a7b8c9d0/download",
      "uploadedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Get Room Files

```http
GET /rooms/:roomId/files?page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "originalName": "document.pdf",
        "mimeType": "application/pdf",
        "size": 1024000,
        "description": "Important document",
        "uploadedBy": {
          "id": "64f8a1b2c3d4e5f6a7b8c9d0",
          "name": "John Doe",
          "avatar": "https://via.placeholder.com/150"
        },
        "uploadedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

### Download File

```http
GET /files/:fileId/download
```

**Response:** File stream

### Delete File

```http
DELETE /files/:fileId
```

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

## 🎨 Whiteboard

### Get Whiteboard Data

```http
GET /rooms/:roomId/whiteboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "whiteboard": [
      {
        "id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "type": "draw",
        "data": {
          "points": [[100, 100], [200, 200]],
          "color": "#000000",
          "width": 2
        },
        "user": {
          "id": "64f8a1b2c3d4e5f6a7b8c9d0",
          "name": "John Doe"
        },
        "timestamp": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

### Update Whiteboard

```http
POST /rooms/:roomId/whiteboard
```

**Request Body:**
```json
{
  "type": "draw",
  "data": {
    "points": [[100, 100], [200, 200]],
    "color": "#000000",
    "width": 2
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Whiteboard updated successfully",
  "data": {
    "update": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "type": "draw",
      "data": {
        "points": [[100, 100], [200, 200]],
        "color": "#000000",
        "width": 2
      },
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Clear Whiteboard

```http
DELETE /rooms/:roomId/whiteboard
```

**Response:**
```json
{
  "success": true,
  "message": "Whiteboard cleared successfully"
}
```

## 📊 Health & Status

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

### Detailed Health Check

```http
GET /health/detailed
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "redis": "connected",
    "fileSystem": "writable"
  },
  "resources": {
    "memory": "45%",
    "cpu": "12%",
    "disk": "23%"
  }
}
```

### Metrics

```http
GET /health/metrics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "activeUsers": 25,
    "activeRooms": 8,
    "totalMeetings": 150,
    "totalDuration": 5400000,
    "system": {
      "memory": "45%",
      "cpu": "12%",
      "disk": "23%"
    }
  }
}
```

## 🔌 WebSocket Events

### Client to Server Events

- `join-room`: Join a room
- `leave-room`: Leave a room
- `chat-message`: Send chat message
- `whiteboard-update`: Update whiteboard
- `screen-share-start`: Start screen sharing
- `screen-share-stop`: Stop screen sharing
- `file-shared`: Share file
- `status-update`: Update user status

### Server to Client Events

- `room-joined`: Confirmation of room join
- `room-error`: Room-related errors
- `participant-joined`: New participant joined
- `participant-left`: Participant left
- `chat-message`: New chat message
- `whiteboard-update`: Whiteboard update
- `screen-share-started`: Screen sharing started
- `screen-share-stopped`: Screen sharing stopped
- `file-shared`: New file shared
- `participant-status-updated`: Participant status changed

## ⚠️ Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

### Common Error Codes

- `AUTHENTICATION_ERROR`: Invalid or missing token
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `VALIDATION_ERROR`: Invalid input data
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource already exists
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error

## 📝 Rate Limiting

### Limits by Endpoint

- **Authentication**: 5 requests per minute
- **File Upload**: 2 requests per minute
- **API Calls**: 100 requests per 15 minutes
- **WebSocket Connections**: 10 per minute

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642233600
```

## 🔒 Security

### CORS Configuration

```javascript
{
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
```

### Security Headers

- `X-Frame-Options`: SAMEORIGIN
- `X-Content-Type-Options`: nosniff
- `X-XSS-Protection`: 1; mode=block
- `Referrer-Policy`: strict-origin-when-cross-origin
- `Content-Security-Policy`: Comprehensive CSP

## 📱 Mobile Support

### Responsive Design

All endpoints support mobile devices with:
- Responsive JSON responses
- Optimized file uploads
- Mobile-friendly error messages
- Touch-friendly WebSocket events

### Mobile-Specific Features

- Touch gesture support for whiteboard
- Mobile-optimized file handling
- Responsive chat interface
- Mobile-friendly room management

## 🧪 Testing

### Test Endpoints

```http
GET /test/health
POST /test/reset
GET /test/seed
```

### Test Data

Test endpoints provide sample data for development:
- Sample users
- Sample rooms
- Sample messages
- Sample files

## 📚 SDKs & Libraries

### Official SDKs

- **JavaScript/Node.js**: `npm install video-conference-sdk`
- **React**: `npm install video-conference-react`
- **Python**: `pip install video-conference-python`

### Community Libraries

- **Vue.js**: `npm install vue-video-conference`
- **Angular**: `npm install ng-video-conference`
- **Flutter**: `video_conference_flutter`

## 🔄 Webhooks

### Webhook Events

- `user.registered`: User registration
- `user.login`: User login
- `room.created`: Room creation
- `room.joined`: User joined room
- `meeting.started`: Meeting started
- `meeting.ended`: Meeting ended

### Webhook Configuration

```http
POST /webhooks
```

**Request Body:**
```json
{
  "url": "https://yourdomain.com/webhook",
  "events": ["user.registered", "room.created"],
  "secret": "webhook_secret_here"
}
```

---

**For more information, visit our [Documentation](https://docs.yourdomain.com) or [Support Portal](https://support.yourdomain.com).**