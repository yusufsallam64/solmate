import React, { useEffect, useState, useRef } from 'react';

interface AutoplayResponseProps {
  text: string;
  onComplete: () => void;
  voiceId: string;
}

export const AutoplayResponse: React.FC<AutoplayResponseProps> = ({ 
  text, 
  onComplete,
  voiceId
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasSpokenRef = useRef<boolean>(false);

  useEffect(() => {
    hasSpokenRef.current = false;
  }, [text]);

  useEffect(() => {
    if (!text || !voiceId || hasSpokenRef.current) return;

    const getAudio = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voiceId, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
          },
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch audio from ElevenLabs');
        }

        const audioBlob = await response.blob();
        const url = URL.createObjectURL(audioBlob);

        // Create and set up audio element
        if (audioRef.current) {
          audioRef.current.pause();
          URL.revokeObjectURL(audioRef.current.src);
        }

        const newAudio = new Audio(url);
        audioRef.current = newAudio;

        newAudio.onended = () => {
          URL.revokeObjectURL(url);
          hasSpokenRef.current = true;
          onComplete();
        };

        newAudio.onerror = (error) => {
          console.error('Audio playback error:', error);
          setError('Failed to play audio');
          onComplete();
        };

        // Try to play automatically
        await newAudio.play();
        hasSpokenRef.current = true;
      } catch (error) {
        console.error('Error getting audio:', error);
        setError(error instanceof Error ? error.message : 'Error loading audio');
        onComplete();
      } finally {
        setIsLoading(false);
      }
    };

    getAudio();

    // Cleanup function
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current.src) {
          URL.revokeObjectURL(audioRef.current.src);
        }
      }
    };
  }, [text, voiceId, onComplete]);

  if (isLoading) {
    return (
      <div className="fixed bottom-24 right-4 px-4 py-2 bg-accent-500/50 text-white rounded-lg">
        Generating audio...
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed bottom-24 right-4 px-4 py-2 bg-red-500/50 text-white rounded-lg">
        Error: {error}
      </div>
    );
  }

  return null;
};