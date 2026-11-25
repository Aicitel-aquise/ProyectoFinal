-- ============================================================================
-- AETHER LAB // SISTEMA DE CONTROL DE PRÉSTAMOS DE EQUIPOS Y HERRAMIENTAS
-- SCRIPT ÚNICO DE BASE DE DATOS PARA MICROSOFT SQL SERVER (LETICIA\SQLEXPRESS)
-- Compatible con SQL Server 2016, 2019, 2022 y SQL Server Management Studio (SSMS)
-- ============================================================================

-- 1. CREACIÓN O CONEXIÓN A LA BASE DE DATOS
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'AetherLab')
BEGIN
    PRINT 'Creando base de datos AetherLab...';
    CREATE DATABASE AetherLab;
END
GO

USE AetherLab;
GO

PRINT 'Conectado a la base de datos AetherLab en ' + @@SERVERNAME;
GO

-- 2. ELIMINACIÓN DE TABLAS PREVIAS (ORDEN DE DEPENDENCIAS DE LLAVES FORÁNEAS)
IF OBJECT_ID(N'dbo.historial_estados', N'U') IS NOT NULL DROP TABLE dbo.historial_estados;
IF OBJECT_ID(N'dbo.prestamos', N'U') IS NOT NULL DROP TABLE dbo.prestamos;
IF OBJECT_ID(N'dbo.equipos', N'U') IS NOT NULL DROP TABLE dbo.equipos;
IF OBJECT_ID(N'dbo.usuarios', N'U') IS NOT NULL DROP TABLE dbo.usuarios;
GO

-- 3. CREACIÓN DE TABLAS NORMALIZADAS

-- TABLA: usuarios
-- Almacena credenciales criptográficas cifradas con bcrypt (cost 10) y roles
CREATE TABLE dbo.usuarios (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_usuarios PRIMARY KEY,
    nombre NVARCHAR(120) NOT NULL,
    email NVARCHAR(150) NOT NULL CONSTRAINT UQ_usuarios_email UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol NVARCHAR(20) NOT NULL CONSTRAINT CK_usuarios_rol CHECK (rol IN ('ADMIN', 'ENCARGADO', 'OPERADOR', 'USUARIO')),
    cargo NVARCHAR(120) DEFAULT N'Investigador / Operador',
    departamento NVARCHAR(120) DEFAULT N'División I+D & Prototipado',
    activo BIT NOT NULL DEFAULT 1,
    creado_en DATETIME2(0) NOT NULL DEFAULT SYSDATETIME()
);
GO

CREATE NONCLUSTERED INDEX IX_usuarios_email ON dbo.usuarios(email);
CREATE NONCLUSTERED INDEX IX_usuarios_rol ON dbo.usuarios(rol);
GO

-- TABLA: equipos
-- Catálogo de instrumental, herramientas y dispositivos de laboratorio
CREATE TABLE dbo.equipos (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_equipos PRIMARY KEY,
    codigo NVARCHAR(50) NOT NULL CONSTRAINT UQ_equipos_codigo UNIQUE,
    nombre NVARCHAR(160) NOT NULL,
    categoria NVARCHAR(60) NOT NULL,
    marca NVARCHAR(80) NULL,
    modelo NVARCHAR(80) NULL,
    numero_serie NVARCHAR(100) NULL,
    ubicacion NVARCHAR(120) DEFAULT N'Laboratorio Alfa - Bahía 01',
    estado NVARCHAR(30) NOT NULL DEFAULT N'DISPONIBLE' 
        CONSTRAINT CK_equipos_estado CHECK (estado IN ('DISPONIBLE', 'PRESTADO', 'EN_MANTENIMIENTO', 'DANADO', 'DE_BAJA')),
    descripcion NVARCHAR(MAX) NULL,
    especificaciones NVARCHAR(MAX) NULL,
    imagen_url NVARCHAR(255) NULL,
    creado_en DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    actualizado_en DATETIME2(0) NOT NULL DEFAULT SYSDATETIME()
);
GO

