import { lazy, Suspense } from 'react';
import { useMember } from '@/integrations';
import { useWixAdminAccess } from '@/lib/wix-admin-access';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

// Lazy load AdminDashboard (new tabbed interface with WorkGalleryManager)
const AdminDashboard = lazy(() => import('@/components/AdminPanel/AdminDashboard'));

/**
 * Admin Page - Protected route for admin dashboard
 * Requires Wix Member authentication + admin role verification
 */
export default function AdminPage() {
  const { member, isAuthenticated, isLoading: isMemberLoading } = useMember();
  const { isAdmin, isLoading: isAdminLoading, error, checkAdminAccess } = useWixAdminAccess();

  // Still loading member data
  if (isMemberLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <LoadingSpinner message="Loading..." />
      </div>
    );
  }

  // Not authenticated - show sign-in prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black border border-primary/30 rounded-lg p-8 max-w-md w-full"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-heading text-white">Sign In Required</h2>
          </div>
          <p className="text-white/60 text-sm mb-6">
            Sign in to access the admin panel
          </p>
          <p className="text-white/40 text-xs">
            Please sign in with your Wix Member account to continue.
          </p>
        </motion.div>
      </div>
    );
  }

  // Checking admin access
  if (isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <LoadingSpinner message="Verifying access..." />
      </div>
    );
  }

  // Authenticated but not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black border border-primary/30 rounded-lg p-8 max-w-md w-full"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-heading text-white">Permission Denied</h2>
          </div>
          <p className="text-white/60 text-sm mb-2">
            {error || 'You do not have administrator permissions.'}
          </p>
          <p className="text-white/40 text-xs">
            Only authorized administrators can access this panel.
          </p>
        </motion.div>
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
