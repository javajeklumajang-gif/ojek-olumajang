import {
  AppNotification,
  Driver,
  Order,
  OrderStatus,
  TariffConfig,
  UserRole,
  WarungPartner,
} from '../types';
import { createNotification } from './notificationService';
import { DEFAULT_TARIFF_CONFIG } from './tariffService';
import { ADMIN_WHATSAPP, getDriverMinBalance, getDriverFeeConfig } from '../config/constants';
import { WalletDB } from './walletService';

// Storage Keys
const STORAGE_ORDERS = 'ojek_olumajang_orders_v1';
const STORAGE_DRIVERS = 'ojek_olumajang_drivers_v1';
const STORAGE_TARIFF = 'ojek_olumajang_tariff_v1';
const STORAGE_NOTIFS = 'ojek_olumajang_notifs_v1';
const STORAGE_ROLE = 'ojek_olumajang_current_role_v1';
const STORAGE_ADMIN_WA = 'ojek_olumajang_admin_wa_v1';

// Initial Seed Drivers
const INITIAL_DRIVERS: Driver[] = [
  {
    id: 'drv-01',
    fullName: 'Budi Santoso',
    whatsapp: '081234567890',
    username: 'budi_driver',
    passwordHash: '346525d1f8254ce9604977ac3aaf703bf285b08faecfb83dec91063f8ecc8837', // password: driver123
    gender: 'Laki-laki',
    vehicleType: 'Motor Matic',
    vehicleModel: 'Honda Vario 125 (Hitam)',
    plateNumber: 'N 4521 YZ',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    addressArea: 'Tompokersan, Kec. Lumajang',
    bio: 'Siap antar jemput ramah, helm bersih, dan hafal seluruh jalanan Lumajang.',
    status: 'DISETUJUI',
    isOnline: true,
    todayOrdersCount: 6,
    ratingAvg: 4.9,
    ratingCount: 184,
    completedOrdersCount: 184,
    registeredAt: Date.now() - 30 * 24 * 3600 * 1000,
  },
  {
    id: 'drv-02',
    fullName: 'Slamet Widodo',
    whatsapp: '082298765432',
    username: 'slamet_lumajang',
    passwordHash: '346525d1f8254ce9604977ac3aaf703bf285b08faecfb83dec91063f8ecc8837',
    gender: 'Laki-laki',
    vehicleType: 'Motor Bebek',
    vehicleModel: 'Yamaha Jupiter Z1',
    plateNumber: 'N 2890 AB',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    addressArea: 'Sukodono, Kab. Lumajang',
    bio: 'Pengemudi berpengalaman rute Klakah - Senduro - Kota.',
    status: 'DISETUJUI',
    isOnline: false,
    todayOrdersCount: 3,
    ratingAvg: 4.8,
    ratingCount: 92,
    completedOrdersCount: 92,
    registeredAt: Date.now() - 15 * 24 * 3600 * 1000,
  },
  {
    id: 'drv-03',
    fullName: 'Rian Pratama',
    whatsapp: '085711223344',
    username: 'rian_motor',
    passwordHash: '346525d1f8254ce9604977ac3aaf703bf285b08faecfb83dec91063f8ecc8837',
    gender: 'Laki-laki',
    vehicleType: 'Motor Matic',
    vehicleModel: 'Honda Beat Street',
    plateNumber: 'N 6112 WX',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    addressArea: 'Pasirian, Kab. Lumajang',
    bio: 'Pendaftar mitra baru area Lumajang Selatan.',
    status: 'MENUNGGU VERIFIKASI',
    isOnline: false,
    todayOrdersCount: 0,
    ratingAvg: 5.0,
    ratingCount: 0,
    completedOrdersCount: 0,
    registeredAt: Date.now() - 2 * 3600 * 1000,
  },
];

