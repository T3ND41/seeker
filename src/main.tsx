import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Intercept cross-origin script errors, extensions, or websocket transport in iframe
if (typeof window !== 'undefined') {
  const isIgnorable = (msg?: string, source?: string) => {
    const str = `${msg || ''} ${source || ''}`.toLowerCase();
    return (
      str.includes('moz-extension://') ||
      str.includes('chrome-extension://') ||
      str.includes('inspector.js') ||
      str.includes('script error.') ||
      str.includes('createwebsocketmodulerunnertransport') ||
      str.includes('@vite/client') ||
      str.includes('websocket')
    );
  };

  window.addEventListener('error', (event) => {
    if (isIgnorable(event.message, event.filename) || event.filename === '') {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason ? (event.reason.message || event.reason.stack || String(event.reason)) : '';
    if (isIgnorable(reason, '')) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  });

  // Google Maps Platform Quota Defense listener
  (window as any).gm_authFailure = () => {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  };
  const origError = console.error;
  console.error = (...args: unknown[]) => {
    origError.apply(console, args);
    const msg = args.map((a) => String(a)).join(' ');
    if (msg.includes('OverQuotaMapError') || msg.includes('QuotaExceededError')) {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    }
  };
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

