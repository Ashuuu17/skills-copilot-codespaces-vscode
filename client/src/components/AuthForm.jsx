import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, User, Lock, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AuthForm = ({ isLogin, onToggleMode }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const { login, register, isLoading } = useAuth();

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!isLogin && !formData.username) {
      toast.error('Username is required for registration');
      return;
    }

    try {
      const result = isLogin
        ? await login(formData.email, formData.password)
        : await register(formData.username, formData.email, formData.password);

      if (result.success) {
        toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="card p-8">
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-secondary-900 mb-2"
          >
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-secondary-600"
          >
            {isLogin
              ? 'Sign in to access your communication hub'
              : 'Join our real-time communication platform'
            }
          </motion.p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 h-5 w-5" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Enter your username"
                  required={!isLogin}
                />
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: isLogin ? 0.1 : 0.2 }}
          >
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 h-5 w-5" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field pl-10"
                placeholder="Enter your email"
                required
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: isLogin ? 0.2 : 0.3 }}
          >
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 h-5 w-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field pl-10 pr-10"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: isLogin ? 0.3 : 0.4 }}
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <Loader className="animate-spin h-5 w-5" />
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </motion.button>
        </form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center"
        >
          <p className="text-secondary-600">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button
              onClick={onToggleMode}
              className="ml-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AuthForm;