CREATE NONCLUSTERED INDEX IX_equipos_codigo ON dbo.equipos(codigo);
CREATE NONCLUSTERED INDEX IX_equipos_estado ON dbo.equipos(estado);
CREATE NONCLUSTERED INDEX IX_equipos_categoria ON dbo.equipos(categoria);
GO

-- TABLA: prestamos
-- Registro transaccional de préstamos, entregas, plazos y devoluciones
CREATE TABLE dbo.prestamos (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_prestamos PRIMARY KEY,
    codigo_prestamo NVARCHAR(40) NOT NULL CONSTRAINT UQ_prestamos_codigo UNIQUE,
    equipo_id INT NOT NULL CONSTRAINT FK_prestamos_equipos FOREIGN KEY REFERENCES dbo.equipos(id),
    usuario_id INT NOT NULL CONSTRAINT FK_prestamos_usuarios FOREIGN KEY REFERENCES dbo.usuarios(id),
    solicitante_nombre NVARCHAR(120) NOT NULL,
    solicitante_departamento NVARCHAR(120) DEFAULT N'División I+D & Prototipado',
    proposito NVARCHAR(MAX) NOT NULL,
    fecha_prestamo DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    fecha_limite DATETIME2(0) NOT NULL,
    fecha_devolucion DATETIME2(0) NULL,
    estado_prestamo NVARCHAR(20) NOT NULL DEFAULT N'ACTIVO' 
        CONSTRAINT CK_prestamos_estado CHECK (estado_prestamo IN ('ACTIVO', 'DEVUELTO', 'VENCIDO')),
    condicion_entrega NVARCHAR(50) NOT NULL DEFAULT N'OPERATIVO',
    condicion_devolucion NVARCHAR(50) NULL 
        CONSTRAINT CK_prestamos_condicion_devolucion CHECK (condicion_devolucion IS NULL OR condicion_devolucion IN ('OPERATIVO', 'CON_OBSERVACION', 'DANADO')),
    observaciones_prestamo NVARCHAR(MAX) NULL,
    observaciones_devolucion NVARCHAR(MAX) NULL,
    autorizado_por_id INT NULL CONSTRAINT FK_prestamos_autorizado FOREIGN KEY REFERENCES dbo.usuarios(id),
    recibido_por_id INT NULL CONSTRAINT FK_prestamos_recibido FOREIGN KEY REFERENCES dbo.usuarios(id)
);
GO

CREATE NONCLUSTERED INDEX IX_prestamos_equipo ON dbo.prestamos(equipo_id);
CREATE NONCLUSTERED INDEX IX_prestamos_usuario ON dbo.prestamos(usuario_id);
CREATE NONCLUSTERED INDEX IX_prestamos_estado ON dbo.prestamos(estado_prestamo);
GO

-- TABLA: historial_estados
-- Trazabilidad y pista de auditoría técnica ante cambios de estado
CREATE TABLE dbo.historial_estados (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_historial_estados PRIMARY KEY,
    equipo_id INT NOT NULL CONSTRAINT FK_historial_equipos FOREIGN KEY REFERENCES dbo.equipos(id) ON DELETE CASCADE,
    estado_anterior NVARCHAR(30) NULL,
    estado_nuevo NVARCHAR(30) NOT NULL,
    motivo NVARCHAR(255) NOT NULL,
    usuario_id INT NULL CONSTRAINT FK_historial_usuarios FOREIGN KEY REFERENCES dbo.usuarios(id) ON DELETE SET NULL,
    fecha DATETIME2(0) NOT NULL DEFAULT SYSDATETIME()
);
GO

CREATE NONCLUSTERED INDEX IX_historial_equipo ON dbo.historial_estados(equipo_id);
GO

-- 4. INSERCIÓN DE DATOS SEMILLA (USUARIOS, EQUIPOS, HISTORIAL Y PRÉSTAMOS)

