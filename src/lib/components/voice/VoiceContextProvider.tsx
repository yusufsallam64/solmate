import React, { createContext, useContext, useState, useEffect } from 'react';

interface VoiceContextType {
    voiceName: string | null;
    voiceId: string | null;
    updateVoice: (name: string, id: string) => void;
}

const VoiceContext = createContext<VoiceContextType>({
    voiceName: null,
    voiceId: null,
    updateVoice: () => {},
});

export const useVoice = () => useContext(VoiceContext);

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [voiceName, setVoiceName] = useState<string | null>(null);
    const [voiceId, setVoiceId] = useState<string | null>(null);

    useEffect(() => {
        const fetchVoiceSettings = async () => {
            try {
                const response = await fetch('/api/elevenlabs/voice-settings');
                if (response.ok) {
                    const data = await response.json();
                    setVoiceName(data.voiceName);
                    setVoiceId(data.voiceId);
                }
            } catch (error) {
                console.error('Error fetching voice settings:', error);
            }
        };

        fetchVoiceSettings();
    }, []);

    const updateVoice = (name: string, id: string) => {
        setVoiceName(name);
        setVoiceId(id);
    };

    return (
        <VoiceContext.Provider value={{ voiceName, voiceId, updateVoice }}>
            {children}
        </VoiceContext.Provider>
    );
};