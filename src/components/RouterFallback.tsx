export default function RouterFallback() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#333',
      }}
    >
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>
          Router temporarily unavailable
        </h1>
        <p style={{ fontSize: '14px', color: '#666' }}>
          The application is loading. Please refresh the page.
        </p>
      </div>
    </div>
  );
}