-- A. Usuarios (Contraseñas con bcrypt salt factor 10)
-- admin@aetherlab.io        -> Admin123!
-- encargado@aetherlab.io    -> Encargado123!
-- operador@aetherlab.io     -> Operador123!
-- investigador@aetherlab.io -> Usuario123!
SET IDENTITY_INSERT dbo.usuarios ON;
INSERT INTO dbo.usuarios (id, nombre, email, password_hash, rol, cargo, departamento, activo) VALUES
(1, N'Dra. Elena Vasquez', N'admin@aetherlab.io', '$2a$10$IHsadEENmdpptod8Y5aUr.zWe38fQ/aKUoNJ3XEwhASw1/NHNROcK', N'ADMIN', N'Directora de Laboratorio / SuperAdmin', N'Dirección I+D', 1),
(2, N'Ing. Marco Altamirano', N'encargado@aetherlab.io', '$2a$10$I3Ciz23mrlMQMJvN8p7r.uCpBzTSNZo9AhYfTnNSMXRKuUFv5HC9a', N'ENCARGADO', N'Jefe de Taller & Calibración', N'Ingeniería de Hardware', 1),
(3, N'Téc. Carlos Mendoza', N'operador@aetherlab.io', '$2a$10$LzDL4.Rd.vdG.auPPG56suUYXLpzXb8EbolL31RJBP1U9j9mf6hdW', N'OPERADOR', N'Operador de Pruebas Electrónicas', N'Sistemas Embebidos', 1),
(4, N'Ing. Sofia Ramirez', N'investigador@aetherlab.io', '$2a$10$UNOVNsXFXJd9raS6bsfKde7/sC7BAwbnif56VIAmQYY69tefHZSxC', N'USUARIO', N'Investigadora en Robótica y Drones', N'División Robótica Avanzada', 1);
SET IDENTITY_INSERT dbo.usuarios OFF;
GO

