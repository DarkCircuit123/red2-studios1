import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Upload, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { adminCms } from '@/lib/admin-cms';
import { uploadMedia } from '@/lib/wix-media-upload-service';
import { IMAGE_UPLOAD_CONFIG } from '@/lib/upload-config';
import { convertWixImageToHttps } from '@/lib/convert-wix-image';
import type { BehindTheScenes } from '@/entities';

export default function BehindTheScenesManagerSecure() {
  const [items, setItems] = useState<BehindTheScenes[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', photo: '', order: 0, dateTaken: '' });
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try { setLoading(true); const response = await fetch('/api/admin/behind-scenes', { credentials: 'include' }); const data = await response.json(); if (!response.ok || !data.success) throw new Error(data.error || 'Load failed'); setItems((data.items || []).sort((a: BehindTheScenes, b: BehindTheScenes) => (a.order || 0) - (b.order || 0))); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const save = async () => {
    if (!form.title.trim()) return setError('Title is required');
    try { setSaving(true); await adminCms.create('behindthescenes', { _id: crypto.randomUUID(), title: form.title.trim().slice(0, 200), photo: form.photo, description: '', order: Math.max(0, Math.min(1000, Math.round(form.order))), dateTaken: form.dateTaken || undefined }); setForm({ title: '', photo: '', order: items.length, dateTaken: '' }); setError(null); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  };
  const remove = async (id: string) => { if (!window.confirm('Delete this item?')) return; try { await adminCms.delete('behindthescenes', id); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Delete failed'); } };
  const upload = async (file: File) => { try { setSaving(true); const result = await uploadMedia(file, 'image', IMAGE_UPLOAD_CONFIG); setForm((current) => ({ ...current, photo: result.mediaUrl })); setError(null); } catch (e) { setError(e instanceof Error ? e.message : 'Upload failed'); } finally { setSaving(false); } };

  return <div className="space-y-6"><div className="bg-admin-surface border border-admin-line p-6"><div className="flex justify-between"><div><h2 className="font-heading text-[13px] uppercase">Behind The Scenes</h2><p className="text-[13px] text-admin-dim mt-1">{items.length} items</p></div><Button onClick={() => setForm({ title: '', photo: '', order: items.length, dateTaken: new Date().toISOString().slice(0,10) })}><Plus className="w-4 h-4 mr-2" />New Item</Button></div>{error && <p className="text-[12px] text-danger mt-3">{error}</p>}</div>
    <div className="bg-admin-raise border border-admin-line p-6 grid md:grid-cols-2 gap-3"><Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /><Input type="number" placeholder="Order" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} /><Input type="date" value={form.dateTaken} onChange={(e) => setForm({ ...form, dateTaken: e.target.value })} /><label className="border border-admin-line p-2 text-[12px] cursor-pointer flex items-center gap-2"><Upload className="w-4 h-4" />Upload photo<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(file); }} /></label>{form.photo && <img src={convertWixImageToHttps(form.photo) || form.photo} alt="Preview" className="w-32 h-24 object-cover border border-admin-line" />}<Button onClick={() => void save()} disabled={saving}>{saving ? 'Saving…' : 'Save Item'}</Button></div>
    <div className="flex justify-end"><Button variant="outline" onClick={() => void load()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button></div>
    {loading ? <div className="py-12 flex justify-center"><LoadingSpinner /></div> : <div className="space-y-2">{items.map((item) => <div key={item._id} className="flex items-center gap-3 border border-admin-line bg-admin-surface p-2"><img src={convertWixImageToHttps(item.photo || '') || item.photo || ''} alt={item.title || 'Behind the scenes'} className="w-24 h-16 object-cover" /><div className="flex-1"><p className="font-heading text-[12px]">{item.title}</p><p className="text-[11px] text-admin-dim">Order {item.order}</p></div><button onClick={() => void remove(item._id)} className="p-2 text-danger"><Trash2 className="w-4 h-4" /></button></div>)}</div>}
  </div>;
}
