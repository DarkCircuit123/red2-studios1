import React, { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareButtonsProps {
  title: string;
  url: string;
  description?: string;
  className?: string;
}

export default function ShareButtons({
  title,
  url,
  description,
  className = '',
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Link copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[ShareButtons] Failed to copy:', err);
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  const handleShareX = () => {
    const text = `${title}${description ? ' - ' + description : ''}`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'width=550,height=420');
  };

  const handleShareLinkedIn = () => {
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'width=550,height=420');
  };

  const handleShareFacebook = () => {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'width=550,height=420');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
      } catch (err) {
        console.error('[ShareButtons] Share failed:', err);
      }
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Native share button (if supported) */}
      {navigator.share && (
        <button
          onClick={handleNativeShare}
          className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
          title="Share"
          aria-label="Share"
        >
          <Share2 className="w-5 h-5" />
        </button>
      )}

      {/* X (Twitter) */}
      <button
        onClick={handleShareX}
        className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
        title="Share on X"
        aria-label="Share on X"
      >
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.514l-5.106-6.694-5.829 6.694h-3.308l7.73-8.835L.424 2.25h6.679l4.882 6.268 5.259-6.268zM17.002 20.331h1.834L6.822 4.169H4.881l12.121 16.162z" />
        </svg>
      </button>

      {/* LinkedIn */}
      <button
        onClick={handleShareLinkedIn}
        className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
        title="Share on LinkedIn"
        aria-label="Share on LinkedIn"
      >
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
        </svg>
      </button>

      {/* Facebook */}
      <button
        onClick={handleShareFacebook}
        className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
        title="Share on Facebook"
        aria-label="Share on Facebook"
      >
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </button>

      {/* Copy Link */}
      <button
        onClick={handleCopyLink}
        className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
        title="Copy link"
        aria-label="Copy link"
      >
        {copied ? (
          <Check className="w-5 h-5 text-green-500" />
        ) : (
          <Copy className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
