import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Image } from '@/components/ui/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useStories } from '@/hooks/useStories';

interface Story {
  _id: string;
  title: string;
  slug: string;
  sourceURL: string;
  sourceName: string;
  publicationDate: string;
  featuredImage: string;
  excerpt: string;
  fullSummary: string;
}

export default function StoriesDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { fetchStoryBySlug } = useStories();

  useEffect(() => {
    const loadStory = async () => {
      try {
        setIsLoading(true);
        if (slug) {
          const data = await fetchStoryBySlug(slug);
          if (data) {
            setStory(data);
          } else {
            setNotFound(true);
          }
        }
      } catch (error) {
        console.error('Error fetching story:', error);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadStory();
  }, [slug, fetchStoryBySlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Header />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !story) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Header />
        <div className="flex items-center justify-center h-96">
          <p className="text-[#e8e0d0] text-lg">Story not found</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Format publication date
  const pubDate = new Date(story.publicationDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      
      <main className="w-full">
        {/* Hero Section - Full bleed image */}
        <div className="relative w-full h-[70vh] overflow-hidden">
          <Image
            src={story.featuredImage}
            alt={story.title}
            width={1600}
            height={900}
            className="w-full h-full object-cover"
          />
          {/* Dark gradient overlay on bottom 40% */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-100" />
          
          {/* Title positioned over bottom of image */}
          <div className="absolute bottom-0 left-0 right-0 p-12">
            <h1 className="font-cormorant-garamond text-6xl font-bold text-white leading-tight">
              {story.title}
            </h1>
          </div>
        </div>

        {/* Meta Row */}
        <div className="w-full bg-[#0a0a0a] border-b border-[#2a2a2a] px-8 py-6">
          <div className="max-w-[100rem] mx-auto">
            <p className="font-montserrat text-sm tracking-[0.15em] text-[#888888]">
              {story.sourceName} · {pubDate}
            </p>
          </div>
        </div>

        {/* Body Content */}
        <div className="w-full bg-[#0a0a0a] py-16 px-8">
          <div className="max-w-[720px] mx-auto">
            {/* Excerpt as pull quote */}
            <div className="mb-12">
              <p className="font-cormorant-garamond text-2xl italic text-[#aaaaaa] leading-relaxed">
                {story.excerpt}
              </p>
            </div>

            {/* Full Summary */}
            <div className="mb-16">
              <div className="font-montserrat text-base text-[#e8e0d0] leading-[1.8] whitespace-pre-wrap">
                {story.fullSummary}
              </div>
            </div>

            {/* Footer of Article */}
            <div className="border-t border-[#2a2a2a] pt-8">
              {/* Read Original Story Link */}
              <a
                href={story.sourceURL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-montserrat text-sm tracking-widest text-[#e8e0d0] hover:text-[#aaaaaa] transition-colors inline-block mb-6"
              >
                READ ORIGINAL STORY →
              </a>

              {/* Attribution */}
              <p className="font-montserrat text-xs text-[#555555] tracking-wide">
                Via British Journal of Photography — 1854.photography
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
