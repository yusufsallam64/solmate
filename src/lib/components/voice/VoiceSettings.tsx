import React, { useState, useEffect } from 'react';
import { Mic, Volume2, VolumeX, X, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useVoice } from '@/lib/components/voice/VoiceContextProvider';

interface Voice {
   id: string;
   name: string;
   gender: 'male' | 'female';
   preview_url: string;
}

interface ModalProps {
   isOpen: boolean;
   onClose: () => void;
   children: React.ReactNode;
}

interface VoicePreviewCardProps {
   voice: Voice;
   isSelected: boolean;
   onSelect: () => void;
   isPlaying: boolean;
   onPlayToggle: () => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
   if (!isOpen) return null;

   return (
      <>
         <div
            className="fixed inset-0 bg-background-950/80 backdrop-blur-sm z-50"
            onClick={onClose}
         />
         <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[55vh] max-w-2xl bg-background-900/30 backdrop-blur-xl rounded-2xl border border-primary-200/30 shadow-lg p-6 z-50 overflow-auto">
            <button
               onClick={onClose}
               className="absolute top-4 right-4 p-2 hover:bg-primary-800/20 rounded-full transition-colors text-primary-200"
            >
               <X className="h-5 w-5" />
            </button>
            {children}
         </div>
      </>
   );
};

const VoicePreviewCard: React.FC<VoicePreviewCardProps> = ({
   voice,
   isSelected,
   onSelect,
   isPlaying,
   onPlayToggle
}) => {
   return (
      <div
         onClick={onSelect}
         className={`
            p-4 rounded-xl backdrop-blur-sm transition-all duration-300
            ${isSelected
               ? 'bg-accent-500/10 border border-accent-500/20 hover:border-accent-500/30'
               : 'bg-background-900/40 border border-primary-200/30 hover:border-accent-500/20'}
         `}
      >
         <div className="flex justify-between items-center">
            <div>
               <h4 className="font-medium text-primary-50">{voice.name}</h4>
               <p className="text-sm text-primary-200/70 capitalize">{voice.gender}</p>
            </div>
            {voice.preview_url && (
               <button
                  onClick={(e) => {
                     e.stopPropagation();
                     onPlayToggle();
                  }}
                  className="p-2 hover:bg-primary-800/20 rounded-full transition-colors text-primary-200"
               >
                  {isPlaying
                     ? <VolumeX className="h-5 w-5" />
                     : <Volume2 className="h-5 w-5" />
                  }
               </button>
            )}
         </div>
      </div>
   );
};

