import React, { useState } from 'react';
import { Star, X, Check, Heart, ShieldCheck } from 'lucide-react';
import { Order } from '../types';
import { DB } from '../services/storageService';

interface RatingModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onRated?: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  order,
  isOpen,
  onClose,
  onRated,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen || !order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    DB.rateOrder(order.id, rating, comment.trim() || undefined);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onRated?.();
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-gray-800 animate-in fade-in zoom-in-95 duration-150">
        {submitted ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Terima Kasih!</h3>
            <p className="text-xs text-gray-500 mt-1">
              Penilaian Anda sangat berharga bagi peningkatan mutu Mitra Ojek Olumajang.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Beri Nilai Mitra Driver</h3>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Driver Summary */}
            <div className="mt-4 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center gap-3">
              <img
                src={
                  order.driverAvatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                }
                alt={order.driverName || 'Driver'}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500"
              />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm text-gray-900 truncate">
                  {order.driverName || 'Mitra Ojek'}
                </div>
                <div className="text-xs text-emerald-700 font-medium">
                  {order.driverPlate || 'Plat Kendaraan'}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">Pesanan #{order.id}</div>
              </div>
            </div>

            {/* Star Rating Select */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="text-center">
                <label className="text-xs font-semibold text-gray-600 block mb-2">
                  Bagaimana pelayanan perjalanan Anda?
                </label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1.5 transform hover:scale-125 transition-transform"
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            active
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-gray-300 stroke-1'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs font-bold text-emerald-700 mt-2">
                  {rating === 5 && 'Luar Biasa & Sangat Memuaskan'}
                  {rating === 4 && 'Puas & Tepat Waktu'}
                  {rating === 3 && 'Cukup Baik'}
                  {rating === 2 && 'Perlu Peningkatan'}
                  {rating === 1 && 'Kurang Memuaskan'}
                </p>
              </div>

              {/* Optional Comment */}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Ulasan / Komentar Tambahan (Opsional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Ceritakan pengalaman Anda bersama pengemudi kami..."
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Submit Button */}
              <button
                id="btn-submit-rating"
                type="submit"
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 text-sm shadow-md transition"
              >
                Kirim Penilaian Bintang
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
