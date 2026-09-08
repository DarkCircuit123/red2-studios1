import React, { useEffect, useRef, useState } from 'react';
import { Upload, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { adminCms } from '@/lib/admin-cms';
import { uploadMedia } from '@/lib/wix-media-upload-service';
import { IMAGE_UPLOAD_CONFIG } from '@/lib/upload-config';
import { convertWixImageToHttps } from '@/lib/convert-wix-image';
import type { CarouselImages } from '@/entities';

export default function RubberBandPhotosManagerSecure() {
  const [photos, setPhotos] = useState<CarouselImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => { try { setLoading(true); const response = await fetch('/api/admin/carousel', { credentials: 'include' }); const data = await response.json(); if (!response.ok || !data.success) throw new Error(data.error || 'Load failed'); setPhotos((data.items || []).filter((item: CarouselImages) => item.isActive !== false).sort((a: CarouselImages, b: CarouselImages) => (a.displayOrder || 0) - (b.displayOrder || 0))); } catch (e) { console.error('[CarouselAdmin] Load failed:', e instanceof Error ? e.message : String(e)); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);

  const upload = async (file: File) => { try { setUploading(true); const result = await uploadMedia(file, 'image', IMAGE_UPLOAD_CONFIG); const nextOrder = Math.max(0, ...photos.map((photo) => Number(photo.displayOrder) || 0)) + 1; const item: CarouselImages = { _id: crypto.randomUUID(), imageName: file.name.replace(/\.[^/.]+$/, '').slice(0, 200), image: result.mediaUrl, displayOrder: nextOrder, isActive: true }; await adminCms.create('carouselimages', item); await load(); } catch (e) { console.error('[CarouselAdmin] Upload failed:', e instanceof Error ? e.message : String(e)); } finally { setUploading(false); if (inputRef.current) inputRef.current.value = ''; } };
  const remove = async (id: string) => { if (!window.confirm('Delete this carousel photo?')) return; try { await adminCms.delete('carouselimages', id); setPhotos((current) => current.filter((photo) => photo._id !== id)); } catch (e) { console.error('[CarouselAdmin] Delete failed:', e instanceof Error ? e.message : String(e)); } };

  return <div className="space-y-6"><div className="bg-admin-surface border border-admin-line p-6 flex items-center justify-between"><div><h2 className="font-heading text-[13px] uppercase">Carousel Photos</h2><p className="text-[13px] text-admin-dim mt-1">{photos.length} active photos</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => void load()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(file); }} /><Button onClick={() => inputRef.current?.click()} disabled={uploading}><Upload className="w-4 h-4 mr-2" />{uploading ? 'Uploading…' : 'Upload Photo'}</Button></div></div>{loading ? <div className="py-12 flex justify-center"><LoadingSpinner /></div> : photos.length === 0 ? <div className="border border-admin-line p-12 text-center text-admin-dim">No carousel photos yet.</div> : <div className="space-y-2">{photos.map((photo) => <div key={photo._id} className="flex items-center gap-3 border border-admin-line bg-admin-raise p-2"><img src={convertWixImageToHttps(photo.image || '') || photo.image || ''} alt={photo.imageName || 'Carousel photo'} className="w-24 h-16 object-cover" /><div className="flex-1"><p className="font-heading text-[12px]">{photo.imageName || 'Untitled'}</p><p className="text-[11px] text-admin-dim">Order {photo.displayOrder}</p></div><button onClick={() => void remove(photo._id)} className="p-2 text-danger"><Trash2 className="w-4 h-4" /></button></div>)}</div>}</div>;
}
