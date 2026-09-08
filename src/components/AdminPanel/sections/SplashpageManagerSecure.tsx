import React, { useEffect, useState } from 'react';
import { Upload, Trash2, Check, AlertCircle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadMedia } from '@/lib/wix-media-upload-service';
import { IMAGE_UPLOAD_CONFIG } from '@/lib/upload-config';
import { adminCms } from '@/lib/admin-cms';
import { convertWixImageToHttps } from '@/lib/convert-wix-image';
import type { Splashpage } from '@/entities';

export default function SplashpageManagerSecure() {
  const [activeLogo, setActiveLogo] = useState<Splashpage | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const load = async () => { try { setLoading(true); const response = await fetch('/api/admin/splashpage', { credentials: 'include' }); const data = await response.json(); if (!response.ok || !data.success) throw new Error(data.error || 'Load failed'); setActiveLogo(data.item || null); } catch (e) { setError(true); setMessage(e instanceof Error ? e.message : 'Failed to load splash page logo'); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const select = (next: File | undefined) => { if (!next) return; if (!IMAGE_UPLOAD_CONFIG.acceptedMimeTypes.includes(next.type)) return void (setError(true), setMessage('Unsupported image type.')); if (next.size > 10 * 1024 * 1024) return void (setError(true), setMessage('File must be 10MB or smaller.')); setError(false); setMessage(null); setFile(next); const reader = new FileReader(); reader.onload = () => setPreview(typeof reader.result === 'string' ? reader.result : null); reader.readAsDataURL(next); };
  const save = async () => { if (!file) return; try { setSaving(true); const result = await uploadMedia(file, 'image', IMAGE_UPLOAD_CONFIG); if (activeLogo?._id) await adminCms.update('splashpage', { _id: activeLogo._id, isActive: false }); const newLogo: Splashpage = { _id: crypto.randomUUID(), logoImage: result.mediaUrl, logoName: file.name.replace(/\.[^/.]+$/, ''), altText: `Splash page logo - ${new Date().toLocaleDateString()}`, updatedDate: new Date(), isActive: true }; await adminCms.create('splashpage', newLogo); setActiveLogo(newLogo); setFile(null); setPreview(null); setError(false); setMessage('Splash page logo updated successfully.'); } catch (e) { setError(true); setMessage(e instanceof Error ? e.message : 'Failed to save logo'); } finally { setSaving(false); } };
  const remove = async () => { if (!activeLogo?._id || !window.confirm('Delete the current logo?')) return; try { setSaving(true); await adminCms.delete('splashpage', activeLogo._id); setActiveLogo(null); setMessage('Logo deleted.'); } catch (e) { setError(true); setMessage(e instanceof Error ? e.message : 'Delete failed'); } finally { setSaving(false); } };
  if (loading) return <div className="py-12 flex justify-center"><Loader className="w-6 h-6 animate-spin text-oxblood" /></div>;
  return <div className="space-y-6">{message && <div className={`p-3 border flex gap-2 ${error ? 'border-danger/30 text-danger' : 'border-ok/30 text-ok'}`}>{error ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}{message}</div>}<div className="bg-admin-surface border border-admin-line p-6"><h2 className="font-heading text-[13px] uppercase mb-4">Current Logo</h2>{activeLogo?.logoImage ? <div className="space-y-3"><img src={convertWixImageToHttps(activeLogo.logoImage) || activeLogo.logoImage} alt={activeLogo.altText || 'Splash logo'} className="w-full max-w-xs h-40 object-contain bg-admin-raise border border-admin-line" /><Button variant="outline" onClick={() => void remove()} disabled={saving}><Trash2 className="w-4 h-4 mr-2" />Delete Logo</Button></div> : <p className="text-[13px] text-admin-dim">No logo uploaded.</p>}</div><div className="bg-admin-surface border border-admin-line p-6 space-y-4"><h2 className="font-heading text-[13px] uppercase">Upload New Logo</h2>{preview && <img src={preview} alt="New logo preview" className="w-full max-w-xs h-40 object-contain bg-admin-raise border border-admin-line" />}<label className="flex items-center gap-2 border border-dashed border-admin-line p-6 cursor-pointer"><Upload className="w-4 h-4" />Select image<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/tiff" className="hidden" onChange={(e) => select(e.target.files?.[0])} disabled={saving} /></label>{file && <Button onClick={() => void save()} disabled={saving}>{saving ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}{saving ? 'Saving…' : 'Save Logo'}</Button>}</div></div>;
}
