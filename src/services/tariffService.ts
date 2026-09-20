import { TariffConfig } from '../types';

export const DEFAULT_TARIFF_CONFIG: TariffConfig = {
  baseFirst3Km: 8000,
  basePerKmAfter3Km: 2000, // Pada jarak 5 km: 8.000 + (2 km * 2.000) = 12.000
  areaSurchargeThresholdKm: 5,
  areaSurchargeAmount: 2000, // Tambahan flat jika rute melebihi 5 km
};

export interface FareResult {
  distanceKm: number;
  baseFare: number; // Sampai 3 km = Rp8.000
  extraDistanceKm: number; // Jarak di atas 3 km
  perKmRate: number; // Tarif per km setelah 3 km (Rp2.000)
  extraKmFare: number; // extraDistanceKm * perKmRate
  areaSurcharge: number; // Ongkir Area Rp2.000 jika jarak > 5 km (bukan per km)
  hasAreaSurcharge: boolean;
  totalFare: number; // baseFare + extraKmFare + areaSurcharge
  breakdownText: string;
}

export interface TariffCalculationResult {
  distanceKm: number;
  baseTariff: number; // 0-3 km = 8.000
  perKmTariff: number; // (jarak - 3) * tarif dasar
  areaSurcharge: number; // > 5 km = +2.000
  totalTariff: number;
  breakdownText: string;
}

/**
 * Fungsi resmi perhitungan ongkir Ojek Olumajang
 * Sesuai aturan:
 * - Sampai 3 km = Rp8.000
 * - Setelah 3 km, tarif bertambah sesuai tarif dasar (Rp2.000/km)
 * - Pada jarak 5 km = Rp12.000 (8.000 + 2*2.000)
 * - Jika jarak LEBIH DARI 5 km, tambahkan "Ongkir Area" Rp2.000 (biaya tambahan karena melewati 5 km, bukan per km)
 * - Tanpa pembulatan tambahan yang tidak ditentukan
 */
export function calculateFare(
  distanceKm: number,
  config: TariffConfig = DEFAULT_TARIFF_CONFIG
): FareResult {
  const dist = Math.max(0, distanceKm);
  const baseFare = config.baseFirst3Km;

  let extraDistanceKm = 0;
  let extraKmFare = 0;
  if (dist > 3) {
    extraDistanceKm = dist - 3;
    extraKmFare = extraDistanceKm * config.basePerKmAfter3Km;
  }

  // Ongkir Area Rp2.000 jika jarak LEBIH DARI 5 km
  let areaSurcharge = 0;
  const hasAreaSurcharge = dist > config.areaSurchargeThresholdKm;
  if (hasAreaSurcharge) {
    areaSurcharge = config.areaSurchargeAmount;
  }

  const totalFare = baseFare + extraKmFare + areaSurcharge;

  let breakdownText = `0-3 km: ${formatRupiah(baseFare)}`;
  if (extraKmFare > 0) {
    breakdownText += ` + Tambahan ${extraDistanceKm.toFixed(1)} km (${formatRupiah(config.basePerKmAfter3Km)}/km): ${formatRupiah(extraKmFare)}`;
  }
  if (areaSurcharge > 0) {
    breakdownText += ` + Ongkir Area (>5 km): ${formatRupiah(areaSurcharge)}`;
  }

  return {
    distanceKm: dist,
    baseFare,
    extraDistanceKm,
    perKmRate: config.basePerKmAfter3Km,
    extraKmFare,
    areaSurcharge,
    hasAreaSurcharge,
    totalFare,
    breakdownText,
  };
}

/**
 * Wrapper kompatibilitas dengan antarmuka lama
 */
export function calculateTariff(
  distanceKm: number,
  config: TariffConfig = DEFAULT_TARIFF_CONFIG
): TariffCalculationResult {
  const fare = calculateFare(distanceKm, config);
  return {
    distanceKm: fare.distanceKm,
    baseTariff: fare.baseFare,
    perKmTariff: fare.extraKmFare,
    areaSurcharge: fare.areaSurcharge,
    totalTariff: fare.totalFare,
    breakdownText: fare.breakdownText,
  };
}

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}
