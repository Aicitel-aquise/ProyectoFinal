/**
 * AETHER LAB // Rutas del Catálogo de Equipos e Instrumental
 */

const express = require('express');
const router = express.Router();
const db = require('../database');
const { verifyToken, requireRole } = require('../middleware/auth');

/**
 * GET /api/equipos
 * Listado de equipos con soporte para filtros por estado, categoría y búsqueda textual
 */
router.get('/', (req, res) => {
    try {
        const { estado, categoria, q } = req.query;
        let sql = 'SELECT * FROM equipos WHERE 1=1';
        const params = [];

        if (estado && estado !== 'TODOS') {
            sql += ' AND estado = ?';
            params.push(estado.toUpperCase());
        }

        if (categoria && categoria !== 'TODAS') {
            sql += ' AND LOWER(categoria) = ?';
            params.push(categoria.toLowerCase());
        }

        if (q && q.trim()) {
            const searchTerm = `%${q.trim().toLowerCase()}%`;
            sql += ' AND (LOWER(nombre) LIKE ? OR LOWER(codigo) LIKE ? OR LOWER(marca) LIKE ? OR LOWER(modelo) LIKE ? OR LOWER(descripcion) LIKE ?)';
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }

        sql += ' ORDER BY id ASC';
        const equipos = db.query(sql, params);

        return res.json({
            success: true,
            total: equipos.length,
            equipos
        });
    } catch (err) {
        console.error('[EQUIPOS LIST ERROR]:', err);
        return res.status(500).json({ success: false, message: 'Error al consultar equipos.', error: err.message });
    }
});

/**
 * GET /api/equipos/:id
 * Detalles de un equipo específico junto con su historial de estados
 */
