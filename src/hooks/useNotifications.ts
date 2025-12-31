import { useEffect } from 'react';
import { playNotificationSound, requestNotificationPermission, sendDeviceNotification } from '@/utils/notifications';
import { useSettingsStore } from '@/store/settingsStore';

export const useNotifications = () => {
  const { soundEnabled } = useSettingsStore();

  useEffect(() => {
    // Request permission on mount
    requestNotificationPermission();
  }, []);

  const notifyWorkoutReminder = () => {
    if (soundEnabled) playNotificationSound('motivational');
    sendDeviceNotification(
      '🏋️ Hora do Treino!',
      'Não esqueça de completar seu treino de hoje.'
    );
  };

  const notifyAchievementUnlocked = (achievementName: string) => {
    if (soundEnabled) playNotificationSound('achievement');
    sendDeviceNotification(
      '🏆 Conquista Desbloqueada!',
      `Você desbloqueou: ${achievementName}`
    );
  };

  const notifyGoalAchieved = (goalName: string) => {
    if (soundEnabled) playNotificationSound('achievement');
    sendDeviceNotification(
      '🎯 Meta Atingida!',
      `Parabéns! Você atingiu sua meta: ${goalName}`
    );
  };

  const notifyWorkoutComplete = (duration: number) => {
    if (soundEnabled) playNotificationSound('success');
    sendDeviceNotification(
      '✅ Treino Finalizado!',
      `Excelente! Você treinou por ${duration} minutos hoje.`
    );
  };

  return {
    notifyWorkoutReminder,
    notifyAchievementUnlocked,
    notifyGoalAchieved,
    notifyWorkoutComplete
  };
};
