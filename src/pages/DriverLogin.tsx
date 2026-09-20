import React, { useState } from 'react';
import { Bike, Lock, User, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { DB } from '../services/storageService';
import { authenticateDriver, saveDriverSession } from '../services/authService';
import { Driver } from '../types';

interface DriverLoginProps {
  onLoginSuccess: (driver: Driver) => void;
  onGoToRegister: () => void;
}

export const DriverLogin: React.FC<DriverLoginProps> = ({
  onLoginSuccess,
  onGoToRegister,
}) => {
  const [identifier, setIdentifier] = useState('budi_driver');
  const [password, setPassword] = useState('driver123');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    const drivers = DB.getDrivers();
    const result = await authenticateDriver(identifier, password, drivers);

    setIsLoading(false);
    if (!result.success || !result.driver) {
      setErrorMsg(result.error || 'Login gagal. Silakan coba lagi.');
      return;
    }

    saveDriverSession(result.driver.id, rememberMe);
    onLoginSuccess(result.driver);
  };

  const fillDemoAccount = () => {
    setIdentifier('budi_driver');
    setPassword('driver123');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8 select-none">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Branding */}
        <div className="text-center space-y-1">
          <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto text-white shadow-md">
            <Bike className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight pt-2">
            Portal Mitra Driver
          </h2>
          <p className="text-xs text-gray-500">
            Masuk untuk mengaktifkan status Online &amp; menerima pesanan
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Username atau Nomor WhatsApp
            </label>
            <div className="relative">
              <input
                id="input-driver-login-identifier"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="budi_driver atau 081234567890"
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Kata Sandi (Password)
            </label>
            <div className="relative">
              <input
                id="input-driver-login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Checkbox Ingat Saya */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-gray-700 font-medium">
              <input
                id="checkbox-remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
              />
              <span>Ingat Saya (Simpan Sesi)</span>
            </label>
          </div>

          <button
            id="btn-submit-driver-login"
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 active:scale-98"
          >
            <span>{isLoading ? 'Memverifikasi Sandi...' : 'Masuk Dashboard Driver'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Fill Helper */}
        <div className="pt-2 border-t border-gray-100 text-center">
          <button
            type="button"
            onClick={fillDemoAccount}
            className="text-[11px] text-emerald-700 hover:underline font-semibold bg-emerald-50 px-3 py-1.5 rounded-full"
          >
            👉 Gunakan Akun Demo: budi_driver / driver123
          </button>
        </div>

        {/* Registration CTA */}
        <div className="text-center pt-2">
          <p className="text-xs text-gray-500">Belum punya akun mitra?</p>
          <button
            id="btn-go-to-driver-register"
            onClick={onGoToRegister}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline mt-1"
          >
            Daftar Jadi Mitra Pengemudi Olumajang
          </button>
        </div>
      </div>
    </div>
  );
};