router.get('/:id', (req, res) => {
    try {
        const equipo = db.get('SELECT * FROM equipos WHERE id = ?', [req.params.id]);
        if (!equipo) {
            return res.status(404).json({ success: false, message: 'Equipo no encontrado en el inventario.' });
        }

        const historial = db.query(
            `SELECT h.*, u.nombre as usuario_nombre 
             FROM historial_estados h 
             LEFT JOIN usuarios u ON h.usuario_id = u.id 
             WHERE h.equipo_id = ? 
             ORDER BY h.fecha DESC`,
            [req.params.id]
        );

        const prestamos = db.query(
            `SELECT p.*, u.nombre as usuario_nombre 
             FROM prestamos p 
             LEFT JOIN usuarios u ON p.usuario_id = u.id 
             WHERE p.equipo_id = ? 
             ORDER BY p.fecha_prestamo DESC 
             LIMIT 5`,
            [req.params.id]
        );

        return res.json({
            success: true,
            equipo,
            historial,
            ultimos_prestamos: prestamos
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error al obtener equipo.', error: err.message });
    }
});

/**
 * POST /api/equipos
 * Crear nuevo equipo (Solo ADMIN o ENCARGADO)
 */
router.post('/', verifyToken, requireRole(['ADMIN', 'ENCARGADO']), (req, res) => {
    try {
        const { codigo, nombre, categoria, marca, modelo, numero_serie, ubicacion, descripcion, especificaciones } = req.body;

        if (!codigo || !nombre || !categoria) {
            return res.status(400).json({
                success: false,
                message: 'Código, nombre y categoría son campos obligatorios.'
            });
        }

        // Verificar código único
        const existing = db.get('SELECT id FROM equipos WHERE UPPER(codigo) = ?', [codigo.trim().toUpperCase()]);
        if (existing) {
            return res.status(400).json({
                success: false,
                message: `El código de equipo "${codigo.trim().toUpperCase()}" ya existe en el sistema.`
            });
        }

        const result = db.run(
            `INSERT INTO equipos (codigo, nombre, categoria, marca, modelo, numero_serie, ubicacion, estado, descripcion, especificaciones)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'DISPONIBLE', ?, ?)`,
            [
                codigo.trim().toUpperCase(),
                nombre.trim(),
                categoria.trim(),
                marca ? marca.trim() : null,
                modelo ? modelo.trim() : null,
                numero_serie ? numero_serie.trim() : null,
                ubicacion ? ubicacion.trim() : 'Laboratorio Principal // Bahía 01',
                descripcion ? descripcion.trim() : null,
                especificaciones ? especificaciones.trim() : null
            ]
        );

        const nuevoEquipoId = Number(result.lastInsertRowid);

        // Registrar en historial
        db.run(
            `INSERT INTO historial_estados (equipo_id, estado_anterior, estado_nuevo, motivo, usuario_id)
             VALUES (?, NULL, 'DISPONIBLE', 'Alta de nuevo equipo en el catálogo', ?)`,
            [nuevoEquipoId, req.user.id]
        );

        const nuevoEquipo = db.get('SELECT * FROM equipos WHERE id = ?', [nuevoEquipoId]);

        return res.status(201).json({
            success: true,
            message: 'Equipo incorporado exitosamente al inventario.',
            equipo: nuevoEquipo
        });
    } catch (err) {
        console.error('[EQUIPOS CREATE ERROR]:', err);
        return res.status(500).json({ success: false, message: 'Error al crear equipo.', error: err.message });
    }
});

/**
 * PUT /api/equipos/:id
 * Modificar información de un equipo existente (Solo ADMIN o ENCARGADO)
 */
router.put('/:id', verifyToken, requireRole(['ADMIN', 'ENCARGADO']), (req, res) => {
    try {
        const equipo = db.get('SELECT * FROM equipos WHERE id = ?', [req.params.id]);
        if (!equipo) {
            return res.status(404).json({ success: false, message: 'Equipo no encontrado.' });
        }

        const { nombre, categoria, marca, modelo, numero_serie, ubicacion, descripcion, especificaciones } = req.body;

        db.run(
            `UPDATE equipos 
             SET nombre = ?, categoria = ?, marca = ?, modelo = ?, numero_serie = ?, ubicacion = ?, descripcion = ?, especificaciones = ?, actualizado_en = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
                nombre ? nombre.trim() : equipo.nombre,
                categoria ? categoria.trim() : equipo.categoria,
                marca !== undefined ? marca : equipo.marca,
                modelo !== undefined ? modelo : equipo.modelo,
                numero_serie !== undefined ? numero_serie : equipo.numero_serie,
                ubicacion !== undefined ? ubicacion : equipo.ubicacion,
                descripcion !== undefined ? descripcion : equipo.descripcion,
                especificaciones !== undefined ? especificaciones : equipo.especificaciones,
                req.params.id
            ]
        );

        const updated = db.get('SELECT * FROM equipos WHERE id = ?', [req.params.id]);

        return res.json({
            success: true,
            message: 'Información del equipo actualizada correctamente.',
            equipo: updated
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error al actualizar equipo.', error: err.message });
    }
});

/**
 * PATCH /api/equipos/:id/estado
 * Cambiar manualmente el estado del equipo (e.g. Mantenimiento, Disponible, Dañado)
 * Solo ADMIN o ENCARGADO
 */
router.patch('/:id/estado', verifyToken, requireRole(['ADMIN', 'ENCARGADO']), (req, res) => {
    try {
        const { nuevo_estado, motivo } = req.body;
        const validEstados = ['DISPONIBLE', 'EN_MANTENIMIENTO', 'DANADO', 'DE_BAJA'];

        if (!validEstados.includes((nuevo_estado || '').toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: `Estado no válido. Opciones permitidas: ${validEstados.join(', ')}.`
            });
        }

        const equipo = db.get('SELECT * FROM equipos WHERE id = ?', [req.params.id]);
        if (!equipo) {
            return res.status(404).json({ success: false, message: 'Equipo no encontrado.' });
        }

        if (equipo.estado === 'PRESTADO') {
            return res.status(400).json({
                success: false,
                message: 'No puede alterar directamente el estado de un equipo PRESTADO. Debe registrarse la devolución en el módulo de Préstamos.'
            });
        }

        const estadoTarget = nuevo_estado.toUpperCase();
        const estadoAnterior = equipo.estado;

        db.transaction(() => {
            db.run('UPDATE equipos SET estado = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?', [estadoTarget, req.params.id]);
            db.run(
                `INSERT INTO historial_estados (equipo_id, estado_anterior, estado_nuevo, motivo, usuario_id)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    req.params.id,
                    estadoAnterior,
                    estadoTarget,
                    motivo || `Cambio de estado administrativo a ${estadoTarget}`,
                    req.user.id
                ]
            );
        });

        const updated = db.get('SELECT * FROM equipos WHERE id = ?', [req.params.id]);

        return res.json({
            success: true,
            message: `Estado del equipo actualizado a ${estadoTarget}.`,
            equipo: updated
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error al modificar estado.', error: err.message });
    }
});

/**
 * DELETE /api/equipos/:id
 * Eliminar equipo del inventario (Solo ADMIN)
 */
router.delete('/:id', verifyToken, requireRole(['ADMIN']), (req, res) => {
    try {
        const equipo = db.get('SELECT * FROM equipos WHERE id = ?', [req.params.id]);
        if (!equipo) {
            return res.status(404).json({ success: false, message: 'Equipo no encontrado.' });
        }

        // Validar que no tenga préstamos activos
        const prestamoActivo = db.get(
            "SELECT id FROM prestamos WHERE equipo_id = ? AND estado_prestamo = 'ACTIVO'",
            [req.params.id]
        );

        if (prestamoActivo) {
            return res.status(400).json({
                success: false,
                message: 'Operación denegada: El equipo tiene un préstamo ACTIVO vigente. Debe devolverse antes de eliminarlo.'
            });
        }

        db.transaction(() => {
            db.run('DELETE FROM historial_estados WHERE equipo_id = ?', [req.params.id]);
            db.run('DELETE FROM equipos WHERE id = ?', [req.params.id]);
        });

        return res.json({
            success: true,
            message: `El equipo [${equipo.codigo}] ${equipo.nombre} ha sido eliminado del inventario.`
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error al eliminar equipo.', error: err.message });
    }
});

module.exports = router;
