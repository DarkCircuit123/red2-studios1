import { MemberProvider } from '@/integrations';
import { createBrowserRouter, RouterProvider, Navigate, Outlet, Suspense } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import { lazy } from 'react';

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
const BackgroundMusicPlayer = lazy(() => import('./BackgroundMusicPlayer'));

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
