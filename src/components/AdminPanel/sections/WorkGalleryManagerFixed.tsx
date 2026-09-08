import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Copy, Eye, Image as ImageIcon, Info, Maximize2, Plus, RefreshCw, Trash2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { convertWixImageToHttps } from '@/lib/convert-wix-image';

interface PortfolioItem {
  _id?: string;
  image?: string;
  caption?: string;
  altText?: string;
  displayOrder?: number;
  _updatedDate?: string | Date;
}

interface Slot {
  id: string;
  slotNumber: number;
  image?: string;
  filename?: string;
  caption?: string;
  altText?: string;
  uploadedAt?: string;
}

type StatusType = 'info' | 'success' | 'error';
interface StatusMessage { id: string; type: StatusType; message: string; }

const INITIAL_SLOTS = 100;
const SLOT_INCREMENT = 12;

function makeEmptySlot(slotNumber: number): Slot {
  return { id: `slot-${slotNumber}-${crypto.randomUUID()}`, slotNumber };
}

export default function WorkGalleryManagerFixed() {
  const [slotCount, setSlotCount] = useState(INITIAL_SLOTS);
  const [slots, setSlots] = useState<Slot[]>(() => Array.from({ length: INITIAL_SLOTS }, (_, i) => makeEmptySlot(i + 1)));
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [statusMessages, setStatusMessages] = useState<StatusMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [busySlot, setBusySlot] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; slotNumber: number } | null>(null);
  const [showMetadata, setShowMetadata] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addStatus = useCallback((type: StatusType, message: string) => {
    const id = crypto.randomUUID();
    setStatusMessages((current) => [...current, { id, type, message }]);
    window.setTimeout(() => setStatusMessages((current) => current.filter((item) => item.id !== id)), 5000);
  }, []);

  const loadGallery = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/portfolio/get-work-gallery', { headers: { Accept: 'application/json' }, credentials: 'include' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || `Gallery request failed (${response.status})`);

      const items = (data.items || []) as PortfolioItem[];
      const highestOrder = items.reduce((max, item) => Math.max(max, Number(item.displayOrder) || 0), 0);
      const filledCount = items.filter((item) => item.image && item.displayOrder).length;
      const derivedCount = Math.max(INITIAL_SLOTS, highestOrder, filledCount + SLOT_INCREMENT);
      const byOrder = new Map(items.map((item) => [Number(item.displayOrder), item]));

      setSlotCount(derivedCount);
      setSlots(Array.from({ length: derivedCount }, (_, index) => {
        const slotNumber = index + 1;
        const item = byOrder.get(slotNumber);
        if (!item?.image) return makeEmptySlot(slotNumber);
        return {
          id: item._id || `slot-${slotNumber}-${crypto.randomUUID()}`,
          slotNumber,
          image: convertWixImageToHttps(item.image) || item.image,
          filename: item.caption || '',
          caption: item.caption || '',
          altText: item.altText || '',
          uploadedAt: item._updatedDate ? new Date(item._updatedDate).toISOString() : undefined,
        };
      }));
    } catch (error) {
      console.error('[WorkGalleryManager] Failed to load gallery:', error);
      addStatus('error', error instanceof Error ? error.message : 'Failed to load work gallery');
    } finally {
      setIsLoading(false);
    }
  }, [addStatus]);

  useEffect(() => { void loadGallery(); }, [loadGallery]);

  const filledSlots = useMemo(() => slots.filter((slot) => Boolean(slot.image)).length, [slots]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const images = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (!images.length) { addStatus('error', 'No supported image files selected'); return; }
    setSelectedFiles((current) => [...current, ...images]);
    addStatus('info', `Selected ${images.length} image${images.length === 1 ? '' : 's'}`);
  };

  const uploadFileToSlot = async (file: File, slotNumber: number) => {
    const formData = new FormData();
    formData.append('file', file);
    const uploadResponse = await fetch('/api/media/upload-gallery', { method: 'POST', body: formData, credentials: 'include' });
    const uploadData = await uploadResponse.json();
    if (!uploadResponse.ok || !uploadData.success) throw new Error(uploadData.error || 'Media upload failed');

    const imageUrl = uploadData.mediaUrl || uploadData.url;
    if (!imageUrl) throw new Error('Wix Media upload returned no image URL');

    const upsertResponse = await fetch('/api/portfolio/upsert-slot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        displayOrder: slotNumber,
        image: imageUrl,
        caption: file.name.replace(/\.[^/.]+$/, ''),
        altText: file.name,
        portfolioItemId: 'work-gallery',
      }),
    });
    const upsertData = await upsertResponse.json();
    if (!upsertResponse.ok || !upsertData.success) throw new Error(upsertData.error || 'CMS upsert failed');

    return imageUrl as string;
  };

  const handleUpload = async () => {
    if (!selectedFiles.length || isUploading) return;
    setIsUploading(true);
    let uploaded = 0;
    try {
      for (const file of selectedFiles) {
        let target = slots.find((slot) => !slot.image);
        if (!target) {
          const newNumber = slots.length + 1;
          target = makeEmptySlot(newNumber);
          setSlots((current) => [...current, target!]);
          setSlotCount((current) => current + 1);
        }

        setBusySlot(target.slotNumber);
        try {
          const imageUrl = await uploadFileToSlot(file, target.slotNumber);
          const resolved = convertWixImageToHttps(imageUrl) || imageUrl;
          setSlots((current) => current.map((slot) => slot.slotNumber === target!.slotNumber ? {
            ...slot,
            image: resolved,
            filename: file.name,
            caption: file.name.replace(/\.[^/.]+$/, ''),
            altText: file.name,
            uploadedAt: new Date().toISOString(),
          } : slot));
          uploaded += 1;
        } catch (error) {
          addStatus('error', `${file.name}: ${error instanceof Error ? error.message : 'Upload failed'}`);
        }
      }
      if (uploaded) addStatus('success', `Uploaded ${uploaded} image${uploaded === 1 ? '' : 's'}`);
    } finally {
      setBusySlot(null);
      setIsUploading(false);
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReplace = async (slotNumber: number, file: File) => {
    setBusySlot(slotNumber);
    try {
      const imageUrl = await uploadFileToSlot(file, slotNumber);
      const resolved = convertWixImageToHttps(imageUrl) || imageUrl;
      setSlots((current) => current.map((slot) => slot.slotNumber === slotNumber ? {
        ...slot,
        image: resolved,
        filename: file.name,
        caption: file.name.replace(/\.[^/.]+$/, ''),
        altText: file.name,
        uploadedAt: new Date().toISOString(),
      } : slot));
      addStatus('success', `Slot ${slotNumber} replaced`);
    } catch (error) {
      addStatus('error', error instanceof Error ? error.message : `Failed to replace slot ${slotNumber}`);
    } finally {
      setBusySlot(null);
    }
  };

  const handleDelete = async (slotNumber: number) => {
    if (!window.confirm(`Delete photo in slot ${slotNumber}?`)) return;
    setBusySlot(slotNumber);
    try {
      const response = await fetch('/api/portfolio/delete-slot', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ displayOrder: slotNumber }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Delete failed');
      setSlots((current) => current.map((slot) => slot.slotNumber === slotNumber ? makeEmptySlot(slotNumber) : slot));
      addStatus('success', `Slot ${slotNumber} cleared`);
    } catch (error) {
      addStatus('error', error instanceof Error ? error.message : 'Delete failed');
    } finally {
      setBusySlot(null);
    }
  };

  const addSlots = () => {
    setSlots((current) => [...current, ...Array.from({ length: SLOT_INCREMENT }, (_, index) => makeEmptySlot(current.length + index + 1))]);
    setSlotCount((current) => current + SLOT_INCREMENT);
    addStatus('info', `Added ${SLOT_INCREMENT} slots`);
  };

  const copyMetadata = async (slot: Slot) => {
    await navigator.clipboard.writeText(JSON.stringify(slot, null, 2));
    addStatus('success', `Slot ${slot.slotNumber} metadata copied`);
  };

  return (
    <div className="space-y-8">
      <div className="fixed top-4 right-4 z-[60] space-y-2 max-w-md">
        {statusMessages.map((message) => (
          <motion.div key={message.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="p-3 rounded-none border bg-admin-raise border-admin-line text-admin-text text-[13px] flex gap-2 items-center">
            {message.type === 'success' ? <CheckCircle className="w-4 h-4 text-ok" /> : <AlertCircle className="w-4 h-4" />}
            {message.message}
          </motion.div>
        ))}
      </div>

      <div className="bg-admin-surface border border-admin-line p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div><h2 className="font-heading text-[13px] uppercase tracking-[0.12em] text-admin-text">Work Gallery Manager</h2><p className="text-[13px] text-admin-dim mt-2">100 persistent slots, expandable in groups of 12.</p></div>
          <div className="flex items-center gap-3"><Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}> <Upload className="w-4 h-4 mr-2" /> Select Photos</Button><div className="text-right"><div className="text-2xl font-bold text-oxblood">{filledSlots}</div><div className="text-[11px] text-admin-faint">/ {slotCount} slots</div></div></div>
        </div>
        <div className="border-2 border-dashed border-admin-line p-8 text-center cursor-pointer" onClick={() => fileInputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); handleFileSelect(event.dataTransfer.files); }}>
          <Upload className="w-8 h-8 mx-auto mb-2 text-oxblood" /><p className="text-[13px] text-admin-text">Drop photos here or click to browse</p><p className="text-[11px] text-admin-dim mt-1">JPEG, PNG, WebP, GIF, TIFF, or HEIC — up to 10MB each.</p>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" disabled={isUploading} onChange={(event) => handleFileSelect(event.target.files)} />
        {selectedFiles.length > 0 && <div className="flex items-center justify-between"><span className="text-[13px]">{selectedFiles.length} selected</span><div className="flex gap-2"><Button onClick={() => setSelectedFiles([])} variant="outline">Clear</Button><Button onClick={() => void handleUpload()} disabled={isUploading}>{isUploading ? 'Uploading…' : `Upload (${selectedFiles.length})`}</Button></div></div>}
      </div>

      <div className="bg-admin-surface border border-admin-line p-6">
        <div className="flex items-center justify-between mb-6"><h2 className="font-heading text-[13px] uppercase tracking-[0.12em] text-admin-text">Gallery Grid ({filledSlots}/{slotCount})</h2><Button onClick={addSlots}><Plus className="w-3 h-3 mr-2" />Add 12 Slots</Button></div>
        {isLoading ? <div className="py-16 flex justify-center"><LoadingSpinner className="w-6 h-6" /></div> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(156px, 1fr))', gap: 8 }}>{slots.map((slot) => (
          <div key={slot.id} className="relative aspect-[4/5] overflow-hidden border border-admin-line bg-admin-raise group">
            <div className="absolute top-2 left-2 z-10 text-[10px] font-heading text-admin-faint">{slot.slotNumber}</div>
            <button onClick={() => setShowMetadata(showMetadata === slot.slotNumber ? null : slot.slotNumber)} className="absolute top-2 right-2 z-20 p-1 bg-black/50 text-white"><Info className="w-3 h-3" /></button>
            {slot.image ? <>
              <img src={slot.image} alt={slot.altText || slot.caption || 'Gallery photo'} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <button onClick={() => setPreviewImage({ url: slot.image!, slotNumber: slot.slotNumber })} className="p-2 bg-white/10 text-white"><Maximize2 className="w-3 h-3" /></button>
                <button onClick={() => window.open(slot.image, '_blank', 'noopener,noreferrer')} className="p-2 bg-white/10 text-white"><Eye className="w-3 h-3" /></button>
                <label className="p-2 bg-white/10 text-white cursor-pointer"><input type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleReplace(slot.slotNumber, file); }} /><RefreshCw className="w-3 h-3" /></label>
                <button onClick={() => void handleDelete(slot.slotNumber)} disabled={busySlot === slot.slotNumber} className="p-2 bg-white/10 text-white"><Trash2 className="w-3 h-3" /></button>
                <button onClick={() => void copyMetadata(slot)} className="p-2 bg-white/10 text-white"><Copy className="w-3 h-3" /></button>
              </div>
            </> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-6 h-6 text-admin-faint" /></div>}
            {busySlot === slot.slotNumber && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><LoadingSpinner className="w-6 h-6" /></div>}
            {showMetadata === slot.slotNumber && slot.image && <div className="absolute inset-0 z-30 bg-black/95 text-white p-3 text-[11px] overflow-auto"><p><b>Slot:</b> {slot.slotNumber}</p><p><b>File:</b> {slot.filename}</p><p><b>Caption:</b> {slot.caption}</p><p><b>Alt:</b> {slot.altText}</p><button onClick={() => void copyMetadata(slot)} className="mt-3 underline">Copy metadata</button></div>}
          </div>
        ))}</div>}
      </div>

      {previewImage && <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}><div className="relative max-w-6xl max-h-[92vh]" onClick={(event) => event.stopPropagation()}><button onClick={() => setPreviewImage(null)} className="absolute top-2 right-2 z-10 p-2 bg-oxblood text-white"><X className="w-5 h-5" /></button><img src={previewImage.url} alt={`Slot ${previewImage.slotNumber} preview`} className="max-w-full max-h-[92vh] object-contain" /></div></div>}
    </div>
  );
}
