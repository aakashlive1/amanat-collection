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
    // 1. Health Check
    if (path === 'health') {
      return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
    }

    // 2. Database Auto-Initialization (Run Schema)
    if (path === 'init' && (request.method === 'GET' || request.method === 'POST')) {
      const initQueries = [
        `CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);`,
        `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT UNIQUE NOT NULL, role TEXT NOT NULL CHECK (role IN ('admin', 'collector')), password_hash TEXT NOT NULL, can_collect_all INTEGER NOT NULL DEFAULT 0, can_verify_online INTEGER NOT NULL DEFAULT 0, is_active INTEGER NOT NULL DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`,
        `CREATE TABLE IF NOT EXISTS members (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL, address TEXT, daily_amount REAL NOT NULL DEFAULT 0, assigned_collector_id TEXT REFERENCES users(id), unique_token TEXT UNIQUE NOT NULL, pin TEXT NOT NULL DEFAULT '1234', is_active INTEGER NOT NULL DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`,
        `CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, member_id TEXT NOT NULL REFERENCES members(id), collector_id TEXT REFERENCES users(id), amount REAL NOT NULL, payment_mode TEXT NOT NULL CHECK (payment_mode IN ('cash', 'online')), status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending_verification')), utr_number TEXT, notes TEXT, collection_date TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`,
        `CREATE TABLE IF NOT EXISTS cash_settlements (id TEXT PRIMARY KEY, collector_id TEXT NOT NULL REFERENCES users(id), settlement_date TEXT NOT NULL, cash_collected REAL NOT NULL, cash_submitted REAL NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'discrepancy')), notes TEXT, approved_by TEXT REFERENCES users(id), approved_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`,
        `CREATE INDEX IF NOT EXISTS idx_members_code ON members(code);`,
        `CREATE INDEX IF NOT EXISTS idx_members_token ON members(unique_token);`,
        `CREATE INDEX IF NOT EXISTS idx_transactions_member ON transactions(member_id);`,
        `CREATE INDEX IF NOT EXISTS idx_transactions_collector_date ON transactions(collector_id, collection_date);`,
        `CREATE INDEX IF NOT EXISTS idx_settlements_collector ON cash_settlements(collector_id, settlement_date);`,
      ];

      for (const query of initQueries) {
        await env.DB.prepare(query).run();
      }

      // Check if default admin exists; if not, seed default admin & collectors
      const adminCheck = await env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").first();
      if (!adminCheck || adminCheck.count === 0) {
        await env.DB.prepare(`
          INSERT INTO users (id, name, phone, role, password_hash, can_collect_all, can_verify_online)
          VALUES ('admin-1', 'Super Admin', '9876543210', 'admin', 'admin123', 1, 1)
        `).run();

        await env.DB.prepare(`
          INSERT INTO users (id, name, phone, role, password_hash, can_collect_all, can_verify_online)
          VALUES 
            ('coll-1', 'Rajesh Kumar', '9822011111', 'collector', 'coll123', 1, 1),
            ('coll-2', 'Vikram Singh', '9822022222', 'collector', 'coll123', 0, 0)
        `).run();
      }

      // Check if members table has data; if not, seed sample members
      const memberCheck = await env.DB.prepare("SELECT COUNT(*) as count FROM members").first();
      if (!memberCheck || memberCheck.count === 0) {
        await env.DB.prepare(`
          INSERT INTO members (id, code, name, phone, address, daily_amount, assigned_collector_id, unique_token, pin, is_active)
          VALUES 
            ('m-101', 'AC-1001', 'Mohammad Aslam', '9893012345', 'Shop #4, Gandhi Market', 200, 'coll-1', 'aslam-103', '1234', 1),
            ('m-102', 'AC-1002', 'Faheem Khan', '9893023456', 'Near Jama Masjid, Main Road', 500, 'coll-1', 'faheem-204', '1234', 1),
            ('m-103', 'AC-1003', 'Ramesh Patel', '9893034567', 'Sai Provision Store, Sector 2', 300, 'coll-2', 'ramesh-305', '1234', 1),
            ('m-104', 'AC-1004', 'Suresh Gupta', '9893045678', 'Gupta Tea Stall, Station Road', 150, 'coll-2', 'suresh-406', '1234', 1)
        `).run();
      }

      return jsonResponse({ success: true, message: 'D1 Database tables initialized successfully with default admin and members.' });
    }

    // 3. Full Data Bootstrap (Sync on App Load)
    if (path === 'bootstrap' && request.method === 'GET') {
      const [settingsRes, usersRes, membersRes, txRes, settlementsRes] = await Promise.all([
        env.DB.prepare('SELECT key, value FROM app_settings').all(),
        env.DB.prepare('SELECT id, name, phone, role, can_collect_all, can_verify_online, is_active, created_at FROM users').all(),
        env.DB.prepare('SELECT * FROM members ORDER BY created_at DESC').all(),
        env.DB.prepare('SELECT * FROM transactions ORDER BY created_at DESC LIMIT 5000').all(),
        env.DB.prepare('SELECT * FROM cash_settlements ORDER BY settlement_date DESC LIMIT 1000').all(),
      ]);

      const users = (usersRes.results || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        phone: u.phone,
        role: u.role,
        canCollectAll: Boolean(u.can_collect_all),
        canVerifyPayments: Boolean(u.can_verify_online),
        isActive: Boolean(u.is_active === 1 || u.is_active === true || u.is_active === undefined),
        createdAt: u.created_at,
      }));

      const members = (membersRes.results || []).map((m: any) => ({
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
      });
    }

    // 3.5. Two-Way Sync Endpoint (Pushes unsynced local data and pulls latest cloud state)
    if (path === 'sync' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { localTransactions, localMembers } = body as any;

      // Upsert any local members if sent
      if (Array.isArray(localMembers) && localMembers.length > 0) {
        for (const m of localMembers) {
          try {
            await env.DB.prepare(`
              INSERT OR IGNORE INTO members (id, code, name, phone, address, daily_amount, assigned_collector_id, unique_token, pin, is_active)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
              INSERT INTO transactions (id, member_id, collector_id, amount, payment_mode, status, utr_number, notes, collection_date, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                status = excluded.status,
                utr_number = excluded.utr_number,
                notes = excluded.notes
            `).bind(
              tx.id,
              tx.memberId,
              tx.collectorId || null,
              tx.amount,
              tx.paymentMode,
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

      // Fetch and return full latest cloud state
      const [settingsRes, usersRes, membersRes, txRes, settlementsRes] = await Promise.all([
        env.DB.prepare('SELECT key, value FROM app_settings').all(),
        env.DB.prepare('SELECT id, name, phone, role, can_collect_all, can_verify_online, is_active, created_at FROM users').all(),
        env.DB.prepare('SELECT * FROM members ORDER BY created_at DESC').all(),
        env.DB.prepare('SELECT * FROM transactions ORDER BY created_at DESC LIMIT 5000').all(),
        env.DB.prepare('SELECT * FROM cash_settlements ORDER BY settlement_date DESC LIMIT 1000').all(),
      ]);

      const users = (usersRes.results || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        phone: u.phone,
        role: u.role,
        canCollectAll: Boolean(u.can_collect_all),
        canVerifyPayments: Boolean(u.can_verify_online),
        isActive: Boolean(u.is_active === 1 || u.is_active === true || u.is_active === undefined),
        createdAt: u.created_at,
      }));

      const members = (membersRes.results || []).map((m: any) => ({
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
      });
    }

    // 4. Save/Update Transaction
    if (path === 'transactions' && request.method === 'POST') {
      const body = await request.json();
      const { id, memberId, collectorId, amount, paymentMode, status, utrNumber, notes, collectionDate, createdAt } = body;

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
        INSERT INTO transactions (id, member_id, collector_id, amount, payment_mode, status, utr_number, notes, collection_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          status = excluded.status,
          utr_number = excluded.utr_number,
          notes = excluded.notes
      `).bind(
        id,
        memberId,
        collectorId || null,
        amount,
        paymentMode,
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
      const { id, name, phone, role, password, canCollectAll, canVerifyOnline, isActive } = body;

      await env.DB.prepare(`
        INSERT INTO users (id, name, phone, role, password_hash, can_collect_all, can_verify_online, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          phone = excluded.phone,
          can_collect_all = excluded.can_collect_all,
          can_verify_online = excluded.can_verify_online,
          is_active = excluded.is_active
      `).bind(
        id,
        name,
        phone,
        role || 'collector',
        password || 'coll123',
        canCollectAll ? 1 : 0,
        canVerifyOnline ? 1 : 0,
        isActive === undefined ? 1 : (isActive ? 1 : 0)
      ).run();

      return jsonResponse({ success: true, id });
    }

    return jsonResponse({ error: `Endpoint /api/${path} not found` }, 404);
  } catch (err: any) {
    return jsonResponse({ error: err.message || 'Internal server error' }, 500);
  }
};
