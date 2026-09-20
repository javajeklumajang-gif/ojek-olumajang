import React from 'react';
import { Home, Clock, PlusCircle, User, Bike, FileText, Settings, Shield } from 'lucide-react';
import { UserRole } from '../types';

interface BottomNavProps {
  currentRole: UserRole;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenOrderModal?: () => void;
  activeOrderCount?: number;
  isAdminAuthenticated?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentRole,
  activeTab,
  onTabChange,
  onOpenOrderModal,
  activeOrderCount = 0,
  isAdminAuthenticated = false,
}) => {
  if (currentRole === 'WARUNG') return null;
  if (currentRole === 'ADMIN' && !isAdminAuthenticated) return null;

  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200 px-2 py-1.5 shadow-lg select-none"
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {currentRole === 'CUSTOMER' && (
          <>
            <button
              id="tab-cust-home"
              onClick={() => onTabChange('home')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                activeTab === 'home' ? 'text-emerald-600 font-bold' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Home className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Beranda</span>
            </button>

            <button
              id="tab-cust-orders"
              onClick={() => onTabChange('orders')}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 transition ${
                activeTab === 'orders' ? 'text-emerald-600 font-bold' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Clock className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Pesanan</span>
              {activeOrderCount > 0 && (
                <span className="absolute top-0 right-5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
              )}
            </button>

            {/* Central CTA for Fast Order */}
            <button
              id="tab-cust-new-order"
              onClick={onOpenOrderModal}
              className="flex flex-col items-center justify-center -mt-5 mx-1"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg transform active:scale-95 transition">
                <PlusCircle className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-emerald-700 mt-0.5">Pesan</span>
            </button>

            <button
              id="tab-cust-history"
              onClick={() => onTabChange('history')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                activeTab === 'history' ? 'text-emerald-600 font-bold' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <FileText className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Riwayat</span>
            </button>

            <button
              id="tab-cust-profile"
              onClick={() => onTabChange('profile')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                activeTab === 'profile' ? 'text-emerald-600 font-bold' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <User className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Profil</span>
            </button>
          </>
        )}

        {currentRole === 'DRIVER' && (
          <>
            <button
              id="tab-driver-dashboard"
              onClick={() => onTabChange('dashboard')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                activeTab === 'dashboard' ? 'text-emerald-600 font-bold' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Bike className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Dashboard</span>
            </button>

            <button
              id="tab-driver-available"
              onClick={() => onTabChange('available')}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 transition ${
                activeTab === 'available' ? 'text-emerald-600 font-bold' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Clock className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Order Siap</span>
            </button>

            <button
              id="tab-driver-profile"
              onClick={() => onTabChange('profile')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                activeTab === 'profile' ? 'text-emerald-600 font-bold' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <User className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Akun Driver</span>
            </button>
          </>
        )}

        {currentRole === 'ADMIN' && (
          <>
            <button
              id="tab-admin-overview"
              onClick={() => onTabChange('overview')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                activeTab === 'overview' ? 'text-emerald-600 font-bold' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Shield className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Ringkasan</span>
            </button>

            <button
              id="tab-admin-orders"
              onClick={() => onTabChange('orders')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                activeTab === 'orders' ? 'text-emerald-600 font-bold' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <FileText className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Semua Order</span>
            </button>

            <button
              id="tab-admin-drivers"
              onClick={() => onTabChange('drivers')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                activeTab === 'drivers' ? 'text-emerald-600 font-bold' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Bike className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Mitra Driver</span>
            </button>

            <button
              id="tab-admin-settings"
              onClick={() => onTabChange('settings')}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                activeTab === 'settings' ? 'text-emerald-600 font-bold' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Settings className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Pengaturan</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
};
