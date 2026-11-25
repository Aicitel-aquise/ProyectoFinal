-- ============================================================================
-- AETHER LAB // SISTEMA DE CONTROL DE PRÉSTAMOS DE EQUIPOS Y HERRAMIENTAS
-- ESQUEMA RELACIONAL SQL (Compatible con SQLite / PostgreSQL / SQL Server)
-- ============================================================================

-- 1. TABLA: usuarios
-- Almacena credenciales encriptadas con bcrypt, roles y estado de acceso
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK(rol IN ('ADMIN', 'ENCARGADO', 'OPERADOR', 'USUARIO')),
    cargo VARCHAR(120) DEFAULT 'Investigador / Operador',
    departamento VARCHAR(120) DEFAULT 'División I+D & Prototipado',
    activo INTEGER NOT NULL DEFAULT 1 CHECK(activo IN (0, 1)),
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices de búsqueda para usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);

-- 2. TABLA: equipos
-- Catálogo de instrumental, herramientas y dispositivos de laboratorio
CREATE TABLE IF NOT EXISTS equipos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(160) NOT NULL,
    categoria VARCHAR(60) NOT NULL,
    marca VARCHAR(80),
    modelo VARCHAR(80),
    numero_serie VARCHAR(100),
    ubicacion VARCHAR(120) DEFAULT 'Laboratorio Alfa - Bahía 01',
    estado VARCHAR(30) NOT NULL DEFAULT 'DISPONIBLE' 
        CHECK(estado IN ('DISPONIBLE', 'PRESTADO', 'EN_MANTENIMIENTO', 'DANADO', 'DE_BAJA')),
    descripcion TEXT,
    especificaciones TEXT,
    imagen_url VARCHAR(255),
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices de búsqueda para equipos
CREATE INDEX IF NOT EXISTS idx_equipos_codigo ON equipos(codigo);
CREATE INDEX IF NOT EXISTS idx_equipos_estado ON equipos(estado);
CREATE INDEX IF NOT EXISTS idx_equipos_categoria ON equipos(categoria);

-- 3. TABLA: prestamos
-- Registro transaccional de préstamos, entregas, plazos y devoluciones
CREATE TABLE IF NOT EXISTS prestamos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_prestamo VARCHAR(40) UNIQUE,
    equipo_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    solicitante_nombre VARCHAR(120) NOT NULL,
    solicitante_departamento VARCHAR(120) DEFAULT 'División I+D & Prototipado',
    proposito TEXT NOT NULL,
    fecha_prestamo DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_limite DATETIME NOT NULL,
    fecha_devolucion DATETIME,
    estado_prestamo VARCHAR(20) NOT NULL DEFAULT 'ACTIVO' 
        CHECK(estado_prestamo IN ('ACTIVO', 'DEVUELTO', 'VENCIDO')),
    condicion_entrega VARCHAR(50) NOT NULL DEFAULT 'OPERATIVO',
    condicion_devolucion VARCHAR(50) 
        CHECK(condicion_devolucion IS NULL OR condicion_devolucion IN ('OPERATIVO', 'CON_OBSERVACION', 'DANADO')),
    observaciones_prestamo TEXT,
    observaciones_devolucion TEXT,
    autorizado_por_id INTEGER,
    recibido_por_id INTEGER,
    FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE RESTRICT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    FOREIGN KEY (autorizado_por_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (recibido_por_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Índices de búsqueda y rendimiento para préstamos
CREATE INDEX IF NOT EXISTS idx_prestamos_equipo ON prestamos(equipo_id);
CREATE INDEX IF NOT EXISTS idx_prestamos_usuario ON prestamos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_prestamos_estado ON prestamos(estado_prestamo);
CREATE INDEX IF NOT EXISTS idx_prestamos_fechas ON prestamos(fecha_prestamo, fecha_limite);

-- 4. TABLA: historial_estados (Trazabilidad y Auditoría Técnica)
CREATE TABLE IF NOT EXISTS historial_estados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    equipo_id INTEGER NOT NULL,
    estado_anterior VARCHAR(30),
    estado_nuevo VARCHAR(30) NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    usuario_id INTEGER,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_historial_equipo ON historial_estados(equipo_id);
