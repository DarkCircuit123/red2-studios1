import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'video.other' | 'profile';
  noindex?: boolean;
  nofollow?: boolean;
  schema?: Record<string, any>;
  canonical?: string;
}

export default function SEOHead({
  title,
  description,
  image,
  url,
  type = 'website',
  noindex = false,
  nofollow = false,
  schema,
  canonical,
}: SEOHeadProps) {
  const siteUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  
  let robotsContent = '';
  if (noindex) robotsContent += 'noindex';
  if (nofollow) robotsContent += (robotsContent ? ', ' : '') + 'nofollow';

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description || ''} />
      {robotsContent && <meta name="robots" content={robotsContent} />}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:type" content={type} />
      {description && <meta property="og:description" content={description} />}
      {image && <meta property="og:image" content={image} />}
      {siteUrl && <meta property="og:url" content={siteUrl} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      {image && <meta name="twitter:image" content={image} />}

      {/* JSON-LD Schema */}
      {schema && (
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      )}
    </Helmet>
  );
}
