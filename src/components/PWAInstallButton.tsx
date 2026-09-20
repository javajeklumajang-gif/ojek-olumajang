import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {isInstallable && (
        <button
          id="btn-pwa-install-android"
          onClick={install}
          className="flex items-center gap-1.5 rounded-full bg-emerald-800 text-white text-xs font-semibold px-3 py-1.5 shadow-sm hover:bg-emerald-900 transition-colors"
          title="Pasang aplikasi ke layar utama HP"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Pasang Aplikasi</span>
        </button>
      )}

      {isIOS && (
        <button
          id="btn-pwa-install-ios"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-full bg-emerald-800 text-white text-xs font-semibold px-3 py-1.5 shadow-sm hover:bg-emerald-900 transition-colors"
          title="Pasang di iPhone"
        >
          <Share className="w-3.5 h-3.5" />
          <span>Install iOS</span>
        </button>
      )}

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-gray-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Pasang Ojek Olumajang di iOS</h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <p>
                  Ketuk tombol <strong>Bagikan (Share)</strong> di bilah menu bawah Safari.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <p>
                  Geser ke bawah dan pilih <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <p>Buka aplikasi langsung dari layar HP tanpa browser.</p>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-6 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition shadow-sm"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
