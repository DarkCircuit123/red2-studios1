import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import HomePage from './pages/HomePage';
import PortfolioPage from './pages/PortfolioPage';
import PortfolioDetailPage from './pages/PortfolioDetailPage';
import BookingPage from './pages/BookingPage';
import ClientGalleriesPage from './pages/ClientGalleriesPage';
import BlogPage from './pages/BlogPage';
import BlogDetailPage from './pages/BlogDetailPage';
import ProfilePage from './pages/ProfilePage';
import PrivatePage from './pages/PrivatePage';
import HangmanGamePage from './pages/HangmanGamePage';
import ClientRegisterPage from './pages/ClientRegisterPage';
import ClientGalleryViewPage from './pages/ClientGalleryViewPage';
import ClientGalleryDashboardPage from './pages/ClientGalleryDashboardPage';
import WorkPage from './pages/WorkPage';
import ContactPage from './pages/ContactPage';
import WatchPage from './pages/WatchPage';
import { Suspense } from 'react';

// Simple error fallback
function ErrorFallback() {
  return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#fff', backgroundColor: '#000' }}>
      <h1>Error Loading Page</h1>
      <p>Please refresh the page or try again later.</p>
    </div>
  );
}

// Layout component that includes ScrollToTop
function Layout() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorFallback />,
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
        path: "blog/:id",
        element: <BlogDetailPage />,
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
        path: "client-gallery-dashboard",
        element: <ClientGalleryDashboardPage />,
      },
      {
        path: "client-gallery/:id",
        element: <ClientGalleryViewPage />,
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
        path: "watch",
        element: <WatchPage />,
      },
      {
        path: "watch/:id",
        element: <WatchPage />,
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
  return <RouterProvider router={router} />;
}
