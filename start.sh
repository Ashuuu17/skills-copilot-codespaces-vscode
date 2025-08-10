#!/bin/bash

# Video Conference App Startup Script
echo "🚀 Starting Video Conference App..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if MongoDB is running (optional check)
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB not found. Make sure MongoDB is running or use MongoDB Atlas."
else
    if ! pgrep -x "mongod" > /dev/null; then
        echo "⚠️  MongoDB is not running. Please start MongoDB first."
    else
        echo "✅ MongoDB is running"
    fi
fi

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
if [ ! -d "node_modules" ]; then
    npm install
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from example..."
    cp .env.example .env
    echo "📝 Please edit server/.env with your configuration"
fi

# Install client dependencies
echo "📦 Installing client dependencies..."
cd ../client
if [ ! -d "node_modules" ]; then
    npm install
fi

# Check if client .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from example..."
    cp .env.example .env
fi

# Start the server in the background
echo "🖥️  Starting server..."
cd ../server
npm run dev &
SERVER_PID=$!

# Wait a moment for server to start
sleep 3

# Start the client
echo "🌐 Starting client..."
cd ../client
npm start &
CLIENT_PID=$!

echo ""
echo "🎉 Video Conference App is starting up!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both server and client"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping Video Conference App..."
    kill $SERVER_PID 2>/dev/null
    kill $CLIENT_PID 2>/dev/null
    echo "✅ Stopped successfully"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait