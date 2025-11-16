import { useEffect, useRef, useCallback } from 'react';
import { TextToSpeechService, SpeakOptions } from '@/services/audio/textToSpeech';

export function useTextToSpeech() {
  const ttsRef = useRef<TextToSpeechService | null>(null);

  useEffect(() => {
    // Initialize TTS service
    ttsRef.current = new TextToSpeechService();

    // Cleanup on unmount
    return () => {
      if (ttsRef.current) {
        ttsRef.current.stop();
      }
    };
  }, []);

  const speak = useCallback(async (text: string, options?: SpeakOptions) => {
    if (ttsRef.current) {
      await ttsRef.current.speak(text, options);
    }
  }, []);

  const stop = useCallback(() => {
    if (ttsRef.current) {
      ttsRef.current.stop();
    }
  }, []);

  const pause = useCallback(() => {
    if (ttsRef.current) {
      ttsRef.current.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (ttsRef.current) {
      ttsRef.current.resume();
    }
  }, []);

  const isSpeaking = useCallback(() => {
    return ttsRef.current?.isSpeaking() || false;
  }, []);

  const getVoices = useCallback(() => {
    return ttsRef.current?.getVoices() || [];
  }, []);

  const setVoice = useCallback((voice: SpeechSynthesisVoice) => {
    if (ttsRef.current) {
      ttsRef.current.setVoice(voice);
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (ttsRef.current) {
      ttsRef.current.setVolume(volume);
    }
  }, []);

  const setRate = useCallback((rate: number) => {
    if (ttsRef.current) {
      ttsRef.current.setRate(rate);
    }
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    getVoices,
    setVoice,
    setVolume,
    setRate,
  };
}
