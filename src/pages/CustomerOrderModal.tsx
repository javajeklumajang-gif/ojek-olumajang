import React, { useState } from 'react';
import {
  X,
  MapPin,
  Compass,
  Navigation,
  Link as LinkIcon,
  FileText,
  Send,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Sliders,
  CheckCircle2,
  Clock,
  Bike,
  Wallet as WalletIcon,
  Banknote,
  Sparkles,
} from 'lucide-react';
import { calculateFare, formatRupiah, FareResult } from '../services/tariffService';
import {
  getCurrentGPSLocation,
  createWhatsAppAdminUrl,
  validateMapsShareLink,
  calculateHaversineDistanceKm,
  LUMAJANG_LANDMARKS,
  WhatsAppOrderParams,
} from '../services/mapsService';
import { DB } from '../services/storageService';
import { LocationPoint, Order, ServiceType, PaymentMethod, PaymentStatus } from '../types';
import { MapPlaceholder } from '../components/MapPlaceholder';
import { WalletDB } from '../services/walletService';
import { WalletModal } from '../components/WalletModal';

interface CustomerOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (order: Order) => void;
  onViewOrderDetail?: (order: Order) => void;
  defaultService?: ServiceType;
}

type OrderModalStep = 'form' | 'confirm' | 'success';

