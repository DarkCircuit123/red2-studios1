import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import { lazy, Suspense } from 'react';
import { AdminAuthProvider } from '@/components/AdminAuthProvider';

// Lazy load all pages to prevent circular dependencies
// Use dynamic imports with error handling
const HomePage = lazy(() => import('./pages/HomePage').catch(() => ({ default: () => <div>Error loading page</div> })));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage').catch(() => ({ default: () => <div>Error loading page</div> })));
const PortfolioDetailPage = lazy(() => import('./pages/PortfolioDetailPage').catch(() => ({ default: () => <div>Error loading page</div> })));
const BookingPage = lazy(() => import('./pages/BookingPage').catch(() => ({ default: () => <div>Error loading page</div> })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').catch(() => ({ default: () => <div>Error loading page</div> })));
const PrivatePage = lazy(() => import('./pages/PrivatePage').catch(() => ({ default: () => <div>Error loading page</div> })));
const HangmanGamePage = lazy(() => import('./pages/HangmanGamePage').catch(() => ({ default: () => <div>Error loading page</div> })));
const ClientRegisterPage = lazy(() => import('./pages/ClientRegisterPage').catch(() => ({ default: () => <div>Error loading page</div> })));
// WorkPage is deprecated - /work now redirects to /portfolio
// const WorkPage = lazy(() => import('./pages/WorkPage').catch(() => ({ default: () => <div>Error loading page</div> })));
const ContactPage = lazy(() => import('./pages/ContactPage').catch(() => ({ default: () => <div>Error loading page</div> })));
const AdminPage = lazy(() => import('./pages/AdminPage').catch(() => ({ default: () => <div>Error loading page</div> })));
const BackgroundMusicPlayer = lazy(() => import('./BackgroundMusicPlayer').catch(() => ({ default: () => null })));
// These 10 were built but never wired into the router - every link that
// pointed at them was a dead 404-to-home redirect until now.
const BlogPage = lazy(() => import('./pages/BlogPage').catch(() => ({ default: () => <div>Error loading page</div> })));
const BlogDetailPage = lazy(() => import('./pages/BlogDetailPage').catch(() => ({ default: () => <div>Error loading page</div> })));
const StoriesIndexPage = lazy(() => import('./pages/StoriesIndexPage').catch(() => ({ default: () => <div>Error loading page</div> })));
const StoriesDetailPage = lazy(() => import('./pages/StoriesDetailPage').catch(() => ({ default: () => <div>Error loading page</div> })));
const WatchPage = lazy(() => import('./pages/WatchPage').catch(() => ({ default: () => <div>Error loading page</div> })));
const ChatPage = lazy(() => import('./pages/ChatPage').catch(() => ({ default: () => <div>Error loading page</div> })));
const Red2TerminalPage = lazy(() => import('./pages/Red2TerminalPage').catch(() => ({ default: () => <div>Error loading page</div> })));
const ClientLoginPage = lazy(() => import('./pages/ClientLoginPage').catch(() => ({ default: () => <div>Error loading page</div> })));
const ClientGalleryDashboardPage = lazy(() => import('./pages/ClientGalleryDashboardPage').catch(() => ({ default: () => <div>Error loading page</div> })));

// Layout component that includes ScrollToTop and BackgroundMusicPlayer
function Layout() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={null}>
        <BackgroundMusicPlayer />
      </Suspense>
      <Suspense fallback={<div />}>
        <Outlet />
      </Suspense>
    </>
  );
}

// Create router synchronously to ensure it's available immediately
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<div />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: "portfolio",
        element: (
          <Suspense fallback={<div />}>
            <PortfolioPage />
          </Suspense>
        ),
      },
      {
        path: "portfolio/:id",
        element: (
          <Suspense fallback={<div />}>
            <PortfolioDetailPage />
          </Suspense>
        ),
      },
      {
        path: "booking",
        element: (
          <Suspense fallback={<div />}>
            <BookingPage />
          </Suspense>
        ),
      },
      {
        path: "profile",
        element: (
          <Suspense fallback={<div />}>
            <ProfilePage />
          </Suspense>
        ),
      },
      {
        path: "private",
        element: (
          <Suspense fallback={<div />}>
            <PrivatePage />
          </Suspense>
        ),
      },
      {
        path: "play",
        element: (
          <Suspense fallback={<div />}>
            <HangmanGamePage />
          </Suspense>
        ),
      },
      {
        path: "client-register",
        element: (
          <Suspense fallback={<div />}>
            <ClientRegisterPage />
          </Suspense>
        ),
      },
      {
        // FIXED: /work now redirects to /portfolio (single authoritative Portfolio page)
        path: "work",
        element: <Navigate to="/portfolio" replace />,
      },
      {
        path: "contact",
        element: (
          <Suspense fallback={<div />}>
            <ContactPage />
          </Suspense>
        ),
      },
      {
        path: "blog",
        element: (
          <Suspense fallback={<div />}>
            <BlogPage />
          </Suspense>
        ),
      },
      {
        path: "blog/:id",
        element: (
          <Suspense fallback={<div />}>
            <BlogDetailPage />
          </Suspense>
        ),
      },
      {
        path: "stories",
        element: (
          <Suspense fallback={<div />}>
            <StoriesIndexPage />
          </Suspense>
        ),
      },
      {
        path: "stories/:slug",
        element: (
          <Suspense fallback={<div />}>
            <StoriesDetailPage />
          </Suspense>
        ),
      },
      {
        path: "watch",
        element: (
          <Suspense fallback={<div />}>
            <WatchPage />
          </Suspense>
        ),
      },
      {
        path: "watch/:id",
        element: (
          <Suspense fallback={<div />}>
            <WatchPage />
          </Suspense>
        ),
      },
      {
        path: "chat",
        element: (
          <Suspense fallback={<div />}>
            <ChatPage />
          </Suspense>
        ),
      },
      {
        path: "terminal",
        element: (
          <Suspense fallback={<div />}>
            <Red2TerminalPage />
          </Suspense>
        ),
      },
      {
        path: "client-login",
        element: (
          <Suspense fallback={<div />}>
            <ClientLoginPage />
          </Suspense>
        ),
      },
      {
        path: "client-gallery-dashboard",
        element: (
          <Suspense fallback={<div />}>
            <ClientGalleryDashboardPage />
          </Suspense>
        ),
      },
      {
        // ClientLoginPage navigates here with a specific gallery _id after
        // an access-code check. There's no dedicated single-gallery view
        // component left in the codebase (the original ClientGalleryViewPage
        // referenced in PRIVACY_AUDIT_REPORT.md was consolidated away), so
        // this reuses the member-based dashboard rather than leaving the
        // link dead. It ignores the :id and shows all of that member's
        // galleries - functionally fine, but worth a real look since it
        // mixes the access-code flow with the member-login flow.
        path: "client-gallery/:id",
        element: (
          <Suspense fallback={<div />}>
            <ClientGalleryDashboardPage />
          </Suspense>
        ),
      },
      {
        path: "admin",
        element: (
          <Suspense fallback={<div />}>
            <AdminPage />
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

export default function AppRouter() {
  return (
    <AdminAuthProvider>
      <RouterProvider router={router} />
    </AdminAuthProvider>
  );
}
