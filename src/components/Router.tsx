import React, { Suspense } from 'react';
import { MemberProvider } from '@/integrations';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import SEOOptimizer from '@/components/SEOOptimizer';
import { useContentProtection } from '@/hooks/useContentProtection';
import { AppInitializer } from '@/components/AppInitializer';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Import all pages with explicit static imports
import HomePage from './pages/HomePage';
import PortfolioPage from './pages/PortfolioPage';
import PortfolioDetailPage from './pages/PortfolioDetailPage';
import BookingPage from './pages/BookingPage';
import ClientGalleriesPage from './pages/ClientGalleriesPage';
import BlogPage from './pages/BlogPage';
import ProfilePage from './pages/ProfilePage';
import PrivatePage from './pages/PrivatePage';
import HangmanGamePage from './pages/HangmanGamePage';
import DataExportPage from './pages/DataExportPage';
import ChatPage from './pages/ChatPage';
import Red2TerminalPage from './pages/Red2TerminalPage';

function Layout() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AppInitializer />
      <SEOOptimizer />
      <ScrollToTop />
      <LayoutContent />
    </Suspense>
  );
}

function LayoutContent() {
  useContentProtection(true);
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Outlet />
    </Suspense>
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
        path: "galleries",
        element: <ClientGalleriesPage />,
      },
      {
        path: "blog",
        element: <BlogPage />,
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
        path: "terminal",
        element: <Red2TerminalPage />,
      },
      {
        path: "data-export",
        element: <DataExportPage />,
      },
      {
        path: "chat",
        element: <ChatPage />,
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

function AppRouter() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <MemberProvider>
        <RouterProvider router={router} />
      </MemberProvider>
    </Suspense>
  );
}

export default React.memo(AppRouter);
