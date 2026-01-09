import { useEffect, useState } from 'react';

const Modal = ({ isOpen, onClose, title, children, actions }) => {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      // Small delay to allow the initial render before applying the visible state
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      // Wait for the exit animation to complete before unmounting
      const timer = setTimeout(() => {
        setIsMounted(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isMounted) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Background overlay with fade-in/out transition */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      ></div>
      
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        {/* This element is to trick the browser into centering the modal contents. */}
        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
          &#8203;
        </span>
        
        {/* Modal panel with slide-up and scale animation */}
        <div 
          className={`relative inline-block w-full max-w-2xl transform overflow-hidden rounded-2xl bg-background border shadow-xl transition-all duration-200 sm:my-8 sm:align-middle ${
            isVisible 
              ? 'translate-y-0 opacity-100 scale-100' 
              : 'translate-y-4 opacity-0 scale-95'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-background px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium leading-6 text-foreground">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-background text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer transition-colors"
              >
                <span className="sr-only">Close</span>
                <span className="text-2xl">&times;</span>
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="px-4 py-2 sm:p-6 text-foreground">
            {children}
          </div>
          
          {/* Footer */}
          {actions && (
            <div className="bg-muted/50 px-4 py-3 gap-3 sm:flex sm:flex-row-reverse sm:px-6">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;