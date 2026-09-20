/**
 * KONFIGURASI TERPUSAT OJEK OLUMAJANG
 * 
 * Sesuai spesifikasi Tahap 3:
 * Nomor WhatsApp Admin disimpan HANYA dalam SATU konfigurasi terpusat:
 * ADMIN_WHATSAPP = "081334274818"
 * Semua tombol WhatsApp harus mengambil nomor dari konfigurasi ini.
 */
export const ADMIN_WHATSAPP = '081334274818';

/**
 * Normalisasi nomor HP ke format internasional WhatsApp (628...)
 */
export function formatPhoneForWhatsApp(phone: string): string {
  let clean = (phone || '').replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (!clean.startsWith('62') && clean.length > 0) {
    clean = '62' + clean;
  }
  return clean || '6281334274818';
}

/**
 * Buat link chat WhatsApp langsung ke Customer
 */
export function createCustomerWhatsAppUrl(customerPhone: string, message?: string): string {
  const cleanPhone = formatPhoneForWhatsApp(customerPhone);
  const textParam = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${cleanPhone}${textParam}`;
}

/**
 * Buat link chat WhatsApp langsung ke Admin
 */
export function createAdminWhatsAppUrl(message?: string): string {
  const cleanPhone = formatPhoneForWhatsApp(ADMIN_WHATSAPP);
  const textParam = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${cleanPhone}${textParam}`;
}

/**
 * ========================================================
 * KONFIGURASI TERPUSAT SALDO OPERASIONAL DRIVER
 * ========================================================
 * Driver harus memiliki saldo operasional yang memenuhi batas minimum
 * (DRIVER_MIN_BALANCE) agar dapat mengambil order.
 * Nilai default preview: Rp10.000 (dapat diubah oleh Admin).
 */
export const DEFAULT_DRIVER_MIN_BALANCE = 10000;

export interface DriverFeeConfig {
  driverMinBalance: number; // Default: 10000
  driverFee: number; // Default: 0 (potongan saldo per order)
  driverDeposit: number; // Default: 0 (deposit saldo awal)
}

const STORAGE_DRIVER_CONFIG = 'ojek_olumajang_driver_config_v1';

export function getDriverFeeConfig(): DriverFeeConfig {
  try {
    const raw = localStorage.getItem(STORAGE_DRIVER_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        driverMinBalance:
          typeof parsed.driverMinBalance === 'number'
            ? parsed.driverMinBalance
            : DEFAULT_DRIVER_MIN_BALANCE,
        driverFee: typeof parsed.driverFee === 'number' ? parsed.driverFee : 0,
        driverDeposit: typeof parsed.driverDeposit === 'number' ? parsed.driverDeposit : 0,
      };
    }
  } catch (e) {
    console.error('Error reading driver config:', e);
  }
  return {
    driverMinBalance: DEFAULT_DRIVER_MIN_BALANCE,
    driverFee: 0,
    driverDeposit: 0,
  };
}

export function saveDriverFeeConfig(cfg: Partial<DriverFeeConfig>): DriverFeeConfig {
  const current = getDriverFeeConfig();
  const updated: DriverFeeConfig = {
    driverMinBalance:
      cfg.driverMinBalance !== undefined
        ? Math.max(0, cfg.driverMinBalance)
        : current.driverMinBalance,
    driverFee: cfg.driverFee !== undefined ? Math.max(0, cfg.driverFee) : current.driverFee,
    driverDeposit:
      cfg.driverDeposit !== undefined ? Math.max(0, cfg.driverDeposit) : current.driverDeposit,
  };
  localStorage.setItem(STORAGE_DRIVER_CONFIG, JSON.stringify(updated));
  window.dispatchEvent(new Event('driver-config-updated'));
  return updated;
}

export function getDriverMinBalance(): number {
  return getDriverFeeConfig().driverMinBalance;
}

export function setDriverMinBalance(amount: number): number {
  const updated = saveDriverFeeConfig({ driverMinBalance: amount });
  return updated.driverMinBalance;
}
