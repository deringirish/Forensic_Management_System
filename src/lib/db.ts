import fs from 'fs';
import path from 'path';
import mysql, { Pool } from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'forensic_management_system',
};

let pool: Pool | null = null;
let isInitialized = false;
let isStandbyMode = false;

export function getPool(): Pool {
  if (isStandbyMode) {
    throw new Error('Database is in standby mode. MySQL server on localhost:3306 is currently unreachable.');
  }
  if (!pool) {
    pool = mysql.createPool({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }
  return pool;
}

export async function initDatabase(): Promise<void> {
  if (isInitialized) return;

  // Try creating database first
  let initialConn;
  try {
    initialConn = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
    });

    await initialConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    await initialConn.end();
  } catch (err: any) {
    console.warn('⚠️ WARNING: Could not connect to MySQL server. Standby mode active.', err.message);
    isStandbyMode = true;
    isInitialized = true;
    return;
  }

  try {
    const activePool = getPool();
    const conn = await activePool.getConnection();
    conn.release();

    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      const statements = schemaSql
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/--.*$/gm, '')
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      for (const statement of statements) {
        if (!statement.toLowerCase().startsWith('create database') && !statement.toLowerCase().startsWith('use')) {
          await runRaw(statement);
        }
      }
    }

    const countRoles = await get('SELECT COUNT(*) as count FROM roles');
    if (!countRoles || countRoles.count === 0) {
      const seedPath = path.join(process.cwd(), 'database', 'seed.sql');
      if (fs.existsSync(seedPath)) {
        const seedSql = fs.readFileSync(seedPath, 'utf8');
        const seedStatements = seedSql
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/--.*$/gm, '')
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0);

        for (const statement of seedStatements) {
          if (!statement.toLowerCase().startsWith('use')) {
            await runRaw(statement);
          }
        }
      }
    }

    // Ensure default hashes are corrected
    const oldAdminHash = '$2a$10$fV28nJb2/0XgY5uQ8g9ZreU7IUnD3KjWlO96Hwz6UeMsh7E9R/V8.';
    const oldInvestigatorHash = '$2a$10$C8l8HjZfP6Suxu7tI8rI7OaIq6p9v7XwB7D0H6lRbeVd29p7m7tD6';
    const oldAnalystHash = '$2a$10$GfO3Z7pS4DrtZ8o6G6jLleY6vG6p1S8W6v8N7D1KbfRfeZ7R7h7tD';

    await runRaw('UPDATE users SET password_hash = ? WHERE user_id = 1 AND password_hash = ?', [
      '$2b$10$hC3wdVepgqwqmO0mc.zQQ.e32LnUGkQEDNDrZpKI3GFl/rfFG5KBu', oldAdminHash
    ]);
    await runRaw('UPDATE users SET password_hash = ? WHERE user_id = 2 AND password_hash = ?', [
      '$2b$10$hhP/REXGz8.AGrTdbHCIUe5CGxtkBaaCNECuTshMzr41.7VjM4QKi', oldInvestigatorHash
    ]);
    await runRaw('UPDATE users SET password_hash = ? WHERE user_id = 3 AND password_hash = ?', [
      '$2b$10$f5uxP57rSjt46GZJteQFRel3QPs40APJmDmXAY3QfufOG51UKSlx.', oldAnalystHash
    ]);

    isInitialized = true;
  } catch (err: any) {
    console.error('Error during MySQL verification/seeding:', err);
    throw err;
  }
}

// Helpers
async function runRaw(sql: string, params: any[] = []) {
  const activePool = getPool();
  const [result] = await activePool.execute(sql, params);
  return {
    lastID: (result as any).insertId || 0,
    changes: (result as any).affectedRows || 0,
  };
}

export const query = async (sql: string, params: any[] = []): Promise<any[]> => {
  await initDatabase();
  if (isStandbyMode) return [];
  try {
    const activePool = getPool();
    const [rows] = await activePool.execute(sql, params);
    return rows as any[];
  } catch (err) {
    console.error(`MySQL Query Error [${sql}]:`, err);
    throw err;
  }
};

export const get = async (sql: string, params: any[] = []): Promise<any> => {
  await initDatabase();
  if (isStandbyMode) return null;
  try {
    const activePool = getPool();
    const [rows] = await activePool.execute(sql, params);
    const results = rows as any[];
    return results && results.length > 0 ? results[0] : null;
  } catch (err) {
    console.error(`MySQL Get Error [${sql}]:`, err);
    throw err;
  }
};

export const run = async (sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> => {
  await initDatabase();
  if (isStandbyMode) return { lastID: 0, changes: 0 };
  try {
    return await runRaw(sql, params);
  } catch (err) {
    console.error(`MySQL Run Error [${sql}]:`, err);
    throw err;
  }
};

export async function logAction(userId: number | null, action: string, tableName: string, recordId: number | null, ip: string = '127.0.0.1') {
  const timestamp = new Date().toISOString();
  try {
    await run(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, timestamp, ip_address) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, action, tableName, recordId, timestamp, ip]
    );
  } catch (err) {
    console.error('Failed to log audit action:', err);
  }
}

export async function logTimeline(caseId: number, performedBy: number, action: string, description: string) {
  const createdAt = new Date().toISOString();
  try {
    await run(
      `INSERT INTO case_timeline (case_id, performed_by, action, description, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [caseId, performedBy, action, description, createdAt]
    );
  } catch (err) {
    console.error('Failed to log timeline event:', err);
  }
}