-- B. Equipos e Instrumental de Alta Precisión
SET IDENTITY_INSERT dbo.equipos ON;
INSERT INTO dbo.equipos (id, codigo, nombre, categoria, marca, modelo, numero_serie, ubicacion, estado, descripcion, especificaciones) VALUES
(1, N'EQ-OSC-01', N'Osciloscopio Digital de Fósforo 4CH 200MHz', N'Osciloscopios', N'Tektronix', N'DPO2024B', N'TKX-882910-B', N'Lab Alfa // Bahía 01 - Banco A', N'DISPONIBLE', N'Osciloscopio para análisis de señales mixtas, decodificación de buses I2C, SPI y UART.', N'4 Canales, 200 MHz, 1 GS/s por canal, Pantalla 7" TFT'),
(2, N'EQ-PWR-01', N'Fuente de Alimentación Programable Triple DC', N'Fuentes de Poder', N'Rigol', N'DP832', N'RIG-994012-P', N'Lab Alfa // Bahía 02 - Banco B', N'PRESTADO', N'Fuente lineal regulada de bajo rizado para prototipado con microcontroladores.', N'3 Canales (30V/3A, 30V/3A, 5V/3A), 195W total, Resolución 1mV/1mA'),
(3, N'EQ-GEN-01', N'Generador de Formas de Onda Arbitrarias', N'Generadores', N'Siglent', N'SDG1032X', N'SIG-551022-X', N'Lab Alfa // Bahía 01 - Banco C', N'DISPONIBLE', N'Generador de funciones y señales arbitrarias de doble canal con tecnología TrueArb.', N'30 MHz de ancho de banda, 150 MSa/s, resolución vertical 14 bits'),
(4, N'EQ-SLD-01', N'Estación de Soldadura de Precisión Hakko', N'Soldadura', N'Hakko', N'FX-951', N'HAK-772911-S', N'Taller Prototipado // Mesa 03', N'DISPONIBLE', N'Estación termocontrolada digital para soldadura SMD y microelectrónica de paso fino.', N'Control de temperatura 200°C a 450°C, puntas serie T15, bloqueo con tarjeta'),
(5, N'EQ-DMM-01', N'Multímetro Digital de Banco 6.5 Dígitos', N'Medición', N'Fluke', N'8846A', N'FLK-449102-D', N'Lab Alfa // Bahía 03 - Banco A', N'PRESTADO', N'Multímetro de calibración y laboratorio de alta exactitud con capacidad gráfica.', N'6.5 Dígitos, 0.0024% precisión DC básica, interfaz LAN/GPIB, medición de temperatura'),
(6, N'EQ-LOG-01', N'Analizador Lógico USB 16 Canales', N'Analizadores', N'Saleae', N'Logic Pro 16', N'SAL-339100-L', N'Gabinete Blindado // Cajón 02', N'DISPONIBLE', N'Analizador lógico y osciloscopio analógico USB para captura de protocolos digitales.', N'16 canales digitales/analógicos, 500 MS/s digital, USB 3.0 super-speed'),
(7, N'EQ-AIR-01', N'Estación de Desoldadura por Aire Caliente', N'Soldadura', N'Quick', N'861DW', N'QCK-662910-W', N'Taller Prototipado // Mesa 04', N'EN_MANTENIMIENTO', N'Sistema de aire caliente para retrabajo de BGA y componentes de montaje superficial.', N'1000W de potencia, flujo hasta 120 L/min, perfiles CH1/CH2/CH3 programables'),
(8, N'EQ-THM-01', N'Cámara Termográfica Infrarroja Industrial', N'Óptica y Térmica', N'FLIR', N'E8-XT', N'FLR-110293-T', N'Gabinete Óptico // Estante 01', N'DISPONIBLE', N'Cámara térmica para detección de puntos calientes en placas PCB y motores brushless.', N'Resolución térmica 320x240 (76,800 píxeles), rango -20°C a 550°C, tecnología MSX'),
(9, N'EQ-LCR-01', N'Medidor LCR de Precisión para Componentes', N'Medición', N'Keysight', N'E4980AL', N'KEY-902194-M', N'Lab Alfa // Bahía 04 - Banco A', N'DISPONIBLE', N'Medidor de inductancia, capacitancia y resistencia con barrido de frecuencias.', N'Frecuencia de prueba 20 Hz a 1 MHz, precisión básica 0.05%, pantalla gráfica'),
(10, N'EQ-3DP-01', N'Impresora 3D de Resina de Grado Ingeniería', N'Fabricación Digital', N'Formlabs', N'Form 3+', N'FRM-771029-P', N'Sala Fabricación // Cabina B', N'DANADO', N'Impresora estereolitográfica SLA para encapsulados mecánicos de alta fidelidad.', N'Volumen 14.5 x 14.5 x 18.5 cm, tecnología LFS (Low Force Stereolithography), láser 250mW'),
(11, N'EQ-SPEC-01', N'Analizador de Espectro RF en Tiempo Real', N'RF & Microondas', N'Rigol', N'RSA3030N', N'RIG-229103-R', N'Lab RF // Banco Faraday 01', N'DISPONIBLE', N'Analizador de espectro para caracterización de emisiones de radiofrecuencia e interferencias.', N'9 kHz a 3.0 GHz, ancho de banda de tiempo real 40 MHz, generador de seguimiento'),
(12, N'EQ-CAL-01', N'Calibrador de Procesos Documentador de Campo', N'Calibración', N'Fluke', N'754', N'FLK-667721-C', N'Gabinete Blindado // Cajón 01', N'DISPONIBLE', N'Instrumento portátil para calibración de transmisores de presión, RTDs y lazos 4-20mA.', N'Mide y genera voltios, mA, RTD, termopares, soporte para protocolo HART');
SET IDENTITY_INSERT dbo.equipos OFF;
GO

-- C. Historial de Estados
SET IDENTITY_INSERT dbo.historial_estados ON;
INSERT INTO dbo.historial_estados (id, equipo_id, estado_anterior, estado_nuevo, motivo, usuario_id, fecha) VALUES
(1, 2, N'DISPONIBLE', N'PRESTADO', N'Préstamo para pruebas de alimentación en placa controladora de dron', 2, DATEADD(day, -3, SYSDATETIME())),
(2, 5, N'DISPONIBLE', N'PRESTADO', N'Préstamo para calibración de celda de carga de alta precisión', 1, DATEADD(day, -1, SYSDATETIME())),
(3, 7, N'DISPONIBLE', N'EN_MANTENIMIENTO', N'Resistencia cerámica con desgaste. En espera de repuesto oficial', 2, DATEADD(day, -5, SYSDATETIME())),
(4, 10, N'DISPONIBLE', N'DANADO', N'Sensor de nivel óptico de resina bloqueado y bandeja con perforación', 1, DATEADD(day, -7, SYSDATETIME()));
SET IDENTITY_INSERT dbo.historial_estados OFF;
GO

