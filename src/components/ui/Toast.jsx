import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

let showToastFn = null;

export function useToast() {
  return useCallback((message, duration = 2200) => {
    showToastFn?.(message, duration);
  }, []);
}

export function ToastProvider() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    showToastFn = (message, duration) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    };
    return () => { showToastFn = null; };
  }, []);

  if (!toasts.length) return null;

  return createPortal(
    <div style={{ position: 'fixed', bottom: 'calc(var(--nav-height) + 16px)', left: '50%', transform: 'translateX(-50%)', zIndex: 500, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
      {toasts.map((t) => (
        <div key={t.id} className="toast">{t.message}</div>
      ))}
    </div>,
    document.body
  );
}
