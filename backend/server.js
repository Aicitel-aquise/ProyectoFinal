/**
 * ============================================================================
 * AETHER LAB // CENTRO TÁCTICO DE CONTROL DE PRÉSTAMOS
 * Servidor Principal y Controlador de Capa de Lógica de Negocio
 * ============================================================================
 */

const express = require('express');
const cors = require('cors');
const path = require('node:path');
const db = require('./database');

const authRoutes = require('./routes/auth');
const equiposRoutes = require('./routes/equipos');
const prestamosRoutes = require('./routes/prestamos');
const usuariosRoutes = require('./routes/usuarios');
const metricasRoutes = require('./routes/metricas');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Inicializar Base de Datos Relacional y Esquema SQL
console.log('------------------------------------------------------------');
console.log('⚡ AETHER LAB // INICIALIZANDO CAPA DE ACCESO A DATOS SQL...');
db.initDatabase(false);

// 2. Middlewares Globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Servir Capa de Presentación (Frontend Táctico)
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR));

// 4. Montar Rutas de la API REST
app.use('/api/auth', authRoutes);
app.use('/api/equipos', equiposRoutes);
app.use('/api/prestamos', prestamosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/metricas', metricasRoutes);

// Endpoint de verificación de estado del sistema (Healthcheck)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OPERATIONAL',
        system: 'AETHER LAB // Tactical Equipment Control API',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime_seconds: process.uptime()
    });
});

// Redirección para Single Page Application
app.get('*', (req, res) => {
    // Si la ruta solicitada no es de la API, servir index.html
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
    } else {
        res.status(404).json({ success: false, message: 'Endpoint no encontrado en AETHER API.' });
    }
});

// Manejador centralizado de errores
app.use((err, req, res, next) => {
    console.error('❌ [SERVER ERROR]:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error no controlado en el servidor AETHER.',
        error: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

// Iniciar Servidor HTTP
const server = app.listen(PORT, () => {
    console.log('============================================================');
    console.log('🛰️  AETHER LAB // CONSOLA TÁCTICA DE CONTROL EN LÍNEA');
    console.log(`🌐  Servidor Activo en: http://localhost:${PORT}`);
    console.log('📡  Capa 1 (Presentación):   frontend/ (Modo Oscuro Cinematográfico)');
    console.log('⚙️  Capa 2 (Lógica/API):     backend/ (Node.js + Express + JWT)');
    console.log('💾  Capa 3 (Datos SQL):       database/ (SQLite Relacional + ANSI SQL)');
    console.log('============================================================');
});

module.exports = { app, server };
