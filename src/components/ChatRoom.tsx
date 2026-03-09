import React, { useState, useEffect, useRef } from 'react';
import { useMember } from '@/integrations';
import { useChatStore, ChatMessage } from '@/lib/chatStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Heart, Share2, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image } from '@/components/ui/image';

export default function ChatRoom() {
  const { member, isAuthenticated, actions } = useMember();
  const { messages, addMessage } = useChatStore();
  const [messageText, setMessageText] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [likedMessages, setLikedMessages] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim() || !member) return;

    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      userId: member._id || '',
      userName: member.profile?.nickname || member.contact?.firstName || 'Anonymous',
      userAvatar: member.profile?.photo?.url,
      content: messageText,
      timestamp: new Date(),
    };

    addMessage(newMessage);
    setMessageText('');
  };

  const toggleLike = (messageId: string) => {
    const newLiked = new Set(likedMessages);
    if (newLiked.has(messageId)) {
      newLiked.delete(messageId);
    } else {
      newLiked.add(messageId);
    }
    setLikedMessages(newLiked);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <h1 className="text-5xl font-heading font-bold text-white mb-4">Messages</h1>
          <p className="text-lg font-paragraph text-gray-300 mb-8">
            Sign in to start chatting with others
          </p>
          <Button
            onClick={actions.login}
            className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white px-8 py-3 rounded-full font-bold text-lg"
          >
            Sign In
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-md border-b border-gray-700/50 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-heading font-bold text-white">Messages</h1>
            <p className="text-xs text-gray-400 flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-500'}`}></span>
              {isOnline ? 'Active now' : 'Away'}
            </p>
          </div>
          <button
            onClick={actions.logout}
            className="text-gray-400 hover:text-white transition-colors p-2"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gradient-to-br from-gray-900 via-gray-800 to-black"
        style={{
          scrollBehavior: 'smooth',
        }}
      >
        <div className="max-w-2xl mx-auto w-full">
          <AnimatePresence>
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center h-96 text-center"
              >
                <div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-red-500 mx-auto mb-4 flex items-center justify-center">
                    <Send className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-gray-400 font-paragraph text-base">
                    No messages yet
                  </p>
                  <p className="text-gray-500 font-paragraph text-sm mt-1">
                    Start a conversation!
                  </p>
                </div>
              </motion.div>
            ) : (
              messages.map((msg, index) => {
                const isCurrentUser = msg.userId === member?._id;
                const isLiked = likedMessages.has(msg.id);
                
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: index * 0.02, duration: 0.3 }}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} group`}
                  >
                    <div
                      className={`flex gap-2 max-w-xs lg:max-w-sm ${
                        isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br from-pink-500 to-red-500 overflow-hidden ring-2 ring-gray-700">
                          {msg.userAvatar ? (
                            <Image
                              src={msg.userAvatar}
                              alt={msg.userName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{msg.userName.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                      </div>

                      {/* Message Content */}
                      <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                        {/* Username */}
                        <p className="text-xs font-paragraph text-gray-400 px-3 mb-1">
                          {msg.userName}
                        </p>

                        {/* Message Bubble */}
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className={`px-4 py-2.5 rounded-2xl backdrop-blur-sm transition-all ${
                            isCurrentUser
                              ? 'bg-gradient-to-br from-pink-500 to-red-500 text-white rounded-br-sm'
                              : 'bg-gray-700/60 text-gray-100 rounded-bl-sm hover:bg-gray-700'
                          }`}
                        >
                          <p className="font-paragraph break-words text-sm leading-relaxed">
                            {msg.content}
                          </p>
                        </motion.div>

                        {/* Time */}
                        <p className="text-xs font-paragraph text-gray-500 px-3 mt-1">
                          {msg.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className={`flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                        <motion.button
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => toggleLike(msg.id)}
                          className={`p-1.5 rounded-full transition-colors ${
                            isLiked
                              ? 'bg-red-500/30 text-red-400'
                              : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-1.5 rounded-full bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-black/50 backdrop-blur-md border-t border-gray-700/50 px-4 py-3 sticky bottom-0">
        <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto">
          <div className="flex gap-2 items-end">
            {/* Input Field */}
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Say something..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                disabled={!isOnline}
                className="w-full bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-500 rounded-full px-4 py-2.5 focus:border-pink-500 focus:ring-pink-500/20 transition-all"
              />
            </div>

            {/* Send Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={!messageText.trim() || !isOnline}
              className={`p-2.5 rounded-full transition-all ${
                messageText.trim() && isOnline
                  ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white hover:from-pink-600 hover:to-red-600 shadow-lg shadow-pink-500/50'
                  : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}
