import { useMember } from '@/integrations';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { LogOut, Mail, Calendar, MapPin, Edit2, Check, X, AlertCircle } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { Link } from 'react-router-dom';
import { playClickSound } from '@/lib/click-sound';
import { useState, useEffect } from 'react';

export default function ProfilePage() {
  const { member, actions } = useMember();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(member?.profile?.nickname || member?.contact?.firstName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Update editedName when member changes
  useEffect(() => {
    setEditedName(member?.profile?.nickname || member?.contact?.firstName || '');
  }, [member?.profile?.nickname, member?.contact?.firstName]);

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
                to="/galleries"
                onClick={playClickSound}
                className="p-8 bg-white/5 border border-white/10 hover:border-white/30 transition-colors block"
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
    </div>
  );
}
