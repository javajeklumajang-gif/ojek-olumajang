import React, { useState, useEffect } from 'react';
import {
  Store,
  Power,
  Plus,
  Clock,
  CheckCircle,
  ShoppingBag,
  UtensilsCrossed,
  Tag,
  AlertCircle,
  Wallet as WalletIcon,
  PlusCircle,
  History,
  Bike,
  CheckCircle2,
  Banknote,
  Send,
  X,
  TrendingUp,
} from 'lucide-react';
import { formatRupiah } from '../services/tariffService';
import { WalletDB, subscribeToWallet } from '../services/walletService';
import { WalletModal } from '../components/WalletModal';
import { DB } from '../services/storageService';
import { PaymentMethod, PaymentStatus } from '../types';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  isAvailable: boolean;
  image: string;
}

const INITIAL_MENU: MenuItem[] = [
  {
    id: 'm1',
    name: 'Rawon Daging Khas Lumajang',
    category: 'Makanan',
    price: 22000,
    isAvailable: true,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'm2',
    name: 'Soto Daging Koyor Senduro',
    category: 'Makanan',
    price: 18000,
    isAvailable: true,
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'm3',
    name: 'Keripik Pisang Pasak Lumajang (Pouch 250gr)',
    category: 'Oleh-oleh',
    price: 15000,
    isAvailable: true,
    image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'm4',
    name: 'Es Sinom Asli & Segar',
    category: 'Minuman',
    price: 6000,
    isAvailable: true,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=200&auto=format&fit=crop&q=80',
  },
];

