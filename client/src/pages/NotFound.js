import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search, Users, Video } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  const quickActions = [
    {
      icon: Home,
      title: 'Go Home',
      description: 'Return to the main page',
      action: () => navigate('/'),
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Video,
      title: 'Join Meeting',
      description: 'Enter a meeting room',
      action: () => navigate('/dashboard'),
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Users,
      title: 'Browse Rooms',
      description: 'Find available rooms',
      action: () => navigate('/dashboard'),
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Search,
      title: 'Search',
      description: 'Look for specific content',
      action: () => navigate('/dashboard'),
      color: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="text-center max-w-2xl mx-auto">
        {/* 404 Number */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-9xl md:text-[12rem] font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            404
          </h1>
        </motion.div>

        {/* Error Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Page Not Found
          </h2>
          <p className="text-xl text-gray-400 leading-relaxed">
            Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
        >
          <button
            onClick={goBack}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all duration-200 transform hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Go Back</span>
          </button>
          
          <Link
            to="/"
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
          >
            <Home className="w-5 h-5" />
            <span>Go Home</span>
          </Link>
        </motion.div>

        {/* Quick Actions Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto"
        >
          {quickActions.map((action, index) => (
            <motion.button
              key={index}
              onClick={action.action}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-4 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200 text-left group"
            >
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-1">{action.title}</h3>
              <p className="text-gray-400 text-sm">{action.description}</p>
            </motion.button>
          ))}
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-12 text-gray-500"
        >
          <p className="text-sm">
            Need help? Contact our support team or check out our{' '}
            <Link to="/help" className="text-blue-400 hover:text-blue-300 underline">
              help center
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;