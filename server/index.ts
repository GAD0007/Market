import express, { NextFunction, Request, Response } from 'express';
import { DatabaseSync } from 'node:sqlite';
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';

const PORT = Number(process.env.PORT || 8787);
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'ojimbaejike@gmail.com').toLowerCase();
const dataDir = path.resolve('server/data');
fs.mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(path.join(dataDir, 'market-boys.sqlite'));
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, display_name TEXT NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'customer', created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS records (resource TEXT NOT NULL, id TEXT NOT NULL, owner_id TEXT, data TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(resource,id));
  CREATE TABLE IF NOT EXISTS ice_candidates (id TEXT PRIMARY KEY, call_id TEXT NOT NULL, side TEXT NOT NULL, data TEXT NOT NULL, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY, order_id TEXT NOT NULL, owner_id TEXT NOT NULL, provider TEXT NOT NULL, reference TEXT UNIQUE NOT NULL, status TEXT NOT NULL, amount_kobo INTEGER NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
`);

type SafeUser = { uid: string; email: string; displayName: string; emailVerified: boolean; role: string };
type AuthedRequest = Request & { user?: SafeUser };
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

function cookies(req: Request) { return Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map((part) => { const [key, ...rest] = part.trim().split('='); return [key, decodeURIComponent(rest.join('='))]; })); }
function hashPassword(password: string) { const salt = randomBytes(16).toString('hex'); return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`; }
function passwordMatches(password: string, stored: string) { const [salt, expected] = stored.split(':'); const actual = scryptSync(password, salt, 64); return expected?.length === actual.length * 2 && timingSafeEqual(actual, Buffer.from(expected, 'hex')); }
function safeUser(row: any): SafeUser { return { uid: row.id, email: row.email, displayName: row.display_name, emailVerified: true, role: row.role }; }
function isAdmin(user?: SafeUser) {
  if (!user) return false;
  if (user.role === 'admin' || user.email.toLowerCase() === ADMIN_EMAIL) return true;
  return Boolean(db.prepare("SELECT 1 FROM records WHERE resource='grants' AND id=?").get(user.uid));
}
function session(req: AuthedRequest, _res: Response, next: NextFunction) {
  const token = cookies(req).market_session;
  if (token) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const row = db.prepare(`SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?`).get(tokenHash, new Date().toISOString());
    if (row) req.user = safeUser(row);
  }
  next();
}
app.use(session);
function requireUser(req: AuthedRequest, res: Response, next: NextFunction) { if (!req.user) return res.status(401).json({ error: 'Please sign in.' }); next(); }
function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) { if (!isAdmin(req.user)) return res.status(403).json({ error: 'Admin access required.' }); next(); }
function setSession(res: Response, userId: string) { const token = randomBytes(32).toString('base64url'); const tokenHash = createHash('sha256').update(token).digest('hex'); const expiry = new Date(Date.now() + 30 * 86400000); db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').run(tokenHash, userId, expiry.toISOString()); res.setHeader('Set-Cookie', `market_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`); }

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'market-boys-api' }));
app.post('/api/auth/register', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase(); const displayName = String(req.body.displayName || '').trim(); const password = String(req.body.password || '');
  if (!/^\S+@\S+\.\S+$/.test(email) || displayName.length < 2 || password.length < 8) return res.status(400).json({ error: 'Use a valid name, email, and password of at least 8 characters.' });
  const id = randomUUID();
  try { db.prepare('INSERT INTO users(id,email,display_name,password_hash,role,created_at) VALUES(?,?,?,?,?,?)').run(id, email, displayName.slice(0, 120), hashPassword(password), email === ADMIN_EMAIL ? 'admin' : 'customer', new Date().toISOString()); }
  catch { return res.status(409).json({ error: 'An account with this email already exists.' }); }
  setSession(res, id); res.status(201).json({ user: safeUser(db.prepare('SELECT * FROM users WHERE id=?').get(id)) });
});
app.post('/api/auth/login', (req, res) => { const email = String(req.body.email || '').trim().toLowerCase(); const row: any = db.prepare('SELECT * FROM users WHERE email=?').get(email); if (!row || !passwordMatches(String(req.body.password || ''), row.password_hash)) return res.status(401).json({ error: 'Incorrect email or password.' }); setSession(res, row.id); res.json({ user: safeUser(row) }); });
app.post('/api/auth/logout', (req: AuthedRequest, res) => { const token = cookies(req).market_session; if (token) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(createHash('sha256').update(token).digest('hex')); res.setHeader('Set-Cookie', 'market_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'); res.json({ ok: true }); });
app.get('/api/auth/me', (req: AuthedRequest, res) => res.json({ user: req.user ? { uid: req.user.uid, email: req.user.email, displayName: req.user.displayName, emailVerified: true } : null }));
app.get('/api/auth/admin-status', requireUser, (req: AuthedRequest, res) => res.json({ isAdmin: isAdmin(req.user) }));

const publicRead = new Set(['storefront', 'shoppers', 'camera-sessions']);
const adminResources = new Set(['admin-orders', 'connectors', 'admin-grants', 'admin-video-calls']);
const ownedResources = new Set(['profile', 'shopping-lists', 'orders', 'video-calls']);
function canonical(resource: string) { return resource.replace(/^admin-/, ''); }
function readAllowed(resource: string, user?: SafeUser) { return publicRead.has(resource) || (ownedResources.has(resource) && user) || (adminResources.has(resource) && isAdmin(user)); }
function writeAllowed(resource: string, user?: SafeUser) { return ownedResources.has(resource) ? Boolean(user) : isAdmin(user); }
function decode(row: any) { return { id: row.id, ...JSON.parse(row.data), createdAt: row.created_at, updatedAt: row.updated_at }; }