const VoiceSettings: React.FC = () => {
   const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
   const [voices, setVoices] = useState<Voice[]>([]);
   const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
   const [isPlaying, setIsPlaying] = useState<string>('');
   const [currentPage, setCurrentPage] = useState<number>(1);
   const [isLoading, setIsLoading] = useState<boolean>(true);
   const [error, setError] = useState<string>('');

   const { updateVoice } = useVoice();
   const VOICES_PER_PAGE = 6;

   useEffect(() => {
      const fetchSavedVoiceSettings = async () => {
         try {
            const response = await fetch('/api/elevenlabs/voice-settings');
            if (!response.ok) throw new Error('Failed to fetch voice settings');

            const data = await response.json();
            if (data.voiceId && data.voiceName) {
               setSelectedVoice({
                  id: data.voiceId,
                  name: data.voiceName,
                  gender: 'unknown' as 'male' | 'female',
                  preview_url: ''
               });
            }
         } catch (error) {
            console.error('Error fetching saved voice settings:', error);
         }
      };

      fetchSavedVoiceSettings();
   }, []);

   useEffect(() => {
      const fetchVoices = async () => {
         try {
            setIsLoading(true);
            const response = await fetch('/api/elevenlabs/fetch-available-voices');

            if (!response.ok) {
               throw new Error(`Failed to fetch voices: ${response.status}`);
            }

            const data = await response.json();
            const voicesArray = data?.voices || data?.data?.voices || data;

            if (!voicesArray || !Array.isArray(voicesArray)) {
               throw new Error('Invalid API response format');
            }

            const formattedVoices: Voice[] = voicesArray.map((voice: any) => ({
               id: voice?.voice_id || `invalid-${Math.random()}`,
               name: voice?.name || 'Unnamed Voice',
               gender: ((voice?.labels?.gender?.toLowerCase() || 'unknown') as 'male' | 'female'),
               preview_url: voice?.preview_url || ''
            }));

            setVoices(formattedVoices);

            if (selectedVoice) {
               const completeVoice = formattedVoices.find(v => v.id === selectedVoice.id);
               if (completeVoice) {
                  setSelectedVoice(completeVoice);
               }
            }
         } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load voices';
            setError(`Error: ${errorMessage}`);
         } finally {
            setIsLoading(false);
         }
      };

      fetchVoices();
   }, []);

   const handleVoiceSelect = async (voice: Voice) => {
      try {
         const response = await fetch('/api/elevenlabs/voice-settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               voiceId: voice.id,
               voiceName: voice.name
            })
         });

         if (!response.ok) {
            throw new Error('Failed to save voice settings');
         }

         setSelectedVoice(voice);
         updateVoice(voice.name, voice.id);
      } catch (error) {
         console.error('Error saving voice settings:', error);
         setError('Failed to save voice settings');
      }
   };

   const handlePlayPreview = (voiceId: string, previewUrl: string) => {
      if (isPlaying === voiceId) {
         const audio = document.getElementById('previewAudio') as HTMLAudioElement;
         if (audio) {
            audio.pause();
            audio.currentTime = 0;
         }
         setIsPlaying('');
      } else {
         const audio = document.getElementById('previewAudio') as HTMLAudioElement;
         if (audio) {
            audio.src = previewUrl;
            audio.play();
            setIsPlaying(voiceId);
         }
      }
   };

   const totalPages = Math.ceil(voices.length / VOICES_PER_PAGE);
   const paginatedVoices = voices.slice(
      (currentPage - 1) * VOICES_PER_PAGE,
      currentPage * VOICES_PER_PAGE
   );

   return (
        <>
           <div
              onClick={() => setIsModalOpen(true)}
              className="group p-6 bg-background-900/30 backdrop-blur-xl rounded-2xl border border-primary-200/30 hover:border-accent-500/30 shadow-lg transition-all duration-300 cursor-pointer"
           >
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-accent-500/10 rounded-full">
                    <Mic className="h-6 w-6 text-accent-400" />
                 </div>
                 <div>
                    <h3 className="text-lg font-medium text-primary-50">Voice Settings</h3>
                    <p className="text-primary-50">
                       {isLoading ? (
                          <span className="inline-block animate-pulse">Loading voice settings...</span>
                       ) : selectedVoice ? (
                          <>Using: <span className="text-accent-400">{selectedVoice.name}</span></>
                       ) : (
                          <span className="text-accent-400">Select a voice model</span>
                       )}
                    </p>
                 </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-primary-50">
                 <span>Configure voice settings</span>
                 <ChevronRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
              </div>
           </div>
  
           <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
              <div className="space-y-6">
                 <div>
                    <h2 className="text-2xl font-semibold text-primary-50 mb-1">Voice Settings</h2>
                    <p className="text-primary-300">Select your preferred voice model</p>
                 </div>
  
                 <div className="space-y-6">
                    {isLoading ? (
                       <div className="flex items-center justify-center py-12">
                          <RefreshCw className="w-8 h-8 text-accent-400 animate-spin" />
                       </div>
                    ) : error ? (
                       <div className="text-center py-8 text-red-400">{error}</div>
                    ) : (
                       <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {paginatedVoices.map((voice) => (
                                <VoicePreviewCard
                                   key={voice.id}
                                   voice={voice}
                                   isSelected={selectedVoice?.id === voice.id}
                                   onSelect={() => handleVoiceSelect(voice)}
                                   isPlaying={isPlaying === voice.id}
                                   onPlayToggle={() => handlePlayPreview(voice.id, voice.preview_url)}
                                />
                             ))}
                          </div>
  
                          {totalPages > 1 && (
                             <div className="flex justify-center items-center space-x-4 mt-6">
                                <button
                                   onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                   disabled={currentPage === 1}
                                   className="p-2 rounded-full hover:bg-primary-800/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-primary-200"
                                >
                                   <ChevronLeft className="h-5 w-5" />
                                </button>
                                <span className="text-sm text-primary-50">
                                   Page {currentPage} of {totalPages}
                                </span>
                                <button
                                   onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                   disabled={currentPage === totalPages}
                                   className="p-2 rounded-full hover:bg-primary-800/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-primary-200"
                                >
                                   <ChevronRight className="h-5 w-5" />
                                </button>
                             </div>
                          )}
                       </>
                    )}
                 </div>
              </div>
  
              <audio
                 id="previewAudio"
                 onEnded={() => setIsPlaying('')}
                 className="hidden"
              />
           </Modal>
        </>
   );
};

export default VoiceSettings;