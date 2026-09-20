import { LocationPoint } from '../types';
import { ADMIN_WHATSAPP } from '../config/constants';

/**
 * Service Abstraksi GPS & Peta Lumajang
 * Dirancang agar tahap selanjutnya dapat langsung di-plug dengan Google Maps JavaScript API / Geocoding API
 * tanpa merombak logika komponen.
 */

export const LUMAJANG_LANDMARKS: LocationPoint[] = [
  {
    name: 'Alun-Alun Lumajang',
    address: 'Jl. Alun-Alun Barat, Rogotrunan, Kec. Lumajang',
    lat: -8.1332,
    lng: 113.2248,
  },
  {
    name: 'Stasiun Kereta Api Klakah',
    address: 'Mlawang, Kec. Klakah, Kab. Lumajang',
    lat: -8.0041,
    lng: 113.2505,
  },
  {
    name: 'RSUD dr. Haryoto Lumajang',
    address: 'Jl. Basuki Rahmat No.1, Tompokersan, Kec. Lumajang',
    lat: -8.1384,
    lng: 113.2201,
  },
  {
    name: 'Terminal Bus Minak Koncar',
    address: 'Wonorejo, Kec. Kedungjajang, Kab. Lumajang',
    lat: -8.1567,
    lng: 113.2389,
  },
  {
    name: 'Pasar Baru Serasi Lumajang',
    address: 'Jl. Brigjend Slamet Riyadi, Tompokersan, Kec. Lumajang',
    lat: -8.1345,
    lng: 113.2223,
  },
  {
    name: 'GOR Wira Bhakti Lumajang',
    address: 'Jl. Gajah Mada, Kepuharjo, Kec. Lumajang',
    lat: -8.1302,
    lng: 113.2175,
  },
  {
    name: 'Kawasan Wonorejo Terpadu (KWT)',
    address: 'Jl. Raya Wonorejo, Kedungjajang, Kab. Lumajang',
    lat: -8.1691,
    lng: 113.2422,
  },
  {
    name: 'Puskesmas Sukodono Lumajang',
    address: 'Jl. Raya Sukodono, Kutorenon, Sukodono, Kab. Lumajang',
    lat: -8.1124,
    lng: 113.241,
  },
  {
    name: 'Pasar Sentral Pasirian',
    address: 'Jl. Raya Pasirian, Kec. Pasirian, Kab. Lumajang',
    lat: -8.2155,
    lng: 113.1255,
  },
  {
    name: 'Gerbang Wisata Pura Mandara Giri Semeru Senduro',
    address: 'Kec. Senduro, Kab. Lumajang',
    lat: -8.0954,
    lng: 113.0945,
  },
];

// Fallback koordinat pusat Lumajang
export const DEFAULT_LUMAJANG_COORDS = {
  lat: -8.1332,
  lng: 113.2248,
  address: 'Alun-Alun Lumajang, Jawa Timur',
};

/**
 * Mendapatkan lokasi GPS pengguna dengan izin browser
 * Jika ditolak atau error, memberikan koordinat pusat Lumajang dengan pesan ramah
 */
export async function getCurrentGPSLocation(): Promise<{
  lat: number;
  lng: number;
  address: string;
  isRealGPS: boolean;
}> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        ...DEFAULT_LUMAJANG_COORDS,
        isRealGPS: false,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          address: `GPS: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)} (Lokasi Terkini Anda)`,
          isRealGPS: true,
        });
      },
      () => {
        // Fallback default Lumajang jika ditolak atau preview sandboxed
        resolve({
          ...DEFAULT_LUMAJANG_COORDS,
          isRealGPS: false,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 10000,
      }
    );
  });
}

/**
 * Menghitung jarak perkiraan antar dua titik koordinat menggunakan Haversine Formula (dalam Kilometer)
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius bumi dalam km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  // Pembulatan 1 desimal untuk jarak rute jalan umum
  return Math.max(0.8, Number((distance * 1.25).toFixed(1))); // 1.25 multiplier estimasi rute jalan darat
}

/**
 * Validasi dan parse link Google Maps share location
 */
export function validateMapsShareLink(link: string): boolean {
  if (!link || !link.trim()) return false;
  const trimmed = link.trim().toLowerCase();
  return (
    trimmed.includes('maps.google.com') ||
    trimmed.includes('goo.gl/maps') ||
    trimmed.includes('maps.app.goo.gl') ||
    trimmed.includes('google.com/maps') ||
    trimmed.includes('http://') ||
    trimmed.includes('https://')
  );
}

export interface WhatsAppOrderParams {
  orderId?: string;
  customerName?: string;
  customerPhone?: string;
  serviceType?: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupLink?: string;
  dropoffLink?: string;
  shareLink?: string;
  notes?: string;
  estimatedTariff?: string;
  paymentMethod?: 'SALDO' | 'CASH' | string;
}

/**
 * Format pesan WhatsApp otomatis sesuai spesifikasi:
 * ORDER OJEK OLUMAJANG
 * Nomor Order:
 * Nama:
 * No. WhatsApp:
 * Layanan: O-RIDE
 * Lokasi Jemput:
 * Tujuan:
 * Link Lokasi Jemput:
 * Link Lokasi Tujuan:
 * Ongkir:
 * Metode Pembayaran: Saldo / Cash
 * Catatan:
 */
export function buildWhatsAppOrderMessage(params: WhatsAppOrderParams): string {
  const methodLabel =
    params.paymentMethod === 'SALDO'
      ? '💰 Saldo (DIBAYAR)'
      : '💵 Cash (Bayar Tunai ke Driver)';

  const lines = [
    `ORDER OJEK OLUMAJANG`,
    ``,
    `Nomor Order: ${params.orderId ? (params.orderId.startsWith('#') ? params.orderId : '#' + params.orderId) : '#OL-BARU'}`,
    `Nama: ${params.customerName || '-'}`,
    `No. WhatsApp: ${params.customerPhone || '-'}`,
    `Layanan: ${params.serviceType || 'O-RIDE'}`,
    ``,
    `Lokasi Jemput: ${params.pickupLocation || '-'}`,
    `Tujuan: ${params.dropoffLocation || '-'}`,
    ``,
    `Link Lokasi Jemput: ${params.pickupLink || params.shareLink || '-'}`,
    `Link Lokasi Tujuan: ${params.dropoffLink || '-'}`,
    ``,
    `Ongkir: ${params.estimatedTariff || '-'}`,
    `Metode Pembayaran: ${methodLabel}`,
    `Catatan: ${params.notes || '-'}`,
  ];
  return lines.join('\n');
}

/**
 * Format pesan WhatsApp otomatis untuk Admin sebagai jalur cadangan
 */
export function createWhatsAppAdminUrl(
  adminPhone: string,
  params: WhatsAppOrderParams
): string {
  // Format nomor HP (misal 0812... -> 62812...)
  let cleanPhone = (adminPhone || '').replace(/\D/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  } else if (!cleanPhone.startsWith('62') && cleanPhone.length > 0) {
    cleanPhone = '62' + cleanPhone;
  }
  if (!cleanPhone) {
    cleanPhone = ADMIN_WHATSAPP.replace(/\D/g, '');
  }

  const message = buildWhatsAppOrderMessage(params);
  const text = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${text}`;
}
