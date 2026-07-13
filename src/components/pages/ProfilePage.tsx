import { useMember } from '@/integrations';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Mail, Calendar, Edit2, Check, X, AlertCircle, Lock, Trash2 } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { Link, useNavigate } from 'react-router-dom';
import { playClickSound } from '@/lib/click-sound';
import { useState, useEffect, useRef } from 'react';

export default function ProfilePage() {
  const { member, actions } = useMember();
  const navigate = useNavigate();
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // AUTH GUARD: Redirect if not authenticated
  useEffect(() => {
    if (!member) {
      navigate('/client-login', { replace: true });
    }
  }, [member, navigate]);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(member?.profile?.nickname || member?.contact?.firstName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Update editedName when member changes
  useEffect(() => {
    setEditedName(member?.profile?.nickname || member?.contact?.firstName || '');
  }, [member?.profile?.nickname, member?.contact?.firstName]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Helper: Format phone number with tel: link
  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10 ? `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}` : phone;
  };

  // Helper: Sanitize name input
  const sanitizeName = (name: string) => {
    return name.replace(/[<>]/g, '').trim();
  };

  // Helper: Get status badge color
  const getStatusColor = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return 'bg-green-500/20 border-green-500/50 text-green-300';
      case 'PENDING':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300';
      case 'BLOCKED':
        return 'bg-red-500/20 border-red-500/50 text-red-300';
      default:
        return 'bg-blue-500/20 border-blue-500/50 text-blue-300';
    }
  };

  const handlePlayClickSound = () => {
    try {
      playClickSound();
    } catch (e) {
      console.warn('Click sound error:', e);
    }
  };

  const handleSaveName = async () => {
    const sanitized = sanitizeName(editedName);
    if (!sanitized || sanitized === (member?.profile?.nickname || member?.contact?.firstName)) {
      setIsEditingName(false);
      setError(null);
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      // AbortController for cleanup
      abortControllerRef.current = new AbortController();
      
      if (actions.updateMember) {
        await actions.updateMember({
          profile: {
            nickname: sanitized
          }
        });
        setSuccess(true);
        setIsEditingName(false);
        if (actions.loadCurrentMember) {
          await actions.loadCurrentMember();
        }
        // Clear success message after 3 seconds with cleanup
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          if (!abortControllerRef.current?.signal.aborted) {
            setSuccess(false);
          }
        }, 3000);
      } else {
        throw new Error('Update member function not available');
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message || 'Failed to update name. Please try again.');
        setEditedName(member?.profile?.nickname || member?.contact?.firstName || '');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedName(member?.profile?.nickname || member?.contact?.firstName || '');
    setIsEditingName(false);
    setError(null);
  };

  const handleLogoutClick = () => {
    handlePlayClickSound();
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    handlePlayClickSound();
    setShowLogoutConfirm(false);
    actions.logout();
  };

  const handleChangeEmail = () => {
    handlePlayClickSound();
    // Stub for future implementation
    alert('Change email functionality coming soon');
  };

  const handleChangePassword = () => {
    handlePlayClickSound();
    // Stub for future implementation
    alert('Change password functionality coming soon');
  };

  const handleDeleteAccount = () => {
    handlePlayClickSound();
    // Stub for future implementation
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      alert('Account deletion functionality coming soon');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* SEO: noindex/nofollow meta tags */}
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      
      <Header />
      
      <main className="pt-32 pb-24">
        <div className="max-w-[120rem] mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            {/* Profile Header - Personalized greeting */}
            <div className="mb-16">
              <h1 className="text-6xl md:text-7xl font-heading font-bold text-white mb-4 tracking-tighter">
                Welcome back, {member?.profile?.nickname || member?.contact?.firstName || 'Client'}
              </h1>
              <p className="text-base font-paragraph text-white/60">
                Manage your account and access your galleries
              </p>
            </div>

            {/* Error/Success Messages with AnimatePresence */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-8 p-4 bg-red-900/20 border border-red-500/50 rounded flex items-center gap-3"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" aria-hidden="true" />
                  <p className="text-sm font-paragraph text-red-200">{error}</p>
                </motion.div>
              )}
              
              {success && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-8 p-4 bg-green-900/20 border border-green-500/50 rounded flex items-center gap-3"
                  role="status"
                  aria-live="polite"
                >
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" aria-hidden="true" />
                  <p className="text-sm font-paragraph text-green-200">Name updated successfully!</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Profile Card */}
            <div className="bg-white/5 border border-white/10 p-12 mb-12">
              <div className="flex flex-col md:flex-row gap-12 items-start">
                {/* Profile Photo */}
                <div className="flex-shrink-0">
                  {member?.profile?.photo?.url ? (
                    <Image
                      src={member.profile.photo.url}
                      alt={member?.profile?.nickname || 'Profile'}
                      className="w-32 h-32 rounded-lg object-cover"
                      width={128}
                      height={128}
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-lg bg-white/10 flex items-center justify-center">
                      <span className="text-4xl font-heading font-bold text-white/40">
                        {member?.profile?.nickname?.charAt(0).toUpperCase() || 'C'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1 w-full">
                  <div className="mb-8">
                    {isEditingName ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(sanitizeName(e.target.value))}
                          className="text-3xl font-heading font-bold bg-white/10 border border-white/20 text-white px-3 py-2 rounded focus:outline-none focus:border-white/40 flex-1 w-full"
                          placeholder="Enter your name"
                          disabled={isSaving}
                          aria-label="Edit name"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveName}
                            disabled={isSaving}
                            className="p-2 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
                            aria-label="Save name"
                            title="Save"
                          >
                            <Check className="w-5 h-5 text-green-400" aria-hidden="true" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                            className="p-2 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
                            aria-label="Cancel editing"
                            title="Cancel"
                          >
                            <X className="w-5 h-5 text-red-400" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="flex items-center gap-3 mb-4 group cursor-pointer hover:opacity-80 transition-opacity"
                        aria-label="Edit name"
                      >
                        <h2 className="text-3xl font-heading font-bold text-white">
                          {member?.profile?.nickname || member?.contact?.firstName || 'Client'}
                        </h2>
                        <Edit2 className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors opacity-0 group-hover:opacity-100" aria-hidden="true" />
                      </button>
                    )}
                    {member?.profile?.title && (
                      <p className="text-sm font-mono text-white/60 uppercase tracking-widest">
                        {member.profile.title}
                      </p>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-white/40" aria-hidden="true" />
                      <span className="text-base font-paragraph text-white/80">
                        {member?.loginEmail || 'No email'}
                      </span>
                    </div>
                    {member?.contact?.phones && member.contact.phones.length > 0 && (
                      <div className="flex items-center gap-3">
                        <a
                          href={`tel:${member.contact.phones[0].replace(/\D/g, '')}`}
                          className="text-base font-paragraph text-white/80 hover:text-white transition-colors"
                          aria-label={`Call ${member.contact.phones[0]}`}
                        >
                          {formatPhoneNumber(member.contact.phones[0])}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-white/40" aria-hidden="true" />
                      <span className="text-sm font-paragraph text-white/60">
                        Member since {member?._createdDate ? new Date(member._createdDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge - Color-coded */}
                  <div className={`inline-flex items-center gap-3 px-4 py-2 rounded border ${getStatusColor(member?.status)}`}>
                    <div className="w-2 h-2 rounded-full bg-current" />
                    <span className="text-sm font-mono uppercase tracking-widest">
                      {member?.status || 'Active'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links - Fixed paths */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <Link
                to="/client-galleries"
                onClick={handlePlayClickSound}
                className="p-8 bg-white/5 border border-white/10 hover:border-white/30 transition-colors block hover:bg-white/10"
              >
                <h3 className="text-lg font-heading font-bold text-white mb-2">
                  My Galleries
                </h3>
                <p className="text-sm font-paragraph text-white/60">
                  Access your proofing galleries and approved images
                </p>
              </Link>

              <Link
                to="/booking"
                onClick={handlePlayClickSound}
                className="p-8 bg-white/5 border border-white/10 hover:border-white/30 transition-colors block hover:bg-white/10"
              >
                <h3 className="text-lg font-heading font-bold text-white mb-2">
                  Book Session
                </h3>
                <p className="text-sm font-paragraph text-white/60">
                  Schedule your next photography session
                </p>
              </Link>
            </div>

            {/* Account Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
              <button
                onClick={handleChangeEmail}
                className="p-4 bg-white/5 border border-white/10 hover:border-white/30 transition-colors flex items-center justify-center gap-2 hover:bg-white/10"
                aria-label="Change email address"
              >
                <Mail className="w-4 h-4" aria-hidden="true" />
                <span className="text-sm font-heading font-semibold">Change Email</span>
              </button>

              <button
                onClick={handleChangePassword}
                className="p-4 bg-white/5 border border-white/10 hover:border-white/30 transition-colors flex items-center justify-center gap-2 hover:bg-white/10"
                aria-label="Change password"
              >
                <Lock className="w-4 h-4" aria-hidden="true" />
                <span className="text-sm font-heading font-semibold">Change Password</span>
              </button>

              <button
                onClick={handleDeleteAccount}
                className="p-4 bg-white/5 border border-red-500/20 hover:border-red-500/50 transition-colors flex items-center justify-center gap-2 hover:bg-red-500/10"
                aria-label="Delete account"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                <span className="text-sm font-heading font-semibold text-red-300">Delete Account</span>
              </button>
            </div>

            {/* Logout Button with Confirmation */}
            <div className="space-y-4">
              <motion.button
                onClick={handleLogoutClick}
                whileHover={{ scale: 1.02 }}
                className="w-full px-8 py-4 bg-red-900 text-white font-heading font-semibold text-sm tracking-wide hover:bg-red-800 transition-all duration-300 flex items-center justify-center gap-3"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                Sign Out
              </motion.button>

              {/* Logout Confirmation */}
              <AnimatePresence>
                {showLogoutConfirm && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-red-900/20 border border-red-500/50 rounded"
                    role="dialog"
                    aria-labelledby="logout-confirm-title"
                  >
                    <p id="logout-confirm-title" className="text-sm font-paragraph text-white/80 mb-4">
                      Are you sure you want to sign out?
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={confirmLogout}
                        className="flex-1 px-4 py-2 bg-red-900 hover:bg-red-800 text-white font-heading font-semibold text-sm rounded transition-colors"
                        aria-label="Confirm sign out"
                      >
                        Yes, Sign Out
                      </button>
                      <button
                        onClick={() => setShowLogoutConfirm(false)}
                        className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-heading font-semibold text-sm rounded transition-colors"
                        aria-label="Cancel sign out"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
