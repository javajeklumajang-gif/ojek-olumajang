import { Wallet, WalletRole, WalletTransaction, TransactionType, TransactionStatus } from '../types';

const STORAGE_WALLETS = 'ojek_olumajang_wallets_v1';
const STORAGE_TRANSACTIONS = 'ojek_olumajang_transactions_v1';

// Seed Wallets untuk simulasi Preview
const INITIAL_WALLETS: Wallet[] = [
  {
    walletId: 'w-cust-01',
    userId: 'cust-01',
    role: 'CUSTOMER',
    balance: 50000, // Saldo awal customer untuk uji coba
    createdAt: Date.now() - 7 * 24 * 3600 * 1000,
    updatedAt: Date.now() - 1 * 3600 * 1000,
  },
  {
    walletId: 'w-drv-01',
    userId: 'drv-01',
    role: 'DRIVER',
    balance: 45000,
    createdAt: Date.now() - 14 * 24 * 3600 * 1000,
    updatedAt: Date.now() - 2 * 3600 * 1000,
  },
  {
    walletId: 'w-wrg-01',
    userId: 'wrg-01',
    role: 'WARUNG',
    balance: 125000,
    createdAt: Date.now() - 20 * 24 * 3600 * 1000,
    updatedAt: Date.now() - 3 * 3600 * 1000,
  },
];

// Seed Riwayat Transaksi awal
const INITIAL_TRANSACTIONS: WalletTransaction[] = [
  {
    transactionId: 'TX-1001',
    walletId: 'w-cust-01',
    userId: 'cust-01',
    role: 'CUSTOMER',
    type: 'TOP_UP',
    amount: 50000,
    description: 'Top Up Saldo via Preview (Simulasi)',
    status: 'SUCCESS',
    createdAt: Date.now() - 2 * 24 * 3600 * 1000,
  },
  {
    transactionId: 'TX-1002',
    walletId: 'w-wrg-01',
    userId: 'wrg-01',
    role: 'WARUNG',
    type: 'WARUNG_EARNING',
    amount: 75000,
    description: 'Pendapatan Pesanan O-FOOD #OF-891',
    status: 'SUCCESS',
    referenceId: 'OF-891',
    createdAt: Date.now() - 1 * 24 * 3600 * 1000,
  },
  {
    transactionId: 'TX-1003',
    walletId: 'w-drv-01',
    userId: 'drv-01',
    role: 'DRIVER',
    type: 'DRIVER_EARNING',
    amount: 25000,
    description: 'Bagi Hasil Order #OL-1022',
    status: 'SUCCESS',
    referenceId: 'OL-1022',
    createdAt: Date.now() - 3 * 3600 * 1000,
  },
];

type WalletListener = () => void;
const walletListeners = new Set<WalletListener>();

function notifyWalletListeners() {
  walletListeners.forEach((fn) => fn());
}

export function subscribeToWallet(listener: WalletListener): () => void {
  walletListeners.add(listener);
  return () => {
    walletListeners.delete(listener);
  };
}

