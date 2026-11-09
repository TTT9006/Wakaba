import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { databaseLocation } from '../../../packages/shared/database-location';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Nếu file CSDL đã được đóng gói sẵn trong Docker (/app/prisma/learning.db),
// luôn ưu tiên dùng file SQLite cục bộ chứa trọn vẹn 22.645 từ vựng,
// loại bỏ biến môi trường Turso còn sót lại trên Render dashboard.
if (existsSync('/app/prisma/learning.db')) {
  process.env.DATABASE_URL = 'file:/app/prisma/learning.db';
  delete process.env.TURSO_DATABASE_URL;
  delete process.env.TURSO_AUTH_TOKEN;
}

const tursoUrl =
  process.env.DATABASE_URL?.startsWith('file:')
    ? undefined
    : (process.env.TURSO_DATABASE_URL ||
       (process.env.DATABASE_URL?.startsWith('libsql://') || process.env.DATABASE_URL?.startsWith('https://')
         ? process.env.DATABASE_URL
         : undefined));

function initDatabase(): PrismaClient {
  if (tursoUrl) {
    const adapter = new PrismaLibSQL({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return new PrismaClient({ adapter });
  }

  const resolvedLocation = databaseLocation(process.env.DATABASE_URL);
  process.env.DATABASE_URL = resolvedLocation.url;
  return new PrismaClient();
}

export async function ensureDatabaseSchema() {
  const migrationsDir = path.resolve('prisma/migrations');
  const folders = readdirSync(migrationsDir)
    .filter((f) => /^\d/.test(f))
    .sort();

  if (tursoUrl) {
    const client = createClient({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    try {
      await client.execute(`CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "checksum" TEXT NOT NULL,
        "finished_at" DATETIME,
        "migration_name" TEXT NOT NULL,
        "logs" TEXT,
        "rolled_back_at" DATETIME,
        "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "applied_steps_count" INTEGER NOT NULL DEFAULT 0
      );`);

      const check = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='User'");
      const userExists = check.rows.length > 0;

      for (const folder of folders) {
        const migCheck = await client.execute({
          sql: 'SELECT id FROM "_prisma_migrations" WHERE migration_name = ?',
          args: [folder],
        });
        if (migCheck.rows.length === 0) {
          try {
            const sql = readFileSync(path.join(migrationsDir, folder, 'migration.sql'), 'utf8');
            await client.executeMultiple(sql);
          } catch (e) {
            console.warn(`Migration ${folder} executed with note:`, (e as Error).message);
          }
          await client.execute({
            sql: `INSERT OR IGNORE INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count") VALUES (?, ?, ?, ?, 1)`,
            args: [crypto.randomUUID(), 'baseline', Date.now(), folder],
          });
        }
      }
    } catch (err) {
      console.error('Lỗi khi tự động khởi tạo schema Turso:', err);
    } finally {
      client.close();
    }
    return;
  }

  // Khởi tạo bảng tự động cho SQLite cục bộ khi chạy trên container mới
  try {
    const { DatabaseSync } = await import('node:sqlite');
    const resolvedLocation = databaseLocation(process.env.DATABASE_URL);
    const sqlite = new DatabaseSync(resolvedLocation.filename);
    try {
      sqlite.exec(`CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id" TEXT PRIMARY KEY NOT NULL,
        "checksum" TEXT NOT NULL,
        "finished_at" DATETIME,
        "migration_name" TEXT NOT NULL,
        "logs" TEXT,
        "rolled_back_at" DATETIME,
        "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "applied_steps_count" INTEGER NOT NULL DEFAULT 0
      );`);

      const check = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='User'").all();
      const userExists = check.length > 0;

      const checkMig = sqlite.prepare('SELECT id FROM "_prisma_migrations" WHERE migration_name = ?');
      const insertMig = sqlite.prepare(
        'INSERT OR IGNORE INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count") VALUES (?, ?, ?, ?, 1)',
      );

      for (const folder of folders) {
        const migExists = checkMig.all(folder);
        if (migExists.length === 0) {
          try {
            const sql = readFileSync(path.join(migrationsDir, folder, 'migration.sql'), 'utf8');
            sqlite.exec(sql);
          } catch (e) {
            console.warn(`Migration ${folder} executed with note:`, (e as Error).message);
          }
          insertMig.run(crypto.randomUUID(), 'baseline', Date.now(), folder);
        }
      }
    } finally {
      sqlite.close();
    }
  } catch (err) {
    console.error('Lỗi khi khởi tạo SQLite cục bộ:', err);
  }
}

export const db = initDatabase();
