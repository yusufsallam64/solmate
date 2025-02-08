import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Edit2, Trash2, Check, X } from 'lucide-react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { ProblemSet } from '@/lib/db/types';
import Modal from '@/lib/components/ui/Modal';

interface ProblemSetHeaderProps {
  problemSet: ProblemSet | null;
  onProblemSetUpdate: (updatedProblemSet: ProblemSet) => void;
}

const ProblemSetHeader: React.FC<ProblemSetHeaderProps> = ({ problemSet, onProblemSetUpdate }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (problemSet?.title) {
      setNewTitle(problemSet.title);
    }
  }, [problemSet]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Return loading state while waiting for problem set
  if (!problemSet) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-6 w-48 bg-accent/10 animate-pulse rounded-sm" />
      </div>
    );
  }

  const handleRename = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newTitle.trim() || newTitle === problemSet.title) {
      setIsRenaming(false);
      setNewTitle(problemSet.title);
      return;
    }
  
    try {
      const response = await fetch(`/api/problemsets/${problemSet._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
  
      if (!response.ok) throw new Error('Failed to rename problem set');
  
      const updatedProblemSet = await response.json();
      updatedProblemSet.title = newTitle.trim();
      onProblemSetUpdate(updatedProblemSet); // Ensure this updates the parent state
      toast.success('Problem set renamed');
      setIsRenaming(false);
    } catch (err) {
      console.error('Error renaming problem set:', err);
      toast.error('Failed to rename problem set');
      setNewTitle(problemSet.title);
    }
  };
  

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
    setIsDropdownOpen(false);
  };

  const confirmDelete = async () => {
    try {
      const problemSetsResponse = await fetch('/api/problemsets');
      if (!problemSetsResponse.ok) throw new Error('Failed to fetch problem sets');
      const allProblemSets = await problemSetsResponse.json();

      const currentIndex = allProblemSets.findIndex(
        (set: ProblemSet) => set._id.toString() === problemSet._id.toString()
      );

      const nextProblemSet = allProblemSets[currentIndex + 1] || allProblemSets[currentIndex - 1];

      const response = await fetch(`/api/problemsets/${problemSet._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete problem set');

      const deletedEvent = new CustomEvent('problemSetDeleted', {
        detail: { problemSetId: problemSet._id.toString() }
      });
      window.dispatchEvent(deletedEvent);

      toast.success('Problem set deleted');
      setIsDeleteModalOpen(false);

      setTimeout(() => {
        if (nextProblemSet) {
          router.push(`/dashboard?problemSet=${nextProblemSet._id}`);
        } else {
          router.push('/dashboard');
        }
      }, 100);
    } catch (err) {
      console.error('Error deleting problem set:', err);
      toast.error('Failed to delete problem set');
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {isRenaming ? (
          <form onSubmit={handleRename} className="flex items-center gap-2">
            <div className="relative group">
              <input
                ref={inputRef}
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setNewTitle(problemSet.title);
                    setIsRenaming(false);
                  }
                }}
                className="px-3 py-1.5 bg-primary-900/50 rounded-lg border border-accent/20 
                           focus:border-accent/40 focus:outline-hidden text-primary-100 
                           placeholder-primary-300/50 w-[300px] pr-16"
                placeholder="Enter problem set name"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="submit"
                  className="p-1 hover:bg-accent/20 rounded-md text-accent transition-colors duration-200"
                  title="Save"
                >
                  <Check size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewTitle(problemSet.title);
                    setIsRenaming(false);
                  }}
                  className="p-1 hover:bg-red-500/20 rounded-md text-red-400 transition-colors duration-200"
                  title="Cancel"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </form>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-primary-100 truncate max-w-[300px]">
              {problemSet.title}
            </h2>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="p-1.5 rounded-lg hover:bg-accent/10 transition-colors duration-200 text-primary-200 
                           hover:text-primary-100"
              >
                <MoreHorizontal size={18} />
              </button>
  
              {isDropdownOpen && (
                <div className={`absolute ${isMobile ? 'left-0' : 'right-0'} top-full mt-1 w-48 rounded-lg bg-primary-900 border 
                                border-accent/20 shadow-lg overflow-hidden z-50`}>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsRenaming(true);
                    }}
                    className="w-full px-4 py-2 text-left text-primary-100 hover:bg-accent/10 flex items-center 
                               gap-2 transition-colors duration-200"
                  >
                    <Edit2 size={16} />
                    <span>Rename</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 flex items-center 
                               gap-2 transition-colors duration-200"
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
  
      <Modal
        title="Delete Problem Set"
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      >
        <div className="p-2 text-primary-300">
          <p className="text-primary-300 mb-1 text-center truncate">
            Are you sure you want to delete "{problemSet.title}"?
          </p>
          <span className='font-bold text-center'>This action cannot be undone.</span>
  
          <div className="flex justify-end gap-3 mt-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-primary-800 text-primary-200 hover:bg-primary-700"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              autoFocus
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}  

export default ProblemSetHeader;