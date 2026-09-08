import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Trash2, Upload, RefreshCw, Search, Maximize2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { convertWixImageToHttps } from '@/lib/convert-wix-image';

interface Photo { _id?: string; image?: string; caption?: string; altText?: string; displayOrder?: number; _createdDate?: string | Date; }

const MAX_FILES_PER_BATCH = 20;

export default function ProfessionalPhotoLibraryFixed() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [preview, setPreview] = useState<Photo | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const notify = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    window.setTimeout(() => setMessage(null), 5000);
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cms/get-portfolio?limit=1000', { credentials: 'include', headers: { Accept: 'application/json' } });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to load photo library');
      setPhotos(Array.isArray(data.items) ? data.items : []);
    } catch (error) { notify('error', error instanceof Error ? error.message : 'Failed to load photo library'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const addFiles = (incoming: FileList | File[]) => {
    const selected = Array.from(incoming).filter((file) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/tiff', 'image/heic'].includes(file.type));
    if (!selected.length) return notify('error', 'No supported images selected.');
    const next = [...files, ...selected].slice(0, MAX_FILES_PER_BATCH);
    setFiles(next);
    if (selected.length > MAX_FILES_PER_BATCH) notify('error', `Maximum ${MAX_FILES_PER_BATCH} files per batch.`);
  };

  const uploadOne = async (file: File, slotNumber: number) => {
    const form = new FormData();
    form.append('file', file);
    const upload = await fetch('/api/media/upload-gallery', { method: 'POST', credentials: 'include', body: form });
    const uploadData = await upload.json();
    if (!upload.ok || !uploadData.success || !uploadData.mediaUrl) throw new Error(uploadData.error || 'Image upload failed');

    const save = await fetch('/api/portfolio/upsert-slot', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ displayOrder: slotNumber, image: uploadData.mediaUrl, caption: file.name.replace(/\.[^/.]+$/, ''), altText: file.name, portfolioItemId: 'work-gallery' }),
    });
    const saveData = await save.json();
    if (!save.ok || !saveData.success) throw new Error(saveData.error || 'Failed to save photo metadata');
  };

  const uploadAll = async () => {
    if (!files.length || uploading) return;
    setUploading(true);
    let nextSlot = Math.max(0, ...photos.map((photo) => Number(photo.displayOrder) || 0)) + 1;
    let completed = 0;
    try {
      for (const file of files) {
        try { await uploadOne(file, nextSlot++); completed += 1; }
        catch (error) { notify('error', `${file.name}: ${error instanceof Error ? error.message : 'Upload failed'}`); }
      }
      setFiles([]);
      if (inputRef.current) inputRef.current.value = '';
      await load();
      if (completed) notify('success', `Uploaded ${completed} photo${completed === 1 ? '' : 's'}.`);
    } finally { setUploading(false); }
  };

  const remove = async (photo: Photo) => {
    if (!photo.displayOrder || !window.confirm(`Delete ${photo.caption || 'this photo'}?`)) return;
    setBusyId(photo._id || String(photo.displayOrder));
    try {
      const response = await fetch('/api/portfolio/delete-slot', {
        method: 'DELETE', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ displayOrder: photo.displayOrder }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Delete failed');
      setPhotos((current) => current.filter((item) => item.displayOrder !== photo.displayOrder));
      notify('success', 'Photo deleted.');
    } catch (error) { notify('error', error instanceof Error ? error.message : 'Delete failed'); }
    finally { setBusyId(null); }
  };

  const filtered = useMemo(() => photos.filter((photo) => !search || `${photo.caption || ''} ${photo.altText || ''}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0)), [photos, search]);

  return <div className="space-y-6">
    {message && <div className="fixed top-4 right-4 z-50 p-3 border bg-admin-raise border-admin-line text-admin-text flex gap-2 items-center">{message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}{message.text}</div>}
    <div className="bg-admin-surface border border-admin-line p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-heading text-[13px] uppercase tracking-[0.12em]">Professional Photo Library</h2><p className="text-[13px] text-admin-dim mt-2">{photos.length} stored photos</p></div><div className="flex gap-2"><Button onClick={() => void load()} variant="outline"><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button><Button onClick={() => inputRef.current?.click()} disabled={uploading}><Upload className="w-4 h-4 mr-2" />Select Photos</Button></div></div>
      <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,image/tiff,image/heic" className="hidden" onChange={(event) => { if (event.target.files) addFiles(event.target.files); }} />
      <div className="border-2 border-dashed border-admin-line p-8 text-center" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addFiles(event.dataTransfer.files); }}><Upload className="w-8 h-8 mx-auto mb-2 text-oxblood" /><p className="text-[13px]">Drop photos here or click Select Photos</p><p className="text-[11px] text-admin-dim mt-1">JPEG, PNG, WebP, GIF, TIFF, HEIC · 10MB each</p></div>
      {files.length > 0 && <div className="flex items-center justify-between border border-admin-line p-3"><span className="text-[13px]">{files.length} selected</span><div className="flex gap-2"><Button variant="outline" onClick={() => setFiles([])} disabled={uploading}>Clear</Button><Button onClick={() => void uploadAll()} disabled={uploading}>{uploading ? 'Uploading…' : 'Upload'}</Button></div></div>}
    </div>
    <div className="flex items-center gap-3"><Search className="w-4 h-4 text-admin-dim" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search captions or filenames" /></div>
    {loading ? <div className="py-16 flex justify-center"><LoadingSpinner /></div> : filtered.length === 0 ? <div className="border border-admin-line p-12 text-center text-admin-dim">No photos found.</div> : <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">{filtered.map((photo) => { const image = photo.image ? convertWixImageToHttps(photo.image) || photo.image : ''; const id = photo._id || String(photo.displayOrder); return <div key={id} className="relative aspect-[4/5] border border-admin-line bg-admin-raise overflow-hidden group"><img src={image} alt={photo.altText || photo.caption || 'Portfolio photo'} className="w-full h-full object-cover" loading="lazy" /><div className="absolute top-2 left-2 text-[10px] bg-black/60 text-white px-1">{photo.displayOrder}</div><div className="absolute inset-x-0 bottom-0 p-2 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1"><button className="p-2 text-white" onClick={() => setPreview(photo)}><Maximize2 className="w-3 h-3" /></button><button className="p-2 text-white" disabled={busyId === id} onClick={() => void remove(photo)}><Trash2 className="w-3 h-3" /></button></div></div>; })}</div>}
    {preview?.image && <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6" onClick={() => setPreview(null)}><img src={convertWixImageToHttps(preview.image) || preview.image} alt={preview.altText || preview.caption || 'Preview'} className="max-h-full max-w-full object-contain" /></div>}
  </div>;
}
