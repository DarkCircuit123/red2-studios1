import { MemberProvider } from '@/integrations';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ScrollToTop } from '@/lib/scroll-to-top';
import ErrorPage from '@/integrations/errorHandlers/ErrorPage';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import HomePage from './pages/HomePage';
import PortfolioPage from './pages/PortfolioPage';
import PortfolioDetailPage from './pages/PortfolioDetailPage';
import BookingPage from './pages/BookingPage';
import BlogPage from './pages/BlogPage';
import BlogDetailPage from './pages/BlogDetailPage';
import ProfilePage from './pages/ProfilePage';
import PrivatePage from './pages/PrivatePage';
import HangmanGamePage from './pages/HangmanGamePage';
import ClientRegisterPage from './pages/ClientRegisterPage';
import WorkPage from './pages/WorkPage';
import ContactPage from './pages/ContactPage';
import BackgroundMusicPlayer from './BackgroundMusicPlayer';
// ... keep existing code (other imports) ...

// Layout component that includes ScrollToTop and BackgroundMusicPlayer
function Layout() {
  return (
    <>
      <ScrollToTop />
      <BackgroundMusicPlayer />
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
