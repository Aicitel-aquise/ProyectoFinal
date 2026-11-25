/**
 * AETHER LAB // Módulo de Acceso a Base de Datos SQL
 * Capa de Datos relacional implementada sobre SQLite nativo de Node.js (DatabaseSync).
 * Compatible con ANSI SQL / SQLite / PostgreSQL / SQL Server.
 */

const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

const DB_PATH = path.join(__dirname, '..', 'database', 'aether_lab.db');
const SCHEMA_PATH = path.join(__dirname, '..', 'database', 'schema.sql');
const SEED_PATH = path.join(__dirname, '..', 'database', 'seed.sql');

// Crear o abrir la base de datos
let dbInstance = null;

function getDb() {
    if (!dbInstance) {
        dbInstance = new DatabaseSync(DB_PATH);
        // Habilitar claves foráneas en SQLite
        dbInstance.exec('PRAGMA foreign_keys = ON;');
    }
    return dbInstance;
}

/**
 * Inicializa la base de datos ejecutando el esquema si las tablas no existen
 * y sembrando datos de prueba iniciales si la tabla de usuarios está vacía.
 */
function initDatabase(forceSeed = false) {
    const db = getDb();

    // 1. Ejecutar Schema
    if (fs.existsSync(SCHEMA_PATH)) {
        const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
        db.exec(schemaSql);
        console.log('[AETHER-DB] Esquema SQL verificado e inicializado.');
    } else {
        console.warn('[AETHER-DB] Archivo schema.sql no encontrado en:', SCHEMA_PATH);
    }

    // 2. Verificar si se deben sembrar datos iniciales
    const userCountStmt = db.prepare('SELECT COUNT(*) as count FROM usuarios');
    const result = userCountStmt.get();
    const shouldSeed = forceSeed || (result && result.count === 0);

    if (shouldSeed && fs.existsSync(SEED_PATH)) {
        const seedSql = fs.readFileSync(SEED_PATH, 'utf-8');
        db.exec(seedSql);
        console.log('[AETHER-DB] Datos semilla (Seed) cargados satisfactoriamente.');
    }
}

/**
 * Ejecuta una consulta SELECT y retorna múltiples filas
 */
function query(sql, params = []) {
    const db = getDb();
    const stmt = db.prepare(sql);
    return stmt.all(...params);
}

/**
 * Ejecuta una consulta SELECT y retorna una única fila
 */
function get(sql, params = []) {
    const db = getDb();
    const stmt = db.prepare(sql);
    return stmt.get(...params);
}

/**
 * Ejecuta INSERT, UPDATE o DELETE y retorna metadatos (lastInsertRowid, changes)
 */
function run(sql, params = []) {
    const db = getDb();
    const stmt = db.prepare(sql);
    return stmt.run(...params);
}

/**
 * Ejecuta código SQL directo (múltiples sentencias)
 */
function exec(sql) {
    const db = getDb();
    return db.exec(sql);
}

/**
 * Ejecuta una función dentro de una transacción atómica
 */
function transaction(fn) {
    const db = getDb();
    db.exec('BEGIN IMMEDIATE TRANSACTION;');
    try {
        const res = fn();
        db.exec('COMMIT;');
        return res;
    } catch (err) {
        db.exec('ROLLBACK;');
        throw err;
    }
}

// Ejecución directa por CLI si se invoca con `node backend/database.js --seed`
if (require.main === module) {
    const isSeed = process.argv.includes('--seed');
    initDatabase(isSeed);
    console.log('[AETHER-DB] Base de datos lista.');
}

module.exports = {
    getDb,
    initDatabase,
    query,
    get,
    run,
    exec,
    transaction
};
