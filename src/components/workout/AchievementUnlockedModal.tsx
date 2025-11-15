import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Achievement } from '@/services/workout/gamification';
import { Share2, X, Trophy, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AchievementUnlockedModalProps {
  achievement: Achievement | null;
  open: boolean;
  onClose: () => void;
}

const tierColors = {
  bronze: 'text-amber-600 dark:text-amber-400',
  silver: 'text-slate-600 dark:text-slate-400',
  gold: 'text-yellow-600 dark:text-yellow-400',
  platinum: 'text-purple-600 dark:text-purple-400',
};

const tierGradients = {
  bronze: 'from-amber-500 to-orange-500',
  silver: 'from-slate-400 to-slate-600',
  gold: 'from-yellow-400 to-yellow-600',
  platinum: 'from-purple-500 to-pink-500',
};

// Confetti particle component
function ConfettiParticle({ delay, duration }: { delay: number; duration: number }) {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const randomX = Math.random() * 100;
  const randomRotation = Math.random() * 360;
  const randomSize = 4 + Math.random() * 8;

  return (
    <div
      className="absolute animate-confetti-fall"
      style={{
        left: `${randomX}%`,
        top: '-10px',
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
      }}
    >
      <div
        className="rounded-full"
        style={{
          width: `${randomSize}px`,
          height: `${randomSize}px`,
          backgroundColor: randomColor,
          transform: `rotate(${randomRotation}deg)`,
        }}
      />
    </div>
  );
}

// Confetti container
function Confetti({ show }: { show: boolean }) {
  if (!show) return null;

  const particles = Array.from({ length: 50 }, (_, i) => (
    <ConfettiParticle
      key={i}
      delay={i * 30}
      duration={2000 + Math.random() * 1000}
    />
  ));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
      {particles}
    </div>
  );
}

export function AchievementUnlockedModal({
  achievement,
  open,
  onClose,
}: AchievementUnlockedModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open && achievement) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [open, achievement]);

  if (!achievement) return null;

  const tierColor = tierColors[achievement.tier] || tierColors.bronze;
  const tierGradient = tierGradients[achievement.tier] || tierGradients.bronze;

  const handleShare = () => {
    const text = `I just unlocked the "${achievement.name}" achievement! ${achievement.icon}`;
    if (navigator.share) {
      navigator.share({
        title: 'Achievement Unlocked!',
        text: text,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        <Confetti show={showConfetti} />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader className="text-center space-y-4">
          {/* Trophy Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div
                className={cn(
                  'absolute inset-0 blur-xl opacity-50 rounded-full',
                  `bg-gradient-to-r ${tierGradient}`
                )}
              />
              <Trophy
                className={cn(
                  'h-16 w-16 relative animate-bounce',
                  tierColor
                )}
              />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <DialogTitle className="text-2xl font-bold">
              Achievement Unlocked!
            </DialogTitle>
            <DialogDescription className="text-base">
              Congratulations on your accomplishment!
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Achievement Details */}
        <div className="flex flex-col items-center space-y-4 py-6">
          {/* Icon */}
          <div
            className={cn(
              'text-6xl animate-pulse-slow',
              'drop-shadow-lg'
            )}
          >
            {achievement.icon}
          </div>

          {/* Name & Description */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold">{achievement.name}</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {achievement.description}
            </p>
          </div>

          {/* Tier & Points */}
          <div className="flex items-center gap-3">
            <Badge
              className={cn(
                'text-sm capitalize px-4 py-1',
                `bg-gradient-to-r ${tierGradient} text-white border-0`
              )}
            >
              {achievement.tier}
            </Badge>
            <div className="flex items-center gap-1 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <span className="text-yellow-600 dark:text-yellow-400">
                +{achievement.points} points
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button
            className={cn(
              'flex-1',
              `bg-gradient-to-r ${tierGradient} hover:opacity-90 text-white border-0`
            )}
            onClick={onClose}
          >
            Awesome!
          </Button>
        </div>
      </DialogContent>

      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .animate-confetti-fall {
          animation: confetti-fall linear forwards;
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </Dialog>
  );
}
