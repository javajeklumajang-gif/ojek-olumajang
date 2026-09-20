import React, { useState } from 'react';
import {
  X,
  Wallet as WalletIcon,
  PlusCircle,
  History,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Wallet, WalletRole, WalletTransaction } from '../types';
import { WalletDB } from '../services/walletService';
import { formatRupiah } from '../services/tariffService';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: WalletRole;
  userId?: string;
  defaultView?: 'topup' | 'history';
  onSuccess?: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  role,
  userId = role === 'CUSTOMER' ? 'cust-01' : role === 'WARUNG' ? 'wrg-01' : 'drv-01',
  defaultView = 'topup',
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'topup' | 'history'>(defaultView);
  const [selectedAmount, setSelectedAmount] = useState<number>(50000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [topUpSuccess, setTopUpSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const wallet = WalletDB.getWallet(userId, role);
  const transactions = WalletDB.getTransactions(userId, role);

  const quickAmounts = [10000, 20000, 50000, 100000, 200000];

  const handleTopUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = customAmount ? parseInt(customAmount.replace(/\D/g, ''), 10) : selectedAmount;

    if (!amount || amount < 1000) {
      alert('Nominal Top Up minimal Rp1.000');
      return;
    }

    const note = `Top Up Simulasi Saldo ${role === 'WARUNG' ? 'Warung' : 'Pelanggan'} Preview`;
    WalletDB.topUp(userId, role, amount, note);
    setTopUpSuccess(`Top Up ${formatRupiah(amount)} berhasil ditambahkan ke Saldo Simulasi!`);

    if (onSuccess) onSuccess();

    setTimeout(() => {
      setTopUpSuccess(null);
      setActiveTab('history');
    }, 1200);
  };

  const formatTxDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 select-none overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl flex flex-col my-auto max-h-[90vh] overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150 border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-emerald-600 text-white shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-700/80 flex items-center justify-center">
              <WalletIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-base leading-tight tracking-tight">
                {role === 'WARUNG' ? 'SALDO WARUNG' : role === 'DRIVER' ? 'SALDO DRIVER' : 'SALDO SAYA'}
              </h2>
              <p className="text-[11px] text-emerald-100 font-medium">
                Tersedia: {formatRupiah(wallet.balance)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-emerald-100 hover:text-white hover:bg-emerald-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-100 bg-slate-50 text-xs font-bold p-1 gap-1">
          <button
            onClick={() => setActiveTab('topup')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeTab === 'topup'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Top Up Saldo</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeTab === 'history'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Transaksi</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'topup' ? (
            <div className="space-y-4">
              {/* Card Saldo Sekarang */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-xs">
                <span className="text-[11px] text-emerald-100 uppercase tracking-wider font-semibold block">
                  Saldo Tersedia Saat Ini
                </span>
                <span className="text-2xl font-black mt-1 block">
                  {formatRupiah(wallet.balance)}
                </span>
                <span className="text-[10px] text-emerald-200 mt-0.5 block">
                  Digunakan untuk pembayaran otomatis di Ojek Olumajang
                </span>
              </div>

              {/* Notice Mock Preview */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Simulasi Mock Preview:</strong> Top Up ini bersifat lokal untuk pengujian alur pesanan Ojek Olumajang. Tidak ada potongan atau uang nyata yang ditarik.
                </p>
              </div>

              {topUpSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{topUpSuccess}</span>
                </div>
              )}

              <form onSubmit={handleTopUpSubmit} className="space-y-3">
                <label className="text-xs font-bold text-slate-800 block">
                  Pilih Nominal Top Up
                </label>

                {/* Quick denomination chips */}
                <div className="grid grid-cols-3 gap-2">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amt);
                        setCustomAmount('');
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                        selectedAmount === amt && !customAmount
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      {formatRupiah(amt)}
                    </button>
                  ))}
                </div>

                {/* Custom Amount */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Atau Masukkan Nominal Sendiri:
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Contoh: 75000"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-slate-50/50 focus:bg-white transition"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    TOP UP {formatRupiah(customAmount ? parseInt(customAmount, 10) || selectedAmount : selectedAmount)} (SIMULASI)
                  </span>
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Riwayat Mutasi Saldo</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Total: {transactions.length} transaksi
                </span>
              </div>

              {transactions.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 space-y-2">
                  <History className="w-8 h-8 mx-auto stroke-1" />
                  <p className="text-xs">Belum ada riwayat transaksi saldo</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => {
                    const isCredit = tx.amount > 0;
                    return (
                      <div
                        key={tx.transactionId}
                        className="p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/80 transition flex items-center justify-between text-xs"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              isCredit
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {isCredit ? (
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate">
                              {tx.description}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                              <span>{formatTxDate(tx.createdAt)}</span>
                              <span>•</span>
                              <span className="font-mono">{tx.transactionId}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-2">
                          <span
                            className={`font-black text-xs block ${
                              isCredit ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {isCredit ? '+' : ''}
                            {formatRupiah(tx.amount)}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-slate-100 text-slate-600">
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
