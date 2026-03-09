import React, { Suspense, lazy } from 'react';
import { MemberProvider } from '@/integrations';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import SEOOptimizer from '@/components/SEOOptimizer';
import { useContentProtection } from '@/hooks/useContentProtection';

// lazy-loaded pages with explicit error boundaries
const HomePage = lazy(() => import('./pages/HomePage').catch(err => {
  console.error('Failed to load HomePage:', err);
  throw err;
}));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage').catch(err => {
  console.error('Failed to load PortfolioPage:', err);
  throw err;
}));
const PortfolioDetailPage = lazy(() => import('./pages/PortfolioDetailPage').catch(err => {
  console.error('Failed to load PortfolioDetailPage:', err);
  throw err;
}));
const BookingPage = lazy(() => import('./pages/BookingPage').catch(err => {
  console.error('Failed to load BookingPage:', err);
  throw err;
}));
const ClientGalleriesPage = lazy(() => import('./pages/ClientGalleriesPage').catch(err => {
  console.error('Failed to load ClientGalleriesPage:', err);
  throw err;
}));
const BlogPage = lazy(() => import('./pages/BlogPage').catch(err => {
  console.error('Failed to load BlogPage:', err);
  throw err;
}));
const ProfilePage = lazy(() => import('./pages/ProfilePage').catch(err => {
  console.error('Failed to load ProfilePage:', err);
  throw err;
}));
const PrivatePage = lazy(() => import('./pages/PrivatePage').catch(err => {
  console.error('Failed to load PrivatePage:', err);
  throw err;
}));
const HangmanGamePage = lazy(() => import('./pages/HangmanGamePage').catch(err => {
  console.error('Failed to load HangmanGamePage:', err);
  throw err;
}));
const DataExportPage = lazy(() => import('./pages/DataExportPage').catch(err => {
  console.error('Failed to load DataExportPage:', err);
  throw err;
}));
const ChatPage = lazy(() => import('./pages/ChatPage').catch(err => {
  console.error('Failed to load ChatPage:', err);
  throw err;
}));

// Layout component that includes ScrollToTop and SEO Optimizer
function Layout() {
  return (
    <>
      <SEOOptimizer />
      <ScrollToTop />
      <LayoutContent />
    </>
  );
}

// Separate component to handle content protection
function LayoutContent() {
  useContentProtection(true);
  return <Outlet />;
}

// Fallback component for suspense
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-foreground">Loading...</p>
      </div>
    </div>
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
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: "portfolio",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <PortfolioPage />
          </Suspense>
        ),
      },
      {
        path: "portfolio/:id",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <PortfolioDetailPage />
          </Suspense>
        ),
      },
      {
        path: "booking",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <BookingPage />
          </Suspense>
        ),
      },
      {
        path: "galleries",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ClientGalleriesPage />
          </Suspense>
        ),
      },
      {
        path: "blog",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <BlogPage />
          </Suspense>
        ),
      },
      {
        path: "profile",
        element: (
          <MemberProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <ProfilePage />
            </Suspense>
          </MemberProtectedRoute>
        ),
      },
      {
        path: "private",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <PrivatePage />
          </Suspense>
        ),
      },
      {
        path: "play",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <HangmanGamePage />
          </Suspense>
        ),
      },
      {
        path: "data-export",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <DataExportPage />
          </Suspense>
        ),
      },
      {
        path: "chat",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ChatPage />
          </Suspense>
        ),
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
    <MemberProvider>
      <RouterProvider router={router} />
    </MemberProvider>
  );
}

export default React.memo(AppRouter);
