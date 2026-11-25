/**
 * AETHER LAB // Middleware de Autenticación y Autorización Basada en Roles (RBAC)
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'AETHER_TACTICAL_ACCESS_KEY_2026_SECRETO_SEGURO_4096_BITS';

/**
 * Verifica el token JWT presente en los encabezados HTTP
 */
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: 'Acceso denegado: Cabecera Authorization no suministrada.'
        });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({
            success: false,
            message: 'Formato de token no válido. Debe ser "Bearer <token>".'
        });
    }

    const token = parts[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Token de acceso inválido, manipulado o expirado.',
            error: err.message
        });
    }
}

/**
 * Middleware para validar que el rol del usuario esté dentro de los roles autorizados
 * @param {Array<string>} allowedRoles
 */
function requireRole(allowedRoles = []) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Autenticación requerida para acceder a este recurso.'
            });
        }

        const userRole = (req.user.rol || '').toUpperCase();
        const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());

        if (!normalizedAllowed.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `Privilegios insuficientes. Rol requerido: [${allowedRoles.join(', ')}]. Tu rol actual es: [${userRole}].`
            });
        }

        next();
    };
}

module.exports = {
    JWT_SECRET,
    verifyToken,
    requireRole
};
