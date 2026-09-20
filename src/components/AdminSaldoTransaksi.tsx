import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
  Users,
  Store,
  Bike,
  User,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Order, WalletTransaction, WalletRole } from '../types';
import { WalletDB, subscribeToWallet } from '../services/walletService';
import { formatRupiah } from '../services/tariffService';

interface AdminSaldoTransaksiProps {
  orders: Order[];
}

export const AdminSaldoTransaksi: React.FC<AdminSaldoTransaksiProps> = ({ orders }) => {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [wallets, setWallets] = useState(WalletDB.getAllWallets());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | WalletRole>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | string>('ALL');
  const [refreshKey, setRefreshKey] = useState(0);

  const loadData = () => {
    setTransactions(WalletDB.getAllTransactions());
    setWallets(WalletDB.getAllWallets());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToWallet(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [refreshKey]);

  // Combined transactions: wallet transactions + Cash orders recorded as cash transactions
  // This ensures Total Transaksi Cash and Total Transaksi Saldo are comprehensive and accurate
  const cashTransactions: WalletTransaction[] = orders
    .filter((o) => o.paymentMethod === 'CASH')
    .map((o) => ({
      transactionId: `CSH-${o.id}`,
      walletId: 'cash-direct',
      userId: o.customerPhone || 'cust-cash',
      role: 'CUSTOMER' as WalletRole,
      type: 'ORDER_PAYMENT' as const,
      amount: o.totalTariff || o.totalFare || 0,
      description: `Pembayaran Cash Order #${o.id} (${o.serviceType}) - Driver: ${o.driverName || 'Belum Diambil'}`,
      status: o.status === 'SELESAI' ? 'SUCCESS' : 'PENDING',
      referenceId: o.id,
      createdAt: o.createdAt,
    }));

  // Merge all for the comprehensive unified ledger
  const allLedgerItems: Array<
    WalletTransaction & { isCashOrder?: boolean; cashCollector?: string }
  > = [
    ...transactions.map((t) => ({ ...t, isCashOrder: false })),
    ...cashTransactions.map((c) => ({ ...c, isCashOrder: true })),
  ].sort((a, b) => b.createdAt - a.createdAt);

  // 1. Ringkasan Metrics
  // - Total Transaksi Saldo (Rp)
  const totalSaldoTransaksi = transactions
    .filter((t) => t.status === 'SUCCESS')
    .reduce((sum, t) => sum + t.amount, 0);

  // - Total Transaksi Cash (Rp)
  const totalCashTransaksi = orders
    .filter((o) => o.paymentMethod === 'CASH')
    .reduce((sum, o) => sum + (o.totalTariff || o.totalFare || 0), 0);

  // - Total Pendapatan / Transaksi Hari Ini
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const todayTransactions = allLedgerItems.filter((item) => item.createdAt >= startOfToday);
  const totalHariIni = todayTransactions.reduce((sum, item) => sum + item.amount, 0);

  // Filtered ledger
  const filteredLedger = allLedgerItems.filter((item) => {
    if (roleFilter !== 'ALL' && item.role !== roleFilter) return false;
    if (typeFilter === 'CASH' && !item.isCashOrder) return false;
    if (typeFilter === 'SALDO' && item.isCashOrder) return false;
    if (typeFilter === 'TOP_UP' && item.type !== 'TOP_UP') return false;
    if (typeFilter === 'PAYMENT' && item.type !== 'ORDER_PAYMENT') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = item.transactionId.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchUser = item.userId.toLowerCase().includes(q);
      return matchId || matchDesc || matchUser;
    }
    return true;
  });

  const formatDateTime = (ts: number) => {
    return new Date(ts).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadge = (role: WalletRole) => {
    switch (role) {
      case 'CUSTOMER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <User className="w-3 h-3" />
            Customer
          </span>
        );
      case 'DRIVER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Bike className="w-3 h-3" />
            Driver
          </span>
        );
      case 'WARUNG':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Store className="w-3 h-3" />
            Warung
          </span>
        );
      default:
        return null;
    }
  };

  const getTransactionTypeLabel = (item: WalletTransaction & { isCashOrder?: boolean }) => {
    if (item.isCashOrder) {
      return {
        label: 'Terima Cash (Order)',
        color: 'bg-amber-100 text-amber-900 border-amber-300',
        icon: <Banknote className="w-3 h-3 text-amber-700" />,
      };
    }
    switch (item.type) {
      case 'TOP_UP':
        return {
          label: 'Top Up Saldo',
          color: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          icon: <ArrowDownLeft className="w-3 h-3 text-emerald-700" />,
        };
      case 'ORDER_PAYMENT':
        return {
          label: 'Bayar Order (Saldo)',
          color: 'bg-indigo-100 text-indigo-900 border-indigo-300',
          icon: <ArrowUpRight className="w-3 h-3 text-indigo-700" />,
        };
      case 'DRIVER_EARNING':
        return {
          label: 'Pendapatan Driver',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: <DollarSign className="w-3 h-3 text-emerald-600" />,
        };
      case 'WARUNG_EARNING':
        return {
          label: 'Pendapatan Warung',
          color: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: <DollarSign className="w-3 h-3 text-amber-600" />,
        };
      default:
        return {
          label: item.type,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Wallet className="w-3 h-3 text-gray-600" />,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                💰 SALDO &amp; TRANSAKSI (SISTEM KEUANGAN)
              </h2>
              <p className="text-xs text-slate-500">
                Monitoring perputaran Saldo Dompet Digital dan Pembayaran Uang Tunai (Cash).
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            loadData();
            setRefreshKey((k) => k + 1);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. RINGKASAN METRICS */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Transaksi Saldo */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-5 rounded-3xl shadow-sm relative overflow-hidden">
          <div className="relative z-10 space-y-1">
            <div className="flex items-center justify-between text-emerald-100 text-xs font-semibold">
              <span>Total Transaksi Saldo</span>
              <Wallet className="w-5 h-5 opacity-80" />
            </div>
            <div className="text-2xl font-black mt-2">{formatRupiah(totalSaldoTransaksi)}</div>
            <p className="text-[11px] text-emerald-200 pt-1">
              Akumulasi aktivitas saldo dompet digital (Top Up &amp; Bayar Saldo).
            </p>
          </div>
          <div className="absolute -right-4 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Card 2: Total Transaksi Cash */}
        <div className="bg-gradient-to-br from-amber-600 to-amber-700 text-white p-5 rounded-3xl shadow-sm relative overflow-hidden">
          <div className="relative z-10 space-y-1">
            <div className="flex items-center justify-between text-amber-100 text-xs font-semibold">
              <span>Total Transaksi Cash</span>
              <Banknote className="w-5 h-5 opacity-80" />
            </div>
            <div className="text-2xl font-black mt-2">{formatRupiah(totalCashTransaksi)}</div>
            <p className="text-[11px] text-amber-200 pt-1">
              Total pesanan dengan pembayaran uang tunai langsung ke Driver.
            </p>
          </div>
          <div className="absolute -right-4 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Card 3: Total Pendapatan / Transaksi Hari Ini */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-3xl shadow-sm relative overflow-hidden">
          <div className="relative z-10 space-y-1">
            <div className="flex items-center justify-between text-slate-300 text-xs font-semibold">
              <span>Transaksi Hari Ini</span>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-2">
              {formatRupiah(totalHariIni)}
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              {todayTransactions.length} transaksi tercatat pada hari ini ({now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}).
            </p>
          </div>
          <div className="absolute -right-4 -bottom-6 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
        </div>
      </div>

      {/* Saldo Akun Pengguna Terdaftar (Preview Monitor) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-600" />
          <span>Status Saldo Dompet Pengguna (Mock / Local Data)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {wallets.map((w) => (
            <div
              key={w.walletId}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  {getRoleBadge(w.role)}
                  <span className="text-xs font-bold text-slate-700">{w.userId}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">ID: #{w.walletId}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-medium block">Saldo:</span>
                <span className="text-sm font-black text-emerald-800">
                  {formatRupiah(w.balance)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. DAFTAR TRANSAKSI LENGKAP */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-black text-base text-slate-900">
              Daftar Transaksi Lengkap ({filteredLedger.length})
            </h3>
            <p className="text-xs text-slate-500">
              Log mutasi pembayaran Saldo, Uang Tunai Cash, dan Top Up seluruh user.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari ID transaksi, user, ket..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 text-slate-500 font-medium mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter User:</span>
          </div>

          {[
            { key: 'ALL', label: 'Semua User' },
            { key: 'CUSTOMER', label: 'Customer' },
            { key: 'DRIVER', label: 'Driver' },
            { key: 'WARUNG', label: 'Warung' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setRoleFilter(f.key as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                roleFilter === f.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}

          <span className="text-slate-300 mx-1">|</span>

          {[
            { key: 'ALL', label: 'Semua Jenis' },
            { key: 'SALDO', label: 'Metode Saldo' },
            { key: 'CASH', label: 'Metode Cash' },
            { key: 'TOP_UP', label: 'Top Up' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setTypeFilter(f.key)}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                typeFilter === f.key
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Table / List View */}
        {filteredLedger.length === 0 ? (
          <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-600">Tidak ada transaksi ditemukan.</p>
            <p className="text-[11px]">Coba ubah kata kunci pencarian atau filter di atas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">ID Transaksi</th>
                  <th className="py-3 px-3">Tanggal &amp; Waktu</th>
                  <th className="py-3 px-3">User</th>
                  <th className="py-3 px-3">Jenis Transaksi</th>
                  <th className="py-3 px-3">Keterangan</th>
                  <th className="py-3 px-3 text-right">Nominal</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredLedger.map((item) => {
                  const typeInfo = getTransactionTypeLabel(item);
                  const isTopUp = item.type === 'TOP_UP';

                  return (
                    <tr
                      key={item.transactionId}
                      className="hover:bg-slate-50/70 transition text-slate-800"
                    >
                      {/* ID Transaksi */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {item.transactionId}
                      </td>

                      {/* Tanggal & Waktu */}
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {formatDateTime(item.createdAt)}
                      </td>

                      {/* User */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          {getRoleBadge(item.role)}
                          <span className="text-[11px] font-bold text-slate-700">
                            {item.userId}
                          </span>
                        </div>
                      </td>

                      {/* Jenis Transaksi */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold border ${typeInfo.color}`}
                        >
                          {typeInfo.icon}
                          {typeInfo.label}
                        </span>
                      </td>

                      {/* Keterangan */}
                      <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={item.description}>
                        {item.description}
                      </td>

                      {/* Nominal */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span
                          className={`font-black ${
                            isTopUp ? 'text-emerald-700' : 'text-slate-900'
                          }`}
                        >
                          {isTopUp ? `+ ${formatRupiah(item.amount)}` : formatRupiah(item.amount)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {item.status === 'SUCCESS' ? 'Berhasil' : item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
