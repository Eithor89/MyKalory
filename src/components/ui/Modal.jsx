import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Bottom-sheet modal with overlay.
 * Traps scroll inside. Closes on overlay click.
 */
export default function Modal({ isOpen, onClose, title, children, footer, size = 'default' }) {
  const sheetRef = useRef(null);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxHeight = size === 'large' ? '95vh' : '85vh';

  return createPortal(
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="modal-sheet"
        ref={sheetRef}
        style={{ maxHeight }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-handle" />
        {title && (
          <div className="modal-header">
            <span className="modal-title">{title}</span>
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={onClose}
              aria-label="Cerrar"
              style={{ color: 'var(--color-text-2)' }}
            >
              <CloseIcon />
            </button>
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
