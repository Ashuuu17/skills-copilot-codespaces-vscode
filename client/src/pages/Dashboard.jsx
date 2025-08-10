import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Video, 
  Plus, 
  LogOut, 
  Settings, 
  Users, 
  Clock,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [roomId, setRoomId] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };

  const createRoom = () => {
    const newRoomId = generateRoomId();
    setRoomId(newRoomId);
    setIsCreatingRoom(true);
  };

  const joinRoom = () => {
    if (!roomId.trim()) {
      toast.error('Please enter a room ID');
      return;
    }
    navigate(`/room/${roomId}`);
  };

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      toast.success('Room ID copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy room ID');
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  const recentRooms = [
    { id: 'room123', name: 'Team Standup', lastJoined: '2 hours ago', participants: 5 },
    { id: 'room456', name: 'Project Review', lastJoined: '1 day ago', participants: 3 },
    { id: 'room789', name: 'Client Meeting', lastJoined: '2 days ago', participants: 8 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-lg border-b border-secondary-200 sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-primary-600 p-2 rounded-lg">
                <Video className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900">
                  RTC Communication
                </h1>
                <p className="text-secondary-600">Real-time collaboration platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-sm">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-secondary-900">
                    {user?.username}
                  </p>
                  <p className="text-xs text-secondary-500">{user?.email}</p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="btn-secondary p-2"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="card p-8">
              <h2 className="text-2xl font-bold text-secondary-900 mb-6">
                Start a Meeting
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={createRoom}
                  className="group bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg"
                >
                  <div className="flex items-center justify-center mb-4">
                    <Plus className="h-8 w-8 group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Create Room</h3>
                  <p className="text-primary-100 text-sm">
                    Start a new video conference room
                  </p>
                </motion.button>

                <div className="space-y-4">
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="Enter room ID"
                    className="input-field w-full"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={joinRoom}
                    className="w-full btn-secondary p-3 text-center"
                  >
                    Join Room
                  </motion.button>
                </div>
              </div>

              {/* Room ID Display */}
              {isCreatingRoom && roomId && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 p-4 bg-secondary-50 rounded-lg border"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-secondary-700 mb-1">
                        Room ID Created
                      </p>
                      <p className="text-lg font-mono text-secondary-900">{roomId}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={copyRoomId}
                        className="btn-secondary p-2"
                        title="Copy Room ID"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => navigate(`/room/${roomId}`)}
                        className="btn-primary px-4 py-2"
                      >
                        Join Now
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Features Overview */}
            <div className="card p-6">
              <h3 className="text-xl font-bold text-secondary-900 mb-4">
                Platform Features
              </h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-primary-50 border border-primary-100">
                  <Video className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-secondary-900">HD Video Calls</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-50 border border-green-100">
                  <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-secondary-900">Screen Sharing</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-purple-50 border border-purple-100">
                  <Settings className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-secondary-900">Whiteboard</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-orange-50 border border-orange-100">
                  <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-secondary-900">File Sharing</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Quick Stats */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-secondary-900 mb-4">
                Quick Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-secondary-600">Meetings Today</span>
                  <span className="font-semibold text-primary-600">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-secondary-600">Total Hours</span>
                  <span className="font-semibold text-secondary-900">8.5h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-secondary-600">Participants</span>
                  <span className="font-semibold text-secondary-900">24</span>
                </div>
              </div>
            </div>

            {/* Recent Rooms */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-secondary-900 mb-4">
                Recent Rooms
              </h3>
              <div className="space-y-3">
                {recentRooms.map((room, index) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="p-3 rounded-lg border border-secondary-200 hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-all"
                    onClick={() => navigate(`/room/${room.id}`)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-secondary-900 text-sm">
                        {room.name}
                      </h4>
                      <span className="text-xs text-secondary-500">
                        {room.participants} users
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-secondary-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {room.lastJoined}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;