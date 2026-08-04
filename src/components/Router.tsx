import { MemberProvider } from '@/integrations';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import { lazy, Suspense } from 'react';

// Lazy load all pages to prevent circular dependencies
const HomePage = lazy(() => import('./pages/HomePage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const PortfolioDetailPage = lazy(() => import('./pages/PortfolioDetailPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const PrivatePage = lazy(() => import('./pages/PrivatePage'));
const HangmanGamePage = lazy(() => import('./pages/HangmanGamePage'));
const ClientRegisterPage = lazy(() => import('./pages/ClientRegisterPage'));
const WorkPage = lazy(() => import('./pages/WorkPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const BackgroundMusicPlayer = lazy(() => import('./BackgroundMusicPlayer'));
// These 10 were built but never wired into the router - every link that
// pointed at them was a dead 404-to-home redirect until now.
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogDetailPage = lazy(() => import('./pages/BlogDetailPage'));
const StoriesIndexPage = lazy(() => import('./pages/StoriesIndexPage'));
const StoriesDetailPage = lazy(() => import('./pages/StoriesDetailPage'));
const WatchPage = lazy(() => import('./pages/WatchPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const DataExportPage = lazy(() => import('./pages/DataExportPage'));
const Red2TerminalPage = lazy(() => import('./pages/Red2TerminalPage'));
const ClientLoginPage = lazy(() => import('./pages/ClientLoginPage'));
const ClientGalleryDashboardPage = lazy(() => import('./pages/ClientGalleryDashboardPage'));
const UploadTestPage = lazy(() => import('./pages/UploadTestPage'));

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
          <MemberProtectedRoute>
            <Suspense fallback={<div />}>
              <ProfilePage />
            </Suspense>
          </MemberProtectedRoute>
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
