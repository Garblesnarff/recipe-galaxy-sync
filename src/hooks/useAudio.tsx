import { useEffect, useRef, useState, useCallback } from 'react';
import { AudioManager, getAudioManager, initializeAudioManager } from '@/services/audio/audioManager';
import { AudioConfig } from '@/config/audio';
import { useAuth } from '@/hooks/useAuth';
import { SpeakOptions } from '@/services/audio/textToSpeech';

export function useAudio() {
  const { userId } = useAuth();
  const audioManagerRef = useRef<AudioManager | null>(null);
  const [config, setConfig] = useState<AudioConfig | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize audio manager
  useEffect(() => {
    const init = async () => {
      if (userId) {
        audioManagerRef.current = await initializeAudioManager(userId);
      } else {
        audioManagerRef.current = getAudioManager();
      }

      setConfig(audioManagerRef.current.config);
      setIsInitialized(true);
    };

    init();

    // Cleanup on unmount
    return () => {
      if (audioManagerRef.current) {
        audioManagerRef.current.tts.stop();
        audioManagerRef.current.sfx.stopAll();
      }
    };
  }, [userId]);

  const announce = useCallback(async (text: string, options?: SpeakOptions) => {
    if (audioManagerRef.current) {
      await audioManagerRef.current.tts.speak(text, options);
    }
  }, []);

  const playSound = useCallback(async (soundKey: string, volume?: number) => {
    if (audioManagerRef.current) {
      await audioManagerRef.current.sfx.play(soundKey, volume);
    }
  }, []);

  const updateConfig = useCallback((newConfig: Partial<AudioConfig>) => {
    if (audioManagerRef.current) {
      audioManagerRef.current.updateConfig(newConfig);
      setConfig(audioManagerRef.current.config);
    }
  }, []);

  const saveConfig = useCallback(async () => {
    if (audioManagerRef.current && userId) {
      await audioManagerRef.current.saveConfig(userId);
    }
  }, [userId]);

  const testAudio = useCallback(async () => {
    if (audioManagerRef.current) {
      await audioManagerRef.current.testAudio();
    }
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    if (audioManagerRef.current) {
      audioManagerRef.current.setEnabled(enabled);
      setConfig(audioManagerRef.current.config);
    }
  }, []);

  return {
    audioManager: audioManagerRef.current,
    announce,
    playSound,
    config,
    updateConfig,
    saveConfig,
    testAudio,
    setEnabled,
    isInitialized,
  };
}
