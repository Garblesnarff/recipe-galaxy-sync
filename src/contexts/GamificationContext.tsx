import React, { createContext, useContext, useState, useCallback } from 'react';
import { AchievementUnlockedModal } from '@/components/workout/AchievementUnlockedModal';
import { Achievement } from '@/services/workout/gamification';

interface GamificationContextType {
  showAchievementModal: (achievement: Achievement) => void;
  showAchievementModals: (achievements: Achievement[]) => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(
  undefined
);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(
    null
  );
  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const showNextAchievement = useCallback(() => {
    if (achievementQueue.length > 0) {
      const [next, ...rest] = achievementQueue;
      setCurrentAchievement(next);
      setAchievementQueue(rest);
      setModalOpen(true);
    } else {
      setCurrentAchievement(null);
      setModalOpen(false);
    }
  }, [achievementQueue]);

  const handleClose = useCallback(() => {
    setModalOpen(false);
    // Show next achievement after a short delay
    setTimeout(() => {
      showNextAchievement();
    }, 300);
  }, [showNextAchievement]);

  const showAchievementModal = useCallback((achievement: Achievement) => {
    if (currentAchievement || modalOpen) {
      // Queue it if a modal is already showing
      setAchievementQueue((prev) => [...prev, achievement]);
    } else {
      setCurrentAchievement(achievement);
      setModalOpen(true);
    }
  }, [currentAchievement, modalOpen]);

  const showAchievementModals = useCallback(
    (achievements: Achievement[]) => {
      if (achievements.length === 0) return;

      if (currentAchievement || modalOpen) {
        // Queue all if a modal is already showing
        setAchievementQueue((prev) => [...prev, ...achievements]);
      } else {
        // Show first, queue rest
        const [first, ...rest] = achievements;
        setCurrentAchievement(first);
        setAchievementQueue(rest);
        setModalOpen(true);
      }
    },
    [currentAchievement, modalOpen]
  );

  return (
    <GamificationContext.Provider
      value={{ showAchievementModal, showAchievementModals }}
    >
      {children}
      <AchievementUnlockedModal
        achievement={currentAchievement}
        open={modalOpen}
        onClose={handleClose}
      />
    </GamificationContext.Provider>
  );
}

export function useAchievementModal() {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error(
      'useAchievementModal must be used within a GamificationProvider'
    );
  }
  return context;
}