export const CustomerOrderModal: React.FC<CustomerOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
  onViewOrderDetail,
  defaultService = 'O-RIDE',
}) => {
  // Step state
  const [step, setStep] = useState<OrderModalStep>('form');

  // Form Fields
  const [customerName, setCustomerName] = useState('Siti Rahmawati');
  const [customerPhone, setCustomerPhone] = useState('081399887766');

  // Pickup fields
  const [pickupLocation, setPickupLocation] = useState('Alun-Alun Lumajang');
  const [pickupShareLink, setPickupShareLink] = useState('');
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number }>({
    lat: -8.1332,
    lng: 113.2248,
  });
  const [activePickupMode, setActivePickupMode] = useState<'gps' | 'map' | 'link' | null>('gps');
  const [showPickupMap, setShowPickupMap] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);

  // Dropoff fields
  const [dropoffLocation, setDropoffLocation] = useState('RSUD dr. Haryoto Lumajang');
  const [dropoffShareLink, setDropoffShareLink] = useState('');
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lng: number }>({
    lat: -8.1384,
    lng: 113.2201,
  });
  const [activeDropoffMode, setActiveDropoffMode] = useState<'gps' | 'map' | 'link' | null>(null);
  const [showDropoffMap, setShowDropoffMap] = useState(false);

  // Notes
  const [notes, setNotes] = useState('');

  // Distance and Fare
  const [distanceKm, setDistanceKm] = useState<number | null>(2.5);
  const [isFareCalculated, setIsFareCalculated] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Metode Pembayaran: SALDO | CASH
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  // Created Order Result for Success Screen
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  const tariffConfig = DB.getTariffConfig();
  const currentDistance = distanceKm ?? 2.5;
  const fareResult: FareResult = calculateFare(currentDistance, tariffConfig);
  const adminWhatsApp = DB.getAdminWhatsApp();
  const customerWallet = WalletDB.getWallet('cust-01', 'CUSTOMER');
  const isBalanceSufficient = customerWallet.balance >= fareResult.totalFare;

  // Reset / close modal handler
  const handleClose = () => {
    setStep('form');
    setIsSubmitting(false);
    onClose();
  };

  // 1. Lokasi Jemput: Gunakan GPS Saya
  const handleUseGPSPickup = async () => {
    setActivePickupMode('gps');
    setShowPickupMap(false);
    setGpsLoading(true);
    setGpsStatus('Mencari koordinat GPS...');
    const result = await getCurrentGPSLocation();
    setPickupLocation(result.address);
    setPickupCoords({ lat: result.lat, lng: result.lng });
    setGpsLoading(false);
    setGpsStatus(
      result.isRealGPS
        ? '✓ Lokasi GPS aktif berhasil dikunci'
        : '✓ Lokasi simulasi Lumajang disetel'
    );
    // Recalculate distance
    const dist = calculateHaversineDistanceKm(
      result.lat,
      result.lng,
      dropoffCoords.lat,
      dropoffCoords.lng
    );
    setDistanceKm(dist);
    setIsFareCalculated(true);
  };

  // 2. Lokasi Jemput: Pilih Titik di Peta
  const handleSelectPickupFromMap = (point: LocationPoint) => {
    setPickupLocation(point.name);
    setPickupCoords({ lat: point.lat, lng: point.lng });
    setShowPickupMap(false);
    setActivePickupMode('map');
    const dist = calculateHaversineDistanceKm(
      point.lat,
      point.lng,
      dropoffCoords.lat,
      dropoffCoords.lng
    );
    setDistanceKm(dist);
    setIsFareCalculated(true);
  };

  // 3. Lokasi Tujuan: Gunakan GPS
  const handleUseGPSDropoff = async () => {
    setActiveDropoffMode('gps');
    setShowDropoffMap(false);
    const result = await getCurrentGPSLocation();
    setDropoffLocation(result.address);
    setDropoffCoords({ lat: result.lat, lng: result.lng });
    const dist = calculateHaversineDistanceKm(
      pickupCoords.lat,
      pickupCoords.lng,
      result.lat,
      result.lng
    );
    setDistanceKm(dist);
    setIsFareCalculated(true);
  };

  // 4. Lokasi Tujuan: Pilih Titik di Peta
  const handleSelectDropoffFromMap = (point: LocationPoint) => {
    setDropoffLocation(point.name);
    setDropoffCoords({ lat: point.lat, lng: point.lng });
    setShowDropoffMap(false);
    setActiveDropoffMode('map');
    const dist = calculateHaversineDistanceKm(
      pickupCoords.lat,
      pickupCoords.lng,
      point.lat,
      point.lng
    );
    setDistanceKm(dist);
    setIsFareCalculated(true);
  };

  // Tombol [ CEK ONGKIR ]
  const handleCheckFare = () => {
    if (!pickupLocation.trim() || !dropoffLocation.trim()) {
      alert('Silakan tentukan Lokasi Jemput dan Tujuan terlebih dahulu.');
      return;
    }
    // Calculate distance based on coords or fallback to default estimated distance
    const dist = calculateHaversineDistanceKm(
      pickupCoords.lat,
      pickupCoords.lng,
      dropoffCoords.lat,
      dropoffCoords.lng
    );
    setDistanceKm(dist);
    setIsFareCalculated(true);
  };

  // Tombol [ PESAN SEKARANG ] -> Masuk ke Layar Konfirmasi Order
  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Mohon isi Nama Customer.');
      return;
    }
    if (!customerPhone.trim()) {
      alert('Mohon isi Nomor WhatsApp Customer.');
      return;
    }
    if (!pickupLocation.trim()) {
      alert('Mohon isi Lokasi Penjemputan.');
      return;
    }
    if (!dropoffLocation.trim()) {
      alert('Mohon isi Lokasi Tujuan.');
      return;
    }

    if (!isFareCalculated || distanceKm === null) {
      handleCheckFare();
    }

    if (paymentMethod === 'SALDO' && !isBalanceSufficient) {
      alert(
        `Saldo Anda tidak mencukupi (Tersedia: ${formatRupiah(customerWallet.balance)}, Ongkir: ${formatRupiah(fareResult.totalFare)}).\nSilakan pilih metode Cash atau lakukan Top Up terlebih dahulu.`
      );
      return;
    }

    setStep('confirm');
  };

  // Tombol [ KONFIRMASI PESANAN ] -> Simpan Order ke DB dengan status 'MENUNGGU ADMIN'
  const handleFinalSubmitOrder = () => {
    setIsSubmitting(true);

    const dist = distanceKm ?? 2.5;
    const calc = calculateFare(dist, tariffConfig);

    let finalPaymentStatus: PaymentStatus = 'BELUM_BAYAR';

    if (paymentMethod === 'SALDO') {
      const payRes = WalletDB.payWithWallet(
        'cust-01',
        'CUSTOMER',
        calc.totalFare,
        `Pembayaran O-RIDE ke ${dropoffLocation.trim()}`,
        undefined
      );
      if (!payRes.success) {
        setIsSubmitting(false);
        alert(payRes.error || 'Saldo tidak mencukupi.');
        return;
      }
      finalPaymentStatus = 'DIBAYAR';
    }

    const newOrder = DB.createOrder({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      serviceType: defaultService,
      pickupLocation: pickupLocation.trim(),
      pickupAddress: pickupLocation.trim(),
      pickupCoords,
      pickupMapLink: pickupShareLink.trim() || undefined,
      dropoffLocation: dropoffLocation.trim(),
      destinationAddress: dropoffLocation.trim(),
      dropoffCoords,
      destinationMapLink: dropoffShareLink.trim() || undefined,
      shareLocationLink: pickupShareLink.trim() || dropoffShareLink.trim() || undefined,
      notes: notes.trim() || undefined,
      note: notes.trim() || undefined,
      distanceKm: dist,
      baseTariff: calc.baseFare,
      baseFare: calc.baseFare,
      perKmTariff: calc.extraKmFare,
      areaSurcharge: calc.areaSurcharge,
      areaFee: calc.areaSurcharge,
      totalTariff: calc.totalFare,
      totalFare: calc.totalFare,
      paymentMethod,
      paymentStatus: finalPaymentStatus,
    });

    setTimeout(() => {
      setIsSubmitting(false);
      setCreatedOrder(newOrder);
      setStep('success');
      onOrderCreated(newOrder);
    }, 450);
  };

  // WhatsApp Admin Link Creator
  const handleOpenWhatsAppAdmin = () => {
    const params: WhatsAppOrderParams = {
      orderId: createdOrder ? createdOrder.id : undefined,
      customerName,
      customerPhone,
      serviceType: 'O-RIDE',
      pickupLocation,
      dropoffLocation,
      pickupLink: pickupShareLink.trim() || undefined,
      dropoffLink: dropoffShareLink.trim() || undefined,
      shareLink: pickupShareLink.trim() || dropoffShareLink.trim() || undefined,
      notes: notes.trim() || undefined,
      estimatedTariff: formatRupiah(fareResult.totalFare),
      paymentMethod: createdOrder?.paymentMethod || paymentMethod,
    };
    const url = createWhatsAppAdminUrl(adminWhatsApp, params);
    window.open(url, '_blank');
  };

  const handleGoToOrderDetail = () => {
    if (createdOrder && onViewOrderDetail) {
      onViewOrderDetail(createdOrder);
    }
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 select-none overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl flex flex-col my-auto max-h-[92vh] overflow-hidden text-gray-800 animate-in fade-in zoom-in-95 duration-150 border border-gray-100">
        {/* ======================================================== */}
        {/* HEADER MODAL */}
        {/* ======================================================== */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-emerald-600 text-white shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-700/80 flex items-center justify-center">
              <Bike className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-base leading-tight tracking-tight">O-RIDE</h2>
              <p className="text-[11px] text-emerald-100 font-medium">
                Pesan ojek untuk perjalanan Anda
              </p>
            </div>
          </div>
          <button
            id="btn-close-order-modal"
            onClick={handleClose}
            className="p-1 rounded-full text-emerald-100 hover:text-white hover:bg-emerald-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ======================================================== */}
        {/* STEP 1: FORM PESAN O-RIDE */}
        {/* ======================================================== */}
        {step === 'form' && (
          <form onSubmit={handleProceedToConfirm} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* 1. Nama Customer */}
            <div>
              <label className="text-xs font-bold text-gray-800 block mb-1">
                1. Nama Customer <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-customer-name"
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Masukkan nama lengkap Anda"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-gray-50/50 focus:bg-white transition"
              />
            </div>

            {/* 2. Nomor WhatsApp */}
            <div>
              <label className="text-xs font-bold text-gray-800 block mb-1">
                2. Nomor WhatsApp <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-customer-phone"
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Contoh: 0813xxxxxxxx"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-gray-50/50 focus:bg-white transition"
              />
            </div>

            {/* 3. Lokasi Jemput */}
            <div className="bg-emerald-50/40 rounded-2xl p-3.5 border border-emerald-100/90 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 ring-2 ring-emerald-200" />
                  3. Lokasi Jemput <span className="text-rose-500">*</span>
                </label>
                {gpsStatus && (
                  <span className="text-[10px] text-emerald-700 font-medium truncate max-w-[170px]">
                    {gpsStatus}
                  </span>
                )}
              </div>

              {/* 3 Pilihan Tombol Jemput */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  id="btn-pickup-gps"
                  onClick={handleUseGPSPickup}
                  disabled={gpsLoading}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1 shadow-2xs ${
                    activePickupMode === 'gps'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-gray-700 hover:bg-emerald-50 border-gray-200'
                  }`}
                >
                  <Navigation className="w-3 h-3 shrink-0" />
                  <span className="truncate">{gpsLoading ? 'Mencari...' : 'Gunakan GPS Saya'}</span>
                </button>

                <button
                  type="button"
                  id="btn-pickup-map"
                  onClick={() => {
                    setActivePickupMode('map');
                    setShowPickupMap(!showPickupMap);
                  }}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1 shadow-2xs ${
                    activePickupMode === 'map' && showPickupMap
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-gray-700 hover:bg-emerald-50 border-gray-200'
                  }`}
                >
                  <MapPin className="w-3 h-3 shrink-0 text-emerald-600" />
                  <span className="truncate">Pilih Titik di Peta</span>
                </button>

                <button
                  type="button"
                  id="btn-pickup-link"
                  onClick={() => setActivePickupMode('link')}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1 shadow-2xs ${
                    activePickupMode === 'link'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-gray-700 hover:bg-emerald-50 border-gray-200'
                  }`}
                >
                  <LinkIcon className="w-3 h-3 shrink-0 text-emerald-600" />
                  <span className="truncate">Tempel Link Share</span>
                </button>
              </div>

              {/* Input Lokasi Jemput */}
              <input
                id="input-pickup-location"
                type="text"
                required
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder="Nama lokasi / patokan jemput (Contoh: Alun-Alun Lumajang)"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />

              {/* Kolom Tempel Link Google Maps Jemput */}
              <div>
                <label className="text-[11px] text-gray-600 block mb-1 font-medium">
                  Tempel Link Google Maps Jemput (Opsional):
                </label>
                <input
                  id="input-pickup-share-link"
                  type="url"
                  value={pickupShareLink}
                  onChange={(e) => setPickupShareLink(e.target.value)}
                  placeholder="Tempel link Google Maps di sini"
                  className="w-full text-[11px] px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-gray-700"
                />
              </div>

              {/* Pemilih Titik di Peta (Simulasi Lumajang) */}
              {showPickupMap && (
                <div className="pt-1">
                  <div className="text-[11px] font-bold text-emerald-900 mb-1 flex items-center justify-between">
                    <span>Pilih Landmark Lumajang untuk Titik Jemput:</span>
                    <button
                      type="button"
                      onClick={() => setShowPickupMap(false)}
                      className="text-[10px] text-gray-500 hover:text-gray-700 underline"
                    >
                      Tutup
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
                    {LUMAJANG_LANDMARKS.map((landmark, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPickupFromMap(landmark)}
                        className="text-left p-2 rounded-xl border border-emerald-200 bg-white hover:bg-emerald-50 text-[11px] transition shadow-2xs flex items-start gap-1.5"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                          <strong className="block text-gray-800 leading-tight">
                            {landmark.name}
                          </strong>
                          <span className="text-[10px] text-gray-400 line-clamp-1">
                            {landmark.address}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Tujuan */}
            <div className="bg-emerald-50/40 rounded-2xl p-3.5 border border-emerald-100/90 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-rose-200" />
                  4. Tujuan <span className="text-rose-500">*</span>
                </label>
              </div>

              {/* 3 Pilihan Tombol Tujuan */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  id="btn-dropoff-gps"
                  onClick={handleUseGPSDropoff}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1 shadow-2xs ${
                    activeDropoffMode === 'gps'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-gray-700 hover:bg-emerald-50 border-gray-200'
                  }`}
                >
                  <Navigation className="w-3 h-3 shrink-0" />
                  <span className="truncate">Gunakan GPS</span>
                </button>

                <button
                  type="button"
                  id="btn-dropoff-map"
                  onClick={() => {
                    setActiveDropoffMode('map');
                    setShowDropoffMap(!showDropoffMap);
                  }}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1 shadow-2xs ${
                    activeDropoffMode === 'map' && showDropoffMap
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-gray-700 hover:bg-emerald-50 border-gray-200'
                  }`}
                >
                  <MapPin className="w-3 h-3 shrink-0 text-rose-600" />
                  <span className="truncate">Pilih Titik di Peta</span>
                </button>

                <button
                  type="button"
                  id="btn-dropoff-link"
                  onClick={() => setActiveDropoffMode('link')}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1 shadow-2xs ${
                    activeDropoffMode === 'link'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-gray-700 hover:bg-emerald-50 border-gray-200'
                  }`}
                >
                  <LinkIcon className="w-3 h-3 shrink-0 text-emerald-600" />
                  <span className="truncate">Tempel Link Share</span>
                </button>
              </div>

              {/* Input Lokasi Tujuan */}
              <input
                id="input-dropoff-location"
                type="text"
                required
                value={dropoffLocation}
                onChange={(e) => setDropoffLocation(e.target.value)}
                placeholder="Nama lokasi tujuan (Contoh: RSUD dr. Haryoto Lumajang)"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />

              {/* Kolom Tempel Link Google Maps Tujuan */}
              <div>
                <label className="text-[11px] text-gray-600 block mb-1 font-medium">
                  Tempel Link Google Maps Tujuan (Opsional):
                </label>
                <input
                  id="input-dropoff-share-link"
                  type="url"
                  value={dropoffShareLink}
                  onChange={(e) => setDropoffShareLink(e.target.value)}
                  placeholder="Tempel link Google Maps di sini"
                  className="w-full text-[11px] px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-gray-700"
                />
              </div>

              {/* Pemilih Titik di Peta Tujuan */}
              {showDropoffMap && (
                <div className="pt-1">
                  <div className="text-[11px] font-bold text-emerald-900 mb-1 flex items-center justify-between">
                    <span>Pilih Landmark Lumajang untuk Titik Tujuan:</span>
                    <button
                      type="button"
                      onClick={() => setShowDropoffMap(false)}
                      className="text-[10px] text-gray-500 hover:text-gray-700 underline"
                    >
                      Tutup
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
                    {LUMAJANG_LANDMARKS.map((landmark, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectDropoffFromMap(landmark)}
                        className="text-left p-2 rounded-xl border border-emerald-200 bg-white hover:bg-emerald-50 text-[11px] transition shadow-2xs flex items-start gap-1.5"
                      >
                        <MapPin className="w-3.5 h-3.5 text-rose-600 mt-0.5 shrink-0" />
                        <div>
                          <strong className="block text-gray-800 leading-tight">
                            {landmark.name}
                          </strong>
                          <span className="text-[10px] text-gray-400 line-clamp-1">
                            {landmark.address}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 5. Catatan untuk Driver */}
            <div>
              <label className="text-xs font-bold text-gray-800 block mb-1">
                5. Catatan untuk Driver (Opsional)
              </label>
              <textarea
                id="input-order-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Tunggu di pos satpam gerbang timur, baju warna biru, bawa helm ukuran L"
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium resize-none bg-gray-50/50 focus:bg-white transition"
              />
            </div>

            {/* ======================================================== */}
            {/* RINGKASAN ORDER & CEK ONGKIR */}
            {/* ======================================================== */}
            <div className="rounded-2xl bg-white border border-gray-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  RINGKASAN PERJALANAN
                </h3>
                <button
                  type="button"
                  id="btn-cek-ongkir"
                  onClick={handleCheckFare}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] shadow-2xs transition"
                >
                  CEK ONGKIR
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {/* 📍 Jemput */}
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 mt-1 shrink-0" />
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                      📍 Jemput
                    </span>
                    <span className="font-bold text-gray-900">
                      {pickupLocation.trim() || 'Lokasi yang dipilih'}
                    </span>
                  </div>
                </div>

                {/* 🎯 Tujuan */}
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-600 mt-1 shrink-0" />
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                      🎯 Tujuan
                    </span>
                    <span className="font-bold text-gray-900">
                      {dropoffLocation.trim() || 'Lokasi yang dipilih'}
                    </span>
                  </div>
                </div>

                {/* 📏 Jarak */}
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600 mt-1 shrink-0" />
                  <div className="w-full">
                    <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                      📏 Jarak
                    </span>
                    {isFareCalculated && distanceKm !== null ? (
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-800">{distanceKm} km</span>
                        <span className="text-[10px] text-gray-400">
                          (Rute darat perkiraan)
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">
                        Belum tersedia jika GPS/Maps belum aktif
                      </span>
                    )}
                  </div>
                </div>

                {/* 💰 Estimasi Ongkir */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                      💰 Estimasi Ongkir
                    </span>
                    <span className="text-[10px] text-gray-500">
                      0-3 km Rp8.000, 5 km Rp12.000
                    </span>
                  </div>
                  <div className="text-right">
                    {isFareCalculated && distanceKm !== null ? (
                      <div>
                        <span className="text-base font-black text-emerald-700">
                          {formatRupiah(fareResult.totalFare)}
                        </span>
                        {fareResult.hasAreaSurcharge && (
                          <span className="block text-[10px] text-amber-700 font-bold">
                            + Ongkir Area: {formatRupiah(fareResult.areaSurcharge)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-gray-400 italic">
                        Menunggu jarak
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Slider Jarak Simulasi untuk Pengujian Langsung */}
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-xs space-y-1">
                <div className="flex justify-between items-center text-[11px] font-semibold text-gray-600">
                  <span className="flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-emerald-600" />
                    Uji Coba Jarak Rute:
                  </span>
                  <span className="font-black text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                    {currentDistance} km
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="20"
                  step="0.5"
                  value={currentDistance}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setDistanceKm(val);
                    setIsFareCalculated(true);
                  }}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-gray-400">
                  <span>3 km (Rp8rb)</span>
                  <span>5 km (Rp12rb)</span>
                  <span>&gt;5 km (+Ongkir Area Rp2rb)</span>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* 6. PILIH METODE PEMBAYARAN */}
            {/* ======================================================== */}
            <div className="rounded-2xl bg-white border border-gray-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                  <WalletIcon className="w-4 h-4 text-emerald-600" />
                  6. METODE PEMBAYARAN
                </h3>
                <span className="text-[10px] text-gray-500 font-medium">Pilih salah satu</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Opsi 1: Saldo */}
                <div
                  id="opt-payment-saldo"
                  onClick={() => setPaymentMethod('SALDO')}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition ${
                    paymentMethod === 'SALDO'
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          paymentMethod === 'SALDO'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        <WalletIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-gray-900 block">
                          💰 Saldo Saya
                        </span>
                        <span className="text-[11px] font-black text-emerald-700">
                          {formatRupiah(customerWallet.balance)}
                        </span>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'SALDO'}
                      onChange={() => setPaymentMethod('SALDO')}
                      className="accent-emerald-600 w-4 h-4"
                    />
                  </div>

                  {paymentMethod === 'SALDO' && (
                    <div className="mt-2.5 pt-2 border-t border-emerald-200/70 text-[11px]">
                      {isBalanceSufficient ? (
                        <div className="text-emerald-800 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Saldo cukup. Otomatis lunas (DIBAYAR).</span>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <p className="text-rose-600 font-bold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Saldo tidak cukup (Kurang {formatRupiah(fareResult.totalFare - customerWallet.balance)}).</span>
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowTopUpModal(true);
                            }}
                            className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-2xs transition flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>+ Top Up Saldo Sekarang</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Opsi 2: Cash */}
                <div
                  id="opt-payment-cash"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition ${
                    paymentMethod === 'CASH'
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          paymentMethod === 'CASH'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        <Banknote className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-gray-900 block">
                          💵 Bayar Cash
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium">
                          Bayar tunai ke driver
                        </span>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'CASH'}
                      onChange={() => setPaymentMethod('CASH')}
                      className="accent-emerald-600 w-4 h-4"
                    />
                  </div>

                  {paymentMethod === 'CASH' && (
                    <div className="mt-2.5 pt-2 border-t border-emerald-200/70 text-[11px] text-slate-600 font-medium">
                      ✓ Saldo tidak dipotong. Bayar tunai ke driver saat sampai.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tombol Utama: [ PESAN SEKARANG ] */}
            <div className="pt-2">
              <button
                type="submit"
                id="btn-pesan-sekarang"
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>PESAN SEKARANG</span>
              </button>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* STEP 2: KONFIRMASI ORDER */}
        {/* ======================================================== */}
        {step === 'confirm' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            <div className="text-center pb-1">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2 shadow-xs">
                <Bike className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-gray-900 tracking-tight">
                KONFIRMASI ORDER
              </h3>
              <p className="text-xs text-gray-500">
                Mohon periksa kembali rincian pesanan perjalanan Anda sebelum dikirim.
              </p>
            </div>

            {/* Rincian Konfirmasi */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 divide-y divide-gray-200 text-xs space-y-2.5">
              {/* Nama */}
              <div className="flex justify-between pt-1">
                <span className="text-gray-500 font-medium">Nama</span>
                <span className="font-bold text-gray-900 text-right">{customerName}</span>
              </div>

              {/* Nomor WhatsApp */}
              <div className="flex justify-between pt-2">
                <span className="text-gray-500 font-medium">Nomor WhatsApp</span>
                <span className="font-mono font-bold text-gray-900 text-right">
                  {customerPhone}
                </span>
              </div>

              {/* Lokasi Jemput */}
              <div className="flex justify-between pt-2 items-start">
                <span className="text-gray-500 font-medium shrink-0">Lokasi Jemput</span>
                <div className="text-right pl-3">
                  <span className="font-bold text-gray-900 block">{pickupLocation}</span>
                  {pickupShareLink && (
                    <span className="text-[10px] text-emerald-700 block truncate max-w-[200px]">
                      {pickupShareLink}
                    </span>
                  )}
                </div>
              </div>

              {/* Tujuan */}
              <div className="flex justify-between pt-2 items-start">
                <span className="text-gray-500 font-medium shrink-0">Tujuan</span>
                <div className="text-right pl-3">
                  <span className="font-bold text-gray-900 block">{dropoffLocation}</span>
                  {dropoffShareLink && (
                    <span className="text-[10px] text-emerald-700 block truncate max-w-[200px]">
                      {dropoffShareLink}
                    </span>
                  )}
                </div>
              </div>

              {/* Jarak */}
              <div className="flex justify-between pt-2">
                <span className="text-gray-500 font-medium">Jarak</span>
                <span className="font-bold text-emerald-800 text-right">
                  {distanceKm ? `${distanceKm} km` : 'Dalam peninjauan'}
                </span>
              </div>

              {/* Ongkir */}
              <div className="flex justify-between pt-2 items-center">
                <div>
                  <span className="text-gray-500 font-medium block">Ongkir</span>
                  {fareResult.hasAreaSurcharge && (
                    <span className="text-[10px] text-amber-700 font-bold">
                      Termasuk Ongkir Area (+{formatRupiah(fareResult.areaSurcharge)})
                    </span>
                  )}
                </div>
                <span className="text-base font-black text-emerald-800 text-right">
                  {formatRupiah(fareResult.totalFare)}
                </span>
              </div>

              {/* Metode Pembayaran */}
              <div className="flex justify-between pt-2 items-center border-t border-gray-100">
                <span className="text-gray-500 font-medium text-xs">Metode Pembayaran</span>
                <span
                  className={`font-black text-xs px-2.5 py-1 rounded-lg ${
                    paymentMethod === 'SALDO'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {paymentMethod === 'SALDO'
                    ? '💰 Saldo (DIBAYAR Otomatis)'
                    : '💵 Cash (Bayar Tunai ke Driver)'}
                </span>
              </div>

              {/* Catatan */}
              <div className="flex justify-between pt-2 items-start">
                <span className="text-gray-500 font-medium shrink-0">Catatan</span>
                <span className="font-medium text-gray-700 text-right pl-3 italic">
                  {notes.trim() || '-'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                id="btn-konfirmasi-pesanan"
                disabled={isSubmitting}
                onClick={handleFinalSubmitOrder}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Memproses Pesanan...' : 'KONFIRMASI PESANAN'}</span>
              </button>

              <button
                type="button"
                id="btn-kembali-edit"
                disabled={isSubmitting}
                onClick={() => setStep('form')}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs border border-gray-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>KEMBALI EDIT</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3: STATUS ORDER (ORDER BERHASIL DIBUAT ✅) */}
        {/* ======================================================== */}
        {step === 'success' && createdOrder && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner animate-bounce">
              <CheckCircle className="w-9 h-9" />
            </div>

            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">
                ORDER BERHASIL DIBUAT ✅
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Pesanan Anda telah dicatat dalam sistem Ojek Olumajang.
              </p>
            </div>

            {/* Card Status */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-left space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">Nomor Order:</span>
                <span className="font-mono text-sm font-black text-gray-900 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                  #{createdOrder.id}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">Status:</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-xs border border-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  🟡 Menunggu Admin
                </span>
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-emerald-200/60">
                <span className="text-xs text-gray-500 font-medium">Metode Pembayaran:</span>
                <span
                  className={`text-xs font-black px-2.5 py-0.5 rounded-md ${
                    createdOrder.paymentMethod === 'SALDO'
                      ? 'bg-emerald-200 text-emerald-900'
                      : 'bg-amber-200 text-amber-900'
                  }`}
                >
                  {createdOrder.paymentMethod === 'SALDO'
                    ? '💰 DIBAYAR VIA SALDO'
                    : '💵 BAYAR CASH (Belum Bayar)'}
                </span>
              </div>

              <p className="text-xs text-amber-900/90 font-medium pt-1 border-t border-emerald-200/80">
                Pesanan Anda sedang menunggu Admin untuk menyiapkan order.
              </p>
            </div>

            {/* Dua Tombol Aksi */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                id="btn-pesan-via-whatsapp-admin"
                onClick={handleOpenWhatsAppAdmin}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-emerald-200" />
                <span>PESAN VIA WHATSAPP ADMIN</span>
              </button>

              <button
                type="button"
                id="btn-lihat-detail-order"
                onClick={handleGoToOrderDetail}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-gray-50 active:scale-98 text-emerald-800 font-extrabold text-xs border-2 border-emerald-600 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>LIHAT DETAIL ORDER</span>
                <ChevronRight className="w-4 h-4 text-emerald-600" />
              </button>
            </div>
          </div>
        )}

        {/* Modal Top Up Saldo jika dibutuhkan saat pesan */}
        <WalletModal
          isOpen={showTopUpModal}
          onClose={() => setShowTopUpModal(false)}
          role="CUSTOMER"
          userId="cust-01"
          defaultView="topup"
        />
      </div>
    </div>
  );
};
