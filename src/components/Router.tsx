import { MemberProvider } from '@/integrations';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import HomePage from './pages/HomePage';
import PortfolioPage from './pages/PortfolioPage';
import PortfolioDetailPage from './pages/PortfolioDetailPage';
import BookingPage from './pages/BookingPage';
// ... keep existing code (other imports) ...
import ProfilePage from './pages/ProfilePage';
import PrivatePage from './pages/PrivatePage';
import HangmanGamePage from './pages/HangmanGamePage';
import ClientRegisterPage from './pages/ClientRegisterPage';
import WorkPage from './pages/WorkPage';
import ContactPage from './pages/ContactPage';
import BackgroundMusicPlayer from './BackgroundMusicPlayer';
// ... keep existing code (other imports) ...
import React from 'react';

// Error boundary for music player
class MusicPlayerErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('[MusicPlayerErrorBoundary] Error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[MusicPlayerErrorBoundary] Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      console.warn('[MusicPlayerErrorBoundary] Music player failed to load, continuing without music');
      return null; // Silently fail - don't break the router
    }
    return this.props.children;
  }
}

// Layout component that includes ScrollToTop and BackgroundMusicPlayer
function Layout() {
  return (
    <>
      <ScrollToTop />
      <MusicPlayerErrorBoundary>
        <BackgroundMusicPlayer />
      </MusicPlayerErrorBoundary>
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "portfolio",
        element: <PortfolioPage />,
      },
      {
        path: "portfolio/:id",
        element: <PortfolioDetailPage />,
      },
      {
        path: "booking",
        element: <BookingPage />,
      },

      {
        path: "profile",
        element: (
          <MemberProtectedRoute>
            <ProfilePage />
          </MemberProtectedRoute>
        ),
      },
      {
        path: "private",
        element: <PrivatePage />,
      },
      {
        path: "play",
        element: <HangmanGamePage />,
      },
      {
        path: "client-register",
        element: <ClientRegisterPage />,
      },
      {
        path: "work",
        element: <WorkPage />,
      },
      {
        path: "contact",
        element: <ContactPage />,
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
], {
  basename: import.meta.env.BASE_NAME,
});

export default function AppRouter() {
  return (
    <MemberProvider>
      <RouterProvider router={router} />
    </MemberProvider>
  );
}