export const WarungMarketView: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [menuList, setMenuList] = useState<MenuItem[]>(INITIAL_MENU);
  const [activeTab, setActiveTab] = useState<'katalog' | 'pesanan' | 'saldo'>('katalog');

  // Wallet Warung State
  const [, setWalletVersion] = useState(0);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletModalView, setWalletModalView] = useState<'topup' | 'history'>('topup');
  const [showSalesModal, setShowSalesModal] = useState(false);

  // Dispatch Ojek delivery modal
  const [showOjekModal, setShowOjekModal] = useState(false);
  const [ojekPaymentMethod, setOjekPaymentMethod] = useState<PaymentMethod>('SALDO');
  const [ojekFare] = useState(8000);
  const [ojekSuccessMsg, setOjekSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    return subscribeToWallet(() => {
      setWalletVersion((v) => v + 1);
    });
  }, []);

  const warungWallet = WalletDB.getWallet('wrg-01', 'WARUNG');

  const toggleProduct = (id: string) => {
    setMenuList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isAvailable: !item.isAvailable } : item
      )
    );
  };

  const handleOrderOjekDelivery = () => {
    if (ojekPaymentMethod === 'SALDO') {
      const payRes = WalletDB.payWithWallet(
        'wrg-01',
        'WARUNG',
        ojekFare,
        'Ongkir Ojek Pengantaran Pesanan #OF-891'
      );
      if (!payRes.success) {
        alert(payRes.error || 'Saldo Warung tidak cukup. Silakan pilih Cash atau Top Up.');
        return;
      }
    }

    // Buat order ojek pengantaran di storage
    DB.createOrder({
      customerName: 'Siti Rahma (via Warung Bu Darmi)',
      customerPhone: '081399887766',
      serviceType: 'O-FOOD',
      pickupLocation: 'Warung & Kuliner Bu Darmi Lumajang',
      dropoffLocation: 'Jl. Suwandak No. 14 Lumajang',
      distanceKm: 2.3,
      baseTariff: 8000,
      perKmTariff: 0,
      areaSurcharge: 0,
      totalTariff: ojekFare,
      totalFare: ojekFare,
      notes: 'Antar pesanan 2x Rawon dan 2x Es Sinom #OF-891',
      paymentMethod: ojekPaymentMethod,
      paymentStatus: ojekPaymentMethod === 'SALDO' ? 'DIBAYAR' : 'BELUM_BAYAR',
    });

    setOjekSuccessMsg(
      ojekPaymentMethod === 'SALDO'
        ? 'Ojek berhasil dipesan! Ongkir Rp8.000 dibayar otomatis dari Saldo Warung (DIBAYAR).'
        : 'Ojek berhasil dipesan! Metode CASH: Driver akan menagih tunai Rp8.000 saat jemput/antar.'
    );

    setTimeout(() => {
      setOjekSuccessMsg(null);
      setShowOjekModal(false);
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 text-gray-900 select-none">
      {/* Header Bar */}
      <div className="bg-emerald-700 text-white px-4 py-4 shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-800 flex items-center justify-center text-white ring-2 ring-emerald-300">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base leading-tight">
                Warung &amp; Kuliner Bu Darmi
              </h2>
              <span className="text-xs text-emerald-100 block">
                Mitra Resmi O-FOOD &amp; MARKET Lumajang
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
              isOpen
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isOpen ? 'BUKA' : 'TUTUP'}</span>
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* ======================================================== */}
        {/* 4. MITRA WARUNG — SALDO WARUNG SECTION */}
        {/* ======================================================== */}
        <div className="rounded-2xl bg-white border border-emerald-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <WalletIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                  💰 SALDO WARUNG
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-gray-900 leading-tight">
                    {formatRupiah(warungWallet.balance)}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded">
                    Tersedia
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setWalletModalView('topup');
                setIsWalletModalOpen(true);
              }}
              className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] shadow-2xs transition flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ TOP UP</span>
            </button>
          </div>

          {/* Ringkasan Penjualan Hari Ini & Bulan Ini */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
            <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-[10px] text-gray-500 font-semibold block">
                Penjualan Hari Ini
              </span>
              <span className="font-extrabold text-sm text-emerald-900 block mt-0.5">
                {formatRupiah(56000)}
              </span>
              <span className="text-[9px] text-emerald-700 font-medium">1 pesanan selesai</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-gray-500 font-semibold block">
                Penjualan Bulan Ini
              </span>
              <span className="font-extrabold text-sm text-slate-800 block mt-0.5">
                {formatRupiah(1420000)}
              </span>
              <span className="text-[9px] text-slate-500 font-medium">38 pesanan selesai</span>
            </div>
          </div>

          {/* Tombol Aksi Saldo */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowSalesModal(true)}
              className="py-2 px-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5 text-gray-600" />
              <span>RIWAYAT PENJUALAN</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setWalletModalView('history');
                setIsWalletModalOpen(true);
              }}
              className="py-2 px-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-gray-600" />
              <span>RIWAYAT SALDO</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl p-1.5 shadow-2xs border border-gray-100 flex gap-1 text-xs">
          <button
            onClick={() => setActiveTab('katalog')}
            className={`flex-1 py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'katalog'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Katalog ({menuList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('pesanan')}
            className={`flex-1 py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'pesanan'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Pesanan Masuk</span>
          </button>
        </div>

        {/* Tab: Katalog Produk */}
        {activeTab === 'katalog' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-gray-700">Daftar Menu &amp; Stok</span>
              <span className="text-[11px] text-emerald-700 font-semibold">
                {isOpen ? '● Menerima Pesanan' : '○ Sedang Tutup'}
              </span>
            </div>

            <div className="space-y-2.5">
              {menuList.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-3 shadow-xs border border-gray-100 flex items-center gap-3 text-xs"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover ring-1 ring-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-gray-400 font-semibold block">
                      {item.category}
                    </span>
                    <h4 className="font-bold text-gray-900 truncate text-sm">{item.name}</h4>
                    <span className="font-extrabold text-emerald-800 text-xs block mt-0.5">
                      {formatRupiah(item.price)}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleProduct(item.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition ${
                      item.isAvailable
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {item.isAvailable ? 'Tersedia' : 'Habis'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Pesanan Masuk */}
        {activeTab === 'pesanan' && (
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900">Antrean Pesanan Masuk O-FOOD</h3>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                1 Menunggu Pengantaran
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-gray-500">ID #OF-891</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                  DIPROSES DAPUR
                </span>
              </div>
              <div className="space-y-1 text-gray-700">
                <p className="font-bold">2x Rawon Daging Khas Lumajang</p>
                <p className="font-bold">2x Es Sinom Asli</p>
                <p className="text-[11px] text-gray-500">Pelanggan: Siti Rahma (081399887766)</p>
                <p className="text-[11px] text-gray-500">Tujuan: Jl. Suwandak No. 14 Lumajang</p>
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-emerald-100">
                <span className="text-[11px] text-gray-500">Total Belanja Pelanggan:</span>
                <span className="font-black text-emerald-800 text-sm">
                  {formatRupiah(56000)}
                </span>
              </div>

              {/* Tombol Pesan Ojek Pengantaran */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowOjekModal(true)}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <Bike className="w-4 h-4" />
                  <span>PESAN OJEK PENGANTAR (RP8.000)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Pesan Ojek Pengantar dengan Pilihan Saldo / Cash */}
      {showOjekModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-5 text-gray-800 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Bike className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-gray-900">Pesan Ojek Pengantar</h3>
                  <span className="text-[10px] text-gray-500">Antar Pesanan #OF-891</span>
                </div>
              </div>
              <button
                onClick={() => setShowOjekModal(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-xs text-gray-700">
              <div className="flex justify-between">
                <span>Rute:</span>
                <span className="font-semibold">Warung Bu Darmi → Jl. Suwandak</span>
              </div>
              <div className="flex justify-between">
                <span>Ongkir Ojek:</span>
                <span className="font-black text-emerald-800">{formatRupiah(ojekFare)}</span>
              </div>
            </div>

            {/* Pilihan Metode Pembayaran Warung */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-900 block">
                Pilih Metode Pembayaran Ongkir:
              </label>

              <div
                onClick={() => setOjekPaymentMethod('SALDO')}
                className={`p-3 rounded-xl border-2 cursor-pointer transition ${
                  ojekPaymentMethod === 'SALDO'
                    ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <WalletIcon className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">💰 Saldo Warung</span>
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        Tersedia: {formatRupiah(warungWallet.balance)}
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    checked={ojekPaymentMethod === 'SALDO'}
                    onChange={() => setOjekPaymentMethod('SALDO')}
                    className="accent-emerald-600 w-4 h-4"
                  />
                </div>
                {ojekPaymentMethod === 'SALDO' && (
                  <p className="text-[10px] text-emerald-800 mt-1.5 pt-1.5 border-t border-emerald-100 font-medium">
                    ✓ Otomatis potong Saldo Warung. Status order: DIBAYAR.
                  </p>
                )}
              </div>

              <div
                onClick={() => setOjekPaymentMethod('CASH')}
                className={`p-3 rounded-xl border-2 cursor-pointer transition ${
                  ojekPaymentMethod === 'CASH'
                    ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-amber-600" />
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">💵 Bayar Cash</span>
                      <span className="text-[10px] text-gray-500 font-medium">
                        Bayar tunai ke driver
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    checked={ojekPaymentMethod === 'CASH'}
                    onChange={() => setOjekPaymentMethod('CASH')}
                    className="accent-emerald-600 w-4 h-4"
                  />
                </div>
                {ojekPaymentMethod === 'CASH' && (
                  <div className="text-[10px] text-amber-900 mt-1.5 pt-1.5 border-t border-amber-100 font-semibold">
                    <span className="inline-block px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold mr-1">
                      💵 BAYAR CASH
                    </span>
                    Saldo tidak dipotong. Status: BELUM_BAYAR.
                  </div>
                )}
              </div>
            </div>

            {ojekSuccessMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{ojekSuccessMsg}</span>
              </div>
            )}

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setShowOjekModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleOrderOjekDelivery}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>PANGGIL DRIVER</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Riwayat Penjualan Warung */}
      {showSalesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-5 text-gray-800 space-y-4 animate-in fade-in zoom-in-95 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-gray-900">Riwayat Penjualan Warung</h3>
              </div>
              <button
                onClick={() => setShowSalesModal(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex justify-between items-center">
                <div>
                  <span className="font-bold text-gray-900 block">Pesanan #OF-891</span>
                  <span className="text-[10px] text-gray-400">Hari ini, 11:30 WIB • 4 item</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-emerald-800 block">{formatRupiah(56000)}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                    SELESAI
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex justify-between items-center">
                <div>
                  <span className="font-bold text-gray-900 block">Pesanan #OF-874</span>
                  <span className="text-[10px] text-gray-400">Kemarin, 19:15 WIB • 2 item</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-emerald-800 block">{formatRupiah(44000)}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                    SELESAI
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex justify-between items-center">
                <div>
                  <span className="font-bold text-gray-900 block">Pesanan #OF-860</span>
                  <span className="text-[10px] text-gray-400">2 hari lalu • 3 item</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-emerald-800 block">{formatRupiah(60000)}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                    SELESAI
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Wallet Warung (Top Up & Riwayat Saldo) */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        role="WARUNG"
        userId="wrg-01"
        defaultView={walletModalView}
      />
    </div>
  );
};
