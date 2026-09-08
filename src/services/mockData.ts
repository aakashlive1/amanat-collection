import { User, Member, Transaction, CashSettlement, AppSettings } from '../types';
import { getTodayDateString } from '../utils/formatters';

export const INITIAL_SETTINGS: AppSettings = {
  upiVpa: 'amanatcollection@okaxis',
  upiName: 'Amanat Collection',
  appName: 'Amanat Collection',
  supportPhone: '9876543210',
  currencySymbol: '₹',
};

export const INITIAL_USERS: User[] = [
  {
    id: 'u-admin-1',
    name: 'Amanat Super Admin',
    phone: '9876543210',
    role: 'admin',
    password: 'admin123',
    canCollectAll: true,
    canVerifyPayments: true,
    isActive: true,
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'u-coll-1',
    name: 'Rajesh Kumar',
    phone: '9822011111',
    role: 'collector',
    password: 'coll123',
    canCollectAll: true, // Super Admin granted all-members access
    canVerifyPayments: true, // Super Admin granted online verification rights
    isActive: true,
    createdAt: '2026-09-01T11:00:00Z',
  },
  {
    id: 'u-coll-2',
    name: 'Vikram Singh',
    phone: '9822022222',
    role: 'collector',
    password: 'coll123',
    canCollectAll: false, // Only assigned members
    canVerifyPayments: false, // Cannot verify online payments
    isActive: true,
    createdAt: '2026-09-02T10:00:00Z',
  },
];

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'm-1',
    code: 'AC-101',
    name: 'Ramesh Sharma',
    phone: '9811100001',
    address: 'Shop No. 4, Market Road',
    dailyAmount: 500,
    assignedCollectorId: 'u-coll-1',
    uniqueToken: 'ramesh-101',
    pin: '1234',
    isActive: true,
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'm-2',
    code: 'AC-102',
    name: 'Sunita Verma',
    phone: '9811100002',
    address: 'B-12, Gandhi Nagar',
    dailyAmount: 200,
    assignedCollectorId: 'u-coll-1',
    uniqueToken: 'sunita-102',
    pin: '1234',
    isActive: true,
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'm-3',
    code: 'AC-103',
    name: 'Mohammad Aslam',
    phone: '9811100003',
    address: 'Old City Chowk',
    dailyAmount: 300,
    assignedCollectorId: 'u-coll-1',
    uniqueToken: 'aslam-103',
    pin: '1234',
    isActive: true,
    createdAt: '2026-09-02T10:00:00Z',
  },
  {
    id: 'm-4',
    code: 'AC-104',
    name: 'Pooja Gupta',
    phone: '9811100004',
    address: 'Sector 5, Station Road',
    dailyAmount: 100,
    assignedCollectorId: 'u-coll-2',
    uniqueToken: 'pooja-104',
    pin: '1234',
    isActive: true,
    createdAt: '2026-09-02T10:00:00Z',
  },
  {
    id: 'm-5',
    code: 'AC-105',
    name: 'Deepak Jain',
    phone: '9811100005',
    address: 'Cloth Market, Shop 22',
    dailyAmount: 1000,
    assignedCollectorId: 'u-coll-2',
    uniqueToken: 'deepak-105',
    pin: '1234',
    isActive: true,
    createdAt: '2026-09-03T10:00:00Z',
  },
  {
    id: 'm-6',
    code: 'AC-106',
    name: 'Amit Patel',
    phone: '9811100006',
    address: 'Near Bus Stand',
    dailyAmount: 250,
    assignedCollectorId: 'u-coll-2',
    uniqueToken: 'amit-106',
    pin: '1234',
    isActive: true,
    createdAt: '2026-09-03T10:00:00Z',
  },
];

const today = getTodayDateString();

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // Past transactions for Member 1
  {
    id: 'tx-1',
    memberId: 'm-1',
    collectorId: 'u-coll-1',
    amount: 500,
    paymentMode: 'cash',
    status: 'completed',
    collectionDate: '2026-09-04',
    createdAt: '2026-09-04T11:15:00Z',
  },
  {
    id: 'tx-2',
    memberId: 'm-1',
    collectorId: 'u-coll-1',
    amount: 500,
    paymentMode: 'online',
    status: 'completed',
    utrNumber: 'UPI5920381920',
    collectionDate: '2026-09-05',
    createdAt: '2026-09-05T12:00:00Z',
  },
  // Past transactions for Member 2
  {
    id: 'tx-3',
    memberId: 'm-2',
    collectorId: 'u-coll-1',
    amount: 200,
    paymentMode: 'cash',
    status: 'completed',
    collectionDate: '2026-09-05',
    createdAt: '2026-09-05T10:30:00Z',
  },
  // Member 5 past
  {
    id: 'tx-4',
    memberId: 'm-5',
    collectorId: 'u-coll-2',
    amount: 1000,
    paymentMode: 'cash',
    status: 'completed',
    collectionDate: '2026-09-05',
    createdAt: '2026-09-05T14:20:00Z',
  },
  // Today sample transaction (completed)
  {
    id: 'tx-5',
    memberId: 'm-1',
    collectorId: 'u-coll-1',
    amount: 500,
    paymentMode: 'cash',
    status: 'completed',
    collectionDate: today,
    createdAt: `${today}T10:00:00Z`,
  },
  // Today sample pending verification transaction (self-paid online with UTR)
  {
    id: 'tx-6',
    memberId: 'm-3',
    collectorId: null,
    amount: 300,
    paymentMode: 'online',
    status: 'pending_verification',
    utrNumber: '429381029384',
    notes: 'Member paid via Google Pay, waiting for bank statement verification',
    collectionDate: today,
    createdAt: `${today}T11:30:00Z`,
  },
];

export const INITIAL_SETTLEMENTS: CashSettlement[] = [
  {
    id: 'set-1',
    collectorId: 'u-coll-1',
    settlementDate: '2026-09-05',
    cashCollected: 700,
    cashSubmitted: 700,
    status: 'approved',
    notes: 'Verified and matched with cash bag.',
    approvedBy: 'u-admin-1',
    approvedAt: '2026-09-05T19:30:00Z',
    createdAt: '2026-09-05T19:00:00Z',
  },
];
