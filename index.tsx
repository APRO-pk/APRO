import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { supabaseConfigError } from './src/lib/supabase';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

function ConfigErrorScreen({ message }: { message: string }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(circle at top, rgba(88, 118, 255, 0.22), transparent 36%), #060811',
        color: '#f5f7ff',
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        padding: '32px',
      }}
    >
      <div
        style={{
          width: 'min(560px, 100%)',
          borderRadius: '28px',
          padding: '28px',
          background: 'rgba(12, 16, 26, 0.9)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 22px 60px rgba(0, 0, 0, 0.45)',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: '#9db0ff',
            marginBottom: '12px',
          }}
        >
          APRO Configuration
        </div>
        <h1 style={{ margin: '0 0 12px', fontSize: '40px', lineHeight: 1.05 }}>
          Startup blocked
        </h1>
        <p style={{ margin: 0, color: 'rgba(245,247,255,0.78)', lineHeight: 1.7 }}>
          {message}
        </p>
      </div>
    </div>
  );
}

root.render(
  <React.StrictMode>
    {supabaseConfigError ? <ConfigErrorScreen message={supabaseConfigError} /> : <App />}
  </React.StrictMode>
);
