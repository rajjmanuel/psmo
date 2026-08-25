import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __psmoMysqlPool?: mysql.Pool;
};

export const pool =
  globalForDb.__psmoMysqlPool ??
  mysql.createPool({
    uri: databaseUrl,
    timezone: "Z",
    dateStrings: true,
  });

pool.on("connection", (connection) => {
  void connection.query("SET time_zone = '+00:00'");
});

if (process.env.NODE_ENV !== "production") {
  globalForDb.__psmoMysqlPool = pool;
}

export const db = drizzle(pool);
