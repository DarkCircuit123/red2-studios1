import React, { useState, useEffect, useRef } from 'react';
import { useMember } from '@/integrations';
import { useChatStore, ChatMessage } from '@/lib/chatStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Heart, Share2, MoreHorizontal, Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image } from '@/components/ui/image';

export default function ChatRoom() {
  const { member, isAuthenticated, actions } = useMember();
  const { messages, addMessage } = useChatStore();
  const [messageText, setMessageText] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [likedMessages, setLikedMessages] = useState<Set<string>>(new Set());
  const [sendingMessageId, setSendingMessageId] = useState<string | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim() || !member) return;

    const messageId = crypto.randomUUID();
    setSendingMessageId(messageId);

    const newMessage: ChatMessage = {
      id: messageId,
      userId: member._id || '',
      userName: member.profile?.nickname || member.contact?.firstName || 'Anonymous',
      userAvatar: member.profile?.photo?.url,
      content: messageText,
      timestamp: new Date(),
    };

    // Simulate network delay for realistic feel
    setTimeout(() => {
      addMessage(newMessage);
      setMessageText('');
      setSendingMessageId(null);
      inputRef.current?.focus();
    }, 150);
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <h1 className="text-6xl font-heading font-bold text-white mb-3">Messages</h1>
          <p className="text-base font-paragraph text-gray-400 mb-8 leading-relaxed">
            Sign in to start chatting with others
          </p>
          <Button
            onClick={actions.login}
            className="bg-gradient-to-r from-[#ff0050] to-[#ff0050] hover:from-[#e60047] hover:to-[#e60047] text-white px-8 py-3 rounded-full font-bold text-base transition-all duration-200 shadow-lg shadow-red-500/30"
          >
            Sign In
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-sm border-b border-gray-800/50 px-4 py-3 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-heading font-bold text-white tracking-tight">Messages</h1>
            <p className="text-xs text-gray-500 flex items-center gap-2 mt-1.5">
              <span className={`w-2 h-2 rounded-full transition-colors ${isOnline ? 'bg-green-400' : 'bg-gray-600'}`}></span>
              <span className="font-paragraph">{isOnline ? 'Active now' : 'Away'}</span>
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={actions.logout}
            className="text-gray-500 hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-gray-900/50"
          >
            <MoreHorizontal className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 bg-black"
        style={{
          scrollBehavior: 'smooth',
          scrollbarWidth: 'thin',
          scrollbarColor: '#404040 transparent',
        }}
      >
        <style>{`
          div::-webkit-scrollbar {
            width: 6px;
          }
          div::-webkit-scrollbar-track {
            background: transparent;
          }
          div::-webkit-scrollbar-thumb {
            background: #404040;
            border-radius: 3px;
          }
          div::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        `}</style>
        <div className="max-w-3xl mx-auto w-full">
          <AnimatePresence>
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center h-96 text-center"
              >
                <div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ff0050] to-[#ff0050] mx-auto mb-4 flex items-center justify-center">
                    <Send className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-gray-400 font-paragraph text-sm font-medium">
                    No messages yet
                  </p>
                  <p className="text-gray-600 font-paragraph text-xs mt-2">
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
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: index * 0.01, duration: 0.25, ease: 'easeOut' }}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-3 group`}
                    onMouseEnter={() => setHoveredMessageId(msg.id)}
                    onMouseLeave={() => setHoveredMessageId(null)}
                  >
                    <div
                      className={`flex gap-2.5 max-w-xs lg:max-w-md ${
                        isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0 pt-0.5">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-[#ff0050] to-[#ff0050] overflow-hidden ring-1.5 ring-gray-800">
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
                        <p className="text-xs font-paragraph text-gray-500 px-3 mb-1 font-medium">
                          {msg.userName}
                        </p>

                        {/* Message Bubble */}
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          className={`px-4 py-2 rounded-2xl transition-all duration-150 ${
                            isCurrentUser
                              ? 'bg-gradient-to-br from-[#ff0050] to-[#ff0050] text-white rounded-br-sm shadow-lg shadow-red-500/20'
                              : 'bg-gray-900 text-gray-100 rounded-bl-sm hover:bg-gray-800/80'
                          }`}
                        >
                          <p className="font-paragraph break-words text-sm leading-relaxed font-normal">
                            {msg.content}
                          </p>
                        </motion.div>

                        {/* Time */}
                        <p className="text-xs font-paragraph text-gray-600 px-3 mt-1">
                          {msg.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: hoveredMessageId === msg.id ? 1 : 0 }}
                        transition={{ duration: 0.15 }}
                        className={`flex gap-1.5 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.85 }}
                          onClick={() => toggleLike(msg.id)}
                          className={`p-1.5 rounded-full transition-all duration-150 ${
                            isLiked
                              ? 'bg-red-500/30 text-[#ff0050] shadow-lg shadow-red-500/20'
                              : 'bg-gray-800/50 text-gray-500 hover:bg-gray-700/50 hover:text-gray-400'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.85 }}
                          className="p-1.5 rounded-full bg-gray-800/50 text-gray-500 hover:bg-gray-700/50 hover:text-gray-400 transition-all duration-150"
                        >
                          <Share2 className="w-4 h-4" />
                        </motion.button>
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} className="h-2" />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-black/80 backdrop-blur-sm border-t border-gray-800/50 px-4 py-3 sticky bottom-0">
        <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto">
          <div className="flex gap-2.5 items-end">
            {/* Emoji Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              className="p-2.5 rounded-full text-gray-500 hover:text-gray-300 hover:bg-gray-900/50 transition-all duration-150"
            >
              <Smile className="w-5 h-5" />
            </motion.button>

            {/* Input Field */}
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Say something..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                disabled={!isOnline}
                className="w-full bg-gray-900/50 border border-gray-800/50 text-white placeholder-gray-600 rounded-full px-4 py-2.5 focus:border-[#ff0050] focus:ring-1 focus:ring-[#ff0050]/30 transition-all duration-150 text-sm font-paragraph"
              />
            </div>

            {/* Send Button */}
            <motion.button
              whileHover={messageText.trim() && isOnline ? { scale: 1.08 } : {}}
              whileTap={messageText.trim() && isOnline ? { scale: 0.92 } : {}}
              type="submit"
              disabled={!messageText.trim() || !isOnline || sendingMessageId !== null}
              className={`p-2.5 rounded-full transition-all duration-150 flex-shrink-0 ${
                messageText.trim() && isOnline && sendingMessageId === null
                  ? 'bg-gradient-to-r from-[#ff0050] to-[#ff0050] text-white hover:shadow-lg hover:shadow-red-500/40 shadow-md shadow-red-500/20'
                  : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
              }`}
            >
              <motion.div
                animate={sendingMessageId !== null ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 0.6, repeat: sendingMessageId !== null ? Infinity : 0 }}
              >
                <Send className="w-5 h-5" />
              </motion.div>
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}
