import clsx from 'clsx';
import React, { useState, useRef, useEffect } from 'react';

const Camera = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

interface Props {
  onCapture?: (screenshot: string) => void;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeInMb?: number;
  externalStream?: MediaStream | null;
  onStreamChange?: (stream: MediaStream | null) => void;
  isExternallySharing?: boolean;
  onSharingChange?: (isSharing: boolean) => void;
}

const ScreenCapture: React.FC<Props> = ({
  onCapture,
  maxWidth = 1280,
  maxHeight = 720,
  quality = 0.8,
  maxSizeInMb = 1,
  externalStream,
  onStreamChange,
  isExternallySharing,
  onSharingChange
}) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [localIsSharing, setLocalIsSharing] = useState(false);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
  const [isSwitching, setIsSwitching] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Use either external or local state
  const stream = externalStream ?? localStream;
  const isSharing = isExternallySharing ?? localIsSharing;
  const setStream = onStreamChange ?? setLocalStream;
  const setIsSharing = onSharingChange ?? setLocalIsSharing;

  const calculateDimensions = (originalWidth: number, originalHeight: number) => {
    let width = originalWidth;
    let height = originalHeight;

    if (width > maxWidth) {
      height = (maxWidth * height) / width;
      width = maxWidth;
    }

    if (height > maxHeight) {
      width = (maxHeight * width) / height;
      height = maxHeight;
    }

    return { width: Math.floor(width), height: Math.floor(height) };
  };

  const base64ToBlob = (base64: string): Blob => {
    const parts = base64.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
  };

  const compressImage = async (canvas: HTMLCanvasElement, currentQuality: number): Promise<string> => {
    const base64 = canvas.toDataURL('image/jpeg', currentQuality);
    const blob = base64ToBlob(base64);
    const sizeMb = blob.size / (1024 * 1024);

    if (sizeMb > maxSizeInMb && currentQuality > 0.1) {
      return compressImage(canvas, currentQuality - 0.1);
    }

    return base64;
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Video or canvas reference not found');
      return;
    }

    try {
      setIsProcessing(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        setError('Invalid video dimensions');
        return;
      }

      const dimensions = calculateDimensions(video.videoWidth, video.videoHeight);
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setError('Failed to get canvas context');
        return;
      }

      ctx.drawImage(video, 0, 0, dimensions.width, dimensions.height);

      const base64Image = await compressImage(canvas, quality);

      if (base64Image === 'data:,') {
        setError('Failed to capture image');
        return;
      }

      if (onCapture) {
        await onCapture(base64Image);
      }

      setError('');
    } catch (err) {
      console.error('Capture error:', err);
      setError('Failed to capture image');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleMetadata = () => {
      setVideoSize({
        width: video.videoWidth,
        height: video.videoHeight
      });
    };

    video.addEventListener('loadedmetadata', handleMetadata);
    return () => video.removeEventListener('loadedmetadata', handleMetadata);
  }, []);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const startScreenShare = async () => {
    if (!videoRef.current) {
      setError('Video element not initialized');
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      videoRef.current.srcObject = mediaStream;
      await videoRef.current.play();

      setStream(mediaStream);
      setIsSharing(true);
      setError('');

      mediaStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to start screen share');
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStream(null);
    setIsSharing(false);
    setVideoSize({ width: 0, height: 0 });
  };

  const switchScreen = async () => {
    if (!videoRef.current) {
      setError('Video element not initialized');
      return;
    }
  
    try {
      setIsSwitching(true);
      
      // Get new stream first before stopping old one
      const newMediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
  
      // Only proceed with switch if user didn't cancel the screen picker
      if (newMediaStream.active) {
        // Stop old stream
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
  
        // Set up new stream
        videoRef.current.srcObject = newMediaStream;
        await videoRef.current.play();
  
        setStream(newMediaStream);
        setIsSharing(true); // Explicitly set sharing to true
        setError('');
  
        // Set up ended handler
        newMediaStream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };
      } else {
        // If stream isn't active, clean it up
        newMediaStream.getTracks().forEach(track => track.stop());
      }
  
    } catch (error) {
      console.error('Switch screen error:', error);
      // Keep the old stream running if switch fails
      setError(error instanceof Error ? error.message : 'Failed to switch screen');
    } finally {
      setIsSwitching(false);
    }
  };
  
  return (
    <div className="h-full flex flex-col space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      <div className="relative h-full w-full rounded-xl overflow-hidden bg-background-800 shadow-lg">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-contain" />
        <canvas
          ref={canvasRef}
          className="hidden"
        />
        {(!isSharing || videoSize.width === 0) && (
          <div className="absolute inset-0 flex text-center items-center justify-center text-primary-300 bg-background-900/50 backdrop-blur-xs">
            {isSharing ? 'Loading video stream...' : 'Click Start Screen Share to Begin'}
          </div>
        )}
      </div>

      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center text-sm text-primary-200 bg-background-800/50 px-4 py-2 rounded-lg">
          <span>
            Status: {isSharing ? `Sharing (${videoSize.width}x${videoSize.height})` : 'Not sharing'}
          </span>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={isSharing ? stopScreenShare : startScreenShare}
            className={clsx(
              "flex-1 py-3 rounded-lg transition-all duration-200 font-medium shadow-lg hover:scale-105 text-white",
              isSharing ? 'bg-red-500 hover:bg-red-600' : "bg-accent-600 hover:bg-accent-500"
            )}>
            {isSharing ? 'Stop Sharing' : 'Start Screen Share'}
          </button>
          {isSharing && (
            <>
              <button
                onClick={switchScreen}
                disabled={isSwitching}
                className={clsx(
                  "flex-1 py-3 bg-primary-600 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:scale-105",
                  isSwitching && "opacity-50 cursor-not-allowed hover:scale-100 hover:bg-primary-600"
                )}
              >
                {isSwitching ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                ) : (
                  "Switch Screen"
                )}
              </button>
              <button
                className={clsx(
                  "flex-1 py-3 bg-secondary-600 hover:bg-secondary-500 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:scale-105",
                  (isProcessing || !onCapture) && "opacity-50 cursor-not-allowed hover:scale-100 hover:bg-secondary-600"
                )}
                onClick={captureImage}
                disabled={isProcessing || !onCapture}
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                ) : "Get Guidance"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScreenCapture;