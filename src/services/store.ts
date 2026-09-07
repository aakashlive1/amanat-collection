import { User, Member, Transaction, CashSettlement, AppSettings, PaymentMode, SettlementStatus } from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_USERS,
  INITIAL_MEMBERS,
  INITIAL_TRANSACTIONS,
  INITIAL_SETTLEMENTS,
} from './mockData';
import { getTodayDateString } from '../utils/formatters';

const STORAGE_KEYS = {
  SETTINGS: 'amanat_settings',
  USERS: 'amanat_users',
  MEMBERS: 'amanat_members',
  TRANSACTIONS: 'amanat_transactions',
  SETTLEMENTS: 'amanat_settlements',
  AUTH_USER: 'amanat_auth_user',
};

class DataStore {
  private get<T>(key: string, fallback: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      // Notify listeners about data change
      window.dispatchEvent(new CustomEvent('amanat_store_update', { detail: { key } }));
    } catch (e) {
      console.error('Storage quota exceeded or error:', e);
    }
  }

  // Auth User
  getAuthUser(): User | null {
    return this.get<User | null>(STORAGE_KEYS.AUTH_USER, null);
  }

  setAuthUser(user: User | null): void {
    this.set(STORAGE_KEYS.AUTH_USER, user);
  }

  login(phone: string, role?: 'admin' | 'collector'): User | null {
    const users = this.getUsers();
    const cleanPhone = phone.trim();
    const user = users.find(u => u.phone === cleanPhone && (!role || u.role === role) && u.isActive);
    if (user) {
      this.setAuthUser(user);
      return user;
    }
    return null;
  }

  logout(): void {
    this.setAuthUser(null);
  }

  // App Settings
  getSettings(): AppSettings {
    return this.get<AppSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }

  updateSettings(settings: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    this.set(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  }

  // Users (Admin / Collectors)
  getUsers(): User[] {
    return this.get<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  getCollectors(): User[] {
    return this.getUsers().filter(u => u.role === 'collector');
  }

  saveCollector(collector: Partial<User> & { name: string; phone: string }): User {
    const users = this.getUsers();
    if (collector.id) {
      const updated = users.map(u => (u.id === collector.id ? { ...u, ...collector } as User : u));
      this.set(STORAGE_KEYS.USERS, updated);
      return updated.find(u => u.id === collector.id)!;
    } else {
      const newUser: User = {
        id: `u-coll-${Date.now()}`,
        name: collector.name,
        phone: collector.phone,
        role: 'collector',
        canCollectAll: collector.canCollectAll ?? false,
        canVerifyPayments: collector.canVerifyPayments ?? false,
        isActive: collector.isActive ?? true,
        createdAt: new Date().toISOString(),
      };
      this.set(STORAGE_KEYS.USERS, [newUser, ...users]);
      return newUser;
    }
  }

  toggleCollectorStatus(id: string): void {
    const users = this.getUsers();
    const updated = users.map(u => (u.id === id ? { ...u, isActive: !u.isActive } : u));
    this.set(STORAGE_KEYS.USERS, updated);
  }

  toggleCollectorCanCollectAll(id: string): void {
    const users = this.getUsers();
    const updated = users.map(u => (u.id === id ? { ...u, canCollectAll: !u.canCollectAll } : u));
    this.set(STORAGE_KEYS.USERS, updated);
  }

  toggleCollectorCanVerifyPayments(id: string): void {
    const users = this.getUsers();
    const updated = users.map(u => (u.id === id ? { ...u, canVerifyPayments: !u.canVerifyPayments } : u));
    this.set(STORAGE_KEYS.USERS, updated);
  }

  // Members
  getMembers(): Member[] {
    return this.get<Member[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
  }

  getMemberById(id: string): Member | undefined {
    return this.getMembers().find(m => m.id === id);
  }

  getMemberByToken(token: string): Member | undefined {
    return this.getMembers().find(m => m.uniqueToken === token.toLowerCase().trim());
  }

  saveMember(memberData: Partial<Member> & { name: string; phone: string; dailyAmount: number }): Member {
    const members = this.getMembers();
    if (memberData.id) {
      const updated = members.map(m => (m.id === memberData.id ? { ...m, ...memberData } as Member : m));
      this.set(STORAGE_KEYS.MEMBERS, updated);
      return updated.find(m => m.id === memberData.id)!;
    } else {
      // Auto-generate code if not provided
      const nextCodeNumber = members.length + 101;
      const code = memberData.code?.trim() || `AC-${nextCodeNumber}`;
      const token = (memberData.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + Math.floor(100 + Math.random() * 900));

      const newMember: Member = {
        id: `m-${Date.now()}`,
        code,
        name: memberData.name.trim(),
        phone: memberData.phone.trim(),
        address: memberData.address?.trim() || '',
        dailyAmount: Number(memberData.dailyAmount) || 0,
        assignedCollectorId: memberData.assignedCollectorId || '',
        uniqueToken: memberData.uniqueToken?.trim() || token,
        pin: memberData.pin?.trim() || '1234',
        isActive: memberData.isActive ?? true,
        createdAt: new Date().toISOString(),
      };
      this.set(STORAGE_KEYS.MEMBERS, [newMember, ...members]);
      return newMember;
    }
  }

  updateMemberDailyAmount(id: string, newAmount: number): void {
    const members = this.getMembers();
    const updated = members.map(m => (m.id === id ? { ...m, dailyAmount: Number(newAmount) } : m));
    this.set(STORAGE_KEYS.MEMBERS, updated);
  }

  toggleMemberStatus(id: string): void {
    const members = this.getMembers();
    const updated = members.map(m => (m.id === id ? { ...m, isActive: !m.isActive } : m));
    this.set(STORAGE_KEYS.MEMBERS, updated);
  }

  // Transactions
  getTransactions(): Transaction[] {
    return this.get<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
  }

  getMemberTransactions(memberId: string): Transaction[] {
    return this.getTransactions()
      .filter(t => t.memberId === memberId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  addTransaction(data: {
    memberId: string;
    collectorId?: string | null;
    amount: number;
    paymentMode: PaymentMode;
    utrNumber?: string;
    notes?: string;
    status?: 'completed' | 'pending_verification';
  }): Transaction {
    const transactions = this.getTransactions();
    const newTx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      memberId: data.memberId,
      collectorId: data.collectorId || null,
      amount: Number(data.amount),
      paymentMode: data.paymentMode,
      status: data.status || 'completed',
      utrNumber: data.utrNumber?.trim(),
      notes: data.notes?.trim(),
      collectionDate: getTodayDateString(),
      createdAt: new Date().toISOString(),
    };

    this.set(STORAGE_KEYS.TRANSACTIONS, [newTx, ...transactions]);
    return newTx;
  }

  verifyOnlineTransaction(txId: string, verifierUserId: string, notes?: string): void {
    const transactions = this.getTransactions();
    const updated = transactions.map(t => {
      if (t.id === txId) {
        return {
          ...t,
          status: 'completed' as const,
          verifiedBy: verifierUserId,
          verifiedAt: new Date().toISOString(),
          notes: notes !== undefined ? notes : t.notes,
        };
      }
      return t;
    });
    this.set(STORAGE_KEYS.TRANSACTIONS, updated);
  }

  rejectOnlineTransaction(txId: string, verifierUserId: string, reason: string): void {
    const transactions = this.getTransactions();
    const updated = transactions.map(t => {
      if (t.id === txId) {
        return {
          ...t,
          status: 'rejected' as const,
          verifiedBy: verifierUserId,
          verifiedAt: new Date().toISOString(),
          rejectionReason: reason,
        };
      }
      return t;
    });
    this.set(STORAGE_KEYS.TRANSACTIONS, updated);
  }

  // Settlements (Daily cash handover)
  getSettlements(): CashSettlement[] {
    return this.get<CashSettlement[]>(STORAGE_KEYS.SETTLEMENTS, INITIAL_SETTLEMENTS);
  }

  createSettlement(data: {
    collectorId: string;
    cashCollected: number;
    cashSubmitted: number;
    notes?: string;
  }): CashSettlement {
    const settlements = this.getSettlements();
    const newSettlement: CashSettlement = {
      id: `set-${Date.now()}`,
      collectorId: data.collectorId,
      settlementDate: getTodayDateString(),
      cashCollected: data.cashCollected,
      cashSubmitted: data.cashSubmitted,
      status: 'pending',
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };

    this.set(STORAGE_KEYS.SETTLEMENTS, [newSettlement, ...settlements]);
    return newSettlement;
  }

  updateSettlementStatus(id: string, status: SettlementStatus, adminId: string, notes?: string): void {
    const settlements = this.getSettlements();
    const updated = settlements.map(s => {
      if (s.id === id) {
        return {
          ...s,
          status,
          approvedBy: adminId,
          approvedAt: new Date().toISOString(),
          notes: notes !== undefined ? notes : s.notes,
        };
      }
      return s;
    });
    this.set(STORAGE_KEYS.SETTLEMENTS, updated);
  }

  // Statistics calculation helpers
  getCollectorTodayStats(collectorId: string) {
    const today = getTodayDateString();
    const transactions = this.getTransactions().filter(
      t => t.collectorId === collectorId && t.collectionDate === today && t.status === 'completed'
    );

    const cashCollected = transactions
      .filter(t => t.paymentMode === 'cash')
      .reduce((acc, t) => acc + t.amount, 0);

    const onlineCollected = transactions
      .filter(t => t.paymentMode === 'online')
      .reduce((acc, t) => acc + t.amount, 0);

    const totalCollected = cashCollected + onlineCollected;
    const collectedMemberIds = new Set(transactions.map(t => t.memberId));

    // Get today's settlement status if submitted
    const settlement = this.getSettlements().find(
      s => s.collectorId === collectorId && s.settlementDate === today
    );

    const collector = this.getUsers().find(u => u.id === collectorId);
    const pendingOnlineTransactions = this.getTransactions().filter(t => {
      if (t.status !== 'pending_verification') return false;
      if (!collector?.canVerifyPayments) return false;
      if (collector.canCollectAll) return true;
      const member = this.getMemberById(t.memberId);
      return member?.assignedCollectorId === collectorId;
    });

    return {
      today,
      totalCollected,
      cashCollected,
      onlineCollected,
      collectedCount: collectedMemberIds.size,
      transactions,
      settlement,
      pendingOnlineCount: pendingOnlineTransactions.length,
    };
  }

  getTodayAdminStats() {
    const today = getTodayDateString();
    const allMembers = this.getMembers().filter(m => m.isActive);
    const todayTransactions = this.getTransactions().filter(
      t => t.collectionDate === today && t.status === 'completed'
    );

    const totalAmount = todayTransactions.reduce((acc, t) => acc + t.amount, 0);
    const cashAmount = todayTransactions
      .filter(t => t.paymentMode === 'cash')
      .reduce((acc, t) => acc + t.amount, 0);
    const onlineAmount = todayTransactions
      .filter(t => t.paymentMode === 'online')
      .reduce((acc, t) => acc + t.amount, 0);

    const paidMemberIds = new Set(todayTransactions.map(t => t.memberId));
    const pendingMembers = allMembers.filter(m => !paidMemberIds.has(m.id));

    // Pending settlements to approve
    const pendingSettlements = this.getSettlements().filter(s => s.status === 'pending');

    // Pending online verification transactions (members who submitted UTR)
    const pendingOnlineTransactions = this.getTransactions().filter(
      t => t.status === 'pending_verification'
    );

    return {
      today,
      totalAmount,
      cashAmount,
      onlineAmount,
      totalMembers: allMembers.length,
      paidMembersCount: paidMemberIds.size,
      pendingMembersCount: pendingMembers.length,
      pendingSettlementsCount: pendingSettlements.length,
      pendingOnlineCount: pendingOnlineTransactions.length,
      todayTransactions,
    };
  }

  resetToDemo(): void {
    localStorage.clear();
    this.set(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    this.set(STORAGE_KEYS.USERS, INITIAL_USERS);
    this.set(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
    this.set(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    this.set(STORAGE_KEYS.SETTLEMENTS, INITIAL_SETTLEMENTS);
    this.setAuthUser(INITIAL_USERS[0]); // default to admin
  }
}

export const store = new DataStore();
