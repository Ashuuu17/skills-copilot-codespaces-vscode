import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, Paperclip } from 'lucide-react';

const ChatPanel = ({ socket, roomId, username, userId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    socket.on('chat-message', (messageData) => {
      setMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        ...messageData,
        timestamp: new Date(messageData.timestamp)
      }]);
    });

    // Listen for typing indicators
    socket.on('user-typing', ({ username: typingUsername, isTyping }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (isTyping && typingUsername !== username) {
          newSet.add(typingUsername);
        } else {
          newSet.delete(typingUsername);
        }
        return newSet;
      });
    });

    return () => {
      socket.off('chat-message');
      socket.off('user-typing');
    };
  }, [socket, username]);

  // Handle typing indicators
  const handleTyping = (isCurrentlyTyping) => {
    if (isCurrentlyTyping !== isTyping) {
      setIsTyping(isCurrentlyTyping);
      socket?.emit('user-typing', {
        roomId,
        username,
        isTyping: isCurrentlyTyping
      });
    }

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    if (isCurrentlyTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket?.emit('user-typing', {
          roomId,
          username,
          isTyping: false
        });
      }, 2000);
    }
  };

  // Send message
  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    const messageData = {
      roomId,
      message: newMessage.trim()
    };

    socket.emit('chat-message', messageData);
    setNewMessage('');
    handleTyping(false);
  };

  // Handle input changes
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    handleTyping(e.target.value.length > 0);
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Check if message is from current user
  const isOwnMessage = (message) => {
    return message.userId === userId;
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Chat Header */}
      <div className="p-4 border-b border-secondary-200">
        <h3 className="font-semibold text-secondary-900">Chat</h3>
        <p className="text-sm text-secondary-600">
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md ${
                isOwnMessage(message) ? 'order-2' : 'order-1'
              }`}>
                {!isOwnMessage(message) && (
                  <div className="flex items-center mb-1">
                    <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-2">
                      <span className="text-xs font-semibold text-primary-600">
                        {message.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-secondary-600">
                      {message.username}
                    </span>
                  </div>
                )}
                
                <div className={`rounded-lg px-3 py-2 ${
                  isOwnMessage(message)
                    ? 'bg-primary-600 text-white'
                    : 'bg-secondary-100 text-secondary-900'
                }`}>
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.message}
                  </p>
                  <p className={`text-xs mt-1 ${
                    isOwnMessage(message)
                      ? 'text-primary-100'
                      : 'text-secondary-500'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicators */}
        {typingUsers.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center space-x-2 text-secondary-500"
          >
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <span className="text-sm">
              {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
            </span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-secondary-200">
        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows="1"
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Send message"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            <button
              className="p-1 text-secondary-400 hover:text-secondary-600 transition-colors"
              title="Add emoji"
            >
              <Smile className="h-4 w-4" />
            </button>
            <button
              className="p-1 text-secondary-400 hover:text-secondary-600 transition-colors"
              title="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </button>
          </div>
          
          {isTyping && (
            <span className="text-xs text-secondary-500">
              Typing...
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;