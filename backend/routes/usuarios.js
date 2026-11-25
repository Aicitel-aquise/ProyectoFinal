/**
 * AETHER LAB // Rutas de Gestión de Usuarios y Roles
 */

const express = require('express');
const router = express.Router();
const db = require('../database');
const { verifyToken, requireRole } = require('../middleware/auth');

/**
 * GET /api/usuarios
 * Listado de usuarios registrados (Solo ADMIN o ENCARGADO)
 */
router.get('/', verifyToken, requireRole(['ADMIN', 'ENCARGADO']), (req, res) => {
    try {
        const usuarios = db.query(
            `SELECT id, nombre, email, rol, cargo, departamento, activo, creado_en 
             FROM usuarios 
             ORDER BY id ASC`
        );

        return res.json({
            success: true,
            total: usuarios.length,
            usuarios
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error al listar usuarios.', error: err.message });
    }
});

/**
 * PATCH /api/usuarios/:id/rol
 * Cambiar rol o estado activo de un usuario (Solo ADMIN)
 */
router.patch('/:id/rol', verifyToken, requireRole(['ADMIN']), (req, res) => {
    try {
        const { rol, activo } = req.body;
        const targetUserId = req.params.id;

        const targetUser = db.get('SELECT * FROM usuarios WHERE id = ?', [targetUserId]);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }

        // Evitar que el admin se desactive o se quite el rol a sí mismo
        if (Number(targetUserId) === Number(req.user.id) && (activo === 0 || (rol && rol !== 'ADMIN'))) {
            return res.status(400).json({
                success: false,
                message: 'No puedes desactivar ni revocar privilegios a tu propia cuenta de Administrador.'
            });
        }

        const validRoles = ['ADMIN', 'ENCARGADO', 'OPERADOR', 'USUARIO'];
        const nuevoRol = (rol && validRoles.includes(rol.toUpperCase())) ? rol.toUpperCase() : targetUser.rol;
        const nuevoActivo = activo !== undefined ? (activo ? 1 : 0) : targetUser.activo;

        db.run(
            'UPDATE usuarios SET rol = ?, activo = ? WHERE id = ?',
            [nuevoRol, nuevoActivo, targetUserId]
        );

        const updated = db.get('SELECT id, nombre, email, rol, cargo, departamento, activo FROM usuarios WHERE id = ?', [targetUserId]);

        return res.json({
            success: true,
            message: `Usuario ${updated.nombre} actualizado a rol: ${nuevoRol}.`,
            usuario: updated
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error al actualizar usuario.', error: err.message });
    }
});

module.exports = router;
