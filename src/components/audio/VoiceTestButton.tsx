import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, Loader2 } from 'lucide-react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

interface VoiceTestButtonProps {
  text?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function VoiceTestButton({
  text = "This is how your workout announcements will sound. You've got this!",
  variant = 'outline',
  size = 'default',
  className,
}: VoiceTestButtonProps) {
  const [isTesting, setIsTesting] = useState(false);
  const { speak, isSpeaking } = useTextToSpeech();

  const handleTest = async () => {
    setIsTesting(true);

    try {
      await speak(text, { priority: 'high' });
    } catch (error) {
      console.error('Voice test failed:', error);
    } finally {
      // Small delay to ensure speaking is complete
      setTimeout(() => {
        setIsTesting(false);
      }, 500);
    }
  };

  const isActive = isTesting || isSpeaking();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleTest}
      disabled={isActive}
      className={className}
    >
      {isActive ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Testing...
        </>
      ) : (
        <>
          <Volume2 className="mr-2 h-4 w-4" />
          Test Voice
        </>
      )}
    </Button>
  );
}
