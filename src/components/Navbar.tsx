import React, { useState } from 'react';
import { Bell, ChevronDown, Bike, Shield, Store, User, Sparkles } from 'lucide-react';
import { UserRole } from '../types';
import { DB } from '../services/storageService';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenNotifications: () => void;
  unreadNotifsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  onOpenNotifications,
  unreadNotifsCount,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const roles: { role: UserRole; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      role: 'CUSTOMER',
      label: 'Customer / Pelanggan',
      icon: <User className="w-4 h-4 text-emerald-600" />,
      desc: 'Pesan Ojek, Cek Status, Rating',
    },
    {
      role: 'DRIVER',
      label: 'Mitra Driver',
      icon: <Bike className="w-4 h-4 text-emerald-600" />,
      desc: 'Online/Offline, Ambil Order, Timer',
    },
    {
      role: 'ADMIN',
      label: 'Admin Olumajang',
      icon: <Shield className="w-4 h-4 text-emerald-600" />,
      desc: 'Kelola Order, Readykan, Verifikasi Driver',
    },
    {
      role: 'WARUNG',
      label: 'Mitra Warung / Market',
      icon: <Store className="w-4 h-4 text-emerald-600" />,
      desc: 'Struktur Merchant & Katalog',
    },
  ];

  const currentRoleMeta = roles.find((r) => r.role === currentRole) || roles[0];

  return (
    <header className="sticky top-0 z-40 bg-emerald-600 text-white shadow-md select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-sm flex items-center justify-center shrink-0">
              <img
                src="/icon.svg"
                alt="Ojek Olumajang"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight leading-tight text-white">
                  OJEK OLUMAJANG
                </h1>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-700/80 text-emerald-100 uppercase tracking-wider">
                  Lumajang
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 font-medium tracking-wide">
                “Bersama Menggerakkan Lumajang”
              </p>
            </div>
          </div>

          {/* Right Controls: PWA Install + Role Switcher + Notif Bell */}
          <div className="flex items-center gap-2 sm:gap-3">
            <PWAInstallButton />

            {/* Quick Role Switcher Dropdown for seamless testing */}
            <div className="relative">
              <button
                id="btn-role-switcher"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1.5 bg-emerald-700/90 hover:bg-emerald-800 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-emerald-500/50 shadow-xs transition"
                title="Ganti Mode Pengguna"
              >
                <span className="hidden xs:inline text-emerald-200 text-[11px]">Mode:</span>
                <span className="truncate max-w-[90px] sm:max-w-none">{currentRole}</span>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-200" />
              </button>

              {showRoleMenu && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-xl bg-white shadow-xl ring-1 ring-black/10 py-1.5 z-50 text-gray-800 animate-in fade-in slide-in-from-top-2 duration-150"
                  onClick={() => setShowRoleMenu(false)}
                >
                  <div className="px-3 py-1.5 border-b border-gray-100">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Pilih Akses Pengguna
                    </p>
                  </div>
                  {roles.map((item) => (
                    <button
                      key={item.role}
                      onClick={() => {
                        onRoleChange(item.role);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-start gap-2.5 text-xs transition hover:bg-emerald-50 ${
                        currentRole === item.role ? 'bg-emerald-50/80 font-bold text-emerald-800' : 'text-gray-700'
                      }`}
                    >
                      <div className="p-1 rounded-md bg-gray-100 mt-0.5">{item.icon}</div>
                      <div>
                        <div className="font-semibold text-gray-900">{item.label}</div>
                        <div className="text-[10px] text-gray-500">{item.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <button
              id="btn-open-notifications"
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg bg-emerald-700/80 hover:bg-emerald-800 text-white transition focus:outline-none"
              title="Notifikasi"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
                  {unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
