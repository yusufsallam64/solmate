import { 
   MessageSquare,
   Calculator,
   Code2,
   Atom,
   Magnet,
   Leaf,
   Microscope,
   LucideIcon
 } from 'lucide-react';
 import { SubjectIcon } from '@/lib/db/types';
 
 interface SubjectOption {
   value: SubjectIcon;
   label: string;
   Icon: LucideIcon;
   color: string;
 }
 
 export const SUBJECT_OPTIONS: SubjectOption[] = [
   {
     value: 'general',
     label: 'Select subject',
     Icon: MessageSquare,
     color: '#60A5FA' 
   },
   {
     value: 'math',
     label: 'Mathematics',
     Icon: Calculator,
     color: '#F43F5E'
   },
   {
     value: 'science',
     label: 'General Science',
     Icon: Microscope,
     color: '#22D3EE' 
   },
   {
     value: 'computer',
     label: 'Computer Science',
     Icon: Code2,
     color: '#4ADE80' 
   },
   {
     value: 'chemistry',
     label: 'Chemistry',
     Icon: Atom,
     color: '#F472B6' 
   },
   {
     value: 'physics',
     label: 'Physics',
     Icon: Magnet,
     color: '#A78BFA' 
   },
   {
     value: 'biology',
     label: 'Biology',
     Icon: Leaf,
     color: '#34D399'
   }
 ];