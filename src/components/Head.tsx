export const Head = () => {
  return (
    <>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#000000" />
      <meta name="color-scheme" content="dark" />
      
      {/* Primary Meta Tags */}
      <title>Professional Photography & Visual Storytelling | Studio</title>
      <meta name="description" content="Discover exceptional photography and visual storytelling services. Portfolio, booking, and client galleries available." />
      <meta name="keywords" content="photography, visual storytelling, portfolio, professional photographer, booking" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Professional Photography & Visual Storytelling" />
      <meta property="og:description" content="Discover exceptional photography and visual storytelling services." />
      <meta property="og:image" content="https://static.wixstatic.com/media/e9d727_23ae325a3ed84ace8a2becb17689e5c9~mv2.png?originWidth=1152&originHeight=576" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:title" content="Professional Photography & Visual Storytelling" />
      <meta property="twitter:description" content="Discover exceptional photography and visual storytelling services." />
      <meta property="twitter:image" content="https://static.wixstatic.com/media/e9d727_d24bb89109114ebdbc6f7b0009504735~mv2.png?originWidth=1152&originHeight=576" />
      
      {/* LCP Preload - Hero Image */}
      <link rel="preload" as="image" href="https://static.wixstatic.com/media/e9d727_218927a1c71e45a59b072e273c22d860~mv2.png?originWidth=1152&originHeight=576" />
      
      {/* Fonts */}
      <link rel="preconnect" href="https://static.parastorage.com" />
      
      {/* JSON-LD LocalBusiness Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: 'Photography Studio',
          description: 'Professional photography and visual storytelling services',
          image: 'https://static.wixstatic.com/media/e9d727_26ded677ac3344789878ec779ed8ab5b~mv2.png?originWidth=576&originHeight=1152',
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'US',
          },
        })}
      </script>
    </>
  );
};
