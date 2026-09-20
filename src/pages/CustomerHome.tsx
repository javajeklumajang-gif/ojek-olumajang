import React, { useState } from 'react';
import {
  Bike,
  UtensilsCrossed,
  ShoppingBag,
  Package,
  MapPin,
  Clock,
  ChevronRight,
  MessageSquare,
  ShieldCheck,
  Star,
  CheckCircle2,
  AlertCircle,
  Phone,
  Compass,
  ArrowRight,
  Sparkles,
  Ticket,
  User,
  ListOrdered,
  RotateCcw,
  XCircle,
  Wallet as WalletIcon,
  PlusCircle,
  History,
  Banknote,
} from 'lucide-react';
import { Order, PromoBanner, ServiceType } from '../types';
import { DB } from '../services/storageService';
import { formatRupiah } from '../services/tariffService';
import { createWhatsAppAdminUrl, WhatsAppOrderParams } from '../services/mapsService';
import { MapPlaceholder } from '../components/MapPlaceholder';
import { WalletDB, subscribeToWallet } from '../services/walletService';
import { WalletModal } from '../components/WalletModal';

interface CustomerHomeProps {
  orders: Order[];
  onOpenOrderModal: (service?: ServiceType) => void;
  onOpenRatingModal: (order: Order) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const PROMOS: PromoBanner[] = [
  {
    id: 'p1',
    title: 'Diskon Spesial Lumajang',
    subtitle: 'Potongan Ongkir Rp3.000 untuk rute Klakah - Kota',
    code: 'LUMAJANGHEBAT',
    discountText: 'DISKON Rp3.000',
    bgColor: 'from-emerald-700 to-emerald-900',
  },
  {
    id: 'p2',
    title: 'Warga Baru Ojek Olumajang',
    subtitle: 'Gratis ongkir perjalanan pertama Anda di dalam kota',
    code: 'OLUMAJANG01',
    discountText: 'GRATIS ONGKIR',
    bgColor: 'from-emerald-800 to-teal-900',
  },
  {
    id: 'p3',
    title: 'Jelajah Wisata Semeru & Senduro',
    subtitle: 'Tarif ramah dan driver terpercaya se-Kabupaten',
    code: 'SEMERUAMAN',
    discountText: 'HEMAT 15%',
    bgColor: 'from-emerald-900 to-slate-900',
  },
];

export const CustomerHome: React.FC<CustomerHomeProps> = ({
  orders,
  onOpenOrderModal,
  onOpenRatingModal,
  activeTab = 'home',
  onTabChange,
}) => {
  const [currentPromoIdx, setCurrentPromoIdx] = useState(0);
  const [showLocationPickerSheet, setShowLocationPickerSheet] = useState(false);
  const [currentAddress, setCurrentAddress] = useState('Alun-Alun Lumajang, Jawa Timur');

  // Wallet State & Subscription
  const [, setWalletVersion] = useState(0);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletModalView, setWalletModalView] = useState<'topup' | 'history'>('topup');

  React.useEffect(() => {
    return subscribeToWallet(() => {
      setWalletVersion((v) => v + 1);
    });
  }, []);

  const customerWallet = WalletDB.getWallet('cust-01', 'CUSTOMER');

  const adminPhone = DB.getAdminWhatsApp();

  // Find active orders (not SELESAI and not DIBATALKAN)
  const activeOrders = orders.filter(
    (o) => o.status !== 'SELESAI' && o.status !== 'DIBATALKAN'
  );
  const completedOrders = orders.filter((o) => o.status === 'SELESAI');
  const pastOrders = orders.filter((o) => o.status === 'SELESAI' || o.status === 'DIBATALKAN');

  const handleWhatsAppAdminQuick = () => {
    const url = createWhatsAppAdminUrl(adminPhone, {
      customerName: 'Pelanggan Lumajang',
      serviceType: 'O-RIDE',
      pickupLocation: currentAddress,
      dropoffLocation: 'Tujuan Saya',
      notes: 'Pesan cepat via WhatsApp Admin',
      estimatedTariff: 'Tarif Resmi Ojek Olumajang',
    });
    window.open(url, '_blank');
  };

