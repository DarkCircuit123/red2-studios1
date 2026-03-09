import React from 'react';
import ChatRoom from '@/components/ChatRoom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ChatPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <ChatRoom />
      </main>
      <Footer />
    </div>
  );
}
