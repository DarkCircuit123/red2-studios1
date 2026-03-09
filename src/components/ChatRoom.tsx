import React, { useState, useEffect, useRef } from 'react';
import { useMember } from '@/integrations';
import { useChatStore, ChatMessage } from '@/lib/chatStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image } from '@/components/ui/image';

export default function ChatRoom() {
  const { member, isAuthenticated, actions } = useMember();
  const { messages, addMessage } = useChatStore();
  const [messageText, setMessageText] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-heading font-bold text-foreground mb-4">Chat Room</h1>
          <p className="text-lg font-paragraph text-foreground/70 mb-8">
            Sign in to join the conversation
          </p>
          <Button
            onClick={actions.login}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg"
          >
            Sign In to Chat
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 shadow-md">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-heading font-bold">Chat Room</h1>
            <p className="text-sm opacity-90 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              {isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
          <Button
            onClick={actions.logout}
            variant="outline"
            className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
        <div className="max-w-4xl mx-auto w-full">
          <AnimatePresence>
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center h-full text-center"
              >
                <div>
                  <p className="text-foreground/50 font-paragraph text-lg">
                    No messages yet. Start the conversation!
                  </p>
                </div>
              </motion.div>
            ) : (
              messages.map((msg, index) => {
                const isCurrentUser = msg.userId === member?._id;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex gap-3 max-w-xs lg:max-w-md ${
                        isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white ${
                          isCurrentUser ? 'bg-primary' : 'bg-secondary'
                        }`}
                      >
                        {msg.userAvatar ? (
                          <Image src={msg.userAvatar} alt={msg.userName} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          msg.userName.charAt(0).toUpperCase()
                        )}
                      </div>

                      {/* Message Bubble */}
                      <div className={isCurrentUser ? 'items-end' : 'items-start'}>
                        <p className="text-xs font-paragraph text-foreground/60 px-3 mb-1">
                          {msg.userName}
                        </p>
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            isCurrentUser
                              ? 'bg-primary text-primary-foreground rounded-br-none'
                              : 'bg-secondary/10 text-foreground rounded-bl-none'
                          }`}
                        >
                          <p className="font-paragraph break-words">{msg.content}</p>
                        </div>
                        <p className="text-xs font-paragraph text-foreground/40 px-3 mt-1">
                          {msg.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-background border-t border-foreground/10 p-4 shadow-lg">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="flex-1 rounded-lg border-foreground/20 focus:border-primary"
              disabled={!isOnline}
            />
            <Button
              type="submit"
              disabled={!messageText.trim() || !isOnline}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 rounded-lg"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