-- D. Préstamos Iniciales (2 Activos y 2 Devueltos)
SET IDENTITY_INSERT dbo.prestamos ON;
INSERT INTO dbo.prestamos (
    id, codigo_prestamo, equipo_id, usuario_id, solicitante_nombre, solicitante_departamento,
    proposito, fecha_prestamo, fecha_limite, fecha_devolucion, estado_prestamo,
    condicion_entrega, condicion_devolucion, observaciones_prestamo, observaciones_devolucion,
    autorizado_por_id, recibido_por_id
) VALUES
(
    1, N'PR-2026-001', 2, 4, N'Ing. Sofia Ramirez', N'División Robótica Avanzada',
    N'Alimentación de banco para pruebas continuas de ESCs y telemetría de dron hexacóptero.',
    DATEADD(day, -3, SYSDATETIME()), DATEADD(day, 2, SYSDATETIME()), NULL, N'ACTIVO',
    N'OPERATIVO', NULL, N'Cables de salida y conector banana a caimán incluidos.', NULL,
    2, NULL
),
(
    2, N'PR-2026-002', 5, 3, N'Téc. Carlos Mendoza', N'Sistemas Embebidos',
    N'Verificación de caída de tensión y ruido térmico en puente de Wheatstone.',
    DATEADD(day, -1, SYSDATETIME()), DATEADD(day, 4, SYSDATETIME()), NULL, N'ACTIVO',
    N'OPERATIVO', NULL, N'Puntas de prueba chapadas en oro y fusible verificado.', NULL,
    1, NULL
),
(
    3, N'PR-2026-003', 1, 4, N'Ing. Sofia Ramirez', N'División Robótica Avanzada',
    N'Depuración de protocolo CAN-Bus y captura de trama de fallo intermitente.',
    DATEADD(day, -10, SYSDATETIME()), DATEADD(day, -6, SYSDATETIME()), DATEADD(day, -6, SYSDATETIME()), N'DEVUELTO',
    N'OPERATIVO', N'OPERATIVO', N'Se entregó con 4 sondas atenuadas 10X.', N'Retornado en perfecto estado con estuche y accesorios completos.',
    2, 2
),
(
    4, N'PR-2026-004', 3, 3, N'Téc. Carlos Mendoza', N'Sistemas Embebidos',
    N'Inyección de señal senoidal de 10kHz en filtro activo pasa-banda.',
    DATEADD(day, -14, SYSDATETIME()), DATEADD(day, -11, SYSDATETIME()), DATEADD(day, -11, SYSDATETIME()), N'DEVUELTO',
    N'OPERATIVO', N'OPERATIVO', N'Cable BNC a BNC incluido.', N'Equipo revisado y funcional.',
    1, 1
);
SET IDENTITY_INSERT dbo.prestamos OFF;
GO

-- 5. VERIFICACIÓN Y ESTADÍSTICAS FINALES
PRINT '------------------------------------------------------------';
PRINT 'BASE DE DATOS [AetherLab] INSTALADA CON ÉXITO EN SQL SERVER';
PRINT '------------------------------------------------------------';
SELECT 'Usuarios Registrados' AS [Entidad], COUNT(*) AS [Total] FROM dbo.usuarios
UNION ALL
SELECT 'Equipos en Catálogo', COUNT(*) FROM dbo.equipos
UNION ALL
SELECT 'Préstamos Registrados', COUNT(*) FROM dbo.prestamos
UNION ALL
SELECT 'Historial de Estados', COUNT(*) FROM dbo.historial_estados;
GO
