import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import { lazy, Suspense } from 'react';
import { AdminAuthProvider } from '@/components/AdminAuthProvider';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';

// Lazy load all pages to prevent circular dependencies
// Use dynamic imports with error handling
const HomePage = lazy(() => import('./pages/HomePage').catch((err) => {
  console.error('[Router] Failed to load HomePage:', err);
  return { default: () => <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>Error loading page. Please refresh.</div> };
}));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage').catch((err) => {
  console.error('[Router] Failed to load PortfolioPage:', err);
  return { default: () => <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>Error loading page. Please refresh.</div> };
}));
const PortfolioDetailPage = lazy(() => import('./pages/PortfolioDetailPage').catch((err) => {
  console.error('[Router] Failed to load PortfolioDetailPage:', err);
  return { default: () => <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>Error loading page. Please refresh.</div> };
}));
const BookingPage = lazy(() => import('./pages/BookingPage').catch((err) => {
  console.error('[Router] Failed to load BookingPage:', err);
  return { default: () => <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>Error loading page. Please refresh.</div> };
}));
const ProfilePage = lazy(() => import('./pages/ProfilePage').catch((err) => {
  console.error('[Router] Failed to load ProfilePage:', err);
  return { default: () => <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>Error loading page. Please refresh.</div> };
}));
const PrivatePage = lazy(() => import('./pages/PrivatePage').catch((err) => {
  console.error('[Router] Failed to load PrivatePage:', err);
  return { default: () => <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>Error loading page. Please refresh.</div> };
}));
const HangmanGamePage = lazy(() => import('./pages/HangmanGamePage').catch((err) => {
  console.error('[Router] Failed to load HangmanGamePage:', err);
  return { default: () => <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>Error loading page. Please refresh.</div> };
}));
const ClientRegisterPage = lazy(() => import('./pages/ClientRegisterPage').catch((err) => {
  console.error('[Router] Failed to load ClientRegisterPage:', err);
  return { default: () => <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>Error loading page. Please refresh.</div> };
}));
const WorkPage = lazy(() => import('./pages/WorkPage').catch((err) => {
  console.error('[Router] Failed to load WorkPage:', err);
  return { default: () => <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>Error loading page. Please refresh.</div> };
}));
const ContactPage = lazy(() => import('./pages/ContactPage').catch((err) => {
  console.error('[Router] Failed to load ContactPage:', err);
  return { default: () => <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>Error loading page. Please refresh.</div> };
}));
const AdminPage = lazy(() => import('./pages/AdminPage').catch((err) => {
  console.error('[Router] Failed to load AdminPage:', err);
  return { default: () => <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>Error loading page. Please refresh.</div> };
}));
const BackgroundMusicPlayer = lazy(() => import('./BackgroundMusicPlayer').catch(() => ({ default: () => null })));
// These 10 were built but never wired into the router - every link that
// pointed at them was a dead 404-to-home redirect until now.
const BlogPage = lazy(() => import('./pages/BlogPage').catch((err) => {
  console.error('[Router] Failed to load BlogPage:', err);
  return { default: () => <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>Error loading page. Please refresh.</div> };
}));
const BlogDetailPage = lazy(() => import('./pages/BlogDetailPage').catch((err) => {
  console.error('[Router] Failed to load BlogDetailPage:', err);
  return { default: () => <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>Error loading page. Please refresh.</div> };
}));
const StoriesIndexPage = lazy(() => import('./pages/StoriesIndexPage').catch((err) => {
  console.error('[Router] Failed to load StoriesIndexPage:', err);
  return { default: () => <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>Error loading page. Please refresh.</div> };
}));
const StoriesDetailPage = lazy(() => import('./pages/StoriesDetailPage').catch((err) => {
  console.error('[Router] Failed to load StoriesDetailPage:', err);
  return { default: () => <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>Error loading page. Please refresh.</div> };
}));
const WatchPage = lazy(() => import('./pages/WatchPage').catch((err) => {
  console.error('[Router] Failed to load WatchPage:', err);
  return { default: () => <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>Error loading page. Please refresh.</div> };
}));
const ChatPage = lazy(() => import('./pages/ChatPage').catch((err) => {
  console.error('[Router] Failed to load ChatPage:', err);
  return { default: () => <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>Error loading page. Please refresh.</div> };
}));
const DataExportPage = lazy(() => import('./pages/DataExportPage').catch((err) => {
  console.error('[Router] Failed to load DataExportPage:', err);
  return { default: () => <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>Error loading page. Please refresh.</div> };
}));
const Red2TerminalPage = lazy(() => import('./pages/Red2TerminalPage').catch((err) => {
  console.error('[Router] Failed to load Red2TerminalPage:', err);
  return { default: () => <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>Error loading page. Please refresh.</div> };
}));
const ClientLoginPage = lazy(() => import('./pages/ClientLoginPage').catch((err) => {
  console.error('[Router] Failed to load ClientLoginPage:', err);
  return { default: () => <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>Error loading page. Please refresh.</div> };
}));
const ClientGalleryDashboardPage = lazy(() => import('./pages/ClientGalleryDashboardPage').catch((err) => {
  console.error('[Router] Failed to load ClientGalleryDashboardPage:', err);
  return { default: () => <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>Error loading page. Please refresh.</div> };
}));
const UploadTestPage = lazy(() => import('./pages/UploadTestPage').catch((err) => {
  console.error('[Router] Failed to load UploadTestPage:', err);
  return { default: () => <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>Error loading page. Please refresh.</div> };
}));
const AuditPlaceholderDataPage = lazy(() => import('./pages/AuditPlaceholderDataPage').catch((err) => {
  console.error('[Router] Failed to load AuditPlaceholderDataPage:', err);
  return { default: () => <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>Error loading page. Please refresh.</div> };
}));
const DataCleanupVerificationPage = lazy(() => import('./pages/DataCleanupVerificationPage').catch((err) => {
  console.error('[Router] Failed to load DataCleanupVerificationPage:', err);
  return { default: () => <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>Error loading page. Please refresh.</div> };
}));

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
        path: "work",
        element: (
          <Suspense fallback={<div />}>
            <WorkPage />
          </Suspense>
        ),
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
        // DataExportPage wraps itself in MemberProtectedRoute internally,
        // so it doesn't need to be wrapped again here.
        path: "data-export",
        element: (
          <Suspense fallback={<div />}>
            <DataExportPage />
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
        path: "upload-test",
        element: (
          <Suspense fallback={<div />}>
            <UploadTestPage />
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
        path: "audit-placeholder-data",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to access the placeholder data audit">
            <Suspense fallback={<div />}>
              <AuditPlaceholderDataPage />
            </Suspense>
          </MemberProtectedRoute>
        ),
      },
      {
        path: "data-cleanup-verification",
        element: (
          <MemberProtectedRoute messageToSignIn="Sign in to access the data cleanup verification">
            <Suspense fallback={<div />}>
              <DataCleanupVerificationPage />
            </Suspense>
          </MemberProtectedRoute>
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
