import React, { useEffect, useRef } from 'react';

interface AutoplayResponseProps {
  text: string;
  onComplete: () => void;
}

export const AutoplayResponse: React.FC<AutoplayResponseProps> = ({ text, onComplete }) => {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const hasSpokenRef = useRef<boolean>(false);

  useEffect(() => {
    // Reset hasSpoken when text changes
    hasSpokenRef.current = false;
  }, [text]);

  useEffect(() => {
    if (!text || hasSpokenRef.current) return;

    const speakText = () => {
      if (hasSpokenRef.current) return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      // Create new utterance
      utteranceRef.current = new SpeechSynthesisUtterance(text);
      
      // Configure utterance
      utteranceRef.current.rate = 1.0;
      utteranceRef.current.pitch = 1.0;
      utteranceRef.current.volume = 1.0;

      // Handle completion
      utteranceRef.current.onend = () => {
        hasSpokenRef.current = true;
        onComplete();
      };

      // Handle errors
      utteranceRef.current.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        hasSpokenRef.current = true;
        onComplete();
      };

      // Speak the text
      window.speechSynthesis.speak(utteranceRef.current);
      hasSpokenRef.current = true;
    };

    speakText();

    // Cleanup
    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, [text, onComplete]);

  return null;
};