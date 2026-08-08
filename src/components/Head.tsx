export const Head = () => {
  return (
    <>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Security Headers */}
      <meta httpEquiv="X-UA-Compatible" content="ie=edge" />
      <meta name="referrer" content="strict-origin-when-cross-origin" />
      <meta httpEquiv="Permissions-Policy" content="geolocation=(), microphone=(), camera=()" />
      
      {/* Content Security Policy - Comprehensive policy for Wix platform integration */}
      <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.parastorage.com https://*.parastorage.com https://cdn.jsdelivr.net https://maps.googleapis.com https://maps.gstatic.com https://*.wixapis.com https://*.wix.com; script-src-elem 'self' 'unsafe-inline' https://static.parastorage.com https://*.parastorage.com https://cdn.jsdelivr.net https://maps.googleapis.com https://maps.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://static.parastorage.com https://*.parastorage.com; img-src 'self' data: https: blob: wix:image https://static.parastorage.com https://*.parastorage.com; font-src 'self' https://fonts.gstatic.com data: https://static.parastorage.com https://*.parastorage.com; connect-src 'self' https://*.wixapis.com https://*.wix.com https://*.parastorage.com https://*.wix-code.com https://maps.googleapis.com ws: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" />
      
      {/* Preconnect to external resources */}
      <link rel="preconnect" href="https://static.parastorage.com" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" />
      <link rel="dns-prefetch" href="https://maps.googleapis.com" />
      
      {/* Google Maps API with async loading */}
      <script async src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY"></script>
    </>
  );
};
