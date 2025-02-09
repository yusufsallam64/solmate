import React, { useRef, useEffect } from 'react';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

interface VoiceHandlerProps {
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
  onMessageReceived: (message: string) => void;
  onSpeakComplete: () => void;
}

export const VoiceHandler: React.FC<VoiceHandlerProps> = ({
  isListening,
  setIsListening,
  onMessageReceived,
  onSpeakComplete,
}) => {
  const recognition = useRef<any>(null);
  const transcriptPartsRef = useRef<string[]>([]);
  const processingRef = useRef<boolean>(false);

  const initializeRecognition = () => {
    if (!window.webkitSpeechRecognition || recognition.current) return;

    recognition.current = new window.webkitSpeechRecognition();
    recognition.current.continuous = true;
    recognition.current.interimResults = false;
    recognition.current.lang = 'en-US';

    recognition.current.onstart = () => {
      console.log('Speech recognition started');
      transcriptPartsRef.current = [];
      processingRef.current = false;
    };

    recognition.current.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      
      if (transcript.trim()) {
        console.log('Received transcript part:', transcript);
        transcriptPartsRef.current.push(transcript.trim());
      }
    };

    recognition.current.onend = () => {
      console.log('Speech recognition ended');
      
      // Only process if we were listening and have transcript parts
      if (!processingRef.current && transcriptPartsRef.current.length > 0) {
        processingRef.current = true;
        const completeTranscript = transcriptPartsRef.current.join(' ');
        console.log('Sending complete transcript:', completeTranscript);
        onMessageReceived(completeTranscript);
        transcriptPartsRef.current = [];
      }
      
      // Reset state
      setIsListening(false);
      processingRef.current = false;
    };

    recognition.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        setIsListening(false);
        processingRef.current = false;
      }
    };
  };

  // Initialize recognition on mount
  useEffect(() => {
    initializeRecognition();
    return () => {
      if (recognition.current) {
        recognition.current.stop();
        recognition.current = null;
      }
      transcriptPartsRef.current = [];
      processingRef.current = false;
    };
  }, []);

  // Handle listening state changes
  useEffect(() => {
    if (!recognition.current) {
      initializeRecognition();
    }

    if (isListening && recognition.current) {
      try {
        recognition.current.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
        setIsListening(false);
      }
    } else if (!isListening && recognition.current) {
      recognition.current.stop();
    }
  }, [isListening]);

  return null;
};