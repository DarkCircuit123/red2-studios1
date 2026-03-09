export const Head = () => {
  return (
    <>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* SEO Meta Tags */}
      <meta name="description" content="Award-winning photography studio specializing in professional portraits, commercial photography, and studio services. Book your session with RED² today." />
      <meta name="keywords" content="photography studio, professional photographer, portrait photography, commercial photography, studio photography, photography services, professional headshots, event photography, product photography, photography booking" />
      <meta name="author" content="RED² Studios" />
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <meta name="theme-color" content="#860f0f" />
      
      {/* Open Graph */}
      <meta property="og:title" content="RED² - Professional Photography & Studio Services" />
      <meta property="og:description" content="Award-winning photography studio specializing in professional portraits, commercial photography, and studio services. Book your session with RED² today." />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="RED² Photography Studio" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="RED² - Professional Photography & Studio Services" />
      <meta name="twitter:description" content="Award-winning photography studio specializing in professional portraits, commercial photography, and studio services." />
      
      {/* Canonical URL */}
      <link rel="canonical" href="https://red2studios.com" />
      
      {/* Preconnect to external resources */}
      <link rel="preconnect" href="https://static.parastorage.com" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
      
      {/* Structured Data - Organization */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "RED² Photography Studio",
          "url": "https://red2studios.com",
          "logo": "https://red2studios.com/logo.png",
          "description": "Professional photography studio specializing in portraits, commercial photography, and studio services.",
          "sameAs": [
            "https://www.instagram.com/red2studios",
            "https://www.facebook.com/red2studios",
            "https://www.linkedin.com/company/red2studios"
          ],
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "Customer Service",
            "email": "contact@red2studios.com"
          }
        })}
      </script>
      
      {/* Structured Data - LocalBusiness */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": "RED² Photography Studio",
          "image": "https://red2studios.com/logo.png",
          "description": "Professional photography studio offering portraits, commercial shoots, and studio services.",
          "url": "https://red2studios.com",
          "telephone": "+1-XXX-XXX-XXXX",
          "priceRange": "$",
          "areaServed": "US",
          "serviceType": ["Portrait Photography", "Commercial Photography", "Studio Rental", "Event Photography"]
        })}
      </script>
    </>
  );
};
