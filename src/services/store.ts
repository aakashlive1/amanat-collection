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
  DELETED_MEMBER_IDS: 'amanat_deleted_member_ids',
  DELETED_USER_IDS: 'amanat_deleted_user_ids',
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

  private async postApi(endpoint: string, data: unknown) {
    try {
      await fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {
      // Offline fallback
    }
  }

  private async deleteApi(endpoint: string, data: unknown) {
    try {
      await fetch(`/api/${endpoint}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {
      // Offline fallback
    }
  }

  getDeletedMemberIds(): string[] {
    return this.get<string[]>(STORAGE_KEYS.DELETED_MEMBER_IDS, []);
  }

  getDeletedUserIds(): string[] {
    return this.get<string[]>(STORAGE_KEYS.DELETED_USER_IDS, []);
  }

  private addDeletedMemberId(id: string): void {
    const list = this.getDeletedMemberIds();
    if (!list.includes(id)) {
      this.set(STORAGE_KEYS.DELETED_MEMBER_IDS, [...list, id]);
    }
  }

  private addDeletedUserId(id: string): void {
    const list = this.getDeletedUserIds();
    if (!list.includes(id)) {
      this.set(STORAGE_KEYS.DELETED_USER_IDS, [...list, id]);
    }
  }

  async syncWithCloud(): Promise<void> {
    try {
      const localTransactions = this.getTransactions();
      const localMembers = this.getMembers();

      let data: any = null;
      try {
        const res = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            localTransactions: localTransactions.slice(0, 50),
            localMembers: localMembers.slice(0, 50),
            deletedMemberIds: this.getDeletedMemberIds(),
            deletedUserIds: this.getDeletedUserIds(),
          }),
        });
        if (res.ok) {
          data = await res.json();
        }
      } catch {
        // fall back to GET bootstrap
      }

      if (!data) {
        const bootstrapRes = await fetch('/api/bootstrap').catch(() => null);
        if (bootstrapRes && bootstrapRes.ok) {
          data = await bootstrapRes.json();
        }
      }

      if (!data) return;

      // Merge server deleted lists
      if (Array.isArray(data.deletedMemberIds)) {
        data.deletedMemberIds.forEach((id: string) => this.addDeletedMemberId(id));
      }
      if (Array.isArray(data.deletedUserIds)) {
        data.deletedUserIds.forEach((id: string) => this.addDeletedUserId(id));
      }
      const deletedMemberSet = new Set(this.getDeletedMemberIds());
      const deletedUserSet = new Set(this.getDeletedUserIds());

      if (data.users && Array.isArray(data.users)) {
        const mappedUsers = data.users
          .filter((u: any) => !deletedUserSet.has(u.id))
          .map((u: any) => ({
            id: u.id,
            name: u.name,
            phone: u.phone,
            role: u.role,
            password: u.password || u.password_hash || (u.role === 'admin' ? 'admin123' : 'coll123'),
            canCollectAll: u.canCollectAll !== undefined ? Boolean(u.canCollectAll) : Boolean(u.can_collect_all),
            canVerifyPayments: u.canVerifyPayments !== undefined ? Boolean(u.canVerifyPayments) : Boolean(u.can_verify_online),
            canWithdraw: u.canWithdraw !== undefined ? Boolean(u.canWithdraw) : Boolean(u.can_withdraw),
            isActive: u.isActive !== undefined ? Boolean(u.isActive) : Boolean(u.is_active ?? 1),
            createdAt: u.createdAt || u.created_at || new Date().toISOString(),
          }));
        this.set(STORAGE_KEYS.USERS, mappedUsers);
      }

      if (data.members && Array.isArray(data.members)) {
        const memberMap = new Map<string, Member>();
        // First populate with non-deleted local members to preserve real names
        localMembers.forEach(m => {
          if (m.name && m.name !== 'Member' && !deletedMemberSet.has(m.id)) {
            memberMap.set(m.id, m);
          }
        });
        data.members.forEach((m: any) => {
          if (deletedMemberSet.has(m.id)) return;
          const existing = memberMap.get(m.id);
          const initialFallback = INITIAL_MEMBERS.find(im => im.id === m.id || im.code === m.code);
          const validName = (m.name && m.name !== 'Member')
            ? m.name
            : (existing?.name || initialFallback?.name || 'Member');

          memberMap.set(m.id, {
            id: m.id,
            code: m.code || existing?.code || initialFallback?.code || `AC-${m.id}`,
            name: validName,
            phone: m.phone || existing?.phone || initialFallback?.phone || '',
            address: m.address || existing?.address || initialFallback?.address || '',
            dailyAmount: Number(m.dailyAmount ?? m.daily_amount ?? existing?.dailyAmount ?? initialFallback?.dailyAmount) || 0,
            assignedCollectorId: m.assignedCollectorId || m.assigned_collector_id || existing?.assignedCollectorId || initialFallback?.assignedCollectorId || '',
            uniqueToken: m.uniqueToken || m.unique_token || existing?.uniqueToken || initialFallback?.uniqueToken || `token-${m.id}`,
            pin: m.pin || existing?.pin || initialFallback?.pin || '1234',
            isActive: m.isActive !== undefined ? Boolean(m.isActive) : Boolean(m.is_active ?? existing?.isActive ?? 1),
            createdAt: m.createdAt || m.created_at || existing?.createdAt || new Date().toISOString(),
          });
        });
        localMembers.forEach(m => {
          if (!memberMap.has(m.id) && !deletedMemberSet.has(m.id)) {
            memberMap.set(m.id, m);
          }
        });
        this.set(STORAGE_KEYS.MEMBERS, Array.from(memberMap.values()));
      }

      if (data.transactions && Array.isArray(data.transactions)) {
        const txMap = new Map<string, Transaction>();
        data.transactions.forEach((t: any) => {
          txMap.set(t.id, {
            id: t.id,
            memberId: t.memberId || t.member_id,
            collectorId: t.collectorId || t.collector_id || null,
            amount: Number(t.amount) || 0,
            paymentMode: t.paymentMode || t.payment_mode,
            txType: (t.txType || t.tx_type || 'deposit') as 'deposit' | 'withdrawal',
            status: t.status,
            utrNumber: t.utrNumber || t.utr_number || undefined,
            notes: t.notes || undefined,
            collectionDate: t.collectionDate || t.collection_date,
            createdAt: t.createdAt || t.created_at,
          });
        });
        localTransactions.forEach(t => {
          if (!txMap.has(t.id)) {
            txMap.set(t.id, t);
          }
        });
        const mergedTxs = Array.from(txMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.set(STORAGE_KEYS.TRANSACTIONS, mergedTxs);
      }

      if (data.settlements && Array.isArray(data.settlements) && data.settlements.length > 0) {
        const mappedSettlements = data.settlements.map((s: any) => ({
          id: s.id,
          collectorId: s.collectorId || s.collector_id,
          settlementDate: s.settlementDate || s.settlement_date,
          cashCollected: Number(s.cashCollected ?? s.cash_collected) || 0,
          cashSubmitted: Number(s.cashSubmitted ?? s.cash_submitted) || 0,
          status: s.status,
          notes: s.notes || undefined,
          approvedBy: s.approvedBy || s.approved_by || undefined,
          approvedAt: s.approvedAt || s.approved_at || undefined,
          createdAt: s.createdAt || s.created_at,
        }));
        this.set(STORAGE_KEYS.SETTLEMENTS, mappedSettlements);
      }
    } catch {
      // Offline mode
    }
  }

  // Auth User
  getAuthUser(): User | null {
    return this.get<User | null>(STORAGE_KEYS.AUTH_USER, null);
  }

  setAuthUser(user: User | null): void {
    this.set(STORAGE_KEYS.AUTH_USER, user);
  }

  login(phone: string, password?: string, role?: 'admin' | 'collector'): User | null {
    const users = this.getUsers();
    const cleanPhone = phone.trim();
    const cleanPassword = password ? password.trim() : '';

    const user = users.find(u => {
      const active = u.isActive !== undefined ? Boolean(u.isActive) : Boolean((u as any).is_active ?? 1);
      const phoneMatch = u.phone === cleanPhone;
      const roleMatch = !role || u.role === role;
      return phoneMatch && roleMatch && active;
    });

    if (user) {
      // If password provided, verify it
      if (cleanPassword && user.password && user.password !== cleanPassword) {
        return null;
      }

      const sanitizedUser: User = {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        password: user.password,
        canCollectAll: user.canCollectAll !== undefined ? Boolean(user.canCollectAll) : Boolean((user as any).can_collect_all),
        canVerifyPayments: user.canVerifyPayments !== undefined ? Boolean(user.canVerifyPayments) : Boolean((user as any).can_verify_online),
        canWithdraw: user.canWithdraw !== undefined ? Boolean(user.canWithdraw) : Boolean((user as any).can_withdraw),
        isActive: true,
        createdAt: user.createdAt || (user as any).created_at || new Date().toISOString(),
      };
      this.setAuthUser(sanitizedUser);
      return sanitizedUser;
    }
    return null;
  }

  updateAdminCredentials(data: {
    phone: string;
    currentPassword?: string;
    newPassword?: string;
  }): { success: boolean; message: string } {
    const users = this.getUsers();
    const admin = users.find(u => u.role === 'admin');
    if (!admin) {
      return { success: false, message: 'Super admin account not found.' };
    }

    const currentSavedPass = admin.password || 'admin123';
    if (data.currentPassword && data.currentPassword.trim() !== currentSavedPass) {
      return { success: false, message: 'Current password does not match.' };
    }

    const updatedPhone = data.phone.trim() || admin.phone;
    const updatedPassword = data.newPassword?.trim() ? data.newPassword.trim() : currentSavedPass;

    const updatedAdmin: User = {
      ...admin,
      phone: updatedPhone,
      password: updatedPassword,
    };

    const updatedUsers = users.map(u => (u.id === admin.id ? updatedAdmin : u));
    this.set(STORAGE_KEYS.USERS, updatedUsers);

    // Update active auth user session
    const currentAuth = this.getAuthUser();
    if (currentAuth && currentAuth.role === 'admin') {
      this.setAuthUser(updatedAdmin);
    }

    // Push to Cloudflare D1 immediately
    this.postApi('users', {
      id: updatedAdmin.id,
      name: updatedAdmin.name,
      phone: updatedAdmin.phone,
      role: 'admin',
      password: updatedPassword,
      canCollectAll: true,
      canVerifyOnline: true,
      isActive: true,
    });

    return { success: true, message: 'Super Admin credentials updated and synced to cloud successfully!' };
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

  saveCollector(collector: Partial<User> & { name: string; phone: string; password?: string }): User {
    const users = this.getUsers();
    let savedUser: User;
    if (collector.id) {
      const existing = users.find(u => u.id === collector.id);
      const updatedPassword = collector.password?.trim() ? collector.password.trim() : (existing?.password || 'coll123');
      const updated = users.map(u => (u.id === collector.id ? { ...u, ...collector, password: updatedPassword } as User : u));
      this.set(STORAGE_KEYS.USERS, updated);
      savedUser = updated.find(u => u.id === collector.id)!;
    } else {
      const newUser: User = {
        id: `u-coll-${Date.now()}`,
        name: collector.name.trim(),
        phone: collector.phone.trim(),
        role: 'collector',
        password: collector.password?.trim() || 'coll123',
        canCollectAll: collector.canCollectAll ?? false,
        canVerifyPayments: collector.canVerifyPayments ?? false,
        canWithdraw: collector.canWithdraw ?? false,
        isActive: collector.isActive ?? true,
        createdAt: new Date().toISOString(),
      };
      this.set(STORAGE_KEYS.USERS, [newUser, ...users]);
      savedUser = newUser;
    }

    // Immediately push to cloud backend
    this.postApi('users', {
      id: savedUser.id,
      name: savedUser.name,
      phone: savedUser.phone,
      role: savedUser.role,
      password: savedUser.password || 'coll123',
      canCollectAll: savedUser.canCollectAll,
      canVerifyOnline: savedUser.canVerifyPayments,
      canWithdraw: savedUser.canWithdraw,
      isActive: savedUser.isActive,
    });

    return savedUser;
  }

  deleteCollector(id: string): { success: boolean; message: string } {
    const users = this.getUsers();
    const target = users.find(u => u.id === id);
    if (!target) {
      return { success: false, message: 'Collector not found' };
    }
    if (target.role === 'admin') {
      return { success: false, message: 'Super Admin account cannot be deleted' };
    }

    const updatedUsers = users.filter(u => u.id !== id);
    this.set(STORAGE_KEYS.USERS, updatedUsers);

    // Unassign this collector from members
    const members = this.getMembers();
    const updatedMembers = members.map(m =>
      m.assignedCollectorId === id ? { ...m, assignedCollectorId: '' } : m
    );
    this.set(STORAGE_KEYS.MEMBERS, updatedMembers);

    // Track in deleted IDs
    this.addDeletedUserId(id);

    // Sync deletion to cloud D1
    this.deleteApi('users', { id });

    return { success: true, message: 'Collector deleted successfully' };
  }

  toggleCollectorStatus(id: string): void {
    const users = this.getUsers();
    const updated = users.map(u => (u.id === id ? { ...u, isActive: !u.isActive } : u));
    this.set(STORAGE_KEYS.USERS, updated);
    const target = updated.find(u => u.id === id);
    if (target) {
      this.postApi('users', {
        id: target.id,
        name: target.name,
        phone: target.phone,
        role: target.role,
        password: target.password || 'coll123',
        canCollectAll: target.canCollectAll,
        canVerifyOnline: target.canVerifyPayments,
        canWithdraw: target.canWithdraw,
        isActive: target.isActive,
      });
    }
  }

  toggleCollectorCanCollectAll(id: string): void {
    const users = this.getUsers();
    const updated = users.map(u => (u.id === id ? { ...u, canCollectAll: !u.canCollectAll } : u));
    this.set(STORAGE_KEYS.USERS, updated);
    const target = updated.find(u => u.id === id);
    if (target) {
      this.postApi('users', {
        id: target.id,
        name: target.name,
        phone: target.phone,
        role: target.role,
        password: target.password || 'coll123',
        canCollectAll: target.canCollectAll,
        canVerifyOnline: target.canVerifyPayments,
        canWithdraw: target.canWithdraw,
        isActive: target.isActive,
      });
    }
  }

  toggleCollectorCanVerifyPayments(id: string): void {
    const users = this.getUsers();
    const updated = users.map(u => (u.id === id ? { ...u, canVerifyPayments: !u.canVerifyPayments } : u));
    this.set(STORAGE_KEYS.USERS, updated);
    const target = updated.find(u => u.id === id);
    if (target) {
      this.postApi('users', {
        id: target.id,
        name: target.name,
        phone: target.phone,
        role: target.role,
        password: target.password || 'coll123',
        canCollectAll: target.canCollectAll,
        canVerifyOnline: target.canVerifyPayments,
        canWithdraw: target.canWithdraw,
        isActive: target.isActive,
      });
    }
  }

  toggleCollectorCanWithdraw(id: string): void {
    const users = this.getUsers();
    const updated = users.map(u => (u.id === id ? { ...u, canWithdraw: !u.canWithdraw } : u));
    this.set(STORAGE_KEYS.USERS, updated);
    const target = updated.find(u => u.id === id);
    if (target) {
      this.postApi('users', {
        id: target.id,
        name: target.name,
        phone: target.phone,
        role: target.role,
        password: target.password || 'coll123',
        canCollectAll: target.canCollectAll,
        canVerifyOnline: target.canVerifyPayments,
        canWithdraw: target.canWithdraw,
        isActive: target.isActive,
      });
    }
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
    let savedMember: Member;
    if (memberData.id) {
      const updated = members.map(m => (m.id === memberData.id ? { ...m, ...memberData } as Member : m));
      this.set(STORAGE_KEYS.MEMBERS, updated);
      savedMember = updated.find(m => m.id === memberData.id)!;
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
      savedMember = newMember;
    }

    // Immediately push to cloud backend
    this.postApi('members', {
      id: savedMember.id,
      code: savedMember.code,
      name: savedMember.name,
      phone: savedMember.phone,
      address: savedMember.address,
      dailyAmount: savedMember.dailyAmount,
      assignedCollectorId: savedMember.assignedCollectorId,
      uniqueToken: savedMember.uniqueToken,
      pin: savedMember.pin,
      isActive: savedMember.isActive,
    });

    return savedMember;
  }

  deleteMember(id: string): { success: boolean; message: string } {
    const members = this.getMembers();
    const updatedMembers = members.filter(m => m.id !== id);
    this.set(STORAGE_KEYS.MEMBERS, updatedMembers);

    // Also remove any transactions for this member
    const transactions = this.getTransactions();
    const updatedTransactions = transactions.filter(t => t.memberId !== id);
    this.set(STORAGE_KEYS.TRANSACTIONS, updatedTransactions);

    // Track in deleted IDs
    this.addDeletedMemberId(id);

    // Sync deletion to cloud D1
    this.deleteApi('members', { id });

    return { success: true, message: 'Member deleted successfully' };
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

  getMemberBalance(memberId: string) {
    const memberTxs = this.getTransactions().filter(t => t.memberId === memberId);
    
    let totalDeposited = 0;
    let totalWithdrawn = 0;
    let pendingDeposit = 0;

    memberTxs.forEach(t => {
      const type = t.txType || 'deposit';
      if (type === 'deposit') {
        if (t.status === 'completed') {
          totalDeposited += Number(t.amount) || 0;
        } else if (t.status === 'pending_verification') {
          pendingDeposit += Number(t.amount) || 0;
        }
      } else if (type === 'withdrawal') {
        if (t.status === 'completed') {
          totalWithdrawn += Number(t.amount) || 0;
        }
      }
    });

    const netBalance = Math.max(0, totalDeposited - totalWithdrawn);

    return {
      totalDeposited,
      totalWithdrawn,
      netBalance,
      pendingDeposit,
    };
  }

  addTransaction(data: {
    memberId: string;
    collectorId?: string | null;
    amount: number;
    paymentMode: PaymentMode;
    txType?: 'deposit' | 'withdrawal';
    utrNumber?: string;
    notes?: string;
    status?: 'completed' | 'pending_verification';
  }): Transaction {
    const transactions = this.getTransactions();
    const txType = data.txType || 'deposit';
    const newTx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      memberId: data.memberId,
      collectorId: data.collectorId || null,
      amount: Number(data.amount),
      paymentMode: data.paymentMode,
      txType,
      status: data.status || 'completed',
      utrNumber: data.utrNumber?.trim(),
      notes: data.notes?.trim(),
      collectionDate: getTodayDateString(),
      createdAt: new Date().toISOString(),
    };

    const member = this.getMemberById(data.memberId);
    this.set(STORAGE_KEYS.TRANSACTIONS, [newTx, ...transactions]);
    this.postApi('transactions', {
      ...newTx,
      memberCode: member?.code,
      memberName: member?.name,
      memberPhone: member?.phone,
    });
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
    this.postApi('transactions/verify', { transactionId: txId });
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
    const cleanId = collectorId.replace(/^u-/, '');
    const transactions = this.getTransactions().filter(t => {
      const cleanCollId = t.collectorId ? t.collectorId.replace(/^u-/, '') : '';
      return (t.collectorId === collectorId || cleanCollId === cleanId) && t.collectionDate === today && t.status === 'completed';
    });

    const deposits = transactions.filter(t => t.txType === 'deposit' || !t.txType);
    const withdrawals = transactions.filter(t => t.txType === 'withdrawal');

    const cashDeposits = deposits
      .filter(t => t.paymentMode === 'cash')
      .reduce((acc, t) => acc + t.amount, 0);

    const cashWithdrawals = withdrawals
      .filter(t => t.paymentMode === 'cash')
      .reduce((acc, t) => acc + t.amount, 0);

    // Physical cash collector holds = cash collected minus cash paid out to members
    const cashCollected = cashDeposits - cashWithdrawals;

    const onlineCollected = deposits
      .filter(t => t.paymentMode === 'online')
      .reduce((acc, t) => acc + t.amount, 0);

    const totalCollected = cashDeposits + onlineCollected;
    const totalPayouts = withdrawals.reduce((acc, t) => acc + t.amount, 0);
    const collectedMemberIds = new Set(deposits.map(t => t.memberId));

    // Get today's settlement status if submitted
    const settlement = this.getSettlements().find(s => {
      const cleanCollId = s.collectorId ? s.collectorId.replace(/^u-/, '') : '';
      return (s.collectorId === collectorId || cleanCollId === cleanId) && s.settlementDate === today;
    });

    const collector = this.getUsers().find(u => u.id === collectorId || u.id.replace(/^u-/, '') === cleanId);
    const pendingOnlineTransactions = this.getTransactions().filter(t => {
      if (t.status !== 'pending_verification') return false;
      if (!collector?.canVerifyPayments) return false;
      if (collector.canCollectAll) return true;
      const member = this.getMemberById(t.memberId);
      const cleanAssigned = member?.assignedCollectorId ? member.assignedCollectorId.replace(/^u-/, '') : '';
      return member?.assignedCollectorId === collectorId || cleanAssigned === cleanId;
    });

    return {
      today,
      totalCollected,
      cashDeposits,
      cashWithdrawals,
      cashCollected,
      onlineCollected,
      totalPayouts,
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

    const deposits = todayTransactions.filter(t => t.txType === 'deposit' || !t.txType);
    const withdrawals = todayTransactions.filter(t => t.txType === 'withdrawal');

    const totalAmount = deposits.reduce((acc, t) => acc + t.amount, 0);
    const cashAmount = deposits
      .filter(t => t.paymentMode === 'cash')
      .reduce((acc, t) => acc + t.amount, 0);
    const onlineAmount = deposits
      .filter(t => t.paymentMode === 'online')
      .reduce((acc, t) => acc + t.amount, 0);

    const totalWithdrawalAmount = withdrawals.reduce((acc, t) => acc + t.amount, 0);
    const cashWithdrawalAmount = withdrawals
      .filter(t => t.paymentMode === 'cash')
      .reduce((acc, t) => acc + t.amount, 0);

    const paidMemberIds = new Set(deposits.map(t => t.memberId));
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
      totalWithdrawalAmount,
      cashWithdrawalAmount,
      netCashInHand: cashAmount - cashWithdrawalAmount,
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