app.get('/api/data/:resource', (req: AuthedRequest, res) => { const resource = req.params.resource; if (!readAllowed(resource, req.user)) return res.status(403).json({ error: 'Access denied.' }); const actual = canonical(resource); const rows = (adminResources.has(resource) ? db.prepare('SELECT * FROM records WHERE resource=? ORDER BY updated_at DESC').all(actual) : ownedResources.has(resource) ? db.prepare('SELECT * FROM records WHERE resource=? AND owner_id=? ORDER BY updated_at DESC').all(actual, req.user!.uid) : db.prepare('SELECT * FROM records WHERE resource=? ORDER BY updated_at DESC').all(actual)); res.json({ items: rows.map(decode) }); });
app.get('/api/data/:resource/:id', (req: AuthedRequest, res) => { const resource = req.params.resource; if (!readAllowed(resource, req.user)) return res.status(403).json({ error: 'Access denied.' }); const row: any = db.prepare('SELECT * FROM records WHERE resource=? AND id=?').get(canonical(resource), req.params.id); if (!row || (ownedResources.has(resource) && row.owner_id !== req.user?.uid && !isAdmin(req.user))) return res.status(404).json({ error: 'Not found.' }); res.json({ item: decode(row) }); });
app.post('/api/data/:resource', (req: AuthedRequest, res) => { const resource = req.params.resource; if (!writeAllowed(resource, req.user)) return res.status(403).json({ error: 'Access denied.' }); const actual = canonical(resource); const id = randomUUID(); const now = new Date().toISOString(); const data: any = { ...req.body }; if (actual === 'orders') Object.assign(data, { ownerId: req.user!.uid, status: 'pending_sourcing', assignedShopperName: '', paymentStatus: 'unpaid' }); if (actual === 'shopping-lists') data.ownerId = req.user!.uid; if (actual === 'video-calls') data.customerId = req.user!.uid; db.prepare('INSERT INTO records(resource,id,owner_id,data,created_at,updated_at) VALUES(?,?,?,?,?,?)').run(actual, id, req.user?.uid || null, JSON.stringify(data), now, now); res.status(201).json({ id }); });
app.put('/api/data/:resource/:id', (req: AuthedRequest, res) => { const resource = req.params.resource; if (!writeAllowed(resource, req.user)) return res.status(403).json({ error: 'Access denied.' }); const actual = canonical(resource); const existing: any = db.prepare('SELECT * FROM records WHERE resource=? AND id=?').get(actual, req.params.id); if (existing && !isAdmin(req.user) && existing.owner_id !== req.user?.uid) return res.status(403).json({ error: 'Access denied.' }); const now = new Date().toISOString(); const data = { ...(existing ? JSON.parse(existing.data) : {}), ...req.body }; const owner = existing?.owner_id || req.user?.uid || null; db.prepare(`INSERT INTO records(resource,id,owner_id,data,created_at,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(resource,id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at`).run(actual, req.params.id, owner, JSON.stringify(data), existing?.created_at || now, now); res.json({ id: req.params.id }); });
app.delete('/api/data/:resource/:id', (req: AuthedRequest, res) => { const resource = req.params.resource; if (!writeAllowed(resource, req.user)) return res.status(403).json({ error: 'Access denied.' }); const actual = canonical(resource); const existing: any = db.prepare('SELECT owner_id FROM records WHERE resource=? AND id=?').get(actual, req.params.id); if (existing && !isAdmin(req.user) && existing.owner_id !== req.user?.uid) return res.status(403).json({ error: 'Access denied.' }); db.prepare('DELETE FROM records WHERE resource=? AND id=?').run(actual, req.params.id); res.json({ ok: true }); });

app.post('/api/calls/:id/candidates/:side', requireUser, (req, res) => { db.prepare('INSERT INTO ice_candidates(id,call_id,side,data,created_at) VALUES(?,?,?,?,?)').run(randomUUID(), req.params.id, req.params.side, JSON.stringify(req.body), new Date().toISOString()); res.status(201).json({ ok: true }); });
app.get('/api/calls/:id/candidates/:side', requireUser, (req, res) => res.json({ items: db.prepare('SELECT data FROM ice_candidates WHERE call_id=? AND side=? ORDER BY created_at').all(req.params.id, req.params.side).map((row: any) => JSON.parse(row.data)) }));
app.post('/api/seed/shoppers', requireAdmin, (_req, res) => res.json({ ok: true }));
app.post('/api/seed/connectors', requireAdmin, (_req, res) => res.json({ ok: true }));
app.post('/api/payments/initialize', requireUser, (_req, res) => res.status(501).json({ error: 'Choose a payment provider and configure its server-side keys before enabling checkout.' }));

if (process.env.NODE_ENV === 'production') { const dist = path.resolve('dist'); app.use(express.static(dist)); app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html'))); }
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => { console.error(error); res.status(500).json({ error: 'Internal server error.' }); });
app.listen(PORT, () => console.log(`Market Boys API running at http://localhost:${PORT}`));
