import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import {
  Video,
  Users,
  Plus,
  Search,
  Clock,
  Calendar,
  Settings,
  LogOut,
  User,
  Bell,
  FileText,
  Share2,
  Edit3,
  Trash2,
  Eye,
  Lock
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  
  const [rooms, setRooms] = useState([]);
  const [recentRooms, setRecentRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [newRoomData, setNewRoomData] = useState({
    name: '',
    description: '',
    isPrivate: false,
    password: ''
  });

  // Mock data - in a real app, this would come from the API
  useEffect(() => {
    const mockRooms = [
      {
        id: '1',
        name: 'Team Meeting',
        description: 'Weekly team sync and project updates',
        isPrivate: false,
        participants: 8,
        lastActive: '2 hours ago',
        createdBy: 'John Doe'
      },
      {
        id: '2',
        name: 'Client Presentation',
        description: 'Q4 results presentation for stakeholders',
        isPrivate: true,
        participants: 5,
        lastActive: '1 day ago',
        createdBy: 'Jane Smith'
      },
      {
        id: '3',
        name: 'Design Review',
        description: 'UI/UX design feedback session',
        isPrivate: false,
        participants: 12,
        lastActive: '3 days ago',
        createdBy: 'Mike Johnson'
      }
    ];

    const mockRecentRooms = [
      {
        id: '1',
        name: 'Team Meeting',
        lastJoined: '2 hours ago',
        participants: 8
      },
      {
        id: '4',
        name: 'Code Review',
        lastJoined: '1 day ago',
        participants: 4
      }
    ];

    setRooms(mockRooms);
    setRecentRooms(mockRecentRooms);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCreateRoom = () => {
    if (!newRoomData.name.trim()) return;
    
    // In a real app, this would create a room via API
    const newRoom = {
      id: Date.now().toString(),
      name: newRoomData.name,
      description: newRoomData.description,
      isPrivate: newRoomData.isPrivate,
      participants: 1,
      lastActive: 'Just now',
      createdBy: user.name
    };
    
    setRooms([newRoom, ...rooms]);
    setNewRoomData({ name: '', description: '', isPrivate: false, password: '' });
    setIsCreatingRoom(false);
    
    // Navigate to the new room
    navigate(`/room/${newRoom.id}`);
  };

  const handleJoinRoom = (roomId) => {
    navigate(`/room/${roomId}`);
  };

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'Total Rooms', value: rooms.length, icon: Video, color: 'blue' },
    { label: 'Active Users', value: '24', icon: Users, color: 'green' },
    { label: 'Recent Meetings', value: recentRooms.length, icon: Clock, color: 'purple' },
    { label: 'Files Shared', value: '156', icon: FileText, color: 'orange' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">VC</span>
              </div>
              <h1 className="text-xl font-semibold text-white">Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-400' : 'bg-red-400'
                }`}></div>
                <span className="text-sm text-gray-400">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              {/* Notifications */}
              <button className="p-2 text-gray-400 hover:text-white transition-colors duration-200">
                <Bell className="w-5 h-5" />
              </button>
              
              {/* User Menu */}
              <div className="relative group">
                <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-700/50 transition-colors duration-200">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <span className="text-white text-sm hidden md:block">{user?.name}</span>
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-lg border border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 transition-colors duration-200"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 transition-colors duration-200"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                    <hr className="border-slate-700 my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-slate-700 transition-colors duration-200"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.name}!
          </h2>
          <p className="text-gray-400">
            Ready to collaborate? Join a meeting or create a new one.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-500/20`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setIsCreatingRoom(true)}
              className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Room
            </button>
            <button className="flex items-center justify-center px-6 py-3 border-2 border-slate-600 text-white font-semibold rounded-lg hover:border-slate-500 hover:bg-slate-700/50 transition-all duration-200">
              <Calendar className="w-5 h-5 mr-2" />
              Schedule Meeting
            </button>
            <button className="flex items-center justify-center px-6 py-3 border-2 border-slate-600 text-white font-semibold rounded-lg hover:border-slate-500 hover:bg-slate-700/50 transition-all duration-200">
              <Share2 className="w-5 h-5 mr-2" />
              Share Screen
            </button>
          </div>
        </motion.div>

        {/* Search and Room Management */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Rooms */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
              <div className="p-6 border-b border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">Recent Rooms</h3>
                  <Link
                    to="/rooms"
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-200"
                  >
                    View All
                  </Link>
                </div>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search rooms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="p-6">
                {filteredRooms.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No rooms found</p>
                ) : (
                  <div className="space-y-4">
                    {filteredRooms.map((room) => (
                      <div
                        key={room.id}
                        className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-all duration-200"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-white font-medium">{room.name}</h4>
                            {room.isPrivate ? (
                              <Lock className="w-4 h-4 text-yellow-400" />
                            ) : (
                              <Eye className="w-4 h-4 text-green-400" />
                            )}
                          </div>
                          <p className="text-gray-400 text-sm mb-2">{room.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{room.participants} participants</span>
                            <span>•</span>
                            <span>Last active: {room.lastActive}</span>
                            <span>•</span>
                            <span>Created by {room.createdBy}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleJoinRoom(room.id)}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                          >
                            Join
                          </button>
                          <button className="p-2 text-gray-400 hover:text-white transition-colors duration-200">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-red-400 transition-colors duration-200">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Recent Activity</h3>
              
              <div className="space-y-4">
                {recentRooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-all duration-200 cursor-pointer"
                    onClick={() => handleJoinRoom(room.id)}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <Video className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white text-sm font-medium">{room.name}</h4>
                      <p className="text-gray-400 text-xs">{room.lastJoined}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-sm font-medium">{room.participants}</p>
                      <p className="text-gray-400 text-xs">participants</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-700/50">
                <Link
                  to="/activity"
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-200"
                >
                  View All Activity
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Create Room Modal */}
      {isCreatingRoom && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4 border border-slate-700/50"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Create New Room</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Room Name
                </label>
                <input
                  type="text"
                  value={newRoomData.name}
                  onChange={(e) => setNewRoomData({ ...newRoomData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter room name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newRoomData.description}
                  onChange={(e) => setNewRoomData({ ...newRoomData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter room description"
                  rows="3"
                />
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={newRoomData.isPrivate}
                  onChange={(e) => setNewRoomData({ ...newRoomData, isPrivate: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPrivate" className="text-sm text-gray-300">
                  Make room private
                </label>
              </div>
              
              {newRoomData.isPrivate && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={newRoomData.password}
                    onChange={(e) => setNewRoomData({ ...newRoomData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter room password"
                  />
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setIsCreatingRoom(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={!newRoomData.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Create Room
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;