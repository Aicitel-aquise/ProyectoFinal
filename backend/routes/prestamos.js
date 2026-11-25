/**
 * AETHER LAB // Rutas y Motor de Reglas de Negocio para Préstamos y Devoluciones
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');
const { JWT_SECRET, verifyToken, requireRole } = require('../middleware/auth');

/**
 * GET /api/prestamos
 * Listado de préstamos con filtros por estado_prestamo (ACTIVO, DEVUELTO, VENCIDO)
 * Si el usuario es 'USUARIO', ve sus propios préstamos; si es ADMIN/ENCARGADO/OPERADOR, ve todos.
 * Si no hay sesión, permite lectura pública de préstamos activos/generales.
 */
router.get('/', (req, res) => {
    try {
        const { estado, equipo_id } = req.query;
        let currentUser = null;

        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.split(' ')[1];
                currentUser = jwt.verify(token, JWT_SECRET);
            } catch (e) {
                // Token no válido o expirado, continúa como lectura
            }
        }

        const isPrivileged = currentUser && ['ADMIN', 'ENCARGADO', 'OPERADOR'].includes(currentUser.rol);

        let sql = `
            SELECT 
                p.*,
                e.codigo as equipo_codigo,
                e.nombre as equipo_nombre,
                e.categoria as equipo_categoria,
                e.ubicacion as equipo_ubicacion,
                u.email as usuario_email,
                u.cargo as usuario_cargo,
                aut.nombre as autorizado_por_nombre,
                rec.nombre as recibido_por_nombre
            FROM prestamos p
            JOIN equipos e ON p.equipo_id = e.id
            JOIN usuarios u ON p.usuario_id = u.id
            LEFT JOIN usuarios aut ON p.autorizado_por_id = aut.id
            LEFT JOIN usuarios rec ON p.recibido_por_id = rec.id
            WHERE 1=1
        `;
        const params = [];

        // Filtro por usuario solo si está autenticado como USUARIO regular
        if (currentUser && !isPrivileged) {
            sql += ' AND p.usuario_id = ?';
            params.push(currentUser.id);
        }

        if (estado && estado !== 'TODOS') {
            sql += ' AND p.estado_prestamo = ?';
            params.push(estado.toUpperCase());
        }

        if (equipo_id) {
            sql += ' AND p.equipo_id = ?';
            params.push(equipo_id);
        }

        sql += " ORDER BY CASE WHEN p.estado_prestamo = 'ACTIVO' THEN 0 ELSE 1 END, p.fecha_prestamo DESC";

        const prestamos = db.query(sql, params);

        // Calcular bandera dinámica de retraso/vencimiento
        const now = new Date();
        const prestamosCalculados = prestamos.map(p => {
            const limite = new Date(p.fecha_limite);
            const vencido = p.estado_prestamo === 'ACTIVO' && now > limite;
            return {
                ...p,
                es_vencido: vencido,
                tiempo_restante_ms: limite.getTime() - now.getTime()
            };
        });

        return res.json({
            success: true,
            total: prestamosCalculados.length,
            prestamos: prestamosCalculados
        });
    } catch (err) {
        console.error('[PRESTAMOS LIST ERROR]:', err);
        return res.status(500).json({ success: false, message: 'Error al consultar préstamos.', error: err.message });
    }
});

/**
 * POST /api/prestamos
 * Registrar nuevo préstamo de equipo
 * 
 * REGLAS DE NEGOCIO OBLIGATORIAS:
 * 1. El equipo solo puede prestarse si su estado actual es 'DISPONIBLE'.
 * 2. Si está 'PRESTADO', 'EN_MANTENIMIENTO' o 'DANADO', se rechaza con HTTP 400 y mensaje explícito.
 * 3. En caso afirmativo, el equipo pasa automáticamente a 'PRESTADO'.
 * 4. Se genera el registro de auditoría en 'historial_estados'.
 */
router.post('/', verifyToken, (req, res) => {
    try {
        const {
            equipo_id,
            fecha_limite,
            proposito,
            solicitante_nombre,
            solicitante_departamento,
            observaciones_prestamo
        } = req.body;

        if (!equipo_id || !fecha_limite || !proposito) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos obligatorios: Se requiere equipo_id, fecha_limite y proposito.'
            });
        }

        // 1. Validar que el equipo exista
        const equipo = db.get('SELECT * FROM equipos WHERE id = ?', [equipo_id]);
        if (!equipo) {
            return res.status(404).json({
                success: false,
                message: `El equipo con ID ${equipo_id} no existe en el sistema.`
            });
        }

        // 2. REGLA DE NEGOCIO: Solo se puede prestar si el estado actual es 'DISPONIBLE'
        if (equipo.estado !== 'DISPONIBLE') {
            let razonDetallada = '';
            switch (equipo.estado) {
                case 'PRESTADO':
                    razonDetallada = 'El equipo ya se encuentra actualmente en calidad de PRESTADO a otro operador.';
                    break;
                case 'EN_MANTENIMIENTO':
                    razonDetallada = 'El equipo se encuentra EN MANTENIMIENTO técnico preventivo o correctivo.';
                    break;
                case 'DANADO':
                    razonDetallada = 'El equipo está clasificado como DAÑADO e inoperativo para su uso.';
                    break;
                case 'DE_BAJA':
                    razonDetallada = 'El equipo ha sido dado de baja definitivamente.';
                    break;
                default:
                    razonDetallada = `El equipo se encuentra en estado no disponible (${equipo.estado}).`;
            }

            return res.status(400).json({
                success: false,
                message: `TRANSACCIÓN DENEGADA: El equipo "${equipo.nombre}" [${equipo.codigo}] no puede prestarse. Motivo: ${razonDetallada}`,
                estado_actual: equipo.estado
            });
        }

        // 3. Validar fecha límite
        const fechaLimiteDate = new Date(fecha_limite);
        if (isNaN(fechaLimiteDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'La fecha límite de devolución especificada tiene un formato inválido.'
            });
        }

        if (fechaLimiteDate <= new Date()) {
            return res.status(400).json({
                success: false,
                message: 'La fecha límite de devolución debe ser posterior al momento actual.'
            });
        }

        // 4. Determinar solicitante y responsable
        const nombreFinal = (solicitante_nombre && solicitante_nombre.trim()) 
            ? solicitante_nombre.trim() 
            : req.user.nombre;
        const deptoFinal = (solicitante_departamento && solicitante_departamento.trim()) 
            ? solicitante_departamento.trim() 
            : (req.user.departamento || 'División I+D & Prototipado');

        // Código de seguimiento de préstamo (e.g., PR-2026-XXXX)
        const codigoPrestamo = `PR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        let nuevoPrestamoId;

        // 5. Ejecutar la operación atómica (Transacción ACID)
        db.transaction(() => {
            // A. Insertar el registro de préstamo
            const prestamoResult = db.run(
                `INSERT INTO prestamos (
                    codigo_prestamo, equipo_id, usuario_id, solicitante_nombre, solicitante_departamento,
                    proposito, fecha_prestamo, fecha_limite, estado_prestamo, condicion_entrega,
                    observaciones_prestamo, autorizado_por_id
                ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, 'ACTIVO', 'OPERATIVO', ?, ?)`,
                [
                    codigoPrestamo,
                    equipo.id,
                    req.user.id,
                    nombreFinal,
                    deptoFinal,
                    proposito.trim(),
                    fechaLimiteDate.toISOString().replace('T', ' ').substring(0, 19),
                    observaciones_prestamo ? observaciones_prestamo.trim() : null,
                    req.user.id
                ]
            );

            nuevoPrestamoId = Number(prestamoResult.lastInsertRowid);

            // B. Actualizar el estado del equipo a 'PRESTADO' automáticamente
            db.run(
                `UPDATE equipos 
                 SET estado = 'PRESTADO', actualizado_en = CURRENT_TIMESTAMP 
                 WHERE id = ?`,
                [equipo.id]
            );

            // C. Registrar en historial de trazabilidad
            db.run(
                `INSERT INTO historial_estados (equipo_id, estado_anterior, estado_nuevo, motivo, usuario_id)
                 VALUES (?, 'DISPONIBLE', 'PRESTADO', ?, ?)`,
                [
                    equipo.id,
                    `Préstamo asignado a ${nombreFinal} [Cod: ${codigoPrestamo}]: ${proposito.trim().substring(0, 80)}`,
                    req.user.id
                ]
            );
        });

        // 6. Consultar y retornar el préstamo completo generado
        const prestamoCreado = db.get(
            `SELECT p.*, e.codigo as equipo_codigo, e.nombre as equipo_nombre 
             FROM prestamos p 
             JOIN equipos e ON p.equipo_id = e.id 
             WHERE p.id = ?`,
            [nuevoPrestamoId]
        );

        return res.status(201).json({
            success: true,
            message: `Préstamo asignado con éxito. El equipo "${equipo.nombre}" ha pasado a estado PRESTADO.`,
            prestamo: prestamoCreado
        });
    } catch (err) {
        console.error('[PRESTAMO CREATE ERROR]:', err);
        return res.status(500).json({ success: false, message: 'Error interno al registrar préstamo.', error: err.message });
    }
});

/**
 * POST /api/prestamos/:id/devolver
 * Registrar devolución formal de equipo
 * 
 * REGLAS DE NEGOCIO OBLIGATORIAS:
 * 1. Solo se pueden devolver préstamos con estado 'ACTIVO'.
 * 2. Se exige la condición física/técnica del equipo devuelto:
 *    - 'OPERATIVO' -> El equipo pasa inmediatamente a 'DISPONIBLE'.
 *    - 'CON_OBSERVACION' -> El equipo pasa a 'EN_MANTENIMIENTO' (bloqueado para préstamos).
 *    - 'DANADO' -> El equipo pasa a 'DANADO' (bloqueado para préstamos).
 * 3. Se registra fecha real de devolución y observaciones técnicas de retorno.
 * 4. Solo un Administrador/Encargado puede posteriormente rehabilitar un equipo en mantenimiento o dañado.
 */
router.post('/:id/devolver', verifyToken, (req, res) => {
    try {
        const prestamoId = req.params.id;
        const { condicion_devolucion = 'OPERATIVO', observaciones_devolucion } = req.body;

        // Validar condición de retorno
        const validCondiciones = ['OPERATIVO', 'CON_OBSERVACION', 'DANADO'];
        const condicionUpper = (condicion_devolucion || '').toUpperCase();

        if (!validCondiciones.includes(condicionUpper)) {
            return res.status(400).json({
                success: false,
                message: `Condición de devolución no permitida. Opciones válidas: ${validCondiciones.join(', ')}.`
            });
        }

        // Obtener el préstamo
        const prestamo = db.get('SELECT * FROM prestamos WHERE id = ?', [prestamoId]);
        if (!prestamo) {
            return res.status(404).json({ success: false, message: 'Registro de préstamo no encontrado.' });
        }

        if (prestamo.estado_prestamo !== 'ACTIVO') {
            return res.status(400).json({
                success: false,
                message: `El préstamo ya fue cerrado anteriormente en fecha: ${prestamo.fecha_devolucion || 'Registrada'}.`
            });
        }

        const equipo = db.get('SELECT * FROM equipos WHERE id = ?', [prestamo.equipo_id]);
        if (!equipo) {
            return res.status(404).json({ success: false, message: 'El equipo asociado al préstamo no existe.' });
        }

        // Determinar el nuevo estado del equipo según la regla de negocio
        let nuevoEstadoEquipo;
        let motivoHistorial;

        if (condicionUpper === 'OPERATIVO') {
            nuevoEstadoEquipo = 'DISPONIBLE';
            motivoHistorial = `Devolución exitosa en estado OPERATIVO. Retorna a catálogo disponible.`;
        } else if (condicionUpper === 'CON_OBSERVACION') {
            nuevoEstadoEquipo = 'EN_MANTENIMIENTO';
            motivoHistorial = `Devolución con observaciones técnicas. Bloqueado en MANTENIMIENTO: ${observaciones_devolucion || 'Inspección requerida'}`;
        } else if (condicionUpper === 'DANADO') {
            nuevoEstadoEquipo = 'DANADO';
            motivoHistorial = `Devolución con avería/daño reportado. Bloqueado en DAÑADO: ${observaciones_devolucion || 'Daño crítico reportado'}`;
        }

        // Ejecutar transacción
        db.transaction(() => {
            // A. Cerrar el préstamo
            db.run(
                `UPDATE prestamos 
                 SET estado_prestamo = 'DEVUELTO',
                     fecha_devolucion = CURRENT_TIMESTAMP,
                     condicion_devolucion = ?,
                     observaciones_devolucion = ?,
                     recibido_por_id = ?
                 WHERE id = ?`,
                [
                    condicionUpper,
                    observaciones_devolucion ? observaciones_devolucion.trim() : null,
                    req.user.id,
                    prestamoId
                ]
            );

            // B. Actualizar estado del equipo
            db.run(
                `UPDATE equipos 
                 SET estado = ?, actualizado_en = CURRENT_TIMESTAMP 
                 WHERE id = ?`,
                [nuevoEstadoEquipo, equipo.id]
            );

            // C. Registrar historial de trazabilidad
            db.run(
                `INSERT INTO historial_estados (equipo_id, estado_anterior, estado_nuevo, motivo, usuario_id)
                 VALUES (?, 'PRESTADO', ?, ?, ?)`,
                [
                    equipo.id,
                    nuevoEstadoEquipo,
                    motivoHistorial,
                    req.user.id
                ]
            );
        });

        const prestamoActualizado = db.get(
            `SELECT p.*, e.codigo as equipo_codigo, e.nombre as equipo_nombre 
             FROM prestamos p 
             JOIN equipos e ON p.equipo_id = e.id 
             WHERE p.id = ?`,
            [prestamoId]
        );

        return res.json({
            success: true,
            message: `Devolución procesada con éxito. El equipo "${equipo.nombre}" quedó en estado: ${nuevoEstadoEquipo}.`,
            nuevo_estado_equipo: nuevoEstadoEquipo,
            prestamo: prestamoActualizado
        });
    } catch (err) {
        console.error('[DEVOLUCION ERROR]:', err);
        return res.status(500).json({ success: false, message: 'Error interno al procesar devolución.', error: err.message });
    }
});

module.exports = router;
