// Cloudflare Pages Functions: Full D1 API Backend for Amanat Collection
// Bound to D1 database binding named "DB" in Cloudflare Pages Settings

interface Env {
  DB: any;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/?/, '');

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  // Check if D1 binding exists
  if (!env || !env.DB) {
    return jsonResponse(
      {
        error: 'Database binding DB is not configured in Cloudflare Pages settings.',
        hint: 'Go to Cloudflare Pages > Settings > Functions > D1 Database Bindings and bind DB to your database.',
      },
      503
    );
  }

  try {
    // Ensure deleted_records table exists
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS deleted_records (
        id TEXT PRIMARY KEY, 
        record_type TEXT NOT NULL, 
        deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    // Ensure backwards-compatible columns exist on transactions and users
    await env.DB.prepare("ALTER TABLE transactions ADD COLUMN tx_type TEXT DEFAULT 'deposit'").run().catch(() => {});
    await env.DB.prepare("ALTER TABLE users ADD COLUMN can_withdraw INTEGER DEFAULT 0").run().catch(() => {});

    // 1. Health Check
    if (path === 'health') {
      return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
    }

    // 2. Database Auto-Initialization (Run Schema)
    if (path === 'init' && (request.method === 'GET' || request.method === 'POST')) {
      const initQueries = [
        `CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);`,
        `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT UNIQUE NOT NULL, role TEXT NOT NULL CHECK (role IN ('admin', 'collector')), password_hash TEXT NOT NULL, can_collect_all INTEGER NOT NULL DEFAULT 0, can_verify_online INTEGER NOT NULL DEFAULT 0, can_withdraw INTEGER NOT NULL DEFAULT 0, is_active INTEGER NOT NULL DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`,
        `CREATE TABLE IF NOT EXISTS members (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL, address TEXT, daily_amount REAL NOT NULL DEFAULT 0, assigned_collector_id TEXT, unique_token TEXT UNIQUE NOT NULL, pin TEXT NOT NULL DEFAULT '1234', is_active INTEGER NOT NULL DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`,
        `CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, member_id TEXT NOT NULL, collector_id TEXT, amount REAL NOT NULL, payment_mode TEXT NOT NULL CHECK (payment_mode IN ('cash', 'online')), tx_type TEXT NOT NULL DEFAULT 'deposit' CHECK (tx_type IN ('deposit', 'withdrawal')), status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending_verification')), utr_number TEXT, notes TEXT, collection_date TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`,
        `CREATE TABLE IF NOT EXISTS cash_settlements (id TEXT PRIMARY KEY, collector_id TEXT NOT NULL, settlement_date TEXT NOT NULL, cash_collected REAL NOT NULL, cash_submitted REAL NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'discrepancy')), notes TEXT, approved_by TEXT, approved_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`,
        `CREATE TABLE IF NOT EXISTS deleted_records (id TEXT PRIMARY KEY, record_type TEXT NOT NULL, deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP);`,
        `CREATE INDEX IF NOT EXISTS idx_members_code ON members(code);`,
        `CREATE INDEX IF NOT EXISTS idx_members_token ON members(unique_token);`,
        `CREATE INDEX IF NOT EXISTS idx_transactions_member ON transactions(member_id);`,
        `CREATE INDEX IF NOT EXISTS idx_transactions_collector_date ON transactions(collector_id, collection_date);`,
        `CREATE INDEX IF NOT EXISTS idx_settlements_collector ON cash_settlements(collector_id, settlement_date);`,
      ];

      for (const query of initQueries) {
        await env.DB.prepare(query).run();
      }

      // Upsert default admin & collectors
      await env.DB.prepare(`
        INSERT INTO users (id, name, phone, role, password_hash, can_collect_all, can_verify_online, can_withdraw)
        VALUES 
          ('u-admin-1', 'Super Admin', '9876543210', 'admin', 'admin123', 1, 1, 1),
          ('u-coll-1', 'Rajesh Kumar', '9822011111', 'collector', 'coll123', 1, 1, 1),
          ('u-coll-2', 'Vikram Singh', '9822022222', 'collector', 'coll123', 0, 0, 0)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          phone = excluded.phone,
          can_collect_all = excluded.can_collect_all,
          can_verify_online = excluded.can_verify_online,
          can_withdraw = excluded.can_withdraw
      `).run();

      // Upsert default sample members
      const sampleMembers = [
        ['m-1', 'AC-101', 'Ramesh Sharma', '9811100001', 'Shop No. 4, Market Road', 500, 'u-coll-1', 'ramesh-101'],
        ['m-2', 'AC-102', 'Sunita Verma', '9811100002', 'B-12, Gandhi Nagar', 200, 'u-coll-1', 'sunita-102'],
        ['m-3', 'AC-103', 'Mohammad Aslam', '9811100003', 'Old City Chowk', 300, 'u-coll-1', 'aslam-103'],
        ['m-4', 'AC-104', 'Pooja Gupta', '9811100004', 'Sector 5, Station Road', 250, 'u-coll-2', 'pooja-104'],
        ['m-5', 'AC-105', 'Faheem Khan', '9811100005', 'Main Market, Near Clock Tower', 400, 'u-coll-2', 'faheem-105'],
        ['m-6', 'AC-106', 'Vikram Rathore', '9811100006', 'Transport Nagar, Warehouse #3', 600, 'u-coll-2', 'vikram-106'],
      ];

      for (const sm of sampleMembers) {
        await env.DB.prepare(`
          INSERT INTO members (id, code, name, phone, address, daily_amount, assigned_collector_id, unique_token, pin, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, '1234', 1)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            code = excluded.code,
            phone = excluded.phone,
            address = excluded.address,
            daily_amount = excluded.daily_amount,
            assigned_collector_id = excluded.assigned_collector_id
        `).bind(sm[0], sm[1], sm[2], sm[3], sm[4], sm[5], sm[6], sm[7]).run();
      }

      // Repair any members with dummy 'Member' names
      await env.DB.prepare("UPDATE members SET name = 'Mohammad Aslam' WHERE name = 'Member' AND (id = 'm-3' OR id = 'm-101' OR code = 'AC-103')").run();
      await env.DB.prepare("UPDATE members SET name = 'Ramesh Sharma' WHERE name = 'Member' AND (id = 'm-1' OR code = 'AC-101')").run();
      await env.DB.prepare("UPDATE members SET name = 'Sunita Verma' WHERE name = 'Member' AND (id = 'm-2' OR code = 'AC-102')").run();
      await env.DB.prepare("UPDATE members SET name = 'Pooja Gupta' WHERE name = 'Member' AND (id = 'm-4' OR code = 'AC-104')").run();
      await env.DB.prepare("UPDATE members SET name = 'Faheem Khan' WHERE name = 'Member' AND (id = 'm-5' OR id = 'm-102' OR code = 'AC-105')").run();
      await env.DB.prepare("UPDATE members SET name = 'Vikram Rathore' WHERE name = 'Member' AND (id = 'm-6' OR code = 'AC-106')").run();

      return jsonResponse({ success: true, message: 'D1 Database initialized and verified with standard members and collectors.' });
    }

    // 3. Full Data Bootstrap (Sync on App Load)
    if (path === 'bootstrap' && request.method === 'GET') {
      const [settingsRes, usersRes, membersRes, txRes, settlementsRes, deletedRes] = await Promise.all([
        env.DB.prepare('SELECT key, value FROM app_settings').all(),
        env.DB.prepare('SELECT id, name, phone, role, password_hash, can_collect_all, can_verify_online, can_withdraw, is_active, created_at FROM users').all(),
        env.DB.prepare('SELECT * FROM members ORDER BY created_at DESC').all(),
        env.DB.prepare('SELECT * FROM transactions ORDER BY created_at DESC LIMIT 5000').all(),
        env.DB.prepare('SELECT * FROM cash_settlements ORDER BY settlement_date DESC LIMIT 1000').all(),
        env.DB.prepare('SELECT id, record_type FROM deleted_records').all().catch(() => ({ results: [] })),
      ]);

      const deletedMemberIds = (deletedRes.results || []).filter((r: any) => r.record_type === 'member').map((r: any) => r.id);
      const deletedUserIds = (deletedRes.results || []).filter((r: any) => r.record_type === 'user').map((r: any) => r.id);
      const deletedMemberSet = new Set(deletedMemberIds);
      const deletedUserSet = new Set(deletedUserIds);

      const users = (usersRes.results || [])
        .filter((u: any) => !deletedUserSet.has(u.id))
        .map((u: any) => ({
          id: u.id,
          name: u.name,
          phone: u.phone,
          role: u.role,
          password: u.password_hash,
          canCollectAll: Boolean(u.can_collect_all),
          canVerifyPayments: Boolean(u.can_verify_online),
          canWithdraw: Boolean(u.can_withdraw),
          isActive: Boolean(u.is_active === 1 || u.is_active === true || u.is_active === undefined),
          createdAt: u.created_at,
        }));

      const members = (membersRes.results || [])
        .filter((m: any) => !deletedMemberSet.has(m.id))
        .map((m: any) => ({
          id: m.id,
          code: m.code,
          name: m.name,
          phone: m.phone,
          address: m.address || '',
          dailyAmount: Number(m.daily_amount) || 0,
          assignedCollectorId: m.assigned_collector_id || '',
          uniqueToken: m.unique_token,
          pin: m.pin || '1234',
          isActive: Boolean(m.is_active === 1 || m.is_active === true || m.is_active === undefined),
          createdAt: m.created_at,
        }));

      const transactions = (txRes.results || []).map((t: any) => ({
        id: t.id,
        memberId: t.member_id,
        collectorId: t.collector_id || null,
        amount: Number(t.amount) || 0,
        paymentMode: t.payment_mode,
        txType: (t.tx_type as 'deposit' | 'withdrawal') || 'deposit',
        status: t.status,
        utrNumber: t.utr_number || undefined,
        notes: t.notes || undefined,
        collectionDate: t.collection_date,
        createdAt: t.created_at,
      }));

      const settlements = (settlementsRes.results || []).map((s: any) => ({
        id: s.id,
        collectorId: s.collector_id,
        settlementDate: s.settlement_date,
        cashCollected: Number(s.cash_collected) || 0,
        cashSubmitted: Number(s.cash_submitted) || 0,
        status: s.status,
        notes: s.notes || undefined,
        approvedBy: s.approved_by || undefined,
        approvedAt: s.approved_at || undefined,
        createdAt: s.created_at,
      }));

      return jsonResponse({
        settings: settingsRes.results || [],
        users,
        members,
        transactions,
        settlements,
        deletedMemberIds,
        deletedUserIds,
      });
    }

    // 3.5. Two-Way Sync Endpoint (Pushes unsynced local data and pulls latest cloud state)
    if (path === 'sync' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { localTransactions, localMembers, deletedMemberIds: clientDelMembers, deletedUserIds: clientDelUsers } = body as any;

      // Handle client deletions first
      if (Array.isArray(clientDelMembers) && clientDelMembers.length > 0) {
        for (const id of clientDelMembers) {
          await env.DB.prepare('INSERT OR REPLACE INTO deleted_records (id, record_type) VALUES (?, "member")').bind(id).run().catch(() => {});
          await env.DB.prepare('DELETE FROM transactions WHERE member_id = ?').bind(id).run().catch(() => {});
          await env.DB.prepare('DELETE FROM members WHERE id = ?').bind(id).run().catch(() => {});
        }
      }

      if (Array.isArray(clientDelUsers) && clientDelUsers.length > 0) {
        for (const id of clientDelUsers) {
          await env.DB.prepare('INSERT OR REPLACE INTO deleted_records (id, record_type) VALUES (?, "user")').bind(id).run().catch(() => {});
          await env.DB.prepare('UPDATE members SET assigned_collector_id = NULL WHERE assigned_collector_id = ?').bind(id).run().catch(() => {});
          await env.DB.prepare('DELETE FROM users WHERE id = ? AND role != "admin"').bind(id).run().catch(() => {});
        }
      }

      // Upsert any local members if sent (and not deleted)
      if (Array.isArray(localMembers) && localMembers.length > 0) {
        for (const m of localMembers) {
          try {
            if (m.name && m.name !== 'Member') {
              const isDeleted = await env.DB.prepare('SELECT 1 FROM deleted_records WHERE id = ?').bind(m.id).first().catch(() => null);
              if (isDeleted) continue;

              await env.DB.prepare(`
                INSERT INTO members (id, code, name, phone, address, daily_amount, assigned_collector_id, unique_token, pin, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                  name = CASE WHEN excluded.name != 'Member' AND excluded.name != '' THEN excluded.name ELSE members.name END,
                  code = excluded.code,
                  phone = excluded.phone,
                  address = excluded.address,
                  daily_amount = excluded.daily_amount,
                  assigned_collector_id = excluded.assigned_collector_id
              `).bind(
                m.id,
                m.code,
                m.name,
                m.phone,
                m.address || '',
                m.dailyAmount || 0,
                m.assignedCollectorId || null,
                m.uniqueToken || `token-${m.id}`,
                m.pin || '1234',
                1
              ).run();
            }
          } catch (e) {
            console.error('Sync member error:', e);
          }
        }
      }

      // Upsert any local transactions if sent
      if (Array.isArray(localTransactions) && localTransactions.length > 0) {
        for (const tx of localTransactions) {
          try {
            await env.DB.prepare(`
              INSERT INTO transactions (id, member_id, collector_id, amount, payment_mode, tx_type, status, utr_number, notes, collection_date, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                tx_type = excluded.tx_type,
                status = excluded.status,
                utr_number = excluded.utr_number,
                notes = excluded.notes
            `).bind(
              tx.id,
              tx.memberId,
              tx.collectorId || null,
              tx.amount,
              tx.paymentMode,
              tx.txType || 'deposit',
              tx.status || 'completed',
              tx.utrNumber || null,
              tx.notes || null,
              tx.collectionDate,
              tx.createdAt || new Date().toISOString()
            ).run();
          } catch (e) {
            console.error('Sync tx error:', e);
          }
        }
      }

      // Quick repair of any 'Member' name artifacts
      await env.DB.prepare("UPDATE members SET name = 'Mohammad Aslam' WHERE name = 'Member' AND (id = 'm-3' OR id = 'm-101' OR code = 'AC-103')").run().catch(() => {});
      await env.DB.prepare("UPDATE members SET name = 'Ramesh Sharma' WHERE name = 'Member' AND (id = 'm-1' OR code = 'AC-101')").run().catch(() => {});
      await env.DB.prepare("UPDATE members SET name = 'Sunita Verma' WHERE name = 'Member' AND (id = 'm-2' OR code = 'AC-102')").run().catch(() => {});
      await env.DB.prepare("UPDATE members SET name = 'Pooja Gupta' WHERE name = 'Member' AND (id = 'm-4' OR code = 'AC-104')").run().catch(() => {});
      await env.DB.prepare("UPDATE members SET name = 'Faheem Khan' WHERE name = 'Member' AND (id = 'm-5' OR id = 'm-102' OR code = 'AC-105')").run().catch(() => {});
      await env.DB.prepare("UPDATE members SET name = 'Vikram Rathore' WHERE name = 'Member' AND (id = 'm-6' OR code = 'AC-106')").run().catch(() => {});

      // Fetch and return full latest cloud state
      const [settingsRes, usersRes, membersRes, txRes, settlementsRes, deletedRes] = await Promise.all([
        env.DB.prepare('SELECT key, value FROM app_settings').all(),
        env.DB.prepare('SELECT id, name, phone, role, password_hash, can_collect_all, can_verify_online, can_withdraw, is_active, created_at FROM users').all(),
        env.DB.prepare('SELECT * FROM members ORDER BY created_at DESC').all(),
        env.DB.prepare('SELECT * FROM transactions ORDER BY created_at DESC LIMIT 5000').all(),
        env.DB.prepare('SELECT * FROM cash_settlements ORDER BY settlement_date DESC LIMIT 1000').all(),
        env.DB.prepare('SELECT id, record_type FROM deleted_records').all().catch(() => ({ results: [] })),
      ]);

      const deletedMemberIds = (deletedRes.results || []).filter((r: any) => r.record_type === 'member').map((r: any) => r.id);
      const deletedUserIds = (deletedRes.results || []).filter((r: any) => r.record_type === 'user').map((r: any) => r.id);
      const deletedMemberSet = new Set(deletedMemberIds);
      const deletedUserSet = new Set(deletedUserIds);

      const users = (usersRes.results || [])
        .filter((u: any) => !deletedUserSet.has(u.id))
        .map((u: any) => ({
          id: u.id,
          name: u.name,
          phone: u.phone,
          role: u.role,
          password: u.password_hash,
          canCollectAll: Boolean(u.can_collect_all),
          canVerifyPayments: Boolean(u.can_verify_online),
          canWithdraw: Boolean(u.can_withdraw),
          isActive: Boolean(u.is_active === 1 || u.is_active === true || u.is_active === undefined),
          createdAt: u.created_at,
        }));

      const members = (membersRes.results || [])
        .filter((m: any) => !deletedMemberSet.has(m.id))
        .map((m: any) => ({
          id: m.id,
          code: m.code,
          name: m.name,
          phone: m.phone,
          address: m.address || '',
          dailyAmount: Number(m.daily_amount) || 0,
          assignedCollectorId: m.assigned_collector_id || '',
          uniqueToken: m.unique_token,
          pin: m.pin || '1234',
          isActive: Boolean(m.is_active === 1 || m.is_active === true || m.is_active === undefined),
          createdAt: m.created_at,
        }));

      const transactions = (txRes.results || []).map((t: any) => ({
        id: t.id,
        memberId: t.member_id,
        collectorId: t.collector_id || null,
        amount: Number(t.amount) || 0,
        paymentMode: t.payment_mode,
        txType: (t.tx_type as 'deposit' | 'withdrawal') || 'deposit',
        status: t.status,
        utrNumber: t.utr_number || undefined,
        notes: t.notes || undefined,
        collectionDate: t.collection_date,
        createdAt: t.created_at,
      }));

      const settlements = (settlementsRes.results || []).map((s: any) => ({
        id: s.id,
        collectorId: s.collector_id,
        settlementDate: s.settlement_date,
        cashCollected: Number(s.cash_collected) || 0,
        cashSubmitted: Number(s.cash_submitted) || 0,
        status: s.status,
        notes: s.notes || undefined,
        approvedBy: s.approved_by || undefined,
        approvedAt: s.approved_at || undefined,
        createdAt: s.created_at,
      }));

      return jsonResponse({
        settings: settingsRes.results || [],
        users,
        members,
        transactions,
        settlements,
        deletedMemberIds,
        deletedUserIds,
      });
    }

    // 4. Save/Update Transaction
    if (path === 'transactions' && request.method === 'POST') {
      const body = await request.json();
      const { id, memberId, collectorId, amount, paymentMode, txType, status, utrNumber, notes, collectionDate, createdAt } = body;

      // Auto-create member in D1 if not existing
      const memberExists = await env.DB.prepare('SELECT id FROM members WHERE id = ?').bind(memberId).first();
      if (!memberExists) {
        await env.DB.prepare(`
          INSERT OR IGNORE INTO members (id, code, name, phone, address, daily_amount, unique_token, pin, is_active)
          VALUES (?, ?, ?, ?, '', ?, ?, '1234', 1)
        `).bind(
          memberId,
          body.memberCode || `AC-${memberId.replace('m-', '')}`,
          body.memberName || 'Member',
          body.memberPhone || '',
          amount || 0,
          `token-${memberId}`
        ).run();
      }

      await env.DB.prepare(`
        INSERT INTO transactions (id, member_id, collector_id, amount, payment_mode, tx_type, status, utr_number, notes, collection_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          tx_type = excluded.tx_type,
          status = excluded.status,
          utr_number = excluded.utr_number,
          notes = excluded.notes
      `).bind(
        id,
        memberId,
        collectorId || null,
        amount,
        paymentMode,
        txType || 'deposit',
        status || 'completed',
        utrNumber || null,
        notes || null,
        collectionDate,
        createdAt || new Date().toISOString()
      ).run();

      return jsonResponse({ success: true, id });
    }

    // 5. Verify / Approve Transaction
    if (path === 'transactions/verify' && request.method === 'POST') {
      const body = await request.json();
      const { transactionId } = body;

      await env.DB.prepare(`
        UPDATE transactions 
        SET status = 'completed' 
        WHERE id = ?
      `).bind(transactionId).run();

      return jsonResponse({ success: true, message: 'Transaction verified successfully' });
    }

    // 6. Save/Update Member
    if (path === 'members' && request.method === 'POST') {
      const body = await request.json();
      const { id, code, name, phone, address, dailyAmount, assignedCollectorId, uniqueToken, pin, isActive } = body;

      await env.DB.prepare(`
        INSERT INTO members (id, code, name, phone, address, daily_amount, assigned_collector_id, unique_token, pin, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          code = excluded.code,
          name = excluded.name,
          phone = excluded.phone,
          address = excluded.address,
          daily_amount = excluded.daily_amount,
          assigned_collector_id = excluded.assigned_collector_id,
          pin = excluded.pin,
          is_active = excluded.is_active
      `).bind(
        id,
        code,
        name,
        phone,
        address || '',
        dailyAmount || 0,
        assignedCollectorId || null,
        uniqueToken,
        pin || '1234',
        isActive === undefined ? 1 : (isActive ? 1 : 0)
      ).run();

      return jsonResponse({ success: true, id });
    }

    // 6.1. Delete Member
    if (path === 'members' && request.method === 'DELETE') {
      let id = url.searchParams.get('id');
      if (!id) {
        const body = await request.json().catch(() => ({}));
        id = body.id;
      }
      if (!id) return jsonResponse({ error: 'Member id is required' }, 400);

      await env.DB.prepare('INSERT OR REPLACE INTO deleted_records (id, record_type) VALUES (?, "member")').bind(id).run().catch(() => {});
      await env.DB.prepare('DELETE FROM transactions WHERE member_id = ?').bind(id).run().catch(() => {});
      await env.DB.prepare('DELETE FROM members WHERE id = ?').bind(id).run().catch(() => {});

      return jsonResponse({ success: true, message: 'Member deleted successfully', id });
    }

    // 7. Save/Update Cash Settlement
    if (path === 'settlements' && request.method === 'POST') {
      const body = await request.json();
      const { id, collectorId, settlementDate, cashCollected, cashSubmitted, status, notes, approvedBy, approvedAt, createdAt } = body;

      await env.DB.prepare(`
        INSERT INTO cash_settlements (id, collector_id, settlement_date, cash_collected, cash_submitted, status, notes, approved_by, approved_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          cash_collected = excluded.cash_collected,
          cash_submitted = excluded.cash_submitted,
          status = excluded.status,
          notes = excluded.notes,
          approved_by = excluded.approved_by,
          approved_at = excluded.approved_at
      `).bind(
        id,
        collectorId,
        settlementDate,
        cashCollected,
        cashSubmitted,
        status || 'pending',
        notes || '',
        approvedBy || null,
        approvedAt || null,
        createdAt || new Date().toISOString()
      ).run();

      return jsonResponse({ success: true, id });
    }

    // 8. Save/Update User / Collector
    if (path === 'users' && request.method === 'POST') {
      const body = await request.json();
      const { id, name, phone, role, password, canCollectAll, canVerifyOnline, canWithdraw, isActive } = body;
      const cleanPassword = password ? String(password).trim() : '';

      await env.DB.prepare(`
        INSERT INTO users (id, name, phone, role, password_hash, can_collect_all, can_verify_online, can_withdraw, is_active)
        VALUES (?, ?, ?, ?, COALESCE(NULLIF(?, ''), 'coll123'), ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          phone = excluded.phone,
          password_hash = CASE WHEN excluded.password_hash != '' AND excluded.password_hash IS NOT NULL THEN excluded.password_hash ELSE users.password_hash END,
          can_collect_all = excluded.can_collect_all,
          can_verify_online = excluded.can_verify_online,
          can_withdraw = excluded.can_withdraw,
          is_active = excluded.is_active
      `).bind(
        id,
        name,
        phone,
        role || 'collector',
        cleanPassword,
        canCollectAll ? 1 : 0,
        canVerifyOnline ? 1 : 0,
        canWithdraw ? 1 : 0,
        isActive === undefined ? 1 : (isActive ? 1 : 0)
      ).run();

      return jsonResponse({ success: true, id });
    }

    // 8.1. Delete Collector / User
    if (path === 'users' && request.method === 'DELETE') {
      let id = url.searchParams.get('id');
      if (!id) {
        const body = await request.json().catch(() => ({}));
        id = body.id;
      }
      if (!id) return jsonResponse({ error: 'User id is required' }, 400);

      const target = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(id).first().catch(() => null);
      if (target && target.role === 'admin') {
        return jsonResponse({ error: 'Super Admin account cannot be deleted' }, 400);
      }

      await env.DB.prepare('INSERT OR REPLACE INTO deleted_records (id, record_type) VALUES (?, "user")').bind(id).run().catch(() => {});
      await env.DB.prepare('UPDATE members SET assigned_collector_id = NULL WHERE assigned_collector_id = ?').bind(id).run().catch(() => {});
      await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run().catch(() => {});

      return jsonResponse({ success: true, message: 'Collector deleted successfully', id });
    }

    return jsonResponse({ error: `Endpoint /api/${path} not found` }, 404);
  } catch (err: any) {
    return jsonResponse({ error: err.message || 'Internal server error' }, 500);
  }
};