// Initial Seed Orders
const INITIAL_ORDERS: Order[] = [
  {
    id: 'OL-1024',
    customerName: 'Siti Rahmawati',
    customerPhone: '081399887766',
    serviceType: 'O-RIDE',
    pickupLocation: 'Alun-Alun Lumajang',
    pickupCoords: { lat: -8.1332, lng: 113.2248 },
    dropoffLocation: 'Stasiun Kereta Api Klakah',
    dropoffCoords: { lat: -8.0041, lng: 113.2505 },
    notes: 'Tunggu di depan pos satpam gerbang timur',
    distanceKm: 14.8,
    baseTariff: 8000,
    perKmTariff: 23600, // 11.8 * 2000
    areaSurcharge: 2000,
    totalTariff: 33600,
    status: 'MENUNGGU ADMIN',
    paymentMethod: 'CASH',
    paymentStatus: 'BELUM_BAYAR',
    createdAt: Date.now() - 12 * 60 * 1000,
  },
  {
    id: 'OL-1025',
    customerName: 'Ahmad Fauzi',
    customerPhone: '085233445566',
    serviceType: 'O-RIDE',
    pickupLocation: 'Pasar Baru Serasi Lumajang',
    pickupCoords: { lat: -8.1345, lng: 113.2223 },
    dropoffLocation: 'RSUD dr. Haryoto Lumajang',
    dropoffCoords: { lat: -8.1384, lng: 113.2201 },
    notes: 'Bawa helm satu lagi ya mas',
    distanceKm: 2.1,
    baseTariff: 8000,
    perKmTariff: 0,
    areaSurcharge: 0,
    totalTariff: 8000,
    status: 'READY',
    paymentMethod: 'SALDO',
    paymentStatus: 'DIBAYAR',
    createdAt: Date.now() - 8 * 60 * 1000,
  },
  {
    id: 'OL-1022',
    customerName: 'Dewi Lestari',
    customerPhone: '082155667788',
    serviceType: 'O-RIDE',
    pickupLocation: 'GOR Wira Bhakti Lumajang',
    pickupCoords: { lat: -8.1302, lng: 113.2175 },
    dropoffLocation: 'Terminal Bus Minak Koncar',
    dropoffCoords: { lat: -8.1567, lng: 113.2389 },
    notes: 'Selesai belanja',
    distanceKm: 4.2,
    baseTariff: 8000,
    perKmTariff: 2400, // 1.2 * 2000
    areaSurcharge: 0,
    totalTariff: 10400,
    status: 'SELESAI',
    paymentMethod: 'SALDO',
    paymentStatus: 'DIBAYAR',
    driverId: 'drv-01',
    driverName: 'Budi Santoso',
    driverPhone: '081234567890',
    driverPlate: 'N 4521 YZ',
    driverAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    createdAt: Date.now() - 45 * 60 * 1000,
    acceptedAt: Date.now() - 40 * 60 * 1000,
    completedAt: Date.now() - 15 * 60 * 1000,
    rating: 5,
    review: 'Mantap mas Budi, cepat dan ramah sekali!',
  },
];

// Seed Warung Partners for structured stage 1
export const SEED_WARUNGS: WarungPartner[] = [
  {
    id: 'wrg-01',
    name: 'Warung Rawon Bu Darmi Lumajang',
    category: 'Kuliner Khas & Rawon',
    address: 'Jl. Suwandak No. 12, Ditotrunan, Lumajang',
    phone: '081233441122',
    rating: 4.8,
    isOpen: true,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
    productsCount: 14,
  },
  {
    id: 'wrg-02',
    name: 'Pusat Oleh-Oleh Pisang Agung & Keripik Pasak',
    category: 'Oleh-oleh Khas Lumajang',
    address: 'Jl. Raya Klakah - Lumajang',
    phone: '085277889900',
    rating: 4.9,
    isOpen: true,
    imageUrl: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=400&auto=format&fit=crop&q=80',
    productsCount: 26,
  },
  {
    id: 'wrg-03',
    name: 'Depot Lumajang Asri & Bebek Sinjay',
    category: 'Aneka Nasi & Unggas',
    address: 'Kawasan Wonorejo Terpadu (KWT), Lumajang',
    phone: '081344556677',
    rating: 4.7,
    isOpen: true,
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&auto=format&fit=crop&q=80',
    productsCount: 18,
  },
];

// Subscriber listener type
type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

