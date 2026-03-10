import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Plus, Edit2, Trash2, Eye, CheckCircle, Clock, Lock } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { useAuthStore } from '@/lib/clientAuthStore';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Image } from '@/components/ui/image';

interface ClientGallery {
  _id: string;
  clientName: string;
  clientEmail: string;
  galleryAccessCode: string;
  approvalStatus: string;
  galleryCoverImage: string;
  galleryExpirationDate: string;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { adminSession, logout } = useAuthStore();
  const [galleries, setGalleries] = useState<ClientGallery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGallery, setSelectedGallery] = useState<ClientGallery | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<Partial<ClientGallery>>({});

  // Redirect if not authenticated
  useEffect(() => {
    if (!adminSession?.isAdmin) {
      navigate('/admin-login');
    }
  }, [adminSession, navigate]);

  useEffect(() => {
    loadGalleries();
  }, []);

  const loadGalleries = async () => {
    try {
      const result = await BaseCrudService.getAll<ClientGallery>('clientgalleries', {}, { limit: 100 });
      setGalleries(result.items || []);
    } catch (error) {
      console.warn('Error loading galleries:', error);
      // Continue gracefully - set empty array if fetch fails
      setGalleries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  const handleEditGallery = (gallery: ClientGallery) => {
    setSelectedGallery(gallery);
    setEditData(gallery);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedGallery) return;

    try {
      await BaseCrudService.update('clientgalleries', {
        _id: selectedGallery._id,
        ...editData,
      });
      setIsEditModalOpen(false);
      loadGalleries();
    } catch (error) {
      console.warn('Error updating gallery:', error);
      // Still close modal and reload - show user the current state
      setIsEditModalOpen(false);
      loadGalleries();
    }
  };

  const handleDeleteGallery = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this gallery?')) return;

    try {
      await BaseCrudService.delete('clientgalleries', id);
      loadGalleries();
    } catch (error) {
      console.warn('Error deleting gallery:', error);
      // Still reload to show current state
      loadGalleries();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      default:
        return <Lock className="w-5 h-5 text-white/40" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <section className="relative w-full min-h-screen flex items-center justify-center pt-32">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <section className="relative w-full min-h-screen flex flex-col overflow-hidden pt-32 pb-20">
        <div className="max-w-[100rem] mx-auto px-8 w-full flex-1">
          {/* Header with Logout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 flex items-center justify-between"
          >
            <div>
              <h1 className="text-5xl md:text-6xl font-heading font-black text-white mb-2 uppercase">
                Admin Dashboard
              </h1>
              <p className="text-lg text-white/60">
                Manage client galleries and access codes
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 transition-colors duration-300 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-mono uppercase tracking-widest">Logout</span>
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          >
            <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-white/60 text-sm uppercase tracking-widest mb-2">Total Galleries</p>
              <p className="text-4xl font-heading font-bold text-white">{galleries.length}</p>
            </div>
            <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-white/60 text-sm uppercase tracking-widest mb-2">Approved</p>
              <p className="text-4xl font-heading font-bold text-green-400">
                {galleries.filter((g) => g.approvalStatus === 'approved').length}
              </p>
            </div>
            <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-white/60 text-sm uppercase tracking-widest mb-2">Pending</p>
              <p className="text-4xl font-heading font-bold text-yellow-400">
                {galleries.filter((g) => g.approvalStatus === 'pending').length}
              </p>
            </div>
          </motion.div>

          {/* Galleries Table */}
          {galleries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-white/60 mb-6">No galleries yet.</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="overflow-x-auto"
            >
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-4 text-xs font-heading font-bold text-white/60 uppercase tracking-widest">
                      Client
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-heading font-bold text-white/60 uppercase tracking-widest">
                      Email
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-heading font-bold text-white/60 uppercase tracking-widest">
                      Access Code
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-heading font-bold text-white/60 uppercase tracking-widest">
                      Status
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-heading font-bold text-white/60 uppercase tracking-widest">
                      Expires
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-heading font-bold text-white/60 uppercase tracking-widest">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {galleries.map((gallery, idx) => (
                    <motion.tr
                      key={gallery._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4 px-4 text-white font-heading font-bold">
                        {gallery.clientName}
                      </td>
                      <td className="py-4 px-4 text-white/60 text-sm">{gallery.clientEmail}</td>
                      <td className="py-4 px-4 text-white font-mono text-sm tracking-widest">
                        {gallery.galleryAccessCode}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(gallery.approvalStatus)}
                          <span className="text-sm capitalize text-white/80">
                            {gallery.approvalStatus || 'Pending'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-white/60 text-sm">
                        {gallery.galleryExpirationDate
                          ? new Date(gallery.galleryExpirationDate).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditGallery(gallery)}
                            className="p-2 hover:bg-white/10 transition-colors rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-white/60 hover:text-white" />
                          </button>
                          <button
                            onClick={() => handleDeleteGallery(gallery._id)}
                            className="p-2 hover:bg-white/10 transition-colors rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-white/60 hover:text-red-400" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </div>
      </section>

      {/* Edit Modal */}
      {isEditModalOpen && selectedGallery && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black border border-white/20 rounded-lg p-8 max-w-md w-full"
          >
            <h2 className="text-2xl font-heading font-bold text-white mb-6">Edit Gallery</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-heading font-bold text-white mb-2 uppercase tracking-wide">
                  Status
                </label>
                <select
                  value={editData.approvalStatus || 'pending'}
                  onChange={(e) =>
                    setEditData({ ...editData, approvalStatus: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-heading font-bold text-white mb-2 uppercase tracking-wide">
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={
                    editData.galleryExpirationDate
                      ? new Date(editData.galleryExpirationDate)
                          .toISOString()
                          .split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    setEditData({ ...editData, galleryExpirationDate: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 py-2 bg-white/10 hover:bg-white/20 transition-colors rounded-lg text-white font-heading font-bold text-sm uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-2 bg-white text-black hover:bg-white/90 transition-colors rounded-lg font-heading font-bold text-sm uppercase tracking-widest"
              >
                Save
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
}
