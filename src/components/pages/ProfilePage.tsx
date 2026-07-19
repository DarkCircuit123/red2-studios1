import { useMember } from '@/integrations';
import { BaseCrudService } from '@/integrations';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { LogOut, Mail, Calendar, Lock, Edit2, Check, X, AlertCircle, Eye, Trash2 } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { Link } from 'react-router-dom';
import { playClickSound } from '@/lib/click-sound';
import { useState, useEffect } from 'react';
import { ClientProofingGalleries } from '@/entities';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function ProfilePage() {
  const { member, actions } = useMember();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(member?.profile?.nickname || member?.contact?.firstName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [galleries, setGalleries] = useState<ClientProofingGalleries[]>([]);
  const [galleriesLoading, setGalleriesLoading] = useState(true);
  
  // Password change state
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Delete account state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  // Update editedName when member changes
  useEffect(() => {
    setEditedName(member?.profile?.nickname || member?.contact?.firstName || '');
  }, [member?.profile?.nickname, member?.contact?.firstName]);

  // Load galleries for this member
  useEffect(() => {
    const loadGalleries = async () => {
      if (!member?.loginEmail) {
        setGalleriesLoading(false);
        return;
      }

      try {
        const result = await BaseCrudService.getAll<ClientProofingGalleries>(
          'clientgalleries',
          {},
          { limit: 100 }
        );

        const memberGalleries = (result.items || []).filter(
          (g) => g.clientEmail?.toLowerCase() === member.loginEmail.toLowerCase()
        );

        setGalleries(memberGalleries);
      } catch (err) {
        console.error('Failed to load galleries:', err);
      } finally {
        setGalleriesLoading(false);
      }
    };

    loadGalleries();
  }, [member?.loginEmail]);

  const handleLogout = () => {
    playClickSound();
    actions.logout();
  };

  const handleSaveName = async () => {
    if (!editedName.trim() || editedName === (member?.profile?.nickname || member?.contact?.firstName)) {
      setIsEditingName(false);
      setError(null);
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Use the Wix Members API to update the member's profile
      // The updateMember function should handle the API call
      if (actions.updateMember) {
        await actions.updateMember({
          profile: {
            nickname: editedName.trim()
          }
        });
        setSuccess(true);
        setIsEditingName(false);
        // Reload member data to reflect changes
        if (actions.loadCurrentMember) {
          await actions.loadCurrentMember();
        }
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error('Update member function not available');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update name. Please try again.');
      // Revert to original name on error
      setEditedName(member?.profile?.nickname || member?.contact?.firstName || '');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedName(member?.profile?.nickname || member?.contact?.firstName || '');
    setIsEditingName(false);
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    
    // Validation
    if (!currentPassword.trim()) {
      setPasswordError('Current password is required');
      return;
    }
    if (!newPassword.trim()) {
      setPasswordError('New password is required');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      // Use the Wix Members API to update password
      // The updatePassword method should be available on the members module
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update password');
      }

      setSuccess(true);
      setShowChangePasswordDialog(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Force re-login after password change
      setTimeout(() => {
        setSuccess(false);
        actions.logout();
      }, 2000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError(null);

    if (!deleteConfirmPassword.trim()) {
      setDeleteError('Password is required to delete account');
      return;
    }

    setIsDeletingAccount(true);
    try {
      // Use the Wix Members API to delete account
      const response = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: deleteConfirmPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete account');
      }

      // Account deleted successfully, logout
      setShowDeleteDialog(false);
      await actions.logout();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <main className="pt-32 pb-24">
        <div className="max-w-[120rem] mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            {/* Profile Header */}
            <div className="mb-16">
              <h1 className="text-6xl md:text-7xl font-heading font-bold text-white mb-4 tracking-tighter">
                Client Profile
              </h1>
              <p className="text-base font-paragraph text-white/60">
                Manage your account and access your galleries
              </p>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-4 bg-red-900/20 border border-red-500/50 rounded flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm font-paragraph text-red-200">{error}</p>
              </motion.div>
            )}
            
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-8 p-4 bg-green-900/20 border border-green-500/50 rounded flex items-center gap-3"
              >
                <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                <p className="text-sm font-paragraph text-green-200">Name updated successfully!</p>
              </motion.div>
            )}

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
                <div className="flex-1">
                  <div className="mb-8">
                    {isEditingName ? (
                      <div className="flex items-center gap-3 mb-4">
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="text-3xl font-heading font-bold bg-white/10 border border-white/20 text-white px-3 py-2 rounded focus:outline-none focus:border-white/40"
                          placeholder="Enter your name"
                          disabled={isSaving}
                        />
                        <button
                          onClick={handleSaveName}
                          disabled={isSaving}
                          className="p-2 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
                          title="Save"
                        >
                          <Check className="w-5 h-5 text-green-400" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          className="p-2 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
                          title="Cancel"
                        >
                          <X className="w-5 h-5 text-red-400" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 mb-4 group cursor-pointer" onClick={() => setIsEditingName(true)}>
                        <h2 className="text-3xl font-heading font-bold text-white">
                          {member?.profile?.nickname || member?.contact?.firstName || 'Client'}
                        </h2>
                        <Edit2 className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors opacity-0 group-hover:opacity-100" />
                      </div>
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
                      <Mail className="w-5 h-5 text-white/40" />
                      <span className="text-base font-paragraph text-white/80">
                        {member?.loginEmail || 'No email'}
                      </span>
                    </div>
                    {member?.contact?.phones && member.contact.phones.length > 0 && (
                      <div className="flex items-center gap-3">
                        <span className="text-base font-paragraph text-white/80">
                          {member.contact.phones[0]}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-white/40" />
                      <span className="text-sm font-paragraph text-white/60">
                        Member since {member?._createdDate ? new Date(member._createdDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm font-mono text-white/60 uppercase tracking-widest">
                      {member?.status || 'Active'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <Link
                to="/booking"
                onClick={playClickSound}
                className="p-8 bg-white/5 border border-white/10 hover:border-white/30 transition-colors block"
              >
                <h3 className="text-lg font-heading font-bold text-white mb-2">
                  Book Session
                </h3>
                <p className="text-sm font-paragraph text-white/60">
                  Schedule your next photography session
                </p>
              </Link>

              <Link
                to="/contact"
                onClick={playClickSound}
                className="p-8 bg-white/5 border border-white/10 hover:border-white/30 transition-colors block"
              >
                <h3 className="text-lg font-heading font-bold text-white mb-2">
                  Contact Support
                </h3>
                <p className="text-sm font-paragraph text-white/60">
                  Get help or ask questions
                </p>
              </Link>
            </div>

            {/* Your Galleries Section */}
            <div className="mb-12">
              <h2 className="text-3xl font-heading font-bold text-white mb-6">Your Galleries</h2>
              
              {galleriesLoading ? (
                <div className="p-8 bg-white/5 border border-white/10 text-center">
                  <p className="text-white/60">Loading galleries...</p>
                </div>
              ) : galleries.length === 0 ? (
                <div className="p-8 bg-white/5 border border-white/10 text-center">
                  <p className="text-white/60">No galleries available yet. Check back soon!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {galleries.map((gallery) => {
                    const isExpired = gallery.galleryExpirationDate 
                      ? new Date(gallery.galleryExpirationDate) < new Date()
                      : false;
                    
                    return (
                      <motion.div
                        key={gallery._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 bg-white/5 border border-white/10 hover:border-white/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-heading font-bold text-white">
                                {gallery.clientName || 'Gallery'}
                              </h3>
                              {gallery.requiresPin && (
                                <Lock className="w-4 h-4 text-yellow-400" title="PIN required" />
                              )}
                            </div>
                            
                            <div className="space-y-2 text-sm text-white/60">
                              {gallery.galleryExpirationDate && (
                                <p>
                                  Expires: {new Date(gallery.galleryExpirationDate).toLocaleDateString()}
                                </p>
                              )}
                              <p>
                                Status:{' '}
                                <span className={`font-semibold ${
                                  isExpired ? 'text-red-400' : 'text-green-400'
                                }`}>
                                  {isExpired ? 'Expired' : gallery.approvalStatus || 'Active'}
                                </span>
                              </p>
                            </div>
                          </div>

                          {!isExpired && (
                            <Link
                              to={`/gallery/${gallery._id}`}
                              onClick={playClickSound}
                              className="px-6 py-2 bg-white text-black font-heading font-bold text-sm tracking-widest uppercase hover:bg-white/90 transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Link>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Account Actions */}
            <div className="space-y-4 mb-12">
              <button
                onClick={() => {
                  playClickSound();
                  setShowChangePasswordDialog(true);
                }}
                className="w-full px-8 py-3 bg-white/10 text-white font-heading font-semibold text-sm tracking-wide hover:bg-white/20 transition-all duration-300 border border-white/20 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Change Password
              </button>
              
              <button
                onClick={() => {
                  playClickSound();
                  setShowDeleteDialog(true);
                }}
                className="w-full px-8 py-3 bg-red-900/20 text-red-300 font-heading font-semibold text-sm tracking-wide hover:bg-red-900/40 transition-all duration-300 border border-red-500/30 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </button>
            </div>

            {/* Logout Button */}
            <motion.button
              onClick={handleLogout}
              whileHover={{ scale: 1.02 }}
              className="w-full px-8 py-4 bg-red-900 text-white font-heading font-semibold text-sm tracking-wide hover:bg-red-800 transition-all duration-300 flex items-center justify-center gap-3"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </motion.button>
          </motion.div>
        </div>
      </main>

      <Footer />

      {/* Change Password Dialog */}
      <AlertDialog open={showChangePasswordDialog} onOpenChange={setShowChangePasswordDialog}>
        <AlertDialogContent className="bg-black border border-white/20 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-2xl font-heading">Change Password</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Enter your current password and choose a new one. Password must be at least 8 characters.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            {passwordError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-900/20 border border-red-500/50 rounded flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-sm font-paragraph text-red-200">{passwordError}</p>
              </motion.div>
            )}

            {/* Current Password */}
            <div>
              <label className="block text-sm font-paragraph text-white/80 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isChangingPassword}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 text-white rounded focus:outline-none focus:border-white/40 disabled:opacity-50"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-paragraph text-white/80 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isChangingPassword}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 text-white rounded focus:outline-none focus:border-white/40 disabled:opacity-50"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-paragraph text-white/80 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isChangingPassword}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 text-white rounded focus:outline-none focus:border-white/40 disabled:opacity-50"
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={isChangingPassword}
              className="bg-white/10 text-white hover:bg-white/20 border-white/20"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="bg-white text-black hover:bg-white/90 disabled:opacity-50"
            >
              {isChangingPassword ? 'Updating...' : 'Update Password'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-black border border-red-500/30 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400 text-2xl font-heading">Delete Account</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              This action cannot be undone. All your data will be permanently deleted. Please enter your password to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            {deleteError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-900/20 border border-red-500/50 rounded flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-sm font-paragraph text-red-200">{deleteError}</p>
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-paragraph text-white/80 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showDeletePassword ? 'text' : 'password'}
                  value={deleteConfirmPassword}
                  onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                  disabled={isDeletingAccount}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 text-white rounded focus:outline-none focus:border-white/40 disabled:opacity-50"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowDeletePassword(!showDeletePassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={isDeletingAccount}
              className="bg-white/10 text-white hover:bg-white/20 border-white/20"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount}
              className="bg-red-900 text-white hover:bg-red-800 disabled:opacity-50"
            >
              {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