export function subscribeToStore(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Store Accessors & Mutators
export const DB = {
  // Orders
  getOrders(): Order[] {
    try {
      const raw = localStorage.getItem(STORAGE_ORDERS);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Failed reading orders from storage:', e);
    }
    localStorage.setItem(STORAGE_ORDERS, JSON.stringify(INITIAL_ORDERS));
    return INITIAL_ORDERS;
  },

  saveOrders(orders: Order[]): void {
    localStorage.setItem(STORAGE_ORDERS, JSON.stringify(orders));
    notifyListeners();
  },

  createOrder(orderData: Omit<Order, 'id' | 'status' | 'createdAt'>): Order {
    const orders = this.getOrders();
    const newOrder: Order = {
      ...orderData,
      id: 'OL-' + Math.floor(1000 + Math.random() * 9000),
      status: 'MENUNGGU ADMIN',
      createdAt: Date.now(),
    };

    const updated = [newOrder, ...orders];
    this.saveOrders(updated);

    // Kirim Notifikasi
    this.addNotification(
      createNotification(
        'ADMIN',
        'Order Baru Masuk',
        `Pesanan ${newOrder.id} dari ${newOrder.customerName} (${newOrder.serviceType}) menunggu konfirmasi Ready.`,
        'info',
        newOrder.id
      )
    );

    this.addNotification(
      createNotification(
        'CUSTOMER',
        'Order Berhasil Dibuat',
        `Pesanan ${newOrder.id} telah dikirim ke Admin Ojek Olumajang. Mohon tunggu sesaat.`,
        'success',
        newOrder.id
      )
    );

    return newOrder;
  },

  readyOrder(orderId: string): boolean {
    const orders = this.getOrders();
    const orderIndex = orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) return false;

    orders[orderIndex].status = 'READY';
    this.saveOrders(orders);

    // Notifikasi ke Driver Online
    this.addNotification(
      createNotification(
        'DRIVER',
        'Order Baru Siap Diambil!',
        `Order ${orderId} (${orders[orderIndex].pickupLocation} ➔ ${orders[orderIndex].dropoffLocation}) siap diambil.`,
        'warning',
        orderId
      )
    );

    // Notifikasi ke Customer
    this.addNotification(
      createNotification(
        'CUSTOMER',
        'Pesanan Disiapkan (Ready)',
        `Order ${orderId} telah diverifikasi Admin dan siap diambil driver.`,
        'success',
        orderId
      )
    );

    return true;
  },

  rejectOrder(orderId: string, reason?: string): boolean {
    const orders = this.getOrders();
    const orderIndex = orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) return false;

    orders[orderIndex].status = 'DITOLAK';
    this.saveOrders(orders);

    // Notifikasi ke Customer
    this.addNotification(
      createNotification(
        'CUSTOMER',
        'Pesanan Ditolak',
        `Pesanan ${orderId} tidak dapat diproses oleh Admin. ${reason || 'Silakan pesan ulang atau hubungi WhatsApp Admin.'}`,
        'error',
        orderId
      )
    );

    return true;
  },

  takeOrder(orderId: string, driver: Driver): { success: boolean; error?: string } {
    const orders = this.getOrders();
    const orderIndex = orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) return { success: false, error: 'Order tidak ditemukan' };

    const targetOrder = orders[orderIndex];
    if (targetOrder.status !== 'READY') {
      return { success: false, error: 'Order sudah tidak berstatus Ready atau telah diambil pengemudi lain.' };
    }

    // ========================================================
    // ATURAN AMBIL ORDER: CEK SALDO OPERASIONAL MINIMUM DRIVER
    // ========================================================
    const driverWallet = WalletDB.getWallet(driver.id, 'DRIVER');
    const minBalance = getDriverMinBalance();

    if (driverWallet.balance < minBalance) {
      return {
        success: false,
        error:
          'Saldo Driver tidak mencukupi.\nSilakan isi saldo terlebih dahulu untuk mengambil order.',
      };
    }

    // Driver timer check: jika masih ada timer berjalan
    if (driver.timerEndsAt && driver.timerEndsAt > Date.now()) {
      const remainingSec = Math.ceil((driver.timerEndsAt - Date.now()) / 1000);
      return {
        success: false,
        error: `Anda sedang dalam masa jeda order (${remainingSec} detik tersisa). Mohon tunggu timer selesai.`,
      };
    }

    // Struktur driverFee / driverDeposit (default Rp0 untuk saat ini)
    const feeConfig = getDriverFeeConfig();
    if (feeConfig.driverFee > 0) {
      WalletDB.payWithWallet(
        driver.id,
        'DRIVER',
        feeConfig.driverFee,
        `Biaya Aplikasi / Potongan Order #${orderId}`,
        orderId
      );
    }

    // Update order
    const now = Date.now();
    targetOrder.status = 'DIAMBIL DRIVER';
    targetOrder.driverId = driver.id;
    targetOrder.driverName = driver.fullName;
    targetOrder.driverPhone = driver.whatsapp;
    targetOrder.driverPlate = driver.plateNumber;
    targetOrder.driverAvatar = driver.avatarUrl;
    targetOrder.acceptedAt = now;

    this.saveOrders(orders);

    // Set 5-minute timer pada driver (300 detik)
    const fiveMinutes = 5 * 60 * 1000;
    this.updateDriver(driver.id, {
      activeOrderId: orderId,
      timerEndsAt: now + fiveMinutes,
    });

    // Notifikasi
    this.addNotification(
      createNotification(
        'CUSTOMER',
        'Driver Mengambil Order Anda',
        `Driver ${driver.fullName} (${driver.plateNumber}) siap melayani pesanan ${orderId}.`,
        'success',
        orderId
      )
    );

    this.addNotification(
      createNotification(
        'ADMIN',
        'Driver Mengambil Order',
        `Driver ${driver.fullName} telah mengambil order ${orderId}.`,
        'info',
        orderId
      )
    );

    return { success: true };
  },

  updateOrderStatus(orderId: string, newStatus: OrderStatus): boolean {
    const orders = this.getOrders();
    const orderIndex = orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) return false;

    const order = orders[orderIndex];
    order.status = newStatus;

    if (newStatus === 'SELESAI') {
      order.completedAt = Date.now();
      if (order.driverId) {
        const drv = this.getDriverById(order.driverId);
        if (drv) {
          this.updateDriver(order.driverId, {
            todayOrdersCount: (drv.todayOrdersCount || 0) + 1,
            completedOrdersCount: (drv.completedOrdersCount || 0) + 1,
            activeOrderId: undefined,
          });
        }
      }

      this.addNotification(
        createNotification(
          'CUSTOMER',
          'Perjalanan Selesai',
          `Pesanan ${orderId} telah selesai. Berikan bintang dan ulasan untuk driver Anda!`,
          'success',
          orderId
        )
      );
    } else if (newStatus === 'MENUJU JEMPUT') {
      this.addNotification(
        createNotification(
          'CUSTOMER',
          'Driver Menuju Lokasi Anda',
          `Driver Anda sedang bergerak menuju titik jemput (${order.pickupLocation}).`,
          'info',
          orderId
        )
      );
    } else if (newStatus === 'SAMPAI DI LOKASI') {
      this.addNotification(
        createNotification(
          'CUSTOMER',
          'Driver Sampai di Lokasi Jemput',
          `Driver sudah tiba di titik jemput. Harap bersiap!`,
          'info',
          orderId
        )
      );
    } else if (newStatus === 'DALAM PERJALANAN') {
      this.addNotification(
        createNotification(
          'CUSTOMER',
          'Dalam Perjalanan Menuju Tujuan',
          `Anda sedang dalam perjalanan aman menuju ${order.dropoffLocation}.`,
          'info',
          orderId
        )
      );
    } else if (newStatus === 'DIBATALKAN') {
      if (order.driverId) {
        this.updateDriver(order.driverId, {
          activeOrderId: undefined,
          timerEndsAt: undefined,
        });
      }

      this.addNotification(
        createNotification(
          'DRIVER',
          'Order Dibatalkan',
          `Pesanan ${orderId} telah dibatalkan.`,
          'warning',
          orderId
        )
      );
      this.addNotification(
        createNotification(
          'ADMIN',
          'Order Dibatalkan',
          `Pesanan ${orderId} telah dibatalkan.`,
          'warning',
          orderId
        )
      );
    }

    this.saveOrders(orders);
    return true;
  },

  rateOrder(orderId: string, rating: number, review?: string): boolean {
    const orders = this.getOrders();
    const orderIndex = orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) return false;

    const order = orders[orderIndex];
    if (order.rating !== undefined) {
      return false; // Hanya boleh 1 kali rating
    }

    order.rating = rating;
    order.review = review;
    this.saveOrders(orders);

    // Update rata-rata rating driver
    if (order.driverId) {
      const driver = this.getDriverById(order.driverId);
      if (driver) {
        const prevCount = driver.ratingCount || 0;
        const prevAvg = driver.ratingAvg || 5.0;
        const newCount = prevCount + 1;
        const newAvg = Number(((prevAvg * prevCount + rating) / newCount).toFixed(1));

        this.updateDriver(order.driverId, {
          ratingAvg: newAvg,
          ratingCount: newCount,
        });
      }
    }

    return true;
  },

  deleteOrder(orderId: string): boolean {
    const orders = this.getOrders().filter((o) => o.id !== orderId);
    this.saveOrders(orders);
    return true;
  },

  // Drivers
  getDrivers(): Driver[] {
    try {
      const raw = localStorage.getItem(STORAGE_DRIVERS);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Failed reading drivers from storage:', e);
    }
    localStorage.setItem(STORAGE_DRIVERS, JSON.stringify(INITIAL_DRIVERS));
    return INITIAL_DRIVERS;
  },

  saveDrivers(drivers: Driver[]): void {
    localStorage.setItem(STORAGE_DRIVERS, JSON.stringify(drivers));
    notifyListeners();
  },

  getDriverById(id: string): Driver | undefined {
    return this.getDrivers().find((d) => d.id === id);
  },

  updateDriver(driverId: string, partial: Partial<Driver>): boolean {
    const drivers = this.getDrivers();
    const idx = drivers.findIndex((d) => d.id === driverId);
    if (idx === -1) return false;

    drivers[idx] = { ...drivers[idx], ...partial };
    this.saveDrivers(drivers);
    return true;
  },

  registerDriver(
    formData: Omit<
      Driver,
      | 'id'
      | 'status'
      | 'isOnline'
      | 'todayOrdersCount'
      | 'ratingAvg'
      | 'ratingCount'
      | 'completedOrdersCount'
      | 'registeredAt'
    >
  ): Driver {
    const drivers = this.getDrivers();
    const newDriver: Driver = {
      ...formData,
      id: 'drv-' + Math.floor(10 + Math.random() * 90),
      status: 'MENUNGGU VERIFIKASI',
      isOnline: false,
      todayOrdersCount: 0,
      ratingAvg: 5.0,
      ratingCount: 0,
      completedOrdersCount: 0,
      registeredAt: Date.now(),
    };

    const updated = [...drivers, newDriver];
    this.saveDrivers(updated);

    // Notifikasi ke Admin
    this.addNotification(
      createNotification(
        'ADMIN',
        'Pendaftaran Driver Baru',
        `Mitra baru ${newDriver.fullName} (${newDriver.vehicleModel}) mendaftar dan menunggu verifikasi.`,
        'info'
      )
    );

    return newDriver;
  },

  approveDriver(driverId: string): boolean {
    return this.updateDriver(driverId, { status: 'DISETUJUI' });
  },

  rejectDriver(driverId: string): boolean {
    return this.updateDriver(driverId, { status: 'DITOLAK' });
  },

  suspendDriver(driverId: string): boolean {
    return this.updateDriver(driverId, { status: 'NONAKTIF', isOnline: false });
  },

  activateDriver(driverId: string): boolean {
    return this.updateDriver(driverId, { status: 'DISETUJUI' });
  },

  deleteDriver(driverId: string): boolean {
    const filtered = this.getDrivers().filter((d) => d.id !== driverId);
    this.saveDrivers(filtered);
    return true;
  },

  resetDriverTimer(driverId: string): boolean {
    return this.updateDriver(driverId, { timerEndsAt: undefined });
  },

  // Tariff Configuration
  getTariffConfig(): TariffConfig {
    try {
      const raw = localStorage.getItem(STORAGE_TARIFF);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_TARIFF_CONFIG;
  },

  saveTariffConfig(config: TariffConfig): void {
    localStorage.setItem(STORAGE_TARIFF, JSON.stringify(config));
    notifyListeners();
  },

  // Admin WhatsApp Number
  getAdminWhatsApp(): string {
    return localStorage.getItem(STORAGE_ADMIN_WA) || ADMIN_WHATSAPP;
  },

  saveAdminWhatsApp(phone: string): void {
    localStorage.setItem(STORAGE_ADMIN_WA, phone);
    notifyListeners();
  },

  // Notifications
  getNotifications(): AppNotification[] {
    try {
      const raw = localStorage.getItem(STORAGE_NOTIFS);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }
    return [];
  },

  addNotification(notif: AppNotification): void {
    const list = [notif, ...this.getNotifications()].slice(0, 50); // limit 50
    localStorage.setItem(STORAGE_NOTIFS, JSON.stringify(list));
    notifyListeners();
  },

  markAllNotificationsRead(): void {
    const list = this.getNotifications().map((n) => ({ ...n, read: true }));
    localStorage.setItem(STORAGE_NOTIFS, JSON.stringify(list));
    notifyListeners();
  },

  clearNotifications(): void {
    localStorage.removeItem(STORAGE_NOTIFS);
    notifyListeners();
  },

  // User Role
  getCurrentRole(): UserRole {
    return (localStorage.getItem(STORAGE_ROLE) as UserRole) || 'CUSTOMER';
  },

  setCurrentRole(role: UserRole): void {
    localStorage.setItem(STORAGE_ROLE, role);
    notifyListeners();
  },
};
