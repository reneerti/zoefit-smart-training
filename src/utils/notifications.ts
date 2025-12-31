// Notification sounds using Web Audio API
const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

export const playNotificationSound = (type: 'success' | 'motivational' | 'achievement' = 'success') => {
  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    const now = audioContext.currentTime;
    
    switch (type) {
      case 'success':
        // Short pleasant ding
        oscillator.frequency.setValueAtTime(880, now);
        oscillator.frequency.setValueAtTime(1100, now + 0.1);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialDecayTo?.(0.01, now + 0.3) || gainNode.gain.setValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;
        
      case 'motivational':
        // Uplifting chime sequence
        oscillator.frequency.setValueAtTime(523, now); // C5
        oscillator.frequency.setValueAtTime(659, now + 0.15); // E5
        oscillator.frequency.setValueAtTime(784, now + 0.3); // G5
        gainNode.gain.setValueAtTime(0.25, now);
        gainNode.gain.setValueAtTime(0.2, now + 0.15);
        gainNode.gain.setValueAtTime(0.15, now + 0.3);
        gainNode.gain.setValueAtTime(0.01, now + 0.5);
        oscillator.start(now);
        oscillator.stop(now + 0.5);
        break;
        
      case 'achievement':
        // Triumphant fanfare
        oscillator.frequency.setValueAtTime(392, now); // G4
        oscillator.frequency.setValueAtTime(523, now + 0.1); // C5
        oscillator.frequency.setValueAtTime(659, now + 0.2); // E5
        oscillator.frequency.setValueAtTime(784, now + 0.3); // G5
        oscillator.frequency.setValueAtTime(1047, now + 0.4); // C6
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.setValueAtTime(0.01, now + 0.6);
        oscillator.start(now);
        oscillator.stop(now + 0.6);
        break;
    }
  } catch (error) {
    console.log('Audio not supported:', error);
  }
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

// Send device notification
export const sendDeviceNotification = (title: string, body: string, icon?: string) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
    });
  }
};

// Schedule notification (uses setTimeout for demo, in production use service workers)
export const scheduleNotification = (
  title: string, 
  body: string, 
  delayMs: number,
  onTrigger?: () => void
): NodeJS.Timeout => {
  return setTimeout(() => {
    sendDeviceNotification(title, body);
    onTrigger?.();
  }, delayMs);
};
