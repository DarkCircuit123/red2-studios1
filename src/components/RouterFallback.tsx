export default function RouterFallback() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#1a1a2e',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#e0e0e0',
      }}
    >
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '20px', fontWeight: 'bold' }}>
          Router temporarily unavailable
        </h1>
        <p style={{ fontSize: '16px', color: '#b0b0b0', marginBottom: '40px' }}>
          The application is loading. Please refresh the page.
        </p>
        
        <nav style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="/"
            style={{
              padding: '10px 20px',
              backgroundColor: '#860f0f',
              color: '#ffffff',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            Home
          </a>
          <a
            href="/#about"
            style={{
              padding: '10px 20px',
              backgroundColor: '#2a2a3e',
              color: '#e0e0e0',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer',
              border: '1px solid #444',
            }}
          >
            About
          </a>
          <a
            href="/#contact"
            style={{
              padding: '10px 20px',
              backgroundColor: '#2a2a3e',
              color: '#e0e0e0',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer',
              border: '1px solid #444',
            }}
          >
            Contact
          </a>
        </nav>
      </div>
    </div>
  );
}
