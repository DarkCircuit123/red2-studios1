import { useEffect, useState } from 'react';
import { useMember } from '@/integrations';
import { useWixAdminAccess } from '@/lib/wix-admin-access';
import { useAdminAuth } from '@/components/AdminAuthProvider';
import AdminLoginModal from '@/components/AdminLoginModal';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface AdminAccessGateProps { children: React.ReactNode; onAccessDenied?: () => void; }

export default function AdminAccessGate({ children, onAccessDenied }: AdminAccessGateProps) {
  const { member, isAuthenticated: isMemberAuthenticated, isLoading: isMemberLoading } = useMember();
  const { isAuthenticated: isAdminSession, isLoading: isAdminSessionLoading } = useAdminAuth();
  const { isAdmin, isLoading: isAdminLoading, error, checkAdminAccess } = useWixAdminAccess();
  const [hasCheckedMemberAccess, setHasCheckedMemberAccess] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (isMemberLoading || isAdminSessionLoading) return;
    if (isAdminSession) {
      setHasCheckedMemberAccess(true);
      return;
    }
    if (!isMemberAuthenticated || !member?._id) {
      setHasCheckedMemberAccess(true);
      setShowLogin(true);
      onAccessDenied?.();
      return;
    }
    void checkAdminAccess(member._id).finally(() => setHasCheckedMemberAccess(true));
  }, [isAdminSession, isAdminSessionLoading, isMemberAuthenticated, isMemberLoading, member?._id, checkAdminAccess, onAccessDenied]);

  if (isAdminSession) return <>{children}</>;

  if (isMemberLoading || isAdminSessionLoading || isAdminLoading || !hasCheckedMemberAccess) {
    return <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]"><div className="flex flex-col items-center gap-4"><LoadingSpinner /><p className="text-white/60 text-sm">Verifying access...</p></div></div>;
  }

  if (isAdmin) return <>{children}</>;

  return <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]">
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-black border border-primary/30 rounded-lg p-8 max-w-md w-full mx-4 text-center">
      <AlertCircle className="w-5 h-5 text-primary mx-auto mb-4" />
      <h2 className="text-lg font-heading text-white mb-2">Admin Access Required</h2>
      <p className="text-white/60 text-sm mb-5">{error || 'Sign in with the admin credentials to continue.'}</p>
      <button onClick={() => setShowLogin(true)} className="px-5 py-3 bg-primary text-white rounded-lg font-mono text-sm uppercase tracking-widest">Admin Login</button>
    </motion.div>
    <AdminLoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onLoginSuccess={() => { setShowLogin(false); setHasCheckedMemberAccess(false); }} />
  </div>;
}
