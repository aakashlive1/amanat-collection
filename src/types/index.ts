export type UserRole = 'admin' | 'collector';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  password?: string;
  canCollectAll: boolean; // if true, can collect from any member; if false, only assigned members
  canVerifyPayments: boolean; // if true, Super Admin has allowed this collector to verify/approve online UPI payments
  isActive: boolean;
  createdAt: string;
}

export interface Member {
  id: string;
  code: string; // e.g. "AC-1001"
  name: string;
  phone: string;
  address?: string;
  dailyAmount: number; // Configurable fixed daily amount
  assignedCollectorId: string;
  uniqueToken: string; // for public URL /m/:uniqueToken
  pin: string; // 4-digit security PIN (hashed or stored)
  isActive: boolean;
  createdAt: string;
}

export type PaymentMode = 'cash' | 'online';
export type PaymentStatus = 'completed' | 'pending_verification' | 'rejected';

export interface Transaction {
  id: string;
  memberId: string;
  collectorId?: string | null; // null if paid directly by member
  amount: number;
  paymentMode: PaymentMode;
  status: PaymentStatus;
  utrNumber?: string;
  notes?: string;
  verifiedBy?: string; // User ID who verified against bank statement
  verifiedAt?: string;
  rejectionReason?: string;
  collectionDate: string; // YYYY-MM-DD
  createdAt: string;
}

export type SettlementStatus = 'pending' | 'approved' | 'discrepancy';

export interface CashSettlement {
  id: string;
  collectorId: string;
  settlementDate: string; // YYYY-MM-DD
  cashCollected: number;
  cashSubmitted: number;
  status: SettlementStatus;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface AppSettings {
  upiVpa: string; // e.g. "amanatcollection@okaxis"
  upiName: string; // e.g. "Amanat Collection"
  appName: string;
  supportPhone: string;
  currencySymbol: string;
}
