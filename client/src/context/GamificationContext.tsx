import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { UserProfile } from '../types/auth.types';
import {
  calculateLevel,
  calculateRequiredXP,
  calculateNextLevelXP,
  calculateProgressPercent,
  getLevelTitle,
  type LevelTitleInfo
} from '../utils/gamificationUtils';

export interface GamificationUpdatePayload {
  total_xp?: number;
  current_level?: number;
  xp_earned?: number;
  level_up?: boolean;
  is_cap_reached?: boolean;
  title?: string;
}

export interface LevelUpModalState {
  isOpen: boolean;
  newLevel: number;
  oldLevel: number;
  title: string;
  titleEn: string;
  totalXP: number;
}

export interface GamificationContextType {
  totalXP: number;
  currentLevel: number;
  requiredXP: number;
  nextLevelXP: number;
  progressPercent: number;
  currentLevelXP: number;
  levelXPRange: number;
  remainingXP: number;
  titleInfo: LevelTitleInfo;
  levelUpModal: LevelUpModalState | null;
  triggerGamificationUpdate: (payload: GamificationUpdatePayload) => void;
  showLevelUpModal: (level: number, title?: string, totalXP?: number) => void;
  closeLevelUpModal: () => void;
  updateStats: (totalXP: number, currentLevel?: number) => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

interface GamificationProviderProps {
  children: React.ReactNode;
  initialXP?: number;
  initialLevel?: number;
  currentUser?: UserProfile | null;
  onUpdateUser?: (updated: UserProfile) => void;
}

export const GamificationProvider: React.FC<GamificationProviderProps> = ({
  children,
  initialXP,
  initialLevel,
  currentUser,
  onUpdateUser
}) => {
  const [totalXP, setTotalXP] = useState<number>(() => {
    if (currentUser?.total_xp !== undefined) return currentUser.total_xp;
    if (initialXP !== undefined) return initialXP;
    return 380; // Giá trị mặc định đồng bộ MVP wireframe
  });

  const [currentLevel, setCurrentLevel] = useState<number>(() => {
    if (currentUser?.current_level !== undefined) return currentUser.current_level;
    if (initialLevel !== undefined) return initialLevel;
    return calculateLevel(currentUser?.total_xp ?? initialXP ?? 380);
  });

  const [levelUpModal, setLevelUpModal] = useState<LevelUpModalState | null>(null);

  // Đồng bộ khi currentUser thay đổi từ phía ngoài (ví dụ sau khi fetch /auth/me)
  useEffect(() => {
    if (currentUser) {
      if (currentUser.total_xp !== undefined && currentUser.total_xp !== totalXP) {
        setTotalXP(currentUser.total_xp);
      }
      if (currentUser.current_level !== undefined && currentUser.current_level !== currentLevel) {
        setCurrentLevel(currentUser.current_level);
      }
    }
  }, [currentUser?.total_xp, currentUser?.current_level]);

  // Các giá trị tính toán dẫn xuất
  const requiredXP = useMemo(() => calculateRequiredXP(currentLevel), [currentLevel]);
  const nextLevelXP = useMemo(() => calculateNextLevelXP(currentLevel), [currentLevel]);
  const progressPercent = useMemo(
    () => calculateProgressPercent(totalXP, currentLevel),
    [totalXP, currentLevel]
  );
  const currentLevelXP = useMemo(() => Math.max(0, totalXP - requiredXP), [totalXP, requiredXP]);
  const levelXPRange = useMemo(() => Math.max(1, nextLevelXP - requiredXP), [nextLevelXP, requiredXP]);
  const remainingXP = useMemo(() => Math.max(0, nextLevelXP - totalXP), [nextLevelXP, totalXP]);
  const titleInfo = useMemo(() => getLevelTitle(currentLevel), [currentLevel]);

  const closeLevelUpModal = useCallback(() => {
    setLevelUpModal((prev) => (prev ? { ...prev, isOpen: false } : null));
  }, []);

  const showLevelUpModal = useCallback(
    (level: number, title?: string, xp?: number) => {
      const info = getLevelTitle(level);
      setLevelUpModal({
        isOpen: true,
        newLevel: level,
        oldLevel: Math.max(1, level - 1),
        title: title || info.title,
        titleEn: info.title_en,
        totalXP: xp !== undefined ? xp : totalXP
      });
    },
    [totalXP]
  );

  const updateStats = useCallback(
    (newXP: number, newLevel?: number) => {
      const calculatedLevel = newLevel !== undefined ? newLevel : calculateLevel(newXP);
      setTotalXP(newXP);
      setCurrentLevel(calculatedLevel);

      if (currentUser && onUpdateUser) {
        onUpdateUser({
          ...currentUser,
          total_xp: newXP,
          current_level: calculatedLevel
        });
      }
    },
    [currentUser, onUpdateUser]
  );

  // Kích hoạt cập nhật thời gian thực khi hoàn thành task hoặc điểm danh habit
  const triggerGamificationUpdate = useCallback(
    (payload: GamificationUpdatePayload) => {
      const oldLevel = currentLevel;
      const newXP = payload.total_xp !== undefined ? payload.total_xp : totalXP + (payload.xp_earned || 0);
      const newLevel = payload.current_level !== undefined ? payload.current_level : calculateLevel(newXP);

      setTotalXP(newXP);
      setCurrentLevel(newLevel);

      if (currentUser && onUpdateUser) {
        onUpdateUser({
          ...currentUser,
          total_xp: newXP,
          current_level: newLevel
        });
      }

      // Kích hoạt Level Up Modal nếu có cờ level_up: true hoặc newLevel > oldLevel
      if (payload.level_up || newLevel > oldLevel) {
        const info = getLevelTitle(newLevel);
        setLevelUpModal({
          isOpen: true,
          newLevel,
          oldLevel,
          title: payload.title || info.title,
          titleEn: info.title_en,
          totalXP: newXP
        });
      }

      // Phát sự kiện toàn cục để các màn hình độc lập có thể lắng nghe nếu cần
      window.dispatchEvent(
        new CustomEvent('questline-gamification-updated', {
          detail: {
            total_xp: newXP,
            current_level: newLevel,
            level_up: Boolean(payload.level_up || newLevel > oldLevel),
            xp_earned: payload.xp_earned || 0
          }
        })
      );
    },
    [currentLevel, totalXP, currentUser, onUpdateUser]
  );

  const value = useMemo(
    () => ({
      totalXP,
      currentLevel,
      requiredXP,
      nextLevelXP,
      progressPercent,
      currentLevelXP,
      levelXPRange,
      remainingXP,
      titleInfo,
      levelUpModal,
      triggerGamificationUpdate,
      showLevelUpModal,
      closeLevelUpModal,
      updateStats
    }),
    [
      totalXP,
      currentLevel,
      requiredXP,
      nextLevelXP,
      progressPercent,
      currentLevelXP,
      levelXPRange,
      remainingXP,
      titleInfo,
      levelUpModal,
      triggerGamificationUpdate,
      showLevelUpModal,
      closeLevelUpModal,
      updateStats
    ]
  );

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = (): GamificationContextType => {
  const context = useContext(GamificationContext);
  if (!context) {
    // Dự phòng an toàn nếu component được render bên ngoài Provider
    const fallbackLevel = 1;
    const fallbackXP = 0;
    const reqXP = calculateRequiredXP(fallbackLevel);
    const nextXP = calculateNextLevelXP(fallbackLevel);
    const percent = calculateProgressPercent(fallbackXP, fallbackLevel);
    return {
      totalXP: fallbackXP,
      currentLevel: fallbackLevel,
      requiredXP: reqXP,
      nextLevelXP: nextXP,
      progressPercent: percent,
      currentLevelXP: 0,
      levelXPRange: 100,
      remainingXP: 100,
      titleInfo: getLevelTitle(fallbackLevel),
      levelUpModal: null,
      triggerGamificationUpdate: () => {},
      showLevelUpModal: () => {},
      closeLevelUpModal: () => {},
      updateStats: () => {}
    };
  }
  return context;
};
