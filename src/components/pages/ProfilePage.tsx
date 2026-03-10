import { useMember } from '@/integrations';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { LogOut, Mail, Calendar, MapPin } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { Link } from 'react-router-dom';
import { playClickSound } from '@/lib/click-sound';

export default function ProfilePage() {
  const { member, actions } = useMember();

  const handleLogout = () => {
    playClickSound();
    actions.logout();
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
                    <h2 className="text-3xl font-heading font-bold text-white mb-2">
                      {member?.profile?.nickname || member?.contact?.firstName || 'Client'}
                    </h2>
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
