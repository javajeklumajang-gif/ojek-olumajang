import { AppNotification, NotificationSettings, UserRole } from '../types';

const SETTINGS_KEY = 'ojek_olumajang_notification_settings';

export function getNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return { soundEnabled: true, vibrateEnabled: true };
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Sintesis Audio Chime Berbasis Web Audio API murni
 * Tidak memerlukan unduhan file MP3 eksternal sehingga 100% reliabel di browser
 */
export function playNotificationTone(type: 'success' | 'alert' | 'timer' | 'info' = 'info'): void {
  const settings = getNotificationSettings();
  if (!settings.soundEnabled) return;

  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      // 2-tone melodic chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880.0, now + 0.1); // A5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'alert') {
      // Prompt notice for new orders
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.12); // G5
      osc.frequency.setValueAtTime(1046.5, now + 0.24); // C6
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.55);
    } else if (type === 'timer') {
      // Timer finished bell
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.65);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (err) {
    console.warn('Audio tone playback was prevented by browser policy:', err);
  }
}

/**
 * Getar Haptic Ponsel Android via Web Vibration API
 */
export function triggerHapticVibration(pattern: number[] = [100, 60, 100]): void {
  const settings = getNotificationSettings();
  if (!settings.vibrateEnabled) return;

  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // silent fallback
    }
  }
}

/**
 * Dispatch notifikasi aplikasi secara terstruktur
 */
export function createNotification(
  targetRole: UserRole | 'ALL',
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  relatedOrderId?: string
): AppNotification {
  // Mainkan efek suara & getar sesuai jenis
  if (type === 'success') {
    playNotificationTone('success');
    triggerHapticVibration([80, 50, 80]);
  } else if (type === 'warning' || type === 'error') {
    playNotificationTone('alert');
    triggerHapticVibration([150, 50, 150]);
  } else {
    playNotificationTone('info');
    triggerHapticVibration([80]);
  }

  return {
    id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    targetRole,
    title,
    message,
    timestamp: Date.now(),
    read: false,
    type,
    relatedOrderId,
  };
}
