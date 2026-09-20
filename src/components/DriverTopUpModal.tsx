import React, { useState, useEffect } from 'react';
import {
  X,
  Wallet,
  ArrowDownLeft,
  CheckCircle2,
  History,
  AlertCircle,
  PlusCircle,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { Wallet as WalletType, WalletTransaction } from '../types';
import { WalletDB, subscribeToWallet } from '../services/walletService';
import { formatRupiah } from '../services/tariffService';
import { getDriverMinBalance } from '../config/constants';

interface DriverTopUpModalProps {
  driverId: string;
  driverName: string;
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'topup' | 'riwayat';
}

const TOPUP_PRESETS = [10000, 20000, 50000, 100000];

export const DriverTopUpModal: React.FC<DriverTopUpModalProps> = ({
  driverId,
  driverName,
  isOpen,
  onClose,
  defaultTab = 'topup',
}) => {
  const [activeTab, setActiveTab] = useState<'topup' | 'riwayat'>(defaultTab);
  const [selectedNominal, setSelectedNominal] = useState<number>(20000);
  const [customNominal, setCustomNominal] = useState<string>('');
  const [wallet, setWallet] = useState<WalletType>(WalletDB.getWallet(driverId, 'DRIVER'));
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const minBalance = getDriverMinBalance();

  const refreshData = () => {
    const w = WalletDB.getWallet(driverId, 'DRIVER');
    setWallet(w);
    setTransactions(WalletDB.getTransactions(driverId, 'DRIVER'));
  };

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      refreshData();
      setSuccessMessage(null);
    }
  }, [isOpen, defaultTab, driverId]);

  useEffect(() => {
    const unsubscribe = subscribeToWallet(() => {
      refreshData();
    });
    return () => unsubscribe();
  }, [driverId]);

  if (!isOpen) return null;

  const handleSelectPreset = (nom: number) => {
    setSelectedNominal(nom);
    setCustomNominal('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setCustomNominal(val);
    if (val) {
      setSelectedNominal(Number(val));
    }
  };

  const handleProcessTopUp = () => {
    const nominal = customNominal ? Number(customNominal) : selectedNominal;
    if (!nominal || nominal < 5000) {
      alert('Minimal isi saldo operasional adalah Rp5.000');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      WalletDB.topUp(
        driverId,
        'DRIVER',
        nominal,
        `Isi Saldo Operasional Driver (Simulasi Mock Preview)`
      );
      setIsProcessing(false);
      setSuccessMessage(`Berhasil mengisi saldo operasional sebesar ${formatRupiah(nominal)}!`);
      refreshData();
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3500);
    }, 400);
  };

  const isBalanceSufficient = wallet.balance >= minBalance;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Wallet className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-black text-base leading-tight">ISI SALDO DRIVER</h3>
              <p className="text-[11px] text-emerald-200">Mitra: {driverName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Saldo Card */}
        <div className="p-4 bg-slate-50 border-b border-slate-200/80">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Saldo Operasional Saat Ini:
              </span>
              <span className="text-xl font-black text-slate-900 mt-0.5 block">
                {formatRupiah(wallet.balance)}
              </span>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase ${
                  isBalanceSufficient
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                }`}
              >
                <span>{isBalanceSufficient ? '🟢' : '🔴'}</span>
                <span>{isBalanceSufficient ? 'SALDO CUKUP' : 'SALDO TIDAK CUKUP'}</span>
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                Batas Minimum: {formatRupiah(minBalance)}
              </span>
            </div>
          </div>

          {!isBalanceSufficient && (
            <div className="mt-2.5 p-2 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-900 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>Saldo kurang dari {formatRupiah(minBalance)}.</strong> Anda tidak dapat
                mengambil order baru sampai saldo diisi kembali.
              </p>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('topup')}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'topup'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ ISI SALDO</span>
          </button>
          <button
            onClick={() => setActiveTab('riwayat')}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'riwayat'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>RIWAYAT SALDO</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {successMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">{successMessage}</span>
            </div>
          )}

          {activeTab === 'topup' ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-extrabold text-slate-800 block mb-2">
                  Pilih Nominal Isi Saldo:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {TOPUP_PRESETS.map((nominal) => {
                    const isSelected = selectedNominal === nominal && !customNominal;
                    return (
                      <button
                        key={nominal}
                        type="button"
                        onClick={() => handleSelectPreset(nominal)}
                        className={`p-3 rounded-2xl border-2 text-left transition flex items-center justify-between ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-black shadow-xs ring-2 ring-emerald-100'
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800 font-bold'
                        }`}
                      >
                        <span className="text-sm">{formatRupiah(nominal)}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Nominal */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Atau Masukkan Nominal Lain:
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="text"
                    value={customNominal}
                    onChange={handleCustomChange}
                    placeholder="Contoh: 75.000"
                    className="w-full text-xs font-bold pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                  />
                </div>
              </div>

              {/* Notice Sesuai Instruksi User */}
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Mode Simulasi Preview</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Fitur pembayaran akan dihubungkan nanti. Saldo akan langsung bertambah secara
                  lokal untuk keperluan pengujian dan demonstrasi sistem.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleProcessTopUp}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-sm shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isProcessing ? (
                  <span>Memproses...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>
                      ISI SALDO SEKARANG (
                      {formatRupiah(customNominal ? Number(customNominal) : selectedNominal)})
                    </span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-100">
                <span>Riwayat Transaksi Saldo Driver</span>
                <span className="font-mono">{transactions.length} Mutasi</span>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs space-y-1 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Clock className="w-7 h-7 mx-auto text-slate-300" />
                  <p className="font-bold text-slate-600">Belum ada riwayat transaksi.</p>
                  <p className="text-[11px]">Setiap pengisian saldo akan dicatat di sini.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div
                      key={tx.transactionId}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          {tx.type === 'TOP_UP' ? (
                            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <History className="w-3.5 h-3.5 text-slate-500" />
                          )}
                          <span>{tx.description}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(tx.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          • ID: #{tx.transactionId}
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-black text-xs ${
                            tx.type === 'TOP_UP' || tx.type === 'DRIVER_EARNING'
                              ? 'text-emerald-700'
                              : 'text-slate-900'
                          }`}
                        >
                          {tx.type === 'TOP_UP' || tx.type === 'DRIVER_EARNING'
                            ? `+ ${formatRupiah(tx.amount)}`
                            : formatRupiah(tx.amount)}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold block mt-0.5">
                          Berhasil
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
