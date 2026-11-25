/**
 * AETHER LAB // Rutas de Autenticación y Perfil
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { JWT_SECRET, verifyToken } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * Iniciar sesión con email y contraseña (validada contra hash bcrypt)
 */
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar tanto el correo electrónico como la contraseña.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = db.get('SELECT * FROM usuarios WHERE LOWER(email) = ?', [normalizedEmail]);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas: No se encontró ningún operador con este correo.'
            });
        }

        if (!user.activo) {
            return res.status(403).json({
                success: false,
                message: 'Cuenta deshabilitada. Contacte con la Dirección del Laboratorio.'
            });
        }

        const isMatch = bcrypt.compareSync(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas: Contraseña incorrecta.'
            });
        }

        // Generar JWT válido por 24 horas
        const payload = {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol,
            cargo: user.cargo,
            departamento: user.departamento
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

        return res.json({
            success: true,
            message: `Bienvenido al Centro de Control AETHER, ${user.nombre}`,
            token,
            user: payload
        });
    } catch (err) {
        console.error('[AUTH ERROR]:', err);
        return res.status(500).json({
            success: false,
            message: 'Error interno en el servidor al autenticar.',
            error: err.message
        });
    }
});

/**
 * POST /api/auth/register
 * Registrar nuevo usuario con contraseña cifrada con bcrypt
 */
router.post('/register', (req, res) => {
    try {
        const { nombre, email, password, rol = 'USUARIO', cargo, departamento } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, email y contraseña son campos obligatorios.'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe contener al menos 6 caracteres por seguridad.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Verificar unicidad de email
        const existing = db.get('SELECT id FROM usuarios WHERE LOWER(email) = ?', [normalizedEmail]);
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'El correo electrónico ya se encuentra registrado en el sistema.'
            });
        }

        // Cifrar con bcrypt
        const salt = bcrypt.genSaltSync(10);
        const passwordHash = bcrypt.hashSync(password, salt);

        const safeRol = ['ADMIN', 'ENCARGADO', 'OPERADOR', 'USUARIO'].includes((rol || '').toUpperCase())
            ? rol.toUpperCase()
            : 'USUARIO';

        const result = db.run(
            `INSERT INTO usuarios (nombre, email, password_hash, rol, cargo, departamento, activo)
             VALUES (?, ?, ?, ?, ?, ?, 1)`,
            [
                nombre.trim(),
                normalizedEmail,
                passwordHash,
                safeRol,
                cargo || 'Investigador / Operador',
                departamento || 'División I+D & Prototipado'
            ]
        );

        const newUser = {
            id: Number(result.lastInsertRowid),
            nombre: nombre.trim(),
            email: normalizedEmail,
            rol: safeRol,
            cargo: cargo || 'Investigador / Operador',
            departamento: departamento || 'División I+D & Prototipado'
        };

        const token = jwt.sign(newUser, JWT_SECRET, { expiresIn: '24h' });

        return res.status(201).json({
            success: true,
            message: 'Registro completado exitosamente. Credenciales encriptadas con bcrypt.',
            token,
            user: newUser
        });
    } catch (err) {
        console.error('[REGISTER ERROR]:', err);
        return res.status(500).json({
            success: false,
            message: 'Error al registrar usuario.',
            error: err.message
        });
    }
});

/**
 * GET /api/auth/me
 * Obtener datos del usuario autenticado actual a partir del token
 */
router.get('/me', verifyToken, (req, res) => {
    try {
        const user = db.get(
            'SELECT id, nombre, email, rol, cargo, departamento, activo, creado_en FROM usuarios WHERE id = ?',
            [req.user.id]
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }

        return res.json({ success: true, user });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
