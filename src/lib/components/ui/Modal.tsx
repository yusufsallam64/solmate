import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const NewProblemSetModal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-xs z-50 flex items-center justify-center">
      <div 
        ref={modalRef}
        className="bg-primary-900 border border-accent/20 rounded-lg shadow-lg w-full max-w-3xl mx-4 relative animate-in fade-in slide-in-from-bottom-4 duration-200"
      >
        <div className="flex items-center justify-between p-4 border-b border-accent/10">
          <h2 className="text-lg font-semibold text-primary-100">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-accent/10 transition-colors duration-200 text-primary-200"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default NewProblemSetModal;