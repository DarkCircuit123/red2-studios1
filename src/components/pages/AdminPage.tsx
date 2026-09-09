import { lazy, Suspense } from 'react';
import { useAdminAuth } from '@/components/AdminAuthProvider';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Lazy load AdminDashboard (new tabbed interface with WorkGalleryManager)
const AdminDashboard = lazy(() => import('@/components/AdminPanel/AdminDashboard'));

/**
 * Admin Page - Protected route for admin dashboard
 * Uses custom AdminAuthProvider for authentication
 */
export default function AdminPage() {
  const { isAuthenticated, isLoading } = useAdminAuth();

  // Still loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <LoadingSpinner message="Loading..." />
      </div>
    );
  }

  // Not authenticated - should not reach here as Header handles login
  // But show fallback just in case
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black">
        <div className="text-center">
          <p className="text-white/60">Please sign in to access the admin panel.</p>
        </div>
      </div>
    );
  }

  // Admin access granted - show dashboard
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <LoadingSpinner message="Loading dashboard..." />
        </div>
      }
    >
      <AdminDashboard />
    </Suspense>
  );
}
