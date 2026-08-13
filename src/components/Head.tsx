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
      <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.parastorage.com https://*.parastorage.com https://cdn.jsdelivr.net https://*.wixapis.com https://*.wix.com https://edge.fullstory.com; script-src-elem 'self' 'unsafe-inline' https://static.parastorage.com https://*.parastorage.com https://cdn.jsdelivr.net https://edge.fullstory.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://static.parastorage.com https://*.parastorage.com; img-src 'self' data: https: blob: https://static.parastorage.com https://*.parastorage.com https://static.wixstatic.com; font-src 'self' https://fonts.gstatic.com data: https://static.parastorage.com https://*.parastorage.com; connect-src 'self' https://*.wixapis.com https://*.wix.com https://*.parastorage.com https://*.wix-code.com https://upload.wixmp.com ws: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" />
      
      {/* Preconnect to external resources */}
      <link rel="preconnect" href="https://static.parastorage.com" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" />
    </>
  );
};
