import { useMemo } from 'react';

interface StoriesSEOProps {
  totalCount?: number;
  sourceCount?: number;
  currentUrl?: string;
}

export function StoriesSEO({ totalCount = 0, sourceCount = 0, currentUrl = 'https://example.com/stories' }: StoriesSEOProps) {
  const schema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Stories & Insights',
    description: 'Curated stories and insights from leading photography publications and sources',
    url: currentUrl,
    mainEntity: {
      '@type': 'Collection',
      name: 'Photography Stories & Insights',
      description: `A curated collection of ${totalCount} stories from ${sourceCount} sources covering photography, visual storytelling, and industry insights`,
      numberOfItems: totalCount,
      itemListElement: []
    },
    publisher: {
      '@type': 'Organization',
      name: 'Photography Studio',
      logo: {
        '@type': 'ImageObject',
        url: 'https://static.wixstatic.com/media/e9d727_26ded677ac3344789878ec779ed8ab5b~mv2.png'
      }
    },
    inLanguage: 'en-US',
    dateModified: new Date().toISOString()
  }), [totalCount, sourceCount, currentUrl]);

  return (
    <>
      {/* Primary Meta Tags */}
      <title>Stories & Insights | Photography News & Industry Updates</title>
      <meta 
        name="description" 
        content={`Explore curated stories and insights from ${sourceCount} leading sources. ${totalCount} articles covering photography, visual storytelling, and industry trends.`}
      />
      <meta 
        name="keywords" 
        content="photography stories, visual storytelling, photography news, industry insights, photography trends, photo journalism"
      />
      <meta name="author" content="Photography Studio" />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="revisit-after" content="7 days" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Photography Studio" />
      <meta property="og:title" content="Stories & Insights | Photography News & Industry Updates" />
      <meta 
        property="og:description" 
        content={`Explore ${totalCount} curated stories from ${sourceCount} sources covering photography and visual storytelling`}
      />
      <meta 
        property="og:image" 
        content="https://static.wixstatic.com/media/e9d727_23ae325a3ed84ace8a2becb17689e5c9~mv2.png?originWidth=1200&originHeight=630"
      />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:url" content={currentUrl} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Stories & Insights | Photography News & Industry Updates" />
      <meta 
        name="twitter:description" 
        content={`Explore ${totalCount} curated stories from ${sourceCount} sources covering photography and visual storytelling`}
      />
      <meta 
        name="twitter:image" 
        content="https://static.wixstatic.com/media/e9d727_d24bb89109114ebdbc6f7b0009504735~mv2.png?originWidth=1200&originHeight=630"
      />
      <meta name="twitter:creator" content="@photographystudio" />
      
      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#000000" />
      <meta name="color-scheme" content="dark" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Preload critical resources */}
      <link rel="preconnect" href="https://static.parastorage.com" />
      <link rel="dns-prefetch" href="https://static.wixstatic.com" />
      
      {/* JSON-LD Schema - CollectionPage */}
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
      
      {/* JSON-LD Schema - BreadcrumbList */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: 'https://example.com'
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Stories & Insights',
              item: currentUrl
            }
          ]
        })}
      </script>
    </>
  );
}
