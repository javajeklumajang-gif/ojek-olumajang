export type UserRole = 'CUSTOMER' | 'DRIVER' | 'WARUNG' | 'ADMIN';

export type OrderStatus =
  | 'MENUNGGU_ADMIN'
  | 'MENUNGGU ADMIN'
  | 'READY'
  | 'MENUNGGU_DRIVER'
  | 'MENUNGGU DRIVER'
  | 'DIAMBIL_DRIVER'
  | 'DIAMBIL DRIVER'
  | 'MENUJU_JEMPUT'
  | 'MENUJU JEMPUT'
  | 'SAMPAI_LOKASI'
  | 'SAMPAI DI LOKASI'
  | 'DALAM_PERJALANAN'
  | 'DALAM PERJALANAN'
  | 'SELESAI'
  | 'DIBATALKAN'
  | 'DITOLAK';

export type DriverStatus =
  | 'MENUNGGU VERIFIKASI'
  | 'DISETUJUI'
  | 'DITOLAK'
  | 'NONAKTIF';

export type ServiceType = 'O-RIDE' | 'O-FOOD' | 'MARKET' | 'O-SEND';

export type PaymentMethod = 'SALDO' | 'CASH';

export type PaymentStatus = 'BELUM_BAYAR' | 'DIBAYAR' | 'REFUND' | 'DIBATALKAN';

export type WalletRole = 'CUSTOMER' | 'DRIVER' | 'WARUNG';

export type TransactionType =
  | 'TOP_UP'
  | 'ORDER_PAYMENT'
  | 'DRIVER_EARNING'
  | 'WARUNG_EARNING'
  | 'REFUND'
  | 'WITHDRAWAL'
  | 'ADJUSTMENT';

export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

export interface Wallet {
  walletId: string;
  userId: string;
  role: WalletRole;
  balance: number;
  createdAt: number;
  updatedAt: number;
}

export interface WalletTransaction {
  transactionId: string;
  walletId: string;
  userId: string;
  role: WalletRole;
  type: TransactionType;
  amount: number;
  description: string;
  status: TransactionStatus;
  referenceId?: string;
  createdAt: number;
}

export interface LocationPoint {
  name: string;
  address?: string;
  lat: number;
  lng: number;
}

export interface Order {
  id: string;
  orderId?: string; // Alias sesuai spesifikasi Tahap 3
  customerName: string;
  customerPhone: string;
  serviceType: ServiceType;
  pickupLocation: string;
  pickupAddress?: string; // Alias
  pickupCoords?: { lat: number; lng: number };
  pickupMapLink?: string; // Link lokasi jemput
  dropoffLocation: string;
  destinationAddress?: string; // Alias
  dropoffCoords?: { lat: number; lng: number };
  destinationMapLink?: string; // Link lokasi tujuan
  shareLocationLink?: string;
  notes?: string;
  note?: string; // Alias
  distanceKm: number;
  baseTariff: number;
  baseFare?: number; // Alias
  perKmTariff: number;
  areaSurcharge: number;
  areaFee?: number; // Alias
  totalTariff: number;
  totalFare?: number; // Alias
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverPlate?: string;
  driverAvatar?: string;
  createdAt: number;
  acceptedAt?: number;
  completedAt?: number;
  rating?: number;
  review?: string;
}

export interface Driver {
  id: string;
  fullName: string;
  whatsapp: string;
  username: string;
  passwordHash: string; // Stored securely as SHA-256 hash
  gender: 'Laki-laki' | 'Perempuan';
  vehicleType: 'Motor Matic' | 'Motor Bebek' | 'Motor Sport';
  vehicleModel: string;
  plateNumber: string;
  avatarUrl: string;
  addressArea: string;
  bio: string;
  status: DriverStatus;
  isOnline: boolean;
  todayOrdersCount: number;
  ratingAvg: number;
  ratingCount: number;
  completedOrdersCount: number;
  activeOrderId?: string;
  timerEndsAt?: number; // 5-minute cooldown timer timestamp
  registeredAt: number;
}

export interface AppNotification {
  id: string;
  targetRole: UserRole | 'ALL';
  targetUserId?: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  relatedOrderId?: string;
}

export interface TariffConfig {
  baseFirst3Km: number; // Default: 8000
  basePerKmAfter3Km: number; // Default: 2500 (bisa diatur Admin)
  areaSurchargeThresholdKm: number; // Default: 5 km
  areaSurchargeAmount: number; // Default: 2000
}

export interface NotificationSettings {
  soundEnabled: boolean;
  vibrateEnabled: boolean;
}

export interface WarungPartner {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  rating: number;
  isOpen: boolean;
  imageUrl: string;
  productsCount: number;
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  code: string;
  discountText: string;
  bgColor: string;
}
