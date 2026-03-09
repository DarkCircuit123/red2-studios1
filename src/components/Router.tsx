import React, { Suspense, lazy } from 'react';
import { MemberProvider } from '@/integrations';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import SEOOptimizer from '@/components/SEOOptimizer';
import { useContentProtection } from '@/hooks/useContentProtection';
import { withSafeLazy } from '@/components/SafeLazyComponent';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AppInitializer } from '@/components/AppInitializer';

// lazy-loaded pages with retry mechanism
const HomePage = withSafeLazy(
  lazy(() => import('./pages/HomePage')),
  { moduleName: 'HomePage' }
);
const PortfolioPage = withSafeLazy(
  lazy(() => import('./pages/PortfolioPage')),
  { moduleName: 'PortfolioPage' }
);
const PortfolioDetailPage = withSafeLazy(
  lazy(() => import('./pages/PortfolioDetailPage')),
  { moduleName: 'PortfolioDetailPage' }
);
const BookingPage = withSafeLazy(
  lazy(() => import('./pages/BookingPage')),
  { moduleName: 'BookingPage' }
);
const ClientGalleriesPage = withSafeLazy(
  lazy(() => import('./pages/ClientGalleriesPage')),
  { moduleName: 'ClientGalleriesPage' }
);
const BlogPage = withSafeLazy(
  lazy(() => import('./pages/BlogPage')),
  { moduleName: 'BlogPage' }
);
const ProfilePage = withSafeLazy(
  lazy(() => import('./pages/ProfilePage')),
  { moduleName: 'ProfilePage' }
);
const PrivatePage = withSafeLazy(
  lazy(() => import('./pages/PrivatePage')),
  { moduleName: 'PrivatePage' }
);
const HangmanGamePage = withSafeLazy(
  lazy(() => import('./pages/HangmanGamePage')),
  { moduleName: 'HangmanGamePage' }
);
const DataExportPage = withSafeLazy(
  lazy(() => import('./pages/DataExportPage')),
  { moduleName: 'DataExportPage' }
);
const ChatPage = withSafeLazy(
  lazy(() => import('./pages/ChatPage')),
  { moduleName: 'ChatPage' }
);

// Layout component that includes ScrollToTop and SEO Optimizer
function Layout() {
  return (
    <>
      <AppInitializer />
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
      <LoadingSpinner />
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
    <MemberProvider>
      <RouterProvider router={router} />
    </MemberProvider>
  );
}

export default React.memo(AppRouter);
