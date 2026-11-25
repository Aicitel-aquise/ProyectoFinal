/**
 * AETHER LAB // Métricas Tácticas y Módulo de Estimación COCOMO II
 */

const express = require('express');
const router = express.Router();
const fs = require('node:fs');
const path = require('node:path');
const db = require('../database');
const { verifyToken } = require('../middleware/auth');

/**
 * GET /api/metricas/dashboard
 * Retorna contadores en tiempo real de equipos, préstamos y estado operativo
 */
router.get('/dashboard', (req, res) => {
    try {
        const statsEquipos = db.get(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'DISPONIBLE' THEN 1 ELSE 0 END) as disponibles,
                SUM(CASE WHEN estado = 'PRESTADO' THEN 1 ELSE 0 END) as prestados,
                SUM(CASE WHEN estado = 'EN_MANTENIMIENTO' THEN 1 ELSE 0 END) as mantenimiento,
                SUM(CASE WHEN estado = 'DANADO' THEN 1 ELSE 0 END) as danados,
                SUM(CASE WHEN estado = 'DE_BAJA' THEN 1 ELSE 0 END) as baja
            FROM equipos
        `);

        const statsPrestamos = db.get(`
            SELECT 
                COUNT(*) as total_historico,
                SUM(CASE WHEN estado_prestamo = 'ACTIVO' THEN 1 ELSE 0 END) as activos,
                SUM(CASE WHEN estado_prestamo = 'DEVUELTO' THEN 1 ELSE 0 END) as devueltos,
                SUM(CASE WHEN estado_prestamo = 'ACTIVO' AND datetime(fecha_limite) < datetime('now') THEN 1 ELSE 0 END) as vencidos
            FROM prestamos
        `);

        const categorias = db.query(`
            SELECT categoria, COUNT(*) as cantidad,
                   SUM(CASE WHEN estado = 'DISPONIBLE' THEN 1 ELSE 0 END) as disponibles,
                   SUM(CASE WHEN estado = 'PRESTADO' THEN 1 ELSE 0 END) as prestados
            FROM equipos
            GROUP BY categoria
            ORDER BY cantidad DESC
        `);

        const actividadReciente = db.query(`
            SELECT 
                h.id, h.equipo_id, h.estado_anterior, h.estado_nuevo, h.motivo, h.fecha,
                e.codigo as equipo_codigo, e.nombre as equipo_nombre,
                u.nombre as usuario_nombre
            FROM historial_estados h
            JOIN equipos e ON h.equipo_id = e.id
            LEFT JOIN usuarios u ON h.usuario_id = u.id
            ORDER BY h.fecha DESC
            LIMIT 8
        `);

        const totalEquipos = statsEquipos.total || 0;
        const operativos = (statsEquipos.disponibles || 0) + (statsEquipos.prestados || 0);
        const tasaOperatividad = totalEquipos > 0 
            ? Math.round((operativos / totalEquipos) * 100) 
            : 100;

        return res.json({
            success: true,
            equipos: {
                total: totalEquipos,
                disponibles: statsEquipos.disponibles || 0,
                prestados: statsEquipos.prestados || 0,
                mantenimiento: statsEquipos.mantenimiento || 0,
                danados: statsEquipos.danados || 0,
                baja: statsEquipos.baja || 0,
                tasa_operatividad: tasaOperatividad
            },
            prestamos: {
                total_historico: statsPrestamos.total_historico || 0,
                activos: statsPrestamos.activos || 0,
                devueltos: statsPrestamos.devueltos || 0,
                vencidos: statsPrestamos.vencidos || 0
            },
            categorias,
            actividad_reciente: actividadReciente
        });
    } catch (err) {
        console.error('[METRICAS DASHBOARD ERROR]:', err);
        return res.status(500).json({ success: false, message: 'Error al calcular métricas.', error: err.message });
    }
});

/**
 * Función auxiliar para escanear archivos de código fuente y contar líneas
 */
function scanDirectoryCode(dirPath, extensions = ['.js', '.html', '.css', '.sql', '.json']) {
    let files = [];
    if (!fs.existsSync(dirPath)) return files;

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            if (entry.name !== 'node_modules' && entry.name !== '.git') {
                files = files.concat(scanDirectoryCode(fullPath, extensions));
            }
        } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (extensions.includes(ext)) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    const lines = content.split('\n');
                    let blankLines = 0;
                    let commentLines = 0;
                    let codeLines = 0;

                    for (const rawLine of lines) {
                        const line = rawLine.trim();
                        if (line.length === 0) {
                            blankLines++;
                        } else if (
                            line.startsWith('//') || 
                            line.startsWith('/*') || 
                            line.startsWith('*') || 
                            line.startsWith('<!--') || 
                            line.startsWith('--')
                        ) {
                            commentLines++;
                        } else {
                            codeLines++;
                        }
                    }

                    files.push({
                        relativePath: path.relative(path.join(__dirname, '..', '..'), fullPath).replace(/\\/g, '/'),
                        fileName: entry.name,
                        extension: ext,
                        totalLines: lines.length,
                        blankLines,
                        commentLines,
                        sloc: codeLines,
                        bytes: Buffer.byteLength(content, 'utf8')
                    });
                } catch (e) {
                    // Ignorar errores de lectura puntuales
                }
            }
        }
    }
    return files;
}

/**
 * GET /api/metricas/cocomo
 * Análisis dinámico del código fuente del proyecto y cálculo del modelo COCOMO II
 * (Soporte directo para estimación de esfuerzo en Ingeniería de Software)
 */
router.get('/cocomo', (req, res) => {
    try {
        const rootDir = path.join(__dirname, '..', '..');
        const codeFiles = scanDirectoryCode(rootDir);

        // Agrupar por capa / módulo
        const capas = {
            backend: { nombre: 'Capa Backend (Node/Express API)', sloc: 0, totalLines: 0, files: 0, bytes: 0 },
            frontend: { nombre: 'Capa Presentación (UI/UX Táctico)', sloc: 0, totalLines: 0, files: 0, bytes: 0 },
            database: { nombre: 'Capa de Datos (SQL Relacional)', sloc: 0, totalLines: 0, files: 0, bytes: 0 },
            configuracion: { nombre: 'Configuración y Metadatos', sloc: 0, totalLines: 0, files: 0, bytes: 0 }
        };

        for (const f of codeFiles) {
            let targetCapa = 'configuracion';
            if (f.relativePath.startsWith('backend/')) targetCapa = 'backend';
            else if (f.relativePath.startsWith('frontend/')) targetCapa = 'frontend';
            else if (f.relativePath.startsWith('database/')) targetCapa = 'database';

            capas[targetCapa].sloc += f.sloc;
            capas[targetCapa].totalLines += f.totalLines;
            capas[targetCapa].bytes += f.bytes;
            capas[targetCapa].files += 1;
        }

        const totalSloc = codeFiles.reduce((acc, f) => acc + f.sloc, 0);
        const totalLines = codeFiles.reduce((acc, f) => acc + f.totalLines, 0);
        const totalCommentLines = codeFiles.reduce((acc, f) => acc + f.commentLines, 0);
        const totalBlankLines = codeFiles.reduce((acc, f) => acc + f.blankLines, 0);
        const ksloc = parseFloat((totalSloc / 1000).toFixed(3));

        // -------------------------------------------------------------
        // PARÁMETROS Y CÁLCULOS DEL MODELO COCOMO II (Early Design / Post-Architecture)
        // -------------------------------------------------------------
        // Ecuación Básica de Esfuerzo (Person-Months):
        // PM = A * (KSLOC)^E * prod(EM)
        // Coeficiente nominal A = 2.94
        // Exponente de Escala E = 1.05 (Proyecto Semi-detached / Modern Web)
        // Factores de Esfuerzo EM = 1.00 (Nominal)
        //
        // Ecuación de Tiempo de Desarrollo (Months):
        // TDEV = C * (PM)^F
        // Coeficiente C = 3.67
        // Exponente F = 0.28
        // -------------------------------------------------------------
        const A = 2.94;
        const E = 1.05;
        const C = 3.67;
        const F = 0.28;

        const effectiveKsloc = Math.max(ksloc, 0.2); // Proteger base no-cero
        const esfuerzoPM = parseFloat((A * Math.pow(effectiveKsloc, E)).toFixed(2));
        const tiempoTDEV = parseFloat((C * Math.pow(esfuerzoPM, F)).toFixed(2));
        const personalPromedio = parseFloat((esfuerzoPM / tiempoTDEV).toFixed(2));
        const costoEstimadoUSD = Math.round(esfuerzoPM * 3200); // Costo referencial $3,200 USD/mes-hombre

        // Catálogo de endpoints/rutas activas para auditoría de diseño
        const endpoints = [
            { metodo: 'POST', ruta: '/api/auth/login', descripcion: 'Autenticación con email y hash bcrypt' },
            { metodo: 'POST', ruta: '/api/auth/register', descripcion: 'Alta de usuario con contraseña cifrada' },
            { metodo: 'GET', ruta: '/api/auth/me', descripcion: 'Datos del operador autenticado actual' },
            { metodo: 'GET', ruta: '/api/equipos', descripcion: 'Catálogo con filtros por categoría y estado' },
            { metodo: 'GET', ruta: '/api/equipos/:id', descripcion: 'Detalle de equipo e historial de estados' },
            { metodo: 'POST', ruta: '/api/equipos', descripcion: 'Alta de equipo (Admin/Encargado)' },
            { metodo: 'PUT', ruta: '/api/equipos/:id', descripcion: 'Edición de equipo (Admin/Encargado)' },
            { metodo: 'PATCH', ruta: '/api/equipos/:id/estado', descripcion: 'Cambio de estado y registro en historial' },
            { metodo: 'DELETE', ruta: '/api/equipos/:id', descripcion: 'Eliminación segura con validación de préstamos' },
            { metodo: 'GET', ruta: '/api/prestamos', descripcion: 'Listado de préstamos con cálculo de vencimiento' },
            { metodo: 'POST', ruta: '/api/prestamos', descripcion: 'Regla: Solo equipo DISPONIBLE pasa a PRESTADO' },
            { metodo: 'POST', ruta: '/api/prestamos/:id/devolver', descripcion: 'Regla: Devolución con estado OPERATIVO/MANT/DAÑADO' },
            { metodo: 'GET', ruta: '/api/usuarios', descripcion: 'Gestión de operadores y roles (Admin/Encargado)' },
            { metodo: 'PATCH', ruta: '/api/usuarios/:id/rol', descripcion: 'Modificación de rol/estado de operador' },
            { metodo: 'GET', ruta: '/api/metricas/dashboard', descripcion: 'KPIs tácticos en tiempo real' },
            { metodo: 'GET', ruta: '/api/metricas/cocomo', descripcion: 'Inspección de código y estimación COCOMO II' }
        ];

        return res.json({
            success: true,
            resumen_codigo: {
                total_archivos: codeFiles.length,
                total_lineas: totalLines,
                lineas_codigo_fuente_sloc: totalSloc,
                lineas_comentarios: totalCommentLines,
                lineas_en_blanco: totalBlankLines,
                ksloc,
                tamano_kb: parseFloat((codeFiles.reduce((acc, f) => acc + f.bytes, 0) / 1024).toFixed(2))
            },
            capas,
            archivos: codeFiles,
            estimacion_cocomo_ii: {
                modelo: 'COCOMO II (Early Design / Post-Architecture)',
                modo_proyecto: 'Semi-Detached / Modern High-Assurance Web System',
                constantes: { A, E, C, F },
                tamano_ksloc: ksloc,
                esfuerzo_persona_meses_pm: esfuerzoPM,
                tiempo_desarrollo_meses_tdev: tiempoTDEV,
                personal_estimado_personas: personalPromedio,
                costo_estimado_usd: costoEstimadoUSD,
                formula_esfuerzo: 'PM = 2.94 * (KSLOC)^1.05',
                formula_tiempo: 'TDEV = 3.67 * (PM)^0.28'
            },
            arquitectura: {
                patron: 'Arquitectura en 3 Capas (Presentación / Controladores API / Acceso a Datos SQL)',
                total_rutas_api: endpoints.length,
                endpoints
            }
        });
    } catch (err) {
        console.error('[COCOMO ESTIMATION ERROR]:', err);
        return res.status(500).json({ success: false, message: 'Error en la estimación COCOMO II.', error: err.message });
    }
});

module.exports = router;
