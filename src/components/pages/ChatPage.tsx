import React from 'react';
import ChatRoom from '@/components/ChatRoom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import ErrorBoundary from '@/components/ErrorBoundary';

function ChatPage() {
  return (
    <ErrorBoundary>
      <SEOHead
        title="Chat | RED2 STUDIOS"
        description="Connect with our team in real-time."
        type="website"
        noindex
      />
      <div className="min-h-screen flex flex-col bg-black">
        <Header />
        <main className="flex-1">
          <ChatRoom />
        </main>
        <Footer />
      </div>
    </ErrorBoundary>
  );
}

export default React.memo(ChatPage);
