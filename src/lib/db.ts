// Database helper — Cloudflare D1 in production, better-sqlite3 for local dev

import path from "path";

let localDb: LocalDB | null = null;

export interface LocalDB {
  prepare(sql: string): {
    bind(...params: unknown[]): {
      all<T = unknown>(): Promise<{ results: T[] }> | { results: T[] };
      first<T = unknown>(): Promise<T | null> | T | null;
      run(): Promise<{ success: boolean }> | { success: boolean };
    };
    all<T = unknown>(): Promise<{ results: T[] }> | { results: T[] };
    first<T = unknown>(): Promise<T | null> | T | null;
    run(): Promise<{ success: boolean }> | { success: boolean };
  };
  exec(sql: string): void;
}

function createLocalDB(): LocalDB {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3");
  const dbPath = path.join(process.cwd(), "local.db");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  return {
    prepare(sql: string) {
      const stmt = db.prepare(sql);
      return {
        bind(...params: unknown[]) {
          return {
            all() {
              return { results: stmt.all(...params) };
            },
            first() {
              return stmt.get(...params) || null;
            },
            run() {
              stmt.run(...params);
              return { success: true };
            },
          };
        },
        all() {
          return { results: stmt.all() };
        },
        first() {
          return stmt.get() || null;
        },
        run() {
          stmt.run();
          return { success: true };
        },
      };
    },
    exec(sql: string) {
      db.exec(sql);
    },
  };
}

export async function getDB(): Promise<LocalDB> {
  // Try Cloudflare D1 binding first (production)
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext();
    if (env?.DB) return env.DB as unknown as LocalDB;
  } catch {
    // Not in Cloudflare environment
  }

  // Local dev fallback
  if (!localDb) {
    localDb = createLocalDB();
  }
  return localDb;
}

export async function getR2() {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext();
    if (env?.R2) return env.R2;
  } catch {
    // Not in Cloudflare environment
  }
  return null;
}

let initialized = false;

export async function initLocalDB() {
  if (initialized) return;
  initialized = true;

  const db = await getDB();
  try {
    const fs = await import("fs");
    const schemaPath = path.join(process.cwd(), "db", "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");
    const statements = schema.split(";").filter((s) => s.trim());
    for (const stmt of statements) {
      try {
        db.exec(stmt + ";");
      } catch {
        // Table might already exist
      }
    }
  } catch {
    // Schema file might not exist in production (D1 schema applied via wrangler)
  }
}
