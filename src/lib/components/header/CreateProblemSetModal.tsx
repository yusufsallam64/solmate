import React, { useEffect, useRef, useState } from 'react';
import { SendHorizonal, ChevronDown } from 'lucide-react';
import Modal from '../ui/Modal';
import { SubjectIcon } from '@/lib/db/types';
import { SUBJECT_OPTIONS } from './subject-icons';
import toast from 'react-hot-toast';

interface CreateProblemSetModalProps {
   isOpen: boolean;
   onClose: () => void;
   onProblemSetCreated: (problemSetId: string) => void;
}

export const CreateProblemSetModal: React.FC<CreateProblemSetModalProps> = ({
   isOpen,
   onClose,
   onProblemSetCreated
}) => {
   const [title, setTitle] = useState('New Problem Set');
   const [selectedIcon, setSelectedIcon] = useState<SubjectIcon>('general');
   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
   const inputRef = useRef<HTMLInputElement>(null);
   const dropdownRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      if (isOpen && inputRef.current) {
         setTitle('New Problem Set');
         setSelectedIcon('general');
         setTimeout(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
         }, 10);
      }
   }, [isOpen]);

   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsDropdownOpen(false);
         }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
   }, []);

   const handleCreate = async () => {
      if (!title.trim()) return;

      try {
         const response = await fetch('/api/problemsets', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({
               title: title.trim(),
               icon: selectedIcon === 'general' ? null : selectedIcon
            }),
         });

         if (!response.ok) throw new Error('Failed to create problem set');

         const { problemSetId } = await response.json();
         toast.success('Created new problem set');
         onClose();
         onProblemSetCreated(problemSetId);
      } catch (err) {
         console.error('Error creating problem set:', err);
         toast.error('Failed to create problem set');
      }
   };

   const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !isDropdownOpen) {
         e.preventDefault();
         handleCreate();
      }
   };

   const selectedOption = SUBJECT_OPTIONS.find(option => option.value === selectedIcon);
   const SelectedIcon = selectedOption?.Icon || SUBJECT_OPTIONS[0].Icon;
   const SelectedIconColor = selectedOption?.color || SUBJECT_OPTIONS[0].color;

   return (
      <Modal isOpen={isOpen} onClose={onClose} title="Create Problem Set">
         <div className="space-y-4">
            <div className="relative" ref={dropdownRef}>
               <div className="flex gap-2">
                  <button
                     onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                     className="h-10 w-10 flex items-center justify-center bg-primary-900 rounded-lg border border-accent/20 
             hover:border-accent/40"
                  >
                     <SelectedIcon size={20} color={SelectedIconColor} />
                  </button>

                  <div className="flex-1 relative">
                     <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full px-3 py-2 bg-primary-900 rounded-lg border border-accent/20 
               focus:border-accent/40 focus:outline-hidden text-primary-100 pr-10"
                        placeholder="Enter problem set title"
                     />
                     <button
                        onClick={handleCreate}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent/10 rounded-sm"
                     >
                        <SendHorizonal size={18} className="text-accent" />
                     </button>
                  </div>
               </div>

               {isDropdownOpen && (
                  <div className="absolute z-50 mt-1 bg-primary-900 border border-accent/20 
                         rounded-lg shadow-lg overflow-y-auto grid grid-cols-4 gap-1 p-2"
                     style={{ width: '200px' }}>
                     {SUBJECT_OPTIONS.map((option) => {
                        const { Icon, color } = option;
                        return (
                           <button
                              key={option.value}
                              onClick={() => {
                                 setSelectedIcon(option.value);
                                 setIsDropdownOpen(false);
                              }}
                              className={`p-2 rounded-lg flex items-center justify-center hover:bg-accent/10
                              ${selectedIcon === option.value ? 'bg-accent/20' : ''}`}
                              title={option.label}
                           >
                              <Icon size={20} color={color} />
                           </button>
                        );
                     })}
                  </div>
               )}
            </div>
         </div>
      </Modal>
   );
};