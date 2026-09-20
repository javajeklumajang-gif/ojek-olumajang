import React, { useState, useEffect } from 'react';
import {
  Bike,
  Power,
  Clock,
  Star,
  MapPin,
  Phone,
  CheckCircle,
  XCircle,
  ExternalLink,
  Navigation,
  AlertTriangle,
  LogOut,
  ChevronRight,
  Timer,
  UserCheck,
  Wallet,
  PlusCircle,
  History,
  AlertCircle,
} from 'lucide-react';
import { Driver, Order, OrderStatus } from '../types';
import { DB } from '../services/storageService';
import { formatRupiah } from '../services/tariffService';
import { clearDriverSession } from '../services/authService';
import { playNotificationTone } from '../services/notificationService';
import { WalletDB, subscribeToWallet } from '../services/walletService';
import { getDriverMinBalance } from '../config/constants';
import { DriverTopUpModal } from '../components/DriverTopUpModal';

interface DriverDashboardProps {
  driver: Driver;
  orders: Order[];
  onLogout: () => void;
  onRefreshDriver: () => void;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({
  driver,
  orders,
  onLogout,
  onRefreshDriver,
}) => {
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'beranda' | 'riwayat'>('beranda');

  // State Saldo Operasional Driver
  const [wallet, setWallet] = useState(() => WalletDB.getWallet(driver.id, 'DRIVER'));
  const [minBalance, setMinBalance] = useState(() => getDriverMinBalance());
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState<boolean>(false);
  const [topUpModalTab, setTopUpModalTab] = useState<'topup' | 'riwayat'>('topup');
  const [insufficientAlert, setInsufficientAlert] = useState<string | null>(null);

  // Sinkronisasi Saldo Driver & Batas Minimum secara Real-Time
  useEffect(() => {
    const refreshWallet = () => {
      setWallet(WalletDB.getWallet(driver.id, 'DRIVER'));
      setMinBalance(getDriverMinBalance());
    };
    refreshWallet();
    const unsub = subscribeToWallet(refreshWallet);
    const handleConfigUpdate = () => {
      setMinBalance(getDriverMinBalance());
    };
    window.addEventListener('driver-config-updated', handleConfigUpdate);
    return () => {
      unsub();
      window.removeEventListener('driver-config-updated', handleConfigUpdate);
    };
  }, [driver.id]);

  const isBalanceSufficient = wallet.balance >= minBalance;

  // Handle 5-minute timer countdown
  useEffect(() => {
    const checkTimer = () => {
      if (driver.timerEndsAt && driver.timerEndsAt > Date.now()) {
        const remaining = Math.max(0, Math.ceil((driver.timerEndsAt - Date.now()) / 1000));
        setTimerSecondsLeft(remaining);
        if (remaining === 0) {
          playNotificationTone('timer');
        }
      } else {
        setTimerSecondsLeft(0);
      }
    };

    checkTimer();
    const interval = setInterval(checkTimer, 1000);
    return () => clearInterval(interval);
  }, [driver.timerEndsAt]);

  const handleToggleOnline = () => {
    const nextState = !driver.isOnline;
    DB.updateDriver(driver.id, { isOnline: nextState });
    onRefreshDriver();
  };

  // Orders available for drivers: Only if ONLINE and status is READY
  const availableOrders = driver.isOnline
    ? orders.filter((o) => o.status === 'READY')
    : [];

  // Active order currently taken by this driver
  const myActiveOrder = orders.find(
    (o) =>
      o.driverId === driver.id &&
      o.status !== 'SELESAI' &&
      o.status !== 'DIBATALKAN'
  );

  const handleTakeOrder = (orderId: string) => {
    // ========================================================
    // ATURAN AMBIL ORDER: CEK SALDO OPERASIONAL MINIMUM DRIVER
    // ========================================================
    if (wallet.balance < minBalance) {
      setInsufficientAlert(
        'Saldo Driver tidak mencukupi.\nSilakan isi saldo terlebih dahulu untuk mengambil order.'
      );
      setTopUpModalTab('topup');
      setIsTopUpModalOpen(true);
      return;
    }

    const result = DB.takeOrder(orderId, driver);
    if (!result.success) {
      if (result.error?.includes('Saldo Driver')) {
        setInsufficientAlert(result.error);
        setTopUpModalTab('topup');
        setIsTopUpModalOpen(true);
      } else {
        alert(result.error || 'Gagal mengambil order.');
      }
      return;
    }
    setInsufficientAlert(null);
    onRefreshDriver();
  };

  const handleUpdateStatus = (orderId: string, status: OrderStatus) => {
    DB.updateOrderStatus(orderId, status);
    onRefreshDriver();
  };

  const handleCompleteOrder = (orderId: string) => {
    DB.updateOrderStatus(orderId, 'SELESAI');
    onRefreshDriver();
  };

  const handleCancelOrder = (orderId: string) => {
    if (confirm('Apakah Anda yakin ingin membatalkan pesanan ini?')) {
      DB.updateOrderStatus(orderId, 'DIBATALKAN');
      onRefreshDriver();
    }
  };

  const handleOpenMaps = (order: Order) => {
    if (order.shareLocationLink) {
      window.open(order.shareLocationLink, '_blank');
      return;
    }
    const q = encodeURIComponent(`${order.pickupLocation}, Lumajang`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
  };

  const handleCallCustomer = (order: Order) => {
    const cleanPhone = order.customerPhone.replace(/\D/g, '');
    window.open(`https://wa.me/62${cleanPhone.replace(/^0/, '')}`, '_blank');
  };

  const formatTimerMinutes = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 text-gray-900 select-none">
      {/* Header Profile Bar */}
      <div className="bg-emerald-700 text-white px-4 py-4 shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={
                  driver.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                }
                alt={driver.fullName}
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-300 shadow-sm"
              />
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-emerald-700 ${
                  driver.isOnline ? 'bg-emerald-400' : 'bg-gray-400'
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-extrabold text-sm sm:text-base leading-tight">
                  {driver.fullName}
                </h2>
                <span className="text-[10px] bg-emerald-800 px-1.5 py-0.5 rounded text-emerald-200">
                  {driver.gender}
                </span>
              </div>
              <div className="text-xs text-emerald-100 flex items-center gap-1 mt-0.5">
                <span>{driver.plateNumber}</span>
                <span>•</span>
                <span>{driver.vehicleModel}</span>
              </div>
            </div>
          </div>

          <button
            id="btn-driver-logout"
            onClick={() => {
              clearDriverSession();
              onLogout();
            }}
            className="p-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-emerald-200 hover:text-white transition"
            title="Keluar Akun"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* ======================================================== */}
        {/* 💰 SALDO DRIVER CARD (OPERASIONAL) */}
        {/* ======================================================== */}
        <div className="bg-white rounded-3xl p-4.5 shadow-sm border border-gray-100 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">💰</span>
              <div>
                <h3 className="font-extrabold text-sm text-gray-800 tracking-wide uppercase">
                  SALDO DRIVER
                </h3>
                <span className="text-[10px] text-gray-400">Saldo Operasional Mitra</span>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase ${
                isBalanceSufficient
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
              }`}
            >
              <span>{isBalanceSufficient ? '🟢' : '🔴'}</span>
              <span>{isBalanceSufficient ? 'SALDO CUKUP' : 'SALDO TIDAK CUKUP'}</span>
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                {formatRupiah(wallet.balance)}
              </span>
              <span className="text-[11px] text-gray-500 block mt-0.5">
                Batas Minimum: <strong>{formatRupiah(minBalance)}</strong>
              </span>
            </div>
          </div>

          {/* Tombol [ + ISI SALDO ] & [ RIWAYAT SALDO ] */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
            <button
              onClick={() => {
                setTopUpModalTab('topup');
                setIsTopUpModalOpen(true);
              }}
              className="py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ ISI SALDO</span>
            </button>
            <button
              onClick={() => {
                setTopUpModalTab('riwayat');
                setIsTopUpModalOpen(true);
              }}
              className="py-2.5 px-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>RIWAYAT SALDO</span>
            </button>
          </div>
        </div>

        {/* PERINGATAN KETIKA SALDO TIDAK CUKUP */}
        {(!isBalanceSufficient || insufficientAlert) && (
          <div className="p-4 rounded-3xl bg-rose-50 border-2 border-rose-300 text-rose-950 space-y-2.5 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-black text-sm text-rose-900">
                  Saldo Driver tidak mencukupi.
                </h4>
                <p className="text-xs text-rose-800 leading-relaxed">
                  Silakan isi saldo terlebih dahulu untuk mengambil order. Batas saldo operasional minimum
                  adalah <strong>{formatRupiah(minBalance)}</strong> (Saldo Anda:{' '}
                  {formatRupiah(wallet.balance)}).
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setTopUpModalTab('topup');
                setIsTopUpModalOpen(true);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ ISI SALDO SEKARANG</span>
            </button>
          </div>
        )}

        {/* BIG ONLINE / OFFLINE TOGGLE BUTTON */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 text-center space-y-3">
          <div className="flex items-center justify-between text-xs px-2">
            <span className="font-bold text-gray-500 uppercase tracking-wider">
              Status Operasional
            </span>
            <span
              className={`font-black px-2.5 py-1 rounded-full text-xs ${
                driver.isOnline
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {driver.isOnline ? 'ONLINE (SIAP MENERIMA)' : 'OFFLINE (ISTIRAHAT)'}
            </span>
          </div>

          <button
            id="btn-toggle-driver-online"
            onClick={handleToggleOnline}
            className={`w-full py-4 rounded-2xl font-black text-base shadow-md transition flex items-center justify-center gap-3 active:scale-98 ${
              driver.isOnline
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-emerald-600/30'
                : 'bg-gray-800 text-gray-100 hover:bg-gray-700'
            }`}
          >
            <Power className="w-6 h-6" />
            <span>{driver.isOnline ? 'ANDA SEDANG ONLINE' : 'KLIK UNTUK ONLINE'}</span>
          </button>

          <p className="text-[11px] text-gray-400">
            {driver.isOnline
              ? 'Order yang sudah di-Readykan Admin akan muncul secara otomatis di bawah ini.'
              : 'Aktifkan status Online agar Anda dapat melihat dan mengambil order yang siap.'}
          </p>
        </div>

        {/* 3 Metric Cards: Order Hari Ini, Rating, Order Selesai */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-2xs">
            <span className="text-[10px] text-gray-400 font-medium block">Order Hari Ini</span>
            <span className="text-lg font-black text-gray-900 mt-0.5 block">
              {driver.todayOrdersCount || 0}
            </span>
            <span className="text-[9px] text-emerald-700 font-semibold">Pesanan</span>
          </div>

          <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-2xs">
            <span className="text-[10px] text-gray-400 font-medium block">Rating Mitra</span>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-lg font-black text-gray-900">{driver.ratingAvg || 5.0}</span>
            </div>
            <span className="text-[9px] text-gray-400">({driver.ratingCount || 0} ulasan)</span>
          </div>

          <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-2xs">
            <span className="text-[10px] text-gray-400 font-medium block">Total Selesai</span>
            <span className="text-lg font-black text-emerald-800 mt-0.5 block">
              {driver.completedOrdersCount || 0}
            </span>
            <span className="text-[9px] text-emerald-700 font-semibold">Trip Berhasil</span>
          </div>
        </div>

        {/* 5-Minute Timer Notice (Cooldown Lock) */}
        {timerSecondsLeft > 0 && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5 flex items-center justify-between text-amber-950 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center animate-pulse">
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight">Jeda Timer 5 Menit Berjalan</h4>
                <p className="text-[11px] text-amber-800">
                  Anda tidak dapat mengambil order baru selama waktu pendingin ini.
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-base font-black text-amber-900 bg-white px-2.5 py-1 rounded-lg border border-amber-300">
                {formatTimerMinutes(timerSecondsLeft)}
              </span>
            </div>
          </div>
        )}

        {/* ACTIVE TAKEN ORDER SECTION */}
        {myActiveOrder && (
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-md border-2 border-emerald-500 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-600 text-white">
                ORDER AKTIF ANDA
              </span>
              <span className="font-bold text-xs text-gray-600">ID #{myActiveOrder.id}</span>
            </div>

            {/* Customer Details */}
            <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-bold block">
                  Nama Pelanggan:
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {myActiveOrder.customerName}
                </span>
                <div className="text-xs text-gray-600 mt-0.5">{myActiveOrder.customerPhone}</div>
              </div>
              <button
                id="btn-driver-call-customer"
                onClick={() => handleCallCustomer(myActiveOrder)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
              >
                <Phone className="w-4 h-4" />
                <span>Hubungi Customer</span>
              </button>
            </div>

            {/* Locations & Ongkir */}
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-[10px] text-gray-400 block">Titik Jemput:</span>
                <span className="font-bold text-gray-900 block mt-0.5">
                  {myActiveOrder.pickupLocation}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-[10px] text-gray-400 block">Titik Tujuan:</span>
                <span className="font-bold text-gray-900 block mt-0.5">
                  {myActiveOrder.dropoffLocation}
                </span>
              </div>

              {myActiveOrder.notes && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  <span className="font-bold">Catatan:</span> {myActiveOrder.notes}
                </div>
              )}

              {/* ======================================================== */}
              {/* 7. DRIVER — TAMPILAN PEMBAYARAN PADA ORDER */}
              {/* ======================================================== */}
              <div
                className={`p-3 rounded-2xl border-2 space-y-2 ${
                  myActiveOrder.paymentMethod === 'SALDO'
                    ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                    : 'bg-amber-50 border-amber-300 text-amber-950'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-xs">
                    {myActiveOrder.paymentMethod === 'SALDO' ? (
                      <>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-2xs">
                          💰 LUNAS (SALDO)
                        </span>
                        <span className="text-[11px] text-emerald-800 font-bold">
                          STATUS: DIBAYAR
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="px-2 py-0.5 rounded-md bg-amber-600 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-2xs">
                          💵 TAGIH CASH {formatRupiah(myActiveOrder.totalTariff)}
                        </span>
                        <span className="text-[11px] text-amber-800 font-bold">
                          STATUS: BELUM BAYAR
                        </span>
                      </>
                    )}
                  </div>
                  <span className="text-[10px] font-extrabold text-gray-500 uppercase">
                    METODE: {myActiveOrder.paymentMethod || 'CASH'}
                  </span>
                </div>

                <div className="text-[11px] leading-relaxed pt-1 border-t border-gray-200/60">
                  {myActiveOrder.paymentMethod === 'SALDO' ? (
                    <p className="text-emerald-900 font-semibold flex items-center gap-1">
                      <span>✓</span>
                      <span>
                        <strong>Driver TIDAK PERLU menagih ke Customer.</strong> Ongkir sudah lunas
                        terpotong dari Saldo Customer.
                      </span>
                    </p>
                  ) : (
                    <p className="text-amber-950 font-bold flex items-center gap-1">
                      <span>⚠️</span>
                      <span>
                        <strong>Driver HARUS menerima uang tunai</strong> sebesar{' '}
                        <span className="underline font-black">
                          {formatRupiah(myActiveOrder.totalTariff)}
                        </span>{' '}
                        langsung dari Customer saat pengantaran.
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[10px] text-gray-400 block">Total Ongkir:</span>
                  <span className="text-base font-black text-emerald-800">
                    {formatRupiah(myActiveOrder.totalTariff)}
                  </span>
                </div>
                <button
                  id="btn-driver-open-maps"
                  onClick={() => handleOpenMaps(myActiveOrder)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition"
                >
                  <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Buka Lokasi (Peta)</span>
                </button>
              </div>
            </div>

            {/* Step Progressive Controls */}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Status Perjalanan:
              </span>

              <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                <button
                  onClick={() => handleUpdateStatus(myActiveOrder.id, 'MENUJU JEMPUT')}
                  className={`py-2 px-1 rounded-xl font-bold transition text-[11px] ${
                    myActiveOrder.status === 'MENUJU JEMPUT'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  1. Menuju Jemput
                </button>

                <button
                  onClick={() => handleUpdateStatus(myActiveOrder.id, 'SAMPAI DI LOKASI')}
                  className={`py-2 px-1 rounded-xl font-bold transition text-[11px] ${
                    myActiveOrder.status === 'SAMPAI DI LOKASI'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  2. Tiba di Lokasi
                </button>

                <button
                  onClick={() => handleUpdateStatus(myActiveOrder.id, 'DALAM PERJALANAN')}
                  className={`py-2 px-1 rounded-xl font-bold transition text-[11px] ${
                    myActiveOrder.status === 'DALAM PERJALANAN'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  3. Di Jalan
                </button>
              </div>

              {/* Selesaikan & Batalkan Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  id="btn-driver-complete-order"
                  onClick={() => handleCompleteOrder(myActiveOrder.id)}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>SELESAIKAN ORDER</span>
                </button>

                <button
                  id="btn-driver-cancel-order"
                  onClick={() => handleCancelOrder(myActiveOrder.id)}
                  className="w-full py-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>BATALKAN</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ORDER TERSEDIA (AVAILABLE ORDERS) LIST */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <Bike className="w-4 h-4 text-emerald-600" />
              Order Tersedia Siap Diambil ({availableOrders.length})
            </h3>
            <span className="text-[10px] text-gray-400">
              {driver.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {!driver.isOnline ? (
            <div className="text-center py-8 text-gray-400">
              <Power className="w-10 h-10 mx-auto mb-2 text-gray-300 stroke-1" />
              <p className="text-xs font-semibold text-gray-600">Anda sedang OFFLINE</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Nyalakan status Online di atas untuk menerima pesanan yang siap.
              </p>
            </div>
          ) : availableOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Clock className="w-10 h-10 mx-auto mb-2 text-gray-300 stroke-1" />
              <p className="text-xs font-semibold text-gray-600">Belum ada order siap</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Order akan muncul setelah diverifikasi dan ditekan <strong>READYKAN ORDER</strong>{' '}
                oleh Admin.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-3.5 rounded-2xl border-2 border-emerald-100 bg-emerald-50/30 hover:bg-emerald-50/70 transition space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-emerald-950 text-sm">
                      {order.serviceType}
                    </span>
                    <span className="font-mono text-[10px] text-gray-400">#{order.id}</span>
                  </div>

                  <div className="space-y-1 text-gray-700">
                    <div className="flex items-start gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 mt-1 shrink-0" />
                      <div>
                        <span className="text-[10px] text-gray-400">Jemput:</span>{' '}
                        <span className="font-semibold">{order.pickupLocation}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-600 mt-1 shrink-0" />
                      <div>
                        <span className="text-[10px] text-gray-400">Tujuan:</span>{' '}
                        <span className="font-semibold">{order.dropoffLocation}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-100">
                    <span className="text-[10px] text-gray-500 font-medium">Pembayaran:</span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        order.paymentMethod === 'SALDO'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {order.paymentMethod === 'SALDO'
                        ? '💰 LUNAS (SALDO)'
                        : `💵 TAGIH CASH ${formatRupiah(order.totalTariff)}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-emerald-100">
                    <div>
                      <span className="text-[10px] text-gray-400 block">
                        Jarak {order.distanceKm} km:
                      </span>
                      <span className="font-extrabold text-emerald-800 text-sm">
                        {formatRupiah(order.totalTariff)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isBalanceSufficient && (
                        <button
                          onClick={() => {
                            setTopUpModalTab('topup');
                            setIsTopUpModalOpen(true);
                          }}
                          className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>+ ISI SALDO</span>
                        </button>
                      )}

                      <button
                        id={`btn-take-order-${order.id}`}
                        onClick={() => handleTakeOrder(order.id)}
                        disabled={!!myActiveOrder || timerSecondsLeft > 0 || !isBalanceSufficient}
                        className={`px-4 py-2 rounded-xl font-extrabold text-xs shadow-xs transition ${
                          !isBalanceSufficient
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                            : !!myActiveOrder || timerSecondsLeft > 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                        }`}
                        title={
                          !isBalanceSufficient
                            ? 'Saldo Driver tidak mencukupi untuk mengambil order'
                            : undefined
                        }
                      >
                        {!isBalanceSufficient
                          ? 'Saldo Kurang'
                          : myActiveOrder
                          ? 'Ada Order Aktif'
                          : 'AMBIL ORDER'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Isi Saldo & Riwayat Saldo Driver */}
      <DriverTopUpModal
        driverId={driver.id}
        driverName={driver.fullName}
        isOpen={isTopUpModalOpen}
        defaultTab={topUpModalTab}
        onClose={() => {
          setIsTopUpModalOpen(false);
          setInsufficientAlert(null);
        }}
      />
    </div>
  );
};
