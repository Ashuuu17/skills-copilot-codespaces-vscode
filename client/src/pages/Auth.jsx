import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Shield, Users, Zap } from 'lucide-react';
import AuthForm from '../components/AuthForm';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);

  const features = [
    {
      icon: Video,
      title: 'HD Video Calls',
      description: 'Crystal clear video conferencing with multiple participants',
    },
    {
      icon: Shield,
      title: 'End-to-End Encryption',
      description: 'Your conversations are protected with military-grade encryption',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Screen sharing, whiteboard, and file sharing in real-time',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Built with WebRTC for instant, low-latency communication',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-screen">
          {/* Left side - Features */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div>
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl lg:text-5xl font-bold text-secondary-900 mb-4"
              >
                Real-Time
                <span className="text-primary-600"> Communication</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl text-secondary-600 mb-8"
              >
                Connect, collaborate, and communicate with advanced video conferencing
                and real-time collaboration tools.
              </motion.p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="glass-morphism rounded-xl p-6 backdrop-blur-sm"
                >
                  <div className="flex items-center mb-3">
                    <div className="bg-primary-100 p-2 rounded-lg mr-3">
                      <feature.icon className="h-6 w-6 text-primary-600" />
                    </div>
                    <h3 className="font-semibold text-secondary-900">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-secondary-600 text-sm">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center space-x-6 text-sm text-secondary-500"
            >
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>WebRTC Technology</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary-500 rounded-full mr-2"></div>
                <span>End-to-End Encrypted</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                <span>Real-Time Sync</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right side - Auth Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex justify-center lg:justify-end"
          >
            <AuthForm
              isLogin={isLogin}
              onToggleMode={() => setIsLogin(!isLogin)}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Auth;