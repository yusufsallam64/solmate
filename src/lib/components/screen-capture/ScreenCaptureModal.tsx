import React from 'react';
import Modal from '../ui/Modal';
import ScreenCapture from '../screen-capture/ScreenCapture';

interface ScreenCaptureModalProps {
   isOpen: boolean;
   onClose: () => void;
   onCapture: (screenshot: string) => void;
   externalStream: MediaStream | null;
   onStreamChange: (stream: MediaStream | null) => void;
   isExternallySharing: boolean;
   onSharingChange: (isSharing: boolean) => void;
 }
 
 const ScreenCaptureModal: React.FC<ScreenCaptureModalProps> = ({
   isOpen,
   onClose,
   onCapture,
   externalStream,
   onStreamChange,
   isExternallySharing,
   onSharingChange
 }) => {
   return (
     <Modal isOpen={isOpen} onClose={onClose} title="Screen Capture">
       <div className="h-[80vh]">
         <ScreenCapture
           onCapture={(screenshot) => {
             onCapture(screenshot);
             onClose();
           }}
           maxWidth={800}
           maxHeight={600}
           quality={0.8}
           maxSizeInMb={0.9}
           externalStream={externalStream}
           onStreamChange={onStreamChange}
           isExternallySharing={isExternallySharing}
           onSharingChange={onSharingChange}
         />
       </div>
     </Modal>
   );
 };

   export default ScreenCaptureModal;