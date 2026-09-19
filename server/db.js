// Gerenciador de Banco de Dados (Compatível com Node 24 native node:sqlite e Cloudflare D1)
import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'biazotto.sqlite');

export class DatabaseAdapter {
  constructor(d1Binding = null) {
    this.isD1 = !!d1Binding;
    this.d1 = d1Binding;

    if (!this.isD1) {
      this.db = new DatabaseSync(DB_PATH);
      this.db.exec('PRAGMA foreign_keys = ON;');
      this.runMigrations();
    }
  }

  runMigrations() {
    const migrationSqlPath = path.join(__dirname, 'migrations.sql');
    if (fs.existsSync(migrationSqlPath)) {
      const sql = fs.readFileSync(migrationSqlPath, 'utf8');
      this.db.exec(sql);
    }
  }

  // Executa uma query que retorna múltiplas linhas
  async all(query, params = []) {
    if (this.isD1) {
      const stmt = this.d1.prepare(query);
      const res = await (params.length ? stmt.bind(...params) : stmt).all();
      return res.results || [];
    }
    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  // Executa uma query que retorna uma única linha
  async get(query, params = []) {
    if (this.isD1) {
      const stmt = this.d1.prepare(query);
      return await (params.length ? stmt.bind(...params) : stmt).first();
    }
    const stmt = this.db.prepare(query);
    return stmt.get(...params) || null;
  }

  // Executa uma instrução (INSERT, UPDATE, DELETE)
  async run(query, params = []) {
    if (this.isD1) {
      const stmt = this.d1.prepare(query);
      return await (params.length ? stmt.bind(...params) : stmt).run();
    }
    const stmt = this.db.prepare(query);
    return stmt.run(...params);
  }

  // Executa múltiplas instruções SQL em lote
  async exec(sql) {
    if (this.isD1) {
      return await this.d1.exec(sql);
    }
    return this.db.exec(sql);
  }
}

// Singleton local por padrão
export const db = new DatabaseAdapter();
export const getDb = () => db;
export const initDb = async () => db.runMigrations();
export default db;
