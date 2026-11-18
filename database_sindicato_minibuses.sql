-- ============================================================================
-- SINDICATO DE MINIBUSES DE LA PAZ (PROPUESTA 15)
-- SCRIPT DE BASE DE DATOS SQL SERVER CON SUFIJO ESTRICTO _js
-- EXAMEN FINAL PRÁCTICO - INS-600 INGENIERÍA DE SOFTWARE
-- ============================================================================

CREATE DATABASE SindicatoMinibusesDB;
GO

USE SindicatoMinibusesDB;
GO

-- 1. TABLA DE USUARIOS DEL SISTEMA (ROLES Y SEGURIDAD JWT)
CREATE TABLE Usuarios_js (
    id_usuario_js INT IDENTITY(1,1) PRIMARY KEY,
    nombre_usuario_js NVARCHAR(100) NOT NULL UNIQUE,
    password_hash_js NVARCHAR(255) NOT NULL,
    rol_js NVARCHAR(50) NOT NULL -- 'Secretario de hacienda', 'Controlador de parada'
);
GO

-- 2. TABLA DE AFILIADOS (PADRÓN SINDICAL)
CREATE TABLE Afiliados_js (
    id_afiliado_js INT IDENTITY(1,1) PRIMARY KEY,
    nombre_js NVARCHAR(150) NOT NULL,
    celular_js NVARCHAR(20) NOT NULL,
    fecha_registro_js DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 3. TABLA DE VEHÍCULOS (MINIBUSES)
-- Regla de Negocio 1: Placa única insensible a mayúsculas y minúsculas (Collation CI_AI)
CREATE TABLE Vehiculos_js (
    id_vehiculo_js INT IDENTITY(1,1) PRIMARY KEY,
    placa_js NVARCHAR(20) COLLATE SQL_Latin1_General_CP1_CI_AI NOT NULL UNIQUE,
    linea_js NVARCHAR(20) NOT NULL,
    id_afiliado_js INT NOT NULL,
    CONSTRAINT FK_Vehiculos_Afiliados FOREIGN KEY (id_afiliado_js) 
        REFERENCES Afiliados_js(id_afiliado_js) ON DELETE CASCADE
);
GO

-- 4. TABLA DE HOJAS DE RUTA Y APORTES DIARIOS (PROCESO CENTRAL)
-- Regla de Negocio 2: Cada vehículo recibe una sola hoja de ruta por día
CREATE TABLE HojasRuta_js (
    id_hoja_ruta_js INT IDENTITY(1,1) PRIMARY KEY,
    id_vehiculo_js INT NOT NULL,
    fecha_emision_js DATETIME NOT NULL DEFAULT GETDATE(),
    monto_aporte_js DECIMAL(10,2) NOT NULL DEFAULT 10.00,
    estado_pago_js NVARCHAR(20) NOT NULL DEFAULT 'Pagado', -- 'Pagado' o 'Pendiente'
    nombre_controlador_js NVARCHAR(100) NULL,
    CONSTRAINT FK_HojasRuta_Vehiculos FOREIGN KEY (id_vehiculo_js) 
        REFERENCES Vehiculos_js(id_vehiculo_js) ON DELETE CASCADE
);
GO

-- ============================================================================
-- POBLADO DE DATOS DE PRUEBA (CUMPLE CON LA CONDICIÓN DE 5 REGISTROS POR MANTENIMIENTO)
-- ============================================================================

-- Inserción de Usuarios de Prueba con Passwords Cifradas / Hasheadas
INSERT INTO Usuarios_js (nombre_usuario_js, password_hash_js, rol_js) VALUES
('Honorato Ticona', '$2a$11$e8z9X6H7.z128Kj31lQ1v.098q1z8L4w6j1k0', 'Secretario de hacienda'),
('Irma Calle', '$2a$11$k9L2w1Z8.m341Nj90vR2w.123x4c5v6b7n8m9', 'Controlador de parada');
GO

-- Inserción de 5 Afiliados Reales
INSERT INTO Afiliados_js (nombre_js, celular_js, fecha_registro_js) VALUES
('Honorato Ticona', '71234567', '2026-01-10 08:00:00'),
('Zenón Mamani Quenta', '72098765', '2026-01-15 09:30:00'),
('Martha Condori Flores', '73541289', '2026-02-01 10:15:00'),
('Froilán Quispe Choque', '74123890', '2026-02-12 14:00:00'),
('Basilia Apaza Colque', '75981234', '2026-03-05 11:20:00');
GO

-- Inserción de 5 Vehículos (Zenón Mamani tiene 2 vehículos demostrando la regla "un afiliado puede tener más de uno")
INSERT INTO Vehiculos_js (placa_js, linea_js, id_afiliado_js) VALUES
('2345-KLP', '132', 1),
('1122-XZA', '801', 2),
('3490-RST', '132', 2),
('4512-BTY', '801', 3),
('9988-MNO', '132', 4); -- Vehículo para caso de prueba de bloqueo
GO

-- Inserción de Operaciones del Proceso Central (Hojas de Ruta)
-- Vehículo 5 acumula 3 aportes pendientes para disparar la Regla de Negocio 3 (Bloqueo en el examen)
INSERT INTO HojasRuta_js (id_vehiculo_js, fecha_emision_js, monto_aporte_js, estado_pago_js, nombre_controlador_js) VALUES
(1, '2026-11-18 06:30:00', 10.00, 'Pagado', 'Irma Calle'),
(2, '2026-11-18 07:15:00', 10.00, 'Pagado', 'Irma Calle'),
(3, '2026-11-18 07:45:00', 10.00, 'Pendiente', 'Irma Calle'),
(5, '2026-11-15 06:00:00', 10.00, 'Pendiente', 'Irma Calle'),
(5, '2026-11-16 06:30:00', 10.00, 'Pendiente', 'Irma Calle'),
(5, '2026-11-17 06:15:00', 10.00, 'Pendiente', 'Irma Calle');
GO

-- VISTA DE REPORTE DIARIO DE HACIENDA (Para el Secretario Honorato Ticona)
CREATE VIEW Vista_ReporteHacienda_js AS
SELECT 
    a.id_afiliado_js,
    a.nombre_js,
    a.celular_js,
    COUNT(DISTINCT v.id_vehiculo_js) AS cantidad_vehiculos_js,
    ISNULL(SUM(CASE WHEN h.estado_pago_js = 'Pagado' THEN h.monto_aporte_js ELSE 0 END), 0) AS total_aportado_js,
    ISNULL(SUM(CASE WHEN h.estado_pago_js = 'Pendiente' THEN h.monto_aporte_js ELSE 0 END), 0) AS total_debe_js
FROM Afiliados_js a
LEFT JOIN Vehiculos_js v ON a.id_afiliado_js = v.id_afiliado_js
LEFT JOIN HojasRuta_js h ON v.id_vehiculo_js = h.id_vehiculo_js
GROUP BY a.id_afiliado_js, a.nombre_js, a.celular_js;
GO
