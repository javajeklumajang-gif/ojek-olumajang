import React, { useState } from 'react';
import { Shield, Lock, User, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { authenticateAdmin, saveAdminSession } from '../services/authService';

interface AdminLoginProps {
  onLoginSuccess: (username: string) => void;
  onCancel?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onCancel }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const result = await authenticateAdmin(username, password);
      setIsLoading(false);

      if (!result.success || !result.username) {
        setErrorMsg(result.error || 'Username atau password salah.');
        return;
      }

      saveAdminSession(result.username, rememberMe);
      onLoginSuccess(result.username);
    } catch {
      setIsLoading(false);
      setErrorMsg('Username atau password salah.');
    }
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-8 select-none bg-slate-50/50">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-200/80 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 shadow-md ring-4 ring-slate-100">
            <Shield className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              ADMIN OJEK OLUMAJANG
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Panel Masuk Administrator &amp; Dispatcher
            </p>
          </div>
        </div>

        {/* Alert Error */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-snug font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Username
            </label>
            <div className="relative">
              <input
                id="input-admin-username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium bg-slate-50/50 focus:bg-white transition"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="input-admin-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password admin"
                autoComplete="current-password"
                className="w-full text-xs pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium bg-slate-50/50 focus:bg-white transition"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Ingat Saya Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
              <input
                id="checkbox-admin-remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span>Ingat Saya</span>
            </label>
          </div>

          {/* Tombol Masuk */}
          <button
            id="btn-admin-login-submit"
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-extrabold text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <span className="animate-pulse">MEMVERIFIKASI...</span>
            ) : (
              <>
                <span>MASUK</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {onCancel && (
          <div className="pt-2 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
            >
              &larr; Kembali ke Pelanggan
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
