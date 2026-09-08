import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Plus, Trash2, Edit2, X, Check, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ClientsPress } from '@/entities';

type Form = { clientName: string; clientLogo: string; externalLink: string; highlightDescription: string; dateOfFeature: string; category: string };
const EMPTY: Form = { clientName: '', clientLogo: '', externalLink: '', highlightDescription: '', dateOfFeature: '', category: '' };

export default function SponsorsManagerSecure() {
  const [sponsors, setSponsors] = useState<ClientsPress[]>([]);
  const [form, setForm] = useState<Form>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showStatus = (type: 'success' | 'error', message: string) => {
    setStatus({ type, message });
    window.setTimeout(() => setStatus(null), 5000);
  };

  const load = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/sponsors', { credentials: 'include', headers: { Accept: 'application/json' } });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to load sponsors');
      setSponsors(Array.isArray(data.items) ? data.items : []);
    } catch (error) { showStatus('error', error instanceof Error ? error.message : 'Failed to load sponsors'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const startNew = () => { setEditingId('NEW'); setForm({ ...EMPTY, dateOfFeature: new Date().toISOString().slice(0, 10) }); };
  const startEdit = (sponsor: ClientsPress) => setEditingId(sponsor._id || null) || setForm({
    clientName: sponsor.clientName || '', clientLogo: sponsor.clientLogo || '', externalLink: sponsor.externalLink || '',
    highlightDescription: sponsor.highlightDescription || '', dateOfFeature: sponsor.dateOfFeature ? new Date(sponsor.dateOfFeature).toISOString().slice(0, 10) : '', category: sponsor.category || '',
  });
  const cancel = () => { setEditingId(null); setForm(EMPTY); };

  const save = async () => {
    if (!form.clientName.trim()) return showStatus('error', 'Client name is required');
    try {
      setSaving(true);
      const response = await fetch('/api/admin/sponsors', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ action: editingId === 'NEW' ? 'create' : 'update', sponsorId: editingId === 'NEW' ? undefined : editingId, sponsor: form }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Save failed');
      await load(); cancel(); showStatus('success', editingId === 'NEW' ? 'Sponsor added' : 'Sponsor updated');
    } catch (error) { showStatus('error', error instanceof Error ? error.message : 'Save failed'); }
    finally { setSaving(false); }
  };

  const remove = async (id?: string, name?: string) => {
    if (!id || !window.confirm(`Delete sponsor "${name || 'this sponsor'}"?`)) return;
    try {
      const response = await fetch('/api/admin/sponsors', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ action: 'delete', sponsorId: id }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Delete failed');
      setSponsors((current) => current.filter((item) => item._id !== id));
      showStatus('success', 'Sponsor deleted');
    } catch (error) { showStatus('error', error instanceof Error ? error.message : 'Delete failed'); }
  };

  const update = (key: keyof Form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  return <div className="space-y-6">
    {status && <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="fixed top-4 right-4 z-50 p-3 border bg-admin-raise border-admin-line text-admin-text flex items-center gap-2">{status.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}{status.message}</motion.div>}
    <div className="bg-admin-surface border border-admin-line p-6 flex items-center justify-between"><div><h2 className="font-heading text-[13px] uppercase tracking-[0.12em] text-admin-text">Sponsors & Partners</h2><p className="text-[13px] text-admin-dim mt-2">Manage client logos and featured partners</p></div><Button onClick={startNew} disabled={editingId !== null}><Plus className="w-4 h-4 mr-2" />Add Sponsor</Button></div>
    {editingId && <div className="bg-admin-raise border border-admin-line p-6 space-y-4">
      <div className="flex justify-between"><h3 className="font-heading text-[13px] uppercase">{editingId === 'NEW' ? 'New Sponsor' : 'Edit Sponsor'}</h3><button onClick={cancel}><X className="w-4 h-4" /></button></div>
      <div className="grid md:grid-cols-2 gap-4">
        <Input placeholder="Client name *" value={form.clientName} onChange={(e) => update('clientName', e.target.value)} />
        <Input placeholder="Logo URL (https://...)" value={form.clientLogo} onChange={(e) => update('clientLogo', e.target.value)} />
        <Input placeholder="Website URL (https://...)" value={form.externalLink} onChange={(e) => update('externalLink', e.target.value)} />
        <Input placeholder="Category" value={form.category} onChange={(e) => update('category', e.target.value)} />
        <Input placeholder="Description" value={form.highlightDescription} onChange={(e) => update('highlightDescription', e.target.value)} />
        <Input type="date" value={form.dateOfFeature} onChange={(e) => update('dateOfFeature', e.target.value)} />
      </div>
      <div className="flex gap-2"><Button onClick={() => void save()} disabled={saving}>{saving ? <LoadingSpinner className="w-3 h-3 mr-2" /> : <Check className="w-3 h-3 mr-2" />}Save</Button><Button variant="outline" onClick={cancel} disabled={saving}>Cancel</Button></div>
    </div>}
    <div className="bg-admin-surface border border-admin-line p-6"><h3 className="font-heading text-[13px] uppercase tracking-[0.12em] mb-4">All Sponsors ({sponsors.length})</h3>{loading ? <div className="py-8 flex justify-center"><LoadingSpinner /></div> : sponsors.length === 0 ? <p className="text-[13px] text-admin-dim text-center py-8">No sponsors yet.</p> : <div className="space-y-2">{sponsors.map((sponsor) => <div key={sponsor._id} className="flex items-center justify-between p-3 border border-admin-line bg-admin-raise"><div><p className="font-heading text-[13px]">{sponsor.clientName}</p><p className="text-[11px] text-admin-dim">{sponsor.category || 'Uncategorized'}</p></div><div className="flex gap-2"><button onClick={() => startEdit(sponsor)} disabled={editingId !== null} className="p-2"><Edit2 className="w-4 h-4" /></button><button onClick={() => void remove(sponsor._id, sponsor.clientName)} className="p-2"><Trash2 className="w-4 h-4" /></button></div></div>)}</div>}</div>
  </div>;
}
