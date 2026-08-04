import { useEffect, useState } from 'react';
import { useMember } from '@/integrations';
import { useWixAdminAccess } from '@/lib/wix-admin-access';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface AdminAccessGateProps {
  children: React.ReactNode;
  onAccessDenied?: () => void;
}

/**
 * Gate component that verifies admin access before rendering children
 * Uses Wix Members authentication + backend verification
 */
export default function AdminAccessGate({ children, onAccessDenied }: AdminAccessGateProps) {
  const { member, isAuthenticated, isLoading: isMemberLoading } = useMember();
  const { isAdmin, isLoading: isAdminLoading, error, checkAdminAccess } = useWixAdminAccess();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const verifyAccess = async () => {
      if (isMemberLoading) return;

      if (!isAuthenticated || !member?._id) {
        setHasChecked(true);
        onAccessDenied?.();
        return;
      }

      // Check admin access via backend
      const hasAccess = await checkAdminAccess(member._id);
      setHasChecked(true);

      if (!hasAccess) {
        onAccessDenied?.();
      }
    };

    verifyAccess();
  }, [isAuthenticated, member?._id, isMemberLoading, checkAdminAccess, onAccessDenied]);

  // Still loading
  if (isMemberLoading || isAdminLoading || !hasChecked) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner />
          <p className="text-white/60 text-sm">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black border border-primary/30 rounded-lg p-8 max-w-md w-full mx-4"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-heading text-white">Access Denied</h2>
          </div>
          <p className="text-white/60 text-sm mb-6">
            You must be logged in to access the admin panel.
          </p>
          <p className="text-white/40 text-xs">
            Please sign in with your Wix Member account to continue.
          </p>
        </motion.div>
      </div>
    );
  }

  // Authenticated but not admin
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black border border-primary/30 rounded-lg p-8 max-w-md w-full mx-4"
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

  // Admin access granted
  return <>{children}</>;
}