  const handleOrderWhatsAppDirect = (order: Order) => {
    const params: WhatsAppOrderParams = {
      orderId: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      serviceType: order.serviceType,
      pickupLocation: order.pickupLocation,
      dropoffLocation: order.dropoffLocation,
      pickupLink: order.shareLocationLink,
      notes: order.notes,
      estimatedTariff: formatRupiah(order.totalTariff),
    };
    const url = createWhatsAppAdminUrl(adminPhone, params);
    window.open(url, '_blank');
  };

  // =========================================================================
  // VIEW 1: TAB PESANAN (Dedicated "Pesanan" Page as requested in Stage 2)
  // =========================================================================
  if (activeTab === 'orders') {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 text-gray-900">
        {/* Top Header */}
        <div className="bg-emerald-700 text-white px-4 py-3.5 shadow-xs sticky top-0 z-10">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-emerald-300" />
              <div>
                <h1 className="text-sm font-extrabold tracking-tight">Pesanan Saya</h1>
                <p className="text-[10px] text-emerald-100">
                  Pantau order aktif & riwayat perjalanan
                </p>
              </div>
            </div>
            <button
              id="btn-pesan-baru-dari-pesanan"
              onClick={() => onOpenOrderModal('O-RIDE')}
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-black shadow-xs transition flex items-center gap-1"
            >
              <Bike className="w-3.5 h-3.5 text-emerald-700" />
              <span>+ Pesan</span>
            </button>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-4 space-y-5">
          {/* =================================================== */}
          {/* BAGIAN 1: ORDER AKTIF */}
          {/* =================================================== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                Order Aktif ({activeOrders.length})
              </h2>
              {activeOrders.length > 0 && (
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                  Sedang Berjalan
                </span>
              )}
            </div>

            {activeOrders.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center shadow-xs border border-gray-100 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <Bike className="w-6 h-6 stroke-1" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-800">Tidak ada pesanan aktif saat ini</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Siap bepergian di Lumajang? Pesan ojek Anda sekarang.
                  </p>
                </div>
                <button
                  id="btn-empty-pesan-sekarang"
                  onClick={() => onOpenOrderModal('O-RIDE')}
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition"
                >
                  PESAN OJEK SEKARANG
                </button>
              </div>
            ) : (
              activeOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border-2 border-emerald-500 space-y-3"
                >
                  {/* Nomor Order & Status */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                    <div>
                      <span className="font-mono text-xs font-black text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">
                        #{order.id}
                      </span>
                      <span className="ml-2 font-bold text-xs text-gray-800">
                        {order.serviceType}
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        order.status === 'MENUNGGU ADMIN'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : order.status === 'READY'
                          ? 'bg-blue-100 text-blue-900 border border-blue-300'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}
                    >
                      {order.status === 'MENUNGGU ADMIN' ? '🟡 Menunggu Admin' : order.status}
                    </span>
                  </div>

                  {/* Status Banner Text */}
                  <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200/80 text-xs text-amber-900 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span className="font-medium text-[11px]">
                      {order.status === 'MENUNGGU ADMIN'
                        ? 'Pesanan Anda sedang menunggu Admin untuk menyiapkan order.'
                        : order.status === 'READY'
                        ? 'Order sudah disiapkan oleh Admin, menunggu driver terdekat mengambil.'
                        : 'Driver sedang dalam perjalanan melayani pesanan Anda.'}
                    </span>
                  </div>

                  {/* Lokasi Jemput & Tujuan */}
                  <div className="space-y-2 text-xs bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 mt-1 shrink-0" />
                      <div>
                        <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                          Lokasi Jemput:
                        </span>
                        <span className="font-bold text-gray-900">{order.pickupLocation}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-600 mt-1 shrink-0" />
                      <div>
                        <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                          Tujuan:
                        </span>
                        <span className="font-bold text-gray-900">{order.dropoffLocation}</span>
                      </div>
                    </div>

                    {order.notes && (
                      <div className="pt-1 text-[11px] text-gray-600 border-t border-gray-200/60">
                        <span className="font-bold text-gray-500">Catatan:</span> {order.notes}
                      </div>
                    )}
                  </div>

                  {/* Jarak & Ongkir */}
                  <div className="flex items-center justify-between text-xs px-1">
                    <div>
                      <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                        Jarak
                      </span>
                      <span className="font-bold text-gray-800">{order.distanceKm} km</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                        Ongkir
                      </span>
                      <span className="font-black text-emerald-800 text-sm">
                        {formatRupiah(order.totalTariff)}
                      </span>
                      {order.areaSurcharge > 0 && (
                        <span className="block text-[9px] text-amber-700 font-bold">
                          Termasuk Ongkir Area (+{formatRupiah(order.areaSurcharge)})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metode Pembayaran Badge */}
                  <div className="flex items-center justify-between text-xs px-1 pt-2 border-t border-gray-100">
                    <span className="text-[10px] text-gray-500 font-medium">
                      Metode Pembayaran:
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        order.paymentMethod === 'SALDO'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.paymentMethod === 'SALDO'
                        ? '💰 Saldo (DIBAYAR)'
                        : '💵 Cash (Bayar Tunai ke Driver)'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-1 border-t border-gray-100">
                    <button
                      type="button"
                      id={`btn-wa-admin-order-${order.id}`}
                      onClick={() => handleOrderWhatsAppDirect(order)}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-200" />
                      <span>PESAN VIA WHATSAPP ADMIN</span>
                    </button>

                    {order.status === 'MENUNGGU ADMIN' && (
                      <button
                        type="button"
                        onClick={() => DB.updateOrderStatus(order.id, 'DIBATALKAN')}
                        className="w-full py-1.5 text-center text-xs text-rose-600 hover:text-rose-800 hover:underline font-semibold cursor-pointer"
                      >
                        Batalkan Order
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* =================================================== */}
          {/* BAGIAN 2: RIWAYAT ORDER */}
          {/* =================================================== */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                Riwayat Order ({pastOrders.length})
              </h2>
            </div>

            {pastOrders.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center shadow-xs border border-gray-100 text-gray-400">
                <Clock className="w-8 h-8 mx-auto mb-1 text-gray-300 stroke-1" />
                <p className="text-xs">Belum ada riwayat pesanan</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pastOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-xs text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">
                          #{order.id}
                        </span>
                        <span className="font-bold text-gray-800">{order.serviceType}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          order.status === 'SELESAI'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-600 flex justify-between items-center">
                      <span className="truncate max-w-[200px]">
                        {order.pickupLocation} ➔ {order.dropoffLocation}
                      </span>
                      <span className="font-bold text-emerald-800 shrink-0">
                        {formatRupiah(order.totalTariff)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[10px] text-gray-400">
                      <span>
                        {new Date(order.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      {order.status === 'SELESAI' && (
                        <div>
                          {order.rating ? (
                            <span className="flex items-center gap-1 text-amber-500 font-bold">
                              <Star className="w-3 h-3 fill-current" />
                              {order.rating}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onOpenRatingModal(order)}
                              className="text-emerald-700 font-bold hover:underline"
                            >
                              Beri Rating
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: TAB RIWAYAT (Dedicated "Riwayat" View if selected in BottomNav)
  // =========================================================================
  if (activeTab === 'history') {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 text-gray-900">
        <div className="bg-emerald-700 text-white px-4 py-3.5 shadow-xs sticky top-0 z-10">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-300" />
              <div>
                <h1 className="text-sm font-extrabold tracking-tight">Riwayat Perjalanan</h1>
                <p className="text-[10px] text-emerald-100">
                  Daftar seluruh pesanan Anda di Kabupaten Lumajang
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-4 space-y-3">
          {pastOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-xs border border-gray-100 text-gray-400 space-y-2">
              <Clock className="w-10 h-10 mx-auto text-gray-300 stroke-1" />
              <h3 className="text-xs font-bold text-gray-700">Belum ada riwayat pesanan</h3>
              <p className="text-[11px] text-gray-400">
                Pesanan yang selesai atau dibatalkan akan muncul di sini.
              </p>
            </div>
          ) : (
            pastOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs text-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-black text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                      #{order.id}
                    </span>
                    <span className="ml-2 font-bold text-xs text-gray-800">
                      {order.serviceType}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      order.status === 'SELESAI'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="text-[11px] text-gray-600 space-y-1">
                  <div className="flex items-start gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 mt-1 shrink-0" />
                    <span>
                      <strong>Jemput:</strong> {order.pickupLocation}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-600 mt-1 shrink-0" />
                    <span>
                      <strong>Tujuan:</strong> {order.dropoffLocation}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div>
                    <span className="text-[10px] text-gray-400 block">Total Ongkir:</span>
                    <span className="font-black text-emerald-800 text-sm">
                      {formatRupiah(order.totalTariff)}
                    </span>
                  </div>

                  {order.status === 'SELESAI' && (
                    <div>
                      {order.rating ? (
                        <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>Rating {order.rating}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onOpenRatingModal(order)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] transition"
                        >
                          Beri Rating Driver
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: TAB PROFIL (Dedicated "Profil" View)
  // =========================================================================
  if (activeTab === 'profile') {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 text-gray-900">
        <div className="bg-emerald-700 text-white px-4 py-3.5 shadow-xs sticky top-0 z-10">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-300" />
              <div>
                <h1 className="text-sm font-extrabold tracking-tight">Profil Pelanggan</h1>
                <p className="text-[10px] text-emerald-100">Ojek Olumajang Mobile Web App</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-4 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-xl font-black">
              PL
            </div>
            <h3 className="font-extrabold text-sm text-gray-900">Pelanggan Setia Lumajang</h3>
            <p className="text-xs text-gray-500">Kabupaten Lumajang, Jawa Timur</p>
          </div>

          {/* 💰 SALDO SAYA CARD DI PROFIL */}
          <div className="rounded-2xl bg-white border border-emerald-100 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <WalletIcon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wide block">
                    💰 SALDO SAYA
                  </span>
                  <span className="text-xl font-black text-emerald-900 leading-tight block">
                    {formatRupiah(customerWallet.balance)}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-1 rounded-lg">
                Tersedia
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setWalletModalView('topup');
                  setIsWalletModalOpen(true);
                }}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ TOP UP</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setWalletModalView('history');
                  setIsWalletModalOpen(true);
                }}
                className="py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-gray-600" />
                <span>RIWAYAT SALDO</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 space-y-2 text-xs">
            <div className="font-bold text-gray-900 border-b border-gray-100 pb-2">
              Layanan Bantuan & WhatsApp Admin
            </div>
            <p className="text-gray-600 text-[11px]">
              Butuh bantuan seputar pesanan atau pertanyaan tarif? Hubungi WhatsApp Admin resmi:
            </p>
            <button
              onClick={handleWhatsAppAdminQuick}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Hubungi Admin ({adminPhone})</span>
            </button>
          </div>
        </div>

        {/* Modal Wallet di Tab Profil */}
        <WalletModal
          isOpen={isWalletModalOpen}
          onClose={() => setIsWalletModalOpen(false)}
          role="CUSTOMER"
          userId="cust-01"
          defaultView={walletModalView}
        />
      </div>
    );
  }

  // =========================================================================
  // VIEW 4: TAB BERANDA (Default, Fully Preserved Customer Home Page)
  // =========================================================================
  return (
    <div className="min-h-screen bg-gray-50 pb-24 text-gray-900">
      {/* Top Location Bar */}
      <div className="bg-emerald-700 text-white px-4 py-3 shadow-xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-4 h-4 text-emerald-300 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-emerald-200 block leading-none">
                Lokasi Jemput Anda Saat Ini:
              </span>
              <button
                id="btn-current-location-chip"
                onClick={() => setShowLocationPickerSheet(true)}
                className="text-xs font-bold truncate text-left hover:underline flex items-center gap-1"
              >
                <span className="truncate">{currentAddress}</span>
                <ChevronRight className="w-3 h-3 text-emerald-300 shrink-0" />
              </button>
            </div>
          </div>
          <button
            id="btn-quick-wa-header"
            onClick={handleWhatsAppAdminQuick}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-emerald-100 text-[11px] font-bold border border-emerald-600 shadow-2xs transition"
          >
            <MessageSquare className="w-3 h-3 text-emerald-300" />
            <span>WA Admin</span>
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* 💰 SALDO SAYA CARD DI BERANDA */}
        <div className="rounded-2xl bg-white border border-emerald-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <WalletIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                  💰 SALDO SAYA
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-black text-gray-900 leading-tight">
                    {formatRupiah(customerWallet.balance)}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded">
                    Tersedia
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                id="btn-customer-topup-saldo"
                type="button"
                onClick={() => {
                  setWalletModalView('topup');
                  setIsWalletModalOpen(true);
                }}
                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-2xs transition flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ TOP UP</span>
              </button>
              <button
                id="btn-customer-riwayat-saldo"
                type="button"
                onClick={() => {
                  setWalletModalView('history');
                  setIsWalletModalOpen(true);
                }}
                className="py-2 px-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <History className="w-3.5 h-3.5 text-gray-500" />
                <span>RIWAYAT</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dual Primary Call-To-Action Banner */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-4 shadow-md space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-200 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3 text-emerald-300" /> Cepat &amp; Amanah
              </span>
              <h2 className="text-lg font-black tracking-tight">OJEK OLUMAJANG</h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                Tarif resmi mulai Rp8.000. Pengemudi lokal beretika tinggi.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              id="btn-hero-pesan-ojek"
              onClick={() => onOpenOrderModal('O-RIDE')}
              className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
            >
              <Bike className="w-4 h-4 text-emerald-700" />
              <span>PESAN OJEK SEKARANG</span>
            </button>

            <button
              id="btn-hero-order-wa"
              onClick={handleWhatsAppAdminQuick}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-900/80 hover:bg-emerald-900 text-emerald-50 font-bold text-xs border border-emerald-500/60 shadow-xs transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-emerald-300" />
              <span>PESAN VIA WHATSAPP ADMIN</span>
            </button>
          </div>
        </div>

        {/* 4 Main Services Grid (O-RIDE, O-FOOD, MARKET, O-SEND) */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Layanan Unggulan
            </h3>
            <span className="text-[10px] text-emerald-700 font-semibold">Kab. Lumajang</span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            {/* O-RIDE */}
            <button
              id="btn-service-oride"
              onClick={() => onOpenOrderModal('O-RIDE')}
              className="group flex flex-col items-center p-2 rounded-xl hover:bg-emerald-50 transition cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 group-hover:bg-emerald-600 group-hover:text-white text-emerald-700 flex items-center justify-center shadow-xs transition mb-1.5">
                <Bike className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-gray-900 group-hover:text-emerald-700">
                O-RIDE
              </span>
              <span className="text-[9px] text-gray-400 leading-tight mt-0.5">Ojek Motor</span>
            </button>

            {/* O-FOOD */}
            <button
              id="btn-service-ofood"
              onClick={() => onOpenOrderModal('O-FOOD')}
              className="group flex flex-col items-center p-2 rounded-xl hover:bg-emerald-50 transition cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 group-hover:bg-amber-600 group-hover:text-white text-amber-700 flex items-center justify-center shadow-xs transition mb-1.5">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-gray-900 group-hover:text-emerald-700">
                O-FOOD
              </span>
              <span className="text-[9px] text-gray-400 leading-tight mt-0.5">Kuliner Sedap</span>
            </button>

            {/* MARKET */}
            <button
              id="btn-service-market"
              onClick={() => onOpenOrderModal('MARKET')}
              className="group flex flex-col items-center p-2 rounded-xl hover:bg-emerald-50 transition cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-100 group-hover:bg-blue-600 group-hover:text-white text-blue-700 flex items-center justify-center shadow-xs transition mb-1.5">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-gray-900 group-hover:text-emerald-700">
                MARKET
              </span>
              <span className="text-[9px] text-gray-400 leading-tight mt-0.5">Warung &amp; Pasar</span>
            </button>

            {/* O-SEND */}
            <button
              id="btn-service-osend"
              onClick={() => onOpenOrderModal('O-SEND')}
              className="group flex flex-col items-center p-2 rounded-xl hover:bg-emerald-50 transition cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-100 group-hover:bg-purple-600 group-hover:text-white text-purple-700 flex items-center justify-center shadow-xs transition mb-1.5">
                <Package className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-gray-900 group-hover:text-emerald-700">
                O-SEND
              </span>
              <span className="text-[9px] text-gray-400 leading-tight mt-0.5">Kirim Kilat</span>
            </button>
          </div>
        </div>

        {/* Promo Banners Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
              <Ticket className="w-3.5 h-3.5 text-emerald-600" /> Promo &amp; Diskon Spesial
            </span>
            <div className="flex gap-1">
              {PROMOS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPromoIdx(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    currentPromoIdx === idx ? 'w-4 bg-emerald-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          <div
            className={`rounded-2xl p-4 bg-gradient-to-r ${PROMOS[currentPromoIdx].bgColor} text-white shadow-sm transition-all duration-300`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold tracking-wider">
                  {PROMOS[currentPromoIdx].discountText}
                </span>
                <h4 className="text-sm font-bold mt-1">{PROMOS[currentPromoIdx].title}</h4>
                <p className="text-[11px] text-white/80 mt-0.5">{PROMOS[currentPromoIdx].subtitle}</p>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-white/70 block">KODE PROMO:</span>
                <span className="font-mono text-xs font-black bg-white/20 px-2 py-1 rounded-md">
                  {PROMOS[currentPromoIdx].code}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Order Card (If Any on Beranda) */}
        {activeOrders.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Pesanan Anda Sedang Berjalan ({activeOrders.length})
              </h3>
              {onTabChange && (
                <button
                  onClick={() => onTabChange('orders')}
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                >
                  <span>Buka Pesanan</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {activeOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-4 shadow-sm border-2 border-emerald-500/80 space-y-3"
              >
                {/* Order Status Header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <div>
                    <span className="text-[10px] text-gray-400 font-mono">ID #{order.id}</span>
                    <span className="ml-2 font-bold text-xs text-gray-900">{order.serviceType}</span>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                      order.status === 'READY'
                        ? 'bg-blue-100 text-blue-800 animate-pulse'
                        : order.status === 'MENUNGGU ADMIN'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {order.status === 'MENUNGGU ADMIN' ? '🟡 Menunggu Admin' : order.status}
                  </span>
                </div>

                {/* Locations */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 mt-1 shrink-0" />
                    <div>
                      <span className="text-[10px] text-gray-400 block">Jemput:</span>
                      <span className="font-semibold text-gray-900">{order.pickupLocation}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-600 mt-1 shrink-0" />
                    <div>
                      <span className="text-[10px] text-gray-400 block">Tujuan:</span>
                      <span className="font-semibold text-gray-900">{order.dropoffLocation}</span>
                    </div>
                  </div>
                </div>

                {/* Driver Info If Taken */}
                {order.driverId ? (
                  <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={
                          order.driverAvatar ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                        }
                        alt="Driver"
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500"
                      />
                      <div>
                        <div className="font-bold text-xs text-gray-900">{order.driverName}</div>
                        <div className="text-[11px] text-emerald-800 font-semibold">
                          {order.driverPlate}
                        </div>
                      </div>
                    </div>
                    {order.driverPhone && (
                      <a
                        href={`https://wa.me/62${order.driverPhone.replace(/\D/g, '').replace(/^0/, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Hubungi</span>
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      {order.status === 'MENUNGGU ADMIN'
                        ? 'Pesanan Anda sedang menunggu Admin untuk menyiapkan order.'
                        : 'Order siap, menunggu mitra pengemudi terdekat mengambil.'}
                    </span>
                  </div>
                )}

                {/* Tariff & Actions */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 block">Total Ongkir:</span>
                    <span className="font-black text-emerald-800 text-sm">
                      {formatRupiah(order.totalTariff)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOrderWhatsAppDirect(order)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>WA Admin</span>
                    </button>
                    {order.status === 'MENUNGGU ADMIN' && (
                      <button
                        onClick={() => DB.updateOrderStatus(order.id, 'DIBATALKAN')}
                        className="text-xs text-rose-600 hover:underline font-semibold"
                      >
                        Batalkan
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order History / Completed Orders on Beranda */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              Riwayat Perjalanan Selesai
            </h3>
            <span className="text-[11px] text-gray-400">{completedOrders.length} Order</span>
          </div>

          {completedOrders.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <Bike className="w-8 h-8 mx-auto mb-1 text-gray-300 stroke-1" />
              <p className="text-xs">Belum ada riwayat pesanan selesai</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {completedOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="p-3 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-gray-50 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{order.serviceType}</span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-600 flex justify-between">
                    <span className="truncate max-w-[200px]">
                      {order.pickupLocation} ➔ {order.dropoffLocation}
                    </span>
                    <span className="font-bold text-emerald-800 shrink-0">
                      {formatRupiah(order.totalTariff)}
                    </span>
                  </div>

                  {/* Rating Section */}
                  <div className="pt-1 border-t border-gray-200/60 flex items-center justify-between">
                    {order.rating ? (
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>Bintang {order.rating}</span>
                        {order.review && (
                          <span className="text-gray-400 font-normal text-[10px] ml-1 truncate max-w-[140px]">
                            “{order.review}”
                          </span>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => onOpenRatingModal(order)}
                        className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-100/70 px-2 py-1 rounded-md cursor-pointer"
                      >
                        <Star className="w-3 h-3 text-emerald-700" />
                        <span>Beri Rating Driver</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Location Picker Sheet (Modal) */}
      {showLocationPickerSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-2xs p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h4 className="font-bold text-sm text-gray-900">Pilih Lokasi di Lumajang</h4>
              <button
                onClick={() => setShowLocationPickerSheet(false)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                Tutup
              </button>
            </div>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              <button
                onClick={() => {
                  setCurrentAddress('Alun-Alun Lumajang (Pusat Kota)');
                  setShowLocationPickerSheet(false);
                }}
                className="w-full text-left p-3 rounded-xl border border-gray-200 hover:bg-emerald-50 text-xs font-medium"
              >
                📍 Alun-Alun Lumajang (Pusat Kota)
              </button>
              <button
                onClick={() => {
                  setCurrentAddress('Stasiun Kereta Api Klakah, Lumajang');
                  setShowLocationPickerSheet(false);
                }}
                className="w-full text-left p-3 rounded-xl border border-gray-200 hover:bg-emerald-50 text-xs font-medium"
              >
                📍 Stasiun Kereta Api Klakah
              </button>
              <button
                onClick={() => {
                  setCurrentAddress('RSUD dr. Haryoto Lumajang');
                  setShowLocationPickerSheet(false);
                }}
                className="w-full text-left p-3 rounded-xl border border-gray-200 hover:bg-emerald-50 text-xs font-medium"
              >
                📍 RSUD dr. Haryoto Lumajang
              </button>
              <button
                onClick={() => {
                  setCurrentAddress('Pasar Baru Serasi Lumajang');
                  setShowLocationPickerSheet(false);
                }}
                className="w-full text-left p-3 rounded-xl border border-gray-200 hover:bg-emerald-50 text-xs font-medium"
              >
                📍 Pasar Baru Serasi Lumajang
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Wallet (Top Up & Riwayat Saldo) */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        role="CUSTOMER"
        userId="cust-01"
        defaultView={walletModalView}
      />
    </div>
  );
};
