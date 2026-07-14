export default function RouterFallback() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#000000',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#ffffff',
      }}
    >
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        {/* Loading spinner animation */}
        <div
          style={{
            width: '60px',
            height: '60px',
            border: '3px solid rgba(111, 8, 9, 0.2)',
            borderTop: '3px solid #6F0809',
            borderRadius: '50%',
            margin: '0 auto 30px',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        
        <h1 style={{ fontSize: '28px', marginBottom: '15px', fontWeight: 'bold' }}>
          Loading Application
        </h1>
        <p style={{ fontSize: '16px', color: '#b0b0b0', marginBottom: '10px' }}>
          Please wait while we initialize your experience...
        </p>
      </div>
    </div>
  );
}