export const WalletDB = {
  // Ambil semua wallet dari storage
  getAllWallets(): Wallet[] {
    try {
      const raw = localStorage.getItem(STORAGE_WALLETS);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Error reading wallets:', e);
    }
    localStorage.setItem(STORAGE_WALLETS, JSON.stringify(INITIAL_WALLETS));
    return INITIAL_WALLETS;
  },

  // Simpan daftar wallet
  saveWallets(wallets: Wallet[]): void {
    localStorage.setItem(STORAGE_WALLETS, JSON.stringify(wallets));
    notifyWalletListeners();
  },

  // Ambil atau inisialisasi wallet berdasarkan userId & role
  getWallet(userId: string = 'cust-01', role: WalletRole = 'CUSTOMER'): Wallet {
    const wallets = this.getAllWallets();
    let found = wallets.find((w) => w.userId === userId && w.role === role);
    if (!found) {
      // Buat wallet baru jika belum ada
      found = {
        walletId: `w-${role.toLowerCase()}-${userId}`,
        userId,
        role,
        balance: role === 'CUSTOMER' ? 50000 : 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      wallets.push(found);
      this.saveWallets(wallets);
    }
    return found;
  },

  // Perbarui saldo wallet
  updateWallet(wallet: Wallet): void {
    const wallets = this.getAllWallets();
    const idx = wallets.findIndex((w) => w.walletId === wallet.walletId);
    if (idx !== -1) {
      wallets[idx] = { ...wallet, updatedAt: Date.now() };
    } else {
      wallets.push({ ...wallet, updatedAt: Date.now() });
    }
    this.saveWallets(wallets);
  },

  // Ambil semua transaksi
  getAllTransactions(): WalletTransaction[] {
    try {
      const raw = localStorage.getItem(STORAGE_TRANSACTIONS);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Error reading transactions:', e);
    }
    localStorage.setItem(STORAGE_TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
    return INITIAL_TRANSACTIONS;
  },

  // Simpan daftar transaksi
  saveTransactions(transactions: WalletTransaction[]): void {
    localStorage.setItem(STORAGE_TRANSACTIONS, JSON.stringify(transactions));
    notifyWalletListeners();
  },

  // Ambil riwayat transaksi spesifik user & role
  getTransactions(userId?: string, role?: WalletRole): WalletTransaction[] {
    const all = this.getAllTransactions();
    return all
      .filter((t) => {
        if (userId && t.userId !== userId) return false;
        if (role && t.role !== role) return false;
        return true;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  // Top Up Saldo (Simulasi Mock untuk Preview)
  topUp(
    userId: string,
    role: WalletRole,
    amount: number,
    note?: string
  ): { success: boolean; wallet: Wallet; transaction: WalletTransaction } {
    const wallet = this.getWallet(userId, role);
    const newBalance = wallet.balance + amount;
    const updatedWallet: Wallet = {
      ...wallet,
      balance: newBalance,
      updatedAt: Date.now(),
    };
    this.updateWallet(updatedWallet);

    const transaction: WalletTransaction = {
      transactionId: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      walletId: wallet.walletId,
      userId,
      role,
      type: 'TOP_UP',
      amount,
      description: note || `Top Up Saldo ${role === 'WARUNG' ? 'Warung' : 'Pelanggan'} (Simulasi Mock Preview)`,
      status: 'SUCCESS',
      createdAt: Date.now(),
    };

    const allTx = [transaction, ...this.getAllTransactions()];
    this.saveTransactions(allTx);

    return { success: true, wallet: updatedWallet, transaction };
  },

  // Bayar menggunakan Saldo (Simulasi Mock)
  // Dilengkapi validasi agar saldo tidak pernah negatif
  payWithWallet(
    userId: string,
    role: WalletRole,
    amount: number,
    description: string,
    referenceId?: string
  ): { success: boolean; error?: string; wallet?: Wallet; transaction?: WalletTransaction } {
    const wallet = this.getWallet(userId, role);

    if (wallet.balance < amount) {
      return {
        success: false,
        error: `Saldo tidak cukup (Tersedia: Rp${wallet.balance.toLocaleString('id-ID')}). Silakan pilih Cash atau Top Up.`,
      };
    }

    const newBalance = Math.max(0, wallet.balance - amount);
    const updatedWallet: Wallet = {
      ...wallet,
      balance: newBalance,
      updatedAt: Date.now(),
    };
    this.updateWallet(updatedWallet);

    const transaction: WalletTransaction = {
      transactionId: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      walletId: wallet.walletId,
      userId,
      role,
      type: 'ORDER_PAYMENT',
      amount: -amount,
      description,
      status: 'SUCCESS',
      referenceId,
      createdAt: Date.now(),
    };

    const allTx = [transaction, ...this.getAllTransactions()];
    this.saveTransactions(allTx);

    return { success: true, wallet: updatedWallet, transaction };
  },

  // Tambah Pendapatan / Earning (untuk Warung / Driver)
  creditWallet(
    userId: string,
    role: WalletRole,
    amount: number,
    type: TransactionType,
    description: string,
    referenceId?: string
  ): { success: boolean; wallet: Wallet; transaction: WalletTransaction } {
    const wallet = this.getWallet(userId, role);
    const newBalance = wallet.balance + amount;
    const updatedWallet: Wallet = {
      ...wallet,
      balance: newBalance,
      updatedAt: Date.now(),
    };
    this.updateWallet(updatedWallet);

    const transaction: WalletTransaction = {
      transactionId: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      walletId: wallet.walletId,
      userId,
      role,
      type,
      amount,
      description,
      status: 'SUCCESS',
      referenceId,
      createdAt: Date.now(),
    };

    const allTx = [transaction, ...this.getAllTransactions()];
    this.saveTransactions(allTx);

    return { success: true, wallet: updatedWallet, transaction };
  },
};
