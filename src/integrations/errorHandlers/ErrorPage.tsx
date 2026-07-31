import React from 'react';

export default function ErrorPage() {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Oops!</h1>
      <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '20px' }}>
        Something went wrong. Please try refreshing the page.
      </p>
      <button 
        onClick={() => window.location.href = '/'}
        style={{
          padding: '10px 20px',
          fontSize: '1rem',
          backgroundColor: '#6F0809',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Go Home
      </button>
    </div>
  );
}
