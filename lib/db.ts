import { Pool } from "pg"

type GlobalWithDb = typeof globalThis & { __dbPool?: Pool }

const globalWithDb = globalThis as GlobalWithDb

const pool =
  globalWithDb.__dbPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
  })

if (!globalWithDb.__dbPool) {
  globalWithDb.__dbPool = pool
}

export async function query<T>(text: string, params?: unknown[]) {
  const result = await pool.query<T>(text, params)
  return result
}
