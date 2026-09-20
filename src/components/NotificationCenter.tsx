import React, { useState, useEffect } from 'react';
import { Bell, Volume2, VolumeX, Smartphone, X, Trash2, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { AppNotification, NotificationSettings, UserRole } from '../types';
import {
  getNotificationSettings,
  saveNotificationSettings,
  playNotificationTone,
  triggerHapticVibration,
} from '../services/notificationService';
import { DB } from '../services/storageService';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  currentRole,
}) => {
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings());
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (isOpen) {
      setNotifications(DB.getNotifications());
      DB.markAllNotificationsRead();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleSound = () => {
    const updated = { ...settings, soundEnabled: !settings.soundEnabled };
    setSettings(updated);
    saveNotificationSettings(updated);
    if (updated.soundEnabled) {
      playNotificationTone('success');
    }
  };

  const handleToggleVibrate = () => {
    const updated = { ...settings, vibrateEnabled: !settings.vibrateEnabled };
    setSettings(updated);
    saveNotificationSettings(updated);
    if (updated.vibrateEnabled) {
      triggerHapticVibration([100, 50, 100]);
    }
  };

  const handleClearAll = () => {
    DB.clearNotifications();
    setNotifications([]);
  };

  // Filter notifikasi sesuai role aktif atau ALL
  const filteredNotifications = notifications.filter(
    (n) => n.targetRole === 'ALL' || n.targetRole === currentRole
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-gray-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-emerald-600 text-white">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <h2 className="font-bold text-base">Notifikasi Aplikasi</h2>
          </div>
          <button
            id="btn-close-notif-modal"
            onClick={onClose}
            className="p-1 rounded-full text-emerald-100 hover:text-white hover:bg-emerald-700/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Setting Toggles Bar */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <button
              id="btn-toggle-sound"
              onClick={handleToggleSound}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                settings.soundEnabled
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {settings.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>Suara: {settings.soundEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              id="btn-toggle-vibrate"
              onClick={handleToggleVibrate}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                settings.vibrateEnabled
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Getar: {settings.vibrateEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {filteredNotifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-gray-400 hover:text-rose-600 p-1 transition"
              title="Hapus Semua"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Simulation note notice */}
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 text-[11px] text-amber-800 flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Mode Preview: Suara dan getar disimulasikan lokal. Siap terhubung ke push notification backend.
          </span>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Bell className="w-10 h-10 mx-auto mb-2 text-gray-300 stroke-1" />
              <p className="text-sm font-medium">Belum ada notifikasi baru</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Aktivitas order dan pembaruan status akan muncul di sini.
              </p>
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <div
                key={n.id}
                className="p-3 rounded-xl border border-gray-100 bg-white hover:bg-gray-50/80 shadow-2xs transition flex items-start gap-3"
              >
                <div className="mt-0.5 shrink-0">
                  {n.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                  {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                  {n.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                  {n.type === 'info' && <Info className="w-4 h-4 text-blue-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-gray-900 truncate">{n.title}</h4>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {new Date(n.timestamp).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{n.message}</p>
                  <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-gray-100 text-gray-500">
                    Untuk: {n.targetRole}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
