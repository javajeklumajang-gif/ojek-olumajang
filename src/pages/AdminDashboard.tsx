import React, { useState } from 'react';
import {
  Shield,
  FileText,
  Bike,
  UserCheck,
  Store,
  Ticket,
  Settings,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  AlertTriangle,
  Play,
  Phone,
  Search,
  ExternalLink,
  MessageSquare,
  LogOut,
  MapPin,
  Navigation,
  Check,
  X,
  ChevronRight,
  Filter,
  Eye,
  Info,
  Lock,
  Wallet,
} from 'lucide-react';
import { Driver, Order, OrderStatus, TariffConfig } from '../types';
import { DB } from '../services/storageService';
import { formatRupiah } from '../services/tariffService';
import { ADMIN_WHATSAPP, createCustomerWhatsAppUrl } from '../config/constants';
import { updateAdminPassword } from '../services/authService';
import { AdminSaldoTransaksi } from '../components/AdminSaldoTransaksi';

interface AdminDashboardProps {
  orders: Order[];
  drivers: Driver[];
  onRefresh: () => void;
  onLogout?: () => void;
  adminUsername?: string;
}

type AdminTab =
  | 'Dashboard'
  | 'Order'
  | 'Driver'
  | 'Pendaftaran'
  | 'Warung'
  | 'Promo'
  | 'SaldoTransaksi'
  | 'Pengaturan';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders,
  drivers,
  onRefresh,
  onLogout,
  adminUsername = 'admin',
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('Dashboard');
  const [orderFilter, setOrderFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Modal Dialogs
  const [rejectModalOrder, setRejectModalOrder] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState('Driver sedang tidak tersedia di area ini');

  // Success Notification Banner (Misal: "✅ ORDER SIAP - Order sekarang tersedia untuk Driver Online.")
  const [readySuccessNotice, setReadySuccessNotice] = useState<{
    orderId: string;
    message: string;
  } | null>(null);

  // Settings state
  const [tariffForm, setTariffForm] = useState<TariffConfig>(DB.getTariffConfig());
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Admin Password Management State
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirmPwd: '' });
  const [pwdStatus, setPwdStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);

  // Helper normalisasi status
  const isStatusMenungguAdmin = (st: OrderStatus) =>
    st === 'MENUNGGU ADMIN' || st === 'MENUNGGU_ADMIN';
  const isStatusReady = (st: OrderStatus) => st === 'READY';
  const isStatusInProgress = (st: OrderStatus) =>
    st === 'DIAMBIL DRIVER' ||
    st === 'DIAMBIL_DRIVER' ||
    st === 'MENUJU JEMPUT' ||
    st === 'MENUJU_JEMPUT' ||
    st === 'SAMPAI DI LOKASI' ||
    st === 'SAMPAI_LOKASI' ||
    st === 'DALAM PERJALANAN' ||
    st === 'DALAM_PERJALANAN';
  const isStatusSelesai = (st: OrderStatus) => st === 'SELESAI';
  const isStatusDitolak = (st: OrderStatus) => st === 'DITOLAK';

  // Metrics Calculation
  const newOrders = orders.filter((o) => isStatusMenungguAdmin(o.status));
  const waitingReadyOrders = newOrders; // Menunggu Ready
  const readyOrders = orders.filter((o) => isStatusReady(o.status));
  const inProgressOrders = orders.filter((o) => isStatusInProgress(o.status));
  const completedOrders = orders.filter((o) => isStatusSelesai(o.status));
  const rejectedOrders = orders.filter((o) => isStatusDitolak(o.status));
  const onlineDrivers = drivers.filter((d) => d.isOnline && d.status === 'DISETUJUI');
  const pendingDrivers = drivers.filter((d) => d.status === 'MENUNGGU VERIFIKASI');

  // Total Omzet
  const totalOmzet = completedOrders.reduce((sum, o) => sum + (o.totalTariff || o.totalFare || 0), 0);

  // Filtered Orders for 'Order' tab
  const filteredOrders = orders.filter((o) => {
    // Filter status
    if (orderFilter === 'MENUNGGU_ADMIN') {
      if (!isStatusMenungguAdmin(o.status)) return false;
    } else if (orderFilter === 'READY') {
      if (!isStatusReady(o.status)) return false;
    } else if (orderFilter === 'IN_PROGRESS') {
      if (!isStatusInProgress(o.status)) return false;
    } else if (orderFilter === 'SELESAI') {
      if (!isStatusSelesai(o.status)) return false;
    } else if (orderFilter === 'DITOLAK') {
      if (!isStatusDitolak(o.status)) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = o.id.toLowerCase().includes(q);
      const matchName = o.customerName.toLowerCase().includes(q);
      const matchPhone = o.customerPhone.includes(q);
      const matchPickup = (o.pickupLocation || o.pickupAddress || '').toLowerCase().includes(q);
      const matchDropoff = (o.dropoffLocation || o.destinationAddress || '').toLowerCase().includes(q);
      if (!matchId && !matchName && !matchPhone && !matchPickup && !matchDropoff) {
        return false;
      }
    }

    return true;
  });

  // Action: Readykan Order
  const handleReadyOrder = (orderId: string) => {
    const success = DB.readyOrder(orderId);
    if (success) {
      setReadySuccessNotice({
        orderId,
        message: 'Order sekarang tersedia untuk Driver Online.',
      });
      // Auto close notice after 6 seconds
      setTimeout(() => {
        setReadySuccessNotice((prev) => (prev?.orderId === orderId ? null : prev));
      }, 6000);

      // Refresh selectedOrder jika sedang terbuka di panel
      const updated = DB.getOrders().find((o) => o.id === orderId);
      if (updated && selectedOrder?.id === orderId) {
        setSelectedOrder(updated);
      }
      onRefresh();
    }
  };

  // Action: Open Reject Confirmation Modal
  const handleOpenRejectModal = (order: Order) => {
    setRejectModalOrder(order);
    setRejectReason('Driver sedang tidak tersedia di area ini');
  };

  // Action: Confirm Reject Order
  const handleConfirmRejectOrder = () => {
    if (!rejectModalOrder) return;
    DB.rejectOrder(rejectModalOrder.id, rejectReason);
    const updated = DB.getOrders().find((o) => o.id === rejectModalOrder.id);
    if (updated && selectedOrder?.id === rejectModalOrder.id) {
      setSelectedOrder(updated);
    }
    setRejectModalOrder(null);
    onRefresh();
  };

  // Action: Delete Order
  const handleDeleteOrder = (orderId: string) => {
    if (confirm('Hapus data order ini secara permanen dari daftar?')) {
      DB.deleteOrder(orderId);
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
      onRefresh();
    }
  };

  // Action: Buka Link Peta Google Maps
  const handleOpenMapLink = (url?: string) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Action: Hubungi Customer via WhatsApp
  const handleChatCustomer = (order: Order) => {
    const msg = `Halo Kak ${order.customerName}, kami dari Admin Ojek Olumajang mengenai pesanan #${order.id} (${order.serviceType}).`;
    const waUrl = createCustomerWhatsAppUrl(order.customerPhone, msg);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Action: Save Settings
  const handleSaveTariffSettings = (e: React.FormEvent) => {
    e.preventDefault();
    DB.saveTariffConfig(tariffForm);
    setSaveSuccessMsg('Pengaturan tarif berhasil disimpan!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
    onRefresh();
  };

  // Action: Ubah Password Admin
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdStatus(null);
    if (!pwdForm.newPwd || pwdForm.newPwd.length < 4) {
      setPwdStatus({ type: 'error', msg: 'Password baru minimal 4 karakter.' });
      return;
    }
    if (pwdForm.newPwd !== pwdForm.confirmPwd) {
      setPwdStatus({ type: 'error', msg: 'Konfirmasi password baru tidak sama.' });
      return;
    }

    setIsUpdatingPwd(true);
    try {
      const res = await updateAdminPassword(pwdForm.current, pwdForm.newPwd);
      setIsUpdatingPwd(false);
      if (!res.success) {
        setPwdStatus({ type: 'error', msg: res.error || 'Gagal memperbarui password.' });
      } else {
        setPwdStatus({ type: 'success', msg: 'Password Admin berhasil diperbarui!' });
        setPwdForm({ current: '', newPwd: '', confirmPwd: '' });
        setTimeout(() => setPwdStatus(null), 4000);
      }
    } catch {
      setIsUpdatingPwd(false);
      setPwdStatus({ type: 'error', msg: 'Terjadi kesalahan saat memproses pembaruan password.' });
    }
  };

  const navMenuItems: { tab: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { tab: 'Dashboard', label: 'Dashboard', icon: <Shield className="w-4 h-4" /> },
    {
      tab: 'Order',
      label: 'Order',
      icon: <FileText className="w-4 h-4" />,
      badge: newOrders.length > 0 ? newOrders.length : undefined,
    },
    {
      tab: 'Driver',
      label: 'Driver',
      icon: <Bike className="w-4 h-4" />,
      badge: onlineDrivers.length > 0 ? onlineDrivers.length : undefined,
    },
    {
      tab: 'Pendaftaran',
      label: 'Pendaftaran',
      icon: <UserCheck className="w-4 h-4" />,
      badge: pendingDrivers.length > 0 ? pendingDrivers.length : undefined,
    },
    { tab: 'Warung', label: 'Warung', icon: <Store className="w-4 h-4" /> },
    { tab: 'Promo', label: 'Promo', icon: <Ticket className="w-4 h-4" /> },
    {
      tab: 'SaldoTransaksi',
      label: '💰 Saldo & Transaksi',
      icon: <Wallet className="w-4 h-4 text-emerald-600" />,
    },
    { tab: 'Pengaturan', label: 'Pengaturan', icon: <Settings className="w-4 h-4" /> },
  ];

  const formatOrderTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-24 text-slate-900 select-none">
      {/* ======================================================== */}
      {/* HEADER UTAMA ADMIN SESUAI SPESIFIKASI */}
      {/* ======================================================== */}
      <header className="bg-slate-950 text-white shadow-lg border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md ring-2 ring-emerald-500/30 shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-black tracking-widest text-emerald-400 uppercase">
                OJEK OLUMAJANG
              </div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                PANEL ADMIN
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:block text-right">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Dispatcher Aktif
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                Admin: {adminUsername}
              </span>
            </div>

            {onLogout && (
              <button
                id="btn-admin-logout"
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition border border-slate-700 shadow-xs cursor-pointer"
                title="Keluar dari sesi Admin"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden xs:inline">Keluar</span>
              </button>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* NAVIGASI MENU ADMIN */}
        {/* ======================================================== */}
        <div className="bg-slate-900 border-t border-slate-800/80 overflow-x-auto scrollbar-none">
          <div className="max-w-6xl mx-auto px-4 flex gap-1.5 py-2">
            {navMenuItems.map((item) => {
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.tab}
                  id={`tab-admin-${item.tab.toLowerCase()}`}
                  onClick={() => setActiveTab(item.tab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        isActive ? 'bg-white text-emerald-800' : 'bg-rose-500 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* NOTIFIKASI BANNER: ORDER SIAP (READY) */}
      {/* ======================================================== */}
      {readySuccessNotice && (
        <div className="max-w-6xl mx-auto px-4 pt-4 animate-in slide-in-from-top duration-200">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-600 text-white shadow-lg flex items-start justify-between gap-3 border border-emerald-500">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-700/80 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm flex items-center gap-2">
                  <span>✅ ORDER SIAP</span>
                  <span className="font-mono text-xs bg-emerald-800/80 px-2 py-0.5 rounded-md">
                    #{readySuccessNotice.orderId}
                  </span>
                </h4>
                <p className="text-xs text-emerald-100 mt-0.5">
                  {readySuccessNotice.message}
                </p>
              </div>
            </div>
            <button
              onClick={() => setReadySuccessNotice(null)}
              className="p-1 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-5 space-y-6">
        {/* ======================================================== */}
        {/* TAB 1: DASHBOARD (STATISTIK LENGKAP & QUICK ACTION) */}
        {/* ======================================================== */}
        {activeTab === 'Dashboard' && (
          <div className="space-y-6">
            {/* 6 KARTU STATISTIK SESUAI SPESIFIKASI */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                  Ringkasan Operasional Olumajang
                </h2>
                <span className="text-[11px] text-slate-500 font-medium">
                  WhatsApp Admin: <strong className="font-mono text-emerald-700">{ADMIN_WHATSAPP}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* 1. 🔴 Order Baru */}
                <div
                  onClick={() => {
                    setActiveTab('Order');
                    setOrderFilter('MENUNGGU_ADMIN');
                  }}
                  className="bg-white rounded-2xl p-3.5 border-2 border-rose-200 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-rose-800 font-extrabold flex items-center gap-1">
                      <span>🔴</span> Order Baru
                    </span>
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-black text-rose-600 block">
                      {newOrders.length}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Menunggu Review</span>
                  </div>
                </div>

                {/* 2. 🟡 Menunggu Ready */}
                <div
                  onClick={() => {
                    setActiveTab('Order');
                    setOrderFilter('MENUNGGU_ADMIN');
                  }}
                  className="bg-white rounded-2xl p-3.5 border-2 border-amber-200 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-amber-800 font-extrabold flex items-center gap-1">
                      <span>🟡</span> Menunggu Ready
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-black text-amber-600 block">
                      {waitingReadyOrders.length}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Perlu Ditekan Ready</span>
                  </div>
                </div>

                {/* 3. 🟢 Order Ready */}
                <div
                  onClick={() => {
                    setActiveTab('Order');
                    setOrderFilter('READY');
                  }}
                  className="bg-white rounded-2xl p-3.5 border-2 border-emerald-300 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-emerald-800 font-extrabold flex items-center gap-1">
                      <span>🟢</span> Order Ready
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-black text-emerald-600 block">
                      {readyOrders.length}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Menunggu Driver</span>
                  </div>
                </div>

                {/* 4. 🔵 Order Sedang Berjalan */}
                <div
                  onClick={() => {
                    setActiveTab('Order');
                    setOrderFilter('IN_PROGRESS');
                  }}
                  className="bg-white rounded-2xl p-3.5 border-2 border-sky-200 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-sky-800 font-extrabold flex items-center gap-1">
                      <span>🔵</span> Sedang Berjalan
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-black text-sky-600 block">
                      {inProgressOrders.length}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Driver Di Jalan</span>
                  </div>
                </div>

                {/* 5. ✅ Order Selesai */}
                <div
                  onClick={() => {
                    setActiveTab('Order');
                    setOrderFilter('SELESAI');
                  }}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-700 font-extrabold flex items-center gap-1">
                      <span>✅</span> Order Selesai
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-black text-slate-800 block">
                      {completedOrders.length}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold block truncate">
                      {formatRupiah(totalOmzet)}
                    </span>
                  </div>
                </div>

                {/* 6. 🛵 Driver Online */}
                <div
                  onClick={() => setActiveTab('Driver')}
                  className="bg-white rounded-2xl p-3.5 border-2 border-emerald-200 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-emerald-900 font-extrabold flex items-center gap-1">
                      <span>🛵</span> Driver Online
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-black text-emerald-700 block">
                      {onlineDrivers.length}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Siap Ambil Order</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SEKSI QUICK ACTION: ORDER MENUNGGU ADMIN */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                      Order Baru Masuk ({newOrders.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Periksa dan tentukan order menjadi <strong>READY</strong> atau <strong>DITOLAK</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('Order');
                    setOrderFilter('MENUNGGU_ADMIN');
                  }}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-bold self-start sm:self-auto flex items-center gap-1 cursor-pointer"
                >
                  <span>Lihat Semua Order</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {newOrders.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs space-y-1 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                  <p className="font-bold text-slate-600">Tidak ada order baru yang menunggu.</p>
                  <p className="text-[11px]">
                    Semua pesanan sudah di-Readykan atau belum ada order masuk dari Customer.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {newOrders.map((ord) => renderOrderCard(ord))}
                </div>
              )}
            </div>

            {/* SEKSI QUICK ACTION: ORDER READY AKTIF */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                    Order Berstatus READY ({readyOrders.length})
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('Order');
                    setOrderFilter('READY');
                  }}
                  className="text-xs text-emerald-700 hover:underline font-bold cursor-pointer"
                >
                  Lihat Order Ready ➔
                </button>
              </div>

              {readyOrders.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                  Belum ada order dengan status READY.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {readyOrders.map((ord) => renderOrderReadyCard(ord))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: ORDER (DAFTAR SEMUA ORDER SESUAI SPESIFIKASI) */}
        {/* ======================================================== */}
        {activeTab === 'Order' && (
          <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xs border border-slate-200/80 space-y-5">
            {/* Header & Filter Controls */}
            <div className="space-y-3 border-b border-slate-100 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    Daftar Manajemen Order
                  </h2>
                  <p className="text-xs text-slate-500">
                    Semua pesanan O-RIDE dari Customer masuk dan dikelola di sini.
                  </p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari ID, nama, nomor WA..."
                    className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Status Filter Chips */}
              <div className="flex flex-wrap gap-1.5 text-xs pt-1">
                {[
                  { key: 'ALL', label: `Semua (${orders.length})` },
                  { key: 'MENUNGGU_ADMIN', label: `🔴 Menunggu Admin (${newOrders.length})` },
                  { key: 'READY', label: `🟢 Ready (${readyOrders.length})` },
                  { key: 'IN_PROGRESS', label: `🔵 Berjalan (${inProgressOrders.length})` },
                  { key: 'SELESAI', label: `✅ Selesai (${completedOrders.length})` },
                  { key: 'DITOLAK', label: `⛔ Ditolak (${rejectedOrders.length})` },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setOrderFilter(item.key)}
                    className={`px-3 py-1.5 rounded-xl font-extrabold text-[11px] transition cursor-pointer ${
                      orderFilter === item.key
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List Order Cards */}
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-600">Tidak ada order yang sesuai kriteria.</p>
                <p className="text-[11px] text-slate-400">
                  Coba ganti filter status atau periksa kembali kata kunci pencarian.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredOrders.map((ord) => {
                  if (isStatusReady(ord.status)) {
                    return renderOrderReadyCard(ord);
                  }
                  return renderOrderCard(ord);
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: DRIVER */}
        {/* ======================================================== */}
        {activeTab === 'Driver' && (
          <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xs border border-slate-200/80 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Mitra Driver Ojek Olumajang
                </h2>
                <p className="text-xs text-slate-500">
                  Pantau driver online, ketersediaan armada, dan data operasional.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                {onlineDrivers.length} Online
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {drivers.map((drv) => (
                <div
                  key={drv.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={drv.avatarUrl}
                        alt={drv.fullName}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-500/50 shrink-0"
                      />
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm leading-tight">
                          {drv.fullName}
                        </h4>
                        <span className="font-mono text-[11px] text-slate-500 block">
                          {drv.plateNumber} &bull; {drv.vehicleModel}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        drv.isOnline && drv.status === 'DISETUJUI'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {drv.isOnline ? '● Online' : '○ Offline'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 text-[11px] text-slate-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Wilayah:</span>
                      <strong className="text-slate-800">{drv.addressArea}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Rating:</span>
                      <strong className="text-amber-600">⭐ {drv.ratingAvg} ({drv.ratingCount})</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Order Selesai:</span>
                      <strong className="text-emerald-700">{drv.completedOrdersCount} trip</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={createCustomerWhatsAppUrl(drv.whatsapp, 'Halo Driver Olumajang')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Driver</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: PENDAFTARAN (PLACEHOLDER RAPI) */}
        {/* ======================================================== */}
        {activeTab === 'Pendaftaran' && (
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-black">Pendaftaran Mitra Driver Baru</h2>
            </div>
            <p className="text-xs text-slate-500">
              Modul verifikasi berkas KTP, SIM, STNK, dan aktivasi akun driver baru Kabupaten Lumajang.
            </p>
            {pendingDrivers.length > 0 ? (
              <div className="space-y-3 pt-2">
                {pendingDrivers.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{p.fullName}</h4>
                      <p className="text-slate-600 text-xs">
                        {p.whatsapp} &bull; {p.vehicleModel} ({p.plateNumber})
                      </p>
                      <p className="text-slate-500 text-[11px] mt-1">{p.addressArea}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          DB.approveDriver(p.id);
                          onRefresh();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs"
                      >
                        Setujui Mitra
                      </button>
                      <button
                        onClick={() => {
                          DB.rejectDriver(p.id);
                          onRefresh();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-700 font-bold text-xs"
                      >
                        Tolak
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl text-slate-400 text-xs">
                Tidak ada pengajuan pendaftaran driver baru yang tertunda.
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: WARUNG (PLACEHOLDER RAPI) */}
        {/* ======================================================== */}
        {activeTab === 'Warung' && (
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
              <Store className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-black">Manajemen Mitra Warung &amp; Kuliner</h2>
            </div>
            <p className="text-xs text-slate-500">
              Katalog merchant lokal O-FOOD &amp; MARKET se-Kabupaten Lumajang (Tahap Lanjutan).
            </p>
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500 space-y-2">
              <p className="font-bold text-slate-700">Modul Warung Aktif untuk Tahap Berikutnya</p>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                Merchant lokal Lumajang dapat didaftarkan untuk pesanan O-FOOD dan MARKET setelah alur O-RIDE Driver selesai.
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: PROMO (PLACEHOLDER RAPI) */}
        {/* ======================================================== */}
        {activeTab === 'Promo' && (
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
              <Ticket className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-black">Manajemen Kode Promo &amp; Diskon</h2>
            </div>
            <p className="text-xs text-slate-500">
              Buat voucher potongan ongkir untuk pelanggan Ojek Olumajang.
            </p>
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500 space-y-2">
              <p className="font-bold text-slate-700">Kode Promo Aktif Saat Ini</p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-mono font-bold text-xs">
                  LUMAJANGHEBAT (Diskon Rp3.000)
                </span>
                <span className="px-3 py-1 rounded-xl bg-teal-100 text-teal-800 font-mono font-bold text-xs">
                  OLUMAJANG01 (Gratis Ongkir)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 7: PENGATURAN (KONFIGURASI TARIF & WHATSAPP) */}
        {/* ======================================================== */}
        {activeTab === 'Pengaturan' && (
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900">Pengaturan Sistem &amp; Tarif</h2>
              <p className="text-xs text-slate-500">
                Konfigurasi resmi tarif Ojek Olumajang dan nomor kontak darurat Admin.
              </p>
            </div>

            {saveSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveTariffSettings} className="space-y-4 max-w-lg">
              {/* Info WhatsApp Admin Terpusat */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Nomor WhatsApp Admin Terpusat:
                </span>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-base font-black text-emerald-700 font-mono">
                    {ADMIN_WHATSAPP}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Terkonfigurasi Terpusat
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 pt-1">
                  Seluruh tombol WhatsApp pada Customer dan Admin terhubung langsung ke nomor ini.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tarif 0 – 3 Km Pertama (Dasar)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">Rp</span>
                  <input
                    type="number"
                    value={tariffForm.baseFirst3Km}
                    onChange={(e) =>
                      setTariffForm({ ...tariffForm, baseFirst3Km: Number(e.target.value) })
                    }
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tarif per Km setelah 3 Km
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">Rp</span>
                  <input
                    type="number"
                    value={tariffForm.basePerKmAfter3Km}
                    onChange={(e) =>
                      setTariffForm({ ...tariffForm, basePerKmAfter3Km: Number(e.target.value) })
                    }
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Ongkir Area (&gt; 5 Km)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">Rp</span>
                  <input
                    type="number"
                    value={tariffForm.areaSurchargeAmount}
                    onChange={(e) =>
                      setTariffForm({ ...tariffForm, areaSurchargeAmount: Number(e.target.value) })
                    }
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-extrabold text-xs shadow-md hover:bg-slate-800 transition cursor-pointer"
              >
                Simpan Konfigurasi
              </button>
            </form>

            {/* Keamanan & Ganti Password Admin */}
            <div className="pt-6 border-t border-slate-100 space-y-4 max-w-lg">
              <div className="flex items-center gap-2 text-slate-900">
                <Lock className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold">Keamanan &amp; Ganti Password Admin</h3>
              </div>
              <p className="text-[11px] text-slate-500">
                Ubah password akun Administrator untuk keamanan akses operasional Ojek Olumajang.
              </p>

              {pwdStatus && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    pwdStatus.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  <Info className="w-4 h-4 shrink-0" />
                  <span>{pwdStatus.msg}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Password Saat Ini
                  </label>
                  <input
                    type="password"
                    value={pwdForm.current}
                    onChange={(e) => setPwdForm({ ...pwdForm, current: e.target.value })}
                    placeholder="Masukkan password lama"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 font-medium bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Password Baru
                  </label>
                  <input
                    type="password"
                    required
                    value={pwdForm.newPwd}
                    onChange={(e) => setPwdForm({ ...pwdForm, newPwd: e.target.value })}
                    placeholder="Minimal 4 karakter"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 font-medium bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Konfirmasi Password Baru
                  </label>
                  <input
                    type="password"
                    required
                    value={pwdForm.confirmPwd}
                    onChange={(e) => setPwdForm({ ...pwdForm, confirmPwd: e.target.value })}
                    placeholder="Ketik ulang password baru"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 font-medium bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingPwd}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition cursor-pointer disabled:opacity-60"
                >
                  {isUpdatingPwd ? 'Memperbarui...' : 'Perbarui Password Admin'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 8: 💰 SALDO & TRANSAKSI (SISTEM KEUANGAN) */}
        {/* ======================================================== */}
        {activeTab === 'SaldoTransaksi' && (
          <AdminSaldoTransaksi orders={orders} />
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL / DRAWER DETAIL LENGKAP ORDER (DETAIL ORDER) */}
      {/* ======================================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 select-none overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-auto animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Header Detail Modal */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">
                    DETAIL ORDER #{selectedOrder.id}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatOrderTime(selectedOrder.createdAt)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Detail Modal */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-800">
              {/* Status Badge Banner */}
              <div
                className={`p-3 rounded-2xl flex items-center justify-between ${
                  isStatusReady(selectedOrder.status)
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                    : isStatusMenungguAdmin(selectedOrder.status)
                    ? 'bg-amber-50 border border-amber-200 text-amber-900'
                    : isStatusDitolak(selectedOrder.status)
                    ? 'bg-rose-50 border border-rose-200 text-rose-900'
                    : 'bg-sky-50 border border-sky-200 text-sky-900'
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                    Status Pesanan
                  </span>
                  <span className="font-black text-sm">
                    {isStatusMenungguAdmin(selectedOrder.status)
                      ? 'MENUNGGU ADMIN'
                      : isStatusReady(selectedOrder.status)
                      ? '🟢 ORDER READY (MENUNGGU DRIVER)'
                      : selectedOrder.status}
                  </span>
                </div>
                <span className="font-bold text-[11px] px-2.5 py-1 rounded-full bg-white shadow-2xs">
                  {selectedOrder.serviceType}
                </span>
              </div>

              {/* Data Customer & WhatsApp */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Customer</span>
                    <strong className="text-sm text-slate-900">{selectedOrder.customerName}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-bold">WhatsApp</span>
                    <strong className="text-slate-800 font-mono">{selectedOrder.customerPhone}</strong>
                  </div>
                </div>

                {/* Tombol Hubungi Customer */}
                <button
                  onClick={() => handleChatCustomer(selectedOrder)}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>💬 HUBUNGI CUSTOMER</span>
                </button>
              </div>

              {/* Rute & Link Google Maps */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                {/* Lokasi Jemput */}
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">
                        Lokasi Jemput:
                      </span>
                      <p className="font-bold text-slate-900">
                        {selectedOrder.pickupLocation || selectedOrder.pickupAddress}
                      </p>
                    </div>
                  </div>

                  {/* Tombol Buka Lokasi Jemput jika ada link */}
                  {(selectedOrder.pickupMapLink || selectedOrder.shareLocationLink) && (
                    <div className="pl-6 pt-0.5">
                      <button
                        onClick={() =>
                          handleOpenMapLink(
                            selectedOrder.pickupMapLink || selectedOrder.shareLocationLink
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-bold transition cursor-pointer"
                      >
                        <span>📍 BUKA LOKASI JEMPUT</span>
                        <ExternalLink className="w-3 h-3 text-emerald-700" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200" />

                {/* Tujuan */}
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <Navigation className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">
                        Tujuan:
                      </span>
                      <p className="font-bold text-slate-900">
                        {selectedOrder.dropoffLocation || selectedOrder.destinationAddress}
                      </p>
                    </div>
                  </div>

                  {/* Tombol Buka Lokasi Tujuan jika ada link */}
                  {selectedOrder.destinationMapLink && (
                    <div className="pl-6 pt-0.5">
                      <button
                        onClick={() => handleOpenMapLink(selectedOrder.destinationMapLink)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 text-[11px] font-bold transition cursor-pointer"
                      >
                        <span>📍 BUKA LOKASI TUJUAN</span>
                        <ExternalLink className="w-3 h-3 text-rose-700" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Rincian Ongkir & Jarak */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <h4 className="font-extrabold text-slate-900 text-xs border-b border-slate-200 pb-1.5">
                  Rincian Biaya &amp; Jarak
                </h4>
                <div className="space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Estimasi Jarak Perjalanan:</span>
                    <strong className="text-slate-900">{selectedOrder.distanceKm} km</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Ongkir Dasar (0-3 km):</span>
                    <span>{formatRupiah(selectedOrder.baseTariff || selectedOrder.baseFare || 8000)}</span>
                  </div>
                  {(selectedOrder.perKmTariff || 0) > 0 && (
                    <div className="flex justify-between">
                      <span>Tambahan Km ({selectedOrder.distanceKm > 3 ? (selectedOrder.distanceKm - 3).toFixed(1) : 0} km):</span>
                      <span>{formatRupiah(selectedOrder.perKmTariff)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Ongkir Area (&gt; 5 km):</span>
                    <span>{formatRupiah(selectedOrder.areaSurcharge || selectedOrder.areaFee || 0)}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-slate-200 text-slate-900 font-extrabold text-sm">
                    <span>Total Ongkir:</span>
                    <span className="text-emerald-800 font-black">
                      {formatRupiah(selectedOrder.totalTariff || selectedOrder.totalFare || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* 3. PADA DETAIL ORDER: METODE & STATUS PEMBAYARAN */}
              {/* ======================================================== */}
              <div className="p-3.5 rounded-2xl bg-white border-2 border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <span>💳</span> INFORMASI PEMBAYARAN
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Order #{selectedOrder.id}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">
                      METODE PEMBAYARAN:
                    </span>
                    <span className="font-black text-xs sm:text-sm text-slate-900 flex items-center gap-1 mt-0.5">
                      {selectedOrder.paymentMethod === 'SALDO' ? '💰 Saldo' : '💵 Cash'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">
                      STATUS PEMBAYARAN:
                    </span>
                    <span
                      className={`inline-block font-black text-[11px] px-2 py-0.5 rounded-md mt-0.5 ${
                        selectedOrder.paymentStatus === 'DIBAYAR' ||
                        selectedOrder.paymentMethod === 'SALDO'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {selectedOrder.paymentStatus === 'DIBAYAR' ||
                      selectedOrder.paymentMethod === 'SALDO'
                        ? 'DIBAYAR'
                        : 'BELUM_BAYAR'}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] pt-1">
                  {selectedOrder.paymentMethod === 'SALDO' ? (
                    <p className="text-emerald-800 font-medium">
                      ✓ Pembayaran telah <strong>LUNAS DIBAYAR</strong> menggunakan Saldo Pelanggan.
                      Driver tidak perlu menagih ke Customer.
                    </p>
                  ) : (
                    <p className="text-amber-900 font-medium">
                      ⚠️ Status <strong>BELUM_BAYAR</strong>. Driver bertugas menagih uang tunai (Cash)
                      sebesar{' '}
                      <strong>
                        {formatRupiah(selectedOrder.totalTariff || selectedOrder.totalFare || 0)}
                      </strong>{' '}
                      saat pengantaran.
                    </p>
                  )}
                </div>
              </div>

              {/* Catatan Customer */}
              {selectedOrder.notes && (
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                    Catatan dari Customer:
                  </span>
                  <p className="font-medium italic">“{selectedOrder.notes}”</p>
                </div>
              )}

              {/* Data Driver jika sudah diambil */}
              {selectedOrder.driverName && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                    Driver Pengambil:
                  </span>
                  <p className="font-extrabold text-sm">
                    {selectedOrder.driverName} ({selectedOrder.driverPlate})
                  </p>
                </div>
              )}
            </div>

            {/* Footer Modal Actions */}
            <div className="px-5 py-3.5 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              {isStatusMenungguAdmin(selectedOrder.status) ? (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    id="btn-modal-readykan-order"
                    onClick={() => {
                      handleReadyOrder(selectedOrder.id);
                      setSelectedOrder(null);
                    }}
                    className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>🟢 READYKAN ORDER</span>
                  </button>

                  <button
                    id="btn-modal-tolak-order"
                    onClick={() => {
                      handleOpenRejectModal(selectedOrder);
                    }}
                    className="flex-1 sm:flex-none py-2.5 px-3 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-extrabold text-xs transition cursor-pointer"
                  >
                    <span>🔴 TOLAK ORDER</span>
                  </button>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 font-medium">
                  {isStatusReady(selectedOrder.status)
                    ? 'Order siap diambil Driver.'
                    : `Status: ${selectedOrder.status}`}
                </div>
              )}

              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL KONFIRMASI TOLAK ORDER */}
      {/* ======================================================== */}
      {rejectModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">
                  Konfirmasi Tolak Order #{rejectModalOrder.id}?
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pelanggan <strong>{rejectModalOrder.customerName}</strong> ({rejectModalOrder.serviceType}) akan menerima status <strong>DITOLAK</strong>.
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Alasan Penolakan:
              </label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Contoh: Driver belum tersedia di area tersebut"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium bg-slate-50"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                id="btn-confirm-reject-order"
                onClick={handleConfirmRejectOrder}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition cursor-pointer"
              >
                Ya, Tolak Order
              </button>
              <button
                onClick={() => setRejectModalOrder(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ========================================================
  // SUB-RENDER: KARTU ORDER (SESUAI FORMAT SPESIFIKASI TAHAP 3)
  // ========================================================
  function renderOrderCard(ord: Order) {
    const isMenungguAdmin = isStatusMenungguAdmin(ord.status);
    const isDitolak = isStatusDitolak(ord.status);

    return (
      <div
        key={ord.id}
        className={`rounded-3xl p-4 sm:p-5 border-2 transition text-xs space-y-3.5 shadow-2xs ${
          isMenungguAdmin
            ? 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-100'
            : isDitolak
            ? 'bg-rose-50/40 border-rose-200'
            : 'bg-white border-slate-200'
        }`}
      >
        {/* Header Kartu: ORDER #OL-XXXX dan Layanan */}
        <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-xs sm:text-sm text-slate-900">
              ORDER #{ord.id}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xs px-2.5 py-0.5 rounded-full bg-slate-900 text-white flex items-center gap-1">
              <span>🛵</span> {ord.serviceType}
            </span>
          </div>
        </div>

        {/* Info Customer */}
        <div className="space-y-1 text-slate-700">
          <p className="flex items-baseline justify-between">
            <span className="text-slate-500 font-medium">Nama Customer:</span>
            <strong className="text-slate-900 text-xs font-black">{ord.customerName}</strong>
          </p>
          <p className="flex items-baseline justify-between">
            <span className="text-slate-500 font-medium">Nomor WhatsApp:</span>
            <span className="font-mono font-bold text-slate-800">{ord.customerPhone}</span>
          </p>
        </div>

        {/* Lokasi Jemput & Tujuan */}
        <div className="space-y-2 p-3 rounded-2xl bg-white/90 border border-slate-200/80">
          {/* Jemput */}
          <div className="space-y-1">
            <div className="flex items-start gap-1.5">
              <span className="text-sm">📍</span>
              <div className="flex-1">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">
                  Jemput:
                </span>
                <p className="font-bold text-slate-900 leading-snug">
                  {ord.pickupLocation || ord.pickupAddress}
                </p>
              </div>
            </div>
            {/* Link lokasi jemput */}
            {(ord.pickupMapLink || ord.shareLocationLink) && (
              <div className="pl-5">
                <button
                  onClick={() => handleOpenMapLink(ord.pickupMapLink || ord.shareLocationLink)}
                  className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 underline"
                >
                  <span>🔗 Link lokasi jemput</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100" />

          {/* Tujuan */}
          <div className="space-y-1">
            <div className="flex items-start gap-1.5">
              <span className="text-sm">🎯</span>
              <div className="flex-1">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">
                  Tujuan:
                </span>
                <p className="font-bold text-slate-900 leading-snug">
                  {ord.dropoffLocation || ord.destinationAddress}
                </p>
              </div>
            </div>
            {/* Link lokasi tujuan */}
            {ord.destinationMapLink && (
              <div className="pl-5">
                <button
                  onClick={() => handleOpenMapLink(ord.destinationMapLink)}
                  className="text-[10px] font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 underline"
                >
                  <span>🔗 Link lokasi tujuan</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Ongkir & Jarak */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
          <div>
            <span className="text-[10px] text-emerald-800 font-bold block">💰 Ongkir:</span>
            <span className="font-black text-emerald-900 text-sm sm:text-base">
              {formatRupiah(ord.totalTariff || ord.totalFare || 0)}
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-700 font-bold">
            {ord.distanceKm} km
          </span>
        </div>

        {/* Catatan */}
        {ord.notes && (
          <div className="text-slate-600 text-[11px] italic bg-slate-50 p-2 rounded-xl border border-slate-200/60">
            <strong>📝 Catatan:</strong> {ord.notes}
          </div>
        )}

        {/* Metode Pembayaran Badge */}
        <div className="flex items-center justify-between text-[11px] p-2 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-slate-500 font-medium">Pembayaran:</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black px-2 py-0.5 rounded text-[10px] ${
                ord.paymentMethod === 'SALDO'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              {ord.paymentMethod === 'SALDO' ? '💰 Saldo' : '💵 Cash'}
            </span>
            <span
              className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                ord.paymentStatus === 'DIBAYAR' || ord.paymentMethod === 'SALDO'
                  ? 'bg-emerald-200 text-emerald-900'
                  : 'bg-amber-200 text-amber-900'
              }`}
            >
              {ord.paymentStatus === 'DIBAYAR' || ord.paymentMethod === 'SALDO'
                ? 'LUNAS'
                : 'BELUM BAYAR'}
            </span>
          </div>
        </div>

        {/* Status & Waktu Order */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Status:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase inline-block ${
                isMenungguAdmin
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : isDitolak
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              {isMenungguAdmin ? 'MENUNGGU ADMIN' : ord.status}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {formatOrderTime(ord.createdAt)}
          </span>
        </div>

        {/* TOMBOL ADMIN */}
        <div className="pt-2 border-t border-slate-200/70 space-y-2">
          {isMenungguAdmin ? (
            <div className="flex items-center gap-2">
              <button
                id={`btn-readykan-order-${ord.id}`}
                onClick={() => handleReadyOrder(ord.id)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>🟢 READYKAN ORDER</span>
              </button>

              <button
                id={`btn-tolak-order-${ord.id}`}
                onClick={() => handleOpenRejectModal(ord)}
                className="py-2.5 px-3 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-extrabold text-xs transition cursor-pointer"
              >
                <span>🔴 TOLAK ORDER</span>
              </button>
            </div>
          ) : null}

          {/* Secondary Action: Buka Detail & Hubungi Customer */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedOrder(ord)}
              className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Detail Order</span>
            </button>
            <button
              onClick={() => handleChatCustomer(ord)}
              className="py-1.5 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
              title="Hubungi Customer via WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Hubungi</span>
            </button>
            <button
              onClick={() => handleDeleteOrder(ord.id)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              title="Hapus Order"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // SUB-RENDER: KARTU ORDER READY (SESUAI SPESIFIKASI TAHAP 3)
  // Tampilkan:
  // 🟢 ORDER READY
  // Customer
  // Lokasi Jemput
  // Tujuan
  // Ongkir
  // Status: MENUNGGU DRIVER
  // ========================================================
  function renderOrderReadyCard(ord: Order) {
    return (
      <div
        key={ord.id}
        className="rounded-3xl p-4 sm:p-5 border-2 border-emerald-500/80 bg-emerald-50/30 shadow-xs space-y-3.5 text-xs ring-2 ring-emerald-100 transition"
      >
        {/* Header: 🟢 ORDER READY */}
        <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-emerald-900 flex items-center gap-1.5">
              <span>🟢</span> ORDER READY
            </span>
            <span className="font-mono text-[11px] text-slate-500">#{ord.id}</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-700 text-white uppercase tracking-wider animate-pulse">
            MENUNGGU DRIVER
          </span>
        </div>

        {/* Customer */}
        <div className="flex justify-between items-baseline text-slate-800">
          <span className="text-slate-500 font-medium">Customer:</span>
          <strong className="font-black text-slate-900 text-xs">{ord.customerName}</strong>
        </div>

        {/* Lokasi Jemput & Tujuan */}
        <div className="space-y-1.5 p-3 rounded-2xl bg-white border border-emerald-200/70">
          <div className="flex items-start gap-1.5">
            <span className="text-sm">📍</span>
            <div className="flex-1">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">
                Lokasi Jemput:
              </span>
              <p className="font-bold text-slate-900 leading-snug">
                {ord.pickupLocation || ord.pickupAddress}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100" />

          <div className="flex items-start gap-1.5">
            <span className="text-sm">🎯</span>
            <div className="flex-1">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">
                Tujuan:
              </span>
              <p className="font-bold text-slate-900 leading-snug">
                {ord.dropoffLocation || ord.destinationAddress}
              </p>
            </div>
          </div>
        </div>

        {/* Ongkir & Pembayaran */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-emerald-200">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block">Ongkir:</span>
            <span className="font-black text-emerald-900 text-sm sm:text-base">
              {formatRupiah(ord.totalTariff || ord.totalFare || 0)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-medium">
              {ord.paymentMethod === 'SALDO' ? '💰 Lunas (Saldo)' : '💵 Tagih Cash'}
            </span>
            <span className="font-extrabold text-emerald-800 text-xs">
              MENUNGGU DRIVER
            </span>
          </div>
        </div>

        {/* Secondary Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => setSelectedOrder(ord)}
            className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Detail Lengkap</span>
          </button>
          <button
            onClick={() => handleChatCustomer(ord)}
            className="py-2 px-3 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>WA</span>
          </button>
        </div>
      </div>
    );
  }
};
