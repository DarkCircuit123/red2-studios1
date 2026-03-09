import React, { Suspense } from 'react';
import { MemberProvider } from '@/integrations';
import { codeSpittingStrategy } from '@/lib/bundle-analyzer';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import SEOOptimizer from '@/components/SEOOptimizer';
import { useContentProtection } from '@/hooks/useContentProtection';

// lazy-loaded pages
const HomePage = React.lazy(() => import('./pages/HomePage'));
const PortfolioPage = React.lazy(() => import('./pages/PortfolioPage'));
const PortfolioDetailPage = React.lazy(() => import('./pages/PortfolioDetailPage'));
const BookingPage = React.lazy(() => import('./pages/BookingPage'));
const ClientGalleriesPage = React.lazy(() => import('./pages/ClientGalleriesPage'));
const BlogPage = React.lazy(() => import('./pages/BlogPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const PrivatePage = React.lazy(() => import('./pages/PrivatePage'));
const HangmanGamePage = React.lazy(() => import('./pages/HangmanGamePage'));
const DataExportPage = React.lazy(() => import('./pages/DataExportPage'));

// Layout component that includes ScrollToTop and SEO Optimizer
function Layout() {
  useContentProtection(true);

  return (
    <>
      <SEOOptimizer />
      <ScrollToTop />
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
        element: (
          <Suspense fallback={<div>Loading...</div>}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: "portfolio",
        element: (
          <Suspense fallback={<div>Loading...</div>}>
            <PortfolioPage />
          </Suspense>
        ),
      },
      {
        path: "portfolio/:id",
        element: (
          <Suspense fallback={<div>Loading...</div>}>
            <PortfolioDetailPage />
          </Suspense>
        ),
      },
      {
        path: "booking",
        element: (
          <Suspense fallback={<div>Loading...</div>}>
            <BookingPage />
          </Suspense>
        ),
      },
      {
        path: "galleries",
        element: (
          <Suspense fallback={<div>Loading...</div>}>
            <ClientGalleriesPage />
          </Suspense>
        ),
      },
      {
        path: "blog",
        element: (
          <Suspense fallback={<div>Loading...</div>}>
            <BlogPage />
          </Suspense>
        ),
      },
      {
        path: "profile",
        element: (
          <MemberProtectedRoute>
            <Suspense fallback={<div>Loading...</div>}>
              <ProfilePage />
            </Suspense>
          </MemberProtectedRoute>
        ),
      },
      {
        path: "private",
        element: (
          <Suspense fallback={<div>Loading...</div>}>
            <PrivatePage />
          </Suspense>
        ),
      },
      {
        path: "play",
        element: (
          <Suspense fallback={<div>Loading...</div>}>
            <HangmanGamePage />
          </Suspense>
        ),
      },
      {
        path: "data-export",
        element: (
          <Suspense fallback={<div>Loading...</div>}>
            <DataExportPage />
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
  React.useEffect(() => {
    // pre-load vendor modules in background so the first interactive page
    // already has them cached
    Object.values(codeSpittingStrategy.vendors).forEach((load) => load());
  }, []);

  return (
    <MemberProvider>
      <RouterProvider router={router} />
    </MemberProvider>
  );
}

export default React.memo(AppRouter);
