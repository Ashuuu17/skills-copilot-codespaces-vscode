// MongoDB initialization script for Video Conference App
// This script runs when the MongoDB container starts for the first time

print('🚀 Initializing Video Conference App Database...');

// Switch to the application database
db = db.getSiblingDB('video-conference-app');

// Create collections with validation
print('📁 Creating collections...');

// Users collection
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'password'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 2,
          maxLength: 50,
          description: 'User name must be a string between 2 and 50 characters'
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'Email must be a valid email address'
        },
        password: {
          bsonType: 'string',
          minLength: 6,
          description: 'Password must be at least 6 characters long'
        },
        avatar: {
          bsonType: 'string',
          description: 'Avatar URL must be a string'
        },
        phone: {
          bsonType: 'string',
          description: 'Phone number must be a string'
        },
        location: {
          bsonType: 'string',
          description: 'Location must be a string'
        },
        bio: {
          bsonType: 'string',
          maxLength: 500,
          description: 'Bio must be a string with maximum 500 characters'
        },
        isOnline: {
          bsonType: 'bool',
          description: 'Online status must be a boolean'
        },
        lastSeen: {
          bsonType: 'date',
          description: 'Last seen must be a date'
        }
      }
    }
  }
});

// Rooms collection
db.createCollection('rooms', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'createdBy'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 3,
          maxLength: 100,
          description: 'Room name must be a string between 3 and 100 characters'
        },
        description: {
          bsonType: 'string',
          maxLength: 500,
          description: 'Room description must be a string with maximum 500 characters'
        },
        isPrivate: {
          bsonType: 'bool',
          description: 'Private status must be a boolean'
        },
        password: {
          bsonType: 'string',
          description: 'Room password must be a string'
        },
        createdBy: {
          bsonType: 'objectId',
          description: 'Creator ID must be an ObjectId'
        },
        participants: {
          bsonType: 'array',
          items: {
            bsonType: 'objectId'
          },
          description: 'Participants must be an array of ObjectIds'
        },
        maxParticipants: {
          bsonType: 'int',
          minimum: 2,
          maximum: 100,
          description: 'Maximum participants must be between 2 and 100'
        },
        settings: {
          bsonType: 'object',
          properties: {
            allowChat: { bsonType: 'bool' },
            allowScreenShare: { bsonType: 'bool' },
            allowRecording: { bsonType: 'bool' },
            allowWhiteboard: { bsonType: 'bool' },
            requirePassword: { bsonType: 'bool' },
            maxDuration: { bsonType: 'int' }
          }
        }
      }
    }
  }
});

// Files collection
db.createCollection('files', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['filename', 'originalName', 'mimeType', 'size', 'uploadedBy', 'roomId'],
      properties: {
        filename: {
          bsonType: 'string',
          description: 'Filename must be a string'
        },
        originalName: {
          bsonType: 'string',
          description: 'Original filename must be a string'
        },
        mimeType: {
          bsonType: 'string',
          description: 'MIME type must be a string'
        },
        size: {
          bsonType: 'int',
          minimum: 0,
          description: 'File size must be a positive integer'
        },
        uploadedBy: {
          bsonType: 'objectId',
          description: 'Uploader ID must be an ObjectId'
        },
        roomId: {
          bsonType: 'objectId',
          description: 'Room ID must be an ObjectId'
        },
        description: {
          bsonType: 'string',
          maxLength: 1000,
          description: 'File description must be a string with maximum 1000 characters'
        },
        hash: {
          bsonType: 'string',
          description: 'File hash must be a string'
        }
      }
    }
  }
});

// Create indexes for better performance
print('🔍 Creating indexes...');

// Users collection indexes
db.users.createIndex({ "email": 1 }, { unique: true, background: true });
db.users.createIndex({ "name": 1 }, { background: true });
db.users.createIndex({ "isOnline": 1 }, { background: true });
db.users.createIndex({ "lastSeen": 1 }, { background: true });

// Rooms collection indexes
db.rooms.createIndex({ "name": 1 }, { background: true });
db.rooms.createIndex({ "createdBy": 1 }, { background: true });
db.rooms.createIndex({ "isPrivate": 1 }, { background: true });
db.rooms.createIndex({ "participants": 1 }, { background: true });
db.rooms.createIndex({ "lastActivity": 1 }, { background: true });
db.rooms.createIndex({ "createdAt": 1 }, { background: true });

// Files collection indexes
db.files.createIndex({ "uploadedBy": 1 }, { background: true });
db.files.createIndex({ "roomId": 1 }, { background: true });
db.files.createIndex({ "mimeType": 1 }, { background: true });
db.files.createIndex({ "uploadedAt": 1 }, { background: true });
db.files.createIndex({ "hash": 1 }, { background: true });

// Create text indexes for search functionality
db.users.createIndex({ "name": "text", "email": "text", "bio": "text" });
db.rooms.createIndex({ "name": "text", "description": "text" });

print('✅ Database initialization completed successfully!');

// Insert sample data for development (optional)
if (process.env.NODE_ENV === 'development') {
  print('📝 Inserting sample data for development...');
  
  // Sample user
  const sampleUser = {
    name: 'Demo User',
    email: 'demo@example.com',
    password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5u.G', // password123
    avatar: 'https://via.placeholder.com/150/007bff/ffffff?text=DU',
    phone: '+1234567890',
    location: 'Demo City',
    bio: 'This is a demo user for testing purposes.',
    isOnline: false,
    lastSeen: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  db.users.insertOne(sampleUser);
  print('👤 Sample user created: demo@example.com');
  
  // Sample room
  const sampleRoom = {
    name: 'Welcome Room',
    description: 'A welcoming room for new users to get started with video conferencing.',
    isPrivate: false,
    createdBy: sampleUser._id,
    participants: [sampleUser._id],
    maxParticipants: 20,
    settings: {
      allowChat: true,
      allowScreenShare: true,
      allowRecording: false,
      allowWhiteboard: true,
      requirePassword: false,
      maxDuration: 24 * 60 * 60 * 1000
    },
    lastActivity: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  db.rooms.insertOne(sampleRoom);
  print('🏠 Sample room created: Welcome Room');
  
  print('✅ Sample data inserted successfully!');
}

print('🎉 Video Conference App database is ready to use!');
print('📊 Database: ' + db.getName());
print('📁 Collections: ' + db.getCollectionNames().join(', '));