import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Edit3,
  Save,
  X,
  Shield,
  Bell,
  Monitor,
  Palette,
  Globe,
  Key,
  Trash2,
  LogOut,
  ArrowLeft,
  Settings
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();
  
  // Profile state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    avatar: null
  });
  
  // Settings state
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    privacy: {
      profileVisibility: 'public',
      showOnlineStatus: true,
      allowMessages: true
    },
    appearance: {
      theme: 'dark',
      language: 'en',
      fontSize: 'medium'
    }
  });
  
  // UI state
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize profile data
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || '',
        avatar: user.avatar || null
      });
    }
  }, [user]);

  // Handle profile update
  const handleProfileUpdate = async () => {
    setIsLoading(true);
    try {
      // In a real app, you'd call the API to update the profile
      await updateProfile(profileData);
      setIsEditing(false);
      // Show success message
    } catch (error) {
      console.error('Failed to update profile:', error);
      // Show error message
    } finally {
      setIsLoading(false);
    }
  };

  // Handle avatar change
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setShowAvatarModal(true);
    }
  };

  // Handle avatar save
  const handleAvatarSave = async () => {
    if (!avatarFile) return;
    
    setIsLoading(true);
    try {
      // In a real app, you'd upload the file to a server
      const avatarUrl = URL.createObjectURL(avatarFile);
      setProfileData({ ...profileData, avatar: avatarUrl });
      setShowAvatarModal(false);
      setAvatarFile(null);
      // Show success message
    } catch (error) {
      console.error('Failed to update avatar:', error);
      // Show error message
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Handle settings change
  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">Please log in to view your profile</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-white">Profile & Settings</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
                    activeTab === 'profile'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
                    activeTab === 'settings'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
                    activeTab === 'security'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  <span>Security</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
                    activeTab === 'preferences'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <Palette className="w-5 h-5" />
                  <span>Preferences</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Profile Information</h2>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit Profile</span>
                      </button>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleProfileUpdate}
                          disabled={isLoading}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          <Save className="w-4 h-4" />
                          <span>{isLoading ? 'Saving...' : 'Save'}</span>
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                        >
                          <X className="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Avatar Section */}
                  <div className="flex items-center space-x-6 mb-8">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500">
                        {profileData.avatar ? (
                          <img
                            src={profileData.avatar}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-white text-2xl font-bold">
                              {profileData.name?.charAt(0) || 'U'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {isEditing && (
                        <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors duration-200">
                          <Camera className="w-4 h-4 text-white" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {profileData.name || 'Your Name'}
                      </h3>
                      <p className="text-gray-400">
                        {profileData.bio || 'No bio added yet'}
                      </p>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter your email"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter your phone number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={profileData.location}
                        onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter your location"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={profileData.bio}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                        disabled={!isEditing}
                        rows={4}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
                >
                  <h2 className="text-2xl font-bold text-white mb-6">Account Settings</h2>

                  {/* Notification Settings */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                      <Bell className="w-5 h-5" />
                      <span>Notifications</span>
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">Email Notifications</p>
                          <p className="text-gray-400 text-sm">Receive notifications via email</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications.email}
                            onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">Push Notifications</p>
                          <p className="text-gray-400 text-sm">Receive push notifications in browser</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications.push}
                            onChange={(e) => handleSettingChange('notifications', 'push', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">SMS Notifications</p>
                          <p className="text-gray-400 text-sm">Receive notifications via SMS</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications.sms}
                            onChange={(e) => handleSettingChange('notifications', 'sms', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Privacy Settings */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                      <Shield className="w-5 h-5" />
                      <span>Privacy</span>
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Profile Visibility
                        </label>
                        <select
                          value={settings.privacy.profileVisibility}
                          onChange={(e) => handleSettingChange('privacy', 'profileVisibility', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="public">Public</option>
                          <option value="friends">Friends Only</option>
                          <option value="private">Private</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">Show Online Status</p>
                          <p className="text-gray-400 text-sm">Allow others to see when you're online</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.privacy.showOnlineStatus}
                            onChange={(e) => handleSettingChange('privacy', 'showOnlineStatus', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">Allow Messages</p>
                          <p className="text-gray-400 text-sm">Allow others to send you messages</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.privacy.allowMessages}
                            onChange={(e) => handleSettingChange('privacy', 'allowMessages', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
                >
                  <h2 className="text-2xl font-bold text-white mb-6">Security Settings</h2>

                  <div className="space-y-6">
                    <div className="p-4 bg-slate-700/30 rounded-lg">
                      <h3 className="text-lg font-semibold text-white mb-2">Change Password</h3>
                      <p className="text-gray-400 text-sm mb-4">
                        Update your password to keep your account secure
                      </p>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                        Change Password
                      </button>
                    </div>

                    <div className="p-4 bg-slate-700/30 rounded-lg">
                      <h3 className="text-lg font-semibold text-white mb-2">Two-Factor Authentication</h3>
                      <p className="text-gray-400 text-sm mb-4">
                        Add an extra layer of security to your account
                      </p>
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200">
                        Enable 2FA
                      </button>
                    </div>

                    <div className="p-4 bg-slate-700/30 rounded-lg">
                      <h3 className="text-lg font-semibold text-white mb-2">Active Sessions</h3>
                      <p className="text-gray-400 text-sm mb-4">
                        Manage your active sessions across devices
                      </p>
                      <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200">
                        View Sessions
                      </button>
                    </div>

                    <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                      <h3 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h3>
                      <p className="text-red-300 text-sm mb-4">
                        These actions cannot be undone
                      </p>
                      <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'preferences' && (
                <motion.div
                  key="preferences"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
                >
                  <h2 className="text-2xl font-bold text-white mb-6">Appearance & Preferences</h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Theme
                      </label>
                      <select
                        value={settings.appearance.theme}
                        onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto (System)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Language
                      </label>
                      <select
                        value={settings.appearance.language}
                        onChange={(e) => handleSettingChange('appearance', 'language', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="zh">Chinese</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Font Size
                      </label>
                      <select
                        value={settings.appearance.fontSize}
                        onChange={(e) => handleSettingChange('appearance', 'fontSize', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Avatar Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4 border border-slate-700/50"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Update Avatar</h3>
            
            {avatarFile && (
              <div className="mb-4">
                <img
                  src={URL.createObjectURL(avatarFile)}
                  alt="Preview"
                  className="w-32 h-32 rounded-full mx-auto object-cover"
                />
              </div>
            )}
            
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowAvatarModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAvatarSave}
                disabled={!avatarFile || isLoading}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isLoading ? 'Saving...' : 'Save Avatar'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Profile